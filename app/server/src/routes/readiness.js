const { getLatestOwnerAcceptanceRecord } = require('../lib/owner-acceptance');

function getReadinessManifests({
  getJsonManifestStatus,
  modelConfigPath,
  automationPolicyPath,
  secretProviderCapabilitiesPath
}) {
  return [
    getJsonManifestStatus('local_models', 'Local Model Manifest', modelConfigPath),
    getJsonManifestStatus('automation_policy', 'Automation Policy', automationPolicyPath),
    getJsonManifestStatus('local_secret_providers', 'Local Secret Providers', secretProviderCapabilitiesPath)
  ];
}

async function getMvpReadinessCounts(dbGet) {
  const [
    creatorTasks,
    workspaces,
    fileWriteProposals,
    tradingStrategies,
    backtestRuns,
    optimizationSweeps,
    splitTests,
    walkForwardTests,
    marketDataImports,
    marketDataImportJobs,
    marketDataProviders,
    marketDataRefreshSchedules,
    botAutomationPlans,
    botAutomationRuns,
    botAutomationSchedules,
    botAutomationActiveSchedules
  ] = await Promise.all([
    dbGet('SELECT COUNT(*) AS count FROM creator_tasks'),
    dbGet('SELECT COUNT(*) AS count FROM workspaces'),
    dbGet('SELECT COUNT(*) AS count FROM file_write_proposals'),
    dbGet('SELECT COUNT(*) AS count FROM trading_strategies'),
    dbGet('SELECT COUNT(*) AS count FROM backtest_runs'),
    dbGet('SELECT COUNT(*) AS count FROM strategy_optimization_sweeps'),
    dbGet('SELECT COUNT(*) AS count FROM strategy_split_tests'),
    dbGet('SELECT COUNT(*) AS count FROM strategy_walk_forward_tests'),
    dbGet('SELECT COUNT(*) AS count FROM market_data_imports'),
    dbGet('SELECT COUNT(*) AS count FROM market_data_import_jobs'),
    dbGet('SELECT COUNT(*) AS count FROM market_data_providers'),
    dbGet('SELECT COUNT(*) AS count FROM market_data_refresh_schedules'),
    dbGet('SELECT COUNT(*) AS count FROM bot_automation_plans'),
    dbGet('SELECT COUNT(*) AS count FROM bot_automation_runs'),
    dbGet('SELECT COUNT(*) AS count FROM bot_automation_schedules'),
    dbGet("SELECT COUNT(*) AS count FROM bot_automation_schedules WHERE status = 'active'")
  ]);

  return {
    creatorTasks: Number(creatorTasks.count || 0),
    workspaces: Number(workspaces.count || 0),
    fileWriteProposals: Number(fileWriteProposals.count || 0),
    tradingStrategies: Number(tradingStrategies.count || 0),
    backtestRuns: Number(backtestRuns.count || 0),
    optimizationSweeps: Number(optimizationSweeps.count || 0),
    splitTests: Number(splitTests.count || 0),
    walkForwardTests: Number(walkForwardTests.count || 0),
    marketDataImports: Number(marketDataImports.count || 0),
    marketDataImportJobs: Number(marketDataImportJobs.count || 0),
    marketDataProviders: Number(marketDataProviders.count || 0),
    marketDataRefreshSchedules: Number(marketDataRefreshSchedules.count || 0),
    botAutomationPlans: Number(botAutomationPlans.count || 0),
    botAutomationRuns: Number(botAutomationRuns.count || 0),
    botAutomationSchedules: Number(botAutomationSchedules.count || 0),
    botAutomationActiveSchedules: Number(botAutomationActiveSchedules.count || 0)
  };
}

function registerReadinessRoutes(app, {
  requireAuth,
  checkDatabase,
  getJsonManifestStatus,
  getOnboardMemorySyncStatus,
  buildLocalLaunchVerificationStatus,
  buildMvpReadinessChecklist,
  dbGet,
  modelConfigPath,
  automationPolicyPath,
  secretProviderCapabilitiesPath,
  port,
  devServerStartedAt,
  projectRoot,
  dbPath
}) {
  const getManifests = () => getReadinessManifests({
    getJsonManifestStatus,
    modelConfigPath,
    automationPolicyPath,
    secretProviderCapabilitiesPath
  });

  app.get('/api/v1/local-verification-status', requireAuth, async (req, res) => {
    try {
      const database = await checkDatabase();
      const manifests = getManifests();
      const memory = getOnboardMemorySyncStatus();
      const launchReadiness = buildLocalLaunchVerificationStatus();
      const localChecksOk = Boolean(database.ok)
        && manifests.every(manifest => manifest.ok)
        && memory.ok
        && launchReadiness.launchStatus === 'blocked'
        && launchReadiness.liveExecution.enabled === false
        && launchReadiness.liveExecution.orderEndpointEnabled === false
        && launchReadiness.liveExecution.goLiveAllowed === false;

      res.json({
        status: {
          ok: localChecksOk,
          generatedAt: new Date().toISOString(),
          server: {
            ok: true,
            port,
            pid: process.pid,
            startedAt: devServerStartedAt,
            uptimeSeconds: Math.round(process.uptime()),
            environment: process.env.NODE_ENV || 'development',
            projectRoot,
            databasePath: dbPath
          },
          database,
          manifests,
          memory,
          launchReadiness
        }
      });
    } catch (error) {
      res.status(500).json({
        status: {
          ok: false,
          generatedAt: new Date().toISOString(),
          error: error.message,
          liveExecution: {
            enabled: false,
            orderEndpointEnabled: false,
            goLiveAllowed: false
          }
        }
      });
    }
  });

  app.get('/api/v1/mvp-readiness-checklist', requireAuth, async (req, res) => {
    try {
      const database = await checkDatabase();
      const manifests = getManifests();
      const memory = getOnboardMemorySyncStatus();
      const launchReadiness = buildLocalLaunchVerificationStatus();
      const counts = await getMvpReadinessCounts(dbGet);
      const latestOwnerAcceptanceRecord = await getLatestOwnerAcceptanceRecord(dbGet);

      res.json({
        readiness: buildMvpReadinessChecklist({
          database,
          manifests,
          memory,
          launchReadiness,
          counts,
          latestOwnerAcceptanceRecord,
          port,
          uptimeSeconds: Math.round(process.uptime())
        })
      });
    } catch (error) {
      res.status(500).json({
        readiness: {
          mvpStatus: 'needs_review',
          liveExecution: {
            enabled: false,
            orderEndpointEnabled: false,
            goLiveAllowed: false
          },
          error: error.message
        }
      });
    }
  });
}

module.exports = {
  getMvpReadinessCounts,
  getReadinessManifests,
  registerReadinessRoutes
};
