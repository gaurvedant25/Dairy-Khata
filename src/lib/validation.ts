import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  defaultPricePerUnit: z.coerce.number().positive().optional().nullable(),
  dailyQuantity: z.coerce.number().nonnegative("Daily liters can't be negative").optional(),
  manualTrustRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
});

export const deliveryBatchSchema = z.object({
  date: z.string(),
  entries: z.array(
    z.object({
      customerId: z.string(),
      quantity: z.coerce.number().nonnegative(),
    })
  ),
});

export const paymentSchema = z.object({
  customerId: z.string(),
  amount: z.coerce.number().positive(),
  date: z.string(),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const AVAILABLE_PRODUCTS = ["Milk"] as const;
export type ProductName = (typeof AVAILABLE_PRODUCTS)[number];

export const oneTimeOrderSchema = z
  .object({
    existingCustomerId: z.string().min(1).optional().or(z.literal("")),
    customerName: z.string().trim().max(100).optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    product: z.enum(AVAILABLE_PRODUCTS).default("Milk"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    paid: z.coerce.boolean().optional(),
    date: z.string().optional(),
  })
  .refine(
    (v) => (v.existingCustomerId && v.existingCustomerId !== "") || (v.customerName && v.customerName.trim() !== ""),
    { message: "Pick a customer or enter a walk-in name", path: ["customerName"] }
  );

export const oneTimeOrderUpdateSchema = z.object({
  paid: z.coerce.boolean().optional(),
});

export const settingSchema = z.object({
  businessName: z.string().trim().min(1).max(100),
  defaultPricePerUnit: z.coerce.number().positive(),
  defaultCostPerUnit: z.coerce.number().positive(),
  reminderDayOfMonth: z.coerce.number().int().min(1).max(28),
});
