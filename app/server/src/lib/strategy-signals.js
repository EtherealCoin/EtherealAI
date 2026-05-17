const {
  average
} = require('./strategy-math');

function findPeriodNearAverage(text, fallback = 20) {
  const afterAverage = text.match(/\b(?:sma|ema|ma|moving average)\s*\(?\s*(\d{1,3})\b/);
  const beforeAverage = text.match(/\b(\d{1,3})\s*(?:period|candle|bar)?\s*(?:sma|ema|ma|moving average)\b/);

  const period = Number((afterAverage && afterAverage[1]) || (beforeAverage && beforeAverage[1]));

  if (Number.isInteger(period) && period > 1) {
    return period;
  }

  return fallback;
}

function findLookbackPeriod(text, fallback = 20) {
  if (/\b(?:previous|prior|last)\s+(?:candle|bar)?\s*(?:high|low)\b/.test(text)) {
    return 1;
  }

  const match = text.match(/\b(\d{1,3})\s*(?:period|candle|bar|high|low|breakout)s?\b/);
  const period = Number(match && match[1]);

  if (Number.isInteger(period) && period > 0) {
    return period;
  }

  return fallback;
}

function findIndicatorPeriod(text, indicator, fallback) {
  const afterIndicator = text.match(new RegExp(`\\b${indicator}\\s*\\(?\\s*(\\d{1,3})\\b`));
  const beforeIndicator = text.match(new RegExp(`\\b(\\d{1,3})\\s*(?:period|candle|bar)?\\s*${indicator}\\b`));
  const period = Number((afterIndicator && afterIndicator[1]) || (beforeIndicator && beforeIndicator[1]));

  if (Number.isInteger(period) && period > 1) {
    return period;
  }

  return fallback;
}

function findThresholdForDirection(text, direction, fallback) {
  const directionPattern = direction === 'above'
    ? '(?:above|over|greater than|>)'
    : '(?:below|under|less than|<)';
  const match = text.match(new RegExp(`${directionPattern}\\s*(\\d{1,3}(?:\\.\\d+)?)`));
  const threshold = Number(match && match[1]);

  if (Number.isFinite(threshold)) {
    return threshold;
  }

  return fallback;
}

function findSmallCount(text, fallback = 2) {
  const numberWords = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5
  };
  const digitMatch = text.match(/\b(\d{1,2})\b/);

  if (digitMatch) {
    const count = Number(digitMatch[1]);

    if (Number.isInteger(count) && count > 0) {
      return count;
    }
  }

  const wordMatch = text.match(/\b(one|two|three|four|five)\b/);

  if (wordMatch) {
    return numberWords[wordMatch[1]];
  }

  return fallback;
}

function findVolumeAveragePeriod(text, fallback = 20) {
  const afterVolume = text.match(/\bvolume\b.*\b(?:sma|ma|average)\s*\(?\s*(\d{1,3})\b/);
  const beforeVolume = text.match(/\b(\d{1,3})\s*(?:period|candle|bar)?\s*(?:volume\s*)?(?:sma|ma|average)\b/);
  const period = Number((afterVolume && afterVolume[1]) || (beforeVolume && beforeVolume[1]));

  if (Number.isInteger(period) && period > 1) {
    return period;
  }

  return fallback;
}

function findVolumeMultiplier(text, fallback = 1) {
  const multiplierMatch = text.match(/\b(\d+(?:\.\d+)?)\s*x\b/);
  const percentMatch = text.match(/\b(\d+(?:\.\d+)?)\s*%\s*(?:above|over|greater than)\b/);

  if (multiplierMatch) {
    const multiplier = Number(multiplierMatch[1]);

    if (Number.isFinite(multiplier) && multiplier > 0) {
      return multiplier;
    }
  }

  if (percentMatch) {
    const percent = Number(percentMatch[1]);

    if (Number.isFinite(percent) && percent > 0) {
      return 1 + (percent / 100);
    }
  }

  if (/\b(?:spike|surge|unusual volume|high volume)\b/.test(text)) {
    return 1.5;
  }

  return fallback;
}

function findVolumeBelowMultiplier(text, fallback = 1) {
  const multiplierMatch = text.match(/\b(\d+(?:\.\d+)?)\s*x\b/);
  const percentMatch = text.match(/\b(\d+(?:\.\d+)?)\s*%\s*(?:below|under|less than)\b/);

  if (multiplierMatch) {
    const multiplier = Number(multiplierMatch[1]);

    if (Number.isFinite(multiplier) && multiplier > 0) {
      return multiplier;
    }
  }

  if (percentMatch) {
    const percent = Number(percentMatch[1]);

    if (Number.isFinite(percent) && percent > 0 && percent < 100) {
      return 1 - (percent / 100);
    }
  }

  if (/\b(?:dry up|dries up|low volume|volume fade|weak volume)\b/.test(text)) {
    return 0.75;
  }

  return fallback;
}

function findWickMultiplier(text, fallback = 1.5) {
  const multiplierMatch = text.match(/\b(\d+(?:\.\d+)?)\s*x\s*(?:body|candle body|wick)\b/);
  const ratioMatch = text.match(/\bwick\s*(?:ratio|multiple)?\s*(?:above|over|greater than|>)\s*(\d+(?:\.\d+)?)\b/);
  const multiplier = Number((multiplierMatch && multiplierMatch[1]) || (ratioMatch && ratioMatch[1]));

  if (Number.isFinite(multiplier) && multiplier > 0) {
    return multiplier;
  }

  return fallback;
}

function parseAverageCrossRule(text) {
  const mentionsAverage = /\b(?:sma|ema|ma|moving average)\b/.test(text);
  const mentionsCross = /\b(?:cross|crossover|crossunder|crosses)\b/.test(text);
  const mentionsAbove = /\b(?:above|over|greater than|crosses above|cross above|crossover)\b/.test(text);
  const mentionsBelow = /\b(?:below|under|less than|crosses below|cross below|crossunder)\b/.test(text);

  if (!mentionsAverage || (!mentionsCross && !(mentionsAbove || mentionsBelow))) {
    return null;
  }

  const periodMatches = [
    ...text.matchAll(/\b(?:sma|ema|ma|moving average)\s*\(?\s*(\d{1,3})\b/g),
    ...text.matchAll(/\b(\d{1,3})\s*(?:period|candle|bar)?\s*(?:sma|ema|ma|moving average)\b/g)
  ];
  const periods = [...new Set(periodMatches
    .map(match => Number(match[1]))
    .filter(period => Number.isInteger(period) && period > 1))];

  if (periods.length < 2) {
    return null;
  }

  const direction = mentionsBelow ? 'below' : 'above';
  const averageType = text.includes('ema') ? 'ema' : 'sma';

  return {
    kind: direction === 'above' ? 'average_cross_above' : 'average_cross_below',
    label: `${periods[0]} ${averageType.toUpperCase()} crosses ${direction} ${periods[1]} ${averageType.toUpperCase()}`,
    fastPeriod: periods[0],
    slowPeriod: periods[1],
    averageType
  };
}

function movingAverage(candles, index, period) {
  if (index < period - 1) {
    return null;
  }

  let sum = 0;

  for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
    sum += candles[cursor].close;
  }

  return sum / period;
}

function buildEmaSeries(candles, period) {
  const values = new Array(candles.length).fill(null);

  if (candles.length < period) {
    return values;
  }

  values[period - 1] = movingAverage(candles, period - 1, period);
  const multiplier = 2 / (period + 1);

  for (let index = period; index < candles.length; index += 1) {
    values[index] = ((candles[index].close - values[index - 1]) * multiplier) + values[index - 1];
  }

  return values;
}

function buildVwapSeries(candles) {
  const values = new Array(candles.length).fill(null);
  let cumulativeTypicalVolume = 0;
  let cumulativeVolume = 0;

  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index];
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;

    cumulativeTypicalVolume += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;

    if (cumulativeVolume > 0) {
      values[index] = cumulativeTypicalVolume / cumulativeVolume;
    }
  }

  return values;
}

function buildRsiSeries(candles, period) {
  const values = new Array(candles.length).fill(null);

  if (candles.length <= period) {
    return values;
  }

  let gainSum = 0;
  let lossSum = 0;

  for (let index = 1; index <= period; index += 1) {
    const change = candles[index].close - candles[index - 1].close;

    if (change >= 0) {
      gainSum += change;
    } else {
      lossSum += Math.abs(change);
    }
  }

  let averageGain = gainSum / period;
  let averageLoss = lossSum / period;

  function calculateRsi() {
    if (averageLoss === 0) {
      return 100;
    }

    if (averageGain === 0) {
      return 0;
    }

    const relativeStrength = averageGain / averageLoss;
    return 100 - (100 / (1 + relativeStrength));
  }

  values[period] = calculateRsi();

  for (let index = period + 1; index < candles.length; index += 1) {
    const change = candles[index].close - candles[index - 1].close;
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    averageGain = ((averageGain * (period - 1)) + gain) / period;
    averageLoss = ((averageLoss * (period - 1)) + loss) / period;
    values[index] = calculateRsi();
  }

  return values;
}

function buildEmaForValues(values, period) {
  const output = new Array(values.length).fill(null);
  const firstIndex = values.findIndex(value => Number.isFinite(value));

  if (firstIndex === -1 || values.length - firstIndex < period) {
    return output;
  }

  let sum = 0;

  for (let index = firstIndex; index < firstIndex + period; index += 1) {
    if (!Number.isFinite(values[index])) {
      return output;
    }

    sum += values[index];
  }

  const seedIndex = firstIndex + period - 1;
  output[seedIndex] = sum / period;
  const multiplier = 2 / (period + 1);

  for (let index = seedIndex + 1; index < values.length; index += 1) {
    if (!Number.isFinite(values[index])) {
      continue;
    }

    output[index] = ((values[index] - output[index - 1]) * multiplier) + output[index - 1];
  }

  return output;
}

function buildMacdSeries(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fast = buildEmaSeries(candles, fastPeriod);
  const slow = buildEmaSeries(candles, slowPeriod);
  const macd = candles.map((_, index) => (
    fast[index] === null || slow[index] === null ? null : fast[index] - slow[index]
  ));
  const signal = buildEmaForValues(macd, signalPeriod);
  const histogram = macd.map((value, index) => (
    value === null || signal[index] === null ? null : value - signal[index]
  ));

  return {
    macd,
    signal,
    histogram
  };
}

function standardDeviation(values) {
  if (!values.length) {
    return 0;
  }

  const mean = average(values);
  const variance = average(values.map(value => (value - mean) ** 2));

  return Math.sqrt(variance);
}

function bollingerBands(candles, index, period = 20, multiplier = 2) {
  if (index < period - 1) {
    return null;
  }

  const closes = candles
    .slice(index - period + 1, index + 1)
    .map(candle => candle.close);
  const middle = average(closes);
  const deviation = standardDeviation(closes);

  return {
    upper: middle + (deviation * multiplier),
    middle,
    lower: middle - (deviation * multiplier)
  };
}

function parseSingleSignalRule(normalized, side) {
  const mentionsAverage = /\b(?:sma|ema|ma|moving average)\b/.test(normalized);
  const mentionsAbove = /\b(?:above|over|greater than|crosses above|cross above|crossover)\b/.test(normalized);
  const mentionsBelow = /\b(?:below|under|less than|crosses below|cross below|crossunder)\b/.test(normalized);
  const crossOnly = /\b(?:cross|crossover|crossunder|crosses)\b/.test(normalized);

  if (/\brsi\b/.test(normalized)) {
    if (mentionsBelow || /\boversold\b/.test(normalized)) {
      const threshold = findThresholdForDirection(normalized, 'below', 30);

      return {
        kind: crossOnly ? 'rsi_cross_below' : 'rsi_below',
        label: crossOnly ? 'RSI crosses below threshold' : 'RSI below threshold',
        period: findIndicatorPeriod(normalized, 'rsi', 14),
        threshold
      };
    }

    if (mentionsAbove || /\boverbought\b/.test(normalized)) {
      const threshold = findThresholdForDirection(normalized, 'above', 70);

      return {
        kind: crossOnly ? 'rsi_cross_above' : 'rsi_above',
        label: crossOnly ? 'RSI crosses above threshold' : 'RSI above threshold',
        period: findIndicatorPeriod(normalized, 'rsi', 14),
        threshold
      };
    }
  }

  if (/\bmacd\b/.test(normalized)) {
    const mentionsBelow = /\b(?:below|under|less than|crosses below|cross below|crossunder|bearish)\b/.test(normalized);
    const histogram = /\b(?:histogram|hist)\b/.test(normalized);

    if (histogram && /\b(?:zero|0)\b/.test(normalized)) {
      return {
        kind: mentionsBelow ? 'macd_histogram_below_zero' : 'macd_histogram_above_zero',
        label: `MACD histogram ${mentionsBelow ? 'below' : 'above'} zero`,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9
      };
    }

    return {
      kind: mentionsBelow ? 'macd_cross_below' : 'macd_cross_above',
      label: `MACD crosses ${mentionsBelow ? 'below' : 'above'} signal`,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9
    };
  }

  if (/\b(?:bollinger|bbands?|bb)\b/.test(normalized)) {
    const lowerBand = /\b(?:lower|bottom)\b/.test(normalized);
    const upperBand = /\b(?:upper|top)\b/.test(normalized);

    if (lowerBand || upperBand) {
      return {
        kind: lowerBand ? 'close_below_lower_bollinger' : 'close_above_upper_bollinger',
        label: `close ${lowerBand ? 'below lower' : 'above upper'} Bollinger Band`,
        period: findIndicatorPeriod(normalized, 'bollinger', 20),
        multiplier: 2
      };
    }
  }

  const averageCrossRule = parseAverageCrossRule(normalized);

  if (averageCrossRule) {
    return averageCrossRule;
  }

  if (/\bvwap\b/.test(normalized)) {
    const vwapAbove = mentionsAbove || /\b(?:reclaim|reclaims|regain|regains|holds above)\b/.test(normalized);
    const vwapBelow = mentionsBelow || /\b(?:lose|loses|lost|reject|rejects|rejection|fails below)\b/.test(normalized);

    if (vwapAbove || vwapBelow) {
      return {
        kind: vwapBelow ? 'close_below_vwap' : 'close_above_vwap',
        label: `close ${vwapBelow ? 'below' : 'above'} VWAP`,
        crossOnly: crossOnly || /\b(?:reclaim|reclaims|lose|loses|lost)\b/.test(normalized)
      };
    }
  }

  if (/\bvolume\b/.test(normalized) && /\b(?:above|over|greater than|spike|surge|unusual volume|high volume)\b/.test(normalized)) {
    return {
      kind: 'volume_above_average',
      label: 'volume above average',
      period: findVolumeAveragePeriod(normalized),
      multiplier: findVolumeMultiplier(normalized)
    };
  }

  if (/\bvolume\b/.test(normalized) && /\b(?:below|under|less than|dry up|dries up|low volume|volume fade|weak volume)\b/.test(normalized)) {
    return {
      kind: 'volume_below_average',
      label: 'volume below average',
      period: findVolumeAveragePeriod(normalized),
      multiplier: findVolumeBelowMultiplier(normalized)
    };
  }

  if (mentionsAverage && (mentionsAbove || mentionsBelow)) {
    return {
      kind: mentionsAbove ? 'close_above_average' : 'close_below_average',
      label: `close ${mentionsAbove ? 'above' : 'below'} ${normalized.includes('ema') ? 'EMA' : 'SMA'}`,
      period: findPeriodNearAverage(normalized),
      averageType: normalized.includes('ema') ? 'ema' : 'sma',
      crossOnly
    };
  }

  if (/\b(?:lower wick|long wick down|hammer|bullish rejection|sweep low)\b/.test(normalized)) {
    return {
      kind: 'long_lower_wick',
      label: 'long lower wick rejection',
      multiplier: findWickMultiplier(normalized)
    };
  }

  if (/\b(?:upper wick|long wick up|shooting star|bearish rejection|sweep high|liquidity grab)\b/.test(normalized)) {
    return {
      kind: 'long_upper_wick',
      label: 'long upper wick rejection',
      multiplier: findWickMultiplier(normalized)
    };
  }

  if (/\b(?:consecutive|in a row|straight)\b/.test(normalized) && /\b(?:green candles|bullish candles)\b/.test(normalized)) {
    return {
      kind: 'consecutive_green_candles',
      label: 'consecutive green candles',
      count: findSmallCount(normalized)
    };
  }

  if (/\b(?:consecutive|in a row|straight)\b/.test(normalized) && /\b(?:red candles|bearish candles)\b/.test(normalized)) {
    return {
      kind: 'consecutive_red_candles',
      label: 'consecutive red candles',
      count: findSmallCount(normalized)
    };
  }

  if (side === 'entry' && /\b(?:green candle|bullish candle|close above open)\b/.test(normalized)) {
    return {
      kind: 'green_candle',
      label: 'green candle'
    };
  }

  if (side === 'exit' && /\b(?:red candle|bearish candle|close below open)\b/.test(normalized)) {
    return {
      kind: 'red_candle',
      label: 'red candle'
    };
  }

  if (side === 'entry' && /\b(?:breakout|above previous high|new high)\b/.test(normalized)) {
    return {
      kind: 'breakout_high',
      label: 'high breakout',
      period: findLookbackPeriod(normalized)
    };
  }

  if (side === 'exit' && /\b(?:breakdown|below previous low|below prior low|new low|close below low)\b/.test(normalized)) {
    return {
      kind: 'breakdown_low',
      label: 'low breakdown',
      period: findLookbackPeriod(normalized)
    };
  }

  return null;
}

function parseSignalRule(text, side) {
  const normalized = String(text || '').toLowerCase();
  const parts = normalized
    .split(/\n+|\s+\b(?:and|plus|with|while)\b\s+|,/)
    .map(part => part.trim())
    .filter(Boolean);
  const rules = parts
    .map(part => parseSingleSignalRule(part, side))
    .filter(Boolean);

  if (rules.length > 1) {
    return {
      kind: 'all_conditions',
      label: 'all conditions',
      rules
    };
  }

  return parseSingleSignalRule(normalized, side);
}

function createSignalEvaluator(strategy, candles) {
  const entryRule = parseSignalRule(strategy.entry_rules, 'entry');
  const exitRule = parseSignalRule(strategy.exit_rules, 'exit');
  const warnings = [];
  const emaCache = new Map();
  const rsiCache = new Map();
  const macdCache = new Map();
  let vwapSeries = null;

  if (!entryRule) {
    warnings.push('Entry rules could not be translated into a supported signal yet, so the engine used a buy-and-hold research baseline.');
  }

  if (!exitRule) {
    warnings.push('Exit rules could not be translated into a supported signal yet, so exits used stop loss, take profit, and final-candle close.');
  }

  function getAverage(index, period, averageType) {
    if (averageType === 'ema') {
      if (!emaCache.has(period)) {
        emaCache.set(period, buildEmaSeries(candles, period));
      }

      return emaCache.get(period)[index];
    }

    return movingAverage(candles, index, period);
  }

  function getRsi(index, period) {
    if (!rsiCache.has(period)) {
      rsiCache.set(period, buildRsiSeries(candles, period));
    }

    return rsiCache.get(period)[index];
  }

  function getVwap(index) {
    if (!vwapSeries) {
      vwapSeries = buildVwapSeries(candles);
    }

    return vwapSeries[index];
  }

  function getMacd(rule) {
    const key = `${rule.fastPeriod}:${rule.slowPeriod}:${rule.signalPeriod}`;

    if (!macdCache.has(key)) {
      macdCache.set(key, buildMacdSeries(candles, rule.fastPeriod, rule.slowPeriod, rule.signalPeriod));
    }

    return macdCache.get(key);
  }

  function signalMatches(rule, index) {
    if (!rule || index < 0) {
      return false;
    }

    const candle = candles[index];

    if (rule.kind === 'green_candle') {
      return candle.close > candle.open;
    }

    if (rule.kind === 'red_candle') {
      return candle.close < candle.open;
    }

    if (rule.kind === 'consecutive_green_candles' || rule.kind === 'consecutive_red_candles') {
      if (index < rule.count - 1) {
        return false;
      }

      for (let cursor = index - rule.count + 1; cursor <= index; cursor += 1) {
        const testCandle = candles[cursor];
        const matchesColor = rule.kind === 'consecutive_green_candles'
          ? testCandle.close > testCandle.open
          : testCandle.close < testCandle.open;

        if (!matchesColor) {
          return false;
        }
      }

      return true;
    }

    if (rule.kind === 'breakout_high') {
      if (index < rule.period) {
        return false;
      }

      let priorHigh = -Infinity;

      for (let cursor = index - rule.period; cursor < index; cursor += 1) {
        priorHigh = Math.max(priorHigh, candles[cursor].high);
      }

      return candle.close > priorHigh;
    }

    if (rule.kind === 'breakdown_low') {
      if (index < rule.period) {
        return false;
      }

      let priorLow = Infinity;

      for (let cursor = index - rule.period; cursor < index; cursor += 1) {
        priorLow = Math.min(priorLow, candles[cursor].low);
      }

      return candle.close < priorLow;
    }

    if (rule.kind === 'rsi_below' || rule.kind === 'rsi_above') {
      const rsi = getRsi(index, rule.period);

      if (rsi === null) {
        return false;
      }

      return rule.kind === 'rsi_below'
        ? rsi < rule.threshold
        : rsi > rule.threshold;
    }

    if (rule.kind === 'rsi_cross_above' || rule.kind === 'rsi_cross_below') {
      if (index === 0) {
        return false;
      }

      const currentRsi = getRsi(index, rule.period);
      const previousRsi = getRsi(index - 1, rule.period);

      if (currentRsi === null || previousRsi === null) {
        return false;
      }

      return rule.kind === 'rsi_cross_above'
        ? previousRsi <= rule.threshold && currentRsi > rule.threshold
        : previousRsi >= rule.threshold && currentRsi < rule.threshold;
    }

    if (rule.kind === 'volume_above_average' || rule.kind === 'volume_below_average') {
      if (index < rule.period - 1) {
        return false;
      }

      const volumeWindow = candles
        .slice(index - rule.period + 1, index + 1)
        .map(item => item.volume);
      const averageVolume = average(volumeWindow);

      if (averageVolume <= 0) {
        return false;
      }

      return rule.kind === 'volume_above_average'
        ? candle.volume > averageVolume * rule.multiplier
        : candle.volume < averageVolume * rule.multiplier;
    }

    if (rule.kind === 'macd_cross_above' || rule.kind === 'macd_cross_below') {
      if (index === 0) {
        return false;
      }

      const series = getMacd(rule);
      const currentMacd = series.macd[index];
      const currentSignal = series.signal[index];
      const previousMacd = series.macd[index - 1];
      const previousSignal = series.signal[index - 1];

      if ([currentMacd, currentSignal, previousMacd, previousSignal].some(value => value === null)) {
        return false;
      }

      return rule.kind === 'macd_cross_above'
        ? previousMacd <= previousSignal && currentMacd > currentSignal
        : previousMacd >= previousSignal && currentMacd < currentSignal;
    }

    if (rule.kind === 'macd_histogram_above_zero' || rule.kind === 'macd_histogram_below_zero') {
      const histogram = getMacd(rule).histogram[index];

      if (histogram === null) {
        return false;
      }

      return rule.kind === 'macd_histogram_above_zero'
        ? histogram > 0
        : histogram < 0;
    }

    if (rule.kind === 'close_below_lower_bollinger' || rule.kind === 'close_above_upper_bollinger') {
      const bands = bollingerBands(candles, index, rule.period, rule.multiplier);

      if (!bands) {
        return false;
      }

      return rule.kind === 'close_below_lower_bollinger'
        ? candle.close < bands.lower
        : candle.close > bands.upper;
    }

    if (rule.kind === 'close_above_vwap' || rule.kind === 'close_below_vwap') {
      const currentVwap = getVwap(index);

      if (currentVwap === null) {
        return false;
      }

      if (!rule.crossOnly) {
        return rule.kind === 'close_above_vwap'
          ? candle.close > currentVwap
          : candle.close < currentVwap;
      }

      if (index === 0) {
        return false;
      }

      const previousVwap = getVwap(index - 1);
      const previousCandle = candles[index - 1];

      if (previousVwap === null) {
        return false;
      }

      return rule.kind === 'close_above_vwap'
        ? previousCandle.close <= previousVwap && candle.close > currentVwap
        : previousCandle.close >= previousVwap && candle.close < currentVwap;
    }

    if (rule.kind === 'long_lower_wick' || rule.kind === 'long_upper_wick') {
      const bodySize = Math.abs(candle.close - candle.open);
      const range = candle.high - candle.low;
      const wickDenominator = Math.max(bodySize, range * 0.05);
      const lowerWick = Math.min(candle.open, candle.close) - candle.low;
      const upperWick = candle.high - Math.max(candle.open, candle.close);

      if (range <= 0 || wickDenominator <= 0) {
        return false;
      }

      return rule.kind === 'long_lower_wick'
        ? lowerWick >= wickDenominator * rule.multiplier && lowerWick > upperWick
        : upperWick >= wickDenominator * rule.multiplier && upperWick > lowerWick;
    }

    if (rule.kind === 'average_cross_above' || rule.kind === 'average_cross_below') {
      if (index === 0) {
        return false;
      }

      const currentFast = getAverage(index, rule.fastPeriod, rule.averageType);
      const currentSlow = getAverage(index, rule.slowPeriod, rule.averageType);
      const previousFast = getAverage(index - 1, rule.fastPeriod, rule.averageType);
      const previousSlow = getAverage(index - 1, rule.slowPeriod, rule.averageType);

      if ([currentFast, currentSlow, previousFast, previousSlow].some(value => value === null)) {
        return false;
      }

      return rule.kind === 'average_cross_above'
        ? previousFast <= previousSlow && currentFast > currentSlow
        : previousFast >= previousSlow && currentFast < currentSlow;
    }

    if (rule.kind === 'close_above_average' || rule.kind === 'close_below_average') {
      const currentAverage = getAverage(index, rule.period, rule.averageType);

      if (currentAverage === null) {
        return false;
      }

      if (!rule.crossOnly) {
        return rule.kind === 'close_above_average'
          ? candle.close > currentAverage
          : candle.close < currentAverage;
      }

      if (index === 0) {
        return false;
      }

      const previousAverage = getAverage(index - 1, rule.period, rule.averageType);

      if (previousAverage === null) {
        return false;
      }

      const previousCandle = candles[index - 1];

      return rule.kind === 'close_above_average'
        ? previousCandle.close <= previousAverage && candle.close > currentAverage
        : previousCandle.close >= previousAverage && candle.close < currentAverage;
    }

    if (rule.kind === 'all_conditions') {
      return rule.rules.every(childRule => signalMatches(childRule, index));
    }

    return false;
  }

  return {
    entryRule,
    exitRule,
    warnings,
    shouldEnterAtOpen(index) {
      if (!entryRule) {
        return index === 0;
      }

      return index > 0 && signalMatches(entryRule, index - 1);
    },
    shouldExitAtOpen(index) {
      if (!exitRule) {
        return false;
      }

      return index > 0 && signalMatches(exitRule, index - 1);
    }
  };
}

module.exports = {
  findPeriodNearAverage,
  findLookbackPeriod,
  findIndicatorPeriod,
  findThresholdForDirection,
  findSmallCount,
  findVolumeAveragePeriod,
  findVolumeMultiplier,
  findVolumeBelowMultiplier,
  findWickMultiplier,
  parseAverageCrossRule,
  movingAverage,
  buildEmaSeries,
  buildVwapSeries,
  buildRsiSeries,
  buildEmaForValues,
  buildMacdSeries,
  standardDeviation,
  bollingerBands,
  parseSingleSignalRule,
  parseSignalRule,
  createSignalEvaluator
};
