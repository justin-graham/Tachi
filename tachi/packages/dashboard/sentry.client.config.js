import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  
  // Environment
  environment: process.env.NODE_ENV,
  release: process.env.npm_package_version,
  
  // Custom Error Filtering
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Ignore user-initiated cancellations
      if (error?.message?.includes('user rejected transaction') ||
          error?.message?.includes('User denied') ||
          error?.message?.includes('MetaMask')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Custom Tags
  initialScope: {
    tags: {
      component: "tachi-dashboard",
      version: process.env.npm_package_version,
    },
  },
});
