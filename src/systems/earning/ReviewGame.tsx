import { useState } from 'react'
import { motion } from 'framer-motion'
import type { JobDefinition } from '../../store/gameTypes'
import { t, uiStrings } from '../../data'

interface ReviewGameProps {
  job: JobDefinition
  reward: number
  onComplete: () => void
}

type ReviewCategory = 'match' | 'logistics' | 'service'

const categories: ReviewCategory[] = ['match', 'logistics', 'service']

export function ReviewGame({ job, reward, onComplete }: ReviewGameProps) {
  const s = uiStrings.earning
  const [ratings, setRatings] = useState<Record<ReviewCategory, number>>({
    match: 0,
    logistics: 0,
    service: 0,
  })
  const [comment, setComment] = useState('')

  const allMax = categories.every((category) => ratings[category] === 5)

  const effectiveComment = comment || (allMax ? s.reviewDefaultComment : '')

  const rows: Array<{ key: ReviewCategory; label: string }> = [
    { key: 'match', label: s.reviewCategoryMatch },
    { key: 'logistics', label: s.reviewCategoryLogistics },
    { key: 'service', label: s.reviewCategoryService },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="scrollbar-hidden flex h-full flex-col overflow-y-auto px-4 pb-6 pt-5"
    >
      <div className="rounded-[28px] bg-[linear-gradient(180deg,#fff2e6,#ffd8ba)] px-6 py-5 shadow-md ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#9f5821]/60">{job.emoji} {job.name}</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink tracking-tight">{s.reviewTitle}</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#9f5821]/80">{s.reviewSubtitle}</p>
          </div>
          <div className="rounded-[20px] bg-white/90 px-4 py-3 text-right text-xs font-medium text-[#9f5821] shadow-sm">
            <div className="uppercase tracking-wider opacity-80">{t(s.reviewReward, { reward })}</div>
            <div className="mt-1 text-xl font-bold text-[#e67e22]">¥ {reward}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[28px] bg-white px-5 py-5 shadow-lg ring-1 ring-black/5">
        <div className="rounded-[20px] bg-[#fff3e7] px-5 py-3.5 text-[13px] font-medium text-[#a55c1d] shadow-inner">
          {s.reviewTip}
        </div>

        <div className="mt-6 space-y-5">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <div className="text-[15px] font-bold text-ink">{row.label}</div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }, (_, index) => {
                  const starValue = index + 1
                  const filled = ratings[row.key] >= starValue

                  return (
                    <motion.button
                      key={starValue}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() =>
                        setRatings((current) => ({
                          ...current,
                          [row.key]: starValue,
                        }))
                      }
                      className={`text-3xl transition-colors drop-shadow-sm ${filled ? 'text-[#ffcf3f]' : 'text-slate-100'}`}
                    >
                      ★
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <label className="mt-6 block text-[13px] font-bold uppercase tracking-wider text-wine/60">{s.reviewCommentLabel}</label>
        <textarea
          value={effectiveComment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={s.reviewCommentPlaceholder}
          className="mt-3 h-32 w-full resize-none rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-medium leading-relaxed text-ink shadow-inner outline-none transition-all placeholder:text-wine/30 focus:bg-white focus:ring-2 focus:ring-[#ffb25b]/50"
        />

        <motion.button
          whileHover={allMax ? { scale: 1.02, y: -2 } : {}}
          whileTap={allMax ? { scale: 0.98 } : {}}
          type="button"
          onClick={() => {
            if (allMax) onComplete()
          }}
          disabled={!allMax}
          className="mt-6 w-full rounded-[24px] bg-[linear-gradient(180deg,#ffb356,#f08b2d)] px-5 py-4 text-[15px] font-bold text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {allMax ? s.reviewSubmit : s.reviewSubmitDisabled}
        </motion.button>
      </div>
    </motion.div>
  )
}
