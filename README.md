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

- `/dashboard` - system status, model roles, MLX lifecycle, multi-agent coordination, system memory
- `/owner-proof-packet` - local proof packet, owner acceptance, live-blocker evidence
- `/mvp-test-pass` - owner test pass and evidence checklist
- `/server-route-inventory` - route map and safety boundaries
- `/creator` - local AI builder workflow
- `/strategy-lab` - strategy research, paper automation, safety controls
- `/solidity-lab` - token, NFT, website, whitepaper, chain, and ecosystem planning
- `/social-ops` - local-only social/community draft workflows

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

Before publishing, confirm the target GitHub owner/repository. This workspace currently has no configured remote.

Recommended private repo name:

```text
etherealai-local
```

Keep the repo private until secrets, local DB files, generated artifacts, and owner-specific docs have been reviewed.
