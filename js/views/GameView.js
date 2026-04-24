/**
 * GameView
 * Handles all canvas rendering:
 *   - Loads images from /images/
 *   - Applies pixelation using block-averaging technique
 *   - Updates pixel level smoothly
 *   - Shows/hides round overlay
 */
export class GameView {
  constructor(clientGameManager) {
    this.clientGameManager = clientGameManager;
    this.canvas       = document.getElementById('game-canvas');
    this.ctx          = this.canvas.getContext('2d');
    this.overlay      = document.getElementById('round-overlay');
    this.overlayIcon  = document.getElementById('overlay-icon');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayAns   = document.getElementById('overlay-answer');
    this.overlayLb    = document.getElementById('overlay-leaderboard');
    this.pixelBar     = document.getElementById('pixel-bar');
    this.roundLabel   = document.getElementById('round-label');
    this.playerCount  = document.getElementById('player-count');
    this.hintBtn      = document.getElementById('hint-btn');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.playAgainBtn = document.getElementById('playAgainBtn');

    this._currentImage  = null;
    this._currentPixelLevel = 32;
    this._maxPixel = 32;

    this._bindGameEvents();
  }

  // ── Listen to game events ──────────────────────────────────
  _bindGameEvents() {
    document.addEventListener('game:roundStart', (e) => this._onRoundStart(e.detail));
    document.addEventListener('game:pixelUpdate', (e) => this._onPixelUpdate(e.detail));
    document.addEventListener('game:roundEnd',    (e) => this._onRoundEnd(e.detail));
    document.addEventListener('game:playerList',  (e) => this._onPlayerList(e.detail));
    document.addEventListener('game:connected',   () => this._onConnected());
    document.addEventListener('game:disconnected',() => this._onDisconnected());
    document.addEventListener('game:gameOver', (e) => {
    this.gameOverScreen.classList.remove('hidden');
  });
  document.addEventListener('game:roundStart', (e) => {
    this.gameOverScreen.classList.add('hidden');
});
    if (this.playAgainBtn) {
    this.playAgainBtn.addEventListener('click', () => {
      // الآن this.clientGameManager ستكون معرّفة
      this.clientGameManager.playAgain(); 
      this.gameOverScreen.classList.add('hidden');
    });
  }
}

  // ── Connected ──────────────────────────────────────────────
  _onConnected() {
    this._showOverlay('🎮', 'Connected!', '');
    setTimeout(() => this._hideOverlay(), 1500);
  }

  _onDisconnected() {
    this._showOverlay('🔌', 'Disconnected', 'Reconnecting…');
  }

  // ── Round start ────────────────────────────────────────────
  _onRoundStart(data) {
    const { roundNumber, imageKey, pixelLevel } = data;
    this.roundLabel.textContent = `Round ${roundNumber}`;
    this._currentPixelLevel = pixelLevel;
    this._maxPixel = 32;

    this._showOverlay('⏳', `Round ${roundNumber}`, '');

    // Load the image
    const img = new Image();
    img.src = `/images/${imageKey}.jpg`;

    img.onload = () => {
      this._currentImage = img;
      // Resize canvas to image
      this.canvas.width  = img.naturalWidth  || 600;
      this.canvas.height = img.naturalHeight || 400;
      this._render(pixelLevel);
      setTimeout(() => this._hideOverlay(), 800);
    };

    img.onerror = () => {
      // Try .png fallback
      const imgPng = new Image();
      imgPng.src = `/images/${imageKey}.png`;
      imgPng.onload = () => {
        this._currentImage = imgPng;
        this.canvas.width  = imgPng.naturalWidth  || 600;
        this.canvas.height = imgPng.naturalHeight || 400;
        this._render(pixelLevel);
        setTimeout(() => this._hideOverlay(), 800);
      };
      imgPng.onerror = () => {
        // Draw placeholder
        this._drawPlaceholder(imageKey);
        setTimeout(() => this._hideOverlay(), 800);
      };
    };

    this._updatePixelBar(pixelLevel);
  }

  // ── Pixel update ───────────────────────────────────────────
  _onPixelUpdate(data) {
    const { pixelLevel } = data;
    this._currentPixelLevel = pixelLevel;
    if (this._currentImage) this._render(pixelLevel);
    this._updatePixelBar(pixelLevel);
  }

  // ── Round end ──────────────────────────────────────────────
  _onRoundEnd(data) {
    const { result, answer, imageKey, leaderboard } = data;

    // Fully reveal image
    if (this._currentImage) this._render(1);

    if (result) {
            this._showOverlay('🎉', `${result.winner} guessed it!`, answer.toUpperCase(), leaderboard);
    } else {
        this._showOverlay('⏰', 'Time\'s up!', answer.toUpperCase(), leaderboard);
    }

    // Pulse canvas border
    this.canvas.parentElement.classList.add('pulse-correct');
    setTimeout(() => this.canvas.parentElement.classList.remove('pulse-correct'), 600);
  }

  // ── Player list ────────────────────────────────────────────
  _onPlayerList(data) {
    this.playerCount.textContent = `👤 ${data.count} player${data.count !== 1 ? 's' : ''}`;
  }

  // ── Canvas render ──────────────────────────────────────────
  _render(blockSize) {
    if (!this._currentImage) return;

    const img = this._currentImage;
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (blockSize <= 1) {
      // Full resolution
      this.ctx.drawImage(img, 0, 0, w, h);
      return;
    }

    // Draw small version then scale up = pixelation effect
    const offW = Math.max(1, Math.ceil(w / blockSize));
    const offH = Math.max(1, Math.ceil(h / blockSize));

    // Use offscreen canvas
    const off = document.createElement('canvas');
    off.width = offW;
    off.height = offH;
    const offCtx = off.getContext('2d');

    // Disable smoothing for crisp pixels
    offCtx.imageSmoothingEnabled = false;
    offCtx.drawImage(img, 0, 0, offW, offH);

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(off, 0, 0, offW, offH, 0, 0, w, h);
  }

  // ── Placeholder when image missing ─────────────────────────
  _drawPlaceholder(key) {
    const w = 600, h = 400;
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.fillStyle = '#21262d';
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.fillStyle = '#7d8590';
    this.ctx.font = '20px Nunito';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Image: ${key}`, w / 2, h / 2 - 10);
    this.ctx.fillText('(add to /images/ directory)', w / 2, h / 2 + 20);
  }

  // ── Overlay helpers ────────────────────────────────────────
    _showOverlay(icon, title, answer, leaderboard = null) {
    this.overlayIcon.textContent  = icon;
    this.overlayTitle.textContent = title;
    this.overlayAns.textContent   = answer;
    this.overlay.classList.remove('hidden');
    if (leaderboard && leaderboard.length > 0) {
      let lbHtml = '<div class="overlay-lb-title">🏆 Top Scores</div>';
      leaderboard.forEach((p, i) => {
        let rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
        lbHtml += `<div class="overlay-lb-item"><span>${rankIcon} ${p.username}</span> <span>${p.score}</span></div>`;
      });
      this.overlayLb.innerHTML = lbHtml;
      this.overlayLb.classList.remove('hidden');
    } else if (this.overlayLb) {
      this.overlayLb.classList.add('hidden');
      this.overlayLb.innerHTML = '';
    }
  }

  _hideOverlay() {
    this.overlay.classList.add('hidden');
    if (this.overlayLb) {
      this.overlayLb.classList.add('hidden');
    }
  }

  // ── Pixel bar update ───────────────────────────────────────
  _updatePixelBar(level) {
    // Higher pixel level = less clear = low bar
    // Lower pixel level = more clear = high bar
    const pct = Math.round(((this._maxPixel - level) / this._maxPixel) * 100);
    this.pixelBar.style.width = `${pct}%`;
  }
}
