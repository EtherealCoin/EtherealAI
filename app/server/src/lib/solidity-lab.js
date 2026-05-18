function slugifyPackageName(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function toSolidityIdentifier(value, fallback = 'LocalContract') {
  const cleaned = String(value || '')
    .replace(/[^a-zA-Z0-9_ ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const identifier = cleaned || fallback;

  return /^[0-9]/.test(identifier) ? `${fallback}${identifier}` : identifier;
}

function toSolidityStringLiteral(value) {
  return JSON.stringify(String(value || ''));
}

const SOLIDITY_FUNGIBLE_TYPES = new Set(['erc20', 'bep20', 'trc20']);
const SOLIDITY_NFT_TYPES = new Set(['erc721', 'trc721']);
const SOLIDITY_MULTI_TOKEN_TYPES = new Set(['erc1155']);

function isSolidityLikeContractType(type = '') {
  const normalized = String(type || '').toLowerCase();

  return SOLIDITY_FUNGIBLE_TYPES.has(normalized)
    || SOLIDITY_NFT_TYPES.has(normalized)
    || SOLIDITY_MULTI_TOKEN_TYPES.has(normalized)
    || normalized === 'generic';
}

function getTokenTypeLabel(type = '') {
  const labels = {
    erc20: 'ERC20 / EVM fungible token',
    bep20: 'BEP20 / BNB-compatible token',
    erc721: 'ERC721 / EVM NFT',
    erc1155: 'ERC1155 / EVM multi-token',
    'spl-token': 'Solana SPL Token',
    'token-2022': 'Solana Token-2022',
    'metaplex-nft': 'Solana Metaplex NFT',
    trc20: 'TRC20 token',
    trc721: 'TRC721 NFT',
    'move-coin': 'Move coin/resource token',
    'move-nft': 'Move object/digital asset NFT',
    cw20: 'CosmWasm CW20 token',
    cw721: 'CosmWasm CW721 NFT',
    'native-denom': 'Cosmos native denom',
    psp22: 'Substrate PSP22 / pallet asset',
    psp34: 'Substrate PSP34 / NFT',
    nep141: 'NEAR NEP-141 token',
    nep171: 'NEAR NEP-171 NFT',
    'cardano-native-asset': 'Cardano native asset',
    'algorand-asa': 'Algorand ASA',
    'stellar-asset': 'Stellar issued asset',
    'xrp-issued-currency': 'XRP Ledger issued currency',
    'hedera-hts': 'Hedera Token Service asset',
    'tezos-fa2': 'Tezos FA1.2 / FA2',
    'flow-ft': 'Flow fungible token',
    'ton-jetton': 'TON Jetton',
    'bitcoin-rune': 'Bitcoin Rune / BRC-20 plan',
    generic: 'generic / chain-specific contract'
  };

  return labels[String(type || '').toLowerCase()] || String(type || 'chain-specific token');
}

function parseSolidityContractSpec(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    contract_type: row.contract_type,
    network: row.network,
    solidity_version: row.solidity_version,
    features: row.features,
    risk_notes: row.risk_notes,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function buildSolidityStarter(spec) {
  const contractName = toSolidityIdentifier(spec.name);
  const version = String(spec.solidity_version || '0.8.24').replace(/[^\d.]/g, '') || '0.8.24';
  const features = String(spec.features || '').trim();
  const tokenSymbol = contractName.slice(0, 8).toUpperCase();
  const contractType = String(spec.contract_type || 'generic').toLowerCase();

  if (!isSolidityLikeContractType(contractType)) {
    return `# ${spec.name} Local Token Scaffold Plan

Draft only. This is a chain-specific token plan, not a Solidity contract.

- Token standard: ${getTokenTypeLabel(contractType)}
- Target blockchain: ${spec.network || 'custom-chain'}
- Requested features: ${features || 'Define token utility, supply, roles, and wallet/explorer requirements.'}

## Local Build Requirements

1. Confirm the chain standard and official tooling.
2. Create a local/testnet-only token scaffold.
3. Add unit or framework-native tests.
4. Document issuer/admin/update roles.
5. Add block explorer, wallet, RPC, and listing evidence requirements.
6. Keep private keys, wallet mnemonics, API keys, and deploy keys outside EtherealAI.

## Live Boundary

No mainnet, testnet, devnet, wallet signing, liquidity creation, or listing submission is enabled from this scaffold.
`;
  }
  const header = [
    '// SPDX-License-Identifier: MIT',
    `pragma solidity ^${version};`,
    '',
    `// Draft only. Review, test, and audit before any deployment.`,
    features ? `// Requested features: ${features.replace(/\r?\n/g, ' ')}` : ''
  ].filter(Boolean).join('\n');

  if (SOLIDITY_FUNGIBLE_TYPES.has(contractType)) {
    return `${header}

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${contractName} is ERC20, Ownable {
    constructor(address initialOwner, uint256 initialSupply)
        ERC20(${toSolidityStringLiteral(spec.name)}, ${toSolidityStringLiteral(tokenSymbol)})
        Ownable(initialOwner)
    {
        _mint(initialOwner, initialSupply);
    }
}
`;
  }

  if (SOLIDITY_NFT_TYPES.has(contractType)) {
    return `${header}

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${contractName} is ERC721, Ownable {
    uint256 private nextTokenId;

    constructor(address initialOwner)
        ERC721(${toSolidityStringLiteral(spec.name)}, ${toSolidityStringLiteral(tokenSymbol)})
        Ownable(initialOwner)
    {}

    function safeMint(address to) external onlyOwner returns (uint256 tokenId) {
        tokenId = nextTokenId;
        nextTokenId += 1;
        _safeMint(to, tokenId);
    }
}
`;
  }

  if (SOLIDITY_MULTI_TOKEN_TYPES.has(contractType)) {
    return `${header}

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${contractName} is ERC1155, Ownable {
    constructor(address initialOwner, string memory baseUri)
        ERC1155(baseUri)
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 id, uint256 amount, bytes calldata data) external onlyOwner {
        _mint(to, id, amount, data);
    }
}
`;
  }

  return `${header}

contract ${contractName} {
    address public owner;

    event OwnerChanged(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }
}
`;
}

function buildSolidityProjectFiles(spec) {
  const contractName = toSolidityIdentifier(spec.name);
  const contractFile = `contracts/${contractName}.sol`;
  const source = buildSolidityStarter(spec);
  const packageName = slugifyPackageName(spec.name) || 'local-solidity-project';
  const contractType = String(spec.contract_type || 'generic').toLowerCase();

  if (!isSolidityLikeContractType(contractType)) {
    return [
      {
        relativePath: 'README.md',
        content: `# ${spec.name}

Local chain-specific token workspace generated from Solidity Lab spec #${spec.id}.

## Token Target

- Token standard: ${getTokenTypeLabel(contractType)}
- Target blockchain: ${spec.network}
- Solidity version field: ${spec.solidity_version} (kept for EVM compatibility; this lane may not use Solidity)

## Required Before Any Live Phase

- Confirm official chain docs and token standard.
- Create local/testnet-only scaffold with the chain's official tooling.
- Add framework-native tests.
- Document issuer/admin/update roles.
- Document explorer, wallet, RPC, indexer, and listing evidence.
- Do not put wallet private keys, seed phrases, API keys, deploy keys, or exchange keys in this folder.
`
      },
      {
        relativePath: 'TOKEN_STANDARD_PLAN.md',
        content: source
      },
      {
        relativePath: 'LOCAL_TEST_PLAN.md',
        content: `# Local Test Plan

1. Install official tooling for ${spec.network}.
2. Run a local simulator, localnet, emulator, or official test framework.
3. Create the token/mint/asset only in local or test mode.
4. Verify supply, issuer/admin roles, metadata, transfer rules, freeze/pause rules, and explorer/indexer visibility.
5. Record evidence before any future deployment approval.

Live deployment remains disabled.
`
      },
      {
        relativePath: '.gitignore',
        content: `.env
.env.*
node_modules/
target/
build/
dist/
`
      }
    ];
  }

  const deployArgs = SOLIDITY_FUNGIBLE_TYPES.has(contractType)
    ? 'owner.address, ethers.parseEther("1000000")'
    : SOLIDITY_NFT_TYPES.has(contractType)
      ? 'owner.address'
      : SOLIDITY_MULTI_TOKEN_TYPES.has(contractType)
        ? 'owner.address, "ipfs://local-placeholder/{id}.json"'
      : '';
  const ownerExpectation = contractType === 'generic'
    ? 'expect(await contract.owner()).to.equal(owner.address);'
    : 'expect(await contract.owner()).to.equal(owner.address);';

  return [
    {
      relativePath: 'README.md',
      content: `# ${spec.name}

Local Solidity workspace generated from Solidity Lab spec #${spec.id}.

## Commands

\`\`\`bash
npm install
npm test
npm run compile
\`\`\`

## Contract

- Type: ${spec.contract_type}
- Network target: ${spec.network}
- Solidity: ${spec.solidity_version}
- Source: \`${contractFile}\`

## Notes

- Draft only. Test and audit before deployment.
- Do not put wallet private keys or deploy keys in this folder.
- Mainnet deployment should require a separate manual approval flow.
`
    },
    {
      relativePath: 'package.json',
      content: `{
  "name": "${packageName}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "deploy:local": "hardhat run scripts/deploy-local.js --network hardhat"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "@openzeppelin/contracts": "^5.0.2",
    "hardhat": "^2.22.0"
  }
}
`
    },
    {
      relativePath: 'hardhat.config.js',
      content: `require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "${spec.solidity_version || '0.8.24'}",
  networks: {
    hardhat: {}
  }
};
`
    },
    {
      relativePath: contractFile,
      content: source
    },
    {
      relativePath: 'test/contract.test.js',
      content: `const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("${contractName}", function () {
  it("deploys locally", async function () {
    const [owner] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("${contractName}");
    const contract = await factory.deploy(${deployArgs});

    await contract.waitForDeployment();

    ${ownerExpectation}
  });
});
`
    },
    {
      relativePath: 'scripts/deploy-local.js',
      content: `const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("${contractName}");
  const contract = await factory.deploy(${deployArgs});

  await contract.waitForDeployment();
  console.log("${contractName} deployed locally to:", await contract.getAddress());
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
`
    },
    {
      relativePath: '.gitignore',
      content: `node_modules/
cache/
artifacts/
.env
.env.*
`
    }
  ];
}

function reviewSoliditySource(spec, source) {
  if (!isSolidityLikeContractType(spec.contract_type)) {
    const checks = [
      {
        id: 'chain_specific_plan',
        label: 'Chain-specific token plan generated',
        passed: /Local Token Scaffold Plan/i.test(source)
      },
      {
        id: 'no_secret_markers',
        label: 'No embedded credential values',
        passed: !/(-----BEGIN|sk-[a-z0-9]{20,}|xprv|mnemonic:\s*\S|seed phrase:\s*\S)/i.test(source)
      },
      {
        id: 'live_boundary',
        label: 'Live deployment boundary is explicit',
        passed: /No mainnet|Live Boundary|wallet signing/i.test(source)
      }
    ];
    const failed = checks.filter(check => !check.passed);

    return {
      status: failed.length ? 'review' : 'planning',
      checks,
      failures: failed.map(check => check.id),
      note: 'Non-EVM planning review only. Generate the chain-specific scaffold, tests, and official-tooling workflow before any deployment phase.'
    };
  }

  const checks = [
    {
      id: 'spdx',
      label: 'SPDX license identifier',
      passed: /SPDX-License-Identifier:/i.test(source)
    },
    {
      id: 'pragma',
      label: 'Solidity pragma',
      passed: /pragma solidity \^?0\.8\./i.test(source)
    },
    {
      id: 'no_secret_markers',
      label: 'No obvious secret markers',
      passed: !/(private[_-]?key|seed phrase|mnemonic|api[_-]?key)/i.test(source)
    },
    {
      id: 'ownership',
      label: 'Ownership or owner state is explicit',
      passed: /Ownable|owner/i.test(source)
    },
    {
      id: 'constructor',
      label: 'Constructor is present',
      passed: /constructor\s*\(/i.test(source)
    }
  ];

  if (SOLIDITY_FUNGIBLE_TYPES.has(String(spec.contract_type || '').toLowerCase())) {
    checks.push({
      id: 'erc20_import',
      label: 'ERC20 import is present',
      passed: /token\/ERC20\/ERC20\.sol/i.test(source)
    });
    checks.push({
      id: 'initial_supply',
      label: 'Initial supply mint is explicit',
      passed: /_mint\s*\(/i.test(source)
    });
  }

  if (SOLIDITY_NFT_TYPES.has(String(spec.contract_type || '').toLowerCase())) {
    checks.push({
      id: 'erc721_import',
      label: 'ERC721 import is present',
      passed: /token\/ERC721\/ERC721\.sol/i.test(source)
    });
  }

  const failed = checks.filter(check => !check.passed);

  return {
    status: failed.length ? 'review' : 'pass',
    checks,
    failures: failed.map(check => check.id),
    note: 'Template review only. Compile, test, static analysis, and audit are still required.'
  };
}

module.exports = {
  toSolidityIdentifier,
  toSolidityStringLiteral,
  isSolidityLikeContractType,
  getTokenTypeLabel,
  parseSolidityContractSpec,
  buildSolidityStarter,
  buildSolidityProjectFiles,
  reviewSoliditySource
};
