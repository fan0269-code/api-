import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import { CopyButton, StatusBadge } from './components/ui';
import { account, apiKeys, billingRecords, channels, docsExamples, models, usageSeries } from './data/mock';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

beforeEach(() => {
  const apiState = {
    account: structuredClone(account),
    keys: structuredClone(apiKeys),
    billingRecords: structuredClone(billingRecords),
    channels: structuredClone(channels),
    docsExamples: structuredClone(docsExamples),
    models: structuredClone(models),
    usageSeries: structuredClone(usageSeries)
  };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), 'http://localhost');
      const method = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : {};

      if (method === 'POST' && url.pathname === '/api/auth/login') {
        return jsonResponse({ token: 'test-token', account: apiState.account });
      }

      if (method === 'GET' && url.pathname === '/api/account') {
        return jsonResponse(apiState.account);
      }

      if (method === 'GET' && url.pathname === '/api/keys') {
        return jsonResponse(apiState.keys);
      }

      if (method === 'POST' && url.pathname === '/api/keys') {
        const suffix = 'TEST1234';
        const key = {
          id: 'key_new_test',
          name: body.name,
          maskedKey: `rh_live_••••••••••••${suffix.slice(-4)}`,
          secret: `rh_live_sk_new_${suffix}`,
          status: 'active' as const,
          scopes: ['chat', 'embeddings'],
          createdAt: '2026-06-13',
          lastUsedAt: '刚刚'
        };
        apiState.keys = [key, ...apiState.keys];
        return jsonResponse(key, 201);
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/keys/')) {
        const id = url.pathname.split('/').pop();
        const key = apiState.keys.find((item) => item.id === id);
        if (!key) {
          return jsonResponse({ error: { code: 'not_found', message: 'API key not found' } }, 404);
        }
        key.status = body.status;
        return jsonResponse(key);
      }

      if (method === 'GET' && url.pathname === '/api/models') {
        return jsonResponse(apiState.models);
      }

      if (method === 'GET' && url.pathname === '/api/channels') {
        return jsonResponse(apiState.channels);
      }

      if (method === 'PATCH' && url.pathname.startsWith('/api/channels/')) {
        const id = url.pathname.split('/').pop();
        const channel = apiState.channels.find((item) => item.id === id);
        if (!channel) {
          return jsonResponse({ error: { code: 'not_found', message: 'Channel not found' } }, 404);
        }
        channel.status = body.status;
        channel.lastCheckedAt = '2026-06-13 10:30';
        return jsonResponse(channel);
      }

      if (method === 'GET' && url.pathname === '/api/usage') {
        const model = url.searchParams.get('model');
        return jsonResponse(model && model !== 'all' ? apiState.usageSeries.filter((point) => point.model === model) : apiState.usageSeries);
      }

      if (method === 'GET' && url.pathname === '/api/billing') {
        return jsonResponse(apiState.billingRecords);
      }

      if (method === 'GET' && url.pathname === '/api/docs/examples') {
        return jsonResponse(apiState.docsExamples);
      }

      return jsonResponse({ error: { code: 'not_found', message: 'not found' } }, 404);
    })
  );
});

describe('mock data', () => {
  it('contains records for every console module', () => {
    expect(account.name).toBe('林开发者');
    expect(apiKeys.length).toBeGreaterThanOrEqual(2);
    expect(models.map((model) => model.status)).toContain('available');
    expect(channels.some((channel) => channel.status === 'active')).toBe(true);
    expect(usageSeries.length).toBeGreaterThanOrEqual(6);
    expect(billingRecords.length).toBeGreaterThanOrEqual(4);
    expect(docsExamples.map((example) => example.language)).toEqual(['curl', 'Node.js', 'Python']);
  });
});

describe('authentication shell', () => {
  it('shows a public marketing homepage before login', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: '企业级 AI API 中转站' })).toBeInTheDocument();
    expect(screen.getByText('一站式多模型 API 网关')).toBeInTheDocument();
    expect(screen.getByText('选择您的接入方案')).toBeInTheDocument();
    expect(screen.getByText('受开发团队信赖')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '登录控制台' }));
    expect(await screen.findByRole('heading', { name: '登录控制台' })).toBeInTheDocument();
  });

  it('logs in and shows the authenticated sidebar', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));

    expect(await screen.findByText('RelayHub')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '总览' })).toBeInTheDocument();
    expect(screen.getByText('余额 ¥128.60')).toBeInTheDocument();
  });
});

describe('shared UI', () => {
  it('renders model status badges with readable text', () => {
    render(<StatusBadge status="congested" />);
    expect(screen.getByText('拥堵')).toBeInTheDocument();
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

describe('login and overview', () => {
  it('adds restrained Magic UI-inspired surfaces to the login experience', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    expect(container.querySelector('.animated-grid-pattern')).toBeInTheDocument();
    expect(container.querySelector('.magic-panel')).toBeInTheDocument();
  });

  it('shows validation when login fields are empty', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    expect(screen.getByText('请输入邮箱或手机号')).toBeInTheDocument();
    expect(screen.getByText('请输入密码')).toBeInTheDocument();
  });

  it('shows balanced overview modules after login', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));

    expect(await screen.findByText('快速接入')).toBeInTheDocument();
    expect(screen.getByText('运行状态')).toBeInTheDocument();
    expect(screen.getByText('账户余额')).toBeInTheDocument();
    expect(screen.getByText('https://api.relayhub.dev/v1')).toBeInTheDocument();
    expect(container.querySelectorAll('.magic-surface')).toHaveLength(3);
  });
});

describe('keys and models', () => {
  it('creates a new API key from the keys page', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    await userEvent.click(await screen.findByRole('link', { name: 'API Keys' }));
    await userEvent.click(screen.getByRole('button', { name: '创建 API Key' }));
    await userEvent.type(screen.getByLabelText('Key 名称'), '本地开发');
    await userEvent.click(screen.getByRole('button', { name: '创建并显示密钥' }));

    expect(screen.getByText('本地开发')).toBeInTheDocument();
    expect(screen.getByText(/rh_live_sk_new_/)).toBeInTheDocument();
  });

  it('shows model statuses and endpoint base URL', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    await userEvent.click(await screen.findByRole('link', { name: '模型接口' }));

    expect(screen.getByText('OpenAI 兼容接口')).toBeInTheDocument();
    expect(screen.getByText('gpt-4.1-mini')).toBeInTheDocument();
    expect(screen.getByText('维护')).toBeInTheDocument();
  });

  it('shows channels and toggles upstream availability', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    await userEvent.click(await screen.findByRole('link', { name: '渠道管理' }));

    expect(screen.getByText('真实转发优先，Mock 兜底验收')).toBeInTheDocument();
    expect(screen.getByText('OpenAI 主通道')).toBeInTheDocument();
    expect(screen.getByText('sk-••••••••••••main')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: '停用' })[0]);
    expect(await screen.findByText('渠道已停用')).toBeInTheDocument();
    expect(screen.getByText('2026-06-13 10:30')).toBeInTheDocument();
  });
});

describe('usage billing and docs', () => {
  it('filters usage by model and shows an empty state', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    await userEvent.click(await screen.findByRole('link', { name: '用量统计' }));
    await userEvent.selectOptions(screen.getByLabelText('按模型筛选'), 'no-results');

    expect(screen.getByText('没有匹配的用量数据')).toBeInTheDocument();
  });

  it('shows low balance warning and docs examples', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    await userEvent.click(await screen.findByRole('link', { name: '账单余额' }));
    expect(screen.getByText('余额低于预警阈值')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '接入文档' }));
    expect(screen.getByText('curl')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('insufficient_balance')).toBeInTheDocument();
  });
});
