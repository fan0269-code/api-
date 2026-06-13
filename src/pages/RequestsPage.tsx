import { useMemo, useState } from 'react';
import { Activity, Clock, Coins } from 'lucide-react';
import { EmptyState, MetricCard, SectionHeader, StatusBadge } from '../components/ui';
import type { ModelInfo, RequestLog } from '../types';

export function RequestsPage({ models, requestLogs }: { models: ModelInfo[]; requestLogs: RequestLog[] }) {
  const [selectedModel, setSelectedModel] = useState('all');

  const filtered = useMemo(() => {
    if (selectedModel === 'all') {
      return requestLogs;
    }
    return requestLogs.filter((log) => log.model === selectedModel);
  }, [requestLogs, selectedModel]);

  const totalTokens = filtered.reduce((sum, log) => sum + log.tokens, 0);
  const totalCost = filtered.reduce((sum, log) => sum + log.cost, 0);
  const avgLatency = filtered.length ? Math.round(filtered.reduce((sum, log) => sum + log.latencyMs, 0) / filtered.length) : 0;

  return (
    <section className="page-grid">
      <SectionHeader
        eyebrow="Observability"
        title="调用日志"
        action={
          <div className="filter-inline">
            <label className="filter-control" htmlFor="request-model-filter">
              按模型筛选
            </label>
            <select
              id="request-model-filter"
              className="toolbar-select"
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
            >
              <option value="all">全部模型</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="three-grid">
        <MetricCard label="请求数" value={filtered.length.toLocaleString()} detail="最近 100 条日志" icon={<Activity size={18} />} />
        <MetricCard label="Token" value={totalTokens.toLocaleString()} detail="筛选范围内估算 token" icon={<Coins size={18} />} />
        <MetricCard label="平均延迟" value={`${avgLatency}ms`} detail={`成本 ¥${totalCost.toFixed(4)}`} icon={<Clock size={18} />} />
      </div>

      <div className="table-wrap">
        {filtered.length ? (
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>Key</th>
                <th>模型</th>
                <th>状态</th>
                <th>模式</th>
                <th>Token</th>
                <th>成本</th>
                <th>延迟</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td>{log.timestamp}</td>
                  <td>
                    <strong>{log.keyName}</strong>
                    <br />
                    <code>{log.maskedKey}</code>
                  </td>
                  <td>{log.model}</td>
                  <td>
                    <StatusBadge status={log.status === 'success' ? 'active' : 'disabled'} />
                  </td>
                  <td>{log.stream ? '流式' : '非流式'}</td>
                  <td>{log.tokens.toLocaleString()}</td>
                  <td>¥{log.cost.toFixed(4)}</td>
                  <td>{log.latencyMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="没有匹配的调用日志" description="调整模型筛选条件后再查看最近请求。" />
        )}
      </div>
    </section>
  );
}
