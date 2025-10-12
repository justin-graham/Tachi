import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticatePublisher } from '@/lib/server/authenticate'
import { ensurePublisherProfile, mapRow } from '@/lib/server/publisher-profile'

const StatusSchema = z.object({
  action: z.enum(['pause', 'resume']),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
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

    const parsed = StatusSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() })
    }

    await ensurePublisherProfile(auth.userId)

    const isPaused = parsed.data.action === 'pause'
    const { data, error } = await supabaseAdmin
      .from('publisher_profiles')
      .update({
        is_paused: isPaused,
        status: isPaused ? 'suspended' : 'active',
      })
      .eq('user_id', auth.userId)
      .select('*')
      .single()

    if (error || !data) {
      console.error('Failed to update publisher status:', error)
      return res.status(500).json({ error: 'Failed to update publisher status' })
    }

    const profile = mapRow(data)

    return res.status(200).json({
      isPaused: profile.isPaused,
      status: profile.status,
    })
  } catch (error) {
    console.error('Publisher status error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
