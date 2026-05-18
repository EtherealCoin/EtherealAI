const dns = require('dns');

const DNS_RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'CAA'];
const DNS_TARGET_PURPOSES = [
  'website',
  'www_redirect',
  'email_routing',
  'spf',
  'dkim',
  'dmarc',
  'domain_verification',
  'app_backend',
  'other'
];
const DNS_TARGET_STATUSES = ['planned', 'owner_added', 'propagating', 'verified', 'blocked', 'not_needed'];
const CLOUDFLARE_PAGES_DNS_VALUE_SUFFIX = '.pages.dev';

function readCompanyIdentity({ fs, companyIdentityPath }) {
  const raw = fs.readFileSync(companyIdentityPath, 'utf8');
  const manifest = JSON.parse(raw);

  return normalizeCompanyIdentity(manifest);
}

function cleanText(value, fallback = '', maxLength = 1000) {
  const cleaned = String(value ?? fallback).trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

function normalizeDnsLabel(value, fallback = 'site') {
  const cleaned = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return cleaned || fallback;
}

function normalizeDomain(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^\.+|\.+$/g, '');
}

function normalizeEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

function getEmailDomain(value = '') {
  const email = normalizeEmail(value);
  const [, domain = ''] = email.split('@');
  return normalizeDomain(domain);
}

function normalizeDomainList(values = []) {
  return [...new Set((Array.isArray(values) ? values : [values])
    .map(normalizeDomain)
    .filter(Boolean))];
}

function getOwnedDomains(identity = {}) {
  return normalizeDomainList([
    ...(identity.company?.ownedDomains || []),
    ...(identity.company?.websiteDomains || []),
    identity.company?.firstCreatedDomain,
    identity.company?.primaryDomain,
    identity.tokenIdentity?.preferredWebsiteDomain,
    identity.tokenIdentity?.fallbackWebsiteDomain,
    getEmailDomain(identity.owner?.email),
    getEmailDomain(identity.email?.primaryMailbox)
  ]);
}

function getWebsitePrimaryDomain(identity = {}) {
  const ownedDomains = getOwnedDomains(identity);
  const preferred = normalizeDomain(identity.tokenIdentity?.preferredWebsiteDomain)
    || normalizeDomain(identity.company?.firstCreatedDomain)
    || normalizeDomain(identity.company?.primaryDomain)
    || ownedDomains[0]
    || '';

  return ownedDomains.includes(preferred) ? preferred : (ownedDomains[0] || preferred);
}

function getEmailRoutingDomain(identity = {}) {
  return getEmailDomain(identity.email?.primaryMailbox)
    || getEmailDomain(identity.owner?.email)
    || normalizeDomain(identity.company?.primaryDomain)
    || getWebsitePrimaryDomain(identity);
}

function normalizeCompanyIdentity(manifest = {}) {
  const company = manifest.company || {};
  const owner = manifest.owner || {};
  const tokenIdentity = manifest.tokenIdentity || {};
  const email = manifest.email || {};
  const dnsObservation = manifest.dnsObservation || {};
  const records = dnsObservation.records || {};
  const ownerEmail = normalizeEmail(owner.email);
  const primaryMailbox = normalizeEmail(email.primaryMailbox);
  const primaryDomain = normalizeDomain(company.primaryDomain);
  const firstCreatedDomain = normalizeDomain(company.firstCreatedDomain || company.first_created_domain);
  const preferredWebsiteDomain = normalizeDomain(tokenIdentity.preferredWebsiteDomain);
  const fallbackWebsiteDomain = normalizeDomain(tokenIdentity.fallbackWebsiteDomain);
  const configuredOwnedDomains = Array.isArray(company.ownedDomains) ? company.ownedDomains : [];
  const configuredWebsiteDomains = Array.isArray(company.websiteDomains) ? company.websiteDomains : [];
  const ownedDomains = normalizeDomainList([
    ...configuredOwnedDomains,
    ...configuredWebsiteDomains,
    primaryDomain,
    firstCreatedDomain,
    preferredWebsiteDomain,
    fallbackWebsiteDomain,
    getEmailDomain(ownerEmail),
    getEmailDomain(primaryMailbox)
  ]);

  return {
    version: Number(manifest.version || 1),
    generatedBy: manifest.generatedBy || 'EtherealAI local company identity manifest',
    localOnly: true,
    externalAccountCreationEnabled: false,
    purchaseEnabled: false,
    company: {
      legalName: String(company.legalName || '').trim(),
      platformName: String(company.platformName || 'EtherealAI').trim(),
      primaryDomain,
      firstCreatedDomain,
      ownedDomains,
      cloudflareAccountEmail: normalizeEmail(company.cloudflareAccountEmail || company.cloudflare_account_email),
      dnsProvider: String(company.dnsProvider || '').trim(),
      registrar: String(company.registrar || '').trim(),
      status: String(company.status || 'planned').trim(),
      notes: String(company.notes || '').trim()
    },
    owner: {
      name: String(owner.name || '').trim(),
      role: String(owner.role || '').trim(),
      email: ownerEmail
    },
    tokenIdentity: {
      name: String(tokenIdentity.name || '').trim(),
      preferredWebsiteDomain,
      fallbackWebsiteDomain,
      status: String(tokenIdentity.status || 'planned').trim(),
      notes: String(tokenIdentity.notes || '').trim()
    },
    email: {
      provider: String(email.provider || '').trim(),
      primaryMailbox,
      status: String(email.status || 'planned').trim(),
      sendReceiveStatus: String(email.sendReceiveStatus || 'not_verified').trim(),
      notes: String(email.notes || '').trim()
    },
    dnsObservation: {
      observedAt: String(dnsObservation.observedAt || '').trim(),
      method: String(dnsObservation.method || '').trim(),
      records: {
        A: Array.isArray(records.A) ? records.A : [],
        AAAA: Array.isArray(records.AAAA) ? records.AAAA : [],
        MX: Array.isArray(records.MX) ? records.MX : [],
        TXT: Array.isArray(records.TXT) ? records.TXT : [],
        NS: Array.isArray(records.NS) ? records.NS : [],
        CNAME: Array.isArray(records.CNAME) ? records.CNAME : []
      },
      observedDomains: dnsObservation.observedDomains || {},
      status: String(dnsObservation.status || 'not_checked').trim(),
      notes: String(dnsObservation.notes || '').trim()
    },
    blockedActions: Array.isArray(manifest.blockedActions) ? manifest.blockedActions : []
  };
}

function normalizeCompanyDnsTargetInput(input = {}, identity = {}) {
  const recordType = cleanText(input.recordType || input.record_type, '', 16).toUpperCase();
  const host = cleanText(input.host || input.name || '@', '@', 160).toLowerCase();
  const value = cleanText(input.value || input.target, '', 1000);
  const purpose = cleanText(input.purpose, 'other', 80).toLowerCase();
  const status = cleanText(input.status, 'planned', 40).toLowerCase();
  const notes = cleanText(input.notes, '', 1000);
  const ownedDomains = getOwnedDomains(identity);
  const emailPurposes = ['email_routing', 'spf', 'dkim', 'dmarc'];
  const fallbackDomain = emailPurposes.includes(purpose)
    ? getEmailRoutingDomain(identity)
    : getWebsitePrimaryDomain(identity) || identity.company?.primaryDomain || ownedDomains[0] || '';
  const domain = normalizeDomain(cleanText(input.domain || input.domainName || fallbackDomain, '', 160));

  if (!domain) {
    throw new Error('Domain is required');
  }

  if (ownedDomains.length && !ownedDomains.includes(domain)) {
    throw new Error(`DNS targets are limited to configured owned domains: ${ownedDomains.join(', ')}`);
  }

  if (!DNS_RECORD_TYPES.includes(recordType)) {
    throw new Error(`Record type must be one of: ${DNS_RECORD_TYPES.join(', ')}`);
  }

  if (!host) {
    throw new Error('Host/name is required');
  }

  if (!value) {
    throw new Error('Record value is required');
  }

  if (!DNS_TARGET_PURPOSES.includes(purpose)) {
    throw new Error(`Purpose must be one of: ${DNS_TARGET_PURPOSES.join(', ')}`);
  }

  if (!DNS_TARGET_STATUSES.includes(status)) {
    throw new Error(`Status must be one of: ${DNS_TARGET_STATUSES.join(', ')}`);
  }

  if (/-----BEGIN|private key|secret key|api token|cloudflare token/i.test(`${host} ${value} ${notes}`)) {
    throw new Error('DNS target records must not contain private keys, API tokens, or secrets');
  }

  return {
    domain,
    recordType,
    host,
    value,
    purpose,
    status,
    notes,
    localOnly: true,
    externalMutationEnabled: false
  };
}

function parseCompanyDnsTarget(row = {}) {
  return {
    id: Number(row.id),
    userId: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
    domain: row.domain,
    recordType: row.record_type,
    host: row.host,
    value: row.value,
    purpose: row.purpose,
    status: row.status,
    notes: row.notes || '',
    localOnly: row.local_only !== 0,
    externalMutationEnabled: row.external_mutation_enabled === 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function normalizeDnsCompareValue(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
}

function buildDnsRecordName(target = {}) {
  const domain = normalizeDomain(target.domain);
  const host = String(target.host || '@').trim().toLowerCase();

  if (!domain) {
    return '';
  }

  if (!host || host === '@') {
    return domain;
  }

  return host.endsWith(`.${domain}`) ? host : `${host}.${domain}`;
}

function flattenDnsRecords(recordType = '', records = []) {
  if (recordType === 'MX') {
    return records.map(record => `${record.priority} ${record.exchange}`);
  }

  if (recordType === 'TXT') {
    return records.map(record => Array.isArray(record) ? record.join('') : String(record));
  }

  if (recordType === 'CAA') {
    return records.map(record => `${record.flags} ${record.tag} ${record.value}`);
  }

  return records.map(record => String(record));
}

async function resolveDnsRecordsForTarget(target = {}, resolver = dns.promises) {
  const recordType = String(target.recordType || target.record_type || '').toUpperCase();
  const recordName = buildDnsRecordName(target);

  if (!recordName) {
    throw new Error('DNS record name could not be derived');
  }

  if (recordType === 'A') {
    return resolver.resolve4(recordName);
  }

  if (recordType === 'AAAA') {
    return resolver.resolve6(recordName);
  }

  if (recordType === 'CNAME') {
    return resolver.resolveCname(recordName);
  }

  if (recordType === 'MX') {
    return resolver.resolveMx(recordName);
  }

  if (recordType === 'TXT') {
    return resolver.resolveTxt(recordName);
  }

  if (recordType === 'NS') {
    return resolver.resolveNs(recordName);
  }

  if (recordType === 'CAA' && typeof resolver.resolveCaa === 'function') {
    return resolver.resolveCaa(recordName);
  }

  return resolver.resolve(recordName, recordType);
}

function dnsRecordsMatchExpected(recordType = '', expectedValue = '', observedValues = []) {
  const normalizedExpected = normalizeDnsCompareValue(expectedValue);
  const normalizedObserved = observedValues.map(normalizeDnsCompareValue);

  if (recordType === 'TXT') {
    return normalizedObserved.some(value => (
      value === normalizedExpected
      || value.includes(normalizedExpected)
      || normalizedExpected.includes(value)
    ));
  }

  if (recordType === 'MX') {
    const expectedParts = normalizedExpected.split(/\s+/);
    const expectedExchange = expectedParts.length > 1
      ? expectedParts.slice(1).join(' ')
      : normalizedExpected;

    return normalizedObserved.some(value => (
      value === normalizedExpected
      || value.endsWith(` ${expectedExchange}`)
      || value === expectedExchange
    ));
  }

  return normalizedObserved.includes(normalizedExpected);
}

async function verifyCompanyDnsTargetPublic(target = {}, { resolver = dns.promises, checkedAt = new Date() } = {}) {
  const recordType = String(target.recordType || target.record_type || '').toUpperCase();
  const recordName = buildDnsRecordName(target);
  const expectedValue = String(target.value || target.target || '').trim();
  const baseResult = {
    targetId: target.id ? Number(target.id) : null,
    domain: target.domain,
    recordType,
    host: target.host,
    recordName,
    expectedValue,
    checkedAt: checkedAt.toISOString(),
    localOnly: true,
    externalMutationEnabled: false,
    cloudflareApiCallsEnabled: false,
    dnsMutationEnabled: false
  };

  try {
    const records = await resolveDnsRecordsForTarget(target, resolver);
    const observedValues = flattenDnsRecords(recordType, records);
    const verified = dnsRecordsMatchExpected(recordType, expectedValue, observedValues);

    return {
      ...baseResult,
      verified,
      status: verified ? 'verified' : 'propagating',
      observedValues,
      error: null
    };
  } catch (error) {
    return {
      ...baseResult,
      verified: false,
      status: 'propagating',
      observedValues: [],
      error: error.code || error.message
    };
  }
}

function buildCompanySetupPlan(identity = {}, dnsTargets = []) {
  const targets = Array.isArray(dnsTargets) ? dnsTargets : [];
  const verifiedTargets = targets.filter(target => target.status === 'verified');
  const pendingTargets = targets.filter(target => !['verified', 'not_needed'].includes(target.status));
  const hasWebsiteTarget = targets.some(target => ['website', 'www_redirect', 'app_backend'].includes(target.purpose));
  const hasEmailTarget = targets.some(target => ['email_routing', 'spf', 'dkim', 'dmarc'].includes(target.purpose));
  const primaryDomain = identity.company?.primaryDomain || '';
  const ownedDomains = getOwnedDomains(identity);
  const websitePrimaryDomain = getWebsitePrimaryDomain(identity);
  const primaryMailbox = identity.email?.primaryMailbox || identity.owner?.email || '';
  const emailDomain = getEmailRoutingDomain(identity);

  return {
    title: 'Domain/Email Setup Center',
    primaryDomain,
    websitePrimaryDomain,
    emailDomain,
    ownedDomains,
    primaryMailbox,
    cloudflareAccountEmail: identity.company?.cloudflareAccountEmail || '',
    localOnly: true,
    externalMutationEnabled: false,
    summary: {
      totalTargets: targets.length,
      verifiedTargets: verifiedTargets.length,
      pendingTargets: pendingTargets.length,
      websiteTargetTracked: hasWebsiteTarget,
      emailTargetTracked: hasEmailTarget
    },
    recommendedManualSteps: [
      {
        id: 'cloudflare_nameservers',
        label: 'Confirm Cloudflare nameservers',
        status: identity.dnsObservation?.records?.NS?.length ? 'ready' : 'owner_cloudflare_check_needed'
      },
      {
        id: 'website_dns_target',
        label: 'Track website DNS target',
        status: hasWebsiteTarget ? 'tracked' : 'planned'
      },
      {
        id: 'email_dns_targets',
        label: 'Track MX, SPF, DKIM, and DMARC targets',
        status: hasEmailTarget ? 'tracked' : 'planned'
      },
      {
        id: 'manual_mailbox_test',
        label: 'Manually test mailbox send/receive',
        status: identity.email?.sendReceiveStatus === 'verified' ? 'ready' : 'owner_manual_test_needed'
      }
    ],
    blockedActions: identity.blockedActions || [],
    nextOwnerActions: [
      'Add Cloudflare DNS targets here after reviewing them in Cloudflare.',
      'Mark targets owner_added, propagating, or verified as DNS changes are made manually.',
      'Keep Cloudflare credentials and API tokens outside EtherealAI.'
    ],
    cloudflareAccessPlan: buildCloudflareAccessPlan({
      primaryDomain,
      primaryMailbox,
      ownedDomains,
      cloudflareAccountEmail: identity.company?.cloudflareAccountEmail || ''
    })
  };
}

function buildCloudflareAccessPlan({
  primaryDomain = '',
  primaryMailbox = '',
  ownedDomains = [],
  cloudflareAccountEmail = ''
} = {}) {
  const zoneScopes = normalizeDomainList([
    ...(Array.isArray(ownedDomains) ? ownedDomains : []),
    primaryDomain
  ]);
  const referenceName = zoneScopes.length > 1
    ? 'etherealai/cloudflare/dns/owned-domains'
    : primaryDomain
    ? `etherealai/cloudflare/dns/${primaryDomain}`
    : 'etherealai/cloudflare/dns/company-domain';
  const scopeLabel = zoneScopes.length > 1
    ? `${zoneScopes.join(', ')} zones only`
    : primaryDomain
    ? `${primaryDomain} zone only`
    : 'single Cloudflare zone only';

  return {
    title: 'Cloudflare Access Gate',
    localOnly: true,
    externalMutationEnabled: false,
    passwordLoginAllowed: false,
    tokenValuesAccepted: false,
    credentialLoadingImplemented: false,
    recommendedToken: {
      provider: 'Cloudflare',
      tokenType: 'User API Token',
      resourceScope: scopeLabel,
      zoneScopes,
      permissions: [
        'Zone:Zone:Read',
        'Zone:DNS:Read',
        'Zone:DNS:Edit'
      ],
      restrictions: [
        'Do not use a global API key.',
        'Do not paste the token into EtherealAI or chat.',
        'Rotate the Cloudflare account password if it was pasted anywhere outside Cloudflare.'
      ]
    },
    secretReferenceTemplate: {
      label: zoneScopes.length > 1
        ? 'Cloudflare DNS token - owned domains'
        : primaryDomain
        ? `Cloudflare DNS token - ${primaryDomain}`
        : 'Cloudflare DNS token',
      providerType: 'macos_keychain',
      referenceName,
      scope: 'generic',
      status: 'planned',
      notes: `Local metadata only. Store the real scoped Cloudflare DNS API token in macOS Keychain under ${referenceName}; EtherealAI must store only this reference name.`
    },
    manualSteps: [
      {
        id: 'rotate_password',
        label: 'Change exposed Cloudflare password',
        status: 'owner_action_required',
        detail: 'Because a password was pasted into chat, change it in Cloudflare before adding any API token.'
      },
      {
        id: 'enable_2fa',
        label: 'Confirm Cloudflare 2FA',
        status: 'owner_action_required',
        detail: 'Use authenticator-app or hardware-key 2FA before creating automation credentials.'
      },
      {
        id: 'create_scoped_token',
        label: 'Create scoped DNS API token',
        status: 'owner_action_required',
        detail: zoneScopes.length
          ? `Limit the token to these Cloudflare zones only: ${zoneScopes.join(', ')}. Use DNS read/edit permissions only.`
          : 'Limit the token to one zone with DNS read/edit permissions only.'
      },
      {
        id: 'store_keychain',
        label: 'Store token in macOS Keychain',
        status: 'owner_action_required',
        detail: `Use the service/reference name ${referenceName}; do not store the token in source code, SQLite, or chat.`
      },
      {
        id: 'save_reference',
        label: 'Save local reference metadata',
        status: 'etherealai_ready',
        detail: 'Save the reference below so future DNS automation can locate the Keychain item after a reviewed credential loader exists.'
      }
    ],
    nextOwnerActions: [
      cloudflareAccountEmail
        ? `Use the Cloudflare account ${cloudflareAccountEmail} only inside Cloudflare; EtherealAI stores this as metadata only.`
        : 'Record the Cloudflare account email as metadata only if needed.',
      primaryMailbox
        ? `After rotating the password, confirm ${primaryMailbox} can receive Cloudflare security emails.`
        : 'After rotating the password, confirm the Cloudflare account email can receive security emails.',
      'Create a scoped Cloudflare API token for DNS only.',
      'Save only the Keychain reference metadata in EtherealAI.'
    ]
  };
}

function buildCloudflareWebsitePlan(project = {}, identity = {}) {
  const primaryDomain = getWebsitePrimaryDomain(identity) || 'etherealdigit.ai';
  const companyPrimaryDomain = identity.company?.primaryDomain || primaryDomain;
  const ownedDomains = getOwnedDomains(identity);
  const primaryMailbox = identity.email?.primaryMailbox || identity.owner?.email || '';
  const emailDomain = getEmailRoutingDomain(identity) || primaryDomain;
  const projectName = project.name || project.project?.name || 'Token Website';
  const tokenSlug = normalizeDnsLabel(projectName, 'token-site');
  const pagesProject = normalizeDnsLabel(`etherealai-${tokenSlug}`, 'etherealai-token-site');
  const rootProject = tokenSlug === 'etherealai' || tokenSlug === 'ethereal-ai';
  const primaryHost = rootProject ? '@' : tokenSlug;
  const primaryFqdn = primaryHost === '@' ? primaryDomain : `${primaryHost}.${primaryDomain}`;
  const pagesDevTarget = `${pagesProject}${CLOUDFLARE_PAGES_DNS_VALUE_SUFFIX}`;
  const projectId = project.id ? Number(project.id) : null;
  const projectTag = projectId ? `tokenProjectId:${projectId}` : `tokenProject:${tokenSlug}`;
  const baseNotes = [
    projectTag,
    'Generated by EtherealAI for a token website Cloudflare Pages target.',
    'Owner must add the custom domain in Cloudflare Workers & Pages before live DNS use.',
    'No Cloudflare API call or DNS mutation has been performed.'
  ].join(' ');
  const docsHost = primaryHost === '@' ? 'docs' : `docs.${tokenSlug}`;
  const appHost = primaryHost === '@' ? 'app' : `app.${tokenSlug}`;
  const wwwHost = primaryHost === '@' ? 'www' : `www.${tokenSlug}`;

  return {
    title: `${projectName} Cloudflare Website Plan`,
    projectId,
    projectName,
    primaryDomain,
    companyPrimaryDomain,
    ownedDomains,
    primaryMailbox,
    emailDomain,
    tokenSlug,
    rootProject,
    pagesProject,
    pagesDevTarget,
    primaryFqdn,
    localOnly: true,
    externalMutationEnabled: false,
    credentialLoadingEnabled: false,
    cloudflarePages: {
      projectName: pagesProject,
      productionBranch: 'main',
      buildPreset: 'static token website / dapp shell',
      customDomains: [
        primaryFqdn,
        `${wwwHost}.${primaryDomain}`,
        `${appHost}.${primaryDomain}`,
        `${docsHost}.${primaryDomain}`
      ],
      ownerSteps: [
        'Create or select the Cloudflare Pages project for the generated website workspace.',
        'Add each custom domain in Workers & Pages > project > Custom domains.',
        'Review the DNS records EtherealAI saved locally before adding them in Cloudflare.',
        'Keep company email routing records intact while adding website records.'
      ]
    },
    dnsTargets: [
      {
        domain: primaryDomain,
        recordType: 'CNAME',
        host: primaryHost,
        value: pagesDevTarget,
        purpose: 'website',
        status: 'planned',
        notes: `${baseNotes} Primary token website.`
      },
      {
        domain: primaryDomain,
        recordType: 'CNAME',
        host: wwwHost,
        value: pagesDevTarget,
        purpose: 'www_redirect',
        status: 'planned',
        notes: `${baseNotes} WWW/custom domain companion record.`
      },
      {
        domain: primaryDomain,
        recordType: 'CNAME',
        host: appHost,
        value: pagesDevTarget,
        purpose: 'app_backend',
        status: 'planned',
        notes: `${baseNotes} Dapp shell/custom app subdomain.`
      },
      {
        domain: primaryDomain,
        recordType: 'CNAME',
        host: docsHost,
        value: pagesDevTarget,
        purpose: 'website',
        status: 'planned',
        notes: `${baseNotes} Whitepaper/docs custom subdomain.`
      }
    ],
    emailRouting: {
      provider: identity.email?.provider || 'Cloudflare',
      primaryMailbox,
      emailDomain,
      status: 'owner_review',
      preserveExistingRecords: true,
      suggestedAliases: [
        `support@${emailDomain}`,
        `media@${emailDomain}`,
        `token@${emailDomain}`,
        `legal@${emailDomain}`
      ],
      ownerSteps: [
        primaryMailbox
          ? `Keep ${primaryMailbox} active for company/owner operations.`
          : 'Keep the company mailbox active for owner operations.',
        'Use Cloudflare Email Routing for receive-only aliases if needed.',
        'Do not overwrite MX, SPF, DKIM, or DMARC records while adding website DNS.'
      ]
    },
    safetyBoundary: {
      localOnly: true,
      externalMutationEnabled: false,
      cloudflareApiCallsEnabled: false,
      credentialLoadingEnabled: false,
      passwordLoginAllowed: false
    }
  };
}

function buildCompanyIdentityChecklist(identity = {}) {
  const domain = identity.company?.primaryDomain || '';
  const websiteDomain = getWebsitePrimaryDomain(identity);
  const ownedDomains = getOwnedDomains(identity);
  const mailbox = identity.email?.primaryMailbox || '';
  const records = identity.dnsObservation?.records || {};
  const hasWebsiteRecord = Boolean(records.A?.length || records.AAAA?.length || records.CNAME?.length);
  const hasMailRecord = Boolean(records.MX?.length);
  const hasDnsDelegation = Boolean(records.NS?.length);

  return [
    {
      id: 'company_domain_recorded',
      label: 'Company domain recorded',
      status: domain === 'etherealdigital.ai' ? 'ready' : 'review',
      evidence: ownedDomains.length ? `${domain} · owned: ${ownedDomains.join(', ')}` : domain || 'No domain recorded',
      nextStep: domain ? 'No action needed in EtherealAI.' : 'Record the owner-selected domain.'
    },
    {
      id: 'token_website_domain_recorded',
      label: 'Token website domain recorded',
      status: websiteDomain === 'etherealdigit.ai' ? 'ready' : 'review',
      evidence: websiteDomain || 'No token website domain recorded',
      nextStep: websiteDomain ? 'Use this domain for generated token website plans.' : 'Record the owner-selected token website domain.'
    },
    {
      id: 'ceo_email_recorded',
      label: 'CEO email recorded',
      status: mailbox === 'patrick@etherealdigital.ai' ? 'ready' : 'review',
      evidence: mailbox || 'No CEO mailbox recorded',
      nextStep: mailbox ? 'Test send/receive manually in Cloudflare or the connected mailbox.' : 'Record the CEO mailbox.'
    },
    {
      id: 'cloudflare_provider_recorded',
      label: 'Cloudflare provider recorded',
      status: identity.company?.dnsProvider === 'Cloudflare' && identity.email?.provider === 'Cloudflare' ? 'ready' : 'review',
      evidence: `${identity.company?.registrar || 'unknown registrar'} / ${identity.company?.dnsProvider || 'unknown DNS'} / ${identity.email?.provider || 'unknown email'}`,
      nextStep: 'Keep Cloudflare credentials outside EtherealAI.'
    },
    {
      id: 'dns_delegation_visible',
      label: 'DNS delegation visible',
      status: hasDnsDelegation ? 'ready' : 'needs_propagation_or_setup',
      evidence: hasDnsDelegation ? records.NS.join(', ') : 'No NS records observed from this machine.',
      nextStep: hasDnsDelegation ? 'No action needed.' : 'Confirm Cloudflare nameservers and wait for propagation.'
    },
    {
      id: 'website_dns_visible',
      label: 'Website DNS visible',
      status: hasWebsiteRecord ? 'ready' : 'needs_setup',
      evidence: hasWebsiteRecord ? [...records.A, ...records.AAAA, ...records.CNAME].join(', ') : 'No A/AAAA/CNAME observed from this machine.',
      nextStep: 'Add a website DNS target when the EtherealAI public site is ready.'
    },
    {
      id: 'email_dns_visible',
      label: 'Email DNS visible',
      status: hasMailRecord ? 'ready' : 'needs_setup',
      evidence: hasMailRecord ? records.MX.join(', ') : 'No MX records observed from this machine.',
      nextStep: 'Confirm Cloudflare Email Routing or mailbox MX records, SPF, DKIM, and DMARC.'
    },
    {
      id: 'external_actions_blocked',
      label: 'External actions blocked',
      status: identity.externalAccountCreationEnabled === false && identity.purchaseEnabled === false ? 'ready' : 'blocked',
      evidence: 'EtherealAI stores identity metadata only.',
      nextStep: 'Do domain, DNS, and mailbox changes manually in Cloudflare unless a future owner-reviewed connector is added.'
    }
  ];
}

module.exports = {
  buildCompanyIdentityChecklist,
  buildCloudflareAccessPlan,
  buildCloudflareWebsitePlan,
  buildCompanySetupPlan,
  normalizeCompanyDnsTargetInput,
  normalizeCompanyIdentity,
  normalizeDnsLabel,
  parseCompanyDnsTarget,
  readCompanyIdentity,
  verifyCompanyDnsTargetPublic
};
