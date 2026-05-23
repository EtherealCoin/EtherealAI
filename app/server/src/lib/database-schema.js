function initializeDatabase(db) {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password_hash TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS creator_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        request TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'planned',
        plan_json TEXT NOT NULL,
        model_role TEXT,
        model_name TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run('ALTER TABLE market_data_refresh_schedules ADD COLUMN backfill_start_at TEXT', () => {});
    db.run('ALTER TABLE market_data_refresh_schedules ADD COLUMN backfill_end_at TEXT', () => {});

    db.run(`
      CREATE TABLE IF NOT EXISTS agent_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        event_type TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata_json TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(task_id) REFERENCES creator_tasks(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        path TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS task_checklist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(task_id) REFERENCES creator_tasks(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS checkpoint_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        note TEXT NOT NULL,
        git_status TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(task_id) REFERENCES creator_tasks(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS command_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        workspace_id INTEGER,
        command TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        risk_level TEXT NOT NULL DEFAULT 'review',
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(task_id) REFERENCES creator_tasks(id),
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS command_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        command_request_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        exit_code INTEGER,
        stdout TEXT,
        stderr TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(command_request_id) REFERENCES command_requests(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS file_write_proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        workspace_id INTEGER NOT NULL,
        relative_path TEXT NOT NULL,
        action TEXT NOT NULL DEFAULT 'upsert',
        current_content TEXT,
        proposed_content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        applied_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(task_id) REFERENCES creator_tasks(id),
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS trading_strategies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        market_symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        strategy_type TEXT NOT NULL DEFAULT 'indicator',
        strategy_rules_json TEXT NOT NULL DEFAULT '{}',
        entry_rules TEXT NOT NULL,
        exit_rules TEXT NOT NULL,
        stop_loss REAL,
        take_profit REAL,
        risk_notes TEXT,
        status TEXT NOT NULL DEFAULT 'research',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run("ALTER TABLE trading_strategies ADD COLUMN strategy_type TEXT NOT NULL DEFAULT 'indicator'", () => {});
    db.run("ALTER TABLE trading_strategies ADD COLUMN strategy_rules_json TEXT NOT NULL DEFAULT '{}'", () => {});

    db.run(`
      CREATE TABLE IF NOT EXISTS backtest_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        strategy_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        result_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(strategy_id) REFERENCES trading_strategies(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS paper_trading_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        strategy_id INTEGER NOT NULL,
        market_data_import_id INTEGER,
        name TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'historical_replay_v1',
        status TEXT NOT NULL DEFAULT 'completed',
        initial_capital REAL NOT NULL,
        current_equity REAL NOT NULL,
        result_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(strategy_id) REFERENCES trading_strategies(id),
        FOREIGN KEY(market_data_import_id) REFERENCES market_data_imports(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS strategy_optimization_sweeps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        strategy_id INTEGER NOT NULL,
        market_data_import_id INTEGER,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        result_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(strategy_id) REFERENCES trading_strategies(id),
        FOREIGN KEY(market_data_import_id) REFERENCES market_data_imports(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS strategy_split_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        strategy_id INTEGER NOT NULL,
        market_data_import_id INTEGER,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        result_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(strategy_id) REFERENCES trading_strategies(id),
        FOREIGN KEY(market_data_import_id) REFERENCES market_data_imports(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS strategy_walk_forward_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        strategy_id INTEGER NOT NULL,
        market_data_import_id INTEGER,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        result_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(strategy_id) REFERENCES trading_strategies(id),
        FOREIGN KEY(market_data_import_id) REFERENCES market_data_imports(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS trading_decision_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        strategy_id INTEGER NOT NULL,
        backtest_id INTEGER,
        paper_session_id INTEGER,
        market_data_import_id INTEGER,
        market_symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        candle_timestamp TEXT NOT NULL,
        candle_index INTEGER NOT NULL,
        decision TEXT NOT NULL,
        reason TEXT NOT NULL,
        price REAL,
        payload_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(strategy_id) REFERENCES trading_strategies(id),
        FOREIGN KEY(backtest_id) REFERENCES backtest_runs(id),
        FOREIGN KEY(paper_session_id) REFERENCES paper_trading_sessions(id),
        FOREIGN KEY(market_data_import_id) REFERENCES market_data_imports(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS exchange_connectors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        secret_reference_id INTEGER,
        exchange_name TEXT NOT NULL,
        label TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'paper',
        status TEXT NOT NULL DEFAULT 'planned',
        settings_json TEXT NOT NULL DEFAULT '{}',
        secret_storage_note TEXT NOT NULL DEFAULT 'No secrets stored in SQLite.',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        ,FOREIGN KEY(secret_reference_id) REFERENCES local_secret_references(id)
      )
    `);
    db.run('ALTER TABLE exchange_connectors ADD COLUMN secret_reference_id INTEGER', () => {});

    db.run(`
      CREATE TABLE IF NOT EXISTS local_secret_references (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        provider_type TEXT NOT NULL DEFAULT 'macos_keychain',
        reference_name TEXT NOT NULL,
        scope TEXT NOT NULL DEFAULT 'exchange_connector',
        status TEXT NOT NULL DEFAULT 'planned',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS exchange_connector_readiness_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        connector_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        readiness_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(connector_id) REFERENCES exchange_connectors(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS exchange_adapter_contract_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        connector_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        contract_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(connector_id) REFERENCES exchange_connectors(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS market_data_providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        provider_name TEXT NOT NULL,
        label TEXT NOT NULL,
        provider_type TEXT NOT NULL DEFAULT 'local_mock',
        status TEXT NOT NULL DEFAULT 'active',
        settings_json TEXT NOT NULL DEFAULT '{}',
        secret_storage_note TEXT NOT NULL DEFAULT 'No secrets stored in SQLite.',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS market_data_refresh_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        provider_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        market_symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        lookback_candles INTEGER NOT NULL DEFAULT 100,
        backfill_start_at TEXT,
        backfill_end_at TEXT,
        interval_minutes INTEGER NOT NULL DEFAULT 1440,
        status TEXT NOT NULL DEFAULT 'active',
        last_run_at TEXT,
        next_run_at TEXT,
        last_run_id INTEGER,
        last_import_job_id INTEGER,
        last_error TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(provider_id) REFERENCES market_data_providers(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS market_data_refresh_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        schedule_id INTEGER NOT NULL,
        provider_id INTEGER NOT NULL,
        import_job_id INTEGER,
        status TEXT NOT NULL DEFAULT 'running',
        trigger_type TEXT NOT NULL DEFAULT 'manual',
        message TEXT,
        payload_json TEXT NOT NULL DEFAULT '{}',
        started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(schedule_id) REFERENCES market_data_refresh_schedules(id),
        FOREIGN KEY(provider_id) REFERENCES market_data_providers(id),
        FOREIGN KEY(import_job_id) REFERENCES market_data_import_jobs(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS risk_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'paper',
        max_order_value REAL NOT NULL DEFAULT 0,
        max_position_value REAL NOT NULL DEFAULT 0,
        max_daily_loss REAL NOT NULL DEFAULT 0,
        max_open_trades INTEGER NOT NULL DEFAULT 0,
        kill_switch_enabled INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS risk_profile_audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        risk_profile_id INTEGER NOT NULL,
        user_id INTEGER,
        event_type TEXT NOT NULL,
        summary TEXT NOT NULL,
        before_json TEXT,
        after_json TEXT,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(risk_profile_id) REFERENCES risk_profiles(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS bot_automation_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        strategy_id INTEGER NOT NULL,
        paper_session_id INTEGER,
        risk_profile_id INTEGER,
        connector_id INTEGER,
        name TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'paper',
        status TEXT NOT NULL DEFAULT 'draft',
        market_symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        readiness_json TEXT NOT NULL DEFAULT '{}',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(strategy_id) REFERENCES trading_strategies(id),
        FOREIGN KEY(paper_session_id) REFERENCES paper_trading_sessions(id),
        FOREIGN KEY(risk_profile_id) REFERENCES risk_profiles(id),
        FOREIGN KEY(connector_id) REFERENCES exchange_connectors(id)
      )
    `);
    db.run('ALTER TABLE bot_automation_plans ADD COLUMN connector_id INTEGER', () => {});

    db.run(`
      CREATE TABLE IF NOT EXISTS bot_automation_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        strategy_id INTEGER NOT NULL,
        market_data_import_id INTEGER,
        mode TEXT NOT NULL DEFAULT 'paper',
        status TEXT NOT NULL DEFAULT 'completed',
        decision TEXT NOT NULL,
        result_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(plan_id) REFERENCES bot_automation_plans(id),
        FOREIGN KEY(strategy_id) REFERENCES trading_strategies(id),
        FOREIGN KEY(market_data_import_id) REFERENCES market_data_imports(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS bot_live_readiness_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        user_id INTEGER,
        status TEXT NOT NULL,
        readiness_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(plan_id) REFERENCES bot_automation_plans(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS bot_live_enablement_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        user_id INTEGER,
        status TEXT NOT NULL,
        review_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(plan_id) REFERENCES bot_automation_plans(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS owner_acceptance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        status TEXT NOT NULL DEFAULT 'accepted',
        note TEXT NOT NULL DEFAULT '',
        proof_packet_checksum TEXT,
        acceptance_json TEXT NOT NULL DEFAULT '{}',
        local_only INTEGER NOT NULL DEFAULT 1,
        live_execution_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS owner_wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        secret_reference_id INTEGER,
        label TEXT NOT NULL,
        wallet_kind TEXT NOT NULL DEFAULT 'hardware',
        chain_family TEXT NOT NULL DEFAULT 'evm',
        network TEXT NOT NULL DEFAULT 'base',
        public_address TEXT,
        connection_method TEXT NOT NULL DEFAULT 'hardware',
        status TEXT NOT NULL DEFAULT 'onboarding',
        assignment_json TEXT NOT NULL DEFAULT '[]',
        permission_scope_json TEXT NOT NULL DEFAULT '{}',
        notes TEXT,
        local_only INTEGER NOT NULL DEFAULT 1,
        signing_enabled INTEGER NOT NULL DEFAULT 0,
        live_execution_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(secret_reference_id) REFERENCES local_secret_references(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS wallet_permission_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_id INTEGER,
        user_id INTEGER,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        summary TEXT NOT NULL,
        before_json TEXT,
        after_json TEXT,
        evidence_json TEXT NOT NULL DEFAULT '{}',
        local_only INTEGER NOT NULL DEFAULT 1,
        live_execution_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(wallet_id) REFERENCES owner_wallets(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS bot_automation_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        interval_minutes INTEGER NOT NULL DEFAULT 15,
        status TEXT NOT NULL DEFAULT 'paused',
        settings_json TEXT NOT NULL DEFAULT '{}',
        last_run_id INTEGER,
        last_run_at TEXT,
        next_run_at TEXT,
        last_error TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(plan_id) REFERENCES bot_automation_plans(id),
        FOREIGN KEY(last_run_id) REFERENCES bot_automation_runs(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS trade_order_intents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        connector_id INTEGER,
        risk_profile_id INTEGER,
        strategy_id INTEGER,
        paper_session_id INTEGER,
        market_symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        order_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        limit_price REAL,
        status TEXT NOT NULL DEFAULT 'draft',
        reason TEXT,
        payload_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(connector_id) REFERENCES exchange_connectors(id),
        FOREIGN KEY(risk_profile_id) REFERENCES risk_profiles(id),
        FOREIGN KEY(strategy_id) REFERENCES trading_strategies(id),
        FOREIGN KEY(paper_session_id) REFERENCES paper_trading_sessions(id)
      )
    `);
    db.run('ALTER TABLE trade_order_intents ADD COLUMN risk_profile_id INTEGER', () => {});

    db.run(`
      CREATE TABLE IF NOT EXISTS sandbox_order_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        connector_id INTEGER,
        risk_profile_id INTEGER,
        exchange_name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        order_type TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        limit_price REAL,
        notional_usd REAL NOT NULL DEFAULT 0,
        client_order_id TEXT NOT NULL,
        exchange_order_id TEXT,
        status TEXT NOT NULL DEFAULT 'created',
        safety_json TEXT NOT NULL DEFAULT '{}',
        request_json TEXT NOT NULL DEFAULT '{}',
        result_json TEXT NOT NULL DEFAULT '{}',
        live_trading_enabled INTEGER NOT NULL DEFAULT 0,
        wallet_signing_enabled INTEGER NOT NULL DEFAULT 0,
        withdrawals_enabled INTEGER NOT NULL DEFAULT 0,
        production_order_endpoint_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(connector_id) REFERENCES exchange_connectors(id),
        FOREIGN KEY(risk_profile_id) REFERENCES risk_profiles(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS sandbox_order_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sandbox_order_test_id INTEGER,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        summary TEXT NOT NULL,
        payload_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sandbox_order_test_id) REFERENCES sandbox_order_tests(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS live_trading_safety_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        summary TEXT NOT NULL,
        payload_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS tiny_live_order_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        connector_id INTEGER,
        risk_profile_id INTEGER,
        exchange_name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        order_type TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        limit_price REAL,
        notional_usd REAL NOT NULL DEFAULT 0,
        max_test_order_usd REAL NOT NULL DEFAULT 0,
        client_order_id TEXT NOT NULL,
        exchange_order_id TEXT,
        status TEXT NOT NULL DEFAULT 'preview_blocked',
        readiness_json TEXT NOT NULL DEFAULT '{}',
        preview_json TEXT NOT NULL DEFAULT '{}',
        result_json TEXT NOT NULL DEFAULT '{}',
        owner_confirmation_hash TEXT,
        automated_live_trading_enabled INTEGER NOT NULL DEFAULT 0,
        wallet_signing_enabled INTEGER NOT NULL DEFAULT 0,
        withdrawals_enabled INTEGER NOT NULL DEFAULT 0,
        margin_enabled INTEGER NOT NULL DEFAULT 0,
        futures_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(connector_id) REFERENCES exchange_connectors(id),
        FOREIGN KEY(risk_profile_id) REFERENCES risk_profiles(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS tiny_live_order_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tiny_live_order_test_id INTEGER,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        summary TEXT NOT NULL,
        payload_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(tiny_live_order_test_id) REFERENCES tiny_live_order_tests(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS arbitrage_simulation_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        market_symbol TEXT NOT NULL,
        strategy_type TEXT NOT NULL DEFAULT 'arbitrage_route_check',
        status TEXT NOT NULL DEFAULT 'review',
        input_json TEXT NOT NULL DEFAULT '{}',
        result_json TEXT NOT NULL DEFAULT '{}',
        local_only INTEGER NOT NULL DEFAULT 1,
        network_calls_enabled INTEGER NOT NULL DEFAULT 0,
        live_execution_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS rebalance_simulation_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token_ecosystem_project_id INTEGER,
        name TEXT NOT NULL,
        strategy_type TEXT NOT NULL DEFAULT 'top_200_rebalance_batch',
        status TEXT NOT NULL DEFAULT 'review',
        input_json TEXT NOT NULL DEFAULT '{}',
        result_json TEXT NOT NULL DEFAULT '{}',
        local_only INTEGER NOT NULL DEFAULT 1,
        network_calls_enabled INTEGER NOT NULL DEFAULT 0,
        live_execution_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(token_ecosystem_project_id) REFERENCES token_ecosystem_projects(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS solidity_contract_specs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contract_type TEXT NOT NULL,
        network TEXT NOT NULL,
        solidity_version TEXT NOT NULL DEFAULT '0.8.24',
        features TEXT,
        risk_notes TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS token_ecosystem_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        contract_spec_id INTEGER,
        name TEXT NOT NULL,
        target_chain TEXT NOT NULL DEFAULT 'base',
        contract_type TEXT NOT NULL DEFAULT 'erc20',
        feature_selections_json TEXT NOT NULL DEFAULT '[]',
        nft_utility_notes TEXT,
        ecosystem_notes TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        blueprint_json TEXT NOT NULL DEFAULT '{}',
        local_only INTEGER NOT NULL DEFAULT 1,
        external_actions_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(contract_spec_id) REFERENCES solidity_contract_specs(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS social_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        account_label TEXT,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        scheduled_for TEXT,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS market_data_imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT,
        market_symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'manual_csv',
        candle_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'imported',
        quality_score REAL,
        notes TEXT,
        summary_json TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run('ALTER TABLE market_data_imports ADD COLUMN summary_json TEXT', () => {});
    db.run('ALTER TABLE market_data_imports ADD COLUMN label TEXT', () => {});
    db.run('ALTER TABLE market_data_imports ADD COLUMN quality_score REAL', () => {});
    db.run('ALTER TABLE market_data_imports ADD COLUMN notes TEXT', () => {});

    db.run(`
      CREATE TABLE IF NOT EXISTS market_data_import_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        import_id INTEGER,
        label TEXT,
        market_symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'manual_csv_background',
        status TEXT NOT NULL DEFAULT 'queued',
        total_rows INTEGER NOT NULL DEFAULT 0,
        processed_rows INTEGER NOT NULL DEFAULT 0,
        cancel_requested INTEGER NOT NULL DEFAULT 0,
        cancel_requested_at TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        retried_at TEXT,
        quality_score REAL,
        notes TEXT,
        error TEXT,
        summary_json TEXT,
        source_payload TEXT,
        source_file_path TEXT,
        source_file_name TEXT,
        upload_bytes INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(import_id) REFERENCES market_data_imports(id)
      )
    `);
    db.run('ALTER TABLE market_data_import_jobs ADD COLUMN source_file_path TEXT', () => {});
    db.run('ALTER TABLE market_data_import_jobs ADD COLUMN source_file_name TEXT', () => {});
    db.run('ALTER TABLE market_data_import_jobs ADD COLUMN upload_bytes INTEGER NOT NULL DEFAULT 0', () => {});
    db.run('ALTER TABLE market_data_import_jobs ADD COLUMN cancel_requested INTEGER NOT NULL DEFAULT 0', () => {});
    db.run('ALTER TABLE market_data_import_jobs ADD COLUMN cancel_requested_at TEXT', () => {});
    db.run('ALTER TABLE market_data_import_jobs ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0', () => {});
    db.run('ALTER TABLE market_data_import_jobs ADD COLUMN retried_at TEXT', () => {});

    db.run(`
      CREATE TABLE IF NOT EXISTS market_candles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        import_id INTEGER NOT NULL,
        market_symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        open REAL NOT NULL,
        high REAL NOT NULL,
        low REAL NOT NULL,
        close REAL NOT NULL,
        volume REAL NOT NULL,
        FOREIGN KEY(import_id) REFERENCES market_data_imports(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS dev_server_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pid INTEGER NOT NULL,
        port INTEGER NOT NULL,
        command TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'running',
        started_at TEXT NOT NULL,
        heartbeat_at TEXT NOT NULL,
        ended_at TEXT,
        note TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS dev_server_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER,
        level TEXT NOT NULL DEFAULT 'info',
        message TEXT NOT NULL,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(run_id) REFERENCES dev_server_runs(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS company_dns_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        domain TEXT NOT NULL,
        record_type TEXT NOT NULL,
        host TEXT NOT NULL,
        value TEXT NOT NULL,
        purpose TEXT NOT NULL DEFAULT 'other',
        status TEXT NOT NULL DEFAULT 'planned',
        notes TEXT,
        local_only INTEGER NOT NULL DEFAULT 1,
        external_mutation_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS multi_agent_coordination_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        objective TEXT NOT NULL,
        context TEXT,
        status TEXT NOT NULL DEFAULT 'planned',
        execution_mode TEXT NOT NULL DEFAULT 'plan_only',
        provider_mode TEXT NOT NULL DEFAULT 'role_default',
        selected_agents_json TEXT NOT NULL,
        safety_gates_json TEXT NOT NULL,
        summary_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS multi_agent_contributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER NOT NULL,
        agent_id TEXT NOT NULL,
        agent_label TEXT NOT NULL,
        model_role TEXT NOT NULL,
        provider TEXT,
        model TEXT,
        status TEXT NOT NULL DEFAULT 'planned',
        prompt TEXT NOT NULL,
        response TEXT,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        error TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(run_id) REFERENCES multi_agent_coordination_runs(id)
      )
    `);
  });
}

module.exports = {
  initializeDatabase
};
