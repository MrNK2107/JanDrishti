/**
 * Citizen Record — the public view.
 *
 * Read-only by construction: this page dispatches no actions and renders no
 * form, so there is no code path through which a member of the public can alter
 * a record. That is a structural property, not a permission flag.
 *
 * Written for someone with no prior knowledge of the system. Every project
 * states, in one sentence and then in figures, what was promised, what was
 * claimed, what was found, and what was decided. Jargon is kept to a minimum
 * and the one term that cannot be avoided — "sanctioned" — is explained where
 * it first appears.
 */

import { useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { selectProjectViews, selectSummary, selectAuditLog } from '../domain/selectors'
import {
  PROJECT_STATUS_META,
  DISCREPANCY_KIND_META,
  formatQuantity,
  formatRupees,
} from '../domain/reconcile'
import { StatusBadge, StatusDot, Callout, Panel } from '../components/ui'
import { EvidenceChain } from '../components/EvidenceChain'

const toneOf = (status) =>
  status === 'flagged'
    ? 'flagged'
    : status === 'verified' || status === 'resolved'
      ? 'verified'
      : 'pending'

/** A compact read-only version of the delivery bar: what was paid for vs what exists. */
function PublicBar({ delivery }) {
  const unit = delivery.unit === 'metre' ? 'm' : delivery.unit
  const observedPct = Math.max(0, Math.min(100, delivery.observedPercent))
  const gapPct =
    delivery.reportedPercent == null || delivery.observedPercent == null
      ? 0
      : Math.max(0, Math.min(100, delivery.reportedPercent) - observedPct)

  return (
    <div>
      <div className="relative h-5 rounded bg-sunken overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${delivery.observed != null ? 'bg-status-verified' : 'bg-ink-subtle/40'}`}
          style={{ width: `${delivery.observed != null ? observedPct : 0}%` }}
        />
        {gapPct > 0 && (
          <div
            className="absolute inset-y-0 border-y-2 border-r-2 border-status-flagged"
            style={{
              left: `${observedPct}%`,
              width: `${gapPct}%`,
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(202,50,62,0.20) 0 3px, transparent 3px 7px)',
            }}
          />
        )}
      </div>
      <div className="flex justify-between text-2xs text-ink-muted mt-1 font-mono">
        <span>nothing delivered</span>
        <span>all {formatQuantity(delivery.sanctioned, unit)} sanctioned</span>
      </div>
    </div>
  )
}

export default function CitizenPortal() {
  const { state, projectViews } = useStore()
  const summary = selectSummary(state, projectViews)
  const audit = selectAuditLog(state)

  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)

  const shown = projectViews.filter((p) =>
    filter === 'flagged'
      ? p.status === 'flagged'
      : filter === 'clean'
        ? p.status === 'verified' || p.status === 'resolved'
        : true
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-ink">What your ward paid for</h1>
        <p className="text-sm text-ink-2 mt-2 leading-relaxed">
          For every public works project in Ward 12, this page publishes three figures:{' '}
          <strong className="font-semibold">what was sanctioned</strong> (approved and
          budgeted), <strong className="font-semibold">what the contractor reported</strong>, and{' '}
          <strong className="font-semibold">what an independent inspector actually found on
          site</strong>. Where the claim and the finding disagree, the discrepancy and its
          resolution are published too.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Projects published', summary.projects, 'text-ink'],
          ['Total sanctioned', formatRupees(summary.totalBudget), 'text-ink'],
          [
            'Open discrepancies',
            summary.openDiscrepancies,
            summary.openDiscrepancies > 0 ? 'text-status-text-flagged' : 'text-ink',
          ],
          ['Discrepancies resolved', summary.resolvedDiscrepancies, 'text-status-text-verified'],
        ].map(([label, value, cls]) => (
          <div key={label} className="bg-paper border border-hairline rounded-lg px-4 py-3.5">
            <div className="text-xs text-ink-muted">{label}</div>
            <div className={`text-2xl font-semibold mt-1 tabular-nums ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          ['all', `All projects (${projectViews.length})`],
          ['flagged', `With open discrepancies (${projectViews.filter((p) => p.status === 'flagged').length})`],
          [
            'clean',
            `Fully delivered (${projectViews.filter((p) => p.status === 'verified' || p.status === 'resolved').length})`,
          ],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            aria-current={filter === id}
            className={`px-3.5 py-2 rounded border text-sm transition-colors ${
              filter === id
                ? 'border-ink bg-paper text-ink font-medium'
                : 'border-hairline bg-paper text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.map((p) => {
          const expanded = openId === p.id
          const tone = toneOf(p.status)
          const unit = p.delivery.unit === 'metre' ? 'm' : p.delivery.unit

          return (
            <section key={p.id} className="bg-paper border border-hairline rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(expanded ? null : p.id)}
                aria-expanded={expanded}
                className="w-full text-left px-5 py-4 hover:bg-canvas/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <StatusDot tone={tone} pulse={p.status === 'flagged'} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-ink">{p.name}</h2>
                    <p className="font-mono text-xs text-ink-muted mt-0.5">
                      {p.id} · {p.location}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge
                      tone={tone}
                      label={PROJECT_STATUS_META[p.status]?.label ?? p.status}
                      meaning={p.plainSummary}
                      size="sm"
                    />
                    <div className="font-mono text-xs text-ink-muted mt-1.5">
                      {formatRupees(p.budget)}
                    </div>
                  </div>
                </div>

                {/* The one-sentence answer */}
                <p className="text-sm text-ink-2 mt-3 leading-relaxed">{p.plainSummary}</p>

                <div className="mt-3">
                  <PublicBar delivery={p.delivery} />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                  <div>
                    <div className="text-ink-muted">Sanctioned</div>
                    <div className="font-mono text-ink">
                      {formatQuantity(p.delivery.sanctioned, unit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-ink-muted">Contractor reported</div>
                    <div className="font-mono text-ink">
                      {p.delivery.reported == null
                        ? '—'
                        : formatQuantity(p.delivery.reported, unit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-ink-muted">Inspector found</div>
                    <div className="font-mono text-ink">
                      {p.delivery.observed == null
                        ? 'not yet inspected'
                        : formatQuantity(p.delivery.observed, unit)}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-ink-muted mt-3">
                  {expanded ? '▲ Hide the full record' : '▼ Show the full record'}
                </div>
              </button>

              {expanded && (
                <div className="px-5 pb-5 pt-1 border-t border-hairline animate-fade-in">
                  {p.milestones[0] && (
                    <EvidenceChain milestone={p.milestones[0]} project={p} />
                  )}

                  {p.discrepancies.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-2xs uppercase tracking-wide text-ink-muted mb-2">
                        Discrepancy record
                      </h3>
                      <ul className="space-y-2">
                        {p.discrepancies.map((d) => (
                          <li key={d.id} className="border border-hairline rounded-lg px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-ink-muted">{d.id}</span>
                              <span className="text-sm font-medium text-ink">
                                {DISCREPANCY_KIND_META[d.kind]?.label ?? d.kind}
                              </span>
                              <span className="ml-auto">
                                <StatusBadge
                                  tone={d.status === 'resolved' ? 'verified' : 'flagged'}
                                  label={d.status}
                                  size="sm"
                                />
                              </span>
                            </div>
                            <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">{d.detail}</p>
                            {d.resolution ? (
                              <p className="text-sm text-ink-2 mt-2 pt-2 border-t border-hairline leading-relaxed">
                                <span className="text-ink-muted">Decision: </span>
                                {d.resolution}
                                <span className="text-ink-muted"> — {d.resolvedBy}</span>
                              </p>
                            ) : (
                              <p className="text-sm text-status-text-flagged mt-2">
                                No decision recorded yet.
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-5">
                    <h3 className="text-2xs uppercase tracking-wide text-ink-muted mb-2">
                      Everything recorded, in order
                    </h3>
                    <ol className="space-y-1.5">
                      {audit
                        .filter(
                          (e) =>
                            e.subject.includes(p.id) ||
                            p.discrepancies.some((d) => e.subject === d.id)
                        )
                        .map((e) => (
                          <li key={e.id} className="flex gap-3 text-sm">
                            <span className="font-mono text-xs text-ink-muted w-20 shrink-0">
                              {new Date(e.at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                            <span className="text-ink-2">{e.note}</span>
                          </li>
                        ))}
                    </ol>
                  </div>
                </div>
              )}
            </section>
          )
        })}
      </div>

      <Callout tone="info" title="This page cannot change anything">
        It has no buttons that create, edit, or remove a record — no such capability exists on
        this page. Corrections are made by the responsible officer in the Ward Officer portal and
        appear above automatically.
      </Callout>
    </div>
  )
}
