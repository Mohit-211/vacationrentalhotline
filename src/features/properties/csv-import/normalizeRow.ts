import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { PropertyInput } from "@/lib/api/types";
import { COUNTRIES, type CountryCode } from "@/lib/locations";

// Spreadsheets spell places and numbers many ways; turn the common ones into
// what the API takes. Anything unrecognised is sent as it is, and the API
// says which row and field is wrong.

const simplify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const COUNTRY_ALIASES: Record<string, CountryCode> = {
  us: "US",
  usa: "US",
  unitedstates: "US",
  unitedstatesofamerica: "US",
  america: "US",
  ca: "CA",
  can: "CA",
  canada: "CA",
};

/** "United States", "USA", "U.S." → "US"; "Canada" → "CA". */
export function matchCountry(value: string): string {
  return COUNTRY_ALIASES[simplify(value)] ?? value.trim();
}

/** "Texas" or "tx" → "TX", within the given country. */
export function matchRegion(countryCode: string, value: string): string {
  const country = COUNTRIES.find((c) => c.code === countryCode);
  const wanted = simplify(value);
  const region = country?.regions.find((r) => simplify(r.code) === wanted || simplify(r.name) === wanted);
  return region?.code ?? value.trim();
}

/** "(512) 555-0111" → "+15125550111", reading local numbers as the property's country. */
export function matchPhone(countryCode: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const defaultCountry = countryCode === "CA" || countryCode === "US" ? countryCode : "US";
  const phone = parsePhoneNumberFromString(trimmed, defaultCountry);
  return phone?.isValid() ? phone.number : trimmed;
}

/** One mapped CSV row, ready to send. */
export function normalizeRow(row: Record<keyof PropertyInput, string>): PropertyInput {
  const countryCode = matchCountry(row.countryCode ?? "");
  return {
    ...row,
    countryCode,
    regionCode: matchRegion(countryCode, row.regionCode ?? ""),
    ownerPhone: matchPhone(countryCode, row.ownerPhone ?? ""),
    ownerAltPhone: matchPhone(countryCode, row.ownerAltPhone ?? ""),
  };
}
