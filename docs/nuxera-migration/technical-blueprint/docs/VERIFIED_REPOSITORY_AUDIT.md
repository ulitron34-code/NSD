# N&U Technical Repository Audit — Verified Baseline

Repository: `ulitron34-code/NSD`
Default branch: `main`

## Verified application entry

- `src/App.jsx`
  - Uses `BrowserRouter`, `Routes`, `Route`, `Navigate`.
  - Wraps the application with `AuthProvider` and `NotificationProvider`.
  - Public landing lives at `/`.
  - Protected dashboard lives at `/dashboard/*`.
  - `Header` is rendered outside `DashboardPage`, so the new application shell must avoid duplicating the global header.

## Verified dashboard architecture

- `src/pages/DashboardPage.jsx`
  - Current file is a monolithic role switcher and tab renderer.
  - Uses `userMode` with values:
    - `solicitante`
    - `otorgante`
    - `nsd_admin`
  - Uses `uiView` from `localStorage` key `nsd_ui_view`.
  - Existing values:
    - `classic`
    - `new`
  - Uses `nsd_demo_profile` to switch demo role.
  - Uses `nsd_sidebar_collapsed` for sidebar state.
  - Contains role navigation arrays inside `getTabs()`.
  - Imports more than forty lazy dashboard modules.
  - Contains dashboard home layouts and tab routing in the same file.

## Verified authentication

- `src/context/AuthContext.jsx`
  - Stores `auth_token` and serialized `user` in localStorage.
- `src/hooks/useAuth.js`
  - Thin context hook.
- `src/components/Layout/ProtectedRoute.jsx`
  - Supports `VITE_DEMO_MODE`.
  - Creates a demo user with role `compliance_officer`.

## Verified global header and brand

- `src/components/Layout/Header.jsx`
  - Reads `BRAND` from `src/config/brand.js`.
  - Hard-codes `/logo-nexus.png`.
- `src/config/brand.js`
  - Still identifies the product as NEXUS / Compliance SaaS.
  - Must be migrated through a dedicated brand task, not scattered replacements.

## Verified frontend stack

- React 18
- Vite
- React Router
- Axios
- i18next
- Recharts
- Vitest
- Playwright
- Sentry
- Stripe

## Primary structural diagnosis

The saturation is not caused only by visual styling. It is architectural:
1. Role resolution, navigation, view switching, dashboard composition, data loading and tab rendering are concentrated in one file.
2. Navigation is expressed as technical modules rather than user goals.
3. The legacy/new switch already exists but is implemented with localStorage and dashboard-local state instead of a formal experience provider.
4. Brand identity is spread between config and hard-coded assets.
5. The admin navigation mixes investor materials, operational administration, compliance, AI and system functions.

## Migration decision

Do not delete `DashboardPage.jsx` first. Convert it into a compatibility host. The N&U experience is mounted behind a third view value, `nu`, while `classic` and `new` remain available until retirement.
