import "server-only";
import { and, count, desc, eq, gte, inArray, sql, sum } from "drizzle-orm";
import { CUSTOMER_ROLE } from "@/lib/permissions";
import { db } from "@/server/db";
import { contactMessages, payments, properties, users } from "@/server/db/schema";
import { statusCondition } from "@/server/services/properties";

// The admin dashboard's figures for the last `days` days, plus totals.

const COUNTED = ["paid", "partially_refunded", "refunded"] as const;

export async function dashboardStats(days: number) {
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const net = sql<string>`COALESCE(SUM(${payments.amountCents} - ${payments.refundedCents}), 0)`;
  const active = statusCondition("active", now);
  const isCustomer = eq(users.role, CUSTOMER_ROLE);
  const day = (column: unknown) => sql<string>`DATE_FORMAT(${column}, '%Y-%m-%d')`;

  const [
    [customersTotal],
    [customersNew],
    [propertiesTotal],
    [propertiesActive],
    [propertiesNew],
    activeByCountry,
    [revenueTotal],
    [revenuePeriod],
    [messagesTotal],
    [messagesNew],
    topCustomers,
    newCustomersByDay,
    newPropertiesByDay,
    revenueByDay,
  ] = await Promise.all([
    db().select({ n: count() }).from(users).where(isCustomer),
    db().select({ n: count() }).from(users).where(and(isCustomer, gte(users.createdAt, since))),
    db().select({ n: count() }).from(properties),
    db().select({ n: count() }).from(properties).where(active),
    db().select({ n: count() }).from(properties).where(gte(properties.createdAt, since)),
    db()
      .select({ countryCode: properties.countryCode, active: count() })
      .from(properties)
      .where(active)
      .groupBy(properties.countryCode),
    db().select({ cents: net }).from(payments).where(inArray(payments.status, [...COUNTED])),
    db()
      .select({ cents: net, payments: count() })
      .from(payments)
      .where(and(inArray(payments.status, [...COUNTED]), gte(payments.paidAt, since))),
    db().select({ n: count() }).from(contactMessages),
    db().select({ n: count() }).from(contactMessages).where(gte(contactMessages.createdAt, since)),
    db()
      .select({ id: users.id, name: users.name, email: users.email, activeProperties: count() })
      .from(properties)
      .innerJoin(users, eq(properties.userId, users.id))
      .where(active)
      .groupBy(users.id, users.name, users.email)
      .orderBy(desc(count()))
      .limit(5),
    db()
      .select({ date: day(users.createdAt), n: count() })
      .from(users)
      .where(and(isCustomer, gte(users.createdAt, since)))
      .groupBy(day(users.createdAt)),
    db()
      .select({ date: day(properties.createdAt), n: count() })
      .from(properties)
      .where(gte(properties.createdAt, since))
      .groupBy(day(properties.createdAt)),
    db()
      .select({ date: day(payments.paidAt), cents: sum(sql`${payments.amountCents} - ${payments.refundedCents}`) })
      .from(payments)
      .where(and(inArray(payments.status, [...COUNTED]), gte(payments.paidAt, since)))
      .groupBy(day(payments.paidAt)),
  ]);

  // One entry per day (UTC), oldest first, with zeros where nothing happened.
  const perDay = new Map<string, { newCustomers: number; newProperties: number; revenueCents: number }>();
  for (let t = since.getTime(); t <= now.getTime(); t += 24 * 60 * 60 * 1000) {
    perDay.set(new Date(t).toISOString().slice(0, 10), { newCustomers: 0, newProperties: 0, revenueCents: 0 });
  }
  for (const row of newCustomersByDay) {
    const entry = perDay.get(row.date);
    if (entry) entry.newCustomers = row.n;
  }
  for (const row of newPropertiesByDay) {
    const entry = perDay.get(row.date);
    if (entry) entry.newProperties = row.n;
  }
  for (const row of revenueByDay) {
    const entry = perDay.get(row.date);
    if (entry) entry.revenueCents = Number(row.cents ?? 0);
  }

  return {
    days,
    since: since.toISOString(),
    customers: { total: customersTotal.n, new: customersNew.n },
    properties: {
      total: propertiesTotal.n,
      active: propertiesActive.n,
      new: propertiesNew.n,
      activeByCountry: activeByCountry.map((row) => ({ countryCode: row.countryCode, active: row.active })),
    },
    revenue: {
      totalCents: Number(revenueTotal.cents),
      periodCents: Number(revenuePeriod.cents),
      periodPayments: revenuePeriod.payments,
    },
    messages: { total: messagesTotal.n, new: messagesNew.n },
    topCustomers,
    daily: [...perDay].map(([date, values]) => ({ date, ...values })),
  };
}
