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

const EXCHANGE_CONNECTOR_CATEGORIES = [
  'Centralized Exchanges',
  'US-Compliant Exchanges',
  'Futures/Derivatives',
  'Ethereum DEXs',
  'Solana DEXs',
  'BNB Chain DEXs',
  'Arbitrum/Avalanche/Polygon DEXs',
  'Cross-chain aggregators',
  'Decentralized perpetuals',
  'Hybrid exchanges',
  'P2P exchanges'
];

const EXCHANGE_CONNECTOR_RECOMMENDED_FIRST = new Set([
  'binance',
  'coinbase',
  'kraken',
  'okx',
  'bybit',
  'uniswap',
  'jupiter',
  'one-inch',
  'hyperliquid',
  'gmx'
]);

const EXCHANGE_CONNECTOR_RECOMMENDED_FIRST_FIVE = new Set([
  'binance',
  'coinbase',
  'kraken',
  'okx',
  'bybit'
]);
const EXCHANGE_CONNECTOR_RECOMMENDED_ORDER = [
  'binance',
  'coinbase',
  'kraken',
  'okx',
  'bybit',
  'uniswap',
  'jupiter',
  'one-inch',
  'hyperliquid',
  'gmx'
];
const EXCHANGE_CONNECTOR_RECOMMENDED_RANK = new Map(
  EXCHANGE_CONNECTOR_RECOMMENDED_ORDER.map((id, index) => [id, index + 1])
);

function createConnectorRegistryEntry({
  id,
  name,
  category,
  supportedChains = [],
  apiTypes = [],
  requiredCredentials = [],
  optionalCredentials = [],
  permissionsNeeded = [],
  safetyRating = 'review-needed',
  supportsPaperMode = true,
  supportsLiveExecution = false,
  walletSigningRequired = false,
  connectorSupported = true,
  manualOnly = false,
  exchangeName = null,
  defaultMode = null,
  recommendedMode = null,
  notes = ''
}) {
  const normalizedId = String(id).trim().toLowerCase();
  const isDexLike = /dex|aggregator|perpetual|hybrid/i.test(category);
  const isP2p = category === 'P2P exchanges';
  const resolvedWalletSigningRequired = Boolean(walletSigningRequired || (isDexLike && !/centralized|futures/i.test(category)));
  const resolvedManualOnly = Boolean(manualOnly || isP2p);
  const resolvedConnectorSupported = Boolean(connectorSupported && !resolvedManualOnly);
  const resolvedDefaultMode = defaultMode || (supportsPaperMode ? 'paper' : 'read_only');
  const resolvedRecommendedMode = recommendedMode || (resolvedWalletSigningRequired ? 'quote/read-only' : 'read-only market data');

  return {
    id: normalizedId,
    exchangeName: exchangeName || normalizedId,
    name,
    category,
    supportedChains,
    apiTypes,
    status: 'not connected',
    defaultStatus: 'off',
    requiredCredentials,
    optionalCredentials,
    permissionsNeeded,
    safetyRating,
    supportsPaperMode: Boolean(supportsPaperMode),
    supportsLiveExecution: Boolean(supportsLiveExecution),
    walletSigningRequired: resolvedWalletSigningRequired,
    connectorSupported: resolvedConnectorSupported,
    manualOnly: resolvedManualOnly,
    defaultMode: resolvedDefaultMode,
    recommendedMode: resolvedRecommendedMode,
    recommendedFirst: EXCHANGE_CONNECTOR_RECOMMENDED_FIRST.has(normalizedId),
    recommendedFirstFive: EXCHANGE_CONNECTOR_RECOMMENDED_FIRST_FIVE.has(normalizedId),
    recommendationRank: EXCHANGE_CONNECTOR_RECOMMENDED_RANK.get(normalizedId) || null,
    safetyBoundary: {
      defaultOff: true,
      cexReadOnlyByDefault: category === 'Centralized Exchanges' || category === 'US-Compliant Exchanges' || category === 'Futures/Derivatives',
      withdrawalsEnabled: false,
      liveTradingEnabled: false,
      walletSigningEnabled: false,
      uiStoresCredentials: false,
      networkTestEnabled: false,
      quoteOnlyUntilOwnerApprovesSigning: resolvedWalletSigningRequired
    },
    notes
  };
}

const EXCHANGE_CONNECTOR_REGISTRY = [
  createConnectorRegistryEntry({
    id: 'binance',
    name: 'Binance',
    category: 'Centralized Exchanges',
    supportedChains: ['CEX spot', 'BNB Chain', 'Ethereum', 'Arbitrum', 'Polygon', 'Avalanche'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['market data can be public without account keys'],
    permissionsNeeded: ['read market data', 'read balances later', 'withdrawals disabled'],
    safetyRating: 'recommended-read-only'
  }),
  createConnectorRegistryEntry({
    id: 'okx',
    name: 'OKX',
    category: 'Centralized Exchanges',
    supportedChains: ['CEX spot', 'Ethereum', 'Arbitrum', 'Polygon', 'Avalanche', 'Solana'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'read balances later', 'withdrawals disabled'],
    safetyRating: 'recommended-read-only'
  }),
  createConnectorRegistryEntry({
    id: 'bybit',
    name: 'Bybit',
    category: 'Centralized Exchanges',
    supportedChains: ['CEX spot', 'Ethereum', 'Arbitrum', 'Polygon', 'Solana'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'read balances later', 'withdrawals disabled'],
    safetyRating: 'recommended-read-only'
  }),
  createConnectorRegistryEntry({
    id: 'kucoin',
    name: 'KuCoin',
    category: 'Centralized Exchanges',
    supportedChains: ['CEX spot', 'Ethereum', 'Polygon', 'BNB Chain'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'withdrawals disabled'],
    safetyRating: 'read-only-review'
  }),
  createConnectorRegistryEntry({
    id: 'gate-io',
    exchangeName: 'gate_io',
    name: 'Gate.io',
    category: 'Centralized Exchanges',
    supportedChains: ['CEX spot', 'Ethereum', 'Polygon', 'BNB Chain', 'Avalanche'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'withdrawals disabled'],
    safetyRating: 'read-only-review'
  }),
  createConnectorRegistryEntry({
    id: 'mexc',
    name: 'MEXC',
    category: 'Centralized Exchanges',
    supportedChains: ['CEX spot', 'Ethereum', 'Polygon', 'BNB Chain', 'Solana'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'withdrawals disabled'],
    safetyRating: 'read-only-review'
  }),
  createConnectorRegistryEntry({
    id: 'bitget',
    name: 'Bitget',
    category: 'Centralized Exchanges',
    supportedChains: ['CEX spot', 'Ethereum', 'Polygon', 'BNB Chain'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'withdrawals disabled'],
    safetyRating: 'read-only-review'
  }),
  createConnectorRegistryEntry({
    id: 'coinbase',
    name: 'Coinbase',
    category: 'US-Compliant Exchanges',
    supportedChains: ['CEX spot', 'Base', 'Ethereum', 'Polygon', 'Solana'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'read balances later', 'withdrawals disabled'],
    safetyRating: 'recommended-read-only'
  }),
  createConnectorRegistryEntry({
    id: 'kraken',
    name: 'Kraken',
    category: 'US-Compliant Exchanges',
    supportedChains: ['CEX spot', 'Ethereum', 'Polygon', 'Solana'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'read balances later', 'withdrawals disabled'],
    safetyRating: 'recommended-read-only'
  }),
  createConnectorRegistryEntry({
    id: 'gemini',
    name: 'Gemini',
    category: 'US-Compliant Exchanges',
    supportedChains: ['CEX spot', 'Ethereum', 'Polygon'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'withdrawals disabled'],
    safetyRating: 'read-only-review'
  }),
  createConnectorRegistryEntry({
    id: 'bitstamp',
    name: 'Bitstamp',
    category: 'US-Compliant Exchanges',
    supportedChains: ['CEX spot', 'Ethereum'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'withdrawals disabled'],
    safetyRating: 'read-only-review'
  }),
  createConnectorRegistryEntry({
    id: 'crypto-com-us',
    exchangeName: 'crypto_com_us',
    name: 'Crypto.com US',
    category: 'US-Compliant Exchanges',
    supportedChains: ['CEX spot', 'Ethereum', 'Polygon', 'Solana'],
    apiTypes: ['REST'],
    requiredCredentials: ['read-only API key reference for account data later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'withdrawals disabled'],
    safetyRating: 'read-only-review'
  }),
  createConnectorRegistryEntry({
    id: 'binance-futures',
    exchangeName: 'binance_futures',
    name: 'Binance Futures',
    category: 'Futures/Derivatives',
    supportedChains: ['CEX derivatives'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only derivatives API key reference later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'read positions later', 'withdrawals disabled', 'live trading disabled'],
    safetyRating: 'derivatives-read-only',
    supportsLiveExecution: false
  }),
  createConnectorRegistryEntry({
    id: 'okx-futures',
    exchangeName: 'okx_futures',
    name: 'OKX Futures',
    category: 'Futures/Derivatives',
    supportedChains: ['CEX derivatives'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only derivatives API key reference later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'read positions later', 'withdrawals disabled', 'live trading disabled'],
    safetyRating: 'derivatives-read-only'
  }),
  createConnectorRegistryEntry({
    id: 'bybit-derivatives',
    exchangeName: 'bybit_derivatives',
    name: 'Bybit Derivatives',
    category: 'Futures/Derivatives',
    supportedChains: ['CEX derivatives'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only derivatives API key reference later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'read positions later', 'withdrawals disabled', 'live trading disabled'],
    safetyRating: 'derivatives-read-only'
  }),
  createConnectorRegistryEntry({
    id: 'kraken-futures',
    exchangeName: 'kraken_futures',
    name: 'Kraken Futures',
    category: 'Futures/Derivatives',
    supportedChains: ['CEX derivatives'],
    apiTypes: ['REST', 'WebSocket'],
    requiredCredentials: ['read-only derivatives API key reference later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'read positions later', 'withdrawals disabled', 'live trading disabled'],
    safetyRating: 'derivatives-read-only'
  }),
  createConnectorRegistryEntry({
    id: 'uniswap',
    name: 'Uniswap',
    category: 'Ethereum DEXs',
    supportedChains: ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'BNB Chain', 'Avalanche'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'sushiswap',
    name: 'SushiSwap',
    category: 'Ethereum DEXs',
    supportedChains: ['Ethereum', 'Polygon', 'Arbitrum', 'Avalanche', 'BNB Chain'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'curve',
    name: 'Curve',
    category: 'Ethereum DEXs',
    supportedChains: ['Ethereum', 'Polygon', 'Arbitrum', 'Avalanche'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'balancer',
    name: 'Balancer',
    category: 'Ethereum DEXs',
    supportedChains: ['Ethereum', 'Polygon', 'Arbitrum', 'Base'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'jupiter',
    name: 'Jupiter',
    category: 'Solana DEXs',
    supportedChains: ['Solana'],
    apiTypes: ['REST', 'SDK', 'wallet-signing'],
    requiredCredentials: ['Solana RPC provider reference for quotes later'],
    optionalCredentials: ['public quote API'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'recommended-quote-only',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'raydium',
    name: 'Raydium',
    category: 'Solana DEXs',
    supportedChains: ['Solana'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['Solana RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'orca',
    name: 'Orca',
    category: 'Solana DEXs',
    supportedChains: ['Solana'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['Solana RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'meteora',
    name: 'Meteora',
    category: 'Solana DEXs',
    supportedChains: ['Solana'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['Solana RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'pancakeswap',
    name: 'PancakeSwap',
    category: 'BNB Chain DEXs',
    supportedChains: ['BNB Chain', 'Ethereum', 'Arbitrum', 'Base', 'Polygon'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'biswap',
    name: 'Biswap',
    category: 'BNB Chain DEXs',
    supportedChains: ['BNB Chain'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['BNB Chain RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'thena',
    name: 'Thena',
    category: 'BNB Chain DEXs',
    supportedChains: ['BNB Chain'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['BNB Chain RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'quickswap',
    name: 'QuickSwap',
    category: 'Arbitrum/Avalanche/Polygon DEXs',
    supportedChains: ['Polygon'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['Polygon RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'trader-joe',
    exchangeName: 'trader_joe',
    name: 'Trader Joe',
    category: 'Arbitrum/Avalanche/Polygon DEXs',
    supportedChains: ['Avalanche', 'Arbitrum', 'BNB Chain'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['chain RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'camelot',
    name: 'Camelot',
    category: 'Arbitrum/Avalanche/Polygon DEXs',
    supportedChains: ['Arbitrum'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['Arbitrum RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'aerodrome',
    name: 'Aerodrome',
    category: 'Arbitrum/Avalanche/Polygon DEXs',
    supportedChains: ['Base'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['Base RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'quote-only-until-signing',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'one-inch',
    exchangeName: 'one_inch',
    name: '1inch',
    category: 'Cross-chain aggregators',
    supportedChains: ['Ethereum', 'Polygon', 'BNB Chain', 'Arbitrum', 'Optimism', 'Base', 'Avalanche'],
    apiTypes: ['REST', 'aggregator', 'wallet-signing'],
    requiredCredentials: ['aggregator API reference for quotes later'],
    optionalCredentials: ['RPC provider reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'recommended-quote-only',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'li-fi',
    exchangeName: 'li_fi',
    name: 'LI.FI',
    category: 'Cross-chain aggregators',
    supportedChains: ['Ethereum', 'Polygon', 'BNB Chain', 'Arbitrum', 'Optimism', 'Base', 'Avalanche', 'Solana'],
    apiTypes: ['REST', 'aggregator', 'wallet-signing'],
    requiredCredentials: ['aggregator API reference for quotes later'],
    optionalCredentials: ['RPC provider reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'cross-chain-quote-review',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'rango',
    name: 'Rango',
    category: 'Cross-chain aggregators',
    supportedChains: ['Ethereum', 'Polygon', 'BNB Chain', 'Arbitrum', 'Avalanche', 'Solana', 'Cosmos'],
    apiTypes: ['REST', 'aggregator', 'wallet-signing'],
    requiredCredentials: ['aggregator API reference for quotes later'],
    optionalCredentials: ['RPC provider reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'cross-chain-quote-review',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'squid',
    name: 'Squid',
    category: 'Cross-chain aggregators',
    supportedChains: ['Ethereum', 'Polygon', 'BNB Chain', 'Arbitrum', 'Avalanche', 'Cosmos'],
    apiTypes: ['REST', 'aggregator', 'wallet-signing'],
    requiredCredentials: ['aggregator API reference for quotes later'],
    optionalCredentials: ['RPC provider reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'cross-chain-quote-review',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'odos',
    name: 'Odos',
    category: 'Cross-chain aggregators',
    supportedChains: ['Ethereum', 'Polygon', 'BNB Chain', 'Arbitrum', 'Base', 'Avalanche'],
    apiTypes: ['REST', 'aggregator', 'wallet-signing'],
    requiredCredentials: ['aggregator API reference for quotes later'],
    optionalCredentials: ['RPC provider reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'cross-chain-quote-review',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'hyperliquid',
    name: 'Hyperliquid',
    category: 'Decentralized perpetuals',
    supportedChains: ['Hyperliquid', 'Arbitrum bridge context'],
    apiTypes: ['REST', 'WebSocket', 'SDK', 'wallet-signing'],
    requiredCredentials: ['read-only account reference later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'read positions later', 'owner-approved signing later'],
    safetyRating: 'recommended-read-only',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'gmx',
    name: 'GMX',
    category: 'Decentralized perpetuals',
    supportedChains: ['Arbitrum', 'Avalanche'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['chain RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'recommended-quote-only',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'dydx',
    name: 'dYdX',
    category: 'Decentralized perpetuals',
    supportedChains: ['dYdX Chain', 'Ethereum bridge context'],
    apiTypes: ['REST', 'WebSocket', 'SDK', 'wallet-signing'],
    requiredCredentials: ['read-only account reference later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'owner-approved signing later'],
    safetyRating: 'perps-read-only-review',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'drift',
    name: 'Drift',
    category: 'Decentralized perpetuals',
    supportedChains: ['Solana'],
    apiTypes: ['SDK', 'RPC', 'wallet-signing'],
    requiredCredentials: ['Solana RPC provider reference for quotes later'],
    optionalCredentials: ['indexer reference'],
    permissionsNeeded: ['quote/read-only', 'owner-approved wallet signing later'],
    safetyRating: 'perps-read-only-review',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'vertex',
    name: 'Vertex',
    category: 'Hybrid exchanges',
    supportedChains: ['Arbitrum', 'Mantle', 'Blast'],
    apiTypes: ['REST', 'WebSocket', 'SDK', 'wallet-signing'],
    requiredCredentials: ['read-only account reference later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'owner-approved signing later'],
    safetyRating: 'hybrid-read-only-review',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'injective',
    name: 'Injective',
    category: 'Hybrid exchanges',
    supportedChains: ['Injective', 'Cosmos', 'Ethereum bridge context'],
    apiTypes: ['REST', 'SDK', 'wallet-signing'],
    requiredCredentials: ['read-only account reference later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'owner-approved signing later'],
    safetyRating: 'hybrid-read-only-review',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'orderly',
    name: 'Orderly Network',
    category: 'Hybrid exchanges',
    supportedChains: ['Arbitrum', 'Base', 'Optimism', 'Polygon'],
    apiTypes: ['REST', 'WebSocket', 'SDK', 'wallet-signing'],
    requiredCredentials: ['read-only account reference later'],
    optionalCredentials: ['public market data'],
    permissionsNeeded: ['read market data', 'owner-approved signing later'],
    safetyRating: 'hybrid-read-only-review',
    walletSigningRequired: true
  }),
  createConnectorRegistryEntry({
    id: 'binance-p2p',
    exchangeName: 'binance_p2p',
    name: 'Binance P2P',
    category: 'P2P exchanges',
    supportedChains: ['manual fiat/crypto settlement'],
    apiTypes: ['manual/P2P'],
    requiredCredentials: [],
    optionalCredentials: [],
    permissionsNeeded: ['manual review only'],
    safetyRating: 'manual-only',
    supportsPaperMode: false,
    connectorSupported: false,
    manualOnly: true
  }),
  createConnectorRegistryEntry({
    id: 'bisq',
    name: 'Bisq',
    category: 'P2P exchanges',
    supportedChains: ['manual Bitcoin P2P'],
    apiTypes: ['manual/P2P'],
    requiredCredentials: [],
    optionalCredentials: [],
    permissionsNeeded: ['manual review only'],
    safetyRating: 'manual-only',
    supportsPaperMode: false,
    connectorSupported: false,
    manualOnly: true
  }),
  createConnectorRegistryEntry({
    id: 'hodlhodl',
    name: 'Hodl Hodl',
    category: 'P2P exchanges',
    supportedChains: ['manual Bitcoin P2P'],
    apiTypes: ['manual/P2P'],
    requiredCredentials: [],
    optionalCredentials: [],
    permissionsNeeded: ['manual review only'],
    safetyRating: 'manual-only',
    supportsPaperMode: false,
    connectorSupported: false,
    manualOnly: true
  }),
  createConnectorRegistryEntry({
    id: 'localcoinswap',
    name: 'LocalCoinSwap',
    category: 'P2P exchanges',
    supportedChains: ['manual P2P'],
    apiTypes: ['manual/P2P'],
    requiredCredentials: [],
    optionalCredentials: [],
    permissionsNeeded: ['manual review only'],
    safetyRating: 'manual-only',
    supportsPaperMode: false,
    connectorSupported: false,
    manualOnly: true
  })
];

const EXCHANGE_CONNECTOR_REGISTRY_BY_ID = new Map(EXCHANGE_CONNECTOR_REGISTRY.map(entry => [entry.id, entry]));
const EXCHANGE_CONNECTOR_REGISTRY_BY_EXCHANGE = new Map(EXCHANGE_CONNECTOR_REGISTRY.map(entry => [entry.exchangeName, entry]));

function getExchangeConnectorRegistry({
  includeUnsupported = true,
  recommendedOnly = false,
  firstFive = false
} = {}) {
  const entries = EXCHANGE_CONNECTOR_REGISTRY.filter(entry => {
    if (!includeUnsupported && !entry.connectorSupported) {
      return false;
    }

    if (firstFive && !entry.recommendedFirstFive) {
      return false;
    }

    if (recommendedOnly && !entry.recommendedFirst) {
      return false;
    }

    return true;
  });

  if (recommendedOnly || firstFive) {
    return entries.slice().sort((a, b) => (a.recommendationRank || 999) - (b.recommendationRank || 999));
  }

  return entries;
}

function getExchangeConnectorRegistryEntry(value = '') {
  const normalized = String(value || '').trim().toLowerCase();

  return EXCHANGE_CONNECTOR_REGISTRY_BY_ID.get(normalized)
    || EXCHANGE_CONNECTOR_REGISTRY_BY_EXCHANGE.get(normalized)
    || null;
}

function getExchangeConnectorCategorySummary(entries = EXCHANGE_CONNECTOR_REGISTRY) {
  return EXCHANGE_CONNECTOR_CATEGORIES.map(category => {
    const categoryEntries = entries.filter(entry => entry.category === category);

    return {
      category,
      total: categoryEntries.length,
      supported: categoryEntries.filter(entry => entry.connectorSupported).length,
      recommended: categoryEntries.filter(entry => entry.recommendedFirst).length
    };
  });
}

function getConnectorManagerStatus(connector = null, registryEntry = null) {
  if (!connector) {
    return 'not connected';
  }

  if (connector.status === 'archived') {
    return 'archived';
  }

  if (connector.status === 'disabled' || connector.status === 'planned') {
    return 'not connected';
  }

  if (connector.mode === 'paper' && connector.status === 'configured') {
    return 'paper-ready';
  }

  if (connector.mode === 'read_only' && connector.secret_reference_status === 'configured') {
    return 'read-only';
  }

  if (connector.mode === 'live_disabled') {
    return 'live-locked';
  }

  if (registryEntry?.walletSigningRequired) {
    return 'quote/read-only planned';
  }

  return 'not connected';
}

function createExchangeConnectorPlaceholderInput(entry, {
  mode = null,
  status = 'disabled',
  labelSuffix = 'Connector Placeholder'
} = {}) {
  const resolvedMode = mode || (entry.supportsPaperMode ? 'read_only' : 'live_disabled');
  const resolvedStatus = status || 'disabled';

  return {
    exchangeName: entry.exchangeName,
    label: `${entry.name} ${labelSuffix}`.trim().slice(0, 120),
    mode: resolvedMode,
    status: resolvedStatus,
    secretReferenceId: null,
    settings: {
      registryId: entry.id,
      displayName: entry.name,
      category: entry.category,
      supportedChains: entry.supportedChains,
      apiTypes: entry.apiTypes,
      requiredCredentials: entry.requiredCredentials,
      optionalCredentials: entry.optionalCredentials,
      permissionsNeeded: entry.permissionsNeeded,
      safetyRating: entry.safetyRating,
      supportsPaperMode: entry.supportsPaperMode,
      supportsLiveExecution: false,
      walletSigningRequired: entry.walletSigningRequired,
      connectorSupported: entry.connectorSupported,
      manualOnly: entry.manualOnly,
      defaultOff: true,
      readOnlyMarketData: true,
      paperTradingOnly: resolvedMode === 'paper',
      withdrawalsEnabled: false,
      liveTradingEnabled: false,
      walletSigningEnabled: false,
      uiStoresCredentials: false,
      credentialPolicy: 'Use the secure local owner secrets file or a future encrypted vault. Do not paste keys into the UI.',
      connectionPolicy: entry.walletSigningRequired
        ? 'Quote/read-only until a future owner-approved wallet signing workflow exists.'
        : 'Read-only market data first. Live trading stays locked.'
    }
  };
}

function findExistingRegistryConnector(connectors = [], entry) {
  return connectors.find(connector => (
    connector?.settings?.registryId === entry.id
    || connector?.settings?.displayName === entry.name
  )) || null;
}

function buildExchangeConnectorManagerSummary(connectors = []) {
  const registry = getExchangeConnectorRegistry();
  const enrichedRegistry = registry.map(entry => {
    const connector = findExistingRegistryConnector(connectors, entry);
    const managerStatus = getConnectorManagerStatus(connector, entry);

    return {
      ...entry,
      existingConnectorId: connector?.id || null,
      managerStatus,
      connected: managerStatus === 'read-only' || managerStatus === 'paper-ready',
      liveTradingLocked: true
    };
  });
  const sortByRecommendationRank = entries => entries
    .slice()
    .sort((a, b) => (a.recommendationRank || 999) - (b.recommendationRank || 999));

  return {
    categories: getExchangeConnectorCategorySummary(registry),
    registry: enrichedRegistry,
    recommendedFirstFive: sortByRecommendationRank(enrichedRegistry.filter(entry => entry.recommendedFirstFive)),
    recommendedFirst: sortByRecommendationRank(enrichedRegistry.filter(entry => entry.recommendedFirst)),
    connectors: connectors.map(connector => {
      const registryEntry = getExchangeConnectorRegistryEntry(connector.settings?.registryId || connector.exchange_name);

      return {
        ...connector,
        registry: registryEntry
          ? {
            id: registryEntry.id,
            name: registryEntry.name,
            category: registryEntry.category,
            safetyRating: registryEntry.safetyRating,
            supportedChains: registryEntry.supportedChains,
            apiTypes: registryEntry.apiTypes,
            walletSigningRequired: registryEntry.walletSigningRequired
          }
          : null,
        managerStatus: getConnectorManagerStatus(connector, registryEntry),
        liveTradingLocked: true,
        withdrawalsEnabled: false,
        uiStoresCredentials: false
      };
    }),
    counts: {
      registryTotal: registry.length,
      supportedRegistryTotal: registry.filter(entry => entry.connectorSupported).length,
      unsupportedRegistryTotal: registry.filter(entry => !entry.connectorSupported).length,
      recommendedFirst: registry.filter(entry => entry.recommendedFirst).length,
      existingConnectors: connectors.length,
      activeReadOnly: connectors.filter(connector => getConnectorManagerStatus(connector) === 'read-only').length,
      paperReady: connectors.filter(connector => getConnectorManagerStatus(connector) === 'paper-ready').length,
      liveLocked: connectors.length
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
    },
    nextActions: [
      'Create connector placeholders for recommended exchanges.',
      'Use read-only market data first.',
      'Add credential references later without pasting keys into the UI.',
      'Keep live trading and wallet signing locked until a separate owner approval process exists.'
    ],
    generatedAt: new Date().toISOString()
  };
}

function evaluateExchangeConnectorReadOnlyTest({ connector, registryEntry, secretReference }) {
  const checks = [];
  const connectorSettings = connector?.settings || {};
  const sensitiveFields = connector ? findSensitiveFields(connectorSettings) : [];
  const likelySecretValues = connector ? findLikelySecretValues(connectorSettings) : [];
  const addCheck = check => {
    checks.push({
      severity: 'block',
      note: '',
      ...check,
      passed: Boolean(check.passed)
    });
  };

  addCheck({
    id: 'connector_exists',
    label: 'Connector record exists',
    passed: Boolean(connector),
    metric: connector ? `#${connector.id}` : 'missing'
  });

  if (connector) {
    addCheck({
      id: 'connector_not_archived',
      label: 'Connector is not archived',
      passed: connector.status !== 'archived',
      metric: connector.status
    });
    addCheck({
      id: 'no_inline_credential_fields',
      label: 'No credential fields are stored in the connector',
      passed: sensitiveFields.length === 0,
      metric: sensitiveFields.length ? sensitiveFields : 'none'
    });
    addCheck({
      id: 'no_inline_credential_values',
      label: 'No key-like values are stored in the connector',
      passed: likelySecretValues.length === 0,
      metric: likelySecretValues.length ? likelySecretValues : 'none'
    });
    addCheck({
      id: 'live_trading_locked',
      label: 'Live trading is locked',
      passed: true,
      metric: 'locked'
    });
    addCheck({
      id: 'withdrawals_disabled',
      label: 'Withdrawals are disabled',
      passed: true,
      metric: 'disabled'
    });
    addCheck({
      id: 'wallet_signing_disabled',
      label: 'Wallet signing is disabled',
      passed: true,
      metric: 'disabled'
    });
    addCheck({
      id: 'registry_known',
      label: 'Exchange exists in the connector registry',
      severity: 'review',
      passed: Boolean(registryEntry),
      metric: registryEntry ? registryEntry.name : connector.exchange_name
    });

    if (connector.mode === 'read_only') {
      addCheck({
        id: 'read_only_reference_ready',
        label: 'Read-only credential reference is configured',
        severity: 'review',
        passed: Boolean(secretReference && secretReference.status === 'configured'),
        metric: secretReference ? secretReference.status : 'not added yet',
        note: 'This is optional until you connect read-only APIs. The test never asks for the key value.'
      });
    }
  }

  const blockingFailures = checks.filter(check => !check.passed && check.severity === 'block');
  const reviewFailures = checks.filter(check => !check.passed && check.severity !== 'block');

  return {
    status: blockingFailures.length ? 'blocked' : reviewFailures.length ? 'not_connected' : 'read_only_local_check_passed',
    connectionStatus: blockingFailures.length
      ? 'blocked'
      : secretReference?.status === 'configured'
        ? 'read-only metadata ready; exchange network call not enabled'
        : 'not connected; add a credential reference later',
    exchange: registryEntry
      ? {
        id: registryEntry.id,
        name: registryEntry.name,
        category: registryEntry.category,
        supportedChains: registryEntry.supportedChains,
        apiTypes: registryEntry.apiTypes,
        walletSigningRequired: registryEntry.walletSigningRequired
      }
      : null,
    connector: connector
      ? {
        id: connector.id,
        label: connector.label,
        exchangeName: connector.exchange_name,
        mode: connector.mode,
        status: connector.status
      }
      : null,
    checks,
    failures: checks.filter(check => !check.passed).map(check => check.id),
    blockingFailures: blockingFailures.map(check => check.id),
    reviewFailures: reviewFailures.map(check => check.id),
    safetyBoundary: {
      networkCallMade: false,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      uiStoresCredentials: false
    },
    nextStep: reviewFailures.length
      ? 'This connector is safe as a placeholder. Add a local credential reference later if you want read-only account data.'
      : 'Read-only metadata is ready. Live trading remains locked.',
    generatedAt: new Date().toISOString()
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
  EXCHANGE_CONNECTOR_CATEGORIES,
  EXCHANGE_CONNECTOR_REGISTRY,
  EXCHANGE_CONNECTOR_RECOMMENDED_FIRST,
  EXCHANGE_CONNECTOR_RECOMMENDED_FIRST_FIVE,
  EXCHANGE_CONNECTOR_RECOMMENDED_ORDER,
  EXCHANGE_ADAPTER_CONTRACT_METHODS,
  EXCHANGE_ADAPTER_CONTRACT_EXCHANGES,
  EXCHANGE_ADAPTER_CONTRACT_BASE_REQUIREMENTS,
  EXCHANGE_ADAPTER_CONTRACT_REQUIREMENTS,
  parseExchangeConnector,
  parseLocalSecretReference,
  parseExchangeConnectorReadinessEvent,
  parseExchangeAdapterContractEvent,
  getExchangeConnectorRegistry,
  getExchangeConnectorRegistryEntry,
  getExchangeConnectorCategorySummary,
  createExchangeConnectorPlaceholderInput,
  findExistingRegistryConnector,
  buildExchangeConnectorManagerSummary,
  evaluateExchangeConnectorReadOnlyTest,
  evaluateExchangeConnectorReadiness,
  getExchangeAdapterRequirements,
  createExchangeAdapterContractSpec,
  evaluateExchangeAdapterContract
};
