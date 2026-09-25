import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import type { UIConfig } from './config'

export const name = 'dsh-ui'
export type Config = UIConfig
export const Config = z.object({
  font: z.string().default('').volatile().description('英文字体, 中文字体；一段时中英文共用'),
  fontWeight: z.string().default('').volatile().description('字体粗细：100 特细、300 半细、空值默认、600 半粗、900 特粗'),
  sidebarWidth: z.string().default('').volatile().description('左侧工作区与会话列表宽度，支持 px、rem、vw，例如 280px 或 20vw'),
  conversationWidth: z.string().default('').volatile().description('对话框宽度，支持 px、rem、vw，例如 90rem 或 75vw'),
  composerWidth: z.string().default('').volatile().description('聊天框宽度，支持 px、rem、vw，例如 80rem 或 75vw'),
})

export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.effect(() => settingsCtx.settings.configure({ auto: false }, ctx.fiber))
  })
}
