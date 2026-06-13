import { FormEvent, useState } from 'react';

export function LoginPage({ onLogin }: { onLogin: (identifier: string, password: string) => Promise<void> }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      identifier: identifier.trim() ? undefined : '请输入邮箱或手机号',
      password: password.trim() ? undefined : '请输入密码'
    };
    setErrors(nextErrors);

    if (nextErrors.identifier || nextErrors.password) {
      return;
    }

    if (identifier && password) {
      await onLogin(identifier.trim(), password);
    }
  };

  return (
    <main className="login-page">
      <div className="animated-grid-pattern" aria-hidden="true" />
      <section className="login-copy">
        <span className="eyebrow">Unified AI Gateway</span>
        <h1>RelayHub API 中转站</h1>
        <p>统一接入多模型路由，透明计费，稳定转发，让开发者用一套 OpenAI 兼容接口管理生产调用。</p>
        <div className="login-value-grid">
          <span>统一 API 接入</span>
          <span>多模型路由</span>
          <span>透明计费</span>
          <span>可靠交付</span>
        </div>
      </section>
      <form className="login-panel magic-panel" onSubmit={submit}>
        <div className="login-switch" role="group" aria-label="登录注册切换">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')} aria-label="切换到登录">
            登录
          </button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')} aria-label="切换到注册">
            注册
          </button>
        </div>
        <h2>{mode === 'login' ? '登录控制台' : '创建开发者账户'}</h2>
        <div className="form-field">
          <label htmlFor="identifier">邮箱或手机号</label>
          <input id="identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
          {errors.identifier ? <span className="field-error">{errors.identifier}</span> : null}
        </div>
        <div className="form-field">
          <label htmlFor="password">密码</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {errors.password ? <span className="field-error">{errors.password}</span> : null}
        </div>
        <button className="button-primary" type="submit">
          {mode === 'login' ? '登录' : '注册并进入'}
        </button>
      </form>
    </main>
  );
}
