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
  const header = [
    '// SPDX-License-Identifier: MIT',
    `pragma solidity ^${version};`,
    '',
    `// Draft only. Review, test, and audit before any deployment.`,
    features ? `// Requested features: ${features.replace(/\r?\n/g, ' ')}` : ''
  ].filter(Boolean).join('\n');

  if (spec.contract_type === 'erc20') {
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

  if (spec.contract_type === 'erc721') {
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
  const deployArgs = spec.contract_type === 'erc20'
    ? 'owner.address, ethers.parseEther("1000000")'
    : spec.contract_type === 'erc721'
      ? 'owner.address'
      : '';
  const ownerExpectation = spec.contract_type === 'generic'
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

  if (spec.contract_type === 'erc20') {
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

  if (spec.contract_type === 'erc721') {
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
  parseSolidityContractSpec,
  buildSolidityStarter,
  buildSolidityProjectFiles,
  reviewSoliditySource
};
