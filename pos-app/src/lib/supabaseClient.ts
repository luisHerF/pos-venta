import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true }
})

export type Profile = {
  id: string
  business_id: string | null
  full_name: string | null
  role: 'admin' | 'vendedor'
  active: boolean
}

export type Business = {
  id: string
  name: string
  rubro: string
  currency: string
  tax_rate: number
  logo_url: string | null
  theme_color: string | null
  settings: Record<string, any>
}
