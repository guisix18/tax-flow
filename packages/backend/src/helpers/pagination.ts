import z from "zod";
import { PaginationParams } from "@/types/common";

export const paginationMetaSchema = z.object({
  page: z.number(),
  ipp: z.number(),
  total: z.number(),
  total_pages: z.number(),
});

export function buildPaginationArgs({ page, ipp }: PaginationParams) {
  return {
    skip: (page - 1) * ipp,
    take: ipp,
  };
}

export function buildPaginationMeta(
  total: number,
  { page, ipp }: PaginationParams,
) {
  return {
    page,
    ipp,
    total,
    total_pages: Math.ceil(total / ipp),
  };
}
