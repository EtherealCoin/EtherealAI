function createBotAutomationActionsRuntime({
  dbGet,
  dbAll,
  dbRun,
  parseStrategy,
  parseRiskProfile,
  parsePaperSession,
  parseExchangeConnector,
  parseBotAutomationPlan,
  parseBotAutomationRun,
  getExchangeConnectorRow,
  getBotAutomationPlanRow,
  getBotAutomationRunRow,
  evaluateBotAutomationReadiness,
  createPaperBotAutomationRunPayload,
  createRequestError
}) {
  async function loadBotAutomationReadinessContext(strategyId, riskProfileId, paperSessionId, connectorId = null) {
    const [strategyRow, riskProfileRow, paperSessionRow, connectorRow] = await Promise.all([
      dbGet('SELECT * FROM trading_strategies WHERE id = ?', [strategyId]),
      riskProfileId ? dbGet('SELECT * FROM risk_profiles WHERE id = ?', [riskProfileId]) : Promise.resolve(null),
      paperSessionId
        ? dbGet(
          `SELECT paper_trading_sessions.*, trading_strategies.name AS strategy_name,
                  trading_strategies.market_symbol, trading_strategies.timeframe
           FROM paper_trading_sessions
           LEFT JOIN trading_strategies ON trading_strategies.id = paper_trading_sessions.strategy_id
           WHERE paper_trading_sessions.id = ?`,
          [paperSessionId]
        )
        : Promise.resolve(null),
      connectorId ? getExchangeConnectorRow(connectorId) : Promise.resolve(null)
    ]);

    return {
      strategy: parseStrategy(strategyRow),
      riskProfile: parseRiskProfile(riskProfileRow),
      paperSession: parsePaperSession(paperSessionRow),
      connector: parseExchangeConnector(connectorRow)
    };
  }

  async function createBotAutomationPaperRun(planId, options = {}) {
    const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(planId));

    if (!plan) {
      throw createRequestError('Bot automation plan not found', 404);
    }

    if (plan.status === 'archived') {
      throw createRequestError('Archived bot automation plans cannot run paper decision cycles.');
    }

    if (plan.mode !== 'paper') {
      throw createRequestError('Only paper-mode bot automation plans can run paper decision cycles.');
    }

    const context = await loadBotAutomationReadinessContext(
      plan.strategy_id,
      plan.risk_profile_id,
      plan.paper_session_id,
      plan.connector_id
    );
    const readiness = evaluateBotAutomationReadiness({
      strategy: context.strategy,
      riskProfile: context.riskProfile,
      paperSession: context.paperSession,
      connector: context.connector,
      mode: plan.mode
    });

    if (readiness.blockingFailures.length) {
      throw createRequestError('Bot automation plan has blocking readiness failures.', 400, { readiness });
    }

    const marketDataImportId = options.marketDataImportId ? Number(options.marketDataImportId) : null;
    let marketImport;

    if (marketDataImportId) {
      marketImport = await dbGet('SELECT * FROM market_data_imports WHERE id = ?', [marketDataImportId]);

      if (!marketImport) {
        throw createRequestError('Market data import not found', 404);
      }

      if (
        marketImport.market_symbol !== context.strategy.market_symbol
        || marketImport.timeframe !== context.strategy.timeframe
      ) {
        throw createRequestError('Selected market data must match the bot plan strategy market symbol and timeframe');
      }
    } else {
      marketImport = await dbGet(
        `SELECT *
         FROM market_data_imports
         WHERE market_symbol = ? AND timeframe = ? AND status != 'archived'
         ORDER BY created_at DESC
         LIMIT 1`,
        [context.strategy.market_symbol, context.strategy.timeframe]
      );
    }

    if (!marketImport) {
      throw createRequestError('Import matching OHLCV market data before running a paper bot cycle');
    }

    const candles = await dbAll(
      `SELECT timestamp, open, high, low, close, volume
       FROM market_candles
       WHERE import_id = ?
       ORDER BY timestamp ASC`,
      [marketImport.id]
    );
    const resultPayload = createPaperBotAutomationRunPayload(
      plan,
      context.strategy,
      context.riskProfile,
      marketImport,
      candles,
      readiness,
      {
        positionOpen: Boolean(options.positionOpen)
      }
    );
    const runStatus = readiness.status === 'ready_for_paper' ? 'completed' : 'review_required';
    const result = await dbRun(
      `INSERT INTO bot_automation_runs
       (plan_id, strategy_id, market_data_import_id, mode, status, decision, result_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        plan.id,
        plan.strategy_id,
        marketImport.id,
        'paper',
        runStatus,
        resultPayload.decision.action,
        JSON.stringify(resultPayload)
      ]
    );

    return parseBotAutomationRun(await getBotAutomationRunRow(result.lastID));
  }

  return {
    loadBotAutomationReadinessContext,
    createBotAutomationPaperRun
  };
}

module.exports = {
  createBotAutomationActionsRuntime
};
