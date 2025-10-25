/**
 * Tachi AI Crawler Protection Worker
 * Deploy this to your domain to enforce payment for AI crawlers
 *
 * Setup Instructions:
 * 1. Go to https://dash.cloudflare.com/
 * 2. Select your domain
 * 3. Go to Workers Routes
 * 4. Click "Create a Worker"
 * 5. Paste this code
 * 6. Add route: yourdomain.com/*
 * 7. Save and deploy
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';

    // AI crawler detection
    const aiCrawlers = [
      'GPTBot',
      'ChatGPT-User',
      'Claude-Web',
      'anthropic-ai',
      'PerplexityBot',
      'Diffbot',
      'cohere-ai',
      'OAI-SearchBot'
    ];

    const isAICrawler = aiCrawlers.some(bot => userAgent.includes(bot));

    if (isAICrawler) {
      const paymentProof = request.headers.get('X-Tachi-Payment');

      if (!paymentProof) {
        // No payment - return 402 with gateway URL
        return new Response(JSON.stringify({
          error: 'Payment required',
          message: 'AI crawlers must pay to access this content',
          gateway: `https://tachi-gateway.jgrahamsport16.workers.dev?publisher=${env.TACHI_PUBLISHER_ADDRESS}&target=${url.href}`,
          price: env.TACHI_PRICE_PER_REQUEST || '0.01'
        }), {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            'X-Tachi-Gateway': `https://tachi-gateway.jgrahamsport16.workers.dev?publisher=${env.TACHI_PUBLISHER_ADDRESS}`,
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Has payment proof - validate via Tachi API
      const validationUrl = `https://tachi-protocol.vercel.app/api/validate-payment?tx_hash=${paymentProof}&publisher=${env.TACHI_PUBLISHER_ADDRESS}`;
      const validationRes = await fetch(validationUrl);
      const validation = await validationRes.json();

      if (!validation.valid) {
        return new Response(JSON.stringify({
          error: 'Invalid payment proof',
          message: validation.reason || 'Payment not found or expired'
        }), {
          status: 402,
          headers: {'Content-Type': 'application/json'}
        });
      }

      // Payment valid - allow request to origin
    }

    // Pass through to origin (regular users or validated AI crawlers)
    return fetch(request);
  }
};
