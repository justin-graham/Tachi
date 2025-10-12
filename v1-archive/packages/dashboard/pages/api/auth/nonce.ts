import { NextApiRequest, NextApiResponse } from 'next'
import { generateNonce, storeNonce } from '@/lib/auth'
import { z } from 'zod'

const NonceRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { address } = NonceRequestSchema.parse(req.body)
    
    // Generate and store nonce
    const nonce = generateNonce()
    await storeNonce(address, nonce)
    
    res.status(200).json({
      nonce,
      expiresIn: 600 // 10 minutes in seconds
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      })
    }
    if (error instanceof Error && error.message.includes('Supabase service role key')) {
      return res.status(500).json({ error: error.message })
    }
    
    console.error('Nonce generation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
