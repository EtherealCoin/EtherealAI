const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');

function pass(message) {
  console.log(`[ok] ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function isOwnerAcceptanceReadyOrAccepted(ownerAcceptance = {}) {
  const pending = ownerAcceptance.status === 'pending_owner_review'
    && ownerAcceptance.localMvpGate === 'ready'
    && ownerAcceptance.acceptanceRequiredForMvp100 === true;
  const accepted = ownerAcceptance.status === 'accepted'
    && ownerAcceptance.localMvpGate === 'accepted'
    && ownerAcceptance.acceptanceRequiredForMvp100 === false;

  return (pending || accepted)
    && ownerAcceptance.requiredArtifacts?.length === 3
    && ownerAcceptance.liveMode === 'blocked';
}

function runNodeSyntaxCheck() {
  const files = [
    'app/server/src/server.js',
    'app/server/src/routes/artifacts.js',
    'app/server/src/routes/auth.js',
    'app/server/src/routes/automation-safety.js',
    'app/server/src/routes/bot-automation.js',
    'app/server/src/routes/commands.js',
    'app/server/src/routes/company-identity.js',
    'app/server/src/routes/creator.js',
    'app/server/src/routes/dev-server.js',
    'app/server/src/routes/exchange-metadata.js',
    'app/server/src/routes/file-proposals.js',
    'app/server/src/routes/health.js',
    'app/server/src/routes/local-models.js',
    'app/server/src/routes/mac-security.js',
    'app/server/src/routes/market-data.js',
    'app/server/src/routes/multi-agent.js',
    'app/server/src/routes/order-intents.js',
    'app/server/src/routes/owner-acceptance.js',
    'app/server/src/routes/owner-proof-packet.js',
    'app/server/src/routes/owner-setup-wizard.js',
    'app/server/src/routes/pages.js',
    'app/server/src/routes/readiness.js',
    'app/server/src/routes/risk-profiles.js',
    'app/server/src/routes/route-inventory.js',
    'app/server/src/routes/social-ops.js',
    'app/server/src/routes/solidity-lab.js',
    'app/server/src/routes/strategy-research.js',
    'app/server/src/routes/system-config.js',
    'app/server/src/routes/system-memory.js',
    'app/server/src/routes/wallet-control.js',
    'app/server/src/routes/workspaces.js',
    'app/server/src/lib/bot-automation.js',
    'app/server/src/lib/command-safety.js',
    'app/server/src/lib/command-runtime.js',
    'app/server/src/lib/company-identity.js',
    'app/server/src/lib/agent-record-actions.js',
    'app/server/src/lib/checklist-actions.js',
    'app/server/src/lib/process-runtime.js',
    'app/server/src/lib/server-paths.js',
    'app/server/src/lib/request-helpers.js',
    'app/server/src/lib/server-startup.js',
    'app/server/src/lib/app-middleware.js',
    'app/server/src/lib/route-registration.js',
    'app/server/src/lib/sqlite-runtime.js',
    'app/server/src/lib/database-schema.js',
    'app/server/src/lib/db-selects.js',
    'app/server/src/lib/db-row-lookups.js',
    'app/server/src/lib/exchange-metadata.js',
    'app/server/src/lib/exchange-readonly-connections.js',
    'app/server/src/lib/exchange-live-safety.js',
    'app/server/src/lib/exchange-sandbox-execution.js',
    'app/server/src/lib/exchange-tiny-live-execution.js',
    'app/server/src/lib/exchange-live-arbitrage-command.js',
    'app/server/src/lib/exchange-treasury-liquidity-intelligence.js',
    'app/server/src/lib/exchange-production-execution.js',
    'app/server/src/lib/local-model-routing.js',
    'app/server/src/lib/local-model-runtime.js',
    'app/server/src/lib/live-execution-handoff.js',
    'app/server/src/lib/mac-security.js',
    'app/server/src/lib/mlx-lifecycle.js',
    'app/server/src/lib/multi-agent-coordination.js',
    'app/server/src/lib/owner-acceptance.js',
    'app/server/src/lib/owner-evidence.js',
    'app/server/src/lib/owner-proof-packet.js',
    'app/server/src/lib/owner-setup-wizard.js',
    'app/server/src/lib/readiness.js',
    'app/server/src/lib/system-config-runtime.js',
    'app/server/src/lib/risk-safety.js',
    'app/server/src/lib/order-intent-simulator.js',
    'app/server/src/lib/risk-profile-actions.js',
    'app/server/src/lib/secret-safety.js',
    'app/server/src/lib/social-ops.js',
    'app/server/src/lib/solidity-lab.js',
    'app/server/src/lib/token-ecosystem.js',
    'app/server/src/lib/wallet-control.js',
    'app/server/src/lib/strategy-research.js',
    'app/server/src/lib/strategy-decision-logs.js',
    'app/server/src/lib/bot-automation-actions.js',
    'app/server/src/lib/bot-automation-schedules.js',
    'app/server/src/lib/strategy-math.js',
    'app/server/src/lib/strategy-signals.js',
    'app/server/src/lib/strategy-arbitrage.js',
    'app/server/src/lib/strategy-engine.js',
    'app/server/src/lib/market-data.js',
    'app/server/src/lib/market-import-files.js',
    'app/server/src/lib/market-import-jobs.js',
    'app/server/src/lib/market-import-dependencies.js',
    'app/server/src/lib/market-refresh-schedules.js',
    'app/server/src/lib/dev-server.js',
    'app/client/js/operator-next-action.js',
    'app/client/js/operator-training.js',
    'app/client/js/operator-mode.js',
    'app/server/src/lib/artifact-rows.js',
    'app/server/src/lib/creator-records.js',
    'app/server/src/lib/workspace-files.js',
    'app/server/src/lib/creator-prompts.js',
    'app/server/src/lib/creator-scaffold.js',
    'app/server/src/lib/route-inventory.js'
  ];

  for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], {
      cwd: projectRoot,
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      process.stdout.write(result.stdout || '');
      process.stderr.write(result.stderr || '');
      fail(`${file} syntax check failed`);
    }
  }

  pass(`node syntax checks (${files.length})`);
}

async function checkExchangeAdapterScaffoldModule() {
  const {
    createDisabledExchangeAdapter,
    getExchangeAdapterScaffolds
  } = require(path.join(projectRoot, 'app/server/src/exchange-adapter-scaffolds'));
  const scaffolds = getExchangeAdapterScaffolds();

  if (
    !scaffolds.some(scaffold => scaffold.exchangeName === 'binance')
    || scaffolds.some(scaffold => scaffold.implemented !== false || scaffold.networkCallsEnabled !== false)
  ) {
    fail('disabled exchange adapter scaffolds did not expose disabled scaffold metadata');
  }

  const adapter = createDisabledExchangeAdapter('binance');

  try {
    await adapter.placeOrder({});
    fail('disabled exchange adapter placeOrder did not throw');
  } catch (error) {
    if (
      error.code !== 'EXCHANGE_ADAPTER_DISABLED'
      || error.details?.networkCallsEnabled !== false
      || error.details?.liveExecutionEnabled !== false
    ) {
      fail('disabled exchange adapter did not throw the expected disabled error');
    }
  }

  pass('disabled exchange adapter scaffold module');
}

function checkOwnerEvidenceModule() {
  const { buildOwnerEvidenceSnapshot } = require(path.join(projectRoot, 'app/server/src/lib/owner-evidence'));
  const ownerEvidence = buildOwnerEvidenceSnapshot();

  if (
    ownerEvidence.status !== 'ready_for_owner_testing'
    || ownerEvidence.localOnly !== true
    || ownerEvidence.liveExecutionEnabled !== false
    || ownerEvidence.routeBoundary !== 'monitor_only_no_live_orders'
    || ownerEvidence.proofSurfaces?.length < 8
    || ownerEvidence.exportSurfaces?.length !== 3
    || ownerEvidence.fullLiveBlockers?.length !== 4
    || !ownerEvidence.proofSurfaces.some(surface => surface.id === 'owner_proof_packet' && surface.location === '/owner-proof-packet')
    || !ownerEvidence.proofSurfaces.some(surface => surface.id === 'owner_setup_wizard' && surface.location === '/owner-setup' && surface.secretValuesReturned === false)
    || !ownerEvidence.proofSurfaces.some(surface => surface.id === 'operator_control_wallets' && surface.location === '/operator-control' && surface.signingEnabled === false)
    || !ownerEvidence.proofSurfaces.some(surface => surface.id === 'mac_security_lockdown' && surface.location === '/security-lockdown' && surface.readOnlyAudit === true)
    || !ownerEvidence.externalSurfaceBoundaries.some(boundary => boundary.moduleId === 'social-ops' && boundary.externalPostingEnabled === false)
    || !ownerEvidence.externalSurfaceBoundaries.some(boundary => boundary.moduleId === 'solidity-lab' && boundary.deploymentEnabled === false)
    || !ownerEvidence.externalSurfaceBoundaries.some(boundary => boundary.moduleId === 'owner-setup' && boundary.secretValuesReturned === false)
    || !ownerEvidence.externalSurfaceBoundaries.some(boundary => boundary.moduleId === 'wallet-control' && boundary.signingEnabled === false)
    || !ownerEvidence.externalSurfaceBoundaries.some(boundary => boundary.moduleId === 'mac-security' && boundary.readOnlyAudit === true)
  ) {
    fail('owner evidence module did not expose the expected local-only proof contract');
  }

  pass('owner evidence module');
}

function checkOwnerAcceptanceModule() {
  const {
    buildOwnerAcceptanceRecordPayload,
    buildOwnerAcceptanceSummary,
    normalizeOwnerAcceptanceRecordInput,
    parseOwnerAcceptanceRecord
  } = require(path.join(projectRoot, 'app/server/src/lib/owner-acceptance'));
  const readySummary = buildOwnerAcceptanceSummary({ readyForOwnerTesting: true });
  const reviewSummary = buildOwnerAcceptanceSummary({ readyForOwnerTesting: false });
  const input = normalizeOwnerAcceptanceRecordInput({
    manualTestCompleted: true,
    proofPacketReviewed: true,
    liveExecutionAcknowledgedDisabled: true,
    proofPacketChecksum: 'a'.repeat(64),
    note: ' fixture acceptance note '
  });
  const blockedInput = normalizeOwnerAcceptanceRecordInput({
    manualTestCompleted: true
  });
  const record = parseOwnerAcceptanceRecord({
    id: 77,
    user_id: 5,
    status: 'accepted',
    note: 'fixture',
    proof_packet_checksum: 'b'.repeat(64),
    local_only: 1,
    live_execution_enabled: 0,
    acceptance_json: JSON.stringify({ liveExecution: { enabled: false } }),
    created_at: '2026-05-16 12:00:00'
  });
  const payload = buildOwnerAcceptanceRecordPayload({
    input,
    ownerAcceptance: readySummary
  });
  const acceptedSummary = buildOwnerAcceptanceSummary({
    readyForOwnerTesting: true,
    latestRecord: record
  });

  if (
    readySummary.status !== 'pending_owner_review'
    || readySummary.localMvpGate !== 'ready'
    || readySummary.acceptanceRequiredForMvp100 !== true
    || readySummary.liveMode !== 'blocked'
    || readySummary.requiredArtifacts?.length !== 3
    || !readySummary.requiredArtifacts.some(artifact => artifact.id === 'owner_proof_packet' && artifact.location === '/owner-proof-packet')
    || reviewSummary.status !== 'needs_local_review'
    || reviewSummary.localMvpGate !== 'review'
    || input.valid !== true
    || input.note !== 'fixture acceptance note'
    || input.proofPacketChecksum !== 'a'.repeat(64)
    || blockedInput.valid !== false
    || !blockedInput.missingChecks.includes('proofPacketReviewed')
    || record.localOnly !== true
    || record.liveExecutionEnabled !== false
    || record.acceptance.liveExecution.enabled !== false
    || payload.liveExecution.enabled !== false
    || payload.liveExecution.goLiveAllowed !== false
    || acceptedSummary.status !== 'accepted'
    || acceptedSummary.localMvpGate !== 'accepted'
    || acceptedSummary.acceptanceRequiredForMvp100 !== false
  ) {
    fail('owner acceptance module did not expose the expected manual-review gate');
  }

  pass('owner acceptance module');
}

function checkOwnerProofPacketModule() {
  const {
    addOwnerProofPacketChecksum,
    buildPaperAutomationRunbook,
    buildOwnerAcceptanceSummary,
    buildOwnerProofPacket,
    getOwnerProofPacketChecksumSource
  } = require(path.join(projectRoot, 'app/server/src/lib/owner-proof-packet'));
  const { buildOwnerEvidenceSnapshot } = require(path.join(projectRoot, 'app/server/src/lib/owner-evidence'));
  const packet = addOwnerProofPacketChecksum(buildOwnerProofPacket({
    readiness: {
      mvpStatus: 'ready_for_owner_testing',
      mvpCompletionPercent: 99,
      localEndToEndCompletionPercent: 95,
      endToEndCompletionPercent: 72,
      automationModes: {
        live: {
          goLiveCommandExecution: false
        }
      },
      liveExecution: {
        enabled: false,
        orderEndpointEnabled: false,
        goLiveAllowed: false
      },
      totals: {
        mvpBlockingItems: 0,
        endToEndBlockingItems: 1
      },
      checklist: [
        {
          id: 'live_order_endpoint_enabled',
          item: 'Live order endpoint is enabled',
          evidence: 'No live order endpoint exists.',
          nextStep: 'Keep blocked until live phase.'
        }
      ],
      endToEndBlockingItems: ['live_order_endpoint_enabled'],
      completionLedger: {
        status: 'waiting_for_owner_acceptance',
        percentages: {
          mvp: { current: 99, next: 100 },
          localPaperEndToEnd: { current: 95, next: 97 },
          fullLiveEndToEnd: { current: 72, next: null }
        },
        gates: [
          {
            id: 'owner_acceptance_recorded',
            status: 'pending_owner'
          },
          {
            id: 'live_order_endpoint_enabled',
            status: 'blocked_by_design'
          }
        ]
      }
    },
    ownerEvidence: buildOwnerEvidenceSnapshot(),
    routeInventory: {
      totalRoutes: 2,
      protectedRoutes: 2,
      safetyCriticalModules: 1,
      modules: [
        {
          moduleId: 'bot-automation',
          category: 'Bot Automation',
          routeCount: 1,
          safetyProfile: {
            level: 'safety_critical',
            boundary: 'monitor_only_no_live_orders',
            liveExecutionEnabled: false
          }
        }
      ]
    },
    botAutomationCapabilityPath: {
      status: 'paper_automation_ready',
      localOnly: true,
      paperAutomation: {
        enabled: true,
        canRunAutomatically: false,
        scheduleWorkerEnabled: true,
        routeBoundary: 'monitor_only_no_live_orders',
        counts: {
          readyPaperPlans: 1,
          activeSchedules: 0,
          pausedSchedules: 0,
          paperPlans: 1
        },
        latestRun: null
      },
      futureLiveAutomation: {
        enabled: false,
        goLiveAllowed: false,
        liveExecutionEnabled: false,
        liveOrderEndpointEnabled: false,
        blockedGates: [
          'credential_loader_implemented',
          'live_order_adapter_implemented',
          'live_order_endpoint_enabled',
          'owner_go_live_command_accepted'
        ]
      }
    },
    generatedAt: '2026-05-16T00:00:00.000Z'
  }));

  if (
    packet.localOnly !== true
    || packet.liveExecutionEnabled !== false
    || packet.ownerTestSummary?.readyForOwnerTesting !== true
    || packet.ownerTestSummary?.localMvpBlockers !== 0
    || packet.ownerTestSummary?.proofSurfaceCount < 8
    || !isOwnerAcceptanceReadyOrAccepted(packet.ownerAcceptance)
    || buildOwnerAcceptanceSummary({ readyForOwnerTesting: false }).status !== 'needs_local_review'
    || packet.status.mvpCompletionPercent !== 99
    || packet.status.botAutomationStatus !== 'paper_automation_ready'
    || packet.completionLedger?.percentages?.mvp?.current !== 99
    || !packet.completionLedger?.gates?.some(gate => gate.id === 'live_order_endpoint_enabled' && gate.status === 'blocked_by_design')
    || packet.botAutomationCapabilityPath?.paperAutomation?.enabled !== true
    || packet.botAutomationCapabilityPath?.futureLiveAutomation?.enabled !== false
    || !packet.botAutomationCapabilityPath?.futureLiveAutomation?.blockedGates?.includes('live_order_endpoint_enabled')
    || packet.paperAutomationRunbook?.localOnly !== true
    || packet.paperAutomationRunbook?.liveExecutionEnabled !== false
    || packet.paperAutomationRunbook?.routeBoundary !== 'monitor_only_no_live_orders'
    || !packet.paperAutomationRunbook?.steps?.some(step => step.id === 'activate_or_review_paper_schedule')
    || !packet.paperAutomationRunbook?.blockedLiveActions?.some(action => action.id === 'live_order_endpoint_enabled')
    || buildPaperAutomationRunbook(packet.botAutomationCapabilityPath).ownerMode !== 'activate_ready_paper_schedule'
    || packet.proofSurfaces.length < 8
    || !packet.proofSurfaces.some(surface => surface.id === 'owner_setup_wizard' && surface.location === '/owner-setup' && surface.secretValuesReturned === false)
    || !packet.proofSurfaces.some(surface => surface.id === 'operator_control_wallets' && surface.location === '/operator-control')
    || !packet.proofSurfaces.some(surface => surface.id === 'mac_security_lockdown' && surface.location === '/security-lockdown')
    || packet.exportSurfaces.length !== 3
    || packet.fullLiveBlockers.length !== 1
    || packet.fullLiveBlockers[0].id !== 'live_order_endpoint_enabled'
    || packet.routeSafety.modules.length !== 1
    || packet.checksum?.algorithm !== 'sha256'
    || packet.checksum?.source !== 'ownerProofPacket.withoutChecksum'
    || !/^[a-f0-9]{64}$/.test(packet.checksum?.value || '')
    || getOwnerProofPacketChecksumSource(packet).includes('"checksum"')
  ) {
    fail('owner proof packet module did not expose a checksummed local-only packet');
  }

  pass('owner proof packet module');
}

function checkCommandSafetyModule() {
  const {
    sanitizeTrustedCommandPrefixes,
    splitCommandForExec
  } = require(path.join(projectRoot, 'app/server/src/lib/command-safety'));
  const prefixes = sanitizeTrustedCommandPrefixes([' npm   test ', 'git status', 'npm test']);
  const parsed = splitCommandForExec('npm test -- --runInBand');

  if (prefixes.length !== 2 || prefixes[0] !== 'npm test' || prefixes[1] !== 'git status') {
    fail('command safety module did not normalize and deduplicate trusted prefixes');
  }

  if (parsed.bin !== 'npm' || parsed.args.join(' ') !== 'test -- --runInBand') {
    fail('command safety module did not split safe command arguments');
  }

  try {
    sanitizeTrustedCommandPrefixes(['rm']);
    fail('command safety module allowed hard-blocked trusted prefix');
  } catch (error) {
    if (!/hard-blocked/.test(error.message)) {
      throw error;
    }
  }

  try {
    splitCommandForExec('npm test; rm -rf /');
    fail('command safety module allowed shell control characters');
  } catch (error) {
    if (!/Shell control characters/.test(error.message)) {
      throw error;
    }
  }

  pass('command safety module');
}

async function checkCommandRuntimeModule() {
  const {
    COMMAND_TEMPLATES,
    createCommandRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/command-runtime'));
  const projectFixtureRoot = '/tmp/etherealai-project';
  const dbRuns = [];
  const execCalls = [];
  const agentEvents = [];
  const runtime = createCommandRuntime({
    path,
    projectRoot: projectFixtureRoot,
    readAutomationPolicy: () => ({
      localAutomation: {
        trustedCommandPrefixes: ['npm test', 'git status', 'node --check'],
        autoRunLowRiskCommands: true
      }
    }),
    async getWorkspace(id) {
      return {
        id,
        path: path.join(projectFixtureRoot, 'workspaces/demo')
      };
    },
    async execFileCapture(bin, args, options) {
      execCalls.push({ bin, args, options });
      return {
        exitCode: bin === 'npm' ? 0 : 1,
        stdout: 'fixture stdout',
        stderr: '',
        error: ''
      };
    },
    async dbRun(query, params) {
      dbRuns.push({ query, params });

      if (query.includes('INSERT INTO command_requests')) {
        return { lastID: 77 };
      }

      if (query.includes('INSERT INTO command_runs')) {
        return { lastID: 88 };
      }

      return { changes: 1 };
    },
    async dbGet(query, params) {
      if (query.includes('command_requests')) {
        return {
          id: params[0],
          task_id: 76,
          workspace_id: null,
          command: 'npm test',
          status: 'review_ready'
        };
      }

      return {
        id: params[0],
        status: 'executed',
        stdout: 'fixture stdout'
      };
    },
    async saveAgentEvent(taskId, eventType, message, metadata) {
      agentEvents.push({ taskId, eventType, message, metadata });
    }
  });
  const allowedReview = runtime.isCommandAllowed('npm test -- --runInBand');
  const blockedReview = runtime.isCommandAllowed('rm -rf /');
  const parsed = runtime.parseSafeCommand('npm test');
  const npmTemplate = runtime.getCommandTemplate('npm-test');
  const serializedTemplate = runtime.serializeCommandTemplate(npmTemplate);
  const commandRun = await runtime.executeCommandRequest({
    id: 70,
    task_id: 71,
    workspace_id: null,
    command: 'npm test'
  });
  const workspaceRun = await runtime.executeCommandRequest({
    id: 72,
    task_id: null,
    workspace_id: 73,
    command: 'node --check src/index.js'
  });
  const createdRequest = await runtime.createCommandRequestRecord({
    taskId: 76,
    workspaceId: null,
    command: 'npm test'
  });
  const outsideRuntime = createCommandRuntime({
    path,
    projectRoot: projectFixtureRoot,
    readAutomationPolicy: () => ({
      localAutomation: {
        trustedCommandPrefixes: ['node --check']
      }
    }),
    async getWorkspace() {
      return {
        path: '/tmp/outside-project'
      };
    },
    async execFileCapture() {
      fail('command runtime executed an outside workspace command');
    },
    async dbRun() {},
    async dbGet() {},
    async saveAgentEvent() {}
  });
  let outsideWorkspaceError = '';

  try {
    await outsideRuntime.executeCommandRequest({
      id: 74,
      workspace_id: 75,
      command: 'node --check src/index.js'
    });
    fail('command runtime allowed execution outside the project boundary');
  } catch (error) {
    outsideWorkspaceError = error.message;
  }

  if (
    !COMMAND_TEMPLATES.some(template => template.id === 'workspace-node-syntax')
    || runtime.commandTemplates.length !== COMMAND_TEMPLATES.length
    || allowedReview.allowed !== true
    || blockedReview.allowed !== false
    || !/hard-blocked/.test(blockedReview.reason)
    || parsed.bin !== 'npm'
    || parsed.args.join(' ') !== 'test'
    || serializedTemplate.allowed !== true
    || commandRun.id !== 88
    || workspaceRun.id !== 88
    || createdRequest.autoRan !== true
    || createdRequest.commandRequest.id !== 77
    || createdRequest.commandRun.id !== 88
    || execCalls[0].options.cwd !== projectFixtureRoot
    || !execCalls[1].options.cwd.endsWith('/workspaces/demo')
    || dbRuns.filter(run => run.query.includes('INSERT INTO command_requests')).length !== 1
    || dbRuns.filter(run => run.query.includes('INSERT INTO command_runs')).length !== 3
    || !agentEvents.some(event => event.eventType === 'command.executed' && event.metadata.commandRunId === 88)
    || !agentEvents.some(event => event.eventType === 'command.requested' && event.metadata.commandRequestId === 77)
    || !/outside the approved project boundary/.test(outsideWorkspaceError)
  ) {
    fail('command runtime module did not preserve safe command/template execution behavior');
  }

  pass('command runtime module');
}

async function checkAgentRecordActionsModule() {
  const {
    createAgentRecordActionsRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/agent-record-actions'));
  const {
    parseFileProposal
  } = require(path.join(projectRoot, 'app/server/src/lib/creator-records'));
  const {
    resolveWorkspacePath
  } = require(path.join(projectRoot, 'app/server/src/lib/workspace-files'));
  const fixtureRoot = path.join(projectRoot, 'workspaces');
  fs.mkdirSync(fixtureRoot, { recursive: true });
  const workspacePath = fs.mkdtempSync(path.join(fixtureRoot, 'agent-record-actions-'));
  const dbRuns = [];
  const gitStatus = {
    branch: 'main',
    clean: true,
    status: '',
    lastCommit: 'abc123 fixture',
    checkedAt: '2026-05-14T00:00:00.000Z'
  };
  let nextProposalId = 300;
  const runtime = createAgentRecordActionsRuntime({
    fs,
    path,
    dbRun: async (query, params) => {
      dbRuns.push({ query, params });

      if (query.includes('INSERT INTO file_write_proposals')) {
        nextProposalId += 1;
        return { lastID: nextProposalId };
      }

      if (query.includes('INSERT INTO checkpoint_records')) {
        return { lastID: 91 };
      }

      return { changes: 1 };
    },
    dbGet: async (query, params) => {
      if (query.includes('file_write_proposals')) {
        return {
          id: params[0],
          task_id: 81,
          workspace_id: 82,
          relative_path: 'src/app.js',
          action: 'create',
          current_content: '',
          proposed_content: 'console.log("fixture");\n',
          status: 'applied',
          applied_at: '2026-05-14T00:00:00.000Z',
          created_at: '2026-05-14T00:00:00.000Z',
          updated_at: '2026-05-14T00:00:00.000Z'
        };
      }

      if (query.includes('checkpoint_records')) {
        return {
          id: params[0],
          task_id: 81,
          note: 'fixture checkpoint',
          git_status: JSON.stringify(gitStatus),
          created_at: '2026-05-14T00:00:00.000Z'
        };
      }

      return null;
    },
    getWorkspace: async id => ({
      id,
      path: workspacePath
    }),
    resolveWorkspacePath,
    parseFileProposal,
    getGitStatusSnapshot: async () => gitStatus
  });
  let missingProposalError = '';
  let pendingProposalError = '';

  try {
    await runtime.applyFileProposalRecord(null);
    fail('agent record actions module allowed a missing file proposal');
  } catch (error) {
    missingProposalError = error.message;
  }

  try {
    await runtime.applyFileProposalRecord({
      id: 80,
      status: 'pending'
    });
    fail('agent record actions module allowed an unapproved file proposal');
  } catch (error) {
    pendingProposalError = error.message;
  }

  const applied = await runtime.applyFileProposalRecord({
    id: 80,
    task_id: 81,
    workspace_id: 82,
    relative_path: 'src/app.js',
    proposed_content: 'console.log("fixture");\n',
    status: 'approved'
  });
  const checkpoint = await runtime.createCheckpointRecord(81, 'fixture checkpoint');
  const proposalIds = await runtime.createFileProposalRecords({
    taskId: 81,
    workspaceId: 82,
    initialStatus: 'pending',
    files: [
      {
        safePath: 'src/one.js',
        currentContent: '',
        proposedContent: 'one'
      },
      {
        safePath: 'src/two.js',
        currentContent: 'old',
        proposedContent: 'two'
      }
    ]
  });
  await runtime.saveAgentEvent(81, 'fixture.event', 'Fixture event', { ok: true });
  const writtenFile = fs.readFileSync(path.join(workspacePath, 'src/app.js'), 'utf8');

  try {
    if (
      !/File proposal not found/.test(missingProposalError)
      || !/approved/.test(pendingProposalError)
      || applied.status !== 'applied'
      || proposalIds.join(',') !== '301,302'
      || writtenFile !== 'console.log("fixture");\n'
      || checkpoint.git_status.clean !== true
      || !dbRuns.some(run => run.query.includes('UPDATE file_write_proposals') && run.params[0] === 80)
      || dbRuns.filter(run => run.query.includes('INSERT INTO file_write_proposals')).length !== 2
      || !dbRuns.some(run => run.query.includes('INSERT INTO file_write_proposals') && run.params[2] === 'src/two.js' && run.params[6] === 'pending')
      || !dbRuns.some(run => run.query.includes('INSERT INTO checkpoint_records') && run.params[0] === 81)
      || !dbRuns.some(run => run.query.includes('INSERT INTO agent_events') && run.params[1] === 'fixture.event' && JSON.parse(run.params[3]).ok === true)
      || !dbRuns.some(run => run.query.includes('INSERT INTO agent_events') && run.params[1] === 'file.proposal.applied')
      || !dbRuns.some(run => run.query.includes('INSERT INTO agent_events') && run.params[1] === 'checkpoint.recorded')
    ) {
      fail('agent record actions module did not preserve proposal/checkpoint/event behavior');
    }
  } finally {
    fs.rmSync(workspacePath, { recursive: true, force: true });
  }

  pass('agent record actions module');
}

async function checkChecklistActionsModule() {
  const {
    createChecklistActionsRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/checklist-actions'));
  const {
    parseChecklistItem
  } = require(path.join(projectRoot, 'app/server/src/lib/creator-records'));
  const rowsByTask = new Map();
  const dbRuns = [];
  const events = [];
  let nextId = 1;
  const runtime = createChecklistActionsRuntime({
    async dbAll(query, params) {
      const taskId = Number(params[0]);
      const rows = rowsByTask.get(taskId) || [];

      if (query.includes('SELECT label')) {
        return rows.map(row => ({ label: row.label }));
      }

      return rows
        .slice()
        .sort((a, b) => a.position - b.position);
    },
    async dbGet(query, params) {
      const taskId = Number(params[0]);
      const rows = rowsByTask.get(taskId) || [];
      const maxPosition = rows.reduce((max, row) => Math.max(max, row.position), 0);

      return { maxPosition };
    },
    async dbRun(query, params) {
      dbRuns.push({ query, params });

      if (query.includes('INSERT INTO task_checklist_items')) {
        const [taskId, label, position] = params;
        const rows = rowsByTask.get(Number(taskId)) || [];
        rows.push({
          id: nextId,
          task_id: taskId,
          label,
          status: 'pending',
          position,
          created_at: '2026-05-14T00:00:00.000Z',
          updated_at: '2026-05-14T00:00:00.000Z'
        });
        nextId += 1;
        rowsByTask.set(Number(taskId), rows);
      }

      return { changes: 1 };
    },
    parseChecklistItem,
    async saveAgentEvent(taskId, eventType, message, metadata) {
      events.push({ taskId, eventType, message, metadata });
    }
  });
  const created = await runtime.createChecklistForTask({
    id: 101,
    plan: {
      phases: ['Build fixture', 'Verify fixture']
    }
  });
  const existing = await runtime.createChecklistForTask({
    id: 101,
    plan: {
      phases: ['Should not insert again']
    }
  });
  const appended = await runtime.appendChecklistItems(
    101,
    ['Add direct test', 'add direct test', '  ', 'Check browser smoke'],
    'checklist.generated',
    { model: 'fixture-model' }
  );
  const unchanged = await runtime.appendChecklistItems(101, [], 'checklist.generated');

  if (
    created.length !== 8
    || existing.length !== created.length
    || appended.length !== 10
    || unchanged.length !== appended.length
    || dbRuns.filter(run => run.query.includes('INSERT INTO task_checklist_items')).length !== 10
    || !events.some(event => event.eventType === 'checklist.created' && event.metadata.itemCount === 8)
    || !events.some(event => event.eventType === 'checklist.generated' && event.metadata.itemCount === 2 && event.metadata.model === 'fixture-model')
    || appended[8].label !== 'Add direct test'
    || appended[9].label !== 'Check browser smoke'
  ) {
    fail('checklist actions module did not preserve checklist creation/append behavior');
  }

  pass('checklist actions module');
}

async function checkProcessRuntimeModule() {
  const {
    createProcessRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/process-runtime'));
  const calls = [];
  const runtime = createProcessRuntime({
    projectRoot: '/tmp/project-root',
    execFile(command, args, options, callback) {
      calls.push({ command, args, options });

      if (command === 'bad-command') {
        callback({ code: 7, message: 'command failed' }, 'ignored stdout\n', 'bad stderr\n');
        return;
      }

      if (command === 'git' && args[0] === 'rev-parse') {
        callback(null, 'main\n', '');
        return;
      }

      if (command === 'git' && args[0] === 'status') {
        callback(null, '', '');
        return;
      }

      if (command === 'git' && args[0] === 'log') {
        callback(null, args.includes('-5') ? 'abc123 fixture commit\nbb222 second fixture\n' : 'abc123 fixture commit\n', '');
        return;
      }

      if (command === 'git' && args[0] === 'remote') {
        callback(null, 'origin https://EtherealCoin@github.com/EtherealCoin/EtherealAI.git (fetch)\norigin https://EtherealCoin@github.com/EtherealCoin/EtherealAI.git (push)\n', '');
        return;
      }

      callback(null, 'trimmed output\n', '');
    }
  });
  const text = await runtime.execFileText('echo', ['fixture']);
  const capture = await runtime.execFileCapture('bad-command', []);
  const gitStatus = await runtime.getGitStatusSnapshot();
  const publishStatus = await runtime.getGitPublishStatus({
    owner: 'EtherealCoin',
    repo: 'EtherealAI'
  });

  if (
    text !== 'trimmed output'
    || calls[0].options.cwd !== '/tmp/project-root'
    || calls[0].options.timeout !== 10000
    || capture.exitCode !== 7
    || capture.stderr !== 'bad stderr'
    || gitStatus.branch !== 'main'
    || gitStatus.clean !== true
    || gitStatus.lastCommit !== 'abc123 fixture commit'
    || publishStatus.target.repo !== 'EtherealAI'
    || publishStatus.git.matchesTarget !== true
    || publishStatus.publishReadiness.authState !== 'needs_pat_or_credential_manager'
    || publishStatus.publishReadiness.passwordAuthAllowed !== false
    || publishStatus.safetyBoundary.noCredentialStored !== true
    || publishStatus.git.recentCommits.length !== 2
  ) {
    fail('process runtime module did not preserve command/Git helper behavior');
  }

  pass('process runtime module');
}

function checkServerPathsModule() {
  const {
    createServerPaths
  } = require(path.join(projectRoot, 'app/server/src/lib/server-paths'));
  const paths = createServerPaths({
    path,
    serverDirname: '/tmp/etherealai-project/app/server/src',
    ownerHome: '/Users/fixture'
  });

  if (
    paths.projectRoot !== '/tmp/etherealai-project'
    || paths.clientDir !== '/tmp/etherealai-project/app/client'
    || paths.dbPath !== '/tmp/etherealai-project/database.sqlite'
    || paths.modelConfigPath !== '/tmp/etherealai-project/config/local-models.json'
    || paths.automationPolicyPath !== '/tmp/etherealai-project/config/automation-policy.json'
    || paths.secretProviderCapabilitiesPath !== '/tmp/etherealai-project/config/local-secret-providers.json'
    || paths.companyIdentityPath !== '/tmp/etherealai-project/config/company-identity.json'
    || paths.onboardMemoryPath !== '/tmp/etherealai-project/ONBOARD_MEMORY.md'
    || paths.onboardMemoryCopyPaths[0] !== '/Users/fixture/Desktop/EtherealAI_ONBOARD_MEMORY copy.md'
    || paths.onboardMemoryCopyPaths[1] !== '/Users/fixture/Desktop/Layer 1/EtherealAI/EtherealAI_ONBOARD_MEMORY.md'
    || paths.workspacesDir !== '/tmp/etherealai-project/workspaces'
    || paths.marketImportUploadDir !== '/tmp/etherealai-project/market-data-uploads'
  ) {
    fail('server paths module did not preserve project path construction');
  }

  pass('server paths module');
}

function checkRequestHelpersModule() {
  const {
    requireAuth,
    createRequestError
  } = require(path.join(projectRoot, 'app/server/src/lib/request-helpers'));
  let nextCalled = false;
  const deniedPayloads = [];

  requireAuth({
    session: {}
  }, {
    status(statusCode) {
      return {
        json(payload) {
          deniedPayloads.push({ statusCode, payload });
        }
      };
    }
  }, () => {
    fail('request helpers called next for unauthenticated request');
  });
  requireAuth({
    session: {
      userId: 1
    }
  }, {}, () => {
    nextCalled = true;
  });
  const error = createRequestError('fixture error', 409, {
    code: 'fixture_conflict'
  });

  if (
    deniedPayloads.length !== 1
    || deniedPayloads[0].statusCode !== 401
    || deniedPayloads[0].payload.error !== 'Authentication required'
    || nextCalled !== true
    || error.message !== 'fixture error'
    || error.statusCode !== 409
    || error.code !== 'fixture_conflict'
  ) {
    fail('request helpers module did not preserve auth/error behavior');
  }

  pass('request helpers module');
}

async function checkServerStartupModule() {
  const {
    startEtherealServer
  } = require(path.join(projectRoot, 'app/server/src/lib/server-startup'));
  const logs = [];
  const errors = [];
  const timers = [];
  const calls = [];
  const server = startEtherealServer({
    app: {
      listen(port, host, callback) {
        calls.push({ type: 'listen', port, host });
        callback();
        return { listening: true, port, host };
      }
    },
    port: 3123,
    async recordDevServerStart() {
      calls.push({ type: 'record-start' });
    },
    async updateDevServerHeartbeat() {
      calls.push({ type: 'heartbeat' });
    },
    scheduleMarketImportWorker() {
      calls.push({ type: 'market-import' });
    },
    scheduleMarketRefreshWorker() {
      calls.push({ type: 'market-refresh' });
    },
    scheduleBotAutomationWorker() {
      calls.push({ type: 'bot-automation' });
    },
    marketRefreshPollMs: 60000,
    botAutomationSchedulePollMs: 120000,
    setIntervalFn(callback, delay) {
      const timer = {
        callback,
        delay,
        unrefCount: 0,
        unref() {
          this.unrefCount += 1;
        }
      };
      timers.push(timer);
      return timer;
    },
    logger: {
      log(message) {
        logs.push(message);
      },
      error(message) {
        errors.push(message);
      }
    }
  });

  timers[0].callback();
  timers[1].callback();
  timers[2].callback();
  await Promise.resolve();

  if (
    server.listening !== true
    || !logs.includes('Server running on 127.0.0.1:3123')
    || calls[0].type !== 'listen'
    || calls[0].port !== 3123
    || calls[0].host !== '127.0.0.1'
    || !calls.some(call => call.type === 'record-start')
    || calls.filter(call => call.type === 'market-import').length !== 1
    || calls.filter(call => call.type === 'market-refresh').length !== 2
    || calls.filter(call => call.type === 'bot-automation').length !== 2
    || calls.filter(call => call.type === 'heartbeat').length !== 1
    || timers.map(timer => timer.delay).join(',') !== '30000,60000,120000'
    || !timers.every(timer => timer.unrefCount === 1)
    || errors.length !== 0
  ) {
    fail('server startup module did not preserve listen/timer behavior');
  }

  pass('server startup module');
}

function checkAppMiddlewareModule() {
  const {
    configureAppMiddleware
  } = require(path.join(projectRoot, 'app/server/src/lib/app-middleware'));
  const uses = [];
  const staticCalls = [];
  const app = {
    use(...args) {
      uses.push(args);
    }
  };
  const fakeExpress = {
    static(dir) {
      staticCalls.push(dir);
      return { type: 'static', dir };
    }
  };

  configureAppMiddleware(app, {
    express: fakeExpress,
    bodyParser: {
      json(options) {
        return { type: 'json', options };
      }
    },
    session(options) {
      return { type: 'session', options };
    },
    helmet(options) {
      return { type: 'helmet', options };
    },
    cors(options) {
      return { type: 'cors', options };
    },
    path,
    projectRoot: '/tmp/etherealai-project',
    clientDir: '/tmp/etherealai-project/app/client',
    frontendUrl: 'http://127.0.0.1:3000',
    sessionSecret: 'fixture-secret'
  });

  if (
    uses.length !== 8
    || uses[0][0].type !== 'json'
    || uses[0][0].options.limit !== '25mb'
    || uses[1][0].type !== 'session'
    || uses[1][0].options.secret !== 'fixture-secret'
    || uses[1][0].options.resave !== false
    || uses[1][0].options.saveUninitialized !== false
    || uses[2][0].type !== 'helmet'
    || uses[2][0].options.contentSecurityPolicy !== false
    || uses[3][0].type !== 'cors'
    || uses[3][0].options.origin !== 'http://127.0.0.1:3000'
    || uses[3][0].options.credentials !== true
    || uses[4][0].dir !== '/tmp/etherealai-project/app/client'
    || uses[5][0] !== '/components'
    || uses[5][1].dir !== '/tmp/etherealai-project/components'
    || uses[6][0] !== '/styles'
    || uses[6][1].dir !== '/tmp/etherealai-project/styles'
    || uses[7][0] !== '/js'
    || uses[7][1].dir !== '/tmp/etherealai-project/js'
    || staticCalls.length !== 4
  ) {
    fail('app middleware module did not preserve middleware/static setup behavior');
  }

  pass('app middleware module');
}

async function checkAuthRoutesModule() {
  const bcrypt = require('bcrypt');
  const {
    normalizeAuthIdentifier,
    normalizeAuthPassword,
    registerAuthRoutes
  } = require(path.join(projectRoot, 'app/server/src/routes/auth'));
  const source = fs.readFileSync(
    path.join(projectRoot, 'app/server/src/routes/auth.js'),
    'utf8'
  );
  const routes = {};
  const getCalls = [];
  const passwordHash = await bcrypt.hash('fixture-password-123', 4);
  const app = {
    post(routePath, handler) {
      routes[`POST ${routePath}`] = handler;
    },
    get(routePath, handler) {
      routes[`GET ${routePath}`] = handler;
    }
  };
  const db = {
    get(sql, params, callback) {
      getCalls.push({ sql, params });
      callback(null, {
        id: 1,
        email: 'patrick@etherealAI',
        password_hash: passwordHash
      });
    },
    run() {
      throw new Error('auth login test should not write');
    }
  };

  registerAuthRoutes(app, { db });

  const loginResult = await new Promise(resolve => {
    const req = {
      body: {
        email: ' patrick@etherealai ',
        password: 'fixture-password-123'
      },
      session: {}
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({
          statusCode: this.statusCode,
          body,
          userId: req.session.userId
        });
      }
    };

    routes['POST /api/v1/auth/login'](req, res);
  });

  if (
    normalizeAuthIdentifier(' patrick@etherealAI ') !== 'patrick@etherealAI'
    || normalizeAuthPassword('fixture-password-123') !== 'fixture-password-123'
    || normalizeAuthPassword(null) !== ''
    || !source.includes('lower(email) = lower(?)')
    || !source.includes('normalizeAuthIdentifier(req.body?.email)')
    || getCalls.length !== 1
    || !/lower\(email\) = lower\(\?\)/.test(getCalls[0].sql)
    || getCalls[0].params[0] !== 'patrick@etherealai'
    || loginResult.statusCode !== 200
    || loginResult.userId !== 1
    || loginResult.body.message !== 'Logged in successfully'
  ) {
    fail('auth route module did not preserve trimmed case-insensitive owner login behavior');
  }

  pass('auth route module');
}

function checkRouteRegistrationModule() {
  const routeRegistrationSource = fs.readFileSync(
    path.join(projectRoot, 'app/server/src/lib/route-registration.js'),
    'utf8'
  );
  const serverSource = fs.readFileSync(
    path.join(projectRoot, 'app/server/src/server.js'),
    'utf8'
  );
  const expectedRouteRegistrars = [
    'registerAuthRoutes',
    'registerSystemConfigRoutes',
    'registerCompanyIdentityRoutes',
    'registerHealthRoutes',
    'registerReadinessRoutes',
    'registerRouteInventoryRoutes',
    'registerOwnerAcceptanceRoutes',
    'registerOwnerSetupWizardRoutes',
    'registerDevServerRoutes',
    'registerSystemMemoryRoutes',
    'registerWalletControlRoutes',
    'registerMacSecurityRoutes',
    'registerAutomationSafetyRoutes',
    'registerArtifactRoutes',
    'registerLocalModelRoutes',
    'registerMultiAgentRoutes',
    'registerCreatorRoutes',
    'registerWorkspaceRoutes',
    'registerFileProposalRoutes',
    'registerStrategyResearchRoutes',
    'registerExchangeMetadataRoutes',
    'registerMarketDataRoutes',
    'registerRiskProfileRoutes',
    'registerOrderIntentRoutes',
    'registerSocialOpsRoutes',
    'registerBotAutomationRoutes',
    'registerSolidityLabRoutes',
    'registerCommandRoutes',
    'registerPageRoutes'
  ];

  if (
    !routeRegistrationSource.includes('function registerEtherealRoutes')
    || !routeRegistrationSource.includes("require('../routes/owner-acceptance')")
    || !routeRegistrationSource.includes("require('../routes/owner-setup-wizard')")
    || !routeRegistrationSource.includes("require('../routes/company-identity')")
    || !routeRegistrationSource.includes("require('../routes/bot-automation')")
    || !routeRegistrationSource.includes("require('../routes/multi-agent')")
    || !routeRegistrationSource.includes("require('../routes/wallet-control')")
    || !routeRegistrationSource.includes("require('../routes/mac-security')")
    || !routeRegistrationSource.includes("require('../routes/strategy-research')")
    || !routeRegistrationSource.includes("require('../routes/pages')")
    || !expectedRouteRegistrars.every(name => routeRegistrationSource.includes(`${name}(app`))
    || !serverSource.includes("require('./lib/route-registration')")
    || !serverSource.includes('registerEtherealRoutes(app,')
    || !serverSource.includes('const ROUTE_SELECTS = {')
    || !serverSource.includes('const ROW_LOOKUP_SELECTS = {')
    || !serverSource.includes('const ROUTE_PARSERS = {')
    || !serverSource.includes("require('./lib/live-execution-handoff')")
    || !serverSource.includes("require('./lib/owner-setup-wizard')")
    || !serverSource.includes("require('./lib/wallet-control')")
    || !serverSource.includes("require('./lib/mac-security')")
    || !serverSource.includes("const SERVER_HOST = String(process.env.ETHEREALAI_HOST || '127.0.0.1')")
    || !serverSource.includes('buildCompanySetupPlan')
    || !serverSource.includes('normalizeCompanyDnsTargetInput')
    || !serverSource.includes('parseCompanyDnsTarget')
    || !serverSource.includes('normalizeTokenEcosystemProjectInput')
    || !serverSource.includes('buildTokenEcosystemProjectBlueprint')
    || !serverSource.includes('buildTokenEcosystemWorkspaceFiles')
    || !serverSource.includes('parseTokenEcosystemProject')
    || !serverSource.includes('sanitizeWalletInput')
    || !serverSource.includes('parseOwnerWallet')
    || !serverSource.includes('parseWalletPermissionEvent')
    || !serverSource.includes('buildOperatorControlSummary')
    || !serverSource.includes('simulateCrossExchangeArbitrage')
    || !serverSource.includes('parseArbitrageSimulationRun')
    || !serverSource.includes('simulateTopRebalanceBatch')
    || !serverSource.includes('parseRebalanceSimulationBatch')
    || !serverSource.includes('parseRebalanceCandidateCsv')
    || !serverSource.includes('getGitPublishStatus')
    || !serverSource.includes('buildOwnerSetupWizard')
    || !serverSource.includes('OWNER_ENV_PATH')
    || !routeRegistrationSource.includes('parseTokenEcosystemProject: parsers.parseTokenEcosystemProject')
    || !routeRegistrationSource.includes('simulateCrossExchangeArbitrage')
    || !routeRegistrationSource.includes('parseArbitrageSimulationRun: parsers.parseArbitrageSimulationRun')
    || !routeRegistrationSource.includes('simulateTopRebalanceBatch')
    || !routeRegistrationSource.includes('parseRebalanceSimulationBatch: parsers.parseRebalanceSimulationBatch')
    || !routeRegistrationSource.includes('parseRebalanceCandidateCsv')
    || !routeRegistrationSource.includes('parseTokenEcosystemProject: parsers.parseTokenEcosystemProject')
    || !routeRegistrationSource.includes('getGitPublishStatus')
    || !routeRegistrationSource.includes('registerWalletControlRoutes(app')
    || !routeRegistrationSource.includes('parseWalletPermissionEvent')
    || !serverSource.includes('selects: ROW_LOOKUP_SELECTS')
    || !serverSource.includes('selects: ROUTE_SELECTS')
    || !serverSource.includes('parsers: ROUTE_PARSERS')
    || serverSource.includes("require('./routes/")
  ) {
    fail('route registration module did not preserve centralized route wiring');
  }

  pass('route registration module');
}

async function checkSqliteRuntimeModule() {
  const {
    createSqliteRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/sqlite-runtime'));
  const calls = [];
  let healthFails = false;
  const runtime = createSqliteRuntime({
    run(sql, params, callback) {
      calls.push({ method: 'run', sql, params });
      callback.call({ lastID: 123, changes: 2 }, null);
    },
    all(sql, params, callback) {
      calls.push({ method: 'all', sql, params });
      callback(null, [{ id: 1 }, { id: 2 }]);
    },
    get(sql, params, callback) {
      if (typeof params === 'function') {
        calls.push({ method: 'get-health', sql });
        params(healthFails ? new Error('database offline') : null, { ok: 1 });
        return;
      }

      calls.push({ method: 'get', sql, params });
      callback(null, { id: params[0] });
    }
  });
  const runResult = await runtime.dbRun('INSERT fixture', ['a']);
  const allResult = await runtime.dbAll('SELECT all fixture', [1]);
  const getResult = await runtime.dbGet('SELECT one fixture', [7]);
  const healthy = await runtime.checkDatabase();
  healthFails = true;
  const unhealthy = await runtime.checkDatabase();

  if (
    runResult.lastID !== 123
    || runResult.changes !== 2
    || allResult.length !== 2
    || getResult.id !== 7
    || healthy.ok !== true
    || healthy.message !== 'SQLite is reachable'
    || unhealthy.ok !== false
    || unhealthy.message !== 'database offline'
    || !calls.some(call => call.method === 'run' && call.params[0] === 'a')
    || !calls.some(call => call.method === 'all' && call.params[0] === 1)
    || !calls.some(call => call.method === 'get' && call.params[0] === 7)
    || calls.filter(call => call.method === 'get-health').length !== 2
  ) {
    fail('sqlite runtime module did not preserve promise wrapper/health behavior');
  }

  pass('sqlite runtime module');
}

function checkDatabaseSchemaModule() {
  const {
    initializeDatabase
  } = require(path.join(projectRoot, 'app/server/src/lib/database-schema'));
  const runCalls = [];
  let serializeCount = 0;

  initializeDatabase({
    serialize(callback) {
      serializeCount += 1;
      callback();
    },
    run(sql, callback) {
      runCalls.push({ sql, hasCallback: typeof callback === 'function' });
    }
  });

  const statements = runCalls.map(call => call.sql);
  const createTableStatements = statements.filter(statement => /CREATE TABLE IF NOT EXISTS/.test(statement));
  const alterStatements = statements.filter(statement => /^ALTER TABLE/.test(statement));

  if (
    serializeCount !== 1
    || createTableStatements.length < 30
    || alterStatements.length < 10
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS users'))
    || !statements.some(statement => statement.includes("strategy_type TEXT NOT NULL DEFAULT 'indicator'"))
    || !statements.some(statement => statement.includes("strategy_rules_json TEXT NOT NULL DEFAULT '{}'"))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS bot_automation_plans'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS bot_automation_schedules'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS arbitrage_simulation_runs'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS rebalance_simulation_batches'))
    || !statements.some(statement => statement.includes("strategy_type TEXT NOT NULL DEFAULT 'top_200_rebalance_batch'"))
    || !statements.some(statement => statement.includes('network_calls_enabled INTEGER NOT NULL DEFAULT 0'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS multi_agent_coordination_runs'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS multi_agent_contributions'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS company_dns_targets'))
    || !statements.some(statement => statement.includes('external_mutation_enabled INTEGER NOT NULL DEFAULT 0'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS token_ecosystem_projects'))
    || !statements.some(statement => statement.includes('external_actions_enabled INTEGER NOT NULL DEFAULT 0'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS owner_wallets'))
    || !statements.some(statement => statement.includes('secret_reference_id INTEGER'))
    || !statements.some(statement => statement.includes('signing_enabled INTEGER NOT NULL DEFAULT 0'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS wallet_permission_events'))
    || !statements.some(statement => statement.includes('evidence_json TEXT NOT NULL DEFAULT'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS owner_acceptance_records'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS market_data_import_jobs'))
    || !statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS dev_server_logs'))
    || !statements.some(statement => statement.includes('ALTER TABLE market_data_refresh_schedules ADD COLUMN backfill_start_at TEXT'))
    || !statements.some(statement => statement.includes('ALTER TABLE market_data_import_jobs ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0'))
    || !runCalls.some(call => call.sql.includes("ALTER TABLE trading_strategies ADD COLUMN strategy_type TEXT NOT NULL DEFAULT 'indicator'") && call.hasCallback)
    || !runCalls.some(call => call.sql.includes("ALTER TABLE trading_strategies ADD COLUMN strategy_rules_json TEXT NOT NULL DEFAULT '{}'") && call.hasCallback)
    || !runCalls.some(call => call.sql.includes('ALTER TABLE exchange_connectors ADD COLUMN secret_reference_id INTEGER') && call.hasCallback)
  ) {
    fail('database schema module did not preserve schema bootstrap statements');
  }

  pass('database schema module');
}

function checkDbSelectsModule() {
  const selects = require(path.join(projectRoot, 'app/server/src/lib/db-selects'));
  const expectedKeys = [
    'EXCHANGE_CONNECTOR_SELECT',
    'EXCHANGE_CONNECTOR_READINESS_EVENT_SELECT',
    'EXCHANGE_ADAPTER_CONTRACT_EVENT_SELECT',
    'BOT_AUTOMATION_PLAN_SELECT',
    'BOT_AUTOMATION_RUN_SELECT',
    'BOT_LIVE_READINESS_EVENT_SELECT',
    'BOT_LIVE_ENABLEMENT_REVIEW_SELECT',
    'BOT_AUTOMATION_SCHEDULE_SELECT'
  ];

  if (
    !expectedKeys.every(key => typeof selects[key] === 'string' && selects[key].includes('SELECT'))
    || !selects.EXCHANGE_CONNECTOR_SELECT.includes('local_secret_references')
    || !selects.BOT_AUTOMATION_PLAN_SELECT.includes('LEFT JOIN risk_profiles')
    || !selects.BOT_AUTOMATION_RUN_SELECT.includes('market_data_imports.label AS market_import_label')
    || !selects.BOT_LIVE_READINESS_EVENT_SELECT.includes('bot_live_readiness_events')
    || !selects.BOT_LIVE_ENABLEMENT_REVIEW_SELECT.includes('bot_live_enablement_reviews')
    || !selects.BOT_AUTOMATION_SCHEDULE_SELECT.includes('bot_automation_schedules')
  ) {
    fail('db selects module did not preserve shared SELECT fragments');
  }

  pass('db selects module');
}

async function checkDbRowLookupsModule() {
  const {
    createDbRowLookupRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/db-row-lookups'));
  const calls = [];
  const runtime = createDbRowLookupRuntime({
    async dbGet(query, params) {
      calls.push({ query, params });
      return { query, params };
    },
    selects: {
      exchangeConnector: 'SELECT exchange_connectors.* FROM exchange_connectors',
      exchangeConnectorReadinessEvent: 'SELECT exchange_connector_readiness_events.* FROM exchange_connector_readiness_events',
      exchangeAdapterContractEvent: 'SELECT exchange_adapter_contract_events.* FROM exchange_adapter_contract_events',
      botAutomationPlan: 'SELECT bot_automation_plans.* FROM bot_automation_plans',
      botAutomationSchedule: 'SELECT bot_automation_schedules.* FROM bot_automation_schedules',
      botAutomationRun: 'SELECT bot_automation_runs.* FROM bot_automation_runs',
      botLiveReadinessEvent: 'SELECT bot_live_readiness_events.* FROM bot_live_readiness_events',
      botLiveEnablementReview: 'SELECT bot_live_enablement_reviews.* FROM bot_live_enablement_reviews'
    }
  });
  const cases = [
    ['getExchangeConnectorRow', 51, 'WHERE exchange_connectors.id = ?'],
    ['getExchangeConnectorReadinessEventRow', 52, 'WHERE exchange_connector_readiness_events.id = ?'],
    ['getExchangeAdapterContractEventRow', 53, 'WHERE exchange_adapter_contract_events.id = ?'],
    ['getBotAutomationPlanRow', 54, 'WHERE bot_automation_plans.id = ?'],
    ['getBotAutomationScheduleRow', 55, 'WHERE bot_automation_schedules.id = ?'],
    ['getBotAutomationRunRow', 56, 'WHERE bot_automation_runs.id = ?'],
    ['getBotLiveReadinessEventRow', 57, 'WHERE bot_live_readiness_events.id = ?'],
    ['getBotLiveEnablementReviewRow', 58, 'WHERE bot_live_enablement_reviews.id = ?']
  ];

  for (const [methodName, id, whereClause] of cases) {
    const row = await runtime[methodName](id);

    if (
      row.params.length !== 1
      || row.params[0] !== id
      || !row.query.includes(whereClause)
    ) {
      fail(`db row lookup ${methodName} did not preserve its select/where behavior`);
    }
  }

  if (calls.length !== cases.length) {
    fail('db row lookup module did not call dbGet once per lookup');
  }

  pass('db row lookup module');
}

function checkReadinessModule() {
  const {
    summarizeJsonManifest,
    buildLocalLaunchVerificationStatus,
    buildMvpReadinessChecklist
  } = require(path.join(projectRoot, 'app/server/src/lib/readiness'));
  const automationSummary = summarizeJsonManifest('automation_policy', {
    localAutomation: {
      trustedCommandPrefixes: ['npm test', 'git status'],
      allowAutonomousFileWrites: true,
      allowAutonomousCommandRuns: false
    }
  });
  const launchReadiness = buildLocalLaunchVerificationStatus({
    readSecretProviderCapabilities: () => ({
      secretValuesAccepted: false,
      databaseStoresSecretValues: false,
      credentialLoadingImplemented: false,
      liveExecution: { enabled: false },
      providers: [
        {
          secretValuesAccepted: false,
          databaseStoresSecretValues: false,
          credentialLoadingImplemented: false
        }
      ]
    }),
    getExchangeAdapterScaffolds: () => [
      {
        implemented: false,
        networkCallsEnabled: false,
        credentialLoadingEnabled: false,
        liveExecution: { enabled: false }
      }
    ]
  });
  const counts = {
    creatorTasks: 0,
    workspaces: 0,
    fileWriteProposals: 0,
    tradingStrategies: 0,
    backtestRuns: 0,
    optimizationSweeps: 0,
    splitTests: 0,
    walkForwardTests: 0,
    marketDataImports: 0,
    marketDataImportJobs: 0,
    marketDataProviders: 0,
    marketDataRefreshSchedules: 0,
    botAutomationPlans: 0,
    botAutomationRuns: 0,
    botAutomationSchedules: 0,
    botAutomationActiveSchedules: 0
  };
  const readiness = buildMvpReadinessChecklist({
    database: { ok: true, message: 'ok' },
    manifests: [{ ok: true }, { ok: true }, { ok: true }],
    memory: { ok: true, presentFiles: 3, expectedFiles: 3, uniqueHashes: 1 },
    launchReadiness,
    counts,
    port: 3000,
    pid: 123,
    uptimeSeconds: 45
  });

  if (
    automationSummary.trustedCommandPrefixes !== 2
    || automationSummary.autonomousFileWrites !== true
    || automationSummary.autonomousCommandRuns !== false
  ) {
    fail('readiness module did not summarize automation policy manifests');
  }

  if (
    launchReadiness.launchStatus !== 'blocked'
    || launchReadiness.liveExecution?.enabled !== false
    || launchReadiness.capabilities?.secretProvidersMetadataOnly !== true
    || launchReadiness.capabilities?.adapterScaffoldsDisabled !== true
  ) {
    fail('readiness module did not preserve blocked live-launch status');
  }

  if (
    readiness.mvpStatus !== 'ready_for_owner_testing'
    || readiness.automationModes?.paper?.canRunAutomatically !== true
    || readiness.automationModes?.paper?.reviewExportsEnabled !== true
    || readiness.automationModes?.paper?.dossierHistoryCsvExport !== true
    || readiness.automationModes?.live?.enabled !== false
    || readiness.liveExecution?.goLiveAllowed !== false
    || readiness.localEndToEndCompletionPercent !== 95
    || readiness.completionLedger?.percentages?.mvp?.current !== 99
    || readiness.completionLedger?.percentages?.mvp?.next !== 100
    || readiness.completionLedger?.percentages?.localPaperEndToEnd?.current !== 95
    || readiness.completionLedger?.percentages?.fullLiveEndToEnd?.current !== 72
    || !readiness.completionLedger?.gates?.some(gate => gate.id === 'owner_acceptance_recorded' && gate.status === 'pending_owner')
    || !readiness.completionLedger?.gates?.some(gate => gate.id === 'active_paper_schedule_reviewed' && gate.status === 'pending_owner')
    || readiness.liveEndToEndStatus !== 'locked'
    || readiness.liveEndToEndMessage !== 'Live E2E Locked — Future approval required.'
    || !readiness.completionLedger?.gates?.some(gate => gate.id === 'live_order_endpoint_enabled' && gate.status === 'locked_by_design')
    || readiness.botAutomationOwnerWorkflow?.monitorOnly !== true
    || readiness.botAutomationOwnerWorkflow?.exports?.dossierHistoryCsv !== true
    || readiness.botAutomationOwnerWorkflow?.routeSafetyProfile?.boundary !== 'monitor_only_no_live_orders'
    || readiness.botAutomationOwnerWorkflow?.routeSafetyProfile?.liveExecutionEnabled !== false
    || !readiness.botAutomationOwnerWorkflow?.checks?.some(check => check.id === 'dossier_exports' && check.status === 'ready')
    || readiness.ownerEvidenceManifest?.localOnly !== true
    || readiness.ownerEvidenceManifest?.liveExecutionEnabled !== false
    || readiness.ownerEvidenceManifest?.checksum?.algorithm !== 'sha256'
    || !/^[a-f0-9]{64}$/.test(readiness.ownerEvidenceManifest?.checksum?.value || '')
    || readiness.ownerEvidenceManifest?.checksum?.source !== 'ownerEvidenceManifest.artifacts'
    || !readiness.ownerEvidenceManifest?.artifacts?.some(item => item.id === 'bot_safety_dossier' && item.format === 'json/csv')
    || !isOwnerAcceptanceReadyOrAccepted(readiness.ownerAcceptance)
    || !readiness.endToEndBlockingItems.includes('live_order_endpoint_enabled')
    || !readiness.checklist.some(item => item.id === 'bot_automation_review_exports' && item.status === 'ready' && item.mvpRequired === true)
    || !readiness.checklist.some(item => item.id === 'local_runtime' && item.evidence.includes('Port 3000'))
  ) {
    fail('readiness module did not build the expected MVP/live-blocked checklist');
  }

  pass('readiness module');
}

function checkLocalModelRoutingModule() {
  const {
    countPromptHits,
    chooseModelRoleForPrompt
  } = require(path.join(projectRoot, 'app/server/src/lib/local-model-routing'));
  const modelConfig = {
    roles: {
      planner: { model: 'planner' },
      coder: { model: 'coder' },
      writer: { model: 'writer' },
      autocomplete: { model: 'autocomplete' }
    }
  };
  const coderRouting = chooseModelRoleForPrompt('Fix this API endpoint and add a test.', 'auto', modelConfig);
  const writerRouting = chooseModelRoleForPrompt('Draft a social announcement thread.', 'auto', modelConfig);
  const autocompleteRouting = chooseModelRoleForPrompt('complete this inline snippet', 'auto', modelConfig);
  const manualRouting = chooseModelRoleForPrompt('anything', 'coder', modelConfig);
  let invalidRoleMessage = '';

  try {
    chooseModelRoleForPrompt('anything', 'not-a-role', modelConfig);
    fail('local model routing allowed an invalid manual role');
  } catch (error) {
    invalidRoleMessage = error.message;
  }

  if (
    countPromptHits('code code coding', ['code']) !== 2
    || coderRouting.role !== 'coder'
    || writerRouting.role !== 'writer'
    || autocompleteRouting.role !== 'autocomplete'
    || manualRouting.mode !== 'manual'
    || manualRouting.role !== 'coder'
    || !invalidRoleMessage.includes('Unknown model role')
  ) {
    fail('local model routing module did not preserve role scoring behavior');
  }

  pass('local model routing module');
}

async function checkLocalModelRuntimeModule() {
  const {
    chooseModelRoleForPrompt
  } = require(path.join(projectRoot, 'app/server/src/lib/local-model-routing'));
  const {
    createLocalModelRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/local-model-runtime'));
  const modelConfig = {
    provider: {
      name: 'ollama',
      type: 'ollama',
      baseUrl: 'http://localhost:11434'
    },
    providers: {
      ollama: {
        name: 'ollama',
        type: 'ollama',
        baseUrl: 'http://localhost:11434'
      },
      mlx: {
        name: 'mlx',
        type: 'openai_compatible',
        baseUrl: 'http://localhost:8080/v1',
        optional: true
      }
    },
    roles: {
      coder: {
        provider: 'ollama',
        model: 'coder-model',
        temperature: 0.2,
        think: false
      },
      planner: {
        provider: 'ollama',
        model: 'planner-model',
        temperature: 0.3
      }
    }
  };
  const fetchCalls = [];
  const timers = [];
  const clearedTimers = [];
  const runtime = createLocalModelRuntime({
    readModelConfig: () => modelConfig,
    chooseModelRoleForPrompt,
    env: {
      OLLAMA_BASE_URL: 'http://fixture-ollama'
    },
    setTimeoutFn(callback, delay) {
      const token = { callback, delay };
      timers.push(token);
      return token;
    },
    clearTimeoutFn(token) {
      clearedTimers.push(token);
    },
    fetchImpl: async (url, options = {}) => {
      fetchCalls.push({ url, options });

      if (url.endsWith('/api/tags')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            models: [
              { name: 'coder-model' },
              { name: 'planner-model' }
            ]
          })
        };
      }

      if (url.endsWith('/api/generate')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            response: 'fixture response',
            done: true
          })
        };
      }

      if (url.endsWith('/models')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              { id: 'mlx-coder-model' }
            ]
          })
        };
      }

      if (url.endsWith('/chat/completions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: 'mlx fixture response'
                }
              }
            ]
          })
        };
      }

      throw new Error(`unexpected fetch url ${url}`);
    }
  });
  const health = await runtime.checkOllama(modelConfig);
  const generated = await runtime.generateWithLocalModel('coder', 'Fix this API and add a test.');
  const providerHealth = await runtime.checkLocalModelProviders(modelConfig);
  const mlxGenerated = await runtime.generateWithLocalModel('coder', 'Fix this API and add a test.', {
    provider: 'mlx',
    model: 'mlx-coder-model',
    maxTokens: 64
  });
  const benchmark = await runtime.benchmarkLocalModel({
    role: 'coder',
    prompt: 'Benchmark this route.',
    provider: 'mlx',
    model: 'mlx-coder-model',
    maxTokens: 64,
    timeoutMs: 30000
  });
  const generateBody = JSON.parse(fetchCalls.find(call => call.url.endsWith('/api/generate')).options.body);
  const chatBody = JSON.parse(fetchCalls.find(call => call.url.endsWith('/chat/completions')).options.body);
  const failingRuntime = createLocalModelRuntime({
    readModelConfig: () => modelConfig,
    chooseModelRoleForPrompt: () => ({ role: 'missing' }),
    fetchImpl: async () => {
      fail('local model runtime fetched for a missing role');
    }
  });
  let missingRoleError = '';

  try {
    await failingRuntime.generateWithLocalModel('missing', 'anything');
    fail('local model runtime allowed a missing role');
  } catch (error) {
    missingRoleError = error.message;
  }

  if (
    health.ok !== true
    || health.baseUrl !== 'http://fixture-ollama'
    || health.installedModels.join(',') !== 'coder-model,planner-model'
    || generated.role !== 'coder'
    || generated.provider !== 'ollama'
    || generated.model !== 'coder-model'
    || generated.response !== 'fixture response'
    || generated.done !== true
    || providerHealth.ok !== true
    || providerHealth.providers.length !== 2
    || !providerHealth.providers.some(provider => provider.provider === 'mlx' && provider.installedModels.join(',') === 'mlx-coder-model')
    || mlxGenerated.provider !== 'mlx'
    || mlxGenerated.providerType !== 'openai_compatible'
    || mlxGenerated.model !== 'mlx-coder-model'
    || mlxGenerated.response !== 'mlx fixture response'
    || benchmark.ok !== true
    || benchmark.provider !== 'mlx'
    || typeof benchmark.benchmark?.durationMs !== 'number'
    || generateBody.model !== 'coder-model'
    || generateBody.stream !== false
    || generateBody.think !== false
    || generateBody.options.temperature !== 0.2
    || generateBody.options.num_predict !== undefined
    || chatBody.model !== 'mlx-coder-model'
    || chatBody.max_tokens !== 64
    || chatBody.messages?.[0]?.content !== 'Fix this API and add a test.'
    || !timers.some(timer => timer.delay === 2000)
    || !timers.some(timer => timer.delay === 120000)
    || !timers.some(timer => timer.delay === 30000)
    || clearedTimers.length !== timers.length
    || !/Unknown model role/.test(missingRoleError)
  ) {
    fail('local model runtime module did not preserve provider health/generation behavior');
  }

  pass('local model runtime module');
}

async function checkMlxLifecycleModule() {
  const { EventEmitter } = require('events');
  const {
    createMlxLifecycleRuntime,
    normalizeMlxLifecycleConfig,
    parseOllamaPs
  } = require(path.join(projectRoot, 'app/server/src/lib/mlx-lifecycle'));
  const modelConfig = {
    providers: {
      mlx: {
        name: 'mlx',
        type: 'openai_compatible',
        baseUrl: 'http://localhost:9090/v1',
        optional: true,
        lifecycle: {
          command: '/tmp/mlx_lm.server',
          host: '127.0.0.1',
          port: 9090,
          model: 'fixture-mlx-model',
          maxTokens: 256,
          temperature: 0,
          startupTimeoutMs: 5000,
          memoryIsolation: {
            unloadOllamaBeforeStart: true,
            unloadOllamaModels: ['qwen3.6:35b-a3b', 'deepseek-r1:70b']
          }
        }
      }
    }
  };
  const config = normalizeMlxLifecycleConfig(modelConfig, {});
  const execCalls = [];
  const spawnCalls = [];
  let mlxSpawned = false;
  const runtime = createMlxLifecycleRuntime({
    readModelConfig: () => modelConfig,
    setTimeoutFn(callback) {
      callback();
      return { immediate: true };
    },
    clearTimeoutFn() {},
    fetchImpl: async (url) => ({
      ok: mlxSpawned,
      status: mlxSpawned ? 200 : 503,
      json: async () => (mlxSpawned
        ? { data: [{ id: 'fixture-mlx-model' }] }
        : { error: 'offline' })
    }),
    execFileCapture: async (command, args) => {
      execCalls.push({ command, args });

      if (args[0] === 'ps') {
        return {
          exitCode: 0,
          stdout: 'NAME ID SIZE PROCESSOR CONTEXT UNTIL\nqwen3.6:35b-a3b abc 34 GB 100% GPU 262144 4 minutes\nllama3:latest def 5 GB 100% GPU 4096 4 minutes',
          stderr: '',
          error: null
        };
      }

      return {
        exitCode: 0,
        stdout: `stopped ${args[1]}`,
        stderr: '',
        error: null
      };
    },
    spawn: (command, args) => {
      spawnCalls.push({ command, args });
      mlxSpawned = true;
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.pid = 4242;
      child.exitCode = null;
      child.signalCode = null;
      child.kill = signal => {
        child.signalCode = signal;
        child.exitCode = 0;
        child.emit('exit', 0, signal);
      };
      return child;
    }
  });
  const parsedPs = parseOllamaPs('NAME ID SIZE\nqwen3.6:35b-a3b abc 34 GB\n');
  const initial = await runtime.getStatus();
  const started = await runtime.start({ unloadOllama: true });
  const stopped = await runtime.stop();

  if (
    config.model !== 'fixture-mlx-model'
    || config.port !== 9090
    || config.args.join(' ') !== '--host 127.0.0.1 --port 9090 --model fixture-mlx-model --max-tokens 256 --temp 0'
    || parsedPs.join(',') !== 'qwen3.6:35b-a3b'
    || initial.status !== 'stopped'
    || initial.memoryIsolation.conflictingLoadedModels.join(',') !== 'qwen3.6:35b-a3b'
    || started.ok !== true
    || started.action !== 'started'
    || started.status.status !== 'running'
    || started.unloadResults.length !== 1
    || spawnCalls[0].command !== '/tmp/mlx_lm.server'
    || !execCalls.some(call => call.command === 'ollama' && call.args.join(' ') === 'stop qwen3.6:35b-a3b')
    || stopped.action !== 'stopped'
  ) {
    fail('MLX lifecycle module did not preserve managed start/stop/status and memory isolation behavior');
  }

  pass('MLX lifecycle module');
}

function checkMultiAgentCoordinationModule() {
  const {
    buildAgentPrompt,
    buildCoordinationSummary,
    buildHermesBenchmarkPlan,
    buildPlanOnlyContribution,
    getAgentRegistry,
    normalizeExecutionMode,
    normalizeProviderMode,
    normalizeSelectedAgents,
    parseMultiAgentRun,
    parseMultiAgentContribution
  } = require(path.join(projectRoot, 'app/server/src/lib/multi-agent-coordination'));
  const modelConfig = {
    defaultProvider: 'ollama',
    providers: {
      mlx: {
        lifecycle: {
          model: 'fixture-mlx-model'
        }
      }
    },
    roles: {
      planner: {
        provider: 'ollama',
        model: 'deepseek-r1:70b',
        temperature: 0.6
      },
      coder: {
        provider: 'ollama',
        model: 'qwen3.6:35b-a3b',
        think: false
      },
      writer: {
        provider: 'ollama',
        model: 'llama3:latest'
      }
    }
  };
  const registry = getAgentRegistry(modelConfig);
  const selected = normalizeSelectedAgents(['coding', 'solidity', 'not-real', 'coding']);
  const fallbackSelected = normalizeSelectedAgents([]);
  const codingAgent = registry.find(agent => agent.id === 'coding');
  const prompt = buildAgentPrompt({
    agent: codingAgent,
    objective: 'Add multi-agent coordination',
    context: 'Preserve live gates',
    registry,
    providerMode: 'mlx_fast_lane'
  });
  const planned = buildPlanOnlyContribution({
    agent: codingAgent,
    objective: 'Add multi-agent coordination',
    context: 'Preserve live gates',
    registry,
    providerMode: 'mlx_fast_lane',
    modelConfig
  });
  const summary = buildCoordinationSummary({
    selectedAgentIds: selected,
    executionMode: 'plan_only',
    providerMode: 'mlx_fast_lane'
  });
  const hermes = buildHermesBenchmarkPlan({ modelConfig });
  const parsedRun = parseMultiAgentRun({
    id: 1,
    objective: 'fixture',
    context: 'context',
    status: 'planned',
    execution_mode: 'plan_only',
    provider_mode: 'role_default',
    selected_agents_json: '["planner"]',
    safety_gates_json: '[{"id":"local_only_execution"}]',
    summary_json: '{"localOnly":true}',
    created_at: '2026-05-17 00:00:00'
  });
  const parsedContribution = parseMultiAgentContribution({
    id: 2,
    run_id: 1,
    agent_id: 'planner',
    agent_label: 'Planner Agent',
    model_role: 'planner',
    provider: 'ollama',
    model: 'deepseek-r1:70b',
    status: 'planned',
    prompt: 'prompt',
    response: 'response',
    duration_ms: 1,
    error: null,
    created_at: '2026-05-17 00:00:00'
  });

  if (
    registry.length < 9
    || !registry.some(agent => agent.id === 'planner' && agent.model === 'deepseek-r1:70b')
    || !registry.some(agent => agent.id === 'coding' && agent.model === 'qwen3.6:35b-a3b')
    || !registry.some(agent => agent.id === 'social' && agent.modelRole === 'writer')
    || selected.join(',') !== 'coding,solidity'
    || fallbackSelected.length < 9
    || normalizeExecutionMode('local_model_draft') !== 'local_model_draft'
    || normalizeExecutionMode('bad') !== 'plan_only'
    || normalizeProviderMode('mlx_fast_lane') !== 'mlx_fast_lane'
    || normalizeProviderMode('bad') !== 'role_default'
    || !prompt.includes('No live trading')
    || !prompt.includes('Do not request secrets')
    || planned.provider !== 'mlx'
    || planned.model !== 'fixture-mlx-model'
    || planned.status !== 'planned'
    || summary.localOnly !== true
    || summary.liveExecutionEnabled !== false
    || summary.hermesBypassAllowed !== false
    || hermes.status !== 'owner_review_required'
    || hermes.enabled !== false
    || hermes.bypassAllowed !== false
    || !hermes.blockedUntilOwnerApproves.includes('install Hermes Agent')
    || parsedRun.selected_agents[0] !== 'planner'
    || parsedRun.summary.localOnly !== true
    || parsedContribution.agent_id !== 'planner'
  ) {
    fail('multi-agent coordination module did not preserve registry, Hermes gate, and local-only behavior');
  }

  pass('multi-agent coordination module');
}

function checkSecretSafetyModule() {
  const {
    EXCHANGE_CONNECTOR_MODES,
    findSensitiveFields,
    findLikelySecretValues,
    assertNoInlineSecretPayload,
    createSecretSafetyError,
    sanitizeLocalSecretReferenceInput,
    sanitizeExchangeConnectorInput
  } = require(path.join(projectRoot, 'app/server/src/lib/secret-safety'));
  const sensitiveFields = findSensitiveFields({
    apiKey: 'metadata should be rejected by field name',
    secretReferenceId: 12,
    nested: {
      private_key: 'field name should be rejected'
    }
  });
  const likelySecretValues = findLikelySecretValues({
    referenceName: `sk-${'c'.repeat(40)}`
  });
  const walletPermissionFields = findSensitiveFields({
    permissionScope: {
      mint_token: 'owner_approval_each_time',
      view_public_address: 'read_only'
    }
  });
  const secretReference = sanitizeLocalSecretReferenceInput({
    label: 'Binance Paper Reference',
    providerType: 'macos_keychain',
    referenceName: 'ethereal/binance-paper',
    scope: 'exchange_connector',
    status: 'configured',
    notes: 'Metadata only.'
  });
  const connector = sanitizeExchangeConnectorInput({
    exchangeName: 'Binance',
    label: 'Binance Read Only',
    mode: 'read_only',
    status: 'configured',
    secretReferenceId: '12',
    settings: {
      marketDataOnly: true,
      secretReferenceLabel: 'Allowed metadata label'
    }
  });

  if (
    !sensitiveFields.includes('apiKey')
    || !sensitiveFields.includes('nested.private_key')
    || sensitiveFields.includes('secretReferenceId')
    || walletPermissionFields.length !== 0
  ) {
    fail('secret safety module did not detect sensitive fields with metadata allowlist');
  }

  if (!likelySecretValues.includes('referenceName')) {
    fail('secret safety module did not detect likely inline secret values');
  }

  try {
    assertNoInlineSecretPayload({ token: `sk-${'d'.repeat(40)}` }, 'No inline secrets');
    fail('secret safety module allowed inline secret payload');
  } catch (error) {
    if (
      error.statusCode !== 400
      || !error.sensitiveFields?.includes('token')
      || !error.likelySecretValues?.includes('token')
    ) {
      throw error;
    }
  }

  if (
    secretReference.providerType !== 'macos_keychain'
    || secretReference.status !== 'configured'
    || connector.exchangeName !== 'binance'
    || connector.secretReferenceId !== 12
    || createSecretSafetyError('fixture').statusCode !== 400
    || !EXCHANGE_CONNECTOR_MODES.has(connector.mode)
  ) {
    fail('secret safety module did not sanitize secret reference and connector metadata');
  }

  pass('secret safety module');
}

function checkWalletControlModule() {
  const {
    WALLET_PERMISSION_KEYS,
    sanitizeWalletInput,
    parseOwnerWallet,
    parseWalletPermissionEvent,
    evaluateWalletReadiness,
    buildWalletOnboardingGuide,
    buildOperatorControlSummary
  } = require(path.join(projectRoot, 'app/server/src/lib/wallet-control'));
  const sanitized = sanitizeWalletInput({
    label: 'Treasury Hardware Wallet',
    walletKind: 'hardware',
    chainFamily: 'evm',
    network: 'base',
    publicAddress: '0x000000000000000000000000000000000000dEaD',
    connectionMethod: 'hardware',
    assignments: ['etherealai-token', 'treasury'],
    permissionScope: {
      view_public_address: 'read_only',
      request_signature: 'owner_approval_each_time',
      deploy_contract: 'owner_approval_each_time',
      trade_execution: 'paper_only',
      transfer_assets: 'invalid_escalation'
    },
    notes: 'Metadata only.'
  });
  const wallet = parseOwnerWallet({
    id: 10,
    user_id: 2,
    secret_reference_id: null,
    label: sanitized.label,
    wallet_kind: sanitized.walletKind,
    chain_family: sanitized.chainFamily,
    network: sanitized.network,
    public_address: sanitized.publicAddress,
    connection_method: sanitized.connectionMethod,
    status: sanitized.status,
    assignment_json: JSON.stringify(sanitized.assignments),
    permission_scope_json: JSON.stringify(sanitized.permissionScope),
    notes: sanitized.notes,
    local_only: 1,
    signing_enabled: 0,
    live_execution_enabled: 0,
    created_at: '2026-05-18 00:00:00',
    updated_at: '2026-05-18 00:00:00'
  });
  const event = parseWalletPermissionEvent({
    id: 20,
    wallet_id: 10,
    user_id: 2,
    event_type: 'wallet.attached',
    status: 'metadata_ready',
    summary: 'fixture',
    before_json: null,
    after_json: JSON.stringify(wallet),
    evidence_json: JSON.stringify({ localOnly: true }),
    local_only: 1,
    live_execution_enabled: 0,
    created_at: '2026-05-18 00:00:00'
  });
  const readiness = evaluateWalletReadiness({ wallet });
  const guide = buildWalletOnboardingGuide();
  const summary = buildOperatorControlSummary({ wallets: [wallet], events: [event] });

  try {
    sanitizeWalletInput({
      label: 'Unsafe Wallet',
      walletKind: 'hardware',
      chainFamily: 'evm',
      notes: 'alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima'
    });
    fail('wallet control module allowed mnemonic-like wallet text');
  } catch (error) {
    if (error.statusCode !== 400 || !/Wallet records cannot contain/.test(error.message)) {
      throw error;
    }
  }

  if (
    WALLET_PERMISSION_KEYS.length !== 9
    || sanitized.localOnly !== true
    || sanitized.signingEnabled !== false
    || sanitized.liveExecutionEnabled !== false
    || sanitized.permissionScope.view_public_address !== 'read_only'
    || sanitized.permissionScope.transfer_assets !== 'blocked'
    || sanitized.assignments.join(',') !== 'etherealai-token,treasury'
    || wallet.localOnly !== true
    || wallet.signingEnabled !== false
    || wallet.liveExecutionEnabled !== false
    || event.localOnly !== true
    || event.liveExecutionEnabled !== false
    || readiness.status !== 'metadata_ready'
    || readiness.summary?.secretsStored !== false
    || readiness.summary?.liveExecutionEnabled !== false
    || !readiness.privilegedPermissions.includes('request_signature')
    || guide.safetyBoundary?.secretsAccepted !== false
    || guide.trainingContent?.length < 8
    || !guide.trainingContent?.some(item => item.id === 'system_start_stop_video')
    || !guide.trainingContent?.some(item => item.id === 'security_procedures_video')
    || !guide.operatingProcedures?.some(item => item.id === 'emergency_shutdown')
    || !guide.operatingProcedures?.some(item => item.id === 'backup_recovery')
    || summary.counts?.wallets !== 1
    || summary.signingEnabled !== false
    || !summary.boundaries?.includes('No seed phrase storage.')
  ) {
    fail('wallet control module did not preserve metadata-only wallet owner-control behavior');
  }

  pass('wallet control module');
}

function checkOwnerSetupWizardModule() {
  const {
    parseEnvLine,
    getPublicWalletAddressType,
    readOwnerEnvStatus,
    buildOwnerSetupWizard,
    buildOwnerEnvTemplate
  } = require(path.join(projectRoot, 'app/server/src/lib/owner-setup-wizard'));
  const safeEnv = [
    'CHAIN_RPC_URL=https://chain.example',
    'CHAIN_EXPLORER_API_KEY=chain-explorer-fixture',
    'POLYGON_RPC_URL=https://polygon.example',
    'POLYGONSCAN_API_KEY=polygonscan-fixture',
    'OWNER_PUBLIC_WALLET_ADDRESS=0x000000000000000000000000000000000000dEaD',
    'BASE_PUBLIC_WALLET_ADDRESS=0x000000000000000000000000000000000000bA5E',
    'SOLANA_PUBLIC_WALLET_ADDRESS=11111111111111111111111111111111',
    'COINBASE_API_KEY=coinbase-key-fixture',
    'COINBASE_API_SECRET=coinbase-secret-fixture',
    'GITHUB_TOKEN=github-fixture',
    'CLOUDFLARE_API_TOKEN=cloudflare-token-fixture',
    'CLOUDFLARE_ACCOUNT_ID=cloudflare-account-fixture',
    'DISCORD_BOT_TOKEN=discord-token-fixture'
  ].join('\n');
  const unsafeEnv = [
    'POLYGON_RPC_URL=https://polygon.example',
    'WALLET_PRIVATE_KEY=never',
    'OWNER_SEED_PHRASE=alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima'
  ].join('\n');
  const safeFs = {
    statSync: () => ({ mode: 0o600 }),
    readFileSync: () => safeEnv
  };
  const unsafeFs = {
    statSync: () => ({ mode: 0o644 }),
    readFileSync: () => unsafeEnv
  };
  const missingFs = {
    statSync: () => {
      throw new Error('missing fixture');
    },
    readFileSync: () => ''
  };
  const safeStatus = readOwnerEnvStatus({ fsModule: safeFs, envPath: '/tmp/ethereal-owner.env' });
  const unsafeStatus = readOwnerEnvStatus({ fsModule: unsafeFs, envPath: '/tmp/ethereal-owner.env' });
  const missingStatus = readOwnerEnvStatus({ fsModule: missingFs, envPath: '/tmp/missing-ethereal-owner.env' });
  const wizard = buildOwnerSetupWizard({
    envStatus: safeStatus,
    wallets: [{
      status: 'configured',
      public_address: '0x000000000000000000000000000000000000dEaD',
      signingEnabled: false,
      liveExecutionEnabled: false
    }],
    strategies: [{ id: 1 }],
    riskProfiles: [{
      id: 1,
      status: 'active',
      max_order_value: 100,
      max_position_value: 500,
      max_daily_loss: 50,
      max_open_trades: 2,
      kill_switch_enabled: false
    }],
    paperSessions: [{ id: 1, status: 'completed' }],
    marketImports: [{ id: 1, status: 'active' }],
    plans: [{ id: 1, mode: 'paper', status: 'ready_for_paper', readiness: { status: 'ready_for_paper' } }],
    runs: [{ id: 1, mode: 'paper', status: 'completed' }],
    schedules: [],
    exchangeConnectors: [{ id: 1, mode: 'paper', status: 'configured' }],
    localSecretReferences: [{ id: 1, status: 'configured' }],
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      goLiveAllowed: false
    }
  });
  const noEnvPaperWizard = buildOwnerSetupWizard({
    envStatus: missingStatus,
    wallets: [],
    strategies: [],
    riskProfiles: [{
      id: 2,
      status: 'active',
      max_order_value: 100,
      max_position_value: 500,
      max_daily_loss: 50,
      max_open_trades: 2,
      kill_switch_enabled: false
    }],
    runs: [{ id: 2, mode: 'paper', status: 'completed' }],
    schedules: [],
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      goLiveAllowed: false,
      walletSigningEnabled: false
    }
  });
  const template = buildOwnerEnvTemplate();

  if (
    parseEnvLine('export POLYGON_RPC_URL=\"https://polygon.example\"')?.key !== 'POLYGON_RPC_URL'
    || getPublicWalletAddressType('0x000000000000000000000000000000000000dEaD') !== 'evm'
    || safeStatus.safeToUse !== true
    || safeStatus.foundAllowedNames.includes('coinbase-secret-fixture')
    || !safeStatus.publicWalletAddresses?.some(item => item.variable === 'OWNER_PUBLIC_WALLET_ADDRESS' && item.address === '0x000000000000000000000000000000000000dEaD')
    || unsafeStatus.safeToUse !== false
    || !unsafeStatus.forbiddenWalletSecretNames.includes('OWNER_SEED_PHRASE')
    || wizard.progress?.paperTrading?.current !== 100
    || wizard.progress?.localEndToEnd?.current !== 100
    || wizard.progress?.localEndToEnd?.status !== 'complete'
    || wizard.progress?.liveEndToEnd?.status !== 'locked'
    || wizard.progress?.fullEndToEnd?.status !== 'locked'
    || wizard.progress?.liveEndToEnd?.message !== 'Live E2E Locked — Future approval required.'
    || wizard.status !== 'local_paper_trading_ready'
    || wizard.coreSetup?.label !== 'Local E2E Complete'
    || wizard.coreSetup?.readinessLabel !== 'Local E2E Complete'
    || wizard.coreSetup?.localEndToEndOperational !== true
    || wizard.coreSetup?.optionalIntegrationsRequired !== false
    || noEnvPaperWizard.status !== 'local_paper_trading_ready'
    || noEnvPaperWizard.progress?.paperTrading?.current !== 100
    || noEnvPaperWizard.coreSetup?.paperTradingOperational !== true
    || noEnvPaperWizard.coreSetup?.optionalIntegrationsRequired !== false
    || noEnvPaperWizard.walletMetadata?.nextAction?.includes('OWNER_PUBLIC_WALLET_ADDRESS')
    || !noEnvPaperWizard.gates?.fullEndToEnd?.some(gate => gate.id === 'chain_provider_ready' && gate.blocking === false && gate.optional === true)
    || !noEnvPaperWizard.gates?.fullEndToEnd?.some(gate => gate.id === 'exchange_credentials_ready' && gate.blocking === false && gate.optional === true)
    || !wizard.optionalFutureIntegrations?.some(item => item.id === 'blockchain_provider' && item.label === 'Blockchain Provider / Chain Provider' && item.requiredForPaperTrading === false)
    || wizard.envDiscovery?.visualPickerSupported !== true
    || wizard.paperConfiguration?.status !== 'paper_ready'
    || wizard.walletMetadata?.detectedEnvPublicWallets?.length < 3
    || !Array.isArray(wizard.setupGuide)
    || wizard.safetyBoundary?.liveTradingEnabled !== false
    || wizard.safetyBoundary?.seedPhrasesAccepted !== false
    || !wizard.gates?.fullEndToEnd?.some(gate => gate.id === 'high_security_live_approval_locked' && gate.passed)
    || !wizard.gates?.paperTrading?.some(gate => gate.id === 'paper_verification_run_completed' && gate.passed)
    || !wizard.optionalFutureIntegrations?.some(item => item.id === 'exchange_apis' && item.requiredForPaperTrading === false)
    || !template.includes('Do not add seed phrases')
    || !template.includes('CHAIN_RPC_URL=')
    || !template.includes('CHAIN_PUBLIC_WALLET_ADDRESS=')
    || !template.includes('POLYGON_RPC_URL=')
  ) {
    fail('owner setup wizard module did not preserve safe env, progress, and live-disabled behavior');
  }

  pass('owner setup wizard module');
}

async function checkMacSecurityModule() {
  const {
    buildMacSecurityAudit,
    buildMacSecurityGuide,
    getServerBindCheck,
    parseEstablishedConnections,
    parseListeningPorts,
    parseProcessActivity,
    summarizeChecks
  } = require(path.join(projectRoot, 'app/server/src/lib/mac-security'));
  const responses = new Map([
    ['/usr/bin/fdesetup status', 'FileVault is On.'],
    ['/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate', 'Firewall is blocking all non-essential incoming connections. (State = 2)'],
    ['/usr/libexec/ApplicationFirewall/socketfilterfw --getstealthmode', 'Firewall stealth mode is on'],
    ['/usr/libexec/ApplicationFirewall/socketfilterfw --getblockall', 'Firewall is blocking all non-essential incoming connections.'],
    ['/usr/libexec/ApplicationFirewall/socketfilterfw --getallowsigned', 'Automatically allow built-in signed software ENABLED.'],
    ['/usr/sbin/spctl --status', 'assessments enabled'],
    ['/usr/bin/csrutil status', 'System Integrity Protection status: enabled.'],
    ['/usr/sbin/softwareupdate --schedule', 'Automatic checking for updates is turned on'],
    ['/usr/bin/dscl . -read /Groups/admin GroupMembership', 'GroupMembership: root ethereal _mbsetupuser'],
    ['/usr/bin/dscl . -read /Users/root UniqueID RealName RecordName NFSHomeDirectory UserShell IsHidden AuthenticationAuthority', [
      'No such key: AuthenticationAuthority',
      'No such key: IsHidden',
      'NFSHomeDirectory: /var/root /private/var/root',
      'RealName:',
      ' System Administrator',
      'RecordName: root',
      'UniqueID: 0',
      'UserShell: /bin/sh'
    ].join('\n')],
    ['/usr/bin/dscl . -read /Users/ethereal UniqueID RealName RecordName NFSHomeDirectory UserShell IsHidden AuthenticationAuthority', [
      'No such key: IsHidden',
      'AuthenticationAuthority: ;ShadowHash;HASHLIST:<SALTED-SHA512-PBKDF2> ;SecureToken;',
      'NFSHomeDirectory: /Users/ethereal',
      'RealName:',
      ' Owner User',
      'RecordName: ethereal',
      'UniqueID: 501',
      'UserShell: /bin/zsh'
    ].join('\n')],
    ['/usr/bin/dscl . -read /Users/_mbsetupuser UniqueID RealName RecordName NFSHomeDirectory UserShell IsHidden AuthenticationAuthority', [
      'No such key: AuthenticationAuthority',
      'dsAttrTypeNative:IsHidden: YES',
      'NFSHomeDirectory: /var/setup',
      'RealName:',
      ' Setup User',
      'RecordName: _mbsetupuser',
      'UniqueID: 248',
      'UserShell: /bin/bash'
    ].join('\n')],
    ['/usr/sbin/sysadminctl -secureTokenStatus root', 'Secure token is DISABLED for user System Administrator'],
    ['/usr/sbin/sysadminctl -secureTokenStatus ethereal', 'Secure token is ENABLED for user Owner User'],
    ['/usr/sbin/sysadminctl -secureTokenStatus _mbsetupuser', 'Secure token is DISABLED for user Setup User'],
    ['/usr/bin/profiles status -type enrollment', 'Enrolled via DEP: No\nMDM enrollment: No'],
    ['/usr/bin/crontab -l', 'crontab: no crontab for ethereal'],
    ['/usr/bin/systemextensionsctl list', '0 extension(s)'],
    ['/bin/launchctl print-disabled system', [
      '\t\t"com.openssh.sshd" => disabled',
      '\t\t"com.apple.AEServer" => disabled'
    ].join('\n')],
    ['/usr/bin/defaults read com.apple.NetworkBrowser DisableAirDrop', '1'],
    ['/usr/bin/defaults -currentHost read com.apple.coreservices.useractivityd ActivityAdvertisingAllowed', '0'],
    ['/usr/bin/defaults -currentHost read com.apple.coreservices.useractivityd ActivityReceivingAllowed', '0'],
    ['/usr/sbin/networksetup -getdnsservers Wi-Fi', '1.1.1.1\n1.0.0.1\n9.9.9.9\n149.112.112.112'],
    ['/usr/sbin/networksetup -getwebproxy Wi-Fi', 'Enabled: No\nServer:\nPort: 0\nAuthenticated Proxy Enabled: 0'],
    ['/usr/sbin/networksetup -getsecurewebproxy Wi-Fi', 'Enabled: No\nServer:\nPort: 0\nAuthenticated Proxy Enabled: 0'],
    ['/usr/sbin/networksetup -getsocksfirewallproxy Wi-Fi', 'Enabled: No\nServer:\nPort: 0\nAuthenticated Proxy Enabled: 0'],
    ['/usr/bin/defaults read com.apple.screensaver askForPassword', '1'],
    ['/usr/bin/defaults read com.apple.screensaver askForPasswordDelay', '0'],
    ['/bin/ps -axo pid=,user=,%cpu=,%mem=,comm=', [
      '100 ethereal 10.0 0.2 /Applications/Codex.app/Contents/MacOS/Codex',
      '200 ethereal 2.0 0.1 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '300 root 0.0 0.0 /usr/sbin/bluetoothd'
    ].join('\n')],
    ['/usr/bin/top -l 1 -n 0 -stats pid', [
      'Processes: 120 total, 2 running, 118 sleeping, 800 threads',
      'Load Avg: 1.10, 1.20, 1.30',
      'CPU usage: 5.00% user, 3.00% sys, 92.00% idle',
      'PhysMem: 32G used, 96G unused.',
      'VM: 300T vsize, 0(0) swapins, 0(0) swapouts.',
      'Networks: packets: 100/10M in, 50/5M out.',
      'Disks: 1000/1G read, 2000/2G written.'
    ].join('\n')],
    ['/usr/sbin/lsof -nP -iTCP', [
      'COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME',
      'Code 300 ethereal 24u IPv4 0x3 0t0 TCP 192.168.40.2:50000->13.107.5.93:443 (ESTABLISHED)',
      'node 100 ethereal 20u IPv4 0x1 0t0 TCP 127.0.0.1:3000 (LISTEN)'
    ].join('\n')],
    ['/usr/sbin/lsof -nP -iTCP -sTCP:LISTEN', [
      'COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME',
      'node 100 ethereal 20u IPv4 0x1 0t0 TCP 127.0.0.1:3000 (LISTEN)',
      'ControlCe 200 ethereal 21u IPv4 0x2 0t0 TCP *:7000 (LISTEN)'
    ].join('\n')],
    ['/bin/ls -1 /Users/ethereal/Library/LaunchAgents', 'com.google.GoogleUpdater.wake.plist\ncom.valvesoftware.steamclean.plist'],
    ['/bin/ls -1 /Library/LaunchAgents', ''],
    ['/bin/ls -1 /Library/LaunchDaemons', '']
  ]);
  const execFileCapture = async (command, args) => {
    const key = `${command} ${args.join(' ')}`;

    if (!responses.has(key)) {
      return { exitCode: 1, stdout: '', stderr: `missing fixture for ${key}` };
    }

    return { exitCode: 0, stdout: responses.get(key), stderr: '' };
  };
  const audit = await buildMacSecurityAudit({
    execFileCapture,
    platform: 'darwin',
    serverHost: '127.0.0.1',
    port: 3000,
    ownerHome: '/Users/ethereal'
  });
  const guide = buildMacSecurityGuide();
  const bindPass = getServerBindCheck({ serverHost: '127.0.0.1', port: 3000 });
  const bindFail = getServerBindCheck({ serverHost: '0.0.0.0', port: 3000 });
  const parsedPorts = parseListeningPorts(responses.get('/usr/sbin/lsof -nP -iTCP -sTCP:LISTEN'));
  const parsedConnections = parseEstablishedConnections(responses.get('/usr/sbin/lsof -nP -iTCP'));
  const parsedProcesses = parseProcessActivity(responses.get('/bin/ps -axo pid=,user=,%cpu=,%mem=,comm='));
  const summary = summarizeChecks([
    { status: 'pass' },
    { status: 'fail' },
    { status: 'review' },
    { status: 'unknown' }
  ]);

  if (
    audit.supported !== true
    || audit.summary?.totalChecks < 27
    || audit.summary?.failCount !== 0
    || audit.summary?.reviewCount < 4
    || audit.safetyBoundary?.readOnlyAudit !== true
    || audit.safetyBoundary?.privilegedMutation !== false
    || !audit.checks.some(check => check.id === 'filevault' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'firewall_global' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'firewall_allow_signed_builtin' && check.status === 'review')
    || !audit.checks.some(check => check.id === 'admin_group_membership' && check.status === 'review')
    || audit.adminAccounts?.humanAdmins?.length !== 1
    || audit.adminAccounts.humanAdmins[0]?.member !== 'ethereal'
    || !audit.adminAccounts?.systemAdmins?.some(account => account.member === 'root' && account.classification === 'system_builtin')
    || !audit.adminAccounts?.systemAdmins?.some(account => account.member === '_mbsetupuser' && account.classification === 'system_hidden')
    || !audit.adminAccounts?.accounts?.some(account => account.member === 'ethereal' && account.secureToken === 'enabled')
    || !audit.checks.some(check => check.id === 'mdm_enrollment' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'user_crontab' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'system_extensions' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'handoff_advertising_disabled' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'handoff_receiving_disabled' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'wifi_dns_servers' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'wifi_web_proxy' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'wifi_secure_web_proxy' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'wifi_socks_proxy' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'activity_monitor_review' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'established_connections' && check.status === 'review')
    || !audit.checks.some(check => check.id === 'startup_persistence_items' && check.status === 'review')
    || !audit.checks.some(check => check.id === 'etherealai_bind_host' && check.status === 'pass')
    || !audit.checks.some(check => check.id === 'listening_ports' && check.status === 'review')
    || audit.processActivity?.topCpu?.[0]?.command !== 'Codex'
    || audit.processActivity?.remoteAccessReview?.length !== 0
    || audit.systemResources?.cpuUsage !== 'CPU usage: 5.00% user, 3.00% sys, 92.00% idle'
    || !audit.establishedConnections.some(connection => connection.command === 'Code' && connection.exposure === 'common_encrypted_outbound')
    || !audit.listeningPorts.some(port => port.command === 'node' && port.exposure === 'loopback_only')
    || !audit.listeningPorts.some(port => port.command === 'ControlCe' && port.exposure === 'all_interfaces')
    || !audit.startupItems.some(folder => folder.id === 'user_launch_agents' && folder.items.includes('com.google.GoogleUpdater.wake.plist'))
    || bindPass.status !== 'pass'
    || bindFail.status !== 'fail'
    || parsedPorts.length !== 2
    || parsedConnections.length !== 1
    || parsedProcesses.length !== 3
    || summary.failCount !== 1
    || guide.operatingMode !== 'assume_home_network_hostile'
    || !guide.rules.some(rule => rule.includes('VPNs can improve transport privacy'))
    || !guide.compromisedHostProtocol.some(item => item.includes('admin rights, MDM, system extensions, kernel-level tampering'))
    || !guide.cleanRoomRecoveryPlan.some(item => item.includes('DFU restore/revive'))
    || !guide.airbnbNetworkPlan.some(item => item.includes('Airbnb router as hostile infrastructure'))
    || !guide.ownerSettingsChecklist.some(item => item.area.includes('General > Sharing'))
    || !guide.ownerApprovedAdminChangesAppliedByCodex?.some(item => item.includes('Remote Login / SSH launch service'))
    || !guide.adminOnlyActions.some(item => item.includes('Remote Login'))
    || !guide.adminOnlyActions.some(item => item.includes('firewall allowance'))
    || !guide.adminOnlyActions.some(item => item.includes('LaunchAgents'))
    || guide.etherealAiSecurityBoundary?.bindsToLoopbackByDefault !== true
  ) {
    fail('mac security module did not expose read-only host hardening audit behavior');
  }

  pass('mac security module');
}

function checkSystemConfigRuntimeModule() {
  const {
    DEFAULT_SAFE_COMMAND_PREFIXES,
    sanitizeTrustedCommandPrefixes
  } = require(path.join(projectRoot, 'app/server/src/lib/command-safety'));
  const {
    LOCAL_SECRET_PROVIDER_TYPES,
    LOCAL_SECRET_SCOPES
  } = require(path.join(projectRoot, 'app/server/src/lib/secret-safety'));
  const {
    createSystemConfigRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/system-config-runtime'));
  const fixtureRoot = path.join(projectRoot, 'workspaces');
  fs.mkdirSync(fixtureRoot, { recursive: true });
  const configDir = fs.mkdtempSync(path.join(fixtureRoot, 'system-config-runtime-'));
  const modelConfigPath = path.join(configDir, 'local-models.json');
  const automationPolicyPath = path.join(configDir, 'automation-policy.json');
  const secretProviderCapabilitiesPath = path.join(configDir, 'local-secret-providers.json');

  try {
    fs.writeFileSync(modelConfigPath, JSON.stringify({
      provider: {
        baseUrl: 'http://localhost:11434'
      },
      roles: {
        planner: 'fixture-planner'
      }
    }), 'utf8');
    fs.writeFileSync(automationPolicyPath, JSON.stringify({
      mode: 'guided',
      localAutomation: {
        autoApproveFileProposals: false,
        autoRunLowRiskCommands: false
      }
    }), 'utf8');
    fs.writeFileSync(secretProviderCapabilitiesPath, JSON.stringify({
      version: 2,
      generatedBy: 'fixture',
      providers: [
        {
          providerType: 'macos_keychain',
          label: 'Keychain',
          status: 'planned',
          allowedScopes: ['exchange_connector', 'bad_scope'],
          ownerSetup: ['create item'],
          readinessChecks: ['configured'],
          futureAdapterRequirements: ['load locally']
        },
        {
          providerType: 'bad_provider',
          label: 'Bad'
        }
      ]
    }), 'utf8');

    const runtime = createSystemConfigRuntime({
      fs,
      modelConfigPath,
      automationPolicyPath,
      secretProviderCapabilitiesPath,
      defaultSafeCommandPrefixes: DEFAULT_SAFE_COMMAND_PREFIXES,
      sanitizeTrustedCommandPrefixes,
      localSecretProviderTypes: LOCAL_SECRET_PROVIDER_TYPES,
      localSecretScopes: LOCAL_SECRET_SCOPES
    });
    const modelConfig = runtime.readModelConfig();
    const policy = runtime.readAutomationPolicy();
    const sanitized = runtime.sanitizeAutomationPolicyUpdate({
      mode: 'owner',
      autoApproveFileProposals: true,
      autoRunLowRiskCommands: true,
      trustedCommandPrefixes: ['npm test', 'git status']
    });
    runtime.writeAutomationPolicy(sanitized);
    const writtenPolicy = fs.readFileSync(automationPolicyPath, 'utf8');
    const capabilities = runtime.readSecretProviderCapabilities();

    if (
      modelConfig.roles.planner !== 'fixture-planner'
      || policy.localAutomation.trustedCommandPrefixes !== DEFAULT_SAFE_COMMAND_PREFIXES
      || sanitized.mode !== 'owner'
      || sanitized.localAutomation.autoApproveFileProposals !== true
      || sanitized.localAutomation.autoRunLowRiskCommands !== true
      || sanitized.localAutomation.trustedCommandPrefixes.join(',') !== 'npm test,git status'
      || !writtenPolicy.endsWith('\n')
      || capabilities.secretValuesAccepted !== false
      || capabilities.liveExecution.goLiveAllowed !== false
      || capabilities.allowedProviderTypes.join(',') !== 'macos_keychain'
      || capabilities.providers.length !== 1
      || capabilities.providers[0].allowedScopes.join(',') !== 'exchange_connector'
      || capabilities.providers[0].credentialLoadingImplemented !== false
    ) {
      fail('system config runtime module did not preserve config/policy/capability behavior');
    }
  } finally {
    fs.rmSync(configDir, { recursive: true, force: true });
  }

  pass('system config runtime module');
}

async function checkCompanyIdentityModule() {
  const {
    buildCompanyIdentityChecklist,
    buildCompanySetupPlan,
    buildCloudflareWebsitePlan,
    normalizeCompanyDnsTargetInput,
    parseCompanyDnsTarget,
    normalizeCompanyIdentity,
    verifyCompanyDnsTargetPublic
  } = require(path.join(projectRoot, 'app/server/src/lib/company-identity'));
  const identity = normalizeCompanyIdentity({
    company: {
      legalName: 'Ethereal Digital',
      platformName: 'EtherealAI',
      primaryDomain: 'EtherealDigital.AI',
      firstCreatedDomain: 'EtherealDigit.AI',
      ownedDomains: ['EtherealDigit.AI', 'EtherealDigital.AI'],
      cloudflareAccountEmail: 'Patrick@LakePowellFord.com',
      dnsProvider: 'Cloudflare',
      registrar: 'Cloudflare',
      status: 'owner_configured'
    },
    owner: {
      name: 'Patrick',
      role: 'CEO',
      email: 'Patrick@EtherealDigital.AI'
    },
    tokenIdentity: {
      name: 'EtherealAI',
      preferredWebsiteDomain: 'EtherealDigit.AI',
      fallbackWebsiteDomain: 'EtherealDigital.AI',
      status: 'identity_reserved'
    },
    email: {
      provider: 'Cloudflare',
      primaryMailbox: 'Patrick@EtherealDigital.AI',
      status: 'owner_configured'
    },
    dnsObservation: {
      records: {
        A: [],
        MX: []
      }
    }
  });
  const checklist = buildCompanyIdentityChecklist(identity);
  const dnsTarget = normalizeCompanyDnsTargetInput({
    recordType: 'TXT',
    host: '_dmarc',
    value: 'v=DMARC1; p=none;',
    purpose: 'dmarc',
    status: 'planned',
    notes: 'owner will add manually in Cloudflare'
  }, identity);
  const websiteDnsTarget = normalizeCompanyDnsTargetInput({
    domain: 'EtherealDigit.AI',
    recordType: 'CNAME',
    host: '@',
    value: 'etherealai-etherealai.pages.dev',
    purpose: 'website',
    status: 'planned',
    notes: 'owner will add manually in Cloudflare'
  }, identity);
  const parsedDnsTarget = parseCompanyDnsTarget({
    id: 12,
    user_id: 1,
    domain: dnsTarget.domain,
    record_type: dnsTarget.recordType,
    host: dnsTarget.host,
    value: dnsTarget.value,
    purpose: dnsTarget.purpose,
    status: dnsTarget.status,
    notes: dnsTarget.notes,
    local_only: 1,
    external_mutation_enabled: 0,
    created_at: '2026-05-17 10:00:00',
    updated_at: '2026-05-17 10:00:00'
  });
  const setupPlan = buildCompanySetupPlan(identity, [parsedDnsTarget]);
  const websitePlan = buildCloudflareWebsitePlan({ id: 77, name: 'EtherealAI' }, identity);
  const dnsVerification = await verifyCompanyDnsTargetPublic({
    id: 44,
    domain: 'etherealdigit.ai',
    recordType: 'CNAME',
    host: '@',
    value: 'etherealai-etherealai.pages.dev'
  }, {
    checkedAt: new Date('2026-05-18T00:00:00Z'),
    resolver: {
      async resolveCname(recordName) {
        if (recordName !== 'etherealdigit.ai') {
          throw new Error('unexpected record name');
        }

        return ['etherealai-etherealai.pages.dev'];
      }
    }
  });

  if (
    identity.localOnly !== true
    || identity.externalAccountCreationEnabled !== false
    || identity.purchaseEnabled !== false
    || identity.company.primaryDomain !== 'etherealdigital.ai'
    || identity.company.firstCreatedDomain !== 'etherealdigit.ai'
    || identity.company.cloudflareAccountEmail !== 'patrick@lakepowellford.com'
    || !identity.company.ownedDomains.includes('etherealdigit.ai')
    || !identity.company.ownedDomains.includes('etherealdigital.ai')
    || identity.owner.email !== 'patrick@etherealdigital.ai'
    || identity.tokenIdentity.name !== 'EtherealAI'
    || identity.tokenIdentity.preferredWebsiteDomain !== 'etherealdigit.ai'
    || identity.tokenIdentity.fallbackWebsiteDomain !== 'etherealdigital.ai'
    || !checklist.some(item => item.id === 'company_domain_recorded' && item.status === 'ready')
    || !checklist.some(item => item.id === 'token_website_domain_recorded' && item.status === 'ready')
    || !checklist.some(item => item.id === 'ceo_email_recorded' && item.status === 'ready')
    || !checklist.some(item => item.id === 'dns_delegation_visible' && item.status === 'needs_propagation_or_setup')
    || !checklist.some(item => item.id === 'external_actions_blocked' && item.status === 'ready')
    || dnsTarget.domain !== 'etherealdigital.ai'
    || dnsTarget.recordType !== 'TXT'
    || dnsTarget.externalMutationEnabled !== false
    || websiteDnsTarget.domain !== 'etherealdigit.ai'
    || websiteDnsTarget.recordType !== 'CNAME'
    || parsedDnsTarget.localOnly !== true
    || parsedDnsTarget.externalMutationEnabled !== false
    || setupPlan.localOnly !== true
    || setupPlan.externalMutationEnabled !== false
    || setupPlan.websitePrimaryDomain !== 'etherealdigit.ai'
    || setupPlan.emailDomain !== 'etherealdigital.ai'
    || !setupPlan.ownedDomains.includes('etherealdigit.ai')
    || setupPlan.summary.totalTargets !== 1
    || !setupPlan.recommendedManualSteps.some(step => step.id === 'email_dns_targets' && step.status === 'tracked')
    || setupPlan.cloudflareAccessPlan?.passwordLoginAllowed !== false
    || setupPlan.cloudflareAccessPlan?.tokenValuesAccepted !== false
    || setupPlan.cloudflareAccessPlan?.credentialLoadingImplemented !== false
    || setupPlan.cloudflareAccessPlan?.recommendedToken?.resourceScope !== 'etherealdigit.ai, etherealdigital.ai zones only'
    || !setupPlan.cloudflareAccessPlan?.recommendedToken?.zoneScopes?.includes('etherealdigit.ai')
    || !setupPlan.cloudflareAccessPlan?.manualSteps?.some(step => step.id === 'rotate_password' && step.status === 'owner_action_required')
    || setupPlan.cloudflareAccessPlan?.secretReferenceTemplate?.referenceName !== 'etherealai/cloudflare/dns/owned-domains'
    || websitePlan.primaryDomain !== 'etherealdigit.ai'
    || websitePlan.companyPrimaryDomain !== 'etherealdigital.ai'
    || websitePlan.primaryFqdn !== 'etherealdigit.ai'
    || websitePlan.pagesDevTarget !== 'etherealai-etherealai.pages.dev'
    || websitePlan.dnsTargets?.length !== 4
    || !websitePlan.dnsTargets.some(target => target.host === '@' && target.purpose === 'website' && target.notes.includes('tokenProjectId:77'))
    || !websitePlan.dnsTargets.some(target => target.host === 'app' && target.purpose === 'app_backend')
    || websitePlan.emailRouting?.primaryMailbox !== 'patrick@etherealdigital.ai'
    || !websitePlan.emailRouting?.suggestedAliases?.includes('support@etherealdigital.ai')
    || websitePlan.safetyBoundary?.cloudflareApiCallsEnabled !== false
    || dnsVerification.verified !== true
    || dnsVerification.status !== 'verified'
    || dnsVerification.cloudflareApiCallsEnabled !== false
    || dnsVerification.dnsMutationEnabled !== false
  ) {
    fail('company identity module did not preserve local-only Cloudflare domain/email identity behavior');
  }

  let rejectedSecret = false;
  try {
    normalizeCompanyDnsTargetInput({
      recordType: 'TXT',
      host: '@',
      value: 'cloudflare token secret',
      purpose: 'domain_verification'
    }, identity);
  } catch (error) {
    rejectedSecret = /must not contain/.test(error.message);
  }

  if (!rejectedSecret) {
    fail('company identity DNS target input did not reject secret-like values');
  }

  pass('company identity module');
}

function checkExchangeMetadataModule() {
  const {
    EXCHANGE_CONNECTOR_CATEGORIES,
    EXCHANGE_CONNECTOR_REGISTRY,
    EXCHANGE_CONNECTOR_RECOMMENDED_ORDER,
    EXCHANGE_ADAPTER_CONTRACT_EXCHANGES,
    parseExchangeConnector,
    parseLocalSecretReference,
    parseExchangeConnectorReadinessEvent,
    parseExchangeAdapterContractEvent,
    getExchangeConnectorRegistry,
    getExchangeConnectorRegistryEntry,
    createExchangeConnectorPlaceholderInput,
    buildExchangeConnectorManagerSummary,
    evaluateExchangeConnectorReadOnlyTest,
    createExchangeAdapterContractSpec,
    evaluateExchangeConnectorReadiness,
    evaluateExchangeAdapterContract
  } = require(path.join(projectRoot, 'app/server/src/lib/exchange-metadata'));
  const { sanitizeExchangeConnectorInput } = require(path.join(projectRoot, 'app/server/src/lib/secret-safety'));
  const parsedConnector = parseExchangeConnector({
    id: 7,
    secret_reference_id: 11,
    exchange_name: 'binance',
    label: 'Binance Read Only',
    mode: 'read_only',
    status: 'configured',
    settings_json: '{"marketDataOnly":true}',
    secret_storage_note: 'No secrets stored in SQLite.',
    secret_reference_label: 'Binance Keychain Reference',
    secret_reference_status: 'configured',
    secret_reference_provider_type: 'macos_keychain',
    secret_reference_name: 'ethereal/binance-readonly',
    secret_reference_scope: 'exchange_connector',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  });
  const parsedSecretReference = parseLocalSecretReference({
    id: 11,
    user_id: 1,
    label: 'Binance Keychain Reference',
    provider_type: 'macos_keychain',
    reference_name: 'ethereal/binance-readonly',
    scope: 'exchange_connector',
    status: 'configured',
    notes: 'metadata only',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  });
  const parsedReadinessEvent = parseExchangeConnectorReadinessEvent({
    id: 12,
    connector_id: 7,
    user_id: 1,
    status: 'blocked',
    readiness_json: '{"liveExecution":{"enabled":false}}',
    created_at: '2026-05-14T00:00:00.000Z',
    connector_label: 'Binance Read Only',
    exchange_name: 'binance',
    connector_mode: 'read_only',
    connector_status: 'configured'
  });
  const parsedContractEvent = parseExchangeAdapterContractEvent({
    id: 13,
    connector_id: 7,
    user_id: 1,
    status: 'blocked',
    contract_json: '{"liveExecution":{"orderEndpointEnabled":false}}',
    created_at: '2026-05-14T00:00:00.000Z',
    connector_label: 'Binance Read Only',
    exchange_name: 'binance',
    connector_mode: 'read_only',
    connector_status: 'configured'
  });
  const connector = {
    id: 7,
    label: 'Binance Read Only',
    exchange_name: 'binance',
    mode: 'read_only',
    status: 'configured',
    settings: { marketDataOnly: true },
    secret_reference_id: 11,
    secret_storage_note: 'No secrets stored in SQLite.'
  };
  const secretReference = {
    id: 11,
    label: 'Binance Keychain Reference',
    provider_type: 'macos_keychain',
    reference_name: 'ethereal/binance-readonly',
    scope: 'exchange_connector',
    status: 'configured'
  };
  const readiness = evaluateExchangeConnectorReadiness({ connector, secretReference });
  const unsafeReadiness = evaluateExchangeConnectorReadiness({
    connector: {
      ...connector,
      settings: { apiKey: 'inline-value' }
    },
    secretReference
  });
  const spec = createExchangeAdapterContractSpec('binance');
  const customSpec = createExchangeAdapterContractSpec('unknown-exchange');
  const contract = evaluateExchangeAdapterContract({ connector });
  const registry = getExchangeConnectorRegistry();
  const firstFive = getExchangeConnectorRegistry({ firstFive: true }).map(entry => entry.id);
  const allCategoriesCovered = EXCHANGE_CONNECTOR_CATEGORIES.every(category => (
    registry.some(entry => entry.category === category)
  ));
  const requiredRecommended = ['binance', 'coinbase', 'kraken', 'okx', 'bybit', 'uniswap', 'jupiter', 'one-inch', 'hyperliquid', 'gmx'];
  const recommendedCovered = requiredRecommended.every(exchangeId => (
    getExchangeConnectorRegistryEntry(exchangeId)?.recommendedFirst === true
  ));
  const placeholder = createExchangeConnectorPlaceholderInput(getExchangeConnectorRegistryEntry('uniswap'));
  const sanitizedPlaceholder = sanitizeExchangeConnectorInput(placeholder);
  const managerSummary = buildExchangeConnectorManagerSummary([
    {
      id: 71,
      secret_reference_id: null,
      exchange_name: sanitizedPlaceholder.exchangeName,
      label: sanitizedPlaceholder.label,
      mode: sanitizedPlaceholder.mode,
      status: sanitizedPlaceholder.status,
      settings: sanitizedPlaceholder.settings,
      created_at: '2026-05-14T00:00:00.000Z',
      updated_at: '2026-05-14T00:00:00.000Z'
    }
  ]);
  const readOnlyTest = evaluateExchangeConnectorReadOnlyTest({
    connector: {
      id: 72,
      label: 'Binance Read Only Placeholder',
      exchange_name: 'binance',
      mode: 'read_only',
      status: 'disabled',
      settings: createExchangeConnectorPlaceholderInput(getExchangeConnectorRegistryEntry('binance')).settings,
      secret_reference_id: null
    },
    registryEntry: getExchangeConnectorRegistryEntry('binance'),
    secretReference: null
  });

  if (!EXCHANGE_ADAPTER_CONTRACT_EXCHANGES.has('binance') || customSpec.exchangeName !== 'custom') {
    fail('exchange metadata module did not expose expected exchange contract registry');
  }

  if (
    EXCHANGE_CONNECTOR_CATEGORIES.length !== 11
    || !allCategoriesCovered
    || EXCHANGE_CONNECTOR_REGISTRY.length < 40
    || !recommendedCovered
    || firstFive.join(',') !== 'binance,coinbase,kraken,okx,bybit'
    || EXCHANGE_CONNECTOR_RECOMMENDED_ORDER[0] !== 'binance'
  ) {
    fail('exchange connector registry did not cover required categories and recommended exchanges');
  }

  if (
    sanitizedPlaceholder.status !== 'disabled'
    || sanitizedPlaceholder.mode !== 'read_only'
    || sanitizedPlaceholder.settings.liveTradingEnabled !== false
    || sanitizedPlaceholder.settings.withdrawalsEnabled !== false
    || sanitizedPlaceholder.settings.walletSigningEnabled !== false
    || sanitizedPlaceholder.settings.uiStoresCredentials !== false
  ) {
    fail('exchange connector placeholder did not preserve safe default-off boundaries');
  }

  if (
    managerSummary.safetyModel.liveTradingEnabled !== false
    || managerSummary.safetyModel.walletSigningEnabled !== false
    || managerSummary.recommendedFirstFive.length !== 5
    || managerSummary.recommendedFirstFive.map(entry => entry.id).join(',') !== 'binance,coinbase,kraken,okx,bybit'
    || !managerSummary.registry.some(entry => entry.id === 'uniswap' && entry.managerStatus === 'not connected')
  ) {
    fail('exchange connector manager summary did not preserve safe locked status');
  }

  if (
    readOnlyTest.safetyBoundary.networkCallMade !== false
    || readOnlyTest.safetyBoundary.liveTradingEnabled !== false
    || !readOnlyTest.reviewFailures.includes('read_only_reference_ready')
  ) {
    fail('exchange connector read-only test did not stay local and credential-free');
  }

  if (
    parsedConnector.settings?.marketDataOnly !== true
    || parsedConnector.secret_reference_name !== 'ethereal/binance-readonly'
    || parsedSecretReference.reference_name !== 'ethereal/binance-readonly'
    || parsedReadinessEvent.readiness?.liveExecution?.enabled !== false
    || parsedContractEvent.contract?.liveExecution?.orderEndpointEnabled !== false
  ) {
    fail('exchange metadata module did not parse connector/secret/event rows');
  }

  if (
    readiness.liveExecution?.enabled !== false
    || readiness.secretHandling?.secretsStoredInDatabase !== false
    || !readiness.blockingFailures.includes('live_order_adapter_implemented')
  ) {
    fail('exchange metadata module did not keep connector readiness live-disabled');
  }

  if (!unsafeReadiness.failures.includes('connector_settings_no_sensitive_fields')) {
    fail('exchange metadata module did not flag sensitive connector settings');
  }

  if (
    spec.exchangeName !== 'binance'
    || spec.liveExecution?.enabled !== false
    || !spec.requiredMethods.some(method => method.name === 'placeOrder' && method.implemented === false)
  ) {
    fail('exchange metadata module did not build disabled exchange adapter contract spec');
  }

  if (
    contract.status !== 'blocked'
    || contract.liveExecution?.orderEndpointEnabled !== false
    || !contract.blockingFailures.includes('live_order_endpoint_enabled')
  ) {
    fail('exchange metadata module did not keep adapter contract evaluation blocked');
  }

  pass('exchange metadata module');
}

function checkExchangeReadOnlyConnectionsModule() {
  const {
    OWNER_SECRETS_DIR,
    EXCHANGE_READONLY_VAULT_PATH,
    EXCHANGE_READONLY_VAULT_KEY_PATH,
    RECOMMENDED_READONLY_EXCHANGES,
    QUOTE_ONLY_CONNECTORS,
    EXPANDED_READONLY_MARKET_VENUES,
    EXCHANGE_READONLY_SETUP_GUIDES,
    DEX_QUOTE_ONLY_SETUP_GUIDES,
    sanitizeCredentialInput,
    sanitizePermissionsChecklist,
    buildReadOnlyConnectionSummary,
    scanReadOnlyArbitrageOpportunities,
    createPaperSimulationForOpportunity,
    buildLiveTradingLaunchRoadmap,
    createPlainEnglishPublicMarketDataError,
    createPlainEnglishExchangeError
  } = require(path.join(projectRoot, 'app/server/src/lib/exchange-readonly-connections'));
  const requiredCex = ['binance', 'coinbase', 'kraken', 'okx', 'bybit'];
  const requiredQuoteOnly = ['uniswap', 'jupiter', 'one-inch', 'gmx', 'hyperliquid'];
  const requiredExpandedVenues = [
    'kucoin',
    'gate-io',
    'mexc',
    'bitget',
    'bitstamp',
    'gemini',
    'crypto-com-us',
    'hyperliquid'
  ];
  const permissions = sanitizePermissionsChecklist({
    readOnlyEnabled: true,
    tradingDisabled: true,
    withdrawalsDisabled: true,
    transferDisabled: true,
    ipRestrictionReviewed: true,
    twoFactorEnabled: true,
    ownerUnderstandsReadOnlyOnly: true
  });
  const missingPermissions = sanitizePermissionsChecklist({});
  const coinbaseCredential = sanitizeCredentialInput({
    apiKey: 'fixture-key',
    apiSecret: 'fixture-secret',
    passphrase: 'fixture-passphrase'
  }, EXCHANGE_READONLY_SETUP_GUIDES.coinbase);
  const summary = buildReadOnlyConnectionSummary([
    {
      id: 91,
      exchange_name: 'binance',
      label: 'Binance Fixture',
      mode: 'read_only',
      status: 'configured',
      secret_reference_status: 'configured',
      settings: {
        registryId: 'binance',
        readOnlyConnection: {
          connectionStatus: 'read_only_connected',
          liveTradingEnabled: false,
          withdrawalsEnabled: false,
          walletSigningEnabled: false
        }
      }
    },
    {
      id: 92,
      exchange_name: 'uniswap',
      label: 'Uniswap Fixture',
      mode: 'read_only',
      status: 'disabled',
      secret_reference_status: null,
      settings: {
        registryId: 'uniswap'
      }
    }
  ]);
  const launchRoadmap = buildLiveTradingLaunchRoadmap({ connectors: [] });
  const paperSimulation = createPaperSimulationForOpportunity({
    symbol: 'BTC/USDT',
    buyVenue: 'OKX',
    sellVenue: 'Kraken',
    grossSpreadPercent: 0.44,
    estimatedNetProfitPercent: 0.11,
    tradeSizeUsd: 1000
  });

  if (
    !OWNER_SECRETS_DIR.endsWith('EtherealAI_Secrets')
    || !EXCHANGE_READONLY_VAULT_PATH.endsWith('exchange-readonly-vault.json')
    || !EXCHANGE_READONLY_VAULT_KEY_PATH.endsWith('exchange-readonly-vault.key')
    || requiredCex.some(exchange => !RECOMMENDED_READONLY_EXCHANGES.includes(exchange))
    || requiredQuoteOnly.some(exchange => !QUOTE_ONLY_CONNECTORS.includes(exchange))
    || requiredExpandedVenues.some(exchange => !EXPANDED_READONLY_MARKET_VENUES.includes(exchange))
    || requiredCex.some(exchange => !EXCHANGE_READONLY_SETUP_GUIDES[exchange]?.permissionsChecklist?.some(item => /withdraw/i.test(item)))
    || requiredQuoteOnly.some(exchange => !DEX_QUOTE_ONLY_SETUP_GUIDES[exchange]?.warning)
    || permissions.missing.length !== 0
    || missingPermissions.missing.length < 4
    || coinbaseCredential.passphrase !== 'fixture-passphrase'
    || summary.categories.connected.length !== 1
    || summary.categories.optionalLater.length !== 1
    || summary.safetyBoundary.liveTradingEnabled !== false
    || summary.safetyBoundary.withdrawalsEnabled !== false
    || summary.safetyBoundary.walletSigningEnabled !== false
    || typeof scanReadOnlyArbitrageOpportunities !== 'function'
    || launchRoadmap.phases.length !== 5
    || launchRoadmap.approvalCenter.status !== 'locked'
    || launchRoadmap.safetyBoundary.liveTradingEnabled !== false
    || launchRoadmap.safetyBoundary.withdrawalsEnabled !== false
    || launchRoadmap.safetyBoundary.walletSigningEnabled !== false
    || launchRoadmap.safetyBoundary.orderEndpointEnabled !== false
    || !launchRoadmap.phases.some(phase => phase.id === 'phase_2_arbitrage_intelligence' && /Paper simulation/.test(phase.done.join(' ')))
    || paperSimulation.status !== 'paper_simulation_created'
    || paperSimulation.safetyBoundary.paperOnly !== true
    || paperSimulation.safetyBoundary.liveTradingEnabled !== false
    || paperSimulation.safetyBoundary.orderEndpointEnabled !== false
    || !/read-only/.test(createPlainEnglishExchangeError('Binance', new Error('401 unauthorized')).toLowerCase())
    || !/public market-data/.test(createPlainEnglishPublicMarketDataError('Bybit', new Error('403 forbidden')).toLowerCase())
    || /private key|credential check/.test(createPlainEnglishPublicMarketDataError('Bybit', new Error('403 forbidden')).toLowerCase())
  ) {
    fail('exchange read-only connection module did not preserve encrypted-vault setup guides and locked safety boundaries');
  }

  pass('exchange read-only connection module');
}

async function checkExchangeLiveSafetyModule() {
  const {
    PHASE3_RECOMMENDED_EXCHANGES,
    UNIVERSAL_ORDER_TYPES,
    PHASE3A_ACCOUNT_STATUSES,
    DEFAULT_LIVE_SAFETY_POLICY,
    EXCHANGE_CAPABILITY_MATRIX,
    WEBSOCKET_STREAM_SPECS,
    fetchSymbolTradingRules,
    scanAuthenticatedReadOnlyAccounts,
    normalizeUniversalOrderDraft,
    evaluateLiveExecutionSafety,
    buildWebSocketHealthPlan,
    buildAccountAwareArbitrageView,
    replaySpreadHistory,
    buildOutcomeBenchmark,
    buildPhase3AReadiness,
    buildPhase3BPreparationPlan,
    buildPhase3Status
  } = require(path.join(projectRoot, 'app/server/src/lib/exchange-live-safety'));
  const connectors = [
    {
      id: 1,
      exchange_name: 'binance',
      label: 'Binance fixture',
      status: 'configured',
      secret_reference_status: 'configured',
      settings: {
        registryId: 'binance',
        readOnlyConnection: {
          connectionStatus: 'read_only_connected'
        }
      }
    }
  ];
  const accountScan = await scanAuthenticatedReadOnlyAccounts({
    connectors,
    credentialLoader: async () => null,
    includePublicSymbolRules: false
  });
  const order = normalizeUniversalOrderDraft({
    type: 'post-only',
    side: 'buy',
    symbol: 'BTC-USDT',
    notionalUsd: 100,
    liveExecutionRequested: true
  });
  const blockedSafety = evaluateLiveExecutionSafety({
    order,
    marketContext: {
      estimatedSlippagePercent: 0.2,
      latencyMs: 1500,
      priceAgeMs: 3000,
      liquidityUsd: 50,
      netSpreadPercent: -0.2
    },
    accountContext: {
      withdrawalPermission: 'enabled_on_exchange_key_review_required'
    }
  });
  const websocketPlan = buildWebSocketHealthPlan();
  const accountAware = buildAccountAwareArbitrageView({
    scan: {
      candidates: [{
        symbol: 'BTC/USDT',
        buyVenue: 'Binance',
        buyExchangeName: 'binance',
        sellVenue: 'Kraken',
        sellExchangeName: 'kraken',
        grossSpreadPercent: 0.4,
        estimatedNetProfitPercent: 0.12,
        slippagePercent: 0.1,
        latencyRiskPercent: 0.02,
        limitingLiquidityUsd: 20000,
        tradeSizeUsd: 1000,
        latencyMs: 300,
        accepted: true
      }]
    },
    accountScan: {
      profiles: [{
        exchangeName: 'binance',
        status: 'read_only_account_connected',
        feeTier: { takerFeePercent: 0.001 }
      }, {
        exchangeName: 'kraken',
        status: 'read_only_account_connected',
        feeTier: { takerFeePercent: 0.002 }
      }]
    }
  });
  const replay = replaySpreadHistory({ candidates: accountAware.candidates });
  const benchmark = buildOutcomeBenchmark({ accountAwareCandidate: accountAware.candidates[0] });
  const phase3A = buildPhase3AReadiness({
    connectors,
    accountScan: {
      profiles: [{
        exchangeName: 'binance',
        displayName: 'Binance',
        status: 'read_only_account_connected',
        phase3AStatus: PHASE3A_ACCOUNT_STATUSES.AUTHENTICATED_READ_ONLY,
        plainEnglishStatus: 'fixture connected',
        balances: { assetCount: 1, nonZeroAssetCount: 1, visibleBalances: [] },
        feeTier: { status: 'ok', makerFeePercent: 0.001, takerFeePercent: 0.001 },
        accountLimits: { status: 'ok' },
        symbolTradingRules: { status: 'loaded', minOrderQuantity: '0.001', minOrderNotional: '5' },
        marginFuturesMetadata: { status: 'ok' },
        permissionReview: {
          readOnlyAttested: true,
          tradingDisabledAttested: true,
          withdrawalsDisabledAttested: true,
          tradingPermissionDetected: false,
          unsafeWithdrawalPermissionDetected: false
        },
        safetyBoundary: { liveTradingEnabled: false, orderEndpointEnabled: false, walletSigningEnabled: false }
      }]
    },
    riskProfile: { id: 7, name: 'Fixture Risk', kill_switch_enabled: false, status: 'active' }
  });
  const phase3B = buildPhase3BPreparationPlan({ phase3A });
  const phase3 = buildPhase3Status({ connectors, accountScan });

  if (
    !PHASE3_RECOMMENDED_EXCHANGES.includes('binance')
    || !PHASE3_RECOMMENDED_EXCHANGES.includes('coinbase')
    || !PHASE3_RECOMMENDED_EXCHANGES.includes('kraken')
    || !PHASE3_RECOMMENDED_EXCHANGES.includes('okx')
    || !PHASE3_RECOMMENDED_EXCHANGES.includes('bybit')
    || PHASE3A_ACCOUNT_STATUSES.AUTHENTICATED_READ_ONLY !== 'Authenticated Read-Only'
    || typeof fetchSymbolTradingRules !== 'function'
    || !UNIVERSAL_ORDER_TYPES.includes('bracket')
    || DEFAULT_LIVE_SAFETY_POLICY.liveExecutionLocked !== true
    || DEFAULT_LIVE_SAFETY_POLICY.dryRunOnly !== true
    || !EXCHANGE_CAPABILITY_MATRIX.binance?.sandboxSupport
    || !EXCHANGE_CAPABILITY_MATRIX.bybit?.websocketSupport
    || WEBSOCKET_STREAM_SPECS.coinbase?.orderEntryEnabled !== false
    || accountScan.status !== 'waiting_for_read_only_keys'
    || accountScan.profiles.length !== 5
    || accountScan.safetyBoundary.liveTradingEnabled !== false
    || order.type !== 'post_only'
    || order.dryRun !== true
    || blockedSafety.status !== 'blocked'
    || !blockedSafety.failures.includes('live execution is locked')
    || !blockedSafety.failures.includes('withdrawal permission needs owner review and disablement')
    || blockedSafety.safetyBoundary.orderEndpointEnabled !== false
    || websocketPlan.streams.length < 5
    || websocketPlan.health.some(item => item.orderEntryEnabled !== false)
    || accountAware.candidates[0].estimatedAccountAwareNetProfitPercent >= accountAware.candidates[0].grossSpreadPercent
    || accountAware.spreadHeatmap[0].confidenceScore <= 0
    || replay.summary.samples !== 1
    || benchmark.comparison.realWorldFeeAdjustedOutcomePercent >= benchmark.comparison.estimatedLiveOutcomePercent
    || phase3A.title !== 'Phase 3A: Authenticated Account Readiness'
    || phase3A.checklist.length !== 10
    || !phase3A.exchanges.some(exchange => exchange.exchangeName === 'binance' && exchange.checklist.some(item => item.id === 'symbol_limits_loaded' && item.passed))
    || phase3B.status !== 'prepared_locked'
    || phase3B.orderEndpointImplemented !== false
    || phase3B.sandboxOrdersEnabled !== false
    || phase3.status !== 'locked_building'
    || phase3.phase3B.orderEndpointImplemented !== false
    || phase3.safetyBoundary.liveTradingEnabled !== false
    || phase3.universalOrderModel.liveOrderEndpointImplemented !== false
  ) {
    fail('exchange live safety module did not preserve Phase 3 authenticated-read-only, dry-run, websocket, benchmark, or live-locked behavior');
  }

  pass('exchange live safety module');
}

function checkExchangeSandboxExecutionModule() {
  const {
    SANDBOX_ORDER_LIFECYCLE_STATUSES,
    SANDBOX_ORDER_TYPES,
    SANDBOX_EXCHANGE_ADAPTERS,
    DEFAULT_SANDBOX_POLICY,
    getSandboxReferenceName,
    sanitizeSandboxCredentialInput,
    sanitizeSandboxPermissionsChecklist,
    normalizeSandboxOrderDraft,
    evaluateSandboxOrderSafety,
    buildPhase3BSandboxStatus,
    buildPhase3CPreparation,
    createPlainEnglishSandboxError
  } = require(path.join(projectRoot, 'app/server/src/lib/exchange-sandbox-execution'));
  const permissions = sanitizeSandboxPermissionsChecklist({
    sandboxKeyCreated: true,
    productionKeyNotUsed: true,
    sandboxTradingOnly: true,
    withdrawalsDisabled: true,
    ownerUnderstandsNoLiveOrders: true
  });
  const missingPermissions = sanitizeSandboxPermissionsChecklist({});
  const credentials = sanitizeSandboxCredentialInput({
    apiKey: 'fixture-key',
    apiSecret: 'fixture-secret'
  }, SANDBOX_EXCHANGE_ADAPTERS.binance);
  const order = normalizeSandboxOrderDraft({
    exchangeName: 'binance',
    symbol: 'BTC/USDT',
    side: 'buy',
    orderType: 'post-only',
    quantity: 0.1,
    limitPrice: 100
  });
  const safety = evaluateSandboxOrderSafety({
    order,
    adapter: SANDBOX_EXCHANGE_ADAPTERS.binance,
    connector: { id: 1, label: 'Binance Sandbox' },
    credentials: {
      ...credentials,
      permissionsChecklist: permissions.checklist
    },
    riskProfile: {
      id: 7,
      name: 'Sandbox Fixture Risk',
      status: 'active',
      max_order_value: 25,
      max_daily_loss: 50,
      kill_switch_enabled: 0
    },
    marketContext: {
      liquidityUsd: 1000000,
      slippagePercent: 0.05,
      priceTimestamp: new Date().toISOString()
    }
  });
  const blockedSafety = evaluateSandboxOrderSafety({
    order,
    adapter: SANDBOX_EXCHANGE_ADAPTERS.kraken,
    connector: { id: 2, label: 'Kraken Sandbox' },
    credentials: null,
    riskProfile: null,
    marketContext: {
      liquidityUsd: 0,
      slippagePercent: 1,
      priceTimestamp: new Date(Date.now() - 60000).toISOString()
    }
  });
  const phase3B = buildPhase3BSandboxStatus({
    connectors: [{
      id: 1,
      exchange_name: 'binance',
      label: 'Binance Sandbox',
      settings: { registryId: 'binance' }
    }],
    vaultStatus: {
      entries: [{ exchangeName: 'binance' }]
    },
    latestTests: []
  });
  const phase3C = buildPhase3CPreparation({
    latestSandboxTests: [{ status: 'canceled' }]
  });

  if (
    !SANDBOX_ORDER_LIFECYCLE_STATUSES.includes('created')
    || !SANDBOX_ORDER_LIFECYCLE_STATUSES.includes('partially_filled')
    || !SANDBOX_ORDER_LIFECYCLE_STATUSES.includes('canceled')
    || !SANDBOX_ORDER_TYPES.includes('post_only')
    || !SANDBOX_ORDER_TYPES.includes('ioc')
    || SANDBOX_EXCHANGE_ADAPTERS.binance.adapterStatus !== 'complete'
    || SANDBOX_EXCHANGE_ADAPTERS.okx.adapterStatus !== 'complete'
    || SANDBOX_EXCHANGE_ADAPTERS.bybit.adapterStatus !== 'complete'
    || SANDBOX_EXCHANGE_ADAPTERS.kraken.adapterStatus !== 'manual_docs_required'
    || SANDBOX_EXCHANGE_ADAPTERS.coinbase.adapterStatus !== 'manual_docs_required'
    || DEFAULT_SANDBOX_POLICY.productionLiveTradingEnabled !== false
    || DEFAULT_SANDBOX_POLICY.productionOrderEndpointEnabled !== false
    || !getSandboxReferenceName({ userId: 1, connectorId: 2, exchangeName: 'binance' }).startsWith('exchange-sandbox:')
    || permissions.missing.length !== 0
    || missingPermissions.missing.length < 5
    || credentials.apiKey !== 'fixture-key'
    || order.orderType !== 'post_only'
    || order.exchangeSymbol !== 'BTCUSDT'
    || safety.passed !== true
    || safety.safetyBoundary.productionOrderEndpointEnabled !== false
    || safety.safetyBoundary.walletSigningEnabled !== false
    || blockedSafety.passed !== false
    || !blockedSafety.checks.some(check => check.id === 'sandbox_adapter' && !check.passed)
    || phase3B.completeAdapters.length !== 3
    || !phase3B.manualDocsRequired.includes('kraken')
    || !phase3B.supportedExchanges.some(exchange => exchange.exchangeName === 'binance' && exchange.connectorId === 1 && exchange.sandboxCredentialsSaved)
    || phase3B.safetyBoundary.liveTradingEnabled !== false
    || phase3C.status !== 'locked_future_approval_required'
    || !phase3C.checklist.some(item => item.label === 'Emergency stop')
    || !/no live order/.test(createPlainEnglishSandboxError('binance', new Error('401 unauthorized')).toLowerCase())
  ) {
    fail('exchange sandbox execution module did not preserve Phase 3B sandbox lifecycle and live-locked safety boundaries');
  }

  pass('exchange sandbox execution module');
}

function checkExchangeTinyLiveExecutionModule() {
  const {
    TINY_LIVE_OWNER_CONFIRMATION_PHRASE,
    TINY_LIVE_ORDER_STATUSES,
    DEFAULT_TINY_LIVE_POLICY,
    TINY_LIVE_EXCHANGE_ADAPTERS,
    getTinyLiveReferenceName,
    sanitizeTinyLiveCredentialInput,
    sanitizeTinyLivePermissionsChecklist,
    normalizeTinyLiveOrderDraft,
    createTinyLiveOrderFingerprint,
    evaluateTinyLiveOrderSafety,
    createTinyLiveOrderPreview,
    buildTinyLiveApprovalCenter,
    createPlainEnglishTinyLiveError
  } = require(path.join(projectRoot, 'app/server/src/lib/exchange-tiny-live-execution'));
  const permissions = sanitizeTinyLivePermissionsChecklist({
    productionKeyReviewed: true,
    spotTradingEnabled: true,
    marginDisabled: true,
    futuresDisabled: true,
    leverageDisabled: true,
    withdrawalsDisabled: true,
    transferDisabled: true,
    ipRestrictionReviewed: true,
    ownerUnderstandsRealMoney: true,
    ownerUnderstandsOneManualOrderOnly: true
  });
  const missingPermissions = sanitizeTinyLivePermissionsChecklist({});
  const credentials = sanitizeTinyLiveCredentialInput({
    apiKey: 'fixture-key',
    apiSecret: 'fixture-secret'
  }, TINY_LIVE_EXCHANGE_ADAPTERS.binance);
  const order = normalizeTinyLiveOrderDraft({
    exchangeName: 'binance',
    symbol: 'BTC/USDT',
    side: 'buy',
    orderType: 'limit',
    quantity: 0.001,
    limitPrice: 100,
    maxTestOrderUsd: 10
  });
  const commonContext = {
    order,
    adapter: TINY_LIVE_EXCHANGE_ADAPTERS.binance,
    connector: { id: 1, label: 'Binance Tiny Live', exchange_name: 'binance', settings: { registryId: 'binance' } },
    credentials: {
      ...credentials,
      permissionsChecklist: permissions.checklist
    },
    livePermission: {
      status: 'permissions_verified',
      canTrade: true,
      canWithdraw: false,
      spotAllowed: true,
      marginDetected: false,
      futuresDetected: false,
      plainEnglishStatus: 'Fixture spot trading available and withdrawals disabled.'
    },
    riskProfile: {
      id: 11,
      name: 'Tiny Live Fixture Risk',
      status: 'active',
      max_order_value: 10,
      max_daily_loss: 10,
      kill_switch_enabled: 0
    },
    sandboxEvidence: [{
      exchange_name: 'binance',
      status: 'canceled'
    }],
    marketContext: {
      liquidityUsd: 1000000,
      slippagePercent: 0.05,
      priceTimestamp: new Date().toISOString()
    }
  };
  const safety = evaluateTinyLiveOrderSafety({
    ...commonContext,
    ownerConfirmation: TINY_LIVE_OWNER_CONFIRMATION_PHRASE
  });
  const blockedSafety = evaluateTinyLiveOrderSafety({
    ...commonContext,
    ownerConfirmation: ''
  });
  const preview = createTinyLiveOrderPreview({
    order,
    safety,
    adapter: TINY_LIVE_EXCHANGE_ADAPTERS.binance,
    livePermission: commonContext.livePermission
  });
  const center = buildTinyLiveApprovalCenter({
    connectors: [commonContext.connector],
    vaultStatus: {
      entries: [{ exchangeName: 'binance' }]
    },
    latestSandboxTests: commonContext.sandboxEvidence,
    latestTinyLiveOrders: [],
    riskProfile: commonContext.riskProfile,
    exchangeReadiness: {
      binance: commonContext.livePermission
    }
  });

  if (
    TINY_LIVE_OWNER_CONFIRMATION_PHRASE !== 'I APPROVE ONE TINY LIVE SPOT TEST'
    || !TINY_LIVE_ORDER_STATUSES.includes('preview_blocked')
    || !TINY_LIVE_ORDER_STATUSES.includes('reconciled')
    || DEFAULT_TINY_LIVE_POLICY.defaultLocked !== true
    || DEFAULT_TINY_LIVE_POLICY.automatedLiveTradingEnabled !== false
    || DEFAULT_TINY_LIVE_POLICY.walletSigningEnabled !== false
    || DEFAULT_TINY_LIVE_POLICY.withdrawalsEnabled !== false
    || DEFAULT_TINY_LIVE_POLICY.marginEnabled !== false
    || DEFAULT_TINY_LIVE_POLICY.futuresEnabled !== false
    || TINY_LIVE_EXCHANGE_ADAPTERS.binance.adapterStatus !== 'complete'
    || TINY_LIVE_EXCHANGE_ADAPTERS.okx.adapterStatus !== 'prepared_locked'
    || !getTinyLiveReferenceName({ userId: 1, connectorId: 2, exchangeName: 'binance' }).startsWith('exchange-tiny-live:')
    || permissions.missing.length !== 0
    || missingPermissions.missing.length < 7
    || credentials.apiKey !== 'fixture-key'
    || order.exchangeSymbol !== 'BTCUSDT'
    || !createTinyLiveOrderFingerprint(order).startsWith('tiny_live:binance:BTC/USDT')
    || safety.passed !== true
    || safety.safetyBoundary.automatedLiveTradingEnabled !== false
    || safety.safetyBoundary.walletSigningEnabled !== false
    || safety.safetyBoundary.withdrawalsEnabled !== false
    || blockedSafety.passed !== false
    || !blockedSafety.checks.some(check => check.id === 'manual_owner_confirmation' && !check.passed)
    || preview.safeToTest !== true
    || center.safeToTest !== true
    || center.readyExchange.exchangeName !== 'binance'
    || !/wallet signing/.test(createPlainEnglishTinyLiveError('binance', new Error('401 unauthorized')).toLowerCase())
  ) {
    fail('exchange tiny live execution module did not preserve Phase 3C manual-only safety boundaries');
  }

  pass('exchange tiny live execution module');
}

function checkExchangeLiveArbitrageCommandModule() {
  const {
    PHASE4_STATUS,
    DEFAULT_PHASE4_RISK_POLICY,
    PHASE4_SUPPORTED_VENUES,
    NETWORK_COST_BASELINES,
    createPhase4SafetyBoundary,
    buildVenueScores,
    buildSpreadHeatmap,
    rankArbitrageOpportunities,
    buildCrossExchangeInventory,
    buildCapitalAllocation,
    estimateTransferAndNetworkCosts,
    buildRecoveryAndOrchestration,
    buildRiskDashboard,
    buildLiveArbitrageCommandCenter
  } = require(path.join(projectRoot, 'app/server/src/lib/exchange-live-arbitrage-command'));
  const connectors = [
    { id: 1, exchange_name: 'binance', label: 'Binance', status: 'configured', settings: { registryId: 'binance', displayName: 'Binance' } },
    { id: 2, exchange_name: 'coinbase', label: 'Coinbase', status: 'configured', settings: { registryId: 'coinbase', displayName: 'Coinbase' } }
  ];
  const scan = {
    symbol: 'BTC/USDT',
    snapshots: [
      { status: 'ok', snapshot: { exchangeName: 'binance', displayName: 'Binance', bid: 100, ask: 99, latencyMs: 120, topAskLiquidityUsd: 50000, topBidLiquidityUsd: 50000, takerFeePercent: 0.1 } },
      { status: 'ok', snapshot: { exchangeName: 'coinbase', displayName: 'Coinbase', bid: 101, ask: 100.5, latencyMs: 180, topAskLiquidityUsd: 50000, topBidLiquidityUsd: 50000, takerFeePercent: 0.12 } }
    ],
    candidates: [{
      id: 'fixture',
      symbol: 'BTC/USDT',
      buyVenue: 'Binance',
      buyExchangeName: 'binance',
      sellVenue: 'Coinbase',
      sellExchangeName: 'coinbase',
      grossSpreadPercent: 2.02,
      totalEstimatedCostPercent: 0.35,
      estimatedNetProfitPercent: 1.67,
      limitingLiquidityUsd: 50000,
      latencyMs: 180,
      accepted: true
    }]
  };
  const accountScan = {
    profiles: [{
      exchangeName: 'binance',
      displayName: 'Binance',
      status: 'read_only_account_connected',
      feeTier: { takerFeePercent: 0.1 },
      balances: { assets: [{ asset: 'USDT', free: 250, usdValue: 250 }] }
    }, {
      exchangeName: 'coinbase',
      displayName: 'Coinbase',
      status: 'read_only_account_connected',
      feeTier: { takerFeePercent: 0.12 },
      balances: { assets: [{ asset: 'USDC', free: 250, usdValue: 250 }] }
    }]
  };
  const venueScores = buildVenueScores({ connectors, scan, accountScan });
  const heatmap = buildSpreadHeatmap({ scan, venueScores });
  const opportunities = rankArbitrageOpportunities({ scan, venueScores });
  const inventory = buildCrossExchangeInventory({ accountScan, venueScores, options: { orderSizeUsd: 100 } });
  const allocation = buildCapitalAllocation({ venueScores, inventory });
  const costs = estimateTransferAndNetworkCosts({ opportunities, options: { orderSizeUsd: 100 } });
  const orchestration = buildRecoveryAndOrchestration({ opportunities });
  const risk = buildRiskDashboard({ venueScores, opportunities });
  const commandCenter = buildLiveArbitrageCommandCenter({ connectors, scan, accountScan, options: { orderSizeUsd: 100 } });
  const boundary = createPhase4SafetyBoundary();

  if (
    PHASE4_STATUS.SAFE !== 'Safe'
    || DEFAULT_PHASE4_RISK_POLICY.globalKillSwitchEnabled !== true
    || DEFAULT_PHASE4_RISK_POLICY.multiExchangeLiveExecutionEnabled !== false
    || DEFAULT_PHASE4_RISK_POLICY.withdrawalsEnabled !== false
    || DEFAULT_PHASE4_RISK_POLICY.walletSigningEnabled !== false
    || !PHASE4_SUPPORTED_VENUES.includes('binance')
    || !NETWORK_COST_BASELINES.polygon
    || boundary.multiExchangeLiveExecutionEnabled !== false
    || boundary.unrestrictedAutonomousScalingEnabled !== false
    || boundary.withdrawalsEnabled !== false
    || boundary.walletSigningEnabled !== false
    || !venueScores.some(score => score.venue === 'binance' && score.scores.total > 0)
    || heatmap[0]?.status !== 'Safe'
    || opportunities[0]?.safetyStatus !== 'Safe'
    || opportunities[0]?.executionAllowed !== false
    || inventory.visibleStableUsd <= 0
    || allocation.allocations.length < 2
    || costs.crossChainCostModel.length < 5
    || orchestration.simultaneousExecution.enabled !== false
    || !orchestration.partialFillRecovery.actions.some(action => /Cancel/.test(action))
    || risk.safetyBoundary.multiExchangeLiveExecutionEnabled !== false
    || commandCenter.title !== 'Live Arbitrage Command Center'
    || commandCenter.safetyBoundary.orderEndpointEnabledForPhase4 !== false
    || commandCenter.executionOrchestration.orderRetryLogic.maxAttempts !== 1
  ) {
    fail('exchange live arbitrage command module did not preserve Phase 4 planning-only multi-exchange safety boundaries');
  }

  pass('exchange live arbitrage command module');
}

function checkExchangeTreasuryLiquidityIntelligenceModule() {
  const {
    PHASE5_AI_MODES,
    PHASE5_STATUS,
    DEFAULT_PHASE5_TREASURY_POLICY,
    createPhase5SafetyBoundary,
    buildTreasuryManagement,
    buildDynamicCapitalAllocation,
    buildLiquidityIntelligence,
    rankAutonomousTreasuryOpportunities,
    buildCrossChainIntelligence,
    buildTreasurySafetyControls,
    buildAiDecisionAudit,
    buildTreasuryLiquidityCommandCenter
  } = require(path.join(projectRoot, 'app/server/src/lib/exchange-treasury-liquidity-intelligence'));
  const accountScan = {
    profiles: [{
      exchangeName: 'binance',
      displayName: 'Binance',
      status: 'read_only_account_connected',
      phase3AStatus: 'Authenticated Read-Only',
      feeTier: { takerFeePercent: 0.1 },
      balances: { visibleBalances: [{ asset: 'USDT', available: 500, total: 500, usdValue: 500 }] },
      positions: { count: 0 }
    }, {
      exchangeName: 'coinbase',
      displayName: 'Coinbase',
      status: 'read_only_account_connected',
      phase3AStatus: 'Authenticated Read-Only',
      feeTier: { takerFeePercent: 0.12 },
      balances: { visibleBalances: [{ asset: 'BTC', available: 0.01, total: 0.01, usdValue: 1000 }] },
      positions: { count: 1 }
    }]
  };
  const scan = {
    snapshots: [
      { status: 'ok', snapshot: { exchangeName: 'binance', displayName: 'Binance', bid: 100, ask: 99, latencyMs: 120, topAskLiquidityUsd: 50000, topBidLiquidityUsd: 50000 } },
      { status: 'ok', snapshot: { exchangeName: 'coinbase', displayName: 'Coinbase', bid: 101, ask: 100.5, latencyMs: 180, topAskLiquidityUsd: 50000, topBidLiquidityUsd: 50000 } }
    ]
  };
  const phase4 = {
    options: { symbol: 'BTC/USDT', maxSlippagePercent: 0.15 },
    safetyBoundary: { multiExchangeLiveExecutionEnabled: false },
    spreadHeatmap: [{
      route: 'Binance -> Coinbase',
      status: 'Safe',
      estimatedNetProfitPercent: 1.25,
      liquidityUsd: 50000
    }],
    opportunityQueue: [{
      routeId: 'fixture',
      symbol: 'BTC/USDT',
      buyVenue: 'binance',
      sellVenue: 'coinbase',
      estimatedNetProfitPercent: 1.25,
      limitingLiquidityUsd: 50000,
      latencyMs: 180,
      confidenceScore: 90,
      safetyStatus: 'Safe'
    }]
  };
  const wallets = [{
    label: 'Treasury Polygon',
    chain_family: 'evm',
    network: 'polygon',
    public_address: '0x0000000000000000000000000000000000000000',
    status: 'configured',
    signing_enabled: 0,
    live_execution_enabled: 0
  }];
  const treasury = buildTreasuryManagement({ accountScan, wallets, phase4, options: { planningCapitalUsd: 2000 } });
  const liquidity = buildLiquidityIntelligence({ phase4, scan });
  const ranked = rankAutonomousTreasuryOpportunities({ phase4 });
  const allocation = buildDynamicCapitalAllocation({
    treasury,
    rankedOpportunities: ranked,
    options: { aiMode: PHASE5_AI_MODES.BALANCED }
  });
  const crossChain = buildCrossChainIntelligence({ wallets, treasury });
  const safety = buildTreasurySafetyControls({ treasury, allocation });
  const audit = buildAiDecisionAudit({ rankedOpportunities: ranked, allocation, treasury, safety });
  const command = buildTreasuryLiquidityCommandCenter({
    accountScan,
    scan,
    phase4,
    wallets,
    options: { aiMode: PHASE5_AI_MODES.BALANCED, planningCapitalUsd: 2000 }
  });
  const boundary = createPhase5SafetyBoundary();

  if (
    PHASE5_AI_MODES.MANUAL_APPROVAL_REQUIRED !== 'Manual Approval Required'
    || PHASE5_STATUS.LOCKED !== 'Locked'
    || DEFAULT_PHASE5_TREASURY_POLICY.treasuryKillSwitchEnabled !== true
    || DEFAULT_PHASE5_TREASURY_POLICY.autonomousTreasuryActionsEnabled !== false
    || boundary.autonomousTreasuryActionsEnabled !== false
    || boundary.unrestrictedWithdrawalsEnabled !== false
    || boundary.unrestrictedWalletSigningEnabled !== false
    || boundary.liveOrderEndpointEnabledForPhase5 !== false
    || treasury.totalCapitalUsd < 1500
    || treasury.stablecoinInventoryUsd < 500
    || liquidity.venueDepth.length < 2
    || ranked[0]?.executionAllowed !== false
    || allocation.allocations[0]?.executionAllowed !== false
    || crossChain.bestStablecoinInventoryRoutes.length < 3
    || safety.safetyBoundary.autonomousTreasuryActionsEnabled !== false
    || !audit.auditLogPolicy.includes('Phase 5 refresh is saved locally')
    || command.title !== 'Treasury Command Center'
    || command.safetyBoundary.bridgeOrTransferEndpointEnabled !== false
    || command.safetyBoundary.unrestrictedAutonomousScalingEnabled !== false
    || command.riskExposureDashboard.treasuryKillSwitch !== 'on'
  ) {
    fail('exchange treasury liquidity intelligence module did not preserve Phase 5 intelligence-only safety boundaries');
  }

  pass('exchange treasury liquidity intelligence module');
}

function checkExchangeProductionExecutionModule() {
  const {
    PHASE6_ENABLE_LIVE_CONFIRMATION_PHRASE,
    PHASE6_ORDER_CONFIRMATION_PHRASE,
    PHASE6_APPROVAL_SCOPE_TYPES,
    PHASE6_ORDER_STATUSES,
    DEFAULT_PHASE6_POLICY,
    PHASE6_PRODUCTION_ADAPTERS,
    normalizeProductionOrderDraft,
    createProductionOrderFingerprint,
    evaluateProductionOrderSafety,
    createProductionOrderPreview,
    buildPhase6ApprovalCenter,
    createProductionSafetyBoundary
  } = require(path.join(projectRoot, 'app/server/src/lib/exchange-production-execution'));
  const order = normalizeProductionOrderDraft({
    exchangeName: 'binance',
    symbol: 'BTC/USDT',
    side: 'buy',
    orderType: 'limit',
    quantity: 0.001,
    limitPrice: 50000,
    notionalUsd: 10,
    maxOrderUsd: 10
  });
  const approvals = [
    { scope_type: 'enable_live_trading', scope_value: 'global', status: 'active' },
    { scope_type: 'enable_exchange', scope_value: 'binance', status: 'active' },
    { scope_type: 'enable_strategy', scope_value: 'manual', status: 'active' },
    { scope_type: 'enable_symbol', scope_value: 'binance:BTC/USDT', status: 'active' },
    { scope_type: 'increase_capital_limits', scope_value: 'capital:10.00', status: 'active', capital_limit_usd: 10 }
  ];
  const credentials = {
    apiKey: 'fixture-key',
    apiSecret: 'fixture-secret',
    permissionsChecklist: {
      spotTradingEnabled: true,
      withdrawalsDisabled: true,
      transfersDisabled: true,
      marginDisabled: true,
      futuresDisabled: true,
      leverageDisabled: true
    }
  };
  const safety = evaluateProductionOrderSafety({
    order,
    adapter: PHASE6_PRODUCTION_ADAPTERS.binance,
    connector: { id: 1, label: 'Binance Production Locked' },
    credentials,
    productionPermission: {
      status: 'production_account_verified',
      canTrade: true,
      canWithdraw: false,
      spotAllowed: true,
      marginDetected: false,
      futuresDetected: false,
      plainEnglishStatus: 'fixture verified'
    },
    riskProfile: {
      id: 1,
      status: 'active',
      max_order_value: 10,
      max_daily_loss: 10,
      kill_switch_enabled: 0
    },
    sandboxEvidence: [{ exchange_name: 'binance', status: 'filled' }],
    tinyLiveEvidence: [],
    approvals,
    marketContext: {
      productionDryRunPassed: true,
      liquidityUsd: 100000,
      slippagePercent: 0.05,
      volatilityPercent: 1,
      netSpreadPercent: 0.1,
      latencyMs: 100,
      priceTimestamp: new Date().toISOString()
    },
    accountContext: {
      exchangeExposureUsd: 0,
      strategyExposureUsd: 0,
      dailyDrawdownUsd: 0,
      rollingLossUsd: 0,
      repeatedFailures: 0
    },
    recentOrderFingerprints: [],
    ownerConfirmation: PHASE6_ORDER_CONFIRMATION_PHRASE
  });
  const preview = createProductionOrderPreview({
    order,
    safety,
    adapter: PHASE6_PRODUCTION_ADAPTERS.binance,
    productionPermission: { status: 'production_account_verified', canTrade: true, canWithdraw: false }
  });
  const blockedSafety = evaluateProductionOrderSafety({
    order,
    adapter: PHASE6_PRODUCTION_ADAPTERS.binance,
    connector: { id: 1 },
    credentials: null,
    approvals: [],
    riskProfile: null,
    sandboxEvidence: [],
    marketContext: {},
    ownerConfirmation: ''
  });
  const center = buildPhase6ApprovalCenter({
    connectors: [{ id: 1, exchange_name: 'binance', settings: { registryId: 'binance' } }],
    vaultStatus: { entries: [{ exchangeName: 'binance' }] },
    approvals,
    latestOrders: [],
    riskProfile: { id: 1, status: 'active', kill_switch_enabled: 0 },
    latestSandboxTests: [{ exchange_name: 'binance', status: 'filled' }]
  });
  const boundary = createProductionSafetyBoundary(false);

  if (
    PHASE6_ENABLE_LIVE_CONFIRMATION_PHRASE !== 'I APPROVE CONTROLLED PRODUCTION LIVE TRADING'
    || PHASE6_ORDER_CONFIRMATION_PHRASE !== 'I APPROVE THIS PRODUCTION ORDER'
    || !PHASE6_APPROVAL_SCOPE_TYPES.includes('enable_exchange')
    || !PHASE6_ORDER_STATUSES.includes('preview_blocked')
    || DEFAULT_PHASE6_POLICY.defaultLocked !== true
    || DEFAULT_PHASE6_POLICY.automatedLiveTradingEnabled !== false
    || DEFAULT_PHASE6_POLICY.withdrawalsEnabled !== false
    || DEFAULT_PHASE6_POLICY.walletSigningEnabled !== false
    || PHASE6_PRODUCTION_ADAPTERS.binance.adapterStatus !== 'production_route_ready_locked'
    || !PHASE6_PRODUCTION_ADAPTERS.coinbase
    || !PHASE6_PRODUCTION_ADAPTERS.kraken
    || !PHASE6_PRODUCTION_ADAPTERS.okx
    || !PHASE6_PRODUCTION_ADAPTERS.bybit
    || order.exchangeSymbol !== 'BTCUSDT'
    || !createProductionOrderFingerprint(order).startsWith('production:binance')
    || safety.passed !== true
    || safety.safetyBoundary.productionOrderEndpointEnabled !== true
    || safety.safetyBoundary.automatedLiveTradingEnabled !== false
    || safety.safetyBoundary.withdrawalsEnabled !== false
    || safety.safetyBoundary.walletSigningEnabled !== false
    || preview.safeToSubmit !== true
    || blockedSafety.passed !== false
    || blockedSafety.safetyBoundary.productionOrderEndpointEnabled !== false
    || center.title !== 'Phase 6: Production Trading Command Center'
    || center.safetyBoundary.productionOrderEndpointEnabled !== false
    || center.exchanges.length < 5
    || boundary.productionOrderEndpointEnabled !== false
    || boundary.automatedLiveTradingEnabled !== false
    || boundary.withdrawalsEnabled !== false
    || boundary.walletSigningEnabled !== false
  ) {
    fail('exchange production execution module did not preserve Phase 6 owner-gated production safety boundaries');
  }

  pass('exchange production execution module');
}

function checkStrategyResearchModule() {
  const {
    parseStrategy,
    parseBacktest,
    parsePaperSession,
    parseOptimizationSweep,
    parseSplitTest,
    parseWalkForwardTest,
    parseDecisionLog
  } = require(path.join(projectRoot, 'app/server/src/lib/strategy-research'));
  const strategy = parseStrategy({
    id: 21,
    name: 'Breakout Fixture',
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    strategy_type: 'cross_exchange_arbitrage',
    strategy_rules_json: '{"arbitrageType":"cex_cex","buyVenues":["binance"],"sellVenues":["coinbase"],"minimumSpreadPercent":0.4}',
    entry_rules: 'Close crosses above resistance.',
    exit_rules: 'Close below trailing average.',
    stop_loss: 2,
    take_profit: 5,
    risk_notes: 'fixture',
    status: 'research',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  });
  const backtest = parseBacktest({
    id: 22,
    strategy_id: 21,
    status: 'completed',
    result_json: '{"summary":{"totalReturnPercent":12.5}}',
    created_at: '2026-05-14T00:00:00.000Z'
  });
  const paperSession = parsePaperSession({
    id: 23,
    strategy_id: 21,
    market_data_import_id: 24,
    name: 'Paper Fixture',
    mode: 'replay',
    status: 'completed',
    initial_capital: 10000,
    current_equity: 10400,
    result_json: '{"riskGate":{"status":"passed"}}',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    strategy_name: 'Breakout Fixture',
    market_symbol: 'BTC-USD',
    timeframe: '1h'
  });
  const sweep = parseOptimizationSweep({
    id: 25,
    strategy_id: 21,
    market_data_import_id: 24,
    name: 'Sweep Fixture',
    status: 'completed',
    result_json: '{"best":{"stopLoss":2}}',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    strategy_name: 'Breakout Fixture',
    market_symbol: 'BTC-USD',
    timeframe: '1h'
  });
  const splitTest = parseSplitTest({
    id: 26,
    strategy_id: 21,
    market_data_import_id: 24,
    name: 'Split Fixture',
    status: 'completed',
    result_json: '{"segments":[{"name":"train"}]}',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    strategy_name: 'Breakout Fixture',
    market_symbol: 'BTC-USD',
    timeframe: '1h'
  });
  const walkForward = parseWalkForwardTest({
    id: 27,
    strategy_id: 21,
    market_data_import_id: 24,
    name: 'Walk Fixture',
    status: 'completed',
    result_json: '{"windows":[{"index":1}]}',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    strategy_name: 'Breakout Fixture',
    market_symbol: 'BTC-USD',
    timeframe: '1h'
  });
  const decisionLog = parseDecisionLog({
    id: 28,
    strategy_id: 21,
    backtest_id: 22,
    paper_session_id: 23,
    market_data_import_id: 24,
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    candle_timestamp: '2026-05-14T00:00:00.000Z',
    candle_index: 4,
    decision: 'enter_long',
    reason: 'fixture signal',
    price: 50000,
    payload_json: '{"signal":"breakout"}',
    created_at: '2026-05-14T00:00:00.000Z',
    strategy_name: 'Breakout Fixture'
  });

  if (
    strategy.market_symbol !== 'BTC-USD'
    || strategy.strategy_type !== 'cross_exchange_arbitrage'
    || strategy.strategy_rules?.arbitrageType !== 'cex_cex'
    || strategy.strategy_rules?.buyVenues?.[0] !== 'binance'
    || backtest.result?.summary?.totalReturnPercent !== 12.5
    || paperSession.result?.riskGate?.status !== 'passed'
    || sweep.result?.best?.stopLoss !== 2
    || splitTest.result?.segments?.[0]?.name !== 'train'
    || walkForward.result?.windows?.[0]?.index !== 1
    || decisionLog.payload?.signal !== 'breakout'
  ) {
    fail('strategy research module did not parse strategy/backtest/research rows');
  }

  pass('strategy research module');
}

async function checkStrategyDecisionLogRuntimeModule() {
  const {
    createStrategyDecisionLogRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/strategy-decision-logs'));
  const dbRuns = [];
  const runtime = createStrategyDecisionLogRuntime({
    async dbRun(query, params) {
      dbRuns.push({ query, params });
      return { changes: 1 };
    }
  });
  await runtime.insertDecisionLogs({
    strategy: {
      id: 21
    },
    marketImport: {
      id: 24,
      market_symbol: 'BTC-USD',
      timeframe: '1h'
    },
    backtestId: 22,
    paperSessionId: 23,
    decisions: [
      {
        timestamp: '2026-05-14T00:00:00.000Z',
        candleIndex: 4,
        decision: 'enter_long',
        reason: 'fixture signal',
        price: 50000,
        confidence: 0.8
      },
      {
        timestamp: '2026-05-14T01:00:00.000Z',
        candleIndex: 5,
        decision: 'hold',
        reason: 'fixture hold'
      }
    ]
  });

  if (
    dbRuns.length !== 2
    || !dbRuns.every(run => run.query.includes('INSERT INTO trading_decision_logs'))
    || dbRuns[0].params[0] !== 21
    || dbRuns[0].params[1] !== 22
    || dbRuns[0].params[2] !== 23
    || dbRuns[0].params[3] !== 24
    || dbRuns[0].params[4] !== 'BTC-USD'
    || dbRuns[0].params[5] !== '1h'
    || dbRuns[0].params[6] !== '2026-05-14T00:00:00.000Z'
    || dbRuns[0].params[7] !== 4
    || dbRuns[0].params[8] !== 'enter_long'
    || dbRuns[0].params[9] !== 'fixture signal'
    || dbRuns[0].params[10] !== 50000
    || JSON.parse(dbRuns[0].params[11]).confidence !== 0.8
    || dbRuns[1].params[10] !== null
  ) {
    fail('strategy decision log runtime did not preserve insert payload behavior');
  }

  pass('strategy decision log runtime module');
}

function checkStrategyMathModule() {
  const {
    roundNumber,
    getBacktestNumber,
    parseSweepNumberList,
    calculateMaxDrawdownPercent,
    average
  } = require(path.join(projectRoot, 'app/server/src/lib/strategy-math'));
  const sweep = parseSweepNumberList('0.1, 0.2 0.2\nbad 5', [1], {
    min: 0,
    max: 1,
    limit: 3
  });

  if (
    roundNumber(1.23456, 2) !== 1.23
    || roundNumber(Infinity) !== null
    || getBacktestNumber('5', 1, 2) !== 5
    || getBacktestNumber('1', 9, 2) !== 9
    || sweep.length !== 2
    || sweep[0] !== 0.1
    || sweep[1] !== 0.2
    || calculateMaxDrawdownPercent([100, 120, 90, 130]) !== 25
    || average([2, 4, 6]) !== 4
    || average([]) !== 0
  ) {
    fail('strategy math module did not preserve numeric helper behavior');
  }

  pass('strategy math module');
}

function checkStrategySignalsModule() {
  const {
    findPeriodNearAverage,
    findLookbackPeriod,
    findIndicatorPeriod,
    findThresholdForDirection,
    findSmallCount,
    findVolumeAveragePeriod,
    findVolumeMultiplier,
    findVolumeBelowMultiplier,
    findWickMultiplier,
    parseAverageCrossRule,
    movingAverage,
    buildEmaSeries,
    buildVwapSeries,
    buildRsiSeries,
    buildMacdSeries,
    standardDeviation,
    bollingerBands,
    parseSignalRule,
    createSignalEvaluator
  } = require(path.join(projectRoot, 'app/server/src/lib/strategy-signals'));
  const candles = [
    { open: 10, high: 12, low: 9, close: 10, volume: 100 },
    { open: 10, high: 12, low: 10, close: 11, volume: 110 },
    { open: 11, high: 13, low: 11, close: 12, volume: 120 },
    { open: 12, high: 14, low: 12, close: 13, volume: 200 },
    { open: 13, high: 15, low: 13, close: 14, volume: 210 },
    { open: 14, high: 16, low: 14, close: 15, volume: 220 }
  ];
  const evaluatorCandles = [
    { open: 10, high: 12, low: 9, close: 11, volume: 100 },
    { open: 11, high: 12, low: 9, close: 10, volume: 100 },
    { open: 10, high: 13, low: 10, close: 12, volume: 100 }
  ];
  const averageCross = parseAverageCrossRule('10 ema crosses above 20 ema');
  const combinedRule = parseSignalRule('rsi crosses above 60 and volume above 2x average', 'entry');
  const evaluator = createSignalEvaluator({
    entry_rules: 'green candle',
    exit_rules: 'red candle'
  }, evaluatorCandles);
  const ema = buildEmaSeries(candles, 3);
  const vwap = buildVwapSeries(candles);
  const rsi = buildRsiSeries(candles, 2);
  const macd = buildMacdSeries(candles, 2, 3, 2);
  const bands = bollingerBands(candles, 2, 3, 2);

  if (
    findPeriodNearAverage('sma 21 crossover') !== 21
    || findLookbackPeriod('breakout above previous high') !== 1
    || findIndicatorPeriod('rsi 9 below 30', 'rsi', 14) !== 9
    || findThresholdForDirection('above 61.5', 'above', 70) !== 61.5
    || findSmallCount('three green candles') !== 3
    || findVolumeAveragePeriod('volume above 30 average') !== 30
    || findVolumeMultiplier('volume 2x average') !== 2
    || findVolumeBelowMultiplier('volume 25% below average') !== 0.75
    || findWickMultiplier('wick ratio > 2') !== 2
    || averageCross.kind !== 'average_cross_above'
    || averageCross.fastPeriod !== 10
    || averageCross.slowPeriod !== 20
    || movingAverage(candles, 2, 3) !== 11
    || ema[2] !== 11
    || Math.round(vwap[0] * 100) / 100 !== 10.33
    || rsi[2] !== 100
    || macd.macd.length !== candles.length
    || Math.round(standardDeviation([2, 4, 6]) * 100) / 100 !== 1.63
    || bands.middle !== 11
    || combinedRule.kind !== 'all_conditions'
    || combinedRule.rules.length !== 2
    || evaluator.entryRule.kind !== 'green_candle'
    || evaluator.exitRule.kind !== 'red_candle'
    || evaluator.shouldEnterAtOpen(1) !== true
    || evaluator.shouldExitAtOpen(2) !== true
  ) {
    fail('strategy signals module did not preserve signal parsing/evaluator behavior');
  }

  pass('strategy signals module');
}

function checkStrategyEngineModule() {
  const {
    runCandleBacktest,
    evaluatePaperRiskGate,
    createPaperReplayPayload,
    createPaperBotAutomationRunPayload,
    createOptimizationSweepPayload,
    createSplitTestPayload,
    createWalkForwardPayload
  } = require(path.join(projectRoot, 'app/server/src/lib/strategy-engine'));
  const strategy = {
    id: 41,
    name: 'Green Red Fixture',
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    entry_rules: 'green candle',
    exit_rules: 'red candle',
    stop_loss: 0,
    take_profit: 0
  };
  const marketImport = {
    id: 42,
    market_symbol: 'BTC-USD',
    timeframe: '1h'
  };
  const candles = Array.from({ length: 30 }, (_, index) => {
    const open = 100 + index;
    const isRed = index % 4 === 2;
    const close = isRed ? open - 1 : open + 2;

    return {
      timestamp: new Date(Date.UTC(2026, 4, 14, index)).toISOString(),
      open,
      high: Math.max(open, close) + 1,
      low: Math.min(open, close) - 1,
      close,
      volume: 1000 + (index * 10)
    };
  });
  const backtest = runCandleBacktest(strategy, candles, marketImport, {
    initialCapital: 10000,
    feePercent: 0,
    slippagePercent: 0
  });
  const riskGate = evaluatePaperRiskGate(backtest, {
    maxDrawdownPercent: 100,
    maxLossStreak: 99,
    minTradeCount: 1
  });
  const paper = createPaperReplayPayload(strategy, marketImport, backtest, {
    maxDrawdownPercent: 100,
    maxLossStreak: 99,
    minTradeCount: 1
  });
  const botRun = createPaperBotAutomationRunPayload(
    {
      id: 43,
      name: 'Fixture Paper Bot',
      mode: 'paper',
      status: 'active'
    },
    strategy,
    {
      id: 44,
      name: 'Fixture Risk',
      mode: 'paper',
      status: 'active',
      kill_switch_enabled: 1,
      max_order_value: 100,
      max_position_value: 200,
      max_daily_loss: 10,
      max_open_trades: 1
    },
    marketImport,
    candles,
    {
      status: 'ready_for_paper',
      blockingFailures: []
    },
    { positionOpen: false }
  );
  const arbitrageStrategy = {
    id: 51,
    name: 'Fixture Cross Venue Arb',
    market_symbol: 'MATIC/USDT',
    timeframe: '1m',
    strategy_type: 'hybrid_dex_cex_arbitrage',
    strategy_rules: {
      arbitrageType: 'dex_cex',
      buyVenues: ['quickswap', 'uniswap'],
      sellVenues: ['binance', 'coinbase'],
      minimumSpreadPercent: 0.05,
      estimatedFeePercent: 0.05,
      slippageTolerancePercent: 0.02,
      minimumLiquidity: 500,
      maxExecutionLatencyMs: 1000,
      simultaneousExecutionRequired: true,
      stablecoinPair: 'USDT',
      tokenWhitelist: ['MATIC']
    },
    entry_rules: 'structured arbitrage fixture',
    exit_rules: 'same-cycle fixture',
    stop_loss: null,
    take_profit: null
  };
  const arbitrageBacktest = runCandleBacktest(arbitrageStrategy, candles, {
    id: 52,
    market_symbol: 'MATIC/USDT',
    timeframe: '1m'
  }, {
    initialCapital: 10000
  });
  const arbitragePaper = createPaperReplayPayload(arbitrageStrategy, {
    id: 52,
    market_symbol: 'MATIC/USDT',
    timeframe: '1m'
  }, arbitrageBacktest, {
    maxDrawdownPercent: 100,
    maxLossStreak: 99,
    minTradeCount: 0
  });
  const arbitrageBotRun = createPaperBotAutomationRunPayload(
    {
      id: 53,
      name: 'Fixture Arb Bot',
      mode: 'paper',
      status: 'active'
    },
    arbitrageStrategy,
    null,
    {
      id: 52,
      market_symbol: 'MATIC/USDT',
      timeframe: '1m'
    },
    candles,
    {
      status: 'ready_for_paper',
      blockingFailures: []
    }
  );
  const sweep = createOptimizationSweepPayload(strategy, candles, marketImport, {
    initialCapital: 10000,
    feePercents: [0],
    slippagePercents: [0],
    stopLossPercents: [0],
    takeProfitPercents: [0]
  });
  const split = createSplitTestPayload(strategy, candles, marketImport, {
    trainPercent: 60,
    feePercent: 0,
    slippagePercent: 0
  });
  const walk = createWalkForwardPayload(strategy, candles, marketImport, {
    trainCandles: 10,
    testCandles: 5,
    stepCandles: 5,
    feePercent: 0,
    slippagePercent: 0
  });
  let shortCandleError = '';

  try {
    runCandleBacktest(strategy, candles.slice(0, 1), marketImport);
    fail('strategy engine allowed a one-candle backtest');
  } catch (error) {
    shortCandleError = error.message;
  }

  if (
    backtest.mode !== 'candle_backtest_v1'
    || backtest.data.candleCount !== candles.length
    || backtest.parsedRules.entry.kind !== 'green_candle'
    || backtest.parsedRules.exit.kind !== 'red_candle'
    || backtest.metrics.tradeCount < 1
    || Object.prototype.hasOwnProperty.call(backtest, 'liveExecution')
    || riskGate.status !== 'passed'
    || paper.mode !== 'historical_replay_v1'
    || paper.sourceMode !== 'candle_backtest_v1'
    || !paper.warning.includes('does not place live orders')
    || paper.riskGate.status !== 'passed'
    || botRun.mode !== 'paper_bot_decision_cycle_v1'
    || botRun.liveExecution.enabled !== false
    || !['enter', 'wait'].includes(botRun.decision.action)
    || arbitrageBacktest.mode !== 'arbitrage_backtest_v1'
    || arbitrageBacktest.parsedRules.entry.kind !== 'structured_arbitrage_route'
    || arbitrageBacktest.parsedRules.warnings.some(warning => warning.includes('could not be translated'))
    || arbitrageBacktest.settings.arbitrageType !== 'dex_cex'
    || !Array.isArray(arbitrageBacktest.routeModel.buyVenues)
    || arbitragePaper.mode !== 'historical_replay_v1'
    || arbitragePaper.sourceMode !== 'arbitrage_backtest_v1'
    || arbitragePaper.parsedRules.entry.kind !== 'structured_arbitrage_route'
    || arbitrageBotRun.mode !== 'arbitrage_paper_bot_decision_cycle_v1'
    || arbitrageBotRun.liveExecution.enabled !== false
    || !['arbitrage_execute', 'wait'].includes(arbitrageBotRun.decision.action)
    || sweep.mode !== 'optimization_sweep_v1'
    || sweep.searchSpace.totalRunCount !== 1
    || sweep.runs.length !== 1
    || split.mode !== 'split_test_v1'
    || split.data.inSampleCount < 2
    || split.data.outOfSampleCount < 2
    || walk.mode !== 'walk_forward_test_v1'
    || walk.summary.windowCount < 1
    || !/At least two candles/.test(shortCandleError)
  ) {
    fail('strategy engine module did not preserve research-only backtest and paper payload behavior');
  }

  pass('strategy engine module');
}

async function checkMarketDataModule() {
  const {
    getProviderCandleLimit,
    parseMarketDataProvider,
    parseMarketDataRefreshSchedule,
    parseMarketDataRefreshRun,
    parseMarketImport,
    parseMarketImportJob,
    timeframeToMs,
    addMinutesToIso,
    normalizeScheduleStatus,
    normalizeOptionalIsoDate,
    clampScheduleCandleCount,
    createBackfillWindow,
    filterCandlesByBackfillWindow,
    generateSyntheticOhlcvCsv,
    candlesToOhlcvCsv,
    dedupeSortAndLimitCandles,
    parseOhlcvCsv,
    parseOhlcvCsvLine,
    createStreamingMarketDataSummaryTracker,
    classifyMarketRegime,
    createMarketDataSummary,
    normalizeBinanceSymbol,
    normalizeCoinbaseProduct,
    normalizeKrakenPair,
    toBinanceInterval,
    toCoinbaseGranularity,
    toKrakenInterval,
    getProviderHealthDefaults,
    PUBLIC_MARKET_DATA_FETCH_TIMEOUT_MS,
    fetchJsonWithTimeout,
    fetchProviderOhlcvCsv
  } = require(path.join(projectRoot, 'app/server/src/lib/market-data'));
  const provider = parseMarketDataProvider({
    id: 31,
    user_id: 1,
    provider_name: 'kraken',
    label: 'Kraken Public',
    provider_type: 'kraken_public',
    status: 'active',
    settings_json: '{"pairOverride":"XBT/USD"}',
    secret_storage_note: 'metadata only',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  });
  const schedule = parseMarketDataRefreshSchedule({
    id: 32,
    user_id: 1,
    provider_id: 31,
    label: 'BTC Kraken hourly',
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    lookback_candles: 1000,
    backfill_start_at: '2026-05-01T00:00:00.000Z',
    backfill_end_at: '2026-05-14T00:00:00.000Z',
    interval_minutes: 60,
    status: 'active',
    last_run_at: null,
    next_run_at: '2026-05-14T01:00:00.000Z',
    last_run_id: null,
    last_import_job_id: null,
    last_error: null,
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    provider_label: 'Kraken Public',
    provider_name: 'kraken',
    provider_type: 'kraken_public'
  });
  const refreshRun = parseMarketDataRefreshRun({
    id: 33,
    user_id: 1,
    schedule_id: 32,
    provider_id: 31,
    import_job_id: 34,
    status: 'completed',
    trigger_type: 'manual',
    message: 'fixture',
    payload_json: '{"returnedCandles":720}',
    started_at: '2026-05-14T00:00:00.000Z',
    completed_at: '2026-05-14T00:00:01.000Z',
    created_at: '2026-05-14T00:00:00.000Z',
    schedule_label: 'BTC Kraken hourly',
    provider_label: 'Kraken Public'
  });
  const marketImport = parseMarketImport({
    id: 35,
    user_id: 1,
    label: null,
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    source: 'csv',
    status: 'ready',
    quality_score: null,
    summary_json: '{"duplicateTimestamps":1,"outOfOrderRows":1,"gapCount":1,"invalidShapeRows":1}',
    created_at: '2026-05-14T00:00:00.000Z'
  });
  const importJob = parseMarketImportJob({
    id: 36,
    user_id: 1,
    import_id: 35,
    label: null,
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    source: 'csv_upload',
    status: 'failed',
    total_rows: 200,
    processed_rows: 50,
    cancel_requested: 0,
    cancel_requested_at: null,
    retry_count: 1,
    retried_at: '2026-05-14T00:00:00.000Z',
    source_payload: '{"source":"fixture"}',
    source_file_path: null,
    quality_score: null,
    notes: 'fixture',
    error: 'fixture failure',
    source_file_name: 'candles.csv',
    upload_bytes: 128,
    summary_json: '{"qualityScore":88}',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    completed_at: null
  });
  const backfillWindow = createBackfillWindow('2026-05-14T00:00:00.000Z', '2026-05-14T02:00:00.000Z');
  const filteredCandles = filterCandlesByBackfillWindow([
    { timestamp: '2026-05-13T23:00:00.000Z', open: 1, high: 2, low: 1, close: 2, volume: 10 },
    { timestamp: '2026-05-14T01:00:00.000Z', open: 2, high: 3, low: 2, close: 3, volume: 20 },
    { timestamp: 'bad timestamp', open: 3, high: 4, low: 3, close: 4, volume: 30 }
  ], backfillWindow);
  const syntheticCsv = generateSyntheticOhlcvCsv({
    marketSymbol: 'BTC-USD',
    timeframe: '1h',
    candleCount: 3,
    startAt: '2026-05-14T00:00:00.000Z',
    endAt: '2026-05-14T02:00:00.000Z'
  });
  const candleCsv = candlesToOhlcvCsv([
    { timestamp: '2026-05-14T01:00:00.000Z', open: 2, high: 3, low: 2, close: 3, volume: 20 },
    { timestamp: '2026-05-14T00:00:00.000Z', open: 1, high: 2, low: 1, close: 2, volume: 10 }
  ]);
  const deduped = dedupeSortAndLimitCandles([
    { timestamp: '2026-05-14T00:00:00.000Z', close: 1 },
    { timestamp: '2026-05-14T00:00:00.000Z', close: 2 },
    { timestamp: '2026-05-14T01:00:00.000Z', close: 3 }
  ], 2);
  const parsedCandles = parseOhlcvCsv([
    'timestamp,open,high,low,close,volume',
    '2026-05-14T00:00:00.000Z,100,105,99,104,1000',
    '2026-05-14T01:00:00.000Z,104,110,103,109,1300',
    '2026-05-14T03:00:00.000Z,109,111,108,110,900'
  ].join('\n'));
  const parsedLine = parseOhlcvCsvLine('2026-05-14T04:00:00.000Z,110,112,109,111,950', 4);
  const tracker = createStreamingMarketDataSummaryTracker('1h');
  parsedCandles.forEach(candle => tracker.add(candle));
  const streamingSummary = tracker.finish();
  const regime = classifyMarketRegime(parsedCandles);
  const summary = createMarketDataSummary(parsedCandles, '1h');
  let fetchReceivedAbortSignal = false;
  const fetchedJson = await fetchJsonWithTimeout('https://example.test/ok', {
    timeoutMs: 1000,
    fetchImpl: async (url, options = {}) => {
      fetchReceivedAbortSignal = Boolean(options.signal);
      return {
        ok: true,
        json: async () => ({ ok: true, url })
      };
    }
  });
  let httpErrorMessage = '';
  try {
    await fetchJsonWithTimeout('https://example.test/fail', {
      timeoutMs: 1000,
      fetchImpl: async () => ({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({})
      })
    });
    fail('market data fetch helper allowed a failed HTTP response');
  } catch (error) {
    httpErrorMessage = error.message;
  }
  const localProviderResult = await fetchProviderOhlcvCsv({
    provider_type: 'local_mock',
    settings_json: '{}',
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    lookback_candles: 3,
    backfill_start_at: '2026-05-14T00:00:00.000Z',
    backfill_end_at: '2026-05-14T02:00:00.000Z'
  });
  let ccxtErrorMessage = '';
  try {
    await fetchProviderOhlcvCsv({
      provider_type: 'ccxt_planned',
      settings_json: '{}',
      market_symbol: 'BTC-USD',
      timeframe: '1h',
      lookback_candles: 3
    });
    fail('market data provider fetch allowed planned CCXT execution');
  } catch (error) {
    ccxtErrorMessage = error.message;
  }

  if (
    getProviderCandleLimit('kraken_public') !== 720
    || provider.settings?.pairOverride !== 'XBT/USD'
    || provider.provider_candle_limit !== 720
    || schedule.provider_candle_limit !== 720
    || refreshRun.payload?.returnedCandles !== 720
    || marketImport.label !== 'BTC-USD 1h import'
    || marketImport.quality_score !== 60
    || importJob.progress_percent !== 25
    || importJob.retry_available !== true
    || importJob.source_retained !== true
    || importJob.quality_score !== 88
    || timeframeToMs('2h') !== 7200000
    || addMinutesToIso(30, new Date('2026-05-14T00:00:00.000Z')) !== '2026-05-14T00:30:00.000Z'
    || normalizeScheduleStatus('paused') !== 'paused'
    || normalizeScheduleStatus('unknown', 'disabled') !== 'disabled'
    || normalizeOptionalIsoDate('2026-05-14T00:00:00.000Z') !== '2026-05-14T00:00:00.000Z'
    || clampScheduleCandleCount(9999, 'kraken_public') !== 720
    || filteredCandles.length !== 1
    || !syntheticCsv.startsWith('timestamp,open,high,low,close,volume')
    || syntheticCsv.split('\n').length !== 4
    || !candleCsv.includes('2026-05-14T00:00:00.000Z,1,2,1,2,10')
    || deduped[0].close !== 2
    || deduped[1].close !== 3
    || parsedCandles.length !== 3
    || parsedLine.close !== 111
    || streamingSummary.gapCount !== 1
    || streamingSummary.qualityScore !== 95
    || regime.trend !== 'bullish'
    || summary.candleCount !== 3
    || summary.gapCount !== 1
    || summary.qualityScore !== 95
    || normalizeBinanceSymbol('btc/usdt') !== 'BTCUSDT'
    || normalizeCoinbaseProduct('btc/usd') !== 'BTC-USD'
    || normalizeKrakenPair('BTC/USD') !== 'XBTUSD'
    || normalizeKrakenPair('ETH/USD', { krakenPair: 'eth/usd' }) !== 'ETHUSD'
    || toBinanceInterval('1h') !== '1h'
    || toCoinbaseGranularity('1h') !== 3600
    || toKrakenInterval('1h') !== 60
    || getProviderHealthDefaults({ provider_type: 'coinbase_public', settings_json: '{}' }).marketSymbol !== 'BTC-USD'
    || getProviderHealthDefaults({ provider_type: 'local_mock', settings_json: '{"defaultMarketSymbol":"ETH/USDT"}' }).marketSymbol !== 'ETH/USDT'
    || PUBLIC_MARKET_DATA_FETCH_TIMEOUT_MS !== 20000
    || fetchedJson.ok !== true
    || fetchedJson.url !== 'https://example.test/ok'
    || fetchReceivedAbortSignal !== true
    || !httpErrorMessage.includes('HTTP 503 Service Unavailable')
    || localProviderResult.source !== 'scheduled_local_mock'
    || localProviderResult.csvText.split('\n').length !== 4
    || !ccxtErrorMessage.includes('ccxt package is not wired')
  ) {
    fail('market data module did not parse provider/import rows');
  }

  pass('market data module');
}

async function checkMarketImportFilesModule() {
  const { pipeline } = require('stream/promises');
  const {
    createMarketImportFileRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/market-import-files'));
  const fixtureRoot = path.join(projectRoot, 'workspaces');
  fs.mkdirSync(fixtureRoot, { recursive: true });
  const uploadDir = fs.mkdtempSync(path.join(fixtureRoot, 'market-import-files-'));
  let ensureCount = 0;
  const loggedErrors = [];
  const runtime = createMarketImportFileRuntime({
    fs,
    path,
    pipeline,
    uploadDir,
    maxUploadBytes: 10,
    crypto: {
      randomUUID: () => 'fixture-uuid'
    },
    ensureUploadDir() {
      ensureCount += 1;
      fs.mkdirSync(uploadDir, { recursive: true });
    },
    logger: {
      error(message) {
        loggedErrors.push(message);
      }
    }
  });

  try {
    const destinationPath = runtime.createMarketImportUploadPath(7, 'candles.txt');
    const bytes = await runtime.saveMarketImportUpload((async function* uploadFixture() {
      yield Buffer.from('12345');
    }()), destinationPath);
    const resolved = runtime.resolveMarketImportUploadPath(destinationPath);
    let unsafePathError = '';
    let tooLargeError = '';
    let emptyUploadError = '';

    try {
      runtime.resolveMarketImportUploadPath(path.join(uploadDir, '../outside.csv'));
      fail('market import files module allowed an unsafe source path');
    } catch (error) {
      unsafePathError = error.message;
    }

    try {
      await runtime.saveMarketImportUpload((async function* tooLargeUpload() {
        yield Buffer.from('12345678901');
      }()), path.join(uploadDir, 'too-large.csv'));
      fail('market import files module allowed an oversized upload');
    } catch (error) {
      tooLargeError = error.message;
    }

    try {
      await runtime.saveMarketImportUpload((async function* emptyUpload() {})(), path.join(uploadDir, 'empty.csv'));
      fail('market import files module allowed an empty upload');
    } catch (error) {
      emptyUploadError = error.message;
    }

    await runtime.deleteMarketImportSourceFile(destinationPath);
    await runtime.deleteMarketImportSourceFile(destinationPath);

    if (
      ensureCount !== 1
      || !destinationPath.endsWith('.csv')
      || !destinationPath.includes('user-7')
      || bytes !== 5
      || resolved !== path.resolve(destinationPath)
      || fs.existsSync(destinationPath)
      || fs.existsSync(path.join(uploadDir, 'too-large.csv'))
      || fs.existsSync(path.join(uploadDir, 'empty.csv'))
      || !unsafePathError.includes('market-data upload folder')
      || !tooLargeError.includes('too large')
      || !emptyUploadError.includes('empty')
      || loggedErrors.length !== 0
    ) {
      fail('market import files module did not preserve upload path/file behavior');
    }
  } finally {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  }

  pass('market import files module');
}

async function checkMarketImportJobRuntimeModule() {
  const {
    createMarketImportJobRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/market-import-jobs'));
  const {
    parseOhlcvCsv,
    parseOhlcvCsvLine,
    createMarketDataSummary,
    createStreamingMarketDataSummaryTracker
  } = require(path.join(projectRoot, 'app/server/src/lib/market-data'));
  const jobs = new Map([
    [42, {
      id: 42,
      label: ' BTC import fixture ',
      market_symbol: ' btc-usd ',
      timeframe: '1h',
      source_payload: [
        'timestamp,open,high,low,close,volume',
        '2026-05-14T00:00:00.000Z,100,105,99,104,1000',
        '2026-05-14T01:00:00.000Z,104,110,103,109,1300',
        '2026-05-14T02:00:00.000Z,109,111,108,110,900'
      ].join('\n'),
      source_file_path: null,
      status: 'queued',
      cancel_requested: 0,
      notes: '  fixture notes  ',
      import_id: null
    }],
    [43, {
      id: 43,
      label: 'Cancel fixture',
      market_symbol: 'ETH-USD',
      timeframe: '1h',
      source_payload: null,
      source_file_path: '/tmp/cancel-fixture.csv',
      status: 'canceling',
      cancel_requested: 1,
      notes: '',
      import_id: 901
    }]
  ]);
  const dbRuns = [];
  const deletedFiles = [];
  let nextImportId = 900;
  const runtime = createMarketImportJobRuntime({
    fs,
    dbGet: async (query, params = []) => {
      if (query.includes('WHERE status IN')) {
        return null;
      }

      if (query.includes('SELECT status, cancel_requested')) {
        if (Number(params[0]) === 44) {
          return { status: 'canceling', cancel_requested: 1 };
        }

        return { status: 'running', cancel_requested: 0 };
      }

      if (query.includes('SELECT import_id FROM market_data_import_jobs')) {
        return { import_id: nextImportId };
      }

      if (query.includes('SELECT * FROM market_data_import_jobs WHERE id = ?')) {
        return jobs.get(Number(params[0])) || null;
      }

      return null;
    },
    dbRun: async (query, params = []) => {
      dbRuns.push({ query, params });

      if (query.includes('INSERT INTO market_data_imports')) {
        nextImportId += 1;
        return { lastID: nextImportId };
      }

      return { changes: 1 };
    },
    parseOhlcvCsv,
    parseOhlcvCsvLine,
    createMarketDataSummary,
    createStreamingMarketDataSummaryTracker,
    resolveMarketImportUploadPath: filePath => filePath,
    deleteMarketImportSourceFile: async filePath => {
      deletedFiles.push(filePath);
    },
    chunkSize: 2,
    setImmediateFn: callback => callback()
  });

  await runtime.processMarketDataImportJob(42);
  await runtime.processMarketDataImportJob(43);
  let canceledError = '';

  try {
    await runtime.throwIfMarketImportCanceled(44);
    fail('market import job runtime allowed canceled import state');
  } catch (error) {
    canceledError = error.message;
  }

  const scheduledCallbacks = [];
  const scheduledRuntime = createMarketImportJobRuntime({
    fs,
    dbGet: async query => (query.includes('WHERE status IN') ? null : {}),
    dbRun: async () => ({ changes: 1 }),
    parseOhlcvCsv,
    parseOhlcvCsvLine,
    createMarketDataSummary,
    createStreamingMarketDataSummaryTracker,
    resolveMarketImportUploadPath: filePath => filePath,
    deleteMarketImportSourceFile: async () => {},
    setImmediateFn(callback) {
      scheduledCallbacks.push(callback);
    }
  });

  scheduledRuntime.scheduleMarketImportWorker();
  scheduledRuntime.scheduleMarketImportWorker();
  await scheduledCallbacks[0]();

  const importInsert = dbRuns.find(run => run.query.includes('INSERT INTO market_data_imports'));
  const importFinalUpdate = dbRuns.find(run => run.query.includes("SET candle_count = ?, status = 'imported'"));
  const completedJobUpdate = dbRuns.find(run => run.query.includes("SET status = 'completed'"));
  const progressUpdates = dbRuns.filter(run => run.query.includes('SET processed_rows = ?'));
  const candleInserts = dbRuns.filter(run => run.query.includes('INSERT INTO market_candles'));
  const cancelJobUpdate = dbRuns.find(run => run.query.includes("SET status = 'canceled'"));

  if (
    !importInsert
    || importInsert.params[0] !== 'BTC import fixture'
    || importInsert.params[1] !== 'BTC-USD'
    || importInsert.params[2] !== '1h'
    || importInsert.params[3] !== 'manual_csv_background'
    || importInsert.params[7] !== 'fixture notes'
    || candleInserts.length !== 3
    || progressUpdates.map(run => run.params[0]).join(',') !== '2,3'
    || !importFinalUpdate
    || importFinalUpdate.params[0] !== 3
    || JSON.parse(importFinalUpdate.params[2]).candleCount !== 3
    || importFinalUpdate.params[3] !== nextImportId
    || !completedJobUpdate
    || completedJobUpdate.params[0] !== 3
    || completedJobUpdate.params[1] !== 3
    || completedJobUpdate.params[4] !== 42
    || !cancelJobUpdate
    || deletedFiles[0] !== '/tmp/cancel-fixture.csv'
    || !dbRuns.some(run => run.query.includes('DELETE FROM market_candles WHERE import_id = ?') && run.params[0] === 901)
    || !/Import canceled by owner/.test(canceledError)
    || scheduledCallbacks.length !== 1
  ) {
    fail('market import job runtime did not preserve queue/import/cancel behavior');
  }

  pass('market import job runtime module');
}

async function checkMarketImportDependenciesModule() {
  const {
    createMarketImportDependencyRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/market-import-dependencies'));
  const calls = [];
  const counts = [1, 2, 0, '3', null];
  const runtime = createMarketImportDependencyRuntime({
    async dbGet(query, params) {
      calls.push({ query, params });
      return { count: counts[calls.length - 1] };
    }
  });
  const count = await runtime.getMarketImportDependencyCount(41);
  const expectedTables = [
    'paper_trading_sessions',
    'strategy_optimization_sweeps',
    'strategy_split_tests',
    'strategy_walk_forward_tests',
    'trading_decision_logs'
  ];

  if (
    count !== 6
    || calls.length !== expectedTables.length
    || !expectedTables.every(table => calls.some(call => call.query.includes(table) && call.params[0] === 41))
  ) {
    fail('market import dependencies module did not preserve dependency count behavior');
  }

  pass('market import dependencies module');
}

async function checkMarketRefreshScheduleRuntimeModule() {
  const {
    createMarketRefreshScheduleRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/market-refresh-schedules'));
  const {
    clampScheduleCandleCount,
    getProviderCandleLimit,
    addMinutesToIso,
    parseMarketDataRefreshRun
  } = require(path.join(projectRoot, 'app/server/src/lib/market-data'));
  const schedules = new Map([
    [21, {
      id: 21,
      user_id: 1,
      provider_id: 31,
      label: 'BTC refresh',
      market_symbol: 'BTC-USD',
      timeframe: '1h',
      lookback_candles: 25,
      backfill_start_at: null,
      backfill_end_at: null,
      interval_minutes: 60,
      status: 'active',
      provider_label: 'Local Mock',
      provider_name: 'local',
      provider_type: 'local_mock',
      provider_status: 'active',
      settings_json: '{}'
    }],
    [22, {
      id: 22,
      user_id: 1,
      provider_id: 31,
      label: 'Disabled refresh',
      market_symbol: 'BTC-USD',
      timeframe: '1h',
      lookback_candles: 25,
      interval_minutes: 60,
      status: 'disabled',
      provider_label: 'Local Mock',
      provider_name: 'local',
      provider_type: 'local_mock',
      provider_status: 'active',
      settings_json: '{}'
    }],
    [23, {
      id: 23,
      user_id: 1,
      provider_id: 32,
      label: 'Inactive provider refresh',
      market_symbol: 'BTC-USD',
      timeframe: '1h',
      lookback_candles: 25,
      interval_minutes: 60,
      status: 'active',
      provider_label: 'Inactive',
      provider_name: 'inactive',
      provider_type: 'local_mock',
      provider_status: 'disabled',
      settings_json: '{}'
    }],
    [24, {
      id: 24,
      user_id: 1,
      provider_id: 31,
      label: 'Failing refresh',
      market_symbol: 'BTC-USD',
      timeframe: '1h',
      lookback_candles: 25,
      interval_minutes: 60,
      status: 'active',
      provider_label: 'Local Mock',
      provider_name: 'local',
      provider_type: 'local_mock',
      provider_status: 'active',
      settings_json: '{}'
    }]
  ]);
  const updates = [];
  const fetches = [];
  const logErrors = [];
  const immediateCallbacks = [];
  let importWorkerCount = 0;
  let nextRunId = 500;
  let nextImportJobId = 700;
  let dueRows = [];
  const runtime = createMarketRefreshScheduleRuntime({
    async dbGet(query, params = []) {
      if (query.includes('market_data_refresh_runs.*')) {
        const runId = Number(params[0]);

        return {
          id: runId,
          user_id: 1,
          schedule_id: 21,
          provider_id: 31,
          import_job_id: nextImportJobId,
          status: 'queued_import',
          trigger_type: 'manual',
          message: `Queued market-data import job #${nextImportJobId}.`,
          payload_json: '{"source":"local_mock"}',
          started_at: '2026-05-14T00:00:00.000Z',
          completed_at: '2026-05-14T00:00:01.000Z',
          created_at: '2026-05-14T00:00:00.000Z',
          schedule_label: 'BTC refresh',
          provider_label: 'Local Mock'
        };
      }

      if (query.includes('JOIN market_data_providers')) {
        return schedules.get(Number(params[0])) || null;
      }

      return null;
    },
    async dbAll(query) {
      updates.push({ query, params: [] });
      return dueRows;
    },
    async dbRun(query, params = []) {
      updates.push({ query, params });

      if (query.includes('INSERT INTO market_data_refresh_runs')) {
        nextRunId += 1;
        return { lastID: nextRunId };
      }

      if (query.includes('INSERT INTO market_data_import_jobs')) {
        nextImportJobId += 1;
        return { lastID: nextImportJobId };
      }

      return { changes: 1 };
    },
    async fetchProviderOhlcvCsv(schedule) {
      fetches.push(schedule.id);

      if (schedule.id === 24) {
        throw new Error('provider fetch failed');
      }

      return {
        source: 'local_mock',
        csvText: 'timestamp,open,high,low,close,volume\n2026-05-14T00:00:00.000Z,1,2,1,2,10'
      };
    },
    clampScheduleCandleCount,
    getProviderCandleLimit,
    addMinutesToIso,
    parseMarketDataRefreshRun,
    scheduleMarketImportWorker() {
      importWorkerCount += 1;
    },
    setImmediateFn(callback) {
      immediateCallbacks.push(callback);
    },
    logger: {
      error(message) {
        logErrors.push(message);
      }
    }
  });
  const success = await runtime.runMarketDataRefreshSchedule(21, 'manual');
  let disabledError = '';
  let inactiveProviderError = '';
  let fetchError = '';

  try {
    await runtime.runMarketDataRefreshSchedule(22, 'scheduled');
    fail('market refresh schedule runtime allowed disabled scheduled refresh');
  } catch (error) {
    disabledError = error.message;
  }

  try {
    await runtime.runMarketDataRefreshSchedule(23, 'manual');
    fail('market refresh schedule runtime allowed inactive provider');
  } catch (error) {
    inactiveProviderError = error.message;
  }

  try {
    await runtime.runMarketDataRefreshSchedule(24, 'manual');
    fail('market refresh schedule runtime swallowed provider fetch failure');
  } catch (error) {
    fetchError = error.message;
  }

  dueRows = [{ id: 21 }, { id: 24 }];
  await runtime.processDueMarketDataRefreshSchedules();
  dueRows = [];
  runtime.scheduleMarketRefreshWorker();
  runtime.scheduleMarketRefreshWorker();
  await immediateCallbacks[0]();
  runtime.scheduleMarketRefreshWorker();

  if (
    success.status !== 'queued_import'
    || success.provider_label !== 'Local Mock'
    || !fetches.includes(21)
    || !fetches.includes(24)
    || importWorkerCount < 2
    || !/not active/.test(disabledError)
    || !/provider is not active/.test(inactiveProviderError)
    || !/provider fetch failed/.test(fetchError)
    || !updates.some(update => update.query.includes('INSERT INTO market_data_refresh_runs') && update.params[4] === 'manual')
    || !updates.some(update => update.query.includes('INSERT INTO market_data_import_jobs') && update.params[4] === 'local_mock')
    || !updates.some(update => update.query.includes("SET status = 'queued_import'"))
    || !updates.some(update => update.query.includes("SET status = 'failed'") && update.params[0] === 'provider fetch failed')
    || !updates.some(update => update.query.includes('FROM market_data_refresh_schedules') && update.query.includes("status = 'active'"))
    || !logErrors.some(message => message.includes('Market data refresh schedule #24 failed'))
    || immediateCallbacks.length !== 2
  ) {
    fail('market refresh schedule runtime did not preserve refresh/worker behavior');
  }

  pass('market refresh schedule runtime module');
}

async function checkDevServerModule() {
  const {
    createDevServerRuntime,
    parseDevServerRun,
    parseDevServerLog
  } = require(path.join(projectRoot, 'app/server/src/lib/dev-server'));
  const run = parseDevServerRun({
    id: 41,
    pid: 12345,
    port: 3000,
    command: 'npm start',
    status: 'running',
    started_at: '2026-05-14T00:00:00.000Z',
    heartbeat_at: '2026-05-14T00:01:00.000Z',
    ended_at: null,
    note: 'fixture'
  });
  const log = parseDevServerLog({
    id: 42,
    run_id: 41,
    level: 'info',
    message: 'fixture log',
    metadata_json: '{"pid":12345}',
    created_at: '2026-05-14T00:01:00.000Z'
  });
  const dbRuns = [];
  const runtime = createDevServerRuntime({
    path,
    projectRoot: '/tmp/etherealai-project',
    serverFile: '/tmp/etherealai-project/app/server/src/server.js',
    port: 3000,
    startedAt: '2026-05-14T00:00:00.000Z',
    pid: 12345,
    env: {
      npm_lifecycle_event: 'start',
      NODE_ENV: 'test'
    },
    uptimeSeconds: () => 12,
    parseRun: parseDevServerRun,
    parseLog: parseDevServerLog,
    async dbRun(query, params) {
      dbRuns.push({ query, params });

      if (query.includes('INSERT INTO dev_server_runs')) {
        return { lastID: 501 };
      }

      return { changes: 1 };
    },
    async dbGet() {
      return {
        id: 501,
        pid: 12345,
        port: 3000,
        command: 'npm start',
        status: 'running',
        started_at: '2026-05-14T00:00:00.000Z',
        heartbeat_at: '2026-05-14T00:01:00.000Z',
        ended_at: null,
        note: 'fixture'
      };
    },
    async dbAll(query) {
      if (query.includes('dev_server_logs')) {
        return [
          {
            id: 601,
            run_id: 501,
            level: 'info',
            message: 'fixture status log',
            metadata_json: '{"ok":true}',
            created_at: '2026-05-14T00:01:00.000Z'
          }
        ];
      }

      return [
        {
          id: 501,
          pid: 12345,
          port: 3000,
          command: 'npm start',
          status: 'running',
          started_at: '2026-05-14T00:00:00.000Z',
          heartbeat_at: '2026-05-14T00:01:00.000Z',
          ended_at: null,
          note: 'fixture'
        }
      ];
    }
  });
  const command = runtime.getDevServerCommand();
  await runtime.recordDevServerStart();
  await runtime.updateDevServerHeartbeat();
  await runtime.recordDevServerLog('warn'.repeat(20), 'manual log', { ok: true });
  const status = await runtime.getDevServerStatus();

  if (
    run.pid !== 12345
    || run.port !== 3000
    || log.metadata?.pid !== 12345
    || log.message !== 'fixture log'
    || command !== 'npm start'
    || status.current.runId !== 501
    || status.current.environment !== 'test'
    || status.current.uptimeSeconds !== 12
    || status.latestRun.id !== 501
    || status.recentLogs[0].metadata.ok !== true
    || !dbRuns.some(item => item.query.includes("SET status = 'stale'"))
    || !dbRuns.some(item => item.query.includes('INSERT INTO dev_server_runs') && item.params[0] === 12345)
    || !dbRuns.some(item => item.query.includes('INSERT INTO dev_server_logs') && item.params[0] === 501)
    || !dbRuns.some(item => item.query.includes('UPDATE dev_server_runs') && item.params[1] === 501)
  ) {
    fail('dev server module did not parse run/log rows');
  }

  pass('dev server module');
}

function checkCreatorRecordsModule() {
  const {
    parseFileProposal,
    parseTask,
    parseChecklistItem
  } = require(path.join(projectRoot, 'app/server/src/lib/creator-records'));
  const proposal = parseFileProposal({
    id: 51,
    task_id: 52,
    workspace_id: 53,
    relative_path: 'src/index.js',
    action: 'upsert',
    current_content: 'old',
    proposed_content: 'new',
    status: 'pending',
    applied_at: null,
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  });
  const task = parseTask({
    id: 52,
    title: 'Creator fixture',
    category: 'app',
    request: 'fixture',
    status: 'planned',
    plan_json: '{"phases":["inspect"]}',
    model_role: 'planner',
    model_name: 'local',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  });
  const checklistItem = parseChecklistItem({
    id: 54,
    task_id: 52,
    label: 'Inspect files',
    status: 'done',
    position: 1,
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  });

  if (
    proposal.proposed_content !== 'new'
    || task.plan?.phases?.[0] !== 'inspect'
    || task.plan_json !== undefined
    || checklistItem.status !== 'done'
  ) {
    fail('creator records module did not parse file proposal/task/checklist rows');
  }

  pass('creator records module');
}

async function checkWorkspaceFilesModule() {
  const {
    safeRelativePath,
    resolveWorkspacePath,
    listWorkspaceEntries,
    readWorkspaceFile,
    collectWorkspaceContext,
    createWorkspaceRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/workspace-files'));
  const fixtureRoot = path.join(projectRoot, 'workspaces');
  fs.mkdirSync(fixtureRoot, { recursive: true });
  const workspacePath = fs.mkdtempSync(path.join(fixtureRoot, 'module-fixture-'));
  const workspace = { path: workspacePath };

  try {
    fs.mkdirSync(path.join(workspacePath, 'src'));
    fs.writeFileSync(path.join(workspacePath, 'README.md'), '# Fixture\n');
    fs.writeFileSync(path.join(workspacePath, 'src/index.js'), 'console.log("fixture");\n');

    const safePath = safeRelativePath('src/../README.md');
    const resolved = resolveWorkspacePath(workspace, 'src/index.js');
    const listing = listWorkspaceEntries(workspace, '');
    const file = readWorkspaceFile(workspace, 'src/index.js');
    const context = collectWorkspaceContext(workspace, { maxFiles: 3, maxTotalBytes: 2000 });
    const runtimeWorkspacesDir = path.join(workspacePath, 'runtime-workspaces');
    const runtime = createWorkspaceRuntime({
      fs,
      workspacesDir: runtimeWorkspacesDir,
      async dbGet(query, params) {
        if (params[0] === 7) {
          return {
            id: 7,
            name: 'Runtime Workspace',
            path: workspacePath,
            status: 'active'
          };
        }

        return null;
      }
    });
    runtime.ensureWorkspacesDir();
    const runtimeWorkspace = await runtime.getWorkspace(7);
    let missingWorkspaceError = '';

    try {
      safeRelativePath('../outside.js');
      fail('workspace files module allowed unsafe relative path');
    } catch (error) {
      if (!/approved workspace/.test(error.message)) {
        throw error;
      }
    }

    try {
      await runtime.getWorkspace(8);
      fail('workspace files runtime allowed a missing workspace');
    } catch (error) {
      missingWorkspaceError = error.message;
    }

    if (
      safePath !== 'README.md'
      || resolved.relativePath !== 'src/index.js'
      || !listing.entries.some(entry => entry.name === 'src' && entry.type === 'directory')
      || file.content !== 'console.log("fixture");\n'
      || context.fileCount < 2
      || !context.text.includes('README.md')
      || !context.text.includes('src/index.js')
      || !fs.existsSync(runtimeWorkspacesDir)
      || runtimeWorkspace.id !== 7
      || !/Workspace not found/.test(missingWorkspaceError)
    ) {
      fail('workspace files module did not preserve workspace file behavior');
    }
  } finally {
    fs.rmSync(workspacePath, { recursive: true, force: true });
  }

  pass('workspace files module');
}

function checkCreatorPromptsModule() {
  const {
    createStarterPlan,
    buildCreatorPlanningPrompt,
    buildFileProposalPrompt,
    buildMultiFileProposalPrompt,
    buildWorkspaceEditPrompt,
    normalizeWorkspaceEditPayload,
    extractGeneratedFileContent,
    parseJsonFromModelResponse,
    normalizeGeneratedFiles,
    buildChecklistPrompt,
    normalizeGeneratedChecklist
  } = require(path.join(projectRoot, 'app/server/src/lib/creator-prompts'));
  const task = {
    title: 'Creator prompt fixture',
    category: 'app',
    request: 'Build a local tool.',
    plan: {
      phases: ['inspect', 'edit']
    }
  };
  const workspace = {
    name: 'Fixture Workspace',
    path: '/tmp/fixture-workspace'
  };
  const starterPlan = createStarterPlan(task);
  const planningPrompt = buildCreatorPlanningPrompt(task);
  const filePrompt = buildFileProposalPrompt({
    task,
    workspace,
    relativePath: 'src/index.js',
    instruction: 'Update greeting.',
    currentContent: null,
    workspaceContext: { text: '--- README.md ---\nFixture' }
  });
  const multiPrompt = buildMultiFileProposalPrompt({
    task,
    workspace,
    instruction: 'Create files.',
    maxFiles: 2,
    workspaceContext: { text: 'context' }
  });
  const editPrompt = buildWorkspaceEditPrompt({
    task,
    workspace,
    goal: 'Improve UI.',
    maxFiles: 2,
    workspaceContext: { text: 'context' }
  });
  const extracted = extractGeneratedFileContent('```js\nconsole.log("ok");\n```');
  const parsedJson = parseJsonFromModelResponse('```json\n{"files":[{"relativePath":"src/index.js","content":"ok"}]}\n```');
  const generatedFiles = normalizeGeneratedFiles(parsedJson, 2);
  const editPayload = normalizeWorkspaceEditPayload({
    summary: 'Updated UI',
    verification: 'npm test',
    files: generatedFiles
  }, 2);
  const checklistPrompt = buildChecklistPrompt({ task, instruction: 'Next steps.', maxItems: 2 });
  const checklist = normalizeGeneratedChecklist({
    items: [' Inspect files ', { label: 'Run checks' }]
  }, 2);

  if (
    starterPlan.type !== 'starter-plan'
    || !planningPrompt.includes('Safety gates before execution')
    || !filePrompt.includes('Target relative path: src/index.js')
    || !multiPrompt.includes('Create no more than 2 files.')
    || !editPrompt.includes('Workspace edit goal:')
    || extracted !== 'console.log("ok");'
    || generatedFiles[0].relativePath !== 'src/index.js'
    || editPayload.summary !== 'Updated UI'
    || !checklistPrompt.includes('Required JSON schema:')
    || checklist.length !== 2
    || checklist[0] !== 'Inspect files'
  ) {
    fail('creator prompts module did not preserve prompt/normalization behavior');
  }

  pass('creator prompts module');
}

function checkCreatorScaffoldModule() {
  const {
    slugify,
    getScaffoldFilesForTask,
    prepareGeneratedProposalFiles
  } = require(path.join(projectRoot, 'app/server/src/lib/creator-scaffold'));
  const fixtureRoot = path.join(projectRoot, 'workspaces');
  fs.mkdirSync(fixtureRoot, { recursive: true });
  const workspacePath = fs.mkdtempSync(path.join(fixtureRoot, 'creator-scaffold-fixture-'));
  const workspace = { path: workspacePath };

  try {
    fs.mkdirSync(path.join(workspacePath, 'src'));
    fs.writeFileSync(path.join(workspacePath, 'src/index.js'), 'old content\n');

    const generalFiles = getScaffoldFilesForTask({
      title: 'My Local Tool!',
      category: 'general',
      request: 'Build it locally.'
    });
    const tradingFiles = getScaffoldFilesForTask({
      title: 'Trade Research',
      category: 'trading',
      request: 'Research only.'
    });
    const proposalFiles = prepareGeneratedProposalFiles(workspace, [
      { relativePath: 'src/index.js', content: 'new content\n' },
      { relativePath: 'README.md', content: '# New\n' }
    ]);

    try {
      prepareGeneratedProposalFiles(workspace, [
        { relativePath: 'README.md', content: 'one' },
        { relativePath: './README.md', content: 'two' }
      ]);
      fail('creator scaffold module allowed duplicate proposal paths');
    } catch (error) {
      if (!/Duplicate generated file path/.test(error.message)) {
        throw error;
      }
    }

    try {
      prepareGeneratedProposalFiles(workspace, [
        { relativePath: '../outside.md', content: 'unsafe' }
      ]);
      fail('creator scaffold module allowed unsafe proposal path');
    } catch (error) {
      if (!/approved workspace/.test(error.message)) {
        throw error;
      }
    }

    if (
      slugify(' My Local Tool! ') !== 'my-local-tool'
      || !generalFiles.some(file => file.relativePath === 'package.json' && file.content.includes('"name": "my-local-tool"'))
      || !tradingFiles.some(file => file.relativePath === 'src/backtest.js')
      || proposalFiles[0].safePath !== 'src/index.js'
      || proposalFiles[0].currentContent !== 'old content\n'
      || proposalFiles[1].currentContent !== null
      || proposalFiles[1].proposedContent !== '# New\n'
    ) {
      fail('creator scaffold module did not preserve scaffold/proposal preparation behavior');
    }
  } finally {
    fs.rmSync(workspacePath, { recursive: true, force: true });
  }

  pass('creator scaffold module');
}

function checkArtifactRowsModule() {
  const {
    ARTIFACT_TYPES,
    normalizeArtifactType,
    createArtifactRow,
    filterArtifactRows
  } = require(path.join(projectRoot, 'app/server/src/lib/artifact-rows'));
  const taskRow = createArtifactRow('task', {
    id: 61,
    title: 'Build local tool',
    category: 'app',
    status: 'planned',
    created_at: '2026-05-14T00:00:00.000Z'
  });
  const liveReviewRow = createArtifactRow('bot live enablement review', {
    id: 62,
    plan_id: 63,
    plan_name: 'Paper bot',
    status: 'blocked',
    created_at: '2026-05-14T00:00:00.000Z'
  });
  const marketImportRow = createArtifactRow('market import', {
    id: 64,
    label: 'BTC hourly',
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    summary: { candleCount: 100, qualityScore: 95 },
    candle_count: 100,
    quality_score: 95,
    created_at: '2026-05-14T00:00:00.000Z'
  });
  const filtered = filterArtifactRows([
    taskRow,
    liveReviewRow,
    marketImportRow
  ], 'paper bot');

  if (
    !ARTIFACT_TYPES.has('bot live enablement review')
    || normalizeArtifactType(' BOT LIVE ENABLEMENT REVIEW ') !== 'bot live enablement review'
    || normalizeArtifactType('not-real') !== 'all'
    || taskRow.href !== '/creator#artifact=task:61'
    || !taskRow.detail.includes('planned')
    || liveReviewRow.href !== '/strategy-lab#artifact=bot-live-enablement-review:62'
    || !liveReviewRow.detail.includes('live disabled')
    || marketImportRow.href !== '/strategy-lab#artifact=market-import:64'
    || !marketImportRow.detail.includes('quality 95')
    || filtered.length !== 1
    || filtered[0].id !== 62
  ) {
    fail('artifact rows module did not preserve artifact type/row/filter behavior');
  }

  pass('artifact rows module');
}

function checkSocialOpsModule() {
  const {
    parseSocialPost,
    reviewSocialContent
  } = require(path.join(projectRoot, 'app/server/src/lib/social-ops'));
  const parsed = parseSocialPost({
    id: 3,
    platform: 'x',
    account_label: 'EtherealAI',
    content: 'Local-only build update.',
    status: 'draft',
    scheduled_for: null,
    metadata_json: '{"review":{"status":"clean"}}',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  });
  const cleanReview = reviewSocialContent('Local research build update with no performance claim.');
  const flaggedReview = reviewSocialContent('Guaranteed 100x profits, buy now. Not financial advice.');
  const listingShortcutReview = reviewSocialContent('We can bribe CMC staff, fake volume, and spam CoinGecko for a guaranteed listing.');

  if (parsed.metadata?.review?.status !== 'clean' || parsed.platform !== 'x') {
    fail('social ops module did not parse social post metadata');
  }

  if (cleanReview.status !== 'clean' || cleanReview.flags.length !== 0) {
    fail('social ops module flagged clean social content');
  }

  if (
    flaggedReview.status !== 'review'
    || !flaggedReview.flags.some(flag => flag.id === 'investment_advice')
    || !flaggedReview.flags.some(flag => flag.id === 'performance_claim')
    || listingShortcutReview.status !== 'review'
    || !listingShortcutReview.flags.some(flag => flag.id === 'listing_evasion')
    || !listingShortcutReview.flags.some(flag => flag.id === 'manipulated_activity')
  ) {
    fail('social ops module did not flag risky social content');
  }

  pass('social ops module');
}

function checkRiskSafetyModule() {
  const {
    RISK_PROFILE_AUDIT_FIELDS,
    getPositiveNumber,
    parseRiskProfile,
    parseRiskProfileAuditEvent,
    parseOrderIntent,
    getRiskProfileChangedFields,
    evaluateOrderIntentRisk
  } = require(path.join(projectRoot, 'app/server/src/lib/risk-safety'));
  const parsedProfile = parseRiskProfile({
    id: 2,
    name: 'Parser Fixture',
    mode: 'paper',
    max_order_value: 100,
    max_position_value: 250,
    max_daily_loss: 40,
    max_open_trades: 3,
    kill_switch_enabled: 1,
    status: 'active',
    notes: 'fixture',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  });
  const parsedAuditEvent = parseRiskProfileAuditEvent({
    id: 8,
    risk_profile_id: 2,
    user_id: 1,
    event_type: 'updated',
    summary: 'Fixture update',
    before_json: '{"max_daily_loss":40}',
    after_json: '{"max_daily_loss":20}',
    metadata_json: '{"changedFields":["max_daily_loss"]}',
    created_at: '2026-05-14T00:00:00.000Z',
    risk_profile_name: 'Parser Fixture'
  });
  const parsedIntent = parseOrderIntent({
    id: 10,
    connector_id: 3,
    risk_profile_id: 2,
    strategy_id: 4,
    paper_session_id: 5,
    market_symbol: 'BTC-USD',
    side: 'buy',
    order_type: 'limit',
    quantity: 1.5,
    limit_price: 65000,
    status: 'draft',
    reason: 'fixture',
    payload_json: '{"mode":"draft_intent_v1"}',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    connector_label: 'Paper',
    exchange_name: 'binance',
    risk_profile_name: 'Parser Fixture',
    strategy_name: 'Breakout'
  });
  const beforeProfile = {
    name: 'Conservative',
    mode: 'paper',
    status: 'active',
    max_order_value: 100,
    max_position_value: 300,
    max_daily_loss: 50,
    max_open_trades: 2,
    kill_switch_enabled: false,
    notes: ''
  };
  const afterProfile = {
    ...beforeProfile,
    max_daily_loss: 25,
    kill_switch_enabled: true
  };
  const riskReview = evaluateOrderIntentRisk({
    id: 4,
    name: 'Conservative',
    mode: 'paper',
    status: 'active',
    max_order_value: 100,
    max_position_value: 300,
    max_daily_loss: 50,
    max_open_trades: 2,
    kill_switch_enabled: false
  }, {
    quantity: 2,
    limitPrice: 40,
    currentOpenTrades: 1,
    currentDailyLoss: 10
  });
  const blockedReview = evaluateOrderIntentRisk({
    id: 5,
    name: 'Emergency Stop',
    mode: 'paper',
    status: 'active',
    max_order_value: 100,
    max_position_value: 300,
    max_daily_loss: 50,
    max_open_trades: 2,
    kill_switch_enabled: true
  }, {
    quantity: 5,
    limitPrice: 40,
    currentOpenTrades: 2,
    currentDailyLoss: 75
  });

  if (
    parsedProfile.kill_switch_enabled !== true
    || parsedAuditEvent.metadata?.changedFields?.[0] !== 'max_daily_loss'
    || parsedIntent.payload?.mode !== 'draft_intent_v1'
  ) {
    fail('risk safety module did not parse risk/order rows');
  }

  if (
    getPositiveNumber('12.5', 0) !== 12.5
    || getPositiveNumber('-1', 7) !== 7
    || getPositiveNumber('bad', 9) !== 9
  ) {
    fail('risk safety module did not normalize positive numbers');
  }

  if (
    !RISK_PROFILE_AUDIT_FIELDS.includes('kill_switch_enabled')
    || getRiskProfileChangedFields(beforeProfile, afterProfile).join(',') !== 'max_daily_loss,kill_switch_enabled'
  ) {
    fail('risk safety module did not compute risk profile changed fields');
  }

  if (
    riskReview.status !== 'pass'
    || riskReview.estimatedNotionalValue !== 80
    || riskReview.failures.length !== 0
  ) {
    fail('risk safety module did not pass a valid draft order risk review');
  }

  if (
    blockedReview.status !== 'review'
    || !blockedReview.failures.includes('kill_switch')
    || !blockedReview.failures.includes('max_order_value')
    || !blockedReview.failures.includes('max_daily_loss')
    || !blockedReview.failures.includes('max_open_trades')
  ) {
    fail('risk safety module did not flag draft order risk failures');
  }

  pass('risk safety module');
}

function checkOrderIntentSimulatorModule() {
  const {
    normalizeCrossExchangeSimulationInput,
    normalizeTopRebalanceBatchInput,
    parseRebalanceCandidateCsv,
    parseArbitrageSimulationRun,
    parseRebalanceSimulationBatch,
    simulateCrossExchangeArbitrage,
    simulateTopRebalanceBatch
  } = require(path.join(projectRoot, 'app/server/src/lib/order-intent-simulator'));
  const input = normalizeCrossExchangeSimulationInput({
    marketSymbol: 'EAI/USDT',
    quantity: 10,
    minNetEdgePercent: 0.25,
    strategyType: 'top_200_rebalance',
    venueQuotes: [
      {
        venue: 'binance',
        venueType: 'cex',
        chain: 'centralized',
        price: 99,
        feePercent: 0.1,
        slippagePercent: 0.05,
        gasCost: 0,
        liquidityScore: 91
      },
      {
        venue: 'aerodrome',
        venueType: 'dex',
        chain: 'base',
        price: 101,
        feePercent: 0.3,
        slippagePercent: 0.1,
        gasCost: 0.5,
        liquidityScore: 70
      }
    ]
  });
  const simulation = simulateCrossExchangeArbitrage(input);
  const rebalanceInput = normalizeTopRebalanceBatchInput({
    name: 'Verifier top-200 rebalance batch',
    portfolioCapital: 10000,
    allocationPerCandidatePercent: 5,
    maxCandidates: 2,
    minDropPercent: 3,
    minNetEdgePercent: 0.25,
    candidates: [
      {
        marketSymbol: 'EAI/USDT',
        marketCapRank: 42,
        marketCapUsd: 850000000,
        priceChangePercent24h: -12.4,
        venueQuotes: input.venueQuotes
      },
      {
        marketSymbol: 'BTC/USDT',
        marketCapRank: 1,
        marketCapUsd: 1500000000000,
        priceChangePercent24h: -1.2,
        venueQuotes: input.venueQuotes
      }
    ]
  });
  const rebalanceCsv = [
    'marketSymbol,marketCapRank,marketCapUsd,priceChangePercent24h,priceChangePercent7d,venue,venueType,chain,price,feePercent,slippagePercent,gasCost,liquidityScore',
    'EAI/USDT,42,850000000,-12.4,-18.2,binance,cex,centralized,0.99,0.10,0.05,0,91',
    'EAI/USDT,42,850000000,-12.4,-18.2,aerodrome,dex,base,1.01,0.30,0.10,0.05,70'
  ].join('\n');
  const csvCandidates = parseRebalanceCandidateCsv(rebalanceCsv);
  const rebalanceInputFromCsv = normalizeTopRebalanceBatchInput({
    name: 'Verifier CSV top-200 rebalance batch',
    portfolioCapital: 10000,
    allocationPerCandidatePercent: 5,
    maxCandidates: 2,
    minDropPercent: 3,
    minNetEdgePercent: 0.25,
    candidateCsv: rebalanceCsv
  });
  const rebalanceBatch = simulateTopRebalanceBatch(rebalanceInput);
  const parsedRun = parseArbitrageSimulationRun({
    id: 33,
    user_id: 1,
    market_symbol: simulation.marketSymbol,
    strategy_type: simulation.strategyType,
    status: simulation.status,
    input_json: JSON.stringify(input),
    result_json: JSON.stringify(simulation),
    local_only: 1,
    network_calls_enabled: 0,
    live_execution_enabled: 0,
    created_at: '2026-05-18T00:00:00.000Z',
    updated_at: '2026-05-18T00:00:00.000Z'
  });
  const parsedRebalanceBatch = parseRebalanceSimulationBatch({
    id: 44,
    user_id: 1,
    token_ecosystem_project_id: null,
    name: rebalanceBatch.name,
    strategy_type: rebalanceBatch.strategyType,
    status: rebalanceBatch.status,
    input_json: JSON.stringify(rebalanceInput),
    result_json: JSON.stringify(rebalanceBatch),
    local_only: 1,
    network_calls_enabled: 0,
    live_execution_enabled: 0,
    created_at: '2026-05-18T00:00:00.000Z',
    updated_at: '2026-05-18T00:00:00.000Z'
  });

  if (
    input.marketSymbol !== 'EAI/USDT'
    || input.venueQuotes.length !== 2
    || simulation.safetyBoundary?.liveExecutionEnabled !== false
    || simulation.safetyBoundary?.networkCallsEnabled !== false
    || simulation.safetyBoundary?.credentialLoadingEnabled !== false
    || simulation.bestEntry?.venue !== 'binance'
    || simulation.bestExit?.venue !== 'aerodrome'
    || simulation.economics?.estimatedNetProfit <= 0
    || simulation.recommendedDraftIntents?.length !== 2
    || !simulation.blockingFailures?.includes('live_order_endpoint_enabled')
    || parsedRun.localOnly !== true
    || parsedRun.networkCallsEnabled !== false
    || parsedRun.liveExecutionEnabled !== false
    || parsedRun.result?.recommendedDraftIntents?.length !== 2
    || rebalanceInput.candidates.length !== 2
    || rebalanceBatch.safetyBoundary?.liveExecutionEnabled !== false
    || rebalanceBatch.safetyBoundary?.networkCallsEnabled !== false
    || rebalanceBatch.summary?.selectedCount !== 1
    || rebalanceBatch.summary?.paperCandidateCount !== 1
    || rebalanceBatch.recommendedDraftIntentGroups?.length !== 1
    || rebalanceBatch.recommendedDraftIntentGroups?.[0]?.draftIntents?.length !== 2
    || csvCandidates.length !== 1
    || csvCandidates[0].venueQuotes.length !== 2
    || rebalanceInputFromCsv.candidates.length !== 1
    || rebalanceInputFromCsv.candidates[0].marketSymbol !== 'EAI/USDT'
    || parsedRebalanceBatch.localOnly !== true
    || parsedRebalanceBatch.networkCallsEnabled !== false
    || parsedRebalanceBatch.liveExecutionEnabled !== false
    || parsedRebalanceBatch.result?.summary?.paperCandidateCount !== 1
  ) {
    fail('order intent simulator module did not preserve local-only arbitrage/rebalance route math');
  }

  try {
    normalizeCrossExchangeSimulationInput({
      marketSymbol: 'EAI/USDT',
      quantity: 1,
      apiKey: `sk-${'a'.repeat(40)}`
    });
    fail('order intent simulator accepted a secret-like payload');
  } catch (error) {
    if (!/cannot store private keys/i.test(error.message)) {
      fail('order intent simulator rejected with an unexpected error');
    }
  }

  try {
    normalizeTopRebalanceBatchInput({
      candidates: [{ marketSymbol: 'EAI/USDT', password: 'not-allowed' }]
    });
    fail('order intent simulator accepted a secret-like rebalance payload');
  } catch (error) {
    if (!/cannot store private keys/i.test(error.message)) {
      fail('order intent simulator rejected rebalance payload with an unexpected error');
    }
  }

  pass('order intent simulator module');
}

async function checkRiskProfileActionsModule() {
  const {
    createRiskProfileActionsRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/risk-profile-actions'));
  const {
    parseBotAutomationPlan
  } = require(path.join(projectRoot, 'app/server/src/lib/bot-automation'));
  const dbRuns = [];
  const dbAllCalls = [];
  const readinessContexts = [];
  const readiness = {
    status: 'ready_for_paper',
    liveExecution: {
      enabled: false
    },
    blockingFailures: []
  };
  const planRow = {
    id: 301,
    strategy_id: 21,
    paper_session_id: 31,
    risk_profile_id: 77,
    connector_id: 41,
    name: 'Risk-linked Paper Bot',
    mode: 'paper',
    status: 'needs_review',
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    readiness_json: '{}',
    notes: 'fixture',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    strategy_name: 'Breakout',
    paper_session_name: 'Replay',
    risk_profile_name: 'Conservative',
    connector_label: 'Paper',
    exchange_name: 'binance',
    connector_mode: 'paper',
    connector_status: 'configured'
  };
  const runtime = createRiskProfileActionsRuntime({
    async dbAll(query, params) {
      dbAllCalls.push({ query, params });
      return [planRow];
    },
    async dbRun(query, params) {
      dbRuns.push({ query, params });
      return { changes: 1 };
    },
    parseBotAutomationPlan,
    async loadBotAutomationReadinessContext(strategyId, riskProfileId, paperSessionId, connectorId) {
      readinessContexts.push({ strategyId, riskProfileId, paperSessionId, connectorId });
      return {
        strategy: { id: strategyId, market_symbol: 'BTC-USD', timeframe: '1h' },
        riskProfile: { id: riskProfileId, status: 'active', mode: 'paper' },
        paperSession: { id: paperSessionId, strategy_id: strategyId },
        connector: { id: connectorId, mode: 'paper', status: 'configured' }
      };
    },
    evaluateBotAutomationReadiness(context) {
      if (context.mode !== 'paper' || context.strategy.id !== 21 || context.riskProfile.id !== 77) {
        fail('risk profile actions module passed the wrong readiness context');
      }

      return readiness;
    },
    async getBotAutomationPlanRow(id) {
      return {
        ...planRow,
        id,
        status: readiness.status,
        readiness_json: JSON.stringify(readiness)
      };
    },
    botAutomationPlanSelect: 'SELECT bot_automation_plans.* FROM bot_automation_plans'
  });

  await runtime.saveRiskProfileAuditEvent({
    riskProfileId: 77,
    userId: 9,
    eventType: 'updated',
    summary: 'Fixture risk profile update',
    beforeProfile: { max_daily_loss: 50 },
    afterProfile: { max_daily_loss: 25 },
    metadata: { changedFields: ['max_daily_loss'] }
  });
  const updatedPlans = await runtime.refreshBotPlansForRiskProfile(77);
  const auditInsert = dbRuns.find(run => run.query.includes('INSERT INTO risk_profile_audit_events'));
  const planUpdate = dbRuns.find(run => run.query.includes('UPDATE bot_automation_plans'));

  if (
    !auditInsert
    || auditInsert.params[0] !== 77
    || auditInsert.params[1] !== 9
    || auditInsert.params[2] !== 'updated'
    || JSON.parse(auditInsert.params[4]).max_daily_loss !== 50
    || JSON.parse(auditInsert.params[5]).max_daily_loss !== 25
    || JSON.parse(auditInsert.params[6]).changedFields[0] !== 'max_daily_loss'
  ) {
    fail('risk profile actions module did not persist audit event JSON');
  }

  if (
    dbAllCalls.length !== 1
    || !dbAllCalls[0].query.includes('bot_automation_plans.risk_profile_id = ?')
    || !dbAllCalls[0].query.includes("bot_automation_plans.status != 'archived'")
    || dbAllCalls[0].params[0] !== 77
    || readinessContexts[0].strategyId !== 21
    || readinessContexts[0].riskProfileId !== 77
    || readinessContexts[0].paperSessionId !== 31
    || readinessContexts[0].connectorId !== 41
    || !planUpdate
    || planUpdate.params[0] !== 'ready_for_paper'
    || JSON.parse(planUpdate.params[1]).liveExecution.enabled !== false
    || planUpdate.params[2] !== 301
    || updatedPlans.length !== 1
    || updatedPlans[0].status !== 'ready_for_paper'
    || updatedPlans[0].readiness.liveExecution.enabled !== false
  ) {
    fail('risk profile actions module did not refresh linked bot plan readiness');
  }

  pass('risk profile actions module');
}

function checkSolidityLabModule() {
  const {
    parseSolidityContractSpec,
    buildSolidityStarter,
    reviewSoliditySource
  } = require(path.join(projectRoot, 'app/server/src/lib/solidity-lab'));
  const {
    buildTokenEcosystemCatalog,
    buildTokenEcosystemBlueprint,
    buildMultiChainTokenBuildPlan,
    buildPolygonOperatingProfile,
    buildCompliantListingApplicationPlan,
    buildCommunityOperationsPlan,
    buildTokenEcosystemProjectBlueprint,
    buildTokenEcosystemWorkspaceFiles,
    normalizeTokenEcosystemProjectInput,
    parseTokenEcosystemProject
  } = require(path.join(projectRoot, 'app/server/src/lib/token-ecosystem'));
  const spec = parseSolidityContractSpec({
    id: 9,
    name: 'Local Token',
    contract_type: 'erc20',
    network: 'local',
    solidity_version: '0.8.24',
    features: 'mint initial supply',
    risk_notes: 'Draft only.',
    status: 'draft',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  });
  const source = buildSolidityStarter(spec);
  const review = reviewSoliditySource(spec, source);
  const cardanoSource = buildSolidityStarter({
    ...spec,
    contract_type: 'cardano-native-asset',
    network: 'cardano'
  });
  const cardanoReview = reviewSoliditySource({
    ...spec,
    contract_type: 'cardano-native-asset',
    network: 'cardano'
  }, cardanoSource);
  const catalog = buildTokenEcosystemCatalog();
  const blueprint = buildTokenEcosystemBlueprint({
    ...spec,
    network: 'solana',
    features: 'passive income NFT upgrade cross-chain arbitrage Discord Telegram YouTube Medium website whitepaper node economics',
    risk_notes: 'Draft only. No live deploy.'
  });
  const polygonBuildPlan = buildMultiChainTokenBuildPlan({
    ...spec,
    network: 'polygon'
  });
  const polygonOperatingProfile = buildPolygonOperatingProfile({
    ...spec,
    network: 'polygon'
  });
  const polygonBlueprint = buildTokenEcosystemBlueprint({
    ...spec,
    network: 'polygon',
    features: 'Polygon CoinMarketCap CoinGecko Discord Telegram YouTube Medium website whitepaper top 200 rebalance arbitrage'
  });
  const listingApplicationPlan = buildCompliantListingApplicationPlan({
    ...spec,
    network: 'polygon'
  });
  const communityOperations = buildCommunityOperationsPlan({
    ...spec,
    name: 'Polygon Fixture'
  });
  const cardanoBuildPlan = buildMultiChainTokenBuildPlan({
    ...spec,
    contract_type: 'cardano-native-asset',
    network: 'cardano'
  });
  const algorandProjectInput = normalizeTokenEcosystemProjectInput({
    name: 'Algorand Fixture Ecosystem',
    targetChain: 'algorand',
    contractType: 'algorand-asa',
    featureSelections: ['website, roadmap, logo, and whitepaper generation']
  });
  const tokenProjectInput = normalizeTokenEcosystemProjectInput({
    name: 'EtherealAI Fixture Ecosystem',
    targetChain: 'base',
    contractType: 'erc20',
    featureSelections: [
      'passive income reward model',
      'NFT utility upgrades for profitability and access tiers',
      'top 200 market cap rebalancing bot use case',
      'arbitrage-aware strategy design',
      'website, roadmap, logo, and whitepaper generation'
    ],
    nftUtilityNotes: 'NFT tiers unlock capped utility modules.',
    ecosystemNotes: 'Local-only verifier project.'
  });
  const tokenProjectBlueprint = buildTokenEcosystemProjectBlueprint(tokenProjectInput);
  const tokenProjectWorkspaceFiles = buildTokenEcosystemWorkspaceFiles({
    id: 77,
    ...tokenProjectInput,
    blueprint: tokenProjectBlueprint
  });
  const parsedTokenProject = parseTokenEcosystemProject({
    id: 77,
    user_id: 3,
    contract_spec_id: null,
    name: tokenProjectInput.name,
    target_chain: tokenProjectInput.targetChain,
    contract_type: tokenProjectInput.contractType,
    feature_selections_json: JSON.stringify(tokenProjectInput.featureSelections),
    nft_utility_notes: tokenProjectInput.nftUtilityNotes,
    ecosystem_notes: tokenProjectInput.ecosystemNotes,
    status: 'draft',
    blueprint_json: JSON.stringify(tokenProjectBlueprint),
    local_only: 1,
    external_actions_enabled: 0,
    created_at: '2026-05-17T00:00:00.000Z',
    updated_at: '2026-05-17T00:00:00.000Z'
  });

  if (spec.contract_type !== 'erc20' || spec.name !== 'Local Token') {
    fail('solidity lab module did not parse contract spec rows');
  }

  if (!source.includes('contract LocalToken is ERC20, Ownable') || !source.includes('Draft only')) {
    fail('solidity lab module did not generate expected ERC20 starter source');
  }

  if (
    review.status !== 'pass'
    || !review.checks.some(check => check.id === 'erc20_import' && check.passed === true)
    || !/Compile, test, static analysis, and audit/.test(review.note)
    || !cardanoSource.includes('chain-specific token plan')
    || !cardanoSource.includes('Cardano native asset')
    || cardanoReview.status !== 'planning'
  ) {
    fail('solidity lab module did not preserve template review behavior');
  }

  if (
    catalog.chains?.length < 30
    || !catalog.recommendedLowFeeChains?.some(chain => chain.id === 'base')
    || !catalog.recommendedLowFeeChains?.some(chain => chain.id === 'polygon')
    || !catalog.recommendedLowFeeChains?.some(chain => chain.id === 'bnb-chain')
    || !catalog.recommendedLowFeeChains?.some(chain => chain.id === 'avalanche')
    || !catalog.recommendedLowFeeChains?.some(chain => chain.id === 'solana')
    || !catalog.chains?.some(chain => chain.id === 'cardano')
    || !catalog.chains?.some(chain => chain.id === 'algorand')
    || !catalog.chains?.some(chain => chain.id === 'stellar')
    || !catalog.chains?.some(chain => chain.id === 'xrp-ledger')
    || !catalog.chains?.some(chain => chain.id === 'hedera')
    || !catalog.chains?.some(chain => chain.id === 'tezos')
    || !catalog.chains?.some(chain => chain.id === 'flow')
    || !catalog.chains?.some(chain => chain.id === 'ton')
    || !catalog.chains?.some(chain => chain.id === 'linea')
    || !catalog.chains?.some(chain => chain.id === 'scroll')
    || !catalog.chains?.some(chain => chain.id === 'zksync-era')
    || !catalog.chains?.some(chain => chain.id === 'mantle')
    || !catalog.chains?.some(chain => chain.id === 'opbnb')
    || !catalog.chains?.some(chain => chain.id === 'injective')
    || !catalog.chains?.some(chain => chain.id === 'osmosis')
    || !catalog.tokenContractTypes?.includes('spl-token')
    || !catalog.tokenContractTypes?.includes('cardano-native-asset')
    || !catalog.tokenContractTypes?.includes('algorand-asa')
    || !catalog.tokenContractTypes?.includes('hedera-hts')
    || !catalog.socialChannels?.some(channel => channel.id === 'discord')
    || !catalog.socialChannels?.some(channel => channel.id === 'medium')
    || !catalog.listingSources?.some(sourceItem => sourceItem.platform === 'CoinMarketCap')
    || !catalog.listingSources?.some(sourceItem => sourceItem.platform === 'CoinGecko')
    || catalog.polygonOperatingProfile?.chain?.chainId !== 137
    || !catalog.polygonOperatingProfile?.trading?.dexRouteFocus?.includes('QuickSwap')
    || !catalog.listingApplicationPlan?.platformPackets?.some(packet => packet.platform === 'CoinMarketCap')
    || !catalog.communityOperations?.operatingRoles?.some(role => role.id === 'moderator')
    || blueprint.status !== 'local_blueprint_only'
    || blueprint.safetyBoundary?.deploymentEnabled !== false
    || blueprint.safetyBoundary?.externalPostingEnabled !== false
    || blueprint.safetyBoundary?.liveTradingEnabled !== false
    || blueprint.multiChainTokenBuild?.selectedChain?.id !== 'solana'
    || blueprint.multiChainTokenBuild?.standardPlan?.implementationLane !== 'solana_spl'
    || !blueprint.multiChainTokenBuild?.blockedActions?.includes('no wallet/private-key collection')
    || polygonBuildPlan.selectedChain?.id !== 'polygon'
    || polygonBuildPlan.standardPlan?.implementationLane !== 'evm_solidity'
    || !/OpenZeppelin/.test(polygonBuildPlan.standardPlan?.starterScaffold || '')
    || polygonOperatingProfile.status !== 'primary_polygon_ready'
    || polygonOperatingProfile.chain?.chainId !== 137
    || !polygonOperatingProfile.walletOps?.permissionScopes?.includes('owner_review_required_for_signing')
    || polygonBlueprint.polygonOperatingProfile?.status !== 'primary_polygon_ready'
    || polygonBlueprint.listingApplicationPlan?.status !== 'owner_review_required'
    || !polygonBlueprint.communityOperations?.operatingRoles?.some(role => role.id === 'announcements_manager')
    || !listingApplicationPlan.prohibitedShortcuts?.some(item => /bribery/i.test(item))
    || !listingApplicationPlan.platformPackets?.some(packet => packet.platform === 'CoinGecko')
    || !communityOperations.moderationRules?.some(rule => /impersonation/i.test(rule))
    || cardanoBuildPlan.selectedChain?.id !== 'cardano'
    || cardanoBuildPlan.standardPlan?.implementationLane !== 'cardano_native_asset'
    || algorandProjectInput.targetChain !== 'algorand'
    || algorandProjectInput.contractType !== 'algorand-asa'
    || blueprint.featureFlags?.passiveIncome !== true
    || blueprint.featureFlags?.nftUtility !== true
    || blueprint.featureFlags?.crossChain !== true
    || blueprint.featureFlags?.nodeEconomics !== true
    || !blueprint.website?.pages?.some(page => page.id === 'dapp')
    || !blueprint.whitepaper?.draft?.tokenMechanics?.length
    || !blueprint.logo?.prompts?.length
    || !blueprint.listingReadiness?.checklist?.some(item => item.id === 'no_spam_no_bribes')
    || !blueprint.crossChainArbitrage?.requiredSafetyGates?.includes('no wallet private keys in EtherealAI')
    || tokenProjectInput.targetChain !== 'base'
    || tokenProjectInput.localOnly !== true
    || tokenProjectInput.externalActionsEnabled !== false
    || tokenProjectBlueprint.project?.externalActionsEnabled !== false
    || tokenProjectBlueprint.safetyBoundary?.deploymentEnabled !== false
    || tokenProjectBlueprint.safetyBoundary?.externalPostingEnabled !== false
    || !tokenProjectBlueprint.project?.featureSelections?.includes('arbitrage-aware strategy design')
    || !tokenProjectWorkspaceFiles.some(file => file.relativePath === 'website/SITE_MAP.md')
    || !tokenProjectWorkspaceFiles.some(file => file.relativePath === 'website/CLOUDFLARE_DEPLOYMENT_PLAN.md')
    || !tokenProjectWorkspaceFiles.some(file => file.relativePath === 'whitepaper/WHITEPAPER_DRAFT.md')
    || !tokenProjectWorkspaceFiles.some(file => file.relativePath === 'polygon/POLYGON_OPERATING_PROFILE.md')
    || !tokenProjectWorkspaceFiles.some(file => file.relativePath === 'listing/CMC_CG_APPLICATION_PLAN.md')
    || !tokenProjectWorkspaceFiles.some(file => file.relativePath === 'community/COMMUNITY_OPERATIONS_RUNBOOK.md')
    || !tokenProjectWorkspaceFiles.some(file => file.relativePath === 'automation/CROSS_CHAIN_ARBITRAGE_DESIGN.md')
    || !tokenProjectWorkspaceFiles.every(file => file.content.includes('No wallet private keys') || file.relativePath !== 'README.md')
    || parsedTokenProject.localOnly !== true
    || parsedTokenProject.externalActionsEnabled !== false
    || parsedTokenProject.blueprint?.project?.externalActionsEnabled !== false
  ) {
    fail('token ecosystem blueprint did not preserve local-only token/social/listing/node/arbitrage planning behavior');
  }

  try {
    normalizeTokenEcosystemProjectInput({
      name: 'Unsafe Fixture',
      targetChain: 'base',
      apiKey: `sk-${'a'.repeat(40)}`
    });
    fail('token ecosystem project input accepted a secret-like payload');
  } catch (error) {
    if (!/cannot store private keys/i.test(error.message)) {
      fail('token ecosystem project input rejected with an unexpected error');
    }
  }

  pass('solidity lab module');
}

function checkBotAutomationModule() {
  const {
    getPaperRiskGateStatus,
    evaluateBotAutomationReadiness,
    evaluateBotLiveReadiness,
    parseOwnerGoLiveCommand,
    createBotLiveEnablementReviewPayload,
    buildBotAutomationCapabilityPath,
    parseBotAutomationPlan,
    parseBotAutomationRun,
    parseBotLiveReadinessEvent,
    parseBotLiveEnablementReview,
    parseBotAutomationSchedule
  } = require(path.join(projectRoot, 'app/server/src/lib/bot-automation'));
  const plan = parseBotAutomationPlan({
    id: 1,
    strategy_id: 2,
    paper_session_id: 3,
    risk_profile_id: 4,
    connector_id: 5,
    name: 'Paper Bot',
    mode: 'paper',
    status: 'ready_for_paper',
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    readiness_json: '{"status":"ready_for_paper","liveExecution":{"enabled":false}}',
    notes: 'fixture',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    strategy_name: 'Breakout',
    paper_session_name: 'Replay',
    risk_profile_name: 'Conservative',
    connector_label: 'Paper',
    exchange_name: 'binance',
    connector_mode: 'paper',
    connector_status: 'configured'
  });
  const run = parseBotAutomationRun({
    id: 6,
    plan_id: 1,
    strategy_id: 2,
    market_data_import_id: 7,
    mode: 'paper',
    status: 'completed',
    decision: 'hold',
    result_json: '{"decision":"hold"}',
    created_at: '2026-05-14T00:00:00.000Z',
    plan_name: 'Paper Bot',
    strategy_name: 'Breakout',
    market_import_label: 'BTC import'
  });
  const readinessEvent = parseBotLiveReadinessEvent({
    id: 8,
    plan_id: 1,
    user_id: 1,
    status: 'blocked',
    readiness_json: '{"liveExecution":{"enabled":false}}',
    created_at: '2026-05-14T00:00:00.000Z',
    plan_name: 'Paper Bot',
    strategy_id: 2,
    strategy_name: 'Breakout',
    market_symbol: 'BTC-USD',
    timeframe: '1h'
  });
  const review = parseBotLiveEnablementReview({
    id: 9,
    plan_id: 1,
    user_id: 1,
    status: 'blocked',
    review_json: '{"liveExecution":{"goLiveAllowed":false}}',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    plan_name: 'Paper Bot',
    strategy_id: 2,
    strategy_name: 'Breakout',
    market_symbol: 'BTC-USD',
    timeframe: '1h'
  });
  const schedule = parseBotAutomationSchedule({
    id: 10,
    plan_id: 1,
    interval_minutes: 15,
    status: 'active',
    settings_json: '{"positionOpen":false}',
    last_run_id: 6,
    last_run_at: '2026-05-14T00:00:00.000Z',
    next_run_at: '2026-05-14T00:15:00.000Z',
    last_error: null,
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    plan_name: 'Paper Bot',
    strategy_id: 2,
    strategy_name: 'Breakout',
    market_symbol: 'BTC-USD',
    timeframe: '1h'
  });
  const strategy = { id: 2, market_symbol: 'BTC-USD', timeframe: '1h' };
  const riskProfile = {
    id: 4,
    status: 'active',
    mode: 'live_disabled',
    max_order_value: 100,
    max_position_value: 500,
    max_daily_loss: 50,
    max_open_trades: 2,
    kill_switch_enabled: false
  };
  const paperSession = {
    id: 3,
    strategy_id: 2,
    result: {
      riskGate: {
        status: 'passed'
      }
    }
  };
  const connector = {
    id: 5,
    label: 'Paper Connector',
    exchange_name: 'binance',
    mode: 'live_disabled',
    status: 'configured',
    settings: {
      sandbox: true
    },
    secret_storage_note: 'metadata only',
    secret_reference_id: 11,
    secret_reference_status: 'configured',
    secret_reference_provider_type: 'macos_keychain',
    secret_reference_scope: 'exchange_connector'
  };
  const paperReadiness = evaluateBotAutomationReadiness({
    strategy,
    riskProfile,
    paperSession,
    mode: 'paper'
  });
  const liveReadiness = evaluateBotLiveReadiness({
    plan,
    strategy,
    riskProfile,
    paperSession,
    connector
  });
  const ownerCommand = parseOwnerGoLiveCommand('The final bot is ready to go live and execute automatically.');
  const blockedReviewPayload = createBotLiveEnablementReviewPayload({
    plan,
    readiness: liveReadiness
  });
  const capabilityPath = buildBotAutomationCapabilityPath({
    plans: [plan],
    runs: [run],
    schedules: [schedule]
  });

  if (
    plan.readiness?.liveExecution?.enabled !== false
    || run.result?.decision !== 'hold'
    || readinessEvent.readiness?.liveExecution?.enabled !== false
    || review.review?.liveExecution?.goLiveAllowed !== false
    || schedule.settings?.positionOpen !== false
  ) {
    fail('bot automation module did not parse bot JSON payloads');
  }

  if (
    getPaperRiskGateStatus(paperSession) !== 'passed'
    || paperReadiness.status !== 'ready_for_paper'
    || paperReadiness.liveExecution.enabled !== false
    || liveReadiness.status !== 'blocked'
    || liveReadiness.liveExecution.enabled !== false
    || !liveReadiness.blockingFailures.includes('owner_go_live_confirmation')
    || !ownerCommand.recognized
    || ownerCommand.acceptedForExecution !== false
    || ownerCommand.liveExecution.goLiveAllowed !== false
    || blockedReviewPayload.liveExecution.goLiveAllowed !== false
    || !blockedReviewPayload.blockingFailures.includes('credential_validation_not_implemented')
    || capabilityPath.status !== 'paper_automation_active'
    || capabilityPath.paperAutomation.canRunAutomatically !== true
    || capabilityPath.paperAutomation.counts.readyPaperPlans !== 1
    || capabilityPath.paperAutomation.latestRun.id !== 6
    || capabilityPath.futureLiveAutomation.enabled !== false
    || capabilityPath.futureLiveAutomation.goLiveAllowed !== false
    || !capabilityPath.futureLiveAutomation.blockedGates.includes('live_order_endpoint_enabled')
  ) {
    fail('bot automation module did not preserve readiness/go-live safety behavior');
  }

  pass('bot automation module');
}

async function checkBotAutomationActionsRuntimeModule() {
  const {
    createBotAutomationActionsRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/bot-automation-actions'));
  const {
    parseStrategy,
    parsePaperSession
  } = require(path.join(projectRoot, 'app/server/src/lib/strategy-research'));
  const {
    parseRiskProfile
  } = require(path.join(projectRoot, 'app/server/src/lib/risk-safety'));
  const {
    parseExchangeConnector
  } = require(path.join(projectRoot, 'app/server/src/lib/exchange-metadata'));
  const {
    evaluateBotAutomationReadiness,
    parseBotAutomationPlan,
    parseBotAutomationRun
  } = require(path.join(projectRoot, 'app/server/src/lib/bot-automation'));
  const dbRuns = [];
  const dbAllCalls = [];
  const payloadCalls = [];
  const strategyRow = {
    id: 21,
    name: 'Breakout',
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    entry_rules: 'close > open',
    exit_rules: 'close < open',
    stop_loss: 2,
    take_profit: 4,
    risk_notes: 'fixture',
    status: 'research',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  };
  const riskProfileRow = {
    id: 31,
    name: 'Paper Risk',
    mode: 'paper',
    max_order_value: 100,
    max_position_value: 500,
    max_daily_loss: 50,
    max_open_trades: 2,
    kill_switch_enabled: 0,
    status: 'active',
    notes: 'fixture',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  };
  const paperSessionRow = {
    id: 41,
    strategy_id: 21,
    market_data_import_id: 71,
    name: 'Replay',
    mode: 'paper',
    status: 'completed',
    initial_capital: 10000,
    current_equity: 10100,
    result_json: '{"riskGate":{"status":"passed"}}',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z',
    strategy_name: 'Breakout',
    market_symbol: 'BTC-USD',
    timeframe: '1h'
  };
  const connectorRow = {
    id: 51,
    secret_reference_id: null,
    exchange_name: 'binance',
    label: 'Paper Connector',
    mode: 'paper',
    status: 'configured',
    settings_json: '{"sandbox":true}',
    secret_storage_note: 'metadata only',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  };
  const planRow = {
    id: 61,
    strategy_id: 21,
    paper_session_id: 41,
    risk_profile_id: 31,
    connector_id: 51,
    name: 'Paper Bot',
    mode: 'paper',
    status: 'ready_for_paper',
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    readiness_json: '{"status":"ready_for_paper"}',
    notes: 'fixture',
    created_at: '2026-05-14T00:00:00.000Z',
    updated_at: '2026-05-14T00:00:00.000Z'
  };
  const marketImportRow = {
    id: 71,
    label: 'BTC import',
    market_symbol: 'BTC-USD',
    timeframe: '1h',
    source: 'fixture',
    candle_count: 2,
    status: 'imported',
    quality_score: 100,
    notes: 'fixture',
    summary_json: '{}',
    created_at: '2026-05-14T00:00:00.000Z'
  };
  const candles = [
    { timestamp: '2026-05-14T00:00:00.000Z', open: 100, high: 105, low: 99, close: 104, volume: 1000 },
    { timestamp: '2026-05-14T01:00:00.000Z', open: 104, high: 110, low: 103, close: 109, volume: 1300 }
  ];
  const runtime = createBotAutomationActionsRuntime({
    async dbGet(query, params = []) {
      if (query.includes('paper_trading_sessions')) {
        return paperSessionRow;
      }

      if (query.includes('trading_strategies')) {
        return strategyRow;
      }

      if (query.includes('risk_profiles')) {
        return riskProfileRow;
      }

      if (query.includes('market_data_imports')) {
        return marketImportRow;
      }

      return null;
    },
    async dbAll(query, params = []) {
      dbAllCalls.push({ query, params });
      return candles;
    },
    async dbRun(query, params = []) {
      dbRuns.push({ query, params });

      if (query.includes('INSERT INTO bot_automation_runs')) {
        return { lastID: 81 };
      }

      return { changes: 1 };
    },
    parseStrategy,
    parseRiskProfile,
    parsePaperSession,
    parseExchangeConnector,
    parseBotAutomationPlan,
    parseBotAutomationRun,
    async getExchangeConnectorRow(id) {
      return { ...connectorRow, id };
    },
    async getBotAutomationPlanRow(id) {
      return { ...planRow, id };
    },
    async getBotAutomationRunRow(id) {
      return {
        id,
        plan_id: 61,
        strategy_id: 21,
        market_data_import_id: 71,
        mode: 'paper',
        status: 'completed',
        decision: 'hold',
        result_json: '{"decision":{"action":"hold"}}',
        created_at: '2026-05-14T00:00:00.000Z',
        plan_name: 'Paper Bot',
        strategy_name: 'Breakout',
        market_import_label: 'BTC import'
      };
    },
    evaluateBotAutomationReadiness,
    createPaperBotAutomationRunPayload(plan, strategy, riskProfile, marketImport, candleRows, readiness, settings) {
      payloadCalls.push({ plan, strategy, riskProfile, marketImport, candleRows, readiness, settings });
      return {
        decision: {
          action: 'hold'
        },
        readiness,
        settings
      };
    },
    createRequestError(message, statusCode = 400, details = {}) {
      const error = new Error(message);
      error.statusCode = statusCode;
      Object.assign(error, details);
      return error;
    }
  });
  const context = await runtime.loadBotAutomationReadinessContext(21, 31, 41, 51);
  const run = await runtime.createBotAutomationPaperRun(61, {
    marketDataImportId: 71,
    positionOpen: true
  });
  const insertRun = dbRuns.find(item => item.query.includes('INSERT INTO bot_automation_runs'));

  if (
    context.strategy.id !== 21
    || context.riskProfile.id !== 31
    || context.paperSession.result.riskGate.status !== 'passed'
    || context.connector.settings.sandbox !== true
    || dbAllCalls.length !== 1
    || dbAllCalls[0].params[0] !== 71
    || payloadCalls.length !== 1
    || payloadCalls[0].settings.positionOpen !== true
    || payloadCalls[0].candleRows.length !== 2
    || payloadCalls[0].readiness.status !== 'ready_for_paper'
    || !insertRun
    || insertRun.params[0] !== 61
    || insertRun.params[1] !== 21
    || insertRun.params[2] !== 71
    || insertRun.params[3] !== 'paper'
    || insertRun.params[4] !== 'completed'
    || insertRun.params[5] !== 'hold'
    || JSON.parse(insertRun.params[6]).settings.positionOpen !== true
    || run.id !== 81
    || run.result.decision.action !== 'hold'
  ) {
    fail('bot automation actions runtime did not preserve paper run behavior');
  }

  pass('bot automation actions runtime module');
}

async function checkBotAutomationScheduleRuntimeModule() {
  const {
    getNextBotAutomationRunAt,
    createBotAutomationScheduleRuntime
  } = require(path.join(projectRoot, 'app/server/src/lib/bot-automation-schedules'));
  const {
    parseBotAutomationSchedule
  } = require(path.join(projectRoot, 'app/server/src/lib/bot-automation'));
  const scheduleRows = new Map([
    [10, {
      id: 10,
      plan_id: 1,
      interval_minutes: 15,
      status: 'active',
      settings_json: '{"positionOpen":false}',
      created_at: '2026-05-14T00:00:00.000Z',
      updated_at: '2026-05-14T00:00:00.000Z'
    }],
    [11, {
      id: 11,
      plan_id: 2,
      interval_minutes: 30,
      status: 'paused',
      settings_json: '{}',
      created_at: '2026-05-14T00:00:00.000Z',
      updated_at: '2026-05-14T00:00:00.000Z'
    }],
    [12, {
      id: 12,
      plan_id: 3,
      interval_minutes: 5,
      status: 'active',
      settings_json: '{"fail":true}',
      created_at: '2026-05-14T00:00:00.000Z',
      updated_at: '2026-05-14T00:00:00.000Z'
    }]
  ]);
  const updates = [];
  const paperRuns = [];
  const dbAllQueries = [];
  const logErrors = [];
  const timers = [];
  let unrefCount = 0;
  let dueRows = [];
  const runtime = createBotAutomationScheduleRuntime({
    async dbAll(query) {
      dbAllQueries.push(query);
      return dueRows;
    },
    async dbRun(query, params) {
      updates.push({ query, params });
      return { changes: 1 };
    },
    parseBotAutomationSchedule,
    async getBotAutomationScheduleRow(id) {
      return scheduleRows.get(Number(id)) || null;
    },
    async createBotAutomationPaperRun(planId, settings) {
      paperRuns.push({ planId, settings });

      if (settings.fail) {
        throw new Error('paper fixture failure');
      }

      return { id: 900 + Number(planId) };
    },
    createRequestError(message, statusCode = 400) {
      const error = new Error(message);
      error.statusCode = statusCode;
      return error;
    },
    botAutomationScheduleSelect: 'SELECT bot_automation_schedules.* FROM bot_automation_schedules',
    setTimeoutFn(callback, delay) {
      timers.push({ callback, delay });
      return {
        unref() {
          unrefCount += 1;
        }
      };
    },
    workerDelayMs: 25,
    logger: {
      error(message) {
        logErrors.push(message);
      }
    }
  });
  const nextRunAt = getNextBotAutomationRunAt(15, new Date('2026-05-14T00:00:00.000Z'));
  const success = await runtime.runBotAutomationSchedule(10);
  let pausedError = '';
  let failureError = '';

  try {
    await runtime.runBotAutomationSchedule(11);
    fail('bot automation schedule runtime allowed an inactive schedule without force');
  } catch (error) {
    pausedError = error.message;
  }

  const forced = await runtime.runBotAutomationSchedule(11, { force: true });

  try {
    await runtime.runBotAutomationSchedule(12);
    fail('bot automation schedule runtime swallowed paper run failure');
  } catch (error) {
    failureError = error.message;
  }

  dueRows = [{ id: 10 }, { id: 12 }];
  await runtime.runDueBotAutomationSchedules();
  dueRows = [];
  runtime.scheduleBotAutomationWorker();
  runtime.scheduleBotAutomationWorker();
  await timers[0].callback();
  runtime.scheduleBotAutomationWorker();

  if (
    nextRunAt !== '2026-05-14T00:15:00.000Z'
    || success.run.id !== 901
    || forced.run.id !== 902
    || !paperRuns.some(run => run.planId === 1 && run.settings.positionOpen === false)
    || !/Only active/.test(pausedError)
    || !/paper fixture failure/.test(failureError)
    || !updates.some(update => update.params[0] === 901 && update.params[2] === 10)
    || !updates.some(update => update.params[0] === 'paper fixture failure' && update.params[2] === 12)
    || !dbAllQueries.some(query => query.includes("bot_automation_schedules.status = 'active'"))
    || !logErrors.some(message => message.includes('Bot automation schedule #12 failed'))
    || timers.length !== 2
    || timers[0].delay !== 25
    || unrefCount !== 2
  ) {
    fail('bot automation schedule runtime did not preserve schedule/worker behavior');
  }

  pass('bot automation schedule runtime module');
}

function checkInlineScripts(relativePath) {
  const html = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);

  for (const script of scripts) {
    new Function(script);
  }

  pass(`${relativePath} inline scripts (${scripts.length})`);
}

function checkStrategyLabSafetyDossierExportUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/strategy-lab.html'), 'utf8');

  if (
    !html.includes('id="bot-safety-dossier-download"')
    || !html.includes('Download Dossier JSON')
    || !html.includes('id="bot-safety-dossier-history-download"')
    || !html.includes('Download Dossier History CSV')
    || !html.includes('let latestBotSafetyDossier = null;')
    || !html.includes('function downloadBotSafetyDossier()')
    || !html.includes('function downloadBotSafetyDossierHistoryCsv()')
    || !html.includes('etherealai-bot-safety-dossier-plan-')
    || !html.includes('etherealai-bot-safety-dossier-history-plan-')
    || !html.includes("document.getElementById('bot-safety-dossier-download').addEventListener('click', downloadBotSafetyDossier)")
    || !html.includes("document.getElementById('bot-safety-dossier-history-download').addEventListener('click', downloadBotSafetyDossierHistoryCsv)")
    || !html.includes('id="bot-automation-summary"')
    || !html.includes('function renderBotAutomationSummary()')
    || !html.includes('id="bot-automation-capability-path"')
    || !html.includes('function renderBotAutomationCapabilityPath(capabilityPath = {})')
    || !html.includes('function loadBotAutomationCapabilityPath()')
    || !html.includes("fetch('/api/v1/bot-automation-capability-path')")
    || !html.includes('Automated Paper Path')
    || !html.includes('Ready Paper Plans')
    || !html.includes('Active Paper Schedules')
    || !html.includes('Future Live Automation')
    || !html.includes('Live Blocked Gates')
    || !html.includes('activate a ready paper schedule to automate')
    || !html.includes('no live order endpoint')
    || !html.includes('execution blocked')
    || !html.includes('Latest Run')
    || !html.includes('<strong>Route Boundary</strong>')
    || !html.includes('monitor_only_no_live_orders · live route disabled')
    || !html.includes('<strong>Generated</strong>')
    || !html.includes('<strong>Execution Note</strong>')
    || !html.includes('<strong>Status Summary</strong>')
    || !html.includes('<strong>Owner Action</strong>')
    || !html.includes('<strong>Live Boundary</strong>')
    || !html.includes('statusExplanation')
    || !html.includes('function buildBotSafetyDossierHistoryRows(payload = {})')
    || !html.includes('<th>Dossier History</th>')
    || !html.includes('<th>Evidence</th>')
    || !html.includes('No dossier history yet.')
    || !html.includes('Live execution disabled: no credential loading, no live order endpoint, and no exchange order placement.')
    || !html.includes('Monitor-only. No live execution enabled.')
    || !html.includes('Cross-Exchange Arbitrage Simulator')
    || !html.includes('id="arbitrage-simulator-form"')
    || !html.includes('Run Local Route Simulation')
    || !html.includes('id="arbitrage-simulation-list"')
    || !html.includes('/api/v1/order-intents/simulate-cross-exchange')
    || !html.includes('/api/v1/order-intents/arbitrage-simulations')
    || !html.includes('/draft-intents')
    || !html.includes('function runArbitrageSimulation(event)')
    || !html.includes('function loadArbitrageSimulationRuns()')
    || !html.includes('function createDraftIntentsFromSimulation(runId)')
    || !html.includes('No arbitrage route simulation run yet.')
    || !html.includes('Top-200 Rebalance Batch Simulator')
    || !html.includes('id="rebalance-batch-form"')
    || !html.includes('Run Local Rebalance Batch')
    || !html.includes('id="rebalance-candidate-csv"')
    || !html.includes('Import CSV Into JSON')
    || !html.includes('id="rebalance-batch-filter-status"')
    || !html.includes('id="rebalance-batch-export-json"')
    || !html.includes('id="rebalance-batch-export-csv"')
    || !html.includes('function importRebalanceCandidatesFromCsv()')
    || !html.includes('function archiveRebalanceBatch(batchId)')
    || !html.includes('function exportSingleRebalanceBatch(batchId)')
    || !html.includes('id="rebalance-batch-list"')
    || !html.includes('id="rebalance-review-queue"')
    || !html.includes('/api/v1/order-intents/rebalance-batches')
    || !html.includes('/api/v1/order-intents/rebalance-candidates/import-csv')
    || !html.includes('/export')
    || !html.includes('/api/v1/order-intents/rebalance-review-queue')
    || !html.includes('/api/v1/social-posts/rebalance-batches/')
    || !html.includes('function runRebalanceBatch(event)')
    || !html.includes('function loadRebalanceBatches()')
    || !html.includes('function createDraftIntentsFromRebalanceBatch(batchId)')
    || !html.includes('function createSocialDraftsFromRebalanceBatch(batchId)')
    || !html.includes('Create Campaign Drafts')
    || !html.includes('id="bot-plan-filter-form"')
    || !html.includes('id="bot-plan-filter-mode"')
    || !html.includes('id="bot-plan-filter-status"')
    || !html.includes('id="bot-plan-filter-count"')
    || !html.includes('id="bot-plan-filter-download"')
    || !html.includes('id="bot-plan-filter-download-csv"')
    || !html.includes('function filterBotPlans(plans = [])')
    || !html.includes('function updateBotPlanFilterCount(visibleCount = 0, totalCount = 0)')
    || !html.includes("document.getElementById('bot-plan-filter-form').addEventListener('submit'")
    || !html.includes('id="bot-run-filter-form"')
    || !html.includes('id="bot-run-filter-decision"')
    || !html.includes('id="bot-run-filter-status"')
    || !html.includes('id="bot-run-filter-count"')
    || !html.includes('id="bot-run-filter-download"')
    || !html.includes('id="bot-run-filter-download-csv"')
    || !html.includes('function filterBotRuns(runs = [])')
    || !html.includes('function updateBotRunFilterCount(visibleCount = 0, totalCount = 0)')
    || !html.includes("document.getElementById('bot-run-filter-form').addEventListener('submit'")
    || !html.includes('id="bot-schedule-filter-text"')
    || !html.includes('id="bot-schedule-filter-count"')
    || !html.includes('id="bot-schedule-filter-download"')
    || !html.includes('id="bot-schedule-filter-download-csv"')
    || !html.includes('function filterBotSchedules(schedules = [])')
    || !html.includes('function updateBotScheduleFilterCount(visibleCount = 0, totalCount = 0)')
    || !html.includes('function downloadJsonSnapshot(payload, filenamePrefix, emptyMessage)')
    || !html.includes('function csvValue(value)')
    || !html.includes('function downloadCsvSnapshot(rows, columns, filenamePrefix, emptyMessage)')
    || !html.includes('etherealai-filtered-bot-plans')
    || !html.includes('etherealai-filtered-paper-runs')
    || !html.includes('etherealai-filtered-paper-schedules')
    || !html.includes('Download Plans CSV')
    || !html.includes('Download Runs CSV')
    || !html.includes('Download Schedules CSV')
  ) {
    fail('Strategy Lab safety dossier/export/filter UI is missing expected controls or wiring');
  }

  pass('Strategy Lab safety dossier export/filter UI');
}

function checkStrategyLabRiskProfileSetupUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/strategy-lab.html'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');

  if (
    !html.includes('id="risk-profile-configuration"')
    || !html.includes('Risk Profile Configuration')
    || !html.includes('id="risk-profile-current-status"')
    || !html.includes('Current Profile Status')
    || !html.includes('id="risk-profile-safe-defaults"')
    || !html.includes('Use Safe Paper Defaults')
    || !html.includes('id="risk-profile-activate"')
    || !html.includes('Activate Profile')
    || !html.includes('id="risk-profile-verify-gate"')
    || !html.includes('Verify Paper Risk Gate')
    || !html.includes('max order value')
    || !html.includes('max position value')
    || !html.includes('max daily loss')
    || !html.includes('max open trades')
    || !html.includes('status active')
    || !html.includes('kill switch off')
    || !html.includes('Kill Switch must be OFF for paper trading completion.')
    || !html.includes('function isPaperReadyRiskProfile(profile = null)')
    || !html.includes('function getRiskProfilePayloadFromForm()')
    || !html.includes('function renderRiskProfileCurrentStatus(profile = null, gate = null)')
    || !html.includes('function applyRiskProfileSafeDefaults()')
    || !html.includes('async function verifyRiskProfileGate({ quiet = false } = {})')
    || !html.includes('async function activateRiskProfile()')
    || !html.includes('/api/v1/owner-setup-wizard/verify/paper_risk_profile_ready')
    || !html.includes('Owner Setup paper progress:')
    || !html.includes('No live wallet signing or live trading was enabled.')
    || !html.includes('button type="button" data-risk-activate-id=')
    || !styles.includes('.risk-profile-current-status')
    || !styles.includes('.risk-profile-status-header')
    || !styles.includes('.risk-status-grid')
    || !styles.includes('.risk-check-list')
    || !styles.includes('.risk-check-pass')
    || !styles.includes('.risk-check-blocked')
  ) {
    fail('Strategy Lab risk profile setup UI is missing gate completion controls or verifier wiring');
  }

  pass('Strategy Lab risk profile setup UI');
}

function checkStrategyLabBotOperatorWizardUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/strategy-lab.html'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');

  if (
    !html.includes('Bot Operator Wizard')
    || !html.includes('id="bot-operator-wizard"')
    || !html.includes('Use Safe Defaults and Finish Paper Setup')
    || !html.includes('Step 1: Select Strategy')
    || !html.includes('id="bot-operator-strategy"')
    || !html.includes('Step 2: Select Paper Session')
    || !html.includes('id="bot-operator-paper-session"')
    || !html.includes('Create Safe Paper Replay')
    || !html.includes('Step 3: Select Risk Profile')
    || !html.includes('id="bot-operator-risk-profile"')
    || !html.includes('Create Safe Risk Profile')
    || !html.includes('Step 4: Select Execution Connector')
    || !html.includes('id="bot-operator-connector"')
    || !html.includes('Show archived connectors')
    || !html.includes('Create Local Paper Connector')
    || !html.includes('Step 5: Create Ready Paper Plan')
    || !html.includes('Create Safe Paper Plan')
    || !html.includes('Ready Paper Plans:')
    || !html.includes('Step 6: Create/Activate Paper Schedule')
    || !html.includes('Create Local Paper Schedule')
    || !html.includes('Activate Paper Schedule')
    || !html.includes('Active Paper Schedules:')
    || !html.includes('Step 7: Final Verification')
    || !html.includes('Verify Paper Trading 100%')
    || !html.includes('Strategy selected')
    || !html.includes('Paper session selected')
    || !html.includes('Risk profile active')
    || !html.includes('Connector safe')
    || !html.includes('Ready paper plan created')
    || !html.includes('Paper schedule active')
    || !html.includes('Paper trading verified 100%')
    || !html.includes('function renderBotOperatorWizard(wizard = latestOwnerSetupWizard)')
    || !html.includes('function createOperatorPaperPlan()')
    || !html.includes('function createOperatorPaperSchedule({ active = false } = {})')
    || !html.includes('function activateOperatorPaperSchedule()')
    || !html.includes('function verifyOperatorPaperTrading()')
    || !html.includes('function useOperatorSafeDefaultsAndFinish()')
    || !html.includes('/api/v1/owner-setup-wizard')
    || !html.includes("mode: 'paper'")
    || !html.includes('Live trading, wallet signing, and exchange order placement remain disabled.')
    || !html.includes('advanced-bot-records')
    || !styles.includes('.operator-wizard')
    || !styles.includes('.operator-progress-checklist')
    || !styles.includes('.operator-step-ready')
    || !styles.includes('.operator-step-blocked')
    || !styles.includes('.operator-check-pass')
    || !styles.includes('.operator-check-blocked')
  ) {
    fail('Strategy Lab Bot Operator Wizard is missing required non-technical paper setup controls or safe-default wiring');
  }

  pass('Strategy Lab Bot Operator Wizard UI');
}

function checkStrategyLabOneClickSafePaperUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/strategy-lab.html'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');
  const routes = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/bot-automation.js'), 'utf8');
  const strategyRoutes = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/strategy-research.js'), 'utf8');
  const arbitrageLib = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/strategy-arbitrage.js'), 'utf8');
  const routeRegistration = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/route-registration.js'), 'utf8');
  const operatorMode = fs.readFileSync(path.join(projectRoot, 'app/client/js/operator-mode.js'), 'utf8');

  if (
    !html.includes('id="safe-paper-simulator"')
    || !html.includes('id="strategy-type"')
    || !html.includes('Cross-Exchange Arbitrage')
    || !html.includes('Cross-DEX Arbitrage')
    || !html.includes('Hybrid DEX/CEX Arbitrage')
    || !html.includes('id="arbitrage-strategy-fields"')
    || !html.includes('Structured Arbitrage Builder')
    || !html.includes('id="arb-buy-venues"')
    || !html.includes('id="arb-sell-venues"')
    || !html.includes('id="arb-min-spread"')
    || !html.includes('id="arb-fee-percent"')
    || !html.includes('id="arb-maker-fee-percent"')
    || !html.includes('id="arb-taker-fee-percent"')
    || !html.includes('id="arb-slippage-percent"')
    || !html.includes('id="arb-min-liquidity"')
    || !html.includes('id="arb-max-latency"')
    || !html.includes('id="arb-simultaneous"')
    || !html.includes('id="arb-top-volume-filter"')
    || !html.includes('id="arb-top-volume-rank"')
    || !html.includes('id="arb-min-volume-usd"')
    || !html.includes('Exchange Spread Comparison')
    || !html.includes('Execution Timing And Cost Assumptions')
    || !html.includes('No trade if the spread collapses before simulated execution.')
    || !html.includes('id="arbitrage-rule-preview"')
    || !html.includes('function getArbitrageRulesFromForm()')
    || !html.includes('function updateStrategyBuilderMode()')
    || !html.includes('id="run-this-strategy-safely"')
    || !html.includes('Run This Strategy Safely')
    || !html.includes('EtherealAI automatically creates or reuses the safe paper session, risk profile, local connector, plan, schedule, verifier, and simulation run.')
    || !html.includes('id="safe-paper-results"')
    || !html.includes('id="safe-paper-progress"')
    || !html.includes('runningStatus')
    || !html.includes('simulatedTrades')
    || !html.includes('pAndL')
    || !html.includes('spreadAnalysis')
    || !html.includes('feesAndSlippage')
    || !html.includes('entryExitReasons')
    || !html.includes('strategyHealth')
    || !html.includes('warnings')
    || !html.includes('Retry Safe Paper Test')
    || !html.includes('function updateSafePaperSelectedStrategy()')
    || !html.includes('function renderSafePaperResults(data = {})')
    || !html.includes('async function runSelectedStrategySafely()')
    || !html.includes('/run-safe-paper-test')
    || !html.includes('Live trading and wallet signing stayed disabled.')
    || !styles.includes('.safe-paper-hero')
    || !styles.includes('.arbitrage-builder')
    || !styles.includes('.arbitrage-builder-grid')
    || !styles.includes('.safe-paper-results')
    || !styles.includes('.safe-paper-result-card')
    || !styles.includes('.safe-paper-warning-card')
    || !styles.includes('Safe Paper night contrast repair')
    || !styles.includes('Final EOF contrast lock for legacy rules appended above')
    || !styles.includes(':root:not([data-theme="day"]) .safe-paper-result-card')
    || !styles.includes(':root[data-theme="night"] .safe-paper-result-card')
    || !styles.includes('.operator-progress-checklist article')
    || !styles.includes('.safe-paper-warning-card *')
    || !styles.includes('--status-success-text: #dcfce7')
    || !strategyRoutes.includes('normalizeArbitrageStrategyRules')
    || !strategyRoutes.includes('buildArbitrageRuleSummary')
    || !strategyRoutes.includes('strategy_rules_json')
    || !arbitrageLib.includes('runArbitrageBacktest')
    || !arbitrageLib.includes('createArbitragePaperBotDecision')
    || !arbitrageLib.includes('minimumSpreadPercent')
    || !arbitrageLib.includes('maxExecutionLatencyMs')
    || !arbitrageLib.includes('simultaneousExecutionRequired')
    || !arbitrageLib.includes('makerFeePercent')
    || !arbitrageLib.includes('takerFeePercent')
    || !arbitrageLib.includes('topVolumeFilter')
    || !arbitrageLib.includes('spread_not_above_total_cost')
    || !arbitrageLib.includes('spread_collapsed_before_execution')
    || !arbitrageLib.includes('buildRouteComparison')
    || !arbitrageLib.includes('routeComparisons')
    || !arbitrageLib.includes("routeSelection: 'best_net_edge_after_costs'")
    || !routes.includes("app.post('/api/v1/strategies/:id/run-safe-paper-test'")
    || !routes.includes('findOrCreateSafePaperSession')
    || !routes.includes('createLocalSampleMarketImport')
    || !routes.includes('Local sample candles were generated because no matching local market data existed')
    || !routes.includes('findOrCreateSafeRiskProfile')
    || !routes.includes('findOrCreateSafeConnector')
    || !routes.includes('findOrCreateReadyPaperPlan')
    || !routes.includes('findOrCreateActivePaperSchedule')
    || !routes.includes('runBotAutomationSchedule(scheduleResult.schedule.id, { force: true })')
    || !routes.includes('plainEnglishError')
    || !routes.includes('oneClickFixes')
    || !routes.includes('walletSigningEnabled: false')
    || !routes.includes('liveTradingEnabled: false')
    || !routes.includes('spreadAnalysis')
    || !routes.includes('routeComparisons')
    || !routes.includes('exchangeSelection')
    || !routes.includes('makerFeePercent')
    || !routes.includes('topVolumeFilter')
    || !routes.includes('simulatedTrades')
    || !routes.includes('strategyHealth')
    || !routeRegistration.includes('parseStrategy: parsers.parseStrategy')
    || !routeRegistration.includes('parseRiskProfile: parsers.parseRiskProfile')
    || !routeRegistration.includes('runCandleBacktest')
    || !routeRegistration.includes('createPaperReplayPayload')
    || !routeRegistration.includes('insertDecisionLogs')
    || !operatorMode.includes('Run This Strategy Safely')
    || !operatorMode.includes('Advanced infrastructure objects stay hidden unless you intentionally open Advanced Mode.')
  ) {
    fail('Strategy Lab one-click safe paper simulation UI or route is missing automatic orchestration coverage');
  }

  pass('Strategy Lab one-click safe paper simulation UI');
}

function checkExchangeConnectorManagerUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/strategy-lab.html'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');
  const routes = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/exchange-metadata.js'), 'utf8');
  const metadata = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/exchange-metadata.js'), 'utf8');
  const readOnlyConnections = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/exchange-readonly-connections.js'), 'utf8');
  const routeRegistration = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/route-registration.js'), 'utf8');

  if (
    !html.includes('id="exchange-connector-manager"')
    || !html.includes('Exchange Connector Manager')
    || !html.includes('Create connector placeholders for all supported exchanges')
    || !html.includes('Connect read-only APIs later')
    || !html.includes('Hide unsupported exchanges')
    || !html.includes('Show recommended first 5')
    || !html.includes('id="exchange-manager-choice"')
    || !html.includes('id="exchange-manager-add"')
    || !html.includes('id="exchange-manager-readonly"')
    || !html.includes('id="exchange-manager-connect-api"')
    || !html.includes('id="exchange-manager-paper"')
    || !html.includes('id="exchange-manager-test"')
    || !html.includes('id="read-only-api-wizard"')
    || !html.includes('Save to Secure Vault')
    || !html.includes('Test Read-Only Connection')
    || !html.includes('Delete Saved Key')
    || !html.includes('Read-Only Price / Spread Compare')
    || !html.includes('async function saveReadOnlyApiCredentials')
    || !html.includes('async function compareReadOnlyPricesFromUi')
    || !html.includes('async function loadExchangeConnectorManager()')
    || !html.includes('async function createExchangeManagerPlaceholders')
    || !html.includes('async function testExchangeManagerConnector')
    || !html.includes('/api/v1/exchange-connectors/manager')
    || !html.includes('/api/v1/exchange-connectors/placeholders')
    || !html.includes('/api/v1/exchange-connectors/read-only/setup-guides')
    || !html.includes('/read-only-credentials')
    || !html.includes('/read-only-connection-test')
    || html.includes('localStorage')
    || html.includes('sessionStorage')
    || !html.includes('Live trading, withdrawals, and wallet signing remain locked.')
    || !styles.includes('.exchange-manager-safety-grid')
    || !styles.includes('.exchange-manager-status-cards')
    || !styles.includes('.exchange-manager-card-grid')
    || !styles.includes('.exchange-manager-category')
    || !styles.includes('.read-only-api-wizard')
    || !styles.includes('.read-only-price-compare')
    || !routes.includes("app.get('/api/v1/exchange-connectors/registry'")
    || !routes.includes("app.get('/api/v1/exchange-connectors/manager'")
    || !routes.includes("app.get('/api/v1/exchange-connectors/read-only/setup-guides'")
    || !routes.includes("app.get('/api/v1/exchange-connectors/read-only/status'")
    || !routes.includes("app.post('/api/v1/exchange-connectors/read-only/price-compare'")
    || !routes.includes("app.post('/api/v1/exchange-connectors/:id/read-only-credentials'")
    || !routes.includes("app.delete('/api/v1/exchange-connectors/:id/read-only-credentials'")
    || !routes.includes("app.post('/api/v1/exchange-connectors/:id/read-only-connection-test'")
    || !routes.includes("app.post('/api/v1/exchange-connectors/placeholders'")
    || !routes.includes("app.post('/api/v1/exchange-connectors/:id/test-read-only'")
    || !routes.includes('defaultEveryConnectorOff: true')
    || !routes.includes('walletSigningEnabled: false')
    || !routes.includes('withdrawalsEnabled: false')
    || !routes.includes('saveReadOnlyVaultCredentials')
    || !routes.includes('privateValuesReturnedToUi: false')
    || !metadata.includes('Centralized Exchanges')
    || !metadata.includes('US-Compliant Exchanges')
    || !metadata.includes('Futures/Derivatives')
    || !metadata.includes('Ethereum DEXs')
    || !metadata.includes('Solana DEXs')
    || !metadata.includes('BNB Chain DEXs')
    || !metadata.includes('Arbitrum/Avalanche/Polygon DEXs')
    || !metadata.includes('Cross-chain aggregators')
    || !metadata.includes('Decentralized perpetuals')
    || !metadata.includes('Hybrid exchanges')
    || !metadata.includes('P2P exchanges')
    || !metadata.includes('EXCHANGE_CONNECTOR_RECOMMENDED_ORDER')
    || !metadata.includes('buildExchangeConnectorManagerSummary')
    || !metadata.includes('evaluateExchangeConnectorReadOnlyTest')
    || !readOnlyConnections.includes('aes-256-gcm')
    || !readOnlyConnections.includes('EXCHANGE_READONLY_SETUP_GUIDES')
    || !readOnlyConnections.includes('DEX_QUOTE_ONLY_SETUP_GUIDES')
    || !readOnlyConnections.includes('PRIVATE_READONLY_TESTERS')
    || !readOnlyConnections.includes('compareReadOnlyPrices')
    || !readOnlyConnections.includes('orderEndpointCalled: false')
    || !routeRegistration.includes('buildExchangeConnectorManagerSummary')
    || !routeRegistration.includes('evaluateExchangeConnectorReadOnlyTest')
    || !routeRegistration.includes('saveReadOnlyVaultCredentials')
    || !routeRegistration.includes('compareReadOnlyPrices')
  ) {
    fail('Exchange Connector Manager UI, routes, registry, or safety checks are missing');
  }

  pass('Exchange Connector Manager UI');
}

function checkLiveTradingLaunchCenterUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/live-trading-launch.html'), 'utf8');
  const operatorMode = fs.readFileSync(path.join(projectRoot, 'app/client/js/operator-mode.js'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');
  const routes = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/exchange-metadata.js'), 'utf8');
  const pages = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/pages.js'), 'utf8');
  const server = fs.readFileSync(path.join(projectRoot, 'app/server/src/server.js'), 'utf8');
  const routeRegistration = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/route-registration.js'), 'utf8');
  const readOnlyConnections = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/exchange-readonly-connections.js'), 'utf8');
  const liveSafety = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/exchange-live-safety.js'), 'utf8');
  const sandboxExecution = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/exchange-sandbox-execution.js'), 'utf8');
  const tinyLiveExecution = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/exchange-tiny-live-execution.js'), 'utf8');
  const phase4Command = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/exchange-live-arbitrage-command.js'), 'utf8');
  const phase5Treasury = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/exchange-treasury-liquidity-intelligence.js'), 'utf8');
  const phase6Production = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/exchange-production-execution.js'), 'utf8');
  const schema = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/database-schema.js'), 'utf8');
  const dashboard = fs.readFileSync(path.join(projectRoot, 'app/client/dashboard.html'), 'utf8');
  const strategyLab = fs.readFileSync(path.join(projectRoot, 'app/client/strategy-lab.html'), 'utf8');
  const operatorControl = fs.readFileSync(path.join(projectRoot, 'app/client/operator-control.html'), 'utf8');

  if (
    !html.includes('Live Trading Launch Center')
    || !html.includes('Run Read-Only Arbitrage Scan')
    || !html.includes('Paper Simulate This Opportunity')
    || !html.includes('Live Trading Approval Center')
    || !html.includes('Advanced Developer Mode')
    || !html.includes('Local paper simulation only')
    || !html.includes('Live trading, withdrawals, wallet signing, and order endpoints remain locked')
    || !html.includes('Phase 3 Operator Dashboard')
    || !html.includes('Phase 3A: Authenticated Account Readiness')
    || !html.includes('Refresh Account Readiness')
    || !html.includes('Scan Authenticated Readiness')
    || !html.includes('Phase 3B: Sandbox/Testnet Execution')
    || !html.includes('Run Sandbox Test Trade')
    || !html.includes('Save Sandbox/Testnet API Key')
    || !html.includes('Emergency Stop / Disable Live Connectors')
    || !html.includes('Phase 3C: Tiny Live Test Mode')
    || !html.includes('Tiny Live Test Approval Center')
    || !html.includes('Preview Tiny Live Order')
    || !html.includes('Place One Tiny Live Order')
    || !html.includes('Save Tiny Live API Key')
    || !html.includes('Manual owner confirmation')
    || !html.includes('Phase 4: Live Arbitrage Command Center')
    || !html.includes('Run Multi-Exchange Scan')
    || !html.includes('Spread Heatmap')
    || !html.includes('Opportunity Queue')
    || !html.includes('Exchange Health Dashboard')
    || !html.includes('Capital Allocation Dashboard')
    || !html.includes('Risk Dashboard')
    || !html.includes('Recovery And Emergency Controls')
    || !html.includes('Phase 5: Treasury Command Center')
    || !html.includes('Run Treasury Intelligence Refresh')
    || !html.includes('Liquidity Intelligence Dashboard')
    || !html.includes('Opportunity Ranking Board')
    || !html.includes('Cross-Chain Status Dashboard')
    || !html.includes('Capital Allocation Heatmap')
    || !html.includes('Risk & Exposure Dashboard')
    || !html.includes('AI Decision Audit')
    || !html.includes('Emergency Capital Freeze / Keep Locked')
    || !html.includes('Phase 6: Production Trading Command Center')
    || !html.includes('Record Controlled Approval')
    || !html.includes('Save Production API Key To Local Vault')
    || !html.includes('Test Production Connection')
    || !html.includes('Delete Production Key')
    || !html.includes('Run Production Dry-Run Preview')
    || !html.includes('Place Controlled Production Order')
    || !html.includes('Track Latest Production Order')
    || !html.includes('Cancel Latest Production Order')
    || !html.includes('Emergency Stop Production')
    || !html.includes('Live Positions Dashboard')
    || !html.includes('Real Orders Dashboard')
    || !html.includes('Real Fill Dashboard')
    || !html.includes('Exchange Health Monitor')
    || !html.includes('Capital Exposure Dashboard')
    || !html.includes('Emergency Controls Dashboard')
    || !html.includes('Risk Engine Dashboard')
    || !html.includes('/js/operator-next-action.js')
    || !html.includes('Scan Read-Only Accounts')
    || !html.includes('Run Dry-Run Safety Review')
    || !html.includes('Replay Latest Spread Scan')
    || !html.includes('Execution Safety Score')
    || !html.includes('/api/v1/live-trading-launch/roadmap')
    || !html.includes('/api/v1/live-trading-launch/read-only-scan')
    || !html.includes('/api/v1/live-trading-launch/paper-simulate-opportunity')
    || !html.includes('/api/v1/live-trading-launch/phase3/status')
    || !html.includes('/api/v1/live-trading-launch/phase3a/readiness')
    || !html.includes('/api/v1/live-trading-launch/phase3b/status')
    || !html.includes('/api/v1/live-trading-launch/phase3b/sandbox-test-trade')
    || !html.includes('/api/v1/live-trading-launch/phase3c/status')
    || !html.includes('/api/v1/live-trading-launch/phase3c/preview')
    || !html.includes('/api/v1/live-trading-launch/phase3c/place')
    || !html.includes('/api/v1/live-trading-launch/phase3c/emergency-stop')
    || !html.includes('/api/v1/live-trading-launch/phase4/status')
    || !html.includes('/api/v1/live-trading-launch/phase4/command-center')
    || !html.includes('/api/v1/live-trading-launch/phase5/status')
    || !html.includes('/api/v1/live-trading-launch/phase5/treasury-command-center')
    || !html.includes('/api/v1/live-trading-launch/phase6/status')
    || !html.includes('/api/v1/live-trading-launch/phase6/approval')
    || !html.includes('/api/v1/live-trading-launch/phase6/preview')
    || !html.includes('/api/v1/live-trading-launch/phase6/place')
    || !html.includes('/api/v1/live-trading-launch/phase6/orders/')
    || !html.includes('/api/v1/live-trading-launch/phase6/emergency-stop')
    || !html.includes('/production-credentials')
    || !html.includes('/test-production-connection')
    || !html.includes('/sandbox-credentials')
    || !html.includes('/tiny-live-credentials')
    || !html.includes('/api/v1/live-trading-launch/phase3c/orders/')
    || !html.includes('/api/v1/live-trading-launch/authenticated-read-only-scan')
    || !html.includes('/api/v1/live-trading-launch/dry-run-order-safety')
    || !html.includes('/api/v1/live-trading-launch/account-aware-arbitrage')
    || !html.includes('/api/v1/live-trading-launch/replay-spread-history')
    || html.includes('localStorage')
    || html.includes('sessionStorage')
    || !styles.includes('.live-launch-status-grid')
    || !styles.includes('.live-scan-controls')
    || !styles.includes('.live-candidate-card')
    || !styles.includes('.live-approval-center')
    || !styles.includes('.phase3-dashboard-grid')
    || !styles.includes('.phase3-account-card')
    || !styles.includes('.phase3a-checklist')
    || !styles.includes('.phase3a-exchange-grid')
    || !styles.includes('.live-sandbox-safety-grid')
    || !styles.includes('.live-sandbox-controls')
    || !styles.includes('.live-tiny-safety-grid')
    || !styles.includes('.live-tiny-controls')
    || !styles.includes('.tiny-confirmation-box')
    || !styles.includes('.phase4-controls')
    || !styles.includes('.phase4-dashboard-grid')
    || !styles.includes('.phase4-mini-card')
    || !styles.includes('.phase5-controls')
    || !styles.includes('.phase5-dashboard-grid')
    || !styles.includes('.phase5-mini-card')
    || !styles.includes('.phase6-controls')
    || !styles.includes('.phase6-vault')
    || !styles.includes('.phase6-dashboard-grid')
    || !styles.includes('.phase6-mini-card')
    || !styles.includes('.phase6-acknowledgments')
    || !routes.includes("app.get('/api/v1/live-trading-launch/roadmap'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/read-only-scan'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/paper-simulate-opportunity'")
    || !routes.includes("app.get('/api/v1/live-trading-launch/phase3/status'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase3a/readiness'")
    || !routes.includes("app.get('/api/v1/live-trading-launch/phase3b/status'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase3b/sandbox-test-trade'")
    || !routes.includes("app.get('/api/v1/live-trading-launch/phase3c/status'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase3c/preview'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase3c/place'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase3c/emergency-stop'")
    || !routes.includes("app.get('/api/v1/live-trading-launch/phase4/status'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase4/command-center'")
    || !routes.includes("app.get('/api/v1/live-trading-launch/phase5/status'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase5/treasury-command-center'")
    || !routes.includes("app.get('/api/v1/live-trading-launch/phase6/status'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase6/approval'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase6/preview'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase6/place'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase6/orders/:id/cancel'")
    || !routes.includes("app.get('/api/v1/live-trading-launch/phase6/orders/:id/status'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase6/emergency-stop'")
    || !routes.includes("app.post('/api/v1/exchange-connectors/:id/production-credentials'")
    || !routes.includes("app.delete('/api/v1/exchange-connectors/:id/production-credentials'")
    || !routes.includes("app.post('/api/v1/exchange-connectors/:id/test-production-connection'")
    || !routes.includes("app.post('/api/v1/exchange-connectors/:id/tiny-live-credentials'")
    || !routes.includes("app.delete('/api/v1/exchange-connectors/:id/tiny-live-credentials'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/phase3c/orders/:id/cancel'")
    || !routes.includes("app.get('/api/v1/live-trading-launch/phase3c/orders/:id/status'")
    || !routes.includes("app.post('/api/v1/exchange-connectors/:id/sandbox-credentials'")
    || !routes.includes("app.delete('/api/v1/exchange-connectors/:id/sandbox-credentials'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/authenticated-read-only-scan'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/dry-run-order-safety'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/account-aware-arbitrage'")
    || !routes.includes("app.post('/api/v1/live-trading-launch/replay-spread-history'")
    || !pages.includes("app.get('/live-trading-launch', requirePageAuth")
    || !server.includes('EXPANDED_READONLY_MARKET_VENUES')
    || !server.includes('scanReadOnlyArbitrageOpportunities')
    || !server.includes('buildLiveTradingLaunchRoadmap')
    || !server.includes('buildPhase3Status')
    || !server.includes('buildPhase3AReadiness')
    || !server.includes('buildPhase3BPreparationPlan')
    || !server.includes('SANDBOX_EXCHANGE_ADAPTERS')
    || !server.includes('runSandboxOrderLifecycle')
    || !server.includes('TINY_LIVE_EXCHANGE_ADAPTERS')
    || !server.includes('runTinyLiveOrderLifecycle')
    || !server.includes('buildLiveArbitrageCommandCenter')
    || !server.includes('buildTreasuryLiquidityCommandCenter')
    || !server.includes('PHASE6_PRODUCTION_ADAPTERS')
    || !server.includes('runProductionOrderLifecycle')
    || !server.includes('queryProductionOrderStatus')
    || !server.includes('cancelProductionOrder')
    || !routeRegistration.includes('scanReadOnlyArbitrageOpportunities')
    || !routeRegistration.includes('createPaperSimulationForOpportunity')
    || !routeRegistration.includes('scanAuthenticatedReadOnlyAccounts')
    || !routeRegistration.includes('evaluateLiveExecutionSafety')
    || !routeRegistration.includes('buildPhase3AReadiness')
    || !routeRegistration.includes('buildPhase3BPreparationPlan')
    || !routeRegistration.includes('buildPhase3BSandboxStatus')
    || !routeRegistration.includes('runSandboxOrderLifecycle')
    || !routeRegistration.includes('buildTinyLiveApprovalCenter')
    || !routeRegistration.includes('runTinyLiveOrderLifecycle')
    || !routeRegistration.includes('buildLiveArbitrageCommandCenter')
    || !routeRegistration.includes('buildTreasuryLiquidityCommandCenter')
    || !routeRegistration.includes('buildPhase6ApprovalCenter')
    || !routeRegistration.includes('runProductionOrderLifecycle')
    || !routeRegistration.includes('queryProductionOrderStatus')
    || !routeRegistration.includes('cancelProductionOrder')
    || !readOnlyConnections.includes('EXPANDED_READONLY_MARKET_VENUES')
    || !readOnlyConnections.includes('fetchKucoinMarketSnapshot')
    || !readOnlyConnections.includes('fetchGateMarketSnapshot')
    || !readOnlyConnections.includes('fetchMexcMarketSnapshot')
    || !readOnlyConnections.includes('fetchBitgetMarketSnapshot')
    || !readOnlyConnections.includes('fetchBitstampMarketSnapshot')
    || !readOnlyConnections.includes('fetchCryptoComMarketSnapshot')
    || !readOnlyConnections.includes('scanReadOnlyArbitrageOpportunities')
    || !readOnlyConnections.includes('createArbitrageCandidate')
    || !readOnlyConnections.includes('marketDataOnly: true')
    || !readOnlyConnections.includes('liveTradingEnabled: false')
    || !readOnlyConnections.includes('withdrawalsEnabled: false')
    || !readOnlyConnections.includes('walletSigningEnabled: false')
    || !readOnlyConnections.includes('orderEndpointEnabled: false')
    || !liveSafety.includes('DEFAULT_LIVE_SAFETY_POLICY')
    || !liveSafety.includes('globalKillSwitchEnabled: true')
    || !liveSafety.includes('dryRunOnly: true')
    || !liveSafety.includes('orderEndpointEnabled: false')
    || !liveSafety.includes('ordersPlaced: false')
    || !liveSafety.includes('PHASE3A_ACCOUNT_STATUSES')
    || !liveSafety.includes('fetchSymbolTradingRules')
    || !liveSafety.includes('buildPhase3AReadiness')
    || !liveSafety.includes('buildPhase3BPreparationPlan')
    || !liveSafety.includes('scanAuthenticatedReadOnlyAccounts')
    || !liveSafety.includes('evaluateLiveExecutionSafety')
    || !liveSafety.includes('buildOutcomeBenchmark')
    || !sandboxExecution.includes('SANDBOX_ORDER_LIFECYCLE_STATUSES')
    || !sandboxExecution.includes('submitBinanceSandboxOrder')
    || !sandboxExecution.includes('submitOkxSandboxOrder')
    || !sandboxExecution.includes('submitBybitSandboxOrder')
    || !sandboxExecution.includes('productionLiveTradingEnabled: false')
    || !tinyLiveExecution.includes('TINY_LIVE_OWNER_CONFIRMATION_PHRASE')
    || !tinyLiveExecution.includes('submitBinanceTinyLiveOrder')
    || !tinyLiveExecution.includes('automatedLiveTradingEnabled: false')
    || !tinyLiveExecution.includes('walletSigningEnabled: false')
    || !tinyLiveExecution.includes('withdrawalsEnabled: false')
    || !phase4Command.includes('Live Arbitrage Command Center')
    || !phase4Command.includes('buildVenueScores')
    || !phase4Command.includes('buildSpreadHeatmap')
    || !phase4Command.includes('rankArbitrageOpportunities')
    || !phase4Command.includes('buildCrossExchangeInventory')
    || !phase4Command.includes('buildCapitalAllocation')
    || !phase4Command.includes('estimateTransferAndNetworkCosts')
    || !phase4Command.includes('buildRecoveryAndOrchestration')
    || !phase4Command.includes('multiExchangeLiveExecutionEnabled: false')
    || !phase4Command.includes('withdrawalsEnabled: false')
    || !phase5Treasury.includes('Treasury Command Center')
    || !phase5Treasury.includes('buildTreasuryManagement')
    || !phase5Treasury.includes('buildDynamicCapitalAllocation')
    || !phase5Treasury.includes('buildLiquidityIntelligence')
    || !phase5Treasury.includes('rankAutonomousTreasuryOpportunities')
    || !phase5Treasury.includes('buildCrossChainIntelligence')
    || !phase5Treasury.includes('buildTreasurySafetyControls')
    || !phase5Treasury.includes('buildAiDecisionAudit')
    || !phase5Treasury.includes('autonomousTreasuryActionsEnabled: false')
    || !phase5Treasury.includes('unrestrictedWithdrawalsEnabled: false')
    || !phase5Treasury.includes('unrestrictedWalletSigningEnabled: false')
    || !phase6Production.includes('Phase 6: Production Trading Command Center')
    || !phase6Production.includes('PHASE6_PRODUCTION_ADAPTERS')
    || !phase6Production.includes('submitBinanceProductionOrder')
    || !phase6Production.includes('submitCoinbaseProductionOrder')
    || !phase6Production.includes('submitKrakenProductionOrder')
    || !phase6Production.includes('submitOkxProductionOrder')
    || !phase6Production.includes('submitBybitProductionOrder')
    || !phase6Production.includes('queryProductionOrderStatus')
    || !phase6Production.includes('cancelProductionOrder')
    || !phase6Production.includes('saveProductionVaultCredentials')
    || !phase6Production.includes('testProductionExchangeConnection')
    || !phase6Production.includes('automatedLiveTradingEnabled: false')
    || !phase6Production.includes('unrestrictedAutonomousTradingEnabled: false')
    || !phase6Production.includes('withdrawalsEnabled: false')
    || !phase6Production.includes('walletSigningEnabled: false')
    || !operatorMode.includes("'/live-trading-launch'")
    || !operatorMode.includes('Control Production Trading Infrastructure Without Unlocking Autonomy')
    || !operatorMode.includes("keepIds: ['live-arbitrage-command-center', 'treasury-command-center', 'production-trading-command-center']")
    || !operatorMode.includes('Refresh Production Status')
    || !operatorMode.includes('No leverage, margin, futures, withdrawals, wallet signing, unrestricted live orders, or autonomous scaling.')
    || !schema.includes('CREATE TABLE IF NOT EXISTS sandbox_order_tests')
    || !schema.includes('CREATE TABLE IF NOT EXISTS sandbox_order_events')
    || !schema.includes('CREATE TABLE IF NOT EXISTS tiny_live_order_tests')
    || !schema.includes('CREATE TABLE IF NOT EXISTS tiny_live_order_events')
    || !schema.includes('CREATE TABLE IF NOT EXISTS live_arbitrage_command_runs')
    || !schema.includes('CREATE TABLE IF NOT EXISTS live_arbitrage_command_events')
    || !schema.includes('CREATE TABLE IF NOT EXISTS treasury_intelligence_runs')
    || !schema.includes('CREATE TABLE IF NOT EXISTS treasury_intelligence_events')
    || !schema.includes('CREATE TABLE IF NOT EXISTS production_execution_approvals')
    || !schema.includes('CREATE TABLE IF NOT EXISTS production_order_executions')
    || !schema.includes('CREATE TABLE IF NOT EXISTS production_order_events')
    || !schema.includes('CREATE TABLE IF NOT EXISTS live_trading_safety_events')
    || !dashboard.includes('/live-trading-launch')
    || !strategyLab.includes('/live-trading-launch')
    || !operatorControl.includes('/live-trading-launch')
  ) {
    fail('Live Trading Launch Center is missing Phase 1/2 UI, routes, scanner wiring, or locked safety boundaries');
  }

  pass('Live Trading Launch Center UI');
}

function checkMvpTestPassOwnerWorkflowUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/mvp-test-pass.html'), 'utf8');

  if (
    !html.includes('Bot automation review exports')
    || !html.includes('Owner evidence review')
    || !html.includes('Bot Automation Smoke')
    || !html.includes('Owner Evidence Manifest')
    || !html.includes('Owner Acceptance')
    || !html.includes('formatOwnerAcceptanceStatus')
    || !html.includes('Pending Review')
    || !html.includes('manual owner review remains')
    || !html.includes('id="bot-workflow-smoke-cards"')
    || !html.includes('id="bot-workflow-smoke-table"')
    || !html.includes('id="owner-evidence-cards"')
    || !html.includes('id="owner-evidence-table"')
    || !html.includes('id="owner-evidence-download"')
    || !html.includes('id="owner-evidence-export-status"')
    || !html.includes('id="owner-evidence-review-checklist"')
    || !html.includes('Owner Acceptance Record')
    || !html.includes('Completion Ledger')
    || !html.includes('id="completion-ledger-cards"')
    || !html.includes('id="completion-ledger-gates"')
    || !html.includes('function renderCompletionLedger(ledger = {})')
    || !html.includes('Why MVP is 99%')
    || !html.includes('Local E2E Complete')
    || !html.includes('Live E2E Locked')
    || !html.includes('id="owner-acceptance-record-status"')
    || !html.includes('id="owner-acceptance-record-cards"')
    || !html.includes('id="owner-acceptance-record-list"')
    || !html.includes('latestOwnerAcceptanceRecordState')
    || !html.includes('function renderOwnerAcceptanceRecordState(state = {})')
    || !html.includes("fetch('/api/v1/owner-acceptance')")
    || !html.includes('No local owner acceptance record yet; record it from the proof packet after manual testing.')
    || !html.includes('No local owner acceptance records yet')
    || !html.includes('Record Local MVP Acceptance from /owner-proof-packet')
    || !html.includes('Acceptance Records')
    || !html.includes('acceptance required for 100%')
    || !html.includes('Download Evidence Manifest JSON')
    || !html.includes('Owner Evidence Review Checklist')
    || !html.includes('Owner Evidence Review Checklist lists local proof rows, checksum marker, and confirms live execution remains blocked.')
    || !html.includes('function renderBotWorkflowSmoke(workflow = {})')
    || !html.includes('function renderOwnerEvidenceManifest(manifest = {})')
    || !html.includes('let latestOwnerEvidenceManifest = null;')
    || !html.includes('function downloadOwnerEvidenceManifest()')
    || !html.includes('etherealai-owner-evidence-manifest-')
    || !html.includes('evidence item(s) ready for local JSON export')
    || !html.includes('Prepared owner evidence manifest JSON · sha256')
    || !html.includes("document.getElementById('owner-evidence-download').addEventListener('click', downloadOwnerEvidenceManifest)")
    || !html.includes('Manifest Status')
    || !html.includes('Manifest Checksum')
    || !html.includes('Evidence Items')
    || !html.includes('No owner evidence manifest loaded.')
    || !html.includes('Review Item')
    || !html.includes('Confirm checksum marker')
    || !html.includes('Confirm live execution remains blocked')
    || !html.includes('Manifest artifact list has a local integrity marker.')
    || !html.includes('No live order endpoint or live exchange placement is enabled.')
    || !html.includes('No owner evidence review checklist loaded.')
    || !html.includes('Dossier Evidence')
    || !html.includes('Route Boundary')
    || !html.includes('routeSafetyProfile')
    || !html.includes('live route disabled')
    || !html.includes('JSON and history CSV')
    || !html.includes('No bot workflow smoke checks loaded.')
    || !html.includes('Plan, paper-run, schedule, dossier JSON, and dossier history CSV exports use loaded local data')
    || !html.includes('Dossier view shows monitor-only live execution blocked')
    || !html.includes('Local MVP acceptance record')
    || !html.includes('After manual testing, use Record Local MVP Acceptance; it records local evidence only and keeps live execution disabled.')
    || !html.includes('Bot Review Exports')
    || !html.includes('reviewExportsEnabled')
    || !html.includes('dossierHistoryCsvExport')
    || !html.includes('filters, dossier, history CSV')
  ) {
    fail('MVP test pass page is missing bot automation review/export owner-test coverage');
  }

  pass('MVP test pass bot automation owner workflow UI');
}

function checkDashboardMvpReadinessUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/dashboard.html'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');

  if (
    !html.includes('MVP Readiness')
    || !html.includes('Completion Ledger')
    || !html.includes('id="dashboard-mvp-readiness"')
    || !html.includes('id="dashboard-completion-ledger"')
    || !html.includes('function renderCompletionLedger(ledger = {})')
    || !html.includes('Why MVP is 99%')
    || !html.includes('Local E2E Complete')
    || !html.includes('Live E2E Locked')
    || !html.includes('id="memory-export-status"')
    || !html.includes('Export System Memory JSON')
    || !html.includes('Memory snapshot loading...')
    || !html.includes('Owner evidence included · owner acceptance ${data.snapshot.ownerAcceptance.status ===')
    || !html.includes("'recorded' : 'pending'")
    || !html.includes('etherealai-system-memory-owner-evidence-')
    || !html.includes('Prepared system memory JSON · ownerEvidence included.')
    || !html.includes('id="owner-proof-surfaces"')
    || !html.includes('function renderOwnerProofSurfaces(ownerEvidence = {}, ownerAcceptance = {})')
    || !html.includes('Owner Proof Surfaces')
    || !html.includes('local proof surface(s) documented in System Memory')
    || !html.includes('Owner Acceptance:')
    || !html.includes('Owner acceptance')
    || !html.includes('completionReason')
    || !html.includes('renderOwnerProofSurfaces(data.snapshot?.ownerEvidence || {}, data.snapshot?.ownerAcceptance || {})')
    || !html.includes('No owner proof surfaces reported in System Memory.')
    || !html.includes('Owner proof surfaces unavailable.')
    || !html.includes('ownerEvidenceManifest')
    || !html.includes('ownerAcceptance')
    || !html.includes('Owner Acceptance')
    || !html.includes('formatOwnerAcceptanceStatus')
    || !html.includes('Pending Review')
    || !html.includes('manual owner review remains')
    || !html.includes('Evidence Manifest')
    || !html.includes('Evidence Checksum')
    || !html.includes('local proof point(s)')
    || !html.includes('checksum.value.slice(0, 12)')
    || !html.includes('routeSafetyProfile')
    || !html.includes('Route Boundary')
    || !html.includes('monitor_only_no_live_orders')
    || !html.includes('live route disabled')
    || !html.includes('checklistById')
    || !html.includes('endToEndBlockingItems')
    || !html.includes('dashboard-live-blockers')
    || !html.includes('Live E2E Locked Gates')
    || !html.includes('gate(s) intentionally locked, not failed')
    || !html.includes('Review live execution gate before enabling.')
    || !html.includes('Live E2E Handoff')
    || !html.includes('id="live-handoff-summary"')
    || !html.includes('id="live-handoff-key-gates"')
    || !html.includes('function renderLiveExecutionHandoff(handoff = {})')
    || !html.includes('/api/v1/live-execution-handoff')
    || !html.includes('keys stay outside EtherealAI')
    || !html.includes('Multi-Agent Coordination')
    || !html.includes('id="multi-agent-form"')
    || !html.includes('id="multi-agent-registry"')
    || !html.includes('id="multi-agent-selector"')
    || !html.includes('id="multi-agent-runs"')
    || !html.includes('Hermes Benchmark Lane')
    || !html.includes('MLX Fast Lane')
    || !html.includes('/api/v1/multi-agent/registry')
    || !html.includes('/api/v1/multi-agent/runs')
    || !html.includes('function renderMultiAgentRegistry(data = {})')
    || !html.includes('function renderMultiAgentRuns(runs = [])')
    || !html.includes('loadMultiAgentRegistry()')
    || !html.includes('loadMultiAgentRuns()')
    || !html.includes('Company Identity')
    || !html.includes('id="company-identity-summary"')
    || !html.includes('id="company-identity-checklist"')
    || !html.includes('Domain/Email Setup Center')
    || !html.includes('id="verify-public-dns"')
    || !html.includes('id="company-dns-target-form"')
    || !html.includes('id="company-dns-domain"')
    || !html.includes('id="company-dns-targets"')
    || !html.includes('Cloudflare Access Gate')
    || !html.includes('id="cloudflare-secret-reference-form"')
    || !html.includes('id="cloudflare-access-plan"')
    || !html.includes('id="cloudflare-secret-references"')
    || !html.includes('function renderCloudflareAccessPlan(accessPlan = {})')
    || !html.includes('function loadCloudflareSecretReferences()')
    || !html.includes('/api/v1/local-secret-references')
    || !html.includes('Secret value was not stored.')
    || !html.includes('function renderCompanyIdentity(data = {})')
    || !html.includes('function renderCompanyDnsTargets(data = {})')
    || !html.includes('/api/v1/company-identity')
    || !html.includes('/api/v1/company-identity/dns-targets')
    || !html.includes('/api/v1/company-identity/dns-targets/verify-public')
    || !html.includes('Token Website Domain')
    || !html.includes('Cloudflare Account')
    || !html.includes('etherealdigit.ai')
    || !html.includes('etherealdigital.ai')
    || !html.includes('patrick@etherealdigital.ai')
    || !html.includes('patrick@lakepowellford.com')
    || !html.includes('GitHub Publish Center')
    || !html.includes('id="github-publish-summary"')
    || !html.includes('id="github-publish-actions"')
    || !html.includes('id="github-publish-output"')
    || !html.includes('function renderGitHubPublishStatus(status = {})')
    || !html.includes('/api/v1/git/publish-status?owner=EtherealCoin&repo=EtherealAI')
    || !html.includes('password auth unsupported')
    || !html.includes('account creation remains owner action')
    || !styles.includes('.owner-proof-surfaces')
    || !styles.includes('.owner-proof-surface-list')
    || !styles.includes('.checkbox-grid')
  ) {
    fail('dashboard MVP readiness panel is missing owner evidence manifest summary coverage');
  }

  pass('dashboard MVP readiness owner evidence summary UI');
}

function checkOperatorControlCenterUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/operator-control.html'), 'utf8');
  const dashboard = fs.readFileSync(path.join(projectRoot, 'app/client/dashboard.html'), 'utf8');
  const home = fs.readFileSync(path.join(projectRoot, 'app/client/index.html'), 'utf8');
  const pages = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/pages.js'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');

  if (
    !pages.includes("app.get('/operator-control', requirePageAuth")
    || !pages.includes("app.get('/security-lockdown', requirePageAuth")
    || !dashboard.includes('/operator-control')
    || !dashboard.includes('/security-lockdown')
    || !home.includes('Wallet & Funding Center')
    || !home.includes('Security Lockdown Center')
    || !html.includes('Wallet & Funding Center')
    || !html.includes('Wallet Onboarding Wizard')
    || !html.includes('wallet-quick-start')
    || !html.includes('Owner Key Takeover Mode')
    || !html.includes('walletTemplates')
    || !html.includes('data-wallet-template="trading_research"')
    || !html.includes('Step-by-Step Operating Procedures')
    || !html.includes('Attach Wallet Metadata')
    || !html.includes('Connected Wallets')
    || !html.includes('Recovery And Emergency Controls')
    || !html.includes('YouTube-Style Training Content')
    || !html.includes('Wallet Permission Events')
    || !html.includes('take owner control of keys outside EtherealAI')
    || !html.includes('no seed phrase storage')
    || !html.includes('no private key storage')
    || !html.includes('no automatic signing')
    || !html.includes('no live execution')
    || !html.includes('Hardware Wallet')
    || !html.includes('Multisig')
    || !html.includes('Solana')
    || !html.includes('Custom / Other Blockchain')
    || !html.includes('Owner Approval Each Time')
    || !html.includes('data-permission-key')
    || !html.includes('/api/v1/operator-control-center')
    || !html.includes('/api/v1/wallets')
    || !html.includes('/readiness')
    || !html.includes('/revoke')
    || !html.includes('Local Connector Reference ID')
    || !html.includes('Emergency shutdown')
    || !html.includes('Recovery procedure')
    || !html.includes('Rollback protection')
    || !html.includes('operator-procedures')
    || !html.includes('/security-lockdown')
    || !html.includes('Do not paste seed phrases')
    || !html.includes('function renderPermissionControls()')
    || !html.includes('function loadOperatorCenter()')
    || !html.includes('function submitWallet(event)')
    || !styles.includes('.operator-shell')
    || !styles.includes('.operator-step-list')
    || !styles.includes('.permission-grid')
    || !styles.includes('.key-template-grid')
    || !styles.includes('.wallet-card')
  ) {
    fail('operator control center UI is missing wallet onboarding, safety, or route wiring');
  }

  pass('operator control center owner wallet UI');
}

function checkOwnerSetupWizardUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/owner-setup.html'), 'utf8');
  const dashboard = fs.readFileSync(path.join(projectRoot, 'app/client/dashboard.html'), 'utf8');
  const home = fs.readFileSync(path.join(projectRoot, 'app/client/index.html'), 'utf8');
  const header = fs.readFileSync(path.join(projectRoot, 'components/header.html'), 'utf8');
  const pages = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/pages.js'), 'utf8');
  const route = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/owner-setup-wizard.js'), 'utf8');
  const lib = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/owner-setup-wizard.js'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');

  if (
    !pages.includes("app.get('/owner-setup', requirePageAuth")
    || !dashboard.includes('/owner-setup')
    || !dashboard.includes('Open Setup Wizard')
    || !home.includes('/owner-setup')
    || !home.includes('Setup Wizard')
    || !header.includes('/owner-setup')
    || !html.includes('Setup Wizard')
    || !html.includes('Paper Trading Complete')
    || !html.includes('Core Setup Complete')
    || !html.includes('You can now safely use local paper trading. Live trading and wallet signing remain disabled.')
    || !html.includes('Optional future connections available')
    || !html.includes('live execution disabled')
    || !html.includes('no seed phrases')
    || !html.includes('no private keys')
    || !html.includes('~/EtherealAI_Secrets/.env')
    || !html.includes('Select .env File Visually')
    || !html.includes('id="selected-env-file"')
    || !html.includes('id="verify-selected-env-file"')
    || !html.includes('No .env file selected yet.')
    || !html.includes('Detected Public Wallet Address')
    || !html.includes('Use Detected Public Wallet')
    || !html.includes('Paper Trading Configuration')
    || !html.includes('Optional Future Connections')
    || !html.includes('Chain providers, exchange APIs, social tools, GitHub, and Cloudflare are optional future integrations.')
    || !html.includes('Status: Optional')
    || !html.includes('Add Public Wallet')
    || !html.includes('Skip Optional Integrations For Now')
    || !html.includes('Show Advanced Variable Names')
    || !html.includes('Market Data Providers: optional')
    || !html.includes('Exchange APIs: optional future live trading')
    || !html.includes('Social/API integrations: optional future automation')
    || !html.includes('Wallet address: add through UI')
    || !html.includes('Blocked Paper Trading Gates')
    || !html.includes('Live E2E Locked Gates')
    || !html.includes('Local Secrets File')
    || !html.includes('Public Address Only')
    || !html.includes('Save Public Wallet Metadata')
    || !html.includes('Run Paper Verification')
    || !html.includes('Create .env Template')
    || !html.includes("fetch('/api/v1/owner-setup-wizard')")
    || !html.includes('/api/v1/owner-setup-wizard/verify/')
    || !html.includes("fetch('/api/v1/owner-setup-wizard/paper-verification-run'")
    || !html.includes("fetch('/api/v1/owner-setup-wizard/env-template'")
    || !html.includes("fetch('/api/v1/wallets'")
    || !html.includes('request_signature')
    || !html.includes('trade_execution')
    || !html.includes('function buildSelectedEnvStatus(file, rawText)')
    || !html.includes('function renderSelectedEnvStatus(status = null)')
    || !html.includes('function renderPaperConfiguration(config = {})')
    || !html.includes('function renderSetupGuide(steps = [])')
    || !html.includes('function useDetectedWallet(address, source =')
    || !html.includes('values not sent to server')
    || !route.includes("app.get('/api/v1/owner-setup-wizard'")
    || !route.includes("app.post('/api/v1/owner-setup-wizard/verify/:gateId'")
    || !route.includes("app.post('/api/v1/owner-setup-wizard/paper-verification-run'")
    || !route.includes("app.post('/api/v1/owner-setup-wizard/env-template'")
    || !route.includes('createBotAutomationPaperRun')
    || !lib.includes('POLYGON_RPC_URL')
    || !lib.includes('POLYGONSCAN_API_KEY')
    || !lib.includes('OWNER_PUBLIC_WALLET_ADDRESS')
    || !lib.includes('POLYGON_PUBLIC_WALLET_ADDRESS')
    || !lib.includes('detectPublicWalletAddresses')
    || !lib.includes('visualPickerSupported: true')
    || !lib.includes('seedPhrasesAccepted: false')
    || !lib.includes('privateKeysAccepted: false')
    || !lib.includes('secretValuesReturnedByApi: false')
    || !styles.includes('.owner-progress-grid')
    || !styles.includes('.owner-gate-list')
    || !styles.includes('.owner-gate-card')
    || !styles.includes('.owner-progress-bar')
    || !styles.includes('.owner-file-picker')
    || !styles.includes('.owner-file-status')
    || !styles.includes('.owner-detected-wallet')
  ) {
    fail('owner setup wizard UI is missing non-coder gate, safe credential, wallet metadata, or route wiring');
  }

  pass('owner setup wizard UI');
}

function checkMacSecurityLockdownUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/security-lockdown.html'), 'utf8');
  const pages = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/pages.js'), 'utf8');
  const route = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/mac-security.js'), 'utf8');
  const routeRegistration = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/route-registration.js'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');

  if (
    !pages.includes("app.get('/security-lockdown', requirePageAuth")
    || !route.includes('/api/v1/mac-security/audit')
    || !route.includes('/api/v1/mac-security/guide')
    || !routeRegistration.includes("require('../routes/mac-security')")
    || !html.includes('Security Lockdown Center')
    || !html.includes('Hostile Network Mode')
    || !html.includes('Security Snapshot')
    || !html.includes('Priority Owner Actions')
    || !html.includes('Suspected Admin Or Kernel Compromise')
    || !html.includes('Clean-Room Recovery Plan')
    || !html.includes('Audit Checks')
    || !html.includes('Activity Monitor Snapshot')
    || !html.includes('Startup Persistence Review')
    || !html.includes('Outbound Network Connections')
    || !html.includes('Listening Network Services')
    || !html.includes('Manual Mac Lockdown Checklist')
    || !html.includes('Emergency Containment')
    || !html.includes('Network And Router Plan')
    || !html.includes('airbnb-network-plan')
    || !html.includes('VPN reality check')
    || !html.includes('/api/v1/mac-security/audit')
    || !html.includes('function renderPriorityActions')
    || !html.includes('function renderStartupItems')
    || !html.includes('function renderProcessActivity')
    || !html.includes('function renderOutboundConnections')
    || !html.includes('function renderListeningPorts')
    || !styles.includes('.security-shell')
    || !styles.includes('.security-status-pass')
    || !styles.includes('.security-status-fail')
  ) {
    fail('mac security lockdown UI is missing host hardening audit coverage');
  }

  pass('mac security lockdown UI');
}

function checkOwnerProofPacketUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/owner-proof-packet.html'), 'utf8');
  const route = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/owner-proof-packet.js'), 'utf8');
  const acceptanceRoute = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/owner-acceptance.js'), 'utf8');
  const pages = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/pages.js'), 'utf8');
  const systemMemory = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/system-memory.js'), 'utf8');
  const ownerEvidence = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/owner-evidence.js'), 'utf8');
  const ownerPacket = fs.readFileSync(path.join(projectRoot, 'app/server/src/lib/owner-proof-packet.js'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');

  if (
    !pages.includes("app.get('/owner-proof-packet', requirePageAuth")
    || !route.includes("app.get('/api/v1/owner-proof-packet', requireAuth")
    || !acceptanceRoute.includes("app.get('/api/v1/owner-acceptance', requireAuth")
    || !acceptanceRoute.includes("app.post('/api/v1/owner-acceptance', requireAuth")
    || !acceptanceRoute.includes('liveExecution')
    || !acceptanceRoute.includes('goLiveAllowed: false')
    || !route.includes('buildBotAutomationCapabilityPath')
    || !systemMemory.includes('buildBotAutomationCapabilityPath')
    || !systemMemory.includes('token_ecosystem_projects')
    || !systemMemory.includes('tokenEcosystemProjects')
    || !systemMemory.includes('parsers.parseTokenEcosystemProject')
    || !route.includes('addOwnerProofPacketChecksum(buildOwnerProofPacket')
    || !systemMemory.includes('buildOwnerEvidenceSnapshot()')
    || !systemMemory.includes('buildOwnerAcceptanceSummary')
    || !ownerEvidence.includes("id: 'owner_proof_packet'")
    || !ownerEvidence.includes("location: '/owner-proof-packet'")
    || !ownerPacket.includes("source: 'ownerProofPacket.withoutChecksum'")
    || !ownerPacket.includes('botAutomationCapabilityPath')
    || !ownerPacket.includes('completionLedger')
    || !ownerPacket.includes('buildPaperAutomationRunbook')
    || !ownerPacket.includes('Review ready paper plans')
    || !ownerPacket.includes('Activate a ready paper schedule')
    || !ownerPacket.includes('Export local evidence')
    || !ownerPacket.includes('Record local MVP acceptance')
    || !html.includes('Owner Proof Packet')
    || !html.includes('Download Proof Packet JSON')
    || !html.includes('Owner Test Gate')
    || !html.includes('Completion Ledger')
    || !html.includes('id="owner-completion-ledger-cards"')
    || !html.includes('id="owner-completion-ledger-gates"')
    || !html.includes('completionLedger')
    || !html.includes('Why MVP is 99%')
    || !html.includes('Local E2E Complete')
    || !html.includes('Live E2E Locked')
    || !html.includes('Owner Acceptance')
    || !html.includes('Bot Automation Path')
    || !html.includes('id="owner-bot-automation-path"')
    || !html.includes('botAutomationCapabilityPath')
    || !html.includes('Automated Paper Path')
    || !html.includes('Ready Paper Plans')
    || !html.includes('Active Paper Schedules')
    || !html.includes('Future Live Automation')
    || !html.includes('Live Blocked Gates')
    || !html.includes('Paper Automation Runbook')
    || !html.includes('id="owner-paper-automation-runbook"')
    || !html.includes('paperAutomationRunbook')
    || !html.includes('Blocked live action')
    || !html.includes('Local MVP Blockers')
    || !html.includes('ownerTestSummary')
    || !html.includes('ownerAcceptance')
    || !html.includes('id="owner-proof-packet-status"')
    || !html.includes('id="owner-proof-status"')
    || !html.includes('id="owner-proof-surface-list"')
    || !html.includes('id="owner-acceptance-summary"')
    || !html.includes('id="owner-acceptance-history"')
    || !html.includes('id="owner-acceptance-form"')
    || !html.includes('id="owner-acceptance-test-completed"')
    || !html.includes('id="owner-acceptance-packet-reviewed"')
    || !html.includes('id="owner-acceptance-live-disabled"')
    || !html.includes('id="record-owner-acceptance"')
    || !html.includes('Record Local MVP Acceptance')
    || !html.includes('latestAcceptanceRecord')
    || !html.includes('Local acceptance record #${latestAcceptanceRecord.id}')
    || !html.includes('latestOwnerAcceptanceState')
    || !html.includes('function renderOwnerAcceptanceHistory(state)')
    || !html.includes("fetchJson('/api/v1/owner-acceptance')")
    || !html.includes('No local owner acceptance records yet.')
    || !html.includes('refreshOwnerProofPacket')
    || !html.includes("fetch('/api/v1/owner-acceptance'")
    || !html.includes('Recorded local MVP acceptance #${data.record.id} · live disabled.')
    || !html.includes('id="owner-export-surface-list"')
    || !html.includes('id="owner-live-blocker-list"')
    || !html.includes('id="owner-route-safety-summary"')
    || !html.includes('formatOwnerAcceptanceStatus')
    || !html.includes('Pending Review')
    || !html.includes("fetchJson('/api/v1/owner-proof-packet')")
    || !html.includes('Packet Checksum')
    || !html.includes('fullLiveBlockers')
    || !html.includes('routeSafety')
    || !html.includes('etherealai-owner-proof-packet-')
    || !html.includes('Prepared owner proof packet JSON · sha256 ${checksumPrefix} · live disabled.')
    || !html.includes('Ready · ${latestOwnerProofPacket.proofSurfaces.length} proof surface(s) · sha256 ${checksumPrefix} · live disabled.')
    || !html.includes('class="auth-proof-banner"')
    || !html.includes('proof packet is local JSON only')
    || !html.includes('no live order endpoint')
    || !html.includes('ETHEREALAI_VERIFY_SERVER=1')
    || !styles.includes('.owner-proof-command')
  ) {
    fail('owner proof packet page is missing local proof aggregation/export coverage');
  }

  pass('owner proof packet local evidence export UI');
}

function checkHomeLocalProofUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/index.html'), 'utf8');
  const header = fs.readFileSync(path.join(projectRoot, 'components/header.html'), 'utf8');
  const footer = fs.readFileSync(path.join(projectRoot, 'components/footer.html'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');
  const headerStyles = fs.readFileSync(path.join(projectRoot, 'styles/components/header.css'), 'utf8');

  if (
    !html.includes('Home / Mission Control')
    || !html.includes('Operate EtherealAI as founder software')
    || !html.includes('Open Mission Control')
    || !html.includes('What do I do next?')
    || !html.includes('Open Setup Wizard')
    || !html.includes('Open Paper Trading Center')
    || !html.includes('System Health')
    || !html.includes('Paper Trading')
    || !html.includes('Local E2E Readiness')
    || !html.includes('Live Execution')
    || !html.includes('Loading next recommended action')
    || !html.includes('Main Operating Areas')
    || !html.includes('Setup Wizard')
    || !html.includes('Strategy Builder')
    || !html.includes('Paper Trading Center')
    || !html.includes('Bot Control Center')
    || !html.includes('Wallet & Funding Center')
    || !html.includes('Security Lockdown Center')
    || !html.includes('Owner Evidence Manifest')
    || !html.includes('Review local proof rows, checksum marker, and live-blocked checklist.')
    || !html.includes('Owner Proof Packet')
    || !html.includes('Download one local JSON packet with readiness, proof surfaces, route safety, and blocked live gates.')
    || !html.includes('Advanced / Developer Tools')
    || !html.includes('window.EtherealOperatorAssistant.collectState')
    || !html.includes('home-next-action')
    || !html.includes('home-mission-status')
    || !header.includes('MVP 100% · Local E2E 100% · Live E2E locked')
    || !header.includes('/owner-proof-packet')
    || !header.includes('/security-lockdown')
    || !header.includes('/mvp-test-pass')
    || !header.includes('/server-route-inventory')
    || !footer.includes('Local Proof')
    || !footer.includes('MVP 100%, Local E2E complete for paper operation, Live E2E locked, and live execution disabled.')
    || !footer.includes('Owner proof packet')
    || !footer.includes('Owner evidence manifest')
    || !footer.includes('no live order endpoint enabled')
    || !styles.includes('.home-proof-grid')
    || !styles.includes('.home-workflow-grid')
    || !styles.includes('.home-workflow-card')
    || !styles.includes('.header-proof-strip')
    || !styles.includes('.footer-content')
    || !headerStyles.includes('.header-proof-strip')
  ) {
    fail('home page is missing local proof status and owner workflow gateway');
  }

  pass('home local proof status UI');
}

function checkSimpleOperatorModeUsabilityRefactor() {
  const operatorMode = fs.readFileSync(path.join(projectRoot, 'app/client/js/operator-mode.js'), 'utf8');
  const operatorNext = fs.readFileSync(path.join(projectRoot, 'app/client/js/operator-next-action.js'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');
  const header = fs.readFileSync(path.join(projectRoot, 'components/header.html'), 'utf8');
  const login = fs.readFileSync(path.join(projectRoot, 'app/client/login.html'), 'utf8');
  const logoPath = path.join(projectRoot, 'app/client/public/brand/etherealai-logo.png');
  const pages = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/pages.js'), 'utf8');
  const manual = fs.readFileSync(path.join(projectRoot, 'app/client/operator-manual.html'), 'utf8');
  const mainPages = [
    'app/client/dashboard.html',
    'app/client/owner-setup.html',
    'app/client/strategy-lab.html',
    'app/client/operator-control.html',
    'app/client/security-lockdown.html',
    'app/client/solidity-lab.html',
    'app/client/social-ops.html',
    'app/client/creator.html',
    'app/client/live-trading-launch.html',
    'app/client/operator-manual.html',
    'app/client/operator-training.html'
  ];

  if (
    !operatorMode.includes('data-operator-answers')
    || !operatorMode.includes('Guided Workflow')
    || !operatorMode.includes('data-operator-recommended-action')
    || !operatorMode.includes('Start Here / Operator Manual')
    || !operatorMode.includes('Operator Training Library')
    || !operatorMode.includes('data-operator-training-toggle')
    || !operatorMode.includes('data-operator-training-choice="text"')
    || !operatorMode.includes('data-operator-training-choice="video"')
    || !operatorMode.includes("BRAND_LOGO_SRC = '/public/brand/etherealai-logo.png'")
    || !operatorMode.includes('operator-brand-logo')
    || !operatorMode.includes('operator-mode-logo')
    || !operatorMode.includes('No terminal commands are required for normal Simple Mode operation.')
    || !operatorMode.includes('operator-guided-focus')
    || !operatorMode.includes('The recommended next button is highlighted on the page.')
    || !operatorMode.includes("'/operator-manual'")
    || !operatorMode.includes("'/operator-training'")
    || !operatorMode.includes('Create strategy')
    || !operatorMode.includes('Run This Strategy Safely')
    || !operatorMode.includes('Safe Paper Test')
    || !operatorMode.includes('Advanced records')
    || !operatorMode.includes('Review results')
    || !operatorMode.includes('Select Chain-Neutral Defaults')
    || operatorMode.includes('Select Polygon Defaults')
    || !operatorMode.includes('Working')
    || !operatorMode.includes('Optional')
    || !operatorMode.includes('Locked')
    || !operatorMode.includes('Unsafe')
    || operatorNext.includes('fullProgress < 100')
    || operatorNext.includes('Add Wallet Public Metadata')
    || operatorNext.includes('Polygon')
    || !operatorNext.includes('Build strategy, run paper test, review paper bot results, create token plan, draft website/social content, or review security tasks.')
    || !operatorNext.includes('Live E2E is locked for future owner-approved security work.')
    || !operatorNext.includes('Local E2E Complete')
    || !operatorNext.includes('function statusTone')
    || !operatorNext.includes('status-warning')
    || !operatorNext.includes('renderStatusTile')
    || !styles.includes('prefers-color-scheme: dark')
    || !styles.includes('--brand-pink')
    || !styles.includes('--brand-purple')
    || !styles.includes('--brand-blue')
    || !styles.includes('--status-success')
    || !styles.includes('--status-warning')
    || !styles.includes('--status-danger')
    || !styles.includes('--status-info')
    || !styles.includes('.operator-next-action-panel .button-row .cta-button')
    || !styles.includes('background: var(--status-warning-bg)')
    || !styles.includes('.ethereal-brand-lockup')
    || !styles.includes('.operator-brand-logo')
    || !styles.includes('.operator-mode-logo')
    || !styles.includes('.login-brand-mark')
    || !header.includes('/public/brand/etherealai-logo.png')
    || !header.includes('EtherealAI logo')
    || !login.includes('login-brand-mark')
    || !fs.existsSync(logoPath)
    || !styles.includes('.operator-answer-panel')
    || !styles.includes('.operator-guided-workflow')
    || !styles.includes('.operator-training-menu')
    || !styles.includes('.operator-simple-mode .operator-simple-keep .model-output:not(.owner-action-output)')
    || !styles.includes('.operator-simple-mode .operator-guided-focus')
    || !pages.includes("app.get('/operator-manual', requirePageAuth")
    || !pages.includes("app.get('/operator-training', requirePageAuth")
    || !manual.includes('Start Here Walkthrough')
    || !manual.includes('Paper trading does not require exchange APIs, live trading, wallet signing, seed phrases, private keys, or terminal commands.')
    || !manual.includes('Optional is not failed')
    || !manual.includes('No terminal commands for normal use')
  ) {
    fail('simple operator mode shell did not expose the beginner operator workflow, manual, or nonblocking next-action behavior');
  }

  for (const relativePath of mainPages) {
    const html = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

    if (
      !html.includes('/js/operator-next-action.js')
      || !html.includes('/js/operator-training.js')
      || !html.includes('/js/operator-mode.js')
    ) {
      fail(`${relativePath} is missing the global beginner operator shell scripts`);
    }
  }

  pass('simple operator mode beginner usability refactor');
}

function checkOperatorTrainingSystem() {
  const training = fs.readFileSync(path.join(projectRoot, 'app/client/js/operator-training.js'), 'utf8');
  const operatorMode = fs.readFileSync(path.join(projectRoot, 'app/client/js/operator-mode.js'), 'utf8');
  const trainingPage = fs.readFileSync(path.join(projectRoot, 'app/client/operator-training.html'), 'utf8');
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');
  const pages = fs.readFileSync(path.join(projectRoot, 'app/server/src/routes/pages.js'), 'utf8');
  const requiredModules = [
    'Start EtherealAI',
    'Read Mission Control',
    'Complete Setup Wizard',
    'Add Wallet Metadata Safely',
    'Review Security',
    'Use Proof Packet',
    'Confirm MVP Test Pass',
    'Review Route Inventory',
    'Use Creator Agent',
    'Build and Paper Test Strategy',
    'Use Solidity Lab',
    'Use Social Ops'
  ];
  const requiredPages = [
    'app/client/index.html',
    'app/client/dashboard.html',
    'app/client/owner-setup.html',
    'app/client/operator-control.html',
    'app/client/security-lockdown.html',
    'app/client/owner-proof-packet.html',
    'app/client/mvp-test-pass.html',
    'app/client/server-route-inventory.html',
    'app/client/creator.html',
    'app/client/strategy-lab.html',
    'app/client/solidity-lab.html',
    'app/client/social-ops.html',
    'app/client/operator-manual.html',
    'app/client/operator-training.html'
  ];

  for (const title of requiredModules) {
    if (!training.includes(title)) {
      fail(`operator training catalog is missing ${title}`);
    }
  }

  if (
    !training.includes('Show me in text')
    || !training.includes('Show me in video')
    || !training.includes('Start walkthrough')
    || !training.includes('Replay this step')
    || !training.includes('Pause here and verify')
    || !training.includes('Placeholder Video Player')
    || !training.includes('Transcript')
    || !training.includes('Video asset plan')
    || !training.includes('scripts/render-training-video.swift')
    || !training.includes('Live trading stays locked')
    || !training.includes('Wallet signing stays locked')
    || !training.includes('Do not enter seed phrases')
    || !training.includes('Optional API keys')
    || !training.includes('renderLibrary')
    || !training.includes('window.EtherealTraining')
    || !operatorMode.includes('data-operator-training-toggle')
    || !operatorMode.includes('data-operator-training-choice="text"')
    || !operatorMode.includes('data-operator-training-choice="video"')
    || !operatorMode.includes('window.EtherealTraining.open')
    || !operatorMode.includes('Operator Training Library')
    || !trainingPage.includes('operator-training-library-root')
    || !trainingPage.includes('Operator Training Library')
    || !trainingPage.includes('/js/operator-training.js')
    || !trainingPage.includes('window.EtherealTraining?.renderLibrary')
    || !pages.includes("app.get('/operator-training', requirePageAuth")
    || !styles.includes('.operator-training-overlay')
    || !styles.includes('.operator-training-menu-list')
    || !styles.includes('.training-video-player')
    || !styles.includes('.training-transcript')
    || !styles.includes('.training-library-grid')
  ) {
    fail('operator text/video training system is missing catalog, dropdown, library, video placeholder, transcript, or route wiring');
  }

  for (const relativePath of requiredPages) {
    const html = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

    if (!html.includes('/js/operator-training.js') || !html.includes('/js/operator-mode.js')) {
      fail(`${relativePath} is missing operator training scripts`);
    }
  }

  pass('operator text/video training library');
}

function checkAuthenticatedProofBanners() {
  const proofPages = [
    'app/client/creator.html',
    'app/client/strategy-lab.html',
    'app/client/solidity-lab.html',
    'app/client/social-ops.html',
    'app/client/server-route-inventory.html'
  ];
  const styles = fs.readFileSync(path.join(projectRoot, 'app/client/styles.css'), 'utf8');

  for (const page of proofPages) {
    const html = fs.readFileSync(path.join(projectRoot, page), 'utf8');

    if (
      !html.includes('class="auth-proof-banner"')
      || !html.includes('MVP 100% · Local E2E 100%')
      || !html.includes('Live execution disabled')
      || !html.includes('/owner-proof-packet')
      || !html.includes('Proof packet')
      || !html.includes('/mvp-test-pass')
      || !html.includes('Owner evidence')
      || !html.includes('/dashboard')
    ) {
      fail(`${page} is missing the authenticated proof/status banner`);
    }
  }

  if (
    !styles.includes('.auth-proof-banner')
    || !styles.includes('border-left: 4px solid #2563eb')
    || !styles.includes('.auth-proof-banner a')
  ) {
    fail('authenticated proof/status banner styles are missing');
  }

  pass('authenticated proof/status banners');
}

function checkRouteInventoryOwnerProofUi() {
  const html = fs.readFileSync(path.join(projectRoot, 'app/client/server-route-inventory.html'), 'utf8');

  if (
    !html.includes('Owner Proof Coverage')
    || !html.includes('id="owner-proof-coverage"')
    || !html.includes('function renderProofCoverage(ownerEvidence = {}, ownerAcceptance = {}, ownerAcceptanceRecords = [])')
    || !html.includes('ownerAcceptance')
    || !html.includes('Owner Acceptance')
    || !html.includes('Acceptance Records')
    || !html.includes('latestOwnerAcceptanceRecord')
    || !html.includes('latest local record #${latestOwnerAcceptanceRecord.id}')
    || !html.includes('no local acceptance record yet')
    || !html.includes('formatOwnerAcceptanceStatus')
    || !html.includes('Pending Review')
    || !html.includes('manual owner review remains')
    || !html.includes('memoryData.snapshot?.recent?.ownerAcceptanceRecords || []')
    || !html.includes("fetch('/api/v1/system-memory')")
    || !html.includes('proofSurfaces')
    || !html.includes('exportSurfaces')
    || !html.includes('fullLiveBlockers')
    || !html.includes('routeBoundary')
    || !html.includes('owner proof packet cross-check')
    || !html.includes('live execution disabled')
    || !html.includes('JSON/CSV local evidence')
  ) {
    fail('route inventory page is missing owner proof coverage cross-check UI');
  }

  pass('route inventory owner proof coverage UI');
}

function checkLocalOnlySurfaceCues() {
  const social = fs.readFileSync(path.join(projectRoot, 'app/client/social-ops.html'), 'utf8');
  const solidity = fs.readFileSync(path.join(projectRoot, 'app/client/solidity-lab.html'), 'utf8');

  if (
    !social.includes('Local-Only Safety')
    || !social.includes('Public Posting')
    || !social.includes('drafts stay local')
    || !social.includes('External Connectors')
    || !social.includes('no social network API calls')
    || !social.includes('Owner Review')
    || !social.includes('save drafts before any future posting phase')
    || !social.includes('Token Community Manager')
    || !social.includes('Create Listing / Community Drafts')
    || !social.includes('/api/v1/social-posts/token-projects/')
    || !social.includes('no fake volume, spam, bribes, or bypass')
    || !social.includes('<option value="medium">Medium</option>')
    || !social.includes('<option value="farcaster">Farcaster</option>')
    || !social.includes('<option value="docs">Docs Portal</option>')
  ) {
    fail('Social Ops is missing local-only safety cues');
  }

  if (
    !solidity.includes('Deployment Boundary')
    || !solidity.includes('Deployment')
    || !solidity.includes('Local Only')
    || !solidity.includes('no mainnet or testnet broadcast')
    || !solidity.includes('Wallet Secrets')
    || !solidity.includes('private keys are not accepted')
    || !solidity.includes('draft, test, and audit before any future deploy phase')
    || !solidity.includes('Token Ecosystem Studio')
    || !solidity.includes('Token Creation Options')
    || !solidity.includes('Token Ecosystem Projects')
    || !solidity.includes('Save Ecosystem Project')
    || !solidity.includes('Update Selected Project')
    || !solidity.includes('Load For Edit')
    || !solidity.includes('Generate Workspace')
    || !solidity.includes('Website Package')
    || !solidity.includes('Cloudflare Plan')
    || !solidity.includes('Artifact Manifest')
    || !solidity.includes('Archive Project')
    || !solidity.includes('/api/v1/token-ecosystem-projects')
    || !solidity.includes("method: 'PATCH'")
    || !solidity.includes("method: 'DELETE'")
    || !solidity.includes('/workspace')
    || !solidity.includes('/website-deploy-package')
    || !solidity.includes('/cloudflare-dns-plan')
    || !solidity.includes('/artifacts')
    || !solidity.includes('Passive income / rewards model')
    || !solidity.includes('NFT utility upgrades')
    || !solidity.includes('Top-200 rebalance bot')
    || !solidity.includes('Apply Token Options To Spec')
    || !solidity.includes('Select Low-Fee Launch Defaults')
    || !solidity.includes('Select Chain-Neutral Launch Defaults')
    || !solidity.includes('Polygon selected for this project only')
    || !solidity.includes('Polygon Operating Profile')
    || !solidity.includes('Target Blockchain')
    || !solidity.includes('Solana SPL Token')
    || !solidity.includes('Cardano Native Asset')
    || !solidity.includes('Algorand ASA')
    || !solidity.includes('Hedera Token Service')
    || !solidity.includes('Bitcoin Rune / BRC-20 Plan')
    || !solidity.includes('Solana')
    || !solidity.includes('Polygon')
    || !solidity.includes('BNB Chain')
    || !solidity.includes('Avalanche')
    || !solidity.includes('Base')
    || !solidity.includes('Cardano')
    || !solidity.includes('Algorand')
    || !solidity.includes('Stellar')
    || !solidity.includes('XRP Ledger')
    || !solidity.includes('Hedera')
    || !solidity.includes('Tezos')
    || !solidity.includes('Flow')
    || !solidity.includes('TON')
    || !solidity.includes('zkSync Era')
    || !solidity.includes('Hyperliquid')
    || !solidity.includes('Custom / Any Other Blockchain')
    || !solidity.includes('Multi-Chain Token Builder')
    || !solidity.includes('Website Creation Center')
    || !solidity.includes('Whitepaper Generator')
    || !solidity.includes('Chain Builder And Node Research')
    || !solidity.includes('Listing Readiness')
    || !solidity.includes('Cross-Chain Arbitrage Design')
    || !solidity.includes('Discord, Telegram, YouTube, Medium, X, docs')
    || !solidity.includes('no deploy, no wallet keys, no external posting')
  ) {
    fail('Solidity Lab is missing local-only deployment boundary cues');
  }

  pass('local-only external surface cues');
}

function checkMvpOwnerTestPassDoc() {
  const doc = fs.readFileSync(path.join(projectRoot, 'MVP_OWNER_TEST_PASS.md'), 'utf8');

  if (
    !doc.includes('local E2E readiness is `100%` when paper automation and public wallet metadata are present')
    || !doc.includes('Completion Ledger explains why MVP is 99%, why Local E2E is complete when paper/wallet/live-lock requirements are satisfied, and why Live E2E is locked.')
    || !doc.includes('Completion Ledger shows owner acceptance recorded moves MVP from `99%` to `100%`')
    || !doc.includes('Completion Ledger is present in the proof packet and lists owner acceptance, active paper schedule review, and blocked live gates.')
    || !doc.includes('MVP Readiness shows Owner Acceptance as `Pending Review`.')
    || !doc.includes('System Memory export shows owner evidence included, owner acceptance pending, and live disabled')
    || !doc.includes('Bot Automation Smoke shows monitor-only workflow status')
    || !doc.includes('Owner Evidence Manifest lists local proof points')
    || !doc.includes('Download Evidence Manifest JSON')
    || !doc.includes('Owner Evidence Review Checklist lists local proof rows, checksum marker, and confirms live execution remains blocked.')
    || !doc.includes('Owner Acceptance Record shows the current local acceptance state, zero records before final owner acceptance, and live execution disabled.')
    || !doc.includes('Open `/owner-proof-packet`')
    || !doc.includes('Download Proof Packet JSON')
    || !doc.includes('Owner Test Gate shows `Ready` and Local MVP Blockers shows `0`.')
    || !doc.includes('Owner Acceptance shows `Pending Review`; this is expected until manual owner testing records final acceptance.')
    || !doc.includes('`Record Local MVP Acceptance` remains disabled until the local test pass, proof-packet review, and live-disabled acknowledgement boxes are checked.')
    || !doc.includes('`Download Proof Packet JSON` is enabled after `/api/v1/owner-proof-packet` loads.')
    || !doc.includes('Packet Checksum shows a SHA-256 prefix and the downloaded JSON includes the full checksum.')
    || !doc.includes('Proof Surfaces include owner proof packet, dashboard readiness, MVP Test Pass, Operator Control, Mac Security Lockdown, route inventory, Strategy Lab, Social Ops, and Solidity Lab.')
    || !doc.includes('Owner Setup Wizard is included as a local proof surface with no secret values returned and live execution disabled.')
    || !doc.includes('Open `/owner-setup`')
    || !doc.includes('Paper 95→100')
    || !doc.includes('Local E2E Complete')
    || !doc.includes('Live E2E Locked')
    || !doc.includes('~/EtherealAI_Secrets/.env')
    || !doc.includes('Open `/operator-control`')
    || !doc.includes('Wallet Onboarding Wizard explains the owner key handoff in plain English and shows the simplest safe key-control path.')
    || !doc.includes('Owner Key Takeover Mode shows Trading Research, Token Deployment, Treasury, and Recovery templates')
    || !doc.includes('Open `/security-lockdown`')
    || !doc.includes('Security Snapshot loads from `/api/v1/mac-security/audit`')
    || !doc.includes('## Mac Security Lockdown Workflow')
    || !doc.includes('Safe user-level hardening applied in this session')
    || !doc.includes('## Owner Wallet Control Workflow')
    || !doc.includes('## Owner Setup Wizard Workflow')
    || !doc.includes('Live E2E readiness is locked until a future owner-approved process exists.')
    || !doc.includes('Revocation is the emergency shutdown path for a wallet record')
    || !doc.includes('Bot Automation Path shows Automated Paper Path, Ready Paper Plans, Active Paper Schedules, Future Live Automation blocked, Live Blocked Gates, and no live order endpoint.')
    || !doc.includes('Paper Automation Runbook lists the monitor-only owner steps')
    || !doc.includes('route boundary `monitor_only_no_live_orders`')
    || !doc.includes('Confirm Automated Paper Path shows current paper automation state and Future Live Automation remains blocked.')
    || !doc.includes('Export the safety dossier JSON and dossier history CSV')
    || !doc.includes('## Monitor-Only Bot Workflow')
    || !doc.includes('Automated Paper Path panel backed by `/api/v1/bot-automation-capability-path`')
    || !doc.includes('Owner Proof Packet includes a Paper Automation Runbook for monitor-only owner testing')
    || !doc.includes('MVP Test Pass can export the owner evidence manifest as a local JSON snapshot.')
    || !doc.includes('`sha256` checksum for its artifact list')
    || !doc.includes('Owner Evidence Review Checklist that maps each proof point to its source and owner check')
    || !doc.includes('no live exchange adapter, no live order endpoint, and no exchange order placement')
    || !doc.includes('Test Solidity Lab locally')
    || !doc.includes('Deployment Boundary shows local-only deployment, wallet secrets blocked, and no mainnet or testnet broadcast')
    || !doc.includes('Test Social Ops locally')
    || !doc.includes('Local-Only Safety shows public posting disabled, no social network API calls, and owner review required')
    || !doc.includes('Record local MVP acceptance only after the manual pass is complete.')
    || !doc.includes('Use `Record Local MVP Acceptance`.')
    || !doc.includes('the record is saved locally and live execution remains disabled')
    || !doc.includes('Local E2E completion: `100%` when paper automation, public wallet metadata, and live locks are satisfied')
    || !doc.includes('Live E2E readiness: locked until future owner-approved security work')
    || !doc.includes('The Completion Ledger explains these states in the app.')
    || !doc.includes('## Live E2E Locked Gates')
    || !doc.includes('Live E2E remains locked because these 4 gates are intentionally blocked')
    || !doc.includes('Runtime credential loader is implemented')
    || !doc.includes('Live exchange order adapters are implemented')
    || !doc.includes('Live order endpoint is enabled')
    || !doc.includes('Owner go-live command can execute')
    || !doc.includes('future work must add local-only loading with no secret logging')
    || !doc.includes('future work must replace disabled scaffolds with reviewed exchange-specific adapters')
  ) {
    fail('MVP owner test pass doc is missing monitor-only bot workflow guidance');
  }

  pass('MVP owner test pass doc');
}

function checkProjectHandoffDoc() {
  const doc = fs.readFileSync(path.join(projectRoot, 'PROJECT_HANDOFF.md'), 'utf8');

  if (
    !doc.includes('Date: 2026-05-18')
    || !(
      doc.includes('Owner-test local MVP: about 99% complete.')
      || doc.includes('Owner-test local MVP: 100% after the local owner acceptance record; 99% before owner acceptance in a fresh database.')
    )
    || !doc.includes('Local E2E path: complete for safe local paper operation')
    || !(
      doc.includes('Live E2E path: locked because credential loading')
      || doc.includes('Live E2E path: locked for unrestricted/autonomous use.')
    )
    || !doc.includes('## Current Owner-Test Snapshot')
    || !doc.includes('Owner evidence included · owner acceptance pending · live disabled')
    || !doc.includes('the completion ledger explaining why MVP/local paper/full live percentages are gated')
    || !doc.includes('/owner-setup` is the non-coder Owner Setup Wizard')
    || !doc.includes('/api/v1/owner-setup-wizard')
    || !doc.includes('setup_wizard_no_secret_values_no_live_execution')
    || !doc.includes('owner-test gate status')
    || !doc.includes('owner acceptance pending status')
    || !doc.includes('the bot automation capability path')
    || !doc.includes('the monitor-only paper automation runbook')
    || !doc.includes('/api/v1/owner-acceptance')
    || !doc.includes('can record a local-only owner acceptance record after manual testing')
    || !doc.includes('Owner acceptance remains `pending_owner_review`')
    || !doc.includes('/owner-proof-packet')
    || !doc.includes('/api/v1/owner-proof-packet')
    || !doc.includes('local JSON-downloadable packet')
    || !doc.includes('SHA-256 packet checksum')
    || !doc.includes('Owner Evidence Review Checklist')
    || !doc.includes('manifest `sha256` checksum prefix')
    || !doc.includes('the completion ledger')
    || !doc.includes('current local owner acceptance record state')
    || !doc.includes('Owner Acceptance Record panel backed by `/api/v1/owner-acceptance`')
    || !doc.includes('automated bot capability path backed by `/api/v1/bot-automation-capability-path`')
    || !doc.includes('current paper automation from future live automation blockers')
    || !doc.includes('owner proof surfaces')
    || !doc.includes('`ownerAcceptance`')
    || !doc.includes('`botAutomationCapabilityPath`')
    || !doc.includes('owner proof packet, dashboard readiness, MVP test pass, Owner Setup Wizard, Operator Control, Mac Security Lockdown, route inventory, Strategy Lab, Social Ops, and Solidity Lab')
    || !doc.includes('/operator-control` is the non-coder Operator Control Center')
    || !doc.includes('/security-lockdown` is the non-coder Mac Security Lockdown Center')
    || !doc.includes('/api/v1/operator-control-center')
    || !doc.includes('/api/v1/mac-security/audit')
    || !doc.includes('read_only_local_mac_audit_no_privileged_mutation')
    || !doc.includes('owner_wallets')
    || !doc.includes('wallet_permission_events')
    || !doc.includes('metadata_only_no_wallet_secrets')
    || !doc.includes('Owner Proof Packet added at `/owner-proof-packet`')
    || !doc.includes('Owner Proof Packet and System Memory now include the automated bot capability path')
    || !doc.includes('Owner Proof Packet now includes a monitor-only Paper Automation Runbook')
    || !doc.includes('Dashboard, MVP Test Pass, and Owner Proof Packet now show a Completion Ledger')
    || !doc.includes('owner-test gate status, owner acceptance pending status, recent local acceptance records')
    || !doc.includes('proof packet page also shows recent local acceptance records from the protected API')
    || !doc.includes('Dashboard System Memory export now includes owner-evidence references, owner acceptance pending status')
    || !doc.includes('Owner Proof Coverage counts, owner acceptance pending status, and local acceptance record count from System Memory')
    || !doc.includes('Route Inventory now cross-checks Owner Proof Coverage, owner acceptance pending status, and local acceptance record count from System Memory')
    || !doc.includes('Owner Setup Wizard added at `/owner-setup`')
    || !doc.includes('external-surface boundaries for Social Ops, Solidity Lab, owner setup, wallet control, and Mac security')
    || !doc.includes('Social Ops remains local draft-only')
    || !doc.includes('Solidity Lab remains local scaffold/review only')
    || !doc.includes('Solidity Lab now includes a local Token Ecosystem Studio')
    || !doc.includes('/api/v1/solidity-ecosystem/catalog')
    || !doc.includes('/api/v1/solidity-contracts/:id/ecosystem-blueprint')
    || !doc.includes('token/NFT utility, website sections, whitepaper templates, logo briefs')
    || !doc.includes('CoinMarketCap/CoinGecko readiness')
    || !doc.includes('EtherealAI is now running from app/server/src/server.js with protected app/client pages')
    || doc.includes('EtherealAI is mid-refactor from root-level HTML files to app/client')
    || !doc.includes('ETHEREALAI_VERIFY_SERVER=1')
    || !doc.includes('local_drafts_no_external_posting')
    || !doc.includes('local_scaffold_no_deployment')
  ) {
    fail('project handoff doc is missing current owner-test snapshot');
  }

  pass('project handoff doc');
}

function getSetCookie(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }

  const cookie = headers.get('set-cookie');
  return cookie ? [cookie] : [];
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = {};

  if (text) {
    try {
      body = JSON.parse(text);
    } catch (error) {
      fail(`Expected JSON from ${url}, received: ${text.slice(0, 200)}`);
    }
  }

  if (!response.ok) {
    fail(`${url} returned HTTP ${response.status}: ${JSON.stringify(body)}`);
  }

  return {
    body,
    headers: response.headers
  };
}

async function fetchJsonExpectStatus(url, options = {}, expectedStatus = 200) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = {};

  if (text) {
    try {
      body = JSON.parse(text);
    } catch (error) {
      fail(`Expected JSON from ${url}, received: ${text.slice(0, 200)}`);
    }
  }

  if (response.status !== expectedStatus) {
    fail(`${url} returned HTTP ${response.status}, expected ${expectedStatus}: ${JSON.stringify(body)}`);
  }

  return {
    body,
    headers: response.headers
  };
}

function authJsonHeaders(cookie) {
  return {
    Cookie: cookie,
    'Content-Type': 'application/json'
  };
}

function buildVerificationCsv(baseTimestamp) {
  const start = new Date(baseTimestamp);

  return [
    'timestamp,open,high,low,close,volume',
    ...Array.from({ length: 8 }, (_, index) => {
      const timestamp = new Date(start.getTime() + (index * 60 * 60 * 1000)).toISOString();
      const open = 100 + index;
      const close = index % 2 === 0 ? open + 2 : open - 1;
      const high = Math.max(open, close) + 1;
      const low = Math.min(open, close) - 1;
      const volume = 1000 + (index * 25);

      return [timestamp, open, high, low, close, volume].join(',');
    })
  ].join('\n');
}

async function fetchJsonForCleanup(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = {};

  if (text) {
    try {
      body = JSON.parse(text);
    } catch (error) {
      return {
        ok: false,
        status: response.status,
        body: { error: `Expected JSON, received: ${text.slice(0, 200)}` }
      };
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    body
  };
}

async function cleanupBotAutomationFixture(baseUrl, cookie, fixture) {
  const errors = [];
  const headers = authJsonHeaders(cookie);

  async function archive(label, url, body) {
    const result = await fetchJsonForCleanup(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    });

    if (!result.ok) {
      errors.push(`${label} archive failed with HTTP ${result.status}: ${JSON.stringify(result.body)}`);
    }
  }

  if (fixture.scheduleId) {
    await archive(
      `schedule #${fixture.scheduleId}`,
      `${baseUrl}/api/v1/bot-automation-schedules/${fixture.scheduleId}`,
      { status: 'archived' }
    );
  }

  for (const planId of fixture.botPlanIds || []) {
    await archive(
      `bot plan #${planId}`,
      `${baseUrl}/api/v1/bot-automation-plans/${planId}`,
      { status: 'archived' }
    );
  }

  if (fixture.riskProfileId) {
    await archive(
      `risk profile #${fixture.riskProfileId}`,
      `${baseUrl}/api/v1/risk-profiles/${fixture.riskProfileId}`,
      { status: 'archived', notes: 'Verification fixture archived after checks.' }
    );
  }

  if (fixture.marketImportId) {
    await archive(
      `market import #${fixture.marketImportId}`,
      `${baseUrl}/api/v1/market-data/imports/${fixture.marketImportId}`,
      { status: 'archived' }
    );
  }

  if (fixture.scheduleId) {
    const result = await fetchJsonForCleanup(`${baseUrl}/api/v1/bot-automation-schedules/${fixture.scheduleId}`, {
      headers: { Cookie: cookie }
    });

    if (!result.ok || result.body.schedule?.status !== 'archived') {
      errors.push(`schedule #${fixture.scheduleId} cleanup status is not archived`);
    }
  }

  if (fixture.riskProfileId) {
    const result = await fetchJsonForCleanup(`${baseUrl}/api/v1/risk-profiles/${fixture.riskProfileId}`, {
      headers: { Cookie: cookie }
    });

    if (!result.ok || result.body.profile?.status !== 'archived') {
      errors.push(`risk profile #${fixture.riskProfileId} cleanup status is not archived`);
    }
  }

  for (const planId of fixture.botPlanIds || []) {
    const result = await fetchJsonForCleanup(`${baseUrl}/api/v1/bot-automation-plans/${planId}`, {
      headers: { Cookie: cookie }
    });

    if (!result.ok || result.body.plan?.status !== 'archived') {
      errors.push(`bot plan #${planId} cleanup status is not archived`);
    }
  }

  if (fixture.marketImportId) {
    const result = await fetchJsonForCleanup(`${baseUrl}/api/v1/market-data/imports/${fixture.marketImportId}`, {
      headers: { Cookie: cookie }
    });

    if (!result.ok || result.body.import?.status !== 'archived') {
      errors.push(`market import #${fixture.marketImportId} cleanup status is not archived`);
    }
  }

  return errors;
}

async function runBotAutomationFixtureChecks(baseUrl, cookie) {
  const now = Date.now();
  const fixtureTag = `verify-${now}`;
  const marketSymbol = `EAI${String(now).slice(-8)}/USDT`;
  const timeframe = '1h';
  const headers = authJsonHeaders(cookie);
  const fixture = { botPlanIds: [] };
  let primaryError = null;

  try {
    const marketImport = await fetchJson(`${baseUrl}/api/v1/market-data/imports`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        label: `Baseline fixture import ${fixtureTag}`,
        marketSymbol,
        timeframe,
        notes: 'Created by scripts/verify-local-baseline.js authenticated fixture check.',
        csvText: buildVerificationCsv(now)
      })
    });
    fixture.marketImportId = marketImport.body.import.id;

    const strategy = await fetchJson(`${baseUrl}/api/v1/strategies`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `Baseline fixture strategy ${fixtureTag}`,
        marketSymbol,
        timeframe,
        entryRules: 'green candle',
        exitRules: 'red candle',
        stopLoss: 5,
        takeProfit: 8,
        riskNotes: 'Verification fixture only. No live trading.'
      })
    });
    const riskProfile = await fetchJson(`${baseUrl}/api/v1/risk-profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `Baseline fixture risk ${fixtureTag}`,
        mode: 'paper',
        maxOrderValue: 1000,
        maxPositionValue: 2500,
        maxDailyLoss: 500,
        maxOpenTrades: 3,
        killSwitchEnabled: false,
        notes: 'Verification fixture only.'
      })
    });
    fixture.riskProfileId = riskProfile.body.profile.id;

    const initialRiskAudit = await fetchJson(`${baseUrl}/api/v1/risk-profiles/${riskProfile.body.profile.id}/audit-events`, {
      headers: { Cookie: cookie }
    });

    if (!initialRiskAudit.body.events?.some(event => event.event_type === 'created')) {
      fail('fixture risk profile did not record a create audit event');
    }

    await fetchJson(`${baseUrl}/api/v1/risk-profiles/${riskProfile.body.profile.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        name: riskProfile.body.profile.name,
        mode: 'paper',
        status: 'active',
        maxOrderValue: 1000,
        maxPositionValue: 2500,
        maxDailyLoss: 500,
        maxOpenTrades: 3,
        killSwitchEnabled: false,
        notes: 'Verification fixture audit update.'
      })
    });
    const updatedRiskAudit = await fetchJson(`${baseUrl}/api/v1/risk-profiles/${riskProfile.body.profile.id}/audit-events`, {
      headers: { Cookie: cookie }
    });

    if (!updatedRiskAudit.body.events?.some(event => event.event_type === 'updated')) {
      fail('fixture risk profile did not record an update audit event');
    }

    const paperSession = await fetchJson(`${baseUrl}/api/v1/strategies/${strategy.body.strategy.id}/paper-sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        marketDataImportId: marketImport.body.import.id,
        initialCapital: 10000,
        feePercent: 0.1,
        slippagePercent: 0.05,
        maxDrawdownPercent: 100,
        maxLossStreak: 100,
        minTradeCount: 0,
        name: `Baseline fixture paper ${fixtureTag}`
      })
    });

    if (paperSession.body.session.result?.riskGate?.status !== 'passed') {
      fail('fixture paper session did not pass its readiness risk gate');
    }

    const botPlan = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        strategyId: strategy.body.strategy.id,
        paperSessionId: paperSession.body.session.id,
        riskProfileId: riskProfile.body.profile.id,
        name: `Baseline fixture bot plan ${fixtureTag}`,
        mode: 'paper',
        notes: 'Verification fixture only.'
      })
    });

    if (botPlan.body.plan.readiness?.status !== 'ready_for_paper') {
      fail(`fixture paper bot plan was not ready_for_paper: ${botPlan.body.plan.readiness?.status}`);
    }
    fixture.botPlanIds.push(botPlan.body.plan.id);

    const editedBotPlan = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans/${botPlan.body.plan.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        name: `${botPlan.body.plan.name} edited`,
        mode: 'paper',
        paperSessionId: paperSession.body.session.id,
        riskProfileId: riskProfile.body.profile.id,
        connectorId: null,
        notes: 'Verification fixture edit.'
      })
    });

    if (editedBotPlan.body.plan.name !== `${botPlan.body.plan.name} edited`) {
      fail('fixture bot plan edit did not persist the edited name');
    }

    const paperRun = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans/${botPlan.body.plan.id}/paper-runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ positionOpen: false })
    });

    if (paperRun.body.run.result?.liveExecution?.enabled !== false) {
      fail('fixture paper bot run did not keep live execution disabled');
    }

    const schedule = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans/${botPlan.body.plan.id}/schedules`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        intervalMinutes: 15,
        status: 'paused',
        positionOpen: false
      })
    });
    fixture.scheduleId = schedule.body.schedule.id;

    if (schedule.body.schedule.status !== 'paused' || schedule.body.schedule.next_run_at !== null) {
      fail('fixture schedule was not created paused with no next run time');
    }

    const botCapabilityPath = await fetchJson(`${baseUrl}/api/v1/bot-automation-capability-path`, {
      headers: { Cookie: cookie }
    });

    if (
      botCapabilityPath.body.capabilityPath?.paperAutomation?.enabled !== true
      || botCapabilityPath.body.capabilityPath?.paperAutomation?.scheduleWorkerEnabled !== true
      || botCapabilityPath.body.capabilityPath?.paperAutomation?.routeBoundary !== 'monitor_only_no_live_orders'
      || botCapabilityPath.body.capabilityPath?.futureLiveAutomation?.enabled !== false
      || botCapabilityPath.body.capabilityPath?.futureLiveAutomation?.goLiveAllowed !== false
      || !botCapabilityPath.body.capabilityPath?.futureLiveAutomation?.blockedGates?.includes('live_order_endpoint_enabled')
      || !botCapabilityPath.body.capabilityPath?.evidence?.availableExports?.includes('bot_safety_dossier_json')
    ) {
      fail('bot automation capability path did not preserve paper-only/live-blocked behavior');
    }

    const scheduledRun = await fetchJson(`${baseUrl}/api/v1/bot-automation-schedules/${schedule.body.schedule.id}/run`, {
      method: 'POST',
      headers
    });

    if (scheduledRun.body.run.result?.liveExecution?.enabled !== false) {
      fail('fixture scheduled paper run did not keep live execution disabled');
    }

    await fetchJson(`${baseUrl}/api/v1/bot-automation-schedules/${schedule.body.schedule.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'archived' })
    });
    await fetchJsonExpectStatus(`${baseUrl}/api/v1/bot-automation-schedules/${schedule.body.schedule.id}/run`, {
      method: 'POST',
      headers
    }, 400);

    const liveDisabledPlan = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        strategyId: strategy.body.strategy.id,
        paperSessionId: paperSession.body.session.id,
        riskProfileId: riskProfile.body.profile.id,
        name: `Baseline fixture live-disabled plan ${fixtureTag}`,
        mode: 'live_disabled',
        notes: 'Verification fixture only.'
      })
    });

    if (liveDisabledPlan.body.plan.readiness?.liveExecution?.enabled !== false) {
      fail('fixture live-disabled plan reported live execution enabled');
    }
    fixture.botPlanIds.push(liveDisabledPlan.body.plan.id);

    await fetchJsonExpectStatus(`${baseUrl}/api/v1/bot-automation-plans/${liveDisabledPlan.body.plan.id}/paper-runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ positionOpen: false })
    }, 400);

    const liveReadiness = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans/${liveDisabledPlan.body.plan.id}/live-readiness`, {
      method: 'POST',
      headers
    });

    if (
      liveReadiness.body.readiness?.liveExecution?.enabled !== false
      || liveReadiness.body.readiness?.liveExecution?.orderEndpointEnabled !== false
    ) {
      fail('live-readiness preflight reported live execution enabled');
    }

    if (!liveReadiness.body.readiness?.blockingFailures?.includes('owner_go_live_confirmation')) {
      fail('live-readiness preflight did not require explicit owner go-live confirmation');
    }

    if (!liveReadiness.body.event?.id) {
      fail('live-readiness preflight did not return a persisted history event');
    }

    const liveReadinessHistory = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans/${liveDisabledPlan.body.plan.id}/live-readiness-events`, {
      headers: { Cookie: cookie }
    });

    if (!liveReadinessHistory.body.events?.some(event => String(event.id) === String(liveReadiness.body.event.id))) {
      fail('live-readiness history did not include the persisted preflight event');
    }

    const liveReadinessEvent = await fetchJson(`${baseUrl}/api/v1/bot-live-readiness-events/${liveReadiness.body.event.id}`, {
      headers: { Cookie: cookie }
    });

    if (liveReadinessEvent.body.event?.readiness?.liveExecution?.enabled !== false) {
      fail('persisted live-readiness event reported live execution enabled');
    }

    await fetchJsonExpectStatus(`${baseUrl}/api/v1/bot-automation-plans/${botPlan.body.plan.id}/live-enablement-reviews`, {
      method: 'POST',
      headers
    }, 400);

    const liveEnablementReview = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans/${liveDisabledPlan.body.plan.id}/live-enablement-reviews`, {
      method: 'POST',
      headers
    });

    if (
      liveEnablementReview.body.review?.review?.liveExecution?.enabled !== false
      || liveEnablementReview.body.review?.review?.liveExecution?.orderEndpointEnabled !== false
      || liveEnablementReview.body.review?.review?.liveExecution?.goLiveAllowed !== false
    ) {
      fail('go-live enablement review reported live execution enabled or allowed');
    }

    if (liveEnablementReview.body.review?.review?.ownerConfirmation?.provided !== false) {
      fail('go-live enablement review did not require missing owner confirmation');
    }

    const goLiveCommandReview = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans/${liveDisabledPlan.body.plan.id}/go-live-command`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        commandText: 'The final bot is ready to go live after testing. Execute automatically when every safety gate is actually implemented.'
      })
    });

    if (
      goLiveCommandReview.body.command?.recognized !== true
      || goLiveCommandReview.body.command?.acceptedForExecution !== false
      || goLiveCommandReview.body.review?.review?.liveExecution?.enabled !== false
      || goLiveCommandReview.body.review?.review?.liveExecution?.goLiveAllowed !== false
      || !goLiveCommandReview.body.review?.review?.blockingFailures?.includes('go_live_command_blocked_by_disabled_execution')
    ) {
      fail('go-live command parser did not recognize and safely block the owner command');
    }

    const launchReadinessAfterCommand = await fetchJson(`${baseUrl}/api/v1/launch-readiness-summary`, {
      headers: { Cookie: cookie }
    });

    if (
      launchReadinessAfterCommand.body.summary?.launchStatus !== 'blocked'
      || launchReadinessAfterCommand.body.summary?.liveExecution?.enabled !== false
      || launchReadinessAfterCommand.body.summary?.liveExecution?.goLiveAllowed !== false
      || !launchReadinessAfterCommand.body.summary?.blockingFailures?.includes('live_order_endpoint_enabled')
      || !launchReadinessAfterCommand.body.summary?.recent?.goLiveCommandReviews?.some(review => (
        String(review.id) === String(goLiveCommandReview.body.review.id)
      ))
    ) {
      fail('launch readiness summary did not include the safely blocked go-live command review');
    }

    await fetchJsonExpectStatus(`${baseUrl}/api/v1/bot-automation-plans/${liveDisabledPlan.body.plan.id}/go-live-command`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        commandText: `go live sk-${'b'.repeat(40)}`
      })
    }, 400);

    const liveEnablementHistory = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans/${liveDisabledPlan.body.plan.id}/live-enablement-reviews`, {
      headers: { Cookie: cookie }
    });

    if (
      !liveEnablementHistory.body.reviews?.some(review => String(review.id) === String(liveEnablementReview.body.review.id))
      || !liveEnablementHistory.body.reviews?.some(review => String(review.id) === String(goLiveCommandReview.body.review.id))
    ) {
      fail('go-live enablement history did not include the persisted review');
    }

    const safetyDossier = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans/${liveDisabledPlan.body.plan.id}/safety-dossier`, {
      headers: { Cookie: cookie }
    });

    if (
      safetyDossier.body.dossier?.liveBlocked !== true
      || safetyDossier.body.dossier?.liveExecution?.enabled !== false
      || safetyDossier.body.dossier?.liveExecution?.goLiveAllowed !== false
      || !safetyDossier.body.dossier?.statusExplanation?.summary
      || !safetyDossier.body.dossier?.statusExplanation?.ownerAction
      || !safetyDossier.body.dossier?.statusExplanation?.liveExecutionBoundary?.includes('no live order endpoint')
      || !safetyDossier.body.dossier?.statusExplanation?.reviewChecklist?.includes('Export the safety dossier JSON for local evidence.')
      || Number(safetyDossier.body.dossier?.counts?.liveReadinessEvents || 0) < 1
      || Number(safetyDossier.body.dossier?.counts?.goLiveReviews || 0) < 2
      || !safetyDossier.body.history?.liveReadinessEvents?.some(event => String(event.id) === String(liveReadiness.body.event.id))
      || !safetyDossier.body.history?.goLiveReviews?.some(review => String(review.id) === String(goLiveCommandReview.body.review.id))
      || !safetyDossier.body.dossier?.blockingFailures?.includes('go_live_command_blocked_by_disabled_execution')
    ) {
      fail('bot safety dossier did not preserve monitor-only live execution evidence');
    }

    const liveEnablementDetail = await fetchJson(`${baseUrl}/api/v1/bot-live-enablement-reviews/${liveEnablementReview.body.review.id}`, {
      headers: { Cookie: cookie }
    });

    if (liveEnablementDetail.body.review?.review?.liveExecution?.enabled !== false) {
      fail('persisted go-live enablement review reported live execution enabled');
    }

    const updatedLiveEnablementReview = await fetchJson(`${baseUrl}/api/v1/bot-live-enablement-reviews/${liveEnablementReview.body.review.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        checklistItemId: 'readiness_preflight_reviewed',
        reviewed: true,
        note: 'Verification marked this item reviewed without enabling live execution.'
      })
    });

    const reviewedChecklistItem = updatedLiveEnablementReview.body.review?.review?.checklist
      ?.find(item => item.id === 'readiness_preflight_reviewed');

    if (!reviewedChecklistItem?.reviewed || reviewedChecklistItem.passed !== false) {
      fail('go-live checklist item was not marked reviewed while remaining not passed');
    }

    if (
      updatedLiveEnablementReview.body.review?.review?.liveExecution?.enabled !== false
      || updatedLiveEnablementReview.body.review?.review?.liveExecution?.goLiveAllowed !== false
    ) {
      fail('go-live checklist update enabled live execution');
    }

    const liveEnablementArtifacts = await fetchJson(`${baseUrl}/api/v1/artifacts?type=bot%20live%20enablement%20review&limit=10`, {
      headers: { Cookie: cookie }
    });

    if (!liveEnablementArtifacts.body.rows?.some(row => String(row.id) === String(liveEnablementReview.body.review.id))) {
      fail('bot live enablement review artifact search did not include the fixture review');
    }

    const killSwitchUpdate = await fetchJson(`${baseUrl}/api/v1/risk-profiles/${riskProfile.body.profile.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        name: riskProfile.body.profile.name,
        mode: 'paper',
        status: 'active',
        maxOrderValue: 1000,
        maxPositionValue: 2500,
        maxDailyLoss: 500,
        maxOpenTrades: 3,
        killSwitchEnabled: true,
        notes: 'Verification fixture emergency stop propagation.'
      })
    });

    if (!killSwitchUpdate.body.linkedBotPlans?.some(plan => (
      String(plan.id) === String(botPlan.body.plan.id)
      && plan.readiness?.blockingFailures?.includes('kill_switch_off')
    ))) {
      fail('risk-profile kill switch update did not propagate blocking readiness to linked paper bot plan');
    }

    const killedPaperPlan = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans/${botPlan.body.plan.id}`, {
      headers: { Cookie: cookie }
    });

    if (!killedPaperPlan.body.plan?.readiness?.blockingFailures?.includes('kill_switch_off')) {
      fail('linked paper bot plan did not persist kill-switch blocking readiness');
    }

    const safetySummaryAfterKill = await fetchJson(`${baseUrl}/api/v1/automation-safety-summary`, {
      headers: { Cookie: cookie }
    });

    if (
      Number(safetySummaryAfterKill.body.summary?.counts?.activeKillSwitches || 0) < 1
      || !safetySummaryAfterKill.body.summary?.recent?.killSwitchAffectedBotPlans?.some(plan => String(plan.id) === String(botPlan.body.plan.id))
    ) {
      fail('automation safety summary did not report the active kill switch and affected bot plan');
    }

    const killSwitchImpact = await fetchJson(`${baseUrl}/api/v1/risk-profiles/${riskProfile.body.profile.id}/kill-switch-impact`, {
      headers: { Cookie: cookie }
    });

    if (
      killSwitchImpact.body.impact?.active !== true
      || killSwitchImpact.body.impact?.liveExecution?.enabled !== false
      || !killSwitchImpact.body.impact?.affectedPlans?.some(plan => (
        String(plan.id) === String(botPlan.body.plan.id)
        && plan.readiness?.blockingFailures?.includes('kill_switch_off')
      ))
      || !Array.isArray(killSwitchImpact.body.impact?.auditEvents)
    ) {
      fail('risk-profile kill-switch impact endpoint did not report the affected blocked bot plan safely');
    }

    await fetchJson(`${baseUrl}/api/v1/bot-automation-plans/${botPlan.body.plan.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'archived' })
    });
    await fetchJsonExpectStatus(`${baseUrl}/api/v1/bot-automation-plans/${botPlan.body.plan.id}/paper-runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ positionOpen: false })
    }, 400);
    await fetchJsonExpectStatus(`${baseUrl}/api/v1/bot-automation-plans/${botPlan.body.plan.id}/schedules`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        intervalMinutes: 15,
        status: 'paused',
        positionOpen: false
      })
    }, 400);
  } catch (error) {
    primaryError = error;
  }

  const cleanupErrors = await cleanupBotAutomationFixture(baseUrl, cookie, fixture);

  if (primaryError) {
    if (cleanupErrors.length) {
      primaryError.message = `${primaryError.message}; cleanup also failed: ${cleanupErrors.join('; ')}`;
    }
    throw primaryError;
  }

  if (cleanupErrors.length) {
    fail(`fixture cleanup failed: ${cleanupErrors.join('; ')}`);
  }

  const updatedAuditFilter = await fetchJson(`${baseUrl}/api/v1/risk-profiles/${fixture.riskProfileId}/audit-events?eventType=updated`, {
    headers: { Cookie: cookie }
  });

  if (!updatedAuditFilter.body.events?.length || updatedAuditFilter.body.events.some(event => event.event_type !== 'updated')) {
    fail('risk-profile audit event filter did not return only updated events');
  }

  const archivedScheduleFilter = await fetchJson(`${baseUrl}/api/v1/bot-automation-schedules?status=archived`, {
    headers: { Cookie: cookie }
  });

  if (!archivedScheduleFilter.body.schedules?.some(schedule => String(schedule.id) === String(fixture.scheduleId))) {
    fail('archived schedule filter did not include the archived fixture schedule');
  }

  pass('self-contained bot automation/risk-audit fixture/filter/live-readiness-history/go-live-review/checklist-edit/emergency-stop/plan-management checks with cleanup');
}

async function runSecretReferenceConnectorChecks(baseUrl, cookie) {
  const now = Date.now();
  const fixtureTag = `secret-connector-${now}`;
  const headers = authJsonHeaders(cookie);
  const fixture = { adapterMatrixConnectorIds: [] };
  let primaryError = null;

  async function cleanup() {
    const errors = [];
    const connectorIds = Array.from(new Set([
      fixture.connectorId,
      ...(fixture.adapterMatrixConnectorIds || [])
    ].filter(Boolean)));

    for (const connectorId of connectorIds) {
      const result = await fetchJsonForCleanup(`${baseUrl}/api/v1/exchange-connectors/${connectorId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'archived' })
      });

      if (!result.ok) {
        errors.push(`connector #${connectorId} archive failed with HTTP ${result.status}: ${JSON.stringify(result.body)}`);
      }
    }

    if (fixture.secretReferenceId) {
      const result = await fetchJsonForCleanup(`${baseUrl}/api/v1/local-secret-references/${fixture.secretReferenceId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'disabled', notes: 'Verification fixture disabled after checks.' })
      });

      if (!result.ok) {
        errors.push(`secret reference #${fixture.secretReferenceId} disable failed with HTTP ${result.status}: ${JSON.stringify(result.body)}`);
      }
    }

    return errors;
  }

  try {
    const secretReference = await fetchJson(`${baseUrl}/api/v1/local-secret-references`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        label: `Baseline fixture secret ref ${fixtureTag}`,
        providerType: 'macos_keychain',
        referenceName: `ethereal/verification/${fixtureTag}`,
        scope: 'exchange_connector',
        status: 'configured',
        notes: 'Metadata-only verification fixture. No secret value.'
      })
    });
    fixture.secretReferenceId = secretReference.body.reference.id;

    await fetchJsonExpectStatus(`${baseUrl}/api/v1/local-secret-references/${fixture.secretReferenceId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        notes: `sk-${'b'.repeat(40)}`
      })
    }, 400);

    await fetchJsonExpectStatus(`${baseUrl}/api/v1/exchange-connectors`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        exchangeName: 'binance',
        label: `Bad inline connector ${fixtureTag}`,
        mode: 'read_only',
        status: 'configured',
        secretReferenceId: fixture.secretReferenceId,
        settings: {
          apiKey: `sk-${'c'.repeat(40)}`
        }
      })
    }, 400);

    const connector = await fetchJson(`${baseUrl}/api/v1/exchange-connectors`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        exchangeName: 'binance',
        label: `Baseline fixture connector ${fixtureTag}`,
        mode: 'live_disabled',
        status: 'configured',
        secretReferenceId: fixture.secretReferenceId,
        settings: {
          sandbox: true,
          permissions: 'read_only'
        }
      })
    });
    fixture.connectorId = connector.body.connector.id;

    if (connector.body.connector.secret_reference_id !== fixture.secretReferenceId) {
      fail('exchange connector did not retain its local secret reference ID');
    }

    const readiness = await fetchJson(`${baseUrl}/api/v1/exchange-connectors/${fixture.connectorId}/readiness`, {
      method: 'POST',
      headers
    });

    if (
      readiness.body.readiness?.liveExecution?.enabled !== false
      || readiness.body.readiness?.liveExecution?.orderEndpointEnabled !== false
    ) {
      fail('exchange connector readiness reported live execution enabled');
    }

    if (!readiness.body.readiness?.blockingFailures?.includes('live_order_adapter_implemented')) {
      fail('exchange connector readiness did not block on missing live order adapter');
    }

    if (!readiness.body.event?.id) {
      fail('exchange connector readiness did not return a persisted event');
    }
    fixture.readinessEventId = readiness.body.event.id;

    const readinessHistory = await fetchJson(`${baseUrl}/api/v1/exchange-connectors/${fixture.connectorId}/readiness-events`, {
      headers: { Cookie: cookie }
    });

    if (!readinessHistory.body.events?.some(event => String(event.id) === String(fixture.readinessEventId))) {
      fail('exchange connector readiness history did not include the persisted event');
    }

    const blockedReadinessHistory = await fetchJson(`${baseUrl}/api/v1/exchange-connectors/${fixture.connectorId}/readiness-events?status=blocked`, {
      headers: { Cookie: cookie }
    });

    if (
      !blockedReadinessHistory.body.events?.some(event => String(event.id) === String(fixture.readinessEventId))
      || blockedReadinessHistory.body.events.some(event => event.status !== 'blocked')
    ) {
      fail('exchange connector readiness status filter did not return only blocked events including the fixture');
    }

    const readinessEvent = await fetchJson(`${baseUrl}/api/v1/exchange-connector-readiness-events/${fixture.readinessEventId}`, {
      headers: { Cookie: cookie }
    });

    if (readinessEvent.body.event?.readiness?.liveExecution?.enabled !== false) {
      fail('persisted exchange connector readiness event reported live execution enabled');
    }

    const adapterContracts = await fetchJson(`${baseUrl}/api/v1/exchange-adapter-contracts`, {
      headers: { Cookie: cookie }
    });

    if (
      adapterContracts.body.implemented !== false
      || !adapterContracts.body.contracts?.some(contract => contract.exchangeName === 'binance' && contract.liveExecution?.enabled === false)
    ) {
      fail('exchange adapter contract list did not return disabled shape-only contracts');
    }
    const adapterScaffolds = await fetchJson(`${baseUrl}/api/v1/exchange-adapter-scaffolds`, {
      headers: { Cookie: cookie }
    });

    if (
      adapterScaffolds.body.implemented !== false
      || adapterScaffolds.body.networkCallsEnabled !== false
      || adapterScaffolds.body.liveExecution?.enabled !== false
      || !adapterScaffolds.body.scaffolds?.some(scaffold => (
        scaffold.exchangeName === 'binance'
        && scaffold.methodContracts?.some(method => method.name === 'placeOrder' && method.implemented === false)
        && scaffold.safetyContract?.throwsOnUse === true
      ))
    ) {
      fail('exchange adapter scaffolds did not return disabled module shapes');
    }

    const binanceScaffold = await fetchJson(`${baseUrl}/api/v1/exchange-adapter-scaffolds/binance`, {
      headers: { Cookie: cookie }
    });

    if (
      binanceScaffold.body.scaffold?.exchangeName !== 'binance'
      || binanceScaffold.body.scaffold?.liveExecution?.enabled !== false
      || binanceScaffold.body.scaffold?.credentialLoadingEnabled !== false
    ) {
      fail('single exchange adapter scaffold endpoint did not return disabled Binance scaffold');
    }
    const binanceContract = adapterContracts.body.contracts?.find(contract => contract.exchangeName === 'binance');

    if (
      !binanceContract?.exchangeRequirements?.marketMetadataRequirements?.includes('PRICE_FILTER parsed')
      || !binanceContract?.requiredRuntimeSettings?.some(setting => setting.name === 'recvWindow' && setting.provided === false)
      || !binanceContract?.requiredTestFixtures?.some(fixture => fixture.name === 'emergency-stop dry-run fixture' && fixture.implemented === false)
    ) {
      fail('exchange adapter contract list did not include expanded disabled Binance requirements');
    }
    const expectedContractExchanges = ['binance', 'bybit', 'coinbase', 'custom', 'hyperliquid', 'kraken', 'okx'];
    const contractExchangeNames = new Set((adapterContracts.body.contracts || []).map(contract => contract.exchangeName));

    for (const exchangeName of expectedContractExchanges) {
      if (!contractExchangeNames.has(exchangeName)) {
        fail(`exchange adapter contract list omitted ${exchangeName}`);
      }

      const matrixConnector = await fetchJson(`${baseUrl}/api/v1/exchange-connectors`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          exchangeName,
          label: `Adapter matrix ${exchangeName} ${fixtureTag}`,
          mode: 'paper',
          status: 'planned',
          settings: {
            sandbox: true
          }
        })
      });
      fixture.adapterMatrixConnectorIds.push(matrixConnector.body.connector.id);

      const matrixContract = await fetchJson(`${baseUrl}/api/v1/exchange-connectors/${matrixConnector.body.connector.id}/adapter-contract-check`, {
        method: 'POST',
        headers
      });

      if (
        matrixContract.body.contract?.spec?.exchangeName !== exchangeName
        || matrixContract.body.contract?.spec?.implemented !== false
        || !Array.isArray(matrixContract.body.contract?.spec?.exchangeRequirements?.testFixtureRequirements)
        || matrixContract.body.contract?.liveExecution?.enabled !== false
        || !matrixContract.body.contract?.blockingFailures?.includes('exchange_specific_requirements_implemented')
        || !matrixContract.body.event?.id
      ) {
        fail(`adapter contract matrix check failed for ${exchangeName}`);
      }
    }

    const adapterContract = await fetchJson(`${baseUrl}/api/v1/exchange-connectors/${fixture.connectorId}/adapter-contract-check`, {
      method: 'POST',
      headers
    });

    if (
      adapterContract.body.contract?.liveExecution?.enabled !== false
      || adapterContract.body.contract?.spec?.implemented !== false
      || !adapterContract.body.contract?.blockingFailures?.includes('adapter_methods_implemented')
      || !adapterContract.body.contract?.blockingFailures?.includes('exchange_specific_requirements_implemented')
    ) {
      fail('exchange adapter contract check did not remain blocked and disabled');
    }

    if (!adapterContract.body.event?.id) {
      fail('exchange adapter contract check did not return a persisted event');
    }
    fixture.adapterContractEventId = adapterContract.body.event.id;

    const adapterContractHistory = await fetchJson(`${baseUrl}/api/v1/exchange-connectors/${fixture.connectorId}/adapter-contract-events`, {
      headers: { Cookie: cookie }
    });

    if (!adapterContractHistory.body.events?.some(event => String(event.id) === String(fixture.adapterContractEventId))) {
      fail('exchange adapter contract history did not include the persisted event');
    }

    const blockedAdapterContractHistory = await fetchJson(`${baseUrl}/api/v1/exchange-connectors/${fixture.connectorId}/adapter-contract-events?status=blocked`, {
      headers: { Cookie: cookie }
    });

    if (
      !blockedAdapterContractHistory.body.events?.some(event => String(event.id) === String(fixture.adapterContractEventId))
      || blockedAdapterContractHistory.body.events.some(event => event.status !== 'blocked')
    ) {
      fail('exchange adapter contract status filter did not return only blocked events including the fixture');
    }

    const adapterContractEvent = await fetchJson(`${baseUrl}/api/v1/exchange-adapter-contract-events/${fixture.adapterContractEventId}`, {
      headers: { Cookie: cookie }
    });

    if (adapterContractEvent.body.event?.contract?.liveExecution?.enabled !== false) {
      fail('persisted exchange adapter contract event reported live execution enabled');
    }

    const secretArtifacts = await fetchJson(`${baseUrl}/api/v1/artifacts?type=local%20secret%20reference&limit=10`, {
      headers: { Cookie: cookie }
    });

    if (!secretArtifacts.body.rows?.some(row => String(row.id) === String(fixture.secretReferenceId))) {
      fail('local secret reference artifact search did not include the fixture reference');
    }

    const readinessArtifacts = await fetchJson(`${baseUrl}/api/v1/artifacts?type=exchange%20connector%20readiness%20event&limit=10`, {
      headers: { Cookie: cookie }
    });

    if (!readinessArtifacts.body.rows?.some(row => String(row.id) === String(fixture.readinessEventId))) {
      fail('exchange connector readiness artifact search did not include the fixture event');
    }

    const adapterArtifacts = await fetchJson(`${baseUrl}/api/v1/artifacts?type=exchange%20adapter%20contract%20event&limit=10`, {
      headers: { Cookie: cookie }
    });

    if (!adapterArtifacts.body.rows?.some(row => String(row.id) === String(fixture.adapterContractEventId))) {
      fail('exchange adapter contract artifact search did not include the fixture event');
    }
  } catch (error) {
    primaryError = error;
  }

  const cleanupErrors = await cleanup();

  if (primaryError) {
    if (cleanupErrors.length) {
      primaryError.message = `${primaryError.message}; cleanup also failed: ${cleanupErrors.join('; ')}`;
    }
    throw primaryError;
  }

  if (cleanupErrors.length) {
    fail(`secret connector fixture cleanup failed: ${cleanupErrors.join('; ')}`);
  }

  pass('secret-reference edit/connector readiness/adapter-contract filter fixture checks with cleanup');
}

async function runWalletControlFixtureChecks(baseUrl, cookie) {
  const now = Date.now();
  const fixtureTag = `wallet-control-${now}`;
  const headers = authJsonHeaders(cookie);
  const fixture = {};
  let primaryError = null;

  async function cleanup() {
    const errors = [];

    if (fixture.walletId) {
      const result = await fetchJsonForCleanup(`${baseUrl}/api/v1/wallets/${fixture.walletId}/revoke`, {
        method: 'POST',
        headers
      });

      if (!result.ok && result.status !== 404) {
        errors.push(`wallet #${fixture.walletId} revoke failed with HTTP ${result.status}: ${JSON.stringify(result.body)}`);
      }
    }

    for (const secretReferenceId of [fixture.secretReferenceId, fixture.badScopeSecretReferenceId].filter(Boolean)) {
      const result = await fetchJsonForCleanup(`${baseUrl}/api/v1/local-secret-references/${secretReferenceId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'disabled', notes: 'Verification fixture disabled after wallet-control checks.' })
      });

      if (!result.ok && result.status !== 404) {
        errors.push(`secret reference #${secretReferenceId} disable failed with HTTP ${result.status}: ${JSON.stringify(result.body)}`);
      }
    }

    return errors;
  }

  try {
    const operatorCenter = await fetchJson(`${baseUrl}/api/v1/operator-control-center`, { headers });

    if (
      operatorCenter.body.localOnly !== true
      || operatorCenter.body.signingEnabled !== false
      || operatorCenter.body.liveExecutionEnabled !== false
      || operatorCenter.body.secretsStored !== false
      || !Array.isArray(operatorCenter.body.guide?.steps)
      || !Array.isArray(operatorCenter.body.wallets)
      || !Array.isArray(operatorCenter.body.events)
    ) {
      fail('operator control center did not return local-only wallet summary');
    }

    await fetchJsonExpectStatus(`${baseUrl}/api/v1/wallets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        label: `Unsafe wallet ${fixtureTag}`,
        walletKind: 'hardware',
        chainFamily: 'evm',
        seedPhrase: 'never store wallet secrets here'
      })
    }, 400);

    const secretReference = await fetchJson(`${baseUrl}/api/v1/local-secret-references`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        label: `Wallet connector fixture ${fixtureTag}`,
        providerType: 'macos_keychain',
        referenceName: `ethereal/wallet/${fixtureTag}`,
        scope: 'wallet_connector',
        status: 'configured',
        notes: 'Metadata-only wallet connector fixture. No secret value.'
      })
    });
    fixture.secretReferenceId = secretReference.body.reference.id;

    const badScopeSecretReference = await fetchJson(`${baseUrl}/api/v1/local-secret-references`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        label: `Wallet bad scope fixture ${fixtureTag}`,
        providerType: 'macos_keychain',
        referenceName: `ethereal/wallet-bad-scope/${fixtureTag}`,
        scope: 'exchange_connector',
        status: 'configured',
        notes: 'Metadata-only fixture used to verify wallet scope rejection.'
      })
    });
    fixture.badScopeSecretReferenceId = badScopeSecretReference.body.reference.id;

    await fetchJsonExpectStatus(`${baseUrl}/api/v1/wallets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        label: `Bad scope wallet ${fixtureTag}`,
        walletKind: 'hardware',
        chainFamily: 'evm',
        network: 'base',
        secretReferenceId: fixture.badScopeSecretReferenceId
      })
    }, 400);

    const wallet = await fetchJson(`${baseUrl}/api/v1/wallets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        label: `Treasury hardware wallet ${fixtureTag}`,
        walletKind: 'hardware',
        chainFamily: 'evm',
        network: 'base',
        publicAddress: '0x000000000000000000000000000000000000dEaD',
        connectionMethod: 'hardware',
        secretReferenceId: fixture.secretReferenceId,
        assignments: ['etherealai-token', 'trading-lab'],
        status: 'configured',
        permissionScope: {
          view_public_address: 'read_only',
          request_signature: 'owner_approval_each_time',
          deploy_contract: 'owner_approval_each_time',
          mint_token: 'owner_approval_each_time',
          transfer_assets: 'blocked',
          trade_execution: 'paper_only',
          bridge_assets: 'blocked',
          treasury_spend: 'blocked',
          admin_recovery: 'blocked'
        },
        notes: 'Metadata-only verification wallet. No wallet secrets.'
      })
    });
    fixture.walletId = wallet.body.wallet.id;

    if (
      wallet.body.wallet.localOnly !== true
      || wallet.body.wallet.signingEnabled !== false
      || wallet.body.wallet.liveExecutionEnabled !== false
      || wallet.body.secretsStored !== false
      || wallet.body.readiness?.summary?.liveExecutionEnabled !== false
      || wallet.body.readiness?.status !== 'metadata_ready'
      || !wallet.body.event
    ) {
      fail('wallet create endpoint did not preserve metadata-only wallet boundaries');
    }

    const walletRead = await fetchJson(`${baseUrl}/api/v1/wallets/${fixture.walletId}`, { headers });

    if (
      walletRead.body.wallet?.id !== fixture.walletId
      || walletRead.body.readiness?.summary?.secretsStored !== false
      || walletRead.body.signingEnabled !== false
    ) {
      fail('wallet detail endpoint did not return wallet readiness and disabled signing boundary');
    }

    const patched = await fetchJson(`${baseUrl}/api/v1/wallets/${fixture.walletId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        label: `Treasury hardware wallet updated ${fixtureTag}`,
        walletKind: 'hardware',
        chainFamily: 'evm',
        network: 'polygon',
        publicAddress: '0x000000000000000000000000000000000000dEaD',
        connectionMethod: 'hardware',
        secretReferenceId: fixture.secretReferenceId,
        assignments: ['etherealai-token', 'treasury'],
        status: 'review_required',
        permissionScope: {
          view_public_address: 'read_only',
          request_signature: 'owner_approval_each_time',
          deploy_contract: 'owner_approval_each_time',
          mint_token: 'owner_approval_each_time',
          transfer_assets: 'blocked',
          trade_execution: 'paper_only',
          bridge_assets: 'blocked',
          treasury_spend: 'blocked',
          admin_recovery: 'blocked'
        },
        notes: 'Updated metadata-only wallet.'
      })
    });

    if (
      patched.body.wallet.network !== 'polygon'
      || patched.body.wallet.signingEnabled !== false
      || patched.body.wallet.liveExecutionEnabled !== false
    ) {
      fail('wallet patch endpoint did not update metadata while keeping signing disabled');
    }

    const readiness = await fetchJson(`${baseUrl}/api/v1/wallets/${fixture.walletId}/readiness`, {
      method: 'POST',
      headers
    });

    if (
      readiness.body.readiness?.summary?.secretsStored !== false
      || readiness.body.readiness?.summary?.liveExecutionEnabled !== false
      || !Array.isArray(readiness.body.readiness?.checks)
    ) {
      fail('wallet readiness endpoint did not return wallet checks with live execution disabled');
    }

    const events = await fetchJson(`${baseUrl}/api/v1/wallet-permission-events`, { headers });

    if (!events.body.events?.some(event => event.wallet_id === fixture.walletId && event.localOnly === true)) {
      fail('wallet permission events endpoint did not return local wallet event history');
    }

    const revoked = await fetchJson(`${baseUrl}/api/v1/wallets/${fixture.walletId}/revoke`, {
      method: 'POST',
      headers
    });

    if (
      revoked.body.wallet.status !== 'revoked'
      || Object.values(revoked.body.wallet.permissionScope || {}).some(value => value !== 'blocked')
      || revoked.body.wallet.signingEnabled !== false
      || revoked.body.wallet.liveExecutionEnabled !== false
    ) {
      fail('wallet revoke endpoint did not block all permissions and keep signing disabled');
    }
  } catch (error) {
    primaryError = error;
  }

  const cleanupErrors = await cleanup();

  if (primaryError) {
    if (cleanupErrors.length) {
      primaryError.message = `${primaryError.message}; cleanup also failed: ${cleanupErrors.join('; ')}`;
    }
    throw primaryError;
  }

  if (cleanupErrors.length) {
    fail(`wallet-control fixture cleanup failed: ${cleanupErrors.join('; ')}`);
  }

  pass('authenticated wallet control owner onboarding fixture checks with cleanup');
}

async function runServerApiChecks() {
  if (process.env.ETHEREALAI_VERIFY_SERVER !== '1') {
    console.log('[skip] authenticated API checks (set ETHEREALAI_VERIFY_SERVER=1)');
    return;
  }

  const email = process.env.ETHEREALAI_TEST_EMAIL;
  const password = process.env.ETHEREALAI_TEST_PASSWORD;

  if (!email || !password) {
    fail('ETHEREALAI_TEST_EMAIL and ETHEREALAI_TEST_PASSWORD are required for API checks');
  }

  const baseUrl = process.env.ETHEREALAI_BASE_URL || 'http://localhost:3000';
  const login = await fetchJson(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  const cookie = getSetCookie(login.headers)
    .map(value => value.split(';')[0])
    .join('; ');

  if (!cookie) {
    fail('login did not return a session cookie');
  }

  const authHeaders = { Cookie: cookie };
  const health = await fetchJson(`${baseUrl}/api/v1/health`, { headers: authHeaders });

  if (!health.body?.ok || !health.body?.database?.ok) {
    fail('health endpoint did not report an OK server/database state');
  }

  const mvpTestPassPage = await fetch(`${baseUrl}/mvp-test-pass`, { headers: authHeaders });
  const mvpTestPassHtml = await mvpTestPassPage.text();

  if (!mvpTestPassPage.ok || !mvpTestPassHtml.includes('MVP Test Pass')) {
    fail('MVP test pass page did not load for an authenticated user');
  }

  const dashboardPage = await fetch(`${baseUrl}/dashboard`, { headers: authHeaders });
  const dashboardHtml = await dashboardPage.text();

  if (
    !dashboardPage.ok
    || !dashboardHtml.includes('MVP Readiness')
    || !dashboardHtml.includes('MLX Lifecycle')
    || !dashboardHtml.includes('/api/v1/local-model/mlx-lifecycle/start')
    || !dashboardHtml.includes('Unload Ollama Before Start')
  ) {
    fail('dashboard did not expose the MVP readiness panel for an authenticated user');
  }

  const mlxLifecycle = await fetchJson(`${baseUrl}/api/v1/local-model/mlx-lifecycle`, { headers: authHeaders });

  if (
    !['running', 'starting', 'stopped'].includes(mlxLifecycle.body?.status)
    || mlxLifecycle.body?.provider !== 'mlx'
    || mlxLifecycle.body?.memoryIsolation?.enabled !== true
    || !Array.isArray(mlxLifecycle.body?.memoryIsolation?.unloadOllamaModels)
    || !mlxLifecycle.body?.memoryIsolation?.unloadOllamaModels?.includes('qwen3.6:35b-a3b')
    || !mlxLifecycle.body?.command?.args?.includes('mlx-community/Qwen3-Coder-Next-4bit')
  ) {
    fail('MLX lifecycle API did not expose managed status and memory isolation controls');
  }

  const ownerProofPacketPage = await fetch(`${baseUrl}/owner-proof-packet`, { headers: authHeaders });
  const ownerProofPacketHtml = await ownerProofPacketPage.text();

  if (
    !ownerProofPacketPage.ok
    || !ownerProofPacketHtml.includes('Owner Proof Packet')
    || !ownerProofPacketHtml.includes('Download Proof Packet JSON')
    || !ownerProofPacketHtml.includes('Completion Ledger')
    || !ownerProofPacketHtml.includes('Bot Automation Path')
    || !ownerProofPacketHtml.includes('Paper Automation Runbook')
    || !ownerProofPacketHtml.includes('proof packet is local JSON only')
  ) {
    fail('owner proof packet page did not load for an authenticated user');
  }

  const ownerSetupPage = await fetch(`${baseUrl}/owner-setup`, { headers: authHeaders });
  const ownerSetupHtml = await ownerSetupPage.text();

  if (
    !ownerSetupPage.ok
    || !ownerSetupHtml.includes('Setup Wizard')
    || !ownerSetupHtml.includes('Paper Trading Complete')
    || !ownerSetupHtml.includes('Core Setup Complete')
    || !ownerSetupHtml.includes('Local E2E Complete — You can safely operate local paper trading. Live E2E remains locked for future approval.')
    || !ownerSetupHtml.includes('Optional future connections available')
    || !ownerSetupHtml.includes('Select .env File Visually')
    || !ownerSetupHtml.includes('Verify Selected .env File')
    || !ownerSetupHtml.includes('Detected Public Wallet Address')
    || !ownerSetupHtml.includes('Paper Trading Configuration')
    || !ownerSetupHtml.includes('Optional Future Connections')
    || !ownerSetupHtml.includes('Skip Optional Integrations For Now')
    || !ownerSetupHtml.includes('Run Paper Verification')
    || !ownerSetupHtml.includes('Public Address Only')
    || !ownerSetupHtml.includes('~/EtherealAI_Secrets/.env')
  ) {
    fail('owner setup wizard page did not load for an authenticated user');
  }

  const ownerSetup = await fetchJson(`${baseUrl}/api/v1/owner-setup-wizard`, { headers: authHeaders });

  if (
    ownerSetup.body.wizard?.audience !== 'non_technical_owner'
    || !['local_paper_trading_ready', 'owner_setup_in_progress'].includes(ownerSetup.body.wizard?.status)
    || ownerSetup.body.wizard?.coreSetup?.optionalIntegrationsRequired !== false
    || ownerSetup.body.wizard?.progress?.paperTrading?.from !== 95
    || ownerSetup.body.wizard?.progress?.paperTrading?.target !== 100
    || ownerSetup.body.wizard?.progress?.paperTrading?.current < 95
    || ownerSetup.body.wizard?.progress?.paperTrading?.current > 100
    || ownerSetup.body.wizard?.progress?.localEndToEnd?.from !== 95
    || ownerSetup.body.wizard?.progress?.localEndToEnd?.target !== 100
    || ownerSetup.body.wizard?.progress?.localEndToEnd?.current < 95
    || ownerSetup.body.wizard?.progress?.localEndToEnd?.current > 100
    || ownerSetup.body.wizard?.progress?.liveEndToEnd?.status !== 'locked'
    || ownerSetup.body.wizard?.progress?.fullEndToEnd?.status !== 'locked'
    || ownerSetup.body.wizard?.safetyBoundary?.liveTradingEnabled !== false
    || ownerSetup.body.wizard?.safetyBoundary?.walletSigningEnabled !== false
    || ownerSetup.body.wizard?.safetyBoundary?.seedPhrasesAccepted !== false
    || ownerSetup.body.wizard?.safetyBoundary?.privateKeysAccepted !== false
    || ownerSetup.body.wizard?.safetyBoundary?.secretValuesReturnedByApi !== false
    || ownerSetup.body.wizard?.envDiscovery?.visualPickerSupported !== true
    || ownerSetup.body.wizard?.envDiscovery?.browserPathHidden !== true
    || ownerSetup.body.wizard?.paperConfiguration?.liveSigningRequired !== false
    || !Array.isArray(ownerSetup.body.wizard?.setupGuide)
    || !Array.isArray(ownerSetup.body.wizard?.walletMetadata?.detectedEnvPublicWallets)
    || !ownerSetup.body.wizard?.gates?.paperTrading?.some(gate => gate.id === 'paper_verification_run_completed')
    || !ownerSetup.body.wizard?.gates?.fullEndToEnd?.some(gate => gate.id === 'high_security_live_approval_locked')
    || ownerSetup.body.wizard?.env?.note !== 'Only variable names and non-empty status are reported. Secret values are never returned.'
  ) {
    fail('owner setup wizard API did not expose safe non-coder setup progress');
  }

  const liveLockedGate = await fetchJson(`${baseUrl}/api/v1/owner-setup-wizard/verify/high_security_live_approval_locked`, {
    method: 'POST',
    headers: authHeaders
  });

  if (
    liveLockedGate.body.gate?.id !== 'high_security_live_approval_locked'
    || liveLockedGate.body.gate?.passed !== true
    || liveLockedGate.body.safetyBoundary?.liveTradingEnabled !== false
    || liveLockedGate.body.safetyBoundary?.walletSigningEnabled !== false
  ) {
    fail('owner setup wizard gate verification did not keep live trading locked');
  }

  const ownerProofPacket = await fetchJson(`${baseUrl}/api/v1/owner-proof-packet`, { headers: authHeaders });

  if (
    ownerProofPacket.body.packet?.localOnly !== true
    || ownerProofPacket.body.packet?.liveExecutionEnabled !== false
    || ownerProofPacket.body.packet?.ownerTestSummary?.readyForOwnerTesting !== true
    || ownerProofPacket.body.packet?.ownerTestSummary?.localMvpBlockers !== 0
    || ownerProofPacket.body.packet?.ownerTestSummary?.proofSurfaceCount < 8
    || !isOwnerAcceptanceReadyOrAccepted(ownerProofPacket.body.packet?.ownerAcceptance)
    || ownerProofPacket.body.packet?.status?.mvpStatus !== 'ready_for_owner_testing'
    || ownerProofPacket.body.packet?.completionLedger?.percentages?.mvp?.current < 99
    || !ownerProofPacket.body.packet?.completionLedger?.gates?.some(gate => gate.id === 'owner_acceptance_recorded')
    || ownerProofPacket.body.packet?.botAutomationCapabilityPath?.paperAutomation?.enabled !== true
    || ownerProofPacket.body.packet?.botAutomationCapabilityPath?.futureLiveAutomation?.enabled !== false
    || !ownerProofPacket.body.packet?.botAutomationCapabilityPath?.futureLiveAutomation?.blockedGates?.includes('live_order_endpoint_enabled')
    || ownerProofPacket.body.packet?.paperAutomationRunbook?.localOnly !== true
    || ownerProofPacket.body.packet?.paperAutomationRunbook?.liveExecutionEnabled !== false
    || !ownerProofPacket.body.packet?.paperAutomationRunbook?.steps?.some(step => step.id === 'export_local_evidence')
    || !ownerProofPacket.body.packet?.paperAutomationRunbook?.blockedLiveActions?.some(action => action.id === 'live_order_endpoint_enabled')
    || ownerProofPacket.body.packet?.proofSurfaces?.length < 8
    || !ownerProofPacket.body.packet?.proofSurfaces?.some(surface => surface.id === 'operator_control_wallets' && surface.location === '/operator-control')
    || ownerProofPacket.body.packet?.exportSurfaces?.length !== 3
    || ownerProofPacket.body.packet?.fullLiveBlockers?.length < 4
    || ownerProofPacket.body.packet?.routeSafety?.safetyCriticalModules < 6
    || ownerProofPacket.body.packet?.checksum?.algorithm !== 'sha256'
    || ownerProofPacket.body.packet?.checksum?.source !== 'ownerProofPacket.withoutChecksum'
    || !/^[a-f0-9]{64}$/.test(ownerProofPacket.body.packet?.checksum?.value || '')
  ) {
    fail('owner proof packet API did not return the expected checksummed local packet');
  }

  const ownerAcceptance = await fetchJson(`${baseUrl}/api/v1/owner-acceptance`, { headers: authHeaders });

  if (
    !isOwnerAcceptanceReadyOrAccepted(ownerAcceptance.body.ownerAcceptance)
    || ownerAcceptance.body.localOnly !== true
    || ownerAcceptance.body.liveExecution?.enabled !== false
    || ownerAcceptance.body.liveExecution?.orderEndpointEnabled !== false
    || ownerAcceptance.body.liveExecution?.goLiveAllowed !== false
    || !Array.isArray(ownerAcceptance.body.records)
  ) {
    fail('owner acceptance API did not return the expected local-only acceptance state');
  }

  const blockedOwnerAcceptance = await fetchJsonExpectStatus(`${baseUrl}/api/v1/owner-acceptance`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      manualTestCompleted: true,
      proofPacketReviewed: false,
      liveExecutionAcknowledgedDisabled: true
    })
  }, 400);

  if (
    !blockedOwnerAcceptance.body.missingChecks?.includes('proofPacketReviewed')
    || blockedOwnerAcceptance.body.liveExecution?.enabled !== false
    || blockedOwnerAcceptance.body.liveExecution?.goLiveAllowed !== false
  ) {
    fail('owner acceptance API did not block incomplete local review confirmations');
  }

  const protectedProofPages = [
    {
      path: '/creator',
      requiredText: ['MVP 100% · Local E2E 100%', 'Live execution disabled', 'Proof packet', 'Owner evidence']
    },
    {
      path: '/strategy-lab',
      requiredText: ['MVP 100% · Local E2E 100%', 'Live execution disabled', 'Proof packet', 'Owner evidence', 'Cross-Exchange Arbitrage Simulator']
    },
    {
      path: '/solidity-lab',
      requiredText: ['MVP 100% · Local E2E 100%', 'Proof packet', 'Deployment Boundary', 'no mainnet or testnet broadcast', 'Token Ecosystem Studio', 'Token Ecosystem Projects', 'Save Ecosystem Project', 'Update Selected Project', 'Artifact Manifest', 'Multi-Chain Token Builder', 'Listing Readiness']
    },
    {
      path: '/social-ops',
      requiredText: ['MVP 100% · Local E2E 100%', 'Proof packet', 'Local-Only Safety', 'no social network API calls']
    },
    {
      path: '/server-route-inventory',
      requiredText: ['MVP 100% · Local E2E 100%', 'Live execution disabled', 'Proof packet', 'Owner evidence']
    },
    {
      path: '/operator-training',
      requiredText: ['Operator Training Library', 'Text guides', 'video-style walkthroughs', 'exact click instructions']
    }
  ];

  for (const page of protectedProofPages) {
    const response = await fetch(`${baseUrl}${page.path}`, { headers: authHeaders });
    const html = await response.text();

    if (!response.ok || page.requiredText.some(text => !html.includes(text))) {
      fail(`${page.path} did not expose the authenticated proof/status cues`);
    }
  }

  const routeInventoryPage = await fetch(`${baseUrl}/server-route-inventory`, { headers: authHeaders });
  const routeInventoryHtml = await routeInventoryPage.text();

  if (
    !routeInventoryPage.ok
    || !routeInventoryHtml.includes('Server Route Inventory')
    || !routeInventoryHtml.includes('Safety Modules')
    || !routeInventoryHtml.includes('Owner Proof Coverage')
    || !routeInventoryHtml.includes('Owner Acceptance')
    || !routeInventoryHtml.includes("fetch('/api/v1/system-memory')")
    || !routeInventoryHtml.includes('module.safetyProfile?.boundary')
  ) {
    fail('server route inventory page did not load for an authenticated user');
  }

  const ecosystemCatalog = await fetchJson(`${baseUrl}/api/v1/solidity-ecosystem/catalog`, { headers: authHeaders });

  if (
    !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'ethereum')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'solana')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'polygon')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'bnb-chain')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'avalanche')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'base')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'cardano')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'algorand')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'stellar')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'xrp-ledger')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'hedera')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'tezos')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'flow')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'ton')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'linea')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'scroll')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'zksync-era')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'mantle')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'injective')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'osmosis')
    || !ecosystemCatalog.body.catalog?.chains?.some(chain => chain.id === 'custom-chain')
    || !ecosystemCatalog.body.catalog?.recommendedLowFeeChains?.some(chain => chain.id === 'solana')
    || !ecosystemCatalog.body.catalog?.recommendedLowFeeChains?.some(chain => chain.id === 'polygon')
    || !ecosystemCatalog.body.catalog?.recommendedLowFeeChains?.some(chain => chain.id === 'algorand')
    || !ecosystemCatalog.body.catalog?.tokenContractTypes?.includes('spl-token')
    || !ecosystemCatalog.body.catalog?.tokenContractTypes?.includes('cardano-native-asset')
    || !ecosystemCatalog.body.catalog?.tokenContractTypes?.includes('algorand-asa')
    || !ecosystemCatalog.body.catalog?.socialChannels?.some(channel => channel.id === 'discord')
    || !ecosystemCatalog.body.catalog?.socialChannels?.some(channel => channel.id === 'telegram')
    || !ecosystemCatalog.body.catalog?.socialChannels?.some(channel => channel.id === 'youtube')
    || !ecosystemCatalog.body.catalog?.socialChannels?.some(channel => channel.id === 'medium')
    || !ecosystemCatalog.body.catalog?.listingSources?.some(source => source.platform === 'CoinMarketCap')
    || !ecosystemCatalog.body.catalog?.listingSources?.some(source => source.platform === 'CoinGecko')
    || ecosystemCatalog.body.catalog?.crossChainArbitrage?.status !== 'design_only_no_live_orders'
    || ecosystemCatalog.body.catalog?.nodeResearch?.status !== 'research_only_no_live_market_calls'
  ) {
    fail('Solidity ecosystem catalog did not expose local-only chain/social/listing/node/arbitrage planning data');
  }

  const tokenProject = await fetchJson(`${baseUrl}/api/v1/token-ecosystem-projects`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      name: `Baseline fixture token ecosystem ${Date.now()}`,
      targetChain: 'base',
      contractType: 'erc20',
      featureSelections: [
        'passive income reward model',
        'NFT utility upgrades for profitability and access tiers',
        'top 200 market cap rebalancing bot use case',
        'arbitrage-aware strategy design',
        'website, roadmap, logo, and whitepaper generation'
      ],
      nftUtilityNotes: 'NFT tiers upgrade access and capped utility modules.',
      ecosystemNotes: 'Verifier fixture only. Local project, local artifacts, no deployment, no posting, no live trading.'
    })
  });

  if (
    !tokenProject.body.project?.id
    || tokenProject.body.project?.target_chain !== 'base'
    || tokenProject.body.project?.contract_type !== 'erc20'
    || tokenProject.body.project?.localOnly !== true
    || tokenProject.body.project?.externalActionsEnabled !== false
    || tokenProject.body.project?.blueprint?.safetyBoundary?.deploymentEnabled !== false
    || tokenProject.body.project?.blueprint?.safetyBoundary?.externalPostingEnabled !== false
    || !tokenProject.body.project?.blueprint?.project?.featureSelections?.includes('arbitrage-aware strategy design')
  ) {
    fail('token ecosystem project API did not create a local-only project blueprint');
  }

  const tokenProjectDetail = await fetchJson(`${baseUrl}/api/v1/token-ecosystem-projects/${tokenProject.body.project.id}`, {
    headers: authHeaders
  });
  const tokenProjectList = await fetchJson(`${baseUrl}/api/v1/token-ecosystem-projects`, {
    headers: authHeaders
  });

  if (
    tokenProjectDetail.body.project?.id !== tokenProject.body.project.id
    || !tokenProjectList.body.projects?.some(project => project.id === tokenProject.body.project.id)
  ) {
    fail('token ecosystem project API did not return persisted project detail/list rows');
  }

  const updatedTokenProject = await fetchJson(`${baseUrl}/api/v1/token-ecosystem-projects/${tokenProject.body.project.id}`, {
    method: 'PATCH',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      name: `${tokenProject.body.project.name} edited`,
      targetChain: 'polygon',
      contractType: 'erc20',
      featureSelections: [
        'passive income reward model',
        'NFT utility upgrades for profitability and access tiers',
        'arbitrage-aware strategy design',
        'CoinMarketCap and CoinGecko listing evidence packet'
      ],
      nftUtilityNotes: 'Edited verifier NFT utility notes.',
      ecosystemNotes: 'Edited verifier ecosystem notes. Still local-only.',
      status: 'draft_review'
    })
  });

  if (
    updatedTokenProject.body.project?.name !== `${tokenProject.body.project.name} edited`
    || updatedTokenProject.body.project?.target_chain !== 'polygon'
    || updatedTokenProject.body.project?.status !== 'draft_review'
    || updatedTokenProject.body.project?.localOnly !== true
    || updatedTokenProject.body.project?.externalActionsEnabled !== false
    || updatedTokenProject.body.project?.blueprint?.multiChainTokenBuild?.selectedChain?.id !== 'polygon'
    || updatedTokenProject.body.project?.blueprint?.safetyBoundary?.deploymentEnabled !== false
  ) {
    fail('token ecosystem project API did not persist local-only update/archive-ready blueprint data');
  }

  const unsafeTokenProject = await fetchJsonExpectStatus(`${baseUrl}/api/v1/token-ecosystem-projects`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      name: 'Unsafe token fixture',
      targetChain: 'base',
      apiKey: `sk-${'a'.repeat(40)}`
    })
  }, 400);

  if (!/cannot store private keys/i.test(unsafeTokenProject.body.error || '')) {
    fail('token ecosystem project API did not reject secret-like input');
  }

  const tokenWorkspace = await fetchJson(`${baseUrl}/api/v1/token-ecosystem-projects/${tokenProject.body.project.id}/workspace`, {
    method: 'POST',
    headers: authJsonHeaders(cookie)
  });
  const tokenWorkspaceFiles = [
    ...(tokenWorkspace.body.proposals || []),
    ...(tokenWorkspace.body.applied || []),
    ...(tokenWorkspace.body.skipped || [])
  ];

  if (
    tokenWorkspace.body.localOnly !== true
    || tokenWorkspace.body.externalActionsEnabled !== false
    || !tokenWorkspace.body.workspace?.path
    || tokenWorkspaceFiles.length < 8
    || !tokenWorkspaceFiles.some(file => file.relative_path === 'website/SITE_MAP.md')
    || !tokenWorkspaceFiles.some(file => file.relative_path === 'website/CLOUDFLARE_DEPLOYMENT_PLAN.md')
    || !tokenWorkspaceFiles.some(file => file.relative_path === 'whitepaper/WHITEPAPER_DRAFT.md')
    || !tokenWorkspaceFiles.some(file => file.relative_path === 'social/SOCIAL_LAUNCH_PLAN.md')
    || !tokenWorkspaceFiles.some(file => file.relative_path === 'listing/LISTING_EVIDENCE_PACKET.md')
    || !tokenWorkspaceFiles.some(file => file.relative_path === 'automation/CROSS_CHAIN_ARBITRAGE_DESIGN.md')
    || !['workspace_ready', 'workspace_proposed'].includes(tokenWorkspace.body.project?.status)
  ) {
    fail('token ecosystem project workspace generation did not produce the expected local artifact set');
  }

  const cloudflarePlan = await fetchJson(`${baseUrl}/api/v1/token-ecosystem-projects/${tokenProject.body.project.id}/cloudflare-dns-plan`, {
    method: 'POST',
    headers: authJsonHeaders(cookie)
  });

  const cloudflareTrackedTargetCount = (cloudflarePlan.body.savedTargets?.length || 0)
    + (cloudflarePlan.body.skippedTargets?.length || 0);

  if (
    cloudflarePlan.body.localOnly !== true
    || cloudflarePlan.body.externalMutationEnabled !== false
    || cloudflarePlan.body.cloudflareApiCallsEnabled !== false
    || cloudflarePlan.body.credentialLoadingEnabled !== false
    || cloudflarePlan.body.emailRoutingPreserved !== true
    || cloudflarePlan.body.plan?.primaryDomain !== 'etherealdigit.ai'
    || cloudflarePlan.body.plan?.companyPrimaryDomain !== 'etherealdigital.ai'
    || cloudflarePlan.body.plan?.emailRouting?.primaryMailbox !== 'patrick@etherealdigital.ai'
    || cloudflarePlan.body.plan?.dnsTargets?.length !== 4
    || cloudflareTrackedTargetCount < 4
    || ![...(cloudflarePlan.body.savedTargets || []), ...(cloudflarePlan.body.skippedTargets || [])].some(target => (
      (target.host === 'app' || target.host?.startsWith('app.'))
      && target.purpose === 'app_backend'
    ))
  ) {
    fail('token ecosystem Cloudflare DNS plan route did not preserve local-only website DNS planning');
  }

  const websitePackage = await fetchJson(`${baseUrl}/api/v1/token-ecosystem-projects/${tokenProject.body.project.id}/website-deploy-package`, {
    method: 'POST',
    headers: authJsonHeaders(cookie)
  });
  const websitePackageFiles = [
    ...(websitePackage.body.proposals || []),
    ...(websitePackage.body.applied || []),
    ...(websitePackage.body.skipped || [])
  ];

  if (
    websitePackage.body.localOnly !== true
    || websitePackage.body.externalActionsEnabled !== false
    || websitePackage.body.cloudflareApiCallsEnabled !== false
    || websitePackage.body.dnsMutationEnabled !== false
    || websitePackage.body.deploymentEnabled !== false
    || websitePackage.body.deployPackage?.outputDirectory !== 'website/dist'
    || websitePackage.body.deployPackage?.fileCount < 9
    || !websitePackage.body.deployPackage?.files?.includes('website/dist/index.html')
    || !websitePackage.body.deployPackage?.files?.includes('website/dist/_headers')
    || !websitePackage.body.deployPackage?.files?.includes('website/CLOUDFLARE_PAGES_PACKAGE.json')
    || websitePackage.body.cloudflarePlan?.primaryDomain !== 'etherealdigit.ai'
    || websitePackage.body.cloudflarePlan?.emailRouting?.primaryMailbox !== 'patrick@etherealdigital.ai'
    || websitePackageFiles.length < 9
    || !['website_package_ready', 'website_package_proposed'].includes(websitePackage.body.project?.status)
  ) {
    fail('token ecosystem website deploy package route did not produce local-only Cloudflare Pages files');
  }

  const tokenArtifactManifest = await fetchJson(`${baseUrl}/api/v1/token-ecosystem-projects/${tokenProject.body.project.id}/artifacts`, {
    headers: authHeaders
  });

  if (
    tokenArtifactManifest.body.localOnly !== true
    || tokenArtifactManifest.body.externalActionsEnabled !== false
    || tokenArtifactManifest.body.liveExecutionEnabled !== false
    || tokenArtifactManifest.body.manifest?.project?.id !== tokenProject.body.project.id
    || tokenArtifactManifest.body.manifest?.workspace?.id !== tokenWorkspace.body.workspace?.id
    || tokenArtifactManifest.body.manifest?.counts?.fileProposals < 17
    || tokenArtifactManifest.body.manifest?.counts?.cloudflareDnsTargets < 4
    || tokenArtifactManifest.body.manifest?.safetyBoundary?.deploymentEnabled !== false
    || tokenArtifactManifest.body.manifest?.safetyBoundary?.publicPostingEnabled !== false
    || tokenArtifactManifest.body.manifest?.safetyBoundary?.liveTradingEnabled !== false
  ) {
    fail('token ecosystem artifact manifest did not link local workspace/artifact state safely');
  }

  const archivedTokenProject = await fetchJson(`${baseUrl}/api/v1/token-ecosystem-projects/${tokenProject.body.project.id}`, {
    method: 'DELETE',
    headers: authJsonHeaders(cookie)
  });

  if (
    archivedTokenProject.body.archived !== true
    || archivedTokenProject.body.project?.status !== 'archived'
    || archivedTokenProject.body.project?.localOnly !== true
    || archivedTokenProject.body.project?.externalActionsEnabled !== false
    || archivedTokenProject.body.project?.blueprint?.project?.externalActionsEnabled !== false
  ) {
    fail('token ecosystem project archive route did not preserve local-only archived state');
  }

  if (tokenWorkspace.body.workspace?.path && tokenWorkspace.body.workspace.path.startsWith(projectRoot)) {
    fs.rmSync(tokenWorkspace.body.workspace.path, { recursive: true, force: true });
  }

  const multiAgentRegistry = await fetchJson(`${baseUrl}/api/v1/multi-agent/registry`, { headers: authHeaders });

  if (
    multiAgentRegistry.body.localOnly !== true
    || multiAgentRegistry.body.liveExecutionEnabled !== false
    || !multiAgentRegistry.body.agents?.some(agent => agent.id === 'planner' && agent.modelRole === 'planner')
    || !multiAgentRegistry.body.agents?.some(agent => agent.id === 'coding' && agent.modelRole === 'coder')
    || !multiAgentRegistry.body.agents?.some(agent => agent.id === 'solidity' && agent.modelRole === 'coder')
    || !multiAgentRegistry.body.agents?.some(agent => agent.id === 'social' && agent.modelRole === 'writer')
    || !multiAgentRegistry.body.agents?.some(agent => agent.id === 'validator_discovery')
    || !multiAgentRegistry.body.safetyGates?.some(gate => gate.id === 'no_live_trading' && gate.status === 'enforced')
    || multiAgentRegistry.body.hermesBenchmarkPlan?.status !== 'owner_review_required'
    || multiAgentRegistry.body.hermesBenchmarkPlan?.bypassAllowed !== false
    || !multiAgentRegistry.body.hermesBenchmarkPlan?.blockedUntilOwnerApproves?.includes('install Hermes Agent')
  ) {
    fail('multi-agent registry did not expose local-only agent roles and blocked Hermes benchmark lane');
  }

  const arbitrageSimulation = await fetchJson(`${baseUrl}/api/v1/order-intents/simulate-cross-exchange`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      marketSymbol: 'EAI/USDT',
      quantity: 10,
      minNetEdgePercent: 0.25,
      strategyType: 'top_200_rebalance',
      venueQuotes: [
        {
          venue: 'binance',
          venueType: 'cex',
          chain: 'centralized',
          price: 99,
          feePercent: 0.1,
          slippagePercent: 0.05,
          gasCost: 0,
          liquidityScore: 91
        },
        {
          venue: 'aerodrome',
          venueType: 'dex',
          chain: 'base',
          price: 101,
          feePercent: 0.3,
          slippagePercent: 0.1,
          gasCost: 0.5,
          liquidityScore: 70
        }
      ]
    })
  });

  if (
    arbitrageSimulation.body.simulation?.safetyBoundary?.liveExecutionEnabled !== false
    || arbitrageSimulation.body.simulation?.safetyBoundary?.networkCallsEnabled !== false
    || arbitrageSimulation.body.run?.localOnly !== true
    || arbitrageSimulation.body.run?.networkCallsEnabled !== false
    || arbitrageSimulation.body.run?.liveExecutionEnabled !== false
    || arbitrageSimulation.body.simulation?.bestEntry?.venue !== 'binance'
    || arbitrageSimulation.body.simulation?.bestExit?.venue !== 'aerodrome'
    || arbitrageSimulation.body.simulation?.economics?.estimatedNetProfit <= 0
    || !arbitrageSimulation.body.simulation?.blockingFailures?.includes('live_order_endpoint_enabled')
  ) {
    fail('cross-exchange arbitrage simulator API did not return local-only route economics');
  }

  const arbitrageSimulationList = await fetchJson(`${baseUrl}/api/v1/order-intents/arbitrage-simulations`, {
    headers: authHeaders
  });
  const arbitrageSimulationDetail = await fetchJson(`${baseUrl}/api/v1/order-intents/arbitrage-simulations/${arbitrageSimulation.body.run.id}`, {
    headers: authHeaders
  });

  if (
    arbitrageSimulationList.body.localOnly !== true
    || arbitrageSimulationList.body.liveExecutionEnabled !== false
    || !arbitrageSimulationList.body.runs?.some(run => String(run.id) === String(arbitrageSimulation.body.run.id))
    || arbitrageSimulationDetail.body.run?.result?.bestEntry?.venue !== 'binance'
  ) {
    fail('cross-exchange arbitrage simulation history API did not return persisted local-only run data');
  }

  const simulationDraftIntents = await fetchJson(`${baseUrl}/api/v1/order-intents/arbitrage-simulations/${arbitrageSimulation.body.run.id}/draft-intents`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({})
  });

  if (
    simulationDraftIntents.body.localOnly !== true
    || simulationDraftIntents.body.liveExecutionEnabled !== false
    || simulationDraftIntents.body.networkCallsEnabled !== false
    || simulationDraftIntents.body.intents?.length !== 2
    || !simulationDraftIntents.body.intents?.every(intent => (
      intent.status === 'draft'
      && intent.payload?.mode === 'arbitrage_simulation_draft_intent_v1'
      && intent.payload?.liveExecution?.enabled === false
    ))
  ) {
    fail('cross-exchange arbitrage simulation did not create local-only draft order intents');
  }

  const rebalanceCsvText = [
    'marketSymbol,marketCapRank,marketCapUsd,priceChangePercent24h,priceChangePercent7d,venue,venueType,chain,price,feePercent,slippagePercent,gasCost,liquidityScore',
    'EAI/USDT,42,850000000,-12.4,-18.2,binance,cex,centralized,0.99,0.10,0.05,0,91',
    'EAI/USDT,42,850000000,-12.4,-18.2,aerodrome,dex,base,1.01,0.30,0.10,0.05,70'
  ].join('\n');
  const rebalanceCandidateImport = await fetchJson(`${baseUrl}/api/v1/order-intents/rebalance-candidates/import-csv`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      csvText: rebalanceCsvText
    })
  });

  if (
    rebalanceCandidateImport.body.localOnly !== true
    || rebalanceCandidateImport.body.liveExecutionEnabled !== false
    || rebalanceCandidateImport.body.networkCallsEnabled !== false
    || rebalanceCandidateImport.body.summary?.candidateCount !== 1
    || rebalanceCandidateImport.body.summary?.quoteCount !== 2
    || rebalanceCandidateImport.body.candidates?.[0]?.venueQuotes?.length !== 2
  ) {
    fail('top-200 rebalance CSV import did not return local-only normalized candidates');
  }

  const rebalanceBatch = await fetchJson(`${baseUrl}/api/v1/order-intents/rebalance-batches`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      name: 'Verifier top-200 rebalance batch',
      portfolioCapital: 10000,
      allocationPerCandidatePercent: 5,
      maxCandidates: 2,
      minDropPercent: 3,
      minNetEdgePercent: 0.25,
      candidates: [
        {
          marketSymbol: 'EAI/USDT',
          marketCapRank: 42,
          marketCapUsd: 850000000,
          priceChangePercent24h: -12.4,
          priceChangePercent7d: -18.2,
          venueQuotes: [
            {
              venue: 'binance',
              venueType: 'cex',
              chain: 'centralized',
              price: 0.99,
              feePercent: 0.1,
              slippagePercent: 0.05,
              gasCost: 0,
              liquidityScore: 91
            },
            {
              venue: 'aerodrome',
              venueType: 'dex',
              chain: 'base',
              price: 1.01,
              feePercent: 0.3,
              slippagePercent: 0.1,
              gasCost: 0.05,
              liquidityScore: 70
            }
          ]
        },
        {
          marketSymbol: 'BTC/USDT',
          marketCapRank: 1,
          marketCapUsd: 1500000000000,
          priceChangePercent24h: -1.2,
          venueQuotes: [
            {
              venue: 'coinbase',
              venueType: 'cex',
              chain: 'centralized',
              price: 100,
              feePercent: 0.16,
              slippagePercent: 0.06,
              gasCost: 0,
              liquidityScore: 90
            },
            {
              venue: 'aerodrome',
              venueType: 'dex',
              chain: 'base',
              price: 101,
              feePercent: 0.3,
              slippagePercent: 0.1,
              gasCost: 0.05,
              liquidityScore: 70
            }
          ]
        }
      ]
    })
  });

  if (
    rebalanceBatch.body.localOnly !== true
    || rebalanceBatch.body.liveExecutionEnabled !== false
    || rebalanceBatch.body.networkCallsEnabled !== false
    || rebalanceBatch.body.batch?.localOnly !== true
    || rebalanceBatch.body.batch?.networkCallsEnabled !== false
    || rebalanceBatch.body.batch?.liveExecutionEnabled !== false
    || rebalanceBatch.body.simulation?.safetyBoundary?.liveExecutionEnabled !== false
    || rebalanceBatch.body.simulation?.summary?.selectedCount !== 1
    || rebalanceBatch.body.simulation?.summary?.paperCandidateCount !== 1
    || rebalanceBatch.body.simulation?.recommendedDraftIntentGroups?.length !== 1
  ) {
    fail('top-200 rebalance batch API did not return local-only batch route economics');
  }

  const rebalanceBatchList = await fetchJson(`${baseUrl}/api/v1/order-intents/rebalance-batches`, {
    headers: authHeaders
  });
  const rebalanceBatchDetail = await fetchJson(`${baseUrl}/api/v1/order-intents/rebalance-batches/${rebalanceBatch.body.batch.id}`, {
    headers: authHeaders
  });

  if (
    rebalanceBatchList.body.localOnly !== true
    || rebalanceBatchList.body.liveExecutionEnabled !== false
    || !rebalanceBatchList.body.batches?.some(batch => String(batch.id) === String(rebalanceBatch.body.batch.id))
    || rebalanceBatchDetail.body.batch?.result?.summary?.paperCandidateCount !== 1
  ) {
    fail('top-200 rebalance batch history API did not return persisted local-only batch data');
  }

  const rebalanceDraftIntents = await fetchJson(`${baseUrl}/api/v1/order-intents/rebalance-batches/${rebalanceBatch.body.batch.id}/draft-intents`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      maxIntentPairs: 1
    })
  });
  const rebalanceReviewQueue = await fetchJson(`${baseUrl}/api/v1/order-intents/rebalance-review-queue`, {
    headers: authHeaders
  });

  if (
    rebalanceDraftIntents.body.localOnly !== true
    || rebalanceDraftIntents.body.liveExecutionEnabled !== false
    || rebalanceDraftIntents.body.networkCallsEnabled !== false
    || rebalanceDraftIntents.body.intents?.length !== 2
    || !rebalanceDraftIntents.body.intents?.every(intent => (
      intent.status === 'draft'
      && intent.payload?.mode === 'top_200_rebalance_batch_draft_intent_v1'
      && intent.payload?.rebalanceBatchId === rebalanceBatch.body.batch.id
      && intent.payload?.liveExecution?.enabled === false
    ))
    || rebalanceReviewQueue.body.localOnly !== true
    || rebalanceReviewQueue.body.queue?.summary?.draftIntentCount < 2
    || !rebalanceReviewQueue.body.queue?.draftIntents?.some(intent => (
      intent.payload?.rebalanceBatchId === rebalanceBatch.body.batch.id
    ))
  ) {
    fail('top-200 rebalance batch did not create local-only review queue draft intents');
  }

  const rebalanceCampaignDrafts = await fetchJson(`${baseUrl}/api/v1/social-posts/rebalance-batches/${rebalanceBatch.body.batch.id}/campaign-drafts`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      platforms: ['x', 'discord', 'telegram', 'youtube', 'medium'],
      accountLabel: 'Verifier campaign'
    })
  });

  if (
    rebalanceCampaignDrafts.body.localOnly !== true
    || rebalanceCampaignDrafts.body.externalPostingEnabled !== false
    || rebalanceCampaignDrafts.body.liveExecutionEnabled !== false
    || rebalanceCampaignDrafts.body.posts?.length !== 5
    || !rebalanceCampaignDrafts.body.posts?.some(post => post.platform === 'medium')
    || !rebalanceCampaignDrafts.body.posts?.every(post => (
      post.status === 'draft'
      && post.metadata?.source === 'rebalance_batch_campaign_draft_v1'
      && post.metadata?.rebalanceBatchId === rebalanceBatch.body.batch.id
      && post.metadata?.externalPostingEnabled === false
      && post.metadata?.liveExecutionEnabled === false
    ))
  ) {
    fail('rebalance batch campaign draft API did not create local-only Social Ops drafts');
  }

  const rebalanceBatchExport = await fetchJson(`${baseUrl}/api/v1/order-intents/rebalance-batches/${rebalanceBatch.body.batch.id}/export`, {
    headers: authHeaders
  });
  const archivedRebalanceBatch = await fetchJson(`${baseUrl}/api/v1/order-intents/rebalance-batches/${rebalanceBatch.body.batch.id}`, {
    method: 'PATCH',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      status: 'archived'
    })
  });
  const archivedRebalanceBatchList = await fetchJson(`${baseUrl}/api/v1/order-intents/rebalance-batches?status=archived`, {
    headers: authHeaders
  });

  if (
    rebalanceBatchExport.body.localOnly !== true
    || !rebalanceBatchExport.body.export?.csv?.includes('marketSymbol')
    || rebalanceBatchExport.body.export?.liveExecutionEnabled !== false
    || archivedRebalanceBatch.body.batch?.status !== 'archived'
    || archivedRebalanceBatch.body.liveExecutionEnabled !== false
    || !archivedRebalanceBatchList.body.batches?.some(batch => String(batch.id) === String(rebalanceBatch.body.batch.id))
  ) {
    fail('rebalance batch archive/export/filter APIs did not preserve local-only state');
  }

  await fetchJsonExpectStatus(`${baseUrl}/api/v1/order-intents/simulate-cross-exchange`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      marketSymbol: 'EAI/USDT',
      quantity: 1,
      apiKey: `sk-${'a'.repeat(40)}`
    })
  }, 400);

  await fetchJsonExpectStatus(`${baseUrl}/api/v1/order-intents/rebalance-batches`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      candidates: [
        {
          marketSymbol: 'EAI/USDT',
          password: 'not-allowed'
        }
      ]
    })
  }, 400);

  await fetchJsonExpectStatus(`${baseUrl}/api/v1/order-intents/rebalance-candidates/import-csv`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      csvText: 'marketSymbol,password\nEAI/USDT,not-allowed'
    })
  }, 400);

  await fetchJsonExpectStatus(`${baseUrl}/api/v1/social-posts/rebalance-batches/${rebalanceBatch.body.batch.id}/campaign-drafts`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      platforms: ['medium'],
      socialToken: `sk-${'a'.repeat(40)}`
    })
  }, 400);

  const multiAgentRun = await fetchJson(`${baseUrl}/api/v1/multi-agent/runs`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      objective: 'Fixture: coordinate the next safe EtherealAI build step.',
      context: 'Verifier fixture; no external actions.',
      executionMode: 'plan_only',
      providerMode: 'mlx_fast_lane',
      selectedAgents: ['planner', 'coding', 'safety_compliance']
    })
  }, 201);

  if (
    multiAgentRun.body.run?.execution_mode !== 'plan_only'
    || multiAgentRun.body.run?.provider_mode !== 'mlx_fast_lane'
    || multiAgentRun.body.run?.summary?.localOnly !== true
    || multiAgentRun.body.run?.summary?.hermesBypassAllowed !== false
    || multiAgentRun.body.run?.contributions?.length !== 3
    || !multiAgentRun.body.run?.contributions?.every(contribution => contribution.status === 'planned')
    || !multiAgentRun.body.run?.contributions?.some(contribution => contribution.agent_id === 'coding' && contribution.provider === 'mlx')
  ) {
    fail('multi-agent plan-only run did not record local-only planned contributions');
  }

  const multiAgentRuns = await fetchJson(`${baseUrl}/api/v1/multi-agent/runs?limit=3`, { headers: authHeaders });

  if (!multiAgentRuns.body.runs?.some(run => run.id === multiAgentRun.body.run.id)) {
    fail('multi-agent runs endpoint did not return the recorded coordination run');
  }

  const companyIdentity = await fetchJson(`${baseUrl}/api/v1/company-identity`, { headers: authHeaders });

  if (
    companyIdentity.body.localOnly !== true
    || companyIdentity.body.externalAccountCreationEnabled !== false
    || companyIdentity.body.purchaseEnabled !== false
    || companyIdentity.body.identity?.company?.primaryDomain !== 'etherealdigital.ai'
    || companyIdentity.body.identity?.company?.firstCreatedDomain !== 'etherealdigit.ai'
    || !companyIdentity.body.identity?.company?.ownedDomains?.includes('etherealdigit.ai')
    || companyIdentity.body.identity?.company?.cloudflareAccountEmail !== 'patrick@lakepowellford.com'
    || companyIdentity.body.identity?.owner?.email !== 'patrick@etherealdigital.ai'
    || companyIdentity.body.identity?.company?.dnsProvider !== 'Cloudflare'
    || companyIdentity.body.identity?.tokenIdentity?.name !== 'EtherealAI'
    || companyIdentity.body.identity?.tokenIdentity?.preferredWebsiteDomain !== 'etherealdigit.ai'
    || !companyIdentity.body.checklist?.some(item => item.id === 'email_dns_visible')
    || !companyIdentity.body.checklist?.some(item => item.id === 'token_website_domain_recorded' && item.status === 'ready')
    || !companyIdentity.body.checklist?.some(item => item.id === 'external_actions_blocked' && item.status === 'ready')
    || companyIdentity.body.setupPlan?.cloudflareAccessPlan?.recommendedToken?.provider !== 'Cloudflare'
    || companyIdentity.body.setupPlan?.cloudflareAccessPlan?.externalMutationEnabled !== false
  ) {
    fail('company identity endpoint did not expose local-only Cloudflare domain/email state');
  }

  const companyDnsTargets = await fetchJson(`${baseUrl}/api/v1/company-identity/dns-targets`, { headers: authHeaders });

  if (
    companyDnsTargets.body.localOnly !== true
    || companyDnsTargets.body.externalMutationEnabled !== false
    || !Array.isArray(companyDnsTargets.body.targets)
    || companyDnsTargets.body.setupPlan?.primaryDomain !== 'etherealdigital.ai'
    || companyDnsTargets.body.setupPlan?.websitePrimaryDomain !== 'etherealdigit.ai'
    || !companyDnsTargets.body.setupPlan?.ownedDomains?.includes('etherealdigit.ai')
    || companyDnsTargets.body.setupPlan?.externalMutationEnabled !== false
    || companyDnsTargets.body.setupPlan?.cloudflareAccessPlan?.passwordLoginAllowed !== false
    || companyDnsTargets.body.setupPlan?.cloudflareAccessPlan?.tokenValuesAccepted !== false
    || companyDnsTargets.body.setupPlan?.cloudflareAccessPlan?.secretReferenceTemplate?.scope !== 'generic'
    || !companyDnsTargets.body.setupPlan?.recommendedManualSteps?.some(step => step.id === 'email_dns_targets')
  ) {
    fail('company DNS target endpoint did not expose local-only setup tracking state');
  }

  const localVerification = await fetchJson(`${baseUrl}/api/v1/local-verification-status`, { headers: authHeaders });
  const localStatus = localVerification.body.status || {};
  const localManifestIds = new Set((localStatus.manifests || []).map(manifest => manifest.id));
  const memoryHashes = new Set((localStatus.memory?.files || []).map(file => file.sha256).filter(Boolean));

  if (
    localStatus.ok !== true
    || localStatus.database?.ok !== true
    || !Array.isArray(localStatus.manifests)
    || !localStatus.manifests.every(manifest => manifest.ok === true)
    || !localManifestIds.has('local_models')
    || !localManifestIds.has('automation_policy')
    || !localManifestIds.has('local_secret_providers')
    || localStatus.memory?.synced !== true
    || !Array.isArray(localStatus.memory?.files)
    || localStatus.memory.files.length < 3
    || memoryHashes.size !== 1
    || localStatus.launchReadiness?.launchStatus !== 'blocked'
    || localStatus.launchReadiness?.liveExecution?.enabled !== false
    || localStatus.launchReadiness?.liveExecution?.orderEndpointEnabled !== false
    || localStatus.launchReadiness?.liveExecution?.goLiveAllowed !== false
    || !localStatus.launchReadiness?.requiredBlockedGates?.includes('live_order_endpoint_enabled')
  ) {
    fail('local verification status did not confirm synced memory, healthy local manifests, and blocked live launch state');
  }

  const mvpReadiness = await fetchJson(`${baseUrl}/api/v1/mvp-readiness-checklist`, { headers: authHeaders });
  const readiness = mvpReadiness.body.readiness || {};
  const checklist = readiness.checklist || [];
  const liveEndpointChecklistItem = checklist.find(item => item.id === 'live_order_endpoint_enabled');
  const localRuntimeChecklistItem = checklist.find(item => item.id === 'local_runtime');

  if (
    readiness.mvpStatus !== 'ready_for_owner_testing'
    || readiness.mvpCompletionPercent < 99
    || readiness.localEndToEndCompletionPercent < 90
    || readiness.completionLedger?.percentages?.mvp?.current < 99
    || readiness.completionLedger?.percentages?.localPaperEndToEnd?.current < 95
    || readiness.completionLedger?.percentages?.fullLiveEndToEnd?.current !== 72
    || !readiness.completionLedger?.gates?.some(gate => gate.id === 'owner_acceptance_recorded')
    || !readiness.completionLedger?.gates?.some(gate => gate.id === 'active_paper_schedule_reviewed')
    || readiness.liveEndToEndStatus !== 'locked'
    || readiness.liveEndToEndMessage !== 'Live E2E Locked — Future approval required.'
    || !readiness.completionLedger?.gates?.some(gate => gate.id === 'live_order_endpoint_enabled' && gate.status === 'locked_by_design')
    || readiness.automationModes?.paper?.canRunAutomatically !== true
    || readiness.automationModes?.paper?.reviewExportsEnabled !== true
    || readiness.automationModes?.paper?.liveExecutionEnabled !== false
    || readiness.automationModes?.live?.enabled !== false
    || readiness.automationModes?.live?.goLiveCommandExecution !== false
    || readiness.liveExecution?.enabled !== false
    || readiness.liveExecution?.orderEndpointEnabled !== false
    || readiness.liveExecution?.goLiveAllowed !== false
    || readiness.localEndToEndCompletionPercent < 95
    || readiness.automationModes?.paper?.dossierHistoryCsvExport !== true
    || readiness.botAutomationOwnerWorkflow?.monitorOnly !== true
    || readiness.botAutomationOwnerWorkflow?.exports?.dossierHistoryCsv !== true
    || readiness.botAutomationOwnerWorkflow?.routeSafetyProfile?.boundary !== 'monitor_only_no_live_orders'
    || readiness.botAutomationOwnerWorkflow?.routeSafetyProfile?.liveExecutionEnabled !== false
    || !readiness.botAutomationOwnerWorkflow?.checks?.some(check => check.id === 'live_execution_blocked' && check.status === 'ready')
    || readiness.ownerEvidenceManifest?.localOnly !== true
    || readiness.ownerEvidenceManifest?.liveExecutionEnabled !== false
    || readiness.ownerEvidenceManifest?.checksum?.algorithm !== 'sha256'
    || !/^[a-f0-9]{64}$/.test(readiness.ownerEvidenceManifest?.checksum?.value || '')
    || !readiness.ownerEvidenceManifest?.artifacts?.some(item => item.id === 'route_inventory_safety' && item.location === '/server-route-inventory')
    || !readiness.ownerEvidenceManifest?.artifacts?.some(item => item.id === 'bot_table_exports' && item.format === 'json/csv')
    || !isOwnerAcceptanceReadyOrAccepted(readiness.ownerAcceptance)
    || readiness.totals?.mvpBlockingItems !== 0
    || !Array.isArray(readiness.endToEndBlockingItems)
    || !readiness.endToEndBlockingItems.includes('live_order_endpoint_enabled')
    || localRuntimeChecklistItem?.status !== 'ready'
    || localRuntimeChecklistItem?.evidence?.includes('Port undefined')
    || liveEndpointChecklistItem?.status !== 'blocked'
    || liveEndpointChecklistItem?.mvpRequired !== false
    || !checklist.some(item => item.id === 'bot_automation_review_exports' && item.status === 'ready' && item.mvpRequired === true)
  ) {
    fail('MVP readiness checklist did not report owner-testable MVP status with live execution blocked');
  }

  const routeInventory = await fetchJson(`${baseUrl}/api/v1/server-route-inventory`, { headers: authHeaders });
  const inventory = routeInventory.body.inventory || {};

  if (
    inventory.modularizationPlan?.status !== 'inventory_only_no_route_split_applied'
    || inventory.totalRoutes < 100
    || inventory.safetyCriticalModules < 6
    || !Array.isArray(inventory.modules)
    || !inventory.modules.some(module => module.moduleId === 'artifacts' && module.files?.includes('app/server/src/routes/artifacts.js'))
    || !inventory.modules.some(module => module.moduleId === 'auth' && module.files?.includes('app/server/src/routes/auth.js'))
    || !inventory.modules.some(module => module.moduleId === 'automation-safety' && module.files?.includes('app/server/src/routes/automation-safety.js'))
    || !inventory.modules.some(module => module.moduleId === 'commands' && module.files?.includes('app/server/src/routes/commands.js'))
    || !inventory.modules.some(module => module.moduleId === 'creator' && module.files?.includes('app/server/src/routes/creator.js'))
    || !inventory.modules.some(module => module.moduleId === 'exchange-metadata' && module.files?.includes('app/server/src/routes/exchange-metadata.js'))
    || !inventory.modules.some(module => module.moduleId === 'wallet-control' && module.files?.includes('app/server/src/routes/wallet-control.js') && module.safetyProfile?.boundary === 'metadata_only_no_wallet_secrets')
    || !inventory.modules.some(module => module.moduleId === 'file-proposals' && module.files?.includes('app/server/src/routes/file-proposals.js'))
    || !inventory.modules.some(module => module.moduleId === 'local-models' && module.files?.includes('app/server/src/routes/local-models.js'))
    || !inventory.modules.some(module => module.moduleId === 'mac-security' && module.files?.includes('app/server/src/routes/mac-security.js') && module.safetyProfile?.boundary === 'read_only_local_mac_audit_no_privileged_mutation')
    || !inventory.modules.some(module => module.moduleId === 'multi-agent' && module.files?.includes('app/server/src/routes/multi-agent.js') && module.safetyProfile?.boundary === 'local_coordination_no_external_actions')
    || !inventory.modules.some(module => module.moduleId === 'market-data')
    || !inventory.modules.some(module => module.moduleId === 'strategy-research' && module.files?.includes('app/server/src/routes/strategy-research.js'))
    || !inventory.modules.some(module => module.moduleId === 'workspaces' && module.files?.includes('app/server/src/routes/workspaces.js'))
    || !inventory.modules.some(module => module.moduleId === 'bot-automation' && module.safetyProfile?.boundary === 'monitor_only_no_live_orders' && module.safetyProfile?.liveExecutionEnabled === false)
    || !inventory.modules.some(module => module.moduleId === 'automation-safety' && module.safetyProfile?.boundary === 'blocks_live_launch')
    || !inventory.modules.some(module => module.moduleId === 'exchange-metadata' && module.safetyProfile?.boundary === 'metadata_only_no_credentials')
    || !inventory.modules.some(module => module.moduleId === 'wallet-control' && module.safetyProfile?.signingEnabled === false && module.safetyProfile?.secretsStored === false)
    || !inventory.modules.some(module => module.moduleId === 'mac-security' && module.safetyProfile?.secretsStored === false && module.safetyProfile?.ownerReviewRequired === true)
    || !inventory.modules.some(module => module.moduleId === 'order-intents' && module.safetyProfile?.boundary === 'risk_review_no_execution')
    || !inventory.modules.some(module => module.moduleId === 'social-ops' && module.safetyProfile?.boundary === 'local_drafts_no_external_posting' && module.safetyProfile?.externalPostingEnabled === false)
    || !inventory.modules.some(module => module.moduleId === 'solidity-lab' && module.safetyProfile?.boundary === 'local_scaffold_no_deployment' && module.safetyProfile?.deploymentEnabled === false)
    || !inventory.modules.some(module => module.moduleId === 'pages' && module.files?.includes('app/server/src/routes/pages.js'))
    || !inventory.modules.some(module => module.moduleId === 'system' && module.files?.includes('app/server/src/routes/health.js'))
    || !inventory.modules.some(module => module.moduleId === 'system' && module.files?.includes('app/server/src/routes/readiness.js'))
    || !inventory.modules.some(module => module.moduleId === 'system' && module.files?.includes('app/server/src/routes/dev-server.js'))
    || !inventory.modules.some(module => module.moduleId === 'system' && module.files?.includes('app/server/src/routes/route-inventory.js'))
    || !inventory.modules.some(module => module.moduleId === 'system' && module.files?.includes('app/server/src/routes/system-config.js'))
    || !inventory.modules.some(module => module.moduleId === 'system' && module.files?.includes('app/server/src/routes/system-memory.js'))
    || !inventory.modules.some(module => module.moduleId === 'system' && module.files?.includes('app/server/src/routes/owner-proof-packet.js'))
    || !inventory.modules.some(module => module.moduleId === 'system' && module.files?.includes('app/server/src/routes/owner-acceptance.js'))
    || !Array.isArray(inventory.routes)
    || !inventory.routes.some(route => route.path === '/api/v1/artifacts' && route.file === 'app/server/src/routes/artifacts.js')
    || !inventory.routes.some(route => route.path === '/api/v1/automation-safety-summary' && route.file === 'app/server/src/routes/automation-safety.js')
    || !inventory.routes.some(route => route.path === '/api/v1/automation-safety-history' && route.file === 'app/server/src/routes/automation-safety.js')
    || !inventory.routes.some(route => route.path === '/api/v1/launch-readiness-summary' && route.file === 'app/server/src/routes/automation-safety.js')
    || !inventory.routes.some(route => route.path === '/api/v1/live-execution-handoff' && route.file === 'app/server/src/routes/automation-safety.js')
    || !inventory.routes.some(route => route.path === '/api/v1/local-model/generate' && route.file === 'app/server/src/routes/local-models.js')
    || !inventory.routes.some(route => route.path === '/api/v1/local-model/route' && route.file === 'app/server/src/routes/local-models.js')
    || !inventory.routes.some(route => route.path === '/api/v1/local-model/benchmark' && route.file === 'app/server/src/routes/local-models.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/local-model/mlx-lifecycle' && route.file === 'app/server/src/routes/local-models.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/local-model/mlx-lifecycle/start' && route.file === 'app/server/src/routes/local-models.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/local-model/mlx-lifecycle/stop' && route.file === 'app/server/src/routes/local-models.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/multi-agent/registry' && route.file === 'app/server/src/routes/multi-agent.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/multi-agent/runs' && route.file === 'app/server/src/routes/multi-agent.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/multi-agent/runs' && route.file === 'app/server/src/routes/multi-agent.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/creator/tasks' && route.file === 'app/server/src/routes/creator.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/creator/tasks' && route.file === 'app/server/src/routes/creator.js')
    || !inventory.routes.some(route => route.path === '/api/v1/creator/tasks/:id' && route.file === 'app/server/src/routes/creator.js')
    || !inventory.routes.some(route => route.path === '/api/v1/creator/tasks/:id/advance' && route.file === 'app/server/src/routes/creator.js')
    || !inventory.routes.some(route => route.path === '/api/v1/creator/tasks/:id/scaffold' && route.file === 'app/server/src/routes/creator.js')
    || !inventory.routes.some(route => route.path === '/api/v1/creator/tasks/:id/file-proposals/generate' && route.file === 'app/server/src/routes/creator.js')
    || !inventory.routes.some(route => route.path === '/api/v1/creator/tasks/:id/file-proposals/generate-batch' && route.file === 'app/server/src/routes/creator.js')
    || !inventory.routes.some(route => route.path === '/api/v1/creator/tasks/:id/workspace-edits/generate' && route.file === 'app/server/src/routes/creator.js')
    || !inventory.routes.some(route => route.path === '/api/v1/creator/tasks/:id/checklist' && route.file === 'app/server/src/routes/creator.js')
    || !inventory.routes.some(route => route.path === '/api/v1/creator/tasks/:id/checklist/generate' && route.file === 'app/server/src/routes/creator.js')
    || !inventory.routes.some(route => route.path === '/api/v1/creator/checklist/:id' && route.file === 'app/server/src/routes/creator.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/file-proposals' && route.file === 'app/server/src/routes/file-proposals.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/file-proposals' && route.file === 'app/server/src/routes/file-proposals.js')
    || !inventory.routes.some(route => route.path === '/api/v1/file-proposals/:id' && route.file === 'app/server/src/routes/file-proposals.js')
    || !inventory.routes.some(route => route.path === '/api/v1/file-proposals/:id/apply' && route.file === 'app/server/src/routes/file-proposals.js')
    || !inventory.routes.some(route => route.path === '/api/v1/git/status' && route.file === 'app/server/src/routes/commands.js')
    || !inventory.routes.some(route => route.path === '/api/v1/git/publish-status' && route.file === 'app/server/src/routes/commands.js')
    || !inventory.routes.some(route => route.path === '/api/v1/git/checkpoints' && route.file === 'app/server/src/routes/commands.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/command-requests' && route.file === 'app/server/src/routes/commands.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/command-requests' && route.file === 'app/server/src/routes/commands.js')
    || !inventory.routes.some(route => route.path === '/api/v1/command-templates' && route.file === 'app/server/src/routes/commands.js')
    || !inventory.routes.some(route => route.path === '/api/v1/command-templates/:id/run' && route.file === 'app/server/src/routes/commands.js')
    || !inventory.routes.some(route => route.path === '/api/v1/command-requests/:id/run' && route.file === 'app/server/src/routes/commands.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/strategies' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/strategies' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/strategies/:id' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/strategies/:id/backtests' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/backtests' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/backtests/:id' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/strategies/:id/optimization-sweeps' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/optimization-sweeps' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/optimization-sweeps/:id' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/strategies/:id/split-tests' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/split-tests' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/split-tests/:id' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/strategies/:id/walk-forward-tests' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/walk-forward-tests' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/walk-forward-tests/:id' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/decision-logs' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/decision-logs/:id' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/paper-sessions' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/paper-sessions/:id' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/strategies/:id/paper-sessions' && route.file === 'app/server/src/routes/strategy-research.js')
    || !inventory.routes.some(route => route.path === '/api/v1/local-secret-provider-capabilities' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/local-secret-references' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/local-secret-references' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.path === '/api/v1/local-secret-references/:id' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/exchange-connectors' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/exchange-connectors' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.path === '/api/v1/exchange-connectors/:id' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.path === '/api/v1/exchange-connectors/:id/readiness' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.path === '/api/v1/exchange-connectors/:id/readiness-events' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.path === '/api/v1/exchange-connector-readiness-events/:id' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.path === '/api/v1/exchange-adapter-contracts' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.path === '/api/v1/exchange-adapter-scaffolds' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.path === '/api/v1/exchange-adapter-scaffolds/:exchangeName' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.path === '/api/v1/exchange-connectors/:id/adapter-contract-check' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.path === '/api/v1/exchange-connectors/:id/adapter-contract-events' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.path === '/api/v1/exchange-adapter-contract-events/:id' && route.file === 'app/server/src/routes/exchange-metadata.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/operator-control-center' && route.file === 'app/server/src/routes/wallet-control.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/mac-security/audit' && route.file === 'app/server/src/routes/mac-security.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/mac-security/guide' && route.file === 'app/server/src/routes/mac-security.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/wallets' && route.file === 'app/server/src/routes/wallet-control.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/wallets' && route.file === 'app/server/src/routes/wallet-control.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/wallets/:id' && route.file === 'app/server/src/routes/wallet-control.js')
    || !inventory.routes.some(route => route.method === 'PATCH' && route.path === '/api/v1/wallets/:id' && route.file === 'app/server/src/routes/wallet-control.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/wallets/:id/readiness' && route.file === 'app/server/src/routes/wallet-control.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/wallets/:id/revoke' && route.file === 'app/server/src/routes/wallet-control.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/wallet-permission-events' && route.file === 'app/server/src/routes/wallet-control.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/market-data/providers' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/market-data/providers' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/providers/:id' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/providers/:id/health-check' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/market-data/refresh-schedules' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/market-data/refresh-schedules' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/refresh-schedules/:id' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'PATCH' && route.path === '/api/v1/market-data/refresh-schedules/:id' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/refresh-schedules/:id/history' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/refresh-schedules/:id/run' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/refresh-schedules/:id/cleanup' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/market-data/refresh-runs' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/refresh-runs/:id' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/market-data/imports' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/market-data/imports' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/market-data/imports/:id' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'PATCH' && route.path === '/api/v1/market-data/imports/:id' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'DELETE' && route.path === '/api/v1/market-data/imports/:id' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/imports/:id/candles' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/market-data/import-jobs' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/market-data/import-jobs' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/market-data/import-jobs/:id' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/import-jobs/upload' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/import-jobs/:id/cancel' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/import-jobs/:id/retry' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.path === '/api/v1/market-data/import-jobs/:id/discard-source' && route.file === 'app/server/src/routes/market-data.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/risk-profiles' && route.file === 'app/server/src/routes/risk-profiles.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/risk-profiles' && route.file === 'app/server/src/routes/risk-profiles.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/risk-profiles/:id' && route.file === 'app/server/src/routes/risk-profiles.js')
    || !inventory.routes.some(route => route.method === 'PATCH' && route.path === '/api/v1/risk-profiles/:id' && route.file === 'app/server/src/routes/risk-profiles.js')
    || !inventory.routes.some(route => route.path === '/api/v1/risk-profiles/:id/audit-events' && route.file === 'app/server/src/routes/risk-profiles.js')
    || !inventory.routes.some(route => route.path === '/api/v1/risk-profiles/:id/kill-switch-impact' && route.file === 'app/server/src/routes/risk-profiles.js')
    || !inventory.routes.some(route => route.path === '/api/v1/risk-profile-audit-events/:id' && route.file === 'app/server/src/routes/risk-profiles.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/order-intents' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/order-intents' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/order-intents/simulate-cross-exchange' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/order-intents/arbitrage-simulations' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/order-intents/arbitrage-simulations/:id' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/order-intents/arbitrage-simulations/:id/draft-intents' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/order-intents/rebalance-candidates/import-csv' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/order-intents/rebalance-batches' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/order-intents/rebalance-batches' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/order-intents/rebalance-review-queue' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/order-intents/rebalance-batches/:id' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'PATCH' && route.path === '/api/v1/order-intents/rebalance-batches/:id' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/order-intents/rebalance-batches/:id/export' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/order-intents/rebalance-batches/:id/draft-intents' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.path === '/api/v1/order-intents/:id' && route.file === 'app/server/src/routes/order-intents.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/social-posts' && route.file === 'app/server/src/routes/social-ops.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/social-posts' && route.file === 'app/server/src/routes/social-ops.js')
    || !inventory.routes.some(route => route.path === '/api/v1/social-posts/:id' && route.file === 'app/server/src/routes/social-ops.js')
    || !inventory.routes.some(route => route.path === '/api/v1/social-posts/generate' && route.file === 'app/server/src/routes/social-ops.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/social-posts/rebalance-batches/:id/campaign-drafts' && route.file === 'app/server/src/routes/social-ops.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/solidity-contracts' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/solidity-contracts' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/solidity-contracts/:id' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.path === '/api/v1/solidity-contracts/:id/starter' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.path === '/api/v1/solidity-contracts/:id/review' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.path === '/api/v1/solidity-contracts/:id/ecosystem-blueprint' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.path === '/api/v1/solidity-contracts/:id/scaffold' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/solidity-ecosystem/catalog' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/token-ecosystem-projects' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/token-ecosystem-projects' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/token-ecosystem-projects/:id' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/token-ecosystem-projects/:id/artifacts' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'PATCH' && route.path === '/api/v1/token-ecosystem-projects/:id' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'DELETE' && route.path === '/api/v1/token-ecosystem-projects/:id' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/token-ecosystem-projects/:id/workspace' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/token-ecosystem-projects/:id/website-deploy-package' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/token-ecosystem-projects/:id/cloudflare-dns-plan' && route.file === 'app/server/src/routes/solidity-lab.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/strategies/:id/run-safe-paper-test' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/bot-automation-capability-path' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/bot-automation-plans' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/bot-automation-plans' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/bot-automation-plans/:id' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.method === 'PATCH' && route.path === '/api/v1/bot-automation-plans/:id' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.path === '/api/v1/bot-automation-plans/:id/review' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.path === '/api/v1/bot-automation-plans/:id/live-readiness' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.path === '/api/v1/bot-automation-plans/:id/live-readiness-events' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/bot-automation-plans/:id/safety-dossier' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.path === '/api/v1/bot-live-readiness-events/:id' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.path === '/api/v1/bot-automation-plans/:id/live-enablement-reviews' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.path === '/api/v1/bot-automation-plans/:id/go-live-command' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.path === '/api/v1/bot-live-enablement-reviews/:id' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/bot-automation-runs' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.path === '/api/v1/bot-automation-runs/:id' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.path === '/api/v1/bot-automation-plans/:id/paper-runs' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/bot-automation-schedules' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/bot-automation-schedules/:id' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.path === '/api/v1/bot-automation-plans/:id/schedules' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.method === 'PATCH' && route.path === '/api/v1/bot-automation-schedules/:id' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.path === '/api/v1/bot-automation-schedules/:id/run' && route.file === 'app/server/src/routes/bot-automation.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/workspaces' && route.file === 'app/server/src/routes/workspaces.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/workspaces' && route.file === 'app/server/src/routes/workspaces.js')
    || !inventory.routes.some(route => route.path === '/api/v1/workspaces/:id/files' && route.file === 'app/server/src/routes/workspaces.js')
    || !inventory.routes.some(route => route.path === '/api/v1/workspaces/:id/files/content' && route.file === 'app/server/src/routes/workspaces.js')
    || !inventory.routes.some(route => route.path === '/api/v1/health' && route.file === 'app/server/src/routes/health.js')
    || !inventory.routes.some(route => route.path === '/api/v1/local-verification-status' && route.file === 'app/server/src/routes/readiness.js')
    || !inventory.routes.some(route => route.path === '/api/v1/mvp-readiness-checklist' && route.file === 'app/server/src/routes/readiness.js')
    || !inventory.routes.some(route => route.path === '/api/v1/dev-server/status' && route.file === 'app/server/src/routes/dev-server.js')
    || !inventory.routes.some(route => route.path === '/api/v1/dev-server/logs' && route.file === 'app/server/src/routes/dev-server.js')
    || !inventory.routes.some(route => route.path === '/api/v1/model-roles' && route.file === 'app/server/src/routes/system-config.js')
    || !inventory.routes.some(route => route.path === '/api/v1/policy' && route.file === 'app/server/src/routes/system-config.js')
    || !inventory.routes.some(route => route.path === '/api/v1/company-identity' && route.file === 'app/server/src/routes/company-identity.js')
    || !inventory.routes.some(route => route.path === '/api/v1/company-identity/dns-targets' && route.file === 'app/server/src/routes/company-identity.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/company-identity/dns-targets/verify-public' && route.file === 'app/server/src/routes/company-identity.js')
    || !inventory.routes.some(route => route.path === '/api/v1/company-identity/dns-targets/:id' && route.file === 'app/server/src/routes/company-identity.js')
    || !inventory.routes.some(route => route.path === '/api/v1/system-memory' && route.file === 'app/server/src/routes/system-memory.js')
    || !inventory.routes.some(route => route.path === '/api/v1/owner-proof-packet' && route.file === 'app/server/src/routes/owner-proof-packet.js')
    || !inventory.routes.some(route => route.path === '/api/v1/owner-acceptance' && route.file === 'app/server/src/routes/owner-acceptance.js')
    || !inventory.routes.some(route => route.method === 'GET' && route.path === '/api/v1/owner-setup-wizard' && route.file === 'app/server/src/routes/owner-setup-wizard.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/owner-setup-wizard/verify/:gateId' && route.file === 'app/server/src/routes/owner-setup-wizard.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/owner-setup-wizard/paper-verification-run' && route.file === 'app/server/src/routes/owner-setup-wizard.js')
    || !inventory.routes.some(route => route.method === 'POST' && route.path === '/api/v1/owner-setup-wizard/env-template' && route.file === 'app/server/src/routes/owner-setup-wizard.js')
    || !inventory.modules.some(module => module.moduleId === 'owner-setup' && module.safetyProfile?.boundary === 'setup_wizard_no_secret_values_no_live_execution')
    || !inventory.routes.some(route => route.path === '/api/v1/server-route-inventory' && route.file === 'app/server/src/routes/route-inventory.js')
    || !inventory.routes.some(route => route.path === '/api/v1/auth/login' && route.file === 'app/server/src/routes/auth.js')
    || !inventory.routes.some(route => route.path === '/dashboard' && route.file === 'app/server/src/routes/pages.js')
    || !inventory.routes.some(route => route.path === '/operator-control' && route.file === 'app/server/src/routes/pages.js')
    || !inventory.routes.some(route => route.path === '/security-lockdown' && route.file === 'app/server/src/routes/pages.js')
    || !inventory.routes.some(route => route.path === '/owner-setup' && route.file === 'app/server/src/routes/pages.js')
    || !inventory.routes.some(route => route.path === '/operator-manual' && route.file === 'app/server/src/routes/pages.js')
    || !inventory.routes.some(route => route.path === '/operator-training' && route.file === 'app/server/src/routes/pages.js')
    || !inventory.routes.some(route => route.path === '/owner-proof-packet' && route.file === 'app/server/src/routes/pages.js')
  ) {
    fail('server route inventory did not expose expected modularization inventory data');
  }

  const gitPublishStatus = await fetchJson(`${baseUrl}/api/v1/git/publish-status?owner=EtherealCoin&repo=EtherealAI`, {
    headers: authHeaders
  });

  if (
    gitPublishStatus.body.target?.owner !== 'EtherealCoin'
    || gitPublishStatus.body.target?.repo !== 'EtherealAI'
    || gitPublishStatus.body.publishReadiness?.passwordAuthAllowed !== false
    || gitPublishStatus.body.publishReadiness?.tokenStoredByEtherealAI !== false
    || gitPublishStatus.body.publishReadiness?.externalAccountCreatedByEtherealAI !== false
    || !gitPublishStatus.body.publishReadiness?.blockedBy?.includes('github_authentication_required')
    || gitPublishStatus.body.safetyBoundary?.noCredentialStored !== true
    || gitPublishStatus.body.safetyBoundary?.noAccountCreation !== true
  ) {
    fail('git publish status did not expose local-only GitHub auth boundary');
  }

  const providers = await fetchJson(`${baseUrl}/api/v1/market-data/providers`, { headers: authHeaders });
  const providerRows = providers.body.providers || [];

  if (!providerRows.length || providerRows.some(provider => !Number.isFinite(Number(provider.provider_candle_limit)))) {
    fail('providers endpoint did not include provider candle limits');
  }

  const schedules = await fetchJson(`${baseUrl}/api/v1/market-data/refresh-schedules`, { headers: authHeaders });
  const scheduleRows = schedules.body.schedules || [];

  if (scheduleRows.some(schedule => !Object.prototype.hasOwnProperty.call(schedule, 'backfill_start_at'))) {
    fail('refresh schedules did not include backfill fields');
  }

  const botPlans = await fetchJson(`${baseUrl}/api/v1/bot-automation-plans`, { headers: authHeaders });
  const botPlanRows = botPlans.body.plans || [];

  if (botPlanRows.some(plan => plan.readiness?.liveExecution?.enabled !== false)) {
    fail('bot automation plans must report live execution disabled');
  }

  const botRuns = await fetchJson(`${baseUrl}/api/v1/bot-automation-runs`, { headers: authHeaders });
  const botRunRows = botRuns.body.runs || [];

  if (botRunRows.some(run => run.result?.liveExecution?.enabled !== false)) {
    fail('paper bot runs must report live execution disabled');
  }

  const botSchedules = await fetchJson(`${baseUrl}/api/v1/bot-automation-schedules`, { headers: authHeaders });
  const botScheduleRows = botSchedules.body.schedules || [];

  if (botScheduleRows.some(schedule => !['paused', 'active', 'archived'].includes(schedule.status))) {
    fail('bot automation schedules returned an unsupported status');
  }

  const automationSafety = await fetchJson(`${baseUrl}/api/v1/automation-safety-summary`, { headers: authHeaders });

  if (
    automationSafety.body.summary?.liveExecution?.enabled !== false
    || automationSafety.body.summary?.liveExecution?.goLiveAllowed !== false
  ) {
    fail('automation safety summary reported live execution enabled or go-live allowed');
  }

  const automationSafetyHistory = await fetchJson(`${baseUrl}/api/v1/automation-safety-history?days=14`, { headers: authHeaders });

  if (
    automationSafetyHistory.body.history?.liveExecution?.enabled !== false
    || automationSafetyHistory.body.history?.liveExecution?.goLiveAllowed !== false
    || !Array.isArray(automationSafetyHistory.body.history?.series?.adapterContractEvents)
    || !Array.isArray(automationSafetyHistory.body.history?.series?.riskAuditEvents)
  ) {
    fail('automation safety history did not return disabled monitor-only series');
  }

  const launchReadiness = await fetchJson(`${baseUrl}/api/v1/launch-readiness-summary`, { headers: authHeaders });

  if (
    launchReadiness.body.summary?.launchStatus !== 'blocked'
    || launchReadiness.body.summary?.liveExecution?.enabled !== false
    || launchReadiness.body.summary?.liveExecution?.goLiveAllowed !== false
    || !launchReadiness.body.summary?.blockingFailures?.includes('credential_loader_implemented')
    || !launchReadiness.body.summary?.blockingFailures?.includes('live_order_adapter_implemented')
    || !Array.isArray(launchReadiness.body.summary?.capabilities?.secretProviders)
    || !Array.isArray(launchReadiness.body.summary?.capabilities?.adapterScaffolds)
  ) {
    fail('launch readiness summary did not return blocked monitor-only gates');
  }

  const liveHandoff = await fetchJson(`${baseUrl}/api/v1/live-execution-handoff`, { headers: authHeaders });

  if (
    liveHandoff.body.handoff?.status !== 'owner_key_gated'
    || liveHandoff.body.handoff?.liveExecutionEnabled !== false
    || liveHandoff.body.handoff?.actualFullLiveEndToEndPercent !== 72
    || !Number.isFinite(Number(liveHandoff.body.handoff?.softwareHandoffCompletionPercent))
    || !liveHandoff.body.handoff?.ownerKeyGates?.some(gate => gate.id === 'exchange_api_key_reference')
    || !liveHandoff.body.handoff?.ownerKeyGates?.some(gate => gate.id === 'wallet_or_deployment_key_reference')
    || !liveHandoff.body.handoff?.softwareStages?.some(stage => stage.id === 'live_order_endpoint' && stage.status === 'blocked_by_design')
  ) {
    fail('live execution handoff did not expose owner-key-gated full E2E state');
  }

  const secretProviderCapabilities = await fetchJson(`${baseUrl}/api/v1/local-secret-provider-capabilities`, { headers: authHeaders });

  if (
    secretProviderCapabilities.body.capabilities?.secretValuesAccepted !== false
    || secretProviderCapabilities.body.capabilities?.databaseStoresSecretValues !== false
    || secretProviderCapabilities.body.capabilities?.credentialLoadingImplemented !== false
    || secretProviderCapabilities.body.capabilities?.liveExecution?.enabled !== false
    || !secretProviderCapabilities.body.capabilities?.providers?.some(provider => (
      provider.providerType === 'macos_keychain'
      && provider.secretValuesAccepted === false
      && provider.credentialLoadingImplemented === false
    ))
  ) {
    fail('local secret-provider capabilities did not report disabled metadata-only providers');
  }

  const secretReferences = await fetchJson(`${baseUrl}/api/v1/local-secret-references`, { headers: authHeaders });

  if (!Array.isArray(secretReferences.body.references)) {
    fail('local secret references endpoint did not return a references array');
  }

  await fetchJsonExpectStatus(`${baseUrl}/api/v1/local-secret-references`, {
    method: 'POST',
    headers: authJsonHeaders(cookie),
    body: JSON.stringify({
      label: 'Bad inline secret reference fixture',
      providerType: 'macos_keychain',
      referenceName: `sk-${'a'.repeat(40)}`,
      scope: 'exchange_connector'
    })
  }, 400);

  await runSecretReferenceConnectorChecks(baseUrl, cookie);
  await runWalletControlFixtureChecks(baseUrl, cookie);
  await runBotAutomationFixtureChecks(baseUrl, cookie);

  const macSecurityAudit = await fetchJson(`${baseUrl}/api/v1/mac-security/audit`, { headers: authHeaders });

  if (
    macSecurityAudit.body.localOnly !== true
    || macSecurityAudit.body.readOnlyAudit !== true
    || macSecurityAudit.body.privilegedMutation !== false
    || macSecurityAudit.body.secretsInspected !== false
    || macSecurityAudit.body.audit?.safetyBoundary?.readOnlyAudit !== true
    || !Array.isArray(macSecurityAudit.body.audit?.checks)
    || !macSecurityAudit.body.audit.checks.some(check => check.id === 'filevault')
    || !macSecurityAudit.body.audit.checks.some(check => check.id === 'admin_group_membership')
    || !macSecurityAudit.body.audit.checks.some(check => check.id === 'mdm_enrollment')
    || !macSecurityAudit.body.audit.checks.some(check => check.id === 'activity_monitor_review')
    || !macSecurityAudit.body.audit.checks.some(check => check.id === 'established_connections')
    || !macSecurityAudit.body.audit.checks.some(check => check.id === 'wifi_dns_servers')
    || !macSecurityAudit.body.audit.checks.some(check => check.id === 'wifi_web_proxy')
    || !macSecurityAudit.body.audit.checks.some(check => check.id === 'startup_persistence_items')
    || !macSecurityAudit.body.audit.checks.some(check => check.id === 'etherealai_bind_host' && check.status === 'pass')
    || !Array.isArray(macSecurityAudit.body.audit?.adminAccounts?.accounts)
    || !Array.isArray(macSecurityAudit.body.audit?.adminAccounts?.humanAdmins)
    || !Array.isArray(macSecurityAudit.body.audit?.adminAccounts?.systemAdmins)
    || !Array.isArray(macSecurityAudit.body.audit?.processActivity?.topCpu)
    || !Array.isArray(macSecurityAudit.body.audit?.processActivity?.topMemory)
    || !Array.isArray(macSecurityAudit.body.audit?.establishedConnections)
    || !Array.isArray(macSecurityAudit.body.audit?.startupItems)
    || !macSecurityAudit.body.guide?.rules?.some(rule => rule.includes('VPNs can improve transport privacy'))
    || !macSecurityAudit.body.guide?.compromisedHostProtocol?.some(item => item.includes('admin rights, MDM'))
    || !macSecurityAudit.body.guide?.cleanRoomRecoveryPlan?.some(item => item.includes('DFU restore/revive'))
    || !macSecurityAudit.body.guide?.airbnbNetworkPlan?.some(item => item.includes('Airbnb router as hostile infrastructure'))
    || !macSecurityAudit.body.guide?.ownerSettingsChecklist?.some(item => item.area.includes('General > Sharing'))
    || macSecurityAudit.body.guide?.etherealAiSecurityBoundary?.bindsToLoopbackByDefault !== true
  ) {
    fail('mac security audit API did not expose read-only local host hardening state');
  }

  const systemMemory = await fetchJson(`${baseUrl}/api/v1/system-memory`, { headers: authHeaders });

  if (!Object.prototype.hasOwnProperty.call(systemMemory.body.snapshot?.counts || {}, 'exchange_connector_readiness_events')) {
    fail('system memory did not include exchange connector readiness event counts');
  }

  if (!Object.prototype.hasOwnProperty.call(systemMemory.body.snapshot?.counts || {}, 'exchange_adapter_contract_events')) {
    fail('system memory did not include exchange adapter contract event counts');
  }

  if (!Object.prototype.hasOwnProperty.call(systemMemory.body.snapshot?.counts || {}, 'bot_live_enablement_reviews')) {
    fail('system memory did not include bot live enablement review counts');
  }

  if (!Object.prototype.hasOwnProperty.call(systemMemory.body.snapshot?.counts || {}, 'owner_wallets')) {
    fail('system memory did not include owner wallet counts');
  }

  if (!Object.prototype.hasOwnProperty.call(systemMemory.body.snapshot?.counts || {}, 'wallet_permission_events')) {
    fail('system memory did not include wallet permission event counts');
  }

  if (
    systemMemory.body.snapshot?.ownerEvidence?.localOnly !== true
    || systemMemory.body.snapshot?.ownerEvidence?.liveExecutionEnabled !== false
    || systemMemory.body.snapshot?.ownerEvidence?.routeBoundary !== 'monitor_only_no_live_orders'
    || systemMemory.body.snapshot?.botAutomationCapabilityPath?.paperAutomation?.enabled !== true
    || systemMemory.body.snapshot?.botAutomationCapabilityPath?.futureLiveAutomation?.enabled !== false
    || !systemMemory.body.snapshot?.botAutomationCapabilityPath?.futureLiveAutomation?.blockedGates?.includes('live_order_endpoint_enabled')
    || !isOwnerAcceptanceReadyOrAccepted(systemMemory.body.snapshot?.ownerAcceptance)
    || !Object.prototype.hasOwnProperty.call(systemMemory.body.snapshot?.counts || {}, 'owner_acceptance_records')
    || !Number.isFinite(Number(systemMemory.body.snapshot?.counts?.arbitrage_simulation_runs))
    || !Array.isArray(systemMemory.body.snapshot?.recent?.arbitrageSimulationRuns)
    || !systemMemory.body.snapshot?.recent?.arbitrageSimulationRuns?.some(run => (
      run.localOnly === true
      && run.networkCallsEnabled === false
      && run.liveExecutionEnabled === false
      && run.result?.safetyBoundary?.liveExecutionEnabled === false
    ))
    || !Number.isFinite(Number(systemMemory.body.snapshot?.counts?.rebalance_simulation_batches))
    || !Array.isArray(systemMemory.body.snapshot?.recent?.rebalanceSimulationBatches)
    || !systemMemory.body.snapshot?.recent?.rebalanceSimulationBatches?.some(batch => (
      batch.localOnly === true
      && batch.networkCallsEnabled === false
      && batch.liveExecutionEnabled === false
      && batch.result?.safetyBoundary?.liveExecutionEnabled === false
    ))
    || !Array.isArray(systemMemory.body.snapshot?.recent?.socialPosts)
    || !systemMemory.body.snapshot?.recent?.socialPosts?.some(post => (
      post.metadata?.source === 'rebalance_batch_campaign_draft_v1'
      && post.metadata?.externalPostingEnabled === false
      && post.metadata?.liveExecutionEnabled === false
    ))
    || !Number.isFinite(Number(systemMemory.body.snapshot?.counts?.token_ecosystem_projects))
    || !Array.isArray(systemMemory.body.snapshot?.recent?.tokenEcosystemProjects)
    || !systemMemory.body.snapshot?.recent?.tokenEcosystemProjects?.some(project => (
      project.localOnly === true
      && project.externalActionsEnabled === false
      && project.blueprint?.safetyBoundary?.deploymentEnabled === false
    ))
    || !Array.isArray(systemMemory.body.snapshot?.recent?.ownerAcceptanceRecords)
    || !Array.isArray(systemMemory.body.snapshot?.recent?.ownerWallets)
    || !Array.isArray(systemMemory.body.snapshot?.recent?.walletPermissionEvents)
    || !systemMemory.body.snapshot?.ownerEvidence?.proofSurfaces?.some(surface => (
      surface.id === 'owner_proof_packet'
      && surface.location === '/owner-proof-packet'
      && surface.localOnly === true
      && surface.liveExecutionEnabled === false
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.proofSurfaces?.some(surface => (
      surface.id === 'dashboard_readiness'
      && surface.location === '/dashboard'
      && surface.localOnly === true
      && surface.liveExecutionEnabled === false
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.proofSurfaces?.some(surface => (
      surface.id === 'mvp_test_pass_manifest'
      && surface.location === '/mvp-test-pass'
      && surface.localOnly === true
      && surface.liveExecutionEnabled === false
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.proofSurfaces?.some(surface => (
      surface.id === 'owner_setup_wizard'
      && surface.location === '/owner-setup'
      && surface.secretValuesReturned === false
      && surface.liveExecutionEnabled === false
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.proofSurfaces?.some(surface => (
      surface.id === 'operator_control_wallets'
      && surface.location === '/operator-control'
      && surface.signingEnabled === false
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.proofSurfaces?.some(surface => (
      surface.id === 'mac_security_lockdown'
      && surface.location === '/security-lockdown'
      && surface.readOnlyAudit === true
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.proofSurfaces?.some(surface => (
      surface.id === 'social_ops_drafts'
      && surface.location === '/social-ops'
      && surface.externalPostingEnabled === false
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.proofSurfaces?.some(surface => (
      surface.id === 'solidity_lab_scaffolds'
      && surface.location === '/solidity-lab'
      && surface.deploymentEnabled === false
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.exportSurfaces?.some(surface => surface.id === 'owner_evidence_manifest_json' && surface.location === '/mvp-test-pass')
    || !systemMemory.body.snapshot?.ownerEvidence?.exportSurfaces?.some(surface => surface.id === 'bot_safety_dossier_history_csv' && surface.format === 'csv')
    || !systemMemory.body.snapshot?.ownerEvidence?.reviewChecklist?.includes('Confirm checksum marker')
    || !systemMemory.body.snapshot?.ownerEvidence?.reviewChecklist?.includes('Confirm live execution remains blocked')
    || !systemMemory.body.snapshot?.ownerEvidence?.fullLiveBlockers?.includes('live_order_endpoint_enabled')
    || !systemMemory.body.snapshot?.ownerEvidence?.fullLiveBlockers?.includes('owner_go_live_command_accepted')
    || !Number.isFinite(Number(systemMemory.body.snapshot?.counts?.multi_agent_coordination_runs))
    || !Number.isFinite(Number(systemMemory.body.snapshot?.counts?.multi_agent_contributions))
    || !Number.isFinite(Number(systemMemory.body.snapshot?.counts?.company_dns_targets))
    || !Array.isArray(systemMemory.body.snapshot?.recent?.multiAgentRuns)
    || !Array.isArray(systemMemory.body.snapshot?.recent?.multiAgentContributions)
    || !Array.isArray(systemMemory.body.snapshot?.recent?.companyDnsTargets)
    || !systemMemory.body.snapshot?.recent?.multiAgentRuns?.some(run => run.summary?.localOnly === true)
    || systemMemory.body.snapshot?.companyIdentity?.identity?.company?.primaryDomain !== 'etherealdigital.ai'
    || systemMemory.body.snapshot?.companyIdentity?.identity?.company?.firstCreatedDomain !== 'etherealdigit.ai'
    || !systemMemory.body.snapshot?.companyIdentity?.identity?.company?.ownedDomains?.includes('etherealdigit.ai')
    || systemMemory.body.snapshot?.companyIdentity?.identity?.owner?.email !== 'patrick@etherealdigital.ai'
    || systemMemory.body.snapshot?.companyIdentity?.identity?.tokenIdentity?.preferredWebsiteDomain !== 'etherealdigit.ai'
    || !systemMemory.body.snapshot?.companyIdentity?.checklist?.some(item => item.id === 'external_actions_blocked' && item.status === 'ready')
    || !systemMemory.body.snapshot?.ownerEvidence?.externalSurfaceBoundaries?.some(boundary => (
      boundary.moduleId === 'social-ops'
      && boundary.boundary === 'local_drafts_no_external_posting'
      && boundary.externalPostingEnabled === false
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.externalSurfaceBoundaries?.some(boundary => (
      boundary.moduleId === 'solidity-lab'
      && boundary.boundary === 'local_scaffold_no_deployment'
      && boundary.deploymentEnabled === false
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.externalSurfaceBoundaries?.some(boundary => (
      boundary.moduleId === 'owner-setup'
      && boundary.boundary === 'setup_wizard_no_secret_values_no_live_execution'
      && boundary.secretValuesReturned === false
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.externalSurfaceBoundaries?.some(boundary => (
      boundary.moduleId === 'wallet-control'
      && boundary.boundary === 'metadata_only_no_wallet_secrets'
      && boundary.signingEnabled === false
    ))
    || !systemMemory.body.snapshot?.ownerEvidence?.externalSurfaceBoundaries?.some(boundary => (
      boundary.moduleId === 'mac-security'
      && boundary.boundary === 'read_only_local_mac_audit_no_privileged_mutation'
      && boundary.readOnlyAudit === true
    ))
  ) {
    fail('system memory did not include owner evidence manifest and live-blocker references');
  }

  pass('authenticated health/local-verification/mvp-readiness/route-inventory/provider/schedule/bot-plan/bot-run/bot-schedule/safety-summary/risk-audit/filter/live-readiness-history/go-live-review/checklist-edit/emergency-stop/plan-management/secret-reference/connector-readiness/adapter-contract matrix filters API checks');
}

async function main() {
  runNodeSyntaxCheck();
  await checkExchangeAdapterScaffoldModule();
  checkOwnerEvidenceModule();
  checkOwnerAcceptanceModule();
  checkOwnerProofPacketModule();
  checkCommandSafetyModule();
  await checkCommandRuntimeModule();
  await checkAgentRecordActionsModule();
  await checkChecklistActionsModule();
  await checkProcessRuntimeModule();
  checkServerPathsModule();
  checkRequestHelpersModule();
  await checkServerStartupModule();
  checkAppMiddlewareModule();
  await checkAuthRoutesModule();
  checkRouteRegistrationModule();
  await checkSqliteRuntimeModule();
  checkDatabaseSchemaModule();
  checkDbSelectsModule();
  await checkDbRowLookupsModule();
  checkReadinessModule();
  checkLocalModelRoutingModule();
  await checkLocalModelRuntimeModule();
  await checkMlxLifecycleModule();
  checkMultiAgentCoordinationModule();
  checkSecretSafetyModule();
  checkWalletControlModule();
  checkOwnerSetupWizardModule();
  checkSystemConfigRuntimeModule();
  await checkCompanyIdentityModule();
  checkExchangeMetadataModule();
  checkExchangeReadOnlyConnectionsModule();
  await checkExchangeLiveSafetyModule();
  checkExchangeSandboxExecutionModule();
  checkExchangeTinyLiveExecutionModule();
  checkExchangeLiveArbitrageCommandModule();
  checkExchangeTreasuryLiquidityIntelligenceModule();
  checkExchangeProductionExecutionModule();
  checkStrategyResearchModule();
  await checkStrategyDecisionLogRuntimeModule();
  checkStrategyMathModule();
  checkStrategySignalsModule();
  checkStrategyEngineModule();
  await checkMarketDataModule();
  await checkMarketImportFilesModule();
  await checkMarketImportJobRuntimeModule();
  await checkMarketImportDependenciesModule();
  await checkMarketRefreshScheduleRuntimeModule();
  await checkDevServerModule();
  checkCreatorRecordsModule();
  await checkWorkspaceFilesModule();
  checkCreatorPromptsModule();
  checkCreatorScaffoldModule();
  checkArtifactRowsModule();
  checkSocialOpsModule();
  checkRiskSafetyModule();
  checkOrderIntentSimulatorModule();
  await checkMacSecurityModule();
  await checkRiskProfileActionsModule();
  checkSolidityLabModule();
  checkBotAutomationModule();
  await checkBotAutomationActionsRuntimeModule();
  await checkBotAutomationScheduleRuntimeModule();
  checkInlineScripts('app/client/strategy-lab.html');
  checkInlineScripts('app/client/index.html');
  checkInlineScripts('app/client/creator.html');
  checkInlineScripts('app/client/dashboard.html');
  checkInlineScripts('app/client/operator-control.html');
  checkInlineScripts('app/client/live-trading-launch.html');
  checkInlineScripts('app/client/owner-setup.html');
  checkInlineScripts('app/client/security-lockdown.html');
  checkInlineScripts('app/client/owner-proof-packet.html');
  checkInlineScripts('app/client/mvp-test-pass.html');
  checkInlineScripts('app/client/server-route-inventory.html');
  checkInlineScripts('app/client/operator-manual.html');
  checkInlineScripts('app/client/operator-training.html');
  checkStrategyLabSafetyDossierExportUi();
  checkStrategyLabRiskProfileSetupUi();
  checkStrategyLabBotOperatorWizardUi();
  checkStrategyLabOneClickSafePaperUi();
  checkExchangeConnectorManagerUi();
  checkLiveTradingLaunchCenterUi();
  checkMvpTestPassOwnerWorkflowUi();
  checkDashboardMvpReadinessUi();
  checkOperatorControlCenterUi();
  checkOwnerSetupWizardUi();
  checkMacSecurityLockdownUi();
  checkOwnerProofPacketUi();
  checkHomeLocalProofUi();
  checkSimpleOperatorModeUsabilityRefactor();
  checkOperatorTrainingSystem();
  checkAuthenticatedProofBanners();
  checkRouteInventoryOwnerProofUi();
  checkLocalOnlySurfaceCues();
  checkMvpOwnerTestPassDoc();
  checkProjectHandoffDoc();
  await runServerApiChecks();
}

main().catch(error => {
  console.error(`[fail] ${error.message}`);
  process.exit(1);
});
