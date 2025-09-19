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
	const [statusErr, setStatusErr] = useState('')
	const [token, setToken] = useState(saved || '')
	const [form, setForm] = useState({ username: '', password: '' })
	const [loginError, setLoginError] = useState('')

	useEffect(() => {
		let cancelled = false
		axios.get('/health')
			.then(r => { if (!cancelled) { setStatus(r.data.status || 'ok'); setStatusErr('') } })
			.catch(err => { if (!cancelled) { setStatus('error'); setStatusErr(err?.message || 'unreachable') } })
		return () => { cancelled = true }
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

	// If logged in, show the app dashboard
	if (token) {
		return <Dashboard onLogout={onLogout} />
	}

	// Landing page for non-authenticated users
	return (
		<div className="landing-page">
			{/* Navigation */}
			<nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
				<div className="container">
					<a className="navbar-brand fw-bold text-primary" href="#" style={{ fontSize: '1.5rem' }}>
						RAG Admin
					</a>
					<button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
						<span className="navbar-toggler-icon"></span>
					</button>
					<div className="collapse navbar-collapse" id="navbarNav">
						<ul className="navbar-nav ms-auto">
							<li className="nav-item">
								<a className="nav-link" href="#about">About</a>
							</li>
							<li className="nav-item">
								<a className="nav-link" href="#solutions">Solutions</a>
							</li>
							<li className="nav-item">
								<a className="nav-link" href="#use-cases">Use Cases</a>
							</li>
							<li className="nav-item">
								<a className="nav-link" href="#contact">Contact Us</a>
							</li>
						</ul>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="hero-section py-5">
				<div className="container">
					<div className="row align-items-center min-vh-75">
						{/* Login Form - Left Side */}
						<div className="col-lg-6">
							<div className="card shadow-lg border-0">
								<div className="card-body p-4">
									<h2 className="card-title h4 mb-3 text-center">Login to Dashboard</h2>
									<div className="text-center mb-3">
										<small className="text-muted">Status: {status}{statusErr ? ` (${statusErr})` : ''}</small>
									</div>
									{loginError && <div className="alert alert-danger py-2">{loginError}</div>}
									<form onSubmit={onLogin}>
										<div className="mb-3">
											<label className="form-label">Username</label>
											<input
												name="username"
												value={form.username}
												onChange={onChange}
												className="form-control"
												placeholder="Enter your username"
											/>
										</div>
										<div className="mb-3">
											<label className="form-label">Password</label>
											<input
												type="password"
												name="password"
												value={form.password}
												onChange={onChange}
												className="form-control"
												placeholder="Enter your password"
											/>
										</div>
										<button className="btn btn-primary w-100 py-2" type="submit">
											Access Dashboard
										</button>
									</form>
								</div>
							</div>
						</div>

						{/* Hero Content - Right Side */}
						<div className="col-lg-6">
							<div className="hero-content ps-lg-5">
								<h1 className="display-4 fw-bold mb-4">
									Intelligent Document
									<span className="text-primary"> RAG System</span>
								</h1>
								<p className="lead mb-4">
									Harness the power of Retrieval-Augmented Generation to unlock insights from your documents.
									Our platform combines advanced AI with your knowledge base for intelligent question answering.
								</p>
								<div className="row">
									<div className="col-md-6 mb-3">
										<div className="d-flex align-items-center">
											<div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
												<i className="fas fa-search text-primary"></i>
											</div>
											<div>
												<h6 className="mb-1">Smart Search</h6>
												<small className="text-muted">AI-powered document retrieval</small>
											</div>
										</div>
									</div>
									<div className="col-md-6 mb-3">
										<div className="d-flex align-items-center">
											<div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
												<i className="fas fa-brain text-primary"></i>
											</div>
											<div>
												<h6 className="mb-1">Intelligent Answers</h6>
												<small className="text-muted">Context-aware responses</small>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Info Section */}
			<section className="info-section py-5 bg-light">
				<div className="container">
					<div className="row text-center mb-5">
						<div className="col-12">
							<h2 className="display-5 fw-bold mb-3">Why Choose RAG Admin?</h2>
							<p className="lead text-muted">Transform how you interact with your documents</p>
						</div>
					</div>
					<div className="row">
						<div className="col-md-4 mb-4">
							<div className="text-center">
								<div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
									<i className="fas fa-upload fa-2x text-primary"></i>
								</div>
								<h5>Easy Upload</h5>
								<p className="text-muted">Simply upload your markdown documents and let our system index them automatically.</p>
							</div>
						</div>
						<div className="col-md-4 mb-4">
							<div className="text-center">
								<div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
									<i className="fas fa-comments fa-2x text-primary"></i>
								</div>
								<h5>Natural Queries</h5>
								<p className="text-muted">Ask questions in plain language and get accurate, contextual answers from your documents.</p>
							</div>
						</div>
						<div className="col-md-4 mb-4">
							<div className="text-center">
								<div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
									<i className="fas fa-chart-line fa-2x text-primary"></i>
								</div>
								<h5>Analytics</h5>
								<p className="text-muted">Track usage, monitor performance, and gain insights into your knowledge base interactions.</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-dark text-light py-5">
				<div className="container">
					<div className="row">
						<div className="col-md-3 mb-4">
							<h5 className="text-primary mb-3">Company</h5>
							<ul className="list-unstyled">
								<li><a href="#" className="text-light text-decoration-none">About Us</a></li>
								<li><a href="#" className="text-light text-decoration-none">Careers</a></li>
								<li><a href="#" className="text-light text-decoration-none">News</a></li>
								<li><a href="#" className="text-light text-decoration-none">Blog</a></li>
							</ul>
						</div>
						<div className="col-md-3 mb-4">
							<h5 className="text-primary mb-3">Solutions</h5>
							<ul className="list-unstyled">
								<li><a href="#" className="text-light text-decoration-none">Enterprise RAG</a></li>
								<li><a href="#" className="text-light text-decoration-none">Document Search</a></li>
								<li><a href="#" className="text-light text-decoration-none">Knowledge Base</a></li>
								<li><a href="#" className="text-light text-decoration-none">AI Assistant</a></li>
							</ul>
						</div>
						<div className="col-md-3 mb-4">
							<h5 className="text-primary mb-3">Legal</h5>
							<ul className="list-unstyled">
								<li><a href="#" className="text-light text-decoration-none">Terms of Service</a></li>
								<li><a href="#" className="text-light text-decoration-none">Privacy Policy</a></li>
								<li><a href="#" className="text-light text-decoration-none">Cookie Policy</a></li>
								<li><a href="#" className="text-light text-decoration-none">GDPR</a></li>
							</ul>
						</div>
						<div className="col-md-3 mb-4">
							<h5 className="text-primary mb-3">Connect</h5>
							<div className="d-flex gap-3 mb-3">
								<a href="#" className="text-light"><i className="fab fa-twitter fa-lg"></i></a>
								<a href="#" className="text-light"><i className="fab fa-linkedin fa-lg"></i></a>
								<a href="#" className="text-light"><i className="fab fa-github fa-lg"></i></a>
								<a href="#" className="text-light"><i className="fab fa-facebook fa-lg"></i></a>
							</div>
							<p className="text-muted small">
								Stay updated with our latest features and updates.
							</p>
						</div>
					</div>
					<hr className="my-4" />
					<div className="row align-items-center">
						<div className="col-md-6">
							<p className="mb-0 text-muted">&copy; 2025 RAG Admin. All rights reserved.</p>
						</div>
						<div className="col-md-6 text-md-end">
							<small className="text-muted">Built with React & Flask</small>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}

// Dashboard component for authenticated users
function Dashboard({ onLogout }) {
	const [items, setItems] = useState([])
	const [message, setMessage] = useState('')
	const [resp, setResp] = useState('')
	const [respTokens, setRespTokens] = useState(null)
	const [sending, setSending] = useState(false)

	const loadHistory = async () => {
		const r = await axios.get('/chat/history')
		setItems(r.data.items)
	}
	useEffect(() => { loadHistory() }, [])

	const send = async () => {
		if (!message.trim() || sending) return
		setSending(true)
		try {
			const r = await axios.post('/chat/message', { message })
			setResp(r.data.response)
			setRespTokens(r.data.token_usage || null)
			setMessage('')
			await loadHistory()
		} catch (e) {
			setResp('Error: ' + (e?.response?.data?.error || e.message))
		} finally {
			setSending(false)
		}
	}

	return (
		<div className="dashboard">
			{/* Dashboard Navbar */}
			<nav className="navbar navbar-expand-lg navbar-dark bg-primary">
				<div className="container-fluid">
					<a className="navbar-brand fw-bold" href="#">RAG Admin Dashboard</a>
					<div className="navbar-nav ms-auto">
						<button className="btn btn-outline-light btn-sm" onClick={onLogout}>
							<i className="fas fa-sign-out-alt me-1"></i>Logout
						</button>
					</div>
				</div>
			</nav>

			{/* Dashboard Content */}
			<div className="container-fluid py-4">
				<div className="row g-4">
					<div className="col-lg-8">
						<div className="card h-100">
							<div className="card-header">
								<h5 className="card-title mb-0">
									<i className="fas fa-comments me-2"></i>Chat with Documents
								</h5>
							</div>
							<div className="card-body">
								<div className="input-group mb-3">
									<input
										className="form-control"
										value={message}
										onChange={e => setMessage(e.target.value)}
										placeholder="Ask something about your documents..."
									/>
									<button
										className="btn btn-primary"
										onClick={send}
										disabled={sending}
									>
										{sending ? (
											<>
												<span className="spinner-border spinner-border-sm me-1"></span>
												Sending...
											</>
										) : (
											<>
												<i className="fas fa-paper-plane me-1"></i>Send
											</>
										)}
									</button>
								</div>
								{resp && (
									<div className="mt-3">
										<div className="alert alert-info">
											<strong>Answer:</strong>
											<pre className="mt-2 mb-0">{resp}</pre>
											{respTokens && (
												<div className="mt-2 text-muted small">
													<i className="fas fa-chart-bar me-1"></i>
													Tokens: prompt {respTokens.prompt_tokens}, completion {respTokens.completion_tokens}, total {respTokens.total_tokens}
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
					<div className="col-lg-4">
						<div className="card h-100">
							<div className="card-header">
								<h5 className="card-title mb-0">
									<i className="fas fa-history me-2"></i>Recent History
								</h5>
							</div>
							<div className="card-body">
								<div className="list-group list-group-flush">
									{items.map(i => {
										const ts = i.created_at ? new Date(i.created_at) : null
										const nice = ts ? ts.toLocaleString() : ''
										return (
											<div key={i.id} className="list-group-item border-0 px-0">
												<div className="d-flex w-100 justify-content-between">
													<h6 className="mb-1">{i.message.slice(0, 50)}{i.message.length > 50 ? '...' : ''}</h6>
													<small className="text-muted">{nice}</small>
												</div>
												<p className="mb-1 text-muted small">From: {i.source_file || 'n/a'}</p>
												{i.token_usage && (
													<small className="text-muted">
														Tokens: {i.token_usage.total_tokens}
													</small>
												)}
											</div>
										)
									})}
									{items.length === 0 && (
										<div className="text-center text-muted py-3">
											<i className="fas fa-inbox fa-2x mb-2"></i>
											<p>No chat history yet. Start a conversation!</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
