import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import BarcodeScanner from '../components/BarcodeScanner'

type CartItem = {
  product_id: string
  name: string
  price: number
  quantity: number
  stock: number
}

export default function POS() {
  const { business, profile } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [payment, setPayment] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [discount, setDiscount] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [manualSearch, setManualSearch] = useState('')
  const currency = business?.currency || 'MXN'

  async function handleScan(code: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', business!.id)
      .or(`barcode.eq.${code},sku.eq.${code}`)
      .eq('active', true)
      .maybeSingle()

    if (error || !data) {
      setMessage(`No se encontró ningún producto con el código "${code}"`)
      return
    }
    addToCart({ product_id: data.id, name: data.name, price: Number(data.price), quantity: 1, stock: Number(data.stock) })
    setMessage(null)
  }

  async function handleManualSearch() {
    if (!manualSearch.trim()) return
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', business!.id)
      .ilike('name', `%${manualSearch}%`)
      .eq('active', true)
      .limit(5)
    if (data && data.length === 1) {
      addToCart({ product_id: data[0].id, name: data[0].name, price: Number(data[0].price), quantity: 1, stock: Number(data[0].stock) })
      setManualSearch('')
    } else if (data && data.length > 1) {
      setMessage('Hay varios resultados, usa el escáner o precisa más el nombre.')
    } else {
      setMessage('No se encontró el producto.')
    }
  }

  function addToCart(item: CartItem) {
    setCart((prev) => {
      const existing = prev.find((p) => p.product_id === item.product_id)
      if (existing) {
        return prev.map((p) => p.product_id === item.product_id ? { ...p, quantity: p.quantity + 1 } : p)
      }
      return [...prev, item]
    })
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((p) => p.product_id !== id))
    } else {
      setCart((prev) => prev.map((p) => p.product_id === id ? { ...p, quantity: qty } : p))
    }
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const taxRate = Number(business?.tax_rate || 0) / 100
  const tax = (subtotal - discount) * taxRate
  const total = subtotal - discount + tax

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n)

  async function checkout() {
    if (cart.length === 0) return
    setProcessing(true)
    setMessage(null)
    try {
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert({
          business_id: business!.id,
          user_id: profile!.id,
          subtotal, discount, tax, total,
          payment_method: payment,
          status: 'completada',
        })
        .select()
        .single()
      if (saleErr) throw saleErr

      const items = cart.map((i) => ({
        sale_id: sale.id,
        product_id: i.product_id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        subtotal: i.price * i.quantity,
      }))
      const { error: itemsErr } = await supabase.from('sale_items').insert(items)
      if (itemsErr) throw itemsErr

      setCart([])
      setDiscount(0)
      setMessage('✅ Venta registrada correctamente')
    } catch (err: any) {
      setMessage('Error al registrar la venta: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Punto de venta</h1>
      <p className="text-gray-500 mb-6">Escanea productos o búscalos por nombre</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <label className="label">Escanear código de barras</label>
            <BarcodeScanner onScan={handleScan} />
          </div>

          <div className="card">
            <label className="label">Buscar por nombre</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                placeholder="Ej. Playera azul talla M"
              />
              <button onClick={handleManualSearch} className="btn-secondary">Buscar</button>
            </div>
          </div>

          {message && <div className="text-sm p-3 rounded-xl bg-amber-50 text-amber-700">{message}</div>}

          <div className="card">
            <div className="font-semibold mb-3">Carrito ({cart.length})</div>
            {cart.length === 0 && <p className="text-sm text-gray-400">Aún no hay productos en el carrito.</p>}
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-gray-400">{fmt(item.price)} c/u</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="btn-secondary !px-2.5 !py-1">-</button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="btn-secondary !px-2.5 !py-1">+</button>
                    <span className="w-20 text-right text-sm font-medium">{fmt(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card h-fit sticky top-4">
          <div className="font-semibold mb-3">Resumen</div>
          <div className="space-y-1.5 text-sm mb-3">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Descuento</span>
              <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="input !py-1 !w-24 text-right" />
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Impuesto ({business?.tax_rate || 0}%)</span><span>{fmt(tax)}</span></div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100"><span>Total</span><span>{fmt(total)}</span></div>
          </div>

          <label className="label">Método de pago</label>
          <select className="input mb-4" value={payment} onChange={(e) => setPayment(e.target.value as any)}>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>

          <button onClick={checkout} disabled={processing || cart.length === 0} className="btn-primary w-full">
            {processing ? 'Procesando...' : 'Cobrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
