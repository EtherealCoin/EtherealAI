const crypto = require('crypto');
const {
  API_PROVIDER_CATEGORIES,
  API_PROVIDER_STATUSES,
  API_SAFETY_LEVELS,
  API_CREDENTIAL_MODES,
  DEX_MARKET_DATA_PROVIDER_REGISTRY,
  DEX_QUOTE_PROVIDER_REGISTRY,
  DEX_EXECUTION_LOCKED_REGISTRY,
  DEX_READONLY_PROVIDER_REGISTRY,
  buildApiConnectionCenterStatus
} = require('../lib/api-connection-center');

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
  dexMarketDataSetupGuides,
  recommendedReadOnlyExchanges,
  quoteOnlyConnectors,
  dexMarketDataConnectors,
  dexQuotePreviewConnectors,
  expandedReadOnlyMarketVenues,
  sanitizeCredentialInput,
  sanitizePermissionsChecklist,
  getReadOnlyReferenceName,
  saveReadOnlyVaultCredentials,
  loadReadOnlyVaultCredentials,
  deleteReadOnlyVaultCredentials,
  getReadOnlyVaultStatus,
  testReadOnlyExchangeConnection,
  compareReadOnlyPrices,
  scanReadOnlyArbitrageOpportunities,
  createPaperSimulationForOpportunity,
  buildLiveTradingLaunchRoadmap,
  buildDexConnectorCenterStatus,
  testDexMarketDataConnector,
  previewDexQuoteRoute,
  buildReadOnlyConnectionSummary,
  createPlainEnglishDexError,
  createPlainEnglishExchangeError,
  phase3RecommendedExchanges,
  universalOrderTypes,
  phase3AAccountStatuses,
  defaultLiveSafetyPolicy,
  exchangeCapabilityMatrix,
  websocketStreamSpecs,
  fetchSymbolTradingRules,
  scanAuthenticatedReadOnlyAccounts,
  normalizeUniversalOrderDraft,
  evaluateLiveExecutionSafety,
  buildWebSocketHealthPlan,
  buildAccountAwareArbitrageView,
  replaySpreadHistory,
  buildOutcomeBenchmark,
  buildPhase3AReadiness,
  buildPhase3BPreparationPlan,
  buildPhase3Status,
  sandboxOrderLifecycleStatuses,
  sandboxOrderTypes,
  sandboxExchangeAdapters,
  defaultSandboxPolicy,
  getSandboxAdapter,
  getSandboxReferenceName,
  sanitizeSandboxCredentialInput,
  sanitizeSandboxPermissionsChecklist,
  saveSandboxVaultCredentials,
  loadSandboxVaultCredentials,
  deleteSandboxVaultCredentials,
  getSandboxVaultStatus,
  normalizeSandboxOrderDraft,
  evaluateSandboxOrderSafety,
  runSandboxOrderLifecycle,
  buildPhase3BSandboxStatus,
  buildPhase3CPreparation,
  createPlainEnglishSandboxError,
  tinyLiveOwnerConfirmationPhrase,
  tinyLiveOrderStatuses,
  defaultTinyLivePolicy,
  tinyLiveExchangeAdapters,
  getTinyLiveAdapter,
  getTinyLiveReferenceName,
  sanitizeTinyLiveCredentialInput,
  sanitizeTinyLivePermissionsChecklist,
  saveTinyLiveVaultCredentials,
  loadTinyLiveVaultCredentials,
  deleteTinyLiveVaultCredentials,
  getTinyLiveVaultStatus,
  normalizeTinyLiveOrderDraft,
  createTinyLiveOrderFingerprint,
  detectTinyLivePermissions,
  evaluateTinyLiveOrderSafety,
  createTinyLiveOrderPreview,
  runTinyLiveOrderLifecycle,
  cancelTinyLiveOrder,
  getTinyLiveOrderStatus,
  buildTinyLiveApprovalCenter,
  createPlainEnglishTinyLiveError,
  phase4Status,
  defaultPhase4RiskPolicy,
  phase4SupportedVenues,
  phase4NetworkCostBaselines,
  buildLiveArbitrageCommandCenter,
  phase5AiModes,
  phase5Status,
  defaultPhase5TreasuryPolicy,
  buildTreasuryLiquidityCommandCenter,
  phase6EnableLiveConfirmationPhrase,
  phase6OrderConfirmationPhrase,
  phase6ApprovalScopeTypes,
  phase6OrderStatuses,
  defaultPhase6Policy,
  phase6ProductionAdapters,
  phase6BRecommendedFirstExchange,
  phase6CRecommendedFirstExchange,
  phase6DRecommendedFirstExchange,
  phase6ERecommendedFirstExchange,
  phase6FRecommendedFirstExchange,
  phase6FEnableConfirmationPhrase,
  phase6DArmConfirmationPhrase,
  defaultPhase6DTinyLivePolicy,
  krakenPhase6EWalkthrough,
  phase6BActivationExchangeGuides,
  getProductionAdapter,
  getProductionReferenceName,
  sanitizeProductionCredentialInput,
  sanitizeProductionPermissionsChecklist,
  saveProductionVaultCredentials,
  loadProductionVaultCredentials,
  deleteProductionVaultCredentials,
  getProductionVaultStatus,
  getProductionVaultReadbackDiagnostics,
  clearKrakenAuthRuntimeState,
  normalizeProductionOrderDraft,
  createProductionOrderFingerprint,
  testProductionExchangeConnection,
  evaluateProductionOrderSafety,
  createProductionOrderPreview,
  runProductionOrderLifecycle,
  queryProductionOrderStatus,
  cancelProductionOrder,
  buildPhase6ApprovalCenter,
  buildExchangeVerificationChecklist,
  buildProductionActivationWizard,
  verifyProductionExchangeCredentials,
  buildPhase6CProductionDryRunProof,
  buildPhase6CTinyLiveEligibility,
  buildPhase6CWizard,
  runKrakenAuthenticatedIntegration,
  buildPhase6DLiveOrderSimulationPreview,
  buildPhase6DProductionPreflight,
  buildPhase6DTinyLiveFramework,
  buildPhase6DWizard,
  buildPhase6EFinalStatus,
  buildPhase6EWalkthrough,
  buildKrakenCredentialDiagnostics,
  runKrakenLocalAuthSelfTest,
  classifyKrakenAuthDiagnosticFailure,
  runKrakenAuthDiagnostics,
  classifyKrakenAuthenticationIssue,
  buildPhase6FTinyLivePreview,
  buildPhase6FOperatorResult,
  createProductionSafetyBoundary,
  createPlainEnglishProductionError,
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
  const krakenTinyLiveOrderConfirmationPhrase = 'I APPROVE THIS KRAKEN TINY LIVE TEST';
  const krakenTinyLiveMaxUsd = 10;
  const krakenTinyLiveOpenStatuses = new Set(['approved', 'submitted', 'accepted', 'partially_filled', 'pending', 'open']);
  const krakenTinyLiveIgnoredPhase6ApprovalChecks = new Set([
    'sandbox_validation',
    'global_live_approval',
    'exchange_approval',
    'strategy_approval',
    'symbol_approval',
    'capital_limit_approval'
  ]);

  function getConnectorRegistryEntryForConnector(connector) {
    return getExchangeConnectorRegistryEntry(connector?.settings?.registryId || connector?.exchange_name);
  }

  function getReadOnlyGuideForConnector(connector, registryEntry = null) {
    const exchangeId = normalizeExchangeId(registryEntry?.id || connector?.settings?.registryId || connector?.exchange_name);

    return exchangeReadOnlySetupGuides?.[exchangeId] || null;
  }

  function getConnectorByExchange(connectors = [], exchangeName) {
    const exchangeId = normalizeExchangeId(exchangeName);

    return connectors.find(connector => (
      normalizeExchangeId(connector?.settings?.registryId || connector?.exchange_name) === exchangeId
    )) || null;
  }

  function shortFingerprint(value = '') {
    const text = String(value || '');

    if (!text) return '';
    if (text.length <= 16) return text;

    return `${text.slice(0, 8)}...${text.slice(-6)}`;
  }

  function buildReadOnlyExchangeProviderStatus({
    exchangeName,
    displayName,
    connector,
    guide,
    vaultStatus
  }) {
    const readOnlyConnection = connector?.settings?.readOnlyConnection || {};
    const referenceName = readOnlyConnection.referenceName || connector?.secret_reference_name || null;
    const vaultEntry = referenceName
      ? (vaultStatus?.entries || []).find(entry => entry.referenceName === referenceName)
      : null;
    const hasCredential = Boolean(referenceName && vaultEntry);
    const lastConnectionStatus = String(readOnlyConnection.connectionStatus || connector?.status || '').toLowerCase();
    const connected = ['read_only_connected', 'quote_only_connected'].includes(lastConnectionStatus);
    const currentStatus = connected
      ? API_PROVIDER_STATUSES.CONNECTED
      : hasCredential
        ? API_PROVIDER_STATUSES.DRAFT
        : API_PROVIDER_STATUSES.NEEDS_KEY;
    const blockers = [];

    if (!hasCredential) {
      blockers.push({
        title: `${displayName} read-only key is not saved yet`,
        detail: 'Create a read/view-only key at the exchange, keep trading and transfers disabled, then save it to the local encrypted vault.'
      });
    }

    return {
      providerName: displayName,
      providerId: exchangeName,
      category: API_PROVIDER_CATEGORIES.CENTRALIZED_EXCHANGE,
      currentStatus,
      safetyLevel: API_SAFETY_LEVELS.READ_ONLY,
      lastCheckResult: readOnlyConnection.plainEnglishStatus
        || (connected
          ? `${displayName} read-only account check passed.`
          : `${displayName} is ready for a read-only key when you choose to connect it.`),
      lastCheckedAt: readOnlyConnection.lastTestAt || readOnlyConnection.lastCredentialRotationAt || null,
      blockers,
      nextRecommendedAction: connected
        ? `${displayName} read-only connection is working.`
        : hasCredential
          ? `Click Test ${displayName} Read-Only Connection.`
          : `Save a restricted ${displayName} read-only key when ready.`,
      advancedDiagnosticsLink: '/strategy-lab#exchange-connector-manager',
      metadata: {
        connectorId: connector?.id || null,
        keyExistsLocally: hasCredential,
        setupUrl: guide?.setupUrl || '',
        docsUrl: guide?.docsUrl || '',
        allowedPermissions: guide?.permissionsChecklist || [],
        forbiddenPermissions: [
          'Trading/order placement',
          'Withdrawals/transfers',
          'Margin/futures/leverage',
          'Admin/manage permissions'
        ],
        credentialFields: guide?.credentialFields || [],
        passphraseRequired: Boolean(guide?.passphraseRequired),
        apiKeyFingerprint: shortFingerprint(vaultEntry?.metadata?.apiKeyFingerprint || readOnlyConnection.apiKeyFingerprint || ''),
        secretValuesReturnedToUi: false
      }
    };
  }

  async function buildKrakenApiCenterProviderStatus({ userId, connectors }) {
    const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
    const productionConnection = connector?.settings?.productionConnection || {};
    const referenceName = productionConnection.referenceName || null;
    const vaultStatus = referenceName
      ? await getProductionVaultStatus(referenceName)
      : { exists: false, count: 0, entries: [] };
    const vaultReadback = referenceName
      ? await getProductionVaultReadbackDiagnostics(referenceName)
      : {
          exists: false,
          vaultDecodeSucceeded: false,
          secretValuesReturned: false
        };
    const [endpointCountRow, latestOrders, tinyGate] = await Promise.all([
      dbGet(
        `SELECT COUNT(*) AS count
         FROM production_order_executions
         WHERE user_id = ?
           AND exchange_name = 'kraken'
           AND production_order_endpoint_called = 1`,
        [userId]
      ),
      getLatestKrakenTinyLiveExecutions(userId, 10),
      buildKrakenTinyLiveGate({ userId }).catch(error => ({
        canPreview: false,
        canPlace: false,
        label: 'NEEDS REVIEW',
        plainEnglish: error.message,
        missing: [{ label: 'Tiny live eligibility could not be loaded', plainEnglish: error.message }]
      }))
    ]);
    const endpointCallCount = Number(endpointCountRow?.count || 0);
    const keySaved = Boolean(referenceName && vaultReadback.exists && vaultReadback.vaultDecodeSucceeded !== false);
    const unsafeDetected = String(productionConnection.phase6EReadiness?.status || '').toLowerCase().includes('unsafe');
    const dryRunReady = Boolean(
      productionConnection.phase6EFinalStatus?.readyForTinyLiveTest
      || productionConnection.phase6EPreflight?.technicalReady
      || latestOrders.some(order => String(order.phase || order.status || '').toLowerCase().includes('preview'))
      || tinyGate?.canPreview
    );
    const blockers = [];

    if (!keySaved) {
      blockers.push({
        title: 'Kraken key is not saved in the local vault',
        detail: 'Use Replace Kraken Key only after creating a restricted Kraken spot key. Secrets are not stored in SQLite.'
      });
    }

    if (unsafeDetected) {
      blockers.push({
        title: 'Unsafe Kraken permission was detected',
        detail: 'Delete this key and recreate it without withdrawals, transfers, margin, futures, or leverage.'
      });
    }

    if (keySaved && !dryRunReady) {
      blockers.push({
        title: 'Dry-run proof is not complete yet',
        detail: 'Run dry-run proof to preview the tiny test without calling the production order endpoint.'
      });
    }

    if (endpointCallCount > 0) {
      blockers.push({
        title: 'A Kraken live endpoint call already exists',
        detail: 'Track, reconcile, or cancel the existing tiny test before preparing another one.'
      });
    }

    const currentStatus = unsafeDetected || endpointCallCount > 0
      ? API_PROVIDER_STATUSES.BLOCKED
      : keySaved && dryRunReady
        ? API_PROVIDER_STATUSES.CONNECTED
        : keySaved
          ? API_PROVIDER_STATUSES.DRAFT
          : API_PROVIDER_STATUSES.NEEDS_KEY;

    return {
      providerName: 'Kraken',
      providerId: 'kraken',
      category: API_PROVIDER_CATEGORIES.CENTRALIZED_EXCHANGE,
      currentStatus,
      safetyLevel: API_SAFETY_LEVELS.DRY_RUN,
      lastCheckResult: productionConnection.plainEnglishStatus
        || tinyGate?.plainEnglish
        || (keySaved ? 'Kraken key exists locally. Run verification or dry-run proof next.' : 'No Kraken key is saved yet.'),
      lastCheckedAt: productionConnection.phase6EVerifiedAt
        || productionConnection.phase6EKeySavedAt
        || productionConnection.lastCredentialRotationAt
        || null,
      blockers,
      nextRecommendedAction: currentStatus === API_PROVIDER_STATUSES.CONNECTED
        ? 'Review tiny live eligibility from Live Trading Launch. API Center still cannot place orders.'
        : keySaved
          ? 'Run Kraken read/account access test, then dry-run proof.'
          : 'Replace Kraken key with a restricted spot key in the local encrypted vault.',
      advancedDiagnosticsLink: '/live-trading-launch#kraken-auth-diagnostics',
      metadata: {
        connectorId: connector?.id || null,
        keyExistsLocally: keySaved,
        credentialReferenceName: referenceName,
        apiKeyFingerprint: shortFingerprint(vaultReadback.apiKeyFingerprint || productionConnection.apiKeyFingerprint || ''),
        apiKeySha256Fingerprint: shortFingerprint(vaultReadback.apiKeySha256Fingerprint || productionConnection.apiKeySha256Fingerprint || ''),
        apiSecretSha256Fingerprint: shortFingerprint(vaultReadback.apiSecretSha256Fingerprint || productionConnection.apiSecretSha256Fingerprint || ''),
        vaultDecodeSucceeded: vaultReadback.vaultDecodeSucceeded === true,
        readbackMatchesMetadata: vaultReadback.readbackMatchesMetadata,
        timestampSaved: vaultReadback.timestampSaved || productionConnection.phase6EKeySavedAt || null,
        readAccountAccessAvailable: keySaved,
        rawBalanceEndpointTestAvailable: keySaved,
        dryRunProofAvailable: keySaved,
        dryRunProofReady: dryRunReady,
        tinyLiveEligibilityStatus: tinyGate?.label || 'LOCKED',
        tinyLiveEligibilityUnlocked: Boolean(tinyGate?.canPreview || dryRunReady),
        productionEndpointCallCount: endpointCallCount,
        latestOrders: latestOrders.slice(0, 3).map(order => ({
          id: order.id,
          status: order.status,
          phase: order.phase,
          endpointCalled: Boolean(order.production_order_endpoint_called),
          createdAt: order.created_at
        })),
        secretValuesReturnedToUi: false,
        productionOrderEndpointEnabledFromApiCenter: false,
        relatedConnectorCount: connectors.filter(item => normalizeExchangeId(item?.exchange_name) === 'kraken').length
      }
    };
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

  function mergeSandboxConnectionSettings(connector, updates = {}) {
    const currentSettings = connector?.settings && typeof connector.settings === 'object'
      ? connector.settings
      : {};
    const currentConnection = currentSettings.sandboxConnection && typeof currentSettings.sandboxConnection === 'object'
      ? currentSettings.sandboxConnection
      : {};

    return {
      ...currentSettings,
      sandboxConnection: {
        ...currentConnection,
        sandboxOnly: true,
        liveTradingEnabled: false,
        withdrawalsEnabled: false,
        walletSigningEnabled: false,
        productionOrderEndpointEnabled: false,
        valuesDisplayed: false,
        browserLocalStorageUsed: false,
        ...updates
      }
    };
  }

  function mergeTinyLiveConnectionSettings(connector, updates = {}) {
    const currentSettings = connector?.settings && typeof connector.settings === 'object'
      ? connector.settings
      : {};
    const currentConnection = currentSettings.tinyLiveConnection && typeof currentSettings.tinyLiveConnection === 'object'
      ? currentSettings.tinyLiveConnection
      : {};

    return {
      ...currentSettings,
      tinyLiveConnection: {
        ...currentConnection,
        manualTinyLiveOnly: true,
        automatedLiveTradingEnabled: false,
        unrestrictedLiveTradingEnabled: false,
        liveTradingLocked: true,
        walletSigningEnabled: false,
        withdrawalsEnabled: false,
        marginEnabled: false,
        futuresEnabled: false,
        leverageEnabled: false,
        valuesDisplayed: false,
        browserLocalStorageUsed: false,
        ...updates
      }
    };
  }

  function mergeProductionConnectionSettings(connector, updates = {}) {
    const currentSettings = connector?.settings && typeof connector.settings === 'object'
      ? connector.settings
      : {};
    const currentConnection = currentSettings.productionConnection && typeof currentSettings.productionConnection === 'object'
      ? currentSettings.productionConnection
      : {};

    return {
      ...currentSettings,
      productionConnection: {
        ...currentConnection,
        controlledProductionOnly: true,
        defaultLocked: true,
        automatedLiveTradingEnabled: false,
        unrestrictedAutonomousTradingEnabled: false,
        walletSigningEnabled: false,
        withdrawalsEnabled: false,
        marginEnabled: false,
        futuresEnabled: false,
        leverageEnabled: false,
        valuesDisplayed: false,
        browserLocalStorageUsed: false,
        ...updates
      }
    };
  }

  function parseSandboxOrderTest(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      user_id: row.user_id,
      connector_id: row.connector_id,
      risk_profile_id: row.risk_profile_id,
      exchange_name: row.exchange_name,
      symbol: row.symbol,
      side: row.side,
      order_type: row.order_type,
      quantity: row.quantity,
      limit_price: row.limit_price,
      notional_usd: row.notional_usd,
      client_order_id: row.client_order_id,
      exchange_order_id: row.exchange_order_id,
      status: row.status,
      safety: JSON.parse(row.safety_json || '{}'),
      request: JSON.parse(row.request_json || '{}'),
      result: JSON.parse(row.result_json || '{}'),
      live_trading_enabled: Boolean(row.live_trading_enabled),
      wallet_signing_enabled: Boolean(row.wallet_signing_enabled),
      withdrawals_enabled: Boolean(row.withdrawals_enabled),
      production_order_endpoint_enabled: Boolean(row.production_order_endpoint_enabled),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  function parseTinyLiveOrderTest(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      user_id: row.user_id,
      connector_id: row.connector_id,
      risk_profile_id: row.risk_profile_id,
      exchange_name: row.exchange_name,
      symbol: row.symbol,
      side: row.side,
      order_type: row.order_type,
      quantity: row.quantity,
      limit_price: row.limit_price,
      notional_usd: row.notional_usd,
      max_test_order_usd: row.max_test_order_usd,
      client_order_id: row.client_order_id,
      exchange_order_id: row.exchange_order_id,
      status: row.status,
      readiness: JSON.parse(row.readiness_json || '{}'),
      preview: JSON.parse(row.preview_json || '{}'),
      result: JSON.parse(row.result_json || '{}'),
      owner_confirmation_hash_present: Boolean(row.owner_confirmation_hash),
      automated_live_trading_enabled: Boolean(row.automated_live_trading_enabled),
      wallet_signing_enabled: Boolean(row.wallet_signing_enabled),
      withdrawals_enabled: Boolean(row.withdrawals_enabled),
      margin_enabled: Boolean(row.margin_enabled),
      futures_enabled: Boolean(row.futures_enabled),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  function parseLiveArbitrageCommandRun(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      user_id: row.user_id,
      symbol: row.symbol,
      status: row.status,
      options: JSON.parse(row.options_json || '{}'),
      commandCenter: JSON.parse(row.command_center_json || '{}'),
      safetyBoundary: JSON.parse(row.safety_boundary_json || '{}'),
      live_execution_enabled: Boolean(row.live_execution_enabled),
      withdrawals_enabled: Boolean(row.withdrawals_enabled),
      wallet_signing_enabled: Boolean(row.wallet_signing_enabled),
      margin_enabled: Boolean(row.margin_enabled),
      futures_enabled: Boolean(row.futures_enabled),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  function parseTreasuryIntelligenceRun(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      user_id: row.user_id,
      symbol: row.symbol,
      status: row.status,
      ai_mode: row.ai_mode,
      options: JSON.parse(row.options_json || '{}'),
      treasuryCommand: JSON.parse(row.treasury_command_json || '{}'),
      safetyBoundary: JSON.parse(row.safety_boundary_json || '{}'),
      autonomous_actions_enabled: Boolean(row.autonomous_actions_enabled),
      withdrawals_enabled: Boolean(row.withdrawals_enabled),
      wallet_signing_enabled: Boolean(row.wallet_signing_enabled),
      leverage_enabled: Boolean(row.leverage_enabled),
      futures_enabled: Boolean(row.futures_enabled),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  function parseTreasuryWalletRow(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      label: row.label,
      wallet_kind: row.wallet_kind,
      chain_family: row.chain_family,
      network: row.network,
      public_address: row.public_address || '',
      status: row.status,
      assignment: JSON.parse(row.assignment_json || '[]'),
      permissionScope: JSON.parse(row.permission_scope_json || '{}'),
      signingEnabled: Boolean(row.signing_enabled),
      liveExecutionEnabled: Boolean(row.live_execution_enabled)
    };
  }

  function parseProductionApproval(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      user_id: row.user_id,
      scope_type: row.scope_type,
      scope_value: row.scope_value,
      exchange_name: row.exchange_name,
      symbol: row.symbol,
      strategy_id: row.strategy_id,
      capital_limit_usd: row.capital_limit_usd,
      status: row.status,
      approval_hash_present: Boolean(row.approval_hash),
      acknowledgment: JSON.parse(row.acknowledgment_json || '{}'),
      expires_at: row.expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  function parseProductionOrderExecution(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      user_id: row.user_id,
      connector_id: row.connector_id,
      risk_profile_id: row.risk_profile_id,
      strategy_id: row.strategy_id,
      exchange_name: row.exchange_name,
      symbol: row.symbol,
      side: row.side,
      order_type: row.order_type,
      quantity: row.quantity,
      limit_price: row.limit_price,
      notional_usd: row.notional_usd,
      max_order_usd: row.max_order_usd,
      client_order_id: row.client_order_id,
      exchange_order_id: row.exchange_order_id,
      status: row.status,
      readiness: JSON.parse(row.readiness_json || '{}'),
      preview: JSON.parse(row.preview_json || '{}'),
      result: JSON.parse(row.result_json || '{}'),
      owner_confirmation_hash_present: Boolean(row.owner_confirmation_hash),
      production_order_endpoint_enabled: Boolean(row.production_order_endpoint_enabled),
      production_order_endpoint_called: Boolean(row.production_order_endpoint_called),
      automated_live_trading_enabled: Boolean(row.automated_live_trading_enabled),
      unrestricted_autonomous_trading_enabled: Boolean(row.unrestricted_autonomous_trading_enabled),
      wallet_signing_enabled: Boolean(row.wallet_signing_enabled),
      withdrawals_enabled: Boolean(row.withdrawals_enabled),
      margin_enabled: Boolean(row.margin_enabled),
      futures_enabled: Boolean(row.futures_enabled),
      leverage_enabled: Boolean(row.leverage_enabled),
      created_at: row.created_at,
      updated_at: row.updated_at
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

  async function loadConnectorReadOnlyCredentialsForUser(connector, userId) {
    const localReference = connector.secret_reference_id
      ? parseLocalSecretReference(await dbGet(
        'SELECT * FROM local_secret_references WHERE id = ? AND user_id = ?',
        [connector.secret_reference_id, userId]
      ))
      : null;
    const referenceName = connector.settings?.readOnlyConnection?.referenceName || localReference?.reference_name || null;

    if (!referenceName) {
      return null;
    }

    return loadReadOnlyVaultCredentials(referenceName);
  }

  async function loadConnectorSandboxCredentialsForUser(connector, userId) {
    const referenceName = connector.settings?.sandboxConnection?.referenceName || null;

    if (!referenceName) {
      return null;
    }

    const reference = await dbGet(
      'SELECT * FROM local_secret_references WHERE user_id = ? AND reference_name = ? AND status = ?',
      [userId, referenceName, 'configured']
    );

    if (!reference) {
      return null;
    }

    return loadSandboxVaultCredentials(referenceName);
  }

  async function loadConnectorTinyLiveCredentialsForUser(connector, userId) {
    const referenceName = connector.settings?.tinyLiveConnection?.referenceName || null;

    if (!referenceName) {
      return null;
    }

    const reference = await dbGet(
      'SELECT * FROM local_secret_references WHERE user_id = ? AND reference_name = ? AND status = ?',
      [userId, referenceName, 'configured']
    );

    if (!reference) {
      return null;
    }

    return loadTinyLiveVaultCredentials(referenceName);
  }

  async function loadConnectorProductionCredentialsForUser(connector, userId) {
    const referenceName = connector.settings?.productionConnection?.referenceName || null;

    if (!referenceName) {
      return null;
    }

    const reference = await dbGet(
      'SELECT * FROM local_secret_references WHERE user_id = ? AND reference_name = ? AND status = ?',
      [userId, referenceName, 'configured']
    );

    if (!reference) {
      return null;
    }

    return loadProductionVaultCredentials(referenceName);
  }

  async function getActiveLiveReadinessRiskProfile() {
    return dbGet(
      `SELECT *
       FROM risk_profiles
       WHERE status = 'active'
         AND kill_switch_enabled = 0
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`
    );
  }

  async function getLatestSandboxOrderTests(userId, limit = 10) {
    const rows = await dbAll(
      `SELECT *
       FROM sandbox_order_tests
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(parseSandboxOrderTest);
  }

  async function getLatestTinyLiveOrderTests(userId, limit = 10) {
    const rows = await dbAll(
      `SELECT *
       FROM tiny_live_order_tests
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(parseTinyLiveOrderTest);
  }

  async function getLatestLiveArbitrageCommandRuns(userId, limit = 5) {
    const rows = await dbAll(
      `SELECT *
       FROM live_arbitrage_command_runs
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(parseLiveArbitrageCommandRun);
  }

  async function getLatestTreasuryIntelligenceRuns(userId, limit = 5) {
    const rows = await dbAll(
      `SELECT *
       FROM treasury_intelligence_runs
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(parseTreasuryIntelligenceRun);
  }

  async function getLatestProductionApprovals(userId, limit = 100) {
    const rows = await dbAll(
      `SELECT *
       FROM production_execution_approvals
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(parseProductionApproval);
  }

  async function getLatestProductionOrders(userId, limit = 25) {
    const rows = await dbAll(
      `SELECT *
       FROM production_order_executions
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(parseProductionOrderExecution);
  }

  async function getTreasuryWallets(userId) {
    const rows = await dbAll(
      `SELECT *
       FROM owner_wallets
       WHERE user_id = ?
       ORDER BY updated_at DESC, id DESC`,
      [userId]
    );

    return rows.map(parseTreasuryWalletRow);
  }

  async function findOrCreateSandboxConnector({ exchangeName }) {
    const exchangeId = normalizeExchangeId(exchangeName);
    const rows = await dbAll(
      `${exchangeConnectorSelect}
       ORDER BY exchange_connectors.created_at DESC
       LIMIT 500`
    );
    const existing = rows.map(parseExchangeConnector).find(connector => (
      normalizeExchangeId(connector.settings?.registryId || connector.exchange_name) === exchangeId
    ));

    if (existing) {
      return existing;
    }

    const entry = getExchangeConnectorRegistryEntry(exchangeId);

    if (!entry) {
      return null;
    }

    const placeholder = createExchangeConnectorPlaceholderInput(entry, {
      mode: 'sandbox',
      status: 'disabled'
    });
    const result = await dbRun(
      `INSERT INTO exchange_connectors
       (exchange_name, label, mode, status, settings_json, secret_storage_note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        placeholder.exchangeName,
        placeholder.label,
        'sandbox',
        'disabled',
        JSON.stringify({
          ...(placeholder.settings || {}),
          sandboxConnection: {
            sandboxOnly: true,
            connectionStatus: 'not_connected',
            liveTradingEnabled: false,
            withdrawalsEnabled: false,
            walletSigningEnabled: false,
            productionOrderEndpointEnabled: false
          }
        }),
        'No credential values stored in SQLite.'
      ]
    );

    return parseExchangeConnector(await getExchangeConnectorRow(result.lastID));
  }

  async function findOrCreateTinyLiveConnector({ exchangeName }) {
    const exchangeId = normalizeExchangeId(exchangeName);
    const rows = await dbAll(
      `${exchangeConnectorSelect}
       ORDER BY exchange_connectors.created_at DESC
       LIMIT 500`
    );
    const existing = rows.map(parseExchangeConnector).find(connector => (
      normalizeExchangeId(connector.settings?.registryId || connector.exchange_name) === exchangeId
    ));

    if (existing) {
      return existing;
    }

    const entry = getExchangeConnectorRegistryEntry(exchangeId);

    if (!entry) {
      return null;
    }

    const placeholder = createExchangeConnectorPlaceholderInput(entry, {
      mode: 'read_only',
      status: 'disabled',
      labelSuffix: 'Tiny Live Locked Placeholder'
    });
    const result = await dbRun(
      `INSERT INTO exchange_connectors
       (exchange_name, label, mode, status, settings_json, secret_storage_note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        placeholder.exchangeName,
        placeholder.label,
        'read_only',
        'disabled',
        JSON.stringify({
          ...(placeholder.settings || {}),
          tinyLiveConnection: {
            manualTinyLiveOnly: true,
            connectionStatus: 'not_connected',
            liveTradingLocked: true,
            automatedLiveTradingEnabled: false,
            walletSigningEnabled: false,
            withdrawalsEnabled: false,
            marginEnabled: false,
            futuresEnabled: false,
            leverageEnabled: false
          }
        }),
        'No credential values stored in SQLite.'
      ]
    );

    return parseExchangeConnector(await getExchangeConnectorRow(result.lastID));
  }

  async function findOrCreateProductionConnector({ exchangeName }) {
    const exchangeId = normalizeExchangeId(exchangeName);
    const rows = await dbAll(
      `${exchangeConnectorSelect}
       ORDER BY exchange_connectors.created_at DESC
       LIMIT 500`
    );
    const existing = rows.map(parseExchangeConnector).find(connector => (
      normalizeExchangeId(connector.settings?.registryId || connector.exchange_name) === exchangeId
    ));

    if (existing) {
      return existing;
    }

    const entry = getExchangeConnectorRegistryEntry(exchangeId);

    if (!entry) {
      return null;
    }

    const placeholder = createExchangeConnectorPlaceholderInput(entry, {
      mode: 'read_only',
      status: 'disabled',
      labelSuffix: 'Production Locked Placeholder'
    });
    const result = await dbRun(
      `INSERT INTO exchange_connectors
       (exchange_name, label, mode, status, settings_json, secret_storage_note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        placeholder.exchangeName,
        placeholder.label,
        'read_only',
        'disabled',
        JSON.stringify({
          ...(placeholder.settings || {}),
          productionConnection: {
            controlledProductionOnly: true,
            connectionStatus: 'not_connected',
            liveTradingLocked: true,
            automatedLiveTradingEnabled: false,
            unrestrictedAutonomousTradingEnabled: false,
            walletSigningEnabled: false,
            withdrawalsEnabled: false,
            marginEnabled: false,
            futuresEnabled: false,
            leverageEnabled: false
          }
        }),
        'No credential values stored in SQLite.'
      ]
    );

    return parseExchangeConnector(await getExchangeConnectorRow(result.lastID));
  }

  async function recordSandboxOrderEvent({ testId, userId, status, summary, payload = {} }) {
    await dbRun(
      `INSERT INTO sandbox_order_events
       (sandbox_order_test_id, user_id, status, summary, payload_json)
       VALUES (?, ?, ?, ?, ?)`,
      [testId || null, userId, status, summary, JSON.stringify(payload || {})]
    );
  }

  async function recordTinyLiveOrderEvent({ testId, userId, status, summary, payload = {} }) {
    await dbRun(
      `INSERT INTO tiny_live_order_events
       (tiny_live_order_test_id, user_id, status, summary, payload_json)
       VALUES (?, ?, ?, ?, ?)`,
      [testId || null, userId, status, summary, JSON.stringify(payload || {})]
    );
  }

  async function recordProductionOrderEvent({ executionId, userId, status, summary, payload = {} }) {
    await dbRun(
      `INSERT INTO production_order_events
       (production_order_execution_id, user_id, status, summary, payload_json)
       VALUES (?, ?, ?, ?, ?)`,
      [executionId || null, userId, status, summary, JSON.stringify(payload || {})]
    );
  }

  async function recordLiveArbitrageCommandEvent({ runId, userId, eventType, status, summary, payload = {} }) {
    await dbRun(
      `INSERT INTO live_arbitrage_command_events
       (command_run_id, user_id, event_type, status, summary, payload_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [runId || null, userId, eventType, status, summary, JSON.stringify(payload || {})]
    );
  }

  async function recordTreasuryIntelligenceEvent({ runId, userId, eventType, status, summary, payload = {} }) {
    await dbRun(
      `INSERT INTO treasury_intelligence_events
       (treasury_run_id, user_id, event_type, status, summary, payload_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [runId || null, userId, eventType, status, summary, JSON.stringify(payload || {})]
    );
  }

  async function getTinyLiveExchangeReadiness({ connectors, userId }) {
    const readiness = {};

    for (const connector of connectors) {
      const exchangeId = normalizeExchangeId(connector.settings?.registryId || connector.exchange_name);
      const adapter = getTinyLiveAdapter(exchangeId);

      if (!adapter || !connector.settings?.tinyLiveConnection?.referenceName) {
        continue;
      }

      try {
        const credentials = await loadConnectorTinyLiveCredentialsForUser(connector, userId);

        if (credentials) {
          readiness[exchangeId] = await detectTinyLivePermissions({ credentials, adapter });
        }
      } catch (error) {
        readiness[exchangeId] = {
          status: 'error',
          canTrade: false,
          canWithdraw: null,
          spotAllowed: false,
          marginDetected: null,
          futuresDetected: null,
          plainEnglishStatus: createPlainEnglishTinyLiveError
            ? createPlainEnglishTinyLiveError(exchangeId, error)
            : error.message
        };
      }
    }

    return readiness;
  }

  async function getProductionExchangeReadiness({ connectors, userId }) {
    const readiness = {};

    for (const connector of connectors) {
      const exchangeId = normalizeExchangeId(connector.settings?.registryId || connector.exchange_name);
      const adapter = getProductionAdapter(exchangeId);

      if (!adapter || !connector.settings?.productionConnection?.referenceName) {
        continue;
      }

      try {
        const credentials = await loadConnectorProductionCredentialsForUser(connector, userId);

        if (credentials) {
          readiness[exchangeId] = await testProductionExchangeConnection({ credentials, adapter });
        }
      } catch (error) {
        readiness[exchangeId] = {
          status: 'error',
          canTrade: false,
          canWithdraw: null,
          spotAllowed: false,
          marginDetected: null,
          futuresDetected: null,
          plainEnglishStatus: createPlainEnglishProductionError
            ? createPlainEnglishProductionError(exchangeId, error)
            : error.message
        };
      }
    }

    return readiness;
  }

  async function buildTinyLiveSafetyContext({
    userId,
    orderInput,
    marketContext = {},
    ownerConfirmation = '',
    policy = {},
    ignoreTestId = null
  }) {
    const order = normalizeTinyLiveOrderDraft(orderInput || {});
    const adapter = getTinyLiveAdapter(order.exchangeName);
    const connector = await findOrCreateTinyLiveConnector({ exchangeName: order.exchangeName });
    const [riskProfile, credentials, latestSandboxTests, latestTinyLiveOrders] = await Promise.all([
      getActiveLiveReadinessRiskProfile(),
      connector ? loadConnectorTinyLiveCredentialsForUser(connector, userId) : Promise.resolve(null),
      getLatestSandboxOrderTests(userId, 25),
      getLatestTinyLiveOrderTests(userId, 25)
    ]);
    let livePermission = null;

    if (credentials && adapter) {
      try {
        livePermission = await detectTinyLivePermissions({ credentials, adapter });
      } catch (error) {
        livePermission = {
          status: 'error',
          canTrade: false,
          canWithdraw: null,
          spotAllowed: false,
          marginDetected: null,
          futuresDetected: null,
          plainEnglishStatus: createPlainEnglishTinyLiveError
            ? createPlainEnglishTinyLiveError(order.exchangeName, error)
            : error.message
        };
      }
    }

    const recentOrderFingerprints = latestTinyLiveOrders
      .filter(test => Number(test.id) !== Number(ignoreTestId || 0))
      .filter(test => Date.now() - Date.parse(test.created_at || new Date().toISOString()) <= Number(defaultTinyLivePolicy?.duplicateOrderWindowMs || 120000))
      .map(test => test.readiness?.orderFingerprint || test.preview?.orderFingerprint)
      .filter(Boolean);
    const effectiveMarketContext = {
      liquidityUsd: 1000000,
      slippagePercent: 0.05,
      priceTimestamp: new Date().toISOString(),
      ...(marketContext || {})
    };
    const safety = evaluateTinyLiveOrderSafety({
      order,
      adapter,
      connector,
      credentials,
      livePermission,
      readOnlyProfile: null,
      riskProfile,
      sandboxEvidence: latestSandboxTests,
      marketContext: effectiveMarketContext,
      recentOrderFingerprints,
      ownerConfirmation,
      policy: {
        ...(defaultTinyLivePolicy || {}),
        ...(policy || {})
      }
    });
    const preview = createTinyLiveOrderPreview({ order, safety, adapter, livePermission });

    return {
      order,
      adapter,
      connector,
      credentials,
      riskProfile,
      latestSandboxTests,
      latestTinyLiveOrders,
      livePermission,
      marketContext: effectiveMarketContext,
      safety,
      preview
    };
  }

  async function buildProductionSafetyContext({
    userId,
    orderInput,
    marketContext = {},
    accountContext = {},
    ownerConfirmation = '',
    policy = {},
    ignoreExecutionId = null
  }) {
    const order = normalizeProductionOrderDraft(orderInput || {});
    const adapter = getProductionAdapter(order.exchangeName);
    const connector = await findOrCreateProductionConnector({ exchangeName: order.exchangeName });
    const [riskProfile, credentials, latestSandboxTests, latestTinyLiveOrders, approvals, latestProductionOrders] = await Promise.all([
      getActiveLiveReadinessRiskProfile(),
      connector ? loadConnectorProductionCredentialsForUser(connector, userId) : Promise.resolve(null),
      getLatestSandboxOrderTests(userId, 25),
      getLatestTinyLiveOrderTests(userId, 25),
      getLatestProductionApprovals(userId, 100),
      getLatestProductionOrders(userId, 50)
    ]);
    let productionPermission = null;

    if (credentials && adapter) {
      try {
        productionPermission = await testProductionExchangeConnection({ credentials, adapter });
      } catch (error) {
        productionPermission = {
          status: 'error',
          canTrade: false,
          canWithdraw: null,
          spotAllowed: false,
          marginDetected: null,
          futuresDetected: null,
          plainEnglishStatus: createPlainEnglishProductionError
            ? createPlainEnglishProductionError(order.exchangeName, error)
            : error.message
        };
      }
    }

    const recentOrderFingerprints = latestProductionOrders
      .filter(test => Number(test.id) !== Number(ignoreExecutionId || 0))
      .filter(test => Date.now() - Date.parse(test.created_at || new Date().toISOString()) <= Number(defaultPhase6Policy?.duplicateOrderWindowMs || 120000))
      .map(test => test.readiness?.orderFingerprint || test.preview?.orderFingerprint)
      .filter(Boolean);
    const effectiveMarketContext = {
      liquidityUsd: 1000000,
      slippagePercent: 0.05,
      volatilityPercent: 0,
      netSpreadPercent: 0.1,
      latencyMs: 250,
      priceTimestamp: new Date().toISOString(),
      productionDryRunPassed: false,
      ...(marketContext || {})
    };
    const effectiveAccountContext = {
      exchangeExposureUsd: 0,
      strategyExposureUsd: 0,
      dailyDrawdownUsd: 0,
      rollingLossUsd: 0,
      repeatedFailures: 0,
      ...(accountContext || {})
    };
    const safety = evaluateProductionOrderSafety({
      order,
      adapter,
      connector,
      credentials,
      productionPermission,
      riskProfile,
      sandboxEvidence: latestSandboxTests,
      tinyLiveEvidence: latestTinyLiveOrders,
      approvals,
      marketContext: effectiveMarketContext,
      accountContext: effectiveAccountContext,
      recentOrderFingerprints,
      ownerConfirmation,
      policy: {
        ...(defaultPhase6Policy || {}),
        ...(policy || {})
      }
    });
    const preview = createProductionOrderPreview({ order, safety, adapter, productionPermission });

    return {
      order,
      adapter,
      connector,
      credentials,
      riskProfile,
      latestSandboxTests,
      latestTinyLiveOrders,
      latestProductionOrders,
      approvals,
      productionPermission,
      marketContext: effectiveMarketContext,
      accountContext: effectiveAccountContext,
      safety,
      preview
    };
  }

  async function loadPhase6CState({ userId, selectedExchangeName, credentialVerification = null, dryRunProof = null }) {
    const rows = await dbAll(
      `${exchangeConnectorSelect}
       ORDER BY exchange_connectors.created_at DESC
       LIMIT 500`
    );
    const connectors = rows.map(parseExchangeConnector);
    const [vaultStatus, approvals, latestOrders, latestSandboxTests, riskProfile] = await Promise.all([
      getProductionVaultStatus(),
      getLatestProductionApprovals(userId, 100),
      getLatestProductionOrders(userId, 25),
      getLatestSandboxOrderTests(userId, 25),
      getActiveLiveReadinessRiskProfile()
    ]);
    const exchangeReadiness = await getProductionExchangeReadiness({ connectors, userId });
    const wizard = buildPhase6CWizard({
      connectors,
      vaultStatus,
      approvals,
      latestOrders,
      riskProfile,
      latestSandboxTests,
      exchangeReadiness,
      selectedExchangeName,
      credentialVerification,
      dryRunProof
    });

    return {
      connectors,
      vaultStatus,
      approvals,
      latestOrders,
      latestSandboxTests,
      riskProfile,
      exchangeReadiness,
      wizard,
      safetyBoundary: createProductionSafetyBoundary(false)
    };
  }

  async function loadPhase6DState({
    userId,
    selectedExchangeName,
    krakenReadiness = null,
    dryRunProof = null,
    preflight = null,
    simulationPreview = null,
    policy = {},
    frameworkState = {}
  }) {
    const rows = await dbAll(
      `${exchangeConnectorSelect}
       ORDER BY exchange_connectors.created_at DESC
       LIMIT 500`
    );
    const connectors = rows.map(parseExchangeConnector);
    const [vaultStatus, latestOrders, riskProfile] = await Promise.all([
      getProductionVaultStatus(),
      getLatestProductionOrders(userId, 25),
      getActiveLiveReadinessRiskProfile()
    ]);
    const wizard = buildPhase6DWizard({
      connectors,
      vaultStatus,
      selectedExchangeName: selectedExchangeName || phase6DRecommendedFirstExchange || 'kraken',
      riskProfile,
      latestOrders,
      krakenReadiness,
      dryRunProof,
      preflight,
      simulationPreview,
      policy,
      frameworkState
    });

    return {
      connectors,
      vaultStatus,
      latestOrders,
      riskProfile,
      wizard,
      safetyBoundary: createProductionSafetyBoundary(false)
    };
  }

  async function loadPhase6EState({
    userId,
    krakenReadiness = null,
    dryRunProof = null,
    preflight = null,
    simulationPreview = null,
    policy = {},
    frameworkState = {}
  } = {}) {
    const connector = await findOrCreateProductionConnector({
      exchangeName: phase6ERecommendedFirstExchange || 'kraken'
    });
    const [vaultStatus, latestOrders, riskProfile] = await Promise.all([
      getProductionVaultStatus(),
      getLatestProductionOrders(userId, 25),
      getActiveLiveReadinessRiskProfile()
    ]);
    const wizard = buildPhase6EWalkthrough({
      connector,
      vaultStatus,
      krakenReadiness,
      dryRunProof,
      preflight,
      simulationPreview,
      riskProfile,
      latestOrders,
      policy,
      frameworkState
    });

    return {
      connector,
      vaultStatus,
      latestOrders,
      riskProfile,
      wizard,
      safetyBoundary: createProductionSafetyBoundary(false)
    };
  }

  async function loadPhase6FState({
    userId,
    krakenReadiness = null,
    dryRunProof = null,
    preflight = null,
    simulationPreview = null,
    policy = {},
    authError = null,
    modeState = null
  } = {}) {
    const connector = await findOrCreateProductionConnector({
      exchangeName: phase6FRecommendedFirstExchange || 'kraken'
    });
    const [vaultStatus, latestOrders, riskProfile] = await Promise.all([
      getProductionVaultStatus(),
      getLatestProductionOrders(userId, 25),
      getActiveLiveReadinessRiskProfile()
    ]);
    const result = buildPhase6FOperatorResult({
      connector,
      vaultStatus,
      krakenReadiness,
      dryRunProof,
      preflight,
      simulationPreview,
      riskProfile,
      latestOrders,
      policy,
      authError,
      modeState
    });

    return {
      connector,
      vaultStatus,
      latestOrders,
      riskProfile,
      result,
      safetyBoundary: createProductionSafetyBoundary(false)
    };
  }

  function buildKrakenTinyLiveStatusItem({ id, label, passed, plainEnglish, nextClick, statusWhenFalse = 'BLOCKED' }) {
    return {
      id,
      label,
      passed: Boolean(passed),
      status: passed ? 'SAFE' : statusWhenFalse,
      plainEnglish,
      nextClick: passed ? 'No action needed.' : nextClick
    };
  }

  function isKrakenTinyLiveExecution(execution = {}) {
    return Boolean(
      execution?.readiness?.phase6GKrakenTinyLiveTest
        || execution?.readiness?.krakenTinyLiveTest
        || execution?.preview?.phase6GKrakenTinyLiveTest
    );
  }

  function buildExactKrakenTinyLivePreview({ context, simulationPreview, ownerTinyLimitUsd }) {
    const order = context.order || {};
    const expectedPrice = Number(simulationPreview?.expectedFillPrice || order.limitPrice || 0);
    const quantity = Number(simulationPreview?.expectedQuantity || order.quantity || 0);
    const notionalUsd = Number(simulationPreview?.expectedNotionalUsd || order.notionalUsd || 0);
    const feesUsd = Number(simulationPreview?.expectedFeesUsd || (notionalUsd * 0.0026) || 0);
    const slippagePercent = Number(simulationPreview?.expectedSlippagePercent || 0.05);
    const worstCaseSpend = order.side === 'buy'
      ? Number((notionalUsd + feesUsd + (notionalUsd * slippagePercent / 100)).toFixed(8))
      : Number((feesUsd + (notionalUsd * slippagePercent / 100)).toFixed(8));

    return {
      exchange: 'Kraken',
      exchangeName: 'kraken',
      symbol: order.symbol,
      side: order.side,
      orderType: order.orderType,
      quantity,
      estimatedPrice: expectedPrice,
      estimatedFeesUsd: feesUsd,
      feePercent: Number(simulationPreview?.feePercent || 0.26),
      expectedSlippagePercent: slippagePercent,
      notionalUsd,
      ownerTinyLimitUsd,
      worstCaseSpend,
      estimatedRemainingBalance: simulationPreview?.expectedRemainingBalance || null,
      cancelRecoveryPlan: 'If the order is accepted but not filled, click Cancel Tiny Test Order. If anything looks wrong, click Emergency Stop to cancel any open tiny test order and keep automation disabled.',
      endpointCalled: false,
      liveOrderWillBePlacedOnlyAfterFinalApproval: true,
      safetyBoundary: createProductionSafetyBoundary(false)
    };
  }

  async function getLatestKrakenTinyLiveExecutions(userId, limit = 20) {
    const rows = await dbAll(
      `SELECT *
       FROM production_order_executions
       WHERE user_id = ?
         AND exchange_name = 'kraken'
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [userId, limit]
    );

    return rows.map(parseProductionOrderExecution).filter(isKrakenTinyLiveExecution);
  }

  function parseProductionOrderEvent(row) {
    if (!row) return null;

    return {
      id: row.id,
      executionId: row.production_order_execution_id,
      userId: row.user_id,
      status: row.status,
      summary: row.summary,
      payload: JSON.parse(row.payload_json || '{}'),
      createdAt: row.created_at
    };
  }

  async function getKrakenTinyLiveExecutionJournal({ userId, executionId, limit = 12 } = {}) {
    if (!executionId) return [];

    const rows = await dbAll(
      `SELECT *
       FROM production_order_events
       WHERE user_id = ?
         AND production_order_execution_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [userId, executionId, limit]
    );

    return rows.map(parseProductionOrderEvent).filter(Boolean);
  }

  function summarizeKrakenBalanceDelta(reconciliation = {}) {
    const before = new Map((reconciliation.beforeBalances || []).map(item => [item.asset, Number(item.free || 0)]));
    const after = new Map((reconciliation.afterBalances || []).map(item => [item.asset, Number(item.free || 0)]));
    const assets = new Set([...before.keys(), ...after.keys()]);
    const deltas = [...assets].map(asset => ({
      asset,
      before: before.get(asset) || 0,
      after: after.get(asset) || 0,
      delta: Number(((after.get(asset) || 0) - (before.get(asset) || 0)).toFixed(10))
    })).filter(item => item.delta !== 0);

    return {
      status: reconciliation.status || (deltas.length ? 'balances_changed' : 'balance_delta_not_available'),
      deltas,
      plainEnglish: deltas.length
        ? deltas.map(item => `${item.asset}: ${item.delta > 0 ? '+' : ''}${item.delta}`).join(' · ')
        : 'No balance delta is available yet. Track the order after placement to refresh reconciliation.'
    };
  }

  function buildKrakenTinyLiveAuditState({ execution = null, gate = null, journal = [] } = {}) {
    const endpointCalled = Boolean(
      execution?.production_order_endpoint_called
        || execution?.preview?.productionOrderEndpointCalled
        || execution?.result?.safetyBoundary?.productionOrderEndpointCalled
    );
    const liveExecutionOccurred = endpointCalled === true;
    const stateLabel = liveExecutionOccurred
      ? 'LIVE EXECUTION OCCURRED'
      : 'ENDPOINT CALLED: NO';

    return {
      stateLabel,
      endpointCalled,
      liveExecutionOccurred,
      oneOrderOnly: true,
      maxLiveTestUsd: krakenTinyLiveMaxUsd,
      productionOrderEndpointEnabled: Boolean(execution?.production_order_endpoint_enabled),
      orderAccepted: Boolean(execution?.exchange_order_id),
      orderId: execution?.exchange_order_id || '',
      fillStatus: execution?.status || 'not_submitted',
      exactRemainingOperatorAction: liveExecutionOccurred
        ? 'Track the tiny order. If it remains open, use Cancel Tiny Test Order or Emergency Stop. Do not run another tiny live order from this milestone.'
        : gate?.canPreview
          ? 'Review the exact order preview, copy the confirmation phrase, check both boxes, then click PLACE ONE TINY LIVE KRAKEN ORDER once.'
          : gate?.nextClick || 'Fix the visible blocked gate before continuing.',
      safetyLocks: [
        'No autonomous loops',
        'No repeated execution',
        'No withdrawals',
        'No wallet signing',
        'No leverage, margin, or futures',
        '$10 max tiny live size'
      ],
      journal: (journal || []).map(event => ({
        id: event.id,
        status: event.status,
        summary: event.summary,
        createdAt: event.createdAt
      }))
    };
  }

  function buildKrakenTinyLivePostTradeVerification({ execution = null, lifecycle = null } = {}) {
    const resultScreen = lifecycle?.resultScreen || execution?.result?.resultScreen || execution?.result || {};
    const reconciliation = lifecycle?.reconciliation || execution?.result?.reconciliation || resultScreen.reconciliation || {};
    const balanceDelta = summarizeKrakenBalanceDelta(reconciliation);
    const orderAccepted = Boolean(
      resultScreen.exchangeOrderId
        || execution?.exchange_order_id
        || lifecycle?.exchangeOrderId
    );

    return {
      title: 'Post-Trade Verification',
      orderAccepted,
      orderId: resultScreen.exchangeOrderId || execution?.exchange_order_id || lifecycle?.exchangeOrderId || '',
      fillStatus: resultScreen.fillStatus || execution?.status || lifecycle?.status || 'not_submitted',
      fees: resultScreen.fees ?? lifecycle?.resultScreen?.fees ?? Number((Number(execution?.notional_usd || 0) * 0.001).toFixed(8)),
      balanceDelta,
      rollbackGuidance: resultScreen.cancelRecoveryPlan
        || execution?.result?.cancelRecoveryPlan
        || 'If the order is open, click Cancel Tiny Test Order. If it filled and you want to close exposure, use the exchange UI manually or request a separate owner-approved sell-close workflow.',
      safetyBoundary: {
        noAutonomousTrading: true,
        noWithdrawals: true,
        noWalletSigning: true,
        oneOrderOnly: true
      }
    };
  }

  async function buildKrakenTinyLiveGate({
    userId,
    body = {},
    ownerConfirmation = '',
    ownerApprovalAccepted = false,
    emergencyStopArmed = false,
    requireFinalConfirmation = false,
    ignoreExecutionId = null
  } = {}) {
    const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
    const adapter = getProductionAdapter('kraken');
    const credentials = connector
      ? await loadConnectorProductionCredentialsForUser(connector, userId)
      : null;
    const ownerTinyLimitRaw = Number(
      body.ownerTinyLimitUsd
        || body.maxTinyLimitUsd
        || body.maxOrderUsd
        || body.order?.maxOrderUsd
        || krakenTinyLiveMaxUsd
    );
    const ownerTinyLimitUsd = Math.max(0, Math.min(ownerTinyLimitRaw || krakenTinyLiveMaxUsd, krakenTinyLiveMaxUsd));
    const requestedNotionalUsd = Number(body.notionalUsd || body.order?.notionalUsd || ownerTinyLimitUsd || krakenTinyLiveMaxUsd);
    const policy = {
      ...(defaultPhase6DTinyLivePolicy || {}),
      ...(body.policy || {}),
      exchangeName: 'kraken',
      defaultTinyOrderUsd: requestedNotionalUsd || krakenTinyLiveMaxUsd,
      maxOrderSizeUsd: ownerTinyLimitUsd,
      productionOrderEndpointEnabled: false,
      automatedLiveTradingEnabled: false,
      unrestrictedAutonomousTradingEnabled: false,
      walletSigningEnabled: false,
      withdrawalsEnabled: false,
      transfersEnabled: false,
      marginEnabled: false,
      futuresEnabled: false,
      leverageEnabled: false
    };
    const requestedOrder = {
      exchangeName: 'kraken',
      symbol: body.symbol || body.order?.symbol || policy.defaultSymbol || 'BTC/USD',
      side: body.side || body.order?.side || policy.defaultOrderSide || 'buy',
      orderType: body.orderType || body.order?.orderType || policy.defaultOrderType || 'limit',
      notionalUsd: requestedNotionalUsd,
      maxOrderUsd: ownerTinyLimitUsd,
      quantity: Number(body.quantity || body.order?.quantity || 0),
      limitPrice: Number(body.limitPrice || body.order?.limitPrice || 0),
      clientOrderId: body.clientOrderId || body.order?.clientOrderId || `ethkrakentiny${crypto.randomBytes(6).toString('hex')}`,
      strategyId: body.strategyId || body.order?.strategyId || null
    };

    if (!credentials) {
      const checks = [
        buildKrakenTinyLiveStatusItem({
          id: 'kraken_verified',
          label: 'Kraken key saved and verified',
          passed: false,
          plainEnglish: 'No restricted Kraken key is saved in the encrypted production vault.',
          nextClick: 'Start Kraken Live Setup Walkthrough, then save and verify the key.'
        })
      ];

      return {
        canPreview: false,
        canPlace: false,
        checks,
        missing: checks.filter(check => !check.passed),
        nextClick: checks[0].nextClick,
        exactOrderPreview: null,
        safetyBoundary: createProductionSafetyBoundary(false)
      };
    }

    const krakenReadiness = await runKrakenAuthenticatedIntegration({
      credentials,
      adapter,
      orderInput: requestedOrder,
      policy
    });
    const marketData = krakenReadiness?.credentialVerification?.proof?.marketData || {};
    const price = Number(
      requestedOrder.limitPrice
        || (requestedOrder.side === 'sell' ? marketData.bidPrice : marketData.askPrice)
        || marketData.midPrice
        || 0
    );
    const quantity = Number(requestedOrder.quantity || 0) > 0
      ? Number(requestedOrder.quantity)
      : price > 0
        ? Number((requestedNotionalUsd / price).toFixed(8))
        : 0;
    const dryRunOrder = {
      ...requestedOrder,
      quantity,
      limitPrice: price
    };
    const finalOwnerConfirmation = String(ownerConfirmation || '').trim();
    const finalConfirmationMatches = finalOwnerConfirmation === krakenTinyLiveOrderConfirmationPhrase;
    const context = await buildProductionSafetyContext({
      userId,
      orderInput: dryRunOrder,
      marketContext: {
        productionDryRunPassed: true,
        dryRunPassed: true,
        liquidityUsd: Number(marketData.liquidityUsd || 1000000),
        slippagePercent: Number(marketData.estimatedSlippagePercent ?? 0.05),
        volatilityPercent: 0,
        netSpreadPercent: Math.max(Number(marketData.spreadPercent || 0.1), Number(defaultPhase6Policy?.minNetSpreadPercent || 0.05)),
        latencyMs: Number(body.latencyMs || 250),
        priceTimestamp: marketData.priceTimestamp || new Date().toISOString()
      },
      accountContext: {
        exchangeExposureUsd: 0,
        strategyExposureUsd: 0,
        dailyDrawdownUsd: 0,
        rollingLossUsd: 0,
        repeatedFailures: 0,
        ...(body.accountContext || {})
      },
      ownerConfirmation: finalConfirmationMatches ? phase6OrderConfirmationPhrase : '',
      policy: {
        ...(defaultPhase6Policy || {}),
        maxOrderSizeUsd: ownerTinyLimitUsd,
        maxCapitalExposureUsd: ownerTinyLimitUsd,
        maxExchangeExposureUsd: ownerTinyLimitUsd,
        maxStrategyExposureUsd: ownerTinyLimitUsd,
        requireSandboxValidation: false,
        ...(body.productionPolicy || {})
      },
      ignoreExecutionId
    });
    const dryRunProof = buildPhase6CProductionDryRunProof({
      order: context.order,
      credentialVerification: krakenReadiness.credentialVerification,
      safety: context.safety,
      preview: context.preview,
      riskProfile: context.riskProfile,
      marketContext: context.marketContext,
      policy: {
        ...(defaultPhase6Policy || {}),
        maxOrderSizeUsd: ownerTinyLimitUsd
      }
    });
    const simulationPreview = buildPhase6DLiveOrderSimulationPreview({
      order: context.order,
      krakenReadiness,
      dryRunProof,
      policy
    });
    const preflight = buildPhase6DProductionPreflight({
      order: context.order,
      krakenReadiness,
      dryRunProof,
      riskProfile: context.riskProfile,
      simulationPreview,
      ownerApprovalTyped: finalConfirmationMatches,
      emergencyStopAvailable: true,
      policy
    });
    const phase6FResult = buildPhase6FOperatorResult({
      connector,
      krakenReadiness,
      dryRunProof,
      preflight,
      simulationPreview,
      riskProfile: context.riskProfile,
      latestOrders: context.latestProductionOrders,
      policy
    });
    const actualOrders = await getLatestKrakenTinyLiveExecutions(userId, 50);
    const priorLiveEndpointCall = actualOrders.find(order => (
      Number(order.id) !== Number(ignoreExecutionId || 0)
        && order.production_order_endpoint_called
    ));
    const openTinyOrders = actualOrders.filter(order => (
      Number(order.id) !== Number(ignoreExecutionId || 0)
        && order.production_order_endpoint_called
        && krakenTinyLiveOpenStatuses.has(String(order.status || '').toLowerCase())
    ));
    const recentActualDuplicate = actualOrders.find(order => (
      Number(order.id) !== Number(ignoreExecutionId || 0)
        && order.production_order_endpoint_called
        && (order.readiness?.orderFingerprint || order.preview?.orderFingerprint) === context.safety.orderFingerprint
        && Date.now() - Date.parse(order.created_at || new Date().toISOString()) <= Number(defaultPhase6Policy?.duplicateOrderWindowMs || 120000)
    ));
    const permissions = credentials.permissionsChecklist || {};
    const unsafePermissionDetected = krakenReadiness?.credentialVerification?.withdrawalPermissionDetected === true
      || krakenReadiness?.credentialVerification?.marginOrLeverageDetected === true
      || krakenReadiness?.credentialVerification?.futuresDetected === true
      || krakenReadiness?.status === 'Unsafe Permissions Detected';
    const withdrawalsDisabled = permissions.withdrawalsDisabled === true
      && permissions.transfersDisabled === true
      && krakenReadiness?.credentialVerification?.withdrawalPermissionDetected === false;
    const automationDisabled = policy.automatedLiveTradingEnabled === false
      && policy.unrestrictedAutonomousTradingEnabled === false
      && policy.walletSigningEnabled === false
      && policy.withdrawalsEnabled === false
      && policy.marginEnabled === false
      && policy.futuresEnabled === false
      && policy.leverageEnabled === false;
    const orderNotional = Number(context.order.notionalUsd || 0);
    const nonApprovalMissing = (context.safety.missing || []).filter(check => {
      if (krakenTinyLiveIgnoredPhase6ApprovalChecks.has(check.id)) return false;
      if (!requireFinalConfirmation && check.id === 'manual_order_confirmation') return false;
      if (check.id === 'duplicate_order_prevention' && !recentActualDuplicate) return false;
      return true;
    });
    const finalChecks = [
      buildKrakenTinyLiveStatusItem({
        id: 'kraken_verified',
        label: 'Kraken verified',
        passed: krakenReadiness.criticalPassed === true,
        plainEnglish: krakenReadiness.plainEnglishStatus || 'Kraken authenticated readiness must pass.',
        nextClick: 'Click Verify Kraken Connection.'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'unsafe_permissions_absent',
        label: 'No unsafe permissions',
        passed: !unsafePermissionDetected,
        plainEnglish: unsafePermissionDetected
          ? 'The Kraken key appears to include an unsafe permission.'
          : 'Withdrawals, transfers, margin, futures, and leverage are not detected.',
        nextClick: 'Delete this key and create a restricted spot-only Kraken key.',
        statusWhenFalse: 'UNSAFE'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'dry_run_preview_passed',
        label: 'No-order dry-run proof',
        passed: dryRunProof.passed === true,
        plainEnglish: dryRunProof.plainEnglishStatus || 'The no-order dry-run proof must pass first.',
        nextClick: dryRunProof.nextClick || 'Build Tiny Live Preview.'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'tiny_order_limit',
        label: 'Order is within the tiny live limit',
        passed: orderNotional > 0 && orderNotional <= ownerTinyLimitUsd && ownerTinyLimitUsd > 0 && ownerTinyLimitUsd <= krakenTinyLiveMaxUsd,
        plainEnglish: `This test is about $${orderNotional.toFixed(2)}. The owner tiny limit for this milestone is $${ownerTinyLimitUsd.toFixed(2)}.`,
        nextClick: `Lower the amount to $${krakenTinyLiveMaxUsd.toFixed(2)} or less.`
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'withdrawals_disabled',
        label: 'Withdrawals and transfers disabled',
        passed: withdrawalsDisabled,
        plainEnglish: withdrawalsDisabled ? 'The saved Kraken key is marked withdrawal/transfer disabled and Kraken did not report withdrawal access.' : 'Withdrawal/transfer safety is not proven.',
        nextClick: 'Create a restricted key with withdrawals/transfers off.',
        statusWhenFalse: 'UNSAFE'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'autonomous_disabled',
        label: 'Autonomous trading disabled',
        passed: automationDisabled,
        plainEnglish: 'No loops, scaling, wallet signing, withdrawals, margin, futures, or leverage are enabled for this tiny test.',
        nextClick: 'Keep automation disabled.'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'exchange_minimums',
        label: 'Kraken minimum size passed',
        passed: !(simulationPreview.abortConditions || []).some(item => /minimum|notional/i.test(item)),
        plainEnglish: 'The tiny order must satisfy Kraken minimum size and minimum value rules.',
        nextClick: 'Choose a different symbol or increase the owner tiny limit later if Kraken requires a higher minimum.'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'balance_sufficient',
        label: 'Balance available',
        passed: !(simulationPreview.abortConditions || []).some(item => /balance|sufficient/i.test(item)),
        plainEnglish: simulationPreview.expectedRemainingBalance
          ? `${simulationPreview.expectedRemainingBalance.asset} balance is checked before placement.`
          : 'Balance must be readable and sufficient before placement.',
        nextClick: 'Lower the amount or fund the Kraken spot account.'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'risk_profile_active',
        label: 'Risk profile active',
        passed: Boolean(context.riskProfile?.id) && context.riskProfile.status === 'active',
        plainEnglish: context.riskProfile?.id ? 'An active risk profile is present.' : 'No active risk profile exists.',
        nextClick: 'Activate a safe risk profile.'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'kill_switch_off',
        label: 'Kill switch off for this manual tiny test',
        passed: Boolean(context.riskProfile?.id) && Number(context.riskProfile.kill_switch_enabled || 0) === 0,
        plainEnglish: Number(context.riskProfile?.kill_switch_enabled || 0) === 0 ? 'The kill switch is off for the controlled manual test.' : 'The kill switch is on.',
        nextClick: 'Only turn the kill switch off when intentionally running this tiny manual test.'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'production_safety_checks',
        label: 'Final production safety checks passed',
        passed: nonApprovalMissing.length === 0,
        plainEnglish: nonApprovalMissing.length
          ? nonApprovalMissing.map(item => item.note || item.label).join(' ')
          : 'All non-approval production safety gates pass. Broad live-trading approvals are intentionally replaced by this one-order tiny gate.',
        nextClick: nonApprovalMissing[0]?.nextAction || 'Fix the blocked safety check.'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'no_duplicate_order',
        label: 'Duplicate-order prevention passed',
        passed: !recentActualDuplicate,
        plainEnglish: recentActualDuplicate ? 'A matching tiny live order was already sent recently.' : 'No recent matching live tiny order was sent.',
        nextClick: 'Wait before retrying or change the order.'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'no_open_tiny_order',
        label: 'No open tiny test order',
        passed: openTinyOrders.length === 0,
        plainEnglish: openTinyOrders.length ? 'An existing Kraken tiny test order may still be open.' : 'No open Kraken tiny test order is tracked.',
        nextClick: 'Cancel the open tiny test order or use Emergency Stop.'
      }),
      buildKrakenTinyLiveStatusItem({
        id: 'one_live_order_unused',
        label: 'One-order limit has not been used',
        passed: !priorLiveEndpointCall,
        plainEnglish: priorLiveEndpointCall
          ? 'A Kraken tiny live endpoint call already occurred for this owner-gated milestone. Repeated execution stays blocked.'
          : 'No Kraken tiny live endpoint call has occurred yet. This path can submit one manually approved order only.',
        nextClick: 'Do not place another tiny live order from this milestone. Track, cancel, or reconcile the existing order instead.',
        statusWhenFalse: 'LOCKED'
      })
    ];

    if (requireFinalConfirmation) {
      finalChecks.push(
        buildKrakenTinyLiveStatusItem({
          id: 'final_typed_confirmation',
          label: 'Final typed confirmation',
          passed: finalConfirmationMatches,
          plainEnglish: finalConfirmationMatches ? 'Owner typed the exact tiny-live confirmation phrase.' : `Type exactly: ${krakenTinyLiveOrderConfirmationPhrase}`,
          nextClick: 'Type the exact phrase shown on the page.'
        }),
        buildKrakenTinyLiveStatusItem({
          id: 'manual_owner_approval',
          label: 'Manual owner approval checked',
          passed: ownerApprovalAccepted === true,
          plainEnglish: ownerApprovalAccepted ? 'Owner approval checkbox is checked.' : 'The owner approval checkbox is not checked.',
          nextClick: 'Check the owner approval box.'
        }),
        buildKrakenTinyLiveStatusItem({
          id: 'emergency_stop_armed',
          label: 'Emergency Stop armed',
          passed: emergencyStopArmed === true,
          plainEnglish: emergencyStopArmed ? 'Emergency Stop is armed before placement.' : 'Emergency Stop must be armed before any tiny live order.',
          nextClick: 'Check the Emergency Stop armed box.'
        })
      );
    }

    const missing = finalChecks.filter(check => !check.passed);
    const canPreview = missing.filter(check => !['final_typed_confirmation', 'manual_owner_approval', 'emergency_stop_armed'].includes(check.id)).length === 0;
    const canPlace = requireFinalConfirmation && missing.length === 0;
    const exactOrderPreview = buildExactKrakenTinyLivePreview({
      context,
      simulationPreview,
      ownerTinyLimitUsd
    });

    return {
      canPreview,
      canPlace,
      label: canPlace ? 'READY TO PLACE ONE OWNER-APPROVED KRAKEN TINY LIVE ORDER' : canPreview ? 'READY FOR FINAL OWNER CONFIRMATION' : 'NOT READY',
      plainEnglish: canPlace
        ? 'Every Kraken tiny-live gate passed for one manual spot order. This does not enable loops, scaling, withdrawals, wallet signing, margin, futures, or leverage.'
        : canPreview
          ? 'The exact tiny order is ready to review. It will not be placed unless you type the final phrase, check the approval boxes, and click the final button.'
          : 'The tiny live test remains blocked until the visible items are fixed.',
      checks: finalChecks,
      missing,
      nextClick: missing[0]?.nextClick || (canPlace ? 'Click PLACE ONE TINY LIVE KRAKEN ORDER.' : 'Copy the phrase and check both boxes.'),
      exactRemainingOperatorAction: missing[0]?.nextClick || (canPlace ? 'Click PLACE ONE TINY LIVE KRAKEN ORDER once.' : 'Copy the phrase and check both boxes.'),
      finalApprovalChecklist: finalChecks,
      blockedGates: missing,
      connector,
      adapter,
      credentials,
      context,
      krakenReadiness,
      dryRunProof,
      simulationPreview,
      preflight,
      phase6F: phase6FResult,
      exactOrderPreview,
      ownerTinyLimitUsd,
      safetyBoundary: {
        ...createProductionSafetyBoundary(false),
        oneOwnerApprovedOrderOnly: canPlace,
        productionOrderEndpointEnabled: false,
        liveTradingEnabled: false,
        automatedLiveTradingEnabled: false,
        unrestrictedAutonomousTradingEnabled: false,
        walletSigningEnabled: false,
        withdrawalsEnabled: false,
        marginEnabled: false,
        futuresEnabled: false,
        leverageEnabled: false,
        productionOrderEndpointCalled: false
      }
    };
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
        dexMarketDataConnectors: dexMarketDataConnectors || [],
        dexQuotePreviewConnectors: dexQuotePreviewConnectors || [],
        expandedReadOnlyMarketVenues: expandedReadOnlyMarketVenues || [],
        cexGuides: Object.values(exchangeReadOnlySetupGuides || {}),
        dexMarketDataGuides: Object.values(dexMarketDataSetupGuides || {}),
        quoteOnlyGuides: Object.values(dexQuoteOnlySetupGuides || {}),
        safetyModel: {
          browserLocalStorageUsed: false,
          uiStoresCredentialValues: false,
          encryptedLocalVault: true,
          publicDexDataOnly: true,
          quotePreviewOnly: true,
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          swapsEnabled: false,
          tokenApprovalsEnabled: false,
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
        dexConnectorCenter: buildDexConnectorCenterStatus(),
        vaultStatus,
        statuses: ['Not Connected', 'Read-Only Connected', 'Error'],
        safetyModel: {
          marketDataOnly: true,
          quotePreviewOnly: true,
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          swapsEnabled: false,
          tokenApprovalsEnabled: false,
          orderEndpointEnabled: false,
          privateValuesReturnedToUi: false
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/api-connection-center/status', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const [readOnlyVaultStatus, krakenProvider, walletCountRow] = await Promise.all([
        getReadOnlyVaultStatus(),
        buildKrakenApiCenterProviderStatus({ userId: req.session.userId, connectors }),
        dbGet(
          `SELECT COUNT(*) AS count
           FROM owner_wallets
           WHERE user_id = ?`,
          [req.session.userId]
        ).catch(() => ({ count: 0 }))
      ]);
      const coinbaseProvider = buildReadOnlyExchangeProviderStatus({
        exchangeName: 'coinbase',
        displayName: 'Coinbase Advanced',
        connector: getConnectorByExchange(connectors, 'coinbase'),
        guide: exchangeReadOnlySetupGuides?.coinbase,
        vaultStatus: readOnlyVaultStatus
      });
      const apiCenter = buildApiConnectionCenterStatus({
        kraken: krakenProvider,
        coinbase: coinbaseProvider,
        dexReadOnlyProviders: DEX_READONLY_PROVIDER_REGISTRY,
        dexMarketDataProviders: DEX_MARKET_DATA_PROVIDER_REGISTRY,
        dexQuoteProviders: DEX_QUOTE_PROVIDER_REGISTRY,
        dexExecutionLockedProviders: DEX_EXECUTION_LOCKED_REGISTRY,
        walletMetadataCount: Number(walletCountRow?.count || 0)
      });

      res.json({
        apiCenter,
        statusModel: {
          categories: Object.values(API_PROVIDER_CATEGORIES),
          statuses: Object.values(API_PROVIDER_STATUSES),
          safetyLevels: Object.values(API_SAFETY_LEVELS),
          credentialModes: Object.values(API_CREDENTIAL_MODES)
        },
        readOnlyConnectionSummary: buildReadOnlyConnectionSummary(connectors),
        dexConnectorCenter: buildDexConnectorCenterStatus(),
        readOnlyVaultStatus,
        cexGuides: {
          kraken: exchangeReadOnlySetupGuides?.kraken || null,
          coinbase: exchangeReadOnlySetupGuides?.coinbase || null
        },
        dexReadOnlyRegistry: apiCenter.dexReadOnlyProviders,
        dexMarketDataRegistry: apiCenter.dexMarketDataProviders,
        dexQuotePreviewRegistry: apiCenter.dexQuoteProviders,
        dexExecutionLockedRegistry: apiCenter.dexExecutionLockedProviders,
        twoGateModel: {
          gateOne: 'Preview / Review',
          gateTwo: 'Final Confirm / Execute',
          maxVisibleOwnerGates: 2,
          backendChecksStillRun: true
        },
        safetyBoundary: apiCenter.safetyBoundary,
        advancedDiagnostics: {
          rawRoutesAvailableInAdvancedMode: true,
          krakenDiagnosticsPath: '/live-trading-launch#kraken-auth-diagnostics',
          connectorManagerPath: '/strategy-lab#exchange-connector-manager',
          secretValuesReturnedToUi: false
        }
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishExchangeError
          ? createPlainEnglishExchangeError('API Connection Center status', error)
          : error.message,
        liveTradingEnabled: false,
        walletSigningEnabled: false,
        withdrawalsEnabled: false,
        orderEndpointEnabled: false
      });
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

  app.get('/api/v1/dex-connectors/read-only/status', requireAuth, async (req, res) => {
    try {
      res.json({
        dexConnectorCenter: buildDexConnectorCenterStatus(),
        providerTypes: {
          marketData: dexMarketDataConnectors || [],
          quotePreview: dexQuotePreviewConnectors || [],
          executionLocked: true
        },
        safetyBoundary: {
          publicReadOnly: true,
          quotePreviewOnly: true,
          liveTradingEnabled: false,
          walletSigningEnabled: false,
          swapsEnabled: false,
          tokenApprovalsEnabled: false,
          withdrawalsEnabled: false,
          transfersEnabled: false,
          orderEndpointEnabled: false,
          transactionBroadcastEnabled: false,
          secretValuesReturnedToUi: false
        }
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishDexError
          ? createPlainEnglishDexError('DEX connector status', error)
          : error.message,
        liveTradingEnabled: false,
        walletSigningEnabled: false,
        swapsEnabled: false,
        tokenApprovalsEnabled: false
      });
    }
  });

  app.post('/api/v1/dex-connectors/read-only/test', requireAuth, async (req, res) => {
    try {
      const providerId = req.body?.providerId || 'dexscreener';
      const action = req.body?.action || 'search';
      const params = req.body?.params && typeof req.body.params === 'object' ? req.body.params : {};
      const result = await testDexMarketDataConnector({ providerId, action, params });

      res.json({
        result,
        dexConnectorCenter: buildDexConnectorCenterStatus({ latestMarketDataTest: result }),
        safetyBoundary: result.safetyBoundary || {
          publicReadOnly: true,
          liveTradingEnabled: false,
          walletSigningEnabled: false,
          swapsEnabled: false,
          tokenApprovalsEnabled: false,
          orderEndpointEnabled: false
        }
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishDexError
          ? createPlainEnglishDexError(req.body?.providerId || 'DEX market-data provider', error)
          : error.message,
        liveTradingEnabled: false,
        walletSigningEnabled: false,
        swapsEnabled: false,
        tokenApprovalsEnabled: false,
        orderEndpointEnabled: false
      });
    }
  });

  app.post('/api/v1/dex-connectors/quote-preview', requireAuth, async (req, res) => {
    try {
      const providerId = req.body?.providerId || 'jupiter';
      const params = req.body?.params && typeof req.body.params === 'object' ? req.body.params : {};
      const quotePreview = await previewDexQuoteRoute({ providerId, params });

      res.json({
        quotePreview,
        dexConnectorCenter: buildDexConnectorCenterStatus({ latestQuotePreview: quotePreview }),
        simpleModeNote: 'Quote preview only. No swap button, approval, wallet signature, transaction broadcast, order endpoint, or private key path is enabled.',
        safetyBoundary: quotePreview.safetyBoundary || {
          quotePreviewOnly: true,
          liveTradingEnabled: false,
          walletSigningEnabled: false,
          swapsEnabled: false,
          tokenApprovalsEnabled: false,
          orderEndpointEnabled: false,
          transactionBroadcastEnabled: false
        }
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishDexError
          ? createPlainEnglishDexError(req.body?.providerId || 'DEX quote provider', error)
          : error.message,
        liveTradingEnabled: false,
        walletSigningEnabled: false,
        swapsEnabled: false,
        tokenApprovalsEnabled: false,
        orderEndpointEnabled: false,
        transactionBroadcastEnabled: false
      });
    }
  });

  app.get('/api/v1/live-trading-launch/roadmap', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);

      res.json({
        roadmap: buildLiveTradingLaunchRoadmap({ connectors })
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/live-trading-launch/phase3/status', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);

      res.json({
        phase3: buildPhase3Status({ connectors }),
        capabilityMatrix: Object.values(exchangeCapabilityMatrix || {}),
        websocketPlan: buildWebSocketHealthPlan(),
        universalOrderModel: {
          supportedTypes: universalOrderTypes || [],
          dryRunOnly: true,
          liveOrderEndpointImplemented: false
        },
        defaultSafetyPolicy: defaultLiveSafetyPolicy,
        recommendedExchanges: phase3RecommendedExchanges || [],
        phase3AAccountStatuses: phase3AAccountStatuses || {},
        websocketStreamSpecs: Object.values(websocketStreamSpecs || {}),
        safetyBoundary: {
          readOnlyAccountData: true,
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          orderEndpointEnabled: false,
          ordersPlaced: false,
          dryRunOnly: true
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/live-trading-launch/phase3b/status', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const [vaultStatus, latestTests] = await Promise.all([
        getSandboxVaultStatus(),
        getLatestSandboxOrderTests(req.session.userId, 10)
      ]);
      const phase3B = buildPhase3BSandboxStatus({ connectors, vaultStatus, latestTests });
      const phase3C = buildPhase3CPreparation({ latestSandboxTests: latestTests });

      res.json({
        phase3B,
        phase3C,
        adapters: Object.values(sandboxExchangeAdapters || {}),
        orderLifecycleStatuses: sandboxOrderLifecycleStatuses || [],
        sandboxOrderTypes: sandboxOrderTypes || [],
        latestTests,
        safetyBoundary: phase3B.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/live-trading-launch/phase3c/status', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const [vaultStatus, latestSandboxTests, latestTinyLiveOrders, riskProfile] = await Promise.all([
        getTinyLiveVaultStatus(),
        getLatestSandboxOrderTests(req.session.userId, 25),
        getLatestTinyLiveOrderTests(req.session.userId, 25),
        getActiveLiveReadinessRiskProfile()
      ]);
      const exchangeReadiness = await getTinyLiveExchangeReadiness({
        connectors,
        userId: req.session.userId
      });
      const center = buildTinyLiveApprovalCenter({
        connectors,
        vaultStatus,
        latestSandboxTests,
        latestTinyLiveOrders,
        riskProfile,
        exchangeReadiness
      });

      res.json({
        center,
        adapters: Object.values(tinyLiveExchangeAdapters || {}),
        orderStatuses: tinyLiveOrderStatuses || [],
        latestOrders: latestTinyLiveOrders,
        approvalPhrase: tinyLiveOwnerConfirmationPhrase,
        safetyBoundary: center.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishTinyLiveError
          ? createPlainEnglishTinyLiveError('tiny live approval center', error)
          : error.message
      });
    }
  });

  app.get('/api/v1/live-trading-launch/phase4/status', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const latestRuns = await getLatestLiveArbitrageCommandRuns(req.session.userId, 5);
      const commandCenter = latestRuns[0]?.commandCenter || buildLiveArbitrageCommandCenter({
        connectors,
        scan: null,
        accountScan: null,
        websocketPlan: buildWebSocketHealthPlan(),
        options: {
          symbol: req.query?.symbol || 'BTC/USDT'
        },
        policy: defaultPhase4RiskPolicy
      });

      res.json({
        commandCenter,
        latestRuns,
        supportedVenues: phase4SupportedVenues || [],
        statuses: phase4Status || {},
        networkCostBaselines: phase4NetworkCostBaselines || {},
        safetyBoundary: commandCenter.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/live-trading-launch/phase4/command-center', requireAuth, async (req, res) => {
    try {
      const options = {
        symbol: req.body?.symbol || 'BTC/USDT',
        orderSizeUsd: req.body?.orderSizeUsd,
        minNetSpreadPercent: req.body?.minNetSpreadPercent,
        minLiquidityUsd: req.body?.minLiquidityUsd,
        maxLatencyMs: req.body?.maxLatencyMs,
        maxSlippagePercent: req.body?.maxSlippagePercent,
        maxCapitalPerExchangeUsd: req.body?.maxCapitalPerExchangeUsd,
        maxCapitalPerStrategyUsd: req.body?.maxCapitalPerStrategyUsd,
        quoteAsset: req.body?.quoteAsset || 'USDT'
      };
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const [scan, accountScan, sandboxVaultStatus, latestSandboxTests, latestTinyLiveOrders, tinyVaultStatus] = await Promise.all([
        scanReadOnlyArbitrageOpportunities({
          connectors,
          symbol: options.symbol,
          connectedOnly: req.body?.connectedOnly === true,
          includeExpanded: req.body?.includeExpanded !== false,
          minNetProfitPercent: options.minNetSpreadPercent,
          minLiquidityUsd: options.minLiquidityUsd,
          maxLatencyMs: options.maxLatencyMs,
          orderSizeUsd: options.orderSizeUsd,
          slippagePercent: options.maxSlippagePercent,
          maxVenues: req.body?.maxVenues || 16,
          maxCandidates: req.body?.maxCandidates || 24
        }),
        scanAuthenticatedReadOnlyAccounts({
          connectors,
          symbol: options.symbol,
          credentialLoader: connector => loadConnectorReadOnlyCredentialsForUser(connector, req.session.userId)
        }),
        getSandboxVaultStatus(),
        getLatestSandboxOrderTests(req.session.userId, 25),
        getLatestTinyLiveOrderTests(req.session.userId, 25),
        getTinyLiveVaultStatus()
      ]);
      const phase3B = buildPhase3BSandboxStatus({
        connectors,
        vaultStatus: sandboxVaultStatus,
        latestTests: latestSandboxTests
      });
      const riskProfile = await getActiveLiveReadinessRiskProfile();
      const exchangeReadiness = await getTinyLiveExchangeReadiness({ connectors, userId: req.session.userId });
      const phase3C = buildTinyLiveApprovalCenter({
        connectors,
        vaultStatus: tinyVaultStatus,
        latestSandboxTests,
        latestTinyLiveOrders,
        riskProfile,
        exchangeReadiness
      });
      const websocketPlan = buildWebSocketHealthPlan();
      const commandCenter = buildLiveArbitrageCommandCenter({
        connectors,
        scan,
        accountScan,
        phase3B,
        phase3C,
        websocketPlan,
        options,
        policy: {
          ...(defaultPhase4RiskPolicy || {}),
          globalKillSwitchEnabled: true,
          multiExchangeLiveExecutionEnabled: false,
          unrestrictedAutonomousScalingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          marginEnabled: false,
          futuresEnabled: false,
          leverageEnabled: false
        }
      });
      const insert = await dbRun(
        `INSERT INTO live_arbitrage_command_runs
         (user_id, symbol, status, options_json, command_center_json, safety_boundary_json,
          live_execution_enabled, withdrawals_enabled, wallet_signing_enabled, margin_enabled, futures_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          commandCenter.options.symbol,
          commandCenter.status,
          JSON.stringify(commandCenter.options),
          JSON.stringify(commandCenter),
          JSON.stringify(commandCenter.safetyBoundary),
          0,
          0,
          0,
          0,
          0
        ]
      );

      await recordLiveArbitrageCommandEvent({
        runId: insert.lastID,
        userId: req.session.userId,
        eventType: 'phase4_command_center_refresh',
        status: commandCenter.status,
        summary: 'Phase 4 Live Arbitrage Command Center refreshed in planning/monitoring mode. Multi-leg live execution remains locked.',
        payload: {
          topOpportunity: commandCenter.opportunityQueue?.[0] || null,
          safetyBoundary: commandCenter.safetyBoundary
        }
      });

      res.status(201).json({
        run: parseLiveArbitrageCommandRun(await dbGet('SELECT * FROM live_arbitrage_command_runs WHERE id = ? AND user_id = ?', [insert.lastID, req.session.userId])),
        commandCenter,
        scan,
        accountScan,
        safetyBoundary: commandCenter.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishExchangeError
          ? createPlainEnglishExchangeError('Phase 4 Live Arbitrage Command Center', error)
          : error.message,
        safetyBoundary: buildLiveArbitrageCommandCenter({}).safetyBoundary
      });
    }
  });

  app.get('/api/v1/live-trading-launch/phase5/status', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const [latestTreasuryRuns, latestPhase4Runs, wallets] = await Promise.all([
        getLatestTreasuryIntelligenceRuns(req.session.userId, 5),
        getLatestLiveArbitrageCommandRuns(req.session.userId, 5),
        getTreasuryWallets(req.session.userId)
      ]);
      const phase4 = latestPhase4Runs[0]?.commandCenter || buildLiveArbitrageCommandCenter({
        connectors,
        scan: null,
        accountScan: null,
        websocketPlan: buildWebSocketHealthPlan(),
        options: {
          symbol: req.query?.symbol || 'BTC/USDT'
        },
        policy: defaultPhase4RiskPolicy
      });
      const treasuryCommand = latestTreasuryRuns[0]?.treasuryCommand || buildTreasuryLiquidityCommandCenter({
        accountScan: null,
        scan: null,
        phase4,
        wallets,
        networkCostBaselines: phase4NetworkCostBaselines || {},
        options: {
          symbol: req.query?.symbol || 'BTC/USDT',
          aiMode: req.query?.aiMode || 'Manual Approval Required'
        },
        policy: defaultPhase5TreasuryPolicy
      });

      res.json({
        treasuryCommand,
        latestRuns: latestTreasuryRuns,
        phase4,
        aiModes: phase5AiModes || {},
        statuses: phase5Status || {},
        safetyBoundary: treasuryCommand.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/live-trading-launch/phase5/treasury-command-center', requireAuth, async (req, res) => {
    try {
      const options = {
        symbol: req.body?.symbol || 'BTC/USDT',
        orderSizeUsd: req.body?.orderSizeUsd,
        minNetSpreadPercent: req.body?.minNetSpreadPercent,
        minLiquidityUsd: req.body?.minLiquidityUsd,
        maxLatencyMs: req.body?.maxLatencyMs,
        maxSlippagePercent: req.body?.maxSlippagePercent,
        maxCapitalPerExchangeUsd: req.body?.maxCapitalPerExchangeUsd,
        maxCapitalPerStrategyUsd: req.body?.maxCapitalPerStrategyUsd,
        quoteAsset: req.body?.quoteAsset || 'USDT',
        aiMode: req.body?.aiMode || 'Manual Approval Required',
        planningCapitalUsd: req.body?.planningCapitalUsd,
        reserveRatioPercent: req.body?.reserveRatioPercent,
        maxExchangeConcentrationPercent: req.body?.maxExchangeConcentrationPercent,
        maxStablecoinConcentrationPercent: req.body?.maxStablecoinConcentrationPercent,
        maxStrategyCapitalPercent: req.body?.maxStrategyCapitalPercent,
        maxOpportunityCapitalPercent: req.body?.maxOpportunityCapitalPercent
      };
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const [scan, accountScan, wallets, sandboxVaultStatus, latestSandboxTests, latestTinyLiveOrders, tinyVaultStatus] = await Promise.all([
        scanReadOnlyArbitrageOpportunities({
          connectors,
          symbol: options.symbol,
          connectedOnly: req.body?.connectedOnly === true,
          includeExpanded: req.body?.includeExpanded !== false,
          minNetProfitPercent: options.minNetSpreadPercent,
          minLiquidityUsd: options.minLiquidityUsd,
          maxLatencyMs: options.maxLatencyMs,
          orderSizeUsd: options.orderSizeUsd,
          slippagePercent: options.maxSlippagePercent,
          maxVenues: req.body?.maxVenues || 16,
          maxCandidates: req.body?.maxCandidates || 24
        }),
        scanAuthenticatedReadOnlyAccounts({
          connectors,
          symbol: options.symbol,
          credentialLoader: connector => loadConnectorReadOnlyCredentialsForUser(connector, req.session.userId)
        }),
        getTreasuryWallets(req.session.userId),
        getSandboxVaultStatus(),
        getLatestSandboxOrderTests(req.session.userId, 25),
        getLatestTinyLiveOrderTests(req.session.userId, 25),
        getTinyLiveVaultStatus()
      ]);
      const phase3B = buildPhase3BSandboxStatus({
        connectors,
        vaultStatus: sandboxVaultStatus,
        latestTests: latestSandboxTests
      });
      const riskProfile = await getActiveLiveReadinessRiskProfile();
      const exchangeReadiness = await getTinyLiveExchangeReadiness({ connectors, userId: req.session.userId });
      const phase3C = buildTinyLiveApprovalCenter({
        connectors,
        vaultStatus: tinyVaultStatus,
        latestSandboxTests,
        latestTinyLiveOrders,
        riskProfile,
        exchangeReadiness
      });
      const phase4 = buildLiveArbitrageCommandCenter({
        connectors,
        scan,
        accountScan,
        phase3B,
        phase3C,
        websocketPlan: buildWebSocketHealthPlan(),
        options,
        policy: {
          ...(defaultPhase4RiskPolicy || {}),
          globalKillSwitchEnabled: true,
          multiExchangeLiveExecutionEnabled: false,
          unrestrictedAutonomousScalingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          marginEnabled: false,
          futuresEnabled: false,
          leverageEnabled: false
        }
      });
      const treasuryCommand = buildTreasuryLiquidityCommandCenter({
        accountScan,
        scan,
        phase4,
        wallets,
        networkCostBaselines: phase4NetworkCostBaselines || {},
        options,
        policy: {
          ...(defaultPhase5TreasuryPolicy || {}),
          treasuryKillSwitchEnabled: true,
          emergencyCapitalFreezeEnabled: true,
          autonomousTreasuryActionsEnabled: false,
          unrestrictedAutonomousScalingEnabled: false,
          unrestrictedLeverageEnabled: false,
          unrestrictedFuturesEnabled: false,
          unrestrictedWithdrawalsEnabled: false,
          unrestrictedWalletSigningEnabled: false,
          ownerApprovalRequired: true
        }
      });
      const insert = await dbRun(
        `INSERT INTO treasury_intelligence_runs
         (user_id, symbol, status, ai_mode, options_json, treasury_command_json, safety_boundary_json,
          autonomous_actions_enabled, withdrawals_enabled, wallet_signing_enabled, leverage_enabled, futures_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          treasuryCommand.options.symbol,
          treasuryCommand.status,
          treasuryCommand.aiMode,
          JSON.stringify(treasuryCommand.options),
          JSON.stringify(treasuryCommand),
          JSON.stringify(treasuryCommand.safetyBoundary),
          0,
          0,
          0,
          0,
          0
        ]
      );

      await recordTreasuryIntelligenceEvent({
        runId: insert.lastID,
        userId: req.session.userId,
        eventType: 'phase5_treasury_command_center_refresh',
        status: treasuryCommand.status,
        summary: 'Phase 5 Treasury Command Center refreshed in intelligence-only mode. Autonomous treasury actions remain locked.',
        payload: {
          aiMode: treasuryCommand.aiMode,
          selectedPlanningOpportunities: treasuryCommand.opportunityRanking.filter(item => item.selectedForPlanning).length,
          safetyBoundary: treasuryCommand.safetyBoundary
        }
      });

      res.status(201).json({
        run: parseTreasuryIntelligenceRun(await dbGet('SELECT * FROM treasury_intelligence_runs WHERE id = ? AND user_id = ?', [insert.lastID, req.session.userId])),
        treasuryCommand,
        phase4,
        scan,
        accountScan,
        safetyBoundary: treasuryCommand.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishExchangeError
          ? createPlainEnglishExchangeError('Phase 5 Treasury Command Center', error)
          : error.message,
        safetyBoundary: buildTreasuryLiquidityCommandCenter({}).safetyBoundary
      });
    }
  });

  app.get('/api/v1/live-trading-launch/phase6/status', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const [vaultStatus, approvals, latestOrders, latestSandboxTests, riskProfile] = await Promise.all([
        getProductionVaultStatus(),
        getLatestProductionApprovals(req.session.userId, 100),
        getLatestProductionOrders(req.session.userId, 25),
        getLatestSandboxOrderTests(req.session.userId, 25),
        getActiveLiveReadinessRiskProfile()
      ]);
      const center = buildPhase6ApprovalCenter({
        connectors,
        vaultStatus,
        approvals,
        latestOrders,
        riskProfile,
        latestSandboxTests
      });

      res.json({
        center,
        adapters: Object.values(phase6ProductionAdapters || {}),
        approvalScopeTypes: phase6ApprovalScopeTypes || [],
        orderStatuses: phase6OrderStatuses || [],
        latestOrders,
        approvals,
        approvalPhrase: phase6EnableLiveConfirmationPhrase,
        orderPhrase: phase6OrderConfirmationPhrase,
        defaultPolicy: defaultPhase6Policy,
        safetyBoundary: center.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6 Production Trading Command Center', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary ? createProductionSafetyBoundary(false) : {}
      });
    }
  });

  app.get('/api/v1/live-trading-launch/phase6b/wizard', requireAuth, async (req, res) => {
    try {
      const selectedExchangeName = normalizeExchangeId(req.query?.exchange || phase6BRecommendedFirstExchange || 'binance');
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const [vaultStatus, approvals, latestOrders, latestSandboxTests, riskProfile] = await Promise.all([
        getProductionVaultStatus(),
        getLatestProductionApprovals(req.session.userId, 100),
        getLatestProductionOrders(req.session.userId, 25),
        getLatestSandboxOrderTests(req.session.userId, 25),
        getActiveLiveReadinessRiskProfile()
      ]);
      const exchangeReadiness = await getProductionExchangeReadiness({
        connectors,
        userId: req.session.userId
      });
      const center = buildPhase6ApprovalCenter({
        connectors,
        vaultStatus,
        approvals,
        latestOrders,
        riskProfile,
        latestSandboxTests
      });
      const checklist = buildExchangeVerificationChecklist({
        connectors,
        vaultStatus,
        approvals,
        latestOrders,
        riskProfile,
        latestSandboxTests,
        exchangeReadiness
      });
      const wizard = buildProductionActivationWizard({
        connectors,
        vaultStatus,
        approvals,
        latestOrders,
        riskProfile,
        latestSandboxTests,
        exchangeReadiness,
        selectedExchangeName
      });

      res.json({
        wizard,
        checklist,
        center,
        exchangeReadiness,
        guides: phase6BActivationExchangeGuides || {},
        selectedExchangeName: wizard.selectedExchangeName,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6B activation wizard', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.get('/api/v1/live-trading-launch/phase6c/wizard', requireAuth, async (req, res) => {
    try {
      const selectedExchangeName = normalizeExchangeId(req.query?.exchange || phase6CRecommendedFirstExchange || phase6BRecommendedFirstExchange || 'kraken');
      const state = await loadPhase6CState({
        userId: req.session.userId,
        selectedExchangeName
      });

      res.json({
        wizard: state.wizard,
        exchangeReadiness: state.exchangeReadiness,
        recommendedExchangeName: state.wizard.recommendedExchangeName,
        selectedExchangeName: state.wizard.selectedExchangeName,
        safetyBoundary: state.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6C real credential verification wizard', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6c/verify-credentials', requireAuth, async (req, res) => {
    try {
      const exchangeName = normalizeExchangeId(req.body?.exchangeName || req.body?.exchange || phase6CRecommendedFirstExchange || 'kraken');
      const connector = await findOrCreateProductionConnector({ exchangeName });
      const adapter = getProductionAdapter(exchangeName);

      if (!connector || !adapter) {
        return res.status(400).json({
          error: 'Choose Kraken, Coinbase Advanced, Binance, OKX, or Bybit before verifying credentials.',
          nextClick: 'Choose one supported exchange.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const referenceName = connector?.settings?.productionConnection?.referenceName || null;
      const vaultReadbackBeforeVerify = referenceName
        ? await getProductionVaultReadbackDiagnostics(referenceName)
        : null;
      const credentials = await loadConnectorProductionCredentialsForUser(connector, req.session.userId);

      if (!credentials) {
        const state = await loadPhase6CState({
          userId: req.session.userId,
          selectedExchangeName: exchangeName
        });

        return res.status(409).json({
          error: `No encrypted production API key is saved for ${adapter.displayName}.`,
          nextClick: 'Click Add API Key Safely, save a restricted key to the production vault, then verify again.',
          wizard: state.wizard,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const verification = await verifyProductionExchangeCredentials({
        credentials,
        adapter,
        orderInput: {
          ...(phase6BActivationExchangeGuides?.[exchangeName]?.defaultOrder || {}),
          ...(req.body?.order || {}),
          exchangeName
        }
      });
      const settings = mergeProductionConnectionSettings(connector, {
        connectionStatus: verification.connectionStatus,
        plainEnglishStatus: verification.plainEnglishStatus,
        phase6CVerificationStatus: verification.status,
        lastPhase6CVerificationAt: new Date().toISOString(),
        phase6CVerification: {
          exchangeName: verification.exchangeName,
          displayName: verification.displayName,
          status: verification.status,
          passed: verification.passed,
          criticalPassed: verification.criticalPassed,
          connectionStatus: verification.connectionStatus,
          tradingPermissionPresent: verification.tradingPermissionPresent,
          withdrawalPermissionDetected: verification.withdrawalPermissionDetected,
          balancesReadable: verification.balancesReadable,
          feesLoaded: verification.feesLoaded,
          exactFeesLoaded: verification.exactFeesLoaded,
          symbolRulesLoaded: verification.symbolRulesLoaded,
          minimumOrderLoaded: verification.minimumOrderLoaded,
          livePriceLoaded: verification.livePriceLoaded,
          checklist: verification.checklist,
          checksPassed: verification.checksPassed,
          checksFailed: verification.checksFailed,
          proof: {
            permissions: verification.proof?.permissions,
            symbolRules: verification.proof?.symbolRules,
            accountLimits: verification.proof?.accountLimits,
            fees: verification.proof?.fees,
            rateLimits: verification.proof?.rateLimits,
            marketData: verification.proof?.marketData,
            proofSources: verification.proof?.proofSources
          },
          plainEnglishStatus: verification.plainEnglishStatus,
          secretValuesReturnedToUi: false,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        }
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          verification.status === 'Unsafe Permissions Detected' ? 'review_needed' : 'configured',
          JSON.stringify(settings),
          connector.id
        ]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6c_real_credential_verification',
          verification.passed ? 'complete' : 'review_needed',
          `${adapter.displayName} Phase 6C credential verification finished with status ${verification.status}.`,
          JSON.stringify({
            exchangeName,
            status: verification.status,
            checksPassed: verification.checksPassed,
            checksFailed: verification.checksFailed,
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            withdrawalsEnabled: false,
            walletSigningEnabled: false,
            automatedLiveTradingEnabled: false
          })
        ]
      );

      const state = await loadPhase6CState({
        userId: req.session.userId,
        selectedExchangeName: exchangeName,
        credentialVerification: verification
      });

      res.status(verification.passed ? 200 : 409).json({
        verification,
        wizard: state.wizard,
        nextClick: verification.nextClick,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError(req.body?.exchangeName || 'Phase 6C credential verification', error)
          : error.message,
        nextClick: 'Fix the credential, permission, internet, VPN, or exchange availability issue, then verify again.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6c/dry-run-proof', requireAuth, async (req, res) => {
    try {
      const exchangeName = normalizeExchangeId(req.body?.exchangeName || req.body?.exchange || phase6CRecommendedFirstExchange || 'kraken');
      const connector = await findOrCreateProductionConnector({ exchangeName });
      const adapter = getProductionAdapter(exchangeName);

      if (!connector || !adapter) {
        return res.status(400).json({
          error: 'Choose Kraken, Coinbase Advanced, Binance, OKX, or Bybit before running dry-run proof.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const credentials = await loadConnectorProductionCredentialsForUser(connector, req.session.userId);

      if (!credentials) {
        const state = await loadPhase6CState({ userId: req.session.userId, selectedExchangeName: exchangeName });

        return res.status(409).json({
          error: `No encrypted production API key is saved for ${adapter.displayName}.`,
          nextClick: 'Click Add API Key Safely, save a restricted key, then run the dry-run proof.',
          wizard: state.wizard,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const defaultOrder = phase6BActivationExchangeGuides?.[exchangeName]?.defaultOrder || {};
      const requestedOrder = {
        ...defaultOrder,
        ...(req.body?.order || {}),
        exchangeName
      };
      const verification = await verifyProductionExchangeCredentials({
        credentials,
        adapter,
        orderInput: requestedOrder
      });
      const marketData = verification.proof?.marketData || {};
      const dryRunOrder = {
        ...requestedOrder,
        limitPrice: Number(requestedOrder.limitPrice || 0) > 0
          ? Number(requestedOrder.limitPrice)
          : Number(marketData.askPrice || marketData.midPrice || requestedOrder.limitPrice || 0)
      };
      const context = await buildProductionSafetyContext({
        userId: req.session.userId,
        orderInput: dryRunOrder,
        marketContext: {
          productionDryRunPassed: true,
          dryRunPassed: true,
          liquidityUsd: Number(marketData.liquidityUsd || 1000000),
          slippagePercent: Number(marketData.estimatedSlippagePercent ?? 0.05),
          volatilityPercent: 0,
          netSpreadPercent: Math.max(Number(marketData.spreadPercent || 0.1), Number(defaultPhase6Policy?.minNetSpreadPercent || 0.05)),
          latencyMs: Number(req.body?.latencyMs || 250),
          priceTimestamp: marketData.priceTimestamp || new Date().toISOString()
        },
        accountContext: req.body?.accountContext || {},
        ownerConfirmation: '',
        policy: req.body?.policy || {}
      });
      const dryRunProof = buildPhase6CProductionDryRunProof({
        order: context.order,
        credentialVerification: verification,
        safety: context.safety,
        preview: context.preview,
        riskProfile: context.riskProfile,
        marketContext: context.marketContext,
        policy: {
          ...(defaultPhase6Policy || {}),
          ...(req.body?.policy || {})
        }
      });
      const status = dryRunProof.passed ? 'preview_ready' : 'preview_blocked';
      const insert = await dbRun(
        `INSERT INTO production_order_executions
         (user_id, connector_id, risk_profile_id, strategy_id, exchange_name, symbol, side, order_type,
          quantity, limit_price, notional_usd, max_order_usd, client_order_id, status, readiness_json,
          preview_json, production_order_endpoint_enabled, production_order_endpoint_called,
          automated_live_trading_enabled, unrestricted_autonomous_trading_enabled, wallet_signing_enabled,
          withdrawals_enabled, margin_enabled, futures_enabled, leverage_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          context.connector?.id || null,
          context.riskProfile?.id || null,
          context.order.strategyId,
          context.order.exchangeName,
          context.order.symbol,
          context.order.side,
          context.order.orderType,
          context.order.quantity,
          context.order.limitPrice || null,
          context.order.notionalUsd || 0,
          context.order.maxOrderUsd || 0,
          context.order.clientOrderId,
          status,
          JSON.stringify({
            phase6C: dryRunProof,
            fullProductionSafety: context.safety
          }),
          JSON.stringify({
            ...context.preview,
            phase6CDryRunProof: dryRunProof
          }),
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      );

      await recordProductionOrderEvent({
        executionId: insert.lastID,
        userId: req.session.userId,
        status,
        summary: dryRunProof.passed
          ? 'Phase 6C production dry-run proof passed. No production order endpoint was called.'
          : 'Phase 6C production dry-run proof is blocked. No production order endpoint was called.',
        payload: {
          dryRunProof,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        }
      });
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6c_production_dry_run_proof',
          status,
          dryRunProof.plainEnglishStatus,
          JSON.stringify({
            exchangeName,
            symbol: context.order.symbol,
            status,
            checksPassed: dryRunProof.checksPassed,
            checksFailed: dryRunProof.checksFailed,
            productionOrderEndpointCalled: false,
            withdrawalsEnabled: false,
            walletSigningEnabled: false,
            automatedLiveTradingEnabled: false
          })
        ]
      );

      const state = await loadPhase6CState({
        userId: req.session.userId,
        selectedExchangeName: exchangeName,
        credentialVerification: verification,
        dryRunProof
      });

      res.status(dryRunProof.passed ? 201 : 409).json({
        previewId: insert.lastID,
        verification,
        dryRunProof,
        execution: parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [insert.lastID, req.session.userId])),
        wizard: state.wizard,
        nextClick: dryRunProof.nextClick,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError(req.body?.exchangeName || 'Phase 6C production dry-run proof', error)
          : error.message,
        nextClick: 'Fix the failed dry-run input, credential, risk, balance, or market data issue, then retry.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.get('/api/v1/live-trading-launch/phase6d/framework', requireAuth, async (req, res) => {
    try {
      const selectedExchangeName = normalizeExchangeId(req.query?.exchange || phase6DRecommendedFirstExchange || 'kraken');
      const state = await loadPhase6DState({
        userId: req.session.userId,
        selectedExchangeName
      });

      res.json({
        wizard: state.wizard,
        recommendedExchangeName: state.wizard.recommendedExchangeName,
        selectedExchangeName: state.wizard.selectedExchangeName,
        armPhrase: phase6DArmConfirmationPhrase,
        safetyBoundary: state.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6D framework', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6d/kraken-authenticated-readiness', requireAuth, async (req, res) => {
    try {
      const exchangeName = normalizeExchangeId(req.body?.exchangeName || phase6DRecommendedFirstExchange || 'kraken');

      if (exchangeName !== 'kraken') {
        return res.status(400).json({
          error: 'Phase 6D is intentionally scoped to Kraken first.',
          nextClick: 'Choose Kraken.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const adapter = getProductionAdapter('kraken');

      if (!connector || !adapter) {
        return res.status(400).json({
          error: 'Kraken production connector is not available.',
          nextClick: 'Create the Kraken connector placeholder.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const credentials = await loadConnectorProductionCredentialsForUser(connector, req.session.userId);

      if (!credentials) {
        const state = await loadPhase6DState({ userId: req.session.userId, selectedExchangeName: 'kraken' });

        return res.status(409).json({
          error: 'No restricted Kraken API key is saved in the encrypted production vault.',
          nextClick: 'Click Add API Key Safely, save a restricted Kraken key, then run readiness again.',
          wizard: state.wizard,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const krakenReadiness = await runKrakenAuthenticatedIntegration({
        credentials,
        adapter,
        orderInput: {
          ...(req.body?.order || {}),
          exchangeName: 'kraken'
        },
        policy: req.body?.policy || {}
      });
      const settings = mergeProductionConnectionSettings(connector, {
        connectionStatus: krakenReadiness.credentialVerification?.connectionStatus || krakenReadiness.status,
        plainEnglishStatus: krakenReadiness.plainEnglishStatus,
        phase6DReadinessStatus: krakenReadiness.status,
        lastPhase6DReadinessAt: new Date().toISOString(),
        phase6DReadiness: krakenReadiness,
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          krakenReadiness.status === 'Unsafe Permissions Detected' ? 'review_needed' : 'configured',
          JSON.stringify(settings),
          connector.id
        ]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6d_kraken_authenticated_readiness',
          krakenReadiness.criticalPassed ? 'complete' : 'blocked',
          krakenReadiness.plainEnglishStatus,
          JSON.stringify({
            exchangeName: 'kraken',
            status: krakenReadiness.status,
            checksPassed: krakenReadiness.checksPassed,
            checksFailed: krakenReadiness.checksFailed,
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            withdrawalsEnabled: false,
            transfersEnabled: false,
            walletSigningEnabled: false,
            marginEnabled: false,
            futuresEnabled: false,
            leverageEnabled: false,
            autonomousTradingEnabled: false
          })
        ]
      );

      const state = await loadPhase6DState({
        userId: req.session.userId,
        selectedExchangeName: 'kraken',
        krakenReadiness
      });

      res.status(krakenReadiness.criticalPassed ? 200 : 409).json({
        krakenReadiness,
        wizard: state.wizard,
        nextClick: krakenReadiness.nextClick,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6D Kraken authenticated readiness', error)
          : error.message,
        nextClick: 'Fix the Kraken key, permissions, internet/VPN, or exchange availability issue, then run readiness again.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6d/prepare-tiny-live-test', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });

      if (!connector) {
        return res.status(400).json({
          error: 'Kraken production connector is not available.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const policy = {
        ...(defaultPhase6DTinyLivePolicy || {}),
        ...(req.body?.policy || {}),
        exchangeName: 'kraken',
        productionOrderEndpointEnabled: false
      };
      const order = normalizeProductionOrderDraft({
        exchangeName: 'kraken',
        symbol: req.body?.order?.symbol || policy.defaultSymbol || 'BTC/USD',
        side: req.body?.order?.side || policy.defaultOrderSide || 'buy',
        orderType: req.body?.order?.orderType || policy.defaultOrderType || 'limit',
        notionalUsd: Number(req.body?.order?.notionalUsd || policy.defaultTinyOrderUsd || 1),
        maxOrderUsd: Number(req.body?.order?.maxOrderUsd || policy.maxOrderSizeUsd || 5),
        quantity: Number(req.body?.order?.quantity || 0),
        limitPrice: Number(req.body?.order?.limitPrice || 0)
      });
      const frameworkState = {
        policy,
        order,
        armed: false,
        emergencyStopped: false,
        preparedAt: new Date().toISOString(),
        oneOrderOnly: true,
        noLoops: true,
        noAutonomousRetry: true,
        noScaling: true,
        noRecurringTrades: true,
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      };
      const settings = mergeProductionConnectionSettings(connector, {
        phase6DFramework: frameworkState,
        phase6DPreparedAt: frameworkState.preparedAt,
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [JSON.stringify(settings), connector.id]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6d_prepare_tiny_live_test',
          'prepared_locked',
          'Phase 6D tiny live framework prepared. No production order endpoint was called.',
          JSON.stringify(frameworkState)
        ]
      );

      const state = await loadPhase6DState({
        userId: req.session.userId,
        selectedExchangeName: 'kraken',
        policy,
        frameworkState
      });

      res.status(201).json({
        framework: state.wizard.framework,
        wizard: state.wizard,
        nextClick: 'Run Kraken Authenticated Readiness, then Validate Tiny Live Test.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6D prepare tiny live test', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6d/validate-tiny-live-test', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const adapter = getProductionAdapter('kraken');

      if (!connector || !adapter) {
        return res.status(400).json({
          error: 'Kraken production connector is not available.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const credentials = await loadConnectorProductionCredentialsForUser(connector, req.session.userId);

      if (!credentials) {
        const state = await loadPhase6DState({ userId: req.session.userId, selectedExchangeName: 'kraken' });

        return res.status(409).json({
          error: 'No restricted Kraken API key is saved in the encrypted production vault.',
          nextClick: 'Click Add API Key Safely, save a restricted Kraken key, then validate again.',
          wizard: state.wizard,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const policy = {
        ...(defaultPhase6DTinyLivePolicy || {}),
        ...(connector.settings?.productionConnection?.phase6DFramework?.policy || {}),
        ...(req.body?.policy || {}),
        exchangeName: 'kraken',
        productionOrderEndpointEnabled: false
      };
      const requestedOrder = {
        ...(connector.settings?.productionConnection?.phase6DFramework?.order || {}),
        ...(req.body?.order || {}),
        exchangeName: 'kraken',
        notionalUsd: Number(req.body?.order?.notionalUsd || connector.settings?.productionConnection?.phase6DFramework?.order?.notionalUsd || policy.defaultTinyOrderUsd || 1),
        maxOrderUsd: Number(req.body?.order?.maxOrderUsd || connector.settings?.productionConnection?.phase6DFramework?.order?.maxOrderUsd || policy.maxOrderSizeUsd || 5)
      };
      const krakenReadiness = await runKrakenAuthenticatedIntegration({
        credentials,
        adapter,
        orderInput: requestedOrder,
        policy
      });

      if (!krakenReadiness.criticalPassed) {
        const settings = mergeProductionConnectionSettings(connector, {
          phase6DReadiness: krakenReadiness,
          phase6DReadinessStatus: krakenReadiness.status,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        });

        await dbRun(
          `UPDATE exchange_connectors
           SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          ['review_needed', JSON.stringify(settings), connector.id]
        );
        const state = await loadPhase6DState({
          userId: req.session.userId,
          selectedExchangeName: 'kraken',
          krakenReadiness
        });

        return res.status(409).json({
          krakenReadiness,
          wizard: state.wizard,
          error: krakenReadiness.plainEnglishStatus,
          nextClick: krakenReadiness.nextClick,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const marketData = krakenReadiness.credentialVerification?.proof?.marketData || {};
      const price = Number(
        requestedOrder.limitPrice
          || (requestedOrder.side === 'sell' ? marketData.bidPrice : marketData.askPrice)
          || marketData.midPrice
          || 0
      );
      const quantity = Number(requestedOrder.quantity || 0) > 0
        ? Number(requestedOrder.quantity)
        : price > 0
          ? Number((Number(requestedOrder.notionalUsd || policy.defaultTinyOrderUsd || 1) / price).toFixed(8))
          : 0;
      const dryRunOrder = {
        ...requestedOrder,
        quantity,
        limitPrice: price
      };
      const context = await buildProductionSafetyContext({
        userId: req.session.userId,
        orderInput: dryRunOrder,
        marketContext: {
          productionDryRunPassed: true,
          dryRunPassed: true,
          liquidityUsd: Number(marketData.liquidityUsd || 1000000),
          slippagePercent: Number(marketData.estimatedSlippagePercent ?? 0.05),
          volatilityPercent: 0,
          netSpreadPercent: Math.max(Number(marketData.spreadPercent || 0.1), Number(defaultPhase6Policy?.minNetSpreadPercent || 0.05)),
          latencyMs: Number(req.body?.latencyMs || 250),
          priceTimestamp: marketData.priceTimestamp || new Date().toISOString()
        },
        accountContext: {
          exchangeExposureUsd: 0,
          strategyExposureUsd: 0,
          dailyDrawdownUsd: 0,
          rollingLossUsd: 0,
          repeatedFailures: 0,
          ...(req.body?.accountContext || {})
        },
        ownerConfirmation: '',
        policy: {
          ...(defaultPhase6Policy || {}),
          maxOrderSizeUsd: Number(policy.maxOrderSizeUsd || 5),
          requireSandboxValidation: false,
          ...(req.body?.productionPolicy || {})
        }
      });
      const dryRunProof = buildPhase6CProductionDryRunProof({
        order: context.order,
        credentialVerification: krakenReadiness.credentialVerification,
        safety: context.safety,
        preview: context.preview,
        riskProfile: context.riskProfile,
        marketContext: context.marketContext,
        policy: {
          ...(defaultPhase6Policy || {}),
          maxOrderSizeUsd: Number(policy.maxOrderSizeUsd || 5)
        }
      });
      const simulationPreview = buildPhase6DLiveOrderSimulationPreview({
        order: context.order,
        krakenReadiness,
        dryRunProof,
        policy
      });
      const preflight = buildPhase6DProductionPreflight({
        order: context.order,
        krakenReadiness,
        dryRunProof,
        riskProfile: context.riskProfile,
        simulationPreview,
        ownerApprovalTyped: false,
        emergencyStopAvailable: true,
        policy
      });
      const framework = buildPhase6DTinyLiveFramework({
        krakenReadiness,
        dryRunProof,
        preflight,
        simulationPreview,
        policy,
        armed: false
      });
      const status = preflight.technicalReady ? 'preview_ready' : 'preview_blocked';
      const insert = await dbRun(
        `INSERT INTO production_order_executions
         (user_id, connector_id, risk_profile_id, strategy_id, exchange_name, symbol, side, order_type,
          quantity, limit_price, notional_usd, max_order_usd, client_order_id, status, readiness_json,
          preview_json, production_order_endpoint_enabled, production_order_endpoint_called,
          automated_live_trading_enabled, unrestricted_autonomous_trading_enabled, wallet_signing_enabled,
          withdrawals_enabled, margin_enabled, futures_enabled, leverage_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          context.connector?.id || connector.id,
          context.riskProfile?.id || null,
          context.order.strategyId,
          context.order.exchangeName,
          context.order.symbol,
          context.order.side,
          context.order.orderType,
          context.order.quantity,
          context.order.limitPrice || null,
          context.order.notionalUsd || 0,
          context.order.maxOrderUsd || 0,
          context.order.clientOrderId,
          status,
          JSON.stringify({
            phase6D: {
              krakenReadiness,
              dryRunProof,
              preflight,
              framework
            },
            fullProductionSafety: context.safety
          }),
          JSON.stringify({
            ...context.preview,
            phase6D: {
              simulationPreview,
              preflight,
              dryRunProof
            }
          }),
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      );
      await recordProductionOrderEvent({
        executionId: insert.lastID,
        userId: req.session.userId,
        status,
        summary: preflight.technicalReady
          ? 'Phase 6D preflight passed for the tiny-live framework. No production order endpoint was called.'
          : 'Phase 6D preflight is blocked. No production order endpoint was called.',
        payload: {
          krakenReadinessStatus: krakenReadiness.status,
          dryRunProofStatus: dryRunProof.status,
          preflightStatus: preflight.status,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        }
      });

      const settings = mergeProductionConnectionSettings(connector, {
        phase6DReadiness: krakenReadiness,
        phase6DReadinessStatus: krakenReadiness.status,
        phase6DDryRunProof: dryRunProof,
        phase6DPreflight: preflight,
        phase6DSimulationPreview: simulationPreview,
        phase6DFramework: {
          ...(connector.settings?.productionConnection?.phase6DFramework || {}),
          policy,
          order: context.order,
          armed: false,
          emergencyStopped: false,
          lastValidatedAt: new Date().toISOString(),
          productionOrderExecutionId: insert.lastID,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        },
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          preflight.technicalReady ? 'configured' : 'review_needed',
          JSON.stringify(settings),
          connector.id
        ]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6d_validate_tiny_live_test',
          status,
          preflight.plainEnglishStatus,
          JSON.stringify({
            executionId: insert.lastID,
            checksPassed: preflight.checksPassed,
            checksFailed: preflight.checksFailed,
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            withdrawalsEnabled: false,
            walletSigningEnabled: false,
            marginEnabled: false,
            futuresEnabled: false,
            leverageEnabled: false,
            autonomousTradingEnabled: false
          })
        ]
      );

      const state = await loadPhase6DState({
        userId: req.session.userId,
        selectedExchangeName: 'kraken',
        krakenReadiness,
        dryRunProof,
        preflight,
        simulationPreview,
        policy,
        frameworkState: settings.productionConnection.phase6DFramework
      });

      res.status(preflight.technicalReady ? 201 : 409).json({
        previewId: insert.lastID,
        krakenReadiness,
        dryRunProof,
        simulationPreview,
        preflight,
        framework,
        execution: parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [insert.lastID, req.session.userId])),
        wizard: state.wizard,
        nextClick: preflight.nextClick,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6D validate tiny live test', error)
          : error.message,
        nextClick: 'Fix the failed Kraken readiness, balance, minimum size, risk profile, or market-data check, then validate again.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6d/arm-tiny-live-test', requireAuth, async (req, res) => {
    try {
      const confirmation = String(req.body?.confirmation || '').trim();
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });

      if (!connector) {
        return res.status(400).json({
          error: 'Kraken production connector is not available.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const productionConnection = connector.settings?.productionConnection || {};
      const preflight = productionConnection.phase6DPreflight || null;

      if (confirmation !== phase6DArmConfirmationPhrase) {
        return res.status(409).json({
          error: `Type exactly: ${phase6DArmConfirmationPhrase}`,
          nextClick: 'Type the Phase 6D arm phrase, then click Arm Tiny Live Test.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      if (preflight?.technicalReady !== true) {
        const state = await loadPhase6DState({ userId: req.session.userId, selectedExchangeName: 'kraken' });

        return res.status(409).json({
          error: 'Phase 6D preflight has not passed yet.',
          nextClick: 'Click Validate Tiny Live Test first.',
          wizard: state.wizard,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const frameworkState = {
        ...(productionConnection.phase6DFramework || {}),
        armed: true,
        armedAt: new Date().toISOString(),
        armedByOwner: true,
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false,
        liveOrderStillRequiresSeparateFinalApproval: true
      };
      const settings = mergeProductionConnectionSettings(connector, {
        phase6DFramework: frameworkState,
        phase6DFrameworkArmedAt: frameworkState.armedAt,
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [JSON.stringify(settings), connector.id]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6d_tiny_live_framework_armed',
          'armed_locked',
          'Phase 6D tiny live framework armed. Real order placement still requires separate final owner approval.',
          JSON.stringify({
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            withdrawalsEnabled: false,
            walletSigningEnabled: false,
            autonomousTradingEnabled: false,
            liveOrderStillRequiresSeparateFinalApproval: true
          })
        ]
      );

      const state = await loadPhase6DState({
        userId: req.session.userId,
        selectedExchangeName: 'kraken',
        frameworkState
      });

      res.json({
        framework: state.wizard.framework,
        wizard: state.wizard,
        nextClick: 'Review the armed framework. Do not place a live order until you explicitly instruct the next final tiny-live order phase.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6D arm tiny live framework', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6d/emergency-stop', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      let disabledCount = 0;

      for (const connector of connectors) {
        const productionConnection = connector.settings?.productionConnection || {};
        const settings = mergeProductionConnectionSettings(connector, {
          phase6DFramework: {
            ...(productionConnection.phase6DFramework || {}),
            armed: false,
            emergencyStopped: true,
            emergencyStoppedAt: new Date().toISOString(),
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false
          },
          liveTradingLocked: true,
          productionOrderEndpointEnabled: false,
          automatedLiveTradingEnabled: false,
          unrestrictedAutonomousTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          marginEnabled: false,
          futuresEnabled: false,
          leverageEnabled: false,
          disabledByPhase6DEmergencyStopAt: new Date().toISOString()
        });

        await dbRun(
          `UPDATE exchange_connectors
           SET mode = ?, status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            String(connector.mode || '').includes('live') ? 'read_only' : connector.mode,
            String(connector.mode || '').includes('live') ? 'disabled' : connector.status,
            JSON.stringify(settings),
            connector.id
          ]
        );
        disabledCount += productionConnection ? 1 : 0;
      }

      await dbRun(
        `UPDATE production_execution_approvals
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND status = ?`,
        ['emergency_disabled', req.session.userId, 'active']
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6d_emergency_stop',
          'complete',
          'Phase 6D emergency stop disabled production approvals, framework arming, and live connector flags.',
          JSON.stringify({
            disabledCount,
            productionOrderEndpointEnabled: false,
            productionOrderEndpointCalled: false,
            automatedLiveTradingEnabled: false,
            unrestrictedAutonomousTradingEnabled: false,
            walletSigningEnabled: false,
            withdrawalsEnabled: false,
            marginEnabled: false,
            futuresEnabled: false,
            leverageEnabled: false
          })
        ]
      );

      const state = await loadPhase6DState({ userId: req.session.userId, selectedExchangeName: 'kraken' });

      res.json({
        disabledCount,
        wizard: state.wizard,
        nextClick: 'All production live flags are disabled. Re-run readiness only after reviewing why Emergency Stop was used.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6D emergency stop', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.get('/api/v1/live-trading-launch/phase6e/walkthrough', requireAuth, async (req, res) => {
    try {
      const state = await loadPhase6EState({ userId: req.session.userId });

      res.json({
        wizard: state.wizard,
        walkthrough: krakenPhase6EWalkthrough,
        safetyBoundary: state.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6E Kraken walkthrough', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6e/save-kraken-key', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const adapter = getProductionAdapter('kraken');

      if (!connector || !adapter) {
        return res.status(400).json({
          error: 'Kraken production connector is not available.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const phase6EChecklist = req.body?.permissionsChecklist || {};
      const missing = [];
      const requireCheck = (key, label) => {
        if (phase6EChecklist[key] !== true) missing.push(label);
      };

      requireCheck('walkthroughReviewed', 'review the Kraken API key walkthrough');
      requireCheck('queryFundsEnabled', 'enable Query Funds');
      requireCheck('withdrawFundsDisabled', 'confirm Withdraw Funds is disabled');
      requireCheck('transfersDisabled', 'confirm transfers/funding movement are disabled');
      requireCheck('spotKeyOnly', 'confirm this is a Kraken spot API key, not a Kraken Futures key');
      requireCheck('marginDisabled', 'confirm margin is disabled/not used');
      requireCheck('futuresDisabled', 'confirm futures are disabled/not used');
      requireCheck('leverageDisabled', 'confirm leverage is disabled/not used');
      requireCheck('noMasterKey', 'confirm this is not a master, admin, root, or full-access key');
      requireCheck('privateKeyWillNotBeSharedElsewhere', 'confirm the private key will not be stored in unsafe places');
      requireCheck('ownerUnderstandsTinyLiveUsesRealMoneyLater', 'acknowledge a later tiny live test uses real money only after separate approval');
      requireCheck('ownerUnderstandsNoOrderYet', 'acknowledge no real order will be placed in Phase 6E');

      if (missing.length) {
        const state = await loadPhase6EState({ userId: req.session.userId });

        return res.status(400).json({
          error: 'Complete the visible Kraken safety checklist before saving this key.',
          missing,
          wizard: state.wizard,
          nextClick: 'Check the missing boxes, then click Save Kraken Key To Vault.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const permissionsChecklist = {
        productionKeyReviewed: true,
        spotTradingEnabled: Boolean(phase6EChecklist.modifyOrdersEnabled),
        withdrawalsDisabled: phase6EChecklist.withdrawFundsDisabled === true,
        transfersDisabled: phase6EChecklist.transfersDisabled === true,
        marginDisabled: phase6EChecklist.marginDisabled === true,
        futuresDisabled: phase6EChecklist.futuresDisabled === true,
        leverageDisabled: phase6EChecklist.leverageDisabled === true,
        ipRestrictionReviewed: Boolean(phase6EChecklist.ipRestrictionReviewed),
        twoFactorEnabled: Boolean(phase6EChecklist.twoFactorEnabled),
        ownerUnderstandsRealMoney: Boolean(phase6EChecklist.ownerUnderstandsTinyLiveUsesRealMoneyLater),
        ownerUnderstandsProductionRisk: true,
        ownerUnderstandsNoAutonomousScaling: true,
        phase6E: {
          walkthroughReviewed: true,
          queryFundsEnabled: true,
          queryOpenOrdersTradesEnabled: Boolean(phase6EChecklist.queryOpenOrdersTradesEnabled),
          queryClosedOrdersTradesReviewed: Boolean(phase6EChecklist.queryClosedOrdersTradesReviewed),
          modifyOrdersEnabled: Boolean(phase6EChecklist.modifyOrdersEnabled),
          cancelCloseOrdersEnabled: Boolean(phase6EChecklist.cancelCloseOrdersEnabled),
          withdrawFundsDisabled: true,
          depositFundsDisabled: Boolean(phase6EChecklist.depositFundsDisabled),
          spotKeyOnly: true,
          noFuturesKey: true,
          noMasterKey: Boolean(phase6EChecklist.noMasterKey),
          passphraseRequired: false,
          ownerUnderstandsNoOrderYet: true
        }
      };
      const credentials = sanitizeProductionCredentialInput({
        apiKey: req.body?.apiKey || req.body?.credentials?.apiKey,
        apiSecret: req.body?.apiSecret || req.body?.privateKey || req.body?.credentials?.apiSecret,
        passphrase: req.body?.passphrase || req.body?.credentials?.passphrase || ''
      }, adapter);
      const referenceName = getProductionReferenceName({
        userId: req.session.userId,
        connectorId: connector.id,
        exchangeName: 'kraken'
      });
      const previousVaultReadback = await getProductionVaultReadbackDiagnostics(referenceName);
      const runtimeClear = clearKrakenAuthRuntimeState();
      const reference = await upsertReadOnlyLocalReference({
        userId: req.session.userId,
        existingReferenceId: null,
        label: 'Kraken Phase 6E Restricted Production Vault',
        referenceName,
        notes: 'Encrypted local Phase 6E Kraken vault reference. No secret values are stored in SQLite or returned to the browser.'
      });
      const saved = await saveProductionVaultCredentials({
        referenceName,
        connector,
        exchangeName: 'kraken',
        credentials,
        permissionsChecklist
      });
      const previousConnection = connector.settings?.productionConnection || {};
      const settings = mergeProductionConnectionSettings(connector, {
        referenceName,
        localReferenceId: reference.id,
        connectionStatus: 'phase6e_key_saved_locked',
        plainEnglishStatus: saved.replacedExistingKey
          ? 'Existing Kraken key was replaced in the encrypted local vault. Previous verification and diagnostic state was cleared. Verify again before any dry-run proof. Live trading remains locked.'
          : 'Kraken key saved to the encrypted local vault. Verify it before any dry-run proof. Live trading remains locked.',
        phase6EChecklist: permissionsChecklist.phase6E,
        phase6EKeySavedAt: saved.rotatedAt,
        phase6EStatus: 'key_saved',
        phase6EReadiness: null,
        phase6EDryRunProof: null,
        phase6EPreflight: null,
        phase6ESimulationPreview: null,
        phase6EFinalStatus: null,
        phase6FReadiness: null,
        phase6FDryRunProof: null,
        phase6FPreflight: null,
        phase6FSimulationPreview: null,
        phase6FModeState: null,
        phase6DReadiness: null,
        phase6DDryRunProof: null,
        phase6DPreflight: null,
        phase6DSimulationPreview: null,
        krakenAuthDiagnostics: null,
        krakenAuthDiagnosticsAt: null,
        lastCredentialRotationAt: saved.rotatedAt,
        rotationNumber: Number(previousConnection.rotationNumber || 0) + 1,
        permissionsChecklist,
        apiKeyFingerprint: saved.apiKeyFingerprint,
        apiKeySha256Fingerprint: saved.apiKeySha256Fingerprint,
        apiSecretSha256Fingerprint: saved.apiSecretSha256Fingerprint,
        previousApiKeySha256Fingerprint: saved.previousApiKeySha256Fingerprint,
        previousApiSecretSha256Fingerprint: saved.previousApiSecretSha256Fingerprint,
        apiKeyFingerprintChanged: saved.apiKeyFingerprintChanged,
        apiSecretFingerprintChanged: saved.apiSecretFingerprintChanged,
        vaultRoundTripVerified: saved.vaultRoundTripVerified,
        vaultOverwriteVerified: saved.vaultOverwriteVerified,
        vaultReadback: saved.vaultReadback,
        previousVaultReadback,
        runtimeClear,
        latestCredentialSource: {
          source: 'encrypted_production_vault',
          referenceName,
          loadedAt: saved.timestampSaved,
          cacheClearedBeforeSave: true,
          secretValuesReturned: false
        },
        adapterStatus: adapter.adapterStatus,
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET status = ?, settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          'configured',
          JSON.stringify(settings),
          'Phase 6E Kraken credential values are encrypted in the local owner vault. SQLite stores only a reference.',
          connector.id
        ]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6e_kraken_key_saved',
          'key_saved_locked',
          'Phase 6E Kraken key saved to encrypted vault. Secret values were not returned. No order endpoint was called.',
          JSON.stringify({
            exchangeName: 'kraken',
            apiKeyFingerprint: saved.apiKeyFingerprint,
            apiKeySha256Fingerprint: saved.apiKeySha256Fingerprint,
            apiSecretSha256Fingerprint: saved.apiSecretSha256Fingerprint,
            previousApiKeySha256Fingerprint: saved.previousApiKeySha256Fingerprint,
            previousApiSecretSha256Fingerprint: saved.previousApiSecretSha256Fingerprint,
            apiKeyFingerprintChanged: saved.apiKeyFingerprintChanged,
            apiSecretFingerprintChanged: saved.apiSecretFingerprintChanged,
            vaultRoundTripVerified: saved.vaultRoundTripVerified,
            vaultOverwriteVerified: saved.vaultOverwriteVerified,
            vaultReadback: saved.vaultReadback,
            runtimeClear,
            secretValuesReturnedToUi: false,
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            withdrawalsEnabled: false,
            walletSigningEnabled: false,
            automatedLiveTradingEnabled: false
          })
        ]
      );

      const state = await loadPhase6EState({ userId: req.session.userId });

      res.status(201).json({
        saved: {
          stored: true,
          referenceName: saved.referenceName,
          apiKeyFingerprint: saved.apiKeyFingerprint,
          apiKeySha256Fingerprint: saved.apiKeySha256Fingerprint,
          apiSecretSha256Fingerprint: saved.apiSecretSha256Fingerprint,
          previousApiKeySha256Fingerprint: saved.previousApiKeySha256Fingerprint,
          previousApiSecretSha256Fingerprint: saved.previousApiSecretSha256Fingerprint,
          apiKeyFingerprintChanged: saved.apiKeyFingerprintChanged,
          apiSecretFingerprintChanged: saved.apiSecretFingerprintChanged,
          vaultRoundTripVerified: saved.vaultRoundTripVerified,
          vaultOverwriteVerified: saved.vaultOverwriteVerified,
          vaultReadback: saved.vaultReadback,
          operation: saved.operation,
          replacedExistingKey: saved.replacedExistingKey,
          latestCredentialSource: settings.productionConnection.latestCredentialSource,
          hasPassphrase: saved.hasExtraPhrase,
          secretValuesReturned: false
        },
        vaultReadback: saved.vaultReadback,
        runtimeClear,
        wizard: state.wizard,
        nextClick: 'Verify Kraken Key',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.statusCode || error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6E Kraken key save', error)
          : error.message,
        nextClick: 'Check the API key/private key fields and the safety checklist, then save again.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.delete('/api/v1/live-trading-launch/phase6e/kraken-key', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const referenceName = connector?.settings?.productionConnection?.referenceName || null;
      const previousVaultReadback = referenceName
        ? await getProductionVaultReadbackDiagnostics(referenceName)
        : null;
      const deletion = referenceName
        ? await deleteProductionVaultCredentials(referenceName)
        : { deleted: false, referenceName: null };
      const runtimeClear = clearKrakenAuthRuntimeState();

      if (referenceName) {
        await dbRun(
          `UPDATE local_secret_references
           SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND reference_name = ?`,
          [
            'disabled',
            'Phase 6E Kraken API key was deleted/rotated by owner action.',
            req.session.userId,
            referenceName
          ]
        );
      }

      if (connector) {
        const settings = mergeProductionConnectionSettings(connector, {
          referenceName: null,
          localReferenceId: null,
          connectionStatus: 'not_connected',
          plainEnglishStatus: 'Kraken key deleted. Phase 6E is not ready.',
          apiKeyFingerprint: null,
          apiKeySha256Fingerprint: null,
          apiSecretSha256Fingerprint: null,
          previousApiKeySha256Fingerprint: previousVaultReadback?.apiKeySha256Fingerprint || null,
          previousApiSecretSha256Fingerprint: previousVaultReadback?.apiSecretSha256Fingerprint || null,
          vaultRoundTripVerified: null,
          vaultOverwriteVerified: null,
          vaultReadback: null,
          previousVaultReadback,
          runtimeClear,
          krakenAuthDiagnostics: null,
          krakenAuthDiagnosticsAt: null,
          phase6EStatus: 'key_deleted',
          phase6EReadiness: null,
          phase6EDryRunProof: null,
          phase6EPreflight: null,
          phase6ESimulationPreview: null,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        });

        await dbRun(
          `UPDATE exchange_connectors
           SET status = ?, settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          ['review_needed', JSON.stringify(settings), 'No credential values stored in SQLite.', connector.id]
        );
      }

      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6e_kraken_key_deleted',
          'complete',
          'Phase 6E Kraken key deleted or rotated. Production order endpoint remains locked.',
          JSON.stringify({
            deleted: deletion.deleted,
            previousVaultReadback,
            runtimeClear,
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false
          })
        ]
      );

      const state = await loadPhase6EState({ userId: req.session.userId });

      res.json({
        deleted: deletion.deleted,
        previousVaultReadback,
        runtimeClear,
        wizard: state.wizard,
        nextClick: 'Create a new restricted Kraken key if you want to continue.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6E Kraken key delete', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.get('/api/v1/live-trading-launch/phase6e/kraken-key/readback', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const referenceName = connector?.settings?.productionConnection?.referenceName || null;
      const vaultReadback = referenceName
        ? await getProductionVaultReadbackDiagnostics(referenceName)
        : {
            exists: false,
            vaultDecodeSucceeded: false,
            secretValuesReturned: false
          };

      res.json({
        vaultReadback,
        verifySource: {
          source: referenceName ? 'encrypted_production_vault' : 'no_saved_vault_reference',
          referenceName,
          loadedAt: new Date().toISOString(),
          cacheBypassed: true,
          secretValuesReturned: false
        },
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6E Kraken vault readback', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6e/clear-auth-cache', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const referenceName = connector?.settings?.productionConnection?.referenceName || null;
      const runtimeClear = clearKrakenAuthRuntimeState();
      const vaultReadback = referenceName
        ? await getProductionVaultReadbackDiagnostics(referenceName)
        : null;

      if (connector) {
        const settings = mergeProductionConnectionSettings(connector, {
          connectionStatus: referenceName ? 'phase6e_key_saved_locked' : 'not_connected',
          plainEnglishStatus: referenceName
            ? 'Cached Kraken verification state was cleared. The next verify will reload current encrypted vault values only.'
            : 'Cached Kraken verification state was cleared. No Kraken key is currently saved.',
          phase6EStatus: referenceName ? 'key_saved_cache_cleared' : 'not_connected',
          phase6EReadiness: null,
          phase6EDryRunProof: null,
          phase6EPreflight: null,
          phase6ESimulationPreview: null,
          phase6EFinalStatus: null,
          phase6FReadiness: null,
          phase6FDryRunProof: null,
          phase6FPreflight: null,
          phase6FSimulationPreview: null,
          phase6FModeState: null,
          phase6DReadiness: null,
          phase6DDryRunProof: null,
          phase6DPreflight: null,
          phase6DSimulationPreview: null,
          krakenAuthDiagnostics: null,
          krakenAuthDiagnosticsAt: null,
          vaultReadback,
          runtimeClear,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        });

        await dbRun(
          `UPDATE exchange_connectors
           SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [referenceName ? 'configured' : 'review_needed', JSON.stringify(settings), connector.id]
        );
      }

      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6e_kraken_auth_cache_cleared',
          'complete',
          'Kraken auth verification state cleared. Future verification must reload the encrypted vault.',
          JSON.stringify({
            referenceName,
            vaultReadback,
            runtimeClear,
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            secretValuesReturnedToUi: false
          })
        ]
      );

      const state = await loadPhase6EState({ userId: req.session.userId });

      res.json({
        cleared: true,
        runtimeClear,
        vaultReadback,
        wizard: state.wizard,
        nextClick: referenceName ? 'Verify Kraken Key' : 'Save Kraken Key To Vault',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6E Kraken auth cache clear', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6e/verify-kraken-key', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const adapter = getProductionAdapter('kraken');
      const referenceName = connector?.settings?.productionConnection?.referenceName || null;
      const vaultReadbackBeforeVerify = referenceName
        ? await getProductionVaultReadbackDiagnostics(referenceName)
        : null;
      const credentials = await loadConnectorProductionCredentialsForUser(connector, req.session.userId);

      if (!credentials) {
        const state = await loadPhase6EState({ userId: req.session.userId });

        return res.status(409).json({
          error: 'No restricted Kraken API key is saved in the encrypted production vault.',
          nextClick: 'Save Kraken Key To Vault',
          wizard: state.wizard,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const krakenReadiness = await runKrakenAuthenticatedIntegration({
        credentials,
        adapter,
        orderInput: {
          exchangeName: 'kraken',
          symbol: req.body?.symbol || req.body?.order?.symbol || 'BTC/USD',
          notionalUsd: Number(req.body?.notionalUsd || req.body?.order?.notionalUsd || 1),
          maxOrderUsd: Number(req.body?.maxOrderUsd || req.body?.order?.maxOrderUsd || 5),
          ...(req.body?.order || {})
        },
        policy: req.body?.policy || {}
      });
      const verifySource = {
        source: 'encrypted_production_vault',
        referenceName,
        loadedAt: new Date().toISOString(),
        cacheBypassed: true,
        apiKeySha256Fingerprint: vaultReadbackBeforeVerify?.apiKeySha256Fingerprint || '',
        apiSecretSha256Fingerprint: vaultReadbackBeforeVerify?.apiSecretSha256Fingerprint || '',
        vaultDecodeSucceeded: vaultReadbackBeforeVerify?.vaultDecodeSucceeded === true,
        secretValuesReturned: false
      };
      const settings = mergeProductionConnectionSettings(connector, {
        connectionStatus: krakenReadiness.credentialVerification?.connectionStatus || krakenReadiness.status,
        plainEnglishStatus: krakenReadiness.plainEnglishStatus,
        phase6EStatus: krakenReadiness.criticalPassed ? 'verified' : 'blocked',
        phase6EReadiness: krakenReadiness,
        phase6EVerifiedAt: new Date().toISOString(),
        phase6EVerifySource: verifySource,
        vaultReadback: vaultReadbackBeforeVerify,
        phase6DReadiness: krakenReadiness,
        phase6DReadinessStatus: krakenReadiness.status,
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          krakenReadiness.status === 'Unsafe Permissions Detected' ? 'review_needed' : 'configured',
          JSON.stringify(settings),
          connector.id
        ]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6e_verify_kraken_key',
          krakenReadiness.criticalPassed ? 'complete' : 'blocked',
          krakenReadiness.plainEnglishStatus,
          JSON.stringify({
            status: krakenReadiness.status,
            checksPassed: krakenReadiness.checksPassed,
            checksFailed: krakenReadiness.checksFailed,
            verifySource,
            vaultReadback: vaultReadbackBeforeVerify,
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            secretValuesReturnedToUi: false,
            withdrawalsEnabled: false,
            transfersEnabled: false,
            walletSigningEnabled: false
          })
        ]
      );

      const state = await loadPhase6EState({
        userId: req.session.userId,
        krakenReadiness
      });

      res.status(krakenReadiness.criticalPassed ? 200 : 409).json({
        krakenReadiness,
        vaultReadback: vaultReadbackBeforeVerify,
        verifySource,
        finalStatus: buildPhase6EFinalStatus({
          credentialSaved: true,
          krakenReadiness
        }),
        wizard: state.wizard,
        nextClick: krakenReadiness.criticalPassed ? 'Run Kraken Dry-Run Proof' : krakenReadiness.nextClick,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6E Verify Kraken Key', error)
          : error.message,
        nextClick: 'Fix the Kraken key, permissions, internet/VPN, or exchange availability issue, then verify again.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6e/dry-run-proof', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const adapter = getProductionAdapter('kraken');
      const credentials = await loadConnectorProductionCredentialsForUser(connector, req.session.userId);

      if (!credentials) {
        const state = await loadPhase6EState({ userId: req.session.userId });

        return res.status(409).json({
          error: 'No restricted Kraken API key is saved in the encrypted production vault.',
          nextClick: 'Save Kraken Key To Vault',
          wizard: state.wizard,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const policy = {
        ...(defaultPhase6DTinyLivePolicy || {}),
        ...(connector.settings?.productionConnection?.phase6DFramework?.policy || {}),
        ...(req.body?.policy || {}),
        exchangeName: 'kraken',
        productionOrderEndpointEnabled: false
      };
      const requestedOrder = {
        exchangeName: 'kraken',
        symbol: req.body?.symbol || req.body?.order?.symbol || policy.defaultSymbol || 'BTC/USD',
        side: req.body?.side || req.body?.order?.side || policy.defaultOrderSide || 'buy',
        orderType: req.body?.orderType || req.body?.order?.orderType || policy.defaultOrderType || 'limit',
        notionalUsd: Number(req.body?.notionalUsd || req.body?.order?.notionalUsd || policy.defaultTinyOrderUsd || 1),
        maxOrderUsd: Number(req.body?.maxOrderUsd || req.body?.order?.maxOrderUsd || policy.maxOrderSizeUsd || 5),
        quantity: Number(req.body?.quantity || req.body?.order?.quantity || 0),
        limitPrice: Number(req.body?.limitPrice || req.body?.order?.limitPrice || 0)
      };
      const krakenReadiness = await runKrakenAuthenticatedIntegration({
        credentials,
        adapter,
        orderInput: requestedOrder,
        policy
      });

      if (!krakenReadiness.criticalPassed) {
        const settings = mergeProductionConnectionSettings(connector, {
          phase6EStatus: 'blocked',
          phase6EReadiness: krakenReadiness,
          phase6DReadiness: krakenReadiness,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        });

        await dbRun(
          `UPDATE exchange_connectors
           SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          ['review_needed', JSON.stringify(settings), connector.id]
        );
        const state = await loadPhase6EState({
          userId: req.session.userId,
          krakenReadiness
        });

        return res.status(409).json({
          error: krakenReadiness.plainEnglishStatus,
          krakenReadiness,
          finalStatus: state.wizard.finalStatus,
          wizard: state.wizard,
          nextClick: krakenReadiness.nextClick,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const marketData = krakenReadiness.credentialVerification?.proof?.marketData || {};
      const price = Number(
        requestedOrder.limitPrice
          || (requestedOrder.side === 'sell' ? marketData.bidPrice : marketData.askPrice)
          || marketData.midPrice
          || 0
      );
      const quantity = Number(requestedOrder.quantity || 0) > 0
        ? Number(requestedOrder.quantity)
        : price > 0
          ? Number((Number(requestedOrder.notionalUsd || policy.defaultTinyOrderUsd || 1) / price).toFixed(8))
          : 0;
      const dryRunOrder = {
        ...requestedOrder,
        quantity,
        limitPrice: price
      };
      const context = await buildProductionSafetyContext({
        userId: req.session.userId,
        orderInput: dryRunOrder,
        marketContext: {
          productionDryRunPassed: true,
          dryRunPassed: true,
          liquidityUsd: Number(marketData.liquidityUsd || 1000000),
          slippagePercent: Number(marketData.estimatedSlippagePercent ?? 0.05),
          volatilityPercent: 0,
          netSpreadPercent: Math.max(Number(marketData.spreadPercent || 0.1), Number(defaultPhase6Policy?.minNetSpreadPercent || 0.05)),
          latencyMs: Number(req.body?.latencyMs || 250),
          priceTimestamp: marketData.priceTimestamp || new Date().toISOString()
        },
        accountContext: {
          exchangeExposureUsd: 0,
          strategyExposureUsd: 0,
          dailyDrawdownUsd: 0,
          rollingLossUsd: 0,
          repeatedFailures: 0,
          ...(req.body?.accountContext || {})
        },
        ownerConfirmation: '',
        policy: {
          ...(defaultPhase6Policy || {}),
          maxOrderSizeUsd: Number(policy.maxOrderSizeUsd || 5),
          requireSandboxValidation: false,
          ...(req.body?.productionPolicy || {})
        }
      });
      const dryRunProof = buildPhase6CProductionDryRunProof({
        order: context.order,
        credentialVerification: krakenReadiness.credentialVerification,
        safety: context.safety,
        preview: context.preview,
        riskProfile: context.riskProfile,
        marketContext: context.marketContext,
        policy: {
          ...(defaultPhase6Policy || {}),
          maxOrderSizeUsd: Number(policy.maxOrderSizeUsd || 5)
        }
      });
      const simulationPreview = buildPhase6DLiveOrderSimulationPreview({
        order: context.order,
        krakenReadiness,
        dryRunProof,
        policy
      });
      const preflight = {
        ...buildPhase6DProductionPreflight({
          order: context.order,
          krakenReadiness,
          dryRunProof,
          riskProfile: context.riskProfile,
          simulationPreview,
          ownerApprovalTyped: false,
          emergencyStopAvailable: true,
          policy
        }),
        title: 'Phase 6E Production Dry-Run Preflight',
        phase: 'Phase 6E'
      };
      const finalStatus = buildPhase6EFinalStatus({
        credentialSaved: true,
        krakenReadiness,
        dryRunProof,
        preflight
      });
      const framework = buildPhase6DTinyLiveFramework({
        krakenReadiness,
        dryRunProof,
        preflight,
        simulationPreview,
        policy,
        armed: false
      });
      const status = preflight.technicalReady ? 'preview_ready' : 'preview_blocked';
      const insert = await dbRun(
        `INSERT INTO production_order_executions
         (user_id, connector_id, risk_profile_id, strategy_id, exchange_name, symbol, side, order_type,
          quantity, limit_price, notional_usd, max_order_usd, client_order_id, status, readiness_json,
          preview_json, production_order_endpoint_enabled, production_order_endpoint_called,
          automated_live_trading_enabled, unrestricted_autonomous_trading_enabled, wallet_signing_enabled,
          withdrawals_enabled, margin_enabled, futures_enabled, leverage_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          context.connector?.id || connector.id,
          context.riskProfile?.id || null,
          context.order.strategyId,
          context.order.exchangeName,
          context.order.symbol,
          context.order.side,
          context.order.orderType,
          context.order.quantity,
          context.order.limitPrice || null,
          context.order.notionalUsd || 0,
          context.order.maxOrderUsd || 0,
          context.order.clientOrderId,
          status,
          JSON.stringify({
            phase6E: {
              krakenReadiness,
              dryRunProof,
              preflight,
              finalStatus,
              framework
            },
            fullProductionSafety: context.safety
          }),
          JSON.stringify({
            ...context.preview,
            phase6E: {
              simulationPreview,
              preflight,
              dryRunProof,
              finalStatus
            }
          }),
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      );

      await recordProductionOrderEvent({
        executionId: insert.lastID,
        userId: req.session.userId,
        status,
        summary: preflight.technicalReady
          ? 'Phase 6E Kraken dry-run proof passed. No production order endpoint was called.'
          : 'Phase 6E Kraken dry-run proof is blocked. No production order endpoint was called.',
        payload: {
          finalStatus,
          krakenReadinessStatus: krakenReadiness.status,
          dryRunProofStatus: dryRunProof.status,
          preflightStatus: preflight.status,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        }
      });

      const settings = mergeProductionConnectionSettings(connector, {
        phase6EStatus: finalStatus.label,
        phase6EReadiness: krakenReadiness,
        phase6EDryRunProof: dryRunProof,
        phase6EPreflight: preflight,
        phase6ESimulationPreview: simulationPreview,
        phase6EFinalStatus: finalStatus,
        phase6DReadiness: krakenReadiness,
        phase6DDryRunProof: dryRunProof,
        phase6DPreflight: preflight,
        phase6DSimulationPreview: simulationPreview,
        phase6DFramework: {
          ...(connector.settings?.productionConnection?.phase6DFramework || {}),
          policy,
          order: context.order,
          armed: false,
          emergencyStopped: false,
          lastValidatedAt: new Date().toISOString(),
          productionOrderExecutionId: insert.lastID,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        },
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          preflight.technicalReady ? 'configured' : 'review_needed',
          JSON.stringify(settings),
          connector.id
        ]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6e_kraken_dry_run_proof',
          status,
          finalStatus.plainEnglish,
          JSON.stringify({
            executionId: insert.lastID,
            finalStatus,
            checksPassed: preflight.checksPassed,
            checksFailed: preflight.checksFailed,
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            withdrawalsEnabled: false,
            walletSigningEnabled: false,
            marginEnabled: false,
            futuresEnabled: false,
            leverageEnabled: false,
            automatedLiveTradingEnabled: false
          })
        ]
      );

      const state = await loadPhase6EState({
        userId: req.session.userId,
        krakenReadiness,
        dryRunProof,
        preflight,
        simulationPreview,
        policy,
        frameworkState: settings.productionConnection.phase6DFramework
      });

      res.status(preflight.technicalReady ? 201 : 409).json({
        previewId: insert.lastID,
        krakenReadiness,
        dryRunProof,
        simulationPreview,
        preflight,
        finalStatus,
        wizard: state.wizard,
        execution: parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [insert.lastID, req.session.userId])),
        nextClick: finalStatus.nextClick,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6E Kraken dry-run proof', error)
          : error.message,
        nextClick: 'Fix the failed Kraken verification, balance, minimum size, risk profile, or market-data check, then retry dry-run proof.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.get('/api/v1/live-trading-launch/phase6f/status', requireAuth, async (req, res) => {
    try {
      const state = await loadPhase6FState({ userId: req.session.userId });

      res.json({
        phase6F: state.result,
        nextClick: state.result.tinyLiveEligibility?.nextClick || 'Verify Kraken Connection',
        safetyBoundary: state.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6F Kraken eligibility status', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.get('/api/v1/live-trading-launch/kraken-auth-diagnostics/status', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const referenceName = connector?.settings?.productionConnection?.referenceName || null;
      const vaultStatus = referenceName
        ? await getProductionVaultStatus(referenceName)
        : { entries: [] };
      const vaultMetadata = vaultStatus.entries?.[0]?.metadata || {};
      const vaultReadback = referenceName
        ? await getProductionVaultReadbackDiagnostics(referenceName)
        : {
            exists: false,
            vaultDecodeSucceeded: false,
            secretValuesReturned: false
          };
      let credentials = null;
      let vaultDecodeError = '';

      try {
        credentials = connector
          ? await loadConnectorProductionCredentialsForUser(connector, req.session.userId)
          : null;
      } catch (error) {
        vaultDecodeError = error.message;
      }

      const credentialDiagnostics = credentials
        ? buildKrakenCredentialDiagnostics({ credentials, vaultMetadata })
        : {
            apiKeyExists: false,
            apiSecretExists: false,
            vaultDecodeSucceeded: false,
            vaultDecodeError,
            secretValuesReturnedToUi: false
          };
      const localSelfTest = credentials
        ? runKrakenLocalAuthSelfTest({ credentials, requestPath: '/0/private/Balance' })
        : {
            nonceGenerationSucceeded: false,
            signatureGenerationSucceeded: false,
            localSelfTestPassed: false,
            failure: vaultDecodeError || 'No restricted Kraken API key is saved in the encrypted production vault.',
            secretValuesReturnedToUi: false
          };

      res.json({
        diagnostics: {
          title: 'Kraken Authentication Diagnostics',
          exchangeName: 'kraken',
          endpoint: '/0/private/Balance',
          credentialSaved: Boolean(referenceName),
          apiKeyExists: credentialDiagnostics.apiKeyExists,
          apiSecretExists: credentialDiagnostics.apiSecretExists,
          vaultReadback,
          verifySource: {
            source: referenceName ? 'encrypted_production_vault' : 'no_saved_vault_reference',
            referenceName,
            loadedAt: new Date().toISOString(),
            cacheBypassed: true,
            apiKeySha256Fingerprint: vaultReadback.apiKeySha256Fingerprint || '',
            apiSecretSha256Fingerprint: vaultReadback.apiSecretSha256Fingerprint || '',
            secretValuesReturned: false
          },
          credentialDiagnostics,
          localSelfTest,
          lastDiagnostic: connector?.settings?.productionConnection?.krakenAuthDiagnostics || null,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false,
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          secretValuesReturnedToUi: false
        },
        nextClick: referenceName ? 'Test Raw Kraken Balance Endpoint' : 'Save Kraken Key Safely',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Kraken auth diagnostics status', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/kraken-auth-diagnostics/raw-balance', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const adapter = getProductionAdapter('kraken');
      const referenceName = connector?.settings?.productionConnection?.referenceName || null;
      const vaultStatus = referenceName
        ? await getProductionVaultStatus(referenceName)
        : { entries: [] };
      const vaultMetadata = vaultStatus.entries?.[0]?.metadata || {};
      const vaultReadback = referenceName
        ? await getProductionVaultReadbackDiagnostics(referenceName)
        : {
            exists: false,
            vaultDecodeSucceeded: false,
            secretValuesReturned: false
          };
      let credentials = null;
      let vaultDecodeError = '';

      try {
        credentials = connector
          ? await loadConnectorProductionCredentialsForUser(connector, req.session.userId)
          : null;
      } catch (error) {
        vaultDecodeError = error.message;
      }

      if (!credentials) {
        const credentialDiagnostics = {
          apiKeyExists: false,
          apiSecretExists: false,
          vaultDecodeSucceeded: false,
          vaultDecodeError,
          secretValuesReturnedToUi: false
        };
        const localSelfTest = {
          nonceGenerationSucceeded: false,
          signatureGenerationSucceeded: false,
          localSelfTestPassed: false,
          failure: vaultDecodeError || 'No restricted Kraken API key is saved in the encrypted production vault.',
          secretValuesReturnedToUi: false
        };

        return res.status(409).json({
          diagnostics: {
            title: 'Kraken Authentication Diagnostics',
            exchangeName: 'kraken',
            endpoint: '/0/private/Balance',
            apiKeyExists: false,
            apiSecretExists: false,
            vaultReadback,
            verifySource: {
              source: referenceName ? 'encrypted_production_vault' : 'no_saved_vault_reference',
              referenceName,
              loadedAt: new Date().toISOString(),
              cacheBypassed: true,
              secretValuesReturned: false
            },
            credentialDiagnostics,
            localSelfTest,
            requestReachedKraken: false,
            responseCode: null,
            responseBodyExact: '',
            failureClassification: classifyKrakenAuthDiagnosticFailure({
              credentialDiagnostics,
              localSelfTest,
              requestReachedKraken: false,
              requestError: vaultDecodeError
            }),
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            secretValuesReturnedToUi: false
          },
          nextClick: 'Save Kraken Key Safely',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const diagnostics = await runKrakenAuthDiagnostics({
        credentials,
        adapter,
        vaultMetadata,
        requestPath: '/0/private/Balance'
      });
      diagnostics.vaultReadback = vaultReadback;
      diagnostics.verifySource = {
        source: 'encrypted_production_vault',
        referenceName,
        loadedAt: new Date().toISOString(),
        cacheBypassed: true,
        apiKeySha256Fingerprint: vaultReadback.apiKeySha256Fingerprint || '',
        apiSecretSha256Fingerprint: vaultReadback.apiSecretSha256Fingerprint || '',
        vaultDecodeSucceeded: vaultReadback.vaultDecodeSucceeded === true,
        secretValuesReturned: false
      };
      const settings = mergeProductionConnectionSettings(connector, {
        krakenAuthDiagnostics: diagnostics,
        krakenAuthDiagnosticsAt: new Date().toISOString(),
        vaultReadback,
        phase6EVerifySource: diagnostics.verifySource,
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          diagnostics.failureClassification?.id === 'works_safely' ? 'configured' : 'review_needed',
          JSON.stringify(settings),
          connector.id
        ]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'kraken_auth_diagnostics_raw_balance',
          diagnostics.failureClassification?.id === 'works_safely' ? 'complete' : 'review_needed',
          diagnostics.failureClassification?.plainEnglish || 'Kraken auth diagnostic completed.',
          JSON.stringify({
            exchangeName: 'kraken',
            endpoint: diagnostics.endpoint,
            responseCode: diagnostics.responseCode,
            requestReachedKraken: diagnostics.requestReachedKraken,
            failureClassification: diagnostics.failureClassification,
            apiKeyFingerprint: diagnostics.credentialDiagnostics?.apiKeySha256Fingerprint,
            apiSecretFingerprint: diagnostics.credentialDiagnostics?.apiSecretSha256Fingerprint,
            vaultReadback,
            verifySource: diagnostics.verifySource,
            nonceGenerationSucceeded: diagnostics.nonceGenerationSucceeded,
            signatureGenerationSucceeded: diagnostics.signatureGenerationSucceeded,
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            secretValuesReturnedToUi: false,
            withdrawalsEnabled: false,
            transfersEnabled: false,
            walletSigningEnabled: false
          })
        ]
      );

      res.json({
        diagnostics,
        nextClick: diagnostics.failureClassification?.id === 'works_safely'
          ? 'Verify Kraken Connection'
          : 'Open Show Auth Debug and review the exact Kraken response.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Kraken auth diagnostics raw Balance endpoint', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6f/authenticated-readiness', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const adapter = getProductionAdapter('kraken');

      if (!connector || !adapter) {
        return res.status(400).json({
          error: 'Kraken production connector is not available.',
          nextClick: 'Create the Kraken connector placeholder.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const credentials = await loadConnectorProductionCredentialsForUser(connector, req.session.userId);

      if (!credentials) {
        const state = await loadPhase6FState({ userId: req.session.userId });

        return res.status(409).json({
          error: 'No restricted Kraken API key is saved in the encrypted production vault.',
          phase6F: state.result,
          nextClick: 'Save Kraken Key To Vault',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const requestedOrder = {
        exchangeName: 'kraken',
        symbol: req.body?.symbol || req.body?.order?.symbol || 'BTC/USD',
        side: req.body?.side || req.body?.order?.side || 'buy',
        orderType: req.body?.orderType || req.body?.order?.orderType || 'limit',
        quantity: Number(req.body?.quantity || req.body?.order?.quantity || 0),
        limitPrice: Number(req.body?.limitPrice || req.body?.order?.limitPrice || 0),
        notionalUsd: Number(req.body?.notionalUsd || req.body?.order?.notionalUsd || 1),
        maxOrderUsd: Number(req.body?.maxOrderUsd || req.body?.order?.maxOrderUsd || 5)
      };
      const krakenReadiness = await runKrakenAuthenticatedIntegration({
        credentials,
        adapter,
        orderInput: requestedOrder,
        policy: req.body?.policy || {}
      });
      const verifySource = {
        source: 'encrypted_production_vault',
        referenceName,
        loadedAt: new Date().toISOString(),
        cacheBypassed: true,
        apiKeySha256Fingerprint: vaultReadbackBeforeVerify?.apiKeySha256Fingerprint || '',
        apiSecretSha256Fingerprint: vaultReadbackBeforeVerify?.apiSecretSha256Fingerprint || '',
        vaultDecodeSucceeded: vaultReadbackBeforeVerify?.vaultDecodeSucceeded === true,
        secretValuesReturned: false
      };
      const settings = mergeProductionConnectionSettings(connector, {
        connectionStatus: krakenReadiness.credentialVerification?.connectionStatus || krakenReadiness.status,
        plainEnglishStatus: krakenReadiness.plainEnglishStatus,
        phase6FStatus: krakenReadiness.criticalPassed ? 'authenticated_readiness_passed' : 'authenticated_readiness_blocked',
        phase6FReadiness: krakenReadiness,
        phase6FAuthenticatedAt: new Date().toISOString(),
        phase6FVerifySource: verifySource,
        vaultReadback: vaultReadbackBeforeVerify,
        phase6EReadiness: krakenReadiness,
        phase6DReadiness: krakenReadiness,
        phase6DReadinessStatus: krakenReadiness.status,
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          krakenReadiness.status === 'Unsafe Permissions Detected' ? 'review_needed' : 'configured',
          JSON.stringify(settings),
          connector.id
        ]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6f_kraken_authenticated_readiness',
          krakenReadiness.criticalPassed ? 'complete' : 'blocked',
          krakenReadiness.plainEnglishStatus,
          JSON.stringify({
            exchangeName: 'kraken',
            status: krakenReadiness.status,
            checksPassed: krakenReadiness.checksPassed,
            checksFailed: krakenReadiness.checksFailed,
            vaultReadback: vaultReadbackBeforeVerify,
            verifySource,
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            secretValuesReturnedToUi: false,
            withdrawalsEnabled: false,
            transfersEnabled: false,
            walletSigningEnabled: false,
            marginEnabled: false,
            futuresEnabled: false,
            leverageEnabled: false,
            automatedLiveTradingEnabled: false
          })
        ]
      );

      const state = await loadPhase6FState({
        userId: req.session.userId,
        krakenReadiness
      });

      res.status(krakenReadiness.criticalPassed ? 200 : 409).json({
        krakenReadiness,
        vaultReadback: vaultReadbackBeforeVerify,
        verifySource,
        phase6F: state.result,
        nextClick: state.result.tinyLiveEligibility?.nextClick || krakenReadiness.nextClick,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      const state = await loadPhase6FState({
        userId: req.session.userId,
        authError: error
      });

      res.status(error.status || 500).json({
        error: state.result.authIssue?.plainEnglish || (createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6F Verify Kraken Connection', error)
          : error.message),
        authIssue: state.result.authIssue,
        phase6F: state.result,
        nextClick: state.result.authIssue?.nextClick || 'Fix the Kraken key, permissions, internet/VPN, or exchange availability issue, then verify again.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6f/tiny-live-preview', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const adapter = getProductionAdapter('kraken');
      const credentials = await loadConnectorProductionCredentialsForUser(connector, req.session.userId);

      if (!credentials) {
        const state = await loadPhase6FState({ userId: req.session.userId });

        return res.status(409).json({
          error: 'No restricted Kraken API key is saved in the encrypted production vault.',
          phase6F: state.result,
          nextClick: 'Save Kraken Key To Vault',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const policy = {
        ...(defaultPhase6DTinyLivePolicy || {}),
        ...(connector.settings?.productionConnection?.phase6DFramework?.policy || {}),
        ...(req.body?.policy || {}),
        exchangeName: 'kraken',
        productionOrderEndpointEnabled: false
      };
      const requestedOrder = {
        exchangeName: 'kraken',
        symbol: req.body?.symbol || req.body?.order?.symbol || policy.defaultSymbol || 'BTC/USD',
        side: req.body?.side || req.body?.order?.side || policy.defaultOrderSide || 'buy',
        orderType: req.body?.orderType || req.body?.order?.orderType || policy.defaultOrderType || 'limit',
        notionalUsd: Number(req.body?.notionalUsd || req.body?.order?.notionalUsd || policy.defaultTinyOrderUsd || 1),
        maxOrderUsd: Number(req.body?.maxOrderUsd || req.body?.order?.maxOrderUsd || policy.maxOrderSizeUsd || 5),
        quantity: Number(req.body?.quantity || req.body?.order?.quantity || 0),
        limitPrice: Number(req.body?.limitPrice || req.body?.order?.limitPrice || 0)
      };
      const krakenReadiness = await runKrakenAuthenticatedIntegration({
        credentials,
        adapter,
        orderInput: requestedOrder,
        policy
      });

      if (!krakenReadiness.criticalPassed) {
        const settings = mergeProductionConnectionSettings(connector, {
          phase6FStatus: 'authenticated_readiness_blocked',
          phase6FReadiness: krakenReadiness,
          phase6EReadiness: krakenReadiness,
          phase6DReadiness: krakenReadiness,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        });

        await dbRun(
          `UPDATE exchange_connectors
           SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          ['review_needed', JSON.stringify(settings), connector.id]
        );
        const state = await loadPhase6FState({
          userId: req.session.userId,
          krakenReadiness
        });

        return res.status(409).json({
          error: krakenReadiness.plainEnglishStatus,
          krakenReadiness,
          phase6F: state.result,
          nextClick: krakenReadiness.nextClick || state.result.tinyLiveEligibility?.nextClick,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const marketData = krakenReadiness.credentialVerification?.proof?.marketData || {};
      const price = Number(
        requestedOrder.limitPrice
          || (requestedOrder.side === 'sell' ? marketData.bidPrice : marketData.askPrice)
          || marketData.midPrice
          || 0
      );
      const quantity = Number(requestedOrder.quantity || 0) > 0
        ? Number(requestedOrder.quantity)
        : price > 0
          ? Number((Number(requestedOrder.notionalUsd || policy.defaultTinyOrderUsd || 1) / price).toFixed(8))
          : 0;
      const dryRunOrder = {
        ...requestedOrder,
        quantity,
        limitPrice: price
      };
      const context = await buildProductionSafetyContext({
        userId: req.session.userId,
        orderInput: dryRunOrder,
        marketContext: {
          productionDryRunPassed: true,
          dryRunPassed: true,
          liquidityUsd: Number(marketData.liquidityUsd || 1000000),
          slippagePercent: Number(marketData.estimatedSlippagePercent ?? 0.05),
          volatilityPercent: 0,
          netSpreadPercent: Math.max(Number(marketData.spreadPercent || 0.1), Number(defaultPhase6Policy?.minNetSpreadPercent || 0.05)),
          latencyMs: Number(req.body?.latencyMs || 250),
          priceTimestamp: marketData.priceTimestamp || new Date().toISOString()
        },
        accountContext: {
          exchangeExposureUsd: 0,
          strategyExposureUsd: 0,
          dailyDrawdownUsd: 0,
          rollingLossUsd: 0,
          repeatedFailures: 0,
          ...(req.body?.accountContext || {})
        },
        ownerConfirmation: '',
        policy: {
          ...(defaultPhase6Policy || {}),
          maxOrderSizeUsd: Number(policy.maxOrderSizeUsd || 5),
          requireSandboxValidation: false,
          ...(req.body?.productionPolicy || {})
        }
      });
      const dryRunProof = buildPhase6CProductionDryRunProof({
        order: context.order,
        credentialVerification: krakenReadiness.credentialVerification,
        safety: context.safety,
        preview: context.preview,
        riskProfile: context.riskProfile,
        marketContext: context.marketContext,
        policy: {
          ...(defaultPhase6Policy || {}),
          maxOrderSizeUsd: Number(policy.maxOrderSizeUsd || 5)
        }
      });
      const simulationPreview = buildPhase6DLiveOrderSimulationPreview({
        order: context.order,
        krakenReadiness,
        dryRunProof,
        policy
      });
      const preflight = {
        ...buildPhase6DProductionPreflight({
          order: context.order,
          krakenReadiness,
          dryRunProof,
          riskProfile: context.riskProfile,
          simulationPreview,
          ownerApprovalTyped: false,
          emergencyStopAvailable: true,
          policy
        }),
        title: 'Phase 6F Tiny Live Eligibility Preflight',
        phase: 'Phase 6F'
      };
      const phase6FResult = buildPhase6FOperatorResult({
        connector,
        krakenReadiness,
        dryRunProof,
        preflight,
        simulationPreview,
        riskProfile: context.riskProfile,
        latestOrders: context.latestProductionOrders,
        policy
      });
      const status = phase6FResult.tinyLiveEligibility?.eligible ? 'phase6f_preview_ready' : 'phase6f_preview_blocked';
      const insert = await dbRun(
        `INSERT INTO production_order_executions
         (user_id, connector_id, risk_profile_id, strategy_id, exchange_name, symbol, side, order_type,
          quantity, limit_price, notional_usd, max_order_usd, client_order_id, status, readiness_json,
          preview_json, production_order_endpoint_enabled, production_order_endpoint_called,
          automated_live_trading_enabled, unrestricted_autonomous_trading_enabled, wallet_signing_enabled,
          withdrawals_enabled, margin_enabled, futures_enabled, leverage_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          context.connector?.id || connector.id,
          context.riskProfile?.id || null,
          context.order.strategyId,
          context.order.exchangeName,
          context.order.symbol,
          context.order.side,
          context.order.orderType,
          context.order.quantity,
          context.order.limitPrice || null,
          context.order.notionalUsd || 0,
          context.order.maxOrderUsd || 0,
          context.order.clientOrderId,
          status,
          JSON.stringify({
            phase6F: {
              krakenReadiness,
              dryRunProof,
              preflight,
              tinyLivePreview: phase6FResult.tinyLivePreview,
              operatorResults: phase6FResult.operatorResults,
              tinyLiveEligibility: phase6FResult.tinyLiveEligibility
            },
            fullProductionSafety: context.safety
          }),
          JSON.stringify({
            ...context.preview,
            phase6F: {
              simulationPreview,
              preflight,
              dryRunProof,
              tinyLivePreview: phase6FResult.tinyLivePreview,
              noLiveOrderWillBePlacedYet: true
            }
          }),
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      );

      await recordProductionOrderEvent({
        executionId: insert.lastID,
        userId: req.session.userId,
        status,
        summary: phase6FResult.tinyLiveEligibility?.eligible
          ? 'Phase 6F tiny live preview is eligible. No production order endpoint was called.'
          : 'Phase 6F tiny live preview is blocked. No production order endpoint was called.',
        payload: {
          tinyLiveEligibility: phase6FResult.tinyLiveEligibility,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        }
      });

      const settings = mergeProductionConnectionSettings(connector, {
        phase6FStatus: status,
        phase6FReadiness: krakenReadiness,
        phase6FDryRunProof: dryRunProof,
        phase6FPreflight: preflight,
        phase6FSimulationPreview: simulationPreview,
        phase6FOperatorResult: phase6FResult,
        phase6FPreviewExecutionId: insert.lastID,
        phase6EReadiness: krakenReadiness,
        phase6EDryRunProof: dryRunProof,
        phase6EPreflight: preflight,
        phase6ESimulationPreview: simulationPreview,
        phase6DReadiness: krakenReadiness,
        phase6DDryRunProof: dryRunProof,
        phase6DPreflight: preflight,
        phase6DSimulationPreview: simulationPreview,
        phase6DFramework: {
          ...(connector.settings?.productionConnection?.phase6DFramework || {}),
          policy,
          order: context.order,
          armed: false,
          emergencyStopped: false,
          lastValidatedAt: new Date().toISOString(),
          productionOrderExecutionId: insert.lastID,
          productionOrderEndpointCalled: false,
          productionOrderEndpointEnabled: false
        },
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          phase6FResult.tinyLiveEligibility?.eligible ? 'configured' : 'review_needed',
          JSON.stringify(settings),
          connector.id
        ]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6f_tiny_live_preview',
          status,
          phase6FResult.tinyLiveEligibility?.label || 'Phase 6F tiny live preview reviewed.',
          JSON.stringify({
            executionId: insert.lastID,
            tinyLiveEligibility: phase6FResult.tinyLiveEligibility,
            productionOrderEndpointCalled: false,
            productionOrderEndpointEnabled: false,
            withdrawalsEnabled: false,
            walletSigningEnabled: false,
            marginEnabled: false,
            futuresEnabled: false,
            leverageEnabled: false,
            automatedLiveTradingEnabled: false
          })
        ]
      );

      const state = await loadPhase6FState({
        userId: req.session.userId,
        krakenReadiness,
        dryRunProof,
        preflight,
        simulationPreview,
        policy
      });

      res.status(phase6FResult.tinyLiveEligibility?.eligible ? 201 : 409).json({
        previewId: insert.lastID,
        krakenReadiness,
        dryRunProof,
        simulationPreview,
        preflight,
        phase6F: state.result,
        execution: parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [insert.lastID, req.session.userId])),
        nextClick: state.result.tinyLiveEligibility?.nextClick,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      const state = await loadPhase6FState({
        userId: req.session.userId,
        authError: error
      });

      res.status(error.status || 500).json({
        error: state.result.authIssue?.plainEnglish || (createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6F Tiny Live Preview', error)
          : error.message),
        authIssue: state.result.authIssue,
        phase6F: state.result,
        nextClick: state.result.authIssue?.nextClick || 'Fix the failed Kraken verification, balance, minimum size, risk profile, or market-data check, then retry tiny live preview.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6f/enable-tiny-live-test-mode', requireAuth, async (req, res) => {
    try {
      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const state = await loadPhase6FState({ userId: req.session.userId });
      const phase6F = state.result;

      if (!phase6F.tinyLiveEligibility?.eligible) {
        return res.status(409).json({
          error: 'Tiny live test mode is not eligible yet.',
          phase6F,
          missing: (phase6F.tinyLiveEligibility?.checks || [])
            .filter(item => !item.passed)
            .map(item => item.label),
          nextClick: phase6F.tinyLiveEligibility?.nextClick || 'Build Tiny Live Preview',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const missing = [];
      if (String(req.body?.confirmation || '').trim() !== phase6FEnableConfirmationPhrase) {
        missing.push(`Type exactly: ${phase6FEnableConfirmationPhrase}`);
      }
      if (req.body?.ownerApprovalAccepted !== true) {
        missing.push('Check owner approval.');
      }
      if (req.body?.emergencyStopArmed !== true) {
        missing.push('Check Emergency Stop armed.');
      }

      if (missing.length) {
        return res.status(409).json({
          error: 'Tiny live test mode was not enabled because final owner confirmations are incomplete.',
          missing,
          phase6F,
          nextClick: 'Complete the three confirmation items, then click Enable Tiny Live Test Mode.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const modeState = {
        status: 'prepared_execution_blocked',
        requestedAt: new Date().toISOString(),
        executionBlocked: true,
        productionOrderEndpointEnabled: false,
        productionOrderEndpointCalled: false,
        confirmationHash: crypto.createHash('sha256').update(phase6FEnableConfirmationPhrase).digest('hex'),
        ownerApprovalAccepted: true,
        manualOwnerApprovalRequired: true,
        emergencyStopArmed: true,
        emergencyStopArmedRequired: true,
        noLiveOrderPlaced: true,
        withdrawalsEnabled: false,
        walletSigningEnabled: false,
        marginEnabled: false,
        futuresEnabled: false,
        leverageEnabled: false,
        automatedLiveTradingEnabled: false,
        unrestrictedAutonomousTradingEnabled: false
      };
      const settings = mergeProductionConnectionSettings(connector, {
        phase6FTinyLiveMode: modeState,
        phase6FStatus: 'tiny_live_mode_prepared_execution_blocked',
        productionOrderEndpointCalled: false,
        productionOrderEndpointEnabled: false
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        ['configured', JSON.stringify(settings), connector.id]
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6f_enable_tiny_live_test_mode',
          'prepared_execution_blocked',
          'Phase 6F tiny live test mode prepared, but production execution remains blocked and no order was placed.',
          JSON.stringify(modeState)
        ]
      );

      const updatedState = await loadPhase6FState({
        userId: req.session.userId,
        modeState
      });

      res.json({
        phase6F: updatedState.result,
        modeState,
        nextClick: 'Wait for the next phase before placing any real order.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Phase 6F Enable Tiny Live Test Mode', error)
          : error.message,
        nextClick: 'Review eligibility and confirmations, then retry.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.get('/api/v1/live-trading-launch/kraken-tiny-live-test/status', requireAuth, async (req, res) => {
    try {
      const [gate, latestOrders] = await Promise.all([
        buildKrakenTinyLiveGate({ userId: req.session.userId }),
        getLatestKrakenTinyLiveExecutions(req.session.userId, 10)
      ]);
      const auditExecution = latestOrders.find(order => order.production_order_endpoint_called) || latestOrders[0] || null;
      const journal = await getKrakenTinyLiveExecutionJournal({
        userId: req.session.userId,
        executionId: auditExecution?.id
      });
      const auditState = buildKrakenTinyLiveAuditState({ execution: auditExecution, gate, journal });

      res.json({
        title: 'Run Kraken Tiny Live Test',
        gate: {
          canPreview: gate.canPreview,
          canPlace: false,
          label: gate.label,
          plainEnglish: gate.plainEnglish,
          checks: gate.checks,
          missing: gate.missing,
          finalApprovalChecklist: gate.finalApprovalChecklist || gate.checks,
          blockedGates: gate.blockedGates || gate.missing,
          nextClick: gate.nextClick,
          exactRemainingOperatorAction: gate.exactRemainingOperatorAction || auditState.exactRemainingOperatorAction,
          exactOrderPreview: gate.exactOrderPreview,
          confirmationPhrase: krakenTinyLiveOrderConfirmationPhrase,
          auditState
        },
        latestOrders,
        auditState,
        executionJournal: auditState.journal,
        postTradeVerification: auditExecution?.production_order_endpoint_called
          ? buildKrakenTinyLivePostTradeVerification({ execution: auditExecution })
          : null,
        safetyBoundary: gate.safetyBoundary
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Kraken tiny live test', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/kraken-tiny-live-test/preview', requireAuth, async (req, res) => {
    try {
      const gate = await buildKrakenTinyLiveGate({
        userId: req.session.userId,
        body: req.body || {},
        requireFinalConfirmation: false
      });
      const context = gate.context;

      if (!context) {
        return res.status(409).json({
          error: gate.plainEnglish || 'Kraken tiny live preview is blocked.',
          gate: {
            canPreview: false,
            canPlace: false,
            label: gate.label || 'NOT READY',
            plainEnglish: gate.plainEnglish,
            checks: gate.checks,
            missing: gate.missing,
            finalApprovalChecklist: gate.finalApprovalChecklist || gate.checks,
            blockedGates: gate.blockedGates || gate.missing,
            nextClick: gate.nextClick,
            exactRemainingOperatorAction: gate.exactRemainingOperatorAction || gate.nextClick,
            confirmationPhrase: krakenTinyLiveOrderConfirmationPhrase
          },
          auditState: buildKrakenTinyLiveAuditState({ gate }),
          nextClick: gate.nextClick,
          safetyBoundary: gate.safetyBoundary
        });
      }

      const status = gate.canPreview ? 'kraken_tiny_live_preview_ready' : 'kraken_tiny_live_preview_blocked';
      const insert = await dbRun(
        `INSERT INTO production_order_executions
         (user_id, connector_id, risk_profile_id, strategy_id, exchange_name, symbol, side, order_type,
          quantity, limit_price, notional_usd, max_order_usd, client_order_id, status, readiness_json,
          preview_json, production_order_endpoint_enabled, production_order_endpoint_called,
          automated_live_trading_enabled, unrestricted_autonomous_trading_enabled, wallet_signing_enabled,
          withdrawals_enabled, margin_enabled, futures_enabled, leverage_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          context.connector?.id || gate.connector?.id || null,
          context.riskProfile?.id || null,
          context.order.strategyId,
          context.order.exchangeName,
          context.order.symbol,
          context.order.side,
          context.order.orderType,
          context.order.quantity,
          context.order.limitPrice || null,
          context.order.notionalUsd || 0,
          gate.ownerTinyLimitUsd || krakenTinyLiveMaxUsd,
          context.order.clientOrderId,
          status,
          JSON.stringify({
            phase6GKrakenTinyLiveTest: true,
            label: gate.label,
            checks: gate.checks,
            missing: gate.missing,
            krakenReadiness: gate.krakenReadiness,
            dryRunProof: gate.dryRunProof,
            simulationPreview: gate.simulationPreview,
            preflight: gate.preflight,
            fullProductionSafety: context.safety,
            orderFingerprint: context.safety.orderFingerprint
          }),
          JSON.stringify({
            phase6GKrakenTinyLiveTest: true,
            ...gate.exactOrderPreview,
            fullProductionPreview: context.preview,
            productionOrderEndpointCalled: false
          }),
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      );

      await recordProductionOrderEvent({
        executionId: insert.lastID,
        userId: req.session.userId,
        status,
        summary: gate.canPreview
          ? 'Kraken tiny live preview is ready. No order endpoint was called.'
          : 'Kraken tiny live preview is blocked. No order endpoint was called.',
        payload: {
          checks: gate.checks,
          exactOrderPreview: gate.exactOrderPreview,
          productionOrderEndpointCalled: false
        }
      });

      const execution = parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [insert.lastID, req.session.userId]));
      const journal = await getKrakenTinyLiveExecutionJournal({
        userId: req.session.userId,
        executionId: insert.lastID
      });
      const auditState = buildKrakenTinyLiveAuditState({ execution, gate, journal });

      res.status(gate.canPreview ? 201 : 409).json({
        previewId: insert.lastID,
        gate: {
          canPreview: gate.canPreview,
          canPlace: false,
          label: gate.label,
          plainEnglish: gate.plainEnglish,
          checks: gate.checks,
          missing: gate.missing,
          finalApprovalChecklist: gate.finalApprovalChecklist || gate.checks,
          blockedGates: gate.blockedGates || gate.missing,
          nextClick: gate.canPreview ? 'Copy the final phrase, check both approval boxes, then click PLACE ONE TINY LIVE KRAKEN ORDER.' : gate.nextClick,
          exactRemainingOperatorAction: gate.canPreview ? 'Review the exact order preview, copy the final phrase, check both approval boxes, then click PLACE ONE TINY LIVE KRAKEN ORDER once.' : gate.nextClick,
          exactOrderPreview: gate.exactOrderPreview,
          confirmationPhrase: krakenTinyLiveOrderConfirmationPhrase,
          auditState
        },
        execution,
        auditState,
        executionJournal: auditState.journal,
        nextClick: gate.canPreview ? 'Review the exact order preview. No order was placed.' : gate.nextClick,
        safetyBoundary: gate.safetyBoundary
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Kraken tiny live preview', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/kraken-tiny-live-test/place', requireAuth, async (req, res) => {
    const previewId = Number(req.body?.previewId || req.body?.id || 0);

    try {
      const row = previewId
        ? await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [previewId, req.session.userId])
        : null;

      if (!row) {
        return res.status(404).json({
          error: 'Build the Kraken Tiny Live Test preview first. No order was placed.',
          nextClick: 'Click Preview Kraken Tiny Live Test.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const existing = parseProductionOrderExecution(row);

      if (!isKrakenTinyLiveExecution(existing)) {
        return res.status(400).json({
          error: 'This preview is not a Kraken tiny-live test preview. No order was placed.',
          nextClick: 'Click Preview Kraken Tiny Live Test.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      if (existing.production_order_endpoint_called) {
        const journal = await getKrakenTinyLiveExecutionJournal({
          userId: req.session.userId,
          executionId: existing.id
        });
        const auditState = buildKrakenTinyLiveAuditState({ execution: existing, journal });

        return res.status(409).json({
          error: 'This Kraken tiny-live preview already used its one live endpoint call. Repeated execution is blocked.',
          execution: existing,
          auditState,
          executionJournal: auditState.journal,
          postTradeVerification: buildKrakenTinyLivePostTradeVerification({ execution: existing }),
          nextClick: auditState.exactRemainingOperatorAction,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const gate = await buildKrakenTinyLiveGate({
        userId: req.session.userId,
        body: {
          ownerTinyLimitUsd: existing.max_order_usd,
          maxOrderUsd: existing.max_order_usd,
          notionalUsd: existing.notional_usd,
          order: {
            exchangeName: existing.exchange_name,
            symbol: existing.symbol,
            side: existing.side,
            orderType: existing.order_type,
            quantity: existing.quantity,
            limitPrice: existing.limit_price,
            notionalUsd: existing.notional_usd,
            maxOrderUsd: existing.max_order_usd,
            clientOrderId: existing.client_order_id,
            strategyId: existing.strategy_id
          }
        },
        ownerConfirmation: req.body?.ownerConfirmation || '',
        ownerApprovalAccepted: req.body?.ownerApprovalAccepted === true,
        emergencyStopArmed: req.body?.emergencyStopArmed === true,
        requireFinalConfirmation: true,
        ignoreExecutionId: existing.id
      });
      const ownerConfirmationHash = req.body?.ownerConfirmation
        ? crypto.createHash('sha256').update(`${req.session.userId}:kraken-tiny-live:${req.body.ownerConfirmation}`).digest('hex')
        : null;

      await dbRun(
        `UPDATE production_order_executions
         SET readiness_json = ?, preview_json = ?, owner_confirmation_hash = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          JSON.stringify({
            ...(existing.readiness || {}),
            phase6GKrakenTinyLiveTest: true,
            label: gate.label,
            checks: gate.checks,
            missing: gate.missing,
            krakenReadiness: gate.krakenReadiness,
            dryRunProof: gate.dryRunProof,
            simulationPreview: gate.simulationPreview,
            preflight: gate.preflight,
            fullProductionSafety: gate.context?.safety || null,
            orderFingerprint: gate.context?.safety?.orderFingerprint || existing.readiness?.orderFingerprint
          }),
          JSON.stringify({
            ...(existing.preview || {}),
            phase6GKrakenTinyLiveTest: true,
            ...gate.exactOrderPreview,
            productionOrderEndpointCalled: false
          }),
          ownerConfirmationHash,
          existing.id,
          req.session.userId
        ]
      );

      if (!gate.canPlace) {
        await recordProductionOrderEvent({
          executionId: existing.id,
          userId: req.session.userId,
          status: 'kraken_tiny_live_place_blocked',
          summary: 'Kraken tiny live order blocked before placement. No production order endpoint was called.',
          payload: {
            missing: gate.missing,
            productionOrderEndpointCalled: false
          }
        });
        const blockedExecution = parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [existing.id, req.session.userId]));
        const blockedJournal = await getKrakenTinyLiveExecutionJournal({
          userId: req.session.userId,
          executionId: existing.id
        });
        const blockedAuditState = buildKrakenTinyLiveAuditState({ execution: blockedExecution, gate, journal: blockedJournal });

        return res.status(409).json({
          execution: blockedExecution,
          gate: {
            canPreview: gate.canPreview,
            canPlace: false,
            label: gate.label,
            plainEnglish: gate.plainEnglish,
            checks: gate.checks,
            missing: gate.missing,
            finalApprovalChecklist: gate.finalApprovalChecklist || gate.checks,
            blockedGates: gate.blockedGates || gate.missing,
            nextClick: gate.nextClick,
            exactRemainingOperatorAction: gate.exactRemainingOperatorAction || gate.nextClick,
            exactOrderPreview: gate.exactOrderPreview,
            confirmationPhrase: krakenTinyLiveOrderConfirmationPhrase,
            auditState: blockedAuditState
          },
          auditState: blockedAuditState,
          executionJournal: blockedAuditState.journal,
          nextClick: gate.nextClick,
          safetyBoundary: gate.safetyBoundary
        });
      }

      await dbRun(
        `UPDATE production_order_executions
         SET status = ?, production_order_endpoint_enabled = ?, production_order_endpoint_called = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        ['submitting', 1, 1, existing.id, req.session.userId]
      );
      await recordProductionOrderEvent({
        executionId: existing.id,
        userId: req.session.userId,
        status: 'live_execution_endpoint_call_started',
        summary: 'LIVE EXECUTION OCCURRED: owner approved one Kraken tiny live spot order and the AddOrder endpoint call started. Autonomous trading remains disabled.',
        payload: {
          exactOrderPreview: gate.exactOrderPreview,
          safetyBoundary: gate.safetyBoundary,
          oneOrderOnly: true,
          maxLiveTestUsd: krakenTinyLiveMaxUsd,
          productionOrderEndpointCalled: true
        }
      });

      const lifecycle = await runProductionOrderLifecycle({
        order: gate.context.safety.normalizedOrder || gate.context.order,
        credentials: gate.credentials,
        adapter: gate.adapter
      });

      await dbRun(
        `UPDATE production_order_executions
         SET status = ?, exchange_order_id = ?, result_json = ?, production_order_endpoint_called = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          lifecycle.status,
          lifecycle.exchangeOrderId || null,
          JSON.stringify({
            ...lifecycle,
            phase6GKrakenTinyLiveTest: true,
            exactOrderPreview: gate.exactOrderPreview,
            cancelRecoveryPlan: gate.exactOrderPreview?.cancelRecoveryPlan,
            resultScreen: {
              ...(lifecycle.resultScreen || {}),
              cancelRecoveryPlan: gate.exactOrderPreview?.cancelRecoveryPlan
            }
          }),
          1,
          existing.id,
          req.session.userId
        ]
      );
      await recordProductionOrderEvent({
        executionId: existing.id,
        userId: req.session.userId,
        status: lifecycle.status,
        summary: `Kraken tiny live order lifecycle finished with status ${lifecycle.status}.`,
        payload: {
          exchangeOrderId: lifecycle.exchangeOrderId,
          resultScreen: lifecycle.resultScreen,
          reconciliation: lifecycle.reconciliation,
          safetyBoundary: lifecycle.safetyBoundary
        }
      });

      const execution = parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [existing.id, req.session.userId]));
      const journal = await getKrakenTinyLiveExecutionJournal({
        userId: req.session.userId,
        executionId: existing.id
      });
      const auditState = buildKrakenTinyLiveAuditState({ execution, gate, journal });
      const postTradeVerification = buildKrakenTinyLivePostTradeVerification({ execution, lifecycle });

      res.json({
        execution,
        gate: {
          canPreview: true,
          canPlace: true,
          label: gate.label,
          plainEnglish: gate.plainEnglish,
          checks: gate.checks,
          finalApprovalChecklist: gate.finalApprovalChecklist || gate.checks,
          blockedGates: [],
          exactOrderPreview: gate.exactOrderPreview,
          confirmationPhrase: krakenTinyLiveOrderConfirmationPhrase,
          exactRemainingOperatorAction: auditState.exactRemainingOperatorAction,
          auditState
        },
        resultScreen: {
          ...(lifecycle.resultScreen || {}),
          cancelRecoveryPlan: gate.exactOrderPreview?.cancelRecoveryPlan,
          reconciliation: lifecycle.reconciliation
        },
        postTradeVerification,
        auditState,
        executionJournal: auditState.journal,
        lifecycle,
        nextClick: 'Track the tiny order status. If it is still open, you can cancel it or use Emergency Stop.',
        safetyBoundary: {
          ...lifecycle.safetyBoundary,
          automatedLiveTradingEnabled: false,
          unrestrictedAutonomousTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          marginEnabled: false,
          futuresEnabled: false,
          leverageEnabled: false
        }
      });
    } catch (error) {
      if (previewId) {
        const current = parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [previewId, req.session.userId]));
        const endpointCalled = Boolean(current?.production_order_endpoint_called);
        await dbRun(
          `UPDATE production_order_executions
           SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
          [
            'rejected',
            JSON.stringify({
              phase6GKrakenTinyLiveTest: true,
              resultScreen: {
                fillStatus: 'rejected',
                rejectionReason: createPlainEnglishProductionError
                  ? createPlainEnglishProductionError('Kraken tiny live order', error)
                  : error.message
              },
              rawError: error?.body || null,
              productionOrderEndpointCalled: endpointCalled,
              safetyBoundary: {
                ...createProductionSafetyBoundary(endpointCalled),
                productionOrderEndpointCalled: endpointCalled,
                automatedLiveTradingEnabled: false,
                unrestrictedAutonomousTradingEnabled: false,
                walletSigningEnabled: false,
                withdrawalsEnabled: false,
                marginEnabled: false,
                futuresEnabled: false,
                leverageEnabled: false
              }
            }),
            previewId,
            req.session.userId
          ]
        );
        await recordProductionOrderEvent({
          executionId: previewId,
          userId: req.session.userId,
          status: endpointCalled ? 'live_execution_endpoint_error' : 'kraken_tiny_live_place_error',
          summary: endpointCalled
            ? 'Kraken tiny live endpoint path errored after the one live endpoint call was marked. Repeated execution remains blocked.'
            : 'Kraken tiny live order failed before any production order endpoint call was marked.',
          payload: {
            error: createPlainEnglishProductionError
              ? createPlainEnglishProductionError('Kraken tiny live order', error)
              : error.message,
            productionOrderEndpointCalled: endpointCalled
          }
        });
      }

      const execution = previewId
        ? parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [previewId, req.session.userId]))
        : null;
      const journal = execution
        ? await getKrakenTinyLiveExecutionJournal({ userId: req.session.userId, executionId: execution.id })
        : [];
      const auditState = buildKrakenTinyLiveAuditState({ execution, journal });

      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Kraken tiny live order', error)
          : error.message,
        execution,
        auditState,
        executionJournal: auditState.journal,
        postTradeVerification: execution?.production_order_endpoint_called
          ? buildKrakenTinyLivePostTradeVerification({ execution })
          : null,
        safetyBoundary: {
          ...createProductionSafetyBoundary(Boolean(execution?.production_order_endpoint_called)),
          productionOrderEndpointCalled: Boolean(execution?.production_order_endpoint_called)
        }
      });
    }
  });

  app.get('/api/v1/live-trading-launch/kraken-tiny-live-test/orders/:id/status', requireAuth, async (req, res) => {
    try {
      const row = await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);

      if (!row) {
        return res.status(404).json({ error: 'Kraken tiny live order not found.' });
      }

      const execution = parseProductionOrderExecution(row);

      if (!isKrakenTinyLiveExecution(execution)) {
        return res.status(400).json({ error: 'This is not a Kraken tiny live test order.' });
      }

      if (!execution.exchange_order_id) {
        const journal = await getKrakenTinyLiveExecutionJournal({ userId: req.session.userId, executionId: execution.id });
        const auditState = buildKrakenTinyLiveAuditState({ execution, journal });
        return res.json({
          execution,
          status: execution.status,
          resultScreen: execution.result?.resultScreen || execution.preview,
          auditState,
          executionJournal: auditState.journal,
          postTradeVerification: execution.production_order_endpoint_called
            ? buildKrakenTinyLivePostTradeVerification({ execution })
            : null,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const order = normalizeProductionOrderDraft({
        exchangeName: execution.exchange_name,
        symbol: execution.symbol,
        side: execution.side,
        orderType: execution.order_type,
        quantity: execution.quantity,
        limitPrice: execution.limit_price,
        notionalUsd: execution.notional_usd,
        maxOrderUsd: execution.max_order_usd,
        clientOrderId: execution.client_order_id,
        strategyId: execution.strategy_id
      });
      const connector = execution.connector_id
        ? parseExchangeConnector(await getExchangeConnectorRow(execution.connector_id))
        : await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const [credentials, adapter] = await Promise.all([
        connector ? loadConnectorProductionCredentialsForUser(connector, req.session.userId) : Promise.resolve(null),
        Promise.resolve(getProductionAdapter('kraken'))
      ]);
      const status = await queryProductionOrderStatus({
        order,
        credentials,
        adapter,
        exchangeOrderId: execution.exchange_order_id
      });
      const krakenOrder = status?.result?.[execution.exchange_order_id] || {};
      const normalizedStatus = String(krakenOrder.status || status?.status || 'submitted');

      await dbRun(
        `UPDATE production_order_executions
         SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          normalizedStatus,
          JSON.stringify({
            ...(execution.result || {}),
            orderStatus: status,
            phase6GKrakenTinyLiveTest: true,
            safetyBoundary: createProductionSafetyBoundary(false)
          }),
          execution.id,
          req.session.userId
        ]
      );
      await recordProductionOrderEvent({
        executionId: execution.id,
        userId: req.session.userId,
        status: normalizedStatus,
        summary: `Kraken tiny live order status refreshed: ${normalizedStatus}.`,
        payload: status
      });

      const updatedExecution = parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [execution.id, req.session.userId]));
      const journal = await getKrakenTinyLiveExecutionJournal({ userId: req.session.userId, executionId: execution.id });
      const auditState = buildKrakenTinyLiveAuditState({ execution: updatedExecution, journal });

      res.json({
        execution: updatedExecution,
        status,
        auditState,
        executionJournal: auditState.journal,
        postTradeVerification: buildKrakenTinyLivePostTradeVerification({ execution: updatedExecution }),
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Kraken tiny live status', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/kraken-tiny-live-test/orders/:id/cancel', requireAuth, async (req, res) => {
    try {
      const row = await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);

      if (!row) {
        return res.status(404).json({ error: 'Kraken tiny live order not found.' });
      }

      const execution = parseProductionOrderExecution(row);

      if (!isKrakenTinyLiveExecution(execution)) {
        return res.status(400).json({ error: 'This is not a Kraken tiny live test order.' });
      }

      if (!execution.exchange_order_id) {
        await dbRun(
          `UPDATE production_order_executions
           SET status = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
          ['canceled', execution.id, req.session.userId]
        );
        await recordProductionOrderEvent({
          executionId: execution.id,
          userId: req.session.userId,
          status: 'canceled',
          summary: 'Local Kraken tiny live preview canceled before any exchange order id existed.',
          payload: { productionOrderEndpointCalled: execution.production_order_endpoint_called }
        });

        return res.json({
          execution: parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [execution.id, req.session.userId])),
          resultScreen: {
            exchange: 'Kraken',
            symbol: execution.symbol,
            fillStatus: 'canceled',
            exchangeOrderId: '',
            rejectionReason: ''
          },
          auditState: buildKrakenTinyLiveAuditState({ execution }),
          postTradeVerification: buildKrakenTinyLivePostTradeVerification({ execution }),
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const order = normalizeProductionOrderDraft({
        exchangeName: execution.exchange_name,
        symbol: execution.symbol,
        side: execution.side,
        orderType: execution.order_type,
        quantity: execution.quantity,
        limitPrice: execution.limit_price,
        notionalUsd: execution.notional_usd,
        maxOrderUsd: execution.max_order_usd,
        clientOrderId: execution.client_order_id,
        strategyId: execution.strategy_id
      });
      const connector = execution.connector_id
        ? parseExchangeConnector(await getExchangeConnectorRow(execution.connector_id))
        : await findOrCreateProductionConnector({ exchangeName: 'kraken' });
      const [credentials, adapter] = await Promise.all([
        connector ? loadConnectorProductionCredentialsForUser(connector, req.session.userId) : Promise.resolve(null),
        Promise.resolve(getProductionAdapter('kraken'))
      ]);
      const canceled = await cancelProductionOrder({
        order,
        credentials,
        adapter,
        exchangeOrderId: execution.exchange_order_id
      });

      await dbRun(
        `UPDATE production_order_executions
         SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          canceled.status,
          JSON.stringify({
            ...canceled,
            phase6GKrakenTinyLiveTest: true
          }),
          execution.id,
          req.session.userId
        ]
      );
      await recordProductionOrderEvent({
        executionId: execution.id,
        userId: req.session.userId,
        status: canceled.status,
        summary: `Kraken tiny live cancel finished with status ${canceled.status}.`,
        payload: canceled
      });

      const updatedExecution = parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [execution.id, req.session.userId]));
      const journal = await getKrakenTinyLiveExecutionJournal({ userId: req.session.userId, executionId: execution.id });
      const auditState = buildKrakenTinyLiveAuditState({ execution: updatedExecution, journal });

      res.json({
        execution: updatedExecution,
        cancellation: canceled,
        resultScreen: canceled.resultScreen,
        auditState,
        executionJournal: auditState.journal,
        postTradeVerification: buildKrakenTinyLivePostTradeVerification({ execution: updatedExecution, lifecycle: canceled }),
        safetyBoundary: canceled.safetyBoundary
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Kraken tiny live cancel', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/kraken-tiny-live-test/emergency-stop', requireAuth, async (req, res) => {
    try {
      const latestOrders = await getLatestKrakenTinyLiveExecutions(req.session.userId, 50);
      const openOrders = latestOrders.filter(order => (
        order.exchange_order_id
          && order.production_order_endpoint_called
          && krakenTinyLiveOpenStatuses.has(String(order.status || '').toLowerCase())
      ));
      const canceled = [];

      for (const execution of openOrders) {
        try {
          const order = normalizeProductionOrderDraft({
            exchangeName: execution.exchange_name,
            symbol: execution.symbol,
            side: execution.side,
            orderType: execution.order_type,
            quantity: execution.quantity,
            limitPrice: execution.limit_price,
            notionalUsd: execution.notional_usd,
            maxOrderUsd: execution.max_order_usd,
            clientOrderId: execution.client_order_id,
            strategyId: execution.strategy_id
          });
          const connector = execution.connector_id
            ? parseExchangeConnector(await getExchangeConnectorRow(execution.connector_id))
            : await findOrCreateProductionConnector({ exchangeName: 'kraken' });
          const credentials = connector
            ? await loadConnectorProductionCredentialsForUser(connector, req.session.userId)
            : null;
          const cancellation = await cancelProductionOrder({
            order,
            credentials,
            adapter: getProductionAdapter('kraken'),
            exchangeOrderId: execution.exchange_order_id
          });

          await dbRun(
            `UPDATE production_order_executions
             SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [
              cancellation.status,
              JSON.stringify({
                ...cancellation,
                phase6GKrakenTinyLiveTest: true,
                emergencyStop: true
              }),
              execution.id,
              req.session.userId
            ]
          );
          canceled.push({ id: execution.id, status: cancellation.status, exchangeOrderId: execution.exchange_order_id });
        } catch (error) {
          canceled.push({ id: execution.id, status: 'cancel_review_needed', error: error.message });
        }
      }

      const connector = await findOrCreateProductionConnector({ exchangeName: 'kraken' });

      if (connector) {
        const settings = mergeProductionConnectionSettings(connector, {
          phase6GTinyLiveEmergencyStoppedAt: new Date().toISOString(),
          productionOrderEndpointEnabled: false,
          automatedLiveTradingEnabled: false,
          unrestrictedAutonomousTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          marginEnabled: false,
          futuresEnabled: false,
          leverageEnabled: false
        });

        await dbRun(
          `UPDATE exchange_connectors
           SET settings_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [JSON.stringify(settings), connector.id]
        );
      }

      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6g_kraken_tiny_live_emergency_stop',
          'complete',
          'Kraken tiny live emergency stop ran. Any tracked open tiny test orders were canceled when possible.',
          JSON.stringify({
            canceled,
            productionOrderEndpointEnabled: false,
            automatedLiveTradingEnabled: false,
            unrestrictedAutonomousTradingEnabled: false,
            walletSigningEnabled: false,
            withdrawalsEnabled: false
          })
        ]
      );

      res.json({
        status: 'complete',
        canceled,
        summary: canceled.length
          ? 'Emergency Stop sent cancel requests for tracked open Kraken tiny test orders.'
          : 'Emergency Stop complete. No open Kraken tiny test order was tracked.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('Kraken tiny live emergency stop', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/exchange-connectors/:id/production-credentials', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const exchangeId = normalizeExchangeId(connector.settings?.registryId || connector.exchange_name);
      const adapter = getProductionAdapter(exchangeId);

      if (!adapter) {
        return res.status(400).json({
          error: `${connector.label || exchangeId} is not supported for Phase 6 production execution.`,
          automatedLiveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false
        });
      }

      const permissions = sanitizeProductionPermissionsChecklist(req.body?.permissionsChecklist || {});

      if (permissions.missing.length) {
        return res.status(400).json({
          error: 'Complete every production safety checkbox before saving this key.',
          missing: permissions.missing,
          nextClick: 'Check every production safety box, then click Save Production API Key.',
          automatedLiveTradingEnabled: false,
          unrestrictedAutonomousTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          marginEnabled: false,
          futuresEnabled: false,
          leverageEnabled: false
        });
      }

      const credentials = sanitizeProductionCredentialInput(req.body?.credentials || req.body || {}, adapter);
      const referenceName = getProductionReferenceName({
        userId: req.session.userId,
        connectorId: connector.id,
        exchangeName: exchangeId
      });
      const reference = await upsertReadOnlyLocalReference({
        userId: req.session.userId,
        existingReferenceId: null,
        label: `${adapter.displayName} Controlled Production Vault`,
        referenceName,
        notes: 'Encrypted local Phase 6 production execution vault reference. Requires owner approvals, dry-run checks, and final typed confirmation before any order endpoint can be called.'
      });
      const saved = await saveProductionVaultCredentials({
        referenceName,
        connector,
        exchangeName: exchangeId,
        credentials,
        permissionsChecklist: permissions.checklist
      });
      const previousConnection = connector.settings?.productionConnection || {};
      const settings = mergeProductionConnectionSettings(connector, {
        referenceName,
        localReferenceId: reference.id,
        connectionStatus: 'production_key_saved_locked',
        plainEnglishStatus: 'Production key saved locally. Live execution remains locked until connectivity, approvals, dry-run, and final order confirmation pass.',
        lastCredentialRotationAt: saved.rotatedAt,
        rotationNumber: Number(previousConnection.rotationNumber || 0) + 1,
        permissionsChecklist: permissions.checklist,
        apiKeyFingerprint: saved.apiKeyFingerprint,
        adapterStatus: adapter.adapterStatus
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          JSON.stringify(settings),
          'Production credential values are encrypted in the local owner vault. SQLite stores only a local reference.',
          connector.id
        ]
      );

      res.status(201).json({
        connector: parseExchangeConnector(await getExchangeConnectorRow(connector.id)),
        reference,
        vault: {
          stored: true,
          referenceName: saved.referenceName,
          apiKeyFingerprint: saved.apiKeyFingerprint,
          hasExtraPhrase: saved.hasExtraPhrase,
          rotatedAt: saved.rotatedAt,
          secretValuesReturned: false
        },
        nextClick: 'Click Test Production Connection.',
        safetyBoundary: {
          controlledProductionOnly: true,
          productionOrderEndpointEnabled: false,
          productionOrderEndpointCalled: false,
          automatedLiveTradingEnabled: false,
          unrestrictedAutonomousTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          marginEnabled: false,
          futuresEnabled: false,
          leverageEnabled: false,
          privateValuesReturnedToUi: false
        }
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError(req.body?.exchangeName || 'production exchange', error)
          : error.message
      });
    }
  });

  app.delete('/api/v1/exchange-connectors/:id/production-credentials', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const referenceName = connector.settings?.productionConnection?.referenceName || null;
      const deletion = referenceName
        ? await deleteProductionVaultCredentials(referenceName)
        : { deleted: false, referenceName: null };

      if (referenceName) {
        await dbRun(
          `UPDATE local_secret_references
           SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND reference_name = ?`,
          [
            'disabled',
            'Phase 6 production exchange API vault entry was deleted by owner action.',
            req.session.userId,
            referenceName
          ]
        );
      }

      const settings = mergeProductionConnectionSettings(connector, {
        referenceName: null,
        localReferenceId: null,
        connectionStatus: 'not_connected',
        plainEnglishStatus: 'Production key deleted. Production execution is locked.',
        lastDeletedAt: new Date().toISOString(),
        apiKeyFingerprint: null,
        permissionsChecklist: null
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          JSON.stringify(settings),
          'No credential values stored in SQLite.',
          connector.id
        ]
      );

      res.json({
        deleted: deletion.deleted,
        connector: parseExchangeConnector(await getExchangeConnectorRow(connector.id)),
        nextClick: 'Save a new production key later if needed.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/exchange-connectors/:id/test-production-connection', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const exchangeId = normalizeExchangeId(connector.settings?.registryId || connector.exchange_name);
      const adapter = getProductionAdapter(exchangeId);
      const credentials = await loadConnectorProductionCredentialsForUser(connector, req.session.userId);
      const test = await testProductionExchangeConnection({ credentials, adapter });
      const settings = mergeProductionConnectionSettings(connector, {
        connectionStatus: test.status,
        plainEnglishStatus: test.plainEnglishStatus,
        lastProductionConnectionTestAt: new Date().toISOString(),
        lastProductionPermissionStatus: {
          canTrade: test.canTrade,
          canWithdraw: test.canWithdraw,
          spotAllowed: test.spotAllowed,
          marginDetected: test.marginDetected,
          futuresDetected: test.futuresDetected
        }
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          test.status === 'production_account_verified' ? 'configured' : 'review_needed',
          JSON.stringify(settings),
          connector.id
        ]
      );

      res.json({
        connector: parseExchangeConnector(await getExchangeConnectorRow(connector.id)),
        test,
        nextClick: test.status === 'production_account_verified'
          ? 'Record owner approval gates, then run a production dry-run preview.'
          : 'Fix the production key permissions, then test again.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('production connection test', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6/approval', requireAuth, async (req, res) => {
    try {
      const scopeType = String(req.body?.scopeType || req.body?.scope_type || '').trim();
      const exchangeName = normalizeExchangeId(req.body?.exchangeName || '');
      const symbol = String(req.body?.symbol || '').trim().toUpperCase().replace('-', '/');
      const strategyId = req.body?.strategyId ? Number(req.body.strategyId) : null;
      const capitalLimitUsd = Math.max(0, Number(req.body?.capitalLimitUsd || 0));
      const confirmation = String(req.body?.confirmation || '').trim();
      const acknowledgment = {
        liveRiskAcknowledged: Boolean(req.body?.liveRiskAcknowledged),
        withdrawalsDisabledAcknowledged: Boolean(req.body?.withdrawalsDisabledAcknowledged),
        noAutonomousScalingAcknowledged: Boolean(req.body?.noAutonomousScalingAcknowledged),
        ownerUnderstandsRealMoney: Boolean(req.body?.ownerUnderstandsRealMoney)
      };

      if (!phase6ApprovalScopeTypes.includes(scopeType)) {
        return res.status(400).json({ error: 'Choose a valid approval type.' });
      }

      if (confirmation !== phase6EnableLiveConfirmationPhrase) {
        return res.status(400).json({
          error: `Type exactly: ${phase6EnableLiveConfirmationPhrase}`,
          nextClick: 'Type the approval phrase, then click Record Controlled Approval.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      if (!acknowledgment.liveRiskAcknowledged || !acknowledgment.withdrawalsDisabledAcknowledged || !acknowledgment.noAutonomousScalingAcknowledged || !acknowledgment.ownerUnderstandsRealMoney) {
        return res.status(400).json({
          error: 'Acknowledge the live-risk, withdrawal-disabled, no-autonomous-scaling, and real-money warnings before recording approval.',
          nextClick: 'Check every acknowledgment box, then click Record Controlled Approval.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      let scopeValue = '';

      if (scopeType === 'enable_live_trading') scopeValue = 'global';
      if (scopeType === 'enable_exchange') scopeValue = exchangeName;
      if (scopeType === 'enable_strategy') scopeValue = strategyId ? String(strategyId) : 'manual';
      if (scopeType === 'increase_capital_limits') scopeValue = `capital:${capitalLimitUsd.toFixed(2)}`;
      if (scopeType === 'enable_symbol') scopeValue = exchangeName && symbol ? `${exchangeName}:${symbol}` : symbol;

      if (!scopeValue) {
        return res.status(400).json({ error: 'This approval type needs an exchange, symbol, strategy, or capital limit.' });
      }

      const approvalHash = crypto
        .createHash('sha256')
        .update(`${req.session.userId}:${scopeType}:${scopeValue}:${confirmation}:${Date.now()}`)
        .digest('hex');
      const expiresAt = req.body?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const insert = await dbRun(
        `INSERT INTO production_execution_approvals
         (user_id, scope_type, scope_value, exchange_name, symbol, strategy_id, capital_limit_usd,
          status, approval_hash, acknowledgment_json, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          scopeType,
          scopeValue,
          exchangeName || null,
          symbol || null,
          strategyId,
          capitalLimitUsd,
          'active',
          approvalHash,
          JSON.stringify(acknowledgment),
          expiresAt
        ]
      );

      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6_owner_approval_recorded',
          'active',
          `Owner recorded Phase 6 approval: ${scopeType} ${scopeValue}.`,
          JSON.stringify({
            scopeType,
            scopeValue,
            capitalLimitUsd,
            liveTradingEnabled: false,
            productionOrderEndpointEnabled: false,
            autonomousLiveTradingEnabled: false,
            withdrawalsEnabled: false,
            walletSigningEnabled: false
          })
        ]
      );

      res.status(201).json({
        approval: parseProductionApproval(await dbGet('SELECT * FROM production_execution_approvals WHERE id = ? AND user_id = ?', [insert.lastID, req.session.userId])),
        nextClick: 'Run Production Dry-Run Preview.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6/preview', requireAuth, async (req, res) => {
    try {
      const context = await buildProductionSafetyContext({
        userId: req.session.userId,
        orderInput: req.body?.order || req.body || {},
        marketContext: {
          ...(req.body?.marketContext || {}),
          productionDryRunPassed: true
        },
        accountContext: req.body?.accountContext || {},
        ownerConfirmation: req.body?.ownerConfirmation || '',
        policy: req.body?.policy || {}
      });
      const manualCheckOnlyMissing = context.safety.missing.length === 1
        && context.safety.missing[0]?.id === 'manual_order_confirmation';
      const previewReady = context.safety.passed || manualCheckOnlyMissing;
      const status = previewReady ? 'preview_ready' : 'preview_blocked';
      const insert = await dbRun(
        `INSERT INTO production_order_executions
         (user_id, connector_id, risk_profile_id, strategy_id, exchange_name, symbol, side, order_type,
          quantity, limit_price, notional_usd, max_order_usd, client_order_id, status, readiness_json,
          preview_json, production_order_endpoint_enabled, production_order_endpoint_called,
          automated_live_trading_enabled, unrestricted_autonomous_trading_enabled, wallet_signing_enabled,
          withdrawals_enabled, margin_enabled, futures_enabled, leverage_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          context.connector?.id || null,
          context.riskProfile?.id || null,
          context.order.strategyId,
          context.order.exchangeName,
          context.order.symbol,
          context.order.side,
          context.order.orderType,
          context.order.quantity,
          context.order.limitPrice || null,
          context.order.notionalUsd || 0,
          context.order.maxOrderUsd || 0,
          context.order.clientOrderId,
          status,
          JSON.stringify(context.safety),
          JSON.stringify(context.preview),
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      );

      await recordProductionOrderEvent({
        executionId: insert.lastID,
        userId: req.session.userId,
        status,
        summary: previewReady
          ? 'Production order preview passed dry-run checks. The real order still requires final typed owner confirmation.'
          : 'Production order preview is blocked. No production order endpoint was called.',
        payload: {
          preview: context.preview,
          failedChecks: context.safety.missing,
          safetyBoundary: {
            ...context.safety.safetyBoundary,
            productionOrderEndpointCalled: false
          }
        }
      });

      res.status(previewReady ? 201 : 409).json({
        previewId: insert.lastID,
        preview: context.preview,
        safety: context.safety,
        execution: parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [insert.lastID, req.session.userId])),
        nextClick: previewReady
          ? `Type "${phase6OrderConfirmationPhrase}" and click Place Controlled Production Order.`
          : context.safety.nextClick,
        safetyBoundary: {
          ...context.safety.safetyBoundary,
          productionOrderEndpointCalled: false
        }
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError(req.body?.order?.exchangeName || req.body?.exchangeName || 'production exchange', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6/place', requireAuth, async (req, res) => {
    const previewId = Number(req.body?.previewId || req.body?.id || 0);

    try {
      const existingRow = previewId
        ? await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [previewId, req.session.userId])
        : null;

      if (!existingRow) {
        return res.status(404).json({
          error: 'Create a production order preview first, then place the order from that preview.',
          nextClick: 'Click Run Production Dry-Run Preview.',
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const existing = parseProductionOrderExecution(existingRow);
      const ownerConfirmation = String(req.body?.ownerConfirmation || '').trim();
      const orderInput = {
        exchangeName: existing.exchange_name,
        symbol: existing.symbol,
        side: existing.side,
        orderType: existing.order_type,
        quantity: existing.quantity,
        limitPrice: existing.limit_price,
        notionalUsd: existing.notional_usd,
        maxOrderUsd: existing.max_order_usd,
        clientOrderId: existing.client_order_id,
        strategyId: existing.strategy_id
      };
      const context = await buildProductionSafetyContext({
        userId: req.session.userId,
        orderInput,
        marketContext: {
          ...(req.body?.marketContext || {}),
          productionDryRunPassed: true
        },
        accountContext: req.body?.accountContext || {},
        ownerConfirmation,
        policy: req.body?.policy || {},
        ignoreExecutionId: existing.id
      });
      const ownerConfirmationHash = ownerConfirmation
        ? crypto.createHash('sha256').update(`${req.session.userId}:${ownerConfirmation}`).digest('hex')
        : null;

      await dbRun(
        `UPDATE production_order_executions
         SET readiness_json = ?, preview_json = ?, owner_confirmation_hash = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          JSON.stringify(context.safety),
          JSON.stringify(context.preview),
          ownerConfirmationHash,
          existing.id,
          req.session.userId
        ]
      );

      if (!context.safety.passed) {
        await dbRun(
          `UPDATE production_order_executions
           SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
          [
            'rejected',
            JSON.stringify({
              resultScreen: {
                exchange: context.adapter?.displayName || context.order.displayName,
                symbol: context.order.symbol,
                orderType: context.order.orderType,
                notionalUsd: context.order.notionalUsd,
                fillStatus: 'rejected',
                rejectionReason: context.safety.missing[0]?.note || 'Production safety check failed.'
              },
              failedChecks: context.safety.missing,
              safetyBoundary: {
                ...context.safety.safetyBoundary,
                productionOrderEndpointCalled: false
              }
            }),
            existing.id,
            req.session.userId
          ]
        );
        await recordProductionOrderEvent({
          executionId: existing.id,
          userId: req.session.userId,
          status: 'rejected',
          summary: 'Production safety gates blocked the order. No production order endpoint was called.',
          payload: { failedChecks: context.safety.missing }
        });

        return res.status(409).json({
          execution: parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [existing.id, req.session.userId])),
          safety: context.safety,
          nextClick: context.safety.nextClick,
          safetyBoundary: {
            ...context.safety.safetyBoundary,
            productionOrderEndpointCalled: false
          }
        });
      }

      await dbRun(
        `UPDATE production_order_executions
         SET status = ?, production_order_endpoint_enabled = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        ['approved', 1, existing.id, req.session.userId]
      );
      await recordProductionOrderEvent({
        executionId: existing.id,
        userId: req.session.userId,
        status: 'approved',
        summary: 'Owner manually approved one controlled production spot order. Autonomous trading remains disabled.',
        payload: {
          order: context.order,
          safetyBoundary: context.safety.safetyBoundary
        }
      });

      const lifecycle = await runProductionOrderLifecycle({
        order: context.safety.normalizedOrder || context.order,
        credentials: context.credentials,
        adapter: context.adapter
      });

      await dbRun(
        `UPDATE production_order_executions
         SET status = ?, exchange_order_id = ?, result_json = ?, production_order_endpoint_called = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          lifecycle.status,
          lifecycle.exchangeOrderId || null,
          JSON.stringify(lifecycle),
          lifecycle.safetyBoundary?.productionOrderEndpointCalled ? 1 : 0,
          existing.id,
          req.session.userId
        ]
      );
      await recordProductionOrderEvent({
        executionId: existing.id,
        userId: req.session.userId,
        status: lifecycle.status,
        summary: `Controlled production spot order lifecycle finished with status ${lifecycle.status}.`,
        payload: {
          exchangeOrderId: lifecycle.exchangeOrderId,
          resultScreen: lifecycle.resultScreen,
          safetyBoundary: lifecycle.safetyBoundary
        }
      });

      res.json({
        execution: parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [existing.id, req.session.userId])),
        resultScreen: lifecycle.resultScreen,
        lifecycle,
        safety: context.safety,
        nextClick: 'Track order status or cancel the order if it is still open.',
        safetyBoundary: {
          ...lifecycle.safetyBoundary,
          automatedLiveTradingEnabled: false,
          unrestrictedAutonomousTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false
        }
      });
    } catch (error) {
      const message = createPlainEnglishProductionError
        ? createPlainEnglishProductionError(req.body?.exchangeName || 'production exchange', error)
        : error.message;

      if (previewId) {
        await dbRun(
          `UPDATE production_order_executions
           SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
          [
            'rejected',
            JSON.stringify({
              resultScreen: {
                fillStatus: 'rejected',
                rejectionReason: message
              },
              rawError: error?.body || null,
              safetyBoundary: createProductionSafetyBoundary(false)
            }),
            previewId,
            req.session.userId
          ]
        );
        await recordProductionOrderEvent({
          executionId: previewId,
          userId: req.session.userId,
          status: 'rejected',
          summary: message,
          payload: { rawError: error?.body || null }
        });
      }

      res.status(error.status || 500).json({
        error: message,
        execution: previewId
          ? parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [previewId, req.session.userId]))
          : null,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6/orders/:id/cancel', requireAuth, async (req, res) => {
    try {
      const row = await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);

      if (!row) {
        return res.status(404).json({ error: 'Production order execution not found.' });
      }

      const execution = parseProductionOrderExecution(row);
      const order = normalizeProductionOrderDraft({
        exchangeName: execution.exchange_name,
        symbol: execution.symbol,
        side: execution.side,
        orderType: execution.order_type,
        quantity: execution.quantity,
        limitPrice: execution.limit_price,
        notionalUsd: execution.notional_usd,
        maxOrderUsd: execution.max_order_usd,
        clientOrderId: execution.client_order_id,
        strategyId: execution.strategy_id
      });
      const connector = execution.connector_id
        ? parseExchangeConnector(await getExchangeConnectorRow(execution.connector_id))
        : await findOrCreateProductionConnector({ exchangeName: execution.exchange_name });
      const [credentials, adapter] = await Promise.all([
        connector ? loadConnectorProductionCredentialsForUser(connector, req.session.userId) : Promise.resolve(null),
        Promise.resolve(getProductionAdapter(execution.exchange_name))
      ]);
      const canceled = await cancelProductionOrder({
        order,
        credentials,
        adapter,
        exchangeOrderId: execution.exchange_order_id
      });

      await dbRun(
        `UPDATE production_order_executions
         SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          canceled.status,
          JSON.stringify(canceled),
          execution.id,
          req.session.userId
        ]
      );
      await recordProductionOrderEvent({
        executionId: execution.id,
        userId: req.session.userId,
        status: canceled.status,
        summary: `Production cancel request finished with status ${canceled.status}.`,
        payload: canceled
      });

      res.json({
        execution: parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [execution.id, req.session.userId])),
        resultScreen: canceled.resultScreen,
        cancellation: canceled,
        safetyBoundary: canceled.safetyBoundary
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('production cancel', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.get('/api/v1/live-trading-launch/phase6/orders/:id/status', requireAuth, async (req, res) => {
    try {
      const row = await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);

      if (!row) {
        return res.status(404).json({ error: 'Production order execution not found.' });
      }

      const execution = parseProductionOrderExecution(row);

      if (!execution.exchange_order_id) {
        return res.json({
          execution,
          resultScreen: execution.result?.resultScreen || execution.preview,
          status: execution.status,
          safetyBoundary: createProductionSafetyBoundary(false)
        });
      }

      const order = normalizeProductionOrderDraft({
        exchangeName: execution.exchange_name,
        symbol: execution.symbol,
        side: execution.side,
        orderType: execution.order_type,
        quantity: execution.quantity,
        limitPrice: execution.limit_price,
        notionalUsd: execution.notional_usd,
        maxOrderUsd: execution.max_order_usd,
        clientOrderId: execution.client_order_id,
        strategyId: execution.strategy_id
      });
      const connector = execution.connector_id
        ? parseExchangeConnector(await getExchangeConnectorRow(execution.connector_id))
        : await findOrCreateProductionConnector({ exchangeName: execution.exchange_name });
      const [credentials, adapter] = await Promise.all([
        connector ? loadConnectorProductionCredentialsForUser(connector, req.session.userId) : Promise.resolve(null),
        Promise.resolve(getProductionAdapter(execution.exchange_name))
      ]);
      const status = await queryProductionOrderStatus({
        order,
        credentials,
        adapter,
        exchangeOrderId: execution.exchange_order_id
      });
      const normalizedStatus = String(status?.status || status?.data?.[0]?.state || status?.result?.list?.[0]?.orderStatus || 'submitted');

      await dbRun(
        `UPDATE production_order_executions
         SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          normalizedStatus,
          JSON.stringify({ orderStatus: status, safetyBoundary: createProductionSafetyBoundary(false) }),
          execution.id,
          req.session.userId
        ]
      );
      await recordProductionOrderEvent({
        executionId: execution.id,
        userId: req.session.userId,
        status: normalizedStatus,
        summary: `Production order status refreshed: ${normalizedStatus}.`,
        payload: status
      });

      res.json({
        execution: parseProductionOrderExecution(await dbGet('SELECT * FROM production_order_executions WHERE id = ? AND user_id = ?', [execution.id, req.session.userId])),
        status,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishProductionError
          ? createPlainEnglishProductionError('production status', error)
          : error.message,
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase6/emergency-stop', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      let disabledCount = 0;

      for (const connector of connectors) {
        const settings = mergeProductionConnectionSettings(connector, {
          liveTradingLocked: true,
          productionOrderEndpointEnabled: false,
          automatedLiveTradingEnabled: false,
          unrestrictedAutonomousTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          marginEnabled: false,
          futuresEnabled: false,
          leverageEnabled: false,
          disabledByEmergencyStopAt: new Date().toISOString()
        });

        await dbRun(
          `UPDATE exchange_connectors
           SET mode = ?, status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            String(connector.mode || '').includes('live') ? 'read_only' : connector.mode,
            String(connector.mode || '').includes('live') ? 'disabled' : connector.status,
            JSON.stringify(settings),
            connector.id
          ]
        );
        disabledCount += connector.settings?.productionConnection ? 1 : 0;
      }

      await dbRun(
        `UPDATE production_execution_approvals
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND status = ?`,
        ['emergency_disabled', req.session.userId, 'active']
      );
      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'phase6_emergency_stop',
          'complete',
          'Phase 6 emergency stop disabled production approvals and live connector flags.',
          JSON.stringify({
            disabledCount,
            productionOrderEndpointEnabled: false,
            automatedLiveTradingEnabled: false,
            unrestrictedAutonomousTradingEnabled: false,
            walletSigningEnabled: false,
            withdrawalsEnabled: false,
            marginEnabled: false,
            futuresEnabled: false,
            leverageEnabled: false
          })
        ]
      );

      res.json({
        status: 'complete',
        disabledCount,
        summary: 'Emergency stop complete. Production approvals and live connector flags are disabled.',
        safetyBoundary: createProductionSafetyBoundary(false)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/live-trading-launch/phase3a/readiness', requireAuth, async (req, res) => {
    try {
      const symbol = req.body?.symbol || 'BTC/USDT';
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const [accountScan, riskProfile] = await Promise.all([
        scanAuthenticatedReadOnlyAccounts({
          connectors,
          symbol,
          credentialLoader: connector => loadConnectorReadOnlyCredentialsForUser(connector, req.session.userId)
        }),
        getActiveLiveReadinessRiskProfile()
      ]);
      const phase3A = buildPhase3AReadiness({ connectors, accountScan, riskProfile });
      const phase3B = buildPhase3BPreparationPlan({ phase3A });

      res.json({
        phase3A,
        phase3B,
        accountScan,
        phase3: buildPhase3Status({ connectors, accountScan }),
        symbolTradingRuleAdapters: (phase3RecommendedExchanges || []).reduce((acc, exchangeName) => {
          acc[exchangeName] = Boolean(fetchSymbolTradingRules);
          return acc;
        }, {}),
        safetyBoundary: phase3A.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishExchangeError
          ? createPlainEnglishExchangeError('Phase 3A authenticated account readiness', error)
          : error.message
      });
    }
  });

  app.post('/api/v1/exchange-connectors/:id/sandbox-credentials', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const exchangeId = normalizeExchangeId(connector.settings?.registryId || connector.exchange_name);
      const adapter = getSandboxAdapter(exchangeId);

      if (!adapter || adapter.adapterStatus !== 'complete') {
        return res.status(400).json({
          error: `${adapter?.displayName || connector.label} sandbox/testnet execution is not complete yet. Use Binance, OKX, or Bybit first.`,
          liveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          productionOrderEndpointEnabled: false
        });
      }

      const permissions = sanitizeSandboxPermissionsChecklist(req.body?.permissionsChecklist || {});

      if (permissions.missing.length) {
        return res.status(400).json({
          error: 'Complete the sandbox/testnet safety checklist before saving this key.',
          missing: permissions.missing,
          nextClick: 'Check every sandbox safety box, then click Save Sandbox Key.',
          liveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          productionOrderEndpointEnabled: false
        });
      }

      const credentials = sanitizeSandboxCredentialInput(req.body?.credentials || req.body || {}, adapter);
      const referenceName = getSandboxReferenceName({
        userId: req.session.userId,
        connectorId: connector.id,
        exchangeName: exchangeId
      });
      const reference = await upsertReadOnlyLocalReference({
        userId: req.session.userId,
        existingReferenceId: null,
        label: `${adapter.displayName} Sandbox/Testnet API Vault`,
        referenceName,
        notes: 'Encrypted local sandbox/testnet vault reference only. Production/live keys are not accepted for this workflow.'
      });
      const saved = await saveSandboxVaultCredentials({
        referenceName,
        connector,
        exchangeName: exchangeId,
        credentials,
        permissionsChecklist: permissions.checklist
      });
      const previousConnection = connector.settings?.sandboxConnection || {};
      const settings = mergeSandboxConnectionSettings(connector, {
        referenceName,
        localReferenceId: reference.id,
        connectionStatus: 'sandbox_key_saved',
        plainEnglishStatus: 'Sandbox/testnet key saved locally. You can now run a sandbox test trade. Production live trading remains locked.',
        lastCredentialRotationAt: saved.rotatedAt,
        rotationNumber: Number(previousConnection.rotationNumber || 0) + 1,
        permissionsChecklist: permissions.checklist,
        apiKeyFingerprint: saved.apiKeyFingerprint,
        adapterStatus: adapter.adapterStatus,
        sandboxMode: adapter.sandboxMode
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET mode = ?, status = ?, settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          'sandbox',
          'configured',
          JSON.stringify(settings),
          'Sandbox/testnet credential values are encrypted in the local owner vault. SQLite stores only a local reference.',
          connector.id
        ]
      );

      res.status(201).json({
        connector: parseExchangeConnector(await getExchangeConnectorRow(connector.id)),
        reference,
        vault: {
          stored: true,
          referenceName: saved.referenceName,
          apiKeyFingerprint: saved.apiKeyFingerprint,
          hasExtraPhrase: saved.hasExtraPhrase,
          rotatedAt: saved.rotatedAt,
          secretValuesReturned: false
        },
        nextClick: 'Click Run Sandbox Test Trade.',
        safetyBoundary: {
          sandboxOnly: true,
          liveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          productionOrderEndpointEnabled: false,
          privateValuesReturnedToUi: false
        }
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: createPlainEnglishSandboxError
          ? createPlainEnglishSandboxError(req.body?.exchangeName || 'sandbox exchange', error)
          : error.message
      });
    }
  });

  app.delete('/api/v1/exchange-connectors/:id/sandbox-credentials', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const referenceName = connector.settings?.sandboxConnection?.referenceName || null;
      const deletion = referenceName
        ? await deleteSandboxVaultCredentials(referenceName)
        : { deleted: false, referenceName: null };

      if (referenceName) {
        await dbRun(
          `UPDATE local_secret_references
           SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND reference_name = ?`,
          [
            'disabled',
            'Sandbox/testnet exchange API vault entry was deleted by owner action.',
            req.session.userId,
            referenceName
          ]
        );
      }

      const settings = mergeSandboxConnectionSettings(connector, {
        referenceName: null,
        localReferenceId: null,
        connectionStatus: 'not_connected',
        plainEnglishStatus: 'Sandbox/testnet key deleted. Production live trading is still locked.',
        lastDeletedAt: new Date().toISOString(),
        apiKeyFingerprint: null,
        permissionsChecklist: null
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          JSON.stringify(settings),
          'No credential values stored in SQLite.',
          connector.id
        ]
      );

      res.json({
        deleted: deletion.deleted,
        connector: parseExchangeConnector(await getExchangeConnectorRow(connector.id)),
        nextClick: 'Save a new sandbox/testnet key later if needed.',
        safetyBoundary: {
          liveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          productionOrderEndpointEnabled: false
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/exchange-connectors/:id/tiny-live-credentials', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const exchangeId = normalizeExchangeId(connector.settings?.registryId || connector.exchange_name);
      const adapter = getTinyLiveAdapter(exchangeId);

      if (!adapter || adapter.adapterStatus !== 'complete') {
        return res.status(400).json({
          error: `${adapter?.displayName || connector.label} tiny live mode is not complete yet. Use Binance first. Coinbase, Kraken, OKX, and Bybit stay prepared but locked.`,
          automatedLiveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          marginEnabled: false,
          futuresEnabled: false
        });
      }

      const permissions = sanitizeTinyLivePermissionsChecklist(req.body?.permissionsChecklist || {});

      if (permissions.missing.length) {
        return res.status(400).json({
          error: 'Complete every tiny live safety checkbox before saving this key.',
          missing: permissions.missing,
          nextClick: 'Check every tiny live safety box, then click Save Tiny Live API Key.',
          automatedLiveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          marginEnabled: false,
          futuresEnabled: false
        });
      }

      const credentials = sanitizeTinyLiveCredentialInput(req.body?.credentials || req.body || {}, adapter);
      const referenceName = getTinyLiveReferenceName({
        userId: req.session.userId,
        connectorId: connector.id,
        exchangeName: exchangeId
      });
      const reference = await upsertReadOnlyLocalReference({
        userId: req.session.userId,
        existingReferenceId: null,
        label: `${adapter.displayName} Tiny Live Manual Test Vault`,
        referenceName,
        notes: 'Encrypted local tiny-live vault reference. Allows only owner-gated manual spot test flow. No withdrawals, wallet signing, margin, futures, or automated trading.'
      });
      const saved = await saveTinyLiveVaultCredentials({
        referenceName,
        connector,
        exchangeName: exchangeId,
        credentials,
        permissionsChecklist: permissions.checklist
      });
      const previousConnection = connector.settings?.tinyLiveConnection || {};
      const settings = mergeTinyLiveConnectionSettings(connector, {
        referenceName,
        localReferenceId: reference.id,
        connectionStatus: 'tiny_live_key_saved_locked',
        plainEnglishStatus: 'Tiny live key saved locally. The system can now verify permissions, but live trading stays locked until preview and manual confirmation pass.',
        lastCredentialRotationAt: saved.rotatedAt,
        rotationNumber: Number(previousConnection.rotationNumber || 0) + 1,
        permissionsChecklist: permissions.checklist,
        apiKeyFingerprint: saved.apiKeyFingerprint,
        adapterStatus: adapter.adapterStatus
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          JSON.stringify(settings),
          'Tiny live credential values are encrypted in the local owner vault. SQLite stores only a local reference.',
          connector.id
        ]
      );

      res.status(201).json({
        connector: parseExchangeConnector(await getExchangeConnectorRow(connector.id)),
        reference,
        vault: {
          stored: true,
          referenceName: saved.referenceName,
          apiKeyFingerprint: saved.apiKeyFingerprint,
          hasExtraPhrase: saved.hasExtraPhrase,
          rotatedAt: saved.rotatedAt,
          secretValuesReturned: false
        },
        nextClick: 'Click Refresh Tiny Live Readiness, then Preview Tiny Live Order.',
        safetyBoundary: {
          manualTinyLiveOnly: true,
          automatedLiveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          marginEnabled: false,
          futuresEnabled: false,
          privateValuesReturnedToUi: false
        }
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: createPlainEnglishTinyLiveError
          ? createPlainEnglishTinyLiveError(req.body?.exchangeName || 'tiny live exchange', error)
          : error.message
      });
    }
  });

  app.delete('/api/v1/exchange-connectors/:id/tiny-live-credentials', requireAuth, async (req, res) => {
    try {
      const connector = parseExchangeConnector(await getExchangeConnectorRow(req.params.id));

      if (!connector) {
        return res.status(404).json({ error: 'Exchange connector not found' });
      }

      const referenceName = connector.settings?.tinyLiveConnection?.referenceName || null;
      const deletion = referenceName
        ? await deleteTinyLiveVaultCredentials(referenceName)
        : { deleted: false, referenceName: null };

      if (referenceName) {
        await dbRun(
          `UPDATE local_secret_references
           SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND reference_name = ?`,
          [
            'disabled',
            'Tiny live exchange API vault entry was deleted by owner action.',
            req.session.userId,
            referenceName
          ]
        );
      }

      const settings = mergeTinyLiveConnectionSettings(connector, {
        referenceName: null,
        localReferenceId: null,
        connectionStatus: 'not_connected',
        plainEnglishStatus: 'Tiny live key deleted. Automated live trading is still locked.',
        lastDeletedAt: new Date().toISOString(),
        apiKeyFingerprint: null,
        permissionsChecklist: null
      });

      await dbRun(
        `UPDATE exchange_connectors
         SET settings_json = ?, secret_storage_note = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          JSON.stringify(settings),
          'No credential values stored in SQLite.',
          connector.id
        ]
      );

      res.json({
        deleted: deletion.deleted,
        connector: parseExchangeConnector(await getExchangeConnectorRow(connector.id)),
        nextClick: 'Save a new tiny live key later if needed.',
        safetyBoundary: {
          automatedLiveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          marginEnabled: false,
          futuresEnabled: false
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/live-trading-launch/phase3b/sandbox-test-trade', requireAuth, async (req, res) => {
    let testId = null;

    try {
      const order = normalizeSandboxOrderDraft(req.body?.order || req.body || {});
      const adapter = getSandboxAdapter(order.exchangeName);
      const connector = await findOrCreateSandboxConnector({ exchangeName: order.exchangeName });
      const [riskProfile, credentials, recentTests] = await Promise.all([
        getActiveLiveReadinessRiskProfile(),
        connector ? loadConnectorSandboxCredentialsForUser(connector, req.session.userId) : Promise.resolve(null),
        getLatestSandboxOrderTests(req.session.userId, 20)
      ]);
      const marketContext = {
        liquidityUsd: 1000000,
        slippagePercent: 0.05,
        priceTimestamp: new Date().toISOString(),
        ...(req.body?.marketContext || {})
      };
      const recentOrderFingerprints = recentTests
        .map(test => test.safety?.orderFingerprint || test.request?.orderFingerprint)
        .filter(Boolean);
      const safety = evaluateSandboxOrderSafety({
        order,
        adapter,
        connector,
        credentials,
        riskProfile,
        marketContext,
        recentOrderFingerprints,
        policy: {
          ...(defaultSandboxPolicy || {}),
          ...(req.body?.policy || {})
        }
      });
      const insert = await dbRun(
        `INSERT INTO sandbox_order_tests
         (user_id, connector_id, risk_profile_id, exchange_name, symbol, side, order_type, quantity,
          limit_price, notional_usd, client_order_id, status, safety_json, request_json,
          live_trading_enabled, wallet_signing_enabled, withdrawals_enabled, production_order_endpoint_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          connector?.id || null,
          riskProfile?.id || null,
          order.exchangeName,
          order.symbol,
          order.side,
          order.orderType,
          order.quantity,
          order.limitPrice || null,
          order.notionalUsd || 0,
          order.clientOrderId,
          'created',
          JSON.stringify(safety),
          JSON.stringify({ order, marketContext, orderFingerprint: safety.orderFingerprint }),
          0,
          0,
          0,
          0
        ]
      );
      testId = insert.lastID;

      await recordSandboxOrderEvent({
        testId,
        userId: req.session.userId,
        status: 'created',
        summary: 'Sandbox order test created locally. Production live trading is locked.',
        payload: { order, safetyBoundary: safety.safetyBoundary }
      });

      if (!safety.passed) {
        const resultScreen = {
          exchange: adapter?.displayName || order.displayName,
          symbol: order.symbol,
          orderType: order.orderType,
          sandboxAmount: order.notionalUsd || order.quantity,
          entryPrice: order.limitPrice || null,
          fillStatus: 'rejected',
          fees: 0,
          rejectionReason: safety.checks.find(check => !check.passed)?.note || 'Sandbox safety check failed.'
        };

        await dbRun(
          `UPDATE sandbox_order_tests
           SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
          [
            'rejected',
            JSON.stringify({ resultScreen, safetyBoundary: safety.safetyBoundary }),
            testId,
            req.session.userId
          ]
        );
        await recordSandboxOrderEvent({
          testId,
          userId: req.session.userId,
          status: 'rejected',
          summary: 'Sandbox safety checks blocked the order. No exchange order endpoint was called.',
          payload: { resultScreen, failedChecks: safety.checks.filter(check => !check.passed) }
        });

        return res.status(409).json({
          test: parseSandboxOrderTest(await dbGet('SELECT * FROM sandbox_order_tests WHERE id = ? AND user_id = ?', [testId, req.session.userId])),
          resultScreen,
          safety,
          nextClick: safety.checks.find(check => !check.passed)?.nextAction || 'Fix the blocked safety check, then retry.',
          safetyBoundary: safety.safetyBoundary
        });
      }

      await recordSandboxOrderEvent({
        testId,
        userId: req.session.userId,
        status: 'submitted',
        summary: `${adapter.displayName} sandbox/testnet adapter is submitting the test order.`,
        payload: { orderType: order.orderType, exchangeName: order.exchangeName }
      });
      await dbRun(
        `UPDATE sandbox_order_tests
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        ['submitted', testId, req.session.userId]
      );

      const lifecycle = await runSandboxOrderLifecycle({ order, credentials, adapter });

      await dbRun(
        `UPDATE sandbox_order_tests
         SET status = ?, exchange_order_id = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          lifecycle.status,
          lifecycle.exchangeOrderId || null,
          JSON.stringify(lifecycle),
          testId,
          req.session.userId
        ]
      );
      await recordSandboxOrderEvent({
        testId,
        userId: req.session.userId,
        status: lifecycle.status,
        summary: `Sandbox/testnet order lifecycle finished with status ${lifecycle.status}.`,
        payload: {
          exchangeOrderId: lifecycle.exchangeOrderId,
          resultScreen: lifecycle.resultScreen,
          safetyBoundary: lifecycle.safetyBoundary
        }
      });

      res.json({
        test: parseSandboxOrderTest(await dbGet('SELECT * FROM sandbox_order_tests WHERE id = ? AND user_id = ?', [testId, req.session.userId])),
        resultScreen: lifecycle.resultScreen,
        lifecycle,
        safety,
        nextClick: 'Review the sandbox result, then repeat with a small test case if needed.',
        safetyBoundary: lifecycle.safetyBoundary
      });
    } catch (error) {
      const exchangeName = req.body?.order?.exchangeName || req.body?.exchangeName || 'sandbox exchange';
      const message = createPlainEnglishSandboxError
        ? createPlainEnglishSandboxError(exchangeName, error)
        : error.message;

      if (testId) {
        await dbRun(
          `UPDATE sandbox_order_tests
           SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
          [
            'rejected',
            JSON.stringify({
              resultScreen: {
                exchange: exchangeName,
                fillStatus: 'rejected',
                rejectionReason: message
              },
              rawError: error?.body || null,
              safetyBoundary: {
                sandboxOnly: true,
                liveTradingEnabled: false,
                walletSigningEnabled: false,
                withdrawalsEnabled: false,
                productionOrderEndpointEnabled: false
              }
            }),
            testId,
            req.session.userId
          ]
        );
        await recordSandboxOrderEvent({
          testId,
          userId: req.session.userId,
          status: 'rejected',
          summary: message,
          payload: { rawError: error?.body || null }
        });
      }

      res.status(500).json({
        error: message,
        test: testId
          ? parseSandboxOrderTest(await dbGet('SELECT * FROM sandbox_order_tests WHERE id = ? AND user_id = ?', [testId, req.session.userId]))
          : null,
        safetyBoundary: {
          sandboxOnly: true,
          liveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          productionOrderEndpointEnabled: false
        }
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase3c/preview', requireAuth, async (req, res) => {
    try {
      const context = await buildTinyLiveSafetyContext({
        userId: req.session.userId,
        orderInput: req.body?.order || req.body || {},
        marketContext: req.body?.marketContext || {},
        ownerConfirmation: req.body?.ownerConfirmation || '',
        policy: req.body?.policy || {}
      });
      const manualCheckOnlyMissing = context.safety.missing.length === 1
        && context.safety.missing[0]?.id === 'manual_owner_confirmation';
      const previewReady = context.safety.passed || manualCheckOnlyMissing;
      const status = previewReady ? 'preview_ready' : 'preview_blocked';
      const insert = await dbRun(
        `INSERT INTO tiny_live_order_tests
         (user_id, connector_id, risk_profile_id, exchange_name, symbol, side, order_type, quantity,
          limit_price, notional_usd, max_test_order_usd, client_order_id, status, readiness_json,
          preview_json, automated_live_trading_enabled, wallet_signing_enabled, withdrawals_enabled,
          margin_enabled, futures_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          context.connector?.id || null,
          context.riskProfile?.id || null,
          context.order.exchangeName,
          context.order.symbol,
          context.order.side,
          context.order.orderType,
          context.order.quantity,
          context.order.limitPrice || null,
          context.order.notionalUsd || 0,
          context.order.maxTestOrderUsd || 0,
          context.order.clientOrderId,
          status,
          JSON.stringify(context.safety),
          JSON.stringify(context.preview),
          0,
          0,
          0,
          0,
          0
        ]
      );

      await recordTinyLiveOrderEvent({
        testId: insert.lastID,
        userId: req.session.userId,
        status,
        summary: previewReady
          ? 'Tiny live order preview is ready. The real order still requires manual owner confirmation.'
          : 'Tiny live order preview is blocked. No exchange order endpoint was called.',
        payload: {
          preview: context.preview,
          failedChecks: context.safety.missing,
          safetyBoundary: context.safety.safetyBoundary
        }
      });

      res.status(previewReady ? 201 : 409).json({
        previewId: insert.lastID,
        preview: context.preview,
        safety: context.safety,
        test: parseTinyLiveOrderTest(await dbGet('SELECT * FROM tiny_live_order_tests WHERE id = ? AND user_id = ?', [insert.lastID, req.session.userId])),
        nextClick: previewReady
          ? `Type "${tinyLiveOwnerConfirmationPhrase}" and click Place One Tiny Live Order.`
          : context.safety.nextClick,
        safetyBoundary: {
          ...context.safety.safetyBoundary,
          orderEndpointCalled: false
        }
      });
    } catch (error) {
      const exchangeName = req.body?.order?.exchangeName || req.body?.exchangeName || 'tiny live exchange';
      res.status(error.statusCode || 500).json({
        error: createPlainEnglishTinyLiveError
          ? createPlainEnglishTinyLiveError(exchangeName, error)
          : error.message,
        safetyBoundary: {
          tinyLiveManualTestImplemented: true,
          orderEndpointCalled: false,
          automatedLiveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false
        }
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase3c/place', requireAuth, async (req, res) => {
    const previewId = Number(req.body?.previewId || req.body?.id || 0);

    try {
      const existingRow = previewId
        ? await dbGet('SELECT * FROM tiny_live_order_tests WHERE id = ? AND user_id = ?', [previewId, req.session.userId])
        : null;

      if (!existingRow) {
        return res.status(404).json({
          error: 'Create a tiny live order preview first, then place the order from that preview.',
          nextClick: 'Click Preview Tiny Live Order.'
        });
      }

      const existing = parseTinyLiveOrderTest(existingRow);
      const ownerConfirmation = String(req.body?.ownerConfirmation || '').trim();
      const orderInput = {
        exchangeName: existing.exchange_name,
        symbol: existing.symbol,
        side: existing.side,
        orderType: existing.order_type,
        quantity: existing.quantity,
        limitPrice: existing.limit_price,
        notionalUsd: existing.notional_usd,
        maxTestOrderUsd: existing.max_test_order_usd,
        clientOrderId: existing.client_order_id
      };
      const context = await buildTinyLiveSafetyContext({
        userId: req.session.userId,
        orderInput,
        marketContext: req.body?.marketContext || {},
        ownerConfirmation,
        policy: req.body?.policy || {},
        ignoreTestId: existing.id
      });
      const ownerConfirmationHash = ownerConfirmation
        ? crypto.createHash('sha256').update(`${req.session.userId}:${ownerConfirmation}`).digest('hex')
        : null;

      await dbRun(
        `UPDATE tiny_live_order_tests
         SET readiness_json = ?, preview_json = ?, owner_confirmation_hash = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          JSON.stringify(context.safety),
          JSON.stringify(context.preview),
          ownerConfirmationHash,
          existing.id,
          req.session.userId
        ]
      );

      if (!context.safety.passed) {
        await dbRun(
          `UPDATE tiny_live_order_tests
           SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
          [
            'rejected',
            JSON.stringify({
              resultScreen: {
                exchange: context.adapter?.displayName || context.order.displayName,
                symbol: context.order.symbol,
                orderType: context.order.orderType,
                notionalUsd: context.order.notionalUsd,
                fillStatus: 'rejected',
                rejectionReason: context.safety.missing[0]?.note || 'Tiny live safety check failed.'
              },
              failedChecks: context.safety.missing,
              safetyBoundary: {
                ...context.safety.safetyBoundary,
                orderEndpointCalled: false
              }
            }),
            existing.id,
            req.session.userId
          ]
        );
        await recordTinyLiveOrderEvent({
          testId: existing.id,
          userId: req.session.userId,
          status: 'rejected',
          summary: 'Tiny live safety gates blocked the order. No exchange order endpoint was called.',
          payload: { failedChecks: context.safety.missing }
        });

        return res.status(409).json({
          test: parseTinyLiveOrderTest(await dbGet('SELECT * FROM tiny_live_order_tests WHERE id = ? AND user_id = ?', [existing.id, req.session.userId])),
          safety: context.safety,
          nextClick: context.safety.nextClick,
          safetyBoundary: {
            ...context.safety.safetyBoundary,
            orderEndpointCalled: false
          }
        });
      }

      await dbRun(
        `UPDATE tiny_live_order_tests
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        ['approved', existing.id, req.session.userId]
      );
      await recordTinyLiveOrderEvent({
        testId: existing.id,
        userId: req.session.userId,
        status: 'approved',
        summary: 'Owner manually approved one tiny live spot order. Automated live trading remains disabled.',
        payload: {
          order: context.order,
          safetyBoundary: context.safety.safetyBoundary
        }
      });

      const lifecycle = await runTinyLiveOrderLifecycle({
        order: context.order,
        credentials: context.credentials,
        adapter: context.adapter
      });

      await dbRun(
        `UPDATE tiny_live_order_tests
         SET status = ?, exchange_order_id = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          lifecycle.status,
          lifecycle.exchangeOrderId || null,
          JSON.stringify(lifecycle),
          existing.id,
          req.session.userId
        ]
      );
      await recordTinyLiveOrderEvent({
        testId: existing.id,
        userId: req.session.userId,
        status: lifecycle.status,
        summary: `Tiny live spot order lifecycle finished with status ${lifecycle.status}.`,
        payload: {
          exchangeOrderId: lifecycle.exchangeOrderId,
          resultScreen: lifecycle.resultScreen,
          safetyBoundary: lifecycle.safetyBoundary
        }
      });

      res.json({
        test: parseTinyLiveOrderTest(await dbGet('SELECT * FROM tiny_live_order_tests WHERE id = ? AND user_id = ?', [existing.id, req.session.userId])),
        resultScreen: lifecycle.resultScreen,
        lifecycle,
        safety: context.safety,
        nextClick: 'Track order status or cancel the order if it is still open.',
        safetyBoundary: {
          ...lifecycle.safetyBoundary,
          automatedLiveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false
        }
      });
    } catch (error) {
      const message = createPlainEnglishTinyLiveError
        ? createPlainEnglishTinyLiveError(req.body?.exchangeName || 'tiny live exchange', error)
        : error.message;

      if (previewId) {
        await dbRun(
          `UPDATE tiny_live_order_tests
           SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
          [
            'rejected',
            JSON.stringify({
              resultScreen: {
                fillStatus: 'rejected',
                rejectionReason: message
              },
              rawError: error?.body || null,
              safetyBoundary: {
                orderEndpointCalled: false,
                automatedLiveTradingEnabled: false,
                walletSigningEnabled: false,
                withdrawalsEnabled: false
              }
            }),
            previewId,
            req.session.userId
          ]
        );
        await recordTinyLiveOrderEvent({
          testId: previewId,
          userId: req.session.userId,
          status: 'rejected',
          summary: message,
          payload: { rawError: error?.body || null }
        });
      }

      res.status(error.status || 500).json({
        error: message,
        test: previewId
          ? parseTinyLiveOrderTest(await dbGet('SELECT * FROM tiny_live_order_tests WHERE id = ? AND user_id = ?', [previewId, req.session.userId]))
          : null,
        safetyBoundary: {
          automatedLiveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false
        }
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase3c/orders/:id/cancel', requireAuth, async (req, res) => {
    try {
      const row = await dbGet('SELECT * FROM tiny_live_order_tests WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);

      if (!row) {
        return res.status(404).json({ error: 'Tiny live order test not found.' });
      }

      const test = parseTinyLiveOrderTest(row);
      const order = normalizeTinyLiveOrderDraft({
        exchangeName: test.exchange_name,
        symbol: test.symbol,
        side: test.side,
        orderType: test.order_type,
        quantity: test.quantity,
        limitPrice: test.limit_price,
        notionalUsd: test.notional_usd,
        maxTestOrderUsd: test.max_test_order_usd,
        clientOrderId: test.client_order_id
      });
      const connector = test.connector_id
        ? parseExchangeConnector(await getExchangeConnectorRow(test.connector_id))
        : await findOrCreateTinyLiveConnector({ exchangeName: test.exchange_name });
      const [credentials, adapter] = await Promise.all([
        connector ? loadConnectorTinyLiveCredentialsForUser(connector, req.session.userId) : Promise.resolve(null),
        Promise.resolve(getTinyLiveAdapter(test.exchange_name))
      ]);
      const canceled = await cancelTinyLiveOrder({
        order,
        credentials,
        adapter,
        exchangeOrderId: test.exchange_order_id
      });

      await dbRun(
        `UPDATE tiny_live_order_tests
         SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          canceled.status,
          JSON.stringify(canceled),
          test.id,
          req.session.userId
        ]
      );
      await recordTinyLiveOrderEvent({
        testId: test.id,
        userId: req.session.userId,
        status: canceled.status,
        summary: `Cancel request finished with status ${canceled.status}.`,
        payload: canceled
      });

      res.json({
        test: parseTinyLiveOrderTest(await dbGet('SELECT * FROM tiny_live_order_tests WHERE id = ? AND user_id = ?', [test.id, req.session.userId])),
        resultScreen: canceled.resultScreen,
        cancellation: canceled,
        safetyBoundary: canceled.safetyBoundary
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishTinyLiveError
          ? createPlainEnglishTinyLiveError('tiny live cancel', error)
          : error.message,
        safetyBoundary: {
          automatedLiveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false
        }
      });
    }
  });

  app.get('/api/v1/live-trading-launch/phase3c/orders/:id/status', requireAuth, async (req, res) => {
    try {
      const row = await dbGet('SELECT * FROM tiny_live_order_tests WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);

      if (!row) {
        return res.status(404).json({ error: 'Tiny live order test not found.' });
      }

      const test = parseTinyLiveOrderTest(row);

      if (!test.exchange_order_id) {
        return res.json({
          test,
          resultScreen: test.result?.resultScreen || test.preview,
          status: test.status,
          safetyBoundary: {
            automatedLiveTradingEnabled: false,
            walletSigningEnabled: false,
            withdrawalsEnabled: false
          }
        });
      }

      const order = normalizeTinyLiveOrderDraft({
        exchangeName: test.exchange_name,
        symbol: test.symbol,
        side: test.side,
        orderType: test.order_type,
        quantity: test.quantity,
        limitPrice: test.limit_price,
        notionalUsd: test.notional_usd,
        maxTestOrderUsd: test.max_test_order_usd,
        clientOrderId: test.client_order_id
      });
      const connector = test.connector_id
        ? parseExchangeConnector(await getExchangeConnectorRow(test.connector_id))
        : await findOrCreateTinyLiveConnector({ exchangeName: test.exchange_name });
      const [credentials, adapter] = await Promise.all([
        connector ? loadConnectorTinyLiveCredentialsForUser(connector, req.session.userId) : Promise.resolve(null),
        Promise.resolve(getTinyLiveAdapter(test.exchange_name))
      ]);
      const status = await getTinyLiveOrderStatus({
        order,
        credentials,
        adapter,
        exchangeOrderId: test.exchange_order_id
      });

      await dbRun(
        `UPDATE tiny_live_order_tests
         SET status = ?, result_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [
          status.status,
          JSON.stringify(status),
          test.id,
          req.session.userId
        ]
      );
      await recordTinyLiveOrderEvent({
        testId: test.id,
        userId: req.session.userId,
        status: status.status,
        summary: `Tiny live order status refreshed: ${status.status}.`,
        payload: status
      });

      res.json({
        test: parseTinyLiveOrderTest(await dbGet('SELECT * FROM tiny_live_order_tests WHERE id = ? AND user_id = ?', [test.id, req.session.userId])),
        resultScreen: status.resultScreen,
        status,
        safetyBoundary: status.safetyBoundary
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: createPlainEnglishTinyLiveError
          ? createPlainEnglishTinyLiveError('tiny live status', error)
          : error.message,
        safetyBoundary: {
          automatedLiveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false
        }
      });
    }
  });

  app.post('/api/v1/live-trading-launch/phase3c/emergency-stop', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      let disabledCount = 0;

      for (const connector of connectors) {
        const settings = {
          ...(connector.settings || {}),
          liveConnection: {
            ...(connector.settings?.liveConnection || {}),
            liveTradingEnabled: false,
            orderEndpointEnabled: false,
            disabledByEmergencyStopAt: new Date().toISOString()
          },
          sandboxConnection: {
            ...(connector.settings?.sandboxConnection || {}),
            productionOrderEndpointEnabled: false,
            liveTradingEnabled: false,
            walletSigningEnabled: false,
            withdrawalsEnabled: false
          },
          tinyLiveConnection: {
            ...(connector.settings?.tinyLiveConnection || {}),
            liveTradingLocked: true,
            manualTinyLiveOnly: true,
            automatedLiveTradingEnabled: false,
            unrestrictedLiveTradingEnabled: false,
            walletSigningEnabled: false,
            withdrawalsEnabled: false,
            marginEnabled: false,
            futuresEnabled: false,
            leverageEnabled: false,
            disabledByEmergencyStopAt: new Date().toISOString()
          }
        };
        const nextMode = String(connector.mode || '').includes('live') ? 'read_only' : connector.mode;
        const nextStatus = String(connector.mode || '').includes('live') ? 'disabled' : connector.status;

        await dbRun(
          `UPDATE exchange_connectors
           SET mode = ?, status = ?, settings_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [nextMode, nextStatus, JSON.stringify(settings), connector.id]
        );
        disabledCount += String(connector.mode || '').includes('live') ? 1 : 0;
      }

      await dbRun(
        `INSERT INTO live_trading_safety_events
         (user_id, event_type, status, summary, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          'emergency_stop_disable_live_connectors',
          'complete',
          'Emergency stop reviewed all connectors and disabled any future live execution flags.',
          JSON.stringify({
            disabledCount,
            liveTradingEnabled: false,
            tinyLiveManualTestEnabled: false,
            automatedLiveTradingEnabled: false,
            walletSigningEnabled: false,
            withdrawalsEnabled: false,
            productionOrderEndpointEnabled: false,
            marginEnabled: false,
            futuresEnabled: false
          })
        ]
      );

      res.json({
        status: 'complete',
        disabledCount,
        summary: 'Emergency stop complete. Any live connector flags are disabled. This action did not enable trading.',
        safetyBoundary: {
          liveTradingEnabled: false,
          tinyLiveManualTestEnabled: false,
          automatedLiveTradingEnabled: false,
          walletSigningEnabled: false,
          withdrawalsEnabled: false,
          productionOrderEndpointEnabled: false,
          marginEnabled: false,
          futuresEnabled: false
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/live-trading-launch/authenticated-read-only-scan', requireAuth, async (req, res) => {
    try {
      const symbol = req.body?.symbol || 'BTC/USDT';
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const [accountScan, riskProfile] = await Promise.all([
        scanAuthenticatedReadOnlyAccounts({
          connectors,
          symbol,
          credentialLoader: connector => loadConnectorReadOnlyCredentialsForUser(connector, req.session.userId)
        }),
        getActiveLiveReadinessRiskProfile()
      ]);
      const phase3A = buildPhase3AReadiness({ connectors, accountScan, riskProfile });

      res.json({
        accountScan,
        phase3A,
        phase3B: buildPhase3BPreparationPlan({ phase3A }),
        phase3: buildPhase3Status({ connectors, accountScan }),
        safetyBoundary: accountScan.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishExchangeError
          ? createPlainEnglishExchangeError('Authenticated read-only account scan', error)
          : error.message
      });
    }
  });

  app.post('/api/v1/live-trading-launch/dry-run-order-safety', requireAuth, async (req, res) => {
    try {
      const review = evaluateLiveExecutionSafety({
        order: req.body?.order || req.body || {},
        policy: {
          ...(defaultLiveSafetyPolicy || {}),
          ...(req.body?.policy || {})
        },
        marketContext: req.body?.marketContext || {},
        accountContext: req.body?.accountContext || {},
        recentOrderFingerprints: Array.isArray(req.body?.recentOrderFingerprints) ? req.body.recentOrderFingerprints : []
      });

      res.json({
        review,
        normalizedOrder: normalizeUniversalOrderDraft(req.body?.order || req.body || {}),
        safetyBoundary: review.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/live-trading-launch/account-aware-arbitrage', requireAuth, (req, res) => {
    try {
      const accountAware = buildAccountAwareArbitrageView({
        scan: req.body?.scan || null,
        accountScan: req.body?.accountScan || null
      });

      res.json({
        accountAware,
        benchmark: buildOutcomeBenchmark({
          candidate: req.body?.candidate || req.body?.scan?.bestCandidate || null,
          accountAwareCandidate: accountAware.candidates?.[0] || null
        }),
        safetyBoundary: accountAware.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/live-trading-launch/replay-spread-history', requireAuth, (req, res) => {
    try {
      const candidates = Array.isArray(req.body?.candidates)
        ? req.body.candidates
        : Array.isArray(req.body?.scan?.candidates)
          ? req.body.scan.candidates
          : [];
      const replay = replaySpreadHistory({
        candidates,
        fillAssumption: req.body?.fillAssumption || {}
      });

      res.json({
        replay,
        benchmark: buildOutcomeBenchmark({
          candidate: candidates[0] || null
        }),
        safetyBoundary: replay.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/live-trading-launch/read-only-scan', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `${exchangeConnectorSelect}
         ORDER BY exchange_connectors.created_at DESC
         LIMIT 500`
      );
      const connectors = rows.map(parseExchangeConnector);
      const scan = await scanReadOnlyArbitrageOpportunities({
        connectors,
        symbol: req.body?.symbol || 'BTC/USDT',
        venues: Array.isArray(req.body?.venues) ? req.body.venues : [],
        connectedOnly: req.body?.connectedOnly === true,
        includeExpanded: req.body?.includeExpanded !== false,
        minGrossSpreadPercent: req.body?.minGrossSpreadPercent,
        minNetProfitPercent: req.body?.minNetProfitPercent,
        minLiquidityUsd: req.body?.minLiquidityUsd,
        maxLatencyMs: req.body?.maxLatencyMs,
        orderSizeUsd: req.body?.orderSizeUsd,
        slippagePercent: req.body?.slippagePercent,
        maxVenues: req.body?.maxVenues,
        maxCandidates: req.body?.maxCandidates
      });

      res.json({
        scan,
        roadmap: buildLiveTradingLaunchRoadmap({ connectors, latestScan: scan })
      });
    } catch (error) {
      res.status(500).json({
        error: createPlainEnglishExchangeError
          ? createPlainEnglishExchangeError('Read-only arbitrage scan', error)
          : error.message
      });
    }
  });

  app.post('/api/v1/live-trading-launch/paper-simulate-opportunity', requireAuth, (req, res) => {
    try {
      res.json({
        simulation: createPaperSimulationForOpportunity(req.body?.opportunity || {}),
        safetyBoundary: {
          paperOnly: true,
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false,
          orderEndpointEnabled: false,
          ordersPlaced: false
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
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
