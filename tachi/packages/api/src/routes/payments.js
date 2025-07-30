import Stripe from 'stripe';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken } from '../middleware/auth.js';
import { createLogger } from '../utils/logger.js';

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
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    const crawlerId = req.user.id;

    if (!amount || amount < 5) {
      return res.status(400).json({ error: 'Minimum purchase is $5' });
    }

    if (amount > 10000) {
      return res.status(400).json({ error: 'Maximum purchase is $10,000' });
    }

    // Get crawler info for metadata
    const { data: crawler } = await supabase
      .from('crawlers')
      .select('email, company_name')
      .eq('id', crawlerId)
      .single();

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata: {
        crawler_id: crawlerId,
        email: crawler?.email || '',
        company_name: crawler?.company_name || '',
        credit_amount: amount // 1 dollar = 1 credit in this example
      },
      description: `Tachi Credits Purchase - ${amount} credits`
    });

    logger.info(`Payment intent created: ${paymentIntent.id} for crawler ${crawlerId}`);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      credits: amount // 1:1 ratio for simplicity
    });

  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Webhook to handle successful payments
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handleFailedPayment(failedPayment);
      break;
    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

async function handleSuccessfulPayment(paymentIntent) {
  try {
    const crawlerId = paymentIntent.metadata.crawler_id;
    const creditAmount = parseInt(paymentIntent.metadata.credit_amount);

    logger.info(`Processing successful payment: ${paymentIntent.id} for crawler ${crawlerId}`);

    // Add credits to crawler account
    const { error: updateError } = await supabase
      .from('crawlers')
      .update({ 
        credits: supabase.raw(`credits + ${creditAmount}`)
      })
      .eq('id', crawlerId);

    if (updateError) {
      logger.error('Error adding credits after payment:', updateError);
      return;
    }

    // Record the payment transaction
    await supabase
      .from('payments')
      .insert({
        crawler_id: crawlerId,
        stripe_payment_intent_id: paymentIntent.id,
        amount_usd: paymentIntent.amount / 100,
        credits_purchased: creditAmount,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    logger.info(`Credits added successfully: ${creditAmount} for crawler ${crawlerId}`);

  } catch (error) {
    logger.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(paymentIntent) {
  try {
    const crawlerId = paymentIntent.metadata.crawler_id;

    logger.info(`Processing failed payment: ${paymentIntent.id} for crawler ${crawlerId}`);

    // Record the failed payment
    await supabase
      .from('payments')
      .insert({
        crawler_id: crawlerId,
        stripe_payment_intent_id: paymentIntent.id,
        amount_usd: paymentIntent.amount / 100,
        credits_purchased: 0,
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
        created_at: new Date().toISOString()
      });

  } catch (error) {
    logger.error('Error handling failed payment:', error);
  }
}

// Get payment history for crawler
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const crawlerId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('crawler_id', crawlerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching payment history:', error);
      return res.status(500).json({ error: 'Failed to fetch payment history' });
    }

    res.json({
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount_usd,
        credits: p.credits_purchased,
        status: p.status,
        createdAt: p.created_at,
        failureReason: p.failure_reason
      })),
      pagination: {
        limit,
        offset,
        total: payments.length
      }
    });

  } catch (error) {
    logger.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current credit balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const crawlerId = req.user.id;

    const { data: crawler, error } = await supabase
      .from('crawlers')
      .select('credits, total_spent')
      .eq('id', crawlerId)
      .single();

    if (error || !crawler) {
      return res.status(404).json({ error: 'Crawler not found' });
    }

    res.json({
      credits: crawler.credits,
      totalSpent: crawler.total_spent || 0
    });

  } catch (error) {
    logger.error('Error fetching credit balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// For publishers: Get earnings and setup payout
router.post('/setup-payout', authenticateToken, async (req, res) => {
  try {
    const publisherId = req.user.id;
    const { accountType = 'express' } = req.body;

    if (req.user.type !== 'publisher') {
      return res.status(403).json({ error: 'Publisher access required' });
    }

    // Get publisher info
    const { data: publisher } = await supabase
      .from('publishers')
      .select('email, name')
      .eq('id', publisherId)
      .single();

    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: publisher.email,
      business_profile: {
        name: publisher.name
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });

    // Save Stripe account ID
    await supabase
      .from('publishers')
      .update({ stripe_account_id: account.id })
      .eq('id', publisherId);

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/dashboard/payout/refresh`,
      return_url: `${process.env.FRONTEND_URL}/dashboard/payout/complete`,
      type: 'account_onboarding'
    });

    logger.info(`Payout setup initiated for publisher ${publisherId}`);

    res.json({
      accountId: account.id,
      onboardingUrl: accountLink.url
    });

  } catch (error) {
    logger.error('Error setting up payout:', error);
    res.status(500).json({ error: 'Failed to setup payout' });
  }
});

export default router;
