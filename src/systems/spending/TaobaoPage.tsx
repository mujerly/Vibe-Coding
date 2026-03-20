import { useState } from 'react'
import { uiStrings } from '../../data'
import { useGameStore } from '../../store/gameStore'
import { EarningPage } from '../earning/EarningPage'
import { ShopPage } from './ShopPage'

type TaobaoSection = 'shop' | 'review'

export function TaobaoPage() {
  const currentJobType = useGameStore((state) => state.player.currentJob?.type)
  const s = uiStrings.taobao
  const [section, setSection] = useState<TaobaoSection>('shop')
  const activeSection: TaobaoSection =
    currentJobType === 'taobao-review' ? 'review' : section

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/70 bg-white/72 px-4 pb-3 pt-4 backdrop-blur">
        <div className="grid grid-cols-2 gap-2 rounded-[22px] bg-[#f7ede8] p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setSection('shop')}
            className={`rounded-[18px] px-3 py-2 text-sm font-semibold transition ${
              activeSection === 'shop' ? 'bg-white text-ink shadow-soft' : 'text-wine/60'
            }`}
          >
            {s.shopTab}
          </button>
          <button
            type="button"
            onClick={() => setSection('review')}
            className={`rounded-[18px] px-3 py-2 text-sm font-semibold transition ${
              activeSection === 'review' ? 'bg-white text-ink shadow-soft' : 'text-wine/60'
            }`}
          >
            {s.reviewTab}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {activeSection === 'shop' ? (
          <ShopPage
            pageLabel="淘宝"
            pageTitle={s.shopTitle}
            pageSubtitle={s.shopSubtitle}
          />
        ) : (
          <EarningPage
            jobIds={['taobao-review']}
            pageLabel="淘宝"
            pageTitle={s.reviewTitle}
            pageSubtitle={s.reviewSubtitle}
          />
        )}
      </div>
    </div>
  )
}
