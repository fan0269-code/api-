import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedData } from './seed-data.mjs';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const defaultDataDir = join(root, 'server', 'data');
const defaultPublicDir = join(root, 'dist');

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

const staticTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const defaultAdminToken = 'demo-session-token';

function sendJson(res, status, payload) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(payload));
}

function sendError(res, status, code, message) {
  sendJson(res, status, { error: { code, message } });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 1024 * 64) {
      throw Object.assign(new Error('Request body too large'), { status: 413, code: 'payload_too_large' });
    }
  }

  if (!chunks.length) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { status: 400, code: 'invalid_json' });
  }
}

function createStore(dataDir) {
  const path = join(dataDir, 'db.json');
  let writeQueue = Promise.resolve();

  function normalize(data) {
    if (!Array.isArray(data.channels)) {
      data.channels = structuredClone(seedData.channels);
    }
    if (Array.isArray(data.apiKeys)) {
      data.apiKeys = data.apiKeys.map((key, index) => ({
        monthlyQuota: seedData.apiKeys[index]?.monthlyQuota ?? 50,
        monthlyUsed: seedData.apiKeys[index]?.monthlyUsed ?? 0,
        rateLimitPerMinute: seedData.apiKeys[index]?.rateLimitPerMinute ?? 60,
        ...key
      }));
    }
    return data;
  }

  async function ensure() {
    await mkdir(dirname(path), { recursive: true });
    if (!existsSync(path)) {
      await writeFile(path, JSON.stringify(seedData, null, 2), 'utf8');
    }
  }

  async function read() {
    await ensure();
    return normalize(JSON.parse(await readFile(path, 'utf8')));
  }

  async function update(mutator) {
    await ensure();
    writeQueue = writeQueue.then(async () => {
      const data = normalize(JSON.parse(await readFile(path, 'utf8')));
      const result = await mutator(data);
      await writeFile(path, JSON.stringify(data, null, 2), 'utf8');
      return result;
    });
    return writeQueue;
  }

  return { read, update };
}

function maskSecret(secret) {
  return `rh_live_••••••••••••${secret.slice(-4)}`;
}

function createSecret() {
  return `rh_live_sk_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function getBearerToken(req) {
  const header = req.headers.authorization ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? '';
}

function estimateTokens(messages) {
  const text = messages.map((message) => String(message.content ?? '')).join(' ');
  return Math.max(1, Math.ceil(text.length / 4));
}

function createMockCompletion({ model, messages }) {
  const promptTokens = estimateTokens(messages);
  const completionText = 'RelayHub mock response: 请求已通过 API 中转站验证。配置上游密钥后可切换为真实模型转发。';
  const completionTokens = estimateTokens([{ content: completionText }]);

  return {
    id: `chatcmpl_${Date.now().toString(36)}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: completionText
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    }
  };
}

async function createUpstreamCompletion({ upstreamBaseUrl, upstreamApiKey, body }) {
  const endpoint = `${upstreamBaseUrl.replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${upstreamApiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: { code: 'upstream_error', message: text || 'Upstream returned a non-JSON response' } };
  }

  if (!response.ok) {
    const message = payload?.error?.message ?? `Upstream request failed with status ${response.status}`;
    throw Object.assign(new Error(message), {
      status: response.status >= 500 ? 502 : response.status,
      code: payload?.error?.code ?? 'upstream_error'
    });
  }

  return payload;
}

async function createUpstreamStream({ upstreamBaseUrl, upstreamApiKey, body }) {
  const endpoint = `${upstreamBaseUrl.replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${upstreamApiKey}`,
      'content-type': 'application/json',
      accept: 'text/event-stream'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { error: { code: 'upstream_error', message: text || 'Upstream stream request failed' } };
    }
    const message = payload?.error?.message ?? `Upstream stream request failed with status ${response.status}`;
    throw Object.assign(new Error(message), {
      status: response.status >= 500 ? 502 : response.status,
      code: payload?.error?.code ?? 'upstream_error'
    });
  }

  return response;
}

function getCompletionTotalTokens(completion, messages) {
  if (Number.isFinite(completion?.usage?.total_tokens)) {
    return Math.max(1, completion.usage.total_tokens);
  }
  return estimateTokens(messages) + 24;
}

function todayLabel() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function recordRelayUsage(data, { model, cost, latencyMs }) {
  const point = {
    date: todayLabel(),
    model,
    calls: 1,
    cost,
    errorRate: 0,
    latencyMs,
    source: 'relay'
  };
  data.usageSeries.push(point);
  data.account.balance = Number((data.account.balance - cost).toFixed(4));
  data.account.monthlySpend = Number((data.account.monthlySpend + cost).toFixed(4));
  data.billingRecords.unshift({
    id: `bill_${Date.now().toString(36)}`,
    date: new Date().toISOString().slice(0, 10),
    type: 'usage',
    description: `${model} 中转调用`,
    amount: -cost,
    balanceAfter: data.account.balance
  });
}

async function recordRelaySuccess(store, { token, model, totalTokens, latencyMs }) {
  await store.update((data) => {
    const key = data.apiKeys.find((item) => item.secret === token);
    if (!key || key.status !== 'active') {
      return;
    }
    const cost = Number(((totalTokens / 1000) * 0.002).toFixed(4));
    recordRelayUsage(data, { model, cost, latencyMs });
    key.monthlyUsed = Number((Number(key.monthlyUsed ?? 0) + cost).toFixed(4));
    key.lastUsedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
  });
}

function createRateLimiter() {
  const buckets = new Map();

  return {
    check(key) {
      const limit = Number(key.rateLimitPerMinute ?? 60);
      if (!Number.isFinite(limit) || limit <= 0) {
        return { ok: false, retryAfter: 60 };
      }

      const now = Date.now();
      const windowMs = 60 * 1000;
      const bucket = buckets.get(key.id);
      if (!bucket || now - bucket.startedAt >= windowMs) {
        buckets.set(key.id, { startedAt: now, count: 1 });
        return { ok: true };
      }

      if (bucket.count >= limit) {
        return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - bucket.startedAt)) / 1000)) };
      }

      bucket.count += 1;
      return { ok: true };
    }
  };
}

function sendSseChunk(res, payload) {
  res.write(`data: ${typeof payload === 'string' ? payload : JSON.stringify(payload)}\n\n`);
}

async function sendMockStream(res, { model, messages }) {
  const id = `chatcmpl_${Date.now().toString(36)}`;
  const created = Math.floor(Date.now() / 1000);
  const completionText = 'RelayHub mock stream: 请求已通过 API 中转站验证。';

  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no'
  });
  sendSseChunk(res, {
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }]
  });
  sendSseChunk(res, {
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [{ index: 0, delta: { content: completionText }, finish_reason: null }]
  });
  sendSseChunk(res, {
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
  });
  sendSseChunk(res, '[DONE]');

  return estimateTokens(messages) + estimateTokens([{ content: completionText }]);
}

async function pipeUpstreamStream(res, upstreamResponse) {
  res.writeHead(200, {
    'content-type': upstreamResponse.headers.get('content-type') ?? 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no'
  });

  if (!upstreamResponse.body) {
    return;
  }

  for await (const chunk of upstreamResponse.body) {
    res.write(Buffer.from(chunk));
  }
}

async function serveStatic(req, res, publicDir) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const candidate = resolve(publicDir, pathname === '/' ? 'index.html' : pathname.slice(1));
  const safeRoot = resolve(publicDir);
  const filePath = candidate.startsWith(safeRoot) ? candidate : join(publicDir, 'index.html');

  try {
    const info = await stat(filePath);
    if (info.isFile()) {
      const ext = extname(filePath);
      res.writeHead(200, {
        'content-type': staticTypes[ext] ?? 'application/octet-stream',
        'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
      });
      createReadStream(filePath).pipe(res);
      return;
    }
  } catch {
    // Fall through to SPA index.
  }

  const indexPath = join(publicDir, 'index.html');
  try {
    res.writeHead(200, {
      'content-type': staticTypes['.html'],
      'cache-control': 'no-cache'
    });
    createReadStream(indexPath).pipe(res);
  } catch {
    sendError(res, 404, 'not_found', 'Static asset not found');
  }
}

async function handleApi(req, res, store, adminToken) {
  const url = new URL(req.url, 'http://localhost');
  const { pathname, searchParams } = url;

  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'relayhub-api', timestamp: new Date().toISOString() });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readBody(req);
    if (!String(body.identifier ?? '').trim() || !String(body.password ?? '').trim()) {
      sendError(res, 400, 'validation_error', 'identifier and password are required');
      return;
    }
    const data = await store.read();
    sendJson(res, 200, { token: adminToken, account: data.account });
    return;
  }

  if (getBearerToken(req) !== adminToken) {
    sendError(res, 401, 'unauthorized', 'Valid console session token is required');
    return;
  }

  const data = await store.read();

  if (req.method === 'GET' && pathname === '/api/account') {
    sendJson(res, 200, data.account);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/keys') {
    sendJson(res, 200, data.apiKeys);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/keys') {
    const body = await readBody(req);
    const name = String(body.name ?? '').trim();
    if (!name) {
      sendError(res, 400, 'validation_error', 'name is required');
      return;
    }
    const created = await store.update((current) => {
      const secret = createSecret();
      const key = {
        id: `key_${Date.now()}`,
        name,
        maskedKey: maskSecret(secret),
        secret,
        status: 'active',
        scopes: ['chat', 'embeddings'],
        monthlyQuota: 50,
        monthlyUsed: 0,
        rateLimitPerMinute: 60,
        createdAt: new Date().toISOString().slice(0, 10),
        lastUsedAt: '刚刚'
      };
      current.apiKeys.unshift(key);
      return key;
    });
    sendJson(res, 201, created);
    return;
  }

  const keyMatch = pathname.match(/^\/api\/keys\/([^/]+)$/);
  if (req.method === 'PATCH' && keyMatch) {
    const body = await readBody(req);
    if (!['active', 'disabled'].includes(body.status)) {
      sendError(res, 400, 'validation_error', 'status must be active or disabled');
      return;
    }
    const updated = await store.update((current) => {
      const key = current.apiKeys.find((item) => item.id === keyMatch[1]);
      if (!key) {
        return null;
      }
      key.status = body.status;
      return key;
    });
    if (!updated) {
      sendError(res, 404, 'not_found', 'API key not found');
      return;
    }
    sendJson(res, 200, updated);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/models') {
    sendJson(res, 200, data.models);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/channels') {
    sendJson(res, 200, data.channels);
    return;
  }

  const channelMatch = pathname.match(/^\/api\/channels\/([^/]+)$/);
  if (req.method === 'PATCH' && channelMatch) {
    const body = await readBody(req);
    if (!['active', 'degraded', 'disabled'].includes(body.status)) {
      sendError(res, 400, 'validation_error', 'status must be active, degraded, or disabled');
      return;
    }
    const updated = await store.update((current) => {
      const channel = current.channels.find((item) => item.id === channelMatch[1]);
      if (!channel) {
        return null;
      }
      channel.status = body.status;
      channel.lastCheckedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
      return channel;
    });
    if (!updated) {
      sendError(res, 404, 'not_found', 'Channel not found');
      return;
    }
    sendJson(res, 200, updated);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/usage') {
    const model = searchParams.get('model');
    sendJson(res, 200, model && model !== 'all' ? data.usageSeries.filter((point) => point.model === model) : data.usageSeries);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/billing') {
    sendJson(res, 200, data.billingRecords);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/billing/recharge') {
    const body = await readBody(req);
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 10 || amount > 10000) {
      sendError(res, 400, 'validation_error', 'amount must be between 10 and 10000');
      return;
    }

    const result = await store.update((current) => {
      const normalizedAmount = Number(amount.toFixed(2));
      current.account.balance = Number((current.account.balance + normalizedAmount).toFixed(2));
      const record = {
        id: `bill_${Date.now().toString(36)}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'recharge',
        description: '账户余额充值',
        amount: normalizedAmount,
        balanceAfter: current.account.balance
      };
      current.billingRecords.unshift(record);
      return { account: current.account, record };
    });

    sendJson(res, 201, result);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/docs/examples') {
    sendJson(res, 200, data.docsExamples);
    return;
  }

  sendError(res, 404, 'not_found', 'API route not found');
}

async function handleRelay(req, res, store, relayConfig, rateLimiter) {
  const url = new URL(req.url, 'http://localhost');
  if (!(req.method === 'POST' && url.pathname === '/v1/chat/completions')) {
    sendError(res, 404, 'not_found', 'Relay route not found');
    return;
  }

  const token = getBearerToken(req);
  if (!token) {
    sendError(res, 401, 'invalid_api_key', 'Missing Bearer API key');
    return;
  }

  const body = await readBody(req);
  const modelId = String(body.model ?? '').trim();
  const messages = Array.isArray(body.messages) ? body.messages : [];

  if (!modelId || !messages.length) {
    sendError(res, 400, 'validation_error', 'model and messages are required');
    return;
  }

  const started = Date.now();
  const access = await store.read().then((data) => {
    const key = data.apiKeys.find((item) => item.secret === token);
    if (!key) {
      return { status: 401, error: { code: 'invalid_api_key', message: 'API key is invalid' } };
    }
    if (key.status !== 'active') {
      return { status: 403, error: { code: 'key_disabled', message: 'API key is disabled' } };
    }
    if (Number(key.monthlyUsed ?? 0) >= Number(key.monthlyQuota ?? 0)) {
      return { status: 402, error: { code: 'quota_exceeded', message: 'API key monthly quota has been exhausted' } };
    }

    const rate = rateLimiter.check(key);
    if (!rate.ok) {
      return { status: 429, error: { code: 'rate_limit_exceeded', message: `Rate limit exceeded. Retry after ${rate.retryAfter}s` } };
    }

    const model = data.models.find((item) => item.id === modelId);
    if (!model || model.status === 'maintenance') {
      return { status: 400, error: { code: 'validation_error', message: 'model is unavailable' } };
    }

    if (relayConfig.upstreamBaseUrl && relayConfig.upstreamApiKey) {
      const channel = data.channels.find(
        (item) => item.status === 'active' && item.provider === model.provider && item.models.includes(modelId)
      );
      if (!channel) {
        return { status: 503, error: { code: 'channel_unavailable', message: 'No active upstream channel for this model' } };
      }
    }

    return { status: 200 };
  });

  if (access.error) {
    sendError(res, access.status, access.error.code, access.error.message);
    return;
  }

  const hasUpstream = relayConfig.upstreamBaseUrl && relayConfig.upstreamApiKey;

  if (body.stream === true) {
    const totalTokens = hasUpstream
      ? await createUpstreamStream({
          upstreamBaseUrl: relayConfig.upstreamBaseUrl,
          upstreamApiKey: relayConfig.upstreamApiKey,
          body
        }).then(async (upstreamResponse) => {
          await pipeUpstreamStream(res, upstreamResponse);
          return estimateTokens(messages) + 24;
        })
      : await sendMockStream(res, { model: modelId, messages });

    await recordRelaySuccess(store, {
      token,
      model: modelId,
      totalTokens,
      latencyMs: Math.max(1, Date.now() - started)
    });
    res.end();
    return;
  }

  const completion = hasUpstream
    ? await createUpstreamCompletion({
        upstreamBaseUrl: relayConfig.upstreamBaseUrl,
        upstreamApiKey: relayConfig.upstreamApiKey,
        body
      })
    : createMockCompletion({ model: modelId, messages });

  await recordRelaySuccess(store, {
    token,
    model: modelId,
    totalTokens: getCompletionTotalTokens(completion, messages),
    latencyMs: Math.max(1, Date.now() - started)
  });

  sendJson(res, 200, completion);
}

export function createApiServer({
  dataDir = defaultDataDir,
  publicDir = defaultPublicDir,
  upstreamBaseUrl = process.env.RELAY_UPSTREAM_BASE_URL,
  upstreamApiKey = process.env.RELAY_UPSTREAM_API_KEY,
  adminToken = process.env.RELAY_ADMIN_TOKEN || defaultAdminToken
} = {}) {
  const store = createStore(dataDir);
  const rateLimiter = createRateLimiter();
  const relayConfig = {
    upstreamBaseUrl: upstreamBaseUrl?.trim(),
    upstreamApiKey: upstreamApiKey?.trim()
  };

  return createServer(async (req, res) => {
    try {
      res.setHeader('x-content-type-options', 'nosniff');
      if (req.url?.startsWith('/api/')) {
        await handleApi(req, res, store, adminToken);
      } else if (req.url?.startsWith('/v1/')) {
        await handleRelay(req, res, store, relayConfig, rateLimiter);
      } else {
        await serveStatic(req, res, publicDir);
      }
    } catch (error) {
      sendError(res, error.status ?? 500, error.code ?? 'internal_error', error.message ?? 'Internal server error');
    }
  });
}
