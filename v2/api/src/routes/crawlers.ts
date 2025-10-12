import {Router} from 'express';
import {supabase} from '../db.js';
import crypto from 'crypto';

export const crawlersRouter = Router();

// Register a new crawler
crawlersRouter.post('/register', async (req, res) => {
  try {
    const {name, email, walletAddress} = req.body;

    if (!name || !email || !walletAddress) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    // Generate API key
    const apiKey = 'tk_' + crypto.randomBytes(24).toString('hex');

    // Create crawler
    const {data, error} = await supabase
      .from('crawlers')
      .insert({
        name,
        email,
        wallet_address: walletAddress,
        api_key: apiKey,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({success: true, crawler: data, apiKey});
  } catch (error: any) {
    console.error('Crawler registration error:', error);
    res.status(500).json({error: 'Registration failed', message: error.message});
  }
});

// Get all crawlers
crawlersRouter.get('/', async (_req, res) => {
  try {
    const {data, error} = await supabase
      .from('crawlers')
      .select('id, name, wallet_address, total_spent, total_requests')
      .eq('status', 'active')
      .order('created_at', {ascending: false});

    if (error) throw error;

    res.json({success: true, crawlers: data});
  } catch (error: any) {
    res.status(500).json({error: 'Failed to fetch crawlers', message: error.message});
  }
});

// Get crawler by ID
crawlersRouter.get('/:id', async (req, res) => {
  try {
    const {data, error} = await supabase.from('crawlers').select('*').eq('id', req.params.id).single();

    if (error) throw error;
    if (!data) return res.status(404).json({error: 'Crawler not found'});

    // Don't expose API key
    const {api_key, ...crawler} = data;

    res.json({success: true, crawler});
  } catch (error: any) {
    res.status(500).json({error: 'Failed to fetch crawler', message: error.message});
  }
});
