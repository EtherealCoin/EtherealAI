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
- `/owner-setup` - Setup Wizard for paper 95 to 100 and full E2E readiness 72 to 100 with live trading disabled, including visual `.env` file selection, safe credential presence checks, detected public wallet address display, and step-by-step blocked-gate guidance
- `/operator-control` - Wallet & Funding Center for wallet metadata, owner key-control guidance, permissions, project assignment, and revoke workflows
- `/security-lockdown` - Security Lockdown Center for read-only Mac/network security audit, local attack-surface review, and owner hardening checklist
- `/owner-proof-packet` - local proof packet, owner acceptance, live-blocker evidence
- `/mvp-test-pass` - owner test pass and evidence checklist
- `/server-route-inventory` - Advanced / Developer Tools for route map, safety boundaries, raw evidence, and developer checks
- `/creator` - local AI builder workflow
- `/strategy-lab` - Strategy, Paper Trading, and Bot Control for strategy research, paper automation, safety controls, non-coder Risk Profile Configuration, and a Bot Operator Wizard that can finish paper setup without live trading or wallet signing
- `/solidity-lab` - token, NFT, website, whitepaper, chain, and ecosystem planning
- `/social-ops` - local-only social/community draft workflows

Every protected operator page now loads the global `What do I do next?` assistant. It checks the local owner setup, readiness, bot automation, wallet, security, and health APIs, then recommends the safest next action in plain English without enabling live trading or wallet signing.

## Operator Experience

EtherealAI now defaults to **Simple Operator Mode**. This mode shows large readable task cards, one primary action, plain-English status, and a `Show me how` walkthrough on each main page. Raw IDs, logs, JSON, archived records, debug tables, route diagnostics, and technical filters remain available through **Advanced Developer Mode**, but they are hidden during normal CEO/operator use.

The Setup Wizard now treats Polygon, exchange, GitHub, Cloudflare, and social API credentials as optional future integrations in Simple Mode. Paper trading can remain complete without those keys. Public wallet addresses are added directly through the UI with `Add Public Wallet`; the `.env` file is only for optional API keys and later integrations.

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
