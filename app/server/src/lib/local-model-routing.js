function countPromptHits(prompt, keywords) {
  return keywords.reduce((score, keyword) => {
    const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = prompt.match(pattern);
    return score + (matches ? matches.length : 0);
  }, 0);
}

function chooseModelRoleForPrompt(prompt, requestedRole = 'auto', modelConfig) {
  if (!modelConfig || !modelConfig.roles || typeof modelConfig.roles !== 'object') {
    throw new Error('Model config with roles is required');
  }

  const requested = String(requestedRole || 'auto').trim().toLowerCase();

  if (requested && requested !== 'auto') {
    if (!modelConfig.roles[requested]) {
      const validRoles = ['auto', ...Object.keys(modelConfig.roles)].join(', ');
      throw new Error(`Unknown model role. Valid roles: ${validRoles}`);
    }

    return {
      mode: 'manual',
      requestedRole: requested,
      role: requested,
      reason: 'Manual role selected.',
      scores: null
    };
  }

  const text = String(prompt || '').toLowerCase();
  const scores = {
    coder: countPromptHits(text, [
      'code',
      'file',
      'function',
      'component',
      'bug',
      'fix',
      'refactor',
      'test',
      'api',
      'endpoint',
      'database',
      'html',
      'css',
      'javascript',
      'solidity',
      'contract',
      'build',
      'implement'
    ]),
    planner: countPromptHits(text, [
      'plan',
      'architecture',
      'roadmap',
      'strategy',
      'explain',
      'compare',
      'design',
      'decide',
      'tradeoff',
      'steps',
      'system'
    ]),
    writer: countPromptHits(text, [
      'draft',
      'social',
      'community',
      'campaign',
      'content',
      'voice',
      'announcement',
      'update',
      'tweet',
      'thread',
      'discord',
      'telegram',
      'youtube',
      'tiktok'
    ]),
    autocomplete: countPromptHits(text, [
      'complete',
      'autocomplete',
      'finish',
      'inline'
    ])
  };
  const roleOrder = ['writer', 'coder', 'planner', 'autocomplete'];
  let role = roleOrder
    .filter(candidate => modelConfig.roles[candidate])
    .sort((a, b) => scores[b] - scores[a])[0] || Object.keys(modelConfig.roles)[0];

  if (!scores[role]) {
    role = modelConfig.roles.planner ? 'planner' : Object.keys(modelConfig.roles)[0];
  }

  if (
    modelConfig.roles.autocomplete &&
    text.length < 500 &&
    scores.autocomplete > scores.coder &&
    scores.autocomplete > scores.planner &&
    scores.autocomplete > scores.writer
  ) {
    role = 'autocomplete';
  }

  if (!modelConfig.roles[role]) {
    role = modelConfig.roles.coder ? 'coder' : Object.keys(modelConfig.roles)[0];
  }

  return {
    mode: 'auto',
    requestedRole: 'auto',
    role,
    reason: role === 'coder'
      ? 'Code, file, implementation, or debugging language was detected.'
      : role === 'planner'
        ? 'Planning, architecture, explanation, or tradeoff language was detected.'
        : role === 'writer'
          ? 'Social, campaign, community, or content drafting language was detected.'
          : 'Short completion-style prompt was detected.',
    scores
  };
}

module.exports = {
  countPromptHits,
  chooseModelRoleForPrompt
};
