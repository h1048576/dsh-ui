import type { Context } from '@deepseek-ai/cordis'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react'
import { defaults, fields, NAMESPACE, normalizeConfig, type UIConfig } from '../config'
import { appearanceStyles, settingsStyles } from './styles'

function SettingsPanel({ scope }: { scope: SettingsScope<UIConfig> }) {
  const snapshot = useSyncExternalStore(scope.subscribe.bind(scope), scope.getSnapshot.bind(scope))
  const [draft, setDraft] = useState<UIConfig>(snapshot.value ?? defaults)
  const [revision, setRevision] = useState(snapshot.revision)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!dirty) {
      setDraft(snapshot.value ?? defaults)
      setRevision(snapshot.revision)
    }
  }, [snapshot, dirty])
  const ready = snapshot.value !== undefined && (snapshot.mode === 'memory' || snapshot.writable)

  async function save(event: FormEvent) {
    event.preventDefault()
    setError(''); setMessage('')
    try {
      const value = normalizeConfig(draft)
      setBusy(true)
      await scope.mutate(fields.map(({ key }) => ({ op: 'set' as const, path: [key], value: value[key] })), revision)
      setDirty(false)
      setMessage(snapshot.mode === 'host' ? '已保存并应用。' : '已应用到当前浏览器会话。')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally { setBusy(false) }
  }

  async function reset() {
    setBusy(true); setError(''); setMessage('')
    try {
      await scope.mutate(fields.map(({ key }) => ({ op: 'unset' as const, path: [key] })), snapshot.revision)
      setDirty(false)
      setMessage('已恢复插件初始配置。')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally { setBusy(false) }
  }

  return <form className="dsh-ui-settings" onSubmit={save}>
    <h2>字体与聊天布局</h2>
    <p>留空使用 Harness 默认样式，保存后立即生效。</p>
    {snapshot.mode === 'memory' && <p>当前为远程连接，设置仅在本次浏览器会话中有效。</p>}
    {snapshot.status === 'loading' && <p role="status">正在加载设置…</p>}
    {!ready && snapshot.status !== 'loading' && <p role="status">设置暂不可用，请确认已启用插件的宿主入口及设置服务。</p>}
    <fieldset disabled={busy || !ready}>
      {fields.map(field => <label key={field.key}>
        {field.label}
        <input value={draft[field.key]} placeholder={field.placeholder} aria-describedby={`dsh-ui-${field.key}-help`}
          onChange={event => { setDraft({ ...draft, [field.key]: event.target.value }); setDirty(true); setMessage(''); setError('') }} />
        <small id={`dsh-ui-${field.key}-help`}>{field.help}</small>
      </label>)}
    </fieldset>
    {error && <p role="alert">{error}</p>}
    <p role="status" aria-live="polite">{message}</p>
    <footer>
      <button type="submit" disabled={busy || !ready || !dirty}>{busy ? '正在保存…' : '保存设置'}</button>
      <button type="button" disabled={busy || !ready} onClick={() => { void reset() }}>恢复初始配置</button>
      {dirty && <button type="button" disabled={busy} onClick={() => { setDirty(false); setError(''); setMessage('') }}>放弃修改</button>}
    </footer>
  </form>
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
