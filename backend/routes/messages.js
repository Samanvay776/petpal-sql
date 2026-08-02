const express = require('express');
const router = express.Router();
const { dbRun, dbAll } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get list of users the logged-in user has chats with
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    // Select all unique user IDs that have exchanged messages with current user
    const chatPartners = await dbAll(`
      SELECT DISTINCT 
        CASE 
          WHEN sender_id = ? THEN receiver_id 
          ELSE sender_id 
        END as partner_id,
        u.name as partner_name,
        u.email as partner_email
      FROM messages m
      JOIN users u ON u.user_id = partner_id
      WHERE sender_id = ? OR receiver_id = ?
    `, [userId, userId, userId]);

    res.json(chatPartners);
  } catch (error) {
    console.error('Error fetching chat partners:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get messages between logged-in user and another user
router.get('/:partnerId', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const partnerId = req.params.partnerId;

  try {
    const messages = await dbAll(`
      SELECT * FROM messages
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `, [userId, partnerId, partnerId, userId]);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching message history:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Send a message
router.post('/', authenticateToken, async (req, res) => {
  const { receiver_id, message_text } = req.body;
  const sender_id = req.user.user_id;

  if (!receiver_id || !message_text) {
    return res.status(400).json({ error: 'Receiver ID and message text are required' });
  }

  try {
    const result = await dbRun(`
      INSERT INTO messages (sender_id, receiver_id, message_text)
      VALUES (?, ?, ?)
    `, [sender_id, receiver_id, message_text]);

    // Send a notification to the receiver
    await dbRun(`
      INSERT INTO notifications (user_id, title)
      VALUES (?, ?)
    `, [receiver_id, `New message from ${req.user.name}: "${message_text.substring(0, 30)}${message_text.length > 30 ? '...' : ''}"`]);

    res.status(201).json({
      message_id: result.id,
      sender_id,
      receiver_id,
      message_text,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
