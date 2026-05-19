# EtherealAI MVP Owner Test Pass

Last updated: 2026-05-18

## Current Scope

This MVP is ready for local owner testing as a local-first builder, strategy research, paper automation, and safety-monitoring app.

Live exchange trading is not part of this MVP. Credential loading, live exchange adapters, live order endpoints, and go-live execution are intentionally blocked.

## Start The App

```bash
cd /Users/ethereal/test-ai-project
npm start
```

Open:

```text
http://127.0.0.1:3000
```

Use the local test account when needed:

```text
patrick@etherealAI
<owner-provided local password>
```

## Primary Local Test Sequence

1. Open `/dashboard`.
   - Pass condition: Server, database, dev-server status, local model status, and memory snapshot load.
   - Pass condition: Model Roles shows coder `qwen3.6:35b-a3b` and provider `ollama`.
   - Pass condition: Local Model Benchmark is available for role default, Ollama, and MLX provider comparisons, including `Max Tokens` and `Disable Thinking` controls. MLX is expected online only when `mlx_lm.server` is running on port `8080`.
   - Pass condition: MLX Lifecycle shows status/start/stop controls, memory isolation, and `Unload Ollama Before Start`.
   - Pass condition: Completion Ledger explains why MVP is 99%, why Local Paper is 95%, and why Full Live is 72%.
   - Pass condition: MVP Readiness shows Owner Acceptance as `Pending Review`.
   - Pass condition: System Memory export shows owner evidence included, owner acceptance pending, and live disabled.

2. Open `/operator-control`.
   - Pass condition: Owner Control Summary loads and reports local-only, no secret storage, signing disabled, and live execution disabled.
   - Pass condition: Wallet Onboarding Wizard explains the owner key handoff in plain English.
   - Pass condition: Attach Wallet Metadata accepts only public wallet metadata, local connector reference IDs, project assignments, and permission scopes.
   - Pass condition: unsafe wallet fields such as seed phrases, recovery phrases, private keys, passphrases, passwords, or token/API secrets are rejected.
   - Pass condition: every risky wallet permission defaults to blocked or requires owner approval each time; live signing remains unavailable.
   - Pass condition: `Review Readiness` writes a local readiness event and `Revoke` blocks every permission while keeping signing disabled.
   - Pass condition: YouTube-style training content, recovery procedure, emergency shutdown, and rollback protection are visible without code.

3. Open `/mvp-test-pass`.
   - Pass condition: MVP status is `ready_for_owner_testing`, MVP completion is `99%` before owner acceptance or `100%` after local owner acceptance, local end-to-end completion is `95%`, MVP blockers are `0`, and live execution is disabled.
   - Pass condition: Completion Ledger shows owner acceptance recorded moves MVP from `99%` to `100%`, active paper schedule review moves local paper automation beyond `95%`, and live execution remains capped at `72%` by blocked gates.
   - Pass condition: Bot Automation Smoke shows monitor-only workflow status, dossier evidence, route boundary `monitor_only_no_live_orders`, and live execution blocked.
   - Pass condition: Owner Evidence Manifest lists local proof points and `Download Evidence Manifest JSON` is available.
   - Pass condition: Owner Evidence Review Checklist lists local proof rows, checksum marker, and confirms live execution remains blocked.
   - Pass condition: Owner Acceptance Record shows the current local acceptance state, zero records before final owner acceptance, and live execution disabled.

4. Open `/owner-proof-packet`.
   - Pass condition: Owner Proof Packet loads and shows readiness, proof surfaces, export surfaces, route safety, and full-live blockers.
   - Pass condition: Completion Ledger is present in the proof packet and lists owner acceptance, active paper schedule review, and blocked live gates.
   - Pass condition: Owner Test Gate shows `Ready` and Local MVP Blockers shows `0`.
   - Pass condition: Owner Acceptance shows `Pending Review`; this is expected until manual owner testing records final acceptance.
   - Pass condition: `Record Local MVP Acceptance` remains disabled until the local test pass, proof-packet review, and live-disabled acknowledgement boxes are checked.
   - Pass condition: `Download Proof Packet JSON` is enabled after `/api/v1/owner-proof-packet` loads.
   - Pass condition: Packet Checksum shows a SHA-256 prefix and the downloaded JSON includes the full checksum.
   - Pass condition: Proof Surfaces include owner proof packet, dashboard readiness, MVP Test Pass, Operator Control, route inventory, Strategy Lab, Social Ops, and Solidity Lab.
   - Pass condition: Bot Automation Path shows Automated Paper Path, Ready Paper Plans, Active Paper Schedules, Future Live Automation blocked, Live Blocked Gates, and no live order endpoint.
   - Pass condition: Paper Automation Runbook lists the monitor-only owner steps to review ready paper plans, activate or review a paper schedule, inspect the latest paper run, export local evidence, record local MVP acceptance, and keep blocked live actions disabled.

5. Open `/strategy-lab`.
   - Pass condition: Local Verification, MVP Readiness, Automation Safety, and Launch Readiness panels load.
   - Pass condition: launch status remains blocked and `live_order_endpoint_enabled` remains blocked.

6. Test Strategy Lab research locally.
   - Save a strategy.
   - Import or queue candle data.
   - Run backtest, optimization sweep, split test, walk-forward test, and paper replay.
   - Pass condition: artifacts persist and appear in tables without enabling live execution.

7. Test Creator Agent locally.
   - Create a task.
   - Create or select an approved workspace.
   - Generate a proposal, apply it when approved, and run safe verification commands.
   - Pass condition: task activity, checklist, proposal, command request, command run, and checkpoint records are visible.

8. Test Solidity Lab locally.
   - Save a contract spec.
   - Open starter source, review output, and scaffold a local workspace if needed.
   - Pass condition: Deployment Boundary shows local-only deployment, wallet secrets blocked, and no mainnet or testnet broadcast.
   - Pass condition: Target Blockchain accepts low-fee and non-Ethereum options including Solana, Polygon, BNB Chain, Avalanche, Base, and custom-chain.
   - Pass condition: Token Ecosystem Studio loads the local ecosystem catalog.
   - Pass condition: Saved specs expose an `Ecosystem` action that opens multi-chain token builder, website creation, whitepaper, chain-builder/node research, listing readiness, logo brief, social/community plan, and cross-chain arbitrage design output.
   - Pass condition: Ecosystem output keeps deployment, wallet secrets, external posting, and live trading disabled.

9. Test Social Ops locally.
   - Generate or save a draft.
   - Review the Draft Queue.
   - Pass condition: Local-Only Safety shows public posting disabled, no social network API calls, and owner review required.

10. Test exchange safety metadata.
   - Save secret references using reference names only.
   - Save exchange connector metadata.
   - Run readiness and adapter contract checks.
   - Pass condition: no secret values are accepted and disabled adapter scaffolds remain disabled.

11. Test bot automation in paper/monitor-only mode.
   - Create a bot plan.
   - Run paper preflight/readiness.
   - Create a paper schedule if desired.
   - Open a plan safety dossier with `View`.
   - Confirm Automated Paper Path shows current paper automation state and Future Live Automation remains blocked.
   - Export filtered plans/runs/schedules as JSON or CSV if evidence is needed.
   - Export the safety dossier JSON and dossier history CSV if evidence is needed.
   - Pass condition: runs, schedules, summaries, exports, and dossiers remain paper/monitor-only; route boundary is `monitor_only_no_live_orders`; go-live remains blocked.

12. Record local MVP acceptance only after the manual pass is complete.
   - Open `/owner-proof-packet`.
   - Check the local test pass, proof packet review, and live-disabled acknowledgement boxes.
   - Use `Record Local MVP Acceptance`.
   - Pass condition: the record is saved locally and live execution remains disabled.

## Monitor-Only Bot Workflow

- Paper bot schedules can run local paper decision cycles automatically.
- Strategy Lab, Owner Proof Packet, and System Memory show an Automated Paper Path panel backed by `/api/v1/bot-automation-capability-path`, with Future Live Automation blocked until a later reviewed implementation phase.
- Owner Proof Packet includes a Paper Automation Runbook for monitor-only owner testing: review ready paper plans, activate or review a paper schedule, inspect the latest paper run, export local evidence, and record local MVP acceptance while live actions stay blocked.
- The workflow can create local plan, schedule, paper-run, readiness, go-live-review, and dossier evidence records.
- Strategy Lab exports are local evidence snapshots only: filtered plan/run/schedule JSON or CSV, safety dossier JSON, and dossier history CSV.
- MVP Test Pass can export the owner evidence manifest as a local JSON snapshot.
- The owner evidence manifest includes a `sha256` checksum for its artifact list so the exported local proof set has an integrity marker.
- MVP Test Pass includes an Owner Evidence Review Checklist that maps each proof point to its source and owner check.
- Live execution is intentionally unavailable: no credential loading, no live exchange adapter, no live order endpoint, and no exchange order placement.
- Owner go-live commands are recorded for blocked review only until a future reviewed implementation phase adds every live execution gate.

## Owner Wallet Control Workflow

- `/operator-control` is the current non-coder owner key handoff surface.
- EtherealAI stores wallet labels, public addresses, chain family, network, project assignments, permission scopes, and local connector reference IDs only.
- EtherealAI does not store seed phrases, recovery phrases, private keys, passphrases, wallet passwords, API tokens, or Cloudflare/GitHub credentials.
- Wallet permissions are explicit: view public address, request signature, deploy contract, mint token, transfer assets, trade execution, bridge assets, treasury spend, and admin recovery.
- Risky wallet permissions must remain blocked or owner-approved each time. No automatic wallet signing exists in this phase.
- Each wallet action writes a local wallet permission event so changes are visible and reviewable.
- Revocation is the emergency shutdown path for a wallet record: it sets status to `revoked`, blocks all permissions, and keeps live execution disabled.

## Full Live Blockers

Full live end-to-end completion remains about `72%` because these 4 gates are intentionally blocked:

- Runtime credential loader is implemented: future work must add local-only loading with no secret logging, no DB secret storage, and verifier coverage.
- Live exchange order adapters are implemented: future work must replace disabled scaffolds with reviewed exchange-specific adapters.
- Live order endpoint is enabled: future work must add explicit owner enablement, safety gates, and integration tests before any live endpoint exists.
- Owner go-live command can execute: future work can accept owner go-live only after every live execution gate is reviewed and implemented.

## Verification Commands

Run static/local verification:

```bash
npm test
```

Run authenticated server verification while `npm start` is running:

```bash
ETHEREALAI_VERIFY_SERVER=1 \
ETHEREALAI_BASE_URL=http://127.0.0.1:3000 \
ETHEREALAI_TEST_EMAIL='<owner-login>' \
ETHEREALAI_TEST_PASSWORD='<owner-password>' \
npm test
```

## Current Completion Estimate

- MVP completion: about `99%`
- Local paper-automation end-to-end completion: about `95%`
- Full live end-to-end completion: about `72%`

The Completion Ledger explains these caps in the app. MVP moves from `99%` to `100%` only after the owner records local acceptance. Local paper automation moves beyond `95%` after active paper schedule review. Full live stays at `72%` until a separate reviewed live-execution phase implements credential loading, live adapters, a live order endpoint, production-grade safety review, and go-live acceptance.
