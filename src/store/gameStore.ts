import { create } from 'zustand'
import type { ActionResult, GameState, Gift, Message } from './gameTypes'
import { createInitialGirlsState } from '../systems/girls/girlProfiles'
import { jobs } from '../systems/earning/jobs'
import { shopItems } from '../systems/spending/shopData'
import {
  clampAffection,
  getDelayedReplyPenalty,
  getGiftPreferenceDelta,
  getGirlReaction,
  getWorkComplaintMessage,
  resolveGirlStatus,
} from '../systems/girls/affectionLogic'
import { generateChatReply } from '../systems/chat/chatEngine'
import { balance, uiStrings, t } from '../data'

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
  isPlayerBusy: () => boolean
  getWorkProgress: () => number
  updateAffection: (girlId: string, change: number, mood?: string) => void
  resetGame: () => void
}

export type GameStore = GameState & GameActions

const createMessage = (
  role: 'player' | 'girl' | 'system',
  content: string,
  giftId?: string,
): Message => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  timestamp: Date.now(),
  giftId,
})

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
  const gameOver = blockedCount === girls.length

  return {
    score,
    gameOver,
    gameOverReason: gameOver ? gameOverMessage : undefined,
  }
}

const buildInitialState = (): GameState => {
  const initialState: GameState = {
    player: {
      money: balance.initialMoney,
      totalSpent: 0,
      totalEarned: 0,
      inventory: [],
      timeStatus: 'idle',
    },
    girls: createInitialGirlsState(),
    economy: {
      shopItems,
    },
    gameTime: Date.now(),
    score: 0,
    gameOver: false,
  }

  return {
    ...initialState,
    ...computeDerivedState(initialState),
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
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

    if (!gift) return { ok: false, error: uiStrings.errors.giftNotFound }
    if (state.player.money < gift.price) return { ok: false, error: uiStrings.errors.noMoney }

    set((current) => {
      const nextPlayer = {
        ...current.player,
        money: current.player.money - gift.price,
        totalSpent: current.player.totalSpent + gift.price,
        inventory: [...current.player.inventory, gift],
      }

      return {
        player: nextPlayer,
        gameTime: Date.now(),
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

    const reward =
      job.rewardRange != null
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
          reward,
          startTime: Date.now(),
        },
      },
      gameTime: Date.now(),
    }))

    return { ok: true }
  },

  finishWork: () => {
    const state = get()
    const currentJob = state.player.currentJob

    if (!currentJob) return 0

    const nextGirls = Object.fromEntries(
      Object.entries(state.girls).map(([girlId, girl]) => {
        if (girl.status === 'blocked') {
          return [girlId, girl]
        }

        const penalty = getDelayedReplyPenalty(girlId, currentJob.duration, girl.affection)
        const nextAffection = clampAffection(girl.affection - penalty)
        const complaintMessage = createMessage('girl', getWorkComplaintMessage(girlId))
        const mood = penalty >= 3 ? uiStrings.system.workPenaltyMoodBad : uiStrings.system.workPenaltyMoodMild
        const nextStatus = resolveGirlStatus(nextAffection, mood)
        const nextHistory = appendBlockNotice(
          [...girl.chatHistory, complaintMessage],
          girl.profile.name,
          girl.status,
          nextStatus,
        )

        return [
          girlId,
          {
            ...girl,
            affection: nextAffection,
            mood,
            status: nextStatus,
            unreadCount: girl.unreadCount + 1,
            chatHistory: nextHistory,
            lastContactTime: complaintMessage.timestamp,
          },
        ]
      }),
    )

    const nextPlayer = {
      ...state.player,
      money: state.player.money + currentJob.reward,
      totalEarned: state.player.totalEarned + currentJob.reward,
      timeStatus: 'idle' as const,
      currentJob: undefined,
    }

    set(() => ({
      player: nextPlayer,
      girls: nextGirls,
      gameTime: Date.now(),
      ...computeDerivedState({
        player: nextPlayer,
        girls: nextGirls,
      }),
    }))

    return currentJob.reward
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
    if (get().isPlayerBusy()) return { ok: false, error: uiStrings.errors.busyCantReply }

    const currentState = get()
    const girl = currentState.girls[girlId]

    if (!girl) return { ok: false, error: uiStrings.errors.girlNotFound }
    if (girl.status === 'blocked') return { ok: false, error: t(uiStrings.errors.girlBlocked, { name: girl.profile.name }) }

    const playerMessage = createMessage('player', content)
    const optimisticGirl = {
      ...girl,
      chatHistory: [...girl.chatHistory, playerMessage],
      lastContactTime: playerMessage.timestamp,
    }

    set((state) => ({
      girls: {
        ...state.girls,
        [girlId]: optimisticGirl,
      },
      gameTime: playerMessage.timestamp,
    }))

    const aiPayload = await generateChatReply({
      girlId,
      girl: optimisticGirl,
      recentHistory: optimisticGirl.chatHistory.slice(-20),
      playerMessage: content,
    })

    set((state) => {
      const latestGirl = state.girls[girlId]
      if (!latestGirl) return state

      const replyMessage = createMessage('girl', aiPayload.reply)
      const nextAffection = clampAffection(latestGirl.affection + aiPayload.affectionChange)
      const nextMood = aiPayload.mood
      const nextStatus = resolveGirlStatus(nextAffection, nextMood)
      const nextHistory = appendBlockNotice(
        [...latestGirl.chatHistory, replyMessage],
        latestGirl.profile.name,
        latestGirl.status,
        nextStatus,
      )

      const nextGirls = {
        ...state.girls,
        [girlId]: {
          ...latestGirl,
          affection: nextAffection,
          mood: nextMood,
          status: nextStatus,
          chatHistory: nextHistory,
          lastContactTime: replyMessage.timestamp,
          lastReplySource: aiPayload.source,
          lastReplyDebugReason: aiPayload.debugReason,
        },
      }

      return {
        girls: nextGirls,
        gameTime: replyMessage.timestamp,
        ...computeDerivedState({
          player: state.player,
          girls: nextGirls,
        }),
      }
    })

    return { ok: true }
  },

  sendGiftInChat: async (girlId, giftId) => {
    if (get().isPlayerBusy()) return { ok: false, error: uiStrings.errors.busyCantGift }

    const girl = get().girls[girlId]
    if (!girl) return { ok: false, error: uiStrings.errors.girlNotFound }
    if (girl.status === 'blocked') return { ok: false, error: t(uiStrings.errors.girlBlocked, { name: girl.profile.name }) }

    const gift = get().useGift(giftId)
    if (!gift) return { ok: false, error: uiStrings.errors.noGiftInBag }

    const giftMessage = createMessage(
      'player',
      `[你送出了一个 ${gift.emoji}${gift.name}]`,
      gift.id,
    )

    set((state) => {
      const latestGirl = state.girls[girlId]
      if (!latestGirl) return state

      return {
        girls: {
          ...state.girls,
          [girlId]: {
            ...latestGirl,
            chatHistory: [...latestGirl.chatHistory, giftMessage],
            lastContactTime: giftMessage.timestamp,
          },
        },
        gameTime: giftMessage.timestamp,
      }
    })

    const stateAfterGift = get()
    const updatedGirl = stateAfterGift.girls[girlId]
    const bonus = getGiftPreferenceDelta(girlId, gift)
    const aiPayload = await generateChatReply({
      girlId,
      girl: updatedGirl,
      recentHistory: updatedGirl.chatHistory.slice(-20),
      playerMessage: `我给你准备了一个${gift.name}。`,
      extraContext: `对方刚给你送了一个${gift.name}，价值${gift.price}元。${getGirlReaction(
        girlId,
        gift,
      )}`,
    })

    set((state) => {
      const latestGirl = state.girls[girlId]
      if (!latestGirl) return state

      const replyMessage = createMessage('girl', aiPayload.reply)
      const nextAffection = clampAffection(
        latestGirl.affection + aiPayload.affectionChange + bonus,
      )
      const nextMood = aiPayload.mood
      const nextStatus = resolveGirlStatus(nextAffection, nextMood)
      const nextHistory = appendBlockNotice(
        [...latestGirl.chatHistory, replyMessage],
        latestGirl.profile.name,
        latestGirl.status,
        nextStatus,
      )

      const nextGirls = {
        ...state.girls,
        [girlId]: {
          ...latestGirl,
          affection: nextAffection,
          mood: nextMood,
          status: nextStatus,
          chatHistory: nextHistory,
          lastContactTime: replyMessage.timestamp,
          lastReplySource: aiPayload.source,
          lastReplyDebugReason: aiPayload.debugReason,
        },
      }

      return {
        girls: nextGirls,
        gameTime: replyMessage.timestamp,
        ...computeDerivedState({
          player: state.player,
          girls: nextGirls,
        }),
      }
    })

    return { ok: true }
  },

  resetGame: () => {
    set(() => ({
      ...buildInitialState(),
    }))
  },
}))
