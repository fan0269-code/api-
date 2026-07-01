import { FormEvent, useState } from 'react';
import type { ReactNode } from 'react';

export function LoginPage({ onLogin, demoAction }: { onLogin: (email: string, password: string) => Promise<void>; demoAction?: ReactNode }) {
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
      <header className="login-brand" aria-label="智链 AI">
        <span className="brand-star">S</span>
        <strong>智链 AI</strong>
      </header>
      <section className="login-copy">
        <h1>
          智链 AI，统一调度
          <span>{`{ 订阅账户池 + 分组路由 + 调用审计 }`}</span>
        </h1>
        <p>面向运营管理员的 sub2api 控制台，集中管理订阅账户池、模型渠道、API 密钥、调用日志和订单余额。</p>
        <div className="login-value-grid">
          <span>稳定网关</span>
          <span>模型路由</span>
          <span>调用审计</span>
          <span>余额运营</span>
        </div>
      </section>
      <form className="login-panel magic-panel" onSubmit={submit}>
        <h2>管理员登录</h2>
        <div className="form-field">
          <label htmlFor="admin-email">管理员邮箱</label>
          <input id="admin-email" type="email" value={email} placeholder="请输入你的用户名或邮箱地址" onChange={(event) => setEmail(event.target.value)} />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </div>
        <div className="form-field">
          <label htmlFor="admin-password">管理员密码</label>
          <input id="admin-password" type="password" value={password} placeholder="请输入你的密码" onChange={(event) => setPassword(event.target.value)} />
          {errors.password ? <span className="field-error">{errors.password}</span> : null}
        </div>
        <label className="checkbox-field login-terms" htmlFor="login-terms">
          <input id="login-terms" type="checkbox" defaultChecked />
          我已阅读并同意《服务条款》和《隐私政策》
        </label>
        {errors.submit ? <span className="field-error">{errors.submit}</span> : null}
        <button className="button-primary" type="submit" disabled={isSubmitting} aria-label="登录管理员后台">
          {isSubmitting ? '登录中...' : '登录'}
        </button>
        {demoAction}
      </form>
      <footer className="login-legal">继续即表示您同意我们的 隐私政策 和 服务条款</footer>
    </main>
  );
}
