import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'reshub_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY))

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const authenticate = async (path, payload) => {
    const { data } = await api.post(path, payload)
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }

  const login = (payload) => authenticate('/auth/login', payload)
  const register = (payload) => authenticate('/auth/register', payload)

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
