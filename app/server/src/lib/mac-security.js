const COMMAND_TIMEOUT_MS = 12000;
const MAX_COMMAND_OUTPUT = 4000;

const MAC_SECURITY_COMMANDS = [
  {
    id: 'filevault',
    category: 'Device Encryption',
    label: 'FileVault full-disk encryption',
    command: '/usr/bin/fdesetup',
    args: ['status'],
    severity: 'block',
    ownerAction: 'Turn on FileVault in System Settings > Privacy & Security > FileVault.',
    parse: output => /FileVault is On/i.test(output)
      ? pass('FileVault is on.')
      : fail('FileVault does not appear to be on.')
  },
  {
    id: 'firewall_global',
    category: 'Firewall',
    label: 'macOS firewall',
    command: '/usr/libexec/ApplicationFirewall/socketfilterfw',
    args: ['--getglobalstate'],
    severity: 'block',
    ownerAction: 'Turn on Firewall in System Settings > Network > Firewall.',
    parse: output => /State\s*=\s*(1|2)|enabled|on|blocking all/i.test(output)
      ? pass(cleanOutput(output))
      : fail('Firewall does not appear to be enabled.')
  },
  {
    id: 'firewall_stealth',
    category: 'Firewall',
    label: 'Firewall stealth mode',
    command: '/usr/libexec/ApplicationFirewall/socketfilterfw',
    args: ['--getstealthmode'],
    severity: 'review',
    ownerAction: 'Enable stealth mode in Firewall Options.',
    parse: output => /stealth mode is on|enabled/i.test(output)
      ? pass('Stealth mode is on.')
      : review('Stealth mode was not confirmed on.')
  },
  {
    id: 'firewall_block_all',
    category: 'Firewall',
    label: 'Block non-essential incoming connections',
    command: '/usr/libexec/ApplicationFirewall/socketfilterfw',
    args: ['--getblockall'],
    severity: 'review',
    ownerAction: 'For highest lockdown, enable Block all incoming connections in Firewall Options when it will not break required local workflows.',
    parse: output => /blocking all|block all.*enabled/i.test(output)
      ? pass('Firewall is blocking non-essential incoming connections.')
      : review('Block-all incoming mode was not confirmed.')
  },
  {
    id: 'firewall_allow_signed_builtin',
    category: 'Firewall',
    label: 'Auto-allow built-in signed software',
    command: '/usr/libexec/ApplicationFirewall/socketfilterfw',
    args: ['--getallowsigned'],
    severity: 'review',
    ownerAction: 'For extreme lockdown, consider disabling automatic allow for signed software after confirming essential Apple services still work.',
    parse: output => /DISABLED/i.test(output)
      ? pass('Automatic allow for built-in signed software is disabled.')
      : review('Automatic allow for built-in signed software is enabled.')
  },
  {
    id: 'gatekeeper',
    category: 'Application Control',
    label: 'Gatekeeper assessments',
    command: '/usr/sbin/spctl',
    args: ['--status'],
    severity: 'block',
    ownerAction: 'Enable Gatekeeper with `spctl --master-enable` from an admin terminal if it is disabled.',
    parse: output => /assessments enabled/i.test(output)
      ? pass('Gatekeeper assessments are enabled.')
      : fail('Gatekeeper assessments are not enabled.')
  },
  {
    id: 'sip',
    category: 'System Integrity',
    label: 'System Integrity Protection',
    command: '/usr/bin/csrutil',
    args: ['status'],
    severity: 'block',
    ownerAction: 'Keep SIP enabled. If disabled, re-enable from macOS Recovery before operating EtherealAI.',
    parse: output => /enabled/i.test(output)
      ? pass('System Integrity Protection is enabled.')
      : fail('System Integrity Protection is not enabled.')
  },
  {
    id: 'automatic_update_check',
    category: 'Updates',
    label: 'Automatic update checks',
    command: '/usr/sbin/softwareupdate',
    args: ['--schedule'],
    severity: 'review',
    ownerAction: 'Keep automatic update checks enabled, then manually approve major OS updates after backup.',
    parse: output => /turned on|on/i.test(output)
      ? pass('Automatic update checks are on.')
      : review('Automatic update checks were not confirmed on.')
  },
  {
    id: 'mdm_enrollment',
    category: 'Admin Control',
    label: 'MDM / device management enrollment',
    command: '/usr/bin/profiles',
    args: ['status', '-type', 'enrollment'],
    severity: 'block',
    ownerAction: 'If MDM enrollment is unexpected, treat the Mac as managed by someone else and plan clean-room recovery before using it for secrets.',
    parse: output => /Enrolled via DEP:\s*No/i.test(output) && /MDM enrollment:\s*No/i.test(output)
      ? pass('No DEP or MDM enrollment was reported.')
      : fail('MDM or DEP enrollment was reported or could not be ruled out.')
  },
  {
    id: 'user_crontab',
    category: 'Persistence',
    label: 'User crontab',
    command: '/usr/bin/crontab',
    args: ['-l'],
    severity: 'review',
    ownerAction: 'If a crontab exists, review every command before deleting anything. Unknown scheduled commands are persistence risk.',
    parse: output => /no crontab/i.test(output)
      ? pass('No user crontab was reported.')
      : review('A user crontab exists or could not be ruled out.')
  },
  {
    id: 'system_extensions',
    category: 'Kernel And System Extensions',
    label: 'System extensions',
    command: '/usr/bin/systemextensionsctl',
    args: ['list'],
    severity: 'review',
    ownerAction: 'Review any system extension. Unknown network, security, input, or disk extensions are high-risk on a suspected compromised host.',
    parse: output => /^0 extension\(s\)/i.test(cleanOutput(output)) || /no system extensions/i.test(output)
      ? pass('No system extensions were reported.')
      : review('System extensions exist or could not be ruled out.')
  },
  {
    id: 'remote_login',
    category: 'Remote Access',
    label: 'Remote Login / SSH',
    command: '/usr/sbin/systemsetup',
    args: ['-getremotelogin'],
    severity: 'block',
    ownerAction: 'Turn Remote Login off in System Settings > General > Sharing unless you are actively using SSH on a trusted network.',
    parse: output => parseOnOffOutput(output, 'Remote Login is off.', 'Remote Login appears to be on.')
  },
  {
    id: 'remote_apple_events',
    category: 'Remote Access',
    label: 'Remote Apple Events',
    command: '/usr/sbin/systemsetup',
    args: ['-getremoteappleevents'],
    severity: 'block',
    ownerAction: 'Turn Remote Apple Events off in System Settings > General > Sharing.',
    parse: output => parseOnOffOutput(output, 'Remote Apple Events are off.', 'Remote Apple Events appear to be on.')
  },
  {
    id: 'airdrop_disabled',
    category: 'Nearby Sharing',
    label: 'AirDrop disabled for this user',
    command: '/usr/bin/defaults',
    args: ['read', 'com.apple.NetworkBrowser', 'DisableAirDrop'],
    severity: 'review',
    ownerAction: 'Set AirDrop to No One, or run the local user-level hardening command that disables AirDrop.',
    parse: output => /^1|true|yes$/i.test(cleanOutput(output))
      ? pass('AirDrop is disabled for this user.')
      : review('AirDrop disable preference was not confirmed.')
  },
  {
    id: 'handoff_advertising_disabled',
    category: 'Nearby Sharing',
    label: 'Handoff advertising disabled for this user',
    command: '/usr/bin/defaults',
    args: ['-currentHost', 'read', 'com.apple.coreservices.useractivityd', 'ActivityAdvertisingAllowed'],
    severity: 'review',
    ownerAction: 'Keep Handoff disabled while using a shared or hostile network.',
    parse: output => parseDisabledBooleanOutput(output, 'Handoff advertising is disabled for this user.', 'Handoff advertising was not confirmed disabled.')
  },
  {
    id: 'handoff_receiving_disabled',
    category: 'Nearby Sharing',
    label: 'Handoff receiving disabled for this user',
    command: '/usr/bin/defaults',
    args: ['-currentHost', 'read', 'com.apple.coreservices.useractivityd', 'ActivityReceivingAllowed'],
    severity: 'review',
    ownerAction: 'Keep Handoff receiving disabled while using a shared or hostile network.',
    parse: output => parseDisabledBooleanOutput(output, 'Handoff receiving is disabled for this user.', 'Handoff receiving was not confirmed disabled.')
  },
  {
    id: 'wifi_dns_servers',
    category: 'Network Trust',
    label: 'Wi-Fi DNS resolvers',
    command: '/usr/sbin/networksetup',
    args: ['-getdnsservers', 'Wi-Fi'],
    severity: 'review',
    ownerAction: 'Use owner-chosen public DNS or encrypted DNS. Avoid accepting DNS from an untrusted shared router.',
    parse: output => parseDnsServerOutput(output)
  },
  {
    id: 'wifi_web_proxy',
    category: 'Network Trust',
    label: 'Wi-Fi HTTP proxy',
    command: '/usr/sbin/networksetup',
    args: ['-getwebproxy', 'Wi-Fi'],
    severity: 'block',
    ownerAction: 'Turn off unexpected HTTP proxies in System Settings > Network > Wi-Fi > Details > Proxies.',
    parse: output => parseProxyOutput(output, 'HTTP proxy is disabled for Wi-Fi.', 'HTTP proxy is enabled or could not be ruled out.')
  },
  {
    id: 'wifi_secure_web_proxy',
    category: 'Network Trust',
    label: 'Wi-Fi HTTPS proxy',
    command: '/usr/sbin/networksetup',
    args: ['-getsecurewebproxy', 'Wi-Fi'],
    severity: 'block',
    ownerAction: 'Turn off unexpected HTTPS proxies in System Settings > Network > Wi-Fi > Details > Proxies.',
    parse: output => parseProxyOutput(output, 'HTTPS proxy is disabled for Wi-Fi.', 'HTTPS proxy is enabled or could not be ruled out.')
  },
  {
    id: 'wifi_socks_proxy',
    category: 'Network Trust',
    label: 'Wi-Fi SOCKS proxy',
    command: '/usr/sbin/networksetup',
    args: ['-getsocksfirewallproxy', 'Wi-Fi'],
    severity: 'block',
    ownerAction: 'Turn off unexpected SOCKS proxies in System Settings > Network > Wi-Fi > Details > Proxies.',
    parse: output => parseProxyOutput(output, 'SOCKS proxy is disabled for Wi-Fi.', 'SOCKS proxy is enabled or could not be ruled out.')
  },
  {
    id: 'password_after_sleep',
    category: 'Screen Lock',
    label: 'Password required after sleep/screensaver',
    command: '/usr/bin/defaults',
    args: ['read', 'com.apple.screensaver', 'askForPassword'],
    severity: 'block',
    ownerAction: 'Require password immediately after screen saver begins or display turns off.',
    parse: output => /^1|true|yes$/i.test(cleanOutput(output))
      ? pass('Password is required after sleep/screensaver.')
      : fail('Password-after-sleep preference is not enabled for this user.')
  },
  {
    id: 'password_after_sleep_delay',
    category: 'Screen Lock',
    label: 'Password delay after sleep/screensaver',
    command: '/usr/bin/defaults',
    args: ['read', 'com.apple.screensaver', 'askForPasswordDelay'],
    severity: 'review',
    ownerAction: 'Set password delay to immediately / zero seconds.',
    parse: output => Number(cleanOutput(output)) === 0
      ? pass('Password delay is immediate.')
      : review('Password delay is not confirmed as immediate.')
  }
];

function cleanOutput(value = '', maxLength = MAX_COMMAND_OUTPUT) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function pass(message) {
  return {
    status: 'pass',
    passed: true,
    message
  };
}

function fail(message) {
  return {
    status: 'fail',
    passed: false,
    message
  };
}

function review(message) {
  return {
    status: 'review',
    passed: false,
    message
  };
}

function unknown(message) {
  return {
    status: 'unknown',
    passed: false,
    message
  };
}

function parseOnOffOutput(output, offMessage, onMessage) {
  if (/:\s*off\b|\boff\b/i.test(output)) {
    return pass(offMessage);
  }

  if (/:\s*on\b|\bon\b/i.test(output)) {
    return fail(onMessage);
  }

  if (/administrator access|not permitted|operation not permitted|permission denied/i.test(output)) {
    return unknown('macOS requires an administrator check for this setting.');
  }

  return unknown('This setting could not be confirmed from the local audit.');
}

function parseDisabledBooleanOutput(output, passMessage, reviewMessage) {
  const normalized = cleanOutput(output).toLowerCase();

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return pass(passMessage);
  }

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return review(reviewMessage);
  }

  if (/does not exist|not found|domain.*does not exist/i.test(output)) {
    return review('Preference was not set explicitly; confirm manually in System Settings.');
  }

  return unknown('This preference could not be confirmed from the local audit.');
}

function parseProxyOutput(output, passMessage, failMessage) {
  if (/Enabled:\s*No/i.test(output)) {
    return pass(passMessage);
  }

  if (/Enabled:\s*Yes/i.test(output)) {
    return fail(failMessage);
  }

  return unknown('Proxy state could not be confirmed from the local audit.');
}

function parseDnsServerOutput(output = '') {
  const text = String(output || '');

  if (/There aren't any DNS Servers set/i.test(text)) {
    return review('Wi-Fi is accepting DNS from the current network instead of explicit owner-chosen resolvers.');
  }

  const servers = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(line));
  const privateResolvers = servers.filter(server => (
    /^10\./.test(server)
    || /^192\.168\./.test(server)
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(server)
  ));
  const ownerChosenResolvers = new Set(['1.1.1.1', '1.0.0.1', '9.9.9.9', '149.112.112.112']);
  const hasOwnerChosenResolver = servers.some(server => ownerChosenResolvers.has(server));

  if (privateResolvers.length) {
    return review(`Wi-Fi DNS includes private/router resolver(s): ${privateResolvers.join(', ')}.`);
  }

  if (hasOwnerChosenResolver) {
    return pass(`Wi-Fi DNS is set to explicit public resolvers: ${servers.join(', ')}.`);
  }

  return review(`Wi-Fi DNS uses resolver(s) that need owner review: ${servers.join(', ') || 'none parsed'}.`);
}

function parseAdminMembers(output = '') {
  const match = String(output || '').match(/GroupMembership:\s*(.+)$/im);

  if (!match) {
    return [];
  }

  return match[1].split(/\s+/).map(item => item.trim()).filter(Boolean);
}

function isSafeAccountName(member = '') {
  return /^[A-Za-z0-9._-]+$/.test(member);
}

function parseDsclAttribute(output = '', key = '') {
  const lines = String(output || '').split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.startsWith(`${key}:`)) {
      continue;
    }

    const values = [];
    const firstValue = line.slice(`${key}:`.length).trim();

    if (firstValue) {
      values.push(firstValue);
    }

    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
      const nextLine = lines[nextIndex];

      if (/^\S[^:]*:\s*/.test(nextLine) || /^No such key:/i.test(nextLine)) {
        break;
      }

      const nextValue = nextLine.trim();

      if (nextValue) {
        values.push(nextValue);
      }
    }

    return values.join(' ').trim();
  }

  return '';
}

function parseSecureTokenStatus(output = '') {
  if (/Secure token is ENABLED/i.test(output)) {
    return 'enabled';
  }

  if (/Secure token is DISABLED/i.test(output)) {
    return 'disabled';
  }

  return 'unknown';
}

function classifyAdminAccount({ member, uid, hidden }) {
  const normalized = String(member || '').toLowerCase();

  if (normalized === 'root') {
    return 'system_builtin';
  }

  if (normalized.startsWith('_')) {
    return 'system_hidden';
  }

  if (hidden === true) {
    return 'system_hidden';
  }

  if (Number.isFinite(uid) && uid < 500) {
    return 'system_service';
  }

  return 'human_admin';
}

function buildAdminAccountRecord(member, dsclOutput = '', secureTokenOutput = '') {
  const uidValue = Number(parseDsclAttribute(dsclOutput, 'UniqueID'));
  const realName = parseDsclAttribute(dsclOutput, 'RealName') || member;
  const homeDirectory = parseDsclAttribute(dsclOutput, 'NFSHomeDirectory');
  const shell = parseDsclAttribute(dsclOutput, 'UserShell');
  const hiddenValue = parseDsclAttribute(dsclOutput, 'dsAttrTypeNative:IsHidden')
    || parseDsclAttribute(dsclOutput, 'IsHidden');
  const hidden = /^yes|true|1$/i.test(hiddenValue);
  const classification = classifyAdminAccount({
    member,
    uid: uidValue,
    hidden
  });

  return {
    member,
    realName,
    uid: Number.isFinite(uidValue) ? uidValue : null,
    hidden,
    homeDirectory,
    shell,
    classification,
    secureToken: parseSecureTokenStatus(secureTokenOutput),
    hasAuthenticationAuthority: /AuthenticationAuthority:/i.test(dsclOutput)
  };
}

async function getAdminAccountAudit(execFileCapture) {
  const groupResult = normalizeCommandResult(await execFileCapture('/usr/bin/dscl', [
    '.',
    '-read',
    '/Groups/admin',
    'GroupMembership'
  ], {
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: 1024 * 1024
  }));
  const members = parseAdminMembers(groupResult.output).filter(isSafeAccountName);

  if (!members.length) {
    return {
      check: {
        id: 'admin_group_membership',
        category: 'Admin Control',
        label: 'Local admin accounts',
        severity: 'review',
        status: 'unknown',
        passed: false,
        message: 'Admin group membership could not be parsed.',
        ownerAction: 'Open System Settings > Users & Groups and confirm only expected admins exist.',
        commandLabel: '/usr/bin/dscl . -read /Groups/admin GroupMembership',
        localOnly: true,
        privilegedMutation: false
      },
      accounts: []
    };
  }

  const accounts = [];

  for (const member of members) {
    const detailResult = normalizeCommandResult(await execFileCapture('/usr/bin/dscl', [
      '.',
      '-read',
      `/Users/${member}`,
      'UniqueID',
      'RealName',
      'RecordName',
      'NFSHomeDirectory',
      'UserShell',
      'IsHidden',
      'AuthenticationAuthority'
    ], {
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 1024 * 1024
    }));
    const secureTokenResult = normalizeCommandResult(await execFileCapture('/usr/sbin/sysadminctl', [
      '-secureTokenStatus',
      member
    ], {
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 1024 * 1024
    }));

    accounts.push(buildAdminAccountRecord(member, detailResult.output, secureTokenResult.output));
  }

  const humanAdmins = accounts.filter(account => account.classification === 'human_admin');
  const systemAdmins = accounts.filter(account => account.classification !== 'human_admin');

  return {
    check: {
      id: 'admin_group_membership',
      category: 'Admin Control',
      label: 'Local admin accounts',
      severity: 'review',
      status: 'review',
      passed: false,
      message: [
        `${humanAdmins.length} visible human admin account(s): ${humanAdmins.map(account => account.member).join(', ') || 'none'}.`,
        `${systemAdmins.length} built-in/system admin member(s): ${systemAdmins.map(account => account.member).join(', ') || 'none'}.`
      ].join(' '),
      ownerAction: 'Confirm the human admin list is expected. Do not remove built-in/system admin members without backup and Apple/macOS recovery planning.',
      commandLabel: '/usr/bin/dscl . -read /Groups/admin GroupMembership',
      localOnly: true,
      privilegedMutation: false
    },
    accounts,
    humanAdmins,
    systemAdmins
  };
}

function normalizeCommandResult(result = {}) {
  const stdout = String(result.stdout || '').trim();
  const stderr = String(result.stderr || '').trim();

  return {
    exitCode: typeof result.exitCode === 'number' ? result.exitCode : 0,
    stdout,
    stderr,
    output: [stdout, stderr].filter(Boolean).join('\n').trim(),
    error: result.error || null
  };
}

async function runCheck(execFileCapture, spec) {
  const result = normalizeCommandResult(await execFileCapture(spec.command, spec.args, {
    timeout: COMMAND_TIMEOUT_MS
  }));
  const output = result.output;
  const parsed = output
    ? spec.parse(output, result)
    : unknown('No output was returned for this check.');

  return {
    id: spec.id,
    category: spec.category,
    label: spec.label,
    severity: spec.severity,
    status: parsed.status,
    passed: parsed.passed,
    message: parsed.message,
    ownerAction: spec.ownerAction,
    commandLabel: `${spec.command} ${spec.args.join(' ')}`,
    exitCode: result.exitCode,
    localOnly: true,
    privilegedMutation: false
  };
}

function parseListeningPorts(output = '') {
  const seen = new Set();

  return String(output || '')
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const columns = line.split(/\s+/);
      const name = columns.slice(8).join(' ') || columns[8] || '';
      const command = columns[0] || 'unknown';
      const pid = columns[1] || 'unknown';
      const isLoopback = /127\.0\.0\.1|localhost|\[::1\]|::1/.test(name);
      const isWildcard = /\*:/.test(name) || /0\.0\.0\.0/.test(name) || /\[::\]/.test(name);
      const portMatch = name.match(/:(\d+)\s*(?:\(|$)/);

      return {
        command,
        pid,
        name,
        port: portMatch ? Number(portMatch[1]) : null,
        exposure: isLoopback ? 'loopback_only' : isWildcard ? 'all_interfaces' : 'review',
        ownerAction: isLoopback
          ? 'No action needed for loopback-only local developer service.'
          : 'Review this listener. If it is not required, close the app or disable the sharing service that opened it.'
      };
    })
    .filter(port => {
      const key = `${port.command}:${port.port}:${port.exposure}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function parseEstablishedConnections(output = '') {
  const seen = new Set();

  return String(output || '')
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => /\(ESTABLISHED\)|\sESTABLISHED\s/i.test(line))
    .map(line => {
      const columns = line.split(/\s+/);
      const command = columns[0] || 'unknown';
      const pid = columns[1] || 'unknown';
      const user = columns[2] || 'unknown';
      const name = columns.slice(8).join(' ') || columns[8] || '';
      const remote = name.includes('->') ? name.split('->').slice(1).join('->') : '';
      const loopbackOnly = /127\.0\.0\.1|localhost|\[::1\]|::1/.test(name);
      const encryptedCommonPort = /:(443|993|5223|5228)(?:\s|\(|$)|\.(443|993|5223|5228)(?:\s|\(|$)/.test(remote);

      return {
        command,
        pid,
        user,
        name,
        remote,
        exposure: loopbackOnly ? 'loopback_only' : encryptedCommonPort ? 'common_encrypted_outbound' : 'review_outbound',
        ownerAction: 'Review unfamiliar outbound apps or destinations. Normal browser, mail, Apple push, and Codex HTTPS connections are expected during active use.'
      };
    })
    .filter(connection => {
      const key = `${connection.command}:${connection.pid}:${connection.remote}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 120);
}

async function getEstablishedConnectionAudit(execFileCapture) {
  const result = normalizeCommandResult(await execFileCapture('/usr/sbin/lsof', [
    '-nP',
    '-iTCP'
  ], {
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: 1024 * 1024
  }));
  const connections = parseEstablishedConnections(result.output);
  const reviewConnections = connections.filter(connection => connection.exposure === 'review_outbound');

  return {
    id: 'established_connections',
    category: 'Network Exposure',
    label: 'Outbound network connections',
    severity: 'review',
    status: connections.length ? 'review' : 'pass',
    passed: connections.length === 0,
    message: connections.length
      ? `${connections.length} outbound TCP connection(s) were visible during this audit; ${reviewConnections.length} use less-common ports or need closer review.`
      : 'No outbound TCP connections were visible at the audit moment.',
    ownerAction: 'Review unfamiliar outbound connections, especially remote-control tools, tunnels, proxies, or non-browser traffic.',
    connections,
    localOnly: true,
    privilegedMutation: false
  };
}

function parseProcessActivity(output = '') {
  const remoteToolPattern = /(anydesk|teamviewer|rustdesk|ngrok|cloudflared|tailscale|zerotier|frpc|frps|openvpn|wireguard)/i;

  return String(output || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^(\d+)\s+(\S+)\s+([\d.]+)\s+([\d.]+)\s+(.+)$/);

      if (!match) {
        return null;
      }

      const commandPath = match[5];
      const command = commandPath.split('/').filter(Boolean).pop() || commandPath;

      return {
        pid: Number(match[1]),
        user: match[2],
        cpuPercent: Number(match[3]),
        memoryPercent: Number(match[4]),
        command,
        commandPath,
        remoteAccessReview: remoteToolPattern.test(commandPath)
      };
    })
    .filter(Boolean);
}

async function getProcessActivityAudit(execFileCapture) {
  const result = normalizeCommandResult(await execFileCapture('/bin/ps', [
    '-axo',
    'pid=,user=,%cpu=,%mem=,comm='
  ], {
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: 1024 * 1024
  }));
  const processes = parseProcessActivity(result.output);
  const remoteAccessReview = processes.filter(process => process.remoteAccessReview);
  const topCpu = [...processes]
    .sort((left, right) => right.cpuPercent - left.cpuPercent)
    .slice(0, 20);
  const topMemory = [...processes]
    .sort((left, right) => right.memoryPercent - left.memoryPercent)
    .slice(0, 20);

  return {
    check: {
      id: 'activity_monitor_review',
      category: 'Process Activity',
      label: 'Activity Monitor remote-access process scan',
      severity: 'review',
      status: remoteAccessReview.length ? 'review' : 'pass',
      passed: remoteAccessReview.length === 0,
      message: remoteAccessReview.length
        ? `${remoteAccessReview.length} process(es) match common remote-access or tunnel tool names.`
        : 'No common third-party remote-access or tunnel process names were visible to this audit.',
      ownerAction: 'Review top CPU/memory processes and remove any remote-control, tunnel, or proxy tool you did not install.',
      localOnly: true,
      privilegedMutation: false
    },
    topCpu,
    topMemory,
    remoteAccessReview
  };
}

function parseTopSummary(output = '') {
  const lines = String(output || '').split(/\r?\n/);
  const findLine = label => cleanOutput(lines.find(line => line.startsWith(label)) || '');

  return {
    processes: findLine('Processes:'),
    loadAverage: findLine('Load Avg:'),
    cpuUsage: findLine('CPU usage:'),
    physicalMemory: findLine('PhysMem:'),
    virtualMemory: findLine('VM:'),
    networks: findLine('Networks:'),
    disks: findLine('Disks:')
  };
}

async function getSystemResourceSnapshot(execFileCapture) {
  const result = normalizeCommandResult(await execFileCapture('/usr/bin/top', [
    '-l',
    '1',
    '-n',
    '0',
    '-stats',
    'pid'
  ], {
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: 1024 * 1024
  }));

  return parseTopSummary(result.output);
}

async function getListeningPortAudit(execFileCapture) {
  const result = normalizeCommandResult(await execFileCapture('/usr/sbin/lsof', [
    '-nP',
    '-iTCP',
    '-sTCP:LISTEN'
  ], {
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: 1024 * 1024
  }));
  const ports = parseListeningPorts(result.output);
  const externalPorts = ports.filter(port => port.exposure !== 'loopback_only');

  return {
    id: 'listening_ports',
    category: 'Network Exposure',
    label: 'Listening network services',
    severity: 'review',
    status: externalPorts.length ? 'review' : 'pass',
    passed: externalPorts.length === 0,
    message: externalPorts.length
      ? `${externalPorts.length} listener(s) are reachable beyond loopback and need owner review.`
      : 'No non-loopback TCP listeners were visible to this audit.',
    ownerAction: 'Close unnecessary apps and disable Sharing services that open network listeners.',
    ports,
    localOnly: true,
    privilegedMutation: false
  };
}

async function listDirectoryItems(execFileCapture, directoryPath) {
  const result = normalizeCommandResult(await execFileCapture('/bin/ls', ['-1', directoryPath], {
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: 1024 * 1024
  }));

  if (/No such file or directory/i.test(result.output)) {
    return [];
  }

  return result.output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 200);
}

async function getStartupItemAudit(execFileCapture, ownerHome = process.env.HOME || '/Users/ethereal') {
  const locations = [
    {
      id: 'user_launch_agents',
      label: 'User LaunchAgents',
      path: `${ownerHome}/Library/LaunchAgents`
    },
    {
      id: 'system_launch_agents',
      label: 'System LaunchAgents',
      path: '/Library/LaunchAgents'
    },
    {
      id: 'system_launch_daemons',
      label: 'System LaunchDaemons',
      path: '/Library/LaunchDaemons'
    }
  ];
  const folders = [];

  for (const location of locations) {
    try {
      folders.push({
        ...location,
        items: await listDirectoryItems(execFileCapture, location.path)
      });
    } catch (error) {
      folders.push({
        ...location,
        items: [],
        error: cleanOutput(error.message)
      });
    }
  }

  const totalItems = folders.reduce((total, folder) => total + folder.items.length, 0);
  const hasErrors = folders.some(folder => folder.error);

  return {
    id: 'startup_persistence_items',
    category: 'Persistence',
    label: 'LaunchAgents and LaunchDaemons',
    severity: 'review',
    status: hasErrors ? 'unknown' : totalItems ? 'review' : 'pass',
    passed: !hasErrors && totalItems === 0,
    message: hasErrors
      ? 'One or more startup-item folders could not be read.'
      : totalItems
        ? `${totalItems} startup persistence item(s) need owner review.`
        : 'No user/system LaunchAgents or LaunchDaemons were visible in the audited folders.',
    ownerAction: 'Review each startup item before deleting anything. Unknown LaunchAgents or LaunchDaemons are common persistence points.',
    folders,
    localOnly: true,
    privilegedMutation: false
  };
}

function getServerBindCheck({ serverHost = '127.0.0.1', port = 3000 } = {}) {
  const normalized = String(serverHost || '').trim().toLowerCase();
  const loopback = ['127.0.0.1', 'localhost', '::1'].includes(normalized);

  return {
    id: 'etherealai_bind_host',
    category: 'EtherealAI Server',
    label: 'EtherealAI local bind address',
    severity: 'block',
    status: loopback ? 'pass' : 'fail',
    passed: loopback,
    message: loopback
      ? `EtherealAI is configured to bind locally on ${serverHost}:${port}.`
      : `EtherealAI bind host is ${serverHost}:${port}; this may expose the dashboard on the network.`,
    ownerAction: 'Keep ETHEREALAI_HOST set to 127.0.0.1 unless you deliberately create a reviewed remote-access tunnel.',
    localOnly: true,
    privilegedMutation: false
  };
}

function summarizeChecks(checks = []) {
  const failCount = checks.filter(check => check.status === 'fail').length;
  const reviewCount = checks.filter(check => check.status === 'review').length;
  const unknownCount = checks.filter(check => check.status === 'unknown').length;
  const passCount = checks.filter(check => check.status === 'pass').length;

  return {
    status: failCount ? 'lockdown_required' : reviewCount || unknownCount ? 'owner_review_required' : 'hardened_visible_checks_passed',
    passCount,
    failCount,
    reviewCount,
    unknownCount,
    totalChecks: checks.length,
    localOnly: true,
    noPrivilegedMutations: true,
    noSecretInspection: true
  };
}

async function buildMacSecurityAudit({
  execFileCapture,
  platform = process.platform,
  serverHost = '127.0.0.1',
  port = 3000,
  ownerHome = process.env.HOME || '/Users/ethereal'
} = {}) {
  if (platform !== 'darwin') {
    const checks = [unknown('Mac security audit is only available on macOS.')];

    return {
      supported: false,
      platform,
      summary: summarizeChecks(checks),
      checks,
      listeningPorts: [],
      checkedAt: new Date().toISOString()
    };
  }

  const commandChecks = await Promise.all(MAC_SECURITY_COMMANDS.map(spec => (
    runCheck(execFileCapture, spec).catch(error => ({
      id: spec.id,
      category: spec.category,
      label: spec.label,
      severity: spec.severity,
      status: 'unknown',
      passed: false,
      message: cleanOutput(error.message || 'Unable to run check.'),
      ownerAction: spec.ownerAction,
      commandLabel: `${spec.command} ${spec.args.join(' ')}`,
      localOnly: true,
      privilegedMutation: false
    }))
  )));
  const adminAccounts = await getAdminAccountAudit(execFileCapture).catch(error => ({
    check: {
      id: 'admin_group_membership',
      category: 'Admin Control',
      label: 'Local admin accounts',
      severity: 'review',
      status: 'unknown',
      passed: false,
      message: cleanOutput(error.message || 'Unable to inspect admin account membership.'),
      ownerAction: 'Open System Settings > Users & Groups and confirm only expected admins exist.',
      commandLabel: '/usr/bin/dscl . -read /Groups/admin GroupMembership',
      localOnly: true,
      privilegedMutation: false
    },
    accounts: [],
    humanAdmins: [],
    systemAdmins: []
  }));
  const processActivity = await getProcessActivityAudit(execFileCapture).catch(error => ({
    check: {
      id: 'activity_monitor_review',
      category: 'Process Activity',
      label: 'Activity Monitor remote-access process scan',
      severity: 'review',
      status: 'unknown',
      passed: false,
      message: cleanOutput(error.message || 'Unable to inspect process activity.'),
      ownerAction: 'Manually review Activity Monitor CPU, Memory, Disk, and Network tabs for unknown remote-control tools or tunnels.',
      localOnly: true,
      privilegedMutation: false
    },
    topCpu: [],
    topMemory: [],
    remoteAccessReview: []
  }));
  const establishedConnections = await getEstablishedConnectionAudit(execFileCapture).catch(error => ({
    id: 'established_connections',
    category: 'Network Exposure',
    label: 'Outbound network connections',
    severity: 'review',
    status: 'unknown',
    passed: false,
    message: cleanOutput(error.message || 'Unable to inspect outbound network connections.'),
    ownerAction: 'Manually review Activity Monitor > Network and close unfamiliar apps.',
    connections: [],
    localOnly: true,
    privilegedMutation: false
  }));
  const systemResources = await getSystemResourceSnapshot(execFileCapture).catch(error => ({
    error: cleanOutput(error.message || 'Unable to inspect system resource summary.')
  }));
  const listeningPorts = await getListeningPortAudit(execFileCapture).catch(error => ({
    id: 'listening_ports',
    category: 'Network Exposure',
    label: 'Listening network services',
    severity: 'review',
    status: 'unknown',
    passed: false,
    message: cleanOutput(error.message || 'Unable to inspect listening ports.'),
    ownerAction: 'Manually review Activity Monitor and System Settings > General > Sharing.',
    ports: [],
    localOnly: true,
    privilegedMutation: false
  }));
  const startupItems = await getStartupItemAudit(execFileCapture, ownerHome).catch(error => ({
    id: 'startup_persistence_items',
    category: 'Persistence',
    label: 'LaunchAgents and LaunchDaemons',
    severity: 'review',
    status: 'unknown',
    passed: false,
    message: cleanOutput(error.message || 'Unable to inspect startup persistence folders.'),
    ownerAction: 'Manually inspect Login Items, Background Items, LaunchAgents, and LaunchDaemons.',
    folders: [],
    localOnly: true,
    privilegedMutation: false
  }));
  const serverBind = getServerBindCheck({ serverHost, port });
  const checks = [
    ...commandChecks,
    adminAccounts.check,
    processActivity.check,
    establishedConnections,
    listeningPorts,
    startupItems,
    serverBind
  ];

  return {
    supported: true,
    platform,
    summary: summarizeChecks(checks),
    checks,
    adminAccounts: {
      accounts: adminAccounts.accounts || [],
      humanAdmins: adminAccounts.humanAdmins || [],
      systemAdmins: adminAccounts.systemAdmins || []
    },
    systemResources,
    processActivity: {
      topCpu: processActivity.topCpu || [],
      topMemory: processActivity.topMemory || [],
      remoteAccessReview: processActivity.remoteAccessReview || []
    },
    establishedConnections: establishedConnections.connections || [],
    listeningPorts: listeningPorts.ports || [],
    startupItems: startupItems.folders || [],
    safetyBoundary: {
      localOnly: true,
      readOnlyAudit: true,
      privilegedMutation: false,
      secretInspection: false,
      routerMutation: false,
      vpnMutation: false
    },
    checkedAt: new Date().toISOString()
  };
}

function buildMacSecurityGuide() {
  return {
    title: 'Mac Security Lockdown Guide',
    operatingMode: 'assume_home_network_hostile',
    rules: [
      'Do not type wallet seed phrases, private keys, bank passwords, Apple ID passwords, or exchange API secrets into EtherealAI.',
      'Use this Mac only on networks you deliberately trust until the router and IoT device situation is cleaned up.',
      'VPNs can improve transport privacy, but they do not fix a compromised router, infected endpoint, stolen session, or malicious browser extension.',
      'Thirty chained routers increases complexity. Prefer one clean primary router, segmented VLANs or guest networks, disabled remote admin, and clean firmware.',
      'Treat every public post, DNS change, deployment, wallet signature, and exchange order as owner-approved only.'
    ],
    compromisedHostProtocol: [
      'If admin rights, MDM, system extensions, kernel-level tampering, or unexplained file deletion are suspected, do not treat this Mac as clean.',
      'Do not unlock hardware wallets, enter seed phrases, sign treasury transactions, or rotate high-value credentials from the suspect machine.',
      'Use this machine for read-only inspection, local code work, and evidence export only until clean-room recovery is complete.',
      'Preserve evidence before destructive cleanup: screenshots, exported proof packets, system audit output, router screenshots, and a list of suspicious processes or startup items.',
      'Plan recovery from a clean device and clean network, not from the same possibly compromised environment.'
    ],
    cleanRoomRecoveryPlan: [
      'Acquire or prepare a clean trusted device and a clean network path before rotating Apple ID, email, bank, exchange, GitHub, Cloudflare, or domain credentials.',
      'Back up only owner-created documents, project source, exported proof packets, and verified wallet-independent artifacts. Do not migrate apps, browser profiles, extensions, Login Items, LaunchAgents, LaunchDaemons, or old system settings.',
      'For Apple silicon, prefer a full erase/reinstall or DFU restore/revive from a clean second Mac when firmware or system-volume integrity is in doubt.',
      'After reinstall, create a new admin password, enable FileVault, enable firewall, keep Sharing services off, apply updates, then install only required software from trusted sources.',
      'Reconnect wallets only after the clean device, clean network, and account rotations are complete.'
    ],
    emergencyContainment: [
      'Keep hardware wallets and recovery material offline. Do not connect them to a suspect machine for routine browsing.',
      'Disconnect unnecessary Bluetooth, AirDrop, file sharing, screen sharing, remote login, and AirPlay Receiver.',
      'Do password rotations from the cleanest available device and network, then enable hardware security keys or passkeys where supported.',
      'Turn off router remote administration, WPS, UPnP, default passwords, and unused port forwards.',
      'Put cameras, TVs, tablets, Apple TV, and IoT devices on an isolated guest or IoT network that cannot reach this Mac.',
      'Use encrypted offline backups before OS updates or hardware migration.'
    ],
    airbnbNetworkPlan: [
      'Until you control the internet circuit, treat the Airbnb router as hostile infrastructure. Do not trust router DNS, router admin pages, or other devices on the LAN.',
      'Use this Mac firewall in block-all incoming mode, keep EtherealAI bound to 127.0.0.1, and keep AirDrop, Handoff, Remote Login, Screen Sharing, Remote Management, and AirPlay Receiver off.',
      'Use owner-chosen DNS resolvers or encrypted DNS. This session set Wi-Fi DNS to Cloudflare and Quad9 resolvers so DNS is not taken from the shared router.',
      'For higher assurance before the dedicated circuit arrives, use a travel router you own between the Airbnb network and your devices. Put the Mac behind that router firewall, use WPA3/WPA2 with a new strong passphrase, disable WPS/UPnP/remote admin, and do not bridge guest devices into the Mac network.',
      'When the dedicated internet is installed, use your own modem/ONT/router account, update firmware, disable ISP/router remote admin where possible, separate work/IoT/guest networks, and prefer wired Ethernet from your router to the Mac.'
    ],
    ownerSettingsChecklist: [
      {
        area: 'Suspected admin/kernel compromise',
        target: 'Treat the current Mac as untrusted for secrets until clean-room recovery. Do not use it for wallet signing, bank login, or credential rotation.'
      },
      {
        area: 'System Settings > General > Sharing',
        target: 'Turn off Remote Login, Screen Sharing, Remote Management, File Sharing, Remote Apple Events, Internet Sharing, Bluetooth Sharing, and AirPlay Receiver unless actively needed.'
      },
      {
        area: 'System Settings > Network > Firewall',
        target: 'Keep Firewall on, enable stealth mode, and use Block all incoming connections during high-risk periods.'
      },
      {
        area: 'System Settings > Privacy & Security',
        target: 'Keep FileVault on, Gatekeeper on, Lockdown Mode considered if you need maximum Apple ecosystem hardening, and review Full Disk Access, Accessibility, Input Monitoring, Screen Recording, and system extensions.'
      },
      {
        area: 'System Settings > Apple ID',
        target: 'Review trusted devices, sign out unknown devices, rotate password, and use recovery contacts/security keys if available.'
      },
      {
        area: 'Browsers',
        target: 'Remove unknown extensions, disable auto-open downloads, clear suspicious profiles, and keep a separate browser profile for finance/crypto.'
      },
      {
        area: 'Router',
        target: 'Replace or factory-reset suspect router, update firmware, use WPA3/WPA2 strong passphrase, disable WPS/UPnP/remote admin, and separate IoT devices.'
      }
    ],
    safeUserLevelChangesAppliedByCodex: [
      'Password required immediately after sleep/screensaver was set for this user.',
      'AirDrop disable preference was set for this user.',
      'Handoff advertising and Handoff receiving were disabled for this user.',
      'Wi-Fi DNS was set to explicit Cloudflare and Quad9 resolvers.',
      'Wi-Fi HTTP, HTTPS, and SOCKS proxy settings were checked and confirmed off.',
      'SSH file permissions were tightened for this user.',
      'Finder was configured not to write .DS_Store metadata to network or USB volumes.',
      'Apple personalized advertising preference was disabled for this user.',
      'Filename extensions were set visible for this user.',
      'Finder file-extension change warning was set on for this user.'
    ],
    adminOnlyActions: [
      'Confirm all admin users are expected, including hidden or setup-created accounts.',
      'Confirm MDM/device-management enrollment is absent unless intentionally owned by you.',
      'Review LaunchAgents, LaunchDaemons, user crontab, Login Items, Background Items, and system extensions.',
      'Disable Remote Login and Remote Apple Events if the audit cannot confirm them without admin access.',
      'Disable automatic firewall allowance for signed built-in/downloaded apps if it does not break required work.',
      'Disable AirPlay Receiver and other Continuity features from System Settings when operating on a shared network.',
      'Review and remove unnecessary Login Items and Background Items.',
      'Review Full Disk Access, Accessibility, Screen Recording, and Input Monitoring permissions.',
      'Use Firewall Options to remove unknown allowed apps.',
      'Consider a clean macOS reinstall and hardware/network migration if compromise is still suspected after lockdown.'
    ],
    etherealAiSecurityBoundary: {
      bindsToLoopbackByDefault: true,
      liveTradingEnabled: false,
      walletSigningEnabled: false,
      externalPostingEnabled: false,
      dnsMutationEnabled: false,
      deploymentEnabled: false
    }
  };
}

module.exports = {
  MAC_SECURITY_COMMANDS,
  buildMacSecurityAudit,
  buildMacSecurityGuide,
  buildAdminAccountRecord,
  getAdminAccountAudit,
  parseAdminMembers,
  parseEstablishedConnections,
  parseListeningPorts,
  parseProcessActivity,
  parseTopSummary,
  getServerBindCheck,
  summarizeChecks
};
