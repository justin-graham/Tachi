import {Router} from 'express';
import {supabase} from '../db.js';

export const paymentsRouter = Router();

// Log a payment
paymentsRouter.post('/log', async (req, res) => {
  try {
    const {txHash, crawlerAddress, publisherAddress, amount} = req.body;

    if (!txHash || !crawlerAddress || !publisherAddress || !amount) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    // Check if payment already logged
    const {data: existing} = await supabase
      .from('payments')
      .select('id')
      .eq('tx_hash', txHash)
      .single();

    if (existing) {
      return res.status(409).json({error: 'Payment already logged'});
    }

    // Log payment
    const {data, error} = await supabase
      .from('payments')
      .insert({
        tx_hash: txHash,
        crawler_address: crawlerAddress,
        publisher_address: publisherAddress,
        amount,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update publisher total earnings
    await supabase.rpc('increment_publisher_earnings', {
      p_wallet_address: publisherAddress,
      p_amount: amount
    });

    // Update crawler total spent
    await supabase.rpc('increment_crawler_spending', {
      c_wallet_address: crawlerAddress,
      c_amount: amount
    });

    res.json({success: true, payment: data});
  } catch (error: any) {
    console.error('Payment logging error:', error);
    res.status(500).json({error: 'Failed to log payment', message: error.message});
  }
});

// Get all payments
paymentsRouter.get('/', async (req, res) => {
  try {
    const {publisherAddress, crawlerAddress, limit = 50} = req.query;

    let query = supabase.from('payments').select('*').order('timestamp', {ascending: false}).limit(Number(limit));

    if (publisherAddress) {
      query = query.eq('publisher_address', publisherAddress);
    }

    if (crawlerAddress) {
      query = query.eq('crawler_address', crawlerAddress);
    }

    const {data, error} = await query;

    if (error) throw error;

    res.json({success: true, payments: data});
  } catch (error: any) {
    res.status(500).json({error: 'Failed to fetch payments', message: error.message});
  }
});
