const PHASE5_AI_MODES = {
  CONSERVATIVE: 'Conservative',
  BALANCED: 'Balanced',
  AGGRESSIVE: 'Aggressive',
  MANUAL_APPROVAL_REQUIRED: 'Manual Approval Required'
};

const PHASE5_STATUS = {
  READY: 'Ready',
  REVIEW: 'Review',
  WARNING: 'Warning',
  UNSAFE: 'Unsafe',
  LOCKED: 'Locked'
};

const DEFAULT_PHASE5_TREASURY_POLICY = {
  treasuryKillSwitchEnabled: true,
  emergencyCapitalFreezeEnabled: true,
  autonomousTreasuryActionsEnabled: false,
  unrestrictedAutonomousScalingEnabled: false,
  unrestrictedLeverageEnabled: false,
  unrestrictedFuturesEnabled: false,
  unrestrictedWithdrawalsEnabled: false,
  unrestrictedWalletSigningEnabled: false,
  ownerApprovalRequired: true,
  maxTreasuryDrawdownPercent: 3,
  reserveRatioPercent: 70,
  maxExchangeConcentrationPercent: 35,
  maxStablecoinConcentrationPercent: 65,
  maxStrategyCapitalPercent: 15,
  maxOpportunityCapitalPercent: 5,
  volatilityExposureReductionPercent: 50,
  minimumExecutionProbability: 65,
  minimumLiquidityConfidence: 60,
  minimumTreasuryScore: 65
};

const CHAIN_CONGESTION_BASELINES = {
  ethereum: { chain: 'Ethereum', congestion: 'high', congestionScore: 42, liquidityScore: 95, estimatedTransferMinutes: 12 },
  polygon: { chain: 'Polygon', congestion: 'low', congestionScore: 86, liquidityScore: 74, estimatedTransferMinutes: 3 },
  base: { chain: 'Base', congestion: 'medium', congestionScore: 77, liquidityScore: 79, estimatedTransferMinutes: 5 },
  arbitrum: { chain: 'Arbitrum', congestion: 'medium', congestionScore: 76, liquidityScore: 82, estimatedTransferMinutes: 6 },
  avalanche: { chain: 'Avalanche', congestion: 'low', congestionScore: 81, liquidityScore: 66, estimatedTransferMinutes: 4 },
  bnb: { chain: 'BNB Chain', congestion: 'low', congestionScore: 80, liquidityScore: 77, estimatedTransferMinutes: 4 },
  solana: { chain: 'Solana', congestion: 'medium', congestionScore: 72, liquidityScore: 84, estimatedTransferMinutes: 2 }
};

const STABLECOINS = new Set(['USD', 'USDT', 'USDC', 'FDUSD', 'DAI', 'GUSD', 'TUSD', 'PYUSD', 'USDP']);

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(toFiniteNumber(value, 0))));
}

function normalizeVenueName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/_/g, '-');
}

function normalizeMode(value = PHASE5_AI_MODES.MANUAL_APPROVAL_REQUIRED) {
  const mode = String(value || '').trim().toLowerCase();

  if (mode === 'conservative') return PHASE5_AI_MODES.CONSERVATIVE;
  if (mode === 'balanced') return PHASE5_AI_MODES.BALANCED;
  if (mode === 'aggressive') return PHASE5_AI_MODES.AGGRESSIVE;
  return PHASE5_AI_MODES.MANUAL_APPROVAL_REQUIRED;
}

function createPhase5SafetyBoundary() {
  return {
    phase: 'phase5_autonomous_treasury_liquidity_intelligence',
    intelligenceOnly: true,
    treasuryActionsEnabled: false,
    autonomousTreasuryActionsEnabled: false,
    unrestrictedAutonomousScalingEnabled: false,
    unrestrictedLeverageEnabled: false,
    unrestrictedFuturesEnabled: false,
    unrestrictedWithdrawalsEnabled: false,
    unrestrictedWalletSigningEnabled: false,
    liveOrderEndpointEnabledForPhase5: false,
    bridgeOrTransferEndpointEnabled: false,
    ownerApprovalRequired: true
  };
}

function normalizePhase5Options(options = {}) {
  return {
    symbol: String(options.symbol || 'BTC/USDT').trim().toUpperCase().replace('-', '/'),
    aiMode: normalizeMode(options.aiMode),
    planningCapitalUsd: Math.max(0, toFiniteNumber(options.planningCapitalUsd, 1000)),
    reserveRatioPercent: Math.max(0, Math.min(100, toFiniteNumber(options.reserveRatioPercent, DEFAULT_PHASE5_TREASURY_POLICY.reserveRatioPercent))),
    maxExchangeConcentrationPercent: Math.max(1, Math.min(100, toFiniteNumber(options.maxExchangeConcentrationPercent, DEFAULT_PHASE5_TREASURY_POLICY.maxExchangeConcentrationPercent))),
    maxStablecoinConcentrationPercent: Math.max(1, Math.min(100, toFiniteNumber(options.maxStablecoinConcentrationPercent, DEFAULT_PHASE5_TREASURY_POLICY.maxStablecoinConcentrationPercent))),
    maxStrategyCapitalPercent: Math.max(1, Math.min(100, toFiniteNumber(options.maxStrategyCapitalPercent, DEFAULT_PHASE5_TREASURY_POLICY.maxStrategyCapitalPercent))),
    maxOpportunityCapitalPercent: Math.max(0.1, Math.min(100, toFiniteNumber(options.maxOpportunityCapitalPercent, DEFAULT_PHASE5_TREASURY_POLICY.maxOpportunityCapitalPercent)))
  };
}

function extractProfileBalances(profile = {}) {
  if (Array.isArray(profile?.balances?.visibleBalances)) return profile.balances.visibleBalances;
  if (Array.isArray(profile?.balances?.assets)) return profile.balances.assets;
  if (Array.isArray(profile?.balances?.nonZeroBalances)) return profile.balances.nonZeroBalances;
  if (Array.isArray(profile?.visibleBalances)) return profile.visibleBalances;
  return [];
}

function assetName(balance = {}) {
  return String(balance.asset || balance.currency || balance.coin || '').trim().toUpperCase();
}

function balanceUsd(balance = {}) {
  return Math.max(0, toFiniteNumber(
    balance.usdValue
      ?? balance.valueUsd
      ?? balance.totalUsd
      ?? balance.total
      ?? balance.available
      ?? balance.free
      ?? balance.balance
      ?? balance.walletBalance,
    0
  ));
}

function getProfiles(accountScan = {}) {
  return Array.isArray(accountScan?.profiles) ? accountScan.profiles : [];
}

function buildTreasuryManagement({ accountScan = {}, wallets = [], phase4 = null, options = {}, policy = DEFAULT_PHASE5_TREASURY_POLICY } = {}) {
  const profiles = getProfiles(accountScan);
  const exchangeBalances = profiles.map(profile => {
    const balances = extractProfileBalances(profile);
    const assets = balances.map(balance => ({
      asset: assetName(balance),
      usdValue: balanceUsd(balance),
      isStablecoin: STABLECOINS.has(assetName(balance))
    })).filter(asset => asset.asset);
    const totalUsd = assets.reduce((sum, asset) => sum + asset.usdValue, 0);
    const stablecoinUsd = assets.filter(asset => asset.isStablecoin).reduce((sum, asset) => sum + asset.usdValue, 0);

    return {
      exchangeName: normalizeVenueName(profile.exchangeName),
      displayName: profile.displayName || profile.exchangeName || 'Exchange',
      status: profile.phase3AStatus || profile.status || 'Not Connected',
      authenticatedReadOnly: profile.status === 'read_only_account_connected' || profile.phase3AStatus === 'Authenticated Read-Only',
      totalUsd: Number(totalUsd.toFixed(2)),
      stablecoinUsd: Number(stablecoinUsd.toFixed(2)),
      nonStablecoinUsd: Number(Math.max(0, totalUsd - stablecoinUsd).toFixed(2)),
      assets,
      positions: profile.positions || { status: 'not_visible', count: 0 },
      feeTier: profile.feeTier || { status: 'not_checked' }
    };
  });
  const visibleExchangeCapitalUsd = exchangeBalances.reduce((sum, row) => sum + row.totalUsd, 0);
  const planningCapitalUsd = Math.max(visibleExchangeCapitalUsd, toFiniteNumber(options.planningCapitalUsd, 0));
  const stablecoinInventoryUsd = exchangeBalances.reduce((sum, row) => sum + row.stablecoinUsd, 0);
  const deployedCapitalUsd = exchangeBalances.reduce((sum, row) => sum + row.nonStablecoinUsd, 0);
  const idleCapitalUsd = Math.max(0, stablecoinInventoryUsd);
  const reserveRequiredUsd = planningCapitalUsd * (policy.reserveRatioPercent / 100);
  const walletChainRows = (wallets || []).map(wallet => ({
    label: wallet.label,
    chainFamily: wallet.chain_family || wallet.chainFamily || 'unknown',
    network: wallet.network || 'unknown',
    publicAddressPresent: Boolean(wallet.public_address || wallet.publicAddress),
    status: wallet.status || 'metadata_only',
    balanceUsd: null,
    note: 'Public wallet metadata only. No wallet balance scan, signing, transfer, or private key access.'
  }));

  return {
    status: PHASE5_STATUS.REVIEW,
    totalCapitalUsd: Number(planningCapitalUsd.toFixed(2)),
    visibleExchangeCapitalUsd: Number(visibleExchangeCapitalUsd.toFixed(2)),
    stablecoinInventoryUsd: Number(stablecoinInventoryUsd.toFixed(2)),
    idleCapitalUsd: Number(idleCapitalUsd.toFixed(2)),
    deployedCapitalUsd: Number(deployedCapitalUsd.toFixed(2)),
    reserveRequiredUsd: Number(reserveRequiredUsd.toFixed(2)),
    reserveGapUsd: Number(Math.max(0, reserveRequiredUsd - idleCapitalUsd).toFixed(2)),
    unrealizedPnlUsd: 0,
    realizedPnlUsd: 0,
    exchangeBalances,
    chainBalances: walletChainRows,
    warnings: [
      profiles.length ? null : 'No authenticated read-only account balances are visible yet. Treasury uses planning capital until keys are connected.',
      idleCapitalUsd >= reserveRequiredUsd || planningCapitalUsd === 0 ? null : 'Stablecoin reserve is below the configured reserve ratio.',
      phase4?.safetyBoundary?.multiExchangeLiveExecutionEnabled === false ? null : 'Phase 4 execution boundary needs review.'
    ].filter(Boolean)
  };
}

function estimateVolatilityRisk(opportunity = {}) {
  const latency = toFiniteNumber(opportunity.latencyMs, 0);
  const spread = Math.abs(toFiniteNumber(opportunity.estimatedNetProfitPercent, 0));
  const penalty = latency > 1500 ? 35 : latency > 800 ? 18 : 6;
  return clampScore(Math.max(8, 45 - spread * 5 + penalty));
}

function buildLiquidityIntelligence({ phase4 = null, scan = {}, policy = DEFAULT_PHASE5_TREASURY_POLICY } = {}) {
  const heatmap = Array.isArray(phase4?.spreadHeatmap) ? phase4.spreadHeatmap : [];
  const snapshots = Array.isArray(scan?.snapshots) ? scan.snapshots : [];
  const venueDepth = snapshots.map(row => {
    const snapshot = row.snapshot || row;
    const liquidityUsd = toFiniteNumber(snapshot.topAskLiquidityUsd || snapshot.topBidLiquidityUsd || snapshot.quoteVolume24h, 0);
    const slippageRisk = liquidityUsd <= 0 ? 70 : liquidityUsd < 1000 ? 80 : liquidityUsd < 10000 ? 50 : 18;

    return {
      venue: normalizeVenueName(snapshot.exchangeName || row.exchangeName),
      displayName: snapshot.displayName || snapshot.exchangeName || row.exchangeName || 'Venue',
      liquidityUsd,
      bid: toFiniteNumber(snapshot.bid, 0),
      ask: toFiniteNumber(snapshot.ask, 0),
      latencyMs: toFiniteNumber(snapshot.latencyMs, null),
      thinBookDetected: liquidityUsd > 0 && liquidityUsd < 1000,
      slippageImpactPercent: Number((slippageRisk / 100).toFixed(4)),
      marketImpactScore: clampScore(100 - slippageRisk),
      status: liquidityUsd <= 0 ? PHASE5_STATUS.REVIEW : liquidityUsd < 1000 ? PHASE5_STATUS.WARNING : PHASE5_STATUS.READY
    };
  });
  const fragmentedRoutes = heatmap.filter(item => item.status !== 'Safe').slice(0, 12).map(item => ({
    route: item.route,
    status: item.status,
    liquidityUsd: toFiniteNumber(item.liquidityUsd, 0),
    reason: item.status === 'Liquidity insufficient'
      ? 'Visible liquidity is below threshold.'
      : item.status === 'Spread collapsed'
        ? 'Net spread is negative after estimated costs.'
        : 'Route needs review before use.'
  }));
  const bestExecutionRoutes = heatmap
    .slice()
    .sort((a, b) => (
      toFiniteNumber(b.estimatedNetProfitPercent, -999) - toFiniteNumber(a.estimatedNetProfitPercent, -999)
    ))
    .slice(0, 8)
    .map(item => ({
      route: item.route,
      netEdgePercent: toFiniteNumber(item.estimatedNetProfitPercent, 0),
      liquidityUsd: toFiniteNumber(item.liquidityUsd, 0),
      status: item.status,
      executionAllowed: false
    }));

  return {
    status: venueDepth.some(row => row.thinBookDetected) ? PHASE5_STATUS.WARNING : PHASE5_STATUS.REVIEW,
    venueDepth,
    thinBooks: venueDepth.filter(row => row.thinBookDetected),
    liquidityFragmentation: fragmentedRoutes,
    bestExecutionRoutes,
    summary: {
      venuesChecked: venueDepth.length,
      thinBookCount: venueDepth.filter(row => row.thinBookDetected).length,
      fragmentedRouteCount: fragmentedRoutes.length,
      minimumLiquidityConfidence: policy.minimumLiquidityConfidence
    }
  };
}

function rankAutonomousTreasuryOpportunities({ phase4 = null, liquidity = null, policy = DEFAULT_PHASE5_TREASURY_POLICY, options = {} } = {}) {
  const queue = Array.isArray(phase4?.opportunityQueue) ? phase4.opportunityQueue : [];

  return queue.map(opportunity => {
    const netSpread = toFiniteNumber(opportunity.estimatedAccountAwareNetProfitPercent ?? opportunity.estimatedNetProfitPercent, 0);
    const slippageEstimate = toFiniteNumber(opportunity.slippagePercent ?? phase4?.options?.maxSlippagePercent, 0.15);
    const routeHealth = opportunity.safetyStatus === 'Safe' ? 88 : opportunity.safetyStatus === 'Warning' ? 58 : 30;
    const liquidityConfidence = clampScore(Math.min(100, toFiniteNumber(opportunity.limitingLiquidityUsd, 0) / 1000 * 12));
    const latencyConfidence = clampScore(100 - toFiniteNumber(opportunity.latencyMs, 1500) / 20);
    const fillReliability = clampScore(toFiniteNumber(opportunity.confidenceScore, 50));
    const volatilityRisk = estimateVolatilityRisk(opportunity);
    const executionProbability = clampScore(
      routeHealth * 0.22
        + liquidityConfidence * 0.2
        + latencyConfidence * 0.18
        + fillReliability * 0.2
        + Math.max(0, 100 - volatilityRisk) * 0.2
    );
    const treasuryScore = clampScore(
      netSpread * 120
        + executionProbability * 0.45
        + liquidityConfidence * 0.2
        + routeHealth * 0.2
        - slippageEstimate * 30
    );
    const selected = treasuryScore >= policy.minimumTreasuryScore
      && executionProbability >= policy.minimumExecutionProbability
      && liquidityConfidence >= policy.minimumLiquidityConfidence
      && netSpread > 0;

    return {
      routeId: opportunity.routeId,
      symbol: opportunity.symbol || options.symbol,
      buyVenue: opportunity.buyVenue || opportunity.buyExchangeName,
      sellVenue: opportunity.sellVenue || opportunity.sellExchangeName,
      netSpreadAfterFeesPercent: Number(netSpread.toFixed(4)),
      slippageEstimatePercent: Number(slippageEstimate.toFixed(4)),
      liquidityConfidence,
      exchangeHealthScore: routeHealth,
      latencyConfidence,
      historicalFillReliability: fillReliability,
      volatilityRisk,
      executionProbability,
      treasuryScore,
      selectedForPlanning: selected,
      executionAllowed: false,
      rejectionReasons: [
        netSpread > 0 ? null : 'Net spread is not positive after estimated costs.',
        executionProbability >= policy.minimumExecutionProbability ? null : 'Execution probability is below threshold.',
        liquidityConfidence >= policy.minimumLiquidityConfidence ? null : 'Liquidity confidence is below threshold.',
        treasuryScore >= policy.minimumTreasuryScore ? null : 'Treasury score is below threshold.'
      ].filter(Boolean),
      decision: selected
        ? 'Selected for planning queue only. Manual owner approval is still required before any future action.'
        : 'Rejected or held for review.'
    };
  }).sort((a, b) => b.treasuryScore - a.treasuryScore);
}

function buildDynamicCapitalAllocation({ treasury = {}, rankedOpportunities = [], policy = DEFAULT_PHASE5_TREASURY_POLICY, options = {} } = {}) {
  const mode = normalizeMode(options.aiMode);
  const modeMultiplier = mode === PHASE5_AI_MODES.CONSERVATIVE
    ? 0.5
    : mode === PHASE5_AI_MODES.BALANCED
      ? 0.75
      : mode === PHASE5_AI_MODES.AGGRESSIVE
        ? 1
        : 0;
  const investableCapitalUsd = Math.max(0, treasury.totalCapitalUsd - treasury.reserveRequiredUsd);
  const exchangeLimitUsd = treasury.totalCapitalUsd * (policy.maxExchangeConcentrationPercent / 100);
  const strategyLimitUsd = treasury.totalCapitalUsd * (policy.maxStrategyCapitalPercent / 100);
  const opportunityLimitUsd = treasury.totalCapitalUsd * (policy.maxOpportunityCapitalPercent / 100);
  const selected = rankedOpportunities.filter(item => item.selectedForPlanning).slice(0, 8);

  return {
    status: mode === PHASE5_AI_MODES.MANUAL_APPROVAL_REQUIRED ? PHASE5_STATUS.LOCKED : PHASE5_STATUS.REVIEW,
    aiMode: mode,
    investableCapitalUsd: Number(investableCapitalUsd.toFixed(2)),
    reserveCapitalUsd: Number((treasury.reserveRequiredUsd || 0).toFixed(2)),
    maxExchangeAllocationUsd: Number(exchangeLimitUsd.toFixed(2)),
    maxStrategyAllocationUsd: Number(strategyLimitUsd.toFixed(2)),
    maxOpportunityAllocationUsd: Number(opportunityLimitUsd.toFixed(2)),
    allocations: selected.map(item => {
      const confidenceWeight = item.treasuryScore / 100;
      const suggested = Math.min(opportunityLimitUsd, strategyLimitUsd, investableCapitalUsd * confidenceWeight * modeMultiplier);

      return {
        routeId: item.routeId,
        route: `${item.buyVenue} -> ${item.sellVenue}`,
        suggestedCapitalUsd: Number(Math.max(0, suggested).toFixed(2)),
        confidence: item.treasuryScore,
        reason: `Weighted by treasury score ${item.treasuryScore}, execution probability ${item.executionProbability}, and ${mode} mode.`,
        ownerApprovalRequired: true,
        executionAllowed: false
      };
    }),
    idleRebalanceSuggestions: treasury.reserveGapUsd > 0
      ? ['Increase stablecoin reserve before expanding treasury allocation.']
      : ['Reserve ratio is modeled as satisfied or unknown. Keep funds pre-positioned manually; EtherealAI does not transfer funds.'],
    volatilityAdjustment: mode === PHASE5_AI_MODES.AGGRESSIVE
      ? 'Aggressive mode increases planning allocation only; live action remains locked.'
      : 'Exposure is reduced during uncertain volatility or Manual Approval Required mode.'
  };
}

function buildCrossChainIntelligence({ wallets = [], networkCostBaselines = {}, treasury = {}, options = {} } = {}) {
  const walletNetworks = new Set((wallets || []).map(wallet => String(wallet.network || wallet.chain_family || '').toLowerCase()).filter(Boolean));
  const chains = Object.entries({
    ...CHAIN_CONGESTION_BASELINES,
    ...(networkCostBaselines || {})
  }).map(([chainId, chain]) => {
    const stablecoinCostUsd = toFiniteNumber(chain.stablecoinCostUsd, chainId === 'ethereum' ? 9.5 : 0.1);
    const transferMinutes = toFiniteNumber(chain.transferTimeMinutes ?? chain.estimatedTransferMinutes, CHAIN_CONGESTION_BASELINES[chainId]?.estimatedTransferMinutes ?? 5);
    const congestionScore = clampScore(chain.congestionScore ?? (stablecoinCostUsd > 5 ? 35 : 80));
    const liquidityScore = clampScore(chain.liquidityScore ?? CHAIN_CONGESTION_BASELINES[chainId]?.liquidityScore ?? 60);

    return {
      chainId,
      chain: chain.chain || CHAIN_CONGESTION_BASELINES[chainId]?.chain || chainId,
      walletMetadataPresent: walletNetworks.has(chainId) || walletNetworks.has(String(chain.chain || '').toLowerCase()),
      estimatedStablecoinTransferCostUsd: Number(stablecoinCostUsd.toFixed(4)),
      estimatedTransferTimeMinutes: transferMinutes,
      congestion: chain.congestion || chain.risk || 'modeled',
      congestionScore,
      liquidityScore,
      routeScore: clampScore(liquidityScore * 0.45 + congestionScore * 0.35 + Math.max(0, 100 - stablecoinCostUsd * 4) * 0.2),
      stablecoinRoutingEnabled: false,
      note: 'Cross-chain routing is intelligence only. Bridges, withdrawals, transfers, and wallet signing remain disabled.'
    };
  }).sort((a, b) => b.routeScore - a.routeScore);

  return {
    status: PHASE5_STATUS.REVIEW,
    chains,
    bestStablecoinInventoryRoutes: chains.slice(0, 5),
    warnings: [
      'Stablecoin inventory can be routed intelligently only after future owner-approved transfer/signing infrastructure exists.',
      treasury.stablecoinInventoryUsd > 0 ? null : 'No stablecoin balance is visible through read-only exchange accounts.'
    ].filter(Boolean)
  };
}

function buildTreasurySafetyControls({ treasury = {}, allocation = {}, policy = DEFAULT_PHASE5_TREASURY_POLICY } = {}) {
  const exchangeRows = treasury.exchangeBalances || [];
  const total = Math.max(treasury.totalCapitalUsd || 0, 1);
  const concentrationWarnings = exchangeRows
    .filter(row => (row.totalUsd / total) * 100 > policy.maxExchangeConcentrationPercent)
    .map(row => `${row.displayName} exceeds exchange concentration limit.`);
  const stablecoinWarnings = exchangeRows
    .filter(row => row.stablecoinUsd > 0 && treasury.stablecoinInventoryUsd > 0 && (row.stablecoinUsd / treasury.stablecoinInventoryUsd) * 100 > policy.maxStablecoinConcentrationPercent)
    .map(row => `${row.displayName} exceeds stablecoin concentration limit.`);

  return {
    status: policy.treasuryKillSwitchEnabled || policy.emergencyCapitalFreezeEnabled ? PHASE5_STATUS.LOCKED : PHASE5_STATUS.REVIEW,
    treasuryKillSwitch: policy.treasuryKillSwitchEnabled ? 'on' : 'off',
    emergencyCapitalFreeze: policy.emergencyCapitalFreezeEnabled ? 'on' : 'off',
    maxTreasuryDrawdownPercent: policy.maxTreasuryDrawdownPercent,
    reserveRatioPercent: policy.reserveRatioPercent,
    maxExchangeConcentrationPercent: policy.maxExchangeConcentrationPercent,
    maxStablecoinConcentrationPercent: policy.maxStablecoinConcentrationPercent,
    maxStrategyCapitalPercent: policy.maxStrategyCapitalPercent,
    maxOpportunityCapitalPercent: policy.maxOpportunityCapitalPercent,
    exchangeOutageProtection: 'enabled_for_planning',
    warnings: [
      ...concentrationWarnings,
      ...stablecoinWarnings,
      treasury.reserveGapUsd > 0 ? 'Reserve ratio needs review before expanding allocation.' : null,
      allocation.allocations?.length ? null : 'No treasury allocation can be recommended yet.'
    ].filter(Boolean),
    controls: [
      'Treasury kill switch',
      'Emergency capital freeze',
      'Reserve ratio control',
      'Exchange concentration limits',
      'Stablecoin concentration limits',
      'Exchange outage protection',
      'Manual owner approval required'
    ],
    safetyBoundary: createPhase5SafetyBoundary()
  };
}

function buildAiDecisionAudit({ rankedOpportunities = [], allocation = {}, treasury = {}, safety = {} } = {}) {
  const selected = rankedOpportunities.filter(item => item.selectedForPlanning);
  const rejected = rankedOpportunities.filter(item => !item.selectedForPlanning);

  return {
    status: PHASE5_STATUS.REVIEW,
    explanation: selected.length
      ? 'Top opportunities were selected for planning because score, liquidity, execution probability, and treasury limits passed configured thresholds.'
      : 'No opportunity is selected for action. EtherealAI is holding treasury allocation because scores, liquidity, execution probability, or safety limits need review.',
    selected: selected.slice(0, 8).map(item => ({
      routeId: item.routeId,
      route: `${item.buyVenue} -> ${item.sellVenue}`,
      confidence: item.treasuryScore,
      whySelected: item.decision,
      allocation: allocation.allocations?.find(row => row.routeId === item.routeId) || null,
      executionAllowed: false
    })),
    rejected: rejected.slice(0, 12).map(item => ({
      routeId: item.routeId,
      route: `${item.buyVenue} -> ${item.sellVenue}`,
      confidence: item.treasuryScore,
      whyRejected: item.rejectionReasons.length ? item.rejectionReasons : ['Held for manual review.'],
      executionAllowed: false
    })),
    treasuryReasoning: [
      `Total planning capital: $${Number(treasury.totalCapitalUsd || 0).toFixed(2)}.`,
      `Reserve required: $${Number(treasury.reserveRequiredUsd || 0).toFixed(2)}.`,
      `Treasury kill switch: ${safety.treasuryKillSwitch || 'on'}.`,
      'All treasury actions require owner approval and remain intelligence-only.'
    ],
    auditLogPolicy: 'Every Phase 5 refresh is saved locally with options, dashboard JSON, safety boundary, and selected/rejected reasoning.'
  };
}

function buildTreasuryLiquidityCommandCenter({
  accountScan = {},
  scan = {},
  phase4 = null,
  wallets = [],
  networkCostBaselines = {},
  options = {},
  policy = {}
} = {}) {
  const normalizedOptions = normalizePhase5Options(options);
  const effectivePolicy = {
    ...DEFAULT_PHASE5_TREASURY_POLICY,
    ...(policy || {}),
    reserveRatioPercent: normalizedOptions.reserveRatioPercent,
    maxExchangeConcentrationPercent: normalizedOptions.maxExchangeConcentrationPercent,
    maxStablecoinConcentrationPercent: normalizedOptions.maxStablecoinConcentrationPercent,
    maxStrategyCapitalPercent: normalizedOptions.maxStrategyCapitalPercent,
    maxOpportunityCapitalPercent: normalizedOptions.maxOpportunityCapitalPercent,
    treasuryKillSwitchEnabled: true,
    emergencyCapitalFreezeEnabled: true,
    autonomousTreasuryActionsEnabled: false,
    unrestrictedAutonomousScalingEnabled: false,
    unrestrictedLeverageEnabled: false,
    unrestrictedFuturesEnabled: false,
    unrestrictedWithdrawalsEnabled: false,
    unrestrictedWalletSigningEnabled: false,
    ownerApprovalRequired: true
  };
  const treasury = buildTreasuryManagement({ accountScan, wallets, phase4, options: normalizedOptions, policy: effectivePolicy });
  const liquidity = buildLiquidityIntelligence({ phase4, scan, policy: effectivePolicy });
  const rankedOpportunities = rankAutonomousTreasuryOpportunities({ phase4, liquidity, policy: effectivePolicy, options: normalizedOptions });
  const allocation = buildDynamicCapitalAllocation({ treasury, rankedOpportunities, policy: effectivePolicy, options: normalizedOptions });
  const crossChain = buildCrossChainIntelligence({ wallets, networkCostBaselines, treasury, options: normalizedOptions });
  const safety = buildTreasurySafetyControls({ treasury, allocation, policy: effectivePolicy });
  const audit = buildAiDecisionAudit({ rankedOpportunities, allocation, treasury, safety });

  return {
    title: 'Treasury Command Center',
    phase: 'Phase 5: Autonomous Treasury & Liquidity Intelligence',
    status: 'intelligence_only_owner_approval_required',
    plainEnglishStatus: 'Treasury and liquidity intelligence is active. Autonomous treasury movement, withdrawals, wallet signing, leverage, futures, and unrestricted scaling remain locked.',
    aiMode: normalizedOptions.aiMode,
    options: normalizedOptions,
    policy: effectivePolicy,
    treasury,
    dynamicCapitalAllocation: allocation,
    liquidityIntelligence: liquidity,
    opportunityRanking: rankedOpportunities.slice(0, 20),
    crossChainIntelligence: crossChain,
    riskExposureDashboard: safety,
    aiDecisionAudit: audit,
    dashboards: {
      treasuryCommandCenter: treasury,
      liquidityIntelligenceDashboard: liquidity,
      opportunityRankingBoard: rankedOpportunities.slice(0, 20),
      crossChainStatusDashboard: crossChain,
      capitalAllocationHeatmap: allocation,
      riskAndExposureDashboard: safety
    },
    nextRecommendedAction: rankedOpportunities.some(item => item.selectedForPlanning)
      ? 'Review selected planning opportunities, allocation reasoning, reserve ratio, and safety controls. Owner approval is still required before any future action.'
      : 'Connect authenticated read-only account balances or run a fresh Phase 4 scan to improve treasury intelligence.',
    safetyBoundary: createPhase5SafetyBoundary(),
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  PHASE5_AI_MODES,
  PHASE5_STATUS,
  DEFAULT_PHASE5_TREASURY_POLICY,
  CHAIN_CONGESTION_BASELINES,
  createPhase5SafetyBoundary,
  normalizePhase5Options,
  buildTreasuryManagement,
  buildDynamicCapitalAllocation,
  buildLiquidityIntelligence,
  rankAutonomousTreasuryOpportunities,
  buildCrossChainIntelligence,
  buildTreasurySafetyControls,
  buildAiDecisionAudit,
  buildTreasuryLiquidityCommandCenter
};
