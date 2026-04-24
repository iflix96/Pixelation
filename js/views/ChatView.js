/**
 * ChatView
 * Renders chat messages (guesses, correct answers, system messages)
 * and updates the leaderboard UI.
 * 
 * Communicates with ClientGameManager via sendGuess/sendChat callbacks.
 */
export class ChatView {
  constructor() {
    this.chatMessages    = document.getElementById('chat-messages');
    this.chatInput       = document.getElementById('chat-input');
    this.sendBtn         = document.getElementById('send-btn');
    this.leaderboardList = document.getElementById('leaderboard-list');
    this.hintBtn         = document.getElementById('hint-btn');

    this.onSendGuess = null;  // callback set by app.js
    this.onSendHint  = null;  // callback set by app.js

    this._bindEvents();
    this._bindGameEvents();
  }

  // ── DOM event bindings ─────────────────────────────────────
  _bindEvents() {
    this.sendBtn.addEventListener('click', () => this._handleSend());

    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    });

    this.hintBtn.addEventListener('click', () => {
      if (this.onSendHint) this.onSendHint();
    });
  }

  // ── Game event bindings ────────────────────────────────────
  _bindGameEvents() {
    document.addEventListener('game:chatMessage', (e) => this._onMessage(e.detail));
    document.addEventListener('game:playerList',  (e) => this._onPlayerList(e.detail));
    document.addEventListener('game:roundStart',  () => this._onRoundStart());
    document.addEventListener('game:roundEnd',    (e) => this._onRoundEnd(e.detail));
  }

  // ── Send handler ───────────────────────────────────────────
  _handleSend() {
    const text = this.chatInput.value.trim();
    if (!text) return;

    if (this.onSendGuess) this.onSendGuess(text);
    this.chatInput.value = '';
    this.chatInput.focus();
  }

  // ── Render a chat message ──────────────────────────────────
  _onMessage(data) {
    const { type, username, text } = data;

    const el = document.createElement('div');
    el.className = `chat-msg ${type}`;

    if (type === 'system') {
      el.textContent = text;
    } else {
      const userSpan = document.createElement('span');
      userSpan.className = 'msg-user';
      userSpan.textContent = `${username}: `;

      const textSpan = document.createElement('span');
      textSpan.className = 'msg-text';

      if (type === 'correct') {
        textSpan.textContent = `✅ ${text} — CORRECT! 🎉`;
      } else {
        textSpan.textContent = text;
      }

      el.appendChild(userSpan);
      el.appendChild(textSpan);
    }

    this.chatMessages.appendChild(el);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // Bounce the input if wrong guess
    if (type === 'guess') {
      this.chatInput.classList.add('shake');
      setTimeout(() => this.chatInput.classList.remove('shake'), 400);
    }
  }

  // ── Update leaderboard ─────────────────────────────────────
  _onPlayerList(data) {
    const { players } = data;
    this.leaderboardList.innerHTML = '';

    if (!players || players.length === 0) {
      this.leaderboardList.innerHTML = '<li class="lb-empty">No players yet…</li>';
      return;
    }

    const rankSymbols = ['🥇', '🥈', '🥉'];

    players.forEach((p, i) => {
      const li = document.createElement('li');
      const cls = i === 0 ? 'lb-first' : i === 1 ? 'lb-second' : i === 2 ? 'lb-third' : '';
      if (cls) li.classList.add(cls);

      li.innerHTML = `
        <span class="lb-rank">${rankSymbols[i] || (i + 1)}</span>
        <span class="lb-name">${this._escape(p.username)}</span>
        <span class="lb-score">${p.score}</span>
      `;
      this.leaderboardList.appendChild(li);
    });
  }

  // ── Round start: add system message ───────────────────────
  _onRoundStart() {
    this._addSystemMessage('🎮 New round started! Guess the image!');
  }

  // ── Round end: add system message ─────────────────────────
  _onRoundEnd(data) {
    const { result, answer } = data;
    if (result) {
      this._addSystemMessage(`🏆 ${result.winner} won +${result.points} pts! Answer: ${answer}`);
    } else {
      this._addSystemMessage(`⏰ Time\'s up! The answer was: ${answer}`);
    }
    this._addSystemMessage('⏳ Next round in 5 seconds…');
  }

  // ── Helper: add system message ─────────────────────────────
  _addSystemMessage(text) {
    this._onMessage({ type: 'system', text });
  }

  // ── Helper: escape HTML ────────────────────────────────────
  _escape(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
}
