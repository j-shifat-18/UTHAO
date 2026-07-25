-- ============================================
-- UTHAO - Smart Logistics & Parcel Delivery
-- Master Schema Migration
-- Run this file to create all tables in order
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Execute in dependency order:
-- 1.  roles (no dependencies)
-- 2.  users (depends on roles)
-- 3.  customers (depends on users)
-- 4.  addresses (depends on nothing - polymorphic)
-- 5.  branches (depends on users for manager_id)
-- 6.  warehouses (depends on branches)
-- 7.  employees (depends on users, branches)
-- 8.  delivery_agents (depends on users, branches)
-- 9.  parcel_categories (no dependencies)
-- 10. parcels (depends on customers, addresses, branches, warehouses, parcel_categories)
-- 11. parcel_status_history (depends on parcels, users)
-- 12. parcel_assignments (depends on parcels, delivery_agents, users)
-- 13. warehouse_transfers (depends on parcels, warehouses, users)
-- 14. payment_methods (no dependencies)
-- 15. payments (depends on parcels, customers, payment_methods)
-- 16. invoices (depends on payments, customers)
-- 17. notifications (depends on users)
-- 18. audit_logs (depends on users)

-- NOTE: Run individual files in the order listed above,
-- or use the combined migration below.
