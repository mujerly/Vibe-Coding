import { uiStrings } from '../data'

interface HomeBarProps {
  onGoHome: () => void
}

export function HomeBar({ onGoHome }: HomeBarProps) {
  return (
    <div className="border-t border-white/70 bg-white/72 px-4 py-3 backdrop-blur">
      <button
        type="button"
        onClick={onGoHome}
        className="mx-auto flex min-w-28 items-center justify-center rounded-full bg-wine px-5 py-2.5 text-sm font-semibold text-white shadow-soft"
      >
        {uiStrings.desktop.homeButton}
      </button>
    </div>
  )
}
