import { FormEvent, useState } from 'react';

export function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; submit?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      email: email.trim() ? undefined : '请输入管理员邮箱',
      password: password.trim() ? undefined : '请输入管理员密码'
    };
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : '登录失败' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="animated-grid-pattern" aria-hidden="true" />
      <section className="login-copy">
        <span className="eyebrow">sub2api Admin</span>
        <h1>智链 AI 管理后台</h1>
        <p>基于 sub2api 的订阅账户池、分组调度、调用日志和订单余额运营后台。</p>
        <div className="login-value-grid">
          <span>账户池管理</span>
          <span>分组调度</span>
          <span>调用审计</span>
          <span>Docker 交付</span>
        </div>
      </section>
      <form className="login-panel magic-panel" onSubmit={submit}>
        <span className="eyebrow">Admin Only</span>
        <h2>登录管理员后台</h2>
        <div className="form-field">
          <label htmlFor="admin-email">管理员邮箱</label>
          <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </div>
        <div className="form-field">
          <label htmlFor="admin-password">管理员密码</label>
          <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {errors.password ? <span className="field-error">{errors.password}</span> : null}
        </div>
        {errors.submit ? <span className="field-error">{errors.submit}</span> : null}
        <button className="button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '登录中...' : '登录管理员后台'}
        </button>
      </form>
    </main>
  );
}
