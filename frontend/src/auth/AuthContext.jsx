import { createContext, useContext, useMemo, useState } from 'react'
import api from '../api/http.js'
import { clearAuth, getStoredUser, persistAuth, persistUser } from './tokenStorage.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())

  const value = useMemo(() => {
    async function register(payload) {
      const { data } = await api.post('/api/auth/register', payload)
      return data
    }

    async function verifyCode(payload) {
      const { data } = await api.post('/api/auth/verify-code', payload)
      persistAuth(data)
      setUser(data.user)
      return data
    }

    async function login(payload) {
      const { data } = await api.post('/api/auth/login', payload)
      persistAuth(data)
      setUser(data.user)
      return data
    }

    async function refreshUser() {
      try {
        const { data } = await api.get('/api/auth/me')
        persistUser(data)
        setUser(data)
        return data
      } catch (err) {
        console.error('Failed to refresh user profile:', err)
        return null
      }
    }

    function logout() {
      clearAuth()
      setUser(null)
    }

    return {
      user,
      isAuthenticated: Boolean(user),
      register,
      verifyCode,
      login,
      refreshUser,
      logout,
    }
  }, [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
