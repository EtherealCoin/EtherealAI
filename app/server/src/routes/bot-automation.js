const { buildBotAutomationCapabilityPath } = require('../lib/bot-automation');

function buildBotSafetyDossierExplanation({
  plan,
  dossierStatus,
  paperAutomationReady,
  blockingFailures,
  activeSchedules
}) {
  const failureSummary = blockingFailures.length
    ? blockingFailures.slice(0, 5).join(', ')
    : '';
  const summary = (() => {
    if (plan.status === 'archived') {
      return 'Plan is archived. No automation action should run from this plan.';
    }

    if (dossierStatus === 'blocked') {
      return `Plan is blocked by ${blockingFailures.length} safety gate(s).`;
    }

    if (paperAutomationReady) {
      return 'Paper monitoring is ready. Live trading remains disabled.';
    }

    if (plan.mode === 'live_disabled') {
      return 'Plan is live-disabled. It can be reviewed, but it cannot execute orders.';
    }

    return 'Plan needs owner review before paper automation is considered ready.';
  })();
  const ownerAction = blockingFailures.length
    ? `Review blocking failures: ${failureSummary}.`
    : (activeSchedules.length
      ? 'Review the latest schedule, paper run, and dossier export before changing plan status.'
      : 'Create or run a paper schedule, then export the dossier for the local evidence record.');

  return {
    summary,
    ownerAction,
    liveExecutionBoundary: 'Live execution disabled: no credential loading, no live order endpoint, and no exchange order placement.',
    reviewChecklist: [
      'Confirm plan mode is paper or live_disabled.',
      'Review latest readiness, go-live review, paper run, and schedule history.',
      'Export the safety dossier JSON for local evidence.',
      'Keep live execution disabled until a future reviewed implementation phase.'
    ]
  };
}

function registerBotAutomationRoutes(app, {
  requireAuth,
  dbAll,
  dbRun,
  findSensitiveFields,
  getPositiveNumber,
  parseBotAutomationPlan,
  parseBotAutomationRun,
  parseBotAutomationSchedule,
  parseBotLiveReadinessEvent,
  parseBotLiveEnablementReview,
  getBotAutomationPlanRow,
  getBotAutomationRunRow,
  getBotAutomationScheduleRow,
  getBotLiveReadinessEventRow,
  getBotLiveEnablementReviewRow,
  createBotAutomationPaperRun,
  runBotAutomationSchedule,
  scheduleBotAutomationWorker,
  loadBotAutomationReadinessContext,
  evaluateBotAutomationReadiness,
  evaluateBotLiveReadiness,
  createBotLiveEnablementReviewPayload,
  assertNoInlineSecretPayload,
  parseOwnerGoLiveCommand,
  selects
}) {
  const {
    botAutomationPlan: botAutomationPlanSelect,
    botAutomationRun: botAutomationRunSelect,
    botAutomationSchedule: botAutomationScheduleSelect,
    botLiveReadinessEvent: botLiveReadinessEventSelect,
    botLiveEnablementReview: botLiveEnablementReviewSelect
  } = selects;

  app.get('/api/v1/bot-automation-capability-path', requireAuth, async (req, res) => {
    try {
      const [planRows, runRows, scheduleRows] = await Promise.all([
        dbAll(
          `${botAutomationPlanSelect}
           ORDER BY bot_automation_plans.created_at DESC
           LIMIT 500`
        ),
        dbAll(
          `${botAutomationRunSelect}
           ORDER BY bot_automation_runs.created_at DESC, bot_automation_runs.id DESC
           LIMIT 500`
        ),
        dbAll(
          `${botAutomationScheduleSelect}
           ORDER BY bot_automation_schedules.created_at DESC, bot_automation_schedules.id DESC
           LIMIT 500`
        )
      ]);
      const capabilityPath = buildBotAutomationCapabilityPath({
        plans: planRows.map(parseBotAutomationPlan),
        runs: runRows.map(parseBotAutomationRun),
        schedules: scheduleRows.map(parseBotAutomationSchedule)
      });

      res.json({ capabilityPath });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-plans', requireAuth, async (req, res) => {
    try {
      const params = [];
      const where = [];

      if (req.query.strategyId) {
        where.push('bot_automation_plans.strategy_id = ?');
        params.push(Number(req.query.strategyId));
      }

      const rows = await dbAll(
        `${botAutomationPlanSelect}
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY bot_automation_plans.created_at DESC
         LIMIT 100`,
        params
      );

      res.json({ plans: rows.map(parseBotAutomationPlan) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-plans/:id', requireAuth, async (req, res) => {
    try {
      const row = await getBotAutomationPlanRow(req.params.id);

      if (!row) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      res.json({ plan: parseBotAutomationPlan(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-plans/:id/safety-dossier', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      const [readinessRows, reviewRows, runRows, scheduleRows] = await Promise.all([
        dbAll(
          `${botLiveReadinessEventSelect}
           WHERE bot_live_readiness_events.plan_id = ?
           ORDER BY bot_live_readiness_events.created_at DESC, bot_live_readiness_events.id DESC
           LIMIT 25`,
          [plan.id]
        ),
        dbAll(
          `${botLiveEnablementReviewSelect}
           WHERE bot_live_enablement_reviews.plan_id = ?
           ORDER BY bot_live_enablement_reviews.created_at DESC, bot_live_enablement_reviews.id DESC
           LIMIT 25`,
          [plan.id]
        ),
        dbAll(
          `${botAutomationRunSelect}
           WHERE bot_automation_runs.plan_id = ?
           ORDER BY bot_automation_runs.created_at DESC, bot_automation_runs.id DESC
           LIMIT 25`,
          [plan.id]
        ),
        dbAll(
          `${botAutomationScheduleSelect}
           WHERE bot_automation_schedules.plan_id = ?
           ORDER BY bot_automation_schedules.created_at DESC, bot_automation_schedules.id DESC
           LIMIT 25`,
          [plan.id]
        )
      ]);
      const liveReadinessEvents = readinessRows.map(parseBotLiveReadinessEvent);
      const goLiveReviews = reviewRows.map(parseBotLiveEnablementReview);
      const paperRuns = runRows.map(parseBotAutomationRun);
      const schedules = scheduleRows.map(parseBotAutomationSchedule);
      const latestLiveReadiness = liveReadinessEvents[0] || null;
      const latestGoLiveReview = goLiveReviews[0] || null;
      const latestPaperRun = paperRuns[0] || null;
      const latestSchedule = schedules[0] || null;
      const latestChecklist = Array.isArray(latestGoLiveReview?.review?.checklist)
        ? latestGoLiveReview.review.checklist
        : [];
      const failureSources = [
        plan.readiness,
        latestLiveReadiness?.readiness,
        latestGoLiveReview?.review,
        latestPaperRun?.result
      ];
      const blockingFailures = Array.from(new Set(
        failureSources.flatMap(source => [
          ...(source?.blockingFailures || []),
          ...(source?.failures || [])
        ]).filter(Boolean)
      ));
      const activeSchedules = schedules.filter(schedule => schedule.status === 'active');
      const reviewedChecklistCount = latestChecklist.filter(item => item.reviewed).length;
      const readinessStatus = plan.readiness?.status || plan.status;
      const paperAutomationReady = plan.mode === 'paper'
        && readinessStatus === 'ready_for_paper'
        && !blockingFailures.length
        && plan.status !== 'archived';
      const dossierStatus = plan.status === 'archived'
        ? 'archived'
        : (blockingFailures.length
          ? 'blocked'
          : (paperAutomationReady
            ? 'paper_ready'
            : (plan.mode === 'live_disabled' ? 'live_blocked' : 'review_required')));
      const statusExplanation = buildBotSafetyDossierExplanation({
        plan,
        dossierStatus,
        paperAutomationReady,
        blockingFailures,
        activeSchedules
      });

      res.json({
        plan,
        dossier: {
          status: dossierStatus,
          statusExplanation,
          mode: plan.mode,
          paperAutomationReady,
          liveBlocked: true,
          liveExecution: {
            enabled: false,
            orderEndpointEnabled: false,
            goLiveAllowed: false,
            note: 'Safety dossier is monitor-only and cannot enable live execution.'
          },
          counts: {
            liveReadinessEvents: liveReadinessEvents.length,
            goLiveReviews: goLiveReviews.length,
            paperRuns: paperRuns.length,
            schedules: schedules.length,
            activeSchedules: activeSchedules.length,
            reviewedChecklistItems: reviewedChecklistCount,
            totalChecklistItems: latestChecklist.length
          },
          latest: {
            liveReadiness: latestLiveReadiness,
            goLiveReview: latestGoLiveReview,
            paperRun: latestPaperRun,
            schedule: latestSchedule
          },
          blockingFailures,
          generatedAt: new Date().toISOString()
        },
        history: {
          liveReadinessEvents,
          goLiveReviews,
          paperRuns,
          schedules
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Bot automation plans cannot store secrets.',
          sensitiveFields
        });
      }

      const strategyId = Number(req.body?.strategyId);
      const paperSessionId = req.body?.paperSessionId ? Number(req.body.paperSessionId) : null;
      const riskProfileId = req.body?.riskProfileId ? Number(req.body.riskProfileId) : null;
      const connectorId = req.body?.connectorId ? Number(req.body.connectorId) : null;
      const mode = String(req.body?.mode || 'paper').trim().toLowerCase();
      const allowedModes = new Set(['paper', 'live_disabled']);
      const notes = String(req.body?.notes || '').trim().slice(0, 1000);

      if (!Number.isInteger(strategyId) || strategyId <= 0) {
        return res.status(400).json({ error: 'Strategy is required' });
      }

      if (!allowedModes.has(mode)) {
        return res.status(400).json({ error: 'Mode must be paper or live_disabled' });
      }

      const context = await loadBotAutomationReadinessContext(strategyId, riskProfileId, paperSessionId, connectorId);

      if (!context.strategy) {
        return res.status(400).json({ error: 'Strategy not found' });
      }

      if (riskProfileId && !context.riskProfile) {
        return res.status(400).json({ error: 'Risk profile not found' });
      }

      if (paperSessionId && !context.paperSession) {
        return res.status(400).json({ error: 'Paper session not found' });
      }

      if (connectorId && !context.connector) {
        return res.status(400).json({ error: 'Exchange connector not found' });
      }

      if (context.paperSession && Number(context.paperSession.strategy_id) !== strategyId) {
        return res.status(400).json({ error: 'Paper session must belong to the selected strategy' });
      }

      const name = String(req.body?.name || `${context.strategy.name} bot readiness`).trim().slice(0, 120);

      if (!name) {
        return res.status(400).json({ error: 'Bot automation plan name is required' });
      }

      const readiness = evaluateBotAutomationReadiness({
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector,
        mode
      });
      const result = await dbRun(
        `INSERT INTO bot_automation_plans
         (strategy_id, paper_session_id, risk_profile_id, connector_id, name, mode, status, market_symbol, timeframe, readiness_json, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          strategyId,
          paperSessionId,
          riskProfileId,
          connectorId,
          name,
          mode,
          readiness.status,
          context.strategy.market_symbol,
          context.strategy.timeframe,
          JSON.stringify(readiness),
          notes
        ]
      );
      const row = await getBotAutomationPlanRow(result.lastID);

      res.status(201).json({ plan: parseBotAutomationPlan(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/bot-automation-plans/:id', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Bot automation plans cannot store secrets.',
          sensitiveFields
        });
      }

      const current = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!current) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      const requestedStatus = req.body?.status !== undefined
        ? String(req.body.status).trim().toLowerCase()
        : null;

      if (requestedStatus && requestedStatus !== 'archived') {
        return res.status(400).json({ error: 'Bot plan status can only be archived through this endpoint.' });
      }

      if (current.status === 'archived' && requestedStatus !== 'archived') {
        return res.status(400).json({ error: 'Archived bot automation plans cannot be edited.' });
      }

      if (requestedStatus === 'archived') {
        await dbRun(
          `UPDATE bot_automation_schedules
           SET status = 'archived',
               next_run_at = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE plan_id = ?`,
          [current.id]
        );
        await dbRun(
          `UPDATE bot_automation_plans
           SET status = 'archived',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [current.id]
        );

        return res.json({ plan: parseBotAutomationPlan(await getBotAutomationPlanRow(current.id)) });
      }

      const hasPaperSessionId = Object.prototype.hasOwnProperty.call(req.body || {}, 'paperSessionId');
      const hasRiskProfileId = Object.prototype.hasOwnProperty.call(req.body || {}, 'riskProfileId');
      const hasConnectorId = Object.prototype.hasOwnProperty.call(req.body || {}, 'connectorId');
      const paperSessionId = hasPaperSessionId && req.body.paperSessionId ? Number(req.body.paperSessionId) : (hasPaperSessionId ? null : current.paper_session_id);
      const riskProfileId = hasRiskProfileId && req.body.riskProfileId ? Number(req.body.riskProfileId) : (hasRiskProfileId ? null : current.risk_profile_id);
      const connectorId = hasConnectorId && req.body.connectorId ? Number(req.body.connectorId) : (hasConnectorId ? null : current.connector_id);
      const mode = req.body?.mode !== undefined
        ? String(req.body.mode).trim().toLowerCase()
        : current.mode;
      const allowedModes = new Set(['paper', 'live_disabled']);
      const name = req.body?.name !== undefined
        ? String(req.body.name || '').trim().slice(0, 120)
        : current.name;
      const notes = req.body?.notes !== undefined
        ? String(req.body.notes || '').trim().slice(0, 1000)
        : current.notes;

      if (!name) {
        return res.status(400).json({ error: 'Bot automation plan name is required' });
      }

      if (!allowedModes.has(mode)) {
        return res.status(400).json({ error: 'Mode must be paper or live_disabled' });
      }

      const context = await loadBotAutomationReadinessContext(current.strategy_id, riskProfileId, paperSessionId, connectorId);

      if (riskProfileId && !context.riskProfile) {
        return res.status(400).json({ error: 'Risk profile not found' });
      }

      if (paperSessionId && !context.paperSession) {
        return res.status(400).json({ error: 'Paper session not found' });
      }

      if (connectorId && !context.connector) {
        return res.status(400).json({ error: 'Exchange connector not found' });
      }

      if (context.paperSession && Number(context.paperSession.strategy_id) !== Number(current.strategy_id)) {
        return res.status(400).json({ error: 'Paper session must belong to the selected strategy' });
      }

      const readiness = evaluateBotAutomationReadiness({
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector,
        mode
      });

      await dbRun(
        `UPDATE bot_automation_plans
         SET paper_session_id = ?,
             risk_profile_id = ?,
             connector_id = ?,
             name = ?,
             mode = ?,
             status = ?,
             readiness_json = ?,
             notes = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          paperSessionId,
          riskProfileId,
          connectorId,
          name,
          mode,
          readiness.status,
          JSON.stringify(readiness),
          notes,
          current.id
        ]
      );

      if (mode !== 'paper') {
        await dbRun(
          `UPDATE bot_automation_schedules
           SET status = 'archived',
               next_run_at = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE plan_id = ?`,
          [current.id]
        );
      }

      res.json({ plan: parseBotAutomationPlan(await getBotAutomationPlanRow(current.id)) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/review', requireAuth, async (req, res) => {
    try {
      const current = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!current) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      if (current.status === 'archived') {
        return res.status(400).json({ error: 'Archived bot automation plans cannot be reviewed.' });
      }

      const context = await loadBotAutomationReadinessContext(
        current.strategy_id,
        current.risk_profile_id,
        current.paper_session_id,
        current.connector_id
      );
      const readiness = evaluateBotAutomationReadiness({
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector,
        mode: current.mode
      });

      await dbRun(
        `UPDATE bot_automation_plans
         SET status = ?, readiness_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [readiness.status, JSON.stringify(readiness), req.params.id]
      );
      const row = await getBotAutomationPlanRow(req.params.id);

      res.json({ plan: parseBotAutomationPlan(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/live-readiness', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      const context = await loadBotAutomationReadinessContext(
        plan.strategy_id,
        plan.risk_profile_id,
        plan.paper_session_id,
        plan.connector_id
      );
      const readiness = evaluateBotLiveReadiness({
        plan,
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector
      });
      const result = await dbRun(
        `INSERT INTO bot_live_readiness_events
         (plan_id, user_id, status, readiness_json)
         VALUES (?, ?, ?, ?)`,
        [
          plan.id,
          req.session.userId,
          readiness.status,
          JSON.stringify(readiness)
        ]
      );
      const event = parseBotLiveReadinessEvent(await getBotLiveReadinessEventRow(result.lastID));

      res.json({ readiness, event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-plans/:id/live-readiness-events', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      const rows = await dbAll(
        `${botLiveReadinessEventSelect}
         WHERE bot_live_readiness_events.plan_id = ?
         ORDER BY bot_live_readiness_events.created_at DESC, bot_live_readiness_events.id DESC
         LIMIT 100`,
        [plan.id]
      );

      res.json({ events: rows.map(parseBotLiveReadinessEvent) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-live-readiness-events/:id', requireAuth, async (req, res) => {
    try {
      const event = parseBotLiveReadinessEvent(await getBotLiveReadinessEventRow(req.params.id));

      if (!event) {
        return res.status(404).json({ error: 'Bot live-readiness event not found' });
      }

      res.json({ event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/live-enablement-reviews', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      if (plan.status === 'archived') {
        return res.status(400).json({ error: 'Archived bot automation plans cannot draft go-live enablement reviews.' });
      }

      if (plan.mode !== 'live_disabled') {
        return res.status(400).json({ error: 'Only live-disabled bot automation plans can draft go-live enablement reviews.' });
      }

      const context = await loadBotAutomationReadinessContext(
        plan.strategy_id,
        plan.risk_profile_id,
        plan.paper_session_id,
        plan.connector_id
      );
      const readiness = evaluateBotLiveReadiness({
        plan,
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector
      });
      const review = createBotLiveEnablementReviewPayload({ plan, readiness });
      const result = await dbRun(
        `INSERT INTO bot_live_enablement_reviews
         (plan_id, user_id, status, review_json)
         VALUES (?, ?, ?, ?)`,
        [
          plan.id,
          req.session.userId,
          review.status,
          JSON.stringify(review)
        ]
      );
      const row = await getBotLiveEnablementReviewRow(result.lastID);

      res.status(201).json({ review: parseBotLiveEnablementReview(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/go-live-command', requireAuth, async (req, res) => {
    try {
      assertNoInlineSecretPayload(
        { commandText: req.body?.commandText || '' },
        'Go-live command text cannot contain secret-looking values.'
      );
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      if (plan.status === 'archived') {
        return res.status(400).json({ error: 'Archived bot automation plans cannot parse go-live commands.' });
      }

      if (plan.mode !== 'live_disabled') {
        return res.status(400).json({ error: 'Only live-disabled bot automation plans can parse go-live commands.' });
      }

      const ownerCommand = parseOwnerGoLiveCommand(req.body?.commandText);

      if (!ownerCommand.commandText) {
        return res.status(400).json({ error: 'Go-live command text is required' });
      }

      if (!ownerCommand.recognized) {
        return res.status(400).json({
          error: 'Go-live command intent was not recognized.',
          command: ownerCommand
        });
      }

      const context = await loadBotAutomationReadinessContext(
        plan.strategy_id,
        plan.risk_profile_id,
        plan.paper_session_id,
        plan.connector_id
      );
      const readiness = evaluateBotLiveReadiness({
        plan,
        strategy: context.strategy,
        riskProfile: context.riskProfile,
        paperSession: context.paperSession,
        connector: context.connector
      });
      const review = createBotLiveEnablementReviewPayload({ plan, readiness });
      review.stage = 'owner_go_live_command_blocked';
      review.ownerCommand = ownerCommand;
      review.ownerConfirmation = {
        ...(review.ownerConfirmation || {}),
        provided: false,
        acceptedHere: false,
        commandRecognized: true,
        note: 'Owner go-live wording was recognized, but this build refuses execution because live gates are not implemented.'
      };
      review.blockingFailures = Array.from(new Set([
        ...(review.blockingFailures || []),
        'go_live_command_blocked_by_disabled_execution'
      ]));
      review.failures = Array.from(new Set([
        ...(review.failures || []),
        'go_live_command_blocked_by_disabled_execution'
      ]));
      review.liveExecution = {
        enabled: false,
        orderEndpointEnabled: false,
        goLiveAllowed: false,
        note: 'Go-live command recognized but refused. No live order endpoint, credential loader, or exchange adapter is enabled.'
      };
      review.generatedAt = new Date().toISOString();

      const result = await dbRun(
        `INSERT INTO bot_live_enablement_reviews
         (plan_id, user_id, status, review_json)
         VALUES (?, ?, ?, ?)`,
        [
          plan.id,
          req.session.userId,
          'blocked',
          JSON.stringify(review)
        ]
      );
      const row = await getBotLiveEnablementReviewRow(result.lastID);

      res.status(201).json({
        command: ownerCommand,
        review: parseBotLiveEnablementReview(row)
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        sensitiveFields: error.sensitiveFields,
        likelySecretValues: error.likelySecretValues
      });
    }
  });

  app.get('/api/v1/bot-automation-plans/:id/live-enablement-reviews', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      const rows = await dbAll(
        `${botLiveEnablementReviewSelect}
         WHERE bot_live_enablement_reviews.plan_id = ?
         ORDER BY bot_live_enablement_reviews.created_at DESC, bot_live_enablement_reviews.id DESC
         LIMIT 100`,
        [plan.id]
      );

      res.json({ reviews: rows.map(parseBotLiveEnablementReview) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-live-enablement-reviews/:id', requireAuth, async (req, res) => {
    try {
      const review = parseBotLiveEnablementReview(await getBotLiveEnablementReviewRow(req.params.id));

      if (!review) {
        return res.status(404).json({ error: 'Bot live enablement review not found' });
      }

      res.json({ review });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/bot-live-enablement-reviews/:id', requireAuth, async (req, res) => {
    try {
      const row = await getBotLiveEnablementReviewRow(req.params.id);
      const current = parseBotLiveEnablementReview(row);

      if (!current) {
        return res.status(404).json({ error: 'Bot live enablement review not found' });
      }

      const itemId = String(req.body?.checklistItemId || '').trim();
      const reviewed = Boolean(req.body?.reviewed);
      const note = String(req.body?.note || '').trim().slice(0, 500);
      const reviewJson = current.review || {};
      const checklist = Array.isArray(reviewJson.checklist) ? reviewJson.checklist : [];
      const item = checklist.find(entry => entry.id === itemId);

      if (!item) {
        return res.status(400).json({ error: 'Checklist item not found for this go-live review' });
      }

      item.reviewed = reviewed;
      item.reviewedAt = reviewed ? new Date().toISOString() : null;
      item.reviewedByUserId = reviewed ? req.session.userId : null;
      item.reviewNote = note;
      item.passed = false;
      reviewJson.checklist = checklist;
      reviewJson.status = 'blocked';
      reviewJson.liveExecution = {
        ...(reviewJson.liveExecution || {}),
        enabled: false,
        orderEndpointEnabled: false,
        goLiveAllowed: false,
        note: 'Checklist review cannot enable live execution.'
      };
      reviewJson.updatedAt = new Date().toISOString();

      await dbRun(
        `UPDATE bot_live_enablement_reviews
         SET status = ?, review_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        ['blocked', JSON.stringify(reviewJson), current.id]
      );
      const updated = parseBotLiveEnablementReview(await getBotLiveEnablementReviewRow(current.id));

      res.json({ review: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-runs', requireAuth, async (req, res) => {
    try {
      const where = [];
      const params = [];

      if (req.query.planId) {
        where.push('bot_automation_runs.plan_id = ?');
        params.push(Number(req.query.planId));
      }

      if (req.query.strategyId) {
        where.push('bot_automation_runs.strategy_id = ?');
        params.push(Number(req.query.strategyId));
      }

      const rows = await dbAll(
        `${botAutomationRunSelect}
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY bot_automation_runs.created_at DESC
         LIMIT 100`,
        params
      );

      res.json({ runs: rows.map(parseBotAutomationRun) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-runs/:id', requireAuth, async (req, res) => {
    try {
      const row = await getBotAutomationRunRow(req.params.id);

      if (!row) {
        return res.status(404).json({ error: 'Bot automation run not found' });
      }

      res.json({ run: parseBotAutomationRun(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/paper-runs', requireAuth, async (req, res) => {
    try {
      const run = await createBotAutomationPaperRun(req.params.id, {
        marketDataImportId: req.body?.marketDataImportId,
        positionOpen: Boolean(req.body?.positionOpen)
      });

      res.status(201).json({ run });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        readiness: error.readiness
      });
    }
  });

  app.get('/api/v1/bot-automation-schedules', requireAuth, async (req, res) => {
    try {
      const where = [];
      const params = [];

      if (req.query.planId) {
        where.push('bot_automation_schedules.plan_id = ?');
        params.push(Number(req.query.planId));
      }

      if (req.query.strategyId) {
        where.push('bot_automation_plans.strategy_id = ?');
        params.push(Number(req.query.strategyId));
      }

      if (req.query.status) {
        const status = String(req.query.status).trim().toLowerCase();
        const allowedStatuses = new Set(['paused', 'active', 'archived']);

        if (!allowedStatuses.has(status)) {
          return res.status(400).json({ error: 'Schedule status must be paused, active, or archived' });
        }

        where.push('bot_automation_schedules.status = ?');
        params.push(status);
      }

      const rows = await dbAll(
        `${botAutomationScheduleSelect}
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY bot_automation_schedules.created_at DESC
         LIMIT 100`,
        params
      );

      res.json({ schedules: rows.map(parseBotAutomationSchedule) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/bot-automation-schedules/:id', requireAuth, async (req, res) => {
    try {
      const schedule = parseBotAutomationSchedule(await getBotAutomationScheduleRow(req.params.id));

      if (!schedule) {
        return res.status(404).json({ error: 'Bot automation schedule not found' });
      }

      res.json({ schedule });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-plans/:id/schedules', requireAuth, async (req, res) => {
    try {
      const plan = parseBotAutomationPlan(await getBotAutomationPlanRow(req.params.id));

      if (!plan) {
        return res.status(404).json({ error: 'Bot automation plan not found' });
      }

      if (plan.status === 'archived') {
        return res.status(400).json({ error: 'Archived bot automation plans cannot be scheduled.' });
      }

      if (plan.mode !== 'paper') {
        return res.status(400).json({ error: 'Only paper-mode bot automation plans can be scheduled.' });
      }

      const intervalMinutes = Math.max(Math.floor(getPositiveNumber(req.body?.intervalMinutes, 15)), 1);
      const status = String(req.body?.status || 'paused').trim().toLowerCase();
      const allowedStatuses = new Set(['paused', 'active']);

      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Schedule status must be paused or active' });
      }

      const settings = {
        positionOpen: Boolean(req.body?.positionOpen)
      };
      const nextRunAt = status === 'active' ? new Date().toISOString() : null;
      const result = await dbRun(
        `INSERT INTO bot_automation_schedules
         (plan_id, interval_minutes, status, settings_json, next_run_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          plan.id,
          intervalMinutes,
          status,
          JSON.stringify(settings),
          nextRunAt
        ]
      );

      if (status === 'active') {
        scheduleBotAutomationWorker();
      }

      const schedule = parseBotAutomationSchedule(await getBotAutomationScheduleRow(result.lastID));

      res.status(201).json({ schedule });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/bot-automation-schedules/:id', requireAuth, async (req, res) => {
    try {
      const current = parseBotAutomationSchedule(await getBotAutomationScheduleRow(req.params.id));

      if (!current) {
        return res.status(404).json({ error: 'Bot automation schedule not found' });
      }

      const status = req.body?.status !== undefined
        ? String(req.body.status).trim().toLowerCase()
        : current.status;
      const allowedStatuses = new Set(['paused', 'active', 'archived']);
      const intervalMinutes = req.body?.intervalMinutes !== undefined
        ? Math.max(Math.floor(getPositiveNumber(req.body.intervalMinutes, current.interval_minutes)), 1)
        : current.interval_minutes;
      const settings = {
        ...current.settings,
        ...(req.body?.positionOpen !== undefined ? { positionOpen: Boolean(req.body.positionOpen) } : {})
      };

      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Schedule status must be paused, active, or archived' });
      }

      const nextRunAt = status === 'active'
        ? (current.next_run_at || new Date().toISOString())
        : null;

      await dbRun(
        `UPDATE bot_automation_schedules
         SET interval_minutes = ?,
             status = ?,
             settings_json = ?,
             next_run_at = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          intervalMinutes,
          status,
          JSON.stringify(settings),
          nextRunAt,
          current.id
        ]
      );

      if (status === 'active') {
        scheduleBotAutomationWorker();
      }

      const schedule = parseBotAutomationSchedule(await getBotAutomationScheduleRow(current.id));

      res.json({ schedule });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/bot-automation-schedules/:id/run', requireAuth, async (req, res) => {
    try {
      const result = await runBotAutomationSchedule(req.params.id, { force: true });

      res.status(201).json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerBotAutomationRoutes
};
