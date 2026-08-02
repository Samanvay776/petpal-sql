const express = require('express');
const router = express.Router();
const { dbRun, dbAll } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get payments for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    const payments = await dbAll(`
      SELECT * FROM payments 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Process a simulated payment
router.post('/', authenticateToken, async (req, res) => {
  const { amount, listing_id } = req.body;
  const userId = req.user.user_id;

  if (!amount) {
    return res.status(400).json({ error: 'Payment amount is required' });
  }

  try {
    // Save payment record
    const result = await dbRun(`
      INSERT INTO payments (user_id, amount, payment_status)
      VALUES (?, ?, 'success')
    `, [userId, parseFloat(amount)]);

    // If listing_id is provided, mark that pet listing as completed (sold)
    if (listing_id) {
      await dbRun(`
        UPDATE pet_listings 
        SET status = 'completed' 
        WHERE listing_id = ?
      `, [listing_id]);

      // Notify the owner of the listing that payment was completed
      const listing = await dbGet(`
        SELECT p.owner_id, p.pet_name 
        FROM pet_listings pl
        JOIN pets p ON pl.pet_id = p.pet_id
        WHERE pl.listing_id = ?
      `, [listing_id]);

      if (listing) {
        await dbRun(`
          INSERT INTO notifications (user_id, title)
          VALUES (?, ?)
        `, [listing.owner_id, `Payment received for ${listing.pet_name}! Amount: $${amount}`]);
      }
    }

    res.status(201).json({
      message: 'Payment simulated successfully',
      payment_id: result.id,
      payment_status: 'success'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
