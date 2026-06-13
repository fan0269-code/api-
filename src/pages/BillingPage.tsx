import { account, billingRecords } from '../data/mock';
import { MetricCard, SectionHeader } from '../components/ui';

export function BillingPage() {
  const isLow = account.balance < account.lowBalanceThreshold;

  return (
    <section className="page-grid">
      <SectionHeader
        eyebrow="Billing"
        title="账单余额"
        action={
          <button className="button-secondary" type="button" title="原型占位，不连接支付">
            充值入口
          </button>
        }
      />

      <div className="three-grid">
        <MetricCard label="当前余额" value={`¥${account.balance.toFixed(2)}`} detail={account.plan} />
        <MetricCard label="本月消费" value={`¥${account.monthlySpend.toFixed(2)}`} detail="截至 2026-06-13" />
        <MetricCard label="预警阈值" value={`¥${account.lowBalanceThreshold.toFixed(2)}`} detail="低于阈值提醒充值" />
      </div>

      {isLow ? (
        <article className="card warning-card">
          <strong>余额低于预警阈值</strong>
          <p>当前余额低于 ¥{account.lowBalanceThreshold.toFixed(2)}。这只是原型提示，充值按钮不连接真实支付。</p>
        </article>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th>类型</th>
              <th>说明</th>
              <th>金额</th>
              <th>变动后余额</th>
            </tr>
          </thead>
          <tbody>
            {billingRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.date}</td>
                <td>{record.type === 'recharge' ? '充值' : '调用消费'}</td>
                <td>{record.description}</td>
                <td className={record.amount < 0 ? 'negative' : 'positive'}>
                  {record.amount > 0 ? '+' : ''}¥{record.amount.toFixed(2)}
                </td>
                <td>¥{record.balanceAfter.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
