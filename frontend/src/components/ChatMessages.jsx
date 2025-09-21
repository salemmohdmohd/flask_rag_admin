import React from 'react';

const ChatMessages = ({ messages, isLoading, messagesEndRef, setInputMessage }) => {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
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
  );
};

export default ChatMessages;