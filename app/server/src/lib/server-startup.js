function startEtherealServer({
  app,
  port,
  host = '127.0.0.1',
  recordDevServerStart,
  updateDevServerHeartbeat,
  scheduleMarketImportWorker,
  scheduleMarketRefreshWorker,
  scheduleBotAutomationWorker,
  marketRefreshPollMs,
  botAutomationSchedulePollMs,
  setIntervalFn = setInterval,
  logger = console
}) {
  return app.listen(port, host, () => {
    logger.log(`Server running on ${host}:${port}`);

    recordDevServerStart().catch(error => {
      logger.error(`Unable to record dev server start: ${error.message}`);
    });

    scheduleMarketImportWorker();
    scheduleMarketRefreshWorker();
    scheduleBotAutomationWorker();

    const heartbeatTimer = setIntervalFn(() => {
      updateDevServerHeartbeat().catch(error => {
        logger.error(`Unable to update dev server heartbeat: ${error.message}`);
      });
    }, 30000);

    if (typeof heartbeatTimer.unref === 'function') {
      heartbeatTimer.unref();
    }

    const refreshTimer = setIntervalFn(() => {
      scheduleMarketRefreshWorker();
    }, marketRefreshPollMs);

    if (typeof refreshTimer.unref === 'function') {
      refreshTimer.unref();
    }

    const botAutomationTimer = setIntervalFn(() => {
      scheduleBotAutomationWorker();
    }, botAutomationSchedulePollMs);

    if (typeof botAutomationTimer.unref === 'function') {
      botAutomationTimer.unref();
    }
  });
}

module.exports = {
  startEtherealServer
};
