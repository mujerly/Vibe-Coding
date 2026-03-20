import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { slotSymbolConfigs, t, uiStrings } from '../../data'
import type { SlotSymbolConfig } from '../../data/types'
import { useGameStore } from '../../store/gameStore'
import type { JobDefinition } from '../../store/gameTypes'

interface SlotGameProps {
  job: JobDefinition
  onSpinComplete: (result: SlotSpinResult) => void
  onExit: () => void
}

export interface SlotSpinResult {
  payout: number
  cost: number
  net: number
  symbolName?: string
  isWin: boolean
  isJackpot: boolean
}

const slotSymbols = slotSymbolConfigs
const totalWeight = slotSymbols.reduce((sum, symbol) => sum + symbol.weight, 0)

const pickWeightedSymbol = () => {
  let cursor = Math.random() * totalWeight

  for (const symbol of slotSymbols) {
    cursor -= symbol.weight
    if (cursor <= 0) return symbol
  }

  return slotSymbols[slotSymbols.length - 1]
}

const randomReels = (): [SlotSymbolConfig, SlotSymbolConfig, SlotSymbolConfig] => [
  pickWeightedSymbol(),
  pickWeightedSymbol(),
  pickWeightedSymbol(),
]

export function SlotGame({ job, onSpinComplete, onExit }: SlotGameProps) {
  const s = uiStrings.earning
  const currentJob = useGameStore((state) => state.player.currentJob)
  const money = useGameStore((state) => state.player.money)
  const spinCost = job.cost ?? 5
  const jackpot = slotSymbols[slotSymbols.length - 1].payout
  const [reels, setReels] = useState<[SlotSymbolConfig, SlotSymbolConfig, SlotSymbolConfig]>(() => randomReels())
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<SlotSpinResult | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [])

  const spinCount = currentJob?.spinCount ?? 0
  const sessionEarned = currentJob?.sessionEarned ?? 0
  const sessionSpent = currentJob?.sessionSpent ?? 0
  const sessionNet = sessionEarned - sessionSpent
  const busySeconds = currentJob
    ? Math.max(
        Math.max(1, Math.ceil((now - currentJob.startTime) / 1000)),
        currentJob.trackedDuration,
      )
    : 0

  const spin = () => {
    if (isSpinning || money < spinCost) return

    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current)
    }

    const finalReels = randomReels()
    const matched =
      finalReels[0].id === finalReels[1].id && finalReels[1].id === finalReels[2].id
        ? finalReels[0]
        : undefined

    const nextResult: SlotSpinResult = {
      payout: matched?.payout ?? 0,
      cost: spinCost,
      net: (matched?.payout ?? 0) - spinCost,
      symbolName: matched?.label,
      isWin: Boolean(matched),
      isJackpot: matched?.id === 'crown',
    }

    setIsSpinning(true)
    setResult(null)

    let ticks = 0
    intervalRef.current = window.setInterval(() => {
      ticks += 1
      setReels(randomReels())

      if (ticks < 14) return

      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      setReels(finalReels)
      setResult(nextResult)
      setIsSpinning(false)
      onSpinComplete(nextResult)
    }, 90)
  }

  const canSpin = !isSpinning && money >= spinCost
  const resultTone = result?.isWin ? 'emerald' : 'rose'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="scrollbar-hidden flex h-full flex-col overflow-y-auto px-4 pb-6 pt-5"
    >
      <div className="rounded-[30px] bg-[linear-gradient(145deg,#34111d,#7a1734_55%,#b6413d)] px-6 py-5 text-white shadow-[0_18px_40px_rgba(96,18,48,0.34)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/60">
              {job.emoji} {job.name}
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-tight">{s.slotTitle}</h1>
            <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-white/80">
              {t(s.slotSubtitle, { cost: spinCost })}
            </p>
          </div>
          <div className="space-y-2 text-right text-xs font-semibold">
            <div className="rounded-full bg-white/14 px-3.5 py-2 text-white/90">
              {t(s.slotSpinCost, { cost: spinCost })}
            </div>
            <div className="rounded-full bg-[#ffe59a] px-3.5 py-2 text-[#713f12]">
              {t(s.slotJackpot, { reward: jackpot })}
            </div>
            <button
              type="button"
              onClick={onExit}
              disabled={isSpinning}
              className="w-full rounded-full bg-white/15 px-3.5 py-2 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {s.slotExitButton}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[12px] font-semibold">
          <div className="rounded-[20px] bg-white/10 px-3 py-3">
            <div className="text-white/60">{s.slotSpinCount}</div>
            <div className="mt-1 text-xl text-white">{spinCount}</div>
          </div>
          <div className="rounded-[20px] bg-white/10 px-3 py-3">
            <div className="text-white/60">{s.slotBusyTime}</div>
            <div className="mt-1 text-xl text-white">{busySeconds}s</div>
          </div>
          <div className="rounded-[20px] bg-white/10 px-3 py-3">
            <div className="text-white/60">{s.slotNet}</div>
            <div className={`mt-1 text-xl ${sessionNet >= 0 ? 'text-[#ffe59a]' : 'text-rose-200'}`}>
              ¥{sessionNet}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[22px] bg-white/10 px-4 py-3 text-[13px] font-medium text-white/78 backdrop-blur">
          {s.slotRules}
        </div>
      </div>

      <div className="mt-5 rounded-[30px] bg-[linear-gradient(180deg,#fff7eb,#fff1e0)] p-5 shadow-lg ring-1 ring-black/5">
        <div className="rounded-[26px] bg-[#2d1020] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="grid grid-cols-3 gap-3">
            {reels.map((symbol, index) => (
              <motion.div
                key={`${symbol.id}-${index}-${isSpinning ? 'spin' : 'idle'}`}
                initial={{ y: -10, opacity: 0.7 }}
                animate={{ y: 0, opacity: 1, rotate: isSpinning ? [0, -2, 2, 0] : 0 }}
                transition={{ duration: 0.18 }}
                className={`flex h-28 items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#fffdf8,#fff6ea)] text-5xl ring-1 ring-white/70 ${symbol.glowClassName}`}
              >
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,var(--tw-gradient-from),var(--tw-gradient-to))] ${symbol.panelClassName}`}
                >
                  {symbol.icon}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3 rounded-[22px] bg-white/8 px-4 py-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">{s.slotResult}</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={
                    result
                      ? `${result.isWin}-${result.symbolName ?? 'miss'}-${result.net}`
                      : isSpinning
                        ? 'spinning'
                        : 'idle'
                  }
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-1.5"
                >
                  {result ? (
                    <>
                      <div className={`text-base font-bold ${resultTone === 'emerald' ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {result.isWin ? `${result.symbolName} 三连` : '空转，未中奖'}
                      </div>
                      <div className="mt-1 text-[13px] text-white/70">
                        {result.isWin
                          ? `${s.slotPayout} ¥${result.payout} · ${s.slotNet} ¥${result.net}`
                          : `${s.slotNet} -¥${result.cost}`}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-base font-bold text-white">{isSpinning ? s.slotSpinning : '继续拉一把'}</div>
                      <div className="mt-1 text-[13px] text-white/65">
                        {canSpin ? s.slotRules : t(s.slotNeedMoney, { cost: spinCost })}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={canSpin ? { scale: 1.03, y: -2 } : {}}
              whileTap={canSpin ? { scale: 0.98 } : {}}
              type="button"
              onClick={spin}
              disabled={!canSpin}
              className="rounded-[22px] bg-[linear-gradient(180deg,#ffd970,#ff9f43)] px-5 py-4 text-sm font-bold text-[#5a2300] shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
            >
              {isSpinning ? s.slotSpinning : t(s.slotSpinButton, { cost: spinCost })}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[28px] bg-white px-5 py-5 shadow-md ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{s.slotOddsTitle}</h2>
          <div className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            {s.slotChance}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {slotSymbols.map((symbol) => (
            <div
              key={symbol.id}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-[22px] bg-slate-50 px-4 py-3"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,var(--tw-gradient-from),var(--tw-gradient-to))] text-2xl ${symbol.panelClassName}`}
              >
                {symbol.icon}
              </div>
              <div>
                <div className="text-[15px] font-bold text-ink">{symbol.label}</div>
                <div className="mt-1 text-[12px] font-medium text-wine/55">
                  {s.slotChance} {symbol.weight}%
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-wine/70 shadow-sm">
                {s.slotPayout}
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-rose-500">¥ {symbol.payout}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-wine/45">
                  {symbol.rarityLabel}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
