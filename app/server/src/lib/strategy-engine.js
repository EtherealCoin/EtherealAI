const {
  classifyMarketRegime
} = require('./market-data');
const {
  roundNumber,
  getBacktestNumber,
  parseSweepNumberList,
  calculateMaxDrawdownPercent,
  average
} = require('./strategy-math');
const {
  createSignalEvaluator
} = require('./strategy-signals');
const {
  isArbitrageStrategyType,
  runArbitrageBacktest,
  createArbitragePaperBotDecision
} = require('./strategy-arbitrage');

function runCandleBacktest(strategy, candles, marketImport, options = {}) {
  if (candles.length < 2) {
    throw new Error('At least two candles are required to run a backtest');
  }

  if (isArbitrageStrategyType(strategy.strategy_type)) {
    return runArbitrageBacktest(strategy, candles, marketImport, options);
  }

  const normalizedCandles = candles.map(candle => ({
    timestamp: candle.timestamp,
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close),
    volume: Number(candle.volume)
  }));
  const initialCapital = getBacktestNumber(options.initialCapital, 10000, 1);
  const feePercent = getBacktestNumber(options.feePercent, 0.1);
  const slippagePercent = getBacktestNumber(options.slippagePercent, 0.05);
  const stopLossPercent = getBacktestNumber(options.stopLossPercent ?? strategy.stop_loss, 0);
  const takeProfitPercent = getBacktestNumber(options.takeProfitPercent ?? strategy.take_profit, 0);
  const feeFraction = feePercent / 100;
  const slippageFraction = slippagePercent / 100;
  const signalEvaluator = createSignalEvaluator(strategy, normalizedCandles);
  const regime = classifyMarketRegime(normalizedCandles);
  const trades = [];
  const decisionLog = [];
  const equityCurve = [initialCapital];
  let equity = initialCapital;
  let position = null;
  let exposureCandles = 0;
  let totalDecisionCount = 0;

  function pushDecision(candle, candleIndex, decision, reason, payload = {}) {
    totalDecisionCount += 1;
    decisionLog.push({
      candleIndex,
      timestamp: candle.timestamp,
      decision,
      reason,
      price: roundNumber(payload.price ?? candle.open, 8),
      positionOpen: Boolean(position),
      payload
    });

    if (decisionLog.length > 200) {
      decisionLog.shift();
    }
  }

  function closePosition(rawExitPrice, reason, candle, candleIndex) {
    const effectiveEntry = position.rawEntryPrice * (1 + slippageFraction);
    const effectiveExit = rawExitPrice * (1 - slippageFraction);
    const grossReturnFraction = (effectiveExit / effectiveEntry) - 1;
    const netReturnFraction = grossReturnFraction - (feeFraction * 2);
    const startingEquity = equity;
    const pnl = startingEquity * netReturnFraction;
    equity += pnl;
    exposureCandles += Math.max(1, candleIndex - position.entryIndex + 1);

    trades.push({
      entryAt: position.timestamp,
      exitAt: candle.timestamp,
      entryPrice: roundNumber(position.rawEntryPrice, 8),
      exitPrice: roundNumber(rawExitPrice, 8),
      grossReturnPercent: roundNumber(grossReturnFraction * 100),
      netReturnPercent: roundNumber(netReturnFraction * 100),
      pnl: roundNumber(pnl),
      equityAfter: roundNumber(equity),
      exitReason: reason,
      candlesHeld: Math.max(1, candleIndex - position.entryIndex + 1)
    });
    pushDecision(candle, candleIndex, 'exit', reason, {
      price: rawExitPrice,
      entryPrice: position.rawEntryPrice,
      grossReturnPercent: roundNumber(grossReturnFraction * 100),
      netReturnPercent: roundNumber(netReturnFraction * 100),
      pnl: roundNumber(pnl),
      equityAfter: roundNumber(equity)
    });

    equityCurve.push(equity);
    position = null;
  }

  for (let index = 0; index < normalizedCandles.length; index += 1) {
    const candle = normalizedCandles[index];
    let decisionRecorded = false;

    if (position && signalEvaluator.shouldExitAtOpen(index)) {
      closePosition(candle.open, 'exit_rule', candle, index);
      decisionRecorded = true;
    }

    if (!position && signalEvaluator.shouldEnterAtOpen(index)) {
      position = {
        rawEntryPrice: candle.open,
        timestamp: candle.timestamp,
        entryIndex: index
      };
      pushDecision(candle, index, 'enter', 'entry_rule', {
        price: candle.open,
        parsedEntryRule: signalEvaluator.entryRule || { kind: 'buy_and_hold_baseline' }
      });
      decisionRecorded = true;
    }

    if (position) {
      const stopPrice = stopLossPercent > 0
        ? position.rawEntryPrice * (1 - (stopLossPercent / 100))
        : null;
      const takeProfitPrice = takeProfitPercent > 0
        ? position.rawEntryPrice * (1 + (takeProfitPercent / 100))
        : null;

      if (stopPrice && candle.low <= stopPrice) {
        closePosition(stopPrice, 'stop_loss', candle, index);
        decisionRecorded = true;
      } else if (takeProfitPrice && candle.high >= takeProfitPrice) {
        closePosition(takeProfitPrice, 'take_profit', candle, index);
        decisionRecorded = true;
      } else if (!decisionRecorded) {
        pushDecision(candle, index, 'hold', 'position_open_no_exit_signal', {
          entryPrice: position.rawEntryPrice,
          stopPrice: stopPrice ? roundNumber(stopPrice, 8) : null,
          takeProfitPrice: takeProfitPrice ? roundNumber(takeProfitPrice, 8) : null
        });
        decisionRecorded = true;
      }
    }

    if (!position && !decisionRecorded) {
      pushDecision(candle, index, 'wait', 'entry_signal_false', {
        parsedEntryRule: signalEvaluator.entryRule || { kind: 'buy_and_hold_baseline' }
      });
    }
  }

  if (position) {
    const lastCandle = normalizedCandles[normalizedCandles.length - 1];
    closePosition(lastCandle.close, 'final_candle', lastCandle, normalizedCandles.length - 1);
  }

  const winningTrades = trades.filter(trade => trade.netReturnPercent > 0);
  const losingTrades = trades.filter(trade => trade.netReturnPercent < 0);
  const grossProfit = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));
  let lossStreak = 0;
  let maxLossStreak = 0;

  for (const trade of trades) {
    if (trade.netReturnPercent < 0) {
      lossStreak += 1;
      maxLossStreak = Math.max(maxLossStreak, lossStreak);
    } else {
      lossStreak = 0;
    }
  }

  return {
    mode: 'candle_backtest_v1',
    warning: 'Research-only backtest. This is not live trading advice and should be paper traded with hard risk limits before any execution.',
    data: {
      importId: marketImport.id,
      marketSymbol: marketImport.market_symbol,
      timeframe: marketImport.timeframe,
      candleCount: normalizedCandles.length,
      firstTimestamp: normalizedCandles[0].timestamp,
      lastTimestamp: normalizedCandles[normalizedCandles.length - 1].timestamp
    },
    regime,
    settings: {
      initialCapital: roundNumber(initialCapital),
      feePercent,
      slippagePercent,
      stopLossPercent,
      takeProfitPercent
    },
    parsedRules: {
      entry: signalEvaluator.entryRule || { kind: 'buy_and_hold_baseline', label: 'buy first candle open' },
      exit: signalEvaluator.exitRule || { kind: 'risk_or_final_candle', label: 'risk controls or final candle close' },
      warnings: signalEvaluator.warnings
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
      profitFactor: grossLoss > 0 ? roundNumber(grossProfit / grossLoss) : null,
      maxLossStreak,
      exposurePercent: roundNumber((exposureCandles / normalizedCandles.length) * 100)
    },
    trades: trades.slice(-100),
    decisionLog,
    decisionSummary: {
      totalDecisionCount,
      storedDecisionCount: decisionLog.length,
      counts: decisionLog.reduce((counts, item) => {
        counts[item.decision] = (counts[item.decision] || 0) + 1;
        return counts;
      }, {})
    },
    nextSteps: [
      'Add more supported rule templates for your exact strategy language.',
      'Run against larger historical datasets.',
      'Compare results across fees, slippage, market regimes, and timeframes.',
      'Paper trade before any live execution.'
    ]
  };
}

function evaluatePaperRiskGate(backtestResult, options = {}) {
  const maxDrawdownPercent = getBacktestNumber(options.maxDrawdownPercent, 10, 0);
  const maxLossStreak = Math.floor(getBacktestNumber(options.maxLossStreak, 3, 0));
  const minTradeCount = Math.floor(getBacktestNumber(options.minTradeCount, 20, 0));
  const metrics = backtestResult.metrics || {};
  const checks = [
    {
      id: 'max_drawdown',
      label: 'Max drawdown',
      metric: metrics.maxDrawdownPercent ?? null,
      threshold: maxDrawdownPercent,
      passed: Number.isFinite(metrics.maxDrawdownPercent) && metrics.maxDrawdownPercent <= maxDrawdownPercent
    },
    {
      id: 'max_loss_streak',
      label: 'Max loss streak',
      metric: metrics.maxLossStreak ?? null,
      threshold: maxLossStreak,
      passed: Number.isFinite(metrics.maxLossStreak) && metrics.maxLossStreak <= maxLossStreak
    },
    {
      id: 'min_trade_count',
      label: 'Min trade count',
      metric: metrics.tradeCount ?? null,
      threshold: minTradeCount,
      passed: Number.isFinite(metrics.tradeCount) && metrics.tradeCount >= minTradeCount
    }
  ];
  const failures = checks.filter(check => !check.passed);

  return {
    status: failures.length ? 'needs_review' : 'passed',
    thresholds: {
      maxDrawdownPercent,
      maxLossStreak,
      minTradeCount
    },
    checks,
    failures: failures.map(check => check.id),
    note: 'Readiness gate only. It does not block local research or paper replay.'
  };
}

function createPaperReplayPayload(strategy, marketImport, backtestResult, riskGateOptions = {}) {
  return {
    mode: 'historical_replay_v1',
    sourceMode: backtestResult.mode || 'candle_backtest_v1',
    warning: 'Paper replay only. This does not place live orders and must not be treated as live trading readiness.',
    strategy: {
      id: strategy.id,
      name: strategy.name,
      marketSymbol: strategy.market_symbol,
      timeframe: strategy.timeframe
    },
    data: backtestResult.data,
    settings: backtestResult.settings,
    parsedRules: backtestResult.parsedRules,
    regime: backtestResult.regime,
    metrics: backtestResult.metrics,
    riskGate: evaluatePaperRiskGate(backtestResult, riskGateOptions),
    simulatedTrades: backtestResult.trades,
    decisionLog: backtestResult.decisionLog,
    decisionSummary: backtestResult.decisionSummary,
    marketImport: {
      id: marketImport.id,
      marketSymbol: marketImport.market_symbol,
      timeframe: marketImport.timeframe
    },
    nextSteps: [
      'Replay with larger datasets and multiple regimes.',
      'Add live market-data feed simulation before exchange connectivity.',
      'Keep live trading disabled until risk controls and kill switch are implemented.'
    ]
  };
}

function createPaperBotAutomationRunPayload(plan, strategy, riskProfile, marketImport, candles, readiness, options = {}) {
  if (candles.length < 2) {
    throw new Error('At least two candles are required to run a paper bot decision cycle');
  }

  if (isArbitrageStrategyType(strategy.strategy_type)) {
    return createArbitragePaperBotDecision(
      plan,
      strategy,
      riskProfile,
      marketImport,
      candles,
      readiness,
      options
    );
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
  const previousIndex = latestIndex - 1;
  const latestCandle = normalizedCandles[latestIndex];
  const signalEvaluator = createSignalEvaluator(strategy, normalizedCandles);
  const positionOpen = Boolean(options.positionOpen);
  const entrySignal = signalEvaluator.shouldEnterAtOpen(latestIndex);
  const exitSignal = signalEvaluator.shouldExitAtOpen(latestIndex);
  let action = 'wait';
  let reason = 'entry_signal_false';

  if (positionOpen) {
    action = exitSignal ? 'exit' : 'hold';
    reason = exitSignal ? 'exit_rule' : 'position_open_no_exit_signal';
  } else if (entrySignal) {
    action = 'enter';
    reason = 'entry_rule';
  }

  return {
    mode: 'paper_bot_decision_cycle_v1',
    warning: 'Paper-only automation simulation. This does not place orders, store exchange secrets, or enable live execution.',
    plan: {
      id: plan.id,
      name: plan.name,
      mode: plan.mode,
      status: plan.status
    },
    strategy: {
      id: strategy.id,
      name: strategy.name,
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
    marketRegime: classifyMarketRegime(normalizedCandles),
    parsedRules: {
      entry: signalEvaluator.entryRule || { kind: 'buy_and_hold_baseline', label: 'buy first candle open' },
      exit: signalEvaluator.exitRule || { kind: 'risk_or_final_candle', label: 'risk controls or final candle close' },
      warnings: signalEvaluator.warnings
    },
    decision: {
      action,
      reason,
      timestamp: latestCandle.timestamp,
      candleIndex: latestIndex,
      price: roundNumber(latestCandle.open, 8),
      positionOpen,
      signals: {
        entrySignal,
        exitSignal,
        evaluatedPreviousCandleIndex: previousIndex
      }
    },
    liveExecution: {
      enabled: false,
      note: 'No order was placed. This run only records the simulated paper decision.'
    },
    nextSteps: [
      'Review the simulated decision and readiness checks.',
      'Run repeated paper cycles against fresh market data before any future live enable flow.',
      'Keep the live execution path disabled until owner confirmation, secret handling, risk limits, and kill switch controls are complete.'
    ]
  };
}

function createOptimizationSweepPayload(strategy, candles, marketImport, options = {}) {
  const initialCapital = getBacktestNumber(options.initialCapital, 10000, 1);
  const feePercents = parseSweepNumberList(options.feePercents, [0.05, 0.1, 0.2], { max: 5 });
  const slippagePercents = parseSweepNumberList(options.slippagePercents, [0.02, 0.05, 0.1], { max: 5 });
  const stopLossPercents = parseSweepNumberList(options.stopLossPercents, [0, 2, 4], { max: 100 });
  const takeProfitPercents = parseSweepNumberList(options.takeProfitPercents, [0, 4, 8], { max: 500 });
  const totalRunCount = feePercents.length *
    slippagePercents.length *
    stopLossPercents.length *
    takeProfitPercents.length;

  if (totalRunCount > 300) {
    throw new Error('Optimization sweep is too large. Keep the total combinations at 300 or fewer.');
  }

  const runs = [];

  for (const feePercent of feePercents) {
    for (const slippagePercent of slippagePercents) {
      for (const stopLossPercent of stopLossPercents) {
        for (const takeProfitPercent of takeProfitPercents) {
          const result = runCandleBacktest(strategy, candles, marketImport, {
            initialCapital,
            feePercent,
            slippagePercent,
            stopLossPercent,
            takeProfitPercent
          });
          const metrics = result.metrics;
          const riskAdjustedScore = roundNumber(
            (metrics.totalReturnPercent || 0) -
            (metrics.maxDrawdownPercent || 0) +
            ((metrics.winRatePercent || 0) * 0.02)
          );

          runs.push({
            settings: {
              initialCapital,
              feePercent,
              slippagePercent,
              stopLossPercent,
              takeProfitPercent
            },
            score: riskAdjustedScore,
            metrics,
            regime: result.regime,
            tradeSample: result.trades.slice(-10)
          });
        }
      }
    }
  }

  runs.sort((a, b) => (
    (b.score - a.score) ||
    ((b.metrics.totalReturnPercent || 0) - (a.metrics.totalReturnPercent || 0)) ||
    ((a.metrics.maxDrawdownPercent || 0) - (b.metrics.maxDrawdownPercent || 0))
  ));

  const rankedRuns = runs.map((run, index) => ({
    rank: index + 1,
    ...run
  }));
  const returns = rankedRuns.map(run => run.metrics.totalReturnPercent).filter(Number.isFinite);
  const drawdowns = rankedRuns.map(run => run.metrics.maxDrawdownPercent).filter(Number.isFinite);

  return {
    mode: 'optimization_sweep_v1',
    warning: 'Research-only optimization sweep. It does not place trades, tune live bots, or prove future performance.',
    strategy: {
      id: strategy.id,
      name: strategy.name,
      marketSymbol: strategy.market_symbol,
      timeframe: strategy.timeframe
    },
    data: {
      importId: marketImport.id,
      marketSymbol: marketImport.market_symbol,
      timeframe: marketImport.timeframe,
      candleCount: candles.length
    },
    searchSpace: {
      initialCapital,
      feePercents,
      slippagePercents,
      stopLossPercents,
      takeProfitPercents,
      totalRunCount
    },
    summary: {
      totalRunCount,
      storedRunCount: Math.min(rankedRuns.length, 100),
      bestReturnPercent: returns.length ? roundNumber(Math.max(...returns)) : null,
      worstReturnPercent: returns.length ? roundNumber(Math.min(...returns)) : null,
      bestScore: rankedRuns[0]?.score ?? null,
      lowestDrawdownPercent: drawdowns.length ? roundNumber(Math.min(...drawdowns)) : null,
      highestDrawdownPercent: drawdowns.length ? roundNumber(Math.max(...drawdowns)) : null,
      bestRun: rankedRuns[0] || null
    },
    runs: rankedRuns.slice(0, 100),
    nextSteps: [
      'Compare top settings across larger historical datasets.',
      'Re-run sweeps across different market regimes.',
      'Paper replay any candidate before using it in an order-intent workflow.'
    ]
  };
}

function createSplitTestPayload(strategy, candles, marketImport, options = {}) {
  const initialCapital = getBacktestNumber(options.initialCapital, 10000, 1);
  const feePercent = getBacktestNumber(options.feePercent, 0.1);
  const slippagePercent = getBacktestNumber(options.slippagePercent, 0.05);
  const stopLossPercent = getBacktestNumber(options.stopLossPercent ?? strategy.stop_loss, 0);
  const takeProfitPercent = getBacktestNumber(options.takeProfitPercent ?? strategy.take_profit, 0);
  const requestedTrainPercent = getBacktestNumber(options.trainPercent, 70, 10);
  const trainPercent = Math.min(requestedTrainPercent, 90);
  const splitIndex = Math.floor(candles.length * (trainPercent / 100));

  if (splitIndex < 2 || candles.length - splitIndex < 2) {
    throw new Error('Split test needs at least two candles in both in-sample and out-of-sample windows.');
  }

  const settings = {
    initialCapital,
    feePercent,
    slippagePercent,
    stopLossPercent,
    takeProfitPercent
  };
  const inSampleCandles = candles.slice(0, splitIndex);
  const outOfSampleCandles = candles.slice(splitIndex);
  const inSample = runCandleBacktest(strategy, inSampleCandles, marketImport, settings);
  const outOfSample = runCandleBacktest(strategy, outOfSampleCandles, marketImport, settings);
  const inReturn = inSample.metrics.totalReturnPercent;
  const outReturn = outOfSample.metrics.totalReturnPercent;
  const returnDriftPercent = Number.isFinite(inReturn) && Number.isFinite(outReturn)
    ? roundNumber(outReturn - inReturn)
    : null;
  const drawdownDriftPercent = Number.isFinite(inSample.metrics.maxDrawdownPercent) &&
    Number.isFinite(outOfSample.metrics.maxDrawdownPercent)
    ? roundNumber(outOfSample.metrics.maxDrawdownPercent - inSample.metrics.maxDrawdownPercent)
    : null;
  const stability = returnDriftPercent === null
    ? 'unknown'
    : Math.abs(returnDriftPercent) <= 5 && (drawdownDriftPercent ?? 0) <= 5
      ? 'stable'
      : 'review';

  return {
    mode: 'split_test_v1',
    warning: 'Research-only split test. Out-of-sample results are diagnostics, not live-trading readiness.',
    strategy: {
      id: strategy.id,
      name: strategy.name,
      marketSymbol: strategy.market_symbol,
      timeframe: strategy.timeframe
    },
    data: {
      importId: marketImport.id,
      marketSymbol: marketImport.market_symbol,
      timeframe: marketImport.timeframe,
      candleCount: candles.length,
      inSampleCount: inSampleCandles.length,
      outOfSampleCount: outOfSampleCandles.length,
      splitIndex,
      trainPercent
    },
    settings,
    summary: {
      stability,
      inSampleReturnPercent: inReturn,
      outOfSampleReturnPercent: outReturn,
      returnDriftPercent,
      inSampleDrawdownPercent: inSample.metrics.maxDrawdownPercent,
      outOfSampleDrawdownPercent: outOfSample.metrics.maxDrawdownPercent,
      drawdownDriftPercent,
      inSampleTrades: inSample.metrics.tradeCount,
      outOfSampleTrades: outOfSample.metrics.tradeCount
    },
    inSample: {
      metrics: inSample.metrics,
      regime: inSample.regime,
      trades: inSample.trades
    },
    outOfSample: {
      metrics: outOfSample.metrics,
      regime: outOfSample.regime,
      trades: outOfSample.trades
    },
    nextSteps: [
      'Repeat with larger datasets and different split percentages.',
      'Prefer settings that remain usable out of sample.',
      'Use paper replay before any order-intent workflow.'
    ]
  };
}

function createWalkForwardPayload(strategy, candles, marketImport, options = {}) {
  const initialCapital = getBacktestNumber(options.initialCapital, 10000, 1);
  const feePercent = getBacktestNumber(options.feePercent, 0.1);
  const slippagePercent = getBacktestNumber(options.slippagePercent, 0.05);
  const stopLossPercent = getBacktestNumber(options.stopLossPercent ?? strategy.stop_loss, 0);
  const takeProfitPercent = getBacktestNumber(options.takeProfitPercent ?? strategy.take_profit, 0);
  const trainCandles = Math.floor(getBacktestNumber(options.trainCandles, 20, 2));
  const testCandles = Math.floor(getBacktestNumber(options.testCandles, 10, 2));
  const stepCandles = Math.floor(getBacktestNumber(options.stepCandles, testCandles, 1));

  if (trainCandles + testCandles > candles.length) {
    throw new Error('Walk-forward test needs enough candles for at least one train and test window.');
  }

  const settings = {
    initialCapital,
    feePercent,
    slippagePercent,
    stopLossPercent,
    takeProfitPercent,
    trainCandles,
    testCandles,
    stepCandles
  };
  const windows = [];

  for (
    let startIndex = 0;
    startIndex + trainCandles + testCandles <= candles.length && windows.length < 50;
    startIndex += stepCandles
  ) {
    const trainSlice = candles.slice(startIndex, startIndex + trainCandles);
    const testSlice = candles.slice(startIndex + trainCandles, startIndex + trainCandles + testCandles);
    const trainResult = runCandleBacktest(strategy, trainSlice, marketImport, settings);
    const testResult = runCandleBacktest(strategy, testSlice, marketImport, settings);
    const returnDriftPercent = roundNumber(
      (testResult.metrics.totalReturnPercent || 0) -
      (trainResult.metrics.totalReturnPercent || 0)
    );
    const drawdownDriftPercent = roundNumber(
      (testResult.metrics.maxDrawdownPercent || 0) -
      (trainResult.metrics.maxDrawdownPercent || 0)
    );
    const stability = Math.abs(returnDriftPercent) <= 5 && drawdownDriftPercent <= 5
      ? 'stable'
      : 'review';

    windows.push({
      index: windows.length + 1,
      startIndex,
      train: {
        firstTimestamp: trainSlice[0].timestamp,
        lastTimestamp: trainSlice[trainSlice.length - 1].timestamp,
        metrics: trainResult.metrics,
        regime: trainResult.regime
      },
      test: {
        firstTimestamp: testSlice[0].timestamp,
        lastTimestamp: testSlice[testSlice.length - 1].timestamp,
        metrics: testResult.metrics,
        regime: testResult.regime
      },
      stability,
      returnDriftPercent,
      drawdownDriftPercent
    });
  }

  if (!windows.length) {
    throw new Error('Walk-forward test could not create any windows with the selected settings.');
  }

  const outReturns = windows
    .map(window => window.test.metrics.totalReturnPercent)
    .filter(Number.isFinite);
  const outDrawdowns = windows
    .map(window => window.test.metrics.maxDrawdownPercent)
    .filter(Number.isFinite);
  const stableWindowCount = windows.filter(window => window.stability === 'stable').length;

  return {
    mode: 'walk_forward_test_v1',
    warning: 'Research-only walk-forward test. It is a robustness diagnostic, not live-trading readiness.',
    strategy: {
      id: strategy.id,
      name: strategy.name,
      marketSymbol: strategy.market_symbol,
      timeframe: strategy.timeframe
    },
    data: {
      importId: marketImport.id,
      marketSymbol: marketImport.market_symbol,
      timeframe: marketImport.timeframe,
      candleCount: candles.length
    },
    settings,
    summary: {
      windowCount: windows.length,
      stableWindowCount,
      stableRatePercent: roundNumber((stableWindowCount / windows.length) * 100),
      averageOutOfSampleReturnPercent: outReturns.length ? roundNumber(average(outReturns)) : null,
      worstOutOfSampleReturnPercent: outReturns.length ? roundNumber(Math.min(...outReturns)) : null,
      worstOutOfSampleDrawdownPercent: outDrawdowns.length ? roundNumber(Math.max(...outDrawdowns)) : null,
      averageReturnDriftPercent: roundNumber(average(windows.map(window => window.returnDriftPercent))),
      status: stableWindowCount === windows.length ? 'stable' : 'review'
    },
    windows,
    nextSteps: [
      'Run this on a larger candle import with many windows.',
      'Compare stable windows against optimization-sweep candidates.',
      'Paper replay candidates before any order-intent workflow.'
    ]
  };
}

module.exports = {
  runCandleBacktest,
  evaluatePaperRiskGate,
  createPaperReplayPayload,
  createPaperBotAutomationRunPayload,
  createOptimizationSweepPayload,
  createSplitTestPayload,
  createWalkForwardPayload
};
