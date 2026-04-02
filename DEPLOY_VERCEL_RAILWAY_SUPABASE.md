# Deploy: Vercel + Railway + Supabase

This project is prepared for:
- Frontend on Vercel
- Backend on Railway
- PostgreSQL on Supabase
- Email through Resend API

## 1. Supabase

Create a Supabase project, then copy:
- `DATABASE_URL`

Recommended backend DB settings:

```env
DATABASE_URL=postgresql://...
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

Run schema and seed against Supabase:

```bash
cd backend
npm run migrate
npm run seed
```

## 2. Railway Backend

Deploy the `backend` folder as a Railway service.

Set these Railway environment variables:

```env
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

DATABASE_URL=postgresql://...
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_POOL_MIN=2
DB_POOL_MAX=10

JWT_SECRET=replace_with_long_random_secret
JWT_REFRESH_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

FRONTEND_URL=https://your-vercel-domain.vercel.app,https://your-custom-domain.com

EMAIL_ENABLED=true
EMAIL_VERIFY_ON_STARTUP=true
EMAIL_FAIL_FAST=true
EMAIL_PROVIDER=resend_api
RESEND_API_KEY=re_xxx
EMAIL_FROM=Pustakwala <onboarding@resend.dev>
EMAIL_REPLY_TO=support@pustakwala.com

MAX_FILE_SIZE_MB=5
UPLOAD_DIR=uploads
PLATFORM_FEE_PERCENT=5
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

Notes:
- Railway free/trial plans block SMTP, which is why this project now uses the Resend HTTP API.
- After you verify a real domain in Resend, replace `onboarding@resend.dev` with your real sender.

## 3. Vercel Frontend

Create a Vercel project using the `frontend` directory as the root.

Recommended Vercel settings:
- Framework preset: Other
- Build command: `npm run build`
- Output directory: `dist/pustakwala/browser`

Set this Vercel environment variable:

```env
FRONTEND_PUBLIC_API_URL=https://your-railway-backend.up.railway.app/api/v1
```

The frontend build script writes `src/environments/environment.prod.ts` at build time using `FRONTEND_PUBLIC_API_URL`.

## 4. Order of Deployment

1. Create Supabase project
2. Set Railway backend env vars
3. Deploy Railway backend
4. Run backend migrations and seed against Supabase
5. Set Vercel frontend env var
6. Deploy Vercel frontend
7. Update `FRONTEND_URL` in Railway to include the final Vercel URL and custom domain

## 5. Post-Deploy Checks

- `GET /health` on Railway returns healthy
- frontend can log in against Railway API
- admin login works
- seller registration works
- buyer checkout works
- Resend API accepts test mail sends
