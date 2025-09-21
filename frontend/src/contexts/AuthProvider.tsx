import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import axios from 'axios'
import { TOKEN_KEY, API_ENDPOINTS, MESSAGES } from '../constants'

type LoginResult = { success: true } | { success: false; error: string }

type AuthContextType = {
  token: string
  user: any
  isAuthenticated: boolean
  isLoading: boolean
  status: string
  statusErr: string
  login: (credentials: { username: string; password: string }) => Promise<LoginResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const tokenKey = TOKEN_KEY

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string>(() => localStorage.getItem(tokenKey) || '')
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [status, setStatus] = useState<string>(MESSAGES.LOADING)
  const [statusErr, setStatusErr] = useState<string>('')

  // Initialize axios defaults if token exists
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete (axios.defaults.headers.common as any)['Authorization']
    }
  }, [token])

  // Check backend health status
  useEffect(() => {
    let cancelled = false
    axios
      .get(API_ENDPOINTS.HEALTH)
      .then((r) => {
        if (!cancelled) {
          setStatus((r.data as any).status || 'ok')
          setStatusErr('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error')
          setStatusErr((err as Error)?.message || 'unreachable')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = async (credentials: { username: string; password: string }): Promise<LoginResult> => {
    setIsLoading(true)
    try {
      const res = await axios.post(API_ENDPOINTS.LOGIN, credentials)
      const newToken = (res.data as any).token as string
      const userData = (res.data as any).user

      setToken(newToken)
      setUser(userData)
      localStorage.setItem(tokenKey, newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

      return { success: true }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || MESSAGES.LOGIN_ERROR
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    delete (axios.defaults.headers.common as any)['Authorization']
    localStorage.removeItem(tokenKey)
  }

  const isAuthenticated = !!token

  const value: AuthContextType = {
    token,
    user,
    isAuthenticated,
    isLoading,
    status,
    statusErr,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
