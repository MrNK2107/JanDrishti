/**
 * Contractor Portal — report work done.
 *
 * The first step of the cycle, so it states the cycle plainly: what happens to
 * a claim after it is filed, and why filing it does not finish anything. A
 * contractor who understands that the inspector is the one who closes the loop
 * is less likely to overstate a figure — which is the behaviour the product is
 * trying to encourage, not merely catch.
 */

import { useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { selectProjectViews } from '../domain/selectors'
import {
  PROJECT_STATUS_META,
  formatQuantity,
  formatRupees,
  TOLERANCE,
} from '../domain/reconcile'
import { Button, Callout, Field, Input, Panel, StatusBadge, StatusDot } from '../components/ui'

const toneOf = (status) =>
  status === 'flagged'
    ? 'flagged'
    : status === 'verified' || status === 'resolved'
      ? 'verified'
      : 'pending'

export default function ContractorPortal() {
  const { dispatch, projectViews } = useStore()
  const [projectId, setProjectId] = useState(() => projectViews[0]?.id ?? '')
  const [claimed, setClaimed] = useState('')
  const [note, setNote] = useState('')
  const [filed, setFiled] = useState(null)

  const project = projectViews.find((p) => p.id === projectId) ?? projectViews[0]
  const milestone = project?.milestones[0]
  const unit = milestone?.commitment.unit === 'metre' ? 'm' : milestone?.commitment?.unit

  if (!project || !milestone) {
    return <p className="text-sm text-ink-muted">No sanctioned scope available.</p>
  }

  const sanctioned = milestone.commitment.quantity
  const band = sanctioned * TOLERANCE.reportVsApproved
  const lower = Math.max(0, sanctioned - band)
  const upper = sanctioned + band

  const submit = (e) => {
    e.preventDefault()
    if (!claimed) return
    dispatch({
      type: 'REPORT_MILESTONE',
      payload: {
        projectId: project.id,
        milestoneId: milestone.id,
        claimedQuantity: Number(claimed),
        reportedBy: project.contractor,
        note,
        evidenceLabel: 'site-submission.jpg',
      },
    })
    setFiled({ quantity: Number(claimed), project: project.name })
    setClaimed('')
    setNote('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Report work complete</h1>
        <p className="text-sm text-ink-muted mt-1.5 max-w-3xl leading-relaxed">
          Choose the sanctioned milestone you have worked on and state how much you have
          completed. An independent inspector will measure the site — your figure is recorded
          as your claim, not as the final result.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="space-y-5">
          <Panel title="Sanctioned scope" subtitle="Pick the milestone you are reporting against">
            <ul className="space-y-2">
              {projectViews.flatMap((p) =>
                p.milestones.map((m) => {
                  const active = p.id === project.id && m.id === milestone.id
                  return (
                    <li key={`${p.id}-${m.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setProjectId(p.id)
                          setFiled(null)
                        }}
                        aria-current={active}
                        className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                          active
                            ? 'border-status-verified bg-status-soft-verified'
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
                })
              )}
            </ul>
          </Panel>

          <Panel
            title="Your claim"
            subtitle={`${project.id} · milestone ${milestone.id} — ${milestone.title}`}
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
                  : 'No claim yet'}
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
                  hint={`Sanctioned ${lower.toFixed(0)}–${upper.toFixed(0)} ${unit}`}
                />
                <Input
                  id="note"
                  label="Work note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything the reviewing officer should know"
                />
              </div>

              <Callout tone="pending" title="Filing a claim does not mark work complete">
                It moves this milestone to <strong className="font-semibold">awaiting
                inspection</strong>. An officer then measures the site and records what is
                physically there. Only that measurement establishes completion.
              </Callout>

              <Button variant="primary" type="submit" disabled={!claimed}>
                Submit claim for inspection
              </Button>
            </form>

            {filed && (
              <div className="mt-5">
                <Callout tone="pending" title="Claim recorded — awaiting inspection">
                  {formatQuantity(filed.quantity, unit)} claimed against {filed.project}. No
                  discrepancy can be raised until an inspector records an observation.
                </Callout>
              </div>
            )}
          </Panel>
        </div>

        <Panel title="What happens next" subtitle="And why it works this way">
          <ol className="space-y-4">
            {[
              {
                n: '1',
                t: 'Your claim is recorded, not accepted',
                b: 'It is stored with your name, the date, and an evidence reference. It becomes one of three figures, not the answer.',
              },
              {
                n: '2',
                t: 'The milestone becomes awaiting inspection',
                b: 'Any earlier measurement on this milestone is cleared. Old evidence cannot vouch for new work.',
              },
              {
                n: '3',
                t: 'An officer measures the site',
                b: 'Their observation is recorded separately and cannot be edited by you. Neither record overrides the other.',
              },
              {
                n: '4',
                t: 'The system compares the two',
                b: `If the measurement differs from your claim by more than ${Math.round(
                  TOLERANCE.observedVsReported * 100
                )}%, a discrepancy opens and a Ward Officer decides what happens.`,
              },
            ].map((s) => (
              <li key={s.n} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="w-6 h-6 rounded-full bg-sunken text-ink-muted grid place-items-center text-xs font-bold shrink-0"
                >
                  {s.n}
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
