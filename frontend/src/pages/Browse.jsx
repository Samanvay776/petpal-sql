import React, { useEffect, useState } from 'react';
import PetCard from '../components/PetCard';
import { API_BASE } from '../config';


export default function Browse({ 
  setCurrentPage, 
  setSelectedListingId, 
  filters, 
  setFilters 
}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to query backend API
  const fetchListings = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.species) params.append('species', filters.species);
    if (filters.breed) params.append('breed', filters.breed);
    if (filters.type) params.append('type', filters.type);
    if (filters.gender) params.append('gender', filters.gender);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.search) params.append('search', filters.search);

    fetch(`${API_BASE}/api/pets?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setListings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching listings:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      species: '',
      breed: '',
      type: '',
      gender: '',
      minPrice: '',
      maxPrice: '',
      search: ''
    });
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>
        Browse Listings
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Sidebar Filters */}
        <aside className="glass-panel" style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          position: 'sticky',
          top: '90px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Filters</h3>
            <button 
              onClick={handleClearFilters} 
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Clear All
            </button>
          </div>

          {/* Search bar */}
          <div className="form-group">
            <label className="form-label">Search</label>
            <input 
              type="text" 
              name="search" 
              className="form-input" 
              placeholder="Search by name, breed..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          {/* Species */}
          <div className="form-group">
            <label className="form-label">Species</label>
            <select 
              name="species" 
              className="form-select"
              value={filters.species}
              onChange={handleFilterChange}
            >
              <option value="">All Species</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Rabbit">Rabbit</option>
            </select>
          </div>

          {/* Listing Type */}
          <div className="form-group">
            <label className="form-label">Listing Type</label>
            <select 
              name="type" 
              className="form-select"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="sell">For Sale</option>
              <option value="adopt">Adoption</option>
              <option value="foster">Fostering</option>
            </select>
          </div>

          {/* Breed */}
          <div className="form-group">
            <label className="form-label">Breed</label>
            <input 
              type="text" 
              name="breed" 
              className="form-input" 
              placeholder="e.g. Retriever"
              value={filters.breed}
              onChange={handleFilterChange}
            />
          </div>

          {/* Gender */}
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select 
              name="gender" 
              className="form-select"
              value={filters.gender}
              onChange={handleFilterChange}
            >
              <option value="">Any Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Price Range */}
          {filters.type === 'sell' || !filters.type ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Min Price</label>
                <input 
                  type="number" 
                  name="minPrice" 
                  className="form-input" 
                  placeholder="$ Min"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Price</label>
                <input 
                  type="number" 
                  name="maxPrice" 
                  className="form-input" 
                  placeholder="$ Max"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          ) : null}
        </aside>

        {/* Listings Grid */}
        <main>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>
              Loading matching pets...
            </div>
          ) : listings.length > 0 ? (
            <div className="grid-listings">
              {listings.map(listing => (
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
            <div className="glass-panel" style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-secondary)'
            }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No Pets Found
              </h3>
              <p>Try broadening your filter criteria or search query.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
