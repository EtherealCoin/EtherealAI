function registerCreatorRoutes(app, {
  fs,
  path,
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  parseTask,
  parseChecklistItem,
  parseFileProposal,
  createStarterPlan,
  buildCreatorPlanningPrompt,
  createChecklistForTask,
  createCheckpointRecord,
  applyFileProposalRecord,
  createCommandRequestRecord,
  ensureWorkspacesDir,
  slugify,
  workspacesDir,
  readAutomationPolicy,
  getScaffoldFilesForTask,
  getWorkspace,
  collectWorkspaceContext,
  resolveWorkspacePath,
  generateWithLocalModel,
  buildChecklistPrompt,
  buildFileProposalPrompt,
  buildMultiFileProposalPrompt,
  buildWorkspaceEditPrompt,
  extractGeneratedFileContent,
  parseJsonFromModelResponse,
  normalizeGeneratedFiles,
  normalizeWorkspaceEditPayload,
  prepareGeneratedProposalFiles,
  createFileProposalRecords,
  normalizeGeneratedChecklist,
  appendChecklistItems,
  saveAgentEvent
}) {
  app.get('/api/v1/creator/tasks', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(`
        SELECT *
        FROM creator_tasks
        ORDER BY created_at DESC
        LIMIT 50
      `);

      res.json({
        tasks: rows.map(parseTask)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/creator/tasks/:id', requireAuth, async (req, res) => {
    try {
      const task = parseTask(await dbGet(
        'SELECT * FROM creator_tasks WHERE id = ?',
        [req.params.id]
      ));

      if (!task) {
        return res.status(404).json({ error: 'Creator task not found' });
      }

      const events = await dbAll(
        'SELECT * FROM agent_events WHERE task_id = ? ORDER BY created_at ASC',
        [req.params.id]
      );
      const checklist = await dbAll(
        'SELECT * FROM task_checklist_items WHERE task_id = ? ORDER BY position ASC',
        [req.params.id]
      );
      const checkpoints = await dbAll(
        'SELECT * FROM checkpoint_records WHERE task_id = ? ORDER BY created_at DESC',
        [req.params.id]
      );
      const commandRequests = await dbAll(
        'SELECT * FROM command_requests WHERE task_id = ? ORDER BY created_at DESC',
        [req.params.id]
      );
      const commandRuns = await dbAll(
        `SELECT command_runs.*
         FROM command_runs
         INNER JOIN command_requests ON command_requests.id = command_runs.command_request_id
         WHERE command_requests.task_id = ?
         ORDER BY command_runs.created_at DESC`,
        [req.params.id]
      );
      const fileProposals = await dbAll(
        `SELECT *
         FROM file_write_proposals
         WHERE task_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [req.params.id]
      );

      res.json({
        task,
        checklist: checklist.map(parseChecklistItem),
        checkpoints: checkpoints.map(checkpoint => ({
          ...checkpoint,
          git_status: JSON.parse(checkpoint.git_status)
        })),
        commandRequests,
        commandRuns,
        fileProposals: fileProposals.map(parseFileProposal),
        events: events.map(event => ({
          ...event,
          metadata: event.metadata_json ? JSON.parse(event.metadata_json) : null,
          metadata_json: undefined
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/creator/tasks/:id/advance', requireAuth, async (req, res) => {
    try {
      const task = parseTask(await dbGet(
        'SELECT * FROM creator_tasks WHERE id = ?',
        [req.params.id]
      ));

      if (!task) {
        return res.status(404).json({ error: 'Creator task not found' });
      }

      const actions = [];
      const checklistRows = await dbAll(
        'SELECT * FROM task_checklist_items WHERE task_id = ? ORDER BY position ASC',
        [task.id]
      );

      if (!checklistRows.length) {
        const checklist = await createChecklistForTask(task);

        return res.status(201).json({
          action: 'checklist_created',
          actions: [{
            type: 'checklist_created',
            itemCount: checklist.length
          }],
          checklist
        });
      }

      const checkpointRows = await dbAll(
        'SELECT * FROM checkpoint_records WHERE task_id = ? ORDER BY created_at DESC',
        [task.id]
      );

      if (!checkpointRows.length) {
        const checkpoint = await createCheckpointRecord(
          task.id,
          `Auto checkpoint before advancing Creator task #${task.id}`
        );

        return res.status(201).json({
          action: 'checkpoint_created',
          actions: [{
            type: 'checkpoint_created',
            checkpointId: checkpoint.id
          }],
          checkpoint
        });
      }

      const approvedProposals = await dbAll(
        `SELECT *
         FROM file_write_proposals
         WHERE task_id = ? AND status = 'approved'
         ORDER BY created_at ASC
         LIMIT 25`,
        [task.id]
      );

      if (approvedProposals.length) {
        const appliedProposals = [];

        for (const proposal of approvedProposals) {
          appliedProposals.push(await applyFileProposalRecord(proposal));
        }

        actions.push({
          type: 'approved_proposals_applied',
          proposalIds: appliedProposals.map(proposal => proposal.id)
        });

        const commandResult = await createCommandRequestRecord({
          taskId: task.id,
          command: 'node --check app/server/src/server.js'
        });

        actions.push({
          type: 'verification_requested',
          commandRequestId: commandResult.commandRequest.id,
          commandRunId: commandResult.commandRun?.id || null,
          autoRan: commandResult.autoRan
        });

        return res.status(201).json({
          action: 'approved_proposals_applied',
          actions,
          appliedProposals,
          command: commandResult
        });
      }

      const pendingProposals = await dbAll(
        `SELECT *
         FROM file_write_proposals
         WHERE task_id = ? AND status IN ('pending', 'approved')
         ORDER BY created_at DESC
         LIMIT 25`,
        [task.id]
      );

      if (!pendingProposals.length) {
        return res.json({
          action: 'ready_for_file_proposal',
          actions: [{
            type: 'ready_for_file_proposal',
            message: 'No pending or approved file proposals exist yet. Generate a single-file or multi-file proposal next.'
          }]
        });
      }

      return res.json({
        action: 'waiting_for_review',
        actions: [{
          type: 'waiting_for_review',
          message: 'Review pending file proposals or apply approved proposals.'
        }]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/creator/tasks/:id/scaffold', requireAuth, async (req, res) => {
    try {
      const task = parseTask(await dbGet(
        'SELECT * FROM creator_tasks WHERE id = ?',
        [req.params.id]
      ));

      if (!task) {
        return res.status(404).json({ error: 'Creator task not found' });
      }

      ensureWorkspacesDir();
      const workspaceSlug = `task-${task.id}-${slugify(task.title) || 'project'}`.slice(0, 80);
      const workspacePath = path.join(workspacesDir, workspaceSlug);
      let workspace = await dbGet(
        'SELECT * FROM workspaces WHERE slug = ?',
        [workspaceSlug]
      );

      if (!workspace) {
        fs.mkdirSync(workspacePath, { recursive: true });
        const workspaceResult = await dbRun(
          `INSERT INTO workspaces (name, slug, path)
           VALUES (?, ?, ?)`,
          [
            `${task.title} Workspace`,
            workspaceSlug,
            workspacePath
          ]
        );
        workspace = await dbGet(
          'SELECT * FROM workspaces WHERE id = ?',
          [workspaceResult.lastID]
        );
      }

      const policy = readAutomationPolicy();
      const initialStatus = policy.localAutomation.autoApproveFileProposals ? 'approved' : 'pending';
      const scaffoldFiles = getScaffoldFilesForTask(task);
      const proposals = [];
      const skipped = [];

      for (const file of scaffoldFiles) {
        const { targetPath, relativePath: safePath } = resolveWorkspacePath(workspace, file.relativePath);
        const existingProposal = await dbGet(
          `SELECT *
           FROM file_write_proposals
           WHERE task_id = ? AND workspace_id = ? AND relative_path = ? AND status != 'rejected'
           ORDER BY id DESC
           LIMIT 1`,
          [task.id, workspace.id, safePath]
        );

        if (existingProposal) {
          skipped.push(parseFileProposal(existingProposal));
          continue;
        }

        let currentContent = null;

        if (fs.existsSync(targetPath)) {
          const stats = fs.statSync(targetPath);

          if (!stats.isFile()) {
            throw new Error(`Scaffold path points to an existing directory: ${safePath}`);
          }

          currentContent = fs.readFileSync(targetPath, 'utf8');
        }

        const result = await dbRun(
          `INSERT INTO file_write_proposals
           (task_id, workspace_id, relative_path, action, current_content, proposed_content, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            task.id,
            workspace.id,
            safePath,
            'upsert',
            currentContent,
            file.content,
            initialStatus
          ]
        );
        proposals.push(parseFileProposal(await dbGet(
          'SELECT * FROM file_write_proposals WHERE id = ?',
          [result.lastID]
        )));
      }

      await saveAgentEvent(task.id, 'project.scaffolded', 'Starter project scaffold proposals were created', {
        workspaceId: workspace.id,
        proposalIds: proposals.map(proposal => proposal.id),
        skippedProposalIds: skipped.map(proposal => proposal.id),
        initialStatus
      });

      await appendChecklistItems(
        task.id,
        [
          'Review starter project scaffold proposals.',
          'Apply approved scaffold proposals.',
          'Run a safe verification command after scaffold files are applied.'
        ],
        'checklist.scaffold_items.created',
        {
          workspaceId: workspace.id,
          proposalIds: proposals.map(proposal => proposal.id)
        }
      );

      res.status(201).json({
        workspace,
        proposals,
        skipped,
        initialStatus
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/creator/tasks/:id/file-proposals/generate', requireAuth, async (req, res) => {
    const {
      workspaceId,
      relativePath,
      instruction,
      modelRole = 'coder'
    } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace is required' });
    }

    if (!relativePath || typeof relativePath !== 'string') {
      return res.status(400).json({ error: 'Relative file path is required' });
    }

    if (!instruction || typeof instruction !== 'string') {
      return res.status(400).json({ error: 'File-specific instruction is required' });
    }

    if (instruction.length > 8000) {
      return res.status(400).json({ error: 'Instruction is too long for this first local-coder proposal flow' });
    }

    try {
      const task = parseTask(await dbGet(
        'SELECT * FROM creator_tasks WHERE id = ?',
        [req.params.id]
      ));

      if (!task) {
        return res.status(404).json({ error: 'Creator task not found' });
      }

      const workspace = await getWorkspace(workspaceId);
      const workspaceContext = collectWorkspaceContext(workspace);
      const { targetPath, relativePath: safePath } = resolveWorkspacePath(workspace, relativePath);
      let currentContent = null;

      if (fs.existsSync(targetPath)) {
        const stats = fs.statSync(targetPath);

        if (!stats.isFile()) {
          return res.status(400).json({ error: 'Proposal path points to an existing directory' });
        }

        if (stats.size > 1024 * 1024) {
          return res.status(400).json({ error: 'Existing file is too large for this first local-coder proposal flow' });
        }

        currentContent = fs.readFileSync(targetPath, 'utf8');
      }

      const modelResult = await generateWithLocalModel(
        modelRole,
        buildFileProposalPrompt({
          task,
          workspace,
          relativePath: safePath,
          instruction: instruction.trim(),
          currentContent,
          workspaceContext
        })
      );
      const proposedContent = extractGeneratedFileContent(modelResult.response);

      if (!proposedContent) {
        return res.status(500).json({ error: 'Local model returned an empty file proposal' });
      }

      if (proposedContent.length > 250000) {
        return res.status(400).json({ error: 'Generated file proposal is too large for this first proposal flow' });
      }

      const policy = readAutomationPolicy();
      const initialStatus = policy.localAutomation.autoApproveFileProposals ? 'approved' : 'pending';
      const result = await dbRun(
        `INSERT INTO file_write_proposals
         (task_id, workspace_id, relative_path, action, current_content, proposed_content, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          workspaceId,
          safePath,
          'upsert',
          currentContent,
          proposedContent,
          initialStatus
        ]
      );

      await saveAgentEvent(task.id, 'file.proposal.generated', 'Local coding model generated a file proposal', {
        proposalId: result.lastID,
        workspaceId,
        relativePath: safePath,
        initialStatus,
        modelRole: modelResult.role,
        model: modelResult.model,
        contextFileCount: workspaceContext.fileCount
      });

      const proposal = parseFileProposal(await dbGet(
        'SELECT * FROM file_write_proposals WHERE id = ?',
        [result.lastID]
      ));

      res.status(201).json({
        proposal,
        context: {
          fileCount: workspaceContext.fileCount,
          files: workspaceContext.files.map(file => ({
            path: file.path,
            size: file.size
          }))
        },
        model: {
          role: modelResult.role,
          name: modelResult.model,
          routing: modelResult.routing
        }
      });
    } catch (error) {
      res.status(500).json({
        error: error.name === 'AbortError' ? 'Local model request timed out' : error.message
      });
    }
  });

  app.post('/api/v1/creator/tasks/:id/file-proposals/generate-batch', requireAuth, async (req, res) => {
    const {
      workspaceId,
      instruction,
      modelRole = 'coder'
    } = req.body;
    const maxFiles = 6;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace is required' });
    }

    if (!instruction || typeof instruction !== 'string') {
      return res.status(400).json({ error: 'Multi-file instruction is required' });
    }

    if (instruction.length > 10000) {
      return res.status(400).json({ error: 'Instruction is too long for this first multi-file proposal flow' });
    }

    try {
      const task = parseTask(await dbGet(
        'SELECT * FROM creator_tasks WHERE id = ?',
        [req.params.id]
      ));

      if (!task) {
        return res.status(404).json({ error: 'Creator task not found' });
      }

      const workspace = await getWorkspace(workspaceId);
      const workspaceContext = collectWorkspaceContext(workspace);
      const modelResult = await generateWithLocalModel(
        modelRole,
        buildMultiFileProposalPrompt({
          task,
          workspace,
          instruction: instruction.trim(),
          maxFiles,
          workspaceContext
        })
      );
      const generatedFiles = normalizeGeneratedFiles(
        parseJsonFromModelResponse(modelResult.response),
        maxFiles
      );
      const policy = readAutomationPolicy();
      const initialStatus = policy.localAutomation.autoApproveFileProposals ? 'approved' : 'pending';
      const seenPaths = new Set();
      const validatedFiles = [];

      for (const generatedFile of generatedFiles) {
        const { targetPath, relativePath: safePath } = resolveWorkspacePath(workspace, generatedFile.relativePath);

        if (seenPaths.has(safePath)) {
          throw new Error(`Duplicate generated file path: ${safePath}`);
        }

        seenPaths.add(safePath);

        let currentContent = null;

        if (fs.existsSync(targetPath)) {
          const stats = fs.statSync(targetPath);

          if (!stats.isFile()) {
            throw new Error(`Generated path points to an existing directory: ${safePath}`);
          }

          if (stats.size > 1024 * 1024) {
            throw new Error(`Existing file is too large for this proposal flow: ${safePath}`);
          }

          currentContent = fs.readFileSync(targetPath, 'utf8');
        }

        validatedFiles.push({
          safePath,
          currentContent,
          proposedContent: generatedFile.content
        });
      }

      const proposalIds = [];

      for (const file of validatedFiles) {
        const result = await dbRun(
          `INSERT INTO file_write_proposals
           (task_id, workspace_id, relative_path, action, current_content, proposed_content, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            task.id,
            workspaceId,
            file.safePath,
            'upsert',
            file.currentContent,
            file.proposedContent,
            initialStatus
          ]
        );

        proposalIds.push(result.lastID);
      }

      await saveAgentEvent(task.id, 'file.proposal.batch_generated', 'Local coding model generated a multi-file proposal batch', {
        proposalIds,
        workspaceId,
        initialStatus,
        modelRole: modelResult.role,
        model: modelResult.model,
        contextFileCount: workspaceContext.fileCount
      });

      await appendChecklistItems(
        task.id,
        [
          ...validatedFiles.map((file, index) => `Review generated file proposal #${proposalIds[index]} for ${file.safePath}.`),
          'Apply the approved proposal batch after review.',
          'Run the Server Syntax Check command template after applying the batch.'
        ],
        'checklist.batch_items.created',
        {
          proposalIds,
          workspaceId
        }
      );

      const proposals = [];

      for (const proposalId of proposalIds.slice().reverse()) {
        proposals.push(parseFileProposal(await dbGet(
          'SELECT * FROM file_write_proposals WHERE id = ?',
          [proposalId]
        )));
      }

      res.status(201).json({
        proposals,
        context: {
          fileCount: workspaceContext.fileCount,
          files: workspaceContext.files.map(file => ({
            path: file.path,
            size: file.size
          }))
        },
        model: {
          role: modelResult.role,
          name: modelResult.model,
          routing: modelResult.routing
        }
      });
    } catch (error) {
      res.status(500).json({
        error: error.name === 'AbortError' ? 'Local model request timed out' : error.message
      });
    }
  });

  app.post('/api/v1/creator/tasks/:id/workspace-edits/generate', requireAuth, async (req, res) => {
    const {
      workspaceId,
      goal,
      modelRole = 'coder'
    } = req.body;
    const maxFiles = 8;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace is required' });
    }

    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ error: 'Workspace edit goal is required' });
    }

    if (goal.length > 12000) {
      return res.status(400).json({ error: 'Workspace edit goal is too long for this local edit flow' });
    }

    try {
      const task = parseTask(await dbGet(
        'SELECT * FROM creator_tasks WHERE id = ?',
        [req.params.id]
      ));

      if (!task) {
        return res.status(404).json({ error: 'Creator task not found' });
      }

      const workspace = await getWorkspace(workspaceId);
      const workspaceContext = collectWorkspaceContext(workspace, {
        maxFiles: 30,
        maxTotalBytes: 90000
      });
      const modelResult = await generateWithLocalModel(
        modelRole,
        buildWorkspaceEditPrompt({
          task,
          workspace,
          goal: goal.trim(),
          maxFiles,
          workspaceContext
        })
      );
      const editPayload = normalizeWorkspaceEditPayload(
        parseJsonFromModelResponse(modelResult.response),
        maxFiles
      );
      const validatedFiles = prepareGeneratedProposalFiles(workspace, editPayload.files);
      const policy = readAutomationPolicy();
      const initialStatus = policy.localAutomation.autoApproveFileProposals ? 'approved' : 'pending';
      const proposalIds = await createFileProposalRecords({
        taskId: task.id,
        workspaceId,
        files: validatedFiles,
        initialStatus
      });

      await saveAgentEvent(task.id, 'workspace.edit.generated', 'Local coding model generated a workspace edit proposal set', {
        proposalIds,
        workspaceId,
        initialStatus,
        modelRole: modelResult.role,
        model: modelResult.model,
        contextFileCount: workspaceContext.fileCount,
        summary: editPayload.summary,
        verification: editPayload.verification
      });

      const checklist = await appendChecklistItems(
        task.id,
        [
          `Review AI workspace edit summary: ${editPayload.summary}`,
          ...validatedFiles.map((file, index) => `Review workspace edit proposal #${proposalIds[index]} for ${file.safePath}.`),
          'Apply approved workspace edit proposals.',
          `Verify workspace edit: ${editPayload.verification}`
        ],
        'checklist.workspace_edit_items.created',
        {
          proposalIds,
          workspaceId
        }
      );

      const proposals = [];

      for (const proposalId of proposalIds.slice().reverse()) {
        proposals.push(parseFileProposal(await dbGet(
          'SELECT * FROM file_write_proposals WHERE id = ?',
          [proposalId]
        )));
      }

      res.status(201).json({
        editPlan: {
          summary: editPayload.summary,
          verification: editPayload.verification
        },
        proposals,
        checklist,
        context: {
          fileCount: workspaceContext.fileCount,
          files: workspaceContext.files.map(file => ({
            path: file.path,
            size: file.size
          }))
        },
        model: {
          role: modelResult.role,
          name: modelResult.model,
          routing: modelResult.routing
        }
      });
    } catch (error) {
      res.status(500).json({
        error: error.name === 'AbortError' ? 'Local model request timed out' : error.message
      });
    }
  });

  app.post('/api/v1/creator/tasks/:id/checklist', requireAuth, async (req, res) => {
    try {
      const task = parseTask(await dbGet(
        'SELECT * FROM creator_tasks WHERE id = ?',
        [req.params.id]
      ));

      if (!task) {
        return res.status(404).json({ error: 'Creator task not found' });
      }

      const checklist = await createChecklistForTask(task);
      res.status(201).json({ checklist });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/creator/tasks/:id/checklist/generate', requireAuth, async (req, res) => {
    const {
      instruction = 'Create a concrete implementation checklist for the current task.',
      modelRole = 'autocomplete'
    } = req.body || {};
    const maxItems = 10;

    try {
      const task = parseTask(await dbGet(
        'SELECT * FROM creator_tasks WHERE id = ?',
        [req.params.id]
      ));

      if (!task) {
        return res.status(404).json({ error: 'Creator task not found' });
      }

      const modelResult = await generateWithLocalModel(
        modelRole,
        buildChecklistPrompt({
          task,
          instruction,
          maxItems
        })
      );
      const labels = normalizeGeneratedChecklist(
        parseJsonFromModelResponse(modelResult.response),
        maxItems
      );
      const checklist = await appendChecklistItems(
        task.id,
        labels,
        'checklist.generated',
        {
          modelRole: modelResult.role,
          model: modelResult.model
        }
      );

      res.status(201).json({
        checklist,
        model: {
          role: modelResult.role,
          name: modelResult.model,
          routing: modelResult.routing
        }
      });
    } catch (error) {
      res.status(500).json({
        error: error.name === 'AbortError' ? 'Local model request timed out' : error.message
      });
    }
  });

  app.patch('/api/v1/creator/checklist/:id', requireAuth, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'done'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    try {
      const item = await dbGet(
        'SELECT * FROM task_checklist_items WHERE id = ?',
        [req.params.id]
      );

      if (!item) {
        return res.status(404).json({ error: 'Checklist item not found' });
      }

      await dbRun(
        `UPDATE task_checklist_items
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, req.params.id]
      );

      await saveAgentEvent(item.task_id, 'checklist.updated', 'Checklist item status changed', {
        checklistItemId: item.id,
        status
      });

      const updated = await dbGet(
        'SELECT * FROM task_checklist_items WHERE id = ?',
        [req.params.id]
      );

      res.json({ item: parseChecklistItem(updated) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/creator/tasks', requireAuth, async (req, res) => {
    const {
      title = 'Untitled creator task',
      category = 'general',
      request,
      modelRole = 'planner',
      useModel = false
    } = req.body;

    if (!request || typeof request !== 'string') {
      return res.status(400).json({ error: 'A plain-English request is required' });
    }

    if (request.length > 12000) {
      return res.status(400).json({ error: 'Request is too long for the first Creator Agent pass' });
    }

    try {
      let modelName = null;
      let plan = createStarterPlan({ title, category, request });

      if (useModel) {
        const modelResult = await generateWithLocalModel(
          modelRole,
          buildCreatorPlanningPrompt({ title, category, request })
        );

        modelName = modelResult.model;
        plan = {
          type: 'local-model-plan',
          title,
          category,
          markdown: modelResult.response,
          generatedBy: {
            role: modelResult.role,
            model: modelResult.model
          }
        };
      }

      const result = await dbRun(
        `INSERT INTO creator_tasks
         (title, category, request, status, plan_json, model_role, model_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          title.trim() || 'Untitled creator task',
          category,
          request.trim(),
          'planned',
          JSON.stringify(plan),
          modelRole,
          modelName
        ]
      );

      await saveAgentEvent(result.lastID, 'task.created', 'Creator task was created', {
        category,
        modelRole,
        useModel
      });

      const task = parseTask(await dbGet(
        'SELECT * FROM creator_tasks WHERE id = ?',
        [result.lastID]
      ));

      res.status(201).json({ task });
    } catch (error) {
      res.status(500).json({
        error: error.name === 'AbortError' ? 'Local planner request timed out' : error.message
      });
    }
  });
}

module.exports = {
  registerCreatorRoutes
};
