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
  buildTokenWebsiteDeployPackageFiles,
  buildTokenLaunchPipelineState,
  buildTokenLaunchPackageReview,
  buildCloudflareWebsitePlan,
  normalizeTokenEcosystemProjectInput,
  normalizeCompanyDnsTargetInput,
  parseTokenEcosystemProject,
  parseExchangeConnector,
  parseCompanyDnsTarget,
  readCompanyIdentity,
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

  function safeJsonParse(value, fallback = {}) {
    try {
      return JSON.parse(value || JSON.stringify(fallback));
    } catch (error) {
      return fallback;
    }
  }

  function parseLocalSocialPost(row = {}) {
    return {
      id: row.id,
      platform: row.platform,
      account_label: row.account_label,
      content: row.content,
      status: row.status,
      scheduled_for: row.scheduled_for,
      metadata: safeJsonParse(row.metadata_json, {}),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  function parseLocalOrderIntent(row = {}) {
    return {
      id: row.id,
      market_symbol: row.market_symbol,
      side: row.side,
      order_type: row.order_type,
      quantity: row.quantity,
      limit_price: row.limit_price,
      status: row.status,
      reason: row.reason,
      payload: safeJsonParse(row.payload_json, {}),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async function getTokenEcosystemProject(id) {
    return parseTokenEcosystemProject(await dbGet(
      'SELECT * FROM token_ecosystem_projects WHERE id = ?',
      [id]
    ));
  }

  function normalizeExchangeId(value = '') {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function parseConnectorForLaunch(row = {}) {
    if (!row) {
      return null;
    }

    if (typeof parseExchangeConnector === 'function') {
      return parseExchangeConnector(row);
    }

    return {
      ...row,
      settings: safeJsonParse(row.settings_json, {})
    };
  }

  function findConnectorByExchange(connectors = [], exchangeName) {
    const exchangeId = normalizeExchangeId(exchangeName);

    return connectors.find(connector => (
      normalizeExchangeId(connector?.settings?.registryId || connector?.exchange_name) === exchangeId
    )) || null;
  }

  async function buildLaunchProjectApiReadiness() {
    const [connectorRows, walletCountRow, krakenEndpointCountRow] = await Promise.all([
      dbAll(
        `SELECT *
         FROM exchange_connectors
         ORDER BY updated_at DESC, id DESC
         LIMIT 500`
      ).catch(() => []),
      dbGet(
        `SELECT COUNT(*) AS count
         FROM owner_wallets`,
        []
      ).catch(() => ({ count: 0 })),
      dbGet(
        `SELECT COUNT(*) AS count
         FROM production_order_executions
         WHERE exchange_name = 'kraken'
           AND production_order_endpoint_called = 1`,
        []
      ).catch(() => ({ count: 0 }))
    ]);
    const connectors = connectorRows.map(parseConnectorForLaunch).filter(Boolean);
    const kraken = findConnectorByExchange(connectors, 'kraken');
    const coinbase = findConnectorByExchange(connectors, 'coinbase');
    const krakenConnection = kraken?.settings?.productionConnection || {};
    const coinbaseConnection = coinbase?.settings?.readOnlyConnection || {};
    const krakenEndpointCallCount = Number(krakenEndpointCountRow?.count || 0);
    const krakenHasReference = Boolean(krakenConnection.referenceName);
    const krakenDryRunReady = Boolean(
      krakenConnection.phase6EFinalStatus?.readyForTinyLiveTest
      || krakenConnection.phase6EPreflight?.technicalReady
    );
    const krakenStatus = krakenEndpointCallCount > 0
      ? 'blocked'
      : krakenHasReference && krakenDryRunReady
        ? 'connected'
        : krakenHasReference
          ? 'draft'
          : 'needs key';
    const coinbaseStatus = String(coinbaseConnection.connectionStatus || coinbase?.status || '').toLowerCase().includes('connected')
      ? 'connected'
      : coinbaseConnection.referenceName
        ? 'draft'
        : 'needs key';

    return {
      kraken: {
        label: 'Kraken',
        status: krakenStatus,
        detail: krakenStatus === 'connected'
          ? 'Kraken auth/dry-run readiness is available. Token launch drafting still does not place orders.'
          : 'Use API Connection Center for Kraken key repair, read checks, dry-run proof, and tiny-live eligibility.',
        endpointCallCount: krakenEndpointCallCount,
        liveOrderEnabledFromLaunchPipeline: false
      },
      coinbase: {
        label: 'Coinbase Advanced',
        status: coinbaseStatus,
        detail: coinbaseStatus === 'connected'
          ? 'Coinbase read-only account status is available for future market/account context.'
          : 'Coinbase is optional next. It does not block local token/logo/website work.'
      },
      dexReadOnly: {
        label: 'DEX read-only',
        status: 'planned',
        detail: 'DEX token, pair, price, pool, liquidity, and quote research lanes are read-only/planned. No swaps or signatures.'
      },
      walletMetadata: {
        label: 'Wallet metadata',
        status: Number(walletCountRow?.count || 0) > 0 ? 'connected' : 'optional',
        detail: Number(walletCountRow?.count || 0) > 0
          ? `${Number(walletCountRow?.count || 0)} public wallet metadata record(s) exist. No seed phrase/private key is stored.`
          : 'Public wallet metadata is optional for local launch drafting.'
      },
      dexExecution: {
        label: 'DEX execution',
        status: 'locked external action',
        detail: 'DEX swaps, approvals, and wallet signing require a future owner-approved execution phase.'
      }
    };
  }

  async function buildTokenProjectArtifactManifest(project) {
    const workspaceSlug = `token-ecosystem-${project.id}-${slugify(project.name) || 'project'}`.slice(0, 80);
    const workspace = await dbGet('SELECT * FROM workspaces WHERE slug = ?', [workspaceSlug]);
    const [
      contractSpec,
      proposalRows,
      rebalanceRows,
      orderIntentRows,
      socialRows
    ] = await Promise.all([
      project.contract_spec_id
        ? dbGet('SELECT * FROM solidity_contract_specs WHERE id = ?', [project.contract_spec_id])
        : Promise.resolve(null),
      workspace
        ? dbAll(
          `SELECT *
           FROM file_write_proposals
           WHERE workspace_id = ?
           ORDER BY id DESC
           LIMIT 100`,
          [workspace.id]
        )
        : Promise.resolve([]),
      dbAll(
        `SELECT *
         FROM rebalance_simulation_batches
         WHERE token_ecosystem_project_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT 100`,
        [project.id]
      ),
      dbAll(
        `SELECT *
         FROM trade_order_intents
         ORDER BY created_at DESC, id DESC
         LIMIT 500`
      ),
      dbAll(
        `SELECT *
         FROM social_posts
         ORDER BY created_at DESC, id DESC
         LIMIT 500`
      )
    ]);
    const cloudflareDnsRows = await dbAll(
      `SELECT *
       FROM company_dns_targets
       WHERE notes LIKE ?
       ORDER BY updated_at DESC, id DESC
       LIMIT 100`,
      [`%tokenProjectId:${project.id}%`]
    );
    const rebalanceBatches = rebalanceRows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      strategy_type: row.strategy_type,
      result: safeJsonParse(row.result_json, {}),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    const rebalanceBatchIds = new Set(rebalanceBatches.map(batch => Number(batch.id)));
    const draftOrderIntents = orderIntentRows
      .map(parseLocalOrderIntent)
      .filter(intent => (
        Number(intent.payload?.tokenEcosystemProjectId) === Number(project.id)
        || rebalanceBatchIds.has(Number(intent.payload?.rebalanceBatchId))
      ));
    const socialDrafts = socialRows
      .map(parseLocalSocialPost)
      .filter(post => Number(post.metadata?.tokenEcosystemProjectId) === Number(project.id));
    const fileProposals = proposalRows.map(parseFileProposal);
    const cloudflareDnsTargets = cloudflareDnsRows.map(parseCompanyDnsTarget);

    return {
      project,
      workspace: workspace || null,
      contractSpec: contractSpec ? parseSolidityContractSpec(contractSpec) : null,
      fileProposals,
      rebalanceBatches,
      draftOrderIntents,
      socialDrafts,
      cloudflareDnsTargets,
      counts: {
        fileProposals: fileProposals.length,
        rebalanceBatches: rebalanceBatches.length,
        draftOrderIntents: draftOrderIntents.length,
        socialDrafts: socialDrafts.length,
        cloudflareDnsTargets: cloudflareDnsTargets.length
      },
      nextLocalActions: [
        'Generate or refresh the token ecosystem workspace.',
        'Generate or refresh the local website deploy package.',
        'Generate or refresh the Cloudflare website DNS plan.',
        'Run a rebalance batch with this token ecosystem project ID.',
        'Create draft order intents from qualifying paper candidates.',
        'Create local Social Ops campaign drafts from the linked rebalance batch.',
        'Export the manifest for owner review before any external action.'
      ],
      safetyBoundary: {
        localOnly: true,
        externalActionsEnabled: false,
        deploymentEnabled: false,
        publicPostingEnabled: false,
        liveTradingEnabled: false,
        credentialLoadingEnabled: false
      }
    };
  }

  async function saveTokenEcosystemProjectBlueprint(project) {
    const blueprint = buildTokenEcosystemProjectBlueprint({
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
      [JSON.stringify(blueprint), project.id]
    );

    return getTokenEcosystemProject(project.id);
  }

  async function upsertTokenProjectWorkspaceFiles(project, files, {
    readyStatus = 'workspace_ready',
    proposedStatus = 'workspace_proposed'
  } = {}) {
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
      [shouldApply ? readyStatus : proposedStatus, project.id]
    );

    return {
      workspace,
      proposals,
      applied,
      skipped,
      initialStatus,
      status: shouldApply ? readyStatus : proposedStatus
    };
  }

  async function createWorkspaceForTokenProject(project) {
    return upsertTokenProjectWorkspaceFiles(project, buildTokenEcosystemWorkspaceFiles(project), {
      readyStatus: 'workspace_ready',
      proposedStatus: 'workspace_proposed'
    });
  }

  async function createWebsiteDeployPackageForTokenProject(project) {
    const identity = readCompanyIdentity();
    const cloudflarePlan = buildCloudflareWebsitePlan(project, identity);
    const packageFiles = buildTokenWebsiteDeployPackageFiles(project, cloudflarePlan);
    const result = await upsertTokenProjectWorkspaceFiles(project, packageFiles, {
      readyStatus: 'website_package_ready',
      proposedStatus: 'website_package_proposed'
    });

    return {
      ...result,
      cloudflarePlan,
      deployPackage: {
        outputDirectory: 'website/dist',
        fileCount: packageFiles.length,
        files: packageFiles.map(file => file.relativePath),
        localOnly: true,
        cloudflareApiCallsEnabled: false,
        dnsMutationEnabled: false,
        deploymentEnabled: false
      }
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

  app.get('/api/v1/token-launch-pipeline/state', requireAuth, async (req, res) => {
    try {
      const projectId = req.query.projectId ? Number(req.query.projectId) : null;
      const row = projectId
        ? await dbGet(
          `SELECT *
           FROM token_ecosystem_projects
           WHERE id = ?`,
          [projectId]
        )
        : await dbGet(
          `SELECT *
           FROM token_ecosystem_projects
           WHERE status != 'archived'
           ORDER BY updated_at DESC, id DESC
           LIMIT 1`,
          []
        );
      const project = parseTokenEcosystemProject(row);
      const apiReadiness = await buildLaunchProjectApiReadiness();

      res.json({
        pipeline: buildTokenLaunchPipelineState(project, { apiReadiness }),
        localOnly: true,
        externalActionsEnabled: false,
        liveTradingEnabled: false,
        walletSigningEnabled: false,
        deploymentEnabled: false,
        publicPostingEnabled: false,
        listingSubmissionEnabled: false
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        localOnly: true,
        externalActionsEnabled: false,
        liveTradingEnabled: false,
        walletSigningEnabled: false
      });
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

  app.get('/api/v1/token-ecosystem-projects/:id/launch-package', requireAuth, async (req, res) => {
    try {
      const project = await getTokenEcosystemProject(req.params.id);

      if (!project) {
        return res.status(404).json({ error: 'Token ecosystem project not found' });
      }

      const [apiReadiness, artifactManifest] = await Promise.all([
        buildLaunchProjectApiReadiness(),
        buildTokenProjectArtifactManifest(project).catch(() => null)
      ]);

      res.json({
        launchPackage: buildTokenLaunchPackageReview(project, { apiReadiness, artifactManifest }),
        localOnly: true,
        externalActionsEnabled: false,
        liveTradingEnabled: false,
        walletSigningEnabled: false,
        deploymentEnabled: false,
        publicPostingEnabled: false,
        listingSubmissionEnabled: false
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        localOnly: true,
        externalActionsEnabled: false,
        liveTradingEnabled: false,
        walletSigningEnabled: false
      });
    }
  });

  app.get('/api/v1/token-ecosystem-projects/:id/artifacts', requireAuth, async (req, res) => {
    try {
      const project = await getTokenEcosystemProject(req.params.id);

      if (!project) {
        return res.status(404).json({ error: 'Token ecosystem project not found' });
      }

      res.json({
        manifest: await buildTokenProjectArtifactManifest(project),
        localOnly: true,
        externalActionsEnabled: false,
        liveExecutionEnabled: false
      });
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
            operator_draft_json, nft_utility_notes, ecosystem_notes, status, blueprint_json, local_only, external_actions_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
        [
          req.session.userId || null,
          input.contractSpecId,
          input.name,
          input.targetChain,
          input.contractType,
          JSON.stringify(input.featureSelections),
          JSON.stringify(input.operatorDraft),
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

  app.patch('/api/v1/token-ecosystem-projects/:id', requireAuth, async (req, res) => {
    try {
      const existing = await getTokenEcosystemProject(req.params.id);

      if (!existing) {
        return res.status(404).json({ error: 'Token ecosystem project not found' });
      }

      const input = normalizeTokenEcosystemProjectInput(req.body || {}, existing);
      await dbRun(
        `UPDATE token_ecosystem_projects
         SET contract_spec_id = ?, name = ?, target_chain = ?, contract_type = ?,
             feature_selections_json = ?, operator_draft_json = ?, nft_utility_notes = ?, ecosystem_notes = ?,
             status = ?, local_only = 1, external_actions_enabled = 0, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          input.contractSpecId,
          input.name,
          input.targetChain,
          input.contractType,
          JSON.stringify(input.featureSelections),
          JSON.stringify(input.operatorDraft),
          input.nftUtilityNotes,
          input.ecosystemNotes,
          input.status,
          existing.id
        ]
      );

      const project = await saveTokenEcosystemProjectBlueprint(await getTokenEcosystemProject(existing.id));

      res.json({ project });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/v1/token-ecosystem-projects/:id', requireAuth, async (req, res) => {
    try {
      const existing = await getTokenEcosystemProject(req.params.id);

      if (!existing) {
        return res.status(404).json({ error: 'Token ecosystem project not found' });
      }

      await dbRun(
        `UPDATE token_ecosystem_projects
         SET status = 'archived', local_only = 1, external_actions_enabled = 0, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [existing.id]
      );

      const project = await saveTokenEcosystemProjectBlueprint(await getTokenEcosystemProject(existing.id));

      res.json({
        project,
        archived: true,
        localOnly: true,
        externalActionsEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
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

  app.post('/api/v1/token-ecosystem-projects/:id/website-deploy-package', requireAuth, async (req, res) => {
    try {
      const project = await getTokenEcosystemProject(req.params.id);

      if (!project) {
        return res.status(404).json({ error: 'Token ecosystem project not found' });
      }

      const result = await createWebsiteDeployPackageForTokenProject(project);
      const updatedProject = await getTokenEcosystemProject(project.id);

      res.status(201).json({
        project: updatedProject,
        ...result,
        localOnly: true,
        externalActionsEnabled: false,
        cloudflareApiCallsEnabled: false,
        dnsMutationEnabled: false,
        deploymentEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/token-ecosystem-projects/:id/cloudflare-dns-plan', requireAuth, async (req, res) => {
    try {
      const project = await getTokenEcosystemProject(req.params.id);

      if (!project) {
        return res.status(404).json({ error: 'Token ecosystem project not found' });
      }

      const identity = readCompanyIdentity();
      const plan = buildCloudflareWebsitePlan(project, identity);
      const savedTargets = [];
      const skippedTargets = [];

      for (const target of plan.dnsTargets) {
        const normalized = normalizeCompanyDnsTargetInput(target, identity);
        const existing = await dbGet(
          `SELECT *
           FROM company_dns_targets
           WHERE domain = ? AND record_type = ? AND host = ? AND value = ? AND purpose = ?
           ORDER BY id DESC
           LIMIT 1`,
          [
            normalized.domain,
            normalized.recordType,
            normalized.host,
            normalized.value,
            normalized.purpose
          ]
        );

        if (existing) {
          skippedTargets.push(parseCompanyDnsTarget(existing));
          continue;
        }

        const result = await dbRun(
          `INSERT INTO company_dns_targets
             (user_id, domain, record_type, host, value, purpose, status, notes, local_only, external_mutation_enabled)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
          [
            req.session.userId || null,
            normalized.domain,
            normalized.recordType,
            normalized.host,
            normalized.value,
            normalized.purpose,
            normalized.status,
            normalized.notes
          ]
        );
        savedTargets.push(parseCompanyDnsTarget(await dbGet(
          'SELECT * FROM company_dns_targets WHERE id = ?',
          [result.lastID]
        )));
      }

      res.status(201).json({
        project,
        plan,
        savedTargets,
        skippedTargets,
        localOnly: true,
        externalMutationEnabled: false,
        cloudflareApiCallsEnabled: false,
        credentialLoadingEnabled: false,
        emailRoutingPreserved: true
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
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
      const allowedTypes = new Set([
        'erc20',
        'bep20',
        'erc721',
        'erc1155',
        'spl-token',
        'token-2022',
        'metaplex-nft',
        'trc20',
        'trc721',
        'move-coin',
        'move-nft',
        'cw20',
        'cw721',
        'native-denom',
        'psp22',
        'psp34',
        'nep141',
        'nep171',
        'cardano-native-asset',
        'algorand-asa',
        'stellar-asset',
        'xrp-issued-currency',
        'hedera-hts',
        'tezos-fa2',
        'flow-ft',
        'ton-jetton',
        'bitcoin-rune',
        'generic'
      ]);

      if (!name) {
        return res.status(400).json({ error: 'Contract name is required' });
      }

      if (!allowedTypes.has(contractType)) {
        return res.status(400).json({ error: 'Contract type must be one of the supported local token standards.' });
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
