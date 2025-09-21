import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthProvider'

const useChat = (sessionId, updateSession, currentSession) => {
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

      const response = await axios.post('/chat/message', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const {
        response: aiResponse,
        source_file,
        token_usage,
        follow_up_suggestions,
        persona
      } = response.data

      // Create new messages
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

      // Update session with new messages
      const currentMessages = currentSession?.messages || []
      updateSession(sessionId, {
        messages: [...currentMessages, userMessage, assistantMessage]
      })

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