import type {
  AdminAPIKey,
  AdminChannel,
  AdminConsoleData,
  AdminDashboard,
  AdminSession,
  DispatchGroup,
  ManagedUser,
  Paginated,
  PaymentOrder,
  RequestError,
  SubscriptionAccount,
  SystemSettings,
  UsageLog
} from '../types';

const tokenStorageKey = 'sub2api_admin_token';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let adminToken = typeof localStorage === 'undefined' ? '' : localStorage.getItem(tokenStorageKey) || '';

function endpoint(path: string) {
  return `${apiBaseUrl}${path}`;
}

export function setAdminSession(token: string) {
  adminToken = token;
  localStorage.setItem(tokenStorageKey, token);
}

export function clearAdminSession() {
  adminToken = '';
  localStorage.removeItem(tokenStorageKey);
}

async function request<T>(path: string, options?: RequestInit & { auth?: boolean }): Promise<T> {
  const { auth = true, ...fetchOptions } = options ?? {};
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((fetchOptions.headers as Record<string, string> | undefined) ?? {})
  };

  if (auth && adminToken) {
    headers.authorization = `Bearer ${adminToken}`;
  }

  const response = await fetch(endpoint(path), {
    ...fetchOptions,
    headers
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminSession();
    }
    const message = payload?.error?.message ?? payload?.message ?? '请求失败';
    throw new Error(message);
  }

  return payload as T;
}

function list<T>(path: string) {
  return request<Paginated<T>>(path);
}

export const adminApi = {
  async login(email: string, password: string) {
    const session = await request<AdminSession>('/auth/login', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ email, identifier: email, password })
    });
    setAdminSession(session.access_token);
    return session;
  },

  getMe() {
    return request<{ user: AdminSession['user'] }>('/auth/me');
  },

  getDashboard() {
    return request<AdminDashboard>('/admin/dashboard');
  },

  getUsers() {
    return list<ManagedUser>('/admin/users');
  },

  getApiKeys() {
    return list<AdminAPIKey>('/admin/api-keys');
  },

  getAccounts() {
    return list<SubscriptionAccount>('/admin/accounts');
  },

  getGroups() {
    return list<DispatchGroup>('/admin/groups');
  },

  getChannels() {
    return list<AdminChannel>('/admin/channels');
  },

  getUsage() {
    return list<UsageLog>('/admin/usage');
  },

  getRequestErrors() {
    return list<RequestError>('/admin/ops/request-errors');
  },

  getPaymentOrders() {
    return list<PaymentOrder>('/admin/payment/orders');
  },

  getSettings() {
    return request<SystemSettings>('/admin/settings');
  },

  async loadAdminConsoleData(): Promise<AdminConsoleData> {
    const [dashboard, users, apiKeys, accounts, groups, channels, usage, requestErrors, paymentOrders, settings] = await Promise.all([
      this.getDashboard(),
      this.getUsers(),
      this.getApiKeys(),
      this.getAccounts(),
      this.getGroups(),
      this.getChannels(),
      this.getUsage(),
      this.getRequestErrors(),
      this.getPaymentOrders(),
      this.getSettings()
    ]);

    return { dashboard, users, apiKeys, accounts, groups, channels, usage, requestErrors, paymentOrders, settings };
  },

  logout() {
    clearAdminSession();
  }
};
