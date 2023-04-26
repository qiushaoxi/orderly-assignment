// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require('fs');

async function main() {

  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const tokenA = await MyToken.deploy("TokenA");
  const tokenB = await MyToken.deploy("TokenB");
  await tokenA.deployed();
  await tokenB.deployed();

  const SimpleAMM = await hre.ethers.getContractFactory("SimpleAMM");
  const amm = await SimpleAMM.deploy(tokenA.address, tokenB.address);
  await amm.deployed();

  const deployments = {
    tokenA: { address: tokenA.address, constructorArguments: ["TokenA"] },
    tokenB: { address: tokenB.address, constructorArguments: ["TokenB"] },
    amm: {
      address: amm.address, constructorArguments: [tokenA.address, tokenB.address]
    }
  }

  console.log(deployments);

  fs.writeFileSync('./deployments.json', JSON.stringify(deployments, null, 2));



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
