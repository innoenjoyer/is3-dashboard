import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import ArchitecturePage from './pages/ArchitecturePage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
      </Routes>
    </AppShell>
  )
}
