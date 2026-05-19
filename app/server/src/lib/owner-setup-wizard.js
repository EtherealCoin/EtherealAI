const fs = require('fs');
const path = require('path');

const OWNER_SECRETS_DIR = path.join(process.env.HOME || '/Users/ethereal', 'EtherealAI_Secrets');
const OWNER_ENV_PATH = path.join(OWNER_SECRETS_DIR, '.env');

const ENV_VARIABLES = [
  {
    id: 'polygon_rpc',
    name: 'POLYGON_RPC_URL',
    group: 'rpc',
    label: 'Polygon RPC URL',
    example: 'POLYGON_RPC_URL=https://your-polygon-rpc-provider',
    why: 'Needed so future Polygon quote/deploy/trading adapters can talk to Polygon without hardcoding provider credentials.'
  },
  {
    id: 'polygon_scan',
    name: 'POLYGONSCAN_API_KEY',
    group: 'rpc',
    label: 'PolygonScan API key',
    example: 'POLYGONSCAN_API_KEY=your_polygonscan_api_key',
    why: 'Needed to verify Polygon contracts and collect explorer evidence for token/listing workflows.'
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

const FORBIDDEN_WALLET_SECRET_KEY_PATTERN = /(seed|mnemonic|recovery|wallet.*private|private.*wallet|deployer_private_key|owner_private_key|wallet_secret|wallet_password)/i;
const FORBIDDEN_VALUE_PATTERNS = [
  { id: 'pem_private_key', label: 'PEM private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i },
  { id: 'seed_phrase_like_value', label: 'seed phrase-like value', pattern: /\b([a-z]{3,}\s+){11,}[a-z]{3,}\b/i }
];

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
  blocking = true
}) {
  return {
    id,
    lane,
    label,
    status: passed ? 'complete' : 'blocked',
    passed: Boolean(passed),
    blocking,
    missing: passed ? 'Nothing missing.' : missing,
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
  const connectorReady = exchangeConnectors.some(connector => (
    ['paper', 'read_only', 'live_disabled'].includes(connector.mode)
    && ['configured', 'planned', 'disabled'].includes(connector.status)
  ));
  const localSecretRefsConfigured = localSecretReferences.filter(ref => ref.status === 'configured');
  const liveLocked = liveExecution.enabled === false
    && liveExecution.orderEndpointEnabled === false
    && liveExecution.goLiveAllowed === false;
  const paperGates = [
    gate({
      id: 'paper_strategy_and_data_ready',
      lane: 'paper',
      label: 'Strategy and market data ready',
      passed: strategies.length > 0 && paperState.usableImports.length > 0,
      missing: 'A saved strategy and imported market data are needed.',
      whyNeeded: 'Paper trading needs rules and candles to simulate decisions without touching money.',
      safe: 'Safe. This uses local data and does not sign wallet transactions.',
      exactlyEnter: 'In Strategy Lab, save a strategy and import or refresh market data for the same symbol/timeframe.',
      evidence: `${strategies.length} strateg(ies), ${paperState.usableImports.length} usable import(s)`
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
      id: 'paper_replay_or_session_ready',
      lane: 'paper',
      label: 'Paper replay evidence ready',
      passed: paperState.completedPaperSessions.length > 0 || paperState.completedRuns.length > 0,
      missing: 'A completed paper replay or paper bot run is needed.',
      whyNeeded: 'This proves the system can simulate without a live wallet or exchange order.',
      safe: 'Safe. It is paper-only and does not use wallet signing.',
      exactlyEnter: 'Use Strategy Lab paper replay or the wizard paper verification button after a ready paper bot plan exists.',
      evidence: `${paperState.completedPaperSessions.length} paper replay(s), ${paperState.completedRuns.length} paper bot run(s)`
    }),
    gate({
      id: 'paper_bot_plan_ready',
      lane: 'paper',
      label: 'Paper bot plan ready',
      passed: paperState.readyPlans.length > 0,
      missing: 'A paper-mode bot automation plan with no blocking readiness failures is needed.',
      whyNeeded: 'This links the strategy, risk profile, paper replay, and automation controls.',
      safe: 'Safe. Paper bot plans cannot place live orders.',
      exactlyEnter: 'In Strategy Lab Bots, create a paper bot plan tied to the saved strategy, active risk profile, and paper replay.',
      evidence: `${paperState.readyPlans.length} ready paper plan(s)`
    }),
    gate({
      id: 'paper_verification_run_completed',
      lane: 'paper',
      label: 'Paper verification run completed',
      passed: paperState.completedRuns.length > 0 || paperState.activeSchedules.length > 0,
      missing: 'Run one paper verification cycle or activate a paper schedule.',
      whyNeeded: 'This moves paper trading from ready to verified complete for local E2E.',
      safe: 'Safe. The wizard runs paper only and never signs a wallet transaction.',
      exactlyEnter: 'Click Run Paper Verification in this wizard. If no ready plan exists, complete the prior paper gates first.',
      verifyAction: 'Click Run Paper Verification. EtherealAI will run one paper bot cycle only.',
      evidence: `${paperState.completedRuns.length} completed paper run(s), ${paperState.activeSchedules.length} active schedule(s)`
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
      safe: 'Safe when the file is owner-only and contains API/RPC credentials only. Do not put seed phrases or private keys in it.',
      exactlyEnter: [
        'Create folder: ~/EtherealAI_Secrets',
        'Create file: ~/EtherealAI_Secrets/.env',
        'Set permissions: chmod 600 ~/EtherealAI_Secrets/.env',
        'Enter only approved variable names shown in this wizard.'
      ].join('\n'),
      evidence: envStatus.exists ? `mode ${envStatus.permissionMode || 'unknown'}, ${envStatus.foundAllowedNames.length} approved variable(s)` : 'file missing'
    }),
    gate({
      id: 'rpc_provider_ready',
      lane: 'full_e2e',
      label: 'Polygon RPC/provider keys ready',
      passed: envStatus.safeToUse && groupComplete(envStatus, ['POLYGON_RPC_URL', 'POLYGONSCAN_API_KEY']),
      missing: 'POLYGON_RPC_URL and POLYGONSCAN_API_KEY are missing or empty.',
      whyNeeded: 'Polygon token creation, explorer evidence, and quote adapters need provider access after owner approval.',
      safe: 'Safe. These are provider credentials only; no wallet signing is enabled.',
      exactlyEnter: ['POLYGON_RPC_URL=...', 'POLYGONSCAN_API_KEY=...'].join('\n'),
      evidence: `POLYGON_RPC_URL=${hasEnv(envStatus, 'POLYGON_RPC_URL') ? 'present' : 'missing'}, POLYGONSCAN_API_KEY=${hasEnv(envStatus, 'POLYGONSCAN_API_KEY') ? 'present' : 'missing'}`
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
      evidence: `Coinbase=${groupComplete(envStatus, ['COINBASE_API_KEY', 'COINBASE_API_SECRET']) ? 'complete' : 'missing'}, Kraken=${groupComplete(envStatus, ['KRAKEN_API_KEY', 'KRAKEN_API_SECRET']) ? 'complete' : 'missing'}, Binance=${groupComplete(envStatus, ['BINANCE_API_KEY', 'BINANCE_API_SECRET']) ? 'complete' : 'missing'}`
    }),
    gate({
      id: 'public_wallet_metadata_ready',
      lane: 'full_e2e',
      label: 'Public wallet addresses attached',
      passed: publicWallets.length > 0,
      missing: 'Add at least one public wallet address through this wizard.',
      whyNeeded: 'EtherealAI needs labels and public addresses to assign wallets to trading, deployment, treasury, or recovery roles without holding keys.',
      safe: 'Safe. Public addresses are allowed. Seed phrases and private keys are never allowed.',
      exactlyEnter: 'Wallet label, wallet type, chain family, network, and public address only.',
      evidence: `${publicWallets.length} public wallet metadata record(s)`
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
      evidence: `${exchangeConnectors.length} connector(s), ${localSecretRefsConfigured.length} configured local reference(s)`
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
      evidence: `GitHub=${hasEnv(envStatus, 'GITHUB_TOKEN') ? 'present' : 'missing'}, Cloudflare=${groupComplete(envStatus, ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) ? 'complete' : 'missing'}`
    }),
    gate({
      id: 'high_security_live_approval_locked',
      lane: 'full_e2e',
      label: 'Live trading remains locked',
      passed: liveLocked,
      missing: 'Live approval lock must show disabled execution, disabled order endpoint, and no go-live allowance.',
      whyNeeded: 'The setup wizard can reach 100% readiness without enabling live trading.',
      safe: 'Safe. This is the separate high-security approval boundary.',
      exactlyEnter: 'Nothing to enter. Verify that live execution stays disabled.',
      evidence: liveLocked ? 'live execution disabled, order endpoint disabled, go-live blocked' : 'live lock not confirmed'
    })
  ];
  const paperProgress = computeProgress(95, paperGates);
  const fullE2eProgress = computeProgress(72, fullE2eGates);

  return {
    status: paperProgress === 100 && fullE2eProgress === 100 ? 'owner_setup_complete_live_disabled' : 'owner_setup_in_progress',
    generatedAt: new Date().toISOString(),
    audience: 'non_technical_owner',
    env: envStatus,
    progress: {
      paperTrading: {
        current: paperProgress,
        from: 95,
        target: 100,
        label: 'Paper trading setup',
        liveSigningRequired: false
      },
      fullEndToEnd: {
        current: fullE2eProgress,
        from: 72,
        target: 100,
        label: 'Full E2E setup readiness',
        liveTradingEnabled: false,
        note: '100% here means setup-ready for a later high-security live approval process, not live trading enabled.'
      }
    },
    gates: {
      paperTrading: paperGates,
      fullEndToEnd: fullE2eGates
    },
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
    nextOwnerStep: paperProgress < 100
      ? 'Complete the paper trading gates first. No wallet signing is required.'
      : fullE2eProgress < 100
        ? 'Complete the local .env and public wallet metadata gates. Live trading remains disabled.'
        : 'Setup readiness is complete. Keep live trading disabled until the separate high-security approval process is built and manually enabled.'
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
  parseEnvLine,
  readOwnerEnvStatus,
  buildOwnerSetupWizard,
  buildOwnerEnvTemplate
};
