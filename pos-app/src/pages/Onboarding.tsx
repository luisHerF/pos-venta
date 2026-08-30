import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { RUBRO_LIST, RubroKey, RUBRO_TEMPLATES } from '../lib/rubros'

export default function Onboarding() {
  const { session, refreshProfile } = useAuth()
  const [name, setName] = useState('')
  const [rubro, setRubro] = useState<RubroKey>('retail')
  const [currency, setCurrency] = useState('MXN')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!session?.user?.id || !name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const template = RUBRO_TEMPLATES[rubro]
      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .insert({
          name,
          rubro,
          currency,
          tax_rate: template.taxRateDefault,
          theme_color: template.themeColor,
          settings: { extraAttributes: template.extraAttributes },
        })
        .select()
        .single()
      if (bizErr) throw bizErr

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ business_id: biz.id, role: 'admin' })
        .eq('id', session.user.id)
      if (profErr) throw profErr

      await refreshProfile()
    } catch (err: any) {
      setError(err.message ?? 'Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Configura tu negocio</h1>
        <p className="text-gray-500 mb-6">Elige el rubro que más se parezca al tuyo. Podrás personalizarlo después.</p>

        <div className="card mb-6">
          <label className="label">Nombre del negocio</label>
          <input className="input mb-4" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Tienda Don Luis" />

          <label className="label">Moneda</label>
          <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="MXN">MXN - Peso mexicano</option>
            <option value="USD">USD - Dólar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="COP">COP - Peso colombiano</option>
            <option value="ARS">ARS - Peso argentino</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {RUBRO_LIST.map((t) => (
            <button
              key={t.key}
              onClick={() => setRubro(t.key)}
              className={`text-left card transition ${rubro === t.key ? 'ring-2 ring-brand-600' : 'hover:border-gray-300'}`}
            >
              <div className="text-3xl mb-2">{t.icon}</div>
              <div className="font-semibold">{t.label}</div>
              <div className="text-xs text-gray-500 mt-1">Gestiona tus {t.productLabelPlural.toLowerCase()}</div>
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button onClick={handleCreate} disabled={loading || !name.trim()} className="btn-primary w-full">
          {loading ? 'Creando...' : 'Comenzar a usar mi POS'}
        </button>
      </div>
    </div>
  )
}
