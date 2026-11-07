/**
 * Mock backend.
 *
 * This stands in for a real API server. It is shaped like one on purpose: every
 * endpoint returns a JSON envelope, mutates a server-side store (not the React
 * state), validates input, and can fail. The frontend talks to it only through
 * `src/api/client.js`, so replacing this file with real HTTP calls is a
 * one-file change.
 *
 * Design constraints:
 *
 *   1. **Server-side state.** Records live here, not in the reducer. A page
 *      reload re-reads them. That is what makes the app behave like a client of
 *      a real service rather than a self-contained mock.
 *
 *   2. **Latency is simulated.** Every call takes 120–320ms. Without it, loading
 *      states never appear, optimistic UI is untestable, and the interface feels
 *      weightless in a way real software never does.
 *
 *   3. **It can fail.** Input is validated and errors are thrown with HTTP-like
 *      status codes, so the UI's error paths are exercised rather than dead code.
 *
 *   4. **Persistence is durable across reloads** via localStorage, standing in for
 *      a database. Session tokens are kept in sessionStorage, which is how a real
 *      app distinguishes "stay signed in" from "session ended".
 *
 * Credentials are hashed with a non-cryptographic digest. Stated plainly because
 * it matters: this implements an authentication *flow*; the hashing is not a
 * security boundary. Real credentials would be verified server-side against a
 * proper password hash.
 */

import { createSeedState, RECORD_NOW } from '../domain/seed'
import { deviations } from '../domain/reconcile'
import { selectProjectViews, selectSummary } from '../domain/selectors'

const DB_KEY = 'jandrishti.db.v1'

/**
 * Simulated network latency.
 *
 * Real enough that loading states appear and are testable; short enough that a
 * test suite making ~200 sequential calls does not take fifteen seconds. Tests
 * set `window.__JDT_FAST__` to collapse it further — the *presence* of latency
 * is what the UI needs to handle, not its duration.
 */
const LATENCY = { min: 120, max: 320 }

const fastMode = () =>
  typeof globalThis !== 'undefined' && Boolean(globalThis.__JDT_FAST__)

/* ------------------------------------------------------------------ helpers */

const delay = () => {
  if (fastMode()) return Promise.resolve()
  return new Promise((r) =>
    setTimeout(r, LATENCY.min + Math.random() * (LATENCY.max - LATENCY.min))
  )
}

/** HTTP-like error so the client can branch on status the way it would over the wire. */
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}
const badRequest = (msg, details) => new ApiError(400, 'bad_request', msg, details)
const unauthorized = (msg = 'Not authenticated') => new ApiError(401, 'unauthorized', msg)
const forbidden = (msg = 'Not permitted for this role') => new ApiError(403, 'forbidden', msg)
const notFound = (msg = 'Not found') => new ApiError(404, 'not_found', msg)
const conflict = (msg) => new ApiError(409, 'conflict', msg)

/** Deterministic digest. Naming it honestly: not cryptographic. */
function digest(input) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')
}
const hashPassword = (pw, salt) => digest(`${salt}::${pw}`)

const token = () => `jdt_${digest(`${Date.now()}:${Math.random()}`)}`

const nowIso = () => new Date().toISOString()

/* --------------------------------------------------------------- the store */

const ROLES = ['officer', 'inspector', 'contractor', 'citizen']

/** Seeded accounts so the product can be entered without signing up first. */
const SEED_ACCOUNTS = [
  {
    id: 'USR-0001',
    name: 'R. Karthikeyan',
    email: 'officer@jandrishti.in',
    password: 'ward12',
    role: 'officer',
    organisation: 'Greater Chennai Corporation',
    designation: 'Assistant Executive Engineer, Ward 12',
  },
  {
    id: 'USR-0002',
    name: 'S. Meenakshi',
    email: 'inspector@jandrishti.in',
    password: 'ward12',
    role: 'inspector',
    organisation: 'Greater Chennai Corporation',
    designation: 'Field Inspector, Ward 12',
  },
  {
    id: 'USR-0003',
    name: 'V. Anand',
    email: 'contractor@jandrishti.in',
    password: 'ward12',
    role: 'contractor',
    organisation: 'Sri Venkatesh Constructions',
    designation: 'Site Engineer',
  },
]

function freshDb() {
  const seed = createSeedState()
  return {
    version: 1,
    accounts: SEED_ACCOUNTS.map((a) => {
      const salt = digest(a.email)
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        role: a.role,
        organisation: a.organisation,
        designation: a.designation,
        salt,
        passwordHash: hashPassword(a.password, salt),
        createdAt: RECORD_NOW,
      }
    }),
    sessions: {},
    projects: seed.projects,
    discrepancies: seed.discrepancies,
    auditLog: seed.auditLog,
    counters: { user: SEED_ACCOUNTS.length, audit: seed.auditLog.length, discrepancy: seed.discrepancies.length },
  }
}

let db = null

function loadDb() {
  if (db) return db
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.version === 1 && Array.isArray(parsed.projects)) {
        db = parsed
        return db
      }
    }
  } catch {
    /* Corrupt or unavailable storage falls through to a fresh seed. */
  }
  db = freshDb()
  return db
}

function saveDb() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    /* Storage full or unavailable; the session continues in memory. */
  }
}

/** Wipe server state back to its seeded form. Used by the operator, not the UI. */
export function resetMockDatabase() {
  db = freshDb()
  saveDb()
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

const TOKEN_KEY = 'jandrishti.session'

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
function writeToken(t) {
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, t)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Resolve the caller if there is one.
 *
 * Reads are public. A resident must be able to see how their ward's money was
 * spent without creating an account — that is the point of a public record. This
 * returns `null` for an anonymous caller rather than throwing, and writes call
 * `requireUser` instead.
 */
function currentUser() {
  const t = readToken()
  if (!t) return null
  const data = loadDb()
  const session = data.sessions[t]
  if (!session) return null
  const account = data.accounts.find((a) => a.id === session.userId)
  if (!account) return null
  return { account, session, token: t }
}

/** Resolve the caller, or throw 401. Every write endpoint starts here. */
function requireUser() {
  const ctx = currentUser()
  if (!ctx) throw unauthorized()
  return ctx
}

function requireRole(...roles) {
  const ctx = requireUser()
  if (!roles.includes(ctx.account.role)) throw forbidden()
  return ctx
}

/** Never send salt or hash across the boundary — this is the public user shape. */
function publicUser(account) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    organisation: account.organisation,
    designation: account.designation,
  }
}

/* ------------------------------------------------------------------- audit */

function appendAudit(data, { actor, role, action, subject, note }) {
  data.counters.audit += 1
  const entry = {
    id: `AUD-${String(data.counters.audit).padStart(4, '0')}`,
    at: nowIso(),
    actor,
    role,
    action,
    subject,
    note,
  }
  data.auditLog.push(entry)
  return entry
}

/** Discrepancies are opened by the server, never by the client. */
function openDiscrepanciesFor(data, projectId, milestoneId, actor) {
  const project = data.projects.find((p) => p.id === projectId)
  const milestone = project?.milestones.find((m) => m.id === milestoneId)
  if (!milestone) return []

  const found = deviations(milestone.commitment, milestone.report, milestone.inspection)
  const quantityFinding = found.find((f) => f.observedVariance !== null)
  const otherFindings = found.filter((f) => f.observedVariance === null)
  const toOpen = [...(quantityFinding ? [quantityFinding] : []), ...otherFindings]

  // Scope the duplicate check by project AND milestone. Milestone ids are only
  // unique within a project, so matching on milestoneId alone would let one
  // project's open finding suppress another's.
  const alreadyOpen = new Set(
    data.discrepancies
      .filter(
        (d) => d.projectId === projectId && d.milestoneId === milestoneId && d.status !== 'dismissed'
      )
      .map((d) => d.kind)
  )

  const created = []
  for (const finding of toOpen) {
    if (alreadyOpen.has(finding.kind)) continue
    data.counters.discrepancy += 1
    const record = {
      id: `DSC-${String(data.counters.discrepancy).padStart(4, '0')}`,
      projectId,
      milestoneId,
      kind: finding.kind,
      severity: finding.severity,
      status: 'open',
      openedAt: nowIso(),
      openedBy: 'System',
      detail: finding.detail,
      note: '',
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
    }
    data.discrepancies.push(record)
    appendAudit(data, {
      actor: 'JanDrishti',
      role: 'system',
      action: 'discrepancy_opened',
      subject: record.id,
      note: finding.detail,
    })
    created.push(record)
  }
  return created
}

/* ---------------------------------------------------------------- endpoints */

export const mockBackend = {
  /**
   * POST /auth/signup
   * Creates an account and returns a session, so signing up logs you straight in.
   */
  async signup({ name, email, password, role, organisation }) {
    await delay()
    const data = loadDb()

    const errors = {}
    if (!name || name.trim().length < 2) errors.name = 'Enter your full name.'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.'
    if (!password || password.length < 6) errors.password = 'Use at least 6 characters.'
    if (!ROLES.includes(role)) errors.role = 'Choose a role.'
    if (Object.keys(errors).length) throw badRequest('Please correct the highlighted fields.', errors)

    const normalised = email.trim().toLowerCase()
    if (data.accounts.some((a) => a.email === normalised)) {
      throw conflict('An account already exists for this email address.')
    }

    data.counters.user += 1
    const salt = digest(normalised + Date.now())
    const account = {
      id: `USR-${String(data.counters.user).padStart(4, '0')}`,
      name: name.trim(),
      email: normalised,
      role,
      organisation: organisation?.trim() || defaultOrganisation(role),
      designation: defaultDesignation(role),
      salt,
      passwordHash: hashPassword(password, salt),
      createdAt: nowIso(),
    }
    data.accounts.push(account)

    const t = token()
    data.sessions[t] = { userId: account.id, issuedAt: nowIso() }
    appendAudit(data, {
      actor: account.name,
      role: account.role,
      action: 'account_created',
      subject: account.id,
      note: `Signed up as ${role}.`,
    })
    saveDb()
    writeToken(t)
    return { user: publicUser(account), token: t }
  },

  /** POST /auth/login */
  async login({ email, password }) {
    await delay()
    const data = loadDb()
    const normalised = String(email ?? '').trim().toLowerCase()
    const account = data.accounts.find((a) => a.email === normalised)

    // Same message for unknown email and wrong password: do not leak which
    // accounts exist.
    if (!account || account.passwordHash !== hashPassword(String(password ?? ''), account.salt)) {
      throw unauthorized('That email and password do not match an account.')
    }

    const t = token()
    data.sessions[t] = { userId: account.id, issuedAt: nowIso() }
    saveDb()
    writeToken(t)
    return { user: publicUser(account), token: t }
  },

  /** POST /auth/logout */
  async logout() {
    await delay()
    const t = readToken()
    if (t) {
      const data = loadDb()
      delete data.sessions[t]
      saveDb()
    }
    writeToken(null)
    return { ok: true }
  },

  /** GET /auth/me — used on boot to restore a session. */
  /**
   * GET /auth/me — restore a session on boot.
   *
   * Deliberately has no side effects. An earlier version cleared the stored
   * token whenever it could not resolve a session, which meant a second
   * concurrent boot (React 18 StrictMode mounts effects twice in development)
   * could destroy a perfectly valid session: the first call resolved it, the
   * second raced and wiped the token, and the app dropped the user at sign-in on
   * every reload. A read must not mutate. Stale tokens are harmless — they simply
   * resolve to nobody.
   */
  async me() {
    await delay()
    const ctx = currentUser()
    return { user: ctx ? publicUser(ctx.account) : null }
  },

  /**
   * GET /projects
   * Public: the ward's project register is part of the public record.
   */
  async listProjects() {
    await delay()
    const data = loadDb()
    // Return copies, never the live arrays. A real API serialises its response;
    // handing out internal references lets a caller's snapshot mutate when the
    // store changes underneath it, which silently breaks caching and
    // optimistic-update logic.
    return { projects: structuredClone(data.projects) }
  },

  /** GET /discrepancies */
  async listDiscrepancies() {
    await delay()
    const data = loadDb()
    return { discrepancies: structuredClone(data.discrepancies) }
  },

  /** GET /audit */
  async listAudit() {
    await delay()
    const data = loadDb()
    return { auditLog: structuredClone(data.auditLog) }
  },

  /** GET /overview — the dashboard payload, computed server-side. */
  async overview() {
    await delay()
    const data = loadDb()
    const state = { projects: data.projects, discrepancies: data.discrepancies, auditLog: data.auditLog }
    const projectViews = selectProjectViews(state)
    return { summary: selectSummary(state, projectViews) }
  },

  /**
   * POST /projects/:id/milestones/:mid/report
   * Contractor files a completion claim. Clears any prior observation: old
   * evidence must not vouch for new work.
   */
  async reportMilestone({ projectId, milestoneId, claimedQuantity, note, evidenceLabel }) {
    await delay()
    const { account } = requireRole('contractor', 'officer')
    const data = loadDb()

    const qty = Number(claimedQuantity)
    if (!Number.isFinite(qty) || qty < 0) {
      throw badRequest('Reported quantity must be a positive number.', {
        claimedQuantity: 'Enter the quantity completed.',
      })
    }

    const project = data.projects.find((p) => p.id === projectId)
    if (!project) throw notFound('Project not found')
    const milestone = project.milestones.find((m) => m.id === milestoneId)
    if (!milestone) throw notFound('Milestone not found')

    const reportCount = data.projects.flatMap((p) => p.milestones).filter((m) => m.report).length
    milestone.report = {
      id: `RPT-${String(reportCount + 1).padStart(4, '0')}`,
      claimedQuantity: qty,
      reportedAt: nowIso(),
      reportedBy: project.contractor,
      evidenceHash: `sha256:${digest(`${projectId}${milestoneId}${qty}`)}`,
      evidenceLabel: evidenceLabel || 'site-submission.jpg',
      note: note || '',
    }
    milestone.inspection = null

    appendAudit(data, {
      actor: account.name,
      role: 'contractor',
      action: 'milestone_reported',
      subject: `${projectId} / ${milestoneId}`,
      note: `Reported ${qty} complete.`,
    })
    saveDb()
    return { project: structuredClone(project), milestone: structuredClone(milestone) }
  },

  /**
   * POST /projects/:id/milestones/:mid/inspect
   * Records an independent observation and reconciles immediately — the only
   * path by which a discrepancy can be created.
   */
  async recordInspection({ projectId, milestoneId, observedQuantity, note, evidenceLabel }) {
    await delay()
    const { account } = requireRole('inspector', 'officer')
    const data = loadDb()

    const qty = Number(observedQuantity)
    if (!Number.isFinite(qty) || qty < 0) {
      throw badRequest('Observed quantity must be a positive number.', {
        observedQuantity: 'Enter the quantity measured on site.',
      })
    }

    const project = data.projects.find((p) => p.id === projectId)
    if (!project) throw notFound('Project not found')
    const milestone = project.milestones.find((m) => m.id === milestoneId)
    if (!milestone) throw notFound('Milestone not found')
    if (!milestone.report) {
      throw conflict('There is no contractor claim to verify against this milestone.')
    }

    const inspectionCount = data.projects
      .flatMap((p) => p.milestones)
      .filter((m) => m.inspection).length
    milestone.inspection = {
      id: `INS-${String(inspectionCount + 1).padStart(4, '0')}`,
      observedQuantity: qty,
      inspectedAt: nowIso(),
      inspectedBy: account.name,
      evidenceHash: `sha256:${digest(`insp${projectId}${milestoneId}${qty}`)}`,
      evidenceLabel: evidenceLabel || 'inspection.jpg',
      note: note || '',
    }

    appendAudit(data, {
      actor: account.name,
      role: 'inspector',
      action: 'inspection_recorded',
      subject: `${projectId} / ${milestoneId}`,
      note: `Measured ${qty}.`,
    })

    const opened = openDiscrepanciesFor(data, projectId, milestoneId, account.name)
    saveDb()
    return {
      project: structuredClone(project),
      milestone: structuredClone(milestone),
      opened: structuredClone(opened),
    }
  },

  /** PATCH /discrepancies/:id — the officer's decision. */
  async decideDiscrepancy({ discrepancyId, decision, reason }) {
    await delay()
    const { account } = requireRole('officer')
    const data = loadDb()

    if (!discrepancyId) {
      throw badRequest('A discrepancy id is required.', {
        discrepancyId: 'No finding was identified for this decision.',
      })
    }
    if (!['resolved', 'dismissed'].includes(decision)) {
      throw badRequest('Decision must be either resolved or dismissed.')
    }
    if (!reason || reason.trim().length < 10) {
      throw badRequest('A written reason is required.', {
        reason: 'Explain the decision. It is published in the public record.',
      })
    }

    const record = data.discrepancies.find((d) => d.id === discrepancyId)
    if (!record) throw notFound('Discrepancy not found')
    if (record.status === 'resolved' || record.status === 'dismissed') {
      throw conflict('This discrepancy has already been decided.')
    }

    record.status = decision
    record.resolvedAt = nowIso()
    record.resolvedBy = account.name
    record.resolution = reason.trim()

    appendAudit(data, {
      actor: account.name,
      role: 'officer',
      action: decision === 'resolved' ? 'discrepancy_resolved' : 'discrepancy_dismissed',
      subject: discrepancyId,
      note: reason.trim(),
    })
    saveDb()
    return { discrepancy: structuredClone(record) }
  },

  /** PATCH /discrepancies/:id/review — mark under review. */
  async acknowledgeDiscrepancy({ discrepancyId }) {
    await delay()
    const { account } = requireRole('officer')
    const data = loadDb()
    const record = data.discrepancies.find((d) => d.id === discrepancyId)
    if (!record) throw notFound('Discrepancy not found')
    if (record.status !== 'open') throw conflict('Only open discrepancies can be marked under review.')

    record.status = 'under_review'
    appendAudit(data, {
      actor: account.name,
      role: 'officer',
      action: 'discrepancy_acknowledged',
      subject: discrepancyId,
      note: 'Marked under review.',
    })
    saveDb()
    return { discrepancy: structuredClone(record) }
  },

  /** DELETE /admin/data — operator-only reset, not reachable from the product UI. */
  async resetAllData() {
    await delay()
    resetMockDatabase()
    return { ok: true }
  },
}

function defaultOrganisation(role) {
  return role === 'contractor'
    ? 'Registered contractor'
    : role === 'citizen'
      ? 'Resident, Ward 12'
      : 'Greater Chennai Corporation'
}

function defaultDesignation(role) {
  return {
    officer: 'Ward Officer',
    inspector: 'Field Inspector',
    contractor: 'Site Engineer',
    citizen: 'Resident',
  }[role]
}

export { ApiError, ROLES }
