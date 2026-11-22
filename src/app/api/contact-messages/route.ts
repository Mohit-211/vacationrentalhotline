import { contactMessageSchema } from "@/lib/schemas/contact";
import { created, handler, readBody } from "@/server/http";
import { saveContactMessage } from "@/server/services/contact";

/** POST /api/contact-messages { name, email, phone, message }: the home page's contact form. */
export const POST = handler(async (request: Request) => {
  const message = await readBody(request, contactMessageSchema);
  return created(await saveContactMessage(message));
});
