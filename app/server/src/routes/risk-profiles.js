function registerRiskProfileRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  findSensitiveFields,
  getPositiveNumber,
  parseRiskProfile,
  parseRiskProfileAuditEvent,
  parseBotAutomationPlan,
  getRiskProfileChangedFields,
  saveRiskProfileAuditEvent,
  refreshBotPlansForRiskProfile,
  riskProfileAuditFields,
  selects
}) {
  const {
    botAutomationPlan: botAutomationPlanSelect
  } = selects;

  app.get('/api/v1/risk-profiles', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT *
         FROM risk_profiles
         ORDER BY created_at DESC
         LIMIT 100`
      );

      res.json({ profiles: rows.map(parseRiskProfile) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/risk-profiles/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet('SELECT * FROM risk_profiles WHERE id = ?', [req.params.id]);

      if (!row) {
        return res.status(404).json({ error: 'Risk profile not found' });
      }

      res.json({ profile: parseRiskProfile(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/risk-profiles/:id/audit-events', requireAuth, async (req, res) => {
    try {
      const profile = await dbGet('SELECT * FROM risk_profiles WHERE id = ?', [req.params.id]);

      if (!profile) {
        return res.status(404).json({ error: 'Risk profile not found' });
      }

      const eventType = String(req.query.eventType || '').trim().toLowerCase();
      const allowedEventTypes = new Set(['created', 'updated', 'reviewed']);
      const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 100);
      const where = ['risk_profile_audit_events.risk_profile_id = ?'];
      const params = [req.params.id];

      if (eventType) {
        if (!allowedEventTypes.has(eventType)) {
          return res.status(400).json({ error: 'Audit event type must be created, updated, or reviewed' });
        }

        where.push('risk_profile_audit_events.event_type = ?');
        params.push(eventType);
      }

      const rows = await dbAll(
        `SELECT risk_profile_audit_events.*, risk_profiles.name AS risk_profile_name
         FROM risk_profile_audit_events
         LEFT JOIN risk_profiles ON risk_profiles.id = risk_profile_audit_events.risk_profile_id
         WHERE ${where.join(' AND ')}
         ORDER BY risk_profile_audit_events.created_at DESC, risk_profile_audit_events.id DESC
         LIMIT ?`,
        [...params, limit]
      );

      res.json({
        filter: {
          eventType: eventType || 'all',
          limit
        },
        events: rows.map(parseRiskProfileAuditEvent)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/risk-profiles/:id/kill-switch-impact', requireAuth, async (req, res) => {
    try {
      const profileRow = await dbGet('SELECT * FROM risk_profiles WHERE id = ?', [req.params.id]);

      if (!profileRow) {
        return res.status(404).json({ error: 'Risk profile not found' });
      }

      const profile = parseRiskProfile(profileRow);
      const linkedPlanRows = await dbAll(
        `${botAutomationPlanSelect}
         WHERE bot_automation_plans.risk_profile_id = ?
           AND bot_automation_plans.status != 'archived'
         ORDER BY bot_automation_plans.updated_at DESC, bot_automation_plans.id DESC
         LIMIT 100`,
        [profile.id]
      );
      const auditRows = await dbAll(
        `SELECT risk_profile_audit_events.*, risk_profiles.name AS risk_profile_name
         FROM risk_profile_audit_events
         LEFT JOIN risk_profiles ON risk_profiles.id = risk_profile_audit_events.risk_profile_id
         WHERE risk_profile_audit_events.risk_profile_id = ?
         ORDER BY risk_profile_audit_events.created_at DESC, risk_profile_audit_events.id DESC
         LIMIT 25`,
        [profile.id]
      );
      const linkedPlans = linkedPlanRows.map(parseBotAutomationPlan);
      const active = Boolean(profile.kill_switch_enabled && profile.status !== 'archived');

      res.json({
        profile,
        impact: {
          active,
          linkedPlanCount: linkedPlans.length,
          affectedPlanCount: active ? linkedPlans.length : 0,
          linkedPlans,
          affectedPlans: active ? linkedPlans : [],
          auditEvents: auditRows.map(parseRiskProfileAuditEvent),
          liveExecution: {
            enabled: false,
            orderEndpointEnabled: false,
            goLiveAllowed: false,
            note: 'Emergency-stop impact is review-only. It cannot enable live exchange execution.'
          },
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/risk-profile-audit-events/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        `SELECT risk_profile_audit_events.*, risk_profiles.name AS risk_profile_name
         FROM risk_profile_audit_events
         LEFT JOIN risk_profiles ON risk_profiles.id = risk_profile_audit_events.risk_profile_id
         WHERE risk_profile_audit_events.id = ?`,
        [req.params.id]
      );

      if (!row) {
        return res.status(404).json({ error: 'Risk profile audit event not found' });
      }

      res.json({ event: parseRiskProfileAuditEvent(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/risk-profiles', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Risk profiles cannot store secrets.',
          sensitiveFields
        });
      }

      const name = String(req.body?.name || '').trim().slice(0, 120);
      const mode = String(req.body?.mode || 'paper').trim().toLowerCase();
      const allowedModes = new Set(['paper', 'read_only', 'live_disabled']);

      if (!name) {
        return res.status(400).json({ error: 'Risk profile name is required' });
      }

      if (!allowedModes.has(mode)) {
        return res.status(400).json({ error: 'Mode must be paper, read_only, or live_disabled' });
      }

      const result = await dbRun(
        `INSERT INTO risk_profiles
         (name, mode, max_order_value, max_position_value, max_daily_loss, max_open_trades, kill_switch_enabled, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          mode,
          getPositiveNumber(req.body?.maxOrderValue, 0),
          getPositiveNumber(req.body?.maxPositionValue, 0),
          getPositiveNumber(req.body?.maxDailyLoss, 0),
          Math.floor(getPositiveNumber(req.body?.maxOpenTrades, 0)),
          req.body?.killSwitchEnabled ? 1 : 0,
          'active',
          String(req.body?.notes || '').trim().slice(0, 1000)
        ]
      );
      const row = await dbGet('SELECT * FROM risk_profiles WHERE id = ?', [result.lastID]);
      const profile = parseRiskProfile(row);

      await saveRiskProfileAuditEvent({
        riskProfileId: profile.id,
        userId: req.session.userId,
        eventType: 'created',
        summary: 'Risk profile created.',
        afterProfile: profile,
        metadata: {
          source: 'api',
          changedFields: riskProfileAuditFields
        }
      });

      res.status(201).json({ profile });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/risk-profiles/:id', requireAuth, async (req, res) => {
    try {
      const current = await dbGet('SELECT * FROM risk_profiles WHERE id = ?', [req.params.id]);

      if (!current) {
        return res.status(404).json({ error: 'Risk profile not found' });
      }

      const beforeProfile = parseRiskProfile(current);
      const next = {
        ...beforeProfile,
        name: req.body?.name !== undefined ? String(req.body.name).trim().slice(0, 120) : current.name,
        mode: req.body?.mode !== undefined ? String(req.body.mode).trim().toLowerCase() : current.mode,
        max_order_value: req.body?.maxOrderValue !== undefined ? getPositiveNumber(req.body.maxOrderValue, 0) : current.max_order_value,
        max_position_value: req.body?.maxPositionValue !== undefined ? getPositiveNumber(req.body.maxPositionValue, 0) : current.max_position_value,
        max_daily_loss: req.body?.maxDailyLoss !== undefined ? getPositiveNumber(req.body.maxDailyLoss, 0) : current.max_daily_loss,
        max_open_trades: req.body?.maxOpenTrades !== undefined ? Math.floor(getPositiveNumber(req.body.maxOpenTrades, 0)) : current.max_open_trades,
        kill_switch_enabled: req.body?.killSwitchEnabled !== undefined ? Boolean(req.body.killSwitchEnabled) : Boolean(current.kill_switch_enabled),
        status: req.body?.status !== undefined ? String(req.body.status).trim().toLowerCase() : current.status,
        notes: req.body?.notes !== undefined ? String(req.body.notes).trim().slice(0, 1000) : current.notes
      };
      const allowedModes = new Set(['paper', 'read_only', 'live_disabled']);
      const allowedStatuses = new Set(['active', 'paused', 'archived']);

      if (!next.name) {
        return res.status(400).json({ error: 'Risk profile name is required' });
      }

      if (!allowedModes.has(next.mode)) {
        return res.status(400).json({ error: 'Mode must be paper, read_only, or live_disabled' });
      }

      if (!allowedStatuses.has(next.status)) {
        return res.status(400).json({ error: 'Status must be active, paused, or archived' });
      }

      await dbRun(
        `UPDATE risk_profiles
         SET name = ?, mode = ?, max_order_value = ?, max_position_value = ?, max_daily_loss = ?,
             max_open_trades = ?, kill_switch_enabled = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          next.name,
          next.mode,
          next.max_order_value,
          next.max_position_value,
          next.max_daily_loss,
          next.max_open_trades,
          next.kill_switch_enabled ? 1 : 0,
          next.status,
          next.notes,
          req.params.id
        ]
      );
      const row = await dbGet('SELECT * FROM risk_profiles WHERE id = ?', [req.params.id]);
      const afterProfile = parseRiskProfile(row);
      const changedFields = getRiskProfileChangedFields(beforeProfile, afterProfile);

      await saveRiskProfileAuditEvent({
        riskProfileId: afterProfile.id,
        userId: req.session.userId,
        eventType: changedFields.length ? 'updated' : 'reviewed',
        summary: changedFields.length
          ? `Risk profile updated: ${changedFields.join(', ')}.`
          : 'Risk profile reviewed without changes.',
        beforeProfile,
        afterProfile,
        metadata: {
          source: 'api',
          changedFields
        }
      });
      const linkedBotPlans = await refreshBotPlansForRiskProfile(afterProfile.id);

      res.json({
        profile: afterProfile,
        linkedBotPlans
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerRiskProfileRoutes
};
