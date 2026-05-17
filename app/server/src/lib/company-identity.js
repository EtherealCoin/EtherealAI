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

function readCompanyIdentity({ fs, companyIdentityPath }) {
  const raw = fs.readFileSync(companyIdentityPath, 'utf8');
  const manifest = JSON.parse(raw);

  return normalizeCompanyIdentity(manifest);
}

function cleanText(value, fallback = '', maxLength = 1000) {
  const cleaned = String(value ?? fallback).trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

function normalizeCompanyIdentity(manifest = {}) {
  const company = manifest.company || {};
  const owner = manifest.owner || {};
  const tokenIdentity = manifest.tokenIdentity || {};
  const email = manifest.email || {};
  const dnsObservation = manifest.dnsObservation || {};
  const records = dnsObservation.records || {};

  return {
    version: Number(manifest.version || 1),
    generatedBy: manifest.generatedBy || 'EtherealAI local company identity manifest',
    localOnly: true,
    externalAccountCreationEnabled: false,
    purchaseEnabled: false,
    company: {
      legalName: String(company.legalName || '').trim(),
      platformName: String(company.platformName || 'EtherealAI').trim(),
      primaryDomain: String(company.primaryDomain || '').trim().toLowerCase(),
      dnsProvider: String(company.dnsProvider || '').trim(),
      registrar: String(company.registrar || '').trim(),
      status: String(company.status || 'planned').trim()
    },
    owner: {
      name: String(owner.name || '').trim(),
      role: String(owner.role || '').trim(),
      email: String(owner.email || '').trim().toLowerCase()
    },
    tokenIdentity: {
      name: String(tokenIdentity.name || '').trim(),
      preferredWebsiteDomain: String(tokenIdentity.preferredWebsiteDomain || '').trim().toLowerCase(),
      status: String(tokenIdentity.status || 'planned').trim(),
      notes: String(tokenIdentity.notes || '').trim()
    },
    email: {
      provider: String(email.provider || '').trim(),
      primaryMailbox: String(email.primaryMailbox || '').trim().toLowerCase(),
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
      status: String(dnsObservation.status || 'not_checked').trim(),
      notes: String(dnsObservation.notes || '').trim()
    },
    blockedActions: Array.isArray(manifest.blockedActions) ? manifest.blockedActions : []
  };
}

function normalizeCompanyDnsTargetInput(input = {}, identity = {}) {
  const primaryDomain = identity.company?.primaryDomain || '';
  const domain = cleanText(input.domain || input.domainName || primaryDomain, '', 160).toLowerCase();
  const recordType = cleanText(input.recordType || input.record_type, '', 16).toUpperCase();
  const host = cleanText(input.host || input.name || '@', '@', 160).toLowerCase();
  const value = cleanText(input.value || input.target, '', 1000);
  const purpose = cleanText(input.purpose, 'other', 80).toLowerCase();
  const status = cleanText(input.status, 'planned', 40).toLowerCase();
  const notes = cleanText(input.notes, '', 1000);

  if (!domain) {
    throw new Error('Domain is required');
  }

  if (primaryDomain && domain !== primaryDomain) {
    throw new Error(`DNS targets are limited to the configured company domain: ${primaryDomain}`);
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

function buildCompanySetupPlan(identity = {}, dnsTargets = []) {
  const targets = Array.isArray(dnsTargets) ? dnsTargets : [];
  const verifiedTargets = targets.filter(target => target.status === 'verified');
  const pendingTargets = targets.filter(target => !['verified', 'not_needed'].includes(target.status));
  const hasWebsiteTarget = targets.some(target => ['website', 'www_redirect', 'app_backend'].includes(target.purpose));
  const hasEmailTarget = targets.some(target => ['email_routing', 'spf', 'dkim', 'dmarc'].includes(target.purpose));

  return {
    title: 'Domain/Email Setup Center',
    primaryDomain: identity.company?.primaryDomain || '',
    primaryMailbox: identity.email?.primaryMailbox || identity.owner?.email || '',
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
    ]
  };
}

function buildCompanyIdentityChecklist(identity = {}) {
  const domain = identity.company?.primaryDomain || '';
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
      evidence: domain || 'No domain recorded',
      nextStep: domain ? 'No action needed in EtherealAI.' : 'Record the owner-selected domain.'
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
  buildCompanySetupPlan,
  normalizeCompanyDnsTargetInput,
  normalizeCompanyIdentity,
  parseCompanyDnsTarget,
  readCompanyIdentity
};
