function registerLocalModelRoutes(app, {
  requireAuth,
  generateWithLocalModel,
  benchmarkLocalModel,
  getMlxLifecycleStatus,
  startMlxLifecycle,
  stopMlxLifecycle,
  chooseModelRoleForPrompt,
  readModelConfig
}) {
  function normalizeOptionalBoolean(value) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      if (normalized === 'true') {
        return true;
      }

      if (normalized === 'false') {
        return false;
      }
    }

    return undefined;
  }

  app.post('/api/v1/local-model/generate', requireAuth, async (req, res) => {
    const { role, prompt, think } = req.body;
    const requestedRole = role || 'auto';

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A prompt is required' });
    }

    if (prompt.length > 8000) {
      return res.status(400).json({ error: 'Prompt is too long for this test panel' });
    }

    try {
      const result = await generateWithLocalModel(requestedRole, prompt, {
        think: normalizeOptionalBoolean(think)
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: error.name === 'AbortError' ? 'Local model request timed out' : error.message
      });
    }
  });

  app.post('/api/v1/local-model/route', requireAuth, (req, res) => {
    const { role = 'auto', prompt } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A prompt is required' });
    }

    try {
      res.json(chooseModelRoleForPrompt(prompt, role, readModelConfig()));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/v1/local-model/benchmark', requireAuth, async (req, res) => {
    const {
      role = 'auto',
      prompt,
      provider,
      model,
      maxTokens,
      timeoutMs,
      think
    } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A prompt is required' });
    }

    if (prompt.length > 8000) {
      return res.status(400).json({ error: 'Prompt is too long for this benchmark panel' });
    }

    const cleanProvider = provider && provider !== 'role-default'
      ? String(provider).trim()
      : undefined;
    const cleanModel = model && String(model).trim()
      ? String(model).trim()
      : undefined;

    const result = await benchmarkLocalModel({
      role,
      prompt,
      provider: cleanProvider,
      model: cleanModel,
      maxTokens,
      timeoutMs,
      think: normalizeOptionalBoolean(think)
    });

    res.json(result);
  });

  app.get('/api/v1/local-model/mlx-lifecycle', requireAuth, async (req, res) => {
    if (!getMlxLifecycleStatus) {
      return res.status(501).json({ error: 'MLX lifecycle runtime is not configured' });
    }

    try {
      res.json(await getMlxLifecycleStatus());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/local-model/mlx-lifecycle/start', requireAuth, async (req, res) => {
    if (!startMlxLifecycle) {
      return res.status(501).json({ error: 'MLX lifecycle runtime is not configured' });
    }

    try {
      res.json(await startMlxLifecycle({
        unloadOllama: normalizeOptionalBoolean(req.body?.unloadOllama) !== false
      }));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/local-model/mlx-lifecycle/stop', requireAuth, async (req, res) => {
    if (!stopMlxLifecycle) {
      return res.status(501).json({ error: 'MLX lifecycle runtime is not configured' });
    }

    try {
      res.json(await stopMlxLifecycle());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerLocalModelRoutes
};
