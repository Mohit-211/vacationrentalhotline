import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export type UserRow = typeof users.$inferSelect;

/** The profile fields the account page edits (the email changes through Better Auth). */
export type AccountChanges = Partial<
  Pick<UserRow, "name" | "phone" | "streetAddress" | "city" | "regionCode" | "countryCode" | "postalCode">
>;

export const serializeAccount = (row: UserRow) => ({
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
  createdAt: row.createdAt.toISOString(),
});
export type AccountJson = ReturnType<typeof serializeAccount>;

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
