import { supabaseAdmin } from '@/lib/supabase'

export interface PublisherProfileRecord {
  id: string
  userId: string
  name: string | null
  website?: string | null
  description?: string | null
  contactEmail?: string | null
  pricePerRequest: number
  rateLimitPerHour: number
  termsOfService?: string | null
  status: 'pending' | 'active' | 'suspended' | 'inactive'
  totalEarnings: number
  totalRequests: number
  stripeAccountId?: string | null
  webhookUrl?: string | null
  webhookSecret?: string | null
  webhookSecretPreview?: string | null
  webhookRotatedAt?: string | null
  isPaused: boolean
  createdAt: Date
  updatedAt: Date
}

function requireSupabase() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured')
  }
  return supabaseAdmin
}

export async function getPublisherProfileByUserId(userId: string): Promise<PublisherProfileRecord | null> {
  const admin = requireSupabase()
  const { data, error } = await admin
    .from('publisher_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return mapRow(data)
}

export async function ensurePublisherProfile(userId: string): Promise<PublisherProfileRecord> {
  const existing = await getPublisherProfileByUserId(userId)
  if (existing) {
    return existing
  }

  const admin = requireSupabase()
  const { data, error } = await admin
    .from('publisher_profiles')
    .insert({
      user_id: userId,
      name: null,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error || !data) {
    throw error || new Error('Failed to create publisher profile')
  }

  return mapRow(data)
}

export function mapRow(data: any): PublisherProfileRecord {
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    website: data.website,
    description: data.description,
    contactEmail: data.contact_email,
    pricePerRequest: parseFloat(data.price_per_request ?? '0') || 0,
    rateLimitPerHour: data.rate_limit_per_hour ?? 0,
    termsOfService: data.terms_of_service,
    status: data.status,
    totalEarnings: parseFloat(data.total_earnings ?? '0') || 0,
    totalRequests: data.total_requests ?? 0,
    stripeAccountId: data.stripe_account_id,
    webhookUrl: data.webhook_url,
    webhookSecret: data.webhook_secret,
    webhookSecretPreview: data.webhook_secret_preview,
    webhookRotatedAt: data.webhook_rotated_at,
    isPaused: Boolean(data.is_paused),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}
