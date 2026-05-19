const SECRET_FIELD_PATTERN = /(api[_-]?key|secret|private[_-]?key|seed|mnemonic|passphrase|password|token)/i;
const SECRET_VALUE_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b[A-Za-z0-9_-]{48,}\b/
];
const SECRET_METADATA_FIELD_ALLOWLIST = new Set([
  'secretreferenceid',
  'secret_reference_id',
  'secretreferencelabel',
  'secret_reference_label',
  'secretreferencestatus',
  'secret_reference_status',
  'secretreferenceprovidertype',
  'secret_reference_provider_type',
  'secretstoragenote',
  'secret_storage_note',
  'permission_scope_json',
  'permissionscope',
  'view_public_address',
  'request_signature',
  'deploy_contract',
  'mint_token',
  'transfer_assets',
  'trade_execution',
  'bridge_assets',
  'treasury_spend',
  'admin_recovery'
]);
const LOCAL_SECRET_PROVIDER_TYPES = new Set(['macos_keychain', 'onepassword', 'env_var_name', 'local_vault_path', 'other_reference']);
const LOCAL_SECRET_SCOPES = new Set(['exchange_connector', 'wallet_connector', 'deployment_key', 'generic']);
const LOCAL_SECRET_STATUSES = new Set(['planned', 'missing', 'configured', 'disabled']);
const EXCHANGE_CONNECTOR_MODES = new Set(['paper', 'read_only', 'live_disabled']);
const EXCHANGE_CONNECTOR_STATUSES = new Set(['planned', 'configured', 'disabled', 'archived']);

function createSecretSafetyError(message, statusCode = 400, details = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, details);
  return error;
}

function findSensitiveFields(value, prefix = '') {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findSensitiveFields(item, `${prefix}[${index}]`));
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const pathLabel = prefix ? `${prefix}.${key}` : key;
    const safeMetadataField = SECRET_METADATA_FIELD_ALLOWLIST.has(String(key).toLowerCase());
    const matches = !safeMetadataField && SECRET_FIELD_PATTERN.test(key) ? [pathLabel] : [];
    return matches.concat(findSensitiveFields(nestedValue, pathLabel));
  });
}

function findLikelySecretValues(value, prefix = '') {
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') {
      return [];
    }

    const trimmed = value.trim();
    return SECRET_VALUE_PATTERNS.some(pattern => pattern.test(trimmed)) ? [prefix || 'value'] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findLikelySecretValues(item, `${prefix}[${index}]`));
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const pathLabel = prefix ? `${prefix}.${key}` : key;
    return findLikelySecretValues(nestedValue, pathLabel);
  });
}

function hasBodyField(body, ...keys) {
  return keys.some(key => Object.prototype.hasOwnProperty.call(body || {}, key));
}

function firstBodyValue(body, keys, fallback) {
  for (const key of keys) {
    if (hasBodyField(body, key)) {
      return body[key];
    }
  }

  return fallback;
}

function assertNoInlineSecretPayload(body, message) {
  const sensitiveFields = findSensitiveFields(body || {});
  const likelySecretValues = findLikelySecretValues(body || {});

  if (sensitiveFields.length || likelySecretValues.length) {
    throw createSecretSafetyError(message, 400, {
      sensitiveFields,
      likelySecretValues
    });
  }
}

function sanitizeLocalSecretReferenceInput(body = {}, current = null) {
  assertNoInlineSecretPayload(
    body,
    'Local secret reference records cannot contain secret values. Store only the local vault/keychain reference name.'
  );

  const label = String(firstBodyValue(body, ['label'], current?.label || '') || '').trim().slice(0, 120);
  const providerType = String(firstBodyValue(body, ['providerType', 'provider_type'], current?.provider_type || 'macos_keychain') || '')
    .trim()
    .toLowerCase();
  const referenceName = String(firstBodyValue(body, ['referenceName', 'reference_name'], current?.reference_name || '') || '')
    .trim()
    .slice(0, 180);
  const scope = String(firstBodyValue(body, ['scope'], current?.scope || 'exchange_connector') || '')
    .trim()
    .toLowerCase();
  const status = String(firstBodyValue(body, ['status'], current?.status || 'planned') || '')
    .trim()
    .toLowerCase();
  const notes = String(firstBodyValue(body, ['notes'], current?.notes || '') || '').trim().slice(0, 1000);

  if (!label) {
    throw createSecretSafetyError('Secret reference label is required');
  }

  if (!referenceName || /[\r\n=]/.test(referenceName)) {
    throw createSecretSafetyError('Reference name is required and cannot contain newlines or equals signs');
  }

  if (!LOCAL_SECRET_PROVIDER_TYPES.has(providerType)) {
    throw createSecretSafetyError('Provider type must be macos_keychain, onepassword, env_var_name, local_vault_path, or other_reference');
  }

  if (!LOCAL_SECRET_SCOPES.has(scope)) {
    throw createSecretSafetyError('Scope must be exchange_connector, wallet_connector, deployment_key, or generic');
  }

  if (!LOCAL_SECRET_STATUSES.has(status)) {
    throw createSecretSafetyError('Status must be planned, missing, configured, or disabled');
  }

  return {
    label,
    providerType,
    referenceName,
    scope,
    status,
    notes
  };
}

function sanitizeExchangeConnectorInput(body = {}, current = null) {
  assertNoInlineSecretPayload(
    body,
    'Connector records cannot store secrets. Keep API keys in an external local vault.'
  );

  const exchangeName = String(firstBodyValue(body, ['exchangeName', 'exchange_name'], current?.exchange_name || '') || '')
    .trim()
    .toLowerCase();
  const label = String(firstBodyValue(body, ['label'], current?.label || exchangeName || 'Exchange connector') || '')
    .trim()
    .slice(0, 120);
  const mode = String(firstBodyValue(body, ['mode'], current?.mode || 'paper') || '')
    .trim()
    .toLowerCase();
  const status = String(firstBodyValue(body, ['status'], current?.status || (mode === 'live_disabled' ? 'disabled' : 'planned')) || '')
    .trim()
    .toLowerCase();
  const rawSecretReferenceId = firstBodyValue(body, ['secretReferenceId', 'secret_reference_id'], current?.secret_reference_id || null);
  const secretReferenceId = rawSecretReferenceId ? Number(rawSecretReferenceId) : null;
  const rawSettings = firstBodyValue(body, ['settings'], current?.settings || {});
  const settings = rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings)
    ? rawSettings
    : {};

  if (!exchangeName) {
    throw createSecretSafetyError('Exchange name is required');
  }

  if (!EXCHANGE_CONNECTOR_MODES.has(mode)) {
    throw createSecretSafetyError('Mode must be paper, read_only, or live_disabled');
  }

  if (!EXCHANGE_CONNECTOR_STATUSES.has(status)) {
    throw createSecretSafetyError('Status must be planned, configured, disabled, or archived');
  }

  if (secretReferenceId !== null && (!Number.isInteger(secretReferenceId) || secretReferenceId <= 0)) {
    throw createSecretSafetyError('Secret reference ID must be a positive integer');
  }

  return {
    exchangeName,
    label,
    mode,
    status,
    secretReferenceId,
    settings
  };
}

module.exports = {
  SECRET_FIELD_PATTERN,
  SECRET_VALUE_PATTERNS,
  SECRET_METADATA_FIELD_ALLOWLIST,
  LOCAL_SECRET_PROVIDER_TYPES,
  LOCAL_SECRET_SCOPES,
  LOCAL_SECRET_STATUSES,
  EXCHANGE_CONNECTOR_MODES,
  EXCHANGE_CONNECTOR_STATUSES,
  createSecretSafetyError,
  findSensitiveFields,
  findLikelySecretValues,
  assertNoInlineSecretPayload,
  sanitizeLocalSecretReferenceInput,
  sanitizeExchangeConnectorInput
};
