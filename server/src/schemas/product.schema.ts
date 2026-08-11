import { z } from "zod";

export const stockMovementTypeEnum = z.enum(["IN", "OUT"]);

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  sku: z.string().trim().min(1, "SKU is required"),
  category: z.string().trim().min(1, "Category is required"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  currentStock: z.coerce.number().int().min(0).optional().default(0),
  minStockAlert: z.coerce.number().int().min(0).optional().default(0),
  warehouseLocation: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).optional(),
  sku: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  minStockAlert: z.coerce.number().int().min(0).optional(),
  warehouseLocation: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  lowStock: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (typeof value === "boolean") return value;
      return value === "true";
    }),
});

export const stockMovementSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  movementType: stockMovementTypeEnum,
  reason: z.string().trim().min(1, "Reason is required"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
