import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type Period = 'diario' | 'semanal' | 'mensual'

export default function Reports() {
  const { business, profile } = useAuth()
  const [period, setPeriod] = useState<Period>('diario')
  const [rows, setRows] = useState<any[]>([])
  const [closing, setClosing] = useState(false)
  const [closures, setClosures] = useState<any[]>([])
  const currency = business?.currency || 'MXN'
  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n)

  useEffect(() => { if (business?.id) load() }, [business?.id, period])

  async function load() {
    const view = period === 'diario' ? 'v_sales_daily' : period === 'semanal' ? 'v_sales_weekly' : 'v_sales_monthly'
    const { data } = await supabase.from(view).select('*').eq('business_id', business!.id).order(
      period === 'diario' ? 'day' : period === 'semanal' ? 'week' : 'month', { ascending: false }
    ).limit(12)
    setRows((data as any[]) || [])

    const { data: cls } = await supabase.from('cash_closures').select('*').eq('business_id', business!.id)
      .eq('period_type', period).order('created_at', { ascending: false }).limit(10)
    setClosures(cls || [])
  }

  function currentRange(): { start: Date; end: Date } {
    const now = new Date()
    if (period === 'diario') {
      const start = new Date(now); start.setHours(0, 0, 0, 0)
      const end = new Date(now); end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (period === 'semanal') {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0)
      const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }

  async function generateClosure() {
    setClosing(true)
    try {
      const { start, end } = currentRange()
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .eq('business_id', business!.id)
        .eq('status', 'completada')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

      const list = sales || []
      const total_sales = list.reduce((s, r) => s + Number(r.total), 0)
      const total_cash = list.filter((r) => r.payment_method === 'efectivo').reduce((s, r) => s + Number(r.total), 0)
      const total_card = list.filter((r) => r.payment_method === 'tarjeta').reduce((s, r) => s + Number(r.total), 0)
      const total_transfer = list.filter((r) => r.payment_method === 'transferencia').reduce((s, r) => s + Number(r.total), 0)

      await supabase.from('cash_closures').insert({
        business_id: business!.id,
        user_id: profile!.id,
        period_type: period,
        period_start: start.toISOString(),
        period_end: end.toISOString(),
        total_sales, total_cash, total_card, total_transfer,
        sales_count: list.length,
      })
      load()
    } finally {
      setClosing(false)
    }
  }

  const chartData = [...rows].reverse().map((r) => ({
    name: period === 'diario' ? new Date(r.day).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      : period === 'semanal' ? new Date(r.week).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      : new Date(r.month).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
    total: Number(r.total),
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Reportes y cortes de caja</h1>
      <p className="text-gray-500 mb-6">Consulta tus ventas y genera cortes de caja</p>

      <div className="flex gap-2 mb-6">
        {(['diario', 'semanal', 'mensual'] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`btn-secondary !rounded-full capitalize ${period === p ? '!bg-brand-600 !text-white !border-brand-600' : ''}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="card mb-6">
        <div className="font-semibold mb-3">Ventas — vista {period}</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" />
            <YAxis fontSize={12} stroke="#94a3b8" />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Corte de caja {period}</div>
          <button onClick={generateClosure} disabled={closing} className="btn-primary">
            {closing ? 'Generando...' : `Generar corte ${period}`}
          </button>
        </div>
        <p className="text-sm text-gray-500">Genera un corte con el periodo {period} actual (efectivo, tarjeta y transferencia).</p>
      </div>

      <div className="card overflow-x-auto">
        <div className="font-semibold mb-3">Historial de cortes</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-2 pr-3">Fecha</th>
              <th className="pb-2 pr-3">Tickets</th>
              <th className="pb-2 pr-3">Efectivo</th>
              <th className="pb-2 pr-3">Tarjeta</th>
              <th className="pb-2 pr-3">Transferencia</th>
              <th className="pb-2 pr-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {closures.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 pr-3">{new Date(c.created_at).toLocaleString('es-MX')}</td>
                <td className="py-2 pr-3">{c.sales_count}</td>
                <td className="py-2 pr-3">{fmt(c.total_cash)}</td>
                <td className="py-2 pr-3">{fmt(c.total_card)}</td>
                <td className="py-2 pr-3">{fmt(c.total_transfer)}</td>
                <td className="py-2 pr-3 font-semibold">{fmt(c.total_sales)}</td>
              </tr>
            ))}
            {closures.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-400">Aún no hay cortes generados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
