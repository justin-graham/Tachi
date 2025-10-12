import { NextApiRequest, NextApiResponse } from 'next'
import { getSession, markOnboardingComplete, getUserById } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const sessionId = req.cookies['tachi-session']

    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const session = await getSession(sessionId)

    if (!session) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    // Mark onboarding as complete
    const success = await markOnboardingComplete(session.userId)

    if (!success) {
      return res.status(500).json({ error: 'Failed to complete onboarding' })
    }

    // Get updated user
    const user = await getUserById(session.userId)

    if (!user) {
      return res.status(500).json({ error: 'Failed to retrieve user' })
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        address: user.address,
        userType: user.userType,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
        onboardingCompleted: user.onboardingCompleted,
        emailVerified: user.emailVerified,
        profile: user.profile
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Supabase service role key')) {
      return res.status(500).json({ error: error.message })
    }
    console.error('Complete onboarding error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
