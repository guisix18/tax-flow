import { PaginatedResult, PaginationParams, Result } from "@/types/common";
import { Company } from "@/types/company";
import { prisma } from "../../lib/prisma";
import { buildPaginationArgs, buildPaginationMeta } from "@/helpers/pagination";

export async function getCompanies(
  pagination: PaginationParams,
): Promise<Result<PaginatedResult<Company>>> {
  const { skip, take } = buildPaginationArgs(pagination);

  const [companies, total] = await Promise.all([
    prisma.company.findMany({ skip, take }),
    prisma.company.count(),
  ]);

  return {
    success: true,
    data: {
      rows: companies,
      pagination: buildPaginationMeta(total, pagination),
    },
  };
}
