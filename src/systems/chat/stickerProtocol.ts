import { girlStickerPacks } from '../../data'
import type { GirlStickerConfig } from '../../data/types'
import type { Message } from '../../store/gameTypes'

const stickerTokenPattern = /^\[sticker:([a-z0-9-_]+)\]$/i
const trailingReplyPunctuationPattern = /[。！？!?.,，；;：:~～…]+$/u

export interface ParsedGirlReplySegment {
  content: string
  stickerId?: string
}

const normalizeTextChunk = (content: string) =>
  content.trim().replace(trailingReplyPunctuationPattern, '').trim()

export const getGirlStickerPack = (girlId: string) => girlStickerPacks[girlId]

export const getGirlStickerById = (
  girlId: string,
  stickerId?: string,
): GirlStickerConfig | undefined => {
  if (!stickerId) return undefined
  return getGirlStickerPack(girlId)?.stickers.find((sticker) => sticker.id === stickerId)
}

export const parseGirlReplySegments = (
  girlId: string,
  reply: string,
): ParsedGirlReplySegment[] => {
  const chunks = reply
    .split(/\s*\/\/\/\s*/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  const segments = chunks
    .map((chunk): ParsedGirlReplySegment | null => {
      const stickerMatch = chunk.match(stickerTokenPattern)
      if (stickerMatch) {
        const sticker = getGirlStickerById(girlId, stickerMatch[1])
        if (sticker) {
          return {
            content: '[sticker]',
            stickerId: sticker.id,
          }
        }
      }

      const normalized = normalizeTextChunk(chunk)
      if (!normalized) return null

      return {
        content: normalized,
      }
    })
    .filter((segment): segment is ParsedGirlReplySegment => segment != null)

  return segments.length > 0
    ? segments
    : [
        {
          content: normalizeTextChunk(reply) || '嗯',
        },
      ]
}

export const formatGirlMessageForPrompt = (girlId: string, message: Message) => {
  const speaker =
    message.role === 'player' ? '男生' : message.role === 'girl' ? '你' : '系统'

  if (message.role === 'girl' && message.stickerId) {
    const sticker = getGirlStickerById(girlId, message.stickerId)
    if (sticker) {
      return `${speaker}：发了一个表情包 [sticker:${sticker.id}]（${sticker.keywords.join(' / ')}）`
    }
  }

  return `${speaker}：${message.content}`
}
