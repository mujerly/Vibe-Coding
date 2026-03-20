import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRelationshipStage } from '../girls/affectionLogic'
import { useGameStore } from '../../store/gameStore'
import { GiftPicker } from './GiftPicker'
import { girlConfigs, uiStrings } from '../../data'
import { Avatar } from '../../components/Avatar'
import { getGirlStickerById } from './stickerProtocol'
import { triggerElementParticles } from '../../utils/particles'
import { getGirlRoutineStatus } from '../../utils/timeSystem'

interface ChatRoomProps {
  girlId: string
  onBack: () => void
}

const isImageAsset = (asset: string) =>
  /^(\/|https?:\/\/|data:image)/.test(asset) || /\.(png|jpe?g|gif|svg|webp)$/i.test(asset)

const normalizeImageSrc = (src: string) =>
  src.startsWith('data:image') ? src : encodeURI(src)

export function ChatRoom({ girlId, onBack }: ChatRoomProps) {
  const girl = useGameStore((state) => state.girls[girlId])
  const sendMessage = useGameStore((state) => state.sendMessage)
  const sendGiftInChat = useGameStore((state) => state.sendGiftInChat)
  const isBusy = useGameStore((state) => state.player.timeStatus === 'working')
  const currentJob = useGameStore((state) => state.player.currentJob)
  const gameTime = useGameStore((state) => state.gameTime)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [giftOpen, setGiftOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const affectionRef = useRef<HTMLDivElement>(null)
  const prevAffectionRef = useRef(girl?.affection ?? 0)

  const s = uiStrings.chatRoom

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [girl?.chatHistory, sending])

  useEffect(() => {
    if (!feedback) return undefined

    const timer = window.setTimeout(() => setFeedback(null), 2500)
    return () => window.clearTimeout(timer)
  }, [feedback])

  useEffect(() => {
    if (girl && girl.affection > prevAffectionRef.current) {
      triggerElementParticles(affectionRef.current, 'affection')
    }
    if (girl) {
      prevAffectionRef.current = girl.affection
    }
  }, [girl])

  if (!girl) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] font-medium text-wine/60">{uiStrings.errors.girlNotFound}</div>
    )
  }

  const relationshipStage = getRelationshipStage(girl.affection)
  const blocked = girl.status === 'blocked'
  const quickPrompts = girlConfigs[girlId]?.quickPrompts ?? []
  const routineStatus = getGirlRoutineStatus(girlId, gameTime)
  const replySourceLabel =
    girl.lastReplySource == null ? null : girl.lastReplySource === 'ai' ? s.replySourceAi : s.replySourceFallback
  const fallbackReason =
    girl.lastReplySource === 'fallback' ? girl.lastReplyDebugReason ?? s.unknownReason : null

  const handleSend = async () => {
    if (sending || !draft.trim()) return

    setSending(true)
    const result = await sendMessage(girlId, draft)
    setSending(false)

    if (!result.ok) {
      setFeedback(result.error ?? uiStrings.errors.sendFailed)
      return
    }

    setDraft('')
    if (useGameStore.getState().girls[girlId]?.lastReplySource === 'fallback') {
      const reason = useGameStore.getState().girls[girlId]?.lastReplyDebugReason ?? s.unknownReason
      setFeedback(s.fallbackNotice.replace('{reason}', reason))
    }
  }

  const handleGift = async (giftId: string) => {
    setGiftOpen(false)
    setSending(true)
    const result = await sendGiftInChat(girlId, giftId)
    setSending(false)

    if (!result.ok) {
      setFeedback(result.error ?? uiStrings.errors.giftFailed)
      return
    }

    const state = useGameStore.getState()
    if (state.girls[girlId]?.lastReplySource === 'fallback') {
      const reason = state.girls[girlId]?.lastReplyDebugReason ?? s.unknownReason
      setFeedback(s.giftSentFallback.replace('{reason}', reason))
    } else {
      setFeedback(s.giftSentAi)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="relative flex h-full flex-col bg-[#f8f9fa]"
    >
      <div className="z-10 border-b border-black/5 bg-white/70 px-4 pb-3 pt-4 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </motion.button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="shadow-sm rounded-[18px]">
                <Avatar avatar={girl.profile.avatar} name={girl.profile.name} size="md" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[16px] font-bold text-ink">{girl.profile.name}</h2>
                <p className="truncate text-[12px] font-medium text-wine/55">
                  {relationshipStage} · {girl.mood}
                </p>
              </div>
            </div>
          </div>
            <div className="flex flex-col items-end gap-1.5">
              <div
                ref={affectionRef}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold shadow-sm ${
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
              <div
                className={`rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm ${
                  routineStatus.state === 'sleeping'
                    ? 'bg-slate-100 text-slate-500'
                    : routineStatus.state === 'busy'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-sky-100 text-sky-700'
                }`}
              >
                {routineStatus.label}
              </div>
            </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-rose-100/50 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#ff7aa2,#ffcf70)]"
            initial={{ width: 0 }}
            animate={{ width: `${girl.affection}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <AnimatePresence initial={false}>
          {sending ? (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3.5 py-1.5 text-[12px] font-medium text-wine/65 shadow-sm ring-1 ring-black/5">
                <motion.span
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  className="h-2 w-2 rounded-full bg-rose-400"
                />
                <span>{s.typing}</span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div className="mt-2 flex flex-wrap gap-2">
          <div
            title={routineStatus.description}
            className="max-w-[58%] truncate rounded-full bg-slate-100/80 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm"
          >
            {routineStatus.description}
          </div>
          {replySourceLabel ? (
            <div className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-wine/60 shadow-sm ring-1 ring-black/5">
              {replySourceLabel}
            </div>
          ) : null}
          {fallbackReason ? (
            <div
              title={`${s.fallbackReasonPrefix}${fallbackReason}`}
              className="max-w-full truncate rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 shadow-sm"
            >
              {s.fallbackReasonPrefix}{fallbackReason}
            </div>
          ) : null}
        </div>
      </div>

      <div className="scrollbar-hidden flex-1 space-y-5 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,249,250,0.8),rgba(241,245,249,0.9))] px-4 py-6">
        <AnimatePresence initial={false}>
          {girl.chatHistory.map((message) => {
            const isPlayer = message.role === 'player'
            const isSystem = message.role === 'system'
            const sticker =
              !isPlayer && !isSystem ? getGirlStickerById(girlId, message.stickerId) : undefined

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex items-end gap-3 ${isPlayer ? 'justify-end' : 'justify-start'} ${
                  isSystem ? 'justify-center' : ''
                }`}
              >
                {!isPlayer && !isSystem ? (
                  <div className="shrink-0 pb-1">
                    <Avatar avatar={girl.profile.avatar} name={girl.profile.name} size="sm" />
                  </div>
                ) : null}
                {sticker ? (
                  <div className="max-w-[46%] rounded-[26px] rounded-bl-[8px] bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                    {isImageAsset(sticker.asset) ? (
                      <img
                        src={normalizeImageSrc(sticker.asset)}
                        alt={`${girl.profile.name} sticker`}
                        className="mx-auto h-28 w-28 rounded-[22px] object-cover"
                      />
                    ) : (
                      <div className="flex min-h-[92px] min-w-[92px] items-center justify-center text-[68px] leading-none">
                        {sticker.asset}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                      isSystem
                        ? 'rounded-[20px] bg-slate-200/60 text-[12px] font-medium text-slate-500 shadow-none'
                        : isPlayer
                          ? 'rounded-[24px] rounded-br-[8px] bg-[linear-gradient(135deg,#ff7aa2,#ff5c8a)] text-white'
                          : 'rounded-[24px] rounded-bl-[8px] bg-white text-ink'
                    }`}
                  >
                    {message.content}
                  </div>
                )}
              </motion.div>
            )
          })}

        </AnimatePresence>
        <div ref={endRef} className="h-2" />
      </div>

      <div className="z-10 border-t border-black/5 bg-white/80 px-5 py-4 backdrop-blur-xl">
        <AnimatePresence>
          {feedback ? (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-600 shadow-sm">{feedback}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        
        {routineStatus.state === 'sleeping' && !blocked ? (
          <div className="mb-3 rounded-[16px] bg-slate-100 px-4 py-3 text-[13px] font-medium text-slate-500 shadow-sm">
            她现在在睡觉，消息会等她醒来才能看到
          </div>
        ) : null}
        {isBusy ? (
          <div className="mb-3 rounded-[16px] bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-700 shadow-sm">
            {s.busyWarning}
            {currentJob ? ` 当前专注：${currentJob.focus}` : ''}
          </div>
        ) : null}
        {blocked ? (
          <div className="mb-3 rounded-[16px] bg-slate-100 px-4 py-3 text-[13px] font-medium text-slate-500 shadow-sm">
            {s.blockedWarning}
          </div>
        ) : null}

        {quickPrompts.length ? (
          <div className="mb-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hidden">
            {quickPrompts.map((prompt) => (
              <motion.button
                key={prompt}
                whileHover={blocked || sending ? {} : { scale: 1.02 }}
                whileTap={blocked || sending ? {} : { scale: 0.98 }}
                type="button"
                onClick={() => setDraft(prompt)}
                disabled={blocked || sending}
                className="shrink-0 rounded-[16px] bg-white px-4 py-2.5 text-[13px] font-medium text-ink shadow-sm ring-1 ring-black/5 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none"
              >
                {prompt}
              </motion.button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={blocked || sending ? {} : { scale: 1.05 }}
            whileTap={blocked || sending ? {} : { scale: 0.95 }}
            type="button"
            onClick={() => setGiftOpen(true)}
            disabled={blocked || sending}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[18px] bg-rose-50 text-rose-500 shadow-sm transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12v10H4V12" />
              <path d="M2 7h20v5H2z" />
              <path d="M12 22V7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </motion.button>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleSend()
              }
            }}
            disabled={blocked || sending}
            placeholder={
              blocked ? s.placeholderBlocked : s.placeholderDefault
            }
            className="h-[46px] min-w-0 flex-1 rounded-[20px] bg-slate-100/80 px-4 text-[14px] font-medium text-ink shadow-inner outline-none transition-all placeholder:text-wine/40 focus:bg-white focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <motion.button
            whileHover={!draft.trim() || blocked || sending ? {} : { scale: 1.05 }}
            whileTap={!draft.trim() || blocked || sending ? {} : { scale: 0.95 }}
            type="button"
            onClick={() => void handleSend()}
            disabled={!draft.trim() || blocked || sending}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#ff7aa2,#ff5c8a)] text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </motion.button>
        </div>
      </div>

      <GiftPicker open={giftOpen} onClose={() => setGiftOpen(false)} onSelect={handleGift} />
    </motion.div>
  )
}
