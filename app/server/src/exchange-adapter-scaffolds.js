'use strict';

const EXCHANGE_ADAPTER_METHODS = [
  'validateCredentials',
  'getBalances',
  'getOpenPositions',
  'placeOrder',
  'cancelOrder',
  'emergencyStop'
];

const EXCHANGE_ADAPTER_SCAFFOLDS = [
  {
    exchangeName: 'binance',
    moduleId: 'binance-disabled-adapter',
    modulePath: 'app/server/src/exchange-adapter-scaffolds.js#createDisabledExchangeAdapter(binance)',
    marketTypes: ['spot', 'usdm_futures']
  },
  {
    exchangeName: 'bybit',
    moduleId: 'bybit-disabled-adapter',
    modulePath: 'app/server/src/exchange-adapter-scaffolds.js#createDisabledExchangeAdapter(bybit)',
    marketTypes: ['spot', 'linear_perpetual']
  },
  {
    exchangeName: 'coinbase',
    moduleId: 'coinbase-disabled-adapter',
    modulePath: 'app/server/src/exchange-adapter-scaffolds.js#createDisabledExchangeAdapter(coinbase)',
    marketTypes: ['spot']
  },
  {
    exchangeName: 'custom',
    moduleId: 'custom-disabled-adapter',
    modulePath: 'app/server/src/exchange-adapter-scaffolds.js#createDisabledExchangeAdapter(custom)',
    marketTypes: ['spot', 'derivatives']
  },
  {
    exchangeName: 'hyperliquid',
    moduleId: 'hyperliquid-disabled-adapter',
    modulePath: 'app/server/src/exchange-adapter-scaffolds.js#createDisabledExchangeAdapter(hyperliquid)',
    marketTypes: ['perpetual']
  },
  {
    exchangeName: 'kraken',
    moduleId: 'kraken-disabled-adapter',
    modulePath: 'app/server/src/exchange-adapter-scaffolds.js#createDisabledExchangeAdapter(kraken)',
    marketTypes: ['spot']
  },
  {
    exchangeName: 'okx',
    moduleId: 'okx-disabled-adapter',
    modulePath: 'app/server/src/exchange-adapter-scaffolds.js#createDisabledExchangeAdapter(okx)',
    marketTypes: ['spot', 'swap']
  }
];

function createDisabledMethodContract(name) {
  return {
    name,
    implemented: false,
    networkCallsEnabled: false,
    credentialLoadingEnabled: false,
    liveExecutionEnabled: false,
    requiredBeforeLive: true
  };
}

function normalizeExchangeName(exchangeName) {
  return String(exchangeName || 'custom').trim().toLowerCase();
}

function enrichScaffold(scaffold) {
  return {
    ...scaffold,
    implemented: false,
    credentialLoadingEnabled: false,
    networkCallsEnabled: false,
    liveOrderPlacementEnabled: false,
    methodContracts: EXCHANGE_ADAPTER_METHODS.map(createDisabledMethodContract),
    safetyContract: {
      secretsAccepted: false,
      secretsLogged: false,
      databaseStoresSecrets: false,
      dryRunOnly: true,
      throwsOnUse: true
    },
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      goLiveAllowed: false,
      note: 'Disabled adapter scaffold only. It cannot load credentials, call exchanges, or place orders.'
    }
  };
}

function getExchangeAdapterScaffolds() {
  return EXCHANGE_ADAPTER_SCAFFOLDS
    .map(enrichScaffold)
    .sort((left, right) => left.exchangeName.localeCompare(right.exchangeName));
}

function getExchangeAdapterScaffold(exchangeName) {
  const normalizedExchangeName = normalizeExchangeName(exchangeName);
  const scaffold = EXCHANGE_ADAPTER_SCAFFOLDS
    .find(item => item.exchangeName === normalizedExchangeName);

  return scaffold ? enrichScaffold(scaffold) : null;
}

function createDisabledAdapterError(exchangeName, methodName) {
  const error = new Error(
    `Exchange adapter ${exchangeName}.${methodName} is disabled. No credential loading, network call, or live order execution is implemented.`
  );
  error.code = 'EXCHANGE_ADAPTER_DISABLED';
  error.statusCode = 501;
  error.details = {
    exchangeName,
    methodName,
    credentialLoadingEnabled: false,
    networkCallsEnabled: false,
    liveExecutionEnabled: false
  };
  return error;
}

function createDisabledExchangeAdapter(exchangeName = 'custom') {
  const scaffold = getExchangeAdapterScaffold(exchangeName) || getExchangeAdapterScaffold('custom');
  const adapter = {
    exchangeName: scaffold.exchangeName,
    implemented: false,
    credentialLoadingEnabled: false,
    networkCallsEnabled: false,
    liveExecutionEnabled: false,
    scaffold
  };

  for (const methodName of EXCHANGE_ADAPTER_METHODS) {
    adapter[methodName] = async () => {
      throw createDisabledAdapterError(scaffold.exchangeName, methodName);
    };
  }

  return adapter;
}

module.exports = {
  EXCHANGE_ADAPTER_METHODS,
  createDisabledExchangeAdapter,
  getExchangeAdapterScaffold,
  getExchangeAdapterScaffolds
};
