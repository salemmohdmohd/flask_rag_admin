import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';

const ChatSidebar = ({ sessions, currentSession, onCreateNewSession, onSwitchSession, onDeleteSession, isMobile }) => (
  <div className="bg-light h-100 p-3 border-end">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h6 className="mb-0">Chat Sessions</h6>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => onCreateNewSession()}
      >
        <i className="fas fa-plus"></i>
      </button>
    </div>
    <div className="list-group">
      {sessions.map(session => (
        <button
          key={session.id}
          className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
            currentSession?.id === session.id ? 'active' : ''
          }`}
          onClick={() => onSwitchSession(session)}
        >
          <span className="text-truncate">{session.name}</span>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSession(session.id);
            }}
          >
            ×
          </button>
        </button>
      ))}
    </div>
  </div>
);

const ChatWithClientDocuments = () => {
  const { user } = useAuth();
  const { documents, allDocuments, searchKnowledgeBase } = useKnowledgeBase();
  // Remove semantic search hook and related state

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('');
  const [personas, setPersonas] = useState([
    { name: 'assistant', display_name: 'General Assistant' },
    { name: 'technical', display_name: 'Technical Expert' }
  ]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [apiKey, setApiKey] = useState('');
  // Remove API key modal and semantic search mode

  // Session management state
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load sessions first
    loadSessions();

    // No API key or semantic search initialization needed
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
    // Remove API key submit logic
  };

  const handleGenerateEmbeddings = async () => {
    // Remove embedding generation logic
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
    // Initialize with empty sessions array - removed localStorage dependency
    setSessions([]);
  };

  const saveSessions = () => {
    // Sessions are now stored in component state only
    // This function can be extended later if needed
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
      // Always use full document mode, send selected documents to backend
      const documentsToSend = selectedDocuments.map(doc => ({
        filename: doc.filename || doc.name,
        content: doc.content
      }));
      const searchMethod = 'full_documents';

      // Simulate API response for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResponse = {
        id: Date.now() + 1,
        response: `Based on the ${documentsToSend.length} document(s) you selected, here's my response to: "${userMessage}"\n\nThis is a simulated AI response that would normally process your documents and provide relevant information.`,
        source_file: documentsToSend.length > 0 ? documentsToSend[0].filename : null,
        token_usage: { total_tokens: 150 },
        follow_up_suggestions: [
          "Can you elaborate on this topic?",
          "What are the key takeaways?",
          "Are there any related concepts?"
        ],
        persona: selectedPersona || 'default',
        search_method: searchMethod
      };

      // Add AI response to chat
      const aiMessage = {
        id: mockResponse.id,
        type: 'ai',
        content: mockResponse.response,
        source_file: mockResponse.source_file,
        timestamp: new Date(),
        token_usage: mockResponse.token_usage,
        follow_up_suggestions: mockResponse.follow_up_suggestions || [],
        persona: mockResponse.persona,
        search_method: searchMethod,
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);

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
    <div className="d-flex h-100 position-relative" style={{height: '100vh'}}>
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
        {/* API Key modal removed */}

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
          </div>

          {/* Embedding Status */}
          {/* Embedding status and semantic search UI removed */}

          {/* Embedding Progress */}
          {/* Embedding progress UI removed */}

          {/* Error Display */}
          {/* Embedding error UI removed */}

          {/* Document Selection Panel */}
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