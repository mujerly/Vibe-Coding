import type { GirlState, Message } from '../../store/gameTypes'
import { getRelationshipStage } from './affectionLogic'
import { girlConfigs, metaPrompt } from '../../data'

interface PromptContext {
  girl: GirlState
  recentHistory: Message[]
  extraContext?: string
}

/**
 * 4-Layer Prompt Architecture:
 *
 * Layer 1 (meta.txt)     → Fixed AI behavior rules + output format
 * Layer 2 (persona)      → Who she is, how she talks, red lines, soft spots
 * Layer 3 (stage script) → Current stage: mindset, reply style, examples
 * Layer 4 (runtime)      → Auto-generated: affection, mood, chat history, events
 */
export const getSystemPrompt = (girlId: string, context: PromptContext) => {
  const girl = girlConfigs[girlId]
  if (!girl) return metaPrompt

  const stage = getRelationshipStage(context.girl.affection)
  const stageScript = girl.prompt.stages[stage]

  // ── Layer 1: Meta Instructions ──
  const metaBlock = metaPrompt

  // ── Layer 2: Persona Card ──
  const personaLines = [
    `## 你的人设`,
    girl.prompt.persona,
    ``,
    `说话风格：${girl.speakingStyle}`,
    `你在意的话题：${girl.interests.join('、')}`,
    `雷区（绝对不能触碰）：${girl.prompt.redLines.join('、')}`,
    `软肋（容易被打动）：${girl.prompt.softSpots.join('、')}`,
  ]
  const personaBlock = personaLines.join('\n')

  // ── Layer 3: Stage Script ──
  let stageBlock = ''
  if (stageScript) {
    const stageLines = [
      `## 当前阶段：${stage}`,
      `你的心理状态：${stageScript.mindset}`,
      `回复特点：${stageScript.replyStyle}`,
      `主动行为：${stageScript.initiatives}`,
      ``,
      `这个阶段的典型回复示范：`,
      ...stageScript.exampleReplies.map((r) => `- "${r}"`),
    ]
    stageBlock = stageLines.join('\n')
  }

  // ── Few-shot Examples ──
  let examplesBlock = ''
  if (girl.prompt.examples.length > 0) {
    const lines = [
      `## 对话示范（模仿这些回复的语气和风格）`,
      ...girl.prompt.examples.map((e) => `男生：${e.player}\n你：${e.girl}`),
    ]
    examplesBlock = lines.join('\n\n')
  }

  // ── Layer 4: Runtime Context ──
  const recentTopics = context.recentHistory
    .slice(-8)
    .map((message) => `${message.role === 'player' ? '男生' : '你'}：${message.content}`)
    .join('\n')

  const runtimeLines = [
    `## 当前状态`,
    `好感度：${context.girl.affection}/100（${stage}）`,
    `你现在的情绪：${context.girl.mood}`,
    ``,
    `最近聊天记录：`,
    recentTopics || '你们刚加上微信，还没聊太多。',
  ]

  if (context.extraContext) {
    runtimeLines.push(``, `刚刚发生的事：${context.extraContext}`)
  }

  const runtimeBlock = runtimeLines.join('\n')

  // ── Assemble ──
  const sections = [metaBlock, personaBlock, stageBlock, examplesBlock, runtimeBlock].filter(Boolean)
  return sections.join('\n\n---\n\n')
}
