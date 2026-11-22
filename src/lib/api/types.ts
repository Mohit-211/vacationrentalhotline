// Shapes of the data exchanged with this app's API (src/app/api). Responses
// use the server's own serializer types and requests the shared schemas, so
// the two sides can't drift apart. These are type-only imports: no server
// code reaches the browser.

import type { NoteJson, PropertyJson } from "@/server/services/properties";

export type { NoteJson as Note, PropertyJson as Property, PropertyStatus } from "@/server/services/properties";
export type { AccountJson as Account } from "@/server/services/account";
export type { PropertyInput } from "@/lib/schemas/property";
export type { NoteInput } from "@/lib/schemas/note";
export type { AccountUpdate } from "@/lib/schemas/account";
export type { ContactMessageInput } from "@/lib/schemas/contact";

/** Every successful response: `{ data }`. */
export interface ApiResponse<T> {
  data: T;
}

/** Every failed response: `{ error }`, with problems by field for invalid input. */
export interface ApiErrorBody {
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export type PropertyWithNotes = PropertyJson & { notes: NoteJson[] };

// ---- Checkout -----------------------------------------------------------------

export type { Quote } from "@/lib/pricing";
export type { StartedCheckout } from "@/server/services/billing";
