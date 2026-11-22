import { isCountryCode, normalizePostalCode } from "@/lib/locations";
import { accountUpdateSchema, addressProblems } from "@/lib/schemas/account";
import { handler, invalidFields, notFound, ok, readJson, requireUser, zodFields } from "@/server/http";
import { findUser, serializeAccount, updateAccount, type AccountChanges } from "@/server/services/account";

/** GET /api/account: the signed-in user's profile. */
export const GET = handler(async (request: Request) => {
  const user = await findUser((await requireUser(request)).id);
  if (!user) throw notFound("Account");
  return ok(serializeAccount(user));
});

/**
 * PATCH /api/account: updates the profile fields sent. A field sent as null
 * or "" is cleared (except the name, which is required). The email address
 * changes through POST /api/auth/change-email, which verifies the new one.
 */
export const PATCH = handler(async (request: Request) => {
  const user = await findUser((await requireUser(request)).id);
  if (!user) throw notFound("Account");

  const body = await readJson(request);
  const result = accountUpdateSchema.safeParse(body);
  if (!result.success) throw invalidFields(zodFields(result.error));

  // Only the keys sent change; blank values arrive as undefined and clear.
  const sent = Object.keys(body as object) as (keyof AccountChanges)[];
  const changes: AccountChanges = {};
  for (const key of sent) {
    (changes as Record<string, unknown>)[key] = result.data[key] ?? null;
  }

  const address = {
    countryCode: "countryCode" in changes ? changes.countryCode : user.countryCode,
    regionCode: "regionCode" in changes ? changes.regionCode : user.regionCode,
    postalCode: "postalCode" in changes ? changes.postalCode : user.postalCode,
  };
  const problems = addressProblems(address);
  if (Object.keys(problems).length > 0) {
    throw invalidFields(Object.fromEntries(Object.entries(problems).map(([field, message]) => [field, [message]])));
  }
  if (changes.postalCode && isCountryCode(address.countryCode)) {
    changes.postalCode = normalizePostalCode(address.countryCode, changes.postalCode);
  }

  return ok(serializeAccount(await updateAccount(user.id, changes)));
});
