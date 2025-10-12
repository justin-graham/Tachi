import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '../../shared/supabase.js';
import { AppError } from '../../shared/errors.js';

const API_KEY_PREFIX = process.env.CRAWLER_API_KEY_PREFIX || 'ck';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

const supabase = () => getSupabaseClient();

const BASE_FIELDS = `
  id,
  name,
  email,
  company,
  type,
  credits,
  created_at,
  updated_at,
  api_key_id,
  last_authenticated_at
`;

const formatCrawler = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    type: row.type,
    credits: row.credits ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    apiKeyId: row.api_key_id,
    lastAuthenticatedAt: row.last_authenticated_at
  };
};

const normalizeEmail = (value) => {
  if (!value || typeof value !== 'string') {
    throw new AppError('Email is required', 400);
  }
  const trimmed = value.trim().toLowerCase();
  if (!/\S+@\S+\.\S+/.test(trimmed)) {
    throw new AppError('Invalid email address', 400);
  }
  return trimmed;
};

const generateApiKey = () => {
  const keyId = crypto.randomUUID();
  const secret = crypto.randomBytes(24).toString('hex');
  const apiKey = `${API_KEY_PREFIX}_${keyId}_${secret}`;
  const hash = bcrypt.hashSync(secret, BCRYPT_ROUNDS);
  return { apiKey, keyId, hash };
};

export const registerCrawler = async (input = {}) => {
  const email = normalizeEmail(input.email);
  const name = input.companyName || input.name || 'Crawler';
  const company = input.companyName?.trim() || null;
  const type = input.type?.trim() || 'individual';

  const supa = supabase();

  const { data: existing, error: existingError } = await supa
    .from('crawlers')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingError) {
    throw new AppError('Failed to check existing crawler', 500, existingError);
  }

  if (existing) {
    throw new AppError('Crawler with this email already exists', 409);
  }

  const { apiKey, keyId, hash } = generateApiKey();

  const payload = {
    name,
    email,
    company,
    type,
    credits: 0,
    api_key_id: keyId,
    api_key_secret_hash: hash
  };

  const { data, error } = await supa
    .from('crawlers')
    .insert(payload)
    .select(BASE_FIELDS)
    .single();

  if (error) {
    throw new AppError('Failed to register crawler', 500, error);
  }

  return {
    crawler: formatCrawler(data),
    apiKey
  };
};

export const getCrawlerById = async (id) => {
  if (!id) {
    throw new AppError('Crawler id is required', 400);
  }

  const { data, error } = await supabase()
    .from('crawlers')
    .select(BASE_FIELDS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to load crawler', 500, error);
  }

  if (!data) {
    throw new AppError('Crawler not found', 404);
  }

  return formatCrawler(data);
};

export const addCrawlerCredits = async (id, amount) => {
  if (!id) {
    throw new AppError('Crawler id is required', 400);
  }

  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new AppError('Credit amount must be greater than zero', 400);
  }

  const supa = supabase();

  const { data: current, error: currentError } = await supa
    .from('crawlers')
    .select('credits')
    .eq('id', id)
    .maybeSingle();

  if (currentError) {
    throw new AppError('Failed to load crawler credits', 500, currentError);
  }

  if (!current) {
    throw new AppError('Crawler not found', 404);
  }

  const newCredits = (current.credits || 0) + numeric;

  const { data, error } = await supa
    .from('crawlers')
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(BASE_FIELDS)
    .single();

  if (error) {
    throw new AppError('Failed to update credits', 500, error);
  }

  return formatCrawler(data);
};
