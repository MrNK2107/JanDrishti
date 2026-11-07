import { describe, it, expect } from 'vitest'
import {
  reconcile,
  deviations,
  deriveMilestoneStatus,
  deriveProjectStatus,
  completionAgainstCommitment,
  formatQuantity,
  formatRupees,
  round3,
  TOLERANCE,
} from './reconcile'

const commitment = { quantity: 500, unit: 'metre' }

const report = (claimedQuantity, extra = {}) => ({
  id: 'RPT-X',
  claimedQuantity,
  reportedAt: '2026-11-04T09:00:00+05:30',
  reportedBy: 'Test Contractor',
  ...extra,
})

const inspection = (observedQuantity, extra = {}) => ({
  id: 'INS-X',
  observedQuantity,
  inspectedAt: '2026-11-05T09:00:00+05:30',
  inspectedBy: 'Insp. Test',
  ...extra,
})

describe('reconcile — the case the product exists for', () => {
  it('flags a 500m claim against a 320m observation as a high-severity shortfall', () => {
    const checks = reconcile(commitment, report(500), inspection(320))

    const shortfall = checks.find((c) => c.kind === 'quantity_shortfall' && c.observedVariance !== null)
    expect(shortfall).toBeDefined()
    expect(shortfall.deviates).toBe(true)
    expect(shortfall.severity).toBe('high')
  })

  it('computes the observed variance as -36%, not merely "flagged"', () => {
    const checks = reconcile(commitment, report(500), inspection(320))
    const shortfall = checks.find((c) => c.observedVariance !== null)

    // 320 vs 500 claimed = -0.36
    expect(shortfall.observedVariance).toBeCloseTo(-0.36, 5)
  })

  it('reports the numbers in the explanation so the flag is auditable', () => {
    const checks = reconcile(commitment, report(500), inspection(320))
    const shortfall = checks.find((c) => c.observedVariance !== null)

    expect(shortfall.detail).toContain('500')
    expect(shortfall.detail).toContain('320')
    expect(shortfall.detail).toContain('-36%')
  })
})

describe('reconcile — agreement is not flagged', () => {
  it('does not flag an observation within tolerance of the claim', () => {
    // 119 observed vs 120 claimed = -0.83%, inside the 5% window
    const c = { quantity: 120, unit: 'metre' }
    const result = deviations(c, report(120), inspection(119))
    const observedRule = result.filter((d) => d.observedVariance !== null)

    expect(observedRule).toHaveLength(0)
  })

  it('treats exactly-at-tolerance as acceptable', () => {
    // exactly 5% below claim is not *beyond* tolerance
    const c = { quantity: 100, unit: 'metre' }
    const result = deviations(c, report(100), inspection(95)).filter(
      (d) => d.observedVariance !== null
    )
    expect(result).toHaveLength(0)
  })

  it('flags just past the tolerance boundary', () => {
    const c = { quantity: 100, unit: 'metre' }
    const result = deviations(c, report(100), inspection(94.9)).filter(
      (d) => d.observedVariance !== null
    )
    expect(result).toHaveLength(1)
  })
})

describe('reconcile — silence is not verification', () => {
  it('flags a claim with no independent observation', () => {
    const checks = reconcile(commitment, report(500), null)
    const noObs = checks.find((c) => c.kind === 'no_observation')

    expect(noObs).toBeDefined()
    expect(noObs.deviates).toBe(true)
    expect(noObs.severity).toBe('medium')
  })

  it('does not flag absence of observation when there is no claim either', () => {
    // Nothing has happened on this milestone yet — not a discrepancy.
    const checks = reconcile(commitment, null, null)
    expect(checks).toHaveLength(0)
  })
})

describe('reconcile — duplicate evidence', () => {
  it('flags identical evidence hashes on both records as high severity', () => {
    const shared = { evidenceHash: 'sha256:deadbeef' }
    const checks = reconcile(
      commitment,
      report(500, shared),
      inspection(500, shared)
    )
    const dup = checks.find((c) => c.kind === 'duplicate_evidence')

    expect(dup).toBeDefined()
    expect(dup.severity).toBe('high')
    expect(dup.deviates).toBe(true)
  })

  it('does not flag distinct evidence hashes', () => {
    const checks = reconcile(
      commitment,
      report(500, { evidenceHash: 'sha256:aaaa' }),
      inspection(500, { evidenceHash: 'sha256:bbbb' })
    )
    expect(checks.find((c) => c.kind === 'duplicate_evidence')).toBeUndefined()
  })
})

describe('reconcile — purity and determinism', () => {
  it('returns identical output for identical input', () => {
    const a = reconcile(commitment, report(500), inspection(320))
    const b = reconcile(commitment, report(500), inspection(320))
    expect(a).toEqual(b)
  })

  it('does not mutate its arguments', () => {
    const c = { quantity: 500, unit: 'metre' }
    const r = report(500)
    const i = inspection(320)
    const snapshot = JSON.stringify({ c, r, i })

    reconcile(c, r, i)

    expect(JSON.stringify({ c, r, i })).toBe(snapshot)
  })
})

describe('deriveMilestoneStatus', () => {
  it('is flagged when a high-severity discrepancy is open', () => {
    const d = [{ severity: 'high', status: 'open' }]
    expect(deriveMilestoneStatus(d, report(500), inspection(320))).toBe('flagged')
  })

  it('is pending_inspection when reported but not inspected', () => {
    expect(deriveMilestoneStatus([], report(500), null)).toBe('pending_inspection')
  })

  it('is registered when nothing has been reported', () => {
    expect(deriveMilestoneStatus([], null, null)).toBe('registered')
  })

  it('is verified when claimed, observed, and clean', () => {
    expect(deriveMilestoneStatus([], report(120), inspection(119))).toBe('verified')
  })

  it('is resolved once the only discrepancy has been closed', () => {
    const d = [{ severity: 'high', status: 'resolved' }]
    expect(deriveMilestoneStatus(d, report(500), inspection(320))).toBe('resolved')
  })

  it('does not let a dismissed discrepancy keep a milestone flagged', () => {
    const d = [{ severity: 'high', status: 'dismissed' }]
    expect(deriveMilestoneStatus(d, report(500), inspection(320))).toBe('verified')
  })
})

describe('deriveProjectStatus', () => {
  it('lets one flagged milestone flag the whole project', () => {
    const milestones = [
      { status: 'verified' },
      { status: 'verified' },
      { status: 'flagged' },
    ]
    expect(deriveProjectStatus(milestones)).toBe('flagged')
  })

  it('is verified only when every milestone is clean', () => {
    expect(deriveProjectStatus([{ status: 'verified' }, { status: 'verified' }])).toBe(
      'verified'
    )
  })

  it('distinguishes a resolved project from a never-flagged one', () => {
    // Both are clean *now*, but only one carries a history worth finding.
    expect(deriveProjectStatus([{ status: 'verified' }, { status: 'resolved' }])).toBe(
      'resolved'
    )
  })

  it('prefers verified when nothing was ever flagged', () => {
    expect(deriveProjectStatus([{ status: 'verified' }])).toBe('verified')
  })

  it('is registered for a project with no milestones', () => {
    expect(deriveProjectStatus([])).toBe('registered')
  })
})

describe('completionAgainstCommitment', () => {
  it('prefers independent observation over the contractor claim', () => {
    const result = completionAgainstCommitment(commitment, report(500), inspection(320))

    expect(result.basis).toBe('observed')
    expect(result.attested).toBe(320)
    expect(result.percent).toBeCloseTo(64, 1)
  })

  it('falls back to the claim and says so when uninspected', () => {
    const result = completionAgainstCommitment(commitment, report(400), null)

    expect(result.basis).toBe('reported')
    expect(result.percent).toBeCloseTo(80, 1)
  })

  it('reports no basis when nothing is on record', () => {
    const result = completionAgainstCommitment(commitment, null, null)
    expect(result.basis).toBe('none')
    expect(result.percent).toBe(0)
  })
})

describe('formatting', () => {
  it('formats quantities with their unit label', () => {
    expect(formatQuantity(500, 'metre')).toBe('500 m')
  })

  it('uses Indian digit grouping for rupee amounts', () => {
    // 8 lakh groups as 8,00,000 in the Indian system, not 800,000
    expect(formatRupees(800000)).toBe('₹8,00,000')
  })

  it('rounds to 3 decimal places to keep float noise out of output', () => {
    expect(round3(0.1 + 0.2)).toBe(0.3)
  })
})

describe('tolerance policy', () => {
  it('exposes tolerances as inspectable policy rather than magic numbers', () => {
    expect(TOLERANCE.observedVsReported).toBe(0.05)
    expect(Object.isFrozen(TOLERANCE)).toBe(true)
  })
})
