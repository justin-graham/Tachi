#!/usr/bin/env node

/**
 * Tachi Protocol - Secure Secret Management Implementation
 * 
 * This script implements enterprise-grade secret management using Doppler.
 * It replaces plaintext .env files with encrypted, auditable secret storage.
 * 
 * Requirements:
 * 1. Doppler CLI installed and configured
 * 2. Hardware wallet for production key management
 * 3. Proper access controls and audit logging
 */

import { execSync, spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import readline from 'readline';

interface SecretConfig {
  name: string;
  description: string;
  required: boolean;
  production: boolean;
  sensitive: boolean;
  validation?: (value: string) => boolean;
}

interface EnvironmentConfig {
  name: string;
  description: string;
  secrets: SecretConfig[];
}

// Define secret configurations for different environments
const SECRET_CONFIGS: Record<string, EnvironmentConfig> = {
  development: {
    name: "Development",
    description: "Local development environment with test values",
    secrets: [
      {
        name: "PRIVATE_KEY",
        description: "Development private key (test funds only)",
        required: true,
        production: false,
        sensitive: true,
        validation: (value: string) => value.startsWith("0x") && value.length === 66
      },
      {
        name: "ALCHEMY_API_KEY",
        description: "Alchemy API key for RPC access",
        required: true,
        production: false,
        sensitive: true,
        validation: (value: string) => value.length > 10
      },
      {
        name: "ETHERSCAN_API_KEY",
        description: "Etherscan API key for contract verification",
        required: false,
        production: false,
        sensitive: true,
        validation: (value: string) => value.length > 10
      }
    ]
  },
  
  testnet: {
    name: "Testnet",
    description: "Testnet environment with secure multi-sig keys",
    secrets: [
      {
        name: "MULTISIG_ADDRESS",
        description: "Multi-signature wallet address",
        required: true,
        production: false,
        sensitive: false,
        validation: (value: string) => value.startsWith("0x") && value.length === 42
      },
      {
        name: "HARDWARE_WALLET_SIGNER_1",
        description: "Hardware wallet signer 1 address",
        required: true,
        production: false,
        sensitive: false,
        validation: (value: string) => value.startsWith("0x") && value.length === 42
      },
      {
        name: "HARDWARE_WALLET_SIGNER_2",
        description: "Hardware wallet signer 2 address",
        required: true,
        production: false,
        sensitive: false,
        validation: (value: string) => value.startsWith("0x") && value.length === 42
      },
      {
        name: "HARDWARE_WALLET_SIGNER_3",
        description: "Hardware wallet signer 3 address",
        required: true,
        production: false,
        sensitive: false,
        validation: (value: string) => value.startsWith("0x") && value.length === 42
      },
      {
        name: "BASE_RPC_URL",
        description: "Base network RPC URL",
        required: true,
        production: false,
        sensitive: true,
        validation: (value: string) => value.startsWith("https://")
      },
      {
        name: "SENTRY_DSN",
        description: "Sentry error tracking DSN",
        required: false,
        production: false,
        sensitive: true
      }
    ]
  },
  
  production: {
    name: "Production",
    description: "Production environment with hardware wallet security",
    secrets: [
      {
        name: "MULTISIG_ADDRESS",
        description: "Production multi-signature wallet address",
        required: true,
        production: true,
        sensitive: false,
        validation: (value: string) => value.startsWith("0x") && value.length === 42
      },
      {
        name: "HARDWARE_WALLET_SIGNER_1",
        description: "Production hardware wallet signer 1 address",
        required: true,
        production: true,
        sensitive: false,
        validation: (value: string) => value.startsWith("0x") && value.length === 42
      },
      {
        name: "HARDWARE_WALLET_SIGNER_2",
        description: "Production hardware wallet signer 2 address",
        required: true,
        production: true,
        sensitive: false,
        validation: (value: string) => value.startsWith("0x") && value.length === 42
      },
      {
        name: "HARDWARE_WALLET_SIGNER_3",
        description: "Production hardware wallet signer 3 address",
        required: true,
        production: true,
        sensitive: false,
        validation: (value: string) => value.startsWith("0x") && value.length === 42
      },
      {
        name: "HARDWARE_WALLET_SIGNER_4",
        description: "Production hardware wallet signer 4 address",
        required: true,
        production: true,
        sensitive: false,
        validation: (value: string) => value.startsWith("0x") && value.length === 42
      },
      {
        name: "HARDWARE_WALLET_SIGNER_5",
        description: "Production hardware wallet signer 5 address",
        required: true,
        production: true,
        sensitive: false,
        validation: (value: string) => value.startsWith("0x") && value.length === 42
      },
      {
        name: "BASE_MAINNET_RPC_URL",
        description: "Base mainnet RPC URL",
        required: true,
        production: true,
        sensitive: true,
        validation: (value: string) => value.startsWith("https://")
      },
      {
        name: "CLOUDFLARE_API_TOKEN",
        description: "Cloudflare API token for worker deployment",
        required: true,
        production: true,
        sensitive: true
      },
      {
        name: "SENTRY_DSN_PRODUCTION",
        description: "Production Sentry error tracking DSN",
        required: true,
        production: true,
        sensitive: true
      },
      {
        name: "MONITORING_WEBHOOK_URL",
        description: "Security monitoring webhook URL",
        required: true,
        production: true,
        sensitive: true,
        validation: (value: string) => value.startsWith("https://")
      }
    ]
  }
};

class SecretManager {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async checkDopplerInstallation(): Promise<boolean> {
    try {
      execSync('doppler --version', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  async installDoppler(): Promise<void> {
    console.log('📦 Installing Doppler CLI...');
    
    try {
      // Install via npm
      execSync('npm install -g @dopplerhq/cli', { stdio: 'inherit' });
      console.log('✅ Doppler CLI installed successfully');
    } catch (error) {
      console.error('❌ Failed to install Doppler CLI');
      console.log('Please install manually: https://docs.doppler.com/docs/install-cli');
      throw error;
    }
  }

  async setupDopplerProject(): Promise<void> {
    console.log('🔧 Setting up Doppler project...');
    
    try {
      // Create project
      execSync('doppler projects create tachi-protocol --description "Tachi Protocol Secure Secret Management"', { stdio: 'pipe' });
      console.log('✅ Doppler project "tachi-protocol" created');
    } catch (error) {
      // Project might already exist
      console.log('ℹ️ Doppler project may already exist');
    }

    // Setup environments
    const environments = ['development', 'testnet', 'production'];
    
    for (const env of environments) {
      try {
        execSync(`doppler environments create ${env} --project tachi-protocol`, { stdio: 'pipe' });
        console.log(`✅ Environment "${env}" created`);
      } catch (error) {
        console.log(`ℹ️ Environment "${env}" may already exist`);
      }
    }
  }

  async promptForSecret(secret: SecretConfig): Promise<string> {
    return new Promise((resolve) => {
      const isPasswordField = secret.sensitive;
      
      if (isPasswordField) {
        process.stdout.write(`🔐 Enter ${secret.name} (${secret.description}): `);
        process.stdin.setRawMode(true);
        
        let input = '';
        const onData = (char: Buffer) => {
          const c = char.toString();
          if (c === '\r' || c === '\n') {
            process.stdin.setRawMode(false);
            process.stdin.removeListener('data', onData);
            console.log();
            resolve(input);
          } else if (c === '\u0003') {
            // Ctrl+C
            process.exit(1);
          } else if (c === '\u007f') {
            // Backspace
            if (input.length > 0) {
              input = input.slice(0, -1);
              process.stdout.write('\b \b');
            }
          } else {
            input += c;
            process.stdout.write('*');
          }
        };
        
        process.stdin.on('data', onData);
      } else {
        this.rl.question(`📝 Enter ${secret.name} (${secret.description}): `, resolve);
      }
    });
  }

  async configureSecrets(environment: string): Promise<void> {
    const config = SECRET_CONFIGS[environment];
    if (!config) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    console.log(`\n🔧 Configuring secrets for ${config.name} environment`);
    console.log(`📋 Description: ${config.description}\n`);

    for (const secret of config.secrets) {
      console.log(`\n${secret.required ? '🔴' : '🟡'} ${secret.name}`);
      console.log(`   ${secret.description}`);
      console.log(`   Required: ${secret.required ? 'Yes' : 'No'}`);
      console.log(`   Sensitive: ${secret.sensitive ? 'Yes' : 'No'}`);

      const value = await this.promptForSecret(secret);

      if (secret.required && !value) {
        console.log(`❌ ${secret.name} is required but no value provided`);
        process.exit(1);
      }

      if (value && secret.validation && !secret.validation(value)) {
        console.log(`❌ Invalid value for ${secret.name}`);
        process.exit(1);
      }

      if (value) {
        try {
          execSync(
            `doppler secrets set ${secret.name}="${value}" --project tachi-protocol --config ${environment}`,
            { stdio: 'pipe' }
          );
          console.log(`✅ ${secret.name} configured successfully`);
        } catch (error) {
          console.log(`❌ Failed to set ${secret.name}`);
          throw error;
        }
      }
    }
  }

  async generateEnvFile(environment: string): Promise<void> {
    console.log(`\n📄 Generating .env file for ${environment}...`);

    try {
      const secrets = execSync(
        `doppler secrets download --format env --project tachi-protocol --config ${environment}`,
        { encoding: 'utf8' }
      );

      const envFile = join(process.cwd(), `.env.${environment}`);
      writeFileSync(envFile, secrets);
      
      console.log(`✅ Environment file created: ${envFile}`);
      
      // Add security warning to file
      const securityWarning = `
# ⚠️ SECURITY WARNING ⚠️
# This file contains secrets fetched from Doppler.
# DO NOT commit this file to version control.
# Use 'doppler run' command for secure secret injection.
# 
# To regenerate: doppler secrets download --format env --project tachi-protocol --config ${environment}
#
`;
      
      const content = securityWarning + secrets;
      writeFileSync(envFile, content);
      
    } catch (error) {
      console.error(`❌ Failed to generate .env file for ${environment}`);
      throw error;
    }
  }

  async setupGitIgnore(): Promise<void> {
    const gitignorePath = join(process.cwd(), '.gitignore');
    const secretPatterns = [
      '# Tachi Protocol Secret Management',
      '.env.*',
      '!.env.example',
      '!.env.template',
      'doppler-secrets.json',
      '*.pem',
      '*.key',
      'hardware-wallet-config/*',
      '!hardware-wallet-config/.gitkeep'
    ];

    let gitignoreContent = '';
    if (existsSync(gitignorePath)) {
      gitignoreContent = readFileSync(gitignorePath, 'utf8');
    }

    let needsUpdate = false;
    for (const pattern of secretPatterns) {
      if (!gitignoreContent.includes(pattern)) {
        gitignoreContent += `\n${pattern}`;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      writeFileSync(gitignorePath, gitignoreContent);
      console.log('✅ Updated .gitignore with secret patterns');
    }
  }

  async createHardwareWalletGuide(): Promise<void> {
    const guide = `
# 🔐 Hardware Wallet Setup Guide for Tachi Protocol

## Overview
This guide covers the setup and use of hardware wallets for production multi-signature operations.

## Requirements
- Ledger Nano S Plus/X or Trezor Model T
- Latest firmware installed
- Ethereum app installed on device

## Security Requirements

### ✅ MANDATORY for Production:
1. **Hardware Wallet Only**: All production signers MUST use hardware wallets
2. **Secure Storage**: Store recovery phrases in fireproof safe or bank vault
3. **PIN Protection**: Always use PIN protection on devices
4. **Firmware Updates**: Keep device firmware up to date
5. **App Updates**: Keep Ethereum app updated on device

### ❌ NEVER for Production:
1. **Browser Wallets**: MetaMask, Coinbase Wallet, etc.
2. **Software Wallets**: Any wallet storing keys on computer
3. **Hot Wallets**: Any wallet connected to internet permanently
4. **Shared Devices**: Personal computers, shared workstations
5. **Cloud Storage**: Never store recovery phrases in cloud

## Setup Process

### 1. Hardware Wallet Initialization
\`\`\`bash
# For Ledger devices
# 1. Connect device via USB
# 2. Follow on-screen setup
# 3. Write down 24-word recovery phrase
# 4. Store recovery phrase securely (NOT digitally)
# 5. Install Ethereum app via Ledger Live
\`\`\`

### 2. Address Generation
\`\`\`bash
# Generate addresses using derivation path m/44'/60'/0'/0/0
# Record addresses but NEVER private keys
# Verify addresses on device screen before use
\`\`\`

### 3. Multi-Sig Integration
\`\`\`bash
# Use hardware wallet addresses in multi-sig setup
# Test with small amounts first on testnet
# Verify all signers can sign transactions
\`\`\`

## Operational Procedures

### Transaction Signing
1. Connect hardware wallet to secure computer
2. Verify transaction details on device screen
3. Confirm transaction matches intended operation
4. Sign only after verification
5. Disconnect wallet after use

### Emergency Procedures
1. **Lost Device**: Use recovery phrase to restore on new device
2. **Compromised Computer**: Hardware wallet protects against compromise
3. **Emergency Stop**: Contact other signers for emergency pause

## Signer Responsibilities

### Production Signers Must:
- [ ] Use dedicated hardware wallet for protocol operations
- [ ] Verify all transaction details before signing
- [ ] Maintain secure storage of recovery phrases
- [ ] Report any security incidents immediately
- [ ] Keep devices updated and secure

### Production Signers Must NOT:
- [ ] Share hardware wallet or recovery phrases
- [ ] Sign transactions without verification
- [ ] Use hardware wallet on compromised computers
- [ ] Store recovery phrases digitally

## Contact Information
- Security Team: security@tachi.app
- Emergency Contact: +1-XXX-XXX-XXXX
- Incident Response: incidents@tachi.app
`;

    const guidePath = join(process.cwd(), 'HARDWARE_WALLET_GUIDE.md');
    writeFileSync(guidePath, guide);
    console.log('✅ Hardware wallet guide created: HARDWARE_WALLET_GUIDE.md');
  }

  async close(): Promise<void> {
    this.rl.close();
  }
}

async function main() {
  const secretManager = new SecretManager();

  try {
    console.log('🔐 Tachi Protocol - Secure Secret Management Setup\n');
    console.log('🎯 Replacing plaintext .env files with enterprise-grade secret management\n');

    // Check if Doppler is installed
    const isDopplerInstalled = await secretManager.checkDopplerInstallation();
    if (!isDopplerInstalled) {
      console.log('❌ Doppler CLI not found');
      const shouldInstall = await new Promise<boolean>((resolve) => {
        secretManager['rl'].question('🤔 Install Doppler CLI? (y/n): ', (answer) => {
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });

      if (shouldInstall) {
        await secretManager.installDoppler();
      } else {
        console.log('❌ Doppler CLI required for secure secret management');
        process.exit(1);
      }
    } else {
      console.log('✅ Doppler CLI found');
    }

    // Setup Doppler project
    await secretManager.setupDopplerProject();

    // Choose environment
    console.log('\n📋 Available environments:');
    console.log('1. development - Local development with test values');
    console.log('2. testnet - Testnet with multi-sig addresses');
    console.log('3. production - Production with hardware wallet security');

    const environmentChoice = await new Promise<string>((resolve) => {
      secretManager['rl'].question('\n🔧 Select environment (1-3): ', (answer) => {
        const envMap: Record<string, string> = {
          '1': 'development',
          '2': 'testnet',
          '3': 'production'
        };
        resolve(envMap[answer] || 'development');
      });
    });

    console.log(`\n🎯 Selected environment: ${environmentChoice}`);

    if (environmentChoice === 'production') {
      console.log('\n🚨 PRODUCTION ENVIRONMENT SELECTED');
      console.log('🔐 Hardware wallet addresses required');
      console.log('⚠️ Ensure all signers have hardware wallets configured');
      
      const confirmed = await new Promise<boolean>((resolve) => {
        secretManager['rl'].question('\n✅ Confirm production setup (y/n): ', (answer) => {
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });

      if (!confirmed) {
        console.log('❌ Production setup cancelled');
        process.exit(0);
      }
    }

    // Configure secrets
    await secretManager.configureSecrets(environmentChoice);

    // Generate .env file
    await secretManager.generateEnvFile(environmentChoice);

    // Setup gitignore
    await secretManager.setupGitIgnore();

    // Create hardware wallet guide
    await secretManager.createHardwareWalletGuide();

    console.log('\n🎉 Secure Secret Management Setup Complete!');
    console.log('=====================================');
    console.log(`✅ Environment: ${environmentChoice}`);
    console.log('✅ Secrets stored securely in Doppler');
    console.log('✅ .gitignore updated to prevent secret leaks');
    console.log('✅ Hardware wallet guide created');

    console.log('\n📋 Next Steps:');
    console.log('1. 🔄 Run: doppler run -- npm run deploy');
    console.log('2. 🔐 Configure hardware wallets for production');
    console.log('3. 🧪 Test multi-sig operations on testnet');
    console.log('4. 📚 Review HARDWARE_WALLET_GUIDE.md');

    console.log('\n⚠️ SECURITY REMINDERS:');
    console.log('- Never commit .env files to version control');
    console.log('- Use hardware wallets for production signing');
    console.log('- Regularly rotate API keys and secrets');
    console.log('- Monitor secret access via Doppler dashboard');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await secretManager.close();
  }
}

if (require.main === module) {
  main();
}

export { SecretManager, SECRET_CONFIGS };
