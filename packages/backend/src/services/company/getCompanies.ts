import { PaginatedResult, PaginationParams, Result } from "@/types/common";
import { Company } from "@/types/company";
import { prisma } from "../../lib/prisma";
import { buildPaginationArgs, buildPaginationMeta } from "@/helpers/pagination";

export async function getCompanies(
  pagination: PaginationParams,
  userId: number,
): Promise<Result<PaginatedResult<Company>>> {
  const { skip, take } = buildPaginationArgs(pagination);

  const [companies, total] = await Promise.all([
    prisma.company.findMany({ where: { user_id: userId }, skip, take }),
    prisma.company.count({ where: { user_id: userId } }),
  ]);

  return {
    success: true,
    data: {
      rows: companies,
      pagination: buildPaginationMeta(total, pagination),
    },
  };
}
