function registerHealthRoutes(app, {
  requireAuth,
  readModelConfig,
  readAutomationPolicy,
  checkDatabase,
  checkOllama,
  checkLocalModelProviders,
  port,
  devServerStartedAt
}) {
  app.get('/api/v1/health', requireAuth, async (req, res) => {
    try {
      const modelConfig = readModelConfig();
      const [database, ollama, localModelProviders] = await Promise.all([
        checkDatabase(),
        checkOllama(modelConfig),
        checkLocalModelProviders
          ? checkLocalModelProviders(modelConfig)
          : Promise.resolve({ ok: true, providers: [] })
      ]);

      res.json({
        ok: database.ok && ollama.ok && localModelProviders.ok,
        checkedAt: new Date().toISOString(),
        server: {
          ok: true,
          port,
          pid: process.pid,
          startedAt: devServerStartedAt,
          uptimeSeconds: Math.round(process.uptime()),
          environment: process.env.NODE_ENV || 'development'
        },
        database,
        ollama,
        localModelProviders,
        modelProviders: modelConfig.providers || {
          [modelConfig.provider?.name || 'ollama']: modelConfig.provider
        },
        modelRoles: modelConfig.roles,
        automationPolicy: readAutomationPolicy()
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  });
}

module.exports = {
  registerHealthRoutes
};
