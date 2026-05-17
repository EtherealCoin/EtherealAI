function getNextBotAutomationRunAt(intervalMinutes, fromDate = new Date()) {
  const safeInterval = Math.max(Math.floor(Number(intervalMinutes) || 15), 1);

  return new Date(fromDate.getTime() + (safeInterval * 60 * 1000)).toISOString();
}

function createBotAutomationScheduleRuntime({
  dbAll,
  dbRun,
  parseBotAutomationSchedule,
  getBotAutomationScheduleRow,
  createBotAutomationPaperRun,
  createRequestError,
  botAutomationScheduleSelect,
  setTimeoutFn = setTimeout,
  workerDelayMs = 1000,
  logger = console
}) {
  let workerRunning = false;
  let workerScheduled = false;

  async function runBotAutomationSchedule(scheduleId, options = {}) {
    const schedule = parseBotAutomationSchedule(await getBotAutomationScheduleRow(scheduleId));

    if (!schedule) {
      throw createRequestError('Bot automation schedule not found', 404);
    }

    if (schedule.status === 'archived') {
      throw createRequestError('Archived bot automation schedules cannot run.');
    }

    if (!options.force && schedule.status !== 'active') {
      throw createRequestError('Only active bot automation schedules run automatically.');
    }

    try {
      const run = await createBotAutomationPaperRun(schedule.plan_id, schedule.settings || {});
      const nextRunAt = schedule.status === 'active'
        ? getNextBotAutomationRunAt(schedule.interval_minutes)
        : null;

      await dbRun(
        `UPDATE bot_automation_schedules
         SET last_run_id = ?,
             last_run_at = CURRENT_TIMESTAMP,
             next_run_at = ?,
             last_error = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [run.id, nextRunAt, schedule.id]
      );

      return {
        schedule: parseBotAutomationSchedule(await getBotAutomationScheduleRow(schedule.id)),
        run
      };
    } catch (error) {
      const nextRunAt = schedule.status === 'active'
        ? getNextBotAutomationRunAt(schedule.interval_minutes)
        : null;

      await dbRun(
        `UPDATE bot_automation_schedules
         SET last_error = ?,
             next_run_at = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [error.message, nextRunAt, schedule.id]
      );
      throw error;
    }
  }

  async function runDueBotAutomationSchedules() {
    if (workerRunning) {
      return;
    }

    workerRunning = true;

    try {
      const rows = await dbAll(
        `${botAutomationScheduleSelect}
         WHERE bot_automation_schedules.status = 'active'
           AND (bot_automation_schedules.next_run_at IS NULL
                OR bot_automation_schedules.next_run_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
         ORDER BY bot_automation_schedules.next_run_at ASC, bot_automation_schedules.created_at ASC
         LIMIT 10`
      );

      for (const row of rows) {
        try {
          await runBotAutomationSchedule(row.id);
        } catch (error) {
          logger.error(`Bot automation schedule #${row.id} failed: ${error.message}`);
        }
      }
    } finally {
      workerRunning = false;
    }
  }

  function scheduleBotAutomationWorker() {
    if (workerScheduled) {
      return;
    }

    workerScheduled = true;
    const timer = setTimeoutFn(async () => {
      workerScheduled = false;

      try {
        await runDueBotAutomationSchedules();
      } catch (error) {
        logger.error(`Bot automation worker failed: ${error.message}`);
      }
    }, workerDelayMs);

    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  return {
    runBotAutomationSchedule,
    runDueBotAutomationSchedules,
    scheduleBotAutomationWorker
  };
}

module.exports = {
  getNextBotAutomationRunAt,
  createBotAutomationScheduleRuntime
};
