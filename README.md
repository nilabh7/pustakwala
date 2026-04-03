# Pustakwala

Pustakwala is a full-stack online bookstore platform built for buyers, sellers, and admins. It includes catalog browsing, cart and checkout flows, seller onboarding, inventory management, and admin moderation features.

## Architecture

```text
pustakwala/
|-- backend/           # Node.js + Express REST API
|-- frontend/          # Angular SPA
|-- database/          # PostgreSQL schema and seed files
|-- .github/workflows/ # CI/CD automation
`-- docker-compose.yml # Local container orchestration
```

## Tech Stack

- Frontend: Angular 17
- Backend: Node.js, Express
- Database: PostgreSQL
- Auth: JWT
- Email: Resend API
- Hosting target: Vercel + Railway + Supabase

## Core Roles

- Buyer: browse books, manage cart, place orders, manage profile and wishlist
- Seller: register store, manage inventory, track orders
- Admin: approve sellers, moderate platform activity, manage books, users, and orders

## Backend Overview

- REST API for authentication, books, cart, checkout, seller operations, and admin operations
- PostgreSQL-backed data model with role-aware access control
- Healthcheck endpoint for deployment monitoring

## Frontend Overview

- Angular single-page app with route-based feature modules
- Buyer, seller, and admin experiences in one client app
- Build configured for Vercel deployment

## Database Overview

- Users, seller profiles, books, categories, carts, orders, reviews, coupons, notifications, and audit logs
- Schema and seed scripts live in `database/001_init_schema.sql` and `database/002_seed.sql`

## Deployment

- Frontend: Vercel
- Backend: Railway
- Database: Supabase
- Deployment guide: `DEPLOY_VERCEL_RAILWAY_SUPABASE.md`
