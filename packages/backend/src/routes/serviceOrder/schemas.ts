import { validateFutureDate } from "@/helpers/serviceOrders/validateFutureDate";
import { paginationMetaSchema } from "@/helpers/pagination";
import z from "zod";

export const createServiceOrderSchema = z.object({
  service_name: z
    .string()
    .min(1, "Service name is required")
    .max(255, "Service name must be at most 255 characters"),

  amount: z
    .number()
    .positive("Amount must be a positive number")
    .refine((value) => value >= 100, {
      message: "Amount must be at least 100(1,00 in cents)",
    }),

  due_date: z.coerce.date().refine(validateFutureDate, {
    message: "Due date must be within the next year",
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

  start_date: z.coerce.date().optional(),

  end_date: z.coerce.date().optional(),

  status: z
    .enum(["PENDING", "IN_PROGRESS", "CANCELLED", "COMPLETED"])
    .optional(),

  page: z.coerce.number().int().positive().default(1),
  ipp: z.coerce.number().int().positive().max(100).default(20),
});

export const updateServiceOrderSchema = z.object({
  service_name: z
    .string()
    .min(1, "Service name is required")
    .max(255, "Service name must be at most 255 characters")
    .optional(),

  amount: z
    .number()
    .positive("Amount must be a positive number")
    .refine((value) => value >= 100, {
      message: "Amount must be at least 100(1,00 in cents)",
    })
    .optional(),

  due_date: z.coerce
    .date()
    .refine(validateFutureDate, {
      message: "Due date must be within the next year",
    })
    .optional(),
});

export const getServiceOrderByIdParamsSchema = z.object({
  id: z.coerce.number(),
});

export const getUpcomingServiceOrdersQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
  page: z.coerce.number().int().positive().default(1),
  ipp: z.coerce.number().int().positive().max(100).default(20),
});

export const serviceOrderListItemSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  service_name: z.string(),
  amount: z.number(),
  service_status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  created_at: z.date(),
  updated_at: z.date().nullable(),
  due_date: z.date(),
  last_notification_at: z.date().nullable(),
  notification_count: z.number(),
  note_issued: z.boolean(),
  notified: z.boolean(),
});

export const serviceOrdersResponseSchema = z.object({
  rows: z.array(serviceOrderListItemSchema),
  pagination: paginationMetaSchema,
});
