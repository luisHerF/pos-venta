import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

type UserRow = { id: string; full_name: string | null; role: string; active: boolean }

export default function Users() {
  const { business } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => { if (business?.id) load() }, [business?.id])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').eq('business_id', business!.id).order('created_at')
    setUsers((data as UserRow[]) || [])
  }

  async function toggleRole(u: UserRow) {
    const newRole = u.role === 'admin' ? 'vendedor' : 'admin'
    await supabase.from('profiles').update({ role: newRole }).eq('id', u.id)
    load()
  }

  async function toggleActive(u: UserRow) {
    await supabase.from('profiles').update({ active: !u.active }).eq('id', u.id)
    load()
  }

  function copyCode() {
    navigator.clipboard.writeText(business?.id || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Usuarios</h1>
      <p className="text-gray-500 mb-6">Administra quién tiene acceso a tu negocio y con qué rol</p>

      <div className="card mb-6">
        <div className="font-semibold mb-2">Código de invitación</div>
        <p className="text-sm text-gray-500 mb-3">Comparte este código con tus empleados: lo usarán al crear su cuenta para unirse a tu negocio como vendedores.</p>
        <div className="flex gap-2">
          <input readOnly className="input flex-1 font-mono text-xs" value={business?.id || ''} />
          <button onClick={copyCode} className="btn-secondary">{copied ? '✓ Copiado' : 'Copiar'}</button>
        </div>
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
                <td className="py-2 pr-3 capitalize">{u.role}</td>
                <td className="py-2 pr-3">{u.active ? '🟢 Activo' : '⚪ Inactivo'}</td>
                <td className="py-2 pr-3 text-right whitespace-nowrap">
                  <button onClick={() => toggleRole(u)} className="text-brand-600 hover:underline mr-3">
                    Hacer {u.role === 'admin' ? 'vendedor' : 'admin'}
                  </button>
                  <button onClick={() => toggleActive(u)} className="text-gray-500 hover:underline">
                    {u.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
