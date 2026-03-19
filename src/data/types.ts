/** Stage-specific prompt script for a girl at a given affection tier */
export interface StageScript {
  mindset: string
  replyStyle: string
  initiatives: string
  exampleReplies: string[]
  transitionHint: string
}

/** Few-shot example for AI prompt */
export interface PromptExample {
  player: string
  girl: string
  note?: string
}

/** Prompt configuration nested inside a girl config */
export interface GirlPromptConfig {
  persona: string
  stages: Record<string, StageScript>
  examples: PromptExample[]
  redLines: string[]
  softSpots: string[]
}

/** Fallback reply template */
export interface FallbackReplyTemplate {
  text: string
  mood: string
}

/** Fallback configuration for a girl */
export interface GirlFallbackConfig {
  signalWeights: {
    sweet: number
    long: number
    gift: number
    oily: number
    practical: number
    deep: number
  }
  goodThreshold: number
  goodReply: FallbackReplyTemplate
  neutralReply: FallbackReplyTemplate
  badReply: FallbackReplyTemplate | null
}

/** Full girl configuration (loaded from JSON) */
export interface GirlConfig {
  id: string
  name: string
  avatar: string
  age: number
  personality: string
  bio: string
  tags: string[]
  speakingStyle: string
  interests: string[]
  likedGiftIds: string[]
  dislikedGiftIds: string[]
  anxiousWaitMultiplier: number
  intro: string
  checkInTemplates: string[]
  quickPrompts: string[]
  prompt: GirlPromptConfig
  giftReactions: Record<string, string>
  fallback: GirlFallbackConfig
}

/** Gift configuration (loaded from JSON) */
export interface GiftConfig {
  id: string
  name: string
  emoji: string
  price: number
  description: string
  advice: string
}

/** Affection tier definition */
export interface AffectionTier {
  min: number
  max: number
  label: string
}

/** Status threshold configuration */
export interface StatusThresholds {
  blocked: number
  angry: number
  suspicious: number
  angryMoodPatterns: string[]
  suspiciousMoodPatterns: string[]
}

/** Gift preference deltas */
export interface GiftPreferenceConfig {
  likedDelta: number
  likedFreeDelta: number
  dislikedDelta: number
  defaultDelta: number
}

/** Delay penalty configuration */
export interface DelayPenaltyConfig {
  secondsPerTick: number
  highAffectionThreshold: number
  highAffectionExtra: number
}

/** Scoring configuration */
export interface ScoringConfig {
  conqueredThreshold: number
  conqueredBonus: number
  affectionMultiplier: number
  moneyDivisor: number
  spentDivisor: number
  blockedPenalty: number
}

/** Full balance configuration (loaded from JSON) */
export interface BalanceConfig {
  initialMoney: number
  initialAffection: number
  initialMood: string
  affectionTiers: AffectionTier[]
  statusThresholds: StatusThresholds
  giftPreference: GiftPreferenceConfig
  delayPenalty: DelayPenaltyConfig
  scoring: ScoringConfig
  gameOverMessage: string
}

/** UI strings configuration */
export interface UiStringsConfig {
  demoChecklist: string[]
  strategyHints: string[]
}
