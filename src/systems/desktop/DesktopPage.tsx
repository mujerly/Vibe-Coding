import type { AppTab } from '../../store/gameTypes'
import type { PhoneAppConfig } from '../../data/types'

interface DesktopPageProps {
  apps: PhoneAppConfig[]
  unreadCount: number
  currentJobApp?: AppTab | null
  onOpenApp: (appId: AppTab) => void
}

export function DesktopPage({ apps, unreadCount, currentJobApp, onOpenApp }: DesktopPageProps) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden px-5 pb-5 pt-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,214,0.35),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,220,186,0.32),transparent_30%),linear-gradient(180deg,#fffdf9,#fff4ef)]" />
      <div className="pointer-events-none absolute left-6 right-6 top-16 h-48 rounded-[36px] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0.06))]" />

      <div className="relative grid grid-cols-4 gap-x-4 gap-y-6">
        {apps.map((app) => {
          const isUnreadApp = app.appId === 'wechat' && unreadCount > 0
          const isWorkingApp = currentJobApp === app.appId

          return (
            <button
              key={app.id}
              type="button"
              onClick={() => onOpenApp(app.appId)}
              className="relative text-center"
            >
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] text-2xl font-bold shadow-soft ring-1 ring-black/5"
                style={{
                  backgroundColor: app.iconBackground,
                  color: app.iconColor,
                }}
              >
                {app.icon}
              </div>
              <div className="mt-2 text-[11px] font-medium text-ink/80">{app.name}</div>

              {isUnreadApp ? (
                <span className="absolute right-2 top-0 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}

              {isWorkingApp ? (
                <span className="absolute right-3 top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
