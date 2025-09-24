function ImportModal({ showImportModal, setShowImportModal, importInputRef, handleImportDocuments }) {
  if (!showImportModal) return null
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Import Documents</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select a JSON backup file to import documents from a previous export.
        </p>
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          onChange={handleImportDocuments}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowImportModal(false)}
            className="btn theme-btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImportModal
