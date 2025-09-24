function DocumentControls({
  searchTerm,
  setSearchTerm,
  handleSearch,
  isSearching,
  fileInputRef,
  handleFileUpload,
  documentsLoading,
  handleExportDocuments,
  setShowImportModal,
  importInputRef,
  handleImportDocuments,
  setSearchResults,
  setIsSearching
}) {
  return (
    <div className="row g-3 mb-4">
      <div className="col-12 col-sm-8">
        <div className="input-group">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="form-control theme-input"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="btn theme-btn btn-primary"
            type="button"
          >
            {isSearching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
          </button>
        </div>
      </div>
      <div className="col-12 col-sm-4">
        <div className="d-grid gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn theme-btn btn-success"
            disabled={documentsLoading}
          >
            <i className="fas fa-upload me-2"></i>Upload Document
          </button>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSearchResults([])
                setIsSearching(false)
              }}
              className="btn btn-outline-secondary btn-sm"
            >
              <i className="fas fa-times me-2"></i>Clear Search
            </button>
          )}
        </div>
      </div>
      <div className="col-12">
        <div className="d-flex gap-2 flex-wrap">
          <button
            onClick={handleExportDocuments}
            className="btn theme-btn btn-secondary"
          >
            <i className="fas fa-download me-2"></i>Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn theme-btn btn-secondary"
          >
            <i className="fas fa-upload me-2"></i>Import
          </button>
        </div>
      </div>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.pdf"
        onChange={handleFileUpload}
        className="d-none"
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        onChange={handleImportDocuments}
        className="d-none"
      />
    </div>
  )
}

export default DocumentControls
