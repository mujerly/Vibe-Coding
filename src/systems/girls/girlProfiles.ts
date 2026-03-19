import type { GirlProfile, GirlState } from '../../store/gameTypes'
import { girlConfigs, balance } from '../../data'
import type { GirlConfig } from '../../data/types'

export type { GirlConfig }

/**
 * Re-export girlConfigs as girlDefinitions for backward compatibility.
 * All girl data now comes from src/data/girls/*.json.
 */
export const girlDefinitions: Record<string, GirlConfig> = girlConfigs

export const createInitialGirlsState = (): Record<string, GirlState> => {
  const now = Date.now()
  const girls = Object.values(girlDefinitions)

  return girls.reduce<Record<string, GirlState>>((acc, girl, index) => {
    const timestamp = now - (girls.length - index) * 60 * 1000

    const profile: GirlProfile = {
      id: girl.id,
      name: girl.name,
      avatar: girl.avatar,
      age: girl.age,
      personality: girl.personality,
      bio: girl.bio,
      tags: girl.tags,
    }

    acc[girl.id] = {
      profile,
      affection: balance.initialAffection,
      mood: balance.initialMood,
      status: 'normal',
      chatHistory: [
        {
          id: `${girl.id}-intro`,
          role: 'girl',
          content: girl.intro,
          timestamp,
        },
      ],
      unreadCount: 1,
      lastContactTime: timestamp,
      lastReplySource: undefined,
      lastReplyDebugReason: undefined,
    }

    return acc
  }, {})
}
