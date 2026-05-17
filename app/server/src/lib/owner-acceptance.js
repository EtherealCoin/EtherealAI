function parseOwnerAcceptanceRecord(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    note: row.note || '',
    proofPacketChecksum: row.proof_packet_checksum || null,
    localOnly: Boolean(row.local_only),
    liveExecutionEnabled: Boolean(row.live_execution_enabled),
    acceptance: JSON.parse(row.acceptance_json || '{}'),
    createdAt: row.created_at
  };
}

function normalizeOwnerAcceptanceRecordInput(input = {}) {
  const note = String(input.note || '').trim().slice(0, 1000);
  const proofPacketChecksum = String(input.proofPacketChecksum || '').trim();
  const checks = {
    manualTestCompleted: input.manualTestCompleted === true,
    proofPacketReviewed: input.proofPacketReviewed === true,
    liveExecutionAcknowledgedDisabled: input.liveExecutionAcknowledgedDisabled === true
  };
  const missingChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([id]) => id);

  return {
    note,
    proofPacketChecksum: /^[a-f0-9]{64}$/i.test(proofPacketChecksum) ? proofPacketChecksum.toLowerCase() : null,
    checks,
    missingChecks,
    valid: missingChecks.length === 0
  };
}

function buildOwnerAcceptanceRecordPayload({
  input,
  ownerAcceptance,
  readinessStatus = 'ready_for_owner_testing',
  generatedAt = new Date().toISOString()
}) {
  return {
    generatedAt,
    status: 'accepted',
    readinessStatus,
    ownerAcceptanceStatusBeforeRecord: ownerAcceptance.status,
    checks: input.checks,
    note: input.note,
    proofPacketChecksum: input.proofPacketChecksum,
    localOnly: true,
    liveExecution: {
      enabled: false,
      orderEndpointEnabled: false,
      goLiveAllowed: false,
      note: 'Owner acceptance records the local MVP review only. It does not enable live execution.'
    }
  };
}

async function getLatestOwnerAcceptanceRecord(dbGet) {
  const row = await dbGet(
    `SELECT *
     FROM owner_acceptance_records
     ORDER BY created_at DESC, id DESC
     LIMIT 1`
  );

  return parseOwnerAcceptanceRecord(row);
}

function buildOwnerAcceptanceSummary({
  readyForOwnerTesting = false,
  latestRecord = null
} = {}) {
  const accepted = readyForOwnerTesting
    && latestRecord?.status === 'accepted'
    && latestRecord?.localOnly === true
    && latestRecord?.liveExecutionEnabled === false;

  if (accepted) {
    return {
      status: 'accepted',
      localMvpGate: 'accepted',
      acceptanceRequiredForMvp100: false,
      completionReason: 'Local owner acceptance has been recorded. Live execution remains blocked.',
      ownerAction: 'Keep live execution disabled until a separate future live implementation phase is reviewed.',
      liveMode: 'blocked',
      acceptedAt: latestRecord.createdAt,
      latestRecord,
      requiredArtifacts: [
        {
          id: 'mvp_owner_test_pass',
          label: 'MVP owner test pass',
          location: '/mvp-test-pass',
          ownerCheck: 'Completed before local owner acceptance was recorded.'
        },
        {
          id: 'owner_proof_packet',
          label: 'Owner proof packet',
          location: '/owner-proof-packet',
          ownerCheck: 'Reviewed before local owner acceptance was recorded.'
        },
        {
          id: 'route_inventory_safety',
          label: 'Route safety inventory',
          location: '/server-route-inventory',
          ownerCheck: 'Live routes remained blocked or monitor-only at acceptance.'
        }
      ]
    };
  }

  return {
    status: readyForOwnerTesting ? 'pending_owner_review' : 'needs_local_review',
    localMvpGate: readyForOwnerTesting ? 'ready' : 'review',
    acceptanceRequiredForMvp100: true,
    completionReason: readyForOwnerTesting
      ? 'Code gates are ready for local owner testing; final MVP acceptance remains owner review.'
      : 'Local MVP blockers remain before owner acceptance can start.',
    ownerAction: readyForOwnerTesting
      ? 'Run MVP_OWNER_TEST_PASS.md, review the owner proof packet, and record owner acceptance after manual testing.'
      : 'Resolve local MVP blockers, then rerun the owner test pass.',
    liveMode: 'blocked',
    requiredArtifacts: [
      {
        id: 'mvp_owner_test_pass',
        label: 'MVP owner test pass',
        location: '/mvp-test-pass',
        ownerCheck: 'Run the local owner test pass and confirm all pass conditions.'
      },
      {
        id: 'owner_proof_packet',
        label: 'Owner proof packet',
        location: '/owner-proof-packet',
        ownerCheck: 'Review/download the canonical local proof packet with checksum.'
      },
      {
        id: 'route_inventory_safety',
        label: 'Route safety inventory',
        location: '/server-route-inventory',
        ownerCheck: 'Confirm live routes remain blocked or monitor-only before acceptance.'
      }
    ]
  };
}

module.exports = {
  buildOwnerAcceptanceRecordPayload,
  buildOwnerAcceptanceSummary,
  getLatestOwnerAcceptanceRecord,
  normalizeOwnerAcceptanceRecordInput,
  parseOwnerAcceptanceRecord
};
