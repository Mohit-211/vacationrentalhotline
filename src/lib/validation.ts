import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

// The email pattern antd's form validation used (@rc-component/async-validator),
// kept so the rebuilt forms accept and reject exactly the same addresses.
const EMAIL_PATTERN =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9 -퟿豈-﷏ﷰ-￯]+\.)+[a-zA-Z -퟿豈-﷏ﷰ-￯]{2,}))$/;

/** Same rule as antd's `type: "email"` check. */
export const isEmail = (value: string) => value.length <= 320 && EMAIL_PATTERN.test(value);

/**
 * Same rule as the old validators: libphonenumber-js says the number is valid.
 * Imported from libphonenumber-js itself (the library react-phone-number-input
 * wraps, with the same metadata) so the server can run it too.
 */
export const isValidPhone = (value: string) => Boolean(parsePhoneNumberFromString(value)?.isValid());

/** The countries the contact form takes phone numbers from. */
export const US_AND_CANADA: CountryCode[] = ["US", "CA"];

/** A valid US or Canadian number. Other +1 countries, such as Jamaica, don't count. */
export const isUsOrCanadaPhone = (value: string) => {
  const phone = parsePhoneNumberFromString(value);
  return Boolean(phone?.isValid() && phone.country && US_AND_CANADA.includes(phone.country));
};
