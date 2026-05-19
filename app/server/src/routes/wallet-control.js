function registerWalletControlRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  sanitizeWalletInput,
  parseOwnerWallet,
  parseWalletPermissionEvent,
  evaluateWalletReadiness,
  buildWalletOnboardingGuide,
  buildOperatorControlSummary,
  walletPermissionKeys,
  parseLocalSecretReference
}) {
  const permissionKeys = Array.isArray(walletPermissionKeys) && walletPermissionKeys.length
    ? walletPermissionKeys
    : [
      'view_public_address',
      'request_signature',
      'deploy_contract',
      'mint_token',
      'transfer_assets',
      'trade_execution',
      'bridge_assets',
      'treasury_spend',
      'admin_recovery'
    ];
  const walletSelect = `
    SELECT owner_wallets.*,
           local_secret_references.label AS secret_reference_label,
           local_secret_references.provider_type AS secret_reference_provider_type,
           local_secret_references.reference_name AS secret_reference_name,
           local_secret_references.status AS secret_reference_status
    FROM owner_wallets
    LEFT JOIN local_secret_references ON local_secret_references.id = owner_wallets.secret_reference_id
  `;

  async function listWallets(userId) {
    const rows = await dbAll(
      `${walletSelect}
       WHERE owner_wallets.user_id = ?
       ORDER BY owner_wallets.updated_at DESC, owner_wallets.id DESC
       LIMIT 100`,
      [userId]
    );

    return rows.map(parseOwnerWallet);
  }

  async function getWallet(walletId, userId) {
    return parseOwnerWallet(await dbGet(
      `${walletSelect}
       WHERE owner_wallets.id = ? AND owner_wallets.user_id = ?`,
      [walletId, userId]
    ));
  }

  async function listWalletEvents(userId, limit = 50) {
    const rows = await dbAll(
      `SELECT *
       FROM wallet_permission_events
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(parseWalletPermissionEvent);
  }

  async function getSecretReference(secretReferenceId, userId) {
    if (!secretReferenceId) {
      return null;
    }

    return parseLocalSecretReference(await dbGet(
      'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
      [secretReferenceId, userId]
    ));
  }

  async function recordWalletEvent({
    walletId = null,
    userId,
    eventType,
    status,
    summary,
    before = null,
    after = null,
    evidence = {}
  }) {
    const result = await dbRun(
      `INSERT INTO wallet_permission_events
       (wallet_id, user_id, event_type, status, summary, before_json, after_json, evidence_json, local_only, live_execution_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
      [
        walletId,
        userId,
        eventType,
        status,
        summary,
        before ? JSON.stringify(before) : null,
        after ? JSON.stringify(after) : null,
        JSON.stringify({
          ...evidence,
          localOnly: true,
          signingEnabled: false,
          liveExecutionEnabled: false
        })
      ]
    );

    return parseWalletPermissionEvent(await dbGet(
      'SELECT * FROM wallet_permission_events WHERE id = ?',
      [result.lastID]
    ));
  }

  app.get('/api/v1/operator-control-center', requireAuth, async (req, res) => {
    try {
      const wallets = await listWallets(req.session.userId);
      const events = await listWalletEvents(req.session.userId);

      res.json({
        summary: buildOperatorControlSummary({ wallets, events }),
        guide: buildWalletOnboardingGuide(),
        wallets,
        events,
        localOnly: true,
        signingEnabled: false,
        liveExecutionEnabled: false,
        secretsStored: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/wallets', requireAuth, async (req, res) => {
    try {
      res.json({
        wallets: await listWallets(req.session.userId),
        guide: buildWalletOnboardingGuide(),
        localOnly: true,
        signingEnabled: false,
        liveExecutionEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/wallets', requireAuth, async (req, res) => {
    try {
      const input = sanitizeWalletInput(req.body || {});

      if (input.secretReferenceId) {
        const secretReference = await getSecretReference(input.secretReferenceId, req.session.userId);

        if (!secretReference) {
          return res.status(400).json({ error: 'Wallet connector local reference not found' });
        }

        if (!['wallet_connector', 'deployment_key', 'generic'].includes(secretReference.scope)) {
          return res.status(400).json({ error: 'Wallet connector reference must use wallet_connector, deployment_key, or generic scope' });
        }
      }

      const result = await dbRun(
        `INSERT INTO owner_wallets
         (user_id, secret_reference_id, label, wallet_kind, chain_family, network, public_address,
          connection_method, status, assignment_json, permission_scope_json, notes, local_only,
          signing_enabled, live_execution_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0)`,
        [
          req.session.userId,
          input.secretReferenceId,
          input.label,
          input.walletKind,
          input.chainFamily,
          input.network,
          input.publicAddress,
          input.connectionMethod,
          input.status,
          JSON.stringify(input.assignments),
          JSON.stringify(input.permissionScope),
          input.notes
        ]
      );
      const wallet = await getWallet(result.lastID, req.session.userId);
      const secretReference = await getSecretReference(wallet.secret_reference_id, req.session.userId);
      const readiness = evaluateWalletReadiness({ wallet, secretReference });
      const event = await recordWalletEvent({
        walletId: wallet.id,
        userId: req.session.userId,
        eventType: 'wallet.attached',
        status: readiness.status,
        summary: `Wallet ${wallet.label} attached as metadata only.`,
        after: wallet,
        evidence: readiness
      });

      res.status(201).json({
        wallet,
        readiness,
        event,
        localOnly: true,
        signingEnabled: false,
        liveExecutionEnabled: false,
        secretsStored: false
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        sensitiveFields: error.sensitiveFields,
        likelySecretValues: error.likelySecretValues
      });
    }
  });

  app.get('/api/v1/wallets/:id', requireAuth, async (req, res) => {
    try {
      const wallet = await getWallet(req.params.id, req.session.userId);

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const secretReference = await getSecretReference(wallet.secret_reference_id, req.session.userId);

      res.json({
        wallet,
        readiness: evaluateWalletReadiness({ wallet, secretReference }),
        localOnly: true,
        signingEnabled: false,
        liveExecutionEnabled: false,
        secretsStored: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/wallets/:id', requireAuth, async (req, res) => {
    try {
      const current = await getWallet(req.params.id, req.session.userId);

      if (!current) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const input = sanitizeWalletInput(req.body || {}, {
        ...current,
        assignment_json: current.assignments,
        permission_scope_json: current.permissionScope
      });

      if (input.secretReferenceId) {
        const secretReference = await getSecretReference(input.secretReferenceId, req.session.userId);

        if (!secretReference) {
          return res.status(400).json({ error: 'Wallet connector local reference not found' });
        }

        if (!['wallet_connector', 'deployment_key', 'generic'].includes(secretReference.scope)) {
          return res.status(400).json({ error: 'Wallet connector reference must use wallet_connector, deployment_key, or generic scope' });
        }
      }

      await dbRun(
        `UPDATE owner_wallets
         SET secret_reference_id = ?,
             label = ?,
             wallet_kind = ?,
             chain_family = ?,
             network = ?,
             public_address = ?,
             connection_method = ?,
             status = ?,
             assignment_json = ?,
             permission_scope_json = ?,
             notes = ?,
             local_only = 1,
             signing_enabled = 0,
             live_execution_enabled = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          input.secretReferenceId,
          input.label,
          input.walletKind,
          input.chainFamily,
          input.network,
          input.publicAddress,
          input.connectionMethod,
          input.status,
          JSON.stringify(input.assignments),
          JSON.stringify(input.permissionScope),
          input.notes,
          current.id,
          req.session.userId
        ]
      );
      const wallet = await getWallet(current.id, req.session.userId);
      const secretReference = await getSecretReference(wallet.secret_reference_id, req.session.userId);
      const readiness = evaluateWalletReadiness({ wallet, secretReference });
      const event = await recordWalletEvent({
        walletId: wallet.id,
        userId: req.session.userId,
        eventType: 'wallet.updated',
        status: readiness.status,
        summary: `Wallet ${wallet.label} metadata or permissions updated.`,
        before: current,
        after: wallet,
        evidence: readiness
      });

      res.json({
        wallet,
        readiness,
        event,
        localOnly: true,
        signingEnabled: false,
        liveExecutionEnabled: false,
        secretsStored: false
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        sensitiveFields: error.sensitiveFields,
        likelySecretValues: error.likelySecretValues
      });
    }
  });

  app.post('/api/v1/wallets/:id/readiness', requireAuth, async (req, res) => {
    try {
      const wallet = await getWallet(req.params.id, req.session.userId);

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const secretReference = await getSecretReference(wallet.secret_reference_id, req.session.userId);
      const readiness = evaluateWalletReadiness({ wallet, secretReference });
      const event = await recordWalletEvent({
        walletId: wallet.id,
        userId: req.session.userId,
        eventType: 'wallet.readiness_reviewed',
        status: readiness.status,
        summary: `Wallet ${wallet.label} readiness reviewed.`,
        after: wallet,
        evidence: readiness
      });

      res.json({
        wallet,
        readiness,
        event,
        localOnly: true,
        signingEnabled: false,
        liveExecutionEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/wallets/:id/revoke', requireAuth, async (req, res) => {
    try {
      const current = await getWallet(req.params.id, req.session.userId);

      if (!current) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      await dbRun(
        `UPDATE owner_wallets
         SET status = 'revoked',
             permission_scope_json = ?,
             local_only = 1,
             signing_enabled = 0,
             live_execution_enabled = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          JSON.stringify(Object.fromEntries(permissionKeys.map(key => [key, 'blocked']))),
          current.id,
          req.session.userId
        ]
      );
      const wallet = await getWallet(current.id, req.session.userId);
      const readiness = evaluateWalletReadiness({ wallet, secretReference: null });
      const event = await recordWalletEvent({
        walletId: wallet.id,
        userId: req.session.userId,
        eventType: 'wallet.revoked',
        status: 'revoked',
        summary: `Wallet ${wallet.label} revoked; all permissions blocked.`,
        before: current,
        after: wallet,
        evidence: {
          ...readiness,
          emergencyAction: true
        }
      });

      res.json({
        wallet,
        readiness,
        event,
        localOnly: true,
        signingEnabled: false,
        liveExecutionEnabled: false,
        secretsStored: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/wallet-permission-events', requireAuth, async (req, res) => {
    try {
      res.json({
        events: await listWalletEvents(req.session.userId, 100),
        localOnly: true,
        signingEnabled: false,
        liveExecutionEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerWalletControlRoutes
};
