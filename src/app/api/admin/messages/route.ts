import { handler, paged, readPage, requireStaff } from "@/server/http";
import { listMessages } from "@/server/services/admin/directory";

/** GET /api/admin/messages?search=&page=: contact-form messages, newest first. */
export const GET = handler(async (request: Request) => {
  await requireStaff(request, "messages.view");
  const page = readPage(request);
  const { data, total } = await listMessages(new URL(request.url).searchParams.get("search"), page);
  return paged(data, total, page);
});
