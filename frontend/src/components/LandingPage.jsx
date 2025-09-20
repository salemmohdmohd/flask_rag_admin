import React from 'react'
import LoginForm from './LoginForm'

function LandingPage({ status, statusErr, onLogin, loginError, isLoading }) {
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
							<div className="text-center mb-3">
								<small className="text-muted">Status: {status}{statusErr ? ` (${statusErr})` : ''}</small>
							</div>
							<LoginForm
								onLogin={onLogin}
								loginError={loginError}
								isLoading={isLoading}
							/>
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

export default LandingPage