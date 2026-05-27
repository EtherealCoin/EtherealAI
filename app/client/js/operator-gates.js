(function () {
    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function normalizeTone(status) {
        const text = String(status || '').toLowerCase();
        if (['ready', 'safe', 'working', 'complete', 'passed', 'verified'].some(word => text.includes(word))) {
            return 'safe';
        }
        if (['blocked', 'unsafe', 'danger', 'failed', 'error'].some(word => text.includes(word))) {
            return 'danger';
        }
        if (['locked', 'live'].some(word => text.includes(word))) {
            return 'live';
        }
        return 'warning';
    }

    function actionMarkup(action = {}) {
        const label = escapeHtml(action.label || 'Open');
        const classes = ['operator-two-gate-action'];
        if (action.primary) classes.push('operator-two-gate-primary');
        if (action.warning) classes.push('operator-two-gate-warning');
        if (action.danger) classes.push('operator-two-gate-danger');

        if (action.href) {
            return `<a class="${classes.join(' ')}" href="${escapeHtml(action.href)}">${label}</a>`;
        }

        return `<button type="button" class="${classes.join(' ')}" data-two-gate-action="${escapeHtml(action.action || '')}">${label}</button>`;
    }

    function blockerMarkup(blockers = []) {
        if (!blockers.length) {
            return '<p class="operator-two-gate-clear">No blocker is visible in this Simple Mode summary.</p>';
        }

        return `
            <ul class="operator-two-gate-blockers">
                ${blockers.map(blocker => `
                    <li>
                        <strong>${escapeHtml(blocker.title || blocker.label || 'Needs review')}</strong>
                        <span>${escapeHtml(blocker.detail || blocker.fix || blocker.next || '')}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    function renderGate(gate = {}, index = 1) {
        const tone = normalizeTone(gate.status || gate.tone);
        return `
            <article class="operator-two-gate-card operator-two-gate-${tone}">
                <div class="operator-two-gate-card-header">
                    <span>Gate ${index}</span>
                    <strong>${escapeHtml(gate.title || (index === 1 ? 'Preview / Review' : 'Final Confirm / Execute'))}</strong>
                </div>
                <p>${escapeHtml(gate.summary || 'Review this step before continuing.')}</p>
                <div class="operator-two-gate-status">
                    <span>Status</span>
                    <strong>${escapeHtml(gate.status || 'Needs Review')}</strong>
                </div>
                ${blockerMarkup(gate.blockers || [])}
                <div class="operator-two-gate-actions">
                    ${(gate.actions || []).map(actionMarkup).join('')}
                </div>
            </article>
        `;
    }

    function renderTwoGateFlow(target, config = {}) {
        const host = typeof target === 'string' ? document.querySelector(target) : target;
        if (!host) return;

        const gates = config.gates || [config.gateOne || {}, config.gateTwo || {}];
        host.innerHTML = `
            <section class="operator-two-gate-flow" aria-label="${escapeHtml(config.title || 'Two gate workflow')}">
                <div class="operator-two-gate-heading">
                    <span>${escapeHtml(config.eyebrow || 'Two-gate Simple Mode flow')}</span>
                    <h2>${escapeHtml(config.title || 'Preview, then confirm')}</h2>
                    <p>${escapeHtml(config.summary || 'Simple Mode shows one review step and one final action step. Advanced diagnostics stay available separately.')}</p>
                </div>
                <div class="operator-two-gate-grid">
                    ${gates.slice(0, 2).map((gate, index) => renderGate(gate, index + 1)).join('')}
                </div>
                <div class="operator-two-gate-footer">
                    <strong>${escapeHtml(config.footerTitle || 'Safety boundary')}</strong>
                    <span>${escapeHtml(config.footer || 'Backend safety checks still run. Simple Mode keeps the owner-facing flow readable.')}</span>
                </div>
            </section>
        `;
    }

    window.EtherealOperatorGates = {
        renderTwoGateFlow,
        normalizeTone,
        escapeHtml
    };
}());
