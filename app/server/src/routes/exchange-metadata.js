function registerExchangeMetadataRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  readSecretProviderCapabilities,
  sanitizeLocalSecretReferenceInput,
  sanitizeExchangeConnectorInput,
  parseLocalSecretReference,
  parseExchangeConnector,
  parseExchangeConnectorReadinessEvent,
  parseExchangeAdapterContractEvent,
  getExchangeConnectorRow,
  getExchangeConnectorReadinessEventRow,
  getExchangeAdapterContractEventRow,
  getExchangeConnectorRegistry,
  getExchangeConnectorRegistryEntry,
  createExchangeConnectorPlaceholderInput,
  findExistingRegistryConnector,
  buildExchangeConnectorManagerSummary,
  evaluateExchangeConnectorReadOnlyTest,
  exchangeReadOnlySetupGuides,
  dexQuoteOnlySetupGuides,
  recommendedReadOnlyExchanges,
  quoteOnlyConnectors,
  sanitizeCredentialInput,
  sanitizePermissionsChecklist,
  getReadOnlyReferenceName,
  saveReadOnlyVaultCredentials,
  loadReadOnlyVaultCredentials,
  deleteReadOnlyVaultCredentials,
  getReadOnlyVaultStatus,
  testReadOnlyExchangeConnection,
  compareReadOnlyPrices,
  buildReadOnlyConnectionSummary,
  createPlainEnglishExchangeError,
  evaluateExchangeConnectorReadiness,
  evaluateExchangeAdapterContract,
  createExchangeAdapterContractSpec,
  getExchangeAdapterScaffold,
  getExchangeAdapterScaffolds,
  exchangeAdapterContractExchanges,
  selects
}) {
  const {
    exchangeConnector: exchangeConnectorSelect,
    exchangeConnectorReadinessEvent: exchangeConnectorReadinessEventSelect,
    exchangeAdapterContractEvent: exchangeAdapterContractEventSelect
  } = selects;
  const normalizeExchangeId = value => String(value || '').trim().toLowerCase().replace(/_/g, '-');

  function getConnectorRegistryEntryForConnector(connector) {
    return getExchangeConnectorRegistryEntry(connector?.settings?.registryId || connector?.exchange_name);
  }

  function getReadOnlyGuideForConnector(connector, registryEntry = null) {
    const exchangeId = normalizeExchangeId(registryEntry?.id || connector?.settings?.registryId || connector?.exchange_name);

    return exchangeReadOnlySetupGuides?.[exchangeId] || null;
  }

  function mergeReadOnlyConnectionSettings(connector, updates = {}) {
    const currentSettings = connector?.settings && typeof connector.settings === 'object'
      ? connector.settings
      : {};
    const currentConnection = currentSettings.readOnlyConnection && typeof currentSettings.readOnlyConnection === 'object'
      ? currentSettings.readOnlyConnection
      : {};

    return {
      ...currentSettings,
      readOnlyConnection: {
        ...currentConnection,
        marketDataOnly: true,
        liveTradingEnabled: false,
        withdrawalsEnabled: false,
        walletSigningEnabled: false,
        orderEndpointEnabled: false,
        valuesDisplayed: false,
        browserLocalStorageUsed: false,
        ...updates
      }
    };
  }

  async function upsertReadOnlyLocalReference({ userId, existingReferenceId, label, referenceName, notes }) {
    let referenceRow = existingReferenceId
      ? await dbGet(
        'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
        [existingReferenceId, userId]
      )
      : null;

    if (!referenceRow) {
      referenceRow = await dbGet(
        'SELECT * FROM local_secret_references WHERE user_id = ? AND reference_name = ?',
        [userId, referenceName]
      );
    }

    if (referenceRow) {
      await dbRun(
        `UPDATE local_secret_references
         SET label = ?, provider_type = ?, reference_name = ?, scope = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          label,
          'local_vault_path',
          referenceName,
          'exchange_connector',
          'configured',
          notes,
          referenceRow.id,
          userId
        ]
      );

      return parseLocalSecretReference(await dbGet(
        'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
        [referenceRow.id, userId]
      ));
    }

    const result = await dbRun(
      `INSERT INTO local_secret_references
       (user_id, label, provider_type, reference_name, scope, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        label,
        'local_vault_path',
        referenceName,
        'exchange_connector',
        'configured',
        notes
      ]
    );

    return parseLocalSecretReference(await dbGet(
      'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
      [result.lastID, userId]
    ));
  }

  app.get('/api/v1/local-secret-provider-capabilities', requireAuth, (req, res) => {
    try {
      res.json({ capabilities: readSecretProviderCapabilities() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/local-secret-references', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT *
         FROM local_secret_references
         WHERE user_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT 100`,
        [req.session.userId]
      );

      res.json({ references: rows.map(parseLocalSecretReference) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/local-secret-references/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.userId]
      );

      if (!row) {
        return res.status(404).json({ error: 'Local secret reference not found' });
      }

      res.json({ reference: parseLocalSecretReference(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/local-secret-references', requireAuth, async (req, res) => {
    try {
      const input = sanitizeLocalSecretReferenceInput(req.body || {});

      const result = await dbRun(
        `INSERT INTO local_secret_references
         (user_id, label, provider_type, reference_name, scope, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          input.label,
          input.providerType,
          input.referenceName,
          input.scope,
          input.status,
          input.notes
        ]
      );
      const row = await dbGet(
        'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
        [result.lastID, req.session.userId]
      );

      res.status(201).json({ reference: parseLocalSecretReference(row) });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        sensitiveFields: error.sensitiveFields,
        likelySecretValues: error.likelySecretValues
      });
    }
  });

  app.patch('/api/v1/local-secret-references/:id', requireAuth, async (req, res) => {
    try {
      const current = await dbGet(
        'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.userId]
      );

      if (!current) {
        return res.status(404).json({ error: 'Local secret reference not found' });
      }

      const input = sanitizeLocalSecretReferenceInput(req.body || {}, current);

      await dbRun(
        `UPDATE local_secret_references
         SET label = ?, provider_type = ?, reference_name = ?, scope = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          input.label,
          input.providerType,
          input.referenceName,
          input.scope,
          input.status,
          input.notes,
          current.id,
          req.session.userId
        ]
      );
      const row = await dbGet(
        'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
        [current.id, req.session.userId]
      );

      res.json({ reference: parseLocalSecretReference(row) });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        sensitiveFields: error.sensitiveFields,
        likelySecretValues: error.likelySecretValues
      });
    }
  });

  app.get('/api/v1/exchange-connectors', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 100`
      );

      res.json({ connectors: rows.map(parseExchangeConnector) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/exchange-connectors/registry', requireAuth, (req, res) => {
    try {
      const includeUnsupported = req.query.includeUnsupported !== 'false';
      const recommendedOnly = req.query.recommendedOnly === 'true';
      const firstFive = req.query.firstFive === 'true';
      const registry = getExchangeConnectorRegistry({
        includeUnsupported,
        recommendedOnly,
        firstFive
      });

      res.json({
        registry,
        filters: {
          includeUnsupported,
          recommendedOnly,
          firstFive
        },
        safetyModel: {
          defaultEveryConnectorOff: true,
          cexApisReadOnlyByDefault: true,
          withdrawalsEnabled: false,
          liveTradingEnabled: false,
          walletSigningEnabled: false,
          uiStoresCredentials: false,
          dexQuoteOnlyUntilFutureOwnerApproval: true,
          p2pManualOnly: true
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/exchange-connectors/manager', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 300`
      );
      const connectors = rows.map(parseExchangeConnector);

      res.json({ manager: buildExchangeConnectorManagerSummary(connectors) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/exchange-connectors/read-only/setup-guides', requireAuth, (req, res) => {
    try {
      res.json({
        recommendedFirst: recommendedReadOnlyExchanges || [],
        quoteOnlyConnectors: quoteOnlyConnectors || [],
        cexGuides: Object.values(exchangeReadOnlySetupGuides || {}),
        quoteOnlyGuides: Object.values(dexQuoteOnlySetupGuides || {}),
        safetyModel: {
          browserLocalStorageUsed: false,
          uiStoresCredentialValues: false,
          encryptedLocalVault: true,
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          orderEndpointEnabled: false,
          privateValuesReturnedToUi: false
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/exchange-connectors/read-only/status', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const vaultStatus = await getReadOnlyVaultStatus();

      res.json({
        summary: buildReadOnlyConnectionSummary(connectors),
        vaultStatus,
        statuses: ['Not Connected', 'Read-Only Connected', 'Error'],
        safetyModel: {
          marketDataOnly: true,
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          orderEndpointEnabled: false,
          privateValuesReturnedToUi: false
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/exchange-connectors/read-only/price-compare', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const comparison = await compareReadOnlyPrices({
        connectors,
        symbol: req.body?.symbol || 'BTC/USDT',
        connectedOnly: req.body?.connectedOnly === true
      });

      res.json({ comparison });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishExchangeError
          ? createPlainEnglishExchangeError('Exchange price comparison', error)
          : error.message
      });
    }
  });

  app.post('/api/v1/exchange-connectors/placeholders', requireAuth, async (req, res) => {
    try {
      const body = req.body || {};
      const scope = String(body.scope || 'recommended_first_5').trim().toLowerCase();
      const mode = body.mode ? String(body.mode).trim().toLowerCase() : null;
      const includeUnsupported = body.includeUnsupported === true;
      const supportedEntries = getExchangeConnectorRegistry({
        includeUnsupported,
        recommendedOnly: scope === 'recommended_10',
        firstFive: scope === 'recommended_first_5'
      });
      let entries = supportedEntries;

      if (scope === 'all') {
        entries = getExchangeConnectorRegistry({ includeUnsupported: false });
      } else if (scope === 'single') {
        const entry = getExchangeConnectorRegistryEntry(body.exchangeId || body.exchangeName || body.id);

        if (!entry) {
          return res.status(404).json({ error: 'Exchange registry entry not found' });
        }

        if (!entry.connectorSupported) {
          return res.status(400).json({
            error: 'This exchange is informational/manual only. It does not support an automated connector placeholder yet.'
          });
        }

        entries = [entry];
      } else if (!['recommended_first_5', 'recommended_10'].includes(scope)) {
        return res.status(400).json({
          error: 'Placeholder scope must be single, recommended_first_5, recommended_10, or all'
        });
      }

      const existingRows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const existingConnectors = existingRows.map(parseExchangeConnector);
      const created = [];
      const reused = [];

      for (const entry of entries) {
        const existing = findExistingRegistryConnector(existingConnectors.concat(created), entry);

        if (existing) {
          reused.push(existing);
          continue;
        }

        const requestedMode = mode === 'paper' && entry.supportsPaperMode
          ? 'paper'
          : mode === 'live_disabled'
            ? 'live_disabled'
            : 'read_only';
        const requestedStatus = requestedMode === 'paper' ? 'configured' : 'disabled';
        const placeholder = createExchangeConnectorPlaceholderInput(entry, {
          mode: requestedMode,
          status: requestedStatus,
          labelSuffix: requestedMode === 'paper' ? 'Paper Connector' : 'Read-Only Placeholder'
        });
        const input = sanitizeExchangeConnectorInput(placeholder);
        const result = await dbRun(
          `INSERT INTO exchange_connectors
           (secret_reference_id, exchange_name, label, mode, status, settings_json, secret_storage_note)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            input.secretReferenceId,
            input.exchangeName,
            input.label,
            input.mode,
            input.status,
            JSON.stringify(input.settings),
            'No secret values stored. Connector manager placeholders store metadata only.'
          ]
        );
        const row = await getExchangeConnectorRow(result.lastID);

        created.push(parseExchangeConnector(row));
      }

      const refreshedRows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 300`
      );
      const connectors = refreshedRows.map(parseExchangeConnector);

      res.status(created.length ? 201 : 200).json({
        created,
        reused,
        manager: buildExchangeConnectorManagerSummary(connectors),
        safetyModel: {
          defaultEveryConnectorOff: true,
          requestedMode: mode || 'read_only',
          liveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          uiStoresCredentials: false
        }
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        sensitiveFields: error.sensitiveFields,
        likelySecretValues: error.likelySecretValues
      });
    }
  });

  app.get('/api/v1/exchange-connectors/:id', requireAuth, async (req, res) => {
    try {
      const row = await getExchangeConnectorRow(req.params.id);

      if (!row) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      res.json({ connector: parseExchangeConnector(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/exchange-connectors', requireAuth, async (req, res) => {
    try {
      const input = sanitizeExchangeConnectorInput(req.body || {});

      if (input.secretReferenceId) {
        const secretReference = await dbGet(
          'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
          [input.secretReferenceId, req.session.userId]
        );

        if (!secretReference) {
          return res.status(400).json({ error: 'Local secret reference not found' });
        }
      }

      const result = await dbRun(
        `INSERT INTO exchange_connectors
         (secret_reference_id, exchange_name, label, mode, status, settings_json, secret_storage_note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.secretReferenceId,
          input.exchangeName,
          input.label,
          input.mode,
          input.status,
          JSON.stringify(input.settings),
          input.secretReferenceId
            ? 'Secret value not stored. Connector references a local secret reference record.'
            : 'No secrets stored in SQLite.'
        ]
      );
      const row = await getExchangeConnectorRow(result.lastID);

      res.status(201).json({ connector: parseExchangeConnector(row) });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        sensitiveFields: error.sensitiveFields,
        likelySecretValues: error.likelySecretValues
      });
    }
  });

  app.patch('/api/v1/exchange-connectors/:id', requireAuth, async (req, res) => {
    try {
      const currentRow = await getExchangeConnectorRow(req.params.id);
      const current = parseExchangeConnector(currentRow);

      if (!current) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const input = sanitizeExchangeConnectorInput(req.body || {}, current);

      if (input.secretReferenceId) {
        const secretReference = await dbGet(
          'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
          [input.secretReferenceId, req.session.userId]
        );

        if (!secretReference) {
          return res.status(400).json({ error: 'Local secret reference not found' });
        }
      }

      await dbRun(
        `UPDATE exchange_connectors
         SET secret_reference_id = ?, exchange_name = ?, label = ?, mode = ?, status = ?,
             settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          input.secretReferenceId,
          input.exchangeName,
          input.label,
          input.mode,
          input.status,
          JSON.stringify(input.settings),
          input.secretReferenceId
            ? 'Secret value not stored. Connector references a local secret reference record.'
            : 'No secrets stored in SQLite.',
          current.id
        ]
      );
      const row = await getExchangeConnectorRow(current.id);

      res.json({ connector: parseExchangeConnector(row) });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        sensitiveFields: error.sensitiveFields,
        likelySecretValues: error.likelySecretValues
      });
    }
  });

  app.post('/api/v1/exchange-connectors/:id/test-read-only', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const secretReference = connector.secret_reference_id
        ? parseLocalSecretReference(await dbGet(
          'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
          [connector.secret_reference_id, req.session.userId]
        ))
        : null;
      const registryEntry = getExchangeConnectorRegistryEntry(connector.settings?.registryId || connector.exchange_name);
      const test = evaluateExchangeConnectorReadOnlyTest({
        connector,
        registryEntry,
        secretReference
      });

      res.json({ test });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/exchange-connectors/:id/read-only-credentials', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const registryEntry = getConnectorRegistryEntryForConnector(connector);
      const guide = getReadOnlyGuideForConnector(connector, registryEntry);

      if (!guide) {
        return res.status(400).json({
          error: 'This connector is quote-only or not supported for private API keys in Phase 2. Use public quote/read-only mode instead.',
          liveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false
        });
      }

      const permissions = sanitizePermissionsChecklist(req.body?.permissionsChecklist || {});

      if (permissions.missing.length) {
        return res.status(400).json({
          error: 'Complete the read-only safety checklist before saving this API key.',
          missing: permissions.missing,
          nextClick: 'Check every safety box, then click Save to Secure Vault.',
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false
        });
      }

      const credentials = sanitizeCredentialInput(req.body?.credentials || req.body || {}, guide);
      const exchangeId = normalizeExchangeId(registryEntry?.id || connector.settings?.registryId || connector.exchange_name);
      const displayName = registryEntry?.name || guide.displayName || connector.label || exchangeId;
      const referenceName = getReadOnlyReferenceName({
        userId: req.session.userId,
        connectorId: connector.id,
        exchangeName: exchangeId
      });
      const reference = await upsertReadOnlyLocalReference({
        userId: req.session.userId,
        existingReferenceId: connector.secret_reference_id,
        label: `${displayName} Read-Only API Vault`,
        referenceName,
        notes: 'Encrypted local vault reference only. No credential values are stored in SQLite or displayed in the UI.'
      });
      const saved = await saveReadOnlyVaultCredentials({
        referenceName,
        connector,
        exchangeName: exchangeId,
        credentials,
        permissionsChecklist: permissions.checklist
      });
      const previousConnection = connector.settings?.readOnlyConnection || {};
      const settings = mergeReadOnlyConnectionSettings(connector, {
        referenceName,
        connectionStatus: 'not_connected',
        plainEnglishStatus: 'Read-only API key saved locally. Click Test Read-Only Connection to verify market-data/account-read access.',
        lastCredentialRotationAt: saved.rotatedAt,
        rotationNumber: Number(previousConnection.rotationNumber || 0) + 1,
        permissionsChecklist: permissions.checklist,
        apiKeyFingerprint: saved.apiKeyFingerprint,
        requiresExtraPhrase: Boolean(guide.passphraseRequired),
        guideDisplayName: guide.displayName
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET secret_reference_id = ?, mode = ?, status = ?, settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          reference.id,
          'read_only',
          'configured',
          JSON.stringify(settings),
          'Credential values are encrypted in the local owner vault. SQLite stores only a local reference.',
          connector.id
        ]
      );
      const updatedConnector = parseExchangeConnector(await getExchangeConnectorRow(connector.id));

      res.status(201).json({
        connector: updatedConnector,
        reference,
        vault: {
          stored: true,
          referenceName: saved.referenceName,
          apiKeyFingerprint: saved.apiKeyFingerprint,
          hasExtraPhrase: saved.hasExtraPhrase,
          rotatedAt: saved.rotatedAt,
          secretValuesReturned: false
        },
        nextClick: 'Click Test Read-Only Connection.',
        safetyBoundary: {
          marketDataOnly: true,
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          orderEndpointEnabled: false,
          privateValuesReturnedToUi: false
        }
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: createPlainEnglishExchangeError
          ? createPlainEnglishExchangeError('Read-only API setup', error)
          : error.message
      });
    }
  });

  app.delete('/api/v1/exchange-connectors/:id/read-only-credentials', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const localReference = connector.secret_reference_id
        ? parseLocalSecretReference(await dbGet(
          'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
          [connector.secret_reference_id, req.session.userId]
        ))
        : null;
      const referenceName = connector.settings?.readOnlyConnection?.referenceName || localReference?.reference_name || null;
      const deletion = referenceName
        ? await deleteReadOnlyVaultCredentials(referenceName)
        : { deleted: false, referenceName: null };

      if (localReference) {
        await dbRun(
          `UPDATE local_secret_references
           SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
          [
            'disabled',
            'Read-only exchange API vault entry was deleted by owner action.',
            localReference.id,
            req.session.userId
          ]
        );
      }

      const settings = mergeReadOnlyConnectionSettings(connector, {
        referenceName: null,
        connectionStatus: 'not_connected',
        plainEnglishStatus: 'Read-only API key deleted. Public market data can still be used without account credentials.',
        lastDeletedAt: new Date().toISOString(),
        apiKeyFingerprint: null,
        permissionsChecklist: null
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET secret_reference_id = NULL, status = ?, settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          'disabled',
          JSON.stringify(settings),
          'No credential values stored in SQLite.',
          connector.id
        ]
      );

      res.json({
        deleted: deletion.deleted,
        connector: parseExchangeConnector(await getExchangeConnectorRow(connector.id)),
        nextClick: 'Add a new read-only API key later if needed.',
        safetyBoundary: {
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          orderEndpointEnabled: false
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/exchange-connectors/:id/read-only-connection-test', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const registryEntry = getConnectorRegistryEntryForConnector(connector);
      const localReference = connector.secret_reference_id
        ? parseLocalSecretReference(await dbGet(
          'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
          [connector.secret_reference_id, req.session.userId]
        ))
        : null;
      const referenceName = connector.settings?.readOnlyConnection?.referenceName || localReference?.reference_name || null;
      const credentials = referenceName ? await loadReadOnlyVaultCredentials(referenceName) : null;
      const test = await testReadOnlyExchangeConnection({
        connector,
        registryEntry,
        credentials,
        symbol: req.body?.symbol || 'BTC/USDT'
      });
      const nextStatus = test.status === 'read_only_connected' || test.status === 'quote_only_connected'
        ? 'configured'
        : connector.secret_reference_id
          ? 'configured'
          : 'disabled';
      const settings = mergeReadOnlyConnectionSettings(connector, {
        referenceName,
        connectionStatus: test.status,
        plainEnglishStatus: test.plainEnglishStatus,
        lastTestAt: test.generatedAt,
        lastTestExchange: test.exchangeName,
        lastTestSymbol: test.ticker?.symbol || req.body?.symbol || 'BTC/USDT',
        lastPublicSource: test.ticker?.source || null,
        lastFailureIds: test.failures || []
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET mode = ?, status = ?, settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          'read_only',
          nextStatus,
          JSON.stringify(settings),
          connector.secret_reference_id
            ? 'Credential values remain encrypted in the local owner vault. SQLite stores only a local reference.'
            : 'No account credential values stored. Public market-data test only.',
          connector.id
        ]
      );

      res.json({
        test,
        connector: parseExchangeConnector(await getExchangeConnectorRow(connector.id)),
        safetyBoundary: {
          marketDataOnly: true,
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          orderEndpointEnabled: false,
          privateValuesReturnedToUi: false
        }
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishExchangeError
          ? createPlainEnglishExchangeError('Read-only connection test', error)
          : error.message
      });
    }
  });

  app.post('/api/v1/exchange-connectors/:id/readiness', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const secretReference = connector.secret_reference_id
        ? parseLocalSecretReference(await dbGet(
          'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
          [connector.secret_reference_id, req.session.userId]
        ))
        : null;
      const readiness = evaluateExchangeConnectorReadiness({ connector, secretReference });
      const result = await dbRun(
        `INSERT INTO exchange_connector_readiness_events
         (connector_id, user_id, status, readiness_json)
         VALUES (?, ?, ?, ?)`,
        [
          connector.id,
          req.session.userId,
          readiness.status,
          JSON.stringify(readiness)
        ]
      );
      const event = parseExchangeConnectorReadinessEvent(await getExchangeConnectorReadinessEventRow(result.lastID));

      res.json({ readiness, event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/exchange-connectors/:id/readiness-events', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const status = String(req.query.status || '').trim().toLowerCase();
      const allowedStatuses = new Set(['blocked', 'review_required', 'metadata_ready']);
      const where = ['exchange_connector_readiness_events.connector_id = ?'];
      const params = [connector.id];

      if (status) {
        if (!allowedStatuses.has(status)) {
          return res.status(400).json({ error: 'Status filter must be blocked, review_required, or metadata_ready' });
        }

        where.push('exchange_connector_readiness_events.status = ?');
        params.push(status);
      }

      const rows = await dbAll(
        `${exchangeConnectorReadinessEventSelect}
         WHERE ${where.join(' AND ')}
         ORDER BY exchange_connector_readiness_events.created_at DESC, exchange_connector_readiness_events.id DESC
         LIMIT 100`,
        params
      );

      res.json({ events: rows.map(parseExchangeConnectorReadinessEvent) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/exchange-connector-readiness-events/:id', requireAuth, async (req, res) => {
    try {
      const event = parseExchangeConnectorReadinessEvent(await getExchangeConnectorReadinessEventRow(req.params.id));

      if (!event) {
        return res.status(404).json({ error: 'Exchange connector readiness event not found' });
      }

      res.json({ event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/exchange-adapter-contracts', requireAuth, (req, res) => {
    try {
      res.json({
        implemented: false,
        contracts: Array.from(exchangeAdapterContractExchanges)
          .sort()
          .map(exchangeName => createExchangeAdapterContractSpec(exchangeName))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/exchange-adapter-scaffolds', requireAuth, (req, res) => {
    try {
      res.json({
        implemented: false,
        credentialLoadingEnabled: false,
        networkCallsEnabled: false,
        liveExecution: {
          enabled: false,
          orderEndpointEnabled: false,
          goLiveAllowed: false,
          note: 'Adapter scaffolds are disabled module shapes only. They cannot load credentials or call exchanges.'
        },
        scaffolds: getExchangeAdapterScaffolds()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/exchange-adapter-scaffolds/:exchangeName', requireAuth, (req, res) => {
    try {
      const scaffold = getExchangeAdapterScaffold(req.params.exchangeName);

      if (!scaffold) {
        return res.status(404).json({ error: 'Exchange adapter scaffold not found' });
      }

      res.json({ scaffold });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/exchange-connectors/:id/adapter-contract-check', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const contract = evaluateExchangeAdapterContract({ connector });
      const result = await dbRun(
        `INSERT INTO exchange_adapter_contract_events
         (connector_id, user_id, status, contract_json)
         VALUES (?, ?, ?, ?)`,
        [
          connector.id,
          req.session.userId,
          contract.status,
          JSON.stringify(contract)
        ]
      );
      const event = parseExchangeAdapterContractEvent(await getExchangeAdapterContractEventRow(result.lastID));

      res.json({ contract, event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/exchange-connectors/:id/adapter-contract-events', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const status = String(req.query.status || '').trim().toLowerCase();
      const allowedStatuses = new Set(['blocked', 'review_required', 'metadata_ready']);
      const where = ['exchange_adapter_contract_events.connector_id = ?'];
      const params = [connector.id];

      if (status) {
        if (!allowedStatuses.has(status)) {
          return res.status(400).json({ error: 'Status filter must be blocked, review_required, or metadata_ready' });
        }

        where.push('exchange_adapter_contract_events.status = ?');
        params.push(status);
      }

      const rows = await dbAll(
        `${exchangeAdapterContractEventSelect}
         WHERE ${where.join(' AND ')}
         ORDER BY exchange_adapter_contract_events.created_at DESC, exchange_adapter_contract_events.id DESC
         LIMIT 100`,
        params
      );

      res.json({ events: rows.map(parseExchangeAdapterContractEvent) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/exchange-adapter-contract-events/:id', requireAuth, async (req, res) => {
    try {
      const event = parseExchangeAdapterContractEvent(await getExchangeAdapterContractEventRow(req.params.id));

      if (!event) {
        return res.status(404).json({ error: 'Exchange adapter contract event not found' });
      }

      res.json({ event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerExchangeMetadataRoutes
};
