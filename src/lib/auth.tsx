import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { adminApi, tokenStore } from './api'
import type { AdminUser } from './types'

type Auth = { user: AdminUser | null; login: (email: string, password: string) => Promise<void>; logout: () => void }
const Ctx = createContext<Auth | null>(null)
export const useAuth = () => useContext(Ctx)!

const USER_KEY = 'pf_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try { return tokenStore.get() ? (JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as AdminUser | null) : null } catch { return null }
  })

  useEffect(() => {
    const onUnauthorized = () => { localStorage.removeItem(USER_KEY); setUser(null) }
    window.addEventListener('pf:unauthorized', onUnauthorized)
    return () => window.removeEventListener('pf:unauthorized', onUnauthorized)
  }, [])

  const value: Auth = {
    user,
    login: async (email, password) => {
      const r = await adminApi.login(email, password)
      tokenStore.set(r.accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(r.user))
      setUser(r.user)
    },
    logout: () => { tokenStore.clear(); localStorage.removeItem(USER_KEY); setUser(null) },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
