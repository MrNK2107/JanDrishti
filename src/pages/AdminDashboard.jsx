/**
 * Ward Officer — the reconciliation review surface.
 *
 * Structure follows the question a reader arrives with:
 *
 *   1. "Is anything wrong?"        → the one-line status and the metric row
 *   2. "Which projects, and how?"  → the delivery chart, worst-first
 *   3. "Why? Show me the working." → the evidence chain for one project
 *   4. "What do I do about it?"    → the finding and its disposition
 *
 * The previous version led with a stylised map that answered none of these.
 */

import { useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { selectProjectViews, selectSummary, selectAuditLog } from '../domain/selectors'
import {
  PROJECT_STATUS_META,
  DISCREPANCY_KIND_META,
  DISCREPANCY_STATUS_META,
  formatQuantity,
  formatRupees,
  formatRupeesShort,
} from '../domain/reconcile'
import { DeliveryChart } from '../components/DeliveryChart'
import { EvidenceChain } from '../components/EvidenceChain'
import {
  Button,
  Callout,
  EmptyState,
  Field,
  Metric,
  Panel,
  StatusBadge,
  StatusDot,
  Textarea,
} from '../components/ui'

/** Review queue: each finding explains itself in a sentence. */
function FindingsQueue({ onOpenProject }) {
  const { state, dispatch, projectViews } = useStore()
  const all = state.discrepancies
    .map((d) => {
      const project = projectViews.find((p) => p.id === d.projectId)
      const milestone = project?.milestones.find((m) => m.id === d.milestoneId)
      return { ...d, project, milestone, isLive: d.status === 'open' || d.status === 'under_review' }
    })
    .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))

  const live = all.filter((d) => d.isLive)
  const closed = all.filter((d) => !d.isLive)

  const [activeId, setActiveId] = useState(() => live[0]?.id ?? all[0]?.id)
  const [resolution, setResolution] = useState('')
  const active = all.find((d) => d.id === activeId) ?? all[0]

  if (all.length === 0) {
    return (
      <EmptyState title="No discrepancies on record">
        Every claim filed in this ward is either awaiting inspection or has been independently
        confirmed. Nothing requires an officer&rsquo;s decision.
      </EmptyState>
    )
  }

  const act = (type) => {
    if (!active || !resolution.trim()) return
    dispatch({
      type,
      payload: {
        discrepancyId: active.id,
        resolvedBy: 'Ward Officer',
        resolution: resolution.trim(),
      },
    })
    setResolution('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
      <div className="space-y-4">
        <Panel title="Needs a decision" subtitle={`${live.length} open`} className="[&>div]:p-0">
          {live.length === 0 ? (
            <p className="text-sm text-ink-muted px-5 py-4">Nothing open.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {live.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(d.id)}
                    aria-current={active?.id === d.id}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      active?.id === d.id ? 'bg-sunken' : 'hover:bg-canvas'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <StatusDot
                        tone={d.severity === 'high' ? 'flagged' : 'pending'}
                        pulse={d.severity === 'high'}
                      />
                      <span className="font-mono text-xs text-ink-muted">{d.id}</span>
                      <span className="ml-auto text-2xs text-ink-muted capitalize">{d.severity}</span>
                    </div>
                    <div className="text-sm font-medium text-ink mt-1">
                      {DISCREPANCY_KIND_META[d.kind]?.label ?? d.kind}
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">{d.project?.name}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {closed.length > 0 && (
          <Panel title="Decided" subtitle={`${closed.length} closed`} className="[&>div]:p-0">
            <ul className="divide-y divide-hairline">
              {closed.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(d.id)}
                    aria-current={active?.id === d.id}
                    className={`w-full text-left px-4 py-2.5 ${
                      active?.id === d.id ? 'bg-sunken' : 'hover:bg-canvas'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-muted">{d.id}</span>
                      <span className="ml-auto">
                        <StatusBadge
                          tone={d.status === 'resolved' ? 'verified' : 'neutral'}
                          label={DISCREPANCY_STATUS_META[d.status]?.label ?? d.status}
                          size="sm"
                        />
                      </span>
                    </div>
                    <div className="text-xs text-ink-muted mt-1">{d.project?.name}</div>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      {active && (
        <Panel
          title={DISCREPANCY_KIND_META[active.kind]?.label ?? active.kind}
          subtitle={`${active.id} · ${active.project?.name}`}
          actions={
            <StatusBadge
              tone={active.severity === 'high' ? 'flagged' : 'pending'}
              label={`${active.severity} severity`}
            />
          }
        >
          <div className="space-y-5">
            {/* The explanation, in the same four-step form used everywhere else */}
            {active.milestone && (
              <EvidenceChain milestone={active.milestone} project={active.project} />
            )}

            {active.isLive ? (
              <div className="pt-5 border-t border-hairline">
                <h3 className="text-base font-semibold text-ink mb-1">Your decision</h3>
                <p className="text-sm text-ink-muted mb-4 leading-relaxed">
                  The system has flagged a difference. It does not decide who is right — that is
                  your call, and your reason becomes part of the public record. Both outcomes are
                  legitimate: sometimes the work is genuinely short, and sometimes the
                  measurement was wrong.
                </p>
                <Textarea
                  id="resolution"
                  label="Reason for your decision (published)"
                  placeholder="e.g. Contractor directed to surface the remaining 180 m within 30 days; re-inspection scheduled."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  hint="This text appears in the citizen record. A decision cannot be recorded without one."
                />
                <div className="flex flex-wrap gap-3 mt-4">
                  <Button
                    variant="danger"
                    disabled={!resolution.trim()}
                    onClick={() => act('RESOLVE_DISCREPANCY')}
                  >
                    Uphold the finding — work is short
                  </Button>
                  <Button
                    variant="success"
                    disabled={!resolution.trim()}
                    onClick={() => act('DISMISS_DISCREPANCY')}
                  >
                    Dismiss — the measurement was wrong
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-5 border-t border-hairline">
                <h3 className="text-2xs uppercase tracking-wide text-ink-muted mb-2">
                  Decision recorded
                </h3>
                <p className="text-sm text-ink-2 leading-relaxed bg-canvas border border-hairline rounded px-4 py-3">
                  {active.resolution || 'No reason recorded.'}
                </p>
                <p className="text-xs text-ink-muted mt-2">
                  By {active.resolvedBy}
                  {active.resolvedAt &&
                    ` · ${new Date(active.resolvedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}`}
                </p>
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  )
}

function AuditTrail() {
  const { state } = useStore()
  const entries = selectAuditLog(state)
  const ROLE_TONE = { system: 'info', contractor: 'neutral', inspector: 'verified', admin: 'flagged' }

  return (
    <div className="max-w-3xl">
      <Panel
        title="Audit trail"
        subtitle={`${entries.length} entries, newest first. Entries are only ever added — nothing is edited or deleted.`}
      >
        <ol>
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex gap-4 py-3 border-b border-hairline last:border-0"
            >
              <div className="w-24 shrink-0">
                <div className="text-xs font-mono text-ink-muted">
                  {new Date(e.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </div>
                <div className="text-2xs font-mono text-ink-muted">
                  {new Date(e.at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusDot tone={ROLE_TONE[e.role] ?? 'neutral'} size="sm" />
                  <span className="text-sm font-medium text-ink capitalize">
                    {e.action.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-xs text-ink-muted">{e.subject}</span>
                </div>
                <p className="text-sm text-ink-2 mt-1 leading-relaxed">{e.note}</p>
                <div className="text-xs text-ink-muted mt-0.5">
                  {e.actor} · {e.role}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}

function ProjectDetail({ project }) {
  const { dispatch } = useStore()
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')

  const milestone = project.milestones[0]
  if (!milestone) return null
  const unit = milestone.commitment.unit === 'metre' ? 'm' : milestone.commitment.unit

  const tone =
    project.status === 'flagged'
      ? 'flagged'
      : project.status === 'verified' || project.status === 'resolved'
        ? 'verified'
        : 'pending'

  return (
    <div className="space-y-4">
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

        {/* Recording an observation from here too, for the walkthrough */}
        <div className="mt-6 pt-5 border-t border-hairline">
          <h3 className="text-sm font-semibold text-ink mb-1">
            Record an independent measurement
          </h3>
          {milestone.inspection ? (
            <Callout tone="verified" title="Already measured">
              An officer recorded {formatQuantity(milestone.inspection.observedQuantity, unit)} on
              site. Filing a new contractor claim clears this reading, because old evidence cannot
              vouch for new work.
            </Callout>
          ) : (
            <>
              <p className="text-sm text-ink-muted mb-3 leading-relaxed">
                {milestone.report
                  ? `The contractor has claimed ${formatQuantity(milestone.report.claimedQuantity, unit)}. Measure the site and enter what you actually find — the system will compare the two.`
                  : 'Nothing has been claimed against this milestone yet.'}
              </p>
              {milestone.report && (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!quantity) return
                    dispatch({
                      type: 'RECORD_INSPECTION',
                      payload: {
                        projectId: project.id,
                        milestoneId: milestone.id,
                        observedQuantity: Number(quantity),
                        inspectedBy: 'Insp. R. Karthikeyan',
                        note,
                      },
                    })
                    setQuantity('')
                    setNote('')
                  }}
                >
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
                        className="w-full bg-paper border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-status-verified focus:ring-2 focus:ring-status-verified/20"
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
                        placeholder="Where you measured from and what is physically present"
                        className="w-full bg-paper border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-status-verified focus:ring-2 focus:ring-status-verified/20"
                      />
                    </label>
                  </div>
                  <Button variant="primary" type="submit" disabled={!quantity}>
                    Record measurement and compare
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </Panel>
    </div>
  )
}

export default function AdminDashboard() {
  const { state, projectViews } = useStore()
  const summary = selectSummary(state, projectViews)
  const [view, setView] = useState('overview')
  const [selectedId, setSelectedId] = useState(
    () => projectViews.find((p) => p.status === 'flagged')?.id ?? projectViews[0]?.id
  )
  const selected = projectViews.find((p) => p.id === selectedId)

  const TABS = [
    { id: 'overview', label: 'Ward overview' },
    {
      id: 'findings',
      label: `Discrepancies${summary.openDiscrepancies ? ` (${summary.openDiscrepancies})` : ''}`,
    },
    { id: 'audit', label: 'Audit trail' },
  ]

  return (
    <div className="space-y-6">
      {/* The answer, before any detail */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">
          {summary.openDiscrepancies === 0
            ? 'No discrepancies need a decision'
            : summary.openDiscrepancies === 1
              ? 'One discrepancy needs a decision'
              : `${summary.openDiscrepancies} discrepancies need a decision`}
        </h1>
        <p className="text-sm text-ink-muted mt-1.5 max-w-3xl leading-relaxed">
          Every project below is measured against what was sanctioned. A bar stops where an
          independent inspection found the work to end — anything beyond that is a claim the
          site does not support.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric
          label="Projects tracked"
          value={summary.projects}
          detail={`${formatRupeesShort(summary.totalBudget)} sanctioned in total`}
          emphasis
        />
        <Metric
          label="Open discrepancies"
          value={summary.openDiscrepancies}
          tone={summary.openDiscrepancies > 0 ? 'flagged' : 'verified'}
          detail={
            summary.highSeverity > 0 ? `${summary.highSeverity} high severity` : 'None high severity'
          }
          emphasis
        />
        <Metric
          label="Awaiting inspection"
          value={summary.awaitingInspection}
          tone={summary.awaitingInspection > 0 ? 'pending' : 'verified'}
          detail="Claimed but unverified"
          emphasis
        />
        <Metric
          label="Fully verified"
          value={summary.verified}
          tone="verified"
          detail="Inspection matched the claim"
          emphasis
        />
      </div>

      <div className="flex items-center gap-1 border-b border-hairline">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id)}
            aria-current={view === t.id}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
              view === t.id
                ? 'border-b-ink text-ink font-semibold'
                : 'border-b-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
          <DeliveryChart
            projects={projectViews}
            selectedId={selected?.id}
            onSelect={setSelectedId}
          />
          {selected ? (
            <ProjectDetail project={selected} />
          ) : (
            <EmptyState title="No projects registered" />
          )}
        </div>
      )}

      {view === 'findings' && <FindingsQueue />}
      {view === 'audit' && <AuditTrail />}
    </div>
  )
}
