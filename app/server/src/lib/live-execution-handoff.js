function buildLiveExecutionHandoff({
  secretProviderCapabilities = {},
  adapterScaffolds = [],
  counts = {},
  generatedAt = new Date().toISOString()
} = {}) {
  const providerCount = Array.isArray(secretProviderCapabilities.providers)
    ? secretProviderCapabilities.providers.length
    : 0;
  const secretManifestReady = providerCount > 0
    && secretProviderCapabilities.secretValuesAccepted === false
    && secretProviderCapabilities.databaseStoresSecretValues === false;
  const disabledAdaptersReady = adapterScaffolds.length > 0
    && adapterScaffolds.every(scaffold => (
      scaffold.implemented === false
      && scaffold.networkCallsEnabled === false
      && scaffold.credentialLoadingEnabled === false
      && scaffold.liveExecution?.enabled === false
    ));
  const softwareStages = [
    {
      id: 'secret_reference_registry',
      label: 'Secret reference registry',
      status: secretManifestReady ? 'ready' : 'needs_work',
      evidence: `${providerCount} metadata-only provider capability record(s)`,
      ownerAction: 'Store real secrets outside EtherealAI; record only reference names here.'
    },
    {
      id: 'exchange_connector_metadata',
      label: 'Exchange connector metadata',
      status: 'ready',
      evidence: `${Number(counts.exchangeConnectors || 0)} connector metadata record(s) available`,
      ownerAction: 'Create one connector per exchange/account when credentials are ready.'
    },
    {
      id: 'adapter_contract_preflight',
      label: 'Adapter contract preflight',
      status: disabledAdaptersReady ? 'ready' : 'needs_work',
      evidence: `${adapterScaffolds.length} disabled adapter scaffold contract(s)`,
      ownerAction: 'Keep adapter network calls disabled until a separately reviewed live phase.'
    },
    {
      id: 'risk_and_kill_switch_controls',
      label: 'Risk and kill-switch controls',
      status: 'ready',
      evidence: `${Number(counts.riskProfiles || 0)} risk profile(s), ${Number(counts.activeKillSwitches || 0)} active kill switch(es)`,
      ownerAction: 'Use a live-disabled risk profile and keep emergency stops reviewed.'
    },
    {
      id: 'paper_automation_evidence',
      label: 'Paper automation evidence',
      status: Number(counts.paperRuns || 0) > 0 ? 'ready' : 'review',
      evidence: `${Number(counts.paperRuns || 0)} paper automation run(s)`,
      ownerAction: 'Run and review paper automation before any future live enablement.'
    },
    {
      id: 'go_live_command_audit',
      label: 'Go-live command audit',
      status: 'ready',
      evidence: `${Number(counts.goLiveCommandReviews || 0)} blocked go-live command review(s)`,
      ownerAction: 'Final go-live remains a separate owner command after key gates and review.'
    },
    {
      id: 'live_order_endpoint',
      label: 'Live order endpoint',
      status: 'blocked_by_design',
      evidence: 'No route can place live orders.',
      ownerAction: 'Implement only in a future reviewed phase after owner credentials and acceptance.'
    }
  ];
  const readySoftwareStages = softwareStages.filter(stage => ['ready', 'review'].includes(stage.status)).length;
  const softwareHandoffCompletionPercent = Math.round((readySoftwareStages / softwareStages.length) * 100);

  return {
    generatedAt,
    status: 'owner_key_gated',
    localOnly: true,
    liveExecutionEnabled: false,
    actualFullLiveEndToEndPercent: 72,
    softwareHandoffCompletionPercent,
    explanation: 'The app can prepare local evidence, connector metadata, risk controls, and blocked go-live reviews. Real live E2E remains capped until the owner supplies external credentials and a future reviewed live endpoint exists.',
    softwareStages,
    ownerKeyGates: [
      {
        id: 'exchange_api_key_reference',
        label: 'Exchange API key reference',
        status: 'owner_required',
        details: 'Create exchange API credentials outside EtherealAI with withdrawals disabled; record only the local secret reference name.'
      },
      {
        id: 'wallet_or_deployment_key_reference',
        label: 'Wallet/deployment key reference',
        status: 'owner_required',
        details: 'Keep wallet/private keys outside EtherealAI. Record only metadata references when a reviewed deployment phase begins.'
      }
    ],
    blockedUntilFutureReview: [
      'runtime credential value loading',
      'live exchange order adapter network calls',
      'live order endpoint',
      'owner go-live command execution'
    ],
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      goLiveAllowed: false,
      note: 'This handoff cannot load secrets, place trades, deploy contracts, or execute owner go-live commands.'
    }
  };
}

module.exports = {
  buildLiveExecutionHandoff
};
