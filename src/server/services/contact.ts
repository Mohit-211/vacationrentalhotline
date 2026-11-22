import "server-only";
import { db } from "@/server/db";
import { contactMessages } from "@/server/db/schema";

export interface NewContactMessage {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function saveContactMessage(input: NewContactMessage): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  await db()
    .insert(contactMessages)
    .values({ id, name: input.name, email: input.email, phone: input.phone ?? null, message: input.message });
  return { id };
}
