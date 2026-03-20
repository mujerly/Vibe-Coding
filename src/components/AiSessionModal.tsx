import { useEffect, useState } from 'react'
import {
  defaultOpenAiBaseUrl,
  getApiKeyValidationError,
  OPENAI_MODEL_PRESETS,
  sanitizeApiKeyInput,
  useAiConfig,
} from '../config/api'
import { uiStrings } from '../data'
import { useAiSessionStore } from '../store/aiSessionStore'

interface AiSessionModalProps {
  open: boolean
  onClose: () => void
}

interface ModelListApiResponse {
  data?: Array<{
    id?: string
  }>
  error?: {
    message?: string
  }
}

const customModelValue = '__custom_model__'

const blockedModelTokens = [
  'audio',
  'embedding',
  'image',
  'moderation',
  'preview',
  'realtime',
  'search',
  'transcribe',
  'tts',
  'whisper',
]

const isChatModelOption = (modelId: string) => {
  const lower = modelId.toLowerCase()
  if (/\d{4}-\d{2}-\d{2}$/.test(lower)) {
    return false
  }

  if (blockedModelTokens.some((token) => lower.includes(token))) {
    return false
  }

  return lower.startsWith('gpt-') || lower.startsWith('o')
}

const dedupeModels = (models: string[]) =>
  Array.from(new Set(models.map((model) => model.trim()).filter(Boolean)))

const sortModels = (models: string[]) => {
  const preferred = [...OPENAI_MODEL_PRESETS]

  return [...models].sort((left, right) => {
    const leftIndex = preferred.indexOf(left as (typeof OPENAI_MODEL_PRESETS)[number])
    const rightIndex = preferred.indexOf(right as (typeof OPENAI_MODEL_PRESETS)[number])

    if (leftIndex >= 0 || rightIndex >= 0) {
      if (leftIndex < 0) return 1
      if (rightIndex < 0) return -1
      return leftIndex - rightIndex
    }

    return left.localeCompare(right)
  })
}

const parseModelListPayload = (payloadText: string) => {
  if (!payloadText.trim()) {
    return {} as ModelListApiResponse
  }

  try {
    return JSON.parse(payloadText) as ModelListApiResponse
  } catch {
    return {} as ModelListApiResponse
  }
}

export function AiSessionModal({ open, onClose }: AiSessionModalProps) {
  const currentConfig = useAiConfig()
  const setSession = useAiSessionStore((state) => state.setSession)
  const s = uiStrings.aiSession
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [isCustomModel, setIsCustomModel] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([...OPENAI_MODEL_PRESETS])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelStatus, setModelStatus] = useState('')

  useEffect(() => {
    if (!open) return
    setApiKey('')
    setModel(currentConfig.model)
    const initialModels = sortModels(dedupeModels([...OPENAI_MODEL_PRESETS, currentConfig.model]))
    setAvailableModels(initialModels)
    setIsCustomModel(Boolean(currentConfig.model) && !initialModels.includes(currentConfig.model))
    setLoadingModels(false)
    setModelStatus('')
  }, [currentConfig.model, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1219]/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] bg-white px-5 py-5 shadow-phone">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-wine/45">{s.activeBadge}</div>
          <h2 className="mt-2 font-display text-3xl text-ink">{s.title}</h2>
          <p className="mt-2 text-sm leading-6 text-wine/65">{s.subtitle}</p>
        </div>

        <label className="mt-5 block text-sm font-semibold text-ink">{s.keyLabel}</label>
        <input
          type="password"
          value={apiKey}
          onChange={(event) => {
            setApiKey(event.target.value)
            setModelStatus('')
          }}
          placeholder={s.keyPlaceholder}
          className="mt-2 w-full rounded-[20px] border border-rose-100 bg-rose-50/35 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-wine/35 focus:border-rose-300"
        />

        <label className="mt-4 block text-sm font-semibold text-ink">{s.modelLabel}</label>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              if (!apiKey.trim() || loadingModels) return
              const normalizedApiKey = sanitizeApiKeyInput(apiKey)
              const validationError = getApiKeyValidationError(normalizedApiKey)
              setApiKey(normalizedApiKey)
              if (!normalizedApiKey) {
                setModelStatus('请输入有效的 API Key。')
                return
              }
              if (validationError) {
                setModelStatus(validationError)
                return
              }
              setLoadingModels(true)
              setModelStatus('')

              try {
                const response = await fetch(`${defaultOpenAiBaseUrl}/models`, {
                  headers: {
                    Authorization: `Bearer ${normalizedApiKey}`,
                  },
                })

                const payloadText = await response.text()
                const payload = parseModelListPayload(payloadText)

                if (!response.ok) {
                  const detail = payload.error?.message?.trim() || payloadText.trim()
                  throw new Error(
                    detail
                      ? `${response.status} - ${detail}`
                      : `${response.status}`,
                  )
                }

                const detectedModels = sortModels(
                  dedupeModels(
                    (payload.data ?? [])
                      .map((item) => item.id?.trim() || '')
                      .filter(isChatModelOption),
                  ),
                )

                const mergedModels = sortModels(
                  dedupeModels([
                    ...OPENAI_MODEL_PRESETS,
                    ...detectedModels,
                    model,
                    currentConfig.defaultModel,
                  ]),
                )

                setAvailableModels(mergedModels)
                setIsCustomModel(Boolean(model.trim()) && !mergedModels.includes(model))
                if (!model.trim()) {
                  setModel(
                    mergedModels.includes(currentConfig.defaultModel)
                      ? currentConfig.defaultModel
                      : mergedModels[0] || currentConfig.defaultModel,
                  )
                  setIsCustomModel(false)
                }
                setModelStatus(
                  s.modelDetectSuccess.replace('{count}', String(detectedModels.length)),
                )
              } catch (error) {
                const reason =
                  error instanceof Error ? error.message : s.modelDetectUnknownError
                setModelStatus(s.modelDetectFailed.replace('{reason}', reason))
              } finally {
                setLoadingModels(false)
              }
            }}
            disabled={!apiKey.trim() || loadingModels}
            className="shrink-0 rounded-[18px] bg-rose-100 px-4 py-3 text-sm font-semibold text-wine transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {loadingModels ? s.modelDetectLoading : s.modelDetectButton}
          </button>
          <div className="text-xs leading-5 text-wine/55">{s.modelHelper}</div>
        </div>
        <select
          value={isCustomModel ? customModelValue : model}
          onChange={(event) => {
            if (event.target.value === customModelValue) {
              setIsCustomModel(true)
              setModel('')
              return
            }

            setIsCustomModel(false)
            setModel(event.target.value)
          }}
          className="mt-2 w-full rounded-[20px] border border-rose-100 bg-rose-50/35 px-4 py-3 text-sm text-ink outline-none transition focus:border-rose-300"
        >
          {availableModels.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
          <option value={customModelValue}>{s.modelCustomOption}</option>
        </select>
        {isCustomModel ? (
          <input
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder={s.modelPlaceholder}
            className="mt-2 w-full rounded-[20px] border border-rose-100 bg-rose-50/35 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-wine/35 focus:border-rose-300"
          />
        ) : null}
        {modelStatus ? (
          <div className="mt-2 rounded-[18px] bg-cream px-4 py-3 text-xs leading-5 text-wine/70">
            {modelStatus}
          </div>
        ) : null}

        <div className="mt-4 rounded-[22px] bg-cream px-4 py-4 text-sm leading-6 text-wine/65">
          {s.hint}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[20px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600"
          >
            {s.cancelButton}
          </button>
          <button
            type="button"
            onClick={() => {
              const normalizedApiKey = sanitizeApiKeyInput(apiKey)
              const validationError = getApiKeyValidationError(normalizedApiKey)
              setApiKey(normalizedApiKey)
              if (!normalizedApiKey || validationError) {
                setModelStatus(validationError ?? '请输入有效的 API Key。')
                return
              }
              setSession({
                apiKey: normalizedApiKey,
                model,
              })
              onClose()
            }}
            disabled={!apiKey.trim()}
            className="flex-1 rounded-[20px] bg-wine px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-wine/35"
          >
            {s.saveButton}
          </button>
        </div>
      </div>
    </div>
  )
}
