const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EtherealUtilityToken", function () {
  it("deploys locally", async function () {
    const [owner] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EtherealUtilityToken");
    const contract = await factory.deploy(owner.address, ethers.parseEther("1000000"));

    await contract.waitForDeployment();

    expect(await contract.owner()).to.equal(owner.address);
  });
});
