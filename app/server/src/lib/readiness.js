const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { buildOwnerAcceptanceSummary } = require('./owner-acceptance');

function displayLocalPath(filePath, projectRoot) {
  const relativePath = path.relative(projectRoot, filePath);

  if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    return relativePath;
  }

  return filePath;
}

function summarizeJsonManifest(id, parsed) {
  if (id === 'local_models') {
    return {
      roles: Array.isArray(parsed.roles) ? parsed.roles.length : 0,
      provider: parsed.provider?.name || parsed.provider?.baseUrl || 'unknown'
    };
  }

  if (id === 'automation_policy') {
    return {
      trustedCommandPrefixes: Array.isArray(parsed.localAutomation?.trustedCommandPrefixes)
        ? parsed.localAutomation.trustedCommandPrefixes.length
        : 0,
      autonomousFileWrites: Boolean(parsed.localAutomation?.allowAutonomousFileWrites),
      autonomousCommandRuns: Boolean(parsed.localAutomation?.allowAutonomousCommandRuns)
    };
  }

  if (id === 'local_secret_providers') {
    return {
      providers: Array.isArray(parsed.providers) ? parsed.providers.length : 0,
      secretValuesAccepted: Boolean(parsed.secretValuesAccepted),
      databaseStoresSecretValues: Boolean(parsed.databaseStoresSecretValues),
      credentialLoadingImplemented: Boolean(parsed.credentialLoadingImplemented)
    };
  }

  return {
    keys: Object.keys(parsed || {}).length
  };
}

function getJsonManifestStatus(id, label, filePath, { projectRoot }) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const stats = fs.statSync(filePath);

    return {
      id,
      label,
      path: filePath,
      displayPath: displayLocalPath(filePath, projectRoot),
      exists: true,
      ok: true,
      sizeBytes: stats.size,
      modifiedAt: stats.mtime.toISOString(),
      summary: summarizeJsonManifest(id, parsed)
    };
  } catch (error) {
    return {
      id,
      label,
      path: filePath,
      displayPath: displayLocalPath(filePath, projectRoot),
      exists: fs.existsSync(filePath),
      ok: false,
      error: error.message
    };
  }
}

function getFileHashStatus(filePath, role, { projectRoot }) {
  try {
    const data = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    return {
      role,
      path: filePath,
      displayPath: displayLocalPath(filePath, projectRoot),
      exists: true,
      ok: true,
      sizeBytes: stats.size,
      modifiedAt: stats.mtime.toISOString(),
      sha256: crypto.createHash('sha256').update(data).digest('hex')
    };
  } catch (error) {
    return {
      role,
      path: filePath,
      displayPath: displayLocalPath(filePath, projectRoot),
      exists: false,
      ok: false,
      sha256: null,
      error: error.message
    };
  }
}

function getOnboardMemorySyncStatus({ canonicalPath, copyPaths, projectRoot }) {
  const files = [
    getFileHashStatus(canonicalPath, 'canonical', { projectRoot }),
    ...copyPaths.map(filePath => getFileHashStatus(filePath, 'owner_copy', { projectRoot }))
  ];
  const presentHashes = files
    .filter(file => file.exists && file.sha256)
    .map(file => file.sha256);
  const uniqueHashes = new Set(presentHashes);
  const synced = files.every(file => file.exists && file.ok) && uniqueHashes.size === 1;

  return {
    ok: synced,
    synced,
    expectedFiles: files.length,
    presentFiles: presentHashes.length,
    uniqueHashes: uniqueHashes.size,
    files
  };
}

function buildLocalLaunchVerificationStatus({
  readSecretProviderCapabilities,
  getExchangeAdapterScaffolds
}) {
  let secretProviderCapabilities = null;
  let secretProviderError = null;

  try {
    secretProviderCapabilities = readSecretProviderCapabilities();
  } catch (error) {
    secretProviderError = error.message;
  }

  const adapterScaffolds = getExchangeAdapterScaffolds();
  const secretProvidersMetadataOnly = Boolean(secretProviderCapabilities)
    && secretProviderCapabilities.secretValuesAccepted === false
    && secretProviderCapabilities.databaseStoresSecretValues === false
    && secretProviderCapabilities.credentialLoadingImplemented === false
    && secretProviderCapabilities.liveExecution?.enabled === false
    && secretProviderCapabilities.providers.every(provider => (
      provider.secretValuesAccepted === false
      && provider.databaseStoresSecretValues === false
      && provider.credentialLoadingImplemented === false
    ));
  const adapterScaffoldsDisabled = adapterScaffolds.length > 0
    && adapterScaffolds.every(scaffold => (
      scaffold.implemented === false
      && scaffold.networkCallsEnabled === false
      && scaffold.credentialLoadingEnabled === false
      && scaffold.liveExecution?.enabled === false
    ));

  return {
    launchStatus: 'blocked',
    automationScope: 'monitor_only_no_live_execution',
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      goLiveAllowed: false,
      walletSigningEnabled: false,
      note: 'Local verification confirms this build remains monitor-only. No credential loader, live adapter, or order endpoint is enabled.'
    },
    requiredBlockedGates: [
      'credential_loader_implemented',
      'live_order_adapter_implemented',
      'live_order_endpoint_enabled',
      'owner_go_live_command_accepted'
    ],
    gates: [
      {
        id: 'secret_provider_manifest_metadata_only',
        label: 'Secret-provider manifest is metadata-only',
        passed: secretProvidersMetadataOnly,
        severity: secretProvidersMetadataOnly ? 'review' : 'block'
      },
      {
        id: 'adapter_scaffolds_disabled',
        label: 'Exchange adapter scaffolds are disabled',
        passed: adapterScaffoldsDisabled,
        severity: adapterScaffoldsDisabled ? 'review' : 'block'
      },
      {
        id: 'credential_loader_implemented',
        label: 'Runtime credential loader implemented',
        passed: false,
        severity: 'block'
      },
      {
        id: 'live_order_adapter_implemented',
        label: 'Live order adapter implemented',
        passed: false,
        severity: 'block'
      },
      {
        id: 'live_order_endpoint_enabled',
        label: 'Live order endpoint enabled',
        passed: false,
        severity: 'block'
      },
      {
        id: 'owner_go_live_command_accepted',
        label: 'Owner go-live command accepted for execution',
        passed: false,
        severity: 'block'
      }
    ],
    capabilities: {
      secretProvidersMetadataOnly,
      secretProviderCount: secretProviderCapabilities?.providers?.length || 0,
      adapterScaffoldsDisabled,
      adapterScaffoldCount: adapterScaffolds.length
    },
    errors: secretProviderError ? [{ source: 'local-secret-providers', message: secretProviderError }] : []
  };
}

function buildCompletionLedger({
  readyForOwnerTesting,
  ownerAcceptance,
  counts = {},
  endToEndBlockingItems = [],
  launchReadiness = {}
}) {
  const ownerAccepted = ownerAcceptance?.status === 'accepted';
  const activePaperSchedules = Number(counts.botAutomationActiveSchedules || 0);
  const hasActivePaperSchedule = activePaperSchedules > 0;
  const hasPublicWalletMetadata = Number(counts.ownerPublicWallets || 0) > 0;
  const liveExecutionLocked = launchReadiness.liveExecution?.enabled === false
    && launchReadiness.liveExecution?.orderEndpointEnabled === false
    && launchReadiness.liveExecution?.goLiveAllowed === false;
  const walletSigningLocked = launchReadiness.liveExecution?.walletSigningEnabled !== true;
  const localE2eComplete = readyForOwnerTesting
    && hasActivePaperSchedule
    && hasPublicWalletMetadata
    && liveExecutionLocked
    && walletSigningLocked;
  const mvpCompletionPercent = ownerAccepted ? 100 : (readyForOwnerTesting ? 99 : 98);
  const localEndToEndCompletionPercent = localE2eComplete
    ? 100
    : readyForOwnerTesting && hasActivePaperSchedule
      ? 97
      : readyForOwnerTesting
        ? 95
        : 88;
  const endToEndCompletionPercent = 72;

  return {
    status: localE2eComplete
      ? 'local_e2e_complete_live_locked'
      : readyForOwnerTesting
        ? 'local_e2e_ready_for_owner_review'
        : 'needs_local_review',
    explanation: 'Readiness is split into Local E2E and Live E2E. Local E2E can complete while live trading remains locked. Live E2E is intentionally locked until a future owner-approved security process exists.',
    percentages: {
      mvp: {
        current: mvpCompletionPercent,
        next: ownerAccepted ? null : 100,
        label: 'Owner-test local MVP',
        reason: ownerAccepted
          ? 'Local owner acceptance has been recorded.'
          : 'The final 1% is reserved for the owner to complete manual testing and record local acceptance.',
        nextAction: ownerAccepted
          ? 'Keep the acceptance record as local evidence.'
          : 'Open /owner-proof-packet, complete the manual checklist, and record local MVP acceptance.'
      },
      localPaperEndToEnd: {
        current: localEndToEndCompletionPercent,
        next: localE2eComplete ? null : (hasActivePaperSchedule ? 100 : 97),
        label: 'Local E2E Readiness',
        status: localE2eComplete ? 'complete' : 'needs_review',
        reason: localE2eComplete
          ? 'MVP is ready, paper trading is complete, a local paper schedule is active, public wallet metadata exists, live trading is disabled, and wallet signing is disabled.'
          : hasActivePaperSchedule
            ? 'A local paper schedule exists. Add or review public wallet metadata, then confirm live trading and wallet signing remain disabled.'
            : 'No active paper schedule is currently running, so the local paper automation path remains in ready/review state.',
        nextAction: localE2eComplete
          ? 'Build strategy, run paper test, review paper bot results, create token plan, draft website/social content, or review security tasks.'
          : hasActivePaperSchedule
            ? 'Review wallet metadata and live lock state.'
            : 'Activate a ready paper schedule in Strategy Lab when owner testing is ready.'
      },
      fullLiveEndToEnd: {
        current: endToEndCompletionPercent,
        next: null,
        label: 'Live E2E Readiness',
        status: 'locked',
        reason: 'Live execution remains blocked by design: credentials, live adapters, live order endpoint, and executable go-live acceptance are not implemented.',
        nextAction: 'No action required in Simple Mode. Open Advanced / Future Integrations only when intentionally starting a future owner-approved live process.'
      }
    },
    gates: [
      {
        id: 'owner_acceptance_recorded',
        label: 'Owner acceptance recorded',
        lane: 'mvp',
        status: ownerAccepted ? 'complete' : 'pending_owner',
        moves: ownerAccepted ? 'MVP is eligible for 100% local accepted state.' : 'MVP remains at 99% until owner acceptance is recorded.',
        nextAction: ownerAccepted ? 'No action needed.' : 'Record local MVP acceptance after manual testing.'
      },
      {
        id: 'active_paper_schedule_reviewed',
        label: 'Local E2E requirements satisfied',
        lane: 'local_paper_end_to_end',
        status: localE2eComplete ? 'complete' : 'pending_owner',
        moves: localE2eComplete ? 'Local E2E is complete while Live E2E remains locked.' : 'Local E2E remains in review until paper schedule, public wallet metadata, and live locks are all confirmed.',
        nextAction: localE2eComplete ? 'No setup action needed. Continue operating local paper workflows.' : 'Activate a ready paper schedule and add public wallet metadata.'
      },
      ...endToEndBlockingItems.map(blockerId => ({
        id: blockerId,
        label: blockerId,
        lane: 'full_live_end_to_end',
        status: 'locked_by_design',
        moves: 'Live E2E is locked by design, not failed.',
        nextAction: 'Keep blocked until a future reviewed live implementation phase.'
      }))
    ],
    counts: {
      activePaperSchedules,
      publicWalletMetadata: Number(counts.ownerPublicWallets || 0),
      blockedLiveGates: endToEndBlockingItems.length,
      requiredBlockedLiveGates: launchReadiness.requiredBlockedGates?.length || endToEndBlockingItems.length
    }
  };
}

function buildMvpReadinessChecklist({
  database,
  manifests,
  memory,
  launchReadiness,
  counts,
  port,
  latestOwnerAcceptanceRecord = null,
  pid = process.pid,
  uptimeSeconds = Math.round(process.uptime())
}) {
  const manifestOk = manifests.every(manifest => manifest.ok);
  const localVerificationOk = Boolean(database.ok)
    && manifestOk
    && memory.ok
    && launchReadiness.launchStatus === 'blocked'
    && launchReadiness.liveExecution.enabled === false
    && launchReadiness.liveExecution.orderEndpointEnabled === false
    && launchReadiness.liveExecution.goLiveAllowed === false;
  const checklist = [
    {
      id: 'local_runtime',
      area: 'Core',
      item: 'Local server runtime is reachable',
      status: 'ready',
      mvpRequired: true,
      endToEndRequired: true,
      evidence: `Port ${port}, PID ${pid}, uptime ${uptimeSeconds}s`,
      nextStep: 'Owner can keep testing locally.'
    },
    {
      id: 'database_reachable',
      area: 'Core',
      item: 'SQLite database is reachable',
      status: database.ok ? 'ready' : 'blocked',
      mvpRequired: true,
      endToEndRequired: true,
      evidence: database.message || 'Database probe completed',
      nextStep: database.ok ? 'No action needed.' : 'Fix local database access before testing.'
    },
    {
      id: 'local_manifests_parse',
      area: 'Configuration',
      item: 'Local model, automation policy, and secret-provider manifests parse',
      status: manifestOk ? 'ready' : 'blocked',
      mvpRequired: true,
      endToEndRequired: true,
      evidence: `${manifests.filter(manifest => manifest.ok).length}/${manifests.length} manifest(s) ok`,
      nextStep: manifestOk ? 'No action needed.' : 'Fix the manifest parse errors shown in Local Verification.'
    },
    {
      id: 'onboard_memory_synced',
      area: 'Handoff',
      item: 'Onboard memory copies are synced',
      status: memory.ok ? 'ready' : 'blocked',
      mvpRequired: true,
      endToEndRequired: true,
      evidence: `${memory.presentFiles}/${memory.expectedFiles} file(s), ${memory.uniqueHashes} unique hash(es)`,
      nextStep: memory.ok ? 'Continue updating memory after every file-changing block.' : 'Sync canonical and Desktop memory copies.'
    },
    {
      id: 'creator_agent_loop',
      area: 'Builder',
      item: 'Creator Agent project loop is available',
      status: 'ready',
      mvpRequired: true,
      endToEndRequired: true,
      evidence: `${counts.creatorTasks} task(s), ${counts.workspaces} workspace(s), ${counts.fileWriteProposals} file proposal(s)`,
      nextStep: 'Owner can test task planning, workspace creation, proposals, checkpoints, and safe commands.'
    },
    {
      id: 'strategy_research_loop',
      area: 'Strategy Lab',
      item: 'Strategy research and backtest artifact loop is available',
      status: 'ready',
      mvpRequired: true,
      endToEndRequired: true,
      evidence: `${counts.tradingStrategies} strateg(ies), ${counts.backtestRuns} backtest(s), ${counts.optimizationSweeps} sweep(s), ${counts.splitTests} split test(s), ${counts.walkForwardTests} walk-forward test(s)`,
      nextStep: 'Owner can test strategy save, import, backtest, sweep, split, and walk-forward flows.'
    },
    {
      id: 'market_data_pipeline',
      area: 'Market Data',
      item: 'Local market-data import and refresh pipeline is available',
      status: 'ready',
      mvpRequired: true,
      endToEndRequired: true,
      evidence: `${counts.marketDataImports} import(s), ${counts.marketDataImportJobs} import job(s), ${counts.marketDataProviders} provider(s), ${counts.marketDataRefreshSchedules} refresh schedule(s)`,
      nextStep: 'Owner can test provider setup, CSV imports, queued jobs, refresh schedules, and retained-source cleanup.'
    },
    {
      id: 'paper_automation_monitor',
      area: 'Automation',
      item: 'Paper bot automation is monitor-only and testable',
      status: 'ready',
      mvpRequired: true,
      endToEndRequired: true,
      evidence: `${counts.botAutomationPlans} bot plan(s), ${counts.botAutomationRuns} run(s), ${counts.botAutomationSchedules} schedule(s)`,
      nextStep: 'Owner can test paper plans, schedules, runs, and readiness events without live execution.'
    },
    {
      id: 'bot_automation_review_exports',
      area: 'Automation',
      item: 'Bot automation review filters, exports, and safety dossiers are testable',
      status: 'ready',
      mvpRequired: true,
      endToEndRequired: true,
      evidence: 'Strategy Lab exposes plan/run/schedule filters, JSON/CSV exports, monitor-only safety dossier export, and dossier history CSV export.',
      nextStep: 'Owner can filter bot automation records, export local evidence, review dossier live-execution blocks, and export compact dossier history before any future go-live phase.'
    },
    {
      id: 'exchange_metadata_boundaries',
      area: 'Exchange Safety',
      item: 'Exchange metadata boundaries are present',
      status: launchReadiness.capabilities.secretProvidersMetadataOnly && launchReadiness.capabilities.adapterScaffoldsDisabled
        ? 'ready'
        : 'blocked',
      mvpRequired: true,
      endToEndRequired: true,
      evidence: `${launchReadiness.capabilities.secretProviderCount} provider capability record(s), ${launchReadiness.capabilities.adapterScaffoldCount} disabled adapter scaffold(s)`,
      nextStep: 'Keep connector work metadata-only until credential loading and adapters are reviewed.'
    },
    {
      id: 'automation_safety_center',
      area: 'Safety',
      item: 'Automation Safety Center blocks live launch',
      status: launchReadiness.launchStatus === 'blocked' ? 'ready' : 'blocked',
      mvpRequired: true,
      endToEndRequired: true,
      evidence: `${launchReadiness.requiredBlockedGates.length} required blocked live gate(s)`,
      nextStep: 'Use the safety panels to verify monitor-only status before owner testing.'
    },
    {
      id: 'credential_loader_implemented',
      area: 'Future Live Execution',
      item: 'Runtime credential loader is implemented',
      status: 'blocked',
      mvpRequired: false,
      endToEndRequired: true,
      evidence: 'Not implemented by design for this MVP.',
      nextStep: 'Future work must add local-only loading with no secret logging, no DB secret storage, and verifier coverage.'
    },
    {
      id: 'live_order_adapter_implemented',
      area: 'Future Live Execution',
      item: 'Live exchange order adapters are implemented',
      status: 'blocked',
      mvpRequired: false,
      endToEndRequired: true,
      evidence: 'Only disabled adapter scaffolds exist.',
      nextStep: 'Future work must replace disabled scaffolds with reviewed exchange-specific adapters.'
    },
    {
      id: 'live_order_endpoint_enabled',
      area: 'Future Live Execution',
      item: 'Live order endpoint is enabled',
      status: 'blocked',
      mvpRequired: false,
      endToEndRequired: true,
      evidence: 'No live order route is enabled.',
      nextStep: 'Future work must add explicit owner enablement, safety gates, and integration tests before any live endpoint exists.'
    },
    {
      id: 'owner_go_live_command_accepted',
      area: 'Future Live Execution',
      item: 'Owner go-live command can execute',
      status: 'blocked',
      mvpRequired: false,
      endToEndRequired: true,
      evidence: 'Owner command parser records intent but refuses execution.',
      nextStep: 'Future work can accept owner go-live only after every live execution gate is reviewed and implemented.'
    }
  ];
  const readyItems = checklist.filter(item => item.status === 'ready').length;
  const mvpBlockingItems = checklist
    .filter(item => item.mvpRequired && item.status === 'blocked')
    .map(item => item.id);
  const endToEndBlockingItems = checklist
    .filter(item => item.endToEndRequired && item.status === 'blocked')
    .map(item => item.id);
  const readyForOwnerTesting = localVerificationOk && mvpBlockingItems.length === 0;
  const botAutomationOwnerWorkflow = {
    status: readyForOwnerTesting ? 'ready_for_owner_testing' : 'needs_review',
    monitorOnly: true,
    counts: {
      plans: counts.botAutomationPlans,
      paperRuns: counts.botAutomationRuns,
      schedules: counts.botAutomationSchedules
    },
    exports: {
      planJsonCsv: true,
      paperRunJsonCsv: true,
      scheduleJsonCsv: true,
      safetyDossierJson: true,
      dossierHistoryCsv: true
    },
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      goLiveAllowed: false
    },
    routeSafetyProfile: {
      moduleId: 'bot-automation',
      boundary: 'monitor_only_no_live_orders',
      liveExecutionEnabled: false,
      source: 'server_route_inventory'
    },
    checks: [
      {
        id: 'paper_scheduler_monitor_only',
        label: 'Paper scheduler is monitor-only',
        status: 'ready',
        evidence: `${counts.botAutomationSchedules} schedule(s); no live order endpoint.`
      },
      {
        id: 'filtered_table_exports',
        label: 'Filtered plan/run/schedule exports are local',
        status: 'ready',
        evidence: 'Strategy Lab exposes JSON and CSV exports from loaded table data.'
      },
      {
        id: 'dossier_exports',
        label: 'Safety dossier exports are local',
        status: 'ready',
        evidence: 'Dossier JSON and compact dossier history CSV exports are client-side evidence snapshots.'
      },
      {
        id: 'live_execution_blocked',
        label: 'Live execution remains blocked',
        status: 'ready',
        evidence: 'No credential loading, no live order endpoint, and no exchange order placement.'
      }
    ]
  };
  const ownerEvidenceArtifacts = [
    {
      id: 'mvp_readiness_checklist',
      label: 'MVP readiness checklist',
      location: '/mvp-test-pass',
      format: 'page/api',
      evidence: `${mvpBlockingItems.length} MVP blocker(s); live execution disabled.`
    },
    {
      id: 'local_verification_status',
      label: 'Local verification status',
      location: '/mvp-test-pass',
      format: 'page/api',
      evidence: 'Database, manifests, memory sync, and blocked live launch gates.'
    },
    {
      id: 'route_inventory_safety',
      label: 'Route inventory safety boundaries',
      location: '/server-route-inventory',
      format: 'page/api',
      evidence: 'Safety-sensitive route groups declare monitor-only or metadata-only boundaries.'
    },
    {
      id: 'bot_table_exports',
      label: 'Bot automation table exports',
      location: '/strategy-lab#bot-automation',
      format: 'json/csv',
      evidence: 'Filtered plan, paper-run, and schedule exports use loaded local data.'
    },
    {
      id: 'bot_safety_dossier',
      label: 'Bot safety dossier evidence',
      location: '/strategy-lab#bot-automation',
      format: 'json/csv',
      evidence: 'Safety dossier JSON and compact dossier history CSV remain monitor-only.'
    }
  ];
  const ownerEvidenceChecksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(ownerEvidenceArtifacts))
    .digest('hex');
  const ownerEvidenceManifest = {
    status: readyForOwnerTesting ? 'ready_for_owner_testing' : 'needs_review',
    localOnly: true,
    liveExecutionEnabled: false,
    exportableEvidence: true,
    blockedLiveGates: endToEndBlockingItems,
    checksum: {
      algorithm: 'sha256',
      value: ownerEvidenceChecksum,
      source: 'ownerEvidenceManifest.artifacts'
    },
    artifacts: ownerEvidenceArtifacts
  };
  const ownerAcceptance = buildOwnerAcceptanceSummary({
    readyForOwnerTesting,
    latestRecord: latestOwnerAcceptanceRecord
  });
  const completionLedger = buildCompletionLedger({
    readyForOwnerTesting,
    ownerAcceptance,
    counts,
    endToEndBlockingItems,
    launchReadiness
  });

  return {
    generatedAt: new Date().toISOString(),
    mvpStatus: readyForOwnerTesting ? 'ready_for_owner_testing' : 'needs_review',
    mvpScope: 'local_research_builder_and_monitor_only',
    mvpCompletionPercent: completionLedger.percentages.mvp.current,
    localEndToEndStatus: completionLedger.percentages.localPaperEndToEnd.status || 'needs_review',
    localEndToEndLabel: completionLedger.percentages.localPaperEndToEnd.label,
    localEndToEndMessage: completionLedger.percentages.localPaperEndToEnd.current === 100
      ? 'Local E2E Complete — You can safely operate local paper trading.'
      : completionLedger.percentages.localPaperEndToEnd.reason,
    localEndToEndCompletionPercent: completionLedger.percentages.localPaperEndToEnd.current,
    liveEndToEndStatus: 'locked',
    liveEndToEndLabel: completionLedger.percentages.fullLiveEndToEnd.label,
    liveEndToEndMessage: 'Live E2E Locked — Future approval required.',
    endToEndCompletionPercent: completionLedger.percentages.fullLiveEndToEnd.current,
    completionLedger,
    automationModes: {
      paper: {
        enabled: true,
        canRunAutomatically: true,
        liveExecutionEnabled: false,
        scheduleWorkerEnabled: true,
        reviewExportsEnabled: true,
        dossierHistoryCsvExport: true,
        note: 'Paper bot schedules can run local paper decision cycles automatically. They cannot place live orders.',
        counts: {
          plans: counts.botAutomationPlans,
          runs: counts.botAutomationRuns,
          schedules: counts.botAutomationSchedules
        }
      },
      live: {
        enabled: false,
        goLiveCommandExecution: false,
        orderEndpointEnabled: false,
        requiredBlockedGates: launchReadiness.requiredBlockedGates,
        note: 'Go-live commands are recorded for blocked review only until credential loading, live adapters, and a live order endpoint are implemented.'
      }
    },
    botAutomationOwnerWorkflow,
    ownerEvidenceManifest,
    ownerAcceptance,
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      goLiveAllowed: false,
      walletSigningEnabled: false,
      note: 'MVP readiness excludes live trading. Live execution remains blocked until future reviewed implementation work.'
    },
    totals: {
      items: checklist.length,
      readyItems,
      blockedItems: checklist.length - readyItems,
      mvpBlockingItems: mvpBlockingItems.length,
      endToEndBlockingItems: endToEndBlockingItems.length
    },
    mvpBlockingItems,
    endToEndBlockingItems,
    checklist,
    counts
  };
}

module.exports = {
  displayLocalPath,
  summarizeJsonManifest,
  getJsonManifestStatus,
  getFileHashStatus,
  getOnboardMemorySyncStatus,
  buildLocalLaunchVerificationStatus,
  buildCompletionLedger,
  buildMvpReadinessChecklist
};
