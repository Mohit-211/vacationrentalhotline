import { z } from "zod";
import {
  COUNTRY_CODES,
  findCountry,
  findRegion,
  isCountryCode,
  isValidPostalCode,
  normalizePostalCode,
} from "@/lib/locations";
import {
  blank,
  evenWithOtherErrors,
  optionalEmail,
  optionalPhone,
  optionalText,
  requiredEmail,
  requiredPhone,
  requiredText,
  type SameKeys,
} from "./fields";

// One property as the form and the API take it. The messages are the ones
// the property form has always shown.

export const propertyFieldsSchema = z.object({
  ownerName: requiredText(
    "Please input your Rental Property Owner Name!",
    50,
    "Rental Property Owner Name cannot exceed 50 characters.",
  ),
  ownerEmail: requiredEmail("Please input your Email 1!", "Please enter a valid Email!"),
  ownerAltEmail: optionalEmail("Please enter a valid Email!"),
  ownerPhone: requiredPhone("Phone number is required.", "Invalid phone number."),
  ownerAltPhone: optionalPhone("Invalid phone number."),
  addressLine1: requiredText(
    "Please input your Rental Property Address Line 1!",
    100,
    "Address Line 1 cannot exceed 100 characters.",
  ),
  addressLine2: optionalText(100, "Address Line 2 cannot exceed 100 characters."),
  city: requiredText("Please input your City!", 100, "City cannot exceed 100 characters."),
  countryCode: z.preprocess(blank, z.enum(COUNTRY_CODES, { error: "Please select your Country!" })),
  // Required, and checked against the country's list, by the rules below, so
  // the message can say "Province"; only listed codes (2 letters) get through.
  regionCode: z.preprocess(blank, z.string().optional()),
  postalCode: optionalText(10, "Please enter a valid Zip or Postal Code."),
});

type Draft = Partial<Record<keyof z.input<typeof propertyFieldsSchema>, unknown>> | null | undefined;

const regionLabel = (draft: Draft) => findCountry(draft?.countryCode as string)?.regionLabel ?? "State";
const postalLabel = (draft: Draft) => findCountry(draft?.countryCode as string)?.postalCodeLabel ?? "Zip Code";
const trimmed = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** The country-dependent rules: the state belongs to the country, and the postal code fits it. */
export const propertyInputSchema = propertyFieldsSchema
  .refine((draft: Draft) => {
    const region = trimmed(draft?.regionCode);
    if (!region) return false;
    return !isCountryCode(draft?.countryCode) || Boolean(findRegion(draft.countryCode, region));
  }, { path: ["regionCode"], ...evenWithOtherErrors, error: (issue) => `Please select your ${regionLabel(issue.input as Draft)}!` })
  .refine((draft: Draft) => Boolean(trimmed(draft?.postalCode)), {
    path: ["postalCode"],
    ...evenWithOtherErrors,
    error: (issue) => `Please input your ${postalLabel(issue.input as Draft)}!`,
  })
  .refine((draft: Draft) => {
    const postal = trimmed(draft?.postalCode);
    return !postal || !isCountryCode(draft?.countryCode) || isValidPostalCode(draft.countryCode, postal);
  }, {
    path: ["postalCode"],
    ...evenWithOtherErrors,
    error: (issue) =>
      (issue.input as Draft)?.countryCode === "CA"
        ? "Canadian Postal Code must look like A1A 1A1."
        : "US Zip Code must be 5 digits, or ZIP+4 such as 12345-6789.",
  })
  .transform((property) => ({
    ...property,
    // Both are present once the rules above pass.
    regionCode: property.regionCode ?? "",
    postalCode: normalizePostalCode(property.countryCode, property.postalCode ?? ""),
  }));

/** One property as the form and the API send it. Optional fields may be blank or null. */
export interface PropertyInput {
  ownerName: string;
  ownerEmail: string;
  ownerAltEmail?: string | null;
  ownerPhone: string;
  ownerAltPhone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  countryCode: string;
  regionCode: string;
  postalCode: string;
}
true satisfies SameKeys<PropertyInput, z.output<typeof propertyFieldsSchema>>;
/** The same after validation: trimmed, blanks removed, postal code normalised. */
export type PropertyValues = z.output<typeof propertyInputSchema>;

/** Creating up to 500 properties at once (the form, or a CSV import). */
export const createPropertiesSchema = z.object({
  properties: z
    .array(z.unknown())
    .min(1, "Add at least one property.")
    .max(500, "Import at most 500 properties at a time."),
});
