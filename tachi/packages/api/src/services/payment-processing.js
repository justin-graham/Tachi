/**
 * Payment Processing Service
 * Handles comprehensive payment operations including verification, retries, disputes, and refunds
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '../utils/logger.js';

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

export class PaymentProcessor {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelayMs = 5000; // 5 seconds
    this.maxRetryDelayMs = 300000; // 5 minutes
  }

  /**
   * Create payment intent with enhanced validation and metadata
   */
  async createPaymentIntent(crawlerId, amount, currency = 'usd', metadata = {}) {
    try {
      // Validate amount
      if (!amount || amount < 5) {
        throw new Error('Minimum purchase is $5');
      }
      if (amount > 10000) {
        throw new Error('Maximum purchase is $10,000');
      }

      // Get crawler info for fraud detection
      const { data: crawler, error: crawlerError } = await supabase
        .from('crawlers')
        .select('email, company_name, created_at, credits, total_spent, verification_status')
        .eq('id', crawlerId)
        .single();

      if (crawlerError || !crawler) {
        throw new Error('Crawler not found or invalid');
      }

      // Risk assessment for new or suspicious accounts
      const riskScore = await this.assessPaymentRisk(crawler, amount);
      
      // Enhanced metadata for payment tracking and fraud prevention
      const enhancedMetadata = {
        crawler_id: crawlerId,
        email: crawler.email,
        company_name: crawler.company_name || 'Individual',
        credit_amount: amount,
        risk_score: riskScore,
        verification_status: crawler.verification_status || 'unverified',
        account_age_days: Math.floor((Date.now() - new Date(crawler.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        previous_total_spent: crawler.total_spent || 0,
        current_credits: crawler.credits || 0,
        ...metadata
      };

      // Create payment intent with fraud prevention
      const paymentIntentOptions = {
        amount: amount * 100, // Convert to cents
        currency,
        metadata: enhancedMetadata,
        description: `Tachi Credits Purchase - ${amount} credits`,
        statement_descriptor: 'TACHI CREDITS',
        receipt_email: crawler.email,
        automatic_payment_methods: {
          enabled: true
        }
      };

      // Add additional verification for high-risk payments
      if (riskScore > 70 || amount > 1000) {
        paymentIntentOptions.payment_method_options = {
          card: {
            request_three_d_secure: 'automatic'
          }
        };
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

      // Log payment intent creation
      await this.logPaymentEvent({
        payment_intent_id: paymentIntent.id,
        crawler_id: crawlerId,
        event_type: 'payment_intent_created',
        amount_usd: amount,
        risk_score: riskScore,
        metadata: enhancedMetadata
      });

      logger.info(`Payment intent created: ${paymentIntent.id} for crawler ${crawlerId} (risk: ${riskScore})`);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        credits: amount,
        riskScore,
        requiresVerification: riskScore > 70
      };

    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Assess payment risk based on crawler data and payment amount
   */
  async assessPaymentRisk(crawler, amount) {
    let riskScore = 0;

    // Account age factor
    const accountAgeDays = Math.floor((Date.now() - new Date(crawler.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (accountAgeDays < 7) riskScore += 30;
    else if (accountAgeDays < 30) riskScore += 15;

    // Verification status
    if (crawler.verification_status !== 'verified') riskScore += 25;

    // Payment amount relative to history
    const totalSpent = crawler.total_spent || 0;
    if (amount > totalSpent * 3 && totalSpent > 0) riskScore += 20;
    if (amount > 1000) riskScore += 15;

    // New customer large purchase
    if (totalSpent === 0 && amount > 100) riskScore += 25;

    // Check for suspicious patterns in recent payments
    const recentFailures = await this.getRecentPaymentFailures(crawler.id);
    if (recentFailures > 2) riskScore += 30;

    return Math.min(riskScore, 100);
  }

  /**
   * Get recent payment failures for risk assessment
   */
  async getRecentPaymentFailures(crawlerId) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: failures, error } = await supabase
        .from('payments')
        .select('id')
        .eq('crawler_id', crawlerId)
        .eq('status', 'failed')
        .gte('created_at', oneDayAgo);

      if (error) {
        logger.warn('Error checking recent payment failures:', error);
        return 0;
      }

      return failures.length;
    } catch (error) {
      logger.warn('Error checking recent payment failures:', error);
      return 0;
    }
  }

  /**
   * Handle successful payment with comprehensive validation
   */
  async handleSuccessfulPayment(paymentIntent) {
    try {
      const crawlerId = paymentIntent.metadata.crawler_id;
      const creditAmount = parseInt(paymentIntent.metadata.credit_amount);
      const riskScore = parseInt(paymentIntent.metadata.risk_score || 0);

      logger.info(`Processing successful payment: ${paymentIntent.id} for crawler ${crawlerId}`);

      // Verify payment intent is actually successful
      const verifiedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
      if (verifiedPaymentIntent.status !== 'succeeded') {
        throw new Error(`Payment intent status is ${verifiedPaymentIntent.status}, not succeeded`);
      }

      // Double-check amount matches to prevent manipulation
      if (verifiedPaymentIntent.amount !== paymentIntent.amount) {
        throw new Error('Payment amount mismatch detected');
      }

      // Begin database transaction
      const { data: crawler, error: fetchError } = await supabase
        .from('crawlers')
        .select('credits, total_spent, email')
        .eq('id', crawlerId)
        .single();

      if (fetchError || !crawler) {
        throw new Error('Crawler not found during payment processing');
      }

      // Update crawler credits and spending atomically
      const { error: updateError } = await supabase
        .from('crawlers')
        .update({ 
          credits: crawler.credits + creditAmount,
          total_spent: (crawler.total_spent || 0) + (paymentIntent.amount / 100)
        })
        .eq('id', crawlerId);

      if (updateError) {
        throw new Error(`Failed to update crawler credits: ${updateError.message}`);
      }

      // Record the payment transaction
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          crawler_id: crawlerId,
          stripe_payment_intent_id: paymentIntent.id,
          amount_usd: paymentIntent.amount / 100,
          credits_purchased: creditAmount,
          status: 'completed',
          risk_score: riskScore,
          payment_method: verifiedPaymentIntent.payment_method_types?.[0] || 'unknown',
          processing_fee: Math.round(paymentIntent.amount * 0.029 + 30), // Stripe fees
          net_amount: paymentIntent.amount - Math.round(paymentIntent.amount * 0.029 + 30),
          created_at: new Date().toISOString()
        });

      if (paymentError) {
        logger.error('Failed to record payment transaction:', paymentError);
        // Don't throw here as credits were already added - log for manual reconciliation
      }

      // Log successful payment event
      await this.logPaymentEvent({
        payment_intent_id: paymentIntent.id,
        crawler_id: crawlerId,
        event_type: 'payment_completed',
        amount_usd: paymentIntent.amount / 100,
        credits_added: creditAmount,
        new_credit_balance: crawler.credits + creditAmount
      });

      // Send success notification email for high-value payments
      if (paymentIntent.amount >= 50000) { // $500+
        await this.sendPaymentNotification(crawler.email, {
          type: 'high_value_success',
          amount: paymentIntent.amount / 100,
          credits: creditAmount,
          paymentId: paymentIntent.id
        });
      }

      logger.info(`Credits added successfully: ${creditAmount} for crawler ${crawlerId} (Payment: ${paymentIntent.id})`);

      return {
        success: true,
        creditsAdded: creditAmount,
        newBalance: crawler.credits + creditAmount,
        transactionId: paymentIntent.id
      };

    } catch (error) {
      logger.error('Error handling successful payment:', error);
      
      // Log failed processing event
      await this.logPaymentEvent({
        payment_intent_id: paymentIntent.id,
        crawler_id: paymentIntent.metadata.crawler_id,
        event_type: 'payment_processing_failed',
        error_message: error.message,
        amount_usd: paymentIntent.amount / 100
      });

      throw error;
    }
  }

  /**
   * Enhanced failed payment handling with retry mechanisms
   */
  async handleFailedPayment(paymentIntent) {
    try {
      const crawlerId = paymentIntent.metadata.crawler_id;
      const failureCode = paymentIntent.last_payment_error?.code;
      const failureMessage = paymentIntent.last_payment_error?.message || 'Unknown error';

      logger.info(`Processing failed payment: ${paymentIntent.id} for crawler ${crawlerId} (${failureCode})`);

      // Determine if payment is retryable
      const isRetryable = this.isPaymentRetryable(failureCode);
      const retryCount = await this.getPaymentRetryCount(paymentIntent.id);

      // Record the failed payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          crawler_id: crawlerId,
          stripe_payment_intent_id: paymentIntent.id,
          amount_usd: paymentIntent.amount / 100,
          credits_purchased: 0,
          status: 'failed',
          failure_reason: failureMessage,
          failure_code: failureCode,
          is_retryable: isRetryable,
          retry_count: retryCount,
          created_at: new Date().toISOString()
        });

      if (paymentError) {
        logger.error('Failed to record payment failure:', paymentError);
      }

      // Log failed payment event
      await this.logPaymentEvent({
        payment_intent_id: paymentIntent.id,
        crawler_id: crawlerId,
        event_type: 'payment_failed',
        failure_code: failureCode,
        failure_message: failureMessage,
        is_retryable: isRetryable,
        retry_count: retryCount,
        amount_usd: paymentIntent.amount / 100
      });

      // Handle retryable failures
      if (isRetryable && retryCount < this.retryAttempts) {
        await this.schedulePaymentRetry(paymentIntent.id, retryCount + 1);
      } else {
        // Send failure notification for non-retryable or max retries exceeded
        const { data: crawler } = await supabase
          .from('crawlers')
          .select('email')
          .eq('id', crawlerId)
          .single();

        if (crawler?.email) {
          await this.sendPaymentNotification(crawler.email, {
            type: 'payment_failed',
            amount: paymentIntent.amount / 100,
            failureReason: failureMessage,
            isRetryable: isRetryable && retryCount < this.retryAttempts,
            paymentId: paymentIntent.id
          });
        }
      }

      return {
        success: false,
        failureCode,
        failureMessage,
        isRetryable,
        retryCount
      };

    } catch (error) {
      logger.error('Error handling failed payment:', error);
      throw error;
    }
  }

  /**
   * Determine if a payment failure is retryable
   */
  isPaymentRetryable(failureCode) {
    const retryableCodes = [
      'card_declined',
      'processing_error',
      'temporary_failure',
      'rate_limit',
      'issuer_not_available'
    ];
    
    const nonRetryableCodes = [
      'insufficient_funds',
      'stolen_card',
      'lost_card',
      'pickup_card',
      'restricted_card',
      'incorrect_cvc',
      'expired_card',
      'incorrect_number'
    ];

    if (nonRetryableCodes.includes(failureCode)) return false;
    if (retryableCodes.includes(failureCode)) return true;
    
    // Default to retryable for unknown codes
    return true;
  }

  /**
   * Get current retry count for a payment intent
   */
  async getPaymentRetryCount(paymentIntentId) {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('retry_count')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !payments.length) return 0;
      return payments[0].retry_count || 0;
    } catch (error) {
      logger.warn('Error getting payment retry count:', error);
      return 0;
    }
  }

  /**
   * Schedule payment retry with exponential backoff
   */
  async schedulePaymentRetry(paymentIntentId, retryCount) {
    try {
      const retryDelay = Math.min(
        this.retryDelayMs * Math.pow(2, retryCount - 1),
        this.maxRetryDelayMs
      );

      const retryAt = new Date(Date.now() + retryDelay).toISOString();

      logger.info(`Scheduling payment retry ${retryCount} for ${paymentIntentId} at ${retryAt}`);

      // Store retry schedule in database
      await supabase
        .from('payment_retries')
        .insert({
          payment_intent_id: paymentIntentId,
          retry_count: retryCount,
          scheduled_at: retryAt,
          status: 'pending'
        });

      // In a production system, you would use a job queue here
      // For now, we'll implement a simple setTimeout (not recommended for production)
      setTimeout(async () => {
        await this.executePaymentRetry(paymentIntentId, retryCount);
      }, retryDelay);

    } catch (error) {
      logger.error('Error scheduling payment retry:', error);
    }
  }

  /**
   * Execute scheduled payment retry
   */
  async executePaymentRetry(paymentIntentId, retryCount) {
    try {
      logger.info(`Executing payment retry ${retryCount} for ${paymentIntentId}`);

      // Retrieve current payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Check if payment has succeeded in the meantime
      if (paymentIntent.status === 'succeeded') {
        await this.handleSuccessfulPayment(paymentIntent);
        return;
      }

      // Update retry status
      await supabase
        .from('payment_retries')
        .update({ status: 'executed', executed_at: new Date().toISOString() })
        .eq('payment_intent_id', paymentIntentId)
        .eq('retry_count', retryCount);

      // Attempt to confirm payment intent again
      if (paymentIntent.status === 'requires_payment_method') {
        // Notify user to update payment method
        const crawlerId = paymentIntent.metadata.crawler_id;
        const { data: crawler } = await supabase
          .from('crawlers')
          .select('email')
          .eq('id', crawlerId)
          .single();

        if (crawler?.email) {
          await this.sendPaymentNotification(crawler.email, {
            type: 'retry_requires_action',
            paymentId: paymentIntentId,
            retryCount,
            amount: paymentIntent.amount / 100
          });
        }
      }

    } catch (error) {
      logger.error('Error executing payment retry:', error);
    }
  }

  /**
   * Handle payment disputes and chargebacks
   */
  async handlePaymentDispute(disputeData) {
    try {
      const chargeId = disputeData.charge;
      const paymentIntentId = disputeData.payment_intent;
      const disputeReason = disputeData.reason;
      const disputeAmount = disputeData.amount;

      logger.info(`Processing payment dispute: ${disputeData.id} for charge ${chargeId}`);

      // Find the associated payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (paymentError || !payment) {
        logger.error('Payment not found for dispute:', paymentIntentId);
        return;
      }

      // Record the dispute
      await supabase
        .from('payment_disputes')
        .insert({
          stripe_dispute_id: disputeData.id,
          payment_id: payment.id,
          crawler_id: payment.crawler_id,
          dispute_reason: disputeReason,
          dispute_amount: disputeAmount / 100,
          status: disputeData.status,
          evidence_due_by: disputeData.evidence_details?.due_by,
          created_at: new Date().toISOString()
        });

      // Freeze disputed credits if available
      if (payment.status === 'completed') {
        await this.freezeDisputedCredits(payment.crawler_id, payment.credits_purchased);
      }

      // Log dispute event
      await this.logPaymentEvent({
        payment_intent_id: paymentIntentId,
        crawler_id: payment.crawler_id,
        event_type: 'payment_disputed',
        dispute_id: disputeData.id,
        dispute_reason: disputeReason,
        dispute_amount: disputeAmount / 100
      });

      return {
        success: true,
        disputeId: disputeData.id,
        creditsFrozen: payment.credits_purchased
      };

    } catch (error) {
      logger.error('Error handling payment dispute:', error);
      throw error;
    }
  }

  /**
   * Freeze credits related to disputed payment
   */
  async freezeDisputedCredits(crawlerId, creditsToFreeze) {
    try {
      const { data: crawler, error: fetchError } = await supabase
        .from('crawlers')
        .select('credits, frozen_credits')
        .eq('id', crawlerId)
        .single();

      if (fetchError || !crawler) {
        throw new Error('Crawler not found for credit freeze');
      }

      const newFrozenCredits = (crawler.frozen_credits || 0) + creditsToFreeze;
      const newAvailableCredits = Math.max(0, crawler.credits - creditsToFreeze);

      await supabase
        .from('crawlers')
        .update({
          credits: newAvailableCredits,
          frozen_credits: newFrozenCredits
        })
        .eq('id', crawlerId);

      logger.info(`Froze ${creditsToFreeze} credits for crawler ${crawlerId} due to dispute`);

    } catch (error) {
      logger.error('Error freezing disputed credits:', error);
      throw error;
    }
  }

  /**
   * Process refund with comprehensive tracking
   */
  async processRefund(paymentIntentId, amount, reason = 'requested_by_customer') {
    try {
      logger.info(`Processing refund for payment intent: ${paymentIntentId}, amount: ${amount}`);

      // Get original payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment not found for refund');
      }

      // Create Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount * 100, // Convert to cents
        reason,
        metadata: {
          crawler_id: payment.crawler_id,
          original_credits: payment.credits_purchased,
          refund_reason: reason
        }
      });

      // Calculate credits to deduct
      const creditsToDeduct = Math.round((amount / payment.amount_usd) * payment.credits_purchased);

      // Update crawler credits
      const { data: crawler, error: crawlerError } = await supabase
        .from('crawlers')
        .select('credits')
        .eq('id', payment.crawler_id)
        .single();

      if (crawlerError || !crawler) {
        throw new Error('Crawler not found for refund processing');
      }

      await supabase
        .from('crawlers')
        .update({
          credits: Math.max(0, crawler.credits - creditsToDeduct)
        })
        .eq('id', payment.crawler_id);

      // Record refund transaction
      await supabase
        .from('refunds')
        .insert({
          payment_id: payment.id,
          stripe_refund_id: refund.id,
          crawler_id: payment.crawler_id,
          refund_amount: amount,
          credits_deducted: creditsToDeduct,
          reason,
          status: refund.status,
          created_at: new Date().toISOString()
        });

      // Log refund event
      await this.logPaymentEvent({
        payment_intent_id: paymentIntentId,
        crawler_id: payment.crawler_id,
        event_type: 'refund_processed',
        refund_id: refund.id,
        refund_amount: amount,
        credits_deducted: creditsToDeduct,
        reason
      });

      logger.info(`Refund processed: ${refund.id} for crawler ${payment.crawler_id}`);

      return {
        success: true,
        refundId: refund.id,
        refundAmount: amount,
        creditsDeducted: creditsToDeduct,
        newCreditBalance: Math.max(0, crawler.credits - creditsToDeduct)
      };

    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Send payment-related notifications
   */
  async sendPaymentNotification(email, notificationData) {
    try {
      // In a production system, you would integrate with an email service
      // For now, we'll just log the notification
      logger.info(`Payment notification to ${email}:`, notificationData);
      
      // Store notification in database for tracking
      await supabase
        .from('payment_notifications')
        .insert({
          recipient_email: email,
          notification_type: notificationData.type,
          notification_data: notificationData,
          status: 'sent',
          created_at: new Date().toISOString()
        });

    } catch (error) {
      logger.error('Error sending payment notification:', error);
    }
  }

  /**
   * Log payment events for auditing and analytics
   */
  async logPaymentEvent(eventData) {
    try {
      await supabase
        .from('payment_events')
        .insert({
          ...eventData,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      logger.warn('Failed to log payment event:', error);
    }
  }

  /**
   * Get comprehensive payment analytics
   */
  async getPaymentAnalytics(crawlerId, timeframe = '30d') {
    try {
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
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('crawler_id', crawlerId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch payment analytics: ${error.message}`);
      }

      const analytics = {
        period: {
          timeframe,
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        },
        summary: {
          totalPayments: payments.length,
          successfulPayments: payments.filter(p => p.status === 'completed').length,
          failedPayments: payments.filter(p => p.status === 'failed').length,
          totalAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount_usd, 0),
          totalCredits: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.credits_purchased, 0),
          averagePaymentAmount: 0,
          successRate: 0
        },
        trends: {
          dailyVolume: [],
          paymentMethods: {},
          failureReasons: {}
        }
      };

      // Calculate averages and rates
      if (analytics.summary.successfulPayments > 0) {
        analytics.summary.averagePaymentAmount = analytics.summary.totalAmount / analytics.summary.successfulPayments;
      }
      
      if (analytics.summary.totalPayments > 0) {
        analytics.summary.successRate = (analytics.summary.successfulPayments / analytics.summary.totalPayments) * 100;
      }

      // Analyze failure reasons
      payments.filter(p => p.status === 'failed').forEach(payment => {
        const reason = payment.failure_code || 'unknown';
        analytics.trends.failureReasons[reason] = (analytics.trends.failureReasons[reason] || 0) + 1;
      });

      // Analyze payment methods
      payments.filter(p => p.status === 'completed').forEach(payment => {
        const method = payment.payment_method || 'unknown';
        analytics.trends.paymentMethods[method] = (analytics.trends.paymentMethods[method] || 0) + 1;
      });

      return analytics;

    } catch (error) {
      logger.error('Error generating payment analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentProcessor = new PaymentProcessor();