import { z } from "zod";
import { isEmail, isValidPhone } from "@/lib/validation";

// Building blocks for the shared request schemas. Text is trimmed, and blank
// text counts as missing, so "   " fails a required field and clears an
// optional one.

/** Trims strings; turns blank strings and null into undefined. */
export const blank = (value: unknown) =>
  typeof value === "string" ? value.trim() || undefined : (value ?? undefined);

export const requiredText = (requiredMessage: string, max: number, maxMessage: string) =>
  z.preprocess(blank, z.string({ error: requiredMessage }).max(max, maxMessage));

export const optionalText = (max: number, maxMessage: string) =>
  z.preprocess(blank, z.string().max(max, maxMessage).optional());

export const requiredEmail = (requiredMessage: string, invalidMessage: string) =>
  z.preprocess(
    blank,
    z.string({ error: requiredMessage }).max(255, invalidMessage).refine(isEmail, invalidMessage),
  );

export const optionalEmail = (invalidMessage: string) =>
  z.preprocess(blank, z.string().max(255, invalidMessage).refine(isEmail, invalidMessage).optional());

/** E.164, as the phone input produces it. */
export const requiredPhone = (requiredMessage: string, invalidMessage: string) =>
  z.preprocess(blank, z.string({ error: requiredMessage }).max(20, invalidMessage).refine(isValidPhone, invalidMessage));

export const optionalPhone = (invalidMessage: string) =>
  z.preprocess(blank, z.string().max(20, invalidMessage).refine(isValidPhone, invalidMessage).optional());

/** Fails to compile unless the two key sets are the same. */
export type SameKeys<A, B> = [Exclude<keyof A, keyof B>, Exclude<keyof B, keyof A>] extends [never, never] ? true : never;

/** Options for an object-level rule that must run even when other fields already have errors. */
export const evenWithOtherErrors = { when: () => true } as const;
