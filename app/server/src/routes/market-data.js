function registerMarketDataRoutes(app, {
  fs,
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  findSensitiveFields,
  normalizeScheduleStatus,
  clampScheduleCandleCount,
  fetchProviderOhlcvCsv,
  getProviderHealthDefaults,
  parseOhlcvCsv,
  createMarketDataSummary,
  parseMarketImport,
  parseMarketImportJob,
  parseMarketDataProvider,
  parseMarketDataRefreshSchedule,
  parseMarketDataRefreshRun,
  createMarketImportUploadPath,
  saveMarketImportUpload,
  deleteMarketImportSourceFile,
  resolveMarketImportUploadPath,
  scheduleMarketImportWorker,
  normalizeOptionalIsoDate,
  createBackfillWindow,
  scheduleMarketRefreshWorker,
  runMarketDataRefreshSchedule,
  getMarketImportDependencyCount
}) {
  app.get('/api/v1/market-data/providers', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT *
         FROM market_data_providers
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 100`,
        [req.session.userId]
      );

      res.json({ providers: rows.map(parseMarketDataProvider) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/market-data/providers/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        'SELECT * FROM market_data_providers WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.userId]
      );

      if (!row) {
        return res.status(404).json({ error: 'Market-data provider not found' });
      }

      res.json({ provider: parseMarketDataProvider(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/market-data/providers/:id/health-check', requireAuth, async (req, res) => {
    try {
      const provider = await dbGet(
        'SELECT * FROM market_data_providers WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.userId]
      );

      if (!provider) {
        return res.status(404).json({ error: 'Market-data provider not found' });
      }

      if (provider.status !== 'active') {
        return res.status(400).json({ error: 'Only active market-data providers can be checked' });
      }

      const defaults = getProviderHealthDefaults(provider);
      const marketSymbol = String(req.body?.marketSymbol || defaults.marketSymbol).trim().toUpperCase();
      const timeframe = String(req.body?.timeframe || defaults.timeframe).trim();
      const lookbackCandles = Math.min(clampScheduleCandleCount(req.body?.lookbackCandles || 3, provider.provider_type), 10);
      const providerResult = await fetchProviderOhlcvCsv({
        id: 0,
        user_id: req.session.userId,
        provider_id: provider.id,
        provider_type: provider.provider_type,
        settings_json: provider.settings_json,
        market_symbol: marketSymbol,
        timeframe,
        lookback_candles: lookbackCandles
      });
      const candles = parseOhlcvCsv(providerResult.csvText);
      const summary = createMarketDataSummary(candles, timeframe);

      res.json({
        ok: true,
        provider: parseMarketDataProvider(provider),
        check: {
          source: providerResult.source,
          marketSymbol,
          timeframe,
          requestedCandles: lookbackCandles,
          returnedCandles: candles.length,
          summary
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/v1/market-data/providers', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Market-data provider records cannot store API keys, tokens, passwords, or secrets.',
          sensitiveFields
        });
      }

      const providerName = String(req.body?.providerName || '').trim().toLowerCase();
      const label = String(req.body?.label || providerName || 'Market data provider').trim().slice(0, 120);
      const providerType = String(req.body?.providerType || 'local_mock').trim().toLowerCase();
      const status = normalizeScheduleStatus(req.body?.status || 'active');
      const settings = req.body?.settings && typeof req.body.settings === 'object' && !Array.isArray(req.body.settings)
        ? req.body.settings
        : {};
      const allowedTypes = new Set(['local_mock', 'ccxt_planned', 'binance_public', 'coinbase_public', 'kraken_public', 'custom']);

      if (!providerName) {
        return res.status(400).json({ error: 'Provider name is required' });
      }

      if (!allowedTypes.has(providerType)) {
        return res.status(400).json({ error: 'Provider type must be local_mock, ccxt_planned, binance_public, coinbase_public, kraken_public, or custom' });
      }

      const result = await dbRun(
        `INSERT INTO market_data_providers
         (user_id, provider_name, label, provider_type, status, settings_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          providerName,
          label,
          providerType,
          status,
          JSON.stringify(settings)
        ]
      );
      const row = await dbGet('SELECT * FROM market_data_providers WHERE id = ?', [result.lastID]);

      res.status(201).json({ provider: parseMarketDataProvider(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/market-data/refresh-schedules', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT market_data_refresh_schedules.*, market_data_providers.label AS provider_label,
                market_data_providers.provider_name, market_data_providers.provider_type
         FROM market_data_refresh_schedules
         LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_schedules.provider_id
         WHERE market_data_refresh_schedules.user_id = ?
         ORDER BY market_data_refresh_schedules.created_at DESC
         LIMIT 100`,
        [req.session.userId]
      );

      res.json({ schedules: rows.map(parseMarketDataRefreshSchedule) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/market-data/refresh-schedules/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        `SELECT market_data_refresh_schedules.*, market_data_providers.label AS provider_label,
                market_data_providers.provider_name, market_data_providers.provider_type
         FROM market_data_refresh_schedules
         LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_schedules.provider_id
         WHERE market_data_refresh_schedules.id = ?
           AND market_data_refresh_schedules.user_id = ?`,
        [req.params.id, req.session.userId]
      );

      if (!row) {
        return res.status(404).json({ error: 'Market-data refresh schedule not found' });
      }

      res.json({ schedule: parseMarketDataRefreshSchedule(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/market-data/refresh-schedules/:id/history', requireAuth, async (req, res) => {
    try {
      const schedule = await dbGet(
        `SELECT market_data_refresh_schedules.*, market_data_providers.label AS provider_label,
                market_data_providers.provider_name, market_data_providers.provider_type
         FROM market_data_refresh_schedules
         LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_schedules.provider_id
         WHERE market_data_refresh_schedules.id = ?
           AND market_data_refresh_schedules.user_id = ?`,
        [req.params.id, req.session.userId]
      );

      if (!schedule) {
        return res.status(404).json({ error: 'Market-data refresh schedule not found' });
      }

      const rows = await dbAll(
        `SELECT market_data_refresh_runs.*, market_data_refresh_schedules.label AS schedule_label,
                market_data_providers.label AS provider_label,
                market_data_import_jobs.id AS job_id,
                market_data_import_jobs.status AS job_status,
                market_data_import_jobs.source AS job_source,
                market_data_import_jobs.total_rows AS job_total_rows,
                market_data_import_jobs.processed_rows AS job_processed_rows,
                market_data_import_jobs.quality_score AS job_quality_score,
                market_data_import_jobs.error AS job_error,
                market_data_import_jobs.completed_at AS job_completed_at,
                market_data_imports.id AS import_id,
                market_data_imports.label AS import_label,
                market_data_imports.status AS import_status,
                market_data_imports.candle_count AS import_candle_count,
                market_data_imports.quality_score AS import_quality_score,
                market_data_imports.created_at AS import_created_at,
                market_data_imports.summary_json AS import_summary_json
         FROM market_data_refresh_runs
         LEFT JOIN market_data_refresh_schedules ON market_data_refresh_schedules.id = market_data_refresh_runs.schedule_id
         LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_runs.provider_id
         LEFT JOIN market_data_import_jobs ON market_data_import_jobs.id = market_data_refresh_runs.import_job_id
         LEFT JOIN market_data_imports ON market_data_imports.id = market_data_import_jobs.import_id
         WHERE market_data_refresh_runs.schedule_id = ?
           AND market_data_refresh_runs.user_id = ?
         ORDER BY market_data_refresh_runs.created_at DESC, market_data_refresh_runs.id DESC
         LIMIT 100`,
        [schedule.id, req.session.userId]
      );
      const runs = rows.map(row => ({
        run: parseMarketDataRefreshRun(row),
        job: row.job_id ? {
          id: row.job_id,
          status: row.job_status,
          source: row.job_source,
          total_rows: row.job_total_rows,
          processed_rows: row.job_processed_rows,
          quality_score: row.job_quality_score,
          error: row.job_error,
          completed_at: row.job_completed_at
        } : null,
        import: row.import_id ? {
          id: row.import_id,
          label: row.import_label,
          status: row.import_status,
          candle_count: row.import_candle_count,
          quality_score: row.import_quality_score,
          created_at: row.import_created_at,
          summary: row.import_summary_json ? JSON.parse(row.import_summary_json) : null
        } : null
      }));
      const imports = runs.map(item => item.import).filter(Boolean);

      res.json({
        schedule: parseMarketDataRefreshSchedule(schedule),
        summary: {
          runCount: runs.length,
          failedRuns: runs.filter(item => item.run.status === 'failed').length,
          queuedImportRuns: runs.filter(item => item.run.status === 'queued_import').length,
          importCount: imports.length,
          activeImportCount: imports.filter(item => item.status !== 'archived').length,
          archivedImportCount: imports.filter(item => item.status === 'archived').length,
          latestImportId: imports[0]?.id || null,
          latestImportCreatedAt: imports[0]?.created_at || null,
          totalCandles: imports.reduce((sum, item) => sum + Number(item.candle_count || 0), 0)
        },
        runs
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/market-data/refresh-schedules', requireAuth, async (req, res) => {
    try {
      const providerId = Number(req.body?.providerId);
      const provider = await dbGet(
        'SELECT * FROM market_data_providers WHERE id = ? AND user_id = ?',
        [providerId, req.session.userId]
      );

      if (!provider) {
        return res.status(404).json({ error: 'Market-data provider not found' });
      }

      const marketSymbol = String(req.body?.marketSymbol || '').trim().toUpperCase();
      const timeframe = String(req.body?.timeframe || '').trim();
      const label = String(req.body?.label || `${marketSymbol} ${timeframe} refresh`).trim().slice(0, 120);
      const lookbackCandles = clampScheduleCandleCount(req.body?.lookbackCandles, provider.provider_type);
      const backfillStartAt = normalizeOptionalIsoDate(req.body?.backfillStartAt);
      const backfillEndAt = normalizeOptionalIsoDate(req.body?.backfillEndAt);
      const intervalMinutes = Math.min(Math.max(Number(req.body?.intervalMinutes) || 1440, 1), 525600);
      const status = normalizeScheduleStatus(req.body?.status || 'active');
      const nextRunAt = String(req.body?.nextRunAt || '').trim() || new Date().toISOString();

      if (!marketSymbol || !timeframe) {
        return res.status(400).json({ error: 'Market symbol and timeframe are required' });
      }

      createBackfillWindow(backfillStartAt, backfillEndAt);

      const result = await dbRun(
        `INSERT INTO market_data_refresh_schedules
         (user_id, provider_id, label, market_symbol, timeframe, lookback_candles, backfill_start_at, backfill_end_at, interval_minutes, status, next_run_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          providerId,
          label,
          marketSymbol,
          timeframe,
          lookbackCandles,
          backfillStartAt,
          backfillEndAt,
          intervalMinutes,
          status,
          nextRunAt
        ]
      );
      const row = await dbGet(
        `SELECT market_data_refresh_schedules.*, market_data_providers.label AS provider_label,
                market_data_providers.provider_name, market_data_providers.provider_type
         FROM market_data_refresh_schedules
         LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_schedules.provider_id
         WHERE market_data_refresh_schedules.id = ?`,
        [result.lastID]
      );

      scheduleMarketRefreshWorker();

      res.status(201).json({ schedule: parseMarketDataRefreshSchedule(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/v1/market-data/refresh-schedules/:id', requireAuth, async (req, res) => {
    try {
      const schedule = await dbGet(
        `SELECT market_data_refresh_schedules.*, market_data_providers.provider_type
         FROM market_data_refresh_schedules
         LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_schedules.provider_id
         WHERE market_data_refresh_schedules.id = ?
           AND market_data_refresh_schedules.user_id = ?`,
        [req.params.id, req.session.userId]
      );

      if (!schedule) {
        return res.status(404).json({ error: 'Market-data refresh schedule not found' });
      }

      const status = req.body?.status !== undefined
        ? normalizeScheduleStatus(req.body.status, schedule.status)
        : schedule.status;
      const nextRunAt = req.body?.nextRunAt !== undefined
        ? (String(req.body.nextRunAt || '').trim() || null)
        : schedule.next_run_at;
      const intervalMinutes = req.body?.intervalMinutes !== undefined
        ? Math.min(Math.max(Number(req.body.intervalMinutes) || schedule.interval_minutes, 1), 525600)
        : schedule.interval_minutes;
      const lookbackCandles = req.body?.lookbackCandles !== undefined
        ? clampScheduleCandleCount(req.body.lookbackCandles, schedule.provider_type)
        : schedule.lookback_candles;
      const backfillStartAt = req.body?.backfillStartAt !== undefined
        ? normalizeOptionalIsoDate(req.body.backfillStartAt)
        : schedule.backfill_start_at;
      const backfillEndAt = req.body?.backfillEndAt !== undefined
        ? normalizeOptionalIsoDate(req.body.backfillEndAt)
        : schedule.backfill_end_at;

      createBackfillWindow(backfillStartAt, backfillEndAt);

      await dbRun(
        `UPDATE market_data_refresh_schedules
         SET status = ?,
             next_run_at = ?,
             interval_minutes = ?,
             lookback_candles = ?,
             backfill_start_at = ?,
             backfill_end_at = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, nextRunAt, intervalMinutes, lookbackCandles, backfillStartAt, backfillEndAt, schedule.id]
      );

      if (status === 'active') {
        scheduleMarketRefreshWorker();
      }

      const row = await dbGet(
        `SELECT market_data_refresh_schedules.*, market_data_providers.label AS provider_label,
                market_data_providers.provider_name, market_data_providers.provider_type
         FROM market_data_refresh_schedules
         LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_schedules.provider_id
         WHERE market_data_refresh_schedules.id = ?`,
        [schedule.id]
      );

      res.json({ schedule: parseMarketDataRefreshSchedule(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/market-data/refresh-schedules/:id/run', requireAuth, async (req, res) => {
    try {
      const schedule = await dbGet(
        'SELECT * FROM market_data_refresh_schedules WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.userId]
      );

      if (!schedule) {
        return res.status(404).json({ error: 'Market-data refresh schedule not found' });
      }

      const run = await runMarketDataRefreshSchedule(schedule.id, 'manual');

      res.status(201).json({ run });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/v1/market-data/refresh-schedules/:id/cleanup', requireAuth, async (req, res) => {
    try {
      const schedule = await dbGet(
        'SELECT * FROM market_data_refresh_schedules WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.userId]
      );

      if (!schedule) {
        return res.status(404).json({ error: 'Market-data refresh schedule not found' });
      }

      const keepLatest = Math.min(Math.max(Number(req.body?.keepLatest) || 3, 1), 25);
      const rows = await dbAll(
        `SELECT market_data_refresh_runs.id AS run_id,
                market_data_import_jobs.id AS job_id,
                market_data_import_jobs.import_id,
                market_data_imports.label AS import_label,
                market_data_imports.status AS import_status,
                market_data_imports.candle_count,
                market_data_imports.summary_json,
                market_data_imports.created_at AS import_created_at
         FROM market_data_refresh_runs
         JOIN market_data_import_jobs ON market_data_import_jobs.id = market_data_refresh_runs.import_job_id
         JOIN market_data_imports ON market_data_imports.id = market_data_import_jobs.import_id
         WHERE market_data_refresh_runs.schedule_id = ?
           AND market_data_refresh_runs.user_id = ?
         ORDER BY market_data_imports.created_at DESC, market_data_imports.id DESC`,
        [schedule.id, req.session.userId]
      );
      const seenImportIds = new Set();
      const uniqueImports = rows.filter(row => {
        if (!row.import_id || seenImportIds.has(row.import_id)) {
          return false;
        }

        seenImportIds.add(row.import_id);
        return true;
      });
      const seenRangeKeys = new Map();
      const retained = [];
      const candidates = [];

      uniqueImports.forEach((item, index) => {
        let summary = {};

        try {
          summary = item.summary_json ? JSON.parse(item.summary_json) : {};
        } catch (error) {
          summary = {};
        }

        const hasTimestampRange = summary.firstTimestamp && summary.lastTimestamp;
        const rangeKey = hasTimestampRange
          ? `${summary.firstTimestamp}|${summary.lastTimestamp}|${item.candle_count}`
          : `import:${item.import_id}`;
        const duplicateOfImportId = seenRangeKeys.get(rangeKey) || null;

        if (!duplicateOfImportId) {
          seenRangeKeys.set(rangeKey, item.import_id);
        }

        const enriched = {
          ...item,
          rangeKey,
          firstTimestamp: summary.firstTimestamp || null,
          lastTimestamp: summary.lastTimestamp || null,
          duplicateOfImportId
        };

        if (index < keepLatest || !duplicateOfImportId) {
          retained.push({
            ...enriched,
            retainReason: index < keepLatest ? 'latest_keep_window' : 'distinct_timestamp_range'
          });
        } else {
          candidates.push(enriched);
        }
      });
      const archived = [];
      const skipped = [];

      for (const item of candidates) {
        const dependencyCount = await getMarketImportDependencyCount(item.import_id);

        if (dependencyCount) {
          skipped.push({
            importId: item.import_id,
            reason: 'referenced_by_research_artifacts',
            dependencyCount
          });
          continue;
        }

        if (item.import_status !== 'archived') {
          await dbRun(
            `UPDATE market_data_imports
             SET status = 'archived'
             WHERE id = ?`,
            [item.import_id]
          );
        }

        archived.push({
          importId: item.import_id,
          label: item.import_label,
          duplicateOfImportId: item.duplicateOfImportId,
          firstTimestamp: item.firstTimestamp,
          lastTimestamp: item.lastTimestamp,
          candleCount: item.candle_count,
          previousStatus: item.import_status
        });
      }

      res.json({
        cleanup: {
          scheduleId: schedule.id,
          keepLatest,
          retained: retained.map(item => ({
            importId: item.import_id,
            label: item.import_label,
            status: item.import_status,
            retainReason: item.retainReason,
            firstTimestamp: item.firstTimestamp,
            lastTimestamp: item.lastTimestamp,
            candleCount: item.candle_count,
            createdAt: item.import_created_at
          })),
          archived,
          skipped
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/market-data/refresh-runs', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT market_data_refresh_runs.*, market_data_refresh_schedules.label AS schedule_label,
                market_data_providers.label AS provider_label
         FROM market_data_refresh_runs
         LEFT JOIN market_data_refresh_schedules ON market_data_refresh_schedules.id = market_data_refresh_runs.schedule_id
         LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_runs.provider_id
         WHERE market_data_refresh_runs.user_id = ?
         ORDER BY market_data_refresh_runs.created_at DESC
         LIMIT 100`,
        [req.session.userId]
      );

      res.json({ runs: rows.map(parseMarketDataRefreshRun) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/market-data/refresh-runs/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet(
        `SELECT market_data_refresh_runs.*, market_data_refresh_schedules.label AS schedule_label,
                market_data_providers.label AS provider_label
         FROM market_data_refresh_runs
         LEFT JOIN market_data_refresh_schedules ON market_data_refresh_schedules.id = market_data_refresh_runs.schedule_id
         LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_runs.provider_id
         WHERE market_data_refresh_runs.id = ?
           AND market_data_refresh_runs.user_id = ?`,
        [req.params.id, req.session.userId]
      );

      if (!row) {
        return res.status(404).json({ error: 'Market-data refresh run not found' });
      }

      res.json({ run: parseMarketDataRefreshRun(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/market-data/imports', requireAuth, async (req, res) => {
    try {
      const {
        marketSymbol = '',
        timeframe = '',
        status = '',
        limit = 25,
        offset = 0
      } = req.query;
      const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
      const safeOffset = Math.max(Number(offset) || 0, 0);
      const where = [];
      const params = [];

      if (marketSymbol) {
        where.push('market_symbol = ?');
        params.push(String(marketSymbol).trim().toUpperCase());
      }

      if (timeframe) {
        where.push('timeframe = ?');
        params.push(String(timeframe).trim());
      }

      if (status) {
        where.push('status = ?');
        params.push(String(status).trim().toLowerCase());
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const [countRow, rows] = await Promise.all([
        dbGet(
          `SELECT COUNT(*) AS count
           FROM market_data_imports
           ${whereSql}`,
          params
        ),
        dbAll(
          `SELECT *
           FROM market_data_imports
           ${whereSql}
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`,
          [...params, safeLimit, safeOffset]
        )
      ]);

      res.json({
        page: {
          limit: safeLimit,
          offset: safeOffset,
          total: countRow.count,
          hasPrevious: safeOffset > 0,
          hasNext: safeOffset + safeLimit < countRow.count
        },
        imports: rows.map(parseMarketImport)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/market-data/import-jobs', requireAuth, async (req, res) => {
    try {
      const {
        status = '',
        limit = 10,
        offset = 0
      } = req.query;
      const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
      const safeOffset = Math.max(Number(offset) || 0, 0);
      const where = ['user_id = ?'];
      const params = [req.session.userId];

      if (status) {
        where.push('status = ?');
        params.push(String(status).trim().toLowerCase());
      }

      const whereSql = `WHERE ${where.join(' AND ')}`;
      const [countRow, rows] = await Promise.all([
        dbGet(
          `SELECT COUNT(*) AS count
           FROM market_data_import_jobs
           ${whereSql}`,
          params
        ),
        dbAll(
          `SELECT *
           FROM market_data_import_jobs
           ${whereSql}
           ORDER BY created_at DESC, id DESC
           LIMIT ? OFFSET ?`,
          [...params, safeLimit, safeOffset]
        )
      ]);

      res.json({
        page: {
          limit: safeLimit,
          offset: safeOffset,
          total: countRow.count,
          hasPrevious: safeOffset > 0,
          hasNext: safeOffset + safeLimit < countRow.count
        },
        jobs: rows.map(parseMarketImportJob)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/market-data/import-jobs/upload', requireAuth, async (req, res) => {
    const {
      label = '',
      marketSymbol,
      timeframe,
      notes = '',
      fileName = ''
    } = req.query;

    if (!marketSymbol || !timeframe) {
      return res.status(400).json({ error: 'Market symbol and timeframe are required' });
    }

    const normalizedMarketSymbol = String(marketSymbol).trim().toUpperCase();
    const normalizedTimeframe = String(timeframe).trim();
    const safeLabel = String(label || `${normalizedMarketSymbol} ${normalizedTimeframe} import`).trim().slice(0, 160);
    const safeNotes = String(notes || '').trim().slice(0, 2000);
    const sourceFileName = String(req.get('x-file-name') || fileName || 'candles.csv').slice(0, 180);
    const destinationPath = createMarketImportUploadPath(req.session.userId, sourceFileName);

    try {
      const uploadBytes = await saveMarketImportUpload(req, destinationPath);
      const result = await dbRun(
        `INSERT INTO market_data_import_jobs
         (user_id, label, market_symbol, timeframe, source, status, notes, source_file_path, source_file_name, upload_bytes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          safeLabel,
          normalizedMarketSymbol,
          normalizedTimeframe,
          'manual_csv_upload',
          'queued',
          safeNotes,
          destinationPath,
          sourceFileName,
          uploadBytes
        ]
      );

      scheduleMarketImportWorker();

      const job = parseMarketImportJob(await dbGet(
        'SELECT * FROM market_data_import_jobs WHERE id = ?',
        [result.lastID]
      ));

      res.status(202).json({ job });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/v1/market-data/import-jobs/:id/cancel', requireAuth, async (req, res) => {
    try {
      const job = await dbGet(
        'SELECT * FROM market_data_import_jobs WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.userId]
      );

      if (!job) {
        return res.status(404).json({ error: 'Market data import job not found' });
      }

      if (['completed', 'failed', 'canceled'].includes(job.status)) {
        return res.status(400).json({ error: `Job is already ${job.status}` });
      }

      if (job.status === 'queued') {
        await dbRun(
          `UPDATE market_data_import_jobs
           SET status = 'canceled',
               cancel_requested = 1,
               cancel_requested_at = CURRENT_TIMESTAMP,
               source_payload = NULL,
               source_file_path = NULL,
               updated_at = CURRENT_TIMESTAMP,
               completed_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [job.id]
        );
        await deleteMarketImportSourceFile(job.source_file_path);
      } else {
        await dbRun(
          `UPDATE market_data_import_jobs
           SET status = 'canceling',
               cancel_requested = 1,
               cancel_requested_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [job.id]
        );
        scheduleMarketImportWorker();
      }

      const updated = parseMarketImportJob(await dbGet(
        'SELECT * FROM market_data_import_jobs WHERE id = ?',
        [job.id]
      ));

      res.json({ job: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/market-data/import-jobs/:id/retry', requireAuth, async (req, res) => {
    try {
      const job = await dbGet(
        'SELECT * FROM market_data_import_jobs WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.userId]
      );

      if (!job) {
        return res.status(404).json({ error: 'Market data import job not found' });
      }

      if (job.status !== 'failed') {
        return res.status(400).json({ error: 'Only failed import jobs can be retried' });
      }

      if (!job.source_payload && !job.source_file_path) {
        return res.status(400).json({ error: 'This failed job no longer has a local source to retry. Queue the CSV again.' });
      }

      if (job.source_file_path) {
        const sourcePath = resolveMarketImportUploadPath(job.source_file_path);

        if (!fs.existsSync(sourcePath)) {
          return res.status(400).json({ error: 'The local upload file for this job is missing. Queue the CSV again.' });
        }
      }

      if (job.import_id) {
        await dbRun('DELETE FROM market_candles WHERE import_id = ?', [job.import_id]);
        await dbRun(
          `UPDATE market_data_imports
           SET status = 'archived'
           WHERE id = ?`,
          [job.import_id]
        );
      }

      await dbRun(
        `UPDATE market_data_import_jobs
         SET status = 'queued',
             import_id = NULL,
             total_rows = 0,
             processed_rows = 0,
             cancel_requested = 0,
             cancel_requested_at = NULL,
             quality_score = NULL,
             error = NULL,
             summary_json = NULL,
             retry_count = COALESCE(retry_count, 0) + 1,
             retried_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP,
             completed_at = NULL
         WHERE id = ?`,
        [job.id]
      );

      scheduleMarketImportWorker();

      const updated = parseMarketImportJob(await dbGet(
        'SELECT * FROM market_data_import_jobs WHERE id = ?',
        [job.id]
      ));

      res.status(202).json({ job: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/market-data/import-jobs/:id/discard-source', requireAuth, async (req, res) => {
    try {
      const job = await dbGet(
        'SELECT * FROM market_data_import_jobs WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.userId]
      );

      if (!job) {
        return res.status(404).json({ error: 'Market data import job not found' });
      }

      if (job.status !== 'failed') {
        return res.status(400).json({ error: 'Only failed import jobs can discard retained source data' });
      }

      if (!job.source_payload && !job.source_file_path) {
        return res.status(400).json({ error: 'This failed job has no retained source data' });
      }

      await deleteMarketImportSourceFile(job.source_file_path);
      await dbRun(
        `UPDATE market_data_import_jobs
         SET source_payload = NULL,
             source_file_path = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [job.id]
      );

      const updated = parseMarketImportJob(await dbGet(
        'SELECT * FROM market_data_import_jobs WHERE id = ?',
        [job.id]
      ));

      res.json({ job: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/market-data/import-jobs/:id', requireAuth, async (req, res) => {
    try {
      const job = parseMarketImportJob(await dbGet(
        'SELECT * FROM market_data_import_jobs WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.userId]
      ));

      if (!job) {
        return res.status(404).json({ error: 'Market data import job not found' });
      }

      res.json({ job });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/market-data/import-jobs', requireAuth, async (req, res) => {
    const {
      label = '',
      marketSymbol,
      timeframe,
      notes = '',
      csvText
    } = req.body;

    if (!marketSymbol || !timeframe || !csvText) {
      return res.status(400).json({ error: 'Market symbol, timeframe, and CSV text are required' });
    }

    try {
      const normalizedMarketSymbol = String(marketSymbol).trim().toUpperCase();
      const normalizedTimeframe = String(timeframe).trim();
      const safeLabel = String(label || `${normalizedMarketSymbol} ${normalizedTimeframe} import`).trim().slice(0, 160);
      const safeNotes = String(notes || '').trim().slice(0, 2000);
      const sourcePayload = String(csvText || '').trim();

      if (!sourcePayload) {
        return res.status(400).json({ error: 'CSV text is required' });
      }

      const result = await dbRun(
        `INSERT INTO market_data_import_jobs
         (user_id, label, market_symbol, timeframe, source, status, notes, source_payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.userId,
          safeLabel,
          normalizedMarketSymbol,
          normalizedTimeframe,
          'manual_csv_background',
          'queued',
          safeNotes,
          sourcePayload
        ]
      );

      scheduleMarketImportWorker();

      const job = parseMarketImportJob(await dbGet(
        'SELECT * FROM market_data_import_jobs WHERE id = ?',
        [result.lastID]
      ));

      res.status(202).json({ job });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/v1/market-data/imports/:id', requireAuth, async (req, res) => {
    try {
      const marketImport = parseMarketImport(await dbGet(
        'SELECT * FROM market_data_imports WHERE id = ?',
        [req.params.id]
      ));

      if (!marketImport) {
        return res.status(404).json({ error: 'Market data import not found' });
      }

      res.json({ import: marketImport });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/market-data/imports', requireAuth, async (req, res) => {
    const {
      label = '',
      marketSymbol,
      timeframe,
      notes = '',
      csvText
    } = req.body;

    if (!marketSymbol || !timeframe || !csvText) {
      return res.status(400).json({ error: 'Market symbol, timeframe, and CSV text are required' });
    }

    try {
      const candles = parseOhlcvCsv(csvText);
      const normalizedMarketSymbol = marketSymbol.trim().toUpperCase();
      const normalizedTimeframe = timeframe.trim();
      const summary = createMarketDataSummary(candles, normalizedTimeframe);
      const safeLabel = String(label || `${normalizedMarketSymbol} ${normalizedTimeframe} import`).trim().slice(0, 160);
      const importResult = await dbRun(
        `INSERT INTO market_data_imports
         (label, market_symbol, timeframe, source, candle_count, status, quality_score, notes, summary_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          safeLabel,
          normalizedMarketSymbol,
          normalizedTimeframe,
          'manual_csv',
          candles.length,
          'imported',
          summary.qualityScore,
          String(notes || '').trim().slice(0, 2000),
          JSON.stringify(summary)
        ]
      );

      for (const candle of candles) {
        await dbRun(
          `INSERT INTO market_candles
           (import_id, market_symbol, timeframe, timestamp, open, high, low, close, volume)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            importResult.lastID,
            normalizedMarketSymbol,
            normalizedTimeframe,
            candle.timestamp,
            candle.open,
            candle.high,
            candle.low,
            candle.close,
            candle.volume
          ]
        );
      }

      const marketImport = await dbGet(
        'SELECT * FROM market_data_imports WHERE id = ?',
        [importResult.lastID]
      );

      res.status(201).json({ import: parseMarketImport(marketImport) });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/v1/market-data/imports/:id', requireAuth, async (req, res) => {
    try {
      const current = await dbGet('SELECT * FROM market_data_imports WHERE id = ?', [req.params.id]);

      if (!current) {
        return res.status(404).json({ error: 'Market data import not found' });
      }

      const allowedStatus = new Set(['imported', 'archived', 'review']);
      const nextLabel = String(req.body?.label ?? current.label ?? '').trim().slice(0, 160);
      const nextNotes = String(req.body?.notes ?? current.notes ?? '').trim().slice(0, 2000);
      const nextStatus = String(req.body?.status ?? current.status ?? 'imported').trim().toLowerCase();

      if (!allowedStatus.has(nextStatus)) {
        return res.status(400).json({ error: 'Status must be imported, archived, or review' });
      }

      await dbRun(
        `UPDATE market_data_imports
         SET label = ?, notes = ?, status = ?
         WHERE id = ?`,
        [
          nextLabel || current.label || `${current.market_symbol} ${current.timeframe} import`,
          nextNotes,
          nextStatus,
          req.params.id
        ]
      );

      const updated = await dbGet('SELECT * FROM market_data_imports WHERE id = ?', [req.params.id]);

      res.json({ import: parseMarketImport(updated) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/v1/market-data/imports/:id', requireAuth, async (req, res) => {
    try {
      const marketImport = await dbGet(
        'SELECT * FROM market_data_imports WHERE id = ?',
        [req.params.id]
      );

      if (!marketImport) {
        return res.status(404).json({ error: 'Market data import not found' });
      }

      if (marketImport.status !== 'archived') {
        return res.status(400).json({ error: 'Only archived market imports can be deleted' });
      }

      const dependencyCount = await getMarketImportDependencyCount(marketImport.id);

      if (dependencyCount) {
        return res.status(400).json({
          error: 'Archived import is still referenced by saved research artifacts and cannot be deleted.',
          dependencyCount
        });
      }

      const candleDelete = await dbRun(
        'DELETE FROM market_candles WHERE import_id = ?',
        [marketImport.id]
      );
      await dbRun(
        `UPDATE market_data_import_jobs
         SET import_id = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE import_id = ?`,
        [marketImport.id]
      );
      await dbRun('DELETE FROM market_data_imports WHERE id = ?', [marketImport.id]);

      res.json({
        deleted: {
          importId: marketImport.id,
          candleRows: candleDelete.changes
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/market-data/imports/:id/candles', requireAuth, async (req, res) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 1000);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const [countRow, rows] = await Promise.all([
        dbGet('SELECT COUNT(*) AS count FROM market_candles WHERE import_id = ?', [req.params.id]),
        dbAll(
          `SELECT timestamp, open, high, low, close, volume
           FROM market_candles
           WHERE import_id = ?
           ORDER BY timestamp ASC
           LIMIT ? OFFSET ?`,
          [req.params.id, limit, offset]
        )
      ]);

      res.json({
        page: {
          importId: Number(req.params.id),
          limit,
          offset,
          total: countRow.count,
          hasPrevious: offset > 0,
          hasNext: offset + limit < countRow.count
        },
        candles: rows
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerMarketDataRoutes
};
