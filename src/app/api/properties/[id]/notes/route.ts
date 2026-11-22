import { noteInputSchema } from "@/lib/schemas/note";
import { created, handler, notFound, ok, readBody, requireUser } from "@/server/http";
import { createNote, findUserProperty, listNotes } from "@/server/services/properties";

type Context = RouteContext<"/api/properties/[id]/notes">;

/** GET /api/properties/:id/notes: the property's notes, oldest first. */
export const GET = handler(async (request: Request, context: Context) => {
  const user = await requireUser(request);
  const property = await findUserProperty(user.id, (await context.params).id);
  if (!property) throw notFound("Property");
  return ok(await listNotes(property.id));
});

/** POST /api/properties/:id/notes { body } */
export const POST = handler(async (request: Request, context: Context) => {
  const user = await requireUser(request);
  const property = await findUserProperty(user.id, (await context.params).id);
  if (!property) throw notFound("Property");
  const { body } = await readBody(request, noteInputSchema);
  return created(await createNote(property.id, user.id, body));
});
