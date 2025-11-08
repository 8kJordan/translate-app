import * as z from "zod";

export const userEmailParam = z.object({
  userEmail: z.email(),
});

export const translationIdParam = z.object({
  translationId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/i, "Invalid translation id"),
});

export const paginationQuery = z.object({
  page: z.preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().min(1)).default(1),
  limit: z.preprocess((v) => (v === undefined ? 10 : Number(v)), z.number().int().min(1).max(100)).default(10),
});

