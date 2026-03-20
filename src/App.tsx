import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AiSessionModal } from './components/AiSessionModal'
import { Avatar } from './components/Avatar'
import { useAiConfig } from './config/api'
import { AppDock } from './components/AppDock'
import { HomeBar } from './components/HomeBar'
import { PhoneFrame } from './components/PhoneFrame'
import { ChatList } from './systems/chat/ChatList'
import { ChatRoom } from './systems/chat/ChatRoom'
import { CharacterCreationScreen } from './systems/character/CharacterCreationScreen'
import { DesktopPage } from './systems/desktop/DesktopPage'
import { EarningPage } from './systems/earning/EarningPage'
import { getRelationshipStage } from './systems/girls/affectionLogic'
import { TaobaoPage } from './systems/spending/TaobaoPage'
import { useAiSessionStore } from './store/aiSessionStore'
import { useGameStore } from './store/gameStore'
import type { AppTab, EndingType, GirlState } from './store/gameTypes'
import { appConfigs, jobConfigs, uiStrings, t } from './data'

function StatsView({ girls }: { girls: Record<string, GirlState> }) {
  const player = useGameStore((state) => state.player)
  const score = useGameStore((state) => state.score)
  const conqueredCount = Object.values(girls).filter((girl) => girl.affection >= 80).length
  const blockedCount = Object.values(girls).filter((girl) => girl.status === 'blocked').length

  const s = uiStrings.stats

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="scrollbar-hidden flex h-full flex-col overflow-y-auto px-4 pb-6 pt-5"
    >
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="rounded-[28px] bg-[linear-gradient(135deg,#fff7e6,#ffefd3)] px-6 py-6 shadow-lg ring-1 ring-black/5"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-wine/50">{s.panelLabel}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">{s.panelTitle}</h1>
        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col justify-center rounded-[20px] bg-white/90 px-5 py-4 shadow-sm">
            <div className="text-[12px] font-bold uppercase tracking-wider text-wine/50">{s.totalScore}</div>
            <div className="mt-1.5 text-3xl font-bold text-wine">{score}</div>
          </div>
          <div className="flex flex-col justify-center rounded-[20px] bg-white/90 px-5 py-4 shadow-sm">
            <div className="text-[12px] font-bold uppercase tracking-wider text-wine/50">{s.conquered}</div>
            <div className="mt-1.5 text-3xl font-bold text-ink">{conqueredCount}</div>
          </div>
          <div className="flex flex-col justify-center rounded-[20px] bg-white/90 px-5 py-4 shadow-sm">
            <div className="text-[12px] font-bold uppercase tracking-wider text-wine/50">{s.totalEarned}</div>
            <div className="mt-1.5 text-xl font-bold text-emerald-600">¥ {player.totalEarned}</div>
          </div>
          <div className="flex flex-col justify-center rounded-[20px] bg-white/90 px-5 py-4 shadow-sm">
            <div className="text-[12px] font-bold uppercase tracking-wider text-wine/50">{s.totalSpent}</div>
            <div className="mt-1.5 text-xl font-bold text-rose-500">¥ {player.totalSpent}</div>
          </div>
        </div>
      </motion.div>

      <div className="mt-5 rounded-[28px] bg-white px-5 py-5 shadow-md ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{s.relationPanel}</h2>
          <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 shadow-inner">
            {s.blocked} {blockedCount}
          </span>
        </div>

        <div className="mt-5 space-y-5">
          {Object.values(girls)
            .sort((a, b) => b.affection - a.affection)
            .map((girl, index) => (
              <motion.div 
                key={girl.profile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-[20px] p-2 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="transition-transform group-hover:scale-110">
                      <Avatar avatar={girl.profile.avatar} name={girl.profile.name} size="md" />
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-ink">{girl.profile.name}</div>
                      <div className="mt-0.5 text-[12px] font-medium text-wine/60">{getRelationshipStage(girl.affection)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-rose-500">♥ {girl.affection}</div>
                    <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-wine/50">{girl.mood}</div>
                  </div>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-rose-100/50 shadow-inner">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#ff7aa2,#ffcf70)] shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${girl.affection}%` }}
                    transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </motion.div>
  )
}

function EndingScreen({ endingType, narrative, score, onRestart }: {
  endingType: EndingType
  narrative?: string
  score: number
  onRestart: () => void
}) {
  const isDeath = endingType === 'death'
  const isVictory = endingType === 'victory'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex h-full flex-col items-center justify-center gap-6 px-6 text-center ${
        isDeath ? 'bg-[#1a0a0e]' : isVictory ? 'bg-[#0d1a0a]' : 'bg-[#0d0d1a]'
      }`}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-6xl"
      >
        {isDeath ? '💀' : isVictory ? '👑' : '🚫'}
      </motion.div>

      <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
        <h1 className={`font-display text-2xl font-bold ${isDeath ? 'text-red-400' : isVictory ? 'text-yellow-400' : 'text-slate-300'}`}>
          {isDeath ? '死亡结局' : isVictory ? '完美结局' : '游戏结束'}
        </h1>
        {narrative && (
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/60">{narrative}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl bg-white/10 px-8 py-4"
      >
        <div className="text-xs font-bold uppercase tracking-wider text-white/40">最终得分</div>
        <div className={`mt-1 text-4xl font-bold ${isDeath ? 'text-red-400' : isVictory ? 'text-yellow-400' : 'text-white'}`}>
          {score}
        </div>
      </motion.div>

      <motion.button
        type="button"
        onClick={onRestart}
        whileTap={{ scale: 0.96 }}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl bg-white/15 px-8 py-3 text-sm font-semibold text-white hover:bg-white/25"
      >
        重新开始
      </motion.button>
    </motion.div>
  )
}

const getPrimaryApp = (appId: AppTab) => appConfigs.find((app) => app.appId === appId)

const getCurrentJobApp = (jobType?: string): AppTab | null => {
  switch (jobType) {
    case 'delivery':
      return 'meituan'
    case 'coding':
      return 'coding'
    case 'slot-machine':
      return 'slots'
    case 'streaming':
      return 'streaming'
    case 'taobao-review':
      return 'taobao'
    default:
      return null
  }
}

function App() {
  const aiConfig = useAiConfig()
  const girls = useGameStore((state) => state.girls)
  const player = useGameStore((state) => state.player)
  const playerProfile = useGameStore((state) => state.playerProfile)
  const gameTime = useGameStore((state) => state.gameTime)
  const score = useGameStore((state) => state.score)
  const gameOver = useGameStore((state) => state.gameOver)
  const gameOverReason = useGameStore((state) => state.gameOverReason)
  const endingType = useGameStore((state) => state.endingType)
  const endingNarrative = useGameStore((state) => state.endingNarrative)
  const finishWork = useGameStore((state) => state.finishWork)
  const markGirlRead = useGameStore((state) => state.markGirlRead)
  const resetGame = useGameStore((state) => state.resetGame)
  const clearAiSession = useAiSessionStore((state) => state.clearSession)
  const [activeView, setActiveView] = useState<AppTab>('desktop')
  const [selectedGirlId, setSelectedGirlId] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [settlementMessage, setSettlementMessage] = useState<string | null>(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)

  const sa = uiStrings.app
  const sc = uiStrings.aiSession
  const sb = uiStrings.sidebar

  const activeGirlsCount = useMemo(
    () => Object.values(girls).filter((girl) => girl.status !== 'blocked').length,
    [girls],
  )
  const unreadCount = useMemo(
    () => Object.values(girls).reduce((sum, girl) => sum + girl.unreadCount, 0),
    [girls],
  )
  const currentJobApp = getCurrentJobApp(player.currentJob?.type)
  const desktopApps = useMemo(() => appConfigs.filter((app) => app.placement === 'grid'), [])
  const dockApps = useMemo(() => appConfigs.filter((app) => app.placement === 'dock'), [])
  const deliveryJob = useMemo(() => jobConfigs.find((job) => job.id === 'delivery'), [])
  const codingJob = useMemo(() => jobConfigs.find((job) => job.id === 'coding'), [])
  const slotJob = useMemo(() => jobConfigs.find((job) => job.id === 'slot-machine'), [])
  const streamingJob = useMemo(() => jobConfigs.find((job) => job.id === 'streaming'), [])
  const meituanApp = useMemo(() => getPrimaryApp('meituan'), [])
  const codingApp = useMemo(() => getPrimaryApp('coding'), [])
  const slotApp = useMemo(() => getPrimaryApp('slots'), [])
  const streamingApp = useMemo(() => getPrimaryApp('streaming'), [])

  useEffect(() => {
    if (!selectedGirlId || !chatOpen) return
    markGirlRead(selectedGirlId)
  }, [chatOpen, markGirlRead, selectedGirlId])

  useEffect(() => {
    if (!player.currentJob || player.currentJob.completionMode !== 'timer') return undefined

    const timer = window.setInterval(() => {
      const currentJob = useGameStore.getState().player.currentJob
      if (!currentJob || currentJob.completionMode !== 'timer') return

      if (Date.now() >= currentJob.startTime + currentJob.duration * 1000) {
        const reward = finishWork()
        const jobMeta = jobConfigs.find((job) => job.id === currentJob.type)
        setSettlementMessage(
          reward > 0
            ? t(sa.settlementMessage, { reward })
            : t(uiStrings.earning.workFailed, { name: jobMeta?.name ?? '这单工作' }),
        )
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [finishWork, player.currentJob, sa.settlementMessage])

  useEffect(() => {
    if (!settlementMessage) return undefined

    const timer = window.setTimeout(() => setSettlementMessage(null), 2800)
    return () => window.clearTimeout(timer)
  }, [settlementMessage])

  const handleRestart = () => {
    resetGame()
    setActiveView('desktop')
    setSelectedGirlId(null)
    setChatOpen(false)
    setSettlementMessage(null)
  }

  const renderCurrentView = () => {
    // Show ending screen inside the phone when game is over
    if (gameOver && endingType !== 'playing') {
      return (
        <EndingScreen
          endingType={endingType}
          narrative={endingNarrative}
          score={score}
          onRestart={handleRestart}
        />
      )
    }

    // Show character creation screen before game starts
    if (!playerProfile.configured) {
      return <CharacterCreationScreen />
    }

    if (activeView === 'desktop') {
      return (
        <DesktopPage
          apps={desktopApps}
          unreadCount={unreadCount}
          currentJobApp={currentJobApp}
          onOpenApp={setActiveView}
        />
      )
    }

    if (activeView === 'wechat') {
      if (chatOpen && selectedGirlId && girls[selectedGirlId]) {
        return (
          <ChatRoom
            girlId={selectedGirlId}
            onBack={() => {
              setChatOpen(false)
            }}
          />
        )
      }

      return (
        <ChatList
          girls={girls}
          onOpen={(girlId) => {
            setSelectedGirlId(girlId)
            setChatOpen(true)
            markGirlRead(girlId)
          }}
        />
      )
    }

    if (activeView === 'taobao') return <TaobaoPage />
    if (activeView === 'meituan') {
      return (
        <EarningPage
          jobIds={['delivery']}
          pageLabel={meituanApp?.name ?? '美团'}
          pageTitle={deliveryJob?.name ?? '送外卖'}
          pageSubtitle={deliveryJob?.description}
        />
      )
    }
    if (activeView === 'coding') {
      return (
        <EarningPage
          jobIds={['coding']}
          pageLabel={codingApp?.name ?? '代码'}
          pageTitle={codingJob?.name ?? '写代码'}
          pageSubtitle={codingJob?.description}
        />
      )
    }
    if (activeView === 'streaming') {
      return (
        <EarningPage
          jobIds={['streaming']}
          pageLabel={streamingApp?.name ?? '直播'}
          pageTitle={streamingJob?.name ?? '当主播'}
          pageSubtitle={streamingJob?.description}
        />
      )
    }
    if (activeView === 'slots') {
      return (
        <EarningPage
          jobIds={['slot-machine']}
          pageLabel={slotApp?.name ?? '头奖机'}
          pageTitle={slotJob?.name ?? '摇老虎机'}
          pageSubtitle={slotJob?.description}
        />
      )
    }
    return <StatsView girls={girls} />
  }

  const footer =
    activeView === 'desktop' ? (
      <AppDock
        apps={dockApps}
        unreadCount={unreadCount}
        currentJobApp={currentJobApp}
        onOpenApp={setActiveView}
      />
    ) : (
      <HomeBar onGoHome={() => setActiveView('desktop')} />
    )

  return (
    <div className="min-h-screen bg-haze px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start">
        <section className="w-full lg:max-w-[360px]">
          <div className="rounded-[34px] bg-white/75 p-6 shadow-soft backdrop-blur">
            <p className="text-xs uppercase tracking-[0.32em] text-wine/45">Vibe Coding Demo</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-ink">{sa.title}</h1>
            {playerProfile.configured && (
              <p className="mt-1 text-sm text-wine/60">
                {playerProfile.gender === 'female' ? '♀' : '♂'} {playerProfile.name}
              </p>
            )}
            <p className="mt-4 text-sm leading-7 text-wine/70">
              {sa.subtitle}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-3xl bg-cream px-4 py-3">
                <div className="text-wine/45">{sb.currentScore}</div>
                <div className="mt-1 text-xl font-semibold text-ink">{score}</div>
              </div>
              <div className="rounded-3xl bg-cream px-4 py-3">
                <div className="text-wine/45">{sb.activeRelations}</div>
                <div className="mt-1 text-xl font-semibold text-ink">{activeGirlsCount}</div>
              </div>
              <div className="rounded-3xl bg-cream px-4 py-3">
                <div className="text-wine/45">{sb.wallet}</div>
                <div className="mt-1 text-xl font-semibold text-ink">¥ {player.money}</div>
              </div>
              <div className="rounded-3xl bg-cream px-4 py-3">
                <div className="text-wine/45">{sb.backpack}</div>
                <div className="mt-1 text-xl font-semibold text-ink">{player.inventory.length}</div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-cream px-4 py-4 text-sm">
              <div className="text-wine/45">{sb.aiMode}</div>
              <div className="mt-1 font-semibold text-ink">
                {aiConfig.apiKey ? `${aiConfig.providerLabel} · ${aiConfig.model}` : sc.fallbackMode}
              </div>
              <div className="mt-2 text-xs text-wine/55">
                {aiConfig.apiKey ? sc.sessionMode : sc.inactiveBadge}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(true)}
                  className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-wine shadow-soft"
                >
                  {aiConfig.apiKey ? sc.editButton : sc.openButton}
                </button>
                {aiConfig.apiKey ? (
                  <button
                    type="button"
                    onClick={clearAiSession}
                    className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600"
                  >
                    {sc.clearButton}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-cream px-4 py-4 text-sm">
              <div className="font-semibold text-ink">{sb.demoOrderTitle}</div>
              <div className="mt-3 space-y-2 text-wine/70">
                {sb.demoChecklist.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-cream px-4 py-4 text-sm">
              <div className="font-semibold text-ink">{sb.strategyTitle}</div>
              <div className="mt-3 space-y-2 text-wine/70">
                {sb.strategyHints.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRestart}
              className="mt-4 w-full rounded-3xl bg-wine px-4 py-3 text-sm font-medium text-white"
            >
              {sa.resetButton}
            </button>
          </div>

          {gameOver ? (
            <div className="mt-4 rounded-[30px] bg-[#411d2b] px-5 py-5 text-white shadow-soft">
              <div className="text-sm font-semibold">{sa.gameOver}</div>
              <div className="mt-2 text-sm text-white/75">{gameOverReason}</div>
            </div>
          ) : null}

          {settlementMessage ? (
            <div className="mt-4 rounded-[30px] bg-white px-5 py-4 text-sm font-medium text-emerald-700 shadow-soft">
              {settlementMessage}
            </div>
          ) : null}
        </section>

        <section className="w-full flex-1">
          <PhoneFrame
            footer={footer}
            gameTime={gameTime}
            money={player.money}
            timeStatus={player.timeStatus}
          >
            {renderCurrentView()}
          </PhoneFrame>
        </section>
      </div>
      <AiSessionModal open={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </div>
  )
}

export default App
