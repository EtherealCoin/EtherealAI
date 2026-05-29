const LISTING_SOURCES = [
  {
    platform: 'CoinMarketCap',
    title: 'Listings Criteria',
    url: 'https://support.coinmarketcap.com/hc/en-us/articles/360043659351-Listings-Criteria',
    summary: 'Tracked-listing review emphasizes a functional website, block explorer, active public trading with material volume on a tracked exchange, a project representative, credible evidence, truthful submissions, the official online request form, and no spam or bribery.'
  },
  {
    platform: 'CoinMarketCap',
    title: 'How to Add a Coin/Token',
    url: 'https://support.coinmarketcap.com/hc/en-us/articles/360016191971-How-to-Add-a-Coin-Token',
    summary: 'New coin/token requests use the official request form. Evaluation is case-by-case and considers community interest, liquidity, uniqueness, age, development, and organic sustained activity.'
  },
  {
    platform: 'CoinGecko',
    title: 'How to List a New Cryptocurrency',
    url: 'https://support.coingecko.com/hc/en-us/articles/7291312302617-How-to-List-a-New-Cryptocurrency-on-CoinGecko',
    summary: 'CoinGecko token listing requests require an account, request form submission, active or preview selection, complete details, image attachments, and review-speed selection.'
  },
  {
    platform: 'CoinGecko',
    title: 'Methodology',
    url: 'https://www.coingecko.com/en/methodology',
    summary: 'CoinGecko lists criteria such as a working project-owned website, block explorer, at least one active integrated exchange, clear circulating-supply communication, no listing-fee guarantees, and warns that listings are not guaranteed.'
  }
];

const DEFAULT_TOKEN_FEATURE_SELECTIONS = [
  'passive income reward model',
  'NFT utility upgrades for profitability and access tiers',
  'cross-chain bridge and liquidity route plan',
  'top 200 market cap rebalancing bot use case',
  'arbitrage-aware strategy design',
  'CoinMarketCap and CoinGecko listing evidence packet',
  'Discord, Telegram, YouTube, Medium, X launch bundle',
  'website, roadmap, logo, and whitepaper generation'
];

const SUPPORTED_TOKEN_CONTRACT_TYPES = [
  'erc20',
  'bep20',
  'erc721',
  'erc1155',
  'spl-token',
  'token-2022',
  'metaplex-nft',
  'trc20',
  'trc721',
  'move-coin',
  'move-nft',
  'cw20',
  'cw721',
  'native-denom',
  'psp22',
  'psp34',
  'nep141',
  'nep171',
  'cardano-native-asset',
  'algorand-asa',
  'stellar-asset',
  'xrp-issued-currency',
  'hedera-hts',
  'tezos-fa2',
  'flow-ft',
  'ton-jetton',
  'bitcoin-rune',
  'generic'
];

const SOCIAL_CHANNELS = [
  {
    id: 'x',
    label: 'X',
    purpose: 'Short announcements, progress updates, launch threads, governance summaries, and partner notices.',
    contentTypes: ['launch thread', 'daily progress note', 'community poll', 'release recap'],
    automationBoundary: 'draft_only_no_external_posting'
  },
  {
    id: 'discord',
    label: 'Discord',
    purpose: 'Community rooms, support channels, holder verification concepts, DAO coordination, and event rooms.',
    contentTypes: ['server structure', 'role map', 'announcement draft', 'moderation policy'],
    automationBoundary: 'room_blueprint_only_no_external_creation'
  },
  {
    id: 'telegram',
    label: 'Telegram',
    purpose: 'Fast community updates, support triage, launch coordination, and bot-command drafts.',
    contentTypes: ['group rules', 'admin checklist', 'announcement draft', 'FAQ response'],
    automationBoundary: 'room_blueprint_only_no_external_creation'
  },
  {
    id: 'youtube',
    label: 'YouTube',
    purpose: 'Use-case demos, founder updates, token education, roadmap videos, and long-form proof of progress.',
    contentTypes: ['video outline', 'script', 'thumbnail prompt', 'description draft'],
    automationBoundary: 'draft_only_no_external_upload'
  },
  {
    id: 'medium',
    label: 'Medium',
    purpose: 'Progress articles, technical explainers, token utility updates, roadmap updates, and use-case essays.',
    contentTypes: ['progress article', 'whitepaper summary', 'use-case essay', 'release note'],
    automationBoundary: 'draft_only_no_external_posting'
  },
  {
    id: 'reddit',
    label: 'Reddit',
    purpose: 'Long-form community discussion drafts, AMAs, and educational posts where subreddit rules allow.',
    contentTypes: ['AMA prompt', 'discussion post', 'transparent project update'],
    automationBoundary: 'draft_only_no_external_posting'
  },
  {
    id: 'farcaster',
    label: 'Farcaster',
    purpose: 'Crypto-native distribution, builder updates, ecosystem clips, and governance summaries.',
    contentTypes: ['cast draft', 'thread outline', 'channel plan'],
    automationBoundary: 'draft_only_no_external_posting'
  },
  {
    id: 'docs',
    label: 'Docs Portal',
    purpose: 'Canonical technical docs, token mechanics, NFT utility, node economics, and integration references.',
    contentTypes: ['docs outline', 'integration guide', 'tokenomics page', 'FAQ'],
    automationBoundary: 'local_content_only'
  }
];

const CHAIN_CATALOG = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    family: 'evm',
    gasProfile: 'high',
    launchFit: 'credibility_first',
    fit: 'Highest credibility and composability, higher fees, strong listing/explorer support.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155', 'ERC4626'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Use bridges and canonical wrapped assets only after independent risk review.'
  },
  {
    id: 'base',
    name: 'Base',
    family: 'evm-l2',
    gasProfile: 'low',
    launchFit: 'recommended_low_fee_evm',
    fit: 'Consumer-friendly EVM L2 with low fees and strong app distribution.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Good for launch/community apps; bridge assumptions must be documented.'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    family: 'evm-l2',
    gasProfile: 'low',
    launchFit: 'recommended_defi_evm',
    fit: 'DeFi-heavy EVM L2 with deep DEX integrations.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Strong candidate for DEX/arbitrage research and liquidity routing.'
  },
  {
    id: 'optimism',
    name: 'Optimism',
    family: 'evm-l2',
    gasProfile: 'low',
    launchFit: 'recommended_low_fee_evm',
    fit: 'EVM L2 with Superchain ecosystem opportunities.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Useful for ecosystem-aligned token experiments and lower-cost execution.'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    family: 'evm-sidechain-l2',
    chainId: 137,
    nativeAsset: 'POL',
    gasProfile: 'low',
    launchFit: 'recommended_low_fee_evm',
    fit: 'Low fees, broad wallet support, and many retail/community token projects.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    explorers: [{ label: 'PolygonScan', url: 'https://polygonscan.com' }],
    walletSupport: ['MetaMask', 'Rabby', 'WalletConnect-compatible wallets', 'hardware wallet via owner connector'],
    rpcProfile: 'owner-managed selected-chain RPC/provider reference only; EtherealAI stores no RPC secrets in token projects',
    dexRouteFocus: ['QuickSwap', 'Uniswap on Polygon', 'Sushi-compatible Polygon routes', 'aggregator quote adapters after owner approval'],
    listingEvidenceFocus: ['verified Polygon contract', 'PolygonScan token page', 'official website', 'DEX pair URLs', 'liquidity/lock evidence', 'clear circulating supply docs'],
    crossChainNotes: 'Good for NFT-heavy experiments, low-cost community utilities, top-200 rebalance research, and Polygon-specific listing evidence when Polygon is selected.'
  },
  {
    id: 'bnb-chain',
    name: 'BNB Chain',
    family: 'evm',
    gasProfile: 'low',
    launchFit: 'recommended_retail_evm',
    fit: 'Retail-token ecosystem with broad DEX access and lower fees.',
    tokenStandards: ['BEP20', 'BEP721', 'BEP1155'],
    tooling: ['Solidity', 'OpenZeppelin-compatible contracts', 'Hardhat', 'Foundry'],
    crossChainNotes: 'High retail reach; requires strict scam-resistance and listing-quality evidence.'
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    family: 'evm-subnet',
    gasProfile: 'low',
    launchFit: 'recommended_low_fee_evm_or_subnet',
    fit: 'EVM chain plus custom subnet/app-chain pathway.',
    tokenStandards: ['ERC20', 'ERC721', 'Subnet validator models'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry', 'Subnet tooling'],
    crossChainNotes: 'Useful when the project may eventually need its own app-chain economics.'
  },
  {
    id: 'solana',
    name: 'Solana',
    family: 'solana',
    gasProfile: 'very_low',
    launchFit: 'recommended_non_evm_high_throughput',
    fit: 'Fast consumer apps, NFTs, DePIN, and high-throughput token activity.',
    tokenStandards: ['SPL Token', 'Token-2022', 'Metaplex NFT'],
    tooling: ['SPL Token CLI', '@solana/spl-token', 'Anchor', 'Metaplex'],
    crossChainNotes: 'Non-EVM path; needs separate program/tooling workflow.'
  },
  {
    id: 'fantom-sonic',
    name: 'Fantom / Sonic',
    family: 'evm',
    gasProfile: 'low',
    launchFit: 'low_fee_evm_candidate',
    fit: 'Low-fee EVM-compatible ecosystem for experimental token and DeFi apps.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Treat liquidity depth and bridge assumptions as project-specific research.'
  },
  {
    id: 'tron',
    name: 'TRON',
    family: 'tron',
    gasProfile: 'low',
    launchFit: 'retail_stablecoin_ecosystem_candidate',
    fit: 'Retail/stablecoin-heavy network with Solidity-style TRC standards and different tooling assumptions.',
    tokenStandards: ['TRC20', 'TRC721'],
    tooling: ['Solidity-style contracts', 'TronBox', 'TronWeb'],
    crossChainNotes: 'Requires separate wallet/RPC/explorer and ecosystem risk review.'
  },
  {
    id: 'sui',
    name: 'Sui',
    family: 'move',
    gasProfile: 'low',
    launchFit: 'move_ecosystem_candidate',
    fit: 'Move-based chain for object-centric assets, games, consumer apps, and high-throughput token utilities.',
    tokenStandards: ['Move Coin', 'Objects / NFTs'],
    tooling: ['Move', 'Sui CLI', 'Sui TypeScript SDK'],
    crossChainNotes: 'Non-EVM path; token logic and wallet integration differ from Solidity.'
  },
  {
    id: 'aptos',
    name: 'Aptos',
    family: 'move',
    gasProfile: 'low',
    launchFit: 'move_ecosystem_candidate',
    fit: 'Move-based chain for resource-oriented tokens, consumer apps, and high-throughput experiments.',
    tokenStandards: ['Move Coin', 'Aptos Digital Assets'],
    tooling: ['Move', 'Aptos CLI', 'Aptos TypeScript SDK'],
    crossChainNotes: 'Non-EVM path; needs separate Move package design and explorer/listing evidence.'
  },
  {
    id: 'cosmos',
    name: 'Cosmos SDK / IBC',
    family: 'cosmos',
    gasProfile: 'chain_specific',
    launchFit: 'custom_app_chain_candidate',
    fit: 'Custom app-chain, validator economics, IBC interoperability, and sovereign-chain design.',
    tokenStandards: ['native denom', 'CosmWasm token contracts', 'IBC assets'],
    tooling: ['Cosmos SDK', 'Ignite CLI', 'CosmWasm', 'wasmd'],
    crossChainNotes: 'Best for serious custom chain/node economics after token-market fit exists.'
  },
  {
    id: 'polkadot',
    name: 'Polkadot / Substrate',
    family: 'substrate',
    gasProfile: 'chain_specific',
    launchFit: 'custom_runtime_candidate',
    fit: 'Custom chain runtimes, parachain/app-chain designs, and governance-heavy ecosystems.',
    tokenStandards: ['native assets', 'pallet-assets', 'PSP standards'],
    tooling: ['Substrate', 'pallet-assets', 'ink!'],
    crossChainNotes: 'Powerful but more complex; best after architecture is locked.'
  },
  {
    id: 'near',
    name: 'NEAR',
    family: 'near',
    gasProfile: 'low',
    launchFit: 'non_evm_consumer_candidate',
    fit: 'Consumer apps, account abstraction, and JS-friendly smart-contract paths.',
    tokenStandards: ['NEP-141', 'NEP-171'],
    tooling: ['near-sdk-rs', 'near-cli', 'NEAR JavaScript SDK'],
    crossChainNotes: 'Useful for app-first ecosystems with non-EVM UX requirements.'
  },
  {
    id: 'cardano',
    name: 'Cardano',
    family: 'cardano',
    gasProfile: 'low',
    launchFit: 'native_asset_research_candidate',
    fit: 'Native assets, eUTXO accounting, long-horizon research communities, and Plutus/Aiken smart-contract paths.',
    tokenStandards: ['Native Asset', 'CIP-68 NFT', 'Plutus token policy'],
    tooling: ['cardano-cli', 'Aiken', 'Plutus', 'Lucid'],
    crossChainNotes: 'Non-EVM/eUTXO path; token policy, wallet UX, and DEX liquidity assumptions differ materially.'
  },
  {
    id: 'algorand',
    name: 'Algorand',
    family: 'algorand',
    gasProfile: 'very_low',
    launchFit: 'low_fee_native_asset_candidate',
    fit: 'Low-fee native assets, fast settlement, and Python/TEAL-oriented app logic.',
    tokenStandards: ['Algorand Standard Asset', 'ARC standards'],
    tooling: ['AlgoKit', 'Algorand Python', 'PyTeal', 'algod'],
    crossChainNotes: 'ASA creation is not Solidity; indexer, wallet, and liquidity integrations are chain-specific.'
  },
  {
    id: 'stellar',
    name: 'Stellar',
    family: 'stellar',
    gasProfile: 'very_low',
    launchFit: 'payments_asset_candidate',
    fit: 'Issued assets, payments, anchors, and Soroban smart-contract extensions.',
    tokenStandards: ['Stellar issued asset', 'Soroban token contract'],
    tooling: ['Stellar CLI', 'Soroban SDK', 'Horizon'],
    crossChainNotes: 'Best for payment-style assets; trustline/anchor assumptions must be documented.'
  },
  {
    id: 'xrp-ledger',
    name: 'XRP Ledger',
    family: 'xrp',
    gasProfile: 'very_low',
    launchFit: 'issued_currency_candidate',
    fit: 'Issued currencies, payment rails, AMM research, and XLS NFT paths.',
    tokenStandards: ['Issued Currency', 'XLS-20 NFT'],
    tooling: ['xrpl.js', 'XRPL CLI/tools', 'rippled testnet'],
    crossChainNotes: 'Issuer/trustline model differs from contract-token systems.'
  },
  {
    id: 'hedera',
    name: 'Hedera',
    family: 'hedera',
    gasProfile: 'low',
    launchFit: 'enterprise_token_service_candidate',
    fit: 'Native Token Service assets, predictable fees, and enterprise-style integrations.',
    tokenStandards: ['Hedera Token Service fungible token', 'HTS NFT'],
    tooling: ['Hedera SDK', 'HashScan', 'Smart Contract Service'],
    crossChainNotes: 'HTS token creation is service/API driven; keys, roles, and compliance flags require careful review.'
  },
  {
    id: 'tezos',
    name: 'Tezos',
    family: 'tezos',
    gasProfile: 'low',
    launchFit: 'formal_contract_candidate',
    fit: 'FA token standards, art/NFT ecosystem history, and Michelson/LIGO/SmartPy workflows.',
    tokenStandards: ['FA1.2', 'FA2'],
    tooling: ['LIGO', 'SmartPy', 'Octez', 'Taquito'],
    crossChainNotes: 'Non-EVM path; contract language, wallet, and marketplace assumptions are separate.'
  },
  {
    id: 'flow',
    name: 'Flow',
    family: 'flow',
    gasProfile: 'low',
    launchFit: 'consumer_nft_candidate',
    fit: 'Consumer NFT/app ecosystems with Cadence resource-oriented smart contracts.',
    tokenStandards: ['Flow FungibleToken', 'Flow NonFungibleToken'],
    tooling: ['Cadence', 'Flow CLI', 'Flow JS SDK'],
    crossChainNotes: 'Resource model is distinct; good for consumer collectibles and app-native utility.'
  },
  {
    id: 'ton',
    name: 'TON',
    family: 'ton',
    gasProfile: 'low',
    launchFit: 'messaging_ecosystem_candidate',
    fit: 'Telegram-adjacent distribution, Jettons, NFTs, and high-throughput app experiments.',
    tokenStandards: ['Jetton', 'TON NFT'],
    tooling: ['FunC', 'Tact', 'TON SDK', 'Blueprint'],
    crossChainNotes: 'Requires TON-specific wallet, explorer, message, and contract assumptions.'
  },
  {
    id: 'cronos',
    name: 'Cronos',
    family: 'evm',
    gasProfile: 'low',
    launchFit: 'retail_evm_candidate',
    fit: 'EVM-compatible retail/DeFi ecosystem with lower fees than Ethereum.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Treat liquidity depth and CEX/DEX route support as project-specific research.'
  },
  {
    id: 'gnosis',
    name: 'Gnosis Chain',
    family: 'evm',
    gasProfile: 'low',
    launchFit: 'dao_evm_candidate',
    fit: 'Low-fee EVM ecosystem with DAO and payments history.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Useful for governance/DAO-heavy designs and low-fee experimentation.'
  },
  {
    id: 'celo',
    name: 'Celo',
    family: 'evm',
    gasProfile: 'low',
    launchFit: 'mobile_payments_evm_candidate',
    fit: 'Mobile-first EVM-compatible ecosystem and real-world payment experiments.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Good for payment/use-case tokens where mobile UX matters.'
  },
  {
    id: 'linea',
    name: 'Linea',
    family: 'evm-l2',
    gasProfile: 'low',
    launchFit: 'zk_evm_candidate',
    fit: 'zkEVM L2 with Ethereum-aligned tooling and lower fees.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Bridge and finality assumptions must be documented for route logic.'
  },
  {
    id: 'scroll',
    name: 'Scroll',
    family: 'evm-l2',
    gasProfile: 'low',
    launchFit: 'zk_evm_candidate',
    fit: 'zkEVM L2 with familiar Solidity tooling.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Bridge timing, liquidity depth, and explorer support should be researched per launch.'
  },
  {
    id: 'zksync-era',
    name: 'zkSync Era',
    family: 'evm-l2',
    gasProfile: 'low',
    launchFit: 'zk_evm_candidate',
    fit: 'ZK rollup ecosystem with Solidity-like workflows and chain-specific compiler/deployment details.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry', 'zkSync tooling'],
    crossChainNotes: 'Use chain-specific compile/deploy config rather than assuming normal Hardhat broadcast.'
  },
  {
    id: 'mantle',
    name: 'Mantle',
    family: 'evm-l2',
    gasProfile: 'low',
    launchFit: 'modular_evm_candidate',
    fit: 'EVM L2 ecosystem with modular-chain positioning.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Assess DEX liquidity, bridge route costs, and listing support before launch.'
  },
  {
    id: 'blast',
    name: 'Blast',
    family: 'evm-l2',
    gasProfile: 'low',
    launchFit: 'defi_evm_candidate',
    fit: 'EVM L2 with DeFi-native incentives and DEX activity.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Incentive and yield assumptions need separate disclosure and risk review.'
  },
  {
    id: 'opbnb',
    name: 'opBNB',
    family: 'evm-l2',
    gasProfile: 'very_low',
    launchFit: 'retail_low_fee_evm_candidate',
    fit: 'BNB ecosystem L2 for low-fee retail/community token experiments.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Useful for low-cost testing but liquidity/listing support must be confirmed.'
  },
  {
    id: 'sei',
    name: 'Sei',
    family: 'evm-cosmos',
    gasProfile: 'low',
    launchFit: 'trading_ecosystem_candidate',
    fit: 'Trading-oriented ecosystem with EVM/Cosmos-adjacent routes depending on deployment lane.',
    tokenStandards: ['ERC20 where EVM lane applies', 'Cosmos/native assets where applicable'],
    tooling: ['Solidity/EVM tooling', 'Cosmos tooling', 'chain-specific SDKs'],
    crossChainNotes: 'Select EVM or native lane explicitly before scaffold generation.'
  },
  {
    id: 'injective',
    name: 'Injective',
    family: 'cosmos',
    gasProfile: 'low',
    launchFit: 'defi_trading_chain_candidate',
    fit: 'Cosmos-based DeFi/trading ecosystem with exchange-oriented infrastructure.',
    tokenStandards: ['native denom', 'CosmWasm/CW20 where supported'],
    tooling: ['Cosmos tooling', 'CosmWasm', 'Injective SDKs'],
    crossChainNotes: 'Strong candidate for trading workflows; requires chain-specific market and bridge research.'
  },
  {
    id: 'osmosis',
    name: 'Osmosis',
    family: 'cosmos',
    gasProfile: 'low',
    launchFit: 'dex_liquidity_research_candidate',
    fit: 'Cosmos DEX ecosystem for liquidity, IBC assets, and cross-chain market research.',
    tokenStandards: ['native denom', 'IBC asset', 'CosmWasm where supported'],
    tooling: ['Cosmos tooling', 'IBC tooling', 'Osmosis SDKs'],
    crossChainNotes: 'Useful for IBC liquidity routing and DEX research.'
  },
  {
    id: 'berachain',
    name: 'Berachain',
    family: 'evm',
    gasProfile: 'chain_specific',
    launchFit: 'emerging_evm_candidate',
    fit: 'EVM-compatible emerging DeFi ecosystem; treat as research-first until launch details are stable.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Emerging-chain assumptions require current docs, liquidity, and explorer review before implementation.'
  },
  {
    id: 'monad',
    name: 'Monad',
    family: 'evm',
    gasProfile: 'chain_specific',
    launchFit: 'emerging_high_throughput_evm_candidate',
    fit: 'High-throughput EVM-compatible ecosystem candidate.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Emerging-chain assumptions require current docs, testnet/mainnet status, liquidity, and explorer review.'
  },
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    family: 'hyperliquid',
    gasProfile: 'chain_specific',
    launchFit: 'trading_native_candidate',
    fit: 'Trading-native ecosystem candidate where token/listing mechanics are chain-specific.',
    tokenStandards: ['chain-specific spot asset / HIP standards'],
    tooling: ['Hyperliquid APIs', 'chain-specific docs'],
    crossChainNotes: 'Treat as a special trading/listing lane, not a generic ERC20 deployment.'
  },
  {
    id: 'kaspa',
    name: 'Kaspa',
    family: 'utxo',
    gasProfile: 'chain_specific',
    launchFit: 'utxo_research_candidate',
    fit: 'High-throughput UTXO-style ecosystem where token support is standards/tooling specific.',
    tokenStandards: ['chain-specific token standard'],
    tooling: ['official node/tools', 'ecosystem SDKs'],
    crossChainNotes: 'Research-first; do not assume account-model smart contract behavior.'
  },
  {
    id: 'bitcoin-l2',
    name: 'Bitcoin L2 / Ordinals Adjacent',
    family: 'bitcoin-l2',
    gasProfile: 'chain_specific',
    launchFit: 'bitcoin_aligned_candidate',
    fit: 'Bitcoin-aligned branding, collectibles, and emerging L2 utility.',
    tokenStandards: ['chain-specific'],
    tooling: ['chain-specific SDKs', 'Ordinals/inscription tooling where relevant'],
    crossChainNotes: 'Treat as a separate research lane because standards and liquidity differ widely.'
  },
  {
    id: 'custom-chain',
    name: 'Custom / Any Other Blockchain',
    family: 'custom',
    gasProfile: 'unknown',
    launchFit: 'research_first',
    fit: 'Catch-all lane for any chain not yet modeled. EtherealAI should gather standards, explorer, wallet, RPC, deployment, and listing requirements before implementation.',
    tokenStandards: ['chain-specific fungible token', 'chain-specific NFT', 'native asset'],
    tooling: ['chain SDK', 'chain CLI', 'official docs', 'local testnet/sandbox first'],
    crossChainNotes: 'Do not assume EVM/Solana behavior. Build a chain adapter spec and local-only scaffold before any live action.'
  }
];

const LOW_FEE_LAUNCH_CHAIN_IDS = [
  'base',
  'polygon',
  'bnb-chain',
  'avalanche',
  'arbitrum',
  'optimism',
  'solana',
  'fantom-sonic',
  'sui',
  'aptos',
  'near',
  'algorand',
  'stellar',
  'hedera',
  'celo',
  'linea',
  'scroll',
  'zksync-era',
  'mantle',
  'opbnb',
  'sei',
  'injective',
  'osmosis'
];

const WHITEPAPER_TEMPLATES = [
  {
    id: 'utility-token',
    label: 'Utility Token Whitepaper',
    sections: ['Abstract', 'Problem', 'Use Case', 'Token Utility', 'Tokenomics', 'NFT Utility', 'Roadmap', 'Security', 'Listings Readiness', 'Disclaimers']
  },
  {
    id: 'ecosystem-token',
    label: 'Ecosystem Token Whitepaper',
    sections: ['Vision', 'Ecosystem Map', 'Token Roles', 'NFT Modules', 'Treasury Mechanics', 'Partner Integrations', 'Governance', 'Roadmap', 'Risk Controls']
  },
  {
    id: 'chain-or-node',
    label: 'Chain / Node Economics Whitepaper',
    sections: ['Network Thesis', 'Consensus / Node Model', 'Validator Economics', 'Token Flow', 'Incentive Design', 'Security Assumptions', 'Launch Phases', 'Operations']
  }
];

const WEBSITE_TEMPLATES = [
  {
    id: 'token-launch',
    label: 'Token Launch Website',
    sections: ['Hero', 'Use Case', 'Token Mechanics', 'NFT Utility', 'Roadmap', 'Whitepaper', 'Community', 'Risk Disclosures']
  },
  {
    id: 'ecosystem-hub',
    label: 'Ecosystem Hub',
    sections: ['Ecosystem Map', 'Products', 'Token/NFT Interactions', 'Dapp Modules', 'Developer Docs', 'Governance', 'Community Updates']
  },
  {
    id: 'node-profitability',
    label: 'Node / Chain Research Website',
    sections: ['Node Thesis', 'Supported Chains', 'Reward Model', 'Hardware/Cloud Requirements', 'Risk Matrix', 'Operator Roadmap']
  }
];

function getFeatureText(spec = {}) {
  return [spec.features, spec.risk_notes]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
}

function detectFeatureFlags(spec = {}) {
  const text = getFeatureText(spec);

  return {
    passiveIncome: /(passive|yield|income|revenue|profit|dividend|reflection|staking|rebase)/i.test(text),
    nftUtility: /(nft|erc721|erc1155|collectible|membership|upgrade)/i.test(text) || spec.contract_type === 'erc721',
    crossChain: /(cross.?chain|bridge|omnichain|multi.?chain|arbitrage|dex|cex|exchange)/i.test(text),
    governance: /(dao|governance|vote|proposal|delegate)/i.test(text),
    nodeEconomics: /(node|validator|staking node|masternode|delegat)/i.test(text),
    websiteNeeded: /(website|dapp|landing|whitepaper|roadmap|docs)/i.test(text),
    tokenomicsHeavy: /(tax|fee|burn|vesting|liquidity|treasury|supply|emission|airdrop)/i.test(text)
  };
}

function normalizeChainId(value = '') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');
  const aliases = new Map([
    ['binance', 'bnb-chain'],
    ['binance-smart-chain', 'bnb-chain'],
    ['bsc', 'bnb-chain'],
    ['bnb', 'bnb-chain'],
    ['avax', 'avalanche'],
    ['avalanche-c-chain', 'avalanche'],
    ['matic', 'polygon'],
    ['polygon-pos', 'polygon'],
    ['polygon-mainnet', 'polygon'],
    ['polygon-network', 'polygon'],
    ['eth', 'ethereum'],
    ['sol', 'solana'],
    ['fantom', 'fantom-sonic'],
    ['sonic', 'fantom-sonic'],
    ['ada', 'cardano'],
    ['algo', 'algorand'],
    ['xlm', 'stellar'],
    ['stellar-network', 'stellar'],
    ['xrp', 'xrp-ledger'],
    ['xrpl', 'xrp-ledger'],
    ['hbar', 'hedera'],
    ['flow-blockchain', 'flow'],
    ['the-open-network', 'ton'],
    ['toncoin', 'ton'],
    ['zk-sync', 'zksync-era'],
    ['zksync', 'zksync-era'],
    ['zk-sync-era', 'zksync-era'],
    ['hyperliquid-l1', 'hyperliquid'],
    ['bitcoin', 'bitcoin-l2'],
    ['runes', 'bitcoin-l2'],
    ['brc20', 'bitcoin-l2'],
    ['brc-20', 'bitcoin-l2'],
    ['custom', 'custom-chain'],
    ['any', 'custom-chain'],
    ['other', 'custom-chain'],
    ['local', 'custom-chain'],
    ['local-hardhat', 'custom-chain']
  ]);

  return aliases.get(normalized) || normalized || 'custom-chain';
}

function getChainOption(value = '') {
  const chainId = normalizeChainId(value);
  return CHAIN_CATALOG.find(chain => chain.id === chainId)
    || CHAIN_CATALOG.find(chain => chain.name.toLowerCase() === String(value || '').trim().toLowerCase())
    || {
      ...CHAIN_CATALOG.find(chain => chain.id === 'custom-chain'),
      id: chainId,
      name: String(value || '').trim() || 'Custom / Any Other Blockchain'
    };
}

function getRecommendedLowFeeChains() {
  return LOW_FEE_LAUNCH_CHAIN_IDS
    .map(chainId => CHAIN_CATALOG.find(chain => chain.id === chainId))
    .filter(Boolean);
}

function getTokenStandardPlan(spec = {}, chain = getChainOption(spec.network)) {
  const type = String(spec.contract_type || 'erc20').toLowerCase();
  const isNft = [
    'erc721',
    'erc1155',
    'metaplex-nft',
    'trc721',
    'move-nft',
    'cw721',
    'psp34',
    'nep171',
    'tezos-fa2'
  ].includes(type) || /nft|721|1155|fa2|psp34|nep171/i.test(type);

  if (chain.family.startsWith('evm')) {
    return {
      implementationLane: 'evm_solidity',
      primaryStandard: isNft ? 'ERC721/ERC1155' : chain.id === 'bnb-chain' || type === 'bep20' ? 'BEP20-compatible ERC20' : 'ERC20',
      starterScaffold: 'Solidity + OpenZeppelin + Hardhat local workspace',
      notes: 'Base, Polygon, BNB Chain, Avalanche, Arbitrum, Optimism, and most EVM chains can share the same Solidity contract with chain-specific deployment config added later.'
    };
  }

  if (chain.family === 'solana') {
    return {
      implementationLane: 'solana_spl',
      primaryStandard: type === 'token-2022' ? 'Token-2022' : isNft ? 'Metaplex NFT / compressed NFT plan' : 'SPL Token',
      starterScaffold: 'Solana local-validator + SPL Token CLI or TypeScript @solana/spl-token scaffold',
      notes: 'Solana is not Solidity/EVM. Token creation should be generated as an SPL/Token-2022 mint workflow with local validator tests before any devnet/mainnet action.'
    };
  }

  if (chain.family === 'cosmos') {
    return {
      implementationLane: 'cosmos_or_cosmwasm',
      primaryStandard: isNft ? 'CW721 or native module NFT' : 'native denom or CW20',
      starterScaffold: 'CosmWasm contract or Cosmos SDK app-chain module plan',
      notes: 'Cosmos token creation depends on whether this is a smart contract token, native denom, or custom app-chain.'
    };
  }

  if (chain.family === 'substrate') {
    return {
      implementationLane: 'substrate_or_ink',
      primaryStandard: isNft ? 'PSP34 / pallet-nfts' : 'PSP22 / pallet-assets',
      starterScaffold: 'Substrate pallet-assets or ink! contract plan',
      notes: 'Substrate token creation is runtime/pallet driven and needs a chain-specific local node plan.'
    };
  }

  if (chain.family === 'near') {
    return {
      implementationLane: 'near_contract',
      primaryStandard: isNft ? 'NEP-171' : 'NEP-141',
      starterScaffold: 'NEAR SDK local sandbox contract plan',
      notes: 'NEAR uses its own account model and standards, so wallet/dapp assumptions differ from EVM.'
    };
  }

  if (chain.family === 'cardano') {
    return {
      implementationLane: 'cardano_native_asset',
      primaryStandard: isNft ? 'Cardano native asset / CIP NFT policy' : 'Cardano Native Asset',
      starterScaffold: 'cardano-cli/Aiken policy script plan with local/testnet-only checklist',
      notes: 'Cardano token creation uses eUTXO token policies and native assets rather than Solidity contracts.'
    };
  }

  if (chain.family === 'algorand') {
    return {
      implementationLane: 'algorand_asa',
      primaryStandard: isNft ? 'Algorand ASA NFT / ARC asset' : 'Algorand Standard Asset',
      starterScaffold: 'AlgoKit localnet ASA creation plan',
      notes: 'Algorand token creation is ASA configuration plus optional smart-contract controls, not Solidity deployment.'
    };
  }

  if (chain.family === 'stellar') {
    return {
      implementationLane: 'stellar_issued_asset',
      primaryStandard: isNft ? 'Soroban NFT-style contract plan' : 'Stellar issued asset',
      starterScaffold: 'Stellar testnet issuer/distributor/trustline plan',
      notes: 'Stellar assets use issuer/distributor accounts and trustlines; Soroban is a separate smart-contract lane.'
    };
  }

  if (chain.family === 'xrp') {
    return {
      implementationLane: 'xrp_issued_currency',
      primaryStandard: isNft ? 'XLS-20 NFT' : 'XRPL Issued Currency',
      starterScaffold: 'XRPL testnet issuer/trustline/AMM research plan',
      notes: 'XRPL assets use issuer and trustline mechanics rather than EVM contracts.'
    };
  }

  if (chain.family === 'hedera') {
    return {
      implementationLane: 'hedera_token_service',
      primaryStandard: isNft ? 'HTS NFT' : 'HTS fungible token',
      starterScaffold: 'Hedera local/testnet Token Service plan with key-role matrix',
      notes: 'Hedera Token Service uses token create/update role keys; key governance must be reviewed before any live action.'
    };
  }

  if (chain.family === 'tezos') {
    return {
      implementationLane: 'tezos_fa_contract',
      primaryStandard: isNft ? 'FA2' : 'FA1.2 / FA2',
      starterScaffold: 'LIGO/SmartPy/Octez local contract plan',
      notes: 'Tezos token logic uses FA standards and Michelson-oriented tooling, not Solidity.'
    };
  }

  if (chain.family === 'flow') {
    return {
      implementationLane: 'flow_cadence',
      primaryStandard: isNft ? 'Flow NonFungibleToken' : 'Flow FungibleToken',
      starterScaffold: 'Cadence local emulator token contract plan',
      notes: 'Flow uses Cadence resource-oriented contracts and account capabilities.'
    };
  }

  if (chain.family === 'ton') {
    return {
      implementationLane: 'ton_jetton',
      primaryStandard: isNft ? 'TON NFT' : 'TON Jetton',
      starterScaffold: 'Tact/FunC local blueprint plan',
      notes: 'TON token creation uses Jetton/NFT contracts and message-based contract interactions.'
    };
  }

  if (chain.family === 'move') {
    return {
      implementationLane: 'move_package',
      primaryStandard: isNft ? 'Move object/digital asset NFT' : 'Move coin/resource token',
      starterScaffold: 'Move package plan with local/testnet-only publishing later',
      notes: 'Sui and Aptos require Move package design rather than Solidity contracts.'
    };
  }

  if (chain.family === 'tron') {
    return {
      implementationLane: 'tron_solidity',
      primaryStandard: type === 'trc721' || isNft ? 'TRC721' : 'TRC20',
      starterScaffold: 'TRON Solidity-style contract and TronWeb/TronBox local plan',
      notes: 'TRON is Solidity-like but has different tooling, wallet, resource, and explorer assumptions.'
    };
  }

  if (chain.family === 'bitcoin-l2' || chain.family === 'utxo') {
    return {
      implementationLane: 'bitcoin_or_utxo_token_research',
      primaryStandard: isNft ? 'Ordinal/inscription or L2-specific NFT' : 'Rune/BRC-20/L2-specific fungible asset',
      starterScaffold: 'research-first token standard and local indexer/testnet plan',
      notes: 'Bitcoin/UTXO-style token paths are standard/indexer specific and must not be treated as account-model smart contracts.'
    };
  }

  if (chain.family === 'hyperliquid') {
    return {
      implementationLane: 'hyperliquid_asset_research',
      primaryStandard: 'chain-specific spot asset/listing standard',
      starterScaffold: 'Hyperliquid asset/listing research and API-safe local plan',
      notes: 'Hyperliquid is trading-native; token mechanics depend on current chain/listing rules and should be researched before implementation.'
    };
  }

  return {
    implementationLane: 'custom_chain_research',
    primaryStandard: isNft ? 'chain-specific NFT standard' : 'chain-specific fungible token standard',
    starterScaffold: 'research-first chain adapter and local sandbox scaffold',
    notes: 'Unknown/custom chains need standards, local testnet, explorer, wallet, RPC, and listing evidence mapped before token implementation.'
  };
}

function buildMultiChainTokenBuildPlan(spec = {}) {
  const selectedChain = getChainOption(spec.network);
  const standardPlan = getTokenStandardPlan(spec, selectedChain);
  const recommendedLowFeeChains = getRecommendedLowFeeChains();

  return {
    status: 'local_planning_only',
    selectedChain,
    standardPlan,
    lowFeePreference: selectedChain.id === 'ethereum'
      ? 'Ethereum is available, but lower-fee launch candidates are recommended for most owner-token experiments.'
      : 'Selected chain is compatible with the lower-fee preference or requires chain-specific research.',
    recommendedLowFeeChains: recommendedLowFeeChains.map(chain => ({
      id: chain.id,
      name: chain.name,
      family: chain.family,
      gasProfile: chain.gasProfile,
      tokenStandards: chain.tokenStandards
    })),
    requiredBeforeLiveDeployment: [
      'chain-specific local/testnet scaffold',
      'contract/program unit tests',
      'static analysis or framework-native checks',
      'admin-role and upgradeability review',
      'block explorer verification plan',
      'tokenomics and supply documentation',
      'manual owner deployment approval in a future live phase'
    ],
    blockedActions: [
      'no wallet/private-key collection',
      'no RPC signing',
      'no mainnet/devnet/testnet broadcast from this MVP',
      'no liquidity creation',
      'no exchange/listing submission'
    ]
  };
}

function buildPolygonOperatingProfile(spec = {}) {
  const selectedChain = getChainOption(spec.network);
  const polygon = getChainOption('polygon');
  const isPrimaryChain = selectedChain.id === 'polygon';

  return {
    status: isPrimaryChain ? 'primary_polygon_ready' : 'available_polygon_lane',
    isPrimaryChain,
    chain: {
      id: polygon.id,
      name: polygon.name,
      family: polygon.family,
      chainId: polygon.chainId,
      nativeAsset: polygon.nativeAsset,
      gasProfile: polygon.gasProfile,
      explorers: polygon.explorers,
      walletSupport: polygon.walletSupport
    },
    tokenBuild: {
      standards: polygon.tokenStandards,
      tooling: polygon.tooling,
      defaultContractType: 'erc20',
      localScaffold: 'Solidity + OpenZeppelin + Hardhat local workspace with Polygon chain config added in a future reviewed deploy phase',
      deploymentBoundary: 'local scaffold and review only; no Polygon mainnet/testnet broadcast from this MVP'
    },
    trading: {
      supportedPlanningModes: ['paper top-200 rebalance research', 'Polygon DEX quote research', 'cross-chain route scoring', 'arbitrage after-fee modeling'],
      dexRouteFocus: polygon.dexRouteFocus,
      requiredBeforeLiveTrading: [
        'owner wallet connector reference with signing outside EtherealAI',
        'Selected-chain RPC/provider secret stored only in owner-approved secret manager',
        'DEX adapter contract tests',
        'slippage, gas, pool-depth, tax-token, and bridge-risk model',
        'owner go-live acceptance for each strategy'
      ],
      blockedNow: ['no wallet signing', 'no live swap', 'no liquidity transaction', 'no bridge transaction']
    },
    listingEvidence: polygon.listingEvidenceFocus.map(item => ({
      item,
      status: 'blocked_until_owner_deploys_or_provides_evidence'
    })),
    walletOps: {
      networkLabel: 'polygon',
      permissionScopes: ['view_public_address', 'read_token_balances', 'prepare_unsigned_transaction', 'owner_review_required_for_signing'],
      isolationRule: 'Use a separate labeled wallet for Polygon deployment/trading/treasury roles; never reuse a seed phrase inside EtherealAI.'
    },
    safetyBoundary: {
      localOnly: true,
      signingEnabled: false,
      liveTradingEnabled: false,
      deploymentEnabled: false,
      rpcSecretsAccepted: false
    }
  };
}

function buildTokenFeatureMatrix(spec = {}) {
  const flags = detectFeatureFlags(spec);
  const rows = [
    {
      id: 'supply',
      label: 'Supply and Allocation',
      priority: 'required',
      recommendation: 'Define total supply, circulating supply, locked addresses, vesting, treasury, liquidity allocation, and team/foundation wallets before any listing submission.'
    },
    {
      id: 'utility',
      label: 'Utility Mechanics',
      priority: 'required',
      recommendation: 'Map every token utility to a real product action: access, discount, governance, rewards, burn, collateral, staking, membership, or in-app settlement.'
    },
    {
      id: 'security',
      label: 'Security Controls',
      priority: 'required',
      recommendation: 'Require unit tests, static analysis, manual review, audit notes, admin role review, pause/upgrade policy, and explicit deployment approval before any network broadcast.'
    },
    {
      id: 'nft-utility',
      label: 'NFT Utility Layer',
      priority: flags.nftUtility || flags.passiveIncome ? 'high' : 'optional',
      recommendation: 'Design NFTs as capability modules: profit-share boost, staking multiplier, fee discount, governance weight, access tier, cosmetic trait, or limited partner utility.'
    },
    {
      id: 'cross-chain',
      label: 'Cross-Chain Strategy',
      priority: flags.crossChain ? 'high' : 'later',
      recommendation: 'Separate token launch chain from trading/arbitrage research. Bridges, wrapped assets, CEX routes, and DEX liquidity must each have risk and fee models.'
    },
    {
      id: 'governance',
      label: 'Governance',
      priority: flags.governance ? 'high' : 'optional',
      recommendation: 'Define who can change fees, treasury rules, staking rates, NFT upgrades, bridge settings, and emergency controls.'
    },
    {
      id: 'node-economics',
      label: 'Node Economics',
      priority: flags.nodeEconomics ? 'high' : 'research',
      recommendation: 'Model validator/node rewards, hardware costs, uptime requirements, slashing risk, token exposure, liquidity, and operational load.'
    }
  ];

  return rows;
}

function buildNftUtilityDesigner(spec = {}) {
  const flags = detectFeatureFlags(spec);
  const baseFormula = flags.passiveIncome
    ? 'effectiveYield = baseYield * tierMultiplier + activityBonus - riskReserve'
    : 'effectiveUtility = baseAccess + tierUtility + questProgress + governanceWeight';

  return {
    status: flags.nftUtility || flags.passiveIncome ? 'recommended' : 'available',
    formula: baseFormula,
    upgradeAxes: [
      'staking or rewards multiplier',
      'fee discount',
      'governance boost with cap',
      'access tier',
      'cooldown reduction',
      'rarity-weighted cosmetic status',
      'partner/dapp entitlement',
      'node or validator reward badge'
    ],
    safetyNotes: [
      'Avoid promises of guaranteed profit.',
      'Document whether NFT utility is discretionary, capped, revocable, or dependent on external revenue.',
      'Keep upgrade math bounded so a rare NFT cannot break treasury economics.'
    ]
  };
}

function buildRoadmap(spec = {}) {
  const flags = detectFeatureFlags(spec);
  const multiChainPlan = buildMultiChainTokenBuildPlan(spec);
  const phaseTwo = flags.nftUtility
    ? 'NFT utility prototype, gated membership logic, metadata plan, and local dapp demo.'
    : 'Token utility prototype, holder dashboard concept, and local dapp demo.';
  const phaseThree = flags.crossChain
    ? 'Cross-chain route research, DEX/CEX liquidity plan, bridge risk matrix, and arbitrage simulation.'
    : 'Liquidity plan, community beta, analytics dashboard, and listing evidence collection.';

  return [
    {
      phase: 'Phase 1',
      title: 'Spec and Proof',
      output: `Token spec, tokenomics draft, risk notes, website outline, whitepaper outline, and ${multiChainPlan.standardPlan.starterScaffold}.`
    },
    {
      phase: 'Phase 2',
      title: 'Utility Prototype',
      output: phaseTwo
    },
    {
      phase: 'Phase 3',
      title: 'Market and Community Readiness',
      output: phaseThree
    },
    {
      phase: 'Phase 4',
      title: 'Listing Evidence',
      output: 'Functional website, block explorer link after deploy, official socials, supply docs, liquidity evidence, and CMC/CoinGecko request packet.'
    },
    {
      phase: 'Phase 5',
      title: 'Ecosystem Expansion',
      output: 'Partner integrations, additional token/NFT modules, node economics research, and community governance milestones.'
    }
  ];
}

function buildWhitepaperDraft(spec = {}) {
  const flags = detectFeatureFlags(spec);
  const template = flags.nodeEconomics
    ? WHITEPAPER_TEMPLATES.find(item => item.id === 'chain-or-node')
    : flags.nftUtility || flags.crossChain
      ? WHITEPAPER_TEMPLATES.find(item => item.id === 'ecosystem-token')
      : WHITEPAPER_TEMPLATES.find(item => item.id === 'utility-token');
  const tokenName = spec.name || 'Token Project';

  return {
    template,
    draft: {
      title: `${tokenName} Whitepaper Draft`,
      abstract: `${tokenName} is a local-first token ecosystem concept generated from the Solidity Lab spec. The current artifact is a planning draft only and does not deploy contracts, publish claims, or enable live trading.`,
      useCase: spec.features || 'Define the core use case, token utility, NFT relationship, and user workflow.',
      tokenMechanics: buildTokenFeatureMatrix(spec).map(row => `${row.label}: ${row.recommendation}`),
      roadmap: buildRoadmap(spec),
      disclosures: [
        'Draft only; not investment advice.',
        'No live deployment has been performed by EtherealAI.',
        'No external social posts, listings, or trading actions are executed from this blueprint.'
      ]
    }
  };
}

function buildWebsiteBlueprint(spec = {}) {
  const flags = detectFeatureFlags(spec);
  const template = flags.nodeEconomics
    ? WEBSITE_TEMPLATES.find(item => item.id === 'node-profitability')
    : flags.nftUtility || flags.crossChain
      ? WEBSITE_TEMPLATES.find(item => item.id === 'ecosystem-hub')
      : WEBSITE_TEMPLATES.find(item => item.id === 'token-launch');

  return {
    template,
    pages: [
      {
        id: 'home',
        label: 'Home',
        sections: template.sections
      },
      {
        id: 'whitepaper',
        label: 'Whitepaper',
        sections: ['Abstract', 'Use Case', 'Tokenomics', 'Roadmap', 'Risk Disclosures']
      },
      {
        id: 'dapp',
        label: 'Dapp',
        sections: ['Connect Wallet Placeholder', 'Token Utility Modules', 'NFT Upgrade Modules', 'Analytics', 'Local Demo State']
      },
      {
        id: 'community',
        label: 'Community',
        sections: ['Discord', 'Telegram', 'Medium Updates', 'YouTube Demos', 'X Threads']
      }
    ],
    roadmap: buildRoadmap(spec)
  };
}

function toTickerSymbol(value = '') {
  const cleaned = String(value || '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (!cleaned.length) {
    return 'TOKEN';
  }

  if (cleaned.length === 1) {
    return cleaned[0].slice(0, 6).toUpperCase();
  }

  return cleaned.map(part => part.charAt(0)).join('').slice(0, 6).toUpperCase();
}

function buildLogoBrief(spec = {}) {
  const tokenName = spec.name || 'Token Project';
  const tokenSymbol = toTickerSymbol(tokenName);
  const source = [
    spec.features,
    spec.ecosystemNotes,
    spec.ecosystem_notes,
    spec.risk_notes
  ].filter(Boolean).join('\n');
  const ownerDirection = source
    .split('\n')
    .map(line => line.trim().replace(/^-\s*/, ''))
    .filter(line => /logo|brand|palette|REAL|world mark|dapp|NFT utility badge/i.test(line))
    .slice(0, 6)
    .join(' ');

  return {
    title: `${tokenName} Logo Brief`,
    prompts: [
      ownerDirection ? `Owner visual direction for ${tokenName}: ${ownerDirection}` : `REAL-inspired world mark for ${tokenName}, using dark premium crypto UI, cyan digital-world energy, neon pink accents, dark purple depth, black contrast, and white edge clarity.`,
      `Premium crypto token logo for ${tokenName}, scalable vector-style mark, readable at app-icon size, no text-only lockup.`,
      `Ecosystem token identity for ${tokenName}, symbol-first, modern blockchain utility, trustworthy but distinctive.`,
      `NFT-compatible emblem for ${tokenName}, works as a token icon, Discord avatar, website favicon, marketplace collection badge, dapp mark, and listing icon.`
    ],
    choices: [
      {
        id: 'real-world-mark',
        label: 'REAL World Mark',
        stylePreset: 'R/world mark, global infrastructure, premium dark token identity',
        bestFor: 'EtherealAI ecosystem token, founder updates, launch deck, listing icon, and dapp header.',
        visualSpec: `${tokenSymbol} or R-inspired world mark, black field, white edge clarity, cyan digital-world surface, neon pink accent triangle, readable at 32px.`,
        prompt: `Create a scalable crypto token logo for ${tokenName}: R/world mark, digital globe, black background, cyan earth-light, neon pink accent, white rim, premium exchange-listing clarity.`,
        exportNotes: 'Square token icon, transparent PNG, dark variant, light variant, social avatar, favicon, listing icon.'
      },
      {
        id: 'orbital-ai-core',
        label: 'Orbital AI Core',
        stylePreset: 'orbital AI core, neon safety locks, local command center',
        bestFor: 'AI operating system, automation, safety, local-first infrastructure, and command center visuals.',
        visualSpec: `${tokenSymbol} orbital core with concentric rings, magenta/cyan energy, dark purple depth, no tiny text, strong circular silhouette.`,
        prompt: `Create a futuristic AI-core token logo for ${tokenName}: orbital safety core, neon magenta and cyan, dark purple/black field, precise circular geometry, exchange-icon readable.`,
        exportNotes: 'Token icon, dapp status mark, NFT badge base, automation module emblem, community avatar.'
      },
      {
        id: 'we-math-better',
        label: 'We Math Better',
        stylePreset: 'trading math, tokenomics proof, purple starfield campaign',
        bestFor: 'Trading strategy, tokenomics, market proof, public progress updates, and education content.',
        visualSpec: `${tokenSymbol} math/proof emblem, purple starfield, cyan/pink data particles, minimal symbol-first mark, no long slogan inside the icon.`,
        prompt: `Create a proof-driven crypto logo for ${tokenName}: mathematical strategy identity, purple starfield, cyan/pink particles, clean symbol, readable icon, no copied coin logos.`,
        exportNotes: 'Campaign badge, social banner mark, YouTube chapter icon, Medium article mark, token listing fallback icon.'
      }
    ],
    deliverables: ['square icon', 'transparent PNG', 'dark background variant', 'light background variant', 'favicon', 'social avatar', 'dapp header mark', 'NFT utility badge set', 'CoinMarketCap/CoinGecko listing icon'],
    exportPackage: {
      localOnly: true,
      outputs: ['token-icon-1024.png plan', 'token-icon-256.png plan', 'token-icon-64.png plan', 'transparent-png plan', 'svg/vector spec', 'favicon plan', 'social-avatar plan', 'dapp-header-mark plan', 'listing-icon-package plan'],
      externalImageGenerationEnabled: false,
      listingSubmissionEnabled: false
    },
    lockStates: [
      { state: 'editable draft', meaning: 'Logo direction can be changed freely before public/listing use.' },
      { state: 'pre-listing selected', meaning: 'Owner selected a direction, but it is still editable before public submission.' },
      { state: 'listing-detected locked', meaning: 'Treat as locked after DexScreener, CoinMarketCap, CoinGecko, or public listing metadata confirms it.' },
      { state: 'immutable metadata locked', meaning: 'Treat as locked if deployed metadata or contract-linked metadata makes the asset hard to change.' }
    ],
    checks: ['legible at 32px', 'unique enough for listing pages', 'does not imitate existing coin logos', 'works without tiny text', 'readable on black/neon dapp UI', 'consistent with pink, cyan blue, dark purple, black, and white brand colors']
  };
}

function buildListingReadiness(spec = {}) {
  const applicationPlan = buildCompliantListingApplicationPlan(spec);
  const polygonProfile = buildPolygonOperatingProfile(spec);

  return {
    status: 'evidence_required',
    sources: LISTING_SOURCES,
    applicationPlan,
    polygonEvidence: polygonProfile.chain,
    checklist: [
      {
        id: 'functional_website',
        label: 'Functional project-owned website',
        status: 'planned',
        evidence: 'Website blueprint generated locally; public website is not deployed by this app.'
      },
      {
        id: 'block_explorer',
        label: 'Block explorer link',
        status: 'blocked_until_deploy',
        evidence: 'No deployment is performed. Add explorer link only after a separately reviewed deployment phase.'
      },
      {
        id: 'active_market',
        label: 'Active public market with material volume',
        status: 'blocked_until_market',
        evidence: 'EtherealAI does not create volume or manipulate activity. Organic, verifiable trading evidence is required.'
      },
      {
        id: 'supply_docs',
        label: 'Clear circulating supply and locked-token documentation',
        status: 'planned',
        evidence: 'Tokenomics and locked-address docs should be generated before submission.'
      },
      {
        id: 'official_socials',
        label: 'Official social/community links',
        status: 'planned',
        evidence: 'Social Ops can draft content and room plans locally; external account creation/posting remains disabled.'
      },
      {
        id: 'credible_evidence',
        label: 'Credible independently verifiable evidence',
        status: 'planned',
        evidence: 'Prepare docs, repository, explorer, audit/test outputs, community metrics, and exchange/pair URLs.'
      },
      {
        id: 'no_spam_no_bribes',
        label: 'No spam, fake volume, bribery, or paid guarantees',
        status: 'required',
        evidence: 'Listing strategy must be organic and evidence-based.'
      }
    ],
    platformPackets: applicationPlan.platformPackets,
    prohibitedShortcuts: applicationPlan.prohibitedShortcuts
  };
}

function buildCompliantListingApplicationPlan(spec = {}) {
  const tokenName = spec.name || 'Token Project';
  const chain = getChainOption(spec.network);
  const officialFormOnly = 'owner submits through the official platform request form only';

  return {
    status: 'owner_review_required',
    tokenName,
    targetChain: {
      id: chain.id,
      name: chain.name,
      family: chain.family
    },
    officialSources: LISTING_SOURCES,
    phases: [
      {
        id: 'evidence_foundation',
        label: 'Evidence Foundation',
        output: 'Website, whitepaper, roadmap, tokenomics, official links, security notes, and contract/explorer evidence are complete and internally consistent.'
      },
      {
        id: 'market_liquidity_proof',
        label: 'Market And Liquidity Proof',
        output: 'Token is traded on at least one legitimate, relevant exchange/DEX with verifiable pair URLs, real liquidity, and no manufactured activity.'
      },
      {
        id: 'community_operations',
        label: 'Community Operations',
        output: 'Discord/Telegram/X/Medium/YouTube/docs channels show real updates, moderation, support, and transparent progress without spam campaigns.'
      },
      {
        id: 'application_packet',
        label: 'Application Packet',
        output: 'EtherealAI prepares a local owner-reviewed CMC/CoinGecko packet with links, screenshots, supply docs, contact details, and risk notes.'
      },
      {
        id: 'owner_submission',
        label: 'Owner Submission',
        output: 'Owner submits once through official forms, tracks status locally, and does not duplicate, spam, bribe, or use middlemen promising results.'
      }
    ],
    platformPackets: [
      {
        platform: 'CoinMarketCap',
        requestPath: 'CoinMarketCap Request Form: 1 - [New Listing] Add cryptoasset',
        ownerSubmissionPath: officialFormOnly,
        evidence: [
          'functional project-owned website',
          'verified block explorer/token page',
          'active market/pair URLs',
          'supply, allocation, lock, vesting, and treasury documentation',
          'official representative contact',
          'official social/community URLs',
          'proof that activity is organic and not spammed or bribed'
        ]
      },
      {
        platform: 'CoinGecko',
        requestPath: 'CoinGecko account and request form for active or preview token listing',
        ownerSubmissionPath: officialFormOnly,
        evidence: [
          'working project-owned website',
          'working block explorer',
          'exchange/DEX where CoinGecko can track the token',
          'clear circulating-supply communication',
          'logo/image assets',
          'official socials and support links',
          'no repeated status-pressure or community spam'
        ]
      }
    ],
    communityGrowthPath: [
      'publish progress updates tied to real shipped milestones',
      'run support and moderation with written rules',
      'convert roadmap completions into Medium/docs/YouTube/X drafts',
      'collect owner-reviewed evidence of community growth, not fake engagement',
      'prepare listing packet only after links and market evidence are verifiable'
    ],
    prohibitedShortcuts: [
      'attempted bribery or payment to platform staff',
      'fake volume, wash trading, fake followers, fake comments, or fake community metrics',
      'duplicate request spam or instructing the community to spam listing teams',
      'impersonating platform staff or using middlemen claiming guaranteed listings',
      'submitting inaccurate supply, liquidity, exchange, or team information'
    ],
    safetyBoundary: {
      externalSubmissionEnabled: false,
      publicPostingEnabled: false,
      paymentForListingEnabled: false,
      ownerReviewRequired: true
    }
  };
}

function buildChainBuilderPlan(spec = {}) {
  const flags = detectFeatureFlags(spec);

  return {
    status: flags.nodeEconomics ? 'research_recommended' : 'future_track',
    options: [
      {
        id: 'evm-l2',
        label: 'EVM L2 / Rollup',
        fit: 'Best when Solidity/EVM compatibility and dapp integrations matter most.'
      },
      {
        id: 'app-chain',
        label: 'Cosmos SDK / App Chain',
        fit: 'Best when sovereign token economics, validator sets, and IBC are central to the product.'
      },
      {
        id: 'subnet',
        label: 'Avalanche Subnet / App Network',
        fit: 'Best when EVM compatibility plus custom validator economics are needed.'
      },
      {
        id: 'substrate',
        label: 'Substrate Runtime',
        fit: 'Best for highly customized chain logic after the product requirements are stable.'
      }
    ],
    designQuestions: [
      'What does the chain do that an existing chain cannot do?',
      'Who operates validators and why are they profitable?',
      'What is the source of real transaction demand?',
      'How are bridge, oracle, MEV, governance, and downtime risks handled?',
      'What explorer, RPC, wallet, indexer, and developer docs are required?'
    ]
  };
}

function buildNodeResearchPlan() {
  return {
    status: 'research_only_no_live_market_calls',
    profitabilityFormula: 'estimatedProfit = tokenRewardsUsd + feeRevenueUsd - hardwareCost - cloudCost - powerCost - slashingRisk - tokenDrawdownRisk - operatorTimeCost',
    trackedInputs: [
      'chain',
      'validator/miner/node type',
      'capital requirement',
      'hardware/cloud requirement',
      'reward rate',
      'token price/liquidity',
      'uptime requirement',
      'slashing/downtime risk',
      'setup complexity',
      'exit liquidity'
    ],
    output: 'Rank candidate nodes by risk-adjusted expected return, not just headline APR.'
  };
}

function buildCrossChainArbitrageArchitecture() {
  return {
    status: 'design_only_no_live_orders',
    objective: 'Let trading strategies query a route engine that compares CEX, DEX, bridge, gas, slippage, fees, and latency before deciding whether a trade is worth paper execution.',
    modules: [
      'top-200 market-cap universe builder',
      'multi-chain token identity resolver',
      'CEX orderbook quote collector',
      'DEX pool quote collector',
      'bridge route and settlement-time model',
      'gas and fee normalizer',
      'slippage/liquidity model',
      'arbitrage opportunity scorer',
      'paper execution ledger',
      'risk and kill-switch layer'
    ],
    requiredSafetyGates: [
      'no wallet private keys in EtherealAI',
      'sandbox/testnet adapters before live adapters',
      'per-chain max exposure',
      'per-exchange max exposure',
      'bridge-risk allowlist',
      'minimum net-profit threshold after fees/slippage/taxes',
      'owner go-live acceptance after separate reviewed implementation'
    ]
  };
}

function buildSocialCampaignPlan(spec = {}) {
  const tokenName = spec.name || 'Token Project';
  const communityOperations = buildCommunityOperationsPlan(spec);

  return {
    status: 'draft_only',
    tokenName,
    channels: SOCIAL_CHANNELS,
    communityOperations,
    launchCadence: [
      {
        phase: 'Pre-launch',
        outputs: ['vision thread', 'website teaser', 'whitepaper preview', 'Discord/Telegram structure', 'Medium problem/use-case article']
      },
      {
        phase: 'Build-in-public',
        outputs: ['weekly Medium progress update', 'YouTube demo script', 'community FAQ', 'roadmap checkpoint']
      },
      {
        phase: 'Listing readiness',
        outputs: ['official link audit', 'supply documentation article', 'exchange/pair evidence summary', 'community growth report']
      },
      {
        phase: 'Ecosystem expansion',
        outputs: ['NFT utility release notes', 'dapp walkthrough', 'governance summary', 'partner/update article']
      }
    ],
    listingGrowthRules: [
      'Every campaign draft must tie to a real shipped milestone, public artifact, or owner-approved roadmap item.',
      'Community questions are answered with support language, risk disclosures, and links to official docs.',
      'No fake engagement, no paid listing promises, no spam raids, and no pressure campaigns against CMC/CoinGecko.'
    ]
  };
}

function buildCommunityOperationsPlan(spec = {}) {
  const tokenName = spec.name || 'Token Project';

  return {
    status: 'draft_only_no_external_account_control',
    tokenName,
    operatingRoles: [
      {
        id: 'moderator',
        label: 'Community Moderator',
        scope: 'Draft room rules, triage FAQs, flag scams/impersonators, and prepare owner-reviewed responses.',
        automationBoundary: 'no external moderation action without future owner-approved connector'
      },
      {
        id: 'announcements_manager',
        label: 'Announcements Manager',
        scope: 'Turn real project milestones into X, Discord, Telegram, Medium, YouTube, and docs drafts.',
        automationBoundary: 'draft queue only; public posting disabled'
      },
      {
        id: 'listing_evidence_manager',
        label: 'Listing Evidence Manager',
        scope: 'Maintain CMC/CoinGecko evidence packet, official links, supply docs, exchange/pair URLs, and community metrics.',
        automationBoundary: 'local packet only; external submission disabled'
      },
      {
        id: 'support_manager',
        label: 'Support Manager',
        scope: 'Prepare plain-English answers for token utility, wallet setup, safety, roadmap, and dapp usage.',
        automationBoundary: 'local response drafts only'
      }
    ],
    stagePlaybooks: [
      {
        stage: 'Pre-Launch',
        actions: ['publish founder thesis drafts', 'prepare Discord/Telegram rules', 'publish website/whitepaper preview drafts', 'collect early FAQ']
      },
      {
        stage: 'Launch Evidence',
        actions: ['announce verified contract link after owner deployment', 'document liquidity and lock evidence', 'publish tokenomics explainer', 'update support FAQ']
      },
      {
        stage: 'Listing Readiness',
        actions: ['audit official links', 'prepare CMC packet', 'prepare CoinGecko packet', 'publish community progress report', 'avoid duplicate/spam status requests']
      },
      {
        stage: 'Post-Listing Growth',
        actions: ['publish milestone recaps', 'moderate support channels', 'update roadmap', 'capture community questions for product backlog']
      }
    ],
    moderationRules: [
      'Remove or flag impersonation, fake airdrops, malicious links, seed-phrase requests, and guaranteed-return claims.',
      'Do not allow posts that ask members to spam listing teams or harass exchanges.',
      'Route legal, tax, investment, or wallet-loss questions to owner-approved disclaimers and support docs.'
    ],
    announcementControls: [
      'Use only owner-approved facts, links, contract addresses, and roadmap status.',
      'Mark speculative roadmap items as planned, not shipped.',
      'Keep investment-advice, guaranteed-profit, and artificial-urgency language out of public drafts.'
    ]
  };
}

function buildTokenEcosystemCatalog() {
  return {
    chains: CHAIN_CATALOG,
    tokenContractTypes: SUPPORTED_TOKEN_CONTRACT_TYPES,
    recommendedLowFeeChains: getRecommendedLowFeeChains(),
    socialChannels: SOCIAL_CHANNELS,
    whitepaperTemplates: WHITEPAPER_TEMPLATES,
    websiteTemplates: WEBSITE_TEMPLATES,
    listingSources: LISTING_SOURCES,
    polygonOperatingProfile: buildPolygonOperatingProfile({ network: 'polygon' }),
    listingApplicationPlan: buildCompliantListingApplicationPlan({ network: 'polygon' }),
    communityOperations: buildCommunityOperationsPlan({ name: 'Token Project' }),
    nodeResearch: buildNodeResearchPlan(),
    crossChainArbitrage: buildCrossChainArbitrageArchitecture()
  };
}

function buildTokenEcosystemBlueprint(spec = {}) {
  return {
    status: 'local_blueprint_only',
    generatedAt: new Date().toISOString(),
    contract: {
      id: spec.id,
      name: spec.name,
      type: spec.contract_type,
      network: spec.network,
      solidityVersion: spec.solidity_version
    },
    multiChainTokenBuild: buildMultiChainTokenBuildPlan(spec),
    featureFlags: detectFeatureFlags(spec),
    tokenFeatureMatrix: buildTokenFeatureMatrix(spec),
    nftUtilityDesigner: buildNftUtilityDesigner(spec),
    website: buildWebsiteBlueprint(spec),
    whitepaper: buildWhitepaperDraft(spec),
    logo: buildLogoBrief(spec),
    socialCampaign: buildSocialCampaignPlan(spec),
    listingReadiness: buildListingReadiness(spec),
    listingApplicationPlan: buildCompliantListingApplicationPlan(spec),
    polygonOperatingProfile: buildPolygonOperatingProfile(spec),
    communityOperations: buildCommunityOperationsPlan(spec),
    chainBuilder: buildChainBuilderPlan(spec),
    chainCatalog: CHAIN_CATALOG,
    nodeResearch: buildNodeResearchPlan(),
    crossChainArbitrage: buildCrossChainArbitrageArchitecture(),
    safetyBoundary: {
      localOnly: true,
      deploymentEnabled: false,
      walletSecretsAccepted: false,
      externalPostingEnabled: false,
      liveTradingEnabled: false,
      note: 'This blueprint expands design and planning only. It does not deploy contracts, create external accounts, post to socials, place trades, or handle wallet keys.'
    }
  };
}

function cleanProjectText(value, fallback = '', maxLength = 4000) {
  const cleaned = String(value ?? fallback).trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

function safeJsonParse(value, fallback = {}) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function normalizeTextRecord(value = {}, fallback = {}, keys = [], maxLength = 3200) {
  const raw = value && typeof value === 'object'
    ? value
    : safeJsonParse(value, {});
  const existing = fallback && typeof fallback === 'object'
    ? fallback
    : safeJsonParse(fallback, {});

  return keys.reduce((record, key) => {
    record[key] = cleanProjectText(raw[key] ?? existing[key] ?? '', '', maxLength);
    return record;
  }, {});
}

function normalizeRoadmapPhaseList(value = [], fallback = []) {
  const raw = Array.isArray(value)
    ? value
    : safeJsonParse(value, []);
  const existing = Array.isArray(fallback)
    ? fallback
    : safeJsonParse(fallback, []);
  const source = raw.length ? raw : existing;

  return source.slice(0, 12).map((phase, index) => ({
    phaseName: cleanProjectText(phase.phaseName ?? phase.name ?? `Phase ${index + 1}`, `Phase ${index + 1}`, 160),
    goal: cleanProjectText(phase.goal, '', 1200),
    deliverables: cleanProjectText(phase.deliverables, '', 1600),
    ownerDecisionsRequired: cleanProjectText(phase.ownerDecisionsRequired, '', 1200),
    dependencies: cleanProjectText(phase.dependencies, '', 1200),
    lockedExternalActions: cleanProjectText(phase.lockedExternalActions, 'Deployment, wallet signing, minting, liquidity, public posting, listings, and paid services stay locked.', 1400),
    status: cleanProjectText(phase.status, 'draft', 80),
    ownerNotes: cleanProjectText(phase.ownerNotes, '', 1200)
  }));
}

function normalizePatternList(value = [], fallback = []) {
  const raw = Array.isArray(value)
    ? value
    : safeJsonParse(value, []);
  const existing = Array.isArray(fallback)
    ? fallback
    : safeJsonParse(fallback, []);
  const source = raw.length ? raw : existing;

  return source.slice(0, 12).map(pattern => ({
    label: cleanProjectText(pattern.label, 'Website pattern', 120),
    bestSuitedFor: cleanProjectText(pattern.bestSuitedFor, '', 500),
    commonSectionOrder: cleanProjectText(pattern.commonSectionOrder, '', 900),
    visualStyle: cleanProjectText(pattern.visualStyle, '', 500),
    ctaStyle: cleanProjectText(pattern.ctaStyle, '', 500),
    avoid: cleanProjectText(pattern.avoid, '', 500),
    recommendedUse: cleanProjectText(pattern.recommendedUse, '', 900),
    confidenceSource: cleanProjectText(pattern.confidenceSource, 'local curated pattern', 160)
  }));
}

function rejectSecretLikeTokenProjectInput(payload = {}) {
  const text = JSON.stringify(payload);

  if (/-----BEGIN|private key|seed phrase|mnemonic|api[_-]?key|cloudflare token|exchange secret|wallet secret/i.test(text)) {
    throw new Error('Token ecosystem projects cannot store private keys, API keys, wallet secrets, mnemonics, or deployment secrets.');
  }
}

function normalizeFeatureSelections(value) {
  const raw = Array.isArray(value)
    ? value
    : String(value || '')
      .split(/[,\n]/)
      .map(item => item.trim())
      .filter(Boolean);

  return Array.from(new Set(raw.map(item => cleanProjectText(item, '', 160)).filter(Boolean))).slice(0, 32);
}

function normalizeTokenOperatorDraft(value = {}, existing = {}) {
  const raw = value && typeof value === 'object'
    ? value
    : safeJsonParse(value, {});
  const fallback = existing && typeof existing === 'object'
    ? existing
    : safeJsonParse(existing, {});
  const pipeline = raw.pipeline && typeof raw.pipeline === 'object'
    ? raw.pipeline
    : (fallback.pipeline && typeof fallback.pipeline === 'object' ? fallback.pipeline : {});
  const logo = raw.logo && typeof raw.logo === 'object'
    ? raw.logo
    : (fallback.logo && typeof fallback.logo === 'object' ? fallback.logo : {});
  const website = raw.websiteWhitepaperRoadmap && typeof raw.websiteWhitepaperRoadmap === 'object'
    ? raw.websiteWhitepaperRoadmap
    : (fallback.websiteWhitepaperRoadmap && typeof fallback.websiteWhitepaperRoadmap === 'object' ? fallback.websiteWhitepaperRoadmap : {});
  const completion = raw.completion && typeof raw.completion === 'object'
    ? raw.completion
    : (fallback.completion && typeof fallback.completion === 'object' ? fallback.completion : {});

  return {
    version: 'ceo-token-draft-v1',
    savedLocally: true,
    pipeline: {
      category: cleanProjectText(pipeline.category, 'use-case token', 80),
      ticker: cleanProjectText(pipeline.ticker, '', 24).toUpperCase(),
      community: cleanProjectText(pipeline.community, '', 240),
      dappMode: cleanProjectText(pipeline.dappMode, 'add dapp later', 80),
      totalSupply: cleanProjectText(pipeline.totalSupply, '', 80),
      initialSupply: cleanProjectText(pipeline.initialSupply, '', 80),
      supplyModel: cleanProjectText(pipeline.supplyModel, '', 120),
      adminModel: cleanProjectText(pipeline.adminModel, '', 120),
      burnModel: cleanProjectText(pipeline.burnModel, '', 120),
      pauseModel: cleanProjectText(pipeline.pauseModel, '', 120),
      transferFee: cleanProjectText(pipeline.transferFee, '', 180),
      stakingRewards: cleanProjectText(pipeline.stakingRewards, '', 240),
      treasuryAllocation: cleanProjectText(pipeline.treasuryAllocation, '', 80),
      liquidityAllocation: cleanProjectText(pipeline.liquidityAllocation, '', 80),
      teamAllocation: cleanProjectText(pipeline.teamAllocation, '', 120),
      communityAllocation: cleanProjectText(pipeline.communityAllocation, '', 120),
      marketSupplyNotes: cleanProjectText(pipeline.marketSupplyNotes, '', 900),
      multiChainPlan: cleanProjectText(pipeline.multiChainPlan, '', 1600),
      utilitySummary: cleanProjectText(pipeline.utilitySummary, '', 900),
      brandPersonality: cleanProjectText(pipeline.brandPersonality, '', 900),
      releasePlan: cleanProjectText(pipeline.releasePlan, '', 1800),
      detailedUseCase: cleanProjectText(pipeline.detailedUseCase, '', 2200),
      dappModules: cleanProjectText(pipeline.dappModules, '', 2200),
      launchTimeline: cleanProjectText(pipeline.launchTimeline, '', 900),
      dappTimeline: cleanProjectText(pipeline.dappTimeline, '', 900),
      communityTimeline: cleanProjectText(pipeline.communityTimeline, '', 900),
      listingAmbition: cleanProjectText(pipeline.listingAmbition, '', 900),
      utilityRollout: cleanProjectText(pipeline.utilityRollout, '', 900),
      multichainTimeline: cleanProjectText(pipeline.multichainTimeline, '', 900),
      marketingRollout: cleanProjectText(pipeline.marketingRollout, '', 900),
      treasuryLiquidityPlan: cleanProjectText(pipeline.treasuryLiquidityPlan, '', 900),
      ownerRoadmapNotes: cleanProjectText(pipeline.ownerRoadmapNotes, '', 1200)
    },
    logo: {
      style: cleanProjectText(logo.style, '', 240),
      palette: cleanProjectText(logo.palette, '', 180),
      direction: cleanProjectText(logo.direction, '', 1600),
      existingLogo: cleanProjectText(logo.existingLogo, '', 800),
      inspirationImageNotes: cleanProjectText(logo.inspirationImageNotes, '', 800),
      textInfluence: Number.isFinite(Number(logo.textInfluence)) ? Math.min(100, Math.max(1, Number(logo.textInfluence))) : 60,
      imageInfluence: Number.isFinite(Number(logo.imageInfluence)) ? Math.min(100, Math.max(1, Number(logo.imageInfluence))) : 40,
      tokenStyleInfluence: Number.isFinite(Number(logo.tokenStyleInfluence)) ? Math.min(100, Math.max(1, Number(logo.tokenStyleInfluence))) : 75,
      shape: cleanProjectText(logo.shape, 'lettermark', 80),
      backgroundPreference: cleanProjectText(logo.backgroundPreference, 'transparent and dark variants', 120),
      selectedChoiceId: cleanProjectText(logo.selectedChoiceId, '', 80),
      lockState: cleanProjectText(logo.lockState, 'editable draft', 80),
      status: cleanProjectText(logo.status, 'editable draft', 80)
    },
    websiteWhitepaperRoadmap: {
      websiteTemplate: cleanProjectText(website.websiteTemplate, 'hybrid utility token site', 120),
      hero: cleanProjectText(website.hero, '', 1200),
      useCase: cleanProjectText(website.useCase, '', 2200),
      tokenomics: cleanProjectText(website.tokenomics, '', 2200),
      roadmap: cleanProjectText(website.roadmap, '', 2600),
      whitepaperNotes: cleanProjectText(website.whitepaperNotes, '', 3000),
      dappPreview: cleanProjectText(website.dappPreview, '', 2000),
      faq: cleanProjectText(website.faq, '', 2200),
      howToBuy: cleanProjectText(website.howToBuy, '', 2200),
      communityLinks: cleanProjectText(website.communityLinks, '', 1600),
      disclaimer: cleanProjectText(website.disclaimer, '', 2200),
      marketSource: cleanProjectText(website.marketSource, 'local curated token website patterns', 180),
      similarCategory: cleanProjectText(website.similarCategory, 'AI / automation token', 160),
      structureStyle: cleanProjectText(website.structureStyle, 'premium utility launch site', 160),
      tone: cleanProjectText(website.tone, 'premium protocol', 160),
      primaryColor: cleanProjectText(website.primaryColor, '#00f5ff', 32),
      secondaryColor: cleanProjectText(website.secondaryColor, '#ff4be1', 32),
      accentColor: cleanProjectText(website.accentColor, '#9b5cff', 32),
      useFourthColor: Boolean(website.useFourthColor),
      fourthColor: cleanProjectText(website.fourthColor, '#31f081', 32),
      useFifthColor: Boolean(website.useFifthColor),
      fifthColor: cleanProjectText(website.fifthColor, '#f7b733', 32),
      colorSystemNotes: cleanProjectText(website.colorSystemNotes, '', 1600),
      marketInspiration: cleanProjectText(website.marketInspiration, '', 3000),
      whitepaperQuality: cleanProjectText(website.whitepaperQuality, '', 1600),
      roadmapInputs: cleanProjectText(website.roadmapInputs, '', 2000),
      ecosystemRole: cleanProjectText(website.ecosystemRole, '', 1800),
      editInstructions: cleanProjectText(website.editInstructions, '', 2000),
      generatedWhitepaperSections: normalizeTextRecord(
        website.generatedWhitepaperSections,
        fallback.websiteWhitepaperRoadmap?.generatedWhitepaperSections,
        [
          'executiveSummary',
          'tokenOverview',
          'marketPositioning',
          'useCase',
          'tokenUtility',
          'tokenomics',
          'supplyMechanics',
          'technicalArchitecture',
          'ecosystemProductSystem',
          'roadmap',
          'securityRisksLimitations',
          'disclaimer'
        ],
        5000
      ),
      generatedWebsiteSections: normalizeTextRecord(
        website.generatedWebsiteSections,
        fallback.websiteWhitepaperRoadmap?.generatedWebsiteSections,
        [
          'hero',
          'tokenUseCase',
          'whyThisTokenExists',
          'tokenomics',
          'utility',
          'ecosystemDappPreview',
          'roadmap',
          'whitepaperSummary',
          'howToBuy',
          'faq',
          'socialCommunityLinks',
          'riskDisclaimer'
        ],
        3600
      ),
      generatedRoadmapPhases: normalizeRoadmapPhaseList(
        website.generatedRoadmapPhases,
        fallback.websiteWhitepaperRoadmap?.generatedRoadmapPhases
      ),
      inspirationPatterns: normalizePatternList(
        website.inspirationPatterns,
        fallback.websiteWhitepaperRoadmap?.inspirationPatterns
      ),
      socialLaunchKit: normalizeTextRecord(
        website.socialLaunchKit,
        fallback.websiteWhitepaperRoadmap?.socialLaunchKit,
        [
          'tokenBio',
          'xBio',
          'communityDescription',
          'firstAnnouncement',
          'utilityExplainer',
          'memeCommunityPost',
          'roadmapAnnouncement',
          'websiteLaunchCopy',
          'whitepaperLaunchCopy'
        ],
        2600
      ),
      status: cleanProjectText(website.status, 'editable local draft', 80)
    },
    completion: {
      tokenIdentity: Boolean(completion.tokenIdentity),
      tokenomics: Boolean(completion.tokenomics),
      useCase: Boolean(completion.useCase),
      logoBrief: Boolean(completion.logoBrief),
      websiteWhitepaper: Boolean(completion.websiteWhitepaper),
      dappPlan: Boolean(completion.dappPlan)
    },
    nextStep: cleanProjectText(raw.nextStep || fallback.nextStep, 'Logo Studio', 80),
    safetyBoundary: {
      localOnly: true,
      deploymentEnabled: false,
      walletSigningEnabled: false,
      publicPostingEnabled: false,
      listingSubmissionEnabled: false
    }
  };
}

function normalizeTokenEcosystemProjectInput(input = {}, existing = {}) {
  rejectSecretLikeTokenProjectInput(input);
  const name = cleanProjectText(input.name ?? existing.name, '', 140);
  const targetChain = normalizeChainId(input.targetChain ?? input.target_chain ?? existing.target_chain ?? existing.targetChain ?? 'base');
  const contractType = cleanProjectText(input.contractType ?? input.contract_type ?? existing.contract_type ?? existing.contractType ?? 'erc20', 'erc20', 40).toLowerCase();
  const featureSelections = normalizeFeatureSelections(input.featureSelections ?? input.feature_selections ?? existing.featureSelections ?? existing.feature_selections);
  const contractSpecId = input.contractSpecId ?? input.contract_spec_id ?? existing.contract_spec_id ?? existing.contractSpecId ?? null;
  const operatorDraft = normalizeTokenOperatorDraft(
    input.operatorDraft ?? input.operator_draft ?? input.operator_draft_json,
    existing.operatorDraft ?? existing.operator_draft ?? existing.operator_draft_json
  );
  const allowedContractTypes = new Set(SUPPORTED_TOKEN_CONTRACT_TYPES);

  if (!name) {
    throw new Error('Token ecosystem project name is required');
  }

  if (!allowedContractTypes.has(contractType)) {
    throw new Error('Contract type must be one of the supported local token standards');
  }

  return {
    contractSpecId: contractSpecId ? Number(contractSpecId) : null,
    name,
    targetChain,
    contractType,
    featureSelections: featureSelections.length ? featureSelections : DEFAULT_TOKEN_FEATURE_SELECTIONS,
    operatorDraft,
    nftUtilityNotes: cleanProjectText(input.nftUtilityNotes ?? input.nft_utility_notes ?? existing.nft_utility_notes ?? existing.nftUtilityNotes, '', 2000),
    ecosystemNotes: cleanProjectText(input.ecosystemNotes ?? input.ecosystem_notes ?? existing.ecosystem_notes ?? existing.ecosystemNotes, '', 4000),
    status: cleanProjectText(input.status ?? existing.status ?? 'draft', 'draft', 40),
    localOnly: true,
    externalActionsEnabled: false
  };
}

function buildTokenEcosystemProjectSpec(project = {}) {
  const features = [
    `Feature selections: ${(project.featureSelections || []).join('; ')}`,
    project.operatorDraft?.pipeline?.ticker ? `Ticker: ${project.operatorDraft.pipeline.ticker}` : '',
    project.operatorDraft?.pipeline?.category ? `Token category: ${project.operatorDraft.pipeline.category}` : '',
    project.operatorDraft?.pipeline?.totalSupply ? `Total supply: ${project.operatorDraft.pipeline.totalSupply}` : '',
    project.operatorDraft?.pipeline?.initialSupply ? `Initial minted supply: ${project.operatorDraft.pipeline.initialSupply}` : '',
    project.operatorDraft?.pipeline?.marketSupplyNotes ? `Market/circulating supply notes: ${project.operatorDraft.pipeline.marketSupplyNotes}` : '',
    project.operatorDraft?.pipeline?.supplyModel ? `Supply model: ${project.operatorDraft.pipeline.supplyModel}` : '',
    project.operatorDraft?.pipeline?.utilitySummary ? `Utility summary: ${project.operatorDraft.pipeline.utilitySummary}` : '',
    project.operatorDraft?.pipeline?.multiChainPlan ? `Multi-chain plan: ${project.operatorDraft.pipeline.multiChainPlan}` : '',
    project.operatorDraft?.pipeline?.dappMode ? `Dapp plan: ${project.operatorDraft.pipeline.dappMode}` : '',
    project.operatorDraft?.pipeline?.ownerRoadmapNotes ? `Owner roadmap notes: ${project.operatorDraft.pipeline.ownerRoadmapNotes}` : '',
    project.operatorDraft?.logo?.direction ? `Logo direction: ${project.operatorDraft.logo.direction}` : '',
    project.operatorDraft?.websiteWhitepaperRoadmap?.hero ? `Website hero: ${project.operatorDraft.websiteWhitepaperRoadmap.hero}` : '',
    project.operatorDraft?.websiteWhitepaperRoadmap?.roadmap ? `Roadmap draft: ${project.operatorDraft.websiteWhitepaperRoadmap.roadmap}` : '',
    project.operatorDraft?.websiteWhitepaperRoadmap?.whitepaperNotes ? `Whitepaper notes: ${project.operatorDraft.websiteWhitepaperRoadmap.whitepaperNotes}` : '',
    project.operatorDraft?.websiteWhitepaperRoadmap?.marketInspiration ? `Website inspiration: ${project.operatorDraft.websiteWhitepaperRoadmap.marketInspiration}` : '',
    Object.values(project.operatorDraft?.websiteWhitepaperRoadmap?.socialLaunchKit || {}).some(hasDraftText) ? 'Social launch kit: local draft package generated; public posting disabled.' : '',
    project.nftUtilityNotes ? `NFT utility notes: ${project.nftUtilityNotes}` : '',
    project.ecosystemNotes ? `Ecosystem notes: ${project.ecosystemNotes}` : ''
  ].filter(Boolean).join('\n');

  return {
    id: project.contractSpecId || project.id,
    name: project.name,
    contract_type: project.contractType || project.contract_type || 'erc20',
    network: project.targetChain || project.target_chain || 'base',
    solidity_version: '0.8.24',
    features,
    risk_notes: [
      'Local-only token ecosystem project.',
      'No wallet private keys, no deployment broadcast, no external posting, and no live trading.',
      'Owner must review legal, tokenomics, listing, and security assumptions before any public action.'
    ].join('\n')
  };
}

function buildTokenEcosystemProjectBlueprint(project = {}) {
  const spec = buildTokenEcosystemProjectSpec(project);

  return {
    ...buildTokenEcosystemBlueprint(spec),
    project: {
      id: project.id || null,
      contractSpecId: project.contractSpecId || project.contract_spec_id || null,
      featureSelections: project.featureSelections || [],
      operatorDraft: normalizeTokenOperatorDraft(project.operatorDraft || project.operator_draft_json || {}),
      nftUtilityNotes: project.nftUtilityNotes || '',
      ecosystemNotes: project.ecosystemNotes || '',
      localOnly: true,
      externalActionsEnabled: false
    },
    operatorWorkflow: {
      mode: 'Simple CEO Operator',
      currentStep: 'Local token draft saved',
      nextStep: 'Logo Studio',
      nextStepReason: 'Logo identity should be locked before the website, whitepaper, social package, listing icon package, and dapp visuals are finalized.',
      gates: ['Preview / Review', 'Final Confirm / Execute'],
      lockedExternalActions: ['deployment', 'wallet signing', 'liquidity creation', 'public posting', 'Cloudflare/GitHub publishing', 'CMC/CoinGecko submission', 'paid services']
    }
  };
}

const TOKEN_LAUNCH_PIPELINE_STEPS = Object.freeze([
  {
    id: 'token-type',
    label: 'Token Type',
    ownerAction: 'Choose use-case, meme, or hybrid meme + utility.'
  },
  {
    id: 'chain',
    label: 'Blockchain',
    ownerAction: 'Choose the target chain for this token project.'
  },
  {
    id: 'identity',
    label: 'Identity',
    ownerAction: 'Enter token name, ticker, description, community, and personality.'
  },
  {
    id: 'tokenomics',
    label: 'Tokenomics',
    ownerAction: 'Enter supply, release, allocation, fee, burn, pause, admin, airdrop, and reward settings.'
  },
  {
    id: 'use-case',
    label: 'Use Case',
    ownerAction: 'Describe what the token does in plain English.'
  },
  {
    id: 'dapp-plan',
    label: 'Dapp Plan',
    ownerAction: 'Choose no dapp, add later, or describe up to three local dapp modules.'
  },
  {
    id: 'contract-plan',
    label: 'Contract Plan',
    ownerAction: 'Review the local contract feature plan. Deployment remains locked.'
  },
  {
    id: 'logo-studio',
    label: 'Logo Studio',
    ownerAction: 'Choose or regenerate three local logo direction specs.'
  },
  {
    id: 'website-builder',
    label: 'Website / Whitepaper / Roadmap',
    ownerAction: 'Generate and edit local website, whitepaper, roadmap, FAQ, how-to-buy, and disclaimer sections.'
  },
  {
    id: 'local-preview',
    label: 'Local Website Preview',
    ownerAction: 'Preview the local website draft without publishing.'
  },
  {
    id: 'launch-review',
    label: 'Launch Package Review',
    ownerAction: 'Review the complete local launch package and locked external actions.'
  }
]);

function hasDraftText(value) {
  return Boolean(String(value || '').trim());
}

function buildWebsiteDraftCompletion(website = {}) {
  return Boolean(
    hasDraftText(website.hero)
    || hasDraftText(website.useCase)
    || hasDraftText(website.tokenomics)
    || hasDraftText(website.roadmap)
    || hasDraftText(website.whitepaperNotes)
    || hasDraftText(website.dappPreview)
    || hasDraftText(website.faq)
    || hasDraftText(website.howToBuy)
    || hasDraftText(website.communityLinks)
    || hasDraftText(website.disclaimer)
    || hasDraftText(website.marketInspiration)
    || hasDraftText(website.whitepaperQuality)
    || hasDraftText(website.roadmapInputs)
    || hasDraftText(website.ecosystemRole)
    || Object.values(website.generatedWhitepaperSections || {}).some(hasDraftText)
    || Object.values(website.generatedWebsiteSections || {}).some(hasDraftText)
    || (website.generatedRoadmapPhases || []).length > 0
    || (website.inspirationPatterns || []).length > 0
    || Object.values(website.socialLaunchKit || {}).some(hasDraftText)
  );
}

function buildTokenLaunchStepStatus(project = {}) {
  const draft = normalizeTokenOperatorDraft(project.operatorDraft || project.operator_draft_json || {});
  const pipeline = draft.pipeline || {};
  const logo = draft.logo || {};
  const website = draft.websiteWhitepaperRoadmap || {};
  const blueprint = project.blueprint?.status
    ? project.blueprint
    : buildTokenEcosystemProjectBlueprint(project);
  const useCaseText = [
    pipeline.detailedUseCase,
    project.ecosystemNotes,
    project.ecosystem_notes
  ].filter(hasDraftText).join('\n');
  const selectedLogo = hasDraftText(logo.selectedChoiceId) || hasDraftText(logo.direction);
  const websiteComplete = buildWebsiteDraftCompletion(website);
  const completedMap = {
    'token-type': hasDraftText(pipeline.category),
    chain: hasDraftText(project.target_chain || project.targetChain),
    identity: hasDraftText(project.name) && hasDraftText(pipeline.ticker),
    tokenomics: hasDraftText(pipeline.totalSupply) && hasDraftText(pipeline.supplyModel),
    'use-case': hasDraftText(useCaseText),
    'dapp-plan': hasDraftText(pipeline.dappMode),
    'contract-plan': Boolean(blueprint.operatorWorkflow || blueprint.multiChainTokenBuild),
    'logo-studio': selectedLogo,
    'website-builder': websiteComplete,
    'local-preview': websiteComplete,
    'launch-review': selectedLogo && websiteComplete && hasDraftText(project.name) && hasDraftText(pipeline.ticker)
  };
  const firstIncompleteStep = TOKEN_LAUNCH_PIPELINE_STEPS.find(step => !completedMap[step.id]);
  const lastCompletedStep = [...TOKEN_LAUNCH_PIPELINE_STEPS].reverse().find(step => completedMap[step.id]) || null;
  const completedCount = TOKEN_LAUNCH_PIPELINE_STEPS.filter(step => completedMap[step.id]).length;

  return {
    steps: TOKEN_LAUNCH_PIPELINE_STEPS.map(step => ({
      ...step,
      status: completedMap[step.id] ? 'ready' : (firstIncompleteStep?.id === step.id ? 'needs review' : 'draft'),
      complete: Boolean(completedMap[step.id])
    })),
    completedMap,
    currentStep: firstIncompleteStep || TOKEN_LAUNCH_PIPELINE_STEPS[TOKEN_LAUNCH_PIPELINE_STEPS.length - 1],
    lastCompletedStep,
    progressPercent: Math.round((completedCount / TOKEN_LAUNCH_PIPELINE_STEPS.length) * 100)
  };
}

function buildTokenLaunchBlockers(project = {}) {
  const draft = normalizeTokenOperatorDraft(project.operatorDraft || project.operator_draft_json || {});
  const pipeline = draft.pipeline || {};
  const blockers = [];

  if (!hasDraftText(project.name)) {
    blockers.push({
      title: 'Token name is missing',
      fix: 'Enter the token name in Token Launch Factory.'
    });
  }

  if (!hasDraftText(project.target_chain || project.targetChain)) {
    blockers.push({
      title: 'Target blockchain is missing',
      fix: 'Choose the chain for this token project.'
    });
  }

  if (!hasDraftText(pipeline.ticker)) {
    blockers.push({
      title: 'Ticker is missing',
      fix: 'Enter the ticker so the website, logo package, and launch package can inherit it.'
    });
  }

  if (!hasDraftText(pipeline.totalSupply)) {
    blockers.push({
      title: 'Total supply is missing',
      fix: 'Enter total supply in Tokenomics.'
    });
  }

  if (!hasDraftText(pipeline.detailedUseCase) && !hasDraftText(project.ecosystemNotes || project.ecosystem_notes)) {
    blockers.push({
      title: 'Use case is missing',
      fix: 'Describe what the token does so EtherealAI can build the contract plan, dapp plan, website, and whitepaper.'
    });
  }

  if (!hasDraftText(draft.logo?.selectedChoiceId) && !hasDraftText(draft.logo?.direction)) {
    blockers.push({
      title: 'Logo direction is not selected',
      fix: 'Open Logo Studio and choose one of the three local logo specs.'
    });
  }

  if (!buildWebsiteDraftCompletion(draft.websiteWhitepaperRoadmap || {})) {
    blockers.push({
      title: 'Website / whitepaper / roadmap draft is missing',
      fix: 'Open Website / Whitepaper / Roadmap Builder and save the local draft.'
    });
  }

  return blockers;
}

function buildTokenLaunchApiReadiness(apiReadiness = {}) {
  const fallback = {
    kraken: {
      label: 'Kraken',
      status: 'optional',
      detail: 'API status is shown in API Connection Center. Token/logo/website drafts do not require Kraken.'
    },
    coinbase: {
      label: 'Coinbase Advanced',
      status: 'optional',
      detail: 'Coinbase read-only setup is optional future integration.'
    },
    dexReadOnly: {
      label: 'DEX read-only',
      status: 'planned',
      detail: 'DEX quote/token/pool research is planned read-only. Swaps and wallet signing stay locked.'
    },
    walletMetadata: {
      label: 'Wallet metadata',
      status: 'optional',
      detail: 'Public wallet metadata can be added later. Seed phrases and private keys are never requested.'
    },
    dexExecution: {
      label: 'DEX execution',
      status: 'locked external action',
      detail: 'Swaps, approvals, and wallet signing require a future owner-approved phase.'
    }
  };

  return {
    ...fallback,
    ...apiReadiness,
    doesNotBlockLocalLaunchPackage: true
  };
}

function buildTokenLaunchPipelineState(project = null, { apiReadiness = {}, generatedAt = new Date().toISOString() } = {}) {
  if (!project) {
    return {
      generatedAt,
      activeProject: null,
      currentStep: {
        id: 'start-project',
        label: 'Start Token Launch Project',
        ownerAction: 'Create or resume a local token launch project.'
      },
      lastCompletedStep: null,
      progressPercent: 0,
      blockers: [],
      nextRecommendedAction: 'Start a token launch project.',
      apiReadiness: buildTokenLaunchApiReadiness(apiReadiness),
      statuses: {
        tokenLaunchFactory: 'draft',
        logoStudio: 'draft',
        websiteWhitepaperRoadmap: 'draft',
        localPreview: 'draft',
        launchPackage: 'draft'
      },
      safetyBoundary: {
        localOnly: true,
        externalActionsEnabled: false,
        deploymentEnabled: false,
        walletSigningEnabled: false,
        publicPostingEnabled: false,
        listingSubmissionEnabled: false,
        liveTradingEnabled: false
      }
    };
  }

  const draft = normalizeTokenOperatorDraft(project.operatorDraft || project.operator_draft_json || {});
  const stepStatus = buildTokenLaunchStepStatus(project);
  const blockers = buildTokenLaunchBlockers(project);
  const websiteReady = buildWebsiteDraftCompletion(draft.websiteWhitepaperRoadmap || {});
  const logoReady = Boolean(draft.logo?.selectedChoiceId || draft.logo?.direction);
  const launchReviewReady = blockers.length === 0;
  const nextStep = stepStatus.currentStep;

  return {
    generatedAt,
    activeProject: {
      id: project.id,
      projectName: project.name,
      chain: project.target_chain || project.targetChain || '',
      tokenName: project.name || '',
      ticker: draft.pipeline?.ticker || '',
      category: draft.pipeline?.category || '',
      status: project.status || 'draft',
      updatedAt: project.updated_at || null,
      localOnly: true
    },
    currentStep: nextStep,
    lastCompletedStep: stepStatus.lastCompletedStep,
    steps: stepStatus.steps,
    progressPercent: stepStatus.progressPercent,
    blockers,
    nextRecommendedAction: blockers.length
      ? nextStep.ownerAction
      : 'Review the complete local launch package.',
    apiReadiness: buildTokenLaunchApiReadiness(apiReadiness),
    statuses: {
      tokenLaunchFactory: stepStatus.completedMap.identity && stepStatus.completedMap.tokenomics ? 'ready for review' : 'draft',
      logoStudio: logoReady ? 'ready for review' : 'draft',
      websiteWhitepaperRoadmap: websiteReady ? 'locally generated' : 'draft',
      localPreview: websiteReady ? 'locally generated' : 'draft',
      launchPackage: launchReviewReady ? 'ready for review' : 'blocked'
    },
    lockedExternalActions: [
      'Contract deployment',
      'Token minting',
      'Wallet signing',
      'Liquidity creation',
      'Swaps',
      'Withdrawals/transfers',
      'Cloudflare or DNS mutation',
      'GitHub publishing',
      'Public social posting',
      'CoinMarketCap/CoinGecko/DexScreener submission',
      'Paid services',
      'Live trading'
    ],
    safetyBoundary: {
      localOnly: true,
      externalActionsEnabled: false,
      deploymentEnabled: false,
      walletSigningEnabled: false,
      publicPostingEnabled: false,
      listingSubmissionEnabled: false,
      liveTradingEnabled: false
    },
    advancedDiagnostics: {
      rawProjectRoute: `/api/v1/token-ecosystem-projects/${project.id}`,
      artifactManifestRoute: `/api/v1/token-ecosystem-projects/${project.id}/artifacts`,
      websitePackageRoute: `/api/v1/token-ecosystem-projects/${project.id}/website-deploy-package`
    }
  };
}

function buildTokenLaunchPackageReview(project = {}, { apiReadiness = {}, artifactManifest = null } = {}) {
  const draft = normalizeTokenOperatorDraft(project.operatorDraft || project.operator_draft_json || {});
  const blueprint = project.blueprint?.status
    ? project.blueprint
    : buildTokenEcosystemProjectBlueprint(project);
  const pipelineState = buildTokenLaunchPipelineState(project, { apiReadiness });
  const website = draft.websiteWhitepaperRoadmap || {};
  const pipeline = draft.pipeline || {};
  const logo = draft.logo || {};

  return {
    status: pipelineState.blockers.length ? 'blocked' : 'ready for review',
    generatedAt: new Date().toISOString(),
    project: pipelineState.activeProject,
    progressPercent: pipelineState.progressPercent,
    nextSafeAction: pipelineState.nextRecommendedAction,
    tokenIdentity: {
      tokenName: project.name || '',
      ticker: pipeline.ticker || '',
      category: pipeline.category || '',
      chain: project.target_chain || project.targetChain || '',
      contractType: project.contract_type || project.contractType || '',
      community: pipeline.community || ''
    },
    tokenomics: {
      totalSupply: pipeline.totalSupply || '',
      initialSupply: pipeline.initialSupply || '',
      marketSupplyNotes: pipeline.marketSupplyNotes || '',
      supplyModel: pipeline.supplyModel || '',
      adminModel: pipeline.adminModel || '',
      burnModel: pipeline.burnModel || '',
      pauseModel: pipeline.pauseModel || '',
      transferFee: pipeline.transferFee || '',
      stakingRewards: pipeline.stakingRewards || '',
      treasuryAllocation: pipeline.treasuryAllocation || '',
      liquidityAllocation: pipeline.liquidityAllocation || '',
      teamAllocation: pipeline.teamAllocation || '',
      communityAllocation: pipeline.communityAllocation || '',
      releasePlan: pipeline.releasePlan || '',
      multiChainPlan: pipeline.multiChainPlan || ''
    },
    useCase: {
      plainEnglish: pipeline.detailedUseCase || project.ecosystemNotes || project.ecosystem_notes || '',
      websiteExplanation: website.useCase || '',
      whitepaperExplanation: website.whitepaperNotes || ''
    },
    contractPlan: {
      status: 'local generated plan',
      selectedChain: blueprint.multiChainTokenBuild?.selectedChain || null,
      standardPlan: blueprint.multiChainTokenBuild?.standardPlan || null,
      featureMatrixCount: blueprint.tokenFeatureMatrix?.length || 0,
      deploymentEnabled: false,
      mintingEnabled: false,
      walletSigningEnabled: false
    },
    dappPlan: {
      mode: pipeline.dappMode || '',
      modules: pipeline.dappModules || '',
      preview: website.dappPreview || '',
      deploymentStatus: 'locked external action'
    },
    selectedLogo: {
      status: logo.selectedChoiceId || logo.direction ? 'pre-listing selected' : 'editable draft',
      selectedChoiceId: logo.selectedChoiceId || '',
      style: logo.style || '',
      palette: logo.palette || '',
      direction: logo.direction || '',
      lockState: logo.lockState || 'editable draft'
    },
    websiteDraft: {
      status: buildWebsiteDraftCompletion(website) ? 'locally generated' : 'draft',
      template: website.websiteTemplate || '',
      hero: website.hero || '',
      useCase: website.useCase || '',
      tokenomics: website.tokenomics || '',
      visualDirection: {
        tone: website.structureStyle || '',
        marketSource: website.marketSource || '',
        palette: [
          website.primaryColor,
          website.secondaryColor,
          website.accentColor,
          website.useFourthColor ? website.fourthColor : '',
          website.useFifthColor ? website.fifthColor : ''
        ].filter(Boolean)
      },
      generatedSections: website.generatedWebsiteSections || {},
      faqStatus: hasDraftText(website.faq) ? 'locally generated' : 'draft',
      howToBuyStatus: hasDraftText(website.howToBuy) ? 'locally generated' : 'draft',
      disclaimerStatus: hasDraftText(website.disclaimer) ? 'locally generated' : 'draft'
    },
    whitepaperDraft: {
      status: hasDraftText(website.whitepaperNotes) || Object.values(website.generatedWhitepaperSections || {}).some(hasDraftText) ? 'locally generated' : 'draft',
      notes: website.whitepaperNotes || '',
      sections: website.generatedWhitepaperSections || {}
    },
    roadmapDraft: {
      status: hasDraftText(website.roadmap) || (website.generatedRoadmapPhases || []).length ? 'locally generated' : 'draft',
      milestones: website.roadmap || '',
      phases: website.generatedRoadmapPhases || []
    },
    topTokenWebsiteInspiration: {
      status: (website.inspirationPatterns || []).length ? 'local pattern brief generated' : 'planned/read-only',
      source: website.marketSource || 'local curated token website patterns',
      brief: website.marketInspiration || '',
      patterns: website.inspirationPatterns || [],
      liveTop200AnalysisPerformed: false,
      note: 'CoinMarketCap Top 200 analysis requires an approved read-only API key or approved local dataset. No scraping, copying, listing submission, or public mutation is performed here.'
    },
    socialLaunchKit: {
      status: Object.values(website.socialLaunchKit || {}).some(hasDraftText) ? 'local drafts generated' : 'draft',
      drafts: website.socialLaunchKit || {},
      publicPostingEnabled: false
    },
    localPreview: {
      status: buildWebsiteDraftCompletion(website) ? 'locally generated' : 'draft',
      inAppSection: 'token-site-local-preview',
      publicUrl: null,
      publicDeploymentEnabled: false
    },
    apiReadiness: pipelineState.apiReadiness,
    blockers: pipelineState.blockers,
    lockedExternalActions: pipelineState.lockedExternalActions,
    artifactSummary: artifactManifest?.counts || null,
    buttons: [
      { label: 'Edit Token Details', target: 'token-launch-operator-pipeline' },
      { label: 'Edit Logo', target: 'logo-blueprint' },
      { label: 'Edit Website', target: 'website-whitepaper-roadmap-builder' },
      { label: 'Edit Whitepaper', target: 'token-whitepaper-builder-panel' },
      { label: 'Edit Roadmap', target: 'token-roadmap-builder-panel' },
      { label: 'Edit Social Launch Kit', target: 'token-social-launch-bridge' },
      { label: 'Preview Local Site', target: 'token-site-local-preview' },
      { label: 'Export Local Package', action: 'website-package', lockedExternal: false },
      { label: 'Advanced Diagnostics', target: 'advanced-token-launch-diagnostics' }
    ],
    safetyBoundary: pipelineState.safetyBoundary
  };
}

function parseTokenEcosystemProject(row = {}) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    contract_spec_id: row.contract_spec_id,
    name: row.name,
    target_chain: row.target_chain,
    contract_type: row.contract_type,
    featureSelections: safeJsonParse(row.feature_selections_json, []),
    operatorDraft: normalizeTokenOperatorDraft(row.operator_draft_json || '{}'),
    nft_utility_notes: row.nft_utility_notes || '',
    ecosystem_notes: row.ecosystem_notes || '',
    status: row.status,
    blueprint: JSON.parse(row.blueprint_json || '{}'),
    localOnly: row.local_only !== 0,
    externalActionsEnabled: row.external_actions_enabled === 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function markdownList(items = []) {
  return items.length ? items.map(item => `- ${item}`).join('\n') : '- Pending owner input';
}

function escapeHtml(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function plainTextList(items = [], fallback = 'Pending owner input') {
  return (items || [])
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .length
    ? items.map(item => String(item || '').trim()).filter(Boolean)
    : [fallback];
}

function splitDraftLines(value = '', fallback = 'Pending owner input') {
  const lines = String(value || '')
    .split(/\n|\. /)
    .map(line => line.trim().replace(/\.$/, ''))
    .filter(Boolean);

  return lines.length ? lines : [fallback];
}

function renderStaticTokenPage({
  tokenName,
  title,
  subtitle,
  nav = [],
  sections = [],
  currentPath = '/'
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | ${escapeHtml(tokenName)}</title>
  <meta name="description" content="${escapeHtml(subtitle)}">
  <link rel="stylesheet" href="${currentPath === '/' ? './assets/site.css' : '../assets/site.css'}">
  <link rel="manifest" href="${currentPath === '/' ? './site.webmanifest' : '../site.webmanifest'}">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="${currentPath === '/' ? './' : '../'}">${escapeHtml(tokenName)}</a>
    <nav aria-label="Primary">
      ${nav.map(item => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join('\n      ')}
    </nav>
  </header>
  <main>
    <section class="hero">
      <p class="eyebrow">Local launch package</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
    </section>
    ${sections.map(section => `
    <section class="content-section">
      <h2>${escapeHtml(section.title)}</h2>
      ${section.body ? `<p>${escapeHtml(section.body)}</p>` : ''}
      ${section.items?.length ? `<ul>${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
    </section>`).join('\n')}
  </main>
  <footer class="site-footer">
    <p>Generated locally by EtherealAI. No deployment, posting, wallet signing, DNS mutation, or trading action has been performed.</p>
  </footer>
</body>
</html>
`;
}

function buildTokenWebsiteDeployPackageFiles(project = {}, cloudflarePlan = {}) {
  const blueprint = project.blueprint?.status ? project.blueprint : buildTokenEcosystemProjectBlueprint(project);
  const operatorDraft = normalizeTokenOperatorDraft(project.operatorDraft || project.operator_draft_json || {});
  const pipeline = operatorDraft.pipeline || {};
  const draftWebsite = operatorDraft.websiteWhitepaperRoadmap || {};
  const tokenName = project.name || blueprint.contract?.name || 'Token Ecosystem Project';
  const website = blueprint.website || {};
  const whitepaper = blueprint.whitepaper || {};
  const social = blueprint.socialCampaign || {};
  const listing = blueprint.listingReadiness || {};
  const multiChain = blueprint.multiChainTokenBuild || {};
  const applicationPlan = blueprint.listingApplicationPlan || listing.applicationPlan || {};
  const polygonProfile = blueprint.polygonOperatingProfile || {};
  const communityOps = blueprint.communityOperations || social.communityOperations || {};
  const primaryDomain = cloudflarePlan.primaryDomain || 'etherealdigit.ai';
  const primaryFqdn = cloudflarePlan.primaryFqdn || primaryDomain;
  const customDomains = cloudflarePlan.cloudflarePages?.customDomains || [primaryFqdn];
  const pagesProject = cloudflarePlan.pagesProject || `etherealai-${normalizeChainId(tokenName)}`;
  const nav = [
    { label: 'Home', href: './' },
    { label: 'Whitepaper', href: './whitepaper/' },
    { label: 'Dapp', href: './app/' },
    { label: 'Community', href: './community/' }
  ];
  const roadmapItems = hasDraftText(draftWebsite.roadmap)
    ? splitDraftLines(draftWebsite.roadmap, 'Roadmap pending owner input')
    : (website.roadmap || []).map(item => `${item.phase}: ${item.title} - ${item.output}`);
  const featureItems = [
    `Target chain: ${multiChain.selectedChain?.name || project.target_chain || project.targetChain || 'Base'}`,
    `Token standard: ${multiChain.standardPlan?.primaryStandard || project.contract_type || project.contractType || 'ERC20'}`,
    pipeline.category ? `Token category: ${pipeline.category}` : '',
    pipeline.ticker ? `Ticker: ${pipeline.ticker}` : '',
    pipeline.totalSupply ? `Total supply: ${pipeline.totalSupply}` : '',
    pipeline.initialSupply ? `Initial minted supply: ${pipeline.initialSupply}` : '',
    pipeline.supplyModel ? `Supply model: ${pipeline.supplyModel}` : '',
    pipeline.transferFee ? `Transfer fee / tax: ${pipeline.transferFee}` : '',
    ...plainTextList(project.featureSelections || [], 'Feature plan pending owner input')
  ].filter(Boolean);
  const whitepaperItems = [
    draftWebsite.whitepaperNotes || '',
    draftWebsite.useCase || '',
    whitepaper.draft?.abstract || 'Whitepaper abstract pending.',
    whitepaper.draft?.useCase || 'Use case pending owner input.',
    ...plainTextList(whitepaper.draft?.disclosures || [], 'Disclosures pending owner review')
  ].filter(Boolean);
  const communityItems = (social.channels || []).map(channel => `${channel.label}: ${channel.purpose}`);
  const communityDraftItems = splitDraftLines(draftWebsite.communityLinks, 'Community links pending owner input');
  const listingItems = (listing.checklist || []).map(item => `${item.label}: ${item.evidence}`);
  const applicationItems = (applicationPlan.phases || []).map(phase => `${phase.label}: ${phase.output}`);
  const polygonItems = [
    `Chain ID: ${polygonProfile.chain?.chainId || 137}`,
    `Native asset: ${polygonProfile.chain?.nativeAsset || 'POL'}`,
    `Wallet support: ${(polygonProfile.chain?.walletSupport || []).join(', ')}`,
    `DEX focus: ${(polygonProfile.trading?.dexRouteFocus || []).join(', ')}`,
    `Deployment boundary: ${polygonProfile.tokenBuild?.deploymentBoundary || 'local only'}`
  ];
  const communityOpsItems = (communityOps.operatingRoles || []).map(role => `${role.label}: ${role.scope}`);
  const css = `:root {
  color-scheme: light;
  --ink: #172033;
  --muted: #5b6577;
  --line: #d7dce5;
  --surface: #ffffff;
  --accent: #0f766e;
  --accent-soft: #d9f3ee;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--ink);
  background: #f6f8fb;
  line-height: 1.5;
}

a {
  color: inherit;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px clamp(20px, 5vw, 72px);
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
}

.brand {
  font-weight: 800;
  text-decoration: none;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: var(--muted);
  font-size: 14px;
}

nav a {
  text-decoration: none;
}

.hero {
  padding: clamp(48px, 8vw, 92px) clamp(20px, 5vw, 72px) clamp(32px, 6vw, 60px);
  background: linear-gradient(120deg, #ffffff, #e9f7f4);
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--accent);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0;
}

h1 {
  max-width: 920px;
  margin: 0;
  font-size: clamp(36px, 7vw, 76px);
  line-height: 0.95;
  letter-spacing: 0;
}

.hero p:last-child {
  max-width: 760px;
  margin: 22px 0 0;
  color: var(--muted);
  font-size: 18px;
}

.content-section {
  max-width: 1040px;
  margin: 0 auto;
  padding: 38px 20px;
  border-bottom: 1px solid var(--line);
}

.content-section h2 {
  margin: 0 0 12px;
  font-size: 24px;
}

.content-section p,
.content-section li,
.site-footer {
  color: var(--muted);
}

.content-section ul {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.content-section li {
  min-height: 64px;
  padding: 14px;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
}

.site-footer {
  padding: 28px clamp(20px, 5vw, 72px);
  font-size: 13px;
}

@media (max-width: 720px) {
  .site-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
`;
  const packageManifest = {
    status: 'local_pages_package_only',
    generatedAt: new Date().toISOString(),
    projectId: project.id || null,
    projectName: tokenName,
    pagesProject,
    primaryDomain,
    primaryFqdn,
    customDomains,
    outputDirectory: 'website/dist',
    requiredOwnerSteps: [
      'Review generated static website files locally.',
      'Create or select the Cloudflare Pages project manually.',
      'Upload or connect the website/dist output directory after owner approval.',
      'Add custom domains in Cloudflare Pages.',
      'Add DNS records only after reviewing the local Cloudflare DNS plan.'
    ],
    safetyBoundary: {
      localOnly: true,
      cloudflareApiCallsEnabled: false,
      dnsMutationEnabled: false,
      deploymentEnabled: false,
      walletSigningEnabled: false,
      publicPostingEnabled: false
    }
  };

  return [
    {
      relativePath: 'website/dist/index.html',
      content: renderStaticTokenPage({
        tokenName,
        title: tokenName,
        subtitle: draftWebsite.hero || `Token website package planned for ${primaryFqdn}.`,
        nav,
        sections: [
          { title: 'Token Plan', body: draftWebsite.useCase || 'Local launch site generated from the Solidity Lab token ecosystem blueprint.', items: featureItems },
          { title: 'Tokenomics', body: draftWebsite.tokenomics || 'Tokenomics draft pending owner review.', items: splitDraftLines(pipeline.releasePlan, 'Release plan pending owner input') },
          { title: 'Polygon Operating Profile', body: 'Polygon-specific chain planning for low-fee token, dapp, trading, and listing evidence workflows when Polygon is selected.', items: polygonItems },
          { title: 'Roadmap', body: 'Milestones generated from the token website and whitepaper plan.', items: roadmapItems },
          { title: 'FAQ', body: 'Founder/operator FAQ draft.', items: splitDraftLines(draftWebsite.faq, 'FAQ pending owner input') },
          { title: 'How To Buy', body: draftWebsite.howToBuy || 'Official buy instructions stay draft-only until owner-approved deployment and liquidity creation.', items: ['No public contract address is published by this local package.', 'No listing submission or public posting has been performed.'] },
          { title: 'Listing Evidence', body: 'Evidence checklist for future owner-reviewed CoinMarketCap/CoinGecko readiness.', items: listingItems },
          { title: 'CMC/CoinGecko Application Path', body: 'Official-form-only application plan. No spam, fake activity, paid guarantees, or bypass behavior.', items: applicationItems },
          { title: 'Risk Disclaimer', body: draftWebsite.disclaimer || 'Risk/disclaimer copy pending owner review.', items: ['Draft only; not investment advice.', 'External actions require separate owner approval.'] }
        ]
      })
    },
    {
      relativePath: 'website/dist/whitepaper/index.html',
      content: renderStaticTokenPage({
        tokenName,
        title: `${tokenName} Whitepaper`,
        subtitle: 'Draft whitepaper page generated locally from the token ecosystem blueprint.',
        nav,
        currentPath: '/whitepaper/',
        sections: [
          { title: 'Whitepaper Draft', items: whitepaperItems },
          { title: 'Token Mechanics', items: plainTextList(whitepaper.draft?.tokenMechanics || [], 'Token mechanics pending owner input') },
          { title: 'Roadmap', items: roadmapItems }
        ]
      })
    },
    {
      relativePath: 'website/dist/app/index.html',
      content: renderStaticTokenPage({
        tokenName,
        title: `${tokenName} Dapp Shell`,
        subtitle: 'Local dapp shell placeholder. Wallet connection and live chain calls are intentionally disabled.',
        nav,
        currentPath: '/app/',
        sections: [
          { title: 'Disabled Live Boundary', items: ['No wallet signing.', 'No RPC broadcast.', 'No live token deployment.', 'No live trading orders.'] },
          { title: 'Future Modules', body: draftWebsite.dappPreview || pipeline.dappModules || 'Dapp preview pending owner input.', items: plainTextList(website.pages?.find(page => page.id === 'dapp')?.sections || [], 'Dapp modules pending owner input') }
        ]
      })
    },
    {
      relativePath: 'website/dist/community/index.html',
      content: renderStaticTokenPage({
        tokenName,
        title: `${tokenName} Community`,
        subtitle: 'Community and social launch page generated locally. Public posting remains owner-gated.',
        nav,
        currentPath: '/community/',
        sections: [
          { title: 'Social Channels', body: draftWebsite.communityLinks || 'Community links pending owner input.', items: communityDraftItems.concat(communityItems).slice(0, 12) },
          { title: 'Community Operations', items: communityOpsItems },
          { title: 'Launch Cadence', items: (social.launchCadence || []).flatMap(phase => (phase.outputs || []).map(output => `${phase.phase}: ${output}`)) },
          { title: 'Posting Boundary', items: ['Draft locally.', 'Review manually.', 'Connect official accounts only after owner approval.'] }
        ]
      })
    },
    {
      relativePath: 'website/dist/assets/site.css',
      content: css
    },
    {
      relativePath: 'website/dist/_headers',
      content: `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
`
    },
    {
      relativePath: 'website/dist/_redirects',
      content: `/whitepaper /whitepaper/ 301
/app /app/ 301
/community /community/ 301
`
    },
    {
      relativePath: 'website/dist/site.webmanifest',
      content: `${JSON.stringify({
        name: tokenName,
        short_name: tokenName.slice(0, 24),
        start_url: '/',
        display: 'standalone',
        background_color: '#f6f8fb',
        theme_color: '#0f766e'
      }, null, 2)}\n`
    },
    {
      relativePath: 'website/CLOUDFLARE_PAGES_PACKAGE.json',
      content: `${JSON.stringify(packageManifest, null, 2)}\n`
    },
    {
      relativePath: 'website/DEPLOY_PACKAGE_REVIEW.md',
      content: `# Website Deploy Package Review

Status: local package only

## Output Directory

\`website/dist\`

## Planned Cloudflare Pages Project

- Project: ${pagesProject}
- Primary domain: ${primaryFqdn}
- Custom domains: ${customDomains.join(', ')}

## Owner Review Checklist

${packageManifest.requiredOwnerSteps.map(step => `- [ ] ${step}`).join('\n')}

## Safety Boundary

- No Cloudflare API call was made.
- No DNS mutation was made.
- No deployment was performed.
- No wallet signing, social posting, or live trading was performed.
`
    }
  ];
}

function buildTokenEcosystemWorkspaceFiles(project = {}) {
  const blueprint = project.blueprint?.status ? project.blueprint : buildTokenEcosystemProjectBlueprint(project);
  const website = blueprint.website || {};
  const whitepaper = blueprint.whitepaper || {};
  const listing = blueprint.listingReadiness || {};
  const social = blueprint.socialCampaign || {};
  const logo = blueprint.logo || {};
  const multiChain = blueprint.multiChainTokenBuild || {};
  const polygonProfile = blueprint.polygonOperatingProfile || {};
  const applicationPlan = blueprint.listingApplicationPlan || listing.applicationPlan || {};
  const communityOps = blueprint.communityOperations || social.communityOperations || {};
  const tokenName = project.name || blueprint.contract?.name || 'Token Ecosystem Project';

  return [
    {
      relativePath: 'README.md',
      content: `# ${tokenName}

Local token ecosystem workspace generated by EtherealAI.

## Boundary

- Local planning and artifact generation only.
- No wallet private keys or deployment keys in this workspace.
- No social posting, listing submission, token deployment, or live trading from this workspace.

## Project

- Target chain: ${project.target_chain || project.targetChain || 'base'}
- Contract type: ${project.contract_type || project.contractType || 'erc20'}
- Status: ${project.status || 'draft'}

## Feature Selections

${markdownList(project.featureSelections || [])}
`
    },
    {
      relativePath: 'website/SITE_MAP.md',
      content: `# Website Creation Center

Template: ${website.template?.label || 'Token launch'}

${(website.pages || []).map(page => `## ${page.label}\n\n${markdownList(page.sections || [])}`).join('\n\n')}

## Roadmap

${(website.roadmap || []).map(item => `- ${item.phase}: ${item.title} - ${item.output}`).join('\n')}
`
    },
    {
      relativePath: 'website/CLOUDFLARE_DEPLOYMENT_PLAN.md',
      content: `# Cloudflare Website Deployment Plan

Status: local planning only

## Intended Cloudflare Use

- Host the generated token website/dapp shell through Cloudflare Pages or an owner-selected static host.
- Track planned DNS records in EtherealAI before any Cloudflare change.
- Preserve existing company email routing for patrick@etherealdigital.ai.

## Suggested Domains

- Primary site: project slug under the configured token website domain, currently etherealdigit.ai, or the root domain for the main EtherealAI token site.
- WWW companion: redirects or mirrors the primary site.
- App subdomain: dapp shell and holder dashboard.
- Docs subdomain: whitepaper, roadmap, and public documentation.

## Safety Boundary

- No Cloudflare password is stored here.
- No Cloudflare API token is stored here.
- No DNS mutation is performed by this workspace.
- Add custom domains in Cloudflare Pages before relying on CNAME records.
`
    },
    {
      relativePath: 'whitepaper/WHITEPAPER_DRAFT.md',
      content: `# ${whitepaper.draft?.title || `${tokenName} Whitepaper Draft`}

## Abstract

${whitepaper.draft?.abstract || 'Draft pending.'}

## Use Case

${whitepaper.draft?.useCase || 'Define use case.'}

## Token Mechanics

${markdownList(whitepaper.draft?.tokenMechanics || [])}

## Roadmap

${(whitepaper.draft?.roadmap || []).map(item => `- ${item.phase}: ${item.title} - ${item.output}`).join('\n')}

## Disclosures

${markdownList(whitepaper.draft?.disclosures || [])}
`
    },
    {
      relativePath: 'social/SOCIAL_LAUNCH_PLAN.md',
      content: `# Social Launch Bundle

Status: ${social.status || 'draft_only'}

## Channels

${(social.channels || []).map(channel => `- ${channel.label}: ${channel.purpose} Boundary: ${channel.automationBoundary}`).join('\n')}

## Launch Cadence

${(social.launchCadence || []).map(phase => `## ${phase.phase}\n\n${markdownList(phase.outputs || [])}`).join('\n\n')}

## Community Operations

${(communityOps.operatingRoles || []).map(role => `- ${role.label}: ${role.scope} Boundary: ${role.automationBoundary}`).join('\n')}

## Listing Growth Rules

${markdownList(social.listingGrowthRules || [])}
`
    },
    {
      relativePath: 'community/COMMUNITY_OPERATIONS_RUNBOOK.md',
      content: `# Community Operations Runbook

Status: ${communityOps.status || 'draft_only_no_external_account_control'}

## Operating Roles

${(communityOps.operatingRoles || []).map(role => `- ${role.label}: ${role.scope} Boundary: ${role.automationBoundary}`).join('\n')}

## Stage Playbooks

${(communityOps.stagePlaybooks || []).map(stage => `## ${stage.stage}\n\n${markdownList(stage.actions || [])}`).join('\n\n')}

## Moderation Rules

${markdownList(communityOps.moderationRules || [])}

## Announcement Controls

${markdownList(communityOps.announcementControls || [])}
`
    },
    {
      relativePath: 'listing/LISTING_EVIDENCE_PACKET.md',
      content: `# Listing Evidence Packet

Status: ${listing.status || 'evidence_required'}

## Checklist

${(listing.checklist || []).map(item => `- [ ] ${item.label} (${item.status}): ${item.evidence}`).join('\n')}

## Sources

${(listing.sources || []).map(source => `- ${source.platform}: ${source.title} - ${source.url}`).join('\n')}
`
    },
    {
      relativePath: 'listing/CMC_CG_APPLICATION_PLAN.md',
      content: `# CoinMarketCap / CoinGecko Application Plan

Status: ${applicationPlan.status || 'owner_review_required'}

## Official Sources

${(applicationPlan.officialSources || LISTING_SOURCES).map(source => `- ${source.platform}: ${source.title} - ${source.url}`).join('\n')}

## Phases

${(applicationPlan.phases || []).map(phase => `- ${phase.label}: ${phase.output}`).join('\n')}

## Platform Packets

${(applicationPlan.platformPackets || []).map(packet => `## ${packet.platform}\n\nRequest path: ${packet.requestPath}\n\nOwner submission: ${packet.ownerSubmissionPath}\n\n${markdownList(packet.evidence || [])}`).join('\n\n')}

## Prohibited Shortcuts

${markdownList(applicationPlan.prohibitedShortcuts || [])}
`
    },
    {
      relativePath: 'polygon/POLYGON_OPERATING_PROFILE.md',
      content: `# Polygon Operating Profile

Status: ${polygonProfile.status || 'available_polygon_lane'}

## Chain

- Name: ${polygonProfile.chain?.name || 'Polygon'}
- Chain ID: ${polygonProfile.chain?.chainId || 137}
- Native asset: ${polygonProfile.chain?.nativeAsset || 'POL'}
- Family: ${polygonProfile.chain?.family || 'evm-sidechain-l2'}
- Gas profile: ${polygonProfile.chain?.gasProfile || 'low'}

## Token Build

- Standards: ${(polygonProfile.tokenBuild?.standards || ['ERC20', 'ERC721', 'ERC1155']).join(', ')}
- Tooling: ${(polygonProfile.tokenBuild?.tooling || ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry']).join(', ')}
- Local scaffold: ${polygonProfile.tokenBuild?.localScaffold || 'Solidity + OpenZeppelin + Hardhat local workspace'}
- Deployment boundary: ${polygonProfile.tokenBuild?.deploymentBoundary || 'local scaffold and review only'}

## Trading And Arbitrage Planning

${markdownList(polygonProfile.trading?.supportedPlanningModes || [])}

## DEX Route Focus

${markdownList(polygonProfile.trading?.dexRouteFocus || [])}

## Required Before Live Trading

${markdownList(polygonProfile.trading?.requiredBeforeLiveTrading || [])}

## Listing Evidence

${(polygonProfile.listingEvidence || []).map(item => `- [ ] ${item.item}: ${item.status}`).join('\n')}

## Wallet Ops

- Network label: ${polygonProfile.walletOps?.networkLabel || 'polygon'}
- Isolation rule: ${polygonProfile.walletOps?.isolationRule || 'Use separate labeled wallets and keep seeds outside EtherealAI.'}
`
    },
    {
      relativePath: 'tokenomics/TOKENOMICS_AND_NFT_UTILITY.md',
      content: `# Tokenomics And NFT Utility

## Multi-Chain Build

- Selected chain: ${multiChain.selectedChain?.name || 'Base'}
- Standard: ${multiChain.standardPlan?.primaryStandard || 'ERC20'}
- Starter scaffold: ${multiChain.standardPlan?.starterScaffold || 'Local scaffold pending'}

## Feature Matrix

${(blueprint.tokenFeatureMatrix || []).map(row => `- ${row.label}: ${row.recommendation}`).join('\n')}

## NFT Utility Designer

- Status: ${blueprint.nftUtilityDesigner?.status || 'available'}
- Formula: ${blueprint.nftUtilityDesigner?.formula || 'pending'}

${markdownList(blueprint.nftUtilityDesigner?.upgradeAxes || [])}
`
    },
    {
      relativePath: 'brand/LOGO_BRIEF.md',
      content: `# Logo Creation Brief

## Prompts

${markdownList(logo.prompts || [])}

## Deliverables

${markdownList(logo.deliverables || [])}

## Checks

${markdownList(logo.checks || [])}
`
    },
    {
      relativePath: 'automation/CROSS_CHAIN_ARBITRAGE_DESIGN.md',
      content: `# Cross-Chain Arbitrage Design

Status: ${blueprint.crossChainArbitrage?.status || 'design_only_no_live_orders'}

## Objective

${blueprint.crossChainArbitrage?.objective || 'Design only.'}

## Modules

${markdownList(blueprint.crossChainArbitrage?.modules || [])}

## Required Safety Gates

${markdownList(blueprint.crossChainArbitrage?.requiredSafetyGates || [])}
`
    }
  ];
}

module.exports = {
  LISTING_SOURCES,
  SOCIAL_CHANNELS,
  CHAIN_CATALOG,
  WHITEPAPER_TEMPLATES,
  WEBSITE_TEMPLATES,
  LOW_FEE_LAUNCH_CHAIN_IDS,
  DEFAULT_TOKEN_FEATURE_SELECTIONS,
  detectFeatureFlags,
  normalizeChainId,
  getChainOption,
  getRecommendedLowFeeChains,
  getTokenStandardPlan,
  buildMultiChainTokenBuildPlan,
  buildTokenFeatureMatrix,
  buildNftUtilityDesigner,
  buildRoadmap,
  buildWhitepaperDraft,
  buildWebsiteBlueprint,
  buildLogoBrief,
  buildPolygonOperatingProfile,
  buildListingReadiness,
  buildCompliantListingApplicationPlan,
  buildChainBuilderPlan,
  buildNodeResearchPlan,
  buildCrossChainArbitrageArchitecture,
  buildSocialCampaignPlan,
  buildCommunityOperationsPlan,
  buildTokenEcosystemCatalog,
  buildTokenEcosystemBlueprint,
  normalizeTokenEcosystemProjectInput,
  buildTokenEcosystemProjectSpec,
  buildTokenEcosystemProjectBlueprint,
  TOKEN_LAUNCH_PIPELINE_STEPS,
  buildTokenLaunchPipelineState,
  buildTokenLaunchPackageReview,
  buildTokenEcosystemWorkspaceFiles,
  buildTokenWebsiteDeployPackageFiles,
  parseTokenEcosystemProject
};
