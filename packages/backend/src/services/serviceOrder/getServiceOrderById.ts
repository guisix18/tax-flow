import { prisma } from "@/lib/prisma";
import { Result } from "@/types/common";
import { ServiceOrderByIdResponse } from "@/types/serviceOrder";

export async function getServiceOrderById(
  id: number,
): Promise<Result<ServiceOrderByIdResponse>> {
  const serviceOrder = await prisma.serviceOrder.findUnique({
    where: {
      id,
    },
    include: {
      company: true,
    },
  });

  if (!serviceOrder) {
    return {
      success: false,
      error: { type: "SERVICE_ORDER_NOT_FOUND_ERROR" },
    };
  }

  return {
    success: true,
    data: {
      ...serviceOrder,
      company: {
        company_name: serviceOrder.company.name,
        company_cnpj: serviceOrder.company.cnpj ?? null,
      },
    },
  };
}
