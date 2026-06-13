import { useState } from 'react';
import { MetricCard, Modal, SectionHeader } from '../components/ui';
import type { Account, BillingRecord, ToastMessage } from '../types';

const quickAmounts = [100, 200, 500];

export function BillingPage({
  account,
  billingRecords,
  rechargeBalance,
  pushToast
}: {
  account: Account;
  billingRecords: BillingRecord[];
  rechargeBalance: (amount: number) => Promise<{ account: Account; record: BillingRecord }>;
  pushToast: (kind: ToastMessage['kind'], text: string) => void;
}) {
  const isLow = account.balance < account.lowBalanceThreshold;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('200');
  const [error, setError] = useState('');

  const submitRecharge = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 10 || value > 10000) {
      setError('充值金额需在 10 到 10000 之间');
      return;
    }

    await rechargeBalance(value);
    setError('');
    setIsModalOpen(false);
    pushToast('success', `已充值 ¥${value.toFixed(2)}`);
  };

  return (
    <section className="page-grid">
      <SectionHeader
        eyebrow="Billing"
        title="账单余额"
        action={
          <button className="button-primary" type="button" onClick={() => setIsModalOpen(true)}>
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
          <p>当前余额低于 ¥{account.lowBalanceThreshold.toFixed(2)}。可以通过充值入口增加演示余额并生成账单记录。</p>
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

      {isModalOpen ? (
        <Modal
          title="账户充值"
          onClose={() => setIsModalOpen(false)}
          footer={
            <>
              <button className="button-secondary" type="button" onClick={() => setIsModalOpen(false)}>
                取消
              </button>
              <button className="button-primary" type="button" onClick={submitRecharge}>
                确认充值
              </button>
            </>
          }
        >
          <div className="quick-amounts" aria-label="快捷充值金额">
            {quickAmounts.map((value) => (
              <button className="button-secondary" type="button" key={value} onClick={() => setAmount(String(value))}>
                ¥{value}
              </button>
            ))}
          </div>
          <div className="form-field">
            <label htmlFor="rechargeAmount">充值金额</label>
            <input
              id="rechargeAmount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="输入 10 到 10000"
            />
            {error ? <span className="field-error">{error}</span> : null}
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
