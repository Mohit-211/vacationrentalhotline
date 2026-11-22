import { handler, notFound, ok, requireStaff } from "@/server/http";
import { getPayment } from "@/server/services/admin/directory";

type Context = RouteContext<"/api/admin/payments/[id]">;

/** GET /api/admin/payments/:id */
export const GET = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.view");
  const payment = await getPayment((await context.params).id);
  if (!payment) throw notFound("Payment");
  return ok(payment);
});
