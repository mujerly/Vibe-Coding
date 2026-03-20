export interface Gift {
  id: string
  name: string
  emoji: string
  price: number
  description: string
}

export interface Message {
  id: string
  role: 'player' | 'girl' | 'system'
  content: string
  timestamp: number
  giftId?: string
  stickerId?: string
}

export interface GirlProfile {
  id: string
  name: string
  avatar: string
  age: number
  personality: string
  bio: string
  tags: string[]
}

export interface GirlState {
  profile: GirlProfile
  affection: number
  mood: string
  status: 'normal' | 'suspicious' | 'angry' | 'blocked'
  chatHistory: Message[]
  unreadCount: number
  lastContactTime: number
  pendingCheckInReply: boolean
  lastCheckInTemplate?: string
  lastReplySource?: 'ai' | 'fallback'
  lastReplyDebugReason?: string
}

export interface JobDefinition {
  id: string
  name: string
  emoji: string
  duration: number
  timeCostMinutes: number
  reward: number
  description: string
  rewardRange?: [number, number]
  cost?: number
  mode?: 'timed' | 'delivery' | 'review' | 'slot'
  completionMode?: 'timer' | 'manual'
}

export interface CurrentJob {
  type: string
  duration: number
  timeCostMinutes: number
  reward: number
  startTime: number
  mode: 'timed' | 'delivery' | 'review' | 'slot'
  completionMode: 'timer' | 'manual'
  trackedDuration: number
  trackedTimeMinutes: number
  interruptionMinutes: number
  sessionSpent: number
  sessionEarned: number
  spinCount: number
  focus: number
}

export interface WorkSettlement {
  reward: number
  cost: number
  net: number
}

export type EndingType = 'playing' | 'all_blocked' | 'death' | 'victory'

export interface PlayerProfile {
  configured: boolean
  name: string
  gender: 'male' | 'female'
}

export interface GirlRelationship {
  girl1Id: string
  girl2Id: string
  type: 'friends' | 'rivals'
  gossipTriggered: boolean
}

export interface GameState {
  playerProfile: PlayerProfile
  player: {
    money: number
    totalSpent: number
    totalEarned: number
    inventory: Gift[]
    timeStatus: 'idle' | 'working'
    currentJob?: CurrentJob
  }
  girls: Record<string, GirlState>
  relationships: GirlRelationship[]
  economy: {
    shopItems: Gift[]
  }
  gameTime: number
  score: number
  gameOver: boolean
  gameOverReason?: string
  endingType: EndingType
  endingNarrative?: string
}

export interface ActionResult {
  ok: boolean
  error?: string
}

export type AppTab =
  | 'desktop'
  | 'wechat'
  | 'taobao'
  | 'meituan'
  | 'coding'
  | 'slots'
  | 'streaming'
  | 'stats'
