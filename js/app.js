/**
 * app.js
 * Main client-side entry point.
 * 
 * Instantiates all classes and wires them together using
 * custom events and callbacks — no global variables.
 */

import { AuthController }    from '/js/controllers/AuthController.js';
import { ClientGameManager } from '/js/managers/ClientGameManager.js';
import { GameView }          from '/js/views/GameView.js';
import { ChatView }          from '/js/views/ChatView.js';

// ── Instantiate all modules ────────────────────────────────
const authController  = new AuthController();
const gameManager     = new ClientGameManager();
const gameView        = new GameView(gameManager);
const chatView        = new ChatView();

// ── Wire callbacks ─────────────────────────────────────────

// When user sends a guess, route through game manager
chatView.onSendGuess = (text) => gameManager.sendGuess(text);

// Hint button
chatView.onSendHint = () => gameManager.requestHint();

// ── Auth events ────────────────────────────────────────────

// On successful login/register, connect to Socket.IO
document.addEventListener('auth:success', (e) => {
  const { token, user } = e.detail;
  gameManager.connect(token, user);
});

// On logout, disconnect socket
document.addEventListener('auth:logout', () => {
  gameManager.disconnect();
});

// ── Score persistence ──────────────────────────────────────

// When a round ends, post score to REST API if the local player won
document.addEventListener('game:roundEnd', async (e) => {
  const { result } = e.detail;
  const user = authController.getUser();
  const token = authController.getToken();

  if (result && user && result.winner === user.username) {
    try {
      await fetch('/api/auth/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ points: result.points, won: true })
      });
    } catch {
      // Non-critical: score persistence failure
    }
  }
});
