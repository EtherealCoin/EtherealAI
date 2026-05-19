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
    id: 'admin_group_membership',
    category: 'Admin Control',
    label: 'Local admin accounts',
    command: '/usr/bin/dscl',
    args: ['.', '-read', '/Groups/admin', 'GroupMembership'],
    severity: 'review',
    ownerAction: 'Confirm every local admin account is expected. Remove unknown admins only after backup and owner review.',
    parse: output => {
      const members = parseAdminMembers(output);

      return members.length
        ? review(`Admin members visible to this audit: ${members.join(', ')}.`)
        : unknown('Admin group membership could not be parsed.');
    }
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

function parseAdminMembers(output = '') {
  const match = String(output || '').match(/GroupMembership:\s*(.+)$/im);

  if (!match) {
    return [];
  }

  return match[1].split(/\s+/).map(item => item.trim()).filter(Boolean);
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
  const checks = [...commandChecks, listeningPorts, startupItems, serverBind];

  return {
    supported: true,
    platform,
    summary: summarizeChecks(checks),
    checks,
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
      'Filename extensions were set visible for this user.',
      'Finder file-extension change warning was set on for this user.'
    ],
    adminOnlyActions: [
      'Confirm all admin users are expected, including hidden or setup-created accounts.',
      'Confirm MDM/device-management enrollment is absent unless intentionally owned by you.',
      'Review LaunchAgents, LaunchDaemons, user crontab, Login Items, Background Items, and system extensions.',
      'Disable Remote Login and Remote Apple Events if the audit cannot confirm them without admin access.',
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
  parseListeningPorts,
  getServerBindCheck,
  summarizeChecks
};
