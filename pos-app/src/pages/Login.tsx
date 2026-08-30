import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            business_id: inviteCode.trim() || null,
            role: inviteCode.trim() ? 'vendedor' : 'admin', // sin código = crea negocio nuevo (admin)
          })
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 to-brand-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🧾</div>
          <h1 className="text-2xl font-bold text-white">POS Multi-rubro</h1>
          <p className="text-brand-100 text-sm">Ventas, inventario y reportes en un solo lugar</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <div className="flex mb-4 rounded-xl bg-gray-100 p-1">
            <button type="button" onClick={() => setMode('signin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === 'signin' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
              Iniciar sesión
            </button>
            <button type="button" onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === 'signup' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
              Crear cuenta
            </button>
          </div>

          {mode === 'signup' && (
            <>
              <div className="mb-3">
                <label className="label">Nombre completo</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="label">Código de negocio (opcional, si un admin te invitó)</label>
                <input className="input" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Déjalo vacío para crear un negocio nuevo" />
              </div>
            </>
          )}

          <div className="mb-3">
            <label className="label">Correo</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="mb-4">
            <label className="label">Contraseña</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Cargando...' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
