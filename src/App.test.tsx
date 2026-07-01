import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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
    total_requests: 18000,
    today_requests: 12840,
    active_users: 326,
    normal_accounts: 18,
    total_accounts: 21,
    total_actual_cost: 4680.5
  },
  realtime: {
    error_rate: 0.8
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

let requireCompliance = false;
let complianceAccepted = false;

const complianceStatus = {
  required: true,
  version: 'v2026.06.10',
  document_path_zh: 'docs/legal/admin-compliance.zh.md',
  document_path_en: 'docs/legal/admin-compliance.en.md',
  document_url_zh: 'https://github.com/Wei-Shaw/sub2api/blob/main/docs/legal/admin-compliance.zh.md',
  document_url_en: 'https://github.com/Wei-Shaw/sub2api/blob/main/docs/legal/admin-compliance.en.md',
  ack_phrase_zh: '我已阅读、理解并同意 Sub2API 部署与运营合规承诺',
  ack_phrase_en: 'I have read, understood, and agree to the Sub2API Deployment and Operation Compliance Commitment'
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

beforeEach(() => {
  localStorage.clear();
  requireCompliance = false;
  complianceAccepted = false;
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

      if (method === 'GET' && url.pathname === '/api/v1/admin/compliance') {
        return jsonResponse({
          data: {
            ...complianceStatus,
            required: requireCompliance && !complianceAccepted
          }
        });
      }

      if (method === 'POST' && url.pathname === '/api/v1/admin/compliance/accept') {
        const body = JSON.parse(String(init?.body ?? '{}')) as { phrase?: string };
        if (body.phrase !== complianceStatus.ack_phrase_zh) {
          return jsonResponse({ error: { message: 'invalid compliance phrase' } }, 400);
        }
        complianceAccepted = true;
        return jsonResponse({ data: { ...complianceStatus, required: false } });
      }

      if (
        requireCompliance &&
        !complianceAccepted &&
        url.pathname.startsWith('/api/v1/admin/') &&
        url.pathname !== '/api/v1/admin/compliance' &&
        !url.pathname.startsWith('/api/v1/admin/compliance/')
      ) {
        return jsonResponse(
          {
            error: { message: 'administrator compliance acknowledgement is required' },
            data: complianceStatus
          },
          423
        );
      }

      const routes: Record<string, unknown> = {
        '/api/v1/auth/me': { user: adminUser },
        '/api/v1/admin/dashboard/stats': { data: fixtures.dashboard },
        '/api/v1/admin/dashboard/realtime': { data: fixtures.realtime },
        '/api/v1/admin/users': fixtures.users,
        '/api/v1/admin/groups/3/api-keys': fixtures.apiKeys,
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

      if (method === 'POST' && url.pathname === '/api/v1/admin/users/12/balance') {
        return jsonResponse({
          data: { id: 12, email: 'ops@example.com', username: '运营客户', role: 'user', balance: 158.5, status: 'active', created_at: '2026-06-01' }
        });
      }

      if (method === 'PUT' && url.pathname === '/api/v1/admin/api-keys/51') {
        return jsonResponse({
          data: {
            api_key: { id: 51, name: '生产 Key', user_email: 'ops@example.com', key_preview: 'sk-...prod', group_name: 'Claude 高并发', status: 'active', rpm_limit: 300 }
          }
        });
      }

      if (method === 'POST' && url.pathname === '/api/v1/admin/accounts/7/schedulable') {
        return jsonResponse({
          data: {
            id: 7,
            name: 'Claude Team 01',
            platform: 'anthropic',
            account_type: 'oauth',
            status: 'active',
            group_names: ['Claude 高并发'],
            schedulable: false
          }
        });
      }

      if (method === 'POST' && url.pathname === '/api/v1/admin/accounts/7/test') {
        return jsonResponse({ data: { status: 'accepted' } });
      }

      if (method === 'PUT' && url.pathname === '/api/v1/admin/channels/9') {
        return jsonResponse({
          data: {
            id: 9,
            name: 'OpenAI Responses',
            platform: 'openai',
            status: 'disabled',
            base_url: 'https://api.openai.com',
            models_count: 24
          }
        });
      }

      return jsonResponse({ error: { message: `unhandled ${method} ${url.pathname}` } }, 404);
    })
  );
});

describe('sub2api admin shell', () => {
  it('opens the local demo admin console without a live backend', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: '查看演示后台' }));

    expect(await screen.findByRole('heading', { name: '运营总览' })).toBeInTheDocument();
    expect(screen.getByText('智链 AI')).toBeInTheDocument();
    expect(screen.getByText('演示管理员')).toBeInTheDocument();
    expect(screen.getByText('Claude Team 01')).toBeInTheDocument();
  });

  it('logs in through sub2api and loads the admin operations dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('管理员邮箱'), 'admin@sub2api.local');
    await userEvent.type(screen.getByLabelText('管理员密码'), 'change-me');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: '登录管理员后台' }));

    expect(await screen.findByRole('heading', { name: '运营总览' })).toBeInTheDocument();
    expect(screen.getByText('智链 AI')).toBeInTheDocument();
    expect(screen.getByText('12,840')).toBeInTheDocument();
    expect(screen.getByText('99.2%')).toBeInTheDocument();
    expect(screen.getByText('Claude Team 01')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/admin/dashboard/stats',
      expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer admin-token' }) })
    );
    expect(fetch).toHaveBeenCalledWith('/api/v1/admin/groups/3/api-keys', expect.any(Object));
  });

  it('requires explicit admin compliance acknowledgment before loading real backend data', async () => {
    requireCompliance = true;

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('管理员邮箱'), 'admin@sub2api.local');
    await userEvent.type(screen.getByLabelText('管理员密码'), 'change-me');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: '登录管理员后台' }));

    expect(await screen.findByText('上线前合规确认')).toBeInTheDocument();
    expect(screen.getByText(complianceStatus.ack_phrase_zh)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '运营总览' })).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('确认短语'), '错误短语');
    await userEvent.click(screen.getByRole('button', { name: '确认并进入后台' }));
    expect(screen.getByText('确认短语不一致，请完整输入上方文字')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('确认短语'));
    await userEvent.type(screen.getByLabelText('确认短语'), complianceStatus.ack_phrase_zh);
    await userEvent.click(screen.getByRole('button', { name: '确认并进入后台' }));

    expect(await screen.findByRole('heading', { name: '运营总览' })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/admin/compliance/accept',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phrase: complianceStatus.ack_phrase_zh, language: 'zh' })
      })
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
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: '登录管理员后台' }));

    await userEvent.click(await screen.findByRole('link', { name: '账户池' }));
    expect(screen.getByRole('heading', { name: '订阅账户池' })).toBeInTheDocument();
    expect(screen.getByText('anthropic')).toBeInTheDocument();
    expect(screen.getByText('Claude 高并发')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '分组调度' }));
    expect(screen.getByRole('heading', { name: '分组调度' })).toBeInTheDocument();
    expect(screen.getByText('倍率 1.2x')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '设置' }));
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
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: '登录管理员后台' }));

    await userEvent.click(await screen.findByRole('link', { name: '用户管理' }));
    expect(within(screen.getByRole('table')).getByText('ops@example.com')).toBeInTheDocument();
    expect(screen.getByText('余额 ¥128.50')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'API 密钥' }));
    expect(screen.getByText('sk-...prod')).toBeInTheDocument();
    expect(screen.getByText('300 RPM')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '日志' }));
    expect(screen.getByText('stream')).toBeInTheDocument();
    expect(screen.getByText('1,820')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '钱包' }));
    expect(screen.getByText('stripe')).toBeInTheDocument();
    expect(screen.getByText('¥200.00')).toBeInTheDocument();
  });

  it('runs core admin operations against sub2api write APIs', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('管理员邮箱'), 'admin@sub2api.local');
    await userEvent.type(screen.getByLabelText('管理员密码'), 'change-me');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: '登录管理员后台' }));

    await userEvent.click(await screen.findByRole('link', { name: '用户管理' }));
    await userEvent.click(screen.getByRole('button', { name: '调整 ops@example.com 余额' }));
    await userEvent.clear(screen.getByLabelText('调整金额'));
    await userEvent.type(screen.getByLabelText('调整金额'), '30');
    await userEvent.type(screen.getByLabelText('备注'), '人工补余额');
    await userEvent.click(screen.getByRole('button', { name: '确认调整' }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/admin/users/12/balance',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ balance: 30, operation: 'add', notes: '人工补余额' })
        })
      )
    );
    expect(await screen.findByText('余额 ¥158.50')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'API 密钥' }));
    await userEvent.click(screen.getByRole('button', { name: '绑定 生产 Key 分组' }));
    await userEvent.click(screen.getByLabelText('重置限速用量'));
    await userEvent.click(screen.getByRole('button', { name: '保存绑定' }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/admin/api-keys/51',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ group_id: 3, reset_rate_limit_usage: true })
        })
      )
    );
  });

  it('operates subscription accounts through sub2api account actions', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('管理员邮箱'), 'admin@sub2api.local');
    await userEvent.type(screen.getByLabelText('管理员密码'), 'change-me');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: '登录管理员后台' }));

    await userEvent.click(await screen.findByRole('link', { name: '账户池' }));
    await userEvent.click(screen.getByRole('button', { name: '暂停 Claude Team 01 调度' }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/admin/accounts/7/schedulable',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ schedulable: false })
        })
      )
    );
    expect(await screen.findByText('暂停')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '测试 Claude Team 01' }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/admin/accounts/7/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ mode: 'quick' })
        })
      )
    );
    expect(await screen.findByText('账户测试已发起')).toBeInTheDocument();
  });

  it('toggles model channel status through sub2api channel APIs', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('管理员邮箱'), 'admin@sub2api.local');
    await userEvent.type(screen.getByLabelText('管理员密码'), 'change-me');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: '登录管理员后台' }));

    await userEvent.click(await screen.findByRole('link', { name: '模型' }));
    await userEvent.click(screen.getByRole('button', { name: '停用 OpenAI Responses 渠道' }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/admin/channels/9',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'disabled' })
        })
      )
    );
    expect(await screen.findByText('渠道已停用')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('停用')).toBeInTheDocument();
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
