import type { AppTab } from '../store/gameTypes'
import { uiStrings } from '../data'

interface NavBarProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

const navItems: Array<{ id: AppTab; labelKey: keyof typeof uiStrings.nav; icon: string }> = [
  { id: 'chat', labelKey: 'chat', icon: '💬' },
  { id: 'work', labelKey: 'work', icon: '💻' },
  { id: 'shop', labelKey: 'shop', icon: '🎁' },
  { id: 'stats', labelKey: 'stats', icon: '📊' },
]

export function NavBar({ activeTab, onTabChange }: NavBarProps) {
  return (
    <nav className="grid grid-cols-4 gap-2 border-t border-white/70 bg-white/70 px-3 py-3 backdrop-blur">
      {navItems.map((item) => {
        const active = item.id === activeTab

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`rounded-2xl px-2 py-2 text-center transition ${
              active
                ? 'bg-wine text-white shadow-soft'
                : 'bg-white/70 text-wine/80 hover:bg-white hover:text-wine'
            }`}
          >
            <div className="text-base">{item.icon}</div>
            <div className="mt-1 text-[11px] font-medium">{uiStrings.nav[item.labelKey]}</div>
          </button>
        )
      })}
    </nav>
  )
}
