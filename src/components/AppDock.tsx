import type { AppTab } from '../store/gameTypes'
import type { PhoneAppConfig } from '../data/types'

interface AppDockProps {
  apps: PhoneAppConfig[]
  unreadCount: number
  currentJobApp?: AppTab | null
  onOpenApp: (appId: AppTab) => void
}

export function AppDock({ apps, unreadCount, currentJobApp, onOpenApp }: AppDockProps) {
  return (
    <div className="border-t border-white/70 bg-white/72 px-3 py-3 backdrop-blur">
      <div className="grid grid-cols-4 gap-2 rounded-[28px] bg-white/72 px-3 py-3 shadow-soft">
        {apps.map((app) => {
          const isUnreadApp = app.appId === 'wechat' && unreadCount > 0
          const isWorkingApp = currentJobApp === app.appId

          return (
            <button
              key={app.id}
              type="button"
              onClick={() => onOpenApp(app.appId)}
              className="relative rounded-[20px] px-2 py-2 text-center transition hover:bg-white/80"
            >
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] text-xl font-bold shadow-sm"
                style={{
                  backgroundColor: app.iconBackground,
                  color: app.iconColor,
                }}
              >
                {app.icon}
              </div>
              <div className="mt-2 text-[11px] font-medium text-wine/75">{app.name}</div>

              {isUnreadApp ? (
                <span className="absolute right-4 top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}

              {isWorkingApp ? (
                <span className="absolute bottom-3 right-5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
