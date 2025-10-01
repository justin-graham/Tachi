import { getLoadBalancer } from '../services/load-balancer.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();
const loadBalancer = getLoadBalancer();

// Initialize load balancer
loadBalancer.initialize().catch(error => {
  logger.error('Failed to initialize load balancer:', error);
});

export const loadBalancerMiddleware = async (req, res, next) => {
  // Only apply load balancing in production or when explicitly enabled
  const shouldLoadBalance = process.env.NODE_ENV === 'production' || 
                           process.env.LB_ENABLED === 'true';
  
  if (!shouldLoadBalance) {
    return next();
  }
  
  try {
    // Check if this is a health check request (don't load balance these)
    if (req.path === '/health' || req.path.startsWith('/api/monitoring/health')) {
      return next();
    }
    
    // Forward request through load balancer
    await loadBalancer.forwardRequest(req, res);
    
  } catch (error) {
    logger.error('Load balancer request failed:', error);
    
    // If load balancing fails, fall back to direct processing
    logger.warn('Falling back to direct request processing');
    next();
  }
};

export default loadBalancerMiddleware;