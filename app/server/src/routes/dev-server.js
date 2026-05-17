function registerDevServerRoutes(app, {
  requireAuth,
  getDevServerStatus,
  dbAll,
  parseDevServerLog,
  recordDevServerLog
}) {
  app.get('/api/v1/dev-server/status', requireAuth, async (req, res) => {
    try {
      res.json(await getDevServerStatus());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/dev-server/logs', requireAuth, async (req, res) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
      const rows = await dbAll(
        `SELECT *
         FROM dev_server_logs
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
        [limit]
      );

      res.json({ logs: rows.map(parseDevServerLog) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/dev-server/logs', requireAuth, async (req, res) => {
    try {
      await recordDevServerLog('info', 'Manual dashboard note', {
        note: String(req.body?.note || '').trim().slice(0, 1000) || 'Status checked from dashboard'
      });

      res.status(201).json(await getDevServerStatus());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerDevServerRoutes
};
