import React from 'react';

const ChatHeader = ({
  currentSession,
  showSidebar,
  setShowSidebar,
  isInitialized,
  isGeneratingEmbeddings,
  embeddingProgress,
  embeddingError,
  cacheStats,
  useSemanticSearchMode,
  setUseSemanticSearchMode,
  selectedDocuments,
  handleGenerateEmbeddings,
  setShowApiKeyInput,
  showDocumentSelector,
  setShowDocumentSelector,
  selectedPersona,
  setSelectedPersona,
  personas
}) => {
  return (
    <div className="bg-primary text-white p-2">
      {/* Main Navigation Bar */}
      <div className="d-flex align-items-center justify-content-between">
        {/* Left side - Title and controls */}
        <div className="d-flex align-items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            className="btn btn-outline-light btn-sm d-lg-none"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <i className="fas fa-bars"></i>
          </button>

          <h5 className="mb-0">🤖 AI Chat</h5>

          {/* Session info */}
          {currentSession && (
            <span className="text-white-75 small">
              {currentSession.name}
            </span>
          )}

          {/* Document selector button */}
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => setShowDocumentSelector(!showDocumentSelector)}
          >
            📄 {selectedDocuments.length}
          </button>

          {/* Semantic search status */}
          {isInitialized && (
            <div className="d-flex align-items-center gap-2">
              <small className="text-white-75" title={useSemanticSearchMode ? 'AI Semantic Search - finds content by meaning' : 'Basic Search - uses full documents'}>
                🔍 {useSemanticSearchMode ? 'AI Search' : 'Basic'}
              </small>
              {isGeneratingEmbeddings && (
                <small className="text-warning">
                  ⚡ Auto-generating...
                </small>
              )}
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={useSemanticSearchMode}
                  onChange={(e) => setUseSemanticSearchMode(e.target.checked)}
                  id="semanticToggle"
                  style={{transform: 'scale(0.8)'}}
                  title="Toggle between AI semantic search and basic document search"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right side - Persona and controls */}
        <div className="d-flex align-items-center gap-2">
          {/* Persona Selection */}
          <select
            value={selectedPersona}
            onChange={(e) => setSelectedPersona(e.target.value)}
            className="form-select form-select-sm"
            style={{minWidth: '150px', maxWidth: '200px'}}
          >
            <option value="">Default</option>
            {personas.map(persona => (
              <option key={persona.name} value={persona.name}>
                {persona.display_name}
              </option>
            ))}
          </select>

          {/* Control buttons */}
          {isInitialized && selectedDocuments.length > 0 && (
            <button
              onClick={handleGenerateEmbeddings}
              disabled={isGeneratingEmbeddings}
              className="btn btn-outline-light btn-sm"
              title="Regenerate embeddings for selected documents"
            >
              {isGeneratingEmbeddings ? '⏳' : '🔄'}
            </button>
          )}

          <button
            onClick={() => setShowApiKeyInput(true)}
            className="btn btn-outline-light btn-sm"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Progress bar - only show when generating embeddings */}
      {isGeneratingEmbeddings && embeddingProgress && (
        <div className="mt-2">
          <div className="progress" style={{height: '3px'}}>
            <div
              className="progress-bar bg-warning"
              style={{
                width: `${(embeddingProgress.chunkProgress / embeddingProgress.totalChunks) * 100}%`
              }}
            />
          </div>
          <small className="text-white-75">
            Processing: {embeddingProgress.currentDocument} ({embeddingProgress.chunkProgress}/{embeddingProgress.totalChunks})
          </small>
        </div>
      )}

      {/* Error message - only show when there's an error */}
      {embeddingError && (
        <div className="mt-2">
          <small className="text-warning">
            ⚠️ {embeddingError}
          </small>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;