# FarmWise

**Growing Knowledge, Growing Harvests.**

FarmWise is a production-grade Learning Management System built for agricultural education. It connects farming instructors with smallholder and commercial farmers across East Africa, with first-class offline support for learning in the field.

## Features

- **Dual Registration** — Email/password or phone SMS OTP (Africa's Talking)
- **Course Marketplace** — Browse, search, filter by category/level
- **Instructor Tools** — Course builder with drag-and-drop curriculum editor
- **HLS Video Streaming** — Cloudinary-powered adaptive bitrate delivery
- **Offline-First Learning** — Download lectures for playback without internet
- **Progress Sync** — Automatic background sync when connectivity returns
- **Stripe Payments** — Checkout, Connect payouts (70/30 split), refunds
- **Community** — Q&A per lecture, timestamped notes, course reviews
- **PDF Certificates** — Auto-generated on course completion
- **Admin Console** — KPI dashboard, moderation, instructor applications
- **PWA** — Installable on Android home screens

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7 |
| PWA | vite-plugin-pwa, Workbox |
| Styling | Tailwind CSS 4, shadcn/ui |
| State | Zustand, React Query |
| Offline | IndexedDB (idb), Service Worker |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT + HttpOnly refresh cookies, bcrypt |
| Media | Cloudinary (HLS video, images) |
| Payments | Stripe Checkout + Connect |
| Email | Resend |
| SMS | Africa's Talking |
| Jobs | Redis, BullMQ |
| Testing | Vitest (unit), Playwright (E2E) |
| Deploy | Docker, docker-compose |

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm 9+

## Quick Start

```bash
# Clone
git clone <repo-url> && cd FarmWise

# Install
npm install

# Environment
cp .env.example .env
# Fill in your API keys (see Environment Variables below)

# Database
cd packages/db
npx prisma migrate deploy
npx prisma db seed
cd ../..

# Development
npm run dev
```

API runs on `http://localhost:4000`, web on `http://localhost:5173`.

## Docker

```bash
docker-compose up --build
```

Web: `http://localhost:80` | API: `http://localhost:4000`

## Project Structure

```
FarmWise/
├── apps/
│   ├── api/              # Express REST API
│   │   └── src/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── routes/
│   │       ├── middleware/
│   │       └── jobs/
│   └── web/              # React SPA + PWA
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── offline/
│           ├── store/
│           └── lib/
├── packages/
│   ├── db/               # Prisma schema + migrations
│   ├── shared/           # Shared TypeScript types
│   └── config/           # Base tsconfig
├── docker-compose.yml
├── Dockerfile.api
└── Dockerfile.web
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret (different from above) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `RESEND_API_KEY` | Resend email API key |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_USERNAME` | Africa's Talking username (`sandbox` for testing) |
| `FRONTEND_URL` | Frontend URL for CORS and email links |
| `PORT` | API server port (default: 4000) |

## Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, and API Secret to `.env`
3. In Settings > Upload, enable unsigned uploads
4. Configure notification webhook URL: `https://your-api.com/api/v1/instructor/media/video-ready`

## Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Copy Secret Key to `STRIPE_SECRET_KEY`
3. Set up webhook endpoint: `https://your-api.com/api/v1/payments/webhook`
4. Subscribe to events: `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`
5. Copy Webhook Signing Secret to `STRIPE_WEBHOOK_SECRET`

## AWS Upgrade Path

The media layer uses a `StorageService` interface. To switch from Cloudinary to AWS:

1. Implement `S3StorageService` matching the `StorageService` interface
2. Set `STORAGE_PROVIDER=aws` in `.env`
3. Add AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`)
4. No other code changes required

## License

Private — All rights reserved.
