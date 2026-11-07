/**
 * App shell — identity, role navigation, and the state of the ward.
 *
 * The four portals form one cycle, so they are presented in the order the work
 * actually moves: a contractor claims, an inspector verifies, an officer
 * decides, the public sees the outcome. Numbering them makes the loop legible
 * without a diagram, which is what the old transit map was unsuccessfully
 * trying to do.
 */

import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { selectSummary } from '../domain/selectors'
import { StatusDot } from './ui'

/** Ordered as the accountability cycle runs, not alphabetically. */
const ROLES = [
  { to: '/contractor', step: '1', label: 'Contractor', note: 'Report work done' },
  { to: '/inspector', step: '2', label: 'Inspector', note: 'Verify on site' },
  { to: '/', step: '3', label: 'Ward Officer', note: 'Review discrepancies', end: true },
  { to: '/citizen', step: '4', label: 'Citizen', note: 'See the record' },
]

export function AppShell({ children, code }) {
  const { state, dispatch, projectViews } = useStore()
  const summary = selectSummary(state, projectViews)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Masthead */}
      <header className="bg-paper border-b border-border">
        <div className="max-w-[1180px] mx-auto px-5 h-14 flex items-center gap-5">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <span
              aria-hidden="true"
              className="w-7 h-7 rounded bg-ink text-paper grid place-items-center font-bold text-sm"
            >
              ज
            </span>
            <span>
              <span className="block text-sm font-bold leading-tight text-ink">JanDrishti</span>
              <span className="block text-2xs text-ink-muted leading-tight">
                Public Works Accountability
              </span>
            </span>
          </NavLink>

          <span className="hidden md:block text-xs text-ink-muted border-l border-hairline pl-5">
            {code?.title}
          </span>

          <div className="ml-auto flex items-center gap-4">
            {summary.openDiscrepancies > 0 ? (
              <span className="inline-flex items-center gap-2 text-xs font-medium text-status-text-flagged">
                <StatusDot tone="flagged" pulse />
                {summary.openDiscrepancies === 1
                  ? '1 open discrepancy'
                  : `${summary.openDiscrepancies} open discrepancies`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-xs font-medium text-status-text-verified">
                <StatusDot tone="verified" />
                No open discrepancies
              </span>
            )}
            <span className="hidden lg:inline text-2xs text-ink-muted border-l border-hairline pl-4 py-1">
              {location.pathname === '/citizen' ? 'PUBLIC RECORD' : 'DEMONSTRATION DATA'}
            </span>
            {/*
              Reset lives here, not in the footer, and is withheld from the citizen
              view entirely. The public record should contain no control that
              changes a record — including a demo affordance, because a reader
              cannot be expected to know the difference.
            */}
            {location.pathname !== '/citizen' && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'RESET_DEMO' })}
                title="Restore the seeded demonstration data"
                className="text-2xs text-ink-muted hover:text-ink underline decoration-dotted underline-offset-2 whitespace-nowrap"
              >
                Reset demo
              </button>
            )}
          </div>
        </div>

        {/* The cycle, as four labelled steps */}
        <nav className="border-t border-hairline bg-canvas" aria-label="Accountability cycle">
          <ol className="max-w-[1180px] mx-auto px-5 flex items-stretch overflow-x-auto">
            {ROLES.map((role) => (
              <li key={role.to} className="flex-1 min-w-[168px]">
                <NavLink
                  to={role.to}
                  end={role.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 h-14 px-3 border-b-2 transition-colors ${
                      isActive
                        ? 'border-b-ink bg-paper'
                        : 'border-b-transparent hover:bg-paper/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden="true"
                        className={`w-6 h-6 rounded-full grid place-items-center text-2xs font-bold shrink-0 ${
                          isActive ? 'bg-ink text-paper' : 'bg-paper text-ink-muted border border-border'
                        }`}
                      >
                        {role.step}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-sm leading-tight truncate ${
                            isActive ? 'font-semibold text-ink' : 'text-ink-2'
                          }`}
                        >
                          {role.label}
                        </span>
                        <span className="block text-2xs text-ink-muted leading-tight truncate">
                          {role.note}
                        </span>
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-[1180px] mx-auto px-5 py-6">{children}</main>

      <footer className="border-t border-hairline bg-paper">
        <div className="max-w-[1180px] mx-auto px-5 py-4">
          <p className="text-xs text-ink-muted">
            Demonstration data. Figures are seeded, not live municipal records.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default AppShell
