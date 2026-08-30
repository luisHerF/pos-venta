import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type DailyRow = { day: string; total: number; sales_count: number }
type LowStock = { id: string; name: string; stock: number; min_stock: number }
type TopProduct = { product_name: string; total_quantity: number; total_revenue: number }

export default function Dashboard() {
  const { business } = useAuth()
  const [today, setToday] = useState({ total: 0, count: 0 })
  const [weekTotal, setWeekTotal] = useState(0)
  const [monthTotal, setMonthTotal] = useState(0)
  const [chartData, setChartData] = useState<{ name: string; total: number }[]>([])
  const [lowStock, setLowStock] = useState<LowStock[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const currency = business?.currency || 'MXN'

  useEffect(() => {
    if (!business?.id) return
    loadData()
  }, [business?.id])

  async function loadData() {
    const { data: daily } = await supabase
      .from('v_sales_daily')
      .select('*')
      .eq('business_id', business!.id)
      .order('day', { ascending: false })
      .limit(14)

    const rows = (daily as DailyRow[]) || []
    const todayStr = new Date().toISOString().slice(0, 10)
    const todayRow = rows.find((r) => r.day.slice(0, 10) === todayStr)
    setToday({ total: todayRow?.total || 0, count: todayRow?.sales_count || 0 })

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    setWeekTotal(rows.filter((r) => new Date(r.day) >= sevenDaysAgo).reduce((s, r) => s + Number(r.total), 0))

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    setMonthTotal(rows.filter((r) => new Date(r.day) >= thirtyDaysAgo).reduce((s, r) => s + Number(r.total), 0))

    setChartData(
      [...rows].reverse().map((r) => ({
        name: new Date(r.day).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
        total: Number(r.total),
      }))
    )

    const { data: low } = await supabase.from('v_low_stock').select('*').eq('business_id', business!.id).limit(8)
    setLowStock((low as LowStock[]) || [])

    const { data: top } = await supabase
      .from('v_top_products')
      .select('*')
      .eq('business_id', business!.id)
      .order('total_quantity', { ascending: false })
      .limit(5)
    setTopProducts((top as TopProduct[]) || [])
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Panel de control</h1>
      <p className="text-gray-500 mb-6">Resumen de tu negocio en tiempo real</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="text-xs text-gray-500 mb-1">Ventas de hoy</div>
          <div className="text-2xl font-bold">{fmt(today.total)}</div>
          <div className="text-xs text-gray-400 mt-1">{today.count} tickets</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500 mb-1">Últimos 7 días</div>
          <div className="text-2xl font-bold">{fmt(weekTotal)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500 mb-1">Últimos 30 días</div>
          <div className="text-2xl font-bold">{fmt(monthTotal)}</div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="font-semibold mb-3">Ventas de los últimos 14 días</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" />
            <YAxis fontSize={12} stroke="#94a3b8" />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-semibold mb-3">Más vendidos</div>
          {topProducts.length === 0 && <p className="text-sm text-gray-400">Aún no hay ventas registradas.</p>}
          <ul className="space-y-2">
            {topProducts.map((p, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>{p.product_name}</span>
                <span className="text-gray-500">{p.total_quantity} uds · {fmt(p.total_revenue)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="font-semibold mb-3">⚠️ Stock bajo</div>
          {lowStock.length === 0 && <p className="text-sm text-gray-400">Todo tu inventario está en buen nivel.</p>}
          <ul className="space-y-2">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between text-sm">
                <span>{p.name}</span>
                <span className="text-red-600 font-medium">{p.stock} / mín {p.min_stock}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
