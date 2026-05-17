const MULTI_AGENT_SAFETY_GATES = [
  {
    id: 'local_only_execution',
    label: 'Local-only execution',
    status: 'enforced',
    detail: 'Agent coordination stores local plans and model drafts only.'
  },
  {
    id: 'no_live_trading',
    label: 'No live trading',
    status: 'enforced',
    detail: 'Agents may design paper strategies but cannot place live orders.'
  },
  {
    id: 'no_wallet_or_secret_loading',
    label: 'No wallet or secret loading',
    status: 'enforced',
    detail: 'Agents cannot request, store, load, or use private keys, mnemonics, API keys, or tokens.'
  },
  {
    id: 'no_external_posting',
    label: 'No external posting',
    status: 'enforced',
    detail: 'Social agents create local drafts only and cannot post externally.'
  },
  {
    id: 'no_deployment_or_purchase',
    label: 'No deployment or purchase',
    status: 'enforced',
    detail: 'Solidity, domain, Hermes, and infrastructure actions remain owner-reviewed manual gates.'
  },
  {
    id: 'audit_every_run',
    label: 'Audit every run',
    status: 'enforced',
    detail: 'Coordination runs and agent contributions are recorded in SQLite.'
  }
];

const MULTI_AGENT_ROLES = [
  {
    id: 'planner',
    label: 'Planner Agent',
    modelRole: 'planner',
    lane: 'architecture',
    purpose: 'Break owner objectives into phases, dependencies, gates, and acceptance criteria.',
    responsibilities: [
      'architecture decomposition',
      'sequence planning',
      'dependency mapping',
      'owner-ready summaries'
    ],
    blockedActions: [
      'approving go-live execution',
      'bypassing owner acceptance'
    ]
  },
  {
    id: 'coding',
    label: 'Coding Agent',
    modelRole: 'coder',
    lane: 'implementation',
    purpose: 'Turn approved plans into scoped code changes, tests, and verification notes.',
    responsibilities: [
      'repository edits',
      'test coverage suggestions',
      'refactor plans',
      'implementation risk notes'
    ],
    blockedActions: [
      'overwriting unrelated user changes',
      'publishing code externally without owner approval'
    ]
  },
  {
    id: 'quant',
    label: 'Quant Agent',
    modelRole: 'planner',
    lane: 'paper_trading_research',
    purpose: 'Design paper-only market research, portfolio rules, rebalance criteria, and risk controls.',
    responsibilities: [
      'top-market-cap research design',
      'paper rebalance strategy logic',
      'fee/slippage assumptions',
      'arbitrage route modeling'
    ],
    blockedActions: [
      'placing live orders',
      'connecting live exchange credentials'
    ]
  },
  {
    id: 'solidity',
    label: 'Solidity Agent',
    modelRole: 'coder',
    lane: 'token_lab',
    purpose: 'Draft multi-chain token, NFT, dApp, and audit scaffolds without deployment.',
    responsibilities: [
      'EVM/Solana/Cosmos/Substrate planning',
      'contract feature matrix design',
      'test scaffold design',
      'deployment checklist drafts'
    ],
    blockedActions: [
      'mainnet/testnet broadcast',
      'wallet signing',
      'liquidity creation'
    ]
  },
  {
    id: 'social',
    label: 'Social Agent',
    modelRole: 'writer',
    lane: 'community_ops',
    purpose: 'Create local-only community, Medium, Discord, Telegram, YouTube, and launch content drafts.',
    responsibilities: [
      'campaign calendars',
      'community update drafts',
      'whitepaper messaging',
      'listing-readiness narrative'
    ],
    blockedActions: [
      'external posting',
      'account creation',
      'engagement manipulation'
    ]
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure Agent',
    modelRole: 'coder',
    lane: 'systems',
    purpose: 'Plan local services, deployment prerequisites, DNS/email setup, and operational runbooks.',
    responsibilities: [
      'service lifecycle planning',
      'DNS/email checklist design',
      'GitHub readiness',
      'local model lifecycle'
    ],
    blockedActions: [
      'buying domains',
      'creating external accounts',
      'pushing to GitHub without owner confirmation'
    ]
  },
  {
    id: 'validator_discovery',
    label: 'Validator Discovery Agent',
    modelRole: 'planner',
    lane: 'node_research',
    purpose: 'Research node/validator profitability models and chain selection criteria locally.',
    responsibilities: [
      'validator criteria',
      'node cost models',
      'chain comparison matrices',
      'risk and lockup notes'
    ],
    blockedActions: [
      'node deployment',
      'fund movement',
      'staking transactions'
    ]
  },
  {
    id: 'treasury',
    label: 'Treasury Agent',
    modelRole: 'planner',
    lane: 'treasury_controls',
    purpose: 'Design treasury policy, paper allocation rules, and governance controls.',
    responsibilities: [
      'treasury policy drafts',
      'risk budgets',
      'paper allocation rules',
      'governance gate design'
    ],
    blockedActions: [
      'moving funds',
      'signing transactions',
      'creating live portfolios'
    ]
  },
  {
    id: 'safety_compliance',
    label: 'Safety And Compliance Agent',
    modelRole: 'planner',
    lane: 'governance',
    purpose: 'Review plans for safety boundaries, external-surface risks, and owner acceptance requirements.',
    responsibilities: [
      'safety gate review',
      'external-surface review',
      'missing-test detection',
      'owner gate recommendations'
    ],
    blockedActions: [
      'weakening live gates',
      'approving unsupported legal/compliance claims'
    ]
  }
];

const AGENT_BY_ID = new Map(MULTI_AGENT_ROLES.map(agent => [agent.id, agent]));

function safeParseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function limitText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeSelectedAgents(selectedAgents = []) {
  const ids = Array.isArray(selectedAgents)
    ? selectedAgents.map(item => String(item || '').trim().toLowerCase())
    : [];
  const normalized = ids.filter(id => AGENT_BY_ID.has(id));

  if (normalized.length) {
    return Array.from(new Set(normalized));
  }

  return [
    'planner',
    'coding',
    'quant',
    'solidity',
    'social',
    'infrastructure',
    'validator_discovery',
    'treasury',
    'safety_compliance'
  ];
}

function normalizeExecutionMode(value) {
  const normalized = String(value || 'plan_only').trim().toLowerCase();

  return normalized === 'local_model_draft' ? 'local_model_draft' : 'plan_only';
}

function normalizeProviderMode(value) {
  const normalized = String(value || 'role_default').trim().toLowerCase();

  return normalized === 'mlx_fast_lane' ? 'mlx_fast_lane' : 'role_default';
}

function getModelRoleConfig(modelConfig = {}, role) {
  return modelConfig.roles?.[role] || {};
}

function getAgentRegistry(modelConfig = {}) {
  return MULTI_AGENT_ROLES.map(agent => {
    const roleConfig = getModelRoleConfig(modelConfig, agent.modelRole);

    return {
      ...agent,
      provider: roleConfig.provider || modelConfig.defaultProvider || 'role-default',
      model: roleConfig.model || null,
      temperature: roleConfig.temperature,
      think: roleConfig.think,
      localOnly: true,
      liveExecutionEnabled: false
    };
  });
}

function buildAgentPrompt({
  agent,
  objective,
  context = '',
  registry = getAgentRegistry(),
  providerMode = 'role_default'
}) {
  const peerAgents = registry
    .filter(item => item.id !== agent.id)
    .map(item => `${item.label} (${item.lane})`)
    .join(', ');
  const safetyGateText = MULTI_AGENT_SAFETY_GATES
    .map(gate => `- ${gate.label}: ${gate.detail}`)
    .join('\n');

  return [
    `You are the ${agent.label} inside EtherealAI's local multi-agent coordination layer.`,
    `Lane: ${agent.lane}.`,
    `Purpose: ${agent.purpose}`,
    `Objective: ${objective}`,
    context ? `Owner/project context: ${context}` : 'Owner/project context: no extra context provided.',
    `Peer agents: ${peerAgents}`,
    `Provider mode: ${providerMode}.`,
    'Safety gates:',
    safetyGateText,
    'Return a concise JSON-compatible plan fragment with: priorities, recommendedActions, dependencies, validationChecks, blockedActions, and nextOwnerDecision.',
    'Do not request secrets, credentials, wallet keys, purchases, deployments, external posting, or live trading.'
  ].join('\n');
}

function buildPlanOnlyContribution({ agent, objective, context, registry, providerMode, modelConfig }) {
  const roleConfig = getModelRoleConfig(modelConfig, agent.modelRole);

  return {
    agentId: agent.id,
    agentLabel: agent.label,
    modelRole: agent.modelRole,
    provider: providerMode === 'mlx_fast_lane'
      ? 'mlx'
      : roleConfig.provider || modelConfig.defaultProvider || 'role-default',
    model: providerMode === 'mlx_fast_lane'
      ? modelConfig.providers?.mlx?.lifecycle?.model || 'mlx-community/Qwen3-Coder-Next-4bit'
      : roleConfig.model || null,
    status: 'planned',
    prompt: buildAgentPrompt({ agent, objective, context, registry, providerMode }),
    response: [
      `${agent.label} is queued for local-only coordination.`,
      `Primary lane: ${agent.lane}.`,
      `Responsibilities: ${agent.responsibilities.join(', ')}.`,
      `Blocked actions: ${agent.blockedActions.join(', ')}.`
    ].join('\n'),
    durationMs: 0,
    error: null
  };
}

function buildCoordinationSummary({ selectedAgentIds, executionMode, providerMode }) {
  return {
    selectedAgentCount: selectedAgentIds.length,
    executionMode,
    providerMode,
    localOnly: true,
    liveExecutionEnabled: false,
    hermesBypassAllowed: false,
    nextRecommendedStep: executionMode === 'plan_only'
      ? 'Run a bounded local_model_draft on 1-3 agents after reviewing the plan.'
      : 'Review generated contributions, then convert accepted items into Creator/Strategy/Solidity tasks.'
  };
}

function buildHermesBenchmarkPlan({ modelConfig = {} } = {}) {
  const qwenRole = modelConfig.roles?.coder || {};

  return {
    status: 'owner_review_required',
    installed: false,
    enabled: false,
    bypassAllowed: false,
    localOnly: true,
    recommendedCommand: 'ollama launch hermes',
    modelRecommendation: qwenRole.model || 'qwen3.6:35b-a3b',
    benchmarkSequence: [
      'Confirm EtherealAI multi-agent safety gates are active.',
      'Owner manually installs or launches Hermes only after review.',
      'Point Hermes at local Ollama or another OpenAI-compatible local endpoint.',
      'Run the same objective through EtherealAI coordination and Hermes.',
      'Compare response quality, tool safety, memory behavior, and artifact auditability.',
      'Keep Hermes disabled from external posting, live trading, wallet signing, deployment, and purchases.'
    ],
    blockedUntilOwnerApproves: [
      'install Hermes Agent',
      'connect messaging gateway',
      'grant file write permissions',
      'grant shell command permissions',
      'grant external posting permissions'
    ]
  };
}

function parseMultiAgentRun(row = {}) {
  return {
    id: row.id,
    objective: row.objective,
    context: row.context,
    status: row.status,
    execution_mode: row.execution_mode,
    provider_mode: row.provider_mode,
    selected_agents: safeParseJson(row.selected_agents_json, []),
    safety_gates: safeParseJson(row.safety_gates_json, []),
    summary: safeParseJson(row.summary_json, {}),
    created_at: row.created_at
  };
}

function parseMultiAgentContribution(row = {}) {
  return {
    id: row.id,
    run_id: row.run_id,
    agent_id: row.agent_id,
    agent_label: row.agent_label,
    model_role: row.model_role,
    provider: row.provider,
    model: row.model,
    status: row.status,
    prompt: row.prompt,
    response: row.response,
    duration_ms: row.duration_ms,
    error: row.error,
    created_at: row.created_at
  };
}

module.exports = {
  MULTI_AGENT_ROLES,
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
};
