const fs = require('fs');
const hardhat = require('hardhat');

async function main() {
    const deployments = JSON.parse(fs.readFileSync('./deployments.json'));

    for (const key in deployments) {
        const { address, constructorArguments } = deployments[key]
        console.log({
            address, constructorArguments
        })
        await hardhat.run('verify:verify', {
            address,
            constructorArguments
        });

    }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});