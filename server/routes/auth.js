import { Router } from 'express';
import bcrypt from 'bcrypt';
import { getDatabase } from '../db/database.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = Router();
const SALT_ROUNDS = 10;

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const db = getDatabase();

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
      .run(email, passwordHash);

    // Create default preferences for user
    db.prepare('INSERT INTO preferences (user_id) VALUES (?)').run(result.lastInsertRowid);

    // Generate token
    const token = generateToken(result.lastInsertRowid, email);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      user: { id: result.lastInsertRowid, email },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: { id: user.id, email: user.email },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const db = getDatabase();
  const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?')
    .get(req.user.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get preferences
  const preferences = db.prepare('SELECT * FROM preferences WHERE user_id = ?')
    .get(req.user.userId);

  res.json({
    user: {
      ...user,
      preferences: preferences ? {
        favoriteTeams: JSON.parse(preferences.favorite_teams || '[]'),
        betTypes: JSON.parse(preferences.bet_types || '[]'),
        riskTolerance: preferences.risk_tolerance,
        bankroll: preferences.bankroll
      } : null
    }
  });
});

// Update preferences
router.put('/preferences', authenticateToken, (req, res) => {
  try {
    const { favoriteTeams, betTypes, riskTolerance, bankroll } = req.body;
    const db = getDatabase();

    db.prepare(`
      UPDATE preferences SET
        favorite_teams = ?,
        bet_types = ?,
        risk_tolerance = ?,
        bankroll = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      JSON.stringify(favoriteTeams || []),
      JSON.stringify(betTypes || []),
      riskTolerance || 'moderate',
      bankroll || 0,
      req.user.userId
    );

    res.json({ message: 'Preferences updated' });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
