import { z } from "zod";
import { requiredText, type SameKeys } from "./fields";

export const noteInputSchema = z.object({
  body: requiredText("Please enter a note", 5000, "A note can be at most 5,000 characters."),
});

export interface NoteInput {
  body: string;
}
true satisfies SameKeys<NoteInput, z.output<typeof noteInputSchema>>;
