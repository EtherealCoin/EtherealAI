const crypto = require('crypto');
const { buildOwnerAcceptanceSummary } = require('./owner-acceptance');

function buildFullLiveBlockers(readiness = {}) {
  const checklistById = new Map((readiness.checklist || []).map(item => [item.id, item]));

  return (readiness.endToEndBlockingItems || []).map(blockerId => {
    const item = checklistById.get(blockerId) || {};

    return {
      id: blockerId,
      item: item.item || blockerId,
      evidence: item.evidence || 'Live execution gate remains blocked.',
      nextStep: item.nextStep || 'Review and implement this gate before any future full-live phase.'
    };
  });
}

function buildRouteSafetySummary(routeInventory = {}) {
  const safetyModules = (routeInventory.modules || [])
    .filter(module => module.safetyProfile?.level !== 'standard')
    .map(module => ({
      moduleId: module.moduleId,
      category: module.category,
      boundary: module.safetyProfile.boundary,
      routeCount: module.routeCount,
      liveExecutionEnabled: module.safetyProfile.liveExecutionEnabled
    }));

  return {
    totalRoutes: routeInventory.totalRoutes,
    protectedRoutes: routeInventory.protectedRoutes,
    safetyCriticalModules: routeInventory.safetyCriticalModules,
    modules: safetyModules
  };
}

function buildOwnerTestSummary(readiness = {}, ownerEvidence = {}) {
  const mvpBlockingItems = Number(readiness.totals?.mvpBlockingItems ?? 0);
  const fullLiveBlockingItems = Number(readiness.totals?.endToEndBlockingItems ?? readiness.endToEndBlockingItems?.length ?? 0);
  const liveExecutionDisabled = readiness.liveExecution?.enabled === false
    && readiness.liveExecution?.orderEndpointEnabled === false
    && readiness.liveExecution?.goLiveAllowed === false;

  return {
    readyForOwnerTesting: readiness.mvpStatus === 'ready_for_owner_testing'
      && mvpBlockingItems === 0
      && liveExecutionDisabled
      && ownerEvidence.localOnly === true,
    localMvpBlockers: mvpBlockingItems,
    fullLiveBlockers: fullLiveBlockingItems,
    localOnly: ownerEvidence.localOnly === true,
    liveExecutionDisabled,
    proofSurfaceCount: ownerEvidence.proofSurfaces?.length || 0,
    exportSurfaceCount: ownerEvidence.exportSurfaces?.length || 0
  };
}

function buildPaperAutomationRunbook(botAutomationCapabilityPath = {}) {
  const paperAutomation = botAutomationCapabilityPath.paperAutomation || {};
  const futureLiveAutomation = botAutomationCapabilityPath.futureLiveAutomation || {};
  const counts = paperAutomation.counts || {};
  const blockedGates = futureLiveAutomation.blockedGates || [];
  const canRunAutomatically = paperAutomation.canRunAutomatically === true;

  return {
    status: botAutomationCapabilityPath.status || 'unknown',
    localOnly: true,
    liveExecutionEnabled: false,
    routeBoundary: paperAutomation.routeBoundary || 'monitor_only_no_live_orders',
    ownerMode: canRunAutomatically
      ? 'review_active_paper_automation'
      : 'activate_ready_paper_schedule',
    steps: [
      {
        id: 'review_ready_paper_plans',
        label: 'Review ready paper plans',
        ownerAction: `Confirm ${counts.readyPaperPlans ?? 0} ready paper plan(s) and selected risk profiles in Strategy Lab.`,
        evidence: 'Owner Proof Packet Bot Automation Path and Strategy Lab bot automation filters.'
      },
      {
        id: 'activate_or_review_paper_schedule',
        label: canRunAutomatically ? 'Review active paper schedules' : 'Activate a ready paper schedule',
        ownerAction: canRunAutomatically
          ? `Review ${counts.activeSchedules ?? 0} active paper schedule(s), next run time, and latest schedule result.`
          : 'Create or activate a paper schedule from a ready paper plan when owner testing is ready.',
        evidence: 'Strategy Lab paper schedule table and local paper run records.'
      },
      {
        id: 'inspect_latest_paper_run',
        label: 'Inspect latest paper run',
        ownerAction: paperAutomation.latestRun
          ? `Review paper run #${paperAutomation.latestRun.id} with decision ${paperAutomation.latestRun.decision}.`
          : 'Run a local paper automation cycle before treating the workflow as owner-accepted.',
        evidence: 'Latest paper run card, filtered paper-run export, and safety dossier.'
      },
      {
        id: 'export_local_evidence',
        label: 'Export local evidence',
        ownerAction: 'Export filtered plans, runs, schedules, safety dossier JSON, and dossier history CSV for the local proof set.',
        evidence: 'Strategy Lab export buttons and Owner Proof Packet checksum.'
      },
      {
        id: 'record_local_acceptance',
        label: 'Record local MVP acceptance',
        ownerAction: 'After manual testing, record local acceptance from the Owner Proof Packet with live execution still disabled.',
        evidence: 'Owner acceptance record stored locally; it does not enable live mode.'
      }
    ],
    blockedLiveActions: blockedGates.map(gate => ({
      id: gate,
      label: gate,
      ownerAction: 'Keep blocked until a future reviewed live implementation phase.',
      evidence: 'No credential loading, live exchange adapter, live order endpoint, or executable go-live command is available.'
    })),
    exportSurfaces: botAutomationCapabilityPath.evidence?.availableExports || []
  };
}

function buildOwnerProofPacket({
  readiness = {},
  ownerEvidence = {},
  routeInventory = {},
  botAutomationCapabilityPath = null,
  generatedAt = new Date().toISOString()
}) {
  const ownerTestSummary = buildOwnerTestSummary(readiness, ownerEvidence);
  const ownerAcceptance = readiness.ownerAcceptance || buildOwnerAcceptanceSummary(ownerTestSummary);
  const paperAutomationRunbook = buildPaperAutomationRunbook(botAutomationCapabilityPath || {});

  return {
    generatedAt,
    localOnly: true,
    liveExecutionEnabled: false,
    ownerTestSummary,
    ownerAcceptance,
    status: {
      mvpStatus: readiness.mvpStatus,
      mvpCompletionPercent: readiness.mvpCompletionPercent,
      localEndToEndCompletionPercent: readiness.localEndToEndCompletionPercent,
      fullLiveEndToEndCompletionPercent: readiness.endToEndCompletionPercent,
      botAutomationStatus: botAutomationCapabilityPath?.status || 'unknown',
      goLiveCommandExecution: readiness.automationModes?.live?.goLiveCommandExecution === true,
      liveGoLiveAllowed: readiness.liveExecution?.goLiveAllowed === true
    },
    ownerEvidence,
    completionLedger: readiness.completionLedger || null,
    botAutomationCapabilityPath,
    paperAutomationRunbook,
    proofSurfaces: ownerEvidence.proofSurfaces || [],
    exportSurfaces: ownerEvidence.exportSurfaces || [],
    fullLiveBlockers: buildFullLiveBlockers(readiness),
    routeSafety: buildRouteSafetySummary(routeInventory),
    verificationCommand: "ETHEREALAI_VERIFY_SERVER=1 ETHEREALAI_BASE_URL=http://127.0.0.1:3000 ETHEREALAI_TEST_EMAIL='<owner-login>' ETHEREALAI_TEST_PASSWORD='<owner-password>' npm test"
  };
}

function getOwnerProofPacketChecksumSource(packet) {
  const checksumSource = JSON.parse(JSON.stringify(packet));
  delete checksumSource.checksum;
  return JSON.stringify(checksumSource);
}

function addOwnerProofPacketChecksum(packet) {
  const checksumValue = crypto
    .createHash('sha256')
    .update(getOwnerProofPacketChecksumSource(packet))
    .digest('hex');

  return {
    ...packet,
    checksum: {
      algorithm: 'sha256',
      source: 'ownerProofPacket.withoutChecksum',
      value: checksumValue
    }
  };
}

module.exports = {
  addOwnerProofPacketChecksum,
  buildFullLiveBlockers,
  buildPaperAutomationRunbook,
  buildOwnerAcceptanceSummary,
  buildOwnerTestSummary,
  buildOwnerProofPacket,
  buildRouteSafetySummary,
  getOwnerProofPacketChecksumSource
};
