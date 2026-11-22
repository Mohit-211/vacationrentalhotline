import type Stripe from "stripe";
import { serverEnv } from "@/server/env";
import { applySubscription, recordFailedInvoice, recordPaidInvoice, recordRefund } from "@/server/services/billing";
import { stripe } from "@/server/stripe";

/**
 * POST /api/webhooks/stripe: Stripe's events about subscriptions, invoices
 * and refunds. Every event is signed; anything unsigned or wrongly signed is
 * refused. Handlers are safe to repeat, as Stripe may deliver an event more
 * than once. A failure answers 500 so Stripe tries again later.
 *
 * Subscribe the endpoint to: invoice.paid, invoice.payment_failed,
 * customer.subscription.created, customer.subscription.updated,
 * customer.subscription.deleted, charge.refunded.
 */
export async function POST(request: Request) {
  const secret = serverEnv().STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: { code: "WEBHOOK_NOT_CONFIGURED", message: "STRIPE_WEBHOOK_SECRET is not set." } }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return Response.json({ error: { code: "INVALID_SIGNATURE", message: "The event's signature is invalid." } }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "invoice.paid":
        await recordPaidInvoice(event.data.object);
        break;
      case "invoice.payment_failed":
        await recordFailedInvoice(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applySubscription(event.data.object);
        break;
      case "charge.refunded":
        await recordRefund(event.data.object);
        break;
      default:
        // Not an event this app acts on.
        break;
    }
  } catch (error) {
    console.error(`[stripe] Handling ${event.type} (${event.id}) failed`, error);
    return Response.json({ error: { code: "HANDLER_FAILED", message: "Processing failed; Stripe will retry." } }, { status: 500 });
  }
  return Response.json({ received: true });
}
