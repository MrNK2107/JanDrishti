import { Routes, Route } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import ContractorPortal from './pages/ContractorPortal'
import InspectorInterface from './pages/InspectorInterface'
import CitizenPortal from './pages/CitizenPortal'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/contractor" element={<ContractorPortal />} />
      <Route path="/inspector" element={<InspectorInterface />} />
      <Route path="/citizen" element={<CitizenPortal />} />
    </Routes>
  )
}

export default App
