import { useMemo, useState } from 'react';
import { BarChart3, Clock, DollarSign, ShieldAlert } from 'lucide-react';
import { models, usageSeries } from '../data/mock';
import { EmptyState, MetricCard, SectionHeader } from '../components/ui';

export function UsagePage() {
  const [selectedModel, setSelectedModel] = useState('all');

  const filtered = useMemo(() => {
    if (selectedModel === 'all') {
      return usageSeries;
    }
    if (selectedModel === 'no-results') {
      return [];
    }
    return usageSeries.filter((point) => point.model === selectedModel);
  }, [selectedModel]);

  const totalCalls = filtered.reduce((sum, point) => sum + point.calls, 0);
  const totalCost = filtered.reduce((sum, point) => sum + point.cost, 0);
  const avgError = filtered.length ? filtered.reduce((sum, point) => sum + point.errorRate, 0) / filtered.length : 0;
  const avgLatency = filtered.length ? Math.round(filtered.reduce((sum, point) => sum + point.latencyMs, 0) / filtered.length) : 0;
  const maxCalls = Math.max(...filtered.map((point) => point.calls), 1);

  return (
    <section className="page-grid">
      <SectionHeader
        eyebrow="Analytics"
        title="用量统计"
        action={
          <div className="filter-inline">
          <label className="filter-control" htmlFor="usage-model-filter">
            按模型筛选
          </label>
          <select id="usage-model-filter" className="toolbar-select" value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)}>
            <option value="all">全部模型</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.id}
              </option>
            ))}
            <option value="no-results">无数据模型</option>
          </select>
          </div>
        }
      />

      <div className="three-grid">
        <MetricCard label="调用量" value={totalCalls.toLocaleString()} detail="筛选范围内请求数" icon={<BarChart3 size={18} />} />
        <MetricCard label="成本" value={`¥${totalCost.toFixed(2)}`} detail="按 mock 单价折算" icon={<DollarSign size={18} />} />
        <MetricCard label="错误与延迟" value={`${avgError.toFixed(2)}%`} detail={`${avgLatency}ms 平均延迟`} icon={<Clock size={18} />} />
      </div>

      <article className="card">
        <h3>调用趋势</h3>
        {filtered.length ? (
          <div className="usage-bars">
            {filtered.map((point) => (
              <div className="usage-row" key={`${point.date}-${point.model}`}>
                <span>{point.date}</span>
                <strong>{point.model}</strong>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.max(8, (point.calls / maxCalls) * 100)}%` }} />
                </div>
                <span>{point.calls.toLocaleString()} 次</span>
                <span>¥{point.cost.toFixed(2)}</span>
                <span>{point.errorRate}%</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="没有匹配的用量数据" description="调整模型筛选条件后再查看调用趋势。" />
        )}
      </article>

      <article className="card warning-note">
        <ShieldAlert size={18} />
        <span>该页面展示的是本地 mock 数据，用于验证筛选、指标和空状态交互。</span>
      </article>
    </section>
  );
}
