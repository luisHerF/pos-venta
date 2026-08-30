import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RUBRO_TEMPLATES } from '../lib/rubros'
import { useState } from 'react'

export default function Layout() {
  const { profile, business, isAdmin, isVendedor, isInventarista, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const template = RUBRO_TEMPLATES[(business?.rubro as any) || 'retail']
  const canSell = isAdmin || isVendedor
  const canManageInventory = isAdmin || isInventarista

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
      isActive ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`

  const nav = (
    <nav className="space-y-1">
      <NavLink to="/" end className={linkClass}>📊 Panel</NavLink>
      {canSell && <NavLink to="/ventas" className={linkClass}>🛒 Punto de venta</NavLink>}
      {canManageInventory && <NavLink to="/inventario" className={linkClass}>📦 {template.productLabelPlural}</NavLink>}
      {canManageInventory && <NavLink to="/categorias" className={linkClass}>🏷️ Categorías</NavLink>}
      {isAdmin && <NavLink to="/reportes" className={linkClass}>📈 Reportes y cortes</NavLink>}
      {isAdmin && <NavLink to="/usuarios" className={linkClass}>👥 Usuarios</NavLink>}
      {isAdmin && <NavLink to="/configuracion" className={linkClass}>⚙️ Configuración</NavLink>}
    </nav>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-100 p-4">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <span className="text-2xl">{template.icon}</span>
          <div>
            <div className="font-bold text-sm leading-tight">{business?.name || 'Mi negocio'}</div>
            <div className="text-xs text-gray-400">{template.label}</div>
          </div>
        </div>
        {nav}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="px-2 py-2 text-xs text-gray-500">
            {profile?.full_name} · <span className="capitalize">{profile?.role}</span>
          </div>
          <button onClick={signOut} className="btn-secondary w-full mt-1">Cerrar sesión</button>
        </div>
      </aside>

      {/* Header mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{template.icon}</span>
          <span className="font-bold text-sm">{business?.name}</span>
        </div>
        <button onClick={() => setOpen(!open)} className="btn-secondary !px-3 !py-1.5">☰</button>
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-30 pt-14" onClick={() => setOpen(false)}>
          <div className="bg-white p-4 h-full w-64" onClick={(e) => e.stopPropagation()}>
            {nav}
            <button onClick={signOut} className="btn-secondary w-full mt-4">Cerrar sesión</button>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
