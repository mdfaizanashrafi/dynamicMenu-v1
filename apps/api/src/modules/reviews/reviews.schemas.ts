import { z } from "zod";

export const submitReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
