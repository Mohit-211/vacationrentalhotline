import { z } from "zod";
import { COUNTRY_CODES, findCountry, findRegion, isCountryCode, isValidPostalCode } from "@/lib/locations";
import { blank, optionalPhone, optionalText, requiredText } from "./fields";

// The account page's profile fields. Each one is optional in an update, and
// null (or blank) clears it; the name can't be cleared. The email address
// changes through Better Auth's verified change-email flow instead.

export const accountUpdateSchema = z
  .object({
    name: requiredText("Please input your name!", 150, "Name cannot exceed 150 characters.").optional(),
    phone: optionalPhone("Invalid phone number.").nullable(),
    streetAddress: optionalText(255, "Address cannot exceed 255 characters.").nullable(),
    city: optionalText(100, "City cannot exceed 100 characters.").nullable(),
    countryCode: z.preprocess(blank, z.enum(COUNTRY_CODES, { error: "Please select a country." }).optional()).nullable(),
    regionCode: optionalText(3, "Please select a state.").nullable(),
    postalCode: optionalText(10, "Please enter a valid zip code.").nullable(),
  })
  .strict();

export type AccountUpdate = z.input<typeof accountUpdateSchema>;

export interface AccountAddress {
  countryCode?: string | null;
  regionCode?: string | null;
  postalCode?: string | null;
}

/**
 * The cross-field rules, checked on the account as it will be saved (the
 * update merged over what's stored): the state belongs to the country, and
 * the postal code fits it. Returns the problems by field.
 */
export function addressProblems(address: AccountAddress): Record<string, string> {
  const problems: Record<string, string> = {};
  if (!isCountryCode(address.countryCode)) {
    if (address.regionCode) problems.regionCode = "Please select a country first.";
    return problems;
  }
  const country = findCountry(address.countryCode);
  if (address.regionCode && !findRegion(address.countryCode, address.regionCode)) {
    problems.regionCode = `Please select a ${country?.regionLabel.toLowerCase() ?? "state"}.`;
  }
  if (address.postalCode && !isValidPostalCode(address.countryCode, address.postalCode)) {
    problems.postalCode =
      address.countryCode === "CA"
        ? "Canadian Postal Code must look like A1A 1A1."
        : "US Zip Code must be 5 digits, or ZIP+4 such as 12345-6789.";
  }
  return problems;
}

