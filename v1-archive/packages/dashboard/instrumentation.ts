import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
      tracesSampleRate: 0.1,
      debug: process.env.NEXT_PUBLIC_ENVIRONMENT === 'development',
      integrations: [
        // Add any server-specific integrations
      ],
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry initialization
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
      tracesSampleRate: 0.1,
      debug: process.env.NEXT_PUBLIC_ENVIRONMENT === 'development',
    })
  }
}