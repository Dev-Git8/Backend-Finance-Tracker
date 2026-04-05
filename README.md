# Backend Finance Tracker 📊

A robust, role-based backend API for managing financial records, tracking user activity, and deriving powerful dashboard analytics. This project was built utilizing modern Node.js practices, demonstrating secure authentication, comprehensive CRUD operations, layered role-based access control (RBAC), and backend data aggregation.

## 🚀 Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JSON Web Tokens (JWT) & bcrypt (Cookies-based)
- **Testing:** Jest & Supertest

## 🔥 Key Features

### 1. Robust Authentication & Session Management
- Secure registration and login flow hashing passwords with `bcrypt`.
- Dual-token validation: Implements short-lived **Access Tokens** alongside long-lived **Refresh Tokens**.
- Automatically handles token management via secure `HttpOnly` cookies strictly bound to the environment.

### 2. Comprehensive Role-Based Access Control (RBAC)
A Hybrid Data Isolation model dynamically controls access and permissions across three distinct user roles:
- **VIEWER:** Strictly fenced into their own data. They can Create, Read, Update, and Delete only their own personal transactions and view their own personal dashboard summaries.
- **ANALYST:** Holds "Platform-Wide Read Access" to view and analyze massive aggregated trends and transactions across the entire application, but is strictly blocked from making destructive edits (Read-Only mode).
- **ADMIN:** Granted complete, system-wide access. Admins can read, update, and delete any transaction in the system, and are the only role allowed to manage user accounts.

### 3. Financial Transaction Ledger
- Complete CRUD system for managing incoming and outgoing financial transactions.
- Dynamic filtering: Endpoints seamlessly support querying via parameters like `startDate`, `endDate`, `category`, and `type` (INCOME/EXPENSE).
- Result pagination.

### 4. Advanced Dashboard Analytics
Demonstrates a strong understanding of database-level aggregation via Prisma querying (`_sum`, `groupBy`):
- Computes multi-level net balances across thousands of records dynamically.
- Breaks down transactions into category-specific spending summaries.
- Computes monthly timeline trends indicating income vs. expense deltas over the calendar year.

### 5. Automated Integration Testing
- Contains 14 robust unit and integration tests written using `Jest` and `Supertest`. 
- Tests mock the Prisma database entirely to ensure accurate logic testing without polluting external or physical databases. 
- Properly validates API protections ensuring access control errors (`401`, `403`) are triggered predictably against unauthorized mock users.

---

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Dev-Git8/Backend-Finance-Tracker.git
   cd Backend-Finance-Tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add the following keys.
   *(Note: Ensure you have a running PostgreSQL instance and provide the correct URL)*
   ```env
   DATABASE_URL="postgresql://<user>:<password>@localhost:5432/FinanceDB?schema=public"
   PORT=3000
   JWT_SECRET="your-secure-access-token-secret"
   REFRESH_TOKEN_SECRET="your-secure-refresh-token-secret"
   ```

4. **Initialize Database:**
   Deploy the schema structure to your database.
   ```bash
   npx prisma db push
   # OR for production-grade migrations:
   npx prisma migrate dev --name init
   ```

5. **Start the server:**
   ```bash
   npm run dev      # To run using nodemon
   # OR
   npm start        # To run standard node process
   ```

6. **Promote the First Admin:**
   Register an account via Postman. Once created, execute to manually elevate your initial user to fully test backend Admin capabilities.
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

---

## 🧪 Testing

The repository uses `Jest` configured dynamically for ES Modules using `cross-env`. 

To run the complete test suite:
```bash
npm test
```

*Expected output:*
```
Test Suites: 4 passed, 4 total
Tests:       14 passed, 14 total
```

---

## 🏗️ API Endpoint Structure

### Auth (`/api/auth`)
- `POST /register`
- `POST /login`
- `POST /refresh-token`
- `POST /logout` — *(Protected)*
- `GET /get-me` — *(Protected)*

### Users (`/api/users`) — *ADMIN Only*
- `GET /` — List with Pagination
- `GET /:id`
- `PATCH /:id/role` 
- `PATCH /:id/status`

### Transactions (`/api/transactions`) 
*(Note: Viewers read/write their own data. Analysts read all. Admins read/write all).*
- `GET /` — Read/Filter list of transactions
- `GET /:id` — Read single transaction
- `POST /` — Create a transaction
- `PUT /:id` — Update a transaction *(Blocked for ANALYST)*
- `DELETE /:id` — Delete a transaction *(Blocked for ANALYST)*

### Dashboard (`/api/dashboard`) 
*(Note: Viewers receive their isolated personal dashboard. Analysts/Admins receive the global platform dashboard).*
- `GET /summary` — Income vs Expense totals
- `GET /recent` — Last 5 transactions
- `GET /category-summary` — Totals grouped by Category
- `GET /trends` — Month-by-month tracking
