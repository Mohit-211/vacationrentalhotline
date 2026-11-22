import { createPropertiesSchema } from "@/lib/schemas/property";
import { created, handler, readBody, requireStaff } from "@/server/http";
import { findCustomer } from "@/server/services/admin/accounts";
import { createUserProperties, parsePropertyBatch } from "@/server/services/properties";

type Context = RouteContext<"/api/admin/customers/[id]/properties">;

/** POST /api/admin/customers/:id/properties { properties: [...] }: adds properties to a customer's account. */
export const POST = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.manage");
  const customer = await findCustomer((await context.params).id);
  const { properties } = await readBody(request, createPropertiesSchema);
  return created(await createUserProperties(customer.id, parsePropertyBatch(properties)));
});
