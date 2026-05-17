function registerOrderIntentRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  findSensitiveFields,
  getPositiveNumber,
  parseRiskProfile,
  parseOrderIntent,
  evaluateOrderIntentRisk
}) {
  app.get('/api/v1/order-intents', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT trade_order_intents.*, exchange_connectors.label AS connector_label,
                exchange_connectors.exchange_name, risk_profiles.name AS risk_profile_name,
                trading_strategies.name AS strategy_name
         FROM trade_order_intents
         LEFT JOIN exchange_connectors ON exchange_connectors.id = trade_order_intents.connector_id
         LEFT JOIN risk_profiles ON risk_profiles.id = trade_order_intents.risk_profile_id
         LEFT JOIN trading_strategies ON trading_strategies.id = trade_order_intents.strategy_id
         ORDER BY trade_order_intents.created_at DESC
         LIMIT 100`
      );

      res.json({ intents: rows.map(parseOrderIntent) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/order-intents/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        `SELECT trade_order_intents.*, exchange_connectors.label AS connector_label,
                exchange_connectors.exchange_name, risk_profiles.name AS risk_profile_name,
                trading_strategies.name AS strategy_name
         FROM trade_order_intents
         LEFT JOIN exchange_connectors ON exchange_connectors.id = trade_order_intents.connector_id
         LEFT JOIN risk_profiles ON risk_profiles.id = trade_order_intents.risk_profile_id
         LEFT JOIN trading_strategies ON trading_strategies.id = trade_order_intents.strategy_id
         WHERE trade_order_intents.id = ?`,
        [req.params.id]
      );

      if (!row) {
        return res.status(404).json({ error: 'Order intent not found' });
      }

      res.json({ intent: parseOrderIntent(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/order-intents', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Order intents cannot store secrets.',
          sensitiveFields
        });
      }

      const connectorId = req.body?.connectorId ? Number(req.body.connectorId) : null;
      const riskProfileId = req.body?.riskProfileId ? Number(req.body.riskProfileId) : null;
      const strategyId = req.body?.strategyId ? Number(req.body.strategyId) : null;
      const paperSessionId = req.body?.paperSessionId ? Number(req.body.paperSessionId) : null;
      const marketSymbol = String(req.body?.marketSymbol || '').trim().toUpperCase();
      const side = String(req.body?.side || '').trim().toLowerCase();
      const orderType = String(req.body?.orderType || '').trim().toLowerCase();
      const quantity = Number(req.body?.quantity);
      const limitPrice = req.body?.limitPrice === null || req.body?.limitPrice === undefined || req.body?.limitPrice === ''
        ? null
        : Number(req.body.limitPrice);
      const reason = String(req.body?.reason || '').trim().slice(0, 500);
      const currentOpenTrades = getPositiveNumber(req.body?.currentOpenTrades, 0);
      const currentDailyLoss = getPositiveNumber(req.body?.currentDailyLoss, 0);
      const allowedSides = new Set(['buy', 'sell']);
      const allowedOrderTypes = new Set(['market', 'limit']);

      if (!marketSymbol) {
        return res.status(400).json({ error: 'Market symbol is required' });
      }

      if (!allowedSides.has(side)) {
        return res.status(400).json({ error: 'Side must be buy or sell' });
      }

      if (!allowedOrderTypes.has(orderType)) {
        return res.status(400).json({ error: 'Order type must be market or limit' });
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than zero' });
      }

      if (orderType === 'limit' && (!Number.isFinite(limitPrice) || limitPrice <= 0)) {
        return res.status(400).json({ error: 'Limit price is required for limit orders' });
      }

      if (connectorId) {
        const connector = await dbGet('SELECT * FROM exchange_connectors WHERE id = ?', [connectorId]);

        if (!connector) {
          return res.status(400).json({ error: 'Connector not found' });
        }
      }

      const riskProfile = riskProfileId
        ? parseRiskProfile(await dbGet('SELECT * FROM risk_profiles WHERE id = ?', [riskProfileId]))
        : null;

      if (riskProfileId && !riskProfile) {
        return res.status(400).json({ error: 'Risk profile not found' });
      }

      const riskReview = evaluateOrderIntentRisk(riskProfile, {
        quantity,
        limitPrice,
        currentOpenTrades,
        currentDailyLoss
      });

      const payload = {
        mode: 'draft_intent_v1',
        warning: 'Draft order intent only. This endpoint does not place live orders.',
        createdBy: 'local-ai-control-center',
        requested: {
          connectorId,
          riskProfileId,
          strategyId,
          paperSessionId,
          marketSymbol,
          side,
          orderType,
          quantity,
          limitPrice,
          reason,
          currentOpenTrades,
          currentDailyLoss
        },
        riskReview
      };
      const result = await dbRun(
        `INSERT INTO trade_order_intents
         (connector_id, risk_profile_id, strategy_id, paper_session_id, market_symbol, side, order_type, quantity, limit_price, status, reason, payload_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          connectorId,
          riskProfileId,
          strategyId,
          paperSessionId,
          marketSymbol,
          side,
          orderType,
          quantity,
          limitPrice,
          'draft',
          reason,
          JSON.stringify(payload)
        ]
      );
      const row = await dbGet(
        `SELECT trade_order_intents.*, exchange_connectors.label AS connector_label,
                exchange_connectors.exchange_name, risk_profiles.name AS risk_profile_name,
                trading_strategies.name AS strategy_name
         FROM trade_order_intents
         LEFT JOIN exchange_connectors ON exchange_connectors.id = trade_order_intents.connector_id
         LEFT JOIN risk_profiles ON risk_profiles.id = trade_order_intents.risk_profile_id
         LEFT JOIN trading_strategies ON trading_strategies.id = trade_order_intents.strategy_id
         WHERE trade_order_intents.id = ?`,
        [result.lastID]
      );

      res.status(201).json({ intent: parseOrderIntent(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerOrderIntentRoutes
};
