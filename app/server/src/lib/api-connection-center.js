const API_PROVIDER_CATEGORIES = Object.freeze({
  CENTRALIZED_EXCHANGE: 'centralized exchange',
  WALLET: 'wallet',
  DEX_READ_ONLY: 'DEX read-only',
  DEX_EXECUTION_LOCKED: 'DEX execution locked',
  LISTING_METADATA: 'listing/metadata'
});

const API_PROVIDER_STATUSES = Object.freeze({
  NOT_CONNECTED: 'not connected',
  DRAFT: 'draft',
  NEEDS_KEY: 'needs key',
  TESTING: 'testing',
  CONNECTED: 'connected',
  BLOCKED: 'blocked',
  LOCKED: 'locked'
});

const API_SAFETY_LEVELS = Object.freeze({
  READ_ONLY: 'read-only',
  DRY_RUN: 'dry-run',
  LIVE_LOCKED: 'live locked',
  EXTERNAL_ACTION_LOCKED: 'external action locked'
});

const DEX_READONLY_PROVIDER_REGISTRY = Object.freeze([
  {
    id: 'dexscreener-style',
    providerName: 'DexScreener-style token and pair lookup',
    category: API_PROVIDER_CATEGORIES.DEX_READ_ONLY,
    currentStatus: API_PROVIDER_STATUSES.DRAFT,
    safetyLevel: API_SAFETY_LEVELS.READ_ONLY,
    accountRequired: false,
    supportedData: ['token profiles', 'pair pages', 'price snapshots', 'liquidity notes'],
    executionLocked: true,
    nextRecommendedAction: 'Use for token and pair research after the read-only lane is wired.'
  },
  {
    id: 'geckoterminal-style',
    providerName: 'CoinGecko / GeckoTerminal-style market metadata',
    category: API_PROVIDER_CATEGORIES.DEX_READ_ONLY,
    currentStatus: API_PROVIDER_STATUSES.DRAFT,
    safetyLevel: API_SAFETY_LEVELS.READ_ONLY,
    accountRequired: false,
    supportedData: ['token metadata', 'market data', 'pool data', 'historical planning'],
    executionLocked: true,
    nextRecommendedAction: 'Use for chain-neutral token research and website/listing preparation.'
  },
  {
    id: 'uniswap-style-evm',
    providerName: 'Uniswap-style EVM DEX planning',
    category: API_PROVIDER_CATEGORIES.DEX_READ_ONLY,
    currentStatus: API_PROVIDER_STATUSES.DRAFT,
    safetyLevel: API_SAFETY_LEVELS.READ_ONLY,
    accountRequired: false,
    supportedChains: ['Ethereum', 'Base', 'Polygon', 'Arbitrum', 'Optimism'],
    supportedData: ['pool info', 'quote planning', 'liquidity depth', 'route research'],
    executionLocked: true,
    nextRecommendedAction: 'Use quotes and pools only. Swaps, approvals, and signatures stay locked.'
  },
  {
    id: 'pancakeswap-style-bnb',
    providerName: 'PancakeSwap-style BNB DEX planning',
    category: API_PROVIDER_CATEGORIES.DEX_READ_ONLY,
    currentStatus: API_PROVIDER_STATUSES.DRAFT,
    safetyLevel: API_SAFETY_LEVELS.READ_ONLY,
    accountRequired: false,
    supportedChains: ['BNB Chain'],
    supportedData: ['pool info', 'quote planning', 'liquidity depth', 'route research'],
    executionLocked: true,
    nextRecommendedAction: 'Use for BNB Chain research. Wallet signing and swaps stay locked.'
  },
  {
    id: 'solana-aggregator-style',
    providerName: 'Solana DEX aggregator planning',
    category: API_PROVIDER_CATEGORIES.DEX_READ_ONLY,
    currentStatus: API_PROVIDER_STATUSES.DRAFT,
    safetyLevel: API_SAFETY_LEVELS.READ_ONLY,
    accountRequired: false,
    supportedChains: ['Solana'],
    supportedData: ['quote planning', 'token mint metadata', 'route research', 'liquidity notes'],
    executionLocked: true,
    nextRecommendedAction: 'Use for quote research only. No Solana transaction construction or signing.'
  }
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
    category: String(input.category || API_PROVIDER_CATEGORIES.CENTRALIZED_EXCHANGE),
    currentStatus: normalizeStatus(input.currentStatus),
    safetyLevel: normalizeSafetyLevel(input.safetyLevel),
    lastCheckResult: String(input.lastCheckResult || 'Not checked yet.'),
    lastCheckedAt: input.lastCheckedAt || null,
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
    blockers: [],
    lastCheckResult: 'Registry ready. No account key, wallet signing, approval, or swap is required.',
    advancedDiagnosticsLink: '/strategy-lab#read-only-price-compare'
  }));
  const blockingProviders = providers.filter(provider => provider.blockers.length && provider.currentStatus === API_PROVIDER_STATUSES.BLOCKED);
  const nextProvider = providers.find(provider => provider.blockers.length)
    || providers.find(provider => provider.currentStatus !== API_PROVIDER_STATUSES.CONNECTED)
    || dexProviders[0];

  return {
    generatedAt,
    providers,
    dexReadOnlyProviders: dexProviders,
    summary: {
      krakenStatus: providers[0].currentStatus,
      coinbaseStatus: providers[1].currentStatus,
      dexReadOnlyStatus: dexProviders.length ? 'draft' : 'not connected',
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
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      swapsEnabled: false,
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
  DEX_READONLY_PROVIDER_REGISTRY,
  buildApiProviderStatus,
  buildApiConnectionCenterStatus
};
