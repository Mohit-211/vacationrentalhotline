# Vacation Rental Hotline — web app

The website, owner portal and API for Vacation Rental Hotline: the public site, sign-up and login, the dashboard
where owners manage their properties, notes and subscriptions, and the API the separate admin panel uses.

## Stack

- Next.js 16 (App Router), React 19 and TypeScript (strict)
- Tailwind CSS 4, with every design token in `src/app/globals.css`
- Radix UI primitives in shadcn/ui-style components (`src/components/ui`), react-hook-form + zod for forms,
  TanStack Table, sonner for toasts, lucide-react for icons
- Stripe Elements and Stripe Billing (yearly subscriptions) for payments, axios for the API
- API: Next.js route handlers (`src/app/api`), MySQL 8.0 through Drizzle ORM, Better Auth for accounts and
  sessions (httpOnly cookie), Nodemailer for email

## Getting started

Requires Node.js 24 and MySQL 8.0.

1. Copy `.env.example` to `.env.local` and fill it in. Each variable is described there.
2. Create the database: `CREATE DATABASE vrh CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`
3. Create the tables, then start the app:

```bash
npm install
npm run db:migrate
npm run dev   # http://localhost:3000
```

In development, emails (verification links, password resets) are printed to the terminal unless
`MAIL_TRANSPORT=smtp` is set.

| Script          | What it does                                  |
| --------------- | --------------------------------------------- |
| `npm run dev`   | Development server                            |
| `npm run build` | Production build, including the type check   |
| `npm run start` | Serves the production build                   |
| `npm run lint`  | ESLint (Next.js recommended rules)            |
| `npm run db:generate` | Writes a SQL migration for changes to `src/server/db/schema.ts` |
| `npm run db:migrate`  | Applies pending migrations to `DATABASE_URL`  |
| `npm run admin:create -- --email … --name "…"` | Creates an admin account (for a new database); prints its password once |

### Changing the database

Edit `src/server/db/schema.ts`, run `npm run db:generate`, review the new SQL file in `drizzle/` and commit it
with the change. Each environment then runs `npm run db:migrate`, which applies only the migrations it hasn't
run yet. The migrate script needs only `DATABASE_URL` and the runtime packages.

## Routes

| Area      | Routes                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------- |
| Marketing | `/`, `/privacy-policy`, `/terms`, `/cookie-policy`                                                  |
| Auth      | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/verify-email-change` |
| Owner app | `/dashboard`, `/properties/new`, `/properties/[id]`, `/properties/[id]/edit`, `/account`, `/account/password` |

Older URLs (such as `/addnewproperty` or `/email-verify`) redirect permanently to these; see `next.config.ts`.
Signed-in pages send visitors without a session to `/login` first (`src/proxy.ts`).

## API

Route handlers under `src/app/api`, on the same origin as the site. The session is Better Auth's httpOnly
cookie. Responses are `{ "data": ... }`, or `{ "error": { "code", "message", "fields"? } }` with a matching
status (400, 401, 403, 404, 500).

| Endpoint | What it does |
| -------- | ------------ |
| `/api/auth/*` | Better Auth: sign-up, sign-in, sign-out, session, email verification, password reset and change, email change |
| `GET, POST, DELETE /api/properties` | List the user's properties (`?status=active\|inactive`), add 1–500, delete several |
| `GET, PATCH, DELETE /api/properties/:id` | One property with its notes; partial update; delete |
| `GET, POST /api/properties/:id/notes`, `GET, PATCH, DELETE …/notes/:noteId` | Notes on a property |
| `GET, PATCH /api/account` | The user's profile (name, phone, address) |
| `POST /api/contact-messages` | The home page's contact form |
| `GET /api/locations` | Canada and the United States with their provinces and states |
| `POST /api/checkout/quote` | The yearly price of covering the chosen properties |
| `POST /api/checkout` | Starts the yearly Stripe subscription and returns the client secret for the card form |
| `POST /api/checkout/:subscriptionId/sync` | Applies a payment right after the card form confirms it |
| `POST /api/properties/:id/cancel-renewal` | Stops a property renewing; it stays covered until its paid year ends |
| `POST /api/webhooks/stripe` | Stripe's signed events (payments, renewals, cancellations, refunds) |
| `POST /api/jobs/run` | Runs the scheduled jobs now (needs `JOBS_SECRET`) |
| `/api/admin/*` | The admin panel's API: dashboard, customers, properties, subscriptions, payments, messages, staff, roles, sign-in history. See [docs/admin-api.md](docs/admin-api.md) |

Request rules live in `src/lib/schemas` and are shared with the forms. The separate admin panel (vrh-admin) runs on
a subdomain set in `ADMIN_APP_ORIGIN` and signs in with the same session cookie; staff permissions come from roles
(`src/lib/permissions.ts`).

## Payments

Cover is a yearly Stripe subscription that renews automatically. One checkout is one subscription with one item
per property, so each property can stop renewing on its own. Prices live in `src/lib/pricing.ts`, which both
checkout and the pricing section read: one property $250 a year, 2–5 at $200 each, and 6 or more by phone.
The Stripe product (`vrh_property_cover`) is created on first use.

Setting up a Stripe account (test mode first):

1. Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` and `STRIPE_WEBHOOK_SECRET` (see `.env.example`).
2. Add a webhook endpoint at `https://<site>/api/webhooks/stripe` for `invoice.paid`,
   `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted` and `charge.refunded`, on API version `2026-11-18.endive` (the version the
   `stripe` package pins). Its signing secret is `STRIPE_WEBHOOK_SECRET`.
3. In Stripe's Billing settings for failed payments, keep automatic retries (Smart Retries) on and choose to
   **cancel the subscription** once all retries fail, so a renewal that never succeeds ends the cover.
4. The app emails its own receipts, so Stripe's "successful payments" customer emails can be turned off.

A renewing property stays active for 14 days past its paid-through date while Stripe retries a failed renewal.
A cancelled renewal keeps the property covered until the end of the year already paid; staff can also end cover
at once, with or without a refund.

## Scheduled jobs

Every app process runs the jobs in `src/server/jobs` every 15 minutes, and a MySQL lock lets only one process
run them at a time, so the server needs no crontab. They remove accounts not verified within 12 hours (when the
verification link expires), email customers and staff when cover ends, and delete expired tokens and sessions.
`SCHEDULED_JOBS=off` stops a process running them; `POST /api/jobs/run` with `JOBS_SECRET` runs them on demand.

## Project structure

```
src/
  app/
    (marketing)/   public pages: home and legal
    (auth)/        sign-in, sign-up, password and email-verification screens
    (app)/         signed-in pages: dashboard, properties, account
    api/           the API's route handlers
    globals.css    design tokens and base styles
  components/
    ui/            shared building blocks (Button, Dialog, DataTable, ...)
    layout/        header, footer and cookie banner
    landing/       home-page sections
  features/        screens grouped by area: account, auth, dashboard, legal, properties
  lib/             API client, validation helpers and form rules shared with the server (lib/schemas)
  server/          server-only code: database (db/), Better Auth (auth.ts), email, environment
docs/              admin-api.md: the API for the admin panel's developers
drizzle/           SQL migrations, generated from src/server/db/schema.ts
scripts/           db-migrate.mts, create-admin.mts
public/            logos, favicon, images and the CSV import sample
```
