const chai = require('chai');
const { ethers } = require('hardhat');
const BigNumber = require('bignumber.js');
const { expect } = chai;

describe('SimpleAMM', function () {
    let tokenA, tokenB, amm
    let owner;

    // `beforeEach` will run before each test, re-deploying the contract every
    // time. It receives a callback, which can be async.
    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        const MyToken = await ethers.getContractFactory('MyToken');
        tokenA = await MyToken.deploy("TokenA");
        tokenB = await MyToken.deploy("TokenB");
        await tokenA.deployed();
        await tokenB.deployed();
        await tokenA.mint(owner.address, "100000000000000000000");
        await tokenB.mint(owner.address, "100000000000000000000");

        const SimpleAMM = await ethers.getContractFactory('SimpleAMM');
        amm = await SimpleAMM.deploy(tokenA.address, tokenB.address)
        await amm.deployed();

        await tokenA.approve(amm.address, "100000000000000000000");
        await tokenB.approve(amm.address, "100000000000000000000");
        await amm.init(100000, 25000);


    });

    describe('Deposit', function () {

        for (const amount of [10, 100, 1000, 2000]) {

            it(`TokenA:${amount}`, async () => {
                const oldTokenBalance = await tokenA.balanceOf(owner.address)
                const oldSupply = await amm.totalSupply();
                const [reserveA, reserveB] = await amm.getTokenReserves();

                const oldLpBalance = await amm.balanceOf(owner.address)

                await amm.deposit(tokenA.address, amount);

                let [newReserveA, newReserveB] = await amm.getTokenReserves();
                expect(newReserveB).to.equals(reserveB)
                expect(newReserveA).to.equals(reserveA.add(amount))

                const newSupplyToBe = new BigNumber(newReserveA.mul(reserveB).toString()).sqrt()
                const newSupply = await amm.totalSupply();

                // check lp token supply increase rightly
                expect(newSupply.toString()).to.equals(newSupplyToBe.integerValue(BigNumber.ROUND_DOWN))

                const newLpBalance = await amm.balanceOf(owner.address)
                // check user lp token balance is right
                expect(newSupply.sub(oldSupply).toString()).to.equals(newLpBalance.sub(oldLpBalance).toString())

                const newTokenBalance = await tokenA.balanceOf(owner.address)
                expect(newTokenBalance.add(amount).toString()).to.equals(oldTokenBalance.toString())

            });

            it(`TokenB:${amount}`, async () => {
                const oldTokenBalance = await tokenB.balanceOf(owner.address)
                const oldSupply = await amm.totalSupply();
                const [reserveA, reserveB] = await amm.getTokenReserves();

                const oldLpBalance = await amm.balanceOf(owner.address)

                await amm.deposit(tokenB.address, amount);

                let [newReserveA, newReserveB] = await amm.getTokenReserves();
                expect(newReserveA).to.equals(reserveA)
                expect(newReserveB).to.equals(reserveB.add(amount))

                const newSupplyToBe = new BigNumber(newReserveB.mul(reserveA).toString()).sqrt()
                const newSupply = await amm.totalSupply();

                // check lp token supply increase rightly
                expect(newSupply.toString()).to.equals(newSupplyToBe.integerValue(BigNumber.ROUND_DOWN))

                const newLpBalance = await amm.balanceOf(owner.address)
                // check user lp token balance is right
                expect(newSupply.sub(oldSupply).toString()).to.equals(newLpBalance.sub(oldLpBalance).toString())

                const newTokenBalance = await tokenB.balanceOf(owner.address)
                expect(newTokenBalance.add(amount).toString()).to.equals(oldTokenBalance.toString())

            });
        }

    });


    describe('Withdraw', function () {
        for (const lpAmount of [10, 100, 1000, 2000]) {
            it(`TokenA:${lpAmount}`, async () => {
                const oldTokenBalance = await tokenA.balanceOf(owner.address)
                const oldSupply = await amm.totalSupply();
                const [reserveA, reserveB] = await amm.getTokenReserves();

                const oldLpBalance = await amm.balanceOf(owner.address)

                await amm.withdraw(tokenA.address, lpAmount);

                let [newReserveA, newReserveB] = await amm.getTokenReserves();

                const newSupply = await amm.totalSupply();

                // // check lp token supply increase rightly
                expect(newSupply.toString()).to.equals(oldSupply.sub(lpAmount).toString())

                // check tokenA withdraw amount
                const amount = reserveA.sub(newSupply.mul(newSupply).div(reserveB)).mul(997).div(1000)
                expect(newReserveB).to.equals(reserveB)
                expect(amount).to.equals(reserveA.sub(newReserveA))

                const newLpBalance = await amm.balanceOf(owner.address)
                // // check user lp token balance is right
                expect(oldLpBalance.sub(newLpBalance)).to.equals(lpAmount)

                const newTokenBalance = await tokenA.balanceOf(owner.address)
                expect(newTokenBalance.sub(amount)).to.equals(oldTokenBalance)
            });

            it(`TokenB:${lpAmount}`, async () => {
                const oldTokenBalance = await tokenB.balanceOf(owner.address)
                const oldSupply = await amm.totalSupply();
                const [reserveA, reserveB] = await amm.getTokenReserves();

                const oldLpBalance = await amm.balanceOf(owner.address)

                await amm.withdraw(tokenB.address, lpAmount);

                let [newReserveA, newReserveB] = await amm.getTokenReserves();

                const newSupply = await amm.totalSupply();

                // // check lp token supply increase rightly
                expect(newSupply.toString()).to.equals(oldSupply.sub(lpAmount).toString())

                // check token withdraw amount
                const amount = reserveB.sub(newSupply.mul(newSupply).div(reserveA)).mul(997).div(1000)
                expect(newReserveA).to.equals(reserveA)
                expect(amount).to.equals(reserveB.sub(newReserveB))

                const newLpBalance = await amm.balanceOf(owner.address)
                // // check user lp token balance is right
                expect(oldLpBalance.sub(newLpBalance)).to.equals(lpAmount)

                const newTokenBalance = await tokenB.balanceOf(owner.address)
                expect(newTokenBalance.sub(amount)).to.equals(oldTokenBalance)
            });
        }
    });

    describe('Swap', function () {
        for (const amount of [10, 100, 1000, 2000]) {
            it(`TokenA:${amount}`, async () => {
                const oldTokenABalance = await tokenA.balanceOf(owner.address)
                const oldTokenBBalance = await tokenB.balanceOf(owner.address)
                const [reserveA, reserveB] = await amm.getTokenReserves();

                await amm.swap(tokenA.address, amount);

                let [newReserveA, newReserveB] = await amm.getTokenReserves();

                const inputAmountWithFee = ethers.BigNumber.from(amount.toString()).mul(997)
                const numerator = inputAmountWithFee.mul(reserveB)
                const denominator = reserveA.mul(1000).add(inputAmountWithFee)
                const outAmount = numerator.div(denominator)

                const newReserveAtoBe = reserveA.add(amount)
                const newReserveBtoBe = reserveB.sub(outAmount)

                expect(newReserveAtoBe).to.equals(newReserveA)
                expect(newReserveBtoBe).to.equals(newReserveB)

                const newTokenABalance = await tokenA.balanceOf(owner.address)
                const newTokenBBalance = await tokenB.balanceOf(owner.address)

                expect(oldTokenABalance.sub(amount)).to.equals(newTokenABalance)
                expect(oldTokenBBalance.add(outAmount)).to.equals(newTokenBBalance)

            });

            it(`TokenB:${amount}`, async () => {
                const oldTokenABalance = await tokenA.balanceOf(owner.address)
                const oldTokenBBalance = await tokenB.balanceOf(owner.address)
                const [reserveA, reserveB] = await amm.getTokenReserves();

                await amm.swap(tokenB.address, amount);

                let [newReserveA, newReserveB] = await amm.getTokenReserves();

                const inputAmountWithFee = ethers.BigNumber.from(amount.toString()).mul(997)
                const numerator = inputAmountWithFee.mul(reserveA)
                const denominator = reserveB.mul(1000).add(inputAmountWithFee)
                const outAmount = numerator.div(denominator)

                const newReserveAtoBe = reserveA.sub(outAmount)
                const newReserveBtoBe = reserveB.add(amount)

                expect(newReserveAtoBe).to.equals(newReserveA)
                expect(newReserveBtoBe).to.equals(newReserveB)

                const newTokenABalance = await tokenA.balanceOf(owner.address)
                const newTokenBBalance = await tokenB.balanceOf(owner.address)

                expect(oldTokenABalance.add(outAmount)).to.equals(newTokenABalance)
                expect(oldTokenBBalance.sub(amount)).to.equals(newTokenBBalance)

            });
        }
    });


    // const toAddress = '0xB4fdA33E65656F9f485438ABd9012eD04a31E006';

    // describe('deposit BNB', async function () {
    //     it('should reverted if insufficient', async () => {
    //         await expect(zkBNB.depositBNB(toAddress, { value: 0 })).to.be.revertedWith('ia');
    //     });

    //     it('should increase totalOpenPriorityRequests', async () => {
    //         const totalBefore = await zkBNB.totalOpenPriorityRequests();
    //         await zkBNB.depositBNB(toAddress, { value: 10 });
    //         await zkBNB.depositBNB(toAddress, { value: 10 });
    //         await zkBNB.depositBNB(toAddress, { value: 10 });
    //         const totalAfter = await zkBNB.totalOpenPriorityRequests();

    //         expect(totalAfter).to.be.equal(totalBefore + 3);
    //     });

    //     it('should emit `Deposit` events', async () => {
    //         const pubData = encodePubData(PubDataTypeMap[PubDataType.Deposit], [
    //             PubDataType.Deposit,
    //             0,
    //             '0xB4fdA33E65656F9f485438ABd9012eD04a31E006',
    //             3,
    //             10,
    //         ]);

    //         await expect(zkBNB.depositBNB(toAddress, { value: 10 }))
    //             .to.emit(zkBNB, 'NewPriorityRequest')
    //             .withArgs(owner.address, 0, PubDataType.Deposit, pubData, 201604)
    //             .to.emit(zkBNB, 'Deposit')
    //             .withArgs(0, toAddress, 10);
    //     });
    // });
    // describe('deposit ERC20', async function () {
    //     it('should reverted', async () => {
    //         // amount check
    //         await expect(zkBNB.depositBEP20(mockERC20.address, 0, toAddress)).to.be.revertedWith('I');

    //         // assets must exist
    //         mockGovernance.validateAssetAddress.returns(2);
    //         mockGovernance.pausedAssets.returns(true);
    //         await expect(zkBNB.depositBEP20(mockERC20.address, 10, toAddress)).to.be.revertedWith('b');

    //         // insufficient
    //         mockGovernance.pausedAssets.returns(false);
    //         mockERC20.transferFrom.returns(true);
    //         mockERC20.balanceOf.returnsAtCall(0, 100);
    //         mockERC20.balanceOf.returnsAtCall(1, 100);

    //         await expect(zkBNB.depositBEP20(mockERC20.address, 10, toAddress)).to.be.revertedWith('D');
    //     });

    //     it('should transfer erc20', async () => {
    //         mockERC20.transferFrom.returns(true);
    //         mockGovernance.pausedAssets.returns(false);
    //         mockERC20.balanceOf.returnsAtCall(0, 100);
    //         mockERC20.balanceOf.returnsAtCall(1, 110);
    //         await zkBNB.depositBEP20(mockERC20.address, 10, toAddress);

    //         expect(mockERC20.transferFrom).to.have.been.calledWith(owner.address, zkBNB.address, 10);
    //     });

    //     it('should emit `Deposit` event', async () => {
    //         const ASSET_ID = 3;
    //         mockERC20.transferFrom.returns(true);
    //         mockGovernance.validateAssetAddress.returns(ASSET_ID);
    //         mockGovernance.pausedAssets.returns(false);
    //         mockERC20.balanceOf.returnsAtCall(0, 100);
    //         mockERC20.balanceOf.returnsAtCall(1, 110);

    //         const pubData = encodePubData(PubDataTypeMap[PubDataType.Deposit], [
    //             PubDataType.Deposit,
    //             0,
    //             '0xB4fdA33E65656F9f485438ABd9012eD04a31E006',
    //             ASSET_ID,
    //             10,
    //         ]);
    //         await expect(zkBNB.depositBEP20(mockERC20.address, 10, toAddress))
    //             .to.emit(zkBNB, 'NewPriorityRequest')
    //             .withArgs(owner.address, 0, PubDataType.Deposit, pubData, 201604)
    //             .to.emit(zkBNB, 'Deposit')
    //             .withArgs(ASSET_ID, toAddress, 10);
    //     });
    // });
});