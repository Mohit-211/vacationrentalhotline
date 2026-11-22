import { noteInputSchema } from "@/lib/schemas/note";
import { created, handler, notFound, ok, readBody, requireStaff } from "@/server/http";
import { findProperty } from "@/server/services/admin/directory";
import { createNote, listNotes } from "@/server/services/properties";

type Context = RouteContext<"/api/admin/properties/[id]/notes">;

async function propertyFrom(context: Context) {
  const property = await findProperty((await context.params).id);
  if (!property) throw notFound("Property");
  return property;
}

/** GET /api/admin/properties/:id/notes: oldest first. */
export const GET = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.view");
  return ok(await listNotes((await propertyFrom(context)).id));
});

/** POST /api/admin/properties/:id/notes { body }: a note written by the signed-in staff member. */
export const POST = handler(async (request: Request, context: Context) => {
  const staff = await requireStaff(request, "customers.manage");
  const property = await propertyFrom(context);
  const { body } = await readBody(request, noteInputSchema);
  return created(await createNote(property.id, staff.user.id, body));
});
