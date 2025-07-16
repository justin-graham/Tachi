import { GatewayCore } from '@tachi/gateway-core';
import { NextRequest, NextResponse } from 'next/server';

export default async function handler(req: NextRequest) {
  const gateway = new GatewayCore(process.env.RPC_URL);
  
  try {
    const url = new URL(req.url);
    const body = req.method !== 'GET' ? await req.text() : undefined;
    
    const crawlRequest = {
      url: url.searchParams.get('url') || '',
      method: req.method as any,
      headers: Object.fromEntries(req.headers.entries()),
      body,
    };

    const result = await gateway.handleRequest(crawlRequest);
    
    return NextResponse.json(result, {
      status: result.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 500,
    });
  }
}

export const config = {
  runtime: 'edge',
};
