// API service for Tachi Pay-Per-Crawl backend
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tachi_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('tachi_auth_token');
      // Redirect to login if needed
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  async registerPublisher(data) {
    const response = await api.post('/api/publishers/register', data);
    if (response.data.token) {
      localStorage.setItem('tachi_auth_token', response.data.token);
    }
    return response.data;
  },

  async loginPublisher(credentials) {
    const response = await api.post('/api/publishers/auth', credentials);
    if (response.data.token) {
      localStorage.setItem('tachi_auth_token', response.data.token);
    }
    return response.data;
  },

  async getProfile(publisherId) {
    const response = await api.get(`/api/publishers/profile/${publisherId}`);
    return response.data;
  },

  logout() {
    localStorage.removeItem('tachi_auth_token');
  },
};

// Publishers service
export const publishersService = {
  async getDirectory() {
    const response = await api.get('/api/publishers/directory');
    return response.data;
  },

  async updateProfile(publisherId, data) {
    const response = await api.put(`/api/publishers/profile/${publisherId}`, data);
    return response.data;
  },

  async uploadContent(domain, content) {
    const response = await api.post(`/api/content/upload/${domain}`, content);
    return response.data;
  },
};

// Crawlers service
export const crawlersService = {
  async registerCrawler(data) {
    const response = await api.post('/api/crawlers/register', data);
    return response.data;
  },

  async authenticateCrawler(apiKey) {
    const response = await api.post('/api/crawlers/auth', { apiKey });
    return response.data;
  },

  async getProfile(crawlerId) {
    const response = await api.get(`/api/crawlers/profile/${crawlerId}`);
    return response.data;
  },

  async addCredits(crawlerId, amount, paymentMethod) {
    const response = await api.post('/api/crawlers/credits/add', {
      crawlerId,
      amount,
      paymentMethod,
    });
    return response.data;
  },
};

// Content service
export const contentService = {
  async getContent(domain, path, options = {}) {
    const response = await api.get(`/api/content/${domain}/${path}`, {
      params: options,
    });
    return response.data;
  },

  async getPricing(domain) {
    const response = await api.get(`/api/content/pricing/${domain}`);
    return response.data;
  },

  async batchRequest(requests) {
    const response = await api.post('/api/content/batch', { requests });
    return response.data;
  },
};

// Analytics service
export const analyticsService = {
  async getCrawlerAnalytics(crawlerId, period = '7d') {
    const response = await api.get(`/api/analytics/crawler/${crawlerId}`, {
      params: { period },
    });
    return response.data;
  },

  async getPublisherAnalytics(publisherId, period = '7d') {
    const response = await api.get(`/api/analytics/publisher/${publisherId}`, {
      params: { period },
    });
    return response.data;
  },

  async getPlatformAnalytics(period = '7d') {
    const response = await api.get('/api/analytics/platform', {
      params: { period },
    });
    return response.data;
  },
};

// Payments service
export const paymentsService = {
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    const response = await api.post('/api/payments/create-payment-intent', {
      amount,
      currency,
      metadata,
    });
    return response.data;
  },

  async getPaymentHistory(page = 1, limit = 10) {
    const response = await api.get('/api/payments/history', {
      params: { page, limit },
    });
    return response.data;
  },

  async getBalance() {
    const response = await api.get('/api/payments/balance');
    return response.data;
  },

  async setupPayout(accountDetails) {
    const response = await api.post('/api/payments/setup-payout', accountDetails);
    return response.data;
  },
};

// Health check
export const healthService = {
  async check() {
    const response = await api.get('/health');
    return response.data;
  },
};

// Export the configured axios instance for custom requests
export { api };

export default {
  auth: authService,
  publishers: publishersService,
  crawlers: crawlersService,
  content: contentService,
  analytics: analyticsService,
  payments: paymentsService,
  health: healthService,
};
