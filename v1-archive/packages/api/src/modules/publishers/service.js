import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '../../shared/supabase.js';
import { AppError } from '../../shared/errors.js';

const supabase = () => getSupabaseClient();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

const BASE_FIELDS = `
  id,
  name,
  domain,
  email,
  description,
  website_url,
  contact_email,
  price_per_request,
  rate_limit_per_hour,
  status,
  total_earnings,
  total_requests,
  created_at,
  updated_at
`;

const MANAGEMENT_TOKEN_FIELD = 'management_token_hash';

const generateManagementToken = () => {
  const token = crypto.randomBytes(24).toString('hex');
  return {
    token,
    hash: bcrypt.hashSync(token, BCRYPT_ROUNDS)
  };
};

const normalizeDomain = (value) => {
  if (!value || typeof value !== 'string') {
    throw new AppError('Domain is required', 400);
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    throw new AppError('Domain is required', 400);
  }

  return trimmed.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
};

const normalizeEmail = (value, field = 'email') => {
  if (!value || typeof value !== 'string') {
    throw new AppError(`${field} is required`, 400);
  }

  const trimmed = value.trim().toLowerCase();
  if (!/\S+@\S+\.\S+/.test(trimmed)) {
    throw new AppError(`Invalid ${field}`, 400);
  }
  return trimmed;
};

const normalizePrice = (value) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new AppError('Price per request must be greater than zero', 400);
  }
  return numeric;
};

const formatPublisher = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    email: row.email,
    description: row.description,
    websiteUrl: row.website_url,
    contactEmail: row.contact_email,
    pricePerRequest: row.price_per_request,
    rateLimitPerHour: row.rate_limit_per_hour,
    status: row.status,
    totalEarnings: row.total_earnings,
    totalRequests: row.total_requests,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const listPublishers = async ({ limit = 20, offset = 0 } = {}) => {
  const { data, error } = await supabase()
    .from('publishers')
    .select(BASE_FIELDS)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new AppError('Failed to load publishers', 500, error);
  }

  return data.map(formatPublisher);
};

export const getPublisherById = async (id) => {
  if (!id) {
    throw new AppError('Publisher id is required', 400);
  }

  const { data, error } = await supabase()
    .from('publishers')
    .select(BASE_FIELDS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to load publisher', 500, error);
  }

  if (!data) {
    throw new AppError('Publisher not found', 404);
  }

  return formatPublisher(data);
};

export const registerPublisher = async (input) => {
  const normalizedDomain = normalizeDomain(input.domain);
  const email = normalizeEmail(input.email);
  const contactEmail = normalizeEmail(input.contactEmail || input.email, 'contact email');
  const pricePerRequest = normalizePrice(input.pricePerRequest || input.defaultPrice);

  const supa = supabase();

  const { data: existing, error: existingError } = await supa
    .from('publishers')
    .select('id')
    .eq('domain', normalizedDomain)
    .maybeSingle();

  if (existingError) {
    throw new AppError('Failed to check existing publishers', 500, existingError);
  }

  if (existing) {
    throw new AppError('Publisher with this domain already exists', 409);
  }

  const payload = {
    name: input.name?.trim(),
    domain: normalizedDomain,
    email,
    description: input.description?.trim() || null,
    website_url: input.websiteUrl?.trim() || null,
    contact_email: contactEmail,
    price_per_request: pricePerRequest,
    rate_limit_per_hour: input.rateLimitPerHour || 1000,
    status: 'pending'
  };

  if (!payload.name) {
    throw new AppError('Name is required', 400);
  }

  const managementToken = generateManagementToken();
  payload[MANAGEMENT_TOKEN_FIELD] = managementToken.hash;

  const { data, error } = await supa
    .from('publishers')
    .insert(payload)
    .select(BASE_FIELDS)
    .single();

  if (error) {
    throw new AppError('Failed to register publisher', 500, error);
  }

  return {
    publisher: formatPublisher(data),
    managementToken: managementToken.token
  };
};

export const updatePublisher = async (id, updates, { managementToken } = {}) => {
  if (!id) {
    throw new AppError('Publisher id is required', 400);
  }

  if (!managementToken) {
    throw new AppError('Management token is required to update publisher details', 401);
  }

  const supa = supabase();

  const { data: stored, error: lookupError } = await supa
    .from('publishers')
    .select(MANAGEMENT_TOKEN_FIELD)
    .eq('id', id)
    .maybeSingle();

  if (lookupError) {
    throw new AppError('Failed to verify publisher access', 500, lookupError);
  }

  if (!stored) {
    throw new AppError('Publisher not found', 404);
  }

  const match = await bcrypt.compare(managementToken, stored[MANAGEMENT_TOKEN_FIELD]);
  if (!match) {
    throw new AppError('Invalid management token', 401);
  }

  const payload = {};

  if (updates.name) {
    payload.name = updates.name.trim();
  }

  if (updates.domain) {
    payload.domain = normalizeDomain(updates.domain);
  }

  if (updates.email) {
    payload.email = normalizeEmail(updates.email);
  }

  if (typeof updates.description !== 'undefined') {
    payload.description = updates.description?.trim() || null;
  }

  if (typeof updates.websiteUrl !== 'undefined') {
    payload.website_url = updates.websiteUrl?.trim() || null;
  }

  if (typeof updates.contactEmail !== 'undefined') {
    payload.contact_email = normalizeEmail(updates.contactEmail, 'contact email');
  }

  if (typeof updates.pricePerRequest !== 'undefined') {
    payload.price_per_request = normalizePrice(updates.pricePerRequest);
  }

  if (typeof updates.rateLimitPerHour !== 'undefined') {
    const rate = Number(updates.rateLimitPerHour);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new AppError('rateLimitPerHour must be greater than zero', 400);
    }
    payload.rate_limit_per_hour = rate;
  }

  if (Object.keys(payload).length === 0) {
    throw new AppError('No updates provided', 400);
  }

  payload.updated_at = new Date().toISOString();

  const { data, error } = await supa
    .from('publishers')
    .update(payload)
    .eq('id', id)
    .select(BASE_FIELDS)
    .single();

  if (error) {
    throw new AppError('Failed to update publisher', 500, error);
  }

  return formatPublisher(data);
};
