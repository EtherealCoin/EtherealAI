const {
  buildOwnerAcceptanceSummary,
  getLatestOwnerAcceptanceRecord
} = require('../lib/owner-acceptance');
const { buildBotAutomationCapabilityPath } = require('../lib/bot-automation');
const { buildOwnerEvidenceSnapshot } = require('../lib/owner-evidence');

function registerSystemMemoryRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  projectRoot,
  readModelConfig,
  readAutomationPolicy,
  readCompanyIdentity,
  buildCompanyIdentityChecklist,
  selects,
  parsers
}) {
  app.get('/api/v1/system-memory', requireAuth, async (req, res) => {
    try {
      const countTables = [
        'creator_tasks',
        'workspaces',
        'file_write_proposals',
        'command_runs',
        'dev_server_runs',
        'dev_server_logs',
        'trading_strategies',
        'backtest_runs',
        'paper_trading_sessions',
        'strategy_optimization_sweeps',
        'strategy_split_tests',
        'strategy_walk_forward_tests',
        'trading_decision_logs',
        'market_data_imports',
        'market_data_providers',
        'market_data_refresh_schedules',
        'market_data_refresh_runs',
        'exchange_connectors',
        'exchange_connector_readiness_events',
        'exchange_adapter_contract_events',
        'local_secret_references',
        'risk_profiles',
        'risk_profile_audit_events',
        'trade_order_intents',
        'bot_automation_plans',
        'bot_live_readiness_events',
        'bot_live_enablement_reviews',
        'bot_automation_runs',
        'bot_automation_schedules',
        'owner_acceptance_records',
        'company_dns_targets',
        'solidity_contract_specs',
        'social_posts',
        'multi_agent_coordination_runs',
        'multi_agent_contributions'
      ];
      const countRows = await Promise.all(countTables.map(async tableName => {
        const row = await dbGet(`SELECT COUNT(*) AS count FROM ${tableName}`);
        return [tableName, row.count];
      }));
      const ownerEvidence = buildOwnerEvidenceSnapshot();
      const latestOwnerAcceptanceRecord = await getLatestOwnerAcceptanceRecord(dbGet);
      const ownerAcceptance = buildOwnerAcceptanceSummary({
        readyForOwnerTesting: ownerEvidence.status === 'ready_for_owner_testing'
          && ownerEvidence.localOnly === true
          && ownerEvidence.liveExecutionEnabled === false,
        latestRecord: latestOwnerAcceptanceRecord
      });
      const [
        taskRows,
        workspaceRows,
        devServerRows,
        devServerLogRows,
        strategyRows,
        backtestRows,
        paperRows,
        optimizationSweepRows,
        splitTestRows,
        walkForwardRows,
        decisionLogRows,
        marketImportRows,
        marketProviderRows,
        marketRefreshScheduleRows,
        marketRefreshRunRows,
        connectorRows,
        connectorReadinessRows,
        adapterContractRows,
        secretReferenceRows,
        riskProfileRows,
        riskProfileAuditRows,
        orderIntentRows,
        botPlanRows,
        botLiveReadinessRows,
        botLiveEnablementReviewRows,
        botRunRows,
        botScheduleRows,
        solidityRows,
        socialRows,
        companyDnsTargetRows,
        ownerAcceptanceRows,
        multiAgentRunRows,
        multiAgentContributionRows
      ] = await Promise.all([
        dbAll('SELECT * FROM creator_tasks ORDER BY updated_at DESC LIMIT 10'),
        dbAll('SELECT * FROM workspaces ORDER BY created_at DESC LIMIT 10'),
        dbAll('SELECT * FROM dev_server_runs ORDER BY started_at DESC, id DESC LIMIT 10'),
        dbAll('SELECT * FROM dev_server_logs ORDER BY created_at DESC, id DESC LIMIT 10'),
        dbAll('SELECT * FROM trading_strategies ORDER BY updated_at DESC LIMIT 10'),
        dbAll(
          `SELECT backtest_runs.*, trading_strategies.name AS strategy_name,
                  trading_strategies.market_symbol, trading_strategies.timeframe
           FROM backtest_runs
           LEFT JOIN trading_strategies ON trading_strategies.id = backtest_runs.strategy_id
           ORDER BY backtest_runs.created_at DESC
           LIMIT 10`
        ),
        dbAll(
          `SELECT paper_trading_sessions.*, trading_strategies.name AS strategy_name,
                  trading_strategies.market_symbol, trading_strategies.timeframe
           FROM paper_trading_sessions
           LEFT JOIN trading_strategies ON trading_strategies.id = paper_trading_sessions.strategy_id
           ORDER BY paper_trading_sessions.created_at DESC
           LIMIT 10`
        ),
        dbAll(
          `SELECT strategy_optimization_sweeps.*, trading_strategies.name AS strategy_name,
                  trading_strategies.market_symbol, trading_strategies.timeframe
           FROM strategy_optimization_sweeps
           LEFT JOIN trading_strategies ON trading_strategies.id = strategy_optimization_sweeps.strategy_id
           ORDER BY strategy_optimization_sweeps.created_at DESC
           LIMIT 10`
        ),
        dbAll(
          `SELECT strategy_split_tests.*, trading_strategies.name AS strategy_name,
                  trading_strategies.market_symbol, trading_strategies.timeframe
           FROM strategy_split_tests
           LEFT JOIN trading_strategies ON trading_strategies.id = strategy_split_tests.strategy_id
           ORDER BY strategy_split_tests.created_at DESC
           LIMIT 10`
        ),
        dbAll(
          `SELECT strategy_walk_forward_tests.*, trading_strategies.name AS strategy_name,
                  trading_strategies.market_symbol, trading_strategies.timeframe
           FROM strategy_walk_forward_tests
           LEFT JOIN trading_strategies ON trading_strategies.id = strategy_walk_forward_tests.strategy_id
           ORDER BY strategy_walk_forward_tests.created_at DESC
           LIMIT 10`
        ),
        dbAll(
          `SELECT trading_decision_logs.*, trading_strategies.name AS strategy_name
           FROM trading_decision_logs
           LEFT JOIN trading_strategies ON trading_strategies.id = trading_decision_logs.strategy_id
           ORDER BY trading_decision_logs.created_at DESC, trading_decision_logs.id DESC
           LIMIT 10`
        ),
        dbAll('SELECT * FROM market_data_imports ORDER BY created_at DESC LIMIT 10'),
        dbAll('SELECT * FROM market_data_providers ORDER BY created_at DESC LIMIT 10'),
        dbAll(
          `SELECT market_data_refresh_schedules.*, market_data_providers.label AS provider_label,
                  market_data_providers.provider_name, market_data_providers.provider_type
           FROM market_data_refresh_schedules
           LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_schedules.provider_id
           ORDER BY market_data_refresh_schedules.created_at DESC
           LIMIT 10`
        ),
        dbAll(
          `SELECT market_data_refresh_runs.*, market_data_refresh_schedules.label AS schedule_label,
                  market_data_providers.label AS provider_label
           FROM market_data_refresh_runs
           LEFT JOIN market_data_refresh_schedules ON market_data_refresh_schedules.id = market_data_refresh_runs.schedule_id
           LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_runs.provider_id
           ORDER BY market_data_refresh_runs.created_at DESC
           LIMIT 10`
        ),
        dbAll(`${selects.exchangeConnector} ORDER BY exchange_connectors.created_at DESC LIMIT 10`),
        dbAll(
          `${selects.exchangeConnectorReadinessEvent}
           ORDER BY exchange_connector_readiness_events.created_at DESC, exchange_connector_readiness_events.id DESC
           LIMIT 10`
        ),
        dbAll(
          `${selects.exchangeAdapterContractEvent}
           ORDER BY exchange_adapter_contract_events.created_at DESC, exchange_adapter_contract_events.id DESC
           LIMIT 10`
        ),
        dbAll('SELECT * FROM local_secret_references ORDER BY created_at DESC, id DESC LIMIT 10'),
        dbAll('SELECT * FROM risk_profiles ORDER BY updated_at DESC LIMIT 10'),
        dbAll(
          `SELECT risk_profile_audit_events.*, risk_profiles.name AS risk_profile_name
           FROM risk_profile_audit_events
           LEFT JOIN risk_profiles ON risk_profiles.id = risk_profile_audit_events.risk_profile_id
           ORDER BY risk_profile_audit_events.created_at DESC, risk_profile_audit_events.id DESC
           LIMIT 10`
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
           LIMIT 10`
        ),
        dbAll(
          `${selects.botAutomationPlan}
           ORDER BY bot_automation_plans.created_at DESC
           LIMIT 10`
        ),
        dbAll(
          `${selects.botLiveReadinessEvent}
           ORDER BY bot_live_readiness_events.created_at DESC, bot_live_readiness_events.id DESC
           LIMIT 10`
        ),
        dbAll(
          `${selects.botLiveEnablementReview}
           ORDER BY bot_live_enablement_reviews.created_at DESC, bot_live_enablement_reviews.id DESC
           LIMIT 10`
        ),
        dbAll(
          `${selects.botAutomationRun}
           ORDER BY bot_automation_runs.created_at DESC
           LIMIT 10`
        ),
        dbAll(
          `${selects.botAutomationSchedule}
           ORDER BY bot_automation_schedules.created_at DESC
           LIMIT 10`
        ),
        dbAll('SELECT * FROM solidity_contract_specs ORDER BY created_at DESC LIMIT 10'),
        dbAll('SELECT * FROM social_posts ORDER BY created_at DESC LIMIT 10'),
        dbAll('SELECT * FROM company_dns_targets ORDER BY updated_at DESC, id DESC LIMIT 20'),
        dbAll('SELECT * FROM owner_acceptance_records ORDER BY created_at DESC, id DESC LIMIT 10'),
        dbAll('SELECT * FROM multi_agent_coordination_runs ORDER BY created_at DESC, id DESC LIMIT 10'),
        dbAll('SELECT * FROM multi_agent_contributions ORDER BY created_at DESC, id DESC LIMIT 20')
      ]);
      const [
        botCapabilityPlanRows,
        botCapabilityRunRows,
        botCapabilityScheduleRows
      ] = await Promise.all([
        dbAll(
          `${selects.botAutomationPlan}
           ORDER BY bot_automation_plans.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `${selects.botAutomationRun}
           ORDER BY bot_automation_runs.created_at DESC, bot_automation_runs.id DESC
           LIMIT 500`
        ),
        dbAll(
          `${selects.botAutomationSchedule}
           ORDER BY bot_automation_schedules.created_at DESC, bot_automation_schedules.id DESC
           LIMIT 500`
        )
      ]);
      const parsedBotPlans = botPlanRows.map(parsers.parseBotAutomationPlan);
      const parsedBotRuns = botRunRows.map(parsers.parseBotAutomationRun);
      const parsedBotSchedules = botScheduleRows.map(parsers.parseBotAutomationSchedule);
      const botAutomationCapabilityPath = buildBotAutomationCapabilityPath({
        plans: botCapabilityPlanRows.map(parsers.parseBotAutomationPlan),
        runs: botCapabilityRunRows.map(parsers.parseBotAutomationRun),
        schedules: botCapabilityScheduleRows.map(parsers.parseBotAutomationSchedule)
      });
      const companyIdentity = readCompanyIdentity ? readCompanyIdentity() : null;

      res.json({
        snapshot: {
          generatedAt: new Date().toISOString(),
          projectRoot,
          purpose: 'Local-first AI builder, trading research lab, and automation control center.',
          modelConfig: readModelConfig(),
          automationPolicy: readAutomationPolicy(),
          companyIdentity: companyIdentity
            ? {
              identity: companyIdentity,
              checklist: buildCompanyIdentityChecklist(companyIdentity)
            }
            : null,
          ownerEvidence,
          ownerAcceptance,
          botAutomationCapabilityPath,
          counts: Object.fromEntries(countRows),
          recent: {
            tasks: taskRows.map(parsers.parseTask),
            workspaces: workspaceRows,
            devServerRuns: devServerRows.map(parsers.parseDevServerRun),
            devServerLogs: devServerLogRows.map(parsers.parseDevServerLog),
            strategies: strategyRows.map(parsers.parseStrategy),
            backtests: backtestRows.map(row => ({
              ...parsers.parseBacktest(row),
              strategy_name: row.strategy_name,
              market_symbol: row.market_symbol,
              timeframe: row.timeframe
            })),
            paperSessions: paperRows.map(parsers.parsePaperSession),
            optimizationSweeps: optimizationSweepRows.map(parsers.parseOptimizationSweep),
            splitTests: splitTestRows.map(parsers.parseSplitTest),
            walkForwardTests: walkForwardRows.map(parsers.parseWalkForwardTest),
            decisionLogs: decisionLogRows.map(parsers.parseDecisionLog),
            marketImports: marketImportRows.map(parsers.parseMarketImport),
            marketDataProviders: marketProviderRows.map(parsers.parseMarketDataProvider),
            marketRefreshSchedules: marketRefreshScheduleRows.map(parsers.parseMarketDataRefreshSchedule),
            marketRefreshRuns: marketRefreshRunRows.map(parsers.parseMarketDataRefreshRun),
            exchangeConnectors: connectorRows.map(parsers.parseExchangeConnector),
            exchangeConnectorReadinessEvents: connectorReadinessRows.map(parsers.parseExchangeConnectorReadinessEvent),
            exchangeAdapterContractEvents: adapterContractRows.map(parsers.parseExchangeAdapterContractEvent),
            localSecretReferences: secretReferenceRows.map(parsers.parseLocalSecretReference),
            riskProfiles: riskProfileRows.map(parsers.parseRiskProfile),
            riskProfileAuditEvents: riskProfileAuditRows.map(parsers.parseRiskProfileAuditEvent),
            orderIntents: orderIntentRows.map(parsers.parseOrderIntent),
            botAutomationPlans: parsedBotPlans,
            botLiveReadinessEvents: botLiveReadinessRows.map(parsers.parseBotLiveReadinessEvent),
            botLiveEnablementReviews: botLiveEnablementReviewRows.map(parsers.parseBotLiveEnablementReview),
            botAutomationRuns: parsedBotRuns,
            botAutomationSchedules: parsedBotSchedules,
            solidityContracts: solidityRows.map(parsers.parseSolidityContractSpec),
            socialPosts: socialRows.map(parsers.parseSocialPost),
            companyDnsTargets: companyDnsTargetRows.map(parsers.parseCompanyDnsTarget),
            ownerAcceptanceRecords: ownerAcceptanceRows.map(parsers.parseOwnerAcceptanceRecord),
            multiAgentRuns: multiAgentRunRows.map(parsers.parseMultiAgentRun),
            multiAgentContributions: multiAgentContributionRows.map(parsers.parseMultiAgentContribution)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerSystemMemoryRoutes
};
