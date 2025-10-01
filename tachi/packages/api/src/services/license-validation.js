import { createLogger } from '../utils/logger.js';
import { EventEmitter } from 'events';
import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet, polygon, base } from 'viem/chains';
import crypto from 'crypto';
import { getCacheService } from './cache.js';

const logger = createLogger();

export class LicenseValidationService extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.config = {
      // Blockchain configuration
      chains: {
        mainnet: { 
          chain: mainnet, 
          rpc: process.env.MAINNET_RPC_URL,
          enabled: process.env.MAINNET_ENABLED !== 'false'
        },
        polygon: { 
          chain: polygon, 
          rpc: process.env.POLYGON_RPC_URL,
          enabled: process.env.POLYGON_ENABLED !== 'false'
        },
        base: { 
          chain: base, 
          rpc: process.env.BASE_RPC_URL,
          enabled: process.env.BASE_ENABLED !== 'false'
        }
      },
      
      defaultChain: process.env.DEFAULT_CHAIN || 'base',
      
      // Contract addresses
      contracts: {
        crawlNFT: process.env.CRAWL_NFT_CONTRACT_ADDRESS,
        paymentProcessor: process.env.PAYMENT_PROCESSOR_CONTRACT_ADDRESS,
        licenseRegistry: process.env.LICENSE_REGISTRY_CONTRACT_ADDRESS
      },
      
      // License validation settings
      validation: {
        cacheTimeout: parseInt(process.env.LICENSE_CACHE_TIMEOUT) || 300000, // 5 minutes
        retryAttempts: parseInt(process.env.LICENSE_RETRY_ATTEMPTS) || 3,
        fallbackToCache: process.env.LICENSE_FALLBACK_TO_CACHE !== 'false',
        allowOfflineMode: process.env.LICENSE_ALLOW_OFFLINE_MODE === 'true'
      },
      
      // License types and permissions
      licenseTypes: {
        free: {
          requestsPerMonth: 1000,
          dataTransferMB: 100,
          features: ['basic_crawling'],
          priority: 0
        },
        basic: {
          requestsPerMonth: 10000,
          dataTransferMB: 1000,
          features: ['basic_crawling', 'api_access'],
          priority: 1
        },
        premium: {
          requestsPerMonth: 100000,
          dataTransferMB: 10000,
          features: ['basic_crawling', 'api_access', 'advanced_filtering', 'batch_processing'],
          priority: 2
        },
        enterprise: {
          requestsPerMonth: 1000000,
          dataTransferMB: 100000,
          features: ['basic_crawling', 'api_access', 'advanced_filtering', 'batch_processing', 'priority_support', 'custom_integrations'],
          priority: 3
        }
      }
    };
    
    // Blockchain clients
    this.clients = new Map();
    this.cache = getCacheService();
    
    // License data cache
    this.licenseCache = new Map();
    
    // Statistics
    this.stats = {
      validationsPerformed: 0,
      successfulValidations: 0,
      failedValidations: 0,
      cacheHits: 0,
      blockchainErrors: 0,
      lastValidation: null
    };
    
    // Contract ABIs
    this.abis = {
      crawlNFT: parseAbi([
        'function hasLicense(address publisher) external view returns (bool)',
        'function getPublisherTokenId(address publisher) external view returns (uint256)',
        'function getLicenseData(uint256 tokenId) external view returns (address publisher, bool isActive, uint32 mintTimestamp, uint32 lastUpdated)',
        'function ownerOf(uint256 tokenId) external view returns (address)',
        'function tokenURI(uint256 tokenId) external view returns (string)',
        'function balanceOf(address owner) external view returns (uint256)'
      ]),
      
      licenseRegistry: parseAbi([
        'function getLicense(address user) external view returns (string memory licenseType, bool isActive, uint256 expirationTimestamp, string[] memory features)',
        'function validateLicense(address user, string memory feature) external view returns (bool)',
        'function getLicenseHistory(address user) external view returns (tuple(string licenseType, uint256 startTime, uint256 endTime, bool wasActive)[] memory)',
        'function isFeatureEnabled(address user, string memory feature) external view returns (bool)'
      ]),
      
      paymentProcessor: parseAbi([
        'function getPublisherStats(address publisher) external view returns (uint256 balance, uint256 totalCrawls, uint256 totalFees)',
        'function calculateFees(uint256 amount) external view returns (uint256 protocolFee, uint256 publisherAmount)',
        'function isPaymentValid(bytes32 paymentId) external view returns (bool)'
      ])
    };
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      logger.info('Initializing license validation service...');
      
      // Initialize cache service
      await this.cache.initialize();
      
      // Initialize blockchain clients
      await this.initializeBlockchainClients();
      
      // Set up cache cleanup
      this.setupCacheCleanup();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      logger.info('License validation service initialized successfully', {
        availableChains: Array.from(this.clients.keys()),
        defaultChain: this.config.defaultChain,
        contractsConfigured: Object.values(this.config.contracts).filter(Boolean).length
      });
      
    } catch (error) {
      logger.error('Failed to initialize license validation service:', error);
      throw error;
    }
  }

  async initializeBlockchainClients() {
    for (const [chainName, chainConfig] of Object.entries(this.config.chains)) {
      if (!chainConfig.enabled || !chainConfig.rpc) {
        logger.warn(`Chain ${chainName} is disabled or missing RPC URL`);
        continue;
      }
      
      try {
        const client = createPublicClient({
          chain: chainConfig.chain,
          transport: http(chainConfig.rpc)
        });
        
        // Test connection
        await client.getBlockNumber();
        
        this.clients.set(chainName, client);
        logger.info(`Blockchain client initialized for ${chainName}`);
        
      } catch (error) {
        logger.error(`Failed to initialize ${chainName} client:`, error);
        
        if (chainName === this.config.defaultChain) {
          logger.warn('Default chain client failed, will operate in offline mode for that chain');
        }
      }
    }
  }

  setupCacheCleanup() {
    // Clean up license cache every hour
    setInterval(() => {
      this.cleanupLicenseCache();
    }, 60 * 60 * 1000);
  }

  async validateLicense(userAddress, feature = null, chainName = null) {
    this.stats.validationsPerformed++;
    const startTime = Date.now();
    
    try {
      const targetChain = chainName || this.config.defaultChain;
      
      // Check cache first
      const cacheKey = this.generateCacheKey(userAddress, feature, targetChain);
      const cached = await this.getCachedLicense(cacheKey);
      
      if (cached && this.isCacheValid(cached)) {
        this.stats.cacheHits++;
        logger.debug(`License validation served from cache: ${userAddress}`);
        return cached.data;
      }
      
      // Validate with blockchain
      const licenseData = await this.validateWithBlockchain(userAddress, feature, targetChain);
      
      // Cache the result
      await this.cacheLicenseData(cacheKey, licenseData);
      
      this.stats.successfulValidations++;
      this.stats.lastValidation = new Date();
      
      const responseTime = Date.now() - startTime;
      logger.info(`License validated successfully: ${userAddress}`, {
        feature,
        chain: targetChain,
        responseTime,
        licenseType: licenseData.licenseType
      });
      
      this.emit('licenseValidated', {
        userAddress,
        feature,
        chain: targetChain,
        licenseData,
        responseTime
      });
      
      return licenseData;
      
    } catch (error) {
      this.stats.failedValidations++;
      
      logger.error(`License validation failed: ${userAddress}`, {
        feature,
        chain: chainName,
        error: error.message
      });
      
      // Try fallback to cache if enabled
      if (this.config.validation.fallbackToCache) {
        const cacheKey = this.generateCacheKey(userAddress, feature, chainName);
        const staleCache = await this.getCachedLicense(cacheKey, true);
        
        if (staleCache) {
          logger.warn(`Using stale cache for license validation: ${userAddress}`);
          return { ...staleCache.data, fromStaleCache: true };
        }
      }
      
      // Try offline mode if enabled
      if (this.config.validation.allowOfflineMode) {
        logger.warn(`Using offline mode for license validation: ${userAddress}`);
        return this.getOfflineLicense(userAddress, feature);
      }
      
      this.emit('licenseValidationFailed', {
        userAddress,
        feature,
        chain: chainName,
        error: error.message
      });
      
      throw error;
    }
  }

  async validateWithBlockchain(userAddress, feature, chainName) {
    const client = this.clients.get(chainName);
    
    if (!client) {
      throw new Error(`No blockchain client available for chain: ${chainName}`);
    }
    
    let licenseData = {
      userAddress,
      isValid: false,
      licenseType: 'none',
      isActive: false,
      expirationTimestamp: null,
      features: [],
      tokenId: null,
      chain: chainName,
      validatedAt: new Date().toISOString()
    };
    
    try {
      // Try license registry first (if available)
      if (this.config.contracts.licenseRegistry) {
        licenseData = await this.validateWithLicenseRegistry(client, userAddress, feature);
      }
      
      // Fallback to NFT-based license check
      if (!licenseData.isValid && this.config.contracts.crawlNFT) {
        licenseData = await this.validateWithNFTContract(client, userAddress, feature);
      }
      
      // If no valid license found, assign free tier
      if (!licenseData.isValid) {
        licenseData = this.getFreeTierLicense(userAddress, chainName);
      }
      
      return licenseData;
      
    } catch (error) {
      this.stats.blockchainErrors++;
      logger.error('Blockchain validation error:', error);
      throw error;
    }
  }

  async validateWithLicenseRegistry(client, userAddress, feature) {
    try {
      const licenseInfo = await client.readContract({
        address: this.config.contracts.licenseRegistry,
        abi: this.abis.licenseRegistry,
        functionName: 'getLicense',
        args: [userAddress]
      });
      
      const [licenseType, isActive, expirationTimestamp, features] = licenseInfo;
      
      // Check if specific feature is required and enabled
      let featureValid = true;
      if (feature) {
        featureValid = await client.readContract({
          address: this.config.contracts.licenseRegistry,
          abi: this.abis.licenseRegistry,
          functionName: 'isFeatureEnabled',
          args: [userAddress, feature]
        });
      }
      
      const now = Math.floor(Date.now() / 1000);
      const isExpired = expirationTimestamp > 0 && expirationTimestamp < now;
      
      return {
        userAddress,
        isValid: isActive && !isExpired && featureValid,
        licenseType,
        isActive,
        expirationTimestamp: expirationTimestamp > 0 ? expirationTimestamp : null,
        features: Array.isArray(features) ? features : [],
        featureValid,
        chain: this.config.defaultChain,
        validatedAt: new Date().toISOString(),
        source: 'license_registry'
      };
      
    } catch (error) {
      logger.debug('License registry validation failed, trying NFT fallback:', error.message);
      throw error;
    }
  }

  async validateWithNFTContract(client, userAddress, feature) {
    try {
      const hasLicense = await client.readContract({
        address: this.config.contracts.crawlNFT,
        abi: this.abis.crawlNFT,
        functionName: 'hasLicense',
        args: [userAddress]
      });
      
      if (!hasLicense) {
        return this.getFreeTierLicense(userAddress, this.config.defaultChain);
      }
      
      const tokenId = await client.readContract({
        address: this.config.contracts.crawlNFT,
        abi: this.abis.crawlNFT,
        functionName: 'getPublisherTokenId',
        args: [userAddress]
      });
      
      const licenseData = await client.readContract({
        address: this.config.contracts.crawlNFT,
        abi: this.abis.crawlNFT,
        functionName: 'getLicenseData',
        args: [tokenId]
      });
      
      const [publisher, isActive, mintTimestamp, lastUpdated] = licenseData;
      
      // Determine license type based on NFT properties or default to basic
      const licenseType = this.determineLicenseTypeFromNFT(tokenId, mintTimestamp);
      const licenseConfig = this.config.licenseTypes[licenseType];
      
      // Check feature compatibility
      const featureValid = !feature || licenseConfig.features.includes(feature);
      
      return {
        userAddress,
        isValid: isActive && featureValid,
        licenseType,
        isActive,
        expirationTimestamp: null, // NFTs typically don't expire
        features: licenseConfig.features,
        tokenId: tokenId.toString(),
        mintTimestamp,
        lastUpdated,
        featureValid,
        chain: this.config.defaultChain,
        validatedAt: new Date().toISOString(),
        source: 'nft_contract'
      };
      
    } catch (error) {
      logger.debug('NFT contract validation failed:', error.message);
      throw error;
    }
  }

  determineLicenseTypeFromNFT(tokenId, mintTimestamp) {
    // Simple logic - can be enhanced with metadata or other factors
    const tokenIdNum = parseInt(tokenId.toString());
    
    if (tokenIdNum < 100) {
      return 'enterprise';
    } else if (tokenIdNum < 1000) {
      return 'premium';
    } else {
      return 'basic';
    }
  }

  getFreeTierLicense(userAddress, chainName) {
    const freeConfig = this.config.licenseTypes.free;
    
    return {
      userAddress,
      isValid: true,
      licenseType: 'free',
      isActive: true,
      expirationTimestamp: null,
      features: freeConfig.features,
      tokenId: null,
      chain: chainName,
      validatedAt: new Date().toISOString(),
      source: 'default_free_tier'
    };
  }

  getOfflineLicense(userAddress, feature) {
    // In offline mode, provide limited free tier access
    const freeConfig = this.config.licenseTypes.free;
    const featureValid = !feature || freeConfig.features.includes(feature);
    
    return {
      userAddress,
      isValid: featureValid,
      licenseType: 'free',
      isActive: true,
      expirationTimestamp: null,
      features: freeConfig.features,
      tokenId: null,
      chain: 'offline',
      validatedAt: new Date().toISOString(),
      source: 'offline_mode',
      featureValid
    };
  }

  generateCacheKey(userAddress, feature, chainName) {
    const keyData = {
      userAddress: userAddress.toLowerCase(),
      feature: feature || 'any',
      chain: chainName || this.config.defaultChain
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  async getCachedLicense(cacheKey, allowStale = false) {
    try {
      const cached = await this.cache.get(cacheKey);
      
      if (!cached) {
        return null;
      }
      
      if (allowStale) {
        return cached;
      }
      
      return this.isCacheValid(cached) ? cached : null;
      
    } catch (error) {
      logger.debug('Cache lookup failed:', error);
      return null;
    }
  }

  async cacheLicenseData(cacheKey, licenseData) {
    try {
      const cacheData = {
        data: licenseData,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.config.validation.cacheTimeout
      };
      
      await this.cache.set(cacheKey, cacheData, {
        ttl: Math.ceil(this.config.validation.cacheTimeout / 1000)
      });
      
    } catch (error) {
      logger.debug('Failed to cache license data:', error);
      // Don't throw - caching is optional
    }
  }

  isCacheValid(cached) {
    return cached && cached.expiresAt > Date.now();
  }

  cleanupLicenseCache() {
    const now = Date.now();
    
    for (const [key, data] of this.licenseCache) {
      if (data.expiresAt <= now) {
        this.licenseCache.delete(key);
      }
    }
  }

  async validateFeatureAccess(userAddress, feature, chainName = null) {
    try {
      const license = await this.validateLicense(userAddress, feature, chainName);
      
      if (!license.isValid) {
        return {
          allowed: false,
          reason: 'Invalid or expired license',
          licenseType: license.licenseType,
          requiredUpgrade: this.getRequiredUpgradeForFeature(feature)
        };
      }
      
      if (!license.featureValid) {
        return {
          allowed: false,
          reason: `Feature '${feature}' not included in ${license.licenseType} license`,
          licenseType: license.licenseType,
          requiredUpgrade: this.getRequiredUpgradeForFeature(feature)
        };
      }
      
      return {
        allowed: true,
        licenseType: license.licenseType,
        features: license.features,
        expirationTimestamp: license.expirationTimestamp
      };
      
    } catch (error) {
      return {
        allowed: false,
        reason: 'License validation failed',
        error: error.message
      };
    }
  }

  getRequiredUpgradeForFeature(feature) {
    for (const [tierName, tierConfig] of Object.entries(this.config.licenseTypes)) {
      if (tierConfig.features.includes(feature)) {
        return tierName;
      }
    }
    
    return 'enterprise'; // Default to highest tier if feature not found
  }

  async getLicenseHistory(userAddress, chainName = null) {
    const targetChain = chainName || this.config.defaultChain;
    const client = this.clients.get(targetChain);
    
    if (!client || !this.config.contracts.licenseRegistry) {
      throw new Error('License history not available');
    }
    
    try {
      const history = await client.readContract({
        address: this.config.contracts.licenseRegistry,
        abi: this.abis.licenseRegistry,
        functionName: 'getLicenseHistory',
        args: [userAddress]
      });
      
      return history.map(entry => ({
        licenseType: entry.licenseType,
        startTime: entry.startTime,
        endTime: entry.endTime,
        wasActive: entry.wasActive,
        duration: entry.endTime - entry.startTime
      }));
      
    } catch (error) {
      logger.error('Failed to get license history:', error);
      throw error;
    }
  }

  getLicenseTypes() {
    return Object.entries(this.config.licenseTypes).map(([name, config]) => ({
      name,
      ...config
    }));
  }

  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.validationsPerformed > 0 
        ? Math.round((this.stats.cacheHits / this.stats.validationsPerformed) * 100) 
        : 0,
      successRate: this.stats.validationsPerformed > 0 
        ? Math.round((this.stats.successfulValidations / this.stats.validationsPerformed) * 100) 
        : 0,
      availableChains: Array.from(this.clients.keys()),
      cachedLicenses: this.licenseCache.size
    };
  }

  getHealth() {
    const connectedChains = this.clients.size;
    const totalChains = Object.keys(this.config.chains).length;
    
    let status = 'healthy';
    if (connectedChains === 0) {
      status = 'unhealthy';
    } else if (connectedChains < totalChains / 2) {
      status = 'degraded';
    }
    
    return {
      status,
      connectedChains,
      totalChains,
      defaultChainAvailable: this.clients.has(this.config.defaultChain),
      validationsPerformed: this.stats.validationsPerformed,
      lastValidation: this.stats.lastValidation,
      cacheEnabled: this.cache.isInitialized,
      offlineModeEnabled: this.config.validation.allowOfflineMode
    };
  }

  async refreshLicenseCache(userAddress, chainName = null) {
    const targetChain = chainName || this.config.defaultChain;
    
    // Clear existing cache entries for this user
    const pattern = `${userAddress.toLowerCase()}*${targetChain}`;
    
    // Force re-validation
    try {
      const license = await this.validateWithBlockchain(userAddress, null, targetChain);
      logger.info(`License cache refreshed for ${userAddress}`);
      return license;
    } catch (error) {
      logger.error(`Failed to refresh license cache for ${userAddress}:`, error);
      throw error;
    }
  }
}

// Singleton instance
let licenseValidationInstance = null;

export const getLicenseValidationService = () => {
  if (!licenseValidationInstance) {
    licenseValidationInstance = new LicenseValidationService();
  }
  return licenseValidationInstance;
};

export default getLicenseValidationService();