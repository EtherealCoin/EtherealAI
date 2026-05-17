function createStrategyDecisionLogRuntime({
  dbRun
}) {
  async function insertDecisionLogs({
    strategy,
    marketImport,
    backtestId = null,
    paperSessionId = null,
    decisions = []
  }) {
    for (const decision of decisions) {
      await dbRun(
        `INSERT INTO trading_decision_logs
         (strategy_id, backtest_id, paper_session_id, market_data_import_id, market_symbol, timeframe,
          candle_timestamp, candle_index, decision, reason, price, payload_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          strategy.id,
          backtestId,
          paperSessionId,
          marketImport.id,
          marketImport.market_symbol,
          marketImport.timeframe,
          decision.timestamp,
          decision.candleIndex,
          decision.decision,
          decision.reason,
          decision.price ?? null,
          JSON.stringify(decision)
        ]
      );
    }
  }

  return {
    insertDecisionLogs
  };
}

module.exports = {
  createStrategyDecisionLogRuntime
};
