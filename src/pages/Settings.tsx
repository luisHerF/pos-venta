import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { RUBRO_LIST, RUBRO_TEMPLATES, RubroKey } from '../lib/rubros'

export default function Settings() {
  const { business, refreshProfile } = useAuth()
  const [name, setName] = useState(business?.name || '')
  const [rubro, setRubro] = useState<RubroKey>((business?.rubro as RubroKey) || 'retail')
  const [currency, setCurrency] = useState(business?.currency || 'MXN')
  const [taxRate, setTaxRate] = useState(String(business?.tax_rate ?? 0))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('businesses').update({
      name, rubro, currency, tax_rate: Number(taxRate),
      theme_color: RUBRO_TEMPLATES[rubro].themeColor,
    }).eq('id', business!.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Configuración del negocio</h1>
      <p className="text-gray-500 mb-6">Personaliza el sistema según tu tipo de negocio</p>

      <div className="card mb-6">
        <label className="label">Nombre del negocio</label>
        <input className="input mb-4" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">Moneda</label>
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="COP">COP</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
          <div>
            <label className="label">Impuesto (%)</label>
            <input type="number" className="input" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="label mb-2">Rubro del negocio</div>
        <div className="grid grid-cols-2 gap-3">
          {RUBRO_LIST.map((t) => (
            <button key={t.key} onClick={() => setRubro(t.key)}
              className={`text-left card transition ${rubro === t.key ? 'ring-2 ring-brand-600' : 'hover:border-gray-300'}`}>
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="font-medium text-sm">{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
      </button>
    </div>
  )
}
