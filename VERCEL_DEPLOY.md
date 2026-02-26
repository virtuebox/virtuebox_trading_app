# Vercel Deployment Guide — Virtue Box Gold Trading App

## The Problem

When you visit `https://virtuebox-trading-app.vercel.app/`, you get:
```
/login?redirect=%2Fdashboard
```

**Root cause:** Your `.env.local` file is correctly excluded from git (via `.gitignore`), so Vercel has **no environment variables** set. Without `JWT_SECRET`, the middleware cannot verify any JWT token and redirects every request back to login.

---

## Step 1: Set Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables**

Add the following three variables for **Production**, **Preview**, and **Development**:

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/virtue_box` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `<strong-random-string-min-32-chars>` | **Must be at least 32 characters** |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |

### Generate a strong JWT_SECRET

Run this in your terminal to generate a secure 64-character secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output (use your own, don't copy this):
```
a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

---

## Step 2: Allow Vercel IPs in MongoDB Atlas

If using MongoDB Atlas, you need to allow connections from Vercel's servers:

1. Go to **MongoDB Atlas** → Your Project → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   - OR add Vercel's static IPs if you're on Vercel Pro

---

## Step 3: Redeploy

After setting environment variables, you **must redeploy** for them to take effect:

```bash
# Using Vercel CLI
vercel --prod

# OR push a new commit to your main branch
git add .
git commit -m "chore: trigger redeploy with env vars"
git push
```

---

## Step 4: Seed the Admin User on Production

Once deployed with env vars working, seed the admin user on your production database:

**Option A — Run locally against production DB** (change `.env.local` temporarily):
```bash
# Temporarily set MONGODB_URI to your production Atlas URI in .env.local
npm run seed:admin
# Then restore .env.local to your local URI
```

**Option B — Use MongoDB Compass** to manually insert the admin document.

---

## Verification Checklist

After deploying:

- [ ] Visit `https://virtuebox-trading-app.vercel.app/` → redirects to `/login` (expected for unauthenticated)
- [ ] Login with `admin@virtuebox.com` / `Admin@123` → redirects to `/dashboard` ✅
- [ ] TopNav shows "Super Admin" with profile dropdown ✅
- [ ] Navigate to `/partners` → Partner Management page loads ✅
- [ ] Create a partner → appears in the table ✅

---

## Environment Variable Quick Reference

```bash
# .env.local (local development — never commit this)
MONGODB_URI=mongodb://localhost:27017/virtue_box
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
JWT_EXPIRES_IN=7d

# Vercel Production (set via dashboard, not file)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/virtue_box
JWT_SECRET=<64-char-hex-from-crypto-randomBytes>
JWT_EXPIRES_IN=7d
```

---

## Why This Happened

`jose` (used in the Edge Runtime middleware) requires `JWT_SECRET` to be **at least 32 characters** for HS256. If the variable is missing or empty, `jwtVerify` throws a "secret too short" error, which is caught silently and returns `null` — causing every authenticated request to be redirected to `/login`.
