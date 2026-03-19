import { useEffect, useMemo, useState } from 'react'
import { isSiliconflowEnabled, siliconflowConfig } from './config/api'
import { PhoneFrame } from './components/PhoneFrame'
import { ChatList } from './systems/chat/ChatList'
import { ChatRoom } from './systems/chat/ChatRoom'
import { EarningPage } from './systems/earning/EarningPage'
import { getRelationshipStage } from './systems/girls/affectionLogic'
import { ShopPage } from './systems/spending/ShopPage'
import { useGameStore } from './store/gameStore'
import type { AppTab, GirlState } from './store/gameTypes'
import { uiStrings, t } from './data'

function StatsView({ girls }: { girls: Record<string, GirlState> }) {
  const player = useGameStore((state) => state.player)
  const score = useGameStore((state) => state.score)
  const conqueredCount = Object.values(girls).filter((girl) => girl.affection >= 80).length
  const blockedCount = Object.values(girls).filter((girl) => girl.status === 'blocked').length

  const s = uiStrings.stats

  return (
    <div className="scrollbar-hidden flex h-full flex-col overflow-y-auto px-4 pb-4 pt-5">
      <div className="rounded-[30px] bg-[linear-gradient(135deg,#fff7e6,#ffefd3)] px-5 py-5 shadow-soft">
        <p className="text-xs uppercase tracking-[0.28em] text-wine/40">{s.panelLabel}</p>
        <h1 className="mt-2 font-display text-2xl text-ink">{s.panelTitle}</h1>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-3xl bg-white/80 px-4 py-3">
            <div className="text-wine/45">{s.totalScore}</div>
            <div className="mt-2 text-2xl font-semibold text-wine">{score}</div>
          </div>
          <div className="rounded-3xl bg-white/80 px-4 py-3">
            <div className="text-wine/45">{s.conquered}</div>
            <div className="mt-2 text-2xl font-semibold text-ink">{conqueredCount}</div>
          </div>
          <div className="rounded-3xl bg-white/80 px-4 py-3">
            <div className="text-wine/45">{s.totalEarned}</div>
            <div className="mt-2 text-xl font-semibold text-ink">¥ {player.totalEarned}</div>
          </div>
          <div className="rounded-3xl bg-white/80 px-4 py-3">
            <div className="text-wine/45">{s.totalSpent}</div>
            <div className="mt-2 text-xl font-semibold text-ink">¥ {player.totalSpent}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[28px] bg-white px-4 py-4 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">{s.relationPanel}</h2>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
            {s.blocked} {blockedCount}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {Object.values(girls)
            .sort((a, b) => b.affection - a.affection)
            .map((girl) => (
              <div key={girl.profile.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{girl.profile.avatar}</span>
                    <div>
                      <div className="font-medium text-ink">{girl.profile.name}</div>
                      <div className="text-xs text-wine/50">{getRelationshipStage(girl.affection)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-wine">♥ {girl.affection}</div>
                    <div className="text-xs text-wine/45">{girl.mood}</div>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-rose-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#ff7aa2,#ffcf70)]"
                    style={{ width: `${girl.affection}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

function App() {
  const girls = useGameStore((state) => state.girls)
  const player = useGameStore((state) => state.player)
  const score = useGameStore((state) => state.score)
  const gameOver = useGameStore((state) => state.gameOver)
  const gameOverReason = useGameStore((state) => state.gameOverReason)
  const finishWork = useGameStore((state) => state.finishWork)
  const markGirlRead = useGameStore((state) => state.markGirlRead)
  const resetGame = useGameStore((state) => state.resetGame)
  const [activeTab, setActiveTab] = useState<AppTab>('chat')
  const [selectedGirlId, setSelectedGirlId] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [settlementMessage, setSettlementMessage] = useState<string | null>(null)

  const sa = uiStrings.app
  const sb = uiStrings.sidebar

  const activeGirlsCount = useMemo(
    () => Object.values(girls).filter((girl) => girl.status !== 'blocked').length,
    [girls],
  )

  useEffect(() => {
    if (!selectedGirlId || !chatOpen) return
    markGirlRead(selectedGirlId)
  }, [chatOpen, markGirlRead, selectedGirlId])

  useEffect(() => {
    if (!player.currentJob) return undefined

    const timer = window.setInterval(() => {
      const currentJob = useGameStore.getState().player.currentJob
      if (!currentJob) return

      if (Date.now() >= currentJob.startTime + currentJob.duration * 1000) {
        const reward = finishWork()
        if (reward > 0) {
          setSettlementMessage(t(sa.settlementMessage, { reward }))
        }
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [finishWork, player.currentJob, sa.settlementMessage])

  useEffect(() => {
    if (!settlementMessage) return undefined

    const timer = window.setTimeout(() => setSettlementMessage(null), 2800)
    return () => window.clearTimeout(timer)
  }, [settlementMessage])

  const renderCurrentView = () => {
    if (activeTab === 'chat') {
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

    if (activeTab === 'work') return <EarningPage />
    if (activeTab === 'shop') return <ShopPage />
    return <StatsView girls={girls} />
  }

  return (
    <div className="min-h-screen bg-haze px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start">
        <section className="w-full lg:max-w-[360px]">
          <div className="rounded-[34px] bg-white/75 p-6 shadow-soft backdrop-blur">
            <p className="text-xs uppercase tracking-[0.32em] text-wine/45">Vibe Coding Demo</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-ink">{sa.title}</h1>
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
                {isSiliconflowEnabled ? `SiliconFlow · ${siliconflowConfig.model}` : sb.aiFallback}
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
              onClick={() => {
                resetGame()
                setActiveTab('chat')
                setSelectedGirlId(null)
                setChatOpen(false)
                setSettlementMessage(null)
              }}
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
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab)
              if (tab !== 'chat') {
                setChatOpen(false)
              }
            }}
            money={player.money}
            timeStatus={player.timeStatus}
          >
            {renderCurrentView()}
          </PhoneFrame>
        </section>
      </div>
    </div>
  )
}

export default App
