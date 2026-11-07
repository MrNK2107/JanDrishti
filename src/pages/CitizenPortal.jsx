/**
 * Citizen Portal — the public record.
 *
 * Read-only by construction: this portal dispatches no actions, so there is no
 * code path through which a member of the public can alter a record. That is
 * not a permission flag that could be misconfigured; it is the absence of the
 * capability.
 *
 * The page shows the three numbers side by side for every project, because the
 * whole argument of the product is that a citizen should be able to see the gap
 * between what was promised, what was claimed, and what was found — without
 * having to request it, and without needing to trust a summary.
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
import { Field, Panel, ShareBar, StatusBadge, StatusDot } from '../components/ui'

const TONE = (status) =>
  status === 'flagged'
    ? 'flagged'
    : status === 'verified' || status === 'resolved'
      ? 'verified'
      : 'pending'

export default function CitizenPortal() {
  const { state, projectViews } = useStore()
  const summary = selectSummary(state, projectViews)
  const audit = selectAuditLog(state)

  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(() => projectViews[0]?.id)

  const shown = projectViews.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'flagged') return p.status === 'flagged'
    if (filter === 'clean') return p.status === 'verified' || p.status === 'resolved'
    return true
  })

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Plain-language summary */}
      <Panel
        title="What this page shows"
        subtitle="Ward 12, Greater Chennai · every sanctioned public works project"
      >
        <p className="text-sm leading-relaxed text-porcelain-100">
          For each project, three independent numbers are published:{' '}
          <span className="text-porcelain-100 font-medium">what was sanctioned</span>,{' '}
          <span className="text-porcelain-100 font-medium">what the contractor reported</span>,
          and{' '}
          <span className="text-porcelain-100 font-medium">
            what an independent inspector found on site
          </span>
          . Where the reported figure and the observed figure disagree beyond a published
          tolerance, a discrepancy is opened and its resolution is recorded here.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <Field label="Projects published" mono>
            {summary.projects}
          </Field>
          <Field label="Total sanctioned" mono>
            {formatRupees(summary.totalBudget)}
          </Field>
          <Field label="Open discrepancies" mono>
            <span className={summary.openDiscrepancies > 0 ? 'text-status-text-flagged' : ''}>
              {summary.openDiscrepancies}
            </span>
          </Field>
          <Field label="Resolved to date" mono>
            <span className="text-status-text-verified">{summary.resolvedDiscrepancies}</span>
          </Field>
        </div>
      </Panel>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {[
          ['all', `All projects (${projectViews.length})`],
          ['flagged', `Open discrepancies (${projectViews.filter((p) => p.status === 'flagged').length})`],
          ['clean', `Corroborated (${projectViews.filter((p) => p.status === 'verified' || p.status === 'resolved').length})`],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            aria-current={filter === id}
            className={`px-3.5 py-2 rounded border text-xs transition-colors ${
              filter === id
                ? 'border-status-verified bg-midnight-800 text-porcelain-100'
                : 'border-midnight-700 text-porcelain-200 hover:text-porcelain-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Public register */}
      <div className="space-y-3">
        {shown.map((p) => {
          const milestone = p.milestones[0]
          const expanded = openId === p.id
          const tone = TONE(p.status)

          return (
            <div
              key={p.id}
              className="bg-midnight-800 border border-midnight-700 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenId(expanded ? null : p.id)}
                aria-expanded={expanded}
                className="w-full text-left px-5 py-4 hover:bg-midnight-950/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <StatusDot tone={tone} pulse={p.status === 'flagged'} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-[11px] text-porcelain-200 mt-0.5 font-mono">
                      {p.id} · {p.location}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge
                      tone={tone}
                      label={PROJECT_STATUS_META[p.status]?.label ?? p.status}
                      size="sm"
                    />
                    <div className="text-[11px] text-porcelain-200 mt-1.5 font-mono">
                      {formatRupees(p.budget)}
                    </div>
                  </div>
                </div>
              </button>

              {expanded && milestone && (
                <div className="px-5 pb-5 pt-1 border-t border-midnight-700 animate-rise">
                  {/* The three numbers, published side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                    <div className="rounded border border-midnight-700 bg-midnight-950 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-wider text-porcelain-200">
                        1 · Sanctioned
                      </div>
                      <div className="text-lg font-mono mt-1">
                        {formatQuantity(milestone.commitment.quantity, milestone.commitment.unit)}
                      </div>
                      <div className="text-[10px] text-porcelain-200 mt-1">
                        Approved {p.sanctionedOn}
                      </div>
                    </div>
                    <div className="rounded border border-midnight-700 bg-midnight-950 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-wider text-porcelain-200">
                        2 · Contractor reported
                      </div>
                      <div className="text-lg font-mono mt-1">
                        {milestone.report
                          ? formatQuantity(
                              milestone.report.claimedQuantity,
                              milestone.commitment.unit
                            )
                          : '—'}
                      </div>
                      <div className="text-[10px] text-porcelain-200 mt-1">
                        {milestone.report ? milestone.report.reportedBy : 'No claim filed'}
                      </div>
                    </div>
                    <div
                      className={`rounded border px-4 py-3 ${
                        milestone.deviations.length > 0
                          ? 'border-status-flagged/40 bg-status-tint-flagged'
                          : 'border-midnight-700 bg-midnight-950'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider text-porcelain-200">
                        3 · Independently observed
                      </div>
                      <div className="text-lg font-mono mt-1">
                        {milestone.inspection
                          ? formatQuantity(
                              milestone.inspection.observedQuantity,
                              milestone.commitment.unit
                            )
                          : '—'}
                      </div>
                      <div className="text-[10px] text-porcelain-200 mt-1">
                        {milestone.inspection
                          ? milestone.inspection.inspectedBy
                          : 'Not yet inspected'}
                      </div>
                    </div>
                  </div>

                  <ShareBar
                    label={`Delivered against sanction (per ${milestone.completion.basis === 'observed' ? 'independent observation' : milestone.completion.basis === 'reported' ? 'contractor claim only' : 'no evidence'})`}
                    percent={milestone.completion.percent}
                    tone={milestone.completion.percent >= 99 ? 'verified' : 'flagged'}
                  />

                  {milestone.inspection?.note && (
                    <p className="text-xs text-porcelain-200 mt-4 leading-relaxed">
                      <span className="uppercase tracking-wider text-[10px]">
                        Inspector&rsquo;s note ·{' '}
                      </span>
                      {milestone.inspection.note}
                    </p>
                  )}

                  {/* Findings and their disposition, in public */}
                  {p.discrepancies.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-midnight-700">
                      <h3 className="text-[10px] uppercase tracking-wider text-porcelain-200 mb-3">
                        Discrepancy record
                      </h3>
                      <ul className="space-y-2">
                        {p.discrepancies.map((d) => (
                          <li
                            key={d.id}
                            className="bg-midnight-950 border border-midnight-700 rounded px-4 py-3"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <StatusDot
                                tone={d.status === 'resolved' ? 'verified' : d.status === 'dismissed' ? 'neutral' : 'flagged'}
                                size="sm"
                              />
                              <span className="text-xs font-medium">
                                {DISCREPANCY_KIND_META[d.kind]?.label ?? d.kind}
                              </span>
                              <span className="text-[10px] font-mono text-porcelain-200">
                                {d.id}
                              </span>
                              <span className="ml-auto">
                                <StatusBadge
                                  tone={d.status === 'resolved' ? 'verified' : d.status === 'dismissed' ? 'neutral' : 'flagged'}
                                  label={d.status}
                                  size="sm"
                                />
                              </span>
                            </div>
                            <p className="text-xs text-porcelain-200 mt-2 leading-relaxed">
                              {d.detail}
                            </p>
                            {d.resolution && (
                              <p className="text-xs mt-2 pt-2 border-t border-midnight-700 leading-relaxed">
                                <span className="text-porcelain-200">Disposition: </span>
                                {d.resolution}
                                <span className="text-porcelain-200"> — {d.resolvedBy}</span>
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Every action on this project, in order */}
                  <div className="mt-5 pt-4 border-t border-midnight-700">
                    <h3 className="text-[10px] uppercase tracking-wider text-porcelain-200 mb-3">
                      Recorded actions
                    </h3>
                    <ol className="space-y-2">
                      {audit
                        .filter((e) => e.subject.includes(p.id) || p.discrepancies.some((d) => e.subject === d.id))
                        .map((e) => (
                          <li key={e.id} className="flex gap-3 text-xs">
                            <span className="font-mono text-porcelain-200 shrink-0 w-24">
                              {new Date(e.at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                            <span className="text-porcelain-100">{e.note}</span>
                          </li>
                        ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-porcelain-200 leading-relaxed max-w-3xl">
        This portal is read-only. No record on this page can be created, edited, or removed
        from here — the citizen view has no capability to dispatch a change. Corrections are
        made by the responsible officer in the Ward Admin portal and appear in the audit trail
        above.
      </p>
    </div>
  )
}
