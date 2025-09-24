function DocumentsTable({
  userResources,
  formatFileSize,
  formatDate,
  handleDeleteDocument
}) {
  if (userResources.length === 0) return null
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {userResources.map((doc) => (
            <tr key={`user-${doc.id}`} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <i className="fas fa-file-alt text-gray-400 mr-3"></i>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{doc.filename || doc.name}</div>
                    {doc.description && (
                      <div className="text-sm text-gray-500">{doc.description}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFileSize(doc.fileSize)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <i className="fas fa-check-circle mr-1"></i>Indexed
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(doc.uploadDate || doc.created_at)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete document"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DocumentsTable
