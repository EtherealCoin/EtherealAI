function parseDevServerRun(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    pid: row.pid,
    port: row.port,
    command: row.command,
    status: row.status,
    started_at: row.started_at,
    heartbeat_at: row.heartbeat_at,
    ended_at: row.ended_at,
    note: row.note
  };
}

function parseDevServerLog(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    run_id: row.run_id,
    level: row.level,
    message: row.message,
    metadata: JSON.parse(row.metadata_json || '{}'),
    created_at: row.created_at
  };
}

function createDevServerRuntime({
  path,
  projectRoot,
  serverFile,
  port,
  startedAt,
  dbRun,
  dbGet,
  dbAll,
  parseRun = parseDevServerRun,
  parseLog = parseDevServerLog,
  pid = process.pid,
  env = process.env,
  uptimeSeconds = () => Math.round(process.uptime())
}) {
  let devServerRunId = null;

  function getDevServerCommand() {
    if (env.npm_lifecycle_event) {
      return `npm ${env.npm_lifecycle_event}`;
    }

    return `node ${path.relative(projectRoot, serverFile)}`;
  }

  async function recordDevServerLog(level, message, metadata = {}) {
    await dbRun(
      `INSERT INTO dev_server_logs (run_id, level, message, metadata_json)
       VALUES (?, ?, ?, ?)`,
      [
        devServerRunId,
        String(level || 'info').trim().slice(0, 24) || 'info',
        String(message || '').trim().slice(0, 1000) || 'Dev server event',
        JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {})
      ]
    );
  }

  async function recordDevServerStart() {
    const command = getDevServerCommand();

    await dbRun(
      `UPDATE dev_server_runs
       SET status = 'stale', ended_at = COALESCE(ended_at, ?)
       WHERE status = 'running' AND (pid != ? OR port != ?)`,
      [startedAt, pid, port]
    );

    const result = await dbRun(
      `INSERT INTO dev_server_runs (pid, port, command, status, started_at, heartbeat_at, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        pid,
        port,
        command,
        'running',
        startedAt,
        startedAt,
        'Recorded automatically when the local server started'
      ]
    );

    devServerRunId = result.lastID;
    await recordDevServerLog('info', 'Dev server started', {
      pid,
      port,
      command
    });
  }

  async function updateDevServerHeartbeat() {
    if (!devServerRunId) {
      return;
    }

    await dbRun(
      `UPDATE dev_server_runs
       SET heartbeat_at = ?, status = 'running'
       WHERE id = ?`,
      [new Date().toISOString(), devServerRunId]
    );
  }

  async function getDevServerStatus() {
    const [latestRun, recentRuns, recentLogs] = await Promise.all([
      dbGet('SELECT * FROM dev_server_runs ORDER BY started_at DESC, id DESC LIMIT 1'),
      dbAll('SELECT * FROM dev_server_runs ORDER BY started_at DESC, id DESC LIMIT 8'),
      dbAll('SELECT * FROM dev_server_logs ORDER BY created_at DESC, id DESC LIMIT 20')
    ]);

    return {
      ok: true,
      current: {
        runId: devServerRunId,
        pid,
        port,
        command: getDevServerCommand(),
        startedAt,
        uptimeSeconds: uptimeSeconds(),
        environment: env.NODE_ENV || 'development'
      },
      latestRun: parseRun(latestRun),
      recentRuns: recentRuns.map(parseRun),
      recentLogs: recentLogs.map(parseLog)
    };
  }

  return {
    getDevServerCommand,
    recordDevServerStart,
    updateDevServerHeartbeat,
    recordDevServerLog,
    getDevServerStatus
  };
}

module.exports = {
  parseDevServerRun,
  parseDevServerLog,
  createDevServerRuntime
};
