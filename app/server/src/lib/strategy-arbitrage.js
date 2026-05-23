const {
  roundNumber,
  getBacktestNumber,
  calculateMaxDrawdownPercent,
  average
} = require('./strategy-math');

const ARBITRAGE_STRATEGY_TYPES = [
  'cross_exchange_arbitrage',
  'cross_dex_arbitrage',
  'hybrid_dex_cex_arbitrage'
];

const ARBITRAGE_EXECUTION_TYPES = [
  'cex_cex',
  'dex_dex',
  'dex_cex',
  'triangular',
  'cross_chain'
];

const CEX_VENUES = new Set([
  'binance',
  'coinbase',
  'kraken',
  'okx',
  'bybit',
  'kucoin',
  'gemini'
]);

const DEX_CHAINS = {
  uniswap: 'ethereum',
  sushiswap: 'ethereum',
  pancakeswap: 'bnb',
  quickswap: 'polygon',
  aerodrome: 'base',
  raydium: 'solana',
  orca: 'solana',
  traderjoe: 'avalanche',
  curve: 'ethereum',
  balancer: 'ethereum'
};

function isArbitrageStrategyType(value) {
  return ARBITRAGE_STRATEGY_TYPES.includes(String(value || '').trim());
}

function cleanText(value, fallback = '', limit = 120) {
  const text = String(value ?? fallback).trim();

  return (text || fallback).slice(0, limit);
}

function cleanList(value, fallback = []) {
  const raw = Array.isArray(value)
    ? value
    : String(value || '').split(/[\n,]+/);
  const cleaned = raw
    .map(item => cleanText(item, '', 80))
    .filter(Boolean);

  return cleaned.length ? [...new Set(cleaned)] : fallback;
}

function getNonNegative(value, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getPositive(value, fallback = 1) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clampNumber(value, min, max) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return min;
  }

  return Math.max(min, Math.min(max, parsed));
}

function getBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = String(value || '').trim().toLowerCase();

  if (['true', '1', 'yes', 'on', 'required'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function defaultBuyVenues(strategyType) {
  if (strategyType === 'cross_dex_arbitrage') {
    return ['quickswap', 'uniswap', 'sushiswap'];
  }

  if (strategyType === 'hybrid_dex_cex_arbitrage') {
    return ['quickswap', 'uniswap', 'binance'];
  }

  return ['binance', 'coinbase', 'kraken'];
}

function defaultSellVenues(strategyType) {
  if (strategyType === 'cross_dex_arbitrage') {
    return ['uniswap', 'sushiswap', 'pancakeswap'];
  }

  if (strategyType === 'hybrid_dex_cex_arbitrage') {
    return ['binance', 'coinbase', 'aerodrome'];
  }

  return ['coinbase', 'kraken', 'binance'];
}

function inferVenueType(venue, strategyType) {
  const normalized = String(venue || '').trim().toLowerCase();

  if (CEX_VENUES.has(normalized)) {
    return 'cex';
  }

  if (DEX_CHAINS[normalized]) {
    return 'dex';
  }

  if (strategyType === 'cross_dex_arbitrage') {
    return 'dex';
  }

  if (strategyType === 'cross_exchange_arbitrage') {
    return 'cex';
  }

  return /swap|dex|uni|sushi|curve|pool|amm/i.test(normalized) ? 'dex' : 'cex';
}

function inferChain(venue, venueType) {
  const normalized = String(venue || '').trim().toLowerCase();

  if (DEX_CHAINS[normalized]) {
    return DEX_CHAINS[normalized];
  }

  return venueType === 'dex' ? 'custom_chain' : 'centralized';
}

function normalizeExecutionType(value, strategyType) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

  if (ARBITRAGE_EXECUTION_TYPES.includes(normalized)) {
    return normalized;
  }

  if (strategyType === 'cross_dex_arbitrage') {
    return 'dex_dex';
  }

  if (strategyType === 'hybrid_dex_cex_arbitrage') {
    return 'dex_cex';
  }

  return 'cex_cex';
}

function normalizeArbitrageStrategyRules(input = {}, strategyType = 'cross_exchange_arbitrage') {
  const safeStrategyType = isArbitrageStrategyType(strategyType)
    ? strategyType
    : 'cross_exchange_arbitrage';
  const buyVenues = cleanList(
    input.buyVenues || input.buy_venues,
    defaultBuyVenues(safeStrategyType)
  );
  const sellVenues = cleanList(
    input.sellVenues || input.sell_venues,
    defaultSellVenues(safeStrategyType)
  );
  const arbitrageType = normalizeExecutionType(
    input.arbitrageType || input.arbitrage_type,
    safeStrategyType
  );

  return {
    version: 'arbitrage_rules_v1',
    strategyType: safeStrategyType,
    arbitrageType,
    buyVenues,
    sellVenues,
    minimumSpreadPercent: getPositive(
      input.minimumSpreadPercent ?? input.minimum_spread_percent ?? input.minNetEdgePercent,
      0.35
    ),
    estimatedFeePercent: getNonNegative(input.estimatedFeePercent ?? input.estimated_fee_percent, 0.1),
    makerFeePercent: getNonNegative(input.makerFeePercent ?? input.maker_fee_percent, input.estimatedFeePercent ?? 0.08),
    takerFeePercent: getNonNegative(input.takerFeePercent ?? input.taker_fee_percent, input.estimatedFeePercent ?? 0.12),
    slippageTolerancePercent: getNonNegative(input.slippageTolerancePercent ?? input.slippage_tolerance_percent, 0.05),
    minimumLiquidity: getNonNegative(input.minimumLiquidity ?? input.minimum_liquidity, 10000),
    maxExecutionLatencyMs: getPositive(input.maxExecutionLatencyMs ?? input.max_execution_latency_ms, 750),
    simultaneousExecutionRequired: getBoolean(
      input.simultaneousExecutionRequired ?? input.simultaneous_execution_required,
      true
    ),
    stablecoinPair: cleanText(input.stablecoinPair || input.stablecoin_pair || 'USDT', 'USDT', 20).toUpperCase(),
    tokenWhitelist: cleanList(input.tokenWhitelist || input.token_whitelist, []),
    topVolumeFilter: {
      enabled: getBoolean(input.topVolumeFilterEnabled ?? input.top_volume_filter_enabled, true),
      maxPairRank: getPositive(input.topVolumeMaxRank ?? input.top_volume_max_rank, 200),
      minimumVolumeUsd: getNonNegative(input.minimumVolumeUsd ?? input.minimum_volume_usd, 75000),
      percentileFloor: clampNumber(input.volumePercentileFloor ?? input.volume_percentile_floor ?? 60, 0, 100)
    },
    venueRouting: {
      compareOrderBooks: true,
      feeAware: true,
      slippageAware: true,
      liquidityAware: true,
      latencyAware: true,
      makerTakerFeeModel: true,
      collapseBeforeExecutionCheck: true,
      topVolumePairFilter: true,
      routeSelection: 'best_net_edge_after_costs'
    },
    safetyBoundary: {
      localOnly: true,
      liveExecutionEnabled: false,
      walletSigningEnabled: false,
      networkCallsEnabled: false
    }
  };
}

function buildArbitrageRuleSummary(rules = {}) {
  return [
    `Arbitrage type: ${rules.arbitrageType || 'cex_cex'}`,
    `Buy venues: ${(rules.buyVenues || []).join(', ')}`,
    `Sell venues: ${(rules.sellVenues || []).join(', ')}`,
    `Minimum net spread: ${rules.minimumSpreadPercent}%`,
    `Estimated fee: ${rules.estimatedFeePercent}% per side`,
    `Maker/taker fees: ${rules.makerFeePercent}% maker / ${rules.takerFeePercent}% taker`,
    `Slippage tolerance: ${rules.slippageTolerancePercent}% per side`,
    `Minimum liquidity: ${rules.minimumLiquidity}`,
    `Max latency: ${rules.maxExecutionLatencyMs} ms`,
    `Top-volume filter: ${rules.topVolumeFilter?.enabled ? `top ${rules.topVolumeFilter.maxPairRank} / min volume $${rules.topVolumeFilter.minimumVolumeUsd}` : 'disabled'}`,
    `Simultaneous execution: ${rules.simultaneousExecutionRequired ? 'required' : 'not required'}`
  ].join('\n');
}

function hashVenue(venue) {
  return String(venue || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function buildVenueQuote(candle, venue, index, rules, strategyType, role = 'neutral', volumeContext = {}) {
  const venueType = inferVenueType(venue, strategyType);
  const chain = inferChain(venue, venueType);
  const hash = hashVenue(venue);
  const basePrice = Number(candle.close || candle.open || 1);
  const venueBiasPercent = ((hash % 29) - 14) / 100;
  const cycleBiasPercent = Math.sin((index + (hash % 13)) / 6) * 0.18;
  const opportunityPulsePercent = Math.max(
    0,
    Math.sin((index + (hash % 7)) / 9)
  ) * (rules.minimumSpreadPercent + 0.25);
  const roleBiasPercent = role === 'buy'
    ? -(rules.minimumSpreadPercent / 2) - 0.08
    : role === 'sell'
      ? (rules.minimumSpreadPercent / 2) + 0.08
      : 0;
  const price = basePrice * (1 + ((venueBiasPercent + cycleBiasPercent + opportunityPulsePercent + roleBiasPercent) / 100));
  const liquidityWave = 1 + Math.max(0, Math.cos((index + (hash % 17)) / 8)) * 0.9;
  const liquidityUsd = Math.max(
    rules.minimumLiquidity * 0.75,
    rules.minimumLiquidity * liquidityWave
  );
  const latencyMs = Math.max(
    25,
    Math.round((rules.maxExecutionLatencyMs * 0.35) + ((hash % 11) * 18) + (Math.sin(index / 5) * 35))
  );
  const candleVolumeUsd = Math.max(0, Number(candle.volume || 0) * basePrice);
  const venueVolumeMultiplier = venueType === 'cex' ? 1.2 : 0.82;
  const estimatedPairVolumeUsd = roundNumber(Math.max(
    candleVolumeUsd * venueVolumeMultiplier,
    Number(volumeContext.minimumObservedVolumeUsd || 0)
  ));
  const volumeRank = Math.max(
    1,
    Math.round(Number(volumeContext.marketRank || 50) + (venueType === 'dex' ? 12 : 0) + (hash % 9))
  );

  return {
    venue,
    venueType,
    chain,
    price: roundNumber(price, 8),
    makerFeePercent: rules.makerFeePercent,
    takerFeePercent: rules.takerFeePercent,
    feePercent: rules.estimatedFeePercent,
    slippagePercent: rules.slippageTolerancePercent,
    availableLiquidityUsd: roundNumber(liquidityUsd),
    liquidityScore: Math.max(1, Math.min(100, roundNumber((liquidityUsd / Math.max(1, rules.minimumLiquidity)) * 60))),
    latencyMs,
    estimatedPairVolumeUsd,
    volumeRank,
    volumePercentile: roundNumber(Number(volumeContext.volumePercentile || 0), 2)
  };
}

function resolveOrderRole(side, rules) {
  if (side === 'buy') {
    return 'taker';
  }

  return rules.simultaneousExecutionRequired ? 'taker' : 'maker';
}

function buildVenueExecution(quote, quantity, side, rules) {
  const orderRole = resolveOrderRole(side, rules);
  const feePercent = orderRole === 'maker'
    ? quote.makerFeePercent
    : quote.takerFeePercent;
  const notional = quote.price * quantity;
  const feeCost = notional * (feePercent / 100);
  const slippageCost = notional * (quote.slippagePercent / 100);
  const networkCost = quote.venueType === 'dex'
    ? Math.max(0.01, Math.min(25, notional * 0.00003))
    : 0;

  if (side === 'sell') {
    const proceeds = notional - feeCost - slippageCost - networkCost;

    return {
      ...quote,
      side,
      orderRole,
      feePercent,
      notional: roundNumber(notional),
      feeCost: roundNumber(feeCost),
      slippageCost: roundNumber(slippageCost),
      networkCost: roundNumber(networkCost),
      proceeds: roundNumber(proceeds),
      effectiveUnitPrice: roundNumber(proceeds / quantity, 8)
    };
  }

  const totalCost = notional + feeCost + slippageCost + networkCost;

  return {
    ...quote,
    side: 'buy',
    orderRole,
    feePercent,
    notional: roundNumber(notional),
    feeCost: roundNumber(feeCost),
    slippageCost: roundNumber(slippageCost),
    networkCost: roundNumber(networkCost),
    totalCost: roundNumber(totalCost),
    effectiveUnitPrice: roundNumber(totalCost / quantity, 8)
  };
}

function routeMatchesExecutionType(buyRoute, sellRoute, rules) {
  if (rules.arbitrageType === 'cex_cex') {
    return buyRoute.venueType === 'cex' && sellRoute.venueType === 'cex';
  }

  if (rules.arbitrageType === 'dex_dex') {
    return buyRoute.venueType === 'dex' && sellRoute.venueType === 'dex';
  }

  if (rules.arbitrageType === 'dex_cex') {
    return buyRoute.venueType !== sellRoute.venueType;
  }

  if (rules.arbitrageType === 'cross_chain') {
    return buyRoute.chain !== sellRoute.chain;
  }

  return true;
}

function buildVolumeContext(candles = [], index = 0, strategy = {}, rules = {}) {
  const volumes = candles.map(item => Math.max(0, Number(item.volume || 0) * Number(item.close || item.open || 0)));
  const currentVolume = volumes[index] || 0;
  const sortedVolumes = [...volumes].sort((left, right) => left - right);
  const belowOrEqual = sortedVolumes.filter(value => value <= currentVolume).length;
  const volumePercentile = sortedVolumes.length
    ? (belowOrEqual / sortedVolumes.length) * 100
    : 100;
  const explicitRank = Number(strategy.market_cap_rank || strategy.marketCapRank || rules.marketCapRank);
  const marketRank = Number.isFinite(explicitRank) && explicitRank > 0
    ? explicitRank
    : Math.max(1, Math.round(220 - (volumePercentile * 1.7)));

  return {
    currentVolumeUsd: roundNumber(currentVolume),
    minimumObservedVolumeUsd: roundNumber(sortedVolumes[0] || 0),
    volumePercentile: roundNumber(volumePercentile, 2),
    marketRank
  };
}

function evaluateTopVolumeFilter(buyQuote, sellQuote, volumeContext, rules) {
  const filter = rules.topVolumeFilter || {};

  if (!filter.enabled) {
    return {
      enabled: false,
      passed: true,
      reason: 'top_volume_filter_disabled',
      currentVolumeUsd: volumeContext.currentVolumeUsd,
      volumePercentile: volumeContext.volumePercentile,
      maxPairRank: filter.maxPairRank || null
    };
  }

  const pairRank = Math.min(buyQuote.volumeRank, sellQuote.volumeRank, volumeContext.marketRank || 9999);
  const venueVolumeUsd = Math.min(buyQuote.estimatedPairVolumeUsd, sellQuote.estimatedPairVolumeUsd);
  const currentVolumeUsd = Number(volumeContext.currentVolumeUsd || 0);
  const volumeUsd = Math.max(currentVolumeUsd, venueVolumeUsd);
  const failures = [
    ...(pairRank <= filter.maxPairRank ? [] : ['pair_rank_outside_top_volume_filter']),
    ...(volumeUsd >= filter.minimumVolumeUsd ? [] : ['minimum_volume_usd']),
    ...(Number(volumeContext.volumePercentile || 0) >= filter.percentileFloor ? [] : ['volume_percentile_floor'])
  ];

  return {
    enabled: true,
    passed: failures.length === 0,
    failures,
    pairRank,
    maxPairRank: filter.maxPairRank,
    currentVolumeUsd: roundNumber(currentVolumeUsd),
    venueVolumeUsd: roundNumber(venueVolumeUsd),
    minimumVolumeUsd: filter.minimumVolumeUsd,
    volumePercentile: roundNumber(volumeContext.volumePercentile || 0, 2),
    percentileFloor: filter.percentileFloor,
    reason: failures[0] || 'top_volume_pair_passed'
  };
}

function buildRouteComparison(candidate, index) {
  return {
    rank: index + 1,
    status: candidate.passed ? 'accepted' : 'rejected',
    buyVenue: candidate.buyRoute.venue,
    sellVenue: candidate.sellRoute.venue,
    buyVenueType: candidate.buyRoute.venueType,
    sellVenueType: candidate.sellRoute.venueType,
    buyChain: candidate.buyRoute.chain,
    sellChain: candidate.sellRoute.chain,
    buyPrice: candidate.buyRoute.price,
    sellPrice: candidate.sellRoute.price,
    grossSpreadPercent: candidate.grossSpreadPercent,
    totalEstimatedCostPercent: candidate.totalEstimatedCostPercent,
    projectedSpreadAfterLatencyPercent: candidate.projectedSpreadAfterLatencyPercent,
    netEdgePercent: candidate.netEdgePercent,
    projectedNetEdgeAfterLatencyPercent: candidate.projectedNetEdgeAfterLatencyPercent,
    estimatedNetProfit: candidate.netProfit,
    feeModel: candidate.feeModel,
    liquidityFloor: candidate.liquidityFloor,
    latencyMs: candidate.latencyMs,
    topVolumeFilter: candidate.topVolumeFilter,
    decisionReason: candidate.decisionReason,
    rejectionReasons: candidate.failures
  };
}

function evaluateArbitrageOpportunity(candle, index, strategy, rules, equity, context = {}) {
  const volumeContext = context.volumeContext || buildVolumeContext(context.candles || [], index, strategy, rules);
  const buyQuotes = rules.buyVenues.map(venue => buildVenueQuote(candle, venue, index, rules, strategy.strategy_type, 'buy', volumeContext));
  const sellQuotes = rules.sellVenues.map(venue => buildVenueQuote(candle, venue, index + 3, rules, strategy.strategy_type, 'sell', volumeContext));
  const candidates = [];

  for (const buyQuote of buyQuotes) {
    for (const sellQuote of sellQuotes) {
      if (rules.simultaneousExecutionRequired && buyQuote.venue === sellQuote.venue) {
        continue;
      }

      const maxNotional = Math.max(100, Math.min(
        equity * 0.1,
        buyQuote.availableLiquidityUsd * 0.05,
        sellQuote.availableLiquidityUsd * 0.05
      ));
      const quantity = maxNotional / Math.max(0.00000001, buyQuote.price);
      const buyRoute = buildVenueExecution(buyQuote, quantity, 'buy', rules);
      const sellRoute = buildVenueExecution(sellQuote, quantity, 'sell', rules);
      const grossSpreadPercent = ((sellQuote.price - buyQuote.price) / buyQuote.price) * 100;
      const netProfit = sellRoute.proceeds - buyRoute.totalCost;
      const netEdgePercent = (netProfit / buyRoute.totalCost) * 100;
      const liquidityFloor = Math.min(buyQuote.availableLiquidityUsd, sellQuote.availableLiquidityUsd);
      const liquidityUtilizationPercent = (buyRoute.totalCost / Math.max(1, liquidityFloor)) * 100;
      const latencyMs = Math.max(buyQuote.latencyMs, sellQuote.latencyMs);
      const latencyRatio = latencyMs / Math.max(1, rules.maxExecutionLatencyMs);
      const candleRangePercent = Number(candle.high) > 0
        ? ((Number(candle.high) - Number(candle.low)) / Number(candle.high)) * 100
        : 0;
      const collapsePenaltyPercent = Math.max(
        0,
        (latencyRatio * rules.slippageTolerancePercent * 1.8) + (candleRangePercent * 0.08)
      );
      const projectedSpreadAfterLatencyPercent = grossSpreadPercent - collapsePenaltyPercent;
      const projectedNetEdgeAfterLatencyPercent = netEdgePercent - collapsePenaltyPercent;
      const totalEstimatedCostPercent = (
        buyRoute.feePercent
        + sellRoute.feePercent
        + buyRoute.slippagePercent
        + sellRoute.slippagePercent
        + ((buyRoute.networkCost + sellRoute.networkCost) / Math.max(1, buyRoute.totalCost) * 100)
      );
      const topVolumeFilter = evaluateTopVolumeFilter(buyQuote, sellQuote, volumeContext, rules);
      const routeTypeOk = routeMatchesExecutionType(buyRoute, sellRoute, rules);
      const failures = [
        ...(grossSpreadPercent > totalEstimatedCostPercent ? [] : ['spread_not_above_total_cost']),
        ...(netEdgePercent >= rules.minimumSpreadPercent ? [] : ['minimum_spread']),
        ...(projectedNetEdgeAfterLatencyPercent > 0 && projectedSpreadAfterLatencyPercent > totalEstimatedCostPercent ? [] : ['spread_collapsed_before_execution']),
        ...(liquidityFloor >= rules.minimumLiquidity ? [] : ['minimum_liquidity']),
        ...(liquidityUtilizationPercent <= 25 ? [] : ['liquidity_utilization_too_high']),
        ...(latencyMs <= rules.maxExecutionLatencyMs ? [] : ['max_latency']),
        ...(topVolumeFilter.passed ? [] : ['top_volume_filter']),
        ...(routeTypeOk ? [] : ['arbitrage_type_route_mismatch'])
      ];
      const feeModel = {
        buyOrderRole: buyRoute.orderRole,
        sellOrderRole: sellRoute.orderRole,
        buyFeePercent: buyRoute.feePercent,
        sellFeePercent: sellRoute.feePercent,
        makerFeePercent: rules.makerFeePercent,
        takerFeePercent: rules.takerFeePercent
      };

      candidates.push({
        buyRoute,
        sellRoute,
        quantity: roundNumber(quantity, 8),
        notional: roundNumber(buyRoute.totalCost),
        grossSpreadPercent: roundNumber(grossSpreadPercent, 4),
        totalEstimatedCostPercent: roundNumber(totalEstimatedCostPercent, 4),
        projectedSpreadAfterLatencyPercent: roundNumber(projectedSpreadAfterLatencyPercent, 4),
        netProfit: roundNumber(netProfit),
        netEdgePercent: roundNumber(netEdgePercent, 4),
        projectedNetEdgeAfterLatencyPercent: roundNumber(projectedNetEdgeAfterLatencyPercent, 4),
        liquidityFloor: roundNumber(liquidityFloor),
        liquidityUtilizationPercent: roundNumber(liquidityUtilizationPercent, 4),
        latencyMs,
        collapsePenaltyPercent: roundNumber(collapsePenaltyPercent, 4),
        feeModel,
        topVolumeFilter,
        failures,
        passed: failures.length === 0,
        decisionReason: failures.length === 0
          ? 'accepted_net_spread_exceeds_costs_liquidity_latency_volume_passed'
          : `rejected_${failures[0]}`
      });
    }
  }

  candidates.sort((left, right) => (
    Number(right.passed) - Number(left.passed)
    || right.netEdgePercent - left.netEdgePercent
    || right.liquidityFloor - left.liquidityFloor
  ));

  return {
    best: candidates[0] || null,
    candidates: candidates.slice(0, 10),
    routeComparisons: candidates.slice(0, 10).map(buildRouteComparison),
    buyQuotes,
    sellQuotes,
    volumeContext,
    comparedExchangeCount: new Set([...rules.buyVenues, ...rules.sellVenues]).size
  };
}

function runArbitrageBacktest(strategy, candles, marketImport, options = {}) {
  if (candles.length < 2) {
    throw new Error('At least two candles are required to run an arbitrage paper simulation');
  }

  const rules = normalizeArbitrageStrategyRules(strategy.strategy_rules || {}, strategy.strategy_type);
  const normalizedCandles = candles.map(candle => ({
    timestamp: candle.timestamp,
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close),
    volume: Number(candle.volume)
  }));
  const initialCapital = getBacktestNumber(options.initialCapital, 10000, 1);
  let equity = initialCapital;
  const equityCurve = [initialCapital];
  const trades = [];
  const decisionLog = [];
  const rejectedReasons = {};
  const acceptedRouteComparisons = [];
  const rejectedRouteComparisons = [];
  const comparedVenues = new Set();

  for (let index = 0; index < normalizedCandles.length; index += 1) {
    const candle = normalizedCandles[index];
    const opportunity = evaluateArbitrageOpportunity(candle, index, strategy, rules, equity, {
      candles: normalizedCandles,
      volumeContext: buildVolumeContext(normalizedCandles, index, strategy, rules)
    });
    const best = opportunity.best;
    opportunity.buyQuotes.forEach(quote => comparedVenues.add(quote.venue));
    opportunity.sellQuotes.forEach(quote => comparedVenues.add(quote.venue));

    if (best?.passed) {
      equity += best.netProfit;
      equityCurve.push(equity);
      acceptedRouteComparisons.push(...opportunity.routeComparisons.filter(item => item.status === 'accepted').slice(0, 3));
      trades.push({
        entryAt: candle.timestamp,
        exitAt: candle.timestamp,
        buyVenue: best.buyRoute.venue,
        sellVenue: best.sellRoute.venue,
        buyVenueType: best.buyRoute.venueType,
        sellVenueType: best.sellRoute.venueType,
        buyChain: best.buyRoute.chain,
        sellChain: best.sellRoute.chain,
        entryPrice: best.buyRoute.price,
        exitPrice: best.sellRoute.price,
        quantity: best.quantity,
        notional: best.notional,
        grossSpreadPercent: best.grossSpreadPercent,
        totalEstimatedCostPercent: best.totalEstimatedCostPercent,
        projectedSpreadAfterLatencyPercent: best.projectedSpreadAfterLatencyPercent,
        netReturnPercent: best.netEdgePercent,
        projectedNetEdgeAfterLatencyPercent: best.projectedNetEdgeAfterLatencyPercent,
        pnl: best.netProfit,
        equityAfter: roundNumber(equity),
        exitReason: 'simultaneous_arbitrage_capture',
        decisionReason: best.decisionReason,
        latencyMs: best.latencyMs,
        liquidityFloor: best.liquidityFloor,
        liquidityUtilizationPercent: best.liquidityUtilizationPercent,
        feeModel: best.feeModel,
        topVolumeFilter: best.topVolumeFilter,
        candlesHeld: 0
      });
      decisionLog.push({
        candleIndex: index,
        timestamp: candle.timestamp,
        decision: 'arbitrage_execute',
        reason: best.decisionReason,
        price: best.buyRoute.price,
        positionOpen: false,
        payload: {
          buyVenue: best.buyRoute.venue,
          sellVenue: best.sellRoute.venue,
          buyVenueType: best.buyRoute.venueType,
          sellVenueType: best.sellRoute.venueType,
          grossSpreadPercent: best.grossSpreadPercent,
          totalEstimatedCostPercent: best.totalEstimatedCostPercent,
          netEdgePercent: best.netEdgePercent,
          projectedNetEdgeAfterLatencyPercent: best.projectedNetEdgeAfterLatencyPercent,
          estimatedNetProfit: best.netProfit,
          latencyMs: best.latencyMs,
          liquidityFloor: best.liquidityFloor,
          feeModel: best.feeModel,
          topVolumeFilter: best.topVolumeFilter,
          simultaneousExecutionRequired: rules.simultaneousExecutionRequired
        }
      });
    } else {
      const reason = best?.failures?.[0] || 'no_route';
      rejectedReasons[reason] = (rejectedReasons[reason] || 0) + 1;
      rejectedRouteComparisons.push(...opportunity.routeComparisons.filter(item => item.status === 'rejected').slice(0, 3));
      decisionLog.push({
        candleIndex: index,
        timestamp: candle.timestamp,
        decision: 'arbitrage_wait',
        reason,
        price: candle.close,
        positionOpen: false,
        payload: {
          bestCandidate: best
            ? {
              buyVenue: best.buyRoute.venue,
              sellVenue: best.sellRoute.venue,
              grossSpreadPercent: best.grossSpreadPercent,
              totalEstimatedCostPercent: best.totalEstimatedCostPercent,
              netEdgePercent: best.netEdgePercent,
              projectedNetEdgeAfterLatencyPercent: best.projectedNetEdgeAfterLatencyPercent,
              failures: best.failures
            }
            : null
        }
      });
    }

    if (decisionLog.length > 200) {
      decisionLog.shift();
    }
  }

  const winningTrades = trades.filter(trade => trade.pnl > 0);
  const losingTrades = trades.filter(trade => trade.pnl < 0);
  const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));
  const latestOpportunity = evaluateArbitrageOpportunity(
    normalizedCandles[normalizedCandles.length - 1],
    normalizedCandles.length - 1,
    strategy,
    rules,
    equity,
    {
      candles: normalizedCandles,
      volumeContext: buildVolumeContext(normalizedCandles, normalizedCandles.length - 1, strategy, rules)
    }
  );
  const allComparedRoutes = [
    ...latestOpportunity.routeComparisons,
    ...acceptedRouteComparisons.slice(-15),
    ...rejectedRouteComparisons.slice(-15)
  ];
  const uniqueComparedRoutes = allComparedRoutes.filter((route, index, list) => (
    index === list.findIndex(item => (
      item.buyVenue === route.buyVenue
      && item.sellVenue === route.sellVenue
      && item.grossSpreadPercent === route.grossSpreadPercent
      && item.status === route.status
    ))
  )).slice(0, 20);

  return {
    mode: 'arbitrage_backtest_v1',
    warning: 'Structured arbitrage paper simulation only. It compares local venue quote assumptions and does not fetch exchange data, place orders, sign wallets, bridge assets, or execute live arbitrage.',
    data: {
      importId: marketImport.id,
      marketSymbol: marketImport.market_symbol,
      timeframe: marketImport.timeframe,
      candleCount: normalizedCandles.length,
      firstTimestamp: normalizedCandles[0].timestamp,
      lastTimestamp: normalizedCandles[normalizedCandles.length - 1].timestamp
    },
    settings: {
      initialCapital: roundNumber(initialCapital),
      strategyType: strategy.strategy_type,
      arbitrageType: rules.arbitrageType,
      minimumSpreadPercent: rules.minimumSpreadPercent,
      estimatedFeePercent: rules.estimatedFeePercent,
      makerFeePercent: rules.makerFeePercent,
      takerFeePercent: rules.takerFeePercent,
      slippageTolerancePercent: rules.slippageTolerancePercent,
      minimumLiquidity: rules.minimumLiquidity,
      maxExecutionLatencyMs: rules.maxExecutionLatencyMs,
      simultaneousExecutionRequired: rules.simultaneousExecutionRequired,
      stablecoinPair: rules.stablecoinPair,
      tokenWhitelist: rules.tokenWhitelist,
      topVolumeFilter: rules.topVolumeFilter
    },
    parsedRules: {
      entry: {
        kind: 'structured_arbitrage_route',
        label: 'fee-aware multi-venue arbitrage route',
        rules
      },
      exit: {
        kind: 'simultaneous_buy_sell',
        label: 'buy and sell legs settle in the same paper decision'
      },
      warnings: [
        'This strategy uses structured arbitrage fields. The indicator parser is intentionally bypassed.',
        'Order books and venues are simulated from local assumptions until a future owner-approved live data adapter is built.'
      ]
    },
    routeModel: {
      buyVenues: rules.buyVenues,
      sellVenues: rules.sellVenues,
      comparedExchanges: [...comparedVenues],
      comparedExchangeCount: comparedVenues.size,
      latestBestCandidate: latestOpportunity.best,
      latestCandidateCount: latestOpportunity.candidates.length,
      latestRouteComparisons: latestOpportunity.routeComparisons,
      routeComparisons: uniqueComparedRoutes,
      rejectedReasons,
      exchangeSelection: {
        selectionLogic: 'best projected net edge after maker/taker fees, slippage, liquidity, latency collapse, route type, and top-volume filters',
        selectedRoute: latestOpportunity.best
          ? buildRouteComparison(latestOpportunity.best, 0)
          : null,
        noTradeWhen: [
          'gross spread does not exceed estimated fees, slippage, and DEX network costs',
          'projected spread collapses before simulated execution',
          'liquidity floor is below the configured minimum',
          'latency is above tolerance',
          'selected pair fails the top-volume filter',
          'route does not match DEX/CEX strategy type'
        ]
      },
      topVolumeFilter: {
        rules: rules.topVolumeFilter,
        latest: latestOpportunity.best?.topVolumeFilter || null,
        latestVolumeContext: latestOpportunity.volumeContext
      }
    },
    metrics: {
      finalEquity: roundNumber(equity),
      totalReturnPercent: roundNumber(((equity / initialCapital) - 1) * 100),
      tradeCount: trades.length,
      winRatePercent: trades.length ? roundNumber((winningTrades.length / trades.length) * 100) : 0,
      maxDrawdownPercent: calculateMaxDrawdownPercent(equityCurve),
      averageTradePercent: trades.length ? roundNumber(average(trades.map(trade => trade.netReturnPercent))) : 0,
      averageWinPercent: winningTrades.length ? roundNumber(average(winningTrades.map(trade => trade.netReturnPercent))) : 0,
      averageLossPercent: losingTrades.length ? roundNumber(average(losingTrades.map(trade => trade.netReturnPercent))) : 0,
      averageGrossSpreadPercent: trades.length ? roundNumber(average(trades.map(trade => trade.grossSpreadPercent))) : 0,
      averageProjectedNetEdgePercent: trades.length ? roundNumber(average(trades.map(trade => trade.projectedNetEdgeAfterLatencyPercent))) : 0,
      averageEstimatedNetProfit: trades.length ? roundNumber(average(trades.map(trade => trade.pnl))) : 0,
      averageLatencyMs: trades.length ? roundNumber(average(trades.map(trade => trade.latencyMs))) : 0,
      routesCompared: normalizedCandles.length * rules.buyVenues.length * rules.sellVenues.length,
      acceptedRouteCount: trades.length,
      rejectedRouteCounts: rejectedReasons,
      profitFactor: grossLoss > 0 ? roundNumber(grossProfit / grossLoss) : null,
      maxLossStreak: 0,
      exposurePercent: trades.length ? roundNumber((trades.length / normalizedCandles.length) * 100) : 0
    },
    trades: trades.slice(-100),
    decisionLog,
    decisionSummary: {
      totalDecisionCount: normalizedCandles.length,
      storedDecisionCount: decisionLog.length,
      counts: decisionLog.reduce((counts, item) => {
        counts[item.decision] = (counts[item.decision] || 0) + 1;
        return counts;
      }, {})
    },
    nextSteps: [
      'Replace local quote assumptions with owner-approved live market-data adapters only after security review.',
      'Stress test latency, slippage, venue outages, liquidity depth, and bridge delays before any future live phase.',
      'Keep simultaneous execution, wallet signing, and live order routing locked until a separate owner approval process exists.'
    ]
  };
}

function createArbitragePaperBotDecision(plan, strategy, riskProfile, marketImport, candles, readiness, options = {}) {
  if (candles.length < 2) {
    throw new Error('At least two candles are required to run an arbitrage paper bot cycle');
  }

  const normalizedCandles = candles.map(candle => ({
    timestamp: candle.timestamp,
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close),
    volume: Number(candle.volume)
  }));
  const latestIndex = normalizedCandles.length - 1;
  const latestCandle = normalizedCandles[latestIndex];
  const rules = normalizeArbitrageStrategyRules(strategy.strategy_rules || {}, strategy.strategy_type);
  const opportunity = evaluateArbitrageOpportunity(
    latestCandle,
    latestIndex,
    strategy,
    rules,
    getBacktestNumber(options.currentEquity, 10000, 1),
    {
      candles: normalizedCandles,
      volumeContext: buildVolumeContext(normalizedCandles, latestIndex, strategy, rules)
    }
  );
  const best = opportunity.best;
  const action = best?.passed ? 'arbitrage_execute' : 'wait';
  const reason = best?.passed ? 'net_spread_liquidity_latency_passed' : (best?.failures?.[0] || 'no_route');

  return {
    mode: 'arbitrage_paper_bot_decision_cycle_v1',
    warning: 'Paper-only arbitrage decision simulation. It does not place orders, fetch exchange data, store exchange secrets, bridge assets, sign wallets, or enable live execution.',
    plan: {
      id: plan.id,
      name: plan.name,
      mode: plan.mode,
      status: plan.status
    },
    strategy: {
      id: strategy.id,
      name: strategy.name,
      strategyType: strategy.strategy_type,
      marketSymbol: strategy.market_symbol,
      timeframe: strategy.timeframe
    },
    riskProfile: riskProfile
      ? {
        id: riskProfile.id,
        name: riskProfile.name,
        mode: riskProfile.mode,
        status: riskProfile.status,
        killSwitchEnabled: riskProfile.kill_switch_enabled,
        maxOrderValue: riskProfile.max_order_value,
        maxPositionValue: riskProfile.max_position_value,
        maxDailyLoss: riskProfile.max_daily_loss,
        maxOpenTrades: riskProfile.max_open_trades
      }
      : null,
    readiness,
    data: {
      importId: marketImport.id,
      marketSymbol: marketImport.market_symbol,
      timeframe: marketImport.timeframe,
      candleCount: normalizedCandles.length,
      firstTimestamp: normalizedCandles[0].timestamp,
      lastTimestamp: latestCandle.timestamp
    },
    parsedRules: {
      entry: {
        kind: 'structured_arbitrage_route',
        label: 'fee-aware multi-venue arbitrage route',
        rules
      },
      exit: {
        kind: 'simultaneous_buy_sell',
        label: 'same-cycle paper sell leg'
      },
      warnings: [
        'Indicator parser bypassed for structured arbitrage.',
        'Venue quotes are local assumptions until future owner-approved adapters exist.'
      ]
    },
    decision: {
      action,
      reason,
      timestamp: latestCandle.timestamp,
      candleIndex: latestIndex,
      price: best?.buyRoute?.price || roundNumber(latestCandle.close, 8),
      positionOpen: false,
      route: best,
      routeComparisons: opportunity.routeComparisons,
      exchangeSelection: {
        comparedExchanges: [...new Set([...rules.buyVenues, ...rules.sellVenues])],
        selectedRoute: best ? buildRouteComparison(best, 0) : null,
        selectionLogic: 'best projected net edge after maker/taker fees, slippage, liquidity, latency collapse, route type, and top-volume filters'
      },
      topVolumeFilter: {
        rules: rules.topVolumeFilter,
        latest: best?.topVolumeFilter || null,
        latestVolumeContext: opportunity.volumeContext
      },
      candidateCount: opportunity.candidates.length,
      simultaneousExecutionRequired: rules.simultaneousExecutionRequired
    },
    liveExecution: {
      enabled: false,
      walletSigningEnabled: false,
      networkCallsEnabled: false,
      note: 'No order was placed. This run only records the simulated local arbitrage decision.'
    },
    nextSteps: [
      'Review the candidate route, spread, fees, slippage, liquidity, and latency.',
      'Use real historical venue data later through owner-approved data adapters.',
      'Keep live execution disabled until separate security, wallet, order-routing, and kill-switch approvals are complete.'
    ]
  };
}

module.exports = {
  ARBITRAGE_STRATEGY_TYPES,
  ARBITRAGE_EXECUTION_TYPES,
  isArbitrageStrategyType,
  normalizeArbitrageStrategyRules,
  buildArbitrageRuleSummary,
  runArbitrageBacktest,
  createArbitragePaperBotDecision,
  evaluateArbitrageOpportunity
};
