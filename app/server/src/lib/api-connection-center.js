const API_PROVIDER_CATEGORIES = Object.freeze({
  CENTRALIZED_EXCHANGE: 'centralized exchange',
  WALLET: 'wallet',
  DEX_READ_ONLY: 'DEX read-only',
  DEX_MARKET_DATA: 'DEX market data',
  DEX_QUOTE_AGGREGATOR: 'DEX quote aggregator',
  DEX_EXECUTION_LOCKED: 'DEX execution locked',
  LISTING_METADATA: 'listing/metadata'
});

const API_PROVIDER_STATUSES = Object.freeze({
  NOT_CONNECTED: 'not connected',
  PLANNED: 'planned',
  DRAFT: 'draft',
  NEEDS_KEY: 'needs key',
  READY_FOR_SAFE_TEST: 'ready for safe test',
  TESTING: 'testing',
  CONNECTED: 'connected',
  DEGRADED: 'degraded',
  BLOCKED: 'blocked',
  LOCKED: 'locked',
  LOCKED_EXTERNAL_ACTION: 'locked external action'
});

const API_SAFETY_LEVELS = Object.freeze({
  PUBLIC_READ_ONLY: 'public read-only',
  ACCOUNT_READ_ONLY: 'account read-only',
  QUOTE_ONLY: 'quote-only',
  READ_ONLY: 'read-only',
  DRY_RUN: 'dry-run',
  DRY_RUN_ONLY: 'dry-run only',
  LIVE_LOCKED: 'live locked',
  WALLET_SIGNING_LOCKED: 'wallet signing locked',
  EXTERNAL_ACTION_LOCKED: 'external action locked'
});

const API_CREDENTIAL_MODES = Object.freeze({
  NONE_NEEDED: 'none needed',
  ENV_REFERENCE: 'environment variable reference',
  ENCRYPTED_LOCAL_VAULT: 'encrypted local vault reference',
  LOCAL_DATASET: 'local dataset',
  NOT_CONFIGURED: 'not configured'
});

const DEX_MARKET_DATA_PROVIDER_REGISTRY = Object.freeze([
  {
    id: 'dexscreener',
    providerName: 'DexScreener token and pair lookup',
    providerType: API_PROVIDER_CATEGORIES.DEX_MARKET_DATA,
    category: API_PROVIDER_CATEGORIES.DEX_MARKET_DATA,
    currentStatus: API_PROVIDER_STATUSES.READY_FOR_SAFE_TEST,
    safetyLevel: API_SAFETY_LEVELS.PUBLIC_READ_ONLY,
    credentialMode: API_CREDENTIAL_MODES.NONE_NEEDED,
    rateLimitNotes: 'Public read-only API. EtherealAI treats failures as degraded, not setup failures.',
    accountRequired: false,
    supportedData: ['token profiles', 'pair pages', 'price snapshots', 'liquidity notes'],
    executionLocked: true,
    simpleTestActions: ['search', 'pair lookup'],
    nextRecommendedAction: 'Run a safe DexScreener search or pair lookup. No wallet or account is required.'
  },
  {
    id: 'geckoterminal',
    providerName: 'GeckoTerminal onchain pool data',
    providerType: API_PROVIDER_CATEGORIES.DEX_MARKET_DATA,
    category: API_PROVIDER_CATEGORIES.DEX_MARKET_DATA,
    currentStatus: API_PROVIDER_STATUSES.READY_FOR_SAFE_TEST,
    safetyLevel: API_SAFETY_LEVELS.PUBLIC_READ_ONLY,
    credentialMode: API_CREDENTIAL_MODES.NONE_NEEDED,
    rateLimitNotes: 'Public/free API tier can rate-limit. Failures become degraded status.',
    accountRequired: false,
    supportedData: ['token metadata', 'market data', 'pool data', 'historical planning'],
    executionLocked: true,
    simpleTestActions: ['network list', 'pool lookup'],
    nextRecommendedAction: 'Run a safe GeckoTerminal networks/pools test for DEX visibility.'
  },
  {
    id: 'coingecko-market-metadata',
    providerName: 'CoinGecko market metadata',
    providerType: API_PROVIDER_CATEGORIES.LISTING_METADATA,
    category: API_PROVIDER_CATEGORIES.LISTING_METADATA,
    currentStatus: API_PROVIDER_STATUSES.PLANNED,
    safetyLevel: API_SAFETY_LEVELS.PUBLIC_READ_ONLY,
    credentialMode: API_CREDENTIAL_MODES.ENV_REFERENCE,
    rateLimitNotes: 'Use official API or approved local dataset only. No scraping.',
    accountRequired: false,
    supportedData: ['market metadata', 'token reference data', 'top-token dataset planning'],
    executionLocked: true,
    nextRecommendedAction: 'Add an approved CoinGecko/CoinMarketCap API key reference or local dataset later.'
  },
  {
    id: 'uniswap-style-evm',
    providerName: 'Uniswap-style EVM DEX planning',
    providerType: API_PROVIDER_CATEGORIES.DEX_MARKET_DATA,
    category: API_PROVIDER_CATEGORIES.DEX_READ_ONLY,
    currentStatus: API_PROVIDER_STATUSES.PLANNED,
    safetyLevel: API_SAFETY_LEVELS.PUBLIC_READ_ONLY,
    credentialMode: API_CREDENTIAL_MODES.ENV_REFERENCE,
    rateLimitNotes: 'Needs a selected RPC/indexer/data source before real pool lookup.',
    accountRequired: false,
    supportedChains: ['Ethereum', 'Base', 'Polygon', 'Arbitrum', 'Optimism'],
    supportedData: ['pool info', 'quote planning', 'liquidity depth', 'route research'],
    executionLocked: true,
    nextRecommendedAction: 'Configure a read-only provider later. Swaps, approvals, and signatures stay locked.'
  },
  {
    id: 'pancakeswap-style-bnb',
    providerName: 'PancakeSwap-style BNB DEX planning',
    providerType: API_PROVIDER_CATEGORIES.DEX_MARKET_DATA,
    category: API_PROVIDER_CATEGORIES.DEX_READ_ONLY,
    currentStatus: API_PROVIDER_STATUSES.PLANNED,
    safetyLevel: API_SAFETY_LEVELS.PUBLIC_READ_ONLY,
    credentialMode: API_CREDENTIAL_MODES.ENV_REFERENCE,
    rateLimitNotes: 'Needs a BNB Chain read-only RPC/indexer source before real pool lookup.',
    accountRequired: false,
    supportedChains: ['BNB Chain'],
    supportedData: ['pool info', 'quote planning', 'liquidity depth', 'route research'],
    executionLocked: true,
    nextRecommendedAction: 'Use for BNB Chain research after a read-only data source is configured.'
  }
]);

const DEX_QUOTE_PROVIDER_REGISTRY = Object.freeze([
  {
    id: 'zero-x',
    providerName: '0x quote preview',
    providerType: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    category: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    currentStatus: API_PROVIDER_STATUSES.NEEDS_KEY,
    safetyLevel: API_SAFETY_LEVELS.QUOTE_ONLY,
    credentialMode: API_CREDENTIAL_MODES.ENV_REFERENCE,
    rateLimitNotes: '0x API access may require an API key. Store only a local key reference.',
    supportedChains: ['Ethereum', 'Base', 'Polygon', 'Arbitrum', 'Optimism', 'BNB Chain'],
    supportedData: ['price preview', 'route preview', 'estimated buy/sell amount'],
    executionLocked: true,
    nextRecommendedAction: 'Add a safe 0x API key reference later. Simple Mode shows quote preview only.'
  },
  {
    id: 'one-inch',
    providerName: '1inch quote preview',
    providerType: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    category: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    currentStatus: API_PROVIDER_STATUSES.NEEDS_KEY,
    safetyLevel: API_SAFETY_LEVELS.QUOTE_ONLY,
    credentialMode: API_CREDENTIAL_MODES.ENV_REFERENCE,
    rateLimitNotes: '1inch developer portal access is required for most quote API use.',
    supportedChains: ['Ethereum', 'Base', 'Polygon', 'Arbitrum', 'Optimism', 'BNB Chain', 'Avalanche'],
    supportedData: ['quote preview', 'route preview'],
    executionLocked: true,
    nextRecommendedAction: 'Add a safe 1inch API key reference later. No swap endpoint is enabled.'
  },
  {
    id: 'lifi',
    providerName: 'LI.FI cross-chain route preview',
    providerType: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    category: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    currentStatus: API_PROVIDER_STATUSES.READY_FOR_SAFE_TEST,
    safetyLevel: API_SAFETY_LEVELS.QUOTE_ONLY,
    credentialMode: API_CREDENTIAL_MODES.NONE_NEEDED,
    rateLimitNotes: 'Public route preview. Transaction execution and wallet signing remain hidden and locked.',
    supportedChains: ['EVM', 'Solana planning', 'cross-chain route visibility'],
    supportedData: ['route preview', 'bridge cost estimate', 'source/destination route visibility'],
    executionLocked: true,
    simpleTestActions: ['route preview'],
    nextRecommendedAction: 'Preview a route only. Do not execute, sign, or approve anything.'
  },
  {
    id: 'rango',
    providerName: 'Rango cross-chain quote preview',
    providerType: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    category: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    currentStatus: API_PROVIDER_STATUSES.NEEDS_KEY,
    safetyLevel: API_SAFETY_LEVELS.QUOTE_ONLY,
    credentialMode: API_CREDENTIAL_MODES.ENV_REFERENCE,
    rateLimitNotes: 'Rango API access may require a key. Use local secret references only.',
    supportedChains: ['EVM', 'Solana', 'Cosmos', 'cross-chain route visibility'],
    supportedData: ['route preview', 'source/destination route visibility'],
    executionLocked: true,
    nextRecommendedAction: 'Add a Rango API key reference later. Quote-only only.'
  },
  {
    id: 'jupiter',
    providerName: 'Jupiter Solana quote preview',
    providerType: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    category: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    currentStatus: API_PROVIDER_STATUSES.READY_FOR_SAFE_TEST,
    safetyLevel: API_SAFETY_LEVELS.QUOTE_ONLY,
    credentialMode: API_CREDENTIAL_MODES.NONE_NEEDED,
    rateLimitNotes: 'Public quote endpoint. EtherealAI does not request or submit swap transactions.',
    supportedChains: ['Solana'],
    supportedData: ['SOL/SPL route quote', 'estimated input/output amount', 'slippage bps'],
    executionLocked: true,
    simpleTestActions: ['quote preview'],
    nextRecommendedAction: 'Preview a Solana quote only. No transaction construction or signing.'
  },
  {
    id: 'paraswap',
    providerName: 'ParaSwap quote preview',
    providerType: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    category: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    currentStatus: API_PROVIDER_STATUSES.PLANNED,
    safetyLevel: API_SAFETY_LEVELS.QUOTE_ONLY,
    credentialMode: API_CREDENTIAL_MODES.NOT_CONFIGURED,
    rateLimitNotes: 'Adapter planned. Add only after route-preview safety checks are stable.',
    supportedChains: ['Ethereum', 'Polygon', 'BNB Chain', 'Avalanche', 'Arbitrum'],
    supportedData: ['quote preview planning'],
    executionLocked: true,
    nextRecommendedAction: 'Planned after 0x, 1inch, LI.FI, Rango, and Jupiter read-only lanes.'
  },
  {
    id: 'solana-aggregator-style',
    providerName: 'Solana DEX aggregator planning',
    providerType: API_PROVIDER_CATEGORIES.DEX_QUOTE_AGGREGATOR,
    category: API_PROVIDER_CATEGORIES.DEX_READ_ONLY,
    currentStatus: API_PROVIDER_STATUSES.PLANNED,
    safetyLevel: API_SAFETY_LEVELS.QUOTE_ONLY,
    credentialMode: API_CREDENTIAL_MODES.NOT_CONFIGURED,
    rateLimitNotes: 'Use Jupiter first. Other Solana aggregators remain planned.',
    accountRequired: false,
    supportedChains: ['Solana'],
    supportedData: ['quote planning', 'token mint metadata', 'route research', 'liquidity notes'],
    executionLocked: true,
    nextRecommendedAction: 'Use Jupiter quote preview first. No Solana transaction construction or signing.'
  }
]);

const DEX_EXECUTION_LOCKED_REGISTRY = Object.freeze([
  {
    id: 'dex-swaps-wallet-signing',
    providerName: 'DEX swaps, token approvals, and wallet signing',
    providerType: API_PROVIDER_CATEGORIES.DEX_EXECUTION_LOCKED,
    category: API_PROVIDER_CATEGORIES.DEX_EXECUTION_LOCKED,
    currentStatus: API_PROVIDER_STATUSES.LOCKED_EXTERNAL_ACTION,
    safetyLevel: API_SAFETY_LEVELS.WALLET_SIGNING_LOCKED,
    credentialMode: API_CREDENTIAL_MODES.NOT_CONFIGURED,
    rateLimitNotes: 'Execution is intentionally unavailable in this phase.',
    supportedChains: ['Ethereum', 'Base', 'Polygon', 'BNB Chain', 'Avalanche', 'Arbitrum', 'Optimism', 'Solana'],
    supportedData: ['future owner-approved wallet-signing boundary'],
    executionLocked: true,
    blockers: [
      {
        title: 'Wallet signing is locked',
        detail: 'No DEX swap, approval, permit signature, transaction build, or broadcast is enabled until a separate owner-approved wallet-signing phase.'
      }
    ],
    nextRecommendedAction: 'Stay in read-only and quote-preview mode.'
  }
]);

const DEX_READONLY_PROVIDER_REGISTRY = Object.freeze([
  ...DEX_MARKET_DATA_PROVIDER_REGISTRY,
  ...DEX_QUOTE_PROVIDER_REGISTRY
]);

function normalizeStatus(status) {
  const text = String(status || '').trim().toLowerCase();
  const allowed = new Set(Object.values(API_PROVIDER_STATUSES));

  return allowed.has(text) ? text : API_PROVIDER_STATUSES.NOT_CONNECTED;
}

function normalizeSafetyLevel(level) {
  const text = String(level || '').trim().toLowerCase();
  const allowed = new Set(Object.values(API_SAFETY_LEVELS));

  return allowed.has(text) ? text : API_SAFETY_LEVELS.READ_ONLY;
}

function buildApiProviderStatus(input = {}) {
  const blockers = Array.isArray(input.blockers)
    ? input.blockers.filter(Boolean).map(blocker => ({
        title: String(blocker.title || blocker.label || 'Needs review'),
        detail: String(blocker.detail || blocker.nextClick || blocker.fix || '')
      }))
    : [];

  return {
    providerName: String(input.providerName || 'Unknown provider'),
    providerId: String(input.providerId || input.providerName || 'unknown').toLowerCase().replace(/\s+/g, '-'),
    providerType: String(input.providerType || input.category || API_PROVIDER_CATEGORIES.CENTRALIZED_EXCHANGE),
    category: String(input.category || API_PROVIDER_CATEGORIES.CENTRALIZED_EXCHANGE),
    currentStatus: normalizeStatus(input.currentStatus),
    safetyLevel: normalizeSafetyLevel(input.safetyLevel),
    credentialMode: String(input.credentialMode || API_CREDENTIAL_MODES.NOT_CONFIGURED),
    lastCheckResult: String(input.lastCheckResult || 'Not checked yet.'),
    lastCheckedAt: input.lastCheckedAt || null,
    rateLimitNotes: String(input.rateLimitNotes || ''),
    blockers,
    nextRecommendedAction: String(input.nextRecommendedAction || (blockers.length ? 'Review the blocker list.' : 'No action required right now.')),
    advancedDiagnosticsLink: input.advancedDiagnosticsLink || null,
    advancedDiagnosticsDrawer: input.advancedDiagnosticsDrawer || null,
    metadata: input.metadata || {}
  };
}

function buildApiConnectionCenterStatus({
  kraken,
  coinbase,
  dexReadOnlyProviders = DEX_READONLY_PROVIDER_REGISTRY,
  dexMarketDataProviders = DEX_MARKET_DATA_PROVIDER_REGISTRY,
  dexQuoteProviders = DEX_QUOTE_PROVIDER_REGISTRY,
  dexExecutionLockedProviders = DEX_EXECUTION_LOCKED_REGISTRY,
  walletMetadataCount = 0,
  generatedAt = new Date().toISOString()
} = {}) {
  const providers = [
    buildApiProviderStatus(kraken || {
      providerName: 'Kraken',
      providerId: 'kraken',
      currentStatus: API_PROVIDER_STATUSES.NEEDS_KEY,
      safetyLevel: API_SAFETY_LEVELS.DRY_RUN,
      blockers: [{ title: 'Kraken status not loaded', detail: 'Refresh API Status.' }]
    }),
    buildApiProviderStatus(coinbase || {
      providerName: 'Coinbase Advanced',
      providerId: 'coinbase',
      currentStatus: API_PROVIDER_STATUSES.NEEDS_KEY,
      safetyLevel: API_SAFETY_LEVELS.READ_ONLY,
      blockers: [{ title: 'Coinbase is not connected yet', detail: 'Create a read-only Coinbase API key when you are ready.' }]
    }),
    buildApiProviderStatus({
      providerName: 'MetaMask wallet metadata',
      providerId: 'metamask-wallet-metadata',
      category: API_PROVIDER_CATEGORIES.WALLET,
      currentStatus: walletMetadataCount > 0 ? API_PROVIDER_STATUSES.CONNECTED : API_PROVIDER_STATUSES.DRAFT,
      safetyLevel: API_SAFETY_LEVELS.LIVE_LOCKED,
      lastCheckResult: walletMetadataCount > 0
        ? `${walletMetadataCount} public wallet metadata record(s) are saved.`
        : 'No public wallet metadata is saved yet.',
      blockers: [],
      nextRecommendedAction: walletMetadataCount > 0
        ? 'No wallet secret is needed for local/paper mode.'
        : 'Add public wallet metadata later from Wallet & Funding if useful.',
      advancedDiagnosticsLink: '/operator-control'
    })
  ];
  const dexProviders = dexReadOnlyProviders.map(provider => buildApiProviderStatus({
    ...provider,
    category: provider.category || API_PROVIDER_CATEGORIES.DEX_READ_ONLY,
    currentStatus: provider.currentStatus || API_PROVIDER_STATUSES.DRAFT,
    safetyLevel: provider.safetyLevel || API_SAFETY_LEVELS.READ_ONLY,
    credentialMode: provider.credentialMode || API_CREDENTIAL_MODES.NONE_NEEDED,
    blockers: provider.blockers || [],
    lastCheckResult: 'Registry ready. No account key, wallet signing, approval, or swap is required.',
    advancedDiagnosticsLink: '/strategy-lab#read-only-price-compare'
  }));
  const dexMarketData = dexMarketDataProviders.map(provider => buildApiProviderStatus({
    ...provider,
    credentialMode: provider.credentialMode || API_CREDENTIAL_MODES.NONE_NEEDED,
    blockers: provider.blockers || [],
    lastCheckResult: provider.lastCheckResult || 'Read-only market-data lane registered. No account, wallet, swap, or signature is required.',
    advancedDiagnosticsLink: '/api-connection-center#dex-market-data'
  }));
  const dexQuotePreview = dexQuoteProviders.map(provider => buildApiProviderStatus({
    ...provider,
    credentialMode: provider.credentialMode || API_CREDENTIAL_MODES.NOT_CONFIGURED,
    blockers: provider.blockers || [],
    lastCheckResult: provider.lastCheckResult || 'Quote/route preview lane registered. Execution remains locked.',
    advancedDiagnosticsLink: '/api-connection-center#dex-quote-preview'
  }));
  const dexExecutionLocked = dexExecutionLockedProviders.map(provider => buildApiProviderStatus({
    ...provider,
    blockers: provider.blockers || [],
    lastCheckResult: provider.lastCheckResult || 'Execution is locked for a later wallet-signing phase.',
    advancedDiagnosticsLink: '/api-connection-center#dex-execution-locked'
  }));
  const blockingProviders = providers.filter(provider => provider.blockers.length && provider.currentStatus === API_PROVIDER_STATUSES.BLOCKED);
  const nextProvider = providers.find(provider => provider.blockers.length)
    || providers.find(provider => provider.currentStatus !== API_PROVIDER_STATUSES.CONNECTED)
    || dexMarketData.find(provider => provider.currentStatus === API_PROVIDER_STATUSES.READY_FOR_SAFE_TEST)
    || dexQuotePreview.find(provider => provider.currentStatus === API_PROVIDER_STATUSES.READY_FOR_SAFE_TEST)
    || dexProviders[0];
  const safeMarketDataCount = dexMarketData.filter(provider => provider.currentStatus === API_PROVIDER_STATUSES.READY_FOR_SAFE_TEST || provider.currentStatus === API_PROVIDER_STATUSES.CONNECTED).length;
  const safeQuoteCount = dexQuotePreview.filter(provider => provider.currentStatus === API_PROVIDER_STATUSES.READY_FOR_SAFE_TEST || provider.currentStatus === API_PROVIDER_STATUSES.CONNECTED).length;

  return {
    generatedAt,
    providers,
    dexReadOnlyProviders: dexProviders,
    dexMarketDataProviders: dexMarketData,
    dexQuoteProviders: dexQuotePreview,
    dexExecutionLockedProviders: dexExecutionLocked,
    liveTradingReadiness: {
      status: 'live execution locked',
      simpleLabel: 'Read-only spine building',
      krakenAccountReadOnly: providers[0].currentStatus,
      coinbaseAccountReadOnly: providers[1].currentStatus,
      dexMarketData: safeMarketDataCount > 0 ? 'safe tests available' : 'planned',
      dexQuotes: safeQuoteCount > 0 ? 'safe quote previews available' : 'planned / needs keys',
      paperTrading: 'working',
      liveExecution: 'locked',
      dexExecution: 'wallet signing locked',
      nextRecommendedAction: nextProvider?.nextRecommendedAction || 'Open API Connection Center.'
    },
    summary: {
      krakenStatus: providers[0].currentStatus,
      coinbaseStatus: providers[1].currentStatus,
      dexReadOnlyStatus: dexProviders.length ? 'registered' : 'not connected',
      dexMarketDataStatus: safeMarketDataCount > 0 ? 'ready for safe test' : 'planned',
      dexQuotePreviewStatus: safeQuoteCount > 0 ? 'ready for safe test' : 'planned / needs key',
      dexExecutionStatus: 'wallet signing locked',
      walletMetadataStatus: providers[2].currentStatus,
      nextRecommendedAction: nextProvider?.nextRecommendedAction || 'No API action is required right now.',
      blockedBecause: blockingProviders.length
        ? blockingProviders.flatMap(provider => provider.blockers.map(blocker => `${provider.providerName}: ${blocker.title}`))
        : []
    },
    safetyBoundary: {
      browserLocalStorageUsed: false,
      uiStoresCredentialValues: false,
      secretValuesReturnedToUi: false,
      marketDataOnly: true,
      quotePreviewOnly: true,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      swapsEnabled: false,
      tokenApprovalsEnabled: false,
      transactionPayloadExposedInSimpleMode: false,
      orderEndpointEnabledFromApiCenter: false,
      publicPostingEnabled: false,
      deploymentEnabled: false
    }
  };
}

module.exports = {
  API_PROVIDER_CATEGORIES,
  API_PROVIDER_STATUSES,
  API_SAFETY_LEVELS,
  API_CREDENTIAL_MODES,
  DEX_MARKET_DATA_PROVIDER_REGISTRY,
  DEX_QUOTE_PROVIDER_REGISTRY,
  DEX_EXECUTION_LOCKED_REGISTRY,
  DEX_READONLY_PROVIDER_REGISTRY,
  buildApiProviderStatus,
  buildApiConnectionCenterStatus
};
