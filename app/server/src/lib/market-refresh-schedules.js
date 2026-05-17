function createMarketRefreshScheduleRuntime({
  dbGet,
  dbAll,
  dbRun,
  fetchProviderOhlcvCsv,
  clampScheduleCandleCount,
  getProviderCandleLimit,
  addMinutesToIso,
  parseMarketDataRefreshRun,
  scheduleMarketImportWorker,
  setImmediateFn = setImmediate,
  logger = console
}) {
  let workerRunning = false;
  let workerScheduled = false;

  async function runMarketDataRefreshSchedule(scheduleId, triggerType = 'manual') {
    const schedule = await dbGet(
      `SELECT market_data_refresh_schedules.*, market_data_providers.label AS provider_label,
              market_data_providers.provider_name, market_data_providers.provider_type,
              market_data_providers.status AS provider_status,
              market_data_providers.settings_json
       FROM market_data_refresh_schedules
       JOIN market_data_providers ON market_data_providers.id = market_data_refresh_schedules.provider_id
       WHERE market_data_refresh_schedules.id = ?`,
      [scheduleId]
    );

    if (!schedule) {
      throw new Error('Market-data refresh schedule not found');
    }

    if (schedule.status === 'disabled' || (triggerType === 'scheduled' && schedule.status !== 'active')) {
      throw new Error('Refresh schedule is not active');
    }

    if (schedule.provider_status !== 'active') {
      throw new Error('Market-data provider is not active');
    }

    const runResult = await dbRun(
      `INSERT INTO market_data_refresh_runs
       (user_id, schedule_id, provider_id, status, trigger_type, message, payload_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        schedule.user_id,
        schedule.id,
        schedule.provider_id,
        'running',
        triggerType,
        'Refresh run started.',
        JSON.stringify({
          marketSymbol: schedule.market_symbol,
          timeframe: schedule.timeframe,
          providerType: schedule.provider_type,
          requestedCandles: clampScheduleCandleCount(schedule.lookback_candles, schedule.provider_type),
          providerCandleLimit: getProviderCandleLimit(schedule.provider_type),
          backfillStartAt: schedule.backfill_start_at || null,
          backfillEndAt: schedule.backfill_end_at || null
        })
      ]
    );
    const runId = runResult.lastID;
    const now = new Date();

    try {
      const providerResult = await fetchProviderOhlcvCsv(schedule);
      const importJobResult = await dbRun(
        `INSERT INTO market_data_import_jobs
         (user_id, label, market_symbol, timeframe, source, status, notes, source_payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          schedule.user_id,
          `${schedule.label} refresh ${now.toISOString()}`,
          schedule.market_symbol,
          schedule.timeframe,
          providerResult.source,
          'queued',
          `Scheduled refresh #${schedule.id} from provider ${schedule.provider_label || schedule.provider_name}.`,
          providerResult.csvText
        ]
      );

      await dbRun(
        `UPDATE market_data_refresh_runs
         SET status = 'queued_import',
             import_job_id = ?,
             message = ?,
             payload_json = ?,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          importJobResult.lastID,
          `Queued market-data import job #${importJobResult.lastID}.`,
          JSON.stringify({
            marketSymbol: schedule.market_symbol,
            timeframe: schedule.timeframe,
            providerType: schedule.provider_type,
            requestedCandles: clampScheduleCandleCount(schedule.lookback_candles, schedule.provider_type),
            providerCandleLimit: getProviderCandleLimit(schedule.provider_type),
            backfillStartAt: schedule.backfill_start_at || null,
            backfillEndAt: schedule.backfill_end_at || null,
            source: providerResult.source,
            importJobId: importJobResult.lastID
          }),
          runId
        ]
      );

      await dbRun(
        `UPDATE market_data_refresh_schedules
         SET last_run_at = CURRENT_TIMESTAMP,
             next_run_at = ?,
             last_run_id = ?,
             last_import_job_id = ?,
             last_error = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          addMinutesToIso(schedule.interval_minutes, now),
          runId,
          importJobResult.lastID,
          schedule.id
        ]
      );

      scheduleMarketImportWorker();

      return parseMarketDataRefreshRun(await dbGet(
        `SELECT market_data_refresh_runs.*, market_data_refresh_schedules.label AS schedule_label,
                market_data_providers.label AS provider_label
         FROM market_data_refresh_runs
         LEFT JOIN market_data_refresh_schedules ON market_data_refresh_schedules.id = market_data_refresh_runs.schedule_id
         LEFT JOIN market_data_providers ON market_data_providers.id = market_data_refresh_runs.provider_id
         WHERE market_data_refresh_runs.id = ?`,
        [runId]
      ));
    } catch (error) {
      await dbRun(
        `UPDATE market_data_refresh_runs
         SET status = 'failed',
             message = ?,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [error.message, runId]
      );
      await dbRun(
        `UPDATE market_data_refresh_schedules
         SET last_run_at = CURRENT_TIMESTAMP,
             next_run_at = ?,
             last_run_id = ?,
             last_error = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          addMinutesToIso(schedule.interval_minutes, now),
          runId,
          error.message,
          schedule.id
        ]
      );

      throw error;
    }
  }

  async function processDueMarketDataRefreshSchedules() {
    if (workerRunning) {
      return;
    }

    workerRunning = true;

    try {
      const rows = await dbAll(
        `SELECT id
         FROM market_data_refresh_schedules
         WHERE status = 'active'
           AND (next_run_at IS NULL OR datetime(next_run_at) <= datetime('now'))
         ORDER BY COALESCE(next_run_at, created_at) ASC, id ASC
         LIMIT 5`
      );

      for (const row of rows) {
        try {
          await runMarketDataRefreshSchedule(row.id, 'scheduled');
        } catch (error) {
          logger.error(`Market data refresh schedule #${row.id} failed: ${error.message}`);
        }
      }
    } finally {
      workerRunning = false;
    }
  }

  function scheduleMarketRefreshWorker() {
    if (workerRunning || workerScheduled) {
      return;
    }

    workerScheduled = true;
    setImmediateFn(async () => {
      workerScheduled = false;

      try {
        await processDueMarketDataRefreshSchedules();
      } catch (error) {
        logger.error(`Market refresh worker failed: ${error.message}`);
      }
    });
  }

  return {
    runMarketDataRefreshSchedule,
    processDueMarketDataRefreshSchedules,
    scheduleMarketRefreshWorker
  };
}

module.exports = {
  createMarketRefreshScheduleRuntime
};
