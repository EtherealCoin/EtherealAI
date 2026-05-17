function createLocalModelRuntime({
  readModelConfig,
  chooseModelRoleForPrompt,
  fetchImpl = fetch,
  env = process.env,
  AbortControllerClass = AbortController,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout
}) {
  function getProviderMap(modelConfig = {}) {
    const providers = modelConfig.providers && typeof modelConfig.providers === 'object'
      ? { ...modelConfig.providers }
      : {};

    if (modelConfig.provider && typeof modelConfig.provider === 'object') {
      const legacyName = modelConfig.provider.name || 'ollama';
      providers[legacyName] = {
        ...modelConfig.provider,
        name: legacyName,
        type: modelConfig.provider.type || legacyName
      };
    }

    return providers;
  }

  function normalizeProvider(provider = {}, name = 'ollama') {
    const providerType = String(provider.type || provider.name || name || 'ollama')
      .trim()
      .toLowerCase()
      .replace(/-/g, '_');

    return {
      ...provider,
      name: provider.name || name,
      type: providerType
    };
  }

  function getProviderConfig(modelConfig = {}, roleConfig = {}, overrideProvider) {
    const providers = getProviderMap(modelConfig);
    const providerName = overrideProvider
      || roleConfig.provider
      || modelConfig.defaultProvider
      || modelConfig.provider?.name
      || Object.keys(providers)[0]
      || 'ollama';
    const provider = providers[providerName];

    if (!provider) {
      const validProviders = Object.keys(providers).join(', ') || 'none';
      throw new Error(`Unknown model provider. Valid providers: ${validProviders}`);
    }

    return normalizeProvider(provider, providerName);
  }

  function getProviderBaseUrl(provider) {
    if (provider.type === 'ollama') {
      return env.OLLAMA_BASE_URL || provider.baseUrl;
    }

    if (provider.type === 'openai_compatible') {
      const envName = provider.baseUrlEnv || `${String(provider.name || 'MLX').toUpperCase()}_BASE_URL`;
      return env[envName] || env.MLX_BASE_URL || provider.baseUrl;
    }

    return provider.baseUrl;
  }

  function getRequestTimeoutMs(value, defaultTimeoutMs) {
    const timeoutMs = Number(value || defaultTimeoutMs);

    if (!Number.isFinite(timeoutMs)) {
      return defaultTimeoutMs;
    }

    return Math.min(Math.max(timeoutMs, 1000), 300000);
  }

  async function readJsonResponse(response) {
    try {
      return await response.json();
    } catch (error) {
      return {};
    }
  }

  async function checkProvider(providerName, providerConfig, timeoutMs = 2000) {
    const provider = normalizeProvider(providerConfig, providerName);
    const baseUrl = getProviderBaseUrl(provider);
    const controller = new AbortControllerClass();
    const timeout = setTimeoutFn(() => controller.abort(), timeoutMs);

    try {
      if (provider.type === 'ollama') {
        const response = await fetchImpl(`${baseUrl}/api/tags`, {
          signal: controller.signal
        });
        const data = await readJsonResponse(response);
        const installedModels = Array.isArray(data.models)
          ? data.models.map(model => model.name)
          : [];

        return {
          ok: response.ok,
          provider: provider.name,
          providerType: provider.type,
          optional: Boolean(provider.optional),
          baseUrl,
          installedModels,
          message: response.ok ? 'Ollama is reachable' : `Ollama returned HTTP ${response.status}`
        };
      }

      if (provider.type === 'openai_compatible') {
        const response = await fetchImpl(`${baseUrl}/models`, {
          signal: controller.signal
        });
        const data = await readJsonResponse(response);
        const installedModels = Array.isArray(data.data)
          ? data.data.map(model => model.id || model.name).filter(Boolean)
          : [];

        return {
          ok: response.ok,
          provider: provider.name,
          providerType: provider.type,
          optional: Boolean(provider.optional),
          baseUrl,
          installedModels,
          message: response.ok
            ? `${provider.name} OpenAI-compatible endpoint is reachable`
            : `${provider.name} endpoint returned HTTP ${response.status}`
        };
      }

      return {
        ok: false,
        provider: provider.name,
        providerType: provider.type,
        optional: Boolean(provider.optional),
        baseUrl,
        installedModels: [],
        message: `Unsupported model provider type: ${provider.type}`
      };
    } catch (error) {
      return {
        ok: false,
        provider: provider.name,
        providerType: provider.type,
        optional: Boolean(provider.optional),
        baseUrl,
        installedModels: [],
        message: error.name === 'AbortError'
          ? `${provider.name} health check timed out`
          : error.message
      };
    } finally {
      clearTimeoutFn(timeout);
    }
  }

  async function checkLocalModelProviders(modelConfig) {
    const providers = getProviderMap(modelConfig);
    const results = await Promise.all(Object.entries(providers).map(([providerName, providerConfig]) => (
      checkProvider(providerName, providerConfig)
    )));

    return {
      ok: results.every(provider => provider.ok || provider.optional),
      providers: results
    };
  }

  async function checkOllama(modelConfig) {
    const providerConfig = getProviderMap(modelConfig).ollama || modelConfig.provider || {
      name: 'ollama',
      type: 'ollama',
      baseUrl: 'http://127.0.0.1:11434'
    };

    return checkProvider('ollama', providerConfig);
  }

  async function generateWithOllama({ baseUrl, roleConfig, prompt, signal, maxTokens }) {
    const options = {
      temperature: roleConfig.temperature
    };
    const body = {
      model: roleConfig.model,
      prompt,
      stream: false,
      options
    };

    if (maxTokens) {
      options.num_predict = maxTokens;
    }

    if (typeof roleConfig.think === 'boolean') {
      body.think = roleConfig.think;
    }

    const response = await fetchImpl(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal,
      body: JSON.stringify(body)
    });
    const data = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.error || `Ollama returned HTTP ${response.status}`);
    }

    return {
      response: data.response || '',
      thinking: data.thinking || '',
      done: Boolean(data.done)
    };
  }

  async function generateWithOpenAiCompatible({ provider, baseUrl, roleConfig, prompt, signal, maxTokens }) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (provider.apiKeyEnv && env[provider.apiKeyEnv]) {
      headers.Authorization = `Bearer ${env[provider.apiKeyEnv]}`;
    }

    const body = {
      model: roleConfig.model,
      stream: false,
      temperature: roleConfig.temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    if (maxTokens) {
      body.max_tokens = maxTokens;
    }

    const response = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify(body)
    });
    const data = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.error?.message || data.error || `${provider.name} returned HTTP ${response.status}`);
    }

    return {
      response: data.choices?.[0]?.message?.content
        || (typeof data.choices?.[0]?.message === 'string' ? data.choices[0].message : '')
        || data.choices?.[0]?.text
        || '',
      thinking: data.choices?.[0]?.message?.thinking || '',
      done: true
    };
  }

  async function generateWithLocalModel(role, prompt, overrides = {}) {
    const modelConfig = readModelConfig();
    const routing = chooseModelRoleForPrompt(prompt, role, modelConfig);
    const baseRoleConfig = modelConfig.roles[routing.role];

    if (!baseRoleConfig) {
      const validRoles = Object.keys(modelConfig.roles).join(', ');
      throw new Error(`Unknown model role. Valid roles: ${validRoles}`);
    }

    const roleConfig = {
      ...baseRoleConfig,
      provider: overrides.provider || baseRoleConfig.provider,
      model: overrides.model || baseRoleConfig.model,
      think: typeof overrides.think === 'boolean' ? overrides.think : baseRoleConfig.think
    };
    const provider = getProviderConfig(modelConfig, roleConfig, overrides.provider);
    const baseUrl = getProviderBaseUrl(provider);
    const controller = new AbortControllerClass();
    const timeout = setTimeoutFn(
      () => controller.abort(),
      getRequestTimeoutMs(overrides.timeoutMs, 120000)
    );
    const maxTokens = Number(overrides.maxTokens || 0) > 0
      ? Math.min(Math.max(Number(overrides.maxTokens), 1), 4096)
      : null;

    try {
      const generation = provider.type === 'ollama'
        ? await generateWithOllama({
          baseUrl,
          roleConfig,
          prompt,
          signal: controller.signal,
          maxTokens
        })
        : await generateWithOpenAiCompatible({
          provider,
          baseUrl,
          roleConfig,
          prompt,
          signal: controller.signal,
          maxTokens
        });

      return {
        role: routing.role,
        requestedRole: role || 'auto',
        routing,
        provider: provider.name,
        providerType: provider.type,
        baseUrl,
        model: roleConfig.model,
        maxTokens,
        think: roleConfig.think,
        response: generation.response,
        thinking: generation.thinking,
        done: generation.done
      };
    } finally {
      clearTimeoutFn(timeout);
    }
  }

  async function benchmarkLocalModel({ role = 'auto', prompt, provider, model, timeoutMs, maxTokens, think } = {}) {
    const startedAt = new Date();

    try {
      const result = await generateWithLocalModel(role, prompt, {
        provider: provider === 'role-default' ? undefined : provider,
        model,
        timeoutMs: getRequestTimeoutMs(timeoutMs, 120000),
        maxTokens,
        think
      });
      const completedAt = new Date();

      return {
        ok: true,
        ...result,
        benchmark: {
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          durationMs: completedAt.getTime() - startedAt.getTime(),
          timeoutMs: getRequestTimeoutMs(timeoutMs, 120000)
        }
      };
    } catch (error) {
      const completedAt = new Date();

      return {
        ok: false,
        role,
        provider: provider || 'role-default',
        model: model || null,
        error: error.name === 'AbortError' ? 'Local model benchmark timed out' : error.message,
        benchmark: {
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          durationMs: completedAt.getTime() - startedAt.getTime(),
          timeoutMs: getRequestTimeoutMs(timeoutMs, 120000)
        }
      };
    }
  }

  return {
    checkOllama,
    checkLocalModelProviders,
    generateWithLocalModel,
    benchmarkLocalModel
  };
}

module.exports = {
  createLocalModelRuntime
};
