/**
 * Discrepancy review — the working surface of the accountability loop.
 *
 * A finding is only useful if a human can see the arithmetic that produced it
 * and then act on it. So each row carries the full three-way comparison
 * (approved / reported / observed), the rule that fired with its actual
 * variance, and the two available dispositions.
 *
 * The interface deliberately does not decide for the officer. It offers
 * "resolve" and "dismiss" with equal prominence, because the product principle
 * is that software flags and humans decide. Dismissal is a legitimate outcome,
 * and it is recorded with equal weight.
 */

import { useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { selectDiscrepancyViews, selectProjectViews } from '../domain/selectors'
import {
  DISCREPANCY_KIND_META,
  DISCREPANCY_STATUS_META,
  formatQuantity,
  formatRupees,
} from '../domain/reconcile'
import { Button, EmptyState, Field, Panel, StatusBadge, StatusDot, Textarea } from './ui'

const SEVERITY_TONE = { high: 'flagged', medium: 'pending', low: 'neutral' }

function VarianceRow({ label, value, tone, note }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-xs text-porcelain-200">{label}</dt>
      <dd className="text-right">
        <span className={`font-mono text-sm ${tone === 'flagged' ? 'text-status-text-flagged' : tone === 'verified' ? 'text-status-text-verified' : ''}`}>
          {value}
        </span>
        {note && <div className="text-[10px] text-porcelain-200">{note}</div>}
      </dd>
    </div>
  )
}

export function DiscrepancyQueue({ onOpenProject }) {
  const { state, dispatch, projectViews } = useStore()
  const discrepancies = selectDiscrepancyViews(state, projectViews)
  const [activeId, setActiveId] = useState(
    () => discrepancies.find((d) => d.isLive)?.id ?? discrepancies[0]?.id
  )
  const [resolution, setResolution] = useState('')
  const [officer, setOfficer] = useState('Ward Officer')

  const active = discrepancies.find((d) => d.id === activeId) ?? discrepancies[0]
  const live = discrepancies.filter((d) => d.isLive)
  const closed = discrepancies.filter((d) => !d.isLive)

  if (discrepancies.length === 0) {
    return (
      <EmptyState title="No findings on record">
        Every recorded claim in this ward is either awaiting inspection or has been
        independently confirmed. Nothing requires review.
      </EmptyState>
    )
  }

  const act = (type) => {
    if (!active || !resolution.trim()) return
    dispatch({
      type,
      payload: { discrepancyId: active.id, resolvedBy: officer, resolution: resolution.trim() },
    })
    setResolution('')
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-5 items-start">
      {/* Queue */}
      <div className="space-y-4">
        <Panel
          title="Open queue"
          subtitle={`${live.length} requiring review`}
          className="[&>div]:p-0"
        >
          {live.length === 0 ? (
            <p className="text-xs text-porcelain-200 px-5 py-4">
              No open findings. Closed records are listed below.
            </p>
          ) : (
            <ul className="divide-y divide-midnight-700">
              {live.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(d.id)}
                    aria-current={active?.id === d.id}
                    className={`w-full text-left px-5 py-3.5 transition-colors ${
                      active?.id === d.id ? 'bg-midnight-950' : 'hover:bg-midnight-950/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <StatusDot tone={SEVERITY_TONE[d.severity]} pulse />
                      <span className="text-xs font-mono text-porcelain-200">{d.id}</span>
                      <span className="ml-auto">
                        <StatusBadge
                          tone={DISCREPANCY_STATUS_META[d.status].tone}
                          label={DISCREPANCY_STATUS_META[d.status].label}
                          size="sm"
                        />
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {DISCREPANCY_KIND_META[d.kind]?.label ?? d.kind}
                    </div>
                    <div className="text-xs text-porcelain-200 mt-0.5 truncate">
                      {d.project?.name}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {closed.length > 0 && (
          <Panel title="Closed" subtitle={`${closed.length} disposed`} className="[&>div]:p-0">
            <ul className="divide-y divide-midnight-700">
              {closed.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(d.id)}
                    className={`w-full text-left px-5 py-3 ${
                      active?.id === d.id ? 'bg-midnight-950' : 'hover:bg-midnight-950/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-porcelain-200">{d.id}</span>
                      <span className="ml-auto">
                        <StatusBadge
                          tone={DISCREPANCY_STATUS_META[d.status].tone}
                          label={DISCREPANCY_STATUS_META[d.status].label}
                          size="sm"
                        />
                      </span>
                    </div>
                    <div className="text-xs text-porcelain-200 mt-1 truncate">
                      {d.project?.name}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      {/* Detail */}
      {active && (
        <Panel
          title={`${active.id} — ${DISCREPANCY_KIND_META[active.kind]?.label ?? active.kind}`}
          subtitle={active.project?.name}
          actions={
            <>
              <StatusBadge tone={SEVERITY_TONE[active.severity]} label={`${active.severity} severity`} />
              <StatusBadge
                tone={DISCREPANCY_STATUS_META[active.status].tone}
                label={DISCREPANCY_STATUS_META[active.status].label}
              />
            </>
          }
        >
          <div className="space-y-6">
            {/* The three sources of truth */}
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-porcelain-200 mb-3">
                Evidence chain
              </h3>
              <dl className="divide-y divide-midnight-700 border border-midnight-700 rounded">
                <div className="px-4 py-3">
                  <VarianceRow
                    label="Approved commitment"
                    value={formatQuantity(
                      active.milestone?.commitment?.quantity,
                      active.milestone?.commitment?.unit
                    )}
                    note={`Sanctioned ${active.project?.sanctionedOn} · ${formatRupees(active.project?.budget ?? 0)}`}
                  />
                </div>
                <div className="px-4 py-3">
                  <VarianceRow
                    label="Contractor reported"
                    value={
                      active.milestone?.report
                        ? formatQuantity(
                            active.milestone.report.claimedQuantity,
                            active.milestone?.commitment?.unit
                          )
                        : '—'
                    }
                    note={
                      active.milestone?.report
                        ? `${active.milestone.report.reportedBy} · ${active.milestone.report.evidenceLabel}`
                        : 'No claim on record'
                    }
                  />
                </div>
                <div className="px-4 py-3">
                  <VarianceRow
                    label="Independently observed"
                    value={
                      active.milestone?.inspection
                        ? formatQuantity(
                            active.milestone.inspection.observedQuantity,
                            active.milestone?.commitment?.unit
                          )
                        : '—'
                    }
                    tone="flagged"
                    note={
                      active.milestone?.inspection
                        ? `${active.milestone.inspection.inspectedBy} · ${active.milestone.inspection.evidenceLabel}`
                        : 'No observation on record'
                    }
                  />
                </div>
              </dl>
            </div>

            {/* Why it was flagged, with the arithmetic */}
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-porcelain-200 mb-3">
                Reconciliation result
              </h3>
              <p className="text-sm leading-relaxed bg-midnight-950 border-l-3 border-l-status-flagged rounded-r px-4 py-3">
                {active.detail}
              </p>
              {active.milestone?.inspection?.note && (
                <p className="text-xs text-porcelain-200 mt-3 leading-relaxed">
                  <span className="uppercase tracking-wider text-[10px]">
                    Inspector&rsquo;s note ·{' '}
                  </span>
                  {active.milestone.inspection.note}
                </p>
              )}
            </div>

            {/* Disposition */}
            {active.isLive ? (
              <div className="pt-5 border-t border-midnight-700 space-y-4">
                <h3 className="text-[10px] uppercase tracking-wider text-porcelain-200">
                  Record a disposition
                </h3>
                <Field label="Recording officer">
                  <span className="text-sm">{officer}</span>
                </Field>
                <Textarea
                  id="resolution"
                  label="Finding"
                  placeholder="e.g. Contractor directed to complete the remaining 180 m within 30 days; re-inspection scheduled."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    disabled={!resolution.trim()}
                    onClick={() => act('RESOLVE_DISCREPANCY')}
                  >
                    Resolve — deficiency accepted and actioned
                  </Button>
                  <Button
                    variant="danger"
                    disabled={!resolution.trim()}
                    onClick={() => act('DISMISS_DISCREPANCY')}
                  >
                    Dismiss — measurement upheld
                  </Button>
                  {active.status === 'open' && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        dispatch({
                          type: 'ACKNOWLEDGE_DISCREPANCY',
                          payload: { discrepancyId: active.id, actor: officer },
                        })
                      }
                    >
                      Mark under review
                    </Button>
                  )}
                </div>
                {!resolution.trim() && (
                  <p className="text-xs text-porcelain-200">
                    A written finding is required. The disposition is part of the public
                    record and cannot be recorded without it.
                  </p>
                )}
              </div>
            ) : (
              <div className="pt-5 border-t border-midnight-700">
                <h3 className="text-[10px] uppercase tracking-wider text-porcelain-200 mb-2">
                  Disposition
                </h3>
                <p className="text-sm bg-midnight-950 border border-midnight-700 rounded px-4 py-3">
                  {active.resolution || 'No finding recorded.'}
                </p>
                <div className="mt-3 text-xs text-porcelain-200">
                  Recorded by {active.resolvedBy}
                </div>
              </div>
            )}

            {onOpenProject && (
              <button
                type="button"
                onClick={() => onOpenProject(active.projectId)}
                className="text-xs text-porcelain-200 hover:text-porcelain-100 underline decoration-dotted underline-offset-2"
              >
                Open {active.projectId} on the ward map →
              </button>
            )}
          </div>
        </Panel>
      )}
    </div>
  )
}

export default DiscrepancyQueue
