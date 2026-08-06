# UTHAO — Smart Logistics & Parcel Delivery Management System

## Project Structure

```
UTHAO/
├── code/
│   ├── backend/     ← Express + Node.js API
│   └── frontend/    ← React + Vite SPA
```

---

## Vercel Deployment Guide

This project deploys as two separate Vercel projects — one for the backend and one for the frontend.

---

### Step 1: Deploy the Backend

#### 1.1 Push to GitHub

Make sure the `code/backend` folder is pushed to your GitHub repo.

#### 1.2 Create a new Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Set **Root Directory** to `code/backend`
4. Framework Preset: **Other**
5. Build Command: *(leave empty)*
6. Output Directory: *(leave empty)*
7. Install Command: `npm install`

#### 1.3 Add Environment Variables

In Vercel → Project → **Settings → Environment Variables**, add all of these:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Supabase pooler connection string |
| `JWT_ACCESS_SECRET` | A long random string (32+ chars) |
| `JWT_REFRESH_SECRET` | A different long random string (32+ chars) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | Your frontend Vercel URL (fill in after deploying frontend) |
| `BCRYPT_SALT_ROUNDS` | `12` |

> **DATABASE_URL**: In Supabase → Project Settings → Database → Connection string → select **Transaction pooler** (port 6543). It looks like:
> `postgresql://postgres.xxxx:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

#### 1.4 Deploy

Click **Deploy**. Your backend URL will be something like:
`https://uthao-backend.vercel.app`

Test it: `https://uthao-backend.vercel.app/api/v1/health` should return `{ "status": "ok" }`

---

### Step 2: Deploy the Frontend

#### 2.1 Create a new Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the same GitHub repository
3. Set **Root Directory** to `code/frontend`
4. Framework Preset: **Vite**
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Install Command: `npm install`

#### 2.2 Add Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.vercel.app/api/v1` |

Replace `your-backend.vercel.app` with the actual backend URL from Step 1.4.

#### 2.3 Deploy

Click **Deploy**. Your frontend URL will be something like:
`https://uthao-frontend.vercel.app`

---

### Step 3: Connect Frontend ↔ Backend

After both are deployed:

1. Go to your **backend** Vercel project → Settings → Environment Variables
2. Update `CORS_ORIGIN` to your actual frontend URL:
   ```
   https://uthao-frontend.vercel.app
   ```
3. Redeploy the backend (Vercel → Deployments → click the latest → **Redeploy**)

---

### Step 4: Run Database Migration

The database tables need to be created in Supabase. You only do this once.

**Option A — from your local machine** (easiest):
```bash
cd code/backend
# Make sure .env has the production DATABASE_URL
npm run migrate
```

**Option B — Supabase SQL Editor**:
1. Go to Supabase dashboard → **SQL Editor**
2. Paste the contents of `code/backend/src/sql/migrations/complete_schema.sql`
3. Click **Run**

---

### Vercel Config Summary

| | Backend | Frontend |
|--|---------|----------|
| Root Directory | `code/backend` | `code/frontend` |
| Framework | Other | Vite |
| Build Command | *(empty)* | `npm run build` |
| Output Dir | *(empty)* | `dist` |
| Config file | `vercel.json` ✓ | `vercel.json` ✓ |

---

## Local Development

```bash
# Backend
cd code/backend
cp .env.example .env    # fill in your values
npm install
npm run migrate         # first time only
npm run dev             # runs on http://localhost:5000

# Frontend (new terminal)
cd code/frontend
cp .env.example .env    # set VITE_API_URL=http://localhost:5000/api/v1
npm install
npm run dev             # runs on http://localhost:5173
```
