import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticatePublisher } from '@/lib/server/authenticate'
import { ensurePublisherProfile } from '@/lib/server/publisher-profile'

const DeleteRequestSchema = z.object({
  reason: z.string().max(1000).optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  try {
    const auth = await authenticatePublisher(req)
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const parsed = DeleteRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() })
    }

    const profile = await ensurePublisherProfile(auth.userId)

    await supabaseAdmin.from('publisher_webhook_logs').insert({
      publisher_id: profile.id,
      destination_url: 'internal://support/delete-request',
      status: 'pending',
      payload: {
        type: 'delete_request',
        reason: parsed.data.reason ?? null,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Deletion request logged. The support team will contact you shortly.',
    })
  } catch (error) {
    console.error('Delete request error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
