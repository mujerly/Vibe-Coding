import type { AppTab } from '../store/gameTypes'

/** Stage-specific prompt script for a girl at a given affection tier */
export interface StageScript {
  mindset: string
  replyStyle: string
  messagePattern: string
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

/** Sticker item in a girl's sticker pack */
export interface GirlStickerConfig {
  id: string
  asset: string
  keywords: string[]
}

/** Semantic-to-sticker mapping rule */
export interface GirlStickerSemanticRule {
  intent: string
  stickerId: string
  triggerPhrases: string[]
}

/** Sticker pack configuration per girl */
export interface GirlStickerPackConfig {
  stickers: GirlStickerConfig[]
  semanticMap: GirlStickerSemanticRule[]
}

/** Daily routine configuration for a girl */
export interface GirlRoutineConfig {
  wakeHour: number
  sleepHour: number
  busyHours: number[]
  busyLabel: string
  onlineLabel: string
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

/** Background info for a girl */
export interface GirlBackground {
  hometown: string
  currentCity: string
  occupation: string
  hobbies: string[]
  dailyLife: string
  personalityType: string
}

/** Full girl configuration (loaded from JSON) */
export interface GirlConfig {
  id: string
  name: string
  avatar: string
  age: number
  personality: string
  bio: string
  background: GirlBackground
  tags: string[]
  speakingStyle: string
  interests: string[]
  likedGiftIds: string[]
  dislikedGiftIds: string[]
  anxiousWaitMultiplier: number
  intro?: string
  checkInTemplates: string[]
  quickPrompts: string[]
  routine: GirlRoutineConfig
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

/** Slot machine symbol configuration */
export interface SlotSymbolConfig {
  id: string
  label: string
  icon: string
  weight: number
  payout: number
  panelClassName: string
  glowClassName: string
  rarityLabel: string
}

/** Desktop app icon configuration */
export interface PhoneAppConfig {
  id: string
  appId: AppTab
  name: string
  icon: string
  iconBackground: string
  iconColor: string
  placement: 'grid' | 'dock'
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
  minutesPerTick: number
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

/** UI strings configuration — all user-facing text in the app */
export interface UiStringsConfig {
  app: {
    title: string
    subtitle: string
    resetButton: string
    gameOver: string
    settlementMessage: string
  }
  sidebar: {
    currentScore: string
    activeRelations: string
    wallet: string
    backpack: string
    aiMode: string
    aiFallback: string
    demoOrderTitle: string
    strategyTitle: string
    demoChecklist: string[]
    strategyHints: string[]
  }
  stats: {
    panelLabel: string
    panelTitle: string
    totalScore: string
    conquered: string
    totalEarned: string
    totalSpent: string
    relationPanel: string
    blocked: string
  }
  nav: {
    chat: string
    work: string
    shop: string
    stats: string
  }
  desktop: {
    homeButton: string
    workingElsewhere: string
  }
  aiSession: {
    title: string
    subtitle: string
    keyLabel: string
    keyPlaceholder: string
    modelLabel: string
    modelPlaceholder: string
    modelHelper: string
    modelCustomOption: string
    modelDetectButton: string
    modelDetectLoading: string
    modelDetectSuccess: string
    modelDetectFailed: string
    modelDetectUnknownError: string
    hint: string
    openButton: string
    editButton: string
    clearButton: string
    saveButton: string
    cancelButton: string
    activeBadge: string
    inactiveBadge: string
    sessionMode: string
    fallbackMode: string
  }
  statusBar: {
    dayLabel: string
    aiCloud: string
    aiFallback: string
    working: string
    idle: string
  }
  chatList: {
    topLabel: string
    title: string
    subtitle: string
    sessionCount: string
    noMessages: string
    stickerPreview: string
    statusLabels: Record<string, string>
  }
  chatRoom: {
    back: string
    send: string
    giftButton: string
    typing: string
    replySourceLabel: string
    replySourceAi: string
    replySourceFallback: string
    fallbackReasonPrefix: string
    unknownReason: string
    fallbackNotice: string
    giftSentAi: string
    giftSentFallback: string
    busyWarning: string
    blockedWarning: string
    placeholderBlocked: string
    placeholderBusy: string
    placeholderDefault: string
  }
  giftPicker: {
    title: string
    subtitle: string
    close: string
    empty: string
    stock: string
  }
  earning: {
    topLabel: string
    title: string
    subtitle: string
    timeCostLabel: string
    estimatedIncome: string
    remaining: string
    timeUnit: string
    workingWarning: string
    focusLabel: string
    workFailed: string
    idleHint: string
    jobStarted: string
    jobFailed: string
    manualSettled: string
    slotTitle: string
    slotSubtitle: string
    slotSpinCost: string
    slotJackpot: string
    slotRules: string
    slotOddsTitle: string
    slotChance: string
    slotPayout: string
    slotNet: string
    slotResult: string
    slotSpinButton: string
    slotSpinning: string
    slotNeedMoney: string
    slotPayoutRange: string
    slotLoseFeedback: string
    slotWinFeedback: string
    slotJackpotFeedback: string
    slotSpinCount: string
    slotBusyTime: string
    slotExitButton: string
    slotExitFeedback: string
    slotResetMessage: string
    deliverySubtitle: string
    deliveryControls: string
    deliveryProgress: string
    deliveryGoal: string
    deliverySteps: string
    deliveryPickup: string
    deliveryDropoff: string
    deliveryPickedUp: string
    deliveryDelivered: string
    deliveryUp: string
    deliveryDown: string
    deliveryLeft: string
    deliveryRight: string
    reviewTitle: string
    reviewSubtitle: string
    reviewReward: string
    reviewTip: string
    reviewCategoryMatch: string
    reviewCategoryLogistics: string
    reviewCategoryService: string
    reviewCommentLabel: string
    reviewCommentPlaceholder: string
    reviewDefaultComment: string
    reviewSubmit: string
    reviewSubmitDisabled: string
  }
  shop: {
    topLabel: string
    title: string
    subtitle: string
    balance: string
    backpackCount: string
    purchased: string
    purchasedWithTime: string
    purchaseFailed: string
    buyButton: string
    insufficientFunds: string
  }
  taobao: {
    shopTab: string
    reviewTab: string
    shopTitle: string
    shopSubtitle: string
    reviewTitle: string
    reviewSubtitle: string
  }
  errors: {
    girlNotFound: string
    giftNotFound: string
    jobNotFound: string
    noMoney: string
    alreadyWorking: string
    emptyMessage: string
    busyCantReply: string
    busyCantGift: string
    girlBlocked: string
    noGiftInBag: string
    sendFailed: string
    giftFailed: string
  }
  system: {
    girlBlockedNotice: string
    workPenaltyMoodBad: string
    workPenaltyMoodMild: string
  }
}
