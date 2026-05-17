// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// Draft only. Review, test, and audit before any deployment.
// Requested features: mint initial supply to owner; keep ownership explicit

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EtherealUtilityToken is ERC20, Ownable {
    constructor(address initialOwner, uint256 initialSupply)
        ERC20("Ethereal Utility Token", "ETHEREAL")
        Ownable(initialOwner)
    {
        _mint(initialOwner, initialSupply);
    }
}
