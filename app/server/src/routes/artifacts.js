function registerArtifactRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  normalizeArtifactType,
  createArtifactRow,
  filterArtifactRows,
  selects,
  parsers
}) {
  const {
    exchangeConnector: exchangeConnectorSelect,
    exchangeConnectorReadinessEvent: exchangeConnectorReadinessEventSelect,
    exchangeAdapterContractEvent: exchangeAdapterContractEventSelect,
    botAutomationPlan: botAutomationPlanSelect,
    botLiveReadinessEvent: botLiveReadinessEventSelect,
    botLiveEnablementReview: botLiveEnablementReviewSelect,
    botAutomationRun: botAutomationRunSelect,
    botAutomationSchedule: botAutomationScheduleSelect
  } = selects;
  const {
    parseTask,
    parseFileProposal,
    parseBacktest,
    parsePaperSession,
    parseOptimizationSweep,
    parseSplitTest,
    parseWalkForwardTest,
    parseDecisionLog,
    parseMarketImport,
    parseMarketDataProvider,
    parseMarketDataRefreshSchedule,
    parseMarketDataRefreshRun,
    parseExchangeConnector,
    parseExchangeConnectorReadinessEvent,
    parseExchangeAdapterContractEvent,
    parseLocalSecretReference,
    parseRiskProfile,
    parseRiskProfileAuditEvent,
    parseOrderIntent,
    parseBotAutomationPlan,
    parseBotLiveReadinessEvent,
    parseBotLiveEnablementReview,
    parseBotAutomationRun,
    parseBotAutomationSchedule,
    parseSolidityContractSpec,
    parseSocialPost
  } = parsers;

  app.get('/api/v1/artifacts', requireAuth, async (req, res) => {
    try {
      const type = normalizeArtifactType(req.query.type);
      const query = String(req.query.q || '').trim();
      const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const [
        taskCount,
        proposalCount,
        commandRunCount,
        checkpointCount,
        backtestCount,
        paperSessionCount,
        optimizationSweepCount,
        splitTestCount,
        walkForwardTestCount,
        decisionLogCount,
        importCount,
        providerCount,
        refreshScheduleCount,
        refreshRunCount,
        connectorCount,
        connectorReadinessCount,
        adapterContractEventCount,
        secretReferenceCount,
        riskProfileCount,
        riskProfileAuditCount,
        orderIntentCount,
        botPlanCount,
        botLiveReadinessCount,
        botLiveEnablementReviewCount,
        botRunCount,
        botScheduleCount,
        solidityCount,
        socialPostCount,
        recentTasks,
        recentFileProposals,
        recentCommandRuns,
        recentCheckpoints,
        recentBacktests,
        recentPaperSessions,
        recentOptimizationSweeps,
        recentSplitTests,
        recentWalkForwardTests,
        recentDecisionLogs,
        recentMarketImports,
        recentMarketProviders,
        recentRefreshSchedules,
        recentRefreshRuns,
        recentConnectors,
        recentConnectorReadinessEvents,
        recentAdapterContractEvents,
        recentSecretReferences,
        recentRiskProfiles,
        recentRiskProfileAuditEvents,
        recentOrderIntents,
        recentBotPlans,
        recentBotLiveReadinessEvents,
        recentBotLiveEnablementReviews,
        recentBotRuns,
        recentBotSchedules,
        recentSolidityContracts,
        recentSocialPosts
      ] = await Promise.all([
        dbGet('SELECT COUNT(*) AS count FROM creator_tasks'),
        dbGet('SELECT COUNT(*) AS count FROM file_write_proposals'),
        dbGet('SELECT COUNT(*) AS count FROM command_runs'),
        dbGet('SELECT COUNT(*) AS count FROM checkpoint_records'),
        dbGet('SELECT COUNT(*) AS count FROM backtest_runs'),
        dbGet('SELECT COUNT(*) AS count FROM paper_trading_sessions'),
        dbGet('SELECT COUNT(*) AS count FROM strategy_optimization_sweeps'),
        dbGet('SELECT COUNT(*) AS count FROM strategy_split_tests'),
        dbGet('SELECT COUNT(*) AS count FROM strategy_walk_forward_tests'),
        dbGet('SELECT COUNT(*) AS count FROM trading_decision_logs'),
        dbGet('SELECT COUNT(*) AS count FROM market_data_imports'),
        dbGet('SELECT COUNT(*) AS count FROM market_data_providers'),
        dbGet('SELECT COUNT(*) AS count FROM market_data_refresh_schedules'),
        dbGet('SELECT COUNT(*) AS count FROM market_data_refresh_runs'),
        dbGet('SELECT COUNT(*) AS count FROM exchange_connectors'),
        dbGet('SELECT COUNT(*) AS count FROM exchange_connector_readiness_events'),
        dbGet('SELECT COUNT(*) AS count FROM exchange_adapter_contract_events'),
        dbGet('SELECT COUNT(*) AS count FROM local_secret_references'),
        dbGet('SELECT COUNT(*) AS count FROM risk_profiles'),
        dbGet('SELECT COUNT(*) AS count FROM risk_profile_audit_events'),
        dbGet('SELECT COUNT(*) AS count FROM trade_order_intents'),
        dbGet('SELECT COUNT(*) AS count FROM bot_automation_plans'),
        dbGet('SELECT COUNT(*) AS count FROM bot_live_readiness_events'),
        dbGet('SELECT COUNT(*) AS count FROM bot_live_enablement_reviews'),
        dbGet('SELECT COUNT(*) AS count FROM bot_automation_runs'),
        dbGet('SELECT COUNT(*) AS count FROM bot_automation_schedules'),
        dbGet('SELECT COUNT(*) AS count FROM solidity_contract_specs'),
        dbGet('SELECT COUNT(*) AS count FROM social_posts'),
        dbAll(
          `SELECT *
           FROM creator_tasks
           ORDER BY created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT file_write_proposals.*, creator_tasks.title AS task_title, workspaces.name AS workspace_name
           FROM file_write_proposals
           LEFT JOIN creator_tasks ON creator_tasks.id = file_write_proposals.task_id
           LEFT JOIN workspaces ON workspaces.id = file_write_proposals.workspace_id
           ORDER BY file_write_proposals.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT command_runs.*, command_requests.command, command_requests.task_id, creator_tasks.title AS task_title
           FROM command_runs
           LEFT JOIN command_requests ON command_requests.id = command_runs.command_request_id
           LEFT JOIN creator_tasks ON creator_tasks.id = command_requests.task_id
           ORDER BY command_runs.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT checkpoint_records.*, creator_tasks.title AS task_title
           FROM checkpoint_records
           LEFT JOIN creator_tasks ON creator_tasks.id = checkpoint_records.task_id
           ORDER BY checkpoint_records.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT backtest_runs.*, trading_strategies.name AS strategy_name, trading_strategies.market_symbol
           FROM backtest_runs
           LEFT JOIN trading_strategies ON trading_strategies.id = backtest_runs.strategy_id
           ORDER BY backtest_runs.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT paper_trading_sessions.*, trading_strategies.name AS strategy_name,
                  trading_strategies.market_symbol, trading_strategies.timeframe
           FROM paper_trading_sessions
           LEFT JOIN trading_strategies ON trading_strategies.id = paper_trading_sessions.strategy_id
           ORDER BY paper_trading_sessions.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT strategy_optimization_sweeps.*, trading_strategies.name AS strategy_name,
                  trading_strategies.market_symbol, trading_strategies.timeframe
           FROM strategy_optimization_sweeps
           LEFT JOIN trading_strategies ON trading_strategies.id = strategy_optimization_sweeps.strategy_id
           ORDER BY strategy_optimization_sweeps.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT strategy_split_tests.*, trading_strategies.name AS strategy_name,
                  trading_strategies.market_symbol, trading_strategies.timeframe
           FROM strategy_split_tests
           LEFT JOIN trading_strategies ON trading_strategies.id = strategy_split_tests.strategy_id
           ORDER BY strategy_split_tests.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT strategy_walk_forward_tests.*, trading_strategies.name AS strategy_name,
                  trading_strategies.market_symbol, trading_strategies.timeframe
           FROM strategy_walk_forward_tests
           LEFT JOIN trading_strategies ON trading_strategies.id = strategy_walk_forward_tests.strategy_id
           ORDER BY strategy_walk_forward_tests.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT trading_decision_logs.*, trading_strategies.name AS strategy_name
           FROM trading_decision_logs
           LEFT JOIN trading_strategies ON trading_strategies.id = trading_decision_logs.strategy_id
           ORDER BY trading_decision_logs.created_at DESC, trading_decision_logs.id DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT *
           FROM market_data_imports
           ORDER BY created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT *
           FROM market_data_providers
           ORDER BY created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT market_data_refresh_schedules.*, market_data_providers.label AS provider_label,
                  market_data_providers.provider_name, market_data_providers.provider_type
           FROM market_data_refresh_schedules
           LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_schedules.provider_id
           ORDER BY market_data_refresh_schedules.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT market_data_refresh_runs.*, market_data_refresh_schedules.label AS schedule_label,
                  market_data_providers.label AS provider_label
           FROM market_data_refresh_runs
           LEFT JOIN market_data_refresh_schedules ON market_data_refresh_schedules.id = market_data_refresh_runs.schedule_id
           LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_runs.provider_id
           ORDER BY market_data_refresh_runs.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `${exchangeConnectorSelect}
           ORDER BY exchange_connectors.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `${exchangeConnectorReadinessEventSelect}
           ORDER BY exchange_connector_readiness_events.created_at DESC, exchange_connector_readiness_events.id DESC
           LIMIT 500`
        ),
        dbAll(
          `${exchangeAdapterContractEventSelect}
           ORDER BY exchange_adapter_contract_events.created_at DESC, exchange_adapter_contract_events.id DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT *
           FROM local_secret_references
           ORDER BY created_at DESC, id DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT *
           FROM risk_profiles
           ORDER BY created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT risk_profile_audit_events.*, risk_profiles.name AS risk_profile_name
           FROM risk_profile_audit_events
           LEFT JOIN risk_profiles ON risk_profiles.id = risk_profile_audit_events.risk_profile_id
           ORDER BY risk_profile_audit_events.created_at DESC, risk_profile_audit_events.id DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT trade_order_intents.*, exchange_connectors.label AS connector_label,
                  exchange_connectors.exchange_name, risk_profiles.name AS risk_profile_name,
                  trading_strategies.name AS strategy_name
           FROM trade_order_intents
           LEFT JOIN exchange_connectors ON exchange_connectors.id = trade_order_intents.connector_id
           LEFT JOIN risk_profiles ON risk_profiles.id = trade_order_intents.risk_profile_id
           LEFT JOIN trading_strategies ON trading_strategies.id = trade_order_intents.strategy_id
           ORDER BY trade_order_intents.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `${botAutomationPlanSelect}
           ORDER BY bot_automation_plans.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `${botLiveReadinessEventSelect}
           ORDER BY bot_live_readiness_events.created_at DESC, bot_live_readiness_events.id DESC
           LIMIT 500`
        ),
        dbAll(
          `${botLiveEnablementReviewSelect}
           ORDER BY bot_live_enablement_reviews.created_at DESC, bot_live_enablement_reviews.id DESC
           LIMIT 500`
        ),
        dbAll(
          `${botAutomationRunSelect}
           ORDER BY bot_automation_runs.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `${botAutomationScheduleSelect}
           ORDER BY bot_automation_schedules.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT *
           FROM solidity_contract_specs
           ORDER BY created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `SELECT *
           FROM social_posts
           ORDER BY created_at DESC
           LIMIT 500`
        )
      ]);
      const tasks = recentTasks.map(parseTask);
      const fileProposals = recentFileProposals.map(row => ({
        ...parseFileProposal(row),
        task_title: row.task_title,
        workspace_name: row.workspace_name
      }));
      const commandRuns = recentCommandRuns;
      const checkpoints = recentCheckpoints.map(row => ({
        ...row,
        git_status: JSON.parse(row.git_status)
      }));
      const backtests = recentBacktests.map(row => ({
        ...parseBacktest(row),
        strategy_name: row.strategy_name,
        market_symbol: row.market_symbol
      }));
      const paperSessions = recentPaperSessions.map(parsePaperSession);
      const optimizationSweeps = recentOptimizationSweeps.map(parseOptimizationSweep);
      const splitTests = recentSplitTests.map(parseSplitTest);
      const walkForwardTests = recentWalkForwardTests.map(parseWalkForwardTest);
      const decisionLogs = recentDecisionLogs.map(parseDecisionLog);
      const marketImports = recentMarketImports.map(parseMarketImport);
      const marketProviders = recentMarketProviders.map(parseMarketDataProvider);
      const refreshSchedules = recentRefreshSchedules.map(parseMarketDataRefreshSchedule);
      const refreshRuns = recentRefreshRuns.map(parseMarketDataRefreshRun);
      const exchangeConnectors = recentConnectors.map(parseExchangeConnector);
      const exchangeConnectorReadinessEvents = recentConnectorReadinessEvents.map(parseExchangeConnectorReadinessEvent);
      const exchangeAdapterContractEvents = recentAdapterContractEvents.map(parseExchangeAdapterContractEvent);
      const localSecretReferences = recentSecretReferences.map(parseLocalSecretReference);
      const riskProfiles = recentRiskProfiles.map(parseRiskProfile);
      const riskProfileAuditEvents = recentRiskProfileAuditEvents.map(parseRiskProfileAuditEvent);
      const orderIntents = recentOrderIntents.map(parseOrderIntent);
      const botPlans = recentBotPlans.map(parseBotAutomationPlan);
      const botLiveReadinessEvents = recentBotLiveReadinessEvents.map(parseBotLiveReadinessEvent);
      const botLiveEnablementReviews = recentBotLiveEnablementReviews.map(parseBotLiveEnablementReview);
      const botRuns = recentBotRuns.map(parseBotAutomationRun);
      const botSchedules = recentBotSchedules.map(parseBotAutomationSchedule);
      const solidityContracts = recentSolidityContracts.map(parseSolidityContractSpec);
      const socialPosts = recentSocialPosts.map(parseSocialPost);
      const artifactRows = [
        ...tasks.map(item => createArtifactRow('task', item)),
        ...fileProposals.map(item => createArtifactRow('file proposal', item)),
        ...commandRuns.map(item => createArtifactRow('command run', item)),
        ...checkpoints.map(item => createArtifactRow('checkpoint', item)),
        ...backtests.map(item => createArtifactRow('backtest', item)),
        ...paperSessions.map(item => createArtifactRow('paper session', item)),
        ...optimizationSweeps.map(item => createArtifactRow('optimization sweep', item)),
        ...splitTests.map(item => createArtifactRow('split test', item)),
        ...walkForwardTests.map(item => createArtifactRow('walk forward test', item)),
        ...decisionLogs.map(item => createArtifactRow('decision log', item)),
        ...marketImports.map(item => createArtifactRow('market import', item)),
        ...marketProviders.map(item => createArtifactRow('market provider', item)),
        ...refreshSchedules.map(item => createArtifactRow('refresh schedule', item)),
        ...refreshRuns.map(item => createArtifactRow('refresh run', item)),
        ...exchangeConnectors.map(item => createArtifactRow('exchange connector', item)),
        ...exchangeConnectorReadinessEvents.map(item => createArtifactRow('exchange connector readiness event', item)),
        ...exchangeAdapterContractEvents.map(item => createArtifactRow('exchange adapter contract event', item)),
        ...localSecretReferences.map(item => createArtifactRow('local secret reference', item)),
        ...riskProfiles.map(item => createArtifactRow('risk profile', item)),
        ...riskProfileAuditEvents.map(item => createArtifactRow('risk profile audit event', item)),
        ...orderIntents.map(item => createArtifactRow('order intent', item)),
        ...botPlans.map(item => createArtifactRow('bot automation plan', item)),
        ...botLiveReadinessEvents.map(item => createArtifactRow('bot live-readiness event', item)),
        ...botLiveEnablementReviews.map(item => createArtifactRow('bot live enablement review', item)),
        ...botRuns.map(item => createArtifactRow('bot automation run', item)),
        ...botSchedules.map(item => createArtifactRow('bot automation schedule', item)),
        ...solidityContracts.map(item => createArtifactRow('solidity contract', item)),
        ...socialPosts.map(item => createArtifactRow('social post', item))
      ]
        .filter(row => type === 'all' || row.type === type)
        .sort((a, b) => String(b.created).localeCompare(String(a.created)));
      const filteredRows = filterArtifactRows(artifactRows, query);

      res.json({
        page: {
          type,
          query,
          limit,
          offset,
          total: filteredRows.length,
          hasPrevious: offset > 0,
          hasNext: offset + limit < filteredRows.length
        },
        counts: {
          tasks: taskCount.count,
          fileProposals: proposalCount.count,
          commandRuns: commandRunCount.count,
          checkpoints: checkpointCount.count,
          backtests: backtestCount.count,
          paperSessions: paperSessionCount.count,
          optimizationSweeps: optimizationSweepCount.count,
          splitTests: splitTestCount.count,
          walkForwardTests: walkForwardTestCount.count,
          decisionLogs: decisionLogCount.count,
          marketImports: importCount.count,
          marketProviders: providerCount.count,
          refreshSchedules: refreshScheduleCount.count,
          refreshRuns: refreshRunCount.count,
          exchangeConnectors: connectorCount.count,
          exchangeConnectorReadinessEvents: connectorReadinessCount.count,
          exchangeAdapterContractEvents: adapterContractEventCount.count,
          localSecretReferences: secretReferenceCount.count,
          riskProfiles: riskProfileCount.count,
          riskProfileAuditEvents: riskProfileAuditCount.count,
          orderIntents: orderIntentCount.count,
          botAutomationPlans: botPlanCount.count,
          botLiveReadinessEvents: botLiveReadinessCount.count,
          botLiveEnablementReviews: botLiveEnablementReviewCount.count,
          botAutomationRuns: botRunCount.count,
          botAutomationSchedules: botScheduleCount.count,
          solidityContracts: solidityCount.count,
          socialPosts: socialPostCount.count
        },
        rows: filteredRows.slice(offset, offset + limit),
        recent: {
          tasks: tasks.slice(0, 15),
          fileProposals: fileProposals.slice(0, 15),
          commandRuns: commandRuns.slice(0, 15),
          checkpoints: checkpoints.slice(0, 15),
          backtests: backtests.slice(0, 15),
          paperSessions: paperSessions.slice(0, 15),
          optimizationSweeps: optimizationSweeps.slice(0, 15),
          splitTests: splitTests.slice(0, 15),
          walkForwardTests: walkForwardTests.slice(0, 15),
          decisionLogs: decisionLogs.slice(0, 15),
          marketImports: marketImports.slice(0, 15),
          marketProviders: marketProviders.slice(0, 15),
          refreshSchedules: refreshSchedules.slice(0, 15),
          refreshRuns: refreshRuns.slice(0, 15),
          exchangeConnectors: exchangeConnectors.slice(0, 15),
          exchangeConnectorReadinessEvents: exchangeConnectorReadinessEvents.slice(0, 15),
          exchangeAdapterContractEvents: exchangeAdapterContractEvents.slice(0, 15),
          localSecretReferences: localSecretReferences.slice(0, 15),
          riskProfiles: riskProfiles.slice(0, 15),
          riskProfileAuditEvents: riskProfileAuditEvents.slice(0, 15),
          orderIntents: orderIntents.slice(0, 15),
          botAutomationPlans: botPlans.slice(0, 15),
          botLiveReadinessEvents: botLiveReadinessEvents.slice(0, 15),
          botLiveEnablementReviews: botLiveEnablementReviews.slice(0, 15),
          botAutomationRuns: botRuns.slice(0, 15),
          botAutomationSchedules: botSchedules.slice(0, 15),
          solidityContracts: solidityContracts.slice(0, 15),
          socialPosts: socialPosts.slice(0, 15)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerArtifactRoutes
};
