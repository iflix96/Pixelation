const jwt = require('jsonwebtoken');
const IMAGES = require('./ImagePool');

/**
 * GameManager
 * Manages all real-time game sessions via Socket.IO.
 * Uses ES6 class pattern for clear encapsulation.
 */
class GameManager {
  constructor(io) {
    this.io = io;
    this.players = new Map();      // socketId -> { username, score, id }
    this.currentRound = null;      // { imageKey, answer, pixelLevel, intervalId }
    this.roundActive = false;
    this.roundNumber = 0;
    this.MAX_ROUNDS = 5;
    this.usedImageKeys = []; 

    this.PIXEL_START = 32;         
    this.PIXEL_MIN = 1;            
    this.PIXEL_DECREASE = 2;       
    this.TICK_INTERVAL = 2000;      // ms between auto-decreases
  }

  init() {
    // JWT middleware for socket handshake
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket) => this._onConnect(socket));
  }

  // ── Connection ──────────────────────────────────────────────
  _onConnect(socket) {
    const { username, id } = socket.user;

    this.players.set(socket.id, { username, id, score: 0 });
    console.log(`✅ ${username} connected`);

    // Send current game state to the new player
    socket.emit('playerJoined', {
      username,
      playerCount: this.players.size
    });

    // If a round is active, sync the new player
    if (this.roundActive && this.currentRound) {
      socket.emit('roundStart', {
        roundNumber: this.roundNumber,
        imageKey: this.currentRound.imageKey,
        pixelLevel: this.currentRound.pixelLevel
      });
    }

    this._broadcastPlayerList();

    // If first player, start a round after short delay
    if (this.players.size === 1 && !this.roundActive) {
      setTimeout(() => this._startRound(), 2000);
    }

    // ── Events ─────────────────────────────────────────────────
    socket.on('submitGuess', (data) => this._onGuess(socket, data));
    socket.on('requestHint', () => this._onHint(socket));
    socket.on('disconnect', () => this._onDisconnect(socket));
    socket.on('chatMessage', (data) => this._onChat(socket, data));
    socket.on('playAgain', () => this._restartGame());
  }
  _restartGame() {
    if (this.roundActive) return; // منع إعادة التشغيل إذا كانت اللعبة تعمل بالفعل
    
    this.roundNumber = 0;
    this.usedImageKeys = [];
    // تصفير نقاط جميع اللاعبين
    for (let [id, player] of this.players.entries()) {
      player.score = 0;
      this.players.set(id, player);
    }
    
    this._broadcastPlayerList();
    this.io.emit('chatMessage', { type: 'system', text: '🔄 A new game has started!' });
    this._startRound();
  }

  // ── Start a new round ───────────────────────────────────────
  _startRound() {
    if (this.players.size === 0) return;

    this.roundNumber++;
    let availableImages = IMAGES.filter(img => !this.usedImageKeys.includes(img.key));
    if (availableImages.length === 0) {
      this.usedImageKeys = [];
      availableImages = IMAGES;
    }
    const chosen = availableImages[Math.floor(Math.random() * availableImages.length)];
    this.usedImageKeys.push(chosen.key);
    this.currentRound = {
      imageKey: chosen.key,
      answer: chosen.answer,
      aliases: chosen.aliases || [],
      pixelLevel: this.PIXEL_START,
      points: 100
    };
    this.roundActive = true;

    this.io.emit('roundStart', {
      roundNumber: this.roundNumber,
      imageKey: chosen.key,
      pixelLevel: this.currentRound.pixelLevel
    });

    // Auto-depixelate timer
    this.currentRound.intervalId = setInterval(() => {
      this._decreasePixel(this.PIXEL_DECREASE);
      if (this.currentRound && this.currentRound.points > 10) {
        this.currentRound.points -= 10;
      }
    }, this.TICK_INTERVAL);
  }

  // ── Decrease pixelation ─────────────────────────────────────
  _decreasePixel(amount) {
    if (!this.roundActive || !this.currentRound) return;

    this.currentRound.pixelLevel = Math.max(
      this.PIXEL_MIN,
      this.currentRound.pixelLevel - amount
    );

    this.io.emit('pixelUpdate', { pixelLevel: this.currentRound.pixelLevel });

    // If fully revealed and no one guessed, end the round
    if (this.currentRound.pixelLevel <= this.PIXEL_MIN) {
      clearInterval(this.currentRound.intervalId);
      setTimeout(() => this._endRound(null), 2000);
    }
  }

  // ── Guess handler ───────────────────────────────────────────
  _onGuess(socket, data) {
    if (!this.roundActive || !this.currentRound) return;

    const player = this.players.get(socket.id);
    if (!player) return;

    const raw = (data.guess || '').trim();
    const guess = raw.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s]/gi, '');
    const answer = this.currentRound.answer.toLowerCase();
    const aliases = this.currentRound.aliases.map((a) => a.toLowerCase());

    const correct = guess === answer || aliases.includes(guess);

    // Broadcast guess as chat message
    this.io.emit('chatMessage', {
      type: correct ? 'correct' : 'guess',
      username: player.username,
      text: raw
    });

    if (correct) {
      // Points based on round timer
      const points = Math.max(10, this.currentRound.points);
      player.score += points;
      this.players.set(socket.id, player);
      this._broadcastPlayerList(); 

      this._endRound({ winner: player.username, points });
    }
  }

  // ── Hint handler ────────────────────────────────────────────
  _onHint(socket) {
    if (!this.roundActive) return;
    const player = this.players.get(socket.id);
    if (!player) return;

    // Decrease by extra 4 levels
    this._decreasePixel(4);

    this.io.emit('chatMessage', {
      type: 'system',
      text: `💡 ${player.username} used a hint!`
    });
  }

  // ── Chat message handler ─────────────────────────────────────
  _onChat(socket, data) {
    const player = this.players.get(socket.id);
    if (!player) return;

    this.io.emit('chatMessage', {
      type: 'chat',
      username: player.username,
      text: String(data.text || '').slice(0, 200)
    });
  }

  // ── End a round ─────────────────────────────────────────────
  _endRound(result) {
    if (!this.roundActive) return;
    this.roundActive = false;

    if (this.currentRound?.intervalId) {
      clearInterval(this.currentRound.intervalId);
    }

    const leaderboard = this._buildLeaderboard();

    this.io.emit('roundEnd', {
      result,
      answer: this.currentRound?.answer,
      imageKey: this.currentRound?.imageKey,
      leaderboard
    });

    // Start next round after 5s
    // ابحث عن هذا الجزء في نهاية دالة _endRound
    setTimeout(() => {
      // 💡 قم بتعديل السطر التالي ليصبح هكذا:
      if (this.players.size > 0 && this.roundNumber < this.MAX_ROUNDS) {
          this._startRound();
      } else if (this.roundNumber >= this.MAX_ROUNDS) {
          // اختيارياً: يمكنك إرسال رسالة تفيد بانتهاء اللعبة تماماً
          this.io.emit('chatMessage', { type: 'system', text: '🏁 Game Over! Final scores are in the leaderboard.' });
          this.io.emit('gameOver', { finalLeaderboard: leaderboard });
          
      }
    }, 5000);
  }

  // ── Disconnect ──────────────────────────────────────────────
  _onDisconnect(socket) {
    const player = this.players.get(socket.id);
    if (player) {
      console.log(`❌ ${player.username} disconnected`);
      this.players.delete(socket.id);
      this._broadcastPlayerList();

      if (this.players.size === 0 && this.currentRound?.intervalId) {
        clearInterval(this.currentRound.intervalId);
        this.roundActive = false;
      }
    }
  }

  // ── Helpers ─────────────────────────────────────────────────
  _buildLeaderboard() {
    return Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ username, score }) => ({ username, score }));
  }

  _broadcastPlayerList() {
    this.io.emit('playerList', {
      players: this._buildLeaderboard(),
      count: this.players.size
    });
  }
}

module.exports = GameManager;
