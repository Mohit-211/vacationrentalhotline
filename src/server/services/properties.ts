import "server-only";
import { and, asc, desc, eq, gt, inArray, isNull, not, or, type SQL } from "drizzle-orm";
import { formatAddress } from "@/lib/locations";
import type { PropertyValues } from "@/lib/schemas/property";
import { db } from "@/server/db";
import { properties, propertyNotes } from "@/server/db/schema";
import { HttpError } from "@/server/http";

export type PropertyRow = typeof properties.$inferSelect;
export type NoteRow = typeof propertyNotes.$inferSelect;

/** Active while the paid period runs; inactive before the first payment and after it ends. */
export type PropertyStatus = "active" | "inactive";
export const PROPERTY_STATUSES = ["active", "inactive"] as const satisfies readonly PropertyStatus[];

/**
 * How long a renewing property stays active past its paid-through date
 * while Stripe charges (and, if needed, retries) the renewal.
 */
export const RENEWAL_GRACE_DAYS = 14;
const graceMs = RENEWAL_GRACE_DAYS * 24 * 60 * 60 * 1000;

export function propertyStatus(
  row: Pick<PropertyRow, "subscriptionEndsAt" | "autoRenews">,
  now = new Date(),
): PropertyStatus {
  const end = row.subscriptionEndsAt?.getTime();
  if (end === undefined) return "inactive";
  if (end > now.getTime()) return "active";
  return row.autoRenews && end + graceMs > now.getTime() ? "active" : "inactive";
}

export function serializeProperty(row: PropertyRow, now = new Date()) {
  return {
    id: row.id,
    ownerName: row.ownerName,
    ownerEmail: row.ownerEmail,
    ownerAltEmail: row.ownerAltEmail,
    ownerPhone: row.ownerPhone,
    ownerAltPhone: row.ownerAltPhone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    regionCode: row.regionCode,
    countryCode: row.countryCode,
    postalCode: row.postalCode,
    fullAddress: formatAddress(row),
    status: propertyStatus(row, now),
    /** The end of the period paid for. */
    subscriptionEndsAt: row.subscriptionEndsAt?.toISOString() ?? null,
    /** Renews automatically on subscriptionEndsAt; false once renewal is cancelled. */
    autoRenews: row.autoRenews,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
export type PropertyJson = ReturnType<typeof serializeProperty>;

export const serializeNote = (row: NoteRow) => ({
  id: row.id,
  body: row.body,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});
export type NoteJson = ReturnType<typeof serializeNote>;

/** The editable fields of a stored property, in the shape the input schema takes. */
export const editableFields = (row: PropertyRow) => ({
  ownerName: row.ownerName,
  ownerEmail: row.ownerEmail,
  ownerAltEmail: row.ownerAltEmail,
  ownerPhone: row.ownerPhone,
  ownerAltPhone: row.ownerAltPhone,
  addressLine1: row.addressLine1,
  addressLine2: row.addressLine2,
  city: row.city,
  regionCode: row.regionCode,
  countryCode: row.countryCode,
  postalCode: row.postalCode,
});

const toColumns = (values: PropertyValues) => ({
  ownerName: values.ownerName,
  ownerEmail: values.ownerEmail,
  ownerAltEmail: values.ownerAltEmail ?? null,
  ownerPhone: values.ownerPhone,
  ownerAltPhone: values.ownerAltPhone ?? null,
  addressLine1: values.addressLine1,
  addressLine2: values.addressLine2 ?? null,
  city: values.city,
  regionCode: values.regionCode,
  countryCode: values.countryCode,
  postalCode: values.postalCode,
});

/** The SQL form of propertyStatus. */
export function statusCondition(status: PropertyStatus, now = new Date()): SQL {
  const active = or(
    gt(properties.subscriptionEndsAt, now),
    and(eq(properties.autoRenews, true), gt(properties.subscriptionEndsAt, new Date(now.getTime() - graceMs))),
  )!;
  return status === "active" ? active : or(isNull(properties.subscriptionEndsAt), not(active))!;
}

/** A user's properties, newest first, optionally only active or inactive ones. */
export async function listUserProperties(userId: string, status?: PropertyStatus): Promise<PropertyJson[]> {
  const now = new Date();
  const rows = await db()
    .select()
    .from(properties)
    .where(and(eq(properties.userId, userId), status ? statusCondition(status, now) : undefined))
    .orderBy(desc(properties.createdAt), asc(properties.id));
  return rows.map((row) => serializeProperty(row, now));
}

/** One of the user's properties; undefined if it doesn't exist or belongs to someone else. */
export async function findUserProperty(userId: string, propertyId: string): Promise<PropertyRow | undefined> {
  const [row] = await db()
    .select()
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.userId, userId)))
    .limit(1);
  return row;
}

/** Creates the properties in one statement: all of them are saved, or none. */
export async function createUserProperties(userId: string, items: PropertyValues[]): Promise<PropertyJson[]> {
  const rows = items.map((values) => ({ id: crypto.randomUUID(), userId, ...toColumns(values) }));
  await db().insert(properties).values(rows);
  const saved = await db()
    .select()
    .from(properties)
    .where(inArray(
      properties.id,
      rows.map((row) => row.id),
    ));
  const byId = new Map(saved.map((row) => [row.id, row]));
  const now = new Date();
  return rows.map((row) => serializeProperty(byId.get(row.id)!, now));
}

export async function updateProperty(propertyId: string, values: PropertyValues): Promise<PropertyRow> {
  await db().update(properties).set(toColumns(values)).where(eq(properties.id, propertyId));
  const [row] = await db().select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  return row!;
}

/**
 * Deletes those of the given properties that belong to the user and aren't
 * covered; returns how many. A covered property must stop renewing and run
 * out first, so nothing is deleted while it's still being paid for.
 */
export async function deleteUserProperties(userId: string, propertyIds: string[]): Promise<number> {
  if (propertyIds.length === 0) return 0;
  const owned = and(eq(properties.userId, userId), inArray(properties.id, propertyIds));
  const [covered] = await db().select().from(properties).where(and(owned, statusCondition("active"))).limit(1);
  if (covered) {
    throw new HttpError(
      409,
      "PROPERTY_COVERED",
      `${formatAddress(covered)} is covered until ${covered.subscriptionEndsAt?.toISOString().slice(0, 10)}. Cancel its renewal; you can delete it once the cover ends.`,
    );
  }
  const [result] = await db().delete(properties).where(owned);
  return result.affectedRows;
}

// ---- Notes -------------------------------------------------------------------

/** A property's notes, oldest first. */
export async function listNotes(propertyId: string): Promise<NoteJson[]> {
  const rows = await db()
    .select()
    .from(propertyNotes)
    .where(eq(propertyNotes.propertyId, propertyId))
    .orderBy(asc(propertyNotes.createdAt), asc(propertyNotes.id));
  return rows.map(serializeNote);
}

export async function findNote(propertyId: string, noteId: string): Promise<NoteRow | undefined> {
  const [row] = await db()
    .select()
    .from(propertyNotes)
    .where(and(eq(propertyNotes.id, noteId), eq(propertyNotes.propertyId, propertyId)))
    .limit(1);
  return row;
}

export async function createNote(propertyId: string, authorId: string, body: string): Promise<NoteJson> {
  const id = crypto.randomUUID();
  await db().insert(propertyNotes).values({ id, propertyId, authorId, body });
  const [row] = await db().select().from(propertyNotes).where(eq(propertyNotes.id, id)).limit(1);
  return serializeNote(row!);
}

export async function updateNote(noteId: string, body: string): Promise<NoteJson> {
  await db().update(propertyNotes).set({ body }).where(eq(propertyNotes.id, noteId));
  const [row] = await db().select().from(propertyNotes).where(eq(propertyNotes.id, noteId)).limit(1);
  return serializeNote(row!);
}

export async function deleteNote(noteId: string): Promise<void> {
  await db().delete(propertyNotes).where(eq(propertyNotes.id, noteId));
}
