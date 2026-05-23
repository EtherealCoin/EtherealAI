const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');
const { execFile, spawn } = require('child_process');
const {
  getExchangeAdapterScaffold,
  getExchangeAdapterScaffolds
} = require('./exchange-adapter-scaffolds');
const {
  DEFAULT_SAFE_COMMAND_PREFIXES,
  sanitizeTrustedCommandPrefixes
} = require('./lib/command-safety');
const {
  createProcessRuntime
} = require('./lib/process-runtime');
const {
  buildMacSecurityAudit,
  buildMacSecurityGuide
} = require('./lib/mac-security');
const {
  createServerPaths
} = require('./lib/server-paths');
const {
  requireAuth,
  createRequestError
} = require('./lib/request-helpers');
const {
  startEtherealServer
} = require('./lib/server-startup');
const {
  configureAppMiddleware
} = require('./lib/app-middleware');
const {
  registerEtherealRoutes
} = require('./lib/route-registration');
const {
  createSqliteRuntime
} = require('./lib/sqlite-runtime');
const {
  initializeDatabase
} = require('./lib/database-schema');
const {
  createCommandRuntime
} = require('./lib/command-runtime');
const {
  createSystemConfigRuntime
} = require('./lib/system-config-runtime');
const {
  buildCompanyIdentityChecklist,
  buildCloudflareWebsitePlan,
  buildCompanySetupPlan,
  normalizeCompanyDnsTargetInput,
  parseCompanyDnsTarget,
  readCompanyIdentity,
  verifyCompanyDnsTargetPublic
} = require('./lib/company-identity');
const {
  createAgentRecordActionsRuntime
} = require('./lib/agent-record-actions');
const {
  createChecklistActionsRuntime
} = require('./lib/checklist-actions');
const {
  createDbRowLookupRuntime
} = require('./lib/db-row-lookups');
const {
  EXCHANGE_CONNECTOR_SELECT,
  EXCHANGE_CONNECTOR_READINESS_EVENT_SELECT,
  EXCHANGE_ADAPTER_CONTRACT_EVENT_SELECT,
  BOT_AUTOMATION_PLAN_SELECT,
  BOT_AUTOMATION_RUN_SELECT,
  BOT_LIVE_READINESS_EVENT_SELECT,
  BOT_LIVE_ENABLEMENT_REVIEW_SELECT,
  BOT_AUTOMATION_SCHEDULE_SELECT
} = require('./lib/db-selects');
const {
  toSolidityIdentifier,
  parseSolidityContractSpec,
  buildSolidityStarter,
  buildSolidityProjectFiles,
  reviewSoliditySource
} = require('./lib/solidity-lab');
const {
  buildTokenEcosystemProjectBlueprint,
  buildTokenEcosystemWorkspaceFiles,
  buildTokenWebsiteDeployPackageFiles,
  buildTokenEcosystemCatalog,
  buildTokenEcosystemBlueprint,
  normalizeTokenEcosystemProjectInput,
  parseTokenEcosystemProject
} = require('./lib/token-ecosystem');
const {
  getJsonManifestStatus,
  getOnboardMemorySyncStatus,
  buildLocalLaunchVerificationStatus,
  buildMvpReadinessChecklist
} = require('./lib/readiness');
const {
  chooseModelRoleForPrompt
} = require('./lib/local-model-routing');
const {
  createLocalModelRuntime
} = require('./lib/local-model-runtime');
const {
  buildLiveExecutionHandoff
} = require('./lib/live-execution-handoff');
const {
  OWNER_SECRETS_DIR,
  OWNER_ENV_PATH,
  buildOwnerSetupWizard,
  readOwnerEnvStatus,
  buildOwnerEnvTemplate
} = require('./lib/owner-setup-wizard');
const {
  createMlxLifecycleRuntime
} = require('./lib/mlx-lifecycle');
const {
  MULTI_AGENT_SAFETY_GATES,
  buildAgentPrompt,
  buildPlanOnlyContribution,
  buildCoordinationSummary,
  buildHermesBenchmarkPlan,
  getAgentRegistry,
  limitText,
  normalizeExecutionMode,
  normalizeProviderMode,
  normalizeSelectedAgents,
  parseMultiAgentRun,
  parseMultiAgentContribution
} = require('./lib/multi-agent-coordination');
const {
  LOCAL_SECRET_PROVIDER_TYPES,
  LOCAL_SECRET_SCOPES,
  findSensitiveFields,
  assertNoInlineSecretPayload,
  sanitizeLocalSecretReferenceInput,
  sanitizeExchangeConnectorInput
} = require('./lib/secret-safety');
const {
  EXCHANGE_ADAPTER_CONTRACT_EXCHANGES,
  parseExchangeConnector,
  parseLocalSecretReference,
  parseExchangeConnectorReadinessEvent,
  parseExchangeAdapterContractEvent,
  getExchangeConnectorRegistry,
  getExchangeConnectorRegistryEntry,
  createExchangeConnectorPlaceholderInput,
  findExistingRegistryConnector,
  buildExchangeConnectorManagerSummary,
  evaluateExchangeConnectorReadOnlyTest,
  evaluateExchangeConnectorReadiness,
  evaluateExchangeAdapterContract,
  createExchangeAdapterContractSpec
} = require('./lib/exchange-metadata');
const {
  EXCHANGE_READONLY_SETUP_GUIDES,
  DEX_QUOTE_ONLY_SETUP_GUIDES,
  RECOMMENDED_READONLY_EXCHANGES,
  QUOTE_ONLY_CONNECTORS,
  EXPANDED_READONLY_MARKET_VENUES,
  sanitizeCredentialInput,
  sanitizePermissionsChecklist,
  getReadOnlyReferenceName,
  saveReadOnlyVaultCredentials,
  loadReadOnlyVaultCredentials,
  deleteReadOnlyVaultCredentials,
  getReadOnlyVaultStatus,
  testReadOnlyExchangeConnection,
  compareReadOnlyPrices,
  scanReadOnlyArbitrageOpportunities,
  createPaperSimulationForOpportunity,
  buildLiveTradingLaunchRoadmap,
  buildReadOnlyConnectionSummary,
  createPlainEnglishExchangeError
} = require('./lib/exchange-readonly-connections');
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
} = require('./lib/exchange-live-safety');
const {
  SANDBOX_ORDER_LIFECYCLE_STATUSES,
  SANDBOX_ORDER_TYPES,
  SANDBOX_EXCHANGE_ADAPTERS,
  DEFAULT_SANDBOX_POLICY,
  getSandboxAdapter,
  getSandboxReferenceName,
  sanitizeSandboxCredentialInput,
  sanitizeSandboxPermissionsChecklist,
  saveSandboxVaultCredentials,
  loadSandboxVaultCredentials,
  deleteSandboxVaultCredentials,
  getSandboxVaultStatus,
  normalizeSandboxOrderDraft,
  evaluateSandboxOrderSafety,
  runSandboxOrderLifecycle,
  buildPhase3BSandboxStatus,
  buildPhase3CPreparation,
  createPlainEnglishSandboxError
} = require('./lib/exchange-sandbox-execution');
const {
  TINY_LIVE_OWNER_CONFIRMATION_PHRASE,
  TINY_LIVE_ORDER_STATUSES,
  DEFAULT_TINY_LIVE_POLICY,
  TINY_LIVE_EXCHANGE_ADAPTERS,
  getTinyLiveAdapter,
  getTinyLiveReferenceName,
  sanitizeTinyLiveCredentialInput,
  sanitizeTinyLivePermissionsChecklist,
  saveTinyLiveVaultCredentials,
  loadTinyLiveVaultCredentials,
  deleteTinyLiveVaultCredentials,
  getTinyLiveVaultStatus,
  normalizeTinyLiveOrderDraft,
  createTinyLiveOrderFingerprint,
  detectTinyLivePermissions,
  evaluateTinyLiveOrderSafety,
  createTinyLiveOrderPreview,
  runTinyLiveOrderLifecycle,
  cancelTinyLiveOrder,
  getTinyLiveOrderStatus,
  buildTinyLiveApprovalCenter,
  createPlainEnglishTinyLiveError
} = require('./lib/exchange-tiny-live-execution');
const {
  PHASE4_STATUS,
  DEFAULT_PHASE4_RISK_POLICY,
  PHASE4_SUPPORTED_VENUES,
  NETWORK_COST_BASELINES,
  buildLiveArbitrageCommandCenter
} = require('./lib/exchange-live-arbitrage-command');
const {
  parseSocialPost,
  reviewSocialContent
} = require('./lib/social-ops');
const {
  parseStrategy,
  parseBacktest,
  parsePaperSession,
  parseOptimizationSweep,
  parseSplitTest,
  parseWalkForwardTest,
  parseDecisionLog
} = require('./lib/strategy-research');
const {
  createStrategyDecisionLogRuntime
} = require('./lib/strategy-decision-logs');
const {
  roundNumber,
  average
} = require('./lib/strategy-math');
const {
  runCandleBacktest,
  createPaperBotAutomationRunPayload,
  createOptimizationSweepPayload,
  createSplitTestPayload,
  createWalkForwardPayload,
  createPaperReplayPayload
} = require('./lib/strategy-engine');
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
  createMarketDataSummary,
  getProviderHealthDefaults,
  fetchProviderOhlcvCsv
} = require('./lib/market-data');
const {
  createMarketImportFileRuntime
} = require('./lib/market-import-files');
const {
  createMarketImportJobRuntime
} = require('./lib/market-import-jobs');
const {
  createMarketRefreshScheduleRuntime
} = require('./lib/market-refresh-schedules');
const {
  createMarketImportDependencyRuntime
} = require('./lib/market-import-dependencies');
const {
  createDevServerRuntime,
  parseDevServerRun,
  parseDevServerLog
} = require('./lib/dev-server');
const {
  normalizeArtifactType,
  createArtifactRow,
  filterArtifactRows
} = require('./lib/artifact-rows');
const {
  parseFileProposal,
  parseTask,
  parseChecklistItem
} = require('./lib/creator-records');
const {
  resolveWorkspacePath,
  listWorkspaceEntries,
  readWorkspaceFile,
  collectWorkspaceContext,
  createWorkspaceRuntime
} = require('./lib/workspace-files');
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
} = require('./lib/creator-prompts');
const {
  slugify,
  getScaffoldFilesForTask,
  prepareGeneratedProposalFiles
} = require('./lib/creator-scaffold');
const {
  RISK_PROFILE_AUDIT_FIELDS,
  getPositiveNumber,
  parseRiskProfile,
  parseRiskProfileAuditEvent,
  parseOrderIntent,
  getRiskProfileChangedFields,
  evaluateOrderIntentRisk
} = require('./lib/risk-safety');
const {
  parseArbitrageSimulationRun,
  parseRebalanceSimulationBatch,
  parseRebalanceCandidateCsv,
  simulateCrossExchangeArbitrage,
  simulateTopRebalanceBatch
} = require('./lib/order-intent-simulator');
const {
  createRiskProfileActionsRuntime
} = require('./lib/risk-profile-actions');
const {
  evaluateBotAutomationReadiness,
  evaluateBotLiveReadiness,
  parseOwnerGoLiveCommand,
  createBotLiveEnablementReviewPayload,
  parseBotAutomationPlan,
  parseBotAutomationRun,
  parseBotLiveReadinessEvent,
  parseBotLiveEnablementReview,
  parseBotAutomationSchedule
} = require('./lib/bot-automation');
const {
  createBotAutomationActionsRuntime
} = require('./lib/bot-automation-actions');
const {
  createBotAutomationScheduleRuntime
} = require('./lib/bot-automation-schedules');
const {
  parseOwnerAcceptanceRecord
} = require('./lib/owner-acceptance');
const {
  sanitizeWalletInput,
  parseOwnerWallet,
  parseWalletPermissionEvent,
  evaluateWalletReadiness,
  buildWalletOnboardingGuide,
  buildOperatorControlSummary,
  WALLET_PERMISSION_KEYS
} = require('./lib/wallet-control');

const app = express();

const {
  projectRoot: PROJECT_ROOT,
  clientDir: CLIENT_DIR,
  dbPath: DB_PATH,
  modelConfigPath: MODEL_CONFIG_PATH,
  automationPolicyPath: AUTOMATION_POLICY_PATH,
  secretProviderCapabilitiesPath: SECRET_PROVIDER_CAPABILITIES_PATH,
  companyIdentityPath: COMPANY_IDENTITY_PATH,
  onboardMemoryPath: ONBOARD_MEMORY_PATH,
  onboardMemoryCopyPaths: ONBOARD_MEMORY_COPY_PATHS,
  workspacesDir: WORKSPACES_DIR,
  marketImportUploadDir: MARKET_IMPORT_UPLOAD_DIR
} = createServerPaths({
  path,
  serverDirname: __dirname
});
const MARKET_IMPORT_UPLOAD_MAX_BYTES = 512 * 1024 * 1024;
const MARKET_REFRESH_POLL_MS = 60 * 1000;
const BOT_AUTOMATION_SCHEDULE_POLL_MS = 60 * 1000;
const db = new sqlite3.Database(DB_PATH);
const {
  dbRun,
  dbAll,
  dbGet,
  checkDatabase
} = createSqliteRuntime(db);
const {
  insertDecisionLogs
} = createStrategyDecisionLogRuntime({
  dbRun
});
const {
  readModelConfig,
  readAutomationPolicy,
  writeAutomationPolicy,
  readSecretProviderCapabilities,
  sanitizeAutomationPolicyUpdate
} = createSystemConfigRuntime({
  fs,
  modelConfigPath: MODEL_CONFIG_PATH,
  automationPolicyPath: AUTOMATION_POLICY_PATH,
  secretProviderCapabilitiesPath: SECRET_PROVIDER_CAPABILITIES_PATH,
  defaultSafeCommandPrefixes: DEFAULT_SAFE_COMMAND_PREFIXES,
  sanitizeTrustedCommandPrefixes,
  localSecretProviderTypes: LOCAL_SECRET_PROVIDER_TYPES,
  localSecretScopes: LOCAL_SECRET_SCOPES
});
const readCompanyIdentityManifest = () => readCompanyIdentity({
  fs,
  companyIdentityPath: COMPANY_IDENTITY_PATH
});
const {
  checkOllama,
  checkLocalModelProviders,
  benchmarkLocalModel,
  generateWithLocalModel
} = createLocalModelRuntime({
  readModelConfig,
  chooseModelRoleForPrompt
});
const {
  execFileText,
  execFileCapture,
  getGitStatusSnapshot,
  getGitPublishStatus
} = createProcessRuntime({
  execFile,
  projectRoot: PROJECT_ROOT
});
const {
  getStatus: getMlxLifecycleStatus,
  start: startMlxLifecycle,
  stop: stopMlxLifecycle
} = createMlxLifecycleRuntime({
  readModelConfig,
  spawn,
  execFileCapture
});
const {
  resolveMarketImportUploadPath,
  deleteMarketImportSourceFile,
  createMarketImportUploadPath,
  saveMarketImportUpload
} = createMarketImportFileRuntime({
  fs,
  path,
  crypto,
  pipeline,
  uploadDir: MARKET_IMPORT_UPLOAD_DIR,
  maxUploadBytes: MARKET_IMPORT_UPLOAD_MAX_BYTES,
  ensureUploadDir: () => fs.mkdirSync(MARKET_IMPORT_UPLOAD_DIR, { recursive: true })
});
const {
  scheduleMarketImportWorker
} = createMarketImportJobRuntime({
  fs,
  dbGet,
  dbRun,
  parseOhlcvCsv,
  parseOhlcvCsvLine,
  createMarketDataSummary,
  createStreamingMarketDataSummaryTracker,
  resolveMarketImportUploadPath,
  deleteMarketImportSourceFile
});
const {
  runMarketDataRefreshSchedule,
  scheduleMarketRefreshWorker
} = createMarketRefreshScheduleRuntime({
  dbGet,
  dbAll,
  dbRun,
  fetchProviderOhlcvCsv,
  clampScheduleCandleCount,
  getProviderCandleLimit,
  addMinutesToIso,
  parseMarketDataRefreshRun,
  scheduleMarketImportWorker
});
const {
  getMarketImportDependencyCount
} = createMarketImportDependencyRuntime({
  dbGet
});
const {
  ensureWorkspacesDir,
  getWorkspace
} = createWorkspaceRuntime({
  fs,
  dbGet,
  workspacesDir: WORKSPACES_DIR
});
const {
  saveAgentEvent,
  applyFileProposalRecord,
  createCheckpointRecord,
  createFileProposalRecords
} = createAgentRecordActionsRuntime({
  fs,
  path,
  dbRun,
  dbGet,
  getWorkspace,
  resolveWorkspacePath,
  parseFileProposal,
  getGitStatusSnapshot
});
const {
  createChecklistForTask,
  appendChecklistItems
} = createChecklistActionsRuntime({
  dbAll,
  dbGet,
  dbRun,
  parseChecklistItem,
  saveAgentEvent
});
const {
  commandTemplates,
  isCommandAllowed,
  serializeCommandTemplate,
  getCommandTemplate,
  executeCommandRequest,
  createCommandRequestRecord
} = createCommandRuntime({
  path,
  projectRoot: PROJECT_ROOT,
  readAutomationPolicy,
  getWorkspace,
  execFileCapture,
  dbRun,
  dbGet,
  saveAgentEvent
});

const PORT = Number(process.env.PORT || 3000);
const SERVER_HOST = String(process.env.ETHEREALAI_HOST || '127.0.0.1').trim() || '127.0.0.1';
const DEV_SERVER_STARTED_AT = new Date().toISOString();
const {
  getDevServerStatus,
  recordDevServerStart,
  updateDevServerHeartbeat,
  recordDevServerLog
} = createDevServerRuntime({
  path,
  projectRoot: PROJECT_ROOT,
  serverFile: __filename,
  port: PORT,
  startedAt: DEV_SERVER_STARTED_AT,
  dbRun,
  dbGet,
  dbAll,
  parseRun: parseDevServerRun,
  parseLog: parseDevServerLog
});

// Initialize SQLite database
initializeDatabase(db);

const ROUTE_SELECTS = {
  exchangeConnector: EXCHANGE_CONNECTOR_SELECT,
  exchangeConnectorReadinessEvent: EXCHANGE_CONNECTOR_READINESS_EVENT_SELECT,
  exchangeAdapterContractEvent: EXCHANGE_ADAPTER_CONTRACT_EVENT_SELECT,
  botAutomationPlan: BOT_AUTOMATION_PLAN_SELECT,
  botLiveReadinessEvent: BOT_LIVE_READINESS_EVENT_SELECT,
  botLiveEnablementReview: BOT_LIVE_ENABLEMENT_REVIEW_SELECT,
  botAutomationRun: BOT_AUTOMATION_RUN_SELECT,
  botAutomationSchedule: BOT_AUTOMATION_SCHEDULE_SELECT
};
const ROW_LOOKUP_SELECTS = {
  exchangeConnector: ROUTE_SELECTS.exchangeConnector,
  exchangeConnectorReadinessEvent: ROUTE_SELECTS.exchangeConnectorReadinessEvent,
  exchangeAdapterContractEvent: ROUTE_SELECTS.exchangeAdapterContractEvent,
  botAutomationPlan: ROUTE_SELECTS.botAutomationPlan,
  botAutomationSchedule: ROUTE_SELECTS.botAutomationSchedule,
  botAutomationRun: ROUTE_SELECTS.botAutomationRun,
  botLiveReadinessEvent: ROUTE_SELECTS.botLiveReadinessEvent,
  botLiveEnablementReview: ROUTE_SELECTS.botLiveEnablementReview
};

const {
  getExchangeConnectorRow,
  getExchangeConnectorReadinessEventRow,
  getExchangeAdapterContractEventRow,
  getBotAutomationPlanRow,
  getBotAutomationScheduleRow,
  getBotAutomationRunRow,
  getBotLiveReadinessEventRow,
  getBotLiveEnablementReviewRow
} = createDbRowLookupRuntime({
  dbGet,
  selects: ROW_LOOKUP_SELECTS
});
const {
  loadBotAutomationReadinessContext,
  createBotAutomationPaperRun
} = createBotAutomationActionsRuntime({
  dbGet,
  dbAll,
  dbRun,
  parseStrategy,
  parseRiskProfile,
  parsePaperSession,
  parseExchangeConnector,
  parseBotAutomationPlan,
  parseBotAutomationRun,
  getExchangeConnectorRow,
  getBotAutomationPlanRow,
  getBotAutomationRunRow,
  evaluateBotAutomationReadiness,
  createPaperBotAutomationRunPayload,
  createRequestError
});
const {
  runBotAutomationSchedule,
  scheduleBotAutomationWorker
} = createBotAutomationScheduleRuntime({
  dbAll,
  dbRun,
  parseBotAutomationSchedule,
  getBotAutomationScheduleRow,
  createBotAutomationPaperRun,
  createRequestError,
  botAutomationScheduleSelect: BOT_AUTOMATION_SCHEDULE_SELECT
});

const {
  saveRiskProfileAuditEvent,
  refreshBotPlansForRiskProfile
} = createRiskProfileActionsRuntime({
  dbAll,
  dbRun,
  parseBotAutomationPlan,
  loadBotAutomationReadinessContext,
  evaluateBotAutomationReadiness,
  getBotAutomationPlanRow,
  botAutomationPlanSelect: BOT_AUTOMATION_PLAN_SELECT
});

configureAppMiddleware(app, {
  express,
  bodyParser: require('body-parser'),
  session: require('express-session'),
  helmet: require('helmet'),
  cors: require('cors'),
  path,
  projectRoot: PROJECT_ROOT,
  clientDir: CLIENT_DIR,
  frontendUrl: process.env.FRONTEND_URL
});

const ROUTE_PARSERS = {
  parseTask,
  parseChecklistItem,
  parseFileProposal,
  parseDevServerRun,
  parseDevServerLog,
  parseStrategy,
  parseBacktest,
  parsePaperSession,
  parseOptimizationSweep,
  parseSplitTest,
  parseWalkForwardTest,
  parseDecisionLog,
  parseMarketImport,
  parseMarketImportJob,
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
  parseArbitrageSimulationRun,
  parseRebalanceSimulationBatch,
  parseRebalanceCandidateCsv,
  parseBotAutomationPlan,
  parseBotLiveReadinessEvent,
  parseBotLiveEnablementReview,
  parseBotAutomationRun,
  parseBotAutomationSchedule,
  parseSolidityContractSpec,
  parseTokenEcosystemProject,
  parseSocialPost,
  parseOwnerAcceptanceRecord,
  parseCompanyDnsTarget,
  parseMultiAgentRun,
  parseMultiAgentContribution,
  parseOwnerWallet,
  parseWalletPermissionEvent
};

registerEtherealRoutes(app, {
  fs,
  path,
  db,
  dbGet,
  dbAll,
  dbRun,
  requireAuth,
  projectRoot: PROJECT_ROOT,
  clientDir: CLIENT_DIR,
  workspacesDir: WORKSPACES_DIR,
  modelConfigPath: MODEL_CONFIG_PATH,
  automationPolicyPath: AUTOMATION_POLICY_PATH,
  secretProviderCapabilitiesPath: SECRET_PROVIDER_CAPABILITIES_PATH,
  onboardMemoryPath: ONBOARD_MEMORY_PATH,
  onboardMemoryCopyPaths: ONBOARD_MEMORY_COPY_PATHS,
  dbPath: DB_PATH,
  port: PORT,
  devServerStartedAt: DEV_SERVER_STARTED_AT,
  serverFile: __filename,
  readModelConfig,
  readAutomationPolicy,
  writeAutomationPolicy,
  readSecretProviderCapabilities,
  readCompanyIdentity: readCompanyIdentityManifest,
  buildCompanyIdentityChecklist,
  buildCompanySetupPlan,
  normalizeCompanyDnsTargetInput,
  parseCompanyDnsTarget,
  verifyCompanyDnsTargetPublic,
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
  getExchangeConnectorRegistry,
  getExchangeConnectorRegistryEntry,
  createExchangeConnectorPlaceholderInput,
  findExistingRegistryConnector,
  buildExchangeConnectorManagerSummary,
  evaluateExchangeConnectorReadOnlyTest,
  exchangeReadOnlySetupGuides: EXCHANGE_READONLY_SETUP_GUIDES,
  dexQuoteOnlySetupGuides: DEX_QUOTE_ONLY_SETUP_GUIDES,
  recommendedReadOnlyExchanges: RECOMMENDED_READONLY_EXCHANGES,
  quoteOnlyConnectors: QUOTE_ONLY_CONNECTORS,
  expandedReadOnlyMarketVenues: EXPANDED_READONLY_MARKET_VENUES,
  sanitizeCredentialInput,
  sanitizePermissionsChecklist,
  getReadOnlyReferenceName,
  saveReadOnlyVaultCredentials,
  loadReadOnlyVaultCredentials,
  deleteReadOnlyVaultCredentials,
  getReadOnlyVaultStatus,
  testReadOnlyExchangeConnection,
  compareReadOnlyPrices,
  scanReadOnlyArbitrageOpportunities,
  createPaperSimulationForOpportunity,
  buildLiveTradingLaunchRoadmap,
  buildReadOnlyConnectionSummary,
  createPlainEnglishExchangeError,
  phase3RecommendedExchanges: PHASE3_RECOMMENDED_EXCHANGES,
  universalOrderTypes: UNIVERSAL_ORDER_TYPES,
  phase3AAccountStatuses: PHASE3A_ACCOUNT_STATUSES,
  defaultLiveSafetyPolicy: DEFAULT_LIVE_SAFETY_POLICY,
  exchangeCapabilityMatrix: EXCHANGE_CAPABILITY_MATRIX,
  websocketStreamSpecs: WEBSOCKET_STREAM_SPECS,
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
  buildPhase3Status,
  sandboxOrderLifecycleStatuses: SANDBOX_ORDER_LIFECYCLE_STATUSES,
  sandboxOrderTypes: SANDBOX_ORDER_TYPES,
  sandboxExchangeAdapters: SANDBOX_EXCHANGE_ADAPTERS,
  defaultSandboxPolicy: DEFAULT_SANDBOX_POLICY,
  getSandboxAdapter,
  getSandboxReferenceName,
  sanitizeSandboxCredentialInput,
  sanitizeSandboxPermissionsChecklist,
  saveSandboxVaultCredentials,
  loadSandboxVaultCredentials,
  deleteSandboxVaultCredentials,
  getSandboxVaultStatus,
  normalizeSandboxOrderDraft,
  evaluateSandboxOrderSafety,
  runSandboxOrderLifecycle,
  buildPhase3BSandboxStatus,
  buildPhase3CPreparation,
  createPlainEnglishSandboxError,
  tinyLiveOwnerConfirmationPhrase: TINY_LIVE_OWNER_CONFIRMATION_PHRASE,
  tinyLiveOrderStatuses: TINY_LIVE_ORDER_STATUSES,
  defaultTinyLivePolicy: DEFAULT_TINY_LIVE_POLICY,
  tinyLiveExchangeAdapters: TINY_LIVE_EXCHANGE_ADAPTERS,
  getTinyLiveAdapter,
  getTinyLiveReferenceName,
  sanitizeTinyLiveCredentialInput,
  sanitizeTinyLivePermissionsChecklist,
  saveTinyLiveVaultCredentials,
  loadTinyLiveVaultCredentials,
  deleteTinyLiveVaultCredentials,
  getTinyLiveVaultStatus,
  normalizeTinyLiveOrderDraft,
  createTinyLiveOrderFingerprint,
  detectTinyLivePermissions,
  evaluateTinyLiveOrderSafety,
  createTinyLiveOrderPreview,
  runTinyLiveOrderLifecycle,
  cancelTinyLiveOrder,
  getTinyLiveOrderStatus,
  buildTinyLiveApprovalCenter,
  createPlainEnglishTinyLiveError,
  phase4Status: PHASE4_STATUS,
  defaultPhase4RiskPolicy: DEFAULT_PHASE4_RISK_POLICY,
  phase4SupportedVenues: PHASE4_SUPPORTED_VENUES,
  phase4NetworkCostBaselines: NETWORK_COST_BASELINES,
  buildLiveArbitrageCommandCenter,
  evaluateExchangeConnectorReadiness,
  evaluateExchangeAdapterContract,
  createExchangeAdapterContractSpec,
  getExchangeAdapterScaffold,
  getExchangeAdapterScaffolds,
  exchangeAdapterContractExchanges: EXCHANGE_ADAPTER_CONTRACT_EXCHANGES,
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
  riskProfileAuditFields: RISK_PROFILE_AUDIT_FIELDS,
  evaluateOrderIntentRisk,
  simulateCrossExchangeArbitrage,
  simulateTopRebalanceBatch,
  parseRebalanceCandidateCsv,
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
  multiAgentSafetyGates: MULTI_AGENT_SAFETY_GATES,
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
  buildTokenWebsiteDeployPackageFiles,
  buildCloudflareWebsitePlan,
  normalizeTokenEcosystemProjectInput,
  sanitizeWalletInput,
  parseOwnerWallet,
  parseWalletPermissionEvent,
  evaluateWalletReadiness,
  buildWalletOnboardingGuide,
  buildOperatorControlSummary,
  walletPermissionKeys: WALLET_PERMISSION_KEYS,
  buildMacSecurityAudit: () => buildMacSecurityAudit({
    execFileCapture,
    serverHost: SERVER_HOST,
    port: PORT
  }),
  buildMacSecurityGuide,
  commandTemplates,
  getGitStatusSnapshot,
  getGitPublishStatus,
  buildOwnerSetupWizard,
  readOwnerEnvStatus,
  buildOwnerEnvTemplate,
  ownerSecretsDir: OWNER_SECRETS_DIR,
  ownerEnvPath: OWNER_ENV_PATH,
  serializeCommandTemplate,
  getCommandTemplate,
  isCommandAllowed,
  executeCommandRequest,
  selects: ROUTE_SELECTS,
  parsers: ROUTE_PARSERS
});

// =======================
// START SERVER
// =======================

startEtherealServer({
  app,
  port: PORT,
  host: SERVER_HOST,
  recordDevServerStart,
  updateDevServerHeartbeat,
  scheduleMarketImportWorker,
  scheduleMarketRefreshWorker,
  scheduleBotAutomationWorker,
  marketRefreshPollMs: MARKET_REFRESH_POLL_MS,
  botAutomationSchedulePollMs: BOT_AUTOMATION_SCHEDULE_POLL_MS
});
