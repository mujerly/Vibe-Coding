import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { DeliveryGame } from './DeliveryGame'
import { jobs } from './jobs'
import { ReviewGame } from './ReviewGame'
import { SlotGame, type SlotSpinResult } from './SlotGame'
import { useGameStore } from '../../store/gameStore'
import { t, uiStrings } from '../../data'

interface EarningPageProps {
  jobIds?: string[]
  pageLabel?: string
  pageTitle?: string
  pageSubtitle?: string
}

export function EarningPage({
  jobIds,
  pageLabel,
  pageTitle,
  pageSubtitle,
}: EarningPageProps = {}) {
  const currentJob = useGameStore((state) => state.player.currentJob)
  const timeStatus = useGameStore((state) => state.player.timeStatus)
  const startWork = useGameStore((state) => state.startWork)
  const finishWork = useGameStore((state) => state.finishWork)
  const applyWorkOutcome = useGameStore((state) => state.applyWorkOutcome)
  const [now, setNow] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)

  const s = uiStrings.earning

  useEffect(() => {
    if (!feedback) return undefined

    const timer = window.setTimeout(() => setFeedback(null), 2500)
    return () => window.clearTimeout(timer)
  }, [feedback])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const visibleJobs = jobIds?.length ? jobs.filter((job) => jobIds.includes(job.id)) : jobs
  const currentJobMeta = jobs.find((job) => job.id === currentJob?.type)
  const effectiveNow = currentJob ? Math.max(now, currentJob.startTime) : now
  const progress = currentJob
    ? Math.min(1, (effectiveNow - currentJob.startTime) / (currentJob.duration * 1000))
    : 0
  const remainingSeconds = currentJob
    ? Math.max(0, Math.ceil(currentJob.duration * (1 - progress)))
    : 0
  const currentJobMode = currentJobMeta?.mode ?? 'timed'
  const ownsCurrentJob = currentJobMeta ? visibleJobs.some((job) => job.id === currentJobMeta.id) : true
  const topLabel = pageLabel ?? s.topLabel
  const title = pageTitle ?? (visibleJobs.length === 1 ? visibleJobs[0].name : s.title)
  const subtitle = pageSubtitle ?? (visibleJobs.length === 1 ? visibleJobs[0].description : s.subtitle)
  const focus = currentJob?.focus ?? 100

  const renderFeedback = (paddingClassName: string) => (
    <AnimatePresence>
      {feedback ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={paddingClassName}
        >
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-sm">
            {feedback}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )

  const handleInteractiveComplete = () => {
    const reward = finishWork()
    if (!currentJobMeta) return

    if (reward <= 0) {
      setFeedback(t(s.workFailed, { name: currentJobMeta.name }))
      return
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffcf70', '#ff7aa2', '#1890ff', '#ffd85e'],
    })
    setFeedback(t(s.manualSettled, { name: currentJobMeta.name, reward }))
  }

  const handleSlotSpin = (result: SlotSpinResult) => {
    const settlement = applyWorkOutcome(result.payout, result.cost)
    if (!settlement) return

    if (result.isJackpot) {
      confetti({
        particleCount: 180,
        spread: 95,
        origin: { y: 0.58 },
        colors: ['#ffe066', '#ffb703', '#ff7aa2', '#fff4bf'],
      })
    } else if (result.isWin) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffcf70', '#ff7aa2', '#1890ff', '#ffd85e'],
      })
    }

    if (result.isJackpot) {
      setFeedback(
        t(s.slotJackpotFeedback, {
          name: result.symbolName ?? s.slotTitle,
          reward: result.payout,
          net: settlement.net,
        }),
      )
      return
    }

    if (result.isWin) {
      setFeedback(
        t(s.slotWinFeedback, {
          name: result.symbolName ?? s.slotTitle,
          reward: result.payout,
          net: settlement.net,
        }),
      )
      return
    }

    setFeedback(t(s.slotLoseFeedback, { cost: result.cost }))
  }

  const handleSlotExit = () => {
    finishWork()
    setFeedback(s.slotExitFeedback)
  }

  if (
    timeStatus === 'working' &&
    currentJob &&
    currentJobMeta &&
    ownsCurrentJob &&
    currentJobMode === 'delivery'
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex h-full flex-col"
      >
        {renderFeedback('px-4 pt-4')}
        <DeliveryGame
          key={`${currentJob.type}-${currentJob.startTime}`}
          job={currentJobMeta}
          reward={currentJob.reward}
          onComplete={handleInteractiveComplete}
        />
      </motion.div>
    )
  }

  if (
    timeStatus === 'working' &&
    currentJob &&
    currentJobMeta &&
    ownsCurrentJob &&
    currentJobMode === 'review'
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex h-full flex-col"
      >
        {renderFeedback('px-4 pt-4')}
        <ReviewGame
          key={`${currentJob.type}-${currentJob.startTime}`}
          job={currentJobMeta}
          reward={currentJob.reward}
          onComplete={handleInteractiveComplete}
        />
      </motion.div>
    )
  }

  if (
    timeStatus === 'working' &&
    currentJob &&
    currentJobMeta &&
    ownsCurrentJob &&
    currentJobMode === 'slot'
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex h-full flex-col"
      >
        {renderFeedback('px-4 pt-4')}
        <SlotGame
          key={`${currentJob.type}-${currentJob.startTime}`}
          job={currentJobMeta}
          onSpinComplete={handleSlotSpin}
          onExit={handleSlotExit}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="scrollbar-hidden flex h-full flex-col overflow-y-auto px-4 pb-6 pt-5"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="rounded-[24px] bg-[linear-gradient(135deg,#29161f,#5a2c45)] px-6 py-6 text-white shadow-lg"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/60">{topLabel}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/80">{subtitle}</p>
      </motion.div>

      <AnimatePresence>
        {feedback ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-sm">
              {feedback}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {timeStatus === 'working' && currentJob && currentJobMeta ? (
          <motion.div
            key="working"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-5 rounded-[24px] bg-white px-5 py-5 shadow-md ring-1 ring-black/5"
          >
            {ownsCurrentJob ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-base font-bold text-ink">
                      <span className="text-xl">{currentJobMeta.emoji}</span>
                      <span>{currentJobMeta.name}</span>
                    </div>
                    <div className="mt-1 text-[13px] font-medium text-wine/60">
                      {s.estimatedIncome} <span className="text-rose-500">¥{currentJob.reward}</span>
                    </div>
                  </div>
                  <div className="rounded-full bg-amber-100/80 px-3.5 py-1.5 text-xs font-bold text-amber-700 shadow-sm">
                    {s.remaining} {remainingSeconds}
                    {s.timeUnit}
                  </div>
                </div>
                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-rose-100/50">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#ffcf70,#ff7aa2)] shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ ease: 'linear', duration: 1 }}
                  />
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-wine/60">
                    <span>{s.focusLabel}</span>
                    <span>{focus}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className={`h-full rounded-full ${
                        focus > 60
                          ? 'bg-emerald-400'
                          : focus > 30
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${focus}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>
                <p className="mt-4 text-[13px] font-medium text-wine/65">{s.workingWarning}</p>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-base font-bold text-ink">
                  <span className="text-xl">{currentJobMeta.emoji}</span>
                  <span>{currentJobMeta.name}</span>
                </div>
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {t(uiStrings.desktop.workingElsewhere, { name: currentJobMeta.name })}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-5 rounded-[20px] bg-white/80 px-5 py-4 text-center text-[13px] font-medium text-wine/60 shadow-sm ring-1 ring-black/5"
          >
            {s.idleHint}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 space-y-3.5">
        {visibleJobs.map((job, index) => (
          <motion.button
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={timeStatus === 'working' ? {} : { scale: 1.02, y: -2 }}
            whileTap={timeStatus === 'working' ? {} : { scale: 0.98 }}
            type="button"
            onClick={() => {
              const result = startWork(job.id)
              setFeedback(result.ok ? t(s.jobStarted, { name: job.name }) : result.error ?? s.jobFailed)
            }}
            disabled={timeStatus === 'working'}
            className="w-full rounded-[24px] bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-rose-50/80 text-3xl shadow-sm">
                  {job.emoji}
                </div>
                <div>
                  <div className="text-base font-bold text-ink">{job.name}</div>
                  <div className="mt-1 text-[13px] font-medium text-wine/60 line-clamp-1">{job.description}</div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-base font-bold text-rose-500">
                  {job.cost != null
                    ? `¥${job.cost}/次`
                    : job.rewardRange
                      ? `¥${job.rewardRange[0]}-${job.rewardRange[1]}`
                      : `¥${job.reward}`}
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-wine/50">
                  {job.cost != null
                    ? t(s.slotPayoutRange, {
                        min: job.rewardRange?.[0] ?? job.reward,
                        max: job.rewardRange?.[1] ?? job.reward,
                      })
                    : `${s.timeCostLabel} ${job.timeCostMinutes} 分钟`}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
