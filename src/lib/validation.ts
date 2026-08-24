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
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customers: z.array(
    z.object({
      customerId: z.string(),
      lines: z.array(
        z.object({
          product: z.string().trim().min(1).max(100),
          unit: z.string().trim().max(20),
          quantity: z.coerce.number().nonnegative(),
          pricePerUnit: z.coerce.number().nonnegative(),
          costPerUnit: z.coerce.number().nonnegative(),
        })
      ),
    })
  ),
});

export const paymentSchema = z.object({
  customerId: z.string(),
  amount: z.coerce.number().positive(),
  date: z.string(),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

// A walk-in line is either one of the user's saved products (by id) or a
// one-off custom item typed inline.
const orderItemSchema = z
  .object({
    product: z.enum(["UserProduct", "Custom"]),
    userProductId: z.string().min(1).optional().or(z.literal("")),
    customProductName: z.string().trim().max(100).optional().or(z.literal("")),
    quantity: z.coerce.number().nonnegative().optional(),
    customAmount: z.coerce.number().positive().optional(),
  })
  .refine(
    (v) => {
      if (v.product === "Custom") {
        return (
          v.customProductName !== undefined &&
          v.customProductName.trim() !== "" &&
          v.customAmount !== undefined &&
          v.customAmount > 0
        );
      }
      return v.userProductId !== undefined && v.userProductId !== "" && v.quantity !== undefined && v.quantity > 0;
    },
    {
      message: "Every item needs a valid quantity (or, for custom items, a name and amount)",
      path: ["quantity"],
    }
  );

export const customProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  pricePerUnit: z.coerce.number().nonnegative(),
});

export const oneTimeOrderSchema = z
  .object({
    existingCustomerId: z.string().min(1).optional().or(z.literal("")),
    customerName: z.string().trim().max(100).optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    items: z.array(orderItemSchema).min(1, "Add at least one item"),
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
  reminderDayOfMonth: z.coerce.number().int().min(1).max(28),
});
