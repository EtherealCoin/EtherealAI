function registerOrderIntentRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  findSensitiveFields,
  getPositiveNumber,
  parseRiskProfile,
  parseOrderIntent,
  parseArbitrageSimulationRun,
  parseRebalanceSimulationBatch,
  parseRebalanceCandidateCsv,
  evaluateOrderIntentRisk,
  simulateCrossExchangeArbitrage,
  simulateTopRebalanceBatch
}) {
  const allowedRebalanceBatchStatuses = new Set(['paper_candidate', 'review', 'no_candidates', 'archived']);

  function csvValue(value) {
    const text = value === null || value === undefined ? '' : String(value);

    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function buildRebalanceBatchExportCsv(batch) {
    const rows = (batch.result?.simulations || []).map(item => ({
      batchId: batch.id,
      batchName: batch.name,
      batchStatus: batch.status,
      marketSymbol: item.candidate?.marketSymbol,
      marketCapRank: item.candidate?.marketCapRank,
      priceChangePercent24h: item.candidate?.priceChangePercent24h,
      allocationUsd: item.allocationUsd,
      simulationStatus: item.simulation?.status,
      entryVenue: item.simulation?.bestEntry?.venue,
      entryChain: item.simulation?.bestEntry?.chain,
      entryPrice: item.simulation?.bestEntry?.price,
      exitVenue: item.simulation?.bestExit?.venue,
      exitChain: item.simulation?.bestExit?.chain,
      exitPrice: item.simulation?.bestExit?.price,
      estimatedNetProfit: item.simulation?.economics?.estimatedNetProfit,
      estimatedNetEdgePercent: item.simulation?.economics?.estimatedNetEdgePercent
    }));
    const columns = [
      'batchId',
      'batchName',
      'batchStatus',
      'marketSymbol',
      'marketCapRank',
      'priceChangePercent24h',
      'allocationUsd',
      'simulationStatus',
      'entryVenue',
      'entryChain',
      'entryPrice',
      'exitVenue',
      'exitChain',
      'exitPrice',
      'estimatedNetProfit',
      'estimatedNetEdgePercent'
    ];

    return [
      columns.map(csvValue).join(','),
      ...rows.map(row => columns.map(column => csvValue(row[column])).join(','))
    ].join('\n');
  }

  async function getOrderIntentRow(id) {
    return dbGet(
      `SELECT trade_order_intents.*, exchange_connectors.label AS connector_label,
              exchange_connectors.exchange_name, risk_profiles.name AS risk_profile_name,
              trading_strategies.name AS strategy_name
       FROM trade_order_intents
       LEFT JOIN exchange_connectors ON exchange_connectors.id = trade_order_intents.connector_id
       LEFT JOIN risk_profiles ON risk_profiles.id = trade_order_intents.risk_profile_id
       LEFT JOIN trading_strategies ON trading_strategies.id = trade_order_intents.strategy_id
       WHERE trade_order_intents.id = ?`,
      [id]
    );
  }

  async function getArbitrageSimulationRun(id) {
    return parseArbitrageSimulationRun(await dbGet(
      'SELECT * FROM arbitrage_simulation_runs WHERE id = ?',
      [id]
    ));
  }

  async function getRebalanceSimulationBatch(id) {
    return parseRebalanceSimulationBatch(await dbGet(
      'SELECT * FROM rebalance_simulation_batches WHERE id = ?',
      [id]
    ));
  }

  app.post('/api/v1/order-intents/rebalance-candidates/import-csv', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Rebalance candidate CSV imports cannot store secrets.',
          sensitiveFields
        });
      }

      const csvText = req.body?.csvText || req.body?.candidateCsv || '';
      const candidates = parseRebalanceCandidateCsv(csvText);

      res.json({
        candidates,
        summary: {
          candidateCount: candidates.length,
          quoteCount: candidates.reduce((total, candidate) => total + candidate.venueQuotes.length, 0),
          top200Count: candidates.filter(candidate => candidate.marketCapRank <= 200).length
        },
        localOnly: true,
        liveExecutionEnabled: false,
        networkCallsEnabled: false
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

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

  app.get('/api/v1/order-intents/arbitrage-simulations', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT *
         FROM arbitrage_simulation_runs
         ORDER BY created_at DESC, id DESC
         LIMIT 100`
      );

      res.json({
        runs: rows.map(parseArbitrageSimulationRun),
        localOnly: true,
        liveExecutionEnabled: false,
        networkCallsEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/order-intents/arbitrage-simulations/:id', requireAuth, async (req, res) => {
    try {
      const run = await getArbitrageSimulationRun(req.params.id);

      if (!run) {
        return res.status(404).json({ error: 'Arbitrage simulation run not found' });
      }

      res.json({ run });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/order-intents/arbitrage-simulations/:id/draft-intents', requireAuth, async (req, res) => {
    try {
      const run = await getArbitrageSimulationRun(req.params.id);

      if (!run) {
        return res.status(404).json({ error: 'Arbitrage simulation run not found' });
      }

      const riskProfileId = req.body?.riskProfileId ? Number(req.body.riskProfileId) : null;
      const strategyId = req.body?.strategyId ? Number(req.body.strategyId) : null;
      const paperSessionId = req.body?.paperSessionId ? Number(req.body.paperSessionId) : null;
      const currentOpenTrades = getPositiveNumber(req.body?.currentOpenTrades, 0);
      const currentDailyLoss = getPositiveNumber(req.body?.currentDailyLoss, 0);
      const riskProfile = riskProfileId
        ? parseRiskProfile(await dbGet('SELECT * FROM risk_profiles WHERE id = ?', [riskProfileId]))
        : null;

      if (riskProfileId && !riskProfile) {
        return res.status(400).json({ error: 'Risk profile not found' });
      }

      const intents = [];

      for (const leg of run.result?.recommendedDraftIntents || []) {
        const riskReview = evaluateOrderIntentRisk(riskProfile, {
          quantity: Number(leg.quantity),
          limitPrice: Number(leg.limitPrice),
          currentOpenTrades,
          currentDailyLoss
        });
        const payload = {
          mode: 'arbitrage_simulation_draft_intent_v1',
          warning: 'Draft order intent from a local arbitrage simulation only. This does not place live orders.',
          createdBy: 'local-cross-exchange-simulator',
          simulationRunId: run.id,
          simulationStatus: run.status,
          simulationLeg: leg,
          liveExecution: {
            enabled: false,
            orderEndpointEnabled: false,
            networkCallsEnabled: false
          },
          riskReview
        };
        const result = await dbRun(
          `INSERT INTO trade_order_intents
           (connector_id, risk_profile_id, strategy_id, paper_session_id, market_symbol, side, order_type, quantity, limit_price, status, reason, payload_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            null,
            riskProfileId,
            strategyId,
            paperSessionId,
            run.market_symbol,
            leg.side,
            leg.orderType,
            Number(leg.quantity),
            Number(leg.limitPrice),
            'draft',
            `${leg.reason} Venue: ${leg.venue}; chain: ${leg.chain}; simulation #${run.id}`.slice(0, 500),
            JSON.stringify(payload)
          ]
        );
        intents.push(parseOrderIntent(await getOrderIntentRow(result.lastID)));
      }

      res.status(201).json({
        run,
        intents,
        localOnly: true,
        liveExecutionEnabled: false,
        networkCallsEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/order-intents/rebalance-batches', requireAuth, async (req, res) => {
    try {
      const filters = [];
      const params = [];
      const status = String(req.query.status || '').trim().toLowerCase();
      const tokenEcosystemProjectId = req.query.tokenEcosystemProjectId
        ? Number(req.query.tokenEcosystemProjectId)
        : null;

      if (status && status !== 'all') {
        if (!allowedRebalanceBatchStatuses.has(status)) {
          return res.status(400).json({ error: 'Unsupported rebalance batch status filter.' });
        }
        filters.push('status = ?');
        params.push(status);
      }

      if (tokenEcosystemProjectId) {
        filters.push('token_ecosystem_project_id = ?');
        params.push(tokenEcosystemProjectId);
      }

      const rows = await dbAll(
        `SELECT *
         FROM rebalance_simulation_batches
         ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
         ORDER BY created_at DESC, id DESC
         LIMIT 100`,
        params
      );

      res.json({
        batches: rows.map(parseRebalanceSimulationBatch),
        filters: {
          status: status || 'all',
          tokenEcosystemProjectId
        },
        localOnly: true,
        liveExecutionEnabled: false,
        networkCallsEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/order-intents/rebalance-review-queue', requireAuth, async (req, res) => {
    try {
      const [batchRows, intentRows] = await Promise.all([
        dbAll(
          `SELECT *
           FROM rebalance_simulation_batches
           ORDER BY created_at DESC, id DESC
           LIMIT 50`
        ),
        dbAll(
          `SELECT trade_order_intents.*, exchange_connectors.label AS connector_label,
                  exchange_connectors.exchange_name, risk_profiles.name AS risk_profile_name,
                  trading_strategies.name AS strategy_name
           FROM trade_order_intents
           LEFT JOIN exchange_connectors ON exchange_connectors.id = trade_order_intents.connector_id
           LEFT JOIN risk_profiles ON risk_profiles.id = trade_order_intents.risk_profile_id
           LEFT JOIN trading_strategies ON trading_strategies.id = trade_order_intents.strategy_id
           ORDER BY trade_order_intents.created_at DESC
           LIMIT 500`
        )
      ]);
      const batches = batchRows.map(parseRebalanceSimulationBatch);
      const batchIds = new Set(batches.map(batch => Number(batch.id)));
      const intents = intentRows
        .map(parseOrderIntent)
        .filter(intent => (
          intent.payload?.mode === 'top_200_rebalance_batch_draft_intent_v1'
          && batchIds.has(Number(intent.payload?.rebalanceBatchId))
        ));

      res.json({
        queue: {
          batches,
          draftIntents: intents,
          summary: {
            batchCount: batches.length,
            draftIntentCount: intents.length,
            paperCandidateBatchCount: batches.filter(batch => batch.status === 'paper_candidate').length
          }
        },
        localOnly: true,
        liveExecutionEnabled: false,
        networkCallsEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/order-intents/rebalance-batches/:id/export', requireAuth, async (req, res) => {
    try {
      const batch = await getRebalanceSimulationBatch(req.params.id);

      if (!batch) {
        return res.status(404).json({ error: 'Rebalance simulation batch not found' });
      }

      res.json({
        batch,
        export: {
          filename: `etherealai-rebalance-batch-${batch.id}.csv`,
          csv: `${buildRebalanceBatchExportCsv(batch)}\n`,
          json: batch,
          localOnly: true,
          liveExecutionEnabled: false,
          networkCallsEnabled: false
        },
        localOnly: true,
        liveExecutionEnabled: false,
        networkCallsEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/order-intents/rebalance-batches/:id', requireAuth, async (req, res) => {
    try {
      const batch = await getRebalanceSimulationBatch(req.params.id);

      if (!batch) {
        return res.status(404).json({ error: 'Rebalance simulation batch not found' });
      }

      res.json({ batch });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/order-intents/rebalance-batches/:id', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Rebalance batch updates cannot store secrets.',
          sensitiveFields
        });
      }

      const batch = await getRebalanceSimulationBatch(req.params.id);

      if (!batch) {
        return res.status(404).json({ error: 'Rebalance simulation batch not found' });
      }

      const status = String(req.body?.status || '').trim().toLowerCase();

      if (!allowedRebalanceBatchStatuses.has(status)) {
        return res.status(400).json({ error: 'Unsupported rebalance batch status.' });
      }

      await dbRun(
        'UPDATE rebalance_simulation_batches SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, batch.id]
      );

      res.json({
        batch: await getRebalanceSimulationBatch(batch.id),
        localOnly: true,
        liveExecutionEnabled: false,
        networkCallsEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/order-intents/rebalance-batches', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Rebalance batch simulations cannot store secrets.',
          sensitiveFields
        });
      }

      const simulation = simulateTopRebalanceBatch(req.body || {});

      if (simulation.tokenEcosystemProjectId) {
        const project = await dbGet(
          'SELECT id FROM token_ecosystem_projects WHERE id = ?',
          [simulation.tokenEcosystemProjectId]
        );

        if (!project) {
          return res.status(400).json({ error: 'Token ecosystem project not found' });
        }
      }

      const result = await dbRun(
        `INSERT INTO rebalance_simulation_batches
         (user_id, token_ecosystem_project_id, name, strategy_type, status, input_json, result_json,
          local_only, network_calls_enabled, live_execution_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0)`,
        [
          req.session.userId || null,
          simulation.tokenEcosystemProjectId,
          simulation.name,
          simulation.strategyType,
          simulation.status,
          JSON.stringify(req.body || {}),
          JSON.stringify(simulation)
        ]
      );
      const batch = await getRebalanceSimulationBatch(result.lastID);

      res.status(201).json({
        simulation,
        batch,
        localOnly: true,
        liveExecutionEnabled: false,
        networkCallsEnabled: false
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/v1/order-intents/rebalance-batches/:id/draft-intents', requireAuth, async (req, res) => {
    try {
      const batch = await getRebalanceSimulationBatch(req.params.id);

      if (!batch) {
        return res.status(404).json({ error: 'Rebalance simulation batch not found' });
      }

      const riskProfileId = req.body?.riskProfileId ? Number(req.body.riskProfileId) : null;
      const strategyId = req.body?.strategyId ? Number(req.body.strategyId) : null;
      const paperSessionId = req.body?.paperSessionId ? Number(req.body.paperSessionId) : null;
      const botPlanId = req.body?.botPlanId ? Number(req.body.botPlanId) : null;
      const currentOpenTrades = getPositiveNumber(req.body?.currentOpenTrades, 0);
      const currentDailyLoss = getPositiveNumber(req.body?.currentDailyLoss, 0);
      const maxIntentPairs = Math.min(25, Math.max(1, Math.round(Number(req.body?.maxIntentPairs) || 10)));
      const riskProfile = riskProfileId
        ? parseRiskProfile(await dbGet('SELECT * FROM risk_profiles WHERE id = ?', [riskProfileId]))
        : null;

      if (riskProfileId && !riskProfile) {
        return res.status(400).json({ error: 'Risk profile not found' });
      }

      if (botPlanId) {
        const plan = await dbGet('SELECT id FROM bot_automation_plans WHERE id = ?', [botPlanId]);

        if (!plan) {
          return res.status(400).json({ error: 'Bot automation plan not found' });
        }
      }

      const intentGroups = (batch.result?.recommendedDraftIntentGroups || []).slice(0, maxIntentPairs);
      const intents = [];

      for (const group of intentGroups) {
        for (const leg of group.draftIntents || []) {
          const riskReview = evaluateOrderIntentRisk(riskProfile, {
            quantity: Number(leg.quantity),
            limitPrice: Number(leg.limitPrice),
            currentOpenTrades,
            currentDailyLoss
          });
          const payload = {
            mode: 'top_200_rebalance_batch_draft_intent_v1',
            warning: 'Draft order intent from a local top-200 rebalance batch only. This does not place live orders.',
            createdBy: 'local-top-200-rebalance-simulator',
            rebalanceBatchId: batch.id,
            tokenEcosystemProjectId: batch.token_ecosystem_project_id,
            botPlanId,
            batchStatus: batch.status,
            marketRankContext: {
              marketCapRank: group.marketCapRank,
              priceChangePercent24h: group.priceChangePercent24h,
              allocationUsd: group.allocationUsd,
              economics: group.economics
            },
            simulationLeg: leg,
            liveExecution: {
              enabled: false,
              orderEndpointEnabled: false,
              networkCallsEnabled: false
            },
            riskReview
          };
          const result = await dbRun(
            `INSERT INTO trade_order_intents
             (connector_id, risk_profile_id, strategy_id, paper_session_id, market_symbol, side, order_type, quantity, limit_price, status, reason, payload_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              null,
              riskProfileId,
              strategyId,
              paperSessionId,
              group.marketSymbol,
              leg.side,
              leg.orderType,
              Number(leg.quantity),
              Number(leg.limitPrice),
              'draft',
              `${leg.reason} Top-200 rebalance batch #${batch.id}; venue: ${leg.venue}; chain: ${leg.chain}`.slice(0, 500),
              JSON.stringify(payload)
            ]
          );
          intents.push(parseOrderIntent(await getOrderIntentRow(result.lastID)));
        }
      }

      res.status(201).json({
        batch,
        intents,
        localOnly: true,
        liveExecutionEnabled: false,
        networkCallsEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/order-intents/:id', requireAuth, async (req, res) => {
    try {
      const row = await getOrderIntentRow(req.params.id);

      if (!row) {
        return res.status(404).json({ error: 'Order intent not found' });
      }

      res.json({ intent: parseOrderIntent(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/order-intents/simulate-cross-exchange', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Cross-exchange simulations cannot store secrets.',
          sensitiveFields
        });
      }

      const simulation = simulateCrossExchangeArbitrage(req.body || {});
      const result = await dbRun(
        `INSERT INTO arbitrage_simulation_runs
         (user_id, market_symbol, strategy_type, status, input_json, result_json,
          local_only, network_calls_enabled, live_execution_enabled)
         VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0)`,
        [
          req.session.userId || null,
          simulation.marketSymbol,
          simulation.strategyType,
          simulation.status,
          JSON.stringify(req.body || {}),
          JSON.stringify(simulation)
        ]
      );
      const run = await getArbitrageSimulationRun(result.lastID);

      res.status(201).json({
        simulation,
        run,
        localOnly: true,
        liveExecutionEnabled: false,
        networkCallsEnabled: false
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
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
