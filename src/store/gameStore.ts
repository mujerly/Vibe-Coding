import { create } from 'zustand'
import type { ActionResult, EndingType, GameState, Gift, GirlRelationship, GirlState, Message, PlayerProfile, WorkSettlement } from './gameTypes'
import { createInitialGirlsState } from '../systems/girls/girlProfiles'
import { jobs } from '../systems/earning/jobs'
import { shopItems } from '../systems/spending/shopData'
import {
  canGirlSendCheckIn,
  clampAffection,
  getDelayedReplyPenalty,
  getGiftPreferenceDelta,
  getGirlReaction,
  getWorkComplaintMessage,
  resolveGirlStatus,
} from '../systems/girls/affectionLogic'
import { generateChatReply } from '../systems/chat/chatEngine'
import { parseGirlReplySegments } from '../systems/chat/stickerProtocol'
import { balance, uiStrings, t } from '../data'
import {
  addGameMinutes,
  createInitialGameTime,
  getGiftSendTimeCost,
  getGirlRoutineStatus,
  getPurchaseTimeCost,
  getWorkActionFocusLoss,
  isWorkRewardLost,
} from '../utils/timeSystem'

interface GameActions {
  sendMessage: (girlId: string, text: string) => Promise<ActionResult>
  sendGiftInChat: (girlId: string, giftId: string) => Promise<ActionResult>
  getChatHistory: (girlId: string) => Message[]
  getUnreadCount: (girlId: string) => number
  markGirlRead: (girlId: string) => void
  buyGift: (giftId: string) => ActionResult
  getInventory: () => Gift[]
  useGift: (giftId: string) => Gift | undefined
  canAfford: (giftId: string) => boolean
  getShopItems: () => Gift[]
  startWork: (jobType: string) => ActionResult
  finishWork: () => number
  applyWorkOutcome: (reward: number, cost?: number) => WorkSettlement | null
  finishWorkWithOutcome: (reward: number, cost?: number) => WorkSettlement | null
  cancelWork: () => void
  isPlayerBusy: () => boolean
  getWorkProgress: () => number
  updateAffection: (girlId: string, change: number, mood?: string) => void
  setPlayerProfile: (profile: Omit<PlayerProfile, 'configured'>) => void
  resetGame: () => void
}

export type GameStore = GameState & GameActions

const createMessage = (
  role: 'player' | 'girl' | 'system',
  content: string,
  giftId?: string,
  timestamp = Date.now(),
  stickerId?: string,
): Message => ({
  id: `${role}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  timestamp,
  giftId,
  stickerId,
})

const trailingReplyPunctuationPattern = /[。！？!?.,，；：~…]+$/u

const normalizeGirlReplyChunk = (content: string) =>
  content.trim().replace(trailingReplyPunctuationPattern, '').trim()

export const createGirlReplyMessages = (reply: string, baseTimestamp: number) => {
  const chunks = reply
    .split(/\s*\/\/\/\s*/g)
    .map(normalizeGirlReplyChunk)
    .filter(Boolean)

  const safeChunks =
    chunks.length > 0
      ? chunks
      : [normalizeGirlReplyChunk(reply) || '嗯']

  return safeChunks.map((chunk, index) =>
    createMessage('girl', chunk, undefined, baseTimestamp + index * 60_000),
  )
}

const applyWorkInterruption = (
  currentJob: GameState['player']['currentJob'],
  minutes: number,
  focusLoss = 0,
) => {
  if (!currentJob) return undefined

  return {
    ...currentJob,
    interruptionMinutes: currentJob.interruptionMinutes + minutes,
    focus:
      currentJob.mode === 'slot'
        ? currentJob.focus
        : Math.max(0, currentJob.focus - focusLoss),
  }
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

const replyTypingMsPerChar = 600
const minimumReplyTypingMs = 800
const stickerTypingUnits = 2

const getReplySegments = (girlId: string, reply: string) => parseGirlReplySegments(girlId, reply)

const getReplySegmentTypingDuration = (
  segment: ReturnType<typeof parseGirlReplySegments>[number],
) => {
  if (segment.stickerId) {
    return Math.max(minimumReplyTypingMs, stickerTypingUnits * replyTypingMsPerChar)
  }

  const visibleLength = segment.content.replace(/\s+/g, '').length
  return Math.max(minimumReplyTypingMs, Math.max(visibleLength, 1) * replyTypingMsPerChar)
}

const waitForFirstReplyTiming = async (
  firstSegment: ReturnType<typeof parseGirlReplySegments>[number],
  requestStartedAt: number,
) => {
  const actualLatency = Date.now() - requestStartedAt
  const simulatedDuration = getReplySegmentTypingDuration(firstSegment)
  const remainingDelay = Math.max(0, simulatedDuration - actualLatency)

  if (remainingDelay > 0) {
    await wait(remainingDelay)
  }
}

const appendBlockNotice = (
  history: Message[],
  girlName: string,
  previousStatus: 'normal' | 'suspicious' | 'angry' | 'blocked',
  nextStatus: 'normal' | 'suspicious' | 'angry' | 'blocked',
) => {
  if (previousStatus === 'blocked' || nextStatus !== 'blocked') {
    return history
  }

  return [...history, createMessage('system', t(uiStrings.system.girlBlockedNotice, { name: girlName }))]
}

const DEATH_NARRATIVES: Record<string, string> = {
  xiaotian_betrayal:
    '小甜把你拉黑的第二天，她父亲的人找上了门。\n\n没有争吵，没有解释的机会。\n\n你永远消失在那个深夜。',
  caught_cheating:
    '纸终究包不住火。\n\n她们互相认识的事你根本不知道。等你意识到的时候，已经太晚了。\n\n游戏结束。',
}

const computeDerivedState = (state: Pick<GameState, 'player' | 'girls'>) => {
  const { scoring, gameOverMessage } = balance
  const girls = Object.values(state.girls)
  const conqueredCount = girls.filter((girl) => girl.affection >= scoring.conqueredThreshold).length
  const blockedCount = girls.filter((girl) => girl.status === 'blocked').length
  const affectionScore = girls.reduce((sum, girl) => sum + girl.affection, 0)
  const score = Math.max(
    0,
    conqueredCount * scoring.conqueredBonus +
      affectionScore * scoring.affectionMultiplier +
      Math.floor(state.player.money / scoring.moneyDivisor) -
      Math.floor(state.player.totalSpent / scoring.spentDivisor) -
      blockedCount * scoring.blockedPenalty,
  )

  // Victory: all girls conquered
  if (conqueredCount === girls.length && girls.length > 0) {
    return { score, gameOver: true, gameOverReason: '你赢了。', endingType: 'victory' as EndingType, endingNarrative: undefined }
  }

  // Death: Xiaotian blocked + another girl at high affection (caught cheating)
  const xiaotian = state.girls['xiaotian']
  const othersHighAffection = girls.filter((g) => g.profile.id !== 'xiaotian' && g.affection >= 55)
  if (xiaotian?.status === 'blocked' && othersHighAffection.length >= 1) {
    return {
      score,
      gameOver: true,
      gameOverReason: '死亡结局',
      endingType: 'death' as EndingType,
      endingNarrative: DEATH_NARRATIVES.xiaotian_betrayal,
    }
  }

  // Death: all three girls learned about each other (caught cheating on all)
  if (blockedCount >= 2 && girls.filter((g) => g.affection <= 10).length >= 2) {
    return {
      score,
      gameOver: true,
      gameOverReason: '死亡结局',
      endingType: 'death' as EndingType,
      endingNarrative: DEATH_NARRATIVES.caught_cheating,
    }
  }

  // Default loss: all blocked
  const gameOver = blockedCount === girls.length
  return {
    score,
    gameOver,
    gameOverReason: gameOver ? gameOverMessage : undefined,
    endingType: (gameOver ? 'all_blocked' : 'playing') as EndingType,
    endingNarrative: undefined,
  }
}

const generateRelationships = (girlIds: string[]): GirlRelationship[] => {
  if (girlIds.length < 2) return []
  const shuffled = [...girlIds].sort(() => Math.random() - 0.5)
  const relationships: GirlRelationship[] = [
    { girl1Id: shuffled[0], girl2Id: shuffled[1], type: 'friends', gossipTriggered: false },
  ]
  if (girlIds.length >= 3) {
    relationships.push({ girl1Id: shuffled[1], girl2Id: shuffled[2], type: 'rivals', gossipTriggered: false })
  }
  return relationships
}

const buildInitialState = (): GameState => {
  const initialGameTime = createInitialGameTime()
  const initialGirls = createInitialGirlsState(initialGameTime)
  const initialRelationships = generateRelationships(Object.keys(initialGirls))

  const initialState: GameState = {
    playerProfile: { configured: false, name: '', gender: 'male' },
    player: {
      money: balance.initialMoney,
      totalSpent: 0,
      totalEarned: 0,
      inventory: [],
      timeStatus: 'idle',
    },
    girls: initialGirls,
    relationships: initialRelationships,
    economy: { shopItems },
    gameTime: initialGameTime,
    score: 0,
    gameOver: false,
    endingType: 'playing',
  }

  return {
    ...initialState,
    ...computeDerivedState(initialState),
  }
}

export const useGameStore = create<GameStore>((set, get) => {
  const settleCurrentWork = (rewardOverride?: number, cost = 0): WorkSettlement | null => {
    const state = get()
    const currentJob = state.player.currentJob

    if (!currentJob) return null

    const reward = isWorkRewardLost(currentJob) ? 0 : rewardOverride ?? currentJob.reward
    const baseWorkMinutes =
      currentJob.trackedTimeMinutes > 0 ? currentJob.trackedTimeMinutes : currentJob.timeCostMinutes
    const penaltyDuration = baseWorkMinutes + currentJob.interruptionMinutes
    const settlementTime =
      currentJob.trackedTimeMinutes > 0
        ? state.gameTime
        : addGameMinutes(state.gameTime, currentJob.timeCostMinutes)

    const nextGirls = Object.fromEntries(
      Object.entries(state.girls).map(([girlId, girl]) => {
        if (girl.status === 'blocked') {
          return [girlId, girl]
        }

        const penalty = getDelayedReplyPenalty(girlId, penaltyDuration, girl.affection)
        const nextAffection = clampAffection(girl.affection - penalty)
        const shouldSendComplaint =
          canGirlSendCheckIn(girlId, girl.affection) && !girl.pendingCheckInReply
        const complaintMessage = shouldSendComplaint
          ? createMessage(
              'girl',
              getWorkComplaintMessage(girlId, girl.chatHistory, girl.lastCheckInTemplate),
              undefined,
              settlementTime,
            )
          : undefined
        const mood = penalty >= 3 ? uiStrings.system.workPenaltyMoodBad : uiStrings.system.workPenaltyMoodMild
        const nextStatus = resolveGirlStatus(nextAffection, mood)
        const nextHistory = appendBlockNotice(
          complaintMessage ? [...girl.chatHistory, complaintMessage] : girl.chatHistory,
          girl.profile.name,
          girl.status,
          nextStatus,
        )
        const messageDelta = nextHistory.length - girl.chatHistory.length
        const lastHistoryMessage = nextHistory[nextHistory.length - 1]

        return [
          girlId,
          {
            ...girl,
            affection: nextAffection,
            mood,
            status: nextStatus,
            unreadCount: girl.unreadCount + messageDelta,
            chatHistory: nextHistory,
            lastContactTime: lastHistoryMessage?.timestamp ?? girl.lastContactTime,
            pendingCheckInReply: complaintMessage ? true : girl.pendingCheckInReply,
            lastCheckInTemplate: complaintMessage?.content ?? girl.lastCheckInTemplate,
          },
        ]
      }),
    )

    const nextPlayer = {
      ...state.player,
      money: state.player.money - cost + reward,
      totalSpent: state.player.totalSpent + cost,
      totalEarned: state.player.totalEarned + Math.max(0, reward),
      timeStatus: 'idle' as const,
      currentJob: undefined,
    }

    set(() => ({
      player: nextPlayer,
      girls: nextGirls,
      gameTime: settlementTime,
      ...computeDerivedState({
        player: nextPlayer,
        girls: nextGirls,
      }),
    }))

    return {
      reward,
      cost,
      net: reward - cost,
    }
  }

  const deliverGirlReplySequence = async (
    girlId: string,
    reply: string,
    requestStartedAt: number,
    firstReplyTimestamp: number,
    finalizeGirl: (
      latestGirl: GirlState,
      lastReplyMessage: Message,
      historyWithReply: Message[],
    ) => GirlState,
  ) => {
    const segments = getReplySegments(girlId, reply)
    const [firstSegment, ...restSegments] = segments
    if (!firstSegment) return null

    await waitForFirstReplyTiming(firstSegment, requestStartedAt)

    const allSegments = [firstSegment, ...restSegments]
    let lastReplyMessage: Message | null = null

    for (const [index, segment] of allSegments.entries()) {
      if (index > 0) {
        await wait(getReplySegmentTypingDuration(segment))
      }

      const replyMessage = createMessage(
        'girl',
        segment.content,
        undefined,
        firstReplyTimestamp + index * 60_000,
        segment.stickerId,
      )

      lastReplyMessage = replyMessage

      set((state) => {
        const latestGirl = state.girls[girlId]
        if (!latestGirl) return state

        const historyWithReply = [...latestGirl.chatHistory, replyMessage]

        if (index < allSegments.length - 1) {
          return {
            girls: {
              ...state.girls,
              [girlId]: {
                ...latestGirl,
                chatHistory: historyWithReply,
                lastContactTime: replyMessage.timestamp,
              },
            },
            gameTime: replyMessage.timestamp,
          }
        }

        const finalizedGirl = finalizeGirl(latestGirl, replyMessage, historyWithReply)
        let nextGirls: typeof state.girls = {
          ...state.girls,
          [girlId]: finalizedGirl,
        }

        // Gossip event: if a friend pair both have affection >= 65, trigger once
        const nextRelationships = state.relationships.map((rel) => {
          if (rel.type !== 'friends' || rel.gossipTriggered) return rel
          const g1 = nextGirls[rel.girl1Id]
          const g2 = nextGirls[rel.girl2Id]
          if (!g1 || !g2 || g1.affection < 65 || g2.affection < 65) return rel

          const gossipMsg = createMessage(
            'system',
            `${g1.profile.name}和${g2.profile.name}好像在聊到你的事情…`,
            undefined,
            replyMessage.timestamp + 120_000,
          )
          const affectDelta = Math.random() > 0.5 ? 2 : -2
          nextGirls = {
            ...nextGirls,
            [rel.girl1Id]: {
              ...nextGirls[rel.girl1Id],
              affection: clampAffection(g1.affection + affectDelta),
              chatHistory: [...nextGirls[rel.girl1Id].chatHistory, gossipMsg],
              unreadCount: nextGirls[rel.girl1Id].unreadCount + 1,
            },
            [rel.girl2Id]: {
              ...nextGirls[rel.girl2Id],
              affection: clampAffection(g2.affection + affectDelta),
              chatHistory: [...nextGirls[rel.girl2Id].chatHistory, gossipMsg],
              unreadCount: nextGirls[rel.girl2Id].unreadCount + 1,
            },
          }
          return { ...rel, gossipTriggered: true }
        })

        return {
          girls: nextGirls,
          relationships: nextRelationships,
          gameTime: replyMessage.timestamp,
          ...computeDerivedState({
            player: state.player,
            girls: nextGirls,
          }),
        }
      })
    }

    return lastReplyMessage
  }

  return {
    ...buildInitialState(),

  getChatHistory: (girlId) => get().girls[girlId]?.chatHistory ?? [],

  getUnreadCount: (girlId) => get().girls[girlId]?.unreadCount ?? 0,

  markGirlRead: (girlId) => {
    set((state) => {
      const girl = state.girls[girlId]
      if (!girl) return state

      return {
        girls: {
          ...state.girls,
          [girlId]: {
            ...girl,
            unreadCount: 0,
          },
        },
      }
    })
  },

  buyGift: (giftId) => {
    const state = get()
    const gift = state.economy.shopItems.find((item) => item.id === giftId)
    const timeCost = getPurchaseTimeCost(giftId)

    if (!gift) return { ok: false, error: uiStrings.errors.giftNotFound }
    if (state.player.money < gift.price) return { ok: false, error: uiStrings.errors.noMoney }

    set((current) => {
      const nextCurrentJob = applyWorkInterruption(
        current.player.currentJob,
        timeCost,
        getWorkActionFocusLoss('shop'),
      )
      const nextPlayer = {
        ...current.player,
        money: current.player.money - gift.price,
        totalSpent: current.player.totalSpent + gift.price,
        inventory: [...current.player.inventory, gift],
        currentJob: nextCurrentJob,
      }

      return {
        player: nextPlayer,
        gameTime: addGameMinutes(current.gameTime, timeCost),
        ...computeDerivedState({
          player: nextPlayer,
          girls: current.girls,
        }),
      }
    })

    return { ok: true }
  },

  getInventory: () => get().player.inventory,

  useGift: (giftId) => {
    const inventory = get().player.inventory
    const giftIndex = inventory.findIndex((item) => item.id === giftId)

    if (giftIndex === -1) return undefined

    const gift = inventory[giftIndex]

    set((state) => {
      const nextInventory = [...state.player.inventory]
      nextInventory.splice(giftIndex, 1)

      return {
        player: {
          ...state.player,
          inventory: nextInventory,
        },
      }
    })

    return gift
  },

  canAfford: (giftId) => {
    const gift = get().economy.shopItems.find((item) => item.id === giftId)
    return gift ? get().player.money >= gift.price : false
  },

  getShopItems: () => get().economy.shopItems,

  startWork: (jobType) => {
    const state = get()

    if (state.player.timeStatus === 'working') {
      return { ok: false, error: uiStrings.errors.alreadyWorking }
    }

    const job = jobs.find((item) => item.id === jobType)
    if (!job) return { ok: false, error: uiStrings.errors.jobNotFound }
    if (job.cost != null && state.player.money < job.cost) {
      return { ok: false, error: t(uiStrings.earning.slotNeedMoney, { cost: job.cost }) }
    }

    const reward =
      job.mode === 'slot'
        ? job.reward
        : job.rewardRange != null
        ? Math.floor(
            Math.random() * (job.rewardRange[1] - job.rewardRange[0] + 1) + job.rewardRange[0],
          )
        : job.reward

    set((current) => ({
      player: {
        ...current.player,
        timeStatus: 'working',
        currentJob: {
          type: job.id,
          duration: job.duration,
          timeCostMinutes: job.timeCostMinutes,
          reward,
          startTime: Date.now(),
          mode: job.mode ?? 'timed',
          completionMode: job.completionMode ?? 'timer',
          trackedDuration: 0,
          trackedTimeMinutes: 0,
          interruptionMinutes: 0,
          sessionSpent: 0,
          sessionEarned: 0,
          spinCount: 0,
          focus: 100,
        },
      },
      gameTime: current.gameTime,
    }))

    return { ok: true }
  },

  finishWork: () => {
    return settleCurrentWork()?.reward ?? 0
  },

  applyWorkOutcome: (reward, cost = 0) => {
    const state = get()
    const currentJob = state.player.currentJob

    if (!currentJob) return null

    const nextCurrentJob = {
      ...currentJob,
      trackedDuration: currentJob.trackedDuration + currentJob.duration,
      trackedTimeMinutes: currentJob.trackedTimeMinutes + currentJob.timeCostMinutes,
      sessionSpent: currentJob.sessionSpent + cost,
      sessionEarned: currentJob.sessionEarned + Math.max(0, reward),
      spinCount: currentJob.spinCount + 1,
    }

    const nextPlayer = {
      ...state.player,
      money: state.player.money - cost + reward,
      totalSpent: state.player.totalSpent + cost,
      totalEarned: state.player.totalEarned + Math.max(0, reward),
      currentJob: nextCurrentJob,
    }

    set(() => ({
      player: nextPlayer,
      gameTime: addGameMinutes(state.gameTime, currentJob.timeCostMinutes),
      ...computeDerivedState({
        player: nextPlayer,
        girls: state.girls,
      }),
    }))

    return {
      reward,
      cost,
      net: reward - cost,
    }
  },

  finishWorkWithOutcome: (reward, cost = 0) => settleCurrentWork(reward, cost),

  cancelWork: () => {
    const state = get()
    if (!state.player.currentJob) return

    set((current) => ({
      player: {
        ...current.player,
        timeStatus: 'idle',
        currentJob: undefined,
      },
      gameTime: current.gameTime,
      ...computeDerivedState({
        player: {
          ...current.player,
          timeStatus: 'idle',
          currentJob: undefined,
        },
        girls: current.girls,
      }),
    }))
  },

  isPlayerBusy: () => get().player.timeStatus === 'working',

  getWorkProgress: () => {
    const currentJob = get().player.currentJob
    if (!currentJob) return 0

    const elapsed = (Date.now() - currentJob.startTime) / 1000
    return Math.min(1, elapsed / currentJob.duration)
  },

  updateAffection: (girlId, change, mood) => {
    set((state) => {
      const girl = state.girls[girlId]
      if (!girl) return state

      const nextAffection = clampAffection(girl.affection + change)
      const nextMood = mood ?? girl.mood
      const nextStatus = resolveGirlStatus(nextAffection, nextMood)
      const nextHistory = appendBlockNotice(
        girl.chatHistory,
        girl.profile.name,
        girl.status,
        nextStatus,
      )

      const nextGirls = {
        ...state.girls,
        [girlId]: {
          ...girl,
          affection: nextAffection,
          mood: nextMood,
          status: nextStatus,
          chatHistory: nextHistory,
        },
      }

      return {
        girls: nextGirls,
        ...computeDerivedState({
          player: state.player,
          girls: nextGirls,
        }),
      }
    })
  },

  sendMessage: async (girlId, text) => {
    const content = text.trim()
    if (!content) return { ok: false, error: uiStrings.errors.emptyMessage }

    const currentState = get()
    const girl = currentState.girls[girlId]
    const sendTimeCost = 12

    if (!girl) return { ok: false, error: uiStrings.errors.girlNotFound }
    if (girl.status === 'blocked') return { ok: false, error: t(uiStrings.errors.girlBlocked, { name: girl.profile.name }) }

    const playerMessageTime = addGameMinutes(currentState.gameTime, sendTimeCost)
    const routineStatus = getGirlRoutineStatus(girlId, playerMessageTime)
    const playerMessage = createMessage('player', content, undefined, playerMessageTime)
    const optimisticGirl = {
      ...girl,
      chatHistory: [...girl.chatHistory, playerMessage],
      lastContactTime: playerMessage.timestamp,
      pendingCheckInReply: false,
    }

    set((state) => ({
      player: {
        ...state.player,
        currentJob: applyWorkInterruption(
          state.player.currentJob,
          sendTimeCost,
          getWorkActionFocusLoss('message'),
        ),
      },
      girls: {
        ...state.girls,
        [girlId]: optimisticGirl,
      },
      gameTime: playerMessageTime,
    }))

    const replyRequestStartedAt = Date.now()
    const { playerProfile } = get()
    const aiPayload = await generateChatReply({
      girlId,
      girl: optimisticGirl,
      recentHistory: optimisticGirl.chatHistory.slice(-20),
      playerMessage: content,
      gameTime: playerMessageTime,
      playerName: playerProfile.configured ? playerProfile.name : undefined,
      playerGender: playerProfile.configured ? playerProfile.gender : undefined,
    })
    const replyTime = addGameMinutes(playerMessageTime, routineStatus.replyDelayMinutes)

    await deliverGirlReplySequence(
      girlId,
      aiPayload.reply,
      replyRequestStartedAt,
      replyTime,
        (latestGirl, lastReplyMessage, historyWithReply) => {
        const nextAffection = clampAffection(latestGirl.affection + aiPayload.affectionChange)
        const nextMood = aiPayload.mood
        const nextStatus = resolveGirlStatus(nextAffection, nextMood)
        const nextHistory = appendBlockNotice(
          historyWithReply,
          latestGirl.profile.name,
          latestGirl.status,
          nextStatus,
        )

        return {
          ...latestGirl,
          affection: nextAffection,
          mood: nextMood,
          status: nextStatus,
          chatHistory: nextHistory,
          lastContactTime: lastReplyMessage.timestamp,
          lastReplySource: aiPayload.source,
          lastReplyDebugReason: aiPayload.debugReason,
        }
      },
    )

    set((state) => {
      const nextPlayer = {
        ...state.player,
        currentJob: applyWorkInterruption(state.player.currentJob, routineStatus.replyDelayMinutes),
      }

      return {
        player: nextPlayer,
        ...computeDerivedState({
          player: nextPlayer,
          girls: state.girls,
        }),
      }
    })

    return { ok: true }
  },

  sendGiftInChat: async (girlId, giftId) => {
    const girl = get().girls[girlId]
    if (!girl) return { ok: false, error: uiStrings.errors.girlNotFound }
    if (girl.status === 'blocked') return { ok: false, error: t(uiStrings.errors.girlBlocked, { name: girl.profile.name }) }

    const gift = get().useGift(giftId)
    if (!gift) return { ok: false, error: uiStrings.errors.noGiftInBag }
    const giftTimeCost = getGiftSendTimeCost(giftId)
    const giftMessageTime = addGameMinutes(get().gameTime, giftTimeCost)
    const routineStatus = getGirlRoutineStatus(girlId, giftMessageTime)

    const giftMessage = createMessage(
      'player',
      `[你送出了一个 ${gift.emoji}${gift.name}]`,
      gift.id,
      giftMessageTime,
    )

    set((state) => {
      const latestGirl = state.girls[girlId]
      if (!latestGirl) return state

      return {
        player: {
          ...state.player,
          currentJob: applyWorkInterruption(
            state.player.currentJob,
            giftTimeCost,
            getWorkActionFocusLoss('gift'),
          ),
        },
        girls: {
          ...state.girls,
          [girlId]: {
            ...latestGirl,
            chatHistory: [...latestGirl.chatHistory, giftMessage],
            lastContactTime: giftMessage.timestamp,
            pendingCheckInReply: false,
          },
        },
        gameTime: giftMessageTime,
      }
    })

    const stateAfterGift = get()
    const updatedGirl = stateAfterGift.girls[girlId]
    const bonus = getGiftPreferenceDelta(girlId, gift)
    const replyRequestStartedAt = Date.now()
    const aiPayload = await generateChatReply({
      girlId,
      girl: updatedGirl,
      recentHistory: updatedGirl.chatHistory.slice(-20),
      gameTime: giftMessageTime,
      playerMessage: `我给你准备了一个${gift.name}。`,
      extraContext: `对方刚给你送了一个${gift.name}，价值${gift.price}元。${getGirlReaction(
        girlId,
        gift,
      )}`,
      playerName: stateAfterGift.playerProfile.configured ? stateAfterGift.playerProfile.name : undefined,
      playerGender: stateAfterGift.playerProfile.configured ? stateAfterGift.playerProfile.gender : undefined,
    })
    const replyTime = addGameMinutes(giftMessageTime, routineStatus.replyDelayMinutes)

    await deliverGirlReplySequence(
      girlId,
      aiPayload.reply,
      replyRequestStartedAt,
      replyTime,
        (latestGirl, lastReplyMessage, historyWithReply) => {
        const nextAffection = clampAffection(
          latestGirl.affection + aiPayload.affectionChange + bonus,
        )
        const nextMood = aiPayload.mood
        const nextStatus = resolveGirlStatus(nextAffection, nextMood)
        const nextHistory = appendBlockNotice(
          historyWithReply,
          latestGirl.profile.name,
          latestGirl.status,
          nextStatus,
        )

        return {
          ...latestGirl,
          affection: nextAffection,
          mood: nextMood,
          status: nextStatus,
          chatHistory: nextHistory,
          lastContactTime: lastReplyMessage.timestamp,
          lastReplySource: aiPayload.source,
          lastReplyDebugReason: aiPayload.debugReason,
        }
      },
    )

    set((state) => {
      const nextPlayer = {
        ...state.player,
        currentJob: applyWorkInterruption(state.player.currentJob, routineStatus.replyDelayMinutes),
      }

      return {
        player: nextPlayer,
        ...computeDerivedState({
          player: nextPlayer,
          girls: state.girls,
        }),
      }
    })

    return { ok: true }
  },

  setPlayerProfile: (profile) => {
    set(() => ({
      playerProfile: { ...profile, configured: true },
    }))
  },

  resetGame: () => {
    set(() => ({
      ...buildInitialState(),
    }))
  },
  }
})
