import { ServiceOrderFilters } from "@/types/serviceOrder";
import { Prisma } from "prisma/generated/client";

//Porcaria, refatorar depois
export function buildWhereClause(
  filters: ServiceOrderFilters,
  userId: number,
): Prisma.ServiceOrderWhereInput {
  const where: Prisma.ServiceOrderWhereInput = {
    company: { user_id: userId },
  };

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
