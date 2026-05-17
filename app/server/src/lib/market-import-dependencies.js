function createMarketImportDependencyRuntime({ dbGet }) {
  async function getMarketImportDependencyCount(importId) {
    const dependencyChecks = await Promise.all([
      dbGet('SELECT COUNT(*) AS count FROM paper_trading_sessions WHERE market_data_import_id = ?', [importId]),
      dbGet('SELECT COUNT(*) AS count FROM strategy_optimization_sweeps WHERE market_data_import_id = ?', [importId]),
      dbGet('SELECT COUNT(*) AS count FROM strategy_split_tests WHERE market_data_import_id = ?', [importId]),
      dbGet('SELECT COUNT(*) AS count FROM strategy_walk_forward_tests WHERE market_data_import_id = ?', [importId]),
      dbGet('SELECT COUNT(*) AS count FROM trading_decision_logs WHERE market_data_import_id = ?', [importId])
    ]);

    return dependencyChecks.reduce((sum, row) => sum + Number(row.count || 0), 0);
  }

  return {
    getMarketImportDependencyCount
  };
}

module.exports = {
  createMarketImportDependencyRuntime
};
