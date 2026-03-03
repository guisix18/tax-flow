import { prisma } from "@/lib/prisma";
import { RecordWithId, Result } from "@/types/common";
import { ServiceOrderInput } from "@/types/serviceOrder";

export async function createServiceOrder(
  data: ServiceOrderInput,
): Promise<Result<RecordWithId>> {
  const { amount, company_id, due_date, service_name } = data;

  const company = await prisma.company.findUnique({
    where: {
      id: company_id,
    },
  });

  if (!company) {
    return {
      success: false,
      error: { type: "COMPANY_NOT_FOUND_ERROR" },
      message: "Company not found",
    };
  }

  const alreadyExistingServiceOrder = await prisma.serviceOrder.findFirst({
    where: {
      company_id,
      service_name,
      due_date,
    },
  });

  if (alreadyExistingServiceOrder) {
    return {
      success: false,
      error: { type: "SERVICE_ORDER_ALREADY_EXISTS_ERROR" },
      message:
        "A service order with the same company, service name and due date already exists",
    };
  }

  const newServiceOrder = await prisma.serviceOrder.create({
    data: {
      amount,
      due_date,
      company_id,
      service_name,
    },
  });

  return {
    data: {
      id: newServiceOrder.id,
    },
    success: true,
  };
}
