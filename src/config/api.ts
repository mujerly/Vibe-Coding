import { useAiSessionStore } from '../store/aiSessionStore'

const openAiBaseUrl = import.meta.env.VITE_OPENAI_BASE_URL?.trim() || ''
const openAiModel = import.meta.env.VITE_OPENAI_MODEL?.trim() || ''
const invisibleWhitespacePattern = /[\s\u00a0\u1680\u180e\u2000-\u200f\u2028-\u202f\u205f\u2060\u3000\ufeff]/g
const wrappingQuotesPattern = /^[`"'“”‘’]+|[`"'“”‘’]+$/g

export const OPENAI_MODEL_PRESETS = ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o'] as const

export const defaultOpenAiBaseUrl = openAiBaseUrl || 'https://api.openai.com/v1'
export const defaultOpenAiModel = openAiModel || OPENAI_MODEL_PRESETS[0]

export const sanitizeApiKeyInput = (value: string) => {
  let normalized = value.trim()
  normalized = normalized.replace(/^authorization\s*:\s*/i, '')
  normalized = normalized.replace(/^bearer\s+/i, '')
  normalized = normalized.replace(wrappingQuotesPattern, '')
  normalized = normalized.replace(invisibleWhitespacePattern, '')
  return normalized.trim()
}

export const getApiKeyValidationError = (value: string) => {
  if (!value) return null

  if (/[^\x21-\x7e]/.test(value)) {
    return 'API Key 包含非法字符，请去掉中文引号、空格或 Bearer 前缀后重试。'
  }

  return null
}

const resolveAiConfig = (session: { apiKey: string; model: string }) => ({
  providerLabel: 'OpenAI',
  apiKey: sanitizeApiKeyInput(session.apiKey),
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
  return Boolean(
    current.apiKey &&
      current.baseUrl &&
      current.model &&
      !getApiKeyValidationError(current.apiKey),
  )
}
