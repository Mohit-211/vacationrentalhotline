// What hotline cover costs: per property, per year. Checkout charges these
// amounts and the home page's pricing section shows them, so changing them
// here changes both. Stripe renews each property at the price it was bought at.

export const PRICING = {
  currency: "usd",
  /** One property bought on its own. */
  singlePropertyCents: 25_000,
  /** Each property, when 2 up to `maxPropertiesOnline` are bought together. */
  multiPropertyCents: 20_000,
  /** More than this in one checkout: the customer contacts us instead. */
  maxPropertiesOnline: 5,
} as const;

export const HOTLINE_PHONE = { display: "(844) 6-HOTLINE", href: "tel:+18446468546" } as const;

export interface Quote {
  propertyCount: number;
  /** Per property, per year. */
  unitAmountCents: number;
  totalCents: number;
  currency: typeof PRICING.currency;
}

/** The yearly price of covering `count` properties in one checkout, or null if that's more than we sell online. */
export function quoteFor(count: number): Quote | null {
  if (!Number.isInteger(count) || count < 1 || count > PRICING.maxPropertiesOnline) return null;
  const unitAmountCents = count === 1 ? PRICING.singlePropertyCents : PRICING.multiPropertyCents;
  return { propertyCount: count, unitAmountCents, totalCents: unitAmountCents * count, currency: PRICING.currency };
}

/** "$250", or "$250.50" when there are cents. */
export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
