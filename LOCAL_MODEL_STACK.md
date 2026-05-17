# EtherealAI Local Model Stack

Date: 2026-05-16

## Current Installed Models

Ollama currently reports:

- `qwen3.6:35b-a3b`
- `qwen3-coder-next:latest`
- `deepseek-r1:70b`
- `llama3:latest`

`qwen3.6:35b-a3b` is now installed in Ollama and configured as the coder target with `think:false` so the app gets normal response content instead of spending the whole output cap on thinking text. If a future machine does not show it in `ollama list`, pull it locally before relying on Creator Agent coding generation:

```bash
ollama pull qwen3.6:35b-a3b
```

`qwen3-coder-next:latest` remains installed as the fallback/heavy comparison coder model:

```bash
ollama pull qwen3-coder-next
```

## Current Recommendation

Use the upgraded stack:

- Planner: `deepseek-r1:70b`
- Coder: `qwen3.6:35b-a3b` with `think:false`
- Writer: `llama3:latest`
- Autocomplete: `qwen3.6:35b-a3b` with `think:false`

This is a sensible setup for a Mac with 128 GB unified memory. It keeps the strong DeepSeek planner, promotes newer Qwen3.6 agentic coding for the app-level coder path, keeps Qwen3-Coder-Next installed as a fallback/heavy comparison model, removes the older Qwen 2.5 models, and keeps Llama 3 for writer/social drafting.

## Provider Runtime

The app now has two local provider lanes in `config/local-models.json`:

- `ollama`: the default active provider at `http://127.0.0.1:11434`.
- `mlx`: an optional OpenAI-compatible MLX/MLX-LM lane at `http://127.0.0.1:8080/v1`.

The Dashboard has a `Local Model Benchmark` panel that can test role defaults, Ollama, or MLX without changing the production role assignment. It includes `Max Tokens` and `Disable Thinking` controls so thinking models such as Qwen3.6 can be tested in content-generation mode. The Dashboard also has an `MLX Lifecycle` panel for managed MLX status/start/stop with Ollama unload before start.

## Qwen3.6 Benchmark Result

Qwen3.6 was pulled with:

```bash
ollama pull qwen3.6:35b-a3b
```

Direct testing showed that Qwen3.6 defaults to thinking mode. With the existing capped benchmark path, thinking mode returned empty response content because the output budget was spent on reasoning text. EtherealAI now supports an Ollama `think` boolean and configures the coder role with `think:false`.

Benchmarks through EtherealAI:

- 512-token coding prompt, `think:false`: Qwen3.6 averaged `9249ms`; Qwen3-Coder-Next averaged `11399ms`; Qwen3.6 was about `19%` faster with similar output size.
- Corrected syntax/behavior smoke test, `think:false`: both Qwen3.6 and Qwen3-Coder-Next produced syntactically valid CommonJS and passed the behavior assertions. Qwen3.6 completed in `7656ms`; Qwen3-Coder-Next completed in `8504ms`.
- Qwen3.6 with `think:true` and `maxTokens: 4096` returned `0` response characters and about `15462` thinking characters, so it is not usable as the current app-level coder mode without a separate thinking-aware UI/adapter path.

Recommendation: use Qwen3.6 as the current app-level coder with `think:false`. Keep Qwen3-Coder-Next installed as a fallback and comparison model.

## MLX Benchmark Result

MLX-LM was installed with:

```bash
uv tool install mlx-lm
```

The tested MLX server command was:

```bash
mlx_lm.server --host 127.0.0.1 --port 8080 --model mlx-community/Qwen3-Coder-Next-4bit --max-tokens 128 --temp 0.0
```

The first launch downloaded the 44.9 GB MLX model in about 6.5 minutes. After startup, `/api/v1/health` reported both providers reachable:

- `ollama:true:false`
- `mlx:true:true`

Benchmarks through EtherealAI:

- Short capped code prompt, `maxTokens: 128`: MLX averaged `2342ms`, Ollama averaged `2952ms`; MLX was about `21%` faster.
- Longer code prompt, `maxTokens: 512`: MLX averaged `8105ms`, Ollama averaged `11105ms`; MLX was about `27%` faster.

Recommendation: keep Ollama as fallback, but MLX is worth integrating as the preferred heavy coding provider after EtherealAI has an owner-visible MLX server start/check control or launch script. Do not make MLX the only default until the server lifecycle is managed. A later combined benchmark crashed the MLX server with a Metal out-of-memory error while large Ollama models were also loaded, so MLX promotion needs lifecycle and memory isolation.

Current MLX lifecycle command:

```bash
/Users/ethereal/.local/bin/mlx_lm.server --host 127.0.0.1 --port 8080 --model mlx-community/Qwen3-Coder-Next-4bit --max-tokens 512 --temp 0
```

Current MLX state: MLX-LM is installed, the Hugging Face cache contains `mlx-community/Qwen3-Coder-Next-4bit`, and EtherealAI can start/stop it through `/api/v1/local-model/mlx-lifecycle`. The managed start path unloads configured Ollama models first to avoid repeating the prior Metal out-of-memory crash. After lifecycle start, `/api/v1/health` reports both `ollama` and `mlx` reachable, and MLX benchmark requests can run through EtherealAI.

Cleanup boundary: unused Ollama models `qwen2.5-coder:32b`, `qwen2.5-coder:7b`, and `qwen:latest` were removed. The MLX cache was not removed because it is the only downloaded artifact for the future MLX integration path.

## Continue / VS Code Roles

The Continue config was updated at:

`/Users/ethereal/.continue/config.yaml`

A backup was saved at:

`/Users/ethereal/.continue/config.yaml.backup-2026-05-09`

Configured roles:

- `DeepSeek Planner 70B`: `chat`
- `Qwen3 Coder Next Fallback`: `chat`, `edit`, `apply`
- `Qwen3.6 Autocomplete`: `autocomplete`

Continue config no longer references Qwen 2.5 models. The EtherealAI app config uses `qwen3.6:35b-a3b` with `think:false` for the coder and autocomplete roles.

## App-Level Routing

The local app now has automatic routing:

- `POST /api/v1/local-model/route` returns the chosen role without running inference.
- `POST /api/v1/local-model/generate` accepts `role: "auto"`.
- `POST /api/v1/local-model/benchmark` runs a timed local generation test against the role default, Ollama, or MLX.
- Dashboard and Creator model selectors now include Auto.
- Implementation prompts route to `coder`; architecture and planning prompts route to `planner`; social/content prompts route to `writer`; short completion prompts can route to `autocomplete`.

## Upgrade Path

Current coding upgrade:

- `qwen3.6:35b-a3b` is configured as the app-level coder role.
- `qwen3-coder-next:latest` remains the app-level fallback/heavy comparison model.

Reason:

- Qwen3.6 is the newer Qwen open-weight line and is positioned for agentic coding and thinking preservation.
- The local Qwen3.6 35B-A3B Q4 model is smaller than Qwen3-Coder-Next and benchmarked faster on this Mac in content-generation mode.
- Qwen3-Coder-Next is still valuable for comparison and fallback because it is coding-specialized and already installed.

Potential runtime upgrade:

- Keep Ollama as the default active provider.
- Use the MLX lane as the faster heavy-coding path once its local server lifecycle is managed.

Reason:

- MLX is designed for Apple Silicon.
- It may improve local inference speed or memory behavior for supported MLX-format models.
- Ollama is simpler and already working, so it remains the default until benchmark results justify a provider switch.

## Practical Rule

Use model size by job:

- Current local autocomplete uses Qwen3.6 to avoid retaining old Qwen 2.5 models.
- Strong coder model for file edits.
- Reasoning model for architecture and planning.
- Do not use the 70B model for every small action. That wastes time and makes the system feel slow.

## Trading Privacy Rule

Do not put the real trading edge into any cloud prompt or public repo.

Use placeholders while building:

- `ENTRY_RULE_PLACEHOLDER`
- `EXIT_RULE_PLACEHOLDER`
- `RISK_RULE_PLACEHOLDER`

The system can be built around private local strategy files later.
