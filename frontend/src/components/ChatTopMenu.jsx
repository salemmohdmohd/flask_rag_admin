
function ChatTopMenu({
  personas = [],
  selectedPersona,
  setSelectedPersona,
  selectedDocuments = [],
  setShowDocumentSelector,
  className = '',
}) {
  return (
    <div
      className={`chat-top-menu d-flex align-items-center gap-3 px-3 py-2 bg-white border-bottom shadow-sm rounded-bottom-2 ${className}`}
      style={{ minHeight: 44, fontSize: 15 }}
    >
      {/* Persona Selector */}
      <div className="d-flex align-items-center gap-2">
        <i className="fas fa-user-astronaut text-primary"></i>
        <select
          value={selectedPersona}
          onChange={e => setSelectedPersona(e.target.value)}
          className="form-select form-select-sm theme-input"
          style={{ minWidth: 120, maxWidth: 180, fontSize: 15 }}
          aria-label="Select persona"
        >
          {personas.map(persona => (
            <option key={persona.name} value={persona.name}>
              {persona.display_name}
            </option>
          ))}
        </select>
      </div>
      {/* Document Selector */}
      <button
        className="btn btn-sm theme-btn btn-outline-primary d-flex align-items-center gap-1"
        style={{ borderRadius: 8, fontSize: 15 }}
        onClick={() => setShowDocumentSelector(true)}
        aria-label="Select documents"
      >
        <i className="fas fa-file-alt"></i>
        <span>Docs</span>
        <span className="badge bg-primary ms-1" style={{ fontSize: 12 }}>{selectedDocuments.length}</span>
      </button>
    </div>
  );
}

export default ChatTopMenu;
