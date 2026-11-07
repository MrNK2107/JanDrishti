/**
 * Application store.
 *
 * The store is a *client*, not an owner. Records come from the API and are held
 * here for rendering; nothing is mutated locally and hoped to match the server.
 * After every write the relevant collections are re-read, so what is on screen
 * is what the backend holds.
 *
 * Two consequences worth stating:
 *
 *   1. **Loading and error are real states.** Because the API has latency and
 *      can fail, the interface must handle both. Without a client-server split
 *      those code paths tend to not exist, which is why the app previously felt
 *      weightless.
 *
 *   2. **The session gates everything.** `session.ready` distinguishes "we do not
 *      know yet" from "signed out", so a reload does not flash the sign-in page
 *      before restoring a valid session.
 *
 * Derived values are still never stored — status is computed from records on
 * every render, via `src/domain/selectors.js`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import { api } from '../api/client'
import { selectMilestoneViews, selectProjectViews, selectSummary } from '../domain/selectors'

const StoreContext = createContext(null)

const INITIAL = {
  session: { ready: false, user: null },
  data: { projects: [], discrepancies: [], auditLog: [] },
  loading: false,
  /** Pending mutations keyed by a caller-supplied label, so buttons can show progress. */
  pending: {},
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    /**
     * The session has been resolved by the boot sequence. Distinct from
     * SESSION_SET so that BOOT_DONE cannot overwrite a user who signed in while
     * the boot request was still in flight.
     */
    case 'SESSION_RESOLVED':
      return {
        ...state,
        session: { ready: true, user: action.user },
        booting: false,
      }

    case 'BOOT_DONE':
      return { ...state, session: { ...state.session, ready: true } }

    case 'SESSION_SET':
      return { ...state, session: { ready: true, user: action.user } }

    case 'SESSION_CLEAR':
      return { ...state, session: { ready: true, user: null } }

    case 'DATA_SET':
      return { ...state, data: action.data, error: null }

    case 'LOADING':
      return { ...state, loading: action.value }

    case 'PENDING': {
      const pending = { ...state.pending }
      if (action.value) pending[action.key] = true
      else delete pending[action.key]
      return { ...state, pending }
    }

    case 'ERROR':
      return { ...state, error: action.error }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    default:
      return state
  }
}

export function StoreProvider({ children, initialState }) {
  const [state, dispatch] = useReducer(reducer, initialState ?? INITIAL)

  /** Re-read every collection. Cheap here; with a real API these would be
   *  scoped to what changed. */
  const refresh = useCallback(async () => {
    const [projects, discrepancies, audit] = await Promise.all([
      api.listProjects(),
      api.listDiscrepancies(),
      api.listAudit(),
    ])
    dispatch({
      type: 'DATA_SET',
      data: {
        projects: projects.projects,
        discrepancies: discrepancies.discrepancies,
        auditLog: audit.auditLog,
      },
    })
  }, [])

  /**
   * Boot: restore any valid session, then load the ward's records.
   *
   * Written to be idempotent, because React 18 StrictMode mounts effects twice in
   * development. Two failure modes were hit here while getting it right, and both
   * are recorded because either would silently corrupt a session:
   *
   *   - A boot that ran twice raced itself and dropped a valid session, so every
   *     reload appeared to sign the user out.
   *   - Aborting dispatch on the StrictMode "unmount" left the app stuck on the
   *     loading screen forever, because the first cleanup ran before the real
   *     mount and suppressed every subsequent dispatch.
   *
   * So: start the work once (ref), and let it complete. Dispatching after an
   * unmount is a no-op in React 18, so there is nothing to protect against.
   */
  const bootedRef = useRef(false)

  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true

    ;(async () => {
      try {
        const { user } = await api.me()
        dispatch({ type: 'SESSION_RESOLVED', user })
        if (user) await refresh()
      } catch (err) {
        dispatch({ type: 'SESSION_RESOLVED', user: null })
        dispatch({ type: 'ERROR', error: err })
      }
    })()
  }, [refresh])

  /**
   * Run a mutation, then resync. `key` labels the operation so the calling
   * button can disable itself and show progress without global spinners.
   */
  const run = useCallback(
    async (key, fn) => {
      dispatch({ type: 'PENDING', key, value: true })
      dispatch({ type: 'CLEAR_ERROR' })
      try {
        const result = await fn()
        await refresh()
        return { ok: true, result }
      } catch (err) {
        dispatch({ type: 'ERROR', error: err })
        return { ok: false, error: err }
      } finally {
        dispatch({ type: 'PENDING', key, value: false })
      }
    },
    [refresh]
  )

  const actions = useMemo(
    () => ({
      async login(credentials) {
        const res = await run('auth', () => api.login(credentials))
        if (res.ok) dispatch({ type: 'SESSION_SET', user: res.result.user })
        return res
      },

      async signup(payload) {
        const res = await run('auth', () => api.signup(payload))
        if (res.ok) dispatch({ type: 'SESSION_SET', user: res.result.user })
        return res
      },

      async logout() {
        await api.logout().catch(() => {})
        dispatch({ type: 'SESSION_SET', user: null })
        dispatch({ type: 'DATA_SET', data: INITIAL.data })
        return { ok: true }
      },

      reportMilestone: (payload) => run('report', () => api.reportMilestone(payload)),
      recordInspection: (payload) => run('inspect', () => api.recordInspection(payload)),
      decideDiscrepancy: (payload) => run('decide', () => api.decideDiscrepancy(payload)),
      acknowledgeDiscrepancy: (payload) =>
        run('acknowledge', () => api.acknowledgeDiscrepancy(payload)),

      clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    }),
    [run]
  )

  const projectViews = useMemo(() => selectProjectViews(state.data), [state.data])
  const milestoneViews = useMemo(() => selectMilestoneViews(state.data), [state.data])
  const summary = useMemo(
    () => selectSummary(state.data, projectViews),
    [state.data, projectViews]
  )

  const value = useMemo(
    () => ({
      session: state.session,
      data: state.data,
      loading: state.loading,
      pending: state.pending,
      error: state.error,
      actions,
      projectViews,
      milestoneViews,
      summary,
      /** True while any mutation is in flight. */
      busy: Object.keys(state.pending).length > 0,
    }),
    [state, actions, projectViews, milestoneViews, summary]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}

/** Redirect helper: the signed-in user, or null. */
export function useUser() {
  return useStore().session.user
}

export { INITIAL }
