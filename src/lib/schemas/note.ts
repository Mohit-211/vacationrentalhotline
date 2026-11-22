import { z } from "zod";
import { requiredText } from "./fields";

export const noteInputSchema = z.object({
  body: requiredText("Please enter a note", 5000, "A note can be at most 5,000 characters."),
});

export type NoteInput = z.input<typeof noteInputSchema>;
