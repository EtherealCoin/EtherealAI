function registerCommandRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  commandTemplates,
  getGitStatusSnapshot,
  createCheckpointRecord,
  createCommandRequestRecord,
  serializeCommandTemplate,
  getCommandTemplate,
  isCommandAllowed,
  executeCommandRequest
}) {
  app.get('/api/v1/git/status', requireAuth, async (req, res) => {
    try {
      res.json(await getGitStatusSnapshot());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/git/checkpoints', requireAuth, async (req, res) => {
    const { taskId = null, note = 'Manual checkpoint record' } = req.body;

    try {
      const checkpoint = await createCheckpointRecord(taskId, note);

      res.status(201).json({
        checkpoint
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/command-requests', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        'SELECT * FROM command_requests ORDER BY created_at DESC LIMIT 50'
      );

      res.json({ commandRequests: rows });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/command-requests', requireAuth, async (req, res) => {
    const { taskId = null, workspaceId = null, command } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command is required' });
    }

    try {
      res.status(201).json(await createCommandRequestRecord({
        taskId,
        workspaceId,
        command
      }));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/command-templates', requireAuth, (req, res) => {
    try {
      res.json({
        templates: commandTemplates.map(serializeCommandTemplate)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/command-templates/:id/run', requireAuth, async (req, res) => {
    const { taskId = null, workspaceId = null } = req.body || {};
    const template = getCommandTemplate(req.params.id);

    if (!template) {
      return res.status(404).json({ error: 'Command template not found' });
    }

    if (template.scope === 'workspace' && !workspaceId) {
      return res.status(400).json({ error: 'This command template requires a selected workspace' });
    }

    try {
      const result = await createCommandRequestRecord({
        taskId,
        workspaceId: template.scope === 'workspace' ? workspaceId : null,
        command: template.command
      });

      res.status(201).json({
        template: serializeCommandTemplate(template),
        ...result
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/command-requests/:id/run', requireAuth, async (req, res) => {
    try {
      const commandRequest = await dbGet(
        'SELECT * FROM command_requests WHERE id = ?',
        [req.params.id]
      );

      if (!commandRequest) {
        return res.status(404).json({ error: 'Command request not found' });
      }

      const review = isCommandAllowed(commandRequest.command);

      if (!review.allowed || commandRequest.status === 'blocked') {
        return res.status(400).json({ error: review.reason });
      }

      const commandRun = await executeCommandRequest(commandRequest);

      res.status(201).json({ commandRun });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerCommandRoutes
};
