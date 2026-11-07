/**
 * Contractor Portal — file a completion claim.
 *
 * This is where the loop starts, so the interface has one job: make it
 * unambiguous what is being claimed *against*. Every field is anchored to the
 * sanctioned scope, and the form states the tolerance the claim will be judged
 * by before it is submitted, not after.
 *
 * The portal cannot mark work complete. Filing a claim moves a milestone to
 * "awaiting inspection" and nothing further — completion is only ever
 * established by independent observation. That asymmetry is the product.
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
import { Button, EmptyState, Field, Input, Panel, StatusBadge, StatusDot } from '../components/ui'

const TONE = (status) =>
  status === 'flagged'
    ? 'flagged'
    : status === 'verified' || status === 'resolved'
      ? 'verified'
      : 'pending'

export default function ContractorPortal() {
  const { state, dispatch, projectViews } = useStore()
  const [projectId, setProjectId] = useState(() => projectViews[0]?.id ?? '')
  const [claimed, setClaimed] = useState('')
  const [note, setNote] = useState('')
  const [filed, setFiled] = useState(null)

  const project = projectViews.find((p) => p.id === projectId) ?? projectViews[0]
  const milestone = project?.milestones[0]

  const contractor = project?.contractor ?? 'Contractor'

  const fileClaim = (e) => {
    e.preventDefault()
    if (!milestone || !claimed) return
    dispatch({
      type: 'REPORT_MILESTONE',
      payload: {
        projectId: project.id,
        milestoneId: milestone.id,
        claimedQuantity: Number(claimed),
        reportedBy: contractor,
        note,
        evidenceLabel: 'site-submission.jpg',
      },
    })
    setFiled({ quantity: Number(claimed), project: project.name })
    setClaimed('')
    setNote('')
  }

  if (!project || !milestone) {
    return <EmptyState title="No sanctioned scope available">Nothing to claim against.</EmptyState>
  }

  const toleranceBand = milestone.commitment.quantity * TOLERANCE.reportVsApproved
  const lower = milestone.commitment.quantity - toleranceBand
  const upper = milestone.commitment.quantity + toleranceBand

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-5 items-start">
      <div className="space-y-5">
        {/* Scope selector */}
        <Panel title="Sanctioned scope" subtitle="Select the milestone you are reporting against">
          <div className="space-y-2">
            {projectViews.map((p) =>
              p.milestones.map((m) => {
                const active = p.id === project.id && m.id === milestone.id
                return (
                  <button
                    key={`${p.id}-${m.id}`}
                    type="button"
                    onClick={() => {
                      setProjectId(p.id)
                      setFiled(null)
                    }}
                    aria-current={active}
                    className={`w-full text-left rounded border px-4 py-3 transition-colors ${
                      active
                        ? 'border-status-verified bg-midnight-950'
                        : 'border-midnight-700 hover:bg-midnight-950/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <StatusDot tone={TONE(p.status)} pulse={p.status === 'flagged'} />
                      <span className="text-sm font-medium truncate">{p.name}</span>
                      <span className="ml-auto shrink-0">
                        <StatusBadge
                          tone={TONE(p.status)}
                          label={PROJECT_STATUS_META[p.status]?.label ?? p.status}
                          size="sm"
                        />
                      </span>
                    </div>
                    <div className="text-[11px] text-porcelain-200 mt-1.5 font-mono">
                      {p.id} · {m.id} · approved{' '}
                      {formatQuantity(m.commitment.quantity, m.commitment.unit)}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </Panel>

        {/* Claim form */}
        <Panel
          title="File a completion claim"
          subtitle={`${project.id} · Milestone ${milestone.id} — ${milestone.title}`}
        >
          {/* What is already on record */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <Field label="Sanctioned quantity" mono>
              {formatQuantity(milestone.commitment.quantity, milestone.commitment.unit)}
            </Field>
            <Field label="Sanctioned value" mono>
              {formatRupees(project.budget)}
            </Field>
            <Field label="Current claim on record" mono>
              {milestone.report
                ? formatQuantity(milestone.report.claimedQuantity, milestone.commitment.unit)
                : 'None'}
            </Field>
          </div>

          <form onSubmit={fileClaim} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4">
              <Input
                id="claimed"
                label={`Quantity completed (${milestone.commitment.unit})`}
                type="number"
                min="0"
                step="1"
                value={claimed}
                onChange={(e) => setClaimed(e.target.value)}
                placeholder={String(milestone.commitment.quantity)}
                hint={`Accepted range ±${Math.round(
                  TOLERANCE.reportVsApproved * 100
                )}%: ${lower.toFixed(0)}–${upper.toFixed(0)}`}
              />
              <Input
                id="note"
                label="Work note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything the reviewing officer should know"
              />
            </div>

            <div className="text-xs text-porcelain-200 bg-midnight-950 border-l-3 border-l-status-pending rounded-r px-4 py-3 leading-relaxed">
              Filing a claim does not mark work complete. It moves this milestone to
              <span className="text-porcelain-100"> awaiting inspection</span>, where an
              independent officer records what is physically present. Completion is
              established by that observation, not by this submission.
            </div>

            <Button variant="primary" type="submit" disabled={!claimed}>
              Submit claim for inspection
            </Button>
          </form>

          {filed && (
            <div
              role="status"
              className="mt-5 text-sm bg-status-tint-pending border border-status-pending/40 rounded px-4 py-3 animate-rise"
            >
              <div className="font-medium text-status-text-pending">
                Claim recorded — awaiting independent inspection
              </div>
              <p className="text-xs mt-1.5 text-porcelain-100 leading-relaxed">
                {formatQuantity(filed.quantity, milestone.commitment.unit)} claimed against{' '}
                {filed.project}. No finding can be raised until an inspector records an
                observation.
              </p>
            </div>
          )}
        </Panel>
      </div>

      {/* What happens next */}
      <Panel title="What the system does with this" subtitle="The evidence requirement">
        <ol className="space-y-4">
          {[
            {
              n: 1,
              title: 'Your claim is recorded, not accepted',
              body: 'The submission is stored with your identity, a timestamp, and an evidence hash. It is one of three numbers, not the answer.',
            },
            {
              n: 2,
              title: 'The milestone becomes awaiting inspection',
              body: 'Filing clears any previous observation on this milestone. Earlier evidence cannot vouch for new work.',
            },
            {
              n: 3,
              title: 'An independent officer measures the site',
              body: 'Their observation is recorded separately and cannot be edited by you.',
            },
            {
              n: 4,
              title: 'The system reconciles the two',
              body: `If the observation differs from your claim by more than ${Math.round(
                TOLERANCE.observedVsReported * 100
              )}%, a finding opens automatically and a Ward Officer reviews it.`,
            },
          ].map((s) => (
            <li key={s.n} className="flex gap-3">
              <span
                aria-hidden="true"
                className="shrink-0 w-6 h-6 rounded-full bg-midnight-950 border border-midnight-700 grid place-items-center text-[11px] font-mono text-porcelain-200"
              >
                {s.n}
              </span>
              <div>
                <div className="text-sm font-medium">{s.title}</div>
                <p className="text-xs text-porcelain-200 mt-1 leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}
