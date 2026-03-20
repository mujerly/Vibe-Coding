import giftsData from './economy/gifts.json'
import jobsData from './economy/jobs.json'
import slotSymbolsData from './economy/slot-symbols.json'
import appsData from './apps.json'
import balanceData from './balance.json'
import uiStringsData from './ui-strings.json'
import metaPromptText from './prompts/meta.txt?raw'

import type {
  GirlConfig,
  GirlStickerPackConfig,
  GiftConfig,
  BalanceConfig,
  PhoneAppConfig,
  SlotSymbolConfig,
  UiStringsConfig,
} from './types'
import type { JobDefinition } from '../store/gameTypes'

/**
 * Auto-load all girl JSON configs from src/data/girls/.
 * To add a new girl, just create a new .json file — no code changes needed.
 *
 * Uses Vite's import.meta.glob with { eager: true } to statically import
 * all JSON files at build time.
 */
const girlModules = import.meta.glob<GirlConfig>('./girls/*.json', { eager: true, import: 'default' })
const stickerPackModules = import.meta.glob<GirlStickerPackConfig>('./girls/stickers/*.json', {
  eager: true,
  import: 'default',
})

const isGirlConfig = (value: unknown): value is GirlConfig => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<GirlConfig>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.avatar === 'string' &&
    candidate.prompt != null &&
    candidate.fallback != null
  )
}

export const girlConfigs: Record<string, GirlConfig> = Object.fromEntries(
  Object.values(girlModules)
    .filter(isGirlConfig)
    .map((girl) => [girl.id, girl]),
)

export const girlStickerPacks: Record<string, GirlStickerPackConfig> = Object.fromEntries(
  Object.entries(stickerPackModules)
    .map(([path, pack]) => {
      const match = path.match(/\.\/girls\/stickers\/(.+)\.json$/)
      return match ? [match[1], pack] : null
    })
    .filter((entry): entry is [string, GirlStickerPackConfig] => entry != null),
)

export const giftConfigs: GiftConfig[] = giftsData as GiftConfig[]

export const jobConfigs: JobDefinition[] = jobsData as JobDefinition[]

export const slotSymbolConfigs: SlotSymbolConfig[] = slotSymbolsData as SlotSymbolConfig[]

export const appConfigs: PhoneAppConfig[] = appsData as PhoneAppConfig[]

export const balance: BalanceConfig = balanceData as BalanceConfig

export const uiStrings: UiStringsConfig = uiStringsData as unknown as UiStringsConfig

export const metaPrompt: string = metaPromptText

/** Simple template string helper: t("到账 ¥{reward}", { reward: 100 }) → "到账 ¥100" */
export const t = (template: string, vars: Record<string, string | number> = {}): string =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`))
