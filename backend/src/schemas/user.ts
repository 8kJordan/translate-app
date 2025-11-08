import * as z from "zod";

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

