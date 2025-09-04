// Lightweight validation module in plain JS so it can be tested with Node's built-in test runner.
// Uses zod (already in dependencies) but avoids TS-only features.

import { z } from "zod";

export const pollOptionSchema = z
  .string()
  .transform((s) => (typeof s === "string" ? s.trim() : s))
  .min(1, "Option is required")
  .max(100, "Option is too long (max 100 chars)");

export const pollSchema = z
  .object({
    question: z
      .string()
      .transform((s) => (typeof s === "string" ? s.trim() : s))
      .min(1, "Question is required")
      .max(200, "Question is too long (max 200 chars)"),
    options: z
      .array(pollOptionSchema)
      .min(2, "Provide at least two options")
      .max(20, "Too many options (max 20)"),
  })
  .superRefine((val, ctx) => {
    const normalized = val.options.map((o) => o.toLowerCase());
    const set = new Set(normalized);
    if (set.size !== normalized.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Options must be unique",
        path: ["options"],
      });
    }
  });

export function validatePollInput(input) {
  const parsed = pollSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  return { success: true, data: parsed.data };
}


