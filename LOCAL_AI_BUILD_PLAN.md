# EtherealAI Build Plan

EtherealAI is being built as a local-first AI creation system. The goal is for a non-developer owner to describe what they want in plain English and have the system help build, test, run, and improve software locally.

## Ground Rules

- Keep the system local-first by default.
- Do not put private trading logic, exchange keys, wallet keys, or token deployment keys into prompts unless the owner explicitly chooses to.
- Keep API keys in local environment files that are ignored by Git.
- Build automation in stages: plan, generate, review, test, then execute.
- For trading, use paper trading and hard risk limits before any live execution.
- For social automation, require approval before posting until the system has proven itself.

## Current Baseline

The app is currently a Node/Express web app with:

- Local SQLite user database.
- Signup, login, logout, and protected pages.
- A Strategy Lab page that saves strategy specs, imports manual OHLCV CSV candles, and runs the first real candle-based research backtests.
- A Creator Agent page with task planning, approved workspaces, Git checkpoints, command guardrails, file proposals, checklist generation, task activity, and a project-wide artifact browser.
- Automatic model routing that can choose planner, coder, or autocomplete from prompt intent.
- Paper replay sessions with market-regime tagging and readiness gates.
- Local-only exchange connector records and draft order intents.
- Local risk profiles for max order value, max position value, max daily loss, max open trades, and kill-switch state.
- Draft order-intent risk reviews that record pass/review status before anything can become execution logic.
- Decision logs for backtests and paper replays that show why the system waited, entered, held, or exited.
- Optimization sweeps for research-only fee, slippage, stop-loss, and take-profit comparisons.
- Split tests for in-sample vs out-of-sample performance checks.
- Rolling walk-forward tests for repeated train/test windows on imported candle datasets.
- Market-data import labels, notes, status management, filtered lookup, quality scoring, import pagination, candle preview pagination, background import jobs, streaming CSV file uploads, import-job cancellation, failed-job retry controls, failed-source discard, and archived-import cleanup.
- Market-data provider records, provider health checks, local mock provider generation, pagination-aware Coinbase/Binance public OHLCV adapters, Kraken public OHLC adapter, active/paused scheduled dataset refresh jobs, editable refresh interval/lookback controls, refresh-run history summaries, archive-only duplicate refresh cleanup, automatic due-run polling, and artifact/system-memory recovery.
- A Solidity Lab page for contract specs, starter source generation, template review, and local Hardhat-style workspace scaffolding.
- A Social Ops page for local draft queues, AI draft generation, and advisory content review flags.
- A dashboard Memory Snapshot endpoint for recovering project state in a new session.
- Dev-server status tracking with current PID, port, command, uptime, heartbeat, recent run records, refresh controls, and persisted local server log notes.
- Backtest Explorer for comparing saved research runs across strategies and symbols.
- Creator next-step automation that can advance a selected task through checklist, checkpoint, proposal application, and verification stages.
- Creator starter project scaffolds for general apps, trading research, Solidity, social ops, and games.
- Static frontend pages under `app/client`.
- Main server under `app/server/src/server.js`.

Run it with:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Phase 1: Stabilize The App

Goal: turn the current app into a reliable control center.

Tasks:

- Add a proper dashboard navigation layout.
- Replace placeholder marketing sections with actual system controls.
- Add a project/workspace page where generated projects can be listed.
- Add an audit log so every AI action is visible.
- Add local settings for model endpoint, workspace folders, and execution permissions.
- Add a simple health page showing server, database, and local model status.

## Phase 2: Local Model Connection

Goal: connect the app to a local LLM runtime.

Recommended first target:

- Ollama-compatible local API.

Possible later targets:

- llama.cpp server.
- LM Studio local server.
- vLLM or other GPU-backed server when larger hardware is available.

Core pieces:

- `modelProvider` module for sending prompts to local models.
- Model settings in the UI.
- Timeout and retry handling.
- Prompt logging with sensitive-data redaction.
- A "test model" button in the UI.

## Phase 3: Creator Agent

Goal: let the system build projects from plain English.

Core loop:

1. User describes the thing to build.
2. AI creates a plan.
3. AI writes or edits files in a workspace.
4. AI runs tests or app checks.
5. AI reports what changed.
6. User approves the next step.

Required safety rails:

- File writes must stay inside approved project folders.
- Shell commands need an allowlist.
- Destructive commands are blocked unless manually approved.
- All generated changes are tracked with Git.
- The system creates checkpoints before risky changes.

## Phase 4: Trading Automation Suite

Goal: create a crypto-only trading research and execution environment.

Build order:

- Strategy specification format.
- Historical data ingestion.
- Market-data provider connectors and scheduled dataset refresh.
- Backtesting engine.
- Metrics: win rate, drawdown, Sharpe-like ratio, average trade, max loss streak, exposure, fees, slippage.
- Paper trading engine.
- Exchange connector layer.
- Risk profile manager and draft order risk review.
- Decision log for every simulated trading action.
- Optimization sweeps for candidate risk and cost settings.
- Split testing before trusting a candidate configuration.
- Walk-forward testing for repeated out-of-sample checks.
- Live execution only after paper trading and risk checks.

Required live-trading protections:

- No withdrawal permission on exchange API keys.
- Max position size.
- Max daily loss.
- Max open trades.
- Kill switch.
- Manual live-trading enable switch.
- Full order and decision log.

Good libraries to evaluate:

- `ccxt` for exchange connectivity.
- SQLite or Postgres for trades and market data.
- A separate worker process for live execution.

## Phase 5: Solidity And Token Tooling

Goal: support smart contract work without exposing private keys.

Build order:

- Contract project templates.
- Hardhat or Foundry support.
- Unit test generation.
- Local chain deployment.
- Static analysis with tools such as Slither.
- Deployment scripts that require manual confirmation.

Rules:

- Private keys never go into source code.
- Deployment always shows chain, contract, account, and gas estimate before execution.
- Mainnet actions require a separate manual approval flow.

## Phase 6: Social And Community Automation

Goal: help manage token/community content safely.

Build order:

- Draft generator.
- Content calendar.
- Approval queue.
- Posting connectors only after draft workflow works.
- Analytics collection.

Rules:

- No blind posting at first.
- Keep brand voice examples local.
- Log every generated post and final approved version.

## Phase 7: Hardware Scale-Up

Goal: keep the architecture ready for larger local hardware later.

Near-term:

- MacBook local model runtime.
- Small coding model for fast edits.
- Larger reasoning model when needed.

Later:

- Dedicated model server.
- GPU scheduling.
- Separate storage for datasets, logs, checkpoints, and model weights.
- Role-specific models for coding, trading research, Solidity, and content.

## Immediate Next Build Tasks

1. Add more supported Strategy Lab rule templates for the owner's exact crypto strategy language.
2. Add model-assisted editing inside scaffolded projects.
3. Add real Hardhat or Foundry scaffolds behind Solidity Lab.
4. Add richer dataset backfill controls, schedule presets, and import deduplication by timestamp range.
5. Split the large server file into smaller route modules.

Supported Strategy Lab rule parsing now includes:

- Green candle entry.
- Red candle exit.
- Close above/below SMA or EMA.
- SMA/EMA crossover, such as `9 EMA crosses above 21 EMA`.
- High breakout entry.
- Previous-low breakdown exit.
- RSI above/below threshold.
- Consecutive green/red candle rules.
- Volume above average/spike rules.
- MACD cross above/below signal and histogram above/below zero.
- Bollinger Band upper/lower close rules.
- Simple multi-condition `and` rules.

## Plain-English Operating Model

The app should behave like this:

```text
I want a crypto backtester for my BTC strategy.
```

The system should respond by:

- Asking for missing details.
- Creating a project plan.
- Writing the files.
- Running checks.
- Showing exactly what changed.
- Waiting before any risky command, trade, post, or deployment.

That is the north star.
