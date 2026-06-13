import { FormEvent, useState } from 'react';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (identifier && password) {
      onLogin();
    }
  };

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={submit}>
        <h1>RelayHub API 中转站</h1>
        <label htmlFor="identifier">邮箱或手机号</label>
        <input id="identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
        <label htmlFor="password">密码</label>
        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <button className="button-primary" type="submit">
          登录
        </button>
      </form>
    </main>
  );
}
