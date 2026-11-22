import "server-only";
import { and, count, eq, inArray, isNull, ne } from "drizzle-orm";
import Stripe from "stripe";
import { formatAddress } from "@/lib/locations";
import { HOTLINE_PHONE, PRICING, quoteFor, type Quote } from "@/lib/pricing";
import { db } from "@/server/db";
import { paymentItems, payments, properties, subscriptionItems, subscriptions, users } from "@/server/db/schema";
import { sendEmailInBackground } from "@/server/email/send";
import { coverEndedMessage, receiptMessage, staffCoverEndedMessage } from "@/server/email/templates";
import { serverEnv } from "@/server/env";
import { HttpError, notFound } from "@/server/http";
import { COVER_PRODUCT_ID, ensureCoverProduct, fromUnix, fromUnixOrNull, idOf, stripe } from "@/server/stripe";
import { propertyStatus, type PropertyRow } from "./properties";

// Yearly, auto-renewing cover through Stripe Billing. One checkout is one
// Stripe subscription with one item per property, so each property can stop
// renewing on its own. Stripe is the source of truth: the webhook (and the
// sync right after a payment) copy what happened into our tables, and every
// write here is safe to repeat.

type SubscriptionRow = typeof subscriptions.$inferSelect;
type SubscriptionItemRow = typeof subscriptionItems.$inferSelect;

/** Stripe statuses in which the subscription still renews or is being retried. */
const LIVE_STATUSES = ["active", "trialing", "past_due"] as const;
/** Statuses after which nothing renews any more. */
const ENDED_STATUSES = ["canceled", "unpaid", "incomplete_expired"] as const;

const isEnded = (status: string) => (ENDED_STATUSES as readonly string[]).includes(status);

function isDuplicateKey(error: unknown): boolean {
  const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "ER_DUP_ENTRY";
}

// ---- Checkout ------------------------------------------------------------------

/** The user's properties for a checkout: their own, not already covered, and few enough to buy online. */
async function checkoutProperties(userId: string, propertyIds: string[]): Promise<PropertyRow[]> {
  const ids = [...new Set(propertyIds)];
  if (ids.length > PRICING.maxPropertiesOnline) {
    throw new HttpError(
      400,
      "CONTACT_US",
      `For more than ${PRICING.maxPropertiesOnline} properties, please call us at ${HOTLINE_PHONE.display} for pricing.`,
    );
  }
  const rows = await db()
    .select()
    .from(properties)
    .where(and(eq(properties.userId, userId), inArray(properties.id, ids)));
  if (rows.length !== ids.length) throw notFound("Property");
  const covered = rows.find((row) => propertyStatus(row) === "active");
  if (covered) {
    const until = covered.subscriptionEndsAt?.toISOString().slice(0, 10);
    throw new HttpError(409, "ALREADY_COVERED", `${formatAddress(covered)} is already covered until ${until}.`);
  }
  return rows;
}

/** What a checkout of these properties costs per year. */
export async function quoteCheckout(userId: string, propertyIds: string[]): Promise<Quote> {
  const rows = await checkoutProperties(userId, propertyIds);
  return quoteFor(rows.length)!;
}

async function stripeCustomerFor(userId: string): Promise<string> {
  const [user] = await db().select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw notFound("Account");
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe().customers.create(
    { email: user.email, name: user.name, metadata: { userId: user.id } },
    // Two checkouts at once still make one customer.
    { idempotencyKey: `customer-${user.id}` },
  );
  await db().update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, user.id));
  return customer.id;
}

/**
 * Ends checkouts the customer started for these properties and never paid,
 * so a new attempt can't leave two open subscriptions (Stripe would expire
 * them after 23 hours anyway).
 */
async function abandonUnpaidCheckouts(propertyIds: string[]) {
  const open = await db()
    .selectDistinct({ id: subscriptions.id, stripeId: subscriptions.stripeSubscriptionId })
    .from(subscriptionItems)
    .innerJoin(subscriptions, eq(subscriptionItems.subscriptionId, subscriptions.id))
    .where(and(inArray(subscriptionItems.propertyId, propertyIds), eq(subscriptions.status, "incomplete")));
  for (const subscription of open) {
    try {
      await stripe().subscriptions.cancel(subscription.stripeId);
    } catch (error) {
      // Already gone in Stripe; just bring our copy up to date.
      if (!(error instanceof Stripe.errors.StripeInvalidRequestError)) throw error;
    }
    await db()
      .update(subscriptions)
      .set({ status: "incomplete_expired", endedAt: new Date() })
      .where(eq(subscriptions.id, subscription.id));
    await db()
      .update(subscriptionItems)
      .set({ canceledAt: new Date() })
      .where(and(eq(subscriptionItems.subscriptionId, subscription.id), isNull(subscriptionItems.canceledAt)));
  }
}

export interface StartedCheckout {
  subscriptionId: string;
  /** For Stripe.js to confirm the first payment in the browser. */
  clientSecret: string;
  quote: Quote;
}

/**
 * Starts a yearly subscription for the properties. Nothing is charged here:
 * the browser confirms the first payment with the client secret, and the
 * properties become active once Stripe reports the invoice paid.
 */
export async function startCheckout(userId: string, propertyIds: string[]): Promise<StartedCheckout> {
  const rows = await checkoutProperties(userId, propertyIds);
  const quote = quoteFor(rows.length)!;
  await abandonUnpaidCheckouts(rows.map((row) => row.id));
  const customer = await stripeCustomerFor(userId);
  await ensureCoverProduct();

  const created = await stripe().subscriptions.create({
    customer,
    description: `Hotline cover for ${rows.length} ${rows.length === 1 ? "property" : "properties"}`,
    items: rows.map((row) => ({
      price_data: {
        currency: quote.currency,
        product: COVER_PRODUCT_ID,
        unit_amount: quote.unitAmountCents,
        recurring: { interval: "year" },
      },
      metadata: { propertyId: row.id, address: formatAddress(row).slice(0, 500) },
    })),
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription", payment_method_types: ["card"] },
    metadata: { userId },
    expand: ["latest_invoice.confirmation_secret"],
  });

  const invoice = created.latest_invoice as Stripe.Invoice | null;
  const clientSecret = invoice?.confirmation_secret?.client_secret;
  if (!clientSecret) {
    throw new HttpError(502, "PAYMENT_NOT_STARTED", "Stripe didn't start the payment. Please try again.");
  }

  const subscriptionId = crypto.randomUUID();
  const byProperty = new Map(rows.map((row) => [row.id, row]));
  await db().transaction(async (tx) => {
    await tx.insert(subscriptions).values({
      id: subscriptionId,
      userId,
      stripeSubscriptionId: created.id,
      status: created.status,
      currentPeriodEnd: periodEndOf(created),
    });
    await tx.insert(subscriptionItems).values(
      created.items.data.map((item) => {
        const property = byProperty.get(item.metadata.propertyId)!;
        return {
          subscriptionId,
          propertyId: property.id,
          propertyLabel: formatAddress(property).slice(0, 500),
          stripeSubscriptionItemId: item.id,
          unitAmountCents: item.price.unit_amount ?? quote.unitAmountCents,
          currency: item.price.currency,
        };
      }),
    );
  });

  return { subscriptionId, clientSecret, quote };
}

const periodEndOf = (subscription: Stripe.Subscription) => {
  const ends = subscription.items.data.map((item) => item.current_period_end);
  return ends.length > 0 ? fromUnix(Math.max(...ends)) : null;
};

// ---- Keeping our copy in step with Stripe ---------------------------------------

/**
 * Re-reads a subscription and its latest invoice from Stripe and applies
 * them. Called right after the browser confirms a payment, so the
 * properties activate without waiting for the webhook.
 */
export async function syncSubscription(stripeSubscriptionId: string): Promise<void> {
  const subscription = await stripe().subscriptions.retrieve(stripeSubscriptionId, { expand: ["latest_invoice"] });
  await applySubscription(subscription);
  const invoice = subscription.latest_invoice;
  if (invoice && typeof invoice === "object" && invoice.status === "paid") {
    await recordPaidInvoice(invoice);
  }
}

/** Copies a subscription's status, and stops renewal on items it no longer bills. */
export async function applySubscription(subscription: Stripe.Subscription): Promise<void> {
  const [row] = await db()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);
  if (!row) {
    console.warn(`[billing] Ignoring Stripe subscription ${subscription.id}: not created by this app.`);
    return;
  }

  await db()
    .update(subscriptions)
    .set({
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: periodEndOf(subscription) ?? row.currentPeriodEnd,
      canceledAt: fromUnixOrNull(subscription.canceled_at),
      endedAt: fromUnixOrNull(subscription.ended_at),
    })
    .where(eq(subscriptions.id, row.id));

  // Items that stop renewing: all of them once the subscription ends or is
  // set to end, otherwise any Stripe no longer has (removed one by one).
  const billedItemIds = new Set(subscription.items.data.map((item) => item.id));
  const items = await db().select().from(subscriptionItems).where(eq(subscriptionItems.subscriptionId, row.id));
  const stopping = items.filter(
    (item) =>
      isEnded(subscription.status) ||
      subscription.cancel_at_period_end ||
      !billedItemIds.has(item.stripeSubscriptionItemId),
  );
  await stopRenewingItems(stopping);
}

/** Marks items as no longer renewing, and their properties with them. */
async function stopRenewingItems(items: SubscriptionItemRow[], canceledById?: string) {
  const open = items.filter((item) => !item.canceledAt);
  if (open.length > 0) {
    await db()
      .update(subscriptionItems)
      .set({ canceledAt: new Date(), ...(canceledById ? { canceledById } : {}) })
      .where(inArray(subscriptionItems.id, open.map((item) => item.id)));
  }
  const propertyIds = items.map((item) => item.propertyId).filter((id): id is string => Boolean(id));
  if (propertyIds.length > 0) {
    await db().update(properties).set({ autoRenews: false }).where(inArray(properties.id, propertyIds));
  }
}

/**
 * Records a paid invoice (a first payment or a renewal): the payment, what
 * it covered, and each property's new paid-through date. Sends the receipt
 * once. Safe to call again for the same invoice.
 */
export async function recordPaidInvoice(invoice: Stripe.Invoice): Promise<void> {
  const stripeSubscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
  if (!stripeSubscriptionId) return;
  const [subscription] = await db()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  if (!subscription) {
    console.warn(`[billing] Ignoring invoice ${invoice.id}: its subscription wasn't created by this app.`);
    return;
  }
  const items = await db().select().from(subscriptionItems).where(eq(subscriptionItems.subscriptionId, subscription.id));
  const itemsByStripeId = new Map(items.map((item) => [item.stripeSubscriptionItemId, item]));
  const lines = invoice.lines.data.flatMap((line) => {
    const item = itemsByStripeId.get(line.parent?.subscription_item_details?.subscription_item ?? "");
    return item ? [{ item, line }] : [];
  });

  const [user] = subscription.userId
    ? await db().select().from(users).where(eq(users.id, subscription.userId)).limit(1)
    : [];

  const paymentId = await upsertPayment(invoice, subscription, user, "paid");

  await db().transaction(async (tx) => {
    // Lock the payment so a webhook and a sync can't both add its items.
    await tx.select({ id: payments.id }).from(payments).where(eq(payments.id, paymentId)).for("update");
    const recorded = await tx
      .select({ id: paymentItems.id })
      .from(paymentItems)
      .where(eq(paymentItems.paymentId, paymentId))
      .limit(1);
    if (recorded.length === 0 && lines.length > 0) {
      await tx.insert(paymentItems).values(
        lines.map(({ item, line }) => ({
          paymentId,
          propertyId: item.propertyId,
          propertyLabel: item.propertyLabel,
          amountCents: line.amount,
          periodStart: fromUnix(line.period.start),
          periodEnd: fromUnix(line.period.end),
        })),
      );
    }
    for (const { item, line } of lines) {
      if (!item.propertyId) continue;
      const [property] = await tx.select().from(properties).where(eq(properties.id, item.propertyId)).limit(1);
      if (!property) continue;
      const periodEnd = fromUnix(line.period.end);
      const paidThrough =
        property.subscriptionEndsAt && property.subscriptionEndsAt > periodEnd ? property.subscriptionEndsAt : periodEnd;
      await tx
        .update(properties)
        .set({
          subscriptionEndsAt: paidThrough,
          autoRenews: !item.canceledAt && !subscription.cancelAtPeriodEnd,
          expiryNoticeSentAt: null,
        })
        .where(eq(properties.id, property.id));
    }
  });

  // Refunds made later in Stripe's dashboard name only the PaymentIntent.
  await rememberPaymentIntent(paymentId, invoice.id);

  // Claim the receipt before sending it, so a webhook and a sync running at
  // the same moment send one email between them.
  const [claimed] = await db()
    .update(payments)
    .set({ receiptEmailSentAt: new Date() })
    .where(and(eq(payments.id, paymentId), isNull(payments.receiptEmailSentAt)));
  if (claimed.affectedRows === 1 && user) {
    sendEmailInBackground(
      receiptMessage(user.email, user.name, {
        amountCents: invoice.amount_paid,
        renewal: invoice.billing_reason === "subscription_cycle",
        receiptUrl: invoice.hosted_invoice_url ?? null,
        items: lines.map(({ item, line }) => ({
          label: item.propertyLabel,
          amountCents: line.amount,
          paidThrough: fromUnix(line.period.end),
          renews: !item.canceledAt && !subscription.cancelAtPeriodEnd,
        })),
      }),
    );
  }
}

/** Records a renewal or first payment that failed (Stripe retries renewals). */
export async function recordFailedInvoice(invoice: Stripe.Invoice): Promise<void> {
  const stripeSubscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
  if (!stripeSubscriptionId) return;
  const [subscription] = await db()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  if (!subscription) return;
  const [user] = subscription.userId
    ? await db().select().from(users).where(eq(users.id, subscription.userId)).limit(1)
    : [];
  await upsertPayment(invoice, subscription, user, "failed");
}

/** Inserts the payment for an invoice, or updates it; returns its id. A paid payment never goes back to failed. */
async function upsertPayment(
  invoice: Stripe.Invoice,
  subscription: SubscriptionRow,
  user: typeof users.$inferSelect | undefined,
  status: "paid" | "failed",
): Promise<string> {
  const values = {
    userId: subscription.userId,
    subscriptionId: subscription.id,
    stripeInvoiceId: invoice.id,
    billingReason: invoice.billing_reason,
    payerName: user?.name ?? invoice.customer_name ?? "Unknown",
    payerEmail: user?.email ?? invoice.customer_email ?? "unknown",
    amountCents: status === "paid" ? invoice.amount_paid : invoice.amount_due,
    currency: invoice.currency,
    status,
    receiptUrl: invoice.hosted_invoice_url ?? null,
    paidAt: status === "paid" ? fromUnixOrNull(invoice.status_transitions.paid_at) ?? new Date() : null,
  } as const;

  const [existing] = await db().select().from(payments).where(eq(payments.stripeInvoiceId, invoice.id)).limit(1);
  if (existing) {
    if (status === "paid" || existing.status === "failed") {
      await db().update(payments).set(values).where(eq(payments.id, existing.id));
    }
    return existing.id;
  }
  const id = crypto.randomUUID();
  try {
    await db().insert(payments).values({ id, ...values });
    return id;
  } catch (error) {
    // The webhook and a sync recorded it at the same moment.
    if (!isDuplicateKey(error)) throw error;
    const [row] = await db().select().from(payments).where(eq(payments.stripeInvoiceId, invoice.id)).limit(1);
    return row!.id;
  }
}

/** Stores the PaymentIntent that paid an invoice, when Stripe can say (best effort). */
async function rememberPaymentIntent(paymentId: string, stripeInvoiceId: string) {
  try {
    const [payment] = await db().select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment || payment.stripePaymentIntentId) return;
    const paymentIntent = await paymentIntentOf(stripeInvoiceId);
    if (paymentIntent) await db().update(payments).set({ stripePaymentIntentId: paymentIntent }).where(eq(payments.id, paymentId));
  } catch (error) {
    console.warn(`[billing] Couldn't look up the PaymentIntent of invoice ${stripeInvoiceId}`, error);
  }
}

/** Copies a refund made in Stripe's dashboard (or by the app) onto the payment. */
export async function recordRefund(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = idOf(charge.payment_intent);
  if (!paymentIntentId) return;
  let [payment] = await db()
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, paymentIntentId))
    .limit(1);
  if (!payment) {
    // Not stored yet: ask Stripe which invoice that PaymentIntent paid.
    const list = await stripe().invoicePayments.list({
      payment: { type: "payment_intent", payment_intent: paymentIntentId },
      limit: 1,
    });
    const invoiceId = idOf(list.data[0]?.invoice);
    if (!invoiceId) return;
    [payment] = await db().select().from(payments).where(eq(payments.stripeInvoiceId, invoiceId)).limit(1);
    if (!payment) return;
    await db().update(payments).set({ stripePaymentIntentId: paymentIntentId }).where(eq(payments.id, payment.id));
  }
  const refunded = Math.min(charge.amount_refunded, payment.amountCents);
  await db()
    .update(payments)
    .set({
      refundedCents: refunded,
      status: refunded >= payment.amountCents ? "refunded" : refunded > 0 ? "partially_refunded" : payment.status,
    })
    .where(eq(payments.id, payment.id));
}

/** The PaymentIntent that paid an invoice, which a refund needs. */
async function paymentIntentOf(stripeInvoiceId: string): Promise<string | null> {
  const list = await stripe().invoicePayments.list({ invoice: stripeInvoiceId, limit: 10 });
  const paid = list.data.find((entry) => entry.status === "paid") ?? list.data[0];
  return idOf(paid?.payment.payment_intent) ?? null;
}

// ---- Stopping renewal ----------------------------------------------------------

/** The subscription item that renews a property, if any. */
async function renewingItem(propertyId: string) {
  const [match] = await db()
    .select({ item: subscriptionItems, subscription: subscriptions })
    .from(subscriptionItems)
    .innerJoin(subscriptions, eq(subscriptionItems.subscriptionId, subscriptions.id))
    .where(
      and(
        eq(subscriptionItems.propertyId, propertyId),
        isNull(subscriptionItems.canceledAt),
        inArray(subscriptions.status, [...LIVE_STATUSES]),
      ),
    )
    .limit(1);
  return match;
}

/**
 * Stops a property renewing. It stays covered until the end of the year
 * already paid; nothing is refunded. Customers and staff can both do this.
 */
export async function stopRenewal(property: PropertyRow, actorId: string): Promise<void> {
  const match = await renewingItem(property.id);
  if (!match) throw new HttpError(409, "NOT_RENEWING", "This property doesn't renew automatically.");
  const { item, subscription } = match;

  const others = await db()
    .select({ id: subscriptionItems.id })
    .from(subscriptionItems)
    .where(
      and(
        eq(subscriptionItems.subscriptionId, subscription.id),
        isNull(subscriptionItems.canceledAt),
        ne(subscriptionItems.id, item.id),
      ),
    );
  if (others.length > 0) {
    // Other properties keep renewing: take this one off the subscription,
    // without a credit, so the next renewal no longer bills it.
    await stripe().subscriptionItems.del(item.stripeSubscriptionItemId, { proration_behavior: "none" });
  } else {
    await stripe().subscriptions.update(subscription.stripeSubscriptionId, { cancel_at_period_end: true });
    await db().update(subscriptions).set({ cancelAtPeriodEnd: true }).where(eq(subscriptions.id, subscription.id));
  }
  await stopRenewingItems([item], actorId);
}

/**
 * Staff only: ends a property's cover at once and stops its renewal. Nothing
 * is refunded here: refunds are made by hand in Stripe's dashboard, and the
 * webhook (charge.refunded) records them on the payment.
 */
export async function endCoverNow(property: PropertyRow, actorId: string): Promise<void> {
  if (property.complimentary) {
    throw new HttpError(409, "COVERED_FREE", "This property is covered free. To end that, remove the customer's free cover.");
  }
  const match = await renewingItem(property.id);
  // Without this, the cover-ended email would go out for cover that never existed.
  if (!match && propertyStatus(property) !== "active") {
    throw new HttpError(409, "NOT_COVERED", "This property isn't covered.");
  }
  if (match) {
    const { item, subscription } = match;
    const others = await db()
      .select({ id: subscriptionItems.id })
      .from(subscriptionItems)
      .where(
        and(
          eq(subscriptionItems.subscriptionId, subscription.id),
          isNull(subscriptionItems.canceledAt),
          ne(subscriptionItems.id, item.id),
        ),
      );
    if (others.length > 0) {
      await stripe().subscriptionItems.del(item.stripeSubscriptionItemId, { proration_behavior: "none" });
    } else {
      await stripe().subscriptions.cancel(subscription.stripeSubscriptionId, { prorate: false });
    }
    await stopRenewingItems([item], actorId);
  }
  // The scheduled job then emails the customer (and staff) that cover ended.
  await db()
    .update(properties)
    .set({ subscriptionEndsAt: new Date(), autoRenews: false, expiryNoticeSentAt: null })
    .where(eq(properties.id, property.id));
}

// ---- Free cover ------------------------------------------------------------------

/**
 * Staff: gives a customer free cover for up to `limit` properties. Every
 * property they have or add is covered at no charge, and they can't have
 * more than `limit`. Paid subscriptions they already have keep renewing
 * until someone cancels them.
 */
export async function setFreeCover(customerId: string, limit: number): Promise<void> {
  await db().transaction(async (tx) => {
    // The same lock as adding properties, so none slip in past the limit.
    await tx.select({ id: users.id }).from(users).where(eq(users.id, customerId)).for("update");
    const [{ existing }] = await tx.select({ existing: count() }).from(properties).where(eq(properties.userId, customerId));
    if (existing > limit) {
      throw new HttpError(
        409,
        "TOO_MANY_PROPERTIES",
        `This customer already has ${existing} properties. Allow at least ${existing}, or delete some first.`,
        { properties: [`Allow at least ${existing}.`] },
      );
    }
    await tx.update(users).set({ freeCoverLimit: limit }).where(eq(users.id, customerId));
    await tx
      .update(properties)
      .set({ complimentary: true, expiryNoticeSentAt: null })
      .where(eq(properties.userId, customerId));
  });
}

/**
 * Staff: ends a customer's free cover. Their properties need paying for
 * again; those no longer covered by a payment become inactive at once, and
 * the customer (with a copy to staff) is told.
 */
export async function removeFreeCover(customerId: string): Promise<{ uncovered: number }> {
  const now = new Date();
  const { customer, uncovered } = await db().transaction(async (tx) => {
    const [customer] = await tx.select().from(users).where(eq(users.id, customerId)).for("update");
    if (!customer) throw notFound("Customer");
    // Otherwise the customer would be told cover ended on properties that were never free.
    if (customer.freeCoverLimit === null) throw new HttpError(409, "NO_FREE_COVER", "This customer doesn't have free cover.");
    await tx.update(users).set({ freeCoverLimit: null }).where(eq(users.id, customerId));
    await tx.update(properties).set({ complimentary: false }).where(eq(properties.userId, customerId));

    const uncovered = (await tx.select().from(properties).where(eq(properties.userId, customerId))).filter(
      (row) => propertyStatus(row, now) === "inactive",
    );
    if (uncovered.length > 0) {
      await tx
        .update(properties)
        .set({ expiryNoticeSentAt: now })
        .where(inArray(properties.id, uncovered.map((row) => row.id)));
    }
    return { customer, uncovered };
  });
  if (uncovered.length > 0) {
    const items = uncovered.map((row) => ({ label: formatAddress(row), endedAt: now }));
    sendEmailInBackground(coverEndedMessage(customer.email, customer.name, items));
    sendEmailInBackground(staffCoverEndedMessage(serverEnv().STAFF_EMAIL, customer, items));
  }
  return { uncovered: uncovered.length };
}

/** Whether the user owns a subscription (for the post-payment sync). */
export async function findUserSubscription(userId: string, subscriptionId: string) {
  const [row] = await db()
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)))
    .limit(1);
  return row;
}
