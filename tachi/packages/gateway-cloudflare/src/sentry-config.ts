import * as Sentry from '@sentry/browser';

export function initSentry(env: any) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT || 'production',
    tracesSampleRate: 0.1,
    
    beforeSend(event) {
      // Add custom context
      if (event.level === 'error') {
        console.error('Worker error captured:', event);
      }
      return event;
    },
  });
}

export function withSentryTracing<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.withScope(async (scope) => {
    scope.setTag('operation', operation);
    
    try {
      const result = await fn();
      return result;
    } catch (error) {
      scope.setLevel('error');
      Sentry.captureException(error);
      throw error;
    }
  });
}

export async function sendHeartbeat(url: string) {
  try {
    await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Tachi-Gateway-Worker/1.0'
      }
    });
  } catch (error) {
    console.error('Heartbeat failed:', error);
    // Don't throw - heartbeat failure should be detected by monitoring
  }
}
