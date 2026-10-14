import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of ManaVoice AI?')) {
      await logout();
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: 'bi-grid-1x2' },
    { name: 'Speech Studio', path: '/studio', icon: 'bi-mic' },
    { name: 'Generation History', path: '/history', icon: 'bi-clock-history' },
    { name: 'Saved Audio', path: '/saved-audio', icon: 'bi-volume-up' },
    { name: 'Usage Analytics', path: '/analytics', icon: 'bi-bar-chart' },
    { name: 'Languages & Voices', path: '/languages', icon: 'bi-globe' },
    { name: 'Account Settings', path: '/settings', icon: 'bi-gear' },
  ];

  return (
    <aside
      className={`app-sidebar ${isOpen ? 'd-flex' : 'd-none d-md-flex'}`}
      style={{
        width: '260px',
        minHeight: '100vh',
        backgroundColor: '#17252A',
        color: '#FFFFFF',
      }}
    >
      {/* Brand Header */}
      <div className="p-3 border-bottom" style={{ borderColor: 'rgba(43, 122, 120, 0.3)' }}>
        <div className="d-flex align-items-center justify-content-between">
          <NavLink to="/dashboard" className="d-flex align-items-center gap-2 text-decoration-none">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#3AAFA9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <i className="bi bi-soundwave fs-4" />
            </div>
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
                ManaVoice<span style={{ color: '#3AAFA9' }}>.AI</span>
              </div>
              <div style={{ color: '#DEF2F1', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Speech Platform
              </div>
            </div>
          </NavLink>
          {onClose && (
            <button
              className="btn btn-sm text-mv-white d-md-none border-0"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <i className="bi bi-x-lg" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="py-3 flex-grow-1 overflow-auto">
        <div className="px-3 pb-2 text-uppercase" style={{ color: '#3AAFA9', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em' }}>
          Workspace
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className={`bi ${item.icon} fs-5`} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-top" style={{ borderColor: 'rgba(43, 122, 120, 0.3)' }}>
        <button
          onClick={handleLogout}
          className="btn w-100 d-flex align-items-center justify-content-center gap-2"
          style={{
            backgroundColor: 'transparent',
            border: '1.5px solid #2B7A78',
            color: '#DEF2F1',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2B7A78';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#DEF2F1';
          }}
        >
          <i className="bi bi-box-arrow-right fs-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
