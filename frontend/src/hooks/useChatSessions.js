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

    setSessions([newSession, ...sessions])
    setCurrentSession(newSession)
  }

  const switchToSession = (session) => {
    const latestSession = sessions.find(s => s.id === session.id) || session
    setCurrentSession(latestSession)
  }

  const deleteSession = (sessionId) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId)
    setSessions(updatedSessions)

    if (currentSession?.id === sessionId) {
      setCurrentSession(updatedSessions.length > 0 ? updatedSessions[0] : null)
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
      if (currentSession?.id === sessionId) {
        const updatedSession = updated.find(s => s.id === sessionId)
        setCurrentSession(updatedSession)
      }

      return updated
    })
  }

  return {
    sessions,
    currentSession,
    createNewSession,
    switchToSession,
    deleteSession,
    updateSession
  }
}

export default useChatSessions