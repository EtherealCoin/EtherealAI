import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes';

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS = false; // Set to true if using HTTPS

app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

const User = require('../db/models/user');

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Signup route
app.post('/api/v1/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password_hash: hashedPassword });
        req.session.userId = user.id;
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login route
app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.userId = user.id;
        res.json({ message: 'Logged in successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
        await sequelize.sync(); // Sync database models
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();
