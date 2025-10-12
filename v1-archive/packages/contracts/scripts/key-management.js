#!/usr/bin/env node

/**
 * Secure Key Management Utility for Tachi Protocol Production
 */

import crypto from 'node:crypto';
import { ethers } from 'ethers';

class SecureKeyManager {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.iterations = 100000;
  }

  /**
   * Generate a new secure private key
   */
  generateSecureKey() {
    const wallet = ethers.Wallet.createRandom();
    
    console.log('🔐 Generated New Secure Key Pair:');
    console.log('=====================================');
    console.log(`Private Key: ${wallet.privateKey}`);
    console.log(`Address: ${wallet.address}`);
    console.log(`Public Key: ${wallet.publicKey}`);
    console.log('=====================================');
    console.log('⚠️  CRITICAL: Store the private key securely!');
    console.log('⚠️  NEVER commit private keys to version control!');
    
    return wallet.privateKey;
  }

  /**
   * Encrypt a private key with a password
   */
  async encryptPrivateKey(privateKey, password) {
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, this.iterations, 32, 'sha256');
    const cipher = crypto.createCipher(this.algorithm, key);
    
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const encryptedData = {
      encrypted,
      salt: salt.toString('hex'),
      algorithm: this.algorithm,
      iterations: this.iterations,
      timestamp: new Date().toISOString()
    };

    console.log('🔒 Private Key Encrypted Successfully');
    return Buffer.from(JSON.stringify(encryptedData)).toString('base64');
  }

  /**
   * Decrypt an encrypted private key
   */
  async decryptPrivateKey(encryptedString, password) {
    try {
      const encryptedData = JSON.parse(Buffer.from(encryptedString, 'base64').toString());
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const key = crypto.pbkdf2Sync(password, salt, encryptedData.iterations, 32, 'sha256');
      const decipher = crypto.createDecipher(encryptedData.algorithm, key);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      console.log('🔓 Private Key Decrypted Successfully');
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Validate a private key
   */
  validatePrivateKey(privateKey) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      console.log('✅ Valid Private Key');
      console.log(`Address: ${wallet.address}`);
      console.log(`Public Key: ${wallet.publicKey}`);
      return true;
    } catch (error) {
      throw new Error(`Invalid private key: ${error.message}`);
    }
  }

  /**
   * Generate multisig configuration
   */
  async generateMultisigConfig(numSigners = 3, threshold = 2) {
    console.log(`🏛️  Generating ${numSigners}-of-${threshold} multisig configuration...`);
    
    const owners = [];
    for (let i = 0; i < numSigners; i++) {
      const wallet = ethers.Wallet.createRandom();
      owners.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
        index: i
      });
    }
    
    const multisigConfig = {
      threshold,
      owners: owners.map(owner => owner.address),
      signers: owners,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Multisig configuration generated');
    console.log(`   Threshold: ${threshold}`);
    console.log(`   Owners: ${owners.length}`);
    
    return multisigConfig;
  }
}

export { SecureKeyManager };
