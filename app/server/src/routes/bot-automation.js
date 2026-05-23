const { buildBotAutomationCapabilityPath } = require('../lib/bot-automation');

function buildBotSafetyDossierExplanation({
  plan,
  dossierStatus,
  paperAutomationReady,
  blockingFailures,
  activeSchedules
}) {
  const failureSummary = blockingFailures.length
    ? blockingFailures.slice(0, 5).join(', ')
    : '';
  const summary = (() => {
    if (plan.status === 'archived') {
      return 'Plan is archived. No automation action should run from this plan.';
    }

    if (dossierStatus === 'blocked') {
      return `Plan is blocked by ${blockingFailures.length} safety gate(s).`;
    }

    if (paperAutomationReady) {
      return 'Paper monitoring is ready. Live trading remains disabled.';
    }

    if (plan.mode === 'live_disabled') {
      return 'Plan is live-disabled. It can be reviewed, but it cannot execute orders.';
    }

    return 'Plan needs owner review before paper automation is considered ready.';
  })();
  const ownerAction = blockingFailures.length
    ? `Review blocking failures: ${failureSummary}.`
    : (activeSchedules.length
      ? 'Review the latest schedule, paper run, and dossier export before changing plan status.'
      : 'Create or run a paper schedule, then export the dossier for the local evidence record.');

  return {
    summary,
    ownerAction,
    liveExecutionBoundary: 'Live execution disabled: no credential loading, no live order endpoint, and no exchange order placement.',
    reviewChecklist: [
      'Confirm plan mode is paper or live_disabled.',
      'Review latest readiness, go-live review, paper run, and schedule history.',
      'Export the safety dossier JSON for local evidence.',
      'Keep live execution disabled until a future reviewed implementation phase.'
    ]
  };
}

function registerBotAutomationRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  findSensitiveFields,
  getPositiveNumber,
  parseStrategy,
  parseRiskProfile,
  parsePaperSession,
  parseExchangeConnector,
  parseBotAutomationPlan,
  parseBotAutomationRun,
  parseBotAutomationSchedule,
  parseBotLiveReadinessEvent,
  parseBotLiveEnablementReview,
  getBotAutomationPlanRow,
  getBotAutomationRunRow,
  getBotAutomationScheduleRow,
  getBotLiveReadinessEventRow,
  getBotLiveEnablementReviewRow,
  createBotAutomationPaperRun,
  runBotAutomationSchedule,
  scheduleBotAutomationWorker,
  loadBotAutomationReadinessContext,
  evaluateBotAutomationReadiness,
  evaluateBotLiveReadiness,
  runCandleBacktest,
  createPaperReplayPayload,
  insertDecisionLogs,
  createBotLiveEnablementReviewPayload,
  assertNoInlineSecretPayload,
  parseOwnerGoLiveCommand,
  selects
}) {
  const {
    botAutomationPlan: botAutomationPlanSelect,
    botAutomationRun: botAutomationRunSelect,
    botAutomationSchedule: botAutomationScheduleSelect,
    botLiveReadinessEvent: botLiveReadinessEventSelect,
    botLiveEnablementReview: botLiveEnablementReviewSelect
  } = selects;
  const safePaperRiskDefaults = {
    name: 'Paper Trading Safe Defaults',
    mode: 'paper',
    maxOrderValue: 250,
    maxPositionValue: 1000,
    maxDailyLoss: 250,
    maxOpenTrades: 3,
    killSwitchEnabled: false,
    notes: 'Auto-managed by Run This Strategy Safely. Paper only. Live trading and wallet signing stay disabled.'
  };

  function getPaperRiskGateStatus(paperSession) {
    return String(
      paperSession?.result?.riskGate?.status
      || paperSession?.result?.risk_gate?.status
      || ''
    ).trim().toLowerCase();
  }

  function paperSessionPassed(paperSession) {
    return Boolean(
      paperSession
      && paperSession.status === 'completed'
      && ['pass', 'passed', 'ready', 'ready_for_paper'].includes(getPaperRiskGateStatus(paperSession))
    );
  }

  function riskProfileIsSafe(profile) {
    return Boolean(
      profile
      && profile.mode === 'paper'
      && profile.status === 'active'
      && profile.max_order_value > 0
      && profile.max_position_value > 0
      && profile.max_daily_loss > 0
      && profile.max_open_trades > 0
      && !profile.kill_switch_enabled
    );
  }

  function connectorIsSafePaper(connector) {
    const settings = connector?.settings || {};
    return Boolean(
      connector
      && connector.mode === 'paper'
      && connector.status !== 'archived'
      && settings.liveExecution !== true
      && settings.liveOrdersEnabled !== true
      && !findSensitiveFields(settings).length
    );
  }

  function plainFixForFailure(id) {
    const fixes = {
      strategy_not_found: 'Create or open a saved strategy, then click Run This Strategy Safely again.',
      market_data_missing: 'Import or refresh candle data for this strategy market and timeframe, then click Run This Strategy Safely again.',
      paper_session_failed: 'The historical paper replay needs review. Import more matching candles or adjust the strategy rules, then retry.',
      risk_profile_failed: 'EtherealAI could not create safe paper limits. Open Security or Risk and try again.',
      connector_failed: 'EtherealAI could not create the local paper connector. Open Advanced Mode only if you need to inspect connector metadata.',
      plan_not_ready: 'EtherealAI could not create a ready paper plan. Retry after fixing the message shown below.',
      schedule_failed: 'EtherealAI could not activate the local paper schedule. Retry the safe paper run.',
      simulation_failed: 'The local paper simulation could not run. Review the plain-English error, then retry.'
    };

    return fixes[id] || 'Review the message, apply the suggested fix, then click Run This Strategy Safely again.';
  }

  function buildSafePaperError(id, message, detail = {}) {
    return {
      error: message,
      plainEnglishError: message,
      blockedAt: id,
      oneClickFixes: [
        {
          label: 'Retry Safe Paper Test',
          action: 'retry_safe_paper_test',
          safe: true,
          description: plainFixForFailure(id)
        }
      ],
      liveTradingEnabled: false,
      walletSigningEnabled: false,
      ...detail
    };
  }

  function getTimeframeIntervalMs(timeframe) {
    const normalized = String(timeframe || '').trim().toLowerCase();
    const match = normalized.match(/^(\d+)?\s*(m|h|d|w)$/);

    if (!match) {
      return 60 * 60 * 1000;
    }

    const amount = Number(match[1] || 1);
    const unit = match[2];

    if (unit === 'm') {
      return amount * 60 * 1000;
    }

    if (unit === 'h') {
      return amount * 60 * 60 * 1000;
    }

    if (unit === 'd') {
      return amount * 24 * 60 * 60 * 1000;
    }

    return amount * 7 * 24 * 60 * 60 * 1000;
  }

  function buildLocalSampleCandles(strategy, count = 240) {
    const intervalMs = getTimeframeIntervalMs(strategy.timeframe);
    const end = Date.now() - intervalMs;
    const first = end - ((count - 1) * intervalMs);
    let previousClose = 100;

    return Array.from({ length: count }, (_, index) => {
      const timestamp = new Date(first + (index * intervalMs)).toISOString();
      const trend = index * 0.045;
      const wave = (Math.sin(index / 8) * 2.4) + (Math.cos(index / 19) * 1.2);
      const close = Math.max(1, Number((100 + trend + wave).toFixed(6)));
      const open = Number(previousClose.toFixed(6));
      const wick = 0.004 + ((index % 5) * 0.0008);
      const high = Number((Math.max(open, close) * (1 + wick)).toFixed(6));
      const low = Number((Math.min(open, close) * (1 - wick)).toFixed(6));
      const volume = Number((1000 + (Math.sin(index / 5) * 90) + (index * 3)).toFixed(2));

      previousClose = close;

      return {
        timestamp,
        open,
        high,
        low,
        close,
        volume
      };
    });
  }

  async function createLocalSampleMarketImport(strategy) {
    const candles = buildLocalSampleCandles(strategy);
    const summary = {
      qualityScore: 92,
      candleCount: candles.length,
      duplicateTimestamps: 0,
      outOfOrderRows: 0,
      gapCount: 0,
      invalidShapeRows: 0,
      generatedBy: 'run_this_strategy_safely',
      note: 'Local sample candles were generated because no matching local market data existed. This is useful for operator training and workflow verification, not market truth.'
    };
    const result = await dbRun(
      `INSERT INTO market_data_imports
       (label, market_symbol, timeframe, source, candle_count, status, quality_score, notes, summary_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${strategy.market_symbol} ${strategy.timeframe} local sample for safe paper test`,
        strategy.market_symbol,
        strategy.timeframe,
        'local_sample',
        candles.length,
        'imported',
        summary.qualityScore,
        'Auto-created by Run This Strategy Safely. Local sample data only; no external provider, API key, exchange, wallet, or live order route was used.',
        JSON.stringify(summary)
      ]
    );

    for (const candle of candles) {
      await dbRun(
        `INSERT INTO market_candles
         (import_id, market_symbol, timeframe, timestamp, open, high, low, close, volume)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.lastID,
          strategy.market_symbol,
          strategy.timeframe,
          candle.timestamp,
          candle.open,
          candle.high,
          candle.low,
          candle.close,
          candle.volume
        ]
      );
    }

    return dbGet('SELECT * FROM market_data_imports WHERE id = ?', [result.lastID]);
  }

  function summarizeSafePaperResults({
    strategy,
    paperSession,
    riskProfile,
    connector,
    plan,
    schedule,
    run,
    reused
  }) {
    const paperResult = paperSession?.result || {};
    const metrics = paperResult.metrics || {};
    const settings = paperResult.settings || {};
    const simulatedTrades = paperResult.simulatedTrades || paperResult.trades || [];
    const isArbitrageReplay = paperResult.sourceMode === 'arbitrage_backtest_v1'
      || paperResult.parsedRules?.entry?.kind === 'structured_arbitrage_route';
    const usedLocalSampleData = paperResult.marketImport?.source === 'local_sample'
      || paperResult.data?.source === 'local_sample';
    const latestTrades = simulatedTrades.slice(-25).map((trade, index) => ({
      number: simulatedTrades.length - Math.min(simulatedTrades.length, 25) + index + 1,
      entryAt: trade.entryAt,
      exitAt: trade.exitAt,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      pnl: trade.pnl,
      netReturnPercent: trade.netReturnPercent,
      exitReason: trade.exitReason,
      candlesHeld: trade.candlesHeld,
      buyVenue: trade.buyVenue,
      sellVenue: trade.sellVenue,
      buyVenueType: trade.buyVenueType,
      sellVenueType: trade.sellVenueType,
      buyChain: trade.buyChain,
      sellChain: trade.sellChain,
      grossSpreadPercent: trade.grossSpreadPercent,
      totalEstimatedCostPercent: trade.totalEstimatedCostPercent,
      projectedSpreadAfterLatencyPercent: trade.projectedSpreadAfterLatencyPercent,
      projectedNetEdgeAfterLatencyPercent: trade.projectedNetEdgeAfterLatencyPercent,
      latencyMs: trade.latencyMs,
      liquidityFloor: trade.liquidityFloor,
      liquidityUtilizationPercent: trade.liquidityUtilizationPercent,
      feeModel: trade.feeModel,
      topVolumeFilter: trade.topVolumeFilter,
      decisionReason: trade.decisionReason
    }));
    const feePercent = Number(settings.estimatedFeePercent ?? settings.feePercent ?? 0);
    const makerFeePercent = Number(settings.makerFeePercent ?? feePercent);
    const takerFeePercent = Number(settings.takerFeePercent ?? feePercent);
    const slippagePercent = Number(settings.slippageTolerancePercent ?? settings.slippagePercent ?? 0);
    const estimatedRoundTripCostPercent = Number(((takerFeePercent + takerFeePercent + (slippagePercent * 2))).toFixed(4));
    const routeModel = paperResult.routeModel || {};
    const routeComparisons = routeModel.routeComparisons || routeModel.latestRouteComparisons || [];
    const rejectedReasons = routeModel.rejectedReasons || {};
    const exchangeSelection = routeModel.exchangeSelection || run.result?.decision?.exchangeSelection || null;
    const topVolumeFilter = routeModel.topVolumeFilter || run.result?.decision?.topVolumeFilter || null;
    const warnings = [
      ...(paperResult.parsedRules?.warnings || []),
      ...(usedLocalSampleData ? ['This run used local sample candles because no matching market data was available. Use imported or refreshed market data before relying on results.'] : []),
      ...(metrics.tradeCount <= 0 ? ['No simulated trades were produced. Review entry rules or market data.'] : []),
      ...(isArbitrageReplay && Object.keys(rejectedReasons).length ? [`Rejected route reasons observed: ${Object.entries(rejectedReasons).map(([key, value]) => `${key} (${value})`).join(', ')}.`] : []),
      ...(Number(metrics.totalReturnPercent || 0) < 0 ? ['Paper replay is negative. Review the rules before scaling paper testing.'] : []),
      ...(paperResult.riskGate?.status !== 'passed' ? [`Paper risk gate status: ${paperResult.riskGate?.status || 'unknown'}.`] : []),
      'Live trading remains locked. Wallet signing remains disabled.'
    ];
    const healthScore = [
      paperResult.riskGate?.status === 'passed',
      Number(metrics.tradeCount || 0) > 0,
      Number(metrics.maxDrawdownPercent || 0) <= 25,
      Number(metrics.totalReturnPercent || 0) >= 0
    ].filter(Boolean).length;
    const health = healthScore >= 3 ? 'healthy' : (healthScore >= 2 ? 'review' : 'needs_attention');

    return {
      runningStatus: {
        state: 'paper_schedule_active_run_completed',
        label: 'Safe paper simulation complete; local paper schedule is active.',
        scheduleId: schedule.id,
        latestRunId: run.id,
        nextRunAt: schedule.next_run_at,
        liveTradingEnabled: false,
        walletSigningEnabled: false
      },
      orchestration: {
        strategyId: strategy.id,
        paperSessionId: paperSession.id,
        riskProfileId: riskProfile.id,
        connectorId: connector.id,
        planId: plan.id,
        scheduleId: schedule.id,
        runId: run.id,
        reused
      },
      pAndL: {
        initialCapital: paperSession.initial_capital,
        finalEquity: metrics.finalEquity,
        realizedPnl: Number((Number(metrics.finalEquity || paperSession.current_equity || 0) - Number(paperSession.initial_capital || 0)).toFixed(2)),
        totalReturnPercent: metrics.totalReturnPercent,
        maxDrawdownPercent: metrics.maxDrawdownPercent,
        winRatePercent: metrics.winRatePercent,
        tradeCount: metrics.tradeCount,
        profitFactor: metrics.profitFactor
      },
      simulatedTrades: latestTrades,
      spreadAnalysis: {
        source: isArbitrageReplay ? 'structured arbitrage paper route model' : 'paper assumptions',
        note: isArbitrageReplay
          ? 'No live venue quote was requested. Venue prices, liquidity, spread, slippage, fees, and latency are simulated locally from the structured arbitrage rules.'
          : 'No live venue quote was requested. This is estimated from the safe paper fee and slippage assumptions.',
        arbitrageType: settings.arbitrageType || null,
        minimumSpreadPercent: settings.minimumSpreadPercent ?? null,
        buyVenues: paperResult.routeModel?.buyVenues || [],
        sellVenues: paperResult.routeModel?.sellVenues || [],
        comparedExchanges: routeModel.comparedExchanges || exchangeSelection?.comparedExchanges || [],
        comparedExchangeCount: routeModel.comparedExchangeCount || routeModel.comparedExchanges?.length || 0,
        routeComparisons,
        exchangeSelection,
        topVolumeFilter,
        rejectedReasons,
        latestRoute: latestTrades.length ? latestTrades[latestTrades.length - 1] : null,
        feePercentPerSide: feePercent,
        makerFeePercent,
        takerFeePercent,
        slippagePercentPerSide: slippagePercent,
        estimatedRoundTripCostPercent,
        routesCompared: metrics.routesCompared || null,
        acceptedRouteCount: metrics.acceptedRouteCount || metrics.tradeCount || 0,
        averageGrossSpreadPercent: metrics.averageGrossSpreadPercent ?? null,
        averageProjectedNetEdgePercent: metrics.averageProjectedNetEdgePercent ?? null,
        averageEstimatedNetProfit: metrics.averageEstimatedNetProfit ?? null,
        averageLatencyMs: metrics.averageLatencyMs ?? null,
        latestDecisionPrice: run.result?.decision?.price || null
      },
      feesAndSlippage: {
        feePercentPerSide: feePercent,
        makerFeePercent,
        takerFeePercent,
        slippagePercentPerSide: slippagePercent,
        estimatedRoundTripCostPercent,
        summary: isArbitrageReplay
          ? `maker ${makerFeePercent}% / taker ${takerFeePercent}% + slippage ${slippagePercent}% per side; estimated taker/taker round trip ${estimatedRoundTripCostPercent}%`
          : `fee ${feePercent}% + slippage ${slippagePercent}% per side; estimated round trip ${estimatedRoundTripCostPercent}%`
      },
      entryExitReasons: {
        latestDecision: run.result?.decision || null,
        decisionCounts: paperResult.decisionSummary?.counts || {},
        routeRejectionCounts: rejectedReasons,
        acceptedWhen: 'Entry only when projected net spread remains above total estimated costs after fees, slippage, liquidity, latency, and top-volume checks.',
        rejectedWhen: 'No trade when spread collapses before execution, costs exceed spread, liquidity is too thin, latency is too high, or the pair fails the top-volume filter.',
        recentTradeExitReasons: latestTrades.slice(-10).map(trade => ({
          exitAt: trade.exitAt,
          exitReason: trade.exitReason,
          pnl: trade.pnl,
          netReturnPercent: trade.netReturnPercent,
          decisionReason: trade.decisionReason
        }))
      },
      strategyHealth: {
        status: health,
        score: healthScore,
        summary: health === 'healthy'
          ? 'The paper test is usable for continued local simulation.'
          : 'The strategy needs review before you rely on the paper bot results.',
        riskGate: paperResult.riskGate || null,
        marketRegime: paperResult.regime || run.result?.marketRegime || null
      },
      warnings,
      liveExecution: {
        enabled: false,
        walletSigningEnabled: false,
        note: 'This action created local paper records and one simulated run only. No exchange order, wallet signing, token deployment, or live trading occurred.'
      }
    };
  }

  async function getLatestStrategy(strategyId) {
    const row = strategyId
      ? await dbGet('SELECT * FROM trading_strategies WHERE id = ?', [strategyId])
      : await dbGet("SELECT * FROM trading_strategies WHERE status != 'archived' ORDER BY created_at DESC, id DESC LIMIT 1");

    return parseStrategy(row);
  }

  async function findOrCreateSafePaperSession(strategy, reqBody = {}) {
    const sessionRows = await dbAll(
      `SELECT paper_trading_sessions.*, trading_strategies.name AS strategy_name,
              trading_strategies.market_symbol, trading_strategies.timeframe
       FROM paper_trading_sessions
       LEFT JOIN trading_strategies ON trading_strategies.id = paper_trading_sessions.strategy_id
       WHERE paper_trading_sessions.strategy_id = ?
         AND paper_trading_sessions.status = 'completed'
       ORDER BY paper_trading_sessions.created_at DESC, paper_trading_sessions.id DESC
       LIMIT 25`,
      [strategy.id]
    );
    const existingSession = sessionRows.map(parsePaperSession).find(paperSessionPassed);

    if (existingSession) {
      return {
        session: existingSession,
        reused: true
      };
    }

    let marketImport = reqBody.marketDataImportId
      ? await dbGet('SELECT * FROM market_data_imports WHERE id = ?', [Number(reqBody.marketDataImportId)])
      : await dbGet(
        `SELECT *
         FROM market_data_imports
         WHERE market_symbol = ? AND timeframe = ? AND status != 'archived'
         ORDER BY created_at DESC, id DESC
         LIMIT 1`,
        [strategy.market_symbol, strategy.timeframe]
      );

    if (!marketImport) {
      if (reqBody.marketDataImportId) {
        throw Object.assign(new Error(`No candle data is available for ${strategy.market_symbol} on ${strategy.timeframe}.`), {
          safePaperFailureId: 'market_data_missing'
        });
      }

      marketImport = await createLocalSampleMarketImport(strategy);
    }

    if (marketImport.market_symbol !== strategy.market_symbol || marketImport.timeframe !== strategy.timeframe) {
      throw Object.assign(new Error('Selected market data does not match the strategy market and timeframe.'), {
        safePaperFailureId: 'market_data_missing'
      });
    }

    const candles = await dbAll(
      `SELECT timestamp, open, high, low, close, volume
       FROM market_candles
       WHERE import_id = ?
       ORDER BY timestamp ASC`,
      [marketImport.id]
    );

    if (candles.length < 2) {
      if (reqBody.marketDataImportId) {
        throw Object.assign(new Error('Selected market data does not have enough candles for a paper simulation.'), {
          safePaperFailureId: 'market_data_missing'
        });
      }

      marketImport = await createLocalSampleMarketImport(strategy);
      candles.splice(0, candles.length, ...(await dbAll(
        `SELECT timestamp, open, high, low, close, volume
         FROM market_candles
         WHERE import_id = ?
         ORDER BY timestamp ASC`,
        [marketImport.id]
      )));
    }

    const backtestResult = runCandleBacktest(strategy, candles, marketImport, {
      initialCapital: getPositiveNumber(reqBody.initialCapital, 10000),
      feePercent: getPositiveNumber(reqBody.feePercent, 0.1),
      slippagePercent: getPositiveNumber(reqBody.slippagePercent, 0.05)
    });
    const paperPayload = createPaperReplayPayload(strategy, marketImport, backtestResult, {
      maxDrawdownPercent: 100,
      maxLossStreak: 999,
      minTradeCount: 0
    });
    paperPayload.marketImport.source = marketImport.source;
    paperPayload.marketImport.localSample = marketImport.source === 'local_sample';
    paperPayload.data.source = marketImport.source;
    const result = await dbRun(
      `INSERT INTO paper_trading_sessions
       (strategy_id, market_data_import_id, name, mode, status, initial_capital, current_equity, result_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        strategy.id,
        marketImport.id,
        `${strategy.name} safe paper test`,
        paperPayload.mode,
        'completed',
        Number(backtestResult.settings.initialCapital || 10000),
        paperPayload.metrics.finalEquity,
        JSON.stringify(paperPayload)
      ]
    );
    await insertDecisionLogs({
      strategy,
      marketImport,
      paperSessionId: result.lastID,
      decisions: paperPayload.decisionLog || []
    });
    const row = await dbGet(
      `SELECT paper_trading_sessions.*, trading_strategies.name AS strategy_name,
              trading_strategies.market_symbol, trading_strategies.timeframe
       FROM paper_trading_sessions
       LEFT JOIN trading_strategies ON trading_strategies.id = paper_trading_sessions.strategy_id
       WHERE paper_trading_sessions.id = ?`,
      [result.lastID]
    );
    const session = parsePaperSession(row);

    if (!paperSessionPassed(session)) {
      throw Object.assign(new Error('The safe paper replay was created, but its paper risk gate still needs review.'), {
        safePaperFailureId: 'paper_session_failed',
        session
      });
    }

    return {
      session,
      reused: false
    };
  }

  async function findOrCreateSafeRiskProfile(userId) {
    const rows = await dbAll(
      `SELECT *
       FROM risk_profiles
       WHERE mode = 'paper'
         AND status = 'active'
       ORDER BY CASE WHEN name = ? THEN 0 ELSE 1 END, updated_at DESC, id DESC
       LIMIT 25`,
      [safePaperRiskDefaults.name]
    );
    const existing = rows.map(parseRiskProfile).find(riskProfileIsSafe);

    if (existing) {
      return {
        profile: existing,
        reused: true
      };
    }

    const result = await dbRun(
      `INSERT INTO risk_profiles
       (name, mode, max_order_value, max_position_value, max_daily_loss, max_open_trades, kill_switch_enabled, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        safePaperRiskDefaults.name,
        safePaperRiskDefaults.mode,
        safePaperRiskDefaults.maxOrderValue,
        safePaperRiskDefaults.maxPositionValue,
        safePaperRiskDefaults.maxDailyLoss,
        safePaperRiskDefaults.maxOpenTrades,
        0,
        'active',
        safePaperRiskDefaults.notes
      ]
    );
    const profile = parseRiskProfile(await dbGet('SELECT * FROM risk_profiles WHERE id = ?', [result.lastID]));
    await dbRun(
      `INSERT INTO risk_profile_audit_events
       (risk_profile_id, user_id, event_type, summary, before_json, after_json, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        userId || null,
        'created',
        'Safe paper risk profile auto-created by Run This Strategy Safely.',
        null,
        JSON.stringify(profile),
        JSON.stringify({
          source: 'run_this_strategy_safely',
          liveTradingEnabled: false,
          walletSigningEnabled: false
        })
      ]
    );

    return {
      profile,
      reused: false
    };
  }

  async function findOrCreateSafeConnector() {
    const rows = await dbAll(
      `SELECT *
       FROM exchange_connectors
       WHERE mode = 'paper'
         AND status != 'archived'
       ORDER BY CASE WHEN exchange_name = 'local_paper' THEN 0 ELSE 1 END, updated_at DESC, id DESC
       LIMIT 25`
    );
    const existing = rows.map(parseExchangeConnector).find(connectorIsSafePaper);

    if (existing) {
      return {
        connector: existing,
        reused: true
      };
    }

    const settings = {
      paperOnly: true,
      localOnly: true,
      liveExecution: false,
      liveOrdersEnabled: false,
      walletSigningEnabled: false,
      createdBy: 'run_this_strategy_safely'
    };
    const result = await dbRun(
      `INSERT INTO exchange_connectors
       (secret_reference_id, exchange_name, label, mode, status, settings_json, secret_storage_note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        null,
        'local_paper',
        'Local Paper Connector',
        'paper',
        'configured',
        JSON.stringify(settings),
        'No secrets stored in SQLite. Local paper connector cannot place live orders.'
      ]
    );

    return {
      connector: parseExchangeConnector(await getExchangeConnectorRow(result.lastID)),
      reused: false
    };
  }

  async function findOrCreateReadyPaperPlan({ strategy, paperSession, riskProfile, connector }) {
    const rows = await dbAll(
      `${botAutomationPlanSelect}
       WHERE bot_automation_plans.strategy_id = ?
         AND bot_automation_plans.paper_session_id = ?
         AND bot_automation_plans.risk_profile_id = ?
         AND bot_automation_plans.connector_id = ?
         AND bot_automation_plans.mode = 'paper'
         AND bot_automation_plans.status != 'archived'
       ORDER BY bot_automation_plans.created_at DESC, bot_automation_plans.id DESC
       LIMIT 10`,
      [strategy.id, paperSession.id, riskProfile.id, connector.id]
    );
    const existing = rows.map(parseBotAutomationPlan).find(plan => (
      plan.readiness?.status === 'ready_for_paper'
      || plan.status === 'ready_for_paper'
    ));

    if (existing) {
      return {
        plan: existing,
        reused: true
      };
    }

    const readiness = evaluateBotAutomationReadiness({
      strategy,
      riskProfile,
      paperSession,
      connector,
      mode: 'paper'
    });

    if (readiness.blockingFailures.length || readiness.status !== 'ready_for_paper') {
      throw Object.assign(new Error('The safe paper plan could not pass paper readiness.'), {
        safePaperFailureId: 'plan_not_ready',
        readiness
      });
    }

    const result = await dbRun(
      `INSERT INTO bot_automation_plans
       (strategy_id, paper_session_id, risk_profile_id, connector_id, name, mode, status, market_symbol, timeframe, readiness_json, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        strategy.id,
        paperSession.id,
        riskProfile.id,
        connector.id,
        `${strategy.name} safe paper plan`,
        'paper',
        readiness.status,
        strategy.market_symbol,
        strategy.timeframe,
        JSON.stringify(readiness),
        'Auto-created by Run This Strategy Safely. Paper only. Live trading, wallet signing, and exchange order placement remain disabled.'
      ]
    );

    return {
      plan: parseBotAutomationPlan(await getBotAutomationPlanRow(result.lastID)),
      reused: false
    };
  }

  async function findOrCreateActivePaperSchedule(plan) {
    const rows = await dbAll(
      `${botAutomationScheduleSelect}
       WHERE bot_automation_schedules.plan_id = ?
         AND bot_automation_schedules.status != 'archived'
       ORDER BY CASE WHEN bot_automation_schedules.status = 'active' THEN 0 ELSE 1 END,
                bot_automation_schedules.created_at DESC,
                bot_automation_schedules.id DESC
       LIMIT 10`,
      [plan.id]
    );
    const schedules = rows.map(parseBotAutomationSchedule);
    const existingActive = schedules.find(schedule => schedule.status === 'active');

    if (existingActive) {
      return {
        schedule: existingActive,
        reused: true
      };
    }

    const reusable = schedules[0];

    if (reusable) {
      await dbRun(
        `UPDATE bot_automation_schedules
         SET status = 'active',
             next_run_at = COALESCE(next_run_at, CURRENT_TIMESTAMP),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [reusable.id]
      );
      scheduleBotAutomationWorker();

      return {
        schedule: parseBotAutomationSchedule(await getBotAutomationScheduleRow(reusable.id)),
        reused: true
      };
    }

    const result = await dbRun(
      `INSERT INTO bot_automation_schedules
       (plan_id, interval_minutes, status, settings_json, next_run_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        plan.id,
        15,
        'active',
        JSON.stringify({
          positionOpen: false,
          createdBy: 'run_this_strategy_safely',
          paperOnly: true
        }),
        new Date().toISOString()
      ]
    );
    scheduleBotAutomationWorker();

    return {
      schedule: parseBotAutomationSchedule(await getBotAutomationScheduleRow(result.lastID)),
      reused: false
    };
  }

  app.post('/api/v1/strategies/:id/run-safe-paper-test', requireAuth, async (req, res) => {
    try {
      const strategy = await getLatestStrategy(req.params.id);

      if (!strategy) {
        return res.status(404).json(buildSafePaperError('strategy_not_found', 'No saved strategy was found.'));
      }

      const reused = {};
      const paperSessionResult = await findOrCreateSafePaperSession(strategy, req.body || {});
      reused.paperSession = paperSessionResult.reused;
      const riskProfileResult = await findOrCreateSafeRiskProfile(req.session.userId);
      reused.riskProfile = riskProfileResult.reused;
      const connectorResult = await findOrCreateSafeConnector();
      reused.connector = connectorResult.reused;
      const planResult = await findOrCreateReadyPaperPlan({
        strategy,
        paperSession: paperSessionResult.session,
        riskProfile: riskProfileResult.profile,
        connector: connectorResult.connector
      });
      reused.plan = planResult.reused;
      const scheduleResult = await findOrCreateActivePaperSchedule(planResult.plan);
      reused.schedule = scheduleResult.reused;
      const runResult = await runBotAutomationSchedule(scheduleResult.schedule.id, { force: true });
      const schedule = runResult.schedule || scheduleResult.schedule;
      const run = runResult.run;
      const summary = summarizeSafePaperResults({
        strategy,
        paperSession: paperSessionResult.session,
        riskProfile: riskProfileResult.profile,
        connector: connectorResult.connector,
        plan: planResult.plan,
        schedule,
        run,
        reused
      });

      res.status(201).json({
        status: 'complete',
        message: 'Safe paper test completed. Local paper schedule is active. No live trading or wallet signing was enabled.',
        strategy,
        paperSession: paperSessionResult.session,
        riskProfile: riskProfileResult.profile,
        connector: connectorResult.connector,
        plan: planResult.plan,
        schedule,
        run,
        verification: {
          status: 'complete',
          label: 'Paper trading verified for this strategy.',
          checks: [
            'Strategy saved',
            'Safe paper session ready',
            'Safe paper risk profile active',
            'Local paper connector ready',
            'Ready paper plan connected',
            'Safe paper schedule active',
            'Local paper simulation completed',
            'Live trading disabled',
            'Wallet signing disabled'
          ],
          autoRetry: 'All auto-fixable paper components were created or reused before this verification ran.'
        },
        results: summary
      });
    } catch (error) {
      const id = error.safePaperFailureId || 'simulation_failed';
      const status = id === 'market_data_missing' ? 400 : 500;

      res.status(error.statusCode || status).json(buildSafePaperError(id, error.message, {
        readiness: error.readiness,
        session: error.session
      }));
    }
  });

  app.get('/api/v1/bot-automation-capability-path', requireAuth, async (req, res) => {
    try {
      const [planRows, runRows, scheduleRows] = await Promise.all([
        dbAll(
          `${botAutomationPlanSelect}
           ORDER BY bot_automation_plans.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `${botAutomationRunSelect}
           ORDER BY bot_automation_runs.created_at DESC, bot_automation_runs.id DESC
           LIMIT 500`
        ),
        dbAll(
          `${botAutomationScheduleSelect}
           ORDER BY bot_automation_schedules.created_at DESC, bot_automation_schedules.id DESC
           LIMIT 500`
        )
      ]);
      const capabilityPath = buildBotAutomationCapabilityPath({
        plans: planRows.map(parseBotAutomationPlan),
        runs: runRows.map(parseBotAutomationRun),
        schedules: scheduleRows.map(parseBotAutomationSchedule)
      });

      res.json({ capabilityPath });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-plans', requireAuth, async (req, res) => {
    try {
      const params = [];
      const where = [];

      if (req.query.strategyId) {
        where.push('bot_automation_plans.strategy_id = ?');
        params.push(Number(req.query.strategyId));
      }

      const rows = await dbAll(
        `${botAutomationPlanSelect}
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY bot_automation_plans.created_at DESC
         LIMIT 100`,
        params
      );

      res.json({ plans: rows.map(parseBotAutomationPlan) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-plans/:id', requireAuth, async (req, res) => {
    try {
      const row = await getBotAutomationPlanRow(req.params.id);

      if (!row) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      res.json({ plan: parseBotAutomationPlan(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-plans/:id/safety-dossier', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      const [readinessRows, reviewRows, runRows, scheduleRows] = await Promise.all([
        dbAll(
          `${botLiveReadinessEventSelect}
           WHERE bot_live_readiness_events.plan_id = ?
           ORDER BY bot_live_readiness_events.created_at DESC, bot_live_readiness_events.id DESC
           LIMIT 25`,
          [plan.id]
        ),
        dbAll(
          `${botLiveEnablementReviewSelect}
           WHERE bot_live_enablement_reviews.plan_id = ?
           ORDER BY bot_live_enablement_reviews.created_at DESC, bot_live_enablement_reviews.id DESC
           LIMIT 25`,
          [plan.id]
        ),
        dbAll(
          `${botAutomationRunSelect}
           WHERE bot_automation_runs.plan_id = ?
           ORDER BY bot_automation_runs.created_at DESC, bot_automation_runs.id DESC
           LIMIT 25`,
          [plan.id]
        ),
        dbAll(
          `${botAutomationScheduleSelect}
           WHERE bot_automation_schedules.plan_id = ?
           ORDER BY bot_automation_schedules.created_at DESC, bot_automation_schedules.id DESC
           LIMIT 25`,
          [plan.id]
        )
      ]);
      const liveReadinessEvents = readinessRows.map(parseBotLiveReadinessEvent);
      const goLiveReviews = reviewRows.map(parseBotLiveEnablementReview);
      const paperRuns = runRows.map(parseBotAutomationRun);
      const schedules = scheduleRows.map(parseBotAutomationSchedule);
      const latestLiveReadiness = liveReadinessEvents[0] || null;
      const latestGoLiveReview = goLiveReviews[0] || null;
      const latestPaperRun = paperRuns[0] || null;
      const latestSchedule = schedules[0] || null;
      const latestChecklist = Array.isArray(latestGoLiveReview?.review?.checklist)
        ? latestGoLiveReview.review.checklist
        : [];
      const failureSources = [
        plan.readiness,
        latestLiveReadiness?.readiness,
        latestGoLiveReview?.review,
        latestPaperRun?.result
      ];
      const blockingFailures = Array.from(new Set(
        failureSources.flatMap(source => [
          ...(source?.blockingFailures || []),
          ...(source?.failures || [])
        ]).filter(Boolean)
      ));
      const activeSchedules = schedules.filter(schedule => schedule.status === 'active');
      const reviewedChecklistCount = latestChecklist.filter(item => item.reviewed).length;
      const readinessStatus = plan.readiness?.status || plan.status;
      const paperAutomationReady = plan.mode === 'paper'
        && readinessStatus === 'ready_for_paper'
        && !blockingFailures.length
        && plan.status !== 'archived';
      const dossierStatus = plan.status === 'archived'
        ? 'archived'
        : (blockingFailures.length
          ? 'blocked'
          : (paperAutomationReady
            ? 'paper_ready'
            : (plan.mode === 'live_disabled' ? 'live_blocked' : 'review_required')));
      const statusExplanation = buildBotSafetyDossierExplanation({
        plan,
        dossierStatus,
        paperAutomationReady,
        blockingFailures,
        activeSchedules
      });

      res.json({
        plan,
        dossier: {
          status: dossierStatus,
          statusExplanation,
          mode: plan.mode,
          paperAutomationReady,
          liveBlocked: true,
          liveExecution: {
            enabled: false,
            orderEndpointEnabled: false,
            goLiveAllowed: false,
            note: 'Safety dossier is monitor-only and cannot enable live execution.'
          },
          counts: {
            liveReadinessEvents: liveReadinessEvents.length,
            goLiveReviews: goLiveReviews.length,
            paperRuns: paperRuns.length,
            schedules: schedules.length,
            activeSchedules: activeSchedules.length,
            reviewedChecklistItems: reviewedChecklistCount,
            totalChecklistItems: latestChecklist.length
          },
          latest: {
            liveReadiness: latestLiveReadiness,
            goLiveReview: latestGoLiveReview,
            paperRun: latestPaperRun,
            schedule: latestSchedule
          },
          blockingFailures,
          generatedAt: new Date().toISOString()
        },
        history: {
          liveReadinessEvents,
          goLiveReviews,
          paperRuns,
          schedules
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Bot automation plans cannot store secrets.',
          sensitiveFields
        });
      }

      const strategyId = Number(req.body?.strategyId);
      const paperSessionId = req.body?.paperSessionId ? Number(req.body.paperSessionId) : null;
      const riskProfileId = req.body?.riskProfileId ? Number(req.body.riskProfileId) : null;
      const connectorId = req.body?.connectorId ? Number(req.body.connectorId) : null;
      const mode = String(req.body?.mode || 'paper').trim().toLowerCase();
      const allowedModes = new Set(['paper', 'live_disabled']);
      const notes = String(req.body?.notes || '').trim().slice(0, 1000);

      if (!Number.isInteger(strategyId) || strategyId <= 0) {
        return res.status(400).json({ error: 'Strategy is required' });
      }

      if (!allowedModes.has(mode)) {
        return res.status(400).json({ error: 'Mode must be paper or live_disabled' });
      }

      const context = await loadBotAutomationReadinessContext(strategyId, riskProfileId, paperSessionId, connectorId);

      if (!context.strategy) {
        return res.status(400).json({ error: 'Strategy not found' });
      }

      if (riskProfileId && !context.riskProfile) {
        return res.status(400).json({ error: 'Risk profile not found' });
      }

      if (paperSessionId && !context.paperSession) {
        return res.status(400).json({ error: 'Paper session not found' });
      }

      if (connectorId && !context.connector) {
        return res.status(400).json({ error: 'Exchange connector not found' });
      }

      if (context.paperSession && Number(context.paperSession.strategy_id) !== strategyId) {
        return res.status(400).json({ error: 'Paper session must belong to the selected strategy' });
      }

      const name = String(req.body?.name || `${context.strategy.name} bot readiness`).trim().slice(0, 120);

      if (!name) {
        return res.status(400).json({ error: 'Bot automation plan name is required' });
      }

      const readiness = evaluateBotAutomationReadiness({
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector,
        mode
      });
      const result = await dbRun(
        `INSERT INTO bot_automation_plans
         (strategy_id, paper_session_id, risk_profile_id, connector_id, name, mode, status, market_symbol, timeframe, readiness_json, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          strategyId,
          paperSessionId,
          riskProfileId,
          connectorId,
          name,
          mode,
          readiness.status,
          context.strategy.market_symbol,
          context.strategy.timeframe,
          JSON.stringify(readiness),
          notes
        ]
      );
      const row = await getBotAutomationPlanRow(result.lastID);

      res.status(201).json({ plan: parseBotAutomationPlan(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/bot-automation-plans/:id', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Bot automation plans cannot store secrets.',
          sensitiveFields
        });
      }

      const current = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!current) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      const requestedStatus = req.body?.status !== undefined
        ? String(req.body.status).trim().toLowerCase()
        : null;

      if (requestedStatus && requestedStatus !== 'archived') {
        return res.status(400).json({ error: 'Bot plan status can only be archived through this endpoint.' });
      }

      if (current.status === 'archived' && requestedStatus !== 'archived') {
        return res.status(400).json({ error: 'Archived bot automation plans cannot be edited.' });
      }

      if (requestedStatus === 'archived') {
        await dbRun(
          `UPDATE bot_automation_schedules
           SET status = 'archived',
               next_run_at = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE plan_id = ?`,
          [current.id]
        );
        await dbRun(
          `UPDATE bot_automation_plans
           SET status = 'archived',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [current.id]
        );

        return res.json({ plan: parseBotAutomationPlan(await getBotAutomationPlanRow(current.id)) });
      }

      const hasPaperSessionId = Object.prototype.hasOwnProperty.call(req.body || {}, 'paperSessionId');
      const hasRiskProfileId = Object.prototype.hasOwnProperty.call(req.body || {}, 'riskProfileId');
      const hasConnectorId = Object.prototype.hasOwnProperty.call(req.body || {}, 'connectorId');
      const paperSessionId = hasPaperSessionId && req.body.paperSessionId ? Number(req.body.paperSessionId) : (hasPaperSessionId ? null : current.paper_session_id);
      const riskProfileId = hasRiskProfileId && req.body.riskProfileId ? Number(req.body.riskProfileId) : (hasRiskProfileId ? null : current.risk_profile_id);
      const connectorId = hasConnectorId && req.body.connectorId ? Number(req.body.connectorId) : (hasConnectorId ? null : current.connector_id);
      const mode = req.body?.mode !== undefined
        ? String(req.body.mode).trim().toLowerCase()
        : current.mode;
      const allowedModes = new Set(['paper', 'live_disabled']);
      const name = req.body?.name !== undefined
        ? String(req.body.name || '').trim().slice(0, 120)
        : current.name;
      const notes = req.body?.notes !== undefined
        ? String(req.body.notes || '').trim().slice(0, 1000)
        : current.notes;

      if (!name) {
        return res.status(400).json({ error: 'Bot automation plan name is required' });
      }

      if (!allowedModes.has(mode)) {
        return res.status(400).json({ error: 'Mode must be paper or live_disabled' });
      }

      const context = await loadBotAutomationReadinessContext(current.strategy_id, riskProfileId, paperSessionId, connectorId);

      if (riskProfileId && !context.riskProfile) {
        return res.status(400).json({ error: 'Risk profile not found' });
      }

      if (paperSessionId && !context.paperSession) {
        return res.status(400).json({ error: 'Paper session not found' });
      }

      if (connectorId && !context.connector) {
        return res.status(400).json({ error: 'Exchange connector not found' });
      }

      if (context.paperSession && Number(context.paperSession.strategy_id) !== Number(current.strategy_id)) {
        return res.status(400).json({ error: 'Paper session must belong to the selected strategy' });
      }

      const readiness = evaluateBotAutomationReadiness({
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector,
        mode
      });

      await dbRun(
        `UPDATE bot_automation_plans
         SET paper_session_id = ?,
             risk_profile_id = ?,
             connector_id = ?,
             name = ?,
             mode = ?,
             status = ?,
             readiness_json = ?,
             notes = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          paperSessionId,
          riskProfileId,
          connectorId,
          name,
          mode,
          readiness.status,
          JSON.stringify(readiness),
          notes,
          current.id
        ]
      );

      if (mode !== 'paper') {
        await dbRun(
          `UPDATE bot_automation_schedules
           SET status = 'archived',
               next_run_at = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE plan_id = ?`,
          [current.id]
        );
      }

      res.json({ plan: parseBotAutomationPlan(await getBotAutomationPlanRow(current.id)) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/review', requireAuth, async (req, res) => {
    try {
      const current = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!current) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      if (current.status === 'archived') {
        return res.status(400).json({ error: 'Archived bot automation plans cannot be reviewed.' });
      }

      const context = await loadBotAutomationReadinessContext(
        current.strategy_id,
        current.risk_profile_id,
        current.paper_session_id,
        current.connector_id
      );
      const readiness = evaluateBotAutomationReadiness({
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector,
        mode: current.mode
      });

      await dbRun(
        `UPDATE bot_automation_plans
         SET status = ?, readiness_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [readiness.status, JSON.stringify(readiness), req.params.id]
      );
      const row = await getBotAutomationPlanRow(req.params.id);

      res.json({ plan: parseBotAutomationPlan(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/live-readiness', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      const context = await loadBotAutomationReadinessContext(
        plan.strategy_id,
        plan.risk_profile_id,
        plan.paper_session_id,
        plan.connector_id
      );
      const readiness = evaluateBotLiveReadiness({
        plan,
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector
      });
      const result = await dbRun(
        `INSERT INTO bot_live_readiness_events
         (plan_id, user_id, status, readiness_json)
         VALUES (?, ?, ?, ?)`,
        [
          plan.id,
          req.session.userId,
          readiness.status,
          JSON.stringify(readiness)
        ]
      );
      const event = parseBotLiveReadinessEvent(await getBotLiveReadinessEventRow(result.lastID));

      res.json({ readiness, event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-plans/:id/live-readiness-events', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      const rows = await dbAll(
        `${botLiveReadinessEventSelect}
         WHERE bot_live_readiness_events.plan_id = ?
         ORDER BY bot_live_readiness_events.created_at DESC, bot_live_readiness_events.id DESC
         LIMIT 100`,
        [plan.id]
      );

      res.json({ events: rows.map(parseBotLiveReadinessEvent) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-live-readiness-events/:id', requireAuth, async (req, res) => {
    try {
      const event = parseBotLiveReadinessEvent(await getBotLiveReadinessEventRow(req.params.id));

      if (!event) {
        return res.status(404).json({ error: 'Bot live-readiness event not found' });
      }

      res.json({ event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/live-enablement-reviews', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      if (plan.status === 'archived') {
        return res.status(400).json({ error: 'Archived bot automation plans cannot draft go-live enablement reviews.' });
      }

      if (plan.mode !== 'live_disabled') {
        return res.status(400).json({ error: 'Only live-disabled bot automation plans can draft go-live enablement reviews.' });
      }

      const context = await loadBotAutomationReadinessContext(
        plan.strategy_id,
        plan.risk_profile_id,
        plan.paper_session_id,
        plan.connector_id
      );
      const readiness = evaluateBotLiveReadiness({
        plan,
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector
      });
      const review = createBotLiveEnablementReviewPayload({ plan, readiness });
      const result = await dbRun(
        `INSERT INTO bot_live_enablement_reviews
         (plan_id, user_id, status, review_json)
         VALUES (?, ?, ?, ?)`,
        [
          plan.id,
          req.session.userId,
          review.status,
          JSON.stringify(review)
        ]
      );
      const row = await getBotLiveEnablementReviewRow(result.lastID);

      res.status(201).json({ review: parseBotLiveEnablementReview(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/go-live-command', requireAuth, async (req, res) => {
    try {
      assertNoInlineSecretPayload(
        { commandText: req.body?.commandText || '' },
        'Go-live command text cannot contain secret-looking values.'
      );
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      if (plan.status === 'archived') {
        return res.status(400).json({ error: 'Archived bot automation plans cannot parse go-live commands.' });
      }

      if (plan.mode !== 'live_disabled') {
        return res.status(400).json({ error: 'Only live-disabled bot automation plans can parse go-live commands.' });
      }

      const ownerCommand = parseOwnerGoLiveCommand(req.body?.commandText);

      if (!ownerCommand.commandText) {
        return res.status(400).json({ error: 'Go-live command text is required' });
      }

      if (!ownerCommand.recognized) {
        return res.status(400).json({
          error: 'Go-live command intent was not recognized.',
          command: ownerCommand
        });
      }

      const context = await loadBotAutomationReadinessContext(
        plan.strategy_id,
        plan.risk_profile_id,
        plan.paper_session_id,
        plan.connector_id
      );
      const readiness = evaluateBotLiveReadiness({
        plan,
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector
      });
      const review = createBotLiveEnablementReviewPayload({ plan, readiness });
      review.stage = 'owner_go_live_command_blocked';
      review.ownerCommand = ownerCommand;
      review.ownerConfirmation = {
        ...(review.ownerConfirmation || {}),
        provided: false,
        acceptedHere: false,
        commandRecognized: true,
        note: 'Owner go-live wording was recognized, but this build refuses execution because live gates are not implemented.'
      };
      review.blockingFailures = Array.from(new Set([
        ...(review.blockingFailures || []),
        'go_live_command_blocked_by_disabled_execution'
      ]));
      review.failures = Array.from(new Set([
        ...(review.failures || []),
        'go_live_command_blocked_by_disabled_execution'
      ]));
      review.liveExecution = {
        enabled: false,
        orderEndpointEnabled: false,
        goLiveAllowed: false,
        note: 'Go-live command recognized but refused. No live order endpoint, credential loader, or exchange adapter is enabled.'
      };
      review.generatedAt = new Date().toISOString();

      const result = await dbRun(
        `INSERT INTO bot_live_enablement_reviews
         (plan_id, user_id, status, review_json)
         VALUES (?, ?, ?, ?)`,
        [
          plan.id,
          req.session.userId,
          'blocked',
          JSON.stringify(review)
        ]
      );
      const row = await getBotLiveEnablementReviewRow(result.lastID);

      res.status(201).json({
        command: ownerCommand,
        review: parseBotLiveEnablementReview(row)
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        sensitiveFields: error.sensitiveFields,
        likelySecretValues: error.likelySecretValues
      });
    }
  });

  app.get('/api/v1/bot-automation-plans/:id/live-enablement-reviews', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      const rows = await dbAll(
        `${botLiveEnablementReviewSelect}
         WHERE bot_live_enablement_reviews.plan_id = ?
         ORDER BY bot_live_enablement_reviews.created_at DESC, bot_live_enablement_reviews.id DESC
         LIMIT 100`,
        [plan.id]
      );

      res.json({ reviews: rows.map(parseBotLiveEnablementReview) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-live-enablement-reviews/:id', requireAuth, async (req, res) => {
    try {
      const review = parseBotLiveEnablementReview(await getBotLiveEnablementReviewRow(req.params.id));

      if (!review) {
        return res.status(404).json({ error: 'Bot live enablement review not found' });
      }

      res.json({ review });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/bot-live-enablement-reviews/:id', requireAuth, async (req, res) => {
    try {
      const row = await getBotLiveEnablementReviewRow(req.params.id);
      const current = parseBotLiveEnablementReview(row);

      if (!current) {
        return res.status(404).json({ error: 'Bot live enablement review not found' });
      }

      const itemId = String(req.body?.checklistItemId || '').trim();
      const reviewed = Boolean(req.body?.reviewed);
      const note = String(req.body?.note || '').trim().slice(0, 500);
      const reviewJson = current.review || {};
      const checklist = Array.isArray(reviewJson.checklist) ? reviewJson.checklist : [];
      const item = checklist.find(entry => entry.id === itemId);

      if (!item) {
        return res.status(400).json({ error: 'Checklist item not found for this go-live review' });
      }

      item.reviewed = reviewed;
      item.reviewedAt = reviewed ? new Date().toISOString() : null;
      item.reviewedByUserId = reviewed ? req.session.userId : null;
      item.reviewNote = note;
      item.passed = false;
      reviewJson.checklist = checklist;
      reviewJson.status = 'blocked';
      reviewJson.liveExecution = {
        ...(reviewJson.liveExecution || {}),
        enabled: false,
        orderEndpointEnabled: false,
        goLiveAllowed: false,
        note: 'Checklist review cannot enable live execution.'
      };
      reviewJson.updatedAt = new Date().toISOString();

      await dbRun(
        `UPDATE bot_live_enablement_reviews
         SET status = ?, review_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        ['blocked', JSON.stringify(reviewJson), current.id]
      );
      const updated = parseBotLiveEnablementReview(await getBotLiveEnablementReviewRow(current.id));

      res.json({ review: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-runs', requireAuth, async (req, res) => {
    try {
      const where = [];
      const params = [];

      if (req.query.planId) {
        where.push('bot_automation_runs.plan_id = ?');
        params.push(Number(req.query.planId));
      }

      if (req.query.strategyId) {
        where.push('bot_automation_runs.strategy_id = ?');
        params.push(Number(req.query.strategyId));
      }

      const rows = await dbAll(
        `${botAutomationRunSelect}
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY bot_automation_runs.created_at DESC
         LIMIT 100`,
        params
      );

      res.json({ runs: rows.map(parseBotAutomationRun) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-runs/:id', requireAuth, async (req, res) => {
    try {
      const row = await getBotAutomationRunRow(req.params.id);

      if (!row) {
        return res.status(404).json({ error: 'Bot automation run not found' });
      }

      res.json({ run: parseBotAutomationRun(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/paper-runs', requireAuth, async (req, res) => {
    try {
      const run = await createBotAutomationPaperRun(req.params.id, {
        marketDataImportId: req.body?.marketDataImportId,
        positionOpen: Boolean(req.body?.positionOpen)
      });

      res.status(201).json({ run });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        readiness: error.readiness
      });
    }
  });

  app.get('/api/v1/bot-automation-schedules', requireAuth, async (req, res) => {
    try {
      const where = [];
      const params = [];

      if (req.query.planId) {
        where.push('bot_automation_schedules.plan_id = ?');
        params.push(Number(req.query.planId));
      }

      if (req.query.strategyId) {
        where.push('bot_automation_plans.strategy_id = ?');
        params.push(Number(req.query.strategyId));
      }

      if (req.query.status) {
        const status = String(req.query.status).trim().toLowerCase();
        const allowedStatuses = new Set(['paused', 'active', 'archived']);

        if (!allowedStatuses.has(status)) {
          return res.status(400).json({ error: 'Schedule status must be paused, active, or archived' });
        }

        where.push('bot_automation_schedules.status = ?');
        params.push(status);
      }

      const rows = await dbAll(
        `${botAutomationScheduleSelect}
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY bot_automation_schedules.created_at DESC
         LIMIT 100`,
        params
      );

      res.json({ schedules: rows.map(parseBotAutomationSchedule) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-schedules/:id', requireAuth, async (req, res) => {
    try {
      const schedule = parseBotAutomationSchedule(await getBotAutomationScheduleRow(req.params.id));

      if (!schedule) {
        return res.status(404).json({ error: 'Bot automation schedule not found' });
      }

      res.json({ schedule });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/schedules', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      if (plan.status === 'archived') {
        return res.status(400).json({ error: 'Archived bot automation plans cannot be scheduled.' });
      }

      if (plan.mode !== 'paper') {
        return res.status(400).json({ error: 'Only paper-mode bot automation plans can be scheduled.' });
      }

      const intervalMinutes = Math.max(Math.floor(getPositiveNumber(req.body?.intervalMinutes, 15)), 1);
      const status = String(req.body?.status || 'paused').trim().toLowerCase();
      const allowedStatuses = new Set(['paused', 'active']);

      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Schedule status must be paused or active' });
      }

      const settings = {
        positionOpen: Boolean(req.body?.positionOpen)
      };
      const nextRunAt = status === 'active' ? new Date().toISOString() : null;
      const result = await dbRun(
        `INSERT INTO bot_automation_schedules
         (plan_id, interval_minutes, status, settings_json, next_run_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          plan.id,
          intervalMinutes,
          status,
          JSON.stringify(settings),
          nextRunAt
        ]
      );

      if (status === 'active') {
        scheduleBotAutomationWorker();
      }

      const schedule = parseBotAutomationSchedule(await getBotAutomationScheduleRow(result.lastID));

      res.status(201).json({ schedule });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/bot-automation-schedules/:id', requireAuth, async (req, res) => {
    try {
      const current = parseBotAutomationSchedule(await getBotAutomationScheduleRow(req.params.id));

      if (!current) {
        return res.status(404).json({ error: 'Bot automation schedule not found' });
      }

      const status = req.body?.status !== undefined
        ? String(req.body.status).trim().toLowerCase()
        : current.status;
      const allowedStatuses = new Set(['paused', 'active', 'archived']);
      const intervalMinutes = req.body?.intervalMinutes !== undefined
        ? Math.max(Math.floor(getPositiveNumber(req.body.intervalMinutes, current.interval_minutes)), 1)
        : current.interval_minutes;
      const settings = {
        ...current.settings,
        ...(req.body?.positionOpen !== undefined ? { positionOpen: Boolean(req.body.positionOpen) } : {})
      };

      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Schedule status must be paused, active, or archived' });
      }

      const nextRunAt = status === 'active'
        ? (current.next_run_at || new Date().toISOString())
        : null;

      await dbRun(
        `UPDATE bot_automation_schedules
         SET interval_minutes = ?,
             status = ?,
             settings_json = ?,
             next_run_at = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          intervalMinutes,
          status,
          JSON.stringify(settings),
          nextRunAt,
          current.id
        ]
      );

      if (status === 'active') {
        scheduleBotAutomationWorker();
      }

      const schedule = parseBotAutomationSchedule(await getBotAutomationScheduleRow(current.id));

      res.json({ schedule });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-schedules/:id/run', requireAuth, async (req, res) => {
    try {
      const result = await runBotAutomationSchedule(req.params.id, { force: true });

      res.status(201).json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerBotAutomationRoutes
};
