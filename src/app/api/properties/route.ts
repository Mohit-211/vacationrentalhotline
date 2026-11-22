import { z } from "zod";
import { createPropertiesSchema, propertyInputSchema, type PropertyValues } from "@/lib/schemas/property";
import { created, handler, invalidFields, ok, readBody, requireUser, zodFields } from "@/server/http";
import {
  createUserProperties,
  deleteUserProperties,
  listUserProperties,
  PROPERTY_STATUSES,
  type PropertyStatus,
} from "@/server/services/properties";

const isStatus = (value: string): value is PropertyStatus => (PROPERTY_STATUSES as readonly string[]).includes(value);

/** GET /api/properties?status=active|inactive: the signed-in user's properties, newest first. */
export const GET = handler(async (request: Request) => {
  const user = await requireUser(request);
  const status = new URL(request.url).searchParams.get("status");
  if (status !== null && !isStatus(status)) {
    throw invalidFields({ status: ['Use "active" or "inactive".'] });
  }
  return ok(await listUserProperties(user.id, status ?? undefined));
});

/**
 * POST /api/properties { properties: [...] }: adds 1 to 500 properties (the
 * form or a CSV import). Every one must be valid, or none is saved; errors
 * name the row, e.g. "properties.3.ownerEmail".
 */
export const POST = handler(async (request: Request) => {
  const user = await requireUser(request);
  const { properties } = await readBody(request, createPropertiesSchema);
  const values: PropertyValues[] = [];
  let fields: Record<string, string[]> = {};
  properties.forEach((item, index) => {
    const result = propertyInputSchema.safeParse(item);
    if (result.success) values.push(result.data);
    else fields = { ...fields, ...zodFields(result.error, ["properties", index]) };
  });
  if (Object.keys(fields).length > 0) throw invalidFields(fields);
  return created(await createUserProperties(user.id, values));
});

const deleteSchema = z.object({
  ids: z.array(z.uuid("Invalid property id.")).min(1, "Choose at least one property.").max(500),
});

/** DELETE /api/properties { ids: [...] }: deletes those of the listed properties the user owns. */
export const DELETE = handler(async (request: Request) => {
  const user = await requireUser(request);
  const { ids } = await readBody(request, deleteSchema);
  return ok({ deleted: await deleteUserProperties(user.id, ids) });
});
