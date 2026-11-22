// The countries the hotline serves, with their states, provinces and
// territories (ISO 3166-1 and 3166-2 codes). Built in rather than stored in
// the database: the list rarely changes, and the forms need no request to
// show it. The API serves the same list at GET /api/locations.

export const COUNTRY_CODES = ["CA", "US"] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

export interface Region {
  /** Subdivision code without the country prefix, e.g. "ON" for CA-ON. */
  code: string;
  name: string;
}

export interface Country {
  code: CountryCode;
  name: string;
  /** What the country calls its regions, for form labels. */
  regionLabel: string;
  /** What the country calls its postal code, for form labels. */
  postalCodeLabel: string;
  postalCodeExample: string;
  regions: Region[];
}

const region = (code: string, name: string): Region => ({ code, name });

export const COUNTRIES: readonly Country[] = [
  {
    code: "CA",
    name: "Canada",
    regionLabel: "Province",
    postalCodeLabel: "Postal Code",
    postalCodeExample: "A1A 1A1",
    regions: [
      region("AB", "Alberta"),
      region("BC", "British Columbia"),
      region("MB", "Manitoba"),
      region("NB", "New Brunswick"),
      region("NL", "Newfoundland and Labrador"),
      region("NT", "Northwest Territories"),
      region("NS", "Nova Scotia"),
      region("NU", "Nunavut"),
      region("ON", "Ontario"),
      region("PE", "Prince Edward Island"),
      region("QC", "Quebec"),
      region("SK", "Saskatchewan"),
      region("YT", "Yukon"),
    ],
  },
  {
    code: "US",
    name: "United States",
    regionLabel: "State",
    postalCodeLabel: "Zip Code",
    postalCodeExample: "12345",
    regions: [
      region("AL", "Alabama"),
      region("AK", "Alaska"),
      region("AS", "American Samoa"),
      region("AZ", "Arizona"),
      region("AR", "Arkansas"),
      region("CA", "California"),
      region("CO", "Colorado"),
      region("CT", "Connecticut"),
      region("DE", "Delaware"),
      region("DC", "District of Columbia"),
      region("FL", "Florida"),
      region("GA", "Georgia"),
      region("GU", "Guam"),
      region("HI", "Hawaii"),
      region("ID", "Idaho"),
      region("IL", "Illinois"),
      region("IN", "Indiana"),
      region("IA", "Iowa"),
      region("KS", "Kansas"),
      region("KY", "Kentucky"),
      region("LA", "Louisiana"),
      region("ME", "Maine"),
      region("MD", "Maryland"),
      region("MA", "Massachusetts"),
      region("MI", "Michigan"),
      region("MN", "Minnesota"),
      region("MS", "Mississippi"),
      region("MO", "Missouri"),
      region("MT", "Montana"),
      region("NE", "Nebraska"),
      region("NV", "Nevada"),
      region("NH", "New Hampshire"),
      region("NJ", "New Jersey"),
      region("NM", "New Mexico"),
      region("NY", "New York"),
      region("NC", "North Carolina"),
      region("ND", "North Dakota"),
      region("MP", "Northern Mariana Islands"),
      region("OH", "Ohio"),
      region("OK", "Oklahoma"),
      region("OR", "Oregon"),
      region("PA", "Pennsylvania"),
      region("PR", "Puerto Rico"),
      region("RI", "Rhode Island"),
      region("SC", "South Carolina"),
      region("SD", "South Dakota"),
      region("TN", "Tennessee"),
      region("TX", "Texas"),
      region("VI", "U.S. Virgin Islands"),
      region("UT", "Utah"),
      region("VT", "Vermont"),
      region("VA", "Virginia"),
      region("WA", "Washington"),
      region("WV", "West Virginia"),
      region("WI", "Wisconsin"),
      region("WY", "Wyoming"),
    ],
  },
];

export const isCountryCode = (value: unknown): value is CountryCode =>
  typeof value === "string" && (COUNTRY_CODES as readonly string[]).includes(value);

export const findCountry = (code: string | null | undefined): Country | undefined =>
  COUNTRIES.find((country) => country.code === code);

export const findRegion = (countryCode: string | null | undefined, regionCode: string | null | undefined) =>
  findCountry(countryCode)?.regions.find((r) => r.code === regionCode);

// US: ZIP (12345) or ZIP+4 (12345-6789). Canada: A1A 1A1, with or without
// the space; letters D, F, I, O, Q and U never appear, nor W or Z first.
const POSTAL_CODE_PATTERNS: Record<CountryCode, RegExp> = {
  US: /^\d{5}(-\d{4})?$/,
  CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
};

export const isValidPostalCode = (countryCode: CountryCode, value: string) =>
  POSTAL_CODE_PATTERNS[countryCode].test(value.trim());

/** Stores postal codes one way: Canadian ones upper-case with the space. */
export function normalizePostalCode(countryCode: CountryCode, value: string): string {
  const trimmed = value.trim();
  if (countryCode === "CA") {
    const compact = trimmed.replace(/\s+/g, "").toUpperCase();
    return `${compact.slice(0, 3)} ${compact.slice(3)}`;
  }
  return trimmed;
}

export interface AddressParts {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  regionCode?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
}

/** One-line address for lists: "12 Main St, Apt 4, Austin, TX 78701, United States". */
export function formatAddress(address: AddressParts): string {
  const regionAndPostal = [address.regionCode, address.postalCode].filter(Boolean).join(" ");
  return [
    address.addressLine1,
    address.addressLine2,
    address.city,
    regionAndPostal,
    findCountry(address.countryCode)?.name ?? address.countryCode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
