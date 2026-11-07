/**
 * API client.
 *
 * The only module that talks to a backend. Every screen goes through here, so
 * the shape of a request, the shape of an error, and the shape of a session are
 * defined once.
 *
 * `mockBackend` is the provider while there is no server. Swapping in a real one
 * means writing a module with the same method names and changing the import
 * below — no screen, store, or component changes.
 *
 * Errors are normalised to a single class so callers can branch on `status` and
 * read field-level `details` without caring what the transport was.
 */

import { mockBackend, ApiError, ROLES } from './mockBackend'

const backend = mockBackend

/** Normalise anything thrown into an ApiError. */
function toApiError(err) {
  if (err instanceof ApiError) return err
  return new ApiError(0, 'network_error', err?.message ?? 'Something went wrong. Please try again.')
}

async function call(method, ...args) {
  try {
    return await backend[method](...args)
  } catch (err) {
    throw toApiError(err)
  }
}

export const api = {
  /* ------------------------------------------------------------- auth */
  signup: (payload) => call('signup', payload),
  login: (payload) => call('login', payload),
  logout: () => call('logout'),
  me: () => call('me'),

  /* ----------------------------------------------------------- reads */
  listProjects: () => call('listProjects'),
  listDiscrepancies: () => call('listDiscrepancies'),
  listAudit: () => call('listAudit'),
  overview: () => call('overview'),

  /* ---------------------------------------------------------- writes */
  reportMilestone: (payload) => call('reportMilestone', payload),
  recordInspection: (payload) => call('recordInspection', payload),
  decideDiscrepancy: (payload) => call('decideDiscrepancy', payload),
  acknowledgeDiscrepancy: (payload) => call('acknowledgeDiscrepancy', payload),

  /* -------------------------------------------------- operator tooling */
  resetAllData: () => call('resetAllData'),
}

export { ApiError, ROLES }
