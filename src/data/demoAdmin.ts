import type { AdminConsoleData, AdminSession } from '../types';

export const demoAdminSession: AdminSession = {
  access_token: 'demo-admin-token',
  token_type: 'Bearer',
  user: {
    id: 1,
    email: 'admin@zhilian.local',
    username: '演示管理员',
    role: 'admin',
    balance: 0,
    status: 'active',
    created_at: '2026-06-14'
  }
};

export const demoConsoleData: AdminConsoleData = {
  dashboard: {
    today_requests: 12840,
    success_rate: 99.2,
    active_users: 326,
    healthy_accounts: 18,
    total_accounts: 21,
    open_alerts: 3,
    balance_total: 4680.5,
    recent_errors: [
      {
        id: 301,
        request_id: 'req_301',
        status_code: 529,
        message: 'Upstream overloaded',
        model: 'claude-sonnet-4',
        created_at: '2026-06-14 10:20'
      }
    ]
  },
  users: {
    total: 3,
    items: [
      { id: 12, email: 'ops@example.com', username: '运营客户', role: 'user', balance: 128.5, status: 'active', created_at: '2026-06-01' },
      { id: 13, email: 'team@example.com', username: '团队客户', role: 'user', balance: 820, status: 'active', created_at: '2026-05-18' },
      { id: 14, email: 'trial@example.com', username: '试用客户', role: 'user', balance: 12.4, status: 'degraded', created_at: '2026-06-10' }
    ]
  },
  apiKeys: {
    total: 2,
    items: [
      { id: 51, name: '生产 Key', user_email: 'ops@example.com', key_preview: 'sk-...prod', group_name: 'Claude 高并发', status: 'active', rpm_limit: 300 },
      { id: 52, name: '测试 Key', user_email: 'team@example.com', key_preview: 'sk-...test', group_name: '通用模型池', status: 'active', rpm_limit: 120 }
    ]
  },
  accounts: {
    total: 3,
    items: [
      { id: 7, name: 'Claude Team 01', platform: 'anthropic', account_type: 'oauth', status: 'active', group_names: ['Claude 高并发'], schedulable: true },
      { id: 8, name: 'OpenAI Pool 02', platform: 'openai', account_type: 'api_key', status: 'active', group_names: ['通用模型池'], schedulable: true },
      { id: 9, name: '备用 Claude 03', platform: 'anthropic', account_type: 'oauth', status: 'maintenance', group_names: ['备用池'], schedulable: false }
    ]
  },
  groups: {
    total: 3,
    items: [
      { id: 3, name: 'Claude 高并发', platform: 'anthropic', status: 'active', rate_multiplier: 1.2, rpm: 600, accounts_count: 8 },
      { id: 4, name: '通用模型池', platform: 'mixed', status: 'active', rate_multiplier: 1, rpm: 420, accounts_count: 10 },
      { id: 5, name: '备用池', platform: 'mixed', status: 'maintenance', rate_multiplier: 0.8, rpm: 120, accounts_count: 3 }
    ]
  },
  channels: {
    total: 3,
    items: [
      { id: 9, name: 'OpenAI Responses', platform: 'openai', status: 'active', base_url: 'https://api.openai.com', models_count: 24 },
      { id: 10, name: 'Anthropic Messages', platform: 'anthropic', status: 'active', base_url: 'https://api.anthropic.com', models_count: 12 },
      { id: 11, name: 'Gemini Gateway', platform: 'google', status: 'degraded', base_url: 'https://generativelanguage.googleapis.com', models_count: 9 }
    ]
  },
  usage: {
    total: 3,
    items: [
      { id: 4001, user_email: 'ops@example.com', model: 'claude-sonnet-4', request_type: 'stream', tokens: 1820, cost: 0.91, status: 'success', created_at: '2026-06-14 10:21' },
      { id: 4002, user_email: 'team@example.com', model: 'gpt-4.1-mini', request_type: 'chat', tokens: 920, cost: 0.18, status: 'success', created_at: '2026-06-14 10:18' },
      { id: 4003, user_email: 'trial@example.com', model: 'gemini-2.5-flash', request_type: 'chat', tokens: 640, cost: 0.08, status: 'failed', created_at: '2026-06-14 10:11' }
    ]
  },
  requestErrors: {
    total: 2,
    items: [
      { id: 301, request_id: 'req_301', status_code: 529, message: 'Upstream overloaded', model: 'claude-sonnet-4', created_at: '2026-06-14 10:20' },
      { id: 302, request_id: 'req_302', status_code: 429, message: 'Rate limit exceeded', model: 'gemini-2.5-flash', created_at: '2026-06-14 09:57' }
    ]
  },
  paymentOrders: {
    total: 2,
    items: [
      { id: 88, user_email: 'ops@example.com', amount: 200, status: 'paid', provider: 'stripe', created_at: '2026-06-14' },
      { id: 89, user_email: 'team@example.com', amount: 500, status: 'pending', provider: 'alipay', created_at: '2026-06-13' }
    ]
  },
  settings: {
    version: 'v0.9.0',
    run_mode: 'standard',
    gateway_base_url: 'https://api.example.com/v1',
    backup_enabled: true
  }
};
