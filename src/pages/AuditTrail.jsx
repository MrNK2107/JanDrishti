/**
 * Audit trail — every recorded action, newest first.
 *
 * Read-only by design: entries are appended by the backend and never edited. The
 * page says so, because a reader who cannot tell whether a log is editable has
 * no reason to trust it.
 */

import { useStore } from '../store/StoreProvider'
import { selectAuditLog } from '../domain/selectors'
import { EmptyState, Panel, Skeleton, StatusDot } from '../components/ui'

const ROLE_TONE = {
  system: 'info',
  contractor: 'neutral',
  inspector: 'verified',
  officer: 'flagged',
  admin: 'flagged',
}

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export default function AuditTrail() {
  const { data, loading } = useStore()
  const entries = selectAuditLog(data)

  if (loading && entries.length === 0) {
    return (
      <div className="max-w-3xl space-y-2">
        <Skeleton className="h-16" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return <EmptyState title="No recorded activity yet" />
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-ink">Audit trail</h1>
        <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">
          Every action recorded against the ward, newest first. Entries are appended by
          the system and cannot be edited or removed — including by an administrator.
        </p>
      </div>

      <Panel subtitle={`${entries.length} entries`}>
        <ol>
          {entries.map((e) => (
            <li key={e.id} className="flex gap-4 py-3 border-b border-hairline last:border-0">
              <div className="w-24 shrink-0">
                <div className="text-xs font-mono text-ink-muted">{fmtDate(e.at)}</div>
                <div className="text-2xs font-mono text-ink-subtle">{fmtTime(e.at)}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusDot tone={ROLE_TONE[e.role] ?? 'neutral'} size="sm" />
                  <span className="text-sm font-medium text-ink capitalize">
                    {e.action.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-xs text-ink-subtle">{e.subject}</span>
                </div>
                <p className="text-sm text-ink-2 mt-1 leading-relaxed">{e.note}</p>
                <div className="text-xs text-ink-muted mt-0.5">
                  {e.actor} · {e.role}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}
