function roundNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Number(value.toFixed(decimals));
}

function getBacktestNumber(value, fallback, min = 0) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }

  return parsed;
}

function parseSweepNumberList(value, fallback, options = {}) {
  const min = options.min ?? 0;
  const max = options.max ?? 100;
  const limit = options.limit ?? 12;
  const rawValues = Array.isArray(value)
    ? value
    : String(value ?? '')
      .split(/[,\n\s]+/)
      .map(item => item.trim())
      .filter(Boolean);
  const parsed = rawValues
    .map(item => Number(item))
    .filter(item => Number.isFinite(item) && item >= min && item <= max)
    .map(item => roundNumber(item, 4));
  const unique = [...new Set(parsed)].slice(0, limit);

  return unique.length ? unique : fallback;
}

function calculateMaxDrawdownPercent(equityCurve) {
  let peak = equityCurve[0] || 0;
  let maxDrawdown = 0;

  for (const equity of equityCurve) {
    peak = Math.max(peak, equity);

    if (peak > 0) {
      maxDrawdown = Math.max(maxDrawdown, ((peak - equity) / peak) * 100);
    }
  }

  return roundNumber(maxDrawdown);
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

module.exports = {
  roundNumber,
  getBacktestNumber,
  parseSweepNumberList,
  calculateMaxDrawdownPercent,
  average
};
