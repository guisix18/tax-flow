import { buildPaginationArgs, buildPaginationMeta } from "@/helpers/pagination";
import { prisma } from "@/lib/prisma";
import { PaginatedResult, PaginationParams, Result } from "@/types/common";
import { ServiceOrder } from "@/types/serviceOrder";

export async function getUpcomingServiceOrders(
  userId: number,
  daysAhead: number,
  pagination: PaginationParams,
): Promise<Result<PaginatedResult<ServiceOrder>>> {
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const where = {
    note_issued: false,
    due_date: { lte: cutoff },
    company: { user_id: userId },
  };

  const { skip, take } = buildPaginationArgs(pagination);

  const [rows, total] = await Promise.all([
    prisma.serviceOrder.findMany({
      where,
      orderBy: { due_date: "asc" },
      skip,
      take,
    }),
    prisma.serviceOrder.count({ where }),
  ]);

  return {
    success: true,
    data: {
      rows,
      pagination: buildPaginationMeta(total, pagination),
    },
  };
}
