(function () {
    const TRAINING_LIBRARY_PATH = '/operator-training';
    const BASE_SAFETY = [
        'Live trading stays locked unless a separate owner-approved live process is built and approved later.',
        'Wallet signing stays locked. EtherealAI should never ask for a seed phrase, private key, recovery phrase, wallet password, or bank password.',
        'Optional API keys, social tokens, provider keys, GitHub, and Cloudflare credentials are future integrations, not local paper-trading setup failures.'
    ];

    const modules = [
        {
            id: 'start-etherealai',
            tab: 'Home',
            path: '/',
            title: 'Start EtherealAI',
            libraryTitle: 'Start EtherealAI',
            purpose: 'Use Home as the front door. It tells you whether the local app is reachable, whether Local E2E is complete, whether Live E2E is locked, and where to go next.',
            buttons: [
                ['Open Mission Control', 'Opens the main operator dashboard for health, readiness, wallets, bots, and security.'],
                ['What should I do next?', 'Asks EtherealAI to choose the next safest action from current local state.'],
                ['Open Setup Wizard', 'Opens the owner setup flow when a required local paper step needs attention.'],
                ['Open Paper Trading Center', 'Jumps to Strategy / Paper / Bots for paper plans, schedules, and results.']
            ],
            fields: [
                ['No normal entry fields', 'Home is for reading status and choosing the next page.']
            ],
            doNotEnter: [
                'Do not paste wallet secrets, exchange keys, or personal credentials anywhere on Home.',
                'Do not treat Live E2E Locked as a failure. It is the correct safe state.'
            ],
            order: [
                'Confirm the proof strip says Local E2E and Live E2E locked.',
                'Press What should I do next.',
                'Follow the one recommended page link.',
                'Return to Home when you want a clean starting point.'
            ],
            safeDefaults: [
                'Stay in Simple Operator Mode.',
                'Use What should I do next before opening Advanced Tools.'
            ],
            errors: [
                ['Login required', 'Open Login, sign in locally, then return to Home.'],
                ['Health says Unsafe', 'Open Mission Control or Security before expanding automation.']
            ],
            success: [
                'You can see Local E2E status, Live E2E Locked, and one recommended next action.',
                'No raw JSON, terminal commands, or provider-key warnings are visible in Simple Mode.'
            ],
            video: {
                duration: '7 minutes',
                assetSlug: 'start-etherealai',
                chapters: [
                    {
                        title: 'Start at the proof strip',
                        screen: 'Home header and Simple Operator Mode banner',
                        narration: 'Start at the top of the screen. The proof strip tells you the basic safety state before you click anything.',
                        click: 'No click yet. Read the strip and confirm Live E2E says locked.',
                        pause: 'Pause here and verify you are in Simple Operator Mode.'
                    },
                    {
                        title: 'Ask for the next safe action',
                        screen: 'Large green What should I do next button',
                        narration: 'This button is the safest way to operate EtherealAI. It reads local state and chooses the next action without exposing developer details.',
                        click: 'Click What should I do next.',
                        pause: 'Pause here and read the recommendation before moving pages.'
                    },
                    {
                        title: 'Use Home as the reset point',
                        screen: 'Main Operating Areas',
                        narration: 'If you ever feel lost, come back here. Home gives you the simplest path into setup, security, paper trading, and proof records.',
                        click: 'Click only the page that matches the recommendation.',
                        pause: 'Pause here and confirm you did not open Advanced Tools unless you meant to.'
                    }
                ]
            }
        },
        {
            id: 'read-mission-control',
            tab: 'Mission Control',
            path: '/dashboard',
            title: 'Read Mission Control',
            libraryTitle: 'Read Mission Control',
            purpose: 'Mission Control is the executive dashboard. It shows health, Local E2E readiness, Live E2E lock state, model status, wallet status, bots, and security.',
            buttons: [
                ['What should I do next?', 'Chooses the safest next action from the current system state.'],
                ['Refresh Mission Control', 'Reloads current readiness and health data.'],
                ['Open Paper Trading', 'Takes you to paper plans, schedules, and results.'],
                ['Open Security Review', 'Takes you to plain-English security tasks.'],
                ['Export System Memory JSON', 'Creates a local evidence snapshot for handoff and recovery.']
            ],
            fields: [
                ['No beginner-required fields', 'Mission Control is primarily a read-and-click page.']
            ],
            doNotEnter: [
                'Do not paste API keys into Mission Control.',
                'Do not unlock live trading from Mission Control. Live E2E locked is expected.'
            ],
            order: [
                'Read Local E2E first.',
                'Confirm Live E2E is locked.',
                'Check Security status.',
                'Click What should I do next.',
                'Use exports only when you want local proof or handoff evidence.'
            ],
            safeDefaults: [
                'Local E2E Complete is good.',
                'Live E2E Locked is good.',
                'Advanced diagnostics can stay hidden.'
            ],
            errors: [
                ['Local server status needs review', 'Refresh the page. If it remains unhealthy, restart the local server before operating.'],
                ['Security shows Fix Now', 'Open Security and handle those items before creating new automation.']
            ],
            success: [
                'Mission Control clearly says Local E2E Complete.',
                'Live E2E remains locked.',
                'The recommended next action is not asking for optional chain-provider keys.'
            ],
            video: {
                duration: '9 minutes',
                assetSlug: 'read-mission-control',
                chapters: [
                    {
                        title: 'Read the readiness cards',
                        screen: 'Mission Control top cards',
                        narration: 'Mission Control is not a developer dashboard in Simple Mode. Read Local E2E, Live E2E, wallets, bots, and security like an executive status board.',
                        click: 'No click yet. Read the cards from left to right.',
                        pause: 'Pause here and confirm Live E2E is locked.'
                    },
                    {
                        title: 'Use the recommendation',
                        screen: 'What should I do next panel',
                        narration: 'The assistant should recommend operating actions like building a strategy or reviewing paper results, not optional provider-key setup.',
                        click: 'Click What should I do next.',
                        pause: 'Pause here and verify the action is plain English.'
                    },
                    {
                        title: 'Export only when useful',
                        screen: 'System Memory export section',
                        narration: 'Exports are local evidence. Use them before a restart, handoff, or major change. They do not enable live trading.',
                        click: 'Click Export System Memory JSON only when you need a local proof snapshot.',
                        pause: 'Pause here and confirm no secrets are shown.'
                    }
                ]
            }
        },
        {
            id: 'connect-apis-safely',
            tab: 'API Connection Center',
            path: '/api-connection-center',
            title: 'Connect APIs Safely',
            libraryTitle: 'Connect API Connection Center',
            purpose: 'API Connection Center is the CEO setup surface for Kraken first, Coinbase next, and DEX read-only research lanes. It keeps secrets in local encrypted vaults and keeps execution locked.',
            buttons: [
                ['Refresh API Status', 'Loads Kraken, Coinbase, wallet metadata, and DEX read-only status.'],
                ['Replace Kraken Key', 'Opens the safe local vault replacement form. This does not place orders.'],
                ['Test Kraken Read/Account Access', 'Runs authenticated Kraken read checks only.'],
                ['Run Kraken Dry-Run Proof', 'Builds a no-order preview and confirms the production endpoint remains blocked.'],
                ['Save Coinbase Key Safely', 'Saves a Coinbase read-only key to the encrypted read-only vault.'],
                ['Test Coinbase Read-Only Connection', 'Checks Coinbase read/account access without trading.'],
                ['Run Read-Only Price Compare', 'Compares public market data without exchange orders, swaps, withdrawals, or wallet signing.']
            ],
            fields: [
                ['Kraken API key', 'Paste only the restricted Kraken API key when replacing the saved key.'],
                ['Kraken private key / secret', 'Paste only the Kraken private key shown by Kraken, then the field is cleared after save.'],
                ['Coinbase API key', 'Paste a View/read-only Coinbase key.'],
                ['Coinbase API secret', 'Paste the Coinbase secret shown during key creation.'],
                ['Coinbase passphrase', 'Paste the Coinbase passphrase if Coinbase shows one.']
            ],
            doNotEnter: [
                'Do not enter seed phrases, wallet private keys, recovery phrases, bank passwords, or exchange withdrawal keys.',
                'Do not create keys with withdrawals, transfers, margin, futures, leverage, admin, manage, or unrestricted trade permissions for this phase.',
                'Do not treat DEX read-only as wallet connection. DEX swaps and approvals remain locked.'
            ],
            order: [
                'Refresh API Status.',
                'If Kraken needs repair, replace the key or test read/account access.',
                'Run Kraken dry-run proof only after the saved key is verified.',
                'Use Coinbase read-only setup after Kraken status is clear.',
                'Use DEX lanes for token, pair, pool, liquidity, price, and quote research only.'
            ],
            safeDefaults: [
                'Kraken first.',
                'Coinbase read-only next.',
                'DEX public/read-only only.',
                'Live order placement, swaps, wallet signing, withdrawals, deployments, and public submissions stay locked.'
            ],
            errors: [
                ['Kraken key missing', 'Click Replace Kraken Key and save a restricted spot key in the encrypted local vault.'],
                ['Unsafe permission detected', 'Delete the key and recreate it without withdrawals, transfers, margin, futures, leverage, or admin permissions.'],
                ['Coinbase connector missing', 'Click Create Coinbase Connector or Save Coinbase Key Safely. The app will create the placeholder before saving.'],
                ['DEX provider draft', 'This is normal. Draft means read-only provider planning is registered and execution is locked.']
            ],
            success: [
                'Kraken shows connected or ready without any production endpoint call.',
                'Coinbase can be saved and tested as read-only.',
                'DEX read-only lanes explain what is safe now and what remains locked.',
                'Advanced raw JSON is hidden unless Advanced Mode is opened.'
            ],
            video: {
                duration: '11 minutes',
                assetSlug: 'connect-apis-safely',
                chapters: [
                    {
                        title: 'Read the safety boundary first',
                        screen: 'API Connection Center top cards',
                        narration: 'Start by confirming the page says live safety is locked. API setup is about read access, dry-run proof, and quote research, not execution.',
                        click: 'Click Refresh API Status.',
                        pause: 'Pause here and confirm the Live Safety card says locked.'
                    },
                    {
                        title: 'Kraken first',
                        screen: 'Kraken Safe Setup And Readiness panel',
                        narration: 'The Kraken panel shows whether a key exists, whether dry-run proof is ready, and whether the production endpoint has ever been called.',
                        click: 'Click Test Kraken Read/Account Access only if the key is saved. Click Run Kraken Dry-Run Proof after verification.',
                        pause: 'Pause here and verify the blocker list is plain English.'
                    },
                    {
                        title: 'Coinbase read-only next',
                        screen: 'Coinbase Advanced Read-Only Setup panel',
                        narration: 'Coinbase is next, but it stays read-only. The key must have View permission only. Transfers and trading stay disabled.',
                        click: 'Paste the Coinbase read-only values only when you intentionally choose to connect Coinbase.',
                        pause: 'Pause here and verify the confirmation statement before saving.'
                    },
                    {
                        title: 'DEX lanes are research only',
                        screen: 'DEX Read-Only Connector Lane',
                        narration: 'DEX lanes help with token, pair, pool, price, liquidity, and quote research. They do not connect a wallet and cannot swap.',
                        click: 'Click Run Read-Only Price Compare when you want a safe public-data check.',
                        pause: 'Pause here and confirm no wallet signing was requested.'
                    }
                ]
            }
        },
        {
            id: 'complete-setup-wizard',
            tab: 'Setup Wizard',
            path: '/owner-setup',
            title: 'Complete Setup Wizard',
            libraryTitle: 'Complete Setup Wizard',
            purpose: 'Setup Wizard verifies the local paper system, Local E2E readiness, public wallet metadata, optional future integrations, and Live E2E lock state.',
            buttons: [
                ['Refresh / Verify All', 'Reloads setup state and checks all gates.'],
                ['Run Paper Verification', 'Runs a local paper-only verification cycle. It does not use real money or wallet signing.'],
                ['Add Public Wallet', 'Scrolls to the safe public-wallet metadata form.'],
                ['Skip Optional Integrations For Now', 'Confirms API keys and provider keys can wait.'],
                ['Show Advanced Variable Names', 'Shows raw env names for technical review only.']
            ],
            fields: [
                ['Wallet Label', 'A plain name like Treasury public wallet or Trading research wallet 1.'],
                ['Wallet Type', 'Choose hardware, watch-only, browser extension, mobile, multisig, or other reference.'],
                ['Chain Family', 'Choose EVM, Solana, Bitcoin, Cosmos, or custom.'],
                ['Network', 'Type the actual chain for this wallet, such as base, polygon, ethereum, bnb-chain, avalanche, or solana.'],
                ['Public Address Only', 'Paste only the public wallet address.'],
                ['Assignments', 'Optional labels like trading-research, token-deployment, or treasury.']
            ],
            doNotEnter: [
                'Do not enter seed phrases, recovery phrases, private keys, wallet passwords, passphrases, bank passwords, or API secrets in wallet fields.',
                'Do not add chain-provider keys unless you intentionally open optional future integrations.'
            ],
            order: [
                'Read the Core Setup or Local E2E banner.',
                'Run paper verification if paper status needs review.',
                'Add public wallet metadata through the UI.',
                'Skip optional integrations unless you are intentionally preparing future external connections.',
                'Confirm Live E2E remains locked.'
            ],
            safeDefaults: [
                'Use public wallet metadata only.',
                'Keep Live E2E locked.',
                'Skip optional integrations for normal local paper operation.'
            ],
            errors: [
                ['Public wallet missing', 'Click Add Public Wallet and save a public address only.'],
                ['Paper verification not ready', 'Open Strategy / Paper / Bots and create a safe paper plan or schedule.'],
                ['Optional connection missing', 'Ignore it in Simple Mode unless you intentionally need that future integration.']
            ],
            success: [
                'Local E2E Complete is visible.',
                'Live E2E Locked is visible.',
                'At least one public wallet metadata record is saved.',
                'No live trading or wallet signing was enabled.'
            ],
            video: {
                duration: '13 minutes',
                assetSlug: 'complete-setup-wizard',
                chapters: [
                    {
                        title: 'Read the setup banner',
                        screen: 'Setup Wizard Progress section',
                        narration: 'Start with the banner. If Local E2E is complete, you are ready for local paper operation. Live E2E locked is correct.',
                        click: 'Click Refresh / Verify All.',
                        pause: 'Pause here and confirm Local E2E and Live E2E are separate.'
                    },
                    {
                        title: 'Add public wallet metadata',
                        screen: 'Add Public Wallet Address form',
                        narration: 'This is metadata only. You are telling EtherealAI what public wallet belongs to which purpose. You are not giving it the keys.',
                        click: 'Click Add Public Wallet, enter label, chain family, network, public address, and assignments, then click Save Public Wallet Metadata.',
                        pause: 'Pause here and verify you pasted only a public address.'
                    },
                    {
                        title: 'Skip future integrations',
                        screen: 'Optional Future Connections',
                        narration: 'Provider keys, exchanges, socials, GitHub, and Cloudflare are optional later. They must not block local paper operation.',
                        click: 'Click Skip Optional Integrations For Now.',
                        pause: 'Pause here and confirm no optional key is shown as a failure.'
                    }
                ]
            }
        },
        {
            id: 'add-wallet-metadata-safely',
            tab: 'Wallet & Funding',
            path: '/operator-control',
            title: 'Add Wallet Metadata Safely',
            libraryTitle: 'Add Wallet Metadata Safely',
            purpose: 'Wallet & Funding lets you label public wallets, assign them to projects, review permissions, and revoke metadata records without giving EtherealAI signing keys.',
            buttons: [
                ['Review Wallet Readiness', 'Refreshes the wallet control summary.'],
                ['Attach Wallet Metadata', 'Saves the public metadata form.'],
                ['Review Readiness', 'Records that the wallet metadata was reviewed safely.'],
                ['Revoke', 'Disables a wallet metadata record in an emergency or when it should no longer be used.']
            ],
            fields: [
                ['Wallet Label', 'A readable owner label.'],
                ['Wallet Type', 'Hardware, multisig, browser extension, mobile, watch only, custody reference, or other reference.'],
                ['Chain Family', 'The technical family, such as EVM or Solana.'],
                ['Network', 'The specific chain for this wallet. Choose per wallet; no chain is default.'],
                ['Public Address', 'The public address only.'],
                ['Connection Method', 'How future owner approval might happen, such as hardware confirmation or WalletConnect.'],
                ['Local Connector Reference ID', 'Optional metadata ID only. Leave blank unless Advanced Mode told you to use one.'],
                ['Project Assignments', 'Project labels such as etherealai-token, trading-lab, or recovery.'],
                ['Permission Scope', 'Leave risky permissions blocked.'],
                ['Owner Notes', 'Plain notes only, never secrets.']
            ],
            doNotEnter: [
                'Do not enter seed phrases, private keys, wallet passwords, recovery phrases, or exchange API keys.',
                'Do not enable request_signature, deploy_contract, transfer_assets, trade_execution, or treasury_spend unless a future approval flow explicitly exists.'
            ],
            order: [
                'Choose the wallet purpose.',
                'Enter label, type, chain family, network, and public address.',
                'Keep permissions blocked or paper-only.',
                'Save metadata.',
                'Review readiness and confirm signing stays disabled.'
            ],
            safeDefaults: [
                'Status: Configured Metadata.',
                'Permission scope: blocked for risky actions.',
                'Trade execution: paper only.'
            ],
            errors: [
                ['Invalid public address', 'Check that you pasted the public address for the selected chain.'],
                ['Permission review required', 'Leave risky permissions blocked and save again.'],
                ['Wallet revoked', 'Create a new metadata record only after you confirm the wallet is safe outside EtherealAI.']
            ],
            success: [
                'Wallet appears in Connected Wallets.',
                'Signing enabled remains false.',
                'Live execution remains false.',
                'Revoke is available as an emergency metadata shutdown.'
            ],
            video: {
                duration: '12 minutes',
                assetSlug: 'wallet-metadata-safely',
                chapters: [
                    {
                        title: 'Understand public metadata',
                        screen: 'Wallet & Funding Center intro',
                        narration: 'This page does not take your keys. It records public wallet labels so projects and bots know which public address belongs to which purpose.',
                        click: 'Click Review Wallet Readiness.',
                        pause: 'Pause here and confirm signing is disabled.'
                    },
                    {
                        title: 'Fill the wallet form',
                        screen: 'Attach Wallet Metadata form',
                        narration: 'Use a label you will recognize, choose the chain family and network, then paste the public address only.',
                        click: 'Fill Wallet Label, Wallet Type, Chain Family, Network, Public Address, and Project Assignments.',
                        pause: 'Pause here and verify there is no private key in the form.'
                    },
                    {
                        title: 'Save and review',
                        screen: 'Connected Wallets',
                        narration: 'After saving, the wallet record should be visible and safe. If anything looks wrong, revoke the metadata record.',
                        click: 'Click Attach Wallet Metadata, then Review Readiness.',
                        pause: 'Pause here and confirm risky permissions remain blocked.'
                    }
                ]
            }
        },
        {
            id: 'review-security',
            tab: 'Security',
            path: '/security-lockdown',
            title: 'Review Security',
            libraryTitle: 'Review Security',
            purpose: 'Security Lockdown converts technical Mac and network checks into owner tasks: Safe, Review Needed, Fix Now, and Emergency.',
            buttons: [
                ['Refresh Security Status', 'Runs the local read-only security audit again.'],
                ['View Priority Actions', 'Scrolls to the plain-English owner tasks.'],
                ['Open Emergency Steps', 'Shows containment steps when compromise is suspected.']
            ],
            fields: [
                ['No normal secret fields', 'Security is mostly read-only. It may show notes and tasks, but it should not request sensitive credentials.']
            ],
            doNotEnter: [
                'Do not paste wallet secrets, banking credentials, router passwords, or new API keys on a suspected compromised Mac.',
                'Do not rotate important credentials from this Mac if Security says Fix Now for compromise-related items.'
            ],
            order: [
                'Refresh the audit.',
                'Handle Fix Now items first.',
                'Review Review Needed items next.',
                'Use Emergency Steps if compromise is suspected.',
                'Return to Mission Control after security is acceptable.'
            ],
            safeDefaults: [
                'Treat Live E2E locked as safe.',
                'Use this page as read-only evidence unless a specific owner-approved setting change is required.'
            ],
            errors: [
                ['Audit unavailable', 'Refresh the page. If it still fails, verify the local server is running.'],
                ['Fix Now items present', 'Do not expand automation until those tasks are handled or intentionally accepted by the owner.']
            ],
            success: [
                'Security status is Safe or only acceptable Review Needed items remain.',
                'No live trading or wallet signing was enabled.',
                'Emergency steps are visible if needed.'
            ],
            video: {
                duration: '11 minutes',
                assetSlug: 'review-security',
                chapters: [
                    {
                        title: 'Refresh the audit',
                        screen: 'Security Snapshot',
                        narration: 'Start with a fresh read-only audit. This gives you the current safety picture without changing the Mac.',
                        click: 'Click Refresh Security Status.',
                        pause: 'Pause here and read Safe, Review Needed, and Fix Now counts.'
                    },
                    {
                        title: 'Prioritize owner tasks',
                        screen: 'Priority Owner Actions',
                        narration: 'Do Fix Now items first. Review Needed means slow down and inspect it before sensitive work.',
                        click: 'Click View Priority Actions.',
                        pause: 'Pause here and decide whether it is safe to continue.'
                    },
                    {
                        title: 'Use emergency containment',
                        screen: 'Emergency Containment',
                        narration: 'If you suspect active compromise, stop wallet signing and credential rotation on this Mac. Use the emergency section as a containment guide.',
                        click: 'Click Open Emergency Steps.',
                        pause: 'Pause here before using any sensitive account.'
                    }
                ]
            }
        },
        {
            id: 'use-proof-packet',
            tab: 'Proof Packet',
            path: '/owner-proof-packet',
            title: 'Use Proof Packet',
            libraryTitle: 'Use Proof Packet',
            purpose: 'Proof Packet creates a local JSON evidence packet with readiness, proof surfaces, route safety, checksum, and blocked live gates.',
            buttons: [
                ['Download Proof Packet JSON', 'Downloads a local evidence packet.'],
                ['Record Local MVP Acceptance', 'Records owner acceptance only after manual review checkboxes are complete.'],
                ['Refresh', 'Reloads the proof packet data.']
            ],
            fields: [
                ['Manual review checkboxes', 'Check only after you personally reviewed the local test pass, proof packet, and live-disabled state.'],
                ['Acceptance note', 'Use plain notes about what you reviewed. Do not paste secrets.']
            ],
            doNotEnter: [
                'Do not paste API keys, wallet secrets, or passwords into acceptance notes.',
                'Do not record acceptance if Live E2E is not locked.'
            ],
            order: [
                'Load the proof packet.',
                'Read owner test gate, Local MVP blockers, and checksum.',
                'Download JSON if you need evidence.',
                'Review MVP Test Pass.',
                'Record acceptance only after manual checks are complete.'
            ],
            safeDefaults: [
                'Download local JSON evidence.',
                'Keep live execution disabled.',
                'Leave acceptance pending until owner review is complete.'
            ],
            errors: [
                ['Checksum missing', 'Refresh the proof packet before downloading.'],
                ['Acceptance button disabled', 'Complete the required owner review checkboxes first.'],
                ['Local blockers remain', 'Open Mission Control or Setup Wizard to clear the local blocker.']
            ],
            success: [
                'Proof packet status is ready for owner testing.',
                'Local blockers are zero.',
                'Checksum is visible.',
                'Live execution remains disabled.'
            ],
            video: {
                duration: '10 minutes',
                assetSlug: 'use-proof-packet',
                chapters: [
                    {
                        title: 'Read the packet summary',
                        screen: 'Owner Proof Packet summary',
                        narration: 'This page is your local evidence receipt. It proves what is ready and what remains intentionally locked.',
                        click: 'No click yet. Read status, blockers, and checksum.',
                        pause: 'Pause here and verify local blockers are zero.'
                    },
                    {
                        title: 'Download local evidence',
                        screen: 'Download Proof Packet JSON',
                        narration: 'The download is local JSON evidence. It is useful before restarts, handoffs, or major changes.',
                        click: 'Click Download Proof Packet JSON.',
                        pause: 'Pause here and confirm the file downloaded.'
                    },
                    {
                        title: 'Record acceptance carefully',
                        screen: 'Owner Acceptance section',
                        narration: 'Acceptance is a local record. It does not enable live trading. Only record it after you reviewed the packet and live lock.',
                        click: 'Check the required boxes, then click Record Local MVP Acceptance when ready.',
                        pause: 'Pause here and confirm live execution remains disabled.'
                    }
                ]
            }
        },
        {
            id: 'confirm-mvp-test-pass',
            tab: 'MVP Test Pass',
            path: '/mvp-test-pass',
            title: 'Confirm MVP Test Pass',
            libraryTitle: 'Confirm MVP Test Pass',
            purpose: 'MVP Test Pass is the checklist that confirms owner-facing local MVP behavior, evidence exports, paper automation proof, and live-disabled safety.',
            buttons: [
                ['Download Evidence Manifest JSON', 'Downloads local evidence from the owner evidence manifest.'],
                ['Record Local MVP Acceptance from /owner-proof-packet', 'Tells you acceptance is recorded on the Proof Packet page after review.'],
                ['Refresh sections', 'Reloads proof, readiness, and owner acceptance state.']
            ],
            fields: [
                ['Review checklist items', 'Read-only pass conditions. Confirm them manually.'],
                ['No beginner data entry', 'This page is for evidence and confirmation, not secrets.']
            ],
            doNotEnter: [
                'Do not paste credentials into evidence fields or notes.',
                'Do not treat pending owner acceptance as a technical failure before you have manually reviewed the packet.'
            ],
            order: [
                'Review Bot Automation Smoke.',
                'Review Owner Evidence Manifest.',
                'Review Completion Ledger.',
                'Download evidence if needed.',
                'Go to Proof Packet for final local acceptance.'
            ],
            safeDefaults: [
                'Owner acceptance can remain pending until you personally review.',
                'Live execution remains disabled.'
            ],
            errors: [
                ['Evidence manifest missing', 'Refresh the page and verify the local server is running.'],
                ['Owner acceptance pending', 'Open Proof Packet and complete manual review when ready.']
            ],
            success: [
                'Evidence manifest is ready.',
                'Completion Ledger explains Local E2E and Live E2E lock state.',
                'Live execution remains disabled.'
            ],
            video: {
                duration: '9 minutes',
                assetSlug: 'confirm-mvp-test-pass',
                chapters: [
                    {
                        title: 'Read the smoke checks',
                        screen: 'Bot Automation Smoke',
                        narration: 'Start here to confirm paper automation is monitor-only and ready for owner testing.',
                        click: 'No click yet. Read the smoke cards.',
                        pause: 'Pause here and confirm paper automation is local only.'
                    },
                    {
                        title: 'Download evidence',
                        screen: 'Owner Evidence Manifest',
                        narration: 'The manifest is a local proof bundle. It helps you preserve exactly what was tested.',
                        click: 'Click Download Evidence Manifest JSON.',
                        pause: 'Pause here and confirm checksum or evidence count is visible.'
                    },
                    {
                        title: 'Move to proof packet',
                        screen: 'Owner Acceptance Record',
                        narration: 'Final acceptance is recorded from the proof packet after manual review. This keeps the process deliberate.',
                        click: 'Click the Proof Packet link when you are ready.',
                        pause: 'Pause here and confirm Live E2E is still locked.'
                    }
                ]
            }
        },
        {
            id: 'review-route-inventory',
            tab: 'Route Inventory',
            path: '/server-route-inventory',
            title: 'Review Route Inventory',
            libraryTitle: 'Review Route Inventory',
            purpose: 'Route Inventory is an Advanced page that lists server routes, safety boundaries, proof coverage, and live-blocked surfaces.',
            buttons: [
                ['Go To Mission Control', 'Returns you to the normal operator dashboard.'],
                ['Refresh route inventory', 'Reloads the route and safety inventory when available.'],
                ['Export or inspect evidence', 'Advanced-only evidence review for route safety.']
            ],
            fields: [
                ['No beginner fields', 'This page is primarily read-only diagnostics.']
            ],
            doNotEnter: [
                'Do not paste secrets into route inventory.',
                'Do not use this page to enable live routes. It should confirm live routes stay blocked.'
            ],
            order: [
                'Use this only when you need proof of route safety.',
                'Read protected routes and safety-critical modules.',
                'Confirm live routes are disabled or monitor-only.',
                'Return to Mission Control.'
            ],
            safeDefaults: [
                'Use Advanced Mode only when intentionally inspecting routes.',
                'Live E2E locked is expected.'
            ],
            errors: [
                ['Route inventory unavailable', 'Refresh after confirming the local server is running.'],
                ['Live route appears enabled', 'Stop and open Security before continuing.']
            ],
            success: [
                'Routes are protected.',
                'Safety-critical modules report monitor-only or metadata-only boundaries.',
                'No live order endpoint is enabled.'
            ],
            video: {
                duration: '8 minutes',
                assetSlug: 'review-route-inventory',
                chapters: [
                    {
                        title: 'Understand why this is advanced',
                        screen: 'Route Inventory page',
                        narration: 'This page is technical by design. Use it when you need proof of route safety, not for daily operation.',
                        click: 'No click yet. Confirm you intentionally opened Advanced Tools.',
                        pause: 'Pause here and decide whether Mission Control is enough.'
                    },
                    {
                        title: 'Check safety boundaries',
                        screen: 'Safety profile and owner proof coverage',
                        narration: 'Look for monitor-only, metadata-only, and live execution disabled language.',
                        click: 'Review the Owner Proof Coverage section.',
                        pause: 'Pause here and confirm no live order endpoint is enabled.'
                    },
                    {
                        title: 'Return to normal operation',
                        screen: 'Go To Mission Control button',
                        narration: 'Once route safety is confirmed, go back to the simpler dashboard.',
                        click: 'Click Go To Mission Control.',
                        pause: 'Pause here and continue in Simple Mode.'
                    }
                ]
            }
        },
        {
            id: 'use-creator-agent',
            tab: 'Creator Agent',
            path: '/creator',
            title: 'Use Creator Agent',
            libraryTitle: 'Use Creator Agent',
            purpose: 'Creator Agent turns your plain-English build request into a local plan, task list, file proposals, and safe verification steps.',
            buttons: [
                ['Create Plan', 'Creates a local implementation plan from your request.'],
                ['Review Plan', 'Shows created tasks and project activity.'],
                ['Safe command buttons', 'Run only approved local checks when available.']
            ],
            fields: [
                ['Title', 'A short recognizable project name.'],
                ['Category', 'Pick the closest type of work.'],
                ['Description / request', 'Describe what you want built in plain English. Include goals, constraints, and what success looks like.'],
                ['Owner notes', 'Optional local context. Do not paste secrets.']
            ],
            doNotEnter: [
                'Do not paste passwords, seed phrases, private keys, API keys, customer private data, or banking information.',
                'Do not ask Creator Agent to bypass owner approval gates.'
            ],
            order: [
                'Name the build.',
                'Describe the result and constraints.',
                'Click Create Plan.',
                'Review tasks and file proposals.',
                'Approve only the next safe step.'
            ],
            safeDefaults: [
                'Start with a plan before code execution.',
                'Keep file proposals reviewable.',
                'Keep live external side effects disabled.'
            ],
            errors: [
                ['Plan too vague', 'Add more detail about the desired result, inputs, and success condition.'],
                ['Command blocked', 'The command is not in the safe allowlist. Review before expanding permissions.']
            ],
            success: [
                'A local plan appears.',
                'Tasks are visible.',
                'No live trading, posting, deployment, or wallet signing occurred.'
            ],
            video: {
                duration: '10 minutes',
                assetSlug: 'use-creator-agent',
                chapters: [
                    {
                        title: 'Describe the outcome',
                        screen: 'New Build Request form',
                        narration: 'Creator Agent works best when you describe the business result, not the code details. Give it the goal, boundaries, and success conditions.',
                        click: 'Fill Title, Category, and Description.',
                        pause: 'Pause here and confirm no secrets are in the request.'
                    },
                    {
                        title: 'Create a local plan',
                        screen: 'Create Plan button',
                        narration: 'The first output should be a plan. This keeps the system controlled before files or commands change anything.',
                        click: 'Click Create Plan.',
                        pause: 'Pause here and read the plan before approving more work.'
                    },
                    {
                        title: 'Review before execution',
                        screen: 'Task list and file proposals',
                        narration: 'Review the tasks like a CEO approving a work order. Keep risky actions gated.',
                        click: 'Open Review Plan or the task list.',
                        pause: 'Pause here before running any command.'
                    }
                ]
            }
        },
        {
            id: 'build-and-paper-test-strategy',
            tab: 'Strategy / Paper / Bots',
            path: '/strategy-lab',
            title: 'Build and Paper Test Strategy',
            libraryTitle: 'Build and Paper Test Strategy',
            purpose: 'Strategy / Paper / Bots is where you create a strategy, backtest it, create a paper plan, start a paper schedule, and review paper results.',
            buttons: [
                ['Create Strategy', 'Opens the strategy builder.'],
                ['Run Backtest', 'Runs local research against available data.'],
                ['Create Safe Paper Plan', 'Creates a paper-only bot plan with safe defaults.'],
                ['Start Paper Schedule', 'Creates or activates a local paper schedule.'],
                ['Verify Paper Trading 100%', 'Checks the paper setup gate and explains exactly what is missing if it fails.'],
                ['Use Safe Defaults And Finish Paper Setup', 'Selects the newest valid paper-safe items and completes the paper workflow without live trading.']
            ],
            fields: [
                ['Strategy name', 'A clear label such as BTC momentum pullback paper test.'],
                ['Symbol / market', 'The market you want to research.'],
                ['Timeframe', 'The candle interval or trading horizon.'],
                ['Rules / logic', 'Plain-English entry, exit, risk, and filter rules.'],
                ['Risk profile fields', 'Max order value, max position value, max daily loss, max open trades, status active, kill switch off for paper testing.'],
                ['Connector', 'Choose paper/local connector only in Simple Mode.']
            ],
            doNotEnter: [
                'Do not enter exchange API keys into strategy forms.',
                'Do not enter wallet keys.',
                'Do not enable live trading or wallet signing for paper tests.'
            ],
            order: [
                'Create or select a strategy.',
                'Run a backtest or paper replay.',
                'Confirm an active risk profile.',
                'Create a safe paper plan.',
                'Start a local paper schedule.',
                'Review paper results and safety dossier.'
            ],
            safeDefaults: [
                'Paper mode only.',
                'Safe risk profile active.',
                'Kill switch off for paper execution, but live trading locked.',
                'Archived records hidden unless Advanced Mode is open.'
            ],
            errors: [
                ['Select a strategy before saving', 'Go to Step 1 and choose or create a strategy.'],
                ['No passed paper session', 'Click Create Safe Paper Replay or import matching market data first.'],
                ['Risk profile missing', 'Open Risk and save/activate Paper Trading Safe Defaults.'],
                ['Connector unsafe', 'Choose a paper/local connector only.']
            ],
            success: [
                'Ready paper plan count increases.',
                'Active paper schedule count increases.',
                'Paper verification reaches 100%.',
                'No live orders, exchange placement, or wallet signing occurred.'
            ],
            video: {
                duration: '18 minutes',
                assetSlug: 'build-paper-test-strategy',
                chapters: [
                    {
                        title: 'Create the strategy',
                        screen: 'Strategy Builder',
                        narration: 'Start with the idea. Use plain English. You can be detailed, but you do not need to write code.',
                        click: 'Click Create Strategy, then fill name, symbol, timeframe, and rules.',
                        pause: 'Pause here and confirm the strategy is saved.'
                    },
                    {
                        title: 'Run local research',
                        screen: 'Backtest and Paper Replay controls',
                        narration: 'Backtesting and paper replay are local research steps. They do not place orders.',
                        click: 'Click Run Backtest or Create Safe Paper Replay.',
                        pause: 'Pause here and check whether the result passed.'
                    },
                    {
                        title: 'Create paper automation',
                        screen: 'Bot Operator Wizard',
                        narration: 'Use the guided wizard. It shows every required field instead of hiding strategy, risk, or connector requirements.',
                        click: 'Click Use Safe Defaults And Finish Paper Setup, or complete each step manually.',
                        pause: 'Pause here and confirm Ready Paper Plans changed from zero to one if it was missing.'
                    },
                    {
                        title: 'Start and review schedule',
                        screen: 'Paper schedules and results',
                        narration: 'A paper schedule can run local decision cycles automatically. It cannot place live orders.',
                        click: 'Click Start Paper Schedule, then Review Paper Results.',
                        pause: 'Pause here and verify live trading and wallet signing remain locked.'
                    }
                ]
            }
        },
        {
            id: 'use-solidity-lab',
            tab: 'Solidity Lab',
            path: '/solidity-lab',
            title: 'Use Solidity Lab',
            libraryTitle: 'Use Solidity Lab',
            purpose: 'Solidity Lab plans token, NFT, website, whitepaper, listing, dapp, and ecosystem assets locally. It does not deploy to a blockchain in this phase.',
            buttons: [
                ['Select Chain-Neutral Launch Defaults', 'Fills a chain-neutral planning profile.'],
                ['Select Low-Fee Launch Defaults', 'Fills a low-fee chain planning profile.'],
                ['Select Polygon As Target Chain', 'Selects Polygon for this project only. It does not make Polygon the system default.'],
                ['Apply Token Options To Spec', 'Copies selected token options into the contract spec.'],
                ['Save Spec', 'Saves the local contract planning spec.'],
                ['Save Ecosystem Project Draft', 'Saves the full CEO workflow draft locally, including tokenomics, ticker, category, logo direction, and dapp fields.'],
                ['Continue Draft', 'Reloads a saved draft without losing Simple Mode fields.'],
                ['Logo Studio', 'Opens three local logo direction choices before website, whitepaper, social package, listing icon package, and dapp visuals.'],
                ['Choose This Local Logo Direction', 'Selects a local logo spec and saves it into the draft. It does not call an image generator or submit to a listing site.'],
                ['Save Website / Whitepaper Draft', 'Saves website hero copy, use case, tokenomics, roadmap, FAQ, how-to-buy, community links, disclaimer, whitepaper notes, dapp preview, and owner edit instructions locally.'],
                ['Review Launch Package', 'Opens one connected local review screen for token identity, chain, tokenomics, use case, contract plan, dapp plan, logo, website, whitepaper, roadmap, API readiness, blockers, and locked external actions.'],
                ['Generate Workspace', 'Creates local project files for review.']
            ],
            fields: [
                ['Name', 'Token or contract name.'],
                ['Type', 'ERC20 token, ERC721 NFT, or generic contract.'],
                ['Target Blockchain', 'Choose the chain per project: Base, Polygon, Ethereum, BNB, Avalanche, Solana, or another supported chain.'],
                ['Solidity Version', 'Use the safe default unless you know a project needs another version.'],
                ['Features', 'Plain-English token features.'],
                ['Risk Notes', 'Known legal, economic, technical, or community risks.'],
                ['NFT Utility Notes', 'How NFTs affect access, utility, roles, or dapp features.'],
                ['Ecosystem Notes', 'Website, roadmap, whitepaper, social, listing, and use-case notes.'],
                ['Logo / Brand Direction', 'The token logo brief. This is local planning and does not call an external image generator.'],
                ['Logo influence sliders', 'Tune text, image, and token-logo category influence for local logo specs.'],
                ['Website hero', 'First-screen website copy.'],
                ['Roadmap milestones', 'Editable token roadmap.'],
                ['Whitepaper notes', 'Technical, utility, risk, and limitation notes for the whitepaper.'],
                ['FAQ / How to buy / Disclaimer', 'Local website sections that stay draft-only until public launch approval.']
            ],
            doNotEnter: [
                'Do not enter private keys, seed phrases, deployer keys, wallet passwords, RPC secrets, or exchange keys.',
                'Do not click anything expecting a live deployment. This page is local planning only.'
            ],
            order: [
                'Choose chain-neutral defaults or explicitly pick a target chain.',
                'Fill the contract spec.',
                'Choose token creation options.',
                'Add NFT utility and ecosystem notes.',
                'Save the local ecosystem project draft.',
                'Continue into Logo Studio and choose one local logo direction before website, whitepaper, roadmap, and dapp visuals.',
                'Save the website, whitepaper, and roadmap edits locally.',
                'Open Launch Package Review to inspect the full local package in one place.',
                'Generate workspace only for local review.'
            ],
            safeDefaults: [
                'Chain-neutral launch defaults.',
                'Local only deployment boundary.',
                'No mainnet or testnet broadcast.',
                'No wallet secrets accepted.'
            ],
            errors: [
                ['Target chain missing', 'Choose a blockchain for this project. No chain is automatic.'],
                ['Spec too vague', 'Add token name, type, target chain, features, and risk notes.'],
                ['Deployment requested', 'Stop. Deployment is locked until a future owner-approved phase.']
            ],
            success: [
                'A local spec or ecosystem project is saved.',
                'The saved draft can be reopened without losing CEO workflow fields.',
                'Logo Studio shows three local direction choices and a lock-state explanation.',
                'Website, whitepaper, and roadmap edits stay attached to the saved local draft.',
                'Launch Package Review shows one connected package with blockers and locked external actions.',
                'Target chain is explicit per project.',
                'No deployment occurred.',
                'Live E2E and wallet signing remain locked.'
            ],
            video: {
                duration: '17 minutes',
                assetSlug: 'use-solidity-lab',
                chapters: [
                    {
                        title: 'Start chain-neutral',
                        screen: 'Contract Spec and Token Creation Options',
                        narration: 'Start with chain-neutral defaults. Polygon, Base, Ethereum, BNB, Avalanche, Solana, and future chains are choices per project, not global defaults.',
                        click: 'Click Select Chain-Neutral Launch Defaults.',
                        pause: 'Pause here and choose the target blockchain intentionally.'
                    },
                    {
                        title: 'Fill the token spec',
                        screen: 'Contract Spec form',
                        narration: 'Fill the token like a product blueprint: name, type, chain, features, and risks.',
                        click: 'Enter Name, Type, Target Blockchain, Features, and Risk Notes.',
                        pause: 'Pause here and confirm no deployer key or private key is present.'
                    },
                    {
                        title: 'Build the ecosystem packet',
                        screen: 'Token Ecosystem Studio',
                        narration: 'Now add website, roadmap, whitepaper, social, listing, dapp, and NFT utility notes. This creates local planning assets and preserves the Simple Mode draft.',
                        click: 'Click Save Ecosystem Project Draft. EtherealAI opens Logo Studio next.',
                        pause: 'Pause here and confirm deployment boundary remains local only.'
                    },
                    {
                        title: 'Continue to Logo Studio',
                        screen: 'Logo Creation Center',
                        narration: 'Logo Studio is where the token identity becomes usable for the website, social avatar, listing icon package, dapp header mark, and NFT badge direction. The choices are local specs, not external generation.',
                        click: 'Choose one local logo direction, then save/update the token draft.',
                        pause: 'Pause here and confirm no wallet signing, listing submission, or external image generation happened automatically.'
                    },
                    {
                        title: 'Edit website and whitepaper',
                        screen: 'Website / Whitepaper / Roadmap Builder',
                        narration: 'Use this section like a founder draft editor. EtherealAI keeps the token website, whitepaper, roadmap, and dapp preview tied to the local token project.',
                        click: 'Edit the sections, then click Save Website / Whitepaper Draft.',
                        pause: 'Pause here and confirm Cloudflare, GitHub, DNS, and public deployment remain locked.'
                    },
                    {
                        title: 'Review the complete local package',
                        screen: 'Launch Package Review',
                        narration: 'This is the CEO review screen. It summarizes identity, tokenomics, contract plan, logo, website, whitepaper, roadmap, API readiness, blockers, and every external action that remains locked.',
                        click: 'Click Review Launch Package.',
                        pause: 'Pause here and verify no deploy, mint, signing, posting, listing submission, DNS, or live trading action occurred.'
                    }
                ]
            }
        },
        {
            id: 'use-social-ops',
            tab: 'Social Ops',
            path: '/social-ops',
            title: 'Use Social Ops',
            libraryTitle: 'Use Social Ops',
            purpose: 'Social Ops creates local community, launch, listing, article, and announcement drafts. It does not post publicly in this phase.',
            buttons: [
                ['Generate Local Draft', 'Creates a local draft only.'],
                ['Review Drafts', 'Shows saved local drafts.'],
                ['Create Listing / Community Drafts', 'Generates content for listing evidence and community updates.']
            ],
            fields: [
                ['Token project', 'Choose the project the content belongs to, if available.'],
                ['Platform', 'X, Discord, Telegram, YouTube, Medium, Docs Portal, Farcaster, or other supported channel.'],
                ['Content type', 'Announcement, update, article, community reply, video outline, or listing evidence.'],
                ['Tone / audience', 'Founder update, technical explainer, community manager, investor-style summary, or beginner guide.'],
                ['Prompt / notes', 'What actually happened, what should be explained, and what call to action is allowed.']
            ],
            doNotEnter: [
                'Do not enter social account passwords, bot tokens, API keys, or OAuth secrets in Simple Mode.',
                'Do not ask for fake volume, spam, fake users, misleading claims, bribes, or listing-process bypasses.'
            ],
            order: [
                'Choose project and platform.',
                'Choose content type and audience.',
                'Write factual notes.',
                'Generate local draft.',
                'Review safety flags.',
                'Post manually outside EtherealAI only after owner review.'
            ],
            safeDefaults: [
                'Drafts stay local.',
                'No social network API calls.',
                'Owner review required before posting.'
            ],
            errors: [
                ['Draft too generic', 'Add concrete progress, product facts, roadmap items, or community context.'],
                ['Safety warning', 'Remove misleading, spammy, or non-compliant language before use.'],
                ['Connector missing', 'Ignore in Simple Mode. Posting connectors are optional future integrations.']
            ],
            success: [
                'A local draft is saved.',
                'No public post was made.',
                'The draft is factual, reviewable, and safe to edit manually.'
            ],
            video: {
                duration: '12 minutes',
                assetSlug: 'use-social-ops',
                chapters: [
                    {
                        title: 'Choose a local draft target',
                        screen: 'AI Draft Generator',
                        narration: 'Pick the project, platform, and purpose. The goal is to create a useful draft, not to post automatically.',
                        click: 'Choose the project, platform, content type, and tone.',
                        pause: 'Pause here and confirm you are not entering passwords or tokens.'
                    },
                    {
                        title: 'Write factual notes',
                        screen: 'Prompt or notes field',
                        narration: 'Give the AI real progress and real context. Strong community content comes from specific facts.',
                        click: 'Type the update, milestone, feature, or listing evidence you want explained.',
                        pause: 'Pause here and remove anything misleading or unverifiable.'
                    },
                    {
                        title: 'Generate and review',
                        screen: 'Saved local drafts',
                        narration: 'Generate the draft locally, then review it like a communications manager before anything leaves the machine.',
                        click: 'Click Generate Local Draft, then Review Drafts.',
                        pause: 'Pause here and confirm no public posting occurred.'
                    }
                ]
            }
        }
    ];

    const byPath = new Map(modules.map(item => [item.path, item]));
    const byId = new Map(modules.map(item => [item.id, item]));
    const libraryOrder = modules.map(item => item.id);

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function normalizePath(path = window.location.pathname) {
        return String(path || '/').replace(/\/$/, '') || '/';
    }

    function getModuleForPath(path = window.location.pathname) {
        return byPath.get(normalizePath(path)) || byPath.get('/') || modules[0];
    }

    function getModule(idOrPath) {
        return byId.get(idOrPath) || byPath.get(normalizePath(idOrPath)) || getModuleForPath();
    }

    function listMarkup(items = []) {
        return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    }

    function pairListMarkup(items = []) {
        return `<div class="training-pair-list">${items.map(([name, body]) => `
            <article>
                <strong>${escapeHtml(name)}</strong>
                <span>${escapeHtml(body)}</span>
            </article>
        `).join('')}</div>`;
    }

    function transcriptText(module) {
        return module.video.chapters.map((chapter, index) => (
            `Chapter ${index + 1}: ${chapter.title}. ${chapter.narration} Click instruction: ${chapter.click} Pause moment: ${chapter.pause}`
        )).join('\n\n');
    }

    function assetPlanMarkup(module) {
        const slug = module.video.assetSlug;
        return `
            <div class="training-asset-plan">
                <strong>Video asset plan</strong>
                <span>Status: placeholder ready for future rendered video.</span>
                <span>Poster: /training-assets/${escapeHtml(slug)}.png</span>
                <span>Video: /training-assets/${escapeHtml(slug)}.mp4</span>
                <span>Spec: /training-assets/${escapeHtml(slug)}.json</span>
                <span>Renderer: scripts/render-training-video.swift</span>
            </div>
        `;
    }

    function textModuleMarkup(module) {
        return `
            <section class="training-text-module">
                <h2>${escapeHtml(module.title)}</h2>
                <p>${escapeHtml(module.purpose)}</p>
                <h3>What Each Button Does</h3>
                ${pairListMarkup(module.buttons)}
                <h3>What To Enter In Each Field</h3>
                ${pairListMarkup(module.fields)}
                <h3>What Not To Enter</h3>
                ${listMarkup(module.doNotEnter)}
                <h3>Correct Operating Order</h3>
                ${listMarkup(module.order)}
                <h3>Safe Defaults</h3>
                ${listMarkup(module.safeDefaults)}
                <h3>Plain-English Error Fixes</h3>
                ${pairListMarkup(module.errors)}
                <h3>What Success Looks Like</h3>
                ${listMarkup(module.success)}
                <h3>Safety Boundary</h3>
                ${listMarkup(BASE_SAFETY)}
            </section>
        `;
    }

    function videoModuleMarkup(module, activeIndex = 0) {
        const chapters = module.video.chapters;
        const active = chapters[Math.max(0, Math.min(activeIndex, chapters.length - 1))] || chapters[0];

        return `
            <section class="training-video-module" data-training-module="${escapeHtml(module.id)}">
                <div class="training-video-player" aria-label="${escapeHtml(module.title)} video placeholder">
                    <div>
                        <span>Placeholder Video Player</span>
                        <strong>${escapeHtml(module.title)}</strong>
                        <small>${escapeHtml(module.video.duration)} · screen-by-screen Udemy-style walkthrough</small>
                    </div>
                    <div class="training-video-frame">
                        <span>Video will render here when attached</span>
                    </div>
                </div>
                ${assetPlanMarkup(module)}
                <div class="training-video-controls">
                    <button type="button" data-training-start="${escapeHtml(module.id)}">Start walkthrough</button>
                    <button type="button" data-training-replay="${escapeHtml(module.id)}" data-training-step="${activeIndex}">Replay this step</button>
                    <a href="${TRAINING_LIBRARY_PATH}">Open Training Library</a>
                </div>
                <div class="training-video-current">
                    <h3>${escapeHtml(active.title)}</h3>
                    <p><strong>Screen:</strong> ${escapeHtml(active.screen)}</p>
                    <p><strong>Narration:</strong> ${escapeHtml(active.narration)}</p>
                    <p><strong>Click instruction:</strong> ${escapeHtml(active.click)}</p>
                    <p><strong>Pause here and verify:</strong> ${escapeHtml(active.pause)}</p>
                </div>
                <div class="training-chapter-grid">
                    ${chapters.map((chapter, index) => `
                        <button type="button" class="${index === activeIndex ? 'training-chapter-active' : ''}" data-training-open-video="${escapeHtml(module.id)}" data-training-step="${index}">
                            <strong>${index + 1}. ${escapeHtml(chapter.title)}</strong>
                            <span>${escapeHtml(chapter.screen)}</span>
                        </button>
                    `).join('')}
                </div>
                <details class="training-transcript" open>
                    <summary>Transcript</summary>
                    <pre>${escapeHtml(transcriptText(module))}</pre>
                </details>
            </section>
        `;
    }

    function moduleModalMarkup(module, mode, activeIndex = 0) {
        return `
            <section class="operator-training-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(module.title)} training">
                <div class="operator-training-card-header">
                    <div>
                        <span>Operator Training</span>
                        <h1>${escapeHtml(module.title)}</h1>
                        <p>${escapeHtml(module.tab)} · ${mode === 'video' ? 'Show me in video' : 'Show me in text'}</p>
                    </div>
                    <button type="button" data-training-close>Close</button>
                </div>
                <div class="training-mode-tabs">
                    <button type="button" class="${mode === 'text' ? 'training-mode-active' : ''}" data-training-open-text="${escapeHtml(module.id)}">Show me in text</button>
                    <button type="button" class="${mode === 'video' ? 'training-mode-active' : ''}" data-training-open-video="${escapeHtml(module.id)}" data-training-step="${activeIndex}">Show me in video</button>
                </div>
                ${mode === 'video' ? videoModuleMarkup(module, activeIndex) : textModuleMarkup(module)}
            </section>
        `;
    }

    function open(mode = 'text', idOrPath = window.location.pathname, activeIndex = 0) {
        const module = getModule(idOrPath);
        let overlay = document.getElementById('operator-training-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'operator-training-overlay';
            overlay.className = 'operator-training-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = moduleModalMarkup(module, mode, Number(activeIndex || 0));
    }

    function renderLibrary(rootId = 'operator-training-library-root') {
        const root = document.getElementById(rootId);

        if (!root) {
            return;
        }

        root.innerHTML = `
            <section class="training-library-hero">
                <div>
                    <span>Operator Training Library</span>
                    <h1>Run EtherealAI Without Outside Help</h1>
                    <p>Follow these tutorials in order. Each module has a text guide, placeholder video player, exact click instructions, pause-and-verify moments, and a transcript.</p>
                </div>
                <a href="/">Open EtherealAI Home</a>
            </section>
            <div class="training-library-grid">
                ${libraryOrder.map((id, index) => {
                    const module = byId.get(id);
                    return `
                        <article class="training-library-card" id="training-${escapeHtml(module.id)}">
                            <div>
                                <span>Lesson ${index + 1}</span>
                                <h2>${escapeHtml(module.libraryTitle)}</h2>
                                <p>${escapeHtml(module.purpose)}</p>
                            </div>
                            <div class="training-library-actions">
                                <button type="button" data-training-open-text="${escapeHtml(module.id)}">Show me in text</button>
                                <button type="button" data-training-open-video="${escapeHtml(module.id)}" data-training-step="0">Show me in video</button>
                                <a href="${escapeHtml(module.path)}">Open tab</a>
                            </div>
                            ${videoModuleMarkup(module, 0)}
                        </article>
                    `;
                }).join('')}
            </div>
        `;
    }

    document.addEventListener('click', event => {
        const close = event.target.closest('[data-training-close]');
        if (close) {
            document.getElementById('operator-training-overlay')?.remove();
            return;
        }

        const text = event.target.closest('[data-training-open-text]');
        if (text) {
            open('text', text.dataset.trainingOpenText);
            return;
        }

        const video = event.target.closest('[data-training-open-video]');
        if (video) {
            open('video', video.dataset.trainingOpenVideo, Number(video.dataset.trainingStep || 0));
            return;
        }

        const start = event.target.closest('[data-training-start]');
        if (start) {
            open('video', start.dataset.trainingStart, 0);
            return;
        }

        const replay = event.target.closest('[data-training-replay]');
        if (replay) {
            open('video', replay.dataset.trainingReplay, Number(replay.dataset.trainingStep || 0));
        }
    });

    window.EtherealTraining = {
        modules,
        libraryOrder,
        getModule,
        getModuleForPath,
        open,
        renderLibrary,
        transcriptText,
        TRAINING_LIBRARY_PATH
    };
}());
