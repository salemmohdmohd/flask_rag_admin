
import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
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
			<div className="settings dashboard d-flex flex-column vh-100">
				 {/* Unified App Header */}
				 <AppHeader title="Settings" subtitle="Configure your preferences and account" showBack={true} backTo="/dashboard" onLogout={onLogout} />

				<div className="container py-4">
				   <div className="settings-panel mx-auto" style={{maxWidth: 480}}>
					   {userInfo && (
						   <div className="mb-3">
							   <label className="form-label">Username</label>
							   <input type="text" className="form-control theme-input" value={userInfo.username || 'N/A'} disabled />
						   </div>
					   )}
					   {userInfo && (
						   <div className="mb-3">
							   <label className="form-label">Email</label>
							   <input type="email" className="form-control theme-input" value={userInfo.email || 'N/A'} disabled />
						   </div>
					   )}
					   <div className="mb-3 d-flex align-items-center justify-content-between">
						   <label className="form-label mb-0">Theme</label>
						   <div className="form-check form-switch mb-0">
							   <input className="form-check-input" type="checkbox" checked={settings.theme === 'dark'} onChange={e => handleThemeChange(e.target.checked ? 'dark' : 'light')} />
							   <span className="ms-2 small">{settings.theme === 'dark' ? 'Dark' : 'Light'}</span>
						   </div>
					   </div>
					   <div className="mb-3 d-flex align-items-center justify-content-between">
						   <label className="form-label mb-0">Notifications</label>
						   <div className="form-check form-switch mb-0">
							   <input className="form-check-input" type="checkbox" checked={settings.notifications} onChange={e => setSettings(prev => ({ ...prev, notifications: e.target.checked }))} />
						   </div>
					   </div>
					   <div className="mb-3">
						   <label className="form-label">Language</label>
						   <select className="form-select theme-input" value={settings.language} onChange={e => setSettings(prev => ({ ...prev, language: e.target.value }))}>
							   <option value="en">English</option>
							   <option value="es">Español</option>
							   <option value="fr">Français</option>
							   <option value="de">Deutsch</option>
						   </select>
					   </div>
					   <div className="mb-3 d-flex align-items-center justify-content-between">
						   <label className="form-label mb-0">Auto-save Chat</label>
						   <div className="form-check form-switch mb-0">
							   <input className="form-check-input" type="checkbox" checked={settings.auto_save} onChange={e => setSettings(prev => ({ ...prev, auto_save: e.target.checked }))} />
						   </div>
					   </div>
					   <div className="mb-4 text-center">
						   <button className="btn theme-btn btn-primary w-100" onClick={saveSettings} disabled={saving}>
							   {saving ? (
								   <span><span className="spinner-border spinner-border-sm me-2" role="status"></span>Saving...</span>
							   ) : (
								   <span>Save Settings</span>
							   )}
						   </button>
					   </div>
					   {/* Danger Zone Inline */}
					   <div className="border-top pt-3 mt-4">
						   <div className="d-flex align-items-center justify-content-between mb-2">
							   <span className="text-danger fw-bold">Delete Account</span>
							   <button className="btn theme-btn btn-outline-danger btn-sm" onClick={() => setShowDangerZone(!showDangerZone)}>{showDangerZone ? 'Cancel' : 'Delete'}</button>
						   </div>
						   {showDangerZone && (
							   <div>
								   <input type="text" className="form-control theme-input mb-2" value={deleteConfirmation} onChange={e => setDeleteConfirmation(e.target.value)} placeholder="Type DELETE MY DATA" />
								   <button className="btn theme-btn btn-danger w-100" onClick={handleDeleteAccount} disabled={deleteConfirmation !== 'DELETE MY DATA' || isDeleting}>
									   {isDeleting ? (
										   <span><span className="spinner-border spinner-border-sm me-2" role="status"></span>Deleting...</span>
									   ) : (
										   <span>Delete My Account Forever</span>
									   )}
								   </button>
							   </div>
						   )}
					   </div>
				   </div>
			   </div>
		   </div>
	   )
}

export default Settings
