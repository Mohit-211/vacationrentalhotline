import { handler, notFound, ok, readJson, requireUser } from "@/server/http";
import { accountChangesFrom, accountJson, findUser, updateAccount } from "@/server/services/account";

/** GET /api/account: the signed-in user's profile. */
export const GET = handler(async (request: Request) => {
  const user = await findUser((await requireUser(request)).id);
  if (!user) throw notFound("Account");
  return ok(await accountJson(user));
});

/**
 * PATCH /api/account: updates the profile fields sent. A field sent as null
 * or "" is cleared (except the name, which is required). The email address
 * changes through POST /api/auth/change-email, which verifies the new one.
 */
export const PATCH = handler(async (request: Request) => {
  const user = await findUser((await requireUser(request)).id);
  if (!user) throw notFound("Account");
  const changes = accountChangesFrom(user, await readJson(request));
  return ok(await accountJson(await updateAccount(user.id, changes)));
});
