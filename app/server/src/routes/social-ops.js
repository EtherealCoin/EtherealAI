function registerSocialOpsRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  findSensitiveFields,
  parseSocialPost,
  reviewSocialContent,
  generateWithLocalModel
}) {
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
      const allowedPlatforms = new Set(['x', 'discord', 'telegram', 'youtube', 'tiktok', 'custom']);

      if (!allowedPlatforms.has(platform)) {
        return res.status(400).json({ error: 'Platform must be x, discord, telegram, youtube, tiktok, or custom' });
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
      const allowedPlatforms = new Set(['x', 'discord', 'telegram', 'youtube', 'tiktok', 'custom']);

      if (!allowedPlatforms.has(platform)) {
        return res.status(400).json({ error: 'Platform must be x, discord, telegram, youtube, tiktok, or custom' });
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
}

module.exports = {
  registerSocialOpsRoutes
};
