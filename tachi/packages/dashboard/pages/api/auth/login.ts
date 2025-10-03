import { NextApiRequest, NextApiResponse } from 'next'
import { authenticateUser } from '@/lib/auth'
import { z } from 'zod'

const LoginRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  signature: z.string().min(1, 'Signature is required'),
  nonce: z.string().min(1, 'Nonce is required'),
  userType: z.enum(['publisher', 'crawler'])
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { address, signature, nonce, userType } = LoginRequestSchema.parse(req.body)
    
    const result = await authenticateUser(address, signature, nonce, userType)
    
    if (!result.success) {
      return res.status(401).json({ error: result.error })
    }
    
    // Set HTTP-only cookie for session
    const cookieOptions = [
      `tachi-session=${result.session!.sessionId}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
      'Path=/'
    ].join('; ')
    
    res.setHeader('Set-Cookie', cookieOptions)
    
    res.status(200).json({
      success: true,
      user: {
        id: result.user!.id,
        address: result.user!.address,
        userType: result.user!.userType,
        createdAt: result.user!.createdAt,
        lastActiveAt: result.user!.lastActiveAt,
        profile: result.user!.profile
      },
      token: result.token,
      expiresIn: '7d'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      })
    }
    
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}