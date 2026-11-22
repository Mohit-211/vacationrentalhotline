import "server-only";
import { randomInt } from "node:crypto";
import { and, count, eq, inArray } from "drizzle-orm";
import { ADMIN_ROLE, CUSTOMER_ROLE } from "@/lib/permissions";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { roles, subscriptions, users } from "@/server/db/schema";
import { sendEmailInBackground } from "@/server/email/send";
import { accountCreatedMessage, passwordSetByStaffMessage } from "@/server/email/templates";
import { serverEnv } from "@/server/env";
import { HttpError, notFound } from "@/server/http";
import { stripe } from "@/server/stripe";

// Accounts staff create and manage: customers and staff alike are users;
// the role tells them apart.

type UserRow = typeof users.$inferSelect;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/**
 * A random password that is easy to read out and type: 16 characters from
 * an alphabet without look-alikes (0/O, 1/l/I), in groups of four, always
 * with letters and digits ("Kx7m-Pq2r-Tz9a-Wd4e").
 */
export function generatePassword(): string {
  for (;;) {
    const chars = Array.from({ length: 16 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    if (/[0-9]/.test(chars) && /[A-Za-z]/.test(chars)) return chars.match(/.{4}/g)!.join("-");
  }
}

/** Where a person signs in: the admin panel for staff, the site for customers. */
const signInUrl = (role: string) => {
  const env = serverEnv();
  return role === CUSTOMER_ROLE ? `${env.APP_URL}/login` : (env.ADMIN_APP_ORIGIN ?? `${env.APP_URL}/login`);
};

export async function assertRoleExists(role: string, { staff }: { staff: boolean }) {
  const [row] = await db().select().from(roles).where(eq(roles.name, role)).limit(1);
  if (!row || (staff && role === CUSTOMER_ROLE)) {
    throw new HttpError(400, "VALIDATION_FAILED", "Choose an existing staff role.", { role: ["Choose an existing staff role."] });
  }
}

async function assertEmailFree(email: string, exceptUserId?: string) {
  const [existing] = await db().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing && existing.id !== exceptUserId) {
    throw new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists.", {
      email: ["An account with this email already exists."],
    });
  }
}

export interface CreatedAccount {
  user: UserRow;
  /** Shown once to the staff member who created the account; never stored. */
  password: string;
}

/**
 * Creates a verified account with a generated password. The password is
 * returned once (for staff to copy) and, unless `sendEmail` is false, emailed
 * to the person.
 */
export async function createAccount(input: {
  name: string;
  email: string;
  role: string;
  phone?: string;
  sendEmail: boolean;
}): Promise<CreatedAccount> {
  await assertEmailFree(input.email);
  const context = await auth().$context;
  const password = generatePassword();
  const created = await context.internalAdapter.createUser(
    {
      name: input.name,
      email: input.email,
      emailVerified: true,
      role: input.role,
      phone: input.phone ?? null,
    },
    { method: "admin" },
  );
  await context.internalAdapter.linkAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: await context.password.hash(password),
  });
  if (input.sendEmail) {
    sendEmailInBackground(
      accountCreatedMessage(input.email, input.name, {
        email: input.email,
        password,
        signInUrl: signInUrl(input.role),
      }),
    );
  }
  const [user] = await db().select().from(users).where(eq(users.id, created.id)).limit(1);
  return { user: user!, password };
}

/** Sets a new generated password, signs the account out everywhere and returns the password once. */
export async function resetAccountPassword(user: UserRow, sendEmail: boolean): Promise<string> {
  const context = await auth().$context;
  const password = generatePassword();
  await context.internalAdapter.updatePassword(user.id, await context.password.hash(password));
  await context.internalAdapter.deleteUserSessions(user.id);
  if (sendEmail) {
    sendEmailInBackground(passwordSetByStaffMessage(user.email, user.name, { password, signInUrl: signInUrl(user.role) }));
  }
  return password;
}

export async function findUserById(userId: string): Promise<UserRow | undefined> {
  const [row] = await db().select().from(users).where(eq(users.id, userId)).limit(1);
  return row;
}

export async function findCustomer(userId: string): Promise<UserRow> {
  const user = await findUserById(userId);
  if (!user || user.role !== CUSTOMER_ROLE) throw notFound("Customer");
  return user;
}

export async function findStaff(userId: string): Promise<UserRow> {
  const user = await findUserById(userId);
  if (!user || user.role === CUSTOMER_ROLE) throw notFound("Staff member");
  return user;
}

/** Updates fields on a user; an email change is checked for clashes first. */
export async function updateUser(userId: string, changes: Partial<UserRow>): Promise<UserRow> {
  if (changes.email) await assertEmailFree(changes.email, userId);
  if (Object.keys(changes).length > 0) await db().update(users).set(changes).where(eq(users.id, userId));
  return (await findUserById(userId))!;
}

/**
 * Deletes a customer: first ends their live Stripe subscriptions (no refund),
 * then the account with its properties and notes. Payments stay on record.
 */
export async function deleteCustomer(user: UserRow): Promise<void> {
  const live = await db()
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), inArray(subscriptions.status, ["active", "trialing", "past_due", "incomplete"])));
  for (const subscription of live) {
    await stripe().subscriptions.cancel(subscription.stripeSubscriptionId, { prorate: false });
    await db().update(subscriptions).set({ status: "canceled", endedAt: new Date() }).where(eq(subscriptions.id, subscription.id));
  }
  const context = await auth().$context;
  await context.internalAdapter.deleteUser(user.id);
}

export async function countAdmins(): Promise<number> {
  const [row] = await db().select({ n: count() }).from(users).where(eq(users.role, ADMIN_ROLE));
  return row?.n ?? 0;
}

/** Deletes a staff account; never the last admin, and never your own. */
export async function deleteStaff(user: UserRow, actorId: string): Promise<void> {
  if (user.id === actorId) throw new HttpError(409, "CANNOT_DELETE_SELF", "You can't delete your own account.");
  if (user.role === ADMIN_ROLE && (await countAdmins()) <= 1) {
    throw new HttpError(409, "LAST_ADMIN", "The last admin can't be deleted.");
  }
  const context = await auth().$context;
  await context.internalAdapter.deleteUser(user.id);
}

/** Changes a staff member's role; never your own, and never the last admin's. Signs them out so it takes effect. */
export async function changeStaffRole(user: UserRow, role: string, actorId: string): Promise<void> {
  if (role === user.role) return;
  if (user.id === actorId) throw new HttpError(409, "CANNOT_CHANGE_OWN_ROLE", "You can't change your own role.");
  await assertRoleExists(role, { staff: true });
  if (user.role === ADMIN_ROLE && (await countAdmins()) <= 1) {
    throw new HttpError(409, "LAST_ADMIN", "The last admin can't be given another role.");
  }
  await db().update(users).set({ role }).where(eq(users.id, user.id));
  await (await auth().$context).internalAdapter.deleteUserSessions(user.id);
}
