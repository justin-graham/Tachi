import {Router} from 'express';
import {supabase} from '../db.js';
import {validatePublisherRegistration, validatePublisherUpdate} from '../utils/validation.js';

export const publishersRouter = Router();

// Register a new publisher
publishersRouter.post('/register', async (req, res) => {
  try {
    // Validate input
    const validation = validatePublisherRegistration(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const {domain, name, email, pricePerRequest, walletAddress} = req.body;

    // Check if domain already exists
    const {data: existing} = await supabase
      .from('publishers')
      .select('id')
      .eq('domain', domain)
      .single();

    if (existing) {
      return res.status(409).json({error: 'Domain already registered'});
    }

    // Create publisher
    const {data, error} = await supabase
      .from('publishers')
      .insert({
        domain,
        name,
        email,
        price_per_request: pricePerRequest || 0.01,
        wallet_address: walletAddress,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({success: true, publisher: data});
  } catch (error: any) {
    console.error('Publisher registration error:', error);
    res.status(500).json({error: 'Registration failed', message: error.message});
  }
});

// Get all publishers (optionally filter by wallet)
publishersRouter.get('/', async (req, res) => {
  try {
    const {wallet} = req.query;

    let query = supabase
      .from('publishers')
      .select('id, domain, name, price_per_request, wallet_address, total_earnings, total_requests')
      .eq('status', 'active');

    if (wallet) {
      query = query.eq('wallet_address', wallet);
    }

    const {data, error} = await query.order('created_at', {ascending: false});

    if (error) throw error;

    res.json({success: true, publishers: data});
  } catch (error: any) {
    console.error('Get publishers error:', error);
    res.status(500).json({error: 'Failed to fetch publishers', message: error.message});
  }
});

// Get publisher by ID
publishersRouter.get('/:id', async (req, res) => {
  try {
    const {data, error} = await supabase
      .from('publishers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({error: 'Publisher not found'});

    res.json({success: true, publisher: data});
  } catch (error: any) {
    res.status(500).json({error: 'Failed to fetch publisher', message: error.message});
  }
});

// Update publisher
publishersRouter.patch('/:id', async (req, res) => {
  try {
    // Validate input
    const validation = validatePublisherUpdate(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const {pricePerRequest, name, email} = req.body;
    const updates: any = {};

    if (pricePerRequest !== undefined) updates.price_per_request = pricePerRequest;
    if (name) updates.name = name;
    if (email) updates.email = email;

    const {data, error} = await supabase
      .from('publishers')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({success: true, publisher: data});
  } catch (error: any) {
    res.status(500).json({error: 'Update failed', message: error.message});
  }
});
