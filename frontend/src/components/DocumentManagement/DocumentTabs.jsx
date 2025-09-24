function DocumentTabs({ activeTab, setActiveTab, documentsCount, personasCount }) {
  return (
    <div className="card mb-4">
      <div className="card-header p-0">
        <ul className="nav nav-tabs card-header-tabs" role="tablist">
          <li className="nav-item">
            <button
              onClick={() => setActiveTab('documents')}
              className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
              type="button"
            >
              <i className="fas fa-file-alt me-2"></i>
              Documents ({documentsCount})
            </button>
          </li>
          <li className="nav-item">
            <button
              onClick={() => setActiveTab('personas')}
              className={`nav-link ${activeTab === 'personas' ? 'active' : ''}`}
              type="button"
            >
              <i className="fas fa-user-tie me-2"></i>
              Personas ({personasCount})
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default DocumentTabs
