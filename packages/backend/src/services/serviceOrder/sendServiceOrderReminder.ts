import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { Result } from "@/types/common";

export async function sendServiceOrderReminder(
  id: number,
  userId: number,
): Promise<Result<void>> {
  const serviceOrder = await prisma.serviceOrder.findFirst({
    where: {
      id,
      company: { user_id: userId },
    },
    include: {
      company: { include: { user: true } },
    },
  });

  if (!serviceOrder) {
    return {
      success: false,
      error: { type: "SERVICE_ORDER_NOT_FOUND_ERROR" },
    };
  }

  if (serviceOrder.note_issued) {
    return {
      success: false,
      error: { type: "SERVICE_ORDER_ALREADY_ISSUED_ERROR" },
      message: "Nota já emitida — não há o que lembrar",
    };
  }

  const { company } = serviceOrder;
  const user = company.user;

  const amountBRL = (serviceOrder.amount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const due = serviceOrder.due_date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const subject = `Lembrete: emitir nota fiscal — ${serviceOrder.service_name}`;
  const text = [
    `Olá, ${user.name}!`,
    "",
    "Você tem uma ordem de serviço próxima do vencimento:",
    "",
    `• Serviço: ${serviceOrder.service_name}`,
    `• Empresa: ${company.name}`,
    `• Valor: ${amountBRL}`,
    `• Vencimento: ${due}`,
    "",
    "Emita a nota fiscal antes do vencimento para não acumular impostos e garantir o recebimento.",
    "",
    "— Tax Flow",
  ].join("\n");

  await sendMail({ to: user.email, subject, text });

  await prisma.serviceOrder.update({
    where: { id: serviceOrder.id },
    data: {
      notified: true,
      notification_count: { increment: 1 },
      last_notification_at: new Date(),
    },
  });

  return { success: true, data: undefined };
}
