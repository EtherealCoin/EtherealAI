function registerSystemConfigRoutes(app, {
  requireAuth,
  readModelConfig,
  readAutomationPolicy,
  sanitizeAutomationPolicyUpdate,
  writeAutomationPolicy
}) {
  app.get('/api/v1/model-roles', requireAuth, (req, res) => {
    try {
      res.json(readModelConfig());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/policy', requireAuth, (req, res) => {
    try {
      res.json(readAutomationPolicy());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/policy', requireAuth, (req, res) => {
    try {
      const policy = sanitizeAutomationPolicyUpdate(req.body);
      writeAutomationPolicy(policy);
      res.json(policy);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerSystemConfigRoutes
};
