import { baseUrl, models } from '../data/mock';
import { CopyButton, SectionHeader, StatusBadge } from '../components/ui';
import type { ToastMessage } from '../types';

export function ModelsPage({ pushToast }: { pushToast: (kind: ToastMessage['kind'], text: string) => void }) {
  const handleCopy = (ok: boolean) => {
    pushToast(ok ? 'success' : 'error', ok ? '已复制到剪贴板' : '复制失败，请手动复制');
  };

  return (
    <section className="page-grid">
      <SectionHeader eyebrow="Endpoints" title="模型与接口" />

      <article className="card endpoint-card">
        <div>
          <span className="eyebrow">OpenAI 兼容接口</span>
          <h3>统一 Base URL</h3>
          <p className="muted">将现有 OpenAI SDK 的 baseURL 替换为下面地址，即可通过 RelayHub 访问多家模型。</p>
        </div>
        <div className="endpoint-copy">
          <code>{baseUrl}</code>
          <CopyButton value={baseUrl} label="复制 Base URL" onDone={handleCopy} />
        </div>
      </article>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>模型</th>
              <th>供应商</th>
              <th>上下文</th>
              <th>输入价格</th>
              <th>输出价格</th>
              <th>延迟</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model.id}>
                <td>{model.id}</td>
                <td>{model.provider}</td>
                <td>{model.context}</td>
                <td>{model.inputPrice}</td>
                <td>{model.outputPrice}</td>
                <td>{model.latency}</td>
                <td>
                  <StatusBadge status={model.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
