#!/bin/bash

# Hardware Wallet Setup Script for Tachi Protocol Multi-Signature Deployment
# This script guides users through setting up their hardware wallets for production

set -e

echo "🔐 TACHI PROTOCOL - HARDWARE WALLET SETUP"
echo "========================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Hardware wallet configuration
declare -A SIGNERS=(
    ["ceo"]="CEO/Founder"
    ["cto"]="CTO"
    ["security"]="Security Officer" 
    ["operations"]="Operations Lead"
    ["advisor"]="External Security Advisor"
)

declare -A HARDWARE_TYPES=(
    ["ceo"]="Ledger Nano X"
    ["cto"]="Ledger Nano S Plus"
    ["security"]="Trezor Model T"
    ["operations"]="Ledger Nano X"
    ["advisor"]="Trezor Safe 3"
)

print_header() {
    echo -e "${BLUE}$1${NC}"
    echo "$(printf '%.0s-' {1..${#1}})"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if udev rules are installed for Ledger (Linux)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if ! lsusb | grep -q "Ledger"; then
            print_warning "Ledger udev rules may not be installed"
            echo "Please visit: https://github.com/LedgerHQ/udev-rules"
        fi
    fi
    
    # Check Node.js and npm
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "Prerequisites check complete"
    echo ""
}

# Install hardware wallet dependencies
install_dependencies() {
    print_header "Installing Hardware Wallet Dependencies"
    
    echo "Installing @ledgerhq/hw-app-eth..."
    npm install --save-dev @ledgerhq/hw-app-eth @ledgerhq/hw-transport-node-hid
    
    echo "Installing Trezor Connect..."
    npm install --save-dev trezor-connect
    
    echo "Installing hardware wallet utilities..."
    npm install --save-dev @nomicfoundation/hardhat-ledger
    
    print_success "Dependencies installed"
    echo ""
}

# Generate hardware wallet addresses
generate_addresses() {
    print_header "Hardware Wallet Address Generation"
    
    echo "This will generate addresses from your hardware wallets."
    echo "Make sure your hardware wallets are connected and unlocked."
    echo ""
    
    for role in "${!SIGNERS[@]}"; do
        signer_name="${SIGNERS[$role]}"
        hw_type="${HARDWARE_TYPES[$role]}"
        
        echo -e "${BLUE}Setting up: $signer_name ($hw_type)${NC}"
        echo "Role: $role"
        echo "Expected Hardware: $hw_type"
        echo ""
        
        read -p "Do you have the $hw_type hardware wallet ready? (y/n): " ready
        if [[ $ready != "y" ]]; then
            print_warning "Skipping $signer_name setup"
            continue
        fi
        
        # For Ledger devices
        if [[ $hw_type == *"Ledger"* ]]; then
            echo "Please:"
            echo "1. Connect your Ledger device"
            echo "2. Enter your PIN"
            echo "3. Open the Ethereum app"
            echo "4. Enable 'Blind signing' in Ethereum app settings"
            echo ""
            
            read -p "Press Enter when ready..."
            
            # Run address derivation script
            echo "Deriving address from Ledger..."
            node scripts/derive-ledger-address.js --role=$role
            
        # For Trezor devices
        elif [[ $hw_type == *"Trezor"* ]]; then
            echo "Please:"
            echo "1. Connect your Trezor device"
            echo "2. Enter your PIN"
            echo "3. Allow browser access if prompted"
            echo ""
            
            read -p "Press Enter when ready..."
            
            # Run address derivation script
            echo "Deriving address from Trezor..."
            node scripts/derive-trezor-address.js --role=$role
        fi
        
        print_success "$signer_name hardware wallet configured"
        echo ""
    done
}

# Test hardware wallet signatures
test_signatures() {
    print_header "Testing Hardware Wallet Signatures"
    
    echo "Testing signature capabilities for each hardware wallet..."
    echo ""
    
    for role in "${!SIGNERS[@]}"; do
        signer_name="${SIGNERS[$role]}"
        hw_type="${HARDWARE_TYPES[$role]}"
        
        echo -e "${BLUE}Testing: $signer_name ($hw_type)${NC}"
        
        read -p "Test signature for $signer_name? (y/n): " test_sig
        if [[ $test_sig != "y" ]]; then
            continue
        fi
        
        # Run signature test
        echo "Please confirm the signature on your $hw_type..."
        node scripts/test-hardware-signature.js --role=$role
        
        print_success "$signer_name signature test complete"
        echo ""
    done
}

# Generate deployment configuration
generate_config() {
    print_header "Generating Deployment Configuration"
    
    echo "Creating production multi-sig configuration..."
    
    # This would generate the final configuration with real addresses
    cat > config/production-multisig-config.json << EOF
{
  "version": "1.0.0",
  "network": "base",
  "deployment": {
    "requiredSignatures": 3,
    "totalSigners": 5,
    "timeLockDuration": 86400,
    "emergencyMode": false
  },
  "signers": {
    "ceo": {
      "role": "CEO/Founder",
      "hardwareWallet": "Ledger Nano X",
      "address": "TO_BE_GENERATED",
      "derivationPath": "m/44'/60'/0'/0/0",
      "verified": false
    },
    "cto": {
      "role": "CTO", 
      "hardwareWallet": "Ledger Nano S Plus",
      "address": "TO_BE_GENERATED",
      "derivationPath": "m/44'/60'/0'/0/0",
      "verified": false
    },
    "security": {
      "role": "Security Officer",
      "hardwareWallet": "Trezor Model T",
      "address": "TO_BE_GENERATED", 
      "derivationPath": "m/44'/60'/0'/0/0",
      "verified": false
    },
    "operations": {
      "role": "Operations Lead",
      "hardwareWallet": "Ledger Nano X",
      "address": "TO_BE_GENERATED",
      "derivationPath": "m/44'/60'/0'/0/1",
      "verified": false
    },
    "advisor": {
      "role": "External Security Advisor",
      "hardwareWallet": "Trezor Safe 3",
      "address": "TO_BE_GENERATED",
      "derivationPath": "m/44'/60'/0'/0/0",
      "verified": false
    }
  },
  "security": {
    "backupLocations": [
      "Bank Safe Deposit Box #1 (Primary)",
      "Bank Safe Deposit Box #2 (Secondary)", 
      "Secure Corporate Vault"
    ],
    "emergencyContacts": [
      "CEO: [REDACTED]",
      "Security Officer: [REDACTED]"
    ],
    "insurance": {
      "provider": "TBD",
      "coverage": "$X,XXX,XXX",
      "policyNumber": "TBD"
    }
  }
}
EOF
    
    print_success "Configuration template generated: config/production-multisig-config.json"
    echo ""
}

# Security checklist
security_checklist() {
    print_header "Security Checklist"
    
    echo "Before proceeding to deployment, ensure:"
    echo ""
    
    checklist=(
        "✓ All hardware wallets have been tested and verified"
        "✓ Recovery phrases are written down and stored securely"
        "✓ Multiple backup copies stored in different physical locations"
        "✓ All signers have completed multi-sig training"
        "✓ Emergency procedures are documented and understood"
        "✓ Legal agreements for key management are signed"
        "✓ Insurance coverage for key management is obtained"
        "✓ Monitoring and alerting systems are configured"
        "✓ Test transactions have been successful on testnet"
        "✓ All signers are available and contactable"
    )
    
    for item in "${checklist[@]}"; do
        echo "$item"
        read -p "Confirmed? (y/n): " confirmed
        if [[ $confirmed != "y" ]]; then
            print_error "Security checklist not complete. Cannot proceed to production deployment."
            exit 1
        fi
    done
    
    print_success "Security checklist complete!"
    echo ""
}

# Main setup flow
main() {
    echo "This script will guide you through setting up hardware wallets"
    echo "for the Tachi Protocol production multi-signature deployment."
    echo ""
    
    print_warning "IMPORTANT: This is for PRODUCTION deployment with real funds at risk!"
    print_warning "Ensure you understand all security implications before proceeding."
    echo ""
    
    read -p "Do you want to continue? (y/n): " continue_setup
    if [[ $continue_setup != "y" ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    # Create config directory
    mkdir -p config
    mkdir -p scripts
    
    # Run setup steps
    check_prerequisites
    install_dependencies
    generate_addresses
    test_signatures
    generate_config
    security_checklist
    
    print_header "Setup Complete!"
    echo ""
    print_success "Hardware wallet setup is complete!"
    echo ""
    echo "Next steps:"
    echo "1. Review the generated configuration in config/production-multisig-config.json"
    echo "2. Update the addresses with actual hardware wallet addresses"
    echo "3. Run the production deployment script: npm run deploy:production:multisig"
    echo "4. Execute ownership transfer transactions through the multi-sig"
    echo ""
    print_warning "Remember: Test everything on testnet first!"
}

# Run main function
main "$@"
