/**
 * Field Inspector — record what is on site.
 *
 * The verdict appears immediately, on site, while re-measurement is still
 * possible. A passing result is shown with the same prominence as a failing one:
 * an interface that only reacts to problems teaches people to distrust it, and
 * most inspections are uneventful.
 */

import { useEffect, useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { useToast } from '../components/feedback'
import { PROJECT_STATUS_META, formatQuantity, TOLERANCE } from '../domain/reconcile'
import {
  Button,
  Callout,
  EmptyState,
  Field,
  Panel,
  Skeleton,
  Spinner,
  StatusBadge,
  StatusDot,
} from '../components/ui'

const toneOf = (status) =>
  status === 'flagged'
    ? 'flagged'
    : status === 'verified' || status === 'resolved'
      ? 'verified'
      : 'pending'

export default function InspectorInterface() {
  const { projectViews, actions, pending, loading, session } = useStore()
  const toast = useToast()

  const queue = projectViews.flatMap((p) => p.milestones.map((m) => ({ p, m })))
  const awaiting = queue.filter(({ m }) => m.report && !m.inspection)
  const [selected, setSelected] = useState(null)
  const [observed, setObserved] = useState('')
  const [note, setNote] = useState('')

  // Default to the first milestone that needs a measurement, once loaded.
  useEffect(() => {
    if (selected && queue.some(({ p, m }) => `${p.id}/${m.id}` === selected)) return
    const first = awaiting[0] ?? queue.find(({ m }) => m.report) ?? queue[0]
    if (first) setSelected(`${first.p.id}/${first.m.id}`)
  }, [queue, awaiting, selected])

  if (loading && queue.length === 0) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-5">
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (queue.length === 0) {
    return <EmptyState title="No milestones assigned to you" />
  }

  const [projectId, milestoneId] = (selected ?? '').split('/')
  const project = projectViews.find((p) => p.id === projectId) ?? projectViews[0]
  const milestone =
    project?.milestones.find((m) => m.id === milestoneId) ?? project?.milestones[0]

  const unit = milestone?.commitment.unit === 'metre' ? 'm' : milestone?.commitment?.unit
  const claimed = milestone?.report?.claimedQuantity ?? null
  const busy = Boolean(pending.inspect)

  const submit = async (e) => {
    e.preventDefault()
    if (observed === '') return
    const res = await actions.recordInspection({
      projectId: project.id,
      milestoneId: milestone.id,
      observedQuantity: Number(observed),
      note,
    })
    if (res.ok) {
      const opened = res.result?.opened ?? []
      if (opened.length > 0) {
        toast.error(
          'Measurement recorded — discrepancy opened',
          'Referred to the Ward Officer, who decides what happens next.'
        )
      } else {
        toast.success('Measurement recorded', 'The reported figure is corroborated on site.')
      }
      setObserved('')
      setNote('')
    } else {
      toast.error('Could not record the measurement', res.error?.message)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Assigned inspections</h1>
        <p className="text-sm text-ink-muted mt-1.5 max-w-3xl leading-relaxed">
          Enter the quantity you measure on site. The system compares it against the
          contractor&rsquo;s reported figure immediately, so you can re-measure before
          leaving if something does not add up.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
        <Panel
          title="Your queue"
          subtitle={`${awaiting.length} awaiting measurement`}
          className="[&>div]:p-0"
        >
          <ul className="divide-y divide-hairline">
            {queue.map(({ p, m }) => {
              const key = `${p.id}/${m.id}`
              const active = selected === key
              const done = Boolean(m.inspection)
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setSelected(key)}
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
                          <StatusBadge tone="pending" label="Reported" size="sm" />
                        ) : (
                          <StatusBadge tone="neutral" label="No report" size="sm" />
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
                No completion report exists for this milestone. An observation can only be
                recorded against a reported figure.
              </Callout>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  <Field label="Sanctioned" mono>
                    {formatQuantity(milestone.commitment.quantity, unit)}
                  </Field>
                  <Field label="Reported" mono>
                    {formatQuantity(milestone.report.claimedQuantity, unit)}
                  </Field>
                  <Field label="Reported by">
                    <span className="text-xs">{milestone.report.reportedBy}</span>
                  </Field>
                  <Field label="Recorded" mono>
                    <span className="text-xs">
                      {new Date(milestone.report.reportedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </Field>
                </div>

                {milestone.inspection && (
                  <div className="mb-5">
                    <Callout tone="verified" title="Already measured">
                      {formatQuantity(milestone.inspection.observedQuantity, unit)} was
                      recorded by {milestone.inspection.inspectedBy}. Submitting again
                      supersedes that reading and is written to the audit trail.
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
                        className="w-full bg-paper border border-border rounded px-3 py-2.5 text-lg font-mono tabular-nums focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                        className="w-full bg-paper border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-y"
                      />
                    </label>
                  </div>

                  <p className="text-xs text-ink-muted leading-relaxed">
                    A difference of more than{' '}
                    {Math.round(TOLERANCE.observedVsReported * 100)}% from the reported
                    figure opens a discrepancy automatically and refers it to the Ward
                    Officer.
                  </p>

                  <Button variant="primary" type="submit" disabled={busy || observed === ''}>
                    {busy ? (
                      <>
                        <Spinner /> Submitting…
                      </>
                    ) : (
                      'Submit measurement'
                    )}
                  </Button>
                </form>
              </>
            )}
          </Panel>

          {/* The most recent measurement by this inspector, with its consequence */}
          {milestone.inspection && (
            <MeasuredSummary milestone={milestone} claimed={claimed} unit={unit} />
          )}
        </div>
      </div>
    </div>
  )
}

function MeasuredSummary({ milestone, claimed, unit }) {
  const observed = milestone.inspection.observedQuantity
  const variance = claimed ? (observed - claimed) / claimed : null
  const overTolerance = variance != null && Math.abs(variance) > TOLERANCE.observedVsReported
  const matched = variance != null && !overTolerance

  return (
    <Panel
      tone={matched ? 'verified' : 'flagged'}
      title={matched ? 'Recorded — matches the reported figure' : 'Recorded — differs from the reported figure'}
      subtitle={`Measured ${observed} ${unit}`}
    >
      {claimed != null && (
        <div className="space-y-4">
          <dl className="border border-hairline rounded-lg divide-y divide-hairline">
            {[
              ['Reported', `${claimed} ${unit}`],
              ['Measured', `${observed} ${unit}`],
              ['Difference', `${variance >= 0 ? '+' : ''}${(variance * 100).toFixed(1)}%`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between px-4 py-2.5">
                <dt className="text-sm text-ink-muted">{label}</dt>
                <dd className="font-mono text-sm tabular-nums text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <Callout tone={matched ? 'verified' : 'flagged'} title="What this means">
            {matched ? (
              <>
                The reported figure is corroborated by your independent measurement. No
                discrepancy was raised and the milestone now stands verified.
              </>
            ) : (
              <>
                The work on site is{' '}
                <strong className="font-semibold">
                  {claimed - observed} {unit}
                </strong>{' '}
                short of the reported figure — beyond the{' '}
                {Math.round(TOLERANCE.observedVsReported * 100)}% tolerance. A discrepancy
                has been opened and referred to the Ward Officer, who decides what happens
                next. You have not decided anything; you recorded what is there.
              </>
            )}
          </Callout>
        </div>
      )}
    </Panel>
  )
}
