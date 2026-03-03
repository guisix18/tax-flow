import { paginationMetaSchema } from "@/helpers/pagination";
import z from "zod";

export const createCompanySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be at most 255 characters"),
  cnpj: z.string().optional(),
});

export const getCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  ipp: z.coerce.number().int().positive().max(100).default(20),
});

export const companyResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  cnpj: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date().nullable(),
});

export const companiesResponseSchema = z.object({
  rows: z.array(companyResponseSchema),
  pagination: paginationMetaSchema,
});
