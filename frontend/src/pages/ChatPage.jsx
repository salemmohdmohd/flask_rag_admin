import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { useSemanticSearch } from '../hooks/useSemanticSearch';
import ChatSidebar from '../components/ChatSidebar';
import ApiKeyModal from '../components/ApiKeyModal';
import ChatHeader from '../components/ChatHeader';
import DocumentSelector from '../components/DocumentSelector';
import ChatMessages from '../components/ChatMessages';
import ChatInput from '../components/ChatInput';

const ChatPage = () => {
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

  // Chat state
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
    saveSessions();
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

  // Auto-generate embeddings when documents are selected
  useEffect(() => {
    const autoGenerateEmbeddings = async () => {
      // Only generate if we have documents, service is initialized, and not already generating
      if (selectedDocuments.length > 0 && isInitialized && !isGeneratingEmbeddings) {
        try {
          console.log(`🔄 Auto-generating embeddings for ${selectedDocuments.length} documents...`);
          await generateEmbeddings(selectedDocuments);
          console.log(`✅ Embeddings generated successfully for ${selectedDocuments.length} documents`);
        } catch (error) {
          console.error('Failed to auto-generate embeddings:', error);
          // Only show alert for actual errors, not for user-initiated cancellations
          if (!error.message.includes('cancelled') && !error.message.includes('aborted')) {
            alert('Failed to generate embeddings: ' + error.message);
          }
        }
      }
    };

    // Debounce the embedding generation to avoid rapid re-generation
    const timeoutId = setTimeout(autoGenerateEmbeddings, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedDocuments, isInitialized, isGeneratingEmbeddings]);

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
      console.log('✅ Manual embedding generation completed successfully');
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
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);

    // Immediately save to localStorage after deletion
    saveSessions(updatedSessions);

    // If we deleted the current session, clear it
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      setMessages([]);
      setSessionId(Date.now().toString());
    }
  };

  const clearAllSessions = () => {
    const emptySessions = [];
    setSessions(emptySessions);
    setCurrentSession(null);
    setMessages([]);
    setSessionId(Date.now().toString());

    // Immediately clear localStorage
    localStorage.removeItem('chat_sessions');
    // Or save empty array to be explicit
    localStorage.setItem('chat_sessions', JSON.stringify(emptySessions));
  };

  const loadSessions = () => {
    // Load sessions from localStorage or API
    const savedSessions = localStorage.getItem('chat_sessions');
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        if (parsedSessions && parsedSessions.length > 0) {
          setSessions(parsedSessions);

          // Load the most recent session if available
          const mostRecent = parsedSessions[0];
          setCurrentSession(mostRecent);
          setMessages(mostRecent.messages || []);
          setSessionId(mostRecent.id);
        } else {
          // No valid sessions, start fresh
          clearAllSessions();
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        // Clear corrupted data and start fresh
        clearAllSessions();
      }
    } else {
      // No sessions in localStorage, start with empty state
      setSessions([]);
      setCurrentSession(null);
      setMessages([]);
      setSessionId(Date.now().toString());
    }
  };

  const saveSessions = (sessionsToSave = null) => {
    // Use provided sessions or current state
    let finalSessions = sessionsToSave || sessions;

    // Save current session messages before saving
    if (currentSession && messages.length > 0) {
      finalSessions = finalSessions.map(s =>
        s.id === currentSession.id
          ? { ...s, messages: messages }
          : s
      );
    }

    localStorage.setItem('chat_sessions', JSON.stringify(finalSessions));
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

    // Check if there's an active session
    if (!currentSession) {
      alert('Please create a new session before sending messages.');
      return;
    }

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
        <ApiKeyModal
          show={showApiKeyInput}
          apiKey={apiKey}
          setApiKey={setApiKey}
          onSubmit={handleApiKeySubmit}
          onCancel={() => setShowApiKeyInput(false)}
        />

        {/* Chat Header */}
        <ChatHeader
          currentSession={currentSession}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          isInitialized={isInitialized}
          isGeneratingEmbeddings={isGeneratingEmbeddings}
          embeddingProgress={embeddingProgress}
          embeddingError={embeddingError}
          cacheStats={cacheStats}
          useSemanticSearchMode={useSemanticSearchMode}
          setUseSemanticSearchMode={setUseSemanticSearchMode}
          selectedDocuments={selectedDocuments}
          handleGenerateEmbeddings={handleGenerateEmbeddings}
          setShowApiKeyInput={setShowApiKeyInput}
          showDocumentSelector={showDocumentSelector}
          setShowDocumentSelector={setShowDocumentSelector}
          selectedPersona={selectedPersona}
          setSelectedPersona={setSelectedPersona}
          personas={personas}
        />

        {/* Document Selection Panel */}
        <DocumentSelector
          show={showDocumentSelector}
          allDocuments={allDocuments}
          selectedDocuments={selectedDocuments}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          toggleDocumentSelection={toggleDocumentSelection}
        />

        {/* Chat Messages */}
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          setInputMessage={setInputMessage}
        />

        {/* Chat Input */}
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          selectedDocuments={selectedDocuments}
          isLoading={isLoading}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
          currentSession={currentSession}
        />
      </div>
    </div>
  );
};

export default ChatPage;