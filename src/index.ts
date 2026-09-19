import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import { defaults, NAMESPACE, normalizeConfig, type UIConfig } from './config'

export const name = 'dsh-ui'
export type Config = UIConfig
export const Config: z<Config> = z.object({
  font: z.string().default('').description('中文字体, 英文字体；一段时中英文共用'),
  conversationWidth: z.string().default('').description('对话框宽度，例如 90rem'),
  composerWidth: z.string().default('').description('聊天框宽度，例如 80rem'),
  composerHeight: z.string().default('').description('聊天框整体高度，例如 300px'),
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
