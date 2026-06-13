import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApiServer } from './app.mjs';

async function withServer(fn) {
  const dataDir = await mkdtemp(join(tmpdir(), 'relayhub-test-'));
  const server = createApiServer({ dataDir });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  }
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {})
    }
  });
  const body = await response.json();
  return { response, body };
}

test('health endpoint reports service status', async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/api/health');
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.service, 'relayhub-api');
  });
});

test('auth and dashboard endpoints return account data', async () => {
  await withServer(async (baseUrl) => {
    const login = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'dev@example.com', password: 'password123' })
    });

    assert.equal(login.response.status, 200);
    assert.equal(login.body.account.email, 'dev@example.com');
    assert.ok(login.body.token);

    const account = await request(baseUrl, '/api/account');
    assert.equal(account.body.email, 'dev@example.com');
  });
});

test('api keys can be created and toggled persistently', async () => {
  await withServer(async (baseUrl) => {
    const created = await request(baseUrl, '/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name: '集成测试' })
    });

    assert.equal(created.response.status, 201);
    assert.equal(created.body.name, '集成测试');
    assert.equal(created.body.status, 'active');
    assert.match(created.body.secret, /^rh_live_sk_/);

    const updated = await request(baseUrl, `/api/keys/${created.body.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'disabled' })
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.status, 'disabled');

    const keys = await request(baseUrl, '/api/keys');
    assert.equal(keys.body[0].status, 'disabled');
  });
});

test('read endpoints expose models, usage, billing, and docs', async () => {
  await withServer(async (baseUrl) => {
    const models = await request(baseUrl, '/api/models');
    const usage = await request(baseUrl, '/api/usage?model=gpt-4.1-mini');
    const billing = await request(baseUrl, '/api/billing');
    const docs = await request(baseUrl, '/api/docs/examples');

    assert.ok(models.body.some((model) => model.id === 'gpt-4.1-mini'));
    assert.ok(usage.body.every((point) => point.model === 'gpt-4.1-mini'));
    assert.ok(billing.body.some((record) => record.type === 'recharge'));
    assert.deepEqual(docs.body.map((example) => example.language), ['curl', 'Node.js', 'Python']);
  });
});

test('invalid input returns a stable error shape', async () => {
  await withServer(async (baseUrl) => {
    const result = await request(baseUrl, '/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name: '' })
    });

    assert.equal(result.response.status, 400);
    assert.equal(result.body.error.code, 'validation_error');
    assert.ok(result.body.error.message);
  });
});
