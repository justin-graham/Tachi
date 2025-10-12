import { GatewayCore } from '@tachi/gateway-core';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': '*',
  'content-type': 'application/json'
};

const getGateway = () => {
  const rpcUrl = process.env.RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo';
  return new GatewayCore(rpcUrl, process.env.CRAWL_NFT_ADDRESS, process.env.PAYMENT_PROCESSOR_ADDRESS, process.env.PROOF_OF_CRAWL_LEDGER_ADDRESS);
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ success: false, error: 'Query parameter \"url\" is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const body = request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.text()
      : undefined;

    const gateway = getGateway();
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

    return new Response(JSON.stringify(result), {
      status: result.statusCode,
      headers: corsHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export const config = {
  runtime: 'edge'
};
