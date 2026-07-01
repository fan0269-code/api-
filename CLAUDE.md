# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Identity

**sub2api 管理后台** — a React + Vite + TypeScript admin console that manages a sub2api API relay backend. The backend (sub2api Docker image) handles account pools, model routing, rate limiting, billing, and upstream forwarding; this repo is the **frontend only**.

## Essential Commands

```bash
npm install                     # Install dependencies
npm run dev:web -- --host 127.0.0.1  # Dev server (proxies /api → localhost:8080)
npm run build                   # TypeScript check + Vite production build → dist/
npm test                        # Run tests once (vitest)
npm run test:watch              # Tests in watch mode
npm run verify                  # test + build (pre-commit/pre-deploy gate)
npm run package:delivery        # verify + tar.gz → release/
npm run deploy:tencent          # Build + rsync to CVM (needs DEPLOY_HOST/USER/PATH env vars)
npm run preview                 # Preview production build locally
```

### Running a single test

```bash
npx vitest run -t "test name pattern"
```

## Architecture Overview

### Entry & Routing

- `src/main.tsx` → `BrowserRouter` → `App.tsx`
- `App.tsx` is the **sole state owner**: `adminUser`, `consoleData`, `toasts`, `pendingCompliance` all live here
- Child pages receive data + action callbacks as props (no global store, no context)

### Route Map

| Path | Component | Auth Required |
|------|-----------|:---:|
| `/login` | `LoginPage` | No |
| `/compliance` | `CompliancePage` | Token only |
| `/overview` | `OverviewPage` | Full |
| `/users` | `UsersPage` | Full |
| `/keys` | `ApiKeysPage` | Full |
| `/accounts` | `AccountsPage` | Full |
| `/groups` | `GroupsPage` | Full |
| `/channels` | `ChannelsPage` | Full |
| `/usage` | `UsagePage` | Full |
| `/alerts` | `AlertsPage` | Full |
| `/orders` | `OrdersPage` | Full |
| `/settings` | `SettingsPage` | Full |

### API Client (`src/api/client.ts` — the most critical file)

- `adminApi` is a singleton object with methods for every sub2api endpoint
- Base URL defaults to `/api/v1` (proxied by Vite in dev, by Nginx in production)
- JWT stored in `localStorage` under key `sub2api_admin_token`; `401` auto-clears it
- Response unwrapping: tolerates `{data: ...}`, `{items: [...]}`, `{records: [...]}`, `{list: [...]}` shapes — sub2api response format varies across endpoints
- `AdminApiError` carries `status` and `payload`; status `423` triggers compliance flow in `App.tsx`
- `loadAdminConsoleData()` fires 10 parallel `GET` requests, then a second batch of `getDashboard` + `getApiKeys` (depends on groups for per-group API key fetching)

### State Flow

```
Login → POST /auth/login → store JWT → loadAdminConsoleData()
  ├─ 423 → navigate to /compliance → POST /compliance/accept → reload data
  └─ success → set consoleData → navigate /overview

Write operations (adjustBalance, updateApiKeyGroup, etc.):
  Call API → update consoleData in-place (immutable, via spread) → pushToast
```

### Demo Mode

`src/data/demoAdmin.ts` provides `demoAdminSession` + `demoConsoleData` fixtures. The "查看演示后台" button only renders in `import.meta.env.DEV`. Demo mode skips all API calls and loads local data directly.

### Component Tree

```
App
├─ Routes
│  ├─ LoginPage
│  ├─ CompliancePage
│  ├─ Shell (sidebar + topbar)
│  │  ├─ NavLink × 10
│  │  └─ children = AdminPages
│  │     ├─ OverviewPage (MetricCard grid)
│  │     ├─ UsersPage (AdminTable + Modal for balance adjustment)
│  │     ├─ ApiKeysPage (AdminTable + Modal for group binding)
│  │     ├─ AccountsPage (AdminTable with schedulable/test actions)
│  │     ├─ GroupsPage (AdminTable read-only)
│  │     ├─ ChannelsPage (AdminTable with enable/disable toggle)
│  │     ├─ UsagePage (AdminTable read-only)
│  │     ├─ AlertsPage (AdminTable read-only)
│  │     ├─ OrdersPage (AdminTable read-only)
│  │     └─ SettingsPage (MetricCard + card)
│  └─ ToastStack (fixed bottom-right)
```

### Shared UI Components (`src/components/ui.tsx`)

`MetricCard`, `StatusBadge`, `Modal`, `AdminTable` (used by every page), `CopyButton`, `EmptyState`, `CodeBlock`, `ToastStack`, `SectionHeader`.

### Types (`src/types.ts`)

All domain types live here: `AdminSession`, `AdminConsoleData` (top-level aggregate), `Paginated<T>`, `AdminDashboard`, `ManagedUser`, `AdminAPIKey`, `SubscriptionAccount`, `DispatchGroup`, `AdminChannel`, `UsageLog`, `RequestError`, `PaymentOrder`, `SystemSettings`, `AdminComplianceStatus`.

## Testing

- **Framework**: vitest + jsdom + @testing-library/react + @testing-library/user-event
- **Setup**: `src/test/setup.ts` (just imports jest-dom matchers)
- **Pattern**: Global `fetch` is stubbed with `vi.stubGlobal` in `beforeEach`; each test in `App.test.tsx` verifies both UI behavior AND the exact `fetch()` call arguments
- Tests cover: demo login, real login, compliance flow (423 → accept with phrase mismatch → accept success), navigation across all 10 pages, table data rendering, and 5 write operations (balance, key-group binding, account schedulable, account test, channel status toggle)

## Deployment

- `deploy/tencent-cloud/docker-compose.yml` — sub2api + PostgreSQL + Redis
- `deploy/tencent-cloud/nginx-api-relay-console.conf` — serves `dist/` static files, reverse-proxies `/api`, `/v1`, `/v1beta`, `/backend-api`, `/responses`, `/images`, `/chat`, `/embeddings` to sub2api:8080
- `deploy/tencent-cloud/deploy.sh` — builds locally, rsyncs `dist/` + Docker assets to a CVM
- `.env` must set `JWT_SECRET` and `TOTP_ENCRYPTION_KEY` (fixed values, not regenerated on restart)
- Vite dev server proxies all sub2api gateway paths to `http://127.0.0.1:8080`

## Important Conventions

- **Immutability**: All state updates in `App.tsx` use spread operators (`{...current, ...}`), never mutation
- **No external state library**: Everything is prop drilling from App
- **API response tolerance**: sub2api response shapes vary — the client tries `data`, `items`, `records`, `list` keys before falling back to empty arrays
- **401 handling**: Built into the `request()` function — automatically clears the stored token
- **Compliance gate**: If sub2api returns 423, the admin MUST manually type the acknowledgment phrase; the frontend never auto-accepts
- **CSS**: Single `src/styles.css` file (~1600 lines), no CSS modules or Tailwind. Dark theme with cyan/teal accent

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
