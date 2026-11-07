/**
 * App shell — chrome for the signed-in product.
 *
 * Navigation is role-based rather than numbered. The previous version labelled
 * the four portals "1 2 3 4", which read as a tutorial for a tool the visitor did
 * not yet understand. A ward officer does not think in steps; they think in tasks.
 * So the sidebar lists the tasks their role can actually perform, and a role that
 * cannot perform a task does not see it.
 *
 * The shell also owns three things the app previously lacked: an indication of
 * who is signed in, a way to sign out, and a global loading state that appears
 * while the client is waiting on the API.
 */

import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { useToast } from './feedback'
import { StatusDot } from './ui'

/** Task-oriented navigation per role. Order is by how often the task is done. */
const NAV = {
  officer: [
    { to: '/ward', label: 'Ward overview', glyph: '▤', end: true },
    { to: '/ward/discrepancies', label: 'Discrepancies', glyph: '!', badge: 'open' },
    { to: '/ward/audit', label: 'Audit trail', glyph: '≡' },
  ],
  inspector: [
    { to: '/field', label: 'Assigned inspections', glyph: '◎', end: true },
  ],
  contractor: [
    { to: '/works', label: 'Sanctioned scope', glyph: '▦', end: true },
  ],
  citizen: [
    { to: '/record', label: 'Public record', glyph: '◍', end: true },
  ],
}

const ROLE_LABEL = {
  officer: 'Ward Officer',
  inspector: 'Field Inspector',
  contractor: 'Contractor',
  citizen: 'Citizen',
}

function UserMenu() {
  const { session, actions } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const user = session.user
  if (!user) return null
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  const signOut = async () => {
    await actions.logout()
    toast.info('Signed out', 'Your session has ended.')
    navigate('/', { replace: true })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-sunken transition-colors"
      >
        <span
          aria-hidden="true"
          className="w-7 h-7 rounded-full bg-accent text-paper grid place-items-center text-2xs font-bold"
        >
          {initials}
        </span>
        <span className="hidden sm:block text-left">
          <span className="block text-xs font-medium text-ink leading-tight">
            {user.name}
          </span>
          <span className="block text-2xs text-ink-muted leading-tight">
            {ROLE_LABEL[user.role]}
          </span>
        </span>
        <span aria-hidden="true" className="text-ink-muted text-2xs">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 bg-paper border border-border rounded-lg shadow-raised py-1.5 z-40 animate-slide-down"
        >
          <div className="px-3.5 py-2.5 border-b border-hairline">
            <div className="text-sm font-medium text-ink">{user.name}</div>
            <div className="text-xs text-ink-muted mt-0.5">{user.email}</div>
            <div className="text-2xs text-ink-muted mt-1.5">
              {user.designation}
              {user.organisation ? ` · ${user.organisation}` : ''}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="w-full text-left px-3.5 py-2 text-sm text-ink-2 hover:bg-sunken"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

/** Thin progress bar shown while the client is waiting on the API. */
function LoadingBar({ active }) {
  if (!active) return null
  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-sunken overflow-hidden">
      <div className="h-full w-1/3 bg-accent animate-[shimmer_1.4s_infinite] origin-left" />
    </div>
  )
}

export function AppShell() {
  const { session, summary, data, loading, busy } = useStore()
  const location = useLocation()
  const user = session.user
  const items = NAV[user?.role] ?? NAV.citizen
  const publicView = location.pathname === '/record' && !user

  return (
    <div className="min-h-screen bg-canvas">
      <LoadingBar active={loading || busy} />

      <header className="sticky top-0 z-30 bg-paper border-b border-hairline">
        <div className="max-w-[1280px] mx-auto px-5 h-16 flex items-center gap-5">
          <NavLink to={user ? items[0].to : '/'} className="flex items-center gap-2.5 shrink-0">
            <span
              aria-hidden="true"
              className="w-8 h-8 rounded-lg bg-accent text-paper grid place-items-center font-bold"
            >
              ज
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-bold leading-tight text-ink">
                JanDrishti
              </span>
              <span className="block text-2xs text-ink-muted leading-tight">
                Ward 12 · Greater Chennai
              </span>
            </span>
          </NavLink>

          <nav
            className="ml-2 hidden md:flex items-center gap-1"
            aria-label="Primary"
          >
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-sunken text-ink font-medium'
                      : 'text-ink-2 hover:text-ink hover:bg-canvas'
                  }`
                }
              >
                <span aria-hidden="true" className="text-xs opacity-70">
                  {item.glyph}
                </span>
                {item.label}
                {item.badge === 'open' && summary.openDiscrepancies > 0 && (
                  <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-status-soft-flagged text-status-text-flagged text-2xs font-semibold">
                    {summary.openDiscrepancies}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/login"
                  className="px-3.5 py-2 text-sm text-ink-2 hover:text-ink rounded-lg"
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/signup"
                  className="px-3.5 py-2 text-sm font-medium rounded-lg bg-ink text-paper hover:bg-ink-2"
                >
                  Create account
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Mobile navigation, since the desktop rail collapses */}
        <nav
          className="md:hidden border-t border-hairline px-3 py-2 flex gap-1 overflow-x-auto"
          aria-label="Primary"
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                  isActive ? 'bg-sunken text-ink font-medium' : 'text-ink-2'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Actionable state of the ward, stated once, at the top */}
      {user?.role === 'officer' && data.projects.length > 0 && (
        <div className="bg-paper border-b border-hairline">
          <div className="max-w-[1280px] mx-auto px-5 py-2.5 flex items-center gap-4 text-xs flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <StatusDot tone={summary.openDiscrepancies > 0 ? 'flagged' : 'verified'} size="sm" />
              {summary.openDiscrepancies > 0
                ? `${summary.openDiscrepancies} open discrepanc${summary.openDiscrepancies === 1 ? 'y' : 'ies'}`
                : 'No open discrepancies'}
            </span>
            <span className="text-hairline" aria-hidden="true">
              |
            </span>
            <span className="text-ink-muted">
              {summary.awaitingInspection} awaiting inspection
            </span>
            <span className="text-hairline" aria-hidden="true">
              |
            </span>
            <span className="text-ink-muted">{summary.projects} projects tracked</span>
          </div>
        </div>
      )}

      <main className="max-w-[1280px] mx-auto px-5 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-hairline mt-8">
        <div className="max-w-[1280px] mx-auto px-5 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
          <span>
            JanDrishti · Public Works Verification &amp; Accountability
          </span>
          {publicView && (
            <span>
              Reading the public record.{' '}
              <NavLink to="/login" className="text-accent hover:underline">
                Sign in
              </NavLink>{' '}
              to make changes.
            </span>
          )}
        </div>
      </footer>
    </div>
  )
}

export default AppShell
