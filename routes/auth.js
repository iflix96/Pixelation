const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Middleware: verify JWT ────────────────────────────────────
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'No token provided' });

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    const exists = await User.findOne({ username });
    if (exists)
      return res.status(409).json({ message: 'Username already taken' });

    const user = new User({ username, password });
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, score: user.score }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, score: user.score }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/auth/leaderboard ─────────────────────────────────
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const users = await User.find()
      .sort({ score: -1 })
      .limit(10)
      .select('username score gamesPlayed gamesWon');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/auth/score ──────────────────────────────────────
router.post('/score', authenticate, async (req, res) => {
  try {
    const { points, won } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.score += points || 0;
    user.gamesPlayed += 1;
    if (won) user.gamesWon += 1;
    await user.save();

    res.json({ score: user.score });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
