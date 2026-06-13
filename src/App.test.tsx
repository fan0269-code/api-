import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import { CopyButton, StatusBadge } from './components/ui';
import { account, apiKeys, billingRecords, docsExamples, models, usageSeries } from './data/mock';

describe('mock data', () => {
  it('contains records for every console module', () => {
    expect(account.name).toBe('林开发者');
    expect(apiKeys.length).toBeGreaterThanOrEqual(2);
    expect(models.map((model) => model.status)).toContain('available');
    expect(usageSeries.length).toBeGreaterThanOrEqual(6);
    expect(billingRecords.length).toBeGreaterThanOrEqual(4);
    expect(docsExamples.map((example) => example.language)).toEqual(['curl', 'Node.js', 'Python']);
  });
});

describe('authentication shell', () => {
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
