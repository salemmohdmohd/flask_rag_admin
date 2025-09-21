import { useState, useEffect, useCallback } from 'react'
import documentStorage from '../services/DocumentStorage'

/**
 * Custom hook for managing client-side document storage
 * Provides CRUD operations and state management for user documents
 */
export const useDocuments = () => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [storageStats, setStorageStats] = useState(null)

  // Load documents from IndexedDB on mount
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const docs = await documentStorage.getAllDocuments()
      setDocuments(docs.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)))

      const stats = await documentStorage.getStorageStats()
      setStorageStats(stats)
    } catch (err) {
      setError('Failed to load documents: ' + err.message)
      console.error('Error loading documents:', err)
    } finally {
      setLoading(false)
    }
  }, [])

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
        indexed: true, // Always marked as indexed since it's client-side
        status: 'active'
      })

      // Refresh documents list
      await loadDocuments()

      return newDocument
    } catch (err) {
      setError('Failed to upload document: ' + err.message)
      throw err
    }
  }, [loadDocuments])

  const deleteDocument = useCallback(async (documentId) => {
    try {
      setError(null)
      await documentStorage.deleteDocument(documentId)
      await loadDocuments()
      return true
    } catch (err) {
      setError('Failed to delete document: ' + err.message)
      throw err
    }
  }, [loadDocuments])

  const updateDocument = useCallback(async (documentId, updates) => {
    try {
      setError(null)
      const updatedDoc = await documentStorage.updateDocument(documentId, updates)
      await loadDocuments()
      return updatedDoc
    } catch (err) {
      setError('Failed to update document: ' + err.message)
      throw err
    }
  }, [loadDocuments])

  const searchDocuments = useCallback(async (query) => {
    try {
      setError(null)
      return await documentStorage.searchDocuments(query)
    } catch (err) {
      setError('Failed to search documents: ' + err.message)
      return []
    }
  }, [])

  const getDocument = useCallback(async (documentId) => {
    try {
      setError(null)
      return await documentStorage.getDocument(documentId)
    } catch (err) {
      setError('Failed to get document: ' + err.message)
      return null
    }
  }, [])

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

      await loadDocuments()
      return results
    } catch (err) {
      setError('Failed to import documents: ' + err.message)
      throw err
    }
  }, [loadDocuments])

  const clearAllDocuments = useCallback(async () => {
    try {
      setError(null)
      await documentStorage.clearAllDocuments()
      await loadDocuments()
      return true
    } catch (err) {
      setError('Failed to clear documents: ' + err.message)
      throw err
    }
  }, [loadDocuments])

  const refreshDocuments = useCallback(() => {
    loadDocuments()
  }, [loadDocuments])

  return {
    // State
    documents,
    loading,
    error,
    storageStats,

    // Actions
    uploadDocument,
    deleteDocument,
    updateDocument,
    searchDocuments,
    getDocument,
    exportDocuments,
    importDocuments,
    clearAllDocuments,
    refreshDocuments,

    // Utility
    setError: (err) => setError(err)
  }
}

export default useDocuments