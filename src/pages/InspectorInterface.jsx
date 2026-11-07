/**
 * Field Inspector — verify on site.
 *
 * Step two of the cycle. This is the only place a discrepancy can originate,
 * because it is the only place independent evidence enters the system.
 *
 * The verdict is shown immediately, on site, while the inspector can still
 * re-measure or photograph what is missing. Learning days later that a reading
 * triggered a formal finding is useless to everyone.
 *
 * A passing result is shown with the same prominence as a failing one. An
 * interface that only ever reacts to problems teaches people to distrust it.
 */

import { useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { selectProjectViews } from '../domain/selectors'
import { PROJECT_STATUS_META, formatQuantity, TOLERANCE } from '../domain/reconcile'
import { Button, Callout, Field, Panel, StatusBadge, StatusDot } from '../components/ui'

const toneOf = (status) =>
  status === 'flagged'
    ? 'flagged'
    : status === 'verified' || status === 'resolved'
      ? 'verified'
      : 'pending'

/** Fixed site readings standing in for a device fix. No permission requested. */
const SITE_FIX = {
  'JDT-2026-0143': { place: 'T Nagar Main Rd', accuracy: '4 m' },
  'JDT-2026-0138': { place: 'Anna Nagar West Ext', accuracy: '6 m' },
  'JDT-2026-0152': { place: 'Saidapet Bridge', accuracy: '5 m' },
}

export default function InspectorInterface() {
  const { dispatch, projectViews } = useStore()

  const queue = projectViews.flatMap((p) => p.milestones.map((m) => ({ p, m })))
  const awaiting = queue.filter(({ m }) => m.report && !m.inspection)
  const first = awaiting[0] ?? queue.find(({ m }) => m.report) ?? queue[0]

  const [key, setKey] = useState(() => `${first?.p.id}/${first?.m.id}`)
  const [observed, setObserved] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState(null)

  const [projectId, milestoneId] = key.split('/')
  const project = projectViews.find((p) => p.id === projectId) ?? projectViews[0]
  const milestone =
    project?.milestones.find((m) => m.id === milestoneId) ?? project?.milestones[0]

  if (!project || !milestone) return <p className="text-sm text-ink-muted">No milestones assigned.</p>

  const unit = milestone.commitment.unit === 'metre' ? 'm' : milestone.commitment.unit
  const claimed = milestone.report?.claimedQuantity ?? null
  const fix = SITE_FIX[project.id] ?? { place: project.ward, accuracy: '8 m' }

  const submit = (e) => {
    e.preventDefault()
    if (observed === '') return

    const value = Number(observed)
    let verdict = 'recorded'
    let variance = null
    if (claimed != null) {
      variance = (value - claimed) / claimed
      verdict =
        Math.abs(variance) > TOLERANCE.observedVsReported
          ? variance < 0
            ? 'shortfall'
            : 'overrun'
          : 'matches'
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

    setResult({ verdict, variance, value, claimed, projectId: project.id, unit })
    setObserved('')
    setNote('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Record what is on site</h1>
        <p className="text-sm text-ink-muted mt-1.5 max-w-3xl leading-relaxed">
          Enter the quantity you actually measure. The system compares it against the
          contractor&rsquo;s claim immediately, so you can re-measure before you leave if
          something does not add up.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
        <Panel
          title="Assigned to you"
          subtitle={`${awaiting.length} awaiting a measurement`}
          className="[&>div]:p-0"
        >
          <ul className="divide-y divide-hairline">
            {queue.map(({ p, m }) => {
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
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      active ? 'bg-sunken' : 'hover:bg-canvas'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <StatusDot tone={toneOf(p.status)} />
                      <span className="font-mono text-xs text-ink-muted">{p.id}</span>
                      <span className="ml-auto">
                        {done ? (
                          <StatusBadge tone="verified" label="Measured" size="sm" />
                        ) : m.report ? (
                          <StatusBadge tone="pending" label="Claimed" size="sm" />
                        ) : (
                          <StatusBadge tone="neutral" label="No claim" size="sm" />
                        )}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-ink mt-1">{p.name}</div>
                    <div className="text-xs text-ink-muted">{m.title}</div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel
            title="Measurement"
            subtitle={`${project.id} · ${milestone.title}`}
            actions={
              <StatusBadge
                tone={toneOf(project.status)}
                label={PROJECT_STATUS_META[project.status]?.label ?? project.status}
              />
            }
          >
            {!milestone.report ? (
              <Callout tone="neutral" title="Nothing to verify yet">
                No contractor claim exists for this milestone. An observation can only be
                recorded against a claim — there is nothing to compare it to otherwise.
              </Callout>
            ) : (
              <>
                {/* What is being verified */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  <Field label="Sanctioned" mono>
                    {formatQuantity(milestone.commitment.quantity, unit)}
                  </Field>
                  <Field label="Contractor claims" mono>
                    {formatQuantity(milestone.report.claimedQuantity, unit)}
                  </Field>
                  <Field label="Claimed by">
                    <span className="text-xs">{milestone.report.reportedBy}</span>
                  </Field>
                  <Field label="Site fix" hint={`±${fix.accuracy}`}>
                    <span className="text-xs">{fix.place}</span>
                  </Field>
                </div>

                {milestone.inspection && (
                  <div className="mb-5">
                    <Callout tone="verified" title="Already measured">
                      {formatQuantity(milestone.inspection.observedQuantity, unit)} recorded by{' '}
                      {milestone.inspection.inspectedBy}. Submitting again supersedes that reading
                      and is written to the audit trail.
                    </Callout>
                  </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
                    <label className="block">
                      <span className="block text-2xs uppercase tracking-wide text-ink-muted mb-1.5">
                        Measured on site ({unit})
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={observed}
                        onChange={(e) => setObserved(e.target.value)}
                        placeholder={String(milestone.report.claimedQuantity)}
                        className="w-full bg-paper border border-border rounded px-3 py-2.5 text-lg font-mono tabular-nums focus:outline-none focus:border-status-verified focus:ring-2 focus:ring-status-verified/20"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-2xs uppercase tracking-wide text-ink-muted mb-1.5">
                        What you found
                      </span>
                      <textarea
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Where you measured from, what is physically present, what is missing"
                        className="w-full bg-paper border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-status-verified focus:ring-2 focus:ring-status-verified/20 resize-y"
                      />
                    </label>
                  </div>

                  <p className="text-xs text-ink-muted leading-relaxed">
                    A difference of more than{' '}
                    {Math.round(TOLERANCE.observedVsReported * 100)}% from the contractor&rsquo;s
                    claim will open a discrepancy automatically and refer it to a Ward Officer.
                  </p>

                  <Button variant="primary" type="submit" disabled={observed === ''}>
                    Submit measurement
                  </Button>
                </form>
              </>
            )}
          </Panel>

          {/* The verdict — explained, not just announced */}
          {result && (
            <Panel
              tone={
                result.verdict === 'matches'
                  ? 'verified'
                  : result.verdict === 'recorded'
                    ? 'info'
                    : 'flagged'
              }
              title={
                result.verdict === 'matches'
                  ? 'Measured — matches the claim'
                  : result.verdict === 'shortfall'
                    ? 'Measured — short of the claim'
                    : result.verdict === 'overrun'
                      ? 'Measured — more than claimed'
                      : 'Measurement recorded'
              }
              subtitle={`${result.projectId} · ${result.value} ${result.unit}`}
            >
              {result.claimed != null && (
                <div className="space-y-4">
                  <dl className="border border-hairline rounded-lg divide-y divide-hairline">
                    {[
                      ['Contractor claimed', `${result.claimed} ${result.unit}`],
                      ['You measured', `${result.value} ${result.unit}`],
                      [
                        'Difference',
                        `${result.variance >= 0 ? '+' : ''}${(result.variance * 100).toFixed(1)}%`,
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-baseline justify-between px-4 py-2.5">
                        <dt className="text-sm text-ink-muted">{label}</dt>
                        <dd className="font-mono text-sm tabular-nums text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <Callout
                    tone={result.verdict === 'matches' ? 'verified' : 'flagged'}
                    title="What this means"
                  >
                    {result.verdict === 'matches' ? (
                      <>
                        The claim is corroborated by your independent measurement. No discrepancy
                        was raised and the record now stands verified.
                      </>
                    ) : result.verdict === 'shortfall' ? (
                      <>
                        The work on site is{' '}
                        <strong className="font-semibold">
                          {result.claimed - result.value} {result.unit}
                        </strong>{' '}
                        short of what was claimed — beyond the{' '}
                        {Math.round(TOLERANCE.observedVsReported * 100)}% tolerance. A discrepancy
                        has been opened and referred to a Ward Officer, who decides what happens
                        next. You have not decided anything; you have recorded what is there.
                      </>
                    ) : (
                      <>
                        More was found than the contractor claimed. This is recorded for
                        completeness and referred for review.
                      </>
                    )}
                  </Callout>
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
