import type { Context } from '@deepseek-ai/cordis'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { IconChevronDownOutlineRegular, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import { useId, useState, useSyncExternalStore } from 'react'
import { defaults, fields, NAMESPACE, normalizeConfig, type UIConfig } from '../config'
import { appearanceStyles, settingsStyles, sidebarFrame } from './styles'

// 宿主以内联网格列宽控制右侧面板，保留其列宽以兼容展开、收起和拖动。
function observeSidebarLayout(): () => void {
  const frames = new Set<HTMLElement>()
  function sync(frame: HTMLElement) {
    const rightbarWidth = frame.style.gridTemplateColumns.match(/(\d+(?:\.\d+)?px)\)?\s*$/)?.[1]
    if (!rightbarWidth) return
    frames.add(frame)
    if (frame.style.getPropertyValue('--dsh-ui-rightbar-width') !== rightbarWidth) {
      frame.style.setProperty('--dsh-ui-rightbar-width', rightbarWidth)
    }
  }
  function discover() {
    for (const frame of frames) {
      if (!frame.isConnected) frames.delete(frame)
    }
    document.querySelectorAll<HTMLElement>(sidebarFrame).forEach(sync)
  }
  const observer = new MutationObserver(records => {
    if (records.some(record => record.type === 'childList')) discover()
    else for (const record of records) {
      if (record.target instanceof HTMLElement && record.target.matches(sidebarFrame)) sync(record.target)
    }
  })
  discover()
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
  return () => {
    observer.disconnect()
    for (const frame of frames) frame.style.removeProperty('--dsh-ui-rightbar-width')
  }
}

type SaveSetting = (key: keyof UIConfig, value: string) => Promise<void>


function SettingsField({ field, value, saveSetting, disabled }: {
  field: typeof fields[number]
  value: string
  saveSetting: SaveSetting
  disabled: boolean
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const id = useId()

  async function save(next = draft) {
    if (next === null || disabled || busy) return
    try {
      const normalized = normalizeConfig({ ...defaults, [field.key]: next })[field.key]
      if (normalized !== value) {
        setBusy(true)
        await saveSetting(field.key, normalized)
      }
      setDraft(null)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  return <div className="dsh-ui-settings-row">
    <label id={`${id}-label`} htmlFor={id}>{field.label}</label>
    {'options' in field ? <Menu open={open} onClose={() => setOpen(false)} align="end" portal
      className="dsh-ui-settings-menu"
      items={field.options.map(option => ({ id: option.value || 'default', label: option.label }))}
      selectedId={(draft ?? value) || 'default'}
      onSelect={selected => {
        const next = selected === 'default' ? '' : selected
        setOpen(false)
        setDraft(next)
        setError('')
        void save(next)
      }} anchor={<button id={id} type="button" className="dsh-ui-settings-select"
        disabled={disabled || busy} aria-haspopup="menu" aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`} aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => setOpen(current => !current)}>
        <span id={`${id}-value`}>{field.options.find(option => option.value === (draft ?? value))?.label ?? '默认'}</span>
        <IconChevronDownOutlineRegular size={14} />
      </button>} /> : <input id={id} value={draft ?? value} placeholder={field.placeholder} disabled={disabled || busy}
      aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
      onChange={event => { setDraft(event.target.value); setError('') }}
      onBlur={() => { void save() }}
      onKeyDown={event => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault()
          event.currentTarget.blur()
        }
      }} />}
    {error && <span id={`${id}-error`} className="dsh-ui-settings-error" role="alert">{error}</span>}
  </div>
}

function SettingsPanel({ form, saveSetting }: { form: ConfigForm<UIConfig>; saveSetting: SaveSetting }) {
  const snapshot = useSyncExternalStore(form.subscribe.bind(form), form.getSnapshot.bind(form))
  const ready = snapshot.status === 'ready' && snapshot.writable

  return <div className="dsh-ui-settings" aria-busy={snapshot.status === 'loading'}>
    <p className="dsh-ui-settings-hint">灰色文字是填写示例；留空使用 DSH 默认值。输入后按 Enter 或移开焦点保存。</p>
    {fields.map(field => <SettingsField key={field.key} field={field}
      value={snapshot.value?.[field.key] ?? defaults[field.key]} saveSetting={saveSetting} disabled={!ready} />)}
  </div>
}

export const inject = ['slots', 'configForms']

export function apply(ctx: Context): void {
  const form = ctx.configForms.get<UIConfig>(NAMESPACE)
  const saveSetting: SaveSetting = async (key, value) => {
    if (!await form.set(key, value) || form.getSnapshot().value?.[key] !== value) {
      throw new Error('设置未生效，请确认宿主已加载最新版本的 DSH UI 插件。')
    }
  }
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.plugin = NAMESPACE
    document.head.appendChild(style)
    let stopSidebarLayout: (() => void) | undefined
    const update = () => {
      const config = form.getSnapshot().value ?? defaults
      if (config.sidebarWidth) stopSidebarLayout ??= observeSidebarLayout()
      else { stopSidebarLayout?.(); stopSidebarLayout = undefined }
      style.textContent = settingsStyles + appearanceStyles(config)
    }
    update()
    const unsubscribe = form.subscribe(update)
    return () => { unsubscribe(); stopSidebarLayout?.(); style.remove() }
  }, 'dsh-ui: 字体与布局样式')
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: NAMESPACE, order: 50, label: 'DSH UI',
    inject: () => ({ form, saveSetting }),
  }, SettingsPanel))
}
