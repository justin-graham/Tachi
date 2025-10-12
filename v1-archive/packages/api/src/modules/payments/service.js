import Stripe from 'stripe';
import { getSupabaseClient } from '../../shared/supabase.js';
import { AppError } from '../../shared/errors.js';

const supabase = () => getSupabaseClient();

let stripeClient;

const getStripe = () => {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new AppError('Stripe is not configured', 503);
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secret, {
      apiVersion: '2023-10-16'
    });
  }

  return stripeClient;
};

const toCents = (amount) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new AppError('Amount must be greater than zero', 400);
  }
  return Math.round(numeric * 100);
};

const centsToCredits = (amountInCents) => {
  return amountInCents / 100;
};

export const createPaymentIntent = async ({ crawlerId, amount, currency = 'usd' }) => {
  if (!crawlerId) {
    throw new AppError('crawlerId is required', 400);
  }

  const supa = supabase();

  const { data: crawler, error: crawlerError } = await supa
    .from('crawlers')
    .select('id')
    .eq('id', crawlerId)
    .maybeSingle();

  if (crawlerError) {
    throw new AppError('Failed to verify crawler', 500, crawlerError);
  }

  if (!crawler) {
    throw new AppError('Crawler not found', 404);
  }

  const amountInCents = toCents(amount);
  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    automatic_payment_methods: {
      enabled: true
    },
    metadata: {
      crawler_id: crawlerId
    }
  });

  const record = {
    crawler_id: crawlerId,
    amount_cents: amountInCents,
    currency,
    status: 'pending',
    stripe_payment_intent_id: paymentIntent.id,
    created_at: new Date().toISOString()
  };

  const { error: insertError } = await supa
    .from('payments')
    .insert(record);

  if (insertError) {
    throw new AppError('Failed to record payment intent', 500, insertError);
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  };
};

export const handleStripeWebhook = async (signature, payloadBuffer) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new AppError('Stripe webhook secret not configured', 503);
  }

  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(payloadBuffer, signature, webhookSecret);
  } catch (error) {
    throw new AppError(`Webhook signature verification failed: ${error.message}`, 400);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    await markPaymentSucceeded(intent);
  } else if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    await markPaymentFailed(intent);
  }

  return { received: true };
};

const markPaymentSucceeded = async (intent) => {
  const supa = supabase();
  const { data: payment, error } = await supa
    .from('payments')
    .select('id, status, crawler_id, amount_cents')
    .eq('stripe_payment_intent_id', intent.id)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to load payment record', 500, error);
  }

  if (!payment) {
    return;
  }

  if (payment.status === 'succeeded') {
    return;
  }

  const creditsToAdd = centsToCredits(intent.amount_received || payment.amount_cents);

  const updates = [
    supa
      .from('payments')
      .update({
        status: 'succeeded',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', payment.id),
    addCredits(payment.crawler_id, creditsToAdd)
  ];

  await Promise.all(updates);
};

const markPaymentFailed = async (intent) => {
  const supa = supabase();
  await supa
    .from('payments')
    .update({
      status: 'failed',
      failed_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', intent.id);
};

const addCredits = async (crawlerId, amount) => {
  const supa = supabase();

  const { data: crawler, error } = await supa
    .from('crawlers')
    .select('credits')
    .eq('id', crawlerId)
    .maybeSingle();

  if (error || !crawler) {
    throw new AppError('Failed to update crawler credits', 500, error);
  }

  const newCredits = (crawler.credits || 0) + amount;

  const { error: updateError } = await supa
    .from('crawlers')
    .update({
      credits: newCredits,
      updated_at: new Date().toISOString()
    })
    .eq('id', crawlerId);

  if (updateError) {
    throw new AppError('Failed to apply credits', 500, updateError);
  }
};

export const listPayments = async (crawlerId, { limit = 20, offset = 0 } = {}) => {
  const { data, error } = await supabase()
    .from('payments')
    .select('id, amount_cents, currency, status, created_at, confirmed_at')
    .eq('crawler_id', crawlerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new AppError('Failed to load payments', 500, error);
  }

  return data.map((payment) => ({
    id: payment.id,
    amount: centsToCredits(payment.amount_cents),
    currency: payment.currency,
    status: payment.status,
    createdAt: payment.created_at,
    confirmedAt: payment.confirmed_at
  }));
};

export const getCrawlerBalance = async (crawlerId) => {
  const { data, error } = await supabase()
    .from('crawlers')
    .select('credits')
    .eq('id', crawlerId)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to load crawler balance', 500, error);
  }

  if (!data) {
    throw new AppError('Crawler not found', 404);
  }

  return {
    credits: data.credits || 0
  };
};
