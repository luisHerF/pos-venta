import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { RUBRO_TEMPLATES } from '../lib/rubros'
import BarcodeScanner from '../components/BarcodeScanner'

type Product = {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  price: number
  cost: number
  stock: number
  min_stock: number
  unit: string
  category_id: string | null
  attributes: Record<string, string>
}

type Category = { id: string; name: string }

const emptyForm = {
  id: '', name: '', sku: '', barcode: '', price: '0', cost: '0',
  stock: '0', min_stock: '0', unit: '', category_id: '', attributes: {} as Record<string, string>,
}

export default function Inventory() {
  const { business } = useAuth()
  const template = RUBRO_TEMPLATES[(business?.rubro as any) || 'retail']
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm, unit: template.unitDefault })
  const [saving, setSaving] = useState(false)
  const [scanMode, setScanMode] = useState(false)

  useEffect(() => { if (business?.id) loadAll() }, [business?.id])

  async function loadAll() {
    const { data: prods } = await supabase.from('products').select('*').eq('business_id', business!.id).order('created_at', { ascending: false })
    setProducts((prods as Product[]) || [])
    const { data: cats } = await supabase.from('categories').select('*').eq('business_id', business!.id).order('name')
    setCategories((cats as Category[]) || [])
  }

  function openNew(prefillBarcode?: string) {
    setForm({ ...emptyForm, unit: template.unitDefault, barcode: prefillBarcode || '' })
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setForm({
      id: p.id, name: p.name, sku: p.sku || '', barcode: p.barcode || '',
      price: String(p.price), cost: String(p.cost), stock: String(p.stock),
      min_stock: String(p.min_stock), unit: p.unit, category_id: p.category_id || '',
      attributes: p.attributes || {},
    })
    setShowForm(true)
  }

  async function handleScanForNew(code: string) {
    // Si el código ya existe, abre para editar/reabastecer; si no, precarga alta nueva
    const existing = products.find((p) => p.barcode === code)
    if (existing) {
      openEdit(existing)
    } else {
      openNew(code)
    }
  }

  async function saveProduct() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      business_id: business!.id,
      name: form.name,
      sku: form.sku || null,
      barcode: form.barcode || null,
      price: Number(form.price),
      cost: Number(form.cost),
      stock: Number(form.stock),
      min_stock: Number(form.min_stock),
      unit: form.unit,
      category_id: form.category_id || null,
      attributes: form.attributes,
    }
    if (form.id) {
      await supabase.from('products').update(payload).eq('id', form.id)
    } else {
      await supabase.from('products').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    loadAll()
  }

  async function deleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').update({ active: false }).eq('id', id)
    loadAll()
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || '').includes(search) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold">{template.productLabelPlural}</h1>
        <div className="flex gap-2">
          <button onClick={() => setScanMode(!scanMode)} className="btn-secondary">
            {scanMode ? 'Cerrar escáner' : '📷 Alta rápida por escaneo'}
          </button>
          <button onClick={() => openNew()} className="btn-primary">+ Nuevo {template.productLabel.toLowerCase()}</button>
        </div>
      </div>
      <p className="text-gray-500 mb-6">Administra tu inventario de {template.productLabelPlural.toLowerCase()}</p>

      {scanMode && (
        <div className="card mb-6">
          <label className="label">Escanea para dar de alta o reabastecer</label>
          <BarcodeScanner onScan={handleScanForNew} />
        </div>
      )}

      <input
        className="input mb-4"
        placeholder="Buscar por nombre, código o SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-2 pr-3">Nombre</th>
              <th className="pb-2 pr-3">Código</th>
              <th className="pb-2 pr-3">Precio</th>
              <th className="pb-2 pr-3">Stock</th>
              <th className="pb-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 pr-3 font-medium">{p.name}</td>
                <td className="py-2 pr-3 text-gray-400">{p.barcode || p.sku || '—'}</td>
                <td className="py-2 pr-3">${p.price}</td>
                <td className={`py-2 pr-3 ${p.stock <= p.min_stock ? 'text-red-600 font-medium' : ''}`}>{p.stock} {p.unit}</td>
                <td className="py-2 pr-3 text-right whitespace-nowrap">
                  <button onClick={() => openEdit(p)} className="text-brand-600 hover:underline mr-3">Editar</button>
                  <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-400">No hay productos aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{form.id ? 'Editar' : 'Nuevo'} {template.productLabel.toLowerCase()}</h2>

            <label className="label">Nombre</label>
            <input className="input mb-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label">Código de barras</label>
                <input className="input" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </div>
              <div>
                <label className="label">SKU</label>
                <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label">Precio de venta</label>
                <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className="label">Costo</label>
                <input type="number" className="input" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="label">Stock</label>
                <input type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div>
                <label className="label">Stock mínimo</label>
                <input type="number" className="input" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
              </div>
              <div>
                <label className="label">Unidad</label>
                <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>

            <label className="label">Categoría</label>
            <select className="input mb-3" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {template.extraAttributes.length > 0 && (
              <div className="mb-3 space-y-3">
                {template.extraAttributes.map((attr) => (
                  <div key={attr.key}>
                    <label className="label">{attr.label}</label>
                    {attr.type === 'select' ? (
                      <select
                        className="input"
                        value={form.attributes[attr.key] || ''}
                        onChange={(e) => setForm({ ...form, attributes: { ...form.attributes, [attr.key]: e.target.value } })}
                      >
                        <option value="">—</option>
                        {attr.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        className="input"
                        value={form.attributes[attr.key] || ''}
                        onChange={(e) => setForm({ ...form, attributes: { ...form.attributes, [attr.key]: e.target.value } })}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={saveProduct} disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
