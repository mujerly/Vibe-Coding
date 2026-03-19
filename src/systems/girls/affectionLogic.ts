import type { Gift } from '../../store/gameTypes'
import { girlDefinitions } from './girlProfiles'

export const clampAffection = (value: number) => Math.max(0, Math.min(100, value))

export const getRelationshipStage = (affection: number) => {
  if (affection >= 80) return '热恋'
  if (affection >= 60) return '暧昧'
  if (affection >= 40) return '有兴趣'
  if (affection >= 20) return '礼貌'
  return '冷淡'
}

export const resolveGirlStatus = (
  affection: number,
  mood: string,
): 'normal' | 'suspicious' | 'angry' | 'blocked' => {
  if (affection <= 0) return 'blocked'
  if (affection < 15 || /生气|失望|厌烦|反感|冷掉/.test(mood)) return 'angry'
  if (affection < 30 || /怀疑|试探|观察/.test(mood)) return 'suspicious'
  return 'normal'
}

export const getGiftPreferenceDelta = (girlId: string, gift: Gift) => {
  const definition = girlDefinitions[girlId]

  if (!definition) return 0
  if (definition.likedGiftIds.includes(gift.id)) return gift.price === 0 ? 4 : 6
  if (definition.dislikedGiftIds.includes(gift.id)) return -4
  if (gift.id === 'milk-tea') return 2
  if (gift.id === 'luxury-bag' && girlId === 'linyouyou') return -2
  return 1
}

export const getGirlReaction = (girlId: string, gift: Gift) => {
  const definition = girlDefinitions[girlId]

  return (
    definition?.giftReactions[gift.id] ??
    `${definition?.name ?? '她'}会根据这份礼物重新判断你的诚意。`
  )
}

export const getDelayedReplyPenalty = (
  girlId: string,
  durationSeconds: number,
  affection: number,
) => {
  const definition = girlDefinitions[girlId]
  if (!definition) return 0

  const timePenalty = Math.max(1, Math.floor(durationSeconds / 45))
  const affectionPressure = affection >= 60 ? 1 : 0

  return Math.ceil((timePenalty + affectionPressure) * definition.anxiousWaitMultiplier)
}

export const getWorkComplaintMessage = (girlId: string) => {
  const definition = girlDefinitions[girlId]
  if (!definition) return '你刚刚怎么突然消失了？'

  const index = Math.floor(Math.random() * definition.checkInTemplates.length)
  return definition.checkInTemplates[index]
}
