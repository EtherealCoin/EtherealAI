function createDbRowLookupRuntime({ dbGet, selects }) {
  async function getExchangeConnectorRow(id) {
    return dbGet(
      `${selects.exchangeConnector}
       WHERE exchange_connectors.id = ?`,
      [id]
    );
  }

  async function getExchangeConnectorReadinessEventRow(id) {
    return dbGet(
      `${selects.exchangeConnectorReadinessEvent}
       WHERE exchange_connector_readiness_events.id = ?`,
      [id]
    );
  }

  async function getExchangeAdapterContractEventRow(id) {
    return dbGet(
      `${selects.exchangeAdapterContractEvent}
       WHERE exchange_adapter_contract_events.id = ?`,
      [id]
    );
  }

  async function getBotAutomationPlanRow(id) {
    return dbGet(
      `${selects.botAutomationPlan}
       WHERE bot_automation_plans.id = ?`,
      [id]
    );
  }

  async function getBotAutomationScheduleRow(id) {
    return dbGet(
      `${selects.botAutomationSchedule}
       WHERE bot_automation_schedules.id = ?`,
      [id]
    );
  }

  async function getBotAutomationRunRow(id) {
    return dbGet(
      `${selects.botAutomationRun}
       WHERE bot_automation_runs.id = ?`,
      [id]
    );
  }

  async function getBotLiveReadinessEventRow(id) {
    return dbGet(
      `${selects.botLiveReadinessEvent}
       WHERE bot_live_readiness_events.id = ?`,
      [id]
    );
  }

  async function getBotLiveEnablementReviewRow(id) {
    return dbGet(
      `${selects.botLiveEnablementReview}
       WHERE bot_live_enablement_reviews.id = ?`,
      [id]
    );
  }

  return {
    getExchangeConnectorRow,
    getExchangeConnectorReadinessEventRow,
    getExchangeAdapterContractEventRow,
    getBotAutomationPlanRow,
    getBotAutomationScheduleRow,
    getBotAutomationRunRow,
    getBotLiveReadinessEventRow,
    getBotLiveEnablementReviewRow
  };
}

module.exports = {
  createDbRowLookupRuntime
};
