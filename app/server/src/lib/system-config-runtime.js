function createSystemConfigRuntime({
  fs,
  modelConfigPath,
  automationPolicyPath,
  secretProviderCapabilitiesPath,
  defaultSafeCommandPrefixes,
  sanitizeTrustedCommandPrefixes,
  localSecretProviderTypes,
  localSecretScopes
}) {
  function readModelConfig() {
    const raw = fs.readFileSync(modelConfigPath, 'utf8');
    return JSON.parse(raw);
  }

  function readAutomationPolicy() {
    const raw = fs.readFileSync(automationPolicyPath, 'utf8');
    const policy = JSON.parse(raw);

    return {
      ...policy,
      localAutomation: {
        ...policy.localAutomation,
        trustedCommandPrefixes: Array.isArray(policy.localAutomation?.trustedCommandPrefixes)
          ? policy.localAutomation.trustedCommandPrefixes
          : defaultSafeCommandPrefixes
      }
    };
  }

  function writeAutomationPolicy(policy) {
    fs.writeFileSync(automationPolicyPath, `${JSON.stringify(policy, null, 2)}\n`, 'utf8');
  }

  function readSecretProviderCapabilities() {
    const raw = fs.readFileSync(secretProviderCapabilitiesPath, 'utf8');
    const manifest = JSON.parse(raw);
    const providers = Array.isArray(manifest.providers) ? manifest.providers : [];

    return {
      version: Number(manifest.version || 1),
      generatedBy: manifest.generatedBy || 'EtherealAI local secret-provider capability manifest',
      secretValuesAccepted: false,
      databaseStoresSecretValues: false,
      credentialLoadingImplemented: false,
      liveExecutionEnabled: false,
      allowedProviderTypes: providers
        .map(provider => provider.providerType)
        .filter(providerType => localSecretProviderTypes.has(providerType)),
      providers: providers
        .filter(provider => localSecretProviderTypes.has(provider.providerType))
        .map(provider => ({
          providerType: provider.providerType,
          label: provider.label,
          status: provider.status || 'planned',
          secretValuesAccepted: false,
          databaseStoresSecretValues: false,
          credentialLoadingImplemented: false,
          referenceFormat: provider.referenceFormat || 'local reference name only',
          allowedScopes: Array.isArray(provider.allowedScopes)
            ? provider.allowedScopes.filter(scope => localSecretScopes.has(scope))
            : [],
          ownerSetup: Array.isArray(provider.ownerSetup) ? provider.ownerSetup : [],
          readinessChecks: Array.isArray(provider.readinessChecks) ? provider.readinessChecks : [],
          futureAdapterRequirements: Array.isArray(provider.futureAdapterRequirements) ? provider.futureAdapterRequirements : []
        })),
      liveExecution: {
        enabled: false,
        orderEndpointEnabled: false,
        goLiveAllowed: false,
        note: 'Secret-provider capabilities are metadata only. This endpoint cannot load, test, or expose secret values.'
      }
    };
  }

  function sanitizeAutomationPolicyUpdate(body) {
    const current = readAutomationPolicy();
    const next = {
      ...current,
      localAutomation: {
        ...current.localAutomation
      }
    };

    if (body.mode && ['guided', 'owner'].includes(body.mode)) {
      next.mode = body.mode;
    }

    if (typeof body.autoApproveFileProposals === 'boolean') {
      next.localAutomation.autoApproveFileProposals = body.autoApproveFileProposals;
    }

    if (typeof body.autoRunLowRiskCommands === 'boolean') {
      next.localAutomation.autoRunLowRiskCommands = body.autoRunLowRiskCommands;
    }

    if (body.trustedCommandPrefixes !== undefined) {
      next.localAutomation.trustedCommandPrefixes = sanitizeTrustedCommandPrefixes(body.trustedCommandPrefixes);
    }

    return next;
  }

  return {
    readModelConfig,
    readAutomationPolicy,
    writeAutomationPolicy,
    readSecretProviderCapabilities,
    sanitizeAutomationPolicyUpdate
  };
}

module.exports = {
  createSystemConfigRuntime
};
