import React, { useState } from 'react';
import { API_BASE } from '../config';


export default function CreateListing({ token, setCurrentPage, setSelectedListingId }) {
  const [formData, setFormData] = useState({
    pet_name: '',
    species: 'Dog',
    breed: '',
    age: '',
    gender: 'Male',
    health_info: '',
    listing_type: 'sell',
    price: '',
    image1: '',
    image2: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pet_name || !formData.species || !formData.listing_type) {
      alert('Please fill out the name, species, and listing type.');
      return;
    }

    setSubmitting(true);
    const imagesArray = [formData.image1, formData.image2].filter(url => url.trim() !== '');

    const payload = {
      pet_name: formData.pet_name,
      species: formData.species,
      breed: formData.breed,
      age: parseInt(formData.age || 0),
      gender: formData.gender,
      health_info: formData.health_info,
      listing_type: formData.listing_type,
      price: formData.listing_type === 'sell' ? parseFloat(formData.price || 0) : 0,
      images: imagesArray
    };

    try {
      const res = await fetch(`${API_BASE}/api/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Listing created successfully!');
        setSelectedListingId(data.listing_id);
        setCurrentPage('details');
      } else {
        alert(data.error || 'Failed to create listing');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to the server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', maxWidth: '700px' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>List a Pet</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Provide all details below to register and list your pet.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Pet Name */}
          <div className="form-group">
            <label className="form-label">Pet Name *</label>
            <input 
              type="text" 
              name="pet_name" 
              className="form-input" 
              placeholder="e.g. Max, Milo" 
              value={formData.pet_name}
              onChange={handleChange}
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Species */}
            <div className="form-group">
              <label className="form-label">Species *</label>
              <select 
                name="species" 
                className="form-select"
                value={formData.species}
                onChange={handleChange}
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Rabbit">Rabbit</option>
              </select>
            </div>
            {/* Breed */}
            <div className="form-group">
              <label className="form-label">Breed</label>
              <input 
                type="text" 
                name="breed" 
                className="form-input" 
                placeholder="e.g. Golden Retriever" 
                value={formData.breed}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Age */}
            <div className="form-group">
              <label className="form-label">Age (Years)</label>
              <input 
                type="number" 
                name="age" 
                className="form-input" 
                placeholder="e.g. 2" 
                value={formData.age}
                onChange={handleChange}
                min="0"
              />
            </div>
            {/* Gender */}
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select 
                name="gender" 
                className="form-select"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>

          {/* Health & Description */}
          <div className="form-group">
            <label className="form-label">Health & Description Details</label>
            <textarea 
              name="health_info" 
              className="form-textarea" 
              placeholder="Provide vaccination status, behavior, special needs, etc."
              value={formData.health_info}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Listing Type & Price */}
          <div style={{ display: 'grid', gridTemplateColumns: formData.listing_type === 'sell' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Listing Purpose *</label>
              <select 
                name="listing_type" 
                className="form-select"
                value={formData.listing_type}
                onChange={handleChange}
              >
                <option value="sell">Sell</option>
                <option value="adopt">Adopt (Free)</option>
                <option value="foster">Foster (Temporary)</option>
              </select>
            </div>
            {formData.listing_type === 'sell' && (
              <div className="form-group">
                <label className="form-label">Price ($) *</label>
                <input 
                  type="number" 
                  name="price" 
                  className="form-input" 
                  placeholder="Price in USD"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  required 
                />
              </div>
            )}
          </div>

          {/* Image URLs */}
          <div className="form-group">
            <label className="form-label">Image URL 1</label>
            <input 
              type="url" 
              name="image1" 
              className="form-input" 
              placeholder="Paste photo link (Unsplash, etc.)"
              value={formData.image1}
              onChange={handleChange}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Image URL 2 (Optional)</label>
            <input 
              type="url" 
              name="image2" 
              className="form-input" 
              placeholder="Paste second photo link"
              value={formData.image2}
              onChange={handleChange}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.8rem' }}
            disabled={submitting}
          >
            {submitting ? 'Creating Listing...' : '🚀 Submit Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
