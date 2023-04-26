# Simple AMM

Write a Solidity AMM contract using the Foundry or Hardhat framework with the following requirements:

- Upon initialization, the contract should be able to receive the addresses of two tokens and the initial token amounts for the liquidity pool.
- The contract should support deposit and withdrawal. Depositors can deposit one type of token into the AMM,
  while withdrawers can withdraw one type of token from the AMM.
  During deposit and withdrawal, the ratio of the two tokens in the liquidity pool should be automatically updated to comply with the AMM ratio rules.
- The contract should support token trading, allowing exchange between the two types of tokens. During token trading,
  the contract should automatically calculate the ratio of the two tokens in the liquidity pool before and after the trade,
  and calculate the price and handling fee according to the AMM ratio rules, returning the trade results to both parties.
- The contract should provide an interface for the approve+transferFrom method, allowing users to exchange tokens through the contract without depositing them into the contract.
- The contract should charge a certain transaction fee, which will be proportionally distributed as LP rewards.
- Complete testing should be included.
- Deploy the contract to the goerli or sepolia testnet, provide the etherscan address, pass the contract code verification, and complete the testing of the contract methods.


## Install dependencies
```
yarn
```

## Test
```
yarn test
```

## Deploy and setup on testnet
```
yarn deploy
yarn verify
yarn setup
```