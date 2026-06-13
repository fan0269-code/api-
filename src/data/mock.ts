import type { Account, ApiKey, BillingRecord, DocsExample, ModelInfo, UsagePoint } from '../types';

export const baseUrl = 'https://api.relayhub.dev/v1';

export const account: Account = {
  name: '林开发者',
  email: 'dev@example.com',
  plan: 'Pro Developer',
  balance: 128.6,
  monthlySpend: 86.42,
  lowBalanceThreshold: 150
};

export const apiKeys: ApiKey[] = [
  {
    id: 'key_prod',
    name: '生产环境',
    maskedKey: 'rh_live_••••••••••••8K2A',
    secret: 'rh_live_sk_8K2A_demo_secret',
    status: 'active',
    scopes: ['chat', 'embeddings'],
    createdAt: '2026-06-01',
    lastUsedAt: '2026-06-13 09:48'
  },
  {
    id: 'key_test',
    name: '测试环境',
    maskedKey: 'rh_test_••••••••••••Q91P',
    secret: 'rh_test_sk_Q91P_demo_secret',
    status: 'active',
    scopes: ['chat'],
    createdAt: '2026-05-21',
    lastUsedAt: '2026-06-12 18:22'
  },
  {
    id: 'key_legacy',
    name: '旧版脚本',
    maskedKey: 'rh_live_••••••••••••7M3D',
    secret: 'rh_live_sk_7M3D_demo_secret',
    status: 'disabled',
    scopes: ['legacy'],
    createdAt: '2026-04-09',
    lastUsedAt: '2026-05-30 11:03'
  }
];

export const models: ModelInfo[] = [
  { id: 'gpt-4.1-mini', provider: 'OpenAI', context: '128K', inputPrice: '$0.40 / 1M', outputPrice: '$1.60 / 1M', latency: '620ms', status: 'available' },
  { id: 'claude-3.7-sonnet', provider: 'Anthropic', context: '200K', inputPrice: '$3.00 / 1M', outputPrice: '$15.00 / 1M', latency: '880ms', status: 'congested' },
  { id: 'gemini-2.5-flash', provider: 'Google', context: '1M', inputPrice: '$0.30 / 1M', outputPrice: '$2.50 / 1M', latency: '540ms', status: 'available' },
  { id: 'deepseek-chat', provider: 'DeepSeek', context: '64K', inputPrice: '$0.14 / 1M', outputPrice: '$0.28 / 1M', latency: '710ms', status: 'maintenance' }
];

export const usageSeries: UsagePoint[] = [
  { date: '06-07', model: 'gpt-4.1-mini', calls: 4200, cost: 8.4, errorRate: 0.4, latencyMs: 610 },
  { date: '06-08', model: 'gpt-4.1-mini', calls: 5100, cost: 10.2, errorRate: 0.3, latencyMs: 590 },
  { date: '06-09', model: 'claude-3.7-sonnet', calls: 3200, cost: 21.6, errorRate: 0.8, latencyMs: 920 },
  { date: '06-10', model: 'gemini-2.5-flash', calls: 7600, cost: 12.9, errorRate: 0.2, latencyMs: 520 },
  { date: '06-11', model: 'deepseek-chat', calls: 2800, cost: 2.8, errorRate: 1.7, latencyMs: 760 },
  { date: '06-12', model: 'gpt-4.1-mini', calls: 6900, cost: 13.8, errorRate: 0.5, latencyMs: 630 },
  { date: '06-13', model: 'gemini-2.5-flash', calls: 12900, cost: 16.72, errorRate: 0.3, latencyMs: 540 }
];

export const billingRecords: BillingRecord[] = [
  { id: 'bill_104', date: '2026-06-13', type: 'usage', description: '今日模型调用消费', amount: -16.72, balanceAfter: 128.6 },
  { id: 'bill_103', date: '2026-06-12', type: 'usage', description: 'API 调用消费', amount: -13.8, balanceAfter: 145.32 },
  { id: 'bill_102', date: '2026-06-09', type: 'usage', description: 'Claude 路由调用', amount: -21.6, balanceAfter: 159.12 },
  { id: 'bill_101', date: '2026-06-01', type: 'recharge', description: '余额充值', amount: 200, balanceAfter: 180.72 }
];

export const docsExamples: DocsExample[] = [
  {
    language: 'curl',
    code: `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer rh_live_sk_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4.1-mini","messages":[{"role":"user","content":"Hello"}]}'`
  },
  {
    language: 'Node.js',
    code: `const response = await fetch('${baseUrl}/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer rh_live_sk_xxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: 'Hello' }]
  })
});`
  },
  {
    language: 'Python',
    code: `import requests

response = requests.post(
    '${baseUrl}/chat/completions',
    headers={'Authorization': 'Bearer rh_live_sk_xxx'},
    json={'model': 'gpt-4.1-mini', 'messages': [{'role': 'user', 'content': 'Hello'}]},
)`
  }
];
