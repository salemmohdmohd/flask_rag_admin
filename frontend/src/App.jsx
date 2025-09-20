import React, { useState } from 'react'
import axios from 'axios'
import AuthProvider, { useAuth } from './contexts/AuthProvider'
import { Dashboard, LandingPage } from './components'

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/api'

function AppContent() {
	const { isAuthenticated, status, statusErr, login, logout, isLoading } = useAuth()
	const [loginError, setLoginError] = useState('')

	const handleLogin = async (credentials) => {
		setLoginError('')
		const result = await login(credentials)
		if (!result.success) {
			setLoginError(result.error)
		}
	}

	if (isAuthenticated) {
		return <Dashboard onLogout={logout} />
	}

	return (
		<LandingPage
			status={status}
			statusErr={statusErr}
			onLogin={handleLogin}
			loginError={loginError}
			isLoading={isLoading}
		/>
	)
}

export default function App() {
	return (
		<AuthProvider>
			<AppContent />
		</AuthProvider>
	)
}
