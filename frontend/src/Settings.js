import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Settings() {
	const [text, setText] = useState('{\n  "theme": "light"\n}')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [message, setMessage] = useState('')

	useEffect(() => {
		let cancelled = false
		const load = async () => {
			try {
				const r = await axios.get('/settings')
				const s = r.data.settings || {}
				if (!cancelled) setText(JSON.stringify(s, null, 2))
			} catch (e) {
				if (!cancelled) setError(e?.response?.data?.error || e.message)
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => { cancelled = true }
	}, [])

	const save = async e => {
		e.preventDefault()
		setMessage('')
		setError('')
		try {
			const parsed = JSON.parse(text)
			const r = await axios.put('/settings', parsed)
			setMessage('Saved settings')
			setText(JSON.stringify(r.data.settings || parsed, null, 2))
		} catch (e) {
			if (e instanceof SyntaxError) {
				setError('Invalid JSON: ' + e.message)
			} else {
				setError(e?.response?.data?.error || e.message)
			}
		}
	}

	if (loading) return <div className="text-muted small">Loading settings…</div>
	if (error) return <div className="alert alert-warning py-2">{error}</div>

	return (
		<form onSubmit={save} className="card p-3">
			<h3 className="h6 mb-3">User Settings</h3>
			{message && <div className="alert alert-success py-2">{message}</div>}
			<textarea className="form-control" rows="10" value={text} onChange={e => setText(e.target.value)} />
			<div className="mt-3">
				<button className="btn btn-primary" type="submit">Save</button>
			</div>
		</form>
	)
}

