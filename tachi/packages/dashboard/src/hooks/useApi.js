// React hooks for Tachi API integration
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../lib/api';

// Auth hooks
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('tachi_auth_token');
    setIsAuthenticated(!!token);
  }, []);

  const login = useMutation({
    mutationFn: apiService.auth.loginPublisher,
    onSuccess: (data) => {
      setIsAuthenticated(true);
      setUser(data.publisher);
    },
    onError: () => {
      setIsAuthenticated(false);
      setUser(null);
    },
  });

  const register = useMutation({
    mutationFn: apiService.auth.registerPublisher,
    onSuccess: (data) => {
      setIsAuthenticated(true);
      setUser(data.publisher);
    },
  });

  const logout = () => {
    apiService.auth.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    login,
    register,
    logout,
  };
}

// Publisher hooks
export function usePublisherProfile(publisherId) {
  return useQuery({
    queryKey: ['publisher', publisherId],
    queryFn: () => apiService.publishers.getProfile(publisherId),
    enabled: !!publisherId,
  });
}

export function usePublishersDirectory() {
  return useQuery({
    queryKey: ['publishers', 'directory'],
    queryFn: apiService.publishers.getDirectory,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdatePublisher() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ publisherId, data }) => 
      apiService.publishers.updateProfile(publisherId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['publisher', variables.publisherId]);
      queryClient.invalidateQueries(['publishers', 'directory']);
    },
  });
}

// Crawler hooks
export function useCrawlerRegistration() {
  return useMutation({
    mutationFn: apiService.crawlers.registerCrawler,
  });
}

export function useCrawlerAuth() {
  return useMutation({
    mutationFn: (apiKey) => apiService.crawlers.authenticateCrawler(apiKey),
  });
}

export function useCrawlerProfile(crawlerId) {
  return useQuery({
    queryKey: ['crawler', crawlerId],
    queryFn: () => apiService.crawlers.getProfile(crawlerId),
    enabled: !!crawlerId,
  });
}

export function useAddCredits() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ crawlerId, amount, paymentMethod }) =>
      apiService.crawlers.addCredits(crawlerId, amount, paymentMethod),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['crawler', variables.crawlerId]);
    },
  });
}

// Content hooks
export function useContent(domain, path, options = {}) {
  return useQuery({
    queryKey: ['content', domain, path, options],
    queryFn: () => apiService.content.getContent(domain, path, options),
    enabled: !!domain && !!path,
  });
}

export function useContentPricing(domain) {
  return useQuery({
    queryKey: ['content', 'pricing', domain],
    queryFn: () => apiService.content.getPricing(domain),
    enabled: !!domain,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useBatchContent() {
  return useMutation({
    mutationFn: (requests) => apiService.content.batchRequest(requests),
  });
}

// Analytics hooks
export function useCrawlerAnalytics(crawlerId, period = '7d') {
  return useQuery({
    queryKey: ['analytics', 'crawler', crawlerId, period],
    queryFn: () => apiService.analytics.getCrawlerAnalytics(crawlerId, period),
    enabled: !!crawlerId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function usePublisherAnalytics(publisherId, period = '7d') {
  return useQuery({
    queryKey: ['analytics', 'publisher', publisherId, period],
    queryFn: () => apiService.analytics.getPublisherAnalytics(publisherId, period),
    enabled: !!publisherId,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function usePlatformAnalytics(period = '7d') {
  return useQuery({
    queryKey: ['analytics', 'platform', period],
    queryFn: () => apiService.analytics.getPlatformAnalytics(period),
    refetchInterval: 5 * 60 * 1000,
  });
}

// Payment hooks
export function useCreatePayment() {
  return useMutation({
    mutationFn: ({ amount, currency, metadata }) =>
      apiService.payments.createPaymentIntent(amount, currency, metadata),
  });
}

export function usePaymentHistory(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['payments', 'history', page, limit],
    queryFn: () => apiService.payments.getPaymentHistory(page, limit),
  });
}

export function useBalance() {
  return useQuery({
    queryKey: ['payments', 'balance'],
    queryFn: apiService.payments.getBalance,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useSetupPayout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.payments.setupPayout,
    onSuccess: () => {
      queryClient.invalidateQueries(['payments', 'balance']);
    },
  });
}

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: apiService.health.check,
    refetchInterval: 60 * 1000, // Check every minute
    retry: 3,
  });
}

// Custom hook for API status
export function useApiStatus() {
  const { data: health, isError, isLoading } = useHealthCheck();
  
  return {
    isOnline: !isError && !!health,
    isOffline: isError,
    isLoading,
    status: health?.status || 'unknown',
    lastCheck: health?.timestamp,
  };
}
