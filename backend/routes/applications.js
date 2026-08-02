const express = require('express');
const router = express.Router();
const { dbRun, dbAll, dbGet } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get applications/requests received by the seller/owner
router.get('/received', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    // 1. Adoption applications received
    const adoptions = await dbAll(`
      SELECT aa.*, pl.listing_type, pl.price, p.pet_name, u.name as applicant_name, u.email as applicant_email
      FROM adoption_applications aa
      JOIN pet_listings pl ON aa.listing_id = pl.listing_id
      JOIN pets p ON pl.pet_id = p.pet_id
      JOIN users u ON aa.applicant_id = u.user_id
      WHERE p.owner_id = ?
    `, [userId]);

    // 2. Foster requests received
    const fosters = await dbAll(`
      SELECT fr.*, pl.listing_type, p.pet_name, u.name as foster_parent_name, u.email as foster_parent_email
      FROM foster_requests fr
      JOIN pet_listings pl ON fr.listing_id = pl.listing_id
      JOIN pets p ON pl.pet_id = p.pet_id
      JOIN users u ON fr.foster_parent_id = u.user_id
      WHERE p.owner_id = ?
    `, [userId]);

    res.json({ adoptions, fosters });
  } catch (error) {
    console.error('Error fetching received applications:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get applications/requests sent by the logged-in buyer/foster parent
router.get('/sent', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    // 1. Adoption applications sent
    const adoptions = await dbAll(`
      SELECT aa.*, pl.listing_type, pl.price, p.pet_name, u.name as owner_name
      FROM adoption_applications aa
      JOIN pet_listings pl ON aa.listing_id = pl.listing_id
      JOIN pets p ON pl.pet_id = p.pet_id
      JOIN users u ON p.owner_id = u.user_id
      WHERE aa.applicant_id = ?
    `, [userId]);

    // 2. Foster requests sent
    const fosters = await dbAll(`
      SELECT fr.*, pl.listing_type, p.pet_name, u.name as owner_name
      FROM foster_requests fr
      JOIN pet_listings pl ON fr.listing_id = pl.listing_id
      JOIN pets p ON pl.pet_id = p.pet_id
      JOIN users u ON p.owner_id = u.user_id
      WHERE fr.foster_parent_id = ?
    `, [userId]);

    res.json({ adoptions, fosters });
  } catch (error) {
    console.error('Error fetching sent applications:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Submit adoption application
router.post('/adoption', authenticateToken, async (req, res) => {
  const { listing_id, message } = req.body;
  const applicant_id = req.user.user_id;

  if (!listing_id) {
    return res.status(400).json({ error: 'Listing ID is required' });
  }

  try {
    // Check if listing exists and is active
    const listing = await dbGet(`
      SELECT pl.*, p.pet_name, p.owner_id 
      FROM pet_listings pl
      JOIN pets p ON pl.pet_id = p.pet_id
      WHERE pl.listing_id = ?
    `, [listing_id]);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.owner_id === applicant_id) {
      return res.status(400).json({ error: 'You cannot apply to your own listing' });
    }

    // Insert application
    const result = await dbRun(`
      INSERT INTO adoption_applications (listing_id, applicant_id, message, status)
      VALUES (?, ?, ?, 'pending')
    `, [listing_id, applicant_id, message || '']);

    // Send notification to owner
    await dbRun(`
      INSERT INTO notifications (user_id, title)
      VALUES (?, ?)
    `, [listing.owner_id, `New adoption application from ${req.user.name} for ${listing.pet_name}!`]);

    res.status(201).json({ message: 'Adoption application submitted successfully', application_id: result.id });
  } catch (error) {
    console.error('Error submitting adoption application:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Submit foster request
router.post('/foster', authenticateToken, async (req, res) => {
  const { listing_id, start_date, end_date } = req.body;
  const foster_parent_id = req.user.user_id;

  if (!listing_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'Listing ID, start date, and end date are required' });
  }

  try {
    // Check if listing exists
    const listing = await dbGet(`
      SELECT pl.*, p.pet_name, p.owner_id 
      FROM pet_listings pl
      JOIN pets p ON pl.pet_id = p.pet_id
      WHERE pl.listing_id = ?
    `, [listing_id]);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.owner_id === foster_parent_id) {
      return res.status(400).json({ error: 'You cannot foster your own listing' });
    }

    // Insert foster request
    const result = await dbRun(`
      INSERT INTO foster_requests (listing_id, foster_parent_id, start_date, end_date, status)
      VALUES (?, ?, ?, ?, 'pending')
    `, [listing_id, foster_parent_id, start_date, end_date]);

    // Send notification to owner
    await dbRun(`
      INSERT INTO notifications (user_id, title)
      VALUES (?, ?)
    `, [listing.owner_id, `New foster request from ${req.user.name} for ${listing.pet_name}!`]);

    res.status(201).json({ message: 'Foster request submitted successfully', request_id: result.id });
  } catch (error) {
    console.error('Error submitting foster request:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update adoption application status (Approve/Reject)
router.put('/adoption/:id', authenticateToken, async (req, res) => {
  const applicationId = req.params.id;
  const { status } = req.body; // 'approved' or 'rejected'
  const ownerId = req.user.user_id;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
  }

  try {
    // Verify that the user is the owner of the pet listing
    const app = await dbGet(`
      SELECT aa.*, p.owner_id, p.pet_name
      FROM adoption_applications aa
      JOIN pet_listings pl ON aa.listing_id = pl.listing_id
      JOIN pets p ON pl.pet_id = p.pet_id
      WHERE aa.application_id = ?
    `, [applicationId]);

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (app.owner_id !== ownerId) {
      return res.status(403).json({ error: 'Unauthorized to change this application status' });
    }

    // Update status
    await dbRun('UPDATE adoption_applications SET status = ? WHERE application_id = ?', [status, applicationId]);

    // Send notification to applicant
    await dbRun(`
      INSERT INTO notifications (user_id, title)
      VALUES (?, ?)
    `, [app.applicant_id, `Your adoption application for ${app.pet_name} was ${status}!`]);

    // If approved, optionally set the listing status to completed/pending so others know it is processed
    if (status === 'approved') {
      await dbRun('UPDATE pet_listings SET status = ? WHERE listing_id = ?', ['completed', app.listing_id]);
    }

    res.json({ message: `Application ${status} successfully` });
  } catch (error) {
    console.error('Error updating adoption status:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update foster request status (Approve/Reject)
router.put('/foster/:id', authenticateToken, async (req, res) => {
  const requestId = req.params.id;
  const { status } = req.body;
  const ownerId = req.user.user_id;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
  }

  try {
    const request = await dbGet(`
      SELECT fr.*, p.owner_id, p.pet_name
      FROM foster_requests fr
      JOIN pet_listings pl ON fr.listing_id = pl.listing_id
      JOIN pets p ON pl.pet_id = p.pet_id
      WHERE fr.request_id = ?
    `, [requestId]);

    if (!request) {
      return res.status(404).json({ error: 'Foster request not found' });
    }

    if (request.owner_id !== ownerId) {
      return res.status(403).json({ error: 'Unauthorized to change this request status' });
    }

    await dbRun('UPDATE foster_requests SET status = ? WHERE request_id = ?', [status, requestId]);

    // Send notification to foster parent
    await dbRun(`
      INSERT INTO notifications (user_id, title)
      VALUES (?, ?)
    `, [request.foster_parent_id, `Your foster request for ${request.pet_name} was ${status}!`]);

    if (status === 'approved') {
      await dbRun('UPDATE pet_listings SET status = ? WHERE listing_id = ?', ['completed', request.listing_id]);
    }

    res.json({ message: `Foster request ${status} successfully` });
  } catch (error) {
    console.error('Error updating foster request status:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
