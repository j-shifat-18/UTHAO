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


---

### Users Module (Admin/Manager only)

#### GET /api/v1/users

List all users with pagination, search, and filtering.

**Query Params:** `?page=1&limit=10&search=john&role=customer&is_active=true`

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Users fetched",
  "data": [ { "id": "uuid", "email": "...", "role": "customer", "is_active": true } ],
  "meta": { "page": 1, "limit": 10, "totalCount": 45, "totalPages": 5, "hasNextPage": true, "hasPrevPage": false }
}
```

---

#### GET /api/v1/users/:id

Get single user details.

---

#### PATCH /api/v1/users/:id

Update user (email, phone, is_active, role_id).

**Request Body:**
```json
{ "email": "new@email.com", "role_id": 2 }
```

---

#### PATCH /api/v1/users/:id/deactivate

Soft-delete (deactivate) a user.

---

#### PATCH /api/v1/users/:id/activate

Reactivate a deactivated user.

---

### Customers Module

#### GET /api/v1/customers/me

Get own customer profile. Requires auth.

**Response (200):**
```json
{
  "success": true,
  "data": { "id": "uuid", "first_name": "Rahim", "last_name": "Ahmed", "email": "...", "phone": "..." }
}
```

---

#### GET /api/v1/customers

List all customers (admin/manager only). Supports `?search=rahim&page=1&limit=10`.

---

#### GET /api/v1/customers/:id

Get customer by ID.

---

#### PATCH /api/v1/customers/:id

Update customer profile.

**Request Body:**
```json
{ "first_name": "Rahim", "last_name": "Khan", "date_of_birth": "1995-06-15", "gender": "male" }
```

---

#### GET /api/v1/customers/:id/addresses

Get all addresses for a customer.

---

#### POST /api/v1/customers/:id/addresses

Add a new address for a customer.

**Request Body:**
```json
{
  "label": "home",
  "address_line1": "123 Main St",
  "city": "Dhaka",
  "state": "Dhaka",
  "postal_code": "1205",
  "is_default": true
}
```

**Response (201):**
```json
{ "success": true, "message": "Address added", "data": { "id": 1, "label": "home", "..." } }
```
