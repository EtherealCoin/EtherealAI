const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const OWNER_SECRETS_DIR = path.join(os.homedir(), 'EtherealAI_Secrets');
const EXCHANGE_TINY_LIVE_VAULT_PATH = path.join(OWNER_SECRETS_DIR, 'exchange-tiny-live-vault.json');
const EXCHANGE_TINY_LIVE_VAULT_KEY_PATH = path.join(OWNER_SECRETS_DIR, 'exchange-tiny-live-vault.key');
const TINY_LIVE_OWNER_CONFIRMATION_PHRASE = 'I APPROVE ONE TINY LIVE SPOT TEST';

const TINY_LIVE_ORDER_STATUSES = [
  'preview_blocked',
  'preview_ready',
  'approved',
  'submitted',
  'accepted',
  'partially_filled',
  'filled',
  'canceled',
  'rejected',
  'expired',
  'reconciled'
];

const DEFAULT_TINY_LIVE_POLICY = {
  defaultLocked: true,
  manualOnly: true,
  automatedLiveTradingEnabled: false,
  unrestrictedLiveTradingEnabled: false,
  walletSigningEnabled: false,
  withdrawalsEnabled: false,
  leverageEnabled: false,
  marginEnabled: false,
  futuresEnabled: false,
  requireSpotOnly: true,
  requireOneExchange: true,
  requireSandboxEvidence: true,
  requireAuthenticatedAccountReadiness: true,
  requireWithdrawalDisabledVerification: true,
  requireLiveTradingPermissionDetector: true,
  requireManualOwnerConfirmation: true,
  maxOrderSizeUsd: 10,
  absoluteMaxOrderSizeUsd: 10,
  maxDailyLossUsd: 10,
  maxOpenPositions: 1,
  maxSlippagePercent: 0.15,
  maxPriceAgeMs: 2500,
  minLiquidityUsd: 1000,
  duplicateOrderWindowMs: 120000
};

const TINY_LIVE_EXCHANGE_ADAPTERS = {
  binance: {
    exchangeName: 'binance',
    displayName: 'Binance',
    adapterStatus: 'complete',
    liveMode: 'Tiny manual spot test only',
    baseUrl: 'https://api.binance.com',
    docsUrl: 'https://github.com/binance/binance-spot-api-docs',
    orderDocsUrl: 'https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    supportedSymbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc'],
    supportsSpot: true,
    supportsCancel: true,
    supportsOrderStatus: true,
    supportsBalanceReconciliation: true,
    supportsMargin: false,
    supportsFutures: false,
    supportsWalletSigning: false,
    notes: 'First supported tiny live adapter. Spot only, no leverage, no margin, no futures, no withdrawals, one manually approved order at a time.'
  },
  coinbase: {
    exchangeName: 'coinbase',
    displayName: 'Coinbase',
    adapterStatus: 'prepared_locked',
    liveMode: 'Prepared for future Coinbase Advanced/CDP key type',
    baseUrl: 'https://api.coinbase.com',
    docsUrl: 'https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/orders/create-order',
    credentialFields: ['apiKeyOrBearerToken'],
    passphraseRequired: false,
    supportedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
    supportedOrderTypes: ['market', 'limit', 'ioc'],
    supportsSpot: true,
    supportsCancel: true,
    supportsOrderStatus: true,
    supportsBalanceReconciliation: true,
    supportsMargin: false,
    supportsFutures: false,
    supportsWalletSigning: false,
    notes: 'Prepared but locked until the owner selects the exact Coinbase Advanced/CDP API key type and authentication model.'
  },
  kraken: {
    exchangeName: 'kraken',
    displayName: 'Kraken',
    adapterStatus: 'prepared_locked',
    liveMode: 'Prepared for future spot-only Kraken adapter',
    baseUrl: 'https://api.kraken.com',
    docsUrl: 'https://docs.kraken.com/api/docs/rest-api/add-order/',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    supportedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc'],
    supportsSpot: true,
    supportsCancel: true,
    supportsOrderStatus: true,
    supportsBalanceReconciliation: true,
    supportsMargin: false,
    supportsFutures: false,
    supportsWalletSigning: false,
    notes: 'Prepared but locked. Kraken will need exchange-specific validation and cancel/status handling before tiny live mode.'
  },
  okx: {
    exchangeName: 'okx',
    displayName: 'OKX',
    adapterStatus: 'prepared_locked',
    liveMode: 'Prepared after demo evidence',
    baseUrl: 'https://www.okx.com',
    docsUrl: 'https://www.okx.com/docs-v5/en/',
    credentialFields: ['apiKey', 'apiSecret', 'passphrase'],
    passphraseRequired: true,
    supportedSymbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc'],
    supportsSpot: true,
    supportsCancel: true,
    supportsOrderStatus: true,
    supportsBalanceReconciliation: true,
    supportsMargin: false,
    supportsFutures: false,
    supportsWalletSigning: false,
    notes: 'Prepared but locked. OKX tiny live needs a dedicated spot-only production key review after demo evidence.'
  },
  bybit: {
    exchangeName: 'bybit',
    displayName: 'Bybit',
    adapterStatus: 'prepared_locked',
    liveMode: 'Prepared after testnet evidence',
    baseUrl: 'https://api.bybit.com',
    docsUrl: 'https://bybit-exchange.github.io/docs/v5/order/create-order',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    supportedSymbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc'],
    supportsSpot: true,
    supportsCancel: true,
    supportsOrderStatus: true,
    supportsBalanceReconciliation: true,
    supportsMargin: false,
    supportsFutures: false,
    supportsWalletSigning: false,
    notes: 'Prepared but locked. Bybit tiny live needs production spot-only key review after testnet evidence.'
  }
};

function normalizeTinyLiveExchangeName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/_/g, '-');
}

function getTinyLiveAdapter(exchangeName) {
  return TINY_LIVE_EXCHANGE_ADAPTERS[normalizeTinyLiveExchangeName(exchangeName)] || null;
}

function redactValue(value = '') {
  const text = String(value || '');
  if (text.length <= 8) {
    return text ? `${text.slice(0, 2)}...${text.slice(-2)}` : '';
  }
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

async function ensureTinyLiveVaultStorage() {
  await fs.mkdir(OWNER_SECRETS_DIR, { recursive: true, mode: 0o700 });
  await fs.chmod(OWNER_SECRETS_DIR, 0o700).catch(() => {});
}

async function getTinyLiveVaultKey() {
  await ensureTinyLiveVaultStorage();

  try {
    const existing = (await fs.readFile(EXCHANGE_TINY_LIVE_VAULT_KEY_PATH, 'utf8')).trim();
    if (/^[a-f0-9]{64}$/i.test(existing)) {
      return Buffer.from(existing, 'hex');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const key = crypto.randomBytes(32);
  await fs.writeFile(EXCHANGE_TINY_LIVE_VAULT_KEY_PATH, key.toString('hex'), {
    mode: 0o600,
    flag: 'wx'
  }).catch(async error => {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  });
  await fs.chmod(EXCHANGE_TINY_LIVE_VAULT_KEY_PATH, 0o600).catch(() => {});

  return Buffer.from((await fs.readFile(EXCHANGE_TINY_LIVE_VAULT_KEY_PATH, 'utf8')).trim(), 'hex');
}

async function readTinyLiveVaultFile() {
  await ensureTinyLiveVaultStorage();

  try {
    const raw = await fs.readFile(EXCHANGE_TINY_LIVE_VAULT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      entries: {},
      ...parsed,
      entries: parsed.entries || {}
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { version: 1, entries: {} };
    }
    throw error;
  }
}

async function writeTinyLiveVaultFile(vault) {
  await ensureTinyLiveVaultStorage();
  const tmpPath = `${EXCHANGE_TINY_LIVE_VAULT_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(vault, null, 2), { mode: 0o600 });
  await fs.chmod(tmpPath, 0o600).catch(() => {});
  await fs.rename(tmpPath, EXCHANGE_TINY_LIVE_VAULT_PATH);
  await fs.chmod(EXCHANGE_TINY_LIVE_VAULT_PATH, 0o600).catch(() => {});
}

function encryptVaultPayload(referenceName, payload, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(referenceName));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final()
  ]);

  return {
    algorithm: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: encrypted.toString('base64')
  };
}

function decryptVaultPayload(referenceName, encrypted, key) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(encrypted.iv, 'base64'));
  decipher.setAAD(Buffer.from(referenceName));
  decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
    decipher.final()
  ]);
  return JSON.parse(decrypted.toString('utf8'));
}

function getTinyLiveReferenceName({ userId, connectorId, exchangeName }) {
  return `exchange-tiny-live:${userId}:${connectorId}:${normalizeTinyLiveExchangeName(exchangeName)}`;
}

function sanitizeTinyLiveCredentialInput(credentials = {}, adapter = null) {
  const apiKey = String(credentials.apiKey || credentials.apiKeyOrBearerToken || '').trim();
  const apiSecret = String(credentials.apiSecret || '').trim();
  const passphrase = String(credentials.passphrase || '').trim();

  if (!apiKey) {
    throw new Error('Tiny live test API key is required.');
  }

  if (!apiSecret && adapter?.exchangeName !== 'coinbase') {
    throw new Error('Tiny live test API secret is required.');
  }

  if (adapter?.passphraseRequired && !passphrase) {
    throw new Error(`${adapter.displayName} requires a passphrase for this API key.`);
  }

  return { apiKey, apiSecret, passphrase };
}

function sanitizeTinyLivePermissionsChecklist(checklist = {}) {
  const normalized = {
    productionKeyReviewed: Boolean(checklist.productionKeyReviewed),
    spotTradingEnabled: Boolean(checklist.spotTradingEnabled),
    marginDisabled: Boolean(checklist.marginDisabled),
    futuresDisabled: Boolean(checklist.futuresDisabled),
    leverageDisabled: Boolean(checklist.leverageDisabled),
    withdrawalsDisabled: Boolean(checklist.withdrawalsDisabled),
    transferDisabled: Boolean(checklist.transferDisabled ?? checklist.withdrawalsDisabled),
    ipRestrictionReviewed: Boolean(checklist.ipRestrictionReviewed),
    ownerUnderstandsRealMoney: Boolean(checklist.ownerUnderstandsRealMoney),
    ownerUnderstandsOneManualOrderOnly: Boolean(checklist.ownerUnderstandsOneManualOrderOnly)
  };
  const missing = [];

  if (!normalized.productionKeyReviewed) missing.push('confirm this production/live key was intentionally created for one tiny spot test');
  if (!normalized.spotTradingEnabled) missing.push('confirm spot trading permission is enabled');
  if (!normalized.marginDisabled) missing.push('confirm margin trading is disabled');
  if (!normalized.futuresDisabled) missing.push('confirm futures trading is disabled');
  if (!normalized.leverageDisabled) missing.push('confirm leverage is disabled');
  if (!normalized.withdrawalsDisabled) missing.push('confirm withdrawals are disabled');
  if (!normalized.ownerUnderstandsRealMoney) missing.push('confirm this can use real money if all gates pass');
  if (!normalized.ownerUnderstandsOneManualOrderOnly) missing.push('confirm this is one manually approved tiny order only');

  return {
    checklist: normalized,
    missing
  };
}

async function saveTinyLiveVaultCredentials({ referenceName, connector, exchangeName, credentials, permissionsChecklist }) {
  const key = await getTinyLiveVaultKey();
  const vault = await readTinyLiveVaultFile();
  const now = new Date().toISOString();
  const payload = {
    exchangeName: normalizeTinyLiveExchangeName(exchangeName),
    connectorId: connector.id,
    apiKey: credentials.apiKey,
    apiSecret: credentials.apiSecret,
    passphrase: credentials.passphrase || '',
    permissionsChecklist,
    savedAt: now
  };

  vault.entries[referenceName] = {
    referenceName,
    exchangeName: payload.exchangeName,
    connectorId: connector.id,
    encrypted: encryptVaultPayload(referenceName, payload, key),
    metadata: {
      apiKeyFingerprint: redactValue(credentials.apiKey),
      hasExtraPhrase: Boolean(credentials.passphrase),
      permissionsChecklist,
      rotatedAt: now,
      manualTinyLiveOnly: true,
      automatedLiveTradingEnabled: false,
      unrestrictedLiveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      leverageEnabled: false,
      marginEnabled: false,
      futuresEnabled: false
    }
  };

  await writeTinyLiveVaultFile(vault);

  return {
    referenceName,
    exchangeName: payload.exchangeName,
    connectorId: connector.id,
    stored: true,
    apiKeyFingerprint: redactValue(credentials.apiKey),
    hasExtraPhrase: Boolean(credentials.passphrase),
    rotatedAt: now,
    secretValuesReturned: false,
    vaultPath: EXCHANGE_TINY_LIVE_VAULT_PATH
  };
}

async function loadTinyLiveVaultCredentials(referenceName) {
  const key = await getTinyLiveVaultKey();
  const vault = await readTinyLiveVaultFile();
  const entry = vault.entries[referenceName];

  if (!entry) {
    return null;
  }

  return decryptVaultPayload(referenceName, entry.encrypted, key);
}

async function deleteTinyLiveVaultCredentials(referenceName) {
  const vault = await readTinyLiveVaultFile();
  const existed = Boolean(vault.entries[referenceName]);

  if (existed) {
    delete vault.entries[referenceName];
    await writeTinyLiveVaultFile(vault);
  }

  return { deleted: existed, referenceName };
}

async function getTinyLiveVaultStatus(referenceName = null) {
  const vault = await readTinyLiveVaultFile();
  const entries = referenceName
    ? Object.values(vault.entries).filter(entry => entry.referenceName === referenceName)
    : Object.values(vault.entries);

  return {
    vaultPath: EXCHANGE_TINY_LIVE_VAULT_PATH,
    exists: entries.length > 0,
    count: entries.length,
    entries: entries.map(entry => ({
      referenceName: entry.referenceName,
      exchangeName: entry.exchangeName,
      connectorId: entry.connectorId,
      metadata: {
        ...entry.metadata,
        secretValuesReturned: false
      }
    })),
    secretValuesReturned: false
  };
}

function normalizeTinyLiveSymbol(exchangeName, symbol = 'BTC/USDT') {
  const raw = String(symbol || 'BTC/USDT').trim().toUpperCase().replace('-', '/');
  const [base = 'BTC', quote = 'USDT'] = raw.split('/');
  const canonical = `${base}/${quote}`;
  const exchange = normalizeTinyLiveExchangeName(exchangeName);

  if (exchange === 'coinbase') {
    return { canonical: `${base}/${quote === 'USDT' ? 'USD' : quote}`, exchangeSymbol: `${base}-${quote === 'USDT' ? 'USD' : quote}` };
  }

  if (exchange === 'kraken') {
    return { canonical, exchangeSymbol: `${base === 'BTC' ? 'XBT' : base}/${quote}` };
  }

  if (exchange === 'okx') {
    return { canonical, exchangeSymbol: `${base}-${quote}` };
  }

  return { canonical, exchangeSymbol: `${base}${quote}` };
}

function normalizeTinyLiveOrderDraft(input = {}) {
  const exchangeName = normalizeTinyLiveExchangeName(input.exchangeName || input.exchange || 'binance');
  const adapter = getTinyLiveAdapter(exchangeName);
  const symbol = normalizeTinyLiveSymbol(exchangeName, input.symbol || 'BTC/USDT');
  const requestedOrderType = String(input.orderType || input.type || 'limit').trim().toLowerCase().replace('-', '_');
  const supportedTypes = ['market', 'limit', 'post_only', 'ioc'];
  const orderType = supportedTypes.includes(requestedOrderType) ? requestedOrderType : 'limit';
  const side = String(input.side || 'buy').trim().toLowerCase() === 'sell' ? 'sell' : 'buy';
  const quantity = Math.max(0, Number(input.quantity || input.baseSize || 0));
  const limitPrice = Number(input.limitPrice || input.price || 0);
  const quoteSize = Math.max(0, Number(input.quoteSize || input.notionalUsd || 0));
  const notionalUsd = quoteSize > 0
    ? quoteSize
    : quantity > 0 && limitPrice > 0
      ? quantity * limitPrice
      : Math.max(0, Number(input.notionalUsd || input.maxTestOrderUsd || 0));
  const maxTestOrderUsd = Math.max(0, Number(input.maxTestOrderUsd || notionalUsd || DEFAULT_TINY_LIVE_POLICY.maxOrderSizeUsd));
  const clientOrderId = String(input.clientOrderId || `ethlive${crypto.randomBytes(8).toString('hex')}`)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);

  return {
    exchangeName,
    displayName: adapter?.displayName || exchangeName,
    symbol: symbol.canonical,
    exchangeSymbol: symbol.exchangeSymbol,
    side,
    orderType,
    quantity,
    limitPrice: Number.isFinite(limitPrice) ? limitPrice : 0,
    quoteSize,
    notionalUsd,
    maxTestOrderUsd,
    clientOrderId,
    marketType: 'spot',
    leverage: 1,
    marginEnabled: false,
    futuresEnabled: false,
    walletSigningEnabled: false,
    automated: false
  };
}

function createTinyLiveOrderFingerprint(order = {}) {
  return [
    'tiny_live',
    order.exchangeName,
    order.symbol,
    order.side,
    order.orderType,
    Number(order.quantity || 0).toFixed(12),
    Number(order.limitPrice || 0).toFixed(8),
    Number(order.notionalUsd || 0).toFixed(2)
  ].join(':');
}

function signedQueryString(params, secret) {
  const query = new URLSearchParams(params).toString();
  const signature = crypto.createHmac('sha256', secret).update(query).digest('hex');
  return `${query}&signature=${signature}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(Number(options.timeoutMs || 12000))
  });
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : {};
  } catch (error) {
    body = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(body?.msg || body?.retMsg || body?.message || body?.raw || `HTTP ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

function mapBinanceOrderType(order) {
  if (order.orderType === 'market') return { type: 'MARKET' };
  if (order.orderType === 'post_only') return { type: 'LIMIT_MAKER' };
  if (order.orderType === 'ioc') return { type: 'LIMIT', timeInForce: 'IOC' };
  return { type: 'LIMIT', timeInForce: 'GTC' };
}

async function detectBinanceTinyLivePermissions({ credentials, adapter }) {
  const signed = signedQueryString({
    timestamp: Date.now(),
    recvWindow: 5000
  }, credentials.apiSecret);
  const account = await fetchJson(`${adapter.baseUrl}/api/v3/account?${signed}`, {
    headers: { 'X-MBX-APIKEY': credentials.apiKey }
  });
  const permissions = Array.isArray(account.permissions) ? account.permissions : [];
  const canTrade = account.canTrade === true;
  const canWithdraw = account.canWithdraw === true;
  const spotAllowed = permissions.length === 0 || permissions.includes('SPOT');
  const marginDetected = permissions.includes('MARGIN');
  const futuresDetected = permissions.some(permission => /FUTURES|UMFUTURE|CMFUTURE/i.test(permission));

  return {
    status: 'permissions_verified',
    exchangeName: 'binance',
    canTrade,
    canWithdraw,
    spotAllowed,
    marginDetected,
    futuresDetected,
    accountType: account.accountType || 'unknown',
    nonZeroBalances: (account.balances || [])
      .filter(item => Number(item.free || 0) > 0 || Number(item.locked || 0) > 0)
      .slice(0, 12)
      .map(item => ({
        asset: item.asset,
        free: Number(item.free || 0),
        locked: Number(item.locked || 0)
      })),
    plainEnglishStatus: canTrade && !canWithdraw && spotAllowed && !marginDetected && !futuresDetected
      ? 'Binance reports spot trading available and withdrawals disabled for this key.'
      : 'Binance permission detector is not safe for tiny live mode yet. Review canTrade, withdrawal, spot, margin, and futures signals.'
  };
}

async function detectTinyLivePermissions({ credentials, adapter }) {
  if (!credentials || !adapter || adapter.adapterStatus !== 'complete') {
    return {
      status: 'not_verified',
      plainEnglishStatus: 'Tiny live credentials are not saved or this exchange is not supported for live permission detection yet.'
    };
  }

  if (adapter.exchangeName === 'binance') {
    return detectBinanceTinyLivePermissions({ credentials, adapter });
  }

  return {
    status: 'prepared_locked',
    plainEnglishStatus: `${adapter.displayName} live permission detector is prepared but not complete yet.`
  };
}

function createTinyLiveSafetyBoundary(passed = false) {
  return {
    tinyLiveManualTestImplemented: true,
    tinyLiveManualTestReady: Boolean(passed),
    tinyLiveOrdersEnabled: Boolean(passed),
    automatedLiveTradingEnabled: false,
    unrestrictedLiveTradingEnabled: false,
    walletSigningEnabled: false,
    withdrawalsEnabled: false,
    marginEnabled: false,
    futuresEnabled: false,
    leverageEnabled: false,
    oneManualOrderOnly: true
  };
}

function evaluateTinyLiveOrderSafety({
  order,
  adapter = null,
  connector = null,
  credentials = null,
  livePermission = null,
  readOnlyProfile = null,
  riskProfile = null,
  sandboxEvidence = [],
  marketContext = {},
  recentOrderFingerprints = [],
  ownerConfirmation = '',
  policy = {}
}) {
  const effectivePolicy = { ...DEFAULT_TINY_LIVE_POLICY, ...(policy || {}) };
  const checks = [];
  const addCheck = (id, label, passed, note, nextAction = '') => {
    checks.push({
      id,
      label,
      passed: Boolean(passed),
      status: passed ? 'complete' : 'blocked',
      note,
      nextAction
    });
  };
  const permissions = credentials?.permissionsChecklist || {};
  const orderFingerprint = createTinyLiveOrderFingerprint(order);
  const orderNotional = Number(order.notionalUsd || (order.quantity * order.limitPrice) || 0);
  const requestedMax = Number(order.maxTestOrderUsd || effectivePolicy.maxOrderSizeUsd || 0);
  const hardMax = Math.min(
    Number(effectivePolicy.absoluteMaxOrderSizeUsd || 0),
    Number(effectivePolicy.maxOrderSizeUsd || 0),
    requestedMax > 0 ? requestedMax : Number(effectivePolicy.maxOrderSizeUsd || 0),
    Number(riskProfile?.max_order_value || effectivePolicy.maxOrderSizeUsd || 0)
  );
  const maxDailyLoss = Number(riskProfile?.max_daily_loss || effectivePolicy.maxDailyLossUsd || 0);
  const slippagePercent = Number(marketContext.slippagePercent ?? 0.05);
  const liquidityUsd = Number(marketContext.liquidityUsd ?? 1000000);
  const priceTimestamp = marketContext.priceTimestamp ? Date.parse(marketContext.priceTimestamp) : Date.now();
  const priceAgeMs = Date.now() - priceTimestamp;
  const hasSuccessfulSandbox = sandboxEvidence.some(test => (
    test.exchange_name === order.exchangeName
      && ['accepted', 'filled', 'canceled', 'reconciled'].includes(String(test.status || '').toLowerCase())
  ));
  const phase3AReady = readOnlyProfile?.status === 'read_only_account_connected'
    || livePermission?.status === 'permissions_verified';

  addCheck(
    'adapter_complete',
    'Exchange tiny live adapter is complete',
    adapter?.adapterStatus === 'complete',
    adapter?.adapterStatus === 'complete'
      ? `${adapter.displayName} is available for the first tiny manual spot test.`
      : `${adapter?.displayName || order.exchangeName} is not live-enabled yet.`,
    'Choose Binance for the first implemented tiny live test path.'
  );
  addCheck(
    'single_exchange_spot_only',
    'One exchange, spot only',
    order.marketType === 'spot'
      && order.leverage === 1
      && order.marginEnabled === false
      && order.futuresEnabled === false
      && adapter?.supportsSpot === true,
    'This test is restricted to spot trading with no leverage, margin, futures, or wallet signing.',
    'Use spot only.'
  );
  addCheck(
    'connector_exists',
    'Exchange connector exists',
    Boolean(connector?.id),
    connector?.id ? `${connector.label || adapter?.displayName || order.exchangeName} connector exists.` : 'No connector exists for this exchange.',
    'Create the exchange connector placeholder first.'
  );
  addCheck(
    'tiny_live_credentials',
    'Tiny live API key is saved in the local vault',
    Boolean(credentials?.apiKey && (credentials?.apiSecret || adapter?.exchangeName === 'coinbase')),
    credentials?.apiKey
      ? 'Tiny live credentials were loaded from the encrypted local vault. Secret values were not returned to the UI.'
      : 'No tiny live API key is saved for this connector.',
    'Save a tiny live spot API key through the local vault panel.'
  );
  addCheck(
    'phase3a_account_readiness',
    'Authenticated account readiness exists',
    phase3AReady,
    phase3AReady
      ? 'Authenticated account visibility is available through Phase 3A or the tiny-live permission detector.'
      : 'Authenticated account readiness has not passed for this exchange.',
    'Run Phase 3A authenticated account readiness or verify tiny-live account permissions.'
  );
  addCheck(
    'sandbox_evidence',
    'Sandbox/testnet evidence exists',
    !effectivePolicy.requireSandboxEvidence || hasSuccessfulSandbox,
    hasSuccessfulSandbox
      ? 'A prior sandbox/testnet lifecycle completed for this exchange.'
      : 'No successful sandbox/testnet lifecycle exists for this exchange yet.',
    'Run a sandbox/testnet order lifecycle first.'
  );
  addCheck(
    'live_trading_permission',
    'Spot trading permission detected',
    permissions.spotTradingEnabled === true && livePermission?.canTrade === true && livePermission?.spotAllowed === true,
    livePermission?.plainEnglishStatus || 'Spot trading permission has not been verified.',
    'Verify the tiny live key has spot trading enabled and no other trading modes.'
  );
  addCheck(
    'withdrawals_disabled',
    'Withdrawals are disabled',
    permissions.withdrawalsDisabled === true && livePermission?.canWithdraw === false,
    livePermission?.canWithdraw === false
      ? 'Exchange permission detector reports withdrawals disabled.'
      : 'Withdrawal-disabled verification has not passed.',
    'Disable withdrawals on the exchange API key and verify again.'
  );
  addCheck(
    'no_margin_futures_leverage',
    'No leverage, margin, or futures',
    permissions.marginDisabled === true
      && permissions.futuresDisabled === true
      && permissions.leverageDisabled === true
      && livePermission?.marginDetected !== true
      && livePermission?.futuresDetected !== true,
    'The tiny live test must remain spot-only with no leverage, no margin, and no futures.',
    'Disable margin/futures/leverage permissions before continuing.'
  );
  addCheck(
    'risk_profile_active',
    'Risk profile active',
    Boolean(riskProfile?.id) && riskProfile?.status === 'active',
    riskProfile?.id ? 'Active risk profile found.' : 'No active risk profile exists.',
    'Activate a risk profile before any tiny live test.'
  );
  addCheck(
    'kill_switch_off',
    'Kill switch is off for the tiny test',
    Boolean(riskProfile?.id) && Number(riskProfile?.kill_switch_enabled || 0) === 0,
    Number(riskProfile?.kill_switch_enabled || 0) === 0
      ? 'Kill switch is off for this manually approved test.'
      : 'Kill switch is on.',
    'Turn the kill switch off only when you are ready for the tiny manual test.'
  );
  addCheck(
    'max_order_size',
    'Order amount is tiny',
    orderNotional > 0 && hardMax > 0 && orderNotional <= hardMax,
    `Requested tiny live order value is about $${orderNotional.toFixed(2)}. Hard maximum is $${hardMax.toFixed(2)}.`,
    'Lower the max test order amount.'
  );
  addCheck(
    'max_daily_loss',
    'Daily loss cap exists',
    maxDailyLoss > 0 && maxDailyLoss <= Number(effectivePolicy.maxDailyLossUsd || 0),
    maxDailyLoss > 0
      ? `Daily loss cap is $${maxDailyLoss.toFixed(2)}. Tiny live policy maximum is $${Number(effectivePolicy.maxDailyLossUsd || 0).toFixed(2)}.`
      : 'No daily loss cap exists.',
    'Use a tiny live risk profile with a daily loss cap at or below the tiny-live policy.'
  );
  addCheck(
    'stale_price_check',
    'Price is fresh',
    priceAgeMs <= Number(effectivePolicy.maxPriceAgeMs || 0),
    `Price age is ${Math.max(0, priceAgeMs)}ms. Limit is ${Number(effectivePolicy.maxPriceAgeMs || 0)}ms.`,
    'Refresh market data and preview again.'
  );
  addCheck(
    'liquidity_check',
    'Liquidity check passed',
    liquidityUsd >= Number(effectivePolicy.minLiquidityUsd || 0),
    `Estimated liquidity is $${liquidityUsd.toFixed(2)}. Minimum is $${Number(effectivePolicy.minLiquidityUsd || 0).toFixed(2)}.`,
    'Use a liquid spot pair such as BTC/USDT.'
  );
  addCheck(
    'slippage_guard',
    'Slippage guard passed',
    slippagePercent <= Number(effectivePolicy.maxSlippagePercent || 0),
    `Estimated slippage is ${slippagePercent}%. Limit is ${Number(effectivePolicy.maxSlippagePercent || 0)}%.`,
    'Lower slippage or use a more liquid pair.'
  );
  addCheck(
    'duplicate_order_prevention',
    'Duplicate order prevention passed',
    !recentOrderFingerprints.includes(orderFingerprint),
    recentOrderFingerprints.includes(orderFingerprint)
      ? 'An identical tiny live order was already attempted recently.'
      : 'No duplicate tiny live order fingerprint was found.',
    'Change the order or wait before retrying.'
  );
  addCheck(
    'manual_owner_confirmation',
    'Manual owner confirmation typed',
    String(ownerConfirmation || '').trim() === TINY_LIVE_OWNER_CONFIRMATION_PHRASE,
    String(ownerConfirmation || '').trim() === TINY_LIVE_OWNER_CONFIRMATION_PHRASE
      ? 'Owner typed the required confirmation phrase.'
      : `Type exactly: ${TINY_LIVE_OWNER_CONFIRMATION_PHRASE}`,
    'Type the exact confirmation phrase before placing the tiny live order.'
  );
  addCheck(
    'automation_locked',
    'Automated live trading stays disabled',
    effectivePolicy.automatedLiveTradingEnabled === false
      && effectivePolicy.unrestrictedLiveTradingEnabled === false
      && effectivePolicy.walletSigningEnabled === false
      && effectivePolicy.withdrawalsEnabled === false,
    'Only one manual tiny spot test can be attempted. Automation, wallet signing, and withdrawals stay disabled.',
    'No action needed.'
  );

  const passed = checks.every(check => check.passed);

  return {
    passed,
    status: passed ? 'ready_for_one_tiny_live_order' : 'locked',
    safeToTest: passed,
    checks,
    orderFingerprint,
    missing: checks.filter(check => !check.passed),
    nextClick: passed
      ? 'Click Place One Tiny Live Order.'
      : checks.find(check => !check.passed)?.nextAction || 'Fix the blocked safety gate.',
    plainEnglishStatus: passed
      ? 'Safe to test one manually approved tiny spot order. Automated live trading remains disabled.'
      : 'Not safe to test yet. Live trading remains locked until every gate passes.',
    safetyBoundary: createTinyLiveSafetyBoundary(passed)
  };
}

function createTinyLiveOrderPreview({ order, safety, adapter = null, livePermission = null }) {
  return {
    exchange: adapter?.displayName || order.displayName,
    symbol: order.symbol,
    exchangeSymbol: order.exchangeSymbol,
    side: order.side,
    orderType: order.orderType,
    marketType: 'spot',
    notionalUsd: order.notionalUsd,
    maxTestOrderUsd: order.maxTestOrderUsd,
    quantity: order.quantity,
    limitPrice: order.limitPrice || null,
    clientOrderId: order.clientOrderId,
    orderFingerprint: safety.orderFingerprint,
    safeToTest: safety.safeToTest,
    status: safety.status,
    nextClick: safety.nextClick,
    livePermission: livePermission
      ? {
        status: livePermission.status,
        canTrade: livePermission.canTrade,
        canWithdraw: livePermission.canWithdraw,
        spotAllowed: livePermission.spotAllowed,
        marginDetected: livePermission.marginDetected,
        futuresDetected: livePermission.futuresDetected,
        plainEnglishStatus: livePermission.plainEnglishStatus
      }
      : null,
    warning: 'This is the only path that may place one tiny real spot order after all gates pass and owner confirmation is typed.'
  };
}

async function getBinanceBalances({ credentials, adapter }) {
  const signed = signedQueryString({
    timestamp: Date.now(),
    recvWindow: 5000
  }, credentials.apiSecret);
  const account = await fetchJson(`${adapter.baseUrl}/api/v3/account?${signed}`, {
    headers: { 'X-MBX-APIKEY': credentials.apiKey }
  });

  return (account.balances || [])
    .filter(item => Number(item.free || 0) > 0 || Number(item.locked || 0) > 0)
    .slice(0, 25)
    .map(item => ({
      asset: item.asset,
      free: Number(item.free || 0),
      locked: Number(item.locked || 0)
    }));
}

async function submitBinanceTinyLiveOrder({ order, credentials, adapter }) {
  const mapped = mapBinanceOrderType(order);
  const params = {
    symbol: order.exchangeSymbol,
    side: order.side.toUpperCase(),
    type: mapped.type,
    newClientOrderId: order.clientOrderId,
    timestamp: Date.now(),
    recvWindow: 5000,
    newOrderRespType: 'RESULT'
  };

  if (mapped.timeInForce) params.timeInForce = mapped.timeInForce;
  if (order.quantity > 0) params.quantity = String(order.quantity);
  if (order.orderType !== 'market' && order.limitPrice > 0) params.price = String(order.limitPrice);
  if (order.orderType === 'market' && order.quoteSize > 0) params.quoteOrderQty = String(order.quoteSize);

  const beforeBalances = await getBinanceBalances({ credentials, adapter });
  const signed = signedQueryString(params, credentials.apiSecret);
  const placed = await fetchJson(`${adapter.baseUrl}/api/v3/order?${signed}`, {
    method: 'POST',
    headers: { 'X-MBX-APIKEY': credentials.apiKey }
  });
  const orderId = placed.orderId ? String(placed.orderId) : '';
  const status = orderId
    ? await queryBinanceTinyLiveOrderStatus({ order, credentials, adapter, exchangeOrderId: orderId })
    : placed;
  const afterBalances = await getBinanceBalances({ credentials, adapter }).catch(() => []);

  return {
    status: normalizeTinyLiveLifecycleStatus(status.status || placed.status || 'submitted'),
    exchangeOrderId: orderId,
    placed,
    orderStatus: status,
    reconciliation: {
      beforeBalances,
      afterBalances,
      status: afterBalances.length ? 'balances_reconciled' : 'balance_reconciliation_unavailable'
    },
    resultScreen: {
      exchange: adapter.displayName,
      symbol: order.symbol,
      orderType: order.orderType,
      notionalUsd: order.notionalUsd,
      entryPrice: order.limitPrice || placed.price || null,
      fillStatus: normalizeTinyLiveLifecycleStatus(status.status || placed.status || 'submitted'),
      fees: 0,
      exchangeOrderId: orderId,
      rejectionReason: ''
    },
    safetyBoundary: createTinyLiveSafetyBoundary(true)
  };
}

async function queryBinanceTinyLiveOrderStatus({ order, credentials, adapter, exchangeOrderId = '' }) {
  const signed = signedQueryString({
    symbol: order.exchangeSymbol,
    ...(exchangeOrderId ? { orderId: exchangeOrderId } : { origClientOrderId: order.clientOrderId }),
    timestamp: Date.now(),
    recvWindow: 5000
  }, credentials.apiSecret);

  return fetchJson(`${adapter.baseUrl}/api/v3/order?${signed}`, {
    headers: { 'X-MBX-APIKEY': credentials.apiKey }
  });
}

async function cancelBinanceTinyLiveOrder({ order, credentials, adapter, exchangeOrderId = '' }) {
  const signed = signedQueryString({
    symbol: order.exchangeSymbol,
    ...(exchangeOrderId ? { orderId: exchangeOrderId } : { origClientOrderId: order.clientOrderId }),
    timestamp: Date.now(),
    recvWindow: 5000
  }, credentials.apiSecret);

  return fetchJson(`${adapter.baseUrl}/api/v3/order?${signed}`, {
    method: 'DELETE',
    headers: { 'X-MBX-APIKEY': credentials.apiKey }
  });
}

function normalizeTinyLiveLifecycleStatus(rawStatus) {
  const status = String(rawStatus || '').trim().toLowerCase();
  if (['new', 'open', 'accepted'].includes(status)) return 'accepted';
  if (['partially_filled', 'partially-filled', 'partiallyfilled'].includes(status)) return 'partially_filled';
  if (status === 'filled') return 'filled';
  if (['canceled', 'cancelled'].includes(status)) return 'canceled';
  if (status === 'expired') return 'expired';
  if (['rejected', 'failed'].includes(status)) return 'rejected';
  return status || 'submitted';
}

async function runTinyLiveOrderLifecycle({ order, credentials, adapter }) {
  if (!adapter || adapter.adapterStatus !== 'complete') {
    throw new Error(`${adapter?.displayName || order.exchangeName} is not enabled for tiny live test orders yet.`);
  }

  if (adapter.exchangeName === 'binance') {
    return submitBinanceTinyLiveOrder({ order, credentials, adapter });
  }

  throw new Error(`${adapter.displayName} tiny live adapter is prepared but still locked.`);
}

async function cancelTinyLiveOrder({ order, credentials, adapter, exchangeOrderId }) {
  if (adapter?.exchangeName === 'binance') {
    const canceled = await cancelBinanceTinyLiveOrder({ order, credentials, adapter, exchangeOrderId });
    return {
      status: normalizeTinyLiveLifecycleStatus(canceled.status || 'canceled'),
      canceled,
      resultScreen: {
        exchange: adapter.displayName,
        symbol: order.symbol,
        orderType: order.orderType,
        notionalUsd: order.notionalUsd,
        fillStatus: normalizeTinyLiveLifecycleStatus(canceled.status || 'canceled'),
        exchangeOrderId: String(canceled.orderId || exchangeOrderId || ''),
        rejectionReason: ''
      },
      safetyBoundary: createTinyLiveSafetyBoundary(false)
    };
  }

  throw new Error(`${adapter?.displayName || order.exchangeName} cancel adapter is not enabled yet.`);
}

async function getTinyLiveOrderStatus({ order, credentials, adapter, exchangeOrderId }) {
  if (adapter?.exchangeName === 'binance') {
    const status = await queryBinanceTinyLiveOrderStatus({ order, credentials, adapter, exchangeOrderId });
    const afterBalances = await getBinanceBalances({ credentials, adapter }).catch(() => []);
    return {
      status: normalizeTinyLiveLifecycleStatus(status.status || 'submitted'),
      orderStatus: status,
      reconciliation: {
        afterBalances,
        status: afterBalances.length ? 'balances_reconciled' : 'balance_reconciliation_unavailable'
      },
      resultScreen: {
        exchange: adapter.displayName,
        symbol: order.symbol,
        orderType: order.orderType,
        notionalUsd: order.notionalUsd,
        fillStatus: normalizeTinyLiveLifecycleStatus(status.status || 'submitted'),
        exchangeOrderId: String(status.orderId || exchangeOrderId || ''),
        rejectionReason: ''
      },
      safetyBoundary: createTinyLiveSafetyBoundary(false)
    };
  }

  throw new Error(`${adapter?.displayName || order.exchangeName} status adapter is not enabled yet.`);
}

function buildTinyLiveApprovalCenter({
  connectors = [],
  vaultStatus = null,
  latestSandboxTests = [],
  latestTinyLiveOrders = [],
  riskProfile = null,
  exchangeReadiness = {}
} = {}) {
  const connectorByExchange = connectors.reduce((acc, connector) => {
    const exchangeName = normalizeTinyLiveExchangeName(connector.settings?.registryId || connector.exchange_name);
    if (!acc[exchangeName]) acc[exchangeName] = connector;
    return acc;
  }, {});
  const credentialReferences = new Set((vaultStatus?.entries || []).map(entry => entry.exchangeName));
  const exchanges = Object.values(TINY_LIVE_EXCHANGE_ADAPTERS).map(adapter => {
    const connector = connectorByExchange[adapter.exchangeName] || null;
    const sandboxComplete = latestSandboxTests.some(test => (
      test.exchange_name === adapter.exchangeName
        && ['accepted', 'filled', 'canceled', 'reconciled'].includes(String(test.status || '').toLowerCase())
    ));
    const livePermission = exchangeReadiness[adapter.exchangeName] || null;
    const ready = adapter.adapterStatus === 'complete'
      && Boolean(connector)
      && credentialReferences.has(adapter.exchangeName)
      && sandboxComplete
      && livePermission?.canTrade === true
      && livePermission?.canWithdraw === false
      && Boolean(riskProfile?.id)
      && Number(riskProfile?.kill_switch_enabled || 0) === 0;

    return {
      exchangeName: adapter.exchangeName,
      displayName: adapter.displayName,
      adapterStatus: adapter.adapterStatus,
      liveMode: adapter.liveMode,
      connectorId: connector?.id || null,
      connectorExists: Boolean(connector),
      tinyLiveCredentialsSaved: credentialReferences.has(adapter.exchangeName),
      sandboxComplete,
      livePermissionStatus: livePermission?.status || 'not_verified',
      canTrade: livePermission?.canTrade === true,
      withdrawalsDisabled: livePermission?.canWithdraw === false,
      ready,
      status: ready ? 'Safe to test' : 'Not safe to test',
      why: ready
        ? 'Every high-level gate is ready for one manual tiny spot test.'
        : adapter.adapterStatus !== 'complete'
          ? 'This exchange is not implemented for tiny live mode yet.'
          : !credentialReferences.has(adapter.exchangeName)
            ? 'Tiny live API key is missing.'
            : !sandboxComplete
              ? 'Successful sandbox/testnet evidence is missing.'
              : 'One or more safety gates still need review.',
      nextButton: ready ? 'Preview Tiny Live Order' : 'Review Missing Gates'
    };
  });
  const readyExchange = exchanges.find(exchange => exchange.ready) || null;

  return {
    title: 'Phase 3C: Tiny Live Test Approval Center',
    status: readyExchange ? 'safe_to_test_one_manual_order' : 'locked',
    safeToTest: Boolean(readyExchange),
    defaultLocked: true,
    readyExchange,
    exchanges,
    latestTinyLiveOrders,
    policy: DEFAULT_TINY_LIVE_POLICY,
    approvalPhrase: TINY_LIVE_OWNER_CONFIRMATION_PHRASE,
    nextRecommendedAction: readyExchange
      ? 'Preview the tiny live order, read the warning, type the confirmation phrase, then place one order manually.'
      : 'Review missing gates. Live trading remains locked.',
    safetyBoundary: createTinyLiveSafetyBoundary(Boolean(readyExchange))
  };
}

function createPlainEnglishTinyLiveError(exchangeName, error) {
  const rawMessage = String(error?.message || error || '').slice(0, 500);
  const lower = rawMessage.toLowerCase();
  const displayName = getTinyLiveAdapter(exchangeName)?.displayName || exchangeName;

  if (/401|403|unauthorized|forbidden|permission|denied|invalid api/.test(lower)) {
    return `${displayName} rejected the tiny live key or permission. Confirm the key has spot trading only, withdrawals disabled, and no margin/futures/leverage. Automated live trading and wallet signing remain disabled.`;
  }

  if (/insufficient|balance|fund/.test(lower)) {
    return `${displayName} reports insufficient available spot balance for the tiny live order. Lower the amount or fund the spot account.`;
  }

  if (/filter|min|lot|size|precision|notional/.test(lower)) {
    return `${displayName} rejected the tiny live order size or price. Use a liquid pair and adjust quantity/price to meet exchange symbol rules.`;
  }

  if (/timeout|network|fetch failed|enotfound|econn|abort/.test(lower)) {
    return `${displayName} could not be reached from this Mac. Check internet/VPN/firewall, then retry.`;
  }

  return `${displayName} tiny live test failed: ${rawMessage || 'unknown error'}. Automated live trading, wallet signing, and withdrawals remain disabled.`;
}

module.exports = {
  EXCHANGE_TINY_LIVE_VAULT_PATH,
  TINY_LIVE_OWNER_CONFIRMATION_PHRASE,
  TINY_LIVE_ORDER_STATUSES,
  DEFAULT_TINY_LIVE_POLICY,
  TINY_LIVE_EXCHANGE_ADAPTERS,
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
  createPlainEnglishTinyLiveError
};
