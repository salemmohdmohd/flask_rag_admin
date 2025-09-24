
import AppHeader from '../components/AppHeader'
import LandingPageFooter from '../components/LandingPageFooter'
import LoginForm from '../components/LoginForm'

function LandingPage({ status, statusErr, onLogin, loginError, isLoading }) {
	   return (
		   <div className="landing-page">
			   <AppHeader title="RAG Admin" subtitle="Intelligent Document RAG System" />

			   {/* Hero Section */}
			   <section className="hero-section py-4 py-md-5">
				   <div className="container">
					   <div className="row align-items-center min-vh-75">
						   {/* Login Form - Prioritized on mobile */}
						   <div className="col-lg-6 order-1 order-lg-1">
							   <div className="theme-login-card p-4 mb-4 mb-lg-0">
								   <LoginForm
									   onLogin={onLogin}
									   loginError={loginError}
									   isLoading={isLoading}
								   />
							   </div>
						   </div>

						   {/* Hero Content - Secondary on mobile */}
						   <div className="col-lg-6 order-2 order-lg-2">
							   <div className="hero-content ps-lg-4 text-center text-lg-start mt-4 mt-lg-0">
								   <h1 className="display-6 display-md-5 fw-bold mb-4 text-white text-balance">
									   Intelligent Document
									   <span className="text-warning"> RAG System</span>
								   </h1>
								   <p className="lead mb-4 text-white-75">
									   Harness the power of Retrieval-Augmented Generation to unlock insights from your documents.
									   Our platform combines advanced AI with your knowledge base for intelligent question answering.
								   </p>
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
							   <div className="card card-elevated text-center h-100 p-4">
								   <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
									   <i className="fas fa-upload fa-2x text-primary"></i>
								   </div>
								   <h5 className="fw-semibold mb-3">Easy Upload</h5>
								   <p className="text-muted">Simply upload your markdown documents and let our system index them automatically.</p>
							   </div>
						   </div>
						   <div className="col-md-4">
							   <div className="card card-elevated text-center h-100 p-4">
								   <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
									   <i className="fas fa-comments fa-2x text-primary"></i>
								   </div>
								   <h5 className="fw-semibold mb-3">Natural Queries</h5>
								   <p className="text-muted">Ask questions in plain language and get accurate, contextual answers from your documents.</p>
							   </div>
						   </div>
						   <div className="col-md-4">
							   <div className="card card-elevated text-center h-100 p-4">
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

			   <LandingPageFooter />
		   </div>
	   )
}

export default LandingPage
