// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./TachiMultiSig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title TachiMultiSigFactory - Factory for deploying Tachi Multi-Signature Wallets
/// @notice Deploys and manages multi-signature wallets with standardized configurations
/// @dev Implements CREATE2 for deterministic addresses and upgrade management
contract TachiMultiSigFactory is Ownable {
    /// @notice Event emitted when a new multi-sig wallet is deployed
    event MultiSigDeployed(
        address indexed multiSig,
        address[] signers,
        uint256 requiredSignatures,
        bytes32 indexed salt
    );

    /// @notice Event emitted when a multi-sig wallet is upgraded
    event MultiSigUpgraded(
        address indexed oldMultiSig,
        address indexed newMultiSig,
        address[] signers
    );

    /// @notice Mapping to track deployed multi-sig wallets
    mapping(address => bool) public isDeployedMultiSig;

    /// @notice Array of all deployed multi-sig addresses
    address[] public deployedMultiSigs;

    /// @notice Predefined configuration for production multi-sig (3-of-5)
    struct ProductionConfig {
        uint256 requiredSignatures;
        uint256 maxSigners;
        string description;
    }

    /// @notice Get standard production configuration
    function getProductionConfig() public pure returns (ProductionConfig memory) {
        return ProductionConfig({
            requiredSignatures: 3,
            maxSigners: 5,
            description: "Production 3-of-5 Multi-Signature Wallet"
        });
    }

    /// @notice Get standard testnet configuration (2-of-3)
    function getTestnetConfig() public pure returns (ProductionConfig memory) {
        return ProductionConfig({
            requiredSignatures: 2,
            maxSigners: 3,
            description: "Testnet 2-of-3 Multi-Signature Wallet"
        });
    }

    constructor() Ownable(msg.sender) {}

    /// @notice Deploy a new multi-signature wallet with production configuration
    /// @param signers Array of signer addresses (must be exactly 5 for production)
    /// @param salt Salt for CREATE2 deployment
    /// @return multiSig Address of the deployed multi-sig wallet
    function deployProductionMultiSig(
        address[] calldata signers,
        bytes32 salt
    ) external onlyOwner returns (address multiSig) {
        ProductionConfig memory config = getProductionConfig();
        require(signers.length == config.maxSigners, "Production requires exactly 5 signers");
        
        return _deployMultiSig(signers, config.requiredSignatures, salt);
    }

    /// @notice Deploy a new multi-signature wallet with testnet configuration
    /// @param signers Array of signer addresses (must be exactly 3 for testnet)
    /// @param salt Salt for CREATE2 deployment
    /// @return multiSig Address of the deployed multi-sig wallet
    function deployTestnetMultiSig(
        address[] calldata signers,
        bytes32 salt
    ) external onlyOwner returns (address multiSig) {
        ProductionConfig memory config = getTestnetConfig();
        require(signers.length == config.maxSigners, "Testnet requires exactly 3 signers");
        
        return _deployMultiSig(signers, config.requiredSignatures, salt);
    }

    /// @notice Deploy a custom multi-signature wallet
    /// @param signers Array of signer addresses
    /// @param requiredSignatures Number of required signatures
    /// @param salt Salt for CREATE2 deployment
    /// @return multiSig Address of the deployed multi-sig wallet
    function deployCustomMultiSig(
        address[] calldata signers,
        uint256 requiredSignatures,
        bytes32 salt
    ) external onlyOwner returns (address multiSig) {
        require(signers.length >= 2 && signers.length <= 10, "Invalid signer count");
        require(requiredSignatures >= 2 && requiredSignatures <= signers.length, "Invalid signature requirement");
        
        return _deployMultiSig(signers, requiredSignatures, salt);
    }

    /// @notice Predict the address of a multi-sig wallet before deployment
    /// @param signers Array of signer addresses
    /// @param requiredSignatures Number of required signatures
    /// @param salt Salt for CREATE2 deployment
    /// @return predicted Predicted address
    function predictMultiSigAddress(
        address[] calldata signers,
        uint256 requiredSignatures,
        bytes32 salt
    ) external view returns (address predicted) {
        bytes32 bytecodeHash = keccak256(
            abi.encodePacked(
                type(TachiMultiSig).creationCode,
                abi.encode(signers, requiredSignatures)
            )
        );

        return address(uint160(uint256(keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                bytecodeHash
            )
        ))));
    }

    /// @notice Get the total number of deployed multi-sig wallets
    /// @return count Total count of deployed wallets
    function getDeployedMultiSigCount() external view returns (uint256 count) {
        return deployedMultiSigs.length;
    }

    /// @notice Get all deployed multi-sig wallet addresses
    /// @return multiSigs Array of all deployed multi-sig addresses
    function getAllDeployedMultiSigs() external view returns (address[] memory multiSigs) {
        return deployedMultiSigs;
    }

    /// @notice Verify if an address is a deployed multi-sig from this factory
    /// @param multiSig Address to verify
    /// @return isDeployed True if deployed by this factory
    function verifyMultiSig(address multiSig) external view returns (bool isDeployed) {
        return isDeployedMultiSig[multiSig];
    }

    /// @dev Internal function to deploy a multi-sig wallet
    /// @param signers Array of signer addresses
    /// @param requiredSignatures Number of required signatures
    /// @param salt Salt for CREATE2 deployment
    /// @return multiSig Address of the deployed multi-sig wallet
    function _deployMultiSig(
        address[] calldata signers,
        uint256 requiredSignatures,
        bytes32 salt
    ) internal returns (address multiSig) {
        // Validate signers
        for (uint256 i = 0; i < signers.length; i++) {
            require(signers[i] != address(0), "Invalid signer address");
            // Check for duplicates
            for (uint256 j = i + 1; j < signers.length; j++) {
                require(signers[i] != signers[j], "Duplicate signer");
            }
        }

        // Deploy using CREATE2
        bytes memory bytecode = abi.encodePacked(
            type(TachiMultiSig).creationCode,
            abi.encode(signers, requiredSignatures)
        );

        assembly {
            multiSig := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        require(multiSig != address(0), "MultiSig deployment failed");

        // Register the deployed multi-sig
        isDeployedMultiSig[multiSig] = true;
        deployedMultiSigs.push(multiSig);

        emit MultiSigDeployed(multiSig, signers, requiredSignatures, salt);

        return multiSig;
    }
}
