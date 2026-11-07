import { describe, it, expect } from 'vitest'
import { deliveryProgress, projectSummary, formatRupeesShort } from './reconcile'

const commitment = { quantity: 500, unit: 'metre' }

const report = (q) => ({
  claimedQuantity: q,
  reportedAt: '2026-11-04T09:00:00+05:30',
  reportedBy: 'Sri Venkatesh Constructions',
  evidenceLabel: 'site.jpg',
})

const inspection = (q) => ({
  observedQuantity: q,
  inspectedAt: '2026-11-05T09:00:00+05:30',
  inspectedBy: 'Insp. R. Karthikeyan',
})

describe('deliveryProgress — the question the chart answers', () => {
  it('reports a 500 sanctioned / 500 claimed / 320 observed shortfall', () => {
    const d = deliveryProgress(commitment, report(500), inspection(320))

    expect(d.sanctioned).toBe(500)
    expect(d.reported).toBe(500)
    expect(d.observed).toBe(320)
    expect(d.observedPercent).toBeCloseTo(64, 1)
    expect(d.reportedPercent).toBeCloseTo(100, 1)
    expect(d.shortfallUnits).toBe(180)
    expect(d.gapPercent).toBeCloseTo(36, 1)
  })

  it('states the shortfall in plain language a non-expert can read', () => {
    const d = deliveryProgress(commitment, report(500), inspection(320))
    expect(d.plain).toContain('Short by 180 m')
    expect(d.plain).toContain('500 m')
    expect(d.plain).toContain('320 m')
  })

  it('calls an unscaled milestone a claim, not a result', () => {
    const d = deliveryProgress(commitment, report(500), null)
    expect(d.basis).toBe('reported')
    expect(d.plain).toMatch(/claim, not a verified result/)
  })

  it('says so plainly when nothing has been reported', () => {
    const d = deliveryProgress(commitment, null, null)
    expect(d.basis).toBe('none')
    expect(d.plain).toMatch(/Nothing reported yet/)
    expect(d.observedPercent).toBeNull()
  })

  it('describes full delivery when the two figures agree', () => {
    const d = deliveryProgress(commitment, report(500), inspection(500))
    expect(d.shortfallUnits).toBe(0)
    expect(d.plain).toMatch(/Fully delivered/)
  })

  it('signs the shortfall: negative means more was found than claimed', () => {
    const d = deliveryProgress(commitment, report(500), inspection(560))
    // Signed deliberately. A consumer that wants only shortfalls tests for > 0;
    // one that wants to report an overrun reads the negative value.
    expect(d.shortfallUnits).toBe(-60)
    expect(d.plain).toMatch(/more than sanctioned/)
  })

  it('computes the gap only when both figures exist', () => {
    expect(deliveryProgress(commitment, report(500), null).gapPercent).toBeNull()
    expect(deliveryProgress(commitment, report(500), inspection(320)).gapPercent).toBeCloseTo(36, 1)
  })

  it('never divides by zero on a zero sanction', () => {
    const d = deliveryProgress({ quantity: 0, unit: 'each' }, report(0), inspection(0))
    expect(d.observedPercent).toBe(0)
    expect(Number.isNaN(d.observedPercent)).toBe(false)
  })

  it('is pure — identical input gives identical output', () => {
    const a = deliveryProgress(commitment, report(500), inspection(320))
    const b = deliveryProgress(commitment, report(500), inspection(320))
    expect(a).toEqual(b)
  })
})

describe('projectSummary — one sentence per state', () => {
  const base = { name: 'T Nagar Main Road Resurfacing', milestones: [], discrepancies: [] }
  const ms = (c, r, i) => ({
    commitment: c,
    report: r,
    inspection: i,
  })

  it('explains a flagged project with the shortfall figures included', () => {
    const s = projectSummary({
      ...base,
      status: 'flagged',
      milestones: [ms(commitment, report(500), inspection(320))],
      discrepancies: [{ status: 'open', severity: 'high' }],
    })
    expect(s).toContain('significant discrepancy open')
    expect(s).toContain('Short by 180 m')
  })

  it('explains that an uninspected claim is unverified, not approved', () => {
    const s = projectSummary({ ...base, status: 'pending_inspection' })
    expect(s).toMatch(/not yet independently inspected/)
    expect(s).toMatch(/unverified/)
  })

  it('distinguishes a resolved project from a never-flagged one', () => {
    const resolved = projectSummary({ ...base, status: 'resolved' })
    const verified = projectSummary({ ...base, status: 'verified' })
    expect(resolved).toMatch(/has since been resolved/)
    expect(verified).toMatch(/is verified/)
    expect(resolved).not.toBe(verified)
  })

  it('explains a registered project with nothing reported', () => {
    expect(projectSummary({ ...base, status: 'registered' })).toMatch(/no progress reported yet/)
  })

  it('handles a flagged project that is not a quantity problem', () => {
    const s = projectSummary({
      ...base,
      status: 'flagged',
      discrepancies: [{ status: 'open', severity: 'low' }],
    })
    expect(s).toContain('a discrepancy open')
    expect(s).not.toContain('significant')
  })
})

describe('formatRupeesShort — readable chart labels', () => {
  it('uses lakh for the seeded budget scale', () => {
    expect(formatRupeesShort(800000)).toBe('₹8L')
  })

  it('uses crore above a crore', () => {
    expect(formatRupeesShort(25000000)).toBe('₹2.5Cr')
  })

  it('falls back to thousands below a lakh', () => {
    expect(formatRupeesShort(45000)).toBe('₹45K')
  })
})
