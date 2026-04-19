const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database.sqlite');

// Initialize SQLite database
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password_hash TEXT)");
});
const db = new sqlite3.Database(':memory:');

// Initialize SQLite database
db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, password_hash TEXT)");
});
const PORT = process.env.PORT || 3000;
const HTTPS = false; // Set to true if using HTTPS

app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Signup route
app.post('/api/v1/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [name, email, hashedPassword], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            req.session.userId = this.lastID;
            res.status(201).json({ message: 'User created successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login route
app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.userId = user.id;
        res.json({ message: 'Logged in successfully' });
    });
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../../frontend/dist/dashboard.html'));
});

// Logout route
app.post('/api/v1/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Routes
app.get('/', (req, res) => {
    res.status(200).json({ status: 'API is running' });
});

app.use('/api/v1', routes);

async function startServer() {
    try {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();
