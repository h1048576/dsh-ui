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
  .dsh-ui-settings { display: flex; flex-direction: column; width: 100%; color: var(--dsw-alias-label-primary); }
  .dsh-ui-settings-row { display: flex; align-items: center; gap: 8px; padding: 16px 0; border-bottom: .5px solid var(--dsw-alias-border-l2); font-size: 14px; font-weight: 400; line-height: 22px; }
  .dsh-ui-settings-row:last-child { border-bottom: none; }
  .dsh-ui-settings-row > span { flex: 1; white-space: nowrap; }
  .dsh-ui-settings input { box-sizing: border-box; width: 60%; max-width: 300px; min-width: 0; height: 36px; padding: 0 14px; border: none; border-radius: 18px; background: var(--dsw-alias-bg-module-platform); color: inherit; font: inherit; text-align: right; }
  .dsh-ui-settings input:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
  .dsh-ui-settings input:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #3964fe); outline-offset: 2px; }
  .dsh-ui-settings input[aria-invalid=true] { outline: 1px solid var(--dsw-alias-state-error-primary, #c33); }
  .dsh-ui-settings :disabled { opacity: .55; cursor: default; }
`
