const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const OWNER_SECRETS_DIR = path.join(os.homedir(), 'EtherealAI_Secrets');
const EXCHANGE_PRODUCTION_VAULT_PATH = path.join(OWNER_SECRETS_DIR, 'exchange-production-vault.json');
const EXCHANGE_PRODUCTION_VAULT_KEY_PATH = path.join(OWNER_SECRETS_DIR, 'exchange-production-vault.key');

const PHASE6_ENABLE_LIVE_CONFIRMATION_PHRASE = 'I APPROVE CONTROLLED PRODUCTION LIVE TRADING';
const PHASE6_ORDER_CONFIRMATION_PHRASE = 'I APPROVE THIS PRODUCTION ORDER';

const PHASE6_APPROVAL_SCOPE_TYPES = [
  'enable_live_trading',
  'enable_exchange',
  'enable_strategy',
  'increase_capital_limits',
  'enable_symbol'
];

const PHASE6_ORDER_STATUSES = [
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
  'reconciled',
  'emergency_disabled'
];

const DEFAULT_PHASE6_POLICY = {
  defaultLocked: true,
  productionExecutionInfrastructureImplemented: true,
  requireExplicitOwnerApproval: true,
  requireSandboxValidation: true,
  requireExchangeConnectivityVerification: true,
  requireProductionDryRun: true,
  requireReadOnlyAccountVerified: true,
  requireWithdrawalDisabledVerification: true,
  requireRiskProfile: true,
  requireManualOrderConfirmation: true,
  spotOnly: true,
  oneOrderPerApproval: true,
  automatedLiveTradingEnabled: false,
  unrestrictedAutonomousTradingEnabled: false,
  walletSigningEnabled: false,
  withdrawalsEnabled: false,
  marginEnabled: false,
  futuresEnabled: false,
  leverageEnabled: false,
  maxCapitalExposureUsd: 100,
  maxOrderSizeUsd: 10,
  maxExchangeExposureUsd: 50,
  maxStrategyExposureUsd: 25,
  maxDailyDrawdownUsd: 10,
  rollingLossLimitUsd: 15,
  maxVolatilityPercent: 4,
  minNetSpreadPercent: 0.05,
  maxSlippagePercent: 0.15,
  maxPriceAgeMs: 2500,
  minLiquidityUsd: 1000,
  maxLatencyMs: 1000,
  duplicateOrderWindowMs: 120000,
  repeatedFailureDisableThreshold: 3
};

const PHASE6_PRODUCTION_ADAPTERS = {
  binance: {
    exchangeName: 'binance',
    displayName: 'Binance',
    adapterStatus: 'production_route_ready_locked',
    baseUrl: 'https://api.binance.com',
    docsUrl: 'https://developers.binance.com/docs/binance-spot-api-docs/rest-api/trading-endpoints',
    authModel: 'HMAC_SHA256_QUERY',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    supportedSymbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc'],
    precisionModel: { priceDecimals: 2, quantityDecimals: 6, minNotionalUsd: 5, minQuantity: 0.00001 },
    websocket: {
      market: 'wss://stream.binance.com:9443/ws',
      userDataRequiresListenKey: true,
      status: 'spec_ready_not_auto_running'
    },
    endpoints: {
      placeOrder: 'POST /api/v3/order',
      orderStatus: 'GET /api/v3/order',
      cancelOrder: 'DELETE /api/v3/order',
      account: 'GET /api/v3/account'
    },
    notes: 'Spot only. Requires owner approval, sandbox evidence, dry-run checks, and withdrawal-disabled verification before a production order endpoint can be called.'
  },
  coinbase: {
    exchangeName: 'coinbase',
    displayName: 'Coinbase Advanced',
    adapterStatus: 'production_route_ready_locked',
    baseUrl: 'https://api.coinbase.com',
    docsUrl: 'https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/rest-api',
    authModel: 'CDP_JWT_OR_OWNER_SUPPLIED_BEARER',
    credentialFields: ['apiKeyOrBearerToken', 'apiSecretOptionalPem'],
    passphraseRequired: false,
    supportedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
    supportedOrderTypes: ['market', 'limit', 'ioc'],
    precisionModel: { priceDecimals: 2, quantityDecimals: 8, minNotionalUsd: 1, minQuantity: 0.00001 },
    websocket: {
      market: 'wss://advanced-trade-ws.coinbase.com',
      user: 'wss://advanced-trade-ws-user.coinbase.com',
      status: 'spec_ready_not_auto_running'
    },
    endpoints: {
      placeOrder: 'POST /api/v3/brokerage/orders',
      orderStatus: 'GET /api/v3/brokerage/orders/historical/{order_id}',
      cancelOrder: 'POST /api/v3/brokerage/orders/batch_cancel',
      account: 'GET /api/v3/brokerage/accounts'
    },
    notes: 'Supports Coinbase Advanced bearer/JWT authentication. The owner must supply a production key with trade permission and no transfer/withdrawal permission.'
  },
  kraken: {
    exchangeName: 'kraken',
    displayName: 'Kraken',
    adapterStatus: 'production_route_ready_locked',
    baseUrl: 'https://api.kraken.com',
    docsUrl: 'https://docs.kraken.com/api/docs/rest-api/add-order/',
    authModel: 'KRAKEN_API_SIGN',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    supportedSymbols: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc'],
    precisionModel: { priceDecimals: 2, quantityDecimals: 8, minNotionalUsd: 1, minQuantity: 0.00001 },
    websocket: {
      market: 'wss://ws.kraken.com',
      user: 'wss://ws-auth.kraken.com',
      status: 'spec_ready_not_auto_running'
    },
    endpoints: {
      placeOrder: 'POST /0/private/AddOrder',
      orderStatus: 'POST /0/private/QueryOrders',
      cancelOrder: 'POST /0/private/CancelOrder',
      account: 'POST /0/private/Balance'
    },
    notes: 'Spot only. AddOrder requires Create & modify orders permission. Withdraw Funds must remain disabled.'
  },
  okx: {
    exchangeName: 'okx',
    displayName: 'OKX',
    adapterStatus: 'production_route_ready_locked',
    baseUrl: 'https://www.okx.com',
    docsUrl: 'https://www.okx.com/docs-v5/en/',
    authModel: 'OKX_ACCESS_SIGN',
    credentialFields: ['apiKey', 'apiSecret', 'passphrase'],
    passphraseRequired: true,
    supportedSymbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc'],
    precisionModel: { priceDecimals: 2, quantityDecimals: 6, minNotionalUsd: 1, minQuantity: 0.00001 },
    websocket: {
      market: 'wss://ws.okx.com:8443/ws/v5/public',
      user: 'wss://ws.okx.com:8443/ws/v5/private',
      status: 'spec_ready_not_auto_running'
    },
    endpoints: {
      placeOrder: 'POST /api/v5/trade/order',
      orderStatus: 'GET /api/v5/trade/order',
      cancelOrder: 'POST /api/v5/trade/cancel-order',
      account: 'GET /api/v5/account/balance'
    },
    notes: 'Spot/cash mode only. Trade permission can be present but every order remains owner-gated.'
  },
  bybit: {
    exchangeName: 'bybit',
    displayName: 'Bybit',
    adapterStatus: 'production_route_ready_locked',
    baseUrl: 'https://api.bybit.com',
    docsUrl: 'https://bybit-exchange.github.io/docs/v5/order/create-order',
    authModel: 'BYBIT_V5_HMAC',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    supportedSymbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    supportedOrderTypes: ['market', 'limit', 'post_only', 'ioc'],
    precisionModel: { priceDecimals: 2, quantityDecimals: 6, minNotionalUsd: 1, minQuantity: 0.00001 },
    websocket: {
      market: 'wss://stream.bybit.com/v5/public/spot',
      user: 'wss://stream.bybit.com/v5/private',
      status: 'spec_ready_not_auto_running'
    },
    endpoints: {
      placeOrder: 'POST /v5/order/create',
      orderStatus: 'GET /v5/order/realtime',
      cancelOrder: 'POST /v5/order/cancel',
      account: 'GET /v5/account/wallet-balance'
    },
    notes: 'Spot category only. No derivatives, leverage, or transfers are enabled by this adapter.'
  }
};

const PHASE6B_RECOMMENDED_FIRST_EXCHANGE = 'kraken';
const PHASE6C_RECOMMENDED_FIRST_EXCHANGE = 'kraken';

const PHASE6B_ACTIVATION_EXCHANGE_GUIDES = {
  binance: {
    exchangeName: 'binance',
    displayName: 'Binance',
    recommendedFirst: false,
    recommendedReason: 'Technically strong for sandbox/testnet coverage, but availability varies by region. Use it after Kraken if it is available to you and you can create a restricted spot-only key.',
    ownerPortalUrl: 'https://www.binance.com/en/my/settings/api-management',
    officialDocsUrl: PHASE6_PRODUCTION_ADAPTERS.binance.docsUrl,
    credentialFields: ['API Key', 'Secret Key'],
    requiredPermissions: ['Enable spot trading only if you are preparing tiny live testing', 'Read account/balance information'],
    forbiddenPermissions: ['Withdrawals', 'Internal transfers', 'Margin', 'Futures', 'Leverage', 'Universal transfer'],
    plainEnglishSteps: [
      'Log in to Binance and open API Management.',
      'Create a new API key for EtherealAI on this Mac.',
      'Allow only spot trading and account reads. Keep withdrawals, transfers, margin, futures, and leverage off.',
      'Copy the API key and secret into the EtherealAI production vault. They will not be shown again.',
      'Click Test This Exchange. EtherealAI will read account metadata only and will not place an order.'
    ],
    warning: 'If Binance shows any withdrawal or transfer permission, do not save the key. Delete it on Binance and recreate it with safer permissions.',
    defaultOrder: { symbol: 'BTC/USDT', side: 'buy', orderType: 'limit', quantity: 0.001, limitPrice: 0, notionalUsd: 10 }
  },
  coinbase: {
    exchangeName: 'coinbase',
    displayName: 'Coinbase Advanced',
    recommendedFirst: false,
    recommendedReason: 'Good regulated venue, but CDP/JWT credential setup can be more technical than Kraken for a first owner test.',
    ownerPortalUrl: 'https://portal.cdp.coinbase.com/access/api',
    officialDocsUrl: PHASE6_PRODUCTION_ADAPTERS.coinbase.docsUrl,
    credentialFields: ['CDP API key or owner-supplied bearer token', 'CDP API secret/private key material if required'],
    requiredPermissions: ['View accounts', 'Trade spot only when preparing tiny live testing'],
    forbiddenPermissions: ['Transfers', 'Withdrawals', 'Send crypto', 'Margin', 'Futures', 'Leverage'],
    plainEnglishSteps: [
      'Open Coinbase Developer Platform API access.',
      'Create a key limited to Advanced Trade account reads and spot trading only when you intentionally prepare the tiny live path.',
      'Do not grant transfer, send, withdrawal, margin, futures, or leverage permissions.',
      'Paste the key material into the EtherealAI production vault and save.',
      'Click Test This Exchange. EtherealAI will read accounts only and keep order placement locked.'
    ],
    warning: 'Coinbase credentials may require CDP key material. If the key format is confusing, use Kraken first.',
    defaultOrder: { symbol: 'BTC/USD', side: 'buy', orderType: 'limit', quantity: 0.001, limitPrice: 0, notionalUsd: 10 }
  },
  kraken: {
    exchangeName: 'kraken',
    displayName: 'Kraken',
    recommendedFirst: true,
    recommendedReason: 'Recommended first for Phase 6C because it is a US-accessible spot venue with a simple API key/private-key flow and an API key info endpoint that can verify permissions without placing orders.',
    ownerPortalUrl: 'https://pro.kraken.com/app/settings/api',
    officialDocsUrl: 'https://support.kraken.com/articles/how-to-create-an-api-key-on-kraken-pro',
    credentialFields: ['API Key', 'Private Key'],
    requiredPermissions: ['Query funds', 'Query open orders/trades', 'Create and modify orders only when preparing tiny live testing'],
    forbiddenPermissions: ['Withdraw funds', 'Deposit funds', 'Margin', 'Futures', 'Leverage'],
    plainEnglishSteps: [
      'Log in to Kraken Pro and open Settings, then API.',
      'Create a new API key named EtherealAI MacBook.',
      'Enable account read permissions. Add order creation only when you are ready to prepare the controlled tiny live test.',
      'Leave Withdraw funds disabled. Do not enable margin, futures, leverage, or funding movement.',
      'Paste the API key and private key into the EtherealAI production vault, save, then click Test This Exchange.'
    ],
    warning: 'Never save a Kraken key that can withdraw funds. If Withdraw funds is enabled, delete the key and recreate it.',
    defaultOrder: { symbol: 'BTC/USD', side: 'buy', orderType: 'limit', quantity: 0.001, limitPrice: 0, notionalUsd: 10 }
  },
  okx: {
    exchangeName: 'okx',
    displayName: 'OKX',
    recommendedFirst: false,
    recommendedReason: 'Strong API coverage with passphrase protection. Use after Kraken if you want a second venue.',
    ownerPortalUrl: 'https://www.okx.com/account/my-api',
    officialDocsUrl: PHASE6_PRODUCTION_ADAPTERS.okx.docsUrl,
    credentialFields: ['API Key', 'Secret Key', 'Passphrase'],
    requiredPermissions: ['Read account', 'Trade spot/cash only when preparing tiny live testing'],
    forbiddenPermissions: ['Withdrawals', 'Transfers', 'Margin', 'Futures', 'Perpetuals', 'Leverage'],
    plainEnglishSteps: [
      'Open OKX API management.',
      'Create an API key with read access and spot/cash trading only if preparing the controlled tiny live path.',
      'Set and save the API passphrase safely.',
      'Keep withdrawals, transfers, margin, futures, perpetuals, and leverage off.',
      'Paste the key, secret, and passphrase into EtherealAI and click Test This Exchange.'
    ],
    warning: 'OKX does not expose every withdrawal flag in the same simple way through the tested account endpoint, so the owner checklist is mandatory.',
    defaultOrder: { symbol: 'BTC/USDT', side: 'buy', orderType: 'limit', quantity: 0.001, limitPrice: 0, notionalUsd: 10 }
  },
  bybit: {
    exchangeName: 'bybit',
    displayName: 'Bybit',
    recommendedFirst: false,
    recommendedReason: 'Useful for later multi-venue coverage. Keep it spot-only; do not enable derivatives or leverage.',
    ownerPortalUrl: 'https://www.bybit.com/app/user/api-management',
    officialDocsUrl: PHASE6_PRODUCTION_ADAPTERS.bybit.docsUrl,
    credentialFields: ['API Key', 'API Secret'],
    requiredPermissions: ['Read account', 'Trade spot only when preparing tiny live testing'],
    forbiddenPermissions: ['Withdrawals', 'Transfers', 'Derivatives', 'Margin', 'Futures', 'Leverage'],
    plainEnglishSteps: [
      'Open Bybit API Management.',
      'Create an API key for EtherealAI with account read access.',
      'Enable spot trading only if you are preparing the controlled tiny live path.',
      'Leave withdrawals, transfers, derivatives, margin, futures, and leverage disabled.',
      'Save the key to the EtherealAI local vault and click Test This Exchange.'
    ],
    warning: 'Do not use a Bybit key with derivatives, leverage, or withdrawal permissions for this workflow.',
    defaultOrder: { symbol: 'BTC/USDT', side: 'buy', orderType: 'limit', quantity: 0.001, limitPrice: 0, notionalUsd: 10 }
  }
};

function normalizePhase6ExchangeName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/_/g, '-');
}

function getProductionAdapter(exchangeName) {
  return PHASE6_PRODUCTION_ADAPTERS[normalizePhase6ExchangeName(exchangeName)] || null;
}

function redactValue(value = '') {
  const text = String(value || '');
  if (!text) return '';
  if (text.length <= 8) return `${text.slice(0, 2)}...${text.slice(-2)}`;
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

async function ensureProductionVaultStorage() {
  await fs.mkdir(OWNER_SECRETS_DIR, { recursive: true, mode: 0o700 });
  await fs.chmod(OWNER_SECRETS_DIR, 0o700).catch(() => {});
}

async function getProductionVaultKey() {
  await ensureProductionVaultStorage();

  try {
    const existing = (await fs.readFile(EXCHANGE_PRODUCTION_VAULT_KEY_PATH, 'utf8')).trim();
    if (/^[a-f0-9]{64}$/i.test(existing)) {
      return Buffer.from(existing, 'hex');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const key = crypto.randomBytes(32);
  await fs.writeFile(EXCHANGE_PRODUCTION_VAULT_KEY_PATH, key.toString('hex'), {
    mode: 0o600,
    flag: 'wx'
  }).catch(async error => {
    if (error.code !== 'EEXIST') throw error;
  });
  await fs.chmod(EXCHANGE_PRODUCTION_VAULT_KEY_PATH, 0o600).catch(() => {});

  return Buffer.from((await fs.readFile(EXCHANGE_PRODUCTION_VAULT_KEY_PATH, 'utf8')).trim(), 'hex');
}

async function readProductionVaultFile() {
  await ensureProductionVaultStorage();

  try {
    const raw = await fs.readFile(EXCHANGE_PRODUCTION_VAULT_PATH, 'utf8');
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

async function writeProductionVaultFile(vault) {
  await ensureProductionVaultStorage();
  const tmpPath = `${EXCHANGE_PRODUCTION_VAULT_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(vault, null, 2), { mode: 0o600 });
  await fs.chmod(tmpPath, 0o600).catch(() => {});
  await fs.rename(tmpPath, EXCHANGE_PRODUCTION_VAULT_PATH);
  await fs.chmod(EXCHANGE_PRODUCTION_VAULT_PATH, 0o600).catch(() => {});
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

function getProductionReferenceName({ userId, connectorId, exchangeName }) {
  return `exchange-production:${userId}:${connectorId}:${normalizePhase6ExchangeName(exchangeName)}`;
}

function sanitizeProductionCredentialInput(credentials = {}, adapter = null) {
  const apiKey = String(credentials.apiKey || credentials.apiKeyOrBearerToken || '').trim();
  const apiSecret = String(credentials.apiSecret || credentials.apiSecretOptionalPem || '').trim();
  const passphrase = String(credentials.passphrase || '').trim();
  const bearerToken = String(credentials.bearerToken || '').trim();

  if (!apiKey && !bearerToken) {
    throw new Error('Production API key or owner-supplied bearer token is required.');
  }

  if (adapter?.exchangeName !== 'coinbase' && !apiSecret) {
    throw new Error('Production API secret is required.');
  }

  if (adapter?.exchangeName === 'coinbase' && !apiSecret && !bearerToken && !/^eyJ/i.test(apiKey)) {
    throw new Error('Coinbase Advanced requires either a bearer token or CDP API secret material.');
  }

  if (adapter?.passphraseRequired && !passphrase) {
    throw new Error(`${adapter.displayName} requires an API passphrase.`);
  }

  return { apiKey, apiSecret, passphrase, bearerToken };
}

function sanitizeProductionPermissionsChecklist(checklist = {}) {
  const normalized = {
    productionKeyReviewed: Boolean(checklist.productionKeyReviewed),
    spotTradingEnabled: Boolean(checklist.spotTradingEnabled),
    withdrawalsDisabled: Boolean(checklist.withdrawalsDisabled),
    transfersDisabled: Boolean(checklist.transfersDisabled ?? checklist.withdrawalsDisabled),
    marginDisabled: Boolean(checklist.marginDisabled),
    futuresDisabled: Boolean(checklist.futuresDisabled),
    leverageDisabled: Boolean(checklist.leverageDisabled),
    ipRestrictionReviewed: Boolean(checklist.ipRestrictionReviewed),
    twoFactorEnabled: Boolean(checklist.twoFactorEnabled),
    ownerUnderstandsRealMoney: Boolean(checklist.ownerUnderstandsRealMoney),
    ownerUnderstandsProductionRisk: Boolean(checklist.ownerUnderstandsProductionRisk),
    ownerUnderstandsNoAutonomousScaling: Boolean(checklist.ownerUnderstandsNoAutonomousScaling)
  };
  const missing = [];

  if (!normalized.productionKeyReviewed) missing.push('confirm this is the intended production API key');
  if (!normalized.spotTradingEnabled) missing.push('confirm spot trading permission is enabled');
  if (!normalized.withdrawalsDisabled) missing.push('confirm withdrawals are disabled');
  if (!normalized.transfersDisabled) missing.push('confirm transfers are disabled');
  if (!normalized.marginDisabled) missing.push('confirm margin trading is disabled');
  if (!normalized.futuresDisabled) missing.push('confirm futures trading is disabled');
  if (!normalized.leverageDisabled) missing.push('confirm leverage is disabled');
  if (!normalized.ownerUnderstandsRealMoney) missing.push('confirm this can use real money after all approvals pass');
  if (!normalized.ownerUnderstandsProductionRisk) missing.push('acknowledge production trading risk');
  if (!normalized.ownerUnderstandsNoAutonomousScaling) missing.push('acknowledge autonomous scaling remains disabled');

  return { checklist: normalized, missing };
}

async function saveProductionVaultCredentials({ referenceName, connector, exchangeName, credentials, permissionsChecklist }) {
  const key = await getProductionVaultKey();
  const vault = await readProductionVaultFile();
  const now = new Date().toISOString();
  const payload = {
    exchangeName: normalizePhase6ExchangeName(exchangeName),
    connectorId: connector.id,
    apiKey: credentials.apiKey,
    apiSecret: credentials.apiSecret,
    passphrase: credentials.passphrase || '',
    bearerToken: credentials.bearerToken || '',
    permissionsChecklist,
    savedAt: now
  };

  vault.entries[referenceName] = {
    referenceName,
    exchangeName: payload.exchangeName,
    connectorId: connector.id,
    encrypted: encryptVaultPayload(referenceName, payload, key),
    metadata: {
      apiKeyFingerprint: redactValue(credentials.apiKey || credentials.bearerToken),
      hasExtraPhrase: Boolean(credentials.passphrase),
      permissionsChecklist,
      rotatedAt: now,
      productionExecutionVault: true,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      marginEnabled: false,
      futuresEnabled: false,
      leverageEnabled: false,
      automatedLiveTradingEnabled: false,
      unrestrictedAutonomousTradingEnabled: false
    }
  };

  await writeProductionVaultFile(vault);

  return {
    referenceName,
    exchangeName: payload.exchangeName,
    connectorId: connector.id,
    stored: true,
    apiKeyFingerprint: redactValue(credentials.apiKey || credentials.bearerToken),
    hasExtraPhrase: Boolean(credentials.passphrase),
    rotatedAt: now,
    secretValuesReturned: false,
    vaultPath: EXCHANGE_PRODUCTION_VAULT_PATH
  };
}

async function loadProductionVaultCredentials(referenceName) {
  const key = await getProductionVaultKey();
  const vault = await readProductionVaultFile();
  const entry = vault.entries[referenceName];

  if (!entry) {
    return null;
  }

  return decryptVaultPayload(referenceName, entry.encrypted, key);
}

async function deleteProductionVaultCredentials(referenceName) {
  const vault = await readProductionVaultFile();
  const existed = Boolean(vault.entries[referenceName]);

  if (existed) {
    delete vault.entries[referenceName];
    await writeProductionVaultFile(vault);
  }

  return { deleted: existed, referenceName };
}

async function getProductionVaultStatus(referenceName = null) {
  const vault = await readProductionVaultFile();
  const entries = referenceName
    ? Object.values(vault.entries).filter(entry => entry.referenceName === referenceName)
    : Object.values(vault.entries);

  return {
    vaultPath: EXCHANGE_PRODUCTION_VAULT_PATH,
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

function normalizeProductionSymbol(exchangeName, symbol = 'BTC/USDT') {
  const raw = String(symbol || 'BTC/USDT').trim().toUpperCase().replace('-', '/');
  const [rawBase = 'BTC', rawQuote = 'USDT'] = raw.split('/');
  const base = rawBase === 'XBT' ? 'BTC' : rawBase;
  const quote = rawQuote;
  const exchange = normalizePhase6ExchangeName(exchangeName);

  if (exchange === 'coinbase') {
    const cbQuote = quote === 'USDT' ? 'USD' : quote;
    return { canonical: `${base}/${cbQuote}`, exchangeSymbol: `${base}-${cbQuote}`, base, quote: cbQuote };
  }

  if (exchange === 'kraken') {
    const krakenBase = base === 'BTC' ? 'XBT' : base;
    return { canonical: `${base}/${quote}`, exchangeSymbol: `${krakenBase}${quote}`, base, quote };
  }

  if (exchange === 'okx') {
    return { canonical: `${base}/${quote}`, exchangeSymbol: `${base}-${quote}`, base, quote };
  }

  return { canonical: `${base}/${quote}`, exchangeSymbol: `${base}${quote}`, base, quote };
}

function normalizeProductionOrderDraft(input = {}) {
  const exchangeName = normalizePhase6ExchangeName(input.exchangeName || input.exchange || 'binance');
  const adapter = getProductionAdapter(exchangeName);
  const symbol = normalizeProductionSymbol(exchangeName, input.symbol || 'BTC/USDT');
  const requestedOrderType = String(input.orderType || input.type || 'limit').trim().toLowerCase().replace('-', '_');
  const orderType = ['market', 'limit', 'post_only', 'ioc'].includes(requestedOrderType) ? requestedOrderType : 'limit';
  const side = String(input.side || 'buy').trim().toLowerCase() === 'sell' ? 'sell' : 'buy';
  const quantity = Math.max(0, Number(input.quantity || input.baseSize || 0));
  const limitPrice = Number(input.limitPrice || input.price || 0);
  const quoteSize = Math.max(0, Number(input.quoteSize || input.notionalUsd || 0));
  const notionalUsd = quoteSize > 0
    ? quoteSize
    : quantity > 0 && limitPrice > 0
      ? quantity * limitPrice
      : Math.max(0, Number(input.notionalUsd || 0));
  const clientOrderId = String(input.clientOrderId || `ethprod${crypto.randomBytes(8).toString('hex')}`)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);
  const strategyId = input.strategyId === null || input.strategyId === undefined || input.strategyId === ''
    ? null
    : Number(input.strategyId);

  return {
    exchangeName,
    displayName: adapter?.displayName || exchangeName,
    symbol: symbol.canonical,
    exchangeSymbol: symbol.exchangeSymbol,
    baseAsset: symbol.base,
    quoteAsset: symbol.quote,
    side,
    orderType,
    quantity,
    limitPrice: Number.isFinite(limitPrice) ? limitPrice : 0,
    quoteSize,
    notionalUsd,
    maxOrderUsd: Math.max(0, Number(input.maxOrderUsd || input.maxTestOrderUsd || notionalUsd || DEFAULT_PHASE6_POLICY.maxOrderSizeUsd)),
    clientOrderId,
    strategyId,
    strategyLabel: String(input.strategyLabel || (strategyId ? `Strategy ${strategyId}` : 'Manual controlled production test')),
    marketType: 'spot',
    leverage: 1,
    marginEnabled: false,
    futuresEnabled: false,
    walletSigningEnabled: false,
    automated: false
  };
}

function createProductionOrderFingerprint(order = {}) {
  return [
    'production',
    order.exchangeName,
    order.symbol,
    order.side,
    order.orderType,
    Number(order.quantity || 0).toFixed(12),
    Number(order.limitPrice || 0).toFixed(8),
    Number(order.notionalUsd || 0).toFixed(2)
  ].join(':');
}

function normalizeProductionLifecycleStatus(rawStatus) {
  const status = String(rawStatus || '').trim().toLowerCase();
  if (['new', 'open', 'live', 'accepted'].includes(status)) return 'accepted';
  if (['partially_filled', 'partially-filled', 'partiallyfilled', 'partially filled'].includes(status)) return 'partially_filled';
  if (['filled', 'done', 'closed', 'success'].includes(status)) return 'filled';
  if (['canceled', 'cancelled'].includes(status)) return 'canceled';
  if (['expired'].includes(status)) return 'expired';
  if (['rejected', 'failed', 'failure'].includes(status)) return 'rejected';
  return status || 'submitted';
}

function roundToDecimals(value, decimals) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** Number(decimals || 0);
  return Math.floor(number * factor) / factor;
}

function validateProductionPrecision(order, adapter = null) {
  const precision = adapter?.precisionModel || {};
  const quantity = roundToDecimals(order.quantity, precision.quantityDecimals ?? 8);
  const limitPrice = order.limitPrice > 0 ? roundToDecimals(order.limitPrice, precision.priceDecimals ?? 2) : 0;
  const notional = order.notionalUsd || (quantity * limitPrice);
  const errors = [];

  if (quantity <= 0 && order.orderType !== 'market') {
    errors.push('quantity must be greater than zero for this order type');
  }
  if (quantity > 0 && quantity < Number(precision.minQuantity || 0)) {
    errors.push(`quantity is below ${adapter?.displayName || 'exchange'} minimum`);
  }
  if (notional > 0 && notional < Number(precision.minNotionalUsd || 0)) {
    errors.push(`order value is below ${adapter?.displayName || 'exchange'} minimum notional`);
  }
  if (order.orderType !== 'market' && limitPrice <= 0) {
    errors.push('limit price is required for limit/post-only/IOC orders');
  }

  return {
    passed: errors.length === 0,
    errors,
    normalized: {
      ...order,
      quantity,
      limitPrice,
      notionalUsd: notional
    }
  };
}

function createProductionSafetyBoundary(passed = false) {
  return {
    phase6ProductionInfrastructureImplemented: true,
    productionOrderEndpointEnabled: Boolean(passed),
    productionOrderEndpointCalled: false,
    liveTradingEnabled: Boolean(passed),
    automatedLiveTradingEnabled: false,
    unrestrictedAutonomousTradingEnabled: false,
    walletSigningEnabled: false,
    withdrawalsEnabled: false,
    marginEnabled: false,
    futuresEnabled: false,
    leverageEnabled: false,
    oneOwnerApprovedOrderOnly: Boolean(passed)
  };
}

function approvalIsActive(approval = {}) {
  if (!approval || approval.status !== 'active') return false;
  if (!approval.expires_at) return true;
  return Date.parse(approval.expires_at) > Date.now();
}

function findApproval(approvals = [], scopeType, scopeValue = '') {
  const normalizedScope = String(scopeValue || '').trim().toLowerCase();
  return approvals.find(approval => (
    approval.scope_type === scopeType
      && approvalIsActive(approval)
      && String(approval.scope_value || '').trim().toLowerCase() === normalizedScope
  )) || null;
}

function evaluateProductionOrderSafety({
  order,
  adapter = null,
  connector = null,
  credentials = null,
  productionPermission = null,
  riskProfile = null,
  sandboxEvidence = [],
  tinyLiveEvidence = [],
  approvals = [],
  marketContext = {},
  accountContext = {},
  recentOrderFingerprints = [],
  ownerConfirmation = '',
  policy = {}
}) {
  const effectivePolicy = { ...DEFAULT_PHASE6_POLICY, ...(policy || {}) };
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
  const orderFingerprint = createProductionOrderFingerprint(order);
  const precision = validateProductionPrecision(order, adapter);
  const orderNotional = Number(order.notionalUsd || (order.quantity * order.limitPrice) || order.quoteSize || 0);
  const riskMaxOrder = Number(riskProfile?.max_order_value || effectivePolicy.maxOrderSizeUsd || 0);
  const maxOrderSize = Math.min(
    Number(effectivePolicy.maxOrderSizeUsd || 0),
    Number(order.maxOrderUsd || effectivePolicy.maxOrderSizeUsd || 0),
    riskMaxOrder > 0 ? riskMaxOrder : Number(effectivePolicy.maxOrderSizeUsd || 0)
  );
  const sandboxComplete = sandboxEvidence.some(test => (
    test.exchange_name === order.exchangeName
      && ['accepted', 'filled', 'canceled', 'reconciled'].includes(String(test.status || '').toLowerCase())
  ));
  const tinyLiveComplete = tinyLiveEvidence.some(test => (
    test.exchange_name === order.exchangeName
      && ['accepted', 'filled', 'canceled', 'reconciled'].includes(String(test.status || '').toLowerCase())
  ));
  const liveApproval = findApproval(approvals, 'enable_live_trading', 'global');
  const exchangeApproval = findApproval(approvals, 'enable_exchange', order.exchangeName);
  const strategyApproval = findApproval(approvals, 'enable_strategy', order.strategyId ? String(order.strategyId) : 'manual');
  const symbolApproval = findApproval(approvals, 'enable_symbol', `${order.exchangeName}:${order.symbol}`) || findApproval(approvals, 'enable_symbol', order.symbol);
  const capitalApproval = approvals
    .filter(approval => approval.scope_type === 'increase_capital_limits' && approvalIsActive(approval))
    .sort((a, b) => Number(b.capital_limit_usd || 0) - Number(a.capital_limit_usd || 0))[0] || null;
  const capitalLimitUsd = Math.min(
    Number(capitalApproval?.capital_limit_usd || effectivePolicy.maxCapitalExposureUsd || 0),
    Number(effectivePolicy.maxCapitalExposureUsd || 0)
  );
  const exchangeExposureUsd = Number(accountContext.exchangeExposureUsd || 0);
  const strategyExposureUsd = Number(accountContext.strategyExposureUsd || 0);
  const dailyDrawdownUsd = Number(accountContext.dailyDrawdownUsd || 0);
  const rollingLossUsd = Number(accountContext.rollingLossUsd || 0);
  const repeatedFailures = Number(accountContext.repeatedFailures || 0);
  const volatilityPercent = Number(marketContext.volatilityPercent ?? 0);
  const netSpreadPercent = Number(marketContext.netSpreadPercent ?? marketContext.spreadPercent ?? 0);
  const slippagePercent = Number(marketContext.slippagePercent ?? 0.05);
  const liquidityUsd = Number(marketContext.liquidityUsd ?? 1000000);
  const latencyMs = Number(marketContext.latencyMs ?? 250);
  const priceTimestamp = marketContext.priceTimestamp ? Date.parse(marketContext.priceTimestamp) : Date.now();
  const priceAgeMs = Date.now() - priceTimestamp;
  const permissions = credentials?.permissionsChecklist || {};

  addCheck(
    'production_adapter_ready',
    'Production exchange adapter exists',
    adapter?.adapterStatus === 'production_route_ready_locked',
    adapter ? `${adapter.displayName} production adapter is implemented but locked behind approvals.` : 'No production adapter exists for this exchange.',
    'Choose Binance, Coinbase Advanced, Kraken, OKX, or Bybit.'
  );
  addCheck(
    'spot_only',
    'Spot trading only',
    order.marketType === 'spot'
      && order.leverage === 1
      && order.marginEnabled === false
      && order.futuresEnabled === false,
    'Phase 6 production execution is spot-only. No leverage, margin, futures, or wallet signing.',
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
    'production_credentials',
    'Production API key is saved in the encrypted local vault',
    Boolean(credentials?.apiKey || credentials?.bearerToken),
    credentials?.apiKey || credentials?.bearerToken
      ? 'Production credentials were loaded from the encrypted local vault. Secret values were not returned to the UI.'
      : 'No production API key is saved for this connector.',
    'Save a production spot API key through the local vault panel.'
  );
  addCheck(
    'exchange_connectivity_verified',
    'Production exchange connectivity verified',
    productionPermission?.status === 'production_account_verified',
    productionPermission?.plainEnglishStatus || 'Production account connectivity has not been verified yet.',
    'Click Test Production Connection.'
  );
  addCheck(
    'withdrawals_disabled',
    'Withdrawals and transfers are disabled',
    permissions.withdrawalsDisabled === true
      && permissions.transfersDisabled === true
      && productionPermission?.canWithdraw !== true,
    productionPermission?.canWithdraw === false
      ? 'Production permission review reports withdrawals disabled.'
      : 'Withdrawal-disabled verification has not passed.',
    'Disable withdrawals/transfers on the exchange API key, then test again.'
  );
  addCheck(
    'no_margin_futures_leverage',
    'No margin, futures, or leverage',
    permissions.marginDisabled === true
      && permissions.futuresDisabled === true
      && permissions.leverageDisabled === true
      && productionPermission?.marginDetected !== true
      && productionPermission?.futuresDetected !== true,
    'The production key must be spot-only.',
    'Remove margin/futures/leverage permissions.'
  );
  addCheck(
    'sandbox_validation',
    'Sandbox validation completed',
    !effectivePolicy.requireSandboxValidation || sandboxComplete || tinyLiveComplete,
    sandboxComplete || tinyLiveComplete
      ? 'Prior sandbox/tiny-live evidence exists for this exchange.'
      : 'No successful sandbox or tiny-live lifecycle exists for this exchange.',
    'Run sandbox/testnet validation before production.'
  );
  addCheck(
    'global_live_approval',
    'Owner approved live trading globally',
    Boolean(liveApproval),
    liveApproval ? 'Global live approval is active.' : 'Global production live approval has not been recorded.',
    'Record global live approval with the typed confirmation phrase.'
  );
  addCheck(
    'exchange_approval',
    'Owner approved this exchange',
    Boolean(exchangeApproval),
    exchangeApproval ? `${adapter?.displayName || order.exchangeName} approval is active.` : 'This exchange is not approved for production execution.',
    'Record exchange approval.'
  );
  addCheck(
    'strategy_approval',
    'Owner approved this strategy/manual test',
    Boolean(strategyApproval),
    strategyApproval ? 'Strategy/manual-production approval is active.' : 'This strategy or manual order path is not approved.',
    'Record strategy approval.'
  );
  addCheck(
    'symbol_approval',
    'Owner approved this symbol',
    Boolean(symbolApproval),
    symbolApproval ? `${order.symbol} approval is active.` : 'This symbol is not approved for production execution.',
    'Record symbol approval.'
  );
  addCheck(
    'capital_limit_approval',
    'Owner approved capital limit',
    Boolean(capitalApproval) && orderNotional <= capitalLimitUsd,
    capitalApproval
      ? `Approved capital limit is $${capitalLimitUsd.toFixed(2)}. Order value is about $${orderNotional.toFixed(2)}.`
      : 'No capital-limit approval exists.',
    'Record or lower capital limit approval.'
  );
  addCheck(
    'risk_profile_active',
    'Risk profile is active',
    Boolean(riskProfile?.id) && riskProfile?.status === 'active',
    riskProfile?.id ? 'Active risk profile found.' : 'No active risk profile exists.',
    'Activate a risk profile.'
  );
  addCheck(
    'kill_switch_off',
    'Kill switch is off',
    Boolean(riskProfile?.id) && Number(riskProfile?.kill_switch_enabled || 0) === 0,
    Number(riskProfile?.kill_switch_enabled || 0) === 0 ? 'Kill switch is off.' : 'Kill switch is on.',
    'Only turn the kill switch off when ready for a controlled manual production test.'
  );
  addCheck(
    'max_order_size',
    'Max order size passed',
    orderNotional > 0 && maxOrderSize > 0 && orderNotional <= maxOrderSize,
    `Order value is about $${orderNotional.toFixed(2)}. Max allowed is $${maxOrderSize.toFixed(2)}.`,
    'Lower the order amount.'
  );
  addCheck(
    'max_capital_exposure',
    'Max capital exposure passed',
    exchangeExposureUsd + orderNotional <= Number(effectivePolicy.maxCapitalExposureUsd || 0),
    `Current modeled capital exposure is $${exchangeExposureUsd.toFixed(2)}. Limit is $${Number(effectivePolicy.maxCapitalExposureUsd || 0).toFixed(2)}.`,
    'Reduce exposure before placing another production order.'
  );
  addCheck(
    'max_exchange_exposure',
    'Max exchange exposure passed',
    exchangeExposureUsd + orderNotional <= Number(effectivePolicy.maxExchangeExposureUsd || 0),
    `Exchange exposure after this order would be about $${(exchangeExposureUsd + orderNotional).toFixed(2)}.`,
    'Move to a smaller order or lower exchange exposure.'
  );
  addCheck(
    'max_strategy_exposure',
    'Max strategy exposure passed',
    strategyExposureUsd + orderNotional <= Number(effectivePolicy.maxStrategyExposureUsd || 0),
    `Strategy exposure after this order would be about $${(strategyExposureUsd + orderNotional).toFixed(2)}.`,
    'Reduce strategy exposure.'
  );
  addCheck(
    'drawdown_limit',
    'Daily drawdown limit passed',
    dailyDrawdownUsd <= Number(effectivePolicy.maxDailyDrawdownUsd || 0),
    `Modeled daily drawdown is $${dailyDrawdownUsd.toFixed(2)}. Limit is $${Number(effectivePolicy.maxDailyDrawdownUsd || 0).toFixed(2)}.`,
    'Stop trading for the day.'
  );
  addCheck(
    'rolling_loss_limit',
    'Rolling loss limit passed',
    rollingLossUsd <= Number(effectivePolicy.rollingLossLimitUsd || 0),
    `Modeled rolling loss is $${rollingLossUsd.toFixed(2)}. Limit is $${Number(effectivePolicy.rollingLossLimitUsd || 0).toFixed(2)}.`,
    'Pause production execution.'
  );
  addCheck(
    'volatility_shutdown',
    'Volatility shutdown not triggered',
    volatilityPercent <= Number(effectivePolicy.maxVolatilityPercent || 0),
    `Modeled volatility is ${volatilityPercent.toFixed(2)}%. Limit is ${Number(effectivePolicy.maxVolatilityPercent || 0).toFixed(2)}%.`,
    'Wait for volatility to normalize.'
  );
  addCheck(
    'spread_validation',
    'Spread validation passed',
    netSpreadPercent >= Number(effectivePolicy.minNetSpreadPercent || 0),
    `Modeled net spread is ${netSpreadPercent.toFixed(4)}%. Minimum is ${Number(effectivePolicy.minNetSpreadPercent || 0).toFixed(4)}%.`,
    'Wait for a better spread.'
  );
  addCheck(
    'slippage_validation',
    'Slippage validation passed',
    slippagePercent <= Number(effectivePolicy.maxSlippagePercent || 0),
    `Modeled slippage is ${slippagePercent.toFixed(4)}%. Limit is ${Number(effectivePolicy.maxSlippagePercent || 0).toFixed(4)}%.`,
    'Use a more liquid venue/pair.'
  );
  addCheck(
    'stale_market_shutdown',
    'Market price is fresh',
    priceAgeMs <= Number(effectivePolicy.maxPriceAgeMs || 0),
    `Price age is ${Math.max(0, priceAgeMs)}ms. Limit is ${Number(effectivePolicy.maxPriceAgeMs || 0)}ms.`,
    'Refresh market data and preview again.'
  );
  addCheck(
    'liquidity_shutdown',
    'Liquidity check passed',
    liquidityUsd >= Number(effectivePolicy.minLiquidityUsd || 0),
    `Modeled liquidity is $${liquidityUsd.toFixed(2)}. Minimum is $${Number(effectivePolicy.minLiquidityUsd || 0).toFixed(2)}.`,
    'Use a more liquid pair.'
  );
  addCheck(
    'latency_threshold',
    'Latency threshold passed',
    latencyMs <= Number(effectivePolicy.maxLatencyMs || 0),
    `Modeled latency is ${latencyMs.toFixed(0)}ms. Limit is ${Number(effectivePolicy.maxLatencyMs || 0)}ms.`,
    'Wait for exchange/network health to improve.'
  );
  addCheck(
    'precision_lot_size',
    'Precision and lot-size validation passed',
    precision.passed,
    precision.passed ? 'Order amount and price pass local precision checks.' : precision.errors.join('; '),
    'Adjust quantity, price, or order amount.'
  );
  addCheck(
    'duplicate_order_prevention',
    'Duplicate order prevention passed',
    !recentOrderFingerprints.includes(orderFingerprint),
    recentOrderFingerprints.includes(orderFingerprint)
      ? 'An identical production order was attempted recently.'
      : 'No duplicate production order fingerprint was found.',
    'Change the order or wait before retrying.'
  );
  addCheck(
    'repeated_failure_shutdown',
    'Repeated failure shutdown not triggered',
    repeatedFailures < Number(effectivePolicy.repeatedFailureDisableThreshold || 0),
    `Recent failure count is ${repeatedFailures}. Auto-disable threshold is ${Number(effectivePolicy.repeatedFailureDisableThreshold || 0)}.`,
    'Use emergency stop and review failures.'
  );
  addCheck(
    'production_dry_run',
    'Production dry-run checks passed',
    marketContext.productionDryRunPassed === true || marketContext.dryRunPassed === true,
    marketContext.productionDryRunPassed === true || marketContext.dryRunPassed === true
      ? 'Production dry-run validation passed.'
      : 'Production dry-run validation has not passed.',
    'Run production preview/dry-run before placing.'
  );
  addCheck(
    'manual_order_confirmation',
    'Manual owner order confirmation typed',
    String(ownerConfirmation || '').trim() === PHASE6_ORDER_CONFIRMATION_PHRASE,
    String(ownerConfirmation || '').trim() === PHASE6_ORDER_CONFIRMATION_PHRASE
      ? 'Owner typed the required order confirmation phrase.'
      : `Type exactly: ${PHASE6_ORDER_CONFIRMATION_PHRASE}`,
    'Type the exact order confirmation phrase.'
  );
  addCheck(
    'autonomy_restricted',
    'Autonomous scaling remains disabled',
    effectivePolicy.automatedLiveTradingEnabled === false
      && effectivePolicy.unrestrictedAutonomousTradingEnabled === false
      && effectivePolicy.walletSigningEnabled === false
      && effectivePolicy.withdrawalsEnabled === false
      && effectivePolicy.marginEnabled === false
      && effectivePolicy.futuresEnabled === false
      && effectivePolicy.leverageEnabled === false,
    'Production order routing remains manual and owner-gated. No withdrawals, wallet signing, leverage, margin, futures, or autonomous scaling.',
    'No action needed.'
  );

  const passed = checks.every(check => check.passed);

  return {
    passed,
    status: passed ? 'ready_for_controlled_production_order' : 'locked',
    safeToSubmit: passed,
    checks,
    orderFingerprint,
    normalizedOrder: precision.normalized,
    missing: checks.filter(check => !check.passed),
    nextClick: passed
      ? 'Click Place Controlled Production Order.'
      : checks.find(check => !check.passed)?.nextAction || 'Fix the blocked production safety gate.',
    plainEnglishStatus: passed
      ? 'All production safety gates passed for one manually approved spot order. Automated trading remains disabled.'
      : 'Production execution is locked until every approval, risk, market, and capital gate passes.',
    safetyBoundary: createProductionSafetyBoundary(passed)
  };
}

function createProductionOrderPreview({ order, safety, adapter = null, productionPermission = null }) {
  return {
    exchange: adapter?.displayName || order.displayName,
    symbol: order.symbol,
    exchangeSymbol: order.exchangeSymbol,
    side: order.side,
    orderType: order.orderType,
    marketType: 'spot',
    notionalUsd: order.notionalUsd,
    maxOrderUsd: order.maxOrderUsd,
    quantity: order.quantity,
    limitPrice: order.limitPrice || null,
    clientOrderId: order.clientOrderId,
    orderFingerprint: safety.orderFingerprint,
    safeToSubmit: safety.safeToSubmit,
    status: safety.status,
    nextClick: safety.nextClick,
    productionPermission: productionPermission
      ? {
        status: productionPermission.status,
        canTrade: productionPermission.canTrade,
        canWithdraw: productionPermission.canWithdraw,
        spotAllowed: productionPermission.spotAllowed,
        marginDetected: productionPermission.marginDetected,
        futuresDetected: productionPermission.futuresDetected,
        plainEnglishStatus: productionPermission.plainEnglishStatus
      }
      : null,
    warning: 'This can place a real production spot order only after all gates pass and the owner types the final order phrase.'
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
    const error = new Error(body?.msg || body?.retMsg || body?.message || body?.error || body?.raw || `HTTP ${response.status}`);
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

function mapOkxOrderType(order) {
  if (order.orderType === 'market') return 'market';
  if (order.orderType === 'post_only') return 'post_only';
  if (order.orderType === 'ioc') return 'ioc';
  return 'limit';
}

function mapBybitOrderType(order) {
  return order.orderType === 'market' ? 'Market' : 'Limit';
}

function mapProductionTimeInForce(order) {
  if (order.orderType === 'post_only') return 'PostOnly';
  if (order.orderType === 'ioc') return 'IOC';
  return 'GTC';
}

function signOkxHeaders({ credentials, method, requestPath, body = '' }) {
  const timestamp = new Date().toISOString();
  const payload = `${timestamp}${method.toUpperCase()}${requestPath}${body}`;
  const signature = crypto.createHmac('sha256', credentials.apiSecret).update(payload).digest('base64');

  return {
    'OK-ACCESS-KEY': credentials.apiKey,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': credentials.passphrase,
    'Content-Type': 'application/json'
  };
}

function signBybitHeaders({ credentials, body = '', query = '' }) {
  const timestamp = String(Date.now());
  const recvWindow = '5000';
  const payload = `${timestamp}${credentials.apiKey}${recvWindow}${body || query}`;
  const signature = crypto.createHmac('sha256', credentials.apiSecret).update(payload).digest('hex');

  return {
    'X-BAPI-API-KEY': credentials.apiKey,
    'X-BAPI-SIGN': signature,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-RECV-WINDOW': recvWindow,
    'Content-Type': 'application/json'
  };
}

function signKrakenRequest({ credentials, requestPath, params }) {
  const postData = new URLSearchParams(params).toString();
  const nonce = String(params.nonce);
  const secret = Buffer.from(credentials.apiSecret, 'base64');
  const hash = crypto.createHash('sha256').update(nonce + postData).digest();
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(requestPath);
  hmac.update(hash);

  return {
    body: postData,
    headers: {
      'API-Key': credentials.apiKey,
      'API-Sign': hmac.digest('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
}

function base64Url(input) {
  return Buffer.from(input).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createCoinbaseBearer({ credentials, method, requestPath }) {
  if (credentials.bearerToken) return credentials.bearerToken;
  if (/^eyJ/i.test(credentials.apiKey || '')) return credentials.apiKey;
  if (!credentials.apiSecret || !/BEGIN/.test(credentials.apiSecret)) {
    throw new Error('Coinbase Advanced production execution requires an owner-supplied bearer token or CDP private key PEM.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'ES256',
    typ: 'JWT',
    kid: credentials.apiKey,
    nonce: crypto.randomBytes(16).toString('hex')
  };
  const payload = {
    sub: credentials.apiKey,
    iss: 'cdp',
    nbf: now,
    exp: now + 120,
    uri: `${method.toUpperCase()} api.coinbase.com${requestPath}`
  };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = crypto.sign('SHA256', Buffer.from(signingInput), {
    key: credentials.apiSecret,
    dsaEncoding: 'ieee-p1363'
  });

  return `${signingInput}.${base64Url(signature)}`;
}

async function testProductionExchangeConnection({ credentials, adapter }) {
  if (!credentials || !adapter) {
    return {
      status: 'not_connected',
      canTrade: false,
      canWithdraw: null,
      spotAllowed: false,
      plainEnglishStatus: 'Production credentials are not saved for this exchange.'
    };
  }

  if (adapter.exchangeName === 'binance') {
    const signed = signedQueryString({ timestamp: Date.now(), recvWindow: 5000 }, credentials.apiSecret);
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
      status: 'production_account_verified',
      exchangeName: 'binance',
      canTrade,
      canWithdraw,
      spotAllowed,
      marginDetected,
      futuresDetected,
      accountType: account.accountType || 'unknown',
      balancesVisible: Array.isArray(account.balances),
      balances: (account.balances || [])
        .filter(item => Number(item.free || 0) > 0 || Number(item.locked || 0) > 0)
        .slice(0, 20)
        .map(item => ({ asset: item.asset, free: Number(item.free || 0), locked: Number(item.locked || 0) })),
      plainEnglishStatus: canTrade && !canWithdraw && spotAllowed && !marginDetected && !futuresDetected
        ? 'Binance production key can trade spot and reports withdrawals disabled.'
        : 'Binance production key is not safe yet. Review trading, withdrawal, spot, margin, and futures signals.'
    };
  }

  if (adapter.exchangeName === 'okx') {
    const requestPath = '/api/v5/account/balance';
    const account = await fetchJson(`${adapter.baseUrl}${requestPath}`, {
      headers: signOkxHeaders({ credentials, method: 'GET', requestPath })
    });

    return {
      status: 'production_account_verified',
      exchangeName: 'okx',
      canTrade: credentials.permissionsChecklist?.spotTradingEnabled === true,
      canWithdraw: credentials.permissionsChecklist?.withdrawalsDisabled === true ? false : null,
      spotAllowed: true,
      marginDetected: credentials.permissionsChecklist?.marginDisabled !== true,
      futuresDetected: credentials.permissionsChecklist?.futuresDisabled !== true,
      balancesVisible: Array.isArray(account.data),
      balances: (account.data?.[0]?.details || []).slice(0, 20).map(item => ({
        asset: item.ccy,
        free: Number(item.availBal || 0),
        locked: Number(item.frozenBal || 0)
      })),
      plainEnglishStatus: 'OKX production account endpoint responded. Withdrawal safety is based on the owner permission checklist because OKX does not return a simple canWithdraw flag here.'
    };
  }

  if (adapter.exchangeName === 'bybit') {
    const query = new URLSearchParams({ accountType: 'UNIFIED' }).toString();
    const account = await fetchJson(`${adapter.baseUrl}/v5/account/wallet-balance?${query}`, {
      headers: signBybitHeaders({ credentials, query })
    });

    return {
      status: 'production_account_verified',
      exchangeName: 'bybit',
      canTrade: credentials.permissionsChecklist?.spotTradingEnabled === true,
      canWithdraw: credentials.permissionsChecklist?.withdrawalsDisabled === true ? false : null,
      spotAllowed: true,
      marginDetected: credentials.permissionsChecklist?.marginDisabled !== true,
      futuresDetected: credentials.permissionsChecklist?.futuresDisabled !== true,
      balancesVisible: Array.isArray(account.result?.list),
      balances: (account.result?.list?.[0]?.coin || []).slice(0, 20).map(item => ({
        asset: item.coin,
        free: Number(item.availableToWithdraw || item.walletBalance || 0),
        locked: Number(item.locked || 0)
      })),
      plainEnglishStatus: 'Bybit production account endpoint responded. Withdrawal safety is based on the owner permission checklist because Bybit does not return a simple withdrawal flag here.'
    };
  }

  if (adapter.exchangeName === 'kraken') {
    const requestPath = '/0/private/Balance';
    const params = { nonce: Date.now() };
    const signed = signKrakenRequest({ credentials, requestPath, params });
    const account = await fetchJson(`${adapter.baseUrl}${requestPath}`, {
      method: 'POST',
      headers: signed.headers,
      body: signed.body
    });

    if (Array.isArray(account.error) && account.error.length) {
      throw new Error(account.error.join('; '));
    }

    return {
      status: 'production_account_verified',
      exchangeName: 'kraken',
      canTrade: credentials.permissionsChecklist?.spotTradingEnabled === true,
      canWithdraw: credentials.permissionsChecklist?.withdrawalsDisabled === true ? false : null,
      spotAllowed: true,
      marginDetected: credentials.permissionsChecklist?.marginDisabled !== true,
      futuresDetected: credentials.permissionsChecklist?.futuresDisabled !== true,
      balancesVisible: Boolean(account.result),
      balances: Object.entries(account.result || {}).slice(0, 20).map(([asset, balance]) => ({
        asset,
        free: Number(balance || 0),
        locked: 0
      })),
      plainEnglishStatus: 'Kraken production balance endpoint responded. Withdrawal safety is based on the owner permission checklist and Kraken API-key permission setup.'
    };
  }

  if (adapter.exchangeName === 'coinbase') {
    const requestPath = '/api/v3/brokerage/accounts';
    const bearer = createCoinbaseBearer({ credentials, method: 'GET', requestPath });
    const account = await fetchJson(`${adapter.baseUrl}${requestPath}`, {
      headers: { Authorization: `Bearer ${bearer}` }
    });

    return {
      status: 'production_account_verified',
      exchangeName: 'coinbase',
      canTrade: credentials.permissionsChecklist?.spotTradingEnabled === true,
      canWithdraw: credentials.permissionsChecklist?.withdrawalsDisabled === true ? false : null,
      spotAllowed: true,
      marginDetected: false,
      futuresDetected: credentials.permissionsChecklist?.futuresDisabled !== true,
      balancesVisible: Array.isArray(account.accounts),
      balances: (account.accounts || []).slice(0, 20).map(item => ({
        asset: item.currency,
        free: Number(item.available_balance?.value || 0),
        locked: Number(item.hold?.value || 0)
      })),
      plainEnglishStatus: 'Coinbase Advanced account endpoint responded. Withdrawal/transfer safety is based on the owner permission checklist and Coinbase API-key scope.'
    };
  }

  return {
    status: 'not_supported',
    canTrade: false,
    canWithdraw: null,
    spotAllowed: false,
    plainEnglishStatus: `${adapter.displayName} production connection test is not implemented yet.`
  };
}

async function getBinanceBalances({ credentials, adapter }) {
  const signed = signedQueryString({ timestamp: Date.now(), recvWindow: 5000 }, credentials.apiSecret);
  const account = await fetchJson(`${adapter.baseUrl}/api/v3/account?${signed}`, {
    headers: { 'X-MBX-APIKEY': credentials.apiKey }
  });

  return (account.balances || [])
    .filter(item => Number(item.free || 0) > 0 || Number(item.locked || 0) > 0)
    .slice(0, 25)
    .map(item => ({ asset: item.asset, free: Number(item.free || 0), locked: Number(item.locked || 0) }));
}

async function submitBinanceProductionOrder({ order, credentials, adapter }) {
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
  const exchangeOrderId = placed.orderId ? String(placed.orderId) : '';
  const status = exchangeOrderId
    ? await queryProductionOrderStatus({ order, credentials, adapter, exchangeOrderId })
    : placed;
  const afterBalances = await getBinanceBalances({ credentials, adapter }).catch(() => []);

  return normalizeProductionLifecycleResult({ order, adapter, placed, status, exchangeOrderId, beforeBalances, afterBalances });
}

async function submitOkxProductionOrder({ order, credentials, adapter }) {
  const requestPath = '/api/v5/trade/order';
  const body = JSON.stringify({
    instId: order.exchangeSymbol,
    tdMode: 'cash',
    clOrdId: order.clientOrderId,
    side: order.side,
    ordType: mapOkxOrderType(order),
    sz: String(order.quantity || order.quoteSize || order.notionalUsd),
    ...(order.limitPrice > 0 && order.orderType !== 'market' ? { px: String(order.limitPrice) } : {}),
    ...(order.orderType === 'market' && order.side === 'buy' ? { tgtCcy: 'quote_ccy' } : {})
  });
  const placed = await fetchJson(`${adapter.baseUrl}${requestPath}`, {
    method: 'POST',
    headers: signOkxHeaders({ credentials, method: 'POST', requestPath, body }),
    body
  });
  const exchangeOrderId = placed.data?.[0]?.ordId || '';
  const status = exchangeOrderId
    ? await queryProductionOrderStatus({ order, credentials, adapter, exchangeOrderId })
    : placed;

  return normalizeProductionLifecycleResult({ order, adapter, placed, status, exchangeOrderId });
}

async function submitBybitProductionOrder({ order, credentials, adapter }) {
  const requestPath = '/v5/order/create';
  const body = JSON.stringify({
    category: 'spot',
    symbol: order.exchangeSymbol,
    side: order.side === 'buy' ? 'Buy' : 'Sell',
    orderType: mapBybitOrderType(order),
    qty: String(order.quantity || order.quoteSize || order.notionalUsd),
    orderLinkId: order.clientOrderId,
    ...(order.limitPrice > 0 && order.orderType !== 'market' ? { price: String(order.limitPrice) } : {}),
    ...(order.orderType !== 'market' ? { timeInForce: mapProductionTimeInForce(order) } : {})
  });
  const placed = await fetchJson(`${adapter.baseUrl}${requestPath}`, {
    method: 'POST',
    headers: signBybitHeaders({ credentials, body }),
    body
  });
  const exchangeOrderId = placed.result?.orderId || '';
  const status = exchangeOrderId
    ? await queryProductionOrderStatus({ order, credentials, adapter, exchangeOrderId })
    : placed;

  return normalizeProductionLifecycleResult({ order, adapter, placed, status, exchangeOrderId });
}

async function submitKrakenProductionOrder({ order, credentials, adapter }) {
  const requestPath = '/0/private/AddOrder';
  const params = {
    nonce: Date.now(),
    pair: order.exchangeSymbol,
    type: order.side,
    ordertype: order.orderType === 'market' ? 'market' : 'limit',
    volume: String(order.quantity),
    userref: Math.abs(crypto.createHash('sha256').update(order.clientOrderId).digest().readInt32BE(0)),
    ...(order.orderType !== 'market' && order.limitPrice > 0 ? { price: String(order.limitPrice) } : {}),
    ...(order.orderType === 'post_only' ? { oflags: 'post' } : {}),
    ...(order.orderType === 'ioc' ? { timeinforce: 'IOC' } : {})
  };
  const signed = signKrakenRequest({ credentials, requestPath, params });
  const placed = await fetchJson(`${adapter.baseUrl}${requestPath}`, {
    method: 'POST',
    headers: signed.headers,
    body: signed.body
  });

  if (Array.isArray(placed.error) && placed.error.length) {
    throw new Error(placed.error.join('; '));
  }

  const exchangeOrderId = placed.result?.txid?.[0] || '';
  const status = exchangeOrderId
    ? await queryProductionOrderStatus({ order, credentials, adapter, exchangeOrderId })
    : placed;

  return normalizeProductionLifecycleResult({ order, adapter, placed, status, exchangeOrderId });
}

async function submitCoinbaseProductionOrder({ order, credentials, adapter }) {
  const requestPath = '/api/v3/brokerage/orders';
  const bodyObject = {
    client_order_id: order.clientOrderId,
    product_id: order.exchangeSymbol,
    side: order.side.toUpperCase(),
    order_configuration: order.orderType === 'market'
      ? {
          market_market_ioc: order.quoteSize > 0
            ? { quote_size: String(order.quoteSize) }
            : { base_size: String(order.quantity) }
        }
      : {
          limit_limit_gtc: {
            base_size: String(order.quantity),
            limit_price: String(order.limitPrice),
            post_only: order.orderType === 'post_only'
          }
        }
  };
  const body = JSON.stringify(bodyObject);
  const bearer = createCoinbaseBearer({ credentials, method: 'POST', requestPath });
  const placed = await fetchJson(`${adapter.baseUrl}${requestPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearer}`,
      'Content-Type': 'application/json'
    },
    body
  });
  const exchangeOrderId = placed.success_response?.order_id || placed.order_id || '';
  const status = exchangeOrderId
    ? await queryProductionOrderStatus({ order, credentials, adapter, exchangeOrderId })
    : placed;

  return normalizeProductionLifecycleResult({ order, adapter, placed, status, exchangeOrderId });
}

function normalizeProductionLifecycleResult({
  order,
  adapter,
  placed = {},
  status = {},
  exchangeOrderId = '',
  beforeBalances = [],
  afterBalances = []
}) {
  const rawStatus = status.status
    || status.data?.[0]?.state
    || status.result?.list?.[0]?.orderStatus
    || status.result?.[exchangeOrderId]?.status
    || status.order?.status
    || placed.status
    || (placed.data?.[0]?.sCode === '0' ? 'accepted' : 'submitted');
  const lifecycleStatus = normalizeProductionLifecycleStatus(rawStatus);

  return {
    status: lifecycleStatus,
    exchangeOrderId,
    placed,
    orderStatus: status,
    reconciliation: {
      beforeBalances,
      afterBalances,
      status: afterBalances.length ? 'balances_reconciled' : 'balance_reconciliation_pending'
    },
    resultScreen: {
      exchange: adapter.displayName,
      symbol: order.symbol,
      orderType: order.orderType,
      notionalUsd: order.notionalUsd,
      entryPrice: order.limitPrice || null,
      fillStatus: lifecycleStatus,
      fees: estimateProductionFees(order),
      exchangeOrderId,
      rejectionReason: lifecycleStatus === 'rejected' ? 'Exchange rejected the production order.' : ''
    },
    safetyBoundary: {
      ...createProductionSafetyBoundary(true),
      productionOrderEndpointCalled: true,
      productionOrderEndpointEnabled: true,
      automatedLiveTradingEnabled: false,
      unrestrictedAutonomousTradingEnabled: false
    }
  };
}

function estimateProductionFees(order) {
  return Number(((Number(order.notionalUsd || 0) * 0.001)).toFixed(8));
}

async function runProductionOrderLifecycle({ order, credentials, adapter }) {
  if (!adapter || adapter.adapterStatus !== 'production_route_ready_locked') {
    throw new Error(`${adapter?.displayName || order.exchangeName} production adapter is not available.`);
  }

  if (adapter.exchangeName === 'binance') return submitBinanceProductionOrder({ order, credentials, adapter });
  if (adapter.exchangeName === 'okx') return submitOkxProductionOrder({ order, credentials, adapter });
  if (adapter.exchangeName === 'bybit') return submitBybitProductionOrder({ order, credentials, adapter });
  if (adapter.exchangeName === 'kraken') return submitKrakenProductionOrder({ order, credentials, adapter });
  if (adapter.exchangeName === 'coinbase') return submitCoinbaseProductionOrder({ order, credentials, adapter });

  throw new Error(`${adapter.displayName} production execution is not implemented.`);
}

async function queryProductionOrderStatus({ order, credentials, adapter, exchangeOrderId }) {
  if (adapter.exchangeName === 'binance') {
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

  if (adapter.exchangeName === 'okx') {
    const requestPath = `/api/v5/trade/order?instId=${encodeURIComponent(order.exchangeSymbol)}&ordId=${encodeURIComponent(exchangeOrderId)}`;
    return fetchJson(`${adapter.baseUrl}${requestPath}`, {
      headers: signOkxHeaders({ credentials, method: 'GET', requestPath })
    });
  }

  if (adapter.exchangeName === 'bybit') {
    const query = new URLSearchParams({
      category: 'spot',
      symbol: order.exchangeSymbol,
      ...(exchangeOrderId ? { orderId: exchangeOrderId } : { orderLinkId: order.clientOrderId })
    }).toString();
    return fetchJson(`${adapter.baseUrl}/v5/order/realtime?${query}`, {
      headers: signBybitHeaders({ credentials, query })
    });
  }

  if (adapter.exchangeName === 'kraken') {
    const requestPath = '/0/private/QueryOrders';
    const params = { nonce: Date.now(), txid: exchangeOrderId };
    const signed = signKrakenRequest({ credentials, requestPath, params });
    return fetchJson(`${adapter.baseUrl}${requestPath}`, {
      method: 'POST',
      headers: signed.headers,
      body: signed.body
    });
  }

  if (adapter.exchangeName === 'coinbase') {
    const requestPath = `/api/v3/brokerage/orders/historical/${encodeURIComponent(exchangeOrderId)}`;
    const bearer = createCoinbaseBearer({ credentials, method: 'GET', requestPath });
    return fetchJson(`${adapter.baseUrl}${requestPath}`, {
      headers: { Authorization: `Bearer ${bearer}` }
    });
  }

  throw new Error(`${adapter.displayName} production status adapter is not implemented.`);
}

async function cancelProductionOrder({ order, credentials, adapter, exchangeOrderId }) {
  let canceled = null;

  if (adapter.exchangeName === 'binance') {
    const signed = signedQueryString({
      symbol: order.exchangeSymbol,
      ...(exchangeOrderId ? { orderId: exchangeOrderId } : { origClientOrderId: order.clientOrderId }),
      timestamp: Date.now(),
      recvWindow: 5000
    }, credentials.apiSecret);
    canceled = await fetchJson(`${adapter.baseUrl}/api/v3/order?${signed}`, {
      method: 'DELETE',
      headers: { 'X-MBX-APIKEY': credentials.apiKey }
    });
  } else if (adapter.exchangeName === 'okx') {
    const requestPath = '/api/v5/trade/cancel-order';
    const body = JSON.stringify({ instId: order.exchangeSymbol, ordId: exchangeOrderId });
    canceled = await fetchJson(`${adapter.baseUrl}${requestPath}`, {
      method: 'POST',
      headers: signOkxHeaders({ credentials, method: 'POST', requestPath, body }),
      body
    });
  } else if (adapter.exchangeName === 'bybit') {
    const requestPath = '/v5/order/cancel';
    const body = JSON.stringify({
      category: 'spot',
      symbol: order.exchangeSymbol,
      ...(exchangeOrderId ? { orderId: exchangeOrderId } : { orderLinkId: order.clientOrderId })
    });
    canceled = await fetchJson(`${adapter.baseUrl}${requestPath}`, {
      method: 'POST',
      headers: signBybitHeaders({ credentials, body }),
      body
    });
  } else if (adapter.exchangeName === 'kraken') {
    const requestPath = '/0/private/CancelOrder';
    const params = { nonce: Date.now(), txid: exchangeOrderId };
    const signed = signKrakenRequest({ credentials, requestPath, params });
    canceled = await fetchJson(`${adapter.baseUrl}${requestPath}`, {
      method: 'POST',
      headers: signed.headers,
      body: signed.body
    });
  } else if (adapter.exchangeName === 'coinbase') {
    const requestPath = '/api/v3/brokerage/orders/batch_cancel';
    const body = JSON.stringify({ order_ids: [exchangeOrderId] });
    const bearer = createCoinbaseBearer({ credentials, method: 'POST', requestPath });
    canceled = await fetchJson(`${adapter.baseUrl}${requestPath}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body
    });
  } else {
    throw new Error(`${adapter.displayName} production cancel adapter is not implemented.`);
  }

  return {
    status: normalizeProductionLifecycleStatus(canceled.status || (canceled.data?.[0]?.sCode === '0' ? 'canceled' : 'canceled')),
    canceled,
    resultScreen: {
      exchange: adapter.displayName,
      symbol: order.symbol,
      orderType: order.orderType,
      notionalUsd: order.notionalUsd,
      fillStatus: 'canceled',
      exchangeOrderId,
      rejectionReason: ''
    },
    safetyBoundary: createProductionSafetyBoundary(false)
  };
}

function buildPhase6ApprovalCenter({
  connectors = [],
  vaultStatus = null,
  approvals = [],
  latestOrders = [],
  riskProfile = null,
  latestSandboxTests = []
} = {}) {
  const connectorByExchange = connectors.reduce((acc, connector) => {
    const exchangeName = normalizePhase6ExchangeName(connector.settings?.registryId || connector.exchange_name);
    if (!acc[exchangeName]) acc[exchangeName] = connector;
    return acc;
  }, {});
  const credentialReferences = new Set((vaultStatus?.entries || []).map(entry => entry.exchangeName));
  const activeApprovals = approvals.filter(approvalIsActive);
  const exchanges = Object.values(PHASE6_PRODUCTION_ADAPTERS).map(adapter => {
    const connector = connectorByExchange[adapter.exchangeName] || null;
    const sandboxComplete = latestSandboxTests.some(test => (
      test.exchange_name === adapter.exchangeName
        && ['accepted', 'filled', 'canceled', 'reconciled'].includes(String(test.status || '').toLowerCase())
    ));
    const exchangeApproval = findApproval(activeApprovals, 'enable_exchange', adapter.exchangeName);
    const ready = Boolean(connector)
      && credentialReferences.has(adapter.exchangeName)
      && Boolean(exchangeApproval)
      && sandboxComplete
      && Boolean(riskProfile?.id)
      && Number(riskProfile?.kill_switch_enabled || 0) === 0;

    return {
      exchangeName: adapter.exchangeName,
      displayName: adapter.displayName,
      adapterStatus: adapter.adapterStatus,
      connectorId: connector?.id || null,
      connectorExists: Boolean(connector),
      productionCredentialsSaved: credentialReferences.has(adapter.exchangeName),
      sandboxComplete,
      exchangeApprovalActive: Boolean(exchangeApproval),
      ready,
      status: ready ? 'Ready for final order preview' : 'Locked',
      nextButton: ready ? 'Preview Production Order' : 'Review Missing Gates',
      docsUrl: adapter.docsUrl,
      websocket: adapter.websocket,
      supportedOrderTypes: adapter.supportedOrderTypes
    };
  });

  return {
    title: 'Phase 6: Production Trading Command Center',
    status: activeApprovals.length ? 'approval_gates_partially_configured' : 'locked_owner_approval_required',
    plainEnglishStatus: 'Production infrastructure is installed, but real orders require vault credentials, sandbox evidence, owner approvals, dry-run checks, capital limits, and final typed confirmation.',
    defaultLocked: true,
    exchanges,
    activeApprovals,
    latestOrders,
    riskProfile: riskProfile
      ? {
          id: riskProfile.id,
          name: riskProfile.name,
          status: riskProfile.status,
          maxOrderValue: riskProfile.max_order_value,
          maxDailyLoss: riskProfile.max_daily_loss,
          killSwitchEnabled: Boolean(riskProfile.kill_switch_enabled)
        }
      : null,
    approvalPhrase: PHASE6_ENABLE_LIVE_CONFIRMATION_PHRASE,
    orderPhrase: PHASE6_ORDER_CONFIRMATION_PHRASE,
    policy: DEFAULT_PHASE6_POLICY,
    dashboards: {
      productionTradingCommandCenter: true,
      livePositionsDashboard: true,
      realOrdersDashboard: true,
      realFillDashboard: true,
      exchangeHealthMonitor: true,
      capitalExposureDashboard: true,
      emergencyControlsDashboard: true,
      riskEngineDashboard: true
    },
    safetyBoundary: createProductionSafetyBoundary(false)
  };
}

function phase6BStatusLabel(passed, statusWhenFalse = 'Missing') {
  return passed ? 'Safe' : statusWhenFalse;
}

function phase6BChecklistItem({ id, label, passed, statusWhenFalse = 'Missing', plainEnglish, nextClick, locked = false }) {
  return {
    id,
    label,
    passed: Boolean(passed),
    status: locked ? 'Locked' : phase6BStatusLabel(passed, statusWhenFalse),
    plainEnglish,
    nextClick: passed ? 'No action needed.' : nextClick
  };
}

function buildExchangeVerificationChecklist({
  connectors = [],
  vaultStatus = null,
  approvals = [],
  latestOrders = [],
  riskProfile = null,
  latestSandboxTests = [],
  exchangeReadiness = {}
} = {}) {
  const connectorByExchange = connectors.reduce((acc, connector) => {
    const exchangeName = normalizePhase6ExchangeName(connector.settings?.registryId || connector.exchange_name);
    if (!acc[exchangeName]) acc[exchangeName] = connector;
    return acc;
  }, {});
  const credentialReferences = new Set((vaultStatus?.entries || []).map(entry => normalizePhase6ExchangeName(entry.exchangeName)));
  const activeApprovals = approvals.filter(approvalIsActive);
  const latestDryRunByExchange = latestOrders.reduce((acc, order) => {
    const exchangeName = normalizePhase6ExchangeName(order.exchange_name);
    if (!exchangeName || acc[exchangeName]) return acc;
    acc[exchangeName] = order;
    return acc;
  }, {});

  const exchanges = Object.values(PHASE6_PRODUCTION_ADAPTERS).map(adapter => {
    const connector = connectorByExchange[adapter.exchangeName] || null;
    const productionConnection = connector?.settings?.productionConnection || {};
    const readiness = exchangeReadiness[adapter.exchangeName] || null;
    const permissionsChecklist = productionConnection.permissionsChecklist || {};
    const productionCredentialsSaved = credentialReferences.has(adapter.exchangeName)
      || Boolean(productionConnection.referenceName);
    const connected = readiness?.status === 'production_account_verified'
      || productionConnection.connectionStatus === 'production_account_verified';
    const latestPermission = productionConnection.lastProductionPermissionStatus || {};
    const canWithdraw = readiness?.canWithdraw ?? latestPermission.canWithdraw;
    const withdrawalsDisabled = canWithdraw === false
      || (connected && permissionsChecklist.withdrawalsDisabled === true);
    const balancesReadable = Boolean(readiness?.balancesVisible)
      || (Array.isArray(readiness?.balances) && readiness.balances.length >= 0);
    const exactFeesLoaded = Boolean(
      readiness?.feeTier
        || readiness?.makerFeePercent
        || readiness?.takerFeePercent
        || readiness?.makerFeeRate
        || readiness?.takerFeeRate
    );
    const feeModelLoaded = exactFeesLoaded || Boolean(adapter.precisionModel);
    const symbolRulesLoaded = Boolean(adapter.precisionModel?.minNotionalUsd);
    const orderEndpointModeled = Boolean(adapter.endpoints?.placeOrder);
    const sandboxComplete = latestSandboxTests.some(test => (
      normalizePhase6ExchangeName(test.exchange_name) === adapter.exchangeName
        && ['accepted', 'filled', 'canceled', 'reconciled'].includes(String(test.status || '').toLowerCase())
    ));
    const sandboxAdapterComplete = ['binance', 'okx', 'bybit'].includes(adapter.exchangeName);
    const latestDryRun = latestDryRunByExchange[adapter.exchangeName] || null;
    const productionDryRunPassed = latestDryRun?.status === 'preview_ready';
    const exchangeApproval = findApproval(activeApprovals, 'enable_exchange', adapter.exchangeName);
    const globalApproval = findApproval(activeApprovals, 'enable_live_trading', 'global');
    const symbolApproval = latestDryRun?.symbol
      ? findApproval(activeApprovals, 'enable_symbol', `${adapter.exchangeName}:${latestDryRun.symbol}`)
      : null;
    const strategyApproval = findApproval(activeApprovals, 'enable_strategy', 'manual');
    const capitalApproval = activeApprovals.some(approval => approval.scope_type === 'increase_capital_limits');
    const riskProfileReady = Boolean(riskProfile?.id) && Number(riskProfile?.kill_switch_enabled || 0) === 0;
    const tinyLiveEligible = connected
      && productionCredentialsSaved
      && withdrawalsDisabled
      && sandboxComplete
      && productionDryRunPassed
      && riskProfileReady
      && Boolean(globalApproval)
      && Boolean(exchangeApproval)
      && Boolean(strategyApproval)
      && Boolean(symbolApproval)
      && Boolean(capitalApproval);
    const status = tinyLiveEligible
      ? 'Tiny live test eligible'
      : connected
        ? 'Authenticated Read-Only'
        : productionCredentialsSaved
          ? 'Production Key Saved'
          : 'Not Connected';

    return {
      exchangeName: adapter.exchangeName,
      displayName: adapter.displayName,
      status,
      recommendedFirst: PHASE6B_ACTIVATION_EXCHANGE_GUIDES[adapter.exchangeName]?.recommendedFirst === true,
      guide: PHASE6B_ACTIVATION_EXCHANGE_GUIDES[adapter.exchangeName] || null,
      connectorId: connector?.id || null,
      connectorExists: Boolean(connector),
      productionCredentialsSaved,
      connected,
      orderEndpointLocked: true,
      tinyLiveEligible,
      checklist: [
        phase6BChecklistItem({
          id: 'api_connected',
          label: 'API connected',
          passed: connected,
          plainEnglish: connected ? `${adapter.displayName} accepted the production API key for account reads.` : 'EtherealAI has not verified this production key yet.',
          nextClick: productionCredentialsSaved ? 'Click Test This Exchange.' : 'Open the key panel, paste the key into the vault, then test it.'
        }),
        phase6BChecklistItem({
          id: 'balances_readable',
          label: 'Balances readable',
          passed: balancesReadable,
          plainEnglish: balancesReadable ? 'The account endpoint responded with balance visibility.' : 'Balances are not visible yet because the authenticated test has not passed.',
          nextClick: 'Fix the API key permissions, then click Test This Exchange.'
        }),
        phase6BChecklistItem({
          id: 'fees_loaded',
          label: exactFeesLoaded ? 'Fees readable' : 'Fee model loaded',
          passed: feeModelLoaded,
          statusWhenFalse: 'Review Needed',
          plainEnglish: exactFeesLoaded
            ? 'Account-specific fee data was detected.'
            : 'Exact account fee tier is not confirmed yet; dry-runs use conservative fee assumptions until exchange-specific fee reads are available.',
          nextClick: 'Use conservative dry-run assumptions or connect account-specific fee access later.'
        }),
        phase6BChecklistItem({
          id: 'symbol_rules_readable',
          label: 'Symbol rules readable',
          passed: symbolRulesLoaded,
          plainEnglish: symbolRulesLoaded ? 'Minimum order and precision rules are loaded for safe dry-run validation.' : 'Symbol rules are missing for this adapter.',
          nextClick: 'Choose a supported spot symbol or review the exchange adapter.'
        }),
        phase6BChecklistItem({
          id: 'order_endpoint_reachable',
          label: 'Order endpoint modeled and locked',
          passed: orderEndpointModeled,
          locked: true,
          plainEnglish: orderEndpointModeled ? 'The production order route exists, but remains locked until every approval and dry-run gate passes.' : 'No production order route is implemented for this exchange.',
          nextClick: 'Keep using dry-run until every owner approval gate passes.'
        }),
        phase6BChecklistItem({
          id: 'withdrawals_disabled',
          label: 'Withdrawals disabled',
          passed: withdrawalsDisabled,
          statusWhenFalse: connected ? 'Unsafe' : 'Missing',
          plainEnglish: withdrawalsDisabled ? 'No withdrawal permission is detected or the owner checklist confirms withdrawals are disabled.' : 'Withdrawal safety has not been verified.',
          nextClick: 'Recreate the exchange API key with withdrawals and transfers disabled.'
        }),
        phase6BChecklistItem({
          id: 'sandbox_available',
          label: 'Sandbox/testnet available',
          passed: sandboxAdapterComplete || sandboxComplete,
          statusWhenFalse: 'Review Needed',
          plainEnglish: sandboxAdapterComplete
            ? `${adapter.displayName} has a prepared sandbox/testnet adapter.`
            : `${adapter.displayName} sandbox support needs manual exchange-docs review before it can be used as proof.`,
          nextClick: 'Run sandbox/testnet validation where available, or use an exchange with a complete sandbox adapter first.'
        }),
        phase6BChecklistItem({
          id: 'production_dry_run_passed',
          label: 'Production dry-run passed',
          passed: productionDryRunPassed,
          plainEnglish: productionDryRunPassed ? 'The exact tiny order passed dry-run checks without calling the live order endpoint.' : 'No passing production dry-run exists for this exchange yet.',
          nextClick: 'Click Run Guided Production Dry-Run.'
        }),
        phase6BChecklistItem({
          id: 'tiny_live_test_eligible',
          label: 'Tiny live test eligible',
          passed: tinyLiveEligible,
          locked: !tinyLiveEligible,
          plainEnglish: tinyLiveEligible
            ? 'All required gates are present for one manual tiny spot test. Automation remains disabled.'
            : 'Tiny live testing stays locked until API verification, withdrawal safety, sandbox evidence, approvals, risk profile, and dry-run all pass.',
          nextClick: 'Complete the missing checklist items above before typing any final order phrase.'
        })
      ],
      approvals: {
        globalApprovalActive: Boolean(globalApproval),
        exchangeApprovalActive: Boolean(exchangeApproval),
        strategyApprovalActive: Boolean(strategyApproval),
        symbolApprovalActive: Boolean(symbolApproval),
        capitalApprovalActive: Boolean(capitalApproval)
      },
      latestDryRun: latestDryRun
        ? {
            id: latestDryRun.id,
            status: latestDryRun.status,
            symbol: latestDryRun.symbol,
            productionOrderEndpointCalled: Boolean(latestDryRun.production_order_endpoint_called)
          }
        : null
    };
  });

  return {
    title: 'Exchange Verification Checklist',
    exchanges,
    safetyBoundary: createProductionSafetyBoundary(false),
    statusLegend: ['Safe', 'Missing', 'Review Needed', 'Unsafe', 'Locked']
  };
}

function buildProductionActivationWizard({
  connectors = [],
  vaultStatus = null,
  approvals = [],
  latestOrders = [],
  riskProfile = null,
  latestSandboxTests = [],
  exchangeReadiness = {},
  selectedExchangeName = ''
} = {}) {
  const checklist = buildExchangeVerificationChecklist({
    connectors,
    vaultStatus,
    approvals,
    latestOrders,
    riskProfile,
    latestSandboxTests,
    exchangeReadiness
  });
  const selected = normalizePhase6ExchangeName(selectedExchangeName || PHASE6B_RECOMMENDED_FIRST_EXCHANGE);
  const selectedExchange = checklist.exchanges.find(exchange => exchange.exchangeName === selected)
    || checklist.exchanges.find(exchange => exchange.exchangeName === PHASE6B_RECOMMENDED_FIRST_EXCHANGE)
    || checklist.exchanges[0];
  const guide = PHASE6B_ACTIVATION_EXCHANGE_GUIDES[selectedExchange?.exchangeName] || selectedExchange?.guide || null;
  const firstMissing = (selectedExchange?.checklist || []).find(item => !item.passed && item.id !== 'tiny_live_test_eligible');
  const missingItems = (selectedExchange?.checklist || []).filter(item => !item.passed);
  const safeItems = (selectedExchange?.checklist || []).filter(item => item.passed);
  const lockedItems = (selectedExchange?.checklist || []).filter(item => item.status === 'Locked');

  let nextButton = 'Open Key Instructions';
  if (!selectedExchange?.productionCredentialsSaved) nextButton = 'Open Key Panel';
  else if (!selectedExchange?.connected) nextButton = 'Test This Exchange';
  else if (!selectedExchange?.latestDryRun || selectedExchange.latestDryRun.status !== 'preview_ready') nextButton = 'Run Guided Production Dry-Run';
  else if (!selectedExchange?.tinyLiveEligible) nextButton = 'Review Locked Tiny Live Requirements';
  else nextButton = 'Prepare Tiny Live Test';

  return {
    title: 'Live Trading Activation Wizard',
    phase: 'Phase 6B',
    selectedExchangeName: selectedExchange?.exchangeName || PHASE6B_RECOMMENDED_FIRST_EXCHANGE,
    selectedExchangeDisplayName: selectedExchange?.displayName || 'Binance',
    recommendedExchangeName: PHASE6B_RECOMMENDED_FIRST_EXCHANGE,
    recommendedExchangeDisplayName: PHASE6_PRODUCTION_ADAPTERS[PHASE6B_RECOMMENDED_FIRST_EXCHANGE]?.displayName || 'Binance',
    status: selectedExchange?.tinyLiveEligible ? 'Ready for one manual tiny live test' : 'Locked guided setup',
    whatToDoNow: firstMissing
      ? `${firstMissing.nextClick} ${firstMissing.plainEnglish}`
      : 'All setup checks are present for one manually approved tiny spot test. Review the order preview before doing anything live.',
    whatIsMissing: missingItems.map(item => `${item.label}: ${item.plainEnglish}`),
    whatIsSafe: [
      'The wizard cannot enable withdrawals.',
      'The wizard cannot enable wallet signing.',
      'The wizard cannot enable margin, futures, leverage, or autonomous scaling.',
      'Dry-run preview does not call a production order endpoint.',
      ...safeItems.slice(0, 4).map(item => `${item.label}: ${item.plainEnglish}`)
    ],
    whatIsLocked: [
      'Unrestricted live trading remains locked.',
      'Automated live trading remains locked.',
      'Withdrawals and transfers remain disabled.',
      'Wallet signing remains disabled.',
      ...lockedItems.map(item => `${item.label}: ${item.plainEnglish}`)
    ],
    nextButton,
    guide,
    steps: [
      {
        id: 'choose_exchange',
        title: 'Choose one exchange first',
        status: selectedExchange ? 'Safe' : 'Missing',
        action: 'Use the exchange dropdown. The recommended first exchange is selected automatically.',
        button: 'Start Live Setup Safely'
      },
      {
        id: 'create_api_key',
        title: 'Create a restricted API key on the exchange',
        status: selectedExchange?.productionCredentialsSaved ? 'Safe' : 'Missing',
        action: 'Open the official exchange API page and create a key with no withdrawal or transfer permission.',
        button: 'Open Official Key Page'
      },
      {
        id: 'save_to_vault',
        title: 'Save keys to encrypted production vault',
        status: selectedExchange?.productionCredentialsSaved ? 'Safe' : 'Missing',
        action: 'Paste the key once. EtherealAI encrypts it locally and does not show it again.',
        button: 'Open Key Panel'
      },
      {
        id: 'test_exchange',
        title: 'Test authenticated connection',
        status: selectedExchange?.connected ? 'Safe' : 'Missing',
        action: 'EtherealAI reads account metadata only. It cannot place orders from this test.',
        button: 'Test This Exchange'
      },
      {
        id: 'verify_permissions',
        title: 'Verify withdrawals are disabled',
        status: selectedExchange?.checklist?.find(item => item.id === 'withdrawals_disabled')?.status || 'Missing',
        action: 'If withdrawals are detected, delete the API key immediately and recreate it safer.',
        button: 'Review Permissions'
      },
      {
        id: 'run_dry_run',
        title: 'Run production dry-run',
        status: selectedExchange?.latestDryRun?.status === 'preview_ready' ? 'Safe' : 'Missing',
        action: 'Simulate the exact tiny order and verify limits, balance, fees, slippage, spread, stale price, and kill switch.',
        button: 'Run Guided Production Dry-Run'
      },
      {
        id: 'prepare_tiny_live',
        title: 'Prepare one tiny live test',
        status: selectedExchange?.tinyLiveEligible ? 'Safe' : 'Locked',
        action: 'This remains locked until every gate passes and the owner types final confirmation.',
        button: 'Prepare Tiny Live Test'
      }
    ],
    defaultOrder: guide?.defaultOrder || { symbol: 'BTC/USDT', side: 'buy', orderType: 'limit', quantity: 0.001, limitPrice: 0, notionalUsd: 10 },
    selectedExchange,
    exchangeOptions: checklist.exchanges.map(exchange => ({
      exchangeName: exchange.exchangeName,
      displayName: exchange.displayName,
      recommendedFirst: exchange.recommendedFirst,
      status: exchange.status,
      tinyLiveEligible: exchange.tinyLiveEligible
    })),
    checklist,
    approvalPhrase: PHASE6_ENABLE_LIVE_CONFIRMATION_PHRASE,
    orderPhrase: PHASE6_ORDER_CONFIRMATION_PHRASE,
    safetyBoundary: createProductionSafetyBoundary(false)
  };
}

function flattenPermissionTokens(value, prefix = '') {
  const tokens = [];

  if (value === null || value === undefined) {
    return tokens;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      tokens.push(...flattenPermissionTokens(item, prefix));
    }
    return tokens;
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;

      if (nested === true) {
        tokens.push(nextPrefix.toLowerCase());
      } else if (nested === false || nested === null || nested === undefined) {
        continue;
      } else {
        tokens.push(...flattenPermissionTokens(nested, nextPrefix));
      }
    }
    return tokens;
  }

  tokens.push(String(value).toLowerCase());
  return tokens;
}

function permissionTokensInclude(tokens = [], patterns = []) {
  return tokens.some(token => patterns.some(pattern => pattern.test(String(token || ''))));
}

function parseKrakenApiKeyInfo(apiKeyInfo = {}) {
  const result = apiKeyInfo.result || apiKeyInfo || {};
  const tokens = flattenPermissionTokens(result);
  const withdrawalPermissionDetected = permissionTokensInclude(tokens, [
    /withdraw/,
    /funds[-_\s.]*withdraw/,
    /withdraw\s*funds/
  ]);
  const tradingPermissionDetected = permissionTokensInclude(tokens, [
    /modify/,
    /addorder/,
    /add\s*order/,
    /create.*order/,
    /trades[-_\s.]*modify/,
    /orders.*modify/
  ]);
  const readPermissionDetected = permissionTokensInclude(tokens, [
    /query/,
    /balance/,
    /funds[-_\s.]*query/,
    /trades[-_\s.]*query/
  ]);
  const restrictions = result.restrictions || result.restriction || result.api_key?.restrictions || {};

  return {
    loaded: Boolean(Object.keys(result).length),
    keyName: result.name || result.description || result.api_key?.name || null,
    permissionsRawReturned: Boolean(tokens.length),
    permissionTokens: tokens.slice(0, 50),
    withdrawalPermissionDetected,
    tradingPermissionDetected,
    readPermissionDetected,
    restrictions,
    permissionsSource: 'Kraken /0/private/GetApiKeyInfo'
  };
}

function throwIfKrakenError(payload = {}, label = 'Kraken API') {
  if (Array.isArray(payload.error) && payload.error.length) {
    throw new Error(`${label}: ${payload.error.join('; ')}`);
  }
  return payload.result || {};
}

function firstObjectValue(value = {}) {
  const entries = Object.entries(value || {});
  return entries.length ? { key: entries[0][0], value: entries[0][1] } : { key: '', value: null };
}

function parseKrakenPairRules(assetPairs = {}, order = {}) {
  const { key, value } = firstObjectValue(assetPairs);
  const pair = value || {};
  const makerFee = Array.isArray(pair.fees_maker) && pair.fees_maker[0] ? Number(pair.fees_maker[0][1]) : null;
  const takerFee = Array.isArray(pair.fees) && pair.fees[0] ? Number(pair.fees[0][1]) : null;

  return {
    loaded: Boolean(pair && Object.keys(pair).length),
    source: 'Kraken /0/public/AssetPairs',
    pairKey: key || order.exchangeSymbol,
    exchangeSymbol: order.exchangeSymbol,
    minOrderSize: Number(pair.ordermin || 0),
    minNotionalUsd: Number(pair.costmin || 0),
    priceDecimals: Number(pair.pair_decimals ?? 2),
    quantityDecimals: Number(pair.lot_decimals ?? 8),
    makerFeePercent: Number.isFinite(makerFee) ? makerFee : null,
    takerFeePercent: Number.isFinite(takerFee) ? takerFee : null,
    rawRulesAvailable: true
  };
}

function parseKrakenFeeProof(tradeVolume = {}, pairKey = '') {
  const result = tradeVolume.result || tradeVolume || {};
  const fees = result.fees || {};
  const makerFees = result.fees_maker || {};
  const feeRow = fees[pairKey] || firstObjectValue(fees).value || {};
  const makerRow = makerFees[pairKey] || firstObjectValue(makerFees).value || {};
  const takerFee = Number(feeRow.fee ?? feeRow.fee_percent ?? NaN);
  const makerFee = Number(makerRow.fee ?? makerRow.fee_percent ?? NaN);

  return {
    exactLoaded: Number.isFinite(takerFee) || Number.isFinite(makerFee),
    source: 'Kraken /0/private/TradeVolume',
    makerFeePercent: Number.isFinite(makerFee) ? makerFee : null,
    takerFeePercent: Number.isFinite(takerFee) ? takerFee : null,
    fallbackFeePercent: 0.26,
    feeTier: result.currency ? `${result.currency} fee tier` : null
  };
}

function parseKrakenMarketProof({ ticker = {}, depth = {}, order = {}, symbolRules = {} }) {
  const tickerPair = firstObjectValue(ticker).value || {};
  const depthPair = firstObjectValue(depth).value || {};
  const askPrice = Number(tickerPair.a?.[0] || depthPair.asks?.[0]?.[0] || 0);
  const bidPrice = Number(tickerPair.b?.[0] || depthPair.bids?.[0]?.[0] || 0);
  const lastPrice = Number(tickerPair.c?.[0] || 0);
  const midPrice = askPrice > 0 && bidPrice > 0 ? (askPrice + bidPrice) / 2 : lastPrice || askPrice || bidPrice || 0;
  const spreadPercent = askPrice > 0 && bidPrice > 0 && midPrice > 0
    ? ((askPrice - bidPrice) / midPrice) * 100
    : 0;
  const visibleAskLiquidityUsd = (depthPair.asks || []).slice(0, 10).reduce((sum, row) => sum + Number(row[0] || 0) * Number(row[1] || 0), 0);
  const visibleBidLiquidityUsd = (depthPair.bids || []).slice(0, 10).reduce((sum, row) => sum + Number(row[0] || 0) * Number(row[1] || 0), 0);
  const liquidityUsd = Math.min(
    visibleAskLiquidityUsd || Number.POSITIVE_INFINITY,
    visibleBidLiquidityUsd || Number.POSITIVE_INFINITY
  );
  const effectiveLiquidityUsd = Number.isFinite(liquidityUsd) ? liquidityUsd : Math.max(visibleAskLiquidityUsd, visibleBidLiquidityUsd, 0);
  const notional = Number(order.notionalUsd || order.maxOrderUsd || DEFAULT_PHASE6_POLICY.maxOrderSizeUsd || 10);
  const estimatedSlippagePercent = effectiveLiquidityUsd > 0
    ? Math.min(0.5, Math.max(0.01, spreadPercent / 2 + (notional / effectiveLiquidityUsd) * 100))
    : 0.15;

  return {
    loaded: midPrice > 0,
    source: 'Kraken /0/public/Ticker and /0/public/Depth',
    bidPrice,
    askPrice,
    lastPrice,
    midPrice,
    spreadPercent: Number(spreadPercent.toFixed(6)),
    estimatedSlippagePercent: Number(estimatedSlippagePercent.toFixed(6)),
    liquidityUsd: Number(effectiveLiquidityUsd.toFixed(2)),
    priceTimestamp: new Date().toISOString(),
    minOrderSize: symbolRules.minOrderSize || 0,
    minNotionalUsd: symbolRules.minNotionalUsd || 0
  };
}

async function fetchKrakenPhase6CProof({ credentials, adapter, order }) {
  const apiKeyPath = '/0/private/GetApiKeyInfo';
  const apiKeySigned = signKrakenRequest({
    credentials,
    requestPath: apiKeyPath,
    params: { nonce: Date.now() }
  });
  const apiKeyInfo = await fetchJson(`${adapter.baseUrl}${apiKeyPath}`, {
    method: 'POST',
    headers: apiKeySigned.headers,
    body: apiKeySigned.body
  });
  const permissions = parseKrakenApiKeyInfo(throwIfKrakenError(apiKeyInfo, 'Kraken API key info'));
  const pairPayload = await fetchJson(`${adapter.baseUrl}/0/public/AssetPairs?pair=${encodeURIComponent(order.exchangeSymbol)}`);
  const pairResult = throwIfKrakenError(pairPayload, 'Kraken asset pairs');
  const symbolRules = parseKrakenPairRules(pairResult, order);
  let feeProof = {
    exactLoaded: false,
    source: 'Kraken conservative fallback',
    makerFeePercent: symbolRules.makerFeePercent,
    takerFeePercent: symbolRules.takerFeePercent,
    fallbackFeePercent: symbolRules.takerFeePercent || 0.26,
    feeTier: null,
    warning: 'Exact account fee tier was not returned; conservative public pair fee assumptions are used.'
  };

  try {
    const tradeVolumePath = '/0/private/TradeVolume';
    const tradeVolumeSigned = signKrakenRequest({
      credentials,
      requestPath: tradeVolumePath,
      params: { nonce: Date.now(), pair: symbolRules.pairKey || order.exchangeSymbol }
    });
    const tradeVolume = await fetchJson(`${adapter.baseUrl}${tradeVolumePath}`, {
      method: 'POST',
      headers: tradeVolumeSigned.headers,
      body: tradeVolumeSigned.body
    });
    feeProof = parseKrakenFeeProof(throwIfKrakenError(tradeVolume, 'Kraken trade volume'), symbolRules.pairKey);
  } catch (error) {
    feeProof.warning = createPlainEnglishProductionError('kraken', error);
  }

  const [tickerResponse, depthResponse] = await Promise.all([
    fetchJson(`${adapter.baseUrl}/0/public/Ticker?pair=${encodeURIComponent(order.exchangeSymbol)}`),
    fetchJson(`${adapter.baseUrl}/0/public/Depth?pair=${encodeURIComponent(order.exchangeSymbol)}&count=10`)
  ]);
  const marketData = parseKrakenMarketProof({
    ticker: throwIfKrakenError(tickerResponse, 'Kraken ticker'),
    depth: throwIfKrakenError(depthResponse, 'Kraken order book'),
    order,
    symbolRules
  });

  return {
    exchangeName: 'kraken',
    displayName: adapter.displayName,
    permissions,
    symbolRules,
    accountLimits: {
      loaded: true,
      source: 'Kraken pair rules plus API key restrictions',
      restrictions: permissions.restrictions || {},
      minOrderSize: symbolRules.minOrderSize,
      minNotionalUsd: symbolRules.minNotionalUsd
    },
    fees: {
      loaded: feeProof.exactLoaded || Number.isFinite(Number(feeProof.fallbackFeePercent)),
      exactLoaded: feeProof.exactLoaded,
      ...feeProof
    },
    rateLimits: {
      loaded: true,
      source: 'Kraken REST private endpoint rate counter',
      plainEnglish: 'Phase 6C uses owner-clicked one-request verification and does not start a background live order loop.'
    },
    marketData,
    proofSources: [
      'Kraken /0/private/Balance',
      'Kraken /0/private/GetApiKeyInfo',
      'Kraken /0/public/AssetPairs',
      'Kraken /0/private/TradeVolume when permission allows',
      'Kraken /0/public/Ticker',
      'Kraken /0/public/Depth'
    ]
  };
}

async function fetchGenericPhase6CProof({ adapter, order }) {
  return {
    exchangeName: adapter.exchangeName,
    displayName: adapter.displayName,
    permissions: {
      loaded: false,
      withdrawalPermissionDetected: null,
      tradingPermissionDetected: null,
      readPermissionDetected: null,
      permissionsSource: 'Owner checklist and authenticated account endpoint'
    },
    symbolRules: {
      loaded: Boolean(adapter.precisionModel),
      source: `${adapter.displayName} local production adapter precision model`,
      exchangeSymbol: order.exchangeSymbol,
      minOrderSize: adapter.precisionModel?.minQuantity || 0,
      minNotionalUsd: adapter.precisionModel?.minNotionalUsd || 0,
      priceDecimals: adapter.precisionModel?.priceDecimals || 2,
      quantityDecimals: adapter.precisionModel?.quantityDecimals || 8
    },
    accountLimits: {
      loaded: Boolean(adapter.precisionModel),
      source: `${adapter.displayName} local precision and safety policy`,
      minOrderSize: adapter.precisionModel?.minQuantity || 0,
      minNotionalUsd: adapter.precisionModel?.minNotionalUsd || 0
    },
    fees: {
      loaded: true,
      exactLoaded: false,
      source: `${adapter.displayName} conservative fallback`,
      makerFeePercent: null,
      takerFeePercent: null,
      fallbackFeePercent: 0.1,
      warning: 'Exact account-specific fees need exchange-specific expansion; dry-run uses conservative fallback assumptions.'
    },
    rateLimits: {
      loaded: true,
      source: `${adapter.displayName} local production adapter`,
      plainEnglish: 'Phase 6C keeps verification manual and does not start a background live order loop.'
    },
    marketData: {
      loaded: false,
      source: `${adapter.displayName} market proof pending`,
      bidPrice: 0,
      askPrice: 0,
      midPrice: 0,
      spreadPercent: 0.1,
      estimatedSlippagePercent: 0.05,
      liquidityUsd: 1000000,
      priceTimestamp: new Date().toISOString()
    },
    proofSources: [`${adapter.displayName} authenticated account endpoint`, `${adapter.displayName} local adapter safety model`]
  };
}

function normalizeAssetSymbol(value = '') {
  const text = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (text === 'XXBT' || text === 'XBT') return 'BTC';
  if (text === 'ZUSD') return 'USD';
  if (text === 'ZUSDT') return 'USDT';
  if (text.length === 4 && /^[XZ]/.test(text)) return text.slice(1);
  return text;
}

function findAvailableBalanceForAsset(balances = [], asset = '') {
  const target = normalizeAssetSymbol(asset);
  const match = (balances || []).find(row => normalizeAssetSymbol(row.asset) === target);
  return Number(match?.free ?? match?.available ?? match?.balance ?? 0);
}

function buildPhase6CChecklistItem({ id, label, passed, statusWhenFalse = 'Missing', plainEnglish, nextClick }) {
  return {
    id,
    label,
    passed: Boolean(passed),
    status: passed ? 'Safe' : statusWhenFalse,
    plainEnglish,
    nextClick: passed ? 'No action needed.' : nextClick
  };
}

async function verifyProductionExchangeCredentials({ credentials, adapter, orderInput = {} }) {
  const order = normalizeProductionOrderDraft({
    exchangeName: adapter?.exchangeName,
    ...(orderInput || {})
  });

  if (!credentials || !adapter) {
    const displayName = adapter?.displayName || 'selected exchange';
    return {
      exchangeName: adapter?.exchangeName || order.exchangeName,
      displayName,
      status: 'Not Connected',
      passed: false,
      criticalPassed: false,
      plainEnglishStatus: `No encrypted production API key is saved for ${displayName}. Save a restricted key to the local vault first.`,
      order,
      checklist: [
        buildPhase6CChecklistItem({
          id: 'api_connected',
          label: 'API key saved and connected',
          passed: false,
          plainEnglish: 'EtherealAI cannot verify the exchange until a key is saved in the encrypted local vault.',
          nextClick: 'Click Add API Key Safely.'
        })
      ],
      safetyBoundary: createProductionSafetyBoundary(false)
    };
  }

  const connection = await testProductionExchangeConnection({ credentials, adapter });
  const proof = adapter.exchangeName === 'kraken'
    ? await fetchKrakenPhase6CProof({ credentials, adapter, order })
    : await fetchGenericPhase6CProof({ credentials, adapter, order });
  const checklistPermissions = credentials.permissionsChecklist || {};
  const withdrawalUnsafe = connection.canWithdraw === true
    || proof.permissions?.withdrawalPermissionDetected === true
    || checklistPermissions.withdrawalsDisabled !== true
    || checklistPermissions.transfersDisabled !== true;
  const marginUnsafe = connection.marginDetected === true
    || checklistPermissions.marginDisabled !== true
    || checklistPermissions.leverageDisabled !== true;
  const futuresUnsafe = connection.futuresDetected === true
    || checklistPermissions.futuresDisabled !== true;
  const balancesReadable = Boolean(connection.balancesVisible) && Array.isArray(connection.balances);
  const feeModelLoaded = proof.fees?.loaded === true;
  const symbolRulesLoaded = proof.symbolRules?.loaded === true;
  const minOrderLoaded = Number(proof.symbolRules?.minOrderSize || 0) > 0
    || Number(proof.symbolRules?.minNotionalUsd || 0) > 0
    || Boolean(adapter.precisionModel?.minQuantity || adapter.precisionModel?.minNotionalUsd);
  const priceLoaded = proof.marketData?.loaded === true || Number(proof.marketData?.midPrice || 0) > 0;
  const tradingPermissionPresent = connection.canTrade === true
    || proof.permissions?.tradingPermissionDetected === true
    || checklistPermissions.spotTradingEnabled === true;
  const unsafe = withdrawalUnsafe || marginUnsafe || futuresUnsafe;
  const connected = connection.status === 'production_account_verified';
  const status = !connected
    ? connection.status === 'error' ? 'Error' : 'Not Connected'
    : unsafe
      ? 'Unsafe Permissions Detected'
      : tradingPermissionPresent
        ? 'Trading Permission Present But Locked'
        : 'Authenticated Read-Only';
  const checklist = [
    buildPhase6CChecklistItem({
      id: 'api_connected',
      label: 'API connected',
      passed: connected,
      plainEnglish: connected ? `${adapter.displayName} accepted the key for authenticated account reads.` : connection.plainEnglishStatus || 'The exchange did not accept the key.',
      nextClick: 'Check the key and secret, then verify again.'
    }),
    buildPhase6CChecklistItem({
      id: 'withdrawals_disabled',
      label: 'Withdrawals disabled',
      passed: !withdrawalUnsafe && connected,
      statusWhenFalse: withdrawalUnsafe ? 'Unsafe' : 'Missing',
      plainEnglish: !withdrawalUnsafe && connected ? 'No withdrawal capability is detected by the exchange proof or owner checklist.' : 'Withdrawal or transfer safety is not proven.',
      nextClick: 'Delete this API key on the exchange and recreate it with withdrawals and transfers disabled.'
    }),
    buildPhase6CChecklistItem({
      id: 'balances_readable',
      label: 'Balances readable',
      passed: balancesReadable,
      plainEnglish: balancesReadable ? 'The account balance endpoint returned safely without placing any order.' : 'Balances are not readable yet.',
      nextClick: 'Enable account balance read permission, then verify again.'
    }),
    buildPhase6CChecklistItem({
      id: 'fees_loaded',
      label: proof.fees?.exactLoaded ? 'Account fees loaded' : 'Conservative fee model loaded',
      passed: feeModelLoaded,
      statusWhenFalse: 'Review Needed',
      plainEnglish: proof.fees?.exactLoaded ? 'Account-specific maker/taker fees were loaded.' : 'Exact fee tier was not confirmed; dry-run uses conservative assumptions until available.',
      nextClick: 'Continue with conservative dry-run assumptions or add fee-read permission later.'
    }),
    buildPhase6CChecklistItem({
      id: 'symbol_rules_loaded',
      label: 'Symbol rules loaded',
      passed: symbolRulesLoaded,
      plainEnglish: symbolRulesLoaded ? 'Minimum order size and precision rules are available for the selected symbol.' : 'Symbol rules were not loaded.',
      nextClick: 'Choose a supported spot symbol and verify again.'
    }),
    buildPhase6CChecklistItem({
      id: 'minimum_order_loaded',
      label: 'Minimum order size loaded',
      passed: minOrderLoaded,
      plainEnglish: minOrderLoaded ? 'The dry-run can compare the tiny order against exchange minimums.' : 'Minimum order size is missing.',
      nextClick: 'Choose a supported spot symbol or update the exchange adapter.'
    }),
    buildPhase6CChecklistItem({
      id: 'live_price_loaded',
      label: 'Live price loaded',
      passed: priceLoaded,
      statusWhenFalse: 'Review Needed',
      plainEnglish: priceLoaded ? 'A current market price is available for dry-run proof.' : 'Live price proof is not available yet.',
      nextClick: 'Retry verification after checking internet/VPN/firewall.'
    }),
    buildPhase6CChecklistItem({
      id: 'order_endpoint_locked',
      label: 'Live order endpoint remains locked',
      passed: true,
      plainEnglish: 'Credential verification never calls a production order endpoint.',
      nextClick: 'No action needed.'
    })
  ];
  const criticalPassed = checklist
    .filter(item => !['fees_loaded'].includes(item.id))
    .every(item => item.passed)
    && !unsafe;

  return {
    exchangeName: adapter.exchangeName,
    displayName: adapter.displayName,
    phase: 'Phase 6C',
    status,
    passed: criticalPassed,
    criticalPassed,
    connectionStatus: connection.status,
    tradingPermissionPresent,
    withdrawalPermissionDetected: withdrawalUnsafe,
    marginOrLeverageDetected: marginUnsafe,
    futuresDetected: futuresUnsafe,
    balancesReadable,
    balances: (connection.balances || []).slice(0, 20),
    feesLoaded: feeModelLoaded,
    exactFeesLoaded: proof.fees?.exactLoaded === true,
    symbolRulesLoaded,
    minimumOrderLoaded: minOrderLoaded,
    livePriceLoaded: priceLoaded,
    order,
    proof,
    checklist,
    checksPassed: checklist.filter(item => item.passed).map(item => item.label),
    checksFailed: checklist.filter(item => !item.passed).map(item => `${item.label}: ${item.plainEnglish}`),
    plainEnglishStatus: unsafe
      ? `${adapter.displayName} key is unsafe for EtherealAI. Delete it and recreate it without withdrawals, transfers, margin, futures, or leverage.`
      : connected
        ? `${adapter.displayName} credential verification passed for account reads. Trading permission, if present, remains locked and cannot place orders from this step.`
        : connection.plainEnglishStatus || `${adapter.displayName} credential verification is not connected yet.`,
    nextClick: criticalPassed ? 'Run Production Dry-Run Proof.' : 'Fix the failed check, then verify credentials again.',
    safetyBoundary: createProductionSafetyBoundary(false)
  };
}

function buildPhase6CProductionDryRunProof({
  order,
  credentialVerification = null,
  safety = null,
  preview = null,
  riskProfile = null,
  marketContext = {},
  policy = DEFAULT_PHASE6_POLICY
} = {}) {
  const proof = credentialVerification?.proof || {};
  const symbolRules = proof.symbolRules || {};
  const marketData = proof.marketData || {};
  const balances = credentialVerification?.balances || [];
  const orderNotional = Number(order?.notionalUsd || order?.quantity * order?.limitPrice || order?.maxOrderUsd || 0);
  const requiredAsset = order?.side === 'sell' ? order.baseAsset : order.quoteAsset;
  const availableBalance = findAvailableBalanceForAsset(balances, requiredAsset);
  const estimatedRequired = order?.side === 'sell' ? Number(order.quantity || 0) : orderNotional;
  const balanceEnough = availableBalance >= estimatedRequired || estimatedRequired <= 0;
  const minOrderSize = Number(symbolRules.minOrderSize || policy.minQuantity || 0);
  const minNotionalUsd = Number(symbolRules.minNotionalUsd || policy.minOrderUsd || 0);
  const minSizePassed = Number(order?.quantity || 0) >= minOrderSize || minOrderSize <= 0;
  const minNotionalPassed = orderNotional >= minNotionalUsd || minNotionalUsd <= 0;
  const safetyCheck = id => (safety?.checks || []).find(check => check.id === id);
  const riskActive = Boolean(riskProfile?.id) && riskProfile.status === 'active';
  const killSwitchOff = Boolean(riskProfile?.id) && Number(riskProfile.kill_switch_enabled || 0) === 0;
  const withdrawalDisabled = credentialVerification?.withdrawalPermissionDetected === false
    && credentialVerification?.status !== 'Unsafe Permissions Detected';
  const liveEndpointBlocked = true;
  const checks = [
    buildPhase6CChecklistItem({
      id: 'selected_exchange',
      label: 'Selected exchange',
      passed: Boolean(order?.exchangeName),
      plainEnglish: order?.exchangeName ? `Dry-run is scoped to ${credentialVerification?.displayName || order.exchangeName}.` : 'No exchange selected.',
      nextClick: 'Choose one exchange.'
    }),
    buildPhase6CChecklistItem({
      id: 'selected_symbol',
      label: 'Selected spot symbol',
      passed: Boolean(order?.symbol),
      plainEnglish: order?.symbol ? `Dry-run uses ${order.symbol} spot only.` : 'No spot symbol selected.',
      nextClick: 'Choose one spot symbol.'
    }),
    buildPhase6CChecklistItem({
      id: 'tiny_amount',
      label: 'Tiny amount',
      passed: orderNotional > 0 && orderNotional <= Number(policy.maxOrderSizeUsd || 10),
      plainEnglish: `Dry-run order value is about $${orderNotional.toFixed(2)}. Phase 6C limit is $${Number(policy.maxOrderSizeUsd || 10).toFixed(2)}.`,
      nextClick: 'Lower the test amount.'
    }),
    buildPhase6CChecklistItem({
      id: 'account_balance',
      label: 'Account balance available',
      passed: balanceEnough,
      statusWhenFalse: 'Missing',
      plainEnglish: balanceEnough ? `${requiredAsset} balance appears sufficient for the tiny dry-run amount.` : `${requiredAsset} balance is not enough for this tiny dry-run amount.`,
      nextClick: 'Lower the amount or fund the spot account before a live test.'
    }),
    buildPhase6CChecklistItem({
      id: 'min_order_size',
      label: 'Minimum order size passed',
      passed: minSizePassed && minNotionalPassed,
      plainEnglish: minSizePassed && minNotionalPassed ? 'The tiny amount is above exchange minimums.' : 'The tiny amount is below exchange minimum size or notional.',
      nextClick: 'Increase the tiny amount to the exchange minimum.'
    }),
    buildPhase6CChecklistItem({
      id: 'fee_estimate',
      label: 'Fee estimate available',
      passed: credentialVerification?.feesLoaded === true,
      statusWhenFalse: 'Review Needed',
      plainEnglish: credentialVerification?.exactFeesLoaded ? 'Exact account fee estimate is available.' : 'Conservative fee estimate is available for dry-run proof.',
      nextClick: 'Verify credentials again or continue with conservative assumptions.'
    }),
    buildPhase6CChecklistItem({
      id: 'live_price',
      label: 'Live price loaded',
      passed: credentialVerification?.livePriceLoaded === true,
      plainEnglish: marketData.midPrice ? `Current modeled mid price is $${Number(marketData.midPrice).toFixed(2)}.` : 'Live price is not loaded.',
      nextClick: 'Verify credentials again to refresh market data.'
    }),
    buildPhase6CChecklistItem({
      id: 'spread_slippage',
      label: 'Spread and slippage checked',
      passed: Number(marketContext.slippagePercent ?? marketData.estimatedSlippagePercent ?? 0) <= Number(policy.maxSlippagePercent || 0.15),
      plainEnglish: `Estimated slippage is ${Number(marketContext.slippagePercent ?? marketData.estimatedSlippagePercent ?? 0).toFixed(4)}%.`,
      nextClick: 'Use a more liquid symbol or retry later.'
    }),
    buildPhase6CChecklistItem({
      id: 'risk_profile',
      label: 'Risk profile active',
      passed: riskActive,
      plainEnglish: riskActive ? `Risk profile ${riskProfile.name || riskProfile.id} is active.` : 'No active risk profile exists.',
      nextClick: 'Activate a safe risk profile.'
    }),
    buildPhase6CChecklistItem({
      id: 'kill_switch',
      label: 'Kill switch off for dry-run',
      passed: killSwitchOff,
      plainEnglish: killSwitchOff ? 'Kill switch is off for this dry-run proof.' : 'Kill switch is on or no risk profile exists.',
      nextClick: 'Only turn the kill switch off when ready for controlled testing.'
    }),
    buildPhase6CChecklistItem({
      id: 'withdrawal_disabled',
      label: 'Withdrawals disabled',
      passed: withdrawalDisabled,
      statusWhenFalse: 'Unsafe',
      plainEnglish: withdrawalDisabled ? 'Withdrawal permission is not detected.' : 'Withdrawal safety is not proven.',
      nextClick: 'Delete and recreate the API key without withdrawals.'
    }),
    buildPhase6CChecklistItem({
      id: 'live_endpoint_blocked',
      label: 'Live order endpoint still blocked',
      passed: liveEndpointBlocked && preview?.safeToSubmit !== true,
      plainEnglish: 'Phase 6C dry-run proof does not call or unlock the production order endpoint.',
      nextClick: 'No action needed.'
    })
  ];
  const passed = checks.every(check => check.passed);

  return {
    title: 'Production Dry-Run Proof',
    phase: 'Phase 6C',
    status: passed ? 'Dry-run proof passed; tiny live test still locked' : 'Dry-run proof blocked',
    passed,
    selectedExchange: credentialVerification?.displayName || order?.exchangeName || 'Selected exchange',
    symbol: order?.symbol,
    side: order?.side,
    orderType: order?.orderType,
    tinyAmountUsd: orderNotional,
    quantity: order?.quantity,
    limitPrice: order?.limitPrice || marketData.midPrice || null,
    feeEstimatePercent: credentialVerification?.proof?.fees?.takerFeePercent
      ?? credentialVerification?.proof?.fees?.fallbackFeePercent
      ?? 0.1,
    livePrice: marketData.midPrice || order?.limitPrice || null,
    spreadPercent: Number(marketData.spreadPercent || marketContext.netSpreadPercent || 0),
    slippagePercent: Number(marketContext.slippagePercent ?? marketData.estimatedSlippagePercent ?? 0),
    liquidityUsd: Number(marketContext.liquidityUsd ?? marketData.liquidityUsd ?? 0),
    accountBalance: { asset: requiredAsset, available: availableBalance, required: estimatedRequired },
    checklist: checks,
    checksPassed: checks.filter(check => check.passed).map(check => check.label),
    checksFailed: checks.filter(check => !check.passed).map(check => `${check.label}: ${check.plainEnglish}`),
    fullProductionSafetyStatus: safety?.status || 'locked',
    fullProductionSafetyMissing: (safety?.missing || []).map(item => ({ id: item.id, label: item.label, note: item.note, nextAction: item.nextAction })),
    plainEnglishStatus: passed
      ? 'The exact tiny order passed Phase 6C dry-run proof. Real order placement is still locked until owner approvals and final typed confirmation exist.'
      : 'The dry-run proof is blocked. No production order endpoint was called.',
    nextClick: passed ? 'Review Tiny Live Test Eligibility.' : checks.find(check => !check.passed)?.nextClick || 'Fix the blocked item and retry.',
    productionOrderEndpointCalled: false,
    productionOrderEndpointEnabled: false,
    safetyBoundary: createProductionSafetyBoundary(false)
  };
}

function buildPhase6CTinyLiveEligibility({ credentialVerification = null, dryRunProof = null, riskProfile = null } = {}) {
  const items = [
    buildPhase6CChecklistItem({
      id: 'exchange_connected',
      label: 'Exchange connected',
      passed: credentialVerification?.connectionStatus === 'production_account_verified',
      plainEnglish: credentialVerification?.plainEnglishStatus || 'The exchange has not been verified yet.',
      nextClick: 'Click Verify Real Exchange Credentials.'
    }),
    buildPhase6CChecklistItem({
      id: 'withdrawals_disabled',
      label: 'Withdrawals disabled',
      passed: credentialVerification?.withdrawalPermissionDetected === false,
      statusWhenFalse: 'Unsafe',
      plainEnglish: credentialVerification?.withdrawalPermissionDetected === false ? 'Withdrawal safety passed.' : 'Withdrawal safety is not proven.',
      nextClick: 'Recreate the API key without withdrawal permission.'
    }),
    buildPhase6CChecklistItem({
      id: 'balances_readable',
      label: 'Balances visible',
      passed: credentialVerification?.balancesReadable === true,
      plainEnglish: credentialVerification?.balancesReadable ? 'Balances can be read safely.' : 'Balances are not visible.',
      nextClick: 'Fix account read permission and verify again.'
    }),
    buildPhase6CChecklistItem({
      id: 'fees_loaded',
      label: 'Fees loaded',
      passed: credentialVerification?.feesLoaded === true,
      statusWhenFalse: 'Review Needed',
      plainEnglish: credentialVerification?.feesLoaded ? 'Fees are available for dry-run math.' : 'Fee estimate is missing.',
      nextClick: 'Verify credentials again.'
    }),
    buildPhase6CChecklistItem({
      id: 'symbol_rules_loaded',
      label: 'Symbol limits loaded',
      passed: credentialVerification?.symbolRulesLoaded === true,
      plainEnglish: credentialVerification?.symbolRulesLoaded ? 'Symbol size and precision rules are available.' : 'Symbol rules are missing.',
      nextClick: 'Choose a supported spot symbol.'
    }),
    buildPhase6CChecklistItem({
      id: 'dry_run_passed',
      label: 'Production dry-run passed',
      passed: dryRunProof?.passed === true,
      plainEnglish: dryRunProof?.passed ? 'The exact tiny order passed dry-run proof without calling the order endpoint.' : 'Dry-run proof has not passed yet.',
      nextClick: 'Click Run Production Dry-Run Proof.'
    }),
    buildPhase6CChecklistItem({
      id: 'risk_limits_active',
      label: 'Risk limits active',
      passed: Boolean(riskProfile?.id) && riskProfile.status === 'active' && Number(riskProfile.kill_switch_enabled || 0) === 0,
      plainEnglish: riskProfile?.id ? 'An active risk profile is available and kill switch is off.' : 'No active risk profile is ready.',
      nextClick: 'Activate a safe risk profile.'
    }),
    buildPhase6CChecklistItem({
      id: 'owner_confirmation_required',
      label: 'Owner typed confirmation required',
      passed: false,
      statusWhenFalse: 'Locked',
      plainEnglish: 'The final live order still requires a typed owner confirmation later. This is intentionally not complete from Phase 6C.',
      nextClick: 'Do not type a final order phrase until every tiny-live gate passes.'
    }),
    buildPhase6CChecklistItem({
      id: 'emergency_stop_available',
      label: 'Emergency stop available',
      passed: true,
      plainEnglish: 'Emergency stop remains available and disables production approvals/live connector flags.',
      nextClick: 'No action needed.'
    })
  ];

  return {
    title: 'Tiny Live Test Eligibility',
    status: items.filter(item => item.id !== 'owner_confirmation_required').every(item => item.passed)
      ? 'Eligible except final owner confirmation'
      : 'Not eligible yet',
    eligibleExceptFinalConfirmation: items.filter(item => item.id !== 'owner_confirmation_required').every(item => item.passed),
    items,
    safetyBoundary: createProductionSafetyBoundary(false)
  };
}

function buildPhase6CWizard({
  connectors = [],
  vaultStatus = null,
  approvals = [],
  latestOrders = [],
  riskProfile = null,
  latestSandboxTests = [],
  exchangeReadiness = {},
  selectedExchangeName = '',
  credentialVerification = null,
  dryRunProof = null
} = {}) {
  const selected = normalizePhase6ExchangeName(selectedExchangeName || PHASE6C_RECOMMENDED_FIRST_EXCHANGE);
  const phase6B = buildProductionActivationWizard({
    connectors,
    vaultStatus,
    approvals,
    latestOrders,
    riskProfile,
    latestSandboxTests,
    exchangeReadiness,
    selectedExchangeName: selected
  });
  const selectedExchange = phase6B.checklist.exchanges.find(exchange => exchange.exchangeName === selected)
    || phase6B.selectedExchange
    || phase6B.checklist.exchanges[0];
  const guide = PHASE6B_ACTIVATION_EXCHANGE_GUIDES[selectedExchange?.exchangeName] || selectedExchange?.guide || {};
  const productionConnection = (connectors || []).find(connector => (
    normalizePhase6ExchangeName(connector.settings?.registryId || connector.exchange_name) === selectedExchange?.exchangeName
  ))?.settings?.productionConnection || {};
  const latestPhase6CVerification = credentialVerification
    || productionConnection.phase6CVerification
    || null;
  const latestDryRun = dryRunProof || selectedExchange?.latestDryRun || null;
  const dryRunForEligibility = dryRunProof
    || (latestDryRun?.status === 'preview_ready'
      ? {
          passed: true,
          plainEnglishStatus: 'A prior production dry-run preview passed without calling the order endpoint.',
          checksPassed: ['Production dry-run passed']
        }
      : null);
  const tinyLiveEligibility = buildPhase6CTinyLiveEligibility({
    credentialVerification: latestPhase6CVerification,
    dryRunProof: dryRunForEligibility,
    riskProfile
  });
  const steps = [
    {
      id: 'choose_exchange',
      title: 'Step 1: Choose exchange',
      status: selectedExchange ? 'Safe' : 'Missing',
      button: 'Start Live Setup Safely',
      plainEnglish: `${selectedExchange?.displayName || 'Kraken'} is selected. Kraken is recommended first for Phase 6C.`
    },
    {
      id: 'add_api_key',
      title: 'Step 2: Add API key safely',
      status: selectedExchange?.productionCredentialsSaved ? 'Safe' : 'Missing',
      button: 'Add API Key Safely',
      plainEnglish: selectedExchange?.productionCredentialsSaved ? 'A production key reference exists in the encrypted vault.' : 'Save a restricted key to the encrypted local vault. It will not be displayed again.'
    },
    {
      id: 'verify_permissions',
      title: 'Step 3: Verify permissions',
      status: latestPhase6CVerification?.status || (selectedExchange?.connected ? 'Authenticated Read-Only' : 'Missing'),
      button: 'Verify Real Exchange Credentials',
      plainEnglish: latestPhase6CVerification?.plainEnglishStatus || 'Verify account reads, withdrawal safety, balances, fees, limits, rate notes, and symbol rules.'
    },
    {
      id: 'run_dry_run',
      title: 'Step 4: Run production dry-run',
      status: dryRunForEligibility?.passed || latestDryRun?.status === 'preview_ready' ? 'Safe' : 'Missing',
      button: 'Run Production Dry-Run Proof',
      plainEnglish: dryRunForEligibility?.plainEnglishStatus || 'Simulate the exact tiny order and prove the production order endpoint remains locked.'
    },
    {
      id: 'review_eligibility',
      title: 'Step 5: Review tiny live test eligibility',
      status: tinyLiveEligibility.eligibleExceptFinalConfirmation ? 'Review Needed' : 'Locked',
      button: 'Review Tiny Live Eligibility',
      plainEnglish: tinyLiveEligibility.status
    }
  ];
  const firstBlocked = steps.find(step => step.status !== 'Safe' && step.status !== 'Review Needed');
  const reportChecksPassed = [
    ...(latestPhase6CVerification?.checksPassed || []),
    ...(dryRunProof?.checksPassed || [])
  ];
  const reportChecksFailed = [
    ...(latestPhase6CVerification?.checksFailed || []),
    ...(dryRunProof?.checksFailed || [])
  ];

  return {
    title: 'Phase 6C: Real Credential Verification And Dry-Run Proof',
    phase: 'Phase 6C',
    recommendedExchangeName: PHASE6C_RECOMMENDED_FIRST_EXCHANGE,
    recommendedExchangeDisplayName: PHASE6_PRODUCTION_ADAPTERS[PHASE6C_RECOMMENDED_FIRST_EXCHANGE]?.displayName || 'Kraken',
    selectedExchangeName: selectedExchange?.exchangeName || PHASE6C_RECOMMENDED_FIRST_EXCHANGE,
    selectedExchangeDisplayName: selectedExchange?.displayName || 'Kraken',
    mostReadyExchange: selectedExchange?.displayName || 'Kraken',
    status: tinyLiveEligibility.eligibleExceptFinalConfirmation ? 'Dry-run ready for owner review' : 'Locked setup in progress',
    whatToDoNow: firstBlocked
      ? `${firstBlocked.button}: ${firstBlocked.plainEnglish}`
      : 'Review tiny live eligibility. The final order path is still locked until later owner confirmation.',
    whatIsSafe: [
      'Credential values stay in the encrypted production vault.',
      'Verification reads account metadata only.',
      'Production dry-run proof does not call the real order endpoint.',
      'Withdrawals, wallet signing, margin, futures, leverage, and autonomous trading remain disabled.'
    ],
    whatIsLocked: [
      'Unrestricted live trading remains locked.',
      'Real order placement remains locked until all approvals and final typed confirmation exist.',
      'Withdrawals and wallet signing remain disabled.',
      'Autonomous trading remains disabled.'
    ],
    steps,
    guide,
    defaultOrder: guide.defaultOrder || { symbol: 'BTC/USD', side: 'buy', orderType: 'limit', quantity: 0.001, limitPrice: 0, notionalUsd: 10 },
    selectedExchange,
    credentialVerification: latestPhase6CVerification,
    dryRunProof: dryRunProof || null,
    tinyLiveEligibility,
    report: {
      mostReadyExchange: selectedExchange?.displayName || 'Kraken',
      checksPassed: reportChecksPassed,
      checksFailed: reportChecksFailed,
      tinyLiveEligible: tinyLiveEligibility.eligibleExceptFinalConfirmation,
      remainingBeforeFirstTinyLiveOrder: tinyLiveEligibility.items
        .filter(item => !item.passed)
        .map(item => `${item.label}: ${item.plainEnglish}`)
    },
    exchangeOptions: phase6B.exchangeOptions,
    safetyBoundary: createProductionSafetyBoundary(false)
  };
}

function createPlainEnglishProductionError(exchangeName, error) {
  const rawMessage = String(error?.message || error || '').slice(0, 500);
  const lower = rawMessage.toLowerCase();
  const displayName = getProductionAdapter(exchangeName)?.displayName || exchangeName;

  if (/401|403|unauthorized|forbidden|permission|denied|invalid api|invalid signature/.test(lower)) {
    return `${displayName} rejected the production key or permission. Confirm spot trading only, withdrawals/transfers disabled, no margin/futures/leverage, and the correct API authentication format.`;
  }

  if (/insufficient|balance|fund/.test(lower)) {
    return `${displayName} reports insufficient available spot balance. Lower the order amount or fund the spot account.`;
  }

  if (/filter|min|lot|size|precision|notional|increment/.test(lower)) {
    return `${displayName} rejected the order size, price, precision, or minimum notional. Adjust quantity, price, or pair.`;
  }

  if (/timeout|network|fetch failed|enotfound|econn|abort/.test(lower)) {
    return `${displayName} could not be reached from this Mac. Check internet/VPN/firewall and retry only after refreshing the preview.`;
  }

  if (/withdraw|transfer/.test(lower)) {
    return `${displayName} returned a withdrawal/transfer-related message. Stop and recreate the API key without transfer or withdrawal permissions.`;
  }

  return `${displayName} production execution failed: ${rawMessage || 'unknown error'}. Emergency controls remain available and autonomous trading remains disabled.`;
}

module.exports = {
  EXCHANGE_PRODUCTION_VAULT_PATH,
  PHASE6_ENABLE_LIVE_CONFIRMATION_PHRASE,
  PHASE6_ORDER_CONFIRMATION_PHRASE,
  PHASE6_APPROVAL_SCOPE_TYPES,
  PHASE6_ORDER_STATUSES,
  DEFAULT_PHASE6_POLICY,
  PHASE6_PRODUCTION_ADAPTERS,
  PHASE6B_RECOMMENDED_FIRST_EXCHANGE,
  PHASE6C_RECOMMENDED_FIRST_EXCHANGE,
  PHASE6B_ACTIVATION_EXCHANGE_GUIDES,
  getProductionAdapter,
  getProductionReferenceName,
  sanitizeProductionCredentialInput,
  sanitizeProductionPermissionsChecklist,
  saveProductionVaultCredentials,
  loadProductionVaultCredentials,
  deleteProductionVaultCredentials,
  getProductionVaultStatus,
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
  createProductionSafetyBoundary,
  createPlainEnglishProductionError
};
