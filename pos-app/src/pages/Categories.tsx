import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

type Category = { id: string; name: string }

export default function Categories() {
  const { business } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')

  useEffect(() => { if (business?.id) load() }, [business?.id])

  async function load() {
    const { data } = await supabase.from('categories').select('*').eq('business_id', business!.id).order('name')
    setCategories((data as Category[]) || [])
  }

  async function add() {
    if (!name.trim()) return
    await supabase.from('categories').insert({ business_id: business!.id, name })
    setName('')
    load()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar categoría?')) return
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Categorías</h1>
      <p className="text-gray-500 mb-6">Organiza tus productos para encontrarlos más rápido</p>

      <div className="card mb-6 flex gap-2">
        <input className="input flex-1" placeholder="Nombre de la categoría" value={name}
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button onClick={add} className="btn-primary">Agregar</button>
      </div>

      <div className="card">
        <ul className="divide-y divide-gray-50">
          {categories.map((c) => (
            <li key={c.id} className="flex justify-between items-center py-2.5">
              <span>{c.name}</span>
              <button onClick={() => remove(c.id)} className="text-red-500 text-sm hover:underline">Eliminar</button>
            </li>
          ))}
          {categories.length === 0 && <p className="text-sm text-gray-400 py-2">Aún no hay categorías.</p>}
        </ul>
      </div>
    </div>
  )
}
