function parseSocialPost(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    platform: row.platform,
    account_label: row.account_label,
    content: row.content,
    status: row.status,
    scheduled_for: row.scheduled_for,
    metadata: JSON.parse(row.metadata_json || '{}'),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function reviewSocialContent(content) {
  const text = String(content || '').toLowerCase();
  const checks = [
    {
      id: 'investment_advice',
      label: 'May read like investment advice',
      pattern: /\b(financial advice|investment advice|buy now|sell now|not financial advice)\b/
    },
    {
      id: 'performance_claim',
      label: 'Performance or profit claim',
      pattern: /\b(guaranteed|risk[- ]?free|profits?|returns?|100x|moon|moonshot|certain win)\b/
    },
    {
      id: 'urgency',
      label: 'High-pressure urgency',
      pattern: /\b(act now|last chance|do not miss|limited time|hurry)\b/
    },
    {
      id: 'secret_claim',
      label: 'Secret or insider claim',
      pattern: /\b(secret|insider|leaked|guaranteed alpha)\b/
    },
    {
      id: 'listing_evasion',
      label: 'Listing evasion, bribery, or bypass risk',
      pattern: /\b(bribe|bribery|pay.{0,24}(employee|staff|insider)|rogue employee|bypass|circumvent|get around|guaranteed listing|expedite.{0,24}listing)\b/
    },
    {
      id: 'manipulated_activity',
      label: 'Fake activity or market manipulation risk',
      pattern: /\b(fake volume|wash trad|fake followers|fake comments|fake community|bot followers|spam.{0,24}(coinmarketcap|coingecko|listing|request)|raid.{0,24}(coinmarketcap|coingecko))\b/
    }
  ];
  const flags = checks
    .filter(check => check.pattern.test(text))
    .map(({ id, label }) => ({ id, label }));

  return {
    status: flags.length ? 'review' : 'clean',
    flags,
    note: 'Advisory content review only. Drafting is not blocked.'
  };
}

module.exports = {
  parseSocialPost,
  reviewSocialContent
};
