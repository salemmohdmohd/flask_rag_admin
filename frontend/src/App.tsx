import React, { useState } from 'react'
import axios from 'axios'
import AuthProvider, { useAuth } from './contexts/AuthProvider'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import LandingPage from './pages/LandingPage'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// Configure axios defaults
axios.defaults.baseURL = (import.meta as any).env.VITE_API_URL || '/api'

function AppContent() {
  const { isAuthenticated, status, statusErr, login, logout, isLoading } = useAuth()
  const [loginError, setLoginError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (credentials: { username: string; password: string }) => {
    setLoginError('')
    const result = await login(credentials)
    if (!result.success) {
      setLoginError((result as { success: false; error: string }).error)
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LandingPage
              status={status}
              statusErr={statusErr}
              onLogin={handleLogin}
              loginError={loginError}
              isLoading={isLoading}
            />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={() => { logout(); navigate('/', { replace: true }) }} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat onLogout={() => { logout(); navigate('/', { replace: true }) }} />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
