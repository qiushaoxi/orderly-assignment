const hardhat = require('hardhat');
const { ethers } = hardhat;
const fs = require('fs');

async function main() {
    const amount = "10000000000000000000"
    const [owner] = await ethers.getSigners();
    const deployments = JSON.parse(fs.readFileSync('./deployments.json'));

    const MyToken = await ethers.getContractFactory('MyToken');
    const SimpleAMM = await ethers.getContractFactory('SimpleAMM');

    const tokenA = MyToken.attach(deployments["tokenA"].address);
    const tokenB = MyToken.attach(deployments["tokenB"].address);
    const amm = SimpleAMM.attach(deployments["amm"].address);

    let tx = await tokenA.mint(owner.address, amount)
    await tx.wait();
    tx = await tokenA.approve(amm.address, amount)
    await tx.wait();

    tx = await tokenB.mint(owner.address, amount)
    await tx.wait();
    tx = await tokenB.approve(amm.address, amount)
    await tx.wait();

    tx = await amm.init("1000000", "2000000")
    await tx.wait();

    tx = await amm.deposit(tokenA.address, "10000")
    await tx.wait();
    tx = await amm.withdraw(tokenB.address, "10000")
    await tx.wait();

    tx = await amm.swap(tokenA.address, "10000")
    await tx.wait();
    tx = await amm.swap(tokenB.address, "10000")
    await tx.wait();


}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
