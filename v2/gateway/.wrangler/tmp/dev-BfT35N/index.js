var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-u133CF/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-u133CF/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/index.ts
var CONTENT_STORE = {
  "/article/ai-training": {
    title: "The Future of AI Training Data",
    content: "AI models require vast amounts of high-quality training data. This article explores the economics of data sourcing and the emerging market for paid content access. Publishers are increasingly seeking fair compensation for their valuable datasets, while AI companies need reliable, legal access to training materials. The Tachi protocol bridges this gap with micropayments and verifiable on-chain logging...",
    type: "article"
  },
  "/dataset/financial-news": {
    title: "Financial News Dataset Q1 2025",
    content: JSON.stringify({
      records: 1250,
      period: "2025-Q1",
      categories: ["markets", "crypto", "regulation"],
      format: "json",
      sample: {
        date: "2025-01-15",
        headline: "Base L2 reaches 10M daily transactions",
        category: "crypto",
        sentiment: 0.82
      }
    }),
    type: "dataset"
  },
  "/api/market-data": {
    title: "Real-time Market Data API",
    content: JSON.stringify({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      markets: [
        { symbol: "BTC/USD", price: 94250, change: 2.3 },
        { symbol: "ETH/USD", price: 3420, change: 1.8 },
        { symbol: "BASE/USD", price: 1.2, change: 0.5 }
      ]
    }),
    type: "api"
  }
};
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return corsResponse();
    }
    if (url.pathname === "/health") {
      return jsonResponse({ status: "ok", service: "Tachi Gateway", version: "2.0" });
    }
    if (url.pathname === "/" || url.pathname === "/catalog") {
      return jsonResponse({
        catalog: Object.keys(CONTENT_STORE).map((path) => ({
          path,
          title: CONTENT_STORE[path].title,
          type: CONTENT_STORE[path].type,
          price: env.PRICE_PER_REQUEST
        }))
      });
    }
    const authHeader = request.headers.get("authorization");
    const paymentTxHash = authHeader?.replace("Bearer ", "");
    if (!paymentTxHash) {
      return paymentRequiredResponse(env, url.pathname);
    }
    try {
      const verification = await verifyPayment(paymentTxHash, env);
      if (!verification.valid) {
        return jsonResponse(
          {
            error: "Payment verification failed",
            message: verification.reason || "Invalid or expired payment"
          },
          402
        );
      }
      await logCrawl({
        txHash: paymentTxHash,
        path: url.pathname,
        publisherAddress: env.PUBLISHER_ADDRESS,
        crawlerAddress: verification.crawlerAddress,
        amount: verification.amount,
        env
      });
      const content = getContent(url.pathname);
      if (!content) {
        return jsonResponse({ error: "Content not found", path: url.pathname }, 404);
      }
      return jsonResponse({
        success: true,
        payment: {
          txHash: paymentTxHash,
          amount: verification.amount,
          verified: true
        },
        content: {
          title: content.title,
          type: content.type,
          data: content.content
        }
      });
    } catch (error) {
      console.error("Gateway error:", error);
      return jsonResponse({ error: "Server error", message: error.message }, 500);
    }
  }
};
async function verifyPayment(txHash, env) {
  try {
    const receiptRes = await fetch(env.BASE_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionReceipt",
        params: [txHash],
        id: 1
      })
    });
    const receiptData = await receiptRes.json();
    const receipt = receiptData.result;
    if (!receipt) {
      return { valid: false, reason: "Transaction not found" };
    }
    if (receipt.status !== "0x1") {
      return { valid: false, reason: "Transaction failed" };
    }
    const txRes = await fetch(env.BASE_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionByHash",
        params: [txHash],
        id: 2
      })
    });
    const txData = await txRes.json();
    const tx = txData.result;
    if (!tx) {
      return { valid: false, reason: "Transaction details not found" };
    }
    const blockRes = await fetch(env.BASE_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBlockByNumber",
        params: [receipt.blockNumber, false],
        id: 3
      })
    });
    const blockData = await blockRes.json();
    const blockTimestamp = parseInt(blockData.result.timestamp, 16);
    const now = Math.floor(Date.now() / 1e3);
    if (now - blockTimestamp > 300) {
      return { valid: false, reason: "Payment expired (>5 min old)" };
    }
    return {
      valid: true,
      crawlerAddress: tx.from,
      amount: env.PRICE_PER_REQUEST
    };
  } catch (error) {
    console.error("Payment verification error:", error);
    return { valid: false, reason: "Verification error" };
  }
}
__name(verifyPayment, "verifyPayment");
async function logCrawl(params) {
  try {
    await fetch(`${params.env.SUPABASE_URL}/rest/v1/crawl_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: params.env.SUPABASE_KEY,
        Authorization: `Bearer ${params.env.SUPABASE_KEY}`,
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        tx_hash: params.txHash,
        path: params.path,
        publisher_address: params.publisherAddress,
        crawler_address: params.crawlerAddress,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })
    });
    if (params.amount && params.crawlerAddress) {
      await fetch(`${params.env.SUPABASE_URL}/rest/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: params.env.SUPABASE_KEY,
          Authorization: `Bearer ${params.env.SUPABASE_KEY}`,
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          tx_hash: params.txHash,
          crawler_address: params.crawlerAddress,
          publisher_address: params.publisherAddress,
          amount: params.amount,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        })
      });
    }
  } catch (error) {
    console.error("Failed to log crawl:", error);
  }
}
__name(logCrawl, "logCrawl");
function getContent(path) {
  return CONTENT_STORE[path] || null;
}
__name(getContent, "getContent");
function paymentRequiredResponse(env, path) {
  const priceInWei = Math.floor(parseFloat(env.PRICE_PER_REQUEST) * 1e6).toString();
  return new Response(
    JSON.stringify({
      error: "Payment required",
      message: "Include payment transaction hash in Authorization header",
      instructions: {
        step1: "Pay publisher via PaymentProcessor contract",
        step2: "Include tx hash in Authorization: Bearer <tx_hash>",
        step3: "Retry request with payment proof"
      },
      payment: {
        recipient: env.PUBLISHER_ADDRESS,
        amount: env.PRICE_PER_REQUEST,
        amountWei: priceInWei,
        token: "USDC",
        chainId: 84532
      },
      content: {
        path,
        available: !!CONTENT_STORE[path]
      }
    }),
    {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "X-Tachi-Price": priceInWei,
        "X-Tachi-Recipient": env.PUBLISHER_ADDRESS,
        "X-Tachi-Token": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        // USDC Base Sepolia
        "X-Tachi-Chain-Id": "84532",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "X-Tachi-Price,X-Tachi-Recipient,X-Tachi-Token,X-Tachi-Chain-Id"
      }
    }
  );
}
__name(paymentRequiredResponse, "paymentRequiredResponse");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(jsonResponse, "jsonResponse");
function corsResponse() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(corsResponse, "corsResponse");

// ../node_modules/.pnpm/wrangler@3.114.15_@cloudflare+workers-types@4.20251011.0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/.pnpm/wrangler@3.114.15_@cloudflare+workers-types@4.20251011.0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-u133CF/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../node_modules/.pnpm/wrangler@3.114.15_@cloudflare+workers-types@4.20251011.0/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-u133CF/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
