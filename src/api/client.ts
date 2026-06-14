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

type APIRecord = Record<string, unknown>;

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
  return request<unknown>(path).then((payload) => toPaginated<T>(payload));
}

function unwrapPayload(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

function toRecord(value: unknown): APIRecord {
  const payload = unwrapPayload(value);
  return payload && typeof payload === 'object' && !Array.isArray(payload) ? (payload as APIRecord) : {};
}

function toArray<T>(value: unknown): T[] {
  const payload = unwrapPayload(value);
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (payload && typeof payload === 'object') {
    const record = payload as APIRecord;
    if (Array.isArray(record.items)) {
      return record.items as T[];
    }
    if (Array.isArray(record.records)) {
      return record.records as T[];
    }
    if (Array.isArray(record.list)) {
      return record.list as T[];
    }
  }
  return [];
}

function toPaginated<T>(value: unknown): Paginated<T> {
  const payload = unwrapPayload(value);
  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? (payload as APIRecord) : {};
  const nestedPagination = value && typeof value === 'object' ? ((value as APIRecord).pagination as APIRecord | undefined) : undefined;
  const total = Number(source.total ?? source.count ?? nestedPagination?.total ?? toArray<T>(value).length);
  return {
    items: toArray<T>(value),
    total: Number.isFinite(total) ? total : 0
  };
}

function numberFrom(record: APIRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return fallback;
}

function stringFrom(record: APIRecord, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return fallback;
}

function mapApiKey(item: unknown, group?: DispatchGroup): AdminAPIKey {
  const record = item && typeof item === 'object' ? (item as APIRecord) : {};
  const keyPreview = stringFrom(record, ['key_preview', 'keyPreview', 'preview']);
  const rawKey = stringFrom(record, ['key', 'api_key']);
  return {
    id: numberFrom(record, ['id']),
    name: stringFrom(record, ['name'], '未命名 Key'),
    user_email: stringFrom(record, ['user_email', 'email', 'userEmail'], '-'),
    key_preview: keyPreview || (rawKey ? `${rawKey.slice(0, 7)}...${rawKey.slice(-4)}` : '-'),
    group_name: stringFrom(record, ['group_name', 'groupName'], group?.name ?? '-'),
    status: stringFrom(record, ['status'], 'active'),
    rpm_limit: numberFrom(record, ['rpm_limit', 'rpmLimit', 'rate_limit_rpm', 'rateLimitRpm'])
  };
}

function mapDashboard(statsPayload: unknown, realtimePayload: unknown, requestErrors?: Paginated<RequestError>): AdminDashboard {
  const stats = toRecord(statsPayload);
  const realtime = toRecord(realtimePayload);
  const totalRequests = numberFrom(stats, ['total_requests', 'totalRequests']);
  const errorRate = numberFrom(realtime, ['error_rate', 'errorRate']);
  const successRate = numberFrom(stats, ['success_rate', 'successRate'], totalRequests > 0 ? Math.max(0, 100 - errorRate) : 100);
  const healthyAccounts = numberFrom(stats, ['normal_accounts', 'healthy_accounts', 'healthyAccounts']);
  const accountAlerts =
    numberFrom(stats, ['error_accounts', 'errorAccounts']) +
    numberFrom(stats, ['ratelimit_accounts', 'rateLimitAccounts']) +
    numberFrom(stats, ['overload_accounts', 'overloadAccounts']);
  return {
    today_requests: numberFrom(stats, ['today_requests', 'todayRequests']),
    success_rate: Number(successRate.toFixed(2)),
    active_users: numberFrom(stats, ['active_users', 'activeUsers']),
    healthy_accounts: healthyAccounts,
    total_accounts: numberFrom(stats, ['total_accounts', 'totalAccounts'], healthyAccounts),
    open_alerts: numberFrom(stats, ['open_alerts', 'openAlerts'], accountAlerts),
    balance_total: numberFrom(stats, ['balance_total', 'balanceTotal', 'total_actual_cost', 'totalActualCost', 'total_cost', 'totalCost']),
    recent_errors: requestErrors?.items.slice(0, 5) ?? []
  };
}

export const adminApi = {
  async login(email: string, password: string) {
    const payload = await request<unknown>('/auth/login', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ email, identifier: email, password })
    });
    const session = unwrapPayload(payload) as AdminSession;
    setAdminSession(session.access_token);
    return session;
  },

  async getMe() {
    const payload = await request<unknown>('/auth/me');
    return unwrapPayload(payload) as { user: AdminSession['user'] };
  },

  async getDashboard(requestErrors?: Paginated<RequestError>) {
    const [stats, realtime] = await Promise.all([
      request<unknown>('/admin/dashboard/stats'),
      request<unknown>('/admin/dashboard/realtime')
    ]);
    return mapDashboard(stats, realtime, requestErrors);
  },

  getUsers() {
    return list<ManagedUser>('/admin/users');
  },

  async getApiKeys(groups: DispatchGroup[] = []) {
    if (groups.length === 0) {
      return { items: [], total: 0 };
    }

    const groupKeyLists = await Promise.all(
      groups.map(async (group) => {
        const payload = await request<unknown>(`/admin/groups/${group.id}/api-keys`);
        return toArray<unknown>(payload).map((item) => mapApiKey(item, group));
      })
    );

    const items = groupKeyLists.flat();
    return { items, total: items.length };
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

  async getSettings() {
    const payload = await request<unknown>('/admin/settings');
    return toRecord(payload) as unknown as SystemSettings;
  },

  async loadAdminConsoleData(): Promise<AdminConsoleData> {
    const [users, accounts, groups, channels, usage, requestErrors, paymentOrders, settings] = await Promise.all([
      this.getUsers(),
      this.getAccounts(),
      this.getGroups(),
      this.getChannels(),
      this.getUsage(),
      this.getRequestErrors(),
      this.getPaymentOrders(),
      this.getSettings()
    ]);
    const [dashboard, apiKeys] = await Promise.all([this.getDashboard(requestErrors), this.getApiKeys(groups.items)]);

    return { dashboard, users, apiKeys, accounts, groups, channels, usage, requestErrors, paymentOrders, settings };
  },

  logout() {
    clearAdminSession();
  }
};
