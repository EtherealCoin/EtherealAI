const {
  buildOwnerAcceptanceRecordPayload,
  buildOwnerAcceptanceSummary,
  getLatestOwnerAcceptanceRecord,
  normalizeOwnerAcceptanceRecordInput,
  parseOwnerAcceptanceRecord
} = require('../lib/owner-acceptance');
const { buildOwnerEvidenceSnapshot } = require('../lib/owner-evidence');

function registerOwnerAcceptanceRoutes(app, {
  requireAuth,
  dbGet,
  dbAll,
  dbRun
}) {
  app.get('/api/v1/owner-acceptance', requireAuth, async (req, res) => {
    try {
      const ownerEvidence = buildOwnerEvidenceSnapshot();
      const latestRecord = await getLatestOwnerAcceptanceRecord(dbGet);
      const records = await dbAll(
        `SELECT *
         FROM owner_acceptance_records
         ORDER BY created_at DESC, id DESC
         LIMIT 10`
      );
      const ownerAcceptance = buildOwnerAcceptanceSummary({
        readyForOwnerTesting: ownerEvidence.status === 'ready_for_owner_testing'
          && ownerEvidence.localOnly === true
          && ownerEvidence.liveExecutionEnabled === false,
        latestRecord
      });

      res.json({
        ownerAcceptance,
        latestRecord,
        records: records.map(parseOwnerAcceptanceRecord),
        localOnly: true,
        liveExecution: {
          enabled: false,
          orderEndpointEnabled: false,
          goLiveAllowed: false
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/v1/owner-acceptance', requireAuth, async (req, res) => {
    try {
      const input = normalizeOwnerAcceptanceRecordInput(req.body || {});

      if (!input.valid) {
        return res.status(400).json({
          error: 'Owner acceptance requires all local review confirmations.',
          missingChecks: input.missingChecks,
          liveExecution: {
            enabled: false,
            orderEndpointEnabled: false,
            goLiveAllowed: false
          }
        });
      }

      const ownerEvidence = buildOwnerEvidenceSnapshot();
      const latestRecord = await getLatestOwnerAcceptanceRecord(dbGet);
      const ownerAcceptance = buildOwnerAcceptanceSummary({
        readyForOwnerTesting: ownerEvidence.status === 'ready_for_owner_testing'
          && ownerEvidence.localOnly === true
          && ownerEvidence.liveExecutionEnabled === false,
        latestRecord
      });
      const payload = buildOwnerAcceptanceRecordPayload({
        input,
        ownerAcceptance,
        readinessStatus: ownerEvidence.status
      });
      const result = await dbRun(
        `INSERT INTO owner_acceptance_records
          (user_id, status, note, proof_packet_checksum, acceptance_json, local_only, live_execution_enabled)
         VALUES (?, ?, ?, ?, ?, 1, 0)`,
        [
          req.session.userId,
          'accepted',
          input.note,
          input.proofPacketChecksum,
          JSON.stringify(payload)
        ]
      );
      const record = parseOwnerAcceptanceRecord(await dbGet(
        'SELECT * FROM owner_acceptance_records WHERE id = ?',
        [result.lastID]
      ));
      const updatedOwnerAcceptance = buildOwnerAcceptanceSummary({
        readyForOwnerTesting: true,
        latestRecord: record
      });

      res.status(201).json({
        record,
        ownerAcceptance: updatedOwnerAcceptance,
        localOnly: true,
        liveExecution: {
          enabled: false,
          orderEndpointEnabled: false,
          goLiveAllowed: false
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  registerOwnerAcceptanceRoutes
};
