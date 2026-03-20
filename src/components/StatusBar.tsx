import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAiConfig } from '../config/api'
import { uiStrings } from '../data'
import { triggerElementParticles } from '../utils/particles'
import { formatGameClock, formatGameDayLabel } from '../utils/timeSystem'

interface StatusBarProps {
  gameTime: number
  money: number
  timeStatus: 'idle' | 'working'
}

export function StatusBar({ gameTime, money, timeStatus }: StatusBarProps) {
  const aiConfig = useAiConfig()
  const moneyRef = useRef<HTMLSpanElement>(null)
  const prevMoneyRef = useRef(money)

  useEffect(() => {
    if (money > prevMoneyRef.current) {
      triggerElementParticles(moneyRef.current, 'money')
    }
    prevMoneyRef.current = money
  }, [money])

  const s = uiStrings.statusBar
  const aiEnabled = Boolean(aiConfig.apiKey)

  return (
    <div className="z-50 flex items-center justify-between border-b border-black/5 bg-white/70 px-6 pb-3 pt-4 text-[12px] font-bold text-ink backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="tracking-[0.2em]">{formatGameDayLabel(gameTime)} {formatGameClock(gameTime)}</span>
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] uppercase tracking-wider text-wine/70 shadow-sm ring-1 ring-black/5">
          {aiEnabled ? s.aiCloud : s.aiFallback}
        </span>
      </div>
      <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-wider">
        <motion.span 
          ref={moneyRef}
          key={money}
          initial={{ scale: 1.2, color: '#10b981' }}
          animate={{ scale: 1, color: '#9f5821' }}
          className="rounded-full bg-orange-100/50 px-2.5 py-1 font-bold text-[#9f5821] shadow-sm ring-1 ring-orange-200/50"
        >
          ¥ {money}
        </motion.span>
        <span
          className={`rounded-full px-2.5 py-1 font-bold shadow-sm ring-1 ${
            timeStatus === 'working'
              ? 'bg-amber-100/80 text-amber-700 ring-amber-200/50'
              : 'bg-emerald-100/80 text-emerald-700 ring-emerald-200/50'
          }`}
        >
          {timeStatus === 'working' ? s.working : s.idle}
        </span>
      </div>
    </div>
  )
}
