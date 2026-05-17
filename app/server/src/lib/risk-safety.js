function getPositiveNumber(value, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function roundNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function parseRiskProfile(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    mode: row.mode,
    max_order_value: row.max_order_value,
    max_position_value: row.max_position_value,
    max_daily_loss: row.max_daily_loss,
    max_open_trades: row.max_open_trades,
    kill_switch_enabled: Boolean(row.kill_switch_enabled),
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function parseRiskProfileAuditEvent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    risk_profile_id: row.risk_profile_id,
    user_id: row.user_id,
    event_type: row.event_type,
    summary: row.summary,
    before: row.before_json ? JSON.parse(row.before_json) : null,
    after: row.after_json ? JSON.parse(row.after_json) : null,
    metadata: JSON.parse(row.metadata_json || '{}'),
    created_at: row.created_at,
    risk_profile_name: row.risk_profile_name
  };
}

function parseOrderIntent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    connector_id: row.connector_id,
    risk_profile_id: row.risk_profile_id,
    strategy_id: row.strategy_id,
    paper_session_id: row.paper_session_id,
    market_symbol: row.market_symbol,
    side: row.side,
    order_type: row.order_type,
    quantity: row.quantity,
    limit_price: row.limit_price,
    status: row.status,
    reason: row.reason,
    payload: JSON.parse(row.payload_json || '{}'),
    created_at: row.created_at,
    updated_at: row.updated_at,
    connector_label: row.connector_label,
    exchange_name: row.exchange_name,
    risk_profile_name: row.risk_profile_name,
    strategy_name: row.strategy_name
  };
}

const RISK_PROFILE_AUDIT_FIELDS = [
  'name',
  'mode',
  'status',
  'max_order_value',
  'max_position_value',
  'max_daily_loss',
  'max_open_trades',
  'kill_switch_enabled',
  'notes'
];

function getRiskProfileChangedFields(beforeProfile, afterProfile) {
  if (!beforeProfile || !afterProfile) {
    return [];
  }

  return RISK_PROFILE_AUDIT_FIELDS.filter(field => beforeProfile[field] !== afterProfile[field]);
}

function evaluateOrderIntentRisk(profile, intent) {
  if (!profile) {
    return {
      status: 'review',
      checks: [],
      note: 'No risk profile selected.'
    };
  }

  const notionalValue = Number.isFinite(intent.limitPrice)
    ? intent.quantity * intent.limitPrice
    : null;
  const currentOpenTrades = getPositiveNumber(intent.currentOpenTrades, 0);
  const currentDailyLoss = getPositiveNumber(intent.currentDailyLoss, 0);
  const checks = [
    {
      id: 'profile_active',
      label: 'Risk profile active',
      metric: profile.status,
      threshold: 'active',
      passed: profile.status === 'active'
    },
    {
      id: 'kill_switch',
      label: 'Kill switch is off',
      metric: profile.kill_switch_enabled,
      threshold: false,
      passed: !profile.kill_switch_enabled
    }
  ];

  if (profile.max_order_value > 0) {
    checks.push({
      id: 'max_order_value',
      label: 'Max order value',
      metric: notionalValue,
      threshold: profile.max_order_value,
      passed: notionalValue !== null && notionalValue <= profile.max_order_value
    });
  }

  if (profile.max_position_value > 0) {
    checks.push({
      id: 'max_position_value',
      label: 'Max position value',
      metric: notionalValue,
      threshold: profile.max_position_value,
      passed: notionalValue !== null && notionalValue <= profile.max_position_value
    });
  }

  if (profile.max_daily_loss > 0) {
    checks.push({
      id: 'max_daily_loss',
      label: 'Max daily loss',
      metric: currentDailyLoss,
      threshold: profile.max_daily_loss,
      passed: currentDailyLoss <= profile.max_daily_loss
    });
  }

  if (profile.max_open_trades > 0) {
    checks.push({
      id: 'max_open_trades',
      label: 'Max open trades',
      metric: currentOpenTrades,
      threshold: profile.max_open_trades,
      passed: currentOpenTrades < profile.max_open_trades
    });
  }

  const failures = checks.filter(check => !check.passed);

  return {
    status: failures.length ? 'review' : 'pass',
    profile: {
      id: profile.id,
      name: profile.name,
      mode: profile.mode
    },
    estimatedNotionalValue: notionalValue === null ? null : roundNumber(notionalValue, 8),
    checks,
    failures: failures.map(check => check.id),
    note: 'Draft-order risk review only. This does not place or block live orders.'
  };
}

module.exports = {
  RISK_PROFILE_AUDIT_FIELDS,
  getPositiveNumber,
  parseRiskProfile,
  parseRiskProfileAuditEvent,
  parseOrderIntent,
  getRiskProfileChangedFields,
  evaluateOrderIntentRisk
};
