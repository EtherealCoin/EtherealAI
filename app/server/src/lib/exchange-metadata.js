const {
  EXCHANGE_CONNECTOR_MODES,
  findSensitiveFields,
  findLikelySecretValues
} = require('./secret-safety');

function parseExchangeConnector(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    secret_reference_id: row.secret_reference_id,
    exchange_name: row.exchange_name,
    label: row.label,
    mode: row.mode,
    status: row.status,
    settings: JSON.parse(row.settings_json || '{}'),
    secret_storage_note: row.secret_storage_note,
    secret_reference_label: row.secret_reference_label,
    secret_reference_status: row.secret_reference_status,
    secret_reference_provider_type: row.secret_reference_provider_type,
    secret_reference_name: row.secret_reference_name,
    secret_reference_scope: row.secret_reference_scope,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function parseLocalSecretReference(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    label: row.label,
    provider_type: row.provider_type,
    reference_name: row.reference_name,
    scope: row.scope,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function parseExchangeConnectorReadinessEvent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    connector_id: row.connector_id,
    user_id: row.user_id,
    status: row.status,
    readiness: JSON.parse(row.readiness_json || '{}'),
    created_at: row.created_at,
    connector_label: row.connector_label,
    exchange_name: row.exchange_name,
    connector_mode: row.connector_mode,
    connector_status: row.connector_status
  };
}

function parseExchangeAdapterContractEvent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    connector_id: row.connector_id,
    user_id: row.user_id,
    status: row.status,
    contract: JSON.parse(row.contract_json || '{}'),
    created_at: row.created_at,
    connector_label: row.connector_label,
    exchange_name: row.exchange_name,
    connector_mode: row.connector_mode,
    connector_status: row.connector_status
  };
}

function evaluateExchangeConnectorReadiness({ connector, secretReference }) {
  const checks = [];
  const addCheck = (check) => {
    checks.push({
      severity: 'block',
      metric: null,
      threshold: null,
      note: '',
      ...check,
      passed: Boolean(check.passed)
    });
  };
  const connectorSettings = connector?.settings || {};
  const sensitiveFields = connector ? findSensitiveFields(connectorSettings) : [];
  const likelySecretValues = connector ? findLikelySecretValues(connectorSettings) : [];
  const secretReferenceRequired = connector && connector.mode !== 'paper';

  addCheck({
    id: 'connector_exists',
    label: 'Connector exists',
    passed: Boolean(connector),
    metric: connector ? `#${connector.id}` : null,
    threshold: 'required'
  });

  if (connector) {
    addCheck({
      id: 'mode_supported',
      label: 'Connector mode supported',
      passed: EXCHANGE_CONNECTOR_MODES.has(connector.mode),
      metric: connector.mode,
      threshold: 'paper, read_only, or live_disabled'
    });
    addCheck({
      id: 'connector_not_archived',
      label: 'Connector not archived',
      passed: connector.status !== 'archived',
      metric: connector.status,
      threshold: 'planned, configured, or disabled'
    });
    addCheck({
      id: 'connector_marked_configured',
      label: 'Connector metadata marked configured',
      passed: connector.status === 'configured',
      metric: connector.status,
      threshold: 'configured',
      note: 'This status means the metadata has been reviewed; it still cannot place live orders.'
    });
    addCheck({
      id: 'connector_settings_no_sensitive_fields',
      label: 'Connector settings have no secret-looking fields',
      passed: sensitiveFields.length === 0,
      metric: sensitiveFields.length ? sensitiveFields : 'none detected',
      threshold: 'no API key, secret, token, password, mnemonic, or private-key fields'
    });
    addCheck({
      id: 'connector_settings_no_secret_values',
      label: 'Connector settings have no secret-looking values',
      passed: likelySecretValues.length === 0,
      metric: likelySecretValues.length ? likelySecretValues : 'none detected',
      threshold: 'no key-like inline values'
    });
    addCheck({
      id: 'secret_reference_selected',
      label: 'Local secret reference selected',
      severity: secretReferenceRequired ? 'block' : 'review',
      passed: Boolean(connector.secret_reference_id),
      metric: connector.secret_reference_id ? `#${connector.secret_reference_id}` : 'none',
      threshold: secretReferenceRequired ? 'required for read-only or future-live connector metadata' : 'optional for paper connectors'
    });
  }

  if (connector?.secret_reference_id) {
    addCheck({
      id: 'secret_reference_exists',
      label: 'Local secret reference exists',
      passed: Boolean(secretReference),
      metric: secretReference ? `#${secretReference.id}` : `missing #${connector.secret_reference_id}`,
      threshold: 'required'
    });
  }

  if (secretReference) {
    addCheck({
      id: 'secret_reference_configured',
      label: 'Local secret reference configured',
      passed: secretReference.status === 'configured',
      metric: secretReference.status,
      threshold: 'configured'
    });
    addCheck({
      id: 'secret_reference_scope_exchange',
      label: 'Secret reference scope matches exchange connector',
      passed: secretReference.scope === 'exchange_connector',
      metric: secretReference.scope,
      threshold: 'exchange_connector'
    });
    addCheck({
      id: 'secret_reference_metadata_only',
      label: 'Secret reference is metadata only',
      passed: true,
      metric: 'secret value not stored',
      threshold: 'metadata only',
      note: 'SQLite stores a local reference name, provider, scope, and status, not the secret value.'
    });
  }

  addCheck({
    id: 'live_execution_disabled',
    label: 'Live execution disabled',
    passed: true,
    metric: 'disabled',
    threshold: 'disabled',
    note: 'Connector readiness cannot enable live execution.'
  });
  addCheck({
    id: 'live_order_adapter_implemented',
    label: 'Live order adapter implemented',
    passed: false,
    metric: 'not implemented',
    threshold: 'separate reviewed adapter with tests',
    note: 'No route in this build can place a real exchange order.'
  });

  const blockingFailures = checks.filter(check => !check.passed && check.severity === 'block');
  const reviewFailures = checks.filter(check => !check.passed && check.severity !== 'block');

  return {
    status: blockingFailures.length ? 'blocked' : reviewFailures.length ? 'review_required' : 'metadata_ready',
    stage: 'exchange_connector_readiness_preflight',
    connector: connector
      ? {
        id: connector.id,
        label: connector.label,
        exchangeName: connector.exchange_name,
        mode: connector.mode,
        status: connector.status,
        secretReferenceId: connector.secret_reference_id || null
      }
      : null,
    secretReference: secretReference
      ? {
        id: secretReference.id,
        label: secretReference.label,
        providerType: secretReference.provider_type,
        referenceName: secretReference.reference_name,
        scope: secretReference.scope,
        status: secretReference.status
      }
      : null,
    checks,
    failures: checks.filter(check => !check.passed).map(check => check.id),
    blockingFailures: blockingFailures.map(check => check.id),
    reviewFailures: reviewFailures.map(check => check.id),
    secretHandling: {
      secretsStoredInDatabase: false,
      secretReferenceRequired: Boolean(secretReferenceRequired),
      requiredBeforeLive: [
        'configured local secret reference',
        'adapter-specific credential validation',
        'owner-approved exchange key scope with withdrawals disabled'
      ]
    },
    adapterContract: {
      implemented: false,
      requiredMethods: [
        'validateCredentials',
        'getBalances',
        'getOpenPositions',
        'placeOrder',
        'cancelOrder',
        'emergencyStop'
      ]
    },
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      note: 'Live order execution remains disabled. This readiness check stores audit metadata only.'
    },
    generatedAt: new Date().toISOString()
  };
}

const EXCHANGE_ADAPTER_CONTRACT_METHODS = [
  'validateCredentials',
  'getBalances',
  'getOpenPositions',
  'placeOrder',
  'cancelOrder',
  'emergencyStop'
];
const EXCHANGE_ADAPTER_CONTRACT_EXCHANGES = new Set(['binance', 'coinbase', 'kraken', 'bybit', 'okx', 'hyperliquid', 'custom']);
const EXCHANGE_ADAPTER_CONTRACT_BASE_REQUIREMENTS = {
  marketTypes: ['spot'],
  requiredRuntimeSettings: [
    'sandboxMode',
    'marketType',
    'symbolMapping',
    'rateLimitProfile',
    'precisionMode'
  ],
  credentialPermissionRequirements: [
    'read permission verified',
    'trade permission explicitly reviewed before future live mode',
    'withdraw permission disabled',
    'credential age and rotation note recorded'
  ],
  marketMetadataRequirements: [
    'symbol exists',
    'base and quote assets resolved',
    'price precision resolved',
    'quantity precision resolved',
    'minimum order size resolved',
    'minimum notional resolved'
  ],
  orderGuardRequirements: [
    'post-only support declared when available',
    'reduce-only support declared when available',
    'client order id support declared',
    'idempotency key strategy declared',
    'pre-submit risk profile check required',
    'post-submit audit event required'
  ],
  emergencyStopRequirements: [
    'cancel open orders by symbol',
    'cancel all open orders where supported',
    'block new orders while kill switch is active',
    'persist emergency-stop result'
  ],
  testFixtureRequirements: [
    'credential validation fixture',
    'balance parsing fixture',
    'market metadata precision fixture',
    'order payload dry-run fixture',
    'cancel-order dry-run fixture',
    'emergency-stop dry-run fixture'
  ]
};
const EXCHANGE_ADAPTER_CONTRACT_REQUIREMENTS = {
  binance: {
    marketTypes: ['spot', 'usdm_futures'],
    requiredRuntimeSettings: ['recvWindow', 'timeSyncToleranceMs'],
    marketMetadataRequirements: ['PRICE_FILTER parsed', 'LOT_SIZE parsed', 'MIN_NOTIONAL or NOTIONAL parsed'],
    orderGuardRequirements: ['time-in-force mapping verified', 'self-trade-prevention mode reviewed']
  },
  bybit: {
    marketTypes: ['spot', 'linear_perpetual'],
    requiredRuntimeSettings: ['category', 'positionMode'],
    marketMetadataRequirements: ['instrument lot size parsed', 'price filter parsed', 'leverage filter parsed'],
    orderGuardRequirements: ['reduceOnly mapping verified', 'positionIdx or one-way mode handling reviewed']
  },
  coinbase: {
    marketTypes: ['spot'],
    requiredRuntimeSettings: ['portfolioId', 'productType'],
    marketMetadataRequirements: ['base increment parsed', 'quote increment parsed', 'product min size parsed'],
    orderGuardRequirements: ['preview-before-submit support reviewed', 'client order id mapping verified']
  },
  hyperliquid: {
    marketTypes: ['perpetual'],
    requiredRuntimeSettings: ['vaultAddress', 'subaccountLabel'],
    marketMetadataRequirements: ['asset universe parsed', 'szDecimals parsed', 'tick size parsed'],
    orderGuardRequirements: ['reduceOnly mapping verified', 'vault/subaccount routing reviewed']
  },
  kraken: {
    marketTypes: ['spot'],
    requiredRuntimeSettings: ['assetPairMapping'],
    marketMetadataRequirements: ['pair decimals parsed', 'lot decimals parsed', 'order minimum parsed'],
    orderGuardRequirements: ['userref/client id mapping verified', 'fee currency handling reviewed']
  },
  okx: {
    marketTypes: ['spot', 'swap'],
    requiredRuntimeSettings: ['tdMode', 'positionSideMode', 'accountMode'],
    marketMetadataRequirements: ['instrument ctVal parsed', 'lotSz parsed', 'tickSz parsed', 'minSz parsed'],
    orderGuardRequirements: ['tdMode mapping verified', 'posSide mapping reviewed']
  },
  custom: {
    marketTypes: ['spot', 'derivatives'],
    requiredRuntimeSettings: ['adapterModulePath', 'capabilityManifestPath'],
    marketMetadataRequirements: ['custom capability manifest declares precision and limits'],
    orderGuardRequirements: ['custom adapter dry-run payload schema reviewed']
  }
};

function getExchangeAdapterRequirements(exchangeName = 'custom') {
  const normalizedExchange = EXCHANGE_ADAPTER_CONTRACT_EXCHANGES.has(exchangeName) ? exchangeName : 'custom';
  const overrides = EXCHANGE_ADAPTER_CONTRACT_REQUIREMENTS[normalizedExchange] || {};
  const mergeList = (key) => Array.from(new Set([
    ...(EXCHANGE_ADAPTER_CONTRACT_BASE_REQUIREMENTS[key] || []),
    ...(overrides[key] || [])
  ]));

  return {
    marketTypes: mergeList('marketTypes'),
    requiredRuntimeSettings: mergeList('requiredRuntimeSettings'),
    credentialPermissionRequirements: mergeList('credentialPermissionRequirements'),
    marketMetadataRequirements: mergeList('marketMetadataRequirements'),
    orderGuardRequirements: mergeList('orderGuardRequirements'),
    emergencyStopRequirements: mergeList('emergencyStopRequirements'),
    testFixtureRequirements: mergeList('testFixtureRequirements')
  };
}

function createExchangeAdapterContractSpec(exchangeName = 'custom') {
  const normalizedExchange = String(exchangeName || 'custom').trim().toLowerCase();
  const resolvedExchange = EXCHANGE_ADAPTER_CONTRACT_EXCHANGES.has(normalizedExchange) ? normalizedExchange : 'custom';
  const exchangeRequirements = getExchangeAdapterRequirements(resolvedExchange);

  return {
    exchangeName: resolvedExchange,
    implemented: false,
    credentialLoadingImplemented: false,
    liveOrderPlacementImplemented: false,
    requiredMethods: EXCHANGE_ADAPTER_CONTRACT_METHODS.map(method => ({
      name: method,
      implemented: false,
      requiredBeforeLive: true
    })),
    exchangeRequirements,
    requiredRuntimeSettings: exchangeRequirements.requiredRuntimeSettings.map(setting => ({
      name: setting,
      provided: false,
      requiredBeforeLive: true
    })),
    requiredTestFixtures: exchangeRequirements.testFixtureRequirements.map(fixture => ({
      name: fixture,
      implemented: false,
      requiredBeforeLive: true
    })),
    safetyRequirements: [
      'read secrets only from approved local secret provider at runtime',
      'verify exchange key is withdrawal-disabled before any future live mode',
      'respect risk profile limits before drafting any order',
      'support emergency stop before and after order submission',
      'persist every credential validation and order-intent decision',
      'ship with authenticated verifier coverage before any future live-enable review'
    ],
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      note: 'Adapter contract stubs define required shape only. No credential loading or order placement exists.'
    }
  };
}

function evaluateExchangeAdapterContract({ connector }) {
  const spec = createExchangeAdapterContractSpec(connector?.exchange_name || 'custom');
  const checks = [];
  const addCheck = (check) => {
    checks.push({
      severity: 'block',
      metric: null,
      threshold: null,
      note: '',
      ...check,
      passed: Boolean(check.passed)
    });
  };

  addCheck({
    id: 'connector_exists',
    label: 'Connector exists',
    passed: Boolean(connector),
    metric: connector ? `#${connector.id}` : null,
    threshold: 'required'
  });

  if (connector) {
    addCheck({
      id: 'exchange_contract_known',
      label: 'Exchange contract shape known',
      passed: EXCHANGE_ADAPTER_CONTRACT_EXCHANGES.has(connector.exchange_name),
      metric: connector.exchange_name,
      threshold: Array.from(EXCHANGE_ADAPTER_CONTRACT_EXCHANGES).join(', ')
    });
    addCheck({
      id: 'connector_not_archived',
      label: 'Connector not archived',
      passed: connector.status !== 'archived',
      metric: connector.status,
      threshold: 'planned, configured, or disabled'
    });
  }

  addCheck({
    id: 'credential_loader_implemented',
    label: 'Credential loader implemented',
    passed: false,
    metric: 'not implemented',
    threshold: 'separate reviewed local secret loader'
  });
  addCheck({
    id: 'adapter_methods_implemented',
    label: 'Adapter methods implemented',
    passed: false,
    metric: EXCHANGE_ADAPTER_CONTRACT_METHODS.map(method => `${method}: false`),
    threshold: 'all required methods implemented and tested'
  });
  addCheck({
    id: 'exchange_specific_requirements_implemented',
    label: 'Exchange-specific adapter requirements implemented',
    passed: false,
    metric: {
      exchangeName: spec.exchangeName,
      marketTypes: spec.exchangeRequirements.marketTypes,
      runtimeSettingsRequired: spec.requiredRuntimeSettings.map(setting => setting.name),
      testFixturesRequired: spec.requiredTestFixtures.map(fixture => fixture.name)
    },
    threshold: 'exchange-specific settings, permissions, metadata, guards, emergency stop, and fixtures implemented'
  });
  addCheck({
    id: 'live_order_endpoint_enabled',
    label: 'Live order endpoint enabled',
    passed: false,
    metric: 'disabled',
    threshold: 'future owner-approved enable flow only'
  });

  const blockingFailures = checks.filter(check => !check.passed && check.severity === 'block');

  return {
    status: 'blocked',
    stage: 'exchange_adapter_contract_shape_check',
    connector: connector
      ? {
        id: connector.id,
        label: connector.label,
        exchangeName: connector.exchange_name,
        mode: connector.mode,
        status: connector.status
      }
      : null,
    spec,
    checks,
    failures: checks.filter(check => !check.passed).map(check => check.id),
    blockingFailures: blockingFailures.map(check => check.id),
    reviewFailures: [],
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      note: 'Adapter contract check cannot load credentials or place orders.'
    },
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  EXCHANGE_ADAPTER_CONTRACT_METHODS,
  EXCHANGE_ADAPTER_CONTRACT_EXCHANGES,
  EXCHANGE_ADAPTER_CONTRACT_BASE_REQUIREMENTS,
  EXCHANGE_ADAPTER_CONTRACT_REQUIREMENTS,
  parseExchangeConnector,
  parseLocalSecretReference,
  parseExchangeConnectorReadinessEvent,
  parseExchangeAdapterContractEvent,
  evaluateExchangeConnectorReadiness,
  getExchangeAdapterRequirements,
  createExchangeAdapterContractSpec,
  evaluateExchangeAdapterContract
};
