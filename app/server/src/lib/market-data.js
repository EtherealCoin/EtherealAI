const MARKET_PROVIDER_CANDLE_LIMITS = {
  local_mock: 5000,
  binance_public: 5000,
  coinbase_public: 5000,
  kraken_public: 720
};
const PUBLIC_MARKET_DATA_FETCH_TIMEOUT_MS = 20000;

function roundNumber(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(Number(value || 0) * factor) / factor;
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function getProviderCandleLimit(providerType) {
  return MARKET_PROVIDER_CANDLE_LIMITS[providerType] || 5000;
}

function parseMarketDataProvider(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    provider_name: row.provider_name,
    label: row.label,
    provider_type: row.provider_type,
    provider_candle_limit: getProviderCandleLimit(row.provider_type),
    status: row.status,
    settings: JSON.parse(row.settings_json || '{}'),
    secret_storage_note: row.secret_storage_note,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function parseMarketDataRefreshSchedule(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    provider_id: row.provider_id,
    label: row.label,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe,
    lookback_candles: row.lookback_candles,
    backfill_start_at: row.backfill_start_at,
    backfill_end_at: row.backfill_end_at,
    interval_minutes: row.interval_minutes,
    status: row.status,
    last_run_at: row.last_run_at,
    next_run_at: row.next_run_at,
    last_run_id: row.last_run_id,
    last_import_job_id: row.last_import_job_id,
    last_error: row.last_error,
    created_at: row.created_at,
    updated_at: row.updated_at,
    provider_label: row.provider_label,
    provider_name: row.provider_name,
    provider_type: row.provider_type,
    provider_candle_limit: getProviderCandleLimit(row.provider_type)
  };
}

function parseMarketDataRefreshRun(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    schedule_id: row.schedule_id,
    provider_id: row.provider_id,
    import_job_id: row.import_job_id,
    status: row.status,
    trigger_type: row.trigger_type,
    message: row.message,
    payload: JSON.parse(row.payload_json || '{}'),
    started_at: row.started_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    schedule_label: row.schedule_label,
    provider_label: row.provider_label
  };
}

function parseMarketImport(row) {
  if (!row) {
    return null;
  }

  const summary = row.summary_json ? JSON.parse(row.summary_json) : null;
  const derivedQualityScore = summary
    ? Math.max(
      0,
      100 -
        ((summary.duplicateTimestamps || 0) * 10) -
        ((summary.outOfOrderRows || 0) * 10) -
        ((summary.gapCount || 0) * 5) -
        ((summary.invalidShapeRows || 0) * 15)
    )
    : null;

  return {
    ...row,
    label: row.label || `${row.market_symbol} ${row.timeframe} import`,
    quality_score: row.quality_score ?? summary?.qualityScore ?? derivedQualityScore,
    summary,
    summary_json: undefined
  };
}

function parseMarketImportJob(row) {
  if (!row) {
    return null;
  }

  const summary = row.summary_json ? JSON.parse(row.summary_json) : null;
  const totalRows = Number(row.total_rows || 0);
  const processedRows = Number(row.processed_rows || 0);

  return {
    id: row.id,
    user_id: row.user_id,
    import_id: row.import_id,
    label: row.label || `${row.market_symbol} ${row.timeframe} background import`,
    market_symbol: row.market_symbol,
    timeframe: row.timeframe,
    source: row.source,
    status: row.status,
    total_rows: totalRows,
    processed_rows: processedRows,
    progress_percent: totalRows ? roundNumber((processedRows / totalRows) * 100, 2) : 0,
    cancel_requested: Boolean(row.cancel_requested),
    cancel_requested_at: row.cancel_requested_at,
    retry_count: row.retry_count || 0,
    retried_at: row.retried_at,
    retry_available: row.status === 'failed' && Boolean(row.source_payload || row.source_file_path),
    source_retained: Boolean(row.source_payload || row.source_file_path),
    quality_score: row.quality_score ?? summary?.qualityScore ?? null,
    notes: row.notes,
    error: row.error,
    source_file_name: row.source_file_name,
    upload_bytes: row.upload_bytes || 0,
    summary,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at
  };
}

function timeframeToMs(timeframe) {
  const match = String(timeframe || '').trim().toLowerCase().match(/^(\d+)\s*([mhdw])$/);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  return amount * multipliers[unit];
}

function addMinutesToIso(minutes, baseDate = new Date()) {
  return new Date(baseDate.getTime() + (minutes * 60 * 1000)).toISOString();
}

function normalizeScheduleStatus(value, fallback = 'active') {
  const status = String(value || fallback).trim().toLowerCase();
  const allowed = new Set(['active', 'paused', 'disabled']);

  return allowed.has(status) ? status : fallback;
}

function normalizeOptionalIsoDate(value) {
  const raw = String(value || '').trim();

  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Backfill dates must be valid dates or ISO timestamps');
  }

  return parsed.toISOString();
}

function clampScheduleCandleCount(value, providerType) {
  const providerLimit = getProviderCandleLimit(providerType);
  const requested = Number(value) || 100;

  return Math.min(Math.max(requested, 2), providerLimit);
}

function createBackfillWindow(startAt, endAt) {
  const startMs = startAt ? Date.parse(startAt) : null;
  const endMs = endAt ? Date.parse(endAt) : null;

  if (startMs !== null && !Number.isFinite(startMs)) {
    throw new Error('Backfill start date is invalid');
  }

  if (endMs !== null && !Number.isFinite(endMs)) {
    throw new Error('Backfill end date is invalid');
  }

  if (startMs !== null && endMs !== null && startMs >= endMs) {
    throw new Error('Backfill start date must be before the end date');
  }

  return {
    startAt: startAt || null,
    endAt: endAt || null,
    startMs,
    endMs
  };
}

function filterCandlesByBackfillWindow(candles, window) {
  if (!window || (window.startMs === null && window.endMs === null)) {
    return candles;
  }

  return candles.filter(candle => {
    const timestampMs = Date.parse(candle.timestamp);

    if (!Number.isFinite(timestampMs)) {
      return false;
    }

    if (window.startMs !== null && timestampMs < window.startMs) {
      return false;
    }

    if (window.endMs !== null && timestampMs > window.endMs) {
      return false;
    }

    return true;
  });
}

function generateSyntheticOhlcvCsv({ marketSymbol, timeframe, candleCount, startAt = null, endAt = null }) {
  const window = createBackfillWindow(startAt, endAt);
  const safeCount = Math.min(Math.max(Number(candleCount) || 100, 2), 5000);
  const stepMs = timeframeToMs(timeframe) || (60 * 60 * 1000);
  const endMs = window.endMs || Date.now();
  let startMs = window.startMs || (endMs - (safeCount * stepMs));
  let outputCount = safeCount;

  if (window.startMs !== null && window.endMs !== null) {
    const rangeCount = Math.floor((window.endMs - window.startMs) / stepMs) + 1;
    const countFromRange = Math.max(Math.min(rangeCount, safeCount), 2);

    outputCount = countFromRange;
    startMs = Math.max(window.startMs, endMs - (countFromRange * stepMs));
  }

  const symbolSeed = String(marketSymbol || 'MOCK/USDT')
    .split('')
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
  let price = 25 + (symbolSeed % 200);
  const rows = ['timestamp,open,high,low,close,volume'];

  for (let index = 0; index < outputCount; index += 1) {
    const wave = Math.sin((index + symbolSeed) / 8) * 0.015;
    const drift = ((index % 17) - 8) * 0.0008;
    const open = price;
    const close = Math.max(0.0001, open * (1 + wave + drift));
    const high = Math.max(open, close) * 1.004;
    const low = Math.min(open, close) * 0.996;
    const volume = 1000 + (symbolSeed % 300) + (index * 7);

    rows.push([
      new Date(startMs + (index * stepMs)).toISOString(),
      open.toFixed(8),
      high.toFixed(8),
      low.toFixed(8),
      close.toFixed(8),
      volume.toFixed(4)
    ].join(','));
    price = close;
  }

  return rows.join('\n');
}

function candlesToOhlcvCsv(candles) {
  const rows = ['timestamp,open,high,low,close,volume'];

  candles
    .filter(candle => candle && Number.isFinite(candle.open) && Number.isFinite(candle.high)
      && Number.isFinite(candle.low) && Number.isFinite(candle.close) && Number.isFinite(candle.volume))
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))
    .forEach(candle => {
      rows.push([
        candle.timestamp,
        candle.open,
        candle.high,
        candle.low,
        candle.close,
        candle.volume
      ].join(','));
    });

  if (rows.length === 1) {
    throw new Error('Provider returned no usable OHLCV candles');
  }

  return rows.join('\n');
}

function dedupeSortAndLimitCandles(candles, limit) {
  const byTimestamp = new Map();

  for (const candle of candles) {
    if (!candle?.timestamp) {
      continue;
    }

    byTimestamp.set(candle.timestamp, candle);
  }

  return [...byTimestamp.values()]
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))
    .slice(-limit);
}

function parseOhlcvCsv(csvText) {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error('CSV is empty');
  }

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('timestamp') || firstLine.includes('open');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  if (!dataLines.length) {
    throw new Error('CSV has no candle rows');
  }

  return dataLines.map((line, index) => parseOhlcvCsvLine(line, index + 1));
}

function parseOhlcvCsvLine(line, rowNumber) {
  const columns = line.split(',').map(value => value.trim());

  if (columns.length < 6) {
    throw new Error(`CSV row ${rowNumber} needs timestamp, open, high, low, close, volume`);
  }

  const [timestamp, open, high, low, close, volume] = columns;
  const candle = {
    timestamp,
    open: Number(open),
    high: Number(high),
    low: Number(low),
    close: Number(close),
    volume: Number(volume)
  };

  if (!timestamp || [candle.open, candle.high, candle.low, candle.close, candle.volume].some(Number.isNaN)) {
    throw new Error(`CSV row ${rowNumber} contains invalid OHLCV data`);
  }

  return candle;
}

function createStreamingMarketDataSummaryTracker(timeframe) {
  const warnings = [];
  const timestamps = new Set();
  const expectedMs = timeframeToMs(timeframe);
  const volumes = [];
  let candleCount = 0;
  let firstTimestamp = null;
  let lastTimestamp = null;
  let firstClose = null;
  let previousClose = null;
  let previousMs = null;
  let duplicateTimestamps = 0;
  let outOfOrderRows = 0;
  let invalidShapeRows = 0;
  let gapCount = 0;
  let minClose = Infinity;
  let maxClose = -Infinity;
  let minLow = Infinity;
  let maxHigh = -Infinity;
  let totalVolume = 0;
  let candleMoveTotalPercent = 0;
  let candleMoveCount = 0;

  return {
    add(candle) {
      const currentMs = Date.parse(candle.timestamp);

      if (timestamps.has(candle.timestamp)) {
        duplicateTimestamps += 1;
      }

      timestamps.add(candle.timestamp);

      if (candle.high < candle.low || candle.high < Math.max(candle.open, candle.close) || candle.low > Math.min(candle.open, candle.close)) {
        invalidShapeRows += 1;
      }

      if (previousMs !== null && Number.isFinite(currentMs)) {
        const delta = currentMs - previousMs;

        if (delta <= 0) {
          outOfOrderRows += 1;
        } else if (expectedMs && delta > expectedMs * 1.5) {
          gapCount += 1;
        }
      }

      if (Number.isFinite(currentMs)) {
        previousMs = currentMs;
      }

      if (firstTimestamp === null) {
        firstTimestamp = candle.timestamp;
        firstClose = candle.close;
      }

      if (previousClose !== null && previousClose > 0) {
        candleMoveTotalPercent += Math.abs((candle.close / previousClose) - 1) * 100;
        candleMoveCount += 1;
      }

      previousClose = candle.close;
      lastTimestamp = candle.timestamp;
      minClose = Math.min(minClose, candle.close);
      maxClose = Math.max(maxClose, candle.close);
      minLow = Math.min(minLow, candle.low);
      maxHigh = Math.max(maxHigh, candle.high);
      totalVolume += candle.volume;
      volumes.push(candle.volume);
      candleCount += 1;
    },
    finish() {
      if (duplicateTimestamps) {
        warnings.push(`${duplicateTimestamps} duplicate timestamp row(s) detected.`);
      }

      if (outOfOrderRows) {
        warnings.push(`${outOfOrderRows} out-of-order or overlapping row(s) detected.`);
      }

      if (gapCount) {
        warnings.push(`${gapCount} likely timeframe gap(s) detected.`);
      }

      if (invalidShapeRows) {
        warnings.push(`${invalidShapeRows} candle shape warning(s): high/low does not contain open/close.`);
      }

      const avgCandleMovePercent = candleMoveCount ? candleMoveTotalPercent / candleMoveCount : 0;
      const returnPercent = firstClose ? ((previousClose / firstClose) - 1) * 100 : 0;
      const rangePercent = firstClose ? ((maxHigh - minLow) / firstClose) * 100 : 0;
      const trendThreshold = Math.max(2, avgCandleMovePercent * 2);
      const midpoint = Math.max(1, Math.floor(volumes.length / 2));
      const firstVolume = volumes.slice(0, midpoint);
      const secondVolume = volumes.slice(midpoint);
      const firstVolumeAverage = firstVolume.length ? average(firstVolume) : 0;
      const secondVolumeAverage = secondVolume.length ? average(secondVolume) : firstVolumeAverage;
      const volumeRatio = firstVolumeAverage > 0 ? secondVolumeAverage / firstVolumeAverage : null;
      const qualityScore = Math.max(
        0,
        100 -
          (duplicateTimestamps * 10) -
          (outOfOrderRows * 10) -
          (gapCount * 5) -
          (invalidShapeRows * 15)
      );

      return {
        candleCount,
        firstTimestamp,
        lastTimestamp,
        regime: {
          trend: candleCount < 2
            ? 'unknown'
            : returnPercent > trendThreshold
              ? 'bullish'
              : returnPercent < -trendThreshold
                ? 'bearish'
                : 'sideways',
          volatility: candleCount < 2
            ? 'unknown'
            : avgCandleMovePercent >= 2
              ? 'high'
              : avgCandleMovePercent >= 0.75
                ? 'medium'
                : 'low',
          volumeTrend: volumeRatio === null
            ? 'unknown'
            : volumeRatio > 1.15
              ? 'rising'
              : volumeRatio < 0.85
                ? 'falling'
                : 'flat',
          returnPercent: candleCount < 2 ? null : roundNumber(returnPercent),
          avgCandleMovePercent: candleCount < 2 ? null : roundNumber(avgCandleMovePercent),
          rangePercent: candleCount < 2 ? null : roundNumber(rangePercent),
          volumeRatio: volumeRatio === null ? null : roundNumber(volumeRatio, 4)
        },
        minClose: candleCount ? roundNumber(minClose, 8) : null,
        maxClose: candleCount ? roundNumber(maxClose, 8) : null,
        minLow: candleCount ? roundNumber(minLow, 8) : null,
        maxHigh: candleCount ? roundNumber(maxHigh, 8) : null,
        totalVolume: roundNumber(totalVolume, 8),
        duplicateTimestamps,
        outOfOrderRows,
        gapCount,
        invalidShapeRows,
        qualityScore,
        warnings
      };
    }
  };
}

function classifyMarketRegime(candles) {
  const normalized = (candles || [])
    .map(candle => ({
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume)
    }))
    .filter(candle => (
      [candle.open, candle.high, candle.low, candle.close, candle.volume].every(Number.isFinite) &&
      candle.open > 0 &&
      candle.high > 0 &&
      candle.low > 0 &&
      candle.close > 0
    ));

  if (normalized.length < 2) {
    return {
      trend: 'unknown',
      volatility: 'unknown',
      volumeTrend: 'unknown',
      returnPercent: null,
      avgCandleMovePercent: null,
      rangePercent: null
    };
  }

  const firstClose = normalized[0].close;
  const lastClose = normalized[normalized.length - 1].close;
  const closes = normalized.map(candle => candle.close);
  const highs = normalized.map(candle => candle.high);
  const lows = normalized.map(candle => candle.low);
  const volumes = normalized.map(candle => candle.volume).filter(Number.isFinite);
  const returnPercent = ((lastClose / firstClose) - 1) * 100;
  const candleMoves = [];

  for (let index = 1; index < closes.length; index += 1) {
    candleMoves.push(Math.abs((closes[index] / closes[index - 1]) - 1) * 100);
  }

  const avgCandleMovePercent = candleMoves.length ? average(candleMoves) : 0;
  const rangePercent = ((Math.max(...highs) - Math.min(...lows)) / firstClose) * 100;
  const trendThreshold = Math.max(2, avgCandleMovePercent * 2);
  const volatility = avgCandleMovePercent >= 2
    ? 'high'
    : avgCandleMovePercent >= 0.75
      ? 'medium'
      : 'low';
  const midpoint = Math.max(1, Math.floor(volumes.length / 2));
  const firstVolume = volumes.slice(0, midpoint);
  const secondVolume = volumes.slice(midpoint);
  const firstVolumeAverage = firstVolume.length ? average(firstVolume) : 0;
  const secondVolumeAverage = secondVolume.length ? average(secondVolume) : firstVolumeAverage;
  const volumeRatio = firstVolumeAverage > 0 ? secondVolumeAverage / firstVolumeAverage : null;

  return {
    trend: returnPercent > trendThreshold
      ? 'bullish'
      : returnPercent < -trendThreshold
        ? 'bearish'
        : 'sideways',
    volatility,
    volumeTrend: volumeRatio === null
      ? 'unknown'
      : volumeRatio > 1.15
        ? 'rising'
        : volumeRatio < 0.85
          ? 'falling'
          : 'flat',
    returnPercent: roundNumber(returnPercent),
    avgCandleMovePercent: roundNumber(avgCandleMovePercent),
    rangePercent: roundNumber(rangePercent),
    volumeRatio: volumeRatio === null ? null : roundNumber(volumeRatio, 4)
  };
}

function createMarketDataSummary(candles, timeframe) {
  const warnings = [];
  const timestamps = new Set();
  const expectedMs = timeframeToMs(timeframe);
  let duplicateTimestamps = 0;
  let outOfOrderRows = 0;
  let invalidShapeRows = 0;
  let gapCount = 0;
  let previousMs = null;
  let minClose = Infinity;
  let maxClose = -Infinity;
  let minLow = Infinity;
  let maxHigh = -Infinity;
  let totalVolume = 0;

  for (const candle of candles) {
    const currentMs = Date.parse(candle.timestamp);

    if (timestamps.has(candle.timestamp)) {
      duplicateTimestamps += 1;
    }

    timestamps.add(candle.timestamp);

    if (candle.high < candle.low || candle.high < Math.max(candle.open, candle.close) || candle.low > Math.min(candle.open, candle.close)) {
      invalidShapeRows += 1;
    }

    if (previousMs !== null && Number.isFinite(currentMs)) {
      const delta = currentMs - previousMs;

      if (delta <= 0) {
        outOfOrderRows += 1;
      } else if (expectedMs && delta > expectedMs * 1.5) {
        gapCount += 1;
      }
    }

    if (Number.isFinite(currentMs)) {
      previousMs = currentMs;
    }

    minClose = Math.min(minClose, candle.close);
    maxClose = Math.max(maxClose, candle.close);
    minLow = Math.min(minLow, candle.low);
    maxHigh = Math.max(maxHigh, candle.high);
    totalVolume += candle.volume;
  }

  if (duplicateTimestamps) {
    warnings.push(`${duplicateTimestamps} duplicate timestamp row(s) detected.`);
  }

  if (outOfOrderRows) {
    warnings.push(`${outOfOrderRows} out-of-order or overlapping row(s) detected.`);
  }

  if (gapCount) {
    warnings.push(`${gapCount} likely timeframe gap(s) detected.`);
  }

  if (invalidShapeRows) {
    warnings.push(`${invalidShapeRows} candle shape warning(s): high/low does not contain open/close.`);
  }

  const qualityScore = Math.max(
    0,
    100 -
      (duplicateTimestamps * 10) -
      (outOfOrderRows * 10) -
      (gapCount * 5) -
      (invalidShapeRows * 15)
  );

  return {
    candleCount: candles.length,
    firstTimestamp: candles[0]?.timestamp || null,
    lastTimestamp: candles[candles.length - 1]?.timestamp || null,
    regime: classifyMarketRegime(candles),
    minClose: roundNumber(minClose, 8),
    maxClose: roundNumber(maxClose, 8),
    minLow: roundNumber(minLow, 8),
    maxHigh: roundNumber(maxHigh, 8),
    totalVolume: roundNumber(totalVolume, 8),
    duplicateTimestamps,
    outOfOrderRows,
    gapCount,
    invalidShapeRows,
    qualityScore,
    warnings
  };
}

function normalizeBinanceSymbol(marketSymbol) {
  const symbol = String(marketSymbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!symbol) {
    throw new Error('Binance public provider requires a market symbol such as BTC/USDT');
  }

  return symbol;
}

function normalizeCoinbaseProduct(marketSymbol) {
  const product = String(marketSymbol || '').trim().toUpperCase().replace('/', '-');

  if (!/^[A-Z0-9]+-[A-Z0-9]+$/.test(product)) {
    throw new Error('Coinbase public provider requires a product such as BTC-USD or BTC/USDT');
  }

  return product;
}

function normalizeKrakenPair(marketSymbol, settings = {}) {
  const configuredPair = String(settings.krakenPair || '').trim().toUpperCase();

  if (configuredPair) {
    return configuredPair.replace(/[^A-Z0-9]/g, '');
  }

  const compact = String(marketSymbol || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const pair = compact.startsWith('BTC') ? `XBT${compact.slice(3)}` : compact;

  if (!pair) {
    throw new Error('Kraken public provider requires a market symbol such as BTC/USD or a settings.krakenPair override');
  }

  return pair;
}

function toBinanceInterval(timeframe) {
  const interval = String(timeframe || '').trim();
  const allowed = new Set([
    '1s',
    '1m',
    '3m',
    '5m',
    '15m',
    '30m',
    '1h',
    '2h',
    '4h',
    '6h',
    '8h',
    '12h',
    '1d',
    '3d',
    '1w',
    '1M'
  ]);

  if (!allowed.has(interval)) {
    throw new Error('Binance public provider supports 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, and 1M');
  }

  return interval;
}

function toCoinbaseGranularity(timeframe) {
  const key = String(timeframe || '').trim().toLowerCase();
  const granularities = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '6h': 21600,
    '1d': 86400
  };

  if (!granularities[key]) {
    throw new Error('Coinbase public provider supports 1m, 5m, 15m, 1h, 6h, and 1d');
  }

  return granularities[key];
}

function toKrakenInterval(timeframe) {
  const key = String(timeframe || '').trim().toLowerCase();
  const intervals = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440,
    '1w': 10080,
    '15d': 21600
  };

  if (!intervals[key]) {
    throw new Error('Kraken public provider supports 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, and 15d');
  }

  return intervals[key];
}

function getProviderHealthDefaults(provider) {
  const settings = JSON.parse(provider.settings_json || '{}');

  if (provider.provider_type === 'coinbase_public') {
    return {
      marketSymbol: settings.defaultMarketSymbol || 'BTC-USD',
      timeframe: settings.defaultTimeframe || '1h'
    };
  }

  if (provider.provider_type === 'binance_public') {
    return {
      marketSymbol: settings.defaultMarketSymbol || 'BTC/USDT',
      timeframe: settings.defaultTimeframe || '1h'
    };
  }

  if (provider.provider_type === 'kraken_public') {
    return {
      marketSymbol: settings.defaultMarketSymbol || 'BTC/USD',
      timeframe: settings.defaultTimeframe || '1h'
    };
  }

  return {
    marketSymbol: settings.defaultMarketSymbol || 'MOCK/USDT',
    timeframe: settings.defaultTimeframe || '1h'
  };
}

async function fetchJsonWithTimeout(url, options = {}) {
  const {
    fetchImpl = fetch,
    timeoutMs = PUBLIC_MARKET_DATA_FETCH_TIMEOUT_MS,
    ...fetchOptions
  } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Public market-data request timed out after ${timeoutMs / 1000}s`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBinancePublicOhlcvCsv({ marketSymbol, timeframe, candleCount, settings = {}, startAt = null, endAt = null }) {
  const symbol = normalizeBinanceSymbol(marketSymbol);
  const interval = toBinanceInterval(timeframe);
  const safeLimit = Math.min(Math.max(Number(candleCount) || 100, 2), 5000);
  const window = createBackfillWindow(startAt, endAt);
  const baseUrl = String(settings.baseUrl || 'https://api.binance.com').replace(/\/+$/, '');
  const candles = [];
  let endTime = window.endMs || Date.now();

  while (candles.length < safeLimit) {
    const batchLimit = Math.min(1000, safeLimit - candles.length);
    const url = `${baseUrl}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${batchLimit}&endTime=${endTime}`;
    const data = await fetchJsonWithTimeout(url, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!Array.isArray(data)) {
      throw new Error('Binance public provider returned an unexpected response');
    }

    const batch = data.map(row => ({
      timestamp: new Date(Number(row[0])).toISOString(),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5])
    }));

    if (!batch.length) {
      break;
    }

    candles.push(...batch);

    const oldest = Math.min(...batch.map(candle => Date.parse(candle.timestamp)).filter(Number.isFinite));
    if (!Number.isFinite(oldest) || oldest >= endTime) {
      break;
    }

    if (window.startMs !== null && oldest <= window.startMs) {
      break;
    }

    endTime = oldest - 1;
  }

  return candlesToOhlcvCsv(dedupeSortAndLimitCandles(filterCandlesByBackfillWindow(candles, window), safeLimit));
}

async function fetchCoinbasePublicOhlcvCsv({ marketSymbol, timeframe, candleCount, settings = {}, startAt = null, endAt = null }) {
  const product = normalizeCoinbaseProduct(marketSymbol);
  const granularity = toCoinbaseGranularity(timeframe);
  const safeLimit = Math.min(Math.max(Number(candleCount) || 100, 2), 5000);
  const window = createBackfillWindow(startAt, endAt);
  const baseUrl = String(settings.baseUrl || 'https://api.exchange.coinbase.com').replace(/\/+$/, '');
  const candles = [];
  let endMs = window.endMs || Date.now();

  while (candles.length < safeLimit) {
    const batchLimit = Math.min(300, safeLimit - candles.length);
    const startMs = Math.max(
      window.startMs || -Infinity,
      endMs - (granularity * 1000 * batchLimit)
    );
    const params = new URLSearchParams({
      granularity: String(granularity),
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString()
    });
    const url = `${baseUrl}/products/${encodeURIComponent(product)}/candles?${params.toString()}`;
    const data = await fetchJsonWithTimeout(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'local-ai-control-center'
      }
    });

    if (!Array.isArray(data)) {
      throw new Error('Coinbase public provider returned an unexpected response');
    }

    const batch = data.map(row => ({
      timestamp: new Date(Number(row[0]) * 1000).toISOString(),
      low: Number(row[1]),
      high: Number(row[2]),
      open: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5])
    }));

    if (!batch.length) {
      break;
    }

    candles.push(...batch);

    const oldest = Math.min(...batch.map(candle => Date.parse(candle.timestamp)).filter(Number.isFinite));
    if (!Number.isFinite(oldest) || oldest >= endMs) {
      break;
    }

    if (window.startMs !== null && oldest <= window.startMs) {
      break;
    }

    endMs = oldest - 1;
  }

  return candlesToOhlcvCsv(dedupeSortAndLimitCandles(filterCandlesByBackfillWindow(candles, window), safeLimit));
}

async function fetchKrakenPublicOhlcvCsv({ marketSymbol, timeframe, candleCount, settings = {}, startAt = null, endAt = null }) {
  const pair = normalizeKrakenPair(marketSymbol, settings);
  const interval = toKrakenInterval(timeframe);
  const safeLimit = Math.min(Math.max(Number(candleCount) || 100, 2), 720);
  const window = createBackfillWindow(startAt, endAt);
  const baseUrl = String(settings.baseUrl || 'https://api.kraken.com').replace(/\/+$/, '');
  const params = new URLSearchParams({
    pair,
    interval: String(interval)
  });
  const data = await fetchJsonWithTimeout(`${baseUrl}/0/public/OHLC?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'local-ai-control-center'
    }
  });

  if (Array.isArray(data.error) && data.error.length) {
    throw new Error(`Kraken public provider error: ${data.error.join(', ')}`);
  }

  if (!data.result || typeof data.result !== 'object') {
    throw new Error('Kraken public provider returned an unexpected response');
  }

  const resultKey = Object.keys(data.result).find(key => key !== 'last');
  const rows = resultKey ? data.result[resultKey] : null;

  if (!Array.isArray(rows)) {
    throw new Error('Kraken public provider returned no OHLCV rows');
  }

  const candles = rows.map(row => ({
    timestamp: new Date(Number(row[0]) * 1000).toISOString(),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[6])
  }));

  return candlesToOhlcvCsv(dedupeSortAndLimitCandles(filterCandlesByBackfillWindow(candles, window), safeLimit));
}

async function fetchProviderOhlcvCsv(schedule) {
  const settings = JSON.parse(schedule.settings_json || '{}');
  const request = {
    marketSymbol: schedule.market_symbol,
    timeframe: schedule.timeframe,
    candleCount: clampScheduleCandleCount(schedule.lookback_candles, schedule.provider_type),
    startAt: schedule.backfill_start_at || null,
    endAt: schedule.backfill_end_at || null,
    settings
  };

  if (schedule.provider_type === 'local_mock') {
    return {
      source: 'scheduled_local_mock',
      csvText: generateSyntheticOhlcvCsv(request)
    };
  }

  if (schedule.provider_type === 'binance_public') {
    return {
      source: 'scheduled_binance_public',
      csvText: await fetchBinancePublicOhlcvCsv(request)
    };
  }

  if (schedule.provider_type === 'coinbase_public') {
    return {
      source: 'scheduled_coinbase_public',
      csvText: await fetchCoinbasePublicOhlcvCsv(request)
    };
  }

  if (schedule.provider_type === 'kraken_public') {
    return {
      source: 'scheduled_kraken_public',
      csvText: await fetchKrakenPublicOhlcvCsv(request)
    };
  }

  if (schedule.provider_type === 'ccxt_planned') {
    throw new Error('CCXT provider is saved for planning, but the ccxt package is not wired into this local app yet');
  }

  throw new Error('Custom market-data providers need an adapter before they can run scheduled refreshes');
}

module.exports = {
  MARKET_PROVIDER_CANDLE_LIMITS,
  PUBLIC_MARKET_DATA_FETCH_TIMEOUT_MS,
  getProviderCandleLimit,
  parseMarketDataProvider,
  parseMarketDataRefreshSchedule,
  parseMarketDataRefreshRun,
  parseMarketImport,
  parseMarketImportJob,
  timeframeToMs,
  addMinutesToIso,
  normalizeScheduleStatus,
  normalizeOptionalIsoDate,
  clampScheduleCandleCount,
  createBackfillWindow,
  filterCandlesByBackfillWindow,
  generateSyntheticOhlcvCsv,
  candlesToOhlcvCsv,
  dedupeSortAndLimitCandles,
  parseOhlcvCsv,
  parseOhlcvCsvLine,
  createStreamingMarketDataSummaryTracker,
  classifyMarketRegime,
  createMarketDataSummary,
  normalizeBinanceSymbol,
  normalizeCoinbaseProduct,
  normalizeKrakenPair,
  toBinanceInterval,
  toCoinbaseGranularity,
  toKrakenInterval,
  getProviderHealthDefaults,
  fetchJsonWithTimeout,
  fetchBinancePublicOhlcvCsv,
  fetchCoinbasePublicOhlcvCsv,
  fetchKrakenPublicOhlcvCsv,
  fetchProviderOhlcvCsv
};
