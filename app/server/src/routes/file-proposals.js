function registerFileProposalRoutes(app, {
  fs,
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  parseFileProposal,
  getWorkspace,
  resolveWorkspacePath,
  readAutomationPolicy,
  applyFileProposalRecord,
  saveAgentEvent
}) {
  app.get('/api/v1/file-proposals', requireAuth, async (req, res) => {
    const { taskId = null } = req.query;

    try {
      const rows = taskId
        ? await dbAll(
          `SELECT * FROM file_write_proposals
           WHERE task_id = ?
           ORDER BY created_at DESC
           LIMIT 50`,
          [taskId]
        )
        : await dbAll(
          `SELECT * FROM file_write_proposals
           ORDER BY created_at DESC
           LIMIT 50`
        );

      res.json({ proposals: rows.map(parseFileProposal) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/file-proposals', requireAuth, async (req, res) => {
    const {
      taskId = null,
      workspaceId,
      relativePath,
      action = 'upsert',
      proposedContent
    } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace is required' });
    }

    if (!relativePath || typeof relativePath !== 'string') {
      return res.status(400).json({ error: 'Relative file path is required' });
    }

    if (!['upsert'].includes(action)) {
      return res.status(400).json({ error: 'Only upsert proposals are supported right now' });
    }

    if (typeof proposedContent !== 'string') {
      return res.status(400).json({ error: 'Proposed file content is required' });
    }

    if (proposedContent.length > 250000) {
      return res.status(400).json({ error: 'Proposed content is too large for this first proposal flow' });
    }

    try {
      const workspace = await getWorkspace(workspaceId);
      const { targetPath, relativePath: safePath } = resolveWorkspacePath(workspace, relativePath);
      const policy = readAutomationPolicy();
      const initialStatus = policy.localAutomation.autoApproveFileProposals ? 'approved' : 'pending';
      let currentContent = null;

      if (fs.existsSync(targetPath)) {
        const stats = fs.statSync(targetPath);

        if (!stats.isFile()) {
          return res.status(400).json({ error: 'Proposal path points to an existing directory' });
        }

        if (stats.size <= 1024 * 1024) {
          currentContent = fs.readFileSync(targetPath, 'utf8');
        }
      }

      const result = await dbRun(
        `INSERT INTO file_write_proposals
         (task_id, workspace_id, relative_path, action, current_content, proposed_content, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          taskId,
          workspaceId,
          safePath,
          action,
          currentContent,
          proposedContent,
          initialStatus
        ]
      );

      if (taskId) {
        await saveAgentEvent(taskId, 'file.proposal.created', 'File write proposal was created', {
          proposalId: result.lastID,
          workspaceId,
          relativePath: safePath,
          initialStatus
        });
      }

      const proposal = parseFileProposal(await dbGet(
        'SELECT * FROM file_write_proposals WHERE id = ?',
        [result.lastID]
      ));

      res.status(201).json({ proposal });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/file-proposals/:id', requireAuth, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    try {
      const proposal = await dbGet(
        'SELECT * FROM file_write_proposals WHERE id = ?',
        [req.params.id]
      );

      if (!proposal) {
        return res.status(404).json({ error: 'File proposal not found' });
      }

      if (proposal.status === 'applied') {
        return res.status(400).json({ error: 'Applied proposals cannot be changed' });
      }

      await dbRun(
        `UPDATE file_write_proposals
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, req.params.id]
      );

      if (proposal.task_id) {
        await saveAgentEvent(proposal.task_id, 'file.proposal.updated', 'File proposal status changed', {
          proposalId: proposal.id,
          status
        });
      }

      const updated = parseFileProposal(await dbGet(
        'SELECT * FROM file_write_proposals WHERE id = ?',
        [req.params.id]
      ));

      res.json({ proposal: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/file-proposals/:id/apply', requireAuth, async (req, res) => {
    try {
      const proposal = await dbGet(
        'SELECT * FROM file_write_proposals WHERE id = ?',
        [req.params.id]
      );

      if (!proposal) {
        return res.status(404).json({ error: 'File proposal not found' });
      }

      const updated = await applyFileProposalRecord(proposal);

      res.status(201).json({ proposal: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerFileProposalRoutes
};
