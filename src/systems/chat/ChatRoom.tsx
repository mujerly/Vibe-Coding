import { useEffect, useRef, useState } from 'react'
import { getRelationshipStage } from '../girls/affectionLogic'
import { useGameStore } from '../../store/gameStore'
import { GiftPicker } from './GiftPicker'

interface ChatRoomProps {
  girlId: string
  onBack: () => void
}

const quickPromptMap: Record<string, string[]> = {
  xiaotian: ['刚忙完，第一时间来找你。', '周末带你去喝奶茶怎么样？', '今天有没有想我一点点？'],
  jessica: ['这周末我订一家不错的餐厅，你有空吗？', '你今天 meeting 顺利吗？', '给你挑了支口红，见面拿给你。'],
  linyouyou: ['你刚说的那张画，我有点好奇色调。', '最近有哪本书让你印象特别深吗？', '如果卡住了，你一般怎么找灵感？'],
}

export function ChatRoom({ girlId, onBack }: ChatRoomProps) {
  const girl = useGameStore((state) => state.girls[girlId])
  const sendMessage = useGameStore((state) => state.sendMessage)
  const sendGiftInChat = useGameStore((state) => state.sendGiftInChat)
  const isBusy = useGameStore((state) => state.player.timeStatus === 'working')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [giftOpen, setGiftOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [girl?.chatHistory, sending])

  useEffect(() => {
    if (!feedback) return undefined

    const timer = window.setTimeout(() => setFeedback(null), 2200)
    return () => window.clearTimeout(timer)
  }, [feedback])

  if (!girl) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-wine/60">聊天对象不存在。</div>
    )
  }

  const relationshipStage = getRelationshipStage(girl.affection)
  const blocked = girl.status === 'blocked'
  const quickPrompts = quickPromptMap[girlId] ?? []
  const replySourceLabel =
    girl.lastReplySource == null ? null : girl.lastReplySource === 'ai' ? '云端 AI' : '本地保底'
  const fallbackReason =
    girl.lastReplySource === 'fallback' ? girl.lastReplyDebugReason ?? '未知原因' : null

  const handleSend = async () => {
    if (sending || !draft.trim()) return

    setSending(true)
    const result = await sendMessage(girlId, draft)
    setSending(false)

    if (!result.ok) {
      setFeedback(result.error ?? '发送失败')
      return
    }

    setDraft('')
    if (useGameStore.getState().girls[girlId]?.lastReplySource === 'fallback') {
      const reason = useGameStore.getState().girls[girlId]?.lastReplyDebugReason ?? '未知原因'
      setFeedback(`这条回复来自本地保底。原因：${reason}`)
    }
  }

  const handleGift = async (giftId: string) => {
    setGiftOpen(false)
    setSending(true)
    const result = await sendGiftInChat(girlId, giftId)
    setSending(false)

    if (!result.ok) {
      setFeedback(result.error ?? '送礼失败')
      return
    }

    setFeedback(
      useGameStore.getState().girls[girlId]?.lastReplySource === 'fallback'
        ? `礼物已送出，但这条回复是本地保底。原因：${
            useGameStore.getState().girls[girlId]?.lastReplyDebugReason ?? '未知原因'
          }`
        : '礼物已送出，当前回复来自云端 AI。',
    )
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="border-b border-white/60 bg-white/55 px-4 pb-4 pt-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600"
          >
            返回
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-2xl">{girl.profile.avatar}</div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-ink">{girl.profile.name}</h2>
                <p className="truncate text-xs text-wine/55">
                  {relationshipStage} · {girl.mood}
                </p>
              </div>
            </div>
          </div>
          <div
            className={`rounded-full px-3 py-2 text-xs font-medium ${
              blocked
                ? 'bg-slate-100 text-slate-500'
                : girl.status === 'angry'
                  ? 'bg-rose-100 text-rose-600'
                  : girl.status === 'suspicious'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            ♥ {girl.affection}
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-rose-100">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#ff7aa2,#ffcf70)] transition-all"
            style={{ width: `${girl.affection}%` }}
          />
        </div>
        {replySourceLabel ? (
          <div className="mt-3 space-y-2">
            <div className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-wine/75">
              当前回复来源：{replySourceLabel}
            </div>
            {fallbackReason ? (
              <div className="rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                回退原因：{fallbackReason}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-b border-white/60 bg-white/55 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setDraft(prompt)}
              disabled={blocked || isBusy || sending}
              className="shrink-0 rounded-full bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="scrollbar-hidden flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,248,245,0.9),rgba(255,241,247,0.85))] px-4 py-4">
        {girl.chatHistory.map((message) => {
          const isPlayer = message.role === 'player'
          const isSystem = message.role === 'system'

          return (
            <div
              key={message.id}
              className={`flex ${isPlayer ? 'justify-end' : 'justify-start'} ${
                isSystem ? 'justify-center' : ''
              }`}
            >
              <div
                className={`max-w-[82%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-soft ${
                  isSystem
                    ? 'bg-slate-100 text-slate-500'
                    : isPlayer
                      ? 'rounded-br-md bg-wine text-white'
                      : 'rounded-bl-md bg-white text-ink'
                }`}
              >
                {message.content}
              </div>
            </div>
          )
        })}

        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-[24px] rounded-bl-md bg-white px-4 py-3 text-sm text-wine/55 shadow-soft">
              对方正在输入...
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/60 bg-white/70 px-4 py-3 backdrop-blur">
        {feedback ? (
          <div className="mb-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{feedback}</div>
        ) : null}
        {isBusy ? (
          <div className="mb-3 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            你正在打工，这段时间不能回消息。
          </div>
        ) : null}
        {blocked ? (
          <div className="mb-3 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
            她已经把你拉黑了，这段关系结束了。
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGiftOpen(true)}
            disabled={blocked || isBusy || sending}
            className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            礼物
          </button>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleSend()
              }
            }}
            disabled={blocked || isBusy || sending}
            placeholder={
              blocked ? '这段关系已经结束了' : isBusy ? '打工中，无法输入...' : '发一句试试看'
            }
            className="min-w-0 flex-1 rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-wine/35 focus:border-rose-300"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!draft.trim() || blocked || isBusy || sending}
            className="rounded-2xl bg-wine px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-wine/30"
          >
            发送
          </button>
        </div>
      </div>

      <GiftPicker open={giftOpen} onClose={() => setGiftOpen(false)} onSelect={handleGift} />
    </div>
  )
}
