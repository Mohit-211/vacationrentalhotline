import { z } from "zod";

// The one password rule, shared by the sign-up, reset and change-password
// forms and enforced again by the server.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, with at least one letter and one number.`;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`)
  .regex(/\p{L}/u, "Password must include at least one letter.")
  .regex(/[0-9]/, "Password must include at least one number.");
