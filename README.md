# EtherealAI

EtherealAI is a local-first AI builder, strategy research lab, Solidity/token ecosystem studio, and automation control center.

Codex Build.

The current project is intentionally designed for owner-controlled local operation. It can draft plans, code scaffolds, social content, strategy research, token ecosystem blueprints, and paper automation workflows, but it does not execute live trading, external posting, wallet signing, blockchain deployment, or domain/account purchases.

## Current Stack

- Node/Express server with protected local routes
- SQLite local database
- Browser client pages under `app/client`
- Local model routing through Ollama roles
- MLX lifecycle lane for Apple Silicon optimized local inference
- Qwen3.6 coder/autocomplete role
- DeepSeek planner role
- Local-only multi-agent coordination layer
- Owner proof packet, MVP readiness, route inventory, system memory, and safety checks

## Key Pages

- `/dashboard` - Mission Control for system health, readiness progress, live-lock status, wallets, security, active bots, blocked gates, next action, model roles, MLX lifecycle, multi-agent coordination, and system memory
- `/operator-manual` - Start Here / Operator Manual for beginner operation, safety rules, wallet handling, paper trading, and page-by-page usage without terminal commands
- `/operator-training` - Operator Training Library with ordered text guides, video-style walkthrough placeholders, chapters, transcripts, exact click instructions, and pause-and-verify moments for every major operator tab
- `/owner-setup` - Beginner Owner Setup for reaching `Local E2E Complete` without live trading, wallet signing, or external provider keys; optional `.env`, exchange, GitHub, Cloudflare, social, and chain-provider integrations stay in Future Integrations / Advanced Mode
- `/operator-control` - Wallet & Funding Center for wallet metadata, owner key-control guidance, permissions, project assignment, and revoke workflows
- `/security-lockdown` - Security Lockdown Center for read-only Mac/network security audit, local attack-surface review, and owner hardening checklist
- `/owner-proof-packet` - local proof packet, owner acceptance, live-blocker evidence
- `/mvp-test-pass` - owner test pass and evidence checklist
- `/server-route-inventory` - Advanced / Developer Tools for route map, safety boundaries, raw evidence, and developer checks
- `/creator` - local AI builder workflow
- `/strategy-lab` - Strategy, Paper Trading, and Bot Control for strategy research, one-click safe paper simulation, paper automation, safety controls, non-coder Risk Profile Configuration, and advanced bot records hidden behind Developer Mode
- `/solidity-lab` - token, NFT, website, whitepaper, chain, and ecosystem planning
- `/social-ops` - local-only social/community draft workflows

Every protected operator page now loads the global `What do I do next?` assistant. It checks the local owner setup, readiness, bot automation, wallet, security, and health APIs, then recommends the safest next action in plain English without enabling live trading or wallet signing. Optional provider/API credentials do not become required next actions once Local E2E is complete.

## Operator Experience

EtherealAI now defaults to **Simple Operator Mode**. This mode shows large readable task cards, one primary action, plain-English status, and a `Show me how` dropdown on each main page with `Show me in text` and `Show me in video`. Raw IDs, logs, JSON, archived records, debug tables, route diagnostics, and technical filters remain available through **Advanced Developer Mode**, but they are hidden during normal CEO/operator use.

The app now uses a polished automatic Day/Night brand theme based on system/browser preference. The shared CSS variables use EtherealAI colors: pink, dark purple, black, white, and blue. Day mode uses a near-white surface with a subtle pink tint; night mode uses dark purple/near-black surfaces with soft off-white text. Status colors are semantic across the app: green for safe/ready/complete, red only for blocked/danger/fix-now, amber for next steps or attention, and blue/purple for neutral information and navigation.

Simple Operator Mode now renders the same beginner structure across Mission Control, Setup Wizard, Strategy / Paper / Bots, Wallet & Funding, Security, Solidity Lab, Social Ops, Creator Agent, and the Operator Manual:

- What is this?
- Is it ready?
- What should I do next?
- What button do I click?
- Guided Workflow with one visible button per step

Legacy forms, raw tables, archived records, filters, JSON output, route diagnostics, and internal evidence stay hidden until Advanced Developer Mode is intentionally opened. When a Simple Mode workflow step needs an existing form, EtherealAI reveals only that specific panel as a guided focus instead of exposing the whole developer dashboard.

The Setup Wizard now reports `Local E2E Complete` when the local server is healthy, a paper schedule or completed paper run exists, an active paper risk profile exists, public wallet metadata exists, live trading is disabled, and wallet signing is disabled. Live E2E is shown separately as locked for future owner-approved security work. Polygon, Base, Ethereum, BNB, Avalanche, Solana, and future chains are selectable per project, token, strategy, or wallet; no blockchain is the system default. Chain-provider, exchange, GitHub, Cloudflare, and social API credentials are optional future integrations in Simple Mode. Public wallet addresses are added directly through the UI with `Add Public Wallet`; the `.env` file is only for optional API keys and later integrations.

The Operator Training Library covers Home, Setup Wizard, Wallet & Funding, Security, Proof Packet, MVP Test Pass, Route Inventory, Creator Agent, Strategy / Paper / Bots, Solidity Lab, and Social Ops. Each module explains page purpose, buttons, fields, what not to enter, operating order, safe defaults, plain-English errors, success state, and the live-trading/wallet-signing safety boundary. Video mode currently provides in-app placeholder players, asset plans for later rendered videos, chapter narration, exact click instructions, replay controls, and transcripts.

Strategy / Paper / Bots now exposes the Simple Mode action `Run This Strategy Safely`. After the owner saves or opens a strategy, this one button creates or reuses the safe paper session, active safe risk profile, local paper connector, ready paper plan, active local schedule, verifier, and paper run. If no matching market data exists yet, EtherealAI creates clearly labeled local sample candles so the operator can verify the workflow without exchange APIs or terminal commands. Results show running status, simulated trades, P/L, spread/cost assumptions, fees/slippage, entry/exit reasons, strategy health, and warnings. Live trading, wallet signing, exchange orders, token deployment, and external posting remain disabled.

Strategy Lab now has a dedicated structured arbitrage lane for `Cross-Exchange Arbitrage`, `Cross-DEX Arbitrage`, and `Hybrid DEX/CEX Arbitrage`. These strategies use structured fields for buy venues, sell venues, arbitrage type, spread, fees, slippage, liquidity, latency, simultaneous execution, stablecoin pair, and token whitelist. EtherealAI does not try to translate advanced arbitrage paragraphs through the indicator parser; the paper engine generates machine-readable arbitrage rules and simulates local fee/slippage/liquidity/latency-aware buy/sell routes without live venue calls, wallet signing, or order placement.

## Run Locally

```bash
npm install
npm start
```

Open:

```text
http://127.0.0.1:3000
```

## Verify

Static/local verification:

```bash
npm test
```

Authenticated verification:

```bash
ETHEREALAI_VERIFY_SERVER=1 \
ETHEREALAI_BASE_URL=http://127.0.0.1:3000 \
ETHEREALAI_TEST_EMAIL='<local-owner-login>' \
ETHEREALAI_TEST_PASSWORD='<local-owner-password>' \
npm test
```

## Safety Boundaries

The following are blocked by design:

- Live trading
- Live exchange order execution
- Exchange credential loading
- Wallet/private-key handling
- External social posting
- Domain or external account purchases
- Solidity/token deployment
- Blockchain deployment
- CoinMarketCap/CoinGecko external submission automation; local evidence packets, official-form checklists, and owner-reviewed application drafts are supported
- Hermes Agent bypass of EtherealAI gates

## Multi-Agent Coordination

The local multi-agent layer includes:

- Planner Agent
- Coding Agent
- Quant Agent
- Solidity Agent
- Social Agent
- Infrastructure Agent
- Validator Discovery Agent
- Treasury Agent
- Safety And Compliance Agent

Coordination runs are saved locally in SQLite. Plan-only mode records agent plans without model calls. Local model draft mode can run a bounded 1-3 agent draft through the current local model stack, including the MLX fast lane.

Hermes Agent is treated as an optional benchmark lane only. It is not installed, launched, or allowed to bypass EtherealAI safety gates without owner approval.

## GitHub Publishing Notes

Before publishing, confirm the target GitHub owner/repository. This workspace is configured for the private GitHub target:

```text
git@github.com:EtherealCoin/EtherealAI.git
```

Recommended private repo name:

```text
etherealai-local
```

Keep the repo private until secrets, local DB files, generated artifacts, and owner-specific docs have been reviewed.
