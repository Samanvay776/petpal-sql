import React from 'react';

export default function PetCard({ listing, onSelect }) {
  const {
    listing_id,
    pet_name,
    species,
    breed,
    age,
    gender,
    listing_type,
    price,
    image_url,
    owner_name
  } = listing;

  const defaultImages = {
    dog: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600',
    cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600',
    rabbit: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=600'
  };

  const displayImage = image_url || defaultImages[species.toLowerCase()] || defaultImages.dog;

  // Format type labels
  const typeLabels = {
    sell: 'For Sale',
    adopt: 'Adoption',
    foster: 'Fostering'
  };

  return (
    <div className="pet-card glass-panel" onClick={() => onSelect(listing_id)} style={{ cursor: 'pointer' }}>
      <div className="pet-card-image-container">
        <span className={`badge badge-${listing_type} pet-card-tag`}>
          {typeLabels[listing_type]}
        </span>
        <img 
          src={displayImage} 
          alt={pet_name} 
          className="pet-card-image"
          onError={(e) => {
            e.target.src = defaultImages[species.toLowerCase()] || defaultImages.dog;
          }}
        />
      </div>

      <div className="pet-card-content">
        <div className="pet-card-header">
          <h3 className="pet-card-title">{pet_name}</h3>
          {listing_type === 'sell' && (
            <span className="pet-card-price">${price.toLocaleString()}</span>
          )}
        </div>

        <p className="pet-card-breed">{breed || species}</p>

        <div className="pet-card-details">
          <span className="pet-card-detail-item">
            🎂 {age} {age === 1 ? 'year' : 'years'}
          </span>
          <span className="pet-card-detail-item">
            {gender === 'Male' ? '♂️' : gender === 'Female' ? '♀️' : '❓'} {gender}
          </span>
        </div>

        <div className="pet-card-footer">
          <span className="pet-card-owner">👤 Listed by {owner_name}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
}
