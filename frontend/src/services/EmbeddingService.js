/**
 * Client-side embedding generation and semantic search service
 * Handles text chunking, embedding generation, and similarity search
 */

import DocumentStorage from './DocumentStorage.js';

class EmbeddingService {
  constructor() {
    this.documentStorage = DocumentStorage;
    this.apiKey = null;
    this.embeddingModel = 'text-embedding-004';
    this.chunkSize = 1000;
    this.chunkOverlap = 200;
  }

  /**
   * Initialize the service with API key
   * @param {string} apiKey - Google AI Studio API key
   */
  async init(apiKey) {
    if (!apiKey) {
      throw new Error('Google AI Studio API key is required');
    }
    this.apiKey = apiKey;
    await this.documentStorage.init();
  }

  /**
   * Split text into overlapping chunks
   * @param {string} text - Text to chunk
   * @param {number} chunkSize - Size of each chunk
   * @param {number} overlap - Overlap between chunks
   */
  splitTextIntoChunks(text, chunkSize = this.chunkSize, overlap = this.chunkOverlap) {
    if (text.length <= chunkSize) {
      return [text];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;

      // Try to break at sentence boundary if possible
      if (end < text.length) {
        const sentenceEnd = text.lastIndexOf('.', end);
        const questionEnd = text.lastIndexOf('?', end);
        const exclamationEnd = text.lastIndexOf('!', end);

        const bestEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd);
        if (bestEnd > start + chunkSize * 0.7) { // Don't make chunks too small
          end = bestEnd + 1;
        }
      }

      const chunk = text.substring(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }

      // Move start position with overlap
      start = end - overlap;
      if (start >= text.length) break;
    }

    return chunks;
  }

  /**
   * Generate embedding for text using Google's API
   * @param {string} text - Text to embed
   */
  async generateEmbedding(text) {
    if (!this.apiKey) {
      throw new Error('API key not initialized. Call init() first.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.embeddingModel}:embedContent`;

    const payload = {
      model: `models/${this.embeddingModel}`,
      content: {
        parts: [{ text }]
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'x-goog-api-key': this.apiKey
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Embedding API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.embedding?.values;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response format');
      }

      return embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for a document and cache them
   * @param {Object} document - Document object from DocumentStorage
   * @param {Function} onProgress - Progress callback (chunkIndex, totalChunks)
   */
  async generateDocumentEmbeddings(document, onProgress = null) {
    if (!document.content) {
      throw new Error('Document has no content');
    }

    console.log(`🔄 Generating embeddings for document: ${document.filename}`);

    // Split document into chunks
    const chunks = this.splitTextIntoChunks(document.content);
    console.log(`📝 Split document into ${chunks.length} chunks`);

    const embeddingPromises = [];
    let completedChunks = 0;

    // Process chunks in batches to avoid overwhelming the API
    const batchSize = 3; // Process 3 chunks at a time
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      const batchPromises = batch.map(async (chunk, batchIndex) => {
        const globalIndex = i + batchIndex;

        // Check if embedding already exists in cache
        const existingEmbedding = await this.documentStorage.hasEmbedding(chunk);
        if (existingEmbedding) {
          console.log(`✅ Using cached embedding for chunk ${globalIndex + 1}`);
          completedChunks++;
          onProgress?.(completedChunks, chunks.length);
          return existingEmbedding;
        }

        try {
          // Add small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));

          const embedding = await this.generateEmbedding(chunk);

          // Store in cache
          const embeddingRecord = await this.documentStorage.storeEmbedding(
            document.id,
            chunk,
            embedding,
            {
              chunkIndex: globalIndex,
              documentFilename: document.filename
            }
          );

          completedChunks++;
          console.log(`💾 Generated and cached embedding for chunk ${globalIndex + 1}/${chunks.length}`);
          onProgress?.(completedChunks, chunks.length);

          return embeddingRecord;
        } catch (error) {
          console.error(`❌ Failed to generate embedding for chunk ${globalIndex + 1}:`, error);
          throw error;
        }
      });

      embeddingPromises.push(...batchPromises);

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);
    }

    const results = await Promise.all(embeddingPromises);

    // Mark document as having embeddings generated
    await this.documentStorage.markEmbeddingsGenerated(document.id);

    console.log(`✅ Successfully generated ${results.length} embeddings for ${document.filename}`);
    return results;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vec1 - First vector
   * @param {Array<number>} vec2 - Second vector
   */
  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      normA += vec1[i] * vec1[i];
      normB += vec2[i] * vec2[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Perform semantic search across all cached embeddings
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return
   * @param {Array<number>} documentIds - Optional: limit search to specific documents
   */
  async semanticSearch(query, topK = 5, documentIds = null) {
    console.log(`🔍 Performing semantic search for: "${query}"`);

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query);

    // Get all cached embeddings
    let allEmbeddings = await this.documentStorage.getAllEmbeddings();

    // Filter by document IDs if specified
    if (documentIds && documentIds.length > 0) {
      allEmbeddings = allEmbeddings.filter(emb => documentIds.includes(emb.documentId));
    }

    if (allEmbeddings.length === 0) {
      console.log('⚠️ No embeddings found in cache');
      return [];
    }

    console.log(`📊 Searching across ${allEmbeddings.length} cached chunks`);

    // Calculate similarities
    const similarities = allEmbeddings.map(embeddingRecord => {
      const similarity = this.cosineSimilarity(queryEmbedding, embeddingRecord.embedding);
      return {
        ...embeddingRecord,
        similarity
      };
    });

    // Sort by similarity and return top results
    const sortedResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    console.log(`✅ Found ${sortedResults.length} relevant chunks`);
    sortedResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.documentFilename} (similarity: ${result.similarity.toFixed(3)})`);
    });

    return sortedResults;
  }

  /**
   * Ensure embeddings exist for selected documents
   * @param {Array<Object>} documents - Array of documents
   * @param {Function} onProgress - Progress callback
   */
  async ensureEmbeddings(documents, onProgress = null) {
    console.log(`🔄 Ensuring embeddings exist for ${documents.length} documents`);

    const documentsNeedingEmbeddings = documents.filter(doc => !doc.embeddingsGenerated);

    if (documentsNeedingEmbeddings.length === 0) {
      console.log('✅ All documents already have embeddings');
      return;
    }

    console.log(`📝 ${documentsNeedingEmbeddings.length} documents need embeddings generated`);

    for (let i = 0; i < documentsNeedingEmbeddings.length; i++) {
      const doc = documentsNeedingEmbeddings[i];
      console.log(`📄 Processing document ${i + 1}/${documentsNeedingEmbeddings.length}: ${doc.filename}`);

      try {
        await this.generateDocumentEmbeddings(doc, (chunkProgress, totalChunks) => {
          const overallProgress = {
            documentIndex: i + 1,
            totalDocuments: documentsNeedingEmbeddings.length,
            chunkProgress,
            totalChunks,
            currentDocument: doc.filename
          };
          onProgress?.(overallProgress);
        });
      } catch (error) {
        console.error(`❌ Failed to generate embeddings for ${doc.filename}:`, error);
        throw error;
      }
    }

    console.log('✅ All embeddings generated successfully');
  }

  /**
   * Get embedding cache statistics
   */
  async getCacheStats() {
    return this.documentStorage.getEmbeddingStats();
  }

  /**
   * Clear all cached embeddings
   */
  async clearCache() {
    const embeddings = await this.documentStorage.getAllEmbeddings();
    for (const embedding of embeddings) {
      await this.documentStorage.deleteDocumentEmbeddings(embedding.documentId);
    }

    // Reset embeddingsGenerated flag for all documents
    const documents = await this.documentStorage.getAllDocuments();
    for (const doc of documents) {
      if (doc.embeddingsGenerated) {
        await this.documentStorage.updateDocument(doc.id, { embeddingsGenerated: false });
      }
    }

    console.log('🗑️ Embedding cache cleared');
  }
}

// Export singleton instance
export default new EmbeddingService();