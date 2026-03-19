import { useEffect, useState } from 'react'
import { isSiliconflowEnabled } from '../config/api'

interface StatusBarProps {
  money: number
  timeStatus: 'idle' | 'working'
}

const formatClock = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

export function StatusBar({ money, timeStatus }: StatusBarProps) {
  const [clock, setClock] = useState(() => formatClock(new Date()))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(formatClock(new Date()))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center justify-between border-b border-white/70 bg-white/65 px-5 pb-3 pt-4 text-[11px] font-medium text-ink backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-[0.24em]">{clock}</span>
        <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] text-wine/80 shadow-soft">
          {isSiliconflowEnabled ? 'AI 云端' : 'AI 保底'}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[10px]">
        <span className="rounded-full bg-gold/25 px-2 py-1 text-wine">¥ {money}</span>
        <span
          className={`rounded-full px-2 py-1 ${
            timeStatus === 'working'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {timeStatus === 'working' ? '打工中' : '空闲'}
        </span>
      </div>
    </div>
  )
}
