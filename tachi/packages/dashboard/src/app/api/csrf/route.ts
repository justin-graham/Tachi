import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  try {
    const csrfData = generateCSRFToken()
    
    const response = NextResponse.json({
      token: csrfData.token,
      timestamp: csrfData.timestamp
    })
    
    // Set CSRF token as httpOnly cookie as well
    response.cookies.set('csrf-token', csrfData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
