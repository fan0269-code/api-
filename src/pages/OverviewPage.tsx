import { Activity, CreditCard, KeyRound } from 'lucide-react';
import { CodeBlock, CopyButton, MetricCard, SectionHeader, StatusBadge } from '../components/ui';
import type { Account, ApiKey, BillingRecord, ModelInfo, ToastMessage, UsagePoint } from '../types';
import { relayBaseUrl } from '../api/client';

export function OverviewPage({
  account,
  activeKey,
  billingRecords,
  models,
  usageSeries,
  pushToast
}: {
  account: Account;
  activeKey: ApiKey;
  billingRecords: BillingRecord[];
  models: ModelInfo[];
  usageSeries: UsagePoint[];
  pushToast: (kind: ToastMessage['kind'], text: string) => void;
}) {
  const totalCalls = usageSeries.reduce((sum, point) => sum + point.calls, 0);
  const totalCost = usageSeries.reduce((sum, point) => sum + point.cost, 0);
  const avgLatency = Math.round(usageSeries.reduce((sum, point) => sum + point.latencyMs, 0) / usageSeries.length);
  const avgErrorRate = usageSeries.reduce((sum, point) => sum + point.errorRate, 0) / usageSeries.length;
  const recommendedModel = models.find((model) => model.status === 'available') ?? models[0];
  const sampleCode = `curl ${relayBaseUrl}/chat/completions \\
  -H "Authorization: Bearer ${activeKey.maskedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${recommendedModel.id}","messages":[{"role":"user","content":"Hello"}]}'`;

  const handleCopy = (ok: boolean) => {
    pushToast(ok ? 'success' : 'error', ok ? '已复制到剪贴板' : '复制失败，请手动复制');
  };

  return (
    <section className="page-grid">
      <SectionHeader
        eyebrow="Overview"
        title="控制台总览"
        action={
          <button className="button-primary" type="button">
            创建 API Key
          </button>
        }
      />

      <div className="three-grid">
        <MetricCard label="接入模型" value={recommendedModel.id} detail="推荐模型和 Base URL 已就绪" icon={<KeyRound size={18} />} />
        <MetricCard label="今日调用" value={`${totalCalls.toLocaleString()} 次`} detail={`成功率 ${(100 - avgErrorRate).toFixed(2)}% / ${avgLatency}ms`} icon={<Activity size={18} />} />
        <MetricCard label="可用余额" value={`¥${account.balance.toFixed(2)}`} detail={`本月消费 ¥${account.monthlySpend.toFixed(2)}`} icon={<CreditCard size={18} />} />
      </div>

      <div className="two-grid">
        <article className="card">
          <h3>快速接入</h3>
          <div className="info-row">
            <span>Base URL</span>
            <code>{relayBaseUrl}</code>
            <CopyButton value={relayBaseUrl} label="复制地址" onDone={handleCopy} />
          </div>
          <div className="info-row">
            <span>当前 Key</span>
            <code>{activeKey.maskedKey}</code>
            <StatusBadge status={activeKey.status} />
          </div>
          <div className="info-row">
            <span>推荐模型</span>
            <code>{recommendedModel.id}</code>
            <StatusBadge status={recommendedModel.status} />
          </div>
          <CodeBlock language="curl" code={sampleCode} onCopy={handleCopy} />
        </article>

        <article className="card">
          <h3>运行状态</h3>
          <div className="mini-chart" aria-label="最近七天调用量">
            {usageSeries.map((point) => (
              <div className="bar-row" key={`${point.date}-${point.model}`}>
                <span>{point.date}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.max(12, (point.calls / totalCalls) * 240)}%` }} />
                </div>
                <strong>{point.calls.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="two-grid">
        <article className="card">
          <h3>可用模型</h3>
          <div className="table-wrap compact-table">
            <table>
              <thead>
                <tr>
                  <th>模型</th>
                  <th>供应商</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id}>
                    <td>{model.id}</td>
                    <td>{model.provider}</td>
                    <td>
                      <StatusBadge status={model.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <h3>账户余额</h3>
          {account.balance < account.lowBalanceThreshold ? <p className="warning">余额低于预警阈值，建议及时充值。</p> : null}
          <div className="spend-list">
            {billingRecords.slice(0, 3).map((record) => (
              <div className="spend-row" key={record.id}>
                <span>{record.description}</span>
                <strong>{record.amount > 0 ? '+' : ''}¥{record.amount.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
