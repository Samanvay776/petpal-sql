import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Browse from './pages/Browse';
import PetDetails from './pages/PetDetails';
import CreateListing from './pages/CreateListing';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import { API_BASE } from './config';


export default function App() {
  // Authentication states (retrieve from localStorage for persistence)
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Routing states
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedListingId, setSelectedListingId] = useState(null);
  
  // Chat partner pass-through
  const [chatPartnerData, setChatPartnerData] = useState(null);

  // Browse Page filter states
  const [browseFilters, setBrowseFilters] = useState({
    species: '',
    breed: '',
    type: '',
    gender: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  });

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Set Auth data helper
  const setAuthData = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  // Logout helper
  const logout = () => {
    setAuthData('', null);
    setCurrentPage('home');
    setNotifications([]);
    setUnreadCount(0);
  };

  // Fetch unread notifications count
  const fetchUnreadNotificationsCount = () => {
    if (!token) return;
    fetch(`${API_BASE}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      })
      .catch(err => console.error('Error fetching notifications:', err));
  };

  // Setup periodic polling for notifications when user is logged in
  useEffect(() => {
    fetchUnreadNotificationsCount();
    if (token) {
      const interval = setInterval(fetchUnreadNotificationsCount, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Mark single notification as read
  const handleMarkNotificationRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUnreadNotificationsCount();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render current page based on routing state
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home 
            setCurrentPage={setCurrentPage} 
            setSelectedListingId={setSelectedListingId}
            setBrowseFilters={setBrowseFilters}
          />
        );
      case 'browse':
        return (
          <Browse 
            setCurrentPage={setCurrentPage} 
            setSelectedListingId={setSelectedListingId}
            filters={browseFilters}
            setFilters={setBrowseFilters}
          />
        );
      case 'details':
        return (
          <PetDetails 
            listingId={selectedListingId} 
            user={user}
            token={token}
            setCurrentPage={setCurrentPage}
            setChatPartnerId={setChatPartnerData}
          />
        );
      case 'create':
        return (
          <CreateListing 
            token={token} 
            setCurrentPage={setCurrentPage}
            setSelectedListingId={setSelectedListingId}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            token={token} 
            user={user}
            setCurrentPage={setCurrentPage}
            setSelectedListingId={setSelectedListingId}
            fetchUnreadNotificationsCount={fetchUnreadNotificationsCount}
          />
        );
      case 'chat':
        return (
          <Chat 
            token={token} 
            user={user}
            partnerData={chatPartnerData}
            setPartnerData={setChatPartnerData}
          />
        );
      case 'auth':
        return (
          <Auth 
            setAuthData={setAuthData} 
            setCurrentPage={setCurrentPage}
          />
        );
      default:
        return <Home setCurrentPage={setCurrentPage} setSelectedListingId={setSelectedListingId} setBrowseFilters={setBrowseFilters} />;
    }
  };

  return (
    <div className="app-container">
      {/* Global Header Navigation */}
      <Navbar 
        user={user} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        logout={logout}
        unreadCount={unreadCount}
        showNotificationsModal={() => setShowNotificationsModal(true)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', 
        padding: '2rem 0', 
        borderTop: '1px solid var(--border-glass)', 
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div className="container">
          © {new Date().getFullYear()} PetPal Database Platform. All rights reserved.
        </div>
      </footer>

      {/* NOTIFICATIONS OVERLAY MODAL */}
      {showNotificationsModal && (
        <div className="modal-overlay" onClick={() => setShowNotificationsModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Your Notifications</h2>
              <button className="modal-close" onClick={() => setShowNotificationsModal(false)}>×</button>
            </div>
            
            {notifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {notifications.map(n => (
                  <div 
                    key={n.notification_id}
                    onClick={() => {
                      if (!n.is_read) handleMarkNotificationRead(n.notification_id);
                    }}
                    style={{
                      background: n.is_read ? '#FFFFFF' : 'var(--color-primary-light)',
                      border: '1px solid var(--border-color)',
                      padding: '0.8rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: !n.is_read ? 'pointer' : 'default',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: n.is_read ? 'normal' : 'bold',
                        color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)'
                      }}>{n.title}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!n.is_read && (
                      <span style={{ width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '50%' }}></span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>No notifications to display.</p>
            )}

            <button 
              className="btn btn-secondary btn-sm" 
              style={{ width: '100%', marginTop: '1.25rem' }} 
              onClick={() => {
                setShowNotificationsModal(false);
                setCurrentPage('dashboard');
              }}
            >
              Go to Notifications Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
