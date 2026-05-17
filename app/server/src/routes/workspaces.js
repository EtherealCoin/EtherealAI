function registerWorkspaceRoutes(app, {
  fs,
  path,
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  slugify,
  ensureWorkspacesDir,
  workspacesDir,
  getWorkspace,
  listWorkspaceEntries,
  readWorkspaceFile
}) {
  app.get('/api/v1/workspaces', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        'SELECT * FROM workspaces ORDER BY created_at DESC'
      );

      res.json({ workspaces: rows });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/workspaces', requireAuth, async (req, res) => {
    const { name, slug } = req.body;
    const safeSlug = slugify(slug || name);

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    if (!safeSlug) {
      return res.status(400).json({ error: 'Workspace slug could not be created' });
    }

    try {
      ensureWorkspacesDir();
      const workspacePath = path.join(workspacesDir, safeSlug);
      const relativePath = path.relative(workspacesDir, workspacePath);

      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return res.status(400).json({ error: 'Workspace path is outside the approved workspace folder' });
      }

      fs.mkdirSync(workspacePath, { recursive: true });

      const result = await dbRun(
        `INSERT INTO workspaces (name, slug, path)
         VALUES (?, ?, ?)`,
        [name.trim(), safeSlug, workspacePath]
      );

      const workspace = await dbGet(
        'SELECT * FROM workspaces WHERE id = ?',
        [result.lastID]
      );

      res.status(201).json({ workspace });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/workspaces/:id/files', requireAuth, async (req, res) => {
    try {
      const workspace = await getWorkspace(req.params.id);
      res.json(listWorkspaceEntries(workspace, req.query.path || ''));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/v1/workspaces/:id/files/content', requireAuth, async (req, res) => {
    try {
      const workspace = await getWorkspace(req.params.id);
      res.json(readWorkspaceFile(workspace, req.query.path || ''));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
}

module.exports = {
  registerWorkspaceRoutes
};
