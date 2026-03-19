import { useEffect, useState } from 'react'
import { jobs } from './jobs'
import { useGameStore } from '../../store/gameStore'
import { uiStrings } from '../../data'

export function EarningPage() {
  const currentJob = useGameStore((state) => state.player.currentJob)
  const timeStatus = useGameStore((state) => state.player.timeStatus)
  const startWork = useGameStore((state) => state.startWork)
  const [now, setNow] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)

  const s = uiStrings.earning

  useEffect(() => {
    if (!feedback) return undefined
    const timer = window.setTimeout(() => setFeedback(null), 2200)
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

  return (
    <div className="scrollbar-hidden flex h-full flex-col overflow-y-auto px-4 pb-4 pt-5">
      <div className="rounded-[30px] bg-[linear-gradient(135deg,#29161f,#5a2c45)] px-5 py-5 text-white shadow-phone">
        <p className="text-xs uppercase tracking-[0.28em] text-white/55">{s.topLabel}</p>
        <h1 className="mt-2 font-display text-2xl">{s.title}</h1>
        <p className="mt-2 text-sm leading-6 text-white/75">
          {s.subtitle}
        </p>
      </div>

      {feedback ? (
        <div className="mt-4 rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{feedback}</div>
      ) : null}

      {timeStatus === 'working' && currentJob && currentJobMeta ? (
        <div className="mt-4 rounded-[30px] bg-white px-4 py-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ink">
                {currentJobMeta.emoji} {currentJobMeta.name}
              </div>
              <div className="mt-1 text-xs text-wine/55">{s.estimatedIncome} ¥{currentJob.reward}</div>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-2 text-xs font-medium text-amber-700">
              {s.remaining} {remainingSeconds}{s.timeUnit}
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-rose-100">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#ffcf70,#ff7aa2)] transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-wine/65">{s.workingWarning}</p>
        </div>
      ) : (
        <div className="mt-4 rounded-[28px] bg-white px-4 py-4 text-sm text-wine/65 shadow-soft">
          {s.idleHint}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {jobs.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => {
              const result = startWork(job.id)
              setFeedback(result.ok ? s.jobStarted.replace('{name}', job.name) : result.error ?? s.jobFailed)
            }}
            disabled={timeStatus === 'working'}
            className="w-full rounded-[28px] bg-white px-4 py-4 text-left shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-2xl">
                  {job.emoji}
                </div>
                <div>
                  <div className="text-base font-semibold text-ink">{job.name}</div>
                  <div className="mt-1 text-sm text-wine/60">{job.description}</div>
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-wine">
                  {job.rewardRange ? `¥${job.rewardRange[0]}-${job.rewardRange[1]}` : `¥${job.reward}`}
                </div>
                <div className="mt-1 text-xs text-wine/50">{job.duration} {s.timeUnit}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
