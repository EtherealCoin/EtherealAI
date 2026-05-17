function registerStrategyResearchRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  parseStrategy,
  parseBacktest,
  parseOptimizationSweep,
  parseSplitTest,
  parseWalkForwardTest,
  parseDecisionLog,
  parsePaperSession,
  runCandleBacktest,
  createOptimizationSweepPayload,
  createSplitTestPayload,
  createWalkForwardPayload,
  createPaperReplayPayload,
  insertDecisionLogs,
  roundNumber,
  average
}) {
  app.get('/api/v1/strategies', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT *
         FROM trading_strategies
         ORDER BY created_at DESC
         LIMIT 100`
      );

      res.json({ strategies: rows.map(parseStrategy) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/strategies/:id', requireAuth, async (req, res) => {
    try {
      const strategy = parseStrategy(await dbGet(
        'SELECT * FROM trading_strategies WHERE id = ?',
        [req.params.id]
      ));

      if (!strategy) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const backtests = await dbAll(
        `SELECT *
         FROM backtest_runs
         WHERE strategy_id = ?
         ORDER BY created_at DESC
         LIMIT 25`,
        [req.params.id]
      );

      res.json({
        strategy,
        backtests: backtests.map(parseBacktest)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/strategies', requireAuth, async (req, res) => {
    const {
      name,
      marketSymbol,
      timeframe,
      entryRules,
      exitRules,
      stopLoss = null,
      takeProfit = null,
      riskNotes = ''
    } = req.body;

    if (!name || !marketSymbol || !timeframe || !entryRules || !exitRules) {
      return res.status(400).json({ error: 'Name, market, timeframe, entry rules, and exit rules are required' });
    }

    try {
      const result = await dbRun(
        `INSERT INTO trading_strategies
         (name, market_symbol, timeframe, entry_rules, exit_rules, stop_loss, take_profit, risk_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name.trim(),
          marketSymbol.trim().toUpperCase(),
          timeframe.trim(),
          entryRules.trim(),
          exitRules.trim(),
          stopLoss === '' ? null : Number(stopLoss),
          takeProfit === '' ? null : Number(takeProfit),
          riskNotes.trim()
        ]
      );

      const strategy = parseStrategy(await dbGet(
        'SELECT * FROM trading_strategies WHERE id = ?',
        [result.lastID]
      ));

      res.status(201).json({ strategy });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/strategies/:id/backtests', requireAuth, async (req, res) => {
    try {
      const strategy = parseStrategy(await dbGet(
        'SELECT * FROM trading_strategies WHERE id = ?',
        [req.params.id]
      ));

      if (!strategy) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const {
        marketDataImportId = null,
        initialCapital = 10000,
        feePercent = 0.1,
        slippagePercent = 0.05
      } = req.body || {};
      let marketImport;

      if (marketDataImportId) {
        marketImport = await dbGet(
          'SELECT * FROM market_data_imports WHERE id = ?',
          [marketDataImportId]
        );

        if (!marketImport) {
          return res.status(404).json({ error: 'Market data import not found' });
        }

        if (marketImport.market_symbol !== strategy.market_symbol || marketImport.timeframe !== strategy.timeframe) {
          return res.status(400).json({
            error: 'Selected market data must match the strategy market symbol and timeframe'
          });
        }
      } else {
        marketImport = await dbGet(
          `SELECT *
           FROM market_data_imports
           WHERE market_symbol = ? AND timeframe = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [strategy.market_symbol, strategy.timeframe]
        );
      }

      if (!marketImport) {
        return res.status(400).json({
          error: 'Import matching OHLCV market data before running a candle backtest'
        });
      }

      const candles = await dbAll(
        `SELECT timestamp, open, high, low, close, volume
         FROM market_candles
         WHERE import_id = ?
         ORDER BY timestamp ASC`,
        [marketImport.id]
      );

      const resultPayload = runCandleBacktest(strategy, candles, marketImport, {
        initialCapital,
        feePercent,
        slippagePercent
      });
      const result = await dbRun(
        `INSERT INTO backtest_runs (strategy_id, status, result_json)
         VALUES (?, ?, ?)`,
        [
          strategy.id,
          'completed',
          JSON.stringify(resultPayload)
        ]
      );
      await insertDecisionLogs({
        strategy,
        marketImport,
        backtestId: result.lastID,
        decisions: resultPayload.decisionLog || []
      });

      const backtest = parseBacktest(await dbGet(
        'SELECT * FROM backtest_runs WHERE id = ?',
        [result.lastID]
      ));

      res.status(201).json({ backtest });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/backtests', requireAuth, async (req, res) => {
    try {
      const {
        marketSymbol = '',
        strategyId = '',
        regime = '',
        limit = 50
      } = req.query;
      const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
      const where = [];
      const params = [];

      if (marketSymbol) {
        where.push('trading_strategies.market_symbol = ?');
        params.push(String(marketSymbol).trim().toUpperCase());
      }

      if (strategyId) {
        where.push('backtest_runs.strategy_id = ?');
        params.push(strategyId);
      }

      params.push(safeLimit);

      const rows = await dbAll(
        `SELECT backtest_runs.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM backtest_runs
         LEFT JOIN trading_strategies ON trading_strategies.id = backtest_runs.strategy_id
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY backtest_runs.created_at DESC
         LIMIT ?`,
        params
      );
      const parsedBacktests = rows.map(row => ({
        ...parseBacktest(row),
        strategy_name: row.strategy_name,
        market_symbol: row.market_symbol,
        timeframe: row.timeframe
      }));
      const requestedRegime = String(regime || '').trim().toLowerCase();
      const backtests = requestedRegime
        ? parsedBacktests.filter(backtest => {
          const trend = backtest.result?.regime?.trend || 'unknown';
          return trend === requestedRegime;
        })
        : parsedBacktests;
      const returns = backtests
        .map(item => item.result?.metrics?.totalReturnPercent)
        .filter(Number.isFinite);
      const drawdowns = backtests
        .map(item => item.result?.metrics?.maxDrawdownPercent)
        .filter(Number.isFinite);
      const tradeCounts = backtests
        .map(item => item.result?.metrics?.tradeCount)
        .filter(Number.isFinite);
      const regimeCounts = backtests.reduce((counts, item) => {
        const trend = item.result?.regime?.trend || 'unknown';
        counts[trend] = (counts[trend] || 0) + 1;
        return counts;
      }, {});

      res.json({
        filters: {
          marketSymbol: marketSymbol || null,
          strategyId: strategyId || null,
          regime: requestedRegime || null,
          limit: safeLimit
        },
        summary: {
          count: backtests.length,
          bestReturnPercent: returns.length ? roundNumber(Math.max(...returns)) : null,
          worstReturnPercent: returns.length ? roundNumber(Math.min(...returns)) : null,
          averageReturnPercent: returns.length ? roundNumber(average(returns)) : null,
          worstDrawdownPercent: drawdowns.length ? roundNumber(Math.max(...drawdowns)) : null,
          totalTrades: tradeCounts.reduce((sum, value) => sum + value, 0),
          regimeCounts
        },
        backtests
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/backtests/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        `SELECT backtest_runs.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM backtest_runs
         LEFT JOIN trading_strategies ON trading_strategies.id = backtest_runs.strategy_id
         WHERE backtest_runs.id = ?`,
        [req.params.id]
      );

      if (!row) {
        return res.status(404).json({ error: 'Backtest not found' });
      }

      res.json({
        backtest: {
          ...parseBacktest(row),
          strategy_name: row.strategy_name,
          market_symbol: row.market_symbol,
          timeframe: row.timeframe
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/strategies/:id/optimization-sweeps', requireAuth, async (req, res) => {
    try {
      const strategy = parseStrategy(await dbGet(
        'SELECT * FROM trading_strategies WHERE id = ?',
        [req.params.id]
      ));

      if (!strategy) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const {
        marketDataImportId = null,
        initialCapital = 10000,
        feePercents = '',
        slippagePercents = '',
        stopLossPercents = '',
        takeProfitPercents = '',
        name = ''
      } = req.body || {};
      let marketImport;

      if (marketDataImportId) {
        marketImport = await dbGet(
          'SELECT * FROM market_data_imports WHERE id = ?',
          [marketDataImportId]
        );

        if (!marketImport) {
          return res.status(404).json({ error: 'Market data import not found' });
        }

        if (marketImport.market_symbol !== strategy.market_symbol || marketImport.timeframe !== strategy.timeframe) {
          return res.status(400).json({
            error: 'Selected market data must match the strategy market symbol and timeframe'
          });
        }
      } else {
        marketImport = await dbGet(
          `SELECT *
           FROM market_data_imports
           WHERE market_symbol = ? AND timeframe = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [strategy.market_symbol, strategy.timeframe]
        );
      }

      if (!marketImport) {
        return res.status(400).json({
          error: 'Import matching OHLCV market data before running an optimization sweep'
        });
      }

      const candles = await dbAll(
        `SELECT timestamp, open, high, low, close, volume
         FROM market_candles
         WHERE import_id = ?
         ORDER BY timestamp ASC`,
        [marketImport.id]
      );
      const resultPayload = createOptimizationSweepPayload(strategy, candles, marketImport, {
        initialCapital,
        feePercents,
        slippagePercents,
        stopLossPercents,
        takeProfitPercents
      });
      const sweepName = String(name || `${strategy.name} optimization sweep`).trim().slice(0, 160);
      const result = await dbRun(
        `INSERT INTO strategy_optimization_sweeps
         (strategy_id, market_data_import_id, name, status, result_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          strategy.id,
          marketImport.id,
          sweepName,
          'completed',
          JSON.stringify(resultPayload)
        ]
      );
      const row = await dbGet(
        `SELECT strategy_optimization_sweeps.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM strategy_optimization_sweeps
         LEFT JOIN trading_strategies ON trading_strategies.id = strategy_optimization_sweeps.strategy_id
         WHERE strategy_optimization_sweeps.id = ?`,
        [result.lastID]
      );

      res.status(201).json({ sweep: parseOptimizationSweep(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/optimization-sweeps', requireAuth, async (req, res) => {
    try {
      const {
        strategyId = '',
        limit = 50
      } = req.query;
      const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
      const where = [];
      const params = [];

      if (strategyId) {
        where.push('strategy_optimization_sweeps.strategy_id = ?');
        params.push(strategyId);
      }

      params.push(safeLimit);

      const rows = await dbAll(
        `SELECT strategy_optimization_sweeps.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM strategy_optimization_sweeps
         LEFT JOIN trading_strategies ON trading_strategies.id = strategy_optimization_sweeps.strategy_id
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY strategy_optimization_sweeps.created_at DESC
         LIMIT ?`,
        params
      );

      res.json({ sweeps: rows.map(parseOptimizationSweep) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/optimization-sweeps/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        `SELECT strategy_optimization_sweeps.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM strategy_optimization_sweeps
         LEFT JOIN trading_strategies ON trading_strategies.id = strategy_optimization_sweeps.strategy_id
         WHERE strategy_optimization_sweeps.id = ?`,
        [req.params.id]
      );

      if (!row) {
        return res.status(404).json({ error: 'Optimization sweep not found' });
      }

      res.json({ sweep: parseOptimizationSweep(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/strategies/:id/split-tests', requireAuth, async (req, res) => {
    try {
      const strategy = parseStrategy(await dbGet(
        'SELECT * FROM trading_strategies WHERE id = ?',
        [req.params.id]
      ));

      if (!strategy) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const {
        marketDataImportId = null,
        initialCapital = 10000,
        feePercent = 0.1,
        slippagePercent = 0.05,
        stopLossPercent = null,
        takeProfitPercent = null,
        trainPercent = 70,
        name = ''
      } = req.body || {};
      let marketImport;

      if (marketDataImportId) {
        marketImport = await dbGet('SELECT * FROM market_data_imports WHERE id = ?', [marketDataImportId]);

        if (!marketImport) {
          return res.status(404).json({ error: 'Market data import not found' });
        }

        if (marketImport.market_symbol !== strategy.market_symbol || marketImport.timeframe !== strategy.timeframe) {
          return res.status(400).json({
            error: 'Selected market data must match the strategy market symbol and timeframe'
          });
        }
      } else {
        marketImport = await dbGet(
          `SELECT *
           FROM market_data_imports
           WHERE market_symbol = ? AND timeframe = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [strategy.market_symbol, strategy.timeframe]
        );
      }

      if (!marketImport) {
        return res.status(400).json({ error: 'Import matching OHLCV market data before running a split test' });
      }

      const candles = await dbAll(
        `SELECT timestamp, open, high, low, close, volume
         FROM market_candles
         WHERE import_id = ?
         ORDER BY timestamp ASC`,
        [marketImport.id]
      );
      const resultPayload = createSplitTestPayload(strategy, candles, marketImport, {
        initialCapital,
        feePercent,
        slippagePercent,
        stopLossPercent,
        takeProfitPercent,
        trainPercent
      });
      const splitName = String(name || `${strategy.name} split test`).trim().slice(0, 160);
      const result = await dbRun(
        `INSERT INTO strategy_split_tests
         (strategy_id, market_data_import_id, name, status, result_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          strategy.id,
          marketImport.id,
          splitName,
          'completed',
          JSON.stringify(resultPayload)
        ]
      );
      const row = await dbGet(
        `SELECT strategy_split_tests.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM strategy_split_tests
         LEFT JOIN trading_strategies ON trading_strategies.id = strategy_split_tests.strategy_id
         WHERE strategy_split_tests.id = ?`,
        [result.lastID]
      );

      res.status(201).json({ splitTest: parseSplitTest(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/split-tests', requireAuth, async (req, res) => {
    try {
      const {
        strategyId = '',
        limit = 50
      } = req.query;
      const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
      const where = [];
      const params = [];

      if (strategyId) {
        where.push('strategy_split_tests.strategy_id = ?');
        params.push(strategyId);
      }

      params.push(safeLimit);

      const rows = await dbAll(
        `SELECT strategy_split_tests.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM strategy_split_tests
         LEFT JOIN trading_strategies ON trading_strategies.id = strategy_split_tests.strategy_id
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY strategy_split_tests.created_at DESC
         LIMIT ?`,
        params
      );

      res.json({ splitTests: rows.map(parseSplitTest) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/split-tests/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        `SELECT strategy_split_tests.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM strategy_split_tests
         LEFT JOIN trading_strategies ON trading_strategies.id = strategy_split_tests.strategy_id
         WHERE strategy_split_tests.id = ?`,
        [req.params.id]
      );

      if (!row) {
        return res.status(404).json({ error: 'Split test not found' });
      }

      res.json({ splitTest: parseSplitTest(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/strategies/:id/walk-forward-tests', requireAuth, async (req, res) => {
    try {
      const strategy = parseStrategy(await dbGet(
        'SELECT * FROM trading_strategies WHERE id = ?',
        [req.params.id]
      ));

      if (!strategy) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const {
        marketDataImportId = null,
        initialCapital = 10000,
        feePercent = 0.1,
        slippagePercent = 0.05,
        stopLossPercent = null,
        takeProfitPercent = null,
        trainCandles = 20,
        testCandles = 10,
        stepCandles = 10,
        name = ''
      } = req.body || {};
      let marketImport;

      if (marketDataImportId) {
        marketImport = await dbGet('SELECT * FROM market_data_imports WHERE id = ?', [marketDataImportId]);

        if (!marketImport) {
          return res.status(404).json({ error: 'Market data import not found' });
        }

        if (marketImport.market_symbol !== strategy.market_symbol || marketImport.timeframe !== strategy.timeframe) {
          return res.status(400).json({
            error: 'Selected market data must match the strategy market symbol and timeframe'
          });
        }
      } else {
        marketImport = await dbGet(
          `SELECT *
           FROM market_data_imports
           WHERE market_symbol = ? AND timeframe = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [strategy.market_symbol, strategy.timeframe]
        );
      }

      if (!marketImport) {
        return res.status(400).json({ error: 'Import matching OHLCV market data before running a walk-forward test' });
      }

      const candles = await dbAll(
        `SELECT timestamp, open, high, low, close, volume
         FROM market_candles
         WHERE import_id = ?
         ORDER BY timestamp ASC`,
        [marketImport.id]
      );
      const resultPayload = createWalkForwardPayload(strategy, candles, marketImport, {
        initialCapital,
        feePercent,
        slippagePercent,
        stopLossPercent,
        takeProfitPercent,
        trainCandles,
        testCandles,
        stepCandles
      });
      const testName = String(name || `${strategy.name} walk-forward test`).trim().slice(0, 160);
      const result = await dbRun(
        `INSERT INTO strategy_walk_forward_tests
         (strategy_id, market_data_import_id, name, status, result_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          strategy.id,
          marketImport.id,
          testName,
          'completed',
          JSON.stringify(resultPayload)
        ]
      );
      const row = await dbGet(
        `SELECT strategy_walk_forward_tests.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM strategy_walk_forward_tests
         LEFT JOIN trading_strategies ON trading_strategies.id = strategy_walk_forward_tests.strategy_id
         WHERE strategy_walk_forward_tests.id = ?`,
        [result.lastID]
      );

      res.status(201).json({ walkForwardTest: parseWalkForwardTest(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/walk-forward-tests', requireAuth, async (req, res) => {
    try {
      const {
        strategyId = '',
        limit = 50
      } = req.query;
      const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
      const where = [];
      const params = [];

      if (strategyId) {
        where.push('strategy_walk_forward_tests.strategy_id = ?');
        params.push(strategyId);
      }

      params.push(safeLimit);

      const rows = await dbAll(
        `SELECT strategy_walk_forward_tests.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM strategy_walk_forward_tests
         LEFT JOIN trading_strategies ON trading_strategies.id = strategy_walk_forward_tests.strategy_id
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY strategy_walk_forward_tests.created_at DESC
         LIMIT ?`,
        params
      );

      res.json({ walkForwardTests: rows.map(parseWalkForwardTest) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/walk-forward-tests/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        `SELECT strategy_walk_forward_tests.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM strategy_walk_forward_tests
         LEFT JOIN trading_strategies ON trading_strategies.id = strategy_walk_forward_tests.strategy_id
         WHERE strategy_walk_forward_tests.id = ?`,
        [req.params.id]
      );

      if (!row) {
        return res.status(404).json({ error: 'Walk-forward test not found' });
      }

      res.json({ walkForwardTest: parseWalkForwardTest(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/decision-logs', requireAuth, async (req, res) => {
    try {
      const {
        strategyId = '',
        backtestId = '',
        paperSessionId = '',
        marketSymbol = '',
        limit = 100
      } = req.query;
      const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
      const where = [];
      const params = [];

      if (strategyId) {
        where.push('trading_decision_logs.strategy_id = ?');
        params.push(strategyId);
      }

      if (backtestId) {
        where.push('trading_decision_logs.backtest_id = ?');
        params.push(backtestId);
      }

      if (paperSessionId) {
        where.push('trading_decision_logs.paper_session_id = ?');
        params.push(paperSessionId);
      }

      if (marketSymbol) {
        where.push('trading_decision_logs.market_symbol = ?');
        params.push(String(marketSymbol).trim().toUpperCase());
      }

      params.push(safeLimit);

      const rows = await dbAll(
        `SELECT trading_decision_logs.*, trading_strategies.name AS strategy_name
         FROM trading_decision_logs
         LEFT JOIN trading_strategies ON trading_strategies.id = trading_decision_logs.strategy_id
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY trading_decision_logs.created_at DESC, trading_decision_logs.id DESC
         LIMIT ?`,
        params
      );
      const logs = rows.map(parseDecisionLog);
      const counts = logs.reduce((accumulator, item) => {
        accumulator[item.decision] = (accumulator[item.decision] || 0) + 1;
        return accumulator;
      }, {});

      res.json({
        filters: {
          strategyId: strategyId || null,
          backtestId: backtestId || null,
          paperSessionId: paperSessionId || null,
          marketSymbol: marketSymbol || null,
          limit: safeLimit
        },
        summary: {
          count: logs.length,
          counts
        },
        logs
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/decision-logs/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        `SELECT trading_decision_logs.*, trading_strategies.name AS strategy_name
         FROM trading_decision_logs
         LEFT JOIN trading_strategies ON trading_strategies.id = trading_decision_logs.strategy_id
         WHERE trading_decision_logs.id = ?`,
        [req.params.id]
      );

      if (!row) {
        return res.status(404).json({ error: 'Decision log not found' });
      }

      res.json({ log: parseDecisionLog(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/paper-sessions', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT paper_trading_sessions.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM paper_trading_sessions
         LEFT JOIN trading_strategies ON trading_strategies.id = paper_trading_sessions.strategy_id
         ORDER BY paper_trading_sessions.created_at DESC
         LIMIT 100`
      );

      res.json({
        sessions: rows.map(parsePaperSession)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/paper-sessions/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        `SELECT paper_trading_sessions.*, trading_strategies.name AS strategy_name,
                trading_strategies.market_symbol, trading_strategies.timeframe
         FROM paper_trading_sessions
         LEFT JOIN trading_strategies ON trading_strategies.id = paper_trading_sessions.strategy_id
         WHERE paper_trading_sessions.id = ?`,
        [req.params.id]
      );

      if (!row) {
        return res.status(404).json({ error: 'Paper session not found' });
      }

      res.json({ session: parsePaperSession(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/strategies/:id/paper-sessions', requireAuth, async (req, res) => {
    try {
      const strategy = parseStrategy(await dbGet(
        'SELECT * FROM trading_strategies WHERE id = ?',
        [req.params.id]
      ));

      if (!strategy) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const {
        marketDataImportId = null,
        initialCapital = 10000,
        feePercent = 0.1,
        slippagePercent = 0.05,
        maxDrawdownPercent = 10,
        maxLossStreak = 3,
        minTradeCount = 20,
        name = ''
      } = req.body || {};
      const marketImport = marketDataImportId
        ? await dbGet('SELECT * FROM market_data_imports WHERE id = ?', [marketDataImportId])
        : await dbGet(
          `SELECT *
           FROM market_data_imports
           WHERE market_symbol = ? AND timeframe = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [strategy.market_symbol, strategy.timeframe]
        );

      if (!marketImport) {
        return res.status(400).json({ error: 'Import matching OHLCV market data before starting a paper replay' });
      }

      if (marketImport.market_symbol !== strategy.market_symbol || marketImport.timeframe !== strategy.timeframe) {
        return res.status(400).json({ error: 'Selected market data must match the strategy market symbol and timeframe' });
      }

      const candles = await dbAll(
        `SELECT timestamp, open, high, low, close, volume
         FROM market_candles
         WHERE import_id = ?
         ORDER BY timestamp ASC`,
        [marketImport.id]
      );
      const backtestResult = runCandleBacktest(strategy, candles, marketImport, {
        initialCapital,
        feePercent,
        slippagePercent
      });
      const paperPayload = createPaperReplayPayload(strategy, marketImport, backtestResult, {
        maxDrawdownPercent,
        maxLossStreak,
        minTradeCount
      });
      const sessionName = String(name || `${strategy.name} paper replay`).trim().slice(0, 160);
      const result = await dbRun(
        `INSERT INTO paper_trading_sessions
         (strategy_id, market_data_import_id, name, mode, status, initial_capital, current_equity, result_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          strategy.id,
          marketImport.id,
          sessionName,
          paperPayload.mode,
          'completed',
          Number(initialCapital),
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

      res.status(201).json({ session: parsePaperSession(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerStrategyResearchRoutes
};
