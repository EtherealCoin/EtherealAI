(function () {
    const MODE_KEY = 'etherealai.operatorMode';

    const pageConfigs = {
        '/': {
            area: 'Home / Mission Control',
            title: 'Run EtherealAI From One Screen',
            summary: 'Check the system, see what is safe, and press one button for the next recommended action.',
            primaryAction: { label: 'What should I do next?', kind: 'next' },
            keepHeadings: [],
            cards: [
                ['System Health', 'Shows whether the local server and database are responding.'],
                ['Paper Trading', 'Shows whether paper setup is complete without using real money.'],
                ['Live Trading Lock', 'Confirms live orders and wallet signing are still blocked.'],
                ['Security', 'Shows whether the Mac needs owner review or immediate action.']
            ]
        },
        '/dashboard': {
            area: 'Mission Control',
            title: 'Mission Control',
            summary: 'Use this page to decide what to do next. Advanced diagnostics are hidden unless you switch modes.',
            primaryAction: { label: 'What should I do next?', kind: 'next' },
            keepHeadings: [],
            cards: [
                ['Health', 'Server, database, and local model status.'],
                ['Readiness', 'Paper setup and full E2E setup progress.'],
                ['Locks', 'Live trading and wallet signing must remain locked.'],
                ['Next Action', 'The safest next click based on current system state.']
            ]
        },
        '/owner-setup': {
            area: 'Setup Wizard',
            title: 'Finish Setup One Step At A Time',
            summary: 'Follow the checklist. Each step explains what is missing, why it matters, and what to click.',
            primaryAction: { label: 'Verify Setup Now', selector: '#refresh-owner-setup' },
            keepHeadings: ['Progress', 'Step-by-Step Completion Guide', 'Select .env File Visually', 'Add Public Wallet Address'],
            cards: [
                ['1. Verify local setup', 'Refresh the wizard and confirm paper/full E2E progress.'],
                ['2. Select .env visually', 'Check the safe file locally without sending secret values.'],
                ['3. Add public wallet metadata', 'Use public addresses only. Never enter seed phrases or private keys.'],
                ['4. Complete the next blocked item', 'Click the one visible fix/verify button for the blocked step.']
            ]
        },
        '/strategy-lab': {
            area: 'Strategy / Paper / Bots',
            title: 'Build, Paper Test, Then Monitor',
            summary: 'Create the strategy in plain English, test it with paper trading, then monitor paper bots. Live mode stays locked.',
            primaryAction: { label: 'Use Safe Defaults And Finish Paper Setup', selector: '#bot-operator-safe-defaults' },
            keepIds: ['strategy-entry', 'risk-profile-configuration', 'bot-automation'],
            keepHeadings: ['Strategy Builder'],
            cards: [
                ['1. Build the idea', 'Answer the strategy form questions in plain English.'],
                ['2. Use safe paper limits', 'Set paper-only risk limits before automation.'],
                ['3. Create a paper plan', 'One click creates safe local paper records.'],
                ['4. Verify 100%', 'Verify paper trading without wallet signing or live orders.']
            ]
        },
        '/operator-control': {
            area: 'Wallet & Funding Center',
            title: 'Add Wallets Without Giving EtherealAI The Keys',
            summary: 'Attach public wallet labels and purposes only. Seed phrases, private keys, and wallet passwords stay outside the system.',
            primaryAction: { label: 'Review Wallet Readiness', selector: '#refresh-operator-center' },
            keepHeadings: ['Wallet Onboarding Wizard', 'Owner Key Takeover Mode', 'Attach Wallet Metadata', 'Connected Wallets'],
            cards: [
                ['1. Choose wallet purpose', 'Trading research, token deployment, treasury, or recovery.'],
                ['2. Add public address', 'Public address and label only. No secret material.'],
                ['3. Scope permissions', 'Keep dangerous actions blocked unless a future owner approval flow exists.'],
                ['4. Review readiness', 'Record the safe owner-control checkpoint.']
            ]
        },
        '/security-lockdown': {
            area: 'Security Lockdown',
            title: 'Turn Security Findings Into Owner Tasks',
            summary: 'Simple status first: safe, review needed, or fix now. Raw system details stay in Advanced Mode.',
            primaryAction: { label: 'Refresh Security Status', selector: '#refresh-security-audit' },
            keepHeadings: ['Security Snapshot', 'Priority Owner Actions', 'Manual Mac Lockdown Checklist', 'Emergency Containment'],
            cards: [
                ['Safe', 'No immediate action needed for that check.'],
                ['Review Needed', 'You should inspect the item before using sensitive accounts.'],
                ['Fix Now', 'Handle this before expanding automation.'],
                ['Emergency', 'Containment steps if the Mac or network is suspected compromised.']
            ]
        },
        '/solidity-lab': {
            area: 'Solidity Lab',
            title: 'Create A Token Project Without Deploying',
            summary: 'Draft token specs, website, whitepaper, listing plan, and ecosystem blueprint locally. Deployment remains locked.',
            primaryAction: { label: 'Select Polygon Defaults', selector: '#select-polygon-token-options' },
            keepHeadings: ['Deployment Boundary', 'Contract Spec', 'Token Ecosystem Studio', 'Token Ecosystem Projects'],
            cards: [
                ['1. Pick chain', 'Polygon, Base, Solana, BNB, Avalanche, or another supported chain.'],
                ['2. Choose token features', 'Rewards, staking, NFT utility, website, whitepaper, listing evidence, and more.'],
                ['3. Save the ecosystem project', 'Create the local planning packet.'],
                ['4. Review before deployment', 'No blockchain broadcast happens in this mode.']
            ]
        },
        '/social-ops': {
            area: 'Social Ops',
            title: 'Create Community Content Locally',
            summary: 'Draft posts, launch updates, community manager plans, and listing evidence content without public posting.',
            primaryAction: { label: 'Generate Local Draft', selector: '#social-generate-form button[type="submit"]' },
            keepHeadings: ['Local-Only Safety', 'AI Draft Generator', 'Token Community Manager', 'Draft Post'],
            cards: [
                ['1. Pick the purpose', 'Announcement, progress update, community reply, or listing campaign.'],
                ['2. Generate draft', 'The AI writes locally only.'],
                ['3. Review safety flags', 'Avoid fake activity, fake volume, bribery, or misleading claims.'],
                ['4. Owner posts manually', 'External posting remains disabled.']
            ]
        },
        '/creator': {
            area: 'Creator Agent',
            title: 'Describe What You Want Built',
            summary: 'Use normal language. EtherealAI creates a local plan first and waits before risky file or command actions.',
            primaryAction: { label: 'Create Plan', selector: '#creator-form button[type="submit"]' },
            keepHeadings: ['New Build Request', 'Current Plan', 'Task Activity'],
            cards: [
                ['1. Name the build', 'Use a plain title you will recognize.'],
                ['2. Describe the result', 'Tell EtherealAI what you want, not how to code it.'],
                ['3. Create a plan', 'The first output is a local plan.'],
                ['4. Review before execution', 'File changes and commands remain controlled.']
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

            if (panel.classList.contains('model-panel') && isKeptForSimple(panel, config)) {
                panel.classList.add('operator-simple-keep');
                return;
            }

            panel.classList.add('operator-simple-collapsed');
        });

        document.querySelectorAll('.advanced-operator-tools, .comparison-table, .model-output, .timeline-list, .owner-gate-list').forEach(panel => {
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
            return '<button type="button" class="operator-primary-action" data-operator-next>What should I do next?</button>';
        }

        if (action.href) {
            return `<a class="operator-primary-action" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`;
        }

        return `<button type="button" class="operator-primary-action" data-operator-click="${escapeHtml(action.selector || '')}">${escapeHtml(action.label || 'Continue')}</button>`;
    }

    function renderStatus(summary = null) {
        const owner = summary?.owner?.wizard;
        const bot = summary?.bot?.capabilityPath;
        const security = summary?.security?.audit;
        const health = summary?.health;
        const serverHealthy = health?.server?.ok && health?.database?.ok;
        const liveLocked = !owner?.safetyBoundary?.liveTradingEnabled && !owner?.safetyBoundary?.walletSigningEnabled;
        const statuses = [
            ['Health', serverHealthy ? 'Safe' : 'Review', serverHealthy ? 'Local server is responding.' : 'Open Mission Control and refresh status.'],
            ['Paper Trading', `${owner?.progress?.paperTrading?.current ?? '?'}%`, `${bot?.paperAutomation?.counts?.activeSchedules ?? 0} active paper schedule(s).`],
            ['Live Trading', liveLocked ? 'Locked' : 'Review Now', liveLocked ? 'No live order or wallet signing path is active.' : 'Live or signing appears enabled. Review immediately.'],
            ['Wallets', `${owner?.walletMetadata?.savedPublicWallets?.length ?? 0}`, 'Public metadata only.'],
            ['Security', security?.summary?.status || 'Review', `${security?.summary?.failCount ?? 0} fix-now item(s).`]
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
                <div>
                    <p class="operator-area">${escapeHtml(config.area)}</p>
                    <h1>${escapeHtml(config.title)}</h1>
                    <p>${escapeHtml(config.summary)}</p>
                </div>
                <div class="operator-workspace-actions">
                    ${actionMarkup(config.primaryAction)}
                    <button type="button" class="operator-secondary-action" data-operator-tutorial>Show me how</button>
                    <button type="button" class="operator-secondary-action" data-operator-mode="advanced">Advanced Developer Mode</button>
                </div>
            </div>
            <div id="operator-simple-status" class="operator-status-grid">
                <article class="operator-status-tile"><span>Status</span><strong>Loading</strong><small>Checking local system.</small></article>
            </div>
            <div class="operator-task-grid">
                ${renderCards(config.cards)}
            </div>
        `;

        host.prepend(workspace);

        const summary = await loadSummary();
        document.getElementById('operator-simple-status').innerHTML = renderStatus(summary);
    }

    function renderModeBar() {
        if (document.getElementById('operator-mode-bar')) {
            return;
        }

        const bar = document.createElement('div');
        bar.id = 'operator-mode-bar';
        bar.className = 'operator-mode-bar';
        bar.innerHTML = `
            <div>
                <strong id="operator-mode-label">Simple Operator Mode</strong>
                <span>Daily CEO controls are simplified. Advanced diagnostics stay hidden until you choose them.</span>
            </div>
            <div class="operator-mode-actions">
                <button type="button" data-operator-tutorial>Show me how</button>
                <button type="button" data-operator-mode="simple">Simple Mode</button>
                <button type="button" data-operator-mode="advanced">Advanced Mode</button>
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

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('operator-highlight-target');
        setTimeout(() => target.classList.remove('operator-highlight-target'), 1800);

        if (target.tagName === 'BUTTON') {
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
            overlay.innerHTML = `
                <section class="operator-tutorial-card" role="dialog" aria-modal="true" aria-label="Operator tutorial">
                    <div class="operator-page-label">YouTube-style walkthrough · Chapter ${index + 1} of ${steps.length}</div>
                    <h2>${escapeHtml(title)}</h2>
                    <p>${escapeHtml(body)}</p>
                    <div class="operator-tutorial-script">
                        <strong>Script:</strong>
                        <span>${escapeHtml(body)} Pause here, complete the visible action, then continue to the next chapter.</span>
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
            overlay.querySelector('[data-tutorial-close]')?.addEventListener('click', () => overlay.remove());
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
