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
Custom authorization middleware strictly controls access across three distinct user roles:
- **VIEWER:** Can only read their own profile, view public dashboard summaries, and view available transactions.
- **ANALYST:** Inherits VIEWER permissions but can also view advanced data aggregations (category summaries, trends).
- **ADMIN:** Granted complete, system-wide access. Only Admins can modify transaction details, edit user roles, or change the account statuses of other members.

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
- `GET /` — Read/Filter *(VIEWER, ANALYST, ADMIN)*
- `GET /:id` — Read One *(VIEWER, ANALYST, ADMIN)*
- `POST /` — Create *(ADMIN)*
- `PUT /:id` — Update *(ADMIN)*
- `DELETE /:id` — Delete *(ADMIN)*

### Dashboard (`/api/dashboard`) 
- `GET /summary` — Income vs Expense totals *(VIEWER, ANALYST, ADMIN)*
- `GET /recent` — Last 5 transactions *(VIEWER, ANALYST, ADMIN)*
- `GET /category-summary` — Totals grouped by Category *(ANALYST, ADMIN)*
- `GET /trends` — Month-by-month tracking *(ANALYST, ADMIN)*
