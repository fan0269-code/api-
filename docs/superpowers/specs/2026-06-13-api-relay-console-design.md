# API Relay Console Design

## Goal

Build a polished front-end prototype for an API relay station aimed at ordinary developers. The first version should feel like a real self-service console: users can log in, inspect integration details, manage API keys, review usage, understand billing, and read connection examples. The prototype uses local mock data only and does not proxy real API traffic.

## Decisions

- Product type: developer self-service console prototype.
- Audience: ordinary developers, not internal administrators.
- Scope: complete self-service loop with integration, usage, account balance, and billing.
- Layout direction: balanced control console rather than a pure onboarding page.
- Visual style: professional tool interface, calm and scannable, similar in spirit to modern developer dashboards.
- Login: include a login and registration entry before the console.
- Technology: Vite, React, TypeScript, and React Router.

## Pages

### Login and Registration

The entry page supports login and registration modes. It includes email or phone input, password input, primary submit action, and mode switching. It should also communicate the product value briefly: unified API access, multi-model routing, transparent billing, and reliable delivery.

Validation is prototype-level: empty fields show inline errors, and a valid submit stores local login state before navigating into the console.

### Console Overview

The overview is the default authenticated page. It gives balanced visibility to:

- Integration: Base URL, active API key, model selector, and quick-start code snippet.
- Operations: today's calls, success rate, latency, errors, and usage trend.
- Billing: balance, monthly spend, estimated remaining usage, and recent spend records.

The overview includes a primary "Create API Key" action because key creation is still a central developer task.

### API Keys

The API key page shows a table of mock keys with name, masked key, status, scope, created date, and last used date. Users can create a key, copy a key, and enable or disable a key locally. Creating a key opens a modal and shows the generated secret once.

### Models and Endpoints

The models page shows the OpenAI-compatible Base URL, supported endpoint notes, and a table of models. Each model has provider, context size, input price, output price, latency band, and status. Status values are available, congested, and maintenance.

### Usage

The usage page shows prototype analytics for calls, cost, error rate, and latency. It supports filtering by model. Charts can be implemented with accessible CSS/SVG or lightweight React components backed by mock data. Empty filter results show an empty state.

### Billing

The billing page shows balance, low-balance warnings, a recharge entry placeholder, monthly spend, unit price notes, and transaction records. Recharge is not connected to payment; it is a UI placeholder.

### Documentation

The docs page shows integration examples for curl, Node.js, and Python. Each code block has a copy action. The page also includes common errors such as invalid key, insufficient balance, rate limit, and upstream timeout.

## Application Architecture

The app should be a Vite React TypeScript project. Vite is a good fit because the app is a modern client-side prototype with fast dev-server feedback and a normal production build path. React Router should provide clear URLs for login, overview, API keys, models, usage, billing, and docs.

The recommended structure is:

- `src/App.tsx`: route definitions and top-level authenticated shell.
- `src/components/`: shared UI components such as metric cards, tables, badges, buttons, modal, toast, copy button, code block, and empty state.
- `src/pages/`: page-level components for login, overview, API keys, models, usage, billing, and docs.
- `src/data/mock.ts`: all mock account, key, model, usage, billing, and documentation data.
- `src/types.ts`: shared TypeScript domain types.
- `src/styles.css`: global layout, theme tokens, responsive rules, and component styling.

## Data Flow and State

Mock data flows from `src/data/mock.ts` into page components and then into shared UI components. The app should avoid hardcoding business records directly in JSX.

Client state includes:

- Authentication status and current user.
- Active route through React Router.
- API key creation modal state.
- Locally created API keys.
- Usage model filter.
- Toast messages for copy and local actions.
- Login and create-key form validation errors.

No global state library is needed. React state is enough for this prototype.

## Interactions

The prototype should support:

- Login and registration mode switching.
- Form validation on login and registration.
- Authenticated navigation through the sidebar.
- Logout from the top account area.
- API key creation with a one-time secret display.
- API key copy, Base URL copy, and code sample copy.
- API key enable and disable toggles.
- Usage filtering by model.
- Billing recharge placeholder click state or disabled explanation.
- Responsive navigation that remains usable on mobile.

## Error Handling

Error handling should be visible even though the app is local-only:

- Empty login fields show inline errors.
- Empty API key name blocks creation.
- Copy success shows a toast.
- Copy failure shows a failure toast when clipboard access is unavailable.
- Low balance shows a warning state.
- Model status badges distinguish available, congested, and maintenance states.
- Empty usage results show an empty state.

## Visual Direction

The interface should feel like a professional developer tool: restrained color, clear typography, compact information density, and predictable navigation. Avoid a marketing hero layout inside the product. Cards should be functional and not nested inside other cards. The first authenticated viewport should immediately show the product identity, the core metrics, and practical next actions.

Use a balanced layout:

- Left sidebar with product name and module navigation.
- Top bar with user/account summary and logout.
- Overview with three prominent summary areas: integration, usage, and billing.
- Dense but readable tables for keys, models, and billing records.

Mobile layouts should stack content cleanly, keep controls tappable, and avoid text overflow.

## Verification

Implementation is complete only when:

- The project installs and builds successfully with `npm run build`.
- The app runs locally with a Vite dev server.
- Manual browser verification covers login, navigation, API key creation, copy actions, usage filtering, billing warning, docs examples, and logout.
- Desktop and mobile viewport checks show no major overlap, clipping, or broken navigation.
- Source code keeps mock data centralized and avoids real API calls.

## Out of Scope

- Real authentication.
- Real API proxying or upstream model calls.
- Payment integration.
- Persistent database storage.
- Admin console for managing users, plans, channels, or key pools.
