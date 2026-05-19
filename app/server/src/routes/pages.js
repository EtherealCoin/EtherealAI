const path = require('path');

function requirePageAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  next();
}

function registerPageRoutes(app, { clientDir }) {
  app.get('/', (req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });

  app.get('/login', (req, res) => {
    res.sendFile(path.join(clientDir, 'login.html'));
  });

  app.get('/signup', (req, res) => {
    res.sendFile(path.join(clientDir, 'signup.html'));
  });

  app.get('/dashboard', requirePageAuth, (req, res) => {
    res.sendFile(path.join(clientDir, 'dashboard.html'));
  });

  app.get('/operator-control', requirePageAuth, (req, res) => {
    res.sendFile(path.join(clientDir, 'operator-control.html'));
  });

  app.get('/security-lockdown', requirePageAuth, (req, res) => {
    res.sendFile(path.join(clientDir, 'security-lockdown.html'));
  });

  app.get('/owner-proof-packet', requirePageAuth, (req, res) => {
    res.sendFile(path.join(clientDir, 'owner-proof-packet.html'));
  });

  app.get('/mvp-test-pass', requirePageAuth, (req, res) => {
    res.sendFile(path.join(clientDir, 'mvp-test-pass.html'));
  });

  app.get('/server-route-inventory', requirePageAuth, (req, res) => {
    res.sendFile(path.join(clientDir, 'server-route-inventory.html'));
  });

  app.get('/creator', requirePageAuth, (req, res) => {
    res.sendFile(path.join(clientDir, 'creator.html'));
  });

  app.get('/strategy-lab', requirePageAuth, (req, res) => {
    res.sendFile(path.join(clientDir, 'strategy-lab.html'));
  });

  app.get('/solidity-lab', requirePageAuth, (req, res) => {
    res.sendFile(path.join(clientDir, 'solidity-lab.html'));
  });

  app.get('/social-ops', requirePageAuth, (req, res) => {
    res.sendFile(path.join(clientDir, 'social-ops.html'));
  });
}

module.exports = {
  registerPageRoutes
};
