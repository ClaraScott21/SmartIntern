// ============================================
// SmartIntern — Auth routes
// POST /api/auth/login
// POST /api/auth/register
// GET  /api/auth/me
// ============================================

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();
const SALT_ROUNDS = 10;

function signToken(userId, role) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function buildUserResponse(user) {
  let profileCompleted = true;
  let displayName = '';

  if (user.role === 'student') {
    const [rows] = await pool.query(
      `SELECT first_name, last_name,
              (SELECT COUNT(*) FROM Student_Skill WHERE student_id = s.student_id) AS skill_count
       FROM Student s WHERE s.user_id = ?`,
      [user.user_id]
    );
    if (!rows.length) {
      profileCompleted = false;
    } else {
      const s = rows[0];
      displayName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
      profileCompleted = !!s.first_name && s.skill_count > 0;
    }
  } else if (user.role === 'company') {
    const [rows] = await pool.query(
      `SELECT company_name FROM Company WHERE user_id = ?`,
      [user.user_id]
    );
    if (!rows.length) {
      profileCompleted = false;
    } else {
      displayName = rows[0].company_name || '';
    }
  }

  return {
    userId: user.user_id,
    role: user.role,
    name: displayName,
    profileCompleted
  };
}

// ============================================
// POST /api/auth/login
// Body: { email, password }
// Role is read from the DB — user does not pick it
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.query(
      `SELECT user_id, email, password_hash, role
       FROM User WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userInfo = await buildUserResponse(user);
    const token = signToken(user.user_id, user.role);

    return res.json({ token, ...userInfo });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// ============================================
// POST /api/auth/register
// Body: { email, password, role, student?, company? }
// ============================================
router.post('/register', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { email, password, role, student, company } = req.body;

    if (!email || !password || !role) {
      conn.release();
      return res.status(400).json({ error: 'Email, password and role are required' });
    }

    if (!['student', 'company'].includes(role)) {
      conn.release();
      return res.status(400).json({ error: 'Role must be student or company' });
    }

    if (password.length < 6) {
      conn.release();
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const [existing] = await conn.query(
      `SELECT user_id FROM User WHERE email = ? LIMIT 1`,
      [email]
    );
    if (existing.length) {
      conn.release();
      return res.status(409).json({ error: 'Email already registered' });
    }

    await conn.beginTransaction();

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [userResult] = await conn.query(
      `INSERT INTO User (email, password_hash, role) VALUES (?, ?, ?)`,
      [email, passwordHash, role]
    );
    const userId = userResult.insertId;

    if (role === 'student') {
      const firstName = (student && student.firstName) || '';
      const lastName  = (student && student.lastName)  || '';
      await conn.query(
        `INSERT INTO Student (user_id, first_name, last_name) VALUES (?, ?, ?)`,
        [userId, firstName, lastName]
      );
    } else {
      const companyName = (company && company.companyName) || '';
      const description = (company && company.description) || '';
      await conn.query(
        `INSERT INTO Company (user_id, company_name, description) VALUES (?, ?, ?)`,
        [userId, companyName, description]
      );
    }

    await conn.commit();
    conn.release();

    const token = signToken(userId, role);
    return res.status(201).json({
      token,
      userId,
      role,
      name: role === 'student'
        ? `${(student?.firstName || '')} ${(student?.lastName || '')}`.trim()
        : (company?.companyName || ''),
      profileCompleted: false
    });

  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    conn.release();
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// ============================================
// GET /api/auth/me
// ============================================
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, email, role FROM User WHERE user_id = ? LIMIT 1`,
      [req.user.userId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userInfo = await buildUserResponse(rows[0]);
    return res.json(userInfo);
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;