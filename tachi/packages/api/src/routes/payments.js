import Stripe from 'stripe';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken } from '../middleware/auth-secure.js';
import { validate, schemas } from '../middleware/validation.js';
import { createLogger } from '../utils/logger.js';
import { paymentProcessor } from '../services/payment-processing.js';

const router = express.Router();
const logger = createLogger();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create payment intent for credit purchase
router.post('/create-payment-intent', 
  authenticateToken,
  validate({
    amount: schemas.number().min(5).max(10000).required(),
    currency: schemas.string().valid('usd', 'eur', 'gbp').default('usd'),
    metadata: schemas.object().optional()
  }),
  async (req, res) => {
    try {
      const { amount, currency = 'usd', metadata = {} } = req.body;
      const crawlerId = req.user.id;

      logger.info('Payment intent creation requested', {
        crawlerId,
        amount,
        currency,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Use enhanced payment processor
      const paymentResult = await paymentProcessor.createPaymentIntent(
        crawlerId, 
        amount, 
        currency, 
        {
          ...metadata,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          request_id: req.headers['x-request-id'] || `req_${Date.now()}`
        }
      );

      res.json({
        success: true,
        ...paymentResult,
        recommendations: paymentResult.requiresVerification ? [
          'Enhanced verification required for this payment',
          'Please ensure your payment method is valid and has sufficient funds'
        ] : [
          'Payment can be processed normally'
        ]
      });

    } catch (error) {
      logger.error('Error creating payment intent:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to create payment intent',
        code: 'PAYMENT_INTENT_ERROR'
      });
    }
  }
);

// Enhanced webhook to handle all payment events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ 
      error: `Webhook Error: ${err.message}`,
      code: 'WEBHOOK_SIGNATURE_ERROR'
    });
  }

  logger.info(`Processing webhook event: ${event.type}`, {
    eventId: event.id,
    created: event.created
  });

  try {
    // Handle the event with enhanced processing
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await paymentProcessor.handleSuccessfulPayment(paymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await paymentProcessor.handleFailedPayment(failedPayment);
        break;
        
      case 'payment_intent.requires_action':
        logger.info(`Payment requires action: ${event.data.object.id}`);
        // Handle 3D Secure or other authentication requirements
        break;
        
      case 'charge.dispute.created':
        const dispute = event.data.object;
        await paymentProcessor.handlePaymentDispute(dispute);
        break;
        
      case 'invoice.payment_failed':
        logger.info(`Invoice payment failed: ${event.data.object.id}`);
        break;
        
      case 'customer.subscription.deleted':
        logger.info(`Subscription cancelled: ${event.data.object.id}`);
        break;
        
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ 
      received: true, 
      eventType: event.type,
      processed: true 
    });
    
  } catch (error) {
    logger.error('Error processing webhook event:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      code: 'WEBHOOK_PROCESSING_ERROR',
      eventType: event.type
    });
  }
});

// Payment processing functions moved to payment-processing.js service
// These are now handled by the paymentProcessor singleton

// Get comprehensive payment history with analytics
router.get('/history', 
  authenticateToken,
  validate({
    limit: schemas.number().min(1).max(100).default(50),
    offset: schemas.number().min(0).default(0),
    status: schemas.string().valid('completed', 'failed', 'pending').optional(),
    timeframe: schemas.string().valid('24h', '7d', '30d', '90d').optional()
  }, 'query'),
  async (req, res) => {
    try {
      const crawlerId = req.user.id;
      const { limit = 50, offset = 0, status, timeframe } = req.query;

      logger.info('Payment history requested', {
        crawlerId,
        limit,
        offset,
        status,
        timeframe,
        ip: req.ip
      });

      let query = supabase
        .from('payments')
        .select('*, refunds(*), payment_disputes(*)')
        .eq('crawler_id', crawlerId)
        .order('created_at', { ascending: false });

      // Filter by status if provided
      if (status) {
        query = query.eq('status', status);
      }

      // Filter by timeframe if provided
      if (timeframe) {
        const now = new Date();
        let startDate;
        switch (timeframe) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        }
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      const { data: payments, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Error fetching payment history:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch payment history',
          code: 'PAYMENT_HISTORY_ERROR'
        });
      }

      // Calculate summary statistics
      const summary = {
        totalPayments: payments.length,
        totalAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount_usd, 0),
        totalCredits: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.credits_purchased, 0),
        successfulPayments: payments.filter(p => p.status === 'completed').length,
        failedPayments: payments.filter(p => p.status === 'failed').length,
        disputedPayments: payments.filter(p => p.payment_disputes && p.payment_disputes.length > 0).length,
        refundedAmount: payments.reduce((sum, p) => {
          if (p.refunds && p.refunds.length > 0) {
            return sum + p.refunds.reduce((refundSum, r) => refundSum + r.refund_amount, 0);
          }
          return sum;
        }, 0)
      };

      res.json({
        success: true,
        payments: payments.map(p => ({
          id: p.id,
          amount: p.amount_usd,
          credits: p.credits_purchased,
          status: p.status,
          paymentMethod: p.payment_method,
          riskScore: p.risk_score,
          processingFee: p.processing_fee,
          netAmount: p.net_amount,
          createdAt: p.created_at,
          failureReason: p.failure_reason,
          failureCode: p.failure_code,
          isRetryable: p.is_retryable,
          retryCount: p.retry_count,
          refunds: p.refunds || [],
          disputes: p.payment_disputes || []
        })),
        summary,
        pagination: {
          limit,
          offset,
          total: count || payments.length,
          hasMore: payments.length === limit
        },
        filters: {
          status,
          timeframe
        }
      });

    } catch (error) {
      logger.error('Error fetching payment history:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR' 
      });
    }
  }
);

// Get comprehensive balance and spending analytics
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const crawlerId = req.user.id;
    const { includeAnalytics = false } = req.query;

    logger.info('Balance request', {
      crawlerId,
      includeAnalytics,
      ip: req.ip
    });

    const { data: crawler, error } = await supabase
      .from('crawlers')
      .select('credits, total_spent, frozen_credits, created_at')
      .eq('id', crawlerId)
      .single();

    if (error || !crawler) {
      return res.status(404).json({ 
        error: 'Crawler not found',
        code: 'CRAWLER_NOT_FOUND'
      });
    }

    const balanceData = {
      credits: {
        available: crawler.credits || 0,
        frozen: crawler.frozen_credits || 0,
        total: (crawler.credits || 0) + (crawler.frozen_credits || 0)
      },
      spending: {
        totalSpent: crawler.total_spent || 0,
        accountAge: Math.floor((Date.now() - new Date(crawler.created_at).getTime()) / (1000 * 60 * 60 * 24))
      }
    };

    // Include analytics if requested
    if (includeAnalytics === 'true') {
      try {
        const analytics = await paymentProcessor.getPaymentAnalytics(crawlerId, '30d');
        balanceData.analytics = analytics;
      } catch (analyticsError) {
        logger.warn('Failed to fetch payment analytics:', analyticsError);
        balanceData.analytics = { error: 'Analytics temporarily unavailable' };
      }
    }

    res.json({
      success: true,
      ...balanceData,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching credit balance:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'BALANCE_FETCH_ERROR'
    });
  }
});

// Enhanced payout setup for publishers with comprehensive validation
router.post('/setup-payout', 
  authenticateToken,
  validate({
    accountType: schemas.string().valid('express', 'standard').default('express'),
    businessType: schemas.string().valid('individual', 'company').optional(),
    country: schemas.string().length(2).optional()
  }),
  async (req, res) => {
    try {
      const publisherId = req.user.id;
      const { accountType = 'express', businessType, country } = req.body;

      if (req.user.type !== 'publisher') {
        return res.status(403).json({ 
          error: 'Publisher access required',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      logger.info('Payout setup requested', {
        publisherId,
        accountType,
        businessType,
        country,
        ip: req.ip
      });

      // Get publisher info with earnings validation
      const { data: publisher, error: publisherError } = await supabase
        .from('publishers')
        .select('email, name, stripe_account_id, total_earnings, verification_status')
        .eq('id', publisherId)
        .single();

      if (publisherError || !publisher) {
        return res.status(404).json({ 
          error: 'Publisher not found',
          code: 'PUBLISHER_NOT_FOUND'
        });
      }

      // Check if payout already exists
      if (publisher.stripe_account_id) {
        // Get existing account status
        const existingAccount = await stripe.accounts.retrieve(publisher.stripe_account_id);
        
        if (existingAccount.charges_enabled) {
          return res.json({
            success: true,
            accountId: publisher.stripe_account_id,
            status: 'already_setup',
            message: 'Payout account already configured and active'
          });
        }
      }

      // Validate minimum earnings for payout setup
      if ((publisher.total_earnings || 0) < 10) {
        return res.status(400).json({
          error: 'Minimum $10 in earnings required to setup payouts',
          code: 'INSUFFICIENT_EARNINGS',
          currentEarnings: publisher.total_earnings || 0,
          requiredEarnings: 10
        });
      }

      // Create enhanced Stripe Express account
      const accountParams = {
        type: accountType,
        email: publisher.email,
        business_profile: {
          name: publisher.name,
          product_description: 'Content licensing and web crawling services'
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        metadata: {
          publisher_id: publisherId,
          platform: 'tachi',
          verification_status: publisher.verification_status || 'unverified'
        }
      };

      if (businessType) {
        accountParams.business_type = businessType;
      }

      if (country) {
        accountParams.country = country;
      }

      const account = await stripe.accounts.create(accountParams);

      // Save Stripe account ID and payout setup timestamp
      const { error: updateError } = await supabase
        .from('publishers')
        .update({ 
          stripe_account_id: account.id,
          payout_setup_at: new Date().toISOString()
        })
        .eq('id', publisherId);

      if (updateError) {
        logger.error('Failed to save Stripe account ID:', updateError);
        // Continue anyway as account was created
      }

      // Create account link for enhanced onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/dashboard/payout/refresh?account=${account.id}`,
        return_url: `${process.env.FRONTEND_URL}/dashboard/payout/complete?account=${account.id}`,
        type: 'account_onboarding',
        collect: 'eventually_due'
      });

      // Log payout setup event
      await supabase
        .from('payment_events')
        .insert({
          publisher_id: publisherId,
          event_type: 'payout_setup_initiated',
          stripe_account_id: account.id,
          account_type: accountType,
          total_earnings: publisher.total_earnings || 0,
          created_at: new Date().toISOString()
        });

      logger.info(`Payout setup initiated for publisher ${publisherId} with account ${account.id}`);

      res.json({
        success: true,
        accountId: account.id,
        onboardingUrl: accountLink.url,
        accountType,
        requirements: {
          currently_due: account.requirements?.currently_due || [],
          eventually_due: account.requirements?.eventually_due || []
        },
        estimatedSetupTime: '5-10 minutes'
      });

    } catch (error) {
      logger.error('Error setting up payout:', error);
      
      if (error.type === 'StripeCardError') {
        res.status(400).json({ 
          error: error.message,
          code: 'STRIPE_ERROR',
          type: error.type
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to setup payout',
          code: 'PAYOUT_SETUP_ERROR'
        });
      }
    }
  }
);

// Process refund request
router.post('/refund',
  authenticateToken,
  validate({
    paymentIntentId: schemas.string().required(),
    amount: schemas.number().min(0.01).optional(),
    reason: schemas.string().valid(
      'duplicate', 
      'fraudulent', 
      'requested_by_customer',
      'subscription_canceled',
      'product_unacceptable',
      'product_not_received',
      'unrecognized',
      'credit_not_processed'
    ).default('requested_by_customer')
  }),
  async (req, res) => {
    try {
      const { paymentIntentId, amount, reason } = req.body;
      const crawlerId = req.user.id;

      logger.info('Refund requested', {
        paymentIntentId,
        amount,
        reason,
        crawlerId,
        ip: req.ip
      });

      // Verify payment belongs to this crawler
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .eq('crawler_id', crawlerId)
        .single();

      if (paymentError || !payment) {
        return res.status(404).json({
          error: 'Payment not found or unauthorized',
          code: 'PAYMENT_NOT_FOUND'
        });
      }

      if (payment.status !== 'completed') {
        return res.status(400).json({
          error: 'Can only refund completed payments',
          code: 'INVALID_PAYMENT_STATUS',
          currentStatus: payment.status
        });
      }

      // Check if already refunded
      const { data: existingRefunds } = await supabase
        .from('refunds')
        .select('refund_amount')
        .eq('payment_id', payment.id);

      const totalRefunded = existingRefunds?.reduce((sum, r) => sum + r.refund_amount, 0) || 0;
      const maxRefundAmount = payment.amount_usd - totalRefunded;

      if (maxRefundAmount <= 0) {
        return res.status(400).json({
          error: 'Payment already fully refunded',
          code: 'ALREADY_REFUNDED',
          totalRefunded
        });
      }

      const refundAmount = amount || maxRefundAmount;
      if (refundAmount > maxRefundAmount) {
        return res.status(400).json({
          error: 'Refund amount exceeds available amount',
          code: 'REFUND_AMOUNT_EXCEEDED',
          maxRefundAmount,
          requestedAmount: refundAmount
        });
      }

      // Process refund through payment processor
      const refundResult = await paymentProcessor.processRefund(
        paymentIntentId, 
        refundAmount, 
        reason
      );

      res.json({
        success: true,
        ...refundResult,
        message: 'Refund processed successfully'
      });

    } catch (error) {
      logger.error('Error processing refund:', error);
      res.status(500).json({
        error: error.message || 'Failed to process refund',
        code: 'REFUND_ERROR'
      });
    }
  }
);

// Get payment analytics
router.get('/analytics',
  authenticateToken,
  validate({
    timeframe: schemas.string().valid('24h', '7d', '30d', '90d').default('30d')
  }, 'query'),
  async (req, res) => {
    try {
      const crawlerId = req.user.id;
      const { timeframe = '30d' } = req.query;

      logger.info('Payment analytics requested', {
        crawlerId,
        timeframe,
        ip: req.ip
      });

      const analytics = await paymentProcessor.getPaymentAnalytics(crawlerId, timeframe);

      res.json({
        success: true,
        analytics,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error fetching payment analytics:', error);
      res.status(500).json({
        error: 'Failed to fetch payment analytics',
        code: 'ANALYTICS_ERROR'
      });
    }
  }
);

export default router;
