const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("EtherealUtilityToken");
  const contract = await factory.deploy(owner.address, ethers.parseEther("1000000"));

  await contract.waitForDeployment();
  console.log("EtherealUtilityToken deployed locally to:", await contract.getAddress());
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
