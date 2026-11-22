import { z } from "zod";
import { PERMISSION_NAMES } from "@/lib/permissions";
import { accountUpdateSchema } from "./account";
import { emailAddressSchema, personNameSchema, phoneNumberSchema } from "./common";

// Request rules for the admin API (/api/admin).

/** Email the new password to the person (it is also returned once, for the admin to copy). */
const sendEmail = z.boolean().default(true);

export const customerCreateSchema = z
  .object({
    name: personNameSchema,
    email: emailAddressSchema,
    phone: phoneNumberSchema.optional(),
    sendEmail,
  })
  .strict();

/** The customer's profile fields, plus their email (staff change it directly, without verification). */
export const customerUpdateSchema = accountUpdateSchema.extend({ email: emailAddressSchema.optional() }).strict();

const roleName = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9-]{1,19}$/, "Use 2-20 lower-case letters, digits or hyphens, starting with a letter.");

export const staffCreateSchema = z
  .object({ name: personNameSchema, email: emailAddressSchema, role: roleName, sendEmail })
  .strict();

export const staffUpdateSchema = z
  .object({ name: personNameSchema.optional(), email: emailAddressSchema.optional(), role: roleName.optional() })
  .strict();

export const passwordResetSchema = z.object({ sendEmail }).strict();

const permissions = z.array(z.enum(PERMISSION_NAMES as [string, ...string[]])).max(PERMISSION_NAMES.length);

export const roleCreateSchema = z
  .object({ name: roleName, label: z.string().trim().min(1).max(60), permissions })
  .strict();

export const roleUpdateSchema = z
  .object({ label: z.string().trim().min(1).max(60).optional(), permissions: permissions.optional() })
  .strict();

export const freeCoverSchema = z
  .object({
    /** The most properties the customer may have, all covered at no charge. */
    properties: z.number().int("Use a whole number.").min(1, "Allow at least 1 property.").max(1000),
  })
  .strict();

export const adminProfileSchema = z.object({ name: personNameSchema }).strict();
