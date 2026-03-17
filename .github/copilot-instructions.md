# GitHub Copilot Instructions — Mobitech SIM Dashboard

## Project Overview

A full-stack SIM card data usage management dashboard. Frontend is a React PWA; backend is an Express REST API backed by MySQL. The app is deployed with PM2 and served behind a reverse proxy (Nginx/Cloudflare).

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript 5** (Create React App, strict mode)
- **React Router v6** — with loaders/actions for protected routes
- **Material-UI (MUI) v5** — primary component and theming library
- **Emotion** (`@emotion/react`, `@emotion/styled`) — CSS-in-JS for custom styled components
- **AG Grid Community** — data grid for SIM cards/reports
- **MUI X Charts** — charts and visualisations
- **Axios** — HTTP client with JWT interceptor
- **PWA** — service worker, `manifest.json`, offline fallback

### Backend
- **Node.js + Express.js** — REST API
- **MySQL** via `mysql2` promise pool (10 connections, CAT timezone +02:00)
- **JWT** (`jsonwebtoken`) — Bearer token auth
- **bcryptjs** — password hashing
- **Nodemailer + node-cron** — email notifications and scheduling
- **Swagger** (`swagger-jsdoc` + `swagger-ui-express`) — API docs at `/api-docs`
- **Security:** Helmet, CORS, `express-rate-limit`, compression

---

## Repository Structure

```
sim-dashboard/
├── src/                        # React TypeScript frontend
│   ├── components/
│   │   ├── layout/             # AppLayout, AuthLayout, AppHeader, NavMenu, PageLayout
│   │   ├── dashboard/          # Chart and stats widgets
│   │   ├── reports/            # FilterBuilder
│   │   └── widgets/            # Reusable small UI components
│   ├── pages/                  # Route-level page components
│   │   ├── home/               # Dashboard home
│   │   ├── login/ register/ verify-email/ forgot-password/ reset-password/
│   │   ├── simcards/           # AG Grid SIM list
│   │   ├── reports/
│   │   ├── settings/ profile/
│   │   ├── admin/users/        # Admin-only
│   │   └── error/
│   ├── services/               # API calls and auth logic
│   │   ├── api.ts              # Axios client + interceptors
│   │   ├── auth.ts             # authProvider singleton
│   │   ├── simcard.ts
│   │   ├── notifications.ts
│   │   ├── settings.ts
│   │   └── preferences.ts
│   ├── hooks/
│   │   └── useOnlineStatus.ts
│   ├── App.tsx                 # Router config + offline alerts
│   ├── index.tsx               # Entry point, SW registration
│   ├── theme.ts                # MUI theme (responsive typography, mobile tweaks)
│   ├── mobile-enhancements.css # Touch targets, scroll, iOS fixes
│   └── setupProxy.js           # Dev proxy: /api → localhost:5000
├── server/                     # Express backend (separate Node project)
│   ├── src/
│   │   ├── server.js           # App entry, /health, /ready endpoints
│   │   ├── config/
│   │   │   ├── database.js     # MySQL promise pool
│   │   │   └── swagger.js / swaggerDocs.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # authenticateToken, requireRole, requireActive
│   │   │   └── errorHandler.js
│   │   ├── controllers/        # authController, dashboardController, simController, …
│   │   ├── routes/             # auth, users, dashboard, sims, reports, preferences, settings, profile, notifications
│   │   └── utils/
│   │       ├── authHelpers.js  # JWT sign/verify, bcrypt helpers
│   │       ├── catDate.js      # CAT timezone helpers
│   │       ├── emailService.js
│   │       ├── emailScheduler.js
│   │       ├── logger.js
│   │       └── queryBuilder.js
│   ├── Schema.sql              # Database schema/migrations
│   ├── sample_data.sql
│   └── package.json            # Backend dependencies only
├── public/                     # Static assets, PWA manifest, service worker
├── build/                      # Production frontend build output (git-ignored)
├── logs/                       # PM2 log output
├── scripts/                    # Utility/maintenance scripts
├── ecosystem.config.js         # PM2 config
├── deploy.sh                   # Production deployment script
├── tsconfig.json
├── eslint.config.mjs
└── package.json                # Root (frontend) package
```

---

## Coding Conventions

### General
- **TypeScript strict mode** is enabled — always type function parameters, return values, and API response shapes.
- **PascalCase** for React components and their files. **camelCase** for functions, variables, and service methods.
- Only add comments when logic genuinely needs clarification — avoid obvious comments.
- Keep components focused. Extract reusable UI into `components/`, keep route-level logic in `pages/`.

### Frontend
- Use **MUI components** as the default for all UI elements (buttons, inputs, dialogs, tables).
- Use **Emotion** (`styled()` or `sx` prop) for custom styling — do not add plain CSS classes or Tailwind.
- Use **React Router v6 loaders** for authentication guards. `authProvider.checkAuth()` is called in loaders.
- Auth state lives in `localStorage` (token + user object). Access it through `authProvider` in `services/auth.ts`, not directly.
- The **Axios client** in `services/api.ts` automatically attaches `Authorization: Bearer <token>`. Always use this client — never create a new `axios.create()` elsewhere.
- 401 responses are handled globally in the interceptor (clears token and redirects to `/auth/login`).
- State management is **hooks only** (useState, useContext). Do not introduce Redux, Zustand, or any external state library.
- Data fetching is done with **direct Axios calls in service files** — do not introduce React Query, SWR, or similar.
- **AG Grid** is used for all large data tables (SIM cards, reports). Use the `AgGrid.tsx` wrapper component.
- **MUI X Charts** for all charts and graphs.
- All pages must remain responsive. Use MUI `sx` prop with breakpoints (`xs`, `sm`, `md`) instead of raw media query strings.
- The minimum touch target size is 44px (enforced in `mobile-enhancements.css`).

### Backend
- All routes are prefixed with `/api/`.
- Always protect routes with `authenticateToken` middleware. Add `requireRole('admin')` for admin-only routes.
- Add `requireActive` where user status matters.
- Use the MySQL promise pool from `config/database.js` — never create a new connection.
- Use `utils/authHelpers.js` for JWT operations and password hashing.
- Use `utils/catDate.js` for all timestamp operations — the database uses CAT (+02:00).
- Use `utils/queryBuilder.js` for dynamic SQL query construction.
- All email operations go through `utils/emailService.js`.
- Error responses must follow: `{ success: false, message: string }`.
- Success responses must follow: `{ success: true, data: any, message?: string }`.
- Use `USE_TEST_DATA=true` env var to switch to `*_test` tables during development/testing.
- Add Swagger JSDoc annotations to all new routes.

---

## Environment Variables

### Frontend (`src/` — prefix all with `REACT_APP_`)
| Variable | Purpose |
|---|---|
| `REACT_APP_API_URL` | API base URL (`/api` dev, full URL prod) |
| `REACT_APP_VERSION` | App version string |
| `REACT_APP_ENV` | `development` or `production` |

### Backend (`server/.env`)
| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default `5000`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET`, `JWT_EXPIRE` | JWT signing |
| `CORS_ORIGIN`, `FRONTEND_URL` | Allowed origins |
| `TRUST_PROXY` | Set `true` behind Nginx/Cloudflare |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | SMTP |
| `USE_TEST_DATA` | `true` to use `*_test` DB tables |
| `LOG_FORMAT` | Morgan format: `combined` (prod) or `dev` |

Never commit secrets. Never hardcode credentials or JWT secrets in source code.

---

## Authentication & Authorisation

- Registration flow: register → email verification → admin approval → active.
- User statuses: `pending_verification`, `pending_approval`, `active`, `rejected`.
- Roles: `admin`, `user`.
- Login returns `{ token, user }`. Token is stored in `localStorage`.
- The `authProvider` singleton (`services/auth.ts`) exposes: `signin()`, `signout()`, `getCurrentUser()`, `checkAuth()`.
- Protected routes use React Router v6 loaders that call `authProvider.checkAuth()`.
- Admin-only pages/routes use both `authenticateToken` + `requireRole('admin')` on the backend.

---

## API Patterns

```
GET    /api/dashboard/stats?threshold=0.8
GET    /api/sims
GET    /api/reports/*
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/verify-email/:token
GET    /api/users            (admin only)
GET    /health               (public — health check)
GET    /ready                (public — readiness probe)
GET    /api-docs             (Swagger UI)
```

All protected endpoints require `Authorization: Bearer <token>` header.

---

## DevOps & Deployment

### Development
```bash
npm run dev          # Start frontend + backend concurrently
npm run client       # Frontend only (port 3000, proxied to :5000)
npm run server       # Backend only (nodemon, port 5000)
```

### Production Build
```bash
npm run build        # Builds frontend to build/ (2GB heap limit applied)
```

### PM2 Process Manager
- Config: `ecosystem.config.js`
- App name: `mobitech-sim-dashboard`
- Script: `server/src/server.js`
- Mode: `fork`, 1 instance
- Max memory: 500MB — auto-restarts beyond this
- Logs: `logs/out.log` and `logs/err.log`

```bash
npm run pm2:start    # Start with production env
npm run pm2:stop
npm run pm2:restart
npm run pm2:logs
```

### Deployment (`deploy.sh`)
The script handles end-to-end production deployment:
1. Source selection (local repo or GitHub clone)
2. Version bump in `package.json`
3. `.env` creation with `NODE_ENV=production`
4. MySQL migration via `server/Schema.sql`
5. `npm ci` for root and server dependencies
6. `npm run build` (frontend)
7. Service worker cache version bump
8. PM2 start/restart
9. Health check via `curl /health`

### Health & Readiness Endpoints
- `GET /health` — returns `{ status, version, db: { latency }, memory }` — polled by `deploy.sh`
- `GET /ready` — DB ping check — use as a readiness probe

### Database
- MySQL, database name: `Mobitech`
- Schema managed via `server/Schema.sql`
- Default timezone: `+02:00` (CAT — Central Africa Time)
- Test data via `server/sample_data.sql`
- Test mode: set `USE_TEST_DATA=true` to use `*_test` tables without touching production data

---

## Testing

Testing libraries are installed (`@testing-library/react`, `@testing-library/jest-dom`) but no test files exist yet. When adding tests:
- Place test files next to the component/module they test using `.test.tsx` / `.test.ts` naming.
- Run with `npm test`.
- Set `USE_TEST_DATA=true` on the backend when writing integration tests to avoid hitting production tables.

---

## PWA & Offline Support

- Service worker is registered in `index.tsx` with update detection.
- `public/manifest.json` defines PWA metadata.
- `useOnlineStatus` hook detects network state via `navigator.onLine` events.
- `App.tsx` shows online/offline snackbar alerts globally.
- `OfflineFallback.tsx` renders when the app is offline.
- Service worker cache version is bumped automatically by `deploy.sh`.

---

## Security Reminders

- All routes that mutate data must be protected with `authenticateToken`.
- Admin routes must additionally use `requireRole('admin')`.
- Never expose `JWT_SECRET` or database credentials in frontend code or git history.
- Input validation uses `express-validator` on the backend — add validators to all new POST/PUT routes.
- Rate limiting is applied globally — be mindful when adding endpoints called at high frequency.
- CORS is locked to `CORS_ORIGIN` in production; in development it allows all origins.


## Github information
- github repository : https://github.com/ndoroe/Mobitech-Dashboard.git
- Github username: ndoroe
