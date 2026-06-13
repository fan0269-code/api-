export type ModelStatus = 'available' | 'congested' | 'maintenance';
export type ApiKeyStatus = 'active' | 'disabled';
export type ToastKind = 'success' | 'error' | 'info';

export interface Account {
  name: string;
  email: string;
  plan: string;
  balance: number;
  monthlySpend: number;
  lowBalanceThreshold: number;
}

export interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  secret?: string;
  status: ApiKeyStatus;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string;
}

export interface ModelInfo {
  id: string;
  provider: string;
  context: string;
  inputPrice: string;
  outputPrice: string;
  latency: string;
  status: ModelStatus;
}

export interface UsagePoint {
  date: string;
  model: string;
  calls: number;
  cost: number;
  errorRate: number;
  latencyMs: number;
}

export interface BillingRecord {
  id: string;
  date: string;
  type: 'recharge' | 'usage';
  description: string;
  amount: number;
  balanceAfter: number;
}

export interface DocsExample {
  language: 'curl' | 'Node.js' | 'Python';
  code: string;
}

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  text: string;
}
