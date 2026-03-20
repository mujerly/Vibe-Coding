import { create } from 'zustand'

interface AiSessionState {
  apiKey: string
  model: string
  setSession: (payload: { apiKey: string; model: string }) => void
  clearSession: () => void
}

export const useAiSessionStore = create<AiSessionState>((set) => ({
  apiKey: '',
  model: '',
  setSession: ({ apiKey, model }) =>
    set({
      apiKey: apiKey.trim(),
      model: model.trim(),
    }),
  clearSession: () =>
    set({
      apiKey: '',
      model: '',
    }),
}))
