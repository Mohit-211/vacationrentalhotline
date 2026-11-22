import { z } from "zod";
import { isEmail, isValidPhone } from "@/lib/validation";

// Field rules shared by the forms and the API, so both accept exactly the
// same values. Lengths match the database columns.

export const personNameSchema = z
  .string()
  .trim()
  .min(1, "Please enter a name.")
  .max(150, "Name must be at most 150 characters.");

export const emailAddressSchema = z
  .string()
  .trim()
  .max(255, "Email must be at most 255 characters.")
  .refine(isEmail, "Please enter a valid email address.")
  .transform((email) => email.toLowerCase());

/** An international number in E.164 form, as the phone input produces it. */
export const phoneNumberSchema = z
  .string()
  .trim()
  .max(20, "Please enter a valid phone number.")
  .refine(isValidPhone, "Please enter a valid phone number.");

/** Turns "" and null into undefined, for optional fields cleared in a form. */
export const blankToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;
