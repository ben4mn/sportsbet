import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useParlay } from '../../context/ParlayContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { legCount } = useParlay();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <div className="header-logo-icon">SB</div>
          <span className="md:block hidden">SportsBet</span>
        </Link>

        <nav className="header-nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/builder">
            Builder
            {legCount > 0 && (
              <span style={{
                marginLeft: '6px',
                background: 'var(--primary)',
                color: 'white',
                fontSize: '0.75rem',
                padding: '2px 6px',
                borderRadius: '9999px'
              }}>
                {legCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/suggestions">AI Picks</NavLink>
          <NavLink to="/research">Research</NavLink>
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <Link to="/settings" className="text-sm hidden md:block" style={{ color: 'var(--text-secondary)' }}>
                {user.email}
              </Link>
              <button onClick={logout} className="btn btn-ghost btn-sm">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
