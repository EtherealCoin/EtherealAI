function registerCompanyIdentityRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  dbRun,
  readCompanyIdentity,
  buildCompanyIdentityChecklist,
  buildCompanySetupPlan,
  normalizeCompanyDnsTargetInput,
  parseCompanyDnsTarget
}) {
  async function listCompanyDnsTargets() {
    const rows = await dbAll(
      `SELECT *
       FROM company_dns_targets
       ORDER BY updated_at DESC, id DESC
       LIMIT 200`
    );

    return rows.map(parseCompanyDnsTarget);
  }

  app.get('/api/v1/company-identity', requireAuth, async (req, res) => {
    try {
      const identity = readCompanyIdentity();
      const targets = await listCompanyDnsTargets();

      res.json({
        ok: true,
        identity,
        checklist: buildCompanyIdentityChecklist(identity),
        setupPlan: buildCompanySetupPlan(identity, targets),
        localOnly: true,
        externalAccountCreationEnabled: false,
        purchaseEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/v1/company-identity/dns-targets', requireAuth, async (req, res) => {
    try {
      const identity = readCompanyIdentity();
      const targets = await listCompanyDnsTargets();

      res.json({
        ok: true,
        targets,
        setupPlan: buildCompanySetupPlan(identity, targets),
        localOnly: true,
        externalMutationEnabled: false
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/company-identity/dns-targets', requireAuth, async (req, res) => {
    try {
      const identity = readCompanyIdentity();
      const target = normalizeCompanyDnsTargetInput(req.body || {}, identity);
      const result = await dbRun(
        `INSERT INTO company_dns_targets
           (user_id, domain, record_type, host, value, purpose, status, notes, local_only, external_mutation_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
        [
          req.session.userId || null,
          target.domain,
          target.recordType,
          target.host,
          target.value,
          target.purpose,
          target.status,
          target.notes
        ]
      );
      const row = await dbGet('SELECT * FROM company_dns_targets WHERE id = ?', [result.lastID]);
      const targets = await listCompanyDnsTargets();

      res.status(201).json({
        ok: true,
        target: parseCompanyDnsTarget(row),
        targets,
        setupPlan: buildCompanySetupPlan(identity, targets),
        localOnly: true,
        externalMutationEnabled: false
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/v1/company-identity/dns-targets/:id', requireAuth, async (req, res) => {
    try {
      const identity = readCompanyIdentity();
      const existingRow = await dbGet('SELECT * FROM company_dns_targets WHERE id = ?', [req.params.id]);

      if (!existingRow) {
        return res.status(404).json({ error: 'DNS target not found' });
      }

      const existing = parseCompanyDnsTarget(existingRow);
      const target = normalizeCompanyDnsTargetInput({
        domain: req.body?.domain ?? existing.domain,
        recordType: req.body?.recordType ?? req.body?.record_type ?? existing.recordType,
        host: req.body?.host ?? existing.host,
        value: req.body?.value ?? existing.value,
        purpose: req.body?.purpose ?? existing.purpose,
        status: req.body?.status ?? existing.status,
        notes: req.body?.notes ?? existing.notes
      }, identity);

      await dbRun(
        `UPDATE company_dns_targets
         SET domain = ?,
             record_type = ?,
             host = ?,
             value = ?,
             purpose = ?,
             status = ?,
             notes = ?,
             local_only = 1,
             external_mutation_enabled = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          target.domain,
          target.recordType,
          target.host,
          target.value,
          target.purpose,
          target.status,
          target.notes,
          existing.id
        ]
      );

      const row = await dbGet('SELECT * FROM company_dns_targets WHERE id = ?', [existing.id]);
      const targets = await listCompanyDnsTargets();

      res.json({
        ok: true,
        target: parseCompanyDnsTarget(row),
        targets,
        setupPlan: buildCompanySetupPlan(identity, targets),
        localOnly: true,
        externalMutationEnabled: false
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
}

module.exports = {
  registerCompanyIdentityRoutes
};
