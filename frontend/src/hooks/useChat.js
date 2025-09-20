import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthProvider'

const useChat = (sessionId, sessions) => {
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()

  const sendMessage = async (message, messageData = null) => {
    if (!sessionId) {
      console.error('No session selected')
      return
    }

    setLoading(true)
    try {
      if (!token) {
        throw new Error('No authentication token')
      }

      // Use provided messageData or create default payload
      const payload = messageData || {
        message,
        session_id: sessionId
      }

      const response = await axios.post(
        '/chat/message',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const { response: aiResponse, source_file, token_usage, follow_up_suggestions, persona } = response.data

      // Update the session with the new messages
      const session = sessions.find(s => s.id === sessionId)
      if (session) {
        const userMessage = {
          type: 'user',
          content: message,
          timestamp: new Date().toLocaleString()
        }

        const assistantMessage = {
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date().toLocaleString(),
          source_file,
          token_usage,
          follow_up_suggestions: follow_up_suggestions || [],
          persona: persona || null
        }

        session.messages.push(userMessage, assistantMessage)
        session.updatedAt = new Date().toISOString()

        // Save to localStorage
        const sessionsData = JSON.parse(localStorage.getItem('chatSessions') || '[]')
        const sessionIndex = sessionsData.findIndex(s => s.id === sessionId)
        if (sessionIndex !== -1) {
          sessionsData[sessionIndex] = session
          localStorage.setItem('chatSessions', JSON.stringify(sessionsData))
        }
      }

      return { success: true, response: aiResponse }
    } catch (error) {
      console.error('Error sending message:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    sendMessage,
    loading
  }
}

export default useChat