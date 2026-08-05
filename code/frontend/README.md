# UTHAO Frontend

A clean, minimal React (Vite) frontend for the UTHAO logistics API — covers customer
auth/profile/addresses and an admin panel for managing users and customers.

## Setup

```bash
npm install
cp .env.example .env
# edit .env if your API isn't running on http://localhost:5000
npm run dev
```

The app expects the UTHAO backend to be running and reachable at the URL in
`VITE_API_URL` (defaults to `http://localhost:5000/api/v1`).

## What's included

- **Auth** — login and registration, split-screen layout, token storage with
  automatic refresh on expiry (`src/api/client.js`, `src/context/AuthContext.jsx`)
- **Customer area** — dashboard, editable profile, address list + add form
- **Admin area** (shown only for `admin` / `manager` roles) — searchable/paginated
  user table with activate/deactivate, and a customer directory
- **Design system** — CSS variables in `src/styles/index.css`: a paper/ink palette
  with a single teal accent, Space Grotesk display type, and a "waybill" motif
  (dashed tracking tags, perforated dividers) used throughout

## Structure

```
src/
  api/client.js         fetch wrapper: auth headers, 401 → refresh → retry
  context/AuthContext.jsx
  components/            Layout, Sidebar, ProtectedRoute, shared UI bits
  pages/auth/            Login, Register
  pages/customer/        Profile, Addresses
  pages/admin/           Users, Customers
  styles/index.css       design tokens + all component styles
```

## Notes

- Role gating assumes the `/auth/profile` response's `role` field is one of
  `customer`, `manager`, or `admin` — `manager`/`admin` see the Administration
  nav section.
- Update the `role` filter options in `pages/admin/Users.jsx` if your backend
  uses different role names.
- No CSS framework — everything is hand-styled with CSS variables, so it's easy
  to retheme by editing the `:root` block in `src/styles/index.css`.
