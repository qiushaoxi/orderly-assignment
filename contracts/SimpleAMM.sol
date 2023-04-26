// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleAMM is ERC20 {
    uint256 public constant MINIMUM_LIQUIDITY = 10 ** 3;

    address public tokenA;
    address public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 constant FEE_MULTIPLIER = 997;
    uint256 constant FEE_DIVIDER = 1000;

    bool private initialized;

    event Deposit(address indexed tokenIn, uint256 amountIn);
    event Withdraw(address indexed tokenOut, uint256 amountOut);
    event Swap(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _tokenA, address _tokenB) ERC20("SimpleAMM LP", "SLP") {
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function init(
        uint256 _amountA,
        uint256 _amountB
    ) external returns (uint256 liquidity) {
        require(!initialized, "already been initialized");
        initialized = true;
        IERC20(tokenA).transferFrom(msg.sender, address(this), _amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), _amountB);
        reserveA = _amountA;
        reserveB = _amountB;

        liquidity = sqrt(_amountA * _amountB);
        require(liquidity > MINIMUM_LIQUIDITY, "amount too small");

        // To ameliorate rounding errors and increase the theoretical minimum tick size for liquidity provision,
        // pairs burn the first MINIMUM_LIQUIDITY pool tokens.
        liquidity = liquidity - MINIMUM_LIQUIDITY;
        _mint(address(this), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        _mint(msg.sender, liquidity);
    }

    function deposit(
        address _token,
        uint256 _amount
    ) external returns (uint256 liquidity) {
        require(initialized, "should have been initialized");
        require(_amount > 0, "Invalid deposit amounts");
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);

        if (_token == tokenA) {
            reserveA = reserveA + _amount;
        } else if (_token == tokenB) {
            reserveB = reserveB + _amount;
        } else {
            revert("token address not valid!");
        }

        liquidity = sqrt(reserveA * reserveB) - totalSupply();
        _mint(msg.sender, liquidity);
        emit Deposit(_token, _amount);
    }

    function withdraw(
        address _token,
        uint256 _lpAmount
    ) external returns (uint256 outAmount) {
        require(_lpAmount > 0, "Invalid withdraw amounts");
        uint256 _totalSupply = totalSupply();
        require(_totalSupply > _lpAmount, "Invalid withdraw amounts");

        uint256 liquidity = _totalSupply - _lpAmount;
        if (_token == tokenA) {
            uint256 _reserveA = (liquidity * liquidity) / reserveB;
            outAmount = reserveA - _reserveA;
            // need fee when withdraw , otherwise , user can deposit tokenA and withdraw tokenB to avoid exchange fee
            outAmount = (outAmount * FEE_MULTIPLIER) / FEE_DIVIDER;
            reserveA = reserveA - outAmount;
        } else if (_token == tokenB) {
            uint256 _reserveB = (liquidity * liquidity) / reserveA;
            outAmount = reserveB - _reserveB;
            // need fee when withdraw , otherwise , user can deposit tokenA and withdraw tokenB to avoid exchange fee
            outAmount = (outAmount * FEE_MULTIPLIER) / FEE_DIVIDER;
            reserveB = reserveB - outAmount;
        } else {
            revert("token address not valid!");
        }

        IERC20(_token).transfer(msg.sender, outAmount);
        _burn(msg.sender, _lpAmount);
        emit Withdraw(_token, outAmount);
    }

    function swap(address _tokenIn, uint256 _amountIn) external {
        require(
            _tokenIn == tokenA || _tokenIn == tokenB,
            "Invalid input token"
        );

        address _tokenOut;
        uint256 _amountOut;

        if (_tokenIn == tokenA) {
            _tokenOut = tokenB;
            _amountOut = calculateOutputAmount(_amountIn, reserveA, reserveB);
            reserveA = reserveA + _amountIn;
            reserveB = reserveB - _amountOut;
        } else {
            _tokenOut = tokenA;
            _amountOut = calculateOutputAmount(_amountIn, reserveB, reserveA);
            reserveA = reserveA - _amountOut;
            reserveB = reserveB + _amountIn;
        }
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenOut).transfer(msg.sender, _amountOut);
        emit Swap(_tokenIn, _tokenOut, _amountIn, _amountOut);
    }

    function calculateOutputAmount(
        uint256 _amountIn,
        uint256 _inputPool,
        uint256 _outputPool
    ) internal pure returns (uint256) {
        uint256 inputAmountWithFee = _amountIn * FEE_MULTIPLIER;
        uint256 numerator = inputAmountWithFee * _outputPool;
        uint256 denominator = _inputPool * FEE_DIVIDER + inputAmountWithFee;
        return numerator / denominator;
    }

    function getTokenReserves() external view returns (uint256, uint256) {
        return (reserveA, reserveB);
    }

    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
        // else z = 0 (default value)
    }
}
