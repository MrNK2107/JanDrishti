/**
 * Contractor — report progress against sanctioned scope.
 *
 * The portal states, before the form, what will happen to a reported figure. A
 * contractor who knows an independent measurement follows is less likely to
 * overstate — which is the behaviour the product is trying to encourage, not
 * merely catch.
 */

import { useEffect, useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { useToast } from '../components/feedback'
import {
  PROJECT_STATUS_META,
  formatQuantity,
  formatRupees,
  TOLERANCE,
} from '../domain/reconcile'
import {
  Button,
  Callout,
  Field,
  Input,
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

export default function ContractorPortal() {
  const { projectViews, actions, pending, loading } = useStore()
  const toast = useToast()
  const [selected, setSelected] = useState(null)
  const [claimed, setClaimed] = useState('')
  const [note, setNote] = useState('')

  const milestones = projectViews.flatMap((p) => p.milestones.map((m) => ({ p, m })))

  useEffect(() => {
    if (selected && milestones.some(({ p, m }) => `${p.id}/${m.id}` === selected)) return
    const first = milestones[0]
    if (first) setSelected(`${first.p.id}/${first.m.id}`)
  }, [milestones, selected])

  if (loading && milestones.length === 0) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  const [projectId, milestoneId] = (selected ?? '').split('/')
  const project = projectViews.find((p) => p.id === projectId) ?? projectViews[0]
  const milestone =
    project?.milestones.find((m) => m.id === milestoneId) ?? project?.milestones[0]

  if (!project || !milestone) {
    return (
      <Callout tone="neutral" title="No sanctioned scope assigned">
        Projects appear here once the ward sanctions work for your organisation.
      </Callout>
    )
  }

  const unit = milestone.commitment.unit === 'metre' ? 'm' : milestone.commitment.unit
  const sanctioned = milestone.commitment.quantity
  const band = sanctioned * TOLERANCE.reportVsApproved
  const lower = Math.max(0, sanctioned - band)
  const upper = sanctioned + band
  const busy = Boolean(pending.report)

  const submit = async (e) => {
    e.preventDefault()
    if (claimed === '') return
    const res = await actions.reportMilestone({
      projectId: project.id,
      milestoneId: milestone.id,
      claimedQuantity: Number(claimed),
      note,
    })
    if (res.ok) {
      toast.success(
        'Report submitted',
        'The milestone now awaits an independent measurement.'
      )
      setClaimed('')
      setNote('')
    } else {
      toast.error('Could not submit the report', res.error?.message)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Report progress</h1>
        <p className="text-sm text-ink-muted mt-1.5 max-w-3xl leading-relaxed">
          Choose the sanctioned milestone you have worked on and state how much is
          complete. An inspector will measure the site independently — your figure is
          recorded as your report, not as the final result.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-5">
          <Panel title="Sanctioned scope" subtitle="Select the milestone you are reporting against">
            <ul className="space-y-2">
              {milestones.map(({ p, m }) => {
                const key = `${p.id}/${m.id}`
                const active = selected === key
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setSelected(key)}
                      aria-current={active}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                        active
                          ? 'border-accent bg-accent-soft'
                          : 'border-hairline bg-paper hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusDot tone={toneOf(p.status)} />
                        <span className="text-sm font-medium text-ink">{p.name}</span>
                        <span className="ml-auto">
                          <StatusBadge
                            tone={toneOf(p.status)}
                            label={PROJECT_STATUS_META[p.status]?.label ?? p.status}
                            size="sm"
                          />
                        </span>
                      </div>
                      <div className="text-xs text-ink-muted mt-1.5 font-mono">
                        {p.id} · {m.id} · sanctioned{' '}
                        {formatQuantity(m.commitment.quantity, m.commitment.unit)}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel
            title="Your report"
            subtitle={`${project.id} · ${milestone.title}`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
              <Field label="Sanctioned quantity" mono>
                {formatQuantity(sanctioned, unit)}
              </Field>
              <Field label="Sanctioned value" mono>
                {formatRupees(project.budget)}
              </Field>
              <Field label="Currently on record" mono>
                {milestone.report
                  ? formatQuantity(milestone.report.claimedQuantity, unit)
                  : 'No report yet'}
              </Field>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
                <Input
                  id="claimed"
                  label={`Quantity completed (${unit})`}
                  type="number"
                  min="0"
                  step="1"
                  value={claimed}
                  onChange={(e) => setClaimed(e.target.value)}
                  placeholder={String(sanctioned)}
                  hint={`Sanctioned range ${lower.toFixed(0)}–${upper.toFixed(0)} ${unit}`}
                />
                <Input
                  id="note"
                  label="Work note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything the reviewing officer should know"
                />
              </div>

              <Callout tone="pending" title="Submitting a report does not mark work complete">
                It moves this milestone to <strong className="font-semibold">awaiting
                measurement</strong>. An officer then records what is physically on site,
                and only that measurement establishes completion.
              </Callout>

              <Button variant="primary" type="submit" disabled={busy || claimed === ''}>
                {busy ? (
                  <>
                    <Spinner /> Submitting…
                  </>
                ) : (
                  'Submit report'
                )}
              </Button>
            </form>
          </Panel>
        </div>

        <Panel title="What happens next" subtitle="And why it works this way">
          <ol className="space-y-4">
            {[
              {
                t: 'Your report is recorded, not accepted',
                b: 'It is stored with your organisation, the date, and an evidence reference. It becomes one of three figures, not the answer.',
              },
              {
                t: 'The milestone awaits measurement',
                b: 'Any earlier measurement on this milestone is cleared. Earlier evidence cannot vouch for new work.',
              },
              {
                t: 'An officer measures the site',
                b: 'Their observation is recorded separately and cannot be edited by you. Neither record overrides the other.',
              },
              {
                t: 'The two are compared',
                b: `If the measurement differs from your report by more than ${Math.round(
                  TOLERANCE.observedVsReported * 100
                )}%, a discrepancy opens and a Ward Officer decides what happens.`,
              },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="w-6 h-6 rounded-full bg-sunken text-ink-muted grid place-items-center text-2xs font-semibold shrink-0"
                >
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-medium text-ink">{s.t}</div>
                  <p className="text-sm text-ink-muted mt-1 leading-relaxed">{s.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  )
}
