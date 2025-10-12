import { NextApiRequest, NextApiResponse } from 'next'
import { getSession, getUserById } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface VerificationStatus {
  status: 'pending' | 'active' | 'suspended' | 'inactive'
  isVerified: boolean
  verifiedAt?: Date
  verificationNotes?: string
  requirements: {
    profileComplete: boolean
    walletConnected: boolean
    emailVerified: boolean
    contractDeployed: boolean
  }
  canPublish: boolean
}

async function getVerificationStatus(userId: string): Promise<VerificationStatus | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured')
  }

  // Get user
  const user = await getUserById(userId)
  if (!user) {
    return null
  }

  // Get publisher profile
  const { data: profile, error } = await supabaseAdmin
    .from('publisher_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !profile) {
    // No profile yet, create verification status with pending requirements
    return {
      status: 'pending',
      isVerified: false,
      requirements: {
        profileComplete: false,
        walletConnected: !!user.address,
        emailVerified: user.emailVerified,
        contractDeployed: false,
      },
      canPublish: false,
    }
  }

  // Check requirements
  const profileComplete = !!(profile.name && profile.contact_email)
  const walletConnected = !!user.address
  const emailVerified = user.emailVerified
  const contractDeployed = !!profile.stripe_account_id // Using Stripe as proxy for setup

  const allRequirementsMet = profileComplete && walletConnected && emailVerified && contractDeployed
  const isVerified = profile.status === 'active'
  const canPublish = isVerified && allRequirementsMet

  return {
    status: profile.status,
    isVerified,
    verifiedAt: profile.verified_at ? new Date(profile.verified_at) : undefined,
    verificationNotes: profile.verification_notes,
    requirements: {
      profileComplete,
      walletConnected,
      emailVerified,
      contractDeployed,
    },
    canPublish,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Authenticate user
    const sessionId = req.cookies['tachi-session']
    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const session = await getSession(sessionId)
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    const user = await getUserById(session.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    // Only publishers can access this endpoint
    if (user.userType !== 'publisher') {
      return res.status(403).json({ error: 'Only publishers can access this endpoint' })
    }

    const verificationStatus = await getVerificationStatus(session.userId)

    if (!verificationStatus) {
      return res.status(404).json({ error: 'Verification status not found' })
    }

    return res.status(200).json(verificationStatus)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Supabase')) {
      return res.status(500).json({ error: error.message })
    }

    console.error('Verification status error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
