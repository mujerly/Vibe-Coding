import type { Gift } from '../../store/gameTypes'
import { giftConfigs } from '../../data'
import type { GiftConfig } from '../../data/types'

/**
 * Shop items loaded from src/data/economy/gifts.json.
 * Mapped to the Gift interface used by the store.
 */
export const shopItems: Gift[] = giftConfigs.map((g) => ({
  id: g.id,
  name: g.name,
  emoji: g.emoji,
  price: g.price,
  description: g.description,
}))

/** Gift advice map keyed by gift id, loaded from config. */
export const giftAdvice: Record<string, string> = Object.fromEntries(
  giftConfigs.map((g) => [g.id, g.advice]),
)

export { giftConfigs }
export type { GiftConfig }
