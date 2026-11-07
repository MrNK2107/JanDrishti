/**
 * Discrepancy queue — where an officer decides.
 *
 * A decision here is irreversible and published, so the interface does three
 * things the previous version did not: it states plainly that both outcomes are
 * legitimate, it requires a written reason before either button enables, and it
 * confirms through a modal rather than acting on a single click.
 */

import { useEffect, useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { useToast, ConfirmDialog } from '../components/feedback'
import { PROJECT_STATUS_META, DISCREPANCY_KIND_META, DISCREPANCY_STATUS_META } from '../domain/reconcile'
import { EvidenceChain } from '../components/EvidenceChain'
import {
  Button,
  EmptyState,
  Panel,
  Skeleton,
  Spinner,
  StatusBadge,
  StatusDot,
  Textarea,
} from '../components/ui'

const SEVERITY_TONE = { high: 'flagged', medium: 'pending', low: 'neutral' }

export default function Discrepancies() {
  const { data, projectViews, actions, pending, loading } = useStore()
  const toast = useToast()

  const records = data.discrepancies
    .map((d) => {
      const project = projectViews.find((p) => p.id === d.projectId)
      const milestone = project?.milestones.find((m) => m.id === d.milestoneId)
      return {
        ...d,
        project,
        milestone,
        isLive: d.status === 'open' || d.status === 'under_review',
      }
    })
    .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))

  const live = records.filter((d) => d.isLive)
  const closed = records.filter((d) => !d.isLive)

  const [activeId, setActiveId] = useState(null)
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState(null)

  // Select the first live finding once data arrives, and keep the selection
  // valid if it is decided while the page is open.
  useEffect(() => {
    if (activeId && records.some((r) => r.id === activeId)) return
    setActiveId(live[0]?.id ?? records[0]?.id ?? null)
    setReason('')
  }, [records, live, activeId])

  const active = records.find((d) => d.id === activeId)
  const busy = Boolean(pending.decide)

  if (loading && records.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5">
        <Skeleton className="h-72" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <EmptyState title="No discrepancies on record">
        Every reported claim in this ward has either been independently confirmed or is
        still awaiting inspection. Nothing requires a decision.
      </EmptyState>
    )
  }

  /**
   * Record the officer's decision.
   *
   * The finding being decided is always the active one, so its id is read from
   * `active` rather than carried in the confirm state — an earlier version stored
   * only `{ kind }` in that state and read `confirm.id`, which was undefined, so
   * the request went out with no id at all and the backend correctly rejected it
   * with "Discrepancy not found".
   */
  const decide = async (decision) => {
    if (!active) return
    const res = await actions.decideDiscrepancy({
      discrepancyId: active.id,
      decision,
      reason: reason.trim(),
    })
    setConfirm(null)
    if (res.ok) {
      toast.success(
        decision === 'resolved' ? 'Finding upheld' : 'Finding dismissed',
        'The decision and its reason are now in the public record.'
      )
      setReason('')
    } else {
      toast.error('Could not record the decision', res.error?.message)
    }
  }

  const acknowledge = async (id) => {
    const res = await actions.acknowledgeDiscrepancy({ discrepancyId: id })
    if (res.ok) toast.info('Marked under review', 'The finding stays open until decided.')
    else toast.error('Could not update the finding', res.error?.message)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
        <div className="space-y-4">
          <Panel
            title="Needs a decision"
            subtitle={`${live.length} open`}
            className="[&>div]:p-0"
          >
            {live.length === 0 ? (
              <p className="text-sm text-ink-muted px-5 py-4">Nothing open.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {live.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(d.id)
                        setReason('')
                      }}
                      aria-current={active?.id === d.id}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        active?.id === d.id ? 'bg-sunken' : 'hover:bg-canvas'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <StatusDot
                          tone={d.severity === 'high' ? 'flagged' : 'pending'}
                        />
                        <span className="font-mono text-xs text-ink-muted">{d.id}</span>
                        <span className="ml-auto text-2xs text-ink-muted capitalize">
                          {d.severity}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-ink mt-1">
                        {DISCREPANCY_KIND_META[d.kind]?.label ?? d.kind}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        {d.project?.name}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {closed.length > 0 && (
            <Panel title="Decided" subtitle={`${closed.length} closed`} className="[&>div]:p-0">
              <ul className="divide-y divide-hairline">
                {closed.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(d.id)
                        setReason('')
                      }}
                      aria-current={active?.id === d.id}
                      className={`w-full text-left px-4 py-2.5 ${
                        active?.id === d.id ? 'bg-sunken' : 'hover:bg-canvas'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-ink-muted">{d.id}</span>
                        <span className="ml-auto">
                          <StatusBadge
                            tone={d.status === 'resolved' ? 'flagged' : 'verified'}
                            label={DISCREPANCY_STATUS_META[d.status]?.label ?? d.status}
                            size="sm"
                          />
                        </span>
                      </div>
                      <div className="text-xs text-ink-muted mt-1">{d.project?.name}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {active && (
          <Panel
            title={DISCREPANCY_KIND_META[active.kind]?.label ?? active.kind}
            subtitle={`${active.id} · ${active.project?.name}`}
            actions={
              <>
                <StatusBadge
                  tone={SEVERITY_TONE[active.severity]}
                  label={`${active.severity} severity`}
                />
                <StatusBadge
                  tone={
                    active.status === 'resolved'
                      ? 'flagged'
                      : active.status === 'dismissed'
                        ? 'verified'
                        : 'pending'
                  }
                  label={DISCREPANCY_STATUS_META[active.status]?.label ?? active.status}
                />
              </>
            }
          >
            <div className="space-y-5">
              {active.milestone && (
                <EvidenceChain milestone={active.milestone} project={active.project} />
              )}

              {active.isLive ? (
                <div className="pt-5 border-t border-hairline">
                  <h3 className="text-base font-semibold text-ink mb-1">Your decision</h3>
                  <p className="text-sm text-ink-muted mb-4 leading-relaxed">
                    The system has surfaced a difference between the reported figure and the
                    measured one. It does not decide which is right — that is your judgement,
                    and your reason becomes part of the permanent public record. Both
                    outcomes are legitimate: sometimes the work is genuinely short, and
                    sometimes the measurement was wrong.
                  </p>

                  <Textarea
                    id="resolution"
                    label="Reason for your decision (published)"
                    placeholder="e.g. Contractor directed to surface the remaining 180 m within 30 days; re-inspection scheduled."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    hint={
                      reason.trim().length > 0 && reason.trim().length < 10
                        ? 'Add a little more detail — at least a sentence.'
                        : 'This text appears in the public record. A decision cannot be recorded without one.'
                    }
                  />

                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button
                      variant="danger"
                      disabled={reason.trim().length < 10 || busy}
                      onClick={() => setConfirm({ kind: 'resolved' })}
                    >
                      Uphold the finding — work is short
                    </Button>
                    <Button
                      variant="success"
                      disabled={reason.trim().length < 10 || busy}
                      onClick={() => setConfirm({ kind: 'dismissed' })}
                    >
                      Dismiss — the measurement was wrong
                    </Button>
                    {active.status === 'open' && (
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => acknowledge(active.id)}
                      >
                        Mark under review
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="pt-5 border-t border-hairline">
                  <h3 className="text-2xs uppercase tracking-wide text-ink-muted mb-2">
                    Decision recorded
                  </h3>
                  <p className="text-sm text-ink-2 leading-relaxed bg-canvas border border-hairline rounded px-4 py-3">
                    {active.resolution || 'No reason recorded.'}
                  </p>
                  <p className="text-xs text-ink-muted mt-2">
                    {active.resolvedBy}
                    {active.resolvedAt &&
                      ` · ${new Date(active.resolvedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}`}
                  </p>
                </div>
              )}
            </div>
          </Panel>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        busy={busy}
        tone={confirm?.kind === 'resolved' ? 'danger' : 'success'}
        title={
          confirm?.kind === 'resolved'
            ? 'Uphold this finding?'
            : 'Dismiss this finding?'
        }
        description={
          confirm?.kind === 'resolved'
            ? 'The project stays flagged until corrective work is recorded and re-inspected.'
            : 'The contractor’s reported figure stands as verified for this milestone.'
        }
        confirmLabel={confirm?.kind === 'resolved' ? 'Uphold finding' : 'Dismiss finding'}
        onClose={() => setConfirm(null)}
        onConfirm={() => decide(confirm.kind)}
      />
    </>
  )
}
