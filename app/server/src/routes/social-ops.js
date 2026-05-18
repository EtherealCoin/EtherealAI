function registerSocialOpsRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  findSensitiveFields,
  parseSocialPost,
  parseRebalanceSimulationBatch,
  parseTokenEcosystemProject,
  reviewSocialContent,
  generateWithLocalModel
}) {
  const allowedPlatforms = new Set([
    'x',
    'discord',
    'telegram',
    'youtube',
    'tiktok',
    'medium',
    'reddit',
    'farcaster',
    'docs',
    'custom'
  ]);

  function getAllowedPlatformError() {
    return 'Platform must be x, discord, telegram, youtube, tiktok, medium, reddit, farcaster, docs, or custom';
  }

  function normalizePlatforms(value) {
    const platforms = Array.isArray(value) && value.length
      ? value
      : ['x', 'discord', 'telegram', 'youtube', 'medium'];
    const normalized = [...new Set(platforms.map(platform => String(platform || '').trim().toLowerCase()))];
    const invalid = normalized.filter(platform => !allowedPlatforms.has(platform));

    if (invalid.length) {
      throw new Error(`${getAllowedPlatformError()}. Invalid: ${invalid.join(', ')}`);
    }

    return normalized;
  }

  function buildRebalanceCampaignContent(platform, {
    batch,
    tokenProject,
    accountLabel,
    campaignNote
  }) {
    const summary = batch.result?.summary || {};
    const bestMarket = summary.bestMarketSymbol || 'no best candidate yet';
    const selectedCount = summary.selectedCount || 0;
    const paperCandidateCount = summary.paperCandidateCount || 0;
    const estimatedNetProfit = summary.estimatedNetProfit ?? 0;
    const projectName = tokenProject?.name || batch.name || 'EtherealAI';
    const chain = tokenProject?.target_chain || 'local research';
    const baseLine = `${projectName} local research update: batch #${batch.id} reviewed ${selectedCount} top-200 drawdown candidates and flagged ${paperCandidateCount} paper candidates. Best candidate: ${bestMarket}. Estimated local route edge is draft research only; no live trading is enabled.`;
    const noteLine = campaignNote ? `\n\nOwner note: ${campaignNote}` : '';

    if (platform === 'discord') {
      return [
        `Community research update for ${projectName}`,
        '',
        baseLine,
        `Target chain/context: ${chain}.`,
        'Next review: token utility, liquidity route assumptions, risk profile, and owner approval gates before anything goes live.',
        noteLine
      ].join('\n').trim();
    }

    if (platform === 'telegram') {
      return [
        `${projectName} progress update: EtherealAI generated a local rebalance/arbitrage review batch.`,
        `${paperCandidateCount}/${selectedCount} candidates are ready for owner review. Best candidate: ${bestMarket}.`,
        'This is a draft research artifact only. Live trading and posting remain disabled.',
        noteLine
      ].join('\n').trim();
    }

    if (platform === 'youtube') {
      return [
        `Video outline: ${projectName} rebalance research update`,
        '',
        '1. Project context and target chain.',
        '2. How the local top-200 drawdown scan works.',
        `3. Batch #${batch.id}: ${selectedCount} selected, ${paperCandidateCount} paper candidates, best candidate ${bestMarket}.`,
        '4. Safety gates: draft-only, local-only, no live order endpoint.',
        '5. Next roadmap items: token utility, website, whitepaper, socials, and owner review.',
        noteLine
      ].join('\n').trim();
    }

    if (platform === 'medium') {
      return [
        `# ${projectName} Progress Update: Local Rebalance Research Batch`,
        '',
        `EtherealAI generated a local-only rebalance research batch for ${projectName}. The batch reviewed ${selectedCount} top-200 drawdown candidates and identified ${paperCandidateCount} paper candidates for owner review.`,
        '',
        `The current best candidate is ${bestMarket}. The estimated local route profit across paper candidates is ${estimatedNetProfit}. This is an internal research artifact, not a live trading action.`,
        '',
        `The token ecosystem context is ${chain}. Next steps are owner review, risk-profile validation, website and whitepaper alignment, and local Social Ops drafts before any public action is considered.`,
        '',
        'Live trading, credential loading, public posting, and deployment remain disabled.',
        noteLine
      ].join('\n').trim();
    }

    if (platform === 'reddit' || platform === 'farcaster' || platform === 'docs') {
      return [
        `${projectName} local build note`,
        '',
        baseLine,
        'The useful part is the workflow: token ecosystem planning, rebalance research, draft order intents, and campaign drafts are now connected locally while external actions remain blocked.',
        noteLine
      ].join('\n').trim();
    }

    return `${baseLine}${noteLine}`;
  }

  app.get('/api/v1/social-posts', requireAuth, async (req, res) => {
    try {
      const rows = await dbAll(
        `SELECT *
         FROM social_posts
         ORDER BY created_at DESC
         LIMIT 100`
      );

      res.json({ posts: rows.map(parseSocialPost) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/social-posts/:id', requireAuth, async (req, res) => {
    try {
      const row = await dbGet('SELECT * FROM social_posts WHERE id = ?', [req.params.id]);

      if (!row) {
        return res.status(404).json({ error: 'Social draft not found' });
      }

      res.json({ post: parseSocialPost(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/social-posts', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Social drafts cannot store account tokens, passwords, or secrets.',
          sensitiveFields
        });
      }

      const platform = String(req.body?.platform || '').trim().toLowerCase();
      const accountLabel = String(req.body?.accountLabel || '').trim().slice(0, 120);
      const content = String(req.body?.content || '').trim().slice(0, 10000);
      const scheduledFor = String(req.body?.scheduledFor || '').trim() || null;
      const metadata = req.body?.metadata && typeof req.body.metadata === 'object' && !Array.isArray(req.body.metadata)
        ? req.body.metadata
        : {};

      if (!allowedPlatforms.has(platform)) {
        return res.status(400).json({ error: getAllowedPlatformError() });
      }

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const review = reviewSocialContent(content);
      const result = await dbRun(
        `INSERT INTO social_posts
         (platform, account_label, content, status, scheduled_for, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          platform,
          accountLabel,
          content,
          'draft',
          scheduledFor,
          JSON.stringify({
            ...metadata,
            review
          })
        ]
      );
      const row = await dbGet('SELECT * FROM social_posts WHERE id = ?', [result.lastID]);

      res.status(201).json({ post: parseSocialPost(row) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/social-posts/generate', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Social draft generation cannot include account tokens, passwords, or secrets.',
          sensitiveFields
        });
      }

      const platform = String(req.body?.platform || 'x').trim().toLowerCase();
      const accountLabel = String(req.body?.accountLabel || '').trim().slice(0, 120);
      const campaignBrief = String(req.body?.campaignBrief || '').trim().slice(0, 6000);
      const voice = String(req.body?.voice || 'clear, confident, and community-focused').trim().slice(0, 1000);
      const scheduledFor = String(req.body?.scheduledFor || '').trim() || null;
      const modelRole = String(req.body?.modelRole || 'auto').trim();

      if (!allowedPlatforms.has(platform)) {
        return res.status(400).json({ error: getAllowedPlatformError() });
      }

      if (!campaignBrief) {
        return res.status(400).json({ error: 'Campaign brief is required' });
      }

      const modelResult = await generateWithLocalModel(
        modelRole,
        [
          'Draft one social post for a local-only content queue.',
          'Do not claim guarantees, investment advice, or live trading performance.',
          'Do not include hashtags unless the brief asks for them.',
          'Return only the post text. No markdown wrapper.',
          '',
          `Platform: ${platform}`,
          `Account label: ${accountLabel || 'unspecified'}`,
          `Voice: ${voice}`,
          '',
          'Campaign brief:',
          campaignBrief
        ].join('\n')
      );
      const content = String(modelResult.response || '').trim().slice(0, 10000);

      if (!content) {
        return res.status(500).json({ error: 'Local model returned an empty social draft' });
      }

      const review = reviewSocialContent(content);
      const result = await dbRun(
        `INSERT INTO social_posts
         (platform, account_label, content, status, scheduled_for, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          platform,
          accountLabel,
          content,
          'draft',
          scheduledFor,
          JSON.stringify({
            generatedBy: {
              role: modelResult.role,
              model: modelResult.model,
              routing: modelResult.routing
            },
            voice,
            campaignBrief,
            review
          })
        ]
      );
      const row = await dbGet('SELECT * FROM social_posts WHERE id = ?', [result.lastID]);

      res.status(201).json({
        post: parseSocialPost(row),
        model: {
          role: modelResult.role,
          name: modelResult.model,
          routing: modelResult.routing
        }
      });
    } catch (error) {
      res.status(500).json({
        error: error.name === 'AbortError' ? 'Local model request timed out' : error.message
      });
    }
  });

  app.post('/api/v1/social-posts/rebalance-batches/:id/campaign-drafts', requireAuth, async (req, res) => {
    try {
      const sensitiveFields = findSensitiveFields(req.body || {});

      if (sensitiveFields.length) {
        return res.status(400).json({
          error: 'Rebalance campaign drafts cannot store account tokens, passwords, or secrets.',
          sensitiveFields
        });
      }

      const batch = parseRebalanceSimulationBatch(await dbGet(
        'SELECT * FROM rebalance_simulation_batches WHERE id = ?',
        [req.params.id]
      ));

      if (!batch) {
        return res.status(404).json({ error: 'Rebalance simulation batch not found' });
      }

      const tokenProject = batch.token_ecosystem_project_id
        ? parseTokenEcosystemProject(await dbGet(
          'SELECT * FROM token_ecosystem_projects WHERE id = ?',
          [batch.token_ecosystem_project_id]
        ))
        : null;
      const platforms = normalizePlatforms(req.body?.platforms);
      const accountLabel = String(req.body?.accountLabel || '').trim().slice(0, 120);
      const campaignNote = String(req.body?.campaignNote || '').trim().slice(0, 1000);
      const posts = [];

      for (const platform of platforms) {
        const content = buildRebalanceCampaignContent(platform, {
          batch,
          tokenProject,
          accountLabel,
          campaignNote
        }).slice(0, 10000);
        const review = reviewSocialContent(content);
        const result = await dbRun(
          `INSERT INTO social_posts
           (platform, account_label, content, status, scheduled_for, metadata_json)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            platform,
            accountLabel,
            content,
            'draft',
            null,
            JSON.stringify({
              source: 'rebalance_batch_campaign_draft_v1',
              rebalanceBatchId: batch.id,
              tokenEcosystemProjectId: batch.token_ecosystem_project_id,
              localOnly: true,
              externalPostingEnabled: false,
              liveExecutionEnabled: false,
              review
            })
          ]
        );
        posts.push(parseSocialPost(await dbGet('SELECT * FROM social_posts WHERE id = ?', [result.lastID])));
      }

      res.status(201).json({
        batch,
        tokenProject,
        posts,
        localOnly: true,
        externalPostingEnabled: false,
        liveExecutionEnabled: false
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
}

module.exports = {
  registerSocialOpsRoutes
};
