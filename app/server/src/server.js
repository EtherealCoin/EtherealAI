const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// ✅ Correct path to client
const CLIENT_DIR = path.join(__dirname, '../../client');

// ✅ Database (keep simple for now)
const db = new sqlite3.Database('./database.sqlite');

// Initialize SQLite database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT
    )
  `);
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// ✅ Serve frontend correctly
app.use(express.static(CLIENT_DIR));

// =======================
// AUTH ROUTES
// =======================

// Signup
app.post('/api/v1/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, password_hash],
      function (err) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        req.session.userId = this.lastID;
        res.status(201).json({ message: 'User created successfully' });
      }
    );

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    res.json({ message: 'Logged in successfully' });
  });
});

// Logout
app.post('/api/v1/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// =======================
// PAGE ROUTES
// =======================

app.get('/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'signup.html'));
});

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  res.sendFile(path.join(CLIENT_DIR, 'dashboard.html'));
});

// =======================
// START SERVER
// =======================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
