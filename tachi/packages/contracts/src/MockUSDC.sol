// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC - Mock USDC token for testing
/// @notice A simple ERC20 token that mimics USDC behavior for testing purposes
contract MockUSDC is ERC20 {
    uint8 private _decimals = 6; // USDC has 6 decimals
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Mint 1 million USDC to the deployer for testing
        _mint(msg.sender, 1_000_000 * 10**_decimals);
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    /// @notice Mint tokens to any address (for testing purposes)
    /// @param to The address to mint tokens to
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    /// @notice Burn tokens from any address (for testing purposes)
    /// @param from The address to burn tokens from
    /// @param amount The amount of tokens to burn
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
