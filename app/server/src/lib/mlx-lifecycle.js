const DEFAULT_MLX_MODEL = 'mlx-community/Qwen3-Coder-Next-4bit';
const DEFAULT_MLX_HOST = '127.0.0.1';
const DEFAULT_MLX_PORT = 8080;
const DEFAULT_STARTUP_TIMEOUT_MS = 180000;
const DEFAULT_UNLOAD_MODELS = [
  'qwen3.6:35b-a3b',
  'qwen3-coder-next:latest',
  'deepseek-r1:70b',
  'llama3:latest'
];

function normalizeMlxLifecycleConfig(modelConfig = {}, env = process.env) {
  const provider = modelConfig.providers?.mlx || {};
  const lifecycle = provider.lifecycle || {};
  const host = lifecycle.host || env.MLX_HOST || DEFAULT_MLX_HOST;
  const port = Number(lifecycle.port || env.MLX_PORT || DEFAULT_MLX_PORT);
  const model = lifecycle.model || env.MLX_MODEL || DEFAULT_MLX_MODEL;
  const maxTokens = Number(lifecycle.maxTokens || env.MLX_MAX_TOKENS || 512);
  const temperature = Number(lifecycle.temperature ?? env.MLX_TEMPERATURE ?? 0);
  const command = lifecycle.command || env.MLX_LM_SERVER_COMMAND || '/Users/ethereal/.local/bin/mlx_lm.server';
  const baseUrl = provider.baseUrl || `http://${host}:${port}/v1`;
  const startupTimeoutMs = Math.min(
    Math.max(Number(lifecycle.startupTimeoutMs || env.MLX_STARTUP_TIMEOUT_MS || DEFAULT_STARTUP_TIMEOUT_MS), 5000),
    600000
  );
  const unloadOllamaModels = Array.isArray(lifecycle.memoryIsolation?.unloadOllamaModels)
    ? lifecycle.memoryIsolation.unloadOllamaModels
    : DEFAULT_UNLOAD_MODELS;
  const args = Array.isArray(lifecycle.args)
    ? lifecycle.args
    : [
      '--host',
      host,
      '--port',
      String(port),
      '--model',
      model,
      '--max-tokens',
      String(maxTokens),
      '--temp',
      String(temperature)
    ];

  return {
    provider: 'mlx',
    providerType: 'openai_compatible',
    host,
    port,
    baseUrl,
    model,
    command,
    args,
    maxTokens,
    temperature,
    startupTimeoutMs,
    memoryIsolation: {
      unloadOllamaBeforeStart: lifecycle.memoryIsolation?.unloadOllamaBeforeStart !== false,
      unloadOllamaModels
    }
  };
}

function parseOllamaPs(stdout = '') {
  return String(stdout || '')
    .split('\n')
    .slice(1)
    .map(line => line.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function createMlxLifecycleRuntime({
  readModelConfig,
  spawn,
  execFileCapture,
  fetchImpl = fetch,
  env = process.env,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  now = () => new Date()
}) {
  let managedProcess = null;
  let startedAt = null;
  let lastExit = null;
  const logs = [];

  function pushLog(level, message, metadata = {}) {
    logs.unshift({
      level,
      message,
      metadata,
      createdAt: now().toISOString()
    });
    logs.splice(40);
  }

  function getConfig() {
    return normalizeMlxLifecycleConfig(readModelConfig(), env);
  }

  function isManagedProcessRunning() {
    return Boolean(managedProcess && managedProcess.exitCode === null && managedProcess.signalCode === null);
  }

  async function fetchJsonWithTimeout(url, timeoutMs = 2000) {
    const controller = new AbortController();
    const timeout = setTimeoutFn(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));

      return {
        ok: response.ok,
        status: response.status,
        data
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error.name === 'AbortError' ? 'MLX health check timed out' : error.message
      };
    } finally {
      clearTimeoutFn(timeout);
    }
  }

  async function checkMlxServer(config = getConfig()) {
    const health = await fetchJsonWithTimeout(`${config.baseUrl}/models`);
    const installedModels = Array.isArray(health.data?.data)
      ? health.data.data.map(model => model.id || model.name).filter(Boolean)
      : [];

    return {
      ok: health.ok,
      baseUrl: config.baseUrl,
      model: config.model,
      installedModels,
      message: health.ok
        ? 'MLX server is reachable'
        : (health.error || `MLX endpoint returned HTTP ${health.status}`)
    };
  }

  async function getLoadedOllamaModels() {
    if (!execFileCapture) {
      return {
        ok: false,
        models: [],
        message: 'Ollama process inspection is unavailable'
      };
    }

    const result = await execFileCapture('ollama', ['ps'], {
      timeout: 10000
    });

    return {
      ok: result.exitCode === 0,
      models: result.exitCode === 0 ? parseOllamaPs(result.stdout) : [],
      stdout: result.stdout,
      stderr: result.stderr,
      message: result.exitCode === 0 ? 'Ollama running model list loaded' : (result.stderr || result.error)
    };
  }

  async function getStatus() {
    const config = getConfig();
    const [server, ollamaLoaded] = await Promise.all([
      checkMlxServer(config),
      getLoadedOllamaModels()
    ]);
    const targetUnload = config.memoryIsolation.unloadOllamaModels;
    const conflictingLoadedModels = ollamaLoaded.models.filter(model => targetUnload.includes(model));

    return {
      ok: server.ok,
      status: server.ok ? 'running' : (isManagedProcessRunning() ? 'starting' : 'stopped'),
      managed: isManagedProcessRunning(),
      provider: 'mlx',
      providerType: 'openai_compatible',
      server,
      process: {
        pid: isManagedProcessRunning() ? managedProcess.pid : null,
        startedAt,
        lastExit
      },
      command: {
        command: config.command,
        args: config.args
      },
      memoryIsolation: {
        enabled: true,
        unloadOllamaBeforeStart: config.memoryIsolation.unloadOllamaBeforeStart,
        unloadOllamaModels: targetUnload,
        loadedOllamaModels: ollamaLoaded.models,
        conflictingLoadedModels,
        isolated: conflictingLoadedModels.length === 0,
        message: conflictingLoadedModels.length === 0
          ? 'No configured Ollama models are currently loaded'
          : `Loaded Ollama model(s) may compete with MLX memory: ${conflictingLoadedModels.join(', ')}`
      },
      logs
    };
  }

  async function unloadOllamaModels(models) {
    if (!execFileCapture) {
      return [];
    }

    const loaded = await getLoadedOllamaModels();
    const targets = loaded.models.filter(model => models.includes(model));
    const results = [];

    for (const model of targets) {
      const result = await execFileCapture('ollama', ['stop', model], {
        timeout: 30000
      });
      results.push({
        model,
        ok: result.exitCode === 0,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error
      });
      pushLog(result.exitCode === 0 ? 'info' : 'warning', `Ollama unload ${result.exitCode === 0 ? 'succeeded' : 'failed'} for ${model}`, {
        model,
        exitCode: result.exitCode,
        stderr: result.stderr
      });
    }

    return results;
  }

  async function waitForHealthy(config) {
    const deadline = Date.now() + config.startupTimeoutMs;

    while (Date.now() < deadline) {
      const health = await checkMlxServer(config);

      if (health.ok) {
        return health;
      }

      await new Promise(resolve => setTimeoutFn(resolve, 1000));
    }

    return checkMlxServer(config);
  }

  async function start({ unloadOllama = true } = {}) {
    const config = getConfig();
    const current = await checkMlxServer(config);

    if (current.ok) {
      return {
        ok: true,
        action: 'already_running',
        status: await getStatus()
      };
    }

    const unloadResults = unloadOllama && config.memoryIsolation.unloadOllamaBeforeStart
      ? await unloadOllamaModels(config.memoryIsolation.unloadOllamaModels)
      : [];

    if (isManagedProcessRunning()) {
      return {
        ok: false,
        action: 'already_starting',
        unloadResults,
        status: await getStatus()
      };
    }

    if (!spawn) {
      throw new Error('MLX lifecycle cannot start a process in this runtime');
    }

    pushLog('info', 'Starting MLX server', {
      command: config.command,
      args: config.args,
      unloadOllama
    });
    managedProcess = spawn(config.command, config.args, {
      env: {
        ...env,
        PYTHONUNBUFFERED: '1'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    startedAt = now().toISOString();
    lastExit = null;

    managedProcess.stdout?.on('data', chunk => {
      pushLog('info', String(chunk).trim().slice(0, 1000), {
        stream: 'stdout'
      });
    });
    managedProcess.stderr?.on('data', chunk => {
      pushLog('warning', String(chunk).trim().slice(0, 1000), {
        stream: 'stderr'
      });
    });
    managedProcess.on('exit', (code, signal) => {
      lastExit = {
        code,
        signal,
        at: now().toISOString()
      };
      pushLog(code === 0 ? 'info' : 'error', 'MLX server process exited', lastExit);
    });

    const server = await waitForHealthy(config);
    const status = await getStatus();

    return {
      ok: server.ok,
      action: server.ok ? 'started' : 'start_timeout',
      unloadResults,
      status
    };
  }

  async function stop() {
    if (!isManagedProcessRunning()) {
      return {
        ok: false,
        action: 'not_managed',
        status: await getStatus()
      };
    }

    pushLog('info', 'Stopping managed MLX server', {
      pid: managedProcess.pid
    });
    managedProcess.kill('SIGTERM');
    await new Promise(resolve => {
      const timeout = setTimeoutFn(resolve, 5000);
      managedProcess.once('exit', () => {
        clearTimeoutFn(timeout);
        resolve();
      });
    });

    if (isManagedProcessRunning()) {
      managedProcess.kill('SIGKILL');
    }

    return {
      ok: true,
      action: 'stopped',
      status: await getStatus()
    };
  }

  return {
    getStatus,
    start,
    stop,
    unloadOllamaModels,
    parseOllamaPs
  };
}

module.exports = {
  DEFAULT_MLX_MODEL,
  normalizeMlxLifecycleConfig,
  parseOllamaPs,
  createMlxLifecycleRuntime
};
