import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { useSemanticSearch } from '../hooks/useSemanticSearch';
import ChatSidebar from './ChatSidebar';

const ChatWithClientDocuments = () => {
  const { user } = useAuth();
  const { documents, allDocuments, searchKnowledgeBase } = useKnowledgeBase();
  const {
    isInitialized,
    isGeneratingEmbeddings,
    embeddingProgress,
    cacheStats,
    error: embeddingError,
    initializeService,
    generateEmbeddings,
    semanticSearch,
    clearCache
  } = useSemanticSearch();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [personas, setPersonas] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [useSemanticSearchMode, setUseSemanticSearchMode] = useState(true);

  // Session management state
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load sessions first
    loadSessions();

    // Load personas
    loadPersonas();

    // Check for saved API key
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      initializeService(savedApiKey);
    } else {
      setShowApiKeyInput(true);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save sessions when they change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions();
    }
  }, [sessions, messages]);

  // Update current session messages when messages change
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      setSessions(prev => prev.map(s =>
        s.id === currentSession.id
          ? { ...s, messages: messages }
          : s
      ));
    }
  }, [messages, currentSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) return;

    try {
      await initializeService(apiKey);
      localStorage.setItem('gemini_api_key', apiKey);
      setShowApiKeyInput(false);
    } catch (error) {
      console.error('Failed to initialize embedding service:', error);
      alert('Failed to initialize with the provided API key. Please check your key and try again.');
    }
  };

  const handleGenerateEmbeddings = async () => {
    if (selectedDocuments.length === 0) {
      alert('Please select documents first');
      return;
    }

    try {
      await generateEmbeddings(selectedDocuments);
      alert('Embeddings generated successfully!');
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      alert('Failed to generate embeddings: ' + error.message);
    }
  };

  const loadPersonas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/personas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonas(data.personas || []);
      }
    } catch (error) {
      console.error('Error loading personas:', error);
    }
  };

  const handleDocumentSearch = async (query) => {
    if (!query.trim()) return;

    const results = await searchKnowledgeBase(query);
    return results;
  };

  // Session management functions
  const createNewSession = (name) => {
    const newSession = {
      id: Date.now().toString(),
      name: name || `Session ${sessions.length + 1}`,
      createdAt: new Date().toISOString(),
      messages: []
    };

    setSessions(prev => [newSession, ...prev]);
    switchToSession(newSession);
  };

  const switchToSession = (session) => {
    // Save current session messages if there's an active session
    if (currentSession && messages.length > 0) {
      setSessions(prev => prev.map(s =>
        s.id === currentSession.id
          ? { ...s, messages: messages }
          : s
      ));
    }

    // Switch to new session
    setCurrentSession(session);
    setMessages(session.messages || []);
    setSessionId(session.id);

    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
      setShowSidebar(false);
    }
  };

  const deleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));

    // If we deleted the current session, clear it
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      setMessages([]);
      setSessionId(Date.now().toString());
    }
  };

  const loadSessions = () => {
    // Load sessions from localStorage or API
    const savedSessions = localStorage.getItem('chat_sessions');
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        setSessions(parsedSessions);

        // Load the most recent session if available
        if (parsedSessions.length > 0) {
          const mostRecent = parsedSessions[0];
          setCurrentSession(mostRecent);
          setMessages(mostRecent.messages || []);
          setSessionId(mostRecent.id);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    }
  };

  const saveSessions = () => {
    // Save current session messages before saving
    let sessionsToSave = sessions;
    if (currentSession && messages.length > 0) {
      sessionsToSave = sessions.map(s =>
        s.id === currentSession.id
          ? { ...s, messages: messages }
          : s
      );
    }

    localStorage.setItem('chat_sessions', JSON.stringify(sessionsToSave));
  };

  const toggleDocumentSelection = (doc) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.some(d => d.id === doc.id);
      if (isSelected) {
        return prev.filter(d => d.id !== doc.id);
      } else {
        return [...prev, doc];
      }
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      const token = localStorage.getItem('token');

      let documentsToSend = [];
      let searchMethod = 'full_documents';

      if (useSemanticSearchMode && isInitialized && selectedDocuments.length > 0) {
        // Use client-side semantic search to find relevant chunks
        console.log('🔍 Using client-side semantic search');

        // Get document IDs of selected documents
        const selectedDocIds = selectedDocuments.map(doc => doc.id);

        // Perform semantic search
        const relevantChunks = await semanticSearch(userMessage, 5, selectedDocIds);

        if (relevantChunks.length > 0) {
          // Convert chunks back to document format for API
          documentsToSend = relevantChunks.map(chunk => ({
            filename: chunk.documentFilename || 'unknown',
            content: chunk.text
          }));
          searchMethod = 'semantic_search';

          console.log(`✅ Found ${relevantChunks.length} relevant chunks using semantic search`);
        } else {
          console.log('⚠️ No relevant chunks found, falling back to full documents');
          documentsToSend = selectedDocuments.map(doc => ({
            filename: doc.filename || doc.name,
            content: doc.content
          }));
        }
      } else {
        // Fallback to sending full documents
        console.log('📄 Using full document mode');
        documentsToSend = selectedDocuments.map(doc => ({
          filename: doc.filename || doc.name,
          content: doc.content
        }));
      }

      const response = await fetch('/api/chat/message/client-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          persona_name: selectedPersona || null,
          documents: documentsToSend,
          search_method: searchMethod,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response to chat
      const aiMessage = {
        id: data.id,
        type: 'ai',
        content: data.response,
        source_file: data.source_file,
        timestamp: new Date(),
        token_usage: data.token_usage,
        follow_up_suggestions: data.follow_up_suggestions || [],
        persona: data.persona,
        search_method: searchMethod,
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="d-flex h-100 position-relative">
      {/* Sidebar */}
      <div className={`position-relative ${showSidebar ? 'd-block' : 'd-none d-lg-block'}`} style={{width: '320px'}}>
        <ChatSidebar
          sessions={sessions}
          currentSession={currentSession}
          onCreateNewSession={createNewSession}
          onSwitchSession={switchToSession}
          onDeleteSession={deleteSession}
          isMobile={showSidebar && window.innerWidth <= 768}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50 d-lg-none"
          style={{zIndex: 1040}}
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-grow-1 d-flex flex-column h-100">
        {/* API Key Input Modal */}
        {showApiKeyInput && (
          <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050}}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">🔑 Google AI Studio API Key Required</h5>
                </div>
                <div className="modal-body text-center">
                  <p>To use client-side semantic search, please enter your Google AI Studio API key:</p>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Google AI Studio API key"
                    className="form-control"
                  />
                  <small className="form-text text-muted mt-2">
                    Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
                  </small>
                </div>
                <div className="modal-footer justify-content-center">
                  <button
                    className="btn btn-primary"
                    onClick={handleApiKeySubmit}
                    disabled={!apiKey.trim()}
                  >
                    Initialize
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowApiKeyInput(false)}
                  >
                    Skip (use basic mode)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-primary text-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="h4 mb-0">🤖 AI Chat with Client Documents</h2>
            <div className="d-flex align-items-center gap-2">
              {/* Mobile sidebar toggle */}
              <button
                className="btn btn-outline-light d-lg-none"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <i className="fas fa-bars"></i>
              </button>

              {/* Session info */}
              {currentSession && (
                <div className="text-white-75 small">
                  Session: {currentSession.name}
                </div>
              )}

              {/* New session button */}
              <button
                className="btn btn-outline-light btn-sm"
                onClick={() => createNewSession()}
                title="New Session"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>        {/* Embedding Status */}
        {isInitialized && (
          <div className="bg-light bg-opacity-25 rounded p-3 mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold">
                  🧠 Semantic Search: {isInitialized ? '✅ Ready' : '❌ Not Ready'}
                </span>
                {cacheStats && (
                  <small className="text-white-75">
                    | 📊 {cacheStats.documentsWithEmbeddings}/{cacheStats.totalDocuments} docs cached
                    | {cacheStats.totalEmbeddingChunks} chunks
                    | {cacheStats.cacheSize}
                  </small>
                )}
              </div>
            </div>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={useSemanticSearchMode}
                  onChange={(e) => setUseSemanticSearchMode(e.target.checked)}
                  id="semanticSearchToggle"
                />
                <label className="form-check-label text-white" htmlFor="semanticSearchToggle">
                  Use Semantic Search
                </label>
              </div>
              <button
                onClick={handleGenerateEmbeddings}
                disabled={isGeneratingEmbeddings || selectedDocuments.length === 0}
                className="btn btn-outline-light btn-sm"
              >
                {isGeneratingEmbeddings ? '⏳ Generating...' : '🧠 Generate Embeddings'}
              </button>
              <button
                onClick={() => setShowApiKeyInput(true)}
                className="btn btn-outline-light btn-sm"
              >
                ⚙️
              </button>
            </div>
          </div>
        )}

        {/* Embedding Progress */}
        {isGeneratingEmbeddings && embeddingProgress && (
          <div className="bg-light bg-opacity-25 rounded p-3 mb-3">
            <div className="mb-2">
              <small>
                Processing: {embeddingProgress.currentDocument}
                ({embeddingProgress.documentIndex}/{embeddingProgress.totalDocuments})
              </small>
            </div>
            <div className="progress mb-2" style={{height: '6px'}}>
              <div
                className="progress-bar bg-success"
                style={{
                  width: `${(embeddingProgress.chunkProgress / embeddingProgress.totalChunks) * 100}%`
                }}
              />
            </div>
            <div className="text-center">
              <small className="text-white-75">
                Chunk {embeddingProgress.chunkProgress}/{embeddingProgress.totalChunks}
              </small>
            </div>
          </div>
        )}

        {/* Error Display */}
        {embeddingError && (
          <div className="alert alert-danger alert-dismissible mb-3">
            ❌ {embeddingError}
          </div>
        )}        {/* Document Selection Panel */}
        <div className="mb-3">
          <button
            className="btn btn-outline-light"
            onClick={() => setShowDocumentSelector(!showDocumentSelector)}
          >
            📄 Documents ({selectedDocuments.length} selected)
          </button>

          {showDocumentSelector && (
            <div className="mt-3 bg-white rounded p-3 text-dark">
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="border rounded" style={{maxHeight: '200px', overflowY: 'auto'}}>
                {allDocuments
                  .filter(doc =>
                    !searchQuery ||
                    (doc.filename || doc.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (doc.content || doc.description || '').toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(doc => (
                    <div
                      key={doc.id}
                      className={`p-3 border-bottom ${
                        selectedDocuments.some(d => d.id === doc.id)
                          ? 'bg-primary bg-opacity-10 border-start border-primary border-3'
                          : 'bg-white'
                      }`}
                      onClick={() => toggleDocumentSelection(doc)}
                      style={{cursor: 'pointer'}}
                      onMouseEnter={(e) => {
                        if (!selectedDocuments.some(d => d.id === doc.id)) {
                          e.target.classList.add('bg-light');
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedDocuments.some(d => d.id === doc.id)) {
                          e.target.classList.remove('bg-light');
                        }
                      }}
                    >
                      <div className="fw-medium">
                        {doc.filename || doc.name}
                        {doc.source === 'server' && (
                          <span className="ms-2 badge bg-primary">Server</span>
                        )}
                      </div>
                      <small className="text-muted">
                        {doc.content.length} characters
                      </small>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Persona Selection */}
        <div className="d-flex align-items-center gap-2">
          <label className="text-white-75 small">Persona:</label>
          <select
            value={selectedPersona}
            onChange={(e) => setSelectedPersona(e.target.value)}
            className="form-select form-select-sm bg-white bg-opacity-90"
            style={{minWidth: '200px'}}
          >
            <option value="">Default Assistant</option>
            {personas.map(persona => (
              <option key={persona.name} value={persona.name}>
                {persona.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-3 bg-light">
        {messages.map(message => (
          <div
            key={message.id}
            className={`mb-3 ${message.type === 'user' ? 'ms-auto' : ''}`}
            style={{maxWidth: '80%'}}
          >
            <div className={`card ${
              message.type === 'user'
                ? 'bg-primary text-white'
                : message.type === 'error'
                ? 'bg-danger text-white'
                : 'bg-white'
            }`}>
              <div className="card-header py-2 border-0 bg-transparent">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="fw-bold">
                    {message.type === 'user' ? '👤 You' :
                     message.type === 'ai' ? '🤖 AI Assistant' : '❌ Error'}
                  </small>
                  <small className="opacity-75">
                    {formatTimestamp(message.timestamp)}
                  </small>
                </div>
              </div>

              <div className="card-body py-2">
                <div style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>
                  {message.content}
                </div>

                {message.source_file && (
                  <div className="mt-2 p-2 bg-light bg-opacity-50 rounded">
                    <small>
                      📄 Source: {message.source_file}
                      {message.search_method && (
                        <span className="ms-1">
                          | Search: {message.search_method === 'semantic_search' ? '🧠 Semantic' : '📄 Full Document'}
                        </span>
                      )}
                    </small>
                  </div>
                )}

                {message.follow_up_suggestions && message.follow_up_suggestions.length > 0 && (
                  <div className="mt-3 p-3 bg-info bg-opacity-10 rounded border-start border-info border-3">
                    <h6 className="mb-2">💡 You might also want to ask:</h6>
                    <div className="d-flex flex-column gap-1">
                      {message.follow_up_suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setInputMessage(suggestion)}
                          className="btn btn-outline-info btn-sm text-start"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {message.token_usage && (
                  <div className="mt-2">
                    <small className="text-muted">
                      🔢 Tokens: {message.token_usage.total_tokens || 0}
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="mb-3">
            <div className="card bg-white">
              <div className="card-header py-2 border-0 bg-transparent">
                <small className="fw-bold">🤖 AI Assistant</small>
              </div>
              <div className="card-body py-2">
                <div className="d-flex align-items-center gap-2">
                  <span>Thinking</span>
                  <div className="spinner-grow spinner-grow-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-top bg-white p-3">
        {selectedDocuments.length > 0 && (
          <div className="alert alert-info py-2 mb-3">
            <small>
              📄 Using {selectedDocuments.length} documents: {' '}
              {selectedDocuments.map(d => d.filename || d.name).join(', ')}
            </small>
          </div>
        )}

        <div className="d-flex gap-2 align-items-end">
          <div className="flex-grow-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your documents..."
              className="form-control"
              rows="3"
              disabled={isLoading}
              style={{resize: 'vertical', minHeight: '80px'}}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="btn btn-success"
            style={{minWidth: '60px', height: '48px'}}
          >
            {isLoading ? (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : '📤'}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ChatWithClientDocuments;