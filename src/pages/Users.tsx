import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

type UserRow = { id: string; full_name: string | null; role: string; active: boolean }

const ROLE_LABELS: Record<string, string> = {
  admin: '👤 Administrador',
  vendedor: '🛒 Vendedor',
  inventarista: '📦 Inventarista',
  sin_asignar: '⏳ Sin asignar',
}

export default function Users() {
  const { business } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => { if (business?.id) load() }, [business?.id])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').eq('business_id', business!.id).order('created_at')
    setUsers((data as UserRow[]) || [])
  }

  async function setRole(u: UserRow, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', u.id)
    load()
  }

  async function toggleActive(u: UserRow) {
    await supabase.from('profiles').update({ active: !u.active }).eq('id', u.id)
    load()
  }

  function copyCode(role: string) {
    navigator.clipboard.writeText(`${business?.id}:${role}`)
    setCopied(role)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Usuarios</h1>
      <p className="text-gray-500 mb-6">Administra quién tiene acceso a tu tienda y con qué rol</p>

      <div className="card mb-6">
        <div className="font-semibold mb-2">Códigos de invitación de tu tienda</div>
        <p className="text-sm text-gray-500 mb-3">
          Comparte el código correspondiente con cada persona: lo pegan en el campo "Código de invitación" al crear su cuenta.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => copyCode('vendedor')} className="btn-secondary !text-xs">
            {copied === 'vendedor' ? '✓ Copiado' : '🛒 Copiar código de Vendedor'}
          </button>
          <button onClick={() => copyCode('inventarista')} className="btn-secondary !text-xs">
            {copied === 'inventarista' ? '✓ Copiado' : '📦 Copiar código de Inventarista'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Nota: para agregar otro Administrador a tu tienda, pide a tu super administrador que genere ese código.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-2 pr-3">Nombre</th>
              <th className="pb-2 pr-3">Rol</th>
              <th className="pb-2 pr-3">Estado</th>
              <th className="pb-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 pr-3">{u.full_name || '—'}</td>
                <td className="py-2 pr-3">
                  <select
                    className="input !py-1 !text-xs !w-auto"
                    value={u.role}
                    onChange={(e) => setRole(u, e.target.value)}
                  >
                    <option value="vendedor">{ROLE_LABELS.vendedor}</option>
                    <option value="inventarista">{ROLE_LABELS.inventarista}</option>
                    <option value="admin">{ROLE_LABELS.admin}</option>
                    <option value="sin_asignar">{ROLE_LABELS.sin_asignar}</option>
                  </select>
                </td>
                <td className="py-2 pr-3">{u.active ? '🟢 Activo' : '⚪ Inactivo'}</td>
                <td className="py-2 pr-3 text-right whitespace-nowrap">
                  <button onClick={() => toggleActive(u)} className="text-gray-500 hover:underline">
                    {u.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-gray-400">Aún no hay usuarios.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
