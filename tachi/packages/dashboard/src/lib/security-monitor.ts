/**
 * Security monitoring and logging utilities
 */

export interface SecurityEvent {
  type: 'csrf_failure' | 'rate_limit' | 'validation_error' | 'suspicious_request' | 'auth_failure'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
  details: {
    ip?: string
    userAgent?: string
    path?: string
    error?: string
    [key: string]: any
  }
}

export class SecurityMonitor {
  private static instance: SecurityMonitor
  private events: SecurityEvent[] = []
  private maxEvents = 1000 // Keep last 1000 events in memory

  private constructor() {}

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor()
    }
    return SecurityMonitor.instance
  }

  /**
   * Log a security event
   */
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now()
    }

    this.events.push(fullEvent)

    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Console log for immediate visibility
    console.warn(`[SECURITY] ${event.type.toUpperCase()}:`, event.details)

    // Send to external monitoring service in production
    if (process.env.NODE_ENV === 'production' && event.severity === 'critical') {
      this.sendAlert(fullEvent)
    }
  }

  /**
   * Get recent security events
   */
  getEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit)
  }

  /**
   * Get events by type
   */
  getEventsByType(type: SecurityEvent['type'], limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit)
  }

  /**
   * Check for suspicious patterns
   */
  checkSuspiciousActivity(ip: string, timeWindow: number = 5 * 60 * 1000): {
    isSuspicious: boolean
    reason?: string
    count: number
  } {
    const now = Date.now()
    const recentEvents = this.events.filter(
      event => 
        event.timestamp > now - timeWindow && 
        event.details.ip === ip
    )

    // Multiple validation errors
    const validationErrors = recentEvents.filter(e => e.type === 'validation_error')
    if (validationErrors.length > 10) {
      return {
        isSuspicious: true,
        reason: 'Multiple validation errors',
        count: validationErrors.length
      }
    }

    // Multiple CSRF failures
    const csrfFailures = recentEvents.filter(e => e.type === 'csrf_failure')
    if (csrfFailures.length > 5) {
      return {
        isSuspicious: true,
        reason: 'Multiple CSRF failures',
        count: csrfFailures.length
      }
    }

    // Rate limit hits
    const rateLimitHits = recentEvents.filter(e => e.type === 'rate_limit')
    if (rateLimitHits.length > 3) {
      return {
        isSuspicious: true,
        reason: 'Multiple rate limit violations',
        count: rateLimitHits.length
      }
    }

    return { isSuspicious: false, count: recentEvents.length }
  }

  /**
   * Send alert to external monitoring service
   */
  private async sendAlert(event: SecurityEvent): Promise<void> {
    try {
      // In production, integrate with services like:
      // - Datadog
      // - Sentry
      // - CloudWatch
      // - Custom webhook

      const alertData = {
        service: 'tachi-dashboard',
        event: event.type,
        severity: event.severity,
        details: event.details,
        timestamp: new Date(event.timestamp).toISOString()
      }

      // Example webhook call (replace with actual monitoring service)
      if (process.env.SECURITY_WEBHOOK_URL) {
        await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SECURITY_WEBHOOK_TOKEN}`
          },
          body: JSON.stringify(alertData)
        })
      }
    } catch (error) {
      console.error('Failed to send security alert:', error)
    }
  }

  /**
   * Generate security report
   */
  generateReport(timeWindow: number = 24 * 60 * 60 * 1000): {
    totalEvents: number
    eventsByType: Record<string, number>
    topIPs: Array<{ ip: string; count: number }>
    suspiciousIPs: string[]
  } {
    const now = Date.now()
    const recentEvents = this.events.filter(
      event => event.timestamp > now - timeWindow
    )

    // Count events by type
    const eventsByType: Record<string, number> = {}
    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
    })

    // Count events by IP
    const ipCounts: Record<string, number> = {}
    recentEvents.forEach(event => {
      const ip = event.details.ip || 'unknown'
      ipCounts[ip] = (ipCounts[ip] || 0) + 1
    })

    // Top IPs by event count
    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }))

    // Suspicious IPs
    const suspiciousIPs = Object.keys(ipCounts).filter(ip => {
      const check = this.checkSuspiciousActivity(ip, timeWindow)
      return check.isSuspicious
    })

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      topIPs,
      suspiciousIPs
    }
  }
}

// Convenience functions
export const securityMonitor = SecurityMonitor.getInstance()

export function logSecurityEvent(
  type: SecurityEvent['type'],
  severity: SecurityEvent['severity'],
  details: SecurityEvent['details']
): void {
  securityMonitor.logEvent({ type, severity, details })
}

export function logCSRFFailure(ip: string, path: string, error?: string): void {
  logSecurityEvent('csrf_failure', 'medium', { ip, path, error })
}

export function logRateLimit(ip: string, path: string, limit: number): void {
  logSecurityEvent('rate_limit', 'medium', { ip, path, limit })
}

export function logValidationError(ip: string, path: string, field: string, error: string): void {
  logSecurityEvent('validation_error', 'low', { ip, path, field, error })
}

export function logSuspiciousRequest(ip: string, userAgent: string, path: string, reason: string): void {
  logSecurityEvent('suspicious_request', 'high', { ip, userAgent, path, reason })
}

export function logAuthFailure(ip: string, path: string, reason: string): void {
  logSecurityEvent('auth_failure', 'medium', { ip, path, reason })
}
