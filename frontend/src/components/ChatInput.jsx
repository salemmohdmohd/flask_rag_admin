

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
    <div className="chat-input-container bg-white border-top p-3">
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

      <form
        className="d-flex gap-2 align-items-end"
        onSubmit={e => { e.preventDefault(); sendMessage(); }}
        role="search"
        aria-label="Chat input form"
      >
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
            className="form-control theme-input"
            rows={3}
            disabled={isDisabled}
            aria-label="Message input"
            minLength={1}
            maxLength={500}
            autoComplete="off"
            required
            style={{resize: 'vertical'}}
          />
        </div>
        <button
          type="submit"
          disabled={isDisabled || !inputMessage.trim()}
          className="btn theme-btn btn-primary"
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : <span aria-hidden="true">📤</span>}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
