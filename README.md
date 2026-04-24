# 🔍 Pixelation
### Real-Time Multiplayer Image Guessing Game

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📖 Overview

**Pixelation** is a competitive, real-time multiplayer web game where players race to guess a progressively de-pixelated image before their opponents. The faster you guess, the more points you earn!

Built as a full-stack web application for **CS 346: Web Application Development** at Imam Mohammad Ibn Saud Islamic University.

---

## 🎮 How to Play

1. **Register / Login** — Create an account or log in securely
2. **View** — An image appears heavily pixelated; it clears up slowly over time
3. **Guess** — Type your guess in the chat. The server checks it instantly
4. **Win** — First correct guess earns points proportional to the pixelation level (higher pixelation = more points!)
5. **Hint** — Click 💡 Hint to decrease pixelation faster (but everyone benefits!)

---

## 🛠 Technologies

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6 Classes) |
| **Real-Time** | Socket.IO 4.x |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB Atlas + Mongoose |
| **Auth** | JWT (JSON Web Tokens) + bcryptjs |
| **Deployment** | Render + MongoDB Atlas |

---

## 🏗 Architecture

```
pixelation/
├── server.js              # Entry point: Express + Socket.IO + MongoDB
├── models/
│   └── User.js            # Mongoose user schema
├── routes/
│   └── auth.js            # REST API: /api/auth/*
├── js/
│   ├── managers/
│   │   ├── GameManager.js       # Server-side game state (ES6 class)
│   │   ├── ImagePool.js         # Image catalog
│   │   └── ClientGameManager.js # Client Socket.IO manager (ES6 class)
│   ├── controllers/
│   │   └── AuthController.js    # Auth UI logic (ES6 class)
│   ├── views/
│   │   ├── GameView.js          # Canvas rendering (ES6 class)
│   │   └── ChatView.js          # Chat & leaderboard UI (ES6 class)
│   └── app.js                   # Client entry point
├── styles/
│   └── main.css           # Pixel-aesthetic stylesheet
├── images/                # Game images (.jpg / .png)
└── index.html             # Main HTML
```

---

## ⚙️ Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/iflix96/Pixelation.git
cd pixelation

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 4. Add images to /images/
# Name them to match entries in js/managers/ImagePool.js
# e.g., apple.jpg, cat.jpg, pizza.jpg …

# 5. Start the server
npm start
# Or for development with auto-reload:
npm run dev
```

### Environment Variables (`.env`)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pixelation
JWT_SECRET=your_secret_key_here
PORT=3000
```

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT tokens** verified on every Socket.IO handshake (middleware)
- **Environment variables** for all secrets — never hardcoded
- **CORS** configured for secure cross-origin requests
- No sensitive data exposed in client-side code

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create new account |
| POST | `/api/auth/login` | No | Login, get JWT |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/auth/leaderboard` | JWT | Top 10 scores |
| POST | `/api/auth/score` | JWT | Update user score |

### Socket.IO Events

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `submitGuess` | `{ guess }` | Submit a guess |
| `requestHint` | — | Request a hint (decreases pixelation) |
| `chatMessage` | `{ text }` | Send a chat message |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `roundStart` | `{ roundNumber, imageKey, pixelLevel }` | New round begins |
| `pixelUpdate` | `{ pixelLevel }` | Pixelation level changed |
| `roundEnd` | `{ result, answer, leaderboard }` | Round finished |
| `chatMessage` | `{ type, username, text }` | New message |
| `playerList` | `{ players, count }` | Updated player list |

---

## 🗺 Flowchart

```
User Visit
    │
    ▼
Auth Screen
    │
    ├─ Register ──► POST /api/auth/register ──► Save user (hashed pw) ──► JWT
    └─ Login ─────► POST /api/auth/login ────► Verify credentials ──────► JWT
                                                                            │
                                                                            ▼
                                               Socket.IO Handshake (JWT verified)
                                                                            │
                                                                            ▼
                                                          Join Game Lobby (WebSocket)
                                                                            │
                                               ┌────────────────────────────┘
                                               ▼
                                         Round Starts
                                         Heavy Pixelation
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                              Auto-Decrease           Player Hints
                              every 3 secs          (requestHint)
                                    │                     │
                                    └──────────┬──────────┘
                                               │
                                         Player Guesses
                                         (submitGuess)
                                               │
                                    ┌──────────┴──────────┐
                                  Wrong                Correct!
                                    │                     │
                              Show in chat         Award Points
                                                   POST /api/auth/score
                                                   End Round → Next
```

---

## 🖼 Adding Images

1. Drop `.jpg` or `.png` files into the `/images/` directory
2. Add an entry to `js/managers/ImagePool.js`:
```js
{ key: 'yourimage', answer: 'youranswer', aliases: ['alias1', 'alias2'] }
```
The `key` must match the filename (without extension).

---
## 🚀 Live Demo
You can try the game live at: https://pixelation-081b.onrender.com/

## 🚀 Future Work

| Category | Planned Feature |
|----------|----------------|
| Stability | Full Arabic input support (RTL chat, Arabic answers) |
| Content | 50+ more images across categories |
| UX | Mobile-optimized responsive layout |
| Gameplay | Private rooms / lobby system |
| Social | Persistent global leaderboard |

---

## 👥 Team Members

| Name | ID |
|------|-----|
| Muhannad Altahhan | 443015819 |
| Abdullah alluhaydan | 44301776 |
| Bassam mohammedamin Almasalma | 444000326 |
---

## 📚 Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
