import { prisma } from "@/lib/prisma";
import { Result } from "@/types/common";
import { ServiceOrderInput } from "@/types/serviceOrder";

export async function updateServiceOrder(
  data: Partial<ServiceOrderInput>,
  id: number,
): Promise<Result<void>> {
  const serviceOrder = await prisma.serviceOrder.findUnique({
    where: {
      id,
    },
  });

  if (!serviceOrder) {
    return {
      success: false,
      error: { type: "SERVICE_ORDER_NOT_FOUND_ERROR" },
      message: "Service order not found",
    };
  }

  await prisma.serviceOrder.update({
    where: {
      id,
    },
    data: {
      amount: data.amount ?? serviceOrder.amount,
      due_date: data.due_date ?? serviceOrder.due_date,
      service_name: data.service_name ?? serviceOrder.service_name,
    },
  });

  return {
    data: undefined,
    success: true,
  };
}
