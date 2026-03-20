import type { GirlProfile, GirlState } from '../../store/gameTypes'
import { girlConfigs, balance } from '../../data'
import type { GirlConfig } from '../../data/types'
import { createInitialGameTime } from '../../utils/timeSystem'

export type { GirlConfig }

/**
 * Re-export girlConfigs as girlDefinitions for backward compatibility.
 * All girl data now comes from src/data/girls/*.json.
 */
export const girlDefinitions: Record<string, GirlConfig> = girlConfigs

export const createInitialGirlsState = (
  initialGameTime = createInitialGameTime(),
): Record<string, GirlState> => {
  const girls = Object.values(girlDefinitions)

  return girls.reduce<Record<string, GirlState>>((acc, girl, index) => {
    // Set each girl's intro message to ~1h after her wakeHour on Day 1, staggered by 20min
    // This ensures no girl "sends a message while sleeping"
    const wakeHour = girl.routine.wakeHour
    const introMs = new Date(2026, 0, 1, wakeHour + 1, index * 20, 0, 0).getTime()
    // Never exceed game start time (the player hasn't opened the app yet)
    const timestamp = Math.min(introMs, initialGameTime - (girls.length - index) * 20 * 60_000)

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
      chatHistory: girl.intro
        ? [{ id: `${girl.id}-intro`, role: 'girl' as const, content: girl.intro, timestamp }]
        : [],
      unreadCount: girl.intro ? 1 : 0,
      lastContactTime: timestamp,
      pendingCheckInReply: false,
      lastCheckInTemplate: undefined,
      lastReplySource: undefined,
      lastReplyDebugReason: undefined,
    }

    return acc
  }, {})
}
