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
          return jsonResponse({ access_token: 'token-123', user: { id: 1, email: 'admin@sub2api.local', username: 'Admin', role: 'admin' } });
        }
        return jsonResponse({ ok: true });
      })
    );

    await adminApi.login('admin@sub2api.local', 'secret');
    await adminApi.getDashboard();

    expect(fetch).toHaveBeenLastCalledWith(
      '/api/v1/admin/dashboard',
      expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer token-123' }) })
    );
    expect(localStorage.getItem('sub2api_admin_token')).toBe('token-123');
  });

  it('clears the session when sub2api returns unauthorized', async () => {
    setAdminSession('expired-token');
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: { message: 'unauthorized' } }, 401)));

    await expect(adminApi.getUsers()).rejects.toThrow('unauthorized');
    expect(localStorage.getItem('sub2api_admin_token')).toBeNull();
  });
});
