import { getRelationshipStage } from '../girls/affectionLogic'
import type { GirlState } from '../../store/gameTypes'
import { Avatar } from '../../components/Avatar'

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

const statusLabel: Record<GirlState['status'], string> = {
  normal: '状态正常',
  suspicious: '开始怀疑',
  angry: '正在生气',
  blocked: '已拉黑',
}

export function ChatList({ girls, onOpen }: ChatListProps) {
  const sortedGirls = Object.values(girls).sort((a, b) => {
    const aLast = a.chatHistory[a.chatHistory.length - 1]?.timestamp ?? 0
    const bLast = b.chatHistory[b.chatHistory.length - 1]?.timestamp ?? 0
    return bLast - aLast
  })

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/60 px-5 pb-4 pt-5">
        <p className="text-xs uppercase tracking-[0.3em] text-wine/45">微信分身</p>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink">渣男通讯录</h1>
            <p className="mt-1 text-sm text-wine/60">点开一位开始聊天，优先处理未读多的对话。</p>
          </div>
          <div className="rounded-2xl bg-white/80 px-3 py-2 text-right shadow-soft">
            <div className="text-[10px] uppercase tracking-[0.24em] text-wine/40">并行会话</div>
            <div className="text-lg font-semibold text-ink">{sortedGirls.length}</div>
          </div>
        </div>
      </div>

      <div className="scrollbar-hidden flex-1 overflow-y-auto px-3 pb-4 pt-3">
        {sortedGirls.map((girl) => {
          const lastMessage = girl.chatHistory[girl.chatHistory.length - 1]

          return (
            <button
              key={girl.profile.id}
              type="button"
              onClick={() => onOpen(girl.profile.id)}
              className="mb-3 flex w-full items-start gap-3 rounded-[26px] bg-white/85 px-4 py-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:bg-white"
            >
              <div className="relative">
                <Avatar avatar={girl.profile.avatar} name={girl.profile.name} size="lg" />
                {girl.unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                    {girl.unreadCount}
                  </span>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-ink">{girl.profile.name}</h2>
                      <span className={`text-sm ${affectionTone(girl.affection)}`}>♥ {girl.affection}</span>
                    </div>
                    <p className="mt-1 text-xs text-wine/55">
                      {getRelationshipStage(girl.affection)} · {statusLabel[girl.status]}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-wine/45">
                    {lastMessage ? formatTimestamp(lastMessage.timestamp) : '--:--'}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-wine/70">
                  {lastMessage?.content || '还没有聊天记录'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
