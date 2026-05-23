const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const OWNER_SECRETS_DIR = path.join(os.homedir(), 'EtherealAI_Secrets');
const EXCHANGE_READONLY_VAULT_PATH = path.join(OWNER_SECRETS_DIR, 'exchange-readonly-vault.json');
const EXCHANGE_READONLY_VAULT_KEY_PATH = path.join(OWNER_SECRETS_DIR, 'exchange-readonly-vault.key');
const RECOMMENDED_READONLY_EXCHANGES = ['binance', 'coinbase', 'kraken', 'okx', 'bybit'];
const QUOTE_ONLY_CONNECTORS = ['uniswap', 'jupiter', 'one-inch', 'gmx', 'hyperliquid'];

const EXCHANGE_READONLY_SETUP_GUIDES = {
  binance: {
    exchangeName: 'binance',
    displayName: 'Binance',
    category: 'Recommended First',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    setupUrl: 'https://www.binance.com/en/my/settings/api-management',
    docsUrl: 'https://developers.binance.com/docs/binance-spot-api-docs',
    exactSteps: [
      'Log in to Binance in your browser.',
      'Open API Management from account settings.',
      'Create a new system-generated API key named EtherealAI Read Only.',
      'Enable read-only access only.',
      'Do not enable spot trading, margin trading, futures trading, or withdrawals.',
      'If Binance offers IP restrictions for your account, restrict the key to your current trusted IP/VPN exit.',
      'Copy the API key and secret once, paste them into this wizard, then store nothing in screenshots or notes.'
    ],
    permissionsChecklist: [
      'Read access is enabled.',
      'Spot/futures/margin trading is disabled.',
      'Withdrawals are disabled.',
      'IP restriction is enabled or reviewed.',
      '2FA is enabled on the exchange account.'
    ],
    warning: 'Never enable Binance withdrawal permission for EtherealAI. This workflow only verifies read/account access and market data.'
  },
  coinbase: {
    exchangeName: 'coinbase',
    displayName: 'Coinbase',
    category: 'Recommended First',
    credentialFields: ['apiKey', 'apiSecret', 'passphrase'],
    passphraseRequired: true,
    setupUrl: 'https://www.coinbase.com/settings/api',
    docsUrl: 'https://docs.cdp.coinbase.com/coinbase-business/advanced-trade-apis/rest-api',
    exactSteps: [
      'Log in to Coinbase/Coinbase Exchange in your browser.',
      'Open API settings and create a new API key for the portfolio you want to monitor.',
      'Choose View/read permission only.',
      'Do not enable Trade, Transfer, Manage, or withdrawal-capable permissions.',
      'Use an IP allowlist if Coinbase offers it for this key.',
      'Copy the public key, secret, and passphrase when shown. Coinbase will not show the secret again.',
      'Paste them into this wizard only long enough for EtherealAI to place them in the local vault.'
    ],
    permissionsChecklist: [
      'View/read permission is enabled.',
      'Trade permission is disabled.',
      'Transfer/withdraw permission is disabled.',
      'Manage/admin permission is disabled.',
      'IP allowlist is enabled or reviewed.',
      '2FA is enabled on the exchange account.'
    ],
    warning: 'Coinbase transfer permission can move value. Keep it disabled for EtherealAI read-only operation.'
  },
  kraken: {
    exchangeName: 'kraken',
    displayName: 'Kraken',
    category: 'Recommended First',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    setupUrl: 'https://pro.kraken.com/app/settings/api',
    docsUrl: 'https://docs.kraken.com/api/docs/rest-api/get-account-balance/',
    exactSteps: [
      'Log in to Kraken Pro in your browser.',
      'Open Settings, then API.',
      'Create a key named EtherealAI Read Only.',
      'Enable Query Funds for read-only account verification.',
      'Optionally enable query-only ledger/order-history permissions if you want later reporting.',
      'Do not enable Add Order, Cancel Order, Withdraw Funds, Deposit Funds, or staking/earn mutation permissions.',
      'Copy the key and private key once, then paste them into this wizard.'
    ],
    permissionsChecklist: [
      'Query Funds is enabled.',
      'Trading/order permissions are disabled.',
      'Withdraw Funds is disabled.',
      'Deposit/mutation permissions are disabled.',
      '2FA is enabled on the exchange account.'
    ],
    warning: 'Kraken Withdraw Funds permission is not needed. Do not enable it for EtherealAI.'
  },
  okx: {
    exchangeName: 'okx',
    displayName: 'OKX',
    category: 'Recommended First',
    credentialFields: ['apiKey', 'apiSecret', 'passphrase'],
    passphraseRequired: true,
    setupUrl: 'https://www.okx.com/account/my-api',
    docsUrl: 'https://www.okx.com/docs-v5/en/',
    exactSteps: [
      'Log in to OKX in your browser.',
      'Open API from account/security settings.',
      'Create an API key named EtherealAI Read Only.',
      'Choose Read permission only.',
      'Do not choose Trade or Withdraw.',
      'Bind the key to a trusted IP when possible.',
      'Copy the API key, secret key, and passphrase once, then paste them into this wizard.'
    ],
    permissionsChecklist: [
      'Read permission is enabled.',
      'Trade permission is disabled.',
      'Withdraw permission is disabled.',
      'IP binding is enabled or reviewed.',
      '2FA is enabled on the exchange account.'
    ],
    warning: 'OKX Trade and Withdraw permissions are blocked for this phase.'
  },
  bybit: {
    exchangeName: 'bybit',
    displayName: 'Bybit',
    category: 'Recommended First',
    credentialFields: ['apiKey', 'apiSecret'],
    passphraseRequired: false,
    setupUrl: 'https://www.bybit.com/app/user/api-management',
    docsUrl: 'https://bybit-exchange.github.io/docs/v5/intro',
    exactSteps: [
      'Log in to Bybit in your browser.',
      'Open API Management.',
      'Create a system-generated key named EtherealAI Read Only.',
      'Choose Read-Only permissions.',
      'Do not enable order placement, transfer, withdrawal, or position mutation permissions.',
      'Set IP restrictions if available for your account.',
      'Copy the key and secret once, then paste them into this wizard.'
    ],
    permissionsChecklist: [
      'Read-Only is selected.',
      'Order placement/trading is disabled.',
      'Transfer/withdrawal is disabled.',
      'IP restriction is enabled or reviewed.',
      '2FA is enabled on the exchange account.'
    ],
    warning: 'Bybit read-only keys are enough for EtherealAI Phase 2. Do not enable order or withdrawal permissions.'
  }
};

const DEX_QUOTE_ONLY_SETUP_GUIDES = {
  uniswap: {
    exchangeName: 'uniswap',
    displayName: 'Uniswap',
    category: 'Quote-Only DEX / Aggregator',
    credentialFields: ['optionalApiKeyOrRpcReference'],
    setupUrl: 'https://api-docs.uniswap.org/api-reference/swapping/quote',
    instructions: [
      'Use quote/read-only mode only.',
      'No wallet connection, private key, seed phrase, token approval, permit signature, or swap submission is allowed in this phase.',
      'Future quote support needs chain, token addresses, sell amount, and a quote provider reference.'
    ],
    warning: 'Uniswap quotes can include permit/signing data. EtherealAI must never request or submit that signature in Phase 2.'
  },
  jupiter: {
    exchangeName: 'jupiter',
    displayName: 'Jupiter',
    category: 'Quote-Only DEX / Aggregator',
    credentialFields: ['optionalSolanaRpcReference'],
    setupUrl: 'https://station.jup.ag/docs/apis/quote-api',
    instructions: [
      'Use quote/read-only mode only.',
      'No Solana wallet signing or swap transaction creation is allowed in this phase.',
      'Future quote support needs input mint, output mint, amount, and slippage settings.'
    ],
    warning: 'Jupiter quote mode must not create, sign, or broadcast Solana transactions.'
  },
  'one-inch': {
    exchangeName: 'one-inch',
    displayName: '1inch',
    category: 'Quote-Only DEX / Aggregator',
    credentialFields: ['optionalApiKeyReference'],
    setupUrl: 'https://portal.1inch.dev/',
    instructions: [
      'Use quote/read-only mode only.',
      'Store only a local reference for any 1inch API key.',
      'Do not call swap endpoints or request wallet signatures in this phase.'
    ],
    warning: '1inch swap execution is out of scope. Quote-only planning remains safe.'
  },
  gmx: {
    exchangeName: 'gmx',
    displayName: 'GMX',
    category: 'Quote-Only DEX / Aggregator',
    credentialFields: ['optionalRpcOrIndexerReference'],
    setupUrl: 'https://docs.gmx.io/',
    instructions: [
      'Use quote/read-only mode only.',
      'No Arbitrum/Avalanche wallet signing is allowed in this phase.',
      'Future quote support needs the target chain and a read-only quote/indexer provider.'
    ],
    warning: 'GMX execution requires wallet signing and remains locked.'
  },
  hyperliquid: {
    exchangeName: 'hyperliquid',
    displayName: 'Hyperliquid',
    category: 'Quote-Only DEX / Aggregator',
    credentialFields: ['optionalReadOnlyAddress'],
    setupUrl: 'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint',
    instructions: [
      'Use public info endpoints for market prices.',
      'No vault/subaccount trading, signing, or order placement is allowed in this phase.',
      'Future account-specific checks must remain read-only and redact balances/positions from UI summaries.'
    ],
    warning: 'Hyperliquid order endpoints remain locked. Phase 2 can use public mids only.'
  }
};

function normalizeExchangeName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/_/g, '-');
}

function normalizeTradingSymbol(symbol = 'BTC/USDT') {
  const raw = String(symbol || 'BTC/USDT').trim().toUpperCase().replace('-', '/');
  const [base = 'BTC', quote = 'USDT'] = raw.split('/');

  return {
    base: base === 'XBT' ? 'BTC' : base,
    quote,
    canonical: `${base === 'XBT' ? 'BTC' : base}/${quote}`,
    compact: `${base === 'XBT' ? 'BTC' : base}${quote}`,
    dash: `${base === 'XBT' ? 'BTC' : base}-${quote}`,
    kraken: `${base === 'BTC' ? 'XBT' : base}${quote}`
  };
}

function redactValue(value = '') {
  const text = String(value || '');
  if (!text) {
    return '';
  }

  if (text.length <= 8) {
    return 'stored';
  }

  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function createPlainEnglishExchangeError(exchangeName, error) {
  const rawMessage = String(error?.message || error || '').slice(0, 500);
  const lower = rawMessage.toLowerCase();

  if (/401|403|unauthorized|forbidden|invalid api|invalid signature|permission|denied/.test(lower)) {
    return `${exchangeName} rejected the read-only credential check. Verify the key, secret, passphrase if required, and read/view permissions. Keep trading and withdrawals disabled.`;
  }

  if (/timeout|network|fetch failed|enotfound|econn/.test(lower)) {
    return `${exchangeName} could not be reached from this Mac right now. Check internet/VPN/firewall, then retry. No live trading was attempted.`;
  }

  if (/withdraw|trade|order/.test(lower)) {
    return `${exchangeName} returned an unexpected permission message. Do not add trading or withdrawal permissions; recreate a read-only key if needed.`;
  }

  return `${exchangeName} read-only test failed: ${rawMessage || 'unknown error'}`;
}

function createPlainEnglishPublicMarketDataError(exchangeName, error) {
  const rawMessage = String(error?.message || error || '').slice(0, 500);
  const lower = rawMessage.toLowerCase();

  if (/451|restricted location|eligibility|region|unavailable from/.test(lower)) {
    return `${exchangeName} public market-data endpoint is blocked from this network or region. No API key, order, withdrawal, or wallet signing was used.`;
  }

  if (/401|403|unauthorized|forbidden|permission|denied/.test(lower)) {
    return `${exchangeName} public market-data endpoint rejected this request. This was a public price check only; no account credential or trading permission was used.`;
  }

  if (/timeout|network|fetch failed|enotfound|econn|abort/.test(lower)) {
    return `${exchangeName} public market-data endpoint could not be reached from this Mac right now. Check internet/VPN/firewall, then retry. No live trading was attempted.`;
  }

  return `${exchangeName} public market-data check failed: ${rawMessage || 'unknown error'}. No live trading, wallet signing, withdrawals, or orders were attempted.`;
}

async function ensureVaultStorage() {
  await fs.mkdir(OWNER_SECRETS_DIR, { recursive: true, mode: 0o700 });
  await fs.chmod(OWNER_SECRETS_DIR, 0o700).catch(() => {});
}

async function getVaultKey() {
  await ensureVaultStorage();

  try {
    const existing = (await fs.readFile(EXCHANGE_READONLY_VAULT_KEY_PATH, 'utf8')).trim();
    if (/^[a-f0-9]{64}$/i.test(existing)) {
      return Buffer.from(existing, 'hex');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const key = crypto.randomBytes(32);
  await fs.writeFile(EXCHANGE_READONLY_VAULT_KEY_PATH, key.toString('hex'), {
    mode: 0o600,
    flag: 'wx'
  }).catch(async error => {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  });
  await fs.chmod(EXCHANGE_READONLY_VAULT_KEY_PATH, 0o600).catch(() => {});

  return Buffer.from((await fs.readFile(EXCHANGE_READONLY_VAULT_KEY_PATH, 'utf8')).trim(), 'hex');
}

async function readVaultFile() {
  await ensureVaultStorage();

  try {
    const raw = await fs.readFile(EXCHANGE_READONLY_VAULT_PATH, 'utf8');
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

async function writeVaultFile(vault) {
  await ensureVaultStorage();
  const tmpPath = `${EXCHANGE_READONLY_VAULT_PATH}.tmp`;

  await fs.writeFile(tmpPath, JSON.stringify(vault, null, 2), {
    mode: 0o600
  });
  await fs.chmod(tmpPath, 0o600).catch(() => {});
  await fs.rename(tmpPath, EXCHANGE_READONLY_VAULT_PATH);
  await fs.chmod(EXCHANGE_READONLY_VAULT_PATH, 0o600).catch(() => {});
}

function encryptVaultPayload(referenceName, payload, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(referenceName));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return {
    algorithm: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
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

function sanitizeCredentialInput(credentials = {}, guide = null) {
  const apiKey = String(credentials.apiKey || '').trim();
  const apiSecret = String(credentials.apiSecret || '').trim();
  const passphrase = String(credentials.passphrase || '').trim();

  if (!apiKey) {
    throw new Error('API key is required.');
  }

  if (!apiSecret) {
    throw new Error('API secret is required.');
  }

  if (guide?.passphraseRequired && !passphrase) {
    throw new Error(`${guide.displayName} requires the passphrase shown when the API key is created.`);
  }

  return {
    apiKey,
    apiSecret,
    passphrase
  };
}

function sanitizePermissionsChecklist(checklist = {}) {
  const normalized = {
    readOnlyEnabled: Boolean(checklist.readOnlyEnabled),
    tradingDisabled: Boolean(checklist.tradingDisabled),
    withdrawalsDisabled: Boolean(checklist.withdrawalsDisabled),
    transferDisabled: Boolean(checklist.transferDisabled ?? checklist.withdrawalsDisabled),
    ipRestrictionReviewed: Boolean(checklist.ipRestrictionReviewed),
    twoFactorEnabled: Boolean(checklist.twoFactorEnabled),
    ownerUnderstandsReadOnlyOnly: Boolean(checklist.ownerUnderstandsReadOnlyOnly)
  };
  const missing = [];

  if (!normalized.readOnlyEnabled) missing.push('confirm read/view access is enabled');
  if (!normalized.tradingDisabled) missing.push('confirm trading/order permissions are disabled');
  if (!normalized.withdrawalsDisabled) missing.push('confirm withdrawals are disabled');
  if (!normalized.ownerUnderstandsReadOnlyOnly) missing.push('confirm EtherealAI must stay read-only');

  return {
    checklist: normalized,
    missing
  };
}

function getReadOnlyReferenceName({ userId, connectorId, exchangeName }) {
  return `exchange-readonly:${userId}:${connectorId}:${exchangeName}`;
}

async function saveReadOnlyVaultCredentials({ referenceName, connector, exchangeName, credentials, permissionsChecklist }) {
  const key = await getVaultKey();
  const vault = await readVaultFile();
  const now = new Date().toISOString();
  const payload = {
    exchangeName,
    connectorId: connector.id,
    apiKey: credentials.apiKey,
    apiSecret: credentials.apiSecret,
    passphrase: credentials.passphrase || '',
    permissionsChecklist,
    savedAt: now
  };

  vault.entries[referenceName] = {
    referenceName,
    exchangeName,
    connectorId: connector.id,
    encrypted: encryptVaultPayload(referenceName, payload, key),
    metadata: {
      apiKeyFingerprint: redactValue(credentials.apiKey),
      hasExtraPhrase: Boolean(credentials.passphrase),
      permissionsChecklist,
      rotatedAt: now,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false
    }
  };

  await writeVaultFile(vault);

  return {
    referenceName,
    exchangeName,
    connectorId: connector.id,
    stored: true,
    apiKeyFingerprint: redactValue(credentials.apiKey),
    hasExtraPhrase: Boolean(credentials.passphrase),
    rotatedAt: now,
    vaultPath: EXCHANGE_READONLY_VAULT_PATH,
    keyPath: EXCHANGE_READONLY_VAULT_KEY_PATH,
    permissions: {
      mode: 'read-only',
      withdrawalsEnabled: false,
      liveTradingEnabled: false,
      walletSigningEnabled: false
    }
  };
}

async function loadReadOnlyVaultCredentials(referenceName) {
  const key = await getVaultKey();
  const vault = await readVaultFile();
  const entry = vault.entries[referenceName];

  if (!entry) {
    return null;
  }

  return decryptVaultPayload(referenceName, entry.encrypted, key);
}

async function deleteReadOnlyVaultCredentials(referenceName) {
  const vault = await readVaultFile();
  const existed = Boolean(vault.entries[referenceName]);

  if (existed) {
    delete vault.entries[referenceName];
    await writeVaultFile(vault);
  }

  return { deleted: existed, referenceName };
}

async function getReadOnlyVaultStatus(referenceName = null) {
  const vault = await readVaultFile();
  const entries = referenceName
    ? Object.values(vault.entries).filter(entry => entry.referenceName === referenceName)
    : Object.values(vault.entries);

  return {
    vaultPath: EXCHANGE_READONLY_VAULT_PATH,
    keyPath: EXCHANGE_READONLY_VAULT_KEY_PATH,
    entryCount: Object.keys(vault.entries).length,
    entries: entries.map(entry => ({
      referenceName: entry.referenceName,
      exchangeName: entry.exchangeName,
      connectorId: entry.connectorId,
      metadata: entry.metadata || {},
      secretValuesReturned: false
    })),
    secretsDisplayed: false,
    browserLocalStorageUsed: false,
    liveTradingEnabled: false,
    withdrawalsEnabled: false,
    walletSigningEnabled: false
  };
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'EtherealAI-ReadOnly/1.0',
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

function hmacHex(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function hmacBase64(secret, payload, algorithm = 'sha256') {
  return crypto.createHmac(algorithm, secret).update(payload).digest('base64');
}

async function fetchBinanceTicker(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const data = await fetchJsonWithTimeout(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${normalized.compact}`);
  return {
    exchangeName: 'binance',
    displayName: 'Binance',
    symbol: normalized.canonical,
    bid: Number(data.bidPrice),
    ask: Number(data.askPrice),
    last: null,
    source: 'public bookTicker',
    fetchedAt: new Date().toISOString()
  };
}

async function fetchCoinbaseTicker(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const data = await fetchJsonWithTimeout(`https://api.exchange.coinbase.com/products/${normalized.dash}/ticker`);
  return {
    exchangeName: 'coinbase',
    displayName: 'Coinbase',
    symbol: normalized.canonical,
    bid: Number(data.bid),
    ask: Number(data.ask),
    last: Number(data.price),
    source: 'public product ticker',
    fetchedAt: new Date().toISOString()
  };
}

async function fetchKrakenTicker(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const data = await fetchJsonWithTimeout(`https://api.kraken.com/0/public/Ticker?pair=${normalized.kraken}`);
  const result = data.result || {};
  const firstKey = Object.keys(result)[0];
  const ticker = result[firstKey] || {};
  return {
    exchangeName: 'kraken',
    displayName: 'Kraken',
    symbol: normalized.canonical,
    bid: Number(ticker.b?.[0]),
    ask: Number(ticker.a?.[0]),
    last: Number(ticker.c?.[0]),
    source: 'public ticker',
    fetchedAt: new Date().toISOString()
  };
}

async function fetchOkxTicker(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const data = await fetchJsonWithTimeout(`https://www.okx.com/api/v5/market/ticker?instId=${normalized.dash}`);
  const ticker = data.data?.[0] || {};
  return {
    exchangeName: 'okx',
    displayName: 'OKX',
    symbol: normalized.canonical,
    bid: Number(ticker.bidPx),
    ask: Number(ticker.askPx),
    last: Number(ticker.last),
    source: 'public market ticker',
    fetchedAt: new Date().toISOString()
  };
}

async function fetchBybitTicker(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const data = await fetchJsonWithTimeout(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${normalized.compact}`);
  const ticker = data.result?.list?.[0] || {};
  return {
    exchangeName: 'bybit',
    displayName: 'Bybit',
    symbol: normalized.canonical,
    bid: Number(ticker.bid1Price),
    ask: Number(ticker.ask1Price),
    last: Number(ticker.lastPrice),
    source: 'public spot ticker',
    fetchedAt: new Date().toISOString()
  };
}

async function fetchHyperliquidMid(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const data = await fetchJsonWithTimeout('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'allMids' })
  });
  const mid = Number(data[normalized.base]);

  return {
    exchangeName: 'hyperliquid',
    displayName: 'Hyperliquid',
    symbol: normalized.canonical,
    bid: mid,
    ask: mid,
    last: mid,
    source: 'public allMids',
    fetchedAt: new Date().toISOString()
  };
}

const PUBLIC_TICKER_FETCHERS = {
  binance: fetchBinanceTicker,
  coinbase: fetchCoinbaseTicker,
  kraken: fetchKrakenTicker,
  okx: fetchOkxTicker,
  bybit: fetchBybitTicker,
  hyperliquid: fetchHyperliquidMid
};

async function testBinanceCredentials(credentials) {
  const timestamp = Date.now();
  const query = `timestamp=${timestamp}&recvWindow=5000`;
  const signature = hmacHex(credentials.apiSecret, query);
  await fetchJsonWithTimeout(`https://api.binance.com/api/v3/account?${query}&signature=${signature}`, {
    headers: {
      'X-MBX-APIKEY': credentials.apiKey
    }
  });
  return { endpoint: 'GET /api/v3/account', privateDataReturnedToUi: false };
}

async function testCoinbaseCredentials(credentials) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const requestPath = '/accounts';
  const method = 'GET';
  const signature = hmacBase64(Buffer.from(credentials.apiSecret, 'base64'), `${timestamp}${method}${requestPath}`);
  await fetchJsonWithTimeout(`https://api.exchange.coinbase.com${requestPath}`, {
    headers: {
      'CB-ACCESS-KEY': credentials.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-ACCESS-PASSPHRASE': credentials.passphrase
    }
  });
  return { endpoint: 'GET /accounts', privateDataReturnedToUi: false };
}

async function testKrakenCredentials(credentials) {
  const nonce = Date.now().toString();
  const requestPath = '/0/private/Balance';
  const postData = `nonce=${nonce}`;
  const secret = Buffer.from(credentials.apiSecret, 'base64');
  const hash = crypto.createHash('sha256').update(nonce + postData).digest();
  const signature = crypto.createHmac('sha512', secret).update(Buffer.concat([Buffer.from(requestPath), hash])).digest('base64');
  await fetchJsonWithTimeout(`https://api.kraken.com${requestPath}`, {
    method: 'POST',
    headers: {
      'API-Key': credentials.apiKey,
      'API-Sign': signature,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: postData
  });
  return { endpoint: 'POST /0/private/Balance', privateDataReturnedToUi: false };
}

async function testOkxCredentials(credentials) {
  const timestamp = new Date().toISOString();
  const requestPath = '/api/v5/account/balance';
  const signature = hmacBase64(credentials.apiSecret, `${timestamp}GET${requestPath}`);
  await fetchJsonWithTimeout(`https://www.okx.com${requestPath}`, {
    headers: {
      'OK-ACCESS-KEY': credentials.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': credentials.passphrase,
      'x-simulated-trading': '0'
    }
  });
  return { endpoint: 'GET /api/v5/account/balance', privateDataReturnedToUi: false };
}

async function testBybitCredentials(credentials) {
  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  const query = 'accountType=UNIFIED';
  const signature = hmacHex(credentials.apiSecret, `${timestamp}${credentials.apiKey}${recvWindow}${query}`);
  await fetchJsonWithTimeout(`https://api.bybit.com/v5/account/wallet-balance?${query}`, {
    headers: {
      'X-BAPI-API-KEY': credentials.apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow
    }
  });
  return { endpoint: 'GET /v5/account/wallet-balance', privateDataReturnedToUi: false };
}

const PRIVATE_READONLY_TESTERS = {
  binance: testBinanceCredentials,
  coinbase: testCoinbaseCredentials,
  kraken: testKrakenCredentials,
  okx: testOkxCredentials,
  bybit: testBybitCredentials
};

async function fetchPublicTicker(exchangeName, symbol = 'BTC/USDT') {
  const normalizedExchange = normalizeExchangeName(exchangeName);
  const fetcher = PUBLIC_TICKER_FETCHERS[normalizedExchange];

  if (!fetcher) {
    throw new Error(`${exchangeName} does not have a public ticker fetcher yet.`);
  }

  const ticker = await fetcher(symbol);

  if (![ticker.bid, ticker.ask, ticker.last].some(value => Number.isFinite(value) && value > 0)) {
    throw new Error(`${exchangeName} returned an incomplete ticker for ${symbol}.`);
  }

  return ticker;
}

async function testReadOnlyExchangeConnection({ connector, registryEntry, credentials = null, symbol = 'BTC/USDT' }) {
  const exchangeName = normalizeExchangeName(registryEntry?.exchangeName || connector?.exchange_name);
  const displayName = registryEntry?.name || exchangeName;
  const checks = [];
  const addCheck = check => {
    checks.push({
      severity: 'block',
      note: '',
      ...check,
      passed: Boolean(check.passed)
    });
  };

  addCheck({
    id: 'live_trading_locked',
    label: 'Live trading remains locked',
    passed: true,
    metric: 'locked'
  });
  addCheck({
    id: 'withdrawals_disabled',
    label: 'Withdrawals remain disabled',
    passed: true,
    metric: 'disabled'
  });
  addCheck({
    id: 'wallet_signing_disabled',
    label: 'Wallet signing remains disabled',
    passed: true,
    metric: 'disabled'
  });

  let ticker = null;
  let publicError = null;

  try {
    ticker = await fetchPublicTicker(exchangeName, symbol);
    addCheck({
      id: 'public_market_data',
      label: 'Public market-data endpoint works',
      passed: true,
      metric: ticker.source,
      severity: 'review'
    });
  } catch (error) {
    publicError = createPlainEnglishPublicMarketDataError(displayName, error);
    addCheck({
      id: 'public_market_data',
      label: 'Public market-data endpoint works',
      passed: false,
      metric: publicError,
      severity: 'review'
    });
  }

  if (!credentials) {
    addCheck({
      id: 'credential_available',
      label: 'Read-only credential exists in local vault',
      passed: false,
      metric: 'not saved yet',
      severity: 'review',
      note: 'Public market data can still be checked without account credentials.'
    });

    return {
      status: 'not_connected',
      connectionStatus: 'Not Connected',
      plainEnglishStatus: 'No read-only API key is saved yet. You can still use public market data, then add a read-only key later.',
      exchangeName,
      displayName,
      ticker,
      publicError,
      privateCheck: null,
      checks,
      failures: checks.filter(check => !check.passed).map(check => check.id),
      safetyBoundary: {
        liveTradingEnabled: false,
        withdrawalsEnabled: false,
        walletSigningEnabled: false,
        orderEndpointCalled: false,
        privateDataReturnedToUi: false
      },
      generatedAt: new Date().toISOString()
    };
  }

  const privateTester = PRIVATE_READONLY_TESTERS[exchangeName];

  if (!privateTester) {
    addCheck({
      id: 'private_read_only_supported',
      label: 'Private read-only credential test is supported',
      passed: false,
      metric: 'quote-only or not implemented',
      severity: 'review'
    });

    return {
      status: ticker ? 'quote_only_connected' : 'error',
      connectionStatus: ticker ? 'Quote-Only Connected' : 'Error',
      plainEnglishStatus: ticker
        ? 'Quote-only market data works. No private account check is required for this connector.'
        : publicError,
      exchangeName,
      displayName,
      ticker,
      publicError,
      privateCheck: null,
      checks,
      failures: checks.filter(check => !check.passed).map(check => check.id),
      safetyBoundary: {
        liveTradingEnabled: false,
        withdrawalsEnabled: false,
        walletSigningEnabled: false,
        orderEndpointCalled: false,
        privateDataReturnedToUi: false
      },
      generatedAt: new Date().toISOString()
    };
  }

  try {
    const privateCheck = await privateTester(credentials);
    addCheck({
      id: 'private_read_only_auth',
      label: 'Read-only account endpoint accepted the key',
      passed: true,
      metric: privateCheck.endpoint
    });

    return {
      status: 'read_only_connected',
      connectionStatus: 'Read-Only Connected',
      plainEnglishStatus: `${displayName} read-only API connection works. Market data and account-read verification passed without enabling trading, withdrawals, wallet signing, or orders.`,
      exchangeName,
      displayName,
      ticker,
      publicError,
      privateCheck,
      checks,
      failures: checks.filter(check => !check.passed).map(check => check.id),
      safetyBoundary: {
        liveTradingEnabled: false,
        withdrawalsEnabled: false,
        walletSigningEnabled: false,
        orderEndpointCalled: false,
        privateDataReturnedToUi: false
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    const plainError = createPlainEnglishExchangeError(displayName, error);
    addCheck({
      id: 'private_read_only_auth',
      label: 'Read-only account endpoint accepted the key',
      passed: false,
      metric: plainError
    });

    return {
      status: 'error',
      connectionStatus: 'Error',
      plainEnglishStatus: plainError,
      exchangeName,
      displayName,
      ticker,
      publicError,
      privateCheck: null,
      checks,
      failures: checks.filter(check => !check.passed).map(check => check.id),
      safetyBoundary: {
        liveTradingEnabled: false,
        withdrawalsEnabled: false,
        walletSigningEnabled: false,
        orderEndpointCalled: false,
        privateDataReturnedToUi: false
      },
      generatedAt: new Date().toISOString()
    };
  }
}

async function compareReadOnlyPrices({ connectors = [], symbol = 'BTC/USDT', connectedOnly = false } = {}) {
  const candidateConnectors = connectors.filter(connector => {
    const exchangeName = normalizeExchangeName(connector.settings?.registryId || connector.exchange_name);
    if (!PUBLIC_TICKER_FETCHERS[exchangeName]) {
      return false;
    }

    if (!connectedOnly) {
      return RECOMMENDED_READONLY_EXCHANGES.includes(exchangeName) || exchangeName === 'hyperliquid';
    }

    return connector.secret_reference_status === 'configured'
      || connector.settings?.readOnlyConnection?.connectionStatus === 'read_only_connected'
      || connector.settings?.readOnlyConnection?.connectionStatus === 'quote_only_connected';
  });
  const uniqueByExchange = new Map();

  for (const connector of candidateConnectors) {
    const exchangeName = normalizeExchangeName(connector.settings?.registryId || connector.exchange_name);
    if (!uniqueByExchange.has(exchangeName)) {
      uniqueByExchange.set(exchangeName, connector);
    }
  }

  const results = [];

  for (const connector of uniqueByExchange.values()) {
    const exchangeName = normalizeExchangeName(connector.settings?.registryId || connector.exchange_name);

    try {
      const ticker = await fetchPublicTicker(exchangeName, symbol);
      results.push({
        connectorId: connector.id,
        exchangeName,
        displayName: ticker.displayName,
        status: 'ok',
        connectionStatus: connector.secret_reference_status === 'configured' ? 'Read-Only Connected' : 'Public Market Data',
        ticker
      });
    } catch (error) {
      results.push({
        connectorId: connector.id,
        exchangeName,
        displayName: exchangeName,
        status: 'error',
        connectionStatus: 'Error',
        error: createPlainEnglishPublicMarketDataError(exchangeName, error)
      });
    }
  }

  const valid = results.filter(result => (
    result.status === 'ok'
    && Number.isFinite(result.ticker?.bid)
    && Number.isFinite(result.ticker?.ask)
    && result.ticker.bid > 0
    && result.ticker.ask > 0
  ));
  const bestBuy = valid.reduce((best, item) => (!best || item.ticker.ask < best.ticker.ask ? item : best), null);
  const bestSell = valid.reduce((best, item) => (!best || item.ticker.bid > best.ticker.bid ? item : best), null);
  const grossSpreadPercent = bestBuy && bestSell
    ? ((bestSell.ticker.bid - bestBuy.ticker.ask) / bestBuy.ticker.ask) * 100
    : null;

  return {
    symbol: normalizeTradingSymbol(symbol).canonical,
    connectedOnly,
    comparedCount: valid.length,
    results,
    spread: bestBuy && bestSell
      ? {
        bestBuyExchange: bestBuy.displayName,
        bestBuyAsk: bestBuy.ticker.ask,
        bestSellExchange: bestSell.displayName,
        bestSellBid: bestSell.ticker.bid,
        grossSpreadPercent,
        grossSpreadPositive: grossSpreadPercent > 0
      }
      : null,
    safetyBoundary: {
      marketDataOnly: true,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      ordersPlaced: false
    },
    generatedAt: new Date().toISOString()
  };
}

function buildReadOnlyConnectionSummary(connectors = []) {
  const entries = connectors.map(connector => {
    const exchangeName = normalizeExchangeName(connector.settings?.registryId || connector.exchange_name);
    const readOnlyConnection = connector.settings?.readOnlyConnection || {};
    const connected = connector.secret_reference_status === 'configured'
      || readOnlyConnection.connectionStatus === 'read_only_connected'
      || readOnlyConnection.connectionStatus === 'quote_only_connected';

    return {
      connectorId: connector.id,
      exchangeName,
      label: connector.label,
      mode: connector.mode,
      recordStatus: connector.status,
      connectionStatus: connected
        ? (readOnlyConnection.connectionStatus === 'quote_only_connected' ? 'Quote-Only Connected' : 'Read-Only Connected')
        : readOnlyConnection.connectionStatus === 'error'
          ? 'Error'
          : 'Not Connected',
      category: RECOMMENDED_READONLY_EXCHANGES.includes(exchangeName)
        ? 'Recommended First'
        : QUOTE_ONLY_CONNECTORS.includes(exchangeName)
          ? 'Optional Later'
          : connector.settings?.manualOnly
            ? 'Unsupported / Placeholder'
            : 'Not Connected',
      secretReferenceConfigured: connector.secret_reference_status === 'configured',
      lastTestAt: readOnlyConnection.lastTestAt || null,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false
    };
  });

  return {
    categories: {
      recommendedFirst: entries.filter(entry => entry.category === 'Recommended First'),
      connected: entries.filter(entry => entry.connectionStatus === 'Read-Only Connected' || entry.connectionStatus === 'Quote-Only Connected'),
      notConnected: entries.filter(entry => entry.connectionStatus === 'Not Connected'),
      optionalLater: entries.filter(entry => entry.category === 'Optional Later'),
      unsupportedPlaceholder: entries.filter(entry => entry.category === 'Unsupported / Placeholder')
    },
    entries,
    safetyBoundary: {
      noBrowserLocalStorage: true,
      secretsDisplayed: false,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      orderEndpointEnabled: false
    }
  };
}

module.exports = {
  OWNER_SECRETS_DIR,
  EXCHANGE_READONLY_VAULT_PATH,
  EXCHANGE_READONLY_VAULT_KEY_PATH,
  RECOMMENDED_READONLY_EXCHANGES,
  QUOTE_ONLY_CONNECTORS,
  EXCHANGE_READONLY_SETUP_GUIDES,
  DEX_QUOTE_ONLY_SETUP_GUIDES,
  normalizeExchangeName,
  normalizeTradingSymbol,
  redactValue,
  sanitizeCredentialInput,
  sanitizePermissionsChecklist,
  getReadOnlyReferenceName,
  saveReadOnlyVaultCredentials,
  loadReadOnlyVaultCredentials,
  deleteReadOnlyVaultCredentials,
  getReadOnlyVaultStatus,
  fetchPublicTicker,
  testReadOnlyExchangeConnection,
  compareReadOnlyPrices,
  buildReadOnlyConnectionSummary,
  createPlainEnglishPublicMarketDataError,
  createPlainEnglishExchangeError
};
