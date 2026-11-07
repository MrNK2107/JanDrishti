/**
 * Field Inspector — record an independent physical observation.
 *
 * This is the only portal that can open a discrepancy, so it is built to be
 * used one-handed on a site visit: a work queue, a large numeric entry, and an
 * immediate reconciliation result the inspector sees before leaving the site.
 *
 * The result panel is the important part. An inspector who measures 320 m
 * against a 500 m claim should learn that *at the site*, while they can still
 * re-measure or photograph the shortfall — not days later when a Ward Officer
 * reads a flag. Showing a pass with equal clarity matters too: most inspections
 * are uneventful, and an interface that only ever speaks up on failure trains
 * people to distrust it.
 *
 * Coordinates are captured as a fixed site reading for the demo. No network
 * call is made and no device permission is requested.
 */

import { useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { selectProjectViews } from '../domain/selectors'
import {
  PROJECT_STATUS_META,
  formatQuantity,
  TOLERANCE,
} from '../domain/reconcile'
import { Button, EmptyState, Field, Panel, ShareBar, StatusBadge, StatusDot } from '../components/ui'

const TONE = (status) =>
  status === 'flagged'
    ? 'flagged'
    : status === 'verified' || status === 'resolved'
      ? 'verified'
      : 'pending'

/** Fixed site readings, keyed by project. Stands in for a device fix. */
const SITE_FIX = {
  'JDT-2026-0143': { lat: '13.0406°N', lon: '80.2337°E', accuracy: '4 m' },
  'JDT-2026-0138': { lat: '13.0878°N', lon: '80.2101°E', accuracy: '6 m' },
  'JDT-2026-0152': { lat: '13.0234°N', lon: '80.2234°E', accuracy: '5 m' },
}

export default function InspectorInterface() {
  const { state, dispatch, projectViews } = useStore()

  // Default to the first milestone that actually needs an observation.
  const awaiting = projectViews.flatMap((p) => p.milestones.map((m) => ({ p, m })))
  const firstAwaiting = awaiting.find(({ m }) => m.report && !m.inspection) ?? awaiting[0]

  const [key, setKey] = useState(
    () => `${firstAwaiting?.p.id}/${firstAwaiting?.m.id}`
  )
  const [observed, setObserved] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState(null)

  const [selProjectId, selMilestoneId] = key.split('/')
  const project = projectViews.find((p) => p.id === selProjectId) ?? projectViews[0]
  const milestone = project?.milestones.find((m) => m.id === selMilestoneId) ?? project?.milestones[0]

  const fix = SITE_FIX[project?.id] ?? { lat: '13.0827°N', lon: '80.2708°E', accuracy: '8 m' }

  const submit = (e) => {
    e.preventDefault()
    if (!milestone || observed === '') return

    const value = Number(observed)
    const claimed = milestone.report?.claimedQuantity ?? null

    // Reconcile locally so the inspector gets the verdict immediately.
    // The reducer performs the same authoritative calculation and owns the record.
    let verdict = 'recorded'
    let variance = null
    if (claimed != null) {
      variance = (value - claimed) / claimed
      if (Math.abs(variance) > TOLERANCE.observedVsReported) {
        verdict = variance < 0 ? 'shortfall' : 'overrun'
      } else {
        verdict = 'matches'
      }
    }

    dispatch({
      type: 'RECORD_INSPECTION',
      payload: {
        projectId: project.id,
        milestoneId: milestone.id,
        observedQuantity: value,
        inspectedBy: 'Insp. R. Karthikeyan',
        note,
      },
    })

    setResult({ verdict, variance, value, claimed, unit: milestone.commitment.unit, projectId: project.id })
    setObserved('')
    setNote('')
  }

  if (!project || !milestone) {
    return <EmptyState title="No milestones assigned" />
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-5 items-start">
      {/* Work queue */}
      <Panel
        title="Assigned inspections"
        subtitle={`${awaiting.filter(({ m }) => m.report && !m.inspection).length} awaiting observation`}
        className="[&>div]:p-0"
      >
        <ul className="divide-y divide-midnight-700">
          {awaiting.map(({ p, m }) => {
            const active = p.id === project.id && m.id === milestone.id
            const done = Boolean(m.inspection)
            return (
              <li key={`${p.id}/${m.id}`}>
                <button
                  type="button"
                  onClick={() => {
                    setKey(`${p.id}/${m.id}`)
                    setResult(null)
                  }}
                  aria-current={active}
                  className={`w-full text-left px-5 py-3.5 transition-colors ${
                    active ? 'bg-midnight-950' : 'hover:bg-midnight-950/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <StatusDot tone={TONE(p.status)} pulse={p.status === 'flagged'} />
                    <span className="text-xs font-mono text-porcelain-200">{p.id}</span>
                    <span className="ml-auto shrink-0">
                      {done ? (
                        <StatusBadge tone="verified" label="Observed" size="sm" />
                      ) : m.report ? (
                        <StatusBadge tone="pending" label="Claim filed" size="sm" />
                      ) : (
                        <StatusBadge tone="neutral" label="No claim" size="sm" />
                      )}
                    </span>
                  </div>
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-porcelain-200 mt-0.5">
                    {m.title}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </Panel>

      <div className="space-y-5">
        {/* Capture form */}
        <Panel
          title="Record observation"
          subtitle={`${project.id} · ${milestone.title}`}
          actions={
            <StatusBadge
              tone={TONE(project.status)}
              label={PROJECT_STATUS_META[project.status]?.label ?? project.status}
            />
          }
        >
          {!milestone.report ? (
            <EmptyState title="No contractor claim on record">
              There is nothing to independently verify yet. An observation can only be
              recorded once a claim exists.
            </EmptyState>
          ) : (
            <>
              {/* The claim being verified */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <Field label="Approved" mono>
                  {formatQuantity(milestone.commitment.quantity, milestone.commitment.unit)}
                </Field>
                <Field label="Contractor claims" mono>
                  {formatQuantity(milestone.report.claimedQuantity, milestone.commitment.unit)}
                </Field>
                <Field label="Claimed by">
                  <span className="text-xs">{milestone.report.reportedBy}</span>
                </Field>
                <Field label="Site fix" mono>
                  <span className="text-xs">
                    {fix.lat} {fix.lon}
                  </span>
                  <div className="text-[10px] text-porcelain-200">
                    ±{fix.accuracy} · captured
                  </div>
                </Field>
              </div>

              {milestone.inspection && (
                <div className="text-xs text-porcelain-200 bg-midnight-950 border-l-3 border-l-status-verified rounded-r px-4 py-3 mb-5 leading-relaxed">
                  Already observed at{' '}
                  {formatQuantity(milestone.inspection.observedQuantity, milestone.commitment.unit)} by{' '}
                  {milestone.inspection.inspectedBy}. Submitting again supersedes that
                  reading and is recorded in the audit trail.
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4">
                  <label className="block">
                    <span className="block text-[10px] uppercase tracking-wider text-porcelain-200 mb-1.5">
                      Observed quantity ({milestone.commitment.unit})
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={observed}
                      onChange={(e) => setObserved(e.target.value)}
                      placeholder="Measured on site"
                      className="w-full bg-midnight-950 border border-midnight-700 rounded px-3 py-3 text-lg font-mono focus:outline-none focus:border-status-verified"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[10px] uppercase tracking-wider text-porcelain-200 mb-1.5">
                      Measurement note
                    </span>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Where measured from, what is physically present, what is missing"
                      className="w-full bg-midnight-950 border border-midnight-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-status-verified resize-y"
                    />
                  </label>
                </div>

                <div className="text-xs text-porcelain-200 leading-relaxed">
                  Tolerance for this comparison is ±
                  {Math.round(TOLERANCE.observedVsReported * 100)}% of the contractor&rsquo;s
                  claim. A reading outside that range opens a finding automatically.
                </div>

                <Button variant="primary" type="submit" disabled={observed === ''}>
                  Submit observation and reconcile
                </Button>
              </form>
            </>
          )}
        </Panel>

        {/* Immediate verdict */}
        {result && (
          <Panel
            tone={
              result.verdict === 'matches'
                ? 'verified'
                : result.verdict === 'recorded'
                  ? 'neutral'
                  : 'flagged'
            }
            title={
              result.verdict === 'matches'
                ? 'Observation recorded — within tolerance'
                : result.verdict === 'shortfall'
                  ? 'Observation recorded — shortfall found, finding opened'
                  : result.verdict === 'overrun'
                    ? 'Observation recorded — overrun found, finding opened'
                    : 'Observation recorded'
            }
            subtitle={`${result.projectId} · ${result.value} ${result.unit === 'metre' ? 'm' : result.unit}`}
          >
            {result.claimed != null && (
              <div className="space-y-4">
                <dl className="divide-y divide-midnight-700 border border-midnight-700 rounded">
                  <div className="flex items-baseline justify-between px-4 py-2.5">
                    <dt className="text-xs text-porcelain-200">Contractor claimed</dt>
                    <dd className="font-mono text-sm">{result.claimed}</dd>
                  </div>
                  <div className="flex items-baseline justify-between px-4 py-2.5">
                    <dt className="text-xs text-porcelain-200">You observed</dt>
                    <dd className="font-mono text-sm">{result.value}</dd>
                  </div>
                  <div className="flex items-baseline justify-between px-4 py-2.5">
                    <dt className="text-xs text-porcelain-200">Variance</dt>
                    <dd
                      className={`font-mono text-sm ${
                        result.verdict === 'matches'
                          ? 'text-status-text-verified'
                          : 'text-status-text-flagged'
                      }`}
                    >
                      {result.variance >= 0 ? '+' : ''}
                      {(result.variance * 100).toFixed(1)}%
                    </dd>
                  </div>
                </dl>

                <ShareBar
                  label="Observed against claimed"
                  percent={(result.value / result.claimed) * 100}
                  tone={result.verdict === 'matches' ? 'verified' : 'flagged'}
                />

                <p className="text-sm leading-relaxed">
                  {result.verdict === 'matches' ? (
                    <>
                      This claim is corroborated by independent observation. No finding was
                      raised — the record now stands verified.
                    </>
                  ) : result.verdict === 'shortfall' ? (
                    <>
                      The observation is below the claim by more than the{' '}
                      {Math.round(TOLERANCE.observedVsReported * 100)}% tolerance. A
                      discrepancy has been opened and referred to the Ward Officer, who
                      records the disposition. You do not decide the outcome.
                    </>
                  ) : (
                    <>
                      The observation exceeds the claim by more than the{' '}
                      {Math.round(TOLERANCE.observedVsReported * 100)}% tolerance. A finding
                      has been opened for review.
                    </>
                  )}
                </p>
              </div>
            )}
          </Panel>
        )}
      </div>
    </div>
  )
}
