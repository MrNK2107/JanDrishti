/**
 * Ward Admin — the reconciliation review surface.
 *
 * Three views over one dataset: the ward map, the discrepancy queue, and the
 * audit trail. The map is the default because the transit metaphor is the
 * product's argument: a reviewer should be able to see the state of the ward
 * before reading a single number.
 *
 * The project detail panel shows the three sources of truth side by side and
 * the reconciliation output for *every* rule — including rules that passed.
 * Showing only failures would make the system look like an accusation engine;
 * showing the working makes it auditable.
 */

import { useState } from 'react'
import { useStore } from '../store/StoreProvider'
import { selectProjectViews, selectSummary, selectAuditLog } from '../domain/selectors'
import {
  PROJECT_STATUS_META,
  DISCREPANCY_KIND_META,
  formatQuantity,
  formatRupees,
  TOLERANCE,
} from '../domain/reconcile'
import { TransitDiagram } from '../components/TransitDiagram'
import { DiscrepancyQueue } from '../components/DiscrepancyQueue'
import { Button, EmptyState, Field, Panel, ShareBar, StatusBadge, StatusDot } from '../components/ui'

function StatCard({ label, value, detail, tone = 'neutral' }) {
  const toneText =
    tone === 'flagged'
      ? 'text-status-text-flagged'
      : tone === 'verified'
        ? 'text-status-text-verified'
        : tone === 'pending'
          ? 'text-status-text-pending'
          : 'text-porcelain-100'
  return (
    <div className="bg-midnight-800 border border-midnight-700 rounded-lg px-5 py-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-porcelain-200">
        {tone !== 'neutral' && <StatusDot tone={tone} size="sm" />}
        {label}
      </div>
      <div className={`text-3xl font-semibold mt-2 ${toneText}`}>{value}</div>
      {detail && <div className="text-[11px] text-porcelain-200 mt-1">{detail}</div>}
    </div>
  )
}

function CheckRow({ check }) {
  const passed = !check.deviates
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span
        className={`mt-0.5 text-xs ${passed ? 'text-status-text-verified' : 'text-status-text-flagged'}`}
        aria-hidden="true"
      >
        {passed ? '✓' : '⚠'}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium">
          {DISCREPANCY_KIND_META[check.kind]?.label ?? check.kind}
          <span className="ml-2 font-normal text-porcelain-200">
            {passed ? 'within tolerance' : `${check.severity} severity`}
          </span>
        </div>
        <p className="text-xs text-porcelain-200 mt-0.5 leading-relaxed">{check.detail}</p>
      </div>
    </li>
  )
}

function ProjectDetail({ project }) {
  const { dispatch } = useStore()
  const milestone = project.milestones[0]
  if (!milestone) return null

  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')

  const tone =
    project.status === 'flagged'
      ? 'flagged'
      : project.status === 'verified'
        ? 'verified'
        : project.status === 'resolved'
          ? 'verified'
          : 'pending'

  return (
    <div className="space-y-4">
      <Panel
        title={project.name}
        subtitle={`${project.id} · ${project.ward} · Zone ${project.zone}`}
        actions={
          <StatusBadge
            tone={tone}
            label={project.status === 'resolved' ? 'Resolved' : PROJECT_STATUS_META[project.status]?.label ?? project.status}
          />
        }
      >
        <div className="grid grid-cols-2 gap-4 mb-5">
          <Field label="Contractor" className="col-span-2">
            {project.contractor}
          </Field>
          <Field label="Location" className="col-span-2">
            <span className="text-xs leading-relaxed">{project.location}</span>
          </Field>
          <Field label="Sanctioned budget" mono>
            {formatRupees(project.budget)}
          </Field>
          <Field label="Sanctioned on" mono>
            {project.sanctionedOn}
          </Field>
        </div>

        {/* Three sources of truth, side by side */}
        <div className="border-t border-midnight-700 pt-4">
          <h3 className="text-[10px] uppercase tracking-wider text-porcelain-200 mb-3">
            Milestone {milestone.id} — {milestone.title}
          </h3>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              {
                label: 'Approved',
                value: formatQuantity(
                  milestone.commitment.quantity,
                  milestone.commitment.unit
                ),
                sub: 'Sanctioned scope',
              },
              {
                label: 'Reported',
                value: milestone.report
                  ? formatQuantity(
                      milestone.report.claimedQuantity,
                      milestone.commitment.unit
                    )
                  : '—',
                sub: milestone.report ? milestone.report.reportedBy : 'No claim filed',
              },
              {
                label: 'Observed',
                value: milestone.inspection
                  ? formatQuantity(
                      milestone.inspection.observedQuantity,
                      milestone.commitment.unit
                    )
                  : '—',
                sub: milestone.inspection
                  ? milestone.inspection.inspectedBy
                  : 'Not yet inspected',
              },
            ].map((cell, i) => (
              <div
                key={cell.label}
                className={`rounded border px-3 py-3 ${
                  i === 2 && milestone.inspection && milestone.deviations.length > 0
                    ? 'border-status-flagged/40 bg-status-tint-flagged'
                    : 'border-midnight-700 bg-midnight-950'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider text-porcelain-200">
                  {cell.label}
                </div>
                <div className="text-lg font-mono mt-1">{cell.value}</div>
                <div className="text-[10px] text-porcelain-200 mt-1 leading-snug">
                  {cell.sub}
                </div>
              </div>
            ))}
          </div>

          <ShareBar
            label={`Physical completion against commitment (${milestone.completion.basis})`}
            percent={milestone.completion.percent}
            tone={milestone.completion.percent >= 100 ? 'verified' : 'flagged'}
          />
        </div>

        {/* Reconciliation working */}
        <div className="border-t border-midnight-700 mt-5 pt-4">
          <h3 className="text-[10px] uppercase tracking-wider text-porcelain-200 mb-1">
            Reconciliation
          </h3>
          <p className="text-[11px] text-porcelain-200 mb-2">
            Tolerances: reported ±{Math.round(TOLERANCE.reportVsApproved * 100)}% of
            approved, observed ±{Math.round(TOLERANCE.observedVsReported * 100)}% of
            reported.
          </p>
          {milestone.checks.length === 0 ? (
            <p className="text-xs text-porcelain-200 py-3">
              Nothing to reconcile yet — no claim has been filed against this milestone.
            </p>
          ) : (
            <ul className="divide-y divide-midnight-700">
              {milestone.checks.map((c, i) => (
                <CheckRow key={`${c.kind}-${i}`} check={c} />
              ))}
            </ul>
          )}
        </div>

        {milestone.discrepancies.length > 0 && (
          <div className="border-t border-midnight-700 mt-5 pt-4">
            <h3 className="text-[10px] uppercase tracking-wider text-porcelain-200 mb-3">
              Findings on record
            </h3>
            <ul className="space-y-2">
              {milestone.discrepancies.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 text-xs bg-midnight-950 border border-midnight-700 rounded px-3 py-2.5"
                >
                  <StatusDot
                    tone={d.status === 'resolved' ? 'verified' : d.status === 'dismissed' ? 'neutral' : 'flagged'}
                    size="sm"
                    pulse={d.status === 'open'}
                  />
                  <span className="font-mono text-porcelain-200">{d.id}</span>
                  <span className="truncate">{DISCREPANCY_KIND_META[d.kind]?.label ?? d.kind}</span>
                  <span className="ml-auto shrink-0">
                    <StatusBadge
                      tone={d.status === 'resolved' ? 'verified' : d.status === 'dismissed' ? 'neutral' : 'flagged'}
                      label={d.status}
                      size="sm"
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Inspector capture, reachable from the map for the walkthrough */}
        <div className="border-t border-midnight-700 mt-5 pt-4">
          <h3 className="text-[10px] uppercase tracking-wider text-porcelain-200 mb-3">
            Record an independent observation
          </h3>
          {milestone.inspection ? (
            <div className="text-xs text-porcelain-200 bg-midnight-950 border border-midnight-700 rounded px-3 py-3 leading-relaxed">
              Observed {formatQuantity(milestone.inspection.observedQuantity, milestone.commitment.unit)} by{' '}
              {milestone.inspection.inspectedBy}. Filing a new contractor claim clears this
              observation, because old evidence cannot vouch for new work.
            </div>
          ) : (
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
              <div className="grid grid-cols-[140px_1fr] gap-3 items-end">
                <label className="block">
                  <span className="block text-[10px] uppercase tracking-wider text-porcelain-200 mb-1.5">
                    Observed ({milestone.commitment.unit})
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={String(milestone.commitment.quantity)}
                    className="w-full bg-midnight-950 border border-midnight-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-status-verified"
                  />
                </label>
                <label className="block">
                  <span className="block text-[10px] uppercase tracking-wider text-porcelain-200 mb-1.5">
                    Measurement note
                  </span>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Where it was measured from, what was found"
                    className="w-full bg-midnight-950 border border-midnight-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-status-verified"
                  />
                </label>
              </div>
              <Button variant="primary" type="submit" disabled={!quantity}>
                Record observation and reconcile
              </Button>
            </form>
          )}
        </div>
      </Panel>
    </div>
  )
}

function AuditTrail() {
  const { state } = useStore()
  const entries = selectAuditLog(state)

  const ROLE_TONE = {
    system: 'pending',
    contractor: 'neutral',
    inspector: 'verified',
    admin: 'flagged',
  }

  return (
    <Panel
      title="Audit trail"
      subtitle={`${entries.length} entries · append-only`}
      className="max-w-3xl"
    >
      <ol className="space-y-0">
        {entries.map((e, i) => (
          <li key={e.id} className="flex gap-4 py-3 border-b border-midnight-700 last:border-0">
            <div className="w-32 shrink-0">
              <div className="text-[11px] font-mono text-porcelain-200">
                {new Date(e.at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                })}
              </div>
              <div className="text-[10px] text-porcelain-200/70 font-mono">
                {new Date(e.at).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusDot tone={ROLE_TONE[e.role] ?? 'neutral'} size="sm" />
                <span className="text-xs font-medium">{e.action.replace(/_/g, ' ')}</span>
                <span className="text-[10px] font-mono text-porcelain-200">{e.subject}</span>
              </div>
              <p className="text-xs text-porcelain-200 mt-1 leading-relaxed">{e.note}</p>
              <div className="text-[10px] text-porcelain-200/70 mt-0.5">
                {e.actor} · {e.role}
              </div>
            </div>
            <div className="text-[10px] font-mono text-porcelain-200/50 shrink-0">
              #{entries.length - i}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

export default function AdminDashboard() {
  const { state, projectViews } = useStore()
  const summary = selectSummary(state, projectViews)
  const [view, setView] = useState('map')
  const [selectedId, setSelectedId] = useState(
    () => projectViews.find((p) => p.status === 'flagged')?.id ?? projectViews[0]?.id
  )

  const selected = projectViews.find((p) => p.id === selectedId) ?? projectViews[0]

  const TABS = [
    { id: 'map', label: 'Ward Map' },
    { id: 'queue', label: `Findings${summary.openDiscrepancies ? ` (${summary.openDiscrepancies})` : ''}` },
    { id: 'audit', label: 'Audit Trail' },
  ]

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Projects tracked"
          value={summary.projects}
          detail={formatRupees(summary.totalBudget) + ' sanctioned'}
        />
        <StatCard
          label="Open findings"
          value={summary.openDiscrepancies}
          tone={summary.openDiscrepancies > 0 ? 'flagged' : 'verified'}
          detail={
            summary.highSeverity > 0
              ? `${summary.highSeverity} high severity`
              : 'None at high severity'
          }
        />
        <StatCard
          label="Awaiting inspection"
          value={summary.awaitingInspection}
          tone={summary.awaitingInspection > 0 ? 'pending' : 'verified'}
          detail="Claims filed without an observation"
        />
        <StatCard
          label="Verified"
          value={summary.verified}
          tone="verified"
          detail="Claim matched independent observation"
        />
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 border-b border-midnight-700">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id)}
            aria-current={view === t.id}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
              view === t.id
                ? 'border-b-status-flagged text-porcelain-100 font-medium'
                : 'border-b-transparent text-porcelain-200 hover:text-porcelain-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'map' && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-5 items-start">
          <div className="space-y-4">
            <TransitDiagram
              projects={projectViews}
              selectedId={selected?.id}
              onSelect={setSelectedId}
            />
            <Panel title="Ward register" className="[&>div]:p-0">
              <ul className="divide-y divide-midnight-700">
                {projectViews.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors ${
                        selected?.id === p.id ? 'bg-midnight-950' : 'hover:bg-midnight-950/60'
                      }`}
                    >
                      <StatusDot
                        tone={
                          p.status === 'flagged'
                            ? 'flagged'
                            : p.status === 'verified' || p.status === 'resolved'
                              ? 'verified'
                              : 'pending'
                        }
                        pulse={p.status === 'flagged'}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-[11px] text-porcelain-200 font-mono">
                          {p.id} · {p.contractor}
                        </div>
                      </div>
                      <div className="ml-auto shrink-0 text-right">
                        <StatusBadge
                          tone={
                            p.status === 'flagged'
                              ? 'flagged'
                              : p.status === 'verified' || p.status === 'resolved'
                                ? 'verified'
                                : 'pending'
                          }
                          label={PROJECT_STATUS_META[p.status]?.label ?? p.status}
                          size="sm"
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          {selected ? (
            <ProjectDetail project={selected} />
          ) : (
            <EmptyState title="No projects registered" />
          )}
        </div>
      )}

      {view === 'queue' && <DiscrepancyQueue onOpenProject={(id) => { setSelectedId(id); setView('map') }} />}
      {view === 'audit' && <AuditTrail />}
    </div>
  )
}
