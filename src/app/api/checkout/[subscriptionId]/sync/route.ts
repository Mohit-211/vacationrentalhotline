import { handler, notFound, ok, requireUser } from "@/server/http";
import { findUserSubscription, syncSubscription } from "@/server/services/billing";
import { listUserProperties } from "@/server/services/properties";

type Context = RouteContext<"/api/checkout/[subscriptionId]/sync">;

/**
 * POST /api/checkout/:subscriptionId/sync: called after the browser confirms
 * a payment. Reads the subscription from Stripe and applies it, so the
 * properties activate without waiting for the webhook. Returns the user's
 * properties.
 */
export const POST = handler(async (request: Request, context: Context) => {
  const user = await requireUser(request);
  const subscription = await findUserSubscription(user.id, (await context.params).subscriptionId);
  if (!subscription) throw notFound("Subscription");
  await syncSubscription(subscription.stripeSubscriptionId);
  return ok(await listUserProperties(user.id));
});
