export interface GameEvent {
  id: string
  type: string
  trigger: () => boolean
  effect: () => void
  description: string
}

export const checkEvents = (): GameEvent[] => []

export const triggerEvent = (eventId: string) => {
  void eventId
}
