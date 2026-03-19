import type { Gift } from '../../store/gameTypes'
import { girlConfigs, balance } from '../../data'

export const clampAffection = (value: number) => Math.max(0, Math.min(100, value))

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
  durationSeconds: number,
  affection: number,
) => {
  const girl = girlConfigs[girlId]
  if (!girl) return 0

  const { delayPenalty } = balance
  const timePenalty = Math.max(1, Math.floor(durationSeconds / delayPenalty.secondsPerTick))
  const affectionPressure = affection >= delayPenalty.highAffectionThreshold ? delayPenalty.highAffectionExtra : 0

  return Math.ceil((timePenalty + affectionPressure) * girl.anxiousWaitMultiplier)
}

export const getWorkComplaintMessage = (girlId: string) => {
  const girl = girlConfigs[girlId]
  if (!girl) return '你刚刚怎么突然消失了？'

  const index = Math.floor(Math.random() * girl.checkInTemplates.length)
  return girl.checkInTemplates[index]
}
