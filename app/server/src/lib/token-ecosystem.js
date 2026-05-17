const LISTING_SOURCES = [
  {
    platform: 'CoinMarketCap',
    title: 'Listings Criteria',
    url: 'https://support.coinmarketcap.com/hc/en-us/articles/360043659351-Listings-Criteria',
    summary: 'Tracked-listing review emphasizes a functional website, block explorer, active public trading with material volume on a tracked exchange, a project representative, credible evidence, truthful submissions, and no spam or bribery.'
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
    summary: 'CoinGecko lists criteria such as a working project-owned website, block explorer, at least one active integrated exchange, clear circulating-supply communication, and warns that listings are not guaranteed.'
  }
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
    gasProfile: 'low',
    launchFit: 'recommended_low_fee_evm',
    fit: 'Low fees, broad wallet support, and many retail/community token projects.',
    tokenStandards: ['ERC20', 'ERC721', 'ERC1155'],
    tooling: ['Solidity', 'OpenZeppelin', 'Hardhat', 'Foundry'],
    crossChainNotes: 'Good for NFT-heavy experiments and low-cost community utilities.'
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
  'near'
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
    ['eth', 'ethereum'],
    ['sol', 'solana'],
    ['fantom', 'fantom-sonic'],
    ['sonic', 'fantom-sonic'],
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
  const isNft = type === 'erc721' || type === 'erc1155';

  if (chain.family.startsWith('evm')) {
    return {
      implementationLane: 'evm_solidity',
      primaryStandard: isNft ? 'ERC721/ERC1155' : chain.id === 'bnb-chain' ? 'BEP20-compatible ERC20' : 'ERC20',
      starterScaffold: 'Solidity + OpenZeppelin + Hardhat local workspace',
      notes: 'Base, Polygon, BNB Chain, Avalanche, Arbitrum, Optimism, and most EVM chains can share the same Solidity contract with chain-specific deployment config added later.'
    };
  }

  if (chain.family === 'solana') {
    return {
      implementationLane: 'solana_spl',
      primaryStandard: isNft ? 'Metaplex NFT / compressed NFT plan' : 'SPL Token or Token-2022',
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
      primaryStandard: isNft ? 'TRC721' : 'TRC20',
      starterScaffold: 'TRON Solidity-style contract and TronWeb/TronBox local plan',
      notes: 'TRON is Solidity-like but has different tooling, wallet, resource, and explorer assumptions.'
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

function buildLogoBrief(spec = {}) {
  const tokenName = spec.name || 'Token Project';

  return {
    title: `${tokenName} Logo Brief`,
    prompts: [
      `Premium crypto token logo for ${tokenName}, scalable vector-style mark, readable at app-icon size, no text-only lockup.`,
      `Ecosystem token identity for ${tokenName}, symbol-first, modern blockchain utility, trustworthy but distinctive.`,
      `NFT-compatible emblem for ${tokenName}, works as a token icon, Discord avatar, website favicon, and marketplace collection badge.`
    ],
    deliverables: ['square icon', 'transparent PNG', 'dark background variant', 'light background variant', 'favicon', 'social avatar'],
    checks: ['legible at 32px', 'unique enough for listing pages', 'does not imitate existing coin logos', 'works without tiny text']
  };
}

function buildListingReadiness(spec = {}) {
  return {
    status: 'evidence_required',
    sources: LISTING_SOURCES,
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
    ]
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

  return {
    status: 'draft_only',
    tokenName,
    channels: SOCIAL_CHANNELS,
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
    ]
  };
}

function buildTokenEcosystemCatalog() {
  return {
    chains: CHAIN_CATALOG,
    recommendedLowFeeChains: getRecommendedLowFeeChains(),
    socialChannels: SOCIAL_CHANNELS,
    whitepaperTemplates: WHITEPAPER_TEMPLATES,
    websiteTemplates: WEBSITE_TEMPLATES,
    listingSources: LISTING_SOURCES,
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

module.exports = {
  LISTING_SOURCES,
  SOCIAL_CHANNELS,
  CHAIN_CATALOG,
  WHITEPAPER_TEMPLATES,
  WEBSITE_TEMPLATES,
  LOW_FEE_LAUNCH_CHAIN_IDS,
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
  buildListingReadiness,
  buildChainBuilderPlan,
  buildNodeResearchPlan,
  buildCrossChainArbitrageArchitecture,
  buildSocialCampaignPlan,
  buildTokenEcosystemCatalog,
  buildTokenEcosystemBlueprint
};
