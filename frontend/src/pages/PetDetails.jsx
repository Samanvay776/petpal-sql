import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

export default function PetDetails({ 
  listingId, 
  user, 
  token, 
  setCurrentPage, 
  setChatPartnerId 
}) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Modal triggers
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [showFosterModal, setShowFosterModal] = useState(false);

  // Form states for modals
  const [adoptMessage, setAdoptMessage] = useState('I would love to adopt this wonderful pet and provide a loving home!');
  const [fosterDates, setFosterDates] = useState({ start: '', end: '' });
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const defaultImage = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600';

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    fetch(`${API_BASE}/api/pets/${listingId}`)
      .then(res => res.json())
      .then(data => {
        setListing(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching listing details:', err);
        setLoading(false);
      });
  }, [listingId]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '5rem' }}>
        Loading pet details...
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '5rem' }}>
        Listing not found.
      </div>
    );
  }

  const {
    pet_name,
    species,
    breed,
    age,
    gender,
    health_info,
    price,
    listing_type,
    owner_name,
    owner_email,
    owner_phone,
    owner_id,
    owner_rating,
    owner_review_count,
    images
  } = listing;

  const typeLabels = {
    sell: 'For Sale',
    adopt: 'Adoption',
    foster: 'Fostering'
  };

  const isOwner = user && user.user_id === owner_id;

  const handleStartChat = () => {
    if (!user) {
      setCurrentPage('auth');
      return;
    }
    setChatPartnerId({ partner_id: owner_id, partner_name: owner_name, partner_email: owner_email });
    setCurrentPage('chat');
  };

  // Submit Adoption application
  const handleAdoptSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      const res = await fetch(`${API_BASE}/api/applications/adoption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listing_id: listingId,
          message: adoptMessage
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess('Your adoption application was submitted successfully!');
        setTimeout(() => {
          setShowAdoptModal(false);
          setActionSuccess('');
        }, 2000);
      } else {
        alert(data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Foster application
  const handleFosterSubmit = async (e) => {
    e.preventDefault();
    if (!fosterDates.start || !fosterDates.end) {
      alert('Please fill out start and end dates');
      return;
    }
    setSubmittingAction(true);
    try {
      const res = await fetch(`${API_BASE}/api/applications/foster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listing_id: listingId,
          start_date: fosterDates.start,
          end_date: fosterDates.end
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess('Your foster request was submitted successfully!');
        setTimeout(() => {
          setShowFosterModal(false);
          setActionSuccess('');
        }, 2000);
      } else {
        alert(data.error || 'Failed to submit request');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Process Simulated Payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: price,
          listing_id: listingId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess('Simulated Payment Completed Successfully!');
        setTimeout(() => {
          setShowCheckout(false);
          setActionSuccess('');
          setCurrentPage('dashboard');
        }, 2000);
      } else {
        alert(data.error || 'Failed to complete payment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Delete Listing
  const handleDeleteListing = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/pets/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('Listing deleted successfully');
        setCurrentPage('browse');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete listing');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      <button 
        className="btn btn-secondary" 
        onClick={() => setCurrentPage('browse')}
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
      >
        ← Back to Browse
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 1.2fr) 1fr',
        gap: '3rem',
        alignItems: 'start'
      }}>
        {/* Left Side: Images View */}
        <div>
          <div className="glass-panel" style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            height: '420px',
            marginBottom: '1rem',
            position: 'relative'
          }}>
            <img 
              src={images && images.length > 0 ? images[activeImageIndex] : defaultImage} 
              alt={pet_name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.src = defaultImage; }}
            />
            <span className={`badge badge-${listing_type}`} style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              padding: '0.5rem 1rem',
              fontSize: '0.85rem'
            }}>
              {typeLabels[listing_type]}
            </span>
          </div>

          {/* Thumbnails */}
          {images && images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {images.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: activeImageIndex === idx ? '2.5px solid var(--color-primary)' : '1px solid var(--border-color)',
                    opacity: activeImageIndex === idx ? 1 : 0.7,
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Information Panel */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{pet_name}</h1>
            {listing_type === 'sell' && (
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                ${price.toLocaleString()}
              </span>
            )}
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
            {breed} ({species})
          </p>

          {/* Quick Specifications */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Age</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{age} {age === 1 ? 'Year' : 'Years'}</span>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Gender</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{gender}</span>
            </div>
          </div>

          {/* Health info */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              Health & Description
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {health_info || 'No health information has been provided yet.'}
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: '1.5rem' }} />

          {/* Owner details */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Listed By</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>{owner_name}</span>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600, marginTop: '0.1rem' }}>
                ★ {parseFloat(owner_rating).toFixed(1)} ({owner_review_count} {owner_review_count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            
            {user && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                <div>📞 {owner_phone || 'No phone'}</div>
                <div>✉️ {owner_email}</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            {isOwner ? (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span className="badge badge-success" style={{ flexGrow: 1, padding: '0.75rem', textAlign: 'center', fontSize: '0.95rem' }}>
                  This is your listing
                </span>
                <button className="btn btn-danger" onClick={handleDeleteListing}>
                  Delete Listing
                </button>
              </div>
            ) : (
              <>
                {listing_type === 'sell' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.8rem 1.5rem', fontSize: '1.05rem' }}
                    onClick={() => user ? setShowCheckout(true) : setCurrentPage('auth')}
                  >
                    🛒 Purchase Pet (${price})
                  </button>
                )}

                {listing_type === 'adopt' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.8rem 1.5rem', fontSize: '1.05rem' }}
                    onClick={() => user ? setShowAdoptModal(true) : setCurrentPage('auth')}
                  >
                    ❤️ Apply for Adoption
                  </button>
                )}

                {listing_type === 'foster' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.8rem 1.5rem', fontSize: '1.05rem' }}
                    onClick={() => user ? setShowFosterModal(true) : setCurrentPage('auth')}
                  >
                    🏠 Request to Foster
                  </button>
                )}

                <button className="btn btn-secondary" onClick={handleStartChat}>
                  💬 Message Owner ({owner_name})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: SELL CHECKOUT */}
      {showCheckout && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 className="modal-title">Simulate Payment Checkout</h2>
              <button className="modal-close" onClick={() => setShowCheckout(false)}>×</button>
            </div>
            {actionSuccess ? (
              <div className="badge badge-success" style={{ width: '100%', padding: '1rem', textAlign: 'center', fontSize: '1rem' }}>
                {actionSuccess}
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit}>
                <div style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Listing:</span> <strong>{pet_name} ({breed})</strong>
                  </p>
                  <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem' }}>
                    <span>Total Amount:</span> <strong style={{ color: 'var(--color-primary)' }}>${price.toLocaleString()}</strong>
                  </p>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Dummy Card Number</label>
                  <input type="text" className="form-input" defaultValue="4111 2222 3333 4444" placeholder="Card number" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input type="text" className="form-input" defaultValue="12/28" placeholder="MM/YY" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input type="text" className="form-input" defaultValue="123" placeholder="***" required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submittingAction}>
                  {submittingAction ? 'Processing...' : `Pay $${price}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: ADOPTION APPLICATION */}
      {showAdoptModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 className="modal-title">Adopt {pet_name}</h2>
              <button className="modal-close" onClick={() => setShowAdoptModal(false)}>×</button>
            </div>
            {actionSuccess ? (
              <div className="badge badge-success" style={{ width: '100%', padding: '1rem', textAlign: 'center', fontSize: '1rem' }}>
                {actionSuccess}
              </div>
            ) : (
              <form onSubmit={handleAdoptSubmit}>
                <div className="form-group">
                  <label className="form-label">Application Message</label>
                  <textarea 
                    className="form-textarea" 
                    rows="4"
                    value={adoptMessage}
                    onChange={(e) => setAdoptMessage(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submittingAction}>
                  {submittingAction ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: FOSTER REQUEST */}
      {showFosterModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 className="modal-title">Foster {pet_name}</h2>
              <button className="modal-close" onClick={() => setShowFosterModal(false)}>×</button>
            </div>
            {actionSuccess ? (
              <div className="badge badge-success" style={{ width: '100%', padding: '1rem', textAlign: 'center', fontSize: '1rem' }}>
                {actionSuccess}
              </div>
            ) : (
              <form onSubmit={handleFosterSubmit}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={fosterDates.start}
                    onChange={(e) => setFosterDates(prev => ({ ...prev, start: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={fosterDates.end}
                    onChange={(e) => setFosterDates(prev => ({ ...prev, end: e.target.value }))}
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submittingAction}>
                  {submittingAction ? 'Submitting...' : 'Submit Foster Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
