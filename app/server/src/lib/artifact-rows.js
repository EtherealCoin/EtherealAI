const ARTIFACT_TYPES = new Set([
  'all',
  'task',
  'file proposal',
  'command run',
  'checkpoint',
  'backtest',
  'paper session',
  'optimization sweep',
  'split test',
  'walk forward test',
  'decision log',
  'market import',
  'market provider',
  'refresh schedule',
  'refresh run',
  'exchange connector',
  'exchange connector readiness event',
  'exchange adapter contract event',
  'local secret reference',
  'risk profile',
  'risk profile audit event',
  'bot live-readiness event',
  'bot live enablement review',
  'bot automation plan',
  'bot automation run',
  'bot automation schedule',
  'order intent',
  'solidity contract',
  'social post'
]);

const ARTIFACT_LINKS = {
  task: item => `/creator#artifact=task:${item.id}`,
  'file proposal': item => `/creator#artifact=file-proposal:${item.id}`,
  'command run': item => `/creator#artifact=command-run:${item.id}`,
  checkpoint: item => `/creator#artifact=checkpoint:${item.id}`,
  backtest: item => `/strategy-lab#artifact=backtest:${item.id}`,
  'paper session': item => `/strategy-lab#artifact=paper-session:${item.id}`,
  'optimization sweep': item => `/strategy-lab#artifact=optimization-sweep:${item.id}`,
  'split test': item => `/strategy-lab#artifact=split-test:${item.id}`,
  'walk forward test': item => `/strategy-lab#artifact=walk-forward-test:${item.id}`,
  'decision log': item => `/strategy-lab#artifact=decision-log:${item.id}`,
  'market import': item => `/strategy-lab#artifact=market-import:${item.id}`,
  'market provider': item => `/strategy-lab#artifact=market-provider:${item.id}`,
  'refresh schedule': item => `/strategy-lab#artifact=refresh-schedule:${item.id}`,
  'refresh run': item => `/strategy-lab#artifact=refresh-run:${item.id}`,
  'exchange connector': item => `/strategy-lab#artifact=exchange-connector:${item.id}`,
  'exchange connector readiness event': item => `/strategy-lab#artifact=exchange-connector-readiness-event:${item.id}`,
  'exchange adapter contract event': item => `/strategy-lab#artifact=exchange-adapter-contract-event:${item.id}`,
  'local secret reference': item => `/strategy-lab#artifact=local-secret-reference:${item.id}`,
  'risk profile': item => `/strategy-lab#artifact=risk-profile:${item.id}`,
  'risk profile audit event': item => `/strategy-lab#artifact=risk-profile-audit-event:${item.id}`,
  'bot live-readiness event': item => `/strategy-lab#artifact=bot-live-readiness-event:${item.id}`,
  'bot live enablement review': item => `/strategy-lab#artifact=bot-live-enablement-review:${item.id}`,
  'bot automation plan': item => `/strategy-lab#artifact=bot-automation-plan:${item.id}`,
  'bot automation run': item => `/strategy-lab#artifact=bot-automation-run:${item.id}`,
  'bot automation schedule': item => `/strategy-lab#artifact=bot-automation-schedule:${item.id}`,
  'order intent': item => `/strategy-lab#artifact=order-intent:${item.id}`,
  'solidity contract': item => `/solidity-lab#artifact=solidity-contract:${item.id}`,
  'social post': item => `/social-ops#artifact=social-post:${item.id}`
};

function normalizeArtifactType(value = 'all') {
  const normalized = String(value || 'all').trim().toLowerCase();

  return ARTIFACT_TYPES.has(normalized) ? normalized : 'all';
}

function createArtifactRow(type, item) {
  const href = ARTIFACT_LINKS[type]?.(item);

  if (type === 'task') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.title}`,
      detail: `${item.category} · ${item.status}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'file proposal') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.relative_path}`,
      detail: `${item.status} · ${item.task_title || 'No task'} · ${item.workspace_name || 'No workspace'}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'command run') {
    return {
      type,
      id: item.id,
      title: `Run #${item.id} · ${item.command || 'unknown command'}`,
      detail: `${item.status} · exit ${item.exit_code} · ${item.task_title || 'No task'}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'checkpoint') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.note || 'Checkpoint'}`,
      detail: `${item.task_title || 'No task'} · ${item.git_status?.branch || 'unknown branch'}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'backtest') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.strategy_name || 'Strategy'}`,
      detail: `${item.market_symbol || ''} · ${item.result?.mode || item.status} · return ${item.result?.metrics?.totalReturnPercent ?? '-'}%`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'paper session') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.name}`,
      detail: `${item.market_symbol || ''} · ${item.mode} · equity ${item.current_equity}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'optimization sweep') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.name}`,
      detail: `${item.market_symbol || ''} · ${item.result?.summary?.totalRunCount || 0} runs · best ${item.result?.summary?.bestReturnPercent ?? '-'}%`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'split test') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.name}`,
      detail: `${item.market_symbol || ''} · ${item.result?.summary?.stability || 'unknown'} · out ${item.result?.summary?.outOfSampleReturnPercent ?? '-'}%`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'walk forward test') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.name}`,
      detail: `${item.market_symbol || ''} · ${item.result?.summary?.status || 'unknown'} · ${item.result?.summary?.windowCount || 0} windows`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'decision log') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.decision} ${item.market_symbol}`,
      detail: `${item.reason} · ${item.candle_timestamp} · ${item.strategy_name || 'Strategy'}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'exchange connector') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.label}`,
      detail: `${item.exchange_name} · ${item.mode} · ${item.status}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'exchange connector readiness event') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.connector_label || 'Connector readiness'}`,
      detail: `${item.status} · ${item.exchange_name || 'exchange'} · connector #${item.connector_id}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'exchange adapter contract event') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.connector_label || 'Adapter contract'}`,
      detail: `${item.status} · ${item.exchange_name || 'exchange'} · connector #${item.connector_id}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'local secret reference') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.label}`,
      detail: `${item.provider_type} · ${item.scope} · ${item.status}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'market provider') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.label}`,
      detail: `${item.provider_name} · ${item.provider_type} · ${item.status}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'refresh schedule') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.label}`,
      detail: `${item.market_symbol} ${item.timeframe} · ${item.status} · next ${item.next_run_at || '-'}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'refresh run') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.schedule_label || 'Market refresh'}`,
      detail: `${item.trigger_type} · ${item.status} · job ${item.import_job_id ? `#${item.import_job_id}` : '-'}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'risk profile') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.name}`,
      detail: `${item.mode} · ${item.status} · max order ${item.max_order_value} · kill ${item.kill_switch_enabled ? 'on' : 'off'}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'risk profile audit event') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.event_type} risk #${item.risk_profile_id}`,
      detail: `${item.summary} · ${item.risk_profile_name || 'Risk profile'}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'order intent') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.side} ${item.market_symbol}`,
      detail: `${item.order_type} · qty ${item.quantity} · ${item.status}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'bot automation plan') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.name}`,
      detail: `${item.market_symbol} ${item.timeframe} · ${item.mode} · ${item.readiness?.status || item.status}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'bot automation run') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.plan_name || 'Bot paper run'}`,
      detail: `${item.decision} · ${item.status} · ${item.result?.data?.marketSymbol || ''}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'bot automation schedule') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.plan_name || 'Bot schedule'}`,
      detail: `${item.status} · every ${item.interval_minutes}m · next ${item.next_run_at || '-'}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'bot live-readiness event') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.plan_name || 'Live-readiness preflight'}`,
      detail: `${item.status} · plan #${item.plan_id} · ${item.market_symbol || ''}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'bot live enablement review') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.plan_name || 'Go-live enablement review'}`,
      detail: `${item.status} · plan #${item.plan_id} · live disabled`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'solidity contract') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.name}`,
      detail: `${item.contract_type} · ${item.network} · ${item.status}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  if (type === 'social post') {
    return {
      type,
      id: item.id,
      title: `#${item.id} ${item.platform}`,
      detail: `${item.status} · ${(item.content || '').slice(0, 90)}`,
      created: item.created_at,
      href,
      raw: item
    };
  }

  return {
    type,
    id: item.id,
    title: `#${item.id} ${item.label || item.market_symbol}`,
    detail: `${item.market_symbol} ${item.timeframe} · ${item.summary?.candleCount || item.candle_count} candles · quality ${item.quality_score ?? item.summary?.qualityScore ?? '-'}`,
    created: item.created_at,
    href,
    raw: item
  };
}

function filterArtifactRows(rows, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();

  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter(row => [
    row.type,
    row.title,
    row.detail,
    row.created,
    JSON.stringify(row.raw)
  ].join(' ').toLowerCase().includes(normalizedQuery));
}

module.exports = {
  ARTIFACT_TYPES,
  ARTIFACT_LINKS,
  normalizeArtifactType,
  createArtifactRow,
  filterArtifactRows
};
