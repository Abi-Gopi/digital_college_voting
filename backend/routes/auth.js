const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { sendOTP } = require('../utils/otp');

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').notEmpty(),
  body('student_id').notEmpty(),
  body('phone').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, full_name, student_id, phone } = req.body;

  try {
    // Check if user exists
    const [existingUsers] = await db.query(
      'SELECT id FROM profiles WHERE email = ? OR student_id = ?',
      [email, student_id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO profiles (email, password_hash, full_name, student_id, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, full_name, student_id, phone]
    );

    const userId = result.insertId;

    // Assign voter role
    await db.query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, 'voter']);

    // Generate and send OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      'INSERT INTO otp_verifications (user_id, otp_code, email, phone, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, otpCode, email, phone, expiresAt]
    );

    // Send OTP via email/SMS (implement in utils/otp.js)
    await sendOTP(email, phone, otpCode);

    res.status(201).json({ 
      message: 'Registration successful. Please verify OTP.',
      userId 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { userId, otpCode } = req.body;

  try {
    const [otpRecords] = await db.query(
      'SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND verified = FALSE AND expires_at > NOW()',
      [userId, otpCode]
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as verified
    await db.query('UPDATE otp_verifications SET verified = TRUE WHERE id = ?', [otpRecords[0].id]);
    await db.query('UPDATE profiles SET is_verified = TRUE WHERE id = ?', [userId]);

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query(
      'SELECT p.*, r.role FROM profiles p LEFT JOIN user_roles r ON p.id = r.user_id WHERE p.email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your account first' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'voter' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'voter',
        has_voted: user.has_voted
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
