# Admin panel API

For the developers of the admin panel (vrh-admin). The old Node backend (`node.vacationrentalhotline.com:5000/api/v1`)
is retired. The site's own app now serves the API, and the admin panel needs changes to use it. Nothing here has been
changed in vrh-admin itself; this file lists what to change.

Every admin call is under `/api/admin`, plus Better Auth's `/api/auth` for signing in. The API is new and consistent,
not a copy of the old one, so every screen's calls change. Section 5 maps each old call to its replacement.

## 1. Connecting

| Setting | Value |
| --- | --- |
| Base URL | `https://vacationrentalhotline.com/api` (no trailing slash; call paths with a leading slash, e.g. `/admin/me`) |
| Where the admin panel runs | A subdomain of the site, e.g. `https://admin.vacationrentalhotline.com` |
| API server setting | `ADMIN_APP_ORIGIN=https://admin.vacationrentalhotline.com` on the site's server, so the API accepts the panel's requests (CORS with credentials) |
| Requests | JSON bodies (`Content-Type: application/json`); no multipart anywhere |
| Credentials | Every request must send cookies: axios `withCredentials: true`, or `fetch(..., { credentials: "include" })` |
| Local development | Run the site on `http://localhost:3000` with `ADMIN_APP_ORIGIN=http://localhost:5173`, and the panel on port 5173 |

Use one axios instance with `baseURL` and `withCredentials`, and handle 401 and 403 in one response interceptor (see
section 3). Don't keep a token anywhere: the session is an httpOnly cookie that scripts can't read.

**The first admin.** A new database has no staff. On the server, run
`npm run admin:create -- --email you@example.com --name "Your Name"`; it prints a generated password once. Add
everyone else from the panel.

## 2. Signing in and the session

| Action | Call | Notes |
| --- | --- | --- |
| Sign in | `POST /auth/sign-in/email` `{ email, password }` | 200 sets the session cookie (7 days, renewed while used). 401 `INVALID_EMAIL_OR_PASSWORD`; 429 after 3 tries in 10 seconds. Show one generic message for a wrong email or password. |
| Who am I | `GET /admin/me` | `{ id, name, email, role, roleLabel, permissions }`. 401 = signed out; 403 = a customer account. Call it once after sign-in and on load, not on a timer. |
| Rename yourself | `PATCH /admin/me` `{ name }` | |
| Change password | `POST /auth/change-password` `{ currentPassword, newPassword, revokeOtherSessions: true }` | 400 `INVALID_PASSWORD` (wrong current password) or `PASSWORD_TOO_WEAK`. Rule: 8-128 characters with at least one letter and one number. |
| Change your email | `POST /auth/change-email` `{ newEmail }` | A confirmation link goes to the new address. |
| Forgot password | `POST /auth/request-password-reset` `{ email, redirectTo }` | `redirectTo` is a page that reads `?token=` (or `?error=INVALID_TOKEN`) and then calls `POST /auth/reset-password` `{ newPassword, token }`. Use the site's `https://vacationrentalhotline.com/reset-password`, or an admin page under `ADMIN_APP_ORIGIN`. |
| Sign out | `POST /auth/sign-out` | Ends the session on the server too. |

Guard every route with `GET /admin/me`, and show menu items and buttons by `permissions` (section 4). Don't rely on
the menu alone: the API checks every call.

## 3. Conventions

- **Success**: `{ "data": ... }`. Lists add `{ "meta": { "page", "pageSize", "total" } }`.
- **Errors**: `{ "error": { "code", "message", "fields"? } }` with a real status. Show `message`; `fields` maps
  field names to messages, for showing errors next to form fields.

| Status | Meaning | What the panel does |
| --- | --- | --- |
| 400 | Invalid input (`VALIDATION_FAILED`, with `fields`) | Show the messages on the form |
| 401 | Not signed in, or the session ended | Go to the login page |
| 403 | Signed in, but the role doesn't allow it (`FORBIDDEN`) | Show "no permission"; don't sign out |
| 404 | Not found | Show "not found" |
| 409 | Not allowed in this state (codes below) | Show the message |
| 502, 503 | Stripe failed, or payments aren't set up | Show the message; try again later |

- **Paging and search**: lists take `?page=1&pageSize=25` (at most 100) and usually `search=`. They are filtered and
  paged on the server: don't download everything and page in the browser.
- **Ids** are UUID strings. **Dates** are ISO 8601 in UTC (`2027-11-22T10:15:00.000Z`). **Money** is in cents:
  `25000` = $250.00.
- **Field names** are camelCase (`ownerEmail`), not the old snake_case (`property_owner_email_1`).
- **Countries and states** are ISO codes: `countryCode` `"US"` or `"CA"`, and `regionCode` such as `"TX"` or `"ON"`.
  `GET /locations` returns the names. The city is free text.

## 4. Roles and permissions

| Permission | Allows |
| --- | --- |
| `dashboard.view` | The dashboard figures |
| `customers.view` | Looking up customers, their properties, notes and payments |
| `customers.manage` | Creating, editing and deleting customers, their properties and notes |
| `billing.manage` | Cancelling renewals, ending cover, refunds |
| `messages.view` | Reading contact-form messages |
| `messages.manage` | Deleting contact-form messages |
| `activity.view` | The sign-in history |
| `staff.manage` | Staff accounts and roles |

Built-in roles: **Admin** has every permission and can't be changed. **Employee** has `dashboard.view`,
`customers.view` and `customers.manage`; its permissions can be edited. Admins can add roles with any mix of
permissions. A role change signs that person out, so it takes effect at once.

## 5. Screens

Paths are relative to the base URL. "Old" is the call the panel makes today.

### Dashboard (`dashboard.view`)

`GET /admin/stats?days=30` (1-365) replaces the old nine calls (`getUserCount`, `getContactUsFormCount`,
`getTotalPropertyCount`, `getTotalRevenueGenerated`, `getTopPropertyOwners`, `getPropertyCountsByCountry`,
`getNewUsersRegistered`, `getNewPropertiesRegistered`, `totalRevenueGenerated`). One call, one loading state.

| Field | Meaning |
| --- | --- |
| `customers.total`, `customers.new` | Customer accounts; new ones in the period |
| `properties.total`, `.active`, `.new`, `.activeByCountry[]` | Properties, those covered now, added in the period, active by country |
| `revenue.totalCents`, `.periodCents`, `.periodPayments` | Money received, less refunds: all time and in the period |
| `messages.total`, `messages.new` | Contact-form messages |
| `topCustomers[]` | The 5 customers with the most active properties: `{ id, name, email, activeProperties }` |
| `daily[]` | One entry per day (UTC): `{ date, newCustomers, newProperties, revenueCents }`, for charts |

### Customers (`customers.view`; changes need `customers.manage`)

| Action | Call | Old |
| --- | --- | --- |
| List and search (name, email, phone) | `GET /admin/customers?search=&page=` | `admin/user/getAllUsers` |
| Details, with properties and payments | `GET /admin/customers/:id` | `admin/user/getUserById`, `property/findPropertyByUserId` |
| Create | `POST /admin/customers` `{ name, email, phone?, sendEmail? }` | `admin/user/createUser` |
| Edit | `PATCH /admin/customers/:id` `{ name?, email?, phone?, streetAddress?, city?, regionCode?, countryCode?, postalCode? }` | `admin/user/updateUser` |
| Reset password | `POST /admin/customers/:id/password` `{ sendEmail? }` | (none) |
| Add properties | `POST /admin/customers/:id/properties` `{ properties: [...] }` | (none) |
| Delete | `DELETE /admin/customers/:id` | `admin/user/deleteUser` |

- List rows: `{ id, name, email, emailVerified, phone, city, regionCode, countryCode, createdAt, properties: { total, active } }`.
- **New accounts and password resets**: the API generates a password (`Kx7m-Pq2r-Tz9a-Wd4e`) and returns it once as
  `data.password`; it emails it too unless `sendEmail` is false. Show it once in a dialog with a Copy button, so the
  admin can pass it on by hand. Don't store it or show it again; once the dialog closes, it's gone. New accounts are
  already verified. Resetting signs the person out everywhere.
- **Deleting a customer** cancels their live Stripe subscriptions at once (no refund), then deletes the account with
  its properties and notes. Payments stay on record. Ask for confirmation, and say so.
- The old "subscription status" switch on Edit User did nothing; billing lives on properties now (see below).
- Export CSV: build it in the browser from the list (quote every field), or page through the API.

### Properties (`customers.view`; changes need `customers.manage`)

| Action | Call | Old |
| --- | --- | --- |
| List and search (owner, emails, phone, address, customer) | `GET /admin/properties?search=&status=active\|inactive&customerId=&page=` | `property/getAllProperty` |
| Details | `GET /admin/properties/:id` | `property/findPropertyById` |
| Edit | `PATCH /admin/properties/:id` (fields as in the property shape below) | (none) |
| Delete | `DELETE /admin/properties/:id` | (none) |
| Notes | `GET`, `POST /admin/properties/:id/notes` `{ body }`; `PATCH`, `DELETE /admin/properties/:id/notes/:noteId` | (in the property) |

Property shape: `{ id, ownerName, ownerEmail, ownerAltEmail, ownerPhone, ownerAltPhone, addressLine1, addressLine2,
city, regionCode, countryCode, postalCode, fullAddress, status, subscriptionEndsAt, autoRenews, createdAt, updatedAt }`.

- `status` is `"active"` (covered) or `"inactive"`. The old list showed only active properties; use `status=active`
  for that.
- `subscriptionEndsAt` is the end of the paid period. `autoRenews` is true while it will renew on that date.
- The details add `customer`, `notes[]` (each with `author: { id, name, staff }`), `subscription` (`{ status,
  unitAmountCents, renews, canceledAt }`) and `payments[]` (each period it was paid for).
- Notes written in the panel are signed with the staff member's name; customers write notes on the site too.
- A covered property can't be deleted (409 `PROPERTY_COVERED`): end its cover first.
- Old field names: `property_owner_name` → `ownerName`, `property_owner_email_1/_2` → `ownerEmail` / `ownerAltEmail`,
  `property_owner_mobile_number_1/_2` → `ownerPhone` / `ownerAltPhone` (E.164, e.g. `+15125550111`),
  `address_line_1/2` → `addressLine1/2`, `zip_code` → `postalCode`, `country` / `state` (names) → `countryCode` /
  `regionCode` (codes). `subscription_start_date` and `validity` are gone: use `payments[]` and `subscriptionEndsAt`.

### Subscriptions: how to cancel (`billing.manage`)

Cover is a yearly Stripe subscription that renews automatically, one item per property. There are two ways to stop
it, both from the property's details:

| Choice | Call | What happens |
| --- | --- | --- |
| **Cancel renewal** | `POST /admin/properties/:id/cancel-renewal` | The property won't renew. It stays covered until `subscriptionEndsAt`, with no refund. This is what a customer can do themselves from the site. |
| **End cover now** | `POST /admin/properties/:id/end-cover` `{ refund }` | Cover ends immediately and renewal stops. `refund` is `"none"`, `"prorated"` (the unused days of the last payment for this property) or `"full"` (all of it). The response says `refundedCents`. |

- Show "Cancel renewal" while `autoRenews` is true, and "End cover now" while the property is active.
- Before "End cover now", ask which refund applies and confirm. A refund goes back to the customer's card through
  Stripe; it can't be undone from the panel.
- The customer gets an email when cover ends (on the next scheduled run, within 15 minutes), with a copy to
  info@vacationrentalhotline.com.
- 409 `NOT_RENEWING` means there's nothing to cancel. 502 or 503 means Stripe failed or isn't set up.
- Refunds made directly in Stripe's dashboard also show up on the payment (`refundedCents`, `status`).

### Payments (`customers.view`)

| Action | Call | Old |
| --- | --- | --- |
| List and search (payer, email, invoice) | `GET /admin/payments?search=&status=&customerId=&page=` | `plans/getAllPayments` |
| One payment | `GET /admin/payments/:id` | (none) |

Payment shape: `{ id, customerId, payerName, payerEmail, status, billingReason, amountCents, refundedCents, currency,
receiptUrl, paidAt, createdAt, stripeInvoiceId, items[] }`.

- One payment is one Stripe invoice: the first payment of a checkout, or a yearly renewal (`billingReason`
  `"subscription_create"` or `"subscription_cycle"`). `items[]` lists the properties it covered, each with its amount
  and period. The old report grouped rows by transaction; that's built in now.
- `status`: `paid`, `failed` (a renewal Stripe is retrying, or a declined card), `partially_refunded`, `refunded`.
- `receiptUrl` can be null: show a dash rather than crashing, as the old page did.

### Contact messages (`messages.view`; delete needs `messages.manage`)

| Action | Call | Old |
| --- | --- | --- |
| List and search | `GET /admin/messages?search=&page=` | `contactUs/getAllContactUs` |
| Delete | `DELETE /admin/messages/:id` | (none) |

Shape: `{ id, name, email, phone, message, createdAt }`. "View Forms" on the dashboard should link to this page.

### Staff (`staff.manage`)

| Action | Call | Old |
| --- | --- | --- |
| List | `GET /admin/staff` | `admin/auth/getAllAdmins` |
| Create | `POST /admin/staff` `{ name, email, role, sendEmail? }` | `admin/auth/register` |
| Edit | `PATCH /admin/staff/:id` `{ name?, email?, role? }` | `admin/auth/updateAdmin`, `findAdminById` |
| Reset password | `POST /admin/staff/:id/password` `{ sendEmail? }` | (none) |
| Delete | `DELETE /admin/staff/:id` | `admin/auth/deleteAdmin` |

- New staff get a generated password the same way as customers: show it once, then it's gone.
- 409 codes: `CANNOT_DELETE_SELF`, `CANNOT_CHANGE_OWN_ROLE`, `LAST_ADMIN` (the last admin can't be deleted or given
  another role). 409 `EMAIL_TAKEN` when the email belongs to any account.
- Pick the role from `GET /admin/roles`; don't hard-code ids such as 1 and 6.

### Roles (`staff.manage`)

| Action | Call |
| --- | --- |
| List (with `permissions`, `system`, `editable`, `members`) | `GET /admin/roles` |
| What a role can include | `GET /admin/permissions` → `[{ name, description }]` |
| Create | `POST /admin/roles` `{ name, label, permissions }` (`name`: 2-20 lower-case letters, digits or hyphens) |
| Edit | `PATCH /admin/roles/:name` `{ label?, permissions? }` |
| Delete | `DELETE /admin/roles/:name` |

The old `role/create`, `role/editRole` and `role/getRolebyId` never matched the backend; these replace them. 409
`ROLE_LOCKED` (admin, or deleting a built-in role), `ROLE_IN_USE` (move its members first), `ROLE_EXISTS`.

### Sign-in history (`activity.view`)

`GET /admin/sign-ins?audience=customers|staff&userId=&page=` replaces `admin/user/login/timings`. Rows:
`{ id, user: { id, name, email, role }, ipAddress, userAgent, signedInAt, signedOutAt }`, newest first;
`signedOutAt` is null while the session is open. History is kept for a year and can't be cleared, so "Clear Logs"
goes.

## 6. Not carried over

| Old feature | Why |
| --- | --- |
| Banners and Services pages | The old backend never had these endpoints. |
| About Us and Terms editors | The site's pages are written in its code; nothing read the stored text. |
| FAQ, departments, plans, admin OTP flows | No screen used them. |
| `x-access-token` and `role_id` headers | The session cookie replaces them. |
| HTTP 500 `jwt expired` as the "signed out" signal | It's now 401, on every call. |

## 7. Fixes for problems in the admin audit

- Every admin call checks the session and permission on the server, including the reads and writes that used to go
  out without a token.
- No token in `localStorage`: the httpOnly session cookie can't be read by scripts.
- Use `baseURL` without a trailing slash and paths with a leading slash, so there are no `//admin/...` URLs. Next.js
  answers those with a redirect, which breaks cross-origin calls.
- One envelope and one error shape, so pages read `res.data.data` and nothing deeper.
- Server-side search and paging, so search and page changes no longer reset each other.
