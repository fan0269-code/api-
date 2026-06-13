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
  const { auth = true, ...fetchOptions } = options;
  const headers = {
    'content-type': 'application/json',
    ...(auth && path.startsWith('/api/') && path !== '/api/health' && path !== '/api/auth/login'
      ? { authorization: 'Bearer demo-session-token' }
      : {}),
    ...(fetchOptions.headers ?? {})
  };
  const response = await fetch(`${baseUrl}${path}`, {
    ...fetchOptions,
    headers
  });
  const body = await response.json();
  return { response, body };
}

async function loginSession(baseUrl) {
  const login = await request(baseUrl, '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'dev@example.com', password: 'password123' })
  });
  return login.body.token;
}

async function authedRequest(baseUrl, path, options = {}) {
  const token = options.token ?? (await loginSession(baseUrl));
  return request(baseUrl, path, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.headers ?? {})
    }
  });
}

async function requestText(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {})
    }
  });
  const body = await response.text();
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
    if (calls.at(-1).body.stream === true) {
      res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8' });
      res.write('data: {"id":"chatcmpl_stream_test","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"upstream stream"},"finish_reason":null}]}\n\n');
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
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

    const account = await authedRequest(baseUrl, '/api/account', { token: login.body.token });
    assert.equal(account.body.email, 'dev@example.com');
  });
});

test('management endpoints reject missing console session tokens', async () => {
  await withServer(async (baseUrl) => {
    const account = await request(baseUrl, '/api/account', { auth: false });
    assert.equal(account.response.status, 401);
    assert.equal(account.body.error.code, 'unauthorized');

    const health = await request(baseUrl, '/api/health');
    assert.equal(health.response.status, 200);
  });
});

test('api keys can be created and toggled persistently', async () => {
  await withServer(async (baseUrl) => {
    const token = await loginSession(baseUrl);
    const created = await authedRequest(baseUrl, '/api/keys', {
      token,
      method: 'POST',
      body: JSON.stringify({ name: '集成测试' })
    });

    assert.equal(created.response.status, 201);
    assert.equal(created.body.name, '集成测试');
    assert.equal(created.body.status, 'active');
    assert.match(created.body.secret, /^rh_live_sk_/);

    const updated = await authedRequest(baseUrl, `/api/keys/${created.body.id}`, {
      token,
      method: 'PATCH',
      body: JSON.stringify({ status: 'disabled' })
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.status, 'disabled');

    const keys = await authedRequest(baseUrl, '/api/keys', { token });
    assert.equal(keys.body[0].status, 'disabled');
  });
});

test('read endpoints expose models, usage, billing, and docs', async () => {
  await withServer(async (baseUrl) => {
    const token = await loginSession(baseUrl);
    const models = await authedRequest(baseUrl, '/api/models', { token });
    const channels = await authedRequest(baseUrl, '/api/channels', { token });
    const usage = await authedRequest(baseUrl, '/api/usage?model=gpt-4.1-mini', { token });
    const requests = await authedRequest(baseUrl, '/api/requests?model=gpt-4.1-mini', { token });
    const billing = await authedRequest(baseUrl, '/api/billing', { token });
    const docs = await authedRequest(baseUrl, '/api/docs/examples', { token });

    assert.ok(models.body.some((model) => model.id === 'gpt-4.1-mini'));
    assert.ok(channels.body.some((channel) => channel.status === 'active'));
    assert.ok(usage.body.every((point) => point.model === 'gpt-4.1-mini'));
    assert.ok(requests.body.every((log) => log.model === 'gpt-4.1-mini'));
    assert.ok(requests.body.some((log) => log.maskedKey.includes('••••')));
    assert.ok(billing.body.some((record) => record.type === 'recharge'));
    assert.deepEqual(docs.body.map((example) => example.language), ['curl', 'Node.js', 'Python']);
  });
});

test('billing recharge updates account balance and records transaction', async () => {
  await withServer(async (baseUrl) => {
    const before = await request(baseUrl, '/api/account');
    const recharge = await request(baseUrl, '/api/billing/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount: 200 })
    });

    assert.equal(recharge.response.status, 201);
    assert.equal(recharge.body.account.balance, Number((before.body.balance + 200).toFixed(2)));
    assert.equal(recharge.body.record.type, 'recharge');
    assert.equal(recharge.body.record.amount, 200);

    const billing = await request(baseUrl, '/api/billing');
    assert.equal(billing.body[0].id, recharge.body.record.id);

    const after = await request(baseUrl, '/api/account');
    assert.equal(after.body.balance, recharge.body.account.balance);
  });
});

test('billing recharge validates amount range', async () => {
  await withServer(async (baseUrl) => {
    const result = await request(baseUrl, '/api/billing/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount: 5 })
    });

    assert.equal(result.response.status, 400);
    assert.equal(result.body.error.code, 'validation_error');
  });
});

test('channels can be toggled persistently', async () => {
  await withServer(async (baseUrl) => {
    const updated = await request(baseUrl, '/api/channels/channel_openai_primary', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'disabled' })
    });

    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.status, 'disabled');

    const channels = await request(baseUrl, '/api/channels');
    assert.equal(channels.body.find((channel) => channel.id === 'channel_openai_primary').status, 'disabled');
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
    const previousUsed = activeKey.monthlyUsed;

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

    const updatedKeys = await request(baseUrl, '/api/keys');
    const updatedKey = updatedKeys.body.find((key) => key.id === activeKey.id);
    assert.ok(updatedKey.monthlyUsed >= previousUsed);

    const requests = await request(baseUrl, '/api/requests?model=gpt-4.1-mini');
    assert.equal(requests.body[0].model, 'gpt-4.1-mini');
    assert.equal(requests.body[0].keyName, activeKey.name);
    assert.equal(requests.body[0].status, 'success');
    assert.equal(requests.body[0].stream, false);
    assert.ok(requests.body[0].tokens > 0);
  });
});

test('chat completions supports mock streaming responses and records usage', async () => {
  await withServer(async (baseUrl) => {
    const keys = await request(baseUrl, '/api/keys');
    const activeKey = keys.body.find((key) => key.status === 'active');

    const stream = await requestText(baseUrl, '/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${activeKey.secret}` },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        stream: true,
        messages: [{ role: 'user', content: 'Stream this' }]
      })
    });

    assert.equal(stream.response.status, 200);
    assert.match(stream.response.headers.get('content-type'), /text\/event-stream/);
    assert.match(stream.body, /chat\.completion\.chunk/);
    assert.match(stream.body, /RelayHub mock stream/);
    assert.match(stream.body, /data: \[DONE\]/);

    const usage = await request(baseUrl, '/api/usage?model=gpt-4.1-mini');
    assert.ok(usage.body.some((point) => point.source === 'relay'));

    const requests = await request(baseUrl, '/api/requests?model=gpt-4.1-mini');
    assert.equal(requests.body[0].stream, true);
  });
});

test('chat completions rejects keys that exhausted monthly quota', async () => {
  await withServer(async (baseUrl) => {
    const keys = await request(baseUrl, '/api/keys');
    const exhaustedKey = keys.body.find((key) => key.id === 'key_test');

    const completion = await request(baseUrl, '/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${exhaustedKey.secret}` },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    assert.equal(completion.response.status, 402);
    assert.equal(completion.body.error.code, 'quota_exceeded');
  });
});

test('chat completions enforces per-key rate limits', async () => {
  await withServer(async (baseUrl) => {
    const created = await request(baseUrl, '/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name: '限流测试' })
    });

    const first = await request(baseUrl, '/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${created.body.secret}` },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: 'First' }]
      })
    });
    assert.equal(first.response.status, 200);

    const results = [];
    for (let index = 0; index < created.body.rateLimitPerMinute + 1; index += 1) {
      results.push(
        await request(baseUrl, '/v1/chat/completions', {
          method: 'POST',
          headers: { authorization: `Bearer ${created.body.secret}` },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            messages: [{ role: 'user', content: `Burst ${index}` }]
          })
        })
      );
    }
    assert.ok(results.some((result) => result.response.status === 429));
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

test('chat completions proxies configured upstream streaming responses', async () => {
  await withUpstream(async (upstreamBaseUrl, calls) => {
    await withServer(
      async (baseUrl) => {
        const keys = await request(baseUrl, '/api/keys');
        const activeKey = keys.body.find((key) => key.status === 'active');

        const stream = await requestText(baseUrl, '/v1/chat/completions', {
          method: 'POST',
          headers: { authorization: `Bearer ${activeKey.secret}` },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            stream: true,
            messages: [{ role: 'user', content: 'Forward stream' }]
          })
        });

        assert.equal(stream.response.status, 200);
        assert.match(stream.response.headers.get('content-type'), /text\/event-stream/);
        assert.match(stream.body, /upstream stream/);
        assert.match(stream.body, /data: \[DONE\]/);
        assert.equal(calls.at(-1).body.stream, true);
        assert.equal(calls.at(-1).authorization, 'Bearer upstream-secret');

        const usage = await request(baseUrl, '/api/usage?model=gpt-4.1-mini');
        assert.ok(usage.body.some((point) => point.source === 'relay'));
      },
      { upstreamBaseUrl, upstreamApiKey: 'upstream-secret' }
    );
  });
});

test('chat completions rejects configured upstream when no active channel serves the model', async () => {
  await withUpstream(async (upstreamBaseUrl) => {
    await withServer(
      async (baseUrl) => {
        const keys = await request(baseUrl, '/api/keys');
        const activeKey = keys.body.find((key) => key.status === 'active');
        await request(baseUrl, '/api/channels/channel_openai_primary', {
          method: 'PATCH',
          body: JSON.stringify({ status: 'disabled' })
        });

        const completion = await request(baseUrl, '/v1/chat/completions', {
          method: 'POST',
          headers: { authorization: `Bearer ${activeKey.secret}` },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            messages: [{ role: 'user', content: 'Should not forward' }]
          })
        });

        assert.equal(completion.response.status, 503);
        assert.equal(completion.body.error.code, 'channel_unavailable');
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
