import { useAiSessionStore } from '../store/aiSessionStore'

const openAiBaseUrl = import.meta.env.VITE_OPENAI_BASE_URL?.trim() || ''
const openAiModel = import.meta.env.VITE_OPENAI_MODEL?.trim() || ''

export const OPENAI_MODEL_PRESETS = ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o'] as const

export const defaultOpenAiBaseUrl = openAiBaseUrl || 'https://api.openai.com/v1'
export const defaultOpenAiModel = openAiModel || OPENAI_MODEL_PRESETS[0]

const resolveAiConfig = (session: { apiKey: string; model: string }) => ({
  providerLabel: 'OpenAI',
  apiKey: session.apiKey.trim(),
  baseUrl: defaultOpenAiBaseUrl,
  model: session.model.trim() || defaultOpenAiModel,
  defaultModel: defaultOpenAiModel,
})

export const getAiConfig = () => resolveAiConfig(useAiSessionStore.getState())

export const useAiConfig = () => {
  const apiKey = useAiSessionStore((state) => state.apiKey)
  const model = useAiSessionStore((state) => state.model)

  return resolveAiConfig({ apiKey, model })
}

export const isAiEnabled = () => {
  const current = getAiConfig()
  return Boolean(current.apiKey && current.baseUrl && current.model)
}
