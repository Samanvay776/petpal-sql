import React from 'react';

export default function Navbar({ 
  user, 
  currentPage, 
  setCurrentPage, 
  logout, 
  unreadCount, 
  showNotificationsModal 
}) {
  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <a 
          href="#" 
          className="logo" 
          onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}
        >
          🐾 PetPal
        </a>
        
        <ul className="nav-links">
          <li>
            <a 
              href="#" 
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}
            >
              Home
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={`nav-link ${currentPage === 'browse' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setCurrentPage('browse'); }}
            >
              Browse Pets
            </a>
          </li>
          {user && (
            <li>
              <a 
                href="#" 
                className={`nav-link ${currentPage === 'create' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage('create'); }}
              >
                List a Pet
              </a>
            </li>
          )}
        </ul>

        <div className="nav-actions">
          {user ? (
            <>
              <button 
                className="notification-bell" 
                onClick={showNotificationsModal}
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              
              <a 
                href="#" 
                className={`nav-link ${currentPage === 'chat' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage('chat'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                💬 Chat
              </a>

              <a 
                href="#" 
                className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}
                style={{ fontWeight: 600, color: 'var(--color-primary)' }}
              >
                👤 {user.name}
              </a>

              <button className="btn btn-secondary btn-sm" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={() => setCurrentPage('auth')}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
