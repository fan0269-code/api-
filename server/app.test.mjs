import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApiServer } from './app.mjs';

async function withServer(fn, options = {}) {
  const dataDir = await mkdtemp(join(tmpdir(), 'relayhub-test-'));
  const server = createApiServer({ dataDir, ...options });
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

async function withUpstream(fn) {
  const calls = [];
  const server = createHttpServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    calls.push({
      method: req.method,
      url: req.url,
      authorization: req.headers.authorization,
      body: JSON.parse(Buffer.concat(chunks).toString('utf8'))
    });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        id: 'chatcmpl_upstream_test',
        object: 'chat.completion',
        created: 1781330000,
        model: 'gpt-4.1-mini',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'upstream ok' },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 }
      })
    );
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    await fn(`http://127.0.0.1:${port}/v1`, calls);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
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

test('chat completions accepts active relay keys and records usage', async () => {
  await withServer(async (baseUrl) => {
    const keys = await request(baseUrl, '/api/keys');
    const activeKey = keys.body.find((key) => key.status === 'active');

    const completion = await request(baseUrl, '/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${activeKey.secret}` },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: 'Hello RelayHub' }]
      })
    });

    assert.equal(completion.response.status, 200);
    assert.equal(completion.body.object, 'chat.completion');
    assert.equal(completion.body.model, 'gpt-4.1-mini');
    assert.equal(completion.body.choices[0].message.role, 'assistant');
    assert.ok(completion.body.usage.total_tokens > 0);

    const usage = await request(baseUrl, '/api/usage?model=gpt-4.1-mini');
    assert.ok(usage.body.some((point) => point.source === 'relay'));
  });
});

test('chat completions forwards to configured upstream and records usage', async () => {
  await withUpstream(async (upstreamBaseUrl, calls) => {
    await withServer(
      async (baseUrl) => {
        const keys = await request(baseUrl, '/api/keys');
        const activeKey = keys.body.find((key) => key.status === 'active');

        const completion = await request(baseUrl, '/v1/chat/completions', {
          method: 'POST',
          headers: { authorization: `Bearer ${activeKey.secret}` },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            messages: [{ role: 'user', content: 'Forward this' }]
          })
        });

        assert.equal(completion.response.status, 200);
        assert.equal(completion.body.id, 'chatcmpl_upstream_test');
        assert.equal(completion.body.choices[0].message.content, 'upstream ok');
        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, '/v1/chat/completions');
        assert.equal(calls[0].authorization, 'Bearer upstream-secret');
        assert.equal(calls[0].body.model, 'gpt-4.1-mini');

        const usage = await request(baseUrl, '/api/usage?model=gpt-4.1-mini');
        assert.ok(usage.body.some((point) => point.source === 'relay'));
      },
      { upstreamBaseUrl, upstreamApiKey: 'upstream-secret' }
    );
  });
});

test('chat completions rejects invalid or disabled keys', async () => {
  await withServer(async (baseUrl) => {
    const invalid = await request(baseUrl, '/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: 'Bearer bad_key' },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    assert.equal(invalid.response.status, 401);
    assert.equal(invalid.body.error.code, 'invalid_api_key');

    const keys = await request(baseUrl, '/api/keys');
    const disabledKey = keys.body.find((key) => key.status === 'disabled');
    const disabled = await request(baseUrl, '/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${disabledKey.secret}` },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    assert.equal(disabled.response.status, 403);
    assert.equal(disabled.body.error.code, 'key_disabled');
  });
});

test('chat completions validates model and messages', async () => {
  await withServer(async (baseUrl) => {
    const keys = await request(baseUrl, '/api/keys');
    const activeKey = keys.body.find((key) => key.status === 'active');

    const result = await request(baseUrl, '/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${activeKey.secret}` },
      body: JSON.stringify({
        model: 'unknown-model',
        messages: []
      })
    });

    assert.equal(result.response.status, 400);
    assert.equal(result.body.error.code, 'validation_error');
  });
});
