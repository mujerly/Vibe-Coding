import { motion } from 'framer-motion'
import { getRelationshipStage } from '../girls/affectionLogic'
import type { GirlState } from '../../store/gameTypes'
import { Avatar } from '../../components/Avatar'
import { uiStrings } from '../../data'
import { getGirlStickerById } from './stickerProtocol'

interface ChatListProps {
  girls: Record<string, GirlState>
  onOpen: (girlId: string) => void
}

const formatTimestamp = (timestamp: number) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))

const affectionTone = (affection: number) => {
  if (affection >= 80) return 'text-rose-600'
  if (affection >= 60) return 'text-rose-500'
  if (affection >= 40) return 'text-orange-500'
  return 'text-slate-400'
}

export function ChatList({ girls, onOpen }: ChatListProps) {
  const s = uiStrings.chatList
  const sortedGirls = Object.values(girls).sort((a, b) => {
    const aLast = a.chatHistory[a.chatHistory.length - 1]?.timestamp ?? a.lastContactTime
    const bLast = b.chatHistory[b.chatHistory.length - 1]?.timestamp ?? b.lastContactTime
    return bLast - aLast
  })

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col"
    >
      <div className="border-b border-black/5 bg-white/40 px-6 pb-5 pt-6 backdrop-blur-md">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-wine/50">{s.topLabel}</p>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{s.title}</h1>
            <p className="mt-1.5 text-[13px] font-medium text-wine/60">{s.subtitle}</p>
          </div>
          <div className="rounded-[20px] bg-white/90 px-4 py-3 text-right shadow-sm ring-1 ring-black/5">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-wine/40">{s.sessionCount}</div>
            <div className="mt-0.5 text-xl font-bold text-ink">{sortedGirls.length}</div>
          </div>
        </div>
      </div>

      <div className="scrollbar-hidden flex-1 overflow-y-auto px-4 pb-6 pt-4">
        {sortedGirls.map((girl, index) => {
          const lastMessage = girl.chatHistory[girl.chatHistory.length - 1]
          const lastSticker = getGirlStickerById(girl.profile.id, lastMessage?.stickerId)
          const lastPreview = lastSticker
            ? s.stickerPreview
            : lastMessage?.content || '还没有聊过，主动打个招呼？'

          return (
            <motion.button
              key={girl.profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => onOpen(girl.profile.id)}
              className="mb-3.5 flex w-full items-start gap-4 rounded-[24px] bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition-colors hover:bg-slate-50"
            >
              <div className="relative shrink-0">
                <div className="shadow-sm rounded-[22px]">
                  <Avatar avatar={girl.profile.avatar} name={girl.profile.name} size="lg" />
                </div>
                {girl.unreadCount > 0 ? (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white shadow-md ring-2 ring-white"
                  >
                    {girl.unreadCount}
                  </motion.span>
                ) : null}
              </div>

              <div className="min-w-0 flex-1 py-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h2 className="truncate text-[16px] font-bold text-ink">{girl.profile.name}</h2>
                      <span className={`text-[13px] font-bold ${affectionTone(girl.affection)}`}>♥ {girl.affection}</span>
                    </div>
                    <p className="mt-1 text-[12px] font-medium text-wine/55">
                      {getRelationshipStage(girl.affection)} · {s.statusLabels[girl.status] ?? girl.status}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold tracking-wider text-wine/40">
                    {lastMessage ? formatTimestamp(lastMessage.timestamp) : '--:--'}
                  </span>
                </div>

                <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-wine/65">
                  {lastPreview}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
