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
  lastReplySource?: 'ai' | 'fallback'
  lastReplyDebugReason?: string
}

export interface JobDefinition {
  id: string
  name: string
  emoji: string
  duration: number
  reward: number
  description: string
  rewardRange?: [number, number]
}

export interface CurrentJob {
  type: string
  duration: number
  reward: number
  startTime: number
}

export interface GameState {
  player: {
    money: number
    totalSpent: number
    totalEarned: number
    inventory: Gift[]
    timeStatus: 'idle' | 'working'
    currentJob?: CurrentJob
  }
  girls: Record<string, GirlState>
  economy: {
    shopItems: Gift[]
  }
  gameTime: number
  score: number
  gameOver: boolean
  gameOverReason?: string
}

export interface ActionResult {
  ok: boolean
  error?: string
}

export type AppTab = 'chat' | 'work' | 'shop' | 'stats'
