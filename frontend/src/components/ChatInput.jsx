import React from 'react';

const ChatInput = ({
  inputMessage,
  setInputMessage,
  selectedDocuments,
  isLoading,
  sendMessage,
  handleKeyPress,
  currentSession
}) => {
  const isDisabled = isLoading || !currentSession;

  return (
    <div className="border-top bg-white p-3">
      {selectedDocuments.length > 0 && (
        <div className="alert alert-info py-2 mb-3">
          <small>
            📄 Using {selectedDocuments.length} documents: {' '}
            {selectedDocuments.map(d => d.filename || d.name).join(', ')}
          </small>
        </div>
      )}

      {!currentSession && (
        <div className="alert alert-warning py-2 mb-3">
          <small>
            ⚠️ Please create a new session from the sidebar to start chatting
          </small>
        </div>
      )}

      <div className="d-flex gap-2 align-items-end">
        <div className="flex-grow-1">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              currentSession
                ? "Ask a question about your documents..."
                : "Create a session to start chatting..."
            }
            className="form-control"
            rows="3"
            disabled={isDisabled}
            style={{resize: 'vertical', minHeight: '80px'}}
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={isDisabled || !inputMessage.trim()}
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
  );
};

export default ChatInput;