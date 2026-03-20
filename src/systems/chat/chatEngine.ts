import { getAiConfig, getApiKeyValidationError, isAiEnabled } from '../../config/api'
import { girlConfigs } from '../../data'
import type { GirlState, Message } from '../../store/gameTypes'
import { getRelationshipStage } from '../girls/affectionLogic'
import { getSystemPrompt } from '../girls/promptBuilder'

interface ChatRequestContext {
  girlId: string
  girl: GirlState
  recentHistory: Message[]
  playerMessage: string
  gameTime: number
  extraContext?: string
  playerName?: string
  playerGender?: 'male' | 'female'
}

export interface ChatReplyPayload {
  reply: string
  affectionChange: number
  mood: string
  source: 'ai' | 'fallback'
  debugReason?: string
}

interface ChatApiResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

interface ChatApiErrorResponse {
  error?: {
    message?: string
  }
}

interface ParsedStructuredReply {
  reply: string
  affectionChange: number
  mood: string
}

const clampDelta = (value: number) => Math.max(-10, Math.min(10, value))

const cleanFreeformText = (text: string) =>
  text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

const parseStructuredReply = (raw: string): ParsedStructuredReply | null => {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/i)
  const directCandidate = fenced?.[1] ?? trimmed
  const objectStart = directCandidate.indexOf('{')
  const objectEnd = directCandidate.lastIndexOf('}')
  const candidate =
    objectStart >= 0 && objectEnd > objectStart
      ? directCandidate.slice(objectStart, objectEnd + 1)
      : directCandidate

  try {
    const parsed = JSON.parse(candidate)
    if (typeof parsed.reply !== 'string' || typeof parsed.mood !== 'string') {
      return null
    }

    return {
      reply: parsed.reply.trim(),
      affectionChange: clampDelta(Number(parsed.affection_change ?? 0)),
      mood: parsed.mood.trim(),
    }
  } catch {
    return null
  }
}

const salvageStructuredReply = (raw: string): ParsedStructuredReply | null => {
  const normalized = cleanFreeformText(raw)
  const replyMatch = normalized.match(/"reply"\s*:\s*"([\s\S]*?)"/)
  const moodMatch = normalized.match(/"mood"\s*:\s*"([\s\S]*?)"/)
  const affectionMatch = normalized.match(/"affection_change"\s*:\s*(-?\d+)/)

  if (replyMatch) {
    return {
      reply: replyMatch[1].replace(/\\"/g, '"').trim(),
      affectionChange: clampDelta(Number(affectionMatch?.[1] ?? 0)),
      mood: (moodMatch?.[1] ?? '自然').replace(/\\"/g, '"').trim(),
    }
  }

  const freeformReply = normalized.split('{')[0].trim() || normalized
  if (!freeformReply) {
    return null
  }

  return {
    reply: freeformReply,
    affectionChange: 0,
    mood: '自然',
  }
}

const buildOpenAiHistory = (recentHistory: Message[]) =>
  recentHistory.slice(-20).map((message) => ({
    role:
      message.role === 'player'
        ? 'user'
        : message.role === 'girl'
          ? 'assistant'
          : 'system',
    content: message.content,
  }))

const readApiErrorDetail = async (response: Response) => {
  const rawText = await response.text()
  if (!rawText.trim()) {
    return ''
  }

  try {
    const parsed = JSON.parse(rawText) as ChatApiErrorResponse
    return parsed.error?.message?.trim() || rawText.trim()
  } catch {
    return rawText.trim()
  }
}

const detectSignals = (playerMessage: string) => {
  return {
    isOily: /(宝贝|亲爱的|老婆|宝宝|baby)/i.test(playerMessage),
    isSweet: /(想你|喜欢|可爱|陪你|晚安|想见|抱抱|在乎|第一时间)/i.test(playerMessage),
    isPractical: /(安排|礼物|请你|吃饭|下班|计划|餐厅|接你|周末|口红|包)/i.test(
      playerMessage,
    ),
    isDeep: /(电影|展览|音乐|哲学|创作|灵感|故事|颜色|诗)/i.test(playerMessage),
    isLong: playerMessage.length >= 18,
  }
}

/**
 * Data-driven fallback: reads signal weights and reply templates from girl config.
 * No more per-girl if/else branches.
 */
const buildLocalFallbackReply = (
  context: ChatRequestContext,
  debugReason?: string,
): ChatReplyPayload => {
  const girl = girlConfigs[context.girlId]
  if (!girl) {
    return {
      reply: '嗯。',
      affectionChange: 0,
      mood: '自然',
      source: 'fallback',
      debugReason,
    }
  }

  const signals = detectSignals(context.playerMessage)
  const stage = getRelationshipStage(context.girl.affection)
  const mentionsGift = Boolean(context.extraContext)

  const weights = girl.fallback.signalWeights
  let affectionChange = 0
  affectionChange += signals.isSweet ? weights.sweet : 0
  affectionChange += signals.isLong ? weights.long : 0
  affectionChange += mentionsGift ? weights.gift : 0
  affectionChange += signals.isOily ? weights.oily : 0
  affectionChange += signals.isPractical ? weights.practical : 0
  affectionChange += signals.isDeep ? weights.deep : 0

  // Base score if no signals matched
  if (affectionChange === 0 && !signals.isOily) {
    affectionChange = 1
  }

  if (stage === '热恋') {
    affectionChange += 1
  }

  let reply: string
  let mood: string

  if (affectionChange >= girl.fallback.goodThreshold) {
    reply = girl.fallback.goodReply.text
    mood = girl.fallback.goodReply.mood
  } else if (affectionChange < 0 && girl.fallback.badReply) {
    reply = girl.fallback.badReply.text
    mood = girl.fallback.badReply.mood
  } else {
    reply = girl.fallback.neutralReply.text
    mood = girl.fallback.neutralReply.mood
  }

  return {
    reply,
    affectionChange: clampDelta(affectionChange),
    mood,
    source: 'fallback',
    debugReason,
  }
}

const requestAiReply = async (context: ChatRequestContext) => {
  const aiConfig = getAiConfig()
  const apiKeyValidationError = getApiKeyValidationError(aiConfig.apiKey)
  if (apiKeyValidationError) {
    throw new Error(apiKeyValidationError)
  }

  const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: aiConfig.model,
      temperature: 0.8,
      max_completion_tokens: 400,
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(context.girlId, {
            girl: context.girl,
            recentHistory: context.recentHistory,
            gameTime: context.gameTime,
            extraContext: context.extraContext,
            playerName: context.playerName,
            playerGender: context.playerGender,
          }),
        },
        ...buildOpenAiHistory(context.recentHistory),
        {
          role: 'user',
          content: context.playerMessage,
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await readApiErrorDetail(response)
    const suffix = detail ? `：${detail}` : ''
    throw new Error(`${aiConfig.providerLabel} 请求失败（${response.status}）${suffix}`)
  }

  const data = (await response.json()) as ChatApiResponse
  const rawContent = data.choices?.[0]?.message?.content ?? ''
  const parsed = parseStructuredReply(rawContent)
  const salvaged = parsed ?? salvageStructuredReply(rawContent)

  if (!salvaged) {
    throw new Error('AI 返回内容不是约定的 JSON 格式')
  }

  return {
    ...salvaged,
    source: 'ai' as const,
  }
}

export const generateChatReply = async (
  context: ChatRequestContext,
): Promise<ChatReplyPayload> => {
  if (!isAiEnabled()) {
    return buildLocalFallbackReply(context, '未输入本次会话 OpenAI Key')
  }

  try {
    return await requestAiReply(context)
  } catch (error) {
    const debugReason = error instanceof Error ? error.message : '未知错误'
    return buildLocalFallbackReply(context, debugReason)
  }
}
