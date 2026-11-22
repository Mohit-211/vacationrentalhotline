import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/*
  Database schema (MySQL 8.0).

  Conventions
  - Table and column names are snake_case; the TypeScript keys are camelCase.
  - Primary keys are UUIDs stored as CHAR(36). Better Auth generates them for
    its tables (users, sessions, accounts, verifications, rate_limits); the app
    generates them for its own tables.
  - Timestamps are DATETIME(3) in UTC. Drizzle converts Dates to and from UTC,
    and every connection sets `time_zone = '+00:00'` so database defaults are
    UTC as well.
  - There are no soft deletes. Rows are deleted for real and the foreign keys
    decide what happens to their children. Subscriptions and payments keep a
    copy of who paid and which address was covered, so the record survives
    those deletes.

  This file is also read by drizzle-kit, so it must not import app modules.
*/

const uuid = (name: string) => char(name, { length: 36 });
const utcDateTime = (name: string) => datetime(name, { mode: "date", fsp: 3 });
const createdAt = () => utcDateTime("created_at").notNull().default(sql`(CURRENT_TIMESTAMP(3))`);
const updatedAt = () =>
  utcDateTime("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP(3))`)
    .$onUpdate(() => new Date());
const newId = () => crypto.randomUUID();

// ---------------------------------------------------------------------------
// Accounts and sign-in (managed by Better Auth)
// ---------------------------------------------------------------------------

/** Role names; customers use the site, staff use the admin panel. */
export const USER_ROLES = ["customer", "employee", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Everyone who can sign in: customers and staff. Better Auth manages the
 * identity columns and the admin plugin's role and ban columns; the contact
 * and address columns belong to the customer's account page.
 */
export const users = mysqlTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    /** Better Auth's profile picture field; the site doesn't use it. */
    image: varchar("image", { length: 2048 }),
    role: varchar("role", { length: 20 }).notNull().default("customer"),
    banned: boolean("banned").notNull().default(false),
    banReason: varchar("ban_reason", { length: 500 }),
    banExpires: utcDateTime("ban_expires"),
    /** E.164, e.g. +14155550123 */
    phone: varchar("phone", { length: 20 }),
    streetAddress: varchar("street_address", { length: 255 }),
    city: varchar("city", { length: 100 }),
    /** ISO 3166-2 subdivision code without the country prefix, e.g. "ON" */
    regionCode: varchar("region_code", { length: 3 }),
    /** ISO 3166-1 alpha-2: "US" or "CA" */
    countryCode: char("country_code", { length: 2 }),
    postalCode: varchar("postal_code", { length: 10 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_stripe_customer_id_unique").on(table.stripeCustomerId),
    index("users_role_created_at_idx").on(table.role, table.createdAt),
  ],
);

export const sessions = mysqlTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: utcDateTime("expires_at").notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    /** Set while a staff member is signed in as this user (admin plugin). */
    impersonatedBy: uuid("impersonated_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("sessions_token_unique").on(table.token),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

/** Sign-in methods. Email and password sign-in is the "credential" provider. */
export const accounts = mysqlTable(
  "accounts",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 50 }).notNull(),
    /** Password hash (scrypt) for the credential provider. */
    password: varchar("password", { length: 255 }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: utcDateTime("access_token_expires_at"),
    refreshTokenExpiresAt: utcDateTime("refresh_token_expires_at"),
    scope: text("scope"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("accounts_provider_account_unique").on(table.providerId, table.accountId),
    index("accounts_user_id_idx").on(table.userId),
  ],
);

/** One-time tokens, such as password-reset links. Identifiers are stored hashed. */
export const verifications = mysqlTable(
  "verifications",
  {
    id: uuid("id").primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: utcDateTime("expires_at").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("verifications_identifier_idx").on(table.identifier),
    index("verifications_expires_at_idx").on(table.expiresAt),
  ],
);

/** Request counters for Better Auth's rate limiter, shared by every app instance. */
export const rateLimits = mysqlTable(
  "rate_limits",
  {
    id: uuid("id").primaryKey(),
    key: varchar("key", { length: 255 }).notNull(),
    count: int("count").notNull(),
    /** Milliseconds since the epoch */
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  },
  (table) => [uniqueIndex("rate_limits_key_unique").on(table.key)],
);

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

/**
 * A rental the hotline answers calls for. The owner fields are the people the
 * hotline contacts about this property; the account holder (user) may be a
 * property manager rather than the owner.
 */
export const properties = mysqlTable(
  "properties",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ownerName: varchar("owner_name", { length: 150 }).notNull(),
    ownerEmail: varchar("owner_email", { length: 255 }).notNull(),
    ownerAltEmail: varchar("owner_alt_email", { length: 255 }),
    /** E.164 */
    ownerPhone: varchar("owner_phone", { length: 20 }).notNull(),
    ownerAltPhone: varchar("owner_alt_phone", { length: 20 }),
    addressLine1: varchar("address_line_1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line_2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    regionCode: varchar("region_code", { length: 3 }).notNull(),
    countryCode: char("country_code", { length: 2 }).notNull(),
    postalCode: varchar("postal_code", { length: 10 }).notNull(),
    /**
     * The end of the period paid for: null until the first payment. Kept in
     * step with subscription payments by the Stripe webhook.
     */
    subscriptionEndsAt: utcDateTime("subscription_ends_at"),
    /**
     * Whether a live Stripe subscription will renew this property. While it
     * does, a property stays active for a grace period after
     * subscriptionEndsAt, as Stripe retries a failed renewal.
     */
    autoRenews: boolean("auto_renews").notNull().default(false),
    /** When the "your cover has ended" email went out; cleared when cover is extended. */
    expiryNoticeSentAt: utcDateTime("expiry_notice_sent_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("properties_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("properties_subscription_ends_at_idx").on(table.subscriptionEndsAt),
    index("properties_created_at_idx").on(table.createdAt),
  ],
);

export const propertyNotes = mysqlTable(
  "property_notes",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    /** Who wrote the note; null if that account has since been deleted. */
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("property_notes_property_id_created_at_idx").on(table.propertyId, table.createdAt)],
);

// ---------------------------------------------------------------------------
// Subscriptions and payments (Stripe Billing)
// ---------------------------------------------------------------------------

/**
 * One Stripe subscription: the properties bought in one checkout, renewed
 * together once a year. Mirrors the Stripe object; Stripe is the source of
 * truth and the webhook keeps this row in step.
 */
export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull(),
    /** Stripe's status: incomplete, active, past_due, canceled, unpaid, ... */
    status: varchar("status", { length: 32 }).notNull(),
    /** True when the whole subscription stops at the end of the current period. */
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    currentPeriodEnd: utcDateTime("current_period_end"),
    canceledAt: utcDateTime("canceled_at"),
    endedAt: utcDateTime("ended_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("subscriptions_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_status_idx").on(table.status),
  ],
);

/** One property in a subscription (one Stripe subscription item), with its yearly price. */
export const subscriptionItems = mysqlTable(
  "subscription_items",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    /** Null if the property has since been deleted; the label keeps the address. */
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
    propertyLabel: varchar("property_label", { length: 500 }).notNull(),
    stripeSubscriptionItemId: varchar("stripe_subscription_item_id", { length: 255 }).notNull(),
    /** Price per year, in cents. */
    unitAmountCents: int("unit_amount_cents", { unsigned: true }).notNull(),
    currency: char("currency", { length: 3 }).notNull().default("usd"),
    /** When renewal was stopped; null while it renews. */
    canceledAt: utcDateTime("canceled_at"),
    /** Who stopped it: the customer, or a staff member. */
    canceledById: uuid("canceled_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("subscription_items_stripe_item_unique").on(table.stripeSubscriptionItemId),
    index("subscription_items_subscription_id_idx").on(table.subscriptionId),
    index("subscription_items_property_id_idx").on(table.propertyId),
  ],
);

export const PAYMENT_STATUSES = ["paid", "failed", "partially_refunded", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** One Stripe invoice: the first payment of a subscription, or a yearly renewal. */
export const payments = mysqlTable(
  "payments",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
    stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }).notNull(),
    /** Found when a refund needs it; Stripe keeps it on the invoice's payments. */
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    /** "subscription_create" for a first payment, "subscription_cycle" for a renewal. */
    billingReason: varchar("billing_reason", { length: 40 }),
    /** Copies of the payer's name and email at payment time. */
    payerName: varchar("payer_name", { length: 150 }).notNull(),
    payerEmail: varchar("payer_email", { length: 255 }).notNull(),
    amountCents: int("amount_cents", { unsigned: true }).notNull(),
    refundedCents: int("refunded_cents", { unsigned: true }).notNull().default(0),
    currency: char("currency", { length: 3 }).notNull().default("usd"),
    status: mysqlEnum("status", PAYMENT_STATUSES).notNull(),
    /** Stripe's page for the invoice and its receipt. */
    receiptUrl: varchar("receipt_url", { length: 2048 }),
    paidAt: utcDateTime("paid_at"),
    receiptEmailSentAt: utcDateTime("receipt_email_sent_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("payments_stripe_invoice_id_unique").on(table.stripeInvoiceId),
    index("payments_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("payments_subscription_id_idx").on(table.subscriptionId),
    index("payments_status_paid_at_idx").on(table.status, table.paidAt),
  ],
);

/** The properties a payment covered, with each one's amount and the period it bought. */
export const paymentItems = mysqlTable(
  "payment_items",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
    propertyLabel: varchar("property_label", { length: 500 }).notNull(),
    amountCents: int("amount_cents", { unsigned: true }).notNull(),
    periodStart: utcDateTime("period_start").notNull(),
    periodEnd: utcDateTime("period_end").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("payment_items_payment_id_idx").on(table.paymentId),
    index("payment_items_property_id_idx").on(table.propertyId),
  ],
);

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------

export const contactMessages = mysqlTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    /** E.164, optional */
    phone: varchar("phone", { length: 20 }),
    message: text("message").notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("contact_messages_created_at_idx").on(table.createdAt)],
);
