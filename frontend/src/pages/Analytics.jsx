
import AppHeader from '../components/AppHeader';

function Analytics({ analytics, timeframe, setTimeframe, onLogout }) {
  return (
    <div className="dashboard d-flex flex-column vh-100">
  <AppHeader title="Analytics" subtitle="View system usage and performance metrics" showBack={true} backTo="/dashboard" onLogout={onLogout} />
      <div className="container-fluid flex-grow-1 p-4">
        <div className="row">
          <div className="col-12 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-2">
                  <i className="fas fa-chart-bar me-2 text-primary"></i>
                  Analytics Dashboard
                </h1>
                <p className="text-muted">Track your system usage and performance metrics.</p>
              </div>
              <div>
                <select
                  className="form-select theme-input"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 3 months</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {analytics ? (
          <div className="row g-4 mb-5">
            {/* Example metric card, add more as needed */}
            <div className="col-lg-3 col-md-6">
              <div className="card card-elevated h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="bg-primary bg-opacity-10 rounded p-3">
                      <i className="fas fa-comments fa-2x text-primary"></i>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">Total Messages</small>
                      <h3 className="mb-0">{analytics.total_messages}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-5 text-muted">
            <i className="fas fa-chart-bar fa-3x mb-3 opacity-50"></i>
            <h5>No Analytics Data Available</h5>
            <p>Start using the system to generate analytics data.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
