const fs = require('fs');
const path = require('path');

const OWNER_SECRETS_DIR = path.join(process.env.HOME || '/Users/ethereal', 'EtherealAI_Secrets');
const OWNER_ENV_PATH = path.join(OWNER_SECRETS_DIR, '.env');

const ENV_VARIABLES = [
  {
    id: 'chain_rpc',
    name: 'CHAIN_RPC_URL',
    group: 'rpc',
    label: 'Blockchain provider RPC URL',
    example: 'CHAIN_RPC_URL=https://your-selected-chain-rpc-provider',
    why: 'Optional future chain-provider access after the owner chooses a target chain. This is not required for local paper trading.'
  },
  {
    id: 'chain_explorer',
    name: 'CHAIN_EXPLORER_API_KEY',
    group: 'rpc',
    label: 'Blockchain explorer API key',
    example: 'CHAIN_EXPLORER_API_KEY=your_selected_chain_explorer_api_key',
    why: 'Optional future explorer evidence for the selected chain. This is not required for local paper trading.'
  },
  {
    id: 'polygon_rpc_legacy',
    name: 'POLYGON_RPC_URL',
    group: 'rpc',
    label: 'Optional Polygon RPC URL',
    example: 'POLYGON_RPC_URL=https://your-polygon-rpc-provider',
    why: 'Optional Polygon-specific provider access only when Polygon is the selected project chain. This is not a default setup gate.'
  },
  {
    id: 'polygon_scan_legacy',
    name: 'POLYGONSCAN_API_KEY',
    group: 'rpc',
    label: 'Optional PolygonScan API key',
    example: 'POLYGONSCAN_API_KEY=your_polygonscan_api_key',
    why: 'Optional Polygon explorer evidence only when Polygon is the selected project chain. This is not a default setup gate.'
  },
  {
    id: 'owner_public_wallet',
    name: 'OWNER_PUBLIC_WALLET_ADDRESS',
    group: 'wallet_public',
    label: 'Owner public wallet address',
    example: 'OWNER_PUBLIC_WALLET_ADDRESS=0xYourPublicWalletAddress',
    why: 'Optional public wallet address that can be displayed and used to prefill wallet metadata. It must never be a private key or seed phrase.'
  },
  {
    id: 'chain_public_wallet',
    name: 'CHAIN_PUBLIC_WALLET_ADDRESS',
    group: 'wallet_public',
    label: 'Selected-chain public wallet address',
    example: 'CHAIN_PUBLIC_WALLET_ADDRESS=0xOrSelectedChainPublicAddress',
    why: 'Optional public address for the selected chain. Public metadata only; never signing material.'
  },
  {
    id: 'polygon_public_wallet',
    name: 'POLYGON_PUBLIC_WALLET_ADDRESS',
    group: 'wallet_public',
    label: 'Optional Polygon public wallet address',
    example: 'POLYGON_PUBLIC_WALLET_ADDRESS=0xYourPolygonPublicAddress',
    why: 'Optional Polygon-specific public metadata only when Polygon is the selected chain.'
  },
  {
    id: 'base_public_wallet',
    name: 'BASE_PUBLIC_WALLET_ADDRESS',
    group: 'wallet_public',
    label: 'Optional Base public wallet address',
    example: 'BASE_PUBLIC_WALLET_ADDRESS=0xYourBasePublicAddress',
    why: 'Optional Base public metadata only when Base is the selected chain.'
  },
  {
    id: 'ethereum_public_wallet',
    name: 'ETHEREUM_PUBLIC_WALLET_ADDRESS',
    group: 'wallet_public',
    label: 'Optional Ethereum public wallet address',
    example: 'ETHEREUM_PUBLIC_WALLET_ADDRESS=0xYourEthereumPublicAddress',
    why: 'Optional Ethereum public metadata only when Ethereum is the selected chain.'
  },
  {
    id: 'bnb_public_wallet',
    name: 'BNB_PUBLIC_WALLET_ADDRESS',
    group: 'wallet_public',
    label: 'Optional BNB Chain public wallet address',
    example: 'BNB_PUBLIC_WALLET_ADDRESS=0xYourBnbPublicAddress',
    why: 'Optional BNB Chain public metadata only when BNB Chain is the selected chain.'
  },
  {
    id: 'avalanche_public_wallet',
    name: 'AVALANCHE_PUBLIC_WALLET_ADDRESS',
    group: 'wallet_public',
    label: 'Optional Avalanche public wallet address',
    example: 'AVALANCHE_PUBLIC_WALLET_ADDRESS=0xYourAvalanchePublicAddress',
    why: 'Optional Avalanche public metadata only when Avalanche is the selected chain.'
  },
  {
    id: 'solana_public_wallet',
    name: 'SOLANA_PUBLIC_WALLET_ADDRESS',
    group: 'wallet_public',
    label: 'Optional Solana public wallet address',
    example: 'SOLANA_PUBLIC_WALLET_ADDRESS=YourSolanaPublicAddress',
    why: 'Optional Solana public metadata only when Solana is the selected chain.'
  },
  {
    id: 'coinbase_key',
    name: 'COINBASE_API_KEY',
    group: 'exchange_coinbase',
    label: 'Coinbase API key',
    example: 'COINBASE_API_KEY=your_coinbase_api_key',
    why: 'Needed for future owner-approved exchange adapter verification. Live trading remains disabled.'
  },
  {
    id: 'coinbase_secret',
    name: 'COINBASE_API_SECRET',
    group: 'exchange_coinbase',
    label: 'Coinbase API secret',
    example: 'COINBASE_API_SECRET=your_coinbase_api_secret',
    why: 'Needed only from the local secrets file for future adapter verification. It is never displayed by EtherealAI.'
  },
  {
    id: 'kraken_key',
    name: 'KRAKEN_API_KEY',
    group: 'exchange_kraken',
    label: 'Kraken API key',
    example: 'KRAKEN_API_KEY=your_kraken_api_key',
    why: 'Optional exchange credential path for future owner-approved adapter verification.'
  },
  {
    id: 'kraken_secret',
    name: 'KRAKEN_API_SECRET',
    group: 'exchange_kraken',
    label: 'Kraken API secret',
    example: 'KRAKEN_API_SECRET=your_kraken_api_secret',
    why: 'Optional exchange secret read from the local secrets file only. It is never displayed.'
  },
  {
    id: 'binance_key',
    name: 'BINANCE_API_KEY',
    group: 'exchange_binance',
    label: 'Binance API key',
    example: 'BINANCE_API_KEY=your_binance_api_key',
    why: 'Optional exchange credential path for future owner-approved adapter verification.'
  },
  {
    id: 'binance_secret',
    name: 'BINANCE_API_SECRET',
    group: 'exchange_binance',
    label: 'Binance API secret',
    example: 'BINANCE_API_SECRET=your_binance_api_secret',
    why: 'Optional exchange secret read from the local secrets file only. It is never displayed.'
  },
  {
    id: 'github_token',
    name: 'GITHUB_TOKEN',
    group: 'github',
    label: 'GitHub token',
    example: 'GITHUB_TOKEN=your_github_token',
    why: 'Needed if the owner later wants one-click repository verification or publishing from the local app.'
  },
  {
    id: 'cloudflare_token',
    name: 'CLOUDFLARE_API_TOKEN',
    group: 'cloudflare',
    label: 'Cloudflare API token',
    example: 'CLOUDFLARE_API_TOKEN=your_cloudflare_api_token',
    why: 'Needed if the owner later approves automated DNS or Pages verification.'
  },
  {
    id: 'cloudflare_account',
    name: 'CLOUDFLARE_ACCOUNT_ID',
    group: 'cloudflare',
    label: 'Cloudflare account ID',
    example: 'CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id',
    why: 'Needed to identify the correct Cloudflare account without using passwords.'
  },
  {
    id: 'x_client',
    name: 'X_CLIENT_ID',
    group: 'social_x',
    label: 'X client ID',
    example: 'X_CLIENT_ID=your_x_client_id',
    why: 'Optional social connector credential for future owner-approved posting. Posting remains disabled now.'
  },
  {
    id: 'x_secret',
    name: 'X_CLIENT_SECRET',
    group: 'social_x',
    label: 'X client secret',
    example: 'X_CLIENT_SECRET=your_x_client_secret',
    why: 'Optional social connector secret read from the local secrets file only. It is never displayed.'
  },
  {
    id: 'discord_token',
    name: 'DISCORD_BOT_TOKEN',
    group: 'social_discord',
    label: 'Discord bot token',
    example: 'DISCORD_BOT_TOKEN=your_discord_bot_token',
    why: 'Optional community connector credential for future owner-approved moderation/posting.'
  },
  {
    id: 'telegram_token',
    name: 'TELEGRAM_BOT_TOKEN',
    group: 'social_telegram',
    label: 'Telegram bot token',
    example: 'TELEGRAM_BOT_TOKEN=your_telegram_bot_token',
    why: 'Optional community connector credential for future owner-approved announcements.'
  },
  {
    id: 'medium_token',
    name: 'MEDIUM_INTEGRATION_TOKEN',
    group: 'social_medium',
    label: 'Medium integration token',
    example: 'MEDIUM_INTEGRATION_TOKEN=your_medium_integration_token',
    why: 'Optional article publishing connector credential for future owner-approved posting.'
  }
];

const PUBLIC_WALLET_ADDRESS_NAMES = new Set([
  'OWNER_PUBLIC_WALLET_ADDRESS',
  'CHAIN_PUBLIC_WALLET_ADDRESS',
  'POLYGON_PUBLIC_WALLET_ADDRESS',
  'BASE_PUBLIC_WALLET_ADDRESS',
  'ETHEREUM_PUBLIC_WALLET_ADDRESS',
  'BNB_PUBLIC_WALLET_ADDRESS',
  'AVALANCHE_PUBLIC_WALLET_ADDRESS',
  'SOLANA_PUBLIC_WALLET_ADDRESS'
]);

const FORBIDDEN_WALLET_SECRET_KEY_PATTERN = /(seed|mnemonic|recovery|wallet.*private|private.*wallet|deployer_private_key|owner_private_key|wallet_secret|wallet_password)/i;
const FORBIDDEN_VALUE_PATTERNS = [
  { id: 'pem_private_key', label: 'PEM private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i },
  { id: 'seed_phrase_like_value', label: 'seed phrase-like value', pattern: /\b([a-z]{3,}\s+){11,}[a-z]{3,}\b/i }
];
const EVM_PUBLIC_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_PUBLIC_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function parseEnvLine(line = '') {
  const trimmed = String(line || '').trim();

  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const withoutExport = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
  const separator = withoutExport.indexOf('=');

  if (separator <= 0) {
    return null;
  }

  const key = withoutExport.slice(0, separator).trim();
  let value = withoutExport.slice(separator + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function getPublicWalletAddressType(value = '') {
  const trimmed = String(value || '').trim();

  if (EVM_PUBLIC_ADDRESS_PATTERN.test(trimmed)) {
    return 'evm';
  }

  if (SOLANA_PUBLIC_ADDRESS_PATTERN.test(trimmed)) {
    return 'solana';
  }

  return null;
}

function detectPublicWalletAddresses(parsed = []) {
  return parsed
    .filter(item => PUBLIC_WALLET_ADDRESS_NAMES.has(item.key))
    .map(item => {
      const addressType = getPublicWalletAddressType(item.value);

      return {
        variable: item.key,
        address: addressType ? String(item.value || '').trim() : null,
        addressType,
        valid: Boolean(addressType),
        safeToDisplay: Boolean(addressType),
        note: addressType
          ? 'Public wallet address detected. This value is safe to display because it is not a signing secret.'
          : 'Value was not displayed because it did not match a supported public wallet address format.'
      };
    });
}

function readOwnerEnvStatus({
  fsModule = fs,
  envPath = OWNER_ENV_PATH
} = {}) {
  const requiredNames = new Set(ENV_VARIABLES.map(variable => variable.name));
  const status = {
    path: envPath,
    directory: path.dirname(envPath),
    exists: false,
    readable: false,
    permissionMode: null,
    permissionSafe: false,
    variables: ENV_VARIABLES.map(variable => ({
      ...variable,
      present: false,
      empty: true
    })),
    foundAllowedNames: [],
    unknownNames: [],
    forbiddenWalletSecretNames: [],
    forbiddenValueFindings: [],
    publicWalletAddresses: [],
    safeToUse: false,
    note: 'Only variable names and non-empty status are reported. Secret values are never returned.'
  };

  try {
    const stats = fsModule.statSync(envPath);
    const mode = stats.mode & 0o777;
    const raw = fsModule.readFileSync(envPath, 'utf8');
    const parsed = raw
      .split(/\r?\n/)
      .map(parseEnvLine)
      .filter(Boolean);
    const valueByKey = new Map(parsed.map(item => [item.key, item.value]));
    const unknownNames = [];
    const forbiddenWalletSecretNames = [];
    const forbiddenValueFindings = [];

    for (const item of parsed) {
      if (FORBIDDEN_WALLET_SECRET_KEY_PATTERN.test(item.key)) {
        forbiddenWalletSecretNames.push(item.key);
      }

      if (!requiredNames.has(item.key)) {
        unknownNames.push(item.key);
      }

      for (const pattern of FORBIDDEN_VALUE_PATTERNS) {
        if (pattern.pattern.test(item.value)) {
          forbiddenValueFindings.push({ variable: item.key, id: pattern.id, label: pattern.label });
        }
      }
    }

    status.exists = true;
    status.readable = true;
    status.permissionMode = mode.toString(8).padStart(3, '0');
    status.permissionSafe = (mode & 0o077) === 0;
    status.variables = ENV_VARIABLES.map(variable => {
      const value = valueByKey.get(variable.name);
      return {
        ...variable,
        present: valueByKey.has(variable.name),
        empty: !String(value || '').trim()
      };
    });
    status.foundAllowedNames = status.variables
      .filter(variable => variable.present && !variable.empty)
      .map(variable => variable.name);
    status.unknownNames = Array.from(new Set(unknownNames)).sort();
    status.forbiddenWalletSecretNames = Array.from(new Set(forbiddenWalletSecretNames)).sort();
    status.forbiddenValueFindings = forbiddenValueFindings;
    status.publicWalletAddresses = detectPublicWalletAddresses(parsed);
    status.safeToUse = status.exists
      && status.readable
      && status.permissionSafe
      && !status.forbiddenWalletSecretNames.length
      && !status.forbiddenValueFindings.length;
  } catch (error) {
    status.error = error.message;
  }

  return status;
}

function hasEnv(envStatus, name) {
  return envStatus.variables.some(variable => variable.name === name && variable.present && !variable.empty);
}

function groupComplete(envStatus, names = []) {
  return names.every(name => hasEnv(envStatus, name));
}

function anyGroupComplete(envStatus, groups = []) {
  return groups.some(group => groupComplete(envStatus, group));
}

function gate({
  id,
  lane,
  label,
  passed,
  missing,
  whyNeeded,
  safe,
  exactlyEnter,
  verifyAction = 'Click Verify. EtherealAI will re-check local state only.',
  evidence = '',
  blocking = true,
  optional = false,
  ownerStatus = null
}) {
  const normalizedPassed = Boolean(passed);
  const normalizedBlocking = Boolean(blocking);
  const normalizedOptional = Boolean(optional || !normalizedBlocking);

  return {
    id,
    lane,
    label,
    status: ownerStatus || (normalizedPassed ? 'complete' : (normalizedOptional ? 'optional' : 'blocked')),
    passed: normalizedPassed,
    blocking: normalizedBlocking,
    optional: normalizedOptional,
    missing: normalizedPassed ? 'Nothing missing.' : missing,
    whyNeeded,
    safe,
    exactlyEnter,
    verifyAction,
    evidence
  };
}

function countComplete(gates = []) {
  return gates.filter(item => item.passed).length;
}

function computeProgress(base, gates = []) {
  if (!gates.length) {
    return base;
  }

  const missingPercent = 100 - base;
  return Math.round(base + ((countComplete(gates) / gates.length) * missingPercent));
}

function summarizePaperState({ plans = [], runs = [], schedules = [], strategies = [], riskProfiles = [], paperSessions = [], marketImports = [] } = {}) {
  const readyPlans = plans.filter(plan => plan.mode === 'paper' && (plan.readiness?.status === 'ready_for_paper' || plan.status === 'ready_for_paper'));
  const completedRuns = runs.filter(run => run.mode === 'paper' && run.status === 'completed');
  const activeSchedules = schedules.filter(schedule => schedule.status === 'active');
  const activeRiskProfiles = riskProfiles.filter(profile => (
    profile.status === 'active'
    && Number(profile.max_order_value) > 0
    && Number(profile.max_position_value) > 0
    && Number(profile.max_daily_loss) > 0
    && Number(profile.max_open_trades) > 0
    && !profile.kill_switch_enabled
  ));
  const completedPaperSessions = paperSessions.filter(session => session.status === 'completed');
  const usableImports = marketImports.filter(item => item.status !== 'archived');

  return {
    readyPlans,
    completedRuns,
    activeSchedules,
    activeRiskProfiles,
    completedPaperSessions,
    usableImports
  };
}

function buildOwnerSetupWizard({
  envStatus = readOwnerEnvStatus(),
  wallets = [],
  plans = [],
  runs = [],
  schedules = [],
  strategies = [],
  riskProfiles = [],
  paperSessions = [],
  marketImports = [],
  exchangeConnectors = [],
  localSecretReferences = [],
  liveExecution = {}
} = {}) {
  const paperState = summarizePaperState({ plans, runs, schedules, strategies, riskProfiles, paperSessions, marketImports });
  const activeWallets = wallets.filter(wallet => !['revoked', 'archived', 'disabled'].includes(wallet.status));
  const publicWallets = activeWallets.filter(wallet => String(wallet.public_address || '').trim());
  const detectedEnvPublicWallets = (envStatus.publicWalletAddresses || []).filter(item => item.safeToDisplay && item.address);
  const connectorReady = exchangeConnectors.some(connector => (
    ['paper', 'read_only', 'live_disabled'].includes(connector.mode)
    && ['configured', 'planned', 'disabled'].includes(connector.status)
  ));
  const localSecretRefsConfigured = localSecretReferences.filter(ref => ref.status === 'configured');
  const walletSigningEnabled = Boolean(liveExecution.walletSigningEnabled);
  const liveLocked = liveExecution.enabled === false
    && liveExecution.orderEndpointEnabled === false
    && liveExecution.goLiveAllowed === false
    && walletSigningEnabled === false;
  const localServerHealthy = true;
  const paperScheduleOrRunReady = paperState.completedRuns.length > 0 || paperState.activeSchedules.length > 0;
  const corePaperReady = localServerHealthy
    && paperScheduleOrRunReady
    && paperState.activeRiskProfiles.length > 0
    && liveLocked
    && walletSigningEnabled === false;
  const paperGates = [
    gate({
      id: 'local_server_healthy',
      lane: 'paper',
      label: 'Local server healthy',
      passed: localServerHealthy,
      missing: 'The local EtherealAI server must be running.',
      whyNeeded: 'Paper trading runs locally. If this page is loading, the local server is responding.',
      safe: 'Safe. This is a local health check only.',
      exactlyEnter: 'Nothing to enter. Keep the local server running.',
      evidence: 'owner setup API responded'
    }),
    gate({
      id: 'paper_risk_profile_ready',
      lane: 'paper',
      label: 'Risk profile ready',
      passed: paperState.activeRiskProfiles.length > 0,
      missing: 'An active risk profile with limits and kill switch off is needed.',
      whyNeeded: 'Paper automation still needs risk limits so the same plan can later be reviewed safely.',
      safe: 'Safe. Risk profiles are local records; they do not place orders.',
      exactlyEnter: 'In Strategy Lab Risk, set max order value, max position value, max daily loss, max open trades, status active, kill switch off.',
      evidence: `${paperState.activeRiskProfiles.length} active ready profile(s)`
    }),
    gate({
      id: 'paper_verification_run_completed',
      lane: 'paper',
      label: 'Paper schedule or run ready',
      passed: paperScheduleOrRunReady,
      missing: 'Create or activate one local paper schedule, or complete one paper bot run.',
      whyNeeded: 'This proves the system can run paper automation locally without real orders.',
      safe: 'Safe. It is paper-only and does not use wallet signing.',
      exactlyEnter: 'Use Paper Trading Center or Bot Control Center to create a safe paper plan, then activate a local paper schedule or run one paper verification cycle.',
      verifyAction: 'Click Verify Paper Trading 100%. EtherealAI will check local paper schedules and completed paper runs only.',
      evidence: `${paperState.completedRuns.length} completed paper run(s), ${paperState.activeSchedules.length} active schedule(s)`
    }),
    gate({
      id: 'paper_live_trading_locked',
      lane: 'paper',
      label: 'Live trading locked',
      passed: liveLocked,
      missing: 'Live trading must remain disabled.',
      whyNeeded: 'Paper trading completion must never require live orders or live exchange execution.',
      safe: 'Safe. This confirms the high-security live boundary is still closed.',
      exactlyEnter: 'Nothing to enter. Keep live trading disabled.',
      evidence: liveLocked ? 'live execution disabled, order endpoint disabled, go-live blocked' : 'live boundary needs review'
    }),
    gate({
      id: 'paper_wallet_signing_locked',
      lane: 'paper',
      label: 'Wallet signing locked',
      passed: walletSigningEnabled === false,
      missing: 'Wallet signing must remain disabled for paper trading.',
      whyNeeded: 'Paper trading is complete only when no wallet can sign transactions.',
      safe: 'Safe. This confirms EtherealAI cannot request signatures.',
      exactlyEnter: 'Nothing to enter. Do not add seed phrases or private keys.',
      evidence: walletSigningEnabled ? 'wallet signing enabled' : 'wallet signing disabled'
    })
  ];
  const fullE2eGates = [
    gate({
      id: 'env_file_ready',
      lane: 'full_e2e',
      label: 'Local secrets file ready',
      passed: envStatus.safeToUse,
      missing: envStatus.exists ? 'Fix file permissions or remove forbidden wallet secret material.' : 'Create ~/EtherealAI_Secrets/.env.',
      whyNeeded: 'The app needs a local place to check credentials without storing them in the database or asking through the UI.',
      safe: 'Safe when the file is owner-only and contains API/RPC credentials plus optional public wallet addresses only. Do not put seed phrases or private keys in it.',
      exactlyEnter: [
        'Click Select .env File in this wizard to visually inspect the file contents.',
        'The server also checks ~/EtherealAI_Secrets/.env automatically.',
        'Enter only approved variable names shown in this wizard.',
        'Never add seed phrases, private keys, wallet passwords, or recovery phrases.'
      ].join('\n'),
      evidence: envStatus.exists ? `mode ${envStatus.permissionMode || 'unknown'}, ${envStatus.foundAllowedNames.length} approved variable(s)` : 'file missing',
      blocking: false,
      optional: true
    }),
    gate({
      id: 'chain_provider_ready',
      lane: 'optional_future_integration',
      label: 'Blockchain Provider / Chain Provider ready',
      passed: envStatus.safeToUse && (
        groupComplete(envStatus, ['CHAIN_RPC_URL', 'CHAIN_EXPLORER_API_KEY'])
        || groupComplete(envStatus, ['POLYGON_RPC_URL', 'POLYGONSCAN_API_KEY'])
      ),
      missing: 'Optional: add provider credentials only after choosing a target chain for a project.',
      whyNeeded: 'Future token evidence, chain reads, quote adapters, or deployment review may need provider access for the selected chain.',
      safe: 'Safe when used as provider credentials only. These do not enable wallet signing or live trading.',
      exactlyEnter: ['CHAIN_RPC_URL=...', 'CHAIN_EXPLORER_API_KEY=...', '# or chain-specific names after choosing a chain'].join('\n'),
      evidence: `Generic provider=${groupComplete(envStatus, ['CHAIN_RPC_URL', 'CHAIN_EXPLORER_API_KEY']) ? 'complete' : 'optional'}, Polygon provider=${groupComplete(envStatus, ['POLYGON_RPC_URL', 'POLYGONSCAN_API_KEY']) ? 'complete' : 'optional'}`,
      blocking: false,
      optional: true
    }),
    gate({
      id: 'exchange_credentials_ready',
      lane: 'full_e2e',
      label: 'Exchange API credentials present',
      passed: envStatus.safeToUse && anyGroupComplete(envStatus, [
        ['COINBASE_API_KEY', 'COINBASE_API_SECRET'],
        ['KRAKEN_API_KEY', 'KRAKEN_API_SECRET'],
        ['BINANCE_API_KEY', 'BINANCE_API_SECRET']
      ]),
      missing: 'At least one complete exchange API key/secret pair is needed in the local .env file.',
      whyNeeded: 'Future live adapter verification needs exchange credentials, but live trading remains disabled until separate approval.',
      safe: 'Safe only if withdrawals are disabled at the exchange and the key is stored only in ~/EtherealAI_Secrets/.env.',
      exactlyEnter: [
        'COINBASE_API_KEY=...',
        'COINBASE_API_SECRET=...',
        '# or KRAKEN_API_KEY/KRAKEN_API_SECRET',
        '# or BINANCE_API_KEY/BINANCE_API_SECRET'
      ].join('\n'),
      evidence: `Coinbase=${groupComplete(envStatus, ['COINBASE_API_KEY', 'COINBASE_API_SECRET']) ? 'complete' : 'missing'}, Kraken=${groupComplete(envStatus, ['KRAKEN_API_KEY', 'KRAKEN_API_SECRET']) ? 'complete' : 'missing'}, Binance=${groupComplete(envStatus, ['BINANCE_API_KEY', 'BINANCE_API_SECRET']) ? 'complete' : 'missing'}`,
      blocking: false,
      optional: true
    }),
    gate({
      id: 'public_wallet_metadata_ready',
      lane: 'full_e2e',
      label: 'Public wallet addresses attached',
      passed: publicWallets.length > 0,
      missing: 'Optional: add a public wallet address through the UI when you want wallet planning metadata.',
      whyNeeded: 'EtherealAI needs labels and public addresses to assign wallets to trading, deployment, treasury, or recovery roles without holding keys.',
      safe: 'Safe. Public addresses are allowed. Seed phrases and private keys are never allowed.',
      exactlyEnter: 'Wallet label, wallet type, chain family, network, and public address only.',
      evidence: `${publicWallets.length} public wallet metadata record(s), ${detectedEnvPublicWallets.length} detected public .env address(es)`,
      blocking: false,
      optional: true
    }),
    gate({
      id: 'connector_metadata_ready',
      lane: 'full_e2e',
      label: 'Connector metadata ready',
      passed: connectorReady || localSecretRefsConfigured.length > 0,
      missing: 'Add at least one local secret reference or exchange connector metadata record.',
      whyNeeded: 'The system needs a metadata reference showing where credentials live without storing secret values in SQLite.',
      safe: 'Safe. Metadata references store names like COINBASE_API_KEY, not the secret values.',
      exactlyEnter: 'Use Strategy Lab Connectors or add local secret references that point to env var names. Do not paste the actual API key into connector settings.',
      evidence: `${exchangeConnectors.length} connector(s), ${localSecretRefsConfigured.length} configured local reference(s)`,
      blocking: false,
      optional: true
    }),
    gate({
      id: 'external_ops_credentials_ready',
      lane: 'full_e2e',
      label: 'GitHub, Cloudflare, and social credentials present',
      passed: envStatus.safeToUse
        && groupComplete(envStatus, ['GITHUB_TOKEN'])
        && groupComplete(envStatus, ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'])
        && (
          groupComplete(envStatus, ['X_CLIENT_ID', 'X_CLIENT_SECRET'])
          || groupComplete(envStatus, ['DISCORD_BOT_TOKEN'])
          || groupComplete(envStatus, ['TELEGRAM_BOT_TOKEN'])
          || groupComplete(envStatus, ['MEDIUM_INTEGRATION_TOKEN'])
        ),
      missing: 'GitHub token, Cloudflare token/account ID, and at least one social credential are missing.',
      whyNeeded: 'Future website, repository, DNS, and community automation verification needs owner-managed credentials.',
      safe: 'Safe because the app only checks presence now. External posting, DNS mutation, and GitHub mutation remain disabled unless separately approved.',
      exactlyEnter: [
        'GITHUB_TOKEN=...',
        'CLOUDFLARE_API_TOKEN=...',
        'CLOUDFLARE_ACCOUNT_ID=...',
        'X_CLIENT_ID=... and X_CLIENT_SECRET=... OR DISCORD_BOT_TOKEN=... OR TELEGRAM_BOT_TOKEN=... OR MEDIUM_INTEGRATION_TOKEN=...'
      ].join('\n'),
      evidence: `GitHub=${hasEnv(envStatus, 'GITHUB_TOKEN') ? 'present' : 'missing'}, Cloudflare=${groupComplete(envStatus, ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) ? 'complete' : 'missing'}`,
      blocking: false,
      optional: true
    }),
    gate({
      id: 'high_security_live_approval_locked',
      lane: 'live_e2e',
      label: 'Live trading remains locked',
      passed: liveLocked,
      missing: 'Live approval lock must show disabled execution, disabled order endpoint, and no go-live allowance.',
      whyNeeded: 'This is the correct safety state. Live E2E remains locked until a separate owner-approved live process exists.',
      safe: 'Safe. This is the separate high-security approval boundary, not a failure.',
      exactlyEnter: 'Nothing to enter. Verify that live execution stays disabled.',
      evidence: liveLocked ? 'live execution disabled, order endpoint disabled, go-live blocked' : 'live lock not confirmed'
    })
  ];
  const paperProgress = corePaperReady ? 100 : computeProgress(95, paperGates);
  const localE2eReady = corePaperReady
    && publicWallets.length > 0
    && liveLocked
    && walletSigningEnabled === false;
  const localE2eProgress = localE2eReady ? 100 : (corePaperReady ? 95 : paperProgress);
  const liveE2eGates = fullE2eGates.filter(item => item.lane === 'live_e2e');
  const optionalFutureGates = fullE2eGates.filter(item => item.optional);
  const blockedGates = [...paperGates, ...fullE2eGates].filter(item => item.blocking !== false && !item.passed);

  return {
    status: corePaperReady ? 'local_paper_trading_ready' : 'owner_setup_in_progress',
    generatedAt: new Date().toISOString(),
    audience: 'non_technical_owner',
    coreSetup: {
      status: corePaperReady ? 'complete' : 'needs_attention',
      label: localE2eReady ? 'Local E2E Complete' : (corePaperReady ? 'Core Setup Complete' : 'Core Setup Needs Attention'),
      readinessLabel: localE2eReady ? 'Local E2E Complete' : (corePaperReady ? 'Local Paper Trading Ready' : 'Paper Setup Needs Attention'),
      message: localE2eReady
        ? 'Local E2E Complete — You can safely operate local paper trading. Live E2E remains locked for future approval.'
        : corePaperReady
          ? 'You can now safely use local paper trading. Add public wallet metadata through the UI to complete Local E2E. Live trading and wallet signing remain disabled.'
        : 'Finish the required paper-trading items. Optional API/provider integrations can wait.',
      paperTradingOperational: corePaperReady,
      localEndToEndOperational: localE2eReady,
      localServerHealthy,
      paperScheduleOrRunReady,
      activeRiskProfilePresent: paperState.activeRiskProfiles.length > 0,
      publicWalletMetadataPresent: publicWallets.length > 0,
      liveTradingEnabled: false,
      walletSigningEnabled: false,
      optionalIntegrationsRequired: false
    },
    env: envStatus,
    envDiscovery: {
      secureServerPath: OWNER_ENV_PATH,
      visualPickerSupported: true,
      browserPathHidden: true,
      explanation: [
        'The server automatically looks for ~/EtherealAI_Secrets/.env on this Mac.',
        'The visual picker lets you select the file so the page can verify names and safety without terminal commands.',
        'Browsers hide the real file path for security, so the picker confirms file contents while the server confirms the fixed secure path.',
        'Secret values are not displayed. Public wallet addresses are the only values the wizard is allowed to show.'
      ]
    },
    paperConfiguration: {
      progress: paperProgress,
      readyPaperPlans: paperState.readyPlans.length,
      completedPaperRuns: paperState.completedRuns.length,
      activePaperSchedules: paperState.activeSchedules.length,
      activeRiskProfiles: paperState.activeRiskProfiles.length,
      completedPaperSessions: paperState.completedPaperSessions.length,
      usableMarketImports: paperState.usableImports.length,
      corePaperReady,
      status: paperProgress === 100 ? 'paper_ready' : 'paper_setup_needed',
      liveSigningRequired: false,
      explanation: paperProgress === 100
        ? 'Your paper-trading system is operational. No live wallet signing was used.'
        : 'Paper trading still needs one active risk profile and one active paper schedule or completed paper run. No live wallet signing is required.'
    },
    walletMetadata: {
      savedPublicWallets: publicWallets.map(wallet => ({
        id: wallet.id,
        label: wallet.label,
        network: wallet.network,
        chainFamily: wallet.chain_family,
        publicAddress: wallet.public_address,
        signingEnabled: false,
        liveExecutionEnabled: false
      })),
      detectedEnvPublicWallets,
      nextAction: publicWallets.length
        ? 'Wallet setup complete. Review saved public metadata and keep signing disabled.'
        : detectedEnvPublicWallets.length
          ? 'Optional: use the detected public wallet address to prefill the wallet form, or add a public wallet address directly through the UI.'
          : 'Optional: add a public wallet address directly through the UI when you want wallet planning metadata.'
    },
    progress: {
      paperTrading: {
        current: paperProgress,
        from: 95,
        target: 100,
        label: 'Paper trading setup',
        liveSigningRequired: false
      },
      localEndToEnd: {
        current: localE2eProgress,
        from: 95,
        target: 100,
        label: 'Local E2E Readiness',
        status: localE2eReady ? 'complete' : 'needs_public_wallet_metadata',
        message: localE2eReady
          ? 'Local E2E Complete — You can safely operate local paper trading.'
          : 'Local E2E needs public wallet metadata added through the UI. No wallet signing is required.'
      },
      liveEndToEnd: {
        current: null,
        from: null,
        target: null,
        label: 'Live E2E Readiness',
        status: 'locked',
        message: 'Live E2E Locked — Future approval required.',
        liveTradingEnabled: false,
        walletSigningEnabled: false
      },
      fullEndToEnd: {
        current: null,
        from: null,
        target: null,
        label: 'Live E2E Readiness',
        status: 'locked',
        liveTradingEnabled: false,
        note: 'Live E2E Locked — Future approval required. This is the correct safety state, not a failure.'
      }
    },
    gates: {
      paperTrading: paperGates,
      localEndToEnd: [
        gate({
          id: 'public_wallet_metadata_ready',
          lane: 'local_e2e',
          label: 'Public wallet metadata present',
          passed: publicWallets.length > 0,
          missing: 'Add at least one public wallet address through the UI.',
          whyNeeded: 'Local E2E needs wallet metadata labels so projects, strategies, and token plans can assign wallets without giving EtherealAI signing keys.',
          safe: 'Safe. Public addresses are metadata only; signing remains disabled.',
          exactlyEnter: 'Use Add Public Wallet. Enter chain family, network, label, and public address only.',
          evidence: `${publicWallets.length} public wallet metadata record(s)`
        }),
        ...paperGates
      ],
      liveEndToEnd: liveE2eGates,
      optionalFutureIntegrations: optionalFutureGates,
      fullEndToEnd: fullE2eGates
    },
    optionalFutureIntegrations: [
      {
        id: 'blockchain_provider',
        label: 'Blockchain Provider / Chain Provider',
        ownerStatus: (
          groupComplete(envStatus, ['CHAIN_RPC_URL', 'CHAIN_EXPLORER_API_KEY'])
          || groupComplete(envStatus, ['POLYGON_RPC_URL', 'POLYGONSCAN_API_KEY'])
        ) ? 'Working' : 'Optional',
        requiredForPaperTrading: false,
        plainEnglish: 'Optional later after you choose a target chain for a project. Local paper trading does not need chain-provider keys.'
      },
      {
        id: 'market_data_providers',
        label: 'Market data providers',
        ownerStatus: hasEnv(envStatus, 'CHAIN_RPC_URL') || hasEnv(envStatus, 'POLYGON_RPC_URL') ? 'Working' : 'Optional',
        requiredForPaperTrading: false,
        plainEnglish: 'Optional later for automated external data refreshes. Local paper trading can use local/imported data.'
      },
      {
        id: 'exchange_apis',
        label: 'Exchange APIs',
        ownerStatus: anyGroupComplete(envStatus, [
          ['COINBASE_API_KEY', 'COINBASE_API_SECRET'],
          ['KRAKEN_API_KEY', 'KRAKEN_API_SECRET'],
          ['BINANCE_API_KEY', 'BINANCE_API_SECRET']
        ]) ? 'Working' : 'Optional',
        requiredForPaperTrading: false,
        plainEnglish: 'Optional future live-trading adapter setup. It must stay out of the paper-trading completion path.'
      },
      {
        id: 'social_api_integrations',
        label: 'Social/API integrations',
        ownerStatus: (
          groupComplete(envStatus, ['GITHUB_TOKEN'])
          || groupComplete(envStatus, ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'])
          || groupComplete(envStatus, ['X_CLIENT_ID', 'X_CLIENT_SECRET'])
          || groupComplete(envStatus, ['DISCORD_BOT_TOKEN'])
          || groupComplete(envStatus, ['TELEGRAM_BOT_TOKEN'])
          || groupComplete(envStatus, ['MEDIUM_INTEGRATION_TOKEN'])
        ) ? 'Working' : 'Optional',
        requiredForPaperTrading: false,
        plainEnglish: 'Optional later for repository, domain, website, and social automation.'
      },
      {
        id: 'wallet_metadata',
        label: 'Public wallet metadata',
        ownerStatus: publicWallets.length > 0 ? 'Working' : 'Optional',
        requiredForPaperTrading: false,
        plainEnglish: publicWallets.length > 0
          ? 'At least one public wallet address is saved in the UI database. Wallet signing remains disabled.'
          : 'Add public wallet addresses through the UI when needed. Do not use seed phrases or private keys.'
      }
    ],
    safetyBoundary: {
      liveTradingEnabled: false,
      walletSigningEnabled: false,
      seedPhrasesAccepted: false,
      privateKeysAccepted: false,
      secretValuesReturnedByApi: false,
      envValuesDisplayed: false,
      separateHighSecurityApprovalRequired: true
    },
    exactEnvTemplate: ENV_VARIABLES.map(variable => variable.example),
    setupGuide: blockedGates.map((item, index) => ({
      step: index + 1,
      lane: item.lane,
      gateId: item.id,
      label: item.label,
      status: item.status,
      ownerAction: item.exactlyEnter,
      why: item.whyNeeded,
      safety: item.safe,
      verifyAction: item.verifyAction,
      evidence: item.evidence
    })),
    nextOwnerStep: paperProgress < 100
      ? 'Complete the paper trading gates first. No wallet signing is required.'
      : 'Your paper-trading system is operational. Create a strategy, run a paper bot, review paper results, or explore advanced integrations later.'
  };
}

function buildOwnerEnvTemplate() {
  return [
    '# EtherealAI local secrets template',
    '# Save real values in ~/EtherealAI_Secrets/.env and run: chmod 600 ~/EtherealAI_Secrets/.env',
    '# Do not add seed phrases, recovery phrases, private keys, or wallet passwords.',
    '',
    ...ENV_VARIABLES.map(variable => `${variable.example} # ${variable.label}`)
  ].join('\n');
}

module.exports = {
  OWNER_SECRETS_DIR,
  OWNER_ENV_PATH,
  ENV_VARIABLES,
  PUBLIC_WALLET_ADDRESS_NAMES,
  parseEnvLine,
  getPublicWalletAddressType,
  detectPublicWalletAddresses,
  readOwnerEnvStatus,
  buildOwnerSetupWizard,
  buildOwnerEnvTemplate
};
