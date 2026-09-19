import type { Context } from '@deepseek-ai/cordis'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { useState, useSyncExternalStore } from 'react'
import { defaults, fields, NAMESPACE, normalizeConfig, type UIConfig } from '../config'
import { appearanceStyles, settingsStyles } from './styles'

function SettingsField({ field, value, scope, disabled }: {
  field: typeof fields[number]
  value: string
  scope: SettingsScope<UIConfig>
  disabled: boolean
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (draft === null || disabled || busy) return
    try {
      const normalized = normalizeConfig({ ...defaults, [field.key]: draft })[field.key]
      if (normalized !== value) {
        setBusy(true)
        await scope.set(field.key, normalized)
      }
      setDraft(null)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  return <label className="dsh-ui-settings-row">
    <span>{field.label}</span>
    <input value={draft ?? value} disabled={disabled || busy}
      aria-invalid={Boolean(error)} title={error || undefined}
      onChange={event => { setDraft(event.target.value); setError('') }}
      onBlur={() => { void save() }}
      onKeyDown={event => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault()
          event.currentTarget.blur()
        }
      }} />
  </label>
}

function SettingsPanel({ scope }: { scope: SettingsScope<UIConfig> }) {
  const snapshot = useSyncExternalStore(scope.subscribe.bind(scope), scope.getSnapshot.bind(scope))
  const ready = snapshot.value !== undefined && (snapshot.mode === 'memory' || snapshot.writable)

  return <div className="dsh-ui-settings" aria-busy={snapshot.status === 'loading'}>
    {fields.map(field => <SettingsField key={field.key} field={field}
      value={(snapshot.value ?? defaults)[field.key]} scope={scope} disabled={!ready} />)}
  </div>
}

export const inject = ['slots', 'settingsScope']

export function apply(ctx: Context): void {
  const scope = ctx.settingsScope.bind<UIConfig>({ namespace: NAMESPACE })
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.plugin = NAMESPACE
    document.head.appendChild(style)
    const update = () => {
      style.textContent = settingsStyles + appearanceStyles(scope.getSnapshot().value ?? defaults)
    }
    update()
    const unsubscribe = scope.subscribe(update)
    return () => { unsubscribe(); style.remove() }
  }, 'dsh-ui: 字体与布局样式')
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: NAMESPACE, order: 50, label: 'DSH UI',
    inject: () => ({ scope }),
  }, SettingsPanel))
}
