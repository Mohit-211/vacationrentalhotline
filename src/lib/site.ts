// The business's public contact details, used across the site and in messages.
// They're the same in every environment, so they live here rather than in
// .env: change them in this one place.

export const HOTLINE_PHONE = {
  /** For tel: links. */
  href: "tel:+18446468546",
  display: "(844) 646-8546",
  /** The memorable form, used in the pricing section. */
  vanity: "(844) 6-HOTLINE",
} as const;

export const CONTACT_EMAIL = "info@vacationrentalhotline.com";

export const POSTAL_ADDRESS = "1001 North Barfield Dr #98 Marco Island Florida 34145";
