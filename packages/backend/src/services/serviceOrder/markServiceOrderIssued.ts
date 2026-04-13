import { prisma } from "@/lib/prisma";
import { Result } from "@/types/common";

export async function markServiceOrderIssued(
  id: number,
  userId: number,
): Promise<Result<void>> {
  const serviceOrder = await prisma.serviceOrder.findFirst({
    where: {
      id,
      company: { user_id: userId },
    },
  });

  if (!serviceOrder) {
    return {
      success: false,
      error: { type: "SERVICE_ORDER_NOT_FOUND_ERROR" },
    };
  }

  await prisma.serviceOrder.update({
    where: {
      id,
    },
    data: {
      note_issued: true,
    },
  });

  return {
    success: true,
    data: undefined,
  };
}
