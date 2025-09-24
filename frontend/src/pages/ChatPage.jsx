import { useEffect, useRef, useState } from 'react';
import AppHeader from '../components/AppHeader';
import ChatInput from '../components/ChatInput';
import ChatMessages from '../components/ChatMessages';
import ChatSidebar from '../components/ChatSidebar';
import ChatTopMenu from '../components/ChatTopMenu';
import DocumentSelector from '../components/DocumentSelector';
import { useAuth } from '../contexts/AuthProvider';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';

const ChatPage = () => {
  const { user } = useAuth();
  const { documents, allDocuments, searchKnowledgeBase } = useKnowledgeBase();

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
  // Remove API key modal and semantic search mode

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

    // No API key or semantic search initialization needed
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
    // No auto-generation of embeddings needed
  }, [selectedDocuments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleApiKeySubmit = async () => {
    // Remove API key submit logic
  };

  const handleGenerateEmbeddings = async () => {
    // Remove embedding generation logic
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
      // Always use full document mode, send selected documents to backend
      const documentsToSend = selectedDocuments.map(doc => ({
        filename: doc.filename || doc.name,
        content: doc.content
      }));
      const searchMethod = 'full_documents';

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
    <div className="dashboard d-flex h-100 position-relative bg-body">
      {/* Sidebar */}
      <div className={`position-relative ${showSidebar ? 'd-block' : 'd-none d-lg-block'} card card-elevated bg-light`} style={{width: '320px', minHeight: '100vh'}}>
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

        {/* Unified App Header */}
        <AppHeader title="AI Chat" subtitle="Converse with your RAG system and documents" showBack={true} backTo="/dashboard" />
        <ChatTopMenu
          personas={personas}
          selectedPersona={selectedPersona}
          setSelectedPersona={setSelectedPersona}
          selectedDocuments={selectedDocuments}
          setShowDocumentSelector={setShowDocumentSelector}
        />

        {/* Document Selection Panel */}
        <div className="theme-doc-selector">
          <DocumentSelector
            show={showDocumentSelector}
            allDocuments={allDocuments}
            selectedDocuments={selectedDocuments}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            toggleDocumentSelection={toggleDocumentSelection}
          />
        </div>

        {/* Chat Messages */}
        <div className="flex-grow-1 px-3 py-2 messages-container">
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
            setInputMessage={setInputMessage}
          />
        </div>

        {/* Chat Input */}
        <div className="chat-input-container card-flat p-3">
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
    </div>
  );
}
export default ChatPage;
