import React from 'react'
import LoginForm from './LoginForm'

function LandingPage({ status, statusErr, onLogin, loginError, isLoading }) {
	return (
		<div className="landing-page">
			{/* Navigation - Super Small */}
			<nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-1">
				<div className="container">
					<a className="navbar-brand fw-bold text-primary" href="#" style={{ fontSize: '1.1rem' }}>
						RAG Admin
					</a>
					<button className="navbar-toggler py-1 px-2" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" style={{ fontSize: '0.8rem' }}>
						<span className="navbar-toggler-icon"></span>
					</button>
					<div className="collapse navbar-collapse" id="navbarNav">
						<ul className="navbar-nav ms-auto">
							<li className="nav-item">
								<a className="nav-link small py-1" href="#about">About</a>
							</li>
							<li className="nav-item">
								<a className="nav-link small py-1" href="#solutions">Solutions</a>
							</li>
							<li className="nav-item">
								<a className="nav-link small py-1" href="#use-cases">Use Cases</a>
							</li>
							<li className="nav-item">
								<a className="nav-link small py-1" href="#contact">Contact</a>
							</li>
						</ul>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="hero-section py-3">
				<div className="container">
					<div className="row align-items-center" style={{ minHeight: '80vh' }}>
						{/* Login Form - Left Side */}
						<div className="col-lg-6">
							<div className="text-center mb-2">
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
							<div className="hero-content ps-lg-4">
								<h1 className="display-5 fw-bold mb-3">
									Intelligent Document
									<span className="text-primary"> RAG System</span>
								</h1>
								<p className="lead mb-3" style={{ fontSize: '1.1rem' }}>
									Harness the power of Retrieval-Augmented Generation to unlock insights from your documents.
									Our platform combines advanced AI with your knowledge base for intelligent question answering.
								</p>
								<div className="row">
									<div className="col-md-6 mb-2">
										<div className="d-flex align-items-center">
											<div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2" style={{ width: '40px', height: '40px' }}>
												<i className="fas fa-search text-primary small"></i>
											</div>
											<div>
												<h6 className="mb-0 small">Smart Search</h6>
												<small className="text-muted">AI-powered document retrieval</small>
											</div>
										</div>
									</div>
									<div className="col-md-6 mb-2">
										<div className="d-flex align-items-center">
											<div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2" style={{ width: '40px', height: '40px' }}>
												<i className="fas fa-brain text-primary small"></i>
											</div>
											<div>
												<h6 className="mb-0 small">Intelligent Answers</h6>
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
			<section className="info-section py-4 bg-light">
				<div className="container">
					<div className="row text-center mb-4">
						<div className="col-12">
							<h2 className="h3 fw-bold mb-2">Why Choose RAG Admin?</h2>
							<p className="text-muted">Transform how you interact with your documents</p>
						</div>
					</div>
					<div className="row">
						<div className="col-md-4 mb-3">
							<div className="text-center">
								<div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '60px', height: '60px' }}>
									<i className="fas fa-upload fa-lg text-primary"></i>
								</div>
								<h6>Easy Upload</h6>
								<p className="text-muted small">Simply upload your markdown documents and let our system index them automatically.</p>
							</div>
						</div>
						<div className="col-md-4 mb-3">
							<div className="text-center">
								<div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '60px', height: '60px' }}>
									<i className="fas fa-comments fa-lg text-primary"></i>
								</div>
								<h6>Natural Queries</h6>
								<p className="text-muted small">Ask questions in plain language and get accurate, contextual answers from your documents.</p>
							</div>
						</div>
						<div className="col-md-4 mb-3">
							<div className="text-center">
								<div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '60px', height: '60px' }}>
									<i className="fas fa-chart-line fa-lg text-primary"></i>
								</div>
								<h6>Analytics</h6>
								<p className="text-muted small">Track usage, monitor performance, and gain insights into your knowledge base interactions.</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-dark text-light py-3">
				<div className="container">
					<div className="row">
						<div className="col-md-3 mb-2">
							<h6 className="text-primary mb-2">Company</h6>
							<ul className="list-unstyled">
								<li><a href="#" className="text-light text-decoration-none small">About Us</a></li>
								<li><a href="#" className="text-light text-decoration-none small">Careers</a></li>
								<li><a href="#" className="text-light text-decoration-none small">News</a></li>
								<li><a href="#" className="text-light text-decoration-none small">Blog</a></li>
							</ul>
						</div>
						<div className="col-md-3 mb-2">
							<h6 className="text-primary mb-2">Solutions</h6>
							<ul className="list-unstyled">
								<li><a href="#" className="text-light text-decoration-none small">Enterprise RAG</a></li>
								<li><a href="#" className="text-light text-decoration-none small">Document Search</a></li>
								<li><a href="#" className="text-light text-decoration-none small">Knowledge Base</a></li>
								<li><a href="#" className="text-light text-decoration-none small">AI Assistant</a></li>
							</ul>
						</div>
						<div className="col-md-3 mb-2">
							<h6 className="text-primary mb-2">Legal</h6>
							<ul className="list-unstyled">
								<li><a href="#" className="text-light text-decoration-none small">Terms of Service</a></li>
								<li><a href="#" className="text-light text-decoration-none small">Privacy Policy</a></li>
								<li><a href="#" className="text-light text-decoration-none small">Cookie Policy</a></li>
								<li><a href="#" className="text-light text-decoration-none small">GDPR</a></li>
							</ul>
						</div>
						<div className="col-md-3 mb-2">
							<h6 className="text-primary mb-2">Connect</h6>
							<div className="d-flex gap-2 mb-2">
								<a href="#" className="text-light"><i className="fab fa-twitter"></i></a>
								<a href="#" className="text-light"><i className="fab fa-linkedin"></i></a>
								<a href="#" className="text-light"><i className="fab fa-github"></i></a>
								<a href="#" className="text-light"><i className="fab fa-facebook"></i></a>
							</div>
							<p className="text-muted small mb-0">
								Stay updated with our latest features.
							</p>
						</div>
					</div>
					<hr className="my-2" />
					<div className="row align-items-center">
						<div className="col-md-6">
							<p className="mb-0 text-muted small">&copy; 2025 RAG Admin. All rights reserved.</p>
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