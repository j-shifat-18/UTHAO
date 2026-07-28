# UTHAO — Smart Logistics & Parcel Delivery Management System

> A full-stack, Apple-grade courier management platform for Bangladesh — real-time tracking, dynamic rate estimation, multi-role dashboards, and a robust Express API backed by Supabase/PostgreSQL.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Tech Stack](#tech-stack)
4. [Quick Start](#quick-start)
   - [Prerequisites](#prerequisites)
   - [1 — Clone & Install](#1--clone--install)
   - [2 — Configure Environment](#2--configure-environment)
   - [3 — Database Setup](#3--database-setup)
   - [4 — Run the Backend](#4--run-the-backend)
   - [5 — Run the Frontend](#5--run-the-frontend)
5. [Environment Variables](#environment-variables)
6. [Backend API Reference](#backend-api-reference)
   - [Auth Module](#auth-module)
   - [Parcels Module](#parcels-module)
7. [Frontend Pages & Features](#frontend-pages--features)
8. [Role-Based Views](#role-based-views)
9. [Database Schema (Summary)](#database-schema-summary)
10. [Error Response Format](#error-response-format)

---

## Project Overview

UTHAO is a logistics SaaS platform that handles the full parcel lifecycle — from booking and pickup through warehouse sorting, inter-city transit, and final-mile delivery. It exposes a RESTful API consumed by a React SPA styled after Apple's Human Interface Guidelines.

Key capabilities:

| Feature | Description |
|---|---|
| **Live Tracking** | Step-by-step telemetry across 5 parcel states |
| **Rate Estimator** | Dynamic pricing by weight, category, and speed tier |
| **Booking Wizard** | 3-step parcel dispatch with auto-generated tracking codes |
| **Customer Dashboard** | Aggregated shipment history and spend metrics |
| **Agent Console** | Delivery agents advance parcel state in real-time |
| **Hub Network Map** | All operational branch facilities across Bangladesh |
| **Auth** | JWT access/refresh token flow with bcrypt-hashed passwords |
| **Resilience** | In-memory fallback store when the database is offline |

---

## Repository Structure

```
UTHAO/
├── code/
│   ├── backend/               # Express.js REST API
│   │   ├── src/
│   │   │   ├── app.js         # Express app factory (CORS, Helmet, routes)
│   │   │   ├── server.js      # Entry point — boots DB then HTTP listener
│   │   │   ├── config/
│   │   │   │   ├── db.js      # PostgreSQL pool + graceful fallback
│   │   │   │   ├── env.js     # dotenv loader & validation
│   │   │   │   └── logger.js  # Pino structured logger
│   │   │   ├── database/
│   │   │   │   ├── query.js   # pool.query() helper
│   │   │   │   ├── transaction.js
│   │   │   │   ├── migrate.js # Runs complete_schema.sql
│   │   │   │   └── drop.js    # Drops all tables
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.js   # JWT Bearer verification
│   │   │   │   ├── role.middleware.js   # RBAC guard
│   │   │   │   ├── validate.middleware.js
│   │   │   │   ├── error.middleware.js
│   │   │   │   └── notFound.middleware.js
│   │   │   ├── modules/
│   │   │   │   ├── auth/      # register · login · logout · refresh · profile
│   │   │   │   └── parcels/   # track · book · estimate · my-parcels · branches
│   │   │   ├── routes/
│   │   │   │   └── index.js   # Mounts /auth and /parcels under /api/v1
│   │   │   └── sql/
│   │   │       └── migrations/
│   │   │           ├── complete_schema.sql  # Full 18-table DDL
│   │   │           └── drop_all.sql
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── frontend/              # Vite + React SPA
│       ├── src/
│       │   ├── index.css      # Apple design system (CSS custom properties, glassmorphism)
│       │   ├── main.jsx       # ReactDOM entry
│       │   ├── App.jsx        # Root orchestrator — routing, theme, auth state
│       │   ├── services/
│       │   │   └── api.js     # All fetch() calls to /api/v1 with token management
│       │   └── components/
│       │       ├── Navbar.jsx         # Sticky nav with segmented picker & role switcher
│       │       ├── Hero.jsx           # Landing hero with floating search card
│       │       ├── TrackingView.jsx   # Animated progress nodes + timeline + agent card
│       │       ├── RateCalculator.jsx # Live price estimator with category/weight/speed
│       │       ├── BookingModal.jsx   # 3-step parcel dispatch wizard
│       │       ├── Dashboard.jsx      # Customer shipment history & KPIs
│       │       ├── AgentPortal.jsx    # Agent state-machine console
│       │       ├── BranchNetwork.jsx  # Hub facility directory
│       │       ├── AuthModal.jsx      # Sign In / Register modal
│       │       └── Toast.jsx          # Pill-shaped success/error notifications
│       └── package.json
└── README.md                  ← you are here
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Vanilla CSS (custom design system), Lucide React icons |
| **Backend** | Node.js, Express 4, `pg` (PostgreSQL driver), bcrypt, jsonwebtoken |
| **Database** | PostgreSQL via Supabase (with in-memory fallback for development) |
| **Logger** | Pino + pino-pretty |
| **Dev Tools** | Nodemon, oxlint |

---

## Quick Start

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- A **Supabase** project (free tier works) — or a local PostgreSQL instance *(optional — the backend works in memory-mode without a database)*

---

### 1 — Clone & Install

```bash
# Install backend dependencies
cd code/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2 — Configure Environment

```bash
cd code/backend
cp .env.example .env
# Open .env and fill in your values (see Environment Variables section below)
```

---

### 3 — Database Setup

> Skip this step if you want to run in **demo/memory mode** (no database required).

**Option A — CLI migration (recommended)**
```bash
cd code/backend
npm run migrate
```

This executes `src/sql/migrations/complete_schema.sql` against your Supabase project.

**Option B — Supabase Dashboard**
1. Go to your Supabase project → **SQL Editor**
2. Paste the full contents of `code/backend/src/sql/migrations/complete_schema.sql`
3. Click **Run**

**Other database commands:**
```bash
npm run db:drop    # Drop all tables (⚠ destroys all data)
npm run db:reset   # Drop + re-migrate from scratch
```

---

### 4 — Run the Backend

```bash
cd code/backend
npm run dev        # Starts on http://localhost:5000 with nodemon
# or
npm start          # Production start (no auto-reload)
```

**Health check:**
```
GET http://localhost:5000/api/v1/health
→ { "status": "ok", "service": "UTHAO Smart Logistics API", "timestamp": "..." }
```

> If `DATABASE_URL` is missing or the database is unreachable, the server automatically falls back to an in-memory data store with seeded demo users and parcels. No crash, no downtime.

---

### 5 — Run the Frontend

```bash
cd code/frontend
npm run dev        # Starts on http://localhost:3000
```

Open **http://localhost:3000/** in your browser. The frontend auto-detects backend connectivity and displays an **API Live** / **Demo Mode** indicator in the navbar.

---

## Environment Variables

All variables live in `code/backend/.env`. Copy from `.env.example` to get started.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Node environment |
| `PORT` | No | `5000` | HTTP port the API listens on |
| `DATABASE_URL` | No* | — | PostgreSQL connection string (Supabase or local). Falls back to in-memory if absent. |
| `JWT_ACCESS_SECRET` | No* | auto-generated dev key | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | No* | auto-generated dev key | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | `7d` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | Refresh token TTL |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origin(s) |
| `BCRYPT_SALT_ROUNDS` | No | `10` | bcrypt cost factor |

> \* Marked "No" because the server will start without them using safe dev defaults. **Always set real secrets in production.**

---

## Backend API Reference

**Base URL:** `http://localhost:5000/api/v1`

All responses follow this envelope:
```json
{ "success": true, "message": "...", "data": { ... } }
```

---

### Auth Module

#### `POST /auth/register`
Register a new customer account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+8801712345678"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "customer" },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

---

#### `POST /auth/login`
Log in and receive tokens.

**Body:**
```json
{ "email": "user@example.com", "password": "secret123" }
```

> **Demo credentials (memory mode):**
> - Customer: `user@example.com` / `secret123`
> - Admin: `admin@uthao.com` / `secret123`

---

#### `POST /auth/refresh-token`
Exchange a refresh token for a new token pair.

**Body:** `{ "refresh_token": "eyJ..." }`

---

#### `POST /auth/logout`
Invalidate the current session. Requires `Authorization: Bearer <access_token>`.

---

#### `GET /auth/profile`
Get the authenticated user's profile. Requires `Authorization: Bearer <access_token>`.

---

### Parcels Module

#### `GET /parcels/track/:trackingNumber`
Public. Returns full parcel detail with status history and assigned agent.

```
GET /parcels/track/UTH-782910
```

> **Demo tracking codes:** `UTH-782910` (Out for Delivery) · `UTH-941028` (Delivered)

---

#### `POST /parcels/book`
Book a new parcel. Returns generated tracking code.

**Body:**
```json
{
  "sender_name": "John Doe",
  "sender_phone": "+8801712345678",
  "receiver_name": "Sarah Connor",
  "receiver_phone": "+8801811223344",
  "delivery_address_line1": "House 42, Road 11, Banani",
  "delivery_city": "Dhaka",
  "category": "electronics",
  "weight_kg": 1.8,
  "priority": "express",
  "is_fragile": true,
  "payment_method": "prepaid"
}
```

---

#### `POST /parcels/estimate`
Public. Returns a price quote without booking.

**Body:**
```json
{ "category": "small_package", "weight_kg": 2.5, "priority": "standard", "is_fragile": false }
```

**Response:**
```json
{ "success": true, "data": { "estimated_cost": 142.5 } }
```

**Pricing formula:**
```
cost = (base_price + weight_kg × price_per_kg) × priority_multiplier + fragile_surcharge
```

| Priority | Multiplier |
|---|---|
| standard | × 1.0 |
| express | × 1.5 |
| overnight | × 2.2 |

Fragile surcharge: **+৳ 40 BDT** (when category is not already `fragile`).

---

#### `GET /parcels/my-parcels`
Returns all parcels for the authenticated user. Requires `Authorization` header.

---

#### `PATCH /parcels/update-status`
Advance a parcel's status (used by agents and admin).

**Body:**
```json
{
  "trackingNumber": "UTH-782910",
  "status": "out_for_delivery",
  "location": "Banani Distribution Hub",
  "notes": "Agent en route"
}
```

Valid status values: `booked` → `picked_up` → `in_transit` → `out_for_delivery` → `delivered` → `cancelled` / `returned` / `failed`

---

#### `GET /parcels/branches`
Public. Returns all operational branch hub locations.

---

## Frontend Pages & Features

| Route (Tab) | Component | Description |
|---|---|---|
| `Track` (default) | `Hero` + `TrackingView` | Floating search bar → animated 5-node progress tracker |
| `Calculator` | `RateCalculator` | Interactive weight slider, category picker, live price quote |
| `Shipments` | `Dashboard` | Customer KPI cards + filterable shipment history table |
| `Hubs` | `BranchNetwork` | Grid of all operational branch facilities |
| `Agent Portal` | `AgentPortal` | Agent-only: advance parcel states with one click |

**Modals:**
- `BookingModal` — 3-step guided parcel dispatch wizard
- `AuthModal` — Sign In / Register with JWT session persistence

---

## Role-Based Views

Switch roles using the dropdown in the navbar header (for demo purposes):

| Role | Access |
|---|---|
| **Customer** | Track parcels, book parcels, view own shipment history |
| **Delivery Agent** | All customer access + Agent Portal (state-machine console) |
| **Admin** | Full visibility across all parcels and system metrics |

---

## Database Schema (Summary)

The full DDL is in `code/backend/src/sql/migrations/complete_schema.sql` (18 tables, 590 lines).

```
roles → users → customers / employees / delivery_agents
                  ↓
branches / warehouses
                  ↓
parcels → parcel_status_history
       → parcel_assignments (linked to delivery_agents)
       → warehouse_transfers
       → payments → invoices
notifications / audit_logs
```

---

## Error Response Format

All errors follow a consistent envelope:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

| HTTP Status | Meaning |
|---|---|
| `400` | Validation or bad request |
| `401` | Missing or invalid JWT |
| `403` | Insufficient role permissions |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `500` | Internal server error |
