/**
 * Selectors — the bridge from raw records to view-ready values.
 *
 * This is the only place where stored evidence is turned into a status. Keeping
 * it here (rather than in components) means every screen agrees on what
 * "flagged" means, and it means status logic is testable without rendering.
 */

import {
  deriveMilestoneStatus,
  deriveProjectStatus,
  completionAgainstCommitment,
  deviations,
  reconcile,
  projectSummary,
  round3,
} from './reconcile'

/** Discrepancies attached to one milestone, newest first. */
function discrepanciesFor(discrepancies, projectId, milestoneId) {
  return discrepancies
    .filter((d) => d.projectId === projectId && d.milestoneId === milestoneId)
    .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))
}

/**
 * Enrich one milestone with everything the UI needs, computed once.
 *
 * `checks` carries the full reconciliation output — including rules that did
 * *not* breach tolerance — so a detail view can show the working, not just the
 * verdict.
 */
export function selectMilestoneView(state, project, milestone) {
  const discrepancies = discrepanciesFor(
    state.discrepancies,
    project.id,
    milestone.id
  )
  const live = discrepancies.filter((d) => d.status === 'open' || d.status === 'under_review')

  const status = deriveMilestoneStatus(discrepancies, milestone.report, milestone.inspection)
  const completion = completionAgainstCommitment(
    milestone.commitment,
    milestone.report,
    milestone.inspection
  )

  return {
    ...milestone,
    projectId: project.id,
    projectName: project.name,
    ward: project.ward,
    status,
    discrepancies,
    liveDiscrepancies: live,
    hasOpenDiscrepancy: live.length > 0,
    completion,
    checks: reconcile(milestone.commitment, milestone.report, milestone.inspection),
    deviations: deviations(milestone.commitment, milestone.report, milestone.inspection),
  }
}

/** Every milestone in the system, enriched and flattened. */
export function selectMilestoneViews(state) {
  return state.projects.flatMap((project) =>
    project.milestones.map((m) => selectMilestoneView(state, project, m))
  )
}

/** Every project, enriched with derived status and roll-up counts. */
export function selectProjectViews(state) {
  return state.projects.map((project) => {
    const milestones = project.milestones.map((m) =>
      selectMilestoneView(state, project, m)
    )
    const discrepancies = state.discrepancies.filter((d) => d.projectId === project.id)
    const live = discrepancies.filter(
      (d) => d.status === 'open' || d.status === 'under_review'
    )

    const status = deriveProjectStatus(milestones)

    // Delivery against sanction, summed across every milestone of the project.
    // This is the figure the map answers with: how much of what was paid for is
    // independently confirmed to exist on the ground.
    const sanctioned = milestones.reduce((sum, m) => sum + m.commitment.quantity, 0)
    const reported = milestones.reduce(
      (sum, m) => sum + (m.report?.claimedQuantity ?? 0),
      0
    )
    const observed = milestones.reduce(
      (sum, m) => sum + (m.inspection?.observedQuantity ?? 0),
      0
    )
    const unit = milestones[0]?.commitment.unit ?? 'each'

    const delivery = {
      sanctioned,
      reported: reported > 0 ? reported : null,
      observed: observed > 0 ? observed : null,
      // Percentages of the sanctioned total.
      reportedPercent: sanctioned ? round3((reported / sanctioned) * 100) : 0,
      observedPercent: sanctioned ? round3((observed / sanctioned) * 100) : 0,
      // Units claimed but not found on inspection — the headline shortfall.
      missingUnits: round3(Math.max(0, reported - observed)),
      // All units still unaccounted for against the sanction.
      outstandingUnits: round3(Math.max(0, sanctioned - observed)),
      unit,
      inspected: milestones.some((m) => m.inspection),
      claimed: milestones.some((m) => m.report),
    }

    const view = {
      ...project,
      milestones,
      status,
      discrepancies,
      liveDiscrepancies: live,
      hasOpenDiscrepancy: live.length > 0,
      delivery,
      counts: {
        milestones: milestones.length,
        flagged: milestones.filter((m) => m.status === 'flagged').length,
        verified: milestones.filter((m) => m.status === 'verified').length,
        resolved: milestones.filter((m) => m.status === 'resolved').length,
        awaiting: milestones.filter((m) => m.status === 'pending_inspection').length,
        open: live.length,
      },
    }

    // One plain-language sentence, written for someone who has never seen this
    // system. Computed here so every screen says the same thing.
    view.plainSummary = projectSummary(view)

    return view
  })
}

/** Aggregate figures for the dashboard stat panel. */
export function selectSummary(state, projectViews) {
  const projects = projectViews ?? selectProjectViews(state)
  const allMilestones = projects.flatMap((p) => p.milestones)
  const live = state.discrepancies.filter(
    (d) => d.status === 'open' || d.status === 'under_review'
  )

  return {
    projects: projects.length,
    flagged: projects.filter((p) => p.status === 'flagged').length,
    verified: projects.filter((p) => p.status === 'verified').length,
    awaitingInspection: allMilestones.filter((m) => m.status === 'pending_inspection').length,
    openDiscrepancies: live.length,
    highSeverity: live.filter((d) => d.severity === 'high').length,
    resolvedDiscrepancies: state.discrepancies.filter((d) => d.status === 'resolved').length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
  }
}

/** Discrepancies joined to their project and milestone, for the review queue. */
export function selectDiscrepancyViews(state, projectViews) {
  const projects = projectViews ?? selectProjectViews(state)
  const byMilestone = new Map()
  for (const p of projects) {
    for (const m of p.milestones) byMilestone.set(`${p.id}/${m.id}`, { project: p, milestone: m })
  }

  return state.discrepancies
    .map((d) => {
      const ctx = byMilestone.get(`${d.projectId}/${d.milestoneId}`) ?? {}
      return {
        ...d,
        project: ctx.project,
        milestone: ctx.milestone,
        isLive: d.status === 'open' || d.status === 'under_review',
      }
    })
    .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))
}

/** The audit trail, newest first. */
export function selectAuditLog(state) {
  return [...state.auditLog].sort((a, b) => new Date(b.at) - new Date(a.at))
}

/**
 * Which projects can a contractor still report against, and which await a
 * measurement? Used to seed sensible defaults in the two action portals, so an
 * operator does not need to know the data model to use them.
 */
export function selectWorkQueues(state, projectViews) {
  const projects = projectViews ?? selectProjectViews(state)
  const milestones = projects.flatMap((p) => p.milestones)

  return {
    awaitingReport: milestones.filter((m) => !m.report),
    awaitingInspection: milestones.filter((m) => m.report && !m.inspection),
    openDiscrepancies: selectDiscrepancyViews(state, projects).filter((d) => d.isLive),
  }
}
