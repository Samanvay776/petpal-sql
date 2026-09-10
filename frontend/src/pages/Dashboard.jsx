import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

export default function Dashboard({ token, user, setCurrentPage, setSelectedListingId, fetchUnreadNotificationsCount }) {
  const [activeTab, setActiveTab] = useState('received'); // 'received', 'sent', 'payments', 'notifications'

  // Data states
  const [receivedApps, setReceivedApps] = useState({ adoptions: [], fosters: [] });
  const [sentApps, setSentApps] = useState({ adoptions: [], fosters: [] });
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch received applications
      const receivedRes = await fetch(`${API_BASE}/api/applications/received`, { headers });
      const receivedData = await receivedRes.json();
      if (receivedRes.ok) setReceivedApps(receivedData);

      // Fetch sent applications
      const sentRes = await fetch(`${API_BASE}/api/applications/sent`, { headers });
      const sentData = await sentRes.json();
      if (sentRes.ok) setSentApps(sentData);

      // Fetch payments
      const paymentsRes = await fetch(`${API_BASE}/api/payments`, { headers });
      const paymentsData = await paymentsRes.json();
      if (paymentsRes.ok) setPayments(paymentsData);

      // Fetch notifications
      const notificationsRes = await fetch(`${API_BASE}/api/notifications`, { headers });
      const notificationsData = await notificationsRes.json();
      if (notificationsRes.ok) setNotifications(notificationsData);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Handle application approval/rejection
  const handleAppStatusUpdate = async (type, id, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this application?`)) return;
    try {
      const url = `${API_BASE}/api/applications/${type}/${id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Application status updated to ${newStatus}`);
        fetchDashboardData();
        fetchUnreadNotificationsCount(); // sync global badge
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
        fetchUnreadNotificationsCount(); // sync global badge
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark single notification as read
  const handleMarkRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
        fetchUnreadNotificationsCount();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      {/* Header Profile Summary */}
      <section className="glass-panel" style={{
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            User Account Profile
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{user.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Email: {user.email} | Role: {user.role}</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage('create')}>
          ➕ Create New Listing
        </button>
      </section>

      {/* Tabs */}
      <div className="tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          📥 Applications Received ({receivedApps.adoptions.length + receivedApps.fosters.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          📤 Applications Sent ({sentApps.adoptions.length + sentApps.fosters.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💳 Payments ({payments.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications ({notifications.filter(n => !n.is_read).length} Unread)
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
          Loading dashboard data...
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
          {/* TAB 1: APPLICATIONS RECEIVED */}
          {activeTab === 'received' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Applications for your Pets</h2>
              
              {receivedApps.adoptions.length === 0 && receivedApps.fosters.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No applications received yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Adoptions */}
                  {receivedApps.adoptions.map(app => (
                    <div key={app.application_id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Adoption Application for {app.pet_name}</strong>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            From: {app.applicant_name} ({app.applicant_email})
                          </div>
                        </div>
                        <span className={`badge badge-${app.status}`}>{app.status}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', background: '#FFFFFF', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        "{app.message}"
                      </p>
                      {app.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleAppStatusUpdate('adoption', app.application_id, 'approved')}>
                            Approve
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleAppStatusUpdate('adoption', app.application_id, 'rejected')} style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Fosters */}
                  {receivedApps.fosters.map(app => (
                    <div key={app.request_id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Foster Request for {app.pet_name}</strong>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            From: {app.foster_parent_name} ({app.foster_parent_email})
                          </div>
                        </div>
                        <span className={`badge badge-${app.status}`}>{app.status}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Requested Period: <strong>{app.start_date}</strong> to <strong>{app.end_date}</strong>
                      </p>
                      {app.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleAppStatusUpdate('foster', app.request_id, 'approved')}>
                            Approve
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleAppStatusUpdate('foster', app.request_id, 'rejected')} style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPLICATIONS SENT */}
          {activeTab === 'sent' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Your Sent Requests</h2>

              {sentApps.adoptions.length === 0 && sentApps.fosters.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>You haven't submitted any applications yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Adoptions */}
                  {sentApps.adoptions.map(app => (
                    <div key={app.application_id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Adoption: {app.pet_name}</strong>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          Owner: {app.owner_name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className={`badge badge-${app.status}`}>{app.status}</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedListingId(app.listing_id); setCurrentPage('details'); }}>
                          View Pet
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Fosters */}
                  {sentApps.fosters.map(app => (
                    <div key={app.request_id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Foster: {app.pet_name}</strong>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          Dates: {app.start_date} to {app.end_date} | Owner: {app.owner_name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className={`badge badge-${app.status}`}>{app.status}</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedListingId(app.listing_id); setCurrentPage('details'); }}>
                          View Pet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYMENTS HISTORY */}
          {activeTab === 'payments' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Transaction History</h2>
              
              {payments.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No payment transactions logged.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Payment ID</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.payment_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>#{p.payment_id}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: 'var(--color-success)' }}>${p.amount.toLocaleString()}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className="badge badge-success" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}>
                              {p.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Notices</h2>
                {notifications.some(n => !n.is_read) && (
                  <button className="btn btn-secondary btn-sm" onClick={handleMarkAllNotificationsRead}>
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>You have no notifications.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notifications.map(n => (
                    <div 
                      key={n.notification_id} 
                      onClick={() => !n.is_read && handleMarkRead(n.notification_id)}
                      style={{
                        background: n.is_read ? '#FFFFFF' : 'var(--color-primary-light)',
                        border: '1px solid var(--border-color)',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: !n.is_read ? 'pointer' : 'default',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div>
                        <span style={{ 
                          fontWeight: n.is_read ? '500' : '700', 
                          color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' 
                        }}>
                          {n.title}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                      {!n.is_read && (
                        <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
