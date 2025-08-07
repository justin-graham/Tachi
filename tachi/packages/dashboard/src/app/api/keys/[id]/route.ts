import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/mock-prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keyId = params.id

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find and verify ownership of API key
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId: user.id,
        isActive: true,
      },
    })

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key not found or already deleted' 
      }, { status: 404 })
    }

    // Soft delete the API key
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { 
        isActive: false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    })

  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
