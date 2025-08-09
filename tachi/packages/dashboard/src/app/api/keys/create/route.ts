import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/mock-prisma'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await req.json()
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'API key name too long' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { apiKeys: { where: { isActive: true } } }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check API key limit (max 10 active keys per user)
    if (user.apiKeys.length >= 10) {
      return NextResponse.json({ 
        error: 'Maximum number of API keys reached (10). Please delete some keys first.' 
      }, { status: 400 })
    }

    // Generate API key
    const rawKey = `sk_${process.env.NODE_ENV === 'production' ? 'live' : 'test'}_${crypto.randomBytes(32).toString('hex')}`
    const keyPrefix = rawKey.substring(0, 16) + '...' // Show first 16 characters
    
    // Hash the key using crypto with a salt (fallback if no env var)
    const salt = process.env.API_KEY_SALT || 'tachi-default-salt-2024'
    const keyHash = crypto.createHash('sha256').update(rawKey + salt).digest('hex')

    // Save to database
    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        keyHash,
        keyPrefix,
        userId: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.keyPrefix,
        createdAt: apiKey.createdAt,
        // Return the raw key ONLY once
        key: rawKey,
      },
    })

  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// Get user's API keys
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        apiKeys: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            totalRequests: true,
            monthlyRequests: true,
            lastUsedAt: true,
            createdAt: true,
            expiresAt: true,
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      apiKeys: user.apiKeys,
    })

  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
