const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const OWNER_SECRETS_DIR = path.join(os.homedir(), 'EtherealAI_Secrets');
const EXCHANGE_READONLY_VAULT_PATH = path.join(OWNER_SECRETS_DIR, 'exchange-readonly-vault.json');
const EXCHANGE_READONLY_VAULT_KEY_PATH = path.join(OWNER_SECRETS_DIR, 'exchange-readonly-vault.key');
const RECOMMENDED_READONLY_EXCHANGES = ['binance', 'coinbase', 'kraken', 'okx', 'bybit'];
const QUOTE_ONLY_CONNECTORS = ['uniswap', 'jupiter', 'one-inch', 'gmx', 'hyperliquid'];
const DEX_MARKET_DATA_CONNECTORS = ['dexscreener', 'geckoterminal', 'coingecko-market-metadata', 'uniswap-style-evm', 'pancakeswap-style-bnb'];
const DEX_QUOTE_PREVIEW_CONNECTORS = ['zero-x', 'one-inch', 'lifi', 'rango', 'jupiter', 'paraswap'];
const EXPANDED_READONLY_MARKET_VENUES = [
  'binance',
  'coinbase',
  'kraken',
  'okx',
  'bybit',
  'kucoin',
  'gate-io',
  'mexc',
  'bitget',
  'bitstamp',
  'gemini',
  'crypto-com-us',
  'hyperliquid'
];
const DEFAULT_TAKER_FEE_PERCENT = 0.1;
const DEFAULT_MAKER_FEE_PERCENT = 0.08;
const DEFAULT_SLIPPAGE_PERCENT = 0.05;
const DEFAULT_LATENCY_BUFFER_PERCENT = 0.02;
const ETHEREALAI_READONLY_WALLET_PLACEHOLDER = '0x0000000000000000000000000000000000000001';
const DEFAULT_EVM_QUOTE = Object.freeze({
  chainId: '1',
  fromChain: '1',
  toChain: '1',
  sellToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  buyToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  sellAmount: '1000000000000000',
  slippageBps: '50'
});
const DEFAULT_SOLANA_QUOTE = Object.freeze({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qP4GPiDa7xKseZx8tKxZ1m2',
  amount: '10000000',
  slippageBps: '50'
});
const DEFAULT_DEX_PAIR = Object.freeze({
  chainId: 'ethereum',
  pairAddress: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640'
});

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

const DEX_MARKET_DATA_SETUP_GUIDES = {
  dexscreener: {
    providerId: 'dexscreener',
    displayName: 'DexScreener',
    category: 'DEX Market Data',
    credentialMode: 'none needed',
    safeActions: ['token/pair search', 'pair lookup'],
    setupUrl: 'https://docs.dexscreener.com/api/reference',
    instructions: [
      'Use public token, pair, price, liquidity, and profile data only.',
      'No exchange account, wallet, seed phrase, signature, or token approval is required.',
      'Failures should be treated as network/API degradation, not a setup failure.'
    ],
    warning: 'DexScreener data is read-only. EtherealAI must not submit listings, mutate profiles, or post anything from this connector.'
  },
  geckoterminal: {
    providerId: 'geckoterminal',
    displayName: 'GeckoTerminal',
    category: 'DEX Market Data',
    credentialMode: 'none needed',
    safeActions: ['network list', 'pool lookup'],
    setupUrl: 'https://apiguide.geckoterminal.com/',
    instructions: [
      'Use public network, token, pool, volume, and liquidity data only.',
      'No exchange account, wallet, seed phrase, signature, or token approval is required.',
      'Public/free API limits can degrade checks; the UI must explain that plainly.'
    ],
    warning: 'GeckoTerminal data is read-only. No token listing submission or public mutation is enabled.'
  },
  'coingecko-market-metadata': {
    providerId: 'coingecko-market-metadata',
    displayName: 'CoinGecko Market Metadata',
    category: 'Listing / Market Metadata',
    credentialMode: 'environment variable reference or local dataset',
    safeActions: ['metadata planning', 'top-token dataset planning'],
    setupUrl: 'https://docs.coingecko.com/reference/introduction',
    instructions: [
      'Use official API access or an owner-approved local dataset only.',
      'Do not scrape pages, copy token branding, or claim research was performed unless data was fetched or loaded.',
      'Keep API key values out of frontend code and plain SQLite.'
    ],
    warning: 'CoinGecko metadata is read-only. Listing submission remains locked.'
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
    compactLower: `${base === 'XBT' ? 'BTC' : base}${quote}`.toLowerCase(),
    dash: `${base === 'XBT' ? 'BTC' : base}-${quote}`,
    underscore: `${base === 'XBT' ? 'BTC' : base}_${quote}`,
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

function createPlainEnglishDexError(providerName, error) {
  const rawMessage = String(error?.message || error || '').slice(0, 500);
  const lower = rawMessage.toLowerCase();

  if (/401|403|unauthorized|forbidden|api key|access token|subscription/.test(lower)) {
    return `${providerName} needs an API key or rejected the current public request. Add a safe local key reference later if you want this provider. No wallet signing, swap, order, approval, or private key was used.`;
  }

  if (/429|rate limit|too many requests/.test(lower)) {
    return `${providerName} rate-limited this read-only test. Wait and retry later. No live trading or wallet action was attempted.`;
  }

  if (/timeout|network|fetch failed|enotfound|econn|abort/.test(lower)) {
    return `${providerName} could not be reached from this Mac right now. Check internet/VPN/firewall, then retry. No live trading or wallet action was attempted.`;
  }

  return `${providerName} read-only/quote test failed: ${rawMessage || 'unknown error'}. No live trading, wallet signing, swap, approval, or order was attempted.`;
}

function buildDexSafetyBoundary(extra = {}) {
  return {
    publicReadOnly: true,
    quotePreviewOnly: true,
    marketDataOnly: true,
    liveTradingEnabled: false,
    walletSigningEnabled: false,
    swapsEnabled: false,
    tokenApprovalsEnabled: false,
    withdrawalsEnabled: false,
    transfersEnabled: false,
    orderEndpointEnabled: false,
    transactionBroadcastEnabled: false,
    transactionPayloadExposedInSimpleMode: false,
    secretsDisplayed: false,
    ...extra
  };
}

function normalizeDexProviderId(value = '') {
  return String(value || '').trim().toLowerCase().replace(/_/g, '-');
}

function buildDexConnectorCenterStatus({
  latestMarketDataTest = null,
  latestQuotePreview = null
} = {}) {
  return {
    status: 'read-only and quote-only',
    marketData: {
      status: 'safe tests available',
      providers: Object.values(DEX_MARKET_DATA_SETUP_GUIDES).map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        category: provider.category,
        credentialMode: provider.credentialMode,
        safeActions: provider.safeActions,
        setupUrl: provider.setupUrl,
        instructions: provider.instructions,
        warning: provider.warning,
        status: ['dexscreener', 'geckoterminal'].includes(provider.providerId) ? 'ready for safe test' : 'planned / needs key or dataset',
        safetyLevel: 'public read-only'
      }))
    },
    quotePreview: {
      status: 'quote previews available where no key is required',
      providers: [
        {
          providerId: 'zero-x',
          displayName: '0x',
          status: 'needs key',
          credentialMode: 'environment variable reference',
          safetyLevel: 'quote-only',
          nextRecommendedAction: 'Add a safe local 0x API key reference later. No swap endpoint is enabled.'
        },
        {
          providerId: 'one-inch',
          displayName: '1inch',
          status: 'needs key',
          credentialMode: 'environment variable reference',
          safetyLevel: 'quote-only',
          nextRecommendedAction: 'Add a safe local 1inch API key reference later. No transaction execution is enabled.'
        },
        {
          providerId: 'lifi',
          displayName: 'LI.FI',
          status: 'ready for safe test',
          credentialMode: 'none needed',
          safetyLevel: 'quote-only',
          nextRecommendedAction: 'Preview route only. Transaction execution remains locked.'
        },
        {
          providerId: 'rango',
          displayName: 'Rango',
          status: 'needs key',
          credentialMode: 'environment variable reference',
          safetyLevel: 'quote-only',
          nextRecommendedAction: 'Add a safe local Rango API key reference later. No swap endpoint is enabled.'
        },
        {
          providerId: 'jupiter',
          displayName: 'Jupiter',
          status: 'ready for safe test',
          credentialMode: 'none needed',
          safetyLevel: 'quote-only',
          nextRecommendedAction: 'Preview Solana quote only. No swap transaction is requested or signed.'
        },
        {
          providerId: 'paraswap',
          displayName: 'ParaSwap',
          status: 'planned',
          credentialMode: 'not configured',
          safetyLevel: 'quote-only',
          nextRecommendedAction: 'Planned after the first quote-preview lanes are stable.'
        }
      ]
    },
    executionLocked: {
      status: 'wallet signing locked',
      blockers: [
        'DEX swaps are locked.',
        'Wallet signing is locked.',
        'Token approvals are locked.',
        'Transaction broadcast is locked.',
        'Private keys and seed phrases are not accepted.'
      ]
    },
    latestMarketDataTest,
    latestQuotePreview,
    safetyBoundary: buildDexSafetyBoundary(),
    generatedAt: new Date().toISOString()
  };
}

function summarizeDexScreenerPairs(pairs = []) {
  return pairs.slice(0, 8).map(pair => ({
    chainId: pair.chainId || '',
    dexId: pair.dexId || '',
    pairAddress: pair.pairAddress || '',
    baseToken: pair.baseToken?.symbol || pair.baseToken?.name || '',
    quoteToken: pair.quoteToken?.symbol || pair.quoteToken?.name || '',
    priceUsd: pair.priceUsd || null,
    liquidityUsd: pair.liquidity?.usd || null,
    fdv: pair.fdv || null,
    volume24h: pair.volume?.h24 || null,
    url: pair.url || ''
  }));
}

function summarizeGeckoTerminalNetworks(networks = []) {
  return networks.slice(0, 12).map(network => ({
    id: network.id || '',
    name: network.attributes?.name || network.attributes?.coingecko_asset_platform_id || network.id || '',
    type: network.type || 'network'
  }));
}

function sanitizeDexQuotePayload(providerId, raw = {}) {
  const provider = normalizeDexProviderId(providerId);

  if (provider === 'jupiter') {
    return {
      inputMint: raw.inputMint,
      outputMint: raw.outputMint,
      inAmount: raw.inAmount,
      outAmount: raw.outAmount,
      otherAmountThreshold: raw.otherAmountThreshold,
      swapMode: raw.swapMode,
      slippageBps: raw.slippageBps,
      priceImpactPct: raw.priceImpactPct,
      routePlan: Array.isArray(raw.routePlan)
        ? raw.routePlan.slice(0, 4).map(step => ({
            label: step.swapInfo?.label || '',
            ammKey: step.swapInfo?.ammKey || '',
            inputMint: step.swapInfo?.inputMint || '',
            outputMint: step.swapInfo?.outputMint || '',
            inAmount: step.swapInfo?.inAmount || '',
            outAmount: step.swapInfo?.outAmount || '',
            feeAmount: step.swapInfo?.feeAmount || '',
            feeMint: step.swapInfo?.feeMint || '',
            percent: step.percent || null
          }))
        : []
    };
  }

  if (provider === 'lifi') {
    const estimate = raw.estimate || {};
    const action = raw.action || {};
    const toolDetails = raw.toolDetails || {};

    return {
      id: raw.id || '',
      type: raw.type || '',
      tool: raw.tool || '',
      toolName: toolDetails.name || raw.tool || '',
      fromChainId: action.fromChainId || raw.fromChainId || null,
      toChainId: action.toChainId || raw.toChainId || null,
      fromToken: action.fromToken?.symbol || '',
      toToken: action.toToken?.symbol || '',
      fromAmount: action.fromAmount || '',
      toAmount: estimate.toAmount || '',
      toAmountMin: estimate.toAmountMin || '',
      approvalAddressHidden: Boolean(raw.estimate?.approvalAddress),
      gasCosts: Array.isArray(estimate.gasCosts)
        ? estimate.gasCosts.slice(0, 3).map(cost => ({
            type: cost.type || '',
            amount: cost.amount || '',
            amountUSD: cost.amountUSD || '',
            tokenSymbol: cost.token?.symbol || ''
          }))
        : [],
      feeCosts: Array.isArray(estimate.feeCosts)
        ? estimate.feeCosts.slice(0, 3).map(cost => ({
            name: cost.name || '',
            amount: cost.amount || '',
            amountUSD: cost.amountUSD || '',
            tokenSymbol: cost.token?.symbol || ''
          }))
        : [],
      transactionRequestHidden: Boolean(raw.transactionRequest),
      includedStepsHidden: Array.isArray(raw.includedSteps)
    };
  }

  return {
    status: 'setup needed',
    providerId: provider,
    transactionPayloadHidden: true
  };
}

async function testDexMarketDataConnector({ providerId = 'dexscreener', action = 'search', params = {} } = {}) {
  const provider = normalizeDexProviderId(providerId);
  const startedAt = Date.now();

  if (provider === 'dexscreener') {
    if (action === 'pair' || action === 'pairLookup') {
      const chainId = String(params.chainId || DEFAULT_DEX_PAIR.chainId);
      const pairAddress = String(params.pairAddress || DEFAULT_DEX_PAIR.pairAddress);
      const body = await fetchJsonWithTimeout(`https://api.dexscreener.com/latest/dex/pairs/${encodeURIComponent(chainId)}/${encodeURIComponent(pairAddress)}`);
      const pairs = Array.isArray(body.pairs) ? body.pairs : (body.pair ? [body.pair] : []);

      return {
        providerId: 'dexscreener',
        displayName: 'DexScreener',
        action: 'pair lookup',
        status: pairs.length ? 'connected' : 'degraded',
        plainEnglish: pairs.length
          ? 'DexScreener pair lookup returned read-only pair/liquidity data.'
          : 'DexScreener responded, but this example pair returned no pair data.',
        pairSummary: summarizeDexScreenerPairs(pairs),
        latencyMs: Date.now() - startedAt,
        safetyBoundary: buildDexSafetyBoundary(),
        generatedAt: new Date().toISOString()
      };
    }

    const query = String(params.query || 'ETH USDC').slice(0, 80);
    const body = await fetchJsonWithTimeout(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
    const pairs = Array.isArray(body.pairs) ? body.pairs : [];

    return {
      providerId: 'dexscreener',
      displayName: 'DexScreener',
      action: 'search',
      status: pairs.length ? 'connected' : 'degraded',
      plainEnglish: pairs.length
        ? 'DexScreener search returned public read-only token/pair results.'
        : 'DexScreener responded, but the example search returned no pairs.',
      query,
      pairSummary: summarizeDexScreenerPairs(pairs),
      latencyMs: Date.now() - startedAt,
      safetyBoundary: buildDexSafetyBoundary(),
      generatedAt: new Date().toISOString()
    };
  }

  if (provider === 'geckoterminal') {
    if (action === 'pool' || action === 'poolLookup') {
      const network = String(params.network || 'eth');
      const poolAddress = String(params.poolAddress || DEFAULT_DEX_PAIR.pairAddress);
      const body = await fetchJsonWithTimeout(`https://api.geckoterminal.com/api/v2/networks/${encodeURIComponent(network)}/pools/${encodeURIComponent(poolAddress)}`);
      const data = body.data || {};

      return {
        providerId: 'geckoterminal',
        displayName: 'GeckoTerminal',
        action: 'pool lookup',
        status: data.id ? 'connected' : 'degraded',
        plainEnglish: data.id
          ? 'GeckoTerminal returned public read-only pool data.'
          : 'GeckoTerminal responded, but the example pool returned no pool data.',
        poolSummary: {
          id: data.id || '',
          type: data.type || '',
          name: data.attributes?.name || '',
          baseTokenPriceUsd: data.attributes?.base_token_price_usd || null,
          quoteTokenPriceUsd: data.attributes?.quote_token_price_usd || null,
          reserveUsd: data.attributes?.reserve_in_usd || null,
          volume24h: data.attributes?.volume_usd?.h24 || null
        },
        latencyMs: Date.now() - startedAt,
        safetyBoundary: buildDexSafetyBoundary(),
        generatedAt: new Date().toISOString()
      };
    }

    const body = await fetchJsonWithTimeout('https://api.geckoterminal.com/api/v2/networks');
    const networks = Array.isArray(body.data) ? body.data : [];

    return {
      providerId: 'geckoterminal',
      displayName: 'GeckoTerminal',
      action: 'network list',
      status: networks.length ? 'connected' : 'degraded',
      plainEnglish: networks.length
        ? 'GeckoTerminal returned the public read-only network list.'
        : 'GeckoTerminal responded, but no networks were returned.',
      networkSummary: summarizeGeckoTerminalNetworks(networks),
      latencyMs: Date.now() - startedAt,
      safetyBoundary: buildDexSafetyBoundary(),
      generatedAt: new Date().toISOString()
    };
  }

  const guide = DEX_MARKET_DATA_SETUP_GUIDES[provider];

  return {
    providerId: provider,
    displayName: guide?.displayName || provider,
    action,
    status: 'planned',
    plainEnglish: guide
      ? `${guide.displayName} is planned/read-only. It needs an approved local dataset or server-side API key reference before testing.`
      : 'This DEX market-data provider is not registered yet.',
    setupInstructions: guide?.instructions || [],
    safetyBoundary: buildDexSafetyBoundary(),
    generatedAt: new Date().toISOString()
  };
}

async function previewDexQuoteRoute({ providerId = 'jupiter', params = {} } = {}) {
  const provider = normalizeDexProviderId(providerId);
  const startedAt = Date.now();

  if (provider === 'jupiter') {
    const inputMint = String(params.inputMint || DEFAULT_SOLANA_QUOTE.inputMint);
    const outputMint = String(params.outputMint || DEFAULT_SOLANA_QUOTE.outputMint);
    const amount = String(params.amount || DEFAULT_SOLANA_QUOTE.amount);
    const slippageBps = String(params.slippageBps || DEFAULT_SOLANA_QUOTE.slippageBps);
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${encodeURIComponent(inputMint)}&outputMint=${encodeURIComponent(outputMint)}&amount=${encodeURIComponent(amount)}&slippageBps=${encodeURIComponent(slippageBps)}`;
    const body = await fetchJsonWithTimeout(url);

    return {
      providerId: 'jupiter',
      displayName: 'Jupiter',
      status: 'connected',
      quoteMode: 'quote-only',
      plainEnglish: 'Jupiter returned a Solana quote preview. EtherealAI did not request, sign, or broadcast a swap transaction.',
      quote: sanitizeDexQuotePayload('jupiter', body),
      quoteAge: 'fresh server-side read',
      latencyMs: Date.now() - startedAt,
      safetyBoundary: buildDexSafetyBoundary(),
      generatedAt: new Date().toISOString()
    };
  }

  if (provider === 'lifi') {
    const quote = {
      fromChain: String(params.fromChain || DEFAULT_EVM_QUOTE.fromChain),
      toChain: String(params.toChain || DEFAULT_EVM_QUOTE.toChain),
      fromToken: String(params.fromToken || DEFAULT_EVM_QUOTE.sellToken),
      toToken: String(params.toToken || DEFAULT_EVM_QUOTE.buyToken),
      fromAmount: String(params.fromAmount || DEFAULT_EVM_QUOTE.sellAmount),
      fromAddress: String(params.fromAddress || ETHEREALAI_READONLY_WALLET_PLACEHOLDER)
    };
    const url = `https://li.quest/v1/quote?fromChain=${encodeURIComponent(quote.fromChain)}&toChain=${encodeURIComponent(quote.toChain)}&fromToken=${encodeURIComponent(quote.fromToken)}&toToken=${encodeURIComponent(quote.toToken)}&fromAmount=${encodeURIComponent(quote.fromAmount)}&fromAddress=${encodeURIComponent(quote.fromAddress)}`;
    const body = await fetchJsonWithTimeout(url);

    return {
      providerId: 'lifi',
      displayName: 'LI.FI',
      status: 'connected',
      quoteMode: 'route-preview-only',
      plainEnglish: 'LI.FI returned a route preview. EtherealAI hides transaction data in Simple Mode and cannot execute this route.',
      quote: sanitizeDexQuotePayload('lifi', body),
      quoteAge: 'fresh server-side read',
      latencyMs: Date.now() - startedAt,
      safetyBoundary: buildDexSafetyBoundary(),
      generatedAt: new Date().toISOString()
    };
  }

  const keyRequired = {
    'zero-x': '0x quote preview needs a safe local API key reference before testing.',
    'one-inch': '1inch quote preview needs a safe local API key reference before testing.',
    rango: 'Rango quote preview needs a safe local API key reference before testing.'
  }[provider];

  if (keyRequired) {
    return {
      providerId: provider,
      displayName: provider === 'zero-x' ? '0x' : provider === 'one-inch' ? '1inch' : 'Rango',
      status: 'needs key',
      quoteMode: 'quote-only',
      plainEnglish: `${keyRequired} No swap, approval, wallet signature, transaction payload, or live order is enabled.`,
      blockers: [
        {
          title: 'Safe API key reference needed',
          detail: 'Add a server-side local secret reference in a later owner-approved API setup pass. Do not paste provider keys into frontend code.'
        }
      ],
      safetyBoundary: buildDexSafetyBoundary(),
      generatedAt: new Date().toISOString()
    };
  }

  return {
    providerId: provider,
    displayName: provider,
    status: 'planned',
    quoteMode: 'quote-only',
    plainEnglish: 'This DEX quote provider is planned. No execution path is enabled.',
    safetyBoundary: buildDexSafetyBoundary(),
    generatedAt: new Date().toISOString()
  };
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

async function fetchJsonWithTiming(url, options = {}, timeoutMs = 8000) {
  const startedAt = Date.now();
  const body = await fetchJsonWithTimeout(url, options, timeoutMs);

  return {
    body,
    latencyMs: Date.now() - startedAt
  };
}

function toFiniteNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeSize(value) {
  const number = toFiniteNumber(value, null);
  return number && number > 0 ? number : null;
}

function buildMarketSnapshot({
  exchangeName,
  displayName,
  symbol,
  bid,
  ask,
  bidSize = null,
  askSize = null,
  last = null,
  quoteVolume24h = null,
  baseVolume24h = null,
  makerFeePercent = DEFAULT_MAKER_FEE_PERCENT,
  takerFeePercent = DEFAULT_TAKER_FEE_PERCENT,
  source,
  latencyMs
}) {
  const normalized = normalizeTradingSymbol(symbol);
  const normalizedBid = toFiniteNumber(bid, null);
  const normalizedAsk = toFiniteNumber(ask, null);
  const normalizedBidSize = normalizeSize(bidSize);
  const normalizedAskSize = normalizeSize(askSize);
  const topBidLiquidityUsd = normalizedBid && normalizedBidSize ? normalizedBid * normalizedBidSize : null;
  const topAskLiquidityUsd = normalizedAsk && normalizedAskSize ? normalizedAsk * normalizedAskSize : null;
  const topLiquidityUsd = [topBidLiquidityUsd, topAskLiquidityUsd]
    .filter(value => Number.isFinite(value) && value > 0)
    .reduce((min, value) => Math.min(min, value), Number.POSITIVE_INFINITY);

  return {
    exchangeName: normalizeExchangeName(exchangeName),
    displayName,
    symbol: normalized.canonical,
    bid: normalizedBid,
    ask: normalizedAsk,
    bidSize: normalizedBidSize,
    askSize: normalizedAskSize,
    last: toFiniteNumber(last, null),
    quoteVolume24h: toFiniteNumber(quoteVolume24h, null),
    baseVolume24h: toFiniteNumber(baseVolume24h, null),
    topBidLiquidityUsd,
    topAskLiquidityUsd,
    topLiquidityUsd: Number.isFinite(topLiquidityUsd) ? topLiquidityUsd : null,
    makerFeePercent,
    takerFeePercent,
    source,
    latencyMs,
    fetchedAt: new Date().toISOString(),
    readOnly: true,
    orderEndpointUsed: false,
    walletSigningUsed: false
  };
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

async function fetchBinanceMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${normalized.compact}`);

  return buildMarketSnapshot({
    exchangeName: 'binance',
    displayName: 'Binance',
    symbol,
    bid: body.bidPrice,
    ask: body.askPrice,
    bidSize: body.bidQty,
    askSize: body.askQty,
    makerFeePercent: 0.1,
    takerFeePercent: 0.1,
    source: 'public bookTicker',
    latencyMs
  });
}

async function fetchCoinbaseMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming(`https://api.exchange.coinbase.com/products/${normalized.dash}/book?level=1`);
  const bid = body.bids?.[0] || [];
  const ask = body.asks?.[0] || [];

  return buildMarketSnapshot({
    exchangeName: 'coinbase',
    displayName: 'Coinbase',
    symbol,
    bid: bid[0],
    ask: ask[0],
    bidSize: bid[1],
    askSize: ask[1],
    makerFeePercent: 0.4,
    takerFeePercent: 0.6,
    source: 'public level-1 book',
    latencyMs
  });
}

async function fetchKrakenMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming(`https://api.kraken.com/0/public/Depth?pair=${normalized.kraken}&count=1`);
  const result = body.result || {};
  const book = result[Object.keys(result)[0]] || {};
  const bid = book.bids?.[0] || [];
  const ask = book.asks?.[0] || [];

  return buildMarketSnapshot({
    exchangeName: 'kraken',
    displayName: 'Kraken',
    symbol,
    bid: bid[0],
    ask: ask[0],
    bidSize: bid[1],
    askSize: ask[1],
    makerFeePercent: 0.25,
    takerFeePercent: 0.4,
    source: 'public depth',
    latencyMs
  });
}

async function fetchOkxMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming(`https://www.okx.com/api/v5/market/books?instId=${normalized.dash}&sz=1`);
  const book = body.data?.[0] || {};
  const bid = book.bids?.[0] || [];
  const ask = book.asks?.[0] || [];

  return buildMarketSnapshot({
    exchangeName: 'okx',
    displayName: 'OKX',
    symbol,
    bid: bid[0],
    ask: ask[0],
    bidSize: bid[1],
    askSize: ask[1],
    makerFeePercent: 0.08,
    takerFeePercent: 0.1,
    source: 'public order book',
    latencyMs
  });
}

async function fetchBybitMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming(`https://api.bybit.com/v5/market/orderbook?category=spot&symbol=${normalized.compact}&limit=1`);
  const book = body.result || {};
  const bid = book.b?.[0] || [];
  const ask = book.a?.[0] || [];

  return buildMarketSnapshot({
    exchangeName: 'bybit',
    displayName: 'Bybit',
    symbol,
    bid: bid[0],
    ask: ask[0],
    bidSize: bid[1],
    askSize: ask[1],
    makerFeePercent: 0.1,
    takerFeePercent: 0.1,
    source: 'public spot order book',
    latencyMs
  });
}

async function fetchKucoinMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${normalized.dash}`);
  const ticker = body.data || {};

  return buildMarketSnapshot({
    exchangeName: 'kucoin',
    displayName: 'KuCoin',
    symbol,
    bid: ticker.bestBid || ticker.price,
    ask: ticker.bestAsk || ticker.price,
    bidSize: ticker.bestBidSize,
    askSize: ticker.bestAskSize,
    last: ticker.price,
    makerFeePercent: 0.1,
    takerFeePercent: 0.1,
    source: 'public level-1 order book',
    latencyMs
  });
}

async function fetchGateMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${normalized.underscore}`);
  const ticker = Array.isArray(body) ? body[0] : body;

  return buildMarketSnapshot({
    exchangeName: 'gate-io',
    displayName: 'Gate.io',
    symbol,
    bid: ticker.highest_bid,
    ask: ticker.lowest_ask,
    last: ticker.last,
    baseVolume24h: ticker.base_volume,
    quoteVolume24h: ticker.quote_volume,
    makerFeePercent: 0.2,
    takerFeePercent: 0.2,
    source: 'public spot ticker',
    latencyMs
  });
}

async function fetchMexcMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming(`https://api.mexc.com/api/v3/ticker/bookTicker?symbol=${normalized.compact}`);

  return buildMarketSnapshot({
    exchangeName: 'mexc',
    displayName: 'MEXC',
    symbol,
    bid: body.bidPrice,
    ask: body.askPrice,
    bidSize: body.bidQty,
    askSize: body.askQty,
    makerFeePercent: 0.1,
    takerFeePercent: 0.1,
    source: 'public bookTicker',
    latencyMs
  });
}

async function fetchBitgetMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${normalized.compact}`);
  const ticker = body.data?.[0] || {};

  return buildMarketSnapshot({
    exchangeName: 'bitget',
    displayName: 'Bitget',
    symbol,
    bid: ticker.bidPr,
    ask: ticker.askPr,
    bidSize: ticker.bidSz,
    askSize: ticker.askSz,
    last: ticker.lastPr,
    quoteVolume24h: ticker.quoteVolume,
    baseVolume24h: ticker.baseVolume,
    makerFeePercent: 0.1,
    takerFeePercent: 0.1,
    source: 'public spot ticker',
    latencyMs
  });
}

async function fetchBitstampMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming(`https://www.bitstamp.net/api/v2/ticker/${normalized.compactLower}/`);

  return buildMarketSnapshot({
    exchangeName: 'bitstamp',
    displayName: 'Bitstamp',
    symbol,
    bid: body.bid,
    ask: body.ask,
    last: body.last,
    baseVolume24h: body.volume,
    makerFeePercent: 0.3,
    takerFeePercent: 0.4,
    source: 'public ticker',
    latencyMs
  });
}

async function fetchGeminiMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  if (normalized.quote !== 'USD') {
    throw new Error(`Gemini public ticker is skipped for ${normalized.canonical}; use a USD market such as ${normalized.base}/USD to compare Gemini without mixing quote assets.`);
  }

  const geminiSymbol = `${normalized.base}${normalized.quote}`.toLowerCase();
  const { body, latencyMs } = await fetchJsonWithTiming(`https://api.gemini.com/v1/pubticker/${geminiSymbol}`);

  return buildMarketSnapshot({
    exchangeName: 'gemini',
    displayName: 'Gemini',
    symbol,
    bid: body.bid,
    ask: body.ask,
    last: body.last,
    baseVolume24h: body.volume?.[normalized.base],
    makerFeePercent: 0.2,
    takerFeePercent: 0.4,
    source: 'public ticker',
    latencyMs
  });
}

async function fetchCryptoComMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming(`https://api.crypto.com/exchange/v1/public/get-ticker?instrument_name=${normalized.underscore}`);
  const ticker = body.result?.data?.[0] || {};

  return buildMarketSnapshot({
    exchangeName: 'crypto-com-us',
    displayName: 'Crypto.com',
    symbol,
    bid: ticker.b,
    ask: ticker.k,
    last: ticker.a,
    quoteVolume24h: ticker.vv,
    baseVolume24h: ticker.v,
    makerFeePercent: 0.075,
    takerFeePercent: 0.075,
    source: 'public ticker',
    latencyMs
  });
}

async function fetchHyperliquidMarketSnapshot(symbol) {
  const normalized = normalizeTradingSymbol(symbol);
  const { body, latencyMs } = await fetchJsonWithTiming('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'allMids' })
  });
  const mid = body[normalized.base];

  return buildMarketSnapshot({
    exchangeName: 'hyperliquid',
    displayName: 'Hyperliquid',
    symbol,
    bid: mid,
    ask: mid,
    last: mid,
    makerFeePercent: 0.015,
    takerFeePercent: 0.045,
    source: 'public allMids',
    latencyMs
  });
}

const PUBLIC_TICKER_FETCHERS = {
  binance: fetchBinanceTicker,
  coinbase: fetchCoinbaseTicker,
  kraken: fetchKrakenTicker,
  okx: fetchOkxTicker,
  bybit: fetchBybitTicker,
  hyperliquid: fetchHyperliquidMid
};
const READONLY_MARKET_SNAPSHOT_FETCHERS = {
  binance: fetchBinanceMarketSnapshot,
  coinbase: fetchCoinbaseMarketSnapshot,
  kraken: fetchKrakenMarketSnapshot,
  okx: fetchOkxMarketSnapshot,
  bybit: fetchBybitMarketSnapshot,
  kucoin: fetchKucoinMarketSnapshot,
  'gate-io': fetchGateMarketSnapshot,
  mexc: fetchMexcMarketSnapshot,
  bitget: fetchBitgetMarketSnapshot,
  bitstamp: fetchBitstampMarketSnapshot,
  gemini: fetchGeminiMarketSnapshot,
  'crypto-com-us': fetchCryptoComMarketSnapshot,
  hyperliquid: fetchHyperliquidMarketSnapshot
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

function getConnectorExchangeName(connector = {}) {
  return normalizeExchangeName(connector.settings?.registryId || connector.exchange_name || connector.exchangeName);
}

function buildReadOnlyVenueList(connectors = [], {
  includeExpanded = true,
  connectedOnly = false
} = {}) {
  const venues = new Map();

  if (includeExpanded) {
    for (const exchangeName of EXPANDED_READONLY_MARKET_VENUES) {
      venues.set(exchangeName, {
        exchangeName,
        connectorId: null,
        connected: false,
        source: 'expanded-read-only-registry'
      });
    }
  }

  for (const connector of connectors) {
    const exchangeName = getConnectorExchangeName(connector);
    if (!exchangeName) {
      continue;
    }

    const readOnlyConnection = connector.settings?.readOnlyConnection || {};
    const connected = connector.secret_reference_status === 'configured'
      || readOnlyConnection.connectionStatus === 'read_only_connected'
      || readOnlyConnection.connectionStatus === 'quote_only_connected';

    venues.set(exchangeName, {
      exchangeName,
      connectorId: connector.id || null,
      connected,
      source: 'saved-connector'
    });
  }

  return Array.from(venues.values()).filter(venue => (
    READONLY_MARKET_SNAPSHOT_FETCHERS[venue.exchangeName]
    && (!connectedOnly || venue.connected)
  ));
}

async function fetchReadOnlyMarketSnapshot(exchangeName, symbol = 'BTC/USDT') {
  const normalizedExchange = normalizeExchangeName(exchangeName);
  const fetcher = READONLY_MARKET_SNAPSHOT_FETCHERS[normalizedExchange];

  if (!fetcher) {
    throw new Error(`${exchangeName} does not have a read-only market snapshot fetcher yet.`);
  }

  const snapshot = await fetcher(symbol);

  if (!Number.isFinite(snapshot.bid) || !Number.isFinite(snapshot.ask) || snapshot.bid <= 0 || snapshot.ask <= 0) {
    throw new Error(`${exchangeName} returned an incomplete read-only market snapshot for ${symbol}.`);
  }

  return snapshot;
}

async function collectReadOnlyMarketSnapshots({
  connectors = [],
  symbol = 'BTC/USDT',
  venues = [],
  connectedOnly = false,
  includeExpanded = true,
  maxVenues = 16
} = {}) {
  const requestedVenues = Array.isArray(venues) && venues.length
    ? venues.map(normalizeExchangeName).filter(Boolean).map(exchangeName => ({ exchangeName }))
    : buildReadOnlyVenueList(connectors, { includeExpanded, connectedOnly });
  const unique = [];
  const seen = new Set();

  for (const venue of requestedVenues) {
    const exchangeName = normalizeExchangeName(venue.exchangeName);
    if (!exchangeName || seen.has(exchangeName) || !READONLY_MARKET_SNAPSHOT_FETCHERS[exchangeName]) {
      continue;
    }

    seen.add(exchangeName);
    unique.push({ ...venue, exchangeName });

    if (unique.length >= maxVenues) {
      break;
    }
  }

  const results = await Promise.all(unique.map(async venue => {
    try {
      return {
        status: 'ok',
        connectorId: venue.connectorId || null,
        connected: Boolean(venue.connected),
        snapshot: await fetchReadOnlyMarketSnapshot(venue.exchangeName, symbol)
      };
    } catch (error) {
      return {
        status: 'error',
        connectorId: venue.connectorId || null,
        exchangeName: venue.exchangeName,
        displayName: venue.exchangeName,
        error: createPlainEnglishPublicMarketDataError(venue.exchangeName, error)
      };
    }
  }));

  return {
    symbol: normalizeTradingSymbol(symbol).canonical,
    requestedVenueCount: unique.length,
    okCount: results.filter(result => result.status === 'ok').length,
    errorCount: results.filter(result => result.status === 'error').length,
    results,
    safetyBoundary: {
      marketDataOnly: true,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      orderEndpointEnabled: false,
      ordersPlaced: false
    },
    generatedAt: new Date().toISOString()
  };
}

function createArbitrageCandidate({ buy, sell, options }) {
  const buyAsk = buy.ask;
  const sellBid = sell.bid;
  const grossSpreadPercent = ((sellBid - buyAsk) / buyAsk) * 100;
  const combinedFeePercent = Number(buy.takerFeePercent || DEFAULT_TAKER_FEE_PERCENT)
    + Number(sell.takerFeePercent || DEFAULT_TAKER_FEE_PERCENT);
  const slippagePercent = Number(options.slippagePercent ?? DEFAULT_SLIPPAGE_PERCENT) * 2;
  const latencyMs = Math.max(Number(buy.latencyMs || 0), Number(sell.latencyMs || 0));
  const latencyRiskPercent = latencyMs > Number(options.maxLatencyMs || 1500)
    ? DEFAULT_LATENCY_BUFFER_PERCENT * 3
    : DEFAULT_LATENCY_BUFFER_PERCENT;
  const totalEstimatedCostPercent = combinedFeePercent + slippagePercent + latencyRiskPercent;
  const estimatedNetProfitPercent = grossSpreadPercent - totalEstimatedCostPercent;
  const tradeSizeUsd = Number(options.orderSizeUsd || 1000);
  const estimatedNetProfitUsd = (tradeSizeUsd * estimatedNetProfitPercent) / 100;
  const buyLiquidity = buy.topAskLiquidityUsd || buy.quoteVolume24h || null;
  const sellLiquidity = sell.topBidLiquidityUsd || sell.quoteVolume24h || null;
  const limitingLiquidityUsd = [buyLiquidity, sellLiquidity]
    .filter(value => Number.isFinite(value) && value > 0)
    .reduce((min, value) => Math.min(min, value), Number.POSITIVE_INFINITY);
  const normalizedLiquidityUsd = Number.isFinite(limitingLiquidityUsd) ? limitingLiquidityUsd : null;
  const liquidityOk = normalizedLiquidityUsd === null
    ? false
    : normalizedLiquidityUsd >= Number(options.minLiquidityUsd || 250);
  const spreadOk = grossSpreadPercent >= Number(options.minGrossSpreadPercent || 0.05);
  const netOk = estimatedNetProfitPercent >= Number(options.minNetProfitPercent || 0.02);
  const latencyOk = latencyMs <= Number(options.maxLatencyMs || 1500);
  const accepted = spreadOk && netOk && liquidityOk && latencyOk;

  return {
    id: `${buy.exchangeName}_to_${sell.exchangeName}_${Date.now()}`,
    symbol: buy.symbol,
    buyVenue: buy.displayName,
    buyExchangeName: buy.exchangeName,
    buyPrice: buyAsk,
    sellVenue: sell.displayName,
    sellExchangeName: sell.exchangeName,
    sellPrice: sellBid,
    grossSpreadPercent,
    combinedFeePercent,
    slippagePercent,
    latencyRiskPercent,
    totalEstimatedCostPercent,
    estimatedNetProfitPercent,
    estimatedNetProfitUsd,
    tradeSizeUsd,
    latencyMs,
    limitingLiquidityUsd: normalizedLiquidityUsd,
    status: accepted ? 'paper_simulation_candidate' : 'rejected_for_now',
    accepted,
    rejectionReasons: [
      spreadOk ? null : 'Spread is too small before costs.',
      netOk ? null : 'Estimated net profit is too small after fees, slippage, and latency buffer.',
      liquidityOk ? null : 'Visible top-of-book liquidity is too low or unavailable.',
      latencyOk ? null : 'Read-only endpoint latency is above the selected tolerance.'
    ].filter(Boolean),
    plainEnglish: accepted
      ? `Buy ${buy.symbol} on ${buy.displayName}, sell on ${sell.displayName}, then paper simulate before any live-trading approval. Estimated net edge is ${estimatedNetProfitPercent.toFixed(4)}% after fees, slippage, and latency buffer.`
      : `No paper candidate yet: ${[
        spreadOk ? null : 'spread too small',
        netOk ? null : 'net edge too small',
        liquidityOk ? null : 'liquidity too low or unavailable',
        latencyOk ? null : 'latency too high'
      ].filter(Boolean).join(', ')}.`,
    safetyBoundary: {
      readOnlyMarketData: true,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      orderEndpointEnabled: false,
      ordersPlaced: false
    }
  };
}

async function scanReadOnlyArbitrageOpportunities({
  connectors = [],
  symbol = 'BTC/USDT',
  venues = [],
  connectedOnly = false,
  includeExpanded = true,
  minGrossSpreadPercent = 0.05,
  minNetProfitPercent = 0.02,
  minLiquidityUsd = 250,
  maxLatencyMs = 1500,
  orderSizeUsd = 1000,
  slippagePercent = DEFAULT_SLIPPAGE_PERCENT,
  maxVenues = 16,
  maxCandidates = 12
} = {}) {
  const snapshots = await collectReadOnlyMarketSnapshots({
    connectors,
    symbol,
    venues,
    connectedOnly,
    includeExpanded,
    maxVenues
  });
  const validSnapshots = snapshots.results
    .filter(result => result.status === 'ok')
    .map(result => result.snapshot)
    .filter(snapshot => Number.isFinite(snapshot.bid) && Number.isFinite(snapshot.ask) && snapshot.bid > 0 && snapshot.ask > 0);
  const options = {
    minGrossSpreadPercent,
    minNetProfitPercent,
    minLiquidityUsd,
    maxLatencyMs,
    orderSizeUsd,
    slippagePercent
  };
  const candidates = [];

  for (const buy of validSnapshots) {
    for (const sell of validSnapshots) {
      if (buy.exchangeName === sell.exchangeName) {
        continue;
      }

      const candidate = createArbitrageCandidate({ buy, sell, options });
      if (candidate.grossSpreadPercent > 0) {
        candidates.push(candidate);
      }
    }
  }

  candidates.sort((a, b) => b.estimatedNetProfitPercent - a.estimatedNetProfitPercent);

  const acceptedCandidates = candidates.filter(candidate => candidate.accepted);
  const bestCandidate = acceptedCandidates[0] || candidates[0] || null;

  return {
    symbol: snapshots.symbol,
    scanMode: connectedOnly ? 'connected-read-only-venues' : 'expanded-public-read-only-venues',
    options,
    venueSummary: {
      requested: snapshots.requestedVenueCount,
      working: snapshots.okCount,
      errors: snapshots.errorCount
    },
    snapshots: snapshots.results,
    candidates: candidates.slice(0, maxCandidates),
    acceptedCandidates: acceptedCandidates.slice(0, maxCandidates),
    bestCandidate,
    plainEnglishSummary: bestCandidate
      ? bestCandidate.accepted
        ? `Best read-only candidate: buy on ${bestCandidate.buyVenue}, sell on ${bestCandidate.sellVenue}. Paper simulate it before any live approval.`
        : 'Spreads were detected, but no candidate passed the full fee, slippage, latency, and liquidity checks.'
      : 'No cross-venue spread was detected from the currently reachable read-only market-data endpoints.',
    safetyBoundary: {
      marketDataOnly: true,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      orderEndpointEnabled: false,
      ordersPlaced: false
    },
    generatedAt: new Date().toISOString()
  };
}

function createPaperSimulationForOpportunity(opportunity = {}) {
  const tradeSizeUsd = Number(opportunity.tradeSizeUsd || 1000);
  const estimatedNetProfitPercent = Number(opportunity.estimatedNetProfitPercent || 0);
  const estimatedNetProfitUsd = (tradeSizeUsd * estimatedNetProfitPercent) / 100;

  return {
    status: 'paper_simulation_created',
    title: 'Local paper simulation only',
    opportunity: {
      symbol: opportunity.symbol,
      buyVenue: opportunity.buyVenue,
      sellVenue: opportunity.sellVenue,
      grossSpreadPercent: Number(opportunity.grossSpreadPercent || 0),
      estimatedNetProfitPercent,
      estimatedNetProfitUsd,
      tradeSizeUsd
    },
    steps: [
      'Freeze the read-only snapshot.',
      'Pretend to buy at the visible ask.',
      'Pretend to sell at the visible bid.',
      'Subtract estimated exchange fees, slippage, and latency buffer.',
      'Record the result as research only.'
    ],
    safetyBoundary: {
      paperOnly: true,
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      orderEndpointEnabled: false,
      ordersPlaced: false
    },
    generatedAt: new Date().toISOString()
  };
}

function buildLiveTradingLaunchRoadmap({
  connectors = [],
  latestScan = null
} = {}) {
  const connectionSummary = buildReadOnlyConnectionSummary(connectors);
  const connectedCount = connectionSummary.categories.connected.length;

  return {
    title: 'Live Trading Launch Roadmap',
    currentMode: 'read_only_and_paper_only',
    simpleStatus: 'Live trading is locked. EtherealAI is building the safe path toward it.',
    nextRecommendedAction: connectedCount > 0
      ? 'Run a read-only arbitrage scan and paper simulate the best opportunity.'
      : 'Run a public read-only market scan now. Connect read-only exchange API keys later only when you want account-specific fee and limit checks.',
    phases: [
      {
        id: 'phase_1_read_only_api_expansion',
        title: 'Phase 1: Read-Only API Expansion',
        status: 'in_progress',
        done: [
          'Read-only connector registry exists.',
          'Encrypted local vault exists for API values.',
          'Expanded public market snapshot scanner exists.',
          'Withdrawals, trading, wallet signing, and orders remain disabled.'
        ],
        missing: [
          'Owner-provided read-only API keys for preferred exchanges.',
          'Per-venue real fee tier verification where exchanges require account access.',
          'Additional token-address quote mappings for DEX aggregators.'
        ],
        nextButton: 'Run Read-Only Market Scan'
      },
      {
        id: 'phase_2_arbitrage_intelligence',
        title: 'Phase 2: Arbitrage Intelligence Engine',
        status: latestScan ? 'in_progress' : 'ready_to_start',
        done: [
          'Best buy vs best sell comparison exists.',
          'Fee, slippage, latency, liquidity, and net profit checks exist.',
          'Plain-English candidate output exists.',
          'Paper simulation action exists.'
        ],
        missing: [
          'Historical quote snapshot storage.',
          'Route-specific DEX token address mapping.',
          'Multi-hop and cross-chain route modeling.'
        ],
        nextButton: 'Scan For Read-Only Opportunities'
      },
      {
        id: 'phase_3_live_trading_readiness',
        title: 'Phase 3: Live Trading Readiness System',
        status: 'locked',
        done: [
          'Live lock boundary exists.',
          'Risk profiles and kill switch exist for paper mode.'
        ],
        missing: [
          'Trading permission verification.',
          'Withdrawal disabled verification for each exchange.',
          'Owner manual approval workflow.',
          'Legal/compliance checklist.',
          'Funding wallet separation.',
          'Dry-run proof package.',
          'Emergency stop drill.'
        ],
        nextButton: 'Review Locked Live Requirements'
      },
      {
        id: 'phase_4_live_test_mode',
        title: 'Phase 4: Live Test Mode',
        status: 'locked',
        done: [],
        missing: [
          'One exchange approved.',
          'One symbol approved.',
          'One strategy approved.',
          'Tiny max trade size approved.',
          'Manual owner approval recorded.'
        ],
        nextButton: 'Locked Until Phase 3 Passes'
      },
      {
        id: 'phase_5_production_live_mode',
        title: 'Phase 5: Production Live Mode',
        status: 'locked',
        done: [],
        missing: [
          'Repeated successful live test runs.',
          'Scaling rules.',
          'Capital limits.',
          'Treasury controls.',
          'Alerts and monitoring.',
          'Rollback procedures.'
        ],
        nextButton: 'Locked Until Live Test Proof Exists'
      }
    ],
    approvalCenter: {
      status: 'locked',
      requirements: [
        { id: 'exchange_trading_permissions', label: 'Exchange trading permissions verified', status: 'locked', button: 'Future: Verify Trading Permissions' },
        { id: 'withdrawals_disabled', label: 'Withdrawals disabled on every live venue', status: 'locked', button: 'Future: Verify Withdrawals Disabled' },
        { id: 'max_order_limits', label: 'Max order limits set', status: 'locked', button: 'Future: Set Live Limits' },
        { id: 'max_daily_loss', label: 'Max daily loss set', status: 'locked', button: 'Future: Set Daily Loss Limit' },
        { id: 'max_open_positions', label: 'Max open positions set', status: 'locked', button: 'Future: Set Position Limit' },
        { id: 'kill_switch', label: 'Emergency kill switch tested', status: 'locked', button: 'Future: Run Kill Switch Drill' },
        { id: 'manual_owner_approval', label: 'Manual owner approval recorded', status: 'locked', button: 'Future: Owner Approval' },
        { id: 'audit_log', label: 'Audit log enabled', status: 'working', button: 'Review Proof Packet' },
        { id: 'hardware_wallet_boundary', label: 'Hardware wallet / signing boundary defined', status: 'locked', button: 'Future: Define Signing Boundary' },
        { id: 'legal_compliance', label: 'Legal/compliance checklist complete', status: 'locked', button: 'Future: Compliance Checklist' },
        { id: 'funding_separation', label: 'Funding wallet separation complete', status: 'locked', button: 'Future: Review Wallet Funding' },
        { id: 'dry_run_proof', label: 'Dry-run proof exists', status: 'locked', button: 'Future: Generate Dry-Run Proof' },
        { id: 'small_capital_test', label: 'Small-capital test mode configured', status: 'locked', button: 'Future: Configure Tiny Test Mode' }
      ]
    },
    safetyBoundary: {
      liveTradingEnabled: false,
      withdrawalsEnabled: false,
      walletSigningEnabled: false,
      orderEndpointEnabled: false,
      productionLiveModeEnabled: false
    },
    generatedAt: new Date().toISOString()
  };
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
  DEX_MARKET_DATA_CONNECTORS,
  DEX_QUOTE_PREVIEW_CONNECTORS,
  EXPANDED_READONLY_MARKET_VENUES,
  EXCHANGE_READONLY_SETUP_GUIDES,
  DEX_QUOTE_ONLY_SETUP_GUIDES,
  DEX_MARKET_DATA_SETUP_GUIDES,
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
  fetchReadOnlyMarketSnapshot,
  collectReadOnlyMarketSnapshots,
  testReadOnlyExchangeConnection,
  compareReadOnlyPrices,
  scanReadOnlyArbitrageOpportunities,
  createPaperSimulationForOpportunity,
  buildLiveTradingLaunchRoadmap,
  buildDexConnectorCenterStatus,
  testDexMarketDataConnector,
  previewDexQuoteRoute,
  createPlainEnglishDexError,
  buildReadOnlyConnectionSummary,
  createPlainEnglishPublicMarketDataError,
  createPlainEnglishExchangeError
};
