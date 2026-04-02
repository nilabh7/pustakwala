# Pustakwala - Full-Stack E-Commerce Bookstore

> India's growing online bookstore platform - built with Angular 17, Node.js/Express, and PostgreSQL.

---

## Architecture

```
pustakwala/
|-- backend/           # Node.js + Express REST API
|-- frontend/          # Angular 17 SPA
|-- database/          # PostgreSQL migrations & seed
|-- docker-compose.yml # Full stack orchestration
`-- .github/workflows/ # CI/CD pipeline
```

### Tech Stack
| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Angular 17 (standalone, signals)  |
| Backend    | Node.js 20 + Express 4            |
| Database   | PostgreSQL 15                     |
| Auth       | JWT (access + refresh tokens)     |
| Email      | Nodemailer (SMTP)                 |
| Logging    | Winston                           |
| Security   | Helmet, CORS, Rate Limiting       |
| Container  | Docker + Docker Compose           |
| CI/CD      | GitHub Actions                    |

---

## User Roles

| Role   | Capabilities |
|--------|--------------|
| **Buyer**  | Browse/search books, cart, checkout, orders, wishlist, reviews, profile |
| **Seller** | Register store, list books, manage inventory, view orders & earnings dashboard |
| **Admin**  | Approve/reject/suspend sellers, manage users, all orders, feature books, coupons, categories, audit logs |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### 1. Database Setup
```bash
# Create database
createdb pustakwala

# Run migrations + seed
psql -d pustakwala -f database/001_init_schema.sql
psql -d pustakwala -f database/002_seed.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and secrets

npm install
npm run dev        # Starts on http://localhost:3000
```

### 3. Frontend
```bash
cd frontend
npm install
npm start          # Starts on http://localhost:4200
```

---

## Docker (Recommended)

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with production values

# Start everything
docker compose up -d

# View logs
docker compose logs -f backend
```

Services:
- Frontend: http://localhost
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

---

## Default Admin Credentials

```
Email:    admin@pustakwala.com
Password: Admin@123
```
> Change immediately in production.

---

## API Reference

### Base URL: `http://localhost:3000/api/v1`

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register buyer or seller |
| POST | `/auth/login` | Login, returns JWT tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET  | `/auth/me` | Get current user |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset with token |

#### Books (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/books?search=&category=&min_price=&max_price=&sort=&page=` | Browse books |
| GET | `/books/:slug` | Book detail with reviews |
| GET | `/categories` | All categories with counts |

#### Cart & Orders (Buyer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/cart` | View / Add to cart |
| PUT/DELETE | `/cart/:id` | Update / Remove item |
| POST | `/orders` | Place order |
| GET | `/orders` | Order history |
| POST | `/orders/:id/cancel` | Cancel order |
| POST/GET | `/wishlist/toggle`, `/wishlist` | Wishlist management |

#### Seller
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sellers/register` | Register store |
| GET | `/sellers/dashboard` | Sales dashboard |
| GET/POST | `/seller/books` | Manage inventory |
| GET | `/sellers/orders` | Seller order view |

#### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Platform analytics |
| GET | `/admin/sellers?status=pending` | Seller list |
| POST | `/admin/sellers/:id/approve` | Approve seller |
| POST | `/admin/sellers/:id/reject` | Reject with reason |
| GET/PUT | `/admin/orders` | All orders management |
| PUT | `/admin/books/:id/feature` | Feature/unfeature book |
| POST | `/admin/coupons` | Create coupon |

---

## Database Schema

15+ tables with production-grade design:
- **users** - with role-based access (buyer/seller/admin)
- **seller_profiles** - with approval workflow
- **books** - with full-text search (tsvector), images, tags
- **orders + order_items** - with address snapshots
- **cart_items, wishlists** - user shopping state
- **reviews** - verified purchase tracking
- **coupons** - percentage/fixed with limits
- **addresses** - multiple per user with default
- **notifications** - per-user notification feed
- **audit_logs** - full admin action trail
- **seller_payouts** - payout tracking
- **categories** - hierarchical with icons

Key features:
- UUID primary keys throughout
- Automatic `updated_at` triggers
- Full-text search with `tsvector` + `GIN` index
- Auto-rating recalculation on review changes

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens (7d) + refresh tokens (30d)
- Rate limiting: 100 req/15min globally, 10 req/15min on auth
- Helmet security headers
- CORS whitelist
- SQL injection prevention via parameterized queries
- Input validation with express-validator

---

## Environment Variables

See `backend/.env.example` for full list. Key variables:

```env
# Database
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

# JWT (use strong random secrets)
JWT_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars>

# Email (SMTP)
EMAIL_ENABLED, EMAIL_FROM, EMAIL_REPLY_TO
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

# App
FRONTEND_URL=https://your-domain.com
PLATFORM_FEE_PERCENT=5
```

## Email Setup For Hosting

For production, use a transactional email provider or SMTP relay with your domain, such as:
- Resend
- SendGrid
- Mailgun
- Amazon SES

Recommended production settings in `backend/.env`:

```env
EMAIL_ENABLED=true
EMAIL_VERIFY_ON_STARTUP=true
EMAIL_FAIL_FAST=true
EMAIL_FROM=Pustakwala <noreply@your-domain.com>
EMAIL_REPLY_TO=support@your-domain.com

SMTP_HOST=your-provider-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password-or-token
```

Notes:
- `EMAIL_FAIL_FAST=true` makes the backend fail at startup if email is misconfigured, which is desirable in production.
- Set up SPF, DKIM, and ideally DMARC for `your-domain.com` before sending live traffic.
- Avoid personal Gmail SMTP for production. If you temporarily use Gmail, it must be an app password, not a normal account password.

## Recommended Deployment Stack

Recommended hosting for this project:
- Frontend: Vercel
- Backend: Railway
- Database: Supabase Postgres
- Email: Resend API

Deployment guide:
- [DEPLOY_VERCEL_RAILWAY_SUPABASE.md](/C:/Users/nilab/pustakwala/DEPLOY_VERCEL_RAILWAY_SUPABASE.md)

---

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci-cd.yml`):

```
Push to develop -> Run tests -> Build Docker images -> Deploy to Staging
Push to main    -> Run tests -> Build Docker images -> Deploy to Production
```

Required GitHub Secrets:
```
STAGING_HOST, STAGING_USER, STAGING_SSH_KEY
PROD_HOST, PROD_USER, PROD_SSH_KEY
SLACK_WEBHOOK_URL (optional)
```

---

## Frontend Structure

```
src/app/
|-- core/
|   |-- models/         # TypeScript interfaces
|   |-- services/       # AuthService, BookService, CartService, etc.
|   |-- guards/         # authGuard, adminGuard, sellerGuard
|   `-- interceptors/   # JWT auth interceptor with auto-refresh
|-- features/
|   |-- auth/           # Login, Register, ForgotPassword, ResetPassword
|   |-- home/           # Landing page
|   |-- books/          # BookList, BookDetail
|   |-- cart/           # Cart page
|   |-- checkout/       # Checkout with address & payment
|   |-- buyer/          # Orders, OrderDetail, Wishlist, Profile
|   |-- seller/         # Dashboard, Books, Orders, Profile, Register
|   `-- admin/          # Dashboard, Sellers, Users, Orders, Books,
|                       # Coupons, Categories, AuditLogs
`-- shared/             # Reusable components & pipes
```

---

## Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## License

MIT - Built for Pustakwala 2025
