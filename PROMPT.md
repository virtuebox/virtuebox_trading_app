# PROMPT.md

> **RULE FOR AI**: Read this entire file before making ANY changes to this project.
> Every AI instruction and code change MUST be logged at the bottom of this file with date, summary, and files affected.

---

## Project Overview

**Application:** Virtue Box Gold Trading App
**Framework:** Next.js 16 (App Router) · TypeScript
**UI:** Shadcn UI + Tailwind CSS v4
**Database:** MongoDB via Mongoose (serverless-safe singleton connection)
**Auth:** JWT stored in HTTP-only cookies · bcrypt password hashing
**Deployment:** Vercel (Edge Runtime middleware)
**Live URL:** https://virtuebox-trading-app.vercel.app

---

## User Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full access — can manage partners, access all pages |
| `PARTNER` | Restricted — dashboard only (partner features TBD) |

---

## Folder Structure

```
/
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root layout (fonts, Toaster, suppressHydrationWarning)
│   ├── page.tsx                    # Root redirect → /dashboard
│   ├── globals.css                 # Global styles + Shadcn CSS variables
│   │
│   ├── login/
│   │   └── page.tsx                # Login page (client component — Shadcn Form/Card)
│   │
│   ├── (protected)/                # Route group — all pages requiring auth
│   │   ├── layout.tsx              # Protected layout — wraps pages with <TopNav>
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Dashboard placeholder (server component)
│   │   └── partners/
│   │       └── page.tsx            # Partner Management page (admin only, client component)
│   │
│   └── api/                        # API Route Handlers (Node.js runtime)
│       ├── auth/
│       │   ├── login/route.ts      # POST /api/auth/login
│       │   ├── logout/route.ts     # POST /api/auth/logout
│       │   └── me/route.ts         # GET  /api/auth/me
│       └── partners/
│           └── route.ts            # GET /api/partners · POST /api/partners
│
├── components/
│   ├── layout/
│   │   └── TopNav.tsx              # Sticky top nav with profile dropdown (client component)
│   └── ui/                         # Shadcn UI components (auto-generated, do not edit)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── separator.tsx
│       ├── sonner.tsx              # Toast notifications
│       ├── switch.tsx
│       └── table.tsx
│
├── lib/
│   ├── db.ts                       # Mongoose connection (global cache — serverless safe)
│   ├── auth.middleware.ts          # requireAuth() / requireAdmin() helpers for API routes
│   └── utils.ts                    # Shadcn cn() utility
│
├── models/
│   └── user.model.ts               # Mongoose User schema (ADMIN + PARTNER in one collection)
│
├── services/
│   └── partner.service.ts          # createPartner() / getPartners() — business logic layer
│
├── utils/
│   ├── jwt.util.ts                 # signToken() / verifyToken() using jsonwebtoken (Node.js only)
│   ├── jwt.edge.ts                 # verifyTokenEdge() using jose (Edge Runtime — middleware only)
│   └── password.util.ts            # hashPassword() / comparePassword() using bcryptjs
│
├── scripts/
│   └── seed-admin.ts               # One-time admin user seeder — run: npm run seed:admin
│
├── middleware.ts                   # Next.js Edge Middleware — JWT route protection
│
├── .env.local                      # Local env vars (git-ignored)
├── .env.sample                     # Template for env vars (safe to commit)
├── PROMPT.md                       # This file — AI instructions + change log
├── VERCEL_DEPLOY.md                # Vercel deployment guide
└── next.config.ts                  # Next.js configuration
```

---

## Architecture Notes

### JWT — Two Files (Critical)

| File | Runtime | Library | Used By |
|------|---------|---------|---------|
| `utils/jwt.util.ts` | Node.js | `jsonwebtoken` | API routes (`/api/**`) |
| `utils/jwt.edge.ts` | Edge | `jose` | `middleware.ts` only |

> **Why?** `jsonwebtoken` uses Node.js `crypto` module which is **not available** in Next.js Edge Runtime. `jose` uses Web Crypto APIs and works everywhere. **Never import `jwt.util.ts` in `middleware.ts`.**

### Auth Flow

```
User submits login form
  → POST /api/auth/login
  → Validates email + password (bcrypt)
  → Signs JWT (jsonwebtoken, Node.js)
  → Sets HTTP-only cookie: "token"
  → Returns user info (id, name, email, role, partnerId?)

Subsequent requests to /dashboard or /partners:
  → middleware.ts reads "token" cookie
  → verifyTokenEdge() (jose, Edge Runtime)
  → Verified → NextResponse.next()
  → Not verified → redirect /login?redirect=<original-path>
```

### Database (MongoDB / Mongoose)

- Single `User` collection for both ADMIN and PARTNER roles
- `partnerId` is unique, sparse-indexed (only on PARTNER documents)
- Auto-incremented: `VBP10001`, `VBP10002`, ...
- Passwords are bcrypt-hashed (12 rounds), never returned in queries (`select: false`)
- Connection is cached in `globalThis` for serverless/Edge hot-reload safety

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | JWT signing secret — **must be ≥32 characters** |
| `JWT_EXPIRES_IN` | Optional | Token TTL (default: `7d`) |

---

## API Reference

### Auth APIs

---

#### `POST /api/auth/login`

**Description:** Authenticate a user. Sets JWT in HTTP-only cookie on success.
**Auth Required:** No
**Role Required:** None

**Request Body:**
```json
{
  "email": "admin@virtuebox.com",
  "password": "Admin@123"
}
```

**Response — 200 OK:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Super Admin",
    "email": "admin@virtuebox.com",
    "role": "ADMIN",
    "partnerId": null
  }
}
```
*Sets cookie:* `token=<JWT>; HttpOnly; SameSite=Lax; Max-Age=604800`

**Response — 400 Bad Request:**
```json
{ "success": false, "message": "Email and password are required" }
```

**Response — 401 Unauthorized:**
```json
{ "success": false, "message": "Invalid email or password" }
```

**Response — 403 Forbidden:**
```json
{ "success": false, "message": "Your account has been deactivated. Please contact the administrator." }
```

---

#### `POST /api/auth/logout`

**Description:** Clear the JWT cookie to log the user out.
**Auth Required:** No (cookie is simply cleared)
**Role Required:** None

**Request Body:** *(empty)*

**Response — 200 OK:**
```json
{ "success": true, "message": "Logged out successfully" }
```
*Clears cookie:* `token=; Max-Age=0`

---

#### `GET /api/auth/me`

**Description:** Returns the currently authenticated user's profile from the JWT cookie. Used by client components to restore auth state without a DB call.
**Auth Required:** Yes (JWT cookie)
**Role Required:** Any authenticated user

**Request Headers:** *(cookie: token=\<JWT\>)*

**Response — 200 OK (ADMIN):**
```json
{
  "success": true,
  "user": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Super Admin",
    "email": "admin@virtuebox.com",
    "role": "ADMIN"
  }
}
```

**Response — 200 OK (PARTNER — includes partnerId):**
```json
{
  "success": true,
  "user": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "PARTNER",
    "partnerId": "VBP10001"
  }
}
```

**Response — 401 Unauthorized:**
```json
{ "success": false, "message": "Unauthorized: No token provided" }
```

---

### Partner APIs (Admin Only)

---

#### `GET /api/partners`

**Description:** Returns a list of all PARTNER users.
**Auth Required:** Yes (JWT cookie)
**Role Required:** `ADMIN` only

**Response — 200 OK:**
```json
{
  "success": true,
  "partners": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d2",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "9876543210",
      "partnerId": "VBP10001",
      "isActive": true,
      "role": "PARTNER",
      "createdBy": "Super Admin",
      "createdAt": "2026-02-26T15:30:00.000Z",
      "updatedAt": "2026-02-26T15:30:00.000Z"
    }
  ]
}
```

**Response — 401 Unauthorized:**
```json
{ "success": false, "message": "Unauthorized: No token provided" }
```

**Response — 403 Forbidden:**
```json
{ "success": false, "message": "Forbidden: Admin access required" }
```

---

#### `POST /api/partners`

**Description:** Create a new PARTNER user. Auto-generates `partnerId` (VBP-series). Hashes password with bcrypt.
**Auth Required:** Yes (JWT cookie)
**Role Required:** `ADMIN` only

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass@123",
  "mobile": "9123456789",
  "isActive": true
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | Partner's full name |
| `email` | string | ✅ | Must be unique |
| `password` | string | ✅ | Min 6 characters; bcrypt-hashed |
| `mobile` | string | ❌ | Optional phone number |
| `isActive` | boolean | ❌ | Defaults to `true` |

**Auto-generated fields (not in request):**

| Field | Value |
|-------|-------|
| `partnerId` | Auto-incremented: `VBP10001`, `VBP10002`, ... |
| `role` | Always `"PARTNER"` |
| `createdBy` | Name of the logged-in admin |
| `createdAt` / `updatedAt` | Mongoose timestamps |

**Response — 201 Created:**
```json
{
  "success": true,
  "message": "Partner created successfully",
  "partner": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "mobile": "9123456789",
    "partnerId": "VBP10001",
    "isActive": true,
    "role": "PARTNER",
    "createdBy": "Super Admin",
    "createdAt": "2026-02-26T15:30:00.000Z"
  }
}
```

**Response — 400 Bad Request (validation):**
```json
{ "success": false, "message": "Name, email, and password are required" }
```

**Response — 400 Bad Request (duplicate email):**
```json
{ "success": false, "message": "A user with this email already exists" }
```

**Response — 401 Unauthorized:**
```json
{ "success": false, "message": "Unauthorized: No token provided" }
```

**Response — 403 Forbidden:**
```json
{ "success": false, "message": "Forbidden: Admin access required" }
```

---

## Protected Routes (Middleware)

| Route | Auth Required | Role Required |
|-------|--------------|---------------|
| `/dashboard` | ✅ | Any authenticated user |
| `/partners` | ✅ | `ADMIN` only |

Unauthenticated users are redirected to `/login?redirect=<original-path>`.
PARTNER users accessing `/partners` are redirected to `/dashboard`.

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed:admin   # Create initial ADMIN user (run once)
```

**Default admin credentials (after seeding):**
```
Email:    admin@virtuebox.com
Password: Admin@123
```
> ⚠️ Change the password after first login in production.

---

## Change Log

---

### 2026-02-26 — Initial Application Build

**AI Model:** Google Gemini (Antigravity)
**Summary:** Complete greenfield build of the Virtue Box Gold Trading App.

**Features implemented:**
- JWT auth with HTTP-only cookies (no localStorage exposure)
- Role-based access control: ADMIN and PARTNER
- Middleware-based route protection (`/dashboard`, `/partners`)
- Login page · Dashboard placeholder · Partner Management (CRUD)
- TopNav with profile dropdown (Partner Management hidden for non-admin)
- Auto-incrementing Partner ID (VBP10001, VBP10002, …)
- Admin seed script

**Files created/affected:**
`lib/db.ts` · `lib/auth.middleware.ts` · `models/user.model.ts` · `utils/jwt.util.ts` ·
`utils/password.util.ts` · `middleware.ts` · `services/partner.service.ts` ·
`app/api/auth/login/route.ts` · `app/api/auth/logout/route.ts` · `app/api/auth/me/route.ts` ·
`app/api/partners/route.ts` · `app/login/page.tsx` · `app/(protected)/layout.tsx` ·
`app/(protected)/dashboard/page.tsx` · `app/(protected)/partners/page.tsx` ·
`components/layout/TopNav.tsx` · `app/layout.tsx` · `app/page.tsx` ·
`scripts/seed-admin.ts` · `.env.local` · `.env.sample`

---

### 2026-02-26 — Fix Middleware Edge Runtime Compatibility

**AI Model:** Google Gemini (Antigravity)
**Summary:** Middleware was always redirecting to login because `jsonwebtoken` uses Node.js crypto APIs incompatible with Edge Runtime. Fixed by:
- Creating `utils/jwt.edge.ts` — uses `jose` (Web Crypto, Edge-compatible) exclusively for middleware
- Updating `middleware.ts` to import `verifyTokenEdge` from `jwt.edge.ts`
- Login page updated to use `window.location.href` for reliable hard redirect

**Files affected:** `utils/jwt.edge.ts` (NEW) · `middleware.ts` · `app/login/page.tsx`

---

### 2026-02-26 — Hydration Warning Fix

**AI Model:** Google Gemini (Antigravity)
**Summary:** Added `suppressHydrationWarning` to `<html>` in root layout to silence React hydration mismatch caused by the Jetski browser extension injecting `data-jetski-tab-id` into the HTML element.

**Files affected:** `app/layout.tsx`

---

### 2026-02-27 — Add partnerId to /api/auth/me Response

**AI Model:** Google Gemini (Antigravity)
**Summary:** `partnerId` is now embedded in the JWT at login time and returned by `/api/auth/me` when present (PARTNER users only). No DB lookup required.

**Files affected:** `utils/jwt.util.ts` · `utils/jwt.edge.ts` · `app/api/auth/login/route.ts` · `app/api/auth/me/route.ts`

---

### 2026-02-27 — Vercel Deployment Fix

**AI Model:** Google Gemini (Antigravity)
**Summary:** Added guard in `jwt.edge.ts` to log a clear error when `JWT_SECRET` env var is missing or < 32 chars on Vercel. Created `VERCEL_DEPLOY.md` with full deployment guide.

**Files affected:** `utils/jwt.edge.ts` · `VERCEL_DEPLOY.md` (NEW)

---

### 2026-02-27 — PROMPT.md Documentation Update

**AI Model:** Google Gemini (Antigravity)
**Summary:** Added complete folder structure with descriptions, architecture notes, full API reference with request/response contracts, and comprehensive change log for new team members and AI onboarding.

**Files affected:** `PROMPT.md`

---

<!-- Add new entries above this comment in the same format -->
