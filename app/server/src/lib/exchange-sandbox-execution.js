const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const OWNER_SECRETS_DIR = path.join(os.homedir(), 'EtherealAI_Secrets');
const EXCHANGE_SANDBOX_VAULT_PATH = path.join(OWNER_SECRETS_DIR, 'exchange-sandbox-vault.json');
const EXCHANGE_SANDBOX_VAULT_KEY_PATH = path.join(OWNER_SECRETS_DIR, 'exchange-sandbox-vault.key');

const SANDBOX_ORDER_LIFECYCLE_STATUSES = [
  'created',
  'submitted',
  'accepted',
  'partially_filled',
  'filled',
  'canceled',
  'rejected',
  'expired'
];

const SANDBOX_ORDER_TYPES = [
  'market',
  'limit',
  'post_only',
  'ioc',
  'reduce_only'
];

const DEFAULT_SANDBOX_POLICY = {
  maxOrderSizeUsd: 25,
  maxDailyLossUsd: 50,
  maxSlippagePercent: 0.25,
  maxPriceAgeMs: 5000,
  minLiquidityUsd: 500,
  duplicateOrderWindowMs: 60000,
  requireSandboxCredentials: true,
  requireWithdrawalsDisabled: true,
  requireProductionKeyNotUsed: true,
  productionLiveTradingEnabled: false,
  productionOrderEndpointEnabled: false,
  walletSigningEnabled: false,
  withdrawalsEnabled: false
};

const SANDBOX_EXCHANGE_ADAPTERS = {
  binance: {
    exchangeName: 'binance',
    displayName: 'Binance',
    adapterStatus: 'complete',
    sandboxMode: 'Spot Testnet',
    baseUrl: 'https://testnet.binance.vision',
    docsUrl: 'https://developers.binance.com/docs/binance-spot-api-docs/testnet',
    orderDocsUrl: 'https://developers.binance.com/docs/binance-spot-api-docs/rest-api/trading-endpoints',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc'],
    supportsCancel: true,
    supportsOrderStatus: true,
    supportsReduceOnly: false,
    supportsPostOnly: true,
    supportsIoc: true,
    productionEndpointBlocked: true,
    notes: 'Uses Binance Spot Testnet endpoints only. Production Binance order endpoints are not exposed by this adapter.'
  },
  okx: {
    exchangeName: 'okx',
    displayName: 'OKX',
    adapterStatus: 'complete',
    sandboxMode: 'Demo Trading',
    baseUrl: 'https://www.okx.com',
    docsUrl: 'https://www.okx.com/docs-v5/en/',
    orderDocsUrl: 'https://www.okx.com/docs-v5/en/#order-book-trading-trade-post-place-order',
    credentialFields: ['apiKey', 'apiSecret', 'passphrase'],
    passphraseRequired: true,
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc', 'reduce_only'],
    supportsCancel: true,
    supportsOrderStatus: true,
    supportsReduceOnly: true,
    supportsPostOnly: true,
    supportsIoc: true,
    productionEndpointBlocked: true,
    notes: 'Uses OKX Demo Trading by sending x-simulated-trading: 1 on every request.'
  },
  bybit: {
    exchangeName: 'bybit',
    displayName: 'Bybit',
    adapterStatus: 'complete',
    sandboxMode: 'Testnet',
    baseUrl: 'https://api-testnet.bybit.com',
    docsUrl: 'https://bybit-exchange.github.io/docs/v5/order/create-order',
    orderDocsUrl: 'https://bybit-exchange.github.io/docs/v5/order/create-order',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc', 'reduce_only'],
    supportsCancel: true,
    supportsOrderStatus: true,
    supportsReduceOnly: true,
    supportsPostOnly: true,
    supportsIoc: true,
    productionEndpointBlocked: true,
    notes: 'Uses Bybit testnet REST endpoints only. Production Bybit order endpoints are not exposed by this adapter.'
  },
  kraken: {
    exchangeName: 'kraken',
    displayName: 'Kraken',
    adapterStatus: 'manual_docs_required',
    sandboxMode: 'Validate-only prepared',
    baseUrl: null,
    docsUrl: 'https://docs.kraken.com/api/docs/websocket-v2/add_order',
    orderDocsUrl: 'https://docs.kraken.com/api/docs/websocket-v2/add_order',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc'],
    supportsCancel: false,
    supportsOrderStatus: false,
    supportsReduceOnly: false,
    supportsPostOnly: true,
    supportsIoc: true,
    productionEndpointBlocked: true,
    notes: 'Kraken spot order APIs support validate-only behavior, but EtherealAI does not treat that as a full sandbox/testnet adapter yet.'
  },
  coinbase: {
    exchangeName: 'coinbase',
    displayName: 'Coinbase',
    adapterStatus: 'manual_docs_required',
    sandboxMode: 'Advanced Trade Sandbox prepared',
    baseUrl: 'https://api-sandbox.coinbase.com',
    docsUrl: 'https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/sandbox',
    orderDocsUrl: 'https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/orders/create-order',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    supportedOrderTypes: ['market', 'limit', 'ioc'],
    supportsCancel: true,
    supportsOrderStatus: true,
    supportsReduceOnly: false,
    supportsPostOnly: true,
    supportsIoc: true,
    productionEndpointBlocked: true,
    notes: 'Coinbase sandbox support is mocked/static and authentication style depends on the account/API key type. Adapter is prepared but not execution-complete.'
  }
};

function normalizeSandboxExchangeName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/_/g, '-');
}

function getSandboxAdapter(exchangeName) {
  return SANDBOX_EXCHANGE_ADAPTERS[normalizeSandboxExchangeName(exchangeName)] || null;
}

function redactValue(value = '') {
  const text = String(value || '');
  if (text.length <= 8) {
    return text ? `${text.slice(0, 2)}...${text.slice(-2)}` : '';
  }
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

async function ensureSandboxVaultStorage() {
  await fs.mkdir(OWNER_SECRETS_DIR, { recursive: true, mode: 0o700 });
  await fs.chmod(OWNER_SECRETS_DIR, 0o700).catch(() => {});
}

async function getSandboxVaultKey() {
  await ensureSandboxVaultStorage();

  try {
    const existing = (await fs.readFile(EXCHANGE_SANDBOX_VAULT_KEY_PATH, 'utf8')).trim();
    if (/^[a-f0-9]{64}$/i.test(existing)) {
      return Buffer.from(existing, 'hex');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const key = crypto.randomBytes(32);
  await fs.writeFile(EXCHANGE_SANDBOX_VAULT_KEY_PATH, key.toString('hex'), {
    mode: 0o600,
    flag: 'wx'
  }).catch(async error => {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  });
  await fs.chmod(EXCHANGE_SANDBOX_VAULT_KEY_PATH, 0o600).catch(() => {});

  return Buffer.from((await fs.readFile(EXCHANGE_SANDBOX_VAULT_KEY_PATH, 'utf8')).trim(), 'hex');
}

async function readSandboxVaultFile() {
  await ensureSandboxVaultStorage();

  try {
    const raw = await fs.readFile(EXCHANGE_SANDBOX_VAULT_PATH, 'utf8');
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

async function writeSandboxVaultFile(vault) {
  await ensureSandboxVaultStorage();
  const tmpPath = `${EXCHANGE_SANDBOX_VAULT_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(vault, null, 2), { mode: 0o600 });
  await fs.chmod(tmpPath, 0o600).catch(() => {});
  await fs.rename(tmpPath, EXCHANGE_SANDBOX_VAULT_PATH);
  await fs.chmod(EXCHANGE_SANDBOX_VAULT_PATH, 0o600).catch(() => {});
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

function getSandboxReferenceName({ userId, connectorId, exchangeName }) {
  return `exchange-sandbox:${userId}:${connectorId}:${normalizeSandboxExchangeName(exchangeName)}`;
}

function sanitizeSandboxCredentialInput(credentials = {}, adapter = null) {
  const apiKey = String(credentials.apiKey || '').trim();
  const apiSecret = String(credentials.apiSecret || '').trim();
  const passphrase = String(credentials.passphrase || '').trim();

  if (!apiKey) {
    throw new Error('Sandbox/testnet API key is required.');
  }

  if (!apiSecret) {
    throw new Error('Sandbox/testnet API secret is required.');
  }

  if (adapter?.passphraseRequired && !passphrase) {
    throw new Error(`${adapter.displayName} sandbox/testnet requires the API passphrase.`);
  }

  return { apiKey, apiSecret, passphrase };
}

function sanitizeSandboxPermissionsChecklist(checklist = {}) {
  const normalized = {
    sandboxKeyCreated: Boolean(checklist.sandboxKeyCreated),
    productionKeyNotUsed: Boolean(checklist.productionKeyNotUsed),
    sandboxTradingOnly: Boolean(checklist.sandboxTradingOnly),
    withdrawalsDisabled: Boolean(checklist.withdrawalsDisabled),
    transferDisabled: Boolean(checklist.transferDisabled ?? checklist.withdrawalsDisabled),
    ownerUnderstandsNoLiveOrders: Boolean(checklist.ownerUnderstandsNoLiveOrders)
  };
  const missing = [];

  if (!normalized.sandboxKeyCreated) missing.push('confirm this is a sandbox/testnet key');
  if (!normalized.productionKeyNotUsed) missing.push('confirm no production/live key is being used');
  if (!normalized.sandboxTradingOnly) missing.push('confirm order permission is sandbox/testnet only');
  if (!normalized.withdrawalsDisabled) missing.push('confirm withdrawals are disabled');
  if (!normalized.ownerUnderstandsNoLiveOrders) missing.push('confirm EtherealAI will not place production live orders');

  return {
    checklist: normalized,
    missing
  };
}

async function saveSandboxVaultCredentials({ referenceName, connector, exchangeName, credentials, permissionsChecklist }) {
  const key = await getSandboxVaultKey();
  const vault = await readSandboxVaultFile();
  const now = new Date().toISOString();
  const payload = {
    exchangeName: normalizeSandboxExchangeName(exchangeName),
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
      sandboxOnly: true,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      productionOrderEndpointEnabled: false
    }
  };

  await writeSandboxVaultFile(vault);

  return {
    referenceName,
    exchangeName: payload.exchangeName,
    connectorId: connector.id,
    stored: true,
    apiKeyFingerprint: redactValue(credentials.apiKey),
    hasExtraPhrase: Boolean(credentials.passphrase),
    rotatedAt: now,
    secretValuesReturned: false,
    vaultPath: EXCHANGE_SANDBOX_VAULT_PATH
  };
}

async function loadSandboxVaultCredentials(referenceName) {
  const key = await getSandboxVaultKey();
  const vault = await readSandboxVaultFile();
  const entry = vault.entries[referenceName];

  if (!entry) {
    return null;
  }

  return decryptVaultPayload(referenceName, entry.encrypted, key);
}

async function deleteSandboxVaultCredentials(referenceName) {
  const vault = await readSandboxVaultFile();
  const existed = Boolean(vault.entries[referenceName]);

  if (existed) {
    delete vault.entries[referenceName];
    await writeSandboxVaultFile(vault);
  }

  return { deleted: existed, referenceName };
}

async function getSandboxVaultStatus(referenceName = null) {
  const vault = await readSandboxVaultFile();
  const entries = referenceName
    ? Object.values(vault.entries).filter(entry => entry.referenceName === referenceName)
    : Object.values(vault.entries);

  return {
    vaultPath: EXCHANGE_SANDBOX_VAULT_PATH,
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

function normalizeSandboxSymbol(exchangeName, symbol = 'BTC/USDT') {
  const raw = String(symbol || 'BTC/USDT').trim().toUpperCase().replace('-', '/');
  const [base = 'BTC', quote = 'USDT'] = raw.split('/');
  const canonical = `${base}/${quote}`;
  const exchange = normalizeSandboxExchangeName(exchangeName);

  if (exchange === 'okx') {
    return { canonical, exchangeSymbol: `${base}-${quote}` };
  }

  if (exchange === 'coinbase') {
    return { canonical, exchangeSymbol: `${base}-${quote === 'USDT' ? 'USD' : quote}` };
  }

  if (exchange === 'kraken') {
    return { canonical, exchangeSymbol: `${base === 'BTC' ? 'XBT' : base}/${quote}` };
  }

  return { canonical, exchangeSymbol: `${base}${quote}` };
}

function normalizeSandboxOrderDraft(input = {}) {
  const exchangeName = normalizeSandboxExchangeName(input.exchangeName || input.exchange || 'binance');
  const adapter = getSandboxAdapter(exchangeName);
  const symbol = normalizeSandboxSymbol(exchangeName, input.symbol || 'BTC/USDT');
  const side = String(input.side || 'buy').trim().toLowerCase() === 'sell' ? 'sell' : 'buy';
  const requestedOrderType = String(input.orderType || input.type || 'limit').trim().toLowerCase().replace('-', '_');
  const orderType = SANDBOX_ORDER_TYPES.includes(requestedOrderType) ? requestedOrderType : 'limit';
  const quantity = Math.max(0, Number(input.quantity || input.baseSize || 0));
  const limitPrice = Number(input.limitPrice || input.price || 0);
  const quoteSize = Math.max(0, Number(input.quoteSize || input.notionalUsd || 0));
  const notionalUsd = quoteSize > 0
    ? quoteSize
    : quantity > 0 && limitPrice > 0
      ? quantity * limitPrice
      : Math.max(0, Number(input.notionalUsd || 0));
  const clientOrderId = String(input.clientOrderId || `ethsbx${crypto.randomBytes(8).toString('hex')}`)
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
    clientOrderId,
    reduceOnly: Boolean(input.reduceOnly),
    postOnly: orderType === 'post_only' || Boolean(input.postOnly),
    timeInForce: orderType === 'ioc' ? 'IOC' : 'GTC',
    sandboxOnly: true,
    liveTradingEnabled: false,
    walletSigningEnabled: false,
    withdrawalsEnabled: false
  };
}

function createSandboxOrderFingerprint(order = {}) {
  return [
    order.exchangeName,
    order.symbol,
    order.side,
    order.orderType,
    Number(order.quantity || 0).toFixed(12),
    Number(order.limitPrice || 0).toFixed(8),
    Number(order.notionalUsd || 0).toFixed(2)
  ].join(':');
}

function evaluateSandboxOrderSafety({
  order,
  adapter = null,
  connector = null,
  credentials = null,
  riskProfile = null,
  marketContext = {},
  recentOrderFingerprints = [],
  policy = {}
}) {
  const effectivePolicy = { ...DEFAULT_SANDBOX_POLICY, ...(policy || {}) };
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
  const orderFingerprint = createSandboxOrderFingerprint(order);
  const orderNotional = Number(order.notionalUsd || (order.quantity * order.limitPrice) || 0);
  const maxOrderSize = Number(riskProfile?.max_order_value || effectivePolicy.maxOrderSizeUsd || 0);
  const maxDailyLoss = Number(riskProfile?.max_daily_loss || effectivePolicy.maxDailyLossUsd || 0);
  const slippagePercent = Number(marketContext.slippagePercent ?? 0.05);
  const liquidityUsd = Number(marketContext.liquidityUsd ?? 1000000);
  const priceTimestamp = marketContext.priceTimestamp ? Date.parse(marketContext.priceTimestamp) : Date.now();
  const priceAgeMs = Date.now() - priceTimestamp;

  addCheck(
    'sandbox_adapter',
    'Sandbox adapter is available',
    adapter?.adapterStatus === 'complete',
    adapter?.adapterStatus === 'complete'
      ? `${adapter.displayName} has a sandbox/testnet execution adapter.`
      : `${adapter?.displayName || order.exchangeName} is prepared only and needs manual API docs/account validation before sandbox orders.`,
    'Choose Binance, OKX, or Bybit for the first sandbox test trade.'
  );
  addCheck(
    'connector_ready',
    'Exchange connector exists',
    Boolean(connector?.id),
    connector?.id
      ? `${connector.label || adapter?.displayName || order.exchangeName} connector is available.`
      : 'Create the connector placeholder before running a sandbox test trade.',
    'Click Create Connector Placeholders, then retry.'
  );
  addCheck(
    'sandbox_credentials',
    'Sandbox/testnet key is saved in the local vault',
    Boolean(credentials?.apiKey && credentials?.apiSecret),
    credentials?.apiKey
      ? 'Sandbox credentials were loaded from the encrypted local vault. Secret values were not returned to the UI.'
      : 'No sandbox/testnet key is saved for this connector.',
    'Save a sandbox/testnet API key for this exchange, then retry.'
  );
  addCheck(
    'not_production_key',
    'Production key is not used',
    permissions.productionKeyNotUsed === true,
    permissions.productionKeyNotUsed === true
      ? 'The owner checklist confirms this is not a production/live key.'
      : 'The owner checklist has not confirmed this key is sandbox/testnet only.',
    'Confirm the sandbox key checklist before saving credentials.'
  );
  addCheck(
    'withdrawals_disabled',
    'Withdrawals are disabled',
    permissions.withdrawalsDisabled === true && effectivePolicy.withdrawalsEnabled === false,
    permissions.withdrawalsDisabled === true
      ? 'Withdrawal permission is marked disabled for this sandbox/testnet key.'
      : 'Withdrawal permission has not been confirmed disabled.',
    'Disable withdrawals on the exchange key and confirm the checklist.'
  );
  addCheck(
    'risk_profile_active',
    'Risk profile is active and kill switch is off for sandbox',
    Boolean(riskProfile?.id) && Number(riskProfile?.kill_switch_enabled || 0) === 0 && riskProfile?.status === 'active',
    riskProfile?.id
      ? 'Active risk profile found. Sandbox/paper kill switch is off.'
      : 'No active risk profile is available.',
    'Open Strategy Lab -> Risk and activate Paper Trading Safe Defaults.'
  );
  addCheck(
    'max_order_size',
    'Order size is inside the max order limit',
    orderNotional > 0 && maxOrderSize > 0 && orderNotional <= maxOrderSize,
    `Sandbox order value is about $${orderNotional.toFixed(2)}. Limit is $${maxOrderSize.toFixed(2)}.`,
    'Lower the sandbox test amount or raise the sandbox risk limit.'
  );
  addCheck(
    'max_daily_loss',
    'Daily loss limit exists',
    maxDailyLoss > 0,
    maxDailyLoss > 0
      ? `Daily loss limit is $${maxDailyLoss.toFixed(2)}.`
      : 'A max daily loss limit must exist before any sandbox order test.',
    'Save an active risk profile with a max daily loss limit.'
  );
  addCheck(
    'liquidity_check',
    'Liquidity check passed',
    liquidityUsd >= Number(effectivePolicy.minLiquidityUsd || 0),
    `Estimated liquidity is $${liquidityUsd.toFixed(2)}. Minimum is $${Number(effectivePolicy.minLiquidityUsd || 0).toFixed(2)}.`,
    'Use a larger/liquid test pair such as BTC/USDT.'
  );
  addCheck(
    'stale_price_check',
    'Price is not stale',
    priceAgeMs <= Number(effectivePolicy.maxPriceAgeMs || 0),
    `Price age is ${Math.max(0, priceAgeMs)}ms. Limit is ${Number(effectivePolicy.maxPriceAgeMs || 0)}ms.`,
    'Refresh market data and retry.'
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
      ? 'An identical sandbox order was already attempted recently.'
      : 'No duplicate sandbox order fingerprint was found.',
    'Change the test order or wait before retrying.'
  );
  addCheck(
    'production_boundary',
    'Production live trading remains locked',
    effectivePolicy.productionLiveTradingEnabled === false
      && effectivePolicy.productionOrderEndpointEnabled === false
      && effectivePolicy.walletSigningEnabled === false
      && effectivePolicy.withdrawalsEnabled === false,
    'Production live trading, production order endpoints, wallet signing, and withdrawals are disabled.',
    'No action needed.'
  );

  const passed = checks.every(check => check.passed);

  return {
    passed,
    status: passed ? 'ready_for_sandbox_submit' : 'blocked',
    checks,
    orderFingerprint,
    plainEnglishStatus: passed
      ? 'Sandbox safety checks passed. EtherealAI may use the sandbox/testnet adapter only.'
      : 'Sandbox safety checks blocked the order. No exchange order endpoint was called.',
    safetyBoundary: {
      sandboxOnly: true,
      productionLiveTradingEnabled: false,
      productionOrderEndpointEnabled: false,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      realMoneyAtRisk: false
    }
  };
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

async function submitBinanceSandboxOrder({ order, credentials, adapter }) {
  const mapped = mapBinanceOrderType(order);
  const params = {
    symbol: order.exchangeSymbol,
    side: order.side.toUpperCase(),
    type: mapped.type,
    newClientOrderId: order.clientOrderId,
    timestamp: Date.now(),
    recvWindow: 5000
  };

  if (mapped.timeInForce) params.timeInForce = mapped.timeInForce;
  if (order.quantity > 0) params.quantity = String(order.quantity);
  if (order.orderType !== 'market' && order.limitPrice > 0) params.price = String(order.limitPrice);
  if (order.orderType === 'market' && order.quoteSize > 0) params.quoteOrderQty = String(order.quoteSize);

  const signed = signedQueryString(params, credentials.apiSecret);
  const placed = await fetchJson(`${adapter.baseUrl}/api/v3/order?${signed}`, {
    method: 'POST',
    headers: { 'X-MBX-APIKEY': credentials.apiKey }
  });
  const orderId = placed.orderId ? String(placed.orderId) : '';
  const statusParams = signedQueryString({
    symbol: order.exchangeSymbol,
    orderId,
    timestamp: Date.now(),
    recvWindow: 5000
  }, credentials.apiSecret);
  const status = orderId
    ? await fetchJson(`${adapter.baseUrl}/api/v3/order?${statusParams}`, {
      headers: { 'X-MBX-APIKEY': credentials.apiKey }
    })
    : placed;
  let cancel = null;

  if (orderId && ['NEW', 'PARTIALLY_FILLED'].includes(String(status.status || placed.status || '').toUpperCase())) {
    const cancelParams = signedQueryString({
      symbol: order.exchangeSymbol,
      orderId,
      timestamp: Date.now(),
      recvWindow: 5000
    }, credentials.apiSecret);
    cancel = await fetchJson(`${adapter.baseUrl}/api/v3/order?${cancelParams}`, {
      method: 'DELETE',
      headers: { 'X-MBX-APIKEY': credentials.apiKey }
    });
  }

  return { placed, status, cancel, exchangeOrderId: orderId };
}

function signOkx(timestamp, method, requestPath, body, secret) {
  const prehash = `${timestamp}${method.toUpperCase()}${requestPath}${body || ''}`;
  return crypto.createHmac('sha256', secret).update(prehash).digest('base64');
}

function mapOkxOrderType(order) {
  if (order.orderType === 'market') return 'market';
  if (order.orderType === 'post_only') return 'post_only';
  if (order.orderType === 'ioc') return 'ioc';
  return 'limit';
}

async function okxRequest({ adapter, credentials, method, path: requestPath, payload = null }) {
  const body = payload ? JSON.stringify(payload) : '';
  const timestamp = new Date().toISOString();
  return fetchJson(`${adapter.baseUrl}${requestPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': credentials.apiKey,
      'OK-ACCESS-SIGN': signOkx(timestamp, method, requestPath, body, credentials.apiSecret),
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': credentials.passphrase || '',
      'x-simulated-trading': '1'
    },
    body: body || undefined
  });
}

async function submitOkxSandboxOrder({ order, credentials, adapter }) {
  const payload = {
    instId: order.exchangeSymbol,
    tdMode: 'cash',
    clOrdId: order.clientOrderId,
    side: order.side,
    ordType: mapOkxOrderType(order),
    sz: String(order.quantity || order.quoteSize || 0)
  };

  if (order.orderType !== 'market' && order.limitPrice > 0) payload.px = String(order.limitPrice);
  if (order.reduceOnly) payload.reduceOnly = 'true';

  const placed = await okxRequest({
    adapter,
    credentials,
    method: 'POST',
    path: '/api/v5/trade/order',
    payload
  });
  const placedItem = placed?.data?.[0] || {};
  const exchangeOrderId = String(placedItem.ordId || '');
  const statusPath = `/api/v5/trade/order?instId=${encodeURIComponent(order.exchangeSymbol)}&clOrdId=${encodeURIComponent(order.clientOrderId)}`;
  const status = await okxRequest({ adapter, credentials, method: 'GET', path: statusPath });
  let cancel = null;

  if (exchangeOrderId || order.clientOrderId) {
    cancel = await okxRequest({
      adapter,
      credentials,
      method: 'POST',
      path: '/api/v5/trade/cancel-order',
      payload: {
        instId: order.exchangeSymbol,
        ...(exchangeOrderId ? { ordId: exchangeOrderId } : { clOrdId: order.clientOrderId })
      }
    }).catch(error => ({ canceled: false, error: error.message, body: error.body || null }));
  }

  return { placed, status, cancel, exchangeOrderId };
}

function mapBybitOrder(order) {
  const payload = {
    category: 'spot',
    symbol: order.exchangeSymbol,
    side: order.side === 'buy' ? 'Buy' : 'Sell',
    orderType: order.orderType === 'market' ? 'Market' : 'Limit',
    qty: String(order.quantity || order.quoteSize || 0),
    orderLinkId: order.clientOrderId
  };

  if (order.orderType !== 'market' && order.limitPrice > 0) payload.price = String(order.limitPrice);
  if (order.orderType === 'post_only') payload.timeInForce = 'PostOnly';
  if (order.orderType === 'ioc') payload.timeInForce = 'IOC';
  if (order.reduceOnly) payload.reduceOnly = true;

  return payload;
}

function signBybit({ timestamp, apiKey, recvWindow, payload, secret }) {
  return crypto.createHmac('sha256', secret)
    .update(`${timestamp}${apiKey}${recvWindow}${payload}`)
    .digest('hex');
}

async function bybitRequest({ adapter, credentials, method, requestPath, payload = null }) {
  const timestamp = String(Date.now());
  const recvWindow = '5000';
  const body = payload ? JSON.stringify(payload) : '';
  const query = !payload && requestPath.includes('?') ? requestPath.split('?')[1] : '';
  const signPayload = method === 'GET' ? query : body;

  return fetchJson(`${adapter.baseUrl}${requestPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-BAPI-API-KEY': credentials.apiKey,
      'X-BAPI-SIGN': signBybit({
        timestamp,
        apiKey: credentials.apiKey,
        recvWindow,
        payload: signPayload,
        secret: credentials.apiSecret
      }),
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow
    },
    body: body || undefined
  });
}

async function submitBybitSandboxOrder({ order, credentials, adapter }) {
  const placed = await bybitRequest({
    adapter,
    credentials,
    method: 'POST',
    requestPath: '/v5/order/create',
    payload: mapBybitOrder(order)
  });
  const exchangeOrderId = String(placed?.result?.orderId || '');
  const status = await bybitRequest({
    adapter,
    credentials,
    method: 'GET',
    requestPath: `/v5/order/realtime?category=spot&symbol=${encodeURIComponent(order.exchangeSymbol)}&orderLinkId=${encodeURIComponent(order.clientOrderId)}`
  });
  let cancel = null;

  if (exchangeOrderId || order.clientOrderId) {
    cancel = await bybitRequest({
      adapter,
      credentials,
      method: 'POST',
      requestPath: '/v5/order/cancel',
      payload: {
        category: 'spot',
        symbol: order.exchangeSymbol,
        ...(exchangeOrderId ? { orderId: exchangeOrderId } : { orderLinkId: order.clientOrderId })
      }
    }).catch(error => ({ canceled: false, error: error.message, body: error.body || null }));
  }

  return { placed, status, cancel, exchangeOrderId };
}

function normalizeLifecycleStatus(exchangeName, rawStatus) {
  const status = String(rawStatus || '').trim().toLowerCase();

  if (['new', 'live', 'open', 'partiallyfilled', 'partially_filled', 'partially-filled'].includes(status)) {
    return status.includes('partial') ? 'partially_filled' : 'accepted';
  }
  if (['filled', 'fully_filled'].includes(status)) return 'filled';
  if (['canceled', 'cancelled'].includes(status)) return 'canceled';
  if (['rejected', 'failed'].includes(status)) return 'rejected';
  if (['expired'].includes(status)) return 'expired';

  if (normalizeSandboxExchangeName(exchangeName) === 'okx' && status === '0') {
    return 'accepted';
  }

  return status ? 'accepted' : 'submitted';
}

function extractAdapterRawStatus(exchangeName, lifecycle = {}) {
  const exchange = normalizeSandboxExchangeName(exchangeName);

  if (exchange === 'binance') {
    return lifecycle.cancel?.status || lifecycle.status?.status || lifecycle.placed?.status || '';
  }

  if (exchange === 'okx') {
    return lifecycle.cancel?.data?.[0]?.sCode === '0'
      ? 'canceled'
      : lifecycle.status?.data?.[0]?.state || lifecycle.placed?.data?.[0]?.sCode || lifecycle.placed?.code || '';
  }

  if (exchange === 'bybit') {
    return lifecycle.cancel?.retCode === 0
      ? 'canceled'
      : lifecycle.status?.result?.list?.[0]?.orderStatus || (lifecycle.placed?.retCode === 0 ? 'accepted' : 'rejected');
  }

  return '';
}

async function runSandboxOrderLifecycle({ order, credentials, adapter }) {
  if (!adapter || adapter.adapterStatus !== 'complete') {
    throw new Error(`${adapter?.displayName || order.exchangeName} does not have a complete sandbox execution adapter yet.`);
  }

  let lifecycle;

  if (adapter.exchangeName === 'binance') {
    lifecycle = await submitBinanceSandboxOrder({ order, credentials, adapter });
  } else if (adapter.exchangeName === 'okx') {
    lifecycle = await submitOkxSandboxOrder({ order, credentials, adapter });
  } else if (adapter.exchangeName === 'bybit') {
    lifecycle = await submitBybitSandboxOrder({ order, credentials, adapter });
  } else {
    throw new Error(`${adapter.displayName} sandbox/testnet execution is prepared but still needs manual API docs work.`);
  }

  const rawStatus = extractAdapterRawStatus(adapter.exchangeName, lifecycle);
  const finalStatus = normalizeLifecycleStatus(adapter.exchangeName, rawStatus);
  const fees = Number(lifecycle.status?.cummulativeQuoteQty || lifecycle.status?.fee || 0);

  return {
    status: finalStatus,
    exchangeOrderId: lifecycle.exchangeOrderId || '',
    rawStatus,
    lifecycle,
    resultScreen: {
      exchange: adapter.displayName,
      symbol: order.symbol,
      orderType: order.orderType,
      sandboxAmount: order.notionalUsd || order.quantity,
      entryPrice: order.limitPrice || null,
      fillStatus: finalStatus,
      fees,
      rejectionReason: finalStatus === 'rejected' ? 'Exchange rejected the sandbox/testnet request. Review raw adapter response in Advanced Mode.' : ''
    },
    safetyBoundary: {
      sandboxOnly: true,
      productionLiveTradingEnabled: false,
      productionOrderEndpointEnabled: false,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      realMoneyAtRisk: false
    }
  };
}

function createPlainEnglishSandboxError(exchangeName, error) {
  const rawMessage = String(error?.message || error || '').slice(0, 500);
  const lower = rawMessage.toLowerCase();
  const displayName = getSandboxAdapter(exchangeName)?.displayName || exchangeName;

  if (/401|403|unauthorized|forbidden|permission|denied|invalid api/.test(lower)) {
    return `${displayName} sandbox/testnet rejected the key or permission. Confirm this is a sandbox/testnet key, withdrawals are disabled, and production keys are not used. No live order was placed.`;
  }

  if (/insufficient|balance|fund/.test(lower)) {
    return `${displayName} sandbox/testnet says the test account has insufficient sandbox funds. Add testnet funds or lower the sandbox amount. No live order was placed.`;
  }

  if (/filter|min|lot|size|precision|notional/.test(lower)) {
    return `${displayName} sandbox/testnet rejected the test order size or price. Use a liquid pair and adjust quantity/price to meet sandbox symbol rules. No live order was placed.`;
  }

  if (/timeout|network|fetch failed|enotfound|econn|abort/.test(lower)) {
    return `${displayName} sandbox/testnet could not be reached from this Mac. Check internet/VPN/firewall, then retry. No live order was placed.`;
  }

  return `${displayName} sandbox/testnet order test failed: ${rawMessage || 'unknown error'}. No live trading, wallet signing, withdrawals, or production orders were attempted.`;
}

function buildPhase3BSandboxStatus({ connectors = [], vaultStatus = null, latestTests = [] } = {}) {
  const credentialReferences = new Set((vaultStatus?.entries || []).map(entry => entry.exchangeName));
  const connectorByExchangeName = connectors.reduce((acc, connector) => {
    const exchangeName = normalizeSandboxExchangeName(connector.settings?.registryId || connector.exchange_name);
    if (!acc[exchangeName]) {
      acc[exchangeName] = connector;
    }
    return acc;
  }, {});
  const adapters = Object.values(SANDBOX_EXCHANGE_ADAPTERS).map(adapter => ({
    ...adapter,
    connectorId: connectorByExchangeName[adapter.exchangeName]?.id || null,
    connectorLabel: connectorByExchangeName[adapter.exchangeName]?.label || '',
    connectorExists: Boolean(connectorByExchangeName[adapter.exchangeName]),
    sandboxCredentialsSaved: credentialReferences.has(adapter.exchangeName),
    simpleStatus: adapter.adapterStatus === 'complete'
      ? credentialReferences.has(adapter.exchangeName)
        ? 'Sandbox key saved'
        : 'Adapter ready; key needed'
      : 'Prepared; manual docs work needed',
    liveTradingEnabled: false,
    walletSigningEnabled: false,
    withdrawalsEnabled: false
  }));

  return {
    title: 'Phase 3B: Sandbox/Testnet Execution',
    status: 'sandbox_ready_locked_from_live',
    plainEnglishStatus: 'EtherealAI can test sandbox/testnet order lifecycle for supported exchanges while production live trading remains locked.',
    supportedExchanges: adapters,
    completeAdapters: adapters.filter(adapter => adapter.adapterStatus === 'complete').map(adapter => adapter.exchangeName),
    manualDocsRequired: adapters.filter(adapter => adapter.adapterStatus !== 'complete').map(adapter => adapter.exchangeName),
    latestTests,
    nextRecommendedAction: 'Choose Binance, OKX, or Bybit, then click Run Sandbox Test Trade after saving sandbox/testnet keys.',
    safetyBoundary: {
      sandboxOnly: true,
      productionLiveTradingEnabled: false,
      productionOrderEndpointEnabled: false,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      realMoneyAtRisk: false
    }
  };
}

function buildPhase3CPreparation({ latestSandboxTests = [] } = {}) {
  const hasSuccessfulSandbox = latestSandboxTests.some(test => ['accepted', 'filled', 'canceled'].includes(test.status));

  return {
    title: 'Phase 3C: Tiny Live Test Preparation',
    status: 'locked_future_approval_required',
    plainEnglishStatus: 'Tiny live test mode is prepared as a checklist only. It cannot place production orders yet.',
    checklist: [
      {
        label: 'At least one sandbox order lifecycle completed',
        status: hasSuccessfulSandbox ? 'complete' : 'locked',
        note: hasSuccessfulSandbox ? 'Sandbox evidence exists.' : 'Run and review a sandbox/testnet order lifecycle first.'
      },
      {
        label: 'Manual owner confirmation flow',
        status: 'prepared_locked',
        note: 'Future tiny live trades will require a separate typed owner approval.'
      },
      {
        label: 'Emergency stop',
        status: 'available_safety_action',
        note: 'The emergency stop can disable any future live connector flags without enabling trading.'
      },
      {
        label: 'Audit log',
        status: 'prepared',
        note: 'Sandbox tests and emergency-stop actions are recorded locally.'
      },
      {
        label: 'Rollback / disable all live connectors',
        status: 'available_safety_action',
        note: 'This button keeps live trading locked and disables future live connector flags.'
      }
    ],
    actions: [
      {
        id: 'tiny_live_approval_checklist',
        label: 'Review Tiny Live Test Checklist',
        enabled: false,
        reason: 'Tiny live test mode remains locked until sandbox evidence, owner approval, and risk limits pass.'
      },
      {
        id: 'emergency_stop',
        label: 'Emergency Stop / Disable Live Connectors',
        enabled: true,
        reason: 'Safe rollback action only. It does not enable trading.'
      }
    ],
    safetyBoundary: {
      tinyLiveOrdersEnabled: false,
      liveTradingEnabled: false,
      productionOrderEndpointEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false
    }
  };
}

module.exports = {
  EXCHANGE_SANDBOX_VAULT_PATH,
  SANDBOX_ORDER_LIFECYCLE_STATUSES,
  SANDBOX_ORDER_TYPES,
  SANDBOX_EXCHANGE_ADAPTERS,
  DEFAULT_SANDBOX_POLICY,
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
  createPlainEnglishSandboxError
};
