const DEFAULT_SAFE_COMMAND_PREFIXES = [
  'git status',
  'git diff',
  'npm test',
  'npm run build',
  'npm run test',
  'npm run lint',
  'node --check'
];

const HARD_BLOCKED_COMMAND_BINS = new Set([
  'rm',
  'sudo',
  'su',
  'chmod',
  'chown',
  'mkfs',
  'dd',
  'shutdown',
  'reboot',
  'kill',
  'pkill',
  'killall'
]);

function sanitizeTrustedCommandPrefixes(value) {
  const rawPrefixes = Array.isArray(value)
    ? value
    : String(value || '').split(/\r?\n/);
  const prefixes = [];

  for (const rawPrefix of rawPrefixes) {
    const prefix = String(rawPrefix || '').trim().replace(/\s+/g, ' ');

    if (!prefix) {
      continue;
    }

    if (prefix.length > 120) {
      throw new Error('Trusted command prefixes must be 120 characters or fewer');
    }

    if (/[;&|<>`$()]/.test(prefix)) {
      throw new Error('Trusted command prefixes cannot include shell control characters');
    }

    const [bin] = prefix.split(' ');

    if (HARD_BLOCKED_COMMAND_BINS.has(bin)) {
      throw new Error(`Command prefix is hard-blocked: ${bin}`);
    }

    if (!prefixes.includes(prefix)) {
      prefixes.push(prefix);
    }
  }

  if (!prefixes.length) {
    throw new Error('At least one trusted command prefix is required');
  }

  if (prefixes.length > 50) {
    throw new Error('No more than 50 trusted command prefixes are allowed');
  }

  return prefixes;
}

function splitCommandForExec(command) {
  const normalized = String(command || '').trim().replace(/\s+/g, ' ');

  if (!normalized) {
    throw new Error('Command is empty');
  }

  if (/[;&|<>`$()]/.test(normalized)) {
    throw new Error('Shell control characters are not allowed in command requests');
  }

  const parts = normalized.split(' ');
  const [bin, ...args] = parts;

  if (HARD_BLOCKED_COMMAND_BINS.has(bin)) {
    throw new Error(`Command is hard-blocked in local automation: ${bin}`);
  }

  return {
    normalized,
    bin,
    args
  };
}

module.exports = {
  DEFAULT_SAFE_COMMAND_PREFIXES,
  HARD_BLOCKED_COMMAND_BINS,
  sanitizeTrustedCommandPrefixes,
  splitCommandForExec
};
