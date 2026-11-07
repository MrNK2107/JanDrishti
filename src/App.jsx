import { Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { StoreProvider } from './store/StoreProvider'
import { AppShell } from './components/AppShell'
import AdminDashboard from './pages/AdminDashboard'
import ContractorPortal from './pages/ContractorPortal'
import InspectorInterface from './pages/InspectorInterface'
import CitizenPortal from './pages/CitizenPortal'

const CODE = {
  '/': {
    title: 'Ward Admin — Reconciliation Review',
    subtitle: 'Ward 12, Greater Chennai · Public Works',
  },
  '/contractor': {
    title: 'Contractor Portal — Milestone Claims',
    subtitle: 'Submit reported completion against sanctioned scope',
  },
  '/inspector': {
    title: 'Field Inspector — Independent Observation',
    subtitle: 'Record what was physically found on site',
  },
  '/citizen': {
    title: 'Citizen Record — Public Transparency',
    subtitle: 'Approved, reported, observed, and resolved',
  },
}

function Shell() {
  const { pathname } = useLocation()
  return (
    <AppShell code={CODE[pathname] ?? CODE['/']}>
      <Outlet />
    </AppShell>
  )
}

function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/contractor" element={<ContractorPortal />} />
          <Route path="/inspector" element={<InspectorInterface />} />
          <Route path="/citizen" element={<CitizenPortal />} />
        </Route>
      </Routes>
    </StoreProvider>
  )
}

export default App
