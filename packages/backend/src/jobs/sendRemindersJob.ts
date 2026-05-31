import cron from "node-cron";
import { getServiceOrdersForReminder } from "@/services/serviceOrder/getServiceOrdersForReminder";
import { sendServiceOrderReminder } from "@/services/serviceOrder/sendServiceOrderReminder";

async function run() {
  const orders = await getServiceOrdersForReminder();

  if (orders.length === 0) return;

  for (const order of orders) {
    const result = await sendServiceOrderReminder(
      order.id,
      order.company.user_id,
    );

    if (!result.success) {
      console.error(
        `[sendRemindersJob] falha ao notificar ordem ${order.id}:`,
        result.error,
      );
    }
  }
}

export function registerSendRemindersJob() {
  // TEMPORÁRIO: a cada 5 minutos para teste em produção
  cron.schedule("*/5 * * * *", () => {
    run().catch((err) =>
      console.error("[sendRemindersJob] erro inesperado:", err),
    );
  });
}
