const defaultReadline = require('readline');

function createMarketImportJobRuntime({
  fs,
  readline = defaultReadline,
  dbGet,
  dbRun,
  parseOhlcvCsv,
  parseOhlcvCsvLine,
  createMarketDataSummary,
  createStreamingMarketDataSummaryTracker,
  resolveMarketImportUploadPath,
  deleteMarketImportSourceFile,
  chunkSize = 500,
  setImmediateFn = setImmediate,
  logger = console
}) {
  let marketImportWorkerRunning = false;
  let marketImportWorkerScheduled = false;

  function waitForNextEventLoopTurn() {
    return new Promise(resolve => setImmediateFn(resolve));
  }

  async function insertMarketCandleBatch({
    importId,
    marketSymbol,
    timeframe,
    candles
  }) {
    for (const candle of candles) {
      await dbRun(
        `INSERT INTO market_candles
         (import_id, market_symbol, timeframe, timestamp, open, high, low, close, volume)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          importId,
          marketSymbol,
          timeframe,
          candle.timestamp,
          candle.open,
          candle.high,
          candle.low,
          candle.close,
          candle.volume
        ]
      );
    }
  }

  async function throwIfMarketImportCanceled(jobId) {
    const row = await dbGet(
      'SELECT status, cancel_requested FROM market_data_import_jobs WHERE id = ?',
      [jobId]
    );

    if (row?.cancel_requested || row?.status === 'canceling') {
      const error = new Error('Import canceled by owner');
      error.code = 'MARKET_IMPORT_CANCELED';
      throw error;
    }
  }

  async function insertMarketCandlesInChunks({
    importId,
    marketSymbol,
    timeframe,
    candles,
    onProgress = async () => {}
  }) {
    let processedRows = 0;

    for (let index = 0; index < candles.length; index += chunkSize) {
      const chunk = candles.slice(index, index + chunkSize);

      await insertMarketCandleBatch({
        importId,
        marketSymbol,
        timeframe,
        candles: chunk
      });
      processedRows += chunk.length;
      await onProgress(processedRows);
      await waitForNextEventLoopTurn();
    }
  }

  async function importCandlesFromCsvFile({
    sourceFilePath,
    importId,
    marketSymbol,
    timeframe,
    jobId
  }) {
    const safeSourcePath = resolveMarketImportUploadPath(sourceFilePath);
    const tracker = createStreamingMarketDataSummaryTracker(timeframe);
    const reader = readline.createInterface({
      input: fs.createReadStream(safeSourcePath),
      crlfDelay: Infinity
    });
    let sawFirstLine = false;
    let dataRowNumber = 0;
    let processedRows = 0;
    let chunk = [];

    const flushChunk = async () => {
      if (!chunk.length) {
        return;
      }

      await insertMarketCandleBatch({
        importId,
        marketSymbol,
        timeframe,
        candles: chunk
      });
      processedRows += chunk.length;
      chunk = [];

      await dbRun(
        `UPDATE market_data_import_jobs
         SET processed_rows = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [processedRows, jobId]
      );
      await throwIfMarketImportCanceled(jobId);
      await waitForNextEventLoopTurn();
    };

    for await (const rawLine of reader) {
      const line = String(rawLine || '').trim();

      if (!line) {
        continue;
      }

      if (!sawFirstLine) {
        sawFirstLine = true;

        if (/timestamp|open|high|low|close|volume/i.test(line)) {
          continue;
        }
      }

      dataRowNumber += 1;
      const candle = parseOhlcvCsvLine(line, dataRowNumber);
      tracker.add(candle);
      chunk.push(candle);

      if (chunk.length >= chunkSize) {
        await flushChunk();
      }
    }

    await flushChunk();

    if (!processedRows) {
      throw new Error('CSV has no candle rows');
    }

    return {
      candleCount: processedRows,
      summary: tracker.finish()
    };
  }

  async function processMarketDataImportJob(jobId) {
    const job = await dbGet('SELECT * FROM market_data_import_jobs WHERE id = ?', [jobId]);

    if (!job || !['queued', 'running', 'canceling'].includes(job.status)) {
      return;
    }

    if (job.cancel_requested || job.status === 'canceling') {
      await dbRun(
        `UPDATE market_data_import_jobs
         SET status = 'canceled',
             source_payload = NULL,
             source_file_path = NULL,
             updated_at = CURRENT_TIMESTAMP,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [job.id]
      );

      if (job.import_id) {
        await dbRun(
          `UPDATE market_data_imports
           SET status = 'archived'
           WHERE id = ?`,
          [job.import_id]
        );
        await dbRun('DELETE FROM market_candles WHERE import_id = ?', [job.import_id]);
      }

      await deleteMarketImportSourceFile(job.source_file_path);
      return;
    }

    if (job.status === 'running' && job.import_id) {
      await dbRun(
        `UPDATE market_data_import_jobs
         SET status = 'failed',
             error = ?,
             updated_at = CURRENT_TIMESTAMP,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        ['Import was interrupted while writing candles. Queue the dataset again to retry cleanly.', job.id]
      );
      await dbRun(
        `UPDATE market_data_imports
         SET status = 'archived'
         WHERE id = ?`,
        [job.import_id]
      );
      await dbRun('DELETE FROM market_candles WHERE import_id = ?', [job.import_id]);
      return;
    }

    const normalizedMarketSymbol = String(job.market_symbol || '').trim().toUpperCase();
    const normalizedTimeframe = String(job.timeframe || '').trim();
    const safeLabel = String(job.label || `${normalizedMarketSymbol} ${normalizedTimeframe} import`).trim().slice(0, 160);
    const safeNotes = String(job.notes || '').trim().slice(0, 2000);

    try {
      await dbRun(
        `UPDATE market_data_import_jobs
         SET status = 'running', error = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [job.id]
      );
      await throwIfMarketImportCanceled(job.id);

      const importSource = job.source_file_path ? 'manual_csv_upload' : 'manual_csv_background';
      const importResult = await dbRun(
        `INSERT INTO market_data_imports
         (label, market_symbol, timeframe, source, candle_count, status, quality_score, notes, summary_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          safeLabel,
          normalizedMarketSymbol,
          normalizedTimeframe,
          importSource,
          0,
          'importing',
          null,
          safeNotes,
          null
        ]
      );

      let candleCount = 0;
      let summary = null;

      await dbRun(
        `UPDATE market_data_import_jobs
         SET import_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [importResult.lastID, job.id]
      );

      if (job.source_file_path) {
        const fileImportResult = await importCandlesFromCsvFile({
          sourceFilePath: job.source_file_path,
          importId: importResult.lastID,
          marketSymbol: normalizedMarketSymbol,
          timeframe: normalizedTimeframe,
          jobId: job.id
        });
        candleCount = fileImportResult.candleCount;
        summary = fileImportResult.summary;
        await deleteMarketImportSourceFile(job.source_file_path);
      } else {
        const candles = parseOhlcvCsv(job.source_payload);
        summary = createMarketDataSummary(candles, normalizedTimeframe);
        candleCount = candles.length;

        await dbRun(
          `UPDATE market_data_import_jobs
           SET total_rows = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [candleCount, job.id]
        );

        await insertMarketCandlesInChunks({
          importId: importResult.lastID,
          marketSymbol: normalizedMarketSymbol,
          timeframe: normalizedTimeframe,
          candles,
          onProgress: async processedRows => {
            await dbRun(
              `UPDATE market_data_import_jobs
               SET processed_rows = ?, updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [processedRows, job.id]
            );
            await throwIfMarketImportCanceled(job.id);
          }
        });
      }

      await dbRun(
        `UPDATE market_data_imports
         SET candle_count = ?, status = 'imported', quality_score = ?, summary_json = ?
        WHERE id = ?`,
        [
          candleCount,
          summary.qualityScore,
          JSON.stringify(summary),
          importResult.lastID
        ]
      );

      await dbRun(
        `UPDATE market_data_import_jobs
         SET status = 'completed',
             processed_rows = ?,
             total_rows = ?,
             quality_score = ?,
             summary_json = ?,
             source_payload = NULL,
             source_file_path = NULL,
             updated_at = CURRENT_TIMESTAMP,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          candleCount,
          candleCount,
          summary.qualityScore,
          JSON.stringify(summary),
          job.id
        ]
      );
    } catch (error) {
      const canceled = error.code === 'MARKET_IMPORT_CANCELED';
      const refreshed = await dbGet('SELECT import_id FROM market_data_import_jobs WHERE id = ?', [job.id]);

      if (refreshed?.import_id) {
        await dbRun(
          `UPDATE market_data_imports
           SET status = 'archived'
           WHERE id = ?`,
          [refreshed.import_id]
        );
        await dbRun('DELETE FROM market_candles WHERE import_id = ?', [refreshed.import_id]);
      }

      if (canceled) {
        await dbRun(
          `UPDATE market_data_import_jobs
           SET status = 'canceled',
               error = ?,
               source_payload = NULL,
               source_file_path = NULL,
               updated_at = CURRENT_TIMESTAMP,
               completed_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [error.message, job.id]
        );
        await deleteMarketImportSourceFile(job.source_file_path);
      } else {
        await dbRun(
          `UPDATE market_data_import_jobs
           SET status = 'failed',
               error = ?,
               updated_at = CURRENT_TIMESTAMP,
               completed_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [error.message, job.id]
        );
      }
    }
  }

  async function processMarketImportQueue() {
    if (marketImportWorkerRunning) {
      return;
    }

    marketImportWorkerRunning = true;

    try {
      while (true) {
        const nextJob = await dbGet(
          `SELECT id
           FROM market_data_import_jobs
           WHERE status IN ('queued', 'running', 'canceling')
           ORDER BY created_at ASC, id ASC
           LIMIT 1`
        );

        if (!nextJob) {
          break;
        }

        await processMarketDataImportJob(nextJob.id);
      }
    } finally {
      marketImportWorkerRunning = false;
    }
  }

  function scheduleMarketImportWorker() {
    if (marketImportWorkerRunning || marketImportWorkerScheduled) {
      return;
    }

    marketImportWorkerScheduled = true;
    setImmediateFn(async () => {
      marketImportWorkerScheduled = false;

      try {
        await processMarketImportQueue();
      } catch (error) {
        logger.error(`Market import worker failed: ${error.message}`);
      }
    });
  }

  return {
    insertMarketCandleBatch,
    throwIfMarketImportCanceled,
    insertMarketCandlesInChunks,
    importCandlesFromCsvFile,
    processMarketDataImportJob,
    processMarketImportQueue,
    scheduleMarketImportWorker
  };
}

module.exports = {
  createMarketImportJobRuntime
};
