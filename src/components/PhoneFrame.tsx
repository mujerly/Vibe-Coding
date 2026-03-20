import type { ReactNode } from 'react'
import { StatusBar } from './StatusBar'

interface PhoneFrameProps {
  children: ReactNode
  footer?: ReactNode
  money: number
  timeStatus: 'idle' | 'working'
}

export function PhoneFrame({
  children,
  footer,
  money,
  timeStatus,
}: PhoneFrameProps) {
  return (
    <div className="relative mx-auto w-full max-w-[420px] rounded-[42px] bg-[#1f1219] p-3 shadow-phone">
      <div className="pointer-events-none absolute left-1/2 top-4 h-6 w-32 -translate-x-1/2 rounded-full bg-[#11090e]" />
      <div className="flex h-[780px] flex-col overflow-hidden rounded-[34px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,247,243,0.98))]">
        <StatusBar money={money} timeStatus={timeStatus} />
        <div className="min-h-0 flex-1">{children}</div>
        {footer}
      </div>
    </div>
  )
}
