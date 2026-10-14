import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#DEF2F1' }}>
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-md-none"
          style={{ backgroundColor: 'rgba(23, 37, 42, 0.6)', zIndex: 1040 }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          mobileSidebarOpen
            ? 'position-fixed top-0 start-0 h-100 z-index-1050'
            : 'd-none d-md-block'
        }`}
        style={{ zIndex: 1050 }}
      >
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <Header onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
