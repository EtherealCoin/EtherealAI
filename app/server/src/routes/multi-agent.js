function registerMultiAgentRoutes(app, {
  requireAuth,
  dbAll,
  dbRun,
  readModelConfig,
  generateWithLocalModel,
  getMlxLifecycleStatus,
  startMlxLifecycle,
  getAgentRegistry,
  buildAgentPrompt,
  buildPlanOnlyContribution,
  buildCoordinationSummary,
  buildHermesBenchmarkPlan,
  limitText,
  normalizeExecutionMode,
  normalizeProviderMode,
  normalizeSelectedAgents,
  parseMultiAgentRun,
  parseMultiAgentContribution,
  safetyGates
}) {
  async function insertContribution(runId, contribution) {
    await dbRun(
      `INSERT INTO multi_agent_contributions (
        run_id,
        agent_id,
        agent_label,
        model_role,
        provider,
        model,
        status,
        prompt,
        response,
        duration_ms,
        error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        runId,
        contribution.agentId,
        contribution.agentLabel,
        contribution.modelRole,
        contribution.provider,
        contribution.model,
        contribution.status,
        contribution.prompt,
        contribution.response,
        contribution.durationMs,
        contribution.error
      ]
    );
  }

  async function loadRuns(limit = 10) {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const rows = await dbAll(
      'SELECT * FROM multi_agent_coordination_runs ORDER BY created_at DESC, id DESC LIMIT ?',
      [safeLimit]
    );
    const runIds = rows.map(row => row.id);
    const contributionRows = runIds.length
      ? await dbAll(
        `SELECT * FROM multi_agent_contributions
         WHERE run_id IN (${runIds.map(() => '?').join(',')})
         ORDER BY created_at ASC, id ASC`,
        runIds
      )
      : [];
    const contributionsByRun = contributionRows.reduce((groups, row) => {
      groups[row.run_id] = groups[row.run_id] || [];
      groups[row.run_id].push(parseMultiAgentContribution(row));
      return groups;
    }, {});

    return rows.map(row => ({
      ...parseMultiAgentRun(row),
      contributions: contributionsByRun[row.id] || []
    }));
  }

  app.get('/api/v1/multi-agent/registry', requireAuth, (req, res) => {
    try {
      const modelConfig = readModelConfig();

      res.json({
        ok: true,
        localOnly: true,
        liveExecutionEnabled: false,
        agents: getAgentRegistry(modelConfig),
        safetyGates,
        hermesBenchmarkPlan: buildHermesBenchmarkPlan({ modelConfig })
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/multi-agent/runs', requireAuth, async (req, res) => {
    try {
      res.json({
        ok: true,
        runs: await loadRuns(req.query.limit)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/multi-agent/runs', requireAuth, async (req, res) => {
    try {
      const objective = limitText(req.body?.objective, 2000);
      const context = limitText(req.body?.context, 4000);
      const executionMode = normalizeExecutionMode(req.body?.executionMode);
      const providerMode = normalizeProviderMode(req.body?.providerMode);
      const selectedAgentIds = normalizeSelectedAgents(req.body?.selectedAgents);
      const modelConfig = readModelConfig();
      const registry = getAgentRegistry(modelConfig);
      const selectedAgents = selectedAgentIds
        .map(agentId => registry.find(agent => agent.id === agentId))
        .filter(Boolean);
      const summary = buildCoordinationSummary({
        selectedAgentIds,
        executionMode,
        providerMode
      });
      const maxTokens = Math.min(Math.max(Number(req.body?.maxTokens) || 220, 80), 600);

      if (!objective) {
        return res.status(400).json({ error: 'A coordination objective is required' });
      }

      if (executionMode === 'local_model_draft' && selectedAgents.length > 3) {
        return res.status(400).json({
          error: 'Local model draft mode is limited to 3 agents per run. Use plan_only for full-board planning.'
        });
      }

      if (executionMode === 'local_model_draft' && providerMode === 'mlx_fast_lane' && startMlxLifecycle) {
        const mlxStatus = getMlxLifecycleStatus ? await getMlxLifecycleStatus() : { ok: false };

        if (!mlxStatus.ok) {
          await startMlxLifecycle({ unloadOllama: true });
        }
      }

      const runInsert = await dbRun(
        `INSERT INTO multi_agent_coordination_runs (
          objective,
          context,
          status,
          execution_mode,
          provider_mode,
          selected_agents_json,
          safety_gates_json,
          summary_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          objective,
          context,
          executionMode === 'local_model_draft' ? 'running' : 'planned',
          executionMode,
          providerMode,
          JSON.stringify(selectedAgentIds),
          JSON.stringify(safetyGates),
          JSON.stringify(summary)
        ]
      );
      const runId = runInsert.lastID;

      for (const agent of selectedAgents) {
        const planned = buildPlanOnlyContribution({
          agent,
          objective,
          context,
          registry,
          providerMode,
          modelConfig
        });

        if (executionMode !== 'local_model_draft') {
          await insertContribution(runId, planned);
          continue;
        }

        const startedAt = Date.now();
        const provider = providerMode === 'mlx_fast_lane' ? 'mlx' : undefined;
        const model = providerMode === 'mlx_fast_lane'
          ? modelConfig.providers?.mlx?.lifecycle?.model
          : undefined;

        try {
          const generated = await generateWithLocalModel(agent.modelRole, planned.prompt, {
            provider,
            model,
            maxTokens,
            timeoutMs: 180000,
            think: agent.modelRole === 'coder' ? false : undefined
          });
          await insertContribution(runId, {
            ...planned,
            provider: generated.provider,
            model: generated.model,
            status: 'generated',
            response: generated.response || 'No model response returned.',
            durationMs: Date.now() - startedAt,
            error: null
          });
        } catch (error) {
          await insertContribution(runId, {
            ...planned,
            status: 'failed',
            response: null,
            durationMs: Date.now() - startedAt,
            error: error.name === 'AbortError' ? 'Local model coordination timed out' : error.message
          });
        }
      }

      await dbRun(
        `UPDATE multi_agent_coordination_runs
         SET status = ?
         WHERE id = ?`,
        [executionMode === 'local_model_draft' ? 'generated' : 'planned', runId]
      );

      const runs = await loadRuns(1);
      res.status(201).json({
        ok: true,
        run: runs.find(run => run.id === runId) || runs[0]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerMultiAgentRoutes
};
