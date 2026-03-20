import { girlConfigs, t, uiStrings } from '../data'
import type { CurrentJob } from '../store/gameTypes'

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

const GAME_START_TIME = new Date(2026, 0, 1, 12, 0, 0, 0).getTime()

const ACTION_TIME_COSTS = {
  message: 12,
  gift: 18,
  letterGift: 24,
  shop: 15,
  letterShop: 35,
} as const

const WORK_FOCUS_LOSS = {
  message: 28,
  gift: 40,
  shop: 18,
} as const

export const WORK_FAILURE_THRESHOLD = 20

export type GirlRoutineState = 'online' | 'busy' | 'sleeping'

export interface GirlRoutineStatus {
  state: GirlRoutineState
  label: string
  description: string
  replyDelayMinutes: number
}

const padTime = (value: number) => String(value).padStart(2, '0')

const isHourInWrappedRange = (hour: number, startHour: number, endHour: number) => {
  if (startHour === endHour) return true
  if (startHour < endHour) {
    return hour >= startHour && hour < endHour
  }

  return hour >= startHour || hour < endHour
}

export const createInitialGameTime = () => GAME_START_TIME

export const addGameMinutes = (timestamp: number, minutes: number) => timestamp + minutes * MINUTE_MS

export const getGameDay = (timestamp: number) => {
  const base = new Date(GAME_START_TIME)
  base.setHours(0, 0, 0, 0)

  const current = new Date(timestamp)
  current.setHours(0, 0, 0, 0)

  return Math.floor((current.getTime() - base.getTime()) / DAY_MS) + 1
}

export const formatGameClock = (timestamp: number) => {
  const current = new Date(timestamp)
  return `${padTime(current.getHours())}:${padTime(current.getMinutes())}`
}

export const formatGameDayLabel = (timestamp: number) =>
  t(uiStrings.statusBar.dayLabel, { day: getGameDay(timestamp) })

export const getGameHour = (timestamp: number) => new Date(timestamp).getHours()

export const getPurchaseTimeCost = (giftId: string) =>
  giftId === 'letter' ? ACTION_TIME_COSTS.letterShop : ACTION_TIME_COSTS.shop

export const getGiftSendTimeCost = (giftId: string) =>
  giftId === 'letter' ? ACTION_TIME_COSTS.letterGift : ACTION_TIME_COSTS.gift

export const getWorkActionFocusLoss = (action: 'message' | 'gift' | 'shop') =>
  WORK_FOCUS_LOSS[action]

export const getGirlRoutineStatus = (girlId: string, gameTime: number): GirlRoutineStatus => {
  const girl = girlConfigs[girlId]
  const hour = getGameHour(gameTime)

  if (!girl) {
    return {
      state: 'online',
      label: '在线',
      description: '现在方便回消息',
      replyDelayMinutes: 6,
    }
  }

  if (isHourInWrappedRange(hour, girl.routine.sleepHour, girl.routine.wakeHour)) {
    const sleepH = girl.routine.sleepHour
    const wakeH = girl.routine.wakeHour
    const sleepLabel = sleepH < 6 ? `凌晨 ${padTime(sleepH)}:00` : `${padTime(sleepH)}:00`
    // Calculate real minutes until she wakes up
    const hoursUntilWake = hour < wakeH ? wakeH - hour : 24 - hour + wakeH
    const replyDelayMinutes = hoursUntilWake * 60 + 15
    return {
      state: 'sleeping',
      label: '睡觉中',
      description: `${sleepLabel} 入睡，${padTime(wakeH)}:00 左右起床`,
      replyDelayMinutes,
    }
  }

  if (girl.routine.busyHours.includes(hour)) {
    return {
      state: 'busy',
      label: '忙碌中',
      description: girl.routine.busyLabel,
      replyDelayMinutes: 20,
    }
  }

  return {
    state: 'online',
    label: '在线',
    description: girl.routine.onlineLabel,
    replyDelayMinutes: 6,
  }
}

export const isWorkRewardLost = (job?: CurrentJob) =>
  Boolean(job && job.mode !== 'slot' && job.focus <= WORK_FAILURE_THRESHOLD)
