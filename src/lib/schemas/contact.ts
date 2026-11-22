import { z } from "zod";
import { requiredEmail, requiredPhone, requiredText, type SameKeys } from "./fields";

// The home page's contact form. The messages are the ones it has always shown.
export const contactMessageSchema = z.object({
  name: requiredText("Please input your name!", 150, "Name cannot exceed 150 characters."),
  email: requiredEmail("Please input your email!", "Please input your email!"),
  phone: requiredPhone("Please input your mobile number!", "Invalid phone number."),
  message: requiredText("Please input your message!", 5000, "Message cannot exceed 5,000 characters."),
});

export interface ContactMessageInput {
  name: string;
  email: string;
  phone: string;
  message: string;
}
true satisfies SameKeys<ContactMessageInput, z.output<typeof contactMessageSchema>>;
