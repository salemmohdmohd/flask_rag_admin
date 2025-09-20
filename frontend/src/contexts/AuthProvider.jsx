import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { TOKEN_KEY, API_ENDPOINTS, MESSAGES } from '../constants'

const AuthContext = createContext()

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}

const tokenKey = 'token' // Use 'token' to match what useChat.js expects

export const AuthProvider = ({ children }) => {
	const [token, setToken] = useState(() => localStorage.getItem(tokenKey) || '')
	const [user, setUser] = useState(null)
	const [isLoading, setIsLoading] = useState(false)
	const [status, setStatus] = useState(MESSAGES.LOADING)
	const [statusErr, setStatusErr] = useState('')

	// Initialize axios defaults if token exists
	useEffect(() => {
		if (token) {
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
		} else {
			delete axios.defaults.headers.common['Authorization']
		}
	}, [token])

	// Check backend health status
	useEffect(() => {
		let cancelled = false
		axios.get(API_ENDPOINTS.HEALTH)
			.then(r => {
				if (!cancelled) {
					setStatus(r.data.status || 'ok')
					setStatusErr('')
				}
			})
			.catch(err => {
				if (!cancelled) {
					setStatus('error')
					setStatusErr(err?.message || 'unreachable')
				}
			})
		return () => { cancelled = true }
	}, [])

	const login = async (credentials) => {
		setIsLoading(true)
		try {
			const res = await axios.post(API_ENDPOINTS.LOGIN, credentials)
			const newToken = res.data.token
			const userData = res.data.user

			setToken(newToken)
			setUser(userData)
			localStorage.setItem(tokenKey, newToken)
			axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

			return { success: true }
		} catch (err) {
			const errorMessage = err?.response?.data?.error || MESSAGES.LOGIN_ERROR
			return { success: false, error: errorMessage }
		} finally {
			setIsLoading(false)
		}
	}

	const logout = () => {
		setToken('')
		setUser(null)
		delete axios.defaults.headers.common['Authorization']
		localStorage.removeItem(tokenKey)
	}

	const isAuthenticated = !!token

	const value = {
		token,
		user,
		isAuthenticated,
		isLoading,
		status,
		statusErr,
		login,
		logout
	}

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	)
}

export default AuthProvider