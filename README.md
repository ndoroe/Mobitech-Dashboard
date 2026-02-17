# Mobitech SIM Dashboard

Enterprise SIM card data-usage monitoring dashboard built with React + Material UI (frontend) and Node.js + Express + MySQL (backend).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript |
| Frontend | React 18, Material UI 5, MUI X-Charts, React Router, Formik + Yup |
| Backend | Node.js, Express, MySQL2 |
| Auth | JWT, bcryptjs |
| Email | Nodemailer (SMTP) |
| Icons | Tabler Icons |
| Linting | ESLint, Prettier |
| Process Mgr | PM2 |

## Project Structure

```
sim-dashboard/
├── server/                     # Backend API
│   ├── src/
│   │   ├── config/             # Database pool
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth & error handling
│   │   ├── routes/            # Express routers
│   │   ├── utils/             # Email, logger, helpers
│   │   └── server.js          # Entry point
│   ├── Schema.sql             # Full database schema
│   ├── sample_data.sql        # Optional test data generator
│   ├── .env                   # Server environment (git-ignored)
│   └── package.json
├── src/                       # Frontend (React)
│   ├── components/            # Reusable UI components
│   ├── pages/                 # Route pages
│   ├── services/              # Axios API clients
│   ├── hooks/                 # Custom React hooks
│   ├── App.tsx                # Root component & routes
│   └── theme.ts               # MUI theme
├── build/                     # Production build output
├── ecosystem.config.js        # PM2 configuration
├── .env.development           # Frontend dev env
├── .env.production            # Frontend prod env
└── package.json
```

## Features

### Dashboard
- Pool utilization gauge
- KPI cards (total SIMs, monthly usage, pool %, active alerts)
- Top 10 consumers table
- Monthly comparison chart
- Auto-refresh (5 min) + manual refresh

### SIM Card Management
- Paginated SIM list with search (ICCID / MSISDN)
- Color-coded usage percentage chips
- Per-SIM hourly / daily usage graphs
- Period selection (24 h, week, month)

### Reports & Alerts
- Custom report builder with date range, grouping (raw / daily / monthly), CSV export
- Configurable warning & critical thresholds
- Projected end-of-month usage alerts
- Daily email alert reports (opt-in)

### Authentication & User Management
- JWT-based login with role support (admin / user)
- Registration with email verification + admin approval flow
- First registered user auto-promoted to admin
- Password reset via email
- Profile management with avatar upload

### Notifications
- Admin: new-registration alerts (in-app + email)
- All users: SIM usage threshold alerts
- 30-second polling, combined badge count

---

## Prerequisites

- **Node.js** v18+
- **MySQL** 8.0+
- **npm** (or yarn)

## Database Setup

```bash
# Create the schema and all tables
mysql -u root -p < server/Schema.sql
```

This creates the `Mobitech` database with tables: `assets`, `Data`, `users`, `user_approval_requests`, `admin_notifications`, `user_preferences`, and optional test tables.

To load sample/test data:

```bash
mysql -u root -p Mobitech < server/sample_data.sql
```

## Backend Setup

```bash
cd server
npm install

# Create your environment file from the example
cp .env.example .env
# Edit .env with your database credentials, JWT secret, email config, etc.

# Development (with nodemon)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000` by default.

## Frontend Setup

```bash
# From the project root (sim-dashboard/)
npm install --legacy-peer-deps

# Create / edit environment files
cp .env.example .env
# Set REACT_APP_API_URL to point to your backend

# Development
npm start               # http://localhost:3000

# Production build
npm run build           # outputs to build/
```

## Production Deployment (PM2)

```bash
# Build the frontend first
npm run build

# Start with PM2
npm run pm2:start       # uses ecosystem.config.js

# Other PM2 commands
npm run pm2:stop
npm run pm2:restart
npm run pm2:logs
```

The Express server serves the React build in production mode, so only one process is needed.

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/verify-email/:token` | Verify email |
| POST | `/api/auth/resend-verification` | Resend verification email |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |

### Protected (requires auth + active status)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Current user info |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/top-consumers` | Top consumers |
| GET | `/api/sims` | List SIM cards (paginated) |
| GET | `/api/sims/:iccid/history` | SIM usage history |
| POST | `/api/reports/custom` | Generate custom report |
| GET | `/api/reports/alerts` | Active alerts |
| GET | `/api/preferences` | Get user preferences |
| PUT | `/api/preferences` | Update user preferences |
| GET | `/api/profile` | Get profile |
| POST | `/api/profile/change-password` | Change password |
| POST | `/api/profile/avatar` | Upload avatar |
| DELETE | `/api/profile/avatar` | Delete avatar |

### Admin Only

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/pending` | Pending approval users |
| POST | `/api/users/:id/approve` | Approve user |
| POST | `/api/users/:id/reject` | Reject user |
| PUT | `/api/users/:id/role` | Change user role |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/notifications` | Get notifications |
| GET | `/api/notifications/count` | Unread count |
| POST | `/api/notifications/:id/read` | Mark read |
| POST | `/api/notifications/read-all` | Mark all read |
| DELETE | `/api/notifications/:id` | Delete notification |

## Environment Variables

### Backend (`server/.env`)

See `server/.env.example` for all options:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | — |
| `DB_NAME` | Database name | `Mobitech` |
| `USE_TEST_DATA` | Use test tables | `false` |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRE` | JWT expiry | `7d` |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:3000` |
| `FRONTEND_URL` | URL for email links | `http://localhost:3000` |
| `TRUST_PROXY` | Behind reverse proxy | `false` |
| `LOG_FORMAT` | Morgan log format | `dev` |
| `EMAIL_HOST` | SMTP host | — |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_SECURE` | Use TLS | `false` |
| `EMAIL_USER` | SMTP user | — |
| `EMAIL_PASS` | SMTP password | — |
| `EMAIL_FROM` | Sender address | — |
| `EMAIL_FROM_NAME` | Sender display name | — |

### Frontend (`.env` / `.env.development` / `.env.production`)

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `REACT_APP_VERSION` | App version string | `0.1.0` |
| `REACT_APP_ENV` | Environment label | `development` |

## First-Time Setup

1. Run `server/Schema.sql` to create the database and tables.
2. Start the backend server.
3. Navigate to `/auth/register` and create your first account — it is **automatically promoted to admin**.
4. Subsequent users go through: register → email verification → admin approval.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Database connection failed | Verify MySQL is running; check `DB_*` vars in `server/.env` |
| CORS errors | Check `CORS_ORIGIN` matches your frontend URL |
| No data showing | Ensure backend is running; check `assets` / `Data` tables have rows |
| No verification email | Check `EMAIL_*` config; review server logs |
| "Invalid token" on verify | Token expired (24 h) — use resend verification |
| Can't approve users (403) | Must be logged in as admin role |

## License

MIT
