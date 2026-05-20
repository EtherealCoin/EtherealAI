function parseStrategy(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe,
    strategy_type: row.strategy_type || 'indicator',
    strategy_rules: JSON.parse(row.strategy_rules_json || '{}'),
    entry_rules: row.entry_rules,
    exit_rules: row.exit_rules,
    stop_loss: row.stop_loss,
    take_profit: row.take_profit,
    risk_notes: row.risk_notes,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function parseBacktest(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    strategy_id: row.strategy_id,
    status: row.status,
    result: JSON.parse(row.result_json),
    created_at: row.created_at
  };
}

function parsePaperSession(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    strategy_id: row.strategy_id,
    market_data_import_id: row.market_data_import_id,
    name: row.name,
    mode: row.mode,
    status: row.status,
    initial_capital: row.initial_capital,
    current_equity: row.current_equity,
    result: JSON.parse(row.result_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
    strategy_name: row.strategy_name,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe
  };
}

function parseOptimizationSweep(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    strategy_id: row.strategy_id,
    market_data_import_id: row.market_data_import_id,
    name: row.name,
    status: row.status,
    result: JSON.parse(row.result_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
    strategy_name: row.strategy_name,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe
  };
}

function parseSplitTest(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    strategy_id: row.strategy_id,
    market_data_import_id: row.market_data_import_id,
    name: row.name,
    status: row.status,
    result: JSON.parse(row.result_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
    strategy_name: row.strategy_name,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe
  };
}

function parseWalkForwardTest(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    strategy_id: row.strategy_id,
    market_data_import_id: row.market_data_import_id,
    name: row.name,
    status: row.status,
    result: JSON.parse(row.result_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
    strategy_name: row.strategy_name,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe
  };
}

function parseDecisionLog(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    strategy_id: row.strategy_id,
    backtest_id: row.backtest_id,
    paper_session_id: row.paper_session_id,
    market_data_import_id: row.market_data_import_id,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe,
    candle_timestamp: row.candle_timestamp,
    candle_index: row.candle_index,
    decision: row.decision,
    reason: row.reason,
    price: row.price,
    payload: JSON.parse(row.payload_json || '{}'),
    created_at: row.created_at,
    strategy_name: row.strategy_name
  };
}

module.exports = {
  parseStrategy,
  parseBacktest,
  parsePaperSession,
  parseOptimizationSweep,
  parseSplitTest,
  parseWalkForwardTest,
  parseDecisionLog
};
