import { describe, it, expect, beforeEach } from 'vitest'
import { mockBackend, resetMockDatabase } from './mockBackend'
import { api } from './client'
import { createSeedState } from '../domain/seed'
import { deviations } from '../domain/reconcile'

/**
 * The backend owns the records now, so these tests target the backend rather
 * than a reducer. The reconciliation logic itself is covered in
 * `src/domain/reconcile.test.js`; what is exercised here is the contract the
 * frontend depends on: auth, validation, persistence, and the rule that a
 * discrepancy can only be opened by an independent observation.
 */

const seed = () => createSeedState()
const projectOf = (state, id) => state.projects.find((p) => p.id === id)
const msOf = (state, id) => projectOf(state, id).milestones[0]

async function signIn(role) {
  const email = {
    officer: 'officer@jandrishti.in',
    inspector: 'inspector@jandrishti.in',
    contractor: 'contractor@jandrishti.in',
  }[role]
  return api.login({ email, password: 'ward12' })
}

beforeEach(() => {
  resetMockDatabase()
  localStorage.clear()
  sessionStorage.clear()
})

describe('seed shape', () => {
  it('carries the T Nagar case already flagged in the seed data', () => {
    const s = seed()
    expect(msOf(s, 'JDT-2026-0143').report.claimedQuantity).toBe(500)
    expect(msOf(s, 'JDT-2026-0143').inspection.observedQuantity).toBe(320)
    expect(s.discrepancies).toHaveLength(1)
  })

  it('produces the high-severity shortfall the product exists to catch', () => {
    const s = seed()
    const m = msOf(s, 'JDT-2026-0143')
    const d = deviations(m.commitment, m.report, m.inspection)
    const q = d.find((x) => x.observedVariance !== null)

    expect(q.deviates).toBe(true)
    expect(q.severity).toBe('high')
    expect(q.observedVariance).toBeCloseTo(-0.36, 5)
  })
})

describe('authentication', () => {
  it('rejects an unknown account with the same message as a wrong password', async () => {
    const unknown = await api
      .login({ email: 'nobody@example.com', password: 'whatever' })
      .catch((e) => e)
    const wrongPw = await api
      .login({ email: 'officer@jandrishti.in', password: 'nope' })
      .catch((e) => e)

    expect(unknown.status).toBe(401)
    expect(wrongPw.status).toBe(401)
    // Identical wording: do not reveal which accounts exist.
    expect(unknown.message).toBe(wrongPw.message)
  })

  it('signs in a seeded ward account and returns the public user shape', async () => {
    const { user } = await signIn('officer')
    expect(user.role).toBe('officer')
    expect(user.name).toBe('R. Karthikeyan')
    // The credential material must never cross the boundary.
    expect(user.passwordHash).toBeUndefined()
    expect(user.salt).toBeUndefined()
  })

  it('signs up, hashes the password, and logs the new user straight in', async () => {
    const { user } = await api.signup({
      name: 'New Inspector',
      email: 'new.inspector@jandrishti.in',
      password: 'secret123',
      role: 'inspector',
    })

    expect(user.role).toBe('inspector')
    const { user: restored } = await api.me()
    expect(restored.email).toBe('new.inspector@jandrishti.in')
  })

  it('validates signup input and returns field-level detail', async () => {
    const err = await api
      .signup({ name: 'X', email: 'not-an-email', password: '123', role: 'wizard' })
      .catch((e) => e)

    expect(err.status).toBe(400)
    expect(err.details.name).toBeTruthy()
    expect(err.details.email).toBeTruthy()
    expect(err.details.password).toBeTruthy()
    expect(err.details.role).toBeTruthy()
  })

  it('refuses a duplicate email', async () => {
    const err = await api
      .signup({
        name: 'Copy',
        email: 'officer@jandrishti.in',
        password: 'ward12',
        role: 'officer',
      })
      .catch((e) => e)

    expect(err.status).toBe(409)
  })

  it('returns a null user rather than throwing when there is no session', async () => {
    const { user } = await api.me()
    expect(user).toBeNull()
  })

  /**
   * Regression. `me()` used to clear the stored token whenever it could not
   * resolve a session. Under React 18 StrictMode the boot effect runs twice, so
   * the second concurrent call could wipe a valid session and drop the user at
   * sign-in on every reload. A read endpoint must not mutate.
   */
  it('is idempotent and non-destructive — a second call keeps the session', async () => {
    await signIn('officer')
    const first = await api.me()
    const second = await api.me()
    const third = await api.me()

    expect(first.user).not.toBeNull()
    expect(second.user).toEqual(first.user)
    expect(third.user).toEqual(first.user)
  })

  it('does not clear a stored session when called concurrently', async () => {
    await signIn('officer')
    const results = await Promise.all([api.me(), api.me(), api.me(), api.me()])
    expect(results.every((r) => r.user !== null)).toBe(true)

    // The session must survive, so a later read still resolves.
    const after = await api.me()
    expect(after.user).not.toBeNull()
  })

  it('clears the session on logout', async () => {
    await signIn('officer')
    await api.logout()
    const { user } = await api.me()
    expect(user).toBeNull()
  })
})

describe('authorisation', () => {
  /**
   * Reads are public by design: a resident must be able to see how their ward's
   * money was spent without creating an account. Writes are not.
   */
  it('allows reads with no session at all', async () => {
    const { projects } = await api.listProjects()
    const { discrepancies } = await api.listDiscrepancies()
    expect(projects.length).toBeGreaterThan(0)
    expect(Array.isArray(discrepancies)).toBe(true)
  })

  it('refuses a write with no session', async () => {
    const err = await api
      .acknowledgeDiscrepancy({ discrepancyId: 'DSC-0001' })
      .catch((e) => e)
    expect(err.status).toBe(401)
  })

  it('refuses an inspection by a contractor', async () => {
    await signIn('contractor')
    const err = await api
      .recordInspection({ projectId: 'JDT-2026-0152', milestoneId: 'MS-1', observedQuantity: 90 })
      .catch((e) => e)
    expect(err.status).toBe(403)
  })

  it('refuses a decision by an inspector', async () => {
    await signIn('inspector')
    const err = await api
      .decideDiscrepancy({ discrepancyId: 'DSC-0001', decision: 'resolved', reason: 'x'.repeat(20) })
      .catch((e) => e)
    expect(err.status).toBe(403)
  })

  it('allows an officer to do both', async () => {
    await signIn('officer')
    const r = await api.recordInspection({
      projectId: 'JDT-2026-0152',
      milestoneId: 'MS-1',
      observedQuantity: 90,
    })
    expect(r.milestone.inspection.observedQuantity).toBe(90)
  })
})

describe('reporting a milestone', () => {
  it('stores the report and clears any prior observation', async () => {
    await signIn('contractor')
    await api.reportMilestone({
      projectId: 'JDT-2026-0143',
      milestoneId: 'MS-1',
      claimedQuantity: 500,
      note: 'Revised',
    })

    const { projects } = await api.listProjects()
    const m = projectOf({ projects }, 'JDT-2026-0143').milestones[0]
    // Earlier evidence must not be able to vouch for new work.
    expect(m.inspection).toBeNull()
  })

  it('rejects a negative quantity', async () => {
    await signIn('contractor')
    const err = await api
      .reportMilestone({ projectId: 'JDT-2026-0152', milestoneId: 'MS-1', claimedQuantity: -5 })
      .catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.details.claimedQuantity).toBeTruthy()
  })
})

describe('recording an inspection — the only path to a discrepancy', () => {
  it('opens a high-severity discrepancy when the measurement contradicts the report', async () => {
    await signIn('inspector')
    const res = await api.recordInspection({
      projectId: 'JDT-2026-0152',
      milestoneId: 'MS-1',
      observedQuantity: 90,
      note: 'Approach partially surfaced only.',
    })

    expect(res.opened).toHaveLength(1)
    expect(res.opened[0].kind).toBe('quantity_shortfall')
    expect(res.opened[0].severity).toBe('high')
  })

  it('opens nothing when the measurement corroborates the report', async () => {
    await signIn('inspector')
    const res = await api.recordInspection({
      projectId: 'JDT-2026-0152',
      milestoneId: 'MS-1',
      observedQuantity: 200,
    })
    expect(res.opened).toHaveLength(0)

    const { discrepancies } = await api.listDiscrepancies()
    expect(discrepancies.filter((d) => d.projectId === 'JDT-2026-0152')).toHaveLength(0)
  })

  it('refuses to inspect a milestone with no reported figure', async () => {
    await signIn('inspector')
    const err = await api
      .recordInspection({ projectId: 'JDT-2026-0138', milestoneId: 'MS-404', observedQuantity: 10 })
      .catch((e) => e)
    expect(err.status).toBe(404)
  })

  it('does not double-open the same kind of finding on re-inspection', async () => {
    await signIn('inspector')
    await api.recordInspection({ projectId: 'JDT-2026-0152', milestoneId: 'MS-1', observedQuantity: 90 })
    await api.recordInspection({ projectId: 'JDT-2026-0152', milestoneId: 'MS-1', observedQuantity: 95 })

    const { discrepancies } = await api.listDiscrepancies()
    expect(discrepancies.filter((d) => d.projectId === 'JDT-2026-0152')).toHaveLength(1)
  })

  /**
   * Regression. Milestone ids are only unique within a project — every project
   * has an `MS-1`. Matching on milestoneId alone let T Nagar's open finding
   * suppress a new one on Saidapet, so a real shortfall never opened.
   */
  it('opens a finding even when another project shares the milestone id', async () => {
    await signIn('inspector')
    const res = await api.recordInspection({
      projectId: 'JDT-2026-0152',
      milestoneId: 'MS-1',
      observedQuantity: 90,
    })

    expect(res.opened).toHaveLength(1)
    const { discrepancies } = await api.listDiscrepancies()
    expect(discrepancies.filter((d) => d.projectId === 'JDT-2026-0143')).toHaveLength(1)
    expect(discrepancies.filter((d) => d.projectId === 'JDT-2026-0152')).toHaveLength(1)
  })
})

describe('deciding a discrepancy', () => {
  /**
   * Regression. The UI once sent a decision with no id at all — the confirm
   * dialog held only the decision kind, not the finding — and the backend
   * answered "Discrepancy not found", which reads as a missing record rather
   * than a malformed request. A missing identifier is a client bug and must say
   * so.
   */
  it('rejects a decision with no discrepancy id, as a bad request', async () => {
    await signIn('officer')
    const err = await api
      .decideDiscrepancy({ decision: 'resolved', reason: 'x'.repeat(20) })
      .catch((e) => e)

    expect(err.status).toBe(400)
    expect(err.details.discrepancyId).toBeTruthy()
  })

  it('requires a written reason of real length', async () => {
    await signIn('officer')
    const err = await api
      .decideDiscrepancy({ discrepancyId: 'DSC-0001', decision: 'resolved', reason: 'ok' })
      .catch((e) => e)

    expect(err.status).toBe(400)
    expect(err.details.reason).toBeTruthy()
  })

  it('records the decision, the actor, and the timestamp', async () => {
    await signIn('officer')
    const { discrepancy } = await api.decideDiscrepancy({
      discrepancyId: 'DSC-0001',
      decision: 'resolved',
      reason: 'Contractor directed to surface the remaining 180 m within 30 days.',
    })

    expect(discrepancy.status).toBe('resolved')
    expect(discrepancy.resolvedBy).toBe('R. Karthikeyan')
    expect(discrepancy.resolvedAt).toBeTruthy()
  })

  it('refuses to decide the same finding twice', async () => {
    await signIn('officer')
    await api.decideDiscrepancy({
      discrepancyId: 'DSC-0001',
      decision: 'resolved',
      reason: 'Done and closed out properly.',
    })
    const err = await api
      .decideDiscrepancy({
        discrepancyId: 'DSC-0001',
        decision: 'dismissed',
        reason: 'Trying to change the decision.',
      })
      .catch((e) => e)

    expect(err.status).toBe(409)
  })

  it('appends to the audit trail for every recorded action', async () => {
    await signIn('officer')
    const before = (await api.listAudit()).auditLog.length

    await api.decideDiscrepancy({
      discrepancyId: 'DSC-0001',
      decision: 'dismissed',
      reason: 'Measurement was taken at the wrong chainage.',
    })

    const { auditLog } = await api.listAudit()
    expect(auditLog.length).toBe(before + 1)
    expect(auditLog.at(-1).action).toBe('discrepancy_dismissed')
  })
})

describe('audit trail integrity', () => {
  it('never loses history — entries are only ever appended', async () => {
    await signIn('officer')
    const { auditLog: before } = await api.listAudit()
    const lastBeforeId = before[before.length - 1].id

    await api.acknowledgeDiscrepancy({ discrepancyId: 'DSC-0001' })

    const { auditLog: after } = await api.listAudit()
    // The property that matters is that nothing existing changed or vanished —
    // not a specific count, which a brittle length assertion can pass by luck.
    const survived = after.slice(0, before.length)
    expect(survived).toEqual(before)
    expect(after.find((e) => e.id === lastBeforeId)).toBeTruthy()
    expect(after.length).toBeGreaterThanOrEqual(before.length)
  })

  it('records an entry for the acknowledgement itself', async () => {
    await signIn('officer')
    const before = await api.listAudit()

    await api.acknowledgeDiscrepancy({ discrepancyId: 'DSC-0001' })

    const after = await api.listAudit()
    expect(after.auditLog.at(-1).action).toBe('discrepancy_acknowledged')
    expect(after.auditLog.length).toBe(before.auditLog.length + 1)
  })

  it('assigns unique ids', async () => {
    await signIn('officer')
    const { auditLog } = await api.listAudit()
    const ids = auditLog.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('overview payload', () => {
  it('reports the seeded ward counts', async () => {
    await signIn('officer')
    const { summary } = await api.overview()

    expect(summary.projects).toBe(3)
    expect(summary.flagged).toBe(1)
    expect(summary.verified).toBe(1)
    expect(summary.awaitingInspection).toBe(1)
    expect(summary.openDiscrepancies).toBe(1)
    expect(summary.highSeverity).toBe(1)
    expect(summary.totalBudget).toBe(800000 + 350000 + 520000)
  })
})

describe('reset', () => {
  it('restores the seeded ward data', async () => {
    await signIn('officer')
    await api.decideDiscrepancy({
      discrepancyId: 'DSC-0001',
      decision: 'resolved',
      reason: 'Closing this out for the test.',
    })

    await api.resetAllData()
    await signIn('officer')

    const { discrepancies } = await api.listDiscrepancies()
    expect(discrepancies[0].status).toBe('open')
  })
})

describe('the client normalises failures', () => {
  it('returns an ApiError with a status for callers to branch on', async () => {
    const err = await api
      .decideDiscrepancy({ discrepancyId: 'DSC-0001', decision: 'resolved', reason: 'x'.repeat(20) })
      .catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.code).toBe('unauthorized')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('backend module is reachable for direct use', () => {
  it('exposes resetMockDatabase for operator tooling', () => {
    expect(typeof resetMockDatabase).toBe('function')
    expect(typeof mockBackend.listProjects).toBe('function')
  })
})
