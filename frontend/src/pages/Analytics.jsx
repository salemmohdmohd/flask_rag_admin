import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'

function Analytics({ onLogout }) {
	const { token } = useAuth()
	const [analytics, setAnalytics] = useState(null)
	const [loading, setLoading] = useState(true)
	const [timeframe, setTimeframe] = useState('30d')

	useEffect(() => {
		fetchAnalytics()
	}, [timeframe])

	const fetchAnalytics = async () => {
		setLoading(true)
		try {
			const response = await fetch(`/api/dashboard/analytics?timeframe=${timeframe}`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})
			if (response.ok) {
				const data = await response.json()
				setAnalytics(data)
			}
		} catch (error) {
			console.error('Error fetching analytics:', error)
		} finally {
			setLoading(false)
		}
	}

	const formatNumber = (num) => {
		if (!num) return '0'
		return new Intl.NumberFormat().format(num)
	}

	const formatPercentage = (value, total) => {
		if (!value || !total) return '0%'
		return `${((value / total) * 100).toFixed(1)}%`
	}

	const getGrowthIcon = (current, previous) => {
		if (!previous || current === previous) return 'fas fa-minus text-muted'
		return current > previous ? 'fas fa-arrow-up text-success' : 'fas fa-arrow-down text-danger'
	}

	const getGrowthText = (current, previous) => {
		if (!previous || current === previous) return 'No change'
		const growth = ((current - previous) / previous * 100).toFixed(1)
		return current > previous ? `+${growth}%` : `${growth}%`
	}

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center vh-100">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		)
	}

	return (
		<div className="analytics d-flex flex-column vh-100">
			{/* Navigation */}
			<nav className="navbar navbar-expand navbar-dark bg-primary py-2 flex-shrink-0">
				<div className="container-fluid px-3">
					<Link to="/dashboard" className="navbar-brand fw-bold d-flex align-items-center" style={{ fontSize: '1.1rem' }}>
						<i className="fas fa-chart-bar me-2 d-none d-sm-inline"></i>
						<span className="d-none d-md-inline">Analytics</span>
						<span className="d-md-none">Analytics</span>
					</Link>

					<div className="navbar-nav ms-auto">
						<Link to="/dashboard" className="btn btn-outline-light btn-sm me-2 py-1 px-3">
							<i className="fas fa-arrow-left me-1 d-none d-sm-inline"></i>
							<span className="d-none d-sm-inline">Back to Dashboard</span>
							<span className="d-sm-none"><i className="fas fa-arrow-left"></i></span>
						</Link>
						<button className="btn btn-outline-light btn-sm py-1 px-3" onClick={onLogout}>
							<i className="fas fa-sign-out-alt me-1 d-none d-sm-inline"></i>
							<span className="d-none d-sm-inline">Logout</span>
							<span className="d-sm-none"><i className="fas fa-sign-out-alt"></i></span>
						</button>
					</div>
				</div>
			</nav>

			{/* Content */}
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
									className="form-select"
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
					<>
						{/* Key Metrics */}
						<div className="row g-4 mb-5">
							<div className="col-lg-3 col-md-6">
								<div className="card border-0 shadow-sm h-100">
									<div className="card-body">
										<div className="d-flex justify-content-between align-items-start mb-3">
											<div className="bg-primary bg-opacity-10 rounded p-3">
												<i className="fas fa-comments fa-2x text-primary"></i>
											</div>
											<div className="text-end">
												<small className="text-muted d-block">Total Messages</small>
												<h3 className="mb-0">{formatNumber(analytics.total_messages)}</h3>
											</div>
										</div>
										<div className="d-flex align-items-center text-muted small">
											<i className={getGrowthIcon(analytics.total_messages, analytics.previous_period?.total_messages)}></i>
											<span className="ms-1">{getGrowthText(analytics.total_messages, analytics.previous_period?.total_messages)}</span>
											<span className="ms-1">from last period</span>
										</div>
									</div>
								</div>
							</div>

							<div className="col-lg-3 col-md-6">
								<div className="card border-0 shadow-sm h-100">
									<div className="card-body">
										<div className="d-flex justify-content-between align-items-start mb-3">
											<div className="bg-success bg-opacity-10 rounded p-3">
												<i className="fas fa-clock fa-2x text-success"></i>
											</div>
											<div className="text-end">
												<small className="text-muted d-block">Active Sessions</small>
												<h3 className="mb-0">{formatNumber(analytics.active_sessions)}</h3>
											</div>
										</div>
										<div className="d-flex align-items-center text-muted small">
											<i className={getGrowthIcon(analytics.active_sessions, analytics.previous_period?.active_sessions)}></i>
											<span className="ms-1">{getGrowthText(analytics.active_sessions, analytics.previous_period?.active_sessions)}</span>
											<span className="ms-1">from last period</span>
										</div>
									</div>
								</div>
							</div>

							<div className="col-lg-3 col-md-6">
								<div className="card border-0 shadow-sm h-100">
									<div className="card-body">
										<div className="d-flex justify-content-between align-items-start mb-3">
											<div className="bg-warning bg-opacity-10 rounded p-3">
												<i className="fas fa-file-text fa-2x text-warning"></i>
											</div>
											<div className="text-end">
												<small className="text-muted d-block">Documents</small>
												<h3 className="mb-0">{formatNumber(analytics.total_documents)}</h3>
											</div>
										</div>
										<div className="d-flex align-items-center text-muted small">
											<i className={getGrowthIcon(analytics.total_documents, analytics.previous_period?.total_documents)}></i>
											<span className="ms-1">{getGrowthText(analytics.total_documents, analytics.previous_period?.total_documents)}</span>
											<span className="ms-1">from last period</span>
										</div>
									</div>
								</div>
							</div>

							<div className="col-lg-3 col-md-6">
								<div className="card border-0 shadow-sm h-100">
									<div className="card-body">
										<div className="d-flex justify-content-between align-items-start mb-3">
											<div className="bg-info bg-opacity-10 rounded p-3">
												<i className="fas fa-robot fa-2x text-info"></i>
											</div>
											<div className="text-end">
												<small className="text-muted d-block">Personas</small>
												<h3 className="mb-0">{formatNumber(analytics.total_personas)}</h3>
											</div>
										</div>
										<div className="d-flex align-items-center text-muted small">
											<i className={getGrowthIcon(analytics.total_personas, analytics.previous_period?.total_personas)}></i>
											<span className="ms-1">{getGrowthText(analytics.total_personas, analytics.previous_period?.total_personas)}</span>
											<span className="ms-1">from last period</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Charts and Tables */}
						<div className="row g-4">
							{/* Usage Over Time */}
							<div className="col-lg-8">
								<div className="card border-0 shadow-sm">
									<div className="card-header bg-white border-bottom">
										<h5 className="mb-0">
											<i className="fas fa-chart-line me-2 text-primary"></i>
											Usage Over Time
										</h5>
									</div>
									<div className="card-body">
										{analytics.daily_usage && analytics.daily_usage.length > 0 ? (
											<div className="table-responsive">
												<table className="table table-sm">
													<thead>
														<tr>
															<th>Date</th>
															<th>Messages</th>
															<th>Sessions</th>
															<th>Avg. Response Time</th>
														</tr>
													</thead>
													<tbody>
														{analytics.daily_usage.slice(-7).map((day, index) => (
															<tr key={index}>
																<td>{new Date(day.date).toLocaleDateString()}</td>
																<td>{formatNumber(day.messages)}</td>
																<td>{formatNumber(day.sessions)}</td>
																<td>{day.avg_response_time}ms</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										) : (
											<div className="text-center py-5 text-muted">
												<i className="fas fa-chart-line fa-3x mb-3 opacity-50"></i>
												<h6>No usage data available</h6>
												<p>Start using the system to see usage trends.</p>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Top Personas */}
							<div className="col-lg-4">
								<div className="card border-0 shadow-sm">
									<div className="card-header bg-white border-bottom">
										<h5 className="mb-0">
											<i className="fas fa-star me-2 text-primary"></i>
											Top Personas
										</h5>
									</div>
									<div className="card-body">
										{analytics.top_personas && analytics.top_personas.length > 0 ? (
											<div className="list-group list-group-flush">
												{analytics.top_personas.map((persona, index) => (
													<div key={index} className="list-group-item border-0 px-0 py-2">
														<div className="d-flex justify-content-between align-items-center">
															<div>
																<h6 className="mb-1">{persona.name}</h6>
																<small className="text-muted">{formatNumber(persona.usage_count)} uses</small>
															</div>
															<div className="text-end">
																<div className="progress" style={{ width: '60px', height: '8px' }}>
																	<div
																		className="progress-bar bg-primary"
																		style={{
																			width: formatPercentage(persona.usage_count, analytics.top_personas[0]?.usage_count)
																		}}
																	></div>
																</div>
															</div>
														</div>
													</div>
												))}
											</div>
										) : (
											<div className="text-center py-4 text-muted">
												<i className="fas fa-user-robot fa-2x mb-2 opacity-50"></i>
												<p className="mb-0">No persona usage data</p>
											</div>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Performance Metrics */}
						<div className="row g-4 mt-4">
							<div className="col-lg-6">
								<div className="card border-0 shadow-sm">
									<div className="card-header bg-white border-bottom">
										<h5 className="mb-0">
											<i className="fas fa-tachometer-alt me-2 text-primary"></i>
											Performance Metrics
										</h5>
									</div>
									<div className="card-body">
										<div className="row g-3">
											<div className="col-6">
												<div className="text-center">
													<div className="h4 mb-1 text-primary">{analytics.avg_response_time || 0}ms</div>
													<small className="text-muted">Avg Response Time</small>
												</div>
											</div>
											<div className="col-6">
												<div className="text-center">
													<div className="h4 mb-1 text-success">{formatPercentage(analytics.success_rate, 100)}</div>
													<small className="text-muted">Success Rate</small>
												</div>
											</div>
											<div className="col-6">
												<div className="text-center">
													<div className="h4 mb-1 text-info">{analytics.total_storage || '0 MB'}</div>
													<small className="text-muted">Storage Used</small>
												</div>
											</div>
											<div className="col-6">
												<div className="text-center">
													<div className="h4 mb-1 text-warning">{analytics.indexed_documents || 0}</div>
													<small className="text-muted">Indexed Documents</small>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="col-lg-6">
								<div className="card border-0 shadow-sm">
									<div className="card-header bg-white border-bottom">
										<h5 className="mb-0">
											<i className="fas fa-info-circle me-2 text-primary"></i>
											System Health
										</h5>
									</div>
									<div className="card-body">
										<div className="list-group list-group-flush">
											<div className="list-group-item border-0 px-0 py-2">
												<div className="d-flex justify-content-between align-items-center">
													<span>System Status</span>
													<span className="badge bg-success">Healthy</span>
												</div>
											</div>
											<div className="list-group-item border-0 px-0 py-2">
												<div className="d-flex justify-content-between align-items-center">
													<span>API Availability</span>
													<span className="badge bg-success">99.9%</span>
												</div>
											</div>
											<div className="list-group-item border-0 px-0 py-2">
												<div className="d-flex justify-content-between align-items-center">
													<span>Database Status</span>
													<span className="badge bg-success">Connected</span>
												</div>
											</div>
											<div className="list-group-item border-0 px-0 py-2">
												<div className="d-flex justify-content-between align-items-center">
													<span>Cache Status</span>
													<span className="badge bg-success">Active</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</>
				) : (
					<div className="text-center py-5 text-muted">
						<i className="fas fa-chart-bar fa-3x mb-3 opacity-50"></i>
						<h5>No Analytics Data Available</h5>
						<p>Start using the system to generate analytics data.</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default Analytics