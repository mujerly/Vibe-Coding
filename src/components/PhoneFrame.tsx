import type { ReactNode } from 'react'
import { StatusBar } from './StatusBar'

interface PhoneFrameProps {
  children: ReactNode
  footer?: ReactNode
  gameTime: number
  money: number
  timeStatus: 'idle' | 'working'
}

export function PhoneFrame({
  children,
  footer,
  gameTime,
  money,
  timeStatus,
}: PhoneFrameProps) {
  return (
    <div className="relative mx-auto w-full max-w-[420px] rounded-[48px] bg-[#1a1518] p-3.5 shadow-2xl ring-1 ring-white/10">
      <div className="pointer-events-none absolute left-1/2 top-4 h-7 w-36 -translate-x-1/2 rounded-full bg-[#0a0508] shadow-inner" />
      <div className="flex h-[800px] flex-col overflow-hidden rounded-[38px] bg-[linear-gradient(180deg,#ffffff,#f8f9fa)] shadow-inner ring-1 ring-black/5">
        <StatusBar gameTime={gameTime} money={money} timeStatus={timeStatus} />
        <div className="min-h-0 flex-1">{children}</div>
        {footer}
      </div>
    </div>
  )
}
