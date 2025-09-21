import React from 'react'
import { Link } from 'react-router-dom'

function Dashboard({ onLogout }) {
	return (
		<div className="dashboard d-flex flex-column vh-100">
			{/* Dashboard Navbar */}
			<nav className="navbar navbar-expand navbar-dark bg-primary py-2 flex-shrink-0">
				<div className="container-fluid px-3">
					<a className="navbar-brand fw-bold d-flex align-items-center" href="#" style={{ fontSize: '1.1rem' }}>
						<i className="fas fa-tachometer-alt me-2 d-none d-sm-inline"></i>
						<span className="d-none d-md-inline">RAG Admin Dashboard</span>
						<span className="d-md-none">Dashboard</span>
					</a>

					<div className="navbar-nav ms-auto">
						<button className="btn btn-outline-light btn-sm py-1 px-3" onClick={onLogout}>
							<i className="fas fa-sign-out-alt me-1 d-none d-sm-inline"></i>
							<span className="d-none d-sm-inline">Logout</span>
							<span className="d-sm-none"><i className="fas fa-sign-out-alt"></i></span>
						</button>
					</div>
				</div>
			</nav>

			{/* Dashboard Content */}
			<div className="container-fluid flex-grow-1 p-4">
				<div className="row">
					<div className="col-12 mb-4">
						<h1 className="h3 mb-4">
							<i className="fas fa-tachometer-alt me-2 text-primary"></i>
							Admin Dashboard
						</h1>
						<p className="text-muted">Manage your RAG system, documents, and chat sessions.</p>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="row g-4 mb-5">
							<div className="col-lg-3 col-md-6">
								<div className="card h-100 border-0 shadow-sm">
									<div className="card-body text-center p-4">
										<div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '70px', height: '70px' }}>
											<i className="fas fa-comments fa-2x text-primary"></i>
										</div>
										<h5 className="card-title">Chat Interface</h5>
										<p className="card-text text-muted">Start conversations with your RAG system</p>
										<Link to="/chat" className="btn btn-primary btn-sm">
											<i className="fas fa-arrow-right me-1"></i>
											Open Chat
										</Link>
									</div>
								</div>
							</div>

					<div className="col-lg-3 col-md-6">
						<div className="card h-100 border-0 shadow-sm">
							<div className="card-body text-center p-4">
								<div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '70px', height: '70px' }}>
									<i className="fas fa-file-upload fa-2x text-success"></i>
								</div>
								<h5 className="card-title">Document Management</h5>
								<p className="card-text text-muted">Upload, edit, or delete your knowledge base documents and personas</p>
								<Link to="/documents" className="btn btn-success btn-sm">
									<i className="fas fa-arrow-right me-1"></i>
									Manage Documents
								</Link>
							</div>
						</div>
					</div>

					<div className="col-lg-3 col-md-6">
						<div className="card h-100 border-0 shadow-sm">
							<div className="card-body text-center p-4">
								<div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '70px', height: '70px' }}>
									<i className="fas fa-cog fa-2x text-warning"></i>
								</div>
								<h5 className="card-title">Settings</h5>
								<p className="card-text text-muted">Manage your settings like dark theme or completely delete your data (non-reversible)</p>
								<Link to="/settings" className="btn btn-warning btn-sm">
									<i className="fas fa-arrow-right me-1"></i>
									Open Settings
								</Link>
							</div>
						</div>
					</div>

					<div className="col-lg-3 col-md-6">
						<div className="card h-100 border-0 shadow-sm">
							<div className="card-body text-center p-4">
								<div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '70px', height: '70px' }}>
									<i className="fas fa-chart-bar fa-2x text-info"></i>
								</div>
								<h5 className="card-title">Analytics</h5>
								<p className="card-text text-muted">View your system usage and performance metrics</p>
								<Link to="/analytics" className="btn btn-info btn-sm">
									<i className="fas fa-arrow-right me-1"></i>
									View Analytics
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* Recent Activity - Placeholder */}
				<div className="row">
					<div className="col-12">
						<div className="card border-0 shadow-sm">
							<div className="card-header bg-white border-bottom">
								<h5 className="mb-0">
									<i className="fas fa-clock me-2 text-primary"></i>
									Recent Activity
								</h5>
							</div>
							<div className="card-body">
								<div className="text-center py-5 text-muted">
									<i className="fas fa-history fa-3x mb-3 opacity-50"></i>
									<h6>No recent activity</h6>
									<p>Start using the chat interface to see activity here.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Dashboard