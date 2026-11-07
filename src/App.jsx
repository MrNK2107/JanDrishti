/**
 * Routing and access control.
 *
 * Three zones:
 *
 *   Public     — landing, sign in, sign up. Reachable signed out.
 *   Public     — the citizen record. Reachable either way, because a resident
 *                should not need an account to read the ward's books.
 *   Protected  — the working portals. Each requires a signed-in user *and* a
 *                role that can perform the work.
 *
 * `RequireAuth` distinguishes "we do not know yet" from "signed out". Without
 * that distinction a reload flashes the sign-in page before the session restores,
 * which is the single most common way an SPA feels broken.
 */

import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './store/StoreProvider'
import { ToastProvider } from './components/feedback'
import { AppShell } from './components/AppShell'

import Landing from './pages/Landing'
import { Login, SignUp } from './pages/Auth'
import WardOverview from './pages/WardOverview'
import Discrepancies from './pages/Discrepancies'
import AuditTrail from './pages/AuditTrail'
import InspectorInterface from './pages/InspectorInterface'
import ContractorPortal from './pages/ContractorPortal'
import PublicRecord from './pages/PublicRecord'
import NotFound from './pages/NotFound'

const HOME_FOR = {
  officer: '/ward',
  inspector: '/field',
  contractor: '/works',
  citizen: '/record',
}

/** Full-page state used while the session is being restored. */
function Booting() {
  return (
    <div className="min-h-screen bg-canvas grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className="w-10 h-10 rounded-xl bg-accent text-paper grid place-items-center font-bold text-lg animate-pulse"
        >
          ज
        </span>
        <span className="text-sm text-ink-muted">Loading the ward record…</span>
      </div>
    </div>
  )
}

function RequireAuth({ roles, children }) {
  const { session } = useStore()
  const location = useLocation()

  if (!session.ready) return <Booting />
  if (!session.user) {
    // Remember where they were headed so sign-in can return them there.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (roles && !roles.includes(session.user.role)) {
    // Signed in, wrong role. Send them to what they can do rather than a 403.
    return <Navigate to={HOME_FOR[session.user.role] ?? '/'} replace />
  }
  return children
}

/** Signed-in users have no business on the auth pages. */
function RedirectIfSignedIn({ children }) {
  const { session } = useStore()
  if (!session.ready) return <Booting />
  if (session.user) return <Navigate to={HOME_FOR[session.user.role] ?? '/'} replace />
  return children
}

function Router() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <RedirectIfSignedIn>
            <Login />
          </RedirectIfSignedIn>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfSignedIn>
            <SignUp />
          </RedirectIfSignedIn>
        }
      />

      {/* Public record — readable without an account */}
      <Route element={<AppShell />}>
        <Route path="/record" element={<PublicRecord />} />
        <Route path="/citizen" element={<Navigate to="/record" replace />} />

        {/* Ward Officer */}
        <Route
          path="/ward"
          element={
            <RequireAuth roles={['officer']}>
              <WardOverview />
            </RequireAuth>
          }
        />
        <Route
          path="/ward/discrepancies"
          element={
            <RequireAuth roles={['officer']}>
              <Discrepancies />
            </RequireAuth>
          }
        />
        <Route
          path="/ward/audit"
          element={
            <RequireAuth roles={['officer']}>
              <AuditTrail />
            </RequireAuth>
          }
        />

        {/* Field Inspector */}
        <Route
          path="/field"
          element={
            <RequireAuth roles={['inspector', 'officer']}>
              <InspectorInterface />
            </RequireAuth>
          }
        />

        {/* Contractor */}
        <Route
          path="/works"
          element={
            <RequireAuth roles={['contractor', 'officer']}>
              <ContractorPortal />
            </RequireAuth>
          }
        />
      </Route>

      {/* Backwards compatibility for links to the old single-page dashboard */}
      <Route path="/dashboard" element={<Navigate to="/ward" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </StoreProvider>
  )
}
