import { z } from "zod";

export const customerTypeEnum = z.enum([
  "RETAIL",
  "WHOLESALE",
  "DISTRIBUTOR",
]);

export const customerStatusEnum = z.enum(["LEAD", "ACTIVE", "INACTIVE"]);

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  mobile: z.string().trim().min(10, "Mobile must be at least 10 digits"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .optional()
    .nullable()
    .or(z.literal("")),
  businessName: z.string().trim().optional().nullable().or(z.literal("")),
  gstNumber: z.string().trim().optional().nullable().or(z.literal("")),
  customerType: customerTypeEnum,
  address: z.string().trim().optional().nullable().or(z.literal("")),
  status: customerStatusEnum.optional().default("LEAD"),
  followUpDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "followUpDate must be YYYY-MM-DD")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z.string().trim().optional().nullable().or(z.literal("")),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: customerStatusEnum.optional(),
  customerType: customerTypeEnum.optional(),
});

export const createFollowUpSchema = z.object({
  note: z.string().trim().min(1, "Note is required"),
  followUpDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "followUpDate must be YYYY-MM-DD")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
