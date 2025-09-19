import React, { useEffect, useState } from 'react'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/api'
const tokenKey = 'jwt_token'
const saved = localStorage.getItem(tokenKey)
if (saved) {
	axios.defaults.headers.common['Authorization'] = `Bearer ${saved}`
}

export default function App() {
	const [status, setStatus] = useState('loading...')
	const [token, setToken] = useState(saved || '')
	const [form, setForm] = useState({ username: '', password: '' })
	const [loginError, setLoginError] = useState('')

	useEffect(() => {
		axios.get('/health').then(r => setStatus(r.data.status)).catch(() => setStatus('error'))
	}, [])

	const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })
	const onLogin = async e => {
		e.preventDefault()
		setLoginError('')
		try {
			const res = await axios.post('/auth/login', form)
			const t = res.data.token
			setToken(t)
			localStorage.setItem(tokenKey, t)
			axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
		} catch (err) {
			setLoginError('Invalid credentials')
		}
	}
	const onLogout = () => {
		setToken('')
		delete axios.defaults.headers.common['Authorization']
		localStorage.removeItem(tokenKey)
	}

	return (
		<div className="container py-4">
			<h1 className="mb-3">Flask RAG Admin</h1>
			<p>Backend status: {status}</p>

			{!token ? (
				<form onSubmit={onLogin} className="card p-3" style={{ maxWidth: 420 }}>
					<h2 className="h5 mb-3">Login</h2>
					{loginError && <div className="alert alert-danger py-2">{loginError}</div>}
					<div className="mb-2">
						<label className="form-label">Username</label>
						<input name="username" value={form.username} onChange={onChange} className="form-control" />
					</div>
					<div className="mb-3">
						<label className="form-label">Password</label>
						<input type="password" name="password" value={form.password} onChange={onChange} className="form-control" />
					</div>
					<button className="btn btn-primary w-100" type="submit">Login</button>
				</form>
			) : (
				<div className="mb-3">
					<div className="alert alert-success">Logged in. JWT stored locally.</div>
					<button className="btn btn-outline-danger" onClick={onLogout}>Logout</button>
				</div>
			)}

			<hr />
			{token && (
				<ProtectedArea />
			)}
		</div>
	)
}

function ProtectedArea() {
	const [items, setItems] = useState([])
	const [message, setMessage] = useState('')
	const [resp, setResp] = useState('')

	const loadHistory = async () => {
		const r = await axios.get('/chat/history')
		setItems(r.data.items)
	}
	useEffect(() => { loadHistory() }, [])

	const send = async () => {
		if (!message.trim()) return
		const r = await axios.post('/chat/message', { message })
		setResp(r.data.response)
		setMessage('')
		loadHistory()
	}

	return (
		<div className="row g-3">
			<div className="col-md-6">
				<h3 className="h6">Send Message</h3>
				<div className="input-group">
					<input className="form-control" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask something..." />
					<button className="btn btn-primary" onClick={send}>Send</button>
				</div>
				{resp && <div className="mt-3"><strong>Answer:</strong><pre className="mt-2 p-2 bg-light">{resp}</pre></div>}
			</div>
			<div className="col-md-6">
				<h3 className="h6">History</h3>
				<ul className="list-group">
					{items.map(i => (
						<li key={i.id} className="list-group-item">
							<div><strong>Q:</strong> {i.message}</div>
							<div><strong>From:</strong> {i.source_file || 'n/a'}</div>
							<div className="text-muted small">{i.created_at}</div>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

// rendered by src/main.jsx

