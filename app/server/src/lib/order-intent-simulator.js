const DEFAULT_VENUE_QUOTES = [
  {
    venue: 'binance',
    venueType: 'cex',
    chain: 'centralized',
    price: 100,
    feePercent: 0.1,
    slippagePercent: 0.05,
    gasCost: 0,
    liquidityScore: 90,
    latencyMs: 120
  },
  {
    venue: 'coinbase',
    venueType: 'cex',
    chain: 'centralized',
    price: 100.35,
    feePercent: 0.16,
    slippagePercent: 0.06,
    gasCost: 0,
    liquidityScore: 84,
    latencyMs: 180
  },
  {
    venue: 'aerodrome',
    venueType: 'dex',
    chain: 'base',
    price: 100.55,
    feePercent: 0.3,
    slippagePercent: 0.15,
    gasCost: 0.08,
    liquidityScore: 72,
    latencyMs: 900
  },
  {
    venue: 'raydium',
    venueType: 'dex',
    chain: 'solana',
    price: 99.72,
    feePercent: 0.25,
    slippagePercent: 0.12,
    gasCost: 0.02,
    liquidityScore: 69,
    latencyMs: 750
  }
];

function roundNumber(value, decimals = 8) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function cleanText(value, fallback = '', maxLength = 120) {
  const cleaned = String(value ?? fallback).trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

function rejectSecretLikeSimulationInput(payload = {}) {
  const text = JSON.stringify(payload);

  if (/-----BEGIN|private key|seed phrase|mnemonic|api[_-]?key|cloudflare token|exchange secret|wallet secret|password/i.test(text)) {
    throw new Error('Arbitrage simulations cannot store private keys, API keys, passwords, wallet secrets, mnemonics, or exchange secrets.');
  }
}

function getNonNegativeNumber(value, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeVenueQuote(quote = {}, index = 0) {
  const venue = cleanText(quote.venue || quote.exchange || `venue-${index + 1}`, '', 80).toLowerCase();
  const venueType = cleanText(quote.venueType || quote.type || 'cex', 'cex', 40).toLowerCase();
  const chain = cleanText(quote.chain || (venueType === 'cex' ? 'centralized' : 'unknown'), 'unknown', 80).toLowerCase();
  const price = Number(quote.price);

  if (!venue) {
    throw new Error('Each venue quote needs a venue name.');
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Venue quote ${venue} needs a positive price.`);
  }

  return {
    venue,
    venueType,
    chain,
    price,
    feePercent: getNonNegativeNumber(quote.feePercent, 0),
    slippagePercent: getNonNegativeNumber(quote.slippagePercent, 0),
    gasCost: getNonNegativeNumber(quote.gasCost, 0),
    bridgeCost: getNonNegativeNumber(quote.bridgeCost, 0),
    liquidityScore: Math.min(100, getNonNegativeNumber(quote.liquidityScore, 50)),
    latencyMs: getNonNegativeNumber(quote.latencyMs, 0)
  };
}

function normalizeCrossExchangeSimulationInput(input = {}) {
  rejectSecretLikeSimulationInput(input);
  const marketSymbol = cleanText(input.marketSymbol || input.market_symbol || 'ETH/USDT', 'ETH/USDT', 40).toUpperCase();
  const quantity = Number(input.quantity || 1);
  const minNetEdgePercent = getNonNegativeNumber(input.minNetEdgePercent ?? input.min_net_edge_percent, 0.25);
  const strategyType = cleanText(input.strategyType || input.strategy_type || 'arbitrage_route_check', 'arbitrage_route_check', 80);
  const venueQuotes = Array.isArray(input.venueQuotes || input.venue_quotes)
    ? input.venueQuotes || input.venue_quotes
    : DEFAULT_VENUE_QUOTES;

  if (!marketSymbol) {
    throw new Error('Market symbol is required.');
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Quantity must be greater than zero.');
  }

  const normalizedQuotes = venueQuotes.map(normalizeVenueQuote);

  if (normalizedQuotes.length < 2) {
    throw new Error('At least two venue quotes are required for arbitrage simulation.');
  }

  return {
    marketSymbol,
    quantity,
    minNetEdgePercent,
    strategyType,
    venueQuotes: normalizedQuotes,
    notes: cleanText(input.notes || '', '', 500)
  };
}

function buildVenueExecution(quote, quantity, side) {
  const notional = quote.price * quantity;
  const feeCost = notional * (quote.feePercent / 100);
  const slippageCost = notional * (quote.slippagePercent / 100);
  const fixedCosts = quote.gasCost + quote.bridgeCost;

  if (side === 'sell') {
    const proceeds = notional - feeCost - slippageCost - fixedCosts;

    return {
      ...quote,
      side,
      notional: roundNumber(notional),
      feeCost: roundNumber(feeCost),
      slippageCost: roundNumber(slippageCost),
      fixedCosts: roundNumber(fixedCosts),
      proceeds: roundNumber(proceeds),
      effectiveUnitPrice: roundNumber(proceeds / quantity)
    };
  }

  const totalCost = notional + feeCost + slippageCost + fixedCosts;

  return {
    ...quote,
    side: 'buy',
    notional: roundNumber(notional),
    feeCost: roundNumber(feeCost),
    slippageCost: roundNumber(slippageCost),
    fixedCosts: roundNumber(fixedCosts),
    totalCost: roundNumber(totalCost),
    effectiveUnitPrice: roundNumber(totalCost / quantity)
  };
}

function compareBuyRoute(left, right) {
  return left.effectiveUnitPrice - right.effectiveUnitPrice;
}

function compareSellRoute(left, right) {
  return right.effectiveUnitPrice - left.effectiveUnitPrice;
}

function simulateCrossExchangeArbitrage(input = {}) {
  const normalized = normalizeCrossExchangeSimulationInput(input);
  const buyRoutes = normalized.venueQuotes
    .map(quote => buildVenueExecution(quote, normalized.quantity, 'buy'))
    .sort(compareBuyRoute);
  const sellRoutes = normalized.venueQuotes
    .map(quote => buildVenueExecution(quote, normalized.quantity, 'sell'))
    .sort(compareSellRoute);
  const entry = buyRoutes[0];
  const exit = sellRoutes.find(route => route.venue !== entry.venue) || sellRoutes[0];
  const grossSpread = exit.price - entry.price;
  const grossSpreadPercent = (grossSpread / entry.price) * 100;
  const netProfit = exit.proceeds - entry.totalCost;
  const netEdgePercent = (netProfit / entry.totalCost) * 100;
  const liquidityFloor = Math.min(entry.liquidityScore, exit.liquidityScore);
  const passesEdge = netEdgePercent >= normalized.minNetEdgePercent;
  const passesLiquidity = liquidityFloor >= 40;
  const decision = passesEdge && passesLiquidity ? 'paper_candidate' : 'reject';

  return {
    status: decision,
    generatedAt: new Date().toISOString(),
    marketSymbol: normalized.marketSymbol,
    strategyType: normalized.strategyType,
    quantity: normalized.quantity,
    minNetEdgePercent: normalized.minNetEdgePercent,
    bestEntry: entry,
    bestExit: exit,
    ranking: {
      buyRoutes,
      sellRoutes
    },
    economics: {
      grossSpread: roundNumber(grossSpread),
      grossSpreadPercent: roundNumber(grossSpreadPercent, 4),
      estimatedNetProfit: roundNumber(netProfit),
      estimatedNetEdgePercent: roundNumber(netEdgePercent, 4),
      liquidityFloor,
      passesEdge,
      passesLiquidity
    },
    recommendedDraftIntents: [
      {
        venue: entry.venue,
        chain: entry.chain,
        side: 'buy',
        orderType: 'limit',
        quantity: normalized.quantity,
        limitPrice: roundNumber(entry.price),
        reason: 'Local route simulation entry leg. Draft only.'
      },
      {
        venue: exit.venue,
        chain: exit.chain,
        side: 'sell',
        orderType: 'limit',
        quantity: normalized.quantity,
        limitPrice: roundNumber(exit.price),
        reason: 'Local route simulation exit leg. Draft only.'
      }
    ],
    safetyBoundary: {
      localOnly: true,
      networkCallsEnabled: false,
      credentialLoadingEnabled: false,
      liveExecutionEnabled: false,
      orderEndpointEnabled: false,
      note: 'This simulation uses owner-provided or default local quote data only. It cannot fetch exchange prices, load credentials, or place orders.'
    },
    blockingFailures: [
      'live_order_endpoint_enabled',
      'runtime_credential_value_loading',
      'exchange_adapter_network_calls'
    ],
    notes: normalized.notes
  };
}

function parseArbitrageSimulationRun(row = {}) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    market_symbol: row.market_symbol,
    strategy_type: row.strategy_type,
    status: row.status,
    input: JSON.parse(row.input_json || '{}'),
    result: JSON.parse(row.result_json || '{}'),
    localOnly: row.local_only !== 0,
    networkCallsEnabled: row.network_calls_enabled === 1,
    liveExecutionEnabled: row.live_execution_enabled === 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

module.exports = {
  DEFAULT_VENUE_QUOTES,
  normalizeCrossExchangeSimulationInput,
  simulateCrossExchangeArbitrage,
  parseArbitrageSimulationRun
};
