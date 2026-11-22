import { eq } from "drizzle-orm";
import { adminProfileSchema } from "@/lib/schemas/admin";
import { db } from "@/server/db";
import { roles, users } from "@/server/db/schema";
import { handler, ok, readBody, requireStaff } from "@/server/http";

/**
 * GET /api/admin/me: the signed-in staff member, their role and what it
 * allows. 401 when signed out; 403 for a customer account.
 */
export const GET = handler(async (request: Request) => {
  const staff = await requireStaff(request);
  const [role] = await db().select().from(roles).where(eq(roles.name, staff.role)).limit(1);
  return ok({
    id: staff.user.id,
    name: staff.user.name,
    email: staff.user.email,
    role: staff.role,
    roleLabel: role?.label ?? staff.role,
    permissions: staff.permissions,
  });
});

/** PATCH /api/admin/me { name }: renames yourself. (Email: POST /api/auth/change-email.) */
export const PATCH = handler(async (request: Request) => {
  const staff = await requireStaff(request);
  const { name } = await readBody(request, adminProfileSchema);
  await db().update(users).set({ name }).where(eq(users.id, staff.user.id));
  return ok({ id: staff.user.id, name });
});
