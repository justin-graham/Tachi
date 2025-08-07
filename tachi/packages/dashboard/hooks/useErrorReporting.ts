import { useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';

export interface ErrorReportOptions {
  level?: 'error' | 'warning' | 'info' | 'debug';
  tags?: Record<string, string>;
  context?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
}

export function useErrorReporting() {
  const reportError = useCallback((error: Error, options: ErrorReportOptions = {}) => {
    Sentry.withScope((scope) => {
      // Set level
      if (options.level) {
        scope.setLevel(options.level);
      }

      // Add tags
      if (options.tags) {
        Object.entries(options.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      // Add context
      if (options.context) {
        Object.entries(options.context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }

      // Set user context
      if (options.user) {
        scope.setUser(options.user);
      }

      Sentry.captureException(error);
    });
  }, []);

  const reportMessage = useCallback((message: string, options: ErrorReportOptions = {}) => {
    Sentry.withScope((scope) => {
      // Set level
      if (options.level) {
        scope.setLevel(options.level);
      }

      // Add tags
      if (options.tags) {
        Object.entries(options.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      // Add context
      if (options.context) {
        Object.entries(options.context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }

      // Set user context
      if (options.user) {
        scope.setUser(options.user);
      }

      Sentry.captureMessage(message, options.level || 'info');
    });
  }, []);

  const addBreadcrumb = useCallback((breadcrumb: {
    message: string;
    category?: string;
    level?: 'error' | 'warning' | 'info' | 'debug';
    data?: Record<string, any>;
  }) => {
    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category || 'custom',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000,
    });
  }, []);

  const setUserContext = useCallback((user: {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: any;
  }) => {
    Sentry.setUser(user);
  }, []);

  const setTag = useCallback((key: string, value: string) => {
    Sentry.setTag(key, value);
  }, []);

  const setContext = useCallback((key: string, context: Record<string, any>) => {
    Sentry.setContext(key, context);
  }, []);

  return {
    reportError,
    reportMessage,
    addBreadcrumb,
    setUserContext,
    setTag,
    setContext,
  };
}

// Utility function for async error handling
export function withErrorReporting<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorOptions: ErrorReportOptions = {}
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      Sentry.withScope((scope) => {
        if (errorOptions.level) {
          scope.setLevel(errorOptions.level);
        }

        if (errorOptions.tags) {
          Object.entries(errorOptions.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        if (errorOptions.context) {
          Object.entries(errorOptions.context).forEach(([key, value]) => {
            scope.setContext(key, value);
          });
        }

        if (errorOptions.user) {
          scope.setUser(errorOptions.user);
        }

        Sentry.captureException(error);
      });

      throw error;
    }
  };
}
