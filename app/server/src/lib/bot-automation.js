const { findSensitiveFields } = require('./secret-safety');

function getPaperRiskGateStatus(paperSession) {
  return String(
    paperSession?.result?.riskGate?.status
    || paperSession?.result?.risk_gate?.status
    || ''
  ).trim().toLowerCase();
}

function evaluateBotAutomationReadiness({ strategy, riskProfile, paperSession, mode }) {
  const normalizedMode = String(mode || 'paper').trim().toLowerCase();
  const allowedModes = new Set(['paper', 'live_disabled']);
  const checks = [];
  const addCheck = (check) => {
    checks.push({
      severity: 'block',
      metric: null,
      threshold: null,
      note: '',
      ...check,
      passed: Boolean(check.passed)
    });
  };

  addCheck({
    id: 'strategy_exists',
    label: 'Strategy exists',
    passed: Boolean(strategy),
    metric: strategy ? `#${strategy.id}` : null,
    threshold: 'required',
    note: 'A bot plan must be tied to a saved strategy.'
  });
  addCheck({
    id: 'mode_is_supported',
    label: 'Mode is supported',
    passed: allowedModes.has(normalizedMode),
    metric: normalizedMode,
    threshold: 'paper or live_disabled',
    note: 'Live execution mode is intentionally not available in this build.'
  });
  addCheck({
    id: 'live_execution_disabled',
    label: 'Live execution is disabled',
    severity: normalizedMode === 'live_disabled' ? 'block' : 'review',
    passed: normalizedMode === 'paper',
    metric: normalizedMode,
    threshold: 'paper',
    note: normalizedMode === 'paper'
      ? 'Plan can be reviewed for paper automation only.'
      : 'Stored as a future-live plan only. No exchange execution path exists yet.'
  });
  addCheck({
    id: 'risk_profile_selected',
    label: 'Risk profile selected',
    passed: Boolean(riskProfile),
    metric: riskProfile ? `#${riskProfile.id}` : null,
    threshold: 'required',
    note: 'Automation must have explicit risk limits before it can run unattended.'
  });

  if (riskProfile) {
    addCheck({
      id: 'risk_profile_active',
      label: 'Risk profile active',
      passed: riskProfile.status === 'active',
      metric: riskProfile.status,
      threshold: 'active'
    });
    addCheck({
      id: 'risk_limits_set',
      label: 'Risk limits set',
      passed: riskProfile.max_order_value > 0
        && riskProfile.max_position_value > 0
        && riskProfile.max_daily_loss > 0
        && riskProfile.max_open_trades > 0,
      metric: {
        maxOrderValue: riskProfile.max_order_value,
        maxPositionValue: riskProfile.max_position_value,
        maxDailyLoss: riskProfile.max_daily_loss,
        maxOpenTrades: riskProfile.max_open_trades
      },
      threshold: 'all limits greater than zero'
    });
    addCheck({
      id: 'kill_switch_off',
      label: 'Kill switch off',
      passed: !riskProfile.kill_switch_enabled,
      metric: riskProfile.kill_switch_enabled ? 'on' : 'off',
      threshold: 'off',
      note: 'A plan cannot be ready while its selected risk profile has the kill switch engaged.'
    });
  }

  if (!paperSession) {
    addCheck({
      id: 'paper_session_linked',
      label: 'Paper session linked',
      severity: 'review',
      passed: false,
      metric: null,
      threshold: 'recommended',
      note: 'Attach a paper replay session before treating this as ready.'
    });
  } else {
    const riskGateStatus = getPaperRiskGateStatus(paperSession);
    const gatePassed = ['pass', 'passed', 'ready', 'ready_for_paper'].includes(riskGateStatus);

    addCheck({
      id: 'paper_session_strategy_match',
      label: 'Paper session matches strategy',
      passed: strategy && Number(paperSession.strategy_id) === Number(strategy.id),
      metric: `session strategy #${paperSession.strategy_id}`,
      threshold: strategy ? `strategy #${strategy.id}` : 'strategy required'
    });
    addCheck({
      id: 'paper_risk_gate_passed',
      label: 'Paper replay risk gate passed',
      severity: 'review',
      passed: gatePassed,
      metric: riskGateStatus || 'missing',
      threshold: 'passed',
      note: 'Paper replay readiness is advisory, but it should pass before unattended paper automation.'
    });
  }

  const blockingFailures = checks.filter(check => !check.passed && check.severity === 'block');
  const reviewFailures = checks.filter(check => !check.passed && check.severity !== 'block');
  const status = blockingFailures.length
    ? 'blocked'
    : reviewFailures.length
      ? 'review_required'
      : 'ready_for_paper';

  return {
    status,
    mode: normalizedMode,
    checks,
    failures: checks.filter(check => !check.passed).map(check => check.id),
    blockingFailures: blockingFailures.map(check => check.id),
    reviewFailures: reviewFailures.map(check => check.id),
    automationScope: 'paper_planning_only',
    liveExecution: {
      enabled: false,
      note: 'No live-order execution endpoint or exchange secret path exists in this build.'
    },
    generatedAt: new Date().toISOString()
  };
}

function evaluateBotLiveReadiness({ plan, strategy, riskProfile, paperSession, connector }) {
  const checks = [];
  const addCheck = (check) => {
    checks.push({
      severity: 'block',
      metric: null,
      threshold: null,
      note: '',
      ...check,
      passed: Boolean(check.passed)
    });
  };
  const paperRiskGateStatus = getPaperRiskGateStatus(paperSession);
  const paperRiskPassed = ['pass', 'passed', 'ready', 'ready_for_paper'].includes(paperRiskGateStatus);
  const connectorSensitiveFields = connector ? findSensitiveFields(connector.settings || {}) : [];

  addCheck({
    id: 'plan_exists',
    label: 'Bot plan exists',
    passed: Boolean(plan),
    metric: plan ? `#${plan.id}` : null,
    threshold: 'required'
  });
  addCheck({
    id: 'future_live_mode_selected',
    label: 'Future live mode selected',
    passed: plan?.mode === 'live_disabled',
    metric: plan?.mode || null,
    threshold: 'live_disabled',
    note: 'Live execution remains disabled; this only marks a plan as a future live candidate.'
  });
  addCheck({
    id: 'connector_selected',
    label: 'Execution connector selected',
    passed: Boolean(connector),
    metric: connector ? `#${connector.id} ${connector.label}` : null,
    threshold: 'required',
    note: 'A future live plan must reference a local connector placeholder before any later go-live review.'
  });

  if (connector) {
    addCheck({
      id: 'connector_disabled_or_read_only',
      label: 'Connector cannot place live orders',
      passed: ['live_disabled', 'read_only', 'paper'].includes(connector.mode),
      metric: connector.mode,
      threshold: 'paper, read_only, or live_disabled',
      note: 'This build has no live order adapter. Connector records are placeholders only.'
    });
    addCheck({
      id: 'connector_has_no_stored_secrets',
      label: 'Connector stores no secrets',
      passed: connectorSensitiveFields.length === 0,
      metric: connectorSensitiveFields.length ? connectorSensitiveFields : 'none detected',
      threshold: 'no secret-looking fields',
      note: connector.secret_storage_note || 'No secrets should be stored in SQLite.'
    });
    addCheck({
      id: 'connector_secret_reference_selected',
      label: 'Connector has local secret reference',
      passed: Boolean(connector.secret_reference_id),
      metric: connector.secret_reference_id ? `#${connector.secret_reference_id}` : 'none',
      threshold: 'required before future go-live review',
      note: 'Only a metadata reference is stored; real secret values must remain in local secure storage.'
    });
    addCheck({
      id: 'connector_secret_reference_configured',
      label: 'Local secret reference configured',
      passed: connector.secret_reference_status === 'configured',
      metric: connector.secret_reference_status || 'missing',
      threshold: 'configured'
    });
    addCheck({
      id: 'connector_secret_reference_scope',
      label: 'Local secret reference scope matches connector',
      passed: connector.secret_reference_scope === 'exchange_connector',
      metric: connector.secret_reference_scope || 'missing',
      threshold: 'exchange_connector'
    });
  }

  addCheck({
    id: 'risk_profile_selected',
    label: 'Risk profile selected',
    passed: Boolean(riskProfile),
    metric: riskProfile ? `#${riskProfile.id}` : null,
    threshold: 'required'
  });

  if (riskProfile) {
    addCheck({
      id: 'risk_profile_active',
      label: 'Risk profile active',
      passed: riskProfile.status === 'active',
      metric: riskProfile.status,
      threshold: 'active'
    });
    addCheck({
      id: 'risk_profile_future_live_review',
      label: 'Risk profile marked for live-disabled review',
      passed: riskProfile.mode === 'live_disabled',
      metric: riskProfile.mode,
      threshold: 'live_disabled',
      note: 'Future live plans should use a risk profile that was explicitly reviewed for live-disabled readiness.'
    });
    addCheck({
      id: 'risk_limits_set',
      label: 'Risk limits set',
      passed: riskProfile.max_order_value > 0
        && riskProfile.max_position_value > 0
        && riskProfile.max_daily_loss > 0
        && riskProfile.max_open_trades > 0,
      metric: {
        maxOrderValue: riskProfile.max_order_value,
        maxPositionValue: riskProfile.max_position_value,
        maxDailyLoss: riskProfile.max_daily_loss,
        maxOpenTrades: riskProfile.max_open_trades
      },
      threshold: 'all limits greater than zero'
    });
    addCheck({
      id: 'kill_switch_off_for_preflight',
      label: 'Kill switch off for preflight',
      passed: !riskProfile.kill_switch_enabled,
      metric: riskProfile.kill_switch_enabled ? 'on' : 'off',
      threshold: 'off',
      note: 'A live-readiness preflight can be reviewed only when the selected risk profile is not emergency-stopped.'
    });
  }

  addCheck({
    id: 'paper_session_linked',
    label: 'Paper session linked',
    severity: 'review',
    passed: Boolean(paperSession),
    metric: paperSession ? `#${paperSession.id}` : null,
    threshold: 'required before owner go-live review'
  });

  if (paperSession) {
    addCheck({
      id: 'paper_session_strategy_match',
      label: 'Paper session matches strategy',
      passed: strategy && Number(paperSession.strategy_id) === Number(strategy.id),
      metric: `session strategy #${paperSession.strategy_id}`,
      threshold: strategy ? `strategy #${strategy.id}` : 'strategy required'
    });
    addCheck({
      id: 'paper_risk_gate_passed',
      label: 'Paper replay risk gate passed',
      severity: 'review',
      passed: paperRiskPassed,
      metric: paperRiskGateStatus || 'missing',
      threshold: 'passed'
    });
  }

  addCheck({
    id: 'owner_go_live_confirmation',
    label: 'Owner go-live confirmation',
    passed: false,
    metric: 'not provided',
    threshold: 'explicit owner confirmation in a future enable flow',
    note: 'This endpoint can never enable live execution. It only reports what would still be required.'
  });
  addCheck({
    id: 'live_order_adapter_implemented',
    label: 'Live order adapter implemented',
    passed: false,
    metric: 'not implemented',
    threshold: 'separate reviewed adapter with tests',
    note: 'No live exchange order-placement adapter or route exists in this build.'
  });

  const blockingFailures = checks.filter(check => !check.passed && check.severity === 'block');
  const reviewFailures = checks.filter(check => !check.passed && check.severity !== 'block');

  return {
    status: 'blocked',
    stage: 'future_live_preflight',
    plan: plan
      ? {
        id: plan.id,
        name: plan.name,
        mode: plan.mode,
        status: plan.status
      }
      : null,
    checks,
    failures: checks.filter(check => !check.passed).map(check => check.id),
    blockingFailures: blockingFailures.map(check => check.id),
    reviewFailures: reviewFailures.map(check => check.id),
    connector: connector
      ? {
        id: connector.id,
        label: connector.label,
        exchangeName: connector.exchange_name,
        mode: connector.mode,
        status: connector.status,
        secretStorageNote: connector.secret_storage_note,
        secretReferenceId: connector.secret_reference_id || null,
        secretReferenceStatus: connector.secret_reference_status || null,
        secretReferenceProviderType: connector.secret_reference_provider_type || null,
        secretReferenceScope: connector.secret_reference_scope || null
      }
      : null,
    secretHandling: {
      secretsStoredInDatabase: false,
      requiredBeforeLive: [
        'local encrypted secret reference',
        'adapter-specific credential validation',
        'owner-approved key scope and withdrawal-disabled exchange permissions'
      ]
    },
    adapterContract: {
      implemented: false,
      requiredMethods: [
        'validateCredentials',
        'getBalances',
        'getOpenPositions',
        'placeOrder',
        'cancelOrder',
        'emergencyStop'
      ]
    },
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      note: 'Live order execution is still disabled. No route in this build can place an exchange order.'
    },
    generatedAt: new Date().toISOString()
  };
}

function parseOwnerGoLiveCommand(commandText) {
  const text = String(commandText || '').trim().slice(0, 1000);
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');
  const patterns = [
    { id: 'ready_to_go_live', pattern: /\bready\b.*\bgo live\b|\bgo live\b.*\bready\b/ },
    { id: 'final_bot_live', pattern: /\bfinal bot\b.*\blive\b|\blive\b.*\bfinal bot\b/ },
    { id: 'execute_automatically', pattern: /\bexecute automatically\b|\bautomated execution\b|\bturn on automation\b/ },
    { id: 'start_live_trading', pattern: /\bstart live trading\b|\bturn on live trading\b|\benable live trading\b/ }
  ];
  const matchedPatterns = patterns
    .filter(item => item.pattern.test(normalized))
    .map(item => item.id);

  return {
    parserVersion: 1,
    commandText: text,
    recognized: matchedPatterns.length > 0,
    matchedPatterns,
    acceptedForExecution: false,
    blocked: true,
    blockReason: 'Live execution is intentionally disabled until every implementation gate is replaced by reviewed code.',
    requiredFutureGates: [
      'live order adapter implemented and verified',
      'runtime credential loader implemented without logging secrets',
      'exchange credential permission validation implemented',
      'emergency stop final review passed',
      'owner final confirmation accepted by a future enable flow',
      'live order endpoint intentionally enabled by reviewed code'
    ],
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      goLiveAllowed: false
    },
    parsedAt: new Date().toISOString()
  };
}

function createBotLiveEnablementReviewPayload({ plan, readiness }) {
  const blockingFailures = Array.from(new Set([
    ...(readiness?.blockingFailures || []),
    'owner_go_live_confirmation',
    'live_order_adapter_implemented',
    'credential_validation_not_implemented',
    'emergency_stop_final_review_required'
  ]));
  const reviewFailures = Array.from(new Set([
    ...(readiness?.reviewFailures || []),
    'paper_results_final_review_required',
    'exchange_key_scope_final_review_required'
  ]));

  return {
    status: 'blocked',
    stage: 'owner_go_live_enablement_draft',
    plan: plan
      ? {
        id: plan.id,
        name: plan.name,
        mode: plan.mode,
        status: plan.status,
        connectorId: plan.connector_id || null,
        riskProfileId: plan.risk_profile_id || null,
        paperSessionId: plan.paper_session_id || null
      }
      : null,
    readinessSnapshot: readiness,
    ownerConfirmation: {
      required: true,
      provided: false,
      acceptedHere: false,
      futureRequiredPhrase: 'Owner explicitly confirms the final bot is ready to go live after testing.',
      note: 'This review record documents requirements only. It cannot enable live execution.'
    },
    checklist: [
      {
        id: 'readiness_preflight_reviewed',
        label: 'Latest live-readiness preflight reviewed',
        passed: false,
        requiredBeforeLive: true
      },
      {
        id: 'credential_validation_adapter',
        label: 'Credential validation adapter exists and is tested',
        passed: false,
        requiredBeforeLive: true
      },
      {
        id: 'exchange_key_scope_reviewed',
        label: 'Exchange key scope reviewed with withdrawals disabled',
        passed: false,
        requiredBeforeLive: true
      },
      {
        id: 'emergency_stop_verified',
        label: 'Emergency stop and kill-switch path verified',
        passed: false,
        requiredBeforeLive: true
      },
      {
        id: 'owner_final_confirmation',
        label: 'Owner final go-live confirmation recorded',
        passed: false,
        requiredBeforeLive: true
      },
      {
        id: 'live_order_endpoint_enabled',
        label: 'Live order endpoint enabled',
        passed: false,
        requiredBeforeLive: true,
        note: 'No live order endpoint exists in this build.'
      }
    ],
    failures: Array.from(new Set([...blockingFailures, ...reviewFailures])),
    blockingFailures,
    reviewFailures,
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      goLiveAllowed: false,
      note: 'This draft cannot place orders, load credentials, or enable live execution.'
    },
    generatedAt: new Date().toISOString()
  };
}

function buildBotAutomationCapabilityPath({
  plans = [],
  runs = [],
  schedules = [],
  generatedAt = new Date().toISOString()
} = {}) {
  const activePlans = plans.filter(plan => plan.status !== 'archived');
  const paperPlans = activePlans.filter(plan => plan.mode === 'paper');
  const readyPaperPlans = paperPlans.filter(plan => (plan.readiness?.status || plan.status) === 'ready_for_paper');
  const liveDisabledPlans = activePlans.filter(plan => plan.mode === 'live_disabled');
  const activeSchedules = schedules.filter(schedule => schedule.status === 'active');
  const pausedSchedules = schedules.filter(schedule => schedule.status === 'paused');
  const latestRun = runs[0] || null;

  return {
    status: readyPaperPlans.length && activeSchedules.length
      ? 'paper_automation_active'
      : readyPaperPlans.length
        ? 'paper_automation_ready'
        : 'paper_automation_setup_needed',
    localOnly: true,
    generatedAt,
    paperAutomation: {
      enabled: true,
      canRunAutomatically: activeSchedules.length > 0,
      scheduleWorkerEnabled: true,
      routeBoundary: 'monitor_only_no_live_orders',
      counts: {
        activePlans: activePlans.length,
        paperPlans: paperPlans.length,
        readyPaperPlans: readyPaperPlans.length,
        activeSchedules: activeSchedules.length,
        pausedSchedules: pausedSchedules.length,
        paperRuns: runs.length
      },
      latestRun: latestRun
        ? {
          id: latestRun.id,
          status: latestRun.status,
          decision: latestRun.result?.decision?.action || latestRun.decision || 'unknown',
          createdAt: latestRun.created_at
        }
        : null,
      ownerAction: activeSchedules.length
        ? 'Review active paper schedules, latest paper run, and safety dossier exports before changing any plan.'
        : 'Create or activate a paper schedule from a ready paper plan to run local automated paper cycles.'
    },
    futureLiveAutomation: {
      enabled: false,
      goLiveAllowed: false,
      liveExecutionEnabled: false,
      liveOrderEndpointEnabled: false,
      liveDisabledPlanCount: liveDisabledPlans.length,
      blockedGates: [
        'credential_loader_implemented',
        'live_order_adapter_implemented',
        'live_order_endpoint_enabled',
        'owner_go_live_command_accepted'
      ],
      ownerAction: 'Use live-disabled plans only for review. Future live automation still requires separate implementation and verification.'
    },
    evidence: {
      availableExports: [
        'filtered_bot_plans_json_csv',
        'filtered_paper_runs_json_csv',
        'filtered_paper_schedules_json_csv',
        'bot_safety_dossier_json',
        'bot_safety_dossier_history_csv'
      ],
      localOnly: true
    }
  };
}

function parseBotAutomationPlan(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    strategy_id: row.strategy_id,
    paper_session_id: row.paper_session_id,
    risk_profile_id: row.risk_profile_id,
    connector_id: row.connector_id,
    name: row.name,
    mode: row.mode,
    status: row.status,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe,
    readiness: JSON.parse(row.readiness_json || '{}'),
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    strategy_name: row.strategy_name,
    paper_session_name: row.paper_session_name,
    risk_profile_name: row.risk_profile_name,
    connector_label: row.connector_label,
    exchange_name: row.exchange_name,
    connector_mode: row.connector_mode,
    connector_status: row.connector_status
  };
}

function parseBotAutomationRun(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    plan_id: row.plan_id,
    strategy_id: row.strategy_id,
    market_data_import_id: row.market_data_import_id,
    mode: row.mode,
    status: row.status,
    decision: row.decision,
    result: JSON.parse(row.result_json || '{}'),
    created_at: row.created_at,
    plan_name: row.plan_name,
    strategy_name: row.strategy_name,
    market_import_label: row.market_import_label
  };
}

function parseBotLiveReadinessEvent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    plan_id: row.plan_id,
    user_id: row.user_id,
    status: row.status,
    readiness: JSON.parse(row.readiness_json || '{}'),
    created_at: row.created_at,
    plan_name: row.plan_name,
    strategy_id: row.strategy_id,
    strategy_name: row.strategy_name,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe
  };
}

function parseBotLiveEnablementReview(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    plan_id: row.plan_id,
    user_id: row.user_id,
    status: row.status,
    review: JSON.parse(row.review_json || '{}'),
    created_at: row.created_at,
    updated_at: row.updated_at,
    plan_name: row.plan_name,
    strategy_id: row.strategy_id,
    strategy_name: row.strategy_name,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe
  };
}

function parseBotAutomationSchedule(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    plan_id: row.plan_id,
    interval_minutes: row.interval_minutes,
    status: row.status,
    settings: JSON.parse(row.settings_json || '{}'),
    last_run_id: row.last_run_id,
    last_run_at: row.last_run_at,
    next_run_at: row.next_run_at,
    last_error: row.last_error,
    created_at: row.created_at,
    updated_at: row.updated_at,
    plan_name: row.plan_name,
    strategy_id: row.strategy_id,
    strategy_name: row.strategy_name,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe
  };
}

module.exports = {
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
};
