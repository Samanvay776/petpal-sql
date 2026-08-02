const express = require('express');
const router = express.Router();
const { dbRun, dbAll } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get notifications for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    const notifications = await dbAll(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.user_id;

  try {
    await dbRun(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE notification_id = ? AND user_id = ?
    `, [notificationId, userId]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    await dbRun(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE user_id = ?
    `, [userId]);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
