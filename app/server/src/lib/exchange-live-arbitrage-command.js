const PHASE4_SUPPORTED_VENUES = [
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

const PHASE4_STATUS = {
  SAFE: 'Safe',
  WARNING: 'Warning',
  UNSAFE: 'Unsafe',
  EXCHANGE_DEGRADED: 'Exchange degraded',
  OPPORTUNITY_EXPIRED: 'Opportunity expired',
  SPREAD_COLLAPSED: 'Spread collapsed',
  LIQUIDITY_INSUFFICIENT: 'Liquidity insufficient'
};

const DEFAULT_PHASE4_RISK_POLICY = {
  globalKillSwitchEnabled: true,
  multiExchangeLiveExecutionEnabled: false,
  unrestrictedAutonomousScalingEnabled: false,
  leverageEnabled: false,
  marginEnabled: false,
  futuresEnabled: false,
  withdrawalsEnabled: false,
  walletSigningEnabled: false,
  maxCapitalPerExchangeUsd: 250,
  maxCapitalPerStrategyUsd: 500,
  maxDailyLossUsd: 25,
  minNetSpreadPercent: 0.08,
  maxSlippagePercent: 0.15,
  maxLatencyMs: 1500,
  maxPriceAgeMs: 2500,
  minLiquidityUsd: 1000,
  maxRetryAttempts: 1,
  partialFillRecoveryEnabled: true,
  failedLegRecoveryEnabled: true,
  requireExchangeHealthSafe: true,
  requireInventoryOnBothVenues: true
};

const VENUE_BASELINE_PROFILES = {
  binance: { priority: 1, reliability: 94, fallbackLatencyMs: 120, takerFeePercent: 0.1, stablecoins: ['USDT', 'USDC', 'FDUSD'] },
  coinbase: { priority: 2, reliability: 91, fallbackLatencyMs: 180, takerFeePercent: 0.12, stablecoins: ['USD', 'USDC'] },
  kraken: { priority: 3, reliability: 90, fallbackLatencyMs: 220, takerFeePercent: 0.16, stablecoins: ['USD', 'USDT', 'USDC'] },
  okx: { priority: 4, reliability: 89, fallbackLatencyMs: 170, takerFeePercent: 0.1, stablecoins: ['USDT', 'USDC'] },
  bybit: { priority: 5, reliability: 88, fallbackLatencyMs: 160, takerFeePercent: 0.1, stablecoins: ['USDT', 'USDC'] },
  kucoin: { priority: 6, reliability: 82, fallbackLatencyMs: 260, takerFeePercent: 0.1, stablecoins: ['USDT', 'USDC'] },
  'gate-io': { priority: 7, reliability: 80, fallbackLatencyMs: 300, takerFeePercent: 0.2, stablecoins: ['USDT', 'USDC'] },
  mexc: { priority: 8, reliability: 78, fallbackLatencyMs: 320, takerFeePercent: 0.2, stablecoins: ['USDT', 'USDC'] },
  bitget: { priority: 9, reliability: 80, fallbackLatencyMs: 260, takerFeePercent: 0.1, stablecoins: ['USDT', 'USDC'] },
  bitstamp: { priority: 10, reliability: 84, fallbackLatencyMs: 300, takerFeePercent: 0.3, stablecoins: ['USD', 'USDC'] },
  gemini: { priority: 11, reliability: 82, fallbackLatencyMs: 320, takerFeePercent: 0.35, stablecoins: ['USD', 'GUSD'] },
  'crypto-com-us': { priority: 12, reliability: 76, fallbackLatencyMs: 360, takerFeePercent: 0.25, stablecoins: ['USD', 'USDC'] },
  hyperliquid: { priority: 13, reliability: 86, fallbackLatencyMs: 140, takerFeePercent: 0.045, stablecoins: ['USDC'] }
};

const NETWORK_COST_BASELINES = {
  ethereum: { chain: 'Ethereum', stablecoinCostUsd: 9.5, transferTimeMinutes: 12, risk: 'high_fee_variable' },
  polygon: { chain: 'Polygon', stablecoinCostUsd: 0.04, transferTimeMinutes: 3, risk: 'low_fee_bridge_risk' },
  base: { chain: 'Base', stablecoinCostUsd: 0.08, transferTimeMinutes: 5, risk: 'low_fee_bridge_risk' },
  arbitrum: { chain: 'Arbitrum', stablecoinCostUsd: 0.12, transferTimeMinutes: 6, risk: 'low_fee_bridge_risk' },
  avalanche: { chain: 'Avalanche', stablecoinCostUsd: 0.18, transferTimeMinutes: 4, risk: 'low_fee_c_chain' },
  bnb: { chain: 'BNB Chain', stablecoinCostUsd: 0.15, transferTimeMinutes: 4, risk: 'centralized_validator_review' },
  solana: { chain: 'Solana', stablecoinCostUsd: 0.01, transferTimeMinutes: 2, risk: 'wallet_signing_locked' }
};

function normalizeVenueName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/_/g, '-');
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function createPhase4SafetyBoundary() {
  return {
    phase: 'phase4_multi_exchange_controlled_arbitrage',
    marketDataOnlyForNewRoutes: true,
    multiExchangeLiveExecutionEnabled: false,
    unrestrictedAutonomousScalingEnabled: false,
    leverageEnabled: false,
    marginEnabled: false,
    futuresEnabled: false,
    withdrawalsEnabled: false,
    walletSigningEnabled: false,
    orderEndpointEnabledForPhase4: false,
    usesExistingTinyLiveGateOnly: true
  };
}

function normalizePhase4Options(options = {}) {
  return {
    symbol: String(options.symbol || 'BTC/USDT').trim().toUpperCase().replace('-', '/'),
    strategyId: String(options.strategyId || 'phase4-controlled-arbitrage').slice(0, 80),
    orderSizeUsd: Math.max(1, toFiniteNumber(options.orderSizeUsd, 100)),
    minNetSpreadPercent: Math.max(0, toFiniteNumber(options.minNetSpreadPercent, DEFAULT_PHASE4_RISK_POLICY.minNetSpreadPercent)),
    minLiquidityUsd: Math.max(0, toFiniteNumber(options.minLiquidityUsd, DEFAULT_PHASE4_RISK_POLICY.minLiquidityUsd)),
    maxLatencyMs: Math.max(100, toFiniteNumber(options.maxLatencyMs, DEFAULT_PHASE4_RISK_POLICY.maxLatencyMs)),
    maxSlippagePercent: Math.max(0, toFiniteNumber(options.maxSlippagePercent, DEFAULT_PHASE4_RISK_POLICY.maxSlippagePercent)),
    maxCapitalPerExchangeUsd: Math.max(0, toFiniteNumber(options.maxCapitalPerExchangeUsd, DEFAULT_PHASE4_RISK_POLICY.maxCapitalPerExchangeUsd)),
    maxCapitalPerStrategyUsd: Math.max(0, toFiniteNumber(options.maxCapitalPerStrategyUsd, DEFAULT_PHASE4_RISK_POLICY.maxCapitalPerStrategyUsd)),
    quoteAsset: String(options.quoteAsset || 'USDT').trim().toUpperCase()
  };
}

function connectorMap(connectors = []) {
  return connectors.reduce((acc, connector) => {
    const venue = normalizeVenueName(connector.settings?.registryId || connector.exchange_name);
    if (!acc[venue]) acc[venue] = connector;
    return acc;
  }, {});
}

function getReadOnlySnapshotMap(scan = {}) {
  const snapshots = {};
  const rows = Array.isArray(scan?.snapshots) ? scan.snapshots : [];

  for (const row of rows) {
    const snapshot = row.snapshot || row;
    const exchangeName = normalizeVenueName(snapshot.exchangeName || row.exchangeName);
    if (exchangeName && (row.status === 'ok' || snapshot.bid || snapshot.ask)) {
      snapshots[exchangeName] = snapshot;
    }
  }

  return snapshots;
}

function getAccountProfileMap(accountScan = {}) {
  const profiles = Array.isArray(accountScan?.profiles) ? accountScan.profiles : [];
  return profiles.reduce((acc, profile) => {
    acc[normalizeVenueName(profile.exchangeName)] = profile;
    return acc;
  }, {});
}

function scoreVenue({ venue, connector = null, snapshot = null, accountProfile = null, policy = DEFAULT_PHASE4_RISK_POLICY } = {}) {
  const baseline = VENUE_BASELINE_PROFILES[venue] || { priority: 99, reliability: 65, fallbackLatencyMs: 500, takerFeePercent: 0.2, stablecoins: ['USDT', 'USDC'] };
  const latencyMs = toFiniteNumber(snapshot?.latencyMs, baseline.fallbackLatencyMs);
  const takerFeePercent = toFiniteNumber(accountProfile?.feeTier?.takerFeePercent, toFiniteNumber(snapshot?.takerFeePercent, baseline.takerFeePercent));
  const bid = toFiniteNumber(snapshot?.bid, 0);
  const ask = toFiniteNumber(snapshot?.ask, 0);
  const liquidityUsd = toFiniteNumber(snapshot?.topAskLiquidityUsd || snapshot?.topBidLiquidityUsd || snapshot?.quoteVolume24h, 0);
  const connected = Boolean(connector);
  const authenticated = accountProfile?.status === 'read_only_account_connected'
    || accountProfile?.phase3AStatus === 'Authenticated Read-Only'
    || accountProfile?.phase3AStatus === 'Trading Permission Present But Locked';
  const healthStatus = !snapshot && !connected
    ? PHASE4_STATUS.UNSAFE
    : latencyMs > policy.maxLatencyMs
      ? PHASE4_STATUS.EXCHANGE_DEGRADED
      : liquidityUsd > 0 && liquidityUsd < policy.minLiquidityUsd
        ? PHASE4_STATUS.LIQUIDITY_INSUFFICIENT
        : PHASE4_STATUS.SAFE;
  const latencyScore = clampScore(100 - (latencyMs / policy.maxLatencyMs) * 45);
  const feeScore = clampScore(100 - takerFeePercent * 220);
  const liquidityScore = liquidityUsd > 0
    ? clampScore(Math.min(100, (liquidityUsd / Math.max(policy.minLiquidityUsd, 1)) * 45))
    : 35;
  const reliabilityScore = clampScore(baseline.reliability + (authenticated ? 4 : 0) + (connected ? 2 : 0));
  const slippageScore = liquidityUsd > policy.minLiquidityUsd * 20 ? 96 : liquidityUsd > policy.minLiquidityUsd ? 78 : 42;
  const totalScore = clampScore(
    latencyScore * 0.22
      + feeScore * 0.2
      + liquidityScore * 0.22
      + slippageScore * 0.16
      + reliabilityScore * 0.2
  );

  return {
    venue,
    displayName: snapshot?.displayName || connector?.settings?.displayName || venue,
    priority: baseline.priority,
    connected,
    authenticatedReadOnly: authenticated,
    bid,
    ask,
    latencyMs,
    takerFeePercent,
    liquidityUsd,
    stablecoins: baseline.stablecoins,
    status: healthStatus,
    scores: {
      latency: latencyScore,
      fees: feeScore,
      liquidity: liquidityScore,
      slippage: slippageScore,
      fillReliability: reliabilityScore,
      total: totalScore
    },
    warnings: [
      connected ? null : 'connector placeholder missing',
      authenticated ? null : 'authenticated read-only account not verified',
      latencyMs <= policy.maxLatencyMs ? null : 'latency above threshold',
      liquidityUsd >= policy.minLiquidityUsd || liquidityUsd === 0 ? null : 'visible liquidity below threshold'
    ].filter(Boolean)
  };
}

function buildVenueScores({ connectors = [], scan = {}, accountScan = {}, policy = DEFAULT_PHASE4_RISK_POLICY } = {}) {
  const connectorsByVenue = connectorMap(connectors);
  const snapshotsByVenue = getReadOnlySnapshotMap(scan);
  const accountsByVenue = getAccountProfileMap(accountScan);
  const venues = Array.from(new Set([
    ...PHASE4_SUPPORTED_VENUES,
    ...Object.keys(connectorsByVenue),
    ...Object.keys(snapshotsByVenue),
    ...Object.keys(accountsByVenue)
  ]));

  return venues
    .map(venue => scoreVenue({
      venue,
      connector: connectorsByVenue[venue] || null,
      snapshot: snapshotsByVenue[venue] || null,
      accountProfile: accountsByVenue[venue] || null,
      policy
    }))
    .sort((a, b) => a.priority - b.priority || b.scores.total - a.scores.total);
}

function buildSpreadHeatmap({ scan = {}, venueScores = [], policy = DEFAULT_PHASE4_RISK_POLICY } = {}) {
  const scoreMap = new Map(venueScores.map(score => [score.venue, score]));
  const candidates = Array.isArray(scan.candidates) ? scan.candidates : [];

  return candidates.slice(0, 24).map(candidate => {
    const buyVenue = normalizeVenueName(candidate.buyExchangeName || candidate.buyVenue);
    const sellVenue = normalizeVenueName(candidate.sellExchangeName || candidate.sellVenue);
    const buyScore = scoreMap.get(buyVenue);
    const sellScore = scoreMap.get(sellVenue);
    const net = toFiniteNumber(candidate.estimatedAccountAwareNetProfitPercent ?? candidate.estimatedNetProfitPercent, 0);
    const liquidity = toFiniteNumber(candidate.limitingLiquidityUsd, 0);
    const latency = toFiniteNumber(candidate.latencyMs, 99999);
    const status = net < 0
      ? PHASE4_STATUS.SPREAD_COLLAPSED
      : net < policy.minNetSpreadPercent
        ? PHASE4_STATUS.OPPORTUNITY_EXPIRED
        : liquidity > 0 && liquidity < policy.minLiquidityUsd
          ? PHASE4_STATUS.LIQUIDITY_INSUFFICIENT
          : latency > policy.maxLatencyMs
            ? PHASE4_STATUS.EXCHANGE_DEGRADED
            : (buyScore?.status === PHASE4_STATUS.SAFE && sellScore?.status === PHASE4_STATUS.SAFE)
              ? PHASE4_STATUS.SAFE
              : PHASE4_STATUS.WARNING;

    return {
      id: candidate.id || `${buyVenue}_to_${sellVenue}`,
      route: `${candidate.buyVenue || buyVenue} -> ${candidate.sellVenue || sellVenue}`,
      buyVenue,
      sellVenue,
      symbol: candidate.symbol || scan.symbol,
      grossSpreadPercent: toFiniteNumber(candidate.grossSpreadPercent, 0),
      estimatedNetProfitPercent: net,
      totalEstimatedCostPercent: toFiniteNumber(candidate.totalEstimatedCostPercent, 0),
      liquidityUsd: liquidity,
      latencyMs: latency,
      status,
      buyVenueScore: buyScore?.scores?.total || 0,
      sellVenueScore: sellScore?.scores?.total || 0
    };
  });
}

function rankArbitrageOpportunities({ scan = {}, venueScores = [], policy = DEFAULT_PHASE4_RISK_POLICY } = {}) {
  const scoreMap = new Map(venueScores.map(score => [score.venue, score]));
  const candidates = Array.isArray(scan.candidates) ? scan.candidates : [];

  return candidates.map(candidate => {
    const buyVenue = normalizeVenueName(candidate.buyExchangeName || candidate.buyVenue);
    const sellVenue = normalizeVenueName(candidate.sellExchangeName || candidate.sellVenue);
    const buyScore = scoreMap.get(buyVenue);
    const sellScore = scoreMap.get(sellVenue);
    const net = toFiniteNumber(candidate.estimatedAccountAwareNetProfitPercent ?? candidate.estimatedNetProfitPercent, 0);
    const liquidity = toFiniteNumber(candidate.limitingLiquidityUsd, 0);
    const latency = toFiniteNumber(candidate.latencyMs, 99999);
    const routeScore = clampScore(
      net * 180
        + Math.min(30, liquidity / Math.max(policy.minLiquidityUsd, 1) * 8)
        + ((buyScore?.scores?.total || 0) + (sellScore?.scores?.total || 0)) * 0.28
        - Math.max(0, latency - policy.maxLatencyMs) / 50
    );
    const failures = [
      net >= policy.minNetSpreadPercent ? null : 'spread minimum not met',
      liquidity >= policy.minLiquidityUsd ? null : 'liquidity insufficient',
      latency <= policy.maxLatencyMs ? null : 'latency too high',
      buyScore?.status === PHASE4_STATUS.SAFE ? null : 'buy venue health needs review',
      sellScore?.status === PHASE4_STATUS.SAFE ? null : 'sell venue health needs review'
    ].filter(Boolean);

    return {
      ...candidate,
      routeId: `${buyVenue}_to_${sellVenue}_${candidate.symbol || scan.symbol || 'market'}`,
      buyVenue,
      sellVenue,
      routeScore,
      confidenceScore: clampScore(routeScore),
      safetyStatus: failures.length ? PHASE4_STATUS.WARNING : PHASE4_STATUS.SAFE,
      failures,
      operatorSummary: failures.length
        ? `Review before use: ${failures.join(', ')}.`
        : `Highest-ranked controlled arbitrage route. Multi-leg live execution remains locked until future approval.`,
      executionAllowed: false
    };
  }).sort((a, b) => b.routeScore - a.routeScore);
}

function extractBalances(profile = {}) {
  if (!profile) return [];
  if (Array.isArray(profile.balances?.assets)) return profile.balances.assets;
  if (Array.isArray(profile.balances?.nonZeroBalances)) return profile.balances.nonZeroBalances;
  if (Array.isArray(profile.nonZeroBalances)) return profile.nonZeroBalances;
  return [];
}

function buildCrossExchangeInventory({ accountScan = {}, venueScores = [], options = {} } = {}) {
  const quoteAsset = String(options.quoteAsset || 'USDT').toUpperCase();
  const stablecoinSet = new Set(['USD', 'USDT', 'USDC', 'FDUSD', 'DAI', 'GUSD']);
  const rows = venueScores.map(score => {
    const profile = getAccountProfileMap(accountScan)[score.venue] || null;
    const balances = extractBalances(profile);
    const stableBalances = balances.filter(balance => stablecoinSet.has(String(balance.asset || balance.currency || '').toUpperCase()));
    const stableUsd = stableBalances.reduce((sum, balance) => (
      sum + toFiniteNumber(balance.usdValue ?? balance.valueUsd ?? balance.totalUsd ?? balance.free ?? balance.available, 0)
    ), 0);

    return {
      venue: score.venue,
      displayName: score.displayName,
      authenticatedReadOnly: score.authenticatedReadOnly,
      quoteAsset,
      stablecoinUsd: stableUsd,
      stablecoinAssets: stableBalances.map(balance => String(balance.asset || balance.currency || '').toUpperCase()),
      inventoryStatus: stableUsd <= 0
        ? PHASE4_STATUS.WARNING
        : stableUsd < toFiniteNumber(options.orderSizeUsd, 100)
          ? PHASE4_STATUS.WARNING
          : PHASE4_STATUS.SAFE,
      note: stableUsd <= 0
        ? 'No stablecoin inventory visible through read-only account scan.'
        : 'Stablecoin inventory visible through read-only account scan.'
    };
  });
  const visibleStableUsd = rows.reduce((sum, row) => sum + row.stablecoinUsd, 0);
  const connectedRows = rows.filter(row => row.authenticatedReadOnly);
  const average = connectedRows.length ? visibleStableUsd / connectedRows.length : 0;
  const imbalanceWarnings = rows
    .filter(row => row.authenticatedReadOnly && average > 0 && Math.abs(row.stablecoinUsd - average) / average > 0.5)
    .map(row => `${row.displayName} stablecoin inventory is materially imbalanced versus connected venues.`);

  return {
    status: connectedRows.length ? PHASE4_STATUS.WARNING : PHASE4_STATUS.WARNING,
    visibleStableUsd,
    rows,
    imbalanceWarnings: [
      connectedRows.length >= 2 ? null : 'Connect at least two authenticated read-only exchange accounts for reliable cross-exchange balance tracking.',
      ...imbalanceWarnings
    ].filter(Boolean)
  };
}

function buildCapitalAllocation({ venueScores = [], inventory = {}, policy = DEFAULT_PHASE4_RISK_POLICY, options = {} } = {}) {
  const orderSizeUsd = toFiniteNumber(options.orderSizeUsd, 100);
  const eligible = venueScores
    .filter(score => score.status === PHASE4_STATUS.SAFE || score.status === PHASE4_STATUS.WARNING)
    .slice(0, 5);
  const totalScore = eligible.reduce((sum, score) => sum + Math.max(score.scores.total, 1), 0) || 1;
  const maxStrategyCapital = Math.min(toFiniteNumber(options.maxCapitalPerStrategyUsd, policy.maxCapitalPerStrategyUsd), policy.maxCapitalPerStrategyUsd);

  return {
    status: policy.globalKillSwitchEnabled ? 'planning_only_global_kill_switch_on' : 'planning_only',
    maxCapitalPerExchangeUsd: Math.min(toFiniteNumber(options.maxCapitalPerExchangeUsd, policy.maxCapitalPerExchangeUsd), policy.maxCapitalPerExchangeUsd),
    maxCapitalPerStrategyUsd: maxStrategyCapital,
    orderSizeUsd,
    allocations: eligible.map(score => {
      const suggested = Math.min(
        policy.maxCapitalPerExchangeUsd,
        maxStrategyCapital * (Math.max(score.scores.total, 1) / totalScore)
      );
      return {
        venue: score.venue,
        displayName: score.displayName,
        suggestedCapitalUsd: Number(suggested.toFixed(2)),
        reason: `Weighted by venue score ${score.scores.total}, latency ${score.latencyMs}ms, fee ${score.takerFeePercent}%.`,
        liveDeploymentEnabled: false
      };
    }),
    warnings: [
      inventory.imbalanceWarnings?.length ? 'Inventory imbalance exists; review before any future multi-leg execution.' : null,
      'Capital allocation is advisory only. It does not move funds or enable withdrawals.'
    ].filter(Boolean)
  };
}

function estimateTransferAndNetworkCosts({ opportunities = [], options = {} } = {}) {
  const orderSizeUsd = toFiniteNumber(options.orderSizeUsd, 100);
  const chains = Object.values(NETWORK_COST_BASELINES).map(chain => ({
    ...chain,
    estimatedCostPercent: orderSizeUsd > 0 ? (chain.stablecoinCostUsd / orderSizeUsd) * 100 : null,
    usableNow: false,
    reason: 'Transfers, withdrawals, bridges, and wallet signing remain disabled. This is cost modeling only.'
  }));

  return {
    transferCostModel: opportunities.slice(0, 10).map(opportunity => ({
      routeId: opportunity.routeId,
      buyVenue: opportunity.buyVenue,
      sellVenue: opportunity.sellVenue,
      sameCycleTransferAllowed: false,
      estimatedTransferTimeMinutes: null,
      estimatedTransferCostUsd: null,
      note: 'Same-cycle cross-exchange arbitrage requires pre-positioned inventory. Withdrawals/transfers are disabled.'
    })),
    crossChainCostModel: chains,
    stablecoinInventoryPolicy: 'Maintain pre-positioned stablecoin inventory on each approved venue. Do not rely on withdrawals or bridges during a trade.'
  };
}

function buildRecoveryAndOrchestration({ opportunities = [], policy = DEFAULT_PHASE4_RISK_POLICY } = {}) {
  const best = opportunities[0] || null;

  return {
    status: best ? 'orchestration_plan_ready_locked' : 'waiting_for_ranked_opportunity',
    simultaneousExecution: {
      required: true,
      enabled: false,
      note: 'The orchestration planner is built, but multi-leg live execution is locked. Use sandbox/tiny-live evidence before future enablement.',
      plannedRoute: best ? `${best.buyVenue} -> ${best.sellVenue}` : null
    },
    partialFillRecovery: {
      enabledForPlanning: policy.partialFillRecoveryEnabled,
      actions: [
        'Freeze additional entries for the route.',
        'Cancel remaining unfilled quantity when supported.',
        'Hedge residual exposure only through future owner-approved tiny/manual controls.',
        'Record reconciliation evidence before retry.'
      ]
    },
    failedLegRecovery: {
      enabledForPlanning: policy.failedLegRecoveryEnabled,
      actions: [
        'Stop the second leg if the first leg rejects before acceptance.',
        'If one leg fills and the other fails, block automation and require manual owner review.',
        'Prefer inventory rebalance suggestions over immediate live retry.',
        'Escalate to emergency controls if exchange status is degraded.'
      ]
    },
    orderRetryLogic: {
      maxAttempts: policy.maxRetryAttempts,
      enabledForPlanning: true,
      rules: [
        'Never retry if spread collapsed.',
        'Never retry if liquidity is insufficient.',
        'Never retry if stale price or rate limit is detected.',
        'Require a new preview before any future live retry.'
      ]
    },
    outageHandling: {
      exchangeOutage: 'Mark venue Exchange degraded, remove from queue, and stop new route creation.',
      rateLimit: 'Back off, reduce polling, preserve existing order state, and require fresh market data before retry.',
      websocketReconnect: 'Reconnect with exponential backoff; if stale beyond threshold, mark all dependent opportunities expired.'
    }
  };
}

function buildRiskDashboard({ venueScores = [], opportunities = [], policy = DEFAULT_PHASE4_RISK_POLICY } = {}) {
  const unsafeVenues = venueScores.filter(score => score.status === PHASE4_STATUS.UNSAFE || score.status === PHASE4_STATUS.EXCHANGE_DEGRADED);
  const unsafeOpportunities = opportunities.filter(opportunity => opportunity.safetyStatus !== PHASE4_STATUS.SAFE);
  const safeOpportunities = opportunities.filter(opportunity => opportunity.safetyStatus === PHASE4_STATUS.SAFE);

  return {
    status: policy.globalKillSwitchEnabled ? PHASE4_STATUS.WARNING : PHASE4_STATUS.SAFE,
    globalKillSwitch: policy.globalKillSwitchEnabled ? 'on' : 'off',
    perExchangeKillSwitches: venueScores.map(score => ({
      venue: score.venue,
      displayName: score.displayName,
      status: score.status,
      killSwitchRecommended: score.status !== PHASE4_STATUS.SAFE,
      reason: score.warnings[0] || 'Venue is healthy for monitoring.'
    })),
    limits: {
      maxCapitalPerExchangeUsd: policy.maxCapitalPerExchangeUsd,
      maxCapitalPerStrategyUsd: policy.maxCapitalPerStrategyUsd,
      maxDailyLossUsd: policy.maxDailyLossUsd,
      minNetSpreadPercent: policy.minNetSpreadPercent,
      maxSlippagePercent: policy.maxSlippagePercent,
      maxLatencyMs: policy.maxLatencyMs,
      minLiquidityUsd: policy.minLiquidityUsd
    },
    counts: {
      safeOpportunities: safeOpportunities.length,
      warningOrUnsafeOpportunities: unsafeOpportunities.length,
      degradedVenues: unsafeVenues.length
    },
    safetyBoundary: createPhase4SafetyBoundary()
  };
}

function buildLiveArbitrageCommandCenter({
  connectors = [],
  scan = null,
  accountScan = null,
  phase3B = null,
  phase3C = null,
  websocketPlan = null,
  options = {},
  policy = {}
} = {}) {
  const normalizedOptions = normalizePhase4Options(options);
  const effectivePolicy = {
    ...DEFAULT_PHASE4_RISK_POLICY,
    ...(policy || {}),
    maxCapitalPerExchangeUsd: Math.min(
      toFiniteNumber(policy.maxCapitalPerExchangeUsd ?? normalizedOptions.maxCapitalPerExchangeUsd, DEFAULT_PHASE4_RISK_POLICY.maxCapitalPerExchangeUsd),
      DEFAULT_PHASE4_RISK_POLICY.maxCapitalPerExchangeUsd
    ),
    maxCapitalPerStrategyUsd: Math.min(
      toFiniteNumber(policy.maxCapitalPerStrategyUsd ?? normalizedOptions.maxCapitalPerStrategyUsd, DEFAULT_PHASE4_RISK_POLICY.maxCapitalPerStrategyUsd),
      DEFAULT_PHASE4_RISK_POLICY.maxCapitalPerStrategyUsd
    ),
    minNetSpreadPercent: normalizedOptions.minNetSpreadPercent,
    minLiquidityUsd: normalizedOptions.minLiquidityUsd,
    maxLatencyMs: normalizedOptions.maxLatencyMs,
    maxSlippagePercent: normalizedOptions.maxSlippagePercent
  };
  const venueScores = buildVenueScores({ connectors, scan, accountScan, policy: effectivePolicy });
  const spreadHeatmap = buildSpreadHeatmap({ scan, venueScores, policy: effectivePolicy });
  const opportunities = rankArbitrageOpportunities({ scan, venueScores, policy: effectivePolicy });
  const inventory = buildCrossExchangeInventory({ accountScan, venueScores, options: normalizedOptions });
  const capitalAllocation = buildCapitalAllocation({ venueScores, inventory, policy: effectivePolicy, options: normalizedOptions });
  const transferCosts = estimateTransferAndNetworkCosts({ opportunities, options: normalizedOptions });
  const orchestration = buildRecoveryAndOrchestration({ opportunities, policy: effectivePolicy });
  const riskDashboard = buildRiskDashboard({ venueScores, opportunities, policy: effectivePolicy });
  const exchangeHealth = venueScores.map(score => ({
    venue: score.venue,
    displayName: score.displayName,
    status: score.status,
    latencyMs: score.latencyMs,
    feePercent: score.takerFeePercent,
    liquidityUsd: score.liquidityUsd,
    score: score.scores.total,
    websocketStatus: websocketPlan?.health?.find(item => normalizeVenueName(item.exchangeName) === score.venue)?.status || 'spec_ready_not_running',
    rateLimitStatus: score.status === PHASE4_STATUS.EXCHANGE_DEGRADED ? 'backoff_recommended' : 'normal',
    outageHandling: score.status === PHASE4_STATUS.EXCHANGE_DEGRADED ? 'remove_from_opportunity_queue' : 'monitor'
  }));
  const readyForFutureControlledExpansion = opportunities.some(item => item.safetyStatus === PHASE4_STATUS.SAFE)
    && inventory.rows.filter(row => row.authenticatedReadOnly).length >= 2
    && phase3B?.status
    && phase3C?.status;

  return {
    title: 'Live Arbitrage Command Center',
    phase: 'Phase 4: Multi-Exchange Controlled Arbitrage Expansion',
    status: 'planning_and_monitoring_only',
    plainEnglishStatus: 'Multi-exchange arbitrage intelligence is available. Multi-leg live execution remains locked until future owner approval.',
    readyForFutureControlledExpansion: Boolean(readyForFutureControlledExpansion),
    nextRecommendedAction: opportunities.length
      ? 'Review the top opportunity, venue health, inventory imbalance warnings, and risk dashboard before any future controlled execution approval.'
      : 'Run a read-only spread scan to populate the Phase 4 opportunity queue.',
    options: normalizedOptions,
    policy: effectivePolicy,
    exchangePriority: venueScores.map(score => ({
      venue: score.venue,
      displayName: score.displayName,
      priority: score.priority,
      score: score.scores.total,
      status: score.status
    })),
    venueScores,
    spreadHeatmap,
    opportunityQueue: opportunities.slice(0, 20),
    exchangeHealth,
    capitalAllocation,
    crossExchangeInventory: inventory,
    transferAndNetworkCosts: transferCosts,
    stablecoinInventory: {
      status: inventory.imbalanceWarnings.length ? PHASE4_STATUS.WARNING : PHASE4_STATUS.SAFE,
      totalVisibleStablecoinUsd: inventory.visibleStableUsd,
      warnings: inventory.imbalanceWarnings,
      rebalancingSuggestions: inventory.rows
        .filter(row => row.inventoryStatus !== PHASE4_STATUS.SAFE)
        .slice(0, 8)
        .map(row => ({
          venue: row.venue,
          displayName: row.displayName,
          suggestion: 'Pre-position stablecoin inventory later through owner-approved manual funding. Do not enable withdrawals from EtherealAI.',
          liveTransferEnabled: false
        }))
    },
    executionOrchestration: orchestration,
    riskDashboard,
    emergencyControls: {
      globalKillSwitch: 'available',
      perExchangeKillSwitches: 'modeled',
      disableAllLiveConnectors: 'available_through_phase3c_emergency_stop',
      cancelOpenTinyLiveOrder: 'available_for_phase3c_orders_only',
      multiLegLiveExecution: 'locked'
    },
    safetyBoundary: createPhase4SafetyBoundary(),
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  PHASE4_STATUS,
  DEFAULT_PHASE4_RISK_POLICY,
  PHASE4_SUPPORTED_VENUES,
  NETWORK_COST_BASELINES,
  createPhase4SafetyBoundary,
  normalizePhase4Options,
  buildVenueScores,
  buildSpreadHeatmap,
  rankArbitrageOpportunities,
  buildCrossExchangeInventory,
  buildCapitalAllocation,
  estimateTransferAndNetworkCosts,
  buildRecoveryAndOrchestration,
  buildRiskDashboard,
  buildLiveArbitrageCommandCenter
};
