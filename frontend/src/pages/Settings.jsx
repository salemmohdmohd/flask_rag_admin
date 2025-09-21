import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'

function Settings({ onLogout }) {
	const { token } = useAuth()
	const [settings, setSettings] = useState({
		theme: 'light',
		notifications: true,
		auto_save: true,
		language: 'en'
	})
	const [userInfo, setUserInfo] = useState(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [showDangerZone, setShowDangerZone] = useState(false)
	const [deleteConfirmation, setDeleteConfirmation] = useState('')
	const [isDeleting, setIsDeleting] = useState(false)

	useEffect(() => {
		fetchSettings()
		fetchUserInfo()
	}, [])

	const fetchSettings = async () => {
		try {
			const response = await fetch('/api/dashboard/settings', {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})
			if (response.ok) {
				const data = await response.json()
				setSettings(data.settings || settings)
			}
		} catch (error) {
			console.error('Error fetching settings:', error)
		}
	}

	const fetchUserInfo = async () => {
		try {
			const response = await fetch('/api/dashboard/user', {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})
			if (response.ok) {
				const data = await response.json()
				setUserInfo(data.user || null)
			}
		} catch (error) {
			console.error('Error fetching user info:', error)
		} finally {
			setLoading(false)
		}
	}

	const saveSettings = async () => {
		setSaving(true)
		try {
			const response = await fetch('/api/dashboard/settings', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ settings })
			})

			if (response.ok) {
				// Apply theme immediately
				document.documentElement.setAttribute('data-bs-theme', settings.theme)
				alert('Settings saved successfully!')
			} else {
				alert('Failed to save settings')
			}
		} catch (error) {
			console.error('Error saving settings:', error)
			alert('Error saving settings')
		} finally {
			setSaving(false)
		}
	}

	const handleDeleteAccount = async () => {
		if (deleteConfirmation !== 'DELETE MY DATA') {
			alert('Please type "DELETE MY DATA" to confirm deletion')
			return
		}

		setIsDeleting(true)
		try {
			const response = await fetch('/api/dashboard/user', {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})

			if (response.ok) {
				alert('Account and all data deleted successfully')
				localStorage.removeItem('auth_token')
				onLogout()
			} else {
				alert('Failed to delete account')
			}
		} catch (error) {
			console.error('Error deleting account:', error)
			alert('Error deleting account')
		} finally {
			setIsDeleting(false)
		}
	}

	const handleThemeChange = (newTheme) => {
		setSettings(prev => ({ ...prev, theme: newTheme }))
		// Apply theme immediately for preview
		document.documentElement.setAttribute('data-bs-theme', newTheme)
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
		<div className="settings d-flex flex-column vh-100">
			{/* Navigation */}
			<nav className="navbar navbar-expand navbar-dark bg-primary py-2 flex-shrink-0">
				<div className="container-fluid px-3">
					<Link to="/dashboard" className="navbar-brand fw-bold d-flex align-items-center" style={{ fontSize: '1.1rem' }}>
						<i className="fas fa-cog me-2 d-none d-sm-inline"></i>
						<span className="d-none d-md-inline">Settings</span>
						<span className="d-md-none">Settings</span>
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
						<h1 className="h3 mb-4">
							<i className="fas fa-cog me-2 text-primary"></i>
							Settings
						</h1>
						<p className="text-muted">Manage your account preferences and system settings.</p>
					</div>
				</div>

				<div className="row">
					<div className="col-lg-8">
						{/* User Information */}
						<div className="card border-0 shadow-sm mb-4">
							<div className="card-header bg-white border-bottom">
								<h5 className="mb-0">
									<i className="fas fa-user me-2 text-primary"></i>
									Account Information
								</h5>
							</div>
							<div className="card-body">
								{userInfo && (
									<div className="row g-3">
										<div className="col-md-6">
											<label className="form-label">Username</label>
											<input
												type="text"
												className="form-control"
												value={userInfo.username || 'N/A'}
												disabled
											/>
										</div>
										<div className="col-md-6">
											<label className="form-label">Email</label>
											<input
												type="email"
												className="form-control"
												value={userInfo.email || 'N/A'}
												disabled
											/>
										</div>
										<div className="col-md-6">
											<label className="form-label">Role</label>
											<input
												type="text"
												className="form-control"
												value={userInfo.role || 'User'}
												disabled
											/>
										</div>
										<div className="col-md-6">
											<label className="form-label">Member Since</label>
											<input
												type="text"
												className="form-control"
												value={userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : 'N/A'}
												disabled
											/>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Interface Settings */}
						<div className="card border-0 shadow-sm mb-4">
							<div className="card-header bg-white border-bottom">
								<h5 className="mb-0">
									<i className="fas fa-palette me-2 text-primary"></i>
									Interface Settings
								</h5>
							</div>
							<div className="card-body">
								<div className="row g-4">
									<div className="col-md-6">
										<label className="form-label">Theme</label>
										<div className="d-grid gap-2">
											<button
												className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-outline-primary'}`}
												onClick={() => handleThemeChange('light')}
											>
												<i className="fas fa-sun me-2"></i>
												Light Theme
											</button>
											<button
												className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-outline-primary'}`}
												onClick={() => handleThemeChange('dark')}
											>
												<i className="fas fa-moon me-2"></i>
												Dark Theme
											</button>
										</div>
									</div>
									<div className="col-md-6">
										<label className="form-label">Language</label>
										<select
											className="form-select"
											value={settings.language}
											onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
										>
											<option value="en">English</option>
											<option value="es">Español</option>
											<option value="fr">Français</option>
											<option value="de">Deutsch</option>
										</select>
									</div>
								</div>
							</div>
						</div>

						{/* Preferences */}
						<div className="card border-0 shadow-sm mb-4">
							<div className="card-header bg-white border-bottom">
								<h5 className="mb-0">
									<i className="fas fa-sliders-h me-2 text-primary"></i>
									Preferences
								</h5>
							</div>
							<div className="card-body">
								<div className="row g-3">
									<div className="col-12">
										<div className="form-check form-switch">
											<input
												className="form-check-input"
												type="checkbox"
												checked={settings.notifications}
												onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
											/>
											<label className="form-check-label">
												Enable Notifications
											</label>
										</div>
									</div>
									<div className="col-12">
										<div className="form-check form-switch">
											<input
												className="form-check-input"
												type="checkbox"
												checked={settings.auto_save}
												onChange={(e) => setSettings(prev => ({ ...prev, auto_save: e.target.checked }))}
											/>
											<label className="form-check-label">
												Auto-save Chat Sessions
											</label>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Save Button */}
						<div className="card border-0 shadow-sm mb-4">
							<div className="card-body text-center">
								<button
									className="btn btn-primary btn-lg"
									onClick={saveSettings}
									disabled={saving}
								>
									{saving ? (
										<>
											<div className="spinner-border spinner-border-sm me-2" role="status"></div>
											Saving...
										</>
									) : (
										<>
											<i className="fas fa-save me-2"></i>
											Save Settings
										</>
									)}
								</button>
							</div>
						</div>

						{/* Danger Zone */}
						<div className="card border-danger mb-4">
							<div className="card-header bg-danger bg-opacity-10 border-bottom border-danger">
								<h5 className="mb-0 text-danger">
									<i className="fas fa-exclamation-triangle me-2"></i>
									Danger Zone
								</h5>
							</div>
							<div className="card-body">
								<div className="d-flex justify-content-between align-items-center mb-3">
									<div>
										<h6 className="mb-1">Delete Account</h6>
										<p className="text-muted mb-0 small">
											Permanently delete your account and all associated data. This action cannot be undone.
										</p>
									</div>
									<button
										className="btn btn-outline-danger"
										onClick={() => setShowDangerZone(!showDangerZone)}
									>
										{showDangerZone ? 'Cancel' : 'Delete Account'}
									</button>
								</div>

								{showDangerZone && (
									<div className="border-top pt-3">
										<div className="alert alert-danger">
											<strong>Warning!</strong> This will permanently delete:
											<ul className="mb-0 mt-2">
												<li>Your account and profile</li>
												<li>All uploaded documents</li>
												<li>All created personas</li>
												<li>All chat history</li>
												<li>All settings and preferences</li>
											</ul>
										</div>
										<div className="mb-3">
											<label className="form-label">
												Type <strong>"DELETE MY DATA"</strong> to confirm:
											</label>
											<input
												type="text"
												className="form-control"
												value={deleteConfirmation}
												onChange={(e) => setDeleteConfirmation(e.target.value)}
												placeholder="DELETE MY DATA"
											/>
										</div>
										<button
											className="btn btn-danger"
											onClick={handleDeleteAccount}
											disabled={deleteConfirmation !== 'DELETE MY DATA' || isDeleting}
										>
											{isDeleting ? (
												<>
													<div className="spinner-border spinner-border-sm me-2" role="status"></div>
													Deleting...
												</>
											) : (
												<>
													<i className="fas fa-trash me-2"></i>
													Delete My Account Forever
												</>
											)}
										</button>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Sidebar */}
					<div className="col-lg-4">
						<div className="card border-0 shadow-sm">
							<div className="card-header bg-white border-bottom">
								<h6 className="mb-0">
									<i className="fas fa-info-circle me-2 text-primary"></i>
									Quick Info
								</h6>
							</div>
							<div className="card-body">
								<div className="d-flex justify-content-between py-2">
									<span>Documents:</span>
									<strong>{userInfo?.stats?.documents || 0}</strong>
								</div>
								<div className="d-flex justify-content-between py-2">
									<span>Personas:</span>
									<strong>{userInfo?.stats?.personas || 0}</strong>
								</div>
								<div className="d-flex justify-content-between py-2">
									<span>Chat Sessions:</span>
									<strong>{userInfo?.stats?.chat_sessions || 0}</strong>
								</div>
								<div className="d-flex justify-content-between py-2">
									<span>Storage Used:</span>
									<strong>{userInfo?.stats?.storage_used || '0 MB'}</strong>
								</div>
							</div>
						</div>

						<div className="card border-0 shadow-sm mt-4">
							<div className="card-header bg-white border-bottom">
								<h6 className="mb-0">
									<i className="fas fa-question-circle me-2 text-primary"></i>
									Help & Support
								</h6>
							</div>
							<div className="card-body">
								<p className="text-muted small mb-3">
									Need help with your account or have questions about features?
								</p>
								<div className="d-grid gap-2">
									<button className="btn btn-outline-primary btn-sm">
										<i className="fas fa-book me-2"></i>
										Documentation
									</button>
									<button className="btn btn-outline-primary btn-sm">
										<i className="fas fa-envelope me-2"></i>
										Contact Support
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Settings