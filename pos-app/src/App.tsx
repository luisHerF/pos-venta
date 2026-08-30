import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Inventory from './pages/Inventory'
import Categories from './pages/Categories'
import Users from './pages/Users'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function Gate() {
  const { session, profile, loading, isAdmin } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>
  }

  if (!session) return <Login />
  if (!profile?.business_id) return <Onboarding />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ventas" element={<POS />} />
        <Route path="/inventario" element={<Inventory />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/reportes" element={<Reports />} />
        {isAdmin && <Route path="/usuarios" element={<Users />} />}
        {isAdmin && <Route path="/configuracion" element={<Settings />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  )
}
