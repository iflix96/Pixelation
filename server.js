require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const GameManager = require('./js/managers/GameManager');

// ── App & Server ──────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// Serve index for any non-API route (SPA-style)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// ── MongoDB ───────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch((err) => console.error('❌  MongoDB error:', err));

// ── Socket.IO Game Manager ────────────────────────────────────
const gameManager = new GameManager(io);
gameManager.init();

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮  Pixelation running on http://localhost:${PORT}`);
});
