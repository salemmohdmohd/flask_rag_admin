import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import ChatSidebar from './ChatSidebar';
import ChatTopMenu from './ChatTopMenu';
import DocumentSelector from './DocumentSelector';

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
        {/* Top Menu for Persona & Document Selection */}
        <ChatTopMenu
          personas={personas}
          selectedPersona={selectedPersona}
          setSelectedPersona={setSelectedPersona}
          selectedDocuments={selectedDocuments}
          setShowDocumentSelector={setShowDocumentSelector}
        />

        {/* Document Selector Panel */}
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
}

export default ChatWithClientDocuments;
