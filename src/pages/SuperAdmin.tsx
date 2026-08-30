import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { RUBRO_LIST, RUBRO_TEMPLATES, RubroKey } from '../lib/rubros'
import { useAuth } from '../context/AuthContext'

type BusinessRow = {
  id: string
  name: string
  rubro: RubroKey
  currency: string
  created_at: string
}

export default function SuperAdmin() {
  const { signOut, profile } = useAuth()
  const [businesses, setBusinesses] = useState<BusinessRow[]>([])
  const [name, setName] = useState('')
  const [rubro, setRubro] = useState<RubroKey>('retail')
  const [currency, setCurrency] = useState('MXN')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('businesses').select('*').order('created_at', { ascending: false })
    setBusinesses((data as BusinessRow[]) || [])
  }

  async function createBusiness() {
    if (!name.trim()) return
    setCreating(true)
    const template = RUBRO_TEMPLATES[rubro]
    await supabase.from('businesses').insert({
      name, rubro, currency,
      tax_rate: template.taxRateDefault,
      theme_color: template.themeColor,
      settings: { extraAttributes: template.extraAttributes },
    })
    setName('')
    setCreating(false)
    load()
  }

  function copyCode(businessId: string, role: string) {
    navigator.clipboard.writeText(`${businessId}:${role}`)
    setCopiedId(businessId + role)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">👑 Panel de super administrador</h1>
          <button onClick={signOut} className="btn-secondary">Cerrar sesión</button>
        </div>
        <p className="text-gray-500 mb-6">
          Hola {profile?.full_name}. Aquí creas nuevas tiendas y generas el código de invitación para su administrador.
        </p>

        <div className="card mb-6">
          <div className="font-semibold mb-3">Crear nueva tienda</div>
          <input className="input mb-3" placeholder="Nombre de la tienda" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select className="input" value={rubro} onChange={(e) => setRubro(e.target.value as RubroKey)}>
              {RUBRO_LIST.map((t) => <option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
            </select>
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="COP">COP</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
          <button onClick={createBusiness} disabled={creating || !name.trim()} className="btn-primary">
            {creating ? 'Creando...' : '+ Crear tienda'}
          </button>
        </div>

        <div className="space-y-3">
          {businesses.map((b) => {
            const t = RUBRO_TEMPLATES[b.rubro] || RUBRO_TEMPLATES.retail
            return (
              <div key={b.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.icon}</span>
                    <div>
                      <div className="font-semibold">{b.name}</div>
                      <div className="text-xs text-gray-400">{t.label} · {b.currency}</div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-2">Códigos de invitación para esta tienda:</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => copyCode(b.id, 'admin')} className="btn-secondary !text-xs">
                    {copiedId === b.id + 'admin' ? '✓ Copiado' : '👤 Copiar código de Administrador'}
                  </button>
                  <button onClick={() => copyCode(b.id, 'vendedor')} className="btn-secondary !text-xs">
                    {copiedId === b.id + 'vendedor' ? '✓ Copiado' : '🛒 Copiar código de Vendedor'}
                  </button>
                  <button onClick={() => copyCode(b.id, 'inventarista')} className="btn-secondary !text-xs">
                    {copiedId === b.id + 'inventarista' ? '✓ Copiado' : '📦 Copiar código de Inventarista'}
                  </button>
                </div>
              </div>
            )
          })}
          {businesses.length === 0 && <p className="text-sm text-gray-400">Aún no has creado ninguna tienda.</p>}
        </div>
      </div>
    </div>
  )
}
