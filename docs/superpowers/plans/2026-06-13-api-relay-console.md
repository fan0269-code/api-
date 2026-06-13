# API Relay Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished Vite + React + TypeScript front-end prototype for a developer self-service API relay console with login, overview, API keys, models, usage, billing, and docs.

**Architecture:** The app is a client-only prototype with React Router routes, centralized mock data, local React state, and reusable UI components. No real authentication, database, payment, or proxy calls are made. The implementation should keep business data in `src/data/mock.ts`, shared domain types in `src/types.ts`, reusable controls in `src/components/`, and page composition in `src/pages/`.

**Tech Stack:** Vite, React, TypeScript, React Router, lucide-react, Vitest, Testing Library, CSS.

---

## File Map

- Create `package.json`: npm scripts, runtime dependencies, and test dependencies.
- Create `index.html`: Vite HTML entry.
- Create `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`: TypeScript and Vite/Vitest config.
- Create `src/main.tsx`: React root mount with `BrowserRouter`.
- Create `src/App.tsx`: route definitions, auth state, API key state, toast state, and authenticated shell wiring.
- Create `src/types.ts`: shared types for user, API keys, models, usage points, billing records, docs examples, and toasts.
- Create `src/data/mock.ts`: all account, key, model, usage, billing, and docs mock records.
- Create `src/components/Shell.tsx`: sidebar, top bar, responsive app shell, logout.
- Create `src/components/ui.tsx`: shared components: `MetricCard`, `StatusBadge`, `CopyButton`, `ToastStack`, `Modal`, `EmptyState`, `CodeBlock`, `SectionHeader`.
- Create `src/pages/LoginPage.tsx`: login/register screen and validation.
- Create `src/pages/OverviewPage.tsx`: balanced dashboard with integration, operations, and billing.
- Create `src/pages/ApiKeysPage.tsx`: table, create-key modal, copy, enable/disable.
- Create `src/pages/ModelsPage.tsx`: base URL and model table.
- Create `src/pages/UsagePage.tsx`: model filter, metric cards, simple charts, empty state.
- Create `src/pages/BillingPage.tsx`: balance, low-balance warning, recharge placeholder, transaction table.
- Create `src/pages/DocsPage.tsx`: curl, Node.js, Python examples and common errors.
- Create `src/styles.css`: theme tokens, layout, components, responsive behavior.
- Create `src/test/setup.ts`: Testing Library setup.
- Create `src/App.test.tsx`: behavior tests for login, navigation, key creation, filtering, and logout.

## Task 1: Scaffold the Vite React TypeScript Project

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create project config files**

Create `package.json` with these scripts and dependencies:

```json
{
  "name": "api-relay-console",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest",
    "react-router": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "vitest": "latest"
  }
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RelayHub API 中转站</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 2: Create React entry point**

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install
```

Expected: `node_modules/` and `package-lock.json` are created.

- [ ] **Step 4: Commit scaffold**

Run:

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src/main.tsx src/test/setup.ts
git commit -m "chore: scaffold relay console app"
```

Expected: commit succeeds.

## Task 2: Add Domain Types and Mock Data

**Files:**
- Create: `src/types.ts`
- Create: `src/data/mock.ts`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write data shape test**

Create `src/App.test.tsx` with:

```tsx
import { describe, expect, it } from 'vitest';
import { account, apiKeys, billingRecords, docsExamples, models, usageSeries } from './data/mock';

describe('mock data', () => {
  it('contains records for every console module', () => {
    expect(account.name).toBe('林开发者');
    expect(apiKeys.length).toBeGreaterThanOrEqual(2);
    expect(models.map((model) => model.status)).toContain('available');
    expect(usageSeries.length).toBeGreaterThanOrEqual(6);
    expect(billingRecords.length).toBeGreaterThanOrEqual(4);
    expect(docsExamples.map((example) => example.language)).toEqual(['curl', 'Node.js', 'Python']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because `src/data/mock.ts` does not exist.

- [ ] **Step 3: Add shared types**

Create `src/types.ts`:

```ts
export type ModelStatus = 'available' | 'congested' | 'maintenance';
export type ApiKeyStatus = 'active' | 'disabled';
export type ToastKind = 'success' | 'error' | 'info';

export interface Account {
  name: string;
  email: string;
  plan: string;
  balance: number;
  monthlySpend: number;
  lowBalanceThreshold: number;
}

export interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  secret?: string;
  status: ApiKeyStatus;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string;
}

export interface ModelInfo {
  id: string;
  provider: string;
  context: string;
  inputPrice: string;
  outputPrice: string;
  latency: string;
  status: ModelStatus;
}

export interface UsagePoint {
  date: string;
  model: string;
  calls: number;
  cost: number;
  errorRate: number;
  latencyMs: number;
}

export interface BillingRecord {
  id: string;
  date: string;
  type: 'recharge' | 'usage';
  description: string;
  amount: number;
  balanceAfter: number;
}

export interface DocsExample {
  language: 'curl' | 'Node.js' | 'Python';
  code: string;
}

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  text: string;
}
```

- [ ] **Step 4: Add mock data**

Create `src/data/mock.ts`:

```ts
import type { Account, ApiKey, BillingRecord, DocsExample, ModelInfo, UsagePoint } from '../types';

export const baseUrl = 'https://api.relayhub.dev/v1';

export const account: Account = {
  name: '林开发者',
  email: 'dev@example.com',
  plan: 'Pro Developer',
  balance: 128.6,
  monthlySpend: 86.42,
  lowBalanceThreshold: 150
};

export const apiKeys: ApiKey[] = [
  {
    id: 'key_prod',
    name: '生产环境',
    maskedKey: 'rh_live_••••••••••••8K2A',
    secret: 'rh_live_sk_8K2A_demo_secret',
    status: 'active',
    scopes: ['chat', 'embeddings'],
    createdAt: '2026-06-01',
    lastUsedAt: '2026-06-13 09:48'
  },
  {
    id: 'key_test',
    name: '测试环境',
    maskedKey: 'rh_test_••••••••••••Q91P',
    secret: 'rh_test_sk_Q91P_demo_secret',
    status: 'active',
    scopes: ['chat'],
    createdAt: '2026-05-21',
    lastUsedAt: '2026-06-12 18:22'
  },
  {
    id: 'key_legacy',
    name: '旧版脚本',
    maskedKey: 'rh_live_••••••••••••7M3D',
    secret: 'rh_live_sk_7M3D_demo_secret',
    status: 'disabled',
    scopes: ['legacy'],
    createdAt: '2026-04-09',
    lastUsedAt: '2026-05-30 11:03'
  }
];

export const models: ModelInfo[] = [
  { id: 'gpt-4.1-mini', provider: 'OpenAI', context: '128K', inputPrice: '$0.40 / 1M', outputPrice: '$1.60 / 1M', latency: '620ms', status: 'available' },
  { id: 'claude-3.7-sonnet', provider: 'Anthropic', context: '200K', inputPrice: '$3.00 / 1M', outputPrice: '$15.00 / 1M', latency: '880ms', status: 'congested' },
  { id: 'gemini-2.5-flash', provider: 'Google', context: '1M', inputPrice: '$0.30 / 1M', outputPrice: '$2.50 / 1M', latency: '540ms', status: 'available' },
  { id: 'deepseek-chat', provider: 'DeepSeek', context: '64K', inputPrice: '$0.14 / 1M', outputPrice: '$0.28 / 1M', latency: '710ms', status: 'maintenance' }
];

export const usageSeries: UsagePoint[] = [
  { date: '06-07', model: 'gpt-4.1-mini', calls: 4200, cost: 8.4, errorRate: 0.4, latencyMs: 610 },
  { date: '06-08', model: 'gpt-4.1-mini', calls: 5100, cost: 10.2, errorRate: 0.3, latencyMs: 590 },
  { date: '06-09', model: 'claude-3.7-sonnet', calls: 3200, cost: 21.6, errorRate: 0.8, latencyMs: 920 },
  { date: '06-10', model: 'gemini-2.5-flash', calls: 7600, cost: 12.9, errorRate: 0.2, latencyMs: 520 },
  { date: '06-11', model: 'deepseek-chat', calls: 2800, cost: 2.8, errorRate: 1.7, latencyMs: 760 },
  { date: '06-12', model: 'gpt-4.1-mini', calls: 6900, cost: 13.8, errorRate: 0.5, latencyMs: 630 },
  { date: '06-13', model: 'gemini-2.5-flash', calls: 12900, cost: 16.72, errorRate: 0.3, latencyMs: 540 }
];

export const billingRecords: BillingRecord[] = [
  { id: 'bill_104', date: '2026-06-13', type: 'usage', description: '今日模型调用消费', amount: -16.72, balanceAfter: 128.6 },
  { id: 'bill_103', date: '2026-06-12', type: 'usage', description: 'API 调用消费', amount: -13.8, balanceAfter: 145.32 },
  { id: 'bill_102', date: '2026-06-09', type: 'usage', description: 'Claude 路由调用', amount: -21.6, balanceAfter: 159.12 },
  { id: 'bill_101', date: '2026-06-01', type: 'recharge', description: '余额充值', amount: 200, balanceAfter: 180.72 }
];

export const docsExamples: DocsExample[] = [
  {
    language: 'curl',
    code: `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer rh_live_sk_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4.1-mini","messages":[{"role":"user","content":"Hello"}]}'`
  },
  {
    language: 'Node.js',
    code: `const response = await fetch('${baseUrl}/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer rh_live_sk_xxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: 'Hello' }]
  })
});`
  },
  {
    language: 'Python',
    code: `import requests

response = requests.post(
    '${baseUrl}/chat/completions',
    headers={'Authorization': 'Bearer rh_live_sk_xxx'},
    json={'model': 'gpt-4.1-mini', 'messages': [{'role': 'user', 'content': 'Hello'}]},
)`
  }
];
```

- [ ] **Step 5: Run data test**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS for `mock data`.

- [ ] **Step 6: Commit data layer**

Run:

```bash
git add src/types.ts src/data/mock.ts src/App.test.tsx
git commit -m "feat: add relay console mock data"
```

Expected: commit succeeds.

## Task 3: Implement App Routing, Auth State, and Shell

**Files:**
- Create: `src/App.tsx`
- Create: `src/components/Shell.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add shell behavior test**

Append to `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';

describe('authentication shell', () => {
  it('logs in and shows the authenticated sidebar', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));

    expect(await screen.findByText('RelayHub')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '总览' })).toBeInTheDocument();
    expect(screen.getByText('余额 ¥128.60')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because `src/App.tsx` and pages do not exist.

- [ ] **Step 3: Add the route shell**

Create `src/App.tsx`:

```tsx
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
import { account, apiKeys as initialKeys } from './data/mock';
import type { ApiKey, ToastMessage } from './types';
import { Shell } from './components/Shell';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { ModelsPage } from './pages/ModelsPage';
import { UsagePage } from './pages/UsagePage';
import { BillingPage } from './pages/BillingPage';
import { DocsPage } from './pages/DocsPage';
import { ToastStack } from './components/ui';

export default function App() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = (kind: ToastMessage['kind'], text: string) => {
    const toast = { id: `${Date.now()}-${Math.random()}`, kind, text };
    setToasts((current) => [...current, toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 2600);
  };

  const activeKey = useMemo(() => keys.find((key) => key.status === 'active') ?? keys[0], [keys]);

  const login = () => {
    setIsAuthed(true);
    navigate('/overview');
  };

  const logout = () => {
    setIsAuthed(false);
    navigate('/login');
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route
          path="/*"
          element={
            isAuthed ? (
              <Shell account={account} onLogout={logout}>
                <Routes>
                  <Route path="/overview" element={<OverviewPage activeKey={activeKey} pushToast={pushToast} />} />
                  <Route path="/keys" element={<ApiKeysPage keys={keys} setKeys={setKeys} pushToast={pushToast} />} />
                  <Route path="/models" element={<ModelsPage pushToast={pushToast} />} />
                  <Route path="/usage" element={<UsagePage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/docs" element={<DocsPage pushToast={pushToast} />} />
                  <Route path="*" element={<Navigate to="/overview" replace />} />
                </Routes>
              </Shell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      <ToastStack toasts={toasts} />
    </>
  );
}
```

Create `src/components/Shell.tsx`:

```tsx
import { BarChart3, BookOpen, CreditCard, KeyRound, LogOut, Network, PanelsTopLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import type { Account } from '../types';

const navItems = [
  { to: '/overview', label: '总览', icon: PanelsTopLeft },
  { to: '/keys', label: 'API Keys', icon: KeyRound },
  { to: '/models', label: '模型接口', icon: Network },
  { to: '/usage', label: '用量统计', icon: BarChart3 },
  { to: '/billing', label: '账单余额', icon: CreditCard },
  { to: '/docs', label: '接入文档', icon: BookOpen }
];

export function Shell({ account, children, onLogout }: { account: Account; children: ReactNode; onLogout: () => void }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <strong>RelayHub</strong>
            <span>API 中转站</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">Developer Console</span>
            <h1>API 中转控制台</h1>
          </div>
          <div className="account-pill">
            <span>{account.name}</span>
            <strong>余额 ¥{account.balance.toFixed(2)}</strong>
            <button className="icon-text-button" onClick={onLogout}>
              <LogOut size={16} />
              退出
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Add temporary page stubs**

Create page files with exported components so the shell compiles. Each stub is replaced in later tasks:

```tsx
export function OverviewPage() {
  return <section className="page-section">总览</section>;
}
```

Use the exact same pattern for `ApiKeysPage`, `ModelsPage`, `UsagePage`, `BillingPage`, and `DocsPage`, adjusting the function name and text. Create `LoginPage` with a minimal form that calls `onLogin` on submit.

- [ ] **Step 5: Run shell test**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS for `authentication shell`.

- [ ] **Step 6: Commit routing and shell**

Run:

```bash
git add src/App.tsx src/components/Shell.tsx src/pages src/App.test.tsx
git commit -m "feat: add authenticated console shell"
```

Expected: commit succeeds.

## Task 4: Build Shared UI Components and Global Styles

**Files:**
- Create: `src/components/ui.tsx`
- Create: `src/styles.css`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add UI component test**

Append:

```tsx
import { CopyButton, StatusBadge } from './components/ui';

describe('shared UI', () => {
  it('renders model status badges with readable text', () => {
    render(<StatusBadge status="congested" />);
    expect(screen.getByText('拥堵')).toBeInTheDocument();
  });

  it('copies text through the copy button callback path', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
    const onDone = vi.fn();
    render(<CopyButton value="copy-me" label="复制测试" onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: '复制测试' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy-me');
    expect(onDone).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because `src/components/ui.tsx` does not exist.

- [ ] **Step 3: Create UI components**

Create `src/components/ui.tsx` with exports for `MetricCard`, `StatusBadge`, `CopyButton`, `ToastStack`, `Modal`, `EmptyState`, `CodeBlock`, and `SectionHeader`. The `CopyButton` must call `navigator.clipboard.writeText(value)` and then `onDone(true)` or `onDone(false)`.

Use these exact status labels:

```ts
const statusLabels = {
  available: '可用',
  congested: '拥堵',
  maintenance: '维护',
  active: '启用',
  disabled: '停用'
};
```

- [ ] **Step 4: Add global CSS**

Create `src/styles.css` with:

```css
:root {
  color: #172033;
  background: #f5f7fb;
  font-family: Inter, "SF Pro Display", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  display: grid;
  grid-template-columns: 248px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: #0f172a;
  color: #e5eefc;
  padding: 24px 18px;
}

.brand,
.account-pill,
.nav-item,
.section-header,
.metric-card,
.toast,
.modal-actions {
  display: flex;
  align-items: center;
}

.brand {
  gap: 12px;
  margin-bottom: 28px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #38bdf8;
  color: #082f49;
  font-weight: 800;
}

.brand span,
.eyebrow,
.muted {
  color: #64748b;
}

.sidebar .brand span {
  display: block;
  color: #94a3b8;
  font-size: 12px;
}

.nav-list {
  display: grid;
  gap: 6px;
}

.nav-item {
  gap: 10px;
  color: #cbd5e1;
  text-decoration: none;
  padding: 10px 12px;
  border-radius: 8px;
}

.nav-item.active,
.nav-item:hover {
  background: #1e293b;
  color: #ffffff;
}

.main-area {
  min-width: 0;
  padding: 24px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 22px;
}

.topbar h1 {
  margin: 4px 0 0;
  font-size: 26px;
}

.account-pill {
  gap: 12px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.page-grid,
.three-grid,
.two-grid {
  display: grid;
  gap: 16px;
}

.three-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.two-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.card,
.metric-card,
.table-wrap,
.modal-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.card,
.table-wrap {
  padding: 18px;
}

.metric-card {
  justify-content: space-between;
  gap: 14px;
  padding: 16px;
}

.button-primary,
.button-secondary,
.icon-text-button {
  border: 0;
  border-radius: 8px;
  min-height: 38px;
  padding: 0 14px;
  cursor: pointer;
}

.button-primary {
  background: #2563eb;
  color: #ffffff;
}

.button-secondary,
.icon-text-button {
  background: #eef2f7;
  color: #172033;
}

.icon-text-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-badge {
  display: inline-flex;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  background: #e2e8f0;
}

.status-available,
.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-congested {
  background: #fef3c7;
  color: #92400e;
}

.status-maintenance,
.status-disabled {
  background: #fee2e2;
  color: #991b1b;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  padding: 12px 10px;
  vertical-align: top;
}

pre {
  margin: 0;
  overflow: auto;
  border-radius: 8px;
  background: #0f172a;
  color: #e5eefc;
  padding: 14px;
}

.form-field {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
}

.form-field input,
.toolbar-select {
  min-height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 12px;
}

.field-error,
.warning {
  color: #b91c1c;
}

@media (max-width: 860px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .nav-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .topbar,
  .account-pill {
    align-items: flex-start;
    flex-direction: column;
  }

  .three-grid,
  .two-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Run UI tests**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS for shared UI tests.

- [ ] **Step 6: Commit shared UI**

Run:

```bash
git add src/components/ui.tsx src/styles.css src/App.test.tsx
git commit -m "feat: add shared console UI components"
```

Expected: commit succeeds.

## Task 5: Implement Login and Overview Pages

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/OverviewPage.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add login validation and overview tests**

Append:

```tsx
describe('login and overview', () => {
  it('shows validation when login fields are empty', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    expect(screen.getByText('请输入邮箱或手机号')).toBeInTheDocument();
    expect(screen.getByText('请输入密码')).toBeInTheDocument();
  });

  it('shows balanced overview modules after login', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));

    expect(await screen.findByText('快速接入')).toBeInTheDocument();
    expect(screen.getByText('运行状态')).toBeInTheDocument();
    expect(screen.getByText('账户余额')).toBeInTheDocument();
    expect(screen.getByText('https://api.relayhub.dev/v1')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because the stub pages do not render these modules.

- [ ] **Step 3: Implement LoginPage**

Replace `src/pages/LoginPage.tsx` with a two-column professional login/register screen. The component accepts `{ onLogin: () => void }`, maintains `mode`, `identifier`, `password`, and `errors`, and validates empty fields before calling `onLogin`.

Required labels and button text:

```tsx
<label htmlFor="identifier">邮箱或手机号</label>
<label htmlFor="password">密码</label>
<button type="submit" className="button-primary">{mode === 'login' ? '登录' : '注册并进入'}</button>
```

- [ ] **Step 4: Implement OverviewPage**

Replace `src/pages/OverviewPage.tsx` with a balanced dashboard using `account`, `baseUrl`, `models`, `usageSeries`, and `billingRecords`. It must render headings `快速接入`, `运行状态`, `账户余额`, a copyable Base URL, the active key, a model selector display, a code snippet, usage metrics, and recent billing rows.

- [ ] **Step 5: Run login and overview tests**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS for `login and overview`.

- [ ] **Step 6: Commit login and overview**

Run:

```bash
git add src/pages/LoginPage.tsx src/pages/OverviewPage.tsx src/App.test.tsx
git commit -m "feat: add login and overview pages"
```

Expected: commit succeeds.

## Task 6: Implement API Keys and Models Pages

**Files:**
- Modify: `src/pages/ApiKeysPage.tsx`
- Modify: `src/pages/ModelsPage.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add API key and model tests**

Append:

```tsx
describe('keys and models', () => {
  it('creates a new API key from the keys page', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    await userEvent.click(await screen.findByRole('link', { name: 'API Keys' }));
    await userEvent.click(screen.getByRole('button', { name: '创建 API Key' }));
    await userEvent.type(screen.getByLabelText('Key 名称'), '本地开发');
    await userEvent.click(screen.getByRole('button', { name: '创建并显示密钥' }));

    expect(screen.getByText('本地开发')).toBeInTheDocument();
    expect(screen.getByText(/rh_live_sk_new_/)).toBeInTheDocument();
  });

  it('shows model statuses and endpoint base URL', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    await userEvent.click(await screen.findByRole('link', { name: '模型接口' }));

    expect(screen.getByText('OpenAI 兼容接口')).toBeInTheDocument();
    expect(screen.getByText('gpt-4.1-mini')).toBeInTheDocument();
    expect(screen.getByText('维护')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because API key creation and model table are not implemented.

- [ ] **Step 3: Implement ApiKeysPage**

Replace `src/pages/ApiKeysPage.tsx` with a table-driven page. Props:

```ts
{
  keys: ApiKey[];
  setKeys: React.Dispatch<React.SetStateAction<ApiKey[]>>;
  pushToast: (kind: ToastMessage['kind'], text: string) => void;
}
```

The page must include `创建 API Key`, a modal with `Key 名称`, validation text `请输入 Key 名称`, and a generated key whose visible secret starts with `rh_live_sk_new_`.

- [ ] **Step 4: Implement ModelsPage**

Replace `src/pages/ModelsPage.tsx` with a Base URL panel and model table from `models`. Use `StatusBadge` for status labels and `CopyButton` for Base URL.

- [ ] **Step 5: Run keys and models tests**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS for `keys and models`.

- [ ] **Step 6: Commit keys and models**

Run:

```bash
git add src/pages/ApiKeysPage.tsx src/pages/ModelsPage.tsx src/App.test.tsx
git commit -m "feat: add key management and model catalog"
```

Expected: commit succeeds.

## Task 7: Implement Usage, Billing, and Docs Pages

**Files:**
- Modify: `src/pages/UsagePage.tsx`
- Modify: `src/pages/BillingPage.tsx`
- Modify: `src/pages/DocsPage.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add usage, billing, and docs tests**

Append:

```tsx
describe('usage billing and docs', () => {
  it('filters usage by model and shows an empty state', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    await userEvent.click(await screen.findByRole('link', { name: '用量统计' }));
    await userEvent.selectOptions(screen.getByLabelText('按模型筛选'), 'no-results');

    expect(screen.getByText('没有匹配的用量数据')).toBeInTheDocument();
  });

  it('shows low balance warning and docs examples', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('邮箱或手机号'), 'dev@example.com');
    await userEvent.type(screen.getByLabelText('密码'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: '登录' }));
    await userEvent.click(await screen.findByRole('link', { name: '账单余额' }));
    expect(screen.getByText('余额低于预警阈值')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: '接入文档' }));
    expect(screen.getByText('curl')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('insufficient_balance')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because these pages are still stubs.

- [ ] **Step 3: Implement UsagePage**

Use `usageSeries` and `models` to render metric cards for total calls, total cost, average error rate, and average latency. Add a select labeled `按模型筛选` with options for all models plus `no-results` to exercise the empty state. Render simple bar rows with CSS widths derived from call volume.

- [ ] **Step 4: Implement BillingPage**

Use `account` and `billingRecords` to render balance, monthly spend, low-balance warning text `余额低于预警阈值`, disabled recharge placeholder, and billing table.

- [ ] **Step 5: Implement DocsPage**

Use `docsExamples` and `CodeBlock` to render curl, Node.js, and Python examples with copy buttons. Add a common errors table with `invalid_api_key`, `insufficient_balance`, `rate_limited`, and `upstream_timeout`.

- [ ] **Step 6: Run usage, billing, and docs tests**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS for `usage billing and docs`.

- [ ] **Step 7: Commit remaining pages**

Run:

```bash
git add src/pages/UsagePage.tsx src/pages/BillingPage.tsx src/pages/DocsPage.tsx src/App.test.tsx
git commit -m "feat: add usage billing and docs pages"
```

Expected: commit succeeds.

## Task 8: Final Build and Browser Verification

**Files:**
- Modify: `src/styles.css` if browser review finds responsive or visual defects.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and Vite build completes.

- [ ] **Step 2: Start local dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 3: Verify desktop behavior in browser**

Open the local URL in the in-app browser. Verify:

- Login shows validation when submitted empty.
- Valid login enters the console.
- Sidebar navigation reaches Overview, API Keys, Models, Usage, Billing, and Docs.
- API key creation shows the one-time secret.
- Copy actions show success toast where clipboard is available.
- Usage model filter changes the data and `no-results` shows `没有匹配的用量数据`.
- Billing shows `余额低于预警阈值`.
- Docs show curl, Node.js, Python, and common errors.
- Logout returns to login.

- [ ] **Step 4: Verify mobile layout in browser**

Use a mobile viewport around 390px wide. Verify:

- Sidebar navigation wraps cleanly.
- Top account area stacks without overlap.
- Tables remain readable through horizontal scrolling or compact stacking.
- Buttons keep labels inside their bounds.
- Code blocks scroll horizontally instead of overflowing the viewport.

- [ ] **Step 5: Commit final polish**

If style fixes were required, run:

```bash
git add src/styles.css
git commit -m "fix: polish responsive console layout"
```

If no style fixes were required, do not create an empty commit.

- [ ] **Step 6: Final status**

Run:

```bash
git status --short
```

Expected: no uncommitted app changes except intentionally ignored `.superpowers/` files.

## Self-Review

- Spec coverage: covered login/register, overview, API keys, models/endpoints, usage, billing, docs, centralized mock data, local state, copy actions, validation, low-balance warning, model status badges, empty usage state, responsive behavior, build, and browser verification.
- Placeholder scan: this plan contains no unresolved placeholder sections or deferred-work markers.
- Type consistency: the plan uses `Account`, `ApiKey`, `ModelInfo`, `UsagePoint`, `BillingRecord`, `DocsExample`, `ToastMessage`, `ModelStatus`, and `ApiKeyStatus` consistently from `src/types.ts`.
