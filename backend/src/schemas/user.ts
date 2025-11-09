import * as z from "zod";
import { languageCode } from "@schemas/translate"

export const userEmailParam = z.object({
  userEmail: z.email(),
});

export const translationIdParam = z.object({
  translationId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/i, "Invalid translation id"),
});

// the defaults for page and limit will be 1, 10 respectively if they're not passed as arguments
export const paginationQuery = z.object({
  page: z.preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().min(1)).default(1),
  limit: z.preprocess((v) => (v === undefined ? 10 : Number(v)), z.number().int().min(1).max(100)).default(10),
});


// filters out all null, undefined, and empty string values
export const searchPaginationQuery = z.object({
  from: languageCode.optional(),
  to: languageCode.optional(),
  sourceText: z.string().trim().min(1).max(100).optional(),
  translatedText: z.string().trim().min(1).max(100).optional(),
}).transform(obj =>
    Object.fromEntries(Object.entries(obj).filter(([_, v]) => v!= null && v !== "" && v !== undefined))
);