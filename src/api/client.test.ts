import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminApi, clearAdminSession, setAdminSession } from './client';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

beforeEach(() => {
  localStorage.clear();
  clearAdminSession();
});

describe('sub2api admin api client', () => {
  it('stores the sub2api access token and attaches it to admin requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input), 'http://localhost');
        if (url.pathname === '/api/v1/auth/login') {
          return jsonResponse({ data: { access_token: 'token-123', user: { id: 1, email: 'admin@sub2api.local', username: 'Admin', role: 'admin' } } });
        }
        if (url.pathname === '/api/v1/admin/dashboard/stats') {
          return jsonResponse({ data: { today_requests: 10, total_requests: 20, active_users: 3, normal_accounts: 2, total_accounts: 4 } });
        }
        if (url.pathname === '/api/v1/admin/dashboard/realtime') {
          return jsonResponse({ data: { error_rate: 0.5 } });
        }
        return jsonResponse({ data: [] });
      })
    );

    await adminApi.login('admin@sub2api.local', 'secret');
    await adminApi.getDashboard();

    expect(fetch).toHaveBeenLastCalledWith(
      '/api/v1/admin/dashboard/realtime',
      expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer token-123' }) })
    );
    expect(localStorage.getItem('sub2api_admin_token')).toBe('token-123');
  });

  it('loads admin console data from real sub2api dashboard and group API key routes', async () => {
    setAdminSession('token-456');
    const routes: Record<string, unknown> = {
      '/api/v1/admin/dashboard/stats': { data: { today_requests: 128, total_requests: 160, active_users: 7, normal_accounts: 5, total_accounts: 6, total_actual_cost: 12.5 } },
      '/api/v1/admin/dashboard/realtime': { data: { error_rate: 1.25 } },
      '/api/v1/admin/users': { data: [{ id: 1, email: 'ops@example.com', username: 'Ops', role: 'user', balance: 5, status: 'active', created_at: '2026-06-14' }], pagination: { total: 1 } },
      '/api/v1/admin/accounts': { data: [], pagination: { total: 0 } },
      '/api/v1/admin/groups': { data: [{ id: 3, name: 'Claude 高并发', platform: 'anthropic', status: 'active', rate_multiplier: 1.2, rpm: 600, accounts_count: 8 }], pagination: { total: 1 } },
      '/api/v1/admin/groups/3/api-keys': { data: [{ id: 51, name: '生产 Key', key_preview: 'sk-...prod', group_name: 'Claude 高并发', status: 'active', rpm_limit: 300 }], pagination: { total: 1 } },
      '/api/v1/admin/channels': { data: [], pagination: { total: 0 } },
      '/api/v1/admin/usage': { data: [], pagination: { total: 0 } },
      '/api/v1/admin/ops/request-errors': { data: [], pagination: { total: 0 } },
      '/api/v1/admin/payment/orders': { data: [], pagination: { total: 0 } },
      '/api/v1/admin/settings': { data: { version: 'v0.9.0', run_mode: 'standard', gateway_base_url: '/v1', backup_enabled: true } }
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input), 'http://localhost');
        return jsonResponse(routes[url.pathname] ?? { error: { message: `unhandled ${url.pathname}` } }, routes[url.pathname] ? 200 : 404);
      })
    );

    const data = await adminApi.loadAdminConsoleData();

    expect(data.dashboard.today_requests).toBe(128);
    expect(data.dashboard.success_rate).toBe(98.75);
    expect(data.apiKeys.items).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith('/api/v1/admin/dashboard/stats', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('/api/v1/admin/groups/3/api-keys', expect.any(Object));
  });

  it('clears the session when sub2api returns unauthorized', async () => {
    setAdminSession('expired-token');
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: { message: 'unauthorized' } }, 401)));

    await expect(adminApi.getUsers()).rejects.toThrow('unauthorized');
    expect(localStorage.getItem('sub2api_admin_token')).toBeNull();
  });
});
