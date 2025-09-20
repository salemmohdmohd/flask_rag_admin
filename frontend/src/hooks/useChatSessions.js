import { useState, useEffect } from 'react'

const useChatSessions = () => {
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)

  // Load sessions from localStorage on init
  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]')
    setSessions(savedSessions)

    // Load current session
    const currentSessionId = localStorage.getItem('currentSessionId')
    if (currentSessionId && savedSessions.length > 0) {
      const session = savedSessions.find(s => s.id === currentSessionId)
      if (session) {
        setCurrentSession(session)
      }
    }
  }, [])

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(sessions))
  }, [sessions])

  // Save current session ID whenever it changes
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem('currentSessionId', currentSession.id)
    } else {
      localStorage.removeItem('currentSessionId')
    }
  }, [currentSession])

  const createNewSession = (name) => {
    const newSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Session ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedSessions = [newSession, ...sessions]
    setSessions(updatedSessions)
    setCurrentSession(newSession)
  }

  const switchToSession = (session) => {
    // Find the session in the current sessions array to ensure we have the latest data
    const latestSession = sessions.find(s => s.id === session.id) || session
    setCurrentSession(latestSession)
  }

  const deleteSession = (sessionId) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId)
    setSessions(updatedSessions)

    if (currentSession && currentSession.id === sessionId) {
      // If we're deleting the current session, switch to the first available session
      if (updatedSessions.length > 0) {
        setCurrentSession(updatedSessions[0])
      } else {
        setCurrentSession(null)
      }
    }
  }

  const updateSession = (sessionId, updates) => {
    setSessions(prevSessions => {
      const updated = prevSessions.map(session =>
        session.id === sessionId
          ? { ...session, ...updates, updatedAt: new Date().toISOString() }
          : session
      )

      // Update current session if it's the one being updated
      if (currentSession && currentSession.id === sessionId) {
        const updatedSession = updated.find(s => s.id === sessionId)
        setCurrentSession(updatedSession)
      }

      return updated
    })
  }

  // Group sessions by date for better organization
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.createdAt).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(session)
    return groups
  }, {})

  return {
    sessions,
    currentSession,
    groupedSessions,
    createNewSession,
    switchToSession,
    deleteSession,
    updateSession
  }
}

export default useChatSessions