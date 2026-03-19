const baseUrl =
  import.meta.env.VITE_SILICONFLOW_BASE_URL?.trim() || 'https://api.siliconflow.cn/v1'
const apiKey = import.meta.env.VITE_SILICONFLOW_API_KEY?.trim() || ''
const model = import.meta.env.VITE_SILICONFLOW_MODEL?.trim() || 'Qwen/Qwen2.5-7B-Instruct'

export const siliconflowConfig = {
  apiKey,
  baseUrl,
  model,
}

export const isSiliconflowEnabled = Boolean(apiKey)
