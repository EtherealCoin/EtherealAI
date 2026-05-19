function registerOwnerSetupWizardRoutes(app, {
  fs,
  requireAuth,
  dbAll,
  parseOwnerWallet,
  parseBotAutomationPlan,
  parseBotAutomationRun,
  parseBotAutomationSchedule,
  parseStrategy,
  parseRiskProfile,
  parsePaperSession,
  parseMarketImport,
  parseExchangeConnector,
  parseLocalSecretReference,
  createBotAutomationPaperRun,
  buildOwnerSetupWizard,
  readOwnerEnvStatus,
  buildOwnerEnvTemplate,
  ownerSecretsDir,
  ownerEnvPath
}) {
  async function loadWizardData(userId) {
    const [
      walletRows,
      planRows,
      runRows,
      scheduleRows,
      strategyRows,
      riskProfileRows,
      paperSessionRows,
      marketImportRows,
      connectorRows,
      secretReferenceRows
    ] = await Promise.all([
      dbAll(
        `SELECT owner_wallets.*
         FROM owner_wallets
         WHERE owner_wallets.user_id = ?
         ORDER BY owner_wallets.updated_at DESC, owner_wallets.id DESC
         LIMIT 100`,
        [userId]
      ),
      dbAll(
        `SELECT bot_automation_plans.*
         FROM bot_automation_plans
         ORDER BY bot_automation_plans.updated_at DESC, bot_automation_plans.id DESC
         LIMIT 100`
      ),
      dbAll(
        `SELECT bot_automation_runs.*
         FROM bot_automation_runs
         ORDER BY bot_automation_runs.created_at DESC, bot_automation_runs.id DESC
         LIMIT 100`
      ),
      dbAll(
        `SELECT bot_automation_schedules.*
         FROM bot_automation_schedules
         ORDER BY bot_automation_schedules.updated_at DESC, bot_automation_schedules.id DESC
         LIMIT 100`
      ),
      dbAll(
        `SELECT *
         FROM trading_strategies
         ORDER BY updated_at DESC, id DESC
         LIMIT 100`
      ),
      dbAll(
        `SELECT *
         FROM risk_profiles
         ORDER BY updated_at DESC, id DESC
         LIMIT 100`
      ),
      dbAll(
        `SELECT paper_trading_sessions.*, trading_strategies.name AS strategy_name
         FROM paper_trading_sessions
         LEFT JOIN trading_strategies ON trading_strategies.id = paper_trading_sessions.strategy_id
         ORDER BY paper_trading_sessions.updated_at DESC, paper_trading_sessions.id DESC
         LIMIT 100`
      ),
      dbAll(
        `SELECT *
         FROM market_data_imports
         ORDER BY created_at DESC, id DESC
         LIMIT 100`
      ),
      dbAll(
        `SELECT exchange_connectors.*,
                local_secret_references.label AS secret_reference_label,
                local_secret_references.provider_type AS secret_reference_provider_type,
                local_secret_references.reference_name AS secret_reference_name,
                local_secret_references.scope AS secret_reference_scope,
                local_secret_references.status AS secret_reference_status
         FROM exchange_connectors
         LEFT JOIN local_secret_references ON local_secret_references.id = exchange_connectors.secret_reference_id
         ORDER BY exchange_connectors.updated_at DESC, exchange_connectors.id DESC
         LIMIT 100`
      ),
      dbAll(
        `SELECT *
         FROM local_secret_references
         WHERE user_id = ?
         ORDER BY updated_at DESC, id DESC
         LIMIT 100`,
        [userId]
      )
    ]);

    return {
      wallets: walletRows.map(parseOwnerWallet),
      plans: planRows.map(parseBotAutomationPlan),
      runs: runRows.map(parseBotAutomationRun),
      schedules: scheduleRows.map(parseBotAutomationSchedule),
      strategies: strategyRows.map(parseStrategy),
      riskProfiles: riskProfileRows.map(parseRiskProfile),
      paperSessions: paperSessionRows.map(parsePaperSession),
      marketImports: marketImportRows.map(parseMarketImport),
      exchangeConnectors: connectorRows.map(parseExchangeConnector),
      localSecretReferences: secretReferenceRows.map(parseLocalSecretReference)
    };
  }

  async function buildWizardResponse(userId) {
    const data = await loadWizardData(userId);
    return buildOwnerSetupWizard({
      ...data,
      envStatus: readOwnerEnvStatus({ fsModule: fs, envPath: ownerEnvPath }),
      liveExecution: {
        enabled: false,
        orderEndpointEnabled: false,
        goLiveAllowed: false
      }
    });
  }

  app.get('/api/v1/owner-setup-wizard', requireAuth, async (req, res) => {
    try {
      res.json({
        wizard: await buildWizardResponse(req.session.userId)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/owner-setup-wizard/verify/:gateId', requireAuth, async (req, res) => {
    try {
      const wizard = await buildWizardResponse(req.session.userId);
      const allGates = [
        ...(wizard.gates.paperTrading || []),
        ...(wizard.gates.fullEndToEnd || [])
      ];
      const gate = allGates.find(item => item.id === req.params.gateId);

      if (!gate) {
        return res.status(404).json({ error: 'Owner setup gate not found' });
      }

      res.json({
        gate,
        progress: wizard.progress,
        safetyBoundary: wizard.safetyBoundary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/owner-setup-wizard/paper-verification-run', requireAuth, async (req, res) => {
    try {
      const data = await loadWizardData(req.session.userId);
      const readyPlan = data.plans.find(plan => (
        plan.mode === 'paper'
        && plan.status !== 'archived'
        && (plan.readiness?.status === 'ready_for_paper' || plan.status === 'ready_for_paper')
      ));

      if (!readyPlan) {
        return res.status(400).json({
          error: 'No ready paper bot plan found.',
          nextOwnerStep: 'Create a paper-mode bot plan in Strategy Lab tied to a saved strategy, active risk profile, and paper replay. No wallet signing is required.'
        });
      }

      const run = await createBotAutomationPaperRun(readyPlan.id, {
        positionOpen: Boolean(req.body?.positionOpen)
      });
      const wizard = await buildWizardResponse(req.session.userId);

      res.status(201).json({
        run,
        wizard,
        liveTradingEnabled: false,
        walletSigningEnabled: false
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        readiness: error.readiness
      });
    }
  });

  app.post('/api/v1/owner-setup-wizard/env-template', requireAuth, async (req, res) => {
    try {
      fs.mkdirSync(ownerSecretsDir, { recursive: true, mode: 0o700 });
      const templatePath = `${ownerEnvPath}.example`;
      const existed = fs.existsSync(templatePath);

      if (!existed) {
        fs.writeFileSync(templatePath, `${buildOwnerEnvTemplate()}\n`, { mode: 0o600 });
      }

      res.status(existed ? 200 : 201).json({
        templatePath,
        existed,
        ownerEnvPath,
        note: 'Template contains placeholder variable names only. Put real values in ~/EtherealAI_Secrets/.env and never add seed phrases or private keys.',
        liveTradingEnabled: false,
        walletSigningEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerOwnerSetupWizardRoutes
};
