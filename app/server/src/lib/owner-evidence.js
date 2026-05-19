function buildOwnerEvidenceSnapshot() {
  return {
    status: 'ready_for_owner_testing',
    localOnly: true,
    liveExecutionEnabled: false,
    manifestLocation: '/mvp-test-pass',
    dashboardLocation: '/dashboard',
    routeBoundary: 'monitor_only_no_live_orders',
    proofSurfaces: [
      {
        id: 'owner_proof_packet',
        label: 'Owner proof packet',
        location: '/owner-proof-packet',
        evidence: 'Readiness status, proof surfaces, export surfaces, route safety summary, and blocked live gates in one local JSON download',
        localOnly: true,
        liveExecutionEnabled: false
      },
      {
        id: 'dashboard_readiness',
        label: 'Dashboard readiness and System Memory export',
        location: '/dashboard',
        evidence: 'MVP readiness, full-live blockers, and System Memory JSON export',
        localOnly: true,
        liveExecutionEnabled: false
      },
      {
        id: 'mvp_test_pass_manifest',
        label: 'MVP Test Pass owner evidence manifest',
        location: '/mvp-test-pass',
        evidence: 'Owner Evidence Review Checklist, manifest checksum, and local JSON download',
        localOnly: true,
        liveExecutionEnabled: false
      },
      {
        id: 'operator_control_wallets',
        label: 'Operator Control wallet onboarding',
        location: '/operator-control',
        evidence: 'Wallet metadata, permission scopes, readiness checks, revocation events, and no wallet secret storage',
        localOnly: true,
        signingEnabled: false,
        liveExecutionEnabled: false
      },
      {
        id: 'mac_security_lockdown',
        label: 'Mac Security Lockdown',
        location: '/security-lockdown',
        evidence: 'Read-only local Mac hardening audit, listening-service review, hostile-network checklist, and owner-only manual remediation steps',
        localOnly: true,
        readOnlyAudit: true,
        privilegedMutation: false,
        liveExecutionEnabled: false
      },
      {
        id: 'route_inventory_boundaries',
        label: 'Route Inventory safety boundaries',
        location: '/server-route-inventory',
        evidence: 'Monitor-only bot automation boundary and external-surface safety profiles',
        localOnly: true,
        liveExecutionEnabled: false
      },
      {
        id: 'strategy_lab_bot_safety',
        label: 'Strategy Lab bot safety dossier',
        location: '/strategy-lab#bot-automation',
        evidence: 'Bot safety dossier JSON and dossier history CSV exports',
        localOnly: true,
        liveExecutionEnabled: false
      },
      {
        id: 'social_ops_drafts',
        label: 'Social Ops local draft surface',
        location: '/social-ops',
        evidence: 'Drafts stay local and external posting remains disabled',
        localOnly: true,
        externalPostingEnabled: false
      },
      {
        id: 'solidity_lab_scaffolds',
        label: 'Solidity Lab local scaffold surface',
        location: '/solidity-lab',
        evidence: 'Contract scaffolds stay local, wallet secrets are blocked, and deployment broadcast is disabled',
        localOnly: true,
        deploymentEnabled: false
      }
    ],
    exportSurfaces: [
      {
        id: 'owner_evidence_manifest_json',
        label: 'Owner evidence manifest JSON',
        location: '/mvp-test-pass',
        format: 'json'
      },
      {
        id: 'bot_safety_dossier_json',
        label: 'Bot safety dossier JSON',
        location: '/strategy-lab#bot-automation',
        format: 'json'
      },
      {
        id: 'bot_safety_dossier_history_csv',
        label: 'Bot safety dossier history CSV',
        location: '/strategy-lab#bot-automation',
        format: 'csv'
      }
    ],
    reviewChecklist: [
      'Owner Evidence Review Checklist',
      'Confirm checksum marker',
      'Confirm live execution remains blocked'
    ],
    fullLiveBlockers: [
      'credential_loader_implemented',
      'live_order_adapter_implemented',
      'live_order_endpoint_enabled',
      'owner_go_live_command_accepted'
    ],
    externalSurfaceBoundaries: [
      {
        moduleId: 'social-ops',
        boundary: 'local_drafts_no_external_posting',
        externalPostingEnabled: false,
        ownerReviewRequired: true
      },
      {
        moduleId: 'solidity-lab',
        boundary: 'local_scaffold_no_deployment',
        deploymentEnabled: false,
        ownerReviewRequired: true
      },
      {
        moduleId: 'wallet-control',
        boundary: 'metadata_only_no_wallet_secrets',
        signingEnabled: false,
        liveExecutionEnabled: false,
        ownerReviewRequired: true
      },
      {
        moduleId: 'mac-security',
        boundary: 'read_only_local_mac_audit_no_privileged_mutation',
        localOnly: true,
        readOnlyAudit: true,
        ownerReviewRequired: true
      }
    ]
  };
}

module.exports = {
  buildOwnerEvidenceSnapshot
};
