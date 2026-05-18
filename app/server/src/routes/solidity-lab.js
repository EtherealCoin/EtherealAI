function registerSolidityLabRoutes(app, {
  fs,
  path,
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  findSensitiveFields,
  parseSolidityContractSpec,
  parseFileProposal,
  toSolidityIdentifier,
  buildSolidityStarter,
  buildSolidityProjectFiles,
  reviewSoliditySource,
  buildTokenEcosystemCatalog,
  buildTokenEcosystemBlueprint,
  buildTokenEcosystemProjectBlueprint,
  buildTokenEcosystemWorkspaceFiles,
  normalizeTokenEcosystemProjectInput,
  parseTokenEcosystemProject,
  ensureWorkspacesDir,
  slugify,
  workspacesDir,
  readAutomationPolicy,
  resolveWorkspacePath,
  applyFileProposalRecord
}) {
  app.get('/api/v1/solidity-ecosystem/catalog', requireAuth, (req, res) => {
    try {
      res.json({
        catalog: buildTokenEcosystemCatalog()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  async function getTokenEcosystemProject(id) {
    return parseTokenEcosystemProject(await dbGet(
      'SELECT * FROM token_ecosystem_projects WHERE id = ?',
      [id]
    ));
  }

  async function createWorkspaceForTokenProject(project) {
    ensureWorkspacesDir();
    const workspaceSlug = `token-ecosystem-${project.id}-${slugify(project.name) || 'project'}`.slice(0, 80);
    const workspacePath = path.join(workspacesDir, workspaceSlug);
    let workspace = await dbGet('SELECT * FROM workspaces WHERE slug = ?', [workspaceSlug]);

    if (!workspace) {
      fs.mkdirSync(workspacePath, { recursive: true });
      const workspaceResult = await dbRun(
        `INSERT INTO workspaces (name, slug, path)
         VALUES (?, ?, ?)`,
        [`${project.name} Token Ecosystem Workspace`, workspaceSlug, workspacePath]
      );
      workspace = await dbGet('SELECT * FROM workspaces WHERE id = ?', [workspaceResult.lastID]);
    }

    const policy = readAutomationPolicy();
    const initialStatus = policy.localAutomation.autoApproveFileProposals ? 'approved' : 'pending';
    const shouldApply = initialStatus === 'approved';
    const files = buildTokenEcosystemWorkspaceFiles(project);
    const proposals = [];
    const applied = [];
    const skipped = [];

    for (const file of files) {
      const { targetPath, relativePath: safePath } = resolveWorkspacePath(workspace, file.relativePath);
      const existingProposal = await dbGet(
        `SELECT *
         FROM file_write_proposals
         WHERE workspace_id = ? AND relative_path = ? AND status != 'rejected'
         ORDER BY id DESC
         LIMIT 1`,
        [workspace.id, safePath]
      );

      if (existingProposal) {
        skipped.push(parseFileProposal(existingProposal));
        continue;
      }

      let currentContent = null;

      if (fs.existsSync(targetPath)) {
        const stats = fs.statSync(targetPath);

        if (!stats.isFile()) {
          throw new Error(`Token ecosystem workspace path points to an existing directory: ${safePath}`);
        }

        currentContent = fs.readFileSync(targetPath, 'utf8');
      }

      const result = await dbRun(
        `INSERT INTO file_write_proposals
         (task_id, workspace_id, relative_path, action, current_content, proposed_content, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          null,
          workspace.id,
          safePath,
          'upsert',
          currentContent,
          file.content,
          initialStatus
        ]
      );
      const proposal = parseFileProposal(await dbGet(
        'SELECT * FROM file_write_proposals WHERE id = ?',
        [result.lastID]
      ));
      proposals.push(proposal);

      if (shouldApply) {
        applied.push(await applyFileProposalRecord(proposal));
      }
    }

    await dbRun(
      `UPDATE token_ecosystem_projects
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [shouldApply ? 'workspace_ready' : 'workspace_proposed', project.id]
    );

    return {
      workspace,
      proposals,
      applied,
      skipped,
      initialStatus,
      status: shouldApply ? 'workspace_ready' : 'workspace_proposed'
    };
  }

  app.get('/api/v1/token-ecosystem-projects', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT *
         FROM token_ecosystem_projects
         ORDER BY updated_at DESC, id DESC
         LIMIT 100`
      );

      res.json({ projects: rows.map(parseTokenEcosystemProject) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/token-ecosystem-projects/:id', requireAuth, async (req, res) => {
    try {
      const project = await getTokenEcosystemProject(req.params.id);

      if (!project) {
        return res.status(404).json({ error: 'Token ecosystem project not found' });
      }

      res.json({ project });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/token-ecosystem-projects', requireAuth, async (req, res) => {
    try {
      const input = normalizeTokenEcosystemProjectInput(req.body || {});
      const blueprint = buildTokenEcosystemProjectBlueprint({
        ...input,
        id: null
      });
      const result = await dbRun(
        `INSERT INTO token_ecosystem_projects
           (user_id, contract_spec_id, name, target_chain, contract_type, feature_selections_json,
            nft_utility_notes, ecosystem_notes, status, blueprint_json, local_only, external_actions_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
        [
          req.session.userId || null,
          input.contractSpecId,
          input.name,
          input.targetChain,
          input.contractType,
          JSON.stringify(input.featureSelections),
          input.nftUtilityNotes,
          input.ecosystemNotes,
          input.status,
          JSON.stringify(blueprint)
        ]
      );
      let project = await getTokenEcosystemProject(result.lastID);
      const updatedBlueprint = buildTokenEcosystemProjectBlueprint({
        ...project,
        contractSpecId: project.contract_spec_id,
        contractType: project.contract_type,
        targetChain: project.target_chain,
        nftUtilityNotes: project.nft_utility_notes,
        ecosystemNotes: project.ecosystem_notes
      });
      await dbRun(
        `UPDATE token_ecosystem_projects
         SET blueprint_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [JSON.stringify(updatedBlueprint), project.id]
      );
      project = await getTokenEcosystemProject(project.id);

      res.status(201).json({ project });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/v1/token-ecosystem-projects/:id/workspace', requireAuth, async (req, res) => {
    try {
      const project = await getTokenEcosystemProject(req.params.id);

      if (!project) {
        return res.status(404).json({ error: 'Token ecosystem project not found' });
      }

      const result = await createWorkspaceForTokenProject(project);
      const updatedProject = await getTokenEcosystemProject(project.id);

      res.status(201).json({
        project: updatedProject,
        ...result,
        localOnly: true,
        externalActionsEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/solidity-contracts', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT *
         FROM solidity_contract_specs
         ORDER BY created_at DESC
         LIMIT 100`
      );

      res.json({ contracts: rows.map(parseSolidityContractSpec) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/solidity-contracts/:id', requireAuth, async (req, res) => {
    try {
      const spec = parseSolidityContractSpec(await dbGet(
        'SELECT * FROM solidity_contract_specs WHERE id = ?',
        [req.params.id]
      ));

      if (!spec) {
        return res.status(404).json({ error: 'Contract spec not found' });
      }

      res.json({ contract: spec });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/solidity-contracts', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Contract specs cannot store private keys, deploy keys, or wallet secrets.',
          sensitiveFields
        });
      }

      const name = String(req.body?.name || '').trim().slice(0, 120);
      const contractType = String(req.body?.contractType || 'erc20').trim().toLowerCase();
      const network = String(req.body?.network || 'local').trim().slice(0, 80);
      const solidityVersion = String(req.body?.solidityVersion || '0.8.24').trim().slice(0, 20);
      const features = String(req.body?.features || '').trim().slice(0, 4000);
      const riskNotes = String(req.body?.riskNotes || '').trim().slice(0, 4000);
      const allowedTypes = new Set(['erc20', 'erc721', 'generic']);

      if (!name) {
        return res.status(400).json({ error: 'Contract name is required' });
      }

      if (!allowedTypes.has(contractType)) {
        return res.status(400).json({ error: 'Contract type must be erc20, erc721, or generic' });
      }

      const result = await dbRun(
        `INSERT INTO solidity_contract_specs
         (name, contract_type, network, solidity_version, features, risk_notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          contractType,
          network || 'local',
          solidityVersion || '0.8.24',
          features,
          riskNotes,
          'draft'
        ]
      );
      const row = await dbGet('SELECT * FROM solidity_contract_specs WHERE id = ?', [result.lastID]);

      res.status(201).json({ contract: parseSolidityContractSpec(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/solidity-contracts/:id/starter', requireAuth, async (req, res) => {
    try {
      const spec = parseSolidityContractSpec(await dbGet(
        'SELECT * FROM solidity_contract_specs WHERE id = ?',
        [req.params.id]
      ));

      if (!spec) {
        return res.status(404).json({ error: 'Contract spec not found' });
      }

      res.json({
        contract: spec,
        fileName: `${toSolidityIdentifier(spec.name)}.sol`,
        source: buildSolidityStarter(spec),
        review: reviewSoliditySource(spec, buildSolidityStarter(spec))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/solidity-contracts/:id/review', requireAuth, async (req, res) => {
    try {
      const spec = parseSolidityContractSpec(await dbGet(
        'SELECT * FROM solidity_contract_specs WHERE id = ?',
        [req.params.id]
      ));

      if (!spec) {
        return res.status(404).json({ error: 'Contract spec not found' });
      }

      const source = buildSolidityStarter(spec);

      res.json({
        contract: spec,
        review: reviewSoliditySource(spec, source)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/solidity-contracts/:id/ecosystem-blueprint', requireAuth, async (req, res) => {
    try {
      const spec = parseSolidityContractSpec(await dbGet(
        'SELECT * FROM solidity_contract_specs WHERE id = ?',
        [req.params.id]
      ));

      if (!spec) {
        return res.status(404).json({ error: 'Contract spec not found' });
      }

      res.json({
        contract: spec,
        blueprint: buildTokenEcosystemBlueprint(spec)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/solidity-contracts/:id/scaffold', requireAuth, async (req, res) => {
    try {
      const spec = parseSolidityContractSpec(await dbGet(
        'SELECT * FROM solidity_contract_specs WHERE id = ?',
        [req.params.id]
      ));

      if (!spec) {
        return res.status(404).json({ error: 'Contract spec not found' });
      }

      ensureWorkspacesDir();
      const workspaceSlug = `solidity-${spec.id}-${slugify(spec.name) || 'contract'}`.slice(0, 80);
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
            `${spec.name} Solidity Workspace`,
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
      const shouldApply = req.body?.apply !== false && initialStatus === 'approved';
      const scaffoldFiles = buildSolidityProjectFiles(spec);
      const proposals = [];
      const applied = [];
      const skipped = [];

      for (const file of scaffoldFiles) {
        const { targetPath, relativePath: safePath } = resolveWorkspacePath(workspace, file.relativePath);
        const existingProposal = await dbGet(
          `SELECT *
           FROM file_write_proposals
           WHERE workspace_id = ? AND relative_path = ? AND status != 'rejected'
           ORDER BY id DESC
           LIMIT 1`,
          [workspace.id, safePath]
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
            null,
            workspace.id,
            safePath,
            'upsert',
            currentContent,
            file.content,
            initialStatus
          ]
        );
        const proposal = parseFileProposal(await dbGet(
          'SELECT * FROM file_write_proposals WHERE id = ?',
          [result.lastID]
        ));
        proposals.push(proposal);

        if (shouldApply) {
          applied.push(await applyFileProposalRecord(proposal));
        }
      }

      await dbRun(
        `UPDATE solidity_contract_specs
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [shouldApply ? 'workspace_ready' : 'scaffold_ready', spec.id]
      );

      res.status(201).json({
        workspace,
        proposals,
        applied,
        skipped,
        initialStatus,
        status: shouldApply ? 'workspace_ready' : 'scaffold_ready'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerSolidityLabRoutes
};
