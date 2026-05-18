const fs = require('fs');
const path = require('path');

function categorizeRoutePath(routePath) {
  if (routePath === '/logout') {
    return {
      category: 'Authentication',
      moduleId: 'auth',
      suggestedFile: 'app/server/src/routes/auth.js'
    };
  }

  if (['/', '/login', '/signup'].includes(routePath)) {
    return {
      category: 'Public/Auth Pages',
      moduleId: 'pages',
      suggestedFile: 'app/server/src/routes/pages.js'
    };
  }

  if (!routePath.startsWith('/api/')) {
    return {
      category: 'Protected Pages',
      moduleId: 'pages',
      suggestedFile: 'app/server/src/routes/pages.js'
    };
  }

  if (routePath.startsWith('/api/v1/auth')) {
    return {
      category: 'Authentication',
      moduleId: 'auth',
      suggestedFile: 'app/server/src/routes/auth.js'
    };
  }

  if (
    routePath.startsWith('/api/v1/model-roles')
    || routePath.startsWith('/api/v1/policy')
    || routePath.startsWith('/api/v1/company-identity')
    || routePath.startsWith('/api/v1/health')
    || routePath.startsWith('/api/v1/local-verification-status')
    || routePath.startsWith('/api/v1/mvp-readiness-checklist')
    || routePath.startsWith('/api/v1/owner-acceptance')
    || routePath.startsWith('/api/v1/owner-proof-packet')
    || routePath.startsWith('/api/v1/server-route-inventory')
    || routePath.startsWith('/api/v1/dev-server')
    || routePath.startsWith('/api/v1/system-memory')
  ) {
    return {
      category: 'System Status',
      moduleId: 'system',
      suggestedFile: 'app/server/src/routes/system.js'
    };
  }

  if (
    routePath.startsWith('/api/v1/automation-safety')
    || routePath.startsWith('/api/v1/launch-readiness')
    || routePath.startsWith('/api/v1/live-execution-handoff')
  ) {
    return {
      category: 'Automation Safety',
      moduleId: 'automation-safety',
      suggestedFile: 'app/server/src/routes/automation-safety.js'
    };
  }

  if (routePath.startsWith('/api/v1/artifacts')) {
    return {
      category: 'Artifacts',
      moduleId: 'artifacts',
      suggestedFile: 'app/server/src/routes/artifacts.js'
    };
  }

  if (routePath.startsWith('/api/v1/local-model')) {
    return {
      category: 'Local Models',
      moduleId: 'local-models',
      suggestedFile: 'app/server/src/routes/local-models.js'
    };
  }

  if (routePath.startsWith('/api/v1/multi-agent')) {
    return {
      category: 'Multi-Agent Coordination',
      moduleId: 'multi-agent',
      suggestedFile: 'app/server/src/routes/multi-agent.js'
    };
  }

  if (routePath.startsWith('/api/v1/creator')) {
    return {
      category: 'Creator Agent',
      moduleId: 'creator',
      suggestedFile: 'app/server/src/routes/creator.js'
    };
  }

  if (routePath.startsWith('/api/v1/workspaces')) {
    return {
      category: 'Workspaces',
      moduleId: 'workspaces',
      suggestedFile: 'app/server/src/routes/workspaces.js'
    };
  }

  if (routePath.startsWith('/api/v1/file-proposals')) {
    return {
      category: 'File Proposals',
      moduleId: 'file-proposals',
      suggestedFile: 'app/server/src/routes/file-proposals.js'
    };
  }

  if (
    routePath.startsWith('/api/v1/git')
    || routePath.startsWith('/api/v1/command')
  ) {
    return {
      category: 'Commands And Git',
      moduleId: 'commands',
      suggestedFile: 'app/server/src/routes/commands.js'
    };
  }

  if (
    routePath.startsWith('/api/v1/strategies')
    || routePath.startsWith('/api/v1/backtests')
    || routePath.startsWith('/api/v1/optimization-sweeps')
    || routePath.startsWith('/api/v1/split-tests')
    || routePath.startsWith('/api/v1/walk-forward-tests')
    || routePath.startsWith('/api/v1/decision-logs')
    || routePath.startsWith('/api/v1/paper-sessions')
  ) {
    return {
      category: 'Strategy Research',
      moduleId: 'strategy-research',
      suggestedFile: 'app/server/src/routes/strategy-research.js'
    };
  }

  if (
    routePath.startsWith('/api/v1/local-secret')
    || routePath.startsWith('/api/v1/exchange')
  ) {
    return {
      category: 'Exchange Metadata',
      moduleId: 'exchange-metadata',
      suggestedFile: 'app/server/src/routes/exchange-metadata.js'
    };
  }

  if (routePath.startsWith('/api/v1/market-data')) {
    return {
      category: 'Market Data',
      moduleId: 'market-data',
      suggestedFile: 'app/server/src/routes/market-data.js'
    };
  }

  if (
    routePath.startsWith('/api/v1/risk-profiles')
    || routePath.startsWith('/api/v1/risk-profile-audit-events')
  ) {
    return {
      category: 'Risk Profiles',
      moduleId: 'risk-profiles',
      suggestedFile: 'app/server/src/routes/risk-profiles.js'
    };
  }

  if (
    routePath.startsWith('/api/v1/bot-automation')
    || routePath.startsWith('/api/v1/bot-live')
  ) {
    return {
      category: 'Bot Automation',
      moduleId: 'bot-automation',
      suggestedFile: 'app/server/src/routes/bot-automation.js'
    };
  }

  if (routePath.startsWith('/api/v1/order-intents')) {
    return {
      category: 'Order Intents',
      moduleId: 'order-intents',
      suggestedFile: 'app/server/src/routes/order-intents.js'
    };
  }

  if (
    routePath.startsWith('/api/v1/solidity')
    || routePath.startsWith('/api/v1/token-ecosystem')
  ) {
    return {
      category: 'Solidity Lab',
      moduleId: 'solidity-lab',
      suggestedFile: 'app/server/src/routes/solidity-lab.js'
    };
  }

  if (routePath.startsWith('/api/v1/social')) {
    return {
      category: 'Social Ops',
      moduleId: 'social-ops',
      suggestedFile: 'app/server/src/routes/social-ops.js'
    };
  }

  return {
    category: 'Uncategorized',
    moduleId: 'other',
    suggestedFile: 'app/server/src/routes/other.js'
  };
}

function countBy(rows, getKey) {
  return rows.reduce((totals, row) => {
    const key = getKey(row);
    totals[key] = (totals[key] || 0) + 1;
    return totals;
  }, {});
}

function getModuleSafetyProfile(moduleId) {
  if (moduleId === 'bot-automation') {
    return {
      level: 'safety_critical',
      boundary: 'monitor_only_no_live_orders',
      liveExecutionEnabled: false,
      ownerReviewRequired: true
    };
  }

  if (moduleId === 'automation-safety') {
    return {
      level: 'safety_critical',
      boundary: 'blocks_live_launch',
      liveExecutionEnabled: false,
      ownerReviewRequired: true
    };
  }

  if (moduleId === 'multi-agent') {
    return {
      level: 'local_orchestration',
      boundary: 'local_coordination_no_external_actions',
      liveExecutionEnabled: false,
      externalPostingEnabled: false,
      deploymentEnabled: false,
      ownerReviewRequired: true
    };
  }

  if (moduleId === 'exchange-metadata') {
    return {
      level: 'sensitive_metadata',
      boundary: 'metadata_only_no_credentials',
      liveExecutionEnabled: false,
      ownerReviewRequired: true
    };
  }

  if (moduleId === 'order-intents') {
    return {
      level: 'safety_review',
      boundary: 'risk_review_no_execution',
      liveExecutionEnabled: false,
      ownerReviewRequired: true
    };
  }

  if (moduleId === 'social-ops') {
    return {
      level: 'external_surface_blocked',
      boundary: 'local_drafts_no_external_posting',
      liveExecutionEnabled: false,
      externalPostingEnabled: false,
      ownerReviewRequired: true
    };
  }

  if (moduleId === 'solidity-lab') {
    return {
      level: 'external_surface_blocked',
      boundary: 'local_scaffold_no_deployment',
      liveExecutionEnabled: false,
      deploymentEnabled: false,
      ownerReviewRequired: true
    };
  }

  return {
    level: 'standard',
    boundary: 'standard_app_route',
    liveExecutionEnabled: false,
    ownerReviewRequired: false
  };
}

function isRouteProtected(routePath, line) {
  if (line.includes('requireAuth') || line.includes('requirePageAuth')) {
    return true;
  }

  if (routePath.startsWith('/api/v1/auth')) {
    return false;
  }

  if (routePath.startsWith('/api/')) {
    return false;
  }

  return !['/', '/login', '/signup', '/logout'].includes(routePath);
}

function getRouteInventoryFiles({ projectRoot, serverFile }) {
  const files = [serverFile];
  const routesDir = path.join(path.dirname(serverFile), 'routes');

  if (fs.existsSync(routesDir)) {
    fs.readdirSync(routesDir)
      .filter(fileName => fileName.endsWith('.js'))
      .sort()
      .forEach(fileName => {
        files.push(path.join(routesDir, fileName));
      });
  }

  return files.map(filePath => {
    const source = fs.readFileSync(filePath, 'utf8');
    const lines = source.split(/\r?\n/);

    return {
      filePath,
      displayPath: path.relative(projectRoot, filePath),
      lines,
      lineCount: lines.length
    };
  });
}

function getServerRouteInventory({ projectRoot, serverFile }) {
  const files = getRouteInventoryFiles({ projectRoot, serverFile });
  const routePattern = /app\.(get|post|patch|delete|put)\(\s*['"`]([^'"`]+)['"`]\s*,/;
  const routes = [];

  files.forEach(file => {
    file.lines.forEach((line, index) => {
      const match = line.match(routePattern);

      if (!match) {
        return;
      }

      const method = match[1].toUpperCase();
      const routePath = match[2];
      const categorization = categorizeRoutePath(routePath);

      routes.push({
        method,
        path: routePath,
        file: file.displayPath,
        line: index + 1,
        protected: isRouteProtected(routePath, line),
        ...categorization
      });
    });
  });

  const modules = Object.entries(
    routes.reduce((groups, route) => {
      groups[route.moduleId] = groups[route.moduleId] || {
        moduleId: route.moduleId,
        category: route.category,
        suggestedFile: route.suggestedFile,
        routes: []
      };
      groups[route.moduleId].routes.push(route);
      return groups;
    }, {})
  )
    .map(([, module]) => ({
      moduleId: module.moduleId,
      category: module.category,
      suggestedFile: module.suggestedFile,
      routeCount: module.routes.length,
      protectedRouteCount: module.routes.filter(route => route.protected).length,
      methods: countBy(module.routes, route => route.method),
      files: [...new Set(module.routes.map(route => route.file))],
      safetyProfile: getModuleSafetyProfile(module.moduleId),
      firstLine: Math.min(...module.routes.map(route => route.line)),
      lastLine: Math.max(...module.routes.map(route => route.line))
    }))
    .sort((left, right) => right.routeCount - left.routeCount || left.firstLine - right.firstLine);

  return {
    generatedAt: new Date().toISOString(),
    serverFile: path.relative(projectRoot, serverFile),
    scannedFiles: files.map(file => ({
      path: file.displayPath,
      lineCount: file.lineCount
    })),
    lineCount: files.reduce((sum, file) => sum + file.lineCount, 0),
    totalRoutes: routes.length,
    protectedRoutes: routes.filter(route => route.protected).length,
    publicRoutes: routes.filter(route => !route.protected).length,
    methods: countBy(routes, route => route.method),
    moduleCount: modules.length,
    safetyCriticalModules: modules.filter(module => module.safetyProfile.level !== 'standard').length,
    modules,
    routes,
    modularizationPlan: {
      status: 'inventory_only_no_route_split_applied',
      nextSafeStep: 'Extract one low-dependency route group at a time behind baseline and authenticated verifier coverage.',
      recommendedOrder: modules.map(module => module.moduleId)
    }
  };
}

module.exports = {
  getServerRouteInventory
};
