import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Pending from './pages/Pending'
import SuperAdmin from './pages/SuperAdmin'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Inventory from './pages/Inventory'
import Categories from './pages/Categories'
import Users from './pages/Users'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function Gate() {
  const { session, profile, loading, isAdmin, isSuperAdmin, isVendedor, isInventarista } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>
  }

  if (!session) return <Login />
  if (isSuperAdmin) return <SuperAdmin />
  if (!profile?.business_id) return <Pending />

  const canSell = isAdmin || isVendedor
  const canManageInventory = isAdmin || isInventarista

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        {canSell && <Route path="/ventas" element={<POS />} />}
        {canManageInventory && <Route path="/inventario" element={<Inventory />} />}
        {canManageInventory && <Route path="/categorias" element={<Categories />} />}
        {isAdmin && <Route path="/reportes" element={<Reports />} />}
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
