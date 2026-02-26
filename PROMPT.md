# PROMPT.md

> **RULE**: Every AI instruction must be logged here **before** any file changes are made.
> The AI **must read** this file before modifying anything in this project.

---

## 2026-02-26

### Feature: Initial Application Build — Virtue Box Gold Trading App

**Summary:**
Complete greenfield build of the Virtue Box Gold Trading App using Next.js (App Router),
Shadcn UI, MongoDB/Mongoose, and JWT authentication via HTTP-only cookies.

**Features implemented:**
- JWT auth with HTTP-only cookies (no localStorage)
- Role-based access control: ADMIN and PARTNER
- Middleware-based route protection (`/dashboard`, `/partners`)
- API routes: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Admin-only API routes: `GET /api/partners`, `POST /api/partners`
- Auto-incrementing Partner ID (VBP10001, VBP10002, …)
- Login page (Shadcn Card + Form + Input + Button)
- Dashboard placeholder page
- Partner Management page (Shadcn Card + Form + Table + Switch)
- TopNav with profile dropdown (Partner Management hidden for non-admin)
- Admin seed script (`scripts/seed-admin.ts`)

**Files created/affected:**

| File | Type |
|------|------|
| `lib/db.ts` | NEW |
| `lib/auth.middleware.ts` | NEW |
| `models/user.model.ts` | NEW |
| `utils/jwt.util.ts` | NEW |
| `utils/password.util.ts` | NEW |
| `middleware.ts` | NEW |
| `services/partner.service.ts` | NEW |
| `app/api/auth/login/route.ts` | NEW |
| `app/api/auth/logout/route.ts` | NEW |
| `app/api/auth/me/route.ts` | NEW |
| `app/api/partners/route.ts` | NEW |
| `app/login/page.tsx` | NEW |
| `app/(protected)/layout.tsx` | NEW |
| `app/(protected)/dashboard/page.tsx` | NEW |
| `app/(protected)/partners/page.tsx` | NEW |
| `components/layout/TopNav.tsx` | NEW |
| `app/layout.tsx` | MODIFIED |
| `app/page.tsx` | MODIFIED |
| `scripts/seed-admin.ts` | NEW |
| `.env.local` | NEW |
| `.env.sample` | NEW |

**AI Model:** Google Gemini (Antigravity)
**Requested by:** Admin / Project Owner

---

<!-- Add new entries below this line in the same format -->
