# UTHAO - Smart Logistics & Parcel Delivery Management System

## Setup

```bash
cp .env.example .env
# Fill in your Supabase DATABASE_URL and JWT secrets
npm install
```

## Database Setup

You need to create the tables in your Supabase database before the API will work.

**Option 1: Using the CLI (recommended)**

```bash
npm run migrate
```

This runs `src/sql/migrations/complete_schema.sql` against your Supabase database.

**Option 2: Using Supabase Dashboard**

1. Go to your Supabase project → **SQL Editor**
2. Copy the entire contents of `src/sql/migrations/complete_schema.sql`
3. Paste it in the editor and click **Run**

**Other database commands:**

```bash
# Drop all tables (WARNING: destroys all data)
npm run db:drop

# Reset database (drop + recreate)
npm run db:reset
```

## Run the Server

```bash
npm run dev
```

## Base URL

```
http://localhost:5000/api/v1
```

---

## API Endpoints

### Auth Module

#### POST /api/v1/auth/register

Register a new customer account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+8801712345678"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "phone": "+8801712345678",
      "role": "customer",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1...",
    "refresh_token": "eyJhbGciOiJIUzI1..."
  }
}
```

---

#### POST /api/v1/auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "phone": "+8801712345678",
      "role": "customer",
      "is_active": true
    },
    "access_token": "eyJhbGciOiJIUzI1...",
    "refresh_token": "eyJhbGciOiJIUzI1..."
  }
}
```

---

#### POST /api/v1/auth/refresh-token

Get new access and refresh tokens.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tokens refreshed",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1...",
    "refresh_token": "eyJhbGciOiJIUzI1..."
  }
}
```

---

#### POST /api/v1/auth/logout

Logout (clears refresh token). Requires authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

#### GET /api/v1/auth/profile

Get current user profile. Requires authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+8801712345678",
    "role_id": 5,
    "role": "customer",
    "is_active": true,
    "is_verified": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```
