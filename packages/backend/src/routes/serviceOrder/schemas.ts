import z from "zod";

export const createServiceOrderSchema = z.object({
  service_name: z
    .string()
    .min(1, "Service name is required")
    .max(255, "Service name must be at most 255 characters"),

  amount: z.number().positive("Amount must be a positive number"),

  due_date: z.date().refine((date) => date > new Date(), {
    message: "Due date must be in the future",
  }),

  company_id: z
    .number()
    .int()
    .positive("Company ID must be a positive integer"),
});

export const getServiceOrdersFiltersSchema = z.object({
  company_id: z.coerce
    .number()
    .int()
    .positive("Company ID must be a positive integer")
    .optional(),

  service_name: z
    .string()
    .max(255, "Service name must be at most 255 characters")
    .optional(),

  start_date: z.date().optional(),

  end_date: z.date().optional(),

  status: z
    .enum(["PENDING", "IN_PROGRESS", "CANCELLED", "COMPLETED"])
    .optional(),
});
