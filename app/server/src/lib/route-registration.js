const { registerArtifactRoutes } = require('../routes/artifacts');
const { registerAuthRoutes } = require('../routes/auth');
const { registerAutomationSafetyRoutes } = require('../routes/automation-safety');
const { registerBotAutomationRoutes } = require('../routes/bot-automation');
const { registerCommandRoutes } = require('../routes/commands');
const { registerCompanyIdentityRoutes } = require('../routes/company-identity');
const { registerCreatorRoutes } = require('../routes/creator');
const { registerDevServerRoutes } = require('../routes/dev-server');
const { registerExchangeMetadataRoutes } = require('../routes/exchange-metadata');
const { registerFileProposalRoutes } = require('../routes/file-proposals');
const { registerHealthRoutes } = require('../routes/health');
const { registerLocalModelRoutes } = require('../routes/local-models');
const { registerMarketDataRoutes } = require('../routes/market-data');
const { registerMultiAgentRoutes } = require('../routes/multi-agent');
const { registerOrderIntentRoutes } = require('../routes/order-intents');
const { registerOwnerAcceptanceRoutes } = require('../routes/owner-acceptance');
const { registerOwnerProofPacketRoutes } = require('../routes/owner-proof-packet');
const { registerPageRoutes } = require('../routes/pages');
const { registerReadinessRoutes } = require('../routes/readiness');
const { registerRiskProfileRoutes } = require('../routes/risk-profiles');
const { registerRouteInventoryRoutes } = require('../routes/route-inventory');
const { registerSocialOpsRoutes } = require('../routes/social-ops');
const { registerSolidityLabRoutes } = require('../routes/solidity-lab');
const { registerStrategyResearchRoutes } = require('../routes/strategy-research');
const { registerSystemConfigRoutes } = require('../routes/system-config');
const { registerSystemMemoryRoutes } = require('../routes/system-memory');
const { registerWorkspaceRoutes } = require('../routes/workspaces');

function registerEtherealRoutes(app, options) {
  const {
    fs,
    path,
    db,
    dbGet,
    dbAll,
    dbRun,
    requireAuth,
    projectRoot,
    clientDir,
    workspacesDir,
    modelConfigPath,
    automationPolicyPath,
    secretProviderCapabilitiesPath,
    onboardMemoryPath,
    onboardMemoryCopyPaths,
    dbPath,
    port,
    devServerStartedAt,
    serverFile,
    readModelConfig,
    readAutomationPolicy,
    writeAutomationPolicy,
    readSecretProviderCapabilities,
    readCompanyIdentity,
    buildCompanyIdentityChecklist,
    buildCompanySetupPlan,
    normalizeCompanyDnsTargetInput,
    parseCompanyDnsTarget,
    sanitizeAutomationPolicyUpdate,
    getJsonManifestStatus,
    getOnboardMemorySyncStatus,
    buildLocalLaunchVerificationStatus,
    buildMvpReadinessChecklist,
    checkDatabase,
    checkOllama,
    checkLocalModelProviders,
    buildLiveExecutionHandoff,
    getDevServerStatus,
    parseDevServerRun,
    parseDevServerLog,
    recordDevServerLog,
    normalizeArtifactType,
    createArtifactRow,
    filterArtifactRows,
    generateWithLocalModel,
    benchmarkLocalModel,
    getMlxLifecycleStatus,
    startMlxLifecycle,
    stopMlxLifecycle,
    chooseModelRoleForPrompt,
    createStarterPlan,
    buildCreatorPlanningPrompt,
    createChecklistForTask,
    createCheckpointRecord,
    applyFileProposalRecord,
    createCommandRequestRecord,
    ensureWorkspacesDir,
    slugify,
    readAutomationPolicyForRoutes,
    getScaffoldFilesForTask,
    getWorkspace,
    collectWorkspaceContext,
    resolveWorkspacePath,
    buildChecklistPrompt,
    buildFileProposalPrompt,
    buildMultiFileProposalPrompt,
    buildWorkspaceEditPrompt,
    extractGeneratedFileContent,
    parseJsonFromModelResponse,
    normalizeGeneratedFiles,
    normalizeWorkspaceEditPayload,
    prepareGeneratedProposalFiles,
    createFileProposalRecords,
    normalizeGeneratedChecklist,
    appendChecklistItems,
    saveAgentEvent,
    listWorkspaceEntries,
    readWorkspaceFile,
    insertDecisionLogs,
    runCandleBacktest,
    createOptimizationSweepPayload,
    createSplitTestPayload,
    createWalkForwardPayload,
    createPaperReplayPayload,
    roundNumber,
    average,
    sanitizeLocalSecretReferenceInput,
    sanitizeExchangeConnectorInput,
    getExchangeConnectorRow,
    getExchangeConnectorReadinessEventRow,
    getExchangeAdapterContractEventRow,
    evaluateExchangeConnectorReadiness,
    evaluateExchangeAdapterContract,
    createExchangeAdapterContractSpec,
    getExchangeAdapterScaffold,
    getExchangeAdapterScaffolds,
    exchangeAdapterContractExchanges,
    findSensitiveFields,
    normalizeScheduleStatus,
    clampScheduleCandleCount,
    fetchProviderOhlcvCsv,
    getProviderHealthDefaults,
    parseOhlcvCsv,
    createMarketDataSummary,
    createMarketImportUploadPath,
    saveMarketImportUpload,
    deleteMarketImportSourceFile,
    resolveMarketImportUploadPath,
    scheduleMarketImportWorker,
    normalizeOptionalIsoDate,
    createBackfillWindow,
    scheduleMarketRefreshWorker,
    runMarketDataRefreshSchedule,
    getMarketImportDependencyCount,
    getPositiveNumber,
    getRiskProfileChangedFields,
    saveRiskProfileAuditEvent,
    refreshBotPlansForRiskProfile,
    riskProfileAuditFields,
    evaluateOrderIntentRisk,
    reviewSocialContent,
    getBotAutomationPlanRow,
    getBotAutomationRunRow,
    getBotAutomationScheduleRow,
    getBotLiveReadinessEventRow,
    getBotLiveEnablementReviewRow,
    createBotAutomationPaperRun,
    runBotAutomationSchedule,
    scheduleBotAutomationWorker,
    loadBotAutomationReadinessContext,
    evaluateBotAutomationReadiness,
    evaluateBotLiveReadiness,
    createBotLiveEnablementReviewPayload,
    assertNoInlineSecretPayload,
    parseOwnerGoLiveCommand,
    toSolidityIdentifier,
    buildSolidityStarter,
    buildSolidityProjectFiles,
    reviewSoliditySource,
    multiAgentSafetyGates,
    buildAgentPrompt,
    buildPlanOnlyContribution,
    buildCoordinationSummary,
    buildHermesBenchmarkPlan,
    getAgentRegistry,
    limitText,
    normalizeExecutionMode,
    normalizeProviderMode,
    normalizeSelectedAgents,
    buildTokenEcosystemCatalog,
    buildTokenEcosystemBlueprint,
    buildTokenEcosystemProjectBlueprint,
    buildTokenEcosystemWorkspaceFiles,
    normalizeTokenEcosystemProjectInput,
    commandTemplates,
    getGitStatusSnapshot,
    serializeCommandTemplate,
    getCommandTemplate,
    isCommandAllowed,
    executeCommandRequest,
    selects,
    parsers
  } = options;
  const routeReadAutomationPolicy = readAutomationPolicyForRoutes || readAutomationPolicy;

  registerAuthRoutes(app, { db });

  registerSystemConfigRoutes(app, {
    requireAuth,
    readModelConfig,
    readAutomationPolicy,
    sanitizeAutomationPolicyUpdate,
    writeAutomationPolicy
  });

  registerCompanyIdentityRoutes(app, {
    requireAuth,
    dbGet,
    dbAll,
    dbRun,
    readCompanyIdentity,
    buildCompanyIdentityChecklist,
    buildCompanySetupPlan,
    normalizeCompanyDnsTargetInput,
    parseCompanyDnsTarget
  });

  registerHealthRoutes(app, {
    requireAuth,
    readModelConfig,
    readAutomationPolicy,
    checkDatabase,
    checkOllama,
    checkLocalModelProviders,
    port,
    devServerStartedAt
  });

  registerReadinessRoutes(app, {
    requireAuth,
    checkDatabase,
    getJsonManifestStatus: (id, label, filePath) => getJsonManifestStatus(id, label, filePath, {
      projectRoot
    }),
    getOnboardMemorySyncStatus: () => getOnboardMemorySyncStatus({
      canonicalPath: onboardMemoryPath,
      copyPaths: onboardMemoryCopyPaths,
      projectRoot
    }),
    buildLocalLaunchVerificationStatus: () => buildLocalLaunchVerificationStatus({
      readSecretProviderCapabilities,
      getExchangeAdapterScaffolds
    }),
    buildMvpReadinessChecklist: payload => buildMvpReadinessChecklist({
      ...payload,
      port
    }),
    dbGet,
    dbAll,
    selects,
    parsers,
    modelConfigPath,
    automationPolicyPath,
    secretProviderCapabilitiesPath,
    port,
    devServerStartedAt,
    projectRoot,
    dbPath
  });

  registerRouteInventoryRoutes(app, {
    requireAuth,
    projectRoot,
    serverFile
  });

  registerOwnerProofPacketRoutes(app, {
    requireAuth,
    checkDatabase,
    getJsonManifestStatus: (id, label, filePath) => getJsonManifestStatus(id, label, filePath, {
      projectRoot
    }),
    getOnboardMemorySyncStatus: () => getOnboardMemorySyncStatus({
      canonicalPath: onboardMemoryPath,
      copyPaths: onboardMemoryCopyPaths,
      projectRoot
    }),
    buildLocalLaunchVerificationStatus: () => buildLocalLaunchVerificationStatus({
      readSecretProviderCapabilities,
      getExchangeAdapterScaffolds
    }),
    buildMvpReadinessChecklist: payload => buildMvpReadinessChecklist({
      ...payload,
      port
    }),
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
  });

  registerOwnerAcceptanceRoutes(app, {
    requireAuth,
    dbGet,
    dbAll,
    dbRun
  });

  registerDevServerRoutes(app, {
    requireAuth,
    getDevServerStatus,
    dbAll,
    parseDevServerLog,
    recordDevServerLog
  });

  registerSystemMemoryRoutes(app, {
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
  });

  registerAutomationSafetyRoutes(app, {
    requireAuth,
    dbGet,
    dbAll,
    readSecretProviderCapabilities,
    getExchangeAdapterScaffolds,
    buildLiveExecutionHandoff,
    selects,
    parsers
  });

  registerArtifactRoutes(app, {
    requireAuth,
    dbGet,
    dbAll,
    normalizeArtifactType,
    createArtifactRow,
    filterArtifactRows,
    selects,
    parsers
  });

  registerLocalModelRoutes(app, {
    requireAuth,
    generateWithLocalModel,
    benchmarkLocalModel,
    getMlxLifecycleStatus,
    startMlxLifecycle,
    stopMlxLifecycle,
    chooseModelRoleForPrompt,
    readModelConfig
  });

  registerMultiAgentRoutes(app, {
    requireAuth,
    dbAll,
    dbRun,
    readModelConfig,
    generateWithLocalModel,
    getMlxLifecycleStatus,
    startMlxLifecycle,
    getAgentRegistry,
    buildAgentPrompt,
    buildPlanOnlyContribution,
    buildCoordinationSummary,
    buildHermesBenchmarkPlan,
    limitText,
    normalizeExecutionMode,
    normalizeProviderMode,
    normalizeSelectedAgents,
    parseMultiAgentRun: parsers.parseMultiAgentRun,
    parseMultiAgentContribution: parsers.parseMultiAgentContribution,
    safetyGates: multiAgentSafetyGates
  });

  registerCreatorRoutes(app, {
    fs,
    path,
    requireAuth,
    dbGet,
    dbAll,
    dbRun,
    parseTask: parsers.parseTask,
    parseChecklistItem: parsers.parseChecklistItem,
    parseFileProposal: parsers.parseFileProposal,
    createStarterPlan,
    buildCreatorPlanningPrompt,
    createChecklistForTask,
    createCheckpointRecord,
    applyFileProposalRecord,
    createCommandRequestRecord,
    ensureWorkspacesDir,
    slugify,
    workspacesDir,
    readAutomationPolicy: routeReadAutomationPolicy,
    getScaffoldFilesForTask,
    getWorkspace,
    collectWorkspaceContext,
    resolveWorkspacePath,
    generateWithLocalModel,
    buildChecklistPrompt,
    buildFileProposalPrompt,
    buildMultiFileProposalPrompt,
    buildWorkspaceEditPrompt,
    extractGeneratedFileContent,
    parseJsonFromModelResponse,
    normalizeGeneratedFiles,
    normalizeWorkspaceEditPayload,
    prepareGeneratedProposalFiles,
    createFileProposalRecords,
    normalizeGeneratedChecklist,
    appendChecklistItems,
    saveAgentEvent
  });

  registerWorkspaceRoutes(app, {
    fs,
    path,
    requireAuth,
    dbGet,
    dbAll,
    dbRun,
    slugify,
    ensureWorkspacesDir,
    workspacesDir,
    getWorkspace,
    listWorkspaceEntries,
    readWorkspaceFile
  });

  registerFileProposalRoutes(app, {
    fs,
    requireAuth,
    dbGet,
    dbAll,
    dbRun,
    parseFileProposal: parsers.parseFileProposal,
    getWorkspace,
    resolveWorkspacePath,
    readAutomationPolicy: routeReadAutomationPolicy,
    applyFileProposalRecord,
    saveAgentEvent
  });

  registerStrategyResearchRoutes(app, {
    requireAuth,
    dbGet,
    dbAll,
    dbRun,
    parseStrategy: parsers.parseStrategy,
    parseBacktest: parsers.parseBacktest,
    parseOptimizationSweep: parsers.parseOptimizationSweep,
    parseSplitTest: parsers.parseSplitTest,
    parseWalkForwardTest: parsers.parseWalkForwardTest,
    parseDecisionLog: parsers.parseDecisionLog,
    parsePaperSession: parsers.parsePaperSession,
    runCandleBacktest,
    createOptimizationSweepPayload,
    createSplitTestPayload,
    createWalkForwardPayload,
    createPaperReplayPayload,
    insertDecisionLogs,
    roundNumber,
    average
  });

  registerExchangeMetadataRoutes(app, {
    requireAuth,
    dbGet,
    dbAll,
    dbRun,
    readSecretProviderCapabilities,
    sanitizeLocalSecretReferenceInput,
    sanitizeExchangeConnectorInput,
    parseLocalSecretReference: parsers.parseLocalSecretReference,
    parseExchangeConnector: parsers.parseExchangeConnector,
    parseExchangeConnectorReadinessEvent: parsers.parseExchangeConnectorReadinessEvent,
    parseExchangeAdapterContractEvent: parsers.parseExchangeAdapterContractEvent,
    getExchangeConnectorRow,
    getExchangeConnectorReadinessEventRow,
    getExchangeAdapterContractEventRow,
    evaluateExchangeConnectorReadiness,
    evaluateExchangeAdapterContract,
    createExchangeAdapterContractSpec,
    getExchangeAdapterScaffold,
    getExchangeAdapterScaffolds,
    exchangeAdapterContractExchanges,
    selects
  });

  registerMarketDataRoutes(app, {
    fs,
    requireAuth,
    dbGet,
    dbAll,
    dbRun,
    findSensitiveFields,
    normalizeScheduleStatus,
    clampScheduleCandleCount,
    fetchProviderOhlcvCsv,
    getProviderHealthDefaults,
    parseOhlcvCsv,
    createMarketDataSummary,
    parseMarketImport: parsers.parseMarketImport,
    parseMarketImportJob: parsers.parseMarketImportJob,
    parseMarketDataProvider: parsers.parseMarketDataProvider,
    parseMarketDataRefreshSchedule: parsers.parseMarketDataRefreshSchedule,
    parseMarketDataRefreshRun: parsers.parseMarketDataRefreshRun,
    createMarketImportUploadPath,
    saveMarketImportUpload,
    deleteMarketImportSourceFile,
    resolveMarketImportUploadPath,
    scheduleMarketImportWorker,
    normalizeOptionalIsoDate,
    createBackfillWindow,
    scheduleMarketRefreshWorker,
    runMarketDataRefreshSchedule,
    getMarketImportDependencyCount
  });

  registerRiskProfileRoutes(app, {
    requireAuth,
    dbGet,
    dbAll,
    dbRun,
    findSensitiveFields,
    getPositiveNumber,
    parseRiskProfile: parsers.parseRiskProfile,
    parseRiskProfileAuditEvent: parsers.parseRiskProfileAuditEvent,
    parseBotAutomationPlan: parsers.parseBotAutomationPlan,
    getRiskProfileChangedFields,
    saveRiskProfileAuditEvent,
    refreshBotPlansForRiskProfile,
    riskProfileAuditFields,
    selects
  });

  registerOrderIntentRoutes(app, {
    requireAuth,
    dbGet,
    dbAll,
    dbRun,
    findSensitiveFields,
    getPositiveNumber,
    parseRiskProfile: parsers.parseRiskProfile,
    parseOrderIntent: parsers.parseOrderIntent,
    evaluateOrderIntentRisk
  });

  registerSocialOpsRoutes(app, {
    requireAuth,
    dbGet,
    dbAll,
    dbRun,
    findSensitiveFields,
    parseSocialPost: parsers.parseSocialPost,
    reviewSocialContent,
    generateWithLocalModel
  });

  registerBotAutomationRoutes(app, {
    requireAuth,
    dbAll,
    dbRun,
    findSensitiveFields,
    getPositiveNumber,
    parseBotAutomationPlan: parsers.parseBotAutomationPlan,
    parseBotAutomationRun: parsers.parseBotAutomationRun,
    parseBotAutomationSchedule: parsers.parseBotAutomationSchedule,
    parseBotLiveReadinessEvent: parsers.parseBotLiveReadinessEvent,
    parseBotLiveEnablementReview: parsers.parseBotLiveEnablementReview,
    getBotAutomationPlanRow,
    getBotAutomationRunRow,
    getBotAutomationScheduleRow,
    getBotLiveReadinessEventRow,
    getBotLiveEnablementReviewRow,
    createBotAutomationPaperRun,
    runBotAutomationSchedule,
    scheduleBotAutomationWorker,
    loadBotAutomationReadinessContext,
    evaluateBotAutomationReadiness,
    evaluateBotLiveReadiness,
    createBotLiveEnablementReviewPayload,
    assertNoInlineSecretPayload,
    parseOwnerGoLiveCommand,
    selects
  });

  registerSolidityLabRoutes(app, {
    fs,
    path,
    requireAuth,
    dbGet,
    dbAll,
    dbRun,
    findSensitiveFields,
    parseSolidityContractSpec: parsers.parseSolidityContractSpec,
    parseFileProposal: parsers.parseFileProposal,
    toSolidityIdentifier,
    buildSolidityStarter,
    buildSolidityProjectFiles,
    reviewSoliditySource,
    buildTokenEcosystemCatalog,
    buildTokenEcosystemBlueprint,
    buildTokenEcosystemProjectBlueprint,
    buildTokenEcosystemWorkspaceFiles,
    normalizeTokenEcosystemProjectInput,
    parseTokenEcosystemProject: parsers.parseTokenEcosystemProject,
    ensureWorkspacesDir,
    slugify,
    workspacesDir,
    readAutomationPolicy: routeReadAutomationPolicy,
    resolveWorkspacePath,
    applyFileProposalRecord
  });

  registerCommandRoutes(app, {
    requireAuth,
    dbGet,
    dbAll,
    commandTemplates,
    getGitStatusSnapshot,
    createCheckpointRecord,
    createCommandRequestRecord,
    serializeCommandTemplate,
    getCommandTemplate,
    isCommandAllowed,
    executeCommandRequest
  });

  registerPageRoutes(app, { clientDir });
}

module.exports = {
  registerEtherealRoutes
};
