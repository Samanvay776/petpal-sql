const express = require('express');
const router = express.Router();
const { dbRun, dbAll, dbGet } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get all listings with search and filters
router.get('/', async (req, res) => {
  const { species, breed, type, minPrice, maxPrice, gender, search } = req.query;

  let query = `
    SELECT pl.listing_id, pl.pet_id, pl.listing_type, pl.price, pl.status, pl.created_at,
           p.pet_name, p.species, p.breed, p.age, p.gender, p.health_info,
           pi.image_url, u.name as owner_name
    FROM pet_listings pl
    JOIN pets p ON pl.pet_id = p.pet_id
    LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id
    JOIN users u ON p.owner_id = u.user_id
    WHERE pl.status = 'active'
  `;
  const params = [];

  if (species) {
    query += ` AND p.species = ?`;
    params.push(species);
  }
  if (breed) {
    query += ` AND p.breed LIKE ?`;
    params.push(`%${breed}%`);
  }
  if (type) {
    query += ` AND pl.listing_type = ?`;
    params.push(type);
  }
  if (minPrice) {
    query += ` AND pl.price >= ?`;
    params.push(parseFloat(minPrice));
  }
  if (maxPrice) {
    query += ` AND pl.price <= ?`;
    params.push(parseFloat(maxPrice));
  }
  if (gender) {
    query += ` AND p.gender = ?`;
    params.push(gender);
  }
  if (search) {
    query += ` AND (p.pet_name LIKE ? OR p.breed LIKE ? OR p.species LIKE ?)`;
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  // Group by listing_id to prevent duplicates if there are multiple images, 
  // or return the first image in the main list.
  query += ` GROUP BY pl.listing_id ORDER BY pl.created_at DESC`;

  try {
    const listings = await dbAll(query, params);
    res.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single listing details
router.get('/:id', async (req, res) => {
  const listingId = req.params.id;

  try {
    const listing = await dbGet(`
      SELECT pl.listing_id, pl.pet_id, pl.listing_type, pl.price, pl.status, pl.created_at,
             p.pet_name, p.species, p.breed, p.age, p.gender, p.health_info, p.owner_id,
             u.name as owner_name, u.email as owner_email, u.phone as owner_phone
      FROM pet_listings pl
      JOIN pets p ON pl.pet_id = p.pet_id
      JOIN users u ON p.owner_id = u.user_id
      WHERE pl.listing_id = ?
    `, [listingId]);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Fetch all images for this pet
    const images = await dbAll('SELECT image_url FROM pet_images WHERE pet_id = ?', [listing.pet_id]);
    listing.images = images.map(img => img.image_url);

    // Fetch owner review rating average
    const reviews = await dbGet(`
      SELECT AVG(rating) as average_rating, COUNT(review_id) as review_count 
      FROM reviews 
      WHERE reviewed_user_id = ?
    `, [listing.owner_id]);
    
    listing.owner_rating = reviews.average_rating || 5.0;
    listing.owner_review_count = reviews.review_count || 0;

    res.json(listing);
  } catch (error) {
    console.error('Error fetching listing details:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new listing
router.post('/', authenticateToken, async (req, res) => {
  const { pet_name, species, breed, age, gender, health_info, listing_type, price, images } = req.body;
  const owner_id = req.user.user_id;

  if (!pet_name || !species || !listing_type) {
    return res.status(400).json({ error: 'Pet name, species, and listing type are required' });
  }

  try {
    // 1. Insert Pet
    const petResult = await dbRun(`
      INSERT INTO pets (owner_id, pet_name, species, breed, age, gender, health_info)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [owner_id, pet_name, species, breed || '', age || 0, gender || 'Unknown', health_info || '']);

    const petId = petResult.id;

    // 2. Insert Listing
    const listingPrice = listing_type === 'sell' ? parseFloat(price || 0) : 0;
    const listingResult = await dbRun(`
      INSERT INTO pet_listings (pet_id, listing_type, price, status)
      VALUES (?, ?, ?, 'active')
    `, [petId, listing_type, listingPrice]);

    // 3. Insert Images
    const imgUrls = images && Array.isArray(images) && images.length > 0
      ? images
      : ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600']; // default dog

    for (const url of imgUrls) {
      if (url.trim() !== '') {
        await dbRun('INSERT INTO pet_images (pet_id, image_url) VALUES (?, ?)', [petId, url]);
      }
    }

    res.status(201).json({
      message: 'Listing created successfully',
      listing_id: listingResult.id,
      pet_id: petId
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete listing
router.delete('/:id', authenticateToken, async (req, res) => {
  const listingId = req.params.id;
  const userId = req.user.user_id;
  const userRole = req.user.role;

  try {
    // Get listing to verify ownership
    const listing = await dbGet(`
      SELECT p.owner_id, pl.pet_id 
      FROM pet_listings pl
      JOIN pets p ON pl.pet_id = p.pet_id
      WHERE pl.listing_id = ?
    `, [listingId]);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.owner_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this listing' });
    }

    // Delete listing (cascade triggers will delete associated images, listings, applications, etc.)
    // But SQLite CASCADE needs to be triggered, or we delete the pet directly
    await dbRun('DELETE FROM pets WHERE pet_id = ?', [listing.pet_id]);

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
