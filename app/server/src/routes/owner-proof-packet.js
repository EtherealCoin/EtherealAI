const { buildOwnerEvidenceSnapshot } = require('../lib/owner-evidence');
const { getLatestOwnerAcceptanceRecord } = require('../lib/owner-acceptance');
const { buildBotAutomationCapabilityPath } = require('../lib/bot-automation');
const {
  addOwnerProofPacketChecksum,
  buildOwnerProofPacket
} = require('../lib/owner-proof-packet');
const { getServerRouteInventory } = require('../lib/route-inventory');
const {
  getMvpReadinessCounts,
  getReadinessManifests
} = require('./readiness');

function registerOwnerProofPacketRoutes(app, {
  requireAuth,
  checkDatabase,
  getJsonManifestStatus,
  getOnboardMemorySyncStatus,
  buildLocalLaunchVerificationStatus,
  buildMvpReadinessChecklist,
  dbGet,
  dbAll,
  selects,
  parsers,
  modelConfigPath,
  automationPolicyPath,
  secretProviderCapabilitiesPath,
  port,
  projectRoot,
  serverFile
}) {
  const getManifests = () => getReadinessManifests({
    getJsonManifestStatus,
    modelConfigPath,
    automationPolicyPath,
    secretProviderCapabilitiesPath
  });

  app.get('/api/v1/owner-proof-packet', requireAuth, async (req, res) => {
    try {
      const database = await checkDatabase();
      const manifests = getManifests();
      const memory = getOnboardMemorySyncStatus();
      const launchReadiness = buildLocalLaunchVerificationStatus();
      const [
        counts,
        latestOwnerAcceptanceRecord,
        botPlanRows,
        botRunRows,
        botScheduleRows
      ] = await Promise.all([
        getMvpReadinessCounts(dbGet),
        getLatestOwnerAcceptanceRecord(dbGet),
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
      const botAutomationCapabilityPath = buildBotAutomationCapabilityPath({
        plans: botPlanRows.map(parsers.parseBotAutomationPlan),
        runs: botRunRows.map(parsers.parseBotAutomationRun),
        schedules: botScheduleRows.map(parsers.parseBotAutomationSchedule)
      });
      const readiness = buildMvpReadinessChecklist({
        database,
        manifests,
        memory,
        launchReadiness,
        counts,
        latestOwnerAcceptanceRecord,
        port,
        uptimeSeconds: Math.round(process.uptime())
      });
      const ownerEvidence = buildOwnerEvidenceSnapshot();
      const routeInventory = getServerRouteInventory({
        projectRoot,
        serverFile
      });
      const packet = addOwnerProofPacketChecksum(buildOwnerProofPacket({
        readiness,
        ownerEvidence,
        routeInventory,
        botAutomationCapabilityPath
      }));

      res.json({ packet });
    } catch (error) {
      res.status(500).json({
        packet: {
          status: {
            mvpStatus: 'needs_review'
          },
          localOnly: true,
          liveExecutionEnabled: false,
          error: error.message
        }
      });
    }
  });
}

module.exports = {
  registerOwnerProofPacketRoutes
};
