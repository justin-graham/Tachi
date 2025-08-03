import { NextRequest, NextResponse } from 'next/server'
import { requireCSRFToken } from '@/lib/csrf'
import { validateSiteDetails, validatePricing, sanitizeString } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfCheck = requireCSRFToken(request)
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: csrfCheck.error || 'CSRF validation failed' },
        { status: 403 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    
    // Validate site details
    const siteDetailsValidation = validateSiteDetails(body.siteDetails)
    if (!siteDetailsValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid site details',
          details: siteDetailsValidation.error.issues
        },
        { status: 400 }
      )
    }
    
    // Validate pricing
    const pricingValidation = validatePricing(body.pricing)
    if (!pricingValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid pricing data',
          details: pricingValidation.error.issues
        },
        { status: 400 }
      )
    }
    
    // Sanitize inputs
    const sanitizedData = {
      siteDetails: {
        domain: sanitizeString(siteDetailsValidation.data.domain),
        websiteName: sanitizeString(siteDetailsValidation.data.websiteName),
        description: sanitizeString(siteDetailsValidation.data.description),
        termsURI: siteDetailsValidation.data.termsURI ? sanitizeString(siteDetailsValidation.data.termsURI) : undefined
      },
      pricing: pricingValidation.data
    }
    
    // Here you would typically save to database
    // For now, return the validated and sanitized data
    return NextResponse.json({
      success: true,
      data: sanitizedData,
      message: 'Publisher configuration saved successfully'
    })
    
  } catch (error) {
    console.error('Publisher API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Add rate limiting for GET requests as well
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    
    if (domain) {
      // Validate domain parameter
      if (typeof domain !== 'string' || domain.length > 255) {
        return NextResponse.json(
          { error: 'Invalid domain parameter' },
          { status: 400 }
        )
      }
      
      // Here you would typically fetch from database
      return NextResponse.json({
        success: true,
        data: {
          domain: sanitizeString(domain),
          status: 'not_found'
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        publishers: [],
        total: 0
      }
    })
    
  } catch (error) {
    console.error('Publisher GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
