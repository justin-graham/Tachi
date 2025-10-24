import {Request, Response, NextFunction} from 'express';
import {supabase} from '../db.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    type: 'publisher' | 'crawler';
    walletAddress: string;
  };
}

/**
 * API key authentication middleware
 * Checks Authorization: Bearer <api_key> header against database
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Format: Bearer <api_key>'
      });
    }

    const apiKey = authHeader.substring(7);

    // Check if it's a crawler API key
    const {data: crawler} = await supabase
      .from('crawlers')
      .select('id, wallet_address, status')
      .eq('api_key', apiKey)
      .eq('status', 'active')
      .single();

    if (crawler) {
      req.user = {
        id: crawler.id,
        type: 'crawler',
        walletAddress: crawler.wallet_address
      };
      return next();
    }

    // Check if it's a publisher API key (publishers can also have API keys)
    const {data: publisher} = await supabase
      .from('publishers')
      .select('id, wallet_address, status')
      .eq('wallet_address', apiKey) // For now, publishers can use wallet address as API key
      .eq('status', 'active')
      .single();

    if (publisher) {
      req.user = {
        id: publisher.id,
        type: 'publisher',
        walletAddress: publisher.wallet_address
      };
      return next();
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error'
    });
  }
}

/**
 * Optional authentication - doesn't block if no auth provided
 */
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  return authenticate(req, res, next);
}
