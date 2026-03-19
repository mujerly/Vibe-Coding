import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { giftAdvice } from './shopData'

export function ShopPage() {
  const shopItems = useGameStore((state) => state.economy.shopItems)
  const inventory = useGameStore((state) => state.player.inventory)
  const money = useGameStore((state) => state.player.money)
  const buyGift = useGameStore((state) => state.buyGift)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!feedback) return undefined
    const timer = window.setTimeout(() => setFeedback(null), 2200)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const inventoryCounts = inventory.reduce<Record<string, number>>((acc, gift) => {
    acc[gift.id] = (acc[gift.id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="scrollbar-hidden flex h-full flex-col overflow-y-auto px-4 pb-4 pt-5">
      <div className="rounded-[30px] bg-[linear-gradient(135deg,#fff6ef,#ffd6cf)] px-5 py-5 shadow-soft">
        <p className="text-xs uppercase tracking-[0.28em] text-wine/45">花钱系统</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-ink">恋爱供给站</h1>
            <p className="mt-2 text-sm leading-6 text-wine/65">买对礼物，比盲目花钱更重要。</p>
          </div>
          <div className="rounded-2xl bg-white/80 px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-[0.24em] text-wine/35">余额</div>
            <div className="text-xl font-semibold text-wine">¥ {money}</div>
          </div>
        </div>
      </div>

      {feedback ? (
        <div className="mt-4 rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{feedback}</div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {shopItems.map((gift) => {
          const count = inventoryCounts[gift.id] ?? 0
          const canAfford = money >= gift.price

          return (
            <div key={gift.id} className="rounded-[28px] bg-white px-4 py-4 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-2xl">
                    {gift.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-ink">{gift.name}</h2>
                      {count > 0 ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700">
                          背包 {count}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-wine/65">{gift.description}</p>
                    <p className="mt-2 text-xs text-wine/45">{giftAdvice[gift.id]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-wine">¥ {gift.price}</div>
                  <button
                    type="button"
                    onClick={() => {
                      const result = buyGift(gift.id)
                      setFeedback(result.ok ? `已购买 ${gift.emoji}${gift.name}` : result.error ?? '购买失败')
                    }}
                    disabled={!canAfford}
                    className="mt-3 rounded-2xl bg-wine px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-wine/25"
                  >
                    {canAfford ? '购买' : '余额不足'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
