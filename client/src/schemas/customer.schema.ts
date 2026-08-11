import { z } from "zod";

export const customerTypeEnum = z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]);
export const customerStatusEnum = z.enum(["LEAD", "ACTIVE", "INACTIVE"]);

const optionalText = z.string().trim().optional().or(z.literal(""));

export const customerFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  mobile: z.string().trim().min(10, "Mobile must be at least 10 digits"),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || z.string().email().safeParse(value).success,
      "Enter a valid email"
    ),
  businessName: optionalText,
  gstNumber: optionalText,
  customerType: customerTypeEnum,
  address: optionalText,
  status: customerStatusEnum,
  followUpDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Use YYYY-MM-DD"
    ),
  notes: optionalText,
});

export const followUpFormSchema = z.object({
  note: z.string().trim().min(1, "Note is required"),
  followUpDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Use YYYY-MM-DD"
    ),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
export type FollowUpFormValues = z.infer<typeof followUpFormSchema>;
