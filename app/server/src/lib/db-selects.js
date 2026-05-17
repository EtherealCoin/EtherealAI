const EXCHANGE_CONNECTOR_SELECT = `
  SELECT exchange_connectors.*, local_secret_references.label AS secret_reference_label,
         local_secret_references.status AS secret_reference_status,
         local_secret_references.provider_type AS secret_reference_provider_type,
         local_secret_references.reference_name AS secret_reference_name,
         local_secret_references.scope AS secret_reference_scope
  FROM exchange_connectors
  LEFT JOIN local_secret_references ON local_secret_references.id = exchange_connectors.secret_reference_id
`;

const EXCHANGE_CONNECTOR_READINESS_EVENT_SELECT = `
  SELECT exchange_connector_readiness_events.*, exchange_connectors.label AS connector_label,
         exchange_connectors.exchange_name, exchange_connectors.mode AS connector_mode,
         exchange_connectors.status AS connector_status
  FROM exchange_connector_readiness_events
  LEFT JOIN exchange_connectors ON exchange_connectors.id = exchange_connector_readiness_events.connector_id
`;

const EXCHANGE_ADAPTER_CONTRACT_EVENT_SELECT = `
  SELECT exchange_adapter_contract_events.*, exchange_connectors.label AS connector_label,
         exchange_connectors.exchange_name, exchange_connectors.mode AS connector_mode,
         exchange_connectors.status AS connector_status
  FROM exchange_adapter_contract_events
  LEFT JOIN exchange_connectors ON exchange_connectors.id = exchange_adapter_contract_events.connector_id
`;

const BOT_AUTOMATION_PLAN_SELECT = `
  SELECT bot_automation_plans.*, trading_strategies.name AS strategy_name,
         paper_trading_sessions.name AS paper_session_name,
         risk_profiles.name AS risk_profile_name,
         exchange_connectors.label AS connector_label,
         exchange_connectors.exchange_name,
         exchange_connectors.mode AS connector_mode,
         exchange_connectors.status AS connector_status
  FROM bot_automation_plans
  LEFT JOIN trading_strategies ON trading_strategies.id = bot_automation_plans.strategy_id
  LEFT JOIN paper_trading_sessions ON paper_trading_sessions.id = bot_automation_plans.paper_session_id
  LEFT JOIN risk_profiles ON risk_profiles.id = bot_automation_plans.risk_profile_id
  LEFT JOIN exchange_connectors ON exchange_connectors.id = bot_automation_plans.connector_id
`;

const BOT_AUTOMATION_RUN_SELECT = `
  SELECT bot_automation_runs.*, bot_automation_plans.name AS plan_name,
         trading_strategies.name AS strategy_name,
         market_data_imports.label AS market_import_label
  FROM bot_automation_runs
  LEFT JOIN bot_automation_plans ON bot_automation_plans.id = bot_automation_runs.plan_id
  LEFT JOIN trading_strategies ON trading_strategies.id = bot_automation_runs.strategy_id
  LEFT JOIN market_data_imports ON market_data_imports.id = bot_automation_runs.market_data_import_id
`;

const BOT_LIVE_READINESS_EVENT_SELECT = `
  SELECT bot_live_readiness_events.*, bot_automation_plans.name AS plan_name,
         bot_automation_plans.strategy_id AS strategy_id,
         bot_automation_plans.market_symbol AS market_symbol,
         bot_automation_plans.timeframe AS timeframe,
         trading_strategies.name AS strategy_name
  FROM bot_live_readiness_events
  LEFT JOIN bot_automation_plans ON bot_automation_plans.id = bot_live_readiness_events.plan_id
  LEFT JOIN trading_strategies ON trading_strategies.id = bot_automation_plans.strategy_id
`;

const BOT_LIVE_ENABLEMENT_REVIEW_SELECT = `
  SELECT bot_live_enablement_reviews.*, bot_automation_plans.name AS plan_name,
         bot_automation_plans.strategy_id AS strategy_id,
         bot_automation_plans.market_symbol AS market_symbol,
         bot_automation_plans.timeframe AS timeframe,
         trading_strategies.name AS strategy_name
  FROM bot_live_enablement_reviews
  LEFT JOIN bot_automation_plans ON bot_automation_plans.id = bot_live_enablement_reviews.plan_id
  LEFT JOIN trading_strategies ON trading_strategies.id = bot_automation_plans.strategy_id
`;

const BOT_AUTOMATION_SCHEDULE_SELECT = `
  SELECT bot_automation_schedules.*, bot_automation_plans.name AS plan_name,
         bot_automation_plans.strategy_id AS strategy_id,
         bot_automation_plans.market_symbol AS market_symbol,
         bot_automation_plans.timeframe AS timeframe,
         trading_strategies.name AS strategy_name
  FROM bot_automation_schedules
  LEFT JOIN bot_automation_plans ON bot_automation_plans.id = bot_automation_schedules.plan_id
  LEFT JOIN trading_strategies ON trading_strategies.id = bot_automation_plans.strategy_id
`;

module.exports = {
  EXCHANGE_CONNECTOR_SELECT,
  EXCHANGE_CONNECTOR_READINESS_EVENT_SELECT,
  EXCHANGE_ADAPTER_CONTRACT_EVENT_SELECT,
  BOT_AUTOMATION_PLAN_SELECT,
  BOT_AUTOMATION_RUN_SELECT,
  BOT_LIVE_READINESS_EVENT_SELECT,
  BOT_LIVE_ENABLEMENT_REVIEW_SELECT,
  BOT_AUTOMATION_SCHEDULE_SELECT
};
