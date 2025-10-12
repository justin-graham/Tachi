import type { NextApiRequest, NextApiResponse } from 'next'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/publishers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(typeof req.headers.authorization === 'string'
          ? { Authorization: req.headers.authorization }
          : {}),
      },
      body: JSON.stringify(req.body),
    })
    const raw = await response.text()
    let data: any = null
    try {
      data = raw ? JSON.parse(raw) : null
    } catch (parseError) {
      data = raw ? { message: raw } : null
    }

    if (!response.ok) {
      const message = data?.error || data?.message || response.statusText || 'Failed to register publisher'
      return res.status(response.status).json({ error: message, details: data })
    }

    return res.status(200).json(data ?? { success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Publisher registration proxy failed:', error)
    return res.status(502).json({ error: 'Failed to reach API server', details: message })
  }
}
