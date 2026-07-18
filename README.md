# I.Me.Con — Mediation and Conciliation Institute

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.2-orange?logo=drizzle&logoColor=white)](https://orm.drizzle.team/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passed-green?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E_Passed-green?logo=playwright&logoColor=white)](https://playwright.dev/)

Institutional and management web platform for the **I.Me.Con Mediation and Conciliation Institute**, an organization accredited by the Italian Ministry of Justice. It enables the online submission and management of mediation requests for Alternative Dispute Resolution (ADR), featuring a public informative portal, a private user area, and an advanced **Administration Dashboard** (`/gestionale`) for online case monitoring.

---

## 🌟 Key Features

* **Public Informative Portal**: Dynamic pages presenting institutional services, branch office locations (`OfficesMap`), mission, values, and real-time legal updates and news (`NewsContainer`).
* **Multi-Step Mediation Wizard**: Guided submission of formal mediation requests (`/contatti`), automatically generating official protocols in the format `ADR-YYYY-XXXXXX` upon submission.
* **Public Document Download Area (`/modulistica`)**: Public page listing official forms (PDF, Excel, Word docs) fetched dynamically from the filesystem, with security protections against directory traversal attacks.
* **Role-Based Authentication**: Secure JWT session handling stored in HttpOnly/Secure cookies with role verification (`Amministratore`, `Mediatore`, `Segreteria`, `Utente`).
* **Online Administration Portal (`/gestionale`)**:
  * **Quick Navigation**: Directly accessible from the header profile dropdown (`"Vai al gestionale"`) and mobile menu for authenticated staff.
  * **Real-Time Search & Filtering**: Filter mediation practices by protocol, keywords, dispute object, competent seat (`Sede`), or case status (`Stato`).
  * **Interactive Case Inspection**: Detailed modal interface presenting full dispute details, involved parties (`soggetti`), document downloads, and legal parameters.
  * **Visual Deadlines & Warnings**: Dynamic calculation of legal deadlines (3 months standard, 6 months extended) with color-coded warning indicators (Yellow after 60 days, Red when <10 days remain or expired) next to the deposition date.
  * **Role-Based Extensions**: Administrators and Secretaries can toggle a 6-month deadline extension (`prorogata`) directly inside the inspection modal.
  * **Interactive Deadline Calendar (`/gestionale/calendario`)**: An interactive monthly calendar marking procedure starts (green dots) and active deadlines (red dots), with clickable popover details leading to the case details modal.
  * **Browser-Based Document Preview**: Online viewing of uploaded mediation attachments (`/api/gestionale/documento`) directly within the browser.
* **Automated Warning Notifications**: Daily batch utility (`deadline-checker.ts`) that scans active mediations exactly 10 days from expiring and triggers simulated email notifications to the assigned mediator.
* **Enterprise Security & OWASP Hardening**: HTTP security headers (CSP, HSTS, X-Frame-Options) and an in-memory IP Rate Limiter protecting sensitive authentication endpoints.

---

## 📖 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [Project Structure](#-project-structure)
3. [System Requirements](#-system-requirements)
4. [Configuration and Installation](#-configuration-and-installation)
5. [Database & Migrations](#-database--migrations)
6. [Local Development](#-local-development)
7. [Testing Suite](#-testing-suite)
8. [Security & Hardening (OWASP)](#-security--hardening-owasp)
9. [CI/CD Integration (GitHub Actions)](#-cicd-integration-github-actions)

---

## 💻 Tech Stack

### Frontend & Logic
* **Next.js 16.2.4** (App Router & React Server Actions)
* **React 19.2.4**
* **Tailwind CSS v4** with PostCSS for modern, responsive styling and glassmorphism UI
* **Framer Motion** for smooth micro-animations, modals, and page transitions
* **Lucide React** for crisp vector iconography

### Backend & Database
* **PostgreSQL** as the relational database engine
* **Drizzle ORM** for type-safe schema definition, relational query management, and automated migrations
* **Zod** for strict runtime validation of server actions and forms

### Testing Suite
* **Vitest** for unit testing (authentication hashing, session encryption, and management logic)
* **Playwright** for End-to-End browser testing (registration flow, login, multi-step mediation wizard)
* **PowerShell Integration Runner** for automated end-to-end API and database lifecycle verification

---

## 📂 Project Structure

```text
I.Me.Con/
├── .github/workflows/    # CI/CD Pipeline configuration (GitHub Actions)
├── public/               # Static assets and curated imagery
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── actions/      # Server Actions (Auth, Registration, Mediation Submission)
│   │   ├── api/          # API routes (`/api/auth/me`, `/api/gestionale/documento`, test helpers)
│   │   ├── chi-siamo/    # "About Us" institutional page
│   │   ├── contatti/     # Contacts & Multi-Step Mediation Submission Wizard
│   │   ├── dove-siamo/   # Branch offices map and directions
│   │   ├── gestionale/   # Admin Management Portal (`page.tsx`, `GestionaleClient.tsx`)
│   │   ├── login/        # Restricted Area (Login/Registration)
│   │   └── news/         # Legal updates and press releases
│   ├── components/       # Reusable React components
│   │   ├── layout/       # Structural components (`Header.tsx` with role dropdowns, `Footer.tsx`)
│   │   ├── sections/     # Page-specific blocks (Hero, CTA, ContactArea, NewsContainer)
│   │   └── ui/           # Atomic design components (`Button.tsx`)
│   ├── db/               # Database Layer
│   │   ├── schema.ts     # Drizzle PostgreSQL tables and relational definitions
│   │   └── seed.ts       # Initial seeding script (Roles, Statuses, Admin accounts)
│   ├── lib/              # Core utility functions
│   │   ├── auth.ts       # Bcrypt hashing, session tokens, and cookie utilities
│   │   └── rate-limit.ts # In-memory IP rate limiter against brute-force attempts
│   └── tests/            # Comprehensive automated test suites
│       ├── e2e/          # Playwright End-to-End flow specifications
│       ├── unit/         # Vitest unit tests (`auth.test.ts`, `gestionale.test.ts`)
│       ├── verify-db.ts  # Database schema integrity check script
│       └── run_tests.ps1 # Global integration runner for Windows PowerShell
├── drizzle.config.ts     # Drizzle ORM configuration
├── playwright.config.ts  # Playwright browser automation configuration
├── vitest.config.ts      # Vitest unit testing configuration
└── next.config.ts        # Next.js configuration and OWASP security headers
```

---

## 📋 System Requirements
* **Node.js**: version `20.x` or higher
* **PostgreSQL**: local or remote server instance (version `15` or higher)

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
   Create a `.env` file in the project root and provide the following configuration:
   ```env
   # PostgreSQL connection string
   DATABASE_URL="postgres://postgres:password@localhost:5432/imecon"

   # Session encryption key (at least 32 characters in production)
   SESSION_SECRET="replace_with_secure_and_random_32_char_secret_key"

   # Storage directory path for uploaded mediation attachments
   UPLOAD_DIR="./uploads/mediazioni"

   # Comma-separated list of authorized administrator emails
   ADMIN_EMAILS="gtondi36@gmail.com,admin@imecon.it"
   ```

---

## 🗄️ Database & Migrations

The database layer uses Drizzle ORM to maintain type safety across tables and relationships.

* **Schema Synchronization (Drizzle Push)**:
   Directly push schema changes from `src/db/schema.ts` to the connected PostgreSQL instance:
   ```bash
   npx drizzle-kit push
   ```

* **Initial Seeding**:
   Populates lookup tables with required operational roles (`Amministratore`, `Mediatore`, `Segreteria`, `Utente`), mediation statuses, and initial administrative credentials:
   ```bash
   npm run db:seed
   ```

* **Database Visualizer (Drizzle Studio)**:
   Launch the visual UI dashboard to browse and manage database entries:
   ```bash
   npm run db:studio
   ```

* **Database Integrity Check**:
   Verify that all required tables and constraints are present and accessible:
   ```bash
   npx tsx src/tests/verify-db.ts
   ```

---

## 🚀 Local Development

* **Start Development Server (with fast Turbopack bundling)**:
   ```bash
   npm run dev
   ```
   The application will be accessible at [http://localhost:3000](http://localhost:3000).

* **Production Build**:
   ```bash
   npm run build
   # Launch the optimized production bundle
   npm run start
   ```

---

## 🧪 Testing Suite

The application guarantees reliability through three complementary testing layers:

### 1. Unit Tests (Vitest)
Tests core authentication mechanisms (password hashing and session encryption) as well as administration management dashboard serialization and filtering logic (`auth.test.ts` and `gestionale.test.ts`).
```bash
npx vitest run
```

### 2. End-to-End Tests (Playwright)
Validates real user browser interactions across registration, login, and multi-step mediation submission flows.
* **Install Chromium browser**:
   ```bash
   npx playwright install chromium
   ```
* **Run automated browser tests**:
   ```bash
   npx playwright test
   ```

### 3. Complete Integration Suite (PowerShell / Bash)
An automated script simulating sequential API operations to verify database integrity, public GET routes, user registration/login flows, mediation request deposits (`ADR-YYYY-XXXXXX`), and automated data cleanup.
```powershell
powershell -ExecutionPolicy Bypass -File .\src\tests\run_tests.ps1
```

---

## 🔒 Security & Hardening (OWASP)

The system enforces strict security practices to safeguard sensitive legal and personal information:

### 1. HTTP Security Headers
Within [next.config.ts](file:///c:/WEB SITES/I.Me.Con/next.config.ts), security headers aligned with OWASP guidelines are actively enforced:
* **Content-Security-Policy (CSP)**: Restricts executable scripts and resources to trusted domains.
* **X-Frame-Options (DENY)**: Prevents Clickjacking attacks by forbidding external iframe embedding.
* **X-Content-Type-Options (nosniff)**: Forces strict MIME-type compliance.
* **Referrer-Policy**: Protects internal navigation details when traversing external links.
* **HTTP Strict Transport Security (HSTS)**: Mandates secure HTTPS communication across production environments.

### 2. IP Rate Limiting & Role-Based Access Control
* **Brute-Force Protection**: An in-memory rate limiter implemented in [rate-limit.ts](file:///c:/WEB SITES/I.Me.Con/src/lib/rate-limit.ts) limits authentication attempts to a **maximum of 10 requests per minute per IP**.
* **RBAC Enforcement**: Server-side role checks (`getCurrentUser` and `user.ruoli.includes("Amministratore")`) restrict access to the `/gestionale` dashboard and document endpoints strictly to authorized administrators.

---

## ⛓️ CI/CD Integration (GitHub Actions)

The continuous integration pipeline (`.github/workflows/test.yml`) automatically runs against every push and Pull Request targeting `main` or `master` branches:
1. Provisions a clean, isolated PostgreSQL database container in Docker.
2. Performs deterministic dependency installation (`npm ci`).
3. Executes Drizzle schema migrations and seeds default test data.
4. Verifies database schema integrity.
5. Runs the complete Vitest unit testing suite to certify code reliability before merging.
