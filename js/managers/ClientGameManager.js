/**
 * ClientGameManager
 * Manages the Socket.IO connection and all real-time game events.
 * Communicates with GameView and ChatView via custom DOM events.
 */
export class ClientGameManager {
  constructor() {
    this.socket = null;
    this.token  = null;
    this.user   = null;
  }

  // ── Connect to server ──────────────────────────────────────
  connect(token, user) {
    this.token = token;
    this.user  = user;

    // Disconnect any existing socket
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io({
      auth: { token }
    });

    this._bindSocketEvents();
  }

  // ── Disconnect ─────────────────────────────────────────────
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ── Send a guess or chat message ───────────────────────────
  sendGuess(text) {
    if (!this.socket || !text.trim()) return;
    this.socket.emit('submitGuess', { guess: text.trim() });
  }

  sendChat(text) {
    if (!this.socket || !text.trim()) return;
    this.socket.emit('chatMessage', { text: text.trim() });
  }

  requestHint() {
    if (!this.socket) return;
    this.socket.emit('requestHint');
  }
  playAgain() {
    if (!this.socket) return;
    this.socket.emit('playAgain');
  }

  // ── Socket event bindings ─────────────────────────────────
  _bindSocketEvents() {
    const s = this.socket;

    s.on('connect', () => {
      this._dispatch('game:connected', {});
    });

    s.on('connect_error', (err) => {
      this._dispatch('game:error', { message: err.message });
    });

    s.on('disconnect', () => {
      this._dispatch('game:disconnected', {});
    });

    s.on('roundStart', (data) => {
      this._dispatch('game:roundStart', data);
    });

    s.on('pixelUpdate', (data) => {
      this._dispatch('game:pixelUpdate', data);
    });

    s.on('roundEnd', (data) => {
      this._dispatch('game:roundEnd', data);
    });

    s.on('chatMessage', (data) => {
      this._dispatch('game:chatMessage', data);
    });

    s.on('playerList', (data) => {
      this._dispatch('game:playerList', data);
    });

    s.on('playerJoined', (data) => {
      this._dispatch('game:playerJoined', data);
    });

    s.on('gameOver', (data) => {
      this._dispatch('game:gameOver', data);
    });
  }

  // ── Helper: dispatch custom DOM event ────────────────────
  _dispatch(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }
}
