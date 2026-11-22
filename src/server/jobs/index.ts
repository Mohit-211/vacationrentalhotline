import "server-only";
import { and, eq, gt, inArray, isNull, lt, lte } from "drizzle-orm";
import { formatAddress } from "@/lib/locations";
import { UNVERIFIED_ACCOUNT_LIFETIME_SECONDS } from "@/server/auth";
import { db } from "@/server/db";
import { properties, sessions, users, verifications } from "@/server/db/schema";
import { sendEmail } from "@/server/email/send";
import { coverEndedMessage, staffCoverEndedMessage } from "@/server/email/templates";
import { serverEnv } from "@/server/env";
import { statusCondition } from "@/server/services/properties";

// The scheduled jobs. Each is safe to run at any time and as often as you
// like: it only acts on what's due, and marks what it has done.

/** Cover that ended longer ago than this gets no notice (it predates the job). */
const NOTICE_WINDOW_DAYS = 60;

export interface JobReport {
  unverifiedAccountsRemoved: number;
  coverEndedNotices: number;
  expiredRowsRemoved: number;
}

export async function runScheduledJobs(): Promise<JobReport> {
  return {
    unverifiedAccountsRemoved: await removeUnverifiedAccounts(),
    coverEndedNotices: await sendCoverEndedNotices(),
    expiredRowsRemoved: await removeExpiredRows(),
  };
}

/**
 * Removes customer accounts whose email was never verified, 12 hours after
 * sign-up (when the verification link expires), so the address can sign up
 * again. Their sessions and sign-in records go with them.
 */
export async function removeUnverifiedAccounts(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - UNVERIFIED_ACCOUNT_LIFETIME_SECONDS * 1000);
  const [result] = await db()
    .delete(users)
    .where(and(eq(users.emailVerified, false), eq(users.role, "customer"), lt(users.createdAt, cutoff)));
  return result.affectedRows;
}

/**
 * Emails each customer whose cover has ended (not renewed, cancelled, or a
 * renewal that failed for good), with a copy to staff. One email per
 * customer per run, listing their properties; each property gets one notice.
 */
export async function sendCoverEndedNotices(now = new Date()): Promise<number> {
  const windowStart = new Date(now.getTime() - NOTICE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const due = await db()
    .select({ property: properties, user: users })
    .from(properties)
    .innerJoin(users, eq(properties.userId, users.id))
    .where(
      and(
        isNull(properties.expiryNoticeSentAt),
        lte(properties.subscriptionEndsAt, now),
        gt(properties.subscriptionEndsAt, windowStart),
        statusCondition("inactive", now),
      ),
    );

  const byUser = new Map<string, typeof due>();
  for (const row of due) byUser.set(row.user.id, [...(byUser.get(row.user.id) ?? []), row]);

  let sent = 0;
  for (const rows of byUser.values()) {
    // Claim the properties first, so a second process never sends the same notice.
    const ids = rows.map((row) => row.property.id);
    const [claimed] = await db()
      .update(properties)
      .set({ expiryNoticeSentAt: now })
      .where(and(inArray(properties.id, ids), isNull(properties.expiryNoticeSentAt)));
    if (claimed.affectedRows === 0) continue;

    const { user } = rows[0];
    const items = rows.map((row) => ({ label: formatAddress(row.property), endedAt: row.property.subscriptionEndsAt! }));
    try {
      await sendEmail(coverEndedMessage(user.email, user.name, items));
      await sendEmail(staffCoverEndedMessage(serverEnv().STAFF_EMAIL, user, items));
      sent += items.length;
    } catch (error) {
      // Let the next run try again.
      await db().update(properties).set({ expiryNoticeSentAt: null }).where(inArray(properties.id, ids));
      console.error(`[jobs] Cover-ended notice to ${user.email} failed`, error);
    }
  }
  return sent;
}

/** Deletes expired one-time tokens and sessions that are past use. */
export async function removeExpiredRows(now = new Date()): Promise<number> {
  const [tokens] = await db().delete(verifications).where(lt(verifications.expiresAt, now));
  const [expiredSessions] = await db().delete(sessions).where(lt(sessions.expiresAt, now));
  return tokens.affectedRows + expiredSessions.affectedRows;
}
