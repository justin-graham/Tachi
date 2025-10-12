import { NextApiRequest, NextApiResponse } from 'next'
import { createHmac } from 'crypto'
import { performance } from 'perf_hooks'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticatePublisher } from '@/lib/server/authenticate'
import { ensurePublisherProfile, mapRow } from '@/lib/server/publisher-profile'

const TestWebhookSchema = z.object({
  payload: z.record(z.any()).optional(),
  method: z.enum(['POST', 'PUT']).default('POST'),
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

    const parsed = TestWebhookSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() })
    }

    const profile = await ensurePublisherProfile(auth.userId)
    if (!profile.webhookUrl) {
      return res.status(400).json({ error: 'Webhook URL not configured' })
    }
    if (!profile.webhookSecret) {
      return res.status(400).json({ error: 'Webhook secret not configured' })
    }

    const eventPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: parsed.data.payload ?? { message: 'This is a webhook test event from the Tachi dashboard.' },
    }
    const payloadString = JSON.stringify(eventPayload)
    const timestampHeader = Date.now().toString()

    const signature = createHmac('sha256', profile.webhookSecret)
      .update(`${timestampHeader}.${payloadString}`)
      .digest('hex')

    const started = performance.now()
    let status = 'success'
    let responseStatus = 0
    let responseBody: string | null = null
    let errorMessage: string | undefined

    try {
      const response = await fetch(profile.webhookUrl, {
        method: parsed.data.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Tachi-Event': 'webhook.test',
          'X-Tachi-Timestamp': timestampHeader,
          'X-Tachi-Signature': signature,
        },
        body: payloadString,
      })

      responseStatus = response.status
      responseBody = await response.text()

      if (!response.ok) {
        status = 'failed'
        errorMessage = `Webhook endpoint responded with status ${response.status}`
      }
    } catch (error: any) {
      status = 'failed'
      errorMessage = error?.message ?? 'Request failed'
    }

    const latency = Math.round(performance.now() - started)

    await supabaseAdmin
      .from('publisher_webhook_logs')
      .insert({
        publisher_id: profile.id,
        destination_url: profile.webhookUrl,
        status,
        status_code: responseStatus || null,
        latency_ms: latency,
        payload: eventPayload,
        response_body: responseBody,
      })

    return res.status(status === 'success' ? 200 : 502).json({
      status,
      statusCode: responseStatus,
      latencyMs: latency,
      responseBody,
      error: errorMessage,
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
