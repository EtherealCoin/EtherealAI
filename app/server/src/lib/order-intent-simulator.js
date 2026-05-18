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

const DEFAULT_REBALANCE_CANDIDATES = [
  {
    marketSymbol: 'EAI/USDT',
    marketCapRank: 42,
    marketCapUsd: 850000000,
    priceChangePercent24h: -12.4,
    priceChangePercent7d: -18.2,
    venueQuotes: [
      {
        venue: 'binance',
        venueType: 'cex',
        chain: 'centralized',
        price: 0.99,
        feePercent: 0.1,
        slippagePercent: 0.05,
        gasCost: 0,
        liquidityScore: 91
      },
      {
        venue: 'aerodrome',
        venueType: 'dex',
        chain: 'base',
        price: 1.01,
        feePercent: 0.3,
        slippagePercent: 0.1,
        gasCost: 0.05,
        liquidityScore: 70
      },
      {
        venue: 'raydium',
        venueType: 'dex',
        chain: 'solana',
        price: 0.985,
        feePercent: 0.25,
        slippagePercent: 0.12,
        gasCost: 0.02,
        liquidityScore: 67
      }
    ]
  },
  {
    marketSymbol: 'BASE/USDT',
    marketCapRank: 88,
    marketCapUsd: 420000000,
    priceChangePercent24h: -8.1,
    priceChangePercent7d: -10.4,
    venueQuotes: [
      {
        venue: 'coinbase',
        venueType: 'cex',
        chain: 'centralized',
        price: 2.42,
        feePercent: 0.16,
        slippagePercent: 0.06,
        gasCost: 0,
        liquidityScore: 84
      },
      {
        venue: 'aerodrome',
        venueType: 'dex',
        chain: 'base',
        price: 2.48,
        feePercent: 0.3,
        slippagePercent: 0.14,
        gasCost: 0.04,
        liquidityScore: 75
      }
    ]
  },
  {
    marketSymbol: 'SOL/USDT',
    marketCapRank: 5,
    marketCapUsd: 78000000000,
    priceChangePercent24h: -2.2,
    priceChangePercent7d: -4.8,
    venueQuotes: [
      {
        venue: 'binance',
        venueType: 'cex',
        chain: 'centralized',
        price: 175.2,
        feePercent: 0.1,
        slippagePercent: 0.05,
        gasCost: 0,
        liquidityScore: 95
      },
      {
        venue: 'raydium',
        venueType: 'dex',
        chain: 'solana',
        price: 175.55,
        feePercent: 0.25,
        slippagePercent: 0.08,
        gasCost: 0.02,
        liquidityScore: 83
      }
    ]
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

function getPositiveNumber(value, fallback = 1) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

function normalizeRebalanceCandidate(candidate = {}, index = 0) {
  const marketSymbol = cleanText(
    candidate.marketSymbol || candidate.market_symbol || `TOKEN${index + 1}/USDT`,
    '',
    40
  ).toUpperCase();
  const marketCapRank = Math.max(1, Math.round(getPositiveNumber(
    candidate.marketCapRank ?? candidate.market_cap_rank,
    index + 1
  )));
  const venueQuotes = Array.isArray(candidate.venueQuotes || candidate.venue_quotes)
    ? candidate.venueQuotes || candidate.venue_quotes
    : DEFAULT_VENUE_QUOTES;

  if (!marketSymbol) {
    throw new Error('Each rebalance candidate needs a market symbol.');
  }

  return {
    marketSymbol,
    marketCapRank,
    marketCapUsd: getNonNegativeNumber(candidate.marketCapUsd ?? candidate.market_cap_usd, 0),
    priceChangePercent24h: Number(candidate.priceChangePercent24h ?? candidate.price_change_percent_24h ?? 0),
    priceChangePercent7d: Number(candidate.priceChangePercent7d ?? candidate.price_change_percent_7d ?? 0),
    currentHoldingValue: getNonNegativeNumber(candidate.currentHoldingValue ?? candidate.current_holding_value, 0),
    targetWeightPercent: getNonNegativeNumber(candidate.targetWeightPercent ?? candidate.target_weight_percent, 0),
    notes: cleanText(candidate.notes || '', '', 300),
    venueQuotes: venueQuotes.map(normalizeVenueQuote)
  };
}

function normalizeCsvHeader(header = '') {
  return String(header || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseCsvRows(csvText = '') {
  rejectSecretLikeSimulationInput({ csvText });
  const text = String(csvText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  if (!text) {
    throw new Error('Candidate CSV text is required.');
  }

  if (text.length > 2_000_000) {
    throw new Error('Candidate CSV is too large for one local preview. Keep it under 2 MB.');
  }

  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if (char === '\n' && !inQuotes) {
      row.push(cell.trim());
      if (row.some(value => value !== '')) {
        rows.push(row);
      }
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some(value => value !== '')) {
    rows.push(row);
  }

  if (rows.length < 2) {
    throw new Error('Candidate CSV needs a header row and at least one data row.');
  }

  const headers = rows[0].map(normalizeCsvHeader);

  return rows.slice(1).map(values => headers.reduce((record, header, index) => {
    if (header) {
      record[header] = values[index] ?? '';
    }

    return record;
  }, {}));
}

function getCsvField(row = {}, aliases = []) {
  for (const alias of aliases) {
    const key = normalizeCsvHeader(alias);

    if (Object.prototype.hasOwnProperty.call(row, key) && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }

  return '';
}

function getCsvNumber(row = {}, aliases = [], fallback = undefined) {
  const raw = getCsvField(row, aliases);

  if (!raw) {
    return fallback;
  }

  const parsed = Number(String(raw).replace(/[$,%\s]/g, ''));

  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseRebalanceCandidateCsv(csvText = '') {
  const rows = parseCsvRows(csvText);
  const grouped = new Map();

  rows.forEach((row, index) => {
    const marketSymbol = cleanText(
      getCsvField(row, ['marketSymbol', 'market_symbol', 'symbol', 'pair', 'ticker']),
      '',
      40
    ).toUpperCase();

    if (!marketSymbol) {
      throw new Error(`Candidate CSV row ${index + 2} needs a marketSymbol/symbol value.`);
    }

    if (!grouped.has(marketSymbol)) {
      grouped.set(marketSymbol, {
        marketSymbol,
        marketCapRank: getCsvNumber(row, ['marketCapRank', 'market_cap_rank', 'cmcRank', 'rank'], index + 1),
        marketCapUsd: getCsvNumber(row, ['marketCapUsd', 'market_cap_usd', 'marketCap', 'market_cap'], 0),
        priceChangePercent24h: getCsvNumber(row, ['priceChangePercent24h', 'price_change_percent_24h', 'change24h', 'change_24h'], 0),
        priceChangePercent7d: getCsvNumber(row, ['priceChangePercent7d', 'price_change_percent_7d', 'change7d', 'change_7d'], 0),
        currentHoldingValue: getCsvNumber(row, ['currentHoldingValue', 'current_holding_value', 'holdingUsd', 'holding_usd'], 0),
        targetWeightPercent: getCsvNumber(row, ['targetWeightPercent', 'target_weight_percent', 'targetWeight', 'target_weight'], 0),
        notes: cleanText(getCsvField(row, ['notes', 'note']), '', 300),
        venueQuotes: []
      });
    }

    const candidate = grouped.get(marketSymbol);
    const venue = cleanText(getCsvField(row, ['venue', 'exchange', 'dex', 'cex']), '', 80);
    const price = getCsvNumber(row, ['price', 'quotePrice', 'quote_price', 'lastPrice', 'last_price'], null);

    if (venue || Number.isFinite(price)) {
      candidate.venueQuotes.push({
        venue: venue || `csv-venue-${candidate.venueQuotes.length + 1}`,
        venueType: getCsvField(row, ['venueType', 'venue_type', 'type']) || 'cex',
        chain: getCsvField(row, ['chain', 'blockchain', 'network']) || 'centralized',
        price,
        feePercent: getCsvNumber(row, ['feePercent', 'fee_percent', 'fee'], 0),
        slippagePercent: getCsvNumber(row, ['slippagePercent', 'slippage_percent', 'slippage'], 0),
        gasCost: getCsvNumber(row, ['gasCost', 'gas_cost', 'gas'], 0),
        bridgeCost: getCsvNumber(row, ['bridgeCost', 'bridge_cost', 'bridge'], 0),
        liquidityScore: getCsvNumber(row, ['liquidityScore', 'liquidity_score', 'liquidity'], 50),
        latencyMs: getCsvNumber(row, ['latencyMs', 'latency_ms', 'latency'], 0)
      });
    }
  });

  const candidates = Array.from(grouped.values()).map((candidate, index) => {
    if (!candidate.venueQuotes.length) {
      throw new Error(`Candidate CSV token ${candidate.marketSymbol} needs at least one venue quote row.`);
    }

    return normalizeRebalanceCandidate(candidate, index);
  });

  if (!candidates.length) {
    throw new Error('Candidate CSV did not contain any usable candidates.');
  }

  return candidates;
}

function normalizeTopRebalanceBatchInput(input = {}) {
  rejectSecretLikeSimulationInput(input);
  const csvCandidates = typeof input.candidateCsv === 'string' && input.candidateCsv.trim()
    ? parseRebalanceCandidateCsv(input.candidateCsv)
    : null;
  const candidates = Array.isArray(input.candidates) && input.candidates.length
    ? input.candidates
    : csvCandidates || DEFAULT_REBALANCE_CANDIDATES;
  const normalizedCandidates = candidates.map(normalizeRebalanceCandidate);

  return {
    name: cleanText(input.name || input.batchName || 'Top-200 rebalance local simulation', '', 120),
    strategyType: cleanText(input.strategyType || input.strategy_type || 'top_200_rebalance_batch', 'top_200_rebalance_batch', 80),
    tokenEcosystemProjectId: input.tokenEcosystemProjectId || input.token_ecosystem_project_id
      ? Number(input.tokenEcosystemProjectId || input.token_ecosystem_project_id)
      : null,
    portfolioCapital: getPositiveNumber(input.portfolioCapital ?? input.portfolio_capital, 10000),
    allocationPerCandidatePercent: Math.min(100, getPositiveNumber(
      input.allocationPerCandidatePercent ?? input.allocation_per_candidate_percent,
      5
    )),
    maxCandidates: Math.min(50, Math.max(1, Math.round(getPositiveNumber(input.maxCandidates ?? input.max_candidates, 5)))),
    minDropPercent: getNonNegativeNumber(input.minDropPercent ?? input.min_drop_percent, 3),
    minNetEdgePercent: getNonNegativeNumber(input.minNetEdgePercent ?? input.min_net_edge_percent, 0.25),
    candidates: normalizedCandidates,
    notes: cleanText(input.notes || '', '', 500)
  };
}

function rankRebalanceCandidate(left, right) {
  if (left.priceChangePercent24h !== right.priceChangePercent24h) {
    return left.priceChangePercent24h - right.priceChangePercent24h;
  }

  return left.marketCapRank - right.marketCapRank;
}

function simulateTopRebalanceBatch(input = {}) {
  const normalized = normalizeTopRebalanceBatchInput(input);
  const eligibleCandidates = normalized.candidates
    .filter(candidate => candidate.marketCapRank <= 200)
    .filter(candidate => candidate.priceChangePercent24h <= -normalized.minDropPercent)
    .sort(rankRebalanceCandidate)
    .slice(0, normalized.maxCandidates);
  const allocationUsd = normalized.portfolioCapital * (normalized.allocationPerCandidatePercent / 100);
  const simulations = eligibleCandidates.map(candidate => {
    const bestRawPrice = Math.min(...candidate.venueQuotes.map(quote => quote.price));
    const quantity = allocationUsd / bestRawPrice;
    const simulation = simulateCrossExchangeArbitrage({
      marketSymbol: candidate.marketSymbol,
      quantity,
      minNetEdgePercent: normalized.minNetEdgePercent,
      strategyType: normalized.strategyType,
      venueQuotes: candidate.venueQuotes,
      notes: candidate.notes
    });

    return {
      candidate,
      allocationUsd: roundNumber(allocationUsd, 4),
      quantity: roundNumber(quantity, 8),
      simulation
    };
  });
  const paperCandidates = simulations.filter(item => item.simulation.status === 'paper_candidate');
  const estimatedNetProfit = paperCandidates.reduce(
    (total, item) => total + (item.simulation.economics?.estimatedNetProfit || 0),
    0
  );
  const bestCandidate = paperCandidates
    .slice()
    .sort((left, right) => (
      right.simulation.economics.estimatedNetEdgePercent - left.simulation.economics.estimatedNetEdgePercent
    ))[0] || null;
  const status = eligibleCandidates.length === 0
    ? 'no_candidates'
    : paperCandidates.length > 0
      ? 'paper_candidate'
      : 'review';

  return {
    status,
    generatedAt: new Date().toISOString(),
    name: normalized.name,
    strategyType: normalized.strategyType,
    tokenEcosystemProjectId: normalized.tokenEcosystemProjectId,
    portfolioCapital: normalized.portfolioCapital,
    allocationPerCandidatePercent: normalized.allocationPerCandidatePercent,
    allocationUsd: roundNumber(allocationUsd, 4),
    maxCandidates: normalized.maxCandidates,
    minDropPercent: normalized.minDropPercent,
    minNetEdgePercent: normalized.minNetEdgePercent,
    candidateUniverseCount: normalized.candidates.length,
    eligibleCandidates: eligibleCandidates.map(candidate => ({
      marketSymbol: candidate.marketSymbol,
      marketCapRank: candidate.marketCapRank,
      marketCapUsd: candidate.marketCapUsd,
      priceChangePercent24h: candidate.priceChangePercent24h,
      priceChangePercent7d: candidate.priceChangePercent7d
    })),
    simulations,
    summary: {
      selectedCount: eligibleCandidates.length,
      paperCandidateCount: paperCandidates.length,
      rejectedCount: simulations.length - paperCandidates.length,
      estimatedNetProfit: roundNumber(estimatedNetProfit, 4),
      averageNetEdgePercent: roundNumber(
        simulations.reduce((total, item) => total + item.simulation.economics.estimatedNetEdgePercent, 0)
          / Math.max(1, simulations.length),
        4
      ),
      bestMarketSymbol: bestCandidate?.candidate?.marketSymbol || null,
      bestNetEdgePercent: bestCandidate?.simulation?.economics?.estimatedNetEdgePercent ?? null
    },
    recommendedDraftIntentGroups: paperCandidates.map(item => ({
      marketSymbol: item.candidate.marketSymbol,
      marketCapRank: item.candidate.marketCapRank,
      priceChangePercent24h: item.candidate.priceChangePercent24h,
      allocationUsd: item.allocationUsd,
      simulationStatus: item.simulation.status,
      economics: item.simulation.economics,
      draftIntents: item.simulation.recommendedDraftIntents
    })),
    safetyBoundary: {
      localOnly: true,
      networkCallsEnabled: false,
      credentialLoadingEnabled: false,
      liveExecutionEnabled: false,
      orderEndpointEnabled: false,
      note: 'This batch uses local candidate and quote data only. It ranks top-200 drawdown candidates and creates review artifacts, not live orders.'
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

function parseRebalanceSimulationBatch(row = {}) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    token_ecosystem_project_id: row.token_ecosystem_project_id,
    name: row.name,
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
  DEFAULT_REBALANCE_CANDIDATES,
  parseRebalanceCandidateCsv,
  normalizeCrossExchangeSimulationInput,
  normalizeTopRebalanceBatchInput,
  simulateCrossExchangeArbitrage,
  simulateTopRebalanceBatch,
  parseArbitrageSimulationRun,
  parseRebalanceSimulationBatch
};
