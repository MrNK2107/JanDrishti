/**
 * App shell — identity, role navigation, and the persistent audit affordance.
 *
 * The four portals are one product, so they share a chrome and are one click
 * apart. A judge should never have to guess that the contractor view exists.
 */

import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../store/StoreProvider'
import { selectSummary } from '../domain/selectors'
import { StatusDot } from './ui'

const ROLES = [
  { to: '/', label: 'Ward Admin', glyph: '▦', end: true },
  { to: '/contractor', label: 'Contractor', glyph: '▤' },
  { to: '/inspector', label: 'Inspector', glyph: '◎' },
  { to: '/citizen', label: 'Citizen', glyph: '◍' },
]

export function AppShell({ children, code }) {
  const { state, dispatch, projectViews } = useStore()
  const summary = selectSummary(state, projectViews)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-midnight-900 text-porcelain-100 flex">
      {/* Left rail */}
      <aside className="w-[248px] shrink-0 bg-midnight-950 border-r border-midnight-700 flex flex-col">
        <div className="px-5 py-5 border-b border-midnight-700">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="w-7 h-7 rounded bg-status-verified text-midnight-950 grid place-items-center font-bold text-sm"
            >
              ज
            </span>
            <div>
              <div className="text-sm font-semibold leading-tight">JanDrishti</div>
              <div className="text-[10px] text-porcelain-200 leading-tight">
                Public Works Accountability
              </div>
            </div>
          </div>
        </div>

        <nav className="py-3" aria-label="Portal">
          {ROLES.map((role) => (
            <NavLink
              key={role.to}
              to={role.to}
              end={role.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm border-l-3 ${
                  isActive
                    ? 'bg-midnight-800 border-l-status-flagged text-porcelain-100 font-medium'
                    : 'border-l-transparent text-porcelain-200 hover:text-porcelain-100 hover:bg-midnight-800/60'
                }`
              }
            >
              <span aria-hidden="true" className="text-base">
                {role.glyph}
              </span>
              {role.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto p-5 border-t border-midnight-700 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-porcelain-200 mb-2">
              Ward 12 Status
            </div>
            <dl className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-porcelain-200">Projects</dt>
                <dd className="font-mono">{summary.projects}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-porcelain-200">
                  <StatusDot tone={summary.openDiscrepancies > 0 ? 'flagged' : 'verified'} size="sm" />
                  Open findings
                </dt>
                <dd className="font-mono">{summary.openDiscrepancies}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-porcelain-200">Awaiting inspection</dt>
                <dd className="font-mono">{summary.awaitingInspection}</dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET_DEMO' })}
            className="w-full text-left text-[11px] text-porcelain-200 hover:text-porcelain-100 underline decoration-dotted underline-offset-2"
          >
            Reset demo data
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 bg-midnight-950 border-b border-midnight-700 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm font-semibold truncate">{code?.title}</h1>
            {code?.subtitle && (
              <span className="text-xs text-porcelain-200 truncate hidden md:inline">
                {code.subtitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-porcelain-200">
            <span className="hidden lg:inline font-mono">
              {location.pathname === '/citizen'
                ? 'PUBLIC RECORD — READ ONLY'
                : 'DEMONSTRATION DATA'}
            </span>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}

export default AppShell
