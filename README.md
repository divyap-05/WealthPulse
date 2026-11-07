# WealthPulse

WealthPulse is a full-stack personal finance tracker for organizing income, expenses, budgets, savings goals, and recurring transactions in a private account. Its dashboard summarizes cash flow and presents charts and transparent, rule-based financial insights.

## Features

- Account registration, login, profile settings, and password changes for signed-in users. Email verification and password recovery require configured SMTP delivery.
- Expense and income records with categories, payment methods, search, filters, and pagination.
- Monthly overall and category budgets with spending and over-limit tracking.
- Savings goals with deposits and withdrawals.
- Scheduled recurring transaction rules.
- Dashboard summaries, spending charts, reports, and rule-based financial insights.
- Interactive demo account and dark/light themes.

## Technology stack

- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Recharts, Lucide React.
- **Backend:** Node.js, Express 4, Mongoose, Zod.
- **Database:** MongoDB. Local development defaults to `mongodb://localhost:27017/expense_tracker`; development can fall back to `mongodb-memory-server` when the configured database is unavailable.
- **Authentication:** bcryptjs password hashing and seven-day JWTs in HTTP-only cookies.
- **Supporting tools:** Nodemailer for email, Helmet for security headers, express-rate-limit, and Node's built-in test runner with Supertest and mongodb-memory-server.

## Repository layout

```text
.
├── backend/
│   ├── src/
│   │   ├── config/       # Environment and MongoDB setup
│   │   ├── controllers/  # API handlers
│   │   ├── middleware/   # Authentication, validation, rate limits, errors
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # Express routes
│   │   ├── services/     # Email, insights, recurring transactions
│   │   ├── utils/        # Tokens, currency, seed helpers
│   │   └── validators/   # Zod request schemas
│   ├── tests/            # Backend API tests
│   └── package.json
├── frontend/
│   ├── public/           # Static assets and favicon
│   ├── src/
│   │   ├── components/   # Shared UI and layout
│   │   ├── context/      # Authentication and theme state
│   │   ├── pages/        # Application screens
│   │   ├── services/     # API client
│   │   └── utils/        # Formatting helpers
│   ├── index.html
│   └── package.json
├── README.md
└── DEPLOYMENT.md
```

## Local setup

### Requirements

- Node.js 18 or newer and npm.
- MongoDB locally, or a MongoDB connection string you can use for development. The backend includes an in-memory MongoDB fallback for development when its package can start successfully.

### 1. Clone and install

```bash
git clone <repository-url>
cd <repository-directory>
cd backend
npm install
cd ../frontend
npm install
cd ..
```

### 2. Configure environment variables

Create your own `backend/.env` and `frontend/.env` files. The `.env` files are ignored by Git; never commit real credentials. The frontend file can be empty for local use because Vite proxies `/api` to the backend. Frontend variables are public in the built application, so only use them for non-secret configuration.

**Frontend environment variables**

| Name | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Optional | API base URL; defaults to `/api`. For a separately hosted backend, set this to its API base URL ending in `/api`. This value is public. |

Example `frontend/.env`:

```env
# Optional; omit to use the local Vite /api proxy.
VITE_API_URL=http://localhost:5000/api
```

**Backend environment variables**

| Name | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | Yes | Private signing key for authentication tokens. |
| `COOKIE_SECRET` | Production | Private cookie-parser signing key; production must use at least 32 characters. |
| `MONGODB_URI` | Optional locally; required in production | MongoDB connection URI; local default is `mongodb://localhost:27017/expense_tracker`. |
| `PORT` | Optional | HTTP port; defaults to `5000`. |
| `NODE_ENV` | Optional | Runtime mode; use `development` locally and `production` on the server. |
| `FRONTEND_URL` | Optional locally; required in production | Exact HTTPS frontend origin allowed by CORS and cookie-authenticated requests; local default is `http://localhost:5173`. |
| `EMAIL_HOST` | Optional | SMTP server hostname. Configure SMTP as a complete set to send verification and password reset messages. |
| `EMAIL_PORT` | Optional | SMTP port; defaults to `587`. |
| `EMAIL_USER` | Optional | SMTP username. |
| `EMAIL_PASS` | Optional | Private SMTP password. |
| `EMAIL_FROM` | Optional | Sender display address; defaults to a local placeholder. |

Example `backend/.env` (replace placeholders with your own local values):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=replace-with-your-own-development-secret
COOKIE_SECRET=replace-with-your-own-cookie-secret
FRONTEND_URL=http://localhost:5173
# Optional SMTP settings; omit them to disable email verification and password recovery.
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=WealthPulse <noreply@example.test>
```

Backend variables are private and must never be prefixed with `VITE_` or placed in the frontend `.env`. Email verification and password recovery work only when SMTP is configured. Without SMTP, the app does not generate or log mock links, and password recovery is disabled; signed-in users can still change their password from Profile settings. Production requires both private secrets to be configured, and the JWT secret and cookie secret must each be at least 32 characters. Protect these credentials and keep actual `.env` files out of source control.

### 3. Start the backend

In a terminal from the repository root:

```bash
cd backend
npm run dev
```

The API listens on `http://localhost:5000`; its health endpoint is `http://localhost:5000/api/health`.

### 4. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite forwards `/api` requests to `http://localhost:5000`.

## Checks

Run backend tests with `cd backend && npm test`. Build the frontend with `cd frontend && npm run build`. The frontend package does not currently define a lint script.

## Security overview

Passwords are hashed with bcryptjs. Authentication uses expiring JWTs in HTTP-only cookies, password changes invalidate earlier sessions, protected routes derive ownership from the authenticated user, sensitive auth endpoints are rate-limited, request bodies are validated with Zod, and Helmet sets HTTP security headers. Keep backend secrets server-side and never commit credentials. Email links are sent only through configured SMTP; the app does not write verification or reset links to logs or API responses.

## Future improvements

Possible follow-up work includes downloadable transaction reports and bank data integration. These are not currently implemented.

## Contributing

Please open an issue to discuss a substantial change, then submit a focused pull request with a clear description and relevant verification results. No license file is currently included in the repository.
