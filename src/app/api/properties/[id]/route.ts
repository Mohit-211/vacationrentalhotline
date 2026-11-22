import { propertyFieldsSchema, propertyInputSchema } from "@/lib/schemas/property";
import { handler, invalidFields, noContent, notFound, ok, readJson, requireUser, zodFields } from "@/server/http";
import {
  deleteUserProperties,
  editableFields,
  findUserProperty,
  listNotes,
  serializeProperty,
  updateProperty,
} from "@/server/services/properties";

type Context = RouteContext<"/api/properties/[id]">;

const EDITABLE_KEYS = new Set(Object.keys(propertyFieldsSchema.shape));

/** GET /api/properties/:id: one of the user's properties, with its notes. */
export const GET = handler(async (request: Request, context: Context) => {
  const user = await requireUser(request);
  const property = await findUserProperty(user.id, (await context.params).id);
  if (!property) throw notFound("Property");
  return ok({ ...serializeProperty(property), notes: await listNotes(property.id) });
});

/**
 * PATCH /api/properties/:id: changes the fields sent; null or "" clears an
 * optional one. The property as it would be saved must still be valid.
 */
export const PATCH = handler(async (request: Request, context: Context) => {
  const user = await requireUser(request);
  const property = await findUserProperty(user.id, (await context.params).id);
  if (!property) throw notFound("Property");

  const body = await readJson(request);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw invalidFields({ _: ["Send the fields to change as a JSON object."] });
  }
  const unknownKeys = Object.keys(body).filter((key) => !EDITABLE_KEYS.has(key));
  if (unknownKeys.length > 0) {
    throw invalidFields(Object.fromEntries(unknownKeys.map((key) => [key, ["This field doesn't exist or can't be changed."]])));
  }

  const result = propertyInputSchema.safeParse({ ...editableFields(property), ...body });
  if (!result.success) throw invalidFields(zodFields(result.error));
  return ok(serializeProperty(await updateProperty(property.id, result.data)));
});

/** DELETE /api/properties/:id */
export const DELETE = handler(async (request: Request, context: Context) => {
  const user = await requireUser(request);
  const deleted = await deleteUserProperties(user.id, [(await context.params).id]);
  if (deleted === 0) throw notFound("Property");
  return noContent();
});
