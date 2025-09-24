function NoDocumentsMessage({ searchTerm, fileInputRef }) {
  return (
    <div className="text-center py-12">
      <i className="fas fa-file-alt text-4xl text-gray-400 mb-4"></i>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchTerm ? 'No documents found' : 'No documents uploaded'}
      </h3>
      <p className="text-gray-600 mb-4">
        {searchTerm
          ? 'Try adjusting your search terms'
          : 'Upload your first document to get started'}
      </p>
      {!searchTerm && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn theme-btn btn-primary"
        >
          <i className="fas fa-upload me-2"></i>Upload Document
        </button>
      )}
    </div>
  )
}

export default NoDocumentsMessage
