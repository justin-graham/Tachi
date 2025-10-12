import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '../../shared/supabase.js';
import { AppError } from '../../shared/errors.js';
import { signToken } from '../../shared/auth.js';

const API_KEY_PREFIX = process.env.CRAWLER_API_KEY_PREFIX || 'ck';

const parseApiKey = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new AppError('API key is required', 400);
  }

  const parts = apiKey.trim().split('_');
  if (parts.length < 3) {
    throw new AppError('Invalid API key', 401);
  }

  const [prefix, keyId, ...secretParts] = parts;
  if (prefix !== API_KEY_PREFIX) {
    throw new AppError('Invalid API key prefix', 401);
  }

  const secret = secretParts.join('_');
  if (!secret) {
    throw new AppError('Invalid API key secret', 401);
  }

  return { keyId, secret };
};

export const issueToken = async (apiKey, context = {}) => {
  const { keyId, secret } = parseApiKey(apiKey);
  const supabase = getSupabaseClient();

  const { data: crawler, error } = await supabase
    .from('crawlers')
    .select('id, api_key_secret_hash')
    .eq('api_key_id', keyId)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to verify API key', 500, error);
  }

  if (!crawler || !crawler.api_key_secret_hash) {
    throw new AppError('Invalid API key', 401);
  }

  const matches = await bcrypt.compare(secret, crawler.api_key_secret_hash);
  if (!matches) {
    throw new AppError('Invalid API key', 401);
  }

  await supabase
    .from('crawlers')
    .update({
      last_authenticated_at: new Date().toISOString(),
      last_authenticated_ip: context.ip || null,
      last_authenticated_user_agent: context.userAgent || null
    })
    .eq('id', crawler.id);

  const token = signToken({
    sub: crawler.id,
    role: 'crawler',
    crawlerId: crawler.id
  });

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  };
};
