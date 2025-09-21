/**
 * React hook for semantic search with client-side embeddings
 */

import { useState, useCallback, useEffect } from 'react';
import EmbeddingService from '../services/EmbeddingService';
import { useDocuments } from './useDocuments';

export const useSemanticSearch = () => {
  const { documents } = useDocuments();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Initialize the embedding service with API key
   */
  const initializeService = useCallback(async (apiKey) => {
    try {
      setError(null);
      await EmbeddingService.init(apiKey);
      setIsInitialized(true);

      // Load cache stats
      const stats = await EmbeddingService.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      setError(err.message);
      setIsInitialized(false);
    }
  }, []);

  /**
   * Generate embeddings for selected documents
   */
  const generateEmbeddings = useCallback(async (selectedDocuments) => {
    if (!isInitialized) {
      throw new Error('Service not initialized. Call initializeService first.');
    }

    setIsGeneratingEmbeddings(true);
    setEmbeddingProgress(null);
    setError(null);

    try {
      await EmbeddingService.ensureEmbeddings(selectedDocuments, (progress) => {
        setEmbeddingProgress(progress);
      });

      // Update cache stats
      const stats = await EmbeddingService.getCacheStats();
      setCacheStats(stats);

      setEmbeddingProgress(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  }, [isInitialized]);

  /**
   * Perform semantic search
   */
  const semanticSearch = useCallback(async (query, topK = 5, documentIds = null) => {
    if (!isInitialized) {
      throw new Error('Service not initialized. Call initializeService first.');
    }

    try {
      setError(null);
      const results = await EmbeddingService.semanticSearch(query, topK, documentIds);
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isInitialized]);

  /**
   * Clear embedding cache
   */
  const clearCache = useCallback(async () => {
    try {
      setError(null);
      await EmbeddingService.clearCache();

      // Update cache stats
      const stats = await EmbeddingService.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Refresh cache statistics
   */
  const refreshCacheStats = useCallback(async () => {
    if (!isInitialized) return;

    try {
      const stats = await EmbeddingService.getCacheStats();
      setCacheStats(stats);
    } catch (err) {
      console.error('Failed to refresh cache stats:', err);
    }
  }, [isInitialized]);

  // Auto-refresh cache stats when documents change
  useEffect(() => {
    if (isInitialized) {
      refreshCacheStats();
    }
  }, [documents, isInitialized, refreshCacheStats]);

  return {
    // State
    isInitialized,
    isGeneratingEmbeddings,
    embeddingProgress,
    cacheStats,
    error,

    // Actions
    initializeService,
    generateEmbeddings,
    semanticSearch,
    clearCache,
    refreshCacheStats
  };
};