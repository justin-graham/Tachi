/**
 * Publisher Verification and KYC Routes
 * Handles publisher identity verification, domain ownership, and KYC compliance
 */

import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth-secure.js';
import { validate, schemas } from '../middleware/validation.js';
import { publishersService, usersService } from '../db/services.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// Generate domain verification token
function generateVerificationToken(domain, userId) {
  const data = `${domain}:${userId}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// Start publisher verification process
router.post('/start',
  authenticateToken,
  validate(schemas.publisherRegistration),
  async (req, res) => {
    try {
      const {
        domain,
        siteTitle,
        description = '',
        categories,
        pricePerCrawl,
        currency = 'USDC',
        usageRights,
        contactEmail,
        businessType = 'individual',
        businessName,
        businessAddress,
        taxId
      } = req.body;
      
      const userId = req.user.id;

      logger.info('Publisher verification started', {
        userId,
        domain,
        businessType,
        ip: req.ip
      });

      // Check if user exists and is verified
      const user = await usersService.findById(userId, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'publisher_verification_start'
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.email_verified) {
        return res.status(400).json({
          error: 'Email must be verified before publisher registration',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }

      // Check if domain is already registered
      const existingPublisher = await publishersService.findByDomain(domain, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'domain_ownership_check'
      });

      if (existingPublisher) {
        return res.status(409).json({
          error: 'Domain already registered',
          message: 'This domain is already registered by another publisher',
          code: 'DOMAIN_ALREADY_REGISTERED'
        });
      }

      // Generate domain verification token
      const verificationToken = generateVerificationToken(domain, userId);
      const publisherId = crypto.randomUUID();

      // Create publisher record with pending status
      const publisherData = {
        id: publisherId,
        user_id: userId,
        email: contactEmail || user.email,
        name: siteTitle,
        domain,
        description,
        categories: JSON.stringify(categories),
        price_per_request: pricePerCrawl,
        currency,
        usage_rights: JSON.stringify(usageRights),
        business_type: businessType,
        business_name: businessName,
        business_address: businessAddress,
        tax_id: taxId,
        verification_token: verificationToken,
        verification_status: 'pending_domain',
        domain_verified: false,
        kyc_status: 'pending',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const publisher = await publishersService.create(publisherData, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'publisher_registration'
      });

      logger.info('Publisher verification record created', {
        userId,
        publisherId,
        domain,
        ip: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Publisher verification started',
        publisherId,
        verification: {
          domain,
          verificationToken,
          verificationMethods: [
            {
              method: 'txt_record',
              instruction: 'Add this TXT record to your domain DNS',
              record: {
                type: 'TXT',
                name: '_tachi-verification',
                value: `tachi-domain-verification=${verificationToken}`
              }
            },
            {
              method: 'html_file',
              instruction: 'Upload this file to your website root',
              filename: `tachi-verification-${verificationToken}.html`,
              content: `<!DOCTYPE html><html><head><title>Tachi Domain Verification</title></head><body><h1>Tachi Domain Verification</h1><p>Site verification for: ${domain}</p><p>Token: ${verificationToken}</p></body></html>`
            },
            {
              method: 'meta_tag',
              instruction: 'Add this meta tag to your homepage',
              tag: `<meta name="tachi-domain-verification" content="${verificationToken}" />`
            }
          ]
        },
        nextSteps: [
          'Complete domain verification using one of the provided methods',
          'Submit required business documentation for KYC',
          'Await review and approval'
        ]
      });

    } catch (error) {
      logger.error('Publisher verification start failed:', error);
      res.status(500).json({
        error: 'Failed to start verification process',
        code: 'VERIFICATION_START_FAILED'
      });
    }
  }
);

// Verify domain ownership
router.post('/verify-domain/:publisherId',
  authenticateToken,
  async (req, res) => {
    try {
      const { publisherId } = req.params;
      const { method = 'auto' } = req.body; // auto, txt_record, html_file, meta_tag
      const userId = req.user.id;

      logger.info('Domain verification requested', {
        userId,
        publisherId,
        method,
        ip: req.ip
      });

      // Get publisher record
      const publisher = await publishersService.findById(publisherId, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'domain_verification'
      });

      if (!publisher || publisher.user_id !== userId) {
        return res.status(404).json({
          error: 'Publisher not found',
          code: 'PUBLISHER_NOT_FOUND'
        });
      }

      if (publisher.domain_verified) {
        return res.status(400).json({
          error: 'Domain already verified',
          code: 'DOMAIN_ALREADY_VERIFIED'
        });
      }

      const { domain, verification_token: token } = publisher;
      let verificationResult = { verified: false, method: null, details: null };

      // Try different verification methods
      const verificationMethods = method === 'auto' 
        ? ['txt_record', 'html_file', 'meta_tag']
        : [method];

      for (const verifyMethod of verificationMethods) {
        try {
          switch (verifyMethod) {
            case 'txt_record':
              verificationResult = await verifyDnsTxtRecord(domain, token);
              break;
            case 'html_file':
              verificationResult = await verifyHtmlFile(domain, token);
              break;
            case 'meta_tag':
              verificationResult = await verifyMetaTag(domain, token);
              break;
          }

          if (verificationResult.verified) {
            verificationResult.method = verifyMethod;
            break;
          }
        } catch (error) {
          logger.warn(`Verification method ${verifyMethod} failed`, {
            domain,
            error: error.message
          });
        }
      }

      if (!verificationResult.verified) {
        return res.status(400).json({
          error: 'Domain verification failed',
          message: 'Could not verify domain ownership using any available method',
          code: 'DOMAIN_VERIFICATION_FAILED',
          details: verificationResult.details
        });
      }

      // Update publisher record
      await publishersService.update(publisherId, {
        domain_verified: true,
        domain_verified_at: new Date().toISOString(),
        domain_verification_method: verificationResult.method,
        verification_status: 'pending_kyc',
        updated_at: new Date().toISOString()
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'domain_verification_success'
      });

      logger.info('Domain verified successfully', {
        userId,
        publisherId,
        domain,
        method: verificationResult.method,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Domain verified successfully',
        verification: {
          domain,
          method: verificationResult.method,
          verifiedAt: new Date().toISOString()
        },
        nextSteps: [
          'Submit KYC documentation',
          'Complete business verification',
          'Await final approval'
        ]
      });

    } catch (error) {
      logger.error('Domain verification failed:', error);
      res.status(500).json({
        error: 'Domain verification failed',
        code: 'DOMAIN_VERIFICATION_ERROR'
      });
    }
  }
);

// Submit KYC documentation
router.post('/kyc/:publisherId',
  authenticateToken,
  async (req, res) => {
    try {
      const { publisherId } = req.params;
      const {
        businessDocuments,
        identityDocuments,
        additionalInfo = {}
      } = req.body;
      const userId = req.user.id;

      logger.info('KYC documentation submitted', {
        userId,
        publisherId,
        ip: req.ip
      });

      // Get publisher record
      const publisher = await publishersService.findById(publisherId, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'kyc_submission'
      });

      if (!publisher || publisher.user_id !== userId) {
        return res.status(404).json({
          error: 'Publisher not found',
          code: 'PUBLISHER_NOT_FOUND'
        });
      }

      if (!publisher.domain_verified) {
        return res.status(400).json({
          error: 'Domain must be verified before KYC submission',
          code: 'DOMAIN_NOT_VERIFIED'
        });
      }

      // Validate required documents based on business type
      const requiredDocs = getRequiredKycDocuments(publisher.business_type);
      const missingDocs = validateKycDocuments(businessDocuments, identityDocuments, requiredDocs);

      if (missingDocs.length > 0) {
        return res.status(400).json({
          error: 'Missing required KYC documents',
          missingDocuments: missingDocs,
          code: 'MISSING_KYC_DOCUMENTS'
        });
      }

      // Store KYC data (in production, encrypt sensitive data)
      const kycData = {
        business_documents: JSON.stringify(businessDocuments),
        identity_documents: JSON.stringify(identityDocuments),
        additional_info: JSON.stringify(additionalInfo),
        kyc_status: 'submitted',
        kyc_submitted_at: new Date().toISOString(),
        verification_status: 'pending_review',
        updated_at: new Date().toISOString()
      };

      await publishersService.update(publisherId, kycData, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'kyc_submission_update'
      });

      logger.info('KYC documentation processed', {
        userId,
        publisherId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'KYC documentation submitted successfully',
        kyc: {
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          estimatedReviewTime: '3-5 business days'
        },
        nextSteps: [
          'KYC review process initiated',
          'You will be notified via email of the review outcome',
          'Additional documentation may be requested if needed'
        ]
      });

    } catch (error) {
      logger.error('KYC submission failed:', error);
      res.status(500).json({
        error: 'KYC submission failed',
        code: 'KYC_SUBMISSION_FAILED'
      });
    }
  }
);

// Get verification status
router.get('/status/:publisherId',
  authenticateToken,
  async (req, res) => {
    try {
      const { publisherId } = req.params;
      const userId = req.user.id;

      const publisher = await publishersService.findById(publisherId, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'verification_status_check'
      });

      if (!publisher || publisher.user_id !== userId) {
        return res.status(404).json({
          error: 'Publisher not found',
          code: 'PUBLISHER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        publisher: {
          id: publisher.id,
          domain: publisher.domain,
          name: publisher.name,
          verificationStatus: publisher.verification_status,
          domainVerified: publisher.domain_verified,
          domainVerifiedAt: publisher.domain_verified_at,
          kycStatus: publisher.kyc_status,
          kycSubmittedAt: publisher.kyc_submitted_at,
          status: publisher.status,
          createdAt: publisher.created_at,
          updatedAt: publisher.updated_at
        }
      });

    } catch (error) {
      logger.error('Failed to get verification status:', error);
      res.status(500).json({
        error: 'Failed to get verification status',
        code: 'STATUS_CHECK_FAILED'
      });
    }
  }
);

// Admin: Review and approve/reject publisher
router.post('/admin/review/:publisherId',
  authenticateToken,
  async (req, res) => {
    try {
      const { publisherId } = req.params;
      const { action, reason = '', notes = '' } = req.body; // approve, reject, request_info
      const userId = req.user.id;

      // Check if user has admin role
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      logger.info('Publisher review action', {
        adminUserId: userId,
        publisherId,
        action,
        ip: req.ip
      });

      const publisher = await publishersService.findById(publisherId, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'admin_publisher_review'
      });

      if (!publisher) {
        return res.status(404).json({
          error: 'Publisher not found',
          code: 'PUBLISHER_NOT_FOUND'
        });
      }

      let updateData = {
        review_notes: notes,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      switch (action) {
        case 'approve':
          updateData.verification_status = 'approved';
          updateData.kyc_status = 'approved';
          updateData.status = 'active';
          break;
        case 'reject':
          updateData.verification_status = 'rejected';
          updateData.kyc_status = 'rejected';
          updateData.status = 'rejected';
          updateData.rejection_reason = reason;
          break;
        case 'request_info':
          updateData.verification_status = 'info_requested';
          updateData.info_request_reason = reason;
          break;
        default:
          return res.status(400).json({
            error: 'Invalid action',
            code: 'INVALID_ACTION'
          });
      }

      await publishersService.update(publisherId, updateData, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'admin_publisher_review_update'
      });

      logger.info('Publisher review completed', {
        adminUserId: userId,
        publisherId,
        action,
        ip: req.ip
      });

      res.json({
        success: true,
        message: `Publisher ${action}ed successfully`,
        review: {
          action,
          reason,
          notes,
          reviewedBy: userId,
          reviewedAt: updateData.reviewed_at
        }
      });

    } catch (error) {
      logger.error('Publisher review failed:', error);
      res.status(500).json({
        error: 'Publisher review failed',
        code: 'REVIEW_FAILED'
      });
    }
  }
);

// Helper functions for domain verification
async function verifyDnsTxtRecord(domain, token) {
  try {
    const dns = await import('dns').then(m => m.promises);
    const records = await dns.resolveTxt(domain);
    
    for (const record of records) {
      const txtValue = record.join('');
      if (txtValue.includes(`tachi-domain-verification=${token}`)) {
        return { verified: true, details: 'TXT record found' };
      }
    }
    
    return { verified: false, details: 'TXT record not found' };
  } catch (error) {
    return { verified: false, details: `DNS lookup failed: ${error.message}` };
  }
}

async function verifyHtmlFile(domain, token) {
  try {
    const url = `https://${domain}/tachi-verification-${token}.html`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.status === 200 && response.data.includes(token)) {
      return { verified: true, details: 'Verification file found' };
    }
    
    return { verified: false, details: 'Verification file content invalid' };
  } catch (error) {
    return { verified: false, details: `File fetch failed: ${error.message}` };
  }
}

async function verifyMetaTag(domain, token) {
  try {
    const url = `https://${domain}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    const metaTagPattern = new RegExp(`<meta[^>]*name=["']tachi-domain-verification["'][^>]*content=["']${token}["'][^>]*>`);
    
    if (response.status === 200 && metaTagPattern.test(response.data)) {
      return { verified: true, details: 'Meta tag found' };
    }
    
    return { verified: false, details: 'Meta tag not found' };
  } catch (error) {
    return { verified: false, details: `Page fetch failed: ${error.message}` };
  }
}

// Helper function to determine required KYC documents
function getRequiredKycDocuments(businessType) {
  const baseRequirements = {
    identity: ['government_id', 'proof_of_address'],
    business: []
  };

  switch (businessType) {
    case 'individual':
      return baseRequirements;
    case 'startup':
    case 'enterprise':
      baseRequirements.business = ['business_registration', 'tax_certificate'];
      return baseRequirements;
    default:
      return baseRequirements;
  }
}

// Helper function to validate submitted KYC documents
function validateKycDocuments(businessDocs, identityDocs, required) {
  const missing = [];
  
  // Check identity documents
  for (const docType of required.identity) {
    if (!identityDocs || !identityDocs[docType]) {
      missing.push(`identity.${docType}`);
    }
  }
  
  // Check business documents
  for (const docType of required.business) {
    if (!businessDocs || !businessDocs[docType]) {
      missing.push(`business.${docType}`);
    }
  }
  
  return missing;
}

export default router;