import React from 'react';

const DocumentSelector = ({
  show,
  allDocuments,
  selectedDocuments,
  searchQuery,
  setSearchQuery,
  toggleDocumentSelection
}) => {
  if (!show) return null;

  return (
    <div className="mb-3">
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
                  {doc.content ? doc.content.length : 0} characters
                </small>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default DocumentSelector;