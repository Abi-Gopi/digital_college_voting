const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all candidates (grouped by position)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [candidates] = await db.query(
      'SELECT id, name, position, manifesto, photo_url FROM candidates ORDER BY position, name'
    );
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Get candidates by position
router.get('/position/:position', authenticateToken, async (req, res) => {
  try {
    const [candidates] = await db.query(
      'SELECT id, name, position, manifesto, photo_url FROM candidates WHERE position = ?',
      [req.params.position]
    );
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

module.exports = router;
