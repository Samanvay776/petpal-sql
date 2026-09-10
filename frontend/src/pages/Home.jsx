import React, { useEffect, useState } from 'react';
import PetCard from '../components/PetCard';
import { API_BASE } from '../config';

export default function Home({ setCurrentPage, setSelectedListingId, setBrowseFilters }) {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/pets`)
      .then(res => res.json())
      .then(data => {
        setFeaturedPets(data.slice(0, 3));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching featured pets:', err);
        setLoading(false);
      });
  }, []);

  const handleCategoryClick = (species) => {
    setBrowseFilters({ species, type: '', search: '', breed: '', gender: '' });
    setCurrentPage('browse');
  };

  const handleListingTypeClick = (type) => {
    setBrowseFilters({ species: '', type, search: '', breed: '', gender: '' });
    setCurrentPage('browse');
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem' }}>
      {/* Hero Section */}
      <section className="glass-panel" style={{
        borderRadius: 'var(--radius-xl)',
        padding: '4rem 2rem',
        textAlign: 'center',
        marginBottom: '3rem',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F4F2 100%)',
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '50%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(46, 125, 107, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>

        <h1 style={{
          fontSize: '3.25rem',
          fontWeight: 800,
          marginBottom: '1rem',
          lineHeight: '1.2',
          color: 'var(--text-primary)'
        }}>
          Find Your New <br />
          <span style={{ color: 'var(--color-primary)' }}>Best Friend</span> Today
        </h1>
        
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.15rem',
          maxWidth: '620px',
          margin: '0 auto 2.5rem auto',
          lineHeight: '1.6'
        }}>
          PetPal is the professional pet-care platform for purchasing, adopting, or fostering loving pets. Connect directly with verified owners and certified listings.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            style={{ fontSize: '1.05rem', padding: '0.8rem 2rem' }}
            onClick={() => {
              setBrowseFilters({ species: '', type: '', search: '', breed: '', gender: '' });
              setCurrentPage('browse');
            }}
          >
            Browse All Pets
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '1.05rem', padding: '0.8rem 2rem' }}
            onClick={() => setCurrentPage('create')}
          >
            Re-home / List a Pet
          </button>
        </div>
      </section>

      {/* Category Section */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
          Browse by Species
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          <div 
            className="glass-panel" 
            style={{
              padding: '2.5rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            onClick={() => handleCategoryClick('Dog')}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🐕</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dogs</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Find puppies, loyal companions, and active breeds.</p>
          </div>

          <div 
            className="glass-panel" 
            style={{
              padding: '2.5rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            onClick={() => handleCategoryClick('Cat')}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🐈</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cats</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Explore kittens, quiet indoor cats, and affectionate breeds.</p>
          </div>

          <div 
            className="glass-panel" 
            style={{
              padding: '2.5rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            onClick={() => handleCategoryClick('Rabbit')}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🐇</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Rabbits</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Look for fluffy rabbits, angoras, and playful bunnies.</p>
          </div>
        </div>
      </section>

      {/* Listing Services Section */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
          What are you looking for?
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>🏷️ Premium Sales</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', flexGrow: 1, lineHeight: '1.5' }}>
              Browse beautiful, healthy, and certified pets for sale. Safe transaction logs managed dynamically on our platform.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={() => handleListingTypeClick('sell')}>
              Browse Sales
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#B47818', marginBottom: '0.75rem' }}>❤️ Adoption Applications</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', flexGrow: 1, lineHeight: '1.5' }}>
              Apply to adopt pets looking for their forever home. Free re-homing listings with direct communication with existing owners.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={() => handleListingTypeClick('adopt')}>
              Browse Adoptions
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563EB', marginBottom: '0.75rem' }}>🏠 Foster Parenting</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', flexGrow: 1, lineHeight: '1.5' }}>
              Become a temporary foster parent! Provide shelter and care for pets whose owners are traveling or relocating.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={() => handleListingTypeClick('foster')}>
              Browse Foster Listings
            </button>
          </div>
        </div>
      </section>

      {/* Featured Pets Grid */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          Recent Additions
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading featured pets...</div>
        ) : featuredPets.length > 0 ? (
          <div className="grid-listings">
            {featuredPets.map(listing => (
              <PetCard 
                key={listing.listing_id} 
                listing={listing} 
                onSelect={(id) => {
                  setSelectedListingId(id);
                  setCurrentPage('details');
                }}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
            No active listings found. Be the first to list a pet!
          </div>
        )}
      </section>
    </div>
  );
}
