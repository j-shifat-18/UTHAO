# UTHAO — Smart Logistics & Parcel Delivery Management System

Backend API built with Node.js, Express, PostgreSQL (Supabase), and raw SQL via `pg`.

---

## Tech Stack

- Node.js + Express.js
- PostgreSQL (Supabase) via `node-postgres (pg)`
- JWT (access + refresh token auth)
- bcrypt for password hashing
- Pino for structured logging

---

## Setup

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env
# Fill in DATABASE_URL, JWT secrets

# 3. Run database migrations (creates all tables in Supabase)
npm run migrate

# 4. Start dev server
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm start` | Start in production mode |
| `npm run migrate` | Create all tables in the database |
| `npm run db:drop` | Drop all tables (dev only) |
| `npm run db:reset` | Drop + recreate all tables |

---

## Base URL

```
http://localhost:5000/api/v1
```

---

## Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "message": "...",
  "data": { },
  "meta": { "page": 1, "limit": 10, "totalCount": 45, "totalPages": 5, "hasNextPage": true, "hasPrevPage": false }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [ { "field": "email", "message": "Email is required" } ]
}
```

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

Access token expires in **15 minutes**. Use `/auth/refresh-token` to get a new one.

---

## Roles

| Role | Description |
|------|-------------|
| `admin` | Full system access |
| `manager` | Branch/warehouse management |
| `branch_employee` | Parcel processing |
| `delivery_agent` | Pickup and delivery |
| `customer` | Self-service parcel booking |

---

## API Endpoints

---

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Register new customer |
| POST | /auth/login | No | Login, receive tokens |
| POST | /auth/refresh-token | No | Refresh access token |
| POST | /auth/logout | Yes | Invalidate refresh token |
| GET | /auth/profile | Yes | Get current user info |

---

#### POST /auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "mypassword123",
  "first_name": "Rahim",
  "last_name": "Ahmed",
  "phone": "+8801712345678"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "role": "customer", "is_active": true },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

**Errors:** 400 (validation), 409 (email already exists)

---

#### POST /auth/login

**Request:**
```json
{ "email": "user@example.com", "password": "mypassword123" }
```

**Response (200):**
```json
{
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "customer" },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

**Errors:** 401 (invalid credentials), 403 (account deactivated)

---

#### POST /auth/refresh-token

**Request:** `{ "refresh_token": "eyJ..." }`

**Response:** `{ "data": { "access_token": "eyJ...", "refresh_token": "eyJ..." } }`

---

#### POST /auth/logout

**Headers:** `Authorization: Bearer <token>`

**Response:** `{ "message": "Logged out successfully" }`

---

#### GET /auth/profile

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "data": { "id": "uuid", "email": "...", "role": "customer", "is_active": true, "is_verified": false }
}
```

---

### Users (Admin/Manager only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /users | Admin, Manager | List all users |
| GET | /users/:id | Admin, Manager | Get user by ID |
| PATCH | /users/:id | Admin, Manager | Update user |
| PATCH | /users/:id/deactivate | Admin, Manager | Soft-delete user |
| PATCH | /users/:id/activate | Admin, Manager | Reactivate user |

---

#### GET /users

**Query Params:** `?page=1&limit=10&search=rahim&role=customer&is_active=true`

**Response (200):**
```json
{
  "data": [
    { "id": "uuid", "email": "...", "phone": "...", "role": "customer", "is_active": true, "created_at": "..." }
  ],
  "meta": { "page": 1, "limit": 10, "totalCount": 45, "totalPages": 5 }
}
```

---

#### PATCH /users/:id

**Request (any subset):**
```json
{ "email": "new@email.com", "phone": "+880...", "role_id": 2, "is_active": true }
```

---

#### PATCH /users/:id/deactivate

Sets `is_active = false`. User cannot login but data is preserved.

---

### Customers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /customers/me | Customer | Get own profile |
| GET | /customers | Admin, Manager | List all customers |
| GET | /customers/:id | Any auth | Get customer by ID |
| PATCH | /customers/:id | Any auth | Update customer profile |
| GET | /customers/:id/addresses | Any auth | Get customer addresses |
| POST | /customers/:id/addresses | Any auth | Add address |

---

#### GET /customers/me

**Response:**
```json
{
  "data": {
    "id": "customer-uuid", "user_id": "user-uuid",
    "first_name": "Rahim", "last_name": "Ahmed",
    "email": "rahim@example.com", "phone": "+880...",
    "gender": null, "date_of_birth": null
  }
}
```

---

#### PATCH /customers/:id

Customers can only update their own profile. Admins can update any.

**Request (any subset):**
```json
{ "first_name": "Rahim", "last_name": "Khan", "date_of_birth": "1995-06-15", "gender": "male" }
```

---

#### POST /customers/:id/addresses

**Request:**
```json
{
  "label": "home",
  "address_line1": "123 Gulshan Ave",
  "city": "Dhaka",
  "state": "Dhaka",
  "postal_code": "1212",
  "is_default": true
}
```

**Response (201):**
```json
{ "data": { "id": 1, "label": "home", "address_line1": "123 Gulshan Ave", "city": "Dhaka", "is_default": true } }
```

---

### Branches

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /branches | Any auth | List branches |
| GET | /branches/:id | Any auth | Get branch by ID |
| GET | /branches/:id/stats | Any auth | Branch statistics |
| POST | /branches | Admin, Manager | Create branch |
| PATCH | /branches/:id | Admin, Manager | Update branch |
| DELETE | /branches/:id | Admin | Deactivate branch |

---

#### GET /branches

**Query Params:** `?search=dhaka&city=Dhaka&is_active=true&page=1&limit=10`

**Response:**
```json
{
  "data": [
    {
      "id": 1, "name": "Dhaka Central", "code": "DHK-01",
      "city": "Dhaka", "state": "Dhaka", "address": "...",
      "is_active": true, "manager_email": "manager@uthao.com"
    }
  ]
}
```

---

#### GET /branches/:id/stats

**Response:**
```json
{
  "data": {
    "branch": { "id": 1, "name": "Dhaka Central", "code": "DHK-01" },
    "stats": {
      "employee_count": "5",
      "agent_count": "12",
      "warehouse_count": "2",
      "active_parcels_origin": "34",
      "active_parcels_destination": "28"
    }
  }
}
```

---

#### POST /branches

**Request:**
```json
{
  "name": "Dhaka Central",
  "code": "DHK-01",
  "city": "Dhaka",
  "state": "Dhaka",
  "address": "123 Motijheel Road",
  "phone": "+88021234567",
  "email": "dhaka@uthao.com",
  "manager_id": "uuid",
  "opening_time": "09:00",
  "closing_time": "18:00"
}
```

---

### Warehouses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /warehouses | Any auth | List warehouses |
| GET | /warehouses/:id | Any auth | Get warehouse by ID |
| GET | /warehouses/:id/occupancy | Any auth | Capacity info |
| POST | /warehouses | Admin, Manager | Create warehouse |
| PATCH | /warehouses/:id | Admin, Manager | Update warehouse |
| DELETE | /warehouses/:id | Admin | Deactivate warehouse |
| POST | /warehouses/transfers | Admin, Manager, Employee | Initiate transfer |
| PATCH | /warehouses/transfers/:id/complete | Admin, Manager, Employee | Complete transfer |

---

#### GET /warehouses/:id/occupancy

**Response:**
```json
{
  "data": {
    "id": 1, "name": "Central Warehouse", "code": "WH-DHK-01",
    "total_capacity": 500, "current_occupancy": 342,
    "available_space": 158, "occupancy_percentage": "68.40"
  }
}
```

---

#### POST /warehouses

**Request:**
```json
{
  "name": "Central Warehouse",
  "code": "WH-DHK-01",
  "branch_id": 1,
  "city": "Dhaka",
  "address": "Industrial Area, Tejgaon",
  "total_capacity": 500
}
```

---

#### POST /warehouses/transfers

**Request:**
```json
{ "parcel_id": "uuid", "from_warehouse_id": 1, "to_warehouse_id": 2 }
```

---

### Parcels

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /parcels/track/:trackingNumber | None | Public parcel tracking |
| GET | /parcels/categories | None | List parcel categories with pricing |
| GET | /parcels/my | Customer | Customer's own parcels |
| GET | /parcels | Admin, Manager, Employee | All parcels with filters |
| POST | /parcels | Customer | Book a parcel |
| GET | /parcels/:id | Any auth | Full parcel detail |
| GET | /parcels/:id/tracking | Any auth | Full status timeline |
| PATCH | /parcels/:id | Any auth | Update parcel info |
| PATCH | /parcels/:id/status | Admin, Manager, Employee, Agent | Update status |
| PATCH | /parcels/:id/cancel | Any auth | Cancel parcel |

---

#### GET /parcels/track/:trackingNumber (Public)

**Example:** `GET /parcels/track/DHK-01-20240115-0001`

**Response:**
```json
{
  "data": {
    "parcel": {
      "tracking_number": "DHK-01-20240115-0001",
      "receiver_name": "Karim Khan",
      "status": "in_transit",
      "delivery_city": "Chittagong",
      "estimated_delivery_date": "2024-01-17"
    },
    "history": [
      { "status": "booked", "location": "Dhaka Central", "notes": "Parcel booking confirmed", "created_at": "..." },
      { "status": "picked_up", "location": "Gulshan, Dhaka", "created_at": "..." },
      { "status": "in_transit", "location": "Dhaka Warehouse", "created_at": "..." }
    ]
  }
}
```

---

#### GET /parcels/categories (Public)

**Response:**
```json
{
  "data": [
    { "id": 1, "name": "document", "description": "Documents and papers", "base_price": "50.00", "price_per_kg": "10.00" },
    { "id": 2, "name": "small_package", "base_price": "80.00", "price_per_kg": "25.00" }
  ]
}
```

---

#### GET /parcels/my

**Query Params:** `?status=in_transit&page=1&limit=10`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid", "tracking_number": "DHK-01-20240115-0001",
      "receiver_name": "Karim Khan", "delivery_city": "Chittagong",
      "status": "in_transit", "delivery_cost": "117.50",
      "payment_method": "prepaid", "is_paid": false,
      "category_name": "small_package", "created_at": "..."
    }
  ],
  "meta": { "page": 1, "limit": 10, "totalCount": 3 }
}
```

---

#### GET /parcels (Admin/Manager/Employee)

**Query Params:** `?status=booked&priority=express&city=Dhaka&customer_id=uuid&search=01712&date_from=2024-01-01&date_to=2024-01-31&page=1&limit=10`

---

#### POST /parcels

**Request:**
```json
{
  "receiver_name": "Karim Khan",
  "receiver_phone": "+8801812345678",
  "receiver_email": "karim@example.com",
  "delivery_address_line1": "456 Mirpur Road",
  "delivery_city": "Dhaka",
  "delivery_state": "Dhaka",
  "delivery_postal_code": "1216",
  "category_id": 2,
  "weight_kg": 1.5,
  "priority": "standard",
  "payment_method": "prepaid",
  "origin_branch_id": 1,
  "destination_branch_id": 2,
  "is_fragile": false,
  "description": "Books and stationery"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "tracking_number": "DHK-01-20240115-0001",
    "status": "booked",
    "delivery_cost": 117.50,
    "priority": "standard",
    "payment_method": "prepaid"
  }
}
```

**Cost formula:** `(base_price + price_per_kg × weight_kg) × priority_multiplier`

Priority multipliers: standard=1.0x, express=1.5x, overnight=2.0x

---

#### PATCH /parcels/:id/status

Customers cannot call this. Staff and agents only.

**Valid transitions:**
- `booked` → picked_up, cancelled
- `picked_up` → in_transit, cancelled, failed
- `in_transit` → at_warehouse, out_for_delivery, failed
- `at_warehouse` → in_transit, out_for_delivery
- `out_for_delivery` → delivered, failed, returned
- `failed` → out_for_delivery, returned

**Request:**
```json
{ "status": "picked_up", "location": "Gulshan, Dhaka", "notes": "Picked up from sender" }
```

---

#### PATCH /parcels/:id/cancel

Customers can cancel their own parcels in `booked` or `picked_up` status only.

**Request:**
```json
{ "reason": "Customer requested cancellation" }
```
