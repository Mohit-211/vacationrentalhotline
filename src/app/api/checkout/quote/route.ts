import { checkoutSchema } from "@/lib/schemas/checkout";
import { handler, ok, readBody, requireUser } from "@/server/http";
import { quoteCheckout } from "@/server/services/billing";

/**
 * POST /api/checkout/quote { propertyIds }: the yearly price of covering
 * these properties. 400 CONTACT_US for more than we sell online; 409
 * ALREADY_COVERED if one is still covered.
 */
export const POST = handler(async (request: Request) => {
  const user = await requireUser(request);
  const { propertyIds } = await readBody(request, checkoutSchema);
  return ok(await quoteCheckout(user.id, propertyIds));
});
