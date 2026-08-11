import { z } from "zod";

export const challanStatusEnum = z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]);

export const challanItemInputSchema = z.object({
  productId: z.string().uuid("Invalid productId"),
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid("Invalid customerId"),
  items: z
    .array(challanItemInputSchema)
    .min(1, "At least one product is required"),
  status: z.enum(["DRAFT", "CONFIRMED"]).optional().default("DRAFT"),
});

export const updateChallanSchema = z.object({
  customerId: z.string().uuid("Invalid customerId").optional(),
  items: z
    .array(challanItemInputSchema)
    .min(1, "At least one product is required")
    .optional(),
});

export const challanQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
  customerId: z.string().uuid().optional(),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
export type ChallanQueryInput = z.infer<typeof challanQuerySchema>;
export type ChallanItemInput = z.infer<typeof challanItemInputSchema>;
