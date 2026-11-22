import { handler, noContent, notFound, requireStaff } from "@/server/http";
import { deleteMessage } from "@/server/services/admin/directory";

type Context = RouteContext<"/api/admin/messages/[id]">;

/** DELETE /api/admin/messages/:id */
export const DELETE = handler(async (request: Request, context: Context) => {
  await requireStaff(request, "messages.manage");
  if (!(await deleteMessage((await context.params).id))) throw notFound("Message");
  return noContent();
});
