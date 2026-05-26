import { prisma } from "@/lib/prisma";

const DEFAULT_DAYS_AHEAD = 3;

export async function getServiceOrdersForReminder() {
  const daysAhead = process.env.REMINDER_DAYS_AHEAD
    ? Number(process.env.REMINDER_DAYS_AHEAD)
    : DEFAULT_DAYS_AHEAD;

  const cutoff = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

  return prisma.serviceOrder.findMany({
    where: {
      note_issued: false,
      notified: false,
      due_date: { lte: cutoff },
    },
    select: {
      id: true,
      company: { select: { user_id: true } },
    },
  });
}
