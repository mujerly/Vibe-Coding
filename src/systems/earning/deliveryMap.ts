export interface GridPosition {
  x: number
  y: number
}

export interface DeliveryStage {
  grid: boolean[][]
  start: GridPosition
  target: GridPosition
}

export type Direction = 'up' | 'down' | 'left' | 'right'

const GRID_SIZE = 11

const directionOffsets: Record<Direction, GridPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const shuffle = <T,>(items: T[]) => {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const temp = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = temp
  }

  return next
}

const serializeGridPosition = ({ x, y }: GridPosition) => `${x},${y}`

const samePosition = (left: GridPosition, right: GridPosition) =>
  left.x === right.x && left.y === right.y

const canCarveTo = (grid: boolean[][], x: number, y: number) =>
  y > 0 && y < GRID_SIZE - 1 && x > 0 && x < GRID_SIZE - 1 && !grid[y][x]

const carveMaze = (grid: boolean[][], x: number, y: number) => {
  grid[y][x] = true

  for (const direction of shuffle(Object.values(directionOffsets))) {
    const nextX = x + direction.x * 2
    const nextY = y + direction.y * 2

    if (!canCarveTo(grid, nextX, nextY)) continue

    grid[y + direction.y][x + direction.x] = true
    carveMaze(grid, nextX, nextY)
  }
}

const getRoadCells = (grid: boolean[][]) => {
  const cells: GridPosition[] = []

  grid.forEach((row, y) => {
    row.forEach((isRoad, x) => {
      if (isRoad) {
        cells.push({ x, y })
      }
    })
  })

  return cells
}

const findFarthestRoad = (grid: boolean[][], start: GridPosition) => {
  const queue: GridPosition[] = [start]
  const distances = new Map<string, number>([[serializeGridPosition(start), 0]])
  let farthest = start

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    const currentDistance = distances.get(serializeGridPosition(current)) ?? 0
    if (currentDistance > (distances.get(serializeGridPosition(farthest)) ?? 0)) {
      farthest = current
    }

    for (const direction of Object.values(directionOffsets)) {
      const next = {
        x: current.x + direction.x,
        y: current.y + direction.y,
      }

      if (!grid[next.y]?.[next.x]) continue

      const key = serializeGridPosition(next)
      if (distances.has(key)) continue

      distances.set(key, currentDistance + 1)
      queue.push(next)
    }
  }

  return {
    position: farthest,
    distance: distances.get(serializeGridPosition(farthest)) ?? 0,
  }
}

const pickRandomRoad = (cells: GridPosition[]) => cells[Math.floor(Math.random() * cells.length)]

const getNeighbors = (grid: boolean[][], position: GridPosition) =>
  Object.values(directionOffsets)
    .map((direction) => ({
      x: position.x + direction.x,
      y: position.y + direction.y,
    }))
    .filter((next) => Boolean(grid[next.y]?.[next.x]))

export const findShortestPath = (
  grid: boolean[][],
  start: GridPosition,
  target: GridPosition,
): GridPosition[] => {
  if (samePosition(start, target)) {
    return [start]
  }

  const queue: GridPosition[] = [start]
  const parents = new Map<string, string | null>([[serializeGridPosition(start), null]])
  const positions = new Map<string, GridPosition>([[serializeGridPosition(start), start]])

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    if (samePosition(current, target)) {
      break
    }

    for (const next of getNeighbors(grid, current)) {
      const key = serializeGridPosition(next)
      if (parents.has(key)) continue

      parents.set(key, serializeGridPosition(current))
      positions.set(key, next)
      queue.push(next)
    }
  }

  const targetKey = serializeGridPosition(target)
  if (!parents.has(targetKey)) {
    return [start]
  }

  const path: GridPosition[] = []
  let currentKey: string | null = targetKey

  while (currentKey) {
    const position = positions.get(currentKey) ?? start
    path.push(position)
    currentKey = parents.get(currentKey) ?? null
  }

  return path.reverse()
}

const createStage = (): DeliveryStage => {
  while (true) {
    const grid = Array.from({ length: GRID_SIZE }, () => Array<boolean>(GRID_SIZE).fill(false))
    carveMaze(grid, 1, 1)

    const roads = getRoadCells(grid)
    const start = pickRandomRoad(roads)
    const { position: target, distance } = findFarthestRoad(grid, start)

    if (!samePosition(start, target) && distance >= 10) {
      return { grid, start, target }
    }
  }
}

export const createDeliveryStages = (): [DeliveryStage, DeliveryStage] => [createStage(), createStage()]

export const movePosition = (position: GridPosition, direction: Direction): GridPosition => ({
  x: position.x + directionOffsets[direction].x,
  y: position.y + directionOffsets[direction].y,
})

export const canMoveToCell = (stage: DeliveryStage, position: GridPosition) =>
  Boolean(stage.grid[position.y]?.[position.x])

export { samePosition, serializeGridPosition }
