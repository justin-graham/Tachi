import crypto from 'crypto';
import { getSupabaseClient } from '../../shared/supabase.js';
import { AppError } from '../../shared/errors.js';

const DEFAULT_PRICE = Number(process.env.DEFAULT_CONTENT_PRICE || '1');
const FETCH_TIMEOUT_MS = parseInt(process.env.CONTENT_FETCH_TIMEOUT || '15000', 10);

const supabase = () => getSupabaseClient();

const sanitizeDomain = (domain) => {
  if (!domain || typeof domain !== 'string') {
    throw new AppError('Domain is required', 400);
  }

  const trimmed = domain.trim().toLowerCase();
  const pattern = /^[a-z0-9.-]+$/;

  if (!pattern.test(trimmed)) {
    throw new AppError('Invalid domain', 400);
  }

  if (trimmed === 'localhost' || trimmed.endsWith('.localhost')) {
    throw new AppError('Local domains are not allowed', 400);
  }

  const ipv4Pattern = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(trimmed)) {
    throw new AppError('IP addresses are not allowed', 400);
  }

  return trimmed;
};

const buildTargetUrl = (domain, path = '', query = {}) => {
  const normalizedPath = path.replace(/^\//, '');
  const url = new URL(`https://${domain}/${normalizedPath}`);

  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (typeof value === 'undefined') return;
    params.append(key, String(value));
  });

  const qs = params.toString();
  if (qs) {
    url.search = qs;
  }

  return url.toString();
};

const fetchPublisherByDomain = async (domain) => {
  const { data, error } = await supabase()
    .from('publishers')
    .select('id, price_per_request, status')
    .eq('domain', domain)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to load publisher', 500, error);
  }

  if (!data || data.status !== 'active') {
    throw new AppError('Publisher not found or inactive', 404);
  }

  return data;
};

const loadCrawler = async (crawlerId) => {
  const { data, error } = await supabase()
    .from('crawlers')
    .select('credits')
    .eq('id', crawlerId)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to load crawler', 500, error);
  }

  if (!data) {
    throw new AppError('Crawler not found', 404);
  }

  return data;
};

const updateCredits = async (crawlerId, newCredits) => {
  const { error } = await supabase()
    .from('crawlers')
    .update({
      credits: newCredits,
      updated_at: new Date().toISOString()
    })
    .eq('id', crawlerId);

  if (error) {
    throw new AppError('Failed to update crawler credits', 500, error);
  }
};

const logContentRequest = async (payload) => {
  const { error } = await supabase()
    .from('content_requests')
    .insert(payload);

  if (error && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('Failed to log content request', error);
  }
};

const fetchWithTimeout = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': process.env.CONTENT_USER_AGENT || 'TachiFetcher/1.0',
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });

    const body = await response.text();
    const duration = Date.now() - start;

    return { response, body, duration };
  } finally {
    clearTimeout(timer);
  }
};

export const getContentPricing = async (domain) => {
  const sanitized = sanitizeDomain(domain);
  const publisher = await fetchPublisherByDomain(sanitized);

  return {
    domain: sanitized,
    pricePerRequest: publisher.price_per_request || DEFAULT_PRICE,
    currency: 'credits'
  };
};

export const fetchContent = async ({ domain, path = '', query = {}, user }) => {
  if (!user?.crawlerId) {
    throw new AppError('Crawler authentication required', 401);
  }

  const sanitizedDomain = sanitizeDomain(domain);
  const publisher = await fetchPublisherByDomain(sanitizedDomain);
  const price = publisher.price_per_request || DEFAULT_PRICE;
  const targetUrl = buildTargetUrl(sanitizedDomain, path, query);

  const crawler = await loadCrawler(user.crawlerId);

  const remaining = Number(crawler.credits || 0);
  if (remaining < price) {
    throw new AppError('Insufficient credits', 402);
  }

  const updatedCredits = Number((remaining - price).toFixed(4));
  await updateCredits(user.crawlerId, updatedCredits);

  const requestId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  try {
    const { response, body, duration } = await fetchWithTimeout(targetUrl);

    await logContentRequest({
      id: requestId,
      crawler_id: user.crawlerId,
      publisher_id: publisher.id,
      url: targetUrl,
      status: 'succeeded',
      response_status: response.status,
      response_time_ms: duration,
      price_paid: price,
      fetched_at: startedAt
    });

    return {
      success: true,
      statusCode: response.status,
      data: {
        url: targetUrl,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        body
      },
      creditsRemaining: updatedCredits
    };
  } catch (error) {
    await updateCredits(user.crawlerId, remaining);
    await logContentRequest({
      id: requestId,
      crawler_id: user.crawlerId,
      publisher_id: publisher.id,
      url: targetUrl,
      status: 'failed',
      error_message: error.message,
      price_paid: 0,
      fetched_at: startedAt
    });

    throw new AppError('Failed to fetch content from publisher', 502);
  }
};

export const fetchContentBatch = async (requests, { user } = {}) => {
  if (!Array.isArray(requests) || requests.length === 0) {
    throw new AppError('Requests array must be provided', 400);
  }

  const results = [];

  for (const entry of requests) {
    try {
      const result = await fetchContent({
        domain: entry.domain,
        path: entry.path || '',
        query: entry.query || {},
        user
      });

      results.push({ success: true, data: result.data, statusCode: result.statusCode });
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        statusCode: error.status || 500
      });
    }
  }

  return { results };
};
