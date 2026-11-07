/**
 * JanDrishti application store.
 *
 * One reducer, one source of truth, held in memory. Actions are the four things
 * a person can actually do in the system: register a claim, record an
 * observation, resolve a discrepancy, dismiss a discrepancy.
 *
 * Two deliberate properties:
 *
 *   1. **Derived values are never stored.** Milestone and project status are
 *      computed from the evidence on every render via `src/domain/selectors.js`.
 *      Storing them alongside the evidence would create two sources of truth
 *      that can disagree — which is precisely the failure mode this product
 *      exists to catch.
 *
 *   2. **Discrepancies are created by the reducer, not by the UI.** When an
 *      inspection arrives, the system reconciles and opens whatever records are
 *      warranted. The interface does not get to decide what counts as a
 *      deviation; the policy in `src/domain/reconcile.js` does.
 *
 * Every mutating action also appends to `auditLog`. Nothing is ever edited or
 * removed — that is the "traceability" principle made concrete.
 */

import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { createSeedState, DEMO_NOW } from '../domain/seed'
import { deviations } from '../domain/reconcile'
import { selectMilestoneViews, selectProjectViews } from '../domain/selectors'

const StoreContext = createContext(null)

/**
 * Session storage key, versioned.
 *
 * The app is a client-side SPA with no backend, so an in-memory store is lost
 * on every page load — and because navigating to a route directly is a full
 * document request, *any* hard navigation would silently discard every claim,
 * observation, and finding recorded so far. During a live walkthrough that is
 * a disaster: one refresh and the demo is back to seed.
 *
 * `sessionStorage` is the right scope rather than `localStorage`. It survives
 * reloads and hard navigation within the tab, which is what a demo needs, but
 * it does not leak yesterday's playthrough into a fresh tab.
 *
 * The version suffix means a change to the seed shape discards stale state
 * instead of hydrating a store that no longer matches the code.
 */
export const STORAGE_KEY = 'jandrishti.state.v1'

/** Read persisted state, or null if absent/corrupt/from another version. */
function loadPersistedState() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Minimal shape validation: a half-written record must not crash the app.
    if (!parsed || !Array.isArray(parsed.projects) || !Array.isArray(parsed.discrepancies)) {
      return null
    }
    if (!Array.isArray(parsed.auditLog)) return null
    return parsed
  } catch {
    return null
  }
}

function persistState(state) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be unavailable (private mode, quota). Losing persistence is
    // an acceptable degradation; losing the session is not.
  }
}

/** Deterministic id generation — counters, not randomness, so runs are reproducible. */
const nextId = (prefix, existing, width = 4) =>
  `${prefix}-${String(existing.length + 1).padStart(width, '0')}`

/** Action labels shown in the audit trail. */
const AUDIT_LABEL = {
  milestone_reported: 'milestone_reported',
  inspection_recorded: 'inspection_recorded',
  discrepancy_opened: 'discrepancy_opened',
  discrepancy_resolved: 'discrepancy_resolved',
  discrepancy_dismissed: 'discrepancy_dismissed',
  discrepancy_acknowledged: 'discrepancy_acknowledged',
}

function appendAudit(state, entry) {
  return [
    ...state.auditLog,
    {
      id: nextId('AUD', state.auditLog),
      ...entry,
    },
  ]
}

/**
 * Open discrepancy records for every deviation the reconciliation rules found.
 * Called after an inspection is recorded — that is the only moment a new
 * finding can legitimately arise, because it is the only moment new independent
 * evidence enters the system.
 */
function openDiscrepanciesFor(state, projectId, milestoneId) {
  const project = state.projects.find((p) => p.id === projectId)
  const milestone = project?.milestones.find((m) => m.id === milestoneId)
  if (!milestone) return state

  const found = deviations(milestone.commitment, milestone.report, milestone.inspection)

  // Collapse the two quantity rules to a single record. A shortfall is one
  // finding an official resolves once, not two rows saying the same thing.
  const quantityFinding = found.find((f) => f.observedVariance !== null)
  const otherFindings = found.filter((f) => f.observedVariance === null)

  const toOpen = [
    ...(quantityFinding ? [quantityFinding] : []),
    ...otherFindings,
  ]

  // Suppress only duplicates *within this milestone*. Milestone ids are not
  // globally unique — every project has an `MS-1` — so omitting projectId here
  // would let one project's open finding silently suppress another's, which is
  // precisely the failure this product exists to catch.
  const alreadyOpen = new Set(
    state.discrepancies
      .filter(
        (d) =>
          d.projectId === projectId &&
          d.milestoneId === milestoneId &&
          d.status !== 'dismissed'
      )
      .map((d) => d.kind)
  )

  let next = state
  for (const finding of toOpen) {
    if (alreadyOpen.has(finding.kind)) continue

    const record = {
      id: nextId('DSC', next.discrepancies),
      projectId,
      milestoneId,
      kind: finding.kind,
      severity: finding.severity,
      status: 'open',
      openedAt: DEMO_NOW,
      openedBy: 'System',
      detail: finding.detail,
      note: '',
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
    }

    next = {
      ...next,
      discrepancies: [...next.discrepancies, record],
      auditLog: appendAudit(next, {
        at: DEMO_NOW,
        actor: 'System',
        role: 'system',
        action: AUDIT_LABEL.discrepancy_opened,
        subject: record.id,
        note: finding.detail,
      }),
    }
  }
  return next
}

export function reducer(state, action) {
  switch (action.type) {
    /**
     * Contractor files a completion claim against a milestone.
     */
    case 'REPORT_MILESTONE': {
      const { projectId, milestoneId, claimedQuantity, reportedBy, note, evidenceLabel } =
        action.payload

      const projects = state.projects.map((project) => {
        if (project.id !== projectId) return project
        return {
          ...project,
          milestones: project.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  report: {
                    id: nextId('RPT', state.projects.flatMap((p) =>
                      p.milestones.map((x) => x.report).filter(Boolean)
                    )),
                    claimedQuantity: Number(claimedQuantity),
                    reportedAt: DEMO_NOW,
                    reportedBy,
                    evidenceHash: `sha256:${hashish(`${projectId}${milestoneId}${claimedQuantity}`)}`,
                    evidenceLabel: evidenceLabel || 'submission.jpg',
                    note: note || '',
                  },
                  // A fresh claim invalidates any prior observation. Leaving a
                  // stale inspection attached would let old evidence silently
                  // vouch for new work.
                  inspection: null,
                }
              : m
          ),
        }
      })

      const next = { ...state, projects }
      return {
        ...next,
        auditLog: appendAudit(next, {
          at: DEMO_NOW,
          actor: reportedBy,
          role: 'contractor',
          action: AUDIT_LABEL.milestone_reported,
          subject: `${projectId} / ${milestoneId}`,
          note: `Claimed ${claimedQuantity} complete.`,
        }),
      }
    }

    /**
     * Inspector records an independent physical observation. This is the only
     * action that can open a discrepancy.
     */
    case 'RECORD_INSPECTION': {
      const { projectId, milestoneId, observedQuantity, inspectedBy, note, evidenceLabel } =
        action.payload

      const projects = state.projects.map((project) => {
        if (project.id !== projectId) return project
        return {
          ...project,
          milestones: project.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  inspection: {
                    id: nextId('INS', state.projects.flatMap((p) =>
                      p.milestones.map((x) => x.inspection).filter(Boolean)
                    )),
                    observedQuantity: Number(observedQuantity),
                    inspectedAt: DEMO_NOW,
                    inspectedBy,
                    // Deliberately distinct from the contractor hash. If these
                    // ever matched, the duplicate-evidence rule would fire,
                    // which is the correct behaviour.
                    evidenceHash: `sha256:${hashish(`insp${projectId}${milestoneId}${observedQuantity}`)}`,
                    evidenceLabel: evidenceLabel || 'inspection.jpg',
                    note: note || '',
                  },
                }
              : m
          ),
        }
      })

      let next = { ...state, projects }
      next = {
        ...next,
        auditLog: appendAudit(next, {
          at: DEMO_NOW,
          actor: inspectedBy,
          role: 'inspector',
          action: AUDIT_LABEL.inspection_recorded,
          subject: `${projectId} / ${milestoneId}`,
          note: `Observed ${observedQuantity}.`,
        }),
      }

      // The system reconciles immediately. This is the product.
      return openDiscrepanciesFor(next, projectId, milestoneId)
    }

    case 'RESOLVE_DISCREPANCY': {
      const { discrepancyId, resolvedBy, resolution } = action.payload
      const discrepancies = state.discrepancies.map((d) =>
        d.id === discrepancyId
          ? {
              ...d,
              status: 'resolved',
              resolvedAt: DEMO_NOW,
              resolvedBy,
              resolution,
            }
          : d
      )
      const next = { ...state, discrepancies }
      return {
        ...next,
        auditLog: appendAudit(next, {
          at: DEMO_NOW,
          actor: resolvedBy,
          role: 'admin',
          action: AUDIT_LABEL.discrepancy_resolved,
          subject: discrepancyId,
          note: resolution,
        }),
      }
    }

    case 'DISMISS_DISCREPANCY': {
      const { discrepancyId, resolvedBy, resolution } = action.payload
      const discrepancies = state.discrepancies.map((d) =>
        d.id === discrepancyId
          ? {
              ...d,
              status: 'dismissed',
              resolvedAt: DEMO_NOW,
              resolvedBy,
              resolution,
            }
          : d
      )
      const next = { ...state, discrepancies }
      return {
        ...next,
        auditLog: appendAudit(next, {
          at: DEMO_NOW,
          actor: resolvedBy,
          role: 'admin',
          action: AUDIT_LABEL.discrepancy_dismissed,
          subject: discrepancyId,
          note: resolution,
        }),
      }
    }

    case 'ACKNOWLEDGE_DISCREPANCY': {
      const { discrepancyId, actor } = action.payload
      const discrepancies = state.discrepancies.map((d) =>
        d.id === discrepancyId && d.status === 'open'
          ? { ...d, status: 'under_review' }
          : d
      )
      const next = { ...state, discrepancies }
      return {
        ...next,
        auditLog: appendAudit(next, {
          at: DEMO_NOW,
          actor,
          role: 'admin',
          action: AUDIT_LABEL.discrepancy_acknowledged,
          subject: discrepancyId,
          note: 'Marked under review.',
        }),
      }
    }

    case 'RESET_DEMO':
      return createSeedState()

    default:
      return state
  }
}

/**
 * A tiny deterministic string hash. Not cryptographic and not pretending to be
 * — it exists so that evidence identifiers are stable across runs, which a
 * random UUID would not give us.
 */
function hashish(input) {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

export function StoreProvider({ children, initialState }) {
  const [state, dispatch] = useReducer(
    reducer,
    initialState,
    // Explicit initial state (tests) wins; otherwise resume the session, and
    // only fall back to the seed when there is nothing to resume.
    (init) => init ?? loadPersistedState() ?? createSeedState()
  )

  // Persist on every transition. `RESET_DEMO` writes the fresh seed back, so a
  // reset is durable rather than being undone by the next reload.
  useEffect(() => {
    persistState(state)
  }, [state])

  // Derived views. Recomputed when state changes, memoised per state identity.
  const projectViews = useMemo(() => selectProjectViews(state), [state])
  const milestoneViews = useMemo(() => selectMilestoneViews(state), [state])

  // Expose the store for end-to-end verification. The browser check in
  // tools/verify-browser.mjs needs to assert on records, not on whether a
  // particular string happened to appear somewhere in the DOM.
  if (typeof window !== 'undefined') {
    window.__JANDRISHTI__ = {
      getState: () => state,
      discrepancies: () => state.discrepancies,
      audit: () => state.auditLog,
    }
  }

  const value = useMemo(
    () => ({ state, dispatch, projectViews, milestoneViews }),
    [state, projectViews, milestoneViews]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}

/** Convenience hook: the fully-derived view of one project, or undefined. */
export function useProject(projectId) {
  const { projectViews } = useStore()
  return projectViews.find((p) => p.id === projectId)
}

export { DEMO_NOW }
