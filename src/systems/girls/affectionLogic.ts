import type { Gift, Message } from '../../store/gameTypes'
import { girlConfigs, balance } from '../../data'

export const clampAffection = (value: number) => Math.max(0, Math.min(100, value))

const noInitiativePatterns = [
  /绝对不主动/,
  /完全不主动/,
  /基本不主动/,
  /不会主动/,
  /不主动找你/,
  /不主动/,
]

const reactiveOnlyPatterns = [
  /在你发消息后/,
  /在你问/,
  /跟进一个问题/,
  /不主动找你开话头/,
]

const proactiveCheckInPatterns = [
  /主动/,
  /先发消息/,
  /找你/,
  /追问/,
  /查岗/,
  /关心/,
  /分享/,
]

const normalizeDirectiveText = (value: string) => value.replace(/\s+/g, '')
const normalizeTemplateText = (value: string) => value.trim()

export const getRelationshipStage = (affection: number) => {
  const tiers = balance.affectionTiers
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (affection >= tiers[i].min) return tiers[i].label
  }
  return tiers[0].label
}

export const resolveGirlStatus = (
  affection: number,
  mood: string,
): 'normal' | 'suspicious' | 'angry' | 'blocked' => {
  const { statusThresholds } = balance

  if (affection <= statusThresholds.blocked) return 'blocked'

  const angryPattern = new RegExp(statusThresholds.angryMoodPatterns.join('|'))
  if (affection < statusThresholds.angry || angryPattern.test(mood)) return 'angry'

  const suspiciousPattern = new RegExp(statusThresholds.suspiciousMoodPatterns.join('|'))
  if (affection < statusThresholds.suspicious || suspiciousPattern.test(mood)) return 'suspicious'

  return 'normal'
}

export const getGiftPreferenceDelta = (girlId: string, gift: Gift) => {
  const girl = girlConfigs[girlId]
  const pref = balance.giftPreference

  if (!girl) return 0
  if (girl.likedGiftIds.includes(gift.id)) return gift.price === 0 ? pref.likedFreeDelta : pref.likedDelta
  if (girl.dislikedGiftIds.includes(gift.id)) return pref.dislikedDelta
  return pref.defaultDelta
}

export const getGirlReaction = (girlId: string, gift: Gift) => {
  const girl = girlConfigs[girlId]

  return (
    girl?.giftReactions[gift.id] ??
    `${girl?.name ?? '她'}会根据这份礼物重新判断你的诚意。`
  )
}

export const getDelayedReplyPenalty = (
  girlId: string,
  durationMinutes: number,
  affection: number,
) => {
  const girl = girlConfigs[girlId]
  if (!girl) return 0

  const { delayPenalty } = balance
  const timePenalty = Math.max(1, Math.floor(durationMinutes / delayPenalty.minutesPerTick))
  const affectionPressure = affection >= delayPenalty.highAffectionThreshold ? delayPenalty.highAffectionExtra : 0

  return Math.ceil((timePenalty + affectionPressure) * girl.anxiousWaitMultiplier)
}

export const canGirlSendCheckIn = (girlId: string, affection: number) => {
  const girl = girlConfigs[girlId]
  if (!girl || girl.checkInTemplates.length === 0) return false

  const stage = getRelationshipStage(affection)
  const initiatives = normalizeDirectiveText(girl.prompt.stages[stage]?.initiatives ?? '')
  if (!initiatives) return false

  if (noInitiativePatterns.some((pattern) => pattern.test(initiatives))) {
    return false
  }

  if (reactiveOnlyPatterns.some((pattern) => pattern.test(initiatives))) {
    return false
  }

  return proactiveCheckInPatterns.some((pattern) => pattern.test(initiatives))
}

export const getWorkComplaintMessage = (
  girlId: string,
  chatHistory: Message[] = [],
  lastTemplate?: string,
) => {
  const girl = girlConfigs[girlId]
  if (!girl) return '你刚刚怎么突然消失了？'

  const templates = girl.checkInTemplates.map(normalizeTemplateText).filter(Boolean)
  if (templates.length === 0) {
    return '你刚刚怎么突然消失了？'
  }

  const recentGirlMessages = new Set(
    chatHistory
      .slice(-6)
      .filter((message) => message.role === 'girl')
      .map((message) => normalizeTemplateText(message.content)),
  )

  const preferredTemplates = templates.filter(
    (template) => template !== lastTemplate && !recentGirlMessages.has(template),
  )
  const alternativeTemplates = templates.filter((template) => template !== lastTemplate)
  const candidatePool =
    preferredTemplates.length > 0
      ? preferredTemplates
      : alternativeTemplates.length > 0
      ? alternativeTemplates
      : templates

  const index = Math.floor(Math.random() * candidatePool.length)
  return candidatePool[index]
}
