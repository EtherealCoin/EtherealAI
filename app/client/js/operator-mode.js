(function () {
    const MODE_KEY = 'etherealai.operatorMode';
    const BRAND_LOGO_SRC = '/public/brand/etherealai-logo.png';

    const pageConfigs = {
        '/': {
            area: 'Home / Mission Control',
            title: 'Run EtherealAI From One Screen',
            summary: 'Check the system, see what is safe, and press one button for the next recommended action.',
            primaryAction: { label: 'What should I do next?', kind: 'next' },
            keepHeadings: [],
            readyLabel: 'Mission Control Ready',
            nextText: 'Press What should I do next. EtherealAI will choose the safest current action from local state.',
            cards: [
                ['System Health', 'Shows whether the local server and database are responding.'],
                ['Paper Trading', 'Shows whether paper setup is complete without using real money.'],
                ['Live Trading Lock', 'Confirms live orders and wallet signing are still blocked.'],
                ['Security', 'Shows whether the Mac needs owner review or immediate action.']
            ],
            workflow: [
                ['Start here', 'Open the full beginner manual and walkthrough.', { label: 'Open Operator Manual', href: '/operator-manual' }],
                ['Check next action', 'Ask the local assistant what to do next.', { label: 'What should I do next?', kind: 'next' }],
                ['Open paper controls', 'Go straight to safe local paper trading.', { label: 'Open Paper Trading', href: '/strategy-lab#bot-automation' }]
            ]
        },
        '/dashboard': {
            area: 'Mission Control',
            title: 'Mission Control',
            summary: 'Use this page to decide what to do next. Advanced diagnostics are hidden unless you switch modes.',
            primaryAction: { label: 'What should I do next?', kind: 'next' },
            keepHeadings: [],
            readyLabel: 'Mission Control Ready',
            nextText: 'Use the next-action button first. It will not route you to optional provider keys after paper trading is ready.',
            cards: [
                ['Health', 'Server, database, and local model status.'],
                ['Readiness', 'Paper setup and full E2E setup progress.'],
                ['Locks', 'Live trading and wallet signing must remain locked.'],
                ['Next Action', 'The safest next click based on current system state.']
            ],
            workflow: [
                ['Check core setup', 'Confirm local paper operation, wallet metadata, and live locks.', { label: 'Refresh Mission Control', kind: 'next' }],
                ['Run paper trading', 'Open the guided paper workflow.', { label: 'Open Paper Trading', href: '/strategy-lab#bot-automation' }],
                ['Review security', 'Open plain-English security tasks.', { label: 'Open Security Review', href: '/security-lockdown' }]
            ]
        },
        '/owner-setup': {
            area: 'Setup Wizard',
            title: 'Beginner Owner Setup',
            summary: 'Your local paper-trading system is complete. Remaining items are optional future integrations, and live trading stays locked.',
            primaryAction: { label: 'Add Public Wallet', selector: '#owner-add-public-wallet' },
            keepHeadings: ['Progress', 'Add Public Wallet Address'],
            readyLabel: 'Core Setup Complete',
            nextText: 'Paper trading is ready. Add public wallet metadata only when you want wallet labels for planning.',
            cards: [
                ['Required Now', 'Paper trading is complete. You can keep building and testing locally.'],
                ['Optional Later', 'API keys for exchanges, socials, GitHub, Cloudflare, and data providers can wait.'],
                ['Live Trading Locked', 'Live orders and wallet signing remain disabled.'],
                ['Developer / Advanced', 'Variable names and raw gates are hidden unless you open Advanced Mode.']
            ],
            workflow: [
                ['Confirm paper readiness', 'Verify local paper setup without live trading or wallet signing.', { label: 'Refresh Setup Status', selector: '#refresh-owner-setup' }],
                ['Add public wallet', 'Save public address metadata through the UI only.', { label: 'Add Public Wallet', selector: '#owner-add-public-wallet' }],
                ['Skip optional integrations', 'Keep API keys, socials, GitHub, Cloudflare, and provider keys for later.', { label: 'Skip Optional Integrations', selector: '#owner-skip-optional-integrations' }]
            ]
        },
        '/strategy-lab': {
            area: 'Strategy / Paper / Bots',
            title: 'Build A Strategy, Then Run One Safe Paper Test',
            summary: 'Create the strategy in plain English, then click one button. EtherealAI handles paper sessions, risk, connector, plan, schedule, verification, and simulation in the background.',
            primaryAction: { label: 'Run This Strategy Safely', selector: '#run-this-strategy-safely' },
            keepIds: [],
            keepHeadings: [],
            readyLabel: 'Paper Trading Ready',
            nextText: 'Use Run This Strategy Safely. Advanced infrastructure objects stay hidden unless you intentionally open Advanced Mode.',
            cards: [
                ['Strategy Builder', 'Describe the idea in plain English.'],
                ['Safe Paper Test', 'One click creates, connects, verifies, and runs the local simulation.'],
                ['Results', 'Review simulated trades, P/L, spread/costs, entry/exit reasons, health, and warnings.'],
                ['Live Lock', 'No wallet signing, no exchange order, and no live trading.']
            ],
            workflow: [
                ['1. Create strategy', 'Open the plain-English strategy builder.', { label: 'Create Strategy', selector: '#strategy-entry' }],
                ['2. Run safe paper test', 'Let EtherealAI create and connect all paper-only components automatically.', { label: 'Run This Strategy Safely', selector: '#run-this-strategy-safely' }],
                ['3. Review results', 'Read simulated trades, P/L, costs, reasons, health, and warnings.', { label: 'Review Paper Results', selector: '#safe-paper-results' }],
                ['4. Advanced records', 'Open only if you intentionally need raw plans, schedules, connectors, or IDs.', { label: 'Open Advanced Paper Records', selector: '#bot-automation' }]
            ]
        },
        '/live-trading-launch': {
            area: 'Live Trading Launch Center',
            title: 'Start Live Setup Safely Without Unlocking Autonomy',
            summary: 'Use one Kraken setup walkthrough to create a restricted spot key, save it safely, verify it, run dry-run proof, and check tiny live eligibility while keeping trading locked.',
            primaryAction: { label: 'Start Kraken Live Setup Walkthrough', selector: '#start-kraken-live-setup' },
            keepIds: ['kraken-live-setup-walkthrough', 'kraken-auth-diagnostics', 'live-trading-activation-wizard', 'real-credential-dry-run-proof', 'kraken-tiny-live-framework', 'live-arbitrage-command-center', 'treasury-command-center', 'production-trading-command-center'],
            keepHeadings: ['What Should I Do Next?', 'Kraken Live Setup Walkthrough', 'Kraken Authentication Diagnostics', 'Live Trading Activation Wizard', 'Exchange Verification Checklist', 'Read-Only Arbitrage Scanner', 'Phase 3 Operator Dashboard', 'Phase 4: Live Arbitrage Command Center', 'Phase 5: Treasury Command Center', 'Phase 6: Production Trading Command Center'],
            readyLabel: 'Live Trading Launch Locked Safely',
            nextText: 'Click Start Kraken Live Setup Walkthrough. It shows exactly what to click in Kraken, what permissions must stay off, where to paste the key, and what to verify next.',
            cards: [
                ['Guided activation', 'One exchange first, one visible next step, no raw developer workflow.'],
                ['Read-only expansion', 'Fetch public and authenticated read-only data without placing orders.'],
                ['Arbitrage intelligence', 'Rank best buy and sell venues after fees, slippage, latency, liquidity, and exchange health.'],
                ['Treasury intelligence', 'Track capital, stablecoin inventory, chain metadata, opportunity confidence, and allocation reasoning.'],
                ['Production gates', 'Production execution requires owner approvals, dry-run preview, capital limits, and final typed confirmation.'],
                ['Safety boundary', 'No leverage, margin, futures, withdrawals, wallet signing, unrestricted live orders, or autonomous scaling.']
            ],
            workflow: [
                ['1. Start live setup safely', 'Choose one exchange and load the guided activation checklist.', { label: 'Start Live Setup Safely', selector: '#start-live-setup-safely' }],
                ['2. Start Kraken walkthrough', 'Follow the single owner flow for key creation, safe permissions, vault save, verification, dry-run proof, and eligibility.', { label: 'Start Kraken Live Setup Walkthrough', selector: '#start-kraken-live-setup' }],
                ['3. Save restricted Kraken key', 'Paste the Kraken API key and private key into encrypted local vault fields only.', { label: 'Save Key Safely', selector: '#kraken-live-save-key' }],
                ['4. Verify Kraken connection', 'Read balances, account status, fees, symbol rules, and unsafe permission signals.', { label: 'Verify Connection', selector: '#kraken-live-verify' }],
                ['5. Run Kraken auth diagnostics if verify fails', 'Test the raw Kraken Balance endpoint, local nonce, signature generation, vault decode, and exact Kraken response without placing orders.', { label: 'Test Raw Kraken Balance Endpoint', selector: '#kraken-auth-test-balance' }],
                ['6. Run dry-run proof', 'Simulate the exact tiny setup without calling the order endpoint.', { label: 'Dry-Run Proof', selector: '#kraken-live-dry-run' }],
                ['7. Check tiny live eligibility', 'Estimate tiny size, fees, slippage, minimum order rules, exposure, and blockers without placing an order.', { label: 'Tiny Live Eligibility', selector: '#kraken-live-preview' }],
                ['8. Prepare tiny live mode only if eligible', 'Typed confirmation can prepare locked tiny live test mode. Execution remains blocked.', { label: 'Enable Tiny Live Test Mode', selector: '#phase6f-enable' }],
                ['9. Emergency stop', 'Disable production approvals and live connector flags if anything looks unsafe.', { label: 'Emergency Stop Production', selector: '#phase6d-emergency-stop' }]
            ]
        },
        '/operator-control': {
            area: 'Wallet & Funding Center',
            title: 'Add Wallets Without Giving EtherealAI The Keys',
            summary: 'Attach public wallet labels and purposes only. Seed phrases, private keys, and wallet passwords stay outside the system.',
            primaryAction: { label: 'Review Wallet Readiness', selector: '#refresh-operator-center' },
            keepHeadings: ['Attach Wallet Metadata'],
            readyLabel: 'Wallet Metadata Ready',
            nextText: 'Add public wallet metadata through the visible form. Never enter seed phrases, private keys, or wallet passwords.',
            cards: [
                ['1. Choose wallet purpose', 'Trading research, token deployment, treasury, or recovery.'],
                ['2. Add public address', 'Public address and label only. No secret material.'],
                ['3. Scope permissions', 'Keep dangerous actions blocked unless a future owner approval flow exists.'],
                ['4. Review readiness', 'Record the safe owner-control checkpoint.']
            ],
            workflow: [
                ['Choose purpose', 'Use a label that explains what the wallet is for.', { label: 'Open Wallet Form', selector: '#wallet-form' }],
                ['Add public address', 'Paste public address only. No secret material.', { label: 'Add Public Wallet', selector: '#wallet-public-address' }],
                ['Review wallet metadata', 'Refresh the saved wallet list after saving.', { label: 'Review Wallets', selector: '#refresh-operator-center' }]
            ]
        },
        '/security-lockdown': {
            area: 'Security Lockdown',
            title: 'Turn Security Findings Into Owner Tasks',
            summary: 'Simple status first: safe, review needed, or fix now. Raw system details stay in Advanced Mode.',
            primaryAction: { label: 'Refresh Security Status', selector: '#refresh-security-audit' },
            keepHeadings: ['Security Snapshot', 'Priority Owner Actions'],
            readyLabel: 'Security Review Available',
            nextText: 'Refresh the audit, then handle Fix Now items first. Raw ports, processes, and logs are in Advanced Mode.',
            cards: [
                ['Safe', 'No immediate action needed for that check.'],
                ['Review Needed', 'You should inspect the item before using sensitive accounts.'],
                ['Fix Now', 'Handle this before expanding automation.'],
                ['Emergency', 'Containment steps if the Mac or network is suspected compromised.']
            ],
            workflow: [
                ['Refresh audit', 'Update the local read-only security status.', { label: 'Refresh Security Status', selector: '#refresh-security-audit' }],
                ['Review owner tasks', 'Open plain-English security actions.', { label: 'View Priority Actions', selector: '#priority-actions' }],
                ['Emergency shutdown', 'Open containment steps if compromise is suspected.', { label: 'Open Emergency Steps', selector: '#emergency-containment' }]
            ]
        },
        '/solidity-lab': {
            area: 'Solidity Lab',
            title: 'Create A Token Project Without Deploying',
            summary: 'Draft token specs, website, whitepaper, listing plan, and ecosystem blueprint locally. Deployment remains locked.',
            primaryAction: { label: 'Select Chain-Neutral Defaults', selector: '#select-chain-neutral-token-options' },
            keepHeadings: ['Deployment Boundary', 'Contract Spec'],
            readyLabel: 'Token Planning Ready',
            nextText: 'Choose chain and token features, then save a local spec. Deployment remains locked.',
            cards: [
                ['1. Pick chain', 'Polygon, Base, Solana, BNB, Avalanche, or another supported chain.'],
                ['2. Choose token features', 'Rewards, staking, NFT utility, website, whitepaper, listing evidence, and more.'],
                ['3. Save the ecosystem project', 'Create the local planning packet.'],
                ['4. Review before deployment', 'No blockchain broadcast happens in this mode.']
            ],
            workflow: [
                ['Pick blockchain', 'Choose Polygon, Base, Ethereum, BNB, Avalanche, Solana, or another supported chain per project.', { label: 'Select Chain-Neutral Defaults', selector: '#select-chain-neutral-token-options' }],
                ['Define token', 'Open the token spec form.', { label: 'Create Token Spec', selector: '#contract-form' }],
                ['Build ecosystem plan', 'Open website, whitepaper, listing, and social planning.', { label: 'Open Ecosystem Studio', selector: '#load-ecosystem-catalog' }]
            ]
        },
        '/social-ops': {
            area: 'Social Ops',
            title: 'Create Community Content Locally',
            summary: 'Draft posts, launch updates, community manager plans, and listing evidence content without public posting.',
            primaryAction: { label: 'Generate Local Draft', selector: '#social-generate-form button[type="submit"]' },
            keepHeadings: ['Local-Only Safety', 'Community Progress Art Pack', 'AI Draft Generator'],
            readyLabel: 'Local Drafting Ready',
            nextText: 'Generate a local draft, review it, then post manually later. Public posting remains disabled.',
            cards: [
                ['1. Pick the purpose', 'Announcement, progress update, community reply, or listing campaign.'],
                ['2. Generate draft', 'The AI writes locally only.'],
                ['3. Review safety flags', 'Avoid fake activity, fake volume, bribery, or misleading claims.'],
                ['4. Owner posts manually', 'External posting remains disabled.']
            ],
            workflow: [
                ['Choose presentation style', 'Use the local Ethereal art pack for founder updates, video headers, X banners, Medium covers, and Discord announcements.', { label: 'Open Art Pack', selector: '#community-progress-art-pack' }],
                ['Choose content type', 'Pick the purpose and channel for a local draft.', { label: 'Open Draft Generator', selector: '#social-generate-form' }],
                ['Generate draft', 'Create local-only social copy.', { label: 'Generate Local Draft', selector: '#social-generate-form button[type="submit"]' }],
                ['Review queue', 'Open saved local drafts.', { label: 'Review Drafts', selector: '#social-post-list' }]
            ]
        },
        '/creator': {
            area: 'Creator Agent',
            title: 'Describe What You Want Built',
            summary: 'Use normal language. EtherealAI creates a local plan first and waits before risky file or command actions.',
            primaryAction: { label: 'Create Plan', selector: '#creator-form button[type="submit"]' },
            keepHeadings: ['New Build Request'],
            readyLabel: 'Creator Ready',
            nextText: 'Describe the result you want. EtherealAI will make a local plan before file or command execution.',
            cards: [
                ['1. Name the build', 'Use a plain title you will recognize.'],
                ['2. Describe the result', 'Tell EtherealAI what you want, not how to code it.'],
                ['3. Create a plan', 'The first output is a local plan.'],
                ['4. Review before execution', 'File changes and commands remain controlled.']
            ],
            workflow: [
                ['Describe the build', 'Write the outcome in normal language.', { label: 'Open Build Request', selector: '#creator-form' }],
                ['Create local plan', 'Generate a plan without live external side effects.', { label: 'Create Plan', selector: '#creator-form button[type="submit"]' }],
                ['Review tasks', 'Open current plan and task activity.', { label: 'Review Plan', selector: '#task-list' }]
            ]
        },
        '/operator-manual': {
            area: 'Start Here',
            title: 'Beginner Operator Manual',
            summary: 'A guided owner manual for running EtherealAI without terminal commands or developer workflows.',
            primaryAction: { label: 'What should I do next?', kind: 'next' },
            keepHeadings: ['Start Here Walkthrough', 'Operator Manual', 'Safety Rules'],
            readyLabel: 'Training Ready',
            nextText: 'Read Start Here first, then use the page buttons. Advanced controls remain hidden until intentionally opened.',
            cards: [
                ['Start Here', 'Use Mission Control and What should I do next first.'],
                ['Paper First', 'Local paper trading works without live money, APIs, or wallet signing.'],
                ['Wallet Safety', 'Only public wallet addresses go into the UI.'],
                ['Advanced Later', 'Raw variables, JSON, logs, and APIs are for Advanced Mode.']
            ],
            workflow: [
                ['Start at Mission Control', 'Check core status and next action.', { label: 'Open Mission Control', href: '/dashboard' }],
                ['Set up paper trading', 'Open guided local paper operation.', { label: 'Open Paper Trading', href: '/strategy-lab#bot-automation' }],
                ['Add wallet metadata', 'Add public addresses only.', { label: 'Open Wallet Center', href: '/operator-control' }]
            ]
        },
        '/operator-training': {
            area: 'Operator Training Library',
            title: 'Learn EtherealAI In Order',
            summary: 'Use the built-in text and video-style training modules to operate each major tab without outside help.',
            primaryAction: { label: 'Start Training Library', selector: '#operator-training-library-root' },
            keepHeadings: ['Operator Training Library'],
            readyLabel: 'Training Ready',
            nextText: 'Start with the first lesson, then use the text or video guide for the page you are operating.',
            cards: [
                ['Text Guides', 'Plain-English operating instructions for every major page.'],
                ['Video-Style Walkthroughs', 'Placeholder players, chapters, transcripts, and exact click instructions.'],
                ['Pause And Verify', 'Each lesson tells you what to check before moving forward.'],
                ['Safety Boundaries', 'Live trading and wallet signing stay locked unless separately approved later.']
            ],
            workflow: [
                ['Start the library', 'Open the ordered training modules.', { label: 'Start Training Library', selector: '#operator-training-library-root' }],
                ['Learn Mission Control', 'Read how to interpret status and next actions.', { label: 'Open Mission Control Lesson', href: '/operator-training#training-read-mission-control' }],
                ['Practice paper operation', 'Use the strategy and paper bot lesson before creating automation.', { label: 'Open Paper Training', href: '/operator-training#training-build-and-paper-test-strategy' }]
            ]
        },
        '/owner-proof-packet': {
            area: 'Proof Packet',
            title: 'Download Local Proof Before Acceptance',
            summary: 'Review readiness, local proof surfaces, checksum, and blocked live gates before recording owner acceptance.',
            primaryAction: { label: 'Download Proof Packet JSON', selector: '#download-owner-proof-packet' },
            keepHeadings: ['Owner Proof Packet', 'Owner Acceptance'],
            readyLabel: 'Proof Ready',
            nextText: 'Download the proof packet, review the checksum and live lock, then record local acceptance only after manual review.',
            cards: [
                ['Readiness', 'Shows whether local MVP proof is ready.'],
                ['Checksum', 'Confirms the local packet has a stable evidence marker.'],
                ['Owner Acceptance', 'Records review only after you check each safety item.'],
                ['Live Lock', 'Live trading and wallet signing remain disabled.']
            ],
            workflow: [
                ['Load proof packet', 'Refresh local readiness and proof data.', { label: 'Refresh Proof Packet', selector: '#refresh-owner-proof-packet' }],
                ['Download evidence', 'Save the local JSON proof packet.', { label: 'Download Proof Packet JSON', selector: '#download-owner-proof-packet' }],
                ['Record acceptance', 'Complete manual review checkboxes only when ready.', { label: 'Open Acceptance Review', selector: '#owner-acceptance-form' }]
            ]
        },
        '/mvp-test-pass': {
            area: 'MVP Test Pass',
            title: 'Confirm The Local MVP Test Pass',
            summary: 'Review owner-facing proof, evidence manifest, paper automation smoke checks, and live-disabled safety.',
            primaryAction: { label: 'Download Evidence Manifest JSON', selector: '#owner-evidence-download' },
            keepHeadings: ['Owner Evidence Manifest', 'Completion Ledger'],
            readyLabel: 'MVP Evidence Ready',
            nextText: 'Review evidence, download the manifest if needed, then use Proof Packet for final local acceptance.',
            cards: [
                ['Bot Automation Smoke', 'Confirms paper automation is local and monitor-only.'],
                ['Evidence Manifest', 'Downloads local proof rows and checksums.'],
                ['Completion Ledger', 'Separates Local E2E complete from Live E2E locked.'],
                ['Owner Acceptance', 'Final review happens from Proof Packet, not by enabling live mode.']
            ],
            workflow: [
                ['Review smoke checks', 'Confirm paper automation is not live trading.', { label: 'Open Smoke Checks', selector: '#bot-workflow-smoke-cards' }],
                ['Download evidence', 'Save the local evidence manifest.', { label: 'Download Evidence Manifest JSON', selector: '#owner-evidence-download' }],
                ['Open proof packet', 'Record acceptance only after owner review.', { label: 'Open Proof Packet', href: '/owner-proof-packet' }]
            ]
        },
        '/server-route-inventory': {
            area: 'Advanced Developer Mode',
            title: 'Advanced Developer Tools',
            summary: 'This page is intentionally technical. Use it only when inspecting routes, safety boundaries, or raw proof records.',
            primaryAction: { label: 'Go To Mission Control', href: '/dashboard' },
            keepHeadings: ['Inventory Summary', 'Owner Proof Coverage'],
            cards: [
                ['Routes', 'Protected server paths and API surfaces.'],
                ['Safety Boundaries', 'What each module is allowed to do.'],
                ['Proof Coverage', 'Evidence that owner-facing safety pages exist.'],
                ['Developer Review', 'Raw diagnostics stay here, not in Simple Mode.']
            ]
        }
    };

    const tutorialScripts = {
        default: [
            ['Choose a mode', 'Simple Operator Mode is for normal use. Advanced Developer Mode reveals raw logs, tables, IDs, and diagnostics.'],
            ['Read the top card', 'Each page starts with what this area does, why it matters, and the safest primary action.'],
            ['Use one button first', 'Press the largest button before digging into lower sections.'],
            ['Open Advanced only when needed', 'Advanced Mode keeps all original power without forcing it into the daily operator workflow.']
        ],
        '/strategy-lab': [
            ['Build', 'Start with Strategy Builder and describe the idea in plain English.'],
            ['Paper test', 'Use safe paper defaults to create a plan and schedule. No wallet signing is used.'],
            ['Verify', 'Press Verify Paper Trading 100% to see the exact remaining blocker if anything is missing.'],
            ['Monitor', 'Use Bot Control for paper schedules. Live mode remains locked.']
        ],
        '/security-lockdown': [
            ['Read the status', 'Safe means no immediate action. Review Needed means inspect it. Fix Now means handle it before expansion.'],
            ['Use priority actions', 'Start with the owner tasks at the top instead of raw process lists.'],
            ['Keep secrets off suspect devices', 'If compromise is suspected, do not use this Mac for wallet signing or credential rotation.'],
            ['Use Advanced for evidence', 'Raw ports, startup items, and connections remain available only when expanded.']
        ]
    };

    const ART_IMAGES = {
        strategicPillars: '/public/brand/ethereal-community-strategic-pillars.png',
        orbitalCore: '/public/brand/ethereal-community-orbital-core.png',
        globe: '/public/brand/ethereal-community-globe-real.png',
        particleGlobe: '/public/brand/ethereal-community-particle-globe-square.png',
        math: '/public/brand/ethereal-community-purple-math-horizontal.png',
        getReal: '/public/brand/ethereal-community-get-real-mission.png',
        logoMaker: '/public/brand/ethereal-logo-generator-example.png',
        digitalWorld: '/public/brand/ethereal-digital-world.png'
    };

    const pageArtShowcases = {
        '/': {
            eyebrow: 'Mission Control visual system',
            title: 'Home base for the local AI operating system.',
            body: 'This page is the daily command surface: system health, paper readiness, live locks, wallet status, and the safest next action. When fully completed, it becomes the one-screen executive cockpit for trading, automation, token creation, websites, socials, and security.',
            heroImage: ART_IMAGES.digitalWorld,
            cards: [
                ['Core Status', ART_IMAGES.orbitalCore, 'Server, local AI, safety gates, and owner controls.'],
                ['Paper Trading', ART_IMAGES.math, 'Strategy tests, simulated orders, costs, P/L, and decision reasons.'],
                ['Security Boundary', ART_IMAGES.strategicPillars, 'Live trading, wallet signing, and external posting stay locked until approved.'],
                ['Community Signal', ART_IMAGES.globe, 'Founder updates and public progress visuals can be generated from system state.']
            ]
        },
        '/dashboard': {
            eyebrow: 'Mission Control visual system',
            title: 'Decide what to do next without reading developer diagnostics.',
            body: 'Mission Control ties the whole build together. When fully completed, this becomes the executive overview for local AI health, paper trading, live readiness locks, treasury status, active bots, security, and community launch progress.',
            heroImage: ART_IMAGES.strategicPillars,
            cards: [
                ['Operating Core', ART_IMAGES.orbitalCore, 'Local AI engine, memory, automation, and safety state.'],
                ['Global Network', ART_IMAGES.globe, 'Chain-neutral trading, token, website, and community infrastructure.'],
                ['Strategy Signal', ART_IMAGES.math, 'Paper results and proof-driven trading progress.'],
                ['Launch Narrative', ART_IMAGES.getReal, 'Mission, ecosystem story, and public-facing progress copy.']
            ]
        },
        '/owner-setup': {
            eyebrow: 'Owner setup visual system',
            title: 'Finish local setup without terminal commands.',
            body: 'This page separates required local paper setup from optional future integrations. When fully completed, it guides a non-coder through wallets, credentials, backups, and approval gates without making optional API keys look like failures.',
            heroImage: ART_IMAGES.orbitalCore,
            cards: [
                ['Required Now', ART_IMAGES.orbitalCore, 'Local server, paper schedule, risk profile, and live locks.'],
                ['Wallet Metadata', ART_IMAGES.globe, 'Public wallet labels only. No seed phrases or private keys.'],
                ['Optional Later', ART_IMAGES.digitalWorld, 'Exchange, social, GitHub, Cloudflare, and provider integrations.'],
                ['Approval Gates', ART_IMAGES.strategicPillars, 'Future live actions require explicit owner approval.']
            ]
        },
        '/strategy-lab': {
            eyebrow: 'Trading intelligence visual system',
            title: 'Build strategies and run safe paper simulations.',
            body: 'This page turns trading ideas into structured paper tests. When fully completed, it supports indicator logic, cross-exchange arbitrage, DEX/CEX routing, spread analysis, risk controls, simulated fills, and human-readable trade explanations.',
            heroImage: ART_IMAGES.math,
            cards: [
                ['Strategy Builder', ART_IMAGES.orbitalCore, 'Plain-English and structured strategy creation.'],
                ['Arbitrage Engine', ART_IMAGES.globe, 'Venue comparison, fees, slippage, liquidity, and latency checks.'],
                ['Paper Simulation', ART_IMAGES.math, 'Safe local testing with P/L, fills, warnings, and decision logs.'],
                ['Future Live Gate', ART_IMAGES.strategicPillars, 'Production execution remains separate and owner-approved.']
            ]
        },
        '/live-trading-launch': {
            eyebrow: 'Live trading safety visual system',
            title: 'Prepare live trading through locked, owner-approved gates.',
            body: 'This page is for exchange verification, dry-run proof, tiny live test readiness, and emergency controls. When fully completed, it can move from read-only data to tightly controlled real execution without enabling autonomous scaling.',
            heroImage: ART_IMAGES.strategicPillars,
            cards: [
                ['Exchange Verification', ART_IMAGES.orbitalCore, 'Restricted API keys, balances, fees, symbol rules, and unsafe-permission checks.'],
                ['Dry-Run Proof', ART_IMAGES.math, 'Exact order previews before any production endpoint is allowed.'],
                ['Tiny Live Test', ART_IMAGES.globe, 'One exchange, one symbol, tiny size, typed confirmation, cancel path.'],
                ['Emergency Controls', ART_IMAGES.getReal, 'Kill switch, audit logs, stop controls, and rollback paths.']
            ]
        },
        '/operator-control': {
            eyebrow: 'Wallet boundary visual system',
            title: 'Connect wallet metadata without surrendering keys.',
            body: 'This page labels public wallets by purpose and keeps private key material outside the system. When fully completed, it supports isolated wallets for trading, treasury, deployment, recovery, and future hardware approval flows.',
            heroImage: ART_IMAGES.globe,
            cards: [
                ['Public Metadata', ART_IMAGES.globe, 'Address, chain, label, project, and purpose.'],
                ['Funding Separation', ART_IMAGES.strategicPillars, 'Treasury, trading, deployment, and recovery wallets stay scoped.'],
                ['No Secrets', ART_IMAGES.orbitalCore, 'No seed phrase, private key, or wallet password entry.'],
                ['Future Hardware Flow', ART_IMAGES.getReal, 'Owner-approved signing can be added later without weakening paper mode.']
            ]
        },
        '/security-lockdown': {
            eyebrow: 'Security command visual system',
            title: 'Turn security findings into clear owner actions.',
            body: 'This page translates local security checks into Safe, Review Needed, Fix Now, and Optional Later. When fully completed, it becomes the operator-facing command center for lockdown, recovery, backups, emergency shutdown, and attack-surface reduction.',
            heroImage: ART_IMAGES.orbitalCore,
            cards: [
                ['Fix Now', ART_IMAGES.strategicPillars, 'Immediate owner tasks before sensitive work continues.'],
                ['Review Needed', ART_IMAGES.digitalWorld, 'Network, device, and local service checks in plain English.'],
                ['Emergency Steps', ART_IMAGES.getReal, 'Containment instructions if compromise is suspected.'],
                ['Audit Trail', ART_IMAGES.math, 'Evidence, logs, and proof remain available in Advanced Mode.']
            ]
        },
        '/solidity-lab': {
            eyebrow: 'Token creation visual system',
            title: 'Design chain-neutral tokens, websites, logos, and launch packets.',
            body: 'This page drafts token specs, NFT utility, ecosystem use cases, website copy, whitepaper structure, roadmap, logo art, and listing evidence. When fully completed, it can guide a full token launch while deployment stays locked until owner approval.',
            heroImage: ART_IMAGES.logoMaker,
            cards: [
                ['Logo Maker', ART_IMAGES.logoMaker, 'Generate identity directions, sample art, and token visuals.'],
                ['Chain-Neutral Token', ART_IMAGES.globe, 'Polygon, Base, Solana, BNB, Avalanche, Ethereum, and future chains.'],
                ['Website And Whitepaper', ART_IMAGES.getReal, 'Use case, roadmap, tokenomics, dapp story, and launch copy.'],
                ['Listing Path', ART_IMAGES.strategicPillars, 'CoinMarketCap/CoinGecko evidence, socials, community, and proof.']
            ]
        },
        '/social-ops': {
            eyebrow: 'Community growth visual system',
            title: 'Create local community content from real project progress.',
            body: 'This page creates local drafts for founder updates, X, Discord, Telegram, Medium, YouTube, and listing evidence. When fully completed, it becomes the community manager and campaign planner for token launches while public posting stays owner-controlled.',
            heroImage: ART_IMAGES.particleGlobe,
            cards: [
                ['Founder Updates', ART_IMAGES.strategicPillars, 'Turn build progress into readable public milestones.'],
                ['Community Rooms', ART_IMAGES.globe, 'Discord, Telegram, and social launch planning.'],
                ['Articles And Video', ART_IMAGES.math, 'Medium updates, YouTube chapters, and campaign scripts.'],
                ['Listing Evidence', ART_IMAGES.getReal, 'Community growth proof and exchange/listing readiness content.']
            ]
        },
        '/creator': {
            eyebrow: 'Creator agent visual system',
            title: 'Describe the build and let EtherealAI create the local plan.',
            body: 'This page turns CEO-level ideas into executable plans before risky actions happen. When fully completed, it can coordinate coding, research, trading, Solidity, social, infrastructure, and validation agents behind owner-visible controls.',
            heroImage: ART_IMAGES.digitalWorld,
            cards: [
                ['Idea Intake', ART_IMAGES.getReal, 'Plain-English build requests without developer workflow assumptions.'],
                ['Plan First', ART_IMAGES.orbitalCore, 'Local task planning before commands or file changes.'],
                ['Agent Coordination', ART_IMAGES.globe, 'Future specialist agents for trading, code, Solidity, social, and security.'],
                ['Owner Review', ART_IMAGES.strategicPillars, 'Every critical action stays visible and logged.']
            ]
        },
        '/operator-manual': {
            eyebrow: 'Training visual system',
            title: 'Learn the operating order without developer knowledge.',
            body: 'This page teaches startup, setup, wallets, security, paper trading, live locks, proof packets, and emergency procedures. When fully completed, it becomes the built-in operating manual for a non-technical CEO.',
            heroImage: ART_IMAGES.getReal,
            cards: [
                ['Start Here', ART_IMAGES.digitalWorld, 'Mission Control, next action, and Simple Mode basics.'],
                ['Safety Rules', ART_IMAGES.strategicPillars, 'What never goes into the system and what stays locked.'],
                ['Paper Operation', ART_IMAGES.math, 'How to build, run, and review safe paper tests.'],
                ['Recovery', ART_IMAGES.orbitalCore, 'Backup, restore, shutdown, and owner control procedures.']
            ]
        },
        '/operator-training': {
            eyebrow: 'Tutorial library visual system',
            title: 'Text and video-style lessons for every major tab.',
            body: 'This page organizes the training path in order. When fully completed, every major workflow has text, transcript, video-player placeholders, pause-and-verify moments, and exact click instructions.',
            heroImage: ART_IMAGES.digitalWorld,
            cards: [
                ['Text Lessons', ART_IMAGES.getReal, 'Plain-English instructions for every page.'],
                ['Video Scripts', ART_IMAGES.particleGlobe, 'Udemy-style chapters, narration, and replayable steps.'],
                ['Safe Defaults', ART_IMAGES.strategicPillars, 'Warnings and checks before dangerous actions.'],
                ['Operator Confidence', ART_IMAGES.orbitalCore, 'Learn by clicking through the actual system.']
            ]
        },
        '/owner-proof-packet': {
            eyebrow: 'Proof packet visual system',
            title: 'Collect local evidence before owner acceptance.',
            body: 'This page packages readiness evidence, checksums, and owner acceptance records. When fully completed, it becomes the proof surface for audits, handoffs, acceptance gates, and recovery from interrupted work.',
            heroImage: ART_IMAGES.strategicPillars,
            cards: [
                ['Evidence', ART_IMAGES.orbitalCore, 'Local readiness and proof rows.'],
                ['Checksum', ART_IMAGES.math, 'Stable evidence marker for the packet.'],
                ['Acceptance', ART_IMAGES.getReal, 'Manual owner review before marking complete.'],
                ['Live Lock', ART_IMAGES.globe, 'Proof that live execution remains separated.']
            ]
        },
        '/mvp-test-pass': {
            eyebrow: 'MVP evidence visual system',
            title: 'Review the test pass without exposing live controls.',
            body: 'This page shows local MVP evidence, smoke checks, completion ledger, and live-disabled safety. When fully completed, it helps prove what works and what remains locked for future approval.',
            heroImage: ART_IMAGES.math,
            cards: [
                ['Smoke Checks', ART_IMAGES.orbitalCore, 'Paper automation and local-only behavior.'],
                ['Evidence Manifest', ART_IMAGES.strategicPillars, 'Downloadable local proof records.'],
                ['Completion Ledger', ART_IMAGES.globe, 'Local E2E complete and Live E2E locked.'],
                ['Owner Acceptance', ART_IMAGES.getReal, 'Final review routes back to the proof packet.']
            ]
        },
        '/server-route-inventory': {
            eyebrow: 'Advanced inventory visual system',
            title: 'Inspect internal routes only when intentionally in developer mode.',
            body: 'This page maps protected routes, proof coverage, and server boundaries. When fully completed, it remains the technical evidence layer behind the simple operator experience.',
            heroImage: ART_IMAGES.orbitalCore,
            cards: [
                ['Routes', ART_IMAGES.digitalWorld, 'Protected pages, APIs, and local-only surfaces.'],
                ['Boundaries', ART_IMAGES.strategicPillars, 'What each subsystem is allowed to do.'],
                ['Proof Coverage', ART_IMAGES.math, 'Evidence that owner-facing safety pages exist.'],
                ['Diagnostics', ART_IMAGES.getReal, 'Raw details stay here, not in Simple Mode.']
            ]
        }
    };

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function pagePath() {
        return window.location.pathname.replace(/\/$/, '') || '/';
    }

    function currentConfig() {
        return pageConfigs[pagePath()] || pageConfigs.default || pageConfigs['/'];
    }

    function getMode() {
        return localStorage.getItem(MODE_KEY) === 'advanced' ? 'advanced' : 'simple';
    }

    function setMode(mode) {
        localStorage.setItem(MODE_KEY, mode);
        applyMode();
    }

    function panelHeading(panel) {
        return panel.querySelector('h2')?.textContent?.trim() || '';
    }

    function isKeptForSimple(panel, config) {
        if (panel.id && (config.keepIds || []).includes(panel.id)) {
            return true;
        }

        const heading = panelHeading(panel);
        return (config.keepHeadings || []).includes(heading);
    }

    function classifyPagePanels() {
        const config = currentConfig();
        const candidates = document.querySelectorAll('.model-panel, .status-grid, .ceo-workflow-map, .home-hero, .home-workflows, .next-actions, .auth-proof-banner');

        candidates.forEach(panel => {
            panel.classList.remove('operator-simple-keep', 'operator-simple-collapsed');

            if (panel.id === 'simple-operator-workspace' || panel.closest('#simple-operator-workspace')) {
                return;
            }

            if (panel.classList.contains('operator-guided-focus')) {
                panel.classList.add('operator-simple-keep');
                return;
            }

            if (panel.classList.contains('model-panel') && isKeptForSimple(panel, config)) {
                panel.classList.add('operator-simple-keep');
                return;
            }

            panel.classList.add('operator-simple-collapsed');
        });

        document.querySelectorAll('.advanced-operator-tools, .comparison-table, .model-output, .timeline-list, .owner-gate-list, .compact-details').forEach(panel => {
            if (!panel.closest('.operator-simple-keep')) {
                panel.classList.add('operator-simple-collapsed');
            }
        });
    }

    function renderCards(cards = []) {
        return cards.map(([title, body]) => `
            <article class="operator-task-card">
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(body)}</span>
            </article>
        `).join('');
    }

    function actionMarkup(action = {}) {
        if (action.kind === 'next') {
            return '<button type="button" class="operator-primary-action" data-operator-next data-operator-recommended-action>What should I do next?</button>';
        }

        if (action.href) {
            return `<a class="operator-primary-action" href="${escapeHtml(action.href)}" data-operator-recommended-action>${escapeHtml(action.label)}</a>`;
        }

        return `<button type="button" class="operator-primary-action" data-operator-click="${escapeHtml(action.selector || '')}" data-operator-recommended-action>${escapeHtml(action.label || 'Continue')}</button>`;
    }

    function stepActionMarkup(action = {}) {
        if (action.kind === 'next') {
            return '<button type="button" data-operator-next>What should I do next?</button>';
        }

        if (action.href) {
            return `<a href="${escapeHtml(action.href)}">${escapeHtml(action.label || 'Open')}</a>`;
        }

        return `<button type="button" data-operator-click="${escapeHtml(action.selector || '')}">${escapeHtml(action.label || 'Open')}</button>`;
    }

    function trainingDropdownMarkup(extraClass = '') {
        return `
            <div class="operator-training-menu ${escapeHtml(extraClass)}">
                <button type="button" class="operator-secondary-action" data-operator-training-toggle aria-haspopup="true" aria-expanded="false">Show me how</button>
                <div class="operator-training-menu-list" hidden>
                    <button type="button" data-operator-training-choice="text">Show me in text</button>
                    <button type="button" data-operator-training-choice="video">Show me in video</button>
                </div>
            </div>
        `;
    }

    function renderWorkflow(steps = []) {
        if (!steps.length) {
            return '';
        }

        return `
            <section class="operator-guided-workflow" data-operator-workflow>
                <div>
                    <h2>Guided Workflow</h2>
                    <p>Use these steps in order. Each step has one visible button, and advanced records stay hidden unless you open Advanced Mode.</p>
                </div>
                <div class="operator-workflow-steps">
                    ${steps.map(([title, body, action]) => `
                        <article class="operator-workflow-step">
                            <strong>${escapeHtml(title)}</strong>
                            <span>${escapeHtml(body)}</span>
                            ${stepActionMarkup(action)}
                        </article>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function fallbackArtShowcase(config = {}) {
        const area = config.area || 'EtherealAI';

        return {
            eyebrow: `${area} visual system`,
            title: `${area} operator surface.`,
            body: `${config.summary || 'Use this page for the current workflow.'} When fully completed, this surface will combine guided controls, safety boundaries, local AI output, and owner-visible proof for this part of EtherealAI.`,
            heroImage: ART_IMAGES.digitalWorld,
            cards: [
                ['Current Page', ART_IMAGES.orbitalCore, `Controls and status for ${area}.`],
                ['System Link', ART_IMAGES.globe, 'How this area connects to trading, automation, token, website, social, and security infrastructure.'],
                ['Safe Operation', ART_IMAGES.strategicPillars, 'Owner-visible boundaries, locks, and next actions.'],
                ['Future Potential', ART_IMAGES.getReal, 'What this area can become as the full operating system is completed.']
            ]
        };
    }

    function renderCommunityShowcase(config = currentConfig()) {
        const showcase = pageArtShowcases[pagePath()] || fallbackArtShowcase(config);
        const cards = showcase.cards || fallbackArtShowcase(config).cards;

        return `
            <section class="operator-community-showcase" aria-label="${escapeHtml(config.area || 'EtherealAI')} visual art showcase">
                <div class="operator-community-hero">
                    <img src="${escapeHtml(showcase.heroImage || ART_IMAGES.digitalWorld)}" alt="${escapeHtml(config.area || 'EtherealAI')} visual system artwork">
                    <div>
                        <span>${escapeHtml(showcase.eyebrow)}</span>
                        <strong>${escapeHtml(showcase.title)}</strong>
                        <p>${escapeHtml(showcase.body)}</p>
                    </div>
                </div>
                <div class="operator-community-art-grid">
                    ${cards.map(([title, image, body]) => `
                        <article>
                            <img src="${escapeHtml(image)}" alt="${escapeHtml(title)} artwork">
                            <strong>${escapeHtml(title)}</strong>
                            <span>${escapeHtml(body)}</span>
                        </article>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderReadiness(summary = null, config = {}) {
        const owner = summary?.owner?.wizard;
        const security = summary?.security?.audit;
        const health = summary?.health;
        const localE2eComplete = Boolean(owner?.coreSetup?.localEndToEndOperational)
            || owner?.progress?.localEndToEnd?.status === 'complete'
            || Number(owner?.progress?.localEndToEnd?.current || 0) >= 100;
        const coreComplete = localE2eComplete || Boolean(owner?.coreSetup?.paperTradingOperational)
            || owner?.status === 'local_paper_trading_ready'
            || Number(owner?.progress?.paperTrading?.current || 0) >= 100;
        const walletCount = owner?.walletMetadata?.savedPublicWallets?.length ?? 0;
        const liveLocked = !owner?.safetyBoundary?.liveTradingEnabled && !owner?.safetyBoundary?.walletSigningEnabled;
        const serverHealthy = health?.server?.ok && health?.database?.ok;
        const securityText = (security?.summary?.failCount ?? 0) > 0
            ? 'Fix Now'
            : ((security?.summary?.reviewCount ?? 0) > 0 ? 'Review Needed' : 'Safe');

        return `
            <section class="operator-answer-panel" data-operator-answers>
                <article>
                    <span>What is this?</span>
                    <strong>${escapeHtml(config.area || 'Operator Workspace')}</strong>
                    <p>${escapeHtml(config.summary || 'Use the guided controls for this page.')}</p>
                </article>
                <article>
                    <span>Is it ready?</span>
                    <strong>${escapeHtml(localE2eComplete ? 'Local E2E Complete' : (coreComplete ? (config.readyLabel || 'Ready') : 'Not Ready'))}</strong>
                    <p>${serverHealthy ? 'Local server is responding.' : 'Local server status needs review.'}</p>
                </article>
                <article>
                    <span>What should I do next?</span>
                    <strong>${escapeHtml(coreComplete ? 'Operate paper safely' : 'Finish local paper setup')}</strong>
                    <p>${escapeHtml(config.nextText || 'Use the recommended button first.')}</p>
                </article>
                <article>
                    <span>Safety</span>
                    <strong>${liveLocked ? 'Live E2E Locked' : 'Unsafe'}</strong>
                    <p>Wallet metadata: ${walletCount > 0 ? 'Present' : 'Optional'} · Security: ${securityText}</p>
                </article>
            </section>
        `;
    }

    function renderStatus(summary = null) {
        const owner = summary?.owner?.wizard;
        const bot = summary?.bot?.capabilityPath;
        const security = summary?.security?.audit;
        const health = summary?.health;
        const serverHealthy = health?.server?.ok && health?.database?.ok;
        const liveLocked = !owner?.safetyBoundary?.liveTradingEnabled && !owner?.safetyBoundary?.walletSigningEnabled;
        const localE2eComplete = Boolean(owner?.coreSetup?.localEndToEndOperational)
            || owner?.progress?.localEndToEnd?.status === 'complete'
            || Number(owner?.progress?.localEndToEnd?.current || 0) >= 100;
        const paperWorking = Boolean(owner?.coreSetup?.paperTradingOperational)
            || owner?.status === 'local_paper_trading_ready'
            || Number(owner?.progress?.paperTrading?.current || 0) >= 100;
        const savedWalletCount = owner?.walletMetadata?.savedPublicWallets?.length ?? 0;
        const securityValue = (security?.summary?.failCount ?? 0) > 0
            ? 'Unsafe'
            : ((security?.summary?.reviewCount ?? 0) > 0 ? 'Optional' : 'Working');
        const statuses = [
            ['Health', serverHealthy ? 'Working' : 'Unsafe', serverHealthy ? 'Local server is responding.' : 'Open Mission Control and refresh status.'],
            ['Local E2E', localE2eComplete ? 'Working' : (paperWorking ? 'Optional' : 'Unsafe'), localE2eComplete ? 'Local E2E complete for paper operation.' : 'Add public wallet metadata if needed.'],
            ['Paper Trading', paperWorking ? 'Working' : 'Unsafe', `${bot?.paperAutomation?.counts?.activeSchedules ?? 0} active paper schedule(s).`],
            ['Live E2E', liveLocked ? 'Locked' : 'Unsafe', liveLocked ? 'Future approval required; this is not a failure.' : 'Live or signing appears enabled. Review immediately.'],
            ['Wallets', savedWalletCount > 0 ? 'Working' : 'Optional', `${savedWalletCount} public metadata record(s).`],
            ['Security', securityValue, `${security?.summary?.failCount ?? 0} fix-now item(s).`]
        ];

        return statuses.map(([label, value, note]) => `
            <article class="operator-status-tile">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
                <small>${escapeHtml(note)}</small>
            </article>
        `).join('');
    }

    async function loadSummary() {
        if (!window.EtherealOperatorAssistant?.collectState) {
            return null;
        }

        try {
            return await window.EtherealOperatorAssistant.collectState();
        } catch (error) {
            return { error: error.message };
        }
    }

    async function renderWorkspace() {
        if (document.getElementById('simple-operator-workspace')) {
            return;
        }

        const config = currentConfig();
        const host = document.querySelector('main') || document.querySelector('.container') || document.body;
        const workspace = document.createElement('section');
        workspace.id = 'simple-operator-workspace';
        workspace.className = 'simple-operator-workspace';
        workspace.innerHTML = `
            <div class="operator-page-label">Simple Operator Mode</div>
            <div class="operator-workspace-header">
                <div class="operator-brand-heading">
                    <img src="${BRAND_LOGO_SRC}" alt="EtherealAI logo" class="operator-brand-logo">
                    <div>
                        <p class="operator-area">${escapeHtml(config.area)}</p>
                        <h1>${escapeHtml(config.title)}</h1>
                        <p>${escapeHtml(config.summary)}</p>
                    </div>
                </div>
                <div class="operator-workspace-actions">
                    ${actionMarkup(config.primaryAction)}
                    ${trainingDropdownMarkup('operator-workspace-training-menu')}
                    <button type="button" class="operator-secondary-action" data-operator-mode="advanced">Advanced Developer Mode</button>
                </div>
            </div>
            <div id="operator-simple-status" class="operator-status-grid">
                <article class="operator-status-tile"><span>Status</span><strong>Loading</strong><small>Checking local system.</small></article>
            </div>
            ${renderCommunityShowcase(config)}
            <div id="operator-simple-answers">${renderReadiness(null, config)}</div>
            ${renderWorkflow(config.workflow || [])}
            <div class="operator-task-grid">
                ${renderCards(config.cards)}
            </div>
            <div class="operator-manual-link-row">
                <a href="/operator-manual">Start Here / Operator Manual</a>
                <a href="/operator-training">Operator Training Library</a>
                <span>No terminal commands are required for normal Simple Mode operation.</span>
            </div>
        `;

        host.prepend(workspace);

        const summary = await loadSummary();
        document.getElementById('operator-simple-status').innerHTML = renderStatus(summary);
        document.getElementById('operator-simple-answers').innerHTML = renderReadiness(summary, config);
    }

    function renderModeBar() {
        if (document.getElementById('operator-mode-bar')) {
            return;
        }

        const bar = document.createElement('div');
        bar.id = 'operator-mode-bar';
        bar.className = 'operator-mode-bar';
        bar.innerHTML = `
            <a class="operator-dapp-wordmark" href="/dashboard" data-operator-home-base aria-label="Open EtherealAI Mission Control home base">ETHEREAL</a>
            <div class="operator-mode-brand">
                <img src="${BRAND_LOGO_SRC}" alt="EtherealAI logo" class="operator-mode-logo">
                <div>
                    <strong id="operator-mode-label">Simple Operator Mode</strong>
                    <span>Daily CEO controls are simplified. Advanced diagnostics stay hidden until you choose them.</span>
                </div>
            </div>
            <div class="operator-dapp-safety-strip" aria-label="Execution safety state">
                <span>LOCAL E2E 100%</span>
                <strong>LIVE LOCKED</strong>
            </div>
            <div class="operator-mode-actions">
                ${trainingDropdownMarkup('operator-mode-training-menu')}
                <button type="button" data-operator-mode="simple">Simple Mode</button>
                <button type="button" data-operator-mode="advanced">Advanced Mode</button>
                <a class="operator-logout-action" href="/logout">Logout</a>
            </div>
        `;

        const nav = document.querySelector('nav') || document.querySelector('header') || document.body.firstElementChild;
        if (nav?.parentNode) {
            nav.parentNode.insertBefore(bar, nav.nextSibling);
        } else {
            document.body.prepend(bar);
        }
    }

    function applyMode() {
        const mode = getMode();
        document.body.classList.toggle('operator-simple-mode', mode === 'simple');
        document.body.classList.toggle('operator-advanced-mode', mode === 'advanced');
        document.getElementById('operator-mode-label')?.replaceChildren(document.createTextNode(
            mode === 'simple' ? 'Simple Operator Mode' : 'Advanced Developer Mode'
        ));
    }

    function runAction(selector) {
        if (!selector) {
            return;
        }

        const target = document.querySelector(selector);
        if (!target) {
            return;
        }

        const panel = target.classList?.contains('model-panel') || target.classList?.contains('ceo-workflow-map')
            ? target
            : target.closest('.model-panel, .ceo-workflow-map, details, section');
        if (panel && panel.id !== 'simple-operator-workspace' && !panel.closest('#simple-operator-workspace')) {
            panel.classList.add('operator-guided-focus', 'operator-simple-keep');
            panel.classList.remove('operator-simple-collapsed');
            if (panel.tagName === 'DETAILS') {
                panel.open = true;
            }
        }
        classifyPagePanels();
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('operator-highlight-target');
        setTimeout(() => target.classList.remove('operator-highlight-target'), 1800);

        if (target.tagName === 'BUTTON' && !target.disabled) {
            target.click();
        }
    }

    function tutorialSteps() {
        return tutorialScripts[pagePath()] || tutorialScripts.default;
    }

    function showTutorial() {
        const steps = tutorialSteps();
        let index = 0;
        let overlay = document.getElementById('operator-tutorial-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'operator-tutorial-overlay';
            overlay.className = 'operator-tutorial-overlay';
            document.body.appendChild(overlay);
        }

        function draw() {
            const [title, body] = steps[index];
            document.querySelectorAll('.operator-highlight-target').forEach(item => item.classList.remove('operator-highlight-target'));
            const recommended = document.querySelector('[data-operator-recommended-action]');
            recommended?.classList.add('operator-highlight-target');
            overlay.innerHTML = `
                <section class="operator-tutorial-card" role="dialog" aria-modal="true" aria-label="Operator tutorial">
                    <div class="operator-page-label">YouTube-style walkthrough · Chapter ${index + 1} of ${steps.length}</div>
                    <h2>${escapeHtml(title)}</h2>
                    <p>${escapeHtml(body)}</p>
                    <div class="operator-tutorial-script">
                        <strong>Script:</strong>
                        <span>${escapeHtml(body)} The recommended next button is highlighted on the page. Pause here, complete the visible action, then continue to the next chapter.</span>
                    </div>
                    <div class="button-row">
                        <button type="button" data-tutorial-prev ${index === 0 ? 'disabled' : ''}>Back</button>
                        <button type="button" data-tutorial-next>${index === steps.length - 1 ? 'Finish' : 'Next'}</button>
                        <button type="button" data-tutorial-close>Close</button>
                    </div>
                </section>
            `;

            overlay.querySelector('[data-tutorial-prev]')?.addEventListener('click', () => {
                index = Math.max(0, index - 1);
                draw();
            });
            overlay.querySelector('[data-tutorial-next]')?.addEventListener('click', () => {
                if (index >= steps.length - 1) {
                    overlay.remove();
                    return;
                }
                index += 1;
                draw();
            });
            overlay.querySelector('[data-tutorial-close]')?.addEventListener('click', () => {
                document.querySelectorAll('.operator-highlight-target').forEach(item => item.classList.remove('operator-highlight-target'));
                overlay.remove();
            });
        }

        draw();
    }

    function bindGlobalActions() {
        document.addEventListener('click', event => {
            const modeButton = event.target.closest('[data-operator-mode]');
            if (modeButton) {
                setMode(modeButton.dataset.operatorMode);
                return;
            }

            const trainingToggle = event.target.closest('[data-operator-training-toggle]');
            if (trainingToggle) {
                const menu = trainingToggle.closest('.operator-training-menu');
                const list = menu?.querySelector('.operator-training-menu-list');
                const shouldOpen = Boolean(list?.hidden);
                document.querySelectorAll('.operator-training-menu-list').forEach(item => {
                    item.hidden = true;
                    item.closest('.operator-training-menu')?.querySelector('[data-operator-training-toggle]')?.setAttribute('aria-expanded', 'false');
                });
                if (list) {
                    list.hidden = !shouldOpen;
                    trainingToggle.setAttribute('aria-expanded', String(shouldOpen));
                }
                return;
            }

            const trainingChoice = event.target.closest('[data-operator-training-choice]');
            if (trainingChoice) {
                trainingChoice.closest('.operator-training-menu-list')?.setAttribute('hidden', '');
                trainingChoice.closest('.operator-training-menu')?.querySelector('[data-operator-training-toggle]')?.setAttribute('aria-expanded', 'false');
                if (window.EtherealTraining?.open) {
                    window.EtherealTraining.open(trainingChoice.dataset.operatorTrainingChoice, pagePath());
                } else {
                    showTutorial();
                }
                return;
            }

            if (event.target.closest('[data-operator-tutorial]')) {
                showTutorial();
                return;
            }

            if (event.target.closest('[data-operator-next]')) {
                window.EtherealOperatorAssistant?.show();
                return;
            }

            const clickButton = event.target.closest('[data-operator-click]');
            if (clickButton) {
                runAction(clickButton.dataset.operatorClick);
                return;
            }

            if (!event.target.closest('.operator-training-menu')) {
                document.querySelectorAll('.operator-training-menu-list').forEach(item => {
                    item.hidden = true;
                    item.closest('.operator-training-menu')?.querySelector('[data-operator-training-toggle]')?.setAttribute('aria-expanded', 'false');
                });
            }
        });
    }

    async function boot() {
        renderModeBar();
        classifyPagePanels();
        applyMode();
        bindGlobalActions();
        await renderWorkspace();
        applyMode();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}());
