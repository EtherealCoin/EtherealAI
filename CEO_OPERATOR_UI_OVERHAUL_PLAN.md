# EtherealAI CEO Operator UI Overhaul Plan

Date: 2026-05-27

## Objective

Convert EtherealAI from a feature-rich developer dashboard into CEO/operator software without removing power. Simple Mode becomes the daily operating surface. Advanced Developer Mode keeps raw routes, IDs, JSON, logs, diagnostics, and expert controls.

## Current Audit Summary

The existing app already has:

- Ethereal/REAL visual identity, dark dapp shell, neon cyan/pink/purple theme, and archived artwork integrated.
- Simple Operator Mode shell in `app/client/js/operator-mode.js`.
- Training/dropdown support in `app/client/js/operator-training.js`.
- Next-action assistant in `app/client/js/operator-next-action.js`.
- Strong backend coverage for trading, paper automation, live-launch safety, Kraken, token planning, Solidity, socials, wallets, security, and proof packets.

The current operator issue is not missing capability. The issue is presentation:

- Many workflows expose implementation phases, route names, raw status labels, IDs, tables, and repeated gate panels.
- Some actions require the owner to understand internal objects such as connectors, plans, profiles, schedules, route names, vault readbacks, or endpoint phases.
- Live Trading Launch has the most complete safety infrastructure, but it still needs a higher-level API Connection Center for normal owner use.
- Token creation has broad features, but the daily workflow needs a clearer pipeline: token category, chain, identity, tokenomics, use case, code plan, logo, website/whitepaper/roadmap, dapp options, then launch package.

## Two-Gate Presentation Rule

For normal owner actions, Simple Mode should present no more than two human-facing gates:

1. Preview / Review
   - What EtherealAI is about to do.
   - Important numbers, chain, exchange, wallet reference, fees, risk, target, or output.
   - All blockers in one plain-English list.

2. Final Confirm / Execute
   - One final confirm button, checkbox group, or phrase where needed.
   - Backend safety checks still run, but Simple Mode does not show them as a pile of owner gates.

Allowed stronger review remains for live trading, wallet signing, deployment, token minting, liquidity, withdrawals/transfers, API secret replacement, public posting, listing submissions, paid services, DNS mutation, GitHub publishing, destructive file/database actions.

Even there, Simple Mode should still be structured as:

1. Full risk/external-action summary.
2. Final owner approval.

## First Build Block

Implemented first:

- Add a reusable client-side two-gate renderer in `app/client/js/operator-gates.js`.
- Add `/api-connection-center` as the CEO-facing API Connection Center.
- Keep Kraken as the first live-account connector focus.
- Keep Coinbase as the next CEX lane after Kraken succeeds.
- Keep DEX lanes read-only/quote-only until later explicit owner approval.
- Route API Connection Center into Simple Operator Mode and navigation.

This block intentionally does not:

- Place a live order.
- Change Kraken auth logic.
- Change vault encryption.
- Enable swaps.
- Enable wallet signing.
- Enable autonomous execution.
- Remove any Advanced Developer Mode capability.

## Gate Count Baseline

Initial target areas:

- API Connection Center / Kraken path:
  - Simple Mode should show one Preview/Review gate and one Final Confirm/Execute gate.
  - Advanced Kraken diagnostics stay collapsed or linked to Live Trading Launch.

- Token Launch Factory:
  - Future pass should convert the current Solidity Lab form into a guided pipeline.
  - Existing contract/spec/project controls stay in Advanced Developer Mode.

- Website / Whitepaper / Roadmap:
  - Future pass should make this the automatic next stage after token identity/logo selection.
  - Existing local project/package outputs stay preserved.

## Next Build Blocks

1. Apply the two-gate renderer to the Token Launch Factory start flow.
2. Promote Logo Studio into an explicit step after token identity/use-case/code plan.
3. Promote Website / Whitepaper / Roadmap Builder into the next explicit step after logo selection.
4. Add Coinbase Advanced setup wizard after the first Kraken tiny-live test succeeds.
5. Add DEX Aggregator Connector Center as quote-only first for 0x, 1inch, ParaSwap, Li.Fi, Rango, and Jupiter.

## Safety State

At the time of this plan:

- Kraken auth was verified.
- Kraken tiny-live preview reached READY.
- The final live order button unlock issue was fixed.
- No live Kraken order had been placed.
- Kraken production endpoint call rows were `0`.
- Autonomous trading, wallet signing, withdrawals, transfers, leverage, margin, futures, repeated orders, background execution, and scaling loops remained disabled.
