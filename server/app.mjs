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

  async function ensure() {
    await mkdir(dirname(path), { recursive: true });
    if (!existsSync(path)) {
      await writeFile(path, JSON.stringify(seedData, null, 2), 'utf8');
    }
  }

  async function read() {
    await ensure();
    return JSON.parse(await readFile(path, 'utf8'));
  }

  async function update(mutator) {
    await ensure();
    writeQueue = writeQueue.then(async () => {
      const data = JSON.parse(await readFile(path, 'utf8'));
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

async function handleApi(req, res, store) {
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
    sendJson(res, 200, { token: 'demo-session-token', account: data.account });
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

  if (req.method === 'GET' && pathname === '/api/usage') {
    const model = searchParams.get('model');
    sendJson(res, 200, model && model !== 'all' ? data.usageSeries.filter((point) => point.model === model) : data.usageSeries);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/billing') {
    sendJson(res, 200, data.billingRecords);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/docs/examples') {
    sendJson(res, 200, data.docsExamples);
    return;
  }

  sendError(res, 404, 'not_found', 'API route not found');
}

export function createApiServer({ dataDir = defaultDataDir, publicDir = defaultPublicDir } = {}) {
  const store = createStore(dataDir);
  return createServer(async (req, res) => {
    try {
      res.setHeader('x-content-type-options', 'nosniff');
      if (req.url?.startsWith('/api/')) {
        await handleApi(req, res, store);
      } else {
        await serveStatic(req, res, publicDir);
      }
    } catch (error) {
      sendError(res, error.status ?? 500, error.code ?? 'internal_error', error.message ?? 'Internal server error');
    }
  });
}
