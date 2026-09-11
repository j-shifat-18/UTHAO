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

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /payments/methods | None | List active payment methods |
| GET | /payments/revenue | Admin, Manager | Revenue summary with daily & method breakdown |
| GET | /payments/my | Customer | Own payment history |
| GET | /payments/invoices/my | Customer | Own invoices |
| GET | /payments/invoices | Admin, Manager, Employee | List all invoices |
| GET | /payments/invoices/:id | Admin, Manager, Employee | Get invoice by ID |
| GET | /payments/parcels/:parcelId | Admin, Manager, Employee | All payments for a parcel |
| GET | /payments | Admin, Manager, Employee | List all payments with filters |
| POST | /payments | Customer, Admin, Manager, Employee | Create a payment |
| GET | /payments/:id | Any auth | Get payment by ID |
| GET | /payments/:paymentId/invoice | Any auth | Get invoice for a payment |
| PATCH | /payments/:id/verify | Admin, Manager, Employee | Verify / confirm a payment |
| PATCH | /payments/:id/refund | Admin, Manager | Refund a completed payment |
| PATCH | /payments/:id/fail | Admin, Manager, Employee | Mark payment as failed |

---

#### POST /payments

Creates a payment record for a parcel. The amount is always taken from `parcel.delivery_cost` — the client cannot supply or override it.

**Request:**
```json
{
  "parcel_id": "uuid",
  "payment_method_id": 2,
  "transaction_id": "BKH-20240115-XXXXX",
  "notes": "bKash payment"
}
```

Staff must also include `"customer_id": "uuid"` when creating on behalf of a customer (COD collection).

**Response (201):**
```json
{
  "success": true,
  "message": "Payment created",
  "data": {
    "id": "uuid",
    "parcel_id": "uuid",
    "customer_id": "uuid",
    "amount": "117.50",
    "status": "pending",
    "transaction_id": null,
    "paid_at": null,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Errors:** 400 (invalid method, wrong parcel status), 403 (own parcels only for customers), 404 (parcel/customer not found), 409 (already paid or payment exists)

---

#### PATCH /payments/:id/verify

Confirms a pending payment as received. Internally runs `UPDATE payments SET status = 'completed'`. The PostgreSQL trigger `fn_on_payment_completed` then:
1. Stamps `paid_at = NOW()`
2. Sets `parcels.is_paid = true`
3. Auto-generates an invoice with 5% VAT

**Request (optional):**
```json
{ "transaction_id": "BKH-20240115-XXXXX" }
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": { "id": "uuid", "status": "completed", "paid_at": "2024-01-15T10:05:00.000Z" }
}
```

---

#### PATCH /payments/:id/refund

Refunds a completed payment. The trigger reverses `parcels.is_paid = false` and cancels the linked invoice.

**Request:**
```json
{ "notes": "Customer returned parcel — COD not applicable" }
```

---

#### GET /payments/revenue

**Query Params:** `?date_from=2024-01-01&date_to=2024-01-31` (defaults to current month)

Calls the PostgreSQL stored function `get_revenue_summary(p_from, p_to)`.

**Response (200):**
```json
{
  "data": {
    "period": { "from": "2024-01-01", "to": "2024-01-31" },
    "summary": {
      "total_revenue": "47500.00",
      "total_payments": "312",
      "avg_payment": "152.24",
      "total_refunded": "1200.00",
      "net_revenue": "46300.00"
    },
    "by_day": [
      { "date": "2024-01-01", "payment_count": "18", "revenue": "2810.50" }
    ],
    "by_method": [
      { "payment_method": "bkash", "payment_count": "145", "revenue": "22350.00" },
      { "payment_method": "cash",  "payment_count": "98",  "revenue": "15200.00" }
    ]
  }
}
```

---

#### GET /payments/:paymentId/invoice

Returns the auto-generated invoice for a payment. The invoice is created by the DB trigger when a payment is verified.

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "invoice_number": "INV-20240115-A1B2C3D4",
    "payment_id": "uuid",
    "customer_id": "uuid",
    "amount": "117.50",
    "tax_amount": "5.88",
    "total_amount": "123.38",
    "status": "paid",
    "issued_at": "2024-01-15T10:05:00.000Z",
    "due_date": "2024-02-14"
  }
}
```

---

### Deliveries (Assignment Management)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /deliveries | Admin, Manager, Employee | List all assignments with filters |
| POST | /deliveries | Admin, Manager, Employee | Assign agent to a parcel |
| GET | /deliveries/my | Delivery Agent | Agent's own assignment queue |
| GET | /deliveries/parcels/:parcelId | Admin, Manager, Employee | All assignments for a parcel |
| GET | /deliveries/agents/:agentId | Admin, Manager | All assignments for an agent |
| GET | /deliveries/:id | Admin, Manager, Employee, Agent | Get single assignment |
| POST | /deliveries/:id/reassign | Admin, Manager, Employee | Reassign to different agent |
| PATCH | /deliveries/:id/start | Delivery Agent | Mark assignment as in_progress |
| PATCH | /deliveries/:id/complete | Admin, Manager, Employee, Agent | Mark assignment as completed |
| PATCH | /deliveries/:id/fail | Admin, Manager, Employee, Agent | Mark assignment as failed |
| PATCH | /deliveries/:id/notes | Admin, Manager, Employee, Agent | Update delivery notes |

---

#### POST /deliveries

**Request:**
```json
{
  "parcel_id": "uuid",
  "agent_id": "uuid",
  "assignment_type": "pickup",
  "notes": "Call before arriving"
}
```

`assignment_type` must be `pickup` or `delivery`.

- `pickup` → parcel must be in `booked` status
- `delivery` → parcel must be in `in_transit`, `at_warehouse`, or `out_for_delivery`

**Response (201):**
```json
{
  "success": true,
  "message": "Agent assigned successfully",
  "data": {
    "id": 1,
    "parcel_id": "uuid",
    "agent_id": "uuid",
    "assignment_type": "pickup",
    "status": "assigned",
    "assigned_at": "2024-01-15T10:00:00.000Z",
    "notes": "Call before arriving",
    "assigned_by": "uuid"
  }
}
```

**Errors:** 400 (wrong parcel status, agent at capacity, agent unavailable), 404 (parcel/agent not found), 409 (duplicate active assignment)

---

#### POST /deliveries/:id/reassign

**Request:**
```json
{
  "agent_id": "new-agent-uuid",
  "notes": "Original agent sick, reassigning"
}
```

The existing assignment must have `status = 'assigned'`. It will be marked `reassigned` and a new `assigned` record is created.

**Response (201):**
```json
{
  "success": true,
  "message": "Agent reassigned successfully",
  "data": {
    "id": 2,
    "parcel_id": "uuid",
    "agent_id": "new-agent-uuid",
    "assignment_type": "pickup",
    "status": "assigned",
    "assigned_at": "2024-01-15T11:00:00.000Z"
  }
}
```

---

#### PATCH /deliveries/:id/start

Agent-only. Moves the assignment from `assigned` → `in_progress`. Only the assigned agent can call this.

**Response (200):**
```json
{
  "success": true,
  "message": "Assignment started",
  "data": { "id": 1, "status": "in_progress", "..." }
}
```

---

#### PATCH /deliveries/:id/complete

**Request (optional):**
```json
{ "notes": "Delivered to front desk" }
```

Moves assignment to `completed` and increments the agent's `total_deliveries` counter atomically. Agents can complete their own; staff can complete any.

---

#### PATCH /deliveries/:id/fail

**Request (optional):**
```json
{ "notes": "Address not found, recipient unreachable" }
```

Moves assignment to `failed`. Use `PATCH /parcels/:id/status` separately to update the parcel status to `failed`.

---

#### PATCH /deliveries/:id/notes

**Request:**
```json
{ "notes": "Recipient requested evening delivery" }
```

---

#### GET /deliveries

**Query Params:** `?status=assigned&assignment_type=pickup&agent_id=uuid&parcel_id=uuid&page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "parcel_id": "uuid",
      "tracking_number": "DHK-01-20240115-0001",
      "parcel_status": "booked",
      "receiver_name": "Karim Khan",
      "delivery_city": "Dhaka",
      "priority": "standard",
      "agent_id": "uuid",
      "agent_first_name": "Rahim",
      "agent_last_name": "Ahmed",
      "agent_email": "rahim@uthao.com",
      "vehicle_type": "motorcycle",
      "assignment_type": "pickup",
      "status": "assigned",
      "assigned_at": "2024-01-15T10:00:00.000Z",
      "notes": null
    }
  ],
  "meta": { "page": 1, "limit": 10, "totalCount": 5, "totalPages": 1 }
}
```

---

#### GET /deliveries/my

**Query Params:** `?status=assigned&page=1&limit=10`

Returns the authenticated delivery agent's own assignment list.

---

#### GET /deliveries/parcels/:parcelId

Returns the full assignment history for a parcel (all records including reassigned/completed).

**Response (200):**
```json
{
  "data": {
    "parcel": { "id": "uuid", "tracking_number": "DHK-01-20240115-0001", "status": "picked_up" },
    "assignments": [
      { "id": 1, "assignment_type": "pickup", "status": "completed", "agent_first_name": "Rahim", "..." },
      { "id": 2, "assignment_type": "delivery", "status": "assigned", "agent_first_name": "Karim", "..." }
    ]
  }
}
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
