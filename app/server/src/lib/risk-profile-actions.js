function createRiskProfileActionsRuntime({
  dbAll,
  dbRun,
  parseBotAutomationPlan,
  loadBotAutomationReadinessContext,
  evaluateBotAutomationReadiness,
  getBotAutomationPlanRow,
  botAutomationPlanSelect
}) {
  async function saveRiskProfileAuditEvent({
    riskProfileId,
    userId = null,
    eventType,
    summary,
    beforeProfile = null,
    afterProfile = null,
    metadata = {}
  }) {
    await dbRun(
      `INSERT INTO risk_profile_audit_events
       (risk_profile_id, user_id, event_type, summary, before_json, after_json, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        riskProfileId,
        userId,
        eventType,
        summary,
        beforeProfile ? JSON.stringify(beforeProfile) : null,
        afterProfile ? JSON.stringify(afterProfile) : null,
        JSON.stringify(metadata || {})
      ]
    );
  }

  async function refreshBotPlansForRiskProfile(riskProfileId) {
    const rows = await dbAll(
      `${botAutomationPlanSelect}
       WHERE bot_automation_plans.risk_profile_id = ?
         AND bot_automation_plans.status != 'archived'
       ORDER BY bot_automation_plans.updated_at DESC, bot_automation_plans.id DESC`,
      [riskProfileId]
    );
    const updatedPlans = [];

    for (const row of rows) {
      const plan = parseBotAutomationPlan(row);
      const context = await loadBotAutomationReadinessContext(
        plan.strategy_id,
        plan.risk_profile_id,
        plan.paper_session_id,
        plan.connector_id
      );
      const readiness = evaluateBotAutomationReadiness({
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector,
        mode: plan.mode
      });

      await dbRun(
        `UPDATE bot_automation_plans
         SET status = ?, readiness_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [readiness.status, JSON.stringify(readiness), plan.id]
      );
      updatedPlans.push(parseBotAutomationPlan(await getBotAutomationPlanRow(plan.id)));
    }

    return updatedPlans;
  }

  return {
    saveRiskProfileAuditEvent,
    refreshBotPlansForRiskProfile
  };
}

module.exports = {
  createRiskProfileActionsRuntime
};
