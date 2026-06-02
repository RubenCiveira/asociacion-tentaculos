import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { OAuthProvider, type Models } from 'appwrite'
import { account } from '@/lib/appwrite'

interface AuthContextValue {
  user: Models.User<Models.Preferences> | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    account.get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password)
    const me = await account.get()
    setUser(me)
  }

  function loginWithGoogle() {
    const base = (import.meta.env.VITE_BASE_PATH ?? '/').replace(/\/$/, '')
    const origin = window.location.origin
    account.createOAuth2Session(
      OAuthProvider.Google,
      `${origin}${base}/#/`,
      `${origin}${base}/#/login`,
    )
  }

  async function logout() {
    await account.deleteSession('current')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
