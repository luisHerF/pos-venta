import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, Profile, Business } from '../lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'

type AuthContextType = {
  session: Session | null
  profile: Profile | null
  business: Business | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isVendedor: boolean
  isInventarista: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfileAndBusiness(userId: string) {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(prof as Profile | null)
    if (prof?.business_id) {
      const { data: biz } = await supabase.from('businesses').select('*').eq('id', prof.business_id).maybeSingle()
      setBusiness(biz as Business | null)
    } else {
      setBusiness(null)
    }
  }

  async function refreshProfile() {
    if (session?.user?.id) await loadProfileAndBusiness(session.user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session?.user?.id) await loadProfileAndBusiness(data.session.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession?.user?.id) {
        await loadProfileAndBusiness(newSession.user.id)
      } else {
        setProfile(null)
        setBusiness(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session, profile, business, loading,
      isAdmin: profile?.role === 'admin',
      isSuperAdmin: profile?.role === 'super_admin',
      isVendedor: profile?.role === 'vendedor',
      isInventarista: profile?.role === 'inventarista',
      refreshProfile, signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
