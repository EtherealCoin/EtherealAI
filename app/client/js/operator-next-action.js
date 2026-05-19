(function () {
    const state = {
        loaded: false,
        open: false,
        summary: null
    };

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    async function fetchJson(path) {
        const response = await fetch(path);

        if (response.status === 401) {
            return { unauthorized: true };
        }

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
            return { error: body.error || `Request failed: ${response.status}` };
        }

        return body;
    }

    function firstBlockedGate(wizard, lane) {
        const gates = wizard?.gates?.[lane] || [];
        return gates.find(gate => !gate.passed) || null;
    }

    function gateHref(gate = {}) {
        const id = gate.id || '';

        if (id.includes('paper')) {
            return '/strategy-lab#bot-automation';
        }

        if (id.includes('wallet')) {
            return '/operator-control';
        }

        if (id.includes('connector')) {
            return '/strategy-lab#bot-automation';
        }

        if (id.includes('external_ops') || id.includes('cloudflare') || id.includes('github')) {
            return '/dashboard#advanced-operator-tools';
        }

        return '/owner-setup';
    }

    function buildNextAction(data) {
        const owner = data.owner?.wizard;
        const mvp = data.mvp?.readiness;
        const bot = data.bot?.capabilityPath;
        const operator = data.operator?.summary;
        const security = data.security?.audit;
        const paperProgress = owner?.progress?.paperTrading?.current ?? mvp?.localEndToEndCompletionPercent ?? 0;
        const fullProgress = owner?.progress?.fullEndToEnd?.current ?? mvp?.endToEndCompletionPercent ?? 0;
        const liveEnabled = Boolean(owner?.safetyBoundary?.liveTradingEnabled || mvp?.liveExecution?.enabled);
        const walletSigningEnabled = Boolean(owner?.safetyBoundary?.walletSigningEnabled);
        const activeSchedules = bot?.paperAutomation?.counts?.activeSchedules ?? 0;
        const readyPaperPlans = bot?.paperAutomation?.counts?.readyPaperPlans ?? 0;
        const walletCount = owner?.walletMetadata?.savedPublicWallets?.length ?? operator?.counts?.wallets ?? 0;
        const securityFailCount = security?.summary?.failCount ?? 0;
        const securityReviewCount = security?.summary?.reviewCount ?? 0;
        const paperGate = firstBlockedGate(owner, 'paperTrading');
        const fullGate = firstBlockedGate(owner, 'fullEndToEnd');

        if (data.unauthorized) {
            return {
                title: 'Log In First',
                why: 'EtherealAI needs an authenticated local session before it can inspect setup state.',
                action: 'Open Login',
                href: '/login',
                detail: 'After login, press What do I do next again.'
            };
        }

        if (liveEnabled || walletSigningEnabled) {
            return {
                title: 'Review Live Safety Immediately',
                why: 'Live trading or wallet signing appears enabled. This should stay locked unless you intentionally approved a high-security live phase.',
                action: 'Open Security',
                href: '/security-lockdown',
                detail: 'Confirm live execution, wallet signing, external posting, deployment, and DNS mutation boundaries.'
            };
        }

        if (securityFailCount > 0) {
            return {
                title: 'Fix Security First',
                why: 'A local Mac security check is failing. Security comes before new automation.',
                action: 'Open Security',
                href: '/security-lockdown',
                detail: `${securityFailCount} fix-now security item(s), ${securityReviewCount} review item(s).`
            };
        }

        if (paperProgress < 100 || paperGate) {
            return {
                title: 'Finish Paper Trading Setup',
                why: paperGate?.whyNeeded || 'Paper automation must reach 100% before live-style workflows are considered.',
                action: 'Open Paper Trading Center',
                href: gateHref(paperGate),
                detail: paperGate
                    ? `${paperGate.label}: ${paperGate.missing || paperGate.evidence || 'Needs owner action.'}`
                    : `Paper progress is ${paperProgress}%.`
            };
        }

        if (walletCount < 1) {
            return {
                title: 'Add Wallet Public Metadata',
                why: 'EtherealAI needs public wallet labels and addresses for planning, but it must never receive seed phrases or private keys.',
                action: 'Open Wallet & Funding Center',
                href: '/operator-control',
                detail: 'Add public address metadata only. Signing stays disabled.'
            };
        }

        if (fullProgress < 100 || fullGate) {
            return {
                title: 'Complete The Next Setup Gate',
                why: fullGate?.whyNeeded || 'Full E2E setup readiness is not complete yet. This still does not enable live trading.',
                action: 'Open Setup Wizard',
                href: gateHref(fullGate),
                detail: fullGate
                    ? `${fullGate.label}: ${fullGate.missing || fullGate.evidence || 'Needs owner action.'}`
                    : `Full E2E readiness is ${fullProgress}%.`
            };
        }

        if (readyPaperPlans > 0 && activeSchedules > 0) {
            return {
                title: 'Monitor Paper Bots',
                why: 'Paper automation is ready and active. The safest next step is observation and evidence review.',
                action: 'Open Bot Control Center',
                href: '/strategy-lab#bot-automation',
                detail: `${readyPaperPlans} ready paper plan(s), ${activeSchedules} active paper schedule(s). Live trading remains locked.`
            };
        }

        return {
            title: 'Review Mission Control',
            why: 'No urgent blocked gate was detected. Continue from the main operating dashboard.',
            action: 'Open Mission Control',
            href: '/dashboard',
            detail: 'Use this to review health, readiness, wallets, security, and active bots.'
        };
    }

    async function collectState() {
        const requests = await Promise.allSettled([
            fetchJson('/api/v1/owner-setup-wizard'),
            fetchJson('/api/v1/mvp-readiness-checklist'),
            fetchJson('/api/v1/bot-automation-capability-path'),
            fetchJson('/api/v1/operator-control-center'),
            fetchJson('/api/v1/mac-security/audit'),
            fetchJson('/api/v1/health')
        ]);
        const [owner, mvp, bot, operator, security, health] = requests.map(result => (
            result.status === 'fulfilled' ? result.value : { error: result.reason?.message || 'request failed' }
        ));
        const unauthorized = [owner, mvp, bot, operator, security, health].some(item => item?.unauthorized);
        const summary = {
            unauthorized,
            owner,
            mvp,
            bot,
            operator,
            security,
            health
        };

        summary.nextAction = buildNextAction(summary);
        state.summary = summary;
        state.loaded = true;

        return summary;
    }

    function renderPanel(summary) {
        const root = document.getElementById('operator-next-action-root');

        if (!root) {
            return;
        }

        const next = summary?.nextAction || {
            title: 'State Not Loaded',
            why: 'Click refresh to inspect the local system state.',
            action: 'Refresh',
            href: '#',
            detail: 'No data loaded yet.'
        };
        const owner = summary?.owner?.wizard;
        const mvp = summary?.mvp?.readiness;
        const bot = summary?.bot?.capabilityPath;
        const security = summary?.security?.audit;

        root.innerHTML = `
            <button type="button" id="operator-next-action-button" class="operator-next-action-button">
                What do I do next?
            </button>
            <section id="operator-next-action-panel" class="operator-next-action-panel ${state.open ? 'operator-next-action-panel-open' : ''}" aria-live="polite">
                <div class="operator-next-action-header">
                    <strong>${escapeHtml(next.title)}</strong>
                    <button type="button" id="operator-next-action-close">Close</button>
                </div>
                <p><strong>Why it matters:</strong> ${escapeHtml(next.why)}</p>
                <p><strong>Do this next:</strong> ${escapeHtml(next.detail)}</p>
                <div class="operator-next-action-grid">
                    <article>
                        <strong>Paper</strong>
                        <span>${escapeHtml(owner?.progress?.paperTrading?.current ?? mvp?.localEndToEndCompletionPercent ?? '?')}%</span>
                    </article>
                    <article>
                        <strong>Full E2E</strong>
                        <span>${escapeHtml(owner?.progress?.fullEndToEnd?.current ?? mvp?.endToEndCompletionPercent ?? '?')}%</span>
                    </article>
                    <article>
                        <strong>Live Trading</strong>
                        <span>${owner?.safetyBoundary?.liveTradingEnabled || mvp?.liveExecution?.enabled ? 'Enabled' : 'Locked'}</span>
                    </article>
                    <article>
                        <strong>Active Bots</strong>
                        <span>${escapeHtml(bot?.paperAutomation?.counts?.activeSchedules ?? 0)}</span>
                    </article>
                    <article>
                        <strong>Security</strong>
                        <span>${escapeHtml(security?.summary?.status || 'review')}</span>
                    </article>
                </div>
                <div class="button-row">
                    <a class="cta-button" href="${escapeHtml(next.href)}">${escapeHtml(next.action)}</a>
                    <button type="button" id="operator-next-action-refresh">Refresh State</button>
                </div>
            </section>
        `;

        document.getElementById('operator-next-action-button')?.addEventListener('click', async () => {
            state.open = true;
            renderPanel(state.summary || await collectState());
        });
        document.getElementById('operator-next-action-close')?.addEventListener('click', () => {
            state.open = false;
            renderPanel(state.summary);
        });
        document.getElementById('operator-next-action-refresh')?.addEventListener('click', async () => {
            state.open = true;
            renderPanel(await collectState());
        });
    }

    async function boot() {
        const root = document.createElement('div');
        root.id = 'operator-next-action-root';
        document.body.appendChild(root);
        renderPanel(null);

        try {
            renderPanel(await collectState());
        } catch (error) {
            state.summary = {
                nextAction: {
                    title: 'Unable To Inspect State',
                    why: 'The page could not load the local status APIs.',
                    action: 'Open Mission Control',
                    href: '/dashboard',
                    detail: error.message
                }
            };
            renderPanel(state.summary);
        }
    }

    window.EtherealOperatorAssistant = {
        collectState,
        show: async () => {
            state.open = true;
            renderPanel(state.summary || await collectState());
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}());
