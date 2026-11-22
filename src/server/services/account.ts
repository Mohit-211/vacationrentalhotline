import "server-only";
import { count, eq } from "drizzle-orm";
import type { z } from "zod";
import { isCountryCode, normalizePostalCode } from "@/lib/locations";
import { accountUpdateSchema, addressProblems } from "@/lib/schemas/account";
import { db } from "@/server/db";
import { properties, users } from "@/server/db/schema";
import { invalidFields, zodFields } from "@/server/http";

export type UserRow = typeof users.$inferSelect;

/** The profile fields the account page edits (the email changes through Better Auth). */
export type AccountChanges = Partial<
  Pick<UserRow, "name" | "email" | "phone" | "streetAddress" | "city" | "regionCode" | "countryCode" | "postalCode">
>;

export const serializeAccount = (row: UserRow, propertyCount = 0) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  emailVerified: row.emailVerified,
  phone: row.phone,
  streetAddress: row.streetAddress,
  city: row.city,
  regionCode: row.regionCode,
  countryCode: row.countryCode,
  postalCode: row.postalCode,
  /** Free cover set by staff: properties covered at no charge, and how many are used. Null: pay as usual. */
  freeCover: row.freeCoverLimit !== null ? { properties: row.freeCoverLimit, used: propertyCount } : null,
  createdAt: row.createdAt.toISOString(),
});
export type AccountJson = ReturnType<typeof serializeAccount>;

/** The account as the account page and dashboard read it. */
export async function accountJson(row: UserRow): Promise<AccountJson> {
  const [{ n }] = await db().select({ n: count() }).from(properties).where(eq(properties.userId, row.id));
  return serializeAccount(row, n);
}

export async function findUser(userId: string): Promise<UserRow | undefined> {
  const [row] = await db().select().from(users).where(eq(users.id, userId)).limit(1);
  return row;
}

export async function updateAccount(userId: string, changes: AccountChanges): Promise<UserRow> {
  if (Object.keys(changes).length > 0) {
    await db().update(users).set(changes).where(eq(users.id, userId));
  }
  return (await findUser(userId))!;
}

/**
 * The changes a profile update asks for: only the keys sent change, a field
 * sent blank or null is cleared (the name can't be), the address must hang
 * together once merged with what's stored, and postal codes are normalised.
 */
export function accountChangesFrom(
  user: UserRow,
  body: unknown,
  schema: z.ZodType<Record<string, unknown>> = accountUpdateSchema,
): AccountChanges {
  const result = schema.safeParse(body);
  if (!result.success) throw invalidFields(zodFields(result.error));

  const changes: AccountChanges = {};
  for (const key of Object.keys(body as object) as (keyof AccountChanges)[]) {
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
  return changes;
}
