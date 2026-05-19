function registerMacSecurityRoutes(app, {
  requireAuth,
  buildMacSecurityAudit,
  buildMacSecurityGuide
}) {
  app.get('/api/v1/mac-security/audit', requireAuth, async (req, res) => {
    try {
      const audit = await buildMacSecurityAudit();

      res.json({
        audit,
        guide: buildMacSecurityGuide(),
        localOnly: true,
        readOnlyAudit: true,
        privilegedMutation: false,
        secretsInspected: false,
        liveExecutionEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/mac-security/guide', requireAuth, (req, res) => {
    res.json({
      guide: buildMacSecurityGuide(),
      localOnly: true,
      readOnly: true,
      privilegedMutation: false,
      secretsInspected: false
    });
  });
}

module.exports = {
  registerMacSecurityRoutes
};
