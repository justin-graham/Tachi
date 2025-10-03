import { NextApiRequest, NextApiResponse } from 'next'
import { getSession, revokeSession, revokeAllUserSessions } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { all } = req.body
    const sessionId = req.cookies['tachi-session']
    
    if (sessionId) {
      const session = getSession(sessionId)
      
      if (session) {
        if (all) {
          // Revoke all sessions for this user
          revokeAllUserSessions(session.userId)
        } else {
          // Revoke only current session
          revokeSession(sessionId)
        }
      }
    }
    
    // Clear the cookie
    res.setHeader('Set-Cookie', [
      'tachi-session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
    ])
    
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}