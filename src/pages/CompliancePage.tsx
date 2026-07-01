import { FormEvent, useState } from 'react';
import type { AdminComplianceStatus } from '../types';

export function CompliancePage({
  status,
  onAccept,
  onLogout
}: {
  status: AdminComplianceStatus;
  onAccept: (phrase: string, language: string) => Promise<void>;
  onLogout: () => void;
}) {
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expectedPhrase = status.ack_phrase_zh;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (phrase.trim() !== expectedPhrase) {
      setError('确认短语不一致，请完整输入上方文字');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const language = expectedPhrase === status.ack_phrase_zh ? 'zh' : 'en';
      await onAccept(phrase.trim(), language);
    } catch (err) {
      setError(err instanceof Error ? err.message : '确认失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page compliance-page">
      <div className="animated-grid-pattern" aria-hidden="true" />
      <header className="login-brand" aria-label="智链 AI">
        <span className="brand-star">S</span>
        <strong>智链 AI</strong>
      </header>
      <section className="login-copy">
        <h1>
          上线前合规确认
          <span>{`{ Sub2API 部署与运营承诺 }`}</span>
        </h1>
        <p>真实后端要求管理员在进入控制台前确认当前部署版本的合规承诺。请先阅读官方文档，再手动输入确认短语。</p>
      </section>
      <form className="login-panel compliance-panel magic-panel" onSubmit={submit}>
        <h2>管理员合规确认</h2>
        <p className="muted">文档版本：{status.version}</p>
        <a className="compliance-link" href={status.document_url_zh} target="_blank" rel="noreferrer">
          打开官方中文文档
        </a>
        <div className="compliance-phrase">
          <span>请完整输入：</span>
          <strong>{expectedPhrase}</strong>
        </div>
        <div className="form-field">
          <label htmlFor="compliance-phrase">确认短语</label>
          <input id="compliance-phrase" value={phrase} onChange={(event) => setPhrase(event.target.value)} />
        </div>
        {error ? <span className="field-error">{error}</span> : null}
        <button className="button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '确认中...' : '确认并进入后台'}
        </button>
        <button className="button-secondary login-demo" type="button" onClick={onLogout}>
          退出登录
        </button>
      </form>
      <footer className="login-legal">确认动作将记录到当前 sub2api 后端，请确保你已理解文档内容。</footer>
    </main>
  );
}
