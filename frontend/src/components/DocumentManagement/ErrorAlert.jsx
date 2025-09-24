function ErrorAlert({ error, onDismiss }) {
  if (!error) return null
  return (
    <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
      <div className="d-flex align-items-start">
        <i className="fas fa-exclamation-triangle text-danger me-3 mt-1"></i>
        <div>
          <h3 className="small fw-medium text-danger mb-1">Error</h3>
          <p className="small text-danger mb-2">{error}</p>
          <button
            onClick={onDismiss}
            className="btn btn-link btn-sm text-danger text-decoration-none p-0"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorAlert
