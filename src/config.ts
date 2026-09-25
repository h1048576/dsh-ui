export const NAMESPACE = 'dsh-ui'

export interface UIConfig {
  font: string
  fontWeight: string
  sidebarWidth: string
  conversationWidth: string
  composerWidth: string
}

export const defaults: UIConfig = {
  font: '', fontWeight: '', sidebarWidth: '', conversationWidth: '', composerWidth: '',
}

export const fontWeightOptions = [
  { label: '特细', value: '100' },
  { label: '半细', value: '300' },
  { label: '默认', value: '' },
  { label: '半粗', value: '600' },
  { label: '特粗', value: '900' },
] as const

export const fields = [
  { key: 'font', label: '字体', placeholder: 'Cascadia Mono, LXGW WenKai Mono' },
  { key: 'fontWeight', label: '字体粗细', options: fontWeightOptions },
  { key: 'sidebarWidth', label: '左侧栏宽度', placeholder: '280px' },
  { key: 'conversationWidth', label: '消息内容宽度', placeholder: '90rem' },
  { key: 'composerWidth', label: '输入框宽度', placeholder: '80rem' },
] as const

export function parseFonts(value: string): string[] {
  if (!value.trim()) return []
  const parts = value.split(/[,，]/).map(part => part.trim().replace(/^(["'])(.*)\1$/, '$2').trim())
  if (parts.length > 2 || parts.some(part => !part || /[\x00-\x1f\x7f;{}<>\\"']/.test(part))) {
    throw new Error('字体请填写一个名称，或以逗号分隔的“英文字体, 中文字体”。')
  }
  return parts
}

export function normalizeConfig(input: UIConfig): UIConfig {
  const font = parseFonts(input.font).join(', ')
  const fontWeight = input.fontWeight ?? defaults.fontWeight
  if (!fontWeightOptions.some(option => option.value === fontWeight)) {
    throw new Error('字体粗细请选择特细、半细、默认、半粗或特粗。')
  }
  const result = { ...input, font, fontWeight }
  for (const field of fields) {
    if (field.key === 'font' || field.key === 'fontWeight') continue
    const value = (input[field.key] ?? defaults[field.key]).trim().toLowerCase()
    if (value && (!/^(?:\d+(?:\.\d+)?|\.\d+)(px|rem|vw)$/.test(value) || !Number.isFinite(parseFloat(value)) || parseFloat(value) <= 0)) {
      throw new Error(`${field.label}请输入大于 0 的 px、rem 或 vw 尺寸，例如 ${field.placeholder} 或 75vw。`)
    }
    result[field.key] = value
  }
  return result
}
