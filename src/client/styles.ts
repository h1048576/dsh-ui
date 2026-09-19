import { normalizeConfig, parseFonts, type UIConfig } from '../config'

// 使用官方语义属性和 CSS 变量，不绑定 CSS Modules 的编译后类名。
const conversation = '[data-slot="main.conversation"], [data-conversation-content], [data-conversation-scroll]'

export function appearanceStyles(input: UIConfig): string {
  const config = normalizeConfig(input)
  const fonts = parseFonts(config.font)
  const rules: string[] = []
  if (fonts.length) {
    const chinese = JSON.stringify(fonts[0])
    const english = JSON.stringify(fonts[1] ?? fonts[0])
    // Latin 与 CJK 字符范围互不重叠，即使中文字体包含英文也不会抢占英文字形。
    rules.push(`
      @font-face { font-family: "DSH UI Latin"; src: local(${english}); unicode-range: U+0000-024F,U+1E00-1EFF,U+2000-206F; }
      @font-face { font-family: "DSH UI CJK"; src: local(${chinese}); unicode-range: U+2E80-9FFF,U+F900-FAFF,U+FE10-FE1F,U+FE30-FE4F,U+FF00-FFEF,U+20000-323AF; }
      :root, body { --dsw-font-family: "DSH UI Latin", "DSH UI CJK", ${english}, ${chinese}, sans-serif !important;
        --ds-font-family-code: "DSH UI Latin", "DSH UI CJK", ${english}, ${chinese}, monospace !important; }
      body { font-family: var(--dsw-font-family); }
    `)
  }
  const variables: string[] = []
  if (config.conversationWidth) {
    variables.push(`--dsh-chat-content-width: ${config.conversationWidth} !important;`)
    rules.push(`${conversation.split(', ').map(s => `${s} [data-width-handle]`).join(', ')} { display: none !important; }`)
  }
  if (config.composerWidth) variables.push(`--dsh-composer-card-max-width: ${config.composerWidth} !important;`)
  if (config.composerHeight) {
    const height = `min(${config.composerHeight}, 60dvh)`
    rules.push(`
      [data-composer-card] { height: ${height} !important; }
      [data-composer-card] > [data-input-scroll] { flex: 1 1 0; min-height: 0; max-height: none !important; overflow-y: auto; }
      [data-composer-card] > :not([data-input-scroll]) { flex-shrink: 0; }
    `)
  }
  if (variables.length) rules.push(`${conversation} { ${variables.join('\n')} }`)
  return rules.join('\n')
}

export const settingsStyles = `
  .dsh-ui-settings { padding: 20px; color: var(--dsw-alias-label-primary); }
  .dsh-ui-settings h2 { margin: 0 0 8px; font-size: 18px; }
  .dsh-ui-settings p { line-height: 1.6; }
  .dsh-ui-settings fieldset { padding: 0; border: 0; margin: 20px 0; display: grid; gap: 20px; min-width: 0; }
  .dsh-ui-settings label { display: grid; gap: 8px; font-weight: 500; }
  .dsh-ui-settings input { box-sizing: border-box; width: 100%; max-width: 560px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l3, #888); border-radius: 8px; background: var(--dsw-alias-bg-base); color: inherit; font: inherit; }
  .dsh-ui-settings small { color: var(--dsw-alias-label-secondary); font-weight: 400; line-height: 1.6; }
  .dsh-ui-settings input:focus-visible, .dsh-ui-settings button:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #3964fe); outline-offset: 2px; }
  .dsh-ui-settings footer { display: flex; gap: 12px; flex-wrap: wrap; }
  .dsh-ui-settings button { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l3, #888); color: inherit; background: var(--dsw-alias-interactive-bg-hover); cursor: pointer; font: inherit; }
  .dsh-ui-settings button[type=submit] { background: var(--dsw-alias-state-business-primary, #3964fe); color: white; border-color: transparent; }
  .dsh-ui-settings :disabled { opacity: .55; cursor: default; }
  .dsh-ui-settings [role=alert] { color: var(--dsw-alias-state-error-primary, #c33); }
`
