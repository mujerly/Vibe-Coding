import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { jobs } from './jobs'
import { DeliveryGame } from './DeliveryGame'
import { ReviewGame } from './ReviewGame'
import { useGameStore } from '../../store/gameStore'
import { t, uiStrings } from '../../data'

export function EarningPage() {
  const currentJob = useGameStore((state) => state.player.currentJob)
  const timeStatus = useGameStore((state) => state.player.timeStatus)
  const startWork = useGameStore((state) => state.startWork)
  const finishWork = useGameStore((state) => state.finishWork)
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

  const currentJobMeta = jobs.find((job) => job.id === currentJob?.type)
  const effectiveNow = currentJob ? Math.max(now, currentJob.startTime) : now
  const progress = currentJob
    ? Math.min(1, (effectiveNow - currentJob.startTime) / (currentJob.duration * 1000))
    : 0
  const remainingSeconds = currentJob
    ? Math.max(0, Math.ceil(currentJob.duration * (1 - progress)))
    : 0
  const currentJobMode = currentJobMeta?.mode ?? 'timed'

  const handleInteractiveComplete = () => {
    const reward = finishWork()
    if (reward > 0 && currentJobMeta) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffcf70', '#ff7aa2', '#1890ff', '#ffd85e']
      })
      setFeedback(t(s.manualSettled, { name: currentJobMeta.name, reward }))
    }
  }

  if (timeStatus === 'working' && currentJob && currentJobMeta && currentJobMode === 'delivery') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex h-full flex-col"
      >
        <AnimatePresence>
          {feedback ? (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-4 pt-4"
            >
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-sm">{feedback}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <DeliveryGame
          key={`${currentJob.type}-${currentJob.startTime}`}
          job={currentJobMeta}
          reward={currentJob.reward}
          onComplete={handleInteractiveComplete}
        />
      </motion.div>
    )
  }

  if (timeStatus === 'working' && currentJob && currentJobMeta && currentJobMode === 'review') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex h-full flex-col"
      >
        <AnimatePresence>
          {feedback ? (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-4 pt-4"
            >
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-sm">{feedback}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <ReviewGame
          key={`${currentJob.type}-${currentJob.startTime}`}
          job={currentJobMeta}
          reward={currentJob.reward}
          onComplete={handleInteractiveComplete}
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
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/60">{s.topLabel}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">{s.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          {s.subtitle}
        </p>
      </motion.div>

      <AnimatePresence>
        {feedback ? (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-sm">{feedback}</div>
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-ink">
                  <span className="text-xl">{currentJobMeta.emoji}</span>
                  <span>{currentJobMeta.name}</span>
                </div>
                <div className="mt-1 text-[13px] font-medium text-wine/60">{s.estimatedIncome} <span className="text-rose-500">¥{currentJob.reward}</span></div>
              </div>
              <div className="rounded-full bg-amber-100/80 px-3.5 py-1.5 text-xs font-bold text-amber-700 shadow-sm">
                {s.remaining} {remainingSeconds}{s.timeUnit}
              </div>
            </div>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-rose-100/50">
              <motion.div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ffcf70,#ff7aa2)] shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
            </div>
            <p className="mt-4 text-[13px] font-medium text-wine/65">{s.workingWarning}</p>
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
        {jobs.map((job, index) => (
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
                  {job.rewardRange ? `¥${job.rewardRange[0]}-${job.rewardRange[1]}` : `¥${job.reward}`}
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-wine/50">{job.duration} {s.timeUnit}</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
