import { prisma } from "@/lib/prisma";
import { Result } from "@/types/common";
import { ServiceOrder, ServiceOrderFilters } from "@/types/serviceOrder";
import { Prisma } from "prisma/generated/client";

function buildWhereClause(
  filters: ServiceOrderFilters,
): Prisma.ServiceOrderWhereInput {
  const where: Prisma.ServiceOrderWhereInput = {};

  if (filters.company_id) {
    where.company_id = filters.company_id;
  }

  if (filters.service_name) {
    where.service_name = {
      contains: filters.service_name,
      mode: "insensitive",
    };
  }

  if (filters.start_date || filters.end_date) {
    where.due_date = {};

    if (filters.start_date) {
      where.due_date.gte = filters.start_date;
    }

    if (filters.end_date) {
      where.due_date.lte = filters.end_date;
    }
  }

  if (filters.status) {
    where.service_status = filters.status;
  }

  return where;
}

//adicionar paginação depois, por enquanto só filtro mesmo
export async function getServiceOrders(
  filters: ServiceOrderFilters,
): Promise<Result<ServiceOrder[]>> {
  const where = buildWhereClause(filters);

  console.log("Where clause construída:", where); // Log para verificar a cláusula WHERE

  const serviceOrders = await prisma.serviceOrder.findMany({
    where,
  });

  return {
    data: serviceOrders,
    success: true,
  };
}
