import { useGameStore } from '../../store/gameStore'
import { uiStrings } from '../../data'

interface GiftPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (giftId: string) => void
}

export function GiftPicker({ open, onClose, onSelect }: GiftPickerProps) {
  const inventory = useGameStore((state) => state.player.inventory)
  const s = uiStrings.giftPicker

  if (!open) return null

  const groupedInventory = Object.values(
    inventory.reduce<Record<string, { id: string; emoji: string; name: string; count: number }>>(
      (acc, gift) => {
        if (!acc[gift.id]) {
          acc[gift.id] = {
            id: gift.id,
            emoji: gift.emoji,
            name: gift.name,
            count: 0,
          }
        }
        acc[gift.id].count += 1
        return acc
      },
      {},
    ),
  )

  return (
    <div className="absolute inset-0 z-20 flex items-end bg-[#1f1219]/35 p-3 backdrop-blur-sm">
      <div className="w-full rounded-[28px] bg-white p-4 shadow-phone">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">{s.title}</h3>
            <p className="text-sm text-wine/55">{s.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600"
          >
            {s.close}
          </button>
        </div>

        {groupedInventory.length === 0 ? (
          <div className="rounded-3xl bg-cream px-4 py-5 text-center text-sm text-wine/60">
            {s.empty}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {groupedInventory.map((gift) => (
              <button
                key={gift.id}
                type="button"
                onClick={() => onSelect(gift.id)}
                className="rounded-3xl border border-rose-100 bg-rose-50/50 px-3 py-4 text-left transition hover:border-rose-200 hover:bg-rose-50"
              >
                <div className="text-2xl">{gift.emoji}</div>
                <div className="mt-2 text-sm font-semibold text-ink">{gift.name}</div>
                <div className="mt-1 text-xs text-wine/55">{s.stock} {gift.count}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
