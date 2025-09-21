/**
 * Client-side document storage service using IndexedDB
 * Keeps user documents private and secure on their device
 */

class DocumentStorage {
  constructor() {
    this.dbName = 'flask_rag_documents'
    this.dbVersion = 2  // Incremented for new schema
    this.storeName = 'documents'
    this.embeddingStoreName = 'embeddings'  // New store for embeddings cache
    this.db = null
  }

  /**
   * Initialize the IndexedDB database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create documents store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true })
          store.createIndex('filename', 'filename', { unique: false })
          store.createIndex('uploadDate', 'uploadDate', { unique: false })
          store.createIndex('fileType', 'fileType', { unique: false })
          store.createIndex('contentHash', 'contentHash', { unique: true })  // For detecting content changes
        }

        // Create embeddings store for caching text embeddings
        if (!db.objectStoreNames.contains(this.embeddingStoreName)) {
          const embeddingStore = db.createObjectStore(this.embeddingStoreName, { keyPath: 'id', autoIncrement: true })
          embeddingStore.createIndex('documentId', 'documentId', { unique: false })
          embeddingStore.createIndex('chunkHash', 'chunkHash', { unique: true })  // Unique hash for each text chunk
          embeddingStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  /**
   * Store a document in IndexedDB
   * @param {File} file - The file to store
   * @param {Object} metadata - Additional metadata
   */
  async storeDocument(file, metadata = {}) {
    if (!this.db) await this.init()

    const content = await this._readFileContent(file)
    const contentHash = await this._generateContentHash(content)

    const document = {
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      content,
      contentHash,  // For detecting content changes
      uploadDate: new Date().toISOString(),
      lastModified: file.lastModified,
      embeddingsGenerated: false,  // Track if embeddings exist
      ...metadata
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(document)

      request.onsuccess = () => {
        document.id = request.result
        resolve(document)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all stored documents
   */
  async getAllDocuments() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get a document by ID
   */
  async getDocument(id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete a document by ID
   */
  async deleteDocument(id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Update document metadata
   */
  async updateDocument(id, updates) {
    if (!this.db) await this.init()

    const document = await this.getDocument(id)
    if (!document) throw new Error('Document not found')

    const updatedDocument = { ...document, ...updates, lastModified: Date.now() }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(updatedDocument)

      request.onsuccess = () => resolve(updatedDocument)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Search documents by content
   */
  async searchDocuments(query) {
    const documents = await this.getAllDocuments()
    const lowercaseQuery = query.toLowerCase()

    return documents.filter(doc =>
      doc.content.toLowerCase().includes(lowercaseQuery) ||
      doc.filename.toLowerCase().includes(lowercaseQuery)
    )
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    const documents = await this.getAllDocuments()
    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0)

    return {
      totalDocuments: documents.length,
      totalSize,
      totalSizeFormatted: this._formatFileSize(totalSize),
      byType: this._groupByFileType(documents)
    }
  }

  /**
   * Export all documents as JSON (for backup)
   */
  async exportDocuments() {
    const documents = await this.getAllDocuments()
    return {
      exportDate: new Date().toISOString(),
      version: '1.0',
      documents
    }
  }

  /**
   * Import documents from JSON backup
   */
  async importDocuments(backupData) {
    if (!backupData.documents) throw new Error('Invalid backup format')

    const results = []
    for (const doc of backupData.documents) {
      try {
        // Remove the ID to let IndexedDB assign a new one
        const { id, ...docData } = doc
        const result = await this.storeDocument(new File([doc.content], doc.filename), docData)
        results.push(result)
      } catch (error) {
        console.error('Failed to import document:', doc.filename, error)
      }
    }

    return results
  }

  /**
   * Clear all documents (with confirmation)
   */
  async clearAllDocuments() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName, this.embeddingStoreName], 'readwrite')

      // Clear both documents and embeddings
      const documentStore = transaction.objectStore(this.storeName)
      const embeddingStore = transaction.objectStore(this.embeddingStoreName)

      const clearDocs = documentStore.clear()
      const clearEmbeddings = embeddingStore.clear()

      let completed = 0
      const onComplete = () => {
        completed++
        if (completed === 2) resolve(true)
      }

      clearDocs.onsuccess = onComplete
      clearEmbeddings.onsuccess = onComplete
      clearDocs.onerror = () => reject(clearDocs.error)
      clearEmbeddings.onerror = () => reject(clearEmbeddings.error)
    })
  }

  // === EMBEDDING CACHE METHODS ===

  /**
   * Store text embedding in cache
   * @param {number} documentId - Associated document ID
   * @param {string} text - The text chunk
   * @param {Array<number>} embedding - The embedding vector
   * @param {Object} metadata - Additional metadata (chunk index, etc.)
   */
  async storeEmbedding(documentId, text, embedding, metadata = {}) {
    if (!this.db) await this.init()

    const chunkHash = await this._generateContentHash(text)

    const embeddingRecord = {
      documentId,
      text,
      embedding,
      chunkHash,
      createdAt: new Date().toISOString(),
      ...metadata
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.embeddingStoreName], 'readwrite')
      const store = transaction.objectStore(this.embeddingStoreName)
      const request = store.add(embeddingRecord)

      request.onsuccess = () => {
        embeddingRecord.id = request.result
        resolve(embeddingRecord)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all embeddings for a document
   * @param {number} documentId - Document ID
   */
  async getDocumentEmbeddings(documentId) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.embeddingStoreName], 'readonly')
      const store = transaction.objectStore(this.embeddingStoreName)
      const index = store.index('documentId')
      const request = index.getAll(documentId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Check if embeddings exist for a text chunk
   * @param {string} text - The text to check
   */
  async hasEmbedding(text) {
    if (!this.db) await this.init()

    const chunkHash = await this._generateContentHash(text)

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.embeddingStoreName], 'readonly')
      const store = transaction.objectStore(this.embeddingStoreName)
      const index = store.index('chunkHash')
      const request = index.get(chunkHash)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all cached embeddings (for semantic search)
   */
  async getAllEmbeddings() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.embeddingStoreName], 'readonly')
      const store = transaction.objectStore(this.embeddingStoreName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete embeddings for a document
   * @param {number} documentId - Document ID
   */
  async deleteDocumentEmbeddings(documentId) {
    if (!this.db) await this.init()

    const embeddings = await this.getDocumentEmbeddings(documentId)

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.embeddingStoreName], 'readwrite')
      const store = transaction.objectStore(this.embeddingStoreName)

      let completed = 0
      let total = embeddings.length

      if (total === 0) {
        resolve(true)
        return
      }

      embeddings.forEach(embedding => {
        const request = store.delete(embedding.id)
        request.onsuccess = () => {
          completed++
          if (completed === total) resolve(true)
        }
        request.onerror = () => reject(request.error)
      })
    })
  }

  /**
   * Mark document as having embeddings generated
   * @param {number} documentId - Document ID
   */
  async markEmbeddingsGenerated(documentId) {
    return this.updateDocument(documentId, { embeddingsGenerated: true })
  }

  /**
   * Get embedding cache statistics
   */
  async getEmbeddingStats() {
    const embeddings = await this.getAllEmbeddings()
    const documents = await this.getAllDocuments()

    const docsWithEmbeddings = documents.filter(doc => doc.embeddingsGenerated).length
    const totalChunks = embeddings.length
    const avgChunksPerDoc = totalChunks / Math.max(docsWithEmbeddings, 1)

    return {
      totalDocuments: documents.length,
      documentsWithEmbeddings: docsWithEmbeddings,
      totalEmbeddingChunks: totalChunks,
      averageChunksPerDocument: Math.round(avgChunksPerDoc * 100) / 100,
      cacheSize: this._formatFileSize(embeddings.length * 768 * 4) // Approximate size (768 dims * 4 bytes per float)
    }
  }

  // Private helper methods
  async _readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  async _generateContentHash(content) {
    // Generate SHA-256 hash of content for change detection
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  _groupByFileType(documents) {
    return documents.reduce((acc, doc) => {
      const ext = doc.filename.split('.').pop().toLowerCase()
      acc[ext] = (acc[ext] || 0) + 1
      return acc
    }, {})
  }
}

// Export singleton instance
export default new DocumentStorage()