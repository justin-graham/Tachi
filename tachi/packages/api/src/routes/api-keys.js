/**
 * API Key Management Routes
 * Handles API key generation, rotation, listing, and revocation
 */

import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth-secure.js';
import { validate, schemas } from '../middleware/validation.js';
import { apiKeysService, usersService } from '../db/services.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// Generate cryptographically secure API key
function generateApiKey() {
  // Generate 48 bytes (384 bits) for high entropy
  const randomBytes = crypto.randomBytes(48);
  // Use base62 encoding for URL-safe keys
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < randomBytes.length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
}

// Hash API key for secure storage
async function hashApiKey(apiKey) {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(apiKey, saltRounds);
}

// Generate API key with metadata
router.post('/generate',
  authenticateToken,
  validate(schemas.apiKeyGeneration),
  async (req, res) => {
    try {
      const { name, permissions = [], expiresIn = null, description = '' } = req.body;
      const userId = req.user.id;

      logger.info('API key generation requested', {
        userId,
        name,
        permissions,
        ip: req.ip
      });

      // Check user exists and is active
      const user = await usersService.findById(userId, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'api_key_generation'
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (user.account_locked) {
        return res.status(403).json({
          error: 'Account is locked',
          code: 'ACCOUNT_LOCKED'
        });
      }

      // Check existing API key count limit
      const existingKeys = await apiKeysService.findByUser(userId, {}, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'check_key_limit'
      });

      const maxKeys = parseInt(process.env.MAX_API_KEYS_PER_USER) || 10;
      if (existingKeys.length >= maxKeys) {
        return res.status(429).json({
          error: 'API key limit exceeded',
          message: `Maximum ${maxKeys} API keys allowed per user`,
          code: 'API_KEY_LIMIT_EXCEEDED'
        });
      }

      // Generate API key
      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);
      const keyId = crypto.randomUUID();

      // Calculate expiration date
      let expiresAt = null;
      if (expiresIn) {
        const now = new Date();
        if (expiresIn.endsWith('d')) {
          const days = parseInt(expiresIn.slice(0, -1));
          expiresAt = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
        } else if (expiresIn.endsWith('m')) {
          const months = parseInt(expiresIn.slice(0, -1));
          expiresAt = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
        } else if (expiresIn.endsWith('y')) {
          const years = parseInt(expiresIn.slice(0, -1));
          expiresAt = new Date(now.getFullYear() + years, now.getMonth(), now.getDate());
        }
      }

      // Create API key record
      const keyData = {
        id: keyId,
        user_id: userId,
        name,
        description,
        key_hash: keyHash,
        permissions: JSON.stringify(permissions),
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        active: true,
        revoked: false,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const createdKey = await apiKeysService.create(keyData, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'api_key_creation'
      });

      logger.info('API key generated successfully', {
        userId,
        keyId,
        name,
        permissions,
        ip: req.ip
      });

      // Return API key (only time it's shown in plaintext)
      res.status(201).json({
        success: true,
        message: 'API key generated successfully',
        apiKey: {
          id: keyId,
          name,
          description,
          key: `tachi_${apiKey}`, // Add prefix for identification
          permissions,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          createdAt: createdKey.created_at
        },
        warning: 'Save this API key securely. It will not be shown again.'
      });

    } catch (error) {
      logger.error('API key generation failed:', error);
      res.status(500).json({
        error: 'Failed to generate API key',
        code: 'API_KEY_GENERATION_FAILED'
      });
    }
  }
);

// List user's API keys (without showing actual keys)
router.get('/list',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      logger.info('API keys list requested', { userId, ip: req.ip });

      const options = {
        offset: (page - 1) * limit,
        limit: parseInt(limit),
        orderBy: 'created_at DESC'
      };

      const apiKeys = await apiKeysService.findByUser(userId, options, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'list_api_keys'
      });

      // Remove sensitive data and format response
      const formattedKeys = apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        description: key.description,
        permissions: JSON.parse(key.permissions || '[]'),
        active: key.active,
        revoked: key.revoked,
        usageCount: key.usage_count,
        lastUsedAt: key.last_used_at,
        expiresAt: key.expires_at,
        createdAt: key.created_at,
        keyPreview: `tachi_${'*'.repeat(60)}` // Show prefix only
      }));

      res.json({
        success: true,
        apiKeys: formattedKeys,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: formattedKeys.length
        }
      });

    } catch (error) {
      logger.error('Failed to list API keys:', error);
      res.status(500).json({
        error: 'Failed to retrieve API keys',
        code: 'API_KEY_LIST_FAILED'
      });
    }
  }
);

// Get specific API key details
router.get('/:keyId',
  authenticateToken,
  validate(schemas.uuid, 'params'),
  async (req, res) => {
    try {
      const { keyId } = req.params;
      const userId = req.user.id;

      logger.info('API key details requested', { userId, keyId, ip: req.ip });

      const apiKeys = await apiKeysService.findByUser(userId, {}, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'get_api_key_details'
      });

      const apiKey = apiKeys.find(key => key.id === keyId);

      if (!apiKey) {
        return res.status(404).json({
          error: 'API key not found',
          code: 'API_KEY_NOT_FOUND'
        });
      }

      const formattedKey = {
        id: apiKey.id,
        name: apiKey.name,
        description: apiKey.description,
        permissions: JSON.parse(apiKey.permissions || '[]'),
        active: apiKey.active,
        revoked: apiKey.revoked,
        usageCount: apiKey.usage_count,
        lastUsedAt: apiKey.last_used_at,
        expiresAt: apiKey.expires_at,
        createdAt: apiKey.created_at,
        updatedAt: apiKey.updated_at,
        keyPreview: `tachi_${'*'.repeat(60)}`
      };

      res.json({
        success: true,
        apiKey: formattedKey
      });

    } catch (error) {
      logger.error('Failed to get API key details:', error);
      res.status(500).json({
        error: 'Failed to retrieve API key details',
        code: 'API_KEY_DETAILS_FAILED'
      });
    }
  }
);

// Revoke API key
router.delete('/:keyId',
  authenticateToken,
  validate(schemas.uuid, 'params'),
  async (req, res) => {
    try {
      const { keyId } = req.params;
      const userId = req.user.id;

      logger.info('API key revocation requested', { userId, keyId, ip: req.ip });

      // Verify the key belongs to the user
      const apiKeys = await apiKeysService.findByUser(userId, {}, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'revoke_api_key_check'
      });

      const apiKey = apiKeys.find(key => key.id === keyId);

      if (!apiKey) {
        return res.status(404).json({
          error: 'API key not found',
          code: 'API_KEY_NOT_FOUND'
        });
      }

      if (apiKey.revoked) {
        return res.status(400).json({
          error: 'API key is already revoked',
          code: 'API_KEY_ALREADY_REVOKED'
        });
      }

      // Revoke the key
      await apiKeysService.revoke(keyId, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'api_key_revocation'
      });

      logger.info('API key revoked successfully', { userId, keyId, ip: req.ip });

      res.json({
        success: true,
        message: 'API key revoked successfully',
        keyId
      });

    } catch (error) {
      logger.error('Failed to revoke API key:', error);
      res.status(500).json({
        error: 'Failed to revoke API key',
        code: 'API_KEY_REVOCATION_FAILED'
      });
    }
  }
);

// Rotate API key (revoke old, generate new)
router.post('/:keyId/rotate',
  authenticateToken,
  validate(schemas.uuid, 'params'),
  async (req, res) => {
    try {
      const { keyId } = req.params;
      const userId = req.user.id;

      logger.info('API key rotation requested', { userId, keyId, ip: req.ip });

      // Verify the key belongs to the user
      const apiKeys = await apiKeysService.findByUser(userId, {}, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'rotate_api_key_check'
      });

      const oldKey = apiKeys.find(key => key.id === keyId);

      if (!oldKey) {
        return res.status(404).json({
          error: 'API key not found',
          code: 'API_KEY_NOT_FOUND'
        });
      }

      if (oldKey.revoked) {
        return res.status(400).json({
          error: 'Cannot rotate revoked API key',
          code: 'API_KEY_REVOKED'
        });
      }

      // Generate new API key
      const newApiKey = generateApiKey();
      const newKeyHash = await hashApiKey(newApiKey);
      const newKeyId = crypto.randomUUID();

      // Create new key with same properties
      const newKeyData = {
        id: newKeyId,
        user_id: userId,
        name: `${oldKey.name} (rotated)`,
        description: oldKey.description,
        key_hash: newKeyHash,
        permissions: oldKey.permissions,
        expires_at: oldKey.expires_at,
        active: true,
        revoked: false,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create new key and revoke old one
      const [createdKey] = await Promise.all([
        apiKeysService.create(newKeyData, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          operation: 'api_key_rotation_create'
        }),
        apiKeysService.revoke(keyId, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          operation: 'api_key_rotation_revoke'
        })
      ]);

      logger.info('API key rotated successfully', {
        userId,
        oldKeyId: keyId,
        newKeyId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'API key rotated successfully',
        apiKey: {
          id: newKeyId,
          name: newKeyData.name,
          description: newKeyData.description,
          key: `tachi_${newApiKey}`,
          permissions: JSON.parse(oldKey.permissions || '[]'),
          expiresAt: newKeyData.expires_at,
          createdAt: createdKey.created_at
        },
        oldKeyId: keyId,
        warning: 'The old API key has been revoked. Update your applications with the new key.'
      });

    } catch (error) {
      logger.error('Failed to rotate API key:', error);
      res.status(500).json({
        error: 'Failed to rotate API key',
        code: 'API_KEY_ROTATION_FAILED'
      });
    }
  }
);

// Middleware to authenticate API key requests (for use in other routes)
export const authenticateApiKey = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer tachi_')) {
      return res.status(401).json({
        error: 'Valid API key required',
        code: 'INVALID_API_KEY_FORMAT'
      });
    }

    const apiKey = authHeader.replace('Bearer tachi_', '');
    
    // Find API key by hash
    const keyHash = await hashApiKey(apiKey);
    const apiKeyRecord = await apiKeysService.findByHash(keyHash, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      operation: 'api_key_authentication'
    });

    if (!apiKeyRecord) {
      logger.warn('Invalid API key used', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Check if key is active and not expired
    if (!apiKeyRecord.active || apiKeyRecord.revoked) {
      return res.status(401).json({
        error: 'API key is inactive or revoked',
        code: 'API_KEY_INACTIVE'
      });
    }

    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      return res.status(401).json({
        error: 'API key has expired',
        code: 'API_KEY_EXPIRED'
      });
    }

    // Get user associated with the key
    const user = await usersService.findById(apiKeyRecord.user_id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      operation: 'api_key_user_lookup'
    });

    if (!user || user.account_locked) {
      return res.status(401).json({
        error: 'User account is inactive or locked',
        code: 'USER_ACCOUNT_INACTIVE'
      });
    }

    // Update last used timestamp
    await apiKeysService.updateLastUsed(apiKeyRecord.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      operation: 'api_key_usage_update'
    });

    // Set user context for the request
    req.user = {
      id: user.id,
      email: user.email,
      type: user.type,
      role: 'api_user',
      apiKeyId: apiKeyRecord.id,
      permissions: JSON.parse(apiKeyRecord.permissions || '[]')
    };

    req.apiKey = {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      permissions: JSON.parse(apiKeyRecord.permissions || '[]')
    };

    next();

  } catch (error) {
    logger.error('API key authentication failed:', error);
    res.status(500).json({
      error: 'Authentication failed',
      code: 'API_KEY_AUTH_FAILED'
    });
  }
};

export default router;