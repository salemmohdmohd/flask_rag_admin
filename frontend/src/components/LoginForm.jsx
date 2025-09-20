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
		<div className="card shadow-lg border-0">
			<div className="card-body p-4">
				<h2 className="card-title h4 mb-3 text-center">Login to Dashboard</h2>
				{loginError && <div className="alert alert-danger py-2">{loginError}</div>}
				<form onSubmit={handleSubmit}>
					<div className="mb-3">
						<label className="form-label">Username</label>
						<input
							name="username"
							value={form.username}
							onChange={onChange}
							className="form-control"
							placeholder="Enter your username"
							disabled={isLoading}
							required
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
							disabled={isLoading}
							required
						/>
					</div>
					<button
						className="btn btn-primary w-100 py-2"
						type="submit"
						disabled={isLoading || !form.username.trim() || !form.password}
					>
						{isLoading ? (
							<>
								<span className="spinner-border spinner-border-sm me-2"></span>
								Logging in...
							</>
						) : (
							'Access Dashboard'
						)}
					</button>
				</form>
			</div>
		</div>
	)
}

export default LoginForm