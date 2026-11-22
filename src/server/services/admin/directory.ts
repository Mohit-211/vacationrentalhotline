import "server-only";
import { and, asc, count, desc, eq, inArray, like, ne, or, sql, type SQL } from "drizzle-orm";
import { CUSTOMER_ROLE } from "@/lib/permissions";
import { db } from "@/server/db";
import {
  contactMessages,
  paymentItems,
  payments,
  properties,
  propertyNotes,
  signInEvents,
  subscriptionItems,
  subscriptions,
  users,
} from "@/server/db/schema";
import type { PageRequest } from "@/server/http";
import {
  serializeProperty,
  statusCondition,
  type PropertyRow,
  type PropertyStatus,
} from "@/server/services/properties";

// Read models for the admin panel: searchable, paged lists and detail views.

type UserRow = typeof users.$inferSelect;
type PaymentRow = typeof payments.$inferSelect;

/** "%term%" for LIKE, with LIKE's own wildcards escaped. */
const contains = (term: string) => `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const iso = (date: Date | null) => date?.toISOString() ?? null;

// ---- Customers -------------------------------------------------------------------

export function serializeCustomer(user: UserRow, counts?: { total: number; active: number }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    phone: user.phone,
    streetAddress: user.streetAddress,
    city: user.city,
    regionCode: user.regionCode,
    countryCode: user.countryCode,
    postalCode: user.postalCode,
    createdAt: user.createdAt.toISOString(),
    ...(counts ? { properties: counts } : {}),
  };
}

export async function listCustomers(search: string | null, page: PageRequest) {
  const now = new Date();
  const term = search ? contains(search) : null;
  const where = and(
    eq(users.role, CUSTOMER_ROLE),
    term ? or(like(users.name, term), like(users.email, term), like(users.phone, term)) : undefined,
  );
  const totalProperties = sql<number>`(SELECT COUNT(*) FROM ${properties} WHERE ${properties.userId} = ${users.id})`;
  const activeProperties = sql<number>`(SELECT COUNT(*) FROM ${properties} WHERE ${properties.userId} = ${users.id} AND ${statusCondition("active", now)})`;
  const [rows, [{ total }]] = await Promise.all([
    db()
      .select({ user: users, totalProperties, activeProperties })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(page.pageSize)
      .offset(page.offset),
    db().select({ total: count() }).from(users).where(where),
  ]);
  return {
    data: rows.map((row) =>
      serializeCustomer(row.user, { total: Number(row.totalProperties), active: Number(row.activeProperties) }),
    ),
    total,
  };
}

// ---- Payments --------------------------------------------------------------------

async function itemsByPayment(paymentIds: string[]) {
  if (paymentIds.length === 0) return new Map<string, (typeof paymentItems.$inferSelect)[]>();
  const rows = await db()
    .select()
    .from(paymentItems)
    .where(inArray(paymentItems.paymentId, paymentIds))
    .orderBy(asc(paymentItems.propertyLabel));
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) grouped.set(row.paymentId, [...(grouped.get(row.paymentId) ?? []), row]);
  return grouped;
}

export function serializePayment(payment: PaymentRow, items: (typeof paymentItems.$inferSelect)[] = []) {
  return {
    id: payment.id,
    customerId: payment.userId,
    payerName: payment.payerName,
    payerEmail: payment.payerEmail,
    status: payment.status,
    /** "subscription_create" (first payment) or "subscription_cycle" (renewal). */
    billingReason: payment.billingReason,
    amountCents: payment.amountCents,
    refundedCents: payment.refundedCents,
    currency: payment.currency,
    receiptUrl: payment.receiptUrl,
    paidAt: iso(payment.paidAt),
    createdAt: payment.createdAt.toISOString(),
    stripeInvoiceId: payment.stripeInvoiceId,
    items: items.map((item) => ({
      propertyId: item.propertyId,
      propertyLabel: item.propertyLabel,
      amountCents: item.amountCents,
      periodStart: item.periodStart.toISOString(),
      periodEnd: item.periodEnd.toISOString(),
    })),
  };
}

export async function listPayments(
  filters: { search: string | null; status: string | null; customerId: string | null },
  page: PageRequest,
) {
  const term = filters.search ? contains(filters.search) : null;
  const where = and(
    term ? or(like(payments.payerName, term), like(payments.payerEmail, term), like(payments.stripeInvoiceId, term)) : undefined,
    filters.status ? eq(payments.status, filters.status as PaymentRow["status"]) : undefined,
    filters.customerId ? eq(payments.userId, filters.customerId) : undefined,
  );
  const [rows, [{ total }]] = await Promise.all([
    db().select().from(payments).where(where).orderBy(desc(payments.createdAt)).limit(page.pageSize).offset(page.offset),
    db().select({ total: count() }).from(payments).where(where),
  ]);
  const items = await itemsByPayment(rows.map((row) => row.id));
  return { data: rows.map((row) => serializePayment(row, items.get(row.id))), total };
}

export async function getPayment(paymentId: string) {
  const [row] = await db().select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!row) return undefined;
  const items = await itemsByPayment([row.id]);
  return serializePayment(row, items.get(row.id));
}

// ---- Customer detail ----------------------------------------------------------------

export async function getCustomerDetail(user: UserRow) {
  const now = new Date();
  const [propertyRows, paymentRows] = await Promise.all([
    db().select().from(properties).where(eq(properties.userId, user.id)).orderBy(desc(properties.createdAt)),
    db().select().from(payments).where(eq(payments.userId, user.id)).orderBy(desc(payments.createdAt)),
  ]);
  const items = await itemsByPayment(paymentRows.map((row) => row.id));
  return {
    ...serializeCustomer(user),
    properties: propertyRows.map((row) => serializeProperty(row, now)),
    payments: paymentRows.map((row) => serializePayment(row, items.get(row.id))),
  };
}

// ---- Properties --------------------------------------------------------------------

const customerSummary = (user: Pick<UserRow, "id" | "name" | "email"> | null) =>
  user ? { id: user.id, name: user.name, email: user.email } : null;

export async function listAllProperties(
  filters: { search: string | null; status: PropertyStatus | null; customerId: string | null },
  page: PageRequest,
) {
  const now = new Date();
  const term = filters.search ? contains(filters.search) : null;
  const where = and(
    term
      ? or(
          like(properties.ownerName, term),
          like(properties.ownerEmail, term),
          like(properties.ownerAltEmail, term),
          like(properties.ownerPhone, term),
          like(properties.addressLine1, term),
          like(properties.city, term),
          like(properties.postalCode, term),
          like(users.name, term),
          like(users.email, term),
        )
      : undefined,
    filters.status ? statusCondition(filters.status, now) : undefined,
    filters.customerId ? eq(properties.userId, filters.customerId) : undefined,
  );
  const [rows, [{ total }]] = await Promise.all([
    db()
      .select({ property: properties, customer: { id: users.id, name: users.name, email: users.email } })
      .from(properties)
      .innerJoin(users, eq(properties.userId, users.id))
      .where(where)
      .orderBy(desc(properties.createdAt))
      .limit(page.pageSize)
      .offset(page.offset),
    db()
      .select({ total: count() })
      .from(properties)
      .innerJoin(users, eq(properties.userId, users.id))
      .where(where),
  ]);
  return {
    data: rows.map((row) => ({ ...serializeProperty(row.property, now), customer: customerSummary(row.customer) })),
    total,
  };
}

export async function findProperty(propertyId: string): Promise<PropertyRow | undefined> {
  const [row] = await db().select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  return row;
}

/** A property with its customer, notes (and who wrote them), renewal and payment history. */
export async function getPropertyDetail(property: PropertyRow) {
  const [[owner], notes, [renewal], history] = await Promise.all([
    db().select().from(users).where(eq(users.id, property.userId)).limit(1),
    db()
      .select({ note: propertyNotes, author: { id: users.id, name: users.name, role: users.role } })
      .from(propertyNotes)
      .leftJoin(users, eq(propertyNotes.authorId, users.id))
      .where(eq(propertyNotes.propertyId, property.id))
      .orderBy(asc(propertyNotes.createdAt)),
    db()
      .select({ item: subscriptionItems, subscription: subscriptions })
      .from(subscriptionItems)
      .innerJoin(subscriptions, eq(subscriptionItems.subscriptionId, subscriptions.id))
      .where(eq(subscriptionItems.propertyId, property.id))
      .orderBy(desc(subscriptionItems.createdAt))
      .limit(1),
    db()
      .select({ item: paymentItems, payment: payments })
      .from(paymentItems)
      .innerJoin(payments, eq(paymentItems.paymentId, payments.id))
      .where(eq(paymentItems.propertyId, property.id))
      .orderBy(desc(paymentItems.periodEnd)),
  ]);
  return {
    ...serializeProperty(property),
    customer: customerSummary(owner ?? null),
    notes: notes.map(({ note, author }) => ({
      id: note.id,
      body: note.body,
      author: author?.id ? { id: author.id, name: author.name, staff: author.role !== CUSTOMER_ROLE } : null,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    })),
    /** The latest subscription item for this property (renewing or not). */
    subscription: renewal
      ? {
          id: renewal.subscription.id,
          status: renewal.subscription.status,
          stripeSubscriptionId: renewal.subscription.stripeSubscriptionId,
          unitAmountCents: renewal.item.unitAmountCents,
          renews: !renewal.item.canceledAt && !renewal.subscription.cancelAtPeriodEnd,
          canceledAt: iso(renewal.item.canceledAt),
        }
      : null,
    payments: history.map(({ item, payment }) => ({
      paymentId: payment.id,
      status: payment.status,
      amountCents: item.amountCents,
      periodStart: item.periodStart.toISOString(),
      periodEnd: item.periodEnd.toISOString(),
      paidAt: iso(payment.paidAt),
      receiptUrl: payment.receiptUrl,
    })),
  };
}

// ---- Contact messages -------------------------------------------------------------

export async function listMessages(search: string | null, page: PageRequest) {
  const term = search ? contains(search) : null;
  const where = term
    ? or(
        like(contactMessages.name, term),
        like(contactMessages.email, term),
        like(contactMessages.phone, term),
        like(contactMessages.message, term),
      )
    : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db().select().from(contactMessages).where(where).orderBy(desc(contactMessages.createdAt)).limit(page.pageSize).offset(page.offset),
    db().select({ total: count() }).from(contactMessages).where(where),
  ]);
  return {
    data: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    total,
  };
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  const [result] = await db().delete(contactMessages).where(eq(contactMessages.id, messageId));
  return result.affectedRows > 0;
}

// ---- Staff -------------------------------------------------------------------------

export const serializeStaff = (user: UserRow) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
});

export async function listStaff() {
  const rows = await db().select().from(users).where(ne(users.role, CUSTOMER_ROLE)).orderBy(asc(users.name));
  return rows.map(serializeStaff);
}

// ---- Sign-in history ---------------------------------------------------------------

export async function listSignIns(
  filters: { userId: string | null; audience: "customers" | "staff" | null },
  page: PageRequest,
) {
  const conditions: (SQL | undefined)[] = [
    filters.userId ? eq(signInEvents.userId, filters.userId) : undefined,
    filters.audience === "customers" ? eq(users.role, CUSTOMER_ROLE) : undefined,
    filters.audience === "staff" ? ne(users.role, CUSTOMER_ROLE) : undefined,
  ];
  const where = and(...conditions);
  const [rows, [{ total }]] = await Promise.all([
    db()
      .select({ event: signInEvents, user: { id: users.id, name: users.name, email: users.email, role: users.role } })
      .from(signInEvents)
      .innerJoin(users, eq(signInEvents.userId, users.id))
      .where(where)
      .orderBy(desc(signInEvents.signedInAt))
      .limit(page.pageSize)
      .offset(page.offset),
    db().select({ total: count() }).from(signInEvents).innerJoin(users, eq(signInEvents.userId, users.id)).where(where),
  ]);
  return {
    data: rows.map(({ event, user }) => ({
      id: event.id,
      user,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      signedInAt: event.signedInAt.toISOString(),
      signedOutAt: iso(event.signedOutAt),
    })),
    total,
  };
}
