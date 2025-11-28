const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Get all voters
router.get('/voters', async (req, res) => {
  try {
    const [voters] = await db.query(`
      SELECT 
        p.id,
        p.email,
        p.full_name,
        p.student_id,
        p.phone,
        p.is_verified,
        p.has_voted,
        p.created_at
      FROM profiles p
      INNER JOIN user_roles r ON p.id = r.user_id
      WHERE r.role = 'voter'
      ORDER BY p.created_at DESC
    `);
    res.json(voters);
  } catch (error) {
    console.error('Error fetching voters:', error);
    res.status(500).json({ error: 'Failed to fetch voters' });
  }
});

// Get statistics
router.get('/statistics', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM profiles WHERE is_verified = TRUE) as total_voters,
        (SELECT COUNT(*) FROM profiles WHERE has_voted = TRUE) as voted_count,
        (SELECT COUNT(*) FROM candidates) as total_candidates,
        (SELECT COUNT(*) FROM feedback) as feedback_count
    `);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Add candidate
router.post('/candidates', async (req, res) => {
  const { name, position, manifesto, photo_url } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO candidates (name, position, manifesto, photo_url) VALUES (?, ?, ?, ?)',
      [name, position, manifesto, photo_url]
    );
    res.status(201).json({ 
      message: 'Candidate added successfully',
      candidateId: result.insertId 
    });
  } catch (error) {
    console.error('Error adding candidate:', error);
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

// Update candidate
router.put('/candidates/:id', async (req, res) => {
  const { name, position, manifesto, photo_url } = req.body;
  const candidateId = req.params.id;

  try {
    await db.query(
      'UPDATE candidates SET name = ?, position = ?, manifesto = ?, photo_url = ? WHERE id = ?',
      [name, position, manifesto, photo_url, candidateId]
    );
    res.json({ message: 'Candidate updated successfully' });
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// Delete candidate
router.delete('/candidates/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM candidates WHERE id = ?', [req.params.id]);
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// Get all feedback
router.get('/feedback', async (req, res) => {
  try {
    const [feedback] = await db.query(`
      SELECT 
        f.id,
        f.rating,
        f.suggestions,
        f.created_at,
        p.full_name,
        p.email
      FROM feedback f
      INNER JOIN profiles p ON f.user_id = p.id
      ORDER BY f.created_at DESC
    `);
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

module.exports = router;
