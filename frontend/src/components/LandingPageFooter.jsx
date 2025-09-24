function LandingPageFooter() {
  return (
    <footer className="bg-body text-muted py-4">
      <div className="container">
        <div className="row g-4">
          <div className="col-6 col-md-3">
            <h6 className="text-primary mb-3 fw-semibold">Company</h6>
            <ul className="list-unstyled">
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">About Us</a></li>
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">Careers</a></li>
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">News</a></li>
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">Blog</a></li>
            </ul>
          </div>
          <div className="col-6 col-md-3">
            <h6 className="text-primary mb-3 fw-semibold">Solutions</h6>
            <ul className="list-unstyled">
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">Enterprise RAG</a></li>
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">Document Search</a></li>
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">Knowledge Base</a></li>
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">AI Assistant</a></li>
            </ul>
          </div>
          <div className="col-6 col-md-3">
            <h6 className="text-primary mb-3 fw-semibold">Legal</h6>
            <ul className="list-unstyled">
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">Terms of Service</a></li>
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">Privacy Policy</a></li>
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">Cookie Policy</a></li>
              <li className="mb-1"><a href="#" className="text-muted text-decoration-none small">GDPR</a></li>
            </ul>
          </div>
          <div className="col-6 col-md-3">
            <h6 className="text-primary mb-3 fw-semibold">Connect</h6>
            <div className="d-flex gap-2 mb-3">
              <a href="#" className="btn theme-btn btn-secondary p-2" title="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="btn theme-btn btn-secondary p-2" title="LinkedIn">
                <i className="fab fa-linkedin"></i>
              </a>
              <a href="#" className="btn theme-btn btn-secondary p-2" title="GitHub">
                <i className="fab fa-github"></i>
              </a>
              <a href="#" className="btn theme-btn btn-secondary p-2" title="Facebook">
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
            <p className="mb-0 small">&copy; 2025 RAG Admin. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingPageFooter;
