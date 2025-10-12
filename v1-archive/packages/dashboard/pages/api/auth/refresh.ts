import { NextApiRequest, NextApiResponse } from 'next'
import { refreshJWT } from '@/lib/auth'
import { z } from 'zod'

const RefreshRequestSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = RefreshRequestSchema.parse(req.body)

    const newToken = refreshJWT(token)

    if (!newToken) {
      return res.status(401).json({ error: 'Token refresh failed or expired beyond grace period' })
    }

    res.status(200).json({
      success: true,
      token: newToken,
      expiresIn: '7d'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      })
    }

    console.error('Token refresh error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
