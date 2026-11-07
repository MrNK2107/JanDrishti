/**
 * Project detail — one project's record, with the four-step explanation.
 *
 * Extracted from the dashboard so both the ward overview and the discrepancy
 * queue can show the same thing without duplicating it. The explanation itself
 * lives in `EvidenceChain`; this component adds the project metadata and the
 * measurement form an officer can use instead of switching to the field portal.
 */

import { useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { PROJECT_STATUS_META, formatRupees, formatQuantity } from '../domain/reconcile'
import { EvidenceChain } from './EvidenceChain'
import { useToast } from './feedback'
import { Button, Callout, Field, Panel, Spinner, StatusBadge } from './ui'

export function ProjectDetail({ project }) {
  const { actions, pending } = useStore()
  const toast = useToast()
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')

  const milestone = project?.milestones?.[0]
  if (!milestone) return null

  const unit = milestone.commitment.unit === 'metre' ? 'm' : milestone.commitment.unit
  const tone =
    project.status === 'flagged'
      ? 'flagged'
      : project.status === 'verified' || project.status === 'resolved'
        ? 'verified'
        : 'pending'

  const busy = Boolean(pending.inspect)

  const submit = async (e) => {
    e.preventDefault()
    if (quantity === '') return
    const res = await actions.recordInspection({
      projectId: project.id,
      milestoneId: milestone.id,
      observedQuantity: Number(quantity),
      note,
    })
    if (res.ok) {
      const opened = res.result?.opened ?? []
      if (opened.length > 0) {
        toast.error(
          'Measurement recorded — discrepancy opened',
          `${opened.length} finding${opened.length > 1 ? 's' : ''} referred to the Ward Officer.`
        )
      } else {
        toast.success('Measurement recorded', 'The claim is corroborated on site.')
      }
      setQuantity('')
      setNote('')
    } else {
      toast.error('Could not record the measurement', res.error?.message)
    }
  }

  return (
    <Panel
      title={project.name}
      subtitle={`${project.id} · ${project.ward} · ${project.contractor}`}
      actions={
        <StatusBadge
          tone={tone}
          label={PROJECT_STATUS_META[project.status]?.label ?? project.status}
        />
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        <Field label="Sanctioned budget" mono>
          {formatRupees(project.budget)}
        </Field>
        <Field label="Sanctioned on" mono>
          {project.sanctionedOn}
        </Field>
        <Field label="Location" className="col-span-2 sm:col-span-1">
          <span className="text-xs leading-snug">{project.location}</span>
        </Field>
      </div>

      <EvidenceChain milestone={milestone} project={project} />

      <div className="mt-6 pt-5 border-t border-hairline">
        <h3 className="text-sm font-semibold text-ink mb-1">
          Record a measurement
        </h3>
        {milestone.inspection ? (
          <Callout tone="verified" title="Already measured">
            {formatQuantity(milestone.inspection.observedQuantity, unit)} was recorded on
            site by {milestone.inspection.inspectedBy}. Filing a new contractor report
            clears this reading, because earlier evidence cannot vouch for new work.
          </Callout>
        ) : milestone.report ? (
          <>
            <p className="text-sm text-ink-muted mb-3 leading-relaxed">
              The contractor reported{' '}
              {formatQuantity(milestone.report.claimedQuantity, unit)}. Enter what is
              physically on site and the system will compare the two.
            </p>
            <form className="space-y-3" onSubmit={submit}>
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
                <label className="block">
                  <span className="block text-2xs uppercase tracking-wide text-ink-muted mb-1.5">
                    Measured on site ({unit})
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={String(milestone.report.claimedQuantity)}
                    className="w-full bg-paper border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="block">
                  <span className="block text-2xs uppercase tracking-wide text-ink-muted mb-1.5">
                    What you found
                  </span>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Where you measured from and what is present"
                    className="w-full bg-paper border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
              </div>
              <Button variant="primary" type="submit" disabled={busy || quantity === ''}>
                {busy ? (
                  <>
                    <Spinner /> Recording…
                  </>
                ) : (
                  'Record measurement and compare'
                )}
              </Button>
            </form>
          </>
        ) : (
          <Callout tone="neutral" title="Nothing to measure yet">
            No completion report exists for this milestone. An observation can only be
            recorded against a claim.
          </Callout>
        )}
      </div>
    </Panel>
  )
}

export default ProjectDetail
