export type AdminStatus = 'active' | 'disabled' | 'degraded' | 'maintenance' | 'paid' | 'success' | 'failed' | 'pending';
export type ToastKind = 'success' | 'error' | 'info';

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  role: string;
  balance?: number;
  status?: AdminStatus | string;
  created_at?: string;
}

export interface AdminSession {
  access_token: string;
  token_type?: string;
  user: AdminUser;
}

export interface AdminDashboard {
  today_requests: number;
  success_rate: number;
  active_users: number;
  healthy_accounts: number;
  total_accounts: number;
  open_alerts: number;
  balance_total: number;
  recent_errors: RequestError[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface ManagedUser {
  id: number;
  email: string;
  username: string;
  role: string;
  balance: number;
  status: string;
  created_at: string;
}

export interface AdminAPIKey {
  id: number;
  name: string;
  user_email: string;
  key_preview: string;
  group_name: string;
  status: string;
  rpm_limit: number;
}

export interface SubscriptionAccount {
  id: number;
  name: string;
  platform: string;
  account_type: string;
  status: string;
  group_names: string[];
  schedulable: boolean;
}

export interface DispatchGroup {
  id: number;
  name: string;
  platform: string;
  status: string;
  rate_multiplier: number;
  rpm: number;
  accounts_count: number;
}

export interface AdminChannel {
  id: number;
  name: string;
  platform: string;
  status: string;
  base_url: string;
  models_count: number;
}

export interface UsageLog {
  id: number;
  user_email: string;
  model: string;
  request_type: string;
  tokens: number;
  cost: number;
  status: string;
  created_at: string;
}

export interface RequestError {
  id: number;
  request_id: string;
  status_code: number;
  message: string;
  model: string;
  created_at: string;
}

export interface PaymentOrder {
  id: number;
  user_email: string;
  amount: number;
  status: string;
  provider: string;
  created_at: string;
}

export interface SystemSettings {
  version: string;
  run_mode: string;
  gateway_base_url: string;
  backup_enabled: boolean;
}

export interface AdminConsoleData {
  dashboard: AdminDashboard;
  users: Paginated<ManagedUser>;
  apiKeys: Paginated<AdminAPIKey>;
  accounts: Paginated<SubscriptionAccount>;
  groups: Paginated<DispatchGroup>;
  channels: Paginated<AdminChannel>;
  usage: Paginated<UsageLog>;
  requestErrors: Paginated<RequestError>;
  paymentOrders: Paginated<PaymentOrder>;
  settings: SystemSettings;
}

export interface AdminComplianceStatus {
  required: boolean;
  version: string;
  document_path_zh: string;
  document_path_en: string;
  document_url_zh: string;
  document_url_en: string;
  ack_phrase_zh: string;
  ack_phrase_en: string;
}

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  text: string;
}
