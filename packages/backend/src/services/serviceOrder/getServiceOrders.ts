import { buildWhereClause } from "@/helpers/serviceOrders/buildWhereClause";
import { buildPaginationArgs, buildPaginationMeta } from "@/helpers/pagination";
import { prisma } from "@/lib/prisma";
import { PaginatedResult, PaginationParams, Result } from "@/types/common";
import { ServiceOrder, ServiceOrderFilters } from "@/types/serviceOrder";

export async function getServiceOrders(
  filters: ServiceOrderFilters,
  pagination: PaginationParams,
): Promise<Result<PaginatedResult<ServiceOrder>>> {
  const where = buildWhereClause(filters);
  const { skip, take } = buildPaginationArgs(pagination);

  const [serviceOrders, total] = await Promise.all([
    prisma.serviceOrder.findMany({ where, skip, take }),
    prisma.serviceOrder.count({ where }),
  ]);

  return {
    success: true,
    data: {
      rows: serviceOrders,
      pagination: buildPaginationMeta(total, pagination),
    },
  };
}
