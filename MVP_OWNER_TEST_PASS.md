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
   - Pass condition: Wallet Onboarding Wizard explains the owner key handoff in plain English and shows the simplest safe key-control path.
   - Pass condition: Owner Key Takeover Mode shows Trading Research, Token Deployment, Treasury, and Recovery templates that fill safe defaults without accepting secret material.
   - Pass condition: Attach Wallet Metadata accepts only public wallet metadata, local connector reference IDs, project assignments, and permission scopes.
   - Pass condition: unsafe wallet fields such as seed phrases, recovery phrases, private keys, passphrases, passwords, or token/API secrets are rejected.
   - Pass condition: every risky wallet permission defaults to blocked or requires owner approval each time; live signing remains unavailable.
   - Pass condition: `Review Readiness` writes a local readiness event and `Revoke` blocks every permission while keeping signing disabled.
   - Pass condition: YouTube-style training content, recovery procedure, emergency shutdown, and rollback protection are visible without code.

3. Open `/security-lockdown`.
   - Pass condition: Security Snapshot loads from `/api/v1/mac-security/audit`.
   - Pass condition: the page shows Hostile Network Mode, Priority Owner Actions, Audit Checks, Listening Network Services, Manual Mac Lockdown Checklist, Emergency Containment, and Network And Router Plan.
   - Pass condition: the audit reports read-only local checks only; it does not inspect secrets, mutate routers, mutate VPNs, run live trading, or run privileged browser commands.
   - Pass condition: EtherealAI bind host reports loopback/local-only operation on `127.0.0.1`.
   - Pass condition: the page gives plain-English owner actions for FileVault, firewall, stealth mode, Gatekeeper, SIP, automatic updates, local admin accounts, human-vs-system admin classification, MDM enrollment, user crontab, system extensions, remote access, AirDrop, Handoff, Wi-Fi DNS/proxy state, password-after-sleep, Activity Monitor-style process/resource review, outbound connections, startup persistence, and listening services.
   - Pass condition: Suspected Admin Or Kernel Compromise explains that this Mac must not be trusted for secrets until clean-room recovery is complete.
   - Pass condition: Clean-Room Recovery Plan explains selective backup, full erase/reinstall or DFU restore/revive for Apple silicon when firmware/system integrity is in doubt, and credential rotation from a clean device/network.

4. Open `/mvp-test-pass`.
   - Pass condition: MVP status is `ready_for_owner_testing`, MVP completion is `99%` before owner acceptance or `100%` after local owner acceptance, local end-to-end completion is `95%`, MVP blockers are `0`, and live execution is disabled.
   - Pass condition: Completion Ledger shows owner acceptance recorded moves MVP from `99%` to `100%`, active paper schedule review moves local paper automation beyond `95%`, and live execution remains capped at `72%` by blocked gates.
   - Pass condition: Bot Automation Smoke shows monitor-only workflow status, dossier evidence, route boundary `monitor_only_no_live_orders`, and live execution blocked.
   - Pass condition: Owner Evidence Manifest lists local proof points and `Download Evidence Manifest JSON` is available.
   - Pass condition: Owner Evidence Review Checklist lists local proof rows, checksum marker, and confirms live execution remains blocked.
   - Pass condition: Owner Acceptance Record shows the current local acceptance state, zero records before final owner acceptance, and live execution disabled.

5. Open `/owner-proof-packet`.
   - Pass condition: Owner Proof Packet loads and shows readiness, proof surfaces, export surfaces, route safety, and full-live blockers.
   - Pass condition: Completion Ledger is present in the proof packet and lists owner acceptance, active paper schedule review, and blocked live gates.
   - Pass condition: Owner Test Gate shows `Ready` and Local MVP Blockers shows `0`.
   - Pass condition: Owner Acceptance shows `Pending Review`; this is expected until manual owner testing records final acceptance.
   - Pass condition: `Record Local MVP Acceptance` remains disabled until the local test pass, proof-packet review, and live-disabled acknowledgement boxes are checked.
   - Pass condition: `Download Proof Packet JSON` is enabled after `/api/v1/owner-proof-packet` loads.
   - Pass condition: Packet Checksum shows a SHA-256 prefix and the downloaded JSON includes the full checksum.
   - Pass condition: Proof Surfaces include owner proof packet, dashboard readiness, MVP Test Pass, Operator Control, Mac Security Lockdown, route inventory, Strategy Lab, Social Ops, and Solidity Lab.
   - Pass condition: Bot Automation Path shows Automated Paper Path, Ready Paper Plans, Active Paper Schedules, Future Live Automation blocked, Live Blocked Gates, and no live order endpoint.
   - Pass condition: Paper Automation Runbook lists the monitor-only owner steps to review ready paper plans, activate or review a paper schedule, inspect the latest paper run, export local evidence, record local MVP acceptance, and keep blocked live actions disabled.

6. Open `/strategy-lab`.
   - Pass condition: Local Verification, MVP Readiness, Automation Safety, and Launch Readiness panels load.
   - Pass condition: launch status remains blocked and `live_order_endpoint_enabled` remains blocked.

7. Test Strategy Lab research locally.
   - Save a strategy.
   - Import or queue candle data.
   - Run backtest, optimization sweep, split test, walk-forward test, and paper replay.
   - Pass condition: artifacts persist and appear in tables without enabling live execution.

8. Test Creator Agent locally.
   - Create a task.
   - Create or select an approved workspace.
   - Generate a proposal, apply it when approved, and run safe verification commands.
   - Pass condition: task activity, checklist, proposal, command request, command run, and checkpoint records are visible.

9. Test Solidity Lab locally.
   - Save a contract spec.
   - Open starter source, review output, and scaffold a local workspace if needed.
   - Pass condition: Deployment Boundary shows local-only deployment, wallet secrets blocked, and no mainnet or testnet broadcast.
   - Pass condition: Target Blockchain accepts low-fee and non-Ethereum options including Solana, Polygon, BNB Chain, Avalanche, Base, and custom-chain.
   - Pass condition: `Select Polygon Launch Defaults` fills a Polygon ERC20 launch profile with PolygonScan, DEX route research, listing evidence, social/community ops, and no-live-execution boundaries.
   - Pass condition: Token Ecosystem Studio loads the local ecosystem catalog.
   - Pass condition: Saved specs expose an `Ecosystem` action that opens multi-chain token builder, website creation, whitepaper, chain-builder/node research, listing readiness, logo brief, social/community plan, and cross-chain arbitrage design output.
   - Pass condition: Polygon ecosystem output includes chain ID `137`, Polygon wallet/RPC no-secret boundary, Polygon DEX route planning, and local-only listing evidence requirements.
   - Pass condition: Ecosystem output keeps deployment, wallet secrets, external posting, and live trading disabled.

10. Test Social Ops locally.
   - Generate or save a draft.
   - Create Token Community Manager drafts for a saved token ecosystem project if a project exists.
   - Review the Draft Queue.
   - Pass condition: Local-Only Safety shows public posting disabled, no social network API calls, and owner review required.
   - Pass condition: Token Community Manager creates local CMC/CoinGecko/community drafts without external posting or listing submission, and flags fake-volume, spam, bribery, or bypass language for review.

11. Test exchange safety metadata.
   - Save secret references using reference names only.
   - Save exchange connector metadata.
   - Run readiness and adapter contract checks.
   - Pass condition: no secret values are accepted and disabled adapter scaffolds remain disabled.

12. Test bot automation in paper/monitor-only mode.
   - Create a bot plan.
   - Run paper preflight/readiness.
   - Create a paper schedule if desired.
   - Open a plan safety dossier with `View`.
   - Confirm Automated Paper Path shows current paper automation state and Future Live Automation remains blocked.
   - Export filtered plans/runs/schedules as JSON or CSV if evidence is needed.
   - Export the safety dossier JSON and dossier history CSV if evidence is needed.
   - Pass condition: runs, schedules, summaries, exports, and dossiers remain paper/monitor-only; route boundary is `monitor_only_no_live_orders`; go-live remains blocked.

13. Record local MVP acceptance only after the manual pass is complete.
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
- Owner Key Takeover Mode provides role templates for Trading Research, Token Deployment, Treasury, and Recovery so the owner can attach safe metadata without building a permission model manually.
- EtherealAI stores wallet labels, public addresses, chain family, network, project assignments, permission scopes, and local connector reference IDs only.
- EtherealAI does not store seed phrases, recovery phrases, private keys, passphrases, wallet passwords, API tokens, or Cloudflare/GitHub credentials.
- Wallet permissions are explicit: view public address, request signature, deploy contract, mint token, transfer assets, trade execution, bridge assets, treasury spend, and admin recovery.
- Risky wallet permissions must remain blocked or owner-approved each time. No automatic wallet signing exists in this phase.
- Each wallet action writes a local wallet permission event so changes are visible and reviewable.
- Revocation is the emergency shutdown path for a wallet record: it sets status to `revoked`, blocks all permissions, and keeps live execution disabled.

## Mac Security Lockdown Workflow

- `/security-lockdown` is the current non-coder Mac host security surface.
- `/api/v1/mac-security/audit` performs a read-only local audit of FileVault, macOS Firewall, stealth mode, block-all incoming mode, Gatekeeper, System Integrity Protection, update checks, local admin accounts with human-vs-system classification and SecureToken status, MDM enrollment, user crontab, system extensions, remote access checks, AirDrop preference, Handoff preferences, Wi-Fi DNS/proxy state, password-after-sleep preference, Activity Monitor-style CPU/memory/disk/network/resource snapshots, outbound connections, startup persistence folders, listening TCP services, and EtherealAI loopback binding.
- Suspected admin/kernel compromise mode explicitly treats the current Mac as untrusted for wallet signing, banking, or credential rotation until clean-room recovery.
- Clean-room recovery guidance tells the owner to preserve evidence, selectively back up owner-created data only, avoid migrating apps/profiles/extensions/startup items, and consider full erase/reinstall or Apple silicon DFU restore/revive from a clean second Mac when firmware/system integrity is in doubt.
- The audit does not inspect secrets, mutate routers, mutate VPNs, change DNS, deploy websites, post externally, place trades, or enable wallet signing.
- Safe user-level hardening applied in this session: password required immediately after sleep/screensaver, AirDrop disable preference, Handoff advertising/receiving disabled, Wi-Fi DNS set to Cloudflare/Quad9, Wi-Fi proxies confirmed off, SSH file permissions tightened, `.DS_Store` writes disabled for network/USB volumes, Apple personalized advertising disabled, visible filename extensions, and Finder extension-change warnings. Owner-approved admin hardening also disabled firewall auto-allow for signed built-in/downloaded apps, disabled the Remote Login/SSH launch service, and disabled the Remote Apple Events launch service.
- Manual owner actions remain necessary for admin-only Mac settings such as Sharing services, remote login, remote Apple events, firewall app exceptions, Full Disk Access, Accessibility, Screen Recording, Input Monitoring, Login Items, and router/IoT segmentation.

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
