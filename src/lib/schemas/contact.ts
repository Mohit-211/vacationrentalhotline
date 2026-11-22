import { z } from "zod";
import { requiredEmail, requiredText, requiredUsOrCanadaPhone, type SameKeys } from "./fields";

// The home page's contact form. The messages are the ones it has always shown,
// apart from the phone's: it now takes US and Canadian numbers only.
export const contactMessageSchema = z.object({
  name: requiredText("Please input your name!", 150, "Name cannot exceed 150 characters."),
  email: requiredEmail("Please input your email!", "Please input your email!"),
  phone: requiredUsOrCanadaPhone("Please input your mobile number!", "Please enter a valid US or Canadian phone number."),
  message: requiredText("Please input your message!", 5000, "Message cannot exceed 5,000 characters."),
});

export interface ContactMessageInput {
  name: string;
  email: string;
  phone: string;
  message: string;
}
true satisfies SameKeys<ContactMessageInput, z.output<typeof contactMessageSchema>>;
