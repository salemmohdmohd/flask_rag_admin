
import { Link } from 'react-router-dom';

/**
 * AppHeader - Smart, theme-compliant, accessible header for all main pages.
 * Props:
 *   - title: string (required)
 *   - subtitle: string (optional)
 *   - showBack: bool (optional)
 *   - backTo: string (optional)
 *   - onBack: function (optional)
 *   - onLogout: function (optional)
 *   - actions: React node (optional)
 *   - className: string (optional)
 *
 * Note: PropTypes removed for build compatibility. Use TypeScript or JSDoc for type safety in production.
 */

function AppHeader({
  title = 'RAG Admin',
  subtitle = '',
  showBack = false,
  backTo = '/dashboard',
  onBack,
  onLogout,
  actions,
  className = '',
}) {
  // Modern, compact, theme-compliant header
  return (
    <nav
      className={`navbar navbar-expand-lg bg-gradient-primary border-bottom shadow-sm py-1 flex-shrink-0 theme-header ${className}`}
      aria-label="Main navigation"
      style={{ minHeight: 56, background: 'linear-gradient(90deg, #2b5876 0%, #4e4376 100%)' }}
    >
      <div className="container-fluid px-2 d-flex align-items-center justify-content-between" style={{ minHeight: 56 }}>
        <div className="d-flex align-items-center gap-2">
          {showBack && (
            onBack ? (
              <button
                className="btn btn-icon btn-outline-light btn-sm me-2"
                aria-label="Back"
                onClick={onBack}
                tabIndex={0}
                style={{ borderRadius: 8, padding: '6px 10px', fontSize: 18 }}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
            ) : (
              <Link
                to={backTo}
                className="btn btn-icon btn-outline-light btn-sm me-2"
                aria-label="Back"
                tabIndex={0}
                style={{ borderRadius: 8, padding: '6px 10px', fontSize: 18 }}
              >
                <i className="fas fa-arrow-left"></i>
              </Link>
            )
          )}
          <span className="navbar-brand fw-bold d-flex align-items-center text-white" style={{ fontSize: 20, letterSpacing: 0.5 }}>
            {title}
          </span>
          {subtitle && (
            <span className="ms-2 text-white-50 small d-none d-md-inline" style={{ fontWeight: 400, fontSize: 14, opacity: 0.85 }}>
              {subtitle}
            </span>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          {actions}
          {onLogout && (
            <button
              className="btn btn-icon btn-outline-light btn-sm"
              onClick={onLogout}
              aria-label="Logout"
              tabIndex={0}
              style={{ borderRadius: 8, padding: '6px 10px', fontSize: 18 }}
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}



export default AppHeader;
