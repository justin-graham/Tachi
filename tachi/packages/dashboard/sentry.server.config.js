import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  release: process.env.npm_package_version,
  
  // Server-specific configuration
  beforeSend(event, hint) {
    // Add server context
    if (event.level === 'error') {
      console.error('Server Error captured by Sentry:', event);
    }
    
    return event;
  },
});
