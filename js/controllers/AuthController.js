/**
 * AuthController
 * Manages the authentication UI: tab switching, form submission,
 * token storage, and transition to the game screen.
 * 
 * Communicates outcomes via a custom 'auth:success' event.
 */
export class AuthController {
  constructor() {
    this.token = null;
    this.user = null;

    this._bindElements();
    this._bindEvents();
    this._tryAutoLogin();
  }

  // ── DOM References ─────────────────────────────────────────
  _bindElements() {
    this.authScreen   = document.getElementById('auth-screen');
    this.gameScreen   = document.getElementById('game-screen');
    this.tabs         = document.querySelectorAll('.tab');
    this.loginForm    = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.loginBtn     = document.getElementById('login-btn');
    this.registerBtn  = document.getElementById('register-btn');
    this.loginError   = document.getElementById('login-error');
    this.regError     = document.getElementById('reg-error');
    this.logoutBtn    = document.getElementById('logout-btn');
  }

  // ── Event Bindings ─────────────────────────────────────────
  _bindEvents() {
    // Tab switching
    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => this._switchTab(tab.dataset.tab));
    });

    // Login
    this.loginBtn.addEventListener('click', () => this._handleLogin());
    document.getElementById('login-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleLogin();
    });

    // Register
    this.registerBtn.addEventListener('click', () => this._handleRegister());
    document.getElementById('reg-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleRegister();
    });

    // Logout
    this.logoutBtn.addEventListener('click', () => this._handleLogout());
  }

  // ── Tab Switching ──────────────────────────────────────────
  _switchTab(name) {
    this.tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    this.loginForm.classList.toggle('active', name === 'login');
    this.registerForm.classList.toggle('active', name === 'register');
    this.loginError.textContent = '';
    this.regError.textContent = '';
  }

  // ── Login ──────────────────────────────────────────────────
  async _handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    this.loginError.textContent = '';

    if (!username || !password) {
      this.loginError.textContent = 'Please fill in all fields.';
      return;
    }

    this.loginBtn.disabled = true;
    this.loginBtn.textContent = 'Logging in…';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        this.loginError.textContent = data.message || 'Login failed.';
        return;
      }

      this._saveSession(data.token, data.user);
      this._transitionToGame();
    } catch {
      this.loginError.textContent = 'Network error. Please try again.';
    } finally {
      this.loginBtn.disabled = false;
      this.loginBtn.textContent = 'Play Now 🎮';
    }
  }

  // ── Register ───────────────────────────────────────────────
  async _handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    this.regError.textContent = '';

    if (!username || !password) {
      this.regError.textContent = 'Please fill in all fields.';
      return;
    }

    if (username.length < 3) {
      this.regError.textContent = 'Username must be at least 3 characters.';
      return;
    }

    if (password.length < 6) {
      this.regError.textContent = 'Password must be at least 6 characters.';
      return;
    }

    this.registerBtn.disabled = true;
    this.registerBtn.textContent = 'Creating account…';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        this.regError.textContent = data.message || 'Registration failed.';
        return;
      }

      this._saveSession(data.token, data.user);
      this._transitionToGame();
    } catch {
      this.regError.textContent = 'Network error. Please try again.';
    } finally {
      this.registerBtn.disabled = false;
      this.registerBtn.textContent = 'Create Account 🚀';
    }
  }

  // ── Logout ─────────────────────────────────────────────────
  _handleLogout() {
    localStorage.removeItem('px_token');
    localStorage.removeItem('px_user');
    this.token = null;
    this.user = null;

    // Dispatch logout event for other modules
    document.dispatchEvent(new CustomEvent('auth:logout'));

    this.gameScreen.classList.remove('active');
    this.gameScreen.style.display = 'none';
    this.gameScreen.style.opacity = '0';

    this.authScreen.classList.add('active');
    this.authScreen.style.display = 'flex';
    requestAnimationFrame(() => { this.authScreen.style.opacity = '1'; });
  }

  // ── Auto-login from stored token ──────────────────────────
  _tryAutoLogin() {
    const token = localStorage.getItem('px_token');
    const user  = JSON.parse(localStorage.getItem('px_user') || 'null');

    if (token && user) {
      this.token = token;
      this.user  = user;
      this._transitionToGame();
    }
  }

  // ── Session helpers ────────────────────────────────────────
  _saveSession(token, user) {
    this.token = token;
    this.user  = user;
    localStorage.setItem('px_token', token);
    localStorage.setItem('px_user', JSON.stringify(user));
  }

  // ── Screen transition ──────────────────────────────────────
  _transitionToGame() {
    this.authScreen.classList.remove('active');
    this.authScreen.style.opacity = '0';
    setTimeout(() => { this.authScreen.style.display = 'none'; }, 400);

    this.gameScreen.style.display = 'flex';
    requestAnimationFrame(() => {
      this.gameScreen.style.opacity = '1';
      this.gameScreen.classList.add('active');
    });

    // Update header username
    document.getElementById('header-username').textContent = `👤 ${this.user.username}`;

    // Dispatch success event so game can connect
    document.dispatchEvent(new CustomEvent('auth:success', {
      detail: { token: this.token, user: this.user }
    }));
  }

  getToken() { return this.token; }
  getUser()  { return this.user; }
}
