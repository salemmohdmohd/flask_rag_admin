import React, { useState } from 'react'

function LoginForm({ onLogin, loginError, isLoading }) {
	const [form, setForm] = useState({ username: '', password: '' })

	const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

	const handleSubmit = async (e) => {
		e.preventDefault()
		if (form.username.trim() && form.password) {
			await onLogin(form)
		}
	}

	return (
		<div className="card shadow-lg border-0 mx-auto" style={{ maxWidth: '400px' }}>
			<div className="card-body p-4 p-md-5">
				<div className="text-center mb-4">
					<div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
						<i className="fas fa-user-shield fa-2x text-primary"></i>
					</div>
					<h2 className="card-title h4 mb-2">Welcome Back</h2>
					<p className="text-muted small">Sign in to access your dashboard</p>
				</div>

				{loginError && (
					<div className="alert alert-danger py-3 mb-4" role="alert">
						<i className="fas fa-exclamation-triangle me-2"></i>
						{loginError}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label htmlFor="username" className="form-label fw-semibold">
							<i className="fas fa-user me-2 text-muted"></i>
							Username
						</label>
						<input
							id="username"
							name="username"
							type="text"
							value={form.username}
							onChange={onChange}
							className="form-control form-control-lg"
							placeholder="Enter your username"
							disabled={isLoading}
							required
							autoComplete="username"
							style={{ paddingLeft: '1rem', fontSize: '1rem' }}
						/>
					</div>

					<div className="mb-4">
						<label htmlFor="password" className="form-label fw-semibold">
							<i className="fas fa-lock me-2 text-muted"></i>
							Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							value={form.password}
							onChange={onChange}
							className="form-control form-control-lg"
							placeholder="Enter your password"
							disabled={isLoading}
							required
							autoComplete="current-password"
							style={{ paddingLeft: '1rem', fontSize: '1rem' }}
						/>
					</div>

					<div className="d-grid">
						<button
							className="btn btn-primary btn-lg py-3"
							type="submit"
							disabled={isLoading || !form.username.trim() || !form.password}
							style={{ fontSize: '1.1rem' }}
						>
							{isLoading ? (
								<>
									<span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
									Signing you in...
								</>
							) : (
								<>
									<i className="fas fa-sign-in-alt me-2"></i>
									Access Dashboard
								</>
							)}
						</button>
					</div>
				</form>

				<div className="text-center mt-4">
					<small className="text-muted">
						<i className="fas fa-shield-alt me-1"></i>
						Your connection is secure and encrypted
					</small>
				</div>
			</div>
		</div>
	)
}

export default LoginForm