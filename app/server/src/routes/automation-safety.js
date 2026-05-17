function registerAutomationSafetyRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  readSecretProviderCapabilities,
  getExchangeAdapterScaffolds,
  selects,
  parsers
}) {
  app.get('/api/v1/automation-safety-summary', requireAuth, async (req, res) => {
    try {
      const [
        botPlanCounts,
        botScheduleCounts,
        riskProfileCounts,
        killSwitchCount,
        killSwitchAffectedBotPlanCount,
        connectorReadinessCounts,
        adapterContractCounts,
        liveEnablementCounts,
        recentBotPlans,
        recentConnectorReadiness,
        recentAdapterContracts,
        recentLiveReviews,
        recentRiskProfiles,
        recentKillSwitchAffectedBotPlans
      ] = await Promise.all([
        dbAll('SELECT status, mode, COUNT(*) AS count FROM bot_automation_plans GROUP BY status, mode'),
        dbAll('SELECT status, COUNT(*) AS count FROM bot_automation_schedules GROUP BY status'),
        dbAll('SELECT status, mode, COUNT(*) AS count FROM risk_profiles GROUP BY status, mode'),
        dbGet("SELECT COUNT(*) AS count FROM risk_profiles WHERE kill_switch_enabled = 1 AND status != 'archived'"),
        dbGet(
          `SELECT COUNT(*) AS count
           FROM bot_automation_plans
           LEFT JOIN risk_profiles ON risk_profiles.id = bot_automation_plans.risk_profile_id
           WHERE bot_automation_plans.status != 'archived'
             AND risk_profiles.kill_switch_enabled = 1
             AND risk_profiles.status != 'archived'`
        ),
        dbAll('SELECT status, COUNT(*) AS count FROM exchange_connector_readiness_events GROUP BY status'),
        dbAll('SELECT status, COUNT(*) AS count FROM exchange_adapter_contract_events GROUP BY status'),
        dbAll('SELECT status, COUNT(*) AS count FROM bot_live_enablement_reviews GROUP BY status'),
        dbAll(
          `${selects.botAutomationPlan}
           ORDER BY bot_automation_plans.updated_at DESC, bot_automation_plans.id DESC
           LIMIT 5`
        ),
        dbAll(
          `${selects.exchangeConnectorReadinessEvent}
           ORDER BY exchange_connector_readiness_events.created_at DESC, exchange_connector_readiness_events.id DESC
           LIMIT 5`
        ),
        dbAll(
          `${selects.exchangeAdapterContractEvent}
           ORDER BY exchange_adapter_contract_events.created_at DESC, exchange_adapter_contract_events.id DESC
           LIMIT 5`
        ),
        dbAll(
          `${selects.botLiveEnablementReview}
           ORDER BY bot_live_enablement_reviews.updated_at DESC, bot_live_enablement_reviews.id DESC
           LIMIT 5`
        ),
        dbAll('SELECT * FROM risk_profiles ORDER BY updated_at DESC LIMIT 5'),
        dbAll(
          `${selects.botAutomationPlan}
           LEFT JOIN risk_profiles AS safety_risk_profiles ON safety_risk_profiles.id = bot_automation_plans.risk_profile_id
           WHERE bot_automation_plans.status != 'archived'
             AND safety_risk_profiles.kill_switch_enabled = 1
             AND safety_risk_profiles.status != 'archived'
           ORDER BY bot_automation_plans.updated_at DESC, bot_automation_plans.id DESC
           LIMIT 10`
        )
      ]);

      res.json({
        summary: {
          generatedAt: new Date().toISOString(),
          liveExecution: {
            enabled: false,
            orderEndpointEnabled: false,
            goLiveAllowed: false,
            note: 'Automation Safety Center is monitor-only. No live exchange order route exists.'
          },
          counts: {
            botPlans: botPlanCounts,
            botSchedules: botScheduleCounts,
            riskProfiles: riskProfileCounts,
            activeKillSwitches: killSwitchCount.count,
            activeKillSwitchAffectedBotPlans: killSwitchAffectedBotPlanCount.count,
            connectorReadinessEvents: connectorReadinessCounts,
            adapterContractEvents: adapterContractCounts,
            liveEnablementReviews: liveEnablementCounts
          },
          recent: {
            botPlans: recentBotPlans.map(parsers.parseBotAutomationPlan),
            connectorReadinessEvents: recentConnectorReadiness.map(parsers.parseExchangeConnectorReadinessEvent),
            adapterContractEvents: recentAdapterContracts.map(parsers.parseExchangeAdapterContractEvent),
            liveEnablementReviews: recentLiveReviews.map(parsers.parseBotLiveEnablementReview),
            riskProfiles: recentRiskProfiles.map(parsers.parseRiskProfile),
            killSwitchAffectedBotPlans: recentKillSwitchAffectedBotPlans.map(parsers.parseBotAutomationPlan)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/automation-safety-history', requireAuth, async (req, res) => {
    try {
      const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 90);
      const windowParam = `-${days} days`;
      const [
        botPlanStatusUpdates,
        connectorReadinessEvents,
        adapterContractEvents,
        liveEnablementReviews,
        riskAuditEvents
      ] = await Promise.all([
        dbAll(
          `SELECT date(updated_at) AS day, status, mode, COUNT(*) AS count
           FROM bot_automation_plans
           WHERE updated_at >= datetime('now', ?)
           GROUP BY day, status, mode
           ORDER BY day DESC, status ASC, mode ASC`,
          [windowParam]
        ),
        dbAll(
          `SELECT date(created_at) AS day, status, COUNT(*) AS count
           FROM exchange_connector_readiness_events
           WHERE created_at >= datetime('now', ?)
           GROUP BY day, status
           ORDER BY day DESC, status ASC`,
          [windowParam]
        ),
        dbAll(
          `SELECT date(created_at) AS day, status, COUNT(*) AS count
           FROM exchange_adapter_contract_events
           WHERE created_at >= datetime('now', ?)
           GROUP BY day, status
           ORDER BY day DESC, status ASC`,
          [windowParam]
        ),
        dbAll(
          `SELECT date(updated_at) AS day, status, COUNT(*) AS count
           FROM bot_live_enablement_reviews
           WHERE updated_at >= datetime('now', ?)
           GROUP BY day, status
           ORDER BY day DESC, status ASC`,
          [windowParam]
        ),
        dbAll(
          `SELECT date(created_at) AS day, event_type, COUNT(*) AS count
           FROM risk_profile_audit_events
           WHERE created_at >= datetime('now', ?)
           GROUP BY day, event_type
           ORDER BY day DESC, event_type ASC`,
          [windowParam]
        )
      ]);

      res.json({
        history: {
          generatedAt: new Date().toISOString(),
          windowDays: days,
          liveExecution: {
            enabled: false,
            orderEndpointEnabled: false,
            goLiveAllowed: false,
            note: 'Safety history is monitor-only. It cannot enable live execution.'
          },
          series: {
            botPlanStatusUpdates,
            connectorReadinessEvents,
            adapterContractEvents,
            liveEnablementReviews,
            riskAuditEvents
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/launch-readiness-summary', requireAuth, async (req, res) => {
    try {
      const secretProviderCapabilities = readSecretProviderCapabilities();
      const adapterScaffolds = getExchangeAdapterScaffolds();
      const [
        liveDisabledPlans,
        activeKillSwitches,
        killSwitchAffectedBotPlans,
        recentLiveReviews,
        recentConnectorReadiness,
        recentAdapterContracts
      ] = await Promise.all([
        dbAll(
          `${selects.botAutomationPlan}
           WHERE bot_automation_plans.mode = 'live_disabled'
             AND bot_automation_plans.status != 'archived'
           ORDER BY bot_automation_plans.updated_at DESC, bot_automation_plans.id DESC
           LIMIT 10`
        ),
        dbAll(
          `SELECT *
           FROM risk_profiles
           WHERE kill_switch_enabled = 1
             AND status != 'archived'
           ORDER BY updated_at DESC, id DESC
           LIMIT 10`
        ),
        dbAll(
          `${selects.botAutomationPlan}
           LEFT JOIN risk_profiles AS launch_risk_profiles ON launch_risk_profiles.id = bot_automation_plans.risk_profile_id
           WHERE bot_automation_plans.status != 'archived'
             AND launch_risk_profiles.kill_switch_enabled = 1
             AND launch_risk_profiles.status != 'archived'
           ORDER BY bot_automation_plans.updated_at DESC, bot_automation_plans.id DESC
           LIMIT 10`
        ),
        dbAll(
          `${selects.botLiveEnablementReview}
           ORDER BY bot_live_enablement_reviews.updated_at DESC, bot_live_enablement_reviews.id DESC
           LIMIT 25`
        ),
        dbAll(
          `${selects.exchangeConnectorReadinessEvent}
           ORDER BY exchange_connector_readiness_events.created_at DESC, exchange_connector_readiness_events.id DESC
           LIMIT 10`
        ),
        dbAll(
          `${selects.exchangeAdapterContractEvent}
           ORDER BY exchange_adapter_contract_events.created_at DESC, exchange_adapter_contract_events.id DESC
           LIMIT 10`
        )
      ]);
      const parsedLiveReviews = recentLiveReviews.map(parsers.parseBotLiveEnablementReview);
      const goLiveCommandReviews = parsedLiveReviews.filter(review => Boolean(review.review?.ownerCommand));
      const addGate = (gates, gate) => {
        gates.push({
          severity: 'block',
          metric: null,
          threshold: null,
          note: '',
          ...gate,
          passed: Boolean(gate.passed)
        });
      };
      const gates = [];

      addGate(gates, {
        id: 'secret_provider_manifest_present',
        label: 'Local secret-provider manifest present',
        severity: 'review',
        passed: secretProviderCapabilities.providers.length > 0,
        metric: `${secretProviderCapabilities.providers.length} provider(s)`,
        threshold: 'at least one provider capability'
      });
      addGate(gates, {
        id: 'secret_values_not_accepted',
        label: 'Secret values are not accepted here',
        severity: 'review',
        passed: secretProviderCapabilities.secretValuesAccepted === false
          && secretProviderCapabilities.databaseStoresSecretValues === false,
        metric: 'metadata only',
        threshold: 'no secret values accepted or stored'
      });
      addGate(gates, {
        id: 'credential_loader_implemented',
        label: 'Runtime credential loader implemented',
        passed: false,
        metric: 'not implemented',
        threshold: 'reviewed local-only loader with no secret logging'
      });
      addGate(gates, {
        id: 'adapter_scaffolds_present',
        label: 'Disabled adapter scaffolds present',
        severity: 'review',
        passed: adapterScaffolds.length > 0,
        metric: `${adapterScaffolds.length} scaffold(s)`,
        threshold: 'tracked disabled scaffolds'
      });
      addGate(gates, {
        id: 'adapter_scaffolds_disabled',
        label: 'Adapter scaffolds are disabled',
        severity: 'review',
        passed: adapterScaffolds.every(scaffold => (
          scaffold.implemented === false
          && scaffold.networkCallsEnabled === false
          && scaffold.credentialLoadingEnabled === false
          && scaffold.liveExecution?.enabled === false
        )),
        metric: 'disabled/no network',
        threshold: 'no scaffold may load credentials or call exchanges'
      });
      addGate(gates, {
        id: 'live_order_adapter_implemented',
        label: 'Live order adapter implemented',
        passed: false,
        metric: 'not implemented',
        threshold: 'reviewed adapter implementation and verifier coverage'
      });
      addGate(gates, {
        id: 'live_order_endpoint_enabled',
        label: 'Live order endpoint enabled',
        passed: false,
        metric: 'disabled',
        threshold: 'future reviewed enablement only'
      });
      addGate(gates, {
        id: 'active_kill_switches_clear',
        label: 'No active kill switches',
        passed: activeKillSwitches.length === 0,
        metric: `${activeKillSwitches.length} active kill switch(es)`,
        threshold: '0 active kill switches'
      });
      addGate(gates, {
        id: 'owner_go_live_command_accepted',
        label: 'Owner go-live command accepted for execution',
        passed: false,
        metric: goLiveCommandReviews.length ? `${goLiveCommandReviews.length} blocked command review(s)` : 'not accepted',
        threshold: 'future reviewed enable flow',
        note: 'Owner command text can be recognized and audited, but this build refuses execution.'
      });

      const blockingFailures = gates.filter(gate => !gate.passed && gate.severity === 'block').map(gate => gate.id);
      const reviewFailures = gates.filter(gate => !gate.passed && gate.severity !== 'block').map(gate => gate.id);

      res.json({
        summary: {
          generatedAt: new Date().toISOString(),
          stage: 'launch_readiness_monitor',
          launchStatus: 'blocked',
          automationScope: 'monitor_only_no_live_execution',
          liveExecution: {
            enabled: false,
            orderEndpointEnabled: false,
            goLiveAllowed: false,
            note: 'Launch Readiness is blocked. No credential loader, live adapter, or order endpoint is enabled.'
          },
          gates,
          blockingFailures,
          reviewFailures,
          counts: {
            liveDisabledPlans: liveDisabledPlans.length,
            activeKillSwitches: activeKillSwitches.length,
            killSwitchAffectedBotPlans: killSwitchAffectedBotPlans.length,
            secretProviderCapabilities: secretProviderCapabilities.providers.length,
            disabledAdapterScaffolds: adapterScaffolds.length,
            recentGoLiveReviews: parsedLiveReviews.length,
            recentGoLiveCommandReviews: goLiveCommandReviews.length
          },
          capabilities: {
            secretProviders: secretProviderCapabilities.providers,
            adapterScaffolds
          },
          recent: {
            liveDisabledPlans: liveDisabledPlans.map(parsers.parseBotAutomationPlan),
            activeKillSwitches: activeKillSwitches.map(parsers.parseRiskProfile),
            killSwitchAffectedBotPlans: killSwitchAffectedBotPlans.map(parsers.parseBotAutomationPlan),
            goLiveReviews: parsedLiveReviews.slice(0, 10),
            goLiveCommandReviews: goLiveCommandReviews.slice(0, 10),
            connectorReadinessEvents: recentConnectorReadiness.map(parsers.parseExchangeConnectorReadinessEvent),
            adapterContractEvents: recentAdapterContracts.map(parsers.parseExchangeAdapterContractEvent)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerAutomationSafetyRoutes
};
