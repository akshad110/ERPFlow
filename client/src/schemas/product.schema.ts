import { z } from "zod";

export const stockMovementTypeEnum = z.enum(["IN", "OUT"]);

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  sku: z.string().trim().min(1, "SKU is required"),
  category: z.string().trim().min(1, "Category is required"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  currentStock: z.number().int().min(0, "Stock cannot be negative"),
  minStockAlert: z.number().int().min(0, "Alert cannot be negative"),
  warehouseLocation: z.string().trim().optional().or(z.literal("")),
});

export const productEditSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  sku: z.string().trim().min(1, "SKU is required"),
  category: z.string().trim().min(1, "Category is required"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  minStockAlert: z.number().int().min(0, "Alert cannot be negative"),
  warehouseLocation: z.string().trim().optional().or(z.literal("")),
});

export const stockAdjustSchema = z.object({
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  movementType: stockMovementTypeEnum,
  reason: z.string().trim().min(1, "Reason is required"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductEditValues = z.infer<typeof productEditSchema>;
export type StockAdjustValues = z.infer<typeof stockAdjustSchema>;
