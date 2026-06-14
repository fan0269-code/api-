import { AlertTriangle, Activity, CheckCircle2, Database, RadioTower, UsersRound, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';
import { MetricCard, SectionHeader, StatusBadge } from '../components/ui';
import type {
  AdminAPIKey,
  AdminChannel,
  AdminConsoleData,
  DispatchGroup,
  ManagedUser,
  PaymentOrder,
  RequestError,
  SubscriptionAccount,
  SystemSettings,
  UsageLog
} from '../types';

function money(value: number) {
  return `¥${value.toFixed(2)}`;
}

function StatusCell({ status }: { status: string }) {
  const normalized = ['active', 'disabled', 'degraded', 'maintenance'].includes(status) ? status : status === 'paid' || status === 'success' ? 'active' : 'degraded';
  return <StatusBadge status={normalized as 'active' | 'disabled' | 'degraded' | 'maintenance'} />;
}

export function OverviewPage({ data }: { data: AdminConsoleData }) {
  const health = `${data.dashboard.healthy_accounts}/${data.dashboard.total_accounts}`;
  return (
    <section className="page-grid">
      <SectionHeader eyebrow="sub2api Core" title="运营总览" />
      <div className="three-grid">
        <MetricCard label="今日请求" value={data.dashboard.today_requests.toLocaleString()} detail="来自 sub2api usage/ops" icon={<Activity size={18} />} />
        <MetricCard label="成功率" value={`${data.dashboard.success_rate}%`} detail="网关整体健康度" icon={<CheckCircle2 size={18} />} />
        <MetricCard label="活跃用户" value={data.dashboard.active_users.toLocaleString()} detail="管理员可运营用户" icon={<UsersRound size={18} />} />
        <MetricCard label="账户池健康" value={health} detail="可调度订阅账户" icon={<WalletCards size={18} />} />
        <MetricCard label="余额合计" value={money(data.dashboard.balance_total)} detail="用户账户余额汇总" icon={<Database size={18} />} />
        <MetricCard label="开放告警" value={data.dashboard.open_alerts.toLocaleString()} detail="请求与上游异常" icon={<AlertTriangle size={18} />} />
      </div>
      <div className="two-grid">
        <article className="card">
          <h3>账户池快照</h3>
          <p className="muted">sub2api 负责账户选择、并发控制、粘性会话、限流和网关转发。</p>
          <strong>{data.accounts.items[0]?.name ?? '暂无账户'}</strong>
          <p>{data.accounts.items[0]?.group_names.join(' / ')}</p>
        </article>
        <article className="card">
          <h3>最近异常</h3>
          {data.dashboard.recent_errors.map((error) => (
            <p key={error.id}>
              <strong>{error.status_code}</strong> {error.model} / {error.message}
            </p>
          ))}
        </article>
      </div>
    </section>
  );
}

export function UsersPage({ users }: { users: ManagedUser[] }) {
  return (
    <AdminTable
      title="用户管理"
      eyebrow="Admin Users"
      columns={['用户', '角色', '余额', '状态', '创建时间']}
      rows={users.map((user) => [
        <strong>{user.email}</strong>,
        user.role,
        `余额 ${money(user.balance)}`,
        <StatusCell status={user.status} />,
        user.created_at
      ])}
    />
  );
}

export function ApiKeysPage({ keys }: { keys: AdminAPIKey[] }) {
  return (
    <AdminTable
      title="API Key 管理"
      eyebrow="Key Distribution"
      columns={['名称', '用户', 'Key', '分组', '限制', '状态']}
      rows={keys.map((key) => [key.name, key.user_email, <code>{key.key_preview}</code>, key.group_name, `${key.rpm_limit} RPM`, <StatusCell status={key.status} />])}
    />
  );
}

export function AccountsPage({ accounts }: { accounts: SubscriptionAccount[] }) {
  return (
    <AdminTable
      title="订阅账户池"
      eyebrow="Subscription Accounts"
      columns={['账户', '平台', '类型', '分组', '调度', '状态']}
      rows={accounts.map((account) => [
        <strong>{account.name}</strong>,
        account.platform,
        account.account_type,
        account.group_names.join(' / '),
        account.schedulable ? '可调度' : '暂停',
        <StatusCell status={account.status} />
      ])}
    />
  );
}

export function GroupsPage({ groups }: { groups: DispatchGroup[] }) {
  return (
    <AdminTable
      title="分组调度"
      eyebrow="Routing Groups"
      columns={['分组', '平台', '倍率', 'RPM', '账户数', '状态']}
      rows={groups.map((group) => [
        <strong>{group.name}</strong>,
        group.platform,
        `倍率 ${group.rate_multiplier}x`,
        group.rpm.toLocaleString(),
        group.accounts_count.toLocaleString(),
        <StatusCell status={group.status} />
      ])}
    />
  );
}

export function ChannelsPage({ channels }: { channels: AdminChannel[] }) {
  return (
    <AdminTable
      title="模型渠道"
      eyebrow="Models & Channels"
      columns={['渠道', '平台', 'Base URL', '模型数', '状态']}
      rows={channels.map((channel) => [
        <strong>{channel.name}</strong>,
        channel.platform,
        <code>{channel.base_url}</code>,
        channel.models_count.toLocaleString(),
        <StatusCell status={channel.status} />
      ])}
    />
  );
}

export function UsagePage({ usage }: { usage: UsageLog[] }) {
  return (
    <AdminTable
      title="调用日志"
      eyebrow="Usage Logs"
      columns={['时间', '用户', '模型', '类型', 'Token', '成本', '状态']}
      rows={usage.map((log) => [
        log.created_at,
        log.user_email,
        log.model,
        log.request_type,
        log.tokens.toLocaleString(),
        money(log.cost),
        <StatusCell status={log.status} />
      ])}
    />
  );
}

export function AlertsPage({ errors }: { errors: RequestError[] }) {
  return (
    <AdminTable
      title="告警任务"
      eyebrow="Ops Alerts"
      columns={['时间', '请求 ID', '状态码', '模型', '错误']}
      rows={errors.map((error) => [error.created_at, error.request_id, error.status_code.toString(), error.model, error.message])}
    />
  );
}

export function OrdersPage({ orders }: { orders: PaymentOrder[] }) {
  return (
    <AdminTable
      title="订单余额"
      eyebrow="Payment Orders"
      columns={['订单', '用户', '金额', '支付渠道', '状态', '时间']}
      rows={orders.map((order) => [String(order.id), order.user_email, money(order.amount), order.provider, <StatusCell status={order.status} />, order.created_at])}
    />
  );
}

export function SettingsPage({ settings }: { settings: SystemSettings }) {
  return (
    <section className="page-grid">
      <SectionHeader eyebrow="System" title="系统设置" />
      <div className="three-grid">
        <MetricCard label="版本" value={settings.version} detail="sub2api 后端版本" icon={<RadioTower size={18} />} />
        <MetricCard label="运行模式" value={settings.run_mode} detail="standard/simple" icon={<Database size={18} />} />
        <MetricCard label="备份" value={settings.backup_enabled ? '已启用' : '未启用'} detail="本地目录持久化" icon={<CheckCircle2 size={18} />} />
      </div>
      <article className="card">
        <h3>网关入口</h3>
        <code>{settings.gateway_base_url}</code>
      </article>
    </section>
  );
}

function AdminTable({ eyebrow, title, columns, rows }: { eyebrow: string; title: string; columns: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <section className="page-grid">
      <SectionHeader eyebrow={eyebrow} title={title} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
