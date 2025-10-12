import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authenticatePublisher } from '@/lib/server/authenticate'
import { ensurePublisherProfile } from '@/lib/server/publisher-profile'

const LANGUAGES = ['curl', 'javascript', 'python', 'go', 'rust'] as const
type SupportedLanguage = (typeof LANGUAGES)[number]

const QuerySchema = z.object({
  lang: z.enum(LANGUAGES).default('curl'),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const auth = await authenticatePublisher(req)
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const parseResult = QuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid language' })
    }

    const profile = await ensurePublisherProfile(auth.userId)
    const lang = parseResult.data.lang
    const snippet = buildSnippet(lang, {
      pricePerRequest: profile.pricePerRequest,
      webhookUrl: profile.webhookUrl ?? 'https://your-app.com/webhook',
    })

    return res.status(200).json({
      language: lang,
      snippet,
    })
  } catch (error) {
    console.error('Code snippet error:', error)
    return res.status(500).json({ error: 'Failed to build code snippet' })
  }
}

function buildSnippet(lang: SupportedLanguage, context: { pricePerRequest: number; webhookUrl: string }) {
  const price = context.pricePerRequest.toFixed(3)
  const webhookUrl = context.webhookUrl
  const apiBase = process.env.TACHI_API_BASE_URL ?? 'https://api.tachi.com'

  switch (lang) {
    case 'curl':
      return [
        `curl -X POST ${apiBase}/v1/crawl \\`,
        '  -H "Authorization: Bearer YOUR_API_KEY" \\',
        '  -H "Content-Type: application/json" \\',
        '  -d \'{"url":"https://example.com","format":"markdown"}\'',
      ].join('\n')
    case 'javascript':
      return `import fetch from 'node-fetch';

const response = await fetch('${apiBase}/v1/crawl', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    format: 'markdown',
    maxPrice: '${price}'
  })
});

const data = await response.json();`
    case 'python':
      return `import requests

response = requests.post(
    '${apiBase}/v1/crawl',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'url': 'https://example.com',
        'format': 'markdown',
        'maxPrice': '${price}',
    },
)
response.raise_for_status()
data = response.json()`
    case 'go':
      return `client := resty.New()
resp, err := client.R().
    SetHeader("Authorization", "Bearer YOUR_API_KEY").
    SetHeader("Content-Type", "application/json").
    SetBody(map[string]any{
        "url":      "https://example.com",
        "format":   "markdown",
        "maxPrice": "${price}",
    }).
    Post("${apiBase}/v1/crawl")`
    case 'rust':
      return `let client = reqwest::Client::new();
let resp = client
    .post("${apiBase}/v1/crawl")
    .bearer_auth("YOUR_API_KEY")
    .json(&serde_json::json!({
        "url": "https://example.com",
        "format": "markdown",
        "maxPrice": "${price}"
    }))
    .send()
    .await?;`
    default:
      return ''
  }
}
