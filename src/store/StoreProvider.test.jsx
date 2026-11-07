import { describe, it, expect } from 'vitest'
import { reducer } from './StoreProvider'
import { createSeedState } from '../domain/seed'
import { selectProjectViews, selectMilestoneViews, selectSummary } from '../domain/selectors'

const fresh = () => createSeedState()

const saidapet = (state) => state.projects.find((p) => p.id === 'JDT-2026-0152')
const saidapetMs = (state) => saidapet(state).milestones[0]

describe('seed state', () => {
  it('opens with the T Nagar case already flagged', () => {
    const views = selectProjectViews(fresh())
    const tNagar = views.find((p) => p.id === 'JDT-2026-0143')

    expect(tNagar.status).toBe('flagged')
    expect(tNagar.counts.open).toBe(1)
  })

  it('opens with one project verified', () => {
    const views = selectProjectViews(fresh())
    const annaNagar = views.find((p) => p.id === 'JDT-2026-0138')

    expect(annaNagar.status).toBe('verified')
    expect(annaNagar.counts.verified).toBe(1)
  })

  it('opens with one project awaiting inspection — the live walkthrough entry', () => {
    const views = selectProjectViews(fresh())
    const s = views.find((p) => p.id === 'JDT-2026-0152')

    expect(s.status).toBe('pending_inspection')
    expect(s.milestones[0].report).toBeTruthy()
    expect(s.milestones[0].inspection).toBeNull()
  })

  it('does not treat the untouched claim shortage as a discrepancy', () => {
    // Saidapet has a claim and no inspection. That is pending, not flagged.
    const state = fresh()
    const dsc = state.discrepancies.filter((d) => d.projectId === 'JDT-2026-0152')
    expect(dsc).toHaveLength(0)
  })
})

describe('RECORD_INSPECTION — the loop closes', () => {
  it('opens a high-severity discrepancy when an inspection contradicts the claim', () => {
    // Saidapet: contractor claimed 200m; inspector finds 90m.
    let state = fresh()
    state = reducer(state, {
      type: 'RECORD_INSPECTION',
      payload: {
        projectId: 'JDT-2026-0152',
        milestoneId: 'MS-1',
        observedQuantity: 90,
        inspectedBy: 'Insp. R. Karthikeyan',
        note: 'Approach partially surfaced only.',
      },
    })

    const opened = state.discrepancies.filter((d) => d.projectId === 'JDT-2026-0152')
    expect(opened).toHaveLength(1)
    expect(opened[0].kind).toBe('quantity_shortfall')
    expect(opened[0].severity).toBe('high')
    expect(opened[0].status).toBe('open')
  })

  it('moves the project from pending_inspection to flagged as a result', () => {
    let state = fresh()
    const before = selectProjectViews(state).find((p) => p.id === 'JDT-2026-0152')
    expect(before.status).toBe('pending_inspection')

    state = reducer(state, {
      type: 'RECORD_INSPECTION',
      payload: {
        projectId: 'JDT-2026-0152',
        milestoneId: 'MS-1',
        observedQuantity: 90,
        inspectedBy: 'Insp. R. Karthikeyan',
      },
    })

    const after = selectProjectViews(state).find((p) => p.id === 'JDT-2026-0152')
    expect(after.status).toBe('flagged')
  })

  it('does NOT open a discrepancy when observation matches the claim', () => {
    let state = fresh()
    state = reducer(state, {
      type: 'RECORD_INSPECTION',
      payload: {
        projectId: 'JDT-2026-0152',
        milestoneId: 'MS-1',
        observedQuantity: 200,
        inspectedBy: 'Insp. R. Karthikeyan',
      },
    })

    const opened = state.discrepancies.filter((d) => d.projectId === 'JDT-2026-0152')
    expect(opened).toHaveLength(0)

    const after = selectProjectViews(state).find((p) => p.id === 'JDT-2026-0152')
    expect(after.status).toBe('verified')
  })

  it('opens the discrepancy with an explanation carrying both numbers', () => {
    let state = fresh()
    state = reducer(state, {
      type: 'RECORD_INSPECTION',
      payload: {
        projectId: 'JDT-2026-0152',
        milestoneId: 'MS-1',
        observedQuantity: 90,
        inspectedBy: 'Insp. R. Karthikeyan',
      },
    })

    const d = state.discrepancies.find((x) => x.projectId === 'JDT-2026-0152')
    expect(d.detail).toContain('200')
    expect(d.detail).toContain('90')
  })

  it('writes an audit entry for the inspection and for the opening', () => {
    let state = fresh()
    const before = state.auditLog.length

    state = reducer(state, {
      type: 'RECORD_INSPECTION',
      payload: {
        projectId: 'JDT-2026-0152',
        milestoneId: 'MS-1',
        observedQuantity: 90,
        inspectedBy: 'Insp. R. Karthikeyan',
      },
    })

    // one for the inspection, one for the opened discrepancy
    expect(state.auditLog.length).toBe(before + 2)
    expect(state.auditLog.some((a) => a.action === 'inspection_recorded')).toBe(true)
    expect(state.auditLog.some((a) => a.action === 'discrepancy_opened')).toBe(true)
  })

  it('does not mutate the previous state object', () => {
    const state = fresh()
    const snapshot = JSON.stringify(state)

    reducer(state, {
      type: 'RECORD_INSPECTION',
      payload: {
        projectId: 'JDT-2026-0152',
        milestoneId: 'MS-1',
        observedQuantity: 90,
        inspectedBy: 'Insp. R. Karthikeyan',
      },
    })

    expect(JSON.stringify(state)).toBe(snapshot)
  })
})

describe('REPORT_MILESTONE', () => {
  it('stores the claim and marks the milestone awaiting inspection', () => {
    // Clear the existing Saidapet claim first by reporting again.
    let state = fresh()
    state = reducer(state, {
      type: 'REPORT_MILESTONE',
      payload: {
        projectId: 'JDT-2026-0152',
        milestoneId: 'MS-1',
        claimedQuantity: 180,
        reportedBy: 'Sri Balaji Infra',
        note: 'Revised claim.',
      },
    })

    expect(saidapetMs(state).report.claimedQuantity).toBe(180)

    const view = selectMilestoneViews(state).find(
      (m) => m.projectId === 'JDT-2026-0152'
    )
    expect(view.status).toBe('pending_inspection')
  })

  it('discards a stale inspection when a new claim is filed', () => {
    // A new claim invalidates the old observation: old evidence must not
    // silently vouch for new work.
    let state = fresh()
    state = reducer(state, {
      type: 'RECORD_INSPECTION',
      payload: {
        projectId: 'JDT-2026-0143',
        milestoneId: 'MS-1',
        observedQuantity: 320,
        inspectedBy: 'Insp. R. Karthikeyan',
      },
    })
    expect(saidapetMs(state)).toBeTruthy()

    const tNagarMs = state.projects.find((p) => p.id === 'JDT-2026-0143').milestones[0]
    expect(tNagarMs.inspection).toBeTruthy()

    state = reducer(state, {
      type: 'REPORT_MILESTONE',
      payload: {
        projectId: 'JDT-2026-0143',
        milestoneId: 'MS-1',
        claimedQuantity: 500,
        reportedBy: 'Sri Venkatesh Constructions',
      },
    })

    const after = state.projects.find((p) => p.id === 'JDT-2026-0143').milestones[0]
    expect(after.inspection).toBeNull()
  })

  it('carries contractor identity into the claim record', () => {
    let state = fresh()
    state = reducer(state, {
      type: 'REPORT_MILESTONE',
      payload: {
        projectId: 'JDT-2026-0152',
        milestoneId: 'MS-1',
        claimedQuantity: 150,
        reportedBy: 'Sri Balaji Infra',
      },
    })

    expect(saidapetMs(state).report.reportedBy).toBe('Sri Balaji Infra')
  })
})

describe('resolution lifecycle', () => {
  const flagged = () => fresh()

  it('acknowledging moves a discrepancy under review', () => {
    let state = reducer(flagged(), {
      type: 'ACKNOWLEDGE_DISCREPANCY',
      payload: { discrepancyId: 'DSC-0001', actor: 'Ward Officer' },
    })

    expect(state.discrepancies[0].status).toBe('under_review')
  })

  it('resolving sets the resolution, the actor, and the timestamp', () => {
    let state = reducer(flagged(), {
      type: 'RESOLVE_DISCREPANCY',
      payload: {
        discrepancyId: 'DSC-0001',
        resolvedBy: 'Ward Officer',
        resolution: 'Contractor to complete remaining 180m within 30 days.',
      },
    })

    const d = state.discrepancies[0]
    expect(d.status).toBe('resolved')
    expect(d.resolvedBy).toBe('Ward Officer')
    expect(d.resolvedAt).toBeTruthy()
    expect(d.resolution).toContain('180m')
  })

  it('resolving clears the flag on the project', () => {
    let state = reducer(flagged(), {
      type: 'RESOLVE_DISCREPANCY',
      payload: {
        discrepancyId: 'DSC-0001',
        resolvedBy: 'Ward Officer',
        resolution: 'Rework ordered.',
      },
    })

    const view = selectProjectViews(state).find((p) => p.id === 'JDT-2026-0143')
    expect(view.status).toBe('resolved')
    expect(view.counts.open).toBe(0)
  })

  it('dismissing also clears the flag but records a different status', () => {
    let state = reducer(flagged(), {
      type: 'DISMISS_DISCREPANCY',
      payload: {
        discrepancyId: 'DSC-0001',
        resolvedBy: 'Ward Officer',
        resolution: 'Measurement dispute resolved in contractor favour.',
      },
    })

    const view = selectProjectViews(state).find((p) => p.id === 'JDT-2026-0143')
    expect(view.status).toBe('verified')
    expect(state.discrepancies[0].status).toBe('dismissed')
  })

  it('does not double-open a discrepancy of the same kind on re-inspection', () => {
    let state = fresh()
    const payload = {
      projectId: 'JDT-2026-0143',
      milestoneId: 'MS-1',
      observedQuantity: 320,
      inspectedBy: 'Insp. R. Karthikeyan',
    }
    state = reducer(state, { type: 'RECORD_INSPECTION', payload })
    state = reducer(state, { type: 'RECORD_INSPECTION', payload })

    const dsc = state.discrepancies.filter((d) => d.projectId === 'JDT-2026-0143')
    expect(dsc).toHaveLength(1)
  })

  /**
   * Regression: milestone ids are only unique *within* a project — every
   * project in the seed has an `MS-1`. An earlier version of the duplicate
   * check compared on milestoneId alone, so T Nagar's open shortfall silently
   * suppressed a brand-new shortfall on Saidapet. A finding that never opens
   * is indistinguishable from one that was never warranted, which defeats the
   * entire product.
   */
  it('opens a discrepancy even when another project has the same milestone id', () => {
    let state = fresh()

    // T Nagar (JDT-2026-0143) already carries an open quantity_shortfall on MS-1.
    const seeded = state.discrepancies.filter((d) => d.kind === 'quantity_shortfall')
    expect(seeded).toHaveLength(1)
    expect(seeded[0].projectId).toBe('JDT-2026-0143')
    expect(seeded[0].milestoneId).toBe('MS-1')

    // Saidapet's milestone is also called MS-1. Its own shortfall must open.
    state = reducer(state, {
      type: 'RECORD_INSPECTION',
      payload: {
        projectId: 'JDT-2026-0152',
        milestoneId: 'MS-1',
        observedQuantity: 90,
        inspectedBy: 'Insp. R. Karthikeyan',
      },
    })

    const saidapetDsc = state.discrepancies.filter(
      (d) => d.projectId === 'JDT-2026-0152' && d.milestoneId === 'MS-1'
    )
    expect(saidapetDsc).toHaveLength(1)
    expect(saidapetDsc[0].kind).toBe('quantity_shortfall')
    expect(saidapetDsc[0].severity).toBe('high')

    // And T Nagar's original finding must be untouched.
    const tNagarDsc = state.discrepancies.filter((d) => d.projectId === 'JDT-2026-0143')
    expect(tNagarDsc).toHaveLength(1)
    expect(tNagarDsc[0].status).toBe('open')
  })
})

describe('RESET_DEMO', () => {
  it('returns the store to its seeded state', () => {
    let state = reducer(fresh(), {
      type: 'RESOLVE_DISCREPANCY',
      payload: { discrepancyId: 'DSC-0001', resolvedBy: 'X', resolution: 'Y' },
    })
    expect(state.discrepancies[0].status).toBe('resolved')

    state = reducer(state, { type: 'RESET_DEMO' })
    expect(state.discrepancies[0].status).toBe('open')
  })

  it('is deterministic — two resets produce identical state', () => {
    const a = reducer(fresh(), { type: 'RESET_DEMO' })
    const b = reducer(fresh(), { type: 'RESET_DEMO' })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

describe('audit trail integrity', () => {
  it('never loses history — entries are only appended', () => {
    let state = fresh()
    const initial = state.auditLog.length

    state = reducer(state, {
      type: 'RECORD_INSPECTION',
      payload: {
        projectId: 'JDT-2026-0152',
        milestoneId: 'MS-1',
        observedQuantity: 90,
        inspectedBy: 'Insp. R. Karthikeyan',
      },
    })
    state = reducer(state, {
      type: 'RESOLVE_DISCREPANCY',
      payload: { discrepancyId: 'DSC-0002', resolvedBy: 'Ward Officer', resolution: 'Fixed.' },
    })

    expect(state.auditLog.length).toBeGreaterThan(initial)
    expect(state.auditLog.slice(0, initial)).toEqual(fresh().auditLog)
  })

  it('assigns unique audit ids', () => {
    const state = fresh()
    const ids = state.auditLog.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('summary figures', () => {
  it('counts the seeded state correctly', () => {
    const state = fresh()
    const s = selectSummary(state, selectProjectViews(state))

    expect(s.projects).toBe(3)
    expect(s.flagged).toBe(1)
    expect(s.verified).toBe(1)
    expect(s.awaitingInspection).toBe(1)
    expect(s.openDiscrepancies).toBe(1)
    expect(s.highSeverity).toBe(1)
    expect(s.totalBudget).toBe(800000 + 350000 + 520000)
  })

  it('reflects a resolution in the counts', () => {
    let state = fresh()
    state = reducer(state, {
      type: 'RESOLVE_DISCREPANCY',
      payload: { discrepancyId: 'DSC-0001', resolvedBy: 'Ward Officer', resolution: 'Done.' },
    })
    const s = selectSummary(state, selectProjectViews(state))

    expect(s.openDiscrepancies).toBe(0)
    expect(s.resolvedDiscrepancies).toBe(1)
    expect(s.flagged).toBe(0)
  })
})
