const crypto = require('crypto');

const PHASE3_RECOMMENDED_EXCHANGES = ['binance', 'coinbase', 'kraken', 'okx', 'bybit'];
const UNIVERSAL_ORDER_TYPES = ['market', 'limit', 'post_only', 'ioc', 'reduce_only', 'take_profit_stop_loss', 'bracket'];
const PHASE3A_ACCOUNT_STATUSES = {
  NOT_CONNECTED: 'Not Connected',
  PUBLIC_MARKET_DATA_ONLY: 'Public Market Data Only',
  AUTHENTICATED_READ_ONLY: 'Authenticated Read-Only',
  TRADING_PERMISSION_PRESENT_BUT_LOCKED: 'Trading Permission Present But Locked',
  UNSAFE_PERMISSIONS_DETECTED: 'Unsafe Permissions Detected',
  ERROR: 'Error'
};
const DEFAULT_LIVE_SAFETY_POLICY = {
  globalKillSwitchEnabled: true,
  dryRunOnly: true,
  liveExecutionLocked: true,
  requireManualOwnerApproval: true,
  requireSandboxFirst: true,
  requireReadOnlyAccountVerified: true,
  requireWithdrawalDisabledVerification: true,
  maxOrderSizeUsd: 25,
  maxDailyLossUsd: 50,
  maxOpenPositions: 1,
  maxSlippagePercent: 0.15,
  maxLatencyMs: 1000,
  maxPriceAgeMs: 2500,
  minLiquidityUsd: 1000,
  duplicateOrderWindowMs: 30000,
  minNetSpreadPercent: 0.05
};

const EXCHANGE_CAPABILITY_MATRIX = {
  binance: {
    exchangeName: 'binance',
    displayName: 'Binance',
    spot: true,
    futures: true,
    margin: true,
    sandboxSupport: true,
    sandboxNotes: 'Spot Testnet and futures testnet exist; live execution remains locked until a separate owner-approved sandbox phase.',
    websocketSupport: true,
    publicWebSocketUrl: 'wss://stream.binance.com:9443/ws',
    sandboxRestBaseUrl: 'https://testnet.binance.vision',
    rateLimits: ['REST request weight limits by endpoint', 'websocket stream limits apply per connection'],
    withdrawalPermissionField: 'canWithdraw',
    authenticatedReadOnlyEndpoints: [
      'GET /api/v3/account',
      'GET /api/v3/account/commission'
    ],
    orderTypes: ['market', 'limit', 'post-only via timeInForce/flags', 'IOC', 'OCO/TP-SL via advanced endpoints'],
    hedgeModeSupport: 'futures only',
    subaccounts: 'institutional/VIP dependent',
    supportsMakerTakerFeeLookup: true
  },
  coinbase: {
    exchangeName: 'coinbase',
    displayName: 'Coinbase',
    spot: true,
    futures: true,
    margin: false,
    sandboxSupport: true,
    sandboxNotes: 'Advanced Trade sandbox support depends on Coinbase account/key type. Exchange HMAC keys remain read-only in EtherealAI.',
    websocketSupport: true,
    publicWebSocketUrl: 'wss://advanced-trade-ws.coinbase.com',
    userWebSocketUrl: 'wss://advanced-trade-ws-user.coinbase.com',
    rateLimits: ['Advanced Trade REST and WebSocket limits vary by endpoint and account type'],
    withdrawalPermissionField: 'not exposed by the current read-only scan',
    authenticatedReadOnlyEndpoints: [
      'GET /accounts or Advanced Trade accounts endpoint',
      'GET /fees or GET /api/v3/brokerage/transaction_summary'
    ],
    orderTypes: ['market', 'limit', 'post-only', 'IOC', 'stop-limit', 'bracket depending on product'],
    hedgeModeSupport: 'futures products only where available',
    subaccounts: 'portfolios',
    supportsMakerTakerFeeLookup: true
  },
  kraken: {
    exchangeName: 'kraken',
    displayName: 'Kraken',
    spot: true,
    futures: true,
    margin: true,
    sandboxSupport: false,
    sandboxNotes: 'Kraken spot REST does not provide a general retail sandbox equivalent in this app phase.',
    websocketSupport: true,
    publicWebSocketUrl: 'wss://ws.kraken.com',
    privateWebSocketUrl: 'wss://ws-auth.kraken.com',
    rateLimits: ['REST call counters and websocket message limits apply'],
    withdrawalPermissionField: 'API key permission info requires a separate key-info check',
    authenticatedReadOnlyEndpoints: [
      'POST /0/private/Balance',
      'POST /0/private/TradeBalance',
      'POST /0/private/TradeVolume'
    ],
    orderTypes: ['market', 'limit', 'post-only flags', 'IOC flags', 'reduce-only on derivatives', 'TP/SL through close/conditional fields'],
    hedgeModeSupport: 'futures products',
    subaccounts: 'institutional/futures dependent',
    supportsMakerTakerFeeLookup: true
  },
  okx: {
    exchangeName: 'okx',
    displayName: 'OKX',
    spot: true,
    futures: true,
    margin: true,
    sandboxSupport: true,
    sandboxNotes: 'OKX demo flag exists; live execution remains locked until a separate owner-approved sandbox phase.',
    websocketSupport: true,
    publicWebSocketUrl: 'wss://ws.okx.com:8443/ws/v5/public',
    privateWebSocketUrl: 'wss://ws.okx.com:8443/ws/v5/private',
    sandboxRestBaseUrl: 'https://www.okx.com',
    rateLimits: ['Account balance documented at 10 requests per 2 seconds', 'fee-rate and account endpoints have endpoint-specific limits'],
    withdrawalPermissionField: 'read-only API permission must be verified outside order execution',
    authenticatedReadOnlyEndpoints: [
      'GET /api/v5/account/balance',
      'GET /api/v5/account/trade-fee',
      'GET /api/v5/account/config',
      'GET /api/v5/account/positions'
    ],
    orderTypes: ['market', 'limit', 'post-only', 'IOC', 'reduce-only', 'TP/SL', 'bracket-style algos'],
    hedgeModeSupport: true,
    subaccounts: true,
    supportsMakerTakerFeeLookup: true
  },
  bybit: {
    exchangeName: 'bybit',
    displayName: 'Bybit',
    spot: true,
    futures: true,
    margin: true,
    sandboxSupport: true,
    sandboxNotes: 'Bybit testnet endpoints exist; live execution remains locked until a separate owner-approved sandbox phase.',
    websocketSupport: true,
    publicWebSocketUrl: 'wss://stream.bybit.com/v5/public/spot',
    testnetPublicWebSocketUrl: 'wss://stream-testnet.bybit.com/v5/public/spot',
    sandboxRestBaseUrl: 'https://api-testnet.bybit.com',
    rateLimits: ['wallet balance endpoint supports high read rate; fee-rate is lower and endpoint-specific'],
    withdrawalPermissionField: 'API key info endpoint can be used for permission review where available',
    authenticatedReadOnlyEndpoints: [
      'GET /v5/account/wallet-balance',
      'GET /v5/account/fee-rate',
      'GET /v5/position/list',
      'GET /v5/user/query-api'
    ],
    orderTypes: ['market', 'limit', 'post-only', 'IOC', 'reduce-only', 'TP/SL', 'bracket-style position trading stops'],
    hedgeModeSupport: true,
    subaccounts: true,
    supportsMakerTakerFeeLookup: true
  }
};

const WEBSOCKET_STREAM_SPECS = {
  binance: {
    exchangeName: 'binance',
    displayName: 'Binance',
    status: 'spec_ready_not_running',
    channels: ['bookTicker', 'depth', 'aggTrade'],
    endpoint: 'wss://stream.binance.com:9443/ws',
    sampleSubscription: 'btcusdt@bookTicker',
    marketDataOnly: true,
    orderEntryEnabled: false
  },
  coinbase: {
    exchangeName: 'coinbase',
    displayName: 'Coinbase',
    status: 'spec_ready_not_running',
    channels: ['heartbeats', 'ticker', 'level2', 'market_trades'],
    endpoint: 'wss://advanced-trade-ws.coinbase.com',
    sampleSubscription: 'level2 BTC-USD',
    marketDataOnly: true,
    orderEntryEnabled: false
  },
  kraken: {
    exchangeName: 'kraken',
    displayName: 'Kraken',
    status: 'spec_ready_not_running',
    channels: ['ticker', 'book', 'spread', 'trade'],
    endpoint: 'wss://ws.kraken.com',
    sampleSubscription: 'book XBT/USD',
    marketDataOnly: true,
    orderEntryEnabled: false
  },
  okx: {
    exchangeName: 'okx',
    displayName: 'OKX',
    status: 'spec_ready_not_running',
    channels: ['tickers', 'books', 'trades'],
    endpoint: 'wss://ws.okx.com:8443/ws/v5/public',
    sampleSubscription: 'books BTC-USDT',
    marketDataOnly: true,
    orderEntryEnabled: false
  },
  bybit: {
    exchangeName: 'bybit',
    displayName: 'Bybit',
    status: 'spec_ready_not_running',
    channels: ['orderbook.1', 'tickers', 'publicTrade'],
    endpoint: 'wss://stream.bybit.com/v5/public/spot',
    sampleSubscription: 'orderbook.1.BTCUSDT',
    marketDataOnly: true,
    orderEntryEnabled: false
  }
};

function normalizeExchangeName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/_/g, '-');
}

function normalizeSymbol(symbol = 'BTC/USDT') {
  const raw = String(symbol || 'BTC/USDT').trim().toUpperCase().replace('-', '/');
  const [base = 'BTC', quote = 'USDT'] = raw.split('/');
  const normalizedBase = base === 'XBT' ? 'BTC' : base;

  return {
    base: normalizedBase,
    quote,
    canonical: `${normalizedBase}/${quote}`,
    compact: `${normalizedBase}${quote}`,
    dash: `${normalizedBase}-${quote}`,
    kraken: `${normalizedBase === 'BTC' ? 'XBT' : normalizedBase}${quote}`
  };
}

function toFiniteNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function hmacHex(secret, payload, algorithm = 'sha256') {
  return crypto.createHmac(algorithm, secret).update(payload).digest('hex');
}

function hmacBase64(secret, payload, algorithm = 'sha256') {
  return crypto.createHmac(algorithm, secret).update(payload).digest('base64');
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'EtherealAI-Phase3-ReadOnly/1.0',
        ...(options.headers || {})
      }
    });
    const text = await response.text();
    let body = null;

    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text.slice(0, 300) };
    }

    if (!response.ok) {
      const message = body?.msg || body?.message || body?.error || body?.errors?.join?.(', ') || response.statusText;
      throw new Error(`${response.status} ${message}`);
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}

function createEndpointResult(label, status, data = null, error = null) {
  return {
    label,
    status,
    data,
    error: error ? String(error.message || error).slice(0, 500) : null
  };
}

async function safeEndpoint(label, fn) {
  try {
    return createEndpointResult(label, 'ok', await fn(), null);
  } catch (error) {
    return createEndpointResult(label, 'unavailable', null, error);
  }
}

function summarizeBalances(items = []) {
  const balances = Array.isArray(items) ? items : [];
  const nonZero = balances.filter(item => {
    const available = toFiniteNumber(item.available ?? item.free ?? item.balance ?? item.walletBalance ?? item.equity, 0);
    const total = toFiniteNumber(item.total ?? item.locked ?? item.usdValue ?? item.walletBalance ?? item.equity, 0);
    return Math.abs(available) > 0 || Math.abs(total) > 0;
  });

  return {
    assetCount: balances.length,
    nonZeroAssetCount: nonZero.length,
    visibleBalances: nonZero.slice(0, 12)
  };
}

function buildUnavailableAccountProfile(exchangeName, reason) {
  const matrix = EXCHANGE_CAPABILITY_MATRIX[exchangeName] || { exchangeName, displayName: exchangeName };

  return {
    exchangeName,
    displayName: matrix.displayName || exchangeName,
    status: 'not_connected',
    phase3AStatus: PHASE3A_ACCOUNT_STATUSES.NOT_CONNECTED,
    plainEnglishStatus: reason || `${matrix.displayName || exchangeName} needs a saved read-only API key before account balances, fees, limits, and positions can be checked.`,
    balances: { assetCount: 0, nonZeroAssetCount: 0, visibleBalances: [] },
    feeTier: { status: 'not_checked', makerFeePercent: null, takerFeePercent: null },
    accountLimits: { status: 'not_checked' },
    symbolTradingRules: { status: 'not_checked' },
    positions: { status: 'not_checked', count: 0, visiblePositions: [] },
    subaccounts: { status: 'not_checked' },
    marginFuturesMetadata: { status: 'not_checked' },
    withdrawalPermission: 'not_verified',
    permissionReview: {
      status: 'not_verified',
      readOnlyAttested: false,
      tradingDisabledAttested: false,
      withdrawalsDisabledAttested: false,
      tradingPermissionDetected: false,
      unsafeWithdrawalPermissionDetected: false
    },
    endpoints: [],
    safetyBoundary: {
      readOnlyAccountData: true,
      secretValuesReturnedToUi: false,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      orderEndpointEnabled: false,
      ordersPlaced: false
    }
  };
}

function getFilter(filters = [], filterType) {
  return (Array.isArray(filters) ? filters : []).find(filter => filter.filterType === filterType) || {};
}

function createSymbolTradingRulesUnavailable(exchangeName, symbol, error = null) {
  const matrix = EXCHANGE_CAPABILITY_MATRIX[exchangeName] || { exchangeName, displayName: exchangeName };
  return {
    status: 'unavailable',
    exchangeName,
    displayName: matrix.displayName || exchangeName,
    symbol: normalizeSymbol(symbol).canonical,
    endpoint: null,
    minOrderQuantity: null,
    minOrderNotional: null,
    tickSize: null,
    stepSize: null,
    rateLimits: matrix.rateLimits || [],
    marginAvailable: Boolean(matrix.margin),
    futuresAvailable: Boolean(matrix.futures),
    plainEnglishStatus: error
      ? `${matrix.displayName || exchangeName} symbol trading rules could not be loaded from the public exchange endpoint: ${String(error.message || error).slice(0, 240)}`
      : `${matrix.displayName || exchangeName} symbol trading rules have not been loaded yet.`
  };
}

async function fetchBinanceSymbolTradingRules(symbol = 'BTC/USDT') {
  const normalized = normalizeSymbol(symbol);
  const data = await fetchJsonWithTimeout(`https://api.binance.com/api/v3/exchangeInfo?symbol=${normalized.compact}`);
  const item = data.symbols?.[0] || {};
  const lotSize = getFilter(item.filters, 'LOT_SIZE');
  const marketLotSize = getFilter(item.filters, 'MARKET_LOT_SIZE');
  const minNotional = getFilter(item.filters, 'MIN_NOTIONAL');
  const notional = getFilter(item.filters, 'NOTIONAL');
  const priceFilter = getFilter(item.filters, 'PRICE_FILTER');
  const permissions = item.permissions || item.permissionSets || [];

  return {
    status: item.symbol ? 'loaded' : 'unavailable',
    exchangeName: 'binance',
    displayName: 'Binance',
    symbol: normalized.canonical,
    exchangeSymbol: item.symbol || normalized.compact,
    endpoint: 'GET /api/v3/exchangeInfo',
    tradingStatus: item.status || 'unknown',
    minOrderQuantity: lotSize.minQty || null,
    maxOrderQuantity: lotSize.maxQty || null,
    minMarketOrderQuantity: marketLotSize.minQty || null,
    minOrderNotional: minNotional.minNotional || notional.minNotional || null,
    tickSize: priceFilter.tickSize || null,
    stepSize: lotSize.stepSize || null,
    allowedOrderTypes: item.orderTypes || [],
    rateLimits: (data.rateLimits || []).map(limit => `${limit.rateLimitType} ${limit.limit}/${limit.intervalNum || 1} ${limit.interval}`),
    marginAvailable: JSON.stringify(permissions).includes('MARGIN'),
    futuresAvailable: true,
    plainEnglishStatus: 'Binance public symbol rules loaded for minimum size, notional, tick size, step size, and rate-limit review.'
  };
}

async function fetchCoinbaseSymbolTradingRules(symbol = 'BTC/USDT') {
  const normalized = normalizeSymbol(symbol);
  const productId = normalized.quote === 'USDT' ? normalized.dash : normalized.dash.replace('USDT', 'USD');
  const data = await fetchJsonWithTimeout(`https://api.exchange.coinbase.com/products/${productId}`);

  return {
    status: data.id ? 'loaded' : 'unavailable',
    exchangeName: 'coinbase',
    displayName: 'Coinbase',
    symbol: normalized.canonical,
    exchangeSymbol: data.id || productId,
    endpoint: 'GET /products/:product_id',
    tradingStatus: data.status || (data.trading_disabled ? 'disabled' : 'online'),
    minOrderQuantity: data.base_min_size || null,
    maxOrderQuantity: data.base_max_size || null,
    minOrderNotional: data.min_market_funds || data.quote_min_size || null,
    tickSize: data.quote_increment || null,
    stepSize: data.base_increment || null,
    allowedOrderTypes: ['market', 'limit', 'stop-limit'],
    rateLimits: EXCHANGE_CAPABILITY_MATRIX.coinbase.rateLimits,
    marginAvailable: false,
    futuresAvailable: true,
    plainEnglishStatus: 'Coinbase product rules loaded for minimum size, increments, and product trading status.'
  };
}

async function fetchKrakenSymbolTradingRules(symbol = 'BTC/USDT') {
  const normalized = normalizeSymbol(symbol);
  const data = await fetchJsonWithTimeout(`https://api.kraken.com/0/public/AssetPairs?pair=${normalized.kraken}`);
  if (Array.isArray(data.error) && data.error.length) {
    throw new Error(data.error.join(', '));
  }
  const result = data.result || {};
  const pairKey = Object.keys(result)[0];
  const item = result[pairKey] || {};

  return {
    status: pairKey ? 'loaded' : 'unavailable',
    exchangeName: 'kraken',
    displayName: 'Kraken',
    symbol: normalized.canonical,
    exchangeSymbol: pairKey || normalized.kraken,
    endpoint: 'GET /0/public/AssetPairs',
    tradingStatus: item.status || 'online',
    minOrderQuantity: item.ordermin || null,
    maxOrderQuantity: null,
    minOrderNotional: item.costmin || null,
    tickSize: item.tick_size || null,
    stepSize: item.lot_decimals !== undefined ? `1e-${item.lot_decimals}` : null,
    allowedOrderTypes: ['market', 'limit', 'post-only flags', 'IOC flags'],
    rateLimits: EXCHANGE_CAPABILITY_MATRIX.kraken.rateLimits,
    marginAvailable: Boolean(item.leverage_buy?.length || item.leverage_sell?.length),
    futuresAvailable: true,
    plainEnglishStatus: 'Kraken tradable pair rules loaded for order minimums, cost minimums, decimals, and margin availability.'
  };
}

async function fetchOkxSymbolTradingRules(symbol = 'BTC/USDT') {
  const normalized = normalizeSymbol(symbol);
  const data = await fetchJsonWithTimeout(`https://www.okx.com/api/v5/public/instruments?instType=SPOT&instId=${normalized.dash}`);
  const item = data.data?.[0] || {};

  return {
    status: item.instId ? 'loaded' : 'unavailable',
    exchangeName: 'okx',
    displayName: 'OKX',
    symbol: normalized.canonical,
    exchangeSymbol: item.instId || normalized.dash,
    endpoint: 'GET /api/v5/public/instruments',
    tradingStatus: item.state || 'unknown',
    minOrderQuantity: item.minSz || null,
    maxOrderQuantity: null,
    minOrderNotional: item.minNotional || null,
    tickSize: item.tickSz || null,
    stepSize: item.lotSz || null,
    allowedOrderTypes: ['market', 'limit', 'post-only', 'IOC', 'TP/SL algos'],
    rateLimits: EXCHANGE_CAPABILITY_MATRIX.okx.rateLimits,
    marginAvailable: true,
    futuresAvailable: true,
    plainEnglishStatus: 'OKX instrument rules loaded for minimum size, lot size, tick size, and instrument state.'
  };
}

async function fetchBybitSymbolTradingRules(symbol = 'BTC/USDT') {
  const normalized = normalizeSymbol(symbol);
  const data = await fetchJsonWithTimeout(`https://api.bybit.com/v5/market/instruments-info?category=spot&symbol=${normalized.compact}`);
  const item = data.result?.list?.[0] || {};
  const lot = item.lotSizeFilter || {};
  const price = item.priceFilter || {};

  return {
    status: item.symbol ? 'loaded' : 'unavailable',
    exchangeName: 'bybit',
    displayName: 'Bybit',
    symbol: normalized.canonical,
    exchangeSymbol: item.symbol || normalized.compact,
    endpoint: 'GET /v5/market/instruments-info',
    tradingStatus: item.status || 'unknown',
    minOrderQuantity: lot.minOrderQty || null,
    maxOrderQuantity: lot.maxOrderQty || lot.maxLimitOrderQty || null,
    minOrderNotional: lot.minOrderAmt || lot.minNotionalValue || null,
    tickSize: price.tickSize || null,
    stepSize: lot.qtyStep || lot.basePrecision || null,
    allowedOrderTypes: ['market', 'limit', 'post-only', 'IOC', 'TP/SL'],
    rateLimits: EXCHANGE_CAPABILITY_MATRIX.bybit.rateLimits,
    marginAvailable: Boolean(item.marginTrading && item.marginTrading !== 'none'),
    futuresAvailable: true,
    plainEnglishStatus: 'Bybit instrument rules loaded for minimum order quantity, minimum amount, tick size, and spot margin flag.'
  };
}

const SYMBOL_TRADING_RULE_FETCHERS = {
  binance: fetchBinanceSymbolTradingRules,
  coinbase: fetchCoinbaseSymbolTradingRules,
  kraken: fetchKrakenSymbolTradingRules,
  okx: fetchOkxSymbolTradingRules,
  bybit: fetchBybitSymbolTradingRules
};

async function fetchSymbolTradingRules(exchangeName, symbol = 'BTC/USDT') {
  const normalizedExchange = normalizeExchangeName(exchangeName);
  const fetcher = SYMBOL_TRADING_RULE_FETCHERS[normalizedExchange];

  if (!fetcher) {
    return createSymbolTradingRulesUnavailable(normalizedExchange, symbol, new Error('No symbol-rule adapter exists yet.'));
  }

  try {
    return await fetcher(symbol);
  } catch (error) {
    return createSymbolTradingRulesUnavailable(normalizedExchange, symbol, error);
  }
}

function buildCredentialPermissionReview(credentials = {}, profile = {}) {
  const checklist = credentials?.permissionsChecklist || {};
  const readOnlyAttested = checklist.readOnlyEnabled === true;
  const tradingDisabledAttested = checklist.tradingDisabled === true;
  const withdrawalsDisabledAttested = checklist.withdrawalsDisabled === true || checklist.transferDisabled === true;
  const unsafeWithdrawalPermissionDetected = profile.withdrawalPermission === 'enabled_on_exchange_key_review_required';
  const accountCanTradeSignal = profile.accountLimits?.canTrade === true
    || profile.marginFuturesMetadata?.canTrade === true
    || profile.accountLimits?.keyInfo?.permissions?.Trade?.length > 0
    || profile.accountLimits?.keyInfo?.permissions?.Derivatives?.length > 0;
  const tradingPermissionDetected = Boolean(accountCanTradeSignal || checklist.tradingDisabled === false);

  return {
    status: unsafeWithdrawalPermissionDetected
      ? 'unsafe_permissions_detected'
      : readOnlyAttested
        ? 'owner_attested_read_only'
        : 'not_attested',
    readOnlyAttested,
    tradingDisabledAttested,
    withdrawalsDisabledAttested,
    tradingPermissionDetected,
    unsafeWithdrawalPermissionDetected,
    withdrawalSignal: profile.withdrawalPermission || 'not_verified',
    plainEnglishStatus: unsafeWithdrawalPermissionDetected
      ? 'This key or account reports withdrawal capability. Delete it and recreate a read-only key before continuing.'
      : readOnlyAttested
        ? 'Owner checklist confirms read-only setup. EtherealAI still keeps live trading and signing locked.'
        : 'Read-only owner checklist is missing or incomplete.'
  };
}

function derivePhase3AStatus(profile = {}) {
  if (profile.status === 'error') {
    return PHASE3A_ACCOUNT_STATUSES.ERROR;
  }

  if (profile.permissionReview?.unsafeWithdrawalPermissionDetected) {
    return PHASE3A_ACCOUNT_STATUSES.UNSAFE_PERMISSIONS_DETECTED;
  }

  if (profile.status === 'read_only_account_connected') {
    return profile.permissionReview?.tradingPermissionDetected
      ? PHASE3A_ACCOUNT_STATUSES.TRADING_PERMISSION_PRESENT_BUT_LOCKED
      : PHASE3A_ACCOUNT_STATUSES.AUTHENTICATED_READ_ONLY;
  }

  if (profile.symbolTradingRules?.status === 'loaded') {
    return PHASE3A_ACCOUNT_STATUSES.PUBLIC_MARKET_DATA_ONLY;
  }

  return PHASE3A_ACCOUNT_STATUSES.NOT_CONNECTED;
}

function enrichPhase3AProfile(profile, {
  credentials = null,
  symbolTradingRules = null
} = {}) {
  const enriched = {
    ...profile,
    symbolTradingRules: symbolTradingRules || profile.symbolTradingRules || { status: 'not_checked' }
  };
  enriched.permissionReview = buildCredentialPermissionReview(credentials, enriched);
  enriched.phase3AStatus = derivePhase3AStatus(enriched);
  enriched.plainEnglishReadiness = `${enriched.displayName} status: ${enriched.phase3AStatus}. ${enriched.plainEnglishStatus || ''}`.trim();
  return enriched;
}

async function fetchBinanceAccountProfile(credentials, symbol = 'BTC/USDT') {
  const normalized = normalizeSymbol(symbol);
  const timestamp = Date.now();
  const recvWindow = 5000;
  const signedQuery = query => {
    const fullQuery = `${query ? `${query}&` : ''}timestamp=${timestamp}&recvWindow=${recvWindow}`;
    return `${fullQuery}&signature=${hmacHex(credentials.apiSecret, fullQuery)}`;
  };
  const headers = { 'X-MBX-APIKEY': credentials.apiKey };
  const account = await safeEndpoint('spot account balances and permissions', () => (
    fetchJsonWithTimeout(`https://api.binance.com/api/v3/account?${signedQuery('')}`, { headers })
  ));
  const commission = await safeEndpoint('account-specific maker/taker commission', () => (
    fetchJsonWithTimeout(`https://api.binance.com/api/v3/account/commission?${signedQuery(`symbol=${normalized.compact}`)}`, { headers })
  ));
  const balances = (account.data?.balances || []).map(item => ({
    asset: item.asset,
    available: toFiniteNumber(item.free, 0),
    locked: toFiniteNumber(item.locked, 0),
    total: toFiniteNumber(item.free, 0) + toFiniteNumber(item.locked, 0)
  }));
  const makerFeePercent = toFiniteNumber(commission.data?.standardCommission?.maker, null);
  const takerFeePercent = toFiniteNumber(commission.data?.standardCommission?.taker, null);

  return {
    exchangeName: 'binance',
    displayName: 'Binance',
    status: account.status === 'ok' ? 'read_only_account_connected' : 'partial_or_error',
    plainEnglishStatus: account.status === 'ok'
      ? 'Binance read-only account data is reachable. Trading and withdrawals remain disabled in EtherealAI.'
      : 'Binance read-only account data could not be reached. Recheck the read-only key and permissions.',
    balances: summarizeBalances(balances),
    feeTier: {
      status: commission.status,
      makerFeePercent,
      takerFeePercent,
      note: makerFeePercent === null ? 'Commission endpoint unavailable or response shape changed.' : 'Returned as account-specific commission fraction when available.'
    },
    accountLimits: {
      status: 'metadata_available',
      canTrade: Boolean(account.data?.canTrade),
      canWithdraw: Boolean(account.data?.canWithdraw),
      accountType: account.data?.accountType || null,
      permissions: account.data?.permissions || []
    },
    positions: { status: 'spot_only_for_this_scan', count: 0, visiblePositions: [] },
    subaccounts: { status: 'not_scanned', note: 'Subaccounts require separate Binance account-specific permissions.' },
    marginFuturesMetadata: { status: 'metadata_only', canTrade: Boolean(account.data?.canTrade), accountType: account.data?.accountType || null },
    withdrawalPermission: account.data?.canWithdraw === false ? 'verified_disabled' : account.data?.canWithdraw === true ? 'enabled_on_exchange_key_review_required' : 'not_verified',
    endpoints: [account, commission],
    safetyBoundary: createPhase3SafetyBoundary()
  };
}

async function fetchCoinbaseAccountProfile(credentials) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const headersFor = requestPath => ({
    'CB-ACCESS-KEY': credentials.apiKey,
    'CB-ACCESS-SIGN': hmacBase64(Buffer.from(credentials.apiSecret, 'base64'), `${timestamp}GET${requestPath}`),
    'CB-ACCESS-TIMESTAMP': timestamp,
    'CB-ACCESS-PASSPHRASE': credentials.passphrase,
    'Content-Type': 'application/json'
  });
  const accounts = await safeEndpoint('account balances', () => (
    fetchJsonWithTimeout('https://api.exchange.coinbase.com/accounts', { headers: headersFor('/accounts') })
  ));
  const fees = await safeEndpoint('maker/taker fee tier', () => (
    fetchJsonWithTimeout('https://api.exchange.coinbase.com/fees', { headers: headersFor('/fees') })
  ));
  const profiles = await safeEndpoint('portfolios/profiles', () => (
    fetchJsonWithTimeout('https://api.exchange.coinbase.com/profiles', { headers: headersFor('/profiles') })
  ));
  const balances = Array.isArray(accounts.data)
    ? accounts.data.map(item => ({
      asset: item.currency,
      available: toFiniteNumber(item.available, 0),
      hold: toFiniteNumber(item.hold, 0),
      total: toFiniteNumber(item.balance, 0)
    }))
    : [];

  return {
    exchangeName: 'coinbase',
    displayName: 'Coinbase',
    status: accounts.status === 'ok' ? 'read_only_account_connected' : 'partial_or_error',
    plainEnglishStatus: accounts.status === 'ok'
      ? 'Coinbase read-only account data is reachable for this key type. Trading and transfers remain disabled in EtherealAI.'
      : 'Coinbase account data could not be reached. Coinbase Advanced CDP keys may need the future JWT flow.',
    balances: summarizeBalances(balances),
    feeTier: {
      status: fees.status,
      makerFeePercent: toFiniteNumber(fees.data?.maker_fee_rate, null),
      takerFeePercent: toFiniteNumber(fees.data?.taker_fee_rate, null),
      note: 'Coinbase Advanced fee tiers may require CDP JWT transaction_summary for newer keys.'
    },
    accountLimits: { status: 'not_checked', note: 'Account limits need key-type-specific support.' },
    positions: { status: 'spot_and_futures_metadata_only', count: 0, visiblePositions: [] },
    subaccounts: { status: profiles.status, count: Array.isArray(profiles.data) ? profiles.data.length : 0 },
    marginFuturesMetadata: { status: 'metadata_only', note: 'Coinbase futures availability depends on owner account eligibility.' },
    withdrawalPermission: 'not_verified_by_this_key_type',
    endpoints: [accounts, fees, profiles],
    safetyBoundary: createPhase3SafetyBoundary()
  };
}

async function fetchKrakenPrivate(credentials, requestPath, data = {}) {
  const nonce = Date.now().toString();
  const postData = new URLSearchParams({ nonce, ...data }).toString();
  const secret = Buffer.from(credentials.apiSecret, 'base64');
  const hash = crypto.createHash('sha256').update(nonce + postData).digest();
  const signature = crypto.createHmac('sha512', secret).update(Buffer.concat([Buffer.from(requestPath), hash])).digest('base64');

  return fetchJsonWithTimeout(`https://api.kraken.com${requestPath}`, {
    method: 'POST',
    headers: {
      'API-Key': credentials.apiKey,
      'API-Sign': signature,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: postData
  });
}

async function fetchKrakenAccountProfile(credentials, symbol = 'BTC/USD') {
  const normalized = normalizeSymbol(symbol);
  const pair = normalized.quote === 'USD' ? 'XXBTZUSD' : normalized.kraken;
  const balance = await safeEndpoint('account balances', () => fetchKrakenPrivate(credentials, '/0/private/Balance'));
  const tradeBalance = await safeEndpoint('margin and trade balance', () => fetchKrakenPrivate(credentials, '/0/private/TradeBalance', { asset: 'ZUSD' }));
  const volume = await safeEndpoint('30-day volume and fee schedule', () => fetchKrakenPrivate(credentials, '/0/private/TradeVolume', { pair, fee_info: true }));
  const balances = Object.entries(balance.data?.result || {}).map(([asset, amount]) => ({
    asset,
    available: toFiniteNumber(amount, 0),
    total: toFiniteNumber(amount, 0)
  }));
  const feeInfo = volume.data?.result?.fees?.[pair] || volume.data?.result?.fees_maker?.[pair] || null;

  return {
    exchangeName: 'kraken',
    displayName: 'Kraken',
    status: balance.status === 'ok' ? 'read_only_account_connected' : 'partial_or_error',
    plainEnglishStatus: balance.status === 'ok'
      ? 'Kraken read-only account data is reachable. Add Order and Withdraw permissions must remain disabled.'
      : 'Kraken read-only account data could not be reached. Check Query Funds and read-only permissions.',
    balances: summarizeBalances(balances),
    feeTier: {
      status: volume.status,
      makerFeePercent: toFiniteNumber(feeInfo?.fee_maker, null),
      takerFeePercent: toFiniteNumber(feeInfo?.fee, null),
      thirtyDayVolumeUsd: toFiniteNumber(volume.data?.result?.volume, null)
    },
    accountLimits: { status: 'not_checked', note: 'Pair minimums should come from public AssetPairs before sandbox/live test mode.' },
    positions: { status: tradeBalance.status, count: 0, visiblePositions: [] },
    subaccounts: { status: 'not_scanned' },
    marginFuturesMetadata: { status: tradeBalance.status, tradeBalance: tradeBalance.data?.result || null },
    withdrawalPermission: 'not_verified_by_balance_endpoint',
    endpoints: [balance, tradeBalance, volume],
    safetyBoundary: createPhase3SafetyBoundary()
  };
}

function okxSignature(credentials, timestamp, method, requestPath, body = '') {
  return hmacBase64(credentials.apiSecret, `${timestamp}${method}${requestPath}${body}`);
}

async function fetchOkxPrivate(credentials, requestPath) {
  const timestamp = new Date().toISOString();

  return fetchJsonWithTimeout(`https://www.okx.com${requestPath}`, {
    headers: {
      'OK-ACCESS-KEY': credentials.apiKey,
      'OK-ACCESS-SIGN': okxSignature(credentials, timestamp, 'GET', requestPath),
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': credentials.passphrase
    }
  });
}

async function fetchOkxAccountProfile(credentials, symbol = 'BTC/USDT') {
  const normalized = normalizeSymbol(symbol);
  const balance = await safeEndpoint('account balances', () => fetchOkxPrivate(credentials, '/api/v5/account/balance'));
  const fees = await safeEndpoint('account-specific maker/taker fees', () => fetchOkxPrivate(credentials, `/api/v5/account/trade-fee?instType=SPOT&instId=${normalized.dash}`));
  const config = await safeEndpoint('account mode and limits metadata', () => fetchOkxPrivate(credentials, '/api/v5/account/config'));
  const positions = await safeEndpoint('open positions visibility', () => fetchOkxPrivate(credentials, '/api/v5/account/positions'));
  const detail = balance.data?.data?.[0] || {};
  const balances = (detail.details || []).map(item => ({
    asset: item.ccy,
    available: toFiniteNumber(item.availBal || item.cashBal, 0),
    total: toFiniteNumber(item.eq, 0),
    usdValue: toFiniteNumber(item.eqUsd, null)
  }));
  const fee = fees.data?.data?.[0] || {};

  return {
    exchangeName: 'okx',
    displayName: 'OKX',
    status: balance.status === 'ok' ? 'read_only_account_connected' : 'partial_or_error',
    plainEnglishStatus: balance.status === 'ok'
      ? 'OKX read-only account data is reachable. Demo/sandbox must be used before any future live test.'
      : 'OKX read-only account data could not be reached. Confirm Read permission and passphrase.',
    balances: summarizeBalances(balances),
    feeTier: {
      status: fees.status,
      makerFeePercent: toFiniteNumber(fee.maker, null),
      takerFeePercent: toFiniteNumber(fee.taker, null)
    },
    accountLimits: { status: config.status, accountConfig: config.data?.data?.[0] || null },
    positions: {
      status: positions.status,
      count: Array.isArray(positions.data?.data) ? positions.data.data.length : 0,
      visiblePositions: (positions.data?.data || []).slice(0, 12)
    },
    subaccounts: { status: 'not_scanned', note: 'Subaccount scans need separate OKX subaccount read endpoints.' },
    marginFuturesMetadata: { status: config.status, accountMode: config.data?.data?.[0]?.acctLv || null },
    withdrawalPermission: 'not_verified_by_account_balance_endpoint',
    endpoints: [balance, fees, config, positions],
    safetyBoundary: createPhase3SafetyBoundary()
  };
}

function bybitSignature(credentials, timestamp, recvWindow, queryString = '') {
  return hmacHex(credentials.apiSecret, `${timestamp}${credentials.apiKey}${recvWindow}${queryString}`);
}

async function fetchBybitPrivate(credentials, requestPath, params = {}) {
  const query = new URLSearchParams(params).toString();
  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  const signature = bybitSignature(credentials, timestamp, recvWindow, query);

  return fetchJsonWithTimeout(`https://api.bybit.com${requestPath}${query ? `?${query}` : ''}`, {
    headers: {
      'X-BAPI-API-KEY': credentials.apiKey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'X-BAPI-SIGN': signature
    }
  });
}

async function fetchBybitAccountProfile(credentials, symbol = 'BTC/USDT') {
  const normalized = normalizeSymbol(symbol);
  const balance = await safeEndpoint('wallet balance', () => fetchBybitPrivate(credentials, '/v5/account/wallet-balance', { accountType: 'UNIFIED' }));
  const fees = await safeEndpoint('account-specific maker/taker fees', () => fetchBybitPrivate(credentials, '/v5/account/fee-rate', { category: 'spot', symbol: normalized.compact }));
  const positions = await safeEndpoint('position visibility', () => fetchBybitPrivate(credentials, '/v5/position/list', { category: 'linear', settleCoin: 'USDT' }));
  const keyInfo = await safeEndpoint('api key permission metadata', () => fetchBybitPrivate(credentials, '/v5/user/query-api'));
  const account = balance.data?.result?.list?.[0] || {};
  const balances = (account.coin || []).map(item => ({
    asset: item.coin,
    available: toFiniteNumber(item.walletBalance, 0),
    total: toFiniteNumber(item.equity, 0),
    usdValue: toFiniteNumber(item.usdValue, null)
  }));
  const fee = fees.data?.result?.list?.[0] || {};

  return {
    exchangeName: 'bybit',
    displayName: 'Bybit',
    status: balance.status === 'ok' ? 'read_only_account_connected' : 'partial_or_error',
    plainEnglishStatus: balance.status === 'ok'
      ? 'Bybit read-only account data is reachable. Testnet must be used before any future live test.'
      : 'Bybit read-only account data could not be reached. Confirm Read-Only permissions.',
    balances: summarizeBalances(balances),
    feeTier: {
      status: fees.status,
      makerFeePercent: toFiniteNumber(fee.makerFeeRate, null),
      takerFeePercent: toFiniteNumber(fee.takerFeeRate, null)
    },
    accountLimits: { status: keyInfo.status, keyInfo: keyInfo.data?.result || null },
    positions: {
      status: positions.status,
      count: Array.isArray(positions.data?.result?.list) ? positions.data.result.list.length : 0,
      visiblePositions: (positions.data?.result?.list || []).slice(0, 12)
    },
    subaccounts: { status: 'not_scanned', note: 'Subaccount scans need separate owner-approved endpoint support.' },
    marginFuturesMetadata: {
      status: balance.status,
      totalEquity: toFiniteNumber(account.totalEquity, null),
      totalAvailableBalance: toFiniteNumber(account.totalAvailableBalance, null)
    },
    withdrawalPermission: keyInfo.data?.result?.permissions?.Withdraw?.length ? 'enabled_on_exchange_key_review_required' : 'not_verified_or_disabled',
    endpoints: [balance, fees, positions, keyInfo],
    safetyBoundary: createPhase3SafetyBoundary()
  };
}

const AUTHENTICATED_READONLY_FETCHERS = {
  binance: fetchBinanceAccountProfile,
  coinbase: fetchCoinbaseAccountProfile,
  kraken: fetchKrakenAccountProfile,
  okx: fetchOkxAccountProfile,
  bybit: fetchBybitAccountProfile
};

function createPhase3SafetyBoundary() {
  return {
    readOnlyAccountData: true,
    secretValuesReturnedToUi: false,
    liveTradingEnabled: false,
    unrestrictedLiveTradingEnabled: false,
    withdrawalsEnabled: false,
    walletSigningEnabled: false,
    orderEndpointEnabled: false,
    orderEndpointCalled: false,
    ordersPlaced: false,
    dryRunOnly: true,
    manualOwnerApprovalRequired: true
  };
}

async function scanAuthenticatedReadOnlyAccounts({
  connectors = [],
  credentialLoader,
  symbol = 'BTC/USDT',
  includePublicSymbolRules = true
} = {}) {
  const profiles = [];
  const uniqueConnectors = new Map();

  for (const connector of connectors) {
    const exchangeName = normalizeExchangeName(connector.settings?.registryId || connector.exchange_name || connector.exchangeName);
    const existing = uniqueConnectors.get(exchangeName);
    const connectionStatus = connector.settings?.readOnlyConnection?.connectionStatus || '';
    const connectorScore = (connector.secret_reference_status === 'configured' ? 4 : 0)
      + (connectionStatus === 'read_only_connected' ? 3 : 0)
      + (connector.status === 'configured' ? 2 : 0);
    const existingConnectionStatus = existing?.settings?.readOnlyConnection?.connectionStatus || '';
    const existingScore = existing
      ? (existing.secret_reference_status === 'configured' ? 4 : 0)
        + (existingConnectionStatus === 'read_only_connected' ? 3 : 0)
        + (existing.status === 'configured' ? 2 : 0)
      : -1;

    if (!exchangeName || !PHASE3_RECOMMENDED_EXCHANGES.includes(exchangeName)) {
      continue;
    }

    if (!existing || connectorScore > existingScore) {
      uniqueConnectors.set(exchangeName, connector);
    }
  }

  for (const exchangeName of PHASE3_RECOMMENDED_EXCHANGES) {
    const connector = uniqueConnectors.get(exchangeName) || null;
    const symbolTradingRules = includePublicSymbolRules
      ? await fetchSymbolTradingRules(exchangeName, symbol)
      : createSymbolTradingRulesUnavailable(exchangeName, symbol);
    const fetcher = AUTHENTICATED_READONLY_FETCHERS[exchangeName];
    if (!fetcher) {
      profiles.push(enrichPhase3AProfile(
        buildUnavailableAccountProfile(exchangeName, 'This exchange does not have a Phase 3 authenticated read-only adapter yet.'),
        { symbolTradingRules }
      ));
      continue;
    }

    const credentials = connector && credentialLoader ? await credentialLoader(connector) : null;
    if (!credentials?.apiKey || !credentials?.apiSecret) {
      profiles.push(enrichPhase3AProfile(buildUnavailableAccountProfile(exchangeName), {
        symbolTradingRules
      }));
      continue;
    }

    try {
      profiles.push(enrichPhase3AProfile(await fetcher(credentials, symbol), {
        credentials,
        symbolTradingRules
      }));
    } catch (error) {
      profiles.push(enrichPhase3AProfile({
        ...buildUnavailableAccountProfile(exchangeName),
        status: 'error',
        plainEnglishStatus: `${EXCHANGE_CAPABILITY_MATRIX[exchangeName]?.displayName || exchangeName} authenticated read-only account scan failed: ${String(error.message || error).slice(0, 400)}`
      }, {
        credentials,
        symbolTradingRules
      }));
    }
  }

  const connected = profiles.filter(profile => profile.status === 'read_only_account_connected');
  const unsafe = profiles.filter(profile => profile.phase3AStatus === PHASE3A_ACCOUNT_STATUSES.UNSAFE_PERMISSIONS_DETECTED);

  return {
    status: unsafe.length
      ? 'unsafe_permissions_detected'
      : connected.length
        ? 'partial_account_visibility'
        : 'waiting_for_read_only_keys',
    plainEnglishSummary: unsafe.length
      ? `${unsafe.length} exchange key(s) need immediate review because unsafe permissions were detected. Live trading is still locked.`
      : connected.length
        ? `${connected.length} authenticated read-only account connection(s) returned account data. Live trading remains locked.`
      : 'No authenticated read-only account data is connected yet. Add read-only keys in Exchange Connectors when ready.',
    profiles,
    totals: {
      scanned: profiles.length,
      connected: connected.length,
      publicMarketDataOnly: profiles.filter(profile => profile.phase3AStatus === PHASE3A_ACCOUNT_STATUSES.PUBLIC_MARKET_DATA_ONLY).length,
      tradingPermissionPresentButLocked: profiles.filter(profile => profile.phase3AStatus === PHASE3A_ACCOUNT_STATUSES.TRADING_PERMISSION_PRESENT_BUT_LOCKED).length,
      unsafePermissions: unsafe.length,
      symbolRulesLoaded: profiles.filter(profile => profile.symbolTradingRules?.status === 'loaded').length,
      errors: profiles.filter(profile => profile.status === 'error' || profile.status === 'partial_or_error').length
    },
    safetyBoundary: createPhase3SafetyBoundary(),
    generatedAt: new Date().toISOString()
  };
}

function normalizeUniversalOrderDraft(input = {}) {
  const type = String(input.type || input.orderType || 'limit').trim().toLowerCase().replace(/-/g, '_');
  const side = String(input.side || 'buy').trim().toLowerCase();
  const symbol = normalizeSymbol(input.symbol || 'BTC/USDT').canonical;
  const quantity = toFiniteNumber(input.quantity, null);
  const notionalUsd = toFiniteNumber(input.notionalUsd ?? input.orderSizeUsd, null);
  const limitPrice = toFiniteNumber(input.limitPrice, null);

  return {
    type: UNIVERSAL_ORDER_TYPES.includes(type) ? type : 'limit',
    side: side === 'sell' ? 'sell' : 'buy',
    symbol,
    quantity,
    notionalUsd,
    limitPrice,
    postOnly: Boolean(input.postOnly || type === 'post_only'),
    ioc: Boolean(input.ioc || type === 'ioc'),
    reduceOnly: Boolean(input.reduceOnly || type === 'reduce_only'),
    takeProfitPrice: toFiniteNumber(input.takeProfitPrice, null),
    stopLossPrice: toFiniteNumber(input.stopLossPrice, null),
    bracket: Boolean(input.bracket || type === 'bracket'),
    timeInForce: String(input.timeInForce || (type === 'ioc' ? 'IOC' : 'GTC')).toUpperCase(),
    clientOrderId: String(input.clientOrderId || `dryrun-${Date.now()}`),
    dryRun: input.dryRun !== false,
    liveExecutionRequested: Boolean(input.liveExecutionRequested),
    ownerApproved: Boolean(input.ownerApproved),
    sandboxRequested: Boolean(input.sandboxRequested),
    createdAt: new Date().toISOString()
  };
}

function evaluateLiveExecutionSafety({
  order = {},
  policy = DEFAULT_LIVE_SAFETY_POLICY,
  marketContext = {},
  accountContext = {},
  recentOrderFingerprints = []
} = {}) {
  const normalizedOrder = normalizeUniversalOrderDraft(order);
  const mergedPolicy = { ...DEFAULT_LIVE_SAFETY_POLICY, ...(policy || {}) };
  const failures = [];
  const warnings = [];
  const notional = toFiniteNumber(normalizedOrder.notionalUsd, null);
  const estimatedSlippage = toFiniteNumber(marketContext.estimatedSlippagePercent, null);
  const latencyMs = toFiniteNumber(marketContext.latencyMs, null);
  const priceAgeMs = toFiniteNumber(marketContext.priceAgeMs, null);
  const liquidityUsd = toFiniteNumber(marketContext.liquidityUsd, null);
  const netSpreadPercent = toFiniteNumber(marketContext.netSpreadPercent, null);

  if (mergedPolicy.globalKillSwitchEnabled) failures.push('global kill switch is on');
  if (mergedPolicy.liveExecutionLocked) failures.push('live execution is locked');
  if (mergedPolicy.dryRunOnly && normalizedOrder.liveExecutionRequested) failures.push('dry-run mode is required');
  if (mergedPolicy.requireManualOwnerApproval && !normalizedOrder.ownerApproved) failures.push('manual owner approval is missing');
  if (mergedPolicy.requireSandboxFirst && !normalizedOrder.sandboxRequested) warnings.push('sandbox/testnet should run before any live venue');
  if (notional === null || notional <= 0) failures.push('order size is missing');
  if (notional !== null && notional > mergedPolicy.maxOrderSizeUsd) failures.push('order size is above the max order limit');
  if (estimatedSlippage !== null && estimatedSlippage > mergedPolicy.maxSlippagePercent) failures.push('slippage estimate is above the guardrail');
  if (latencyMs !== null && latencyMs > mergedPolicy.maxLatencyMs) failures.push('latency is above the allowed threshold');
  if (priceAgeMs !== null && priceAgeMs > mergedPolicy.maxPriceAgeMs) failures.push('market price is stale');
  if (liquidityUsd !== null && liquidityUsd < mergedPolicy.minLiquidityUsd) failures.push('visible liquidity is below the minimum');
  if (netSpreadPercent !== null && netSpreadPercent < mergedPolicy.minNetSpreadPercent) warnings.push('net spread is below the preferred edge threshold');
  if (accountContext.withdrawalPermission === 'enabled_on_exchange_key_review_required') failures.push('withdrawal permission needs owner review and disablement');
  if (recentOrderFingerprints.includes(normalizedOrder.clientOrderId)) failures.push('duplicate client order id detected');

  const score = Math.max(0, 100 - failures.length * 18 - warnings.length * 7);

  return {
    status: failures.length ? 'blocked' : 'dry_run_ready',
    executionSafetyScore: score,
    normalizedOrder,
    failures,
    warnings,
    nextOwnerAction: failures.length
      ? `Fix: ${failures[0]}.`
      : 'Dry-run safety review passed. Live execution still requires the future approval center.',
    safetyBoundary: createPhase3SafetyBoundary()
  };
}

function buildWebSocketHealthPlan() {
  return {
    status: 'spec_ready_not_running',
    plainEnglishStatus: 'Market stream specs are ready, but persistent websocket listeners are not auto-running yet.',
    streams: Object.values(WEBSOCKET_STREAM_SPECS),
    health: Object.values(WEBSOCKET_STREAM_SPECS).map(stream => ({
      exchangeName: stream.exchangeName,
      displayName: stream.displayName,
      status: stream.status,
      endpoint: stream.endpoint,
      liveLatencyMs: null,
      lastMessageAt: null,
      marketDataOnly: true,
      orderEntryEnabled: false
    })),
    safetyBoundary: createPhase3SafetyBoundary()
  };
}

function computeOpportunityConfidence(candidate = {}, accountProfiles = []) {
  let score = 50;
  const net = toFiniteNumber(candidate.estimatedNetProfitPercent, 0);
  const liquidity = toFiniteNumber(candidate.limitingLiquidityUsd, 0);
  const latency = toFiniteNumber(candidate.latencyMs, 9999);
  const exchanges = [candidate.buyExchangeName, candidate.sellExchangeName].filter(Boolean);
  const accountMatches = accountProfiles.filter(profile => exchanges.includes(profile.exchangeName) && profile.status === 'read_only_account_connected');

  score += Math.min(25, Math.max(-25, net * 150));
  score += liquidity >= 10000 ? 15 : liquidity >= 1000 ? 8 : -10;
  score += latency <= 500 ? 10 : latency <= 1500 ? 3 : -12;
  score += accountMatches.length * 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildAccountAwareArbitrageView({ scan = null, accountScan = null } = {}) {
  const accountProfiles = accountScan?.profiles || [];
  const accountMap = new Map(accountProfiles.map(profile => [profile.exchangeName, profile]));
  const candidates = (scan?.candidates || []).map(candidate => {
    const buyAccount = accountMap.get(candidate.buyExchangeName);
    const sellAccount = accountMap.get(candidate.sellExchangeName);
    const buyFee = toFiniteNumber(buyAccount?.feeTier?.takerFeePercent, null);
    const sellFee = toFiniteNumber(sellAccount?.feeTier?.takerFeePercent, null);
    const accountFeeCost = buyFee !== null && sellFee !== null ? buyFee + sellFee : null;
    const estimatedNetProfitPercent = accountFeeCost === null
      ? candidate.estimatedNetProfitPercent
      : candidate.grossSpreadPercent - accountFeeCost - candidate.slippagePercent - candidate.latencyRiskPercent;

    return {
      ...candidate,
      accountAware: true,
      buyAccountConnected: Boolean(buyAccount),
      sellAccountConnected: Boolean(sellAccount),
      accountSpecificFeeCostPercent: accountFeeCost,
      estimatedAccountAwareNetProfitPercent: estimatedNetProfitPercent,
      confidenceScore: computeOpportunityConfidence(candidate, accountProfiles),
      transferConstraints: 'cross-exchange transfer time/cost is treated as blocking for same-cycle arbitrage until inventory exists on both venues',
      networkCosts: 'not included until owner configures chain-specific withdrawal/network fee metadata',
      partialFillRisk: candidate.limitingLiquidityUsd && candidate.tradeSizeUsd
        ? candidate.tradeSizeUsd > candidate.limitingLiquidityUsd ? 'high' : 'review'
        : 'unknown'
    };
  });

  return {
    status: candidates.length ? 'account_aware_view_ready' : 'waiting_for_scan',
    candidates,
    spreadHeatmap: candidates.slice(0, 12).map(candidate => ({
      route: `${candidate.buyVenue} -> ${candidate.sellVenue}`,
      grossSpreadPercent: candidate.grossSpreadPercent,
      estimatedNetProfitPercent: candidate.estimatedAccountAwareNetProfitPercent ?? candidate.estimatedNetProfitPercent,
      confidenceScore: candidate.confidenceScore,
      executionSafetyScore: candidate.accepted ? 72 : 45
    })),
    safetyBoundary: createPhase3SafetyBoundary()
  };
}

function replaySpreadHistory({ candidates = [], fillAssumption = {} } = {}) {
  const slippagePenalty = toFiniteNumber(fillAssumption.slippagePercent, 0.05);
  const partialFillPenalty = toFiniteNumber(fillAssumption.partialFillPenaltyPercent, 0.03);
  const rows = candidates.map((candidate, index) => {
    const net = toFiniteNumber(candidate.estimatedAccountAwareNetProfitPercent ?? candidate.estimatedNetProfitPercent, 0);
    const simulatedFillNet = net - slippagePenalty - partialFillPenalty;

    return {
      step: index + 1,
      route: `${candidate.buyVenue} -> ${candidate.sellVenue}`,
      grossSpreadPercent: candidate.grossSpreadPercent,
      estimatedNetProfitPercent: net,
      simulatedFillNetPercent: simulatedFillNet,
      simulatedFillAccepted: simulatedFillNet > 0,
      reason: simulatedFillNet > 0 ? 'would pass simulated fill assumptions' : 'would reject after simulated fill assumptions'
    };
  });
  const accepted = rows.filter(row => row.simulatedFillAccepted);

  return {
    status: rows.length ? 'replay_ready' : 'waiting_for_spread_history',
    rows,
    summary: {
      samples: rows.length,
      accepted: accepted.length,
      rejected: rows.length - accepted.length,
      averageSimulatedFillNetPercent: rows.length
        ? rows.reduce((sum, row) => sum + row.simulatedFillNetPercent, 0) / rows.length
        : null
    },
    safetyBoundary: createPhase3SafetyBoundary()
  };
}

function buildOutcomeBenchmark({ candidate = null, accountAwareCandidate = null } = {}) {
  const source = accountAwareCandidate || candidate || {};
  const paper = toFiniteNumber(source.estimatedNetProfitPercent, 0);
  const accountAware = toFiniteNumber(source.estimatedAccountAwareNetProfitPercent, paper);
  const realWorld = accountAware - 0.08;

  return {
    status: source.buyVenue ? 'benchmark_ready' : 'waiting_for_opportunity',
    comparison: {
      paperOpportunityPercent: paper,
      estimatedLiveOutcomePercent: accountAware,
      realWorldFeeAdjustedOutcomePercent: realWorld,
      note: 'Real-world outcome includes an additional conservative execution/partial-fill penalty. This is still dry-run only.'
    },
    safetyBoundary: createPhase3SafetyBoundary()
  };
}

function checklistItem(id, label, passed, {
  status = null,
  note = '',
  nextAction = ''
} = {}) {
  return {
    id,
    label,
    passed: Boolean(passed),
    status: status || (passed ? 'complete' : 'missing'),
    note,
    nextAction
  };
}

function buildPhase3AExchangeChecklist(profile = {}, riskProfile = null) {
  const authenticated = profile.status === 'read_only_account_connected';
  const permissionReview = profile.permissionReview || {};
  const symbolRulesLoaded = profile.symbolTradingRules?.status === 'loaded';
  const feesLoaded = profile.feeTier?.status === 'ok'
    || profile.feeTier?.makerFeePercent !== null
    || profile.feeTier?.takerFeePercent !== null;
  const balancesVisible = authenticated && profile.balances?.assetCount !== undefined;
  const tradingPermissionDetected = Boolean(permissionReview.tradingPermissionDetected);
  const locked = profile.safetyBoundary?.liveTradingEnabled === false
    && profile.safetyBoundary?.orderEndpointEnabled === false
    && profile.safetyBoundary?.walletSigningEnabled === false;

  return [
    checklistItem('api_connected', 'API connected', authenticated, {
      note: authenticated ? 'Authenticated account endpoint returned data.' : 'Add a read-only key in Exchange Connectors, then scan again.',
      nextAction: 'Open Exchange Connectors'
    }),
    checklistItem('read_only_account_verified', 'Read-only account verified', authenticated && permissionReview.readOnlyAttested && locked, {
      note: permissionReview.plainEnglishStatus || 'Read-only checklist not confirmed yet.',
      nextAction: 'Complete the secure-vault read-only checklist'
    }),
    checklistItem('withdrawals_disabled', 'Withdrawals disabled', permissionReview.withdrawalsDisabledAttested && !permissionReview.unsafeWithdrawalPermissionDetected, {
      status: permissionReview.unsafeWithdrawalPermissionDetected ? 'unsafe' : null,
      note: permissionReview.unsafeWithdrawalPermissionDetected
        ? 'Unsafe withdrawal permission was detected. Delete this key and recreate it as read-only.'
        : authenticated
          ? 'Owner checklist confirms withdrawals are disabled; exchange direct verification is used where available.'
          : 'No read-only key is connected yet. Confirm withdrawals are disabled when you add the key.',
      nextAction: permissionReview.unsafeWithdrawalPermissionDetected
        ? 'Delete unsafe key and recreate read-only key'
        : 'Add read-only key and confirm withdrawals disabled'
    }),
    checklistItem('balances_visible', 'Balances visible', balancesVisible, {
      note: balancesVisible ? `${profile.balances.nonZeroAssetCount || 0} non-zero asset(s) visible.` : 'Balances require authenticated read-only account access.',
      nextAction: 'Scan authenticated account readiness'
    }),
    checklistItem('fees_loaded', 'Fees loaded', feesLoaded, {
      note: feesLoaded ? 'Maker/taker fee data loaded where the exchange exposes it.' : 'Fee endpoint was unavailable or needs account-specific permission support.',
      nextAction: 'Review exchange-specific fee endpoint support'
    }),
    checklistItem('symbol_limits_loaded', 'Symbol limits loaded', symbolRulesLoaded, {
      note: symbolRulesLoaded
        ? `Minimum order ${profile.symbolTradingRules.minOrderQuantity || 'n/a'}, minimum notional ${profile.symbolTradingRules.minOrderNotional || 'n/a'}.`
        : profile.symbolTradingRules?.plainEnglishStatus || 'Public symbol rules were not loaded.',
      nextAction: 'Retry public symbol rule scan'
    }),
    checklistItem('sandbox_supported', 'Sandbox supported', Boolean(EXCHANGE_CAPABILITY_MATRIX[profile.exchangeName]?.sandboxSupport), {
      note: EXCHANGE_CAPABILITY_MATRIX[profile.exchangeName]?.sandboxNotes || 'Sandbox support not confirmed for this venue.',
      nextAction: 'Use only venues with sandbox support for Phase 3B'
    }),
    checklistItem('trading_permission_detected_but_locked', 'Trading permission detected but locked', tradingPermissionDetected ? locked : true, {
      status: tradingPermissionDetected ? 'locked' : 'not_detected',
      note: tradingPermissionDetected
        ? 'The exchange/account reports trading capability, but EtherealAI order routes are still disabled.'
        : 'No trading permission signal was detected from the available read-only metadata.',
      nextAction: 'Keep live execution locked'
    }),
    checklistItem('risk_profile_active', 'Risk profile active', Boolean(riskProfile), {
      note: riskProfile
        ? `${riskProfile.name} is active with kill switch off for controlled testing.`
        : 'Create or activate a risk profile before any sandbox/live test phase.',
      nextAction: 'Open Strategy / Paper / Bots risk settings'
    }),
    checklistItem('owner_approval_required', 'Owner approval required', true, {
      status: 'locked',
      note: 'Owner approval remains mandatory before sandbox order tests or tiny live tests.',
      nextAction: 'Future Phase 3B approval center'
    })
  ];
}

function buildPhase3AReadiness({ connectors = [], accountScan = null, riskProfile = null } = {}) {
  const profiles = accountScan?.profiles || [];
  const profileByExchange = new Map(profiles.map(profile => [profile.exchangeName, profile]));
  const exchanges = PHASE3_RECOMMENDED_EXCHANGES.map(exchangeName => {
    const profile = profileByExchange.get(exchangeName) || enrichPhase3AProfile(buildUnavailableAccountProfile(exchangeName));
    const checklist = buildPhase3AExchangeChecklist(profile, riskProfile);
    const failedRequired = checklist.filter(item => (
      ['api_connected', 'read_only_account_verified', 'withdrawals_disabled', 'balances_visible', 'fees_loaded', 'symbol_limits_loaded', 'risk_profile_active'].includes(item.id)
      && !item.passed
    ));

    return {
      exchangeName,
      displayName: profile.displayName,
      status: profile.phase3AStatus || derivePhase3AStatus(profile),
      plainEnglishStatus: profile.plainEnglishReadiness || profile.plainEnglishStatus,
      connector: connectors.find(connector => normalizeExchangeName(connector.settings?.registryId || connector.exchange_name || connector.exchangeName) === exchangeName) || null,
      balances: profile.balances,
      feeTier: profile.feeTier,
      accountLimits: profile.accountLimits,
      symbolTradingRules: profile.symbolTradingRules,
      marginFuturesMetadata: profile.marginFuturesMetadata,
      permissionReview: profile.permissionReview,
      checklist,
      readyForPhase3BPrereview: failedRequired.length === 0 && profile.phase3AStatus !== PHASE3A_ACCOUNT_STATUSES.UNSAFE_PERMISSIONS_DETECTED,
      blockers: failedRequired.map(item => item.label)
    };
  });
  const globalChecklist = [
    checklistItem('api_connected', 'API connected', exchanges.some(exchange => exchange.checklist.find(item => item.id === 'api_connected')?.passed), {
      note: `${exchanges.filter(exchange => exchange.checklist.find(item => item.id === 'api_connected')?.passed).length} of ${exchanges.length} recommended exchanges authenticated.`
    }),
    checklistItem('read_only_account_verified', 'Read-only account verified', exchanges.some(exchange => exchange.checklist.find(item => item.id === 'read_only_account_verified')?.passed)),
    checklistItem('withdrawals_disabled', 'Withdrawals disabled', (
      exchanges.some(exchange => exchange.checklist.find(item => item.id === 'api_connected')?.passed)
      && exchanges.every(exchange => exchange.status !== PHASE3A_ACCOUNT_STATUSES.UNSAFE_PERMISSIONS_DETECTED)
    ), {
      note: 'This becomes complete after at least one read-only key is connected and no unsafe withdrawal permission is detected.'
    }),
    checklistItem('balances_visible', 'Balances visible', exchanges.some(exchange => exchange.checklist.find(item => item.id === 'balances_visible')?.passed)),
    checklistItem('fees_loaded', 'Fees loaded', exchanges.some(exchange => exchange.checklist.find(item => item.id === 'fees_loaded')?.passed)),
    checklistItem('symbol_limits_loaded', 'Symbol limits loaded', exchanges.some(exchange => exchange.checklist.find(item => item.id === 'symbol_limits_loaded')?.passed)),
    checklistItem('sandbox_supported', 'Sandbox supported', exchanges.some(exchange => exchange.checklist.find(item => item.id === 'sandbox_supported')?.passed)),
    checklistItem('trading_permission_detected_but_locked', 'Trading permission detected but locked', true, {
      status: 'locked',
      note: 'Any detected trading capability remains locked because order endpoints do not exist yet.'
    }),
    checklistItem('risk_profile_active', 'Risk profile active', Boolean(riskProfile)),
    checklistItem('owner_approval_required', 'Owner approval required', true, {
      status: 'locked',
      note: 'Owner approval remains required for Phase 3B and later.'
    })
  ];
  const unsafeCount = exchanges.filter(exchange => exchange.status === PHASE3A_ACCOUNT_STATUSES.UNSAFE_PERMISSIONS_DETECTED).length;
  const authenticatedCount = exchanges.filter(exchange => (
    exchange.status === PHASE3A_ACCOUNT_STATUSES.AUTHENTICATED_READ_ONLY
    || exchange.status === PHASE3A_ACCOUNT_STATUSES.TRADING_PERMISSION_PRESENT_BUT_LOCKED
  )).length;

  return {
    title: 'Phase 3A: Authenticated Account Readiness',
    status: unsafeCount
      ? 'unsafe_permissions_review_required'
      : authenticatedCount
        ? 'authenticated_readiness_in_progress'
        : 'waiting_for_secure_vault_keys',
    plainEnglishStatus: unsafeCount
      ? 'One or more exchange keys report unsafe permissions. Delete and recreate those keys as read-only before moving forward.'
      : authenticatedCount
        ? 'Authenticated account readiness is underway. Live trading, wallet signing, withdrawals, and order endpoints remain disabled.'
        : 'Public market rules can be checked now. Add read-only API keys through the secure vault when ready.',
    statuses: PHASE3A_ACCOUNT_STATUSES,
    exchanges,
    checklist: globalChecklist,
    totals: {
      exchanges: exchanges.length,
      authenticatedReadOnly: exchanges.filter(exchange => exchange.status === PHASE3A_ACCOUNT_STATUSES.AUTHENTICATED_READ_ONLY).length,
      tradingPermissionPresentButLocked: exchanges.filter(exchange => exchange.status === PHASE3A_ACCOUNT_STATUSES.TRADING_PERMISSION_PRESENT_BUT_LOCKED).length,
      publicMarketDataOnly: exchanges.filter(exchange => exchange.status === PHASE3A_ACCOUNT_STATUSES.PUBLIC_MARKET_DATA_ONLY).length,
      unsafePermissions: unsafeCount,
      errors: exchanges.filter(exchange => exchange.status === PHASE3A_ACCOUNT_STATUSES.ERROR).length,
      symbolLimitsLoaded: exchanges.filter(exchange => exchange.symbolTradingRules?.status === 'loaded').length
    },
    nextRecommendedAction: unsafeCount
      ? 'Delete unsafe exchange keys and recreate read-only keys with withdrawals disabled.'
      : authenticatedCount
        ? 'Review the checklist, then prepare sandbox/testnet order tests in locked Phase 3B.'
        : 'Open Exchange Connectors and add read-only API keys to the secure local vault.',
    safetyBoundary: createPhase3SafetyBoundary(),
    generatedAt: new Date().toISOString()
  };
}

function buildPhase3BPreparationPlan({ phase3A = null } = {}) {
  const phase3AReadyVenues = (phase3A?.exchanges || []).filter(exchange => exchange.readyForPhase3BPrereview);

  return {
    title: 'Phase 3B: Sandbox/Testnet Execution Preparation',
    status: 'prepared_locked',
    plainEnglishStatus: 'Phase 3B is designed but not enabled. It will start with sandbox/testnet orders only after owner approval.',
    readyVenueCount: phase3AReadyVenues.length,
    steps: [
      { id: 'sandbox_testnet_order_placement', label: 'Sandbox/testnet order placement', status: 'prepared_not_enabled' },
      { id: 'tiny_live_test_order_approval', label: 'Tiny live test order approval', status: 'locked_future' },
      { id: 'cancel_order', label: 'Cancel order', status: 'prepared_not_enabled' },
      { id: 'order_status_tracking', label: 'Order status tracking', status: 'prepared_not_enabled' },
      { id: 'partial_fill_handling', label: 'Partial fill handling', status: 'prepared_not_enabled' },
      { id: 'position_reconciliation', label: 'Position reconciliation', status: 'prepared_not_enabled' },
      { id: 'duplicate_order_prevention', label: 'Duplicate-order prevention', status: 'designed_in_safety_layer' },
      { id: 'kill_switch_enforcement', label: 'Kill switch enforcement', status: 'designed_in_safety_layer' }
    ],
    blockedUntil: [
      'Phase 3A readiness reviewed by owner.',
      'Sandbox/testnet venue selected.',
      'Risk profile approved for sandbox.',
      'Manual owner approval recorded.',
      'Order endpoint remains absent until a future implementation step.'
    ],
    safetyBoundary: createPhase3SafetyBoundary(),
    orderEndpointImplemented: false,
    sandboxOrdersEnabled: false,
    tinyLiveOrdersEnabled: false,
    generatedAt: new Date().toISOString()
  };
}

function buildPhase3Status({ connectors = [], latestScan = null, accountScan = null } = {}) {
  const capabilityMatrix = PHASE3_RECOMMENDED_EXCHANGES.map(exchange => EXCHANGE_CAPABILITY_MATRIX[exchange]);
  const websocketPlan = buildWebSocketHealthPlan();
  const accountAware = buildAccountAwareArbitrageView({ scan: latestScan, accountScan });
  const phase3A = buildPhase3AReadiness({ connectors, accountScan });

  return {
    title: 'Phase 3: Authenticated Safety Infrastructure',
    status: 'locked_building',
    simpleStatus: 'Authenticated read-only account checks and safety reviews can be built now. Live execution remains locked.',
    nextRecommendedAction: 'Connect read-only exchange keys, scan authenticated account data, then run dry-run order safety review.',
    accountReadiness: {
      activeConnectors: connectors.filter(connector => connector.secret_reference_status === 'configured' || connector.settings?.readOnlyConnection?.connectionStatus === 'read_only_connected').length,
      readOnlyAccountProfiles: accountScan?.totals?.connected || 0,
      withdrawalsVerifiedDisabled: (accountScan?.profiles || []).filter(profile => profile.withdrawalPermission === 'verified_disabled').length,
      phase3AStatus: phase3A.status,
      symbolLimitsLoaded: phase3A.totals.symbolLimitsLoaded,
      unsafePermissions: phase3A.totals.unsafePermissions
    },
    phase3A,
    phase3B: buildPhase3BPreparationPlan({ phase3A }),
    capabilityMatrix,
    websocketPlan,
    universalOrderModel: {
      supportedTypes: UNIVERSAL_ORDER_TYPES,
      dryRunOnly: true,
      liveOrderEndpointImplemented: false,
      requiredFields: ['exchangeName', 'symbol', 'side', 'type', 'notionalUsd or quantity']
    },
    safetyLayer: {
      policy: DEFAULT_LIVE_SAFETY_POLICY,
      globalKillSwitch: 'on_until_future_owner_approval',
      confirmationGates: [
        'manual owner approval',
        'sandbox/testnet first',
        'read-only account verified',
        'withdrawals disabled verified',
        'dry-run proof packet',
        'small-capital test config'
      ]
    },
    operatorDashboard: {
      accountBalances: accountScan?.profiles || [],
      activeConnectors: connectors.map(connector => ({
        id: connector.id,
        exchangeName: connector.settings?.registryId || connector.exchange_name,
        label: connector.label,
        status: connector.status,
        connectionStatus: connector.settings?.readOnlyConnection?.connectionStatus || 'not_connected'
      })),
      websocketHealth: websocketPlan.health,
      liveLatency: websocketPlan.health.map(item => ({ exchangeName: item.exchangeName, liveLatencyMs: item.liveLatencyMs })),
      spreadHeatmap: accountAware.spreadHeatmap,
      opportunityConfidenceScore: accountAware.spreadHeatmap[0]?.confidenceScore || null,
      executionSafetyScore: accountAware.spreadHeatmap[0]?.executionSafetyScore || null
    },
    safetyBoundary: createPhase3SafetyBoundary(),
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  PHASE3_RECOMMENDED_EXCHANGES,
  UNIVERSAL_ORDER_TYPES,
  PHASE3A_ACCOUNT_STATUSES,
  DEFAULT_LIVE_SAFETY_POLICY,
  EXCHANGE_CAPABILITY_MATRIX,
  WEBSOCKET_STREAM_SPECS,
  createPhase3SafetyBoundary,
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
  buildPhase3Status
};
