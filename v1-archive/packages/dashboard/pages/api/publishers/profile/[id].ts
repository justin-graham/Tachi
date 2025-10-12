import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticatePublisher } from '@/lib/server/authenticate'
import { ensurePublisherProfile, mapRow, type PublisherProfileRecord } from '@/lib/server/publisher-profile'

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  website: z
    .string()
    .url('Website must be a valid URL')
    .max(500, 'Website URL too long')
    .optional()
    .or(z.literal('').transform(() => null)),
  description: z.string().max(2_000).optional().or(z.literal('').transform(() => null)),
  contactEmail: z.string().email().optional().or(z.literal('').transform(() => null)),
  pricePerRequest: z.number().min(0).max(1_000).optional(),
  rateLimitPerHour: z.number().int().min(1).max(100_000).optional(),
  termsOfService: z.string().max(10_000).optional().or(z.literal('').transform(() => null)),
})

function formatProfile(record: PublisherProfileRecord) {
  return {
    id: record.id,
    userId: record.userId,
    name: record.name ?? '',
    website: record.website ?? null,
    description: record.description ?? null,
    contactEmail: record.contactEmail ?? null,
    pricePerRequest: record.pricePerRequest,
    rateLimitPerHour: record.rateLimitPerHour,
    termsOfService: record.termsOfService ?? null,
    status: record.status,
    totalEarnings: record.totalEarnings,
    totalRequests: record.totalRequests,
    stripeAccountId: record.stripeAccountId ?? null,
    webhookUrl: record.webhookUrl ?? null,
    webhookSecretPreview: record.webhookSecretPreview ?? null,
    webhookRotatedAt: record.webhookRotatedAt,
    isPaused: record.isPaused,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid profile id' })
  }

  try {
    const auth = await authenticatePublisher(req)
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const targetUserId = id === 'me' ? auth.userId : id
    if (targetUserId !== auth.userId) {
      return res.status(403).json({ error: 'Can only access your own profile' })
    }

    if (req.method === 'GET') {
      const profile = await ensurePublisherProfile(auth.userId)
      return res.status(200).json({ profile: formatProfile(profile) })
    }

    if (req.method === 'PUT') {
      const payload = UpdateProfileSchema.safeParse(req.body ?? {})
      if (!payload.success) {
        return res.status(400).json({ error: 'Validation error', details: payload.error.flatten() })
      }

      await ensurePublisherProfile(auth.userId)

      const updates = payload.data
      const updatePayload: Record<string, any> = {}

      if (updates.name !== undefined) updatePayload.name = updates.name
      if (updates.website !== undefined) updatePayload.website = updates.website
      if (updates.description !== undefined) updatePayload.description = updates.description
      if (updates.contactEmail !== undefined) updatePayload.contact_email = updates.contactEmail
      if (updates.pricePerRequest !== undefined) updatePayload.price_per_request = updates.pricePerRequest
      if (updates.rateLimitPerHour !== undefined) updatePayload.rate_limit_per_hour = updates.rateLimitPerHour
      if (updates.termsOfService !== undefined) updatePayload.terms_of_service = updates.termsOfService

      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ error: 'No changes provided' })
      }

      const { data, error } = await supabaseAdmin
        .from('publisher_profiles')
        .update(updatePayload)
        .eq('user_id', auth.userId)
        .select('*')
        .single()

      if (error || !data) {
        console.error('Failed to update publisher profile:', error)
        return res.status(500).json({ error: 'Failed to update profile' })
      }

      const profile = formatProfile(mapRow(data))
      return res.status(200).json({ profile })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.flatten() })
    }

    console.error('Publisher profile error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
