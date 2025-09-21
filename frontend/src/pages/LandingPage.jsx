import React from 'react'
import LoginForm from '../components/LoginForm'

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
			<section className="hero-section py-4 py-md-5">
				<div className="container">
					<div className="row align-items-center min-vh-75">
						{/* Login Form - Prioritized on mobile */}
						<div className="col-lg-6 order-1 order-lg-1">

							<LoginForm
								onLogin={onLogin}
								loginError={loginError}
								isLoading={isLoading}
							/>
						</div>

						{/* Hero Content - Secondary on mobile */}
						<div className="col-lg-6 order-2 order-lg-2">
							<div className="hero-content ps-lg-4 text-center text-lg-start mt-4 mt-lg-0">
								<h1 className="display-6 display-md-5 fw-bold mb-4 text-white">
									Intelligent Document
									<span className="text-warning"> RAG System</span>
								</h1>
								<p className="lead mb-4 text-white-75" style={{ fontSize: '1.1rem' }}>
									Harness the power of Retrieval-Augmented Generation to unlock insights from your documents.
									Our platform combines advanced AI with your knowledge base for intelligent question answering.
								</p>

								{/* Feature Highlights - Responsive Grid */}


							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Info Section - Mobile-optimized */}
			<section className="info-section py-5 bg-light">
				<div className="container">
					<div className="row text-center mb-5">
						<div className="col-12">
							<h2 className="h3 fw-bold mb-3">Why Choose RAG Admin?</h2>
							<p className="text-muted lead">Transform how you interact with your documents</p>
						</div>
					</div>
					<div className="row g-4">
						<div className="col-md-4">
							<div className="text-center h-100">
								<div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
									<i className="fas fa-upload fa-2x text-primary"></i>
								</div>
								<h5 className="fw-semibold mb-3">Easy Upload</h5>
								<p className="text-muted">Simply upload your markdown documents and let our system index them automatically.</p>
							</div>
						</div>
						<div className="col-md-4">
							<div className="text-center h-100">
								<div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
									<i className="fas fa-comments fa-2x text-primary"></i>
								</div>
								<h5 className="fw-semibold mb-3">Natural Queries</h5>
								<p className="text-muted">Ask questions in plain language and get accurate, contextual answers from your documents.</p>
							</div>
						</div>
						<div className="col-md-4">
							<div className="text-center h-100">
								<div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
									<i className="fas fa-chart-line fa-2x text-primary"></i>
								</div>
								<h5 className="fw-semibold mb-3">Analytics</h5>
								<p className="text-muted">Track usage, monitor performance, and gain insights into your knowledge base interactions.</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer - Mobile-responsive */}
			<footer className="bg-dark text-light py-4">
				<div className="container">
					<div className="row g-4">
						<div className="col-6 col-md-3">
							<h6 className="text-primary mb-3 fw-semibold">Company</h6>
							<ul className="list-unstyled">
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">About Us</a></li>
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">Careers</a></li>
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">News</a></li>
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">Blog</a></li>
							</ul>
						</div>
						<div className="col-6 col-md-3">
							<h6 className="text-primary mb-3 fw-semibold">Solutions</h6>
							<ul className="list-unstyled">
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">Enterprise RAG</a></li>
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">Document Search</a></li>
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">Knowledge Base</a></li>
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">AI Assistant</a></li>
							</ul>
						</div>
						<div className="col-6 col-md-3">
							<h6 className="text-primary mb-3 fw-semibold">Legal</h6>
							<ul className="list-unstyled">
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">Terms of Service</a></li>
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">Privacy Policy</a></li>
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">Cookie Policy</a></li>
								<li className="mb-1"><a href="#" className="text-light text-decoration-none small">GDPR</a></li>
							</ul>
						</div>
						<div className="col-6 col-md-3">
							<h6 className="text-primary mb-3 fw-semibold">Connect</h6>
							<div className="d-flex gap-2 mb-3">
								<a href="#" className="text-light p-2 rounded bg-secondary bg-opacity-25" title="Twitter">
									<i className="fab fa-twitter"></i>
								</a>
								<a href="#" className="text-light p-2 rounded bg-secondary bg-opacity-25" title="LinkedIn">
									<i className="fab fa-linkedin"></i>
								</a>
								<a href="#" className="text-light p-2 rounded bg-secondary bg-opacity-25" title="GitHub">
									<i className="fab fa-github"></i>
								</a>
								<a href="#" className="text-light p-2 rounded bg-secondary bg-opacity-25" title="Facebook">
									<i className="fab fa-facebook"></i>
								</a>
							</div>
							<p className="text-muted small mb-0">
								Stay updated with our latest features and improvements.
							</p>
						</div>
					</div>
					<hr className="my-4" />
					<div className="row align-items-center text-center text-md-start">
						<div className="col-md-6 mb-2 mb-md-0">
							<p className="mb-0  small">&copy; 2025 RAG Admin. All rights reserved.</p>
						</div>

					</div>
				</div>
			</footer>
		</div>
	)
}

export default LandingPage