import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { giftAdvice } from './shopData'
import { t, uiStrings } from '../../data'
import { getPurchaseTimeCost } from '../../utils/timeSystem'

interface ShopPageProps {
  pageLabel?: string
  pageTitle?: string
  pageSubtitle?: string
}

export function ShopPage({
  pageLabel,
  pageTitle,
  pageSubtitle,
}: ShopPageProps = {}) {
  const shopItems = useGameStore((state) => state.economy.shopItems)
  const inventory = useGameStore((state) => state.player.inventory)
  const money = useGameStore((state) => state.player.money)
  const buyGift = useGameStore((state) => state.buyGift)
  const [feedback, setFeedback] = useState<string | null>(null)

  const s = uiStrings.shop
  const topLabel = pageLabel ?? s.topLabel
  const title = pageTitle ?? s.title
  const subtitle = pageSubtitle ?? s.subtitle

  useEffect(() => {
    if (!feedback) return undefined
    const timer = window.setTimeout(() => setFeedback(null), 2500)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const inventoryCounts = inventory.reduce<Record<string, number>>((acc, gift) => {
    acc[gift.id] = (acc[gift.id] ?? 0) + 1
    return acc
  }, {})

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="scrollbar-hidden flex h-full flex-col overflow-y-auto px-4 pb-6 pt-5"
    >
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="rounded-[28px] bg-[linear-gradient(135deg,#fff6ef,#ffd6cf)] px-6 py-6 shadow-lg ring-1 ring-black/5"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-wine/50">{topLabel}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-1.5 text-[13px] font-medium text-wine/65">{subtitle}</p>
          </div>
          <div className="rounded-[20px] bg-white/90 px-4 py-3 text-right shadow-sm ring-1 ring-black/5">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-wine/40">{s.balance}</div>
            <div className="mt-0.5 text-xl font-bold text-wine">¥ {money}</div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {feedback ? (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-600 shadow-sm">{feedback}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-5 grid gap-4">
        {shopItems.map((gift, index) => {
          const count = inventoryCounts[gift.id] ?? 0
          const canAfford = money >= gift.price

          return (
            <motion.div 
              key={gift.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-rose-50/80 text-3xl shadow-sm">
                    {gift.emoji}
                  </div>
                  <div className="py-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[16px] font-bold text-ink">{gift.name}</h2>
                      {count > 0 ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 shadow-sm">
                          {s.backpackCount} {count}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[13px] font-medium text-wine/65">{gift.description}</p>
                    <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-wine/45">{giftAdvice[gift.id]}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-lg font-bold text-rose-500">¥ {gift.price}</div>
                  <motion.button
                    whileHover={canAfford ? { scale: 1.05 } : {}}
                    whileTap={canAfford ? { scale: 0.95 } : {}}
                    type="button"
                    onClick={() => {
                      const result = buyGift(gift.id)
                      setFeedback(
                        result.ok
                          ? t(s.purchasedWithTime, {
                              name: `${gift.emoji}${gift.name}`,
                              minutes: getPurchaseTimeCost(gift.id),
                            })
                          : result.error ?? s.purchaseFailed,
                      )
                    }}
                    disabled={!canAfford}
                    className="mt-3 rounded-[16px] bg-[linear-gradient(135deg,#ff7aa2,#ff5c8a)] px-4 py-2.5 text-[13px] font-bold text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  >
                    {canAfford ? s.buyButton : s.insufficientFunds}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
