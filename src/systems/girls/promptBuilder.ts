import { girlConfigs, metaPrompt } from '../../data'
import type { GirlState, Message } from '../../store/gameTypes'
import { formatGirlMessageForPrompt, getGirlStickerPack } from '../chat/stickerProtocol'
import { getRelationshipStage } from './affectionLogic'
import { formatGameClock, formatGameDayLabel, getGirlRoutineStatus } from '../../utils/timeSystem'

interface PromptContext {
  girl: GirlState
  recentHistory: Message[]
  gameTime: number
  extraContext?: string
  playerName?: string
  playerGender?: 'male' | 'female'
}

/**
 * 4-layer prompt assembly:
 * 1. Global behavior rules from meta.txt
 * 2. Stable persona from girl config
 * 3. Stage-specific behavior script
 * 4. Runtime chat context and recent history
 */
export const getSystemPrompt = (girlId: string, context: PromptContext) => {
  const girl = girlConfigs[girlId]
  if (!girl) return metaPrompt

  const stage = getRelationshipStage(context.girl.affection)
  const stageScript = girl.prompt.stages[stage]
  const stickerPack = getGirlStickerPack(girlId)
  const routine = getGirlRoutineStatus(girlId, context.gameTime)

  const backgroundLines = girl.background
    ? [
        `城市：${girl.background.currentCity}（老家：${girl.background.hometown}）`,
        `职业：${girl.background.occupation}`,
        `爱好：${girl.background.hobbies.join('、')}`,
        `日常：${girl.background.dailyLife}`,
      ]
    : []

  const personaBlock = [
    '## 你的人设',
    girl.prompt.persona,
    '',
    `说话风格：${girl.speakingStyle}`,
    `在意的话题：${girl.interests.join('、')}`,
    ...(backgroundLines.length > 0 ? ['', '## 你的基本信息', ...backgroundLines] : []),
    `雷区：${girl.prompt.redLines.join('、')}`,
    `软肋：${girl.prompt.softSpots.join('、')}`,
  ].join('\n')

  const stageBlock = stageScript
    ? [
        `## 当前阶段：${stage}`,
        `心理状态：${stageScript.mindset}`,
        `回复特点：${stageScript.replyStyle}`,
        `消息条数模式：${stageScript.messagePattern}`,
        `主动行为：${stageScript.initiatives}`,
        '',
        '这个阶段的典型回复：',
        ...stageScript.exampleReplies.map((reply) => `- ${reply}`),
      ].join('\n')
    : ''

  const stickerBlock =
    stickerPack && stickerPack.stickers.length > 0
      ? [
          '## 你的专属表情包',
          '你只能使用当前这位角色自己的表情包，不能借用其他人的表情包',
          '如果要发表情包，必须把某个片段单独写成 [sticker:sticker-id]',
          '可以只发表情包，例如：[sticker:peek-star]',
          '也可以先说一句话，再单独发表情包，例如：有点想你///[sticker:moon-miss]',
          '不要把文字和 [sticker:...] 写在同一个片段里',
          '表情包只用来补情绪，不要每条都发',
          '',
          '可用表情包：',
          ...stickerPack.stickers.map(
            (sticker) =>
              `- [sticker:${sticker.id}] -> ${sticker.asset}；关键词：${sticker.keywords.join(' / ')}`,
          ),
          '',
          '语义映射建议：',
          ...stickerPack.semanticMap.map(
            (mapping) =>
              `- ${mapping.intent} -> [sticker:${mapping.stickerId}]；触发词：${mapping.triggerPhrases.join(' / ')}`,
          ),
        ].join('\n')
      : ''

  const examplesBlock =
    girl.prompt.examples.length > 0
      ? [
          '## 对话示范',
          ...girl.prompt.examples.map(
            (example) => `男生：${example.player}\n你：${example.girl}`,
          ),
        ].join('\n\n')
      : ''

  const recentTopics = context.recentHistory
    .slice(-8)
    .map((message) => formatGirlMessageForPrompt(girlId, message))
    .join('\n')

  const playerLine = context.playerName
    ? `对方名叫"${context.playerName}"，性别：${context.playerGender === 'female' ? '女' : '男'}`
    : '对方信息未知'

  const runtimeBlock = [
    '## 当前状态',
    playerLine,
    `好感度：${context.girl.affection}/100（${stage}）`,
    `当前情绪：${context.girl.mood}`,
    `当前时间：${formatGameDayLabel(context.gameTime)} ${formatGameClock(context.gameTime)}`,
    `作息状态：${routine.label}（${routine.description}）`,
    '',
    '最近聊天记录：',
    recentTopics || '你们刚加上微信，还没开始聊天',
    ...(context.extraContext ? ['', `刚刚发生的事：${context.extraContext}`] : []),
  ].join('\n')

  return [metaPrompt, personaBlock, stageBlock, stickerBlock, examplesBlock, runtimeBlock]
    .filter(Boolean)
    .join('\n\n---\n\n')
}
