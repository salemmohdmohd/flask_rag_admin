function SystemResourcesTable({ systemResources, formatDate }) {
  if (systemResources.length === 0) return null
  return (
    <div className="overflow-x-auto bg-blue-50 rounded-lg">
      <table className="min-w-full divide-y divide-blue-200">
        <thead className="bg-blue-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">File Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Added</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-blue-200">
          {systemResources.map((doc) => (
            <tr key={`system-${doc.id}`} className="hover:bg-blue-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <i className="fas fa-shield-alt text-blue-600 mr-3"></i>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{doc.filename || doc.name}</div>
                    {doc.description && (
                      <div className="text-sm text-gray-500">{doc.description}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <i className="fas fa-building mr-1"></i>Company Default
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <i className="fas fa-check-circle mr-1"></i>Available
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(doc.uploadDate || doc.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SystemResourcesTable
