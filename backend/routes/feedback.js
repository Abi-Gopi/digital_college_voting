const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Submit feedback
router.post('/', authenticateToken, async (req, res) => {
  const { rating, suggestions } = req.body;
  const userId = req.user.id;

  try {
    await db.query(
      'INSERT INTO feedback (user_id, rating, suggestions) VALUES (?, ?, ?)',
      [userId, rating, suggestions]
    );
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

module.exports = router;
