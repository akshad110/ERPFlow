import { z } from "zod";

export const challanStatusEnum = z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]);

export const challanItemFormSchema = z.object({
  productId: z
    .string()
    .min(1, "Select a product")
    .uuid("Select a product"),
  quantity: z
    .number({ error: "Enter quantity" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than 0"),
});

export const challanFormSchema = z
  .object({
    customerId: z
      .string()
      .min(1, "Select a customer")
      .uuid("Select a customer"),
    items: z
      .array(challanItemFormSchema)
      .min(1, "Add at least one product line"),
    status: z.enum(["DRAFT", "CONFIRMED"]),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      if (!item.productId) return;
      if (seen.has(item.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Product already added",
          path: ["items", index, "productId"],
        });
      }
      seen.add(item.productId);
    });
  });

export type ChallanFormValues = z.infer<typeof challanFormSchema>;
export type ChallanItemFormValues = z.infer<typeof challanItemFormSchema>;
