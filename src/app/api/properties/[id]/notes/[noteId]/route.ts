import { noteInputSchema } from "@/lib/schemas/note";
import { handler, noContent, notFound, ok, readBody, requireUser, type SessionUser } from "@/server/http";
import { deleteNote, findNote, findUserProperty, serializeNote, updateNote } from "@/server/services/properties";

type Context = RouteContext<"/api/properties/[id]/notes/[noteId]">;

/** The note, if it belongs to one of the user's properties. */
async function findUserNote(user: SessionUser, context: Context) {
  const { id, noteId } = await context.params;
  const property = await findUserProperty(user.id, id);
  const note = property ? await findNote(property.id, noteId) : undefined;
  if (!note) throw notFound("Note");
  return note;
}

/** GET /api/properties/:id/notes/:noteId */
export const GET = handler(async (request: Request, context: Context) => {
  const note = await findUserNote(await requireUser(request), context);
  return ok(serializeNote(note));
});

/** PATCH /api/properties/:id/notes/:noteId { body } */
export const PATCH = handler(async (request: Request, context: Context) => {
  const note = await findUserNote(await requireUser(request), context);
  const { body } = await readBody(request, noteInputSchema);
  return ok(await updateNote(note.id, body));
});

/** DELETE /api/properties/:id/notes/:noteId */
export const DELETE = handler(async (request: Request, context: Context) => {
  const note = await findUserNote(await requireUser(request), context);
  await deleteNote(note.id);
  return noContent();
});
