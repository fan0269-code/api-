import { CodeBlock, SectionHeader } from '../components/ui';
import type { DocsExample, ToastMessage } from '../types';

const commonErrors = [
  { code: 'invalid_api_key', meaning: 'Key 不存在、已停用或请求头格式错误。', action: '检查 Authorization Bearer token。' },
  { code: 'insufficient_balance', meaning: '账户余额不足，无法继续转发。', action: '充值或降低调用频率。' },
  { code: 'rate_limited', meaning: '当前 Key 或模型达到限流阈值。', action: '稍后重试或升级套餐。' },
  { code: 'upstream_timeout', meaning: '上游模型响应超时。', action: '重试请求或切换模型。' }
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
