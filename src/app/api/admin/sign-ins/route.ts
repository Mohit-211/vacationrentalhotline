import { handler, invalidFields, paged, readPage, requireStaff } from "@/server/http";
import { listSignIns } from "@/server/services/admin/directory";

/**
 * GET /api/admin/sign-ins?userId=&audience=customers|staff&page=: the sign-in
 * history, newest first, with when each session ended.
 */
export const GET = handler(async (request: Request) => {
  await requireStaff(request, "activity.view");
  const params = new URL(request.url).searchParams;
  const audience = params.get("audience");
  if (audience && audience !== "customers" && audience !== "staff") {
    throw invalidFields({ audience: ['Use "customers" or "staff".'] });
  }
  const page = readPage(request);
  const { data, total } = await listSignIns(
    { userId: params.get("userId"), audience: audience as "customers" | "staff" | null },
    page,
  );
  return paged(data, total, page);
});
