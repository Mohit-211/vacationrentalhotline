# Vacation Rental Hotline — web app

The website and owner portal for Vacation Rental Hotline: the public site, sign-up and login, and the dashboard
where owners manage their properties, notes and subscriptions.

## Stack

- Next.js 16 (App Router), React 19 and TypeScript (strict)
- Tailwind CSS 4, with every design token in `src/app/globals.css`
- Radix UI primitives in shadcn/ui-style components (`src/components/ui`), react-hook-form + zod for forms,
  TanStack Table, sonner for toasts, lucide-react for icons
- Stripe Elements for payments and axios for the API

## Getting started

Requires Node.js 24.

```bash
npm install
npm run dev   # http://localhost:3000
```

`NEXT_PUBLIC_STRIPE_PUBLIC_KEY` (the Stripe publishable key) is read from `.env`. The API base URL is set in
`src/lib/api/client.ts`.

| Script          | What it does                                  |
| --------------- | --------------------------------------------- |
| `npm run dev`   | Development server                            |
| `npm run build` | Production build, including the type check   |
| `npm run start` | Serves the production build                   |
| `npm run lint`  | ESLint (Next.js recommended rules)            |

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
    globals.css    design tokens and base styles
  components/
    ui/            shared building blocks (Button, Dialog, DataTable, ...)
    layout/        header, footer and cookie banner
    landing/       home-page sections
  features/        screens grouped by area: account, auth, dashboard, legal, properties
  lib/             API client, session cookie and validation helpers
public/            logos, favicon, images and the CSV import sample
```
