import { useState, useEffect, useCallback } from 'react'
import documentStorage from '../services/DocumentStorage'
import { getApiUrl } from '../constants'

/**
 * Enhanced hook for managing both client-side documents and server-side resources
 * Provides unified access to all knowledge base content
 */
export const useKnowledgeBase = () => {
  const [documents, setDocuments] = useState([])
  const [serverResources, setServerResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [storageStats, setStorageStats] = useState(null)

  // Load both client-side documents and server-side resources
  useEffect(() => {
    loadKnowledgeBase()
  }, [])

  const loadKnowledgeBase = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load client-side documents
      const docs = await documentStorage.getAllDocuments()
      setDocuments(docs.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)))

      // Load server-side resources
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await fetch(`${getApiUrl()}/resources`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            const resources = data.resources || []
            setServerResources(resources.map(resource => ({
              ...resource,
              type: 'server-resource',
              source: 'server',
              name: resource.filename,
              uploadDate: resource.created_at || new Date().toISOString(),
              status: 'active'
            })))
          } else {
            console.warn('Failed to load server resources:', response.statusText)
            setServerResources([])
          }
        } catch (err) {
          console.warn('Error loading server resources:', err)
          setServerResources([])
        }
      }

      const stats = await documentStorage.getStorageStats()
      setStorageStats(stats)
    } catch (err) {
      setError('Failed to load knowledge base: ' + err.message)
      console.error('Error loading knowledge base:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Get all documents (both client and server)
  const getAllDocuments = useCallback(() => {
    return [
      ...documents.map(doc => ({ ...doc, source: 'client' })),
      ...serverResources.map(resource => ({ ...resource, source: 'server' }))
    ].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
  }, [documents, serverResources])

  // Get content for a specific document/resource
  const getDocumentContent = useCallback(async (documentId, source = 'client') => {
    try {
      setError(null)

      if (source === 'client') {
        return await documentStorage.getDocument(documentId)
      } else if (source === 'server') {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Authentication required')
        }

        const response = await fetch(`${getApiUrl()}/api/resources/${documentId}/content`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch resource content: ${response.statusText}`)
        }

        return await response.json()
      }
    } catch (err) {
      setError('Failed to get document content: ' + err.message)
      throw err
    }
  }, [])

  // Upload document (client-side only)
  const uploadDocument = useCallback(async (file, metadata = {}) => {
    try {
      setError(null)

      // Validate file type
      const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf']
      const allowedExtensions = ['.txt', '.md', '.pdf']
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()

      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        throw new Error(`File type not supported. Allowed types: ${allowedExtensions.join(', ')}`)
      }

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 10MB.')
      }

      const newDocument = await documentStorage.storeDocument(file, {
        tags: metadata.tags || [],
        description: metadata.description || '',
        indexed: true,
        status: 'active'
      })

      // Refresh knowledge base
      await loadKnowledgeBase()

      return newDocument
    } catch (err) {
      setError('Failed to upload document: ' + err.message)
      throw err
    }
  }, [loadKnowledgeBase])

  // Delete document (client-side only)
  const deleteDocument = useCallback(async (documentId) => {
    try {
      setError(null)
      await documentStorage.deleteDocument(documentId)
      await loadKnowledgeBase()
      return true
    } catch (err) {
      setError('Failed to delete document: ' + err.message)
      throw err
    }
  }, [loadKnowledgeBase])

  // Update document (client-side only)
  const updateDocument = useCallback(async (documentId, updates) => {
    try {
      setError(null)
      const updatedDoc = await documentStorage.updateDocument(documentId, updates)
      await loadKnowledgeBase()
      return updatedDoc
    } catch (err) {
      setError('Failed to update document: ' + err.message)
      throw err
    }
  }, [loadKnowledgeBase])

  // Search across all documents and resources
  const searchKnowledgeBase = useCallback(async (query) => {
    try {
      setError(null)

      // Search client-side documents
      const clientResults = await documentStorage.searchDocuments(query)

      // For server-side resources, we'll do a simple text search
      // (The backend could be enhanced to support full-text search)
      const serverResults = serverResources.filter(resource =>
        resource.name.toLowerCase().includes(query.toLowerCase()) ||
        (resource.description && resource.description.toLowerCase().includes(query.toLowerCase()))
      )

      return [
        ...clientResults.map(doc => ({ ...doc, source: 'client' })),
        ...serverResults.map(resource => ({ ...resource, source: 'server' }))
      ]
    } catch (err) {
      setError('Failed to search knowledge base: ' + err.message)
      return []
    }
  }, [serverResources])

  // Export client-side documents
  const exportDocuments = useCallback(async () => {
    try {
      setError(null)
      const backup = await documentStorage.exportDocuments()

      // Create download link
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `documents-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return backup
    } catch (err) {
      setError('Failed to export documents: ' + err.message)
      throw err
    }
  }, [])

  // Import client-side documents
  const importDocuments = useCallback(async (file) => {
    try {
      setError(null)

      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(file)
      })

      const backupData = JSON.parse(text)
      const results = await documentStorage.importDocuments(backupData)

      await loadKnowledgeBase()
      return results
    } catch (err) {
      setError('Failed to import documents: ' + err.message)
      throw err
    }
  }, [loadKnowledgeBase])

  // Clear client-side documents
  const clearAllDocuments = useCallback(async () => {
    try {
      setError(null)
      await documentStorage.clearAllDocuments()
      await loadKnowledgeBase()
      return true
    } catch (err) {
      setError('Failed to clear documents: ' + err.message)
      throw err
    }
  }, [loadKnowledgeBase])

  const refreshKnowledgeBase = useCallback(() => {
    loadKnowledgeBase()
  }, [loadKnowledgeBase])

  return {
    // State
    documents, // Client-side documents only
    serverResources, // Server-side resources only
    allDocuments: getAllDocuments(), // Combined view
    loading,
    error,
    storageStats,

    // Actions
    uploadDocument,
    deleteDocument,
    updateDocument,
    getDocumentContent,
    searchKnowledgeBase,
    exportDocuments,
    importDocuments,
    clearAllDocuments,
    refreshKnowledgeBase,

    // Utility
    setError: (err) => setError(err)
  }
}

export default useKnowledgeBase