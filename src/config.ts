export const NAMESPACE = 'dsh-ui'

export interface UIConfig {
  font: string
  conversationWidth: string
  composerWidth: string
  composerHeight: string
}

export const defaults: UIConfig = {
  font: '', conversationWidth: '', composerWidth: '', composerHeight: '',
}

export const fields = [
  { key: 'font', label: '字体', placeholder: 'LXGW WenKai Mono, Cascadia Mono', help: '第一段为中文字体，第二段为英文字体，以逗号分隔；只有一段时中英文共用。请先在本机安装字体。' },
  { key: 'conversationWidth', label: '对话框宽度', placeholder: '90rem', help: '消息展示区域的最大宽度，例如 80rem、90rem、1200px 或 1400px。' },
  { key: 'composerWidth', label: '聊天框宽度', placeholder: '80rem', help: '消息输入框的最大宽度，独立于对话框宽度。支持 px 和 rem。' },
  { key: 'composerHeight', label: '聊天框高度', placeholder: '300px', help: '消息输入框的整体高度（含底部工具栏），例如 300px。小窗口会自动限制高度，长文本在框内滚动。' },
] as const

export function parseFonts(value: string): string[] {
  if (!value.trim()) return []
  const parts = value.split(/[,，]/).map(part => part.trim().replace(/^(["'])(.*)\1$/, '$2').trim())
  if (parts.length > 2 || parts.some(part => !part || /[\x00-\x1f\x7f;{}<>\\"']/.test(part))) {
    throw new Error('字体请填写一个名称，或以逗号分隔的“中文字体, 英文字体”。')
  }
  return parts
}

export function normalizeConfig(input: UIConfig): UIConfig {
  const font = parseFonts(input.font).join(', ')
  const result = { ...input, font }
  for (const field of fields) {
    if (field.key === 'font') continue
    const value = input[field.key].trim().toLowerCase()
    if (value && (!/^(?:\d+(?:\.\d+)?|\.\d+)(px|rem)$/.test(value) || !Number.isFinite(parseFloat(value)) || parseFloat(value) <= 0)) {
      throw new Error(`${field.label}请输入大于 0 的 px 或 rem 尺寸，例如 ${field.placeholder}。`)
    }
    result[field.key] = value
  }
  return result
}
