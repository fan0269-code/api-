import type { Account, ApiKey, BillingRecord, ChannelInfo, DocsExample, ModelInfo, UsagePoint } from '../types';

export const relayBaseUrl = 'https://api.relayhub.dev/v1';

export interface ConsoleData {
  account: Account;
  keys: ApiKey[];
  models: ModelInfo[];
  channels: ChannelInfo[];
  usageSeries: UsagePoint[];
  billingRecords: BillingRecord[];
  docsExamples: DocsExample[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options?.headers ?? {})
    }
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message ?? '请求失败';
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  login(identifier: string, password: string) {
    return request<{ token: string; account: Account }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
  },

  async loadConsoleData(account?: Account): Promise<ConsoleData> {
    const [loadedAccount, keys, models, channels, usageSeries, billingRecords, docsExamples] = await Promise.all([
      account ? Promise.resolve(account) : request<Account>('/api/account'),
      request<ApiKey[]>('/api/keys'),
      request<ModelInfo[]>('/api/models'),
      request<ChannelInfo[]>('/api/channels'),
      request<UsagePoint[]>('/api/usage'),
      request<BillingRecord[]>('/api/billing'),
      request<DocsExample[]>('/api/docs/examples')
    ]);

    return { account: loadedAccount, keys, models, channels, usageSeries, billingRecords, docsExamples };
  },

  createKey(name: string) {
    return request<ApiKey>('/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  },

  updateKeyStatus(id: string, status: ApiKey['status']) {
    return request<ApiKey>(`/api/keys/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  updateChannelStatus(id: string, status: ChannelInfo['status']) {
    return request<ChannelInfo>(`/api/channels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  rechargeBalance(amount: number) {
    return request<{ account: Account; record: BillingRecord }>('/api/billing/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }
};
