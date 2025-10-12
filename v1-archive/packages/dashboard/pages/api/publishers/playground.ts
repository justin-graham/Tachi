import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { performance } from 'perf_hooks'
import { authenticatePublisher } from '@/lib/server/authenticate'
import { ensurePublisherProfile } from '@/lib/server/publisher-profile'
import { supabaseAdmin } from '@/lib/supabase'

const PlaygroundSchema = z.object({
  targetUrl: z.string().url('Target URL must be a valid URL'),
  format: z.enum(['markdown', 'html', 'text', 'json']).default('markdown'),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal string')
    .default('1.00'),
  apiKey: z.string().min(16, 'API key must be provided'),
  maxWaitSeconds: z.number().int().min(5).max(120).optional(),
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

    const parsed = PlaygroundSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() })
    }

    const profile = await ensurePublisherProfile(auth.userId)

    const requestContext = {
      url: parsed.data.targetUrl,
      format: parsed.data.format,
      amount: parsed.data.amount,
      maxWaitSeconds: parsed.data.maxWaitSeconds ?? 30,
      publisherWebhook: profile.webhookUrl,
    }

    const sanitizedPayload = { ...requestContext }
    delete (sanitizedPayload as any).publisherWebhook

    const { data: sessionRow, error: insertError } = await supabaseAdmin
      .from('playground_sessions')
      .insert({
        publisher_id: profile.id,
        user_id: auth.userId,
        request_payload: sanitizedPayload,
        status: 'queued',
      })
      .select('*')
      .single()

    if (insertError || !sessionRow) {
      console.error('Failed to create playground session:', insertError)
      return res.status(500).json({ error: 'Failed to create playground session' })
    }

    const upstreamUrl = `${process.env.TACHI_API_BASE_URL ?? 'https://api.tachi.com'}/v1/crawl`
    const started = performance.now()

    let resultStatus: 'completed' | 'failed' = 'completed'
    let responsePayload: any = null
    let errorMessage: string | null = null
    let upstreamStatus = 0

    try {
    const response = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parsed.data.apiKey}`,
      },
      body: JSON.stringify({
        url: parsed.data.targetUrl,
        format: parsed.data.format,
        amount: parsed.data.amount,
        webhook: profile.webhookUrl || undefined,
        max_wait_seconds: parsed.data.maxWaitSeconds ?? 30,
      }),
    })

      upstreamStatus = response.status
      const text = await response.text()

      try {
        responsePayload = text ? JSON.parse(text) : null
      } catch {
        responsePayload = text
      }

      if (!response.ok) {
        resultStatus = 'failed'
        errorMessage = typeof responsePayload === 'string' ? responsePayload : 'Upstream request failed'
      }
    } catch (error: any) {
      resultStatus = 'failed'
      errorMessage = error?.message ?? 'Failed to reach upstream API'
    }

    const completedAt = performance.now()

    await supabaseAdmin
      .from('playground_sessions')
      .update({
        status: resultStatus,
        response_payload: responsePayload,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionRow.id)

    return res.status(resultStatus === 'completed' ? 200 : 502).json({
      status: resultStatus,
      upstreamStatus,
      elapsedMs: Math.round(completedAt - started),
      response: responsePayload,
      error: errorMessage,
    })
  } catch (error) {
    console.error('Playground handler failed:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
