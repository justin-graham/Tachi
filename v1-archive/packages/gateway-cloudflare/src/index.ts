import { GatewayCore } from '@tachi/gateway-core';

interface Env {
  RPC_URL: string;
  CRAWL_NFT_ADDRESS?: string;
  PAYMENT_PROCESSOR_ADDRESS?: string;
  PROOF_OF_CRAWL_LEDGER_ADDRESS?: string;
}

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS'
};

const createGateway = (env: Env) => {
  const rpcUrl = env.RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo';
  return new GatewayCore(
    rpcUrl,
    env.CRAWL_NFT_ADDRESS,
    env.PAYMENT_PROCESSOR_ADDRESS,
    env.PROOF_OF_CRAWL_LEDGER_ADDRESS
  );
};

const createResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...corsHeaders
    }
  });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const targetUrl = url.searchParams.get('url');

      if (!targetUrl) {
        return createResponse({ success: false, error: 'Query parameter "url" is required' }, 400);
      }

      const gateway = createGateway(env);
      const body = request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined;

      const result = await gateway.handleRequest({
        url: targetUrl,
        method: request.method as any,
        headers: Object.fromEntries(request.headers),
        body,
        publisherAddress: url.searchParams.get('publisherAddress') || undefined,
        crawlTokenId: url.searchParams.get('crawlTokenId')
          ? Number(url.searchParams.get('crawlTokenId'))
          : undefined,
        crawlerAddress: url.searchParams.get('crawlerAddress') || undefined
      });

      return createResponse(result, result.statusCode);
    } catch (error) {
      return createResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error'
      }, 500);
    }
  }
};
