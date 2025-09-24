function StorageStatsCard({ storageStats }) {
  if (!storageStats) return null
  return (
    <div className="card card-elevated mb-4 border-primary">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex gap-4 small">
            <div className="text-center">
              <div className="h4 fw-bold text-primary mb-0">{storageStats.totalDocuments}</div>
              <div className="text-muted">Documents</div>
            </div>
            <div className="text-center">
              <div className="h4 fw-bold text-success mb-0">{storageStats.totalSizeFormatted}</div>
              <div className="text-muted">Total Size</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StorageStatsCard
