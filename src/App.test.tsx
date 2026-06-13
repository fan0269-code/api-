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
