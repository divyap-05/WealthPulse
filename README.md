# WealthPulse - Full-Stack Multi-User Expense Tracker

WealthPulse is a responsive, multi-user personal finance and expense tracking web application engineered with a **dark luxury fintech** aesthetic. It provides complete multi-tenant workspaces where each user has private records for incomes, expenses, monthly budgets, savings goals, automated recurring commitments, and transparent rule-based financial analytics.

---

## 1. Key Features

- **Multi-Tenant Account Isolation**: Strict server-side ownership enforcement on every read, create, update, and delete operation.
- **1-Click Instant Demo Experience**: Demo button initializes and resets a canonical mock financial profile with realistic data without exposing real user information.
- **Decimal-Safe Financial Architecture**: Financial amounts stored safely as minor unit integers (paise) to prevent floating-point calculation anomalies. Formatted in standard Indian Rupee (₹ INR).
- **Interactive Financial Dashboard**:
  - Net cash flow, period income, expense totals, and savings rate.
  - Interactive Donut chart breakdown of category expenses using Recharts.
  - Recent activity ledger with instant category color indicators.
  - Dynamic monthly budget and savings goal progress bars.
- **Transparent Rule-Based Smart Insights**:
  - Highlights top spending categories and month-over-month surging expenses.
  - Monitors budget thresholds (approaching/exceeded warnings).
  - Evaluates personal savings rates against 20% healthy financial benchmarks.
  - Flags upcoming recurring bills due within the next 7 days.
- **Transactions Ledger**: Search by keyword, filter by income/expense type, categories, and date ranges with pagination and sorting.
- **Monthly Budgets**: Set spending caps on overall expenses or specific categories with configurable alert thresholds (e.g., 80%).
- **Savings Goals**: Track financial reserves (emergency funds, vacations) with dedicated deposit and withdrawal adjustment flows.
- **Automated Recurring Commitments**: Daily, weekly, monthly, or yearly recurring rules with duplicate generation safeguards.
- **Taxonomy Customization**: Create and organize custom income/expense categories and manual payment instruments (UPI, Credit Cards, Cash).
- **Security & Session Management**:
  - Password hashing with `bcryptjs`.
  - Secure JWT authentication stored in HTTP-only cookies (`SameSite`, `HttpOnly`, `Secure` in production).
  - Rate limiting on authentication and password reset routes.
  - Request validation using Zod.
  - Safe development email mocking when SMTP is not configured.
- **Responsive Dark Luxury Glassmorphism UI**: Built with Tailwind CSS, custom glass surfaces, and responsive desktop sidebar + mobile drawer. Includes persistent Dark/Light mode toggle.

---

## 2. Technology Stack

### Frontend
- **React** (v18) & **Vite**
- **JavaScript** (ES Modules)
- **Tailwind CSS** (Dark Luxury multicolor theme)
- **React Router** (v7)
- **Recharts** (2D responsive charts)
- **Lucide React** (Fintech iconography)

### Backend
- **Node.js** (v24) & **Express.js**
- **MongoDB** & **Mongoose**
- **Zod** (Schema validation)
- **bcryptjs** (Password hashing)
- **jsonwebtoken** (JWT authentication via HTTP-only cookies)
- **Helmet** & **CORS** & **express-rate-limit** (Security headers and throttling)
- **Nodemailer** (Graceful fallback email service)

---

## 3. Directory Structure

```text
Expense Tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment and MongoDB connection
│   │   ├── controllers/     # Route business logic (auth, tx, budget, goals, recurring, analytics)
│   │   ├── middleware/      # Auth protect, zod validation, error handler, rate limits
│   │   ├── models/          # Mongoose schemas (User, Transaction, Category, Budget, etc.)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Email mock service, recurring engine, insights generator
│   │   ├── utils/           # Currency decimal conversions, token cookie helpers, demo seed
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server listener
│   ├── tests/               # Node test runner suite (auth, multi-user isolation, demo)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout (sidebar, topbar), common cards, charts
│   │   ├── context/         # AuthContext & ThemeContext
│   │   ├── pages/           # Dashboard, Transactions, Budgets, Goals, Recurring, Reports, etc.
│   │   ├── services/        # Fetch API wrapper with cookie credentials
│   │   ├── utils/           # INR currency and date formatters
│   │   ├── App.jsx          # Route definitions & protected guards
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── GEMINI.md
└── README.md
```

---

## 4. Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- Local MongoDB or MongoDB Atlas URI

### 1. Configure Backend
Navigate to `/backend`:
```bash
cd backend
cp .env.example .env
```
Edit `.env` to configure your MongoDB connection string and JWT secret:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=replace_with_a_long_random_jwt_secret_at_least_32_characters_long
FRONTEND_URL=http://localhost:5173
```
*Note: SMTP email fields are optional. When omitted, verification links and reset links are safely displayed in development logs without blocking registration.*

Install dependencies and start backend:
```bash
npm install
npm run dev
```

### 2. Configure Frontend
Navigate to `/frontend`:
```bash
cd frontend
cp .env.example .env
```
Install dependencies and launch Vite development server:
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Running Tests

Run the automated backend test suite (testing multi-user data isolation, password hashing, and demo seeding):
```bash
cd backend
npm test
```

---

## 6. Accessing Demo Mode

Visitors can test the application without creating an account:
1. Navigate to the landing page or login screen.
2. Click **"Instant Demo Login (1-Click)"**.
3. The server generates an isolated, pristine demo profile with pre-populated transactions, active budgets, recurring rules, and smart insights.

---

## 7. Known Limitations & Future Enhancements

- **Bank Aggregation & Payment Gateways**: In line with the initial release specifications, money transfer gateways and bank sync are disabled; all transactions are manually tracked.
- **Export Formats**: Future iterations can add CSV / PDF transaction ledger downloads.
- **Shared Split Balances**: Multi-party group expense splitting can be implemented in subsequent phases.
