import { NextRequest, NextResponse } from 'next/server'
import { securityMonitor } from '@/lib/security-monitor'

export async function GET(request: NextRequest) {
  try {
    // This should be protected by admin authentication in production
    const { searchParams } = new URL(request.url)
    const timeWindow = parseInt(searchParams.get('window') || '3600000', 10) // Default 1 hour
    
    // Get security report
    const report = securityMonitor.generateReport(timeWindow)
    
    // Get recent events
    const recentEvents = securityMonitor.getEvents(50)
    
    return NextResponse.json({
      success: true,
      data: {
        report,
        recentEvents: recentEvents.map(event => ({
          ...event,
          timestamp: new Date(event.timestamp).toISOString()
        })),
        summary: {
          window: `${Math.floor(timeWindow / 60000)} minutes`,
          generated: new Date().toISOString()
        }
      }
    })
    
  } catch (error) {
    console.error('Security status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
