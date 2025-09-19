import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function FileEditor() {
	const [files, setFiles] = useState([])
	const [selected, setSelected] = useState('')
	const [content, setContent] = useState('')
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [message, setMessage] = useState('')

	const loadList = async () => {
		setError('')
		try {
			const r = await axios.get('/admin/resources')
			setFiles(r.data.items || [])
		} catch (e) {
			setError(e?.response?.data?.error || e.message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => { loadList() }, [])

	const loadFile = async path => {
		setError('')
		setMessage('')
		setSelected(path)
		setContent('')
		try {
			const r = await axios.get('/admin/resource', { params: { path } })
			setContent(r.data.content || '')
		} catch (e) {
			setError(e?.response?.data?.error || e.message)
		}
	}

	const save = async () => {
		if (!selected) return
		setSaving(true)
		setError('')
		setMessage('')
		try {
			await axios.put('/admin/resource', { path: selected, content })
			setMessage('Saved')
			await loadList()
		} catch (e) {
			setError(e?.response?.data?.error || e.message)
		} finally {
			setSaving(false)
		}
	}

	const del = async () => {
		if (!selected) return
		if (!confirm(`Delete ${selected}?`)) return
		setError('')
		setMessage('')
		try {
			await axios.delete('/admin/resources', { data: { path: selected } })
			setSelected('')
			setContent('')
			await loadList()
			setMessage('Deleted')
		} catch (e) {
			setError(e?.response?.data?.error || e.message)
		}
	}

	if (loading) return <div className="text-muted small">Loading files…</div>
	if (error) return <div className="alert alert-warning py-2">{error}</div>

	return (
		<div className="row g-3">
			<div className="col-md-4">
				<h3 className="h6">Resources</h3>
				<ul className="list-group">
					{files.map(f => (
						<li key={f.path} className={`list-group-item d-flex justify-content-between align-items-center ${selected === f.path ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => loadFile(f.path)}>
							<span>{f.path}</span>
							<span className="badge bg-secondary rounded-pill">{Math.round(f.size / 1024)} KB</span>
						</li>
					))}
					{files.length === 0 && <li className="list-group-item">No markdown files yet.</li>}
				</ul>
			</div>
			<div className="col-md-8">
				<h3 className="h6">Editor</h3>
				{!selected ? (
					<div className="text-muted">Select a file from the left.</div>
				) : (
					<div>
						<div className="mb-2 d-flex gap-2">
							<button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
							<button className="btn btn-outline-danger" onClick={del}>Delete</button>
						</div>
						<textarea className="form-control" rows="18" value={content} onChange={e => setContent(e.target.value)} />
					</div>
				)}
				{message && <div className="alert alert-success py-2 mt-2">{message}</div>}
			</div>
		</div>
	)
}

