import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import { CopyButton, StatusBadge } from './components/ui';

const adminUser = {
  id: 1,
  email: 'admin@sub2api.local',
  username: '系统管理员',
  role: 'admin',
  balance: 0,
  status: 'active',
  created_at: '2026-06-14T08:00:00Z'
};

const fixtures = {
  dashboard: {
    today_requests: 12840,
    success_rate: 99.2,
    active_users: 326,
    healthy_accounts: 18,
    total_accounts: 21,
    open_alerts: 3,
    balance_total: 4680.5,
    recent_errors: [
      { id: 301, request_id: 'req_301', status_code: 529, message: 'Upstream overloaded', model: 'claude-sonnet-4', created_at: '2026-06-14 10:20' }
    ]
  },
  users: {
    items: [
      { id: 12, email: 'ops@example.com', username: '运营客户', role: 'user', balance: 128.5, status: 'active', created_at: '2026-06-01' }
    ],
    total: 1
  },
  apiKeys: {
    items: [
      { id: 51, name: '生产 Key', user_email: 'ops@example.com', key_preview: 'sk-...prod', group_name: 'Claude 高并发', status: 'active', rpm_limit: 300 }
    ],
    total: 1
  },
  accounts: {
    items: [
      { id: 7, name: 'Claude Team 01', platform: 'anthropic', account_type: 'oauth', status: 'active', group_names: ['Claude 高并发'], schedulable: true }
    ],
    total: 1
  },
  groups: {
    items: [
      { id: 3, name: 'Claude 高并发', platform: 'anthropic', status: 'active', rate_multiplier: 1.2, rpm: 600, accounts_count: 8 }
    ],
    total: 1
  },
  channels: {
    items: [
      { id: 9, name: 'OpenAI Responses', platform: 'openai', status: 'active', base_url: 'https://api.openai.com', models_count: 24 }
    ],
    total: 1
  },
  usage: {
    items: [
      { id: 4001, user_email: 'ops@example.com', model: 'claude-sonnet-4', request_type: 'stream', tokens: 1820, cost: 0.91, status: 'success', created_at: '2026-06-14 10:21' }
    ],
    total: 1
  },
  requestErrors: {
    items: [
      { id: 301, request_id: 'req_301', status_code: 529, message: 'Upstream overloaded', model: 'claude-sonnet-4', created_at: '2026-06-14 10:20' }
    ],
    total: 1
  },
  paymentOrders: {
    items: [
      { id: 88, user_email: 'ops@example.com', amount: 200, status: 'paid', provider: 'stripe', created_at: '2026-06-14' }
    ],
    total: 1
  },
  settings: {
    version: 'v0.9.0',
    run_mode: 'standard',
    gateway_base_url: 'https://api.example.com/v1',
    backup_enabled: true
  }
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), 'http://localhost');
      const method = init?.method ?? 'GET';
      const headers = new Headers(init?.headers);

      if (method === 'POST' && url.pathname === '/api/v1/auth/login') {
        return jsonResponse({ access_token: 'admin-token', token_type: 'Bearer', user: adminUser });
      }

      if (url.pathname.startsWith('/api/v1/admin') && headers.get('authorization') !== 'Bearer admin-token') {
        return jsonResponse({ error: { message: 'missing token' } }, 401);
      }

      const routes: Record<string, unknown> = {
        '/api/v1/auth/me': { user: adminUser },
        '/api/v1/admin/dashboard': fixtures.dashboard,
        '/api/v1/admin/users': fixtures.users,
        '/api/v1/admin/api-keys': fixtures.apiKeys,
        '/api/v1/admin/accounts': fixtures.accounts,
        '/api/v1/admin/groups': fixtures.groups,
        '/api/v1/admin/channels': fixtures.channels,
        '/api/v1/admin/usage': fixtures.usage,
        '/api/v1/admin/ops/request-errors': fixtures.requestErrors,
        '/api/v1/admin/payment/orders': fixtures.paymentOrders,
        '/api/v1/admin/settings': fixtures.settings
      };

      if (method === 'GET' && routes[url.pathname]) {
        return jsonResponse(routes[url.pathname]);
      }

      return jsonResponse({ error: { message: `unhandled ${method} ${url.pathname}` } }, 404);
    })
  );
});

describe('sub2api admin shell', () => {
  it('logs in through sub2api and loads the admin operations dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('管理员邮箱'), 'admin@sub2api.local');
    await userEvent.type(screen.getByLabelText('管理员密码'), 'change-me');
    await userEvent.click(screen.getByRole('button', { name: '登录管理员后台' }));

    expect(await screen.findByRole('heading', { name: '运营总览' })).toBeInTheDocument();
    expect(screen.getByText('sub2api Admin')).toBeInTheDocument();
    expect(screen.getByText('12,840')).toBeInTheDocument();
    expect(screen.getByText('99.2%')).toBeInTheDocument();
    expect(screen.getByText('Claude Team 01')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/admin/dashboard',
      expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer admin-token' }) })
    );
  });

  it('shows the admin-only navigation and account-pool pages', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('管理员邮箱'), 'admin@sub2api.local');
    await userEvent.type(screen.getByLabelText('管理员密码'), 'change-me');
    await userEvent.click(screen.getByRole('button', { name: '登录管理员后台' }));

    await userEvent.click(await screen.findByRole('link', { name: '订阅账户池' }));
    expect(screen.getByRole('heading', { name: '订阅账户池' })).toBeInTheDocument();
    expect(screen.getByText('anthropic')).toBeInTheDocument();
    expect(screen.getByText('Claude 高并发')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '分组调度' }));
    expect(screen.getByRole('heading', { name: '分组调度' })).toBeInTheDocument();
    expect(screen.getByText('倍率 1.2x')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '系统设置' }));
    expect(screen.getByRole('heading', { name: '系统设置' })).toBeInTheDocument();
    expect(screen.getByText('v0.9.0')).toBeInTheDocument();
  });

  it('keeps dense tables scannable for users, keys, logs, and orders', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('管理员邮箱'), 'admin@sub2api.local');
    await userEvent.type(screen.getByLabelText('管理员密码'), 'change-me');
    await userEvent.click(screen.getByRole('button', { name: '登录管理员后台' }));

    await userEvent.click(await screen.findByRole('link', { name: '用户管理' }));
    expect(within(screen.getByRole('table')).getByText('ops@example.com')).toBeInTheDocument();
    expect(screen.getByText('余额 ¥128.50')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'API Key 管理' }));
    expect(screen.getByText('sk-...prod')).toBeInTheDocument();
    expect(screen.getByText('300 RPM')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '调用日志' }));
    expect(screen.getByText('stream')).toBeInTheDocument();
    expect(screen.getByText('1,820')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '订单余额' }));
    expect(screen.getByText('stripe')).toBeInTheDocument();
    expect(screen.getByText('¥200.00')).toBeInTheDocument();
  });
});

describe('shared UI', () => {
  it('renders status badges with readable text', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('启用')).toBeInTheDocument();
  });

  it('copies text through the copy button callback path', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
    const onDone = vi.fn();
    render(<CopyButton value="copy-me" label="复制测试" onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: '复制测试' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy-me');
    expect(onDone).toHaveBeenCalledWith(true);
  });
});
