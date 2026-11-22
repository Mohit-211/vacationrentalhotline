import { noteInputSchema } from "@/lib/schemas/note";
import { handler, noContent, notFound, ok, readBody, requireStaff } from "@/server/http";
import { deleteNote, findNote, updateNote } from "@/server/services/properties";

type Context = RouteContext<"/api/admin/properties/[id]/notes/[noteId]">;

async function noteFrom(context: Context) {
  const { id, noteId } = await context.params;
  const note = await findNote(id, noteId);
  if (!note) throw notFound("Note");
  return note;
}

/** PATCH /api/admin/properties/:id/notes/:noteId { body } */
export const PATCH = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.manage");
  const note = await noteFrom(context);
  const { body } = await readBody(request, noteInputSchema);
  return ok(await updateNote(note.id, body));
});

/** DELETE /api/admin/properties/:id/notes/:noteId */
export const DELETE = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "customers.manage");
  await deleteNote((await noteFrom(context)).id);
  return noContent();
});
