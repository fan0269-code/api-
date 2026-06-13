import { CodeBlock, SectionHeader } from '../components/ui';
import type { DocsExample, ToastMessage } from '../types';

const commonErrors = [
  { code: 'invalid_api_key', meaning: 'Key 不存在、已停用或请求头格式错误。', action: '检查 Authorization Bearer token。' },
  { code: 'quota_exceeded', meaning: '当前 Key 月配额已耗尽。', action: '充值、提升 Key 配额或更换 Key。' },
  { code: 'rate_limit_exceeded', meaning: '当前 Key 达到每分钟请求限制。', action: '稍后重试或提高 RPM 限制。' },
  { code: 'channel_unavailable', meaning: '目标模型没有启用的上游渠道。', action: '启用渠道或切换模型。' },
  { code: 'upstream_error', meaning: '上游模型返回异常。', action: '重试请求或切换渠道。' }
];

export function DocsPage({
  docsExamples,
  pushToast
}: {
  docsExamples: DocsExample[];
  pushToast: (kind: ToastMessage['kind'], text: string) => void;
}) {
  const handleCopy = (ok: boolean) => {
    pushToast(ok ? 'success' : 'error', ok ? '已复制到剪贴板' : '复制失败，请手动复制');
  };

  return (
    <section className="page-grid">
      <SectionHeader eyebrow="Docs" title="接入文档" />

      <article className="card">
        <h3>OpenAI 兼容调用</h3>
        <p className="muted">替换 Base URL 和 API Key 后，现有 SDK 或 HTTP 请求即可通过 RelayHub 转发。</p>
      </article>

      <div className="page-grid">
        {docsExamples.map((example) => (
          <CodeBlock key={example.language} language={example.language} code={example.code} onCopy={handleCopy} />
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>错误码</th>
              <th>含义</th>
              <th>建议处理</th>
            </tr>
          </thead>
          <tbody>
            {commonErrors.map((error) => (
              <tr key={error.code}>
                <td>
                  <code>{error.code}</code>
                </td>
                <td>{error.meaning}</td>
                <td>{error.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
