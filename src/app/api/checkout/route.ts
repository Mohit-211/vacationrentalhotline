import { checkoutSchema } from "@/lib/schemas/checkout";
import { created, handler, readBody, requireUser } from "@/server/http";
import { startCheckout } from "@/server/services/billing";

/**
 * POST /api/checkout { propertyIds }: starts a yearly subscription for the
 * properties and returns the client secret Stripe.js needs to confirm the
 * first payment. The server sets the price; nothing is charged until the
 * browser confirms.
 */
export const POST = handler(async (request: Request) => {
  const user = await requireUser(request);
  const { propertyIds } = await readBody(request, checkoutSchema);
  return created(await startCheckout(user.id, propertyIds));
});
