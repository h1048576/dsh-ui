import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import { defaults, NAMESPACE, normalizeConfig, type UIConfig } from './config'

export const name = 'dsh-ui'
export type Config = UIConfig
export const Config: z<Config> = z.object({
  font: z.string().default('').description('英文字体, 中文字体；一段时中英文共用'),
  fontWeight: z.string().default('').description('字体粗细：100 特细、300 半细、空值默认、600 半粗、900 特粗'),
  sidebarWidth: z.string().default('').description('左侧工作区与会话列表宽度，支持 px、rem、vw，例如 280px 或 20vw'),
  conversationWidth: z.string().default('').description('对话框宽度，支持 px、rem、vw，例如 90rem 或 75vw'),
  composerWidth: z.string().default('').description('聊天框宽度，支持 px、rem、vw，例如 80rem 或 75vw'),
})

export function apply(ctx: Context, config: Config = defaults): void {
  normalizeConfig({ ...defaults, ...config })
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, NAMESPACE, Config, config, {
      validate: value => { normalizeConfig(value) },
      // 样式由浏览器订阅 settingsScope 后应用，宿主无需维护派生状态。
      setSource: () => {},
      onChange: () => {},
    })
  })
}
