# EtherealAI Project Handoff

Date: 2026-05-18

## Project Identity And Location

Official project name: `EtherealAI`

Formal descriptive name: `Ethereal Local AI Developer`

The project folder is:

`/Users/ethereal/test-ai-project`

VS Code also shows this as the recently opened project folder.

## Safety Backup

A backup archive was created here:

`/Users/ethereal/Documents/Codex/2026-05-09/can-you-access-my-chat-history/test-ai-project-backup-2026-05-09.tar.gz`

This backup excludes `node_modules`, because dependencies can be reinstalled from `package.json` and `package-lock.json`.

## Current Goal

Build EtherealAI into a fully operational local AI/LLM app. Current project appears to be a Node/Express app with authentication, SQLite, and static HTML pages.

Current rough completion estimate:

- Owner-test local MVP: 100% after the local owner acceptance record; 99% before owner acceptance in a fresh database.
- Local E2E path: complete for safe local paper operation when MVP readiness, paper automation, public wallet metadata, live-disabled state, and wallet-signing-disabled state are satisfied.
- Live E2E path: locked for unrestricted/autonomous use. Phase 3C includes one tightly gated manual tiny-live spot-test path, Phase 4 adds multi-exchange arbitrage command-center intelligence, Phase 5 adds treasury/liquidity intelligence, Phase 6 adds controlled production spot execution infrastructure behind encrypted vault storage, explicit owner approvals, dry-run checks, risk/capital gates, and final typed confirmation, Phase 6E adds the non-coder Kraken API key walkthrough, encrypted-vault save/delete/rotate flow, real key verification button, no-order production dry-run proof, and tiny-live eligibility screen, and Phase 6F adds first safe authenticated Kraken readiness plus a no-order tiny live preview and locked tiny-live-mode request. Unrestricted live trading, automated scaling, multi-leg autonomous execution, withdrawals, wallet signing, external posting, deployment, and executable go-live acceptance remain intentionally blocked.

The `/owner-setup` wizard now separates Local E2E from Live E2E: paper setup can move from `95%` to `100%`, Local E2E can complete for safe paper operation, and Live E2E stays locked until a future owner-approved live/security phase. Locked Live E2E does not enable live orders, wallet signing, deployment, DNS mutation, or public posting.

## Current Owner-Test Snapshot

- `/dashboard` is now the CEO/operator Mission Control page. It shows system health, readiness progress, live-lock status, wallets, security, active bots, blocked gates, the next recommended action, MVP readiness, the completion ledger explaining why MVP/local paper/full live percentages are gated, owner acceptance pending status, local paper automation readiness, full-live blockers, System Memory export, and `Owner evidence included · owner acceptance pending · live disabled`.
- `/owner-setup` is the non-coder Setup Wizard / Owner Setup Wizard. It uses `/api/v1/owner-setup-wizard` to show paper trading progress from `95%` to `100%`, Local E2E Complete, and Live E2E Locked while keeping live trading, wallet signing, seed phrases, private keys, and secret-value display disabled. It reads approved optional credential names/presence from `~/EtherealAI_Secrets/.env`, has a visual `.env` file picker that verifies selected file contents locally in the browser without sending values to the server, displays only detected public wallet addresses, creates a `.env.example` template, verifies each blocked gate with one click, can run one paper-only verification cycle, and saves public wallet metadata through `/api/v1/wallets`.
  Compatibility note for older handoffs: `/owner-setup` is the non-coder Owner Setup Wizard.
- `/owner-proof-packet` uses `/api/v1/owner-proof-packet` to aggregate owner-test gate status, owner acceptance pending status, readiness, the completion ledger, owner proof surfaces, export surfaces, route safety, the bot automation capability path, the monitor-only paper automation runbook, full-live blockers, a SHA-256 packet checksum, and the authenticated verification command into one local JSON-downloadable packet.
- `/api/v1/owner-acceptance` and `/owner-proof-packet` can record a local-only owner acceptance record after manual testing; the proof packet page also shows recent local acceptance records from the protected API. The record is evidence only and keeps `liveExecution.enabled`, `orderEndpointEnabled`, and `goLiveAllowed` false.
- Owner acceptance remains `pending_owner_review`; the local MVP gate is ready, and the last MVP percent is reserved for manual owner testing/acceptance rather than live execution.
- `/operator-control` is the non-coder Wallet & Funding Center / Operator Control Center for owner wallet onboarding. It attaches wallet metadata only, scopes wallet permissions, shows guided key-handoff steps, displays recovery/emergency shutdown procedures, records wallet permission events, and keeps wallet signing/live execution disabled.
- `/security-lockdown` is the non-coder Security Lockdown Center / Mac Security Lockdown Center. It runs read-only local Mac hardening audits, separates visible human admin accounts from built-in/system admin members, shows Activity Monitor-style CPU/memory/disk/network snapshots, lists outbound connections, startup persistence, and listening TCP services, gives hostile-network/Airbnb-network containment steps, includes suspected admin/kernel compromise handling, and keeps all privileged remediation as visible owner action.
  Compatibility note for older handoffs: `/operator-control` is the non-coder Operator Control Center and `/security-lockdown` is the non-coder Mac Security Lockdown Center.
- `/mvp-test-pass` shows Bot Automation Smoke, the completion ledger, Owner Evidence Manifest, the Owner Evidence Review Checklist, local JSON export, the manifest `sha256` checksum prefix, and the current local owner acceptance record state.
- `/server-route-inventory` is now the Advanced / Developer Tools surface for raw route evidence. It still includes safety profiles for bot automation, automation safety, exchange metadata, wallet control, order intents, Social Ops, and Solidity Lab, plus Owner Proof Coverage counts, owner acceptance pending status, and local acceptance record count from System Memory.
- `/strategy-lab` now starts the non-coder paper workflow with `Run This Strategy Safely`. After the owner saves or opens a strategy, this one button creates or reuses the safe paper session, active safe risk profile, local paper connector, ready paper plan, active local schedule, verifier, and one local paper simulation run. It returns running status, simulated trades, P/L, spread/cost assumptions, fees/slippage, entry/exit reasons, strategy health, and warnings. If no matching market data exists, it creates clearly labeled local sample candles for workflow verification without exchange APIs or terminal commands. The older Bot Operator Wizard and raw bot records remain available under Advanced Developer Mode.
- The one-click Strategy Lab flow keeps live trading, wallet signing, exchange orders, token deployment, external posting, and credential loading disabled.
- Strategy Lab now has a structured arbitrage strategy lane for `Cross-Exchange Arbitrage`, `Cross-DEX Arbitrage`, and `Hybrid DEX/CEX Arbitrage`. The UI collects buy venues, sell venues, arbitrage type, minimum spread, maker/taker fees, slippage tolerance, minimum liquidity, max latency, simultaneous execution, stablecoin pair, token whitelist, and top-volume filters. The backend stores these rules in `trading_strategies.strategy_type` and `strategy_rules_json`, bypasses the indicator parser for arbitrage, and runs local fee/slippage/liquidity/latency-aware route simulations with no live orders or wallet signing. Safe Paper results now include exchange spread comparisons, accepted/rejected route reasons, projected net after costs, timing assumptions, and top-volume filter status.
- Strategy Lab now includes a chain-neutral `Exchange Connector Manager`. It exposes a safe registry for CEX, US-compliant CEX, futures/derivatives, Ethereum DEX, Solana DEX, BNB Chain DEX, Arbitrum/Avalanche/Polygon DEX, cross-chain aggregator, decentralized perpetual, hybrid, and P2P venues. The manager creates default-OFF connector placeholders, supports recommended-first setup, hides unsupported/manual venues, and runs local read-only safety tests. It does not store API keys in the UI, call exchanges, enable withdrawals, enable live trading, or enable wallet signing.
- `/live-trading-launch` is the non-coder Live Trading Launch Center. It starts the safe path toward live trading without unlocking it. Phase 1 adds expanded public/read-only market snapshot support for Binance, Coinbase, Kraken, OKX, Bybit, KuCoin, Gate.io, MEXC, Bitget, Bitstamp, Gemini USD markets, Crypto.com, and Hyperliquid where endpoints allow it. Phase 2 adds a read-only arbitrage scanner that compares best buy versus best sell venues, estimates gross spread, fees, slippage, latency risk, visible liquidity, and net paper edge, then lets the owner click `Paper Simulate This Opportunity`. Account API keys are optional for later account-specific fee/limit checks. The page also shows the locked Live Trading Approval Center for future trading permissions, withdrawal-disabled verification, risk limits, kill switch, owner approval, audit log, signing boundary, compliance checklist, dry-run proof, and small-capital test mode. Browser verification saved `/Users/ethereal/Desktop/EtherealAI_Live_Trading_Launch_Center_Check.png`. Live trading, withdrawals, wallet signing, and order endpoints remain disabled.
- Phase 3 is now active inside `/live-trading-launch` without unlocking autonomous live trading. The Phase 3 Operator Dashboard adds authenticated read-only account scan infrastructure for Binance, Coinbase, Kraken, OKX, and Bybit; a normalized account view for balances, fee tiers, limits, positions, subaccount metadata, margin/futures metadata, and withdrawal-permission review status; an exchange capability matrix; market-data-only WebSocket stream specs; a universal dry-run order model covering market, limit, post-only, IOC, reduce-only, TP/SL, and bracket drafts; live execution safety review with global kill switch, max order size, max daily loss, stale-price rejection, liquidity minimums, latency/slippage guards, duplicate-order prevention, dry-run mode, and manual confirmation gates; account-aware arbitrage scoring; spread replay; and paper-vs-estimated-live-vs-real-world benchmark output.
- Phase 3A is now added inside `/live-trading-launch` as Authenticated Account Readiness. It accepts credentials only through the secure local exchange vault, then scans Binance, Coinbase, Kraken, OKX, and Bybit for authenticated read-only account access, permission/withdrawal signals, balances, maker/taker fees, account limits, symbol trading rules, minimum order sizes/notional, rate-limit notes, and futures/margin availability where available. It shows per-exchange statuses: `Not Connected`, `Public Market Data Only`, `Authenticated Read-Only`, `Trading Permission Present But Locked`, `Unsafe Permissions Detected`, and `Error`. Browser verification saved `/Users/ethereal/Desktop/EtherealAI_Phase3A_Account_Readiness_Check.png`.
- Phase 3B adds sandbox/testnet execution for Binance Spot Testnet, OKX Demo Trading, and Bybit Testnet, with Kraken/Coinbase prepared but locked pending exact owner account/API validation. Browser verification saved `/Users/ethereal/Desktop/EtherealAI_Phase3B_Sandbox_Test_Check.png`.
- Phase 3C adds `Tiny Live Test Mode`: a default-locked, manual-only, one-exchange/one-symbol/one-tiny-spot-order flow. Binance Spot is the first implemented tiny-live adapter; Coinbase, Kraken, OKX, and Bybit remain prepared but locked. The flow includes a separate tiny-live encrypted vault, permission detector, withdrawal-disabled verifier, active risk/kill-switch checks, stale-price/liquidity/slippage/duplicate guards, order preview, exact manual owner confirmation phrase, place-one-order route, cancel, status tracking, balance reconciliation hooks, audit events, and emergency disable-all-live-connectors. Browser verification saved `/Users/ethereal/Desktop/EtherealAI_Phase3C_Tiny_Live_Locked_Check.png`. Automated live trading, wallet signing, withdrawals, margin, futures, leverage, and scaling remain disabled.
- Phase 4 adds `Live Arbitrage Command Center`: a planning/monitoring-only multi-exchange arbitrage expansion layer. It builds routing intelligence, exchange priority, venue scoring, spread heatmap, ranked opportunity queue, cross-exchange balance visibility, capital allocation planning, stablecoin inventory warnings, rebalancing suggestions, transfer/network/cross-chain cost estimates, exchange health, risk scoring, outage/rate-limit/websocket runbooks, partial-fill recovery plans, failed-leg recovery plans, retry guidance, and emergency controls. Simple Operator Mode now has a dedicated `/live-trading-launch` wrapper so this is visible to the owner without opening Advanced Developer Mode. Browser DOM verification confirmed the Phase 4 command center renders, runs `Run Multi-Exchange Scan`, populates spread/opportunity data, and keeps multi-leg live execution locked. Multi-leg live execution, autonomous scaling, leverage, margin, futures, withdrawals, wallet signing, and Phase 4 order endpoints remain disabled.
- Phase 5 adds `Treasury Command Center`: an intelligence-only treasury/liquidity layer. It tracks planning capital, visible exchange balances, stablecoin inventory, chain balances from public wallet metadata, idle/deployed capital, reserve gaps, advisory allocation, liquidity depth, thin books, fragmented routes, market impact, opportunity rankings, cross-chain cost/time/congestion estimates, risk/exposure controls, and AI decision audit logs. Simple Operator Mode now exposes Phase 5 with `Run Treasury Intelligence Refresh`. Browser DOM verification confirmed the Phase 5 panel renders, runs from the UI, populates treasury/liquidity/opportunity/cross-chain/audit data, and keeps autonomous treasury actions, withdrawals, wallet signing, live order endpoints, and bridge/transfer endpoints disabled.
- Phase 6 adds `Production Trading Command Center`: controlled production spot execution infrastructure for Binance, Coinbase Advanced, Kraken, OKX, and Bybit. It adds a separate encrypted production vault at `~/EtherealAI_Secrets/exchange-production-vault.json`, production credential save/delete/test routes, scoped approval records, dry-run previews, gated one-order placement, order status refresh, cancel lifecycle, real-fill/result ledger, emergency stop, and audit events. Phase 6B adds `Live Trading Activation Wizard` above the raw command center so the owner can click `Start Live Setup Safely`, choose one exchange, see official key instructions, save a restricted key to the production vault, test authenticated account reads, verify withdrawals disabled, run the production dry-run, and prepare a locked tiny live test path without developer workflows. Phase 6C adds `Real Credential Verification And Dry-Run Proof`, recommends Kraken first, verifies real encrypted-vault credentials through authenticated read-only account calls, reads permission/balance/fee/symbol/rate/market proof where available, writes no secret values to the browser, and runs a no-order production dry-run proof before tiny-live eligibility. Phase 6D adds `Kraken Authenticated Readiness And Tiny Live Test Framework`: it reads Kraken balances/API-key info/pair rules/fees/system status/open-order metadata where allowed, blocks unsafe keys, prepares a one-order/no-loop/no-scaling tiny-live framework, validates exact production preflight, shows an expected fill/fee/slippage/balance preview, supports an arm phrase, and adds a Phase 6D emergency stop. Phase 6E adds `Real Kraken API Key Connection Walkthrough`: it shows the exact Kraken steps and permissions, saves only to the encrypted production vault, never redisplays secrets, supports key delete/rotate, verifies Kraken credentials, runs no-order dry-run proof, and shows `Not ready`, `Verified but dry-run missing`, `SAFE READY FOR OPTIONAL TINY LIVE TEST`, or `Blocked because unsafe permission detected`. Phase 6F adds `First Authenticated Kraken Connection And Tiny Live Eligibility`: it verifies the saved Kraken key live, classifies invalid signature/IP restriction/missing permission/unsafe permission issues, proves balance and market metadata reads, builds a no-order tiny live preview, and shows a green `SAFE READY FOR OPTIONAL TINY LIVE TEST` owner card once Kraken auth, no-order preview, permission safety, and endpoint-lock proof pass. Kraken-specific sandbox evidence is no longer shown as a Simple Mode blocker after authenticated dry-run/preview proof passes; balance and minimum-size issues remain final order gates, not setup failures. The Simple Mode owner path now adds one giant `Start Kraken Live Setup Walkthrough` button that consolidates the real Kraken action sequence: create restricted spot key, confirm withdrawals/transfers off, confirm margin/futures/leverage off, save key safely, verify connection, dry-run proof, and tiny live eligibility. Browser verification for Phase 6C saved `/Users/ethereal/Desktop/etherealai-phase6c-real-credential-proof.png`; Phase 6D browser verification saved `/Users/ethereal/Desktop/etherealai-phase6d-tiny-live-framework.png` after confirming readiness/preflight block safely without a key and endpoint status stays locked. Phase 6E browser verification saved `/Users/ethereal/Desktop/etherealai-phase6e-kraken-key-walkthrough.png`; Phase 6F browser verification saved `/Users/ethereal/Desktop/etherealai-phase6f-kraken-authenticated-eligibility.png`; unified Kraken walkthrough verification saved `/Users/ethereal/Desktop/etherealai-kraken-live-setup-walkthrough.png`; final safe-ready verification saved `/Users/ethereal/Desktop/etherealai-kraken-safe-ready-tiny-live.png`. Unrestricted autonomous trading, background live loops, multi-leg autonomous execution, withdrawals, wallet signing, margin, futures, leverage, and production endpoint calls without all gates remain disabled.
- Kraken Authentication Diagnostics now lives inside the unified Kraken walkthrough. It adds `GET /api/v1/live-trading-launch/kraken-auth-diagnostics/status` for local vault/nonce/signature checks and `POST /api/v1/live-trading-launch/kraken-auth-diagnostics/raw-balance` for a raw Kraken `/0/private/Balance` test only. The panel shows API key/secret presence, nonce generation, signature generation, exact Kraken response code/body, whether the request reached Kraken, redacted key/secret/signature fingerprints, whitespace/newline/base64 checks, encrypted-vault round-trip metadata, and failure classification. Browser verification reached Kraken with no order endpoint, returned HTTP `200` and exact body `{"error":["EAPI:Invalid key"]}`, and flagged that the decrypted API key and secret fingerprints currently match. Screenshot saved `/Users/ethereal/Desktop/etherealai-kraken-auth-diagnostics.png`.
- Kraken vault replacement/debug is now explicit. The Live Trading Launch Center shows `Replace Existing Key`, `Delete Saved Credentials`, `Read Vault Fingerprints`, and `Clear Cached Auth State`. Saving a key clears old Phase 6D/6E/6F readiness and auth diagnostics, verifies encrypted vault overwrite by reading the vault back, logs current API-key and secret fingerprints separately, and forces future Verify/raw Balance diagnostics to load current vault values only. Browser verification saved `/Users/ethereal/Desktop/etherealai-kraken-vault-replacement-debug.png`; a fake-reference vault proof confirmed fingerprints change on replacement and the fake entry deletes cleanly.
- The same Bots section keeps advanced bot records and evidence exports behind a collapsible `Advanced Bot Records and Evidence Exports` panel, including the automated bot capability path backed by `/api/v1/bot-automation-capability-path`.
- `/strategy-lab#risk-profile-configuration` is the non-coder Risk Profile Configuration panel. It has safe paper defaults, editable max order/position/daily-loss/open-trade limits, Current Profile Status, Save Risk Profile, Activate Profile, Kill Switch off guidance, and Verify Paper Risk Gate wired to the owner setup gate verifier.
- `/api/v1/system-memory` includes `ownerEvidence`, `ownerAcceptance`, `botAutomationCapabilityPath`, owner proof surfaces for the owner proof packet, dashboard readiness, MVP test pass, Owner Setup Wizard, Operator Control, Mac Security Lockdown, route inventory, Strategy Lab, Social Ops, and Solidity Lab, export-surface references, wallet-control counts/recent events, full-live blocker IDs, and external-surface boundaries for Social Ops, Solidity Lab, owner setup, wallet control, and Mac security.
- Social Ops remains local draft-only: no public posting endpoint and no social network API calls.
- Solidity Lab remains local scaffold/review only: no mainnet/testnet broadcast and no wallet private-key acceptance.
- Solidity Lab now includes a local Token Ecosystem Studio backed by `/api/v1/solidity-ecosystem/catalog` and `/api/v1/solidity-contracts/:id/ecosystem-blueprint`. It plans token/NFT utility, website sections, whitepaper templates, logo briefs, Discord/Telegram/YouTube/Medium/X/docs campaigns, CoinMarketCap/CoinGecko readiness, chain-builder options, node research, and cross-chain arbitrage architecture without deploying, posting, handling wallet keys, or placing trades.
- Polygon is now first-class in the Token Ecosystem Studio. The catalog and blueprints include Polygon chain ID `137`, PolygonScan evidence, Polygon wallet/RPC boundaries, QuickSwap/Uniswap/Sushi route planning, Polygon trading/arbitrage research gates, and a Polygon launch-default button in Solidity Lab.
- Social Ops now has a Token Community Manager workflow backed by `/api/v1/social-posts/token-projects/:id/listing-campaign-drafts`. It creates local CMC/CoinGecko evidence/community campaign drafts for X, Discord, Telegram, YouTube, Medium, docs, Reddit, and Farcaster while blocking public posting and listing submission.
- Token creation is now multi-chain in planning mode. Solidity Lab has a Target Blockchain field with Base, Polygon, BNB Chain, Avalanche, Solana, Arbitrum, Optimism, Ethereum, Fantom/Sonic, TRON, Sui, Aptos, Cosmos SDK/IBC, Polkadot/Substrate, NEAR, Bitcoin L2, and custom-chain options. The ecosystem blueprint distinguishes EVM/Solidity, Solana SPL/Token-2022, Cosmos/CosmWasm, Substrate/ink, NEAR, Move chains, TRON, Bitcoin L2, and custom-chain implementation lanes.
- Global CEO/operator UX shell added: home and dashboard now organize the system around Mission Control, Setup Wizard, Strategy Builder, Paper Trading Center, Bot Control Center, Wallet & Funding Center, Security Lockdown Center, and Advanced / Developer Tools. A global `What do I do next?` assistant runs on protected operator pages and recommends the safest next action from local readiness, setup, bot, wallet, security, and health APIs without enabling live execution.
- Global Day/Night brand theme added in `app/client/styles.css`. It defaults to system/browser preference through `prefers-color-scheme`, exposes future `data-theme="day"` / `data-theme="night"` override hooks, and uses semantic CSS variables for EtherealAI pink, dark purple, black, white, blue, surfaces, text, borders, and status colors. The Safe Paper Simulation page now has a final night-contrast lock for completed cards, metric cards, warnings, inputs, and textareas after a strategy run. The bottom-right next-action panel now uses semantic status classes and amber styling for recommended next actions instead of red danger styling.
- The uploaded EtherealAI logo is now stored at `app/client/public/brand/etherealai-logo.png` and used as a restrained brand mark in the public header, login/signup screens, Simple Operator Mode workspace header, and operator mode bar. It should remain a quiet identity mark, not a repeated decorative element.
- Simple Operator Mode is now the default UX layer on the main app pages. It shows a large page-specific operator workspace, one primary action, plain-English status tiles, simplified task cards, and a `Show me how` dropdown with `Show me in text` and `Show me in video`. Advanced Developer Mode is explicitly available for raw logs, JSON, route tables, archived/debug records, IDs, internal gates, diagnostics, and developer filters.
- Setup Wizard Simple Mode now presents a Beginner Owner Setup experience. It says local paper trading is complete, treats market data providers, exchange APIs, social/API integrations, GitHub, Cloudflare, Polygon provider keys, and similar credentials as optional future integrations, routes public wallet setup through the visible `Add Public Wallet` form instead of hidden `.env` discovery, and keeps raw variable names/missing credential lists in Advanced Developer Mode only.
- Owner setup state now exposes `coreSetup` and `local_paper_trading_ready`. Paper trading is complete when the local server is healthy, one active paper schedule or completed paper run exists, one active paper risk profile exists, live trading is disabled, and wallet signing is disabled. Optional API/provider/social/cloud credentials are marked non-blocking and no longer send `What do I do next?` back into Polygon/provider setup.
- Simple Operator Mode now has a stronger app-wide beginner shell. Every main page renders `What is this?`, `Is it ready?`, `What should I do next?`, a clear recommended action, and a `Guided Workflow` with one visible button per step. Legacy panels are hidden by default, and clicking a Simple Mode workflow step reveals only the targeted panel as guided focus. Raw model output, JSON, comparison tables, archived records, filters, and compact developer details stay hidden unless Advanced Developer Mode is intentionally opened.
- Added `/operator-manual` as the Start Here / Operator Manual page. It covers Mission Control, Setup Wizard, Strategy / Paper / Bots, Wallet & Funding, Security, Solidity/Social/Creator usage, wallet-secret safety, optional integrations, live-lock rules, and normal operation without terminal commands.
- Added `/operator-training` as the Operator Training Library. It provides ordered beginner modules for Start EtherealAI, Read Mission Control, Complete Setup Wizard, Add Wallet Metadata Safely, Review Security, Use Proof Packet, Confirm MVP Test Pass, Review Route Inventory, Use Creator Agent, Build and Paper Test Strategy, Use Solidity Lab, and Use Social Ops. Each module includes text guidance, video-style placeholders, chapter narration, exact click instructions, pause-and-verify moments, replay controls, transcripts, and safety reminders that live trading and wallet signing stay locked.
- Current verification command:

```bash
ETHEREALAI_VERIFY_SERVER=1 \
ETHEREALAI_BASE_URL=http://127.0.0.1:3000 \
ETHEREALAI_TEST_EMAIL='<owner-login>' \
ETHEREALAI_TEST_PASSWORD='<owner-password>' \
npm test
```

## Latest Build Additions

- Phase 5 autonomous treasury and liquidity intelligence added:
  - Added `app/server/src/lib/exchange-treasury-liquidity-intelligence.js`.
  - Added `treasury_intelligence_runs` and `treasury_intelligence_events` tables.
  - Added `GET /api/v1/live-trading-launch/phase5/status`.
  - Added `POST /api/v1/live-trading-launch/phase5/treasury-command-center`.
  - Added the `/live-trading-launch` Phase 5 operator panel with AI mode, planning capital, reserve/concentration controls, `Refresh Treasury Status`, `Run Treasury Intelligence Refresh`, `Emergency Capital Freeze / Keep Locked`, treasury cards, liquidity dashboard, opportunity ranking board, cross-chain status, capital allocation heatmap, risk/exposure dashboard, and AI decision audit.
  - Added Simple Operator Mode coverage for Phase 5 so `/live-trading-launch` exposes both the Phase 4 and Phase 5 operator panels without opening Advanced Developer Mode.
  - Added automated verifier coverage for Phase 5 module safety boundaries, UI strings, styles, routes, schema, server wiring, route-registration wiring, and Simple Mode visibility.
  - Verified with `npm test`, `git diff --check`, direct authenticated Phase 5 status API check, and Browser DOM interaction. Browser clicked `Run Treasury Intelligence Refresh`; the page populated treasury/liquidity/opportunity/cross-chain/audit data and still showed autonomous treasury actions, withdrawals, and wallet signing disabled.
  - Safety preserved: autonomous treasury actions disabled, unrestricted autonomous scaling disabled, leverage disabled, futures disabled, withdrawals disabled, wallet signing disabled, live order endpoints disabled, and bridge/transfer endpoints disabled.
- Phase 4 multi-exchange controlled arbitrage expansion added:
  - Added `app/server/src/lib/exchange-live-arbitrage-command.js`.
  - Added `live_arbitrage_command_runs` and `live_arbitrage_command_events` tables.
  - Added `GET /api/v1/live-trading-launch/phase4/status`.
  - Added `POST /api/v1/live-trading-launch/phase4/command-center`.
  - Added the `/live-trading-launch` Phase 4 operator panel with `Refresh Command Center`, `Run Multi-Exchange Scan`, `Emergency Stop / Keep Live Locked`, spread heatmap, opportunity queue, exchange health, capital allocation, risk dashboard, and recovery controls.
  - Added Simple Operator Mode config for `/live-trading-launch` so the page no longer falls back to the Mission Control wrapper and no longer hides Phase 4 by default.
  - Added automated verifier coverage for Phase 4 module safety boundaries, UI strings, styles, routes, schema, server wiring, and Simple Mode visibility.
  - Verified with `npm test`, `git diff --check`, direct authenticated Phase 4 status API check, and Browser DOM interaction. Browser clicked `Run Multi-Exchange Scan`; the page populated spread heatmap/opportunity data and still showed multi-leg live execution locked.
  - Safety preserved: multi-leg live execution disabled, unrestricted autonomous scaling disabled, leverage disabled, margin disabled, futures disabled, withdrawals disabled, wallet signing disabled, and no Phase 4 order endpoint enabled.
- CEO/operator interface pass: Home is now Home / Mission Control with dynamic status cards for system health, paper trading, full E2E readiness, live execution, wallet status, security status, active bots, blocked gates, and next recommended action.
- Dashboard is now Mission Control with a main operating-area map, a global `What do I do next?` button, and advanced/developer model, memory, GitHub, MLX, and raw diagnostic panels moved behind a collapsed Advanced / Developer Tools section.
- Strategy Lab is now Strategy, Paper Trading, and Bot Control with an operator workflow map, Strategy Builder safe paper example, existing Risk Profile Configuration, existing Bot Operator Wizard, and an Advanced / Developer Tools hub for raw research/evidence surfaces.
- Wallet, setup, security, and navigation copy were simplified to Wallet & Funding Center, Setup Wizard, Security Lockdown Center, Strategy / Paper / Bots, and Advanced / Developer Tools while keeping the same protected routes and safety boundaries.
- New client script `app/client/js/operator-next-action.js` powers the global next-action assistant. It reads only local protected APIs and prioritizes login, live-safety review, security fixes, paper setup completion, local paper operation, and Mission Control. Optional provider/API/social/cloud gates are ignored as required next actions once `coreSetup.paperTradingOperational` is true.
- New client script `app/client/js/operator-training.js` powers the shared training catalog, text/video walkthrough modal, operator training library renderer, transcripts, placeholder video asset plans, and chapter controls.
- New client script `app/client/js/operator-mode.js` powers Simple Operator Mode, Advanced Developer Mode, page-specific guided workflows, hidden advanced clutter, and the global training dropdown integration.
- Automatic local-model routing now supports `auto`, choosing planner, coder, or autocomplete from prompt intent.
- Local model runtime now supports provider-aware routing. The default provider remains Ollama, an optional MLX/OpenAI-compatible lane is configured at `http://127.0.0.1:8080/v1`, and `/api/v1/local-model/benchmark` plus the Dashboard benchmark panel can compare role-default, Ollama, and MLX responses.
- The app-level coder role in `config/local-models.json` now targets `qwen3.6:35b-a3b` with `think:false`. `qwen3.6:35b-a3b` and fallback `qwen3-coder-next:latest` have both been pulled into Ollama on this Mac.
- Local model cleanup removed unused Ollama models `qwen2.5-coder:32b`, `qwen2.5-coder:7b`, and `qwen:latest`. Current Ollama inventory is `qwen3.6:35b-a3b`, `qwen3-coder-next:latest`, `deepseek-r1:70b`, and `llama3:latest`.
- MLX-LM is installed and `mlx-community/Qwen3-Coder-Next-4bit` was downloaded. EtherealAI now has managed MLX lifecycle endpoints and a Dashboard panel for status/start/stop. The start path unloads configured Ollama models before launching MLX for memory isolation. Current managed MLX command uses port `8080`, `max-tokens 512`, and `temp 0`.
- Dashboard has a Memory Snapshot panel backed by `/api/v1/system-memory`.
- Strategy Lab backtests and paper replays now include market-regime tagging.
- Paper replays now include risk gates for drawdown, loss streak, and sample size.
- Exchange connector records, draft order intents, Solidity Lab, and Social Ops have local-only tables, APIs, and pages.
- Secret-shaped fields such as API keys, private keys, and tokens are rejected by connector, order-intent, Solidity, and social-draft endpoints.
- Writer model role added for social/content drafting, using installed `llama3:latest`.
- Solidity Lab can now scaffold a local Hardhat-style workspace and run a template review.
- Solidity Lab can now generate a local token ecosystem blueprint for saved specs, including website/whitepaper/roadmap, logo brief, NFT utility, social/community plan, listing-readiness checklist, chain options, multi-chain token standard/build plans, node profitability research model, and cross-chain arbitrage design boundaries.
- Social Ops can generate local AI drafts and advisory review flags.
- Strategy Lab parser now supports MACD cross/histogram rules and Bollinger Band upper/lower rules.
- Strategy Lab arbitrage strategies no longer use freeform indicator parsing. Cross-exchange, cross-DEX, and hybrid DEX/CEX strategies are built from structured fields and produce `structured_arbitrage_route` rules for paper simulation.
- Artifact Browser now includes exchange connectors, order intents, Solidity contracts, and social posts.
- Strategy Lab now has local risk profiles for paper/live limits, including max order value, max position value, max daily loss, max open trades, and kill-switch state. The Risk quick nav lands on the Risk Profile Configuration panel so the owner can complete the `paper_risk_profile_ready` gate without terminal commands.
- Draft order intents can be reviewed against a selected risk profile. Passing and failing risk reviews are stored in the order-intent payload.
- Risk profiles now appear in the Artifact Browser and `/api/v1/system-memory` snapshot.
- Candle backtests and paper replays now create decision logs that record wait, enter, hold, and exit decisions with rule reasons and candle context.
- Decision logs have API lookup, Strategy Lab UI, Artifact Browser inclusion, and `/api/v1/system-memory` recovery.
- Dashboard Dev Server Runs now includes refresh controls and persisted dev-server log notes.
- Strategy Lab now has research-only optimization sweeps for fees, slippage, stop-loss, and take-profit values. Sweeps rank combinations and are stored locally.
- Optimization sweeps appear in Strategy Lab, the Creator Artifact Browser, and `/api/v1/system-memory`.
- Strategy Lab now has research-only split tests that compare in-sample and out-of-sample windows and report return/drawdown drift.
- Split tests appear in Strategy Lab, the Creator Artifact Browser, and `/api/v1/system-memory`.
- Strategy Lab now has research-only rolling walk-forward tests for repeated train/test windows across an imported candle set.
- Walk-forward tests appear in Strategy Lab, the Creator Artifact Browser, and `/api/v1/system-memory`.
- Market data imports now support labels, notes, review/archive status, quality scores, filtered lookup, paginated import lists, paginated candle previews, background import jobs, streaming CSV file uploads, import-job cancellation, failed-job retry controls, failed-source discard, and safe archived-import deletion.
- Market-data providers and scheduled dataset refresh jobs are now implemented with local mock provider generation, manual run, active/paused schedules, automatic due-run polling, refresh-run records, Strategy Lab controls, Artifact Browser links, and `/api/v1/system-memory` recovery.
- Public OHLCV provider adapters now support Coinbase public candles, Binance public klines, and Kraken public OHLC without storing secrets. Public refreshes queue normal import jobs and flow into the same candle-quality and backtest pipeline.
- Provider health checks are available at `POST /api/v1/market-data/providers/:id/health-check` and through Strategy Lab `Health Check` buttons.
- Strategy Lab refresh schedules now expose editable interval and lookback inputs with a per-row `Save` action backed by `PATCH /api/v1/market-data/refresh-schedules/:id`.
- Refresh schedules now have history and archive-only cleanup endpoints. Cleanup keeps the newest schedule imports active and archives older unused imports without deleting candle rows.
- Strategy Lab Bot Automation is now an Operator Wizard first and an advanced records table second. The wizard exposes every required paper gate, visible fix buttons, ready-plan and active-schedule counts, and final `Verify Paper Trading 100%` feedback while separating current paper automation from future live automation blockers.
- Owner Proof Packet and System Memory now include the automated bot capability path, so the owner proof export carries the same paper-automation-ready and future-live-blocked state as Strategy Lab.
- Owner Proof Packet now includes a monitor-only Paper Automation Runbook with owner steps to review ready paper plans, activate or review paper schedules, inspect the latest paper run, export local evidence, record local MVP acceptance, and keep live actions blocked.
- Dashboard, MVP Test Pass, and Owner Proof Packet now show a Completion Ledger explaining that MVP `99%` waits on owner acceptance, local paper `95%` waits on active paper schedule review, and full live `72%` is capped by intentionally blocked live-execution gates.
- MVP Test Pass now exports a local owner evidence manifest JSON snapshot with a `sha256` checksum.
- MVP Test Pass now shows an Owner Acceptance Record panel backed by `/api/v1/owner-acceptance`, so the owner can see whether final local MVP acceptance has been recorded without leaving the test-pass page.
- Owner Proof Packet added at `/owner-proof-packet` and `/api/v1/owner-proof-packet` with a local JSON export for owner-test gate status, owner acceptance pending status, recent local acceptance records, readiness, proof surfaces, route safety, blocked live gates, and a SHA-256 packet checksum.
- Dashboard System Memory export now includes owner-evidence references, owner acceptance pending status, and external-surface boundaries.
- Home, authenticated work pages, Social Ops, and Solidity Lab now show explicit proof/local-only status cues.
- Route Inventory marks Social Ops as `local_drafts_no_external_posting` and Solidity Lab as `local_scaffold_no_deployment`.
- Route Inventory now cross-checks Owner Proof Coverage, owner acceptance pending status, and local acceptance record count from System Memory beside route safety counts.
- Operator Control Center added at `/operator-control` with APIs `/api/v1/operator-control-center`, `/api/v1/wallets`, `/api/v1/wallets/:id`, `/api/v1/wallets/:id/readiness`, `/api/v1/wallets/:id/revoke`, and `/api/v1/wallet-permission-events`. It creates `owner_wallets` and `wallet_permission_events` records, rejects wallet secrets, supports multi-chain wallet metadata, scopes permissions per wallet/project, and keeps signing/live execution disabled.
- Operator Control Center now has Owner Key Takeover Mode templates for Trading Research, Token Deployment, Treasury, and Recovery. These fill safe defaults while leaving wallet keys outside EtherealAI.
- Mac Security Lockdown added at `/security-lockdown` with APIs `/api/v1/mac-security/audit` and `/api/v1/mac-security/guide`. The audit checks FileVault, firewall, stealth mode, block-all incoming mode, Gatekeeper, SIP, automatic updates, local admin accounts, SecureToken classification, MDM enrollment, user crontab, system extensions, remote access, AirDrop, Handoff, Wi-Fi DNS, Wi-Fi proxy state, password-after-sleep, process/resource activity, outbound connections, startup persistence folders, listening TCP services, and EtherealAI bind host without inspecting secrets or mutating privileged settings.
- Mac Security Lockdown now includes suspected admin/kernel compromise handling and clean-room recovery guidance: do not use a suspect Mac for wallet signing, banking, or credential rotation; preserve evidence; selectively back up owner-created data only; avoid migrating apps/profiles/extensions/startup items; and use full erase/reinstall or Apple silicon DFU restore/revive from a clean second Mac when firmware or system-volume integrity is in doubt.
- Safe user-level Mac hardening applied in this session: immediate password after sleep/screensaver, AirDrop disable preference, Handoff advertising/receiving disabled, Wi-Fi DNS set to Cloudflare/Quad9, Wi-Fi proxies confirmed off, SSH file permissions tightened, `.DS_Store` writes disabled for network/USB volumes, Apple personalized advertising disabled, visible filename extensions, and Finder extension-change warnings. Owner-approved admin hardening also disabled firewall auto-allow for signed built-in/downloaded apps, disabled the Remote Login/SSH launch service, and disabled the Remote Apple Events launch service. Safari safe-download auto-open could not be changed by `defaults` due container preference write restrictions and remains a manual browser setting.
- EtherealAI server startup now binds to `127.0.0.1` by default through `ETHEREALAI_HOST`, reducing LAN exposure of the dashboard.
- Owner proof surfaces now include `operator_control_wallets` and `mac_security_lockdown`; route inventory marks wallet control as `metadata_only_no_wallet_secrets` and Mac security as `read_only_local_mac_audit_no_privileged_mutation`.
- Chain-neutral token infrastructure now treats Polygon as one selectable target chain, not the system default. Solidity Lab and Social Ops support Polygon operating profile, chain ID `137`, PolygonScan evidence, Polygon wallet/RPC no-secret boundary, QuickSwap/Uniswap/Sushi route planning, and workspace file `polygon/POLYGON_OPERATING_PROFILE.md` when Polygon is selected.
- CoinMarketCap/CoinGecko support expanded into a compliant application workflow: local official-source packets, phase checklist, platform-specific evidence packets, community growth path, and blocked shortcuts for bribery, duplicate spam, fake volume, fake followers, paid guarantees, impersonation, and inaccurate supply/liquidity claims.
- Social Ops now includes Token Community Manager drafts for token ecosystem projects, with moderation, announcements, support, listing evidence management, and community-operations runbooks. External posting and listing submission remain disabled.
- Owner Setup Wizard added at `/owner-setup` with APIs `/api/v1/owner-setup-wizard`, `/api/v1/owner-setup-wizard/verify/:gateId`, `/api/v1/owner-setup-wizard/paper-verification-run`, and `/api/v1/owner-setup-wizard/env-template`. It gives a plain-English path for a non-coder owner to complete paper setup and full E2E setup readiness without live wallet signing or live trading.
- Owner Setup Wizard now includes visual `.env` file selection. The browser-side picker checks selected file contents locally, hides all secret values, shows only safe public wallet addresses from `OWNER_PUBLIC_WALLET_ADDRESS` or `POLYGON_PUBLIC_WALLET_ADDRESS`, explains that browsers hide the real file path, and separates visual content verification from the server's secure-path check of `~/EtherealAI_Secrets/.env`.
- Owner evidence and Route Inventory now include the `owner_setup_wizard` proof surface and `setup_wizard_no_secret_values_no_live_execution` safety boundary.

## Important Files

- `/Users/ethereal/test-ai-project/package.json`
  - Project metadata and scripts.
  - Current scripts:
    - `npm start` runs `node app/server/src/server.js`
    - `npm run dev` runs `nodemon app/server/src/server.js`

- `/Users/ethereal/test-ai-project/backend/src/server.js`
  - Older Express server path. Keep it for reference for now, but it is no longer the main entry point.

- `/Users/ethereal/test-ai-project/app/server/src/server.js`
  - Main server file.
  - Serves files from `app/client`.
  - Provides authentication, logout, model-role, and health endpoints.
  - Provides protected local model generation and benchmark endpoints at `/api/v1/local-model/generate` and `/api/v1/local-model/benchmark`.
  - Provides protected Creator Agent endpoints under `/api/v1/creator/tasks`.
  - Provides Creator next-step automation at `/api/v1/creator/tasks/:id/advance`.
  - Provides Creator starter project scaffolding at `/api/v1/creator/tasks/:id/scaffold`.
  - Provides approved workspace, Git status/checkpoint, command request, and safe command run endpoints.
  - Provides workspace file browsing and approved file proposal apply endpoints.
  - Provides local-model file proposal generation at `/api/v1/creator/tasks/:id/file-proposals/generate`.
  - Provides a project-wide artifact browser API at `/api/v1/artifacts`.
  - Provides dev-server runtime tracking and logs at `/api/v1/dev-server/status` and `/api/v1/dev-server/logs`.
  - Provides cross-strategy backtest exploration at `/api/v1/backtests`.
  - Provides single backtest lookup at `/api/v1/backtests/:id`.
  - Provides strategy optimization sweeps at `/api/v1/optimization-sweeps` and `/api/v1/strategies/:id/optimization-sweeps`.
  - Provides strategy split tests at `/api/v1/split-tests` and `/api/v1/strategies/:id/split-tests`.
  - Provides strategy walk-forward tests at `/api/v1/walk-forward-tests` and `/api/v1/strategies/:id/walk-forward-tests`.
  - Provides trading decision log lookup at `/api/v1/decision-logs`.
  - Provides single market import lookup at `/api/v1/market-data/imports/:id`.
  - Provides paginated market import lists at `/api/v1/market-data/imports?limit=25&offset=0`.
  - Provides paginated candle previews at `/api/v1/market-data/imports/:id/candles?limit=500&offset=0`.
  - Provides background market-data import jobs at `/api/v1/market-data/import-jobs`.
  - Provides streaming CSV file import jobs at `POST /api/v1/market-data/import-jobs/upload`.
  - Provides market-data import job cancellation at `POST /api/v1/market-data/import-jobs/:id/cancel`.
  - Provides failed market-data import retry at `POST /api/v1/market-data/import-jobs/:id/retry`.
  - Provides failed import source discard at `POST /api/v1/market-data/import-jobs/:id/discard-source`.
  - Provides market import labeling/status management at `PATCH /api/v1/market-data/imports/:id`.
  - Provides archived import cleanup at `DELETE /api/v1/market-data/imports/:id`.
  - Provides market-data provider records at `/api/v1/market-data/providers`.
  - Provides provider connectivity checks at `POST /api/v1/market-data/providers/:id/health-check`.
  - Provides scheduled market-data refresh jobs at `/api/v1/market-data/refresh-schedules`.
  - Provides refresh schedule history at `/api/v1/market-data/refresh-schedules/:id/history`.
  - Provides archive-only refresh duplicate cleanup at `POST /api/v1/market-data/refresh-schedules/:id/cleanup`.
  - Provides refresh-run history at `/api/v1/market-data/refresh-runs`.
  - Provides risk profile endpoints at `/api/v1/risk-profiles`.
  - Provides draft order-intent risk review through `/api/v1/order-intents`.
  - Provides Strategy Lab strategy, placeholder backtest, and market-data import endpoints.

- `/Users/ethereal/test-ai-project/app/client/`
  - Newer frontend folder with `index.html`, `login.html`, `signup.html`, `dashboard.html`, `creator.html`, `styles.css`, `strategy-lab.html`, `solidity-lab.html`, and `social-ops.html`.

- `/Users/ethereal/test-ai-project/config/local-models.json`
  - Local model role/provider config for planner, coder, writer, and autocomplete models.
  - Default provider is Ollama; optional MLX/OpenAI-compatible provider is configured for benchmark testing before promotion.
  - Current coder target is `qwen3.6:35b-a3b` with `think:false`.
  - Current autocomplete target is also `qwen3.6:35b-a3b` with `think:false` so Qwen 2.5 models are no longer required.
  - Fallback/heavy comparison coder is `qwen3-coder-next:latest`.
  - Tested MLX coding model is `mlx-community/Qwen3-Coder-Next-4bit`.
  - MLX lifecycle is configured under `providers.mlx.lifecycle` and is exposed by `/api/v1/local-model/mlx-lifecycle`.

- `/Users/ethereal/test-ai-project/LOCAL_AI_BUILD_PLAN.md`
  - Roadmap for the local-first AI creator system.

- `/Users/ethereal/test-ai-project/.aider.chat.history.md`
  - Saved coding-assistant history. This contains useful project context and the most recent failed edit attempt.

- `/Users/ethereal/test-ai-project/database.sqlite`
  - Local SQLite database.

## Git Status Summary

The repo has existing commits and uncommitted changes. Do not reset or discard anything.

Tracked files currently changed:

- `app/server/src/server.js`
- `backend/src/server.js`
- `components/header.html`
- `package.json`

Tracked files deleted from the old root layout:

- `dashboard.html`
- `index.html`
- `login.html`
- `signup.html`
- `styles.css`

New files/folders include:

- `app/client/dashboard.html`
- `app/client/login.html`
- `app/client/signup.html`
- `app/client/styles.css`
- `app/client/index.html`
- `app/client/creator.html`
- `app/client/strategy-lab.html`
- `database.sqlite`
- `node_modules/`
- `package-lock.json`

## Current Baseline

The project is still in the middle of a folder refactor, but the runnable baseline has been stabilized.

Old frontend files were deleted from the project root and moved into `app/client`. `package.json` now starts the newer server at `app/server/src/server.js`.

The broken nested `/strategy-lab` route has been fixed and moved to its own top-level route.

The dashboard now calls `/api/v1/health` and shows:

- Server status.
- SQLite status.
- Ollama/local model status.
- Model role assignments.

Verified locally:

- Home page returns `200 OK`.
- Login page returns `200 OK`.
- Signup endpoint returns `201 Created`.
- Login endpoint returns `200 OK`.
- Dashboard returns `200 OK` after login.
- Strategy Lab returns `200 OK` after login.
- `/api/v1/health` returns Ollama and model role state after login.
- `/api/v1/local-model/generate` successfully called `qwen2.5-coder:7b` and returned `local model ok`.
- Creator Agent page returns `200 OK` after login.
- `/api/v1/creator/tasks` returns saved Creator Agent plans after login.
- Test Creator Agent task `#1` was created with an audit event.
- Approved workspace `Creator Agent Sandbox` was created at `workspaces/creator-agent-sandbox`.
- Implementation checklist was created for Creator task `#1`.
- Checkpoint record `#1` was saved from Git status.
- Command requests `#1` and `#2` were recorded for `git status`.
- Safe command run `#2` executed `git status` successfully with exit code `0`.
- File proposal `#1` created, approved, and applied `README.md` inside `workspaces/creator-agent-sandbox`.
- Workspace file browsing and file readback verified for `README.md`.
- Strategy Lab now saves strategies to SQLite.
- Strategy `#1` and placeholder backtest `#1` were created and read back successfully before the real engine was added.
- Market data import stubs now save manual OHLCV CSV uploads to SQLite.
- Market data import `#1` was verified with two BTC/USDT `1h` candles and read back successfully.
- Placeholder backtests have been replaced by `candle_backtest_v1`, a first real candle-based research engine.
- Candle backtest `#2` was verified against import `#1` using stop loss, take profit, fees, and slippage.
- Strategy `#2` and candle backtest `#3` verified supported plain-English `green candle` entry and `red candle` exit parsing.
- Strategy Lab now supports RSI threshold rules such as `RSI 5 below 30` and `RSI 5 above 70`.
- Strategy `#3` and candle backtest `#4` verified RSI parsing with no warnings and produced a real trade/metrics result.
- Market data imports now store summary metadata in `summary_json`, including first/last timestamp, close/high/low range, total volume, duplicate timestamps, out-of-order rows, gap count, invalid candle shapes, and warnings.
- Market data import `#4` verified summary warnings with ETH/USDT `1h` data: duplicate timestamp, out-of-order/overlap, and likely timeframe gap.
- Strategy Lab now has a CSV file picker that reads local CSV files in the browser, fills the import textarea, and shows row count and file size before import.
- Server JSON body limit was raised to `25mb` for larger local CSV research imports.
- Market data import `#5` verified the updated import flow with SOL/USDT `1h` data and a clean summary.
- Strategy Lab now renders a backtest comparison table for each selected strategy, showing run ID, mode, import ID, return, drawdown, win rate, trade count, and created time.
- Strategy `#1` detail verified it still returns historical backtests for comparison.
- Owner policy config added at `config/automation-policy.json`.
- Owner policy API verified and auto-approve file proposals is enabled.
- File proposal `#2` started approved under owner policy and applied successfully.
- Creator task detail now includes command run history.
- Creator Agent can now ask a local model to draft a file proposal for an approved workspace.
- File proposal `#3` was generated by `qwen2.5-coder:7b`, auto-approved under owner policy, applied, and read back as `workspaces/creator-agent-sandbox/AI_CODER_SMOKE.md`.
- Creator Agent can now ask a local model to draft a multi-file proposal batch.
- Multi-file proposals `#4` and `#5` were generated by `qwen2.5-coder:7b`, auto-approved under owner policy, applied, and read back as `BATCH_SMOKE_OVERVIEW.md` and `docs/BATCH_SMOKE_STEPS.md`.
- Creator UI now includes an `Apply All Approved` control for applying approved proposal batches from the selected task proposal list.
- Owner-mode low-risk command auto-run is now implemented.
- Command request `#3` for `git status` auto-ran immediately under owner policy and saved command run `#3` with exit code `0`.
- Trusted command prefixes now live in `config/automation-policy.json` and are editable from the Creator UI.
- `node --version` was added through the policy API, then command request `#4` auto-ran and saved command run `#4` with output `v25.9.0`.
- Creator Agent now has project check command templates for Git status, Git diff, server syntax check, Node version, npm test, and npm build.
- Command template `server-syntax` auto-ran `node --check app/server/src/server.js` as command request `#5` and saved command run `#5` with exit code `0`.
- Creator Agent can now generate task checklist items with a local model at `/api/v1/creator/tasks/:id/checklist/generate`.
- Qwen `qwen2.5-coder:7b` generated checklist items `#12` through `#15` for Creator task `#1`.
- Multi-file proposal batches now append linked checklist items automatically.
- Proposal `#6` generated `CHECKLIST_LINK_SMOKE.md`, appended checklist items `#16` through `#18`, was applied, then `server-syntax` command run `#6` passed and those checklist items were marked done.
- Creator task detail now includes `fileProposals` alongside checklist, checkpoints, command requests, command runs, and events.
- Creator UI now has a Task Activity panel showing checklist progress, proposal status counts, command run pass counts, checkpoint counts, and the latest activity timeline.
- Project-wide artifact browser API `/api/v1/artifacts` is now working.
- `/api/v1/artifacts` currently reports: 1 Creator task, 6 file proposals, 6 command runs, 1 checkpoint, 6 backtests, and 6 market-data imports.
- Creator UI now has an Artifact Browser panel showing global counts plus recent file proposals, command runs, checkpoints, backtests, and market imports.
- Creator UI Artifact Browser now has type filtering, text search, checkpoint rows, and JSON export of the filtered artifact set.
- Artifact browser API now supports server-side type filtering, text search, `limit`, `offset`, total counts, and deep-link hrefs.
- Fresh server restart and health check verified on 2026-05-10 with SQLite and Ollama reachable.
- Strategy Lab rule parsing now supports simple multi-condition `and` rules.
- Strategy `#4` and candle backtest `#5` verified `2 consecutive green candles and volume above 2x 3 candle average` entry parsing plus `2 consecutive red candles` exit parsing with no warnings.
- Strategy `#5` and candle backtest `#6` verified moving-average crossover parsing such as `2 SMA crosses above 3 SMA` plus previous-low breakdown exit parsing with no warnings.
- Dev-server runs are now recorded in SQLite in `dev_server_runs`.
- `/api/v1/dev-server/status` verified the current local server as `npm start`, PID `15769`, port `3000`, status `running`.
- Dashboard now shows a Dev Server status card with the command and uptime.
- Dashboard now shows recent dev-server run history from `/api/v1/dev-server/status`.
- Creator page script was syntax-checked after artifact filter/export changes.
- Strategy Lab now has a Backtest Explorer that compares runs across strategies, shows summary stats, filters by symbol, and links directly to focused backtests.
- Strategy Lab now opens artifact hashes such as `/strategy-lab#artifact=backtest:6` and `/strategy-lab#artifact=market-import:6`.
- `/api/v1/backtests` verified all-backtest summary and AVAX/USDT symbol filtering.
- Creator Agent now has `Run Next Safe Step`, backed by `/api/v1/creator/tasks/:id/advance`.
- The advance endpoint can create a checklist, create a checkpoint, apply approved proposals, request verification, or tell the UI it is ready for a file proposal.
- Creator task `#1` advance check verified the current state as `ready_for_file_proposal`.
- Creator scaffold endpoint created workspace `#2` at `workspaces/task-1-build-creator-agent-execution-controls`.
- Scaffold proposals `#7`, `#8`, and `#9` were created as approved files for `README.md`, `package.json`, and `src/index.js`.
- Creator next-step automation applied scaffold proposals `#7` through `#9` and auto-ran command run `#7`, `node --check app/server/src/server.js`, exit code `0`.
- Strategy Lab market import filters, import pagination controls, and candle preview pagination were browser-verified. Import `#6` previews as `Import #6: 1-8 of 8`.
- Background market-data import jobs are implemented with queued/running/completed status, row progress, chunked candle inserts, startup recovery handling, and a Strategy Lab job panel.
- Background import job `#1` verified a LINK/USDT `1h` CSV, completed with `4/4` rows, created market import `#7`, and previewed as `Import #7: 1-4 of 4`.
- Streaming CSV uploads now save files under ignored `market-data-uploads/`, queue a background job, parse line-by-line from disk, then remove the source file after processing.
- Streaming upload job `#2` verified `stream-upload-smoke.csv`, completed with `5/5` rows, created market import `#8`, cleaned the upload folder, and previewed as `Import #8: 1-5 of 5`.
- Strategy `#8` verified matching import selectors across paginated market imports. Backtest, sweep, split test, walk-forward, and paper replay controls all selected import `#8` for `UNI/USDT 1h`.
- Import job cancellation now works for queued/running jobs from the API and Strategy Lab job panel. Large streaming job `#4` was canceled while running, its source upload was deleted, import `#10` was archived, and partial candle rows were cleaned up.
- Failed import jobs now retain local source files/text for retry, expose `retry_available`, and show a `Retry Job` button in Strategy Lab. Job `#5` verified the API and UI retry path, incrementing retry count to `2` while keeping partial imports free of candle rows.
- Failed import source discard is implemented and verified on job `#5`; after discard, retry buttons disappear and retained source files are removed.
- Archived import deletion is implemented with dependency checks and verified by deleting cleanup imports `#10` through `#13`.
- Market-data provider `#1` verified a local mock provider. Manual refresh schedule `#1` generated DOGE/USDT import job `#6` and import `#14` with 12 candles and quality `100`.
- Active refresh schedule `#2` auto-ran through the scheduler, generated SHIB/USDT import job `#7`, and created import `#15` with 6 candles and quality `100`.
- Market providers, refresh schedules, and refresh runs now appear in `/api/v1/artifacts`, `/api/v1/system-memory`, and Strategy Lab artifact deep links such as `/strategy-lab#artifact=refresh-run:2`.
- Coinbase public provider `#2` and paused schedule `#3` were verified with manual refreshes. The pagination-aware path queued import job `#9`, created market import `#17`, and stored 5 live BTC-USD `1h` candles with quality `100`.
- Provider health checks were API-verified for local mock provider `#1` and Coinbase public provider `#2`, then browser-verified through Strategy Lab's `Health Check` button.
- Schedule edit controls were browser-verified on paused Coinbase schedule `#3`; lookback was saved as 6 candles through the Strategy Lab `Save` button.
- Schedule history for Coinbase schedule `#3` reports 2 runs, 2 imports, 1 active import, and 1 archived import. Cleanup kept import `#17` active and archived older duplicate import `#16`; Strategy Lab `History` and `Cleanup` buttons were browser-verified.
- Kraken public provider `#3` was created and health-checked against BTC/USD `1h` candles. It returned 3 candles with quality `100`, and Strategy Lab shows both the `Kraken Public` provider option and saved provider row.

## 2026-05-23 - Phase 2 Read-Only Exchange API Connections

- Added `app/server/src/lib/exchange-readonly-connections.js`.
- Added encrypted local owner-vault support at `~/EtherealAI_Secrets/exchange-readonly-vault.json` with a permission-locked vault key file.
- Added read-only setup guides for Binance, Coinbase, Kraken, OKX, and Bybit.
- Added quote/read-only setup guides for Uniswap, Jupiter, 1inch, GMX, and Hyperliquid.
- Added authenticated APIs:
  - `GET /api/v1/exchange-connectors/read-only/setup-guides`
  - `GET /api/v1/exchange-connectors/read-only/status`
  - `POST /api/v1/exchange-connectors/:id/read-only-credentials`
  - `DELETE /api/v1/exchange-connectors/:id/read-only-credentials`
  - `POST /api/v1/exchange-connectors/:id/read-only-connection-test`
  - `POST /api/v1/exchange-connectors/read-only/price-compare`
- Added Strategy Lab UI:
  - `Connect Read-Only API` wizard
  - per-exchange instructions
  - permissions checklist
  - secure vault save
  - read-only connection test
  - delete saved key
  - read-only price/spread comparison
  - categories for Recommended First, Connected, Not Connected, Optional Later, and Unsupported / Placeholder
- Safety state:
  - No browser storage for API values.
  - No API values in SQLite.
  - No secret values displayed after entry.
  - CEX keys are read-only by design.
  - DEX/aggregator connectors stay quote-only.
  - Live trading, withdrawals, wallet signing, and order endpoints remain locked.
- Verification:
  - `npm test` passed.
  - Static tests now cover the read-only exchange connection module, encrypted vault metadata, UI workflow, routes, and safety boundaries.
  - Browser-verified the Strategy Lab Exchange Connector Manager after server restart.
  - Browser-verified the Binance `Connect Read-Only API` wizard opens with setup instructions, safety checklist, secure vault save, test, and delete controls.
  - Browser-verified `Read-Only Price / Spread Compare` compares BTC/USDT public prices across supported exchanges while reporting market-data-only safety boundaries.
  - Screenshots saved:
    - `/Users/ethereal/Desktop/EtherealAI_ReadOnly_API_Wizard_Open.png`
    - `/Users/ethereal/Desktop/EtherealAI_ReadOnly_Exchange_API_Wizard_Check.png`

## Slowdown Cause To Check

`node_modules/` was not listed in `.gitignore`, so Git/VS Code/assistant tools may scan thousands of dependency files.

This has now been added:

```gitignore
node_modules/
.parcel-cache/
dist/
.env
.env.*
*.sqlite
```

Keep `.aider*` ignored as it already is.

## Suggested Next Steps

## Latest Phase 3C Update: Tiny Live Test Mode

Phase 3C has been implemented as the smallest safe real-money path, but it remains locked unless every safety gate passes and the owner manually confirms.

New backend file and routes:

- Added `app/server/src/lib/exchange-tiny-live-execution.js`.
- Added `GET /api/v1/live-trading-launch/phase3c/status`.
- Added `POST /api/v1/exchange-connectors/:id/tiny-live-credentials`.
- Added `DELETE /api/v1/exchange-connectors/:id/tiny-live-credentials`.
- Added `POST /api/v1/live-trading-launch/phase3c/preview`.
- Added `POST /api/v1/live-trading-launch/phase3c/place`.
- Added `POST /api/v1/live-trading-launch/phase3c/orders/:id/cancel`.
- Added `GET /api/v1/live-trading-launch/phase3c/orders/:id/status`.
- Expanded `POST /api/v1/live-trading-launch/phase3c/emergency-stop` to also hard-lock tiny-live connector flags.

New database tables:

- `tiny_live_order_tests`
- `tiny_live_order_events`

Supported Phase 3C adapters:

- Binance Spot: complete first adapter for one manual tiny spot test.
- Coinbase: prepared/locked.
- Kraken: prepared/locked.
- OKX: prepared/locked.
- Bybit: prepared/locked.

Operator UI:

- `/live-trading-launch` now includes `Phase 3C: Tiny Live Test Mode`.
- The page shows `Safe to test / Not safe to test`, missing gates, ready/not-ready exchange cards, exact next action, and why live trading remains locked.
- The owner can save a tiny-live key to the local encrypted vault, refresh readiness, preview, place one manually approved tiny spot order, track status, cancel, and run emergency stop.
- Preview cannot place an order.
- Place cannot call an exchange order endpoint unless every gate passes and the owner types the exact manual approval phrase.

Safety state:

- Default state remains locked.
- Start scope is one exchange, one symbol, one tiny order, spot only.
- Automated live trading is disabled.
- Wallet signing is disabled.
- Withdrawals are disabled.
- Margin, futures, and leverage are disabled.
- No autonomous scaling or bot-driven live execution exists.
- Tiny-live credentials are stored only in `~/EtherealAI_Secrets/exchange-tiny-live-vault.json`.

Verification completed:

- `npm test` passed.
- `git diff --check` passed.
- Server restarted successfully on `127.0.0.1:3000`.
- Browser verification passed at `http://127.0.0.1:3000/live-trading-launch?v=phase3c`.
- Browser verified that Phase 3C renders locked, the approval center shows missing gates, preview without a tiny-live key is blocked, and preview does not place an order.
- Screenshot saved at `/Users/ethereal/Desktop/EtherealAI_Phase3C_Tiny_Live_Locked_Check.png`.

## Latest Phase 3B Update: Sandbox/Testnet Execution

Phase 3B has been implemented as a sandbox/testnet execution layer while production live trading remains locked.

New backend files and routes:

- Added `app/server/src/lib/exchange-sandbox-execution.js`.
- Added `GET /api/v1/live-trading-launch/phase3b/status`.
- Added `POST /api/v1/live-trading-launch/phase3b/sandbox-test-trade`.
- Added `POST /api/v1/exchange-connectors/:id/sandbox-credentials`.
- Added `DELETE /api/v1/exchange-connectors/:id/sandbox-credentials`.
- Added `POST /api/v1/live-trading-launch/phase3c/emergency-stop`.

New database tables:

- `sandbox_order_tests`
- `sandbox_order_events`
- `live_trading_safety_events`

Supported Phase 3B adapters:

- Binance Spot Testnet: complete adapter for place/status/cancel lifecycle.
- OKX Demo Trading: complete adapter with `x-simulated-trading: 1`.
- Bybit Testnet: complete adapter for place/status/cancel lifecycle.
- Kraken: prepared/manual-docs-required; no general retail spot sandbox is treated as complete yet.
- Coinbase: prepared/manual-docs-required; sandbox auth depends on owner account/API-key type.

Operator UI:

- `/live-trading-launch` now includes `Phase 3B: Sandbox/Testnet Execution`.
- Simple action: `Run Sandbox Test Trade`.
- Optional vault panel: `Save Sandbox/Testnet API Key`.
- Phase 3C preparation: tiny-live-test checklist, emergency stop, audit log, rollback/disable-live-connectors action.

Safety state:

- Production live trading is still locked.
- Wallet signing is still disabled.
- Withdrawals are still disabled.
- No unrestricted production order endpoint is exposed. Phase 3C adds only a later manually confirmed tiny spot-test path.
- Sandbox credentials are stored only in `~/EtherealAI_Secrets/exchange-sandbox-vault.json`.
- If sandbox safety checks fail, no exchange order endpoint is called.

Verification completed:

- `npm test` passed.
- `git diff --check` passed.
- Browser verification passed at `http://127.0.0.1:3000/live-trading-launch?v=phase3b`.
- Browser verified that `Run Sandbox Test Trade` rejects safely without sandbox credentials and explains the missing key.
- Screenshot saved at `/Users/ethereal/Desktop/EtherealAI_Phase3B_Sandbox_Test_Check.png`.

1. In VS Code, use `File > Save All`.
2. Do not close VS Code until all tabs are saved.
3. Restart Continue or VS Code so the updated `~/.continue/config.yaml` model roles load.
4. Run the app with `npm start` or `npm run dev`.
5. Open `http://localhost:3000`.
6. Test:
   - `/`
   - `/login`
   - `/signup`
   - `/dashboard`
   - `/creator`
   - `/strategy-lab`
   - `/api/v1/health`
   - `/api/v1/dev-server/status`
   - `/api/v1/workspaces`
   - `/api/v1/git/status`
   - `/api/v1/creator/tasks/1`
   - `/api/v1/creator/tasks/1/advance`
   - `/api/v1/creator/tasks/1/scaffold`
   - `/api/v1/creator/tasks/1/checklist/generate`
   - `/api/v1/creator/tasks/1/file-proposals/generate`
   - `/api/v1/creator/tasks/1/file-proposals/generate-batch`
   - `/api/v1/artifacts`
   - `/api/v1/command-requests`
   - `/api/v1/command-templates`
   - `/api/v1/policy`
   - `/api/v1/market-data/imports`
   - `/api/v1/market-data/import-jobs`
   - `/api/v1/market-data/import-jobs/1`
   - `/api/v1/market-data/providers`
   - `/api/v1/market-data/providers/1`
   - `POST /api/v1/market-data/providers/1/health-check`
   - `/api/v1/market-data/refresh-schedules`
   - `/api/v1/market-data/refresh-schedules/2`
   - `/api/v1/market-data/refresh-schedules/3/history`
   - `POST /api/v1/market-data/refresh-schedules/3/cleanup`
   - `/api/v1/market-data/refresh-runs`
   - `/api/v1/market-data/refresh-runs/2`
   - `POST /api/v1/market-data/import-jobs/upload`
   - `POST /api/v1/market-data/import-jobs/4/cancel`
   - `POST /api/v1/market-data/import-jobs/5/retry`
   - `POST /api/v1/market-data/import-jobs/5/discard-source`
   - `DELETE /api/v1/market-data/imports/10`
   - `/api/v1/market-data/imports/6`
   - `/api/v1/market-data/imports/4/candles`
   - `/api/v1/market-data/imports/5/candles`
   - `/api/v1/backtests`
   - `/api/v1/backtests/6`
   - `/api/v1/market-data/imports/6/candles`
   - `/api/v1/strategies/5`
   - `/api/v1/strategies/4`
   - `/api/v1/strategies/3`
   - `/api/v1/strategies/2`
7. Continue from `LOCAL_AI_BUILD_PLAN.md`.

## Prompt For A New Chat

Use this prompt in a new ChatGPT/Codex session:

```text
I am not a coder. Please help me continue building EtherealAI without losing work.

Project folder:
/Users/ethereal/test-ai-project

First, inspect the files and Git status. Do not reset, delete, or discard anything. EtherealAI is now running from app/server/src/server.js with protected app/client pages, including /dashboard, /owner-setup, /operator-control, /security-lockdown, /owner-proof-packet, /mvp-test-pass, /strategy-lab, /creator, /server-route-inventory, /solidity-lab, and /social-ops. node_modules is ignored in .gitignore. Read ONBOARD_MEMORY.md, PROJECT_HANDOFF.md, MVP_OWNER_TEST_PASS.md, and LOCAL_AI_BUILD_PLAN.md before adding major features.

Please:
1. Save/preserve the current work.
2. Run the app and verify the current baseline.
3. Continue building the local-first AI creator system from LOCAL_AI_BUILD_PLAN.md.
4. Explain what changed in plain English.
```
