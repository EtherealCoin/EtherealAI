const {
  sanitizeTrustedCommandPrefixes,
  splitCommandForExec
} = require('./command-safety');

const COMMAND_TEMPLATES = [
  {
    id: 'git-status',
    label: 'Git Status',
    description: 'Show the current Git working tree state.',
    command: 'git status'
  },
  {
    id: 'git-diff',
    label: 'Git Diff',
    description: 'Show unstaged code changes.',
    command: 'git diff'
  },
  {
    id: 'server-syntax',
    label: 'Server Syntax Check',
    description: 'Check the main server file for JavaScript syntax errors.',
    command: 'node --check app/server/src/server.js',
    scope: 'project'
  },
  {
    id: 'workspace-node-syntax',
    label: 'Workspace Node Syntax',
    description: 'Check src/index.js inside the selected workspace.',
    command: 'node --check src/index.js',
    scope: 'workspace'
  },
  {
    id: 'node-version',
    label: 'Node Version',
    description: 'Show the Node.js runtime version used by this project.',
    command: 'node --version',
    scope: 'project'
  },
  {
    id: 'npm-test',
    label: 'NPM Test',
    description: 'Run the project test script when one exists.',
    command: 'npm test',
    scope: 'project'
  },
  {
    id: 'npm-build',
    label: 'NPM Build',
    description: 'Run the project build script.',
    command: 'npm run build',
    scope: 'project'
  }
];

function createCommandRuntime({
  path,
  projectRoot,
  readAutomationPolicy,
  getWorkspace,
  execFileCapture,
  dbRun,
  dbGet,
  saveAgentEvent
}) {
  function getTrustedCommandPrefixes() {
    return sanitizeTrustedCommandPrefixes(readAutomationPolicy().localAutomation.trustedCommandPrefixes);
  }

  function isCommandAllowed(command) {
    let normalized;

    try {
      ({ normalized } = splitCommandForExec(command));
    } catch (error) {
      return {
        allowed: false,
        reason: error.message
      };
    }

    const matchedPrefix = getTrustedCommandPrefixes().find(prefix =>
      normalized === prefix || normalized.startsWith(`${prefix} `)
    );

    if (!matchedPrefix) {
      return {
        allowed: false,
        reason: 'Command needs manual review before it can be considered for execution'
      };
    }

    return {
      allowed: true,
      reason: `Command matches safe review prefix: ${matchedPrefix}`
    };
  }

  function parseSafeCommand(command) {
    const parsed = splitCommandForExec(command);
    const review = isCommandAllowed(parsed.normalized);

    if (!review.allowed) {
      throw new Error(review.reason);
    }

    return {
      bin: parsed.bin,
      args: parsed.args
    };
  }

  function serializeCommandTemplate(template) {
    const review = isCommandAllowed(template.command);

    return {
      ...template,
      allowed: review.allowed,
      reason: review.reason
    };
  }

  function getCommandTemplate(templateId) {
    return COMMAND_TEMPLATES.find(template => template.id === templateId) || null;
  }

  async function executeCommandRequest(commandRequest) {
    const parsed = parseSafeCommand(commandRequest.command);
    const workspace = commandRequest.workspace_id
      ? await getWorkspace(commandRequest.workspace_id)
      : null;
    const cwd = parsed.bin === 'git' ? projectRoot : (workspace ? workspace.path : projectRoot);
    const relativeWorkspace = path.relative(projectRoot, cwd);

    if (relativeWorkspace.startsWith('..') || path.isAbsolute(relativeWorkspace)) {
      throw new Error('Workspace is outside the approved project boundary');
    }

    const run = await execFileCapture(parsed.bin, parsed.args, { cwd });
    const status = run.exitCode === 0 ? 'executed' : 'failed';

    const runResult = await dbRun(
      `INSERT INTO command_runs
       (command_request_id, status, exit_code, stdout, stderr)
       VALUES (?, ?, ?, ?, ?)`,
      [
        commandRequest.id,
        status,
        run.exitCode,
        run.stdout,
        run.stderr || run.error
      ]
    );

    await dbRun(
      'UPDATE command_requests SET status = ? WHERE id = ?',
      [status, commandRequest.id]
    );

    if (commandRequest.task_id) {
      await saveAgentEvent(commandRequest.task_id, 'command.executed', 'Safe command request was executed', {
        commandRequestId: commandRequest.id,
        commandRunId: runResult.lastID,
        status,
        exitCode: run.exitCode
      });
    }

    return dbGet(
      'SELECT * FROM command_runs WHERE id = ?',
      [runResult.lastID]
    );
  }

  async function createCommandRequestRecord({
    taskId = null,
    workspaceId = null,
    command
  }) {
    if (!command || typeof command !== 'string') {
      throw new Error('Command is required');
    }

    const review = isCommandAllowed(command);
    const status = review.allowed ? 'review_ready' : 'blocked';
    const result = await dbRun(
      `INSERT INTO command_requests
       (task_id, workspace_id, command, status, risk_level, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        workspaceId,
        command.trim(),
        status,
        review.allowed ? 'low' : 'manual',
        review.reason
      ]
    );

    if (taskId) {
      await saveAgentEvent(taskId, 'command.requested', 'Command request was recorded', {
        commandRequestId: result.lastID,
        status,
        reason: review.reason
      });
    }

    const commandRequest = await dbGet(
      'SELECT * FROM command_requests WHERE id = ?',
      [result.lastID]
    );
    const policy = readAutomationPolicy();

    if (review.allowed && policy.localAutomation.autoRunLowRiskCommands) {
      const commandRun = await executeCommandRequest(commandRequest);
      const updatedCommandRequest = await dbGet(
        'SELECT * FROM command_requests WHERE id = ?',
        [result.lastID]
      );

      return {
        commandRequest: updatedCommandRequest,
        commandRun,
        autoRan: true
      };
    }

    return {
      commandRequest,
      autoRan: false
    };
  }

  return {
    commandTemplates: COMMAND_TEMPLATES,
    getTrustedCommandPrefixes,
    isCommandAllowed,
    parseSafeCommand,
    serializeCommandTemplate,
    getCommandTemplate,
    executeCommandRequest,
    createCommandRequestRecord
  };
}

module.exports = {
  COMMAND_TEMPLATES,
  createCommandRuntime
};
