import { GatewayCore } from '@tachi/gateway-core';

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const gateway = new GatewayCore(env.RPC_URL);
    
    try {
      const url = new URL(request.url);
      const body = request.method !== 'GET' ? await request.text() : undefined;
      
      const crawlRequest = {
        url: url.searchParams.get('url') || '',
        method: request.method as any,
        headers: Object.fromEntries(request.headers.entries()),
        body,
      };

      const result = await gateway.handleRequest(crawlRequest);
      
      return new Response(JSON.stringify(result), {
        status: result.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
