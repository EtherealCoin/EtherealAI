function createServerPaths({
  path,
  serverDirname,
  ownerHome = process.env.HOME || '/Users/ethereal'
}) {
  const projectRoot = path.join(serverDirname, '../../..');

  return {
    projectRoot,
    clientDir: path.join(serverDirname, '../../client'),
    dbPath: path.join(projectRoot, 'database.sqlite'),
    modelConfigPath: path.join(projectRoot, 'config/local-models.json'),
    automationPolicyPath: path.join(projectRoot, 'config/automation-policy.json'),
    secretProviderCapabilitiesPath: path.join(projectRoot, 'config/local-secret-providers.json'),
    companyIdentityPath: path.join(projectRoot, 'config/company-identity.json'),
    onboardMemoryPath: path.join(projectRoot, 'ONBOARD_MEMORY.md'),
    onboardMemoryCopyPaths: [
      path.join(ownerHome, 'Desktop/EtherealAI_ONBOARD_MEMORY copy.md'),
      path.join(ownerHome, 'Desktop/Layer 1/EtherealAI/EtherealAI_ONBOARD_MEMORY.md')
    ],
    workspacesDir: path.join(projectRoot, 'workspaces'),
    marketImportUploadDir: path.join(projectRoot, 'market-data-uploads')
  };
}

module.exports = {
  createServerPaths
};
