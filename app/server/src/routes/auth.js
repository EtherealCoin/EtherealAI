const bcrypt = require('bcrypt');

function normalizeAuthIdentifier(value) {
  return String(value || '').trim();
}

function normalizeAuthPassword(value) {
  return typeof value === 'string' ? value : '';
}

function registerAuthRoutes(app, { db }) {
  app.post('/api/v1/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const normalizedName = normalizeAuthIdentifier(name);
    const normalizedEmail = normalizeAuthIdentifier(email);
    const normalizedPassword = normalizeAuthPassword(password);

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ error: 'Name, username, and password are required' });
    }

    try {
      const passwordHash = await bcrypt.hash(normalizedPassword, 10);

      db.run(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [normalizedName, normalizedEmail, passwordHash],
        function insertUser(err) {
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

  app.post('/api/v1/auth/login', (req, res) => {
    const email = normalizeAuthIdentifier(req.body?.email);
    const password = normalizeAuthPassword(req.body?.password);

    if (!email || !password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    db.get('SELECT * FROM users WHERE lower(email) = lower(?)', [email], async (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      let valid = false;
      try {
        valid = await bcrypt.compare(password, user.password_hash);
      } catch (error) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      res.json({ message: 'Logged in successfully' });
    });
  });

  app.post('/api/v1/auth/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  });
}

module.exports = {
  normalizeAuthIdentifier,
  normalizeAuthPassword,
  registerAuthRoutes
};
