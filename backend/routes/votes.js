const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Submit votes
router.post('/', authenticateToken, async (req, res) => {
  const { votes } = req.body; // Array of { position, candidateId }
  const userId = req.user.id;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Check if user has already voted
    const [userProfile] = await connection.query(
      'SELECT has_voted FROM profiles WHERE id = ? FOR UPDATE',
      [userId]
    );

    if (userProfile[0].has_voted) {
      await connection.rollback();
      return res.status(403).json({ error: 'You have already voted' });
    }

    // Insert votes
    for (const vote of votes) {
      await connection.query(
        'INSERT INTO votes (user_id, candidate_id, position) VALUES (?, ?, ?)',
        [userId, vote.candidateId, vote.position]
      );
    }

    // Mark user as voted
    await connection.query('UPDATE profiles SET has_voted = TRUE WHERE id = ?', [userId]);

    await connection.commit();
    res.json({ message: 'Votes submitted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Voting error:', error);
    res.status(500).json({ error: 'Failed to submit votes' });
  } finally {
    connection.release();
  }
});

// Get vote results
router.get('/results', authenticateToken, async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.position,
        c.photo_url,
        COUNT(v.id) as vote_count,
        (SELECT COUNT(*) FROM profiles WHERE has_voted = TRUE) as total_voters
      FROM candidates c
      LEFT JOIN votes v ON c.id = v.candidate_id
      GROUP BY c.id, c.name, c.position, c.photo_url
      ORDER BY c.position, vote_count DESC
    `);
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Check if user has voted
router.get('/check-voted', authenticateToken, async (req, res) => {
  try {
    const [user] = await db.query(
      'SELECT has_voted FROM profiles WHERE id = ?',
      [req.user.id]
    );
    res.json({ hasVoted: user[0].has_voted });
  } catch (error) {
    console.error('Error checking vote status:', error);
    res.status(500).json({ error: 'Failed to check vote status' });
  }
});

module.exports = router;
