import React from 'react';

const ChatHeader = ({
  currentSession,
  showSidebar,
  setShowSidebar,
  showDocumentSelector,
  setShowDocumentSelector,
  selectedPersona,
  setSelectedPersona,
  personas,
  selectedDocuments
}) => {
  return (
    <div className="bg-primary text-white p-2">
      {/* Main Navigation Bar */}
      <div className="d-flex align-items-center justify-content-between">
        {/* Left side - Title and controls */}
        <div className="d-flex align-items-center gap-3">
          {/* Back to Dashboard button */}
          <a href="/dashboard" className="btn btn-outline-light btn-sm" title="Back to Dashboard">
            <i className="fas fa-arrow-left me-1"></i> Dashboard
          </a>
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
            📄 {(selectedDocuments ? selectedDocuments.length : 0)}
          </button>

          {/* Semantic search status */}
          {/* Semantic search status removed */}
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
            {personas.map((persona, idx) => (
              <option key={persona.name} value={persona.name}>
                {persona.display_name}
              </option>
            ))}
          </select>

          {/* Control buttons */}
          {/* Embedding and API key controls removed */}
        </div>
      </div>

      {/* Progress bar - only show when generating embeddings */}
      {/* Embedding progress bar removed */}

      {/* Error message - only show when there's an error */}
      {/* Embedding error message and API key update removed */}
    </div>
  );
};

export default ChatHeader;