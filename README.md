# I.Me.Con — Mediation and Conciliation Institute

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.2-orange?logo=drizzle&logoColor=white)](https://orm.drizzle.team/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passed-green?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Passed-green?logo=playwright&logoColor=white)](https://playwright.dev/)

Institutional and management web platform for the **I.Me.Con Mediation and Conciliation Institute**, an organization accredited by the Italian Ministry of Justice. It enables the online submission and management of mediation requests for Alternative Dispute Resolution (ADR), featuring a private area for users and advanced security and control tools.

---

## 📖 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [Project Structure](#-project-structure)
3. [System Requirements](#-system-requirements)
4. [Configuration and Installation](#-configuration-and-installation)
5. [Database & Migrazioni](#-database--migrations)
6. [Local Development](#-local-development)
7. [Testing Suite](#-testing-suite)
8. [Security & Hardening (OWASP)](#-security--hardening-owasp)
9. [CI/CD Integration (GitHub Actions)](#-cicd-integration-github-actions)

---

## 💻 Tech Stack

### Frontend & Logic
* **Next.js 16.2.4** (App Router & React Server Actions)
* **React 19.2.4**
* **Tailwind CSS v4** with PostCSS for a modern and flexible style
* **Framer Motion** for smooth micro-animations and page transitions
* **Lucide React** for vector iconography

### Backend & Database
* **PostgreSQL** as the relational database for production and testing
* **Drizzle ORM** for schema definition, typed query management, and migrations
* **Zod** for robust input data validation and form security

### Testing Suite
* **Vitest** for unit testing (password hashing, session encryption)
* **Playwright** for E2E testing (registration flow, login, mediation request wizard)
* **PowerShell Custom Runner** for complete end-to-end integration tests (DB checks, GET routes, APIs, and submission outcomes)

---

## 📂 Project Structure

```text
I.Me.Con/
├── .github/workflows/    # CI/CD Pipeline (GitHub Actions)
├── public/               # Graphic and static assets
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── actions/      # Server Actions (Registration, Login, Mediation Submission)
│   │   ├── api/          # API endpoints and special testing/cleanup endpoints
│   │   ├── chi-siamo/    # "About Us" information page
│   │   ├── contatti/     # Contacts Page & Mediation Request Wizard
│   │   ├── dove-siamo/   # Contacts and branch offices map page
│   │   └── login/        # Restricted Area (Registration/Login)
│   ├── components/       # Reusable React components
│   │   ├── layout/       # Structural components (Header, Footer)
│   │   ├── sections/     # Page blocks (Contacts, Home)
│   │   └── ui/           # Atomic UI components (Button)
│   ├── db/               # Database Configuration
│   │   ├── schema.ts     # Drizzle table schemas (Postgres)
│   │   └── seed.ts       # Database initial seeding script
│   ├── lib/              # Utilities and configuration classes
│   │   ├── auth.ts       # Authentication, cookie, and session encryption management
│   │   └── rate-limit.ts # IP Rate Limiter implementation (in-memory)
│   └── tests/            # Automated tests
│       ├── e2e/          # Playwright End-to-End tests
│       ├── unit/         # Vitest Unit tests
│       └── run_tests.ps1 # PowerShell script for global integration tests
├── drizzle.config.ts     # Drizzle ORM configuration
├── playwright.config.ts  # Playwright configuration
├── vitest.config.ts      # Vitest configuration
└── next.config.ts        # Next.js configuration (OWASP Headers)
```

---

## 📋 System Requirements
* **Node.js**: version `20.x` or higher
* **PostgreSQL**: local or remote instance version `15` or higher

---

## ⚙️ Configuration and Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd I.Me.Con
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the project root and define the following variables:
   ```env
   # PostgreSQL connection string
   DATABASE_URL="postgres://postgres:password@localhost:5432/imecon"

   # Session encryption key (at least 32 characters in production)
   SESSION_SECRET="replace_with_secure_and_random_32_char_secret_key"

   # Local directory path for storing uploaded files
   UPLOAD_DIR="./uploads/mediazioni"

   # Comma-separated authorized admin email addresses
   ADMIN_EMAILS="admin@imecon.it"
   ```

---

## 🗄️ Database & Migrations

The project manages database schemas using Drizzle ORM.

* **Schema Synchronization (Drizzle Push)**:
  Directly synchronizes the database based on the schema defined in `src/db/schema.ts` (useful during development):
  ```bash
  npx drizzle-kit push
  ```

* **Initial Seeding**:
  Populates the database with predefined roles (Amministratore, Mediatore, Segreteria, Utente) and mediation states:
  ```bash
  npm run db:seed
  ```

* **Database Visualizer (Studio)**:
  Open Drizzle's visual dashboard to explore the tables:
  ```bash
  npm run db:studio
  ```

* **Database Integrity Check**:
  Run the script to verify table structure consistency and minimum required data existence:
  ```bash
  npx tsx src/tests/verify-db.ts
  ```

---

## 🚀 Local Development

* **Development Server (with fast Turbopack compilation)**:
  ```bash
  npm run dev
  ```
  The application will be available at [http://localhost:3000](http://localhost:3000).

* **Production Build**:
  ```bash
  npm run build
  # Starts the compiled application
  npm run start
  ```

---

## 🧪 Testing Suite

The suite consists of three complementary testing layers:

### 1. Unit Tests (Vitest)
Cover core security logic, correct password hashing, and secure encoding/decoding of session tokens.
```bash
npx vitest run
```

### 2. End-to-End Tests (Playwright)
Validate complex user flows by simulating real user actions in a Chromium browser.
* **Install browser**:
  ```bash
  npx playwright install chromium
  ```
* **Run E2E tests**:
  ```bash
  npx playwright test
  ```
  *(Starts a local background server on port `3000` automatically during execution).*

### 3. Complete Integration Tests (PowerShell)
An integrated script that simulates sequential HTTP requests to test:
* Server reachability
* Database structural integrity
* Public GET routes response
* Full authentication flow (creation, duplication, and login)
* Successful mediation request submission, official protocol generation (`ADR-YYYY-XXXXXX`), and automatic test data cleanup.

Execution:
```powershell
powershell -ExecutionPolicy Bypass -File .\src\tests\run_tests.ps1
```

---

## 🔒 Security & Hardening (OWASP)

The application implements robust security criteria to protect user data:

### 1. HTTP Security Headers
Within [next.config.ts](file:///c:/WEB SITES/I.Me.Con/next.config.ts), security headers aligned with OWASP standards are defined:
* **Content-Security-Policy (CSP)**: Restricts sources for authorized scripts, styles, and connections.
* **X-Frame-Options (DENY)**: Prevents Clickjacking attacks by blocking the site from being embedded in external iframes.
* **X-Content-Type-Options (nosniff)**: Prevents the browser from interpreting files outside declared MIME types.
* **Referrer-Policy**: Protects navigation details by sending referrer information only in secure contexts.
* **HTTP Strict Transport Security (HSTS)**: Forces exclusive use of the HTTPS protocol.

### 2. IP Rate Limiting
An in-memory rate limiter implemented in [rate-limit.ts](file:///c:/WEB SITES/I.Me.Con/src/lib/rate-limit.ts) protects sensitive endpoints (registration, login) from brute-force attacks by limiting submissions to a **maximum of 10 requests per minute per IP address**.

---

## ⛓️ CI/CD Integration (GitHub Actions)

The workflow configured in `.github/workflows/test.yml` automates checks on every push or Pull Request to main branches (`main`, `master`):
1. Starts a built-in PostgreSQL service in Docker.
2. Installs dependencies in clean install mode (`npm ci`).
3. Syncs Drizzle schema and seeds the DB (`seed`).
4. Runs the database integrity check.
5. Runs the entire unit testing suite using Vitest.
