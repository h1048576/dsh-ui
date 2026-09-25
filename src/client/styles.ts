import { normalizeConfig, parseFonts, type UIConfig } from '../config'

// 使用官方语义属性和 CSS 变量，不绑定 CSS Modules 的编译后类名。
const conversation = '[data-slot="main.conversation"], [data-conversation-content], [data-conversation-scroll]'
export const sidebarFrame = ':has(> [data-rightbar-col]):has(> div > [data-slot="sidebar"])'

export function appearanceStyles(input: UIConfig): string {
  const config = normalizeConfig(input)
  const fonts = parseFonts(config.font)
  const rules: string[] = []
  if (config.fontWeight) {
    rules.push(`body, body * { font-weight: ${config.fontWeight} !important; }`)
  }
  if (config.sidebarWidth) {
    rules.push(`
      ${sidebarFrame}:not([data-sidebar-collapsed]) {
        grid-template-columns: min(${config.sidebarWidth}, 100%) minmax(0, 1fr) var(--dsh-ui-rightbar-width, 0px) !important;
        --dsh-windows-sidebar-width: min(${config.sidebarWidth}, 100vw) !important;
      }
      ${sidebarFrame}:not([data-sidebar-collapsed]) > div > [data-slot="sidebar"] > div { width: 100% !important; }
      ${sidebarFrame}:not([data-sidebar-collapsed]) > [data-side="sidebar"] { display: none !important; }
    `)
  }
  if (fonts.length) {
    // 第一段为英文字体，第二段为中文字体；只有一段时中英文共用。
    const english = JSON.stringify(fonts[0])
    const chinese = JSON.stringify(fonts[1] ?? fonts[0])
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
  if (variables.length) rules.push(`${conversation} { ${variables.join('\n')} }`)
  return rules.join('\n')
}

export const settingsStyles = `
  .dsh-ui-settings { display: flex; flex-direction: column; width: 100%; color: var(--dsw-alias-label-primary); }
  .dsh-ui-settings-hint { margin: 0; padding: 0 0 8px; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
  .dsh-ui-settings-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 16px 0; border-bottom: .5px solid var(--dsw-alias-border-l2); font-size: 14px; font-weight: 400; line-height: 22px; }
  .dsh-ui-settings-row:last-child { border-bottom: none; }
  .dsh-ui-settings-row > label { flex: 1; white-space: nowrap; }
  .dsh-ui-settings input, .dsh-ui-settings-select { box-sizing: border-box; min-width: 0; width: 60%; max-width: 300px; height: 36px; padding: 0 14px; border: none; border-radius: 18px; background: var(--dsw-alias-bg-module-platform); color: var(--dsw-alias-label-primary); font: inherit; }
  .dsh-ui-settings input { text-align: right; }
  .dsh-ui-settings input::placeholder { color: var(--dsw-alias-label-tertiary); opacity: 1; }
  .dsh-ui-settings-select { display: inline-flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; }
  .dsh-ui-settings-select svg { flex: none; }
  /* Menu 的根是 inline-flex 的 shrink-to-fit 包裹层，若把 60% 放在内部按钮上，
     百分比会参照这层「由内容决定」的宽度而退化为 auto，按钮因此明显偏小。
     改由包裹层承担宽度，按钮填满其中。 */
  .dsh-ui-settings-menu { width: 60%; max-width: 300px; }
  .dsh-ui-settings-menu .dsh-ui-settings-select { width: 100%; }
  .dsh-ui-settings :is(input, button):hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
  .dsh-ui-settings :is(input, button):focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary, #3964fe); outline-offset: 2px; }
  .dsh-ui-settings :is(input, button)[aria-invalid=true] { outline: 1px solid var(--dsw-alias-state-error-primary, #c33); }
  .dsh-ui-settings-error { flex-basis: 100%; color: var(--dsw-alias-state-error-primary, #c33); font-size: 12px; line-height: 18px; text-align: right; }
  .dsh-ui-settings :disabled { opacity: .55; cursor: default; }
`
