import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = (path: string) => {
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/studio')) return 'Speech Studio';
    if (path.startsWith('/history')) return 'Generation History';
    if (path.startsWith('/saved-audio')) return 'Saved Audio Library';
    if (path.startsWith('/analytics')) return 'Usage Analytics';
    if (path.startsWith('/languages')) return 'Languages & Models';
    if (path.startsWith('/settings')) return 'Account Settings';
    return 'ManaVoice AI';
  };

  return (
    <header className="app-header">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm d-md-none border-0 text-mv-midnight p-0"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
        >
          <i className="bi bi-list fs-3" />
        </button>
        <div>
          <h1 className="h5 mb-0 fw-bold text-mv-midnight" style={{ letterSpacing: '-0.01em' }}>
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Quick Studio action button if not already in studio */}
        {location.pathname !== '/studio' && (
          <Link to="/studio" className="btn btn-mana d-none d-sm-flex align-items-center gap-2 py-1 px-3">
            <i className="bi bi-lightning-charge" />
            <span>Generate Speech</span>
          </Link>
        )}

        {/* User Account Display */}
        <Link
          to="/settings"
          className="d-flex align-items-center gap-2 text-decoration-none py-1 px-2 rounded"
          style={{ backgroundColor: '#DEF2F1' }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#2B7A78',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="bi bi-person fs-5" />
          </div>
          <div className="d-none d-md-block text-start">
            <div className="fw-semibold text-mv-midnight" style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>
              {user?.display_name || 'User'}
            </div>
            <div className="text-mv-deep-teal" style={{ fontSize: '0.72rem', lineHeight: '1' }}>
              {user?.email}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
};
