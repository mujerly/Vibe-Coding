import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { JobDefinition } from '../../store/gameTypes'
import { t, uiStrings } from '../../data'
import {
  canMoveToCell,
  createDeliveryStages,
  findShortestPath,
  movePosition,
  samePosition,
  serializeGridPosition,
  type DeliveryStage,
  type Direction,
  type GridPosition,
} from './deliveryMap'

interface DeliveryGameProps {
  job: JobDefinition
  reward: number
  onComplete: () => void
}

interface DeliveryRun {
  stages: [DeliveryStage, DeliveryStage]
  phaseIndex: 0 | 1
  rider: GridPosition
  facing: Direction
  visited: Set<string>
  steps: number
  status: 'riding' | 'completed'
  message: string
}

const MAP_PADDING = 34
const CELL_STEP = 28
const ROAD_WIDTH = 16
const VIEWBOX_SIZE = MAP_PADDING * 2 + CELL_STEP * 10

const createRun = (message: string): DeliveryRun => {
  const stages = createDeliveryStages()

  return {
    stages,
    phaseIndex: 0,
    rider: stages[0].start,
    facing: 'up',
    visited: new Set([serializeGridPosition(stages[0].start)]),
    steps: 0,
    status: 'riding',
    message,
  }
}

const keyToDirection: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

const dpadButtons: Array<{ direction: Direction; symbol: string; slot: string }> = [
  { direction: 'up', symbol: '▲', slot: 'col-start-2 row-start-1' },
  { direction: 'left', symbol: '◀', slot: 'col-start-1 row-start-2' },
  { direction: 'right', symbol: '▶', slot: 'col-start-3 row-start-2' },
  { direction: 'down', symbol: '▼', slot: 'col-start-2 row-start-3' },
]

const riderRotation: Record<Direction, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
}

const toMapPoint = (position: GridPosition) => ({
  x: MAP_PADDING + position.x * CELL_STEP,
  y: MAP_PADDING + position.y * CELL_STEP,
})

const createPolylinePoints = (positions: GridPosition[]) =>
  positions.map((position) => {
    const point = toMapPoint(position)
    return `${point.x},${point.y}`
  }).join(' ')

const getRoadSegments = (stage: DeliveryStage) => {
  const segments: Array<{ from: GridPosition; to: GridPosition; key: string }> = []

  stage.grid.forEach((row, y) => {
    row.forEach((isRoad, x) => {
      if (!isRoad) return

      if (stage.grid[y]?.[x + 1]) {
        segments.push({
          from: { x, y },
          to: { x: x + 1, y },
          key: `h-${x}-${y}`,
        })
      }

      if (stage.grid[y + 1]?.[x]) {
        segments.push({
          from: { x, y },
          to: { x, y: y + 1 },
          key: `v-${x}-${y}`,
        })
      }
    })
  })

  return segments
}

const getVisitedSegments = (stage: DeliveryStage, visited: Set<string>) =>
  getRoadSegments(stage).filter(
    (segment) =>
      visited.has(serializeGridPosition(segment.from)) && visited.has(serializeGridPosition(segment.to)),
  )

function DeliveryMap({
  stage,
  rider,
  facing,
  visited,
  targetLabel,
}: {
  stage: DeliveryStage
  rider: GridPosition
  facing: Direction
  visited: Set<string>
  targetLabel: string
}) {
  const routePath = findShortestPath(stage.grid, rider, stage.target)
  const routePolyline = createPolylinePoints(routePath)
  const riderPoint = toMapPoint(rider)
  const targetPoint = toMapPoint(stage.target)
  const visitedSegments = getVisitedSegments(stage, visited)
  const roadSegments = getRoadSegments(stage)

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="delivery-map-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6fbff" />
          <stop offset="100%" stopColor="#e7eff8" />
        </linearGradient>
        <filter id="delivery-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#7aaef2" floodOpacity="0.28" />
        </filter>
        <filter id="rider-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1f78ff" floodOpacity="0.35" />
        </filter>
      </defs>

      <rect width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} fill="url(#delivery-map-bg)" />

      {stage.grid.map((row, y) =>
        row.map((isRoad, x) => {
          if (isRoad) return null

          const point = toMapPoint({ x, y })
          return (
            <rect
              key={`block-${x}-${y}`}
              x={point.x - 10}
              y={point.y - 10}
              width="20"
              height="20"
              rx="6"
              fill={(x + y) % 3 === 0 ? '#dae6d7' : (x + y) % 3 === 1 ? '#e8e1d6' : '#dde4eb'}
              opacity="0.92"
            />
          )
        }),
      )}

      {roadSegments.map((segment) => {
        const from = toMapPoint(segment.from)
        const to = toMapPoint(segment.to)

        return (
          <g key={segment.key}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#c7d5e2"
              strokeWidth={ROAD_WIDTH + 6}
              strokeLinecap="round"
            />
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#ffffff"
              strokeWidth={ROAD_WIDTH}
              strokeLinecap="round"
            />
          </g>
        )
      })}

      {visitedSegments.map((segment) => {
        const from = toMapPoint(segment.from)
        const to = toMapPoint(segment.to)

        return (
          <line
            key={`visited-${segment.key}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#9fd2ff"
            strokeWidth={ROAD_WIDTH - 4}
            strokeLinecap="round"
          />
        )
      })}

      <polyline
        points={routePolyline}
        fill="none"
        stroke="#ffffff"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <polyline
        points={routePolyline}
        fill="none"
        stroke="#2a8cff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g filter="url(#delivery-shadow)">
        <circle cx={targetPoint.x} cy={targetPoint.y} r="13" fill="#ffffff" />
        <circle cx={targetPoint.x} cy={targetPoint.y} r="9" fill="#ffd85e" />
        <path
          d={`M ${targetPoint.x} ${targetPoint.y - 6} L ${targetPoint.x + 2.1} ${targetPoint.y - 1.8} L ${
            targetPoint.x + 6.8
          } ${targetPoint.y - 1.2} L ${targetPoint.x + 3.4} ${targetPoint.y + 1.8} L ${
            targetPoint.x + 4.5
          } ${targetPoint.y + 6.4} L ${targetPoint.x} ${targetPoint.y + 3.8} L ${
            targetPoint.x - 4.5
          } ${targetPoint.y + 6.4} L ${targetPoint.x - 3.4} ${targetPoint.y + 1.8} L ${
            targetPoint.x - 6.8
          } ${targetPoint.y - 1.2} L ${targetPoint.x - 2.1} ${targetPoint.y - 1.8} Z`}
          fill="#1890ff"
        />
      </g>

      <motion.g 
        animate={{ 
          x: riderPoint.x, 
          y: riderPoint.y 
        }} 
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        filter="url(#rider-shadow)"
      >
        <circle cx={0} cy={0} r="16" fill="#ffffff" />
        <circle cx={0} cy={0} r="12" fill="#1f78ff" />
        <motion.g 
          animate={{ rotate: riderRotation[facing] }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <path
            d={`M 0 -6 L 5 5 L 0 2.4 L -5 5 Z`}
            fill="#ffffff"
          />
        </motion.g>
      </motion.g>

      <g transform={`translate(${targetPoint.x - 22}, ${targetPoint.y - 34})`}>
        <rect width="44" height="16" rx="8" fill="#fff7d1" stroke="#f0cf57" />
        <text x="22" y="11" textAnchor="middle" fontSize="8" fill="#8c6110" fontWeight="700">
          {targetLabel}
        </text>
      </g>
    </svg>
  )
}

export function DeliveryGame({ job, reward, onComplete }: DeliveryGameProps) {
  const s = uiStrings.earning
  const [run, setRun] = useState(() => createRun(s.deliverySubtitle))
  const moveRef = useRef<(direction: Direction) => void>(() => undefined)

  const moveRider = (direction: Direction) => {
    setRun((current) => {
      if (current.status === 'completed') return current

      const stage = current.stages[current.phaseIndex]
      const nextPosition = movePosition(current.rider, direction)
      if (!canMoveToCell(stage, nextPosition)) return current

      const nextVisited = new Set(current.visited)
      nextVisited.add(serializeGridPosition(nextPosition))

      if (samePosition(nextPosition, stage.target)) {
        if (current.phaseIndex === 0) {
          const nextStage = current.stages[1]

          return {
            ...current,
            phaseIndex: 1,
            rider: nextStage.start,
            facing: direction,
            visited: new Set([serializeGridPosition(nextStage.start)]),
            steps: current.steps + 1,
            message: s.deliveryPickedUp,
          }
        }

        return {
          ...current,
          rider: nextPosition,
          facing: direction,
          visited: nextVisited,
          steps: current.steps + 1,
          status: 'completed',
          message: s.deliveryDelivered,
        }
      }

      return {
        ...current,
        rider: nextPosition,
        facing: direction,
        visited: nextVisited,
        steps: current.steps + 1,
      }
    })
  }

  useEffect(() => {
    moveRef.current = moveRider
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = keyToDirection[event.key]
      if (!direction) return

      event.preventDefault()
      moveRef.current(direction)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (run.status !== 'completed') return undefined

    const timer = window.setTimeout(() => onComplete(), 400)
    return () => window.clearTimeout(timer)
  }, [onComplete, run.status])

  const currentStage = run.stages[run.phaseIndex]
  const currentPhaseLabel = run.phaseIndex === 0 ? s.deliveryPickup : s.deliveryDropoff

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex h-full flex-col overflow-hidden px-4 pb-6 pt-4"
    >
      <div className="shrink-0 rounded-[24px] bg-[linear-gradient(135deg,#15406a,#4286d8)] px-5 py-4 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">{job.emoji} {job.name}</p>
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentPhaseLabel}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-1.5 text-2xl font-bold leading-none"
              >
                {currentPhaseLabel}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/20 px-3.5 py-1.5 text-[12px] font-semibold text-white/90 shadow-sm">
              {t(s.deliveryProgress, { current: run.phaseIndex + 1, total: run.stages.length })}
            </div>
            <div className="rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-[#1f78ff] shadow-sm">
              ¥ {reward}
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-[32px] border-2 border-white/80 bg-[#ecf3fb] shadow-md ring-1 ring-black/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.5),rgba(232,240,249,0.85))]" />

        <div className="absolute inset-0 overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,#f8fbff,#eaf1f9)]">
          <DeliveryMap
            stage={currentStage}
            rider={run.rider}
            facing={run.facing}
            visited={run.visited}
            targetLabel={currentPhaseLabel}
          />
        </div>
      </div>

      <div className="mt-4 shrink-0 rounded-[28px] bg-white/95 px-4 py-4 shadow-lg ring-1 ring-black/5">
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="flex min-h-[130px] items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#eff4f9,#e2ebf6)] shadow-inner">
            <div className="rounded-full bg-[#7d8795]/5 p-2">
              <div className="grid grid-cols-3 grid-rows-3 gap-2">
                {dpadButtons.map((button) => (
                  <motion.button
                    key={button.direction}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    title={
                      button.direction === 'up'
                        ? s.deliveryUp
                        : button.direction === 'down'
                          ? s.deliveryDown
                        : button.direction === 'left'
                            ? s.deliveryLeft
                            : s.deliveryRight
                    }
                    onClick={() => moveRider(button.direction)}
                    className={`${button.slot} flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/90 text-lg text-[#1f78ff] shadow-md transition-colors hover:bg-white active:bg-slate-50`}
                  >
                    {button.symbol}
                  </motion.button>
                ))}
                <div className="col-start-2 row-start-2 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-[#d9e7f7]/80 text-sm text-[#1759c4] shadow-sm">
                  {job.emoji}
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-h-[130px] grid-cols-1 grid-rows-2 gap-3">
              <div className="flex flex-col justify-center rounded-[20px] bg-slate-50/80 px-4 py-2 ring-1 ring-black/5">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-wine/50">{s.deliveryGoal}</div>
                <div className="mt-1 text-lg font-bold leading-none text-ink">{currentPhaseLabel}</div>
              </div>
              <div className="flex flex-col justify-center rounded-[20px] bg-slate-50/80 px-4 py-2 ring-1 ring-black/5">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-wine/50">{s.deliverySteps}</div>
                <div className="mt-1 text-xl font-bold leading-none text-[#1f78ff]">{run.steps}</div>
              </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
