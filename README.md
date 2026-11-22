# Vacation Rental Hotline — web app

The website, owner portal and API for Vacation Rental Hotline: the public site, sign-up and login, the dashboard
where owners manage their properties, notes and subscriptions, and the API the separate admin panel uses.

## Stack

- Next.js 16 (App Router), React 19 and TypeScript (strict)
- Tailwind CSS 4, with every design token in `src/app/globals.css`
- Radix UI primitives in shadcn/ui-style components (`src/components/ui`), react-hook-form + zod for forms,
  TanStack Table, sonner for toasts, lucide-react for icons
- Stripe Elements for payments and axios for the API
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
drizzle/           SQL migrations, generated from src/server/db/schema.ts
scripts/           db-migrate.mts
public/            logos, favicon, images and the CSV import sample
```
