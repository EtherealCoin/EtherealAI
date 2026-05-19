const {
  assertNoInlineSecretPayload,
  createSecretSafetyError
} = require('./secret-safety');

const WALLET_KINDS = new Set([
  'hardware',
  'browser_extension',
  'mobile_wallet',
  'multisig',
  'watch_only',
  'custody_reference',
  'other_reference'
]);

const CHAIN_FAMILIES = new Set([
  'evm',
  'solana',
  'bitcoin',
  'cosmos',
  'move',
  'cardano',
  'algorand',
  'stellar',
  'xrp',
  'hedera',
  'near',
  'substrate',
  'ton',
  'custom'
]);

const WALLET_STATUSES = new Set([
  'onboarding',
  'configured',
  'review_required',
  'disabled',
  'revoked',
  'archived'
]);

const WALLET_PERMISSION_KEYS = [
  'view_public_address',
  'request_signature',
  'deploy_contract',
  'mint_token',
  'transfer_assets',
  'trade_execution',
  'bridge_assets',
  'treasury_spend',
  'admin_recovery'
];

const WALLET_PERMISSION_STATES = new Set([
  'blocked',
  'owner_approval_each_time',
  'paper_only',
  'read_only'
]);

const WALLET_SECRET_TEXT_PATTERN = /\b(seed phrase|recovery phrase|mnemonic|private key|wallet secret|passphrase|24 words|12 words)\b/i;
const MANY_WORDS_PATTERN = /\b([a-z]{3,}\s+){11,}[a-z]{3,}\b/i;

function cleanText(value, fallback = '', maxLength = 500) {
  const cleaned = String(value ?? fallback).trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

function safeJsonParse(value, fallback = {}) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function assertNoWalletSecretText(body = {}) {
  const text = JSON.stringify(body || {});

  if (WALLET_SECRET_TEXT_PATTERN.test(text) || MANY_WORDS_PATTERN.test(text)) {
    throw createSecretSafetyError(
      'Wallet records cannot contain seed phrases, recovery phrases, private keys, passphrases, or wallet secrets.'
    );
  }
}

function normalizeWalletPermissions(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const permissions = {};

  for (const key of WALLET_PERMISSION_KEYS) {
    const requested = cleanText(source[key], key === 'view_public_address' ? 'read_only' : 'blocked', 80).toLowerCase();
    permissions[key] = WALLET_PERMISSION_STATES.has(requested) ? requested : 'blocked';
  }

  return permissions;
}

function normalizeAssignments(value = []) {
  const rawItems = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(rawItems
    .map(item => cleanText(item, '', 80).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean))]
    .slice(0, 20);
}

function sanitizeWalletInput(body = {}, current = null) {
  assertNoInlineSecretPayload(
    body,
    'Wallet records cannot store secrets. Attach only public address metadata and local reference names.'
  );
  assertNoWalletSecretText(body);

  const label = cleanText(body.label ?? current?.label, '', 120);
  const walletKind = cleanText(body.walletKind ?? body.wallet_kind ?? current?.wallet_kind, 'hardware', 80).toLowerCase();
  const chainFamily = cleanText(body.chainFamily ?? body.chain_family ?? current?.chain_family, 'evm', 80).toLowerCase();
  const network = cleanText(body.network ?? current?.network, 'base', 120).toLowerCase();
  const publicAddress = cleanText(body.publicAddress ?? body.public_address ?? current?.public_address, '', 180);
  const connectionMethod = cleanText(body.connectionMethod ?? body.connection_method ?? current?.connection_method, walletKind, 120);
  const status = cleanText(body.status ?? current?.status, 'onboarding', 80).toLowerCase();
  const notes = cleanText(body.notes ?? current?.notes, '', 1200);
  const secretReferenceIdRaw = body.secretReferenceId ?? body.secret_reference_id ?? current?.secret_reference_id ?? null;
  const secretReferenceId = secretReferenceIdRaw ? Number(secretReferenceIdRaw) : null;
  const assignments = normalizeAssignments(body.assignments ?? body.assignment_json ?? current?.assignment_json ?? []);
  const permissionScope = normalizeWalletPermissions(body.permissionScope ?? body.permission_scope_json ?? current?.permission_scope_json ?? {});

  if (!label) {
    throw createSecretSafetyError('Wallet label is required');
  }

  if (!WALLET_KINDS.has(walletKind)) {
    throw createSecretSafetyError('Wallet kind must be hardware, browser_extension, mobile_wallet, multisig, watch_only, custody_reference, or other_reference');
  }

  if (!CHAIN_FAMILIES.has(chainFamily)) {
    throw createSecretSafetyError('Chain family must be one of the supported wallet chain families');
  }

  if (!WALLET_STATUSES.has(status)) {
    throw createSecretSafetyError('Wallet status must be onboarding, configured, review_required, disabled, revoked, or archived');
  }

  if (secretReferenceId !== null && (!Number.isInteger(secretReferenceId) || secretReferenceId <= 0)) {
    throw createSecretSafetyError('Secret reference ID must be a positive integer');
  }

  return {
    label,
    walletKind,
    chainFamily,
    network,
    publicAddress,
    connectionMethod,
    status,
    notes,
    secretReferenceId,
    assignments,
    permissionScope,
    localOnly: true,
    signingEnabled: false,
    liveExecutionEnabled: false
  };
}

function parseOwnerWallet(row = {}) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    user_id: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
    secret_reference_id: row.secret_reference_id === null || row.secret_reference_id === undefined ? null : Number(row.secret_reference_id),
    label: row.label,
    wallet_kind: row.wallet_kind,
    chain_family: row.chain_family,
    network: row.network,
    public_address: row.public_address || '',
    connection_method: row.connection_method,
    status: row.status,
    assignments: safeJsonParse(row.assignment_json, []),
    permissionScope: safeJsonParse(row.permission_scope_json, {}),
    notes: row.notes || '',
    localOnly: row.local_only !== 0,
    signingEnabled: row.signing_enabled === 1,
    liveExecutionEnabled: row.live_execution_enabled === 1,
    secret_reference_label: row.secret_reference_label || null,
    secret_reference_provider_type: row.secret_reference_provider_type || null,
    secret_reference_name: row.secret_reference_name || null,
    secret_reference_status: row.secret_reference_status || null,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function parseWalletPermissionEvent(row = {}) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    wallet_id: row.wallet_id === null || row.wallet_id === undefined ? null : Number(row.wallet_id),
    user_id: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
    event_type: row.event_type,
    status: row.status,
    summary: row.summary,
    before: safeJsonParse(row.before_json, null),
    after: safeJsonParse(row.after_json, null),
    evidence: safeJsonParse(row.evidence_json, {}),
    localOnly: row.local_only !== 0,
    liveExecutionEnabled: row.live_execution_enabled === 1,
    created_at: row.created_at
  };
}

function evaluateWalletReadiness({ wallet, secretReference = null } = {}) {
  const permissions = wallet?.permissionScope || {};
  const privilegedPermissions = WALLET_PERMISSION_KEYS
    .filter(key => key !== 'view_public_address')
    .filter(key => permissions[key] !== 'blocked');
  const checks = [
    {
      id: 'wallet_metadata_recorded',
      label: 'Wallet metadata recorded',
      passed: Boolean(wallet?.label && wallet?.wallet_kind && wallet?.chain_family),
      severity: 'block',
      ownerAction: 'Attach the wallet with a plain-English label, wallet type, chain family, and network.'
    },
    {
      id: 'no_secret_storage',
      label: 'No wallet secrets stored',
      passed: wallet?.signingEnabled === false && wallet?.liveExecutionEnabled === false,
      severity: 'block',
      ownerAction: 'Keep seed phrases, private keys, recovery phrases, and passphrases outside EtherealAI.'
    },
    {
      id: 'permission_scope_reviewed',
      label: 'Permission scope reviewed',
      passed: Object.keys(permissions).length === WALLET_PERMISSION_KEYS.length,
      severity: 'review',
      ownerAction: 'Review every permission; anything not understood should stay blocked.'
    },
    {
      id: 'privileged_actions_blocked_or_owner_gated',
      label: 'Privileged actions blocked or owner-gated',
      passed: privilegedPermissions.every(key => permissions[key] === 'owner_approval_each_time' || permissions[key] === 'paper_only'),
      severity: 'block',
      ownerAction: 'Privileged wallet actions must require owner approval each time until a future reviewed live phase.'
    },
    {
      id: 'secret_reference_metadata_only',
      label: 'Wallet connector reference is metadata-only',
      passed: !wallet?.secret_reference_id || Boolean(secretReference),
      severity: wallet?.secret_reference_id ? 'block' : 'review',
      ownerAction: 'If using hardware-wallet middleware or a local wallet connector, store only the local reference name.'
    },
    {
      id: 'live_signing_disabled',
      label: 'Live signing disabled',
      passed: wallet?.signingEnabled === false && wallet?.liveExecutionEnabled === false,
      severity: 'block',
      ownerAction: 'Future signing must be a separate reviewed flow with visible prompts and rollback protection.'
    }
  ];
  const blockingFailures = checks.filter(check => check.severity === 'block' && !check.passed);
  const reviewFailures = checks.filter(check => check.severity === 'review' && !check.passed);

  return {
    status: blockingFailures.length ? 'blocked' : reviewFailures.length ? 'review_required' : 'metadata_ready',
    checks,
    privilegedPermissions,
    summary: {
      localOnly: true,
      signingEnabled: false,
      liveExecutionEnabled: false,
      secretsStored: false,
      blockingFailures: blockingFailures.length,
      reviewFailures: reviewFailures.length
    },
    nextOwnerActions: blockingFailures.length
      ? blockingFailures.map(check => check.ownerAction)
      : [
        'Keep the wallet disabled for live signing until the full owner review flow exists.',
        'Assign this wallet only to projects that match its purpose.',
        'Use revoke if a wallet, connector, or device is lost or compromised.'
      ]
  };
}

function buildWalletOnboardingGuide() {
  return {
    title: 'Owner Wallet Control Wizard',
    audience: 'Non-technical CEO operator',
    safetyBoundary: {
      localOnly: true,
      secretsAccepted: false,
      signingEnabled: false,
      liveExecutionEnabled: false,
      silentOutboundConnections: false
    },
    steps: [
      {
        id: 'choose_wallet',
        label: 'Choose wallet role',
        plainEnglish: 'Decide what the wallet is for: treasury, trading research, token deployment, social treasury, or recovery.',
        ownerDecision: 'Use separate wallets for separate jobs.'
      },
      {
        id: 'create_or_select_wallet',
        label: 'Create or select wallet outside EtherealAI',
        plainEnglish: 'Use a hardware wallet, multisig, or wallet app. EtherealAI should never see seed words or private keys.',
        ownerDecision: 'Write recovery material offline and keep it outside this app.'
      },
      {
        id: 'attach_metadata',
        label: 'Attach wallet metadata',
        plainEnglish: 'Enter a label, chain, network, and public address. This lets EtherealAI know the wallet exists without controlling it.',
        ownerDecision: 'Public address is allowed; seed phrase is never allowed.'
      },
      {
        id: 'scope_permissions',
        label: 'Scope permissions',
        plainEnglish: 'Pick what this wallet may be used for. Default is blocked. Risky actions require owner approval each time.',
        ownerDecision: 'Leave anything you do not understand blocked.'
      },
      {
        id: 'assign_projects',
        label: 'Assign to projects',
        plainEnglish: 'Connect the wallet to a token project, trading bot, treasury, deployment lane, or recovery lane.',
        ownerDecision: 'Avoid using one wallet for everything.'
      },
      {
        id: 'review_and_revoke',
        label: 'Review, revoke, or archive',
        plainEnglish: 'Every wallet can be disabled or revoked. Revoked wallets cannot be used by future automation planning.',
        ownerDecision: 'Revoke immediately if a device, connector, or address becomes unsafe.'
      }
    ],
    trainingContent: [
      {
        id: 'wallet_setup_video',
        title: 'Wallet Setup Walkthrough',
        format: 'youtube_style_script',
        outline: [
          'Explain why EtherealAI never asks for seed phrases.',
          'Show how to label a wallet by purpose.',
          'Show how to enter a public address.',
          'Show permission defaults and why risky actions stay blocked.'
        ]
      },
      {
        id: 'key_ownership_transfer_video',
        title: 'Key Ownership Transfer Walkthrough',
        format: 'youtube_style_script',
        outline: [
          'Explain that key ownership happens outside EtherealAI.',
          'Show how to create or recover a wallet with a hardware wallet or multisig.',
          'Show how to record only the public address and connector reference.',
          'Confirm live signing remains disabled after metadata is attached.'
        ]
      },
      {
        id: 'local_ai_operation_video',
        title: 'Local AI Operation Walkthrough',
        format: 'youtube_style_script',
        outline: [
          'Open Dashboard and review model roles, local model status, and MLX lifecycle.',
          'Use model benchmark controls without enabling external providers.',
          'Confirm System Memory export shows local-only state.',
          'Stop if local model status or memory isolation looks unsafe.'
        ]
      },
      {
        id: 'system_start_stop_video',
        title: 'System Startup And Shutdown',
        format: 'youtube_style_script',
        outline: [
          'Start EtherealAI locally from the project directory.',
          'Open Dashboard and confirm server, database, models, and memory sync.',
          'Use MLX lifecycle controls only when needed.',
          'Stop the app server before OS updates, travel, or unattended maintenance.'
        ]
      },
      {
        id: 'trading_controls_video',
        title: 'Trading Controls Walkthrough',
        format: 'youtube_style_script',
        outline: [
          'Open Strategy Lab and verify live execution is disabled.',
          'Use market data, backtests, paper runs, and safety dossiers only.',
          'Review risk profile and kill-switch state before paper schedules.',
          'Do not attach live exchange keys until a future reviewed live phase exists.'
        ]
      },
      {
        id: 'automation_controls_video',
        title: 'Automation Controls Walkthrough',
        format: 'youtube_style_script',
        outline: [
          'Open Strategy Lab bot automation controls.',
          'Review ready paper plans and schedule status.',
          'Run or pause paper schedules with local evidence exports.',
          'Confirm no live order endpoint exists before leaving automation running.'
        ]
      },
      {
        id: 'security_procedures_video',
        title: 'Security Procedures Walkthrough',
        format: 'youtube_style_script',
        outline: [
          'Review local-only boundaries before adding any connector metadata.',
          'Rotate any password or token that was pasted into any chat or browser.',
          'Use Keychain or a hardware wallet for real secrets outside EtherealAI.',
          'Use Operator Control revoke for wallet concerns and keep external posting disabled.'
        ]
      },
      {
        id: 'backup_recovery_video',
        title: 'Backups And Recovery Walkthrough',
        format: 'youtube_style_script',
        outline: [
          'Confirm GitHub push status for source code.',
          'Export System Memory and owner proof packet after major changes.',
          'Keep wallet recovery materials offline outside EtherealAI.',
          'After restore, verify memory sync, database health, and live-disabled gates.'
        ]
      },
      {
        id: 'emergency_revoke_video',
        title: 'Emergency Wallet Revocation',
        format: 'youtube_style_script',
        outline: [
          'Open Operator Control Center.',
          'Find the wallet by label.',
          'Press revoke.',
          'Confirm status changed to revoked and live signing remains disabled.'
        ]
      }
    ],
    operatingProcedures: [
      {
        id: 'start_system',
        title: 'Start EtherealAI',
        steps: [
          'Open Terminal in /Users/ethereal/test-ai-project.',
          'Run npm start.',
          'Open http://127.0.0.1:3000.',
          'Log in, open Dashboard, and confirm server, database, local models, and memory sync are healthy.'
        ],
        stopCondition: 'Stop and investigate if server health, database health, or memory sync fails.'
      },
      {
        id: 'stop_system',
        title: 'Stop EtherealAI',
        steps: [
          'Finish any active local verification run.',
          'Pause paper schedules if the computer will be offline.',
          'Stop the app server process.',
          'Confirm no unexpected process remains on port 3000.'
        ],
        stopCondition: 'Do not force-close during database writes unless emergency shutdown is required.'
      },
      {
        id: 'attach_wallet',
        title: 'Attach Wallet Metadata',
        steps: [
          'Create or select the wallet outside EtherealAI.',
          'Enter label, chain family, network, public address, and project assignment.',
          'Leave risky permissions blocked or owner-approved each time.',
          'Run readiness review and confirm no secrets were stored.'
        ],
        stopCondition: 'Stop immediately if any field contains seed words, private keys, passphrases, API tokens, or passwords.'
      },
      {
        id: 'paper_trading_review',
        title: 'Review Paper Trading Controls',
        steps: [
          'Open Strategy Lab.',
          'Review active strategy, risk profile, market data, and paper automation status.',
          'Export safety dossier evidence when needed.',
          'Keep live execution disabled.'
        ],
        stopCondition: 'Stop if any screen suggests live order placement, credential loading, or exchange network mutation is enabled.'
      },
      {
        id: 'emergency_shutdown',
        title: 'Emergency Shutdown',
        steps: [
          'Revoke any suspect wallet metadata record in Operator Control.',
          'Pause paper schedules from Strategy Lab if the system is unattended.',
          'Stop the app server.',
          'Rotate external passwords/tokens outside EtherealAI if any secret may have been exposed.',
          'Record notes in System Memory after the system is safe.'
        ],
        stopCondition: 'Do not continue automation after suspected compromise until owner review is complete.'
      },
      {
        id: 'backup_recovery',
        title: 'Backup And Recovery',
        steps: [
          'Push source changes to GitHub.',
          'Export Owner Proof Packet JSON.',
          'Export System Memory JSON.',
          'Keep wallet recovery material offline and separate from the repo.',
          'After restore, run npm test and authenticated verification before operating.'
        ],
        stopCondition: 'Do not operate from a restored copy until verification passes and live-disabled gates are confirmed.'
      }
    ]
  };
}

function buildOperatorControlSummary({ wallets = [], events = [] } = {}) {
  const activeWallets = wallets.filter(wallet => !['revoked', 'archived'].includes(wallet.status));
  const revokedWallets = wallets.filter(wallet => wallet.status === 'revoked');
  const configuredWallets = wallets.filter(wallet => wallet.status === 'configured');

  return {
    title: 'Operator Control Center',
    localOnly: true,
    signingEnabled: false,
    liveExecutionEnabled: false,
    secretsStored: false,
    counts: {
      wallets: wallets.length,
      activeWallets: activeWallets.length,
      configuredWallets: configuredWallets.length,
      revokedWallets: revokedWallets.length,
      recentEvents: events.length
    },
    readiness: {
      paperTradingBlocker: wallets.length === 0 ? 'wallet_metadata_needed_for_owner_key_handoff' : null,
      fullLiveBlocker: 'live_wallet_signing_endpoint_not_implemented',
      nextHumanStep: wallets.length === 0
        ? 'Attach a wallet metadata record without entering seed words or private keys.'
        : 'Review wallet permissions and keep signing disabled until a future live phase.'
    },
    boundaries: [
      'No seed phrase storage.',
      'No private key storage.',
      'No automatic wallet signing.',
      'No live deployment from wallet metadata.',
      'No live trading from wallet metadata.',
      'Every permission change is logged.'
    ]
  };
}

module.exports = {
  WALLET_KINDS,
  CHAIN_FAMILIES,
  WALLET_STATUSES,
  WALLET_PERMISSION_KEYS,
  WALLET_PERMISSION_STATES,
  sanitizeWalletInput,
  parseOwnerWallet,
  parseWalletPermissionEvent,
  evaluateWalletReadiness,
  buildWalletOnboardingGuide,
  buildOperatorControlSummary
};
